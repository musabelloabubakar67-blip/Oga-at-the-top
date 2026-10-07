// Experience check: maintenance, implementation diagnosis and a real opposition (plan 15).
// Run: npx tsx tests/experience/opposition.check.ts
//
// - a slow reform is diagnosed by cause, and the remedy matches the cause;
// - replacing the minister does not fix missing money;
// - a working asset eases an old problem while its upkeep is a stated line;
// - rivals propose for a constituency when there is a real problem; they can be right;
// - adopting, negotiating, defeating and showing an alternative each have their own consequence;
// - opposition strength moves with its proposals, not only with approval.

import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../../content/names';
import { CFG } from '../../engine/config';
import { diagnose } from '../../engine/diagnosis';
import { ministerFor, ministerSpeed } from '../../engine/people';
import { settleSite } from '../../engine/places';
import { answer, proposalTick, proposals } from '../../engine/proposals';
import { newGame } from '../../engine/reduce';
import { fiscalFlow } from '../../engine/treasury';
import type { GameState } from '../../engine/types';

const setup = { seed: 67, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 80; return s; };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('a slow reform is diagnosed by cause, and a new minister does not fix missing money', () => {
  const s = fresh();
  s.agenda.active.push({ id: 'p2', progress: 10 });
  s.nation.debt = CFG.economy.debtCliff + 5; s.nation.fiscalSpace = 0;
  const found = diagnose(s, 'p2');
  assert.equal(found[0].cause, 'funding', 'the worst cause is money');
  assert.match(found[0].remedy, /new minister will not help/);
  const m = ministerFor('power')!;
  s.people[m.id].competence = 5;
  assert.ok(ministerSpeed(s, 'power') > 1, 'the minister is excellent');
  assert.equal(diagnose(s, 'p2')[0].cause, 'funding', 'and the reform is still starved of money');
  s.budget.release = { power: 'hold' };
  assert.ok(diagnose(s, 'p2').some((f) => /holding back the budget release/.test(f.text)), 'a held release is named, with its remedy');
});

check('a working asset eases an old problem while its upkeep is a stated line', () => {
  const s = fresh();
  (s.sites ??= {}).refinery = 'RI'; s.ventures.won.push('refinery'); settleSite(s, 'refinery', true);
  assert.ok(fiscalFlow(s).lines.some((l) => l.label === 'Maintaining the state\'s plants' && l.value < 0), 'its upkeep is in the books');
});

check('rivals propose for a group when there is a real problem, and can be right', () => {
  const s = fresh();
  s.nation.petrolPrice = 1600; s.pressures.fuelSupplyStress = 70;
  proposalTick(s);
  const p = proposals(s).find((x) => x.id === 'prop.fuelvouchers');
  assert.ok(p, 'the youth movement proposes fuel vouchers for drivers');
  const approval = s.blocs.street;
  const strength = s.opposition.fire ?? 30;
  s.turn += 1; proposalTick(s);
  assert.ok((s.opposition.fire ?? 30) > strength, 'an unanswered proposal that is right builds the rival');
  assert.ok(s.blocs.street <= approval, 'and it is campaigned on');
});

check('each answer has its own consequence', () => {
  const run = (how: 'adopt' | 'negotiate' | 'defeat' | 'alternative', right: boolean) => {
    const s = fresh();
    s.nation.petrolPrice = right ? 1700 : 1150;
    s.pressures.fuelSupplyStress = 40;
    proposalTick(s);
    const before = s.opposition.fire ?? 30;
    answer(s, 'prop.fuelvouchers', how);
    return { s, d: (s.opposition.fire ?? 30) - before };
  };
  assert.ok(run('adopt', true).d > 0, 'adopting gives the rival the credit');
  assert.ok(run('defeat', true).d > 0, 'defeating a proposal that is right strengthens the rival');
  assert.ok(run('defeat', false).d < 0, 'defeating one that overstates the problem weakens the rival');
  const alt = run('alternative', true).s;
  alt.ventures.won.push('cng');
  alt.turn += 6; proposalTick(alt);
  assert.match(proposals(alt)[0].outcome ?? '', /alternative worked/, 'a better answer, shown in time, is judged as such');
});

console.log(`${passed} maintenance and opposition checks passed.`);
