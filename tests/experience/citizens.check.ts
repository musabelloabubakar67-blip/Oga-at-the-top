// Experience check: the citizen cast reads real game values and does not speak with one voice (plan 14).
// Run: npx tsx tests/experience/citizens.check.ts
//
// - ids and names are unique and collide with no character; states exist and match the zone;
// - every path a citizen depends on or is conditioned on is a real game value;
// - the five representative groups of plan 14.A3 are present;
// - at the opening, the citizens do not all say the same kind of thing;
// - a good national month (low inflation, steady power, jobs, a stable naira) still leaves
//   someone worse off, for a visible reason (acceptance 14.T9);
// - no gendered pronouns.

import assert from 'node:assert/strict';
import { CANDIDATES } from '../../content/candidates';
import { CITIZENS } from '../../content/citizens';
import { OFFICERS } from '../../content/military';
import { ADVISER_POOL, CAST, FINANCE_CANDIDATES, NAMES } from '../../content/names';
import { PEOPLE, RIVALS } from '../../content/people';
import { STATE_BY_ID } from '../../content/states';
import { TYCOONS } from '../../content/tycoons';
import { VENTURE_BY_ID } from '../../content/ventures';
import { newGame } from '../../engine/reduce';
import type { Cond, GameState } from '../../engine/types';
import { test } from '../../engine/vars';

const setup = { seed: 5, name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => newGame(setup);
const say = (s: GameState) => CITIZENS.map((c) => c.lines.find((l) => test(s, l.when))?.text ?? c.otherwise);

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('ids and names are unique and new; states are real', () => {
  assert.equal(new Set(CITIZENS.map((c) => c.id)).size, CITIZENS.length);
  const existing = [
    ...Object.values(NAMES), ...CAST.map((c) => c.name), ...PEOPLE.map((p) => p.name), ...RIVALS.map((r) => r.name), ...TYCOONS.map((t) => t.name),
    ...FINANCE_CANDIDATES.map((c) => c.name), ...ADVISER_POOL.map((c) => c.name), ...CANDIDATES.map((c) => c.name), ...OFFICERS.map((o) => o.name),
  ];
  const surnames = new Set(existing.map((n) => n.replace(/\([^)]*\)/g, '').trim().split(/\s+/).pop()));
  for (const c of CITIZENS) {
    assert.ok(!existing.includes(c.name), `${c.name} is already a character`);
    assert.ok(!surnames.has(c.short), `${c.short} is an existing character's surname`);
    assert.ok(STATE_BY_ID[c.state], `${c.id}: unknown state ${c.state}`);
    assert.equal(STATE_BY_ID[c.state].zone, c.zone, `${c.id}: zone does not match the state`);
  }
});

check('every value a citizen reads is a real game value', () => {
  const KNOWN = /^(nation\.(inflation|petrolPrice|power|jobs|capacity|integrity|security)|pressure\.(wageGrievance|fuelSupplyStress)|fx\.(premium|reserves)|theatre\.(NW|NE|NC|SW|SE|SS)|zone\.(NW|NE|NC|SW|SE|SS)\.approval|debt\.pensions|budget\.(people|agric|power|security))$/;
  const paths = (c: Cond | undefined): string[] => !c ? [] : 'v' in c ? [c.v[0]] : 'all' in c ? c.all.flatMap(paths) : 'any' in c ? c.any.flatMap(paths) : 'not' in c ? paths(c.not) : [];
  for (const c of CITIZENS) {
    const used = [...c.dependsOn.map((d) => d.path), ...c.lines.flatMap((l) => paths(l.when)), ...c.responses.flatMap((r) => paths(r.when))];
    for (const p of used) {
      // A big bet that worked: the bet must exist.
      if (p.startsWith('venture.')) { assert.ok(VENTURE_BY_ID[p.slice('venture.'.length)], `${c.id}: no big bet ${p}`); continue; }
      assert.match(p, KNOWN, `${c.id}: ${p} is not a value the game keeps`);
    }
    assert.ok(c.lines.length >= 3, `${c.id}: needs at least three situations`);
  }
});

check('the representative groups are present', () => {
  for (const g of ['salaried', 'trader', 'farmer', 'manufacturer', 'importer'] as const) assert.ok(CITIZENS.some((c) => c.group === g), `no ${g}`);
  assert.ok(new Set(CITIZENS.map((c) => c.zone)).size === 6, 'every zone should have someone');
});

check('at the opening they do not speak with one voice', () => {
  const lines = say(fresh());
  assert.ok(new Set(lines).size === lines.length);
  const defaults = CITIZENS.filter((c, i) => lines[i] === c.otherwise).length;
  assert.ok(defaults < CITIZENS.length / 2, 'most citizens should be reacting to something at the opening');
});

check('a good national month still leaves someone worse off, with the reason visible', () => {
  const s = fresh();
  s.nation.inflation = 12; s.nation.power = 60; s.nation.jobs = 50; s.nation.petrolPrice = 900;
  if (s.fx) { s.fx.parallel = s.fx.rate * 1.04; s.fx.reserves = 40; }
  const good = say(s);
  // The national picture is good; the farm belt is not, and the farmer says so.
  const farmer = CITIZENS.findIndex((c) => c.id === 'cit.igbaukum');
  assert.match(good[farmer], /grass this year/);
  const maker = CITIZENS.findIndex((c) => c.id === 'cit.nwaobilor');
  assert.match(good[maker], /grid held/);
});

check('no gendered pronouns in citizen text', () => {
  const m = JSON.stringify(CITIZENS).match(/\b(he|she|her|his|him|himself|herself)\b/i);
  assert.ok(!m, `gendered pronoun found: ${m?.[0]}`);
});

console.log(`${passed} citizen checks passed (${CITIZENS.length} citizens).`);
