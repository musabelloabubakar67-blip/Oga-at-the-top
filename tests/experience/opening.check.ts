// Experience check: the opening (plan 02) applies what was chosen, and nothing silently.
// Run: npx tsx tests/experience/opening.check.ts

import assert from 'node:assert/strict';
import { EVENTS } from '../../content';
import { FINANCE_CANDIDATES } from '../../content/names';
import { CONSTRAINTS, FINANCIERS, ROUTES } from '../../content/routes';
import { getGovernanceView } from '../../engine/public';
import { startingEffects, validateSetup } from '../../engine/opening';
import { newGame } from '../../engine/reduce';
import type { Setup } from '../../engine/types';
import { test } from '../../engine/vars';

const base: Setup = { seed: 29, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor', address: 'sir', finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('validation names every problem, and a complete setup passes', () => {
  assert.deepEqual(validateSetup({ ...base, route: 'coalition', financier: 'small' }), []);
  const bad = validateSetup({ ...base, name: ' ', priorities: ['power', 'power'], route: 'continuity', scenario: 'scandal', team: { fin: 'cand.nwachukwu', cos: 'nobody' } });
  assert.ok(bad.some((x) => /name/.test(x)));
  assert.ok(bad.some((x) => /four different/.test(x)));
  assert.ok(bad.some((x) => /route to power is not open/.test(x)));
  assert.ok(bad.some((x) => /negotiated terms/.test(x)));
  assert.ok(bad.some((x) => /Unknown candidate/.test(x)));
});

check('a chosen route, financier, constraint and cabinet are applied as chosen', () => {
  const setup: Setup = { ...base, route: 'coalition', financier: 'small', constraint: 'no_printing', team: { fin: 'cand.anyanwu', min_works: 'cand.tamuno', cos: 'cand.etim', min_agric: 'vacant' } };
  const s = newGame(setup);
  assert.equal(s.flags.route, 'coalition');
  assert.equal(s.flags.financier, 'small');
  assert.ok(!s.favours.some((f) => f.who === 'gov_ss'), 'the legacy Governors\' Forum debt should not apply under a chosen route');
  assert.ok(s.favours.some((f) => f.who === 'sen_pres' && f.dir === 'owing'), 'the coalition debt is owed');
  assert.ok(!s.favours.some((f) => f.dir === 'owing' && f.who.startsWith('ty_')), 'small contributors owe no businessman');
  const g = getGovernanceView(s).commitments;
  for (const text of ['four ministries', 'campaign\'s accounts', 'central bank to finance']) assert.ok(g.some((c) => c.text.includes(text) && c.verify), `missing commitment: ${text}`);
  assert.match(s.chars.fin.name, /Anyanwu/);
  assert.match(String(s.people.min_works.name), /Tamuno/);
  assert.match(s.chars.cos.name, /Etim/);
  assert.ok(s.vacancies?.min_agric, 'the agriculture ministry was left vacant');
  assert.equal(s.desk.actionsUsed, 0, 'the opening costs no moves');
});

check('a legacy setup keeps the old financier and the Governors\' Forum debt', () => {
  const s = newGame(base);
  assert.equal(s.flags.route, undefined);
  assert.ok(s.favours.some((f) => f.who === 'gov_ss'));
  assert.ok(s.favours.some((f) => f.who === String(s.flags.financier)));
});

check('the starting-effects preview is measured, and differs by route', () => {
  const build = (x: Setup) => newGame(x);
  const mob = startingEffects(build, { ...base, route: 'mobilisation', financier: 'small' });
  const est = startingEffects(build, { ...base, route: 'establishment', financier: 'ty_trade' });
  const street = (p: typeof mob) => p.effects.find((e) => e.path === 'bloc.street')?.delta ?? 0;
  assert.ok(street(mob) > 0 && street(est) < street(mob), 'a movement starts with the street; the machine does not');
  assert.ok(est.favours.some((f) => f.who === 'ty_trade'));
  assert.ok(mob.commitments.length >= 2);
});

check('every starting promise has an agreed test that can fail and can pass', () => {
  for (const c of [...ROUTES.flatMap((r) => r.commitments), ...FINANCIERS.flatMap((f) => f.commitments), ...CONSTRAINTS]) {
    assert.ok(c.verify && c.judgedBy, `${'object' in c ? c.object : c.id}: no agreed test`);
  }
  const s = newGame({ ...base, route: 'coalition' });
  const four = getGovernanceView(s).commitments.find((c) => c.text.includes('four ministries'))!;
  assert.ok(!test(s, four.verify));
  s.flags['coalition.ministries'] = 'kept';
  assert.ok(test(s, four.verify));
});

check('the promise files arise only for the route or financier that made the promise', () => {
  const coal = newGame({ ...base, route: 'coalition', financier: 'ty_bank' }); coal.turn = 6;
  const mob = newGame({ ...base, route: 'mobilisation', financier: 'small' }); mob.turn = 6;
  assert.ok(test(coal, EVENTS['start.coalition_ministries'].when) && !test(mob, EVENTS['start.coalition_ministries'].when));
  assert.ok(test(mob, EVENTS['start.cost_of_governance'].when) && !test(coal, EVENTS['start.cost_of_governance'].when));
  assert.ok(test(mob, EVENTS['start.campaign_accounts'].when) && !test(coal, EVENTS['start.campaign_accounts'].when));
});

console.log(`${passed} opening checks passed.`);
