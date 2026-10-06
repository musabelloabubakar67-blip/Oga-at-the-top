// Experience check: the written-target review (contract S1) answers the engine's verdict for the exact record.
// Run: npx tsx tests/experience/targets.check.ts
//
// - setting a target queues min.target.review bound to the minister and the target record;
// - for each verdict, the file shows that verdict's line and only the choices that make sense;
// - another target's verdict does not leak into this one;
// - one choice is always available, and no choice awards delivery for being reviewed.

import assert from 'node:assert/strict';
import { EVENTS } from '../../content';
import { FINANCE_CANDIDATES } from '../../content/names';
import { materialise } from '../../engine/cast';
import { setMinisterTarget } from '../../engine/public';
import { newGame } from '../../engine/reduce';
import { blocks } from '../../engine/text';
import type { GameState } from '../../engine/types';
import { test } from '../../engine/vars';

const setup = { seed: 13, name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

function withTarget(): { s: GameState; id: string } {
  const s = newGame(setup); s.phase = 'desk';
  const id = setMinisterTarget(s, 'min_works', 6);
  return { s, id };
}
const read = (s: GameState, id: string) => {
  const e = materialise(s, EVENTS['min.target.review'], { WHO: 'min_works', TARGET: id });
  const open = e.choices.filter((c) => test(s, c.requires)).map((c) => c.id).sort();
  return { text: blocks(s, e.body).join(' '), open, e };
};

check('setting a target queues the review for that minister and that record', () => {
  const { s, id } = withTarget();
  const q = s.queue.find((x) => x.event === 'min.target.review');
  assert.ok(q, 'review not queued');
  assert.equal(q.cast?.WHO, 'min_works');
  assert.equal(q.cast?.TARGET, id);
});

check('each verdict shows its own line and the choices that fit it', () => {
  const cases: [string, RegExp, string[]][] = [
    ['met', /target was met/, ['credit', 'file']],
    ['missed', /received what it was allocated/, ['file', 'keep', 'sack']],
    ['withheld', /held back money/, ['again', 'file', 'keep', 'sack']],
    ['disputed', /no longer in the post/, ['file']],
  ];
  for (const [verdict, line, choices] of cases) {
    const { s, id } = withTarget();
    s.flags[`review.${id}.${verdict}`] = true;
    const r = read(s, id);
    assert.match(r.text, line, `${verdict}: wrong line`);
    assert.deepEqual(r.open, choices, `${verdict}: wrong choices`);
  }
});

check('another target\'s verdict does not leak into this review', () => {
  const { s, id } = withTarget();
  s.flags['review.target.other.min_power.3.met'] = true;
  const r = read(s, id);
  assert.doesNotMatch(r.text, /target was met/);
  assert.deepEqual(r.open, ['file']);
});

check('no choice awards delivery for being reviewed', () => {
  for (const c of EVENTS['min.target.review'].choices) for (const o of c.outcomes) {
    assert.ok(!(o.ops ?? []).some((op) => op[0] === 'mark'), `${c.id} awards a delivery mark`);
  }
});

console.log(`${passed} target review checks passed.`);
