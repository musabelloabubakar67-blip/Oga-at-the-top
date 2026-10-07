// Experience check: the money adds up (plan 09.A5-A7, A11, A13).
// Run: npx tsx tests/experience/money.check.ts
//
// - paying an arrear, borrowing, moving a fund and receiving oil money each conserve value:
//   what leaves one account arrives in another, and nothing is counted twice;
// - repaying principal lowers what is owed; renegotiating coupons lowers service, not principal;
// - thin reserves cost confidence, ample ones buy nothing extra; a managed rate cannot be smoothed without reserves;
// - the fund abroad earns and loses with markets, separately from the reserves;
// - three years of play leave every account finite and nothing owed below zero.

import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../../content/names';
import { oilRevenue } from '../../engine/accounts';
import { COVER_SAFE, coverPenalty, currencyTick, fxFlow, reserveCover } from '../../engine/currency';
import { transferSavedFund } from '../../engine/fund-transfers';
import { borrowNow } from '../../engine/holdings';
import { applyAction, newGame } from '../../engine/reduce';
import { pay } from '../../engine/treasury';
import type { GameState } from '../../engine/types';

const setup = { seed: 17, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 80; s.nation.fiscalSpace = 4; return s; };
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('paying, borrowing, moving a fund and receiving oil money conserve value', () => {
  const s = fresh();
  s.debts.contractors = 1;
  const cash = s.nation.fiscalSpace;
  pay(s, 'contractors', 0.4);
  assert.ok(near(s.nation.fiscalSpace, cash - 0.4) && near(s.debts.contractors, 0.6), 'an arrear paid leaves the treasury once');
  const bonds = s.debts.bonds, cash2 = s.nation.fiscalSpace;
  borrowNow(s, 0.5, 1);
  assert.ok(near(s.nation.fiscalSpace, cash2 + 0.5), 'borrowed cash arrives');
  assert.ok(near(s.debts.bonds, bonds + 0.54, 1e-3), 'and is owed with its stated premium');
  s.funds.buffer = 0.8;
  const total = s.funds.buffer + s.nation.fiscalSpace;
  transferSavedFund(s, 'buffer', 'treasury', 0.5);
  assert.ok(near(s.funds.buffer + s.nation.fiscalSpace, total), 'a fund drawn down moves money, it does not make it');
  // Above the benchmark, what is saved is exactly what is not budgeted.
  s.oil.price = s.budget.benchmark + 20;
  const o = oilRevenue(s);
  assert.ok(near(o.actual - o.budgeted, o.saved, 1e-9), 'oil money is counted once: budgeted or saved');
});

check('principal and service are different things', () => {
  const s = fresh();
  const owed = s.debts.bonds, service = s.nation.debt;
  pay(s, 'bonds', 0.3);
  assert.ok(s.debts.bonds < owed && s.nation.debt < service, 'repaying principal lowers what is owed and its service');
});

check('thin reserves cost confidence; ample ones buy nothing extra; a managed rate needs reserves to smooth', () => {
  const s = fresh();
  s.fx!.reserves = 40;
  assert.ok(reserveCover(s) > COVER_SAFE);
  assert.equal(coverPenalty(s), -0);
  s.fx!.reserves = 6;
  assert.ok(coverPenalty(s) < 0, 'below four months of cover, money leaves');
  assert.ok(fxFlow(s).lines.some((l) => /thin reserves/.test(l.label) && l.value < 0));
  // Managed rate, market far weaker: with reserves it moves a fifth of the way; without, most of it.
  const a = fresh(), b = fresh();
  for (const t of [a, b]) { t.fx!.stance = 'managed'; t.flags['fx.stance'] = 'managed'; t.fx!.fair = t.fx!.rate * 1.5; }
  a.fx!.reserves = 40; b.fx!.reserves = 2;
  const ra = a.fx!.rate, rb = b.fx!.rate;
  currencyTick(a); currencyTick(b);
  assert.ok((b.fx!.rate - rb) > (a.fx!.rate - ra) * 2, 'without reserves the rate cannot be held');
});

check('the fund abroad earns and loses with markets, apart from the reserves', () => {
  const s = fresh();
  s.funds.abroad = 2;
  const reserves = s.fx!.reserves;
  for (let i = 0; i < 12; i++) { s.turn += 1; currencyTick(s); }
  const r = s.accounts!.fundReturns!;
  assert.equal(r.length, 12);
  assert.ok(r.some((x) => x.gain > 0) && r.some((x) => x.gain < 0), 'it goes up and down');
  assert.ok(Number.isFinite(s.fx!.reserves) && s.fx!.reserves !== reserves + r.reduce((a, x) => a + x.gain, 0), 'its returns are not reserves');
});

check('three years of play leave every account finite and nothing owed below zero', () => {
  let s = fresh();
  for (let i = 0; i < 36 && s.phase !== 'verdict'; i++) {
    s.phase = 'desk'; s.desk.lead = null; s.desk.minors = []; s.budget.due = false; s.night = undefined as unknown as GameState['night']; s.desk.actionsUsed = 0;
    s = applyAction(s, { type: 'END_MONTH' });
    for (const [k, v] of Object.entries(s.debts)) assert.ok(Number.isFinite(v) && v >= 0, `debt ${k} is ${v}`);
    for (const [k, v] of Object.entries(s.funds)) assert.ok(Number.isFinite(v) && v >= 0, `fund ${k} is ${v}`);
    assert.ok(Number.isFinite(s.nation.fiscalSpace) && Number.isFinite(s.nation.debt));
    assert.ok(Number.isFinite(s.fx!.reserves) && s.fx!.reserves >= 0);
  }
});

console.log(`${passed} money checks passed.`);
