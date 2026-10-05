// Experience check: routes to power and financiers say only what can happen.
// Run: npx tsx tests/experience/routes.check.ts
//
// - each route and financier states both strengths and costs;
// - every proposed starting effect changes something visible on a real new game
//   (so no effect silently does nothing);
// - every favour owed is to a real person or businessman;
// - every commitment's responsible office resolves to a person in a new game;
// - each businessman is offered exactly once, and small contributors owe nothing;
// - a route restricted to some scenarios names scenarios that exist.

import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../../content/names';
import { PERSON_BY_ID } from '../../content/people';
import { FINANCIERS, ROUTES } from '../../content/routes';
import { SCENARIOS } from '../../content/scenarios';
import { TYCOONS, TYCOON_BY_ID } from '../../content/tycoons';
import { diff, snapshot } from '../../engine/effects';
import { resolveActor } from '../../engine/public';
import { newGame } from '../../engine/reduce';
import { applyFx } from '../../engine/vars';
import type { Fx } from '../../engine/types';

const setup = { seed: 3, name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

const visible = (where: string, fx: Fx[]) => {
  for (const f of fx) {
    const s = newGame(setup);
    const before = snapshot(s);
    const raw = JSON.stringify(s);
    applyFx(s, f);
    assert.ok(diff(before, snapshot(s)).length > 0 || JSON.stringify(s) !== raw, `${where}: effect ${JSON.stringify(f)} changes nothing`);
  }
};
const owesReal = (where: string, owes: { who: string }[]) => {
  for (const o of owes) assert.ok(PERSON_BY_ID[o.who] || TYCOON_BY_ID[o.who], `${where}: owes unknown ${o.who}`);
};
const responsibleResolves = (where: string, cs: { responsible: string }[]) => {
  const s = newGame(setup);
  for (const c of cs) assert.doesNotThrow(() => resolveActor(s, { office: c.responsible }), `${where}: office ${c.responsible} does not resolve`);
};

check('every route states strengths and costs, and its effects, debts and commitments are real', () => {
  assert.equal(new Set(ROUTES.map((r) => r.id)).size, ROUTES.length);
  for (const r of ROUTES) {
    assert.ok(r.strengths.trim() && r.costs.trim() && r.howWon.trim(), `${r.id}: missing text`);
    visible(r.id, r.fx);
    owesReal(r.id, r.owes);
    responsibleResolves(r.id, r.commitments);
    for (const c of r.commitments) assert.ok(c.afterMonths >= 1 && Number.isInteger(c.afterMonths), `${r.id}: bad duration`);
    if (r.onlyWhen?.scenarios) for (const id of r.onlyWhen.scenarios) assert.ok(SCENARIOS.some((x) => x.id === id), `${r.id}: unknown scenario ${id}`);
    if (r.onlyWhen) assert.ok(r.closedText, `${r.id}: restricted without saying why`);
  }
});

check('every financier states strengths and costs; each businessman appears once; small contributors owe nothing', () => {
  for (const t of TYCOONS) assert.equal(FINANCIERS.filter((f) => f.id === t.id).length, 1, `${t.id} offered ${FINANCIERS.filter((f) => f.id === t.id).length} times`);
  for (const f of FINANCIERS) {
    assert.ok(f.strengths.trim() && f.costs.trim() && f.terms.trim(), `${f.id}: missing text`);
    visible(f.id, f.fx);
    owesReal(f.id, f.owes);
    responsibleResolves(f.id, f.commitments);
    if (f.id !== 'small') assert.ok(f.terms.includes(TYCOON_BY_ID[f.id].want.text.slice(1, 20)), `${f.id}: terms do not quote the standing demand`);
  }
  const small = FINANCIERS.find((f) => f.id === 'small')!;
  assert.equal(small.owes.length, 0);
  assert.ok(small.commitments.length > 0, 'small contributors should carry a stated cost');
});

console.log(`${passed} route checks passed.`);
