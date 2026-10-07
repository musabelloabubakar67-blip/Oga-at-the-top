// Balance harness (GDD 10.6). Plays whole presidencies with scripted strategies
// and prints distributions. Usage: npm run simulate -- [runs] [--trace]

import { nonOilRevenue, oilRevenue, revenueAnnual } from '../engine/accounts';
import { EVENT_LIST } from '../content';
import { writeFileSync } from 'node:fs';
import { measureLevers } from './levers';
import { eraShifts } from '../engine/era';
import { nightOptions } from '../engine/night';
import { winnerOf } from '../engine/succession';
import { SCENARIOS } from '../content/scenarios';
import { TYCOONS } from '../content/tycoons';
import { eventOf } from '../engine/cast';
import { canCall, canTycoon } from '../engine/favours';
import { budgetPoints, canFund, canPay, usualBudget, vetoHolds } from '../engine/treasury';
import { SECTORS } from '../content/treasury';
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
import { bench, canNominate, nominees } from '../engine/courts';
import { ASSETS } from '../content/assets';
import { runElection } from '../engine/election';
import { STATE_BY_ID } from '../content/states';
import { canCredit, canGroom, candidate, candidateIds, creditable } from '../engine/successor';
import { aidedFx, applyAction, availability, canAct, canDrawer, canLaunch, milestoneStatus, canOrder, canRevive, canVenture, newGame, reviveCost, ventureOdds } from '../engine/reduce';
import { canFocus } from '../engine/security';
import { currentWant } from '../engine/wants';
import { adviserFor, campGain, canReplaceAdviser, forecast, poolFor, recommend, secondFor, trackRecord } from '../engine/advice';
import { REPLACEABLE } from '../content/names';
import { built, canEstablish, canReplaceHead, headsFor } from '../engine/institutions';
import { INSTITUTION_BY_ID } from '../content/institutions';
import { fiscalFlow } from '../engine/treasury';
import { dependence } from '../engine/dependence';
import { canPortfolio } from '../engine/vp';
import { canVisit } from '../engine/predecessor';
import { federalCharacter, zoneOf } from '../engine/federal';
import { personView } from '../engine/people';
import { candidatesFor } from '../engine/talent';
import { assetFiscal, canExpand, expansionCost } from '../engine/places';
import { activePolicies, canRepeal, policyNow, repealCost } from '../engine/policies';
import { MILESTONE_BY_ID, ORDER_BY_ID } from '../content/agenda';
import type { Choice, DeskItem, Fx, GameEvent, GameState, ZoneId } from '../engine/types';
import { ZONES, approval, delegates, hardship, test } from '../engine/vars';
import { traceFor } from '../engine/view';
import { canProbe, inquiries } from '../engine/inquiry';
import { MYSTERY_BY_ID } from '../content/mysteries';
import { PROPOSAL_BY_ID } from '../content/proposals';
import { canAnswer } from '../engine/proposals';

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

let revived = 0;
/** Sample states for --levers. */
const SAMPLES: GameState[] | null = process.argv.includes('--levers') ? [] : null;
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

/** An adviser who has been wrong, or whose camp gains from what they recommend, gets a second opinion. */
function wantsSecond(s: GameState, e: GameEvent, item: DeskItem): boolean {
  const adv = adviserFor(s, e);
  if (!adv || item.second || movesLeft(s) <= 0 || !secondFor(s, adv.role)) return false;
  const rec = trackRecord(s, adv.role);
  const aid = (fx: Fx[] | undefined) => aidedFx(s, fx, {});
  const pick = recommend(s, e, adv.role, aid, () => true);
  const interested = !!pick && campGain(s, adv, e.choices.find((c) => c.id === pick)!) > 0.5;
  return interested || (rec.checked >= 3 && rec.close / rec.checked < 0.6);
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

/** A night: the careful act early and in the open; the cynical take the shortcuts; nobody sleeps through it unless they are a cynic. */
function playNight(bot: Bot, s: GameState): GameState {
  const careful = ['call', 'chiefs', 'vpcall', 'cj', 'statement', 'personal', 'deal', 'evacuate', 'boats', 'verify', 'court', 'tv'];
  const cynical = ['police', 'declare', 'guard', 'injunction', 'nowork', 'close', 'defend', 'pull', 'sleep', 'quiet'];
  const pref = bot.name === 'Kleptocrat' || bot.name === 'Machine' ? [...cynical, ...careful] : careful;
  for (let i = 0; i < 40 && s.night && !s.night.done; i++) {
    const open = nightOptions(s);
    const pick = pref.find((id) => open.some((o) => o.id === id) && !s.night!.chosen.includes(id));
    s = applyAction(s, pick && s.night.chosen.length < 3 ? { type: 'NIGHT', option: pick } : { type: 'NIGHT_WAIT' });
  }
  return applyAction(s, { type: 'NIGHT_END' });
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
    if (s.night) { s = playNight(bot, s); continue; }
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
      // A call asking for something: give it if it is cheap, otherwise say no; a bot does not make promises it will not keep.
      if (e.id === 'cast.call') best = options.find((c) => c.id === 'grant' && (currentWant(s, String(item.cast?.A))?.naira ?? 0) <= s.nation.fiscalSpace - 0.3 && (currentWant(s, String(item.cast?.A))?.pc ?? 0) <= s.pc - 15) ?? options.find((c) => c.id === 'no') ?? best;
      // A President who has built someone up backs them; the first name on the list is the one groomed.
      if (e.id === 'succession.choice' && bot.name !== 'Random' && bot.name !== 'Do-nothing') best = options.find((c) => c.id === 'a') ?? best;
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
      const benchmark = b?.[0] ?? 70;
      // Inflation shrinks the budget: trim the largest lines until it fits.
      while (SECTORS.reduce((a, x) => a + (alloc[x.id] ?? 0), 0) > budgetPoints(benchmark, s)) {
        const top = SECTORS.filter((x) => x.id !== 'padding').sort((p, q) => (alloc[q.id] ?? 0) - (alloc[p.id] ?? 0))[0];
        alloc[top.id] -= 1;
      }
      s = applyAction(s, { type: 'BUDGET', benchmark, alloc });
      if (s.budget.pending) {
        // The careful ones fight the insertions when the veto would hold; the rest take the Assembly's version.
        const careful = bot.name === 'Institutionalist' || bot.name.startsWith('Reformer');
        const choice = careful ? (vetoHolds(s) ? 'veto' : s.pc > 20 ? 'split' : 'accept') : 'accept';
        s = applyAction(s, { type: 'BUDGET_RESOLVE', choice });
      }
      if (s.budget.due) throw new Error(`${bot.name} could not pass a budget at turn ${s.turn}`);
    }
    // For tools/levers.ts: the state at the start of a month's moves, every eighth month.
    if (SAMPLES && s.turn % 8 === 3) SAMPLES.push(structuredClone(s));
    // Pay what is owed, in the bot's order of priority, keeping a little in hand.
    for (const id of bot.pays ?? []) {
      const reserve = id === 'ways' || id === 'eurobond' ? 2.2 : 0.4;
      const spare = s.nation.fiscalSpace - reserve;
      if (spare <= 0.1 || s.debts[id] <= 0.05) continue;
      const amount = Math.min(s.debts[id], id === 'ways' || id === 'eurobond' ? 1 : spare);
      if (amount > 0.05 && amount <= spare && canPay(s, id, amount).ok) s = applyAction(s, { type: 'PAY_DEBT', id, amount });
    }
    if (bot.saves && s.nation.fiscalSpace > 3.4 && canFund(s, 'abroad', 1).ok) s = applyAction(s, { type: 'FUND', id: 'abroad', amount: 1 });
    // Everyone but the cynics keeps the Vice President busy, and calls on a cold former President.
    if (!skip('vp') && bot.name !== 'Random' && bot.name !== 'Do-nothing') {
      if (canPortfolio(s, movesLeft(s)).ok && s.pc > 25 && movesLeft(s) > 1) s = applyAction(s, { type: 'VP', op: 'portfolio' });
      if (s.predecessor && (s.predecessor.rel ?? 50) < 40 && canVisit(s, movesLeft(s)).ok && s.pc > 25 && movesLeft(s) > 1) s = applyAction(s, { type: 'PRED_VISIT' });
    }
    // A careful President fills a shut-out zone, swapping out the weakest minister from a zone with plenty.
    if (!skip('fed') && bot.name !== 'Random' && bot.name !== 'Do-nothing' && s.turn % 3 === 0 && movesLeft(s) > 1) {
      const f = federalCharacter(s);
      const out = f.zones.find((z) => z.count === 0);
      if (out) {
        const crowded = new Set(f.zones.filter((z) => z.count >= 2).map((z) => z.zone));
        const mins = PEOPLE.filter((p) => p.group === 'minister' && !s.people[p.id]?.gone).map((p) => ({ id: p.id, v: personView(s, p.id) }))
          .filter((m) => { const z = zoneOf(s, m.v.name); return z && crowded.has(z); }).sort((a, b) => (a.v.competence ?? 3) - (b.v.competence ?? 3));
        for (const m of mins) {
          const o = candidatesFor(s, m.id, 99).find((x) => x.c.zone === out.zone && x.fit && !x.refuses && x.effective >= (m.v.competence ?? 3));
          if (o && s.pc > 20) { s = applyAction(s, { type: 'REPLACE_MINISTER', id: m.id, kind: 'technocrat', name: o.c.name }); break; }
        }
      }
    }
    // Everyone but the cynics makes time for a businessman who has turned cold.
    if (!skip('court') && bot.name !== 'Random' && bot.name !== 'Do-nothing') {
      for (const t of TYCOONS) if (movesLeft(s) > 1 && s.pc > 18 && s.tycoons[t.id].rel < 50 && canTycoon(s, t.id, 'court', movesLeft(s)).ok) s = applyAction(s, { type: 'TYCOON', id: t.id, op: 'court' });
    }
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
    // Questions (plan 08): a careful President asks a second source and decides on the weight of evidence;
    // the others act on the ministry's account.
    for (const q of inquiries(s).filter((x) => !x.decided)) {
      if (movesLeft(s) <= 0) break;
      const careful = bot.reforms === 'all';
      if (careful && q.reports.length < 2 && !q.probing.length && canProbe(s, q.id, 'field', movesLeft(s)).ok) { s = applyAction(s, { type: 'INQUIRY_PROBE', id: q.id, method: 'field' }); continue; }
      if (careful && q.probing.length) continue;
      const votes = new Map<string, number>();
      for (const r of q.reports) if (r.says) votes.set(r.says, (votes.get(r.says) ?? 0) + (r.confidence === 'high' ? 3 : r.confidence === 'medium' ? 2 : 1));
      const pick = [...votes.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? MYSTERY_BY_ID[q.id].hypotheses[0].id;
      s = applyAction(s, { type: 'INQUIRY_DECIDE', id: q.id, hypothesis: pick });
    }
    // The opposition's proposals (plan 15): each kind of President answers in character.
    for (const p of (s.proposals ?? []).filter((x) => !x.answer)) {
      if (movesLeft(s) <= 0) break;
      const def = PROPOSAL_BY_ID[p.id];
      const how = bot.name === 'Populist' ? 'adopt' : bot.reforms === 'all' ? (test(s, def.alternative.met) ? 'alternative' : 'negotiate') : bot.name === 'Kleptocrat' ? 'defeat' : 'negotiate';
      if (canAnswer(s, p.id, how, movesLeft(s)).ok) s = applyAction(s, { type: 'PROPOSAL', id: p.id, how });
    }
    if (bot.reforms) {
      const ranked = bot.reforms === 'all' ? [...s.agenda.tracks, ...TRACKS.map((t) => t.id).filter((id) => !s.agenda.tracks.includes(id))] : s.agenda.tracks;
      const order = bot.shuffle ? shuffled(ranked) : ranked;
      for (const id of order) {
        const next = TRACKS.find((t) => t.id === id)!.milestones.find((m) => milestoneStatus(s, m.id) === 'next' && !(bot.reforms === 'all' && m.popular));
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
      if (canVenture(s, v).ok && s.nation.fiscalSpace > v.naira + 1 && s.pc > v.pc + 15) {
        // Build it where the vote is closest and the theatre is safe.
        let site: string | undefined;
        if (ASSETS[id]) {
          const proj = runElection(structuredClone(s), 'reelection', true).states;
          const gap = (st: string) => Math.abs((proj.find((r) => r.id === st)?.share ?? 50) - (proj.find((r) => r.id === st)?.opp ?? 50)) + (s.theatres[STATE_BY_ID[st].zone] >= 65 ? 50 : 0);
          site = [...ASSETS[id].sites].sort((a, b) => gap(a) - gap(b))[0];
        }
        s = applyAction(s, { type: 'VENTURE', id, site });
      }
      // A failed bet is tried once more when its odds are now decent.
      if (canRevive(s, id).ok && ventureOdds(s, v) >= 0.5 && s.pc > reviveCost(s, v).pc + 12) { s = applyAction(s, { type: 'VENTURE_REVIVE', id }); revived++; }
    }
    // What is built and earning gets more money when there is money to spare.
    for (const a of s.assets ?? []) {
      if (canExpand(s, a.id).ok && assetFiscal(s, a.id) > 0 && s.nation.fiscalSpace > expansionCost(s, a.id).naira + 1.5 && s.pc > 20) s = applyAction(s, { type: 'EXPAND_ASSET', id: a.id });
    }
    // What each kind of President builds, and whom they put in charge.
    const builds: Record<string, [string[], 'rep' | 'party' | 'civil']> = {
      Reformer: [['delivery', 'power', 'tax', 'zone', 'fund'], 'rep'], Institutionalist: [['graft', 'delivery', 'policing'], 'rep'],
      Machine: [['jobs', 'policing'], process.env.MHEAD === 'civil' ? 'civil' : 'party'], Populist: [['jobs', 'reserve'], 'civil'], Kleptocrat: [['reserve', 'zone', 'jobs'], 'party'],
    };
    const plan = process.env.NOBUILD?.includes(bot.name) ? undefined : builds[bot.name.startsWith('Reformer') ? 'Reformer' : bot.name];
    if (plan && s.pc > 25 && movesLeft(s) > 1) {
      const next = plan[0].find((id) => !built(s).some((i) => i.id === id));
      const heads = next ? headsFor(s, next).filter((h) => !h.refuses) : [];
      const head = plan[1] === 'party' ? 'A party nominee' : plan[1] === 'civil' ? 'A career civil servant'
        : [...heads].sort((x, y) => (y.rep.competence + y.rep.loyalty) - (x.rep.competence + x.rep.loyalty))[0]?.name;
      if (next && head && canEstablish(s, next, head, movesLeft(s)).ok && (INSTITUTION_BY_ID[next].naira <= s.nation.fiscalSpace)) s = applyAction(s, { type: 'ESTABLISH', id: next, head });
    }
    if (bot.advice === 'check') {
      for (const i of built(s)) {
        if (!i.seen) continue;
        const pick = headsFor(s, i.id).filter((h) => h.name !== i.head.name && !h.refuses).sort((x, y) => (y.rep.competence + y.rep.loyalty) - (x.rep.competence + x.rep.loyalty))[0];
        if (pick && canReplaceHead(s, i.id, pick.name, movesLeft(s)).ok) s = applyAction(s, { type: 'REPLACE_HEAD', id: i.id, head: pick.name });
      }
    }
    // A President who reads the record replaces an adviser whose forecasts keep missing, choosing by reputation.
    if (bot.advice === 'check') {
      for (const role of REPLACEABLE) {
        const r = trackRecord(s, role);
        if (r.checked < 6 || r.close / r.checked >= 0.5) continue;
        const pick = poolFor(s, role).filter((o) => !o.refuses).sort((x, y) => y.shown.competence - x.shown.competence)[0];
        if (pick && canReplaceAdviser(s, role, pick.c.name, movesLeft(s)).ok) s = applyAction(s, { type: 'REPLACE_ADVISER', role, name: pick.c.name });
      }
    }
    // The kleptocrat prepares a way out before anything else.
    if (!skip('exit') && bot.name === 'Kleptocrat') {
      for (const id of ['exit_abroad', 'exit_immunity']) if (orderOk(s, id)) s = applyAction(s, { type: 'ORDER', id });
    }
    // Crowd-pleasers: the populist and the machine take what the street or the party wants, from any track.
    if (!skip('pop') && (bot.name === 'Populist' || bot.name === 'Machine')) {
      for (const t of TRACKS) for (const m of t.milestones) {
        // Relief that the street feels is what a crowd-pleaser buys, whether or not it is good for the country.
        const relief = t.id === 'welfare' && (m.id === 'h3' || m.id === 'h7' || (bot.name === 'Populist' && m.id === 'h6'));
        if (!(m.popular || relief) || s.agenda.done.includes(m.id) || s.agenda.active.some((x) => x.id === m.id)) continue;
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
    // The naira: reformers unify the rate early; the kleptocrat defends it and sells the difference.
    if (!skip('fx')) {
      if (bot.name.startsWith('Reformer') && s.turn >= 4 && s.turn <= 8 && orderOk(s, 'fx_float')) s = applyAction(s, { type: 'ORDER', id: 'fx_float' });
      if (bot.name === 'Kleptocrat' && s.turn >= 3 && orderOk(s, 'fx_peg') && (s.fx?.reserves ?? 0) > 15) s = applyAction(s, { type: 'ORDER', id: 'fx_peg' });
      if (bot.name === 'Kleptocrat' && orderOk(s, 'fx_allocation')) s = applyAction(s, { type: 'ORDER', id: 'fx_allocation' });
      if (s.fx?.stance === 'peg' && s.fx.reserves < 8 && orderOk(s, 'fx_managed')) s = applyAction(s, { type: 'ORDER', id: 'fx_managed' });
    }
    if (bot.reforms === 'all' && s.nation.fiscalSpace > 4) s = applyAction(s, { type: 'ORDER', id: 'paydown' });
    // A vacancy on the Supreme Court: the machine and the kleptocrat appoint loyalists the Senate will take; the rest appoint the Bar's choice.
    if (!skip('bench') && bot.name !== 'Do-nothing' && bot.name !== 'Random' && movesLeft(s) > 0) {
      const seat = bench(s).seats.findIndex((j) => !j);
      if (seat >= 0) {
        const loyal = bot.name === 'Machine' || bot.name === 'Kleptocrat';
        const pick = nominees(s).filter((n) => n.confirms).sort((a, b) => (loyal ? Number(b.lean === 'you') - Number(a.lean === 'you') : b.integrity - a.integrity))[0];
        if (pick && canNominate(s, seat, pick.name, movesLeft(s)).ok) s = applyAction(s, { type: 'NOMINATE', seat, name: pick.name });
      }
    }
    // The succession: build up whoever would be strongest and most grateful; the kleptocrat also prepares a way out.
    if (!skip('succ') && bot.name !== 'Do-nothing' && bot.name !== 'Random' && movesLeft(s) > 1) {
      const pick = candidateIds(s).map((id) => candidate(s, id)).sort((a, b) => (b.groomed - a.groomed) * 2 + (b.strength + b.loyalty / 40) - (a.strength + a.loyalty / 40))[0];
      // In the first term only with capital to spare; in the second, as a priority.
      const spare = s.term === 2 ? 25 : (process.env.EARLY === '0' ? 999 : 40);
      if (pick && canGroom(s, pick.id, movesLeft(s)).ok && s.pc > spare) s = applyAction(s, { type: 'GROOM', id: pick.id });
      const r = creditable(s)[0];
      if (pick && r && s.term === 2 && movesLeft(s) > 1 && s.pc > 25 && canCredit(s, pick.id, r.id, movesLeft(s)).ok) s = applyAction(s, { type: 'GROOM_CREDIT', id: pick.id, reform: r.id });
    }
    // Aimed orders: each style reaches for its own weapons, at whoever is least friendly (the default target).
    if (!skip('aim')) {
      const uses: Record<string, string[]> = {
        Kleptocrat: ['waiver', 'asset_sale', 'licence', 'dossier', 'ban_protest', 'detail'],
        Machine: ['project', 'dossier', 'ban_protest', 'detail', 'emergency_rule', 'state_visit'],
        Populist: ['airlift', 'project', 'monument', 'bank_tax'],
        Institutionalist: ['airlift', 'state_visit', 'monument'],
      };
      for (const id of (uses[bot.name] ?? []).filter((x) => !(process.env.DROP ?? '').split(',').includes(x))) {
        if (movesLeft(s) <= 1) break;
        if (s.offers.some((x) => x.id === id) && orderOk(s, id) && s.pc - ORDER_BY_ID[id].pc > 15) s = applyAction(s, { type: 'ORDER', id });
      }
    }
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
        pc: s.pc, margin: projectMargin(s), reforms: s.agenda.done.length, united: s.flags['opposition.united'] ? 1 : 0, broad: s.flags['opposition.broad'] ? 1 : 0, subsidyGone: s.flags['policy.subsidy'] === 'removed' ? 1 : 0, integrity: s.nation.integrity, merger: s.fired['opposition.unites'] ? 1 : 0, delegates: delegates(s), security: s.nation.security, power: s.nation.power, jobs: s.nation.jobs, eurobond: s.debts.eurobond, bonds: s.debts.bonds, ways: s.debts.ways, naira: s.fx?.rate ?? 0, revenue100: revenueAnnual(s) * 100, taxes100: nonOilRevenue(s) * 1200, oilRev100: oilRevenue(s).actual * 1200, capacity: s.nation.capacity, oilp: s.oil.price, ...Object.fromEntries(ZONES.map((z) => [z, s.theatres[z]])),
      });
    }
    s = applyAction(s, { type: 'END_MONTH' });
  }
  return s;
}

const args = process.argv.slice(2);
const runs = Number(args.find((a) => /^\d+$/.test(a)) ?? 200);

if (args.includes('--scenarios')) {
  // Optional filters retain the same seed schedule, so small runs are prefixes of larger runs.
  const option = (name: string) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
  const selected = SCENARIOS.filter((s) => !option('scenario') || s.id === option('scenario'));
  const bots = [BOTS[2], BOTS[4], BOTS[1]].filter((b) => !option('bot') || b.name === option('bot'));
  if (!Number.isSafeInteger(runs) || runs < 1 || !selected.length || !bots.length) throw new Error('Invalid scenario simulation runs or filter');
  const rows: object[] = [];
  for (const sc of selected) {
    const line = bots.map((bot) => {
      let won = 0; let months = 0; const ends: Record<string, number> = {};
      for (let i = 0; i < runs; i++) {
        const seed = 500 + i * 131;
        const previousEveCount = eve[bot.name]?.length ?? 0;
        const s = play(bot, seed, false, { scenario: sc.id });
        const reelected = !!s.flags['election.won'];
        if (reelected) won++;
        months += Math.min(s.turn, 96);
        ends[s.ending ?? '?'] = (ends[s.ending ?? '?'] ?? 0) + 1;
        if (option('results')) rows.push({
          scenario: sc.id, bot: bot.name, index: i, seed, reelected, months: Math.min(s.turn, 96), ending: s.ending,
          eve: (eve[bot.name]?.length ?? 0) > previousEveCount ? eve[bot.name].at(-1) : null,
          final: { treasury: s.nation.fiscalSpace, debt: s.nation.debt, approval: approval(s), hardship: hardship(s), assets: s.assets?.length ?? 0 },
        });
        if (option('results') && ((i + 1) % 16 === 0 || i + 1 === runs)) {
          writeFileSync(option('results')!, JSON.stringify({ runs, completedRows: rows.length, seedFormula: '500 + index * 131', rows }, null, 2) + '\n');
          console.log(`${sc.id}/${bot.name}: ${i + 1}/${runs} complete, ${won} re-elected`);
        }
      }
      return `${bot.name} ${Math.round((won / runs) * 100)}% re-elected, ${Math.round(months / runs)} months`;
    });
    console.log(`${sc.name.padEnd(26)} ${line.join(' · ')}`);
  }
  if (option('results')) writeFileSync(option('results')!, JSON.stringify({ runs, seedFormula: '500 + index * 131', rows }, null, 2) + '\n');
  process.exit(0);
}
if (args.includes('--levers')) {
  // Every order measured from states real presidencies pass through: see tools/levers.ts.
  for (const bot of BOTS.filter((b) => ['Reformer', 'Machine', 'Populist', 'Institutionalist', 'Kleptocrat'].includes(b.name))) for (let i = 0; i < runs; i++) play(bot, 4000 + i * 613);
  measureLevers(SAMPLES!, Number(process.env.AHEAD ?? 6));
  process.exit(0);
}
if (args.includes('--world')) {
  // One world, four Presidents in a row, each inheriting what the last one left.
  for (let w = 0; w < Math.min(runs, 6); w++) {
    let prev: GameState | undefined;
    const order = [BOTS[1], BOTS[2], BOTS[5], BOTS[2]];
    for (const bot of order) {
      const era = prev ? eraShifts(prev, winnerOf(prev)).map((x) => x.title) : [];
      const s = play(bot, 900 + w * 77 + order.indexOf(bot), false, { prev });
      const v = verdict(s);
      if (era.length) console.log(`   era inherited: ${era.join(' · ')}`);
      console.log(`world ${w} · ${v.years} · ${bot.name.padEnd(10)} · ${s.president.partyShort.padEnd(5)} · ${v.epithet.padEnd(30)} · ${s.ending} · debt ${Math.round(s.nation.debt)}% · unpaid ₦${(s.debts.gas + s.debts.contractors + s.debts.pensions).toFixed(1)}tn · reforms ${s.agenda.done.length} · inflation ${Math.round(s.nation.inflation)}% · vp ${Math.round(s.vp?.rel ?? 0)} · pred ${s.predecessor ? Math.round(s.predecessor.rel ?? 0) : '-'} · money men ${TYCOONS.map((x) => Math.round(s.tycoons[x.id].rel)).join('/')}`);
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
for (const bot of BOTS.filter((b) => !process.env.ONLY || process.env.ONLY.split(process.env.ONLY.includes("|") ? "|" : ",").includes(b.name))) {
  const endings: Record<string, number> = {};
  const epithets: Record<string, number> = {};
  const afters: Record<string, number> = {};
  const dims: Record<string, number> = {};
  let elApp = 0, elMargin = 0, elN = 0, elParty = 0;
  const margins: number[] = [];
  let shocks = 0, dep = 0, casesN = 0, convicted = 0, expanded = 0, succRun = 0, succWon = 0, succMargin = 0, succBacked = 0, succStr = 0;
  const loose: Record<string, number> = {};
  let months = 0, reelected = 0, quiet = 0, unique = 0, app = 0, hard = 0, personal = 0;
  let assetsN = 0, abandonedN = 0, betsWon = 0, betsLost = 0, reforms = 0, arrears = 0, debt = 0, saved = 0, gone = 0, owing = 0;
  for (let i = 0; i < runs; i++) {
    const s = play(bot, 1000 + i * 7919);
    const v = verdict(s);
    endings[v.ending] = (endings[v.ending] ?? 0) + 1;
    epithets[v.epithet] = (epithets[v.epithet] ?? 0) + 1;
    afters[v.after.title] = (afters[v.after.title] ?? 0) + 1;
    if (process.env.AFTER) console.log(`     ${v.after.title} | ${s.ending} ally=${!!s.flags['succession.won']} abroad=${!!s.flags['exit.abroad']} imm=${!!s.flags['exit.immunity']} kept=${Math.round(s.purseTaken.personal)} loy=${s.flags['successor.loyalty']} | risk: ${v.after.risk.join('; ')} | shield: ${v.after.shield.join('; ')}`);
    for (const d of v.dims) dims[d.name] = (dims[d.name] ?? 0) + d.score;
    months += Math.min(s.turn, 96);
    if (s.flags['election.won']) reelected++;
    shocks += s.shocks?.seen.length ?? 0;
    dep += dependence(s).v;
    expanded += (s.assets ?? []).reduce((x, a) => x + (a.level ?? 0), 0);
    if (s.succession) { succRun++; if (s.succession.won) succWon++; const st = s.succession.states; const v = st.reduce((a, x) => a + x.voters, 0); succMargin += st.reduce((a, x) => a + (x.share - x.opp) * x.voters, 0) / v; succBacked += s.flags['succession.backed'] ? 1 : 0; succStr += Number(s.flags['succession.strength'] ?? -2); }
    casesN += (s.cases ?? []).length; convicted += (s.cases ?? []).filter((c) => c.outcome === 'convicted').length;
    for (const id of s.agenda.done) if (/^[rhog][0-9]$/.test(id)) loose[id] = (loose[id] ?? 0) + 1;
    if (s.election) { elApp += s.election.approval; elMargin += s.election.margin; elN++; margins.push(s.election.margin); }
    unique += Object.keys(s.fired).length;
    quiet += 0;
    assetsN += (s.assets ?? []).length; abandonedN += (s.placed ?? []).filter((p) => p.kind === "abandoned").length; betsWon += s.ventures.won.length; betsLost += s.ventures.lost.length; reforms += s.agenda.done.length; arrears += s.debts.gas + s.debts.contractors + s.debts.pensions; debt += s.nation.debt; saved += s.funds.abroad + s.funds.buffer + s.funds.infra + s.funds.growth; gone += Object.values(s.people).filter((p) => p.gone).length; owing += s.favours.filter((f) => f.dir === 'owing').length;
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
  console.log(`   after     ${Object.entries(afters).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${pct(n)}`).join(' · ')}`);
  console.log(`   epithets  ${Object.entries(epithets).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} ${pct(n)}`).join(' · ')}`);
  console.log(`   reforms ${(reforms / runs).toFixed(1)} · bets won ${(betsWon / runs).toFixed(1)}, lost ${(betsLost / runs).toFixed(1)} · assets ${(assetsN / runs).toFixed(1)}, abandoned ${(abandonedN / runs).toFixed(1)} · debt service ${(debt / runs).toFixed(0)}% · unpaid ₦${(arrears / runs).toFixed(1)}tn · saved ₦${(saved / runs).toFixed(1)}tn · defections ${(gone / runs).toFixed(1)} · still owes ${(owing / runs).toFixed(1)}`);
  console.log(`   succession elections ${succRun}, party won ${succRun ? Math.round(succWon / succRun * 100) : 0}%, margin ${(succMargin / Math.max(1, succRun)).toFixed(1)}, backed ${succBacked}, strength ${(succStr / Math.max(1, succRun)).toFixed(1)} · expansions ${(expanded / runs).toFixed(2)} · cases ${(casesN / runs).toFixed(1)}, convicted ${(convicted / runs).toFixed(1)} · oil dependence at the end ${(dep / runs).toFixed(0)}% · loose reforms ${Object.entries(loose).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${pct(n)}`).join(' ') || 'none'}`);
  if (revived) { console.log(`   failed bets revived ${(revived / runs).toFixed(2)} per presidency`); revived = 0; }
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
