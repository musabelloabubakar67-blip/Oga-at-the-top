// Experience check: the connected acceptance histories (docs/ACTION-PLAN.md, plan 18).
// Run: npx tsx tests/experience/histories.check.ts
//
// History 1 is played here end to end across three governments. The other ten are covered by
// the checks named in docs/playtest/experience/HISTORIES.md; this file asserts that each of those
// checks still exists, so a history cannot silently lose its evidence.

import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { FINANCE_CANDIDATES } from '../../content/names';
import { charge, openCases } from '../../engine/cases';
import { tycoonDeal } from '../../engine/favours';
import { settleSite } from '../../engine/places';
import { newGame } from '../../engine/reduce';
import { ensureSociety, societyTick } from '../../engine/society';
import type { GameState, Setup } from '../../engine/types';
import { getVar } from '../../engine/vars';

const base: Setup = { seed: 71, scenario: 'standard', name: 'First', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor', address: 'sir', finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'industry', 'food', 'works'] };
const end = (s: GameState) => { s.turn = 49; s.ending = 'defeated'; return s; };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('history 1: an industrial transformation is carried, contested and inherited across three governments', () => {
  // The first government: power, a privileged deal with an industrialist, and factories.
  const a = newGame(base); a.phase = 'desk';
  a.agenda.done.push('p2'); a.nation.power = 58;
  tycoonDeal(a, 'ty_maker', 'grant');
  assert.ok(a.tycoons.ty_maker.granted && a.favours.some((f) => f.who === 'ty_maker' && f.dir === 'owed'), 'the deal makes a patron who owes the President');
  a.sites = { ...(a.sites ?? {}), steel: 'KG', car: 'AN' };
  settleSite(a, 'steel', true); settleSite(a, 'car', true);
  assert.ok(getVar(a, 'assets.industry') >= 2, 'factories stand');
  assert.ok(a.archive.length > 0);

  // The second government inherits the plants and the deal, opens procurement and investigates the patron.
  const b = newGame({ ...base, name: 'Second' }, end(a)); b.phase = 'desk';
  assert.ok(getVar(b, 'assets.industry') >= 2, 'the factories are inherited, with their location');
  assert.ok(b.tycoons.ty_maker.inherited, 'the deal stands, but the gratitude went with the first government');
  b.agenda.done.push('c1');
  charge(b, 'ty_maker', 'the terms of the investment deal', 0.1);
  assert.ok(openCases(b).some((c) => c.who === 'ty_maker'), 'the investigation is on the record');

  // The third government inherits workers, new firms and competing interests, and the live case.
  const c = newGame({ ...base, name: 'Third' }, end(b)); c.phase = 'desk'; c.turn = 6;
  c.nation.jobs = Math.max(c.nation.jobs, 50);
  societyTick(c);
  const cons = ensureSociety(c).constituencies;
  assert.ok(cons.unions !== undefined, 'organised industrial workers are a constituency');
  assert.ok(cons.credit !== undefined, 'firms that want credit and a way in are a constituency');
  assert.ok(openCases(c).some((x) => x.who === 'ty_maker'), 'the case against the patron is still open');
  assert.ok(c.agenda.done.includes('c1'), 'open procurement remains the law of the land');
});

// The other histories and the checks that carry them. Each named check must still exist.
const EVIDENCE: Record<string, [string, string][]> = {
  '2 The Reformer\'s Handover opening': [['dossiers.check.ts', ''], ['opening.check.ts', 'a chosen route, financier, constraint and cabinet are applied as chosen'], ['opening.check.ts', 'every starting promise has an agreed test']],
  '3 Refusal and settlement': [['requests.check.ts', 'a refused request never returns unchanged'], ['requests.check.ts', 'a grant to someone the President owes settles the debt first'], ['requests.check.ts', 'a promise stays precise']],
  '4 A payroll liquidity crisis': [['holdings.check.ts', 'a salary crisis is met by timed measures'], ['holdings.check.ts', 'a sale is not cash until it settles'], ['money.check.ts', 'paying, borrowing, moving a fund']],
  '5 A currency shock': [['economy.check.ts', 'a real fall in the naira enlarges the foreign debt'], ['money.check.ts', 'thin reserves cost confidence'], ['bets.check.ts', 'each asset changes its own system']],
  '6 A military corridor mission': [['forces.check.ts', 'a corridor campaign produces a year of connected developments'], ['forces.check.ts', 'harm to civilians is recorded']],
  '7 Exceptional recruitment under pressure': [['recruitment.check.ts', 'approach on every term, then appoint'], ['recruitment.check.ts', 'refusing one term is a recorded refusal'], ['../../tools/check-recruitment.ts', 'cutting the protected education allocation resigns the mediator']],
  '8 Independent institution versus its founder': [['institutions.check.ts', 'a capable independent agency helps the country and charges the founder'], ['institutions.check.ts', 'rules in force bind the President']],
  '9 Public services with competing approaches': [['society.check.ts', 'services are measured several ways'], ['society.check.ts', 'the country improves while transport workers lose']],
  '10 Defeat and handover': [['succession.check.ts', 'losing office opens decisions'], ['succession.check.ts', 'another player can inherit an exported country']],
  '11 Succession earned through play': [['succession.check.ts', 'preparation in office changes nomination support'], ['succession.check.ts', 'heir, failed heir and rival handover inherit different things']],
};

check('histories 2 to 11 each still have the checks that carry them', () => {
  const dir = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
  const files = new Set(readdirSync(dir));
  for (const [history, list] of Object.entries(EVIDENCE)) {
    for (const [file, label] of list) {
      assert.ok(files.has(file) || existsSync(dir + file), `${history}: ${file} is missing`);
      if (label) assert.ok(readFileSync(dir + file, 'utf8').includes(label), `${history}: "${label}" is no longer checked in ${file}`);
    }
  }
});

console.log(`${passed} history checks passed.`);
