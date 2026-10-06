// Experience check: the recruitment screen offers posts the engine accepts, and its flow works (contract R5).
// Run: npx tsx tests/experience/recruitment.check.ts
//
// - every exceptional candidate has at least one post the screen offers and the engine accepts;
// - approaching on every term, then appointing, puts them in post with the capability active;
// - refusing one term is a recorded refusal naming it, and the same offer cannot be repeated;
// - leaving a post vacant through the screen's mapping works and is recorded.

import assert from 'node:assert/strict';
import { CANDIDATES } from '../../content/candidates';
import { FINANCE_CANDIDATES } from '../../content/names';
import { canApproach, getRecruitmentView, getVacancyView, hasCapability } from '../../engine/public';
import { applyAction, movesLeft, newGame } from '../../engine/reduce';
import type { GameState } from '../../engine/types';
import { postsFor } from '../../ui/Talent';

const setup = { seed: 17, name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 100; s.nation.fiscalSpace = 5; s.nation.integrity = 60; return s; };
const EXCEPTIONAL = CANDIDATES.filter((c) => c.exceptional);
const offered = (s: GameState, id: string) => {
  const c = CANDIDATES.find((x) => x.id === id)!;
  const all = c.exceptional!.conditions.map((k) => k.id);
  return c.roles.flatMap((r) => postsFor(s, r)).filter((p) => canApproach(s, id, p, all, movesLeft(s)).ok);
};

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('every exceptional candidate has a post the screen offers and the engine accepts', () => {
  for (const c of EXCEPTIONAL) assert.ok(offered(fresh(), c.id).length > 0, `${c.id}: no acceptable post offered`);
});

check('approach on every term, then appoint: in post, capability active', () => {
  for (const c of EXCEPTIONAL) {
    let s = fresh();
    const post = offered(s, c.id)[0];
    const terms = c.exceptional!.conditions.map((k) => k.id);
    s = applyAction(s, { type: 'APPROACH_CANDIDATE', id: c.id, post, acceptedTerms: terms });
    assert.equal(getRecruitmentView(s).at(-1)?.status, 'agreed', `${c.id}: not agreed`);
    s.desk.actionsUsed = 0;
    s = applyAction(s, { type: 'APPOINT', id: c.id, post });
    const r = getRecruitmentView(s).filter((x) => x.candidateId === c.id).at(-1)!;
    assert.equal(r.status, 'active', `${c.id}: not active after appointment`);
    for (const cap of c.exceptional!.capabilities) assert.ok(hasCapability(s, cap.id), `${c.id}: ${cap.id} not active`);
  }
});

check('refusing one term is a recorded refusal naming it; the identical offer cannot be repeated', () => {
  const c = EXCEPTIONAL[0];
  let s = fresh();
  const post = offered(s, c.id)[0];
  const [first, ...rest] = c.exceptional!.conditions;
  s = applyAction(s, { type: 'APPROACH_CANDIDATE', id: c.id, post, acceptedTerms: rest.map((k) => k.id) });
  const r = getRecruitmentView(s).at(-1)!;
  assert.equal(r.status, 'declined');
  assert.ok(r.reason.includes(first.text), 'the refusal should name the refused term');
  s.desk.actionsUsed = 0;
  assert.ok(!canApproach(s, c.id, post, rest.map((k) => k.id), movesLeft(s)).ok);
});

check('leaving a minister\'s post vacant through the screen\'s mapping is recorded', () => {
  let s = fresh();
  const post = postsFor(s, 'min_works')[0];
  assert.deepEqual(post, { kind: 'minister', id: 'min_works' });
  s = applyAction(s, { type: 'LEAVE_VACANT', post });
  assert.ok(Object.values(getVacancyView(s)).some((v) => v.post.kind === 'minister' && 'id' in v.post && v.post.id === 'min_works'));
});

console.log(`${passed} recruitment checks passed (${EXCEPTIONAL.length} exceptional candidates).`);
