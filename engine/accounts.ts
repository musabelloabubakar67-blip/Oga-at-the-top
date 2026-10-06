// THE NATIONAL ACCOUNTS (plan 09)
// Gross flows, not deviations from the year the game started. Revenue comes
// from oil (dollars sold, converted at the real exchange rate, capped at the
// budget's benchmark with the excess saved) and from taxes at home. Interest is
// what each debt actually costs at its stated rate. Debt service is interest
// against the last twelve months of actual revenue, so a fall in revenue raises
// it even when nothing new is borrowed, and a stronger tax base lowers it.
//
// Units: ₦tn at the game's scale, in real terms (the starting year's prices).
// Kept free of other engine imports so the ledger and the currency can use it.

import { HOLDINGS } from '../content/holdings';
import type { DebtId, GameState } from './types';

export const ACC = {
  /** ₦tn a month per dollar of oil price, at 1.75m barrels a day and the starting real exchange rate. */
  oilK: 0.003,
  /** Taxes and other revenue at home, ₦tn a month, at the starting capacity, jobs and integrity. */
  nonOilBase: 0.0725,
  /** Annual interest rate on each interest-bearing debt. */
  interest: { eurobond: 0.144, bonds: 0.108, ways: 0.09, lender: 0.03 } as Partial<Record<DebtId, number>>,
  /** Salaries and overheads of the federal government, ₦tn a month. */
  running: 0.1005,
};

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

/** How far the naira has moved in real terms since the start: oil dollars buy this many more (or fewer) naira. */
export function realRate(s: GameState): number {
  const f = s.fx;
  if (!f) return 1;
  const months = f.hist.length;
  const expected = Math.pow(1 + (s.nation.inflation - 4) / 100 / 12, months);
  const then = f.hist.length ? f.hist[0] : f.base;
  return clamp((f.rate / then) / expected, 0.6, 2);
}

/** Oil revenue this month: what the barrels actually earned, and what the budget may spend (the benchmark caps it). */
export function oilRevenue(s: GameState): { actual: number; budgeted: number; saved: number; short: number } {
  // The state's share of oil income falls when it sells oil stakes (content/holdings.ts).
  const share = Math.max(0.4, 1 - HOLDINGS.reduce((a, x) => a + (x.oilShare ?? 0) * (1 - (s.holdings?.[x.id]?.share ?? 1)), 0));
  const scale = (s.oil.output / 1.75) * ACC.oilK * realRate(s) * share;
  const actual = s.oil.price * scale;
  const budgeted = Math.min(s.oil.price, s.budget.benchmark) * scale;
  const benchmarkValue = s.budget.benchmark * scale;
  return { actual, budgeted, saved: Math.max(0, actual - benchmarkValue), short: Math.min(0, actual - benchmarkValue) };
}

/** Taxes and other revenue at home this month. Never negative: a weak state collects little, not less than nothing. */
export function nonOilRevenue(s: GameState): number {
  const n = s.nation;
  return Math.max(0.01, ACC.nonOilBase + (n.capacity - 34) * 0.004 + (n.jobs - 34) * 0.003);
}

/** Public money stolen from spending this month, against what was stolen at the start (integrity 28). Spending, not revenue. */
export function leakage(s: GameState): number {
  return -(s.nation.integrity - 28) * 0.002;
}

/** Revenue actually received this month (oil at its real price, saved excess included). */
export function revenueMonthly(s: GameState): number {
  return oilRevenue(s).actual + nonOilRevenue(s);
}

/** Revenue over the last twelve months, ₦tn a year. Debt service is judged against this, not against one month's oil price. */
export function revenueAnnual(s: GameState): number {
  const hist = s.accounts?.revHist ?? [];
  const months = hist.length ? hist : [revenueMonthly(s)];
  return (months.reduce((a, x) => a + x, 0) / months.length) * 12;
}

/** The discount (or premium) lenders give for the treasury's spending discipline, set monthly by engine/fiscal-system.ts. */
const lender = (s: GameState) => s.counters?.['fiscal.lender'] ?? 1;

/** The interest rate a debt actually carries, after negotiated terms and the banks' mood. */
export function interestRate(s: GameState, id: DebtId): number {
  const base = ACC.interest[id] ?? 0;
  const terms = s.debtTerms?.[id]?.rateFactor ?? 1;
  if (id === 'bonds') {
    // A banker who is with you keeps the auctions friendly; one who is not does the opposite.
    const rel = s.tycoons?.ty_bank?.rel ?? 50;
    return base * (rel >= 60 ? 0.917 : rel < 35 ? 1.117 : 1) * terms * lender(s);
  }
  return base * terms * (id === 'eurobond' ? lender(s) : 1);
}

/** Interest due this year on everything that bears interest, ₦tn. */
export function interestAnnual(s: GameState): number {
  return (Object.keys(ACC.interest) as DebtId[]).reduce((a, id) => a + (s.debts?.[id] ?? 0) * interestRate(s, id), 0);
}

/** Debt service: interest as a share of the last year's actual revenue, %. */
export function serviceRatio(s: GameState): number {
  return (100 * interestAnnual(s)) / Math.max(0.5, revenueAnnual(s));
}

/** Points of debt service each ₦tn of this debt accounts for, at today's revenue. */
export function pointsPerTn(s: GameState, id: DebtId): number {
  return (100 * interestRate(s, id)) / Math.max(0.5, revenueAnnual(s));
}

/** Once a month: remember what came in. */
export function recordRevenue(s: GameState): void {
  const a = (s.accounts ??= { revHist: [], created: s.debts?.ways ?? 0, reserveLog: [] });
  a.revHist.push(revenueMonthly(s));
  if (a.revHist.length > 12) a.revHist.shift();
}

/** Central bank money that has been created and not withdrawn. Relabelling the overdraft does not withdraw it. */
export function createdMoney(s: GameState): number {
  return s.accounts?.created ?? s.debts?.ways ?? 0;
}
