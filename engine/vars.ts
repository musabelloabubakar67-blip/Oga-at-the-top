import { PEOPLE } from '../content/people';
import { CFG, monthOf, termTurnOf } from './config';
import { rand } from './rng';
import type { BlocId, Cond, Fx, GameState, Nation, Pressures, ZoneId } from './types';

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

export function zoneSecurity(s: GameState, z: ZoneId): number {
  return clamp(s.nation.security + s.zones[z].security, 0, 100);
}

/** How a person behaves today: someone being leaned on complies whatever they feel. */
export function standing(s: GameState, id: string): number {
  const p = s.people[id];
  if (!p) return 50;
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
      return p[1] === 'total' ? s.exposures.reduce((a, e) => a + e.amount, 0) : s.exposures.length;
    case 'rel': return s.chars[p[1]]?.rel ?? 0;
    case 'leverage': return s.exposures.filter((x) => x.witnesses.includes(p[1])).length;
    case 'char': return (s.chars[p[1]] as unknown as Record<string, number>)?.[p[2]] ?? 0;
    case 'count': return s.fired[p.slice(1).join('.')]?.length ?? 0;
    case 'counter': return s.counters[p[1]] ?? 0;
    case 'campaign': return s.campaign.chest;
    case 'agenda': return s.agenda.done.includes(p[1]) ? 1 : 0;
    case 'senate': return senate(s);
    case 'person': return standing(s, p[1]);
    case 'rival': return s.opposition[p[1]] ?? 0;
    case 'tracks': return s.agenda.done.filter((id) => id.startsWith(p[1])).length;
    case 'ordered': return s.counters[`order.${p[1]}`] !== undefined ? 1 : 0;
    case 'venture': return s.ventures.won.includes(p[1]) ? 1 : s.ventures.lost.includes(p[1]) ? -1 : 0;
    case 'bonus': return s.counters[path] ?? 0;
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
    case 'approval':
      for (const z of ZONES) s.zones[z].approval = clamp(s.zones[z].approval + delta, 5, 95);
      return note();
    case 'zone': {
      const z = s.zones[p[1] as ZoneId];
      if (!z) return;
      if (p[2] === 'security') z.security = clamp(z.security + delta, -40, 40);
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
    case 'campaign': s.campaign.chest = Math.max(0, s.campaign.chest + delta); return;
  }
}
