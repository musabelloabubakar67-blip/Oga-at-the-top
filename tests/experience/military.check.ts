// Experience check: the military cast and mission drafts are coherent (plan 13, input for R9).
// Run: npx tsx tests/experience/military.check.ts
//
// - every post is held by exactly one officer, and every theatre has a commander;
// - ids and names are unique and collide with no existing character, name or surname;
// - ties name real people or businessmen; disputes and mission sides name real officers;
// - traits are in range and every command states its needs;
// - every theatre has at least one mission draft with limits, evidence and what must follow;
// - no officer text uses a gendered pronoun.

import assert from 'node:assert/strict';
import { CANDIDATES } from '../../content/candidates';
import { OFFICERS, OFFICER_BY_ID, MISSIONS, type Post } from '../../content/military';
import { ADVISER_POOL, CAST, FINANCE_CANDIDATES, NAMES } from '../../content/names';
import { PEOPLE, PERSON_BY_ID, RIVALS } from '../../content/people';
import { THEATRES } from '../../content/theatres';
import { TYCOONS, TYCOON_BY_ID } from '../../content/tycoons';

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('every post is held once, every theatre has a commander', () => {
  const posts: Post[] = ['cds', 'army', 'navy', 'air', 'intelligence', 'logistics', 'procurement', ...THEATRES.map((t) => `theatre.${t.zone}` as Post)];
  for (const p of posts) assert.equal(OFFICERS.filter((o) => o.post === p).length, 1, `post ${p} should have exactly one officer`);
  assert.equal(OFFICERS.length, posts.length, 'an officer holds a post that is not on the list');
});

check('ids and names are unique and new', () => {
  assert.equal(new Set(OFFICERS.map((o) => o.id)).size, OFFICERS.length);
  assert.equal(new Set(OFFICERS.map((o) => o.name)).size, OFFICERS.length);
  const existing = [
    ...Object.values(NAMES), ...CAST.map((c) => c.name), ...PEOPLE.map((p) => p.name), ...RIVALS.map((r) => r.name),
    ...TYCOONS.map((t) => t.name), ...FINANCE_CANDIDATES.map((c) => c.name), ...ADVISER_POOL.map((c) => c.name), ...CANDIDATES.map((c) => c.name),
  ];
  const surnames = new Set(existing.map((n) => n.replace(/\([^)]*\)/g, '').trim().split(/\s+/).pop()));
  for (const o of OFFICERS) {
    assert.ok(!existing.includes(o.name), `${o.name} is already a character`);
    assert.ok(!surnames.has(o.short), `${o.short} is an existing character's surname`);
  }
});

check('ties, disputes and mission sides refer to real people', () => {
  for (const o of OFFICERS) {
    assert.ok(['none', 'president'].includes(o.tie) || PERSON_BY_ID[o.tie] || TYCOON_BY_ID[o.tie], `${o.id}: unknown tie ${o.tie}`);
    assert.ok(o.tieText.length > 0, `${o.id}: tie not explained`);
    for (const d of o.disputes ?? []) assert.ok(OFFICER_BY_ID[d.with] && d.with !== o.id, `${o.id}: dispute with unknown ${d.with}`);
  }
  for (const m of MISSIONS) for (const id of [...m.for, ...m.against]) assert.ok(OFFICER_BY_ID[id], `${m.id}: unknown officer ${id}`);
});

check('traits are in range and every command states its needs', () => {
  for (const o of OFFICERS) {
    for (const k of ['competence', 'integrity', 'restraint', 'clout'] as const) assert.ok(o.traits[k] >= 1 && o.traits[k] <= 5, `${o.id}: ${k} out of range`);
    assert.ok(o.traits.ambition >= 0 && o.traits.ambition <= 3, `${o.id}: ambition out of range`);
    assert.ok(o.needs.dollarShare >= 0 && o.needs.dollarShare <= 1 && o.needs.text, `${o.id}: needs incomplete`);
    assert.ok(o.position && o.career.length > 0, `${o.id}: missing position or career`);
  }
  assert.ok(new Set(OFFICERS.map((o) => o.doctrine)).size >= 5, 'the professional views should differ');
});

check('every theatre has a mission draft with limits, evidence and what must follow', () => {
  for (const t of THEATRES) assert.ok(MISSIONS.some((m) => m.theatre === t.zone), `no mission for ${t.zone}`);
  for (const m of MISSIONS) assert.ok(m.limits.length > 0 && m.evidence && m.lasting && m.for.length > 0, `${m.id}: incomplete`);
});

check('no gendered pronouns in officer or mission text', () => {
  const text = JSON.stringify([OFFICERS, MISSIONS]);
  const m = text.match(/\b(he|she|her|his|him|himself|herself)\b/i);
  assert.ok(!m, `gendered pronoun found: ${m?.[0]}`);
});

console.log(`${passed} military checks passed (${OFFICERS.length} officers, ${MISSIONS.length} mission drafts).`);
