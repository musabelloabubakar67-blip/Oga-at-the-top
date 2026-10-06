import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../content/names';
import { newGame, applyAction, availability } from '../engine/reduce';
import { applyDomainOutcome } from '../engine/domain-outcomes';
import { CONTRACT_VERSION, type DomainEffect } from '../engine/contracts';
import { commitmentsView, fundCommitment, reviewCommitment, reviewCommitmentsDue, sampleTargetBudgets, setMinisterTarget } from '../engine/commitments';
import { getVar } from '../engine/vars';
import { addMark, scorecard } from '../engine/people';
import { clockOf, ensureGovernance } from '../engine/governance';
import { treasuryTick } from '../engine/treasury';
import { SECTOR_BY_ID } from '../content/treasury';
import { EVENTS } from '../content';
import { buildDesk } from '../engine/director';

const setup = { seed: 42, name: 'Tester', party: 'PSC', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = () => { const s = newGame(setup); s.phase = 'desk'; s.pc = 80; s.nation.fiscalSpace = 5; return s; };
const effect = (...effects: DomainEffect[]) => ({ version: CONTRACT_VERSION, effects });
const open = (s: ReturnType<typeof fresh>, id = 'test.delivery', resources?: number) => applyDomainOutcome(s, effect({ type: 'commitment.open', id, responsible: { office: 'min_works' }, object: 'delivery', text: 'Deliver the agreed service', afterMonths: 6, visibility: 'public', verify: { flag: 'test.delivered' }, ...(resources === undefined ? {} : { resources: { naira: resources } }) }));

export function runCommitmentChecks(): number {
  let passed = 0;
  const check = (label: string, test: () => void) => { test(); passed++; process.stdout.write('PASS ' + label + '\n'); };
  check('commitment payments conserve cash and roll back with invalid later effects', () => {
    const s = fresh(); open(s, 'test.delivery', 0.5);
    const before = JSON.stringify(s);
    assert.throws(() => applyDomainOutcome(s, effect({ type: 'commitment.fund', id: 'test.delivery', amount: 0.2, reason: 'First tranche' }, { type: 'commitment.note', id: 'missing', text: 'Invalid' })));
    assert.equal(JSON.stringify(s), before);
    applyDomainOutcome(s, effect({ type: 'commitment.fund', id: 'test.delivery', amount: 0.2, reason: 'First tranche' }));
    assert.equal(s.nation.fiscalSpace, 4.8);
    assert.equal(s.governance!.commitments['test.delivery'].resources!.released, 0.2);
    assert.equal(s.governance!.commitments['test.delivery'].resources!.payments[0].amount, 0.2);
    const paid = JSON.stringify(s); assert.throws(() => fundCommitment(s, 'test.delivery', 0.4, 'Too much'));
    assert.equal(JSON.stringify(s), paid);
  });
  check('an unfunded missed commitment records government withholding at its due date', () => {
    const s = fresh(); open(s, 'test.delivery', 0.5); fundCommitment(s, 'test.delivery', 0.2, 'Released');
    s.turn = 6; reviewCommitmentsDue(s); assert.equal(s.governance!.commitments['test.delivery'].review, undefined);
    s.turn = 7; reviewCommitmentsDue(s);
    const c = s.governance!.commitments['test.delivery'];
    assert.equal(c.review!.verdict, 'withheld'); assert.equal(c.status, 'broken');
    assert.match(c.review!.governmentContribution[0], /0.300tn was not released/);
    assert.equal(s.flags['review.test.delivery.withheld'], true);
    const before = JSON.stringify(s); reviewCommitmentsDue(s); assert.equal(JSON.stringify(s), before);
  });
  check('a real commitment payment choice is disabled without cash and pays once when funded', () => {
    const s = fresh(); open(s, 'test.delivery', 0.5); s.nation.fiscalSpace = 0.1;
    const id = 'contracts.commitment-payment';
    EVENTS[id] = { ...EVENTS['min.failing'], id, cast: undefined, choices: [{ id: 'pay', label: 'Release the money', pc: 2, outcomes: [{ result: 'Paid', archive: 'Released funding.', quiet: 'Private payment', domain: effect({ type: 'commitment.fund', id: 'test.delivery', amount: 0.2, reason: 'Agreed tranche' }) }] }] };
    try {
      s.desk.lead = { eventId: id };
      assert.equal(availability(s, EVENTS[id].choices[0]).ok, false);
      const denied = applyAction(s, { type: 'CHOOSE', eventId: id, choiceId: 'pay' });
      assert.equal(denied.nation.fiscalSpace, 0.1); assert.equal(denied.pc, s.pc);
      assert.equal(denied.governance!.commitments['test.delivery'].resources!.released, 0);
      s.nation.fiscalSpace = 0.5;
      const out = applyAction(s, { type: 'CHOOSE', eventId: id, choiceId: 'pay' });
      assert.equal(out.nation.fiscalSpace, 0.3); assert.equal(out.governance!.commitments['test.delivery'].resources!.released, 0.2);
      const again = applyAction(out, { type: 'CHOOSE', eventId: id, choiceId: 'pay' });
      assert.equal(again.nation.fiscalSpace, 0.3);
    } finally { delete EVENTS[id]; }
  });
  check('an insolvent treasury does not disable free choices', () => {
    const s = fresh(); s.nation.fiscalSpace = -1; s.nation.debt = 130;
    assert.equal(availability(s, { id: 'free', label: 'Decline spending', outcomes: [{ result: 'Declined', archive: 'Declined.' }] }).ok, true);
  });
  check('verified delivery and supported disputes have durable evidence histories', () => {
    const s = fresh(); open(s); s.turn = 7;
    assert.throws(() => reviewCommitment(s, 'test.delivery', 'met', ['A claim without delivery']));
    reviewCommitment(s, 'test.delivery', 'disputed', ['The inspection is contested']);
    assert.equal(s.governance!.commitments['test.delivery'].status, 'review-due');
    s.flags['test.delivered'] = true;
    reviewCommitment(s, 'test.delivery', 'met', ['Independent inspection confirmed delivery']);
    assert.equal(s.governance!.commitments['test.delivery'].reviews!.length, 2);
    assert.equal(s.governance!.commitments['test.delivery'].status, 'kept');
    assert.equal(s.flags['review.test.delivery.disputed'], false);
    assert.equal(s.flags['review.test.delivery.met'], true);
  });
  check('a date alone never proves a commitment was kept', () => {
    const s = fresh(); applyDomainOutcome(s, effect({ type: 'commitment.open', id: 'test.no-test', responsible: { office: 'president' }, object: 'promise', text: 'An undertaking without agreed evidence', afterMonths: 1, visibility: 'private' }));
    s.turn = 3; reviewCommitmentsDue(s);
    const c = s.governance!.commitments['test.no-test']; assert.equal(c.status, 'review-due'); assert.equal(c.review, undefined);
  });
  check('score variables and written targets use the real scorecard and exact deadline', () => {
    const s = fresh(); const id = setMinisterTarget(s, 'min_works', 6);
    const c = s.governance!.commitments[id];
    assert.equal(c.target!.baseline, scorecard(s, 'min_works').score);
    assert.equal(getVar(s, 'score.min_works'), c.target!.baseline);
    assert.equal(getVar(s, 'target.min_works'), 0); assert.equal(c.due, clockOf(s).worldMonth + 6);
    addMark(s, 'min_works', 4, 'Independent delivery verified');
    s.turn = 6; reviewCommitmentsDue(s); assert.equal(c.review, undefined);
    s.turn = 7; reviewCommitmentsDue(s); assert.equal(c.review!.verdict, 'met'); assert.equal(getVar(s, 'target.min_works'), 1);
    assert.equal(s.report.filter((r) => r.title.startsWith('Commitment review')).length, 1);
  });
  check('historical presidential holds remain in a missed ministerial review after release policy changes', () => {
    const s = fresh(), id = setMinisterTarget(s, 'min_works', 6);
    s.budget.alloc.power = SECTOR_BY_ID.power.usual + 2;
    s.budget.release = { power: 'hold' }; s.turn = 2; sampleTargetBudgets(s);
    const sample = s.governance!.commitments[id].target!.samples[0];
    assert.equal(sample.mode, 'hold'); assert.ok(sample.released < sample.allocated);
    sampleTargetBudgets(s); assert.equal(s.governance!.commitments[id].target!.samples.length, 1);
    s.budget.release.power = 'full'; s.turn = 7; sampleTargetBudgets(s); reviewCommitmentsDue(s);
    const c = s.governance!.commitments[id]; assert.equal(c.review!.verdict, 'withheld');
    assert.equal(getVar(s, 'target.min_works'), -1);
    assert.ok(c.review!.governmentContribution.some((line) => line.includes('1 month(s) held')));
  });
  check('replacement is not judged on the previous minister’s target', () => {
    const s = fresh(), id = setMinisterTarget(s, 'min_works', 6);
    s.people.min_works.name = 'Replacement Minister'; ensureGovernance(s); s.turn = 7; reviewCommitmentsDue(s);
    assert.equal(s.governance!.commitments[id].review!.verdict, 'disputed');
    assert.equal(getVar(s, 'target.min_works'), 0);
    assert.match(s.governance!.commitments[id].review!.evidence[0], /replacement is not judged/);
  });
  check('a minister leaving the government produces a dispute rather than a review crash', () => {
    const s = fresh(), id = setMinisterTarget(s, 'min_works', 6);
    s.people.min_works.gone = true; s.turn = 7; reviewCommitmentsDue(s);
    assert.equal(s.governance!.commitments[id].review!.verdict, 'disputed');
  });
  check('holds with no modelled spending effect do not excuse a missed target', () => {
    const s = fresh(), id = setMinisterTarget(s, 'min_works', 6);
    s.budget.alloc.power = SECTOR_BY_ID.power.usual; s.budget.release = { power: 'hold' };
    s.turn = 2; sampleTargetBudgets(s); s.turn = 7; reviewCommitmentsDue(s);
    assert.equal(s.governance!.commitments[id].target!.samples[0].governmentWithheld, 0);
    assert.equal(s.governance!.commitments[id].review!.verdict, 'missed');
  });
  check('a stalled budget records the increases the existing monthly model actually blocks', () => {
    const s = fresh(), id = setMinisterTarget(s, 'min_works', 6);
    s.budget.alloc.power = SECTOR_BY_ID.power.usual + 2; s.budget.late = true; s.counters.budgetTurn = 1;
    s.turn = 2; sampleTargetBudgets(s);
    const r = s.governance!.commitments[id].target!.samples[0];
    assert.equal(r.released, SECTOR_BY_ID.power.usual); assert.equal(r.governmentWithheld, 2);
  });
  check('the real written-target choice stores a target without crediting delivery', () => {
    const s = fresh(); s.turn = 12; s.desk.lead = { eventId: 'min.failing', cast: { WHO: 'min_works' } };
    const score = scorecard(s, 'min_works').score, before = JSON.stringify(s);
    const out = applyAction(s, { type: 'CHOOSE', eventId: 'min.failing', choiceId: 'target' });
    const c = Object.values(out.governance!.commitments).find((c) => c.target?.office === 'min_works')!;
    assert.ok(c); assert.equal(c.target!.baseline, score); assert.equal(scorecard(out, 'min_works').score, score);
    assert.equal(c.due, clockOf(s).worldMonth + 6); assert.equal(JSON.stringify(s), before);
  });
  check('monthly treasury processing records releases and successor views detach the evidence', () => {
    const s = fresh(), id = setMinisterTarget(s, 'min_works', 6); s.turn = 2; treasuryTick(s);
    assert.equal(s.governance!.commitments[id].target!.samples.length, 1);
    const v = commitmentsView(s); v.find((c) => c.id === id)!.target!.samples[0].allocated = 999;
    assert.notEqual(s.governance!.commitments[id].target!.samples[0].allocated, 999);
    const next = newGame({ ...setup, name: 'Successor' }, s);
    assert.deepEqual(next.governance!.commitments[id].target!.samples, s.governance!.commitments[id].target!.samples);
    next.governance!.commitments[id].target!.samples[0].allocated = 888;
    assert.notEqual(s.governance!.commitments[id].target!.samples[0].allocated, 888);
  });
  check('an authored target review is queued for the exact record and original minister', () => {
    const previous = EVENTS['min.target.review'];
    EVENTS['min.target.review'] = { ...EVENTS['min.failing'], id: 'min.target.review', kind: 'chain', slot: 'minor', when: undefined, choices: [{ id: 'read', label: 'Read the review', outcomes: [{ result: 'Reviewed', archive: 'Read a ministerial review.', quiet: 'Private review' }] }] };
    try {
      const s = fresh(), id = setMinisterTarget(s, 'min_works', 6);
      const q = s.queue.find((q) => q.event === 'min.target.review')!;
      assert.equal(q.due, 7); assert.equal(q.cast!.TARGET, id);
      assert.equal(q.castPersons!.WHO, s.governance!.commitments[id].responsible);
      s.queue = [q]; // Isolate the target from the setup's older Finance follow-ups.
      s.turn = 7; reviewCommitmentsDue(s); buildDesk(s);
      const item = s.desk.minors.find((m) => m.eventId === 'min.target.review')!;
      assert.ok(item); assert.equal(item.cast!.TARGET, id);
    } finally { if (previous) EVENTS['min.target.review'] = previous; else delete EVENTS['min.target.review']; }
  });
  return passed;
}
