// Experience check: big bets with distinctive delivery and operating consequences (plan 12).
// Run: npx tsx tests/experience/bets.check.ts
//
// - opening day can work in full, miss once for a fixable cause, open in part, or fail;
// - a partial delivery runs at its share, is recorded as partial, and can be finished;
// - operating assets wear, recover with maintenance and refurbishment, and are inherited;
// - each asset changes its own system: imports, dollars, reserves or building costs;
// - the diaspora vote counts in elections; the constitution's clause changes revenue sharing.

import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../../content/names';
import { VENTURE_BY_ID } from '../../content/ventures';
import { PARTIAL_SCALE, resolveBet, ventureTick } from '../../engine/bets';
import { fxFlow } from '../../engine/currency';
import { runElection } from '../../engine/election';
import { assetPerformance, assetSystem, assetTick, canFinish, finish, refurbish, setUpkeep, settleSite, wear } from '../../engine/places';
import { newGame } from '../../engine/reduce';
import { buildCost, fiscalFlow } from '../../engine/treasury';
import type { GameState } from '../../engine/types';

const setup = { seed: 43, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 80; s.nation.fiscalSpace = 5; return s; };
const build = (s: GameState, id: string, site: string, scale = 1) => { (s.sites ??= {})[id] = site; s.ventures.won.push(id); settleSite(s, id, true, scale); };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('opening day has four outcomes, and a fixable cause can cost time only once', () => {
  assert.equal(resolveBet(0.6, 0.1, true), 'full');
  assert.equal(resolveBet(0.6, 0.65, true), 'slip');
  assert.equal(resolveBet(0.6, 0.65, false), 'partial');
  assert.equal(resolveBet(0.6, 0.75, true), 'partial');
  assert.equal(resolveBet(0.6, 0.95, true), 'failed');
});

check('a bet that opens in part runs at its share, is recorded as partial, and can be finished', () => {
  // Find a draw that opens the steel complex in part.
  let s: GameState | null = null;
  for (let seed = 1; seed < 400 && !s; seed++) {
    const t = fresh();
    t.rng = seed; t.sites = { steel: 'KO' };
    t.ventures.active = [{ id: 'steel', progress: 99.99 }];
    t.bets.steel = { warned: [], slipped: 1 };
    ventureTick(t);
    if (t.bets.steel.scale === PARTIAL_SCALE) s = t;
  }
  assert.ok(s, 'some draw opens it in part');
  const a = s!.assets!.find((x) => x.id === 'steel')!;
  assert.equal(a.scale, PARTIAL_SCALE);
  assert.ok(s!.ventures.won.includes('steel'));
  assert.ok(s!.archive.some((e) => e.choiceId === 'partial'), 'history records a partial delivery, not a success');
  const half = assetPerformance(s!, 'steel').k;
  assert.ok(canFinish(s!, 'steel').ok);
  finish(s!, 'steel');
  s!.turn = a.completing!;
  assetTick(s!);
  assert.equal(a.scale, 1);
  assert.ok(assetPerformance(s!, 'steel').k > half * 1.8, 'finished, it runs at its design scale');
});

check('assets wear without maintenance, recover with it, and refurbishment restores them', () => {
  const s = fresh();
  build(s, 'wheat', 'KN');
  const a = s.assets!.find((x) => x.id === 'wheat')!;
  a.head = { ...a.head, competence: 3 };
  setUpkeep(s, 'wheat', 'deferred');
  const saved = fiscalFlow(s).lines.find((l) => l.label === 'Maintaining the state\'s plants');
  assert.ok(!saved, 'deferred maintenance costs nothing now');
  for (let i = 0; i < 24; i++) assetTick(s);
  assert.ok(a.condition! < 0.8, `two years without maintenance: ${a.condition}`);
  setUpkeep(s, 'wheat', 'maintained');
  a.head = { ...a.head, competence: 5 };
  s.theatres.NW = 70;
  assert.ok(wear(s, 'wheat').rate > 0, 'equipment is stolen in an insecure zone, whoever runs it');
  s.theatres.NW = 40;
  assert.ok(wear(s, 'wheat').rate < 0, 'a capable manager with maintenance in a quiet zone restores it');
  refurbish(s, 'wheat');
  s.turn = a.refurbishing!;
  assetTick(s);
  assert.equal(a.condition, 1);
  // Inherited as it stands.
  a.condition = 0.7; s.turn = 49; s.ending = 'defeated';
  const next = newGame({ ...setup, name: 'Successor' }, s);
  assert.equal(next.assets!.find((x) => x.id === 'wheat')!.condition, 0.7);
});

check('each asset changes its own system, in proportion to what it produces', () => {
  const s = fresh();
  const petrol = () => fxFlow(s).lines.find((l) => l.label === 'Petrol imports')!.value;
  const none = petrol();
  build(s, 'refinery', 'RI');
  const full = petrol();
  assert.ok(full > none + 0.1, 'a working refinery replaces petrol imports');
  s.assets!.find((x) => x.id === 'refinery')!.condition = 0.5;
  assert.ok(petrol() < full && petrol() > none, 'a run-down refinery replaces less');
  // Gold goes into the reserves; electricity exports wait for the country to be supplied.
  build(s, 'gold', 'ZA');
  const reserves = s.fx!.reserves;
  assetTick(s);
  assert.ok(s.fx!.reserves > reserves, 'gold is bought into the reserves');
  build(s, 'export_power', 'NI');
  s.nation.power = 30;
  assert.ok(assetSystem(s, 'export_power').blocked && assetSystem(s, 'export_power').dollars === 0);
  s.nation.power = 60;
  assert.ok(assetSystem(s, 'export_power').dollars > 0);
  // Domestic steel makes infrastructure cheaper.
  const cost = buildCost(s, 1, true).treasury + buildCost(s, 1, true).fund / 0.75;
  build(s, 'steel', 'KO');
  assert.ok(buildCost(s, 1, true).treasury + buildCost(s, 1, true).fund / 0.75 < cost);
});

check('the diaspora vote counts, and the constitution\'s clause changes revenue sharing', () => {
  const s = fresh();
  assert.ok(VENTURE_BY_ID.diaspora.winFlags?.['diaspora.vote']);
  const before = runElection(structuredClone(s), 'reelection', true);
  assert.equal(before.diaspora, undefined);
  s.flags['diaspora.vote'] = true;
  const after = runElection(structuredClone(s), 'reelection', true);
  assert.ok(after.diaspora && after.diaspora.voters > 0);
  const t = fresh();
  t.counters['bonus.fiscal'] = 0.6; // a large, lasting surplus
  const share = () => fiscalFlow(t).lines.find((l) => l.label === 'The states\' share of the surplus')?.value ?? 0;
  const normal = share();
  t.flags['constitution.clause'] = 'devolve';
  assert.ok(share() < normal, 'under fiscal autonomy the states take more of a surplus');
});

check('conditions are of three kinds: essential, cost and speed, and political acceptance', () => {
  for (const v of Object.values(VENTURE_BY_ID)) for (const r of v.risks) assert.ok(r.kind, `${v.id}.${r.id} has a kind`);
  assert.equal(VENTURE_BY_ID.steel.risks.find((r) => r.id === 'contractors')!.kind, 'cost');
  assert.equal(VENTURE_BY_ID.steel.risks.find((r) => r.id === 'power')!.kind, 'essential');
  assert.equal(VENTURE_BY_ID.constitution.risks.find((r) => r.id === 'senate')!.kind, 'acceptance');
  // A missing cost factor makes the work late and dear; it is only half a threat to the opening.
  const paid = fresh(), unpaid = fresh();
  for (const s of [paid, unpaid]) { s.sites = { steel: 'KO' }; s.ventures.active = [{ id: 'steel', progress: 10 }]; s.tycoons.ty_maker.rel = 70; s.nation.power = 70; }
  paid.debts.contractors = 0; unpaid.debts.contractors = 3;
  const cash = unpaid.nation.fiscalSpace;
  ventureTick(paid); ventureTick(unpaid);
  assert.ok(unpaid.ventures.active[0].progress < paid.ventures.active[0].progress, 'unpaid contractors slow the work');
  assert.ok((unpaid.counters['overrun.steel'] ?? 0) > 0 && unpaid.nation.fiscalSpace < cash, 'and run it over budget');
});

console.log(`${passed} big bet checks passed.`);
