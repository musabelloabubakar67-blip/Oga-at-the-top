// Experience check: reliable history, succession and foundations (plan 01).
// Run: npx tsx tests/experience/foundations.check.ts
//
// - three governments in a row keep institutions working, repealed policies repealed, live cases live,
//   chosen policies and the exchange-rate stance, with no calendar corruption;
// - replacing an adviser does not transfer their record; delayed forecasts stay pending until observable;
// - endings keep reputation, legal exposure, personal wealth and documented misconduct apart;
// - a data breach is reported as an allegation from a specific source, not asserted from the mood.

import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../../content/names';
import { trackRecord } from '../../engine/advice';
import { charge } from '../../engine/cases';
import { built, performance } from '../../engine/institutions';
import { newGame } from '../../engine/reduce';
import { verdict } from '../../engine/legacy';
import type { GameState } from '../../engine/types';
import { MILESTONE_BY_ID } from '../../content/agenda';

const setup = { seed: 79, scenario: 'standard', name: 'First', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const head = { name: 'Dr Test Head', competence: 4, integrity: 4, loyalty: 3, patron: 'president', rep: { competence: 4, loyalty: 3 } };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('three governments keep institutions, repeals, cases, policies and the currency stance, with a sound calendar', () => {
  let s = newGame(setup); s.phase = 'desk';
  s.turn = 10;
  (s.institutions ??= []).push({ id: 'graft', head, since: 10, founded: 10, funding: 'standard', record: {} });
  s.flags['reversed.t3'] = 1;
  s.flags['policy.subsidy'] = 'removed';
  s.flags['fx.stance'] = 'float'; s.fx!.stance = 'float';
  const ally = Object.keys(s.people)[0];
  charge(s, ally, 'contract fraud', 0.05);
  s.turn = 49; s.ending = 'defeated';
  for (const name of ['Second', 'Third']) {
    const next = newGame({ ...setup, name }, s);
    next.phase = 'desk'; next.turn = 3;
    const i = built(next).find((x) => x.id === 'graft')!;
    assert.ok(i.founded! <= 1, `founded in the past on the new calendar (${i.founded})`);
    assert.ok(performance(next, 'graft').k > 0.5, 'an inherited institution works at full strength');
    assert.equal(next.flags['reversed.t3'], 1, 'a repeal stays repealed');
    assert.equal(next.flags['policy.subsidy'], 'removed', 'the subsidy stays removed');
    assert.equal(next.flags['fx.stance'], 'float', 'the naira keeps floating');
    assert.ok((next.cases ?? []).some((c) => c.who === ally && !c.outcome), 'the live case continues');
    next.turn = 49; next.ending = 'defeated';
    s = next;
  }
});

check('a replacement adviser starts their own record; delayed forecasts are pending until observable', () => {
  const s = newGame(setup); s.phase = 'desk'; s.turn = 6;
  const fin = s.chars.fin;
  s.advice = [
    { role: 'fin', who: fin.name, turn: 2, due: 2, event: 'x', choice: 'a', followed: true, miss: 0 },
    { role: 'fin', who: fin.name, turn: 5, due: 14, event: 'y', choice: 'b', followed: true, miss: 0 },
  ];
  const r = trackRecord(s, 'fin');
  assert.equal(r.checked, 1, 'only the forecast whose outcome has arrived is judged');
  assert.equal(r.pending, 1);
  s.chars.fin = { ...fin, name: 'Dr New Minister' };
  assert.equal(trackRecord(s, 'fin').checked + trackRecord(s, 'fin').pending, 0, 'the new minister has no inherited record');
});

check('endings keep reputation, legal exposure, wealth and documented misconduct apart', () => {
  const s = newGame(setup); s.phase = 'verdict'; s.turn = 49; s.ending = 'term_limit';
  s.military!.misused = 1;
  const v = verdict(s);
  assert.ok(v.epithet, 'reputation');
  assert.equal(v.ledger, null, 'no money was taken');
  assert.ok(v.misconduct.some((m) => /Soldiers were used against civilians/.test(m)), 'yet misconduct is documented');
  assert.ok(v.after.risk.some((r) => /Soldiers used against civilians/.test(r)), 'and it is legal exposure');
});

check('a data breach comes from an attributed report, not from the general mood', () => {
  const d11 = MILESTONE_BY_ID.d11.m;
  const s = newGame(setup); s.agenda.done.push('d4'); s.pressures.scandalHeat = 90;
  assert.equal(d11.emerge!(s), false, 'scandal heat alone does not make it true');
  s.flags['data.breach'] = 'alleged';
  assert.equal(d11.emerge!(s), true);
  assert.match(d11.emergeText!, /allegation, not a finding/);
});

console.log(`${passed} foundation checks passed.`);
