import { EVENTS } from '../content';
import { MILESTONE_BY_ID, ORDERS, ORDER_BY_ID, type Order } from '../content/agenda';
import { VENTURE_BY_ID, type Venture } from '../content/ventures';
import { CAST, FINANCE_CANDIDATES } from '../content/names';
import { STATES, STATE_BY_ID } from '../content/states';
import { CFG, termTurnOf } from './config';
import { buildDesk } from './director';
import { movesTotal } from './capital';
import { describe, diff, snapshot } from './effects';
import { canDeal, deal, initPeople, ministerSpeed, replaceMinister, type PersonOp } from './people';
import { runElection } from './election';
import { buildPaper } from './press';
import { rand, randInt } from './rng';
import { fill } from './text';
import { applyLedger, economyTick, politicsTick } from './tick';
import type {
  Action, ActionId, ArchiveEntry, Category, Choice, DrawerOp, EndingKind, ExposureSpec, Fx,
  GameEvent, GameState, Milestone, Nation, Outcome, Setup, ZoneId,
} from './types';
import { ZONES, ZONE_NAME, applyFx, approval, clamp, hardship, test } from './vars';

// ---------------------------------------------------------------- new game

const ZONE_SECURITY: Record<ZoneId, number> = { NW: -8, NE: -10, NC: -6, SW: 10, SE: 2, SS: 4 };

export function newGame(setup: Setup): GameState {
  const nation: Nation = {
    inflation: 24, petrolPrice: 950, fiscalSpace: 1.6, debt: 66,
    security: 38, power: 30, capacity: 34, integrity: 28, jobs: 34,
  };
  const home = STATE_BY_ID[setup.home] ?? STATES[0];
  const s: GameState = {
    version: 2,
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
    paper: null,
    election: null,
    succession: null,
    ending: null,
    counters: {},
    agenda: { tracks: setup.priorities.slice(0, 4), done: [], active: [], failed: [] },
    ventures: { active: [], won: [], lost: [] },
    report: [],
    prev: {},
    lastAction: null,
    people: {},
    opposition: {},
    offers: [],
  };
  initPeople(s);

  for (const z of ZONES) {
    const lean = (rand(s) * 2 - 1) * 4 + (z === home.zone ? 4 : 0);
    s.zones[z] = { approval: 56 + lean, security: ZONE_SECURITY[z], lean };
  }
  for (const st of STATES) s.stateLean[st.id] = (rand(s) * 2 - 1) * 7;

  for (const c of CAST) s.chars[c.id] = { ...c, rel: 40, notes: [] };
  const fin = FINANCE_CANDIDATES.find((c) => c.name === setup.finance) ?? FINANCE_CANDIDATES[0];
  s.chars.fin = { ...fin, rel: 40, notes: [] };

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

  s.archive = [
    inherited(-30, 'Signed the university funding agreement. No budget line was created.', { 'flag:uni.agreement': 1, 'pressure.wageGrievance': 6 }),
    inherited(-20, 'Deferred maintenance of the transmission network for a third year.', { 'nation.power': -6 }),
    inherited(-14, 'Capped the pump price of petrol and funded the difference by borrowing.', { 'nation.fiscalSpace': -1.2, 'nation.debt': 6, 'pressure.fuelSupplyStress': 12 }),
    inherited(-9, 'Borrowed to pay salaries.', { 'nation.debt': 5 }),
    inherited(-6, 'Announced that the refinery was 95% complete.', { 'counter.refinery': 1 }),
    {
      id: 'a-fin', turn: 0, eventId: 'transition', choiceId: 'finance', category: 'politics',
      headline: `Appointed ${fin.name} as Minister of Finance.`, sig: 2, touches: {},
    },
  ];

  s.baseline = { ...s.nation, approval: 50, hardship: hardship(s) };
  s.prev = { ...snapshot(s), hardship: hardship(s) };
  s.blocsPrev = { ...s.blocs };
  s.approvalPrev = approval(s);
  buildDesk(s);
  refreshOffers(s);
  s.paper = {
    outlet: 'chronicle',
    turn: 1,
    lead: fill(s, '{NAME} SWORN IN, PROMISES "A NEW DAWN"'),
    standfirst: fill(s, 'The new President took the oath at Eagle Square before a crowd that had heard it before. In a 43-minute address the President pledged to "hit the ground running."'),
    others: [
      fill(s, 'OUTGOING ADMINISTRATION SAYS IT IS LEAVING THE ECONOMY "ON A SOUND FOOTING"'),
      fill(s, 'HANDOVER NOTES RUN TO 2,400 PAGES; TREASURY SECTION IS BRIEF'),
    ],
    number: { label: 'Debt service, share of revenue', value: '66%' },
    sidebar: { kicker: 'OVERHEARD AT EAGLE SQUARE', text: '"Let us give them one year. Then we will know." — a civil servant, to nobody in particular.' },
    special: 'INAUGURATION EDITION',
  };
  return s;
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

function addExposure(s: GameState, x: ExposureSpec, causeId: string, label: string): void {
  s.exposures.push({ ...x, turn: s.turn, causeId, label });
  if (x.kind === 'tolerated') s.counters.tolerated = (s.counters.tolerated ?? 0) + 1;
  applyFx(s, ['pressure.scandalHeat', 2 + x.trail * 2]);
}

function record(
  s: GameState, eventId: string, choiceId: string, category: ArchiveEntry['category'],
  headline: string, sig: 1 | 2 | 3, sealed = false,
): ArchiveEntry {
  const entry: ArchiveEntry = {
    id: `a${s.archive.length}`, turn: s.turn, eventId, choiceId, category,
    headline: fill(s, headline), sig, sealed, touches: {},
  };
  s.archive.push(entry);
  return entry;
}

function applyOutcome(s: GameState, e: GameEvent, choiceId: string, o: Outcome, cost?: Choice): string {
  const entry = record(s, e.id, choiceId, e.category, o.archive, o.sig ?? (e.slot === 'lead' ? 2 : 1), !!o.exposure);
  if (cost?.naira) applyFx(s, ['nation.fiscalSpace', -cost.naira], entry.touches);
  for (const fx of o.fx ?? []) {
    applyFx(s, fx, entry.touches);
    // The price of saying no: cleaning up leaves the party less to share. It falls as institutions strengthen.
    if (fx[0] === 'nation.integrity' && fx[1] > 0) {
      applyFx(s, ['bloc.party', -fx[1] * CFG.cleanCost * (1 - s.nation.integrity / 120)], entry.touches);
    }
  }
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
  if (o.news) {
    const mood = (o.fx ?? []).reduce((a, f) => a + (f[0] === 'approval' ? f[1] * 2 : f[0] === 'bloc.street' || f[0] === 'bloc.press' ? f[1] : 0), 0);
    s.news.push({
      chronicle: o.news[0], street: o.news[1], weight: o.newsWeight ?? (e.slot === 'lead' ? e.intensity + 1 : 1.5),
      body: o.result, valence: Math.sign(mood),
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
  return fill(s, o.result);
}

function choose(s: GameState, eventId: string, choiceId: string): void {
  const item = s.desk.lead?.eventId === eventId ? s.desk.lead : s.desk.minors.find((m) => m.eventId === eventId);
  const e = EVENTS[eventId];
  if (!item || item.resolved || !e) return;
  const c = e.choices.find((x) => x.id === choiceId);
  const a = c ? availability(s, c) : null;
  if (!c || !a || !a.ok) return;

  const before = snapshot(s);
  if (a.overdraft) overdraw(s, a.overdraft);
  if (c.pc) s.pc = clamp(s.pc - c.pc, 0, 100);
  if (c.purse) {
    s.purse -= c.purse;
    s.purseTaken.political += c.purse;
  }
  const result = applyOutcome(s, e, c.id, pickOutcome(s, c), c);
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
        s.news.push({ chronicle: 'PRESIDENT ADDRESSES NATION, URGES PATIENCE', street: '{NAME} SPEAKS. THIS TIME, PEOPLE LISTENED', weight: 2.5 });
      } else {
        run([['approval', -1.5, 1], ['bloc.street', -2], ['bloc.press', -1]]);
        result = 'The broadcast runs for 28 minutes. The generator in the viewing centre runs for 19.';
        s.news.push({ chronicle: 'PRESIDENT ADDRESSES NATION, URGES PATIENCE', street: '"PATIENCE" TRENDS AS {NAME} BEGS NIGERIANS AGAIN', weight: 2.5 });
      }
      break;
    case 'tour':
      entry = record(s, 'action.tour', z, 'action', `Toured the ${ZONE_NAME[z]}.`, 1);
      {
        const recent = s.archive.filter((x) => x.eventId === 'action.tour' && x.choiceId === z && s.turn - x.turn <= 10).length - 1;
        run([[`zone.${z}.approval`, Math.max(2, (s.zones[z].approval < 40 ? 9 : 7) - recent * 2.5), 1], ['bloc.street', 2], ['approval', 0.5]]);
      }
      result = `Three states in four days. The ${ZONE_NAME[z]} has seen the President in person, which is more than it expected.`;
      s.news.push({ chronicle: `PRESIDENT BEGINS WORKING VISIT TO ${ZONE_NAME[z].toUpperCase()}`, street: `{NAME} LANDS IN ${ZONE_NAME[z].toUpperCase()}; ROADS REPAIRED OVERNIGHT`, weight: 2 });
      break;
    case 'audit':
      entry = record(s, 'action.audit', '', 'action', 'Ordered a forensic audit of ministry accounts.', 2);
      run([['nation.integrity', 4], ['pressure.scandalHeat', -15], ['bloc.party', -4], ['bloc.villa', -2], ['bloc.press', 4]]);
      s.ledger.push({
        due: s.turn + randInt(s, 4, 6), fx: [['nation.integrity', 2], ['nation.fiscalSpace', 0.25]],
        label: 'Audit recoveries are paid into the treasury.', causeId: entry.id,
        note: ['AUDIT RECOVERS ₦150BN FROM MINISTRY ACCOUNTS', 'AUDIT FINDS ₦150BN. NOW WHO GO JAIL?'],
      });
      entry.touches['nation.integrity'] = (entry.touches['nation.integrity'] ?? 0) + 1.5;
      result = 'The auditors arrive on Monday. By Tuesday several directors have discovered urgent medical appointments abroad.';
      s.news.push({ chronicle: 'PRESIDENT ORDERS FORENSIC AUDIT OF MINISTRIES', street: 'AUDIT: BIG MEN ARE SUDDENLY "TRAVELLING"', weight: 2.5 });
      break;
    case 'convene':
      entry = record(s, 'action.convene', '', 'action', 'Convened a stakeholders\' meeting.', 1);
      run([['pc', 5], ['bloc.establishment', 2], ['bloc.party', 2]]);
      s.counters.stakeholders = (s.counters.stakeholders ?? 0) + 1;
      result = 'Stakeholders have been extensively engaged. A communiqué was issued. Everyone left satisfied and nothing has changed.';
      s.news.push({ chronicle: 'PRESIDENT MEETS STAKEHOLDERS, CALLS TALKS "FRUITFUL"', street: `STAKEHOLDERS MEETING NUMBER ${s.counters.stakeholders}. WE ARE COUNTING`, weight: 1 });
      break;
    case 'rally':
      entry = record(s, 'action.rally', z, 'action', `Held a campaign rally in the ${ZONE_NAME[z]}.`, 1);
      s.campaign.rallies[z] = (s.campaign.rallies[z] ?? 0) + 1;
      run([[`zone.${z}.approval`, 2.5]]);
      result = `The stadium is full. Whether they came for the President or for the rice will be known in ${['February', 'due course'][s.turn % 2]}.`;
      s.news.push({ chronicle: `PRESIDENT TAKES CAMPAIGN TO ${ZONE_NAME[z].toUpperCase()}`, street: `RALLY: CROWD FULL GROUND FOR ${ZONE_NAME[z].toUpperCase()}`, weight: 2 });
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
      addExposure(s, { kind: 'political', amount: cost, witnesses: ['senate'], trail: 1 }, entry.id, entry.headline);
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

function advance(s: GameState): void {
  for (const m of s.desk.minors) {
    if (m.resolved) continue;
    const e = EVENTS[m.eventId];
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
    s.news.push({ chronicle: '{NAME} SWORN IN FOR SECOND TERM, PROMISES TO "CONSOLIDATE"', street: 'FOUR MORE YEARS: "THIS TIME NO EXCUSE" — NIGERIANS', weight: 7 });
  }

  applyLedger(s);
  agendaTick(s);
  ventureTick(s);
  economyTick(s);
  politicsTick(s);

  const tt = termTurnOf(s.turn);
  if (s.term === 2 && tt === CFG.electionTermTurn + 1 && !s.succession) {
    s.succession = runElection(s, 'succession');
    const backed = !!s.flags['succession.backed'];
    s.flags['succession.won'] = s.succession.won;
    s.news.push(s.succession.won
      ? { chronicle: `${s.president.partyShort} RETAINS PRESIDENCY${backed ? '; PRESIDENT\'S CANDIDATE WINS' : ''}`, street: 'CONTINUITY WINS. THE STREET SHRUGS', weight: 8 }
      : { chronicle: 'OPPOSITION WINS PRESIDENCY; {OPP} DECLARED PRESIDENT-ELECT', street: 'CHANGE! {OPPARTY} TAKES ASO ROCK', weight: 8 });
  }
  if (s.term === 1 && s.flags['ticket.lost'] && tt === CFG.electionTermTurn + 1) {
    s.news.push({ chronicle: 'NATION VOTES; INCUMBENT WATCHES FROM THE VILLA', street: 'ELECTION DAY AND THE PRESIDENT NO DEY BALLOT', weight: 7 });
  }

  buildDesk(s);
  refreshOffers(s);
  buildPaper(s);
  s.phase = 'papers';
}

function endMonth(s: GameState): void {
  if (s.desk.lead && !s.desk.lead.resolved) return;
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
    s.news.push({ chronicle: '{NAME} RE-ELECTED', street: '{NAME} AGAIN! NIGERIA DECIDES', weight: 9 });
  } else {
    s.flags['election.lost'] = true;
    applyFx(s, ['bloc.party', -12]);
    applyFx(s, ['bloc.villa', -10]);
    record(s, 'election', 'lost', 'politics', 'Lost the presidential election.', 3);
    s.news.push({ chronicle: 'PRESIDENT CONCEDES; {OPP} IS PRESIDENT-ELECT', street: 'E DON HAPPEN: {NAME} LOSES', weight: 9 });
  }
  advance(s);
}

// ---------------------------------------------------------------- reducer

export function applyAction(state: GameState, action: Action): GameState {
  const s = structuredClone(state);
  if (s.phase === 'verdict') return s;
  switch (action.type) {
    case 'DISMISS_PAPER': if (s.phase === 'papers') s.phase = 'desk'; break;
    case 'CHOOSE': if (s.phase === 'desk') choose(s, action.eventId, action.choiceId); break;
    case 'ACT': if (s.phase === 'desk') act(s, action.action, action.zone); break;
    case 'DRAWER': if (s.phase === 'desk') drawer(s, action.op); break;
    case 'LAUNCH': if (s.phase === 'desk') launch(s, action.id, action.grease); break;
    case 'VENTURE': if (s.phase === 'desk') venture(s, action.id); break;
    case 'PERSON': if (s.phase === 'desk') person(s, action.id, action.op); break;
    case 'REPLACE_MINISTER': if (s.phase === 'desk') minister(s, action.id, action.kind); break;
    case 'ORDER': if (s.phase === 'desk') order(s, action.id); break;
    case 'REPLACE_FIN': if (s.phase === 'desk') replaceFinance(s, action.name); break;
    case 'END_MONTH': if (s.phase === 'desk') endMonth(s); break;
    case 'ELECTION_DONE': electionDone(s); break;
  }
  return s;
}

export type { Category };

// ---------------------------------------------------------------- the agenda

export function agendaSlots(s: GameState): number {
  return CFG.agenda.slots + (s.nation.capacity >= CFG.agenda.slotsAtCapacity ? 1 : 0);
}

export function launchCost(s: GameState, m: Milestone): number {
  const track = MILESTONE_BY_ID[m.id]?.track;
  const priority = !!track && s.agenda.tracks.includes(track.id);
  return Math.round(m.pc * (priority ? 1 : CFG.agenda.offAgendaPc));
}

export type MilestoneStatus = 'done' | 'active' | 'next' | 'later';

export function milestoneStatus(s: GameState, id: string): MilestoneStatus {
  if (s.agenda.done.includes(id)) return 'done';
  if (s.agenda.active.some((a) => a.id === id)) return 'active';
  const entry = MILESTONE_BY_ID[id];
  if (!entry) return 'later';
  const i = entry.track.milestones.findIndex((m) => m.id === id);
  const prior = entry.track.milestones.slice(0, i).every((m) => s.agenda.done.includes(m.id));
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
  if (s.agenda.active.length >= agendaSlots(s)) return { ok: false, reason: `The government can carry ${agendaSlots(s)} reforms at once. State capacity above 50 adds another.` };
  if (s.pc < launchCost(s, entry.m)) return { ok: false, reason: `Needs ${launchCost(s, entry.m)} political capital.` };
  if (entry.m.naira > s.nation.fiscalSpace && s.nation.debt >= CFG.economy.noLendingAbove) {
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
  if (m.naira) applyFx(s, ['nation.fiscalSpace', -m.naira], entry.touches);
  for (const fx of m.start ?? []) applyFx(s, fx, entry.touches);
  for (const [t, d] of m.done) entry.touches[t] = (entry.touches[t] ?? 0) + d;
  const greased = grease && !check.ok;
  if (greased) {
    s.purse -= CFG.agenda.greasePurse;
    s.purseTaken.political += CFG.agenda.greasePurse;
    const sealed = record(s, `reform.${id}`, 'grease', 'temptation', `Provided logistics to the Assembly to pass: ${m.name}.`, 1, true);
    applyFx(s, ['nation.integrity', -1.5], sealed.touches);
    addExposure(s, { kind: 'political', amount: CFG.agenda.greasePurse, witnesses: ['senate'], trail: 1 }, sealed.id, sealed.headline);
  }
  s.agenda.active.push({ id, progress: 0, greased });
  s.lastAction = {
    text: greased
      ? `${m.name} is under way. The Assembly's objections have been addressed, in cash. ${m.months} months.`
      : `${m.name} is under way. ${track.name}: the ministry estimates ${m.months} months, which you may read as a minimum.`,
    changes: diff(before, snapshot(s)),
  };
}

function agendaTick(s: GameState): void {
  const austerity = s.nation.debt > CFG.economy.debtCliff && s.nation.fiscalSpace <= 0.05;
  const speed = (0.8 + s.nation.capacity / 200) * (austerity ? 0.5 : 1);
  const still: GameState['agenda']['active'] = [];
  for (const a of s.agenda.active) {
    const entry = MILESTONE_BY_ID[a.id];
    if (!entry) continue;
    a.progress += (100 / entry.m.months) * speed * ministerSpeed(s, entry.track.id);
    if (a.progress < 100) { still.push(a); continue; }
    const { m, track } = entry;
    const before = snapshot(s);

    // A reform that needs the Assembly is voted on at the end. Without the party, or logistics, it falls.
    if (m.needs && !a.greased && !test(s, m.needs)) {
      const rec = record(s, `reform.${m.id}`, 'failed', 'action', `Defeated in the National Assembly: ${m.name}.`, 3);
      applyFx(s, ['pc', -6], rec.touches);
      applyFx(s, ['bloc.press', -3], rec.touches);
      s.agenda.failed.push({ id: m.id, turn: s.turn });
      s.news.push({ chronicle: `ASSEMBLY REJECTS PRESIDENT'S ${m.name.toUpperCase()}`, street: 'SENATORS DON KILL PRESIDENT BILL', weight: 6 });
      s.report.push({
        kind: 'failure', title: `Defeated in the Assembly: ${m.name}`, cause: track.name,
        text: 'The party was not with you when it came to the vote. The money is spent. The bill can be brought back in a year.',
        changes: diff(before, snapshot(s)),
      });
      continue;
    }

    const rec = record(s, `reform.${m.id}`, 'done', 'action', m.archive, 3);
    for (const fx of m.done) applyFx(s, fx, rec.touches);
    for (const [k, v] of Object.entries(m.flags ?? {})) { s.flags[k] = v; rec.touches[`flag:${k}`] = 1; }
    applyFx(s, ['pc', s.agenda.tracks.includes(track.id) ? CFG.agenda.donePriorityPc : CFG.agenda.donePc]);
    s.agenda.done.push(m.id);
    s.news.push({ chronicle: m.news[0], street: m.news[1], weight: 6, valence: 1, body: `${m.archive} ${m.blurb}` });
    const structural = describe(m.done.filter((f) => f[0].startsWith('bonus.')));
    s.report.push({ kind: 'reform', title: `Delivered: ${m.name}`, cause: track.name, changes: [...diff(before, snapshot(s)), ...structural] });
  }
  s.agenda.active = still;
}

// ---------------------------------------------------------------- big bets

export function ventureOdds(s: GameState, v: Venture): number {
  return clamp(v.odds + (s.nation.capacity - 40) / 200 + (s.nation.integrity - 30) / 300, 0.1, 0.9);
}

export type VentureStatus = 'won' | 'lost' | 'active' | 'open';

export function ventureStatus(s: GameState, id: string): VentureStatus {
  if (s.ventures.won.includes(id)) return 'won';
  if (s.ventures.lost.includes(id)) return 'lost';
  if (s.ventures.active.some((a) => a.id === id)) return 'active';
  return 'open';
}

/** A big bet appears on the list only when the situation that creates it exists. */
export function ventureVisible(s: GameState, v: Venture): boolean {
  return ventureStatus(s, v.id) !== 'open' || test(s, v.when);
}

export function canVenture(s: GameState, v: Venture): { ok: boolean; reason?: string } {
  const st = ventureStatus(s, v.id);
  if (st !== 'open') return { ok: false };
  if (v.when && !test(s, v.when)) return { ok: false, reason: 'Not available.' };
  if (s.ventures.active.length >= CFG.agenda.ventureSlots) return { ok: false, reason: `You can run ${CFG.agenda.ventureSlots} big bets at a time.` };
  if (s.pc < v.pc) return { ok: false, reason: `Needs ${v.pc} political capital.` };
  if (v.naira > s.nation.fiscalSpace && s.nation.debt >= CFG.economy.noLendingAbove) {
    return { ok: false, reason: 'There is no money, and nobody will lend it.' };
  }
  return { ok: true };
}

function venture(s: GameState, id: string): void {
  const v = VENTURE_BY_ID[id];
  if (!v || !canVenture(s, v).ok) return;
  const before = snapshot(s);
  s.pc = clamp(s.pc - v.pc, 0, 100);
  const entry = record(s, `venture.${id}`, 'launch', 'action', `Staked the government on: ${v.name}.`, 2);
  if (v.naira) applyFx(s, ['nation.fiscalSpace', -v.naira], entry.touches);
  for (const fx of v.start ?? []) applyFx(s, fx, entry.touches);
  s.ventures.active.push({ id, progress: 0 });
  s.news.push({ chronicle: `PRESIDENT ANNOUNCES: ${v.name.toUpperCase()}`, street: `PRESIDENT WAN TRY AM: ${v.name.toUpperCase()}`, weight: 4 });
  s.lastAction = { text: `${v.name}: announced. The odds are what they are. You will know in about ${v.months} months.`, changes: diff(before, snapshot(s)) };
}

function ventureTick(s: GameState): void {
  const speed = 0.8 + s.nation.capacity / 200;
  const still: GameState['ventures']['active'] = [];
  for (const a of s.ventures.active) {
    const v = VENTURE_BY_ID[a.id];
    if (!v) continue;
    a.progress += (100 / v.months) * speed;
    if (a.progress < 100) { still.push(a); continue; }
    const won = rand(s) < ventureOdds(s, v);
    const before = snapshot(s);
    const rec = record(s, `venture.${v.id}`, won ? 'won' : 'lost', 'action', `${won ? 'Succeeded' : 'Failed'}: ${v.name}.`, 3);
    const fx = won ? v.win : v.lose;
    for (const f of fx) applyFx(s, f, rec.touches);
    (won ? s.ventures.won : s.ventures.lost).push(v.id);
    if (won) applyFx(s, ['pc', CFG.agenda.ventureWinPc]);
    const news = won ? v.winNews : v.loseNews;
    s.news.push({ chronicle: news[0], street: news[1], weight: 7, valence: won ? 1 : -1, body: won ? v.winText : v.loseText });
    s.report.push({
      kind: won ? 'reform' : 'failure', title: `${won ? 'It worked' : 'It failed'}: ${v.name}`,
      text: won ? v.winText : v.loseText,
      changes: [...diff(before, snapshot(s)), ...describe(fx.filter((f) => f[0].startsWith('bonus.')))],
    });
  }
  s.ventures.active = still;
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

export function canOrder(s: GameState, o: Order): { ok: boolean; reason?: string } {
  if (o.situational && !s.offers.some((x) => x.id === o.id)) return { ok: false, reason: 'The moment has passed.' };
  if (o.when && !test(s, o.when)) return { ok: false, reason: o.lockedText ?? 'Not available.' };
  const last = s.counters[`order.${o.id}`];
  if (last !== undefined) {
    if (o.cooldown === 0) return { ok: false, reason: 'Already done.' };
    const wait = o.cooldown - (s.turn - last);
    if (wait > 0) return { ok: false, reason: `Available again in ${wait} months.` };
  }
  if (movesLeft(s) <= 0) return { ok: false, reason: 'This month\'s moves are used.' };
  if (s.pc < o.pc) return { ok: false, reason: `Needs ${o.pc} political capital.` };
  if (o.naira > s.nation.fiscalSpace && s.nation.debt >= CFG.economy.noLendingAbove) {
    return { ok: false, reason: 'There is no money, and nobody will lend it.' };
  }
  return { ok: true };
}

/** The effects an order would have, for display. */
export function orderOutcome(o: Order): Outcome {
  if (o.event) {
    const c = EVENTS[o.event[0]]?.choices.find((x) => x.id === o.event![1]);
    if (c) return c.outcomes[c.outcomes.length - 1];
  }
  return { result: o.result, fx: o.fx, later: o.later, flags: o.flags, follow: o.follow, news: o.news, archive: o.archive, sig: o.sig, exposure: o.exposure };
}

function order(s: GameState, id: string): void {
  const o = ORDER_BY_ID[id];
  if (!o || !canOrder(s, o).ok) return;
  const before = snapshot(s);
  s.pc = clamp(s.pc - o.pc, 0, 100);
  s.desk.actionsUsed += 1;
  s.counters[`order.${o.id}`] = s.turn;
  s.offers = s.offers.filter((x) => x.id !== o.id);
  const outcome = orderOutcome(o);
  const source = o.event ? EVENTS[o.event[0]] : undefined;
  const pseudo = source ?? ({ id: `order.${o.id}`, category: 'politics', slot: 'lead', intensity: 4 } as GameEvent);
  if (source && o.event) {
    // The President acted first. The file that would have raised it is closed.
    (s.fired[source.id] ??= []).push(s.turn);
    s.choices[source.id] = o.event[1];
  }
  const text = applyOutcome(s, pseudo, o.event?.[1] ?? 'order', outcome);
  if (o.naira) applyFx(s, ['nation.fiscalSpace', -o.naira]);
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
  s.news.push({ chronicle: `PRESIDENT SACKS FINANCE MINISTER, NAMES ${next.short.toUpperCase()}`, street: `FINANCE MINISTER DON GO. ${next.short.toUpperCase()} DON ENTER`, weight: 5 });
  s.lastAction = {
    text: `${old.name} is thanked for services rendered. ${next.name} is sworn in before lunch.`,
    changes: diff(before, snapshot(s)),
  };
}

// ---------------------------------------------------------------- your people

function person(s: GameState, id: string, op: PersonOp): void {
  if (!canDeal(s, id, op, movesLeft(s)).ok) return;
  const before = snapshot(s);
  s.desk.actionsUsed += 1;
  const out = deal(s, id, op);
  record(s, `person.${id}`, op, 'politics', out.archive, op === 'grant' ? 2 : 1, out.sealed);
  s.lastAction = { text: out.text, changes: diff(before, snapshot(s)) };
}

function minister(s: GameState, id: string, kind: 'technocrat' | 'party'): void {
  if (movesLeft(s) <= 0 || s.pc < 6 || !s.people[id]) return;
  const before = snapshot(s);
  s.pc -= 6;
  s.desk.actionsUsed += 1;
  const out = replaceMinister(s, id, kind);
  record(s, `person.${id}`, 'replace', 'politics', out.archive, 2);
  s.news.push({ chronicle: 'PRESIDENT DROPS MINISTER IN CABINET CHANGE', street: 'ONE MINISTER DON GO, ANOTHER DON ENTER', weight: 3 });
  s.lastAction = { text: out.text, changes: diff(before, snapshot(s)) };
}
