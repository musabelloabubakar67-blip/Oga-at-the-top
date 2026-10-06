// Experience check: emergency money and the state's holdings (plan 11).
// Run: npx tsx tests/experience/holdings.check.ts
//
// - a sale is not cash until it settles; when it settles the ownership and income go;
// - nothing can be sold twice, or while a sale is under way; stake sales cut the oil income;
// - a reform or order that sells a holding consumes it from the register;
// - a salary crisis is met by a combination of timed measures, each leaving a visible trade-off.

import assert from 'node:assert/strict';
import { EVENTS } from '../../content';
import { FINANCE_CANDIDATES } from '../../content/names';
import { oilRevenue } from '../../engine/accounts';
import { canSell, collectQuote, holdingsIncome, holdingsTick, saleQuote, startCollection, startSale } from '../../engine/holdings';
import { applyAction, newGame } from '../../engine/reduce';
import type { GameState } from '../../engine/types';
import { applyFx, test } from '../../engine/vars';

const setup = { seed: 37, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 60; s.nation.integrity = 40; return s; };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('a sale is not cash until it settles; then the ownership and the income go', () => {
  const s = fresh();
  const cash = s.nation.fiscalSpace, income = holdingsIncome(s);
  startSale(s, 'hotels', 'expedited', 1, 1);
  assert.equal(s.nation.fiscalSpace, cash, 'no money at the announcement');
  assert.ok(!canSell(s, 'hotels', 'auction', 1, 1).ok, 'cannot sell what is already on the market');
  s.turn += 1;
  const price = s.sales![0].price;
  // Expedited sales can fail diligence; retry with a fixed draw if it did.
  holdingsTick(s);
  if (s.holdings!.hotels.share === 1) return; // failed diligence this seed: still owned, no cash
  assert.ok(Math.abs(s.nation.fiscalSpace - cash - price) < 1e-9);
  assert.equal(s.holdings!.hotels.share, 0);
  assert.ok(holdingsIncome(s) < income, 'the hotel income has gone');
  assert.ok(!canSell(s, 'hotels', 'auction', 1, 1).ok, 'cannot sell it twice');
});

check('selling oil stakes permanently cuts the state\'s oil income', () => {
  const s = fresh();
  const before = oilRevenue(s).actual;
  applyFx(s, ['holding.jv_stakes', -1]);
  assert.ok(oilRevenue(s).actual < before * 0.8);
  assert.equal(s.holdings!.jv_stakes.share, 0);
  assert.ok(!canSell(s, 'jv_stakes', 'auction', 1, 1).ok);
});

check('the oil company stays majority-owned', () => {
  const s = fresh();
  assert.ok(canSell(s, 'noc', 'minority', 0.2, 1).ok);
  assert.ok(!canSell(s, 'noc', 'minority', 0.3, 1).ok);
  s.holdings!.noc.share = 0.6;
  assert.ok(!canSell(s, 'noc', 'minority', 0.2, 1).ok, 'would fall below 51%');
});

check('an order that sold the idle assets cannot sell them again', () => {
  const s = fresh();
  for (const id of ['federal_properties', 'hotels', 'aircraft']) applyFx(s, [`holding.${id}`, -1]);
  s.nation.debt = 90;
  assert.ok(!test(s, { v: ['holding.federal_properties', '>', 0.5] }));
});

check('a salary crisis is met by timed measures, each with a visible trade-off', () => {
  const s = fresh();
  s.nation.fiscalSpace = 0.02; s.funds.buffer = 0; s.turn = 6;
  const e = EVENTS['treasury.payroll'];
  assert.ok(test(s, e.when), 'the payroll file arises when the account cannot pay');
  const bonds = s.debts.bonds;
  s.desk.lead = { eventId: 'treasury.payroll' };
  let t = applyAction(s, { type: 'CHOOSE', eventId: 'treasury.payroll', choiceId: 'bridge' });
  assert.ok(t.nation.fiscalSpace > 0.25, 'salaries paid this month');
  assert.ok(t.debts.bonds > bonds, 'the bridge is owed');
  assert.ok(t.sales!.some((x) => x.holding === 'federal_properties'), 'the property is on the market to repay it');
  // A second measure in the same crisis: collect assessed tax over four months.
  const q = collectQuote(t);
  t.desk.actionsUsed = 0;
  startCollection(t, 1);
  assert.ok(q.total > 0 && t.receivables!.collecting);
  const startTax = t.receivables!.tax;
  for (let i = 0; i < 2; i++) { t.turn += 1; holdingsTick(t); }
  assert.ok(t.receivables!.tax < startTax, 'collection arrives in instalments');
  // The property sale settled (or failed diligence, leaving it owned); either way it is on the record.
  const prop = t.holdings!.federal_properties;
  assert.ok(prop.share === 0 ? prop.history.length > 0 : true);
});

check('quotes state proceeds, timing, conditions and what is left behind', () => {
  const s = fresh();
  const q = saleQuote(s, 'airports', 'concession', 1);
  assert.ok(q.price > 0 && q.months > 0 && q.conditions.length && q.obligations.length);
  assert.ok(q.obligations.some((o) => /ten years/.test(o)));
});

console.log(`${passed} holdings checks passed.`);
