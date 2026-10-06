// Experience check: the national accounts behave as plan 09's acceptance requires.
// Run: npx tsx tests/experience/economy.check.ts
//
// - every line of the monthly flow has a named source, and the flow is what the treasury receives;
// - a fall in revenue raises debt service without any new borrowing; a stronger tax base lowers it;
// - a real fall in the naira enlarges the foreign debt and the fund abroad, and the effect persists;
// - tax collection earns no dollars; exports do; reserves move only through the dollar flow;
// - financing creates its obligation (the diaspora bond, the lender's facility);
// - relabelling the central bank overdraft as bonds does not make its inflation vanish.

import assert from 'node:assert/strict';
import { EVENTS } from '../../content';
import { FINANCE_CANDIDATES } from '../../content/names';
import { VENTURE_BY_ID } from '../../content/ventures';
import { createdMoney, interestAnnual, nonOilRevenue, revenueAnnual, serviceRatio } from '../../engine/accounts';
import { currencyTick, fxFlow } from '../../engine/currency';
import { syncDebt } from '../../engine/ledger';
import { applyAction, newGame } from '../../engine/reduce';
import { fiscalFlow, printedInflation, securitise } from '../../engine/treasury';
import type { GameState } from '../../engine/types';
import { applyFx } from '../../engine/vars';

const setup = { seed: 31, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; return s; };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('the standard inheritance starts at 66% debt service, from interest against revenue', () => {
  const s = fresh();
  assert.ok(Math.abs(s.nation.debt - 66) < 1, `debt service ${s.nation.debt}`);
  assert.ok(Math.abs(serviceRatio(s) - (100 * interestAnnual(s)) / revenueAnnual(s)) < 1e-9);
});

check('every line of the monthly flow is named, and the flow is what reaches the treasury', () => {
  const s = fresh();
  const f = fiscalFlow(s);
  for (const l of f.lines) assert.ok(l.label && l.hint, 'a line without a source');
  assert.ok(f.lines.some((l) => l.label === 'Oil revenue' && l.value > 0));
  assert.ok(f.lines.some((l) => l.label === 'Interest on the debt' && l.value < 0));
  assert.ok(Math.abs(f.total - f.lines.reduce((a, l) => a + l.value, 0)) < 1e-12);
});

check('a fall in revenue raises debt service with no new borrowing; a stronger tax base lowers it', () => {
  const s = fresh();
  const before = serviceRatio(s), owed = interestAnnual(s);
  s.accounts!.revHist = Array(12).fill(0.2);
  assert.ok(serviceRatio(s) > before + 10, 'less revenue should mean heavier debt service');
  assert.equal(interestAnnual(s), owed, 'nothing new was borrowed');
  const t = fresh();
  const tax = nonOilRevenue(t);
  t.nation.capacity += 15;
  assert.ok(nonOilRevenue(t) > tax, 'capacity raises tax revenue');
});

check('a real fall in the naira enlarges the foreign debt and the fund abroad, and it stays enlarged', () => {
  const s = fresh();
  s.funds.abroad = 1;
  const debt = s.debts.eurobond, fund = s.funds.abroad;
  s.fx!.fair = s.fx!.rate * 1.6; // the market wants a much weaker naira
  currencyTick(s);
  assert.ok(s.debts.eurobond > debt * 1.05, 'foreign debt grows in naira when the naira falls');
  assert.ok(s.funds.abroad > fund * 1.05, 'dollar savings grow in naira too');
  const after = s.debts.eurobond;
  syncDebt(s);
  assert.equal(s.debts.eurobond, after, 'a recalculation does not erase the valuation');
});

check('tax collection earns no dollars; exports and remittances do', () => {
  const s = fresh();
  const dollars = fxFlow(s).total;
  s.nation.capacity += 20;
  assert.ok(Math.abs(fxFlow(s).total - dollars - 20 * 0.004) < 0.0011, 'only the investor-confidence line may move with capacity');
  const oil = fxFlow(s).lines.find((l) => l.label === 'Oil exports')!;
  s.oil.price = 40;
  assert.ok(fxFlow(s).lines.find((l) => l.label === 'Oil exports')!.value > 0, 'a low oil price is a smaller inflow, never an outflow');
  assert.ok(oil.value > 0);
});

check('financing creates its obligation', () => {
  const diaspora = VENTURE_BY_ID.diaspora.win;
  const cash = diaspora.find(([p]) => p === 'nation.fiscalSpace')?.[1] ?? 0;
  const owed = diaspora.filter(([p]) => p.startsWith('debt.')).reduce((a, [, x]) => a + x, 0);
  assert.ok(cash > 0 && owed >= cash, 'the diaspora bond is borrowing');
  const facility = EVENTS['lender.offer'].choices.flatMap((c) => c.outcomes).find((o) => o.fx?.some(([p]) => p === 'debt.lender'));
  assert.ok(facility, 'the lender\'s facility is owed to the lender');
  const s = fresh();
  const before = s.debts.lender;
  applyFx(s, ['debt.lender', 3]);
  assert.ok(s.debts.lender - before >= 3 - 1e-9 && interestAnnual(s) > 0);
});

check('relabelling the overdraft does not make its inflation vanish', () => {
  const s = fresh();
  s.pc = 50;
  const printed = printedInflation(s);
  securitise(s);
  assert.equal(s.debts.ways, 0);
  assert.ok(printedInflation(s) >= printed - 1e-9, 'the money created is still in circulation');
  assert.ok(createdMoney(s) > 0);
  // It wears off over time rather than at once.
  let t = s;
  for (let i = 0; i < 12; i++) { t.phase = 'desk'; t.desk.lead = null; t.desk.minors = []; t = applyAction(t, { type: 'END_MONTH' }); }
  assert.ok(createdMoney(t) < createdMoney(s), 'created money is absorbed gradually');
});

check('a fiscal rule lowers what the debt costs, not what is owed; only a haircut retires principal', () => {
  const s = fresh();
  const owed = s.debts.eurobond + s.debts.bonds, interest = interestAnnual(s), ratio = s.nation.debt;
  applyFx(s, ['nation.debt', -10]);
  assert.equal(s.debts.eurobond + s.debts.bonds, owed, 'principal unchanged');
  assert.ok(interestAnnual(s) < interest, 'interest falls');
  assert.ok(Math.abs(s.nation.debt - (ratio - 10)) < 0.5, 'debt service falls by about the stated points');
  const t = fresh();
  applyFx(t, ['debt.eurobond', -2]);
  assert.ok(t.debts.eurobond < s.debts.eurobond, 'a haircut is explicit');
});

console.log(`${passed} economy checks passed.`);
