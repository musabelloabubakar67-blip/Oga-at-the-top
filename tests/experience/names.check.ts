// Experience check: the generated name banks cannot produce a known person or a named character.
// Run: npx tsx tests/experience/names.check.ts
//
// - every pair in BLOCKED_NAMES can actually be formed from one zone's banks (the list stays current);
// - every named character whose first name and surname the banks could combine is blocked;
// - the surnames removed for belonging to one politician stay out.

import assert from 'node:assert/strict';
import { CANDIDATES } from '../../content/candidates';
import { BENCH, NOMINEES } from '../../content/courts';
import { ADVISER_POOL, CAST, FINANCE_CANDIDATES, NAMES } from '../../content/names';
import { PEOPLE, RIVALS } from '../../content/people';
import { BLOCKED_NAMES, NAMES_BY_ZONE } from '../../content/talent';
import { TYCOONS } from '../../content/tycoons';

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

const formable = new Set<string>();
for (const bank of Object.values(NAMES_BY_ZONE)) {
  for (const first of [...bank.m, ...bank.f]) for (const last of bank.last) formable.add(`${first} ${last}`);
}

check('every blocked name can be formed by the banks', () => {
  for (const n of BLOCKED_NAMES) assert.ok(formable.has(n), `${n} cannot be generated; remove it or fix the spelling`);
});

check('no named character can be generated', () => {
  const names = [
    ...Object.values(NAMES), ...CAST.map((c) => c.name), ...PEOPLE.map((p) => p.name), ...RIVALS.map((r) => r.name),
    ...TYCOONS.map((t) => t.name), ...FINANCE_CANDIDATES.map((c) => c.name), ...ADVISER_POOL.map((c) => c.name),
    ...CANDIDATES.map((c) => c.name), ...NOMINEES.map((n) => n.name), ...BENCH.map((b) => b.name),
  ].filter((n): n is string => typeof n === 'string');
  const open: string[] = [];
  for (const full of names) {
    const words = full.replace(/\([^)]*\)/g, '').trim().split(/\s+/);
    // Any adjacent pair, so titles ("Maj. Gen.", "Chief (Mrs)") and middle names do not hide a match.
    for (let i = 0; i + 1 < words.length; i++) {
      const pair = `${words[i]} ${words[i + 1]}`;
      if (formable.has(pair) && !BLOCKED_NAMES.has(pair)) open.push(`${pair} (${full})`);
    }
  }
  assert.deepEqual(open, [], `these can be generated; add them to BLOCKED_NAMES: ${open.join(', ')}`);
});

check('surnames that identify one politician stay out of the banks', () => {
  for (const bank of Object.values(NAMES_BY_ZONE)) for (const s of ['Dandago', 'Yandoma']) assert.ok(!bank.last.includes(s), `${s} is back in the banks`);
});

console.log(`${passed} name checks passed (${formable.size} combinations, ${BLOCKED_NAMES.size} blocked).`);
