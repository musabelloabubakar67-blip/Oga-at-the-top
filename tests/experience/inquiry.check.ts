// Experience check: information, evidence and political investigation (plan 08).
// Run: npx tsx tests/experience/inquiry.check.ts
//
// - the truth is settled by the state of the country, deterministically, and unseen;
// - reports carry a source, date, confidence and incentive, and see only part of the question;
// - inquiries take time and access, and waiting has a cost;
// - two players can reach different conclusions on the same incomplete evidence;
// - after the reveal, each can trace why their assessment was right or wrong.

import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../../content/names';
import { decideInquiry, inquiries, inquiryTick, probe } from '../../engine/inquiry';
import { newGame } from '../../engine/reduce';
import type { GameState } from '../../engine/types';

const setup = { seed: 61, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fuelCrisis = (rel: number, ss: number): GameState => {
  const s = newGame(setup); s.phase = 'desk'; s.pc = 80; s.turn = 6;
  s.pressures.fuelSupplyStress = 70; s.tycoons.ty_fuel.rel = rel; s.theatres.SS = ss;
  s.agenda.done = []; // no other questions
  inquiryTick(s);
  return s;
};
const q = (s: GameState) => inquiries(s).find((x) => x.id === 'myst.fuel')!;

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('the truth is settled by the state of the country, and unseen', () => {
  assert.equal(q(fuelCrisis(30, 40)).truth, 'hoard');
  assert.equal(q(fuelCrisis(60, 70)).truth, 'pipes');
  assert.equal(q(fuelCrisis(60, 40)).truth, 'smuggle');
});

check('reports have a source, date, confidence and incentive, and see only part of the question', () => {
  const s = fuelCrisis(30, 40);
  const first = q(s).reports[0];
  assert.equal(first.method, 'claim');
  assert.equal(first.confidence, 'low');
  assert.equal(first.says, 'pipes', 'the ministry blames the vandals: the explanation that is nobody\'s fault');
  probe(s, 'myst.fuel', 'audit');
  assert.equal(q(s).reports.length, 1, 'an audit takes time');
  for (let i = 0; i < 2; i++) { s.turn += 1; inquiryTick(s); }
  const audit = q(s).reports.find((r) => r.method === 'audit')!;
  assert.equal(audit.says, null, 'the spending records cannot see hoarding; they can only rule out smuggling');
  assert.match(audit.text, /nothing found/);
});

check('two players reach different conclusions on the same evidence, and can trace why later', () => {
  const a = fuelCrisis(30, 40), b = fuelCrisis(30, 40);
  // Both have the ministry's account; one acts on it, the other asks the field team first.
  decideInquiry(a, 'myst.fuel', 'pipes');
  probe(b, 'myst.fuel', 'field');
  b.turn += 1; inquiryTick(b);
  const field = q(b).reports.find((r) => r.method === 'field')!;
  decideInquiry(b, 'myst.fuel', field.says ?? 'hoard');
  assert.equal(q(a).decided!.known, 1);
  assert.equal(q(b).decided!.known, 2, 'what was known at the decision is recorded');
  for (const s of [a, b]) { for (let i = 0; i < 3; i++) { s.turn += 1; inquiryTick(s); } }
  assert.equal(q(a).right, false);
  assert.ok(q(a).revealed && a.report.some((r) => /read it wrong/.test(r.text ?? '') && /pointed the wrong way/.test(r.text ?? '')), 'the wrong reading is traced to the source and its incentive');
  if (field.says === 'hoard') assert.ok(q(b).right && b.report.some((r) => /read it right/.test(r.text ?? '')));
  assert.ok(a.report.some((r) => /vandals/.test(r.text ?? '') && /press has the dates/.test(r.text ?? '')), 'the public announcement is contradicted');
});

check('undecided questions cost something every month, and pass to the successor', () => {
  const s = fuelCrisis(30, 40);
  const stress = s.pressures.fuelSupplyStress;
  s.turn += 1; inquiryTick(s);
  assert.ok(s.pressures.fuelSupplyStress > stress, 'the queues go on while you wait');
  s.turn = 49; s.ending = 'defeated';
  const next = newGame({ ...setup, name: 'Successor' }, s);
  assert.ok(inquiries(next).some((x) => x.id === 'myst.fuel' && !x.decided), 'the open question and its evidence are inherited');
});

console.log(`${passed} evidence checks passed.`);
