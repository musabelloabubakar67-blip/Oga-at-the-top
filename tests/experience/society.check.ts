// Experience check: citizens, groups and development that changes politics (plan 14).
// Run: npx tsx tests/experience/society.check.ts
//
// - the country can improve while a group loses, and the reason is visible;
// - citizens act on their circumstances, at most once a year per act, with effects;
// - services are measured on several dimensions, and rival approaches succeed and fail differently;
// - connected assets run better;
// - success creates constituencies that the next government inherits as new questions;
// - several kinds of country are legitimate outcomes.

import assert from 'node:assert/strict';
import { EVENTS } from '../../content';
import { FINANCE_CANDIDATES } from '../../content/names';
import { assetPerformance, settleSite } from '../../engine/places';
import { newGame } from '../../engine/reduce';
import { ensureSociety, fortune, leftBehind, profiles, services, societyTick } from '../../engine/society';
import type { GameState } from '../../engine/types';
import { test } from '../../engine/vars';

const setup = { seed: 53, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; return s; };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('the country improves while transport workers lose, and the reason is shown', () => {
  const s = fresh();
  for (let i = 0; i < 8; i++) {
    s.turn += 1;
    s.nation.jobs += 1.5; s.nation.power += 1.5;
    s.nation.petrolPrice += 60;
    societyTick(s);
  }
  const behind = leftBehind(s);
  const t = behind.find((b) => b.group === 'transport');
  assert.ok(t, `transport workers are left behind: ${JSON.stringify(behind)}`);
  assert.match(t!.why, /pump price/i);
  assert.ok(fortune(s, 'manufacturer').v > fortune(fresh(), 'manufacturer').v, 'while manufacturers gain');
});

check('citizens act on their circumstances, once a year per act, with effects', () => {
  const s = fresh();
  s.pressures.wageGrievance = 70;
  const before = s.pressures.wageGrievance;
  societyTick(s);
  const soc = ensureSociety(s);
  assert.ok(soc.acts.some((a) => a.who === 'cit.bature' && a.act === 'organise'), 'the teacher organises');
  assert.ok((soc.organised.salaried ?? 0) >= 1 && s.pressures.wageGrievance > before, 'the group is organised and the pressure rises');
  const n = soc.acts.length;
  s.turn += 1; societyTick(s);
  assert.equal(soc.acts.filter((a) => a.who === 'cit.bature' && a.act === 'organise').length, 1, 'not again within the year');
  assert.ok(soc.acts.length >= n);
});

check('services are measured several ways; rival approaches succeed and fail differently', () => {
  const loans = fresh(), free = fresh();
  loans.agenda.done.push('k11'); free.agenda.done.push('k12');
  const a = services(loans), b = services(free);
  assert.ok(a['edu.quality'].v > b['edu.quality'].v, 'fees and loans buy quality');
  assert.ok(b.afford.v > a.afford.v && b['edu.access'].v > a['edu.access'].v, 'free universities buy access and affordability');
  // Unfunded, the free approach fails in its own recognisable way.
  const broke = fresh(); broke.agenda.done.push('k12'); broke.budget.alloc.people = 1; broke.nation.fiscalSpace = 0.05;
  assert.ok(services(broke)['edu.quality'].v < b['edu.quality'].v);
  assert.ok(services(broke)['edu.quality'].lines.some((l) => /Free universities without the money|underfunded/i.test(l.label)));
});

check('connected assets run better', () => {
  const s = fresh();
  (s.sites ??= {}).hub = 'LA'; settleSite(s, 'hub', true);
  const alone = assetPerformance(s, 'hub').k;
  s.sites.rail = 'LA'; settleSite(s, 'rail', true);
  assert.ok(assetPerformance(s, 'hub').k > alone * 1.1, 'a port with a railway out of it');
});

check('success creates constituencies the next government inherits as new questions', () => {
  const s = fresh();
  s.nation.capacity = 60;
  societyTick(s);
  assert.ok(ensureSociety(s).constituencies.agencies !== undefined, 'a capable service becomes a constituency');
  s.turn = 49; s.ending = 'defeated';
  const next = newGame({ ...setup, name: 'Successor' }, s);
  next.phase = 'desk'; next.turn = 8;
  assert.ok(ensureSociety(next).constituencies.agencies !== undefined, 'it outlives the government that created it');
  assert.ok(test(next, EVENTS['con.agencies'].when), 'and asks the successor a question the predecessor created');
});

check('several kinds of country are legitimate outcomes', () => {
  const s = fresh();
  s.agenda.done.push('t5', 's4', 'p4'); s.flags['constitution.clause'] = 'devolve';
  assert.equal(profiles(s)[0].id, 'decentralised');
  const t = fresh();
  t.nation.integrity = 70; t.agenda.done.push('c8'); t.flags['diaspora.vote'] = true;
  assert.equal(profiles(t)[0].id, 'open');
});

console.log(`${passed} society checks passed.`);
