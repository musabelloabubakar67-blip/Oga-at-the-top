import { PEOPLE, PERSON_BY_ID } from '../content/people';
import { CFG, monthOf, termTurnOf } from './config';
import { addOwed, shiftPoints } from './ledger';
import { rand } from './rng';
import type { BlocId, Cond, DebtId, Favour, Fx, FundId, GameState, Nation, Pressures, SectorId, ZoneId } from './types';

// The projected margin lives in election.ts, which reads this module; it registers itself here.
let outlookOf: (s: GameState) => number = () => 0;
export function registerOutlook(fn: (s: GameState) => number): void { outlookOf = fn; }
let benchOf: (s: GameState) => Record<string, number> = () => ({});
/** The Supreme Court registers how it reads, to keep the imports one-way. */
export function registerBench(fn: (s: GameState) => Record<string, number>): void { benchOf = fn; }

export const ZONES: ZoneId[] = ['NW', 'NE', 'NC', 'SW', 'SE', 'SS'];
export const BLOCS: BlocId[] = ['villa', 'party', 'street', 'establishment', 'press'];

export const ZONE_WEIGHT: Record<ZoneId, number> = {
  NW: 0.24, SW: 0.19, NC: 0.165, SS: 0.154, NE: 0.134, SE: 0.117,
};

export const ZONE_NAME: Record<ZoneId, string> = {
  NW: 'North West', NE: 'North East', NC: 'North Central',
  SW: 'South West', SE: 'South East', SS: 'South South',
};

export const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

const NATION_RANGE: Record<keyof Nation, [number, number]> = {
  inflation: [3, 80], petrolPrice: [300, 5000], fiscalSpace: [-5, 15], debt: [20, 130],
  security: [0, 100], power: [0, 100], capacity: [0, 100], integrity: [0, 100], jobs: [0, 100],
};

export function petrolShock(s: GameState): number {
  return (s.nation.petrolPrice - s.petrolRef) / s.petrolRef;
}

export function hardship(s: GameState): number {
  const h = CFG.hardship;
  const raw = clamp(
    h.base + (s.nation.inflation - 12) * h.inflation + petrolShock(s) * h.shock + (45 - s.nation.power) * h.power
      + (40 - s.nation.jobs) * h.jobs,
    0, 100,
  );
  // Getting from bad to bearable is felt sharply. Getting from bearable to good, less so.
  return raw >= 45 ? raw : 45 - (45 - raw) * 0.6;
}

export function approval(s: GameState): number {
  return ZONES.reduce((a, z) => a + s.zones[z].approval * ZONE_WEIGHT[z], 0) /
    ZONES.reduce((a, z) => a + ZONE_WEIGHT[z], 0);
}

/** Security in a zone is the absence of the threat in its theatre. */
export function zoneSecurity(s: GameState, z: ZoneId): number {
  return clamp(100 - s.theatres[z], 0, 100);
}

/** nation.security is the weighted picture across the six theatres. */
export function syncSecurity(s: GameState): void {
  s.nation.security = clamp(ZONES.reduce((a, z) => a + zoneSecurity(s, z) * ZONE_WEIGHT[z], 0) / ZONES.reduce((a, z) => a + ZONE_WEIGHT[z], 0), 0, 100);
}

export function shiftThreat(s: GameState, z: ZoneId, d: number): void {
  s.theatres[z] = clamp(s.theatres[z] + d, 3, 97);
}

/** Share of the party's convention delegates who will vote for the President, 0-100. */
export function delegates(s: GameState): number {
  let mine = 0;
  let all = 0;
  for (const p of PEOPLE) {
    if (p.group === 'minister') continue;
    all += p.clout;
    if (s.people[p.id]?.gone) continue;
    // A governor or senator who is with you brings their delegates. So does one who owes you.
    const owes = s.favours.some((f) => f.who === p.id && f.dir === 'owed');
    if (standing(s, p.id) >= 50 || owes) mine += p.clout;
    else if (standing(s, p.id) >= 40) mine += p.clout * 0.4;
  }
  // A popular President finds that delegates will defy their governors.
  return clamp((all ? (mine / all) * 100 : 50) * 0.65 + s.blocs.party * 0.35 + Math.max(0, approval(s) - 50) * 1.5, 0, 100);
}

// ---------------------------------------------------------------- favours

export function favoursOwed(s: GameState, who?: string): Favour[] {
  return s.favours.filter((f) => f.dir === 'owed' && (!who || f.who === who));
}
export function favoursOwing(s: GameState, who?: string): Favour[] {
  return s.favours.filter((f) => f.dir === 'owing' && (!who || f.who === who));
}
const size = (list: Favour[]) => list.reduce((a, f) => a + f.size, 0);

export function addFavour(s: GameState, who: string, dir: 'owed' | 'owing', n: number, why: string): void {
  const id = (s.counters.favourSeq = (s.counters.favourSeq ?? 0) + 1);
  s.favours.push({ id, who, dir, size: clamp(Math.round(n), 1, 3), why, turn: s.turn });
}

/** How a person behaves today: someone being leaned on complies whatever they feel. */
export function standing(s: GameState, id: string): number {
  const p = s.people[id];
  if (!p) return 50;
  if (p.gone) return 0;
  return p.compliantUntil && p.compliantUntil > s.turn ? Math.max(p.rel, 72) : p.rel;
}

export function groupStanding(s: GameState, group: 'governor' | 'senator' | 'minister'): number {
  let sum = 0;
  let w = 0;
  for (const p of PEOPLE) {
    if (p.group !== group) continue;
    const c = s.people[p.id]?.clout ?? p.clout;
    sum += standing(s, p.id) * c;
    w += c;
  }
  return w ? sum / w : 50;
}

/** Whether a bill passes: the party's mood and, above all, your own senators. */
export function senate(s: GameState): number {
  return s.blocs.party * 0.4 + groupStanding(s, 'senator') * 0.6;
}

export function getVar(s: GameState, path: string): number {
  const p = path.split('.');
  switch (p[0]) {
    case 'nation': return s.nation[p[1] as keyof Nation] ?? 0;
    case 'pressure': return s.pressures[p[1] as keyof Pressures] ?? 0;
    case 'bloc': return s.blocs[p[1] as BlocId] ?? 0;
    case 'zone': {
      const z = s.zones[p[1] as ZoneId];
      if (!z) return 0;
      return p[2] === 'security' ? zoneSecurity(s, p[1] as ZoneId) : z.approval;
    }
    case 'approval': return approval(s);
    case 'hardship': return hardship(s);
    case 'pc': return s.pc;
    case 'purse': return s.purse;
    case 'turn': return s.turn;
    case 'termTurn': return termTurnOf(s.turn);
    case 'exposure':
      if (p[1] === 'kept') return s.purseTaken.personal;
      // Money taken for yourself, which is what an asset declaration would show.
      if (p[1] === 'personal') return s.exposures.filter((e) => e.kind === 'personal').reduce((a, e) => a + e.amount, 0) + s.purse;
      if (p[1] === 'political') return s.exposures.filter((e) => e.kind === 'political').reduce((a, e) => a + e.amount, 0);
      return p[1] === 'total' ? s.exposures.reduce((a, e) => a + e.amount, 0) : s.exposures.length;
    case 'rel': return s.chars[p[1]]?.rel ?? 0;
    case 'leverage': return s.exposures.filter((x) => x.witnesses.includes(p[1])).length;
    case 'char': return (s.chars[p[1]] as unknown as Record<string, number>)?.[p[2]] ?? 0;
    case 'count': return s.fired[p.slice(1).join('.')]?.length ?? 0;
    case 'counter': return s.counters[p.slice(1).join('.')] ?? 0;
    case 'campaign': return s.campaign.chest;
    case 'agenda': return s.agenda.done.includes(p[1]) ? 1 : 0;
    case 'senate': return senate(s);
    case 'person': return standing(s, p[1]);
    case 'rival': return s.opposition[p[1]] ?? 0;
    case 'tracks': return s.agenda.done.filter((id) => id.startsWith(p[1])).length;
    case 'ordered': return s.counters[`order.${p[1]}`] !== undefined ? 1 : 0;
    // Done or ordered by this President, not inherited from the last one.
    case 'mine': return s.counters[`done.${p[1]}`] !== undefined || (s.counters[`order.${p[1]}`] ?? -1) >= 0 ? 1 : 0;
    case 'bets': return p[1] === 'won' ? s.ventures.won.length : p[1] === 'lost' ? s.ventures.lost.length : s.ventures.active.length;
    case 'venture': return s.ventures.won.includes(p[1]) ? 1 : s.ventures.lost.includes(p[1]) ? -1 : 0;
    case 'bonus': return s.counters[path] ?? 0;
    case 'drift': case 'sec': return s.counters[path] ?? 0;
    case 'debt': return p[1] === 'arrears' ? s.debts.gas + s.debts.contractors + s.debts.pensions : s.debts[p[1] as DebtId] ?? 0;
    case 'fund': return p[1] === 'total' ? s.funds.abroad + s.funds.buffer + s.funds.infra + s.funds.growth : s.funds[p[1] as FundId] ?? 0;
    case 'oil': return p[1] === 'gap' ? s.oil.price - s.budget.benchmark : p[1] === 'output' ? s.oil.output : s.oil.price;
    case 'budget': return s.budget.alloc[p[1] as SectorId] ?? 0;
    case 'tycoon': return s.tycoons[p[1]]?.rel ?? 50;
    case 'theatre': return s.theatres[p[1] as ZoneId] ?? 50;
    case 'favour': return size(favoursOwed(s, p[1]));
    case 'owing': return size(favoursOwing(s, p[1]));
    case 'favours': return favoursOwed(s).length;
    case 'debts': return favoursOwing(s).length;
    case 'active': return s.agenda.active.some((a) => a.id === p[1]) || s.ventures.active.some((a) => a.id === p[1]) ? 1 : 0;
    case 'focus': return s.focus === p[1] ? 1 : 0;
    case 'story': return s.stories.find((x) => x.id === p[1])?.stage ?? 0;
    case 'gone': return s.people[p[1]]?.gone ? 1 : 0;
    case 'comp': return s.people[p[1]]?.competence ?? PERSON_BY_ID[p[1]]?.competence ?? 3;
    case 'govs': return PEOPLE.filter((x) => x.group === 'governor' && standing(s, x.id) >= 58).length;
    case 'delegates': return delegates(s);
    case 'margin': return s.election?.margin ?? 0;
    // Where a re-election would stand today, as the desk's outlook reads it.
    case 'outlook': return outlookOf(s);
    case 'bench': return benchOf(s)[p[1]] ?? 0;
    case 'inst': {
      const i = (s.institutions ?? []).find((x) => x.id === p[1]);
      if (!i) return -1;
      if (p[2] === 'honest') return i.head.integrity >= 3 && !(i.head.patron !== 'president' && i.head.loyalty <= 3) ? 1 : 0;
      return s.turn - (i.founded ?? i.since);
    }
    case 'grieve': return (s.wronged ?? []).filter((w) => w.who === p[1] && w.until > s.turn).length;
    case 'wronged': return (s.wronged ?? []).filter((w) => w.until > s.turn).length;
    case 'fx': {
      const f = s.fx;
      if (!f) return 0;
      if (p[1] === 'premium') return Math.round((f.parallel / f.rate - 1) * 100);
      if (p[1] === 'reserves') return f.reserves;
      if (p[1] === 'peg') return f.stance === 'peg' ? 1 : 0;
      if (p[1] === 'float') return f.stance === 'float' ? 1 : 0;
      if (p[1] === 'fall') return Math.round(((f.rate / (f.hist[0] ?? f.base)) - 1) * 100);
      return f.rate;
    }
    case 'era': return s.era;
    case 'vp': return p[1] === 'rel' ? (s.vp?.rel ?? 50) : p[1] === 'ambition' ? (s.vp?.ambition ?? 0) : p[1] === 'heir' ? (s.flags['succession.backed'] === 'vp' ? 1 : 0) : s.vp ? 1 : 0;
    case 'pred': if (p[1] === 'rel') return s.predecessor?.rel ?? 50;
      if (p[1] === 'active') return s.predecessor && !s.flags['pred.gone'] ? 1 : 0;
      return p[1] === 'same' ? (s.predecessor?.sameParty ? 1 : 0) : p[1] === 'kept' ? (s.predecessor?.kept ?? 0) : s.predecessor ? 1 : 0;
    case 'granted': return (s.people[p[1]]?.granted || s.tycoons[p[1]]?.granted) ? 1 : 0;
    default: return 0;
  }
}

function cmp(a: number, op: string, b: number): boolean {
  switch (op) {
    case '<': return a < b;
    case '<=': return a <= b;
    case '>': return a > b;
    case '>=': return a >= b;
    case '==': return a === b;
    case '!=': return a !== b;
    default: return false;
  }
}

export function test(s: GameState, c: Cond | undefined): boolean {
  if (!c) return true;
  if ('all' in c) return c.all.every((x) => test(s, x));
  if ('any' in c) return c.any.some((x) => test(s, x));
  if ('not' in c) return !test(s, c.not);
  if ('v' in c) return cmp(getVar(s, c.v[0]), c.v[1], c.v[2]);
  if ('flag' in c) return c.is === undefined ? !!s.flags[c.flag] : s.flags[c.flag] === c.is;
  if ('turn' in c) return s.turn >= c.turn[0] && (c.turn[1] === undefined || s.turn <= c.turn[1]);
  if ('termTurn' in c) {
    const t = termTurnOf(s.turn);
    return t >= c.termTurn[0] && (c.termTurn[1] === undefined || t <= c.termTurn[1]);
  }
  if ('term' in c) return s.term === c.term;
  if ('month' in c) return c.month.includes(monthOf(s.turn));
  if ('chose' in c) return s.choices[c.chose[0]] === c.chose[1];
  if ('fired' in c) return (s.fired[c.fired]?.length ?? 0) > 0;
  if ('never' in c) return (s.fired[c.never]?.length ?? 0) === 0;
  return false;
}

/** Applies one effect. Records the realised delta in `touches` when given. */
export function applyFx(s: GameState, fx: Fx, touches?: Record<string, number>): void {
  const [target, base, spread] = fx;
  const delta = spread ? base + (rand(s) * 2 - 1) * spread : base;
  const p = target.split('.');
  const note = () => { if (touches) touches[target] = (touches[target] ?? 0) + delta; };
  switch (p[0]) {
    case 'nation': {
      const k = p[1] as keyof Nation;
      const [lo, hi] = NATION_RANGE[k];
      // Fragile to functional is achievable. Functional to strong is slow.
      const index = k === 'security' || k === 'power' || k === 'capacity' || k === 'integrity' || k === 'jobs';
      const gain = index && delta > 0 ? delta * clamp((85 - s.nation[k]) / 50, 0.2, 1) : delta;
      if (k === 'debt') {
        // Points of debt service land on a named creditor.
        shiftPoints(s, delta);
        if (touches) touches[target] = (touches[target] ?? 0) + delta;
        return;
      }
      if (k === 'security') {
        // A national effect is felt in every theatre.
        for (const z of ZONES) shiftThreat(s, z, -gain);
        syncSecurity(s);
        if (touches) touches[target] = (touches[target] ?? 0) + gain;
        return;
      }
      s.nation[k] = clamp(s.nation[k] + gain, lo, hi);
      if (touches) touches[target] = (touches[target] ?? 0) + gain;
      return;
    }
    case 'pressure': {
      const k = p[1] as keyof Pressures;
      s.pressures[k] = clamp(s.pressures[k] + delta, 0, 100);
      return note();
    }
    case 'bloc': {
      const k = p[1] as BlocId;
      s.blocs[k] = clamp(s.blocs[k] + delta, 0, 100);
      return note();
    }
    case 'approval': {
      // Popularity is easy to add when you have little and hard when you have a lot.
      const d = delta > 0 ? delta * clamp((72 - approval(s)) / 20, 0.25, 1) : delta;
      for (const z of ZONES) s.zones[z].approval = clamp(s.zones[z].approval + d, 5, 95);
      if (touches) touches[target] = (touches[target] ?? 0) + d;
      return;
    }
    case 'zone': {
      const z = s.zones[p[1] as ZoneId];
      if (!z) return;
      if (p[2] === 'security') { shiftThreat(s, p[1] as ZoneId, -delta); syncSecurity(s); }
      else z.approval = clamp(z.approval + delta, 5, 95);
      return note();
    }
    case 'pc': s.pc = clamp(s.pc + delta, 0, CFG.pc.max); return note();
    case 'purse': s.purse = Math.max(0, s.purse + delta); return note();
    case 'rel': {
      const c = s.chars[p[1]];
      if (c) c.rel = clamp(c.rel + delta, -100, 100);
      return note();
    }
    case 'counter': s.counters[p[1]] = (s.counters[p[1]] ?? 0) + delta; return;
    case 'rival': s.opposition[p[1]] = clamp((s.opposition[p[1]] ?? 30) + delta, 5, 95); return note();
    case 'person': { const who = s.people[p[1]]; if (who) who.rel = clamp(who.rel + delta, 0, 100); return note(); }
    // Permanent structural shifts earned by reform: bonus.fiscal, bonus.inflation, bonus.power
    case 'bonus': s.counters[target] = (s.counters[target] ?? 0) + delta; return note();
    case 'pred': if (s.predecessor) s.predecessor.rel = clamp((s.predecessor.rel ?? 50) + delta, 0, 100); return note();
    case 'vp': if (s.vp) s.vp.rel = clamp(s.vp.rel + delta, 0, 100); return note();
    // Lasting security measures: drift.<zone> moves a theatre every month, sec.* changes how theatres behave.
    case 'drift':
      for (const z of p[1] === 'all' ? ZONES : [p[1] as ZoneId]) s.counters[`drift.${z}`] = (s.counters[`drift.${z}`] ?? 0) + delta;
      return note();
    case 'sec': s.counters[target] = (s.counters[target] ?? 0) + delta; return note();
    case 'campaign': s.campaign.chest = Math.max(0, s.campaign.chest + delta); return;
    case 'debt': if (s.debts[p[1] as DebtId] !== undefined) addOwed(s, p[1] as DebtId, delta); return note();
    case 'fund': { const k = p[1] as FundId; if (s.funds[k] !== undefined) s.funds[k] = Math.max(0, s.funds[k] + delta); return note(); }
    case 'tycoon': { const t = s.tycoons[p[1]]; if (t) t.rel = clamp(t.rel + delta, 0, 100); return note(); }
    case 'fx': if (s.fx) {
      if (p[1] === 'reserves') s.fx.reserves = clamp(s.fx.reserves + delta, 0, 120);
      if (p[1] === 'rate') { s.fx.rate *= 1 + delta / 100; s.fx.parallel = Math.max(s.fx.parallel, s.fx.rate * 1.03); }
    } return note();
    case 'theatre': if (s.theatres[p[1] as ZoneId] !== undefined) { shiftThreat(s, p[1] as ZoneId, delta); syncSecurity(s); } return note();
    case 'oil': s.oil.price = clamp(s.oil.price + delta, 30, 130); return note();
  }
}
