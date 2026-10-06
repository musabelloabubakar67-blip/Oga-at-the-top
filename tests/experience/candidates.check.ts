// Experience check: the named candidate pool is coherent and refers only to real things.
// Run: npx tsx tests/experience/candidates.check.ts
//
// - ids and names are unique, and no name collides with an existing character;
// - every role exists and at least one fits the candidate's field;
// - traits are in range, patrons are real, zones are real;
// - every exceptional candidate has a capability and a condition with a stated breach;
// - every file, reform or bet a capability or condition names exists;
// - no candidate text uses a gendered pronoun (the rule for slots any person can fill).

import assert from 'node:assert/strict';
import { EVENTS } from '../../content';
import { MILESTONE_BY_ID } from '../../content/agenda';
import { CANDIDATES } from '../../content/candidates';
import { ADVISER_POOL, FINANCE_CANDIDATES, NAMES } from '../../content/names';
import { PEOPLE, PERSON_BY_ID } from '../../content/people';
import { ROLE_SPECS } from '../../content/talent';
import { TYCOONS, TYCOON_BY_ID } from '../../content/tycoons';
import { VENTURE_BY_ID } from '../../content/ventures';

const ZONES = ['NW', 'NE', 'NC', 'SW', 'SE', 'SS'];
let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('ids and names are unique and new', () => {
  assert.equal(new Set(CANDIDATES.map((c) => c.id)).size, CANDIDATES.length);
  assert.equal(new Set(CANDIDATES.map((c) => c.name)).size, CANDIDATES.length);
  const existing = new Set([
    ...Object.values(NAMES), ...PEOPLE.map((p) => p.name), ...TYCOONS.map((t) => t.name),
    ...FINANCE_CANDIDATES.map((c) => c.name), ...ADVISER_POOL.map((c) => c.name),
  ]);
  for (const c of CANDIDATES) assert.ok(!existing.has(c.name), `${c.name} is already a character`);
  // The surname alone must not be an existing character's either, to avoid apparent relatives.
  const surnames = new Set([...existing].map((n) => n.split(' ').pop()));
  for (const c of CANDIDATES) assert.ok(!surnames.has(c.short), `${c.short} is an existing character's surname`);
});

check('roles exist and fit; traits, patrons and zones are real', () => {
  for (const c of CANDIDATES) {
    assert.ok(c.roles.length > 0, `${c.id}: no roles`);
    for (const r of c.roles) assert.ok(ROLE_SPECS[r], `${c.id}: unknown role ${r}`);
    assert.ok(c.roles.some((r) => ROLE_SPECS[r].includes(c.spec)), `${c.id}: no role fits ${c.spec}`);
    assert.ok(ZONES.includes(c.zone), `${c.id}: bad zone`);
    const t = c.traits;
    for (const k of ['competence', 'loyalty', 'integrity', 'clout'] as const) assert.ok(t[k] >= 1 && t[k] <= 5, `${c.id}: ${k} out of range`);
    assert.ok(t.ambition >= 0 && t.ambition <= 3, `${c.id}: ambition out of range`);
    assert.ok(['president', 'self'].includes(c.patron) || PERSON_BY_ID[c.patron] || TYCOON_BY_ID[c.patron], `${c.id}: unknown patron ${c.patron}`);
    if (c.patron !== 'president') assert.ok(c.reputation, `${c.id}: a backed candidate should have a file that may flatter`);
    assert.ok(c.career.length > 0 && c.expertise && c.view, `${c.id}: missing career, expertise or view`);
  }
});

check('exceptional candidates carry capabilities and conditions with stated breaches', () => {
  const ex = CANDIDATES.filter((c) => c.exceptional);
  assert.ok(ex.length >= 3, 'the plan asks for exceptional candidates');
  for (const c of ex) {
    assert.ok(c.exceptional!.capabilities.length > 0, `${c.id}: no capability`);
    assert.ok(c.exceptional!.conditions.length > 0, `${c.id}: no condition`);
    for (const k of c.exceptional!.conditions) assert.ok(k.text && k.test && k.breach, `${c.id}/${k.id}: incomplete`);
  }
  assert.ok(CANDIDATES.some((c) => c.plainExcellence && !c.exceptional), 'excellence without a catch should exist');
});

check('every file, reform or bet named in a capability or condition exists', () => {
  const real = (x: string) => !!(EVENTS[x] || MILESTONE_BY_ID[x] || VENTURE_BY_ID[x]) || x === 'cases' || x.startsWith('debt.');
  for (const c of CANDIDATES.filter((x) => x.exceptional)) {
    for (const cap of c.exceptional!.capabilities) for (const x of cap.touches) assert.ok(real(x), `${c.id}: touches unknown ${x}`);
    for (const k of c.exceptional!.conditions) {
      for (const m of k.test.matchAll(/\b([a-z]+\.[a-z_]+(?:\.[a-z_]+)?)\b/g)) {
        const id = m[1];
        if (id.startsWith('budget.')) continue;
        assert.ok(EVENTS[id], `${c.id}/${k.id}: test names unknown file ${id}`);
      }
    }
  }
});

check('no gendered pronouns in candidate text', () => {
  const text = JSON.stringify(CANDIDATES);
  const m = text.match(/\b(he|she|her|his|him|himself|herself)\b/i);
  assert.ok(!m, `gendered pronoun found: ${m?.[0]}`);
});

console.log(`${passed} candidate checks passed (${CANDIDATES.length} candidates).`);
