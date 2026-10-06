// Experience check: a file that can come back says what has changed since last time (D14).
// Run: npx tsx tests/experience/recurrence.check.ts
//
// - every recurring or threshold file that can fire more than once has at least one
//   body line conditioned on its own history (a count, a flag its choices set, or fired/never);
// - through the real reducer, a choice sets the flag and the next occurrence shows the line;
// - per-person and per-reform flags are bound to the right person or reform by the cast.

import assert from 'node:assert/strict';
import { EVENTS, EVENT_LIST } from '../../content';
import { FINANCE_CANDIDATES } from '../../content/names';
import { materialise } from '../../engine/cast';
import { applyAction, newGame } from '../../engine/reduce';
import { blocks } from '../../engine/text';
import type { GameState } from '../../engine/types';

/** Files that repeat by design without a history line, and why. */
const EXEMPT: Record<string, string> = {
  'attack.farms': 'its body varies with the security situation (s2), which is the development',
  'ticket.primary': 'a calendar file, once per term (cooldown 60)',
};

const setup = { seed: 11, name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 100; s.nation.fiscalSpace = 5; return s; };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('every repeating file has a line that depends on its history', () => {
  const missing: string[] = [];
  for (const e of EVENT_LIST) {
    if (e.kind !== 'recurring' && e.kind !== 'threshold') continue;
    const max = e.max ?? Infinity;
    if (max <= 1 || EXEMPT[e.id]) continue;
    const conds = JSON.stringify(e.body.filter((b) => typeof b !== 'string'));
    if (!/"count\.|"flag"|"fired"|"never"/.test(conds)) missing.push(e.id);
  }
  assert.deepEqual(missing, [], `these repeat their body unchanged: ${missing.join(', ')}`);
});

check('a choice sets the flag, and the next occurrence carries the line', () => {
  let s = fresh();
  s.desk.lead = { eventId: 'debt.gas' };
  s = applyAction(s, { type: 'CHOOSE', eventId: 'debt.gas', choiceId: 'half' });
  assert.ok(s.desk.lead?.resolved, 'debt.gas/half did not resolve');
  const text = blocks(s, EVENTS['debt.gas'].body).join(' ');
  assert.match(text, /other half of the last bill was never paid/);
  assert.doesNotMatch(text, /ordered to supply without payment/);
});

check('per-person and per-reform history follows the cast', () => {
  const s = fresh();
  s.flags['owe.stalled.ty_bank'] = true;
  const forBank = blocks(s, materialise(s, EVENTS['owe.tycoon'], { WHO: 'ty_bank' }).body).join(' ');
  const forOther = blocks(s, materialise(s, EVENTS['owe.tycoon'], { WHO: 'ty_fuel' }).body).join(' ');
  assert.match(forBank, /put .* off once already/);
  assert.doesNotMatch(forOther, /put .* off once already/);
});

console.log(`${passed} recurrence checks passed.`);
