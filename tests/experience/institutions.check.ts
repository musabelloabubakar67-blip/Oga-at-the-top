// Experience check: institutional agency, constitutional authority and courts (plan 04).
// Run: npx tsx tests/experience/institutions.check.ts
//
// - a capable independent institution helps the country and constrains its founder in the same campaign;
// - culture depends on the head and on routines a strong head built, which outlast the head;
// - constitutional and statutory rules bind the President and the successor;
// - the court decides on authority, evidence, precedent and procedure, and explains why;
// - an honest justice who leans against the government still upholds a lawful, well-evidenced act.

import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../../content/names';
import { canDrop, charge } from '../../engine/cases';
import { reformAuthority, ruleInForce, rules } from '../../engine/constitution';
import { bench as benchOf, nominees } from '../../engine/courts';
import { canBorrowNow } from '../../engine/holdings';
import { cultureOf, institutionTick, performance } from '../../engine/institutions';
import { decide, type Facts } from '../../engine/judgment';
import { canReverse, newGame } from '../../engine/reduce';
import type { GameState } from '../../engine/types';

const setup = { seed: 59, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 80; return s; };
const head = (competence: number, integrity: number, loyalty = 3, patron = 'president') => ({ name: 'Dr Test Head', competence, integrity, loyalty, patron, rep: { competence, loyalty } });
const found = (s: GameState, id: string, h = head(5, 5)) => (s.institutions ??= []).push({ id, head: h, since: s.turn, founded: s.turn - 12, funding: 'standard', record: {} });

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('a capable independent agency helps the country and charges the founder\'s ally', () => {
  const s = fresh();
  found(s, 'graft');
  const ally = Object.keys(s.people).find((id) => !s.people[id].gone)!;
  s.people[ally].rel = 80;
  s.flags[`dirty.${ally}.x`] = true;
  const integrity = s.nation.integrity;
  s.turn = 20;
  institutionTick(s);
  assert.ok(s.nation.integrity > integrity, 'it helps: integrity rises');
  assert.ok((s.cases ?? []).some((c) => c.who === ally), 'and it charges someone close to the President without asking');
  assert.ok(s.institutions![0].acts?.length, 'what it did on its own is on its record');
});

check('the statistics bureau publishes what the government would rather it did not', () => {
  const s = fresh();
  found(s, 'stats');
  s.nation.inflation = 32;
  const cap = s.nation.capacity;
  institutionTick(s);
  assert.ok(s.nation.capacity > cap, 'better data for every ministry');
  assert.ok((s.institutions![0].acts ?? []).length === 1);
});

check('culture follows the head, and routines a strong head built outlast them', () => {
  const s = fresh();
  found(s, 'graft', head(5, 5));
  for (let i = 0; i < 20; i++) institutionTick(s);
  assert.ok((s.institutions![0].routine ?? 0) >= 0.5, 'routines built');
  s.institutions![0].head = head(3, 3);
  assert.equal(cultureOf(s, 'graft'), 'competent', 'the routines survive the departure');
  assert.ok(performance(s, 'graft').why.some((w) => /Routines/.test(w)));
  s.institutions![0].head = head(3, 2, 2, 'ty_trade');
  assert.equal(cultureOf(s, 'graft'), 'captured', 'a head serving someone else captures it');
  const t = fresh();
  found(t, 'graft', head(3, 3, 5));
  assert.equal(cultureOf(t, 'graft'), 'timid', 'a loyal, ordinary head makes it timid');
});

check('rules in force bind the President, and survive into the next government', () => {
  const s = fresh();
  s.agenda.done.push('t4', 'c4', 's4');
  s.nation.debt = 92;
  assert.match(canBorrowNow(s, 0.5, 1).reason ?? '', /debt ceiling/);
  charge(s, Object.keys(s.people)[0], 'theft', 0.01);
  assert.match(canDrop(s, s.cases![0].id).reason ?? '', /independent prosecutor/);
  assert.match(canReverse(s, 's4').reason ?? '', /Constitution/);
  s.flags['constitution.clause'] = 'courts';
  assert.ok(!nominees(s).some((n) => n.lean === 'you'), 'the commission list has no friends of the President');
  assert.equal(reformAuthority('s4'), 'constitutional');
  s.turn = 49; s.ending = 'defeated';
  const next = newGame({ ...setup, name: 'Successor' }, s);
  assert.ok(ruleInForce(next, 'prosecutor') && ruleInForce(next, 'judicial'), 'the successor is bound by the same rules');
  assert.ok(rules(next).some((r) => r.entrenched));
});

check('the court decides on the merits and says why; independence is not opposition', () => {
  const s = fresh();
  const bench = benchOf(s).seats.filter(Boolean) as never[];
  const says: Facts['says'] = { authority: ['No power to do it.', 'The power was the President\'s.'], evidence: ['No evidence.', 'Enough evidence.'], precedent: ['Struck down before.', 'Upheld before.'], procedure: ['Not heard.', 'Heard.'] };
  const weak = decide(bench, { authority: 0.1, evidence: 0.3, precedent: 0.4, procedure: 0.3, subject: 'x', says });
  assert.ok(!weak.upheld && /No power|No evidence|Not heard/.test(weak.reasoning), `struck down with reasons: ${weak.reasoning}`);
  const strong = decide(bench, { authority: 0.9, evidence: 0.85, precedent: 0.7, procedure: 0.8, subject: 'x', says });
  assert.ok(strong.upheld, 'a lawful, well-evidenced act is upheld');
  const opposed = strong.votes.filter((v) => v.justice.lean === 'them' && v.justice.integrity >= 3);
  assert.ok(opposed.length && opposed.every((v) => v.forGovt), 'honest justices who lean against the government still uphold it');
});

console.log(`${passed} institution and court checks passed.`);
