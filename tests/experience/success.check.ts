// Experience check: a big bet that works changes specific things (plans 12.A9, 12.T10, 14.T10).
// Run: npx tsx tests/experience/success.check.ts
//
// - every "what success brings" file can only arise after its bet has worked;
// - each of its choices resolves through the real reducer;
// - the bet-specific options in existing files are locked before the bet and open after it;
// - the citizens who benefit say so once the bet has worked, and not before.

import assert from 'node:assert/strict';
import { EVENTS } from '../../content';
import { CITIZEN_BY_ID } from '../../content/citizens';
import { SUCCESS_FILES } from '../../content/events/success';
import { FINANCE_CANDIDATES } from '../../content/names';
import { VENTURE_BY_ID } from '../../content/ventures';
import { applyAction, newGame } from '../../engine/reduce';
import type { GameState } from '../../engine/types';
import { test } from '../../engine/vars';

const setup = { seed: 9, name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (won: string[] = []): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 100; s.nation.fiscalSpace = 5; s.ventures.won.push(...won); return s; };
const bets = (e: { when?: unknown }) => [...JSON.stringify(e.when ?? {}).matchAll(/venture\.([a-z_]+)/g)].map((m) => m[1]);

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('each success file names a real bet and arises only after it has worked', () => {
  for (const e of SUCCESS_FILES) {
    const ids = bets(e);
    assert.ok(ids.length > 0, `${e.id}: not tied to a bet`);
    for (const id of ids) assert.ok(VENTURE_BY_ID[id], `${e.id}: unknown bet ${id}`);
    assert.ok(!test(fresh(), e.when), `${e.id}: can arise before the bet has worked`);
    assert.ok(test(fresh(ids), e.when), `${e.id}: does not arise after the bet has worked`);
  }
});

check('every choice in every success file resolves', () => {
  for (const e of SUCCESS_FILES) {
    for (const c of e.choices) {
      const s = fresh(bets(e));
      s.desk.lead = { eventId: e.id };
      const next = applyAction(s, { type: 'CHOOSE', eventId: e.id, choiceId: c.id });
      assert.ok(next.desk.lead?.resolved, `${e.id}/${c.id} did not resolve`);
    }
  }
});

check('bet-specific options in existing files open only after the bet', () => {
  const cases: [string, string, string][] = [['tycoon.depots', 'refinery', 'refinery'], ['tycoon.hoard', 'mills', 'rice'], ['debt.pensions', 'loot', 'loot'], ['minor.cbn', 'gold', 'gold']];
  for (const [eventId, choiceId, bet] of cases) {
    const choice = EVENTS[eventId].choices.find((c) => c.id === choiceId);
    assert.ok(choice?.requires, `${eventId}/${choiceId} missing`);
    assert.ok(!test(fresh(), choice.requires), `${eventId}/${choiceId} open before ${bet}`);
    assert.ok(test(fresh([bet]), choice.requires), `${eventId}/${choiceId} closed after ${bet}`);
  }
});

check('the people who benefit say so, after and only after', () => {
  const cases: [string, string, RegExp][] = [['cit.gwammaja', 'cng', /converted the keke to gas/], ['cit.igbaukum', 'rice', /mill buys paddy/], ['cit.tsado', 'hospital', /hospital city/], ['cit.ezeokoli', 'loot', /flats in London/]];
  for (const [id, bet, line] of cases) {
    const say = (s: GameState) => { const c = CITIZEN_BY_ID[id]; return c.lines.find((l) => test(s, l.when))?.text ?? c.otherwise; };
    assert.doesNotMatch(say(fresh()), line, `${id} speaks of ${bet} before it worked`);
    assert.match(say(fresh([bet])), line, `${id} is silent about ${bet} after it worked`);
  }
});

console.log(`${passed} success checks passed (${SUCCESS_FILES.length} files).`);
