import { EVENTS } from '../content';
import { MILESTONE_BY_ID, ORDERS, ORDER_BY_ID, type Order } from '../content/agenda';
import { CAST, FINANCE_CANDIDATES } from '../content/names';
import { PEOPLE, PERSON_BY_ID } from '../content/people';
import { STATES, STATE_BY_ID } from '../content/states';
import { addExposure, record } from './archive';
import {
  canDelay, canRescue, canVenture, delay, launchVenture, openedBy, rescue, ventureTick,
} from './bets';
import { movesTotal } from './capital';
import { eventOf } from './cast';
import { SCENARIO_BY_ID } from '../content/scenarios';
import { CFG, dateLabel, termTurnOf } from './config';
import { syncDebt } from './ledger';
import { buildDesk } from './director';
import { describe, diff, snapshot } from './effects';
import { runElection } from './election';
import { callFavour, canCall, canTycoon, initTycoons, regard, tycoonDeal, who, type TycoonOp } from './favours';
import { canRival, rivalDeal, type RivalOp } from './opposition';
import { runOp } from './ops';
import {
  addMark, canDeal, deal, following, governorEffect, governorOf, initPeople, seedMinisters, ministerFor, ministerForEvent, ministerSpeed,
  personView, relWord, replaceMinister, stampMinisters, strongestRival, type PersonOp,
} from './people';
import { buildPapers } from './press';
import { rand, randInt } from './rng';
import { canFocus, initSecurity, offensiveOutcome, setFocus, worstTheatre } from './security';
import { shockTick } from './shocks';
import { abolish, canAbolish, canEstablish, canReplaceHead, establish, replaceHead } from './institutions';
import { INSTITUTION_BY_ID } from '../content/institutions';
import { LINKED, REPLACE_PC, adviserFor, canReplaceAdviser, replaceAdviser, forecast, logAdvice, recommend, secondFor, seedAdvisers } from './advice';
import { POLICY_BY_ID, canRepeal, economyStrength, policyName, repeal } from './policies';
import { applyInheritance, handoverNotes, winnerOf, type Winner } from './succession';
import { verdict } from './legacy';
import { fill } from './text';
import { applyLedger, economyTick, politicsTick } from './tick';
import {
  buildCost, buildSpeed, canBudget, canFund, canPay, canSecuritise, drawsOnInfra, initTreasury, moveFund, pay, payBuild,
  oilOutput, securitise, setBudget,
} from './treasury';
import type {
  Action, ActionId, Aid, ArchiveEntry, Category, Choice, DrawerOp, EndingKind, FrontPage, Fx, GameEvent, GameState, Milestone,
  Nation, Outcome, Setup, Topic, ZoneId,
} from './types';
import { ZONES, ZONE_NAME, addFavour, applyFx, approval, clamp, favoursOwed, hardship, standing, syncSecurity, test } from './vars';

export {
  canDelay, canRescue, canVenture, partnerIn, rescueCost, risksOf, ventureNaira, ventureOdds, ventureStatus, ventureVisible,
} from './bets';

// ---------------------------------------------------------------- new game

/** A new presidency: in a new world, from a chosen inheritance, or in the world the last President left. */
export function newGame(setup: Setup, prev?: GameState): GameState {
  const scenario = SCENARIO_BY_ID[setup.scenario ?? 'standard'] ?? SCENARIO_BY_ID.standard;
  const nation: Nation = {
    inflation: 24, petrolPrice: 950, fiscalSpace: 1.6, debt: 66,
    security: 38, power: 30, capacity: 34, integrity: 28, jobs: 34,
  };
  const home = STATE_BY_ID[setup.home] ?? STATES[0];
  const s: GameState = {
    version: 3,
    setup,
    era: 0,
    startYear: CFG.startYear,
    predecessor: null,
    seed: setup.seed,
    rng: setup.seed | 0,
    phase: 'papers',
    turn: 1,
    term: 1,
    president: {
      name: setup.name.trim() || 'Adewale',
      party: setup.party.trim() || 'Progressive Stakeholders Congress',
      partyShort: setup.partyShort.trim() || 'PSC',
      home: home.id,
      homeZone: home.zone,
      background: setup.background,
      address: setup.address,
    },
    nation,
    petrolRef: 950,
    hist: [{ ...nation }],
    baseline: { ...nation, approval: 50, hardship: 0 },
    pressures: { fuelSupplyStress: 30, wageGrievance: 30, scandalHeat: 20 },
    blocs: { villa: 60, party: 60, street: 52, establishment: 52, press: 55 },
    blocsPrev: { villa: 60, party: 60, street: 52, establishment: 52, press: 55 },
    zones: {} as GameState['zones'],
    approvalPrev: 56,
    stateLean: {},
    pc: 60,
    purse: 0,
    purseTaken: { political: 0, personal: 0 },
    campaign: { chest: 0, rallies: {} },
    chars: {},
    flags: { 'policy.subsidy': 'partial', 'uni.agreement': 'inherited_unfunded', 'econ.inflBias': 3 },
    ledger: [],
    queue: [],
    fired: {},
    choices: {},
    recent: [],
    archive: [],
    exposures: [],
    desk: { lead: null, minors: [], actionsUsed: 0, drawerUsed: false, note: '' },
    news: [],
    papers: [],
    election: null,
    succession: null,
    ending: null,
    // Marks a game made under the current rules, so a save is never adjusted twice.
    counters: { 'rules.theatres': 1, 'rules.policies': 1 },
    agenda: { tracks: setup.priorities.slice(0, 4), done: [], active: [], failed: [] },
    ventures: { active: [], won: [], lost: [], causes: {} },
    shocks: { active: [], seen: [], last: 0 },
    report: [],
    prev: {},
    lastAction: null,
    people: {},
    opposition: {},
    oppLog: [],
    offers: [],
    debts: {} as GameState['debts'],
    funds: {} as GameState['funds'],
    oil: { price: 74, output: 1.75, prev: 74 },
    budget: { year: CFG.startYear, benchmark: 70, alloc: {} as GameState['budget']['alloc'], due: false },
    favours: [],
    tycoons: {},
    theatres: {} as GameState['theatres'],
    focus: null,
    used: {},
    stories: [],
    bets: {},
  };
  initPeople(s);
  initSecurity(s);
  initTreasury(s);
  initTycoons(s);

  for (const z of ZONES) {
    const lean = (rand(s) * 2 - 1) * 4 + (z === home.zone ? 4 : 0);
    s.zones[z] = { approval: 56 + lean, lean };
  }
  for (const st of STATES) s.stateLean[st.id] = (rand(s) * 2 - 1) * 7;

  for (const c of CAST) s.chars[c.id] = { ...c, rel: 40, notes: [] };
  const fin = FINANCE_CANDIDATES.find((c) => c.name === setup.finance) ?? FINANCE_CANDIDATES[0];
  s.chars.fin = { ...fin, rel: 40, notes: [] };
  seedAdvisers(s);
  seedMinisters(s, () => rand(s));
  // Which Finance Minister was chosen on the certificate: that choice has its own files.
  s.flags['fin.pick'] = ['gwarzo', 'ekpenyong', 'lohor'][Math.max(0, FINANCE_CANDIDATES.indexOf(fin))];

  const bump = (fx: Fx[]) => fx.forEach((f) => applyFx(s, f));
  switch (setup.background) {
    case 'governor': bump([['bloc.party', 10], ['nation.integrity', -3], ['pressure.scandalHeat', 6]]); break;
    case 'technocrat': bump([['bloc.establishment', 8], ['nation.capacity', 3], ['bloc.party', -8]]); break;
    case 'legislator': bump([['bloc.party', 5], ['bloc.villa', -5], ['pc', 6]]); break;
    case 'outsider': bump([['bloc.street', 10], ['bloc.press', 6], ['bloc.party', -10], ['bloc.establishment', -6]]); break;
  }
  // The appointment is a decision like any other.
  if (fin.competence >= 5) bump([['bloc.establishment', 6], ['bloc.party', -6]]);
  if (fin.clout >= 4) bump([['bloc.party', 6]]);
  if (fin.integrity <= 2) bump([['pressure.scandalHeat', 8]]);

  s.archive = [{
    id: 'a-fin', turn: 0, eventId: 'transition', choiceId: 'finance', category: 'politics',
    headline: `Appointed ${fin.name} as Minister of Finance.`, sig: 2, touches: {},
  }];

  let winner: Winner | null = null;
  if (prev) {
    // The world as the last President left it.
    winner = winnerOf(prev);
    applyInheritance(s, prev, winner);
  } else {
    // A new world, from the chosen inheritance.
    Object.assign(s.nation, scenario.nation ?? {});
    Object.assign(s.pressures, scenario.pressures ?? {});
    Object.assign(s.blocs, scenario.blocs ?? {});
    Object.assign(s.debts, scenario.debts ?? {});
    Object.assign(s.funds, scenario.funds ?? {});
    Object.assign(s.theatres, scenario.theatres ?? {});
    Object.assign(s.flags, scenario.flags ?? {});
    if (scenario.nation?.petrolPrice) s.petrolRef = scenario.nation.petrolPrice * (scenario.id === 'reformer' ? 0.8 : 0.9);
    if (scenario.oil) s.oil = { price: scenario.oil, prev: scenario.oil, output: s.oil.output, path: scenario.oilPath };
    if (scenario.approval) for (const z of ZONES) s.zones[z].approval += scenario.approval;
    s.agenda.done = [...(scenario.done ?? [])];
    s.archive = [...scenario.history.map(([ago, headline, touches]) => inherited(-ago, headline, touches)), ...s.archive];
    if (s.flags['policy.subsidy'] === 'removed') s.counters['order.subsidy_end'] = -999;
  }
  syncDebt(s);
  syncSecurity(s);
  s.oil.output = oilOutput(s);

  stampMinisters(s);
  // Judged against the mood on an ordinary day, not on inauguration day.
  s.baseline = { ...s.nation, approval: approval(s) - 6, hardship: hardship(s) };
  s.prev = { ...snapshot(s), hardship: hardship(s) };
  s.blocsPrev = { ...s.blocs };
  s.approvalPrev = approval(s);
  buildDesk(s);
  refreshOffers(s);
  // What was already unpaid on the first morning, for the verdict to measure against.
  s.counters['base.arrears'] = s.debts.gas + s.debts.contractors + s.debts.pensions;
  s.papers = inaugural(s, prev, winner, scenario.farewell);
  return s;
}

/** The first morning's papers. */
function inaugural(s: GameState, prev: GameState | undefined, winner: Winner | null, farewell: string): FrontPage[] {
  const backer = who(s, String(s.flags.financier));
  const date = dateLabel(1, s.startYear);
  const arrears = s.debts.gas + s.debts.contractors + s.debts.pensions;
  const owed = `Debt service takes ${Math.round(s.nation.debt)}% of revenue, and ₦${arrears.toFixed(1)}tn is unpaid to gas suppliers, contractors and pensioners.`;
  const first: FrontPage = {
    outlet: 'chronicle', stance: 'record', turn: 1, date,
    lead: fill(s, '{NAME} SWORN IN, PROMISES "A NEW DAWN"'),
    standfirst: '',
    body: prev && winner
      ? fill(s, `${winner.how} The new President took the oath at Eagle Square and pledged to "hit the ground running". ${handoverNotes(prev).slice(0, 3).join(' ')} ${winner.sameParty ? '' : 'Governors and senators elected on the outgoing party\'s ticket have, almost without exception, discovered that they were always with the new one.'}`)
      : fill(s, `The new President took the oath at Eagle Square before a crowd that had heard it before. In a 43-minute address the President pledged to "hit the ground running". The handover notes run to 2,400 pages. The section on what the government owes is brief, and the figures in it are not. ${owed}`),
    others: [
      prev ? `FORMER PRESIDENT ${prev.president.name.toUpperCase()} LEAVES ABUJA; "${verdict(prev).epithet.toUpperCase()}", SAY HISTORIANS` : farewell,
      `DEBT SERVICE NOW TAKES ${Math.round(s.nation.debt)}% OF REVENUE — DEBT OFFICE`,
    ],
    sidebar: { kicker: 'OVERHEARD AT EAGLE SQUARE', text: '"Let us give them one year. Then we will know." — a civil servant, to nobody in particular.' },
    special: 'INAUGURATION EDITION',
  };
  const second: FrontPage = {
    outlet: 'rejoinder', stance: 'hostile', turn: 1, date, strap: 'The other side',
    lead: `WHO PAID FOR THE INAUGURATION? ASK ${backer.short.toUpperCase()}`,
    fact: fill(s, '{NAME} SWORN IN AS PRESIDENT'),
    standfirst: 'This newspaper wishes the new President well, and will be keeping a list.',
    body: `${backer.name}, ${backer.title.toLowerCase()}, sat in the second row at Eagle Square, between two governors. Nobody who financed a campaign of that size has ever done so as a gift. The President owes, and the country will learn in time what the repayment is.`,
    others: ['GOVERNORS\' FORUM "LOOKS FORWARD TO WORKING WITH" THE PRESIDENT IT DELIVERED', 'THREE OPPOSITION LEADERS ATTEND; NONE APPLAUDS'],
    special: 'INAUGURATION EDITION',
    owner: `Backs ${fill(s, '{OPP}')}`,
  };
  return [first, second];
}

function inherited(turn: number, headline: string, touches: Record<string, number>): ArchiveEntry {
  return { id: `i${turn}`, turn, eventId: 'inherited', choiceId: '', category: 'inherited', headline, sig: 2, touches };
}

// ---------------------------------------------------------------- choices

export interface Availability { visible: boolean; ok: boolean; reason?: string; overdraft?: number }

export function availability(s: GameState, c: Choice): Availability {
  if (c.requires && !test(s, c.requires)) {
    return c.locked ? { visible: true, ok: false, reason: c.locked } : { visible: false, ok: false };
  }
  if (c.purse && s.purse < c.purse) {
    return s.purse > 0 || s.exposures.length > 0
      ? { visible: true, ok: false, reason: 'The drawer does not hold enough.' }
      : { visible: false, ok: false };
  }
  if (c.naira && c.naira > s.nation.fiscalSpace && s.nation.debt >= CFG.economy.noLendingAbove) {
    return { visible: true, ok: false, reason: 'There is no money, and nobody will lend it.' };
  }
  // Short of capital, the President can still act. The party and the Villa pay the difference.
  if (c.pc && s.pc < c.pc) return { visible: true, ok: true, overdraft: c.pc - s.pc };
  return { visible: true, ok: true };
}

function pickOutcome(s: GameState, c: Choice): Outcome {
  for (const o of c.outcomes) {
    if (!test(s, o.when)) continue;
    if (o.chance !== undefined && rand(s) >= o.chance) continue;
    return o;
  }
  return c.outcomes[c.outcomes.length - 1];
}

const TOPIC: Record<string, Topic> = {
  economy: 'money', labour: 'labour', security: 'security', infrastructure: 'power', politics: 'politics',
  scandal: 'scandal', ceremonial: 'general', fortune: 'general', temptation: 'scandal',
};

/** How far one effect makes a story good or bad news. */
function newsWeightOf(f: Fx): number {
  const [t, d] = f;
  if (t === 'approval') return d * 2;
  if (t === 'bloc.street' || t === 'bloc.press') return d;
  if (t === 'nation.inflation') return -d * 1.5;
  if (t === 'nation.petrolPrice') return -d / 100;
  if (t === 'nation.fiscalSpace' || t === 'nation.debt') return 0;
  if (t.startsWith('nation.')) return d * 0.8;
  if (t.startsWith('theatre.')) return -d * 0.6;
  if (t.startsWith('zone.') && t.endsWith('.approval')) return d * 0.5;
  if (t === 'pressure.scandalHeat' || t === 'pressure.wageGrievance' || t === 'pressure.fuelSupplyStress') return -d * 0.2;
  if (t === 'bonus.inflation') return -d * 2;
  return 0;
}

// ---- help attached to a decision

/** The minister who can be put in front of this file, if there is one willing. */
export function shieldFor(s: GameState, e: GameEvent): { id: string; ok: boolean; reason?: string } | null {
  if (e.slot !== 'lead') return null;
  const id = ministerForEvent(e.category, e.id);
  if (!id || !s.people[id]) return null;
  if (standing(s, id) < 35) return { id, ok: false, reason: 'Will not take the blame for you. You are not on those terms.' };
  if ((s.counters[`shield.${id}`] ?? -99) > s.turn - 6) return { id, ok: false, reason: 'Took the blame for something else this half-year. Twice would end a career.' };
  return { id, ok: true };
}

/** What a favour or a minister changes about an outcome's immediate effects. */
export function aidedFx(s: GameState, fx: Fx[] | undefined, aid: Aid | undefined): Fx[] {
  if (!fx || !aid) return fx ?? [];
  const f = aid.favour !== undefined ? s.favours.find((x) => x.id === aid.favour && x.dir === 'owed') : undefined;
  const soften = f ? 1 - 0.25 * f.size : 1;
  return fx.map(([t, d, sp]) => {
    let v = d;
    if (v < 0 && f && (t === 'bloc.party' || t === 'bloc.establishment' || t === 'bloc.villa' || t.startsWith('person.'))) v *= soften;
    if (v < 0 && aid.minister && (t === 'approval' || t === 'bloc.street' || t === 'bloc.press' || (t.startsWith('zone.') && t.endsWith('.approval')))) v *= 0.5;
    return [t, v, sp] as Fx;
  });
}

/** Political capital a favour saves on a decision. */
export function aidedPc(s: GameState, pc: number | undefined, aid: Aid | undefined): number {
  if (!pc) return 0;
  const f = aid?.favour !== undefined ? s.favours.find((x) => x.id === aid.favour && x.dir === 'owed') : undefined;
  return f ? Math.max(0, pc - 5 * f.size) : pc;
}

/** The favours that could be called in on a file: anyone who owes you and still takes your calls. */
export function favoursFor(s: GameState, e: GameEvent) {
  if (e.slot !== 'lead') return [];
  return favoursOwed(s).filter((f) => regard(s, f.who) >= 30 && !s.people[f.who]?.gone);
}

function applyOutcome(s: GameState, e: GameEvent, choiceId: string, o: Outcome, cost?: Choice, aid?: Aid): string {
  const entry = record(s, e.id, choiceId, e.category, o.archive, o.sig ?? (e.slot === 'lead' ? 2 : 1), !!o.exposure);
  if (cost?.naira) applyFx(s, ['nation.fiscalSpace', -cost.naira], entry.touches);
  const fx = aidedFx(s, o.fx, aid);
  let net = 0;
  for (const f of fx) {
    applyFx(s, f, entry.touches);
    // The price of saying no: cleaning up leaves the party less to share. It falls as institutions strengthen.
    if (f[0] === 'nation.integrity' && f[1] > 0) {
      applyFx(s, ['bloc.party', -f[1] * CFG.cleanCost * (1 - s.nation.integrity / 120)], entry.touches);
    }
    // A governor shares the credit, and the blame, for what happens in the zone.
    const zm = /^zone\.(\w+)\.approval$/.exec(f[0]);
    if (zm) {
      const g = governorOf(zm[1] as ZoneId);
      const st = g ? s.people[g.id] : undefined;
      if (st && !st.gone) st.rel = clamp(st.rel + f[1] * 0.5, 0, 100);
    }
    if (f[0] === 'approval' || f[0].startsWith('nation.') && f[0] !== 'nation.fiscalSpace' && f[0] !== 'nation.debt') {
      net += f[0] === 'approval' ? f[1] : (f[0] === 'nation.inflation' || f[0] === 'nation.petrolPrice' ? 0 : f[1] * 0.5);
    }
  }
  // A file from the Senate or the Governors' Forum is a dealing with the person who runs it.
  const counterpart = e.cast ? null : /Senate/.test(e.office ?? '') ? 'sen_pres' : /Governors/.test(e.office ?? '') ? 'gov_ss' : /Appropriation|Budget Office/.test(e.office ?? '') ? 'sen_approp' : null;
  if (counterpart && s.people[counterpart] && !s.people[counterpart].gone) {
    const d = fx.reduce((a, f) => a + (f[0] === 'bloc.party' ? f[1] : 0), 0);
    if (d) s.people[counterpart].rel = clamp(s.people[counterpart].rel + d * 1.2, 0, 100);
  }
  let extra = '';
  for (const op of o.ops ?? []) {
    const t = runOp(s, op);
    if (t) extra += ` ${t}`;
  }
  if (o.favour) addFavour(s, o.favour[0], o.favour[1], o.favour[2], fill(s, o.archive));
  for (const l of o.later ?? []) {
    const after = Array.isArray(l.after) ? randInt(s, l.after[0], l.after[1]) : l.after;
    s.ledger.push({ due: s.turn + after, fx: l.fx, label: l.label, when: l.when, note: l.note, causeId: entry.id });
    for (const [t, d] of l.fx) entry.touches[t] = (entry.touches[t] ?? 0) + d;
  }
  for (const [k, v] of Object.entries(o.flags ?? {})) {
    s.flags[k] = v;
    entry.touches[`flag:${k}`] = 1;
  }
  for (const f of o.follow ?? []) {
    if (f.chance !== undefined && rand(s) >= f.chance) continue;
    const after = Array.isArray(f.after) ? randInt(s, f.after[0], f.after[1]) : f.after;
    s.queue.push({ event: f.event, due: s.turn + after, when: f.when });
  }
  // The minister whose brief it is carries the result on their record.
  const brief = e.slot === 'lead' ? ministerForEvent(e.category, e.id) : null;
  if (brief && Math.abs(net) >= 2.5 && !aid?.minister) addMark(s, brief, net > 0 ? 1 : -1, entry.headline);
  if (o.news) {
    // Whether this is good or bad news for the government, judged on everything it did.
    const mood = (o.fx ?? []).reduce((a, f) => a + newsWeightOf(f), 0) + (o.later ?? []).reduce((a, l) => a + l.fx.reduce((b, f) => b + newsWeightOf(f) * 0.5, 0), 0);
    const cast = e.cast ? Object.keys(e.cast)[0] : undefined;
    s.news.push({
      chronicle: o.news[0], street: o.news[1], weight: o.newsWeight ?? (e.slot === 'lead' ? e.intensity + 1 : 1.5),
      body: o.result, valence: Math.abs(mood) < 1.5 ? 0 : Math.sign(mood), topic: e.topic ?? TOPIC[e.category] ?? 'general', grave: e.tone === 'grave',
      about: (cast && s.desk.lead?.cast?.[cast]) || brief || undefined,
    });
  }
  if (o.exposure) addExposure(s, o.exposure, entry.id, entry.headline);
  for (const [id, delta, note] of o.memory ?? []) {
    const c = s.chars[id];
    if (!c) continue;
    c.rel = clamp(c.rel + delta, -100, 100);
    c.notes.push({ turn: s.turn, delta, note });
  }
  s.choices[e.id] = choiceId;
  if (o.ends) end(s, o.ends);
  return fill(s, o.result) + extra;
}

function choose(s: GameState, eventId: string, choiceId: string, aid?: Aid): void {
  const item = s.desk.lead?.eventId === eventId ? s.desk.lead : s.desk.minors.find((m) => m.eventId === eventId);
  const e = eventOf(s, item);
  if (!item || item.resolved || !e) return;
  const c = e.choices.find((x) => x.id === choiceId);
  if (!c) return;

  // Help the President has attached: someone who owes a favour, or a minister to stand in front.
  const favour = aid?.favour !== undefined ? favoursFor(s, e).find((f) => f.id === aid.favour) : undefined;
  const shield = aid?.minister ? shieldFor(s, e) : null;
  const used: Aid = { favour: favour?.id, minister: !!shield?.ok };
  const pc = aidedPc(s, c.pc, used);
  const a = availability(s, { ...c, pc });
  if (!a.ok) return;

  const before = snapshot(s);
  if (a.overdraft) overdraw(s, a.overdraft);
  if (pc) s.pc = clamp(s.pc - pc, 0, 100);
  if (c.purse) {
    s.purse -= c.purse;
    s.purseTaken.political += c.purse;
  }
  // What the adviser said, before anything happened, so it can be checked against what does.
  const aidFx = (fx: Fx[] | undefined) => aidedFx(s, fx, used);
  const adv = adviserFor(s, e);
  const said = adv ? forecast(s, e, c, adv.role, aidFx) : null;
  const advised = adv ? recommend(s, e, adv.role, aidFx, (x) => availability(s, { ...x, pc: aidedPc(s, x.pc, used) }).ok) : null;
  const picked = pickOutcome(s, c);
  if (adv && said) logAdvice(s, e, c, adv.role, said, advised, picked, aidFx);
  let result = applyOutcome(s, e, c.id, picked, c, used);
  if (favour) {
    const w = who(s, favour.who);
    s.favours = s.favours.filter((f) => f.id !== favour.id);
    const cost = 3 * favour.size;
    if (s.people[favour.who]) s.people[favour.who].rel = clamp(s.people[favour.who].rel - cost, 0, 100);
    if (s.tycoons[favour.who]) s.tycoons[favour.who].rel = clamp(s.tycoons[favour.who].rel - cost, 0, 100);
    result += ` ${w.short} made the calls that needed making. That debt is now paid.`;
  }
  if (shield?.ok) {
    const st = s.people[shield.id];
    const w = who(s, shield.id);
    st.rel = clamp(st.rel - 8, 0, 100);
    s.counters[`shield.${shield.id}`] = s.turn;
    addMark(s, shield.id, -1, `Took the blame: ${fill(s, e.title)}`);
    result += ` ${w.name} announced it, defended it and was blamed for it. That is on the minister's record now, and the minister knows who put it there.`;
  }
  item.resolved = { choiceId: c.id, label: fill(s, c.label), result, signed: c.sign, changes: diff(before, snapshot(s)) };
}

// ---------------------------------------------------------------- actions

export const ACTION_COST: Record<ActionId, number> = { address: 6, tour: 0, audit: 8, convene: 0, rally: 0 };

function overdraw(s: GameState, shortfall: number): void {
  applyFx(s, ['bloc.party', -shortfall * CFG.overdraft.party]);
  applyFx(s, ['bloc.villa', -shortfall * CFG.overdraft.villa]);
}

export function movesLeft(s: GameState): number {
  return Math.max(0, movesTotal(s) - s.desk.actionsUsed);
}

export function canAct(s: GameState, a: ActionId): { ok: boolean; reason?: string } {
  if (movesLeft(s) <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < ACTION_COST[a]) return { ok: false, reason: 'Not enough political capital.' };
  if (a === 'audit' && s.archive.some((x) => x.eventId === 'action.audit' && s.turn - x.turn < 8)) {
    return { ok: false, reason: 'The auditors are still in the ministries.' };
  }
  if (a === 'convene' && s.archive.some((x) => x.eventId === 'action.convene' && s.turn - x.turn < 4)) {
    return { ok: false, reason: 'They met last quarter. Another summit so soon would be noticed.' };
  }
  if (a === 'rally') {
    const tt = termTurnOf(s.turn);
    if (s.term !== 1 || tt < CFG.campaignOpensTermTurn || tt > CFG.electionTermTurn || s.flags['ticket.lost']) {
      return { ok: false, reason: 'The campaign period is not open.' };
    }
  }
  return { ok: true };
}

function act(s: GameState, a: ActionId, zone?: ZoneId): void {
  if (!canAct(s, a).ok) return;
  const before = snapshot(s);
  s.pc -= ACTION_COST[a];
  s.desk.actionsUsed += 1;
  const z = zone ?? s.president.homeZone;
  const h = hardship(s);
  let entry: ArchiveEntry;
  let result: string;
  const run = (fx: Fx[]) => fx.forEach((f) => applyFx(s, f, entry.touches));

  switch (a) {
    case 'address':
      entry = record(s, 'action.address', '', 'action', 'Addressed the nation.', 1);
      if (h < 58) {
        run([['approval', 4, 1], ['bloc.press', 3], ['bloc.street', 4]]);
        result = 'The broadcast is well received. The facts, for once, supported the speech.';
        s.news.push({ chronicle: 'PRESIDENT ADDRESSES NATION, URGES PATIENCE', street: '{NAME} SPEAKS. THIS TIME, PEOPLE LISTENED', weight: 2.5, valence: 1, topic: 'general' });
      } else {
        run([['approval', -1.5, 1], ['bloc.street', -2], ['bloc.press', -1]]);
        result = 'The broadcast runs for 28 minutes. The generator in the viewing centre runs for 19.';
        s.news.push({ chronicle: 'PRESIDENT ADDRESSES NATION, URGES PATIENCE', street: '"PATIENCE" TRENDS AS {NAME} BEGS NIGERIANS AGAIN', weight: 2.5, valence: -1, topic: 'prices' });
      }
      break;
    case 'tour': {
      entry = record(s, 'action.tour', z, 'action', `Toured the ${ZONE_NAME[z]}.`, 1);
      const recent = s.archive.filter((x) => x.eventId === 'action.tour' && x.choiceId === z && s.turn - x.turn <= 10).length - 1;
      run([[`zone.${z}.approval`, Math.max(2, (s.zones[z].approval < 40 ? 9 : 7) - recent * 2.5), 1], ['bloc.street', 2], ['approval', 0.5]]);
      // The governor is seen beside the President, which is worth something to both.
      const g = governorOf(z);
      if (g && s.people[g.id] && !s.people[g.id].gone) s.people[g.id].rel = clamp(s.people[g.id].rel + 3, 0, 100);
      result = `Three states in four days. The ${ZONE_NAME[z]} has seen the President in person, which is more than it expected.${g ? ` ${personView(s, g.id).short} was at your side throughout, and made sure the cameras noticed.` : ''}`;
      s.news.push({ chronicle: `PRESIDENT BEGINS WORKING VISIT TO ${ZONE_NAME[z].toUpperCase()}`, street: `{NAME} LANDS IN ${ZONE_NAME[z].toUpperCase()}; ROADS REPAIRED OVERNIGHT`, weight: 2, valence: 1, topic: 'politics', about: g?.id });
      break;
    }
    case 'audit':
      entry = record(s, 'action.audit', '', 'action', 'Ordered a forensic audit of ministry accounts.', 2);
      run([['nation.integrity', 4], ['pressure.scandalHeat', -15], ['bloc.party', -4], ['bloc.villa', -2], ['bloc.press', 4]]);
      s.ledger.push({
        due: s.turn + randInt(s, 4, 6), fx: [['nation.integrity', 2], ['nation.fiscalSpace', 0.25]],
        label: 'Audit recoveries are paid into the treasury.', causeId: entry.id,
        note: ['AUDIT RECOVERS ₦150BN FROM MINISTRY ACCOUNTS', 'AUDIT FINDS ₦150BN. NOW WHO GO JAIL?'],
      });
      entry.touches['nation.integrity'] = (entry.touches['nation.integrity'] ?? 0) + 1.5;
      // The auditors go where the money is. A minister with something to hide is found out.
      for (const p of PEOPLE) {
        if (p.group === 'minister' && (personView(s, p.id).integrity ?? 3) <= 2) addMark(s, p.id, -1, 'Audit: questions over the ministry\'s accounts');
      }
      result = 'The auditors arrive on Monday. By Tuesday several directors have discovered urgent medical appointments abroad.';
      s.news.push({ chronicle: 'PRESIDENT ORDERS FORENSIC AUDIT OF MINISTRIES', street: 'AUDIT: BIG MEN ARE SUDDENLY "TRAVELLING"', weight: 2.5, valence: 1, topic: 'scandal' });
      break;
    case 'convene':
      entry = record(s, 'action.convene', '', 'action', 'Convened a stakeholders\' meeting.', 1);
      run([['pc', 5], ['bloc.establishment', 2], ['bloc.party', 2]]);
      s.counters.stakeholders = (s.counters.stakeholders ?? 0) + 1;
      result = 'Stakeholders have been extensively engaged. A communiqué was issued. Everyone left satisfied and nothing has changed.';
      s.news.push({ chronicle: 'PRESIDENT MEETS STAKEHOLDERS, CALLS TALKS "FRUITFUL"', street: `STAKEHOLDERS MEETING NUMBER ${s.counters.stakeholders}. WE ARE COUNTING`, weight: 1, valence: 0, topic: 'politics' });
      break;
    case 'rally':
      entry = record(s, 'action.rally', z, 'action', `Held a campaign rally in the ${ZONE_NAME[z]}.`, 1);
      s.campaign.rallies[z] = (s.campaign.rallies[z] ?? 0) + 1;
      run([[`zone.${z}.approval`, 2.5]]);
      result = `The stadium is full. Whether they came for the President or for the rice will be known in ${['February', 'due course'][s.turn % 2]}.`;
      s.news.push({ chronicle: `PRESIDENT TAKES CAMPAIGN TO ${ZONE_NAME[z].toUpperCase()}`, street: `RALLY: CROWD FULL GROUND FOR ${ZONE_NAME[z].toUpperCase()}`, weight: 2, valence: 1, topic: 'politics' });
      break;
  }
  s.lastAction = { text: fill(s, result), changes: diff(before, snapshot(s)) };
}

// ---------------------------------------------------------------- the drawer

export const DRAWER_COST: Record<DrawerOp, number> = { security_vote: 0, assembly: 6, campaign: 5, villa: 3 };

export function canDrawer(s: GameState, op: DrawerOp): { ok: boolean; reason?: string } {
  if (op === 'security_vote') return s.desk.drawerUsed ? { ok: false, reason: 'Already drawn this month.' } : { ok: true };
  if (s.purse < DRAWER_COST[op]) return { ok: false, reason: 'Not enough in the drawer.' };
  if (op === 'campaign' && (s.term !== 1 || termTurnOf(s.turn) < CFG.primaryTermTurn - 6 || s.flags['ticket.lost'])) {
    return { ok: false, reason: 'There is no campaign to fund yet.' };
  }
  return { ok: true };
}

function drawer(s: GameState, op: DrawerOp): void {
  if (!canDrawer(s, op).ok) return;
  const cost = DRAWER_COST[op];
  s.purse -= cost;
  s.purseTaken.political += cost;
  switch (op) {
    case 'security_vote': {
      s.desk.drawerUsed = true;
      const n = (s.counters.securityVote = (s.counters.securityVote ?? 0) + 1);
      const entry = record(s, 'drawer.security_vote', '', 'temptation', 'Drew ₦4bn from the security vote for purposes not stated.', 1, true);
      applyFx(s, ['purse', 4], entry.touches);
      applyFx(s, ['nation.integrity', -0.6], entry.touches);
      applyFx(s, ['nation.security', -0.15], entry.touches);
      addExposure(s, { kind: 'personal', amount: 4, witnesses: ['cos'], trail: n % 4 === 0 ? 1 : 0 }, entry.id, entry.headline);
      break;
    }
    case 'assembly': {
      const entry = record(s, 'drawer.assembly', '', 'temptation', 'Provided logistics to members of the National Assembly.', 1, true);
      applyFx(s, ['bloc.party', 9], entry.touches);
      applyFx(s, ['pc', 9], entry.touches);
      applyFx(s, ['nation.integrity', -1], entry.touches);
      for (const p of PEOPLE) if (p.group === 'senator' && s.people[p.id] && !s.people[p.id].gone) s.people[p.id].rel = clamp(s.people[p.id].rel + 4, 0, 100);
      addExposure(s, { kind: 'political', amount: cost, witnesses: ['sen_pres'], trail: 1 }, entry.id, entry.headline);
      break;
    }
    case 'campaign':
      record(s, 'drawer.campaign', '', 'temptation', 'Moved ₦5bn from the drawer to the campaign.', 1, true);
      s.campaign.chest += cost;
      break;
    case 'villa': {
      const entry = record(s, 'drawer.villa', '', 'temptation', 'Appreciated the staff of the Villa.', 1, true);
      applyFx(s, ['bloc.villa', 6], entry.touches);
      applyFx(s, ['rel.cos', 5], entry.touches);
      break;
    }
  }
}

// ---------------------------------------------------------------- month end

function end(s: GameState, kind: EndingKind): void {
  s.ending = kind;
  s.purseTaken.personal = s.purse;
  s.phase = 'verdict';
}

/** Half-way through a term, three states elect governors. It is the country's first verdict on the President. */
function midterm(s: GameState): void {
  if (termTurnOf(s.turn) !== 24) return;
  const zones: ZoneId[] = s.term === 1 ? ['NW', 'SW', 'SE'] : ['NE', 'NC', 'SS'];
  const rival = strongestRival(s);
  const lines: string[] = [];
  let won = 0;
  for (const z of zones) {
    const g = governorOf(z);
    const score = (s.zones[z].approval - 47) + governorEffect(s, z) * 2 + (s.blocs.party - 50) * 0.1 - (rival.strength - 40) * 0.25 + (rand(s) * 2 - 1) * 4;
    const ok = score > 0;
    if (ok) won++;
    const gv = g ? personView(s, g.id) : null;
    lines.push(`${ZONE_NAME[z]}: ${ok ? 'held' : 'lost'}. Approval there is ${Math.round(s.zones[z].approval)}%${gv ? `, and ${gv.short} is ${s.people[g!.id].gone ? 'with the opposition' : relWord(gv.standing).toLowerCase()}` : ''}.`);
  }
  const before = snapshot(s);
  const fx: Fx[] = won === 3 ? [['pc', 8], ['bloc.party', 5], [`rival.${rival.id}`, -4]]
    : won === 2 ? [['pc', 3], ['bloc.party', 2]]
      : won === 1 ? [['pc', -3], ['bloc.party', -3], [`rival.${rival.id}`, 3]]
        : [['pc', -8], ['bloc.party', -7], [`rival.${rival.id}`, 6]];
  const entry = record(s, 'midterm', String(won), 'politics', `Off-cycle governorship elections: your party won ${won} of 3.`, won === 3 || won === 0 ? 3 : 2);
  for (const f of fx) applyFx(s, f, entry.touches);
  s.news.push({
    chronicle: won >= 2 ? `RULING PARTY TAKES ${won} OF 3 GOVERNORSHIPS` : `OPPOSITION TAKES ${3 - won} OF 3 GOVERNORSHIPS`,
    street: won >= 2 ? `PRESIDENT PARTY WIN ${won} STATE OUT OF 3` : `OPPOSITION DON COLLECT ${3 - won} STATE. PRESIDENT, YOU DEY SEE AM?`,
    weight: 6.5, valence: won >= 2 ? 1 : -1, topic: 'politics', about: rival.id,
    body: `Three states voted for governors this weekend, in the first test of the President at the ballot since the general election. ${lines.join(' ')}`,
  });
  s.report.push({
    kind: won >= 2 ? 'reform' : 'failure', title: `Governorship elections: your party won ${won} of 3`,
    cause: 'A zone is won on its approval of you, on whether its governor is with you, and on how strong your challenger is.',
    text: lines.join(' '), changes: diff(before, snapshot(s)),
  });
}

function advance(s: GameState): void {
  for (const m of s.desk.minors) {
    if (m.resolved) continue;
    const e = eventOf(s, m);
    if (e?.ignored) {
      const result = applyOutcome(s, e, 'ignored', e.ignored);
      m.resolved = { choiceId: 'ignored', label: 'No reply', result };
    }
  }
  if (s.ending) return;

  s.blocsPrev = { ...s.blocs };
  s.approvalPrev = approval(s);
  s.lastAction = null;
  s.report = [];
  s.prev = { ...snapshot(s), hardship: hardship(s) };
  s.turn += 1;

  if (s.turn > CFG.termLength * 2) return end(s, 'term_limit');
  if (s.turn === CFG.termLength + 1) {
    if (!s.flags['election.won']) return end(s, s.flags['ticket.lost'] ? 'ticket_denied' : 'defeated');
    s.term = 2;
    s.campaign = { chest: 0, rallies: {} };
    applyFx(s, ['pc', 10]);
    s.news.push({ chronicle: '{NAME} SWORN IN FOR SECOND TERM, PROMISES TO "CONSOLIDATE"', street: 'FOUR MORE YEARS: "THIS TIME NO EXCUSE" — NIGERIANS', weight: 7, valence: 1, topic: 'politics' });
  }

  applyLedger(s);
  agendaTick(s);
  ventureTick(s);
  economyTick(s);
  politicsTick(s);
  midterm(s);
  shockTick(s);

  const tt = termTurnOf(s.turn);
  if (s.term === 2 && tt === CFG.electionTermTurn + 1 && !s.succession) {
    s.succession = runElection(s, 'succession');
    const backed = !!s.flags['succession.backed'];
    s.flags['succession.won'] = s.succession.won;
    s.news.push(s.succession.won
      ? { chronicle: `${s.president.partyShort} RETAINS PRESIDENCY${backed ? '; PRESIDENT\'S CANDIDATE WINS' : ''}`, street: 'CONTINUITY WINS. THE STREET SHRUGS', weight: 8, valence: 1, topic: 'politics' }
      : { chronicle: 'OPPOSITION WINS PRESIDENCY; {OPP} DECLARED PRESIDENT-ELECT', street: 'CHANGE! {OPPARTY} TAKES ASO ROCK', weight: 8, valence: -1, topic: 'politics' });
  }
  if (s.term === 1 && s.flags['ticket.lost'] && tt === CFG.electionTermTurn + 1) {
    s.news.push({ chronicle: 'NATION VOTES; INCUMBENT WATCHES FROM THE VILLA', street: 'ELECTION DAY AND THE PRESIDENT NO DEY BALLOT', weight: 7, valence: -1, topic: 'politics' });
  }

  buildDesk(s);
  refreshOffers(s);
  buildPapers(s);
  s.phase = 'papers';
}

/** What is stopping the month from ending, if anything. */
export function blocked(s: GameState): string | null {
  if (s.desk.lead && !s.desk.lead.resolved) return 'A file is waiting';
  if (s.budget.due) return 'The budget is waiting';
  return null;
}

function endMonth(s: GameState): void {
  if (blocked(s)) return;
  const tt = termTurnOf(s.turn);
  if (s.term === 1 && tt === CFG.electionTermTurn && !s.election && !s.flags['ticket.lost']) {
    s.election = runElection(s, 'reelection');
    s.phase = 'election';
    return;
  }
  advance(s);
}

function electionDone(s: GameState): void {
  if (!s.election || s.phase !== 'election') return;
  if (s.election.won) {
    s.flags['election.won'] = true;
    applyFx(s, ['pc', 15]);
    applyFx(s, ['bloc.party', 8]);
    record(s, 'election', 'won', 'politics', 'Re-elected for a second term.', 3);
    // A narrow win is challenged.
    // With results published from the polling unit, only a very narrow win is worth contesting.
    if (s.election.margin < (s.agenda.done.includes('r4') ? 4 : 7)) s.queue.push({ event: 'tribunal.petition', due: s.turn + 1 });
    s.news.push({ chronicle: '{NAME} RE-ELECTED', street: '{NAME} AGAIN! NIGERIA DECIDES', weight: 9, valence: 1, topic: 'politics' });
  } else {
    s.flags['election.lost'] = true;
    applyFx(s, ['bloc.party', -12]);
    applyFx(s, ['bloc.villa', -10]);
    record(s, 'election', 'lost', 'politics', 'Lost the presidential election.', 3);
    s.news.push({ chronicle: 'ELECTORAL COMMISSION DECLARES {OPP} WINNER OF PRESIDENTIAL ELECTION', street: 'E DON HAPPEN: {NAME} LOSES', weight: 9, valence: -1, topic: 'politics' });
  }
  advance(s);
}

// ---------------------------------------------------------------- reducer

export function applyAction(state: GameState, action: Action): GameState {
  const s = structuredClone(state);
  if (s.phase === 'verdict') return s;
  if (action.type === 'ELECTION_DONE') { electionDone(s); return s; }
  if (action.type === 'DISMISS_PAPER') { if (s.phase === 'papers') s.phase = 'desk'; return s; }
  if (s.phase !== 'desk') return s;
  switch (action.type) {
    case 'CHOOSE': choose(s, action.eventId, action.choiceId, action.aid); break;
    case 'ACT': act(s, action.action, action.zone); break;
    case 'DRAWER': drawer(s, action.op); break;
    case 'LAUNCH': launch(s, action.id, action.grease); break;
    case 'VENTURE': launchVenture(s, action.id); break;
    case 'VENTURE_DELAY': if (canDelay(s, action.id).ok) note(s, delay(s, action.id)); break;
    case 'VENTURE_RESCUE': if (canRescue(s, action.id).ok) note(s, rescue(s, action.id)); break;
    case 'PERSON': person(s, action.id, action.op); break;
    case 'REPLACE_MINISTER': minister(s, action.id, action.kind); break;
    case 'ORDER': order(s, action.id, action.target, action.level); break;
    case 'REPLACE_FIN': replaceFinance(s, action.name); break;
    case 'PAY_DEBT': payDebt(s, action.id, action.amount); break;
    case 'SECURITISE': if (canSecuritise(s).ok) { const b = snapshot(s); const t = securitise(s); record(s, 'treasury.securitise', '', 'action', 'Converted the central bank overdraft into bonds.', 2); s.lastAction = { text: t, changes: diff(b, snapshot(s)) }; } break;
    case 'FUND': fund(s, action.id, action.amount); break;
    case 'BUDGET': budget(s, action.benchmark, action.alloc); break;
    case 'FAVOUR': favour(s, action.id, action.use); break;
    case 'TYCOON': tycoon(s, action.id, action.op); break;
    case 'RIVAL': rival(s, action.id, action.op); break;
    case 'FOCUS': focus(s, action.zone); break;
    case 'ESTABLISH': if (canEstablish(s, action.id, action.head, movesLeft(s)).ok) {
      s.desk.actionsUsed += 1;
      const out = establish(s, action.id, action.head);
      record(s, `institution.${action.id}`, 'establish', 'action', out.text, 3);
      s.news.push({ chronicle: `FG ESTABLISHES ${INSTITUTION_BY_ID[action.id].name.replace(/^(A|The) /, '').toUpperCase()}`, street: 'NEW AGENCY DON LAND', weight: 4, valence: 1, topic: 'reform' });
      s.lastAction = { text: out.text, changes: out.changes };
    } break;
    case 'REPLACE_HEAD': if (canReplaceHead(s, action.id, action.head, movesLeft(s)).ok) {
      const b = snapshot(s);
      s.desk.actionsUsed += 1;
      const t = replaceHead(s, action.id, action.head);
      record(s, `institution.${action.id}`, 'rehead', 'action', t, 2);
      s.lastAction = { text: t, changes: diff(b, snapshot(s)) };
    } break;
    case 'ABOLISH': if (canAbolish(s, action.id).ok) {
      const b = snapshot(s);
      const t = abolish(s, action.id);
      record(s, `institution.${action.id}`, 'abolish', 'action', t, 2);
      s.lastAction = { text: t, changes: diff(b, snapshot(s)) };
    } break;
    case 'REPLACE_ADVISER': if (canReplaceAdviser(s, action.role, action.name, movesLeft(s)).ok) {
      const b = snapshot(s);
      s.pc = clamp(s.pc - REPLACE_PC, 0, 100);
      s.desk.actionsUsed += 1;
      const t = replaceAdviser(s, action.role, action.name);
      record(s, `adviser.${action.role}`, 'replace', 'politics', t, 2);
      s.lastAction = { text: t, changes: diff(b, snapshot(s)) };
    } break;
    case 'SECOND_OPINION': {
      const item = s.desk.lead?.eventId === action.eventId ? s.desk.lead : s.desk.minors.find((m) => m.eventId === action.eventId);
      const e = item ? eventOf(s, item) : undefined;
      const first = e ? adviserFor(s, e) : null;
      const other = first ? secondFor(s, first.role) : null;
      if (item && !item.resolved && !item.second && other && movesLeft(s) > 0) { item.second = other.role; s.desk.actionsUsed += 1; }
    } break;
    case 'REPEAL': if (canRepeal(s, action.id).ok) {
      const b = snapshot(s);
      const t = repeal(s, action.id);
      record(s, `repeal.${action.id}`, '', 'action', `Repealed: ${policyName(action.id).toLowerCase()}.`, 3);
      s.lastAction = { text: t, changes: diff(b, snapshot(s)) };
    } break;
    case 'END_MONTH': endMonth(s); break;
  }
  return s;
}

function note(s: GameState, text: string): void {
  s.lastAction = { text, changes: [] };
}

export type { Category };

// ---------------------------------------------------------------- the treasury

function payDebt(s: GameState, id: GameState['debts'] extends Record<infer K, number> ? K : never, amount: number): void {
  if (!canPay(s, id, amount).ok) return;
  const before = snapshot(s);
  const text = pay(s, id, amount);
  record(s, `treasury.pay.${id}`, '', 'action', `Paid ₦${Math.round(Math.min(amount, 99) * 1000)}bn towards: ${id === 'ways' ? 'the central bank overdraft' : id === 'eurobond' ? 'foreign bonds' : id === 'bonds' ? 'domestic bonds' : id === 'gas' ? 'the gas suppliers' : id === 'contractors' ? 'contractors' : 'pensions and salaries'}.`, s.debts[id] <= 0.001 ? 2 : 1);
  s.lastAction = { text, changes: diff(before, snapshot(s)) };
}

function fund(s: GameState, id: keyof GameState['funds'], amount: number): void {
  if (!canFund(s, id, amount).ok) return;
  const before = snapshot(s);
  const text = moveFund(s, id, amount);
  record(s, `treasury.fund.${id}`, amount > 0 ? 'in' : 'out', 'action', text.split('.')[0] + '.', 1);
  s.lastAction = { text, changes: diff(before, snapshot(s)) };
}

function budget(s: GameState, benchmark: number, alloc: GameState['budget']['alloc']): void {
  if (!canBudget(s, benchmark, alloc).ok) return;
  const before = snapshot(s);
  const text = setBudget(s, benchmark, alloc);
  record(s, 'budget', String(s.budget.year), 'action', `Signed the ${s.budget.year} budget on an oil price of $${benchmark}.`, 2);
  s.lastAction = { text, changes: diff(before, snapshot(s)) };
}

// ---------------------------------------------------------------- the agenda

export function agendaSlots(s: GameState): number {
  return CFG.agenda.slots + (s.nation.capacity >= CFG.agenda.slotsAtCapacity ? 1 : 0) + (s.nation.capacity >= CFG.agenda.slotsAtCapacity2 ? 1 : 0);
}

export function launchCost(s: GameState, m: Milestone): number {
  const track = MILESTONE_BY_ID[m.id]?.track;
  const priority = !!track && s.agenda.tracks.includes(track.id);
  return Math.round(m.pc * (priority ? 1 : CFG.agenda.offAgendaPc));
}

/** How a reform's money is found: from the Infrastructure Fund first, where it applies. */
export function launchMoney(s: GameState, m: Milestone): { fund: number; treasury: number } {
  const track = MILESTONE_BY_ID[m.id]?.track;
  return buildCost(s, m.naira, !!track && drawsOnInfra(track.id));
}

export type MilestoneStatus = 'done' | 'active' | 'next' | 'later';

export function milestoneStatus(s: GameState, id: string): MilestoneStatus {
  if (s.agenda.done.includes(id)) return 'done';
  if (s.agenda.active.some((a) => a.id === id)) return 'active';
  const entry = MILESTONE_BY_ID[id];
  if (!entry) return 'later';
  const i = entry.track.milestones.findIndex((m) => m.id === id);
  const prior = entry.track.loose || entry.track.milestones.slice(0, i).every((m) => s.agenda.done.includes(m.id));
  return prior ? 'next' : 'later';
}

export interface LaunchCheck { ok: boolean; reason?: string; grease?: boolean }

export function canLaunch(s: GameState, id: string): LaunchCheck {
  const entry = MILESTONE_BY_ID[id];
  if (!entry) return { ok: false };
  const st = milestoneStatus(s, id);
  if (st === 'done') return { ok: false, reason: 'Delivered.' };
  if (st === 'active') return { ok: false, reason: 'Under way.' };
  if (st === 'later') return { ok: false, reason: 'The previous reform must be delivered first.' };
  const failed = s.agenda.failed.filter((f) => f.id === id).pop();
  if (failed && s.turn - failed.turn < CFG.agenda.retryAfter) {
    return { ok: false, reason: `Defeated in the Assembly. It can be brought back in ${CFG.agenda.retryAfter - (s.turn - failed.turn)} months.` };
  }
  if (s.agenda.active.length >= agendaSlots(s)) return { ok: false, reason: `The government can carry ${agendaSlots(s)} reforms at once. State capacity of 50 adds a sixth, and 65 a seventh.` };
  if (s.pc < launchCost(s, entry.m)) return { ok: false, reason: `Needs ${launchCost(s, entry.m)} political capital.` };
  if (launchMoney(s, entry.m).treasury > s.nation.fiscalSpace && s.nation.debt >= CFG.economy.noLendingAbove) {
    return { ok: false, reason: 'There is no money, and nobody will lend it.' };
  }
  if (entry.m.needs && !test(s, entry.m.needs)) {
    // The votes are not there. They can be bought.
    return { ok: false, reason: entry.m.needsText ?? 'Not yet possible.', grease: s.purse >= CFG.agenda.greasePurse };
  }
  return { ok: true };
}

function launch(s: GameState, id: string, grease = false): void {
  const check = canLaunch(s, id);
  if (!check.ok && !(grease && check.grease)) return;
  const { m, track } = MILESTONE_BY_ID[id];
  const before = snapshot(s);
  s.pc = clamp(s.pc - launchCost(s, m), 0, 100);
  const entry = record(s, `reform.${id}`, 'launch', 'action', `Launched: ${m.name}.`, 1);
  payBuild(s, m.naira, drawsOnInfra(track.id), entry.touches);
  for (const fx of m.start ?? []) applyFx(s, fx, entry.touches);
  for (const [t, d] of m.done) entry.touches[t] = (entry.touches[t] ?? 0) + d;
  const greased = grease && !check.ok;
  if (greased) {
    s.purse -= CFG.agenda.greasePurse;
    s.purseTaken.political += CFG.agenda.greasePurse;
    const sealed = record(s, `reform.${id}`, 'grease', 'temptation', `Provided logistics to the Assembly to pass: ${m.name}.`, 1, true);
    applyFx(s, ['nation.integrity', -1.5], sealed.touches);
    addExposure(s, { kind: 'political', amount: CFG.agenda.greasePurse, witnesses: ['sen_pres'], trail: 1 }, sealed.id, sealed.headline);
  }
  s.agenda.active.push({ id, progress: 0, greased });
  const min = ministerFor(track.id);
  const who2 = min ? personView(s, min.id) : null;
  s.lastAction = {
    text: greased
      ? `${m.name} is under way. The Assembly's objections have been addressed, in cash. ${m.months} months.`
      : `${m.name} is under way${who2 ? ` under ${who2.name}` : ''}. The ministry estimates ${m.months} months, which you may read as a minimum.${drawsOnInfra(track.id) && s.debts.contractors > 0.5 ? ' Contractors are owed for earlier work, and this will run 15% slower until they are paid.' : ''}`,
    changes: diff(before, snapshot(s)),
  };
}

function agendaTick(s: GameState): void {
  const austerity = s.nation.debt > CFG.economy.debtCliff && s.nation.fiscalSpace <= 0.05;
  // Digital government moves paper faster.
  const speed = (0.8 + s.nation.capacity / 200) * (austerity ? 0.5 : 1) * (s.agenda.done.includes('v3') ? 1.08 : 1);
  const still: GameState['agenda']['active'] = [];
  for (const a of s.agenda.active) {
    const entry = MILESTONE_BY_ID[a.id];
    if (!entry) continue;
    // Some reforms hurt before they pay: the tariff rises before the light improves.
    for (const f of entry.m.during ?? []) applyFx(s, f);
    const building = drawsOnInfra(entry.track.id) ? buildSpeed(s) : 1;
    a.progress += (100 / entry.m.months) * speed * ministerSpeed(s, entry.track.id) * building;
    if (a.progress < 100) { still.push(a); continue; }
    const { m, track } = entry;
    const before = snapshot(s);
    const min = ministerFor(track.id);

    // A reform that needs the Assembly is voted on at the end. Without the party, or logistics, it falls.
    if (m.needs && !a.greased && !test(s, m.needs)) {
      const rec = record(s, `reform.${m.id}`, 'failed', 'action', `Defeated in the National Assembly: ${m.name}.`, 3);
      applyFx(s, ['pc', -6], rec.touches);
      applyFx(s, ['bloc.press', -3], rec.touches);
      s.agenda.failed.push({ id: m.id, turn: s.turn });
      if (min) addMark(s, min.id, -1, `Lost in the Assembly: ${m.name}`);
      const against = PEOPLE.filter((p) => p.group === 'senator' && standing(s, p.id) < 50).map((p) => personView(s, p.id).short);
      const why = against.length
        ? `${against.join(' and ')} did not deliver ${against.length === 1 ? 'the' : 'their'} votes.`
        : 'The party as a whole was not with you when it came to the vote.';
      s.news.push({
        chronicle: `ASSEMBLY REJECTS PRESIDENT'S ${m.name.toUpperCase()}`, street: 'SENATORS DON KILL PRESIDENT BILL', weight: 6, valence: -1, topic: 'reform', about: 'sen_pres',
        body: `The bill fell on second reading. ${why} The money already spent on preparing it is gone.`,
      });
      s.report.push({
        kind: 'failure', title: `Defeated in the Assembly: ${m.name}`, cause: track.name,
        text: `${why} The money is spent. The bill can be brought back in a year, and a senator who owes you could carry it.`,
        changes: diff(before, snapshot(s)),
      });
      continue;
    }

    const rec = record(s, `reform.${m.id}`, 'done', 'action', m.archive, 3);
    for (const fx of m.done) applyFx(s, fx, rec.touches);
    for (const [k, v] of Object.entries(m.flags ?? {})) { s.flags[k] = v; rec.touches[`flag:${k}`] = 1; }
    applyFx(s, ['pc', s.agenda.tracks.includes(track.id) ? CFG.agenda.donePriorityPc : CFG.agenda.donePc]);
    s.agenda.done.push(m.id);
    // Paying the gas suppliers is what this reform is.
    if (m.id === 'p1') { s.debts.gas = 0; }
    if (min) addMark(s, min.id, 2, `Delivered: ${m.name}`);
    const opened = openedBy(s, m.id);
    s.news.push({ chronicle: m.news[0], street: m.news[1], weight: 6, valence: 1, topic: 'reform', about: min?.id, body: `${m.archive} ${m.blurb}` });
    const structural = describe(m.done.filter((f) => f[0].startsWith('bonus.')));
    s.report.push({
      kind: 'reform', title: `Delivered: ${m.name}`, cause: track.name,
      text: [
        m.lasting ? `For as long as it stands: ${m.lasting}` : '',
        POLICY_BY_ID[m.id] ? `It is now a standing policy, costed every month against the economy in the Treasury. ${POLICY_BY_ID[m.id].now(s).why}` : '',
        opened.length ? `This opens ${opened.length === 1 ? 'a big bet' : 'big bets'} the country could now make: ${opened.map((v) => v.name).join('; ')}.` : '',
      ].filter(Boolean).join(' ') || undefined,
      changes: [...diff(before, snapshot(s)), ...structural],
    });
  }
  s.agenda.active = still;
}

// ---------------------------------------------------------------- executive powers

function orderSpent(s: GameState, o: Order): boolean {
  const last = s.counters[`order.${o.id}`];
  return last !== undefined && (o.cooldown === 0 || s.turn - last < o.cooldown);
}

/** Standing powers worth showing: not impossible, and not already used up. */
export function standingOrders(s: GameState): Order[] {
  return ORDERS.filter((o) => !o.situational && test(s, o.when) && !(o.cooldown === 0 && s.counters[`order.${o.id}`] !== undefined));
}

/** A few powers of the moment are on offer at a time. They lapse when the moment passes. */
function refreshOffers(s: GameState): void {
  s.offers = s.offers.filter((x) => {
    const o = ORDER_BY_ID[x.id];
    const keep = o && x.until > s.turn && test(s, o.when) && !orderSpent(s, o);
    // An option you let lapse does not come straight back.
    if (!keep) s.counters[`lapsed.${x.id}`] = s.turn;
    return keep;
  });
  const rested = (id: string) => s.counters[`lapsed.${id}`] === undefined || s.turn - s.counters[`lapsed.${id}`] >= CFG.agenda.offerRest;
  const pool = ORDERS.filter((o) => o.situational && test(s, o.when) && !orderSpent(s, o) && rested(o.id) && !s.offers.some((x) => x.id === o.id));
  while (s.offers.length < CFG.agenda.offers && pool.length) {
    const i = Math.floor(rand(s) * pool.length);
    const [o] = pool.splice(i, 1);
    s.offers.push({ id: o.id, since: s.turn, until: s.turn + (o.window ?? 4) });
  }
}

/** The level chosen on a dial, or the order as it stands if it has none. */
export function orderLevel(o: Order, level?: number): { scale: number; pc: number; naira: number; word: string; index: number } {
  if (!o.levels?.length) return { scale: 1, pc: o.pc, naira: o.naira, word: '', index: -1 };
  const i = clamp(level ?? Math.floor(o.levels.length / 2), 0, o.levels.length - 1);
  const l = o.levels[i];
  return { scale: l.scale, pc: l.pc ?? o.pc, naira: l.naira ?? o.naira, word: l.word, index: i };
}

/** What the economy does to an order, and why. */
export function orderEcon(o: Order, s: GameState): { factor: number; note: string; applies: (t: string, v: number) => boolean } | null {
  const pct = (f: number) => `${Math.round(f * 100)}%`;
  if (o.econ === 'revenue') {
    const v = economyStrength(s).v;
    const f = clamp(v / 50, 0.5, 1.5);
    return { factor: f, applies: (t) => t === 'bonus.fiscal' || t === 'nation.fiscalSpace', note: `The economy is at ${Math.round(v)} of 100: it pays ${pct(f)} of what it would in an ordinary year.` };
  }
  if (o.econ === 'credit') {
    const f = 1 + Math.max(0, s.nation.debt - 70) / 100;
    return { factor: f, applies: (t) => t.startsWith('debt.'), note: f > 1.005 ? `Debt service is at ${Math.round(s.nation.debt)}% of revenue: lenders want ₦${f.toFixed(2)} back for every ₦1 lent.` : 'Debt service is low enough that lenders charge the ordinary rate.' };
  }
  if (o.econ === 'popularity') {
    const a = approval(s);
    const f = clamp(a / 50, 0.5, 1.5);
    return { factor: f, applies: (t) => t === 'pc', note: `Approval is ${Math.round(a)}%: popularity buys ${pct(f)} of the usual leverage.` };
  }
  if (o.econ === 'anger') {
    const g = s.pressures.wageGrievance;
    const f = clamp(g / 50, 0.5, 1.6);
    return { factor: f, applies: (t) => t === 'bloc.street' || t === 'approval' || t === 'pressure.wageGrievance', note: `Labour anger is at ${Math.round(g)}: the angrier the young, the more it is worth to be seen listening (${pct(f)}).` };
  }
  if (o.econ === 'party') {
    const f = clamp((100 - s.blocs.party) / 50, 0.5, 1.5);
    return { factor: f, applies: (t) => t === 'bloc.party' || t === 'pc', note: `The party is at ${Math.round(s.blocs.party)}: a convention does most when the party is unhappy (${pct(f)}).` };
  }
  if (o.econ === 'weak') {
    const v = economyStrength(s).v;
    const f = clamp((100 - v) / 50, 0.5, 1.5);
    return { factor: f, applies: (t, d) => d < 0 && (t === 'nation.jobs' || t === 'approval' || t === 'bloc.street'), note: `The economy is at ${Math.round(v)} of 100: the weaker it is, the more this hurts (${pct(f)} of the usual damage).` };
  }
  return null;
}

export function canOrder(s: GameState, o: Order, level?: number): { ok: boolean; reason?: string } {
  const lv = orderLevel(o, level);
  if (o.situational && !s.offers.some((x) => x.id === o.id)) return { ok: false, reason: 'The moment has passed.' };
  if (o.when && !test(s, o.when)) return { ok: false, reason: o.lockedText ?? 'Not available.' };
  const last = s.counters[`order.${o.id}`];
  if (last !== undefined) {
    if (o.cooldown === 0) return { ok: false, reason: 'Already done.' };
    const wait = o.cooldown - (s.turn - last);
    if (wait > 0) return { ok: false, reason: `Available again in ${wait} months.` };
  }
  if (movesLeft(s) <= 0) return { ok: false, reason: 'This month\'s moves are used.' };
  if (s.pc < lv.pc) return { ok: false, reason: `Needs ${lv.pc} political capital.` };
  if (lv.naira > s.nation.fiscalSpace && s.nation.debt >= CFG.economy.noLendingAbove) {
    return { ok: false, reason: 'There is no money, and nobody will lend it.' };
  }
  return { ok: true };
}

/** The effects an order would have, for display. */
export function orderOutcome(o: Order, s?: GameState, target?: ZoneId, level?: number): Outcome {
  if (o.target === 'theatre' && s) {
    const base: Outcome = { result: o.result, fx: o.fx, later: o.later, flags: o.flags, follow: o.follow, news: o.news, archive: o.archive, sig: o.sig, exposure: o.exposure };
    return offensiveOutcome(s, target ?? worstTheatre(s), base);
  }
  if (o.levels || o.econ) {
    const lv = orderLevel(o, level);
    const econ = s ? orderEcon(o, s) : null;
    const scale = ([t, v, ...rest]: Fx): Fx => {
      const f = econ && econ.applies(t, v) ? econ.factor : 1;
      return [t, Math.round(v * lv.scale * f * 1000) / 1000, ...rest] as Fx;
    };
    const amt = (x: string, up = false) => x.replace(/\{AMT\}/g, up ? lv.word.toUpperCase() : lv.word);
    return {
      result: amt(o.result), fx: o.fx?.map(scale), later: o.later?.map((l) => ({ ...l, fx: l.fx.map(scale) })), flags: o.flags, follow: o.follow,
      news: [amt(o.news[0], true), amt(o.news[1], true)], archive: amt(o.archive), sig: o.sig, exposure: o.exposure,
    };
  }
  if (o.event) {
    const c = EVENTS[o.event[0]]?.choices.find((x) => x.id === o.event![1]);
    if (c) return c.outcomes[c.outcomes.length - 1];
  }
  return { result: o.result, fx: o.fx, later: o.later, flags: o.flags, follow: o.follow, news: o.news, archive: o.archive, sig: o.sig, exposure: o.exposure };
}

function order(s: GameState, id: string, target?: ZoneId, level?: number): void {
  const o = ORDER_BY_ID[id];
  if (!o || !canOrder(s, o, level).ok) return;
  const lv = orderLevel(o, level);
  const before = snapshot(s);
  s.pc = clamp(s.pc - lv.pc, 0, 100);
  s.desk.actionsUsed += 1;
  s.counters[`order.${o.id}`] = s.turn;
  s.offers = s.offers.filter((x) => x.id !== o.id);
  const outcome = orderOutcome(o, s, target, level);
  const source = o.event ? EVENTS[o.event[0]] : undefined;
  const category: Category = o.group === 'security' ? 'security' : o.group === 'economy' || o.group === 'relief' ? 'economy' : 'politics';
  const pseudo = source ?? ({ id: `order.${o.id}`, category, slot: 'minor', intensity: 4 } as GameEvent);
  if (source && o.event) {
    // The President acted first. The file that would have raised it is closed.
    (s.fired[source.id] ??= []).push(s.turn);
    s.choices[source.id] = o.event[1];
  }
  const text = applyOutcome(s, pseudo, o.event?.[1] ?? 'order', { ...outcome, newsWeight: outcome.newsWeight ?? 5 });
  if (lv.naira) applyFx(s, ['nation.fiscalSpace', -lv.naira]);
  s.lastAction = { text, changes: diff(before, snapshot(s)) };
}

export function financeAlternatives(s: GameState) {
  return FINANCE_CANDIDATES.filter((c) => c.name !== s.chars.fin?.name);
}

function replaceFinance(s: GameState, name: string): void {
  const next = FINANCE_CANDIDATES.find((c) => c.name === name);
  const old = s.chars.fin;
  if (!next || !old || next.name === old.name || movesLeft(s) <= 0 || s.pc < 10) return;
  const before = snapshot(s);
  s.pc -= 10;
  s.desk.actionsUsed += 1;
  const entry = record(s, 'action.finance', '', 'action', `Dismissed ${old.name} and appointed ${next.name} as Minister of Finance.`, 3);
  applyFx(s, ['bloc.party', (next.clout - old.clout) * 3], entry.touches);
  applyFx(s, ['bloc.establishment', (next.competence - old.competence) * 3], entry.touches);
  applyFx(s, ['bloc.villa', -3], entry.touches);
  s.chars.fin = { ...next, rel: 40, notes: [] };
  s.flags['fin.replaced'] = true;
  s.news.push({ chronicle: `PRESIDENT SACKS FINANCE MINISTER, NAMES ${next.short.toUpperCase()}`, street: `FINANCE MINISTER DON GO. ${next.short.toUpperCase()} DON ENTER`, weight: 5, valence: 0, topic: 'people' });
  s.lastAction = {
    text: `${old.name} is thanked for services rendered. ${next.name} is sworn in before lunch.`,
    changes: diff(before, snapshot(s)),
  };
}

// ---------------------------------------------------------------- people, money and rivals

function person(s: GameState, id: string, op: PersonOp): void {
  if (!canDeal(s, id, op, movesLeft(s)).ok) return;
  const before = snapshot(s);
  // Saying no costs nothing but the relationship.
  if (op !== 'refuse') s.desk.actionsUsed += 1;
  const out = deal(s, id, op);
  record(s, `person.${id}`, op, 'politics', out.archive, op === 'grant' ? 2 : 1, out.sealed);
  s.lastAction = { text: out.text, changes: diff(before, snapshot(s)) };
}

/** With published scorecards, the case for a sacking is already made. */
export function sackCost(s: GameState, id?: string): number {
  // The scorecard makes the case; a following makes it dearer.
  return (s.agenda.done.includes('v4') ? 3 : 6) + (id ? following(s, id) : 0);
}

function minister(s: GameState, id: string, kind: 'technocrat' | 'party'): void {
  const cost = sackCost(s, id);
  if (movesLeft(s) <= 0 || s.pc < cost || !s.people[id] || PERSON_BY_ID[id]?.group !== 'minister') return;
  const before = snapshot(s);
  s.pc -= cost;
  s.desk.actionsUsed += 1;
  const old = personView(s, id);
  const out = replaceMinister(s, id, kind);
  // A minister who also advises you: the new one's loyalty is their own. A party nominee serves whoever nominated them.
  const role = Object.keys(LINKED).find((r) => LINKED[r] === id);
  if (role && s.chars[role]) {
    const sponsor = PERSON_BY_ID[id]?.sponsor;
    const c = s.chars[role];
    c.loyalty = kind === 'technocrat' ? 3 : 2;
    c.patron = kind === 'technocrat' ? 'president' : sponsor ?? 'self';
    c.rep = { competence: s.people[id]?.competence ?? c.competence, loyalty: kind === 'technocrat' ? 3 : 4 };
  }
  record(s, `person.${id}`, 'replace', 'politics', out.archive, 2);
  s.news.push({
    chronicle: `PRESIDENT DROPS ${old.short.toUpperCase()} IN CABINET CHANGE`, street: `${old.short.toUpperCase()} DON GO. ANOTHER PERSON DON ENTER`,
    weight: 3.5, valence: 0, topic: 'people', about: id, body: out.text,
  });
  s.lastAction = { text: out.text, changes: diff(before, snapshot(s)) };
}

function favour(s: GameState, id: number, use: string): void {
  const f = s.favours.find((x) => x.id === id);
  if (!f || !canCall(s, f, movesLeft(s)).ok) return;
  const before = snapshot(s);
  s.desk.actionsUsed += 1;
  const out = callFavour(s, f, use);
  record(s, `favour.${f.who}`, use, 'politics', out.archive, 1, true);
  s.lastAction = { text: out.text, changes: diff(before, snapshot(s)) };
}

function tycoon(s: GameState, id: string, op: TycoonOp): void {
  if (!canTycoon(s, id, op, movesLeft(s)).ok) return;
  const before = snapshot(s);
  s.desk.actionsUsed += 1;
  const out = tycoonDeal(s, id, op);
  record(s, `tycoon.${id}`, op, op === 'take' ? 'temptation' : 'politics', out.archive, 2, out.sealed);
  s.lastAction = { text: out.text, changes: diff(before, snapshot(s)) };
}

function rival(s: GameState, id: string, op: RivalOp): void {
  if (!canRival(s, id, op, movesLeft(s)).ok) return;
  const before = snapshot(s);
  s.desk.actionsUsed += 1;
  const out = rivalDeal(s, id, op);
  record(s, `rival.${id}`, op, op === 'spoiler' ? 'temptation' : 'politics', out.archive, 2, out.sealed);
  s.lastAction = { text: out.text, changes: diff(before, snapshot(s)) };
}

function focus(s: GameState, zone: ZoneId | null): void {
  if (!canFocus(s, zone, movesLeft(s)).ok) return;
  s.desk.actionsUsed += 1;
  const text = setFocus(s, zone);
  record(s, 'security.focus', zone ?? 'none', 'action', zone ? `Concentrated the security effort on the ${ZONE_NAME[zone]}.` : 'Returned forces to their usual stations.', 1);
  s.lastAction = { text, changes: [] };
}
