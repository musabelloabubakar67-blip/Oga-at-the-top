// Experience check: the authored governance records (contract 1.0.0, S8 tokens)
// behave as the files describe, through the real reducer.
// Run: npx tsx tests/experience/records.check.ts
//
// For each of the six files: choosing an option opens or closes the record the
// text implies; follow-ups address the original id; a successor's presidency in
// the same world can open the same file again without a duplicate-id failure.

import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../../content/names';
import { getGovernanceView } from '../../engine/public';
import { applyAction, newGame } from '../../engine/reduce';
import type { GameState } from '../../engine/types';
import { test } from '../../engine/vars';

const setup = { seed: 7, name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 100; s.nation.fiscalSpace = 5; return s; };

/** Puts a file on the desk (lead or phone) and chooses. */
function choose(s: GameState, eventId: string, choiceId: string, phone = false): GameState {
  s.phase = 'desk';
  if (phone) { s.desk.minors = [{ eventId }]; s.desk.lead = null as unknown as GameState['desk']['lead']; }
  else s.desk.lead = { eventId };
  const next = applyAction(s, { type: 'CHOOSE', eventId, choiceId });
  const item = phone ? next.desk.minors.find((m) => m.eventId === eventId) : next.desk.lead;
  assert.ok(item?.resolved, `${eventId}/${choiceId} was not resolved (availability or requirements failed)`);
  return next;
}

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };
const view = (s: GameState) => getGovernanceView(s);
const admin = (s: GameState) => view(s).clock.administrationId;

check('the governor\'s road: called back closes the request as withdrawn', () => {
  const s = choose(fresh(), 'minor.governor_call', 'call', true);
  const r = view(s).requests.find((x) => x.id === `road.ss.${admin(s)}`);
  assert.equal(r?.status, 'withdrawn');
  assert.equal(r?.origin.eventId, 'minor.governor_call');
});

check('the governor\'s road: a message left unanswered at month end closes the request as refused', () => {
  const s = fresh();
  s.desk.lead = null as unknown as GameState['desk']['lead'];
  s.desk.minors = [{ eventId: 'minor.governor_call' }];
  s.budget.due = false;
  const a = admin(s);
  const next = applyAction(s, { type: 'END_MONTH' });
  const r = view(next).requests.find((x) => x.id === `road.ss.${a}`);
  assert.equal(r?.status, 'refused');
  assert.equal(r?.response, 'The message was not returned.');
});

check('the governor\'s road: funding grants it and commits Works to finish it; the follow-up notes it', () => {
  let s = choose(fresh(), 'minor.governor_call', 'road', true);
  const a = admin(s);
  assert.equal(view(s).requests.find((x) => x.id === `road.ss.${a}`)?.status, 'granted');
  const c = view(s).commitments.find((x) => x.id === `road.ss.finish.${a}`);
  assert.equal(c?.visibility, 'public');
  assert.equal(c?.due, view(s).clock.worldMonth + 12);
  s.turn += 11;
  s = choose(s, 'react.road_done', 'his', true);
  const after = view(s).commitments.find((x) => x.id === `road.ss.finish.${a}`);
  assert.equal(after?.notes.length, 1);
  assert.match(after!.notes[0].text, /took the credit/);
});

check('the doctors: paying half opens a dated public commitment for the rest', () => {
  const s = choose(fresh(), 'doctors.strike', 'part');
  const c = view(s).commitments.find((x) => x.id === `doctors.balance.${admin(s)}`);
  assert.equal(c?.status, 'open');
  assert.equal(c?.visibility, 'public');
  assert.equal(c?.due - c!.made, 3);
});

check('Senator Dandume: stalling stores a private promise; the follow-up records whether it was kept', () => {
  let s = fresh();
  s.flags['rival.strong.in'] = true;
  s = choose(s, 'owe.decamp', 'stall');
  const id = `dandume.ministry.${admin(s)}`;
  assert.equal(view(s).commitments.find((x) => x.id === id)?.visibility, 'private');
  s.turn += 6;
  s = choose(s, 'owe.decamp.leaves', 'give', true);
  assert.match(view(s).commitments.find((x) => x.id === id)!.notes[0].text, /Given, late/);
});

check('Dr Gwarzo: her terms are a public commitment, and the election budget notes whether they held', () => {
  const kept = (choice: 'back' | 'overrule', pattern: RegExp) => {
    let s = fresh();
    s.flags['fin.pick'] = 'gwarzo';
    s = choose(s, 'fin.gwarzo.offer', 'keep');
    const id = `fin.terms.gwarzo.${admin(s)}`;
    assert.equal(view(s).commitments.find((x) => x.id === id)?.visibility, 'public');
    s.turn += 12;
    s = choose(s, 'fin.gwarzo.budget', choice);
    assert.match(view(s).commitments.find((x) => x.id === id)!.notes[0].text, pattern);
  };
  kept('back', /^Honoured/);
  kept('overrule', /^Broken/);
});

check('Dr Gwarzo without terms: the budget file does not touch a record that was never opened', () => {
  let s = fresh();
  s.flags['fin.pick'] = 'gwarzo';
  s = choose(s, 'fin.gwarzo.budget', 'back');
  assert.equal(view(s).commitments.length, 0);
});

check('the Appropriations understanding: agreeing grants the request and stores a private commitment; refusing closes it', () => {
  const yes = choose(fresh(), 'fin.lohor.committee', 'agree');
  assert.equal(view(yes).requests.find((r) => r.id.startsWith('approp.'))!.status, 'granted');
  assert.equal(view(yes).commitments.find((x) => x.id === `approp.projects.${admin(yes)}`)?.visibility, 'private');
  const no = choose(fresh(), 'fin.lohor.committee', 'refuse');
  assert.equal(view(no).requests.find((r) => r.id.startsWith('approp.'))!.status, 'refused');
  assert.equal(view(no).commitments.length, 0);
});

check('the elders: terms before the primary are stored, and the second term records what became of them', () => {
  for (const [choice, pattern] of [['honour', /^Honoured/], ['half', /^Partly honoured/], ['refuse', /^Broken/]] as const) {
    let s = fresh();
    s.turn = 34;
    s = choose(s, 'ticket.elders', 'terms');
    const id = `elders.terms.${admin(s)}`;
    assert.ok(view(s).commitments.find((x) => x.id === id));
    s.turn = 51; s.term = 2;
    s = choose(s, 'second.promise', choice);
    assert.match(view(s).commitments.find((x) => x.id === id)!.notes[0].text, pattern);
  }
});

check('the elders\' promise set by an order, with no record: the second term does not fail', () => {
  let s = fresh();
  s.flags['promise.second_term'] = true;
  s.turn = 51; s.term = 2;
  s = choose(s, 'second.promise', 'honour');
  assert.equal(view(s).commitments.length, 0);
});

check('a successor in the same world can open the same records again', () => {
  let s = choose(fresh(), 'doctors.strike', 'part');
  s = choose(s, 'fin.lohor.committee', 'agree');
  s.turn = 49; s.ending = 'defeated';
  let next = newGame({ ...setup, name: 'Successor' }, s);
  next.phase = 'desk'; next.pc = 100; next.nation.fiscalSpace = 5;
  next = choose(next, 'doctors.strike', 'part');
  next = choose(next, 'fin.lohor.committee', 'agree');
  const ids = view(next).commitments.map((c) => c.id);
  assert.equal(ids.filter((id) => id.startsWith('doctors.balance.')).length, 2);
  assert.equal(ids.filter((id) => id.startsWith('approp.projects.')).length, 2);
});

// ---- contract R4: every authored commitment can be judged

check('the doctors\' balance: paying it on the due date releases the allocation once and is reviewed as met', () => {
  let s = choose(fresh(), 'doctors.strike', 'part');
  const id = `doctors.balance.${admin(s)}`;
  assert.equal(view(s).commitments.find((x) => x.id === id)?.resources?.naira, 0.019);
  assert.ok(s.queue.some((q) => q.event === 'doctors.balance.due'), 'the due-date file is not queued');
  s.turn += 3;
  const cash = s.nation.fiscalSpace;
  s = choose(s, 'doctors.balance.due', 'pay', true);
  const c = view(s).commitments.find((x) => x.id === id)!;
  assert.equal(c.review?.verdict, 'met');
  assert.equal(c.status, 'kept');
  assert.ok(Math.abs(c.resources!.released - 0.019) < 1e-9);
  assert.ok(Math.abs(cash - s.nation.fiscalSpace - 0.019) < 1e-9, 'the balance was not paid exactly once');
});

check('the doctors\' balance: asking for another quarter is reviewed as withheld, with the government\'s part stated', () => {
  let s = choose(fresh(), 'doctors.strike', 'part');
  const id = `doctors.balance.${admin(s)}`;
  s.turn += 3;
  s = choose(s, 'doctors.balance.due', 'wait', true);
  const c = view(s).commitments.find((x) => x.id === id)!;
  assert.equal(c.review?.verdict, 'withheld');
  assert.equal(c.status, 'broken');
  assert.ok(c.review!.governmentContribution.some((t) => /not released/.test(t)));
  assert.equal(s.flags[`review.${id}.withheld`], true);
});

check('the other commitments carry agreed tests that turn on what the President did', () => {
  const opened = (s: GameState, record: string) => view(s).commitments.find((x) => x.id === `${record}.${admin(s)}`)!;
  // Dandume: kept only if he is given the ministry.
  let s = fresh(); s.flags['rival.strong.in'] = true;
  s = choose(s, 'owe.decamp', 'stall');
  let c = opened(s, 'dandume.ministry');
  assert.ok(c.verify && !test(s, c.verify));
  s.turn += 4; s = choose(s, 'owe.decamp.leaves', 'give', true);
  assert.ok(test(s, c.verify!), 'giving the ministry should satisfy the promise');
  // Dr Gwarzo: her terms hold unless she is overruled on them.
  for (const [choice, held] of [['back', true], ['overrule', false]] as const) {
    let g = fresh(); g.flags['fin.pick'] = 'gwarzo';
    g = choose(g, 'fin.gwarzo.offer', 'keep');
    c = opened(g, 'fin.terms.gwarzo');
    g.turn += 12; g = choose(g, 'fin.gwarzo.budget', choice);
    assert.equal(test(g, c.verify!), held, `Gwarzo ${choice}`);
  }
  // The elders: judged on what became of the terms in the second term.
  for (const [choice, held] of [['honour', true], ['half', false], ['refuse', false]] as const) {
    let e = fresh(); e.turn = 34;
    e = choose(e, 'ticket.elders', 'terms');
    c = opened(e, 'elders.terms');
    assert.equal(c.due - c.made, 24);
    e.turn = 51; e.term = 2; e = choose(e, 'second.promise', choice);
    assert.equal(test(e, c.verify!), held, `elders ${choice}`);
  }
  // The governor's road: finished only when the follow-up reports it finished.
  let r = choose(fresh(), 'minor.governor_call', 'road', true);
  c = opened(r, 'road.ss.finish');
  assert.ok(!test(r, c.verify!));
  r.turn += 11; r = choose(r, 'react.road_done', 'go', true);
  assert.ok(test(r, c.verify!));
  // The Appropriations understanding: judged on the share the members' projects actually get.
  const a = choose(fresh(), 'fin.lohor.committee', 'agree');
  c = opened(a, 'approp.projects');
  a.budget.alloc.padding = 3; assert.ok(test(a, c.verify!));
  a.budget.alloc.padding = 1; assert.ok(!test(a, c.verify!));
});

console.log(`${passed} record checks passed.`);
