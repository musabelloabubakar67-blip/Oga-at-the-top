// Balance harness (GDD 10.6). Plays whole presidencies with scripted strategies
// and prints distributions. Usage: npm run simulate -- [runs] [--trace]

import { EVENT_LIST } from '../content';
import { SCENARIOS } from '../content/scenarios';
import { TYCOONS } from '../content/tycoons';
import { eventOf } from '../engine/cast';
import { canCall, canTycoon } from '../engine/favours';
import { canFund, canPay, usualBudget } from '../engine/treasury';
import type { DebtId, SectorId } from '../engine/types';
import { FINANCE_CANDIDATES } from '../content/names';
import { CFG, dateLabel, termTurnOf } from '../engine/config';
import { moneyEffect, projectMargin } from '../engine/election';
import { governorEffect } from '../engine/people';
import { verdict } from '../engine/legacy';
import { TRACKS } from '../content/agenda';
import { PEOPLE } from '../content/people';
import { VENTURE_BY_ID } from '../content/ventures';
import { canDeal } from '../engine/people';
import { movesLeft } from '../engine/reduce';
import { standing } from '../engine/vars';
import { aidedFx, applyAction, availability, canAct, canDrawer, canLaunch, canOrder, canVenture, newGame } from '../engine/reduce';
import { canFocus } from '../engine/security';
import { currentWant } from '../engine/wants';
import { adviserFor, canReplaceAdviser, forecast, poolFor, recommend, secondFor, trackRecord } from '../engine/advice';
import { REPLACEABLE } from '../content/names';
import { built, canEstablish, canReplaceHead, headsFor } from '../engine/institutions';
import { INSTITUTION_BY_ID } from '../content/institutions';
import { fiscalFlow } from '../engine/treasury';
import { activePolicies, canRepeal, policyNow, repealCost } from '../engine/policies';
import { MILESTONE_BY_ID, ORDER_BY_ID } from '../content/agenda';
import type { Choice, DeskItem, Fx, GameEvent, GameState, ZoneId } from '../engine/types';
import { ZONES, approval, delegates, hardship, test } from '../engine/vars';
import { traceFor } from '../engine/view';

type Weights = Record<string, number>;
interface Bot {
  /** Imperfect reformers: priorities and reform order drawn at random. */
  shuffle?: boolean;
  /** Imperfect reformers: never ends the petrol subsidy. */
  /** Times the reforms that hurt while under way: early in a term or after re-election, one at a time. */
  paces?: boolean;
  keepsSubsidy?: boolean;
  /** How it uses advice on files: by default bots see the truth. 'trust' takes the recommendation; 'check' reads the record and asks for a second opinion when it is poor. */
  advice?: 'trust' | 'check';
  name: string;
  finance: number;
  w: Weights;
  purse: boolean;
  pcAversion: number;
  tracks?: string[];
  reforms?: 'all' | 'free' | 'grease';
  bets?: string[];
  /** [oil benchmark, points for security, power, people, agric, debt, padding] */
  budget?: [number, number, number, number, number, number, number];
  /** Which debts it pays, in order, when there is cash. */
  pays?: DebtId[];
  saves?: boolean;
  courts?: boolean;
  act: (s: GameState) => [string, ZoneId?] | null;
}

const skip = (what: string) => (process.env.SKIP ?? '').includes(what);
const orderOk = (s: GameState, id: string) => canOrder(s, ORDER_BY_ID[id]).ok;
const lowestZone = (s: GameState): ZoneId => [...ZONES].sort((a, b) => s.zones[a].approval - s.zones[b].approval)[0];
const campaigning = (s: GameState) => canAct(s, 'rally').ok;

const BOTS: Bot[] = [
  { name: 'Random', finance: 2, w: {}, purse: true, pcAversion: 0, act: (s) => (campaigning(s) ? ['rally', lowestZone(s)] : ['tour', lowestZone(s)]) },
  {
    name: 'Populist', paces: true, finance: 1, purse: false, pcAversion: 0.4, tracks: ['power', 'food', 'security', 'people'], reforms: 'free',
    budget: [80, 2, 2, 4, 2, 0, 2], pays: ['pensions'], courts: true,
    w: { approval: 3, 'bloc.street': 1.5, 'bloc.party': 0.6, 'pressure.wageGrievance': -0.3, 'nation.petrolPrice': -0.02, 'pressure.scandalHeat': -0.4, 'nation.integrity': 0.5 },
    act: (s) => (campaigning(s) ? ['rally', lowestZone(s)] : ['tour', lowestZone(s)]),
  },
  {
    name: 'Reformer', paces: true, finance: 0, purse: false, pcAversion: 0.05, tracks: ['treasury', 'power', 'service', 'industry'], reforms: 'all', bets: ['diaspora', 'creative', 'cng', 'export_power', 'hub', 'buyback'],
    budget: [70, 2, 3, 2, 1, 0, 2], pays: ['gas', 'pensions', 'contractors', 'ways', 'eurobond'], saves: true,
    w: {
      'nation.integrity': 1.5, 'nation.capacity': 2, 'nation.power': 1.5, 'nation.security': 1.5, 'nation.fiscalSpace': 8,
      'nation.debt': -1.2, 'bloc.establishment': 0.3, 'bloc.street': 0.25, 'bloc.party': 0.5, approval: 0.5, 'nation.inflation': -1, 'nation.petrolPrice': 0.012, 'nation.jobs': 1.5, 'bonus.fiscal': 200, 'bonus.jobs': 100,
    },
    act: (s) => (campaigning(s) ? ['rally', lowestZone(s)] : s.blocs.party < 48 ? ['convene'] : s.pc > 45 && s.pressures.scandalHeat > 35 && canAct(s, 'audit').ok ? ['audit'] : ['tour', lowestZone(s)]),
  },
  {
    name: 'Institutionalist', paces: true, finance: 0, purse: false, pcAversion: 0.05, tracks: ['clean', 'service', 'security', 'people'], reforms: 'all', bets: ['loot', 'census', 'borders'],
    budget: [60, 3, 2, 2, 1, 0, 0], pays: ['pensions', 'contractors', 'gas', 'ways'], saves: true,
    w: { 'nation.integrity': 3, 'nation.capacity': 3, 'bloc.press': 0.3, approval: 1, 'counter.committees': -3 },
    // Clean, but not naive: in the year before the primary the party comes first.
    act: (s) => (campaigning(s) ? ['rally', lowestZone(s)] : termTurnOf(s.turn) >= 24 && termTurnOf(s.turn) <= 38 && s.blocs.party < 55 ? ['convene'] : s.pc > 30 && canAct(s, 'audit').ok ? ['audit'] : s.blocs.party < 48 ? ['convene'] : ['tour', lowestZone(s)]),
  },
  {
    name: 'Machine', paces: true, finance: 1, purse: false, pcAversion: 0.2, tracks: ['power', 'security', 'food', 'works'], reforms: 'free',
    budget: [80, 2, 2, 2, 1, 0, 5], pays: ['gas'], courts: true,
    w: { 'bloc.party': 2, 'bloc.establishment': 1, 'bloc.villa': 1, pc: 1, approval: 0.5 },
    act: (s) => (campaigning(s) ? ['rally', lowestZone(s)] : s.pressures.scandalHeat > 55 && canAct(s, 'audit').ok ? ['audit'] : ['convene']),
  },
  {
    name: 'Kleptocrat', finance: 1, purse: true, pcAversion: 0.3, tracks: ['power', 'security', 'works', 'industry'], reforms: 'grease', bets: ['steel', 'rail'],
    budget: [90, 2, 3, 2, 1, 0, 6], courts: true,
    w: { purse: 4, approval: 2, 'bloc.street': 1, 'bloc.party': 1.5 },
    act: (s) => (campaigning(s) ? ['rally', lowestZone(s)] : ['tour', lowestZone(s)]),
  },
  {
    name: 'Do-nothing', finance: 2, purse: false, pcAversion: 2,
    w: { 'counter.committees': 5 },
    act: () => ['convene'],
  },
];

// The flawless reformer's script with one thing done badly, to measure how narrow the reformer's path is.
{
  const flawless = BOTS.find((b) => b.name === 'Reformer')!;
  BOTS.push(
    { ...flawless, name: 'Reformer, any order', shuffle: true, paces: false },
    { ...flawless, name: 'Reformer, keeps subsidy', keepsSubsidy: true },
    { ...flawless, name: 'Reformer, ignores debts', pays: [], saves: false },
    { ...flawless, name: 'Reformer, trusts advisers', advice: 'trust' },
    { ...flawless, name: 'Reformer, checks the record', advice: 'check' },
  );
}
const shuffled = <T,>(xs: T[]): T[] => xs.map((x) => [Math.random(), x] as const).sort((a, b) => a[0] - b[0]).map(([, x]) => x);

function score(bot: Bot, c: Choice, s: GameState): number {
  // Each outcome weighted by how likely it is, in the order the engine tries them.
  let left = 1;
  let v = 0;
  const value = (x: Choice['outcomes'][number], p: number) => {
    for (const [t, d] of [...(x.fx ?? []), ...(x.later ?? []).flatMap((l) => l.fx)]) v += p * (bot.w[t] ?? 0) * d;
    if (x.ends) v -= p * 1000;
  };
  for (const x of c.outcomes) {
    if (left <= 0) break;
    if (x.when && !test(s, x.when)) continue;
    const p = left * (x.chance ?? 1);
    left -= p;
    value(x, p);
  }
  // When nothing is picked, the engine falls back to the last outcome.
  if (left > 0) value(c.outcomes[c.outcomes.length - 1], left);
  // The reformer who keeps the subsidy refuses every file that would end it.
  if (bot.keepsSubsidy && c.outcomes.some((x) => x.flags?.['policy.subsidy'] === 'removed')) v -= 500;
  v -= (c.pc ?? 0) * bot.pcAversion;
  if (c.purse && bot.name === 'Kleptocrat') v += 12;
  if (c.naira) v += (bot.w['nation.fiscalSpace'] ?? 0) * -c.naira;
  if (bot.name === 'Do-nothing' && !c.pc && !c.naira) v += 2;
  if (bot.name === 'Random') v = Math.random() * 10;
  return v + (s.turn % 7) * 1e-6;
}

/** An adviser who has been wrong, or whose advice keeps helping someone else, gets a second opinion. */
function wantsSecond(s: GameState, e: GameEvent, item: DeskItem): boolean {
  const adv = adviserFor(s, e);
  if (!adv || item.second || movesLeft(s) <= 0 || !secondFor(s, adv.role)) return false;
  const rec = trackRecord(s, adv.role);
  return rec.checked >= 3 && (rec.close / rec.checked < 0.6 || rec.served.length > 0);
}

/** A President who decides on files from advice rather than the truth. */
function advisedChoice(bot: Bot, s: GameState, e: GameEvent, item: DeskItem, options: Choice[]): Choice | undefined {
  const adv = adviserFor(s, e);
  if (!adv) return undefined;
  const aid = (fx: Fx[] | undefined) => aidedFx(s, fx, {});
  const usable = (c: Choice) => options.includes(c);
  if (bot.advice === 'trust') {
    const r = recommend(s, e, adv.role, aid, usable);
    return options.find((c) => c.id === r);
  }
  // With a second opinion in hand, it is the second adviser's forecast that counts.
  const role = item.second ?? adv.role;
  const value = (c: Choice) => {
    const f = forecast(s, e, c, role, aid);
    return [...f.now, ...f.later].reduce((v, [t, d]) => v + (bot.w[t] ?? 0) * d, 0) - (c.pc ?? 0) * bot.pcAversion;
  };
  return [...options].sort((a, b) => value(b) - value(a))[0];
}

/** The state of each presidency on the eve of its first election, for --probe. */
const eve: Record<string, Record<string, number>[]> = {};

function play(bot: Bot, seed: number, log = false, opts: { scenario?: string; prev?: GameState } = {}): GameState {
  let s = newGame({
    seed, name: 'Tester', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN',
    background: 'governor', address: 'sir', finance: FINANCE_CANDIDATES[bot.finance].name,
    priorities: bot.shuffle ? shuffled(TRACKS.filter((t) => !t.loose).map((t) => t.id)).slice(0, 4) : bot.tracks ?? ['power', 'security', 'food', 'works'], scenario: opts.scenario,
  }, opts.prev);
  let guard = 0;
  while (s.phase !== 'verdict' && guard++ < 2000) {
    if (s.phase === 'papers') { s = applyAction(s, { type: 'DISMISS_PAPER' }); continue; }
    if (s.phase === 'election') { s = applyAction(s, { type: 'ELECTION_DONE' }); continue; }
    for (const item of [s.desk.lead, ...s.desk.minors]) {
      if (!item || item.resolved) continue;
      const e = eventOf(s, item)!;
      const options = e.choices.filter((c) => availability(s, c).ok && (bot.purse || !c.purse));
      if (!options.length) {
        if (item === s.desk.lead) throw new Error(`No available choice on ${e.id} at turn ${s.turn}`);
        continue;
      }
      let best = options.map((c) => [score(bot, c, s), c] as const).sort((a, b) => b[0] - a[0])[0][1];
      if (bot.advice === 'check' && wantsSecond(s, e, item)) {
        s = applyAction(s, { type: 'SECOND_OPINION', eventId: e.id });
      }
      if (bot.advice) {
        const now = [s.desk.lead, ...s.desk.minors].find((x) => x?.eventId === e.id) ?? item;
        best = advisedChoice(bot, s, e, now, options) ?? best;
      }
      if (log && item === s.desk.lead) {
        const tr = traceFor(s, e);
        console.log(`\n[${dateLabel(s.turn, s.startYear)}] ${e.title}  → ${best.label}`);
        for (const t of tr) console.log(`     trace: ${t.turn <= 0 ? 'previous administration' : dateLabel(t.turn, s.startYear)} — ${t.headline}`);
      }
      s = applyAction(s, { type: 'CHOOSE', eventId: e.id, choiceId: best.id });
      if (s.phase === 'verdict') return s;
    }
    if (bot.purse && bot.name === 'Kleptocrat' && s.flags['drawer.open']) {
      if (canDrawer(s, 'security_vote').ok) s = applyAction(s, { type: 'DRAWER', op: 'security_vote' });
      if (s.blocs.party < 45 && canDrawer(s, 'assembly').ok) s = applyAction(s, { type: 'DRAWER', op: 'assembly' });
      if (canDrawer(s, 'campaign').ok && s.campaign.chest < 16) s = applyAction(s, { type: 'DRAWER', op: 'campaign' });
      if (s.blocs.villa < 45 && canDrawer(s, 'villa').ok) s = applyAction(s, { type: 'DRAWER', op: 'villa' });
    }
    // The year's budget must be signed before the month can end.
    if (s.budget.due) {
      const b = bot.budget;
      const alloc = b
        ? ({ security: b[1], power: b[2], people: b[3], agric: b[4], debt: b[5], padding: b[6] } as Record<SectorId, number>)
        : usualBudget();
      s = applyAction(s, { type: 'BUDGET', benchmark: b?.[0] ?? 70, alloc });
      if (s.budget.due) throw new Error(`${bot.name} could not pass a budget at turn ${s.turn}`);
    }
    // Pay what is owed, in the bot's order of priority, keeping a little in hand.
    for (const id of bot.pays ?? []) {
      const reserve = id === 'ways' || id === 'eurobond' ? 2.2 : 0.4;
      const spare = s.nation.fiscalSpace - reserve;
      if (spare <= 0.1 || s.debts[id] <= 0.05) continue;
      const amount = Math.min(s.debts[id], id === 'ways' || id === 'eurobond' ? 1 : spare);
      if (amount > 0.05 && amount <= spare && canPay(s, id, amount).ok) s = applyAction(s, { type: 'PAY_DEBT', id, amount });
    }
    if (bot.saves && s.nation.fiscalSpace > 3.4 && canFund(s, 'abroad', 1).ok) s = applyAction(s, { type: 'FUND', id: 'abroad', amount: 1 });
    // Machine politicians keep the money men sweet and spend what they are owed.
    if (bot.courts) {
      for (const t of TYCOONS) {
        if (movesLeft(s) > 1 && s.tycoons[t.id].rel < 45 && canTycoon(s, t.id, 'grant', movesLeft(s)).ok && (t.want.naira ?? 0) <= s.nation.fiscalSpace) s = applyAction(s, { type: 'TYCOON', id: t.id, op: 'grant' });
      }
      if (s.pc < 25) {
        const f = s.favours.find((x) => x.dir === 'owed' && canCall(s, x, movesLeft(s)).ok);
        if (f) s = applyAction(s, { type: 'FAVOUR', id: f.id, use: 'capital' });
      }
    }
    if (bot.reforms) {
      const ranked = bot.reforms === 'all' ? [...s.agenda.tracks, ...TRACKS.map((t) => t.id).filter((id) => !s.agenda.tracks.includes(id))] : s.agenda.tracks;
      const order = bot.shuffle ? shuffled(ranked) : ranked;
      for (const id of order) {
        const next = TRACKS.find((t) => t.id === id)!.milestones.find((m) => !s.agenda.done.includes(m.id) && !s.agenda.active.some((x) => x.id === m.id) && !(bot.reforms === 'all' && m.popular));
        if (!next) continue;
        if (bot.paces && next.during) {
          const early = s.term > 1 || termTurnOf(s.turn) <= 14;
          const hurting = s.agenda.active.filter((a) => MILESTONE_BY_ID[a.id]?.m.during).length;
          if (!early || hurting >= 1) continue;
        }
        const chk = canLaunch(s, next.id);
        if (bot.reforms === 'grease' && !chk.ok && chk.grease) { s = applyAction(s, { type: 'LAUNCH', id: next.id, grease: true }); continue; }
        if (!chk.ok) continue;
        if (bot.reforms === 'free' && next.pc > 7) continue;
        if (bot.reforms === 'grease' && next.naira > s.nation.fiscalSpace + 0.5) continue;
        if (bot.reforms === 'all' && next.naira > s.nation.fiscalSpace && s.nation.debt > 80) continue;
        if (bot.reforms === 'all' && s.pc - next.pc < 12) continue;
        // A careful President paces the agenda in the year before the primary, so the party is not strained.
        if (bot.name === 'Institutionalist' && termTurnOf(s.turn) >= 24 && termTurnOf(s.turn) <= 38 && s.agenda.active.length >= CFG.agenda.easyLoad) continue;
        s = applyAction(s, { type: 'LAUNCH', id: next.id });
      }
    }
    for (const id of bot.bets ?? []) {
      const v = VENTURE_BY_ID[id];
      if (canVenture(s, v).ok && s.nation.fiscalSpace > v.naira + 1 && s.pc > v.pc + 15) s = applyAction(s, { type: 'VENTURE', id });
    }
    // What each kind of President builds, and whom they put in charge.
    const builds: Record<string, [string[], 'rep' | 'party' | 'civil']> = {
      Reformer: [['delivery', 'power', 'tax', 'zone', 'fund'], 'rep'], Institutionalist: [['graft', 'delivery', 'policing'], 'rep'],
      Machine: [['jobs', 'policing'], 'party'], Populist: [['jobs', 'reserve'], 'civil'], Kleptocrat: [['reserve', 'zone', 'jobs'], 'party'],
    };
    const plan = builds[bot.name.startsWith('Reformer') ? 'Reformer' : bot.name];
    if (plan && s.pc > 25 && movesLeft(s) > 1) {
      const heads = headsFor(s);
      const head = plan[1] === 'party' ? 'A party nominee' : plan[1] === 'civil' ? 'A career civil servant'
        : [...heads].sort((x, y) => (y.rep.competence + y.rep.loyalty) - (x.rep.competence + x.rep.loyalty))[0]?.name;
      const next = plan[0].find((id) => !built(s).some((i) => i.id === id));
      if (next && head && canEstablish(s, next, head, movesLeft(s)).ok && (INSTITUTION_BY_ID[next].naira <= s.nation.fiscalSpace)) s = applyAction(s, { type: 'ESTABLISH', id: next, head });
    }
    if (bot.advice === 'check') {
      for (const i of built(s)) {
        if (!i.seen) continue;
        const pick = headsFor(s).filter((h) => h.name !== i.head.name).sort((x, y) => (y.rep.competence + y.rep.loyalty) - (x.rep.competence + x.rep.loyalty))[0];
        if (pick && canReplaceHead(s, i.id, pick.name, movesLeft(s)).ok) s = applyAction(s, { type: 'REPLACE_HEAD', id: i.id, head: pick.name });
      }
    }
    // A President who reads the record replaces an adviser whose advice keeps helping someone else, choosing by reputation.
    if (bot.advice === 'check') {
      for (const role of REPLACEABLE) {
        const r = trackRecord(s, role);
        if (!r.served.length) continue;
        const pick = poolFor(s).sort((x, y) => (y.rep?.competence ?? y.competence) - (x.rep?.competence ?? x.competence))[0];
        if (pick && canReplaceAdviser(s, role, pick.name, movesLeft(s)).ok) s = applyAction(s, { type: 'REPLACE_ADVISER', role, name: pick.name });
      }
    }
    // Crowd-pleasers: the populist and the machine take what the street or the party wants, from any track.
    if (!skip('pop') && (bot.name === 'Populist' || bot.name === 'Machine')) {
      for (const t of TRACKS) for (const m of t.milestones) {
        if (!m.popular || s.agenda.done.includes(m.id) || s.agenda.active.some((x) => x.id === m.id)) continue;
        if (canLaunch(s, m.id).ok && s.pc - m.pc > 15 && m.naira <= s.nation.fiscalSpace + 0.3) s = applyAction(s, { type: 'LAUNCH', id: m.id });
      }
    }
    // The careful ones undo a standing policy that is costing the country, when they can afford the politics.
    if (!skip('rep') && (bot.name === 'Institutionalist' || bot.name.startsWith('Reformer'))) {
      for (const id of activePolicies(s)) {
        const p = policyNow(s, id)!;
        const hurts = p.fiscal < -0.015 || p.inflation > 1 || p.fx.some(([t, v]) => t === 'nation.jobs' && v < 0);
        if (hurts && canRepeal(s, id).ok && s.pc - repealCost(id).pc > 20) s = applyAction(s, { type: 'REPEAL', id });
      }
    }
    // The dials.
    if (!skip('relief') && bot.name === 'Populist' && (s.blocs.street < 45 || termTurnOf(s.turn) >= 40) && orderOk(s, 'relief') && s.nation.fiscalSpace > 1) s = applyAction(s, { type: 'ORDER', id: 'relief', level: 2 });
    if (!skip('relief') && bot.name === 'Machine' && termTurnOf(s.turn) >= 36 && orderOk(s, 'relief') && s.nation.fiscalSpace > 0.6) s = applyAction(s, { type: 'ORDER', id: 'relief', level: 1 });
    if (!skip('bond') && (bot.name === 'Kleptocrat' || bot.name === 'Machine') && s.nation.fiscalSpace < 0.3 && s.nation.debt < 80 && termTurnOf(s.turn) >= 30 && orderOk(s, 'bond')) s = applyAction(s, { type: 'ORDER', id: 'bond', level: 1 });
    if (!skip('vat') && bot.name === 'Institutionalist' && termTurnOf(s.turn) <= 20 && fiscalFlow(s).total < 0 && orderOk(s, 'tax')) s = applyAction(s, { type: 'ORDER', id: 'tax', level: 0 });
    if (bot.name.startsWith('Reformer') && !bot.keepsSubsidy && s.turn === 2) s = applyAction(s, { type: 'ORDER', id: 'subsidy_end' });
    if (bot.reforms === 'all' && s.nation.fiscalSpace > 4) s = applyAction(s, { type: 'ORDER', id: 'paydown' });
    // Anyone governing watches the worst theatre: forces go there, and an offensive when one is available.
    if (bot.name !== 'Do-nothing' && bot.name !== 'Random') {
      const worst = [...ZONES].sort((a, b) => s.theatres[b] - s.theatres[a])[0];
      if (s.theatres[worst] >= 55 && canFocus(s, worst, movesLeft(s)).ok) s = applyAction(s, { type: 'FOCUS', zone: worst });
      if (s.theatres[worst] >= 60 && orderOk(s, 'offensive')) s = applyAction(s, { type: 'ORDER', id: 'offensive', target: worst });
    }
    const a = bot.act(s);
    if (a && canAct(s, a[0] as never).ok) s = applyAction(s, { type: 'ACT', action: a[0] as never, zone: a[1] });
    // Whatever move is left goes on people: grant a want if it is cheap, otherwise an hour of time.
    if (bot.name !== 'Do-nothing' && bot.name !== 'Random') {
      while (movesLeft(s) > 0) {
        const pool = PEOPLE.filter((p) => p.group !== 'minister').sort((x, y) => standing(s, x.id) - standing(s, y.id));
        const target = pool[0];
        // The clean grant only what costs no integrity: a reconstruction fund, a seaport. Never fertiliser with a photograph on the bag.
        const want = currentWant(s, target.id);
        const dirty = !!want && want.fx.some(([t, d]) => t === 'nation.integrity' && d < 0);
        // The clean say no, out loud, to what would cost integrity.
        // ...but only to people solidly with them; the rest are simply not given it.
        if (!skip('refuse') && bot.name === 'Institutionalist' && dirty && standing(s, target.id) >= 55 && canDeal(s, target.id, 'refuse', movesLeft(s)).ok) s = applyAction(s, { type: 'PERSON', id: target.id, op: 'refuse' });
        const clean = bot.name === 'Institutionalist' && !!want && !dirty;
        // The populist gives freely, but not what would land it in the papers.
        const generous = bot.name === 'Machine' || bot.name === 'Kleptocrat' || (bot.name === 'Populist' && !dirty) || clean;
        const op = generous && canDeal(s, target.id, 'grant', movesLeft(s)).ok && (want?.naira ?? 0) <= s.nation.fiscalSpace + 0.3 ? 'grant' : 'court';
        if (!canDeal(s, target.id, op, movesLeft(s)).ok) break;
        s = applyAction(s, { type: 'PERSON', id: target.id, op });
      }
    }
    if (s.turn === 44 && s.phase === 'desk') {
      (eve[bot.name] ??= []).push({
        approval: approval(s), hardship: hardship(s), party: s.blocs.party, street: s.blocs.street, chest: s.campaign.chest, scandal: s.pressures.scandalHeat,
        rival: Math.max(...Object.values(s.opposition)), governors: ZONES.reduce((a, z) => a + governorEffect(s, z), 0) / 6, money: moneyEffect(s),
        treasury: s.nation.fiscalSpace, debt: s.nation.debt, arrears: s.debts.gas + s.debts.contractors + s.debts.pensions, inflation: s.nation.inflation,
        pc: s.pc, margin: projectMargin(s), reforms: s.agenda.done.length, united: s.flags['opposition.united'] ? 1 : 0, broad: s.flags['opposition.broad'] ? 1 : 0, subsidyGone: s.flags['policy.subsidy'] === 'removed' ? 1 : 0, integrity: s.nation.integrity, merger: s.fired['opposition.unites'] ? 1 : 0, delegates: delegates(s), security: s.nation.security, power: s.nation.power, jobs: s.nation.jobs, ...Object.fromEntries(ZONES.map((z) => [z, s.theatres[z]])),
      });
    }
    s = applyAction(s, { type: 'END_MONTH' });
  }
  return s;
}

const args = process.argv.slice(2);
const runs = Number(args.find((a) => /^\d+$/.test(a)) ?? 200);

if (args.includes('--scenarios')) {
  // Every starting inheritance, played by three kinds of President.
  for (const sc of SCENARIOS) {
    const line = [BOTS[2], BOTS[4], BOTS[1]].map((bot) => {
      let won = 0; let months = 0; const ends: Record<string, number> = {};
      for (let i = 0; i < runs; i++) { const s = play(bot, 500 + i * 131, false, { scenario: sc.id }); if (s.flags['election.won']) won++; months += Math.min(s.turn, 96); ends[s.ending ?? '?'] = (ends[s.ending ?? '?'] ?? 0) + 1; }
      return `${bot.name} ${Math.round((won / runs) * 100)}% re-elected, ${Math.round(months / runs)} months`;
    });
    console.log(`${sc.name.padEnd(26)} ${line.join(' · ')}`);
  }
  process.exit(0);
}
if (args.includes('--world')) {
  // One world, four Presidents in a row, each inheriting what the last one left.
  for (let w = 0; w < Math.min(runs, 6); w++) {
    let prev: GameState | undefined;
    const order = [BOTS[1], BOTS[2], BOTS[5], BOTS[2]];
    for (const bot of order) {
      const s = play(bot, 900 + w * 77 + order.indexOf(bot), false, { prev });
      const v = verdict(s);
      console.log(`world ${w} · ${v.years} · ${bot.name.padEnd(10)} · ${s.president.partyShort.padEnd(5)} · ${v.epithet.padEnd(30)} · ${s.ending} · debt ${Math.round(s.nation.debt)}% · unpaid ₦${(s.debts.gas + s.debts.contractors + s.debts.pensions).toFixed(1)}tn · reforms ${s.agenda.done.length} · inflation ${Math.round(s.nation.inflation)}%`);
      prev = s;
    }
    console.log('');
  }
  process.exit(0);
}
if (args.includes('--trace')) {
  const s = play(BOTS[2], 7, true);
  const v = verdict(s);
  console.log(`\n=== ${v.epithet} (${v.years}) ===`);
  v.narrative.forEach((p) => console.log(p));
  v.dims.forEach((d) => console.log(`  ${d.name.padEnd(26)} ${d.grade.padEnd(12)} ${d.from} → ${d.to}`));
  process.exit(0);
}

const everFired = new Set<string>();
const fireCount: Record<string, number> = {};
console.log(`${runs} presidencies per strategy\n`);
for (const bot of BOTS) {
  const endings: Record<string, number> = {};
  const epithets: Record<string, number> = {};
  const dims: Record<string, number> = {};
  let elApp = 0, elMargin = 0, elN = 0, elParty = 0;
  const margins: number[] = [];
  let shocks = 0;
  let months = 0, reelected = 0, quiet = 0, unique = 0, app = 0, hard = 0, personal = 0;
  let betsWon = 0, betsLost = 0, reforms = 0, arrears = 0, debt = 0, saved = 0, gone = 0, owing = 0;
  for (let i = 0; i < runs; i++) {
    const s = play(bot, 1000 + i * 7919);
    const v = verdict(s);
    endings[v.ending] = (endings[v.ending] ?? 0) + 1;
    epithets[v.epithet] = (epithets[v.epithet] ?? 0) + 1;
    for (const d of v.dims) dims[d.name] = (dims[d.name] ?? 0) + d.score;
    months += Math.min(s.turn, 96);
    if (s.flags['election.won']) reelected++;
    shocks += s.shocks?.seen.length ?? 0;
    if (s.election) { elApp += s.election.approval; elMargin += s.election.margin; elN++; margins.push(s.election.margin); }
    unique += Object.keys(s.fired).length;
    quiet += 0;
    betsWon += s.ventures.won.length; betsLost += s.ventures.lost.length; reforms += s.agenda.done.length; arrears += s.debts.gas + s.debts.contractors + s.debts.pensions; debt += s.nation.debt; saved += s.funds.abroad + s.funds.buffer + s.funds.infra + s.funds.growth; gone += Object.values(s.people).filter((p) => p.gone).length; owing += s.favours.filter((f) => f.dir === 'owing').length;
    app += approval(s); hard += hardship(s); personal += s.purseTaken.personal;
    for (const [id, f] of Object.entries(s.fired)) { everFired.add(id); fireCount[id] = (fireCount[id] ?? 0) + f.length; }
  }
  const pct = (n: number) => `${Math.round((n / runs) * 100)}%`;
  console.log(`── ${bot.name}`);
  console.log(`   months in office ${(months / runs).toFixed(0)} · re-elected ${pct(reelected)} · final approval ${(app / runs).toFixed(0)}% · hardship ${(hard / runs).toFixed(0)} · kept ₦${(personal / runs).toFixed(0)}bn`);
  const q = (f: number) => { const m = [...margins].sort((a, b) => a - b); return m.length ? m[Math.min(m.length - 1, Math.floor(f * m.length))].toFixed(1) : '–'; };
  console.log(`   at first election: approval ${(elApp / Math.max(1, elN)).toFixed(0)}% · margin ${(elMargin / Math.max(1, elN)).toFixed(1)} pts (p10 ${q(0.1)}, p50 ${q(0.5)}, p90 ${q(0.9)}) · contested ${elN}`);
  console.log(`   endings   ${Object.entries(endings).map(([k, n]) => `${k} ${pct(n)}`).join(' · ')}`);
  console.log(`   legacy    ${Object.entries(dims).map(([k, n]) => `${k.split(' ')[0]} ${(n / runs).toFixed(1)}`).join(' · ')}`);
  console.log(`   epithets  ${Object.entries(epithets).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} ${pct(n)}`).join(' · ')}`);
  console.log(`   reforms ${(reforms / runs).toFixed(1)} · bets won ${(betsWon / runs).toFixed(1)}, lost ${(betsLost / runs).toFixed(1)} · debt service ${(debt / runs).toFixed(0)}% · unpaid ₦${(arrears / runs).toFixed(1)}tn · saved ₦${(saved / runs).toFixed(1)}tn · defections ${(gone / runs).toFixed(1)} · still owes ${(owing / runs).toFixed(1)}`);
  console.log(`   distinct events per presidency ${(unique / runs).toFixed(0)} · shocks ${(shocks / runs).toFixed(1)}\n`);
}
if (args.includes('--probe')) {
  console.log('On the eve of the first election (averages):');
  for (const [name, rows] of Object.entries(eve)) {
    const keys = Object.keys(rows[0]);
    console.log(`  ${name.padEnd(17)}` + keys.map((k) => `${k} ${(rows.reduce((a, r) => a + r[k], 0) / rows.length).toFixed(k === 'united' || k === 'broad' ? 2 : k === 'treasury' || k === 'arrears' || k === 'money' || k === 'governors' ? 1 : 0)}`).join(' · '));
  }
  console.log('');
}
const never = EVENT_LIST.filter((e) => !everFired.has(e.id)).map((e) => e.id);
console.log(`Events never fired in any run: ${never.length ? never.join(', ') : 'none'}`);
const total = runs * BOTS.length;
const common = Object.entries(fireCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k} ${(n / total).toFixed(1)}×`);
console.log(`Most frequent: ${common.join(' · ')}`);
