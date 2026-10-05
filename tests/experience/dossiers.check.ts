// Experience check: the inheritance dossiers say only what the game will show.
// Run: npx tsx tests/experience/dossiers.check.ts
//
// - every scenario has a dossier, and every dossier a scenario;
// - asset ids exist and the site is one where that asset can stand;
// - every holder of leverage is a real person, businessman or named cast member;
// - every "first act" points to a real event;
// - every obligation tied to a debt states the amount a new game in that
//   scenario actually starts with (read from the real reducer, not restated).

import { ASSETS } from '../../content/assets';
import { DOSSIERS } from '../../content/dossiers';
import { EVENTS } from '../../content';
import { NAMES } from '../../content/names';
import { PERSON_BY_ID } from '../../content/people';
import { SCENARIOS } from '../../content/scenarios';
import { TYCOON_BY_ID } from '../../content/tycoons';
import { newGame } from '../../engine/reduce';
import type { DebtId, Setup } from '../../engine/types';

const errors: string[] = [];
const fail = (where: string, msg: string) => errors.push(`${where}: ${msg}`);

const setup = (scenario: string): Setup => ({
  seed: 1, scenario, name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN',
  background: 'governor', address: 'sir', finance: 'Dr Halima Gwarzo', priorities: ['power', 'security', 'food', 'works'],
});

const scenarioIds = new Set(SCENARIOS.map((s) => s.id));
for (const s of SCENARIOS) if (!DOSSIERS.some((d) => d.scenario === s.id)) fail(s.id, 'scenario has no dossier');

/** Reads "₦1.2tn" or "₦420bn" as trillions. */
const amountOf = (text: string): number | null => {
  const m = text.match(/₦([\d.]+)(tn|bn)/);
  return m ? Number(m[1]) / (m[2] === 'bn' ? 1000 : 1) : null;
};

for (const d of DOSSIERS) {
  const where = `dossier ${d.scenario}`;
  if (!scenarioIds.has(d.scenario)) { fail(where, 'no such scenario'); continue; }
  const a = ASSETS[d.asset.asset];
  if (!a) fail(where, `unknown asset ${d.asset.asset}`);
  else if (!a.sites.includes(d.asset.site)) fail(where, `${d.asset.asset} cannot stand in ${d.asset.site} (sites: ${a.sites.join(', ')})`);
  for (const l of d.leverage) if (!PERSON_BY_ID[l.who] && !TYCOON_BY_ID[l.who] && !NAMES[l.who]) fail(where, `unknown holder of leverage ${l.who}`);
  if (!EVENTS[d.firstAct.points]) fail(where, `first act points to unknown event ${d.firstAct.points}`);
  for (const c of d.claims) if (!c.checkedBy) fail(where, `claim "${c.claim}" has no source for its finding`);

  const s = newGame(setup(d.scenario));
  for (const o of d.obligations) {
    if (!o.state?.startsWith('debt.') || !o.amount) continue;
    const key = o.state.slice(5);
    const actual = key === 'arrears' ? s.debts.gas + s.debts.contractors + s.debts.pensions : s.debts[key as DebtId];
    const stated = amountOf(o.amount);
    if (actual === undefined) fail(where, `unknown debt ${o.state}`);
    else if (stated !== null && Math.abs(actual - stated) > 0.05) fail(where, `"${o.what}" states ₦${stated}tn; a new game starts with ₦${actual.toFixed(2)}tn`);
  }
}

if (errors.length) {
  console.log(errors.map((e) => `  FAIL ${e}`).join('\n'));
  console.log(`${errors.length} dossier check(s) failed.`);
  process.exit(1);
}
console.log(`Dossier checks passed: ${DOSSIERS.length} dossiers against ${SCENARIOS.length} scenarios.`);
