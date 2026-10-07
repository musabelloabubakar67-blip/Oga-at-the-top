// Experience check: taxation and the Treasury are separate (plan 10).
// Run: npx tsx tests/experience/fiscal.check.ts
//
// - the old Treasury track is two tracks: who pays, and how the money is spent;
// - rival tax answers close each other;
// - strong collection with weak spending, and disciplined spending with a narrow
//   tax base, are distinct conditions with different consequences;
// - every tax has a burden someone feels, and an administrative cost;
// - an old save's Treasury priority keeps covering both halves.

import assert from 'node:assert/strict';
import { MILESTONE_BY_ID, TRACK_BY_ID } from '../../content/agenda';
import { FINANCE_CANDIDATES } from '../../content/names';
import { interestRate, revenueMonthly } from '../../engine/accounts';
import { burdens, discipline, fiscalCondition, fiscalSystemTick, taxBase } from '../../engine/fiscal-system';
import { migrate } from '../../engine/migrate';
import { milestoneStatus, newGame } from '../../engine/reduce';
import { fiscalFlow, releaseRate } from '../../engine/treasury';
import type { GameState } from '../../engine/types';
import { applyFx, test } from '../../engine/vars';
import { FISCAL_OBJECTIVES } from '../../content/tracks-fiscal';

const setup = { seed: 41, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; return s; };
const deliver = (s: GameState, ids: string[]) => { for (const id of ids) { s.agenda.done.push(id); for (const fx of MILESTONE_BY_ID[id].m.done) applyFx(s, fx); } };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('taxation and the Treasury are two tracks with their own reforms', () => {
  const tax = TRACK_BY_ID.tax.milestones.map((m) => m.id), treasury = TRACK_BY_ID.treasury.milestones.map((m) => m.id);
  for (const id of ['t1', 't3', 't5', 'x1', 'x8', 'x12']) assert.ok(tax.includes(id), `${id} is a tax reform`);
  for (const id of ['t2', 't4', 't7', 'y1', 'y4']) assert.ok(treasury.includes(id), `${id} is a Treasury reform`);
  assert.ok(!tax.some((id) => treasury.includes(id)));
});

check('rival tax answers close each other', () => {
  const s = fresh();
  deliver(s, ['t1', 't3']);
  assert.notEqual(milestoneStatus(s, 'x2'), 'closed');
  deliver(s, ['x1']);
  assert.equal(milestoneStatus(s, 'x2'), 'closed', 'VAT closes the excise alternative');
  deliver(s, ['x12']);
  assert.equal(milestoneStatus(s, 't5'), 'closed', 'one revenue service closes states that collect and keep');
});

check('strong collection with weak spending differs from disciplined spending with a narrow base', () => {
  const leaky = fresh();
  leaky.nation.integrity = 22;
  deliver(leaky, ['t1', 't3', 'x1', 'x8', 'x11', 'x4']);
  const tight = fresh();
  deliver(tight, ['y1', 't2', 't4', 't7', 'y2', 'y3']);
  fiscalSystemTick(leaky); fiscalSystemTick(tight);
  assert.equal(fiscalCondition(leaky).id, 'collects-but-leaks', `base ${taxBase(leaky).v}, discipline ${discipline(leaky).v}`);
  assert.equal(fiscalCondition(tight).id, 'disciplined-but-narrow', `base ${taxBase(tight).v}, discipline ${discipline(tight).v}`);
  // The leaky state collects more...
  const taxLine = (s: GameState) => fiscalFlow(s).lines.find((l) => l.label === 'Your reforms and orders')?.value ?? 0;
  assert.ok(taxLine(leaky) > taxLine(tight), 'more is collected where the base is broad');
  // ...and loses part of it, releases less of what is budgeted, and borrows dearer.
  assert.ok(fiscalFlow(leaky).lines.some((l) => l.label === 'Collected, then lost in spending' && l.value < 0));
  assert.ok(!fiscalFlow(tight).lines.some((l) => l.label === 'Collected, then lost in spending'));
  assert.ok(releaseRate(leaky, 'security').rate < releaseRate(tight, 'security').rate, 'releases are steadier where spending is disciplined');
  assert.ok(interestRate(tight, 'bonds') < interestRate(leaky, 'bonds'), 'lenders charge a disciplined treasury less');
  assert.ok(revenueMonthly(leaky) >= revenueMonthly(tight));
});

check('every tax has a burden someone feels each month, and a cost to run', () => {
  const s = fresh();
  deliver(s, ['t1', 't3', 'x1']);
  const who = burdens(s).map((b) => b.burden);
  assert.ok(who.includes('poor') && who.includes('traders') && who.includes('importers'));
  const street = s.blocs.street;
  fiscalSystemTick(s);
  assert.ok(s.blocs.street < street, 'a VAT and a levy are felt in the street');
  assert.ok(fiscalFlow(s).lines.some((l) => l.label === 'Running the tax administration' && l.value < 0));
});

check('an undone reform stops counting', () => {
  const s = fresh();
  deliver(s, ['y1', 't4']);
  const d = discipline(s).v;
  s.agenda.done = s.agenda.done.filter((x) => x !== 't4');
  assert.ok(discipline(s).v < d);
});

check('an old save with a Treasury priority keeps both halves as priorities', () => {
  const s = newGame({ ...setup, priorities: ['treasury', 'power', 'security', 'food'] });
  const raw = JSON.parse(JSON.stringify(s));
  raw.agenda.tracks = ['treasury', 'power', 'security', 'food'];
  const m = migrate(raw)!;
  assert.ok(m.agenda.tracks.includes('tax') && m.agenda.tracks.includes('treasury'));
});

check('each track has its own foundations and objectives, not only the old reforms split in two', () => {
  const found = (id: string) => TRACK_BY_ID[id].milestones.filter((m) => (m.gen ?? 1) === 1).map((m) => m.id);
  assert.deepEqual(found('tax'), ['t1', 'tx1', 't3', 'tx2', 'tx3']);
  assert.deepEqual(found('treasury'), ['y1', 'tr1', 't2', 'tr2', 't4', 'tr3']);
  for (const id of ['tx1', 'tx2', 'tx3', 'tr1', 'tr2', 'tr3']) assert.ok(MILESTONE_BY_ID[id], `${id} is a new foundation`);
  const s = fresh();
  const met = (t: 'tax' | 'treasury') => FISCAL_OBJECTIVES[t].filter((o) => test(s, o.met)).length;
  const tax0 = met('tax'), tre0 = met('treasury');
  deliver(s, ['t1', 'tx1', 't3', 'tx2', 'tx3', 'y1', 'tr1', 't2', 'tr2', 't4', 'tr3', 'y3']);
  s.debts.contractors = 0.2;
  assert.ok(met('tax') > tax0 && met('treasury') > tre0, 'delivering the foundations meets the objectives they serve');
});

console.log(`${passed} fiscal checks passed.`);
