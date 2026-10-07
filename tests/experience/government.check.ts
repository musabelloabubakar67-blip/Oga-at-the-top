// Experience check: a government the President chooses, and talent that persists (plan 03).
// Run: npx tsx tests/experience/government.check.ts
//
// - the running mate is chosen on the ticket;
// - a deputy grows under a capable minister and can be promoted, becoming a possible successor;
// - a strong person who is let go is recruited by the opposition;
// - two governments with different teams deliver at different speeds.

import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../../content/names';
import { appointDeputy, deputies, deputyOptions, deputyTick, promote } from '../../engine/deputies';
import { ministerSpeed, personView } from '../../engine/people';
import { newGame } from '../../engine/reduce';
import { candidateIds } from '../../engine/successor';
import { release, take, talent } from '../../engine/talent';
import type { GameState } from '../../engine/types';

const setup = { seed: 83, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (team: Record<string, string> = {}): GameState => { const s = newGame({ ...setup, team }); s.phase = 'desk'; s.pc = 80; return s; };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('the running mate is chosen on the ticket', () => {
  const s = fresh({ vp: 'cand.bakori' });
  assert.match(s.vp!.name, /Bakori/);
  assert.ok(s.archive.some((a) => /running mate/.test(a.headline)));
});

check('a deputy grows under a capable minister and can be promoted into a possible successor', () => {
  const s = fresh();
  s.people.min_works.competence = 5;
  const o = deputyOptions(s, 'min_works')[0];
  assert.ok(o, 'there is someone to deputise');
  appointDeputy(s, 'min_works', o.c.id);
  const before = talent(s).pool.find((c) => c.id === o.c.id)!.competence;
  for (let i = 0; i < 12; i++) { s.turn += 1; deputyTick(s); }
  const after = talent(s).pool.find((c) => c.id === o.c.id)!.competence;
  assert.ok(after > before || before === 5, 'a year under a capable minister');
  promote(s, 'min_works');
  assert.equal(personView(s, 'min_works').name, o.c.name, 'the deputy holds the post');
  assert.ok(!deputies(s).min_works);
  assert.ok(candidateIds(s).includes('min_works'), 'and is now a possible successor');
});

check('a strong person let go is recruited by the opposition', () => {
  const s = fresh();
  const t = talent(s);
  const c = t.pool.find((x) => x.competence >= 4 && x.clout >= 3)!;
  assert.ok(c, 'there is someone strong in the pool');
  take(s, c.id);
  const before = Math.max(...Object.values(s.opposition));
  release(s, c.name);
  assert.ok(Math.max(...Object.values(s.opposition)) > before, 'the opposition is stronger');
  assert.ok(t.taken.includes(c.id), 'and they are no longer available');
});

check('two governments with different teams deliver at different speeds', () => {
  const able = fresh(), weak = fresh();
  able.people.min_power.competence = 5;
  weak.people.min_power.competence = 1;
  assert.ok(ministerSpeed(able, 'power') > ministerSpeed(weak, 'power') * 1.2);
});

console.log(`${passed} government checks passed.`);
