// Experience check: programme coalitions, negotiated settlements and delegation (plan 06).
// Run: npx tsx tests/experience/legislation.check.ts
//
// - a bill the party will not carry passes through negotiation, and its concessions become
//   enforceable commitments with differentiated later reactions (kept, withdrawn, outvoted);
// - a pact's joint demand, refused, turns its members against bills on the issue; accepted, it is built in;
// - a delegated objective launches routine work without the President, escalates a bill, and
//   carries a six-month target that is actually reviewed.

import assert from 'node:assert/strict';
import { MILESTONE_BY_ID } from '../../content/agenda';
import { FINANCE_CANDIDATES } from '../../content/names';
import { delegations } from '../../engine/delegation';
import { answerCoalition, billPassed, formCoalition, isBill, voterView, whipCount } from '../../engine/legislature';
import { applyAction, canLaunch, milestoneStatus, newGame } from '../../engine/reduce';
import type { GameState } from '../../engine/types';
import { test } from '../../engine/vars';

const setup = { seed: 29, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 100; s.nation.fiscalSpace = 6; return s; };
const month = (s: GameState): GameState => { s.phase = 'desk'; s.desk.lead = null; s.desk.minors = []; s.budget.due = false; s.desk.actionsUsed = 0; return applyAction(s, { type: 'END_MONTH' }); };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

/** A bill that is ready to launch now, apart from the Senate. */
function readyBill(s: GameState): string {
  for (const id of Object.keys(MILESTONE_BY_ID)) {
    if (!isBill(id) || milestoneStatus(s, id) !== 'next') continue;
    const m = MILESTONE_BY_ID[id].m;
    if (m.needs && !test(s, m.needs)) return id;
  }
  throw new Error('no bill ready');
}
/** Turns the party and the senators against the government, so the Senate condition fails. */
function hostileSenate(s: GameState): void {
  s.blocs.party = 40;
  for (const id of ['sen_pres', 'sen_lead', 'sen_approp', 'sen_rebel']) s.people[id].rel = 42;
}

check('a bill the party will not carry passes through negotiation and its concessions bind', () => {
  let s = fresh(); hostileSenate(s);
  const id = readyBill(s);
  assert.equal(canLaunch(s, id).ok, false, 'the party will not carry it');
  // A Senate that is openly hostile is not bought with one provision.
  const h = fresh(); h.blocs.party = 20; for (const v of ['sen_pres', 'sen_lead', 'sen_approp', 'sen_rebel']) h.people[v].rel = 30;
  const t = applyAction(h, { type: 'CONCEDE', id, voter: 'sen_pres', kind: 'appointment' });
  assert.equal(whipCount(t, id).majority, false, 'one concession does not carry a hostile Senate');
  // Concede to each voter what they value most, until the count holds.
  const order = whipCount(s, id).voters.sort((a, b) => b.weight - a.weight).map((v) => v.id);
  for (const voter of order) {
    if (whipCount(s, id).majority && order.indexOf(voter) >= 2) break;
    const kind = voter === 'sen_approp' ? 'revenue' : voter === 'sen_lead' ? 'date' : voter === 'sen_rebel' ? 'oversight' : 'appointment';
    s = applyAction(s, { type: 'CONCEDE', id, voter, kind });
    s.desk.actionsUsed = 0;
  }
  assert.ok(whipCount(s, id).majority, 'the negotiated count holds');
  assert.equal(canLaunch(s, id).ok, true, 'and the bill can go forward');
  s = applyAction(s, { type: 'LAUNCH', id });
  const a = s.agenda.active.find((x) => x.id === id)!;
  a.progress = 99.99;
  const outvoted = whipCount(s, id).voters.filter((v) => !v.yes).map((v) => ({ id: v.id, rel: s.people[v.id].rel }));
  s = month(s);
  assert.ok(s.agenda.done.includes(id), 'the bill passed');
  const b = s.bills![id];
  assert.ok(b.passed !== undefined && b.concessions.length >= 2, 'passed on at least two concessions');
  const cms = Object.values(s.governance!.commitments).filter((c) => c.object === 'bill-concession');
  assert.equal(cms.length, b.concessions.length, 'every concession is a commitment');
  for (const o of outvoted) assert.ok(s.people[o.id].rel <= o.rel, 'the outvoted remember');
  // A later start defers the effects; a share for the states is paid monthly.
  if (b.concessions.some((c) => c.kind === 'date')) assert.ok(b.deferred, 'the later start is held');
  const share = b.concessions.find((c) => c.kind === 'revenue');
  if (share) assert.ok((share.payUntil ?? 0) > s.turn);
  // Withdraw one: it is a broken commitment, its holder is wronged, and the others notice.
  const first = b.concessions[0], other = b.concessions[1];
  const before = s.people[first.voter].rel, otherBefore = other ? s.people[other.voter].rel : 0;
  s.phase = 'desk';
  s = applyAction(s, { type: 'REVOKE_CONCESSION', id, voter: first.voter });
  assert.equal(s.governance!.commitments[first.commitment!].status, 'broken');
  assert.ok(s.people[first.voter].rel <= before - 15);
  assert.ok(s.people[other.voter].rel < otherBefore, 'others promised something notice');
  // A year on, the kept ones are reviewed as met, and the reaction differs from the broken one.
  for (let i = 0; i < 13; i++) s = month(s);
  if (other) {
    assert.equal(s.governance!.commitments[other.commitment!].status, 'kept');
    assert.ok(s.bills![id].concessions.find((c) => c.voter === other.voter)!.reacted, 'a deal that held is acknowledged');
  }
});

check('a pact\'s joint demand: refused, its members vote together against; accepted, it is built in', () => {
  const s = fresh();
  const k = formCoalition(s, 'sen_approp', 'gov_nc')!;
  assert.ok(k, 'the pact makes a demand');
  assert.ok(s.governance!.requests[k.request!], 'and it is on the register as a request');
  const bill = Object.keys(MILESTONE_BY_ID).find((id) => isBill(id) && MILESTONE_BY_ID[id].track.id === k.issue);
  if (bill) {
    const before = voterView(s, bill, 'sen_approp').score;
    answerCoalition(s, k.id, false);
    assert.ok(voterView(s, bill, 'sen_approp').score < before, 'refused: against');
    const t = fresh();
    const k2 = formCoalition(t, 'sen_approp', 'gov_nc')!;
    answerCoalition(t, k2.id, true);
    assert.ok(voterView(t, bill, 'sen_approp').score > before, 'accepted: for');
  } else answerCoalition(s, k.id, true);
});

check('a delegated objective runs routine work, escalates what it cannot do, and is reviewed at six months', () => {
  let s = fresh();
  const office = 'min_power';
  const pc = s.pc;
  s = applyAction(s, { type: 'DELEGATE', office, track: 'power', budget: 0.6, months: 12, reporting: 3 });
  const d = delegations(s)[office];
  assert.ok(d, 'delegated');
  assert.ok(d.target && s.governance!.commitments[d.target], 'with a written six-month target');
  s.agenda.active = s.agenda.active.filter((a) => MILESTONE_BY_ID[a.id]?.track.id !== 'power');
  const pcAfter = s.pc;
  s = month(s);
  const launched = delegations(s)[office]?.launched ?? [];
  const escalations = s.report.filter((r) => /escalates/.test(r.title));
  assert.ok(launched.length > 0 || escalations.length > 0, 'the minister acted, or brought it back');
  if (launched.length) assert.ok(s.pc >= pcAfter - 1, 'without the President\'s capital');
  assert.ok(pc > pcAfter, 'delegating itself cost capital');
  for (let i = 0; i < 7; i++) s = month(s);
  const target = s.governance!.commitments[d.target!];
  assert.ok(target.review, 'the target was actually reviewed');
  assert.ok(['met', 'missed', 'withheld', 'disputed'].includes(target.review!.verdict));
});

check('a concession to someone who has left the post lapses at the vote instead of failing it', () => {
  let s = fresh(); hostileSenate(s);
  const id = readyBill(s);
  s = applyAction(s, { type: 'CONCEDE', id, voter: 'sen_lead', kind: 'date' });
  s.people.sen_lead.gone = true;
  billPassed(s, id, []);
  assert.ok(s.bills![id].concessions.every((c) => c.revoked !== undefined), 'the concession lapsed');
  assert.ok(!Object.values(s.governance!.commitments).some((c) => c.object === 'bill-concession'), 'and no commitment was made to them');
});

console.log(`${passed} legislation and delegation checks passed.`);
