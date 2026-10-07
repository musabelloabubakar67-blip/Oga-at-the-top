// Experience check: the history book, the shortlist and shareable outcomes (plan 17).
// Run: npx tsx tests/experience/history.check.ts
//
// - a current dispute can be traced to the decisions that caused it;
// - threads mark announcement, financing and delivery, and which government did each;
// - shared verdicts come from the record and keep misconduct in;
// - the shortlist explains why; daily seeds and share codes reproduce a start; short scenarios end on their goal.

import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../../content/names';
import { PROPOSAL_BY_ID } from '../../content/proposals';
import { record } from '../../engine/archive';
import { dailySeed, decodeStart, encodeStart, pathsFor, shareText, threads, whyExists } from '../../engine/history';
import { proposalTick } from '../../engine/proposals';
import { applyAction, newGame } from '../../engine/reduce';
import { shortlist } from '../../engine/shortlist';
import type { GameState } from '../../engine/types';
import { applyFx } from '../../engine/vars';

const setup = { seed: 73, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (over: Partial<typeof setup> = {}): GameState => { const s = newGame({ ...setup, ...over }); s.phase = 'desk'; s.pc = 80; return s; };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('a current dispute can be traced to the decision that caused it', () => {
  const s = fresh();
  s.turn = 5;
  const e = record(s, 'reform.x1', 'launch', 'action', 'Launched: Raise VAT, with food and medicine exempt.', 1);
  s.turn = 10;
  const d = record(s, 'reform.x1', 'done', 'action', 'Raised VAT, exempting food and medicine.', 3);
  applyFx(s, ['nation.inflation', 1.5], d.touches);
  s.agenda.done.push('x1');
  void e;
  // The opposition campaigns to repeal it once salaried households are hurting.
  s.nation.inflation = 40;
  proposalTick(s);
  const p = (s.proposals ?? []).find((x) => x.id === 'prop.repealvat');
  assert.ok(p, 'the repeal campaign exists');
  const t = threads(s).find((x) => x.id === `prop.prop.repealvat.${p!.opened}`)!;
  const why = whyExists(s, pathsFor(t));
  assert.ok(why.some((a) => a.eventId === 'reform.x1'), 'the trace leads back to the VAT rise');
  assert.ok(PROPOSAL_BY_ID['prop.repealvat'].reverses === 'x1');
});

check('threads mark the stages and which government acted', () => {
  const prev = fresh();
  prev.turn = 3; record(prev, 'reform.p2', 'launch', 'action', 'Launched: Rebuild the weakest transmission corridors.', 2);
  prev.agenda.active.push({ id: 'p2', progress: 60 });
  prev.turn = 49; prev.ending = 'defeated';
  const next = newGame({ ...setup, name: 'Successor' }, prev);
  next.phase = 'desk'; next.turn = 6;
  record(next, 'reform.p2', 'done', 'action', 'Rebuilt the six weakest transmission corridors.', 3);
  const t = threads(next).find((x) => x.id === 'reform.p2')!;
  assert.ok(t.entries.some((e) => e.stage === 'announced' && e.earlier), 'announced by the earlier government');
  assert.ok(t.entries.some((e) => e.stage === 'financed'), 'financed at launch');
  assert.ok(t.entries.some((e) => e.stage === 'delivered' && !e.earlier), 'delivered by this one');
  assert.match(t.status, /begun by an earlier government and continued by this one/);
});

check('shared verdicts come from the record and keep misconduct in', () => {
  const s = fresh();
  s.purseTaken.personal = 42; s.purse = 42;
  s.exposures.push({ kind: 'personal', amount: 42, witnesses: ['ty_trade'], trail: 2, turn: 5, causeId: 'x', label: 'x' });
  s.turn = 49; s.ending = 'defeated'; s.phase = 'verdict';
  const text = shareText(s);
  assert.match(text, /₦42bn kept/, 'what was taken is in the shared verdict');
  assert.match(text, /Seed 73/);
});

check('the shortlist explains itself; seeds and codes reproduce a start; short scenarios end on their goal', () => {
  const s = fresh();
  s.nation.fiscalSpace = 0.02;
  const picks = shortlist(s);
  assert.ok(picks.length && picks[0].why.length > 10, 'each item says why');
  assert.equal(dailySeed(new Date(Date.UTC(2026, 9, 7))), 20261007);
  const code = encodeStart({ seed: 123, scenario: 'boom', background: 'technocrat', home: 'LA' });
  assert.deepEqual(decodeStart(code), { seed: 123, scenario: 'boom', background: 'technocrat', home: 'LA' });
  assert.equal(decodeStart('nonsense'), null);
  const a = fresh({ seed: 999 }), b = fresh({ seed: 999 });
  assert.equal(JSON.stringify(a.nation), JSON.stringify(b.nation), 'the same seed and scenario give the same country');
  let q = fresh({ scenario: 'queues' });
  for (let i = 0; i < 10 && q.phase !== 'verdict'; i++) { q.desk.lead = null; q.desk.minors = []; q.phase = 'desk'; q.budget.due = false; q = applyAction(q, { type: 'END_MONTH' }); }
  assert.equal(q.phase, 'verdict', 'the short scenario ends after nine months');
  assert.equal(typeof q.flags['short.met'], 'boolean', 'judged on its goal');
});

console.log(`${passed} history checks passed.`);
