// Experience check: recurring problems as developing stories (plan 07).
// Run: npx tsx tests/experience/stories.check.ts
//
// - every family names real events, and every family with an exit has a closing and a next question;
// - over a long campaign, drawn files in a family respect its pacing, the same person is not
//   the subject month after month, and the report contains closings and quiet progress;
// - a solved problem stops demanding the same decision and says so once; if it returns,
//   the new episode says how long the solution held.

import assert from 'node:assert/strict';
import { EVENTS } from '../../content';
import { FAMILIES, FAMILY_OF } from '../../content/families';
import { FINANCE_CANDIDATES } from '../../content/names';
import { eligible } from '../../engine/director';
import { episodes, reportClass, subjectOf } from '../../engine/episodes';
import { applyAction, newGame } from '../../engine/reduce';
import type { GameState } from '../../engine/types';

const setup = { seed: 61, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const month = (s: GameState): GameState => { s.phase = 'desk'; s.night = undefined as unknown as GameState['night']; s.desk.lead = null; s.desk.minors = []; s.budget.due = false; s.budget.pending = undefined as unknown as GameState['budget']['pending']; s.desk.actionsUsed = 0; return applyAction(s, { type: 'END_MONTH' }); };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('every family names real events; every family with an exit closes and says what comes next', () => {
  for (const f of FAMILIES) {
    for (const e of f.events) assert.ok(EVENTS[e], `${f.id}: ${e} is not an event`);
    if (f.exit || f.exitBy) { assert.ok(f.closing, `${f.id} has no closing`); assert.ok(f.next, `${f.id} has no next question`); }
  }
});

check('a long campaign is paced: families keep their gaps, and quiet progress appears in the report', () => {
  let s = newGame(setup); s.phase = 'desk';
  const draws: { turn: number; id: string }[] = [];
  s.pc = 100; s = applyAction(s, { type: 'LAUNCH', id: 'p1' });
  const classes = new Set<string>();
  for (let i = 0; i < 60 && s.phase !== 'verdict'; i++) {
    // Govern a little so that problems can be solved: pay what is owed and keep the cash up.
    s.nation.fiscalSpace = Math.max(s.nation.fiscalSpace, 1.5);
    s.debts.gas = Math.max(0, s.debts.gas - 0.1);
    if (i === 20) { s.agenda.done.push('p2'); s.nation.power = 60; s.debts.gas = 0; }
    s = month(s);
    for (const r of s.report) classes.add(reportClass(r));
    const lead = s.desk.lead?.eventId;
    if (lead) draws.push({ turn: s.turn, id: lead });
  }
  // Pacing: two drawn files of the same family and subject never arrive closer than the family's gap,
  // unless the second was a queued follow-up (those are intentional beats).
  for (const f of FAMILIES) {
    const mine = draws.filter((d) => FAMILY_OF[d.id] === f && EVENTS[d.id].kind !== 'chain');
    for (let i = 1; i < mine.length; i++) {
      if (subjectOf(f, mine[i].id) !== subjectOf(f, mine[i - 1].id)) continue;
      assert.ok(mine[i].turn - mine[i - 1].turn >= f.gap, `${f.id}: ${mine[i - 1].id} then ${mine[i].id} after ${mine[i].turn - mine[i - 1].turn} months`);
    }
  }
  assert.ok(classes.has('progress'), 'the report shows quiet progress');
  assert.ok(Object.keys(episodes(s)).length > 0, 'recurring problems were followed as episodes');
});

check('a solved problem stops demanding, closes once, and if it returns says how long it held', () => {
  let s = newGame(setup); s.phase = 'desk';
  // Open the electricity episode with a collapse.
  s.nation.power = 30; s.debts.gas = 1;
  const grid = EVENTS['grid.collapse'];
  s.turn = 5;
  s.desk.lead = null;
  (s.fired['grid.collapse'] ??= []).push(s.turn);
  // Record it as the episode's first beat, as the director does.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { beat } = require('../../engine/episodes') as typeof import('../../engine/episodes');
  beat(s, 'grid.collapse');
  // Solve it.
  s.agenda.done.push('p2'); s.nation.power = 60; s.debts.gas = 0;
  s.turn = 30;
  assert.equal(eligible(s, grid), false, 'the grid file no longer comes');
  s = month(s);
  const closings = s.report.filter((r) => reportClass(r) === 'closing' && /collapse/i.test(r.title));
  assert.equal(closings.length, 1, 'closed with one report');
  assert.match(closings[0].text ?? '', /dedicated feeders/, 'and the next question is named');
  s = month(s);
  assert.equal(s.report.filter((r) => /collapse/i.test(r.title) && reportClass(r) === 'closing').length, 0, 'said once');
  // It comes back.
  s.agenda.done = s.agenda.done.filter((x) => x !== 'p2'); s.nation.power = 30;
  beat(s, 'grid.collapse');
  assert.ok(s.report.some((r) => /problem is back/.test(r.title) && /settled for/.test(r.text ?? '')), 'the return says how long it held');
});

console.log(`${passed} story checks passed.`);
