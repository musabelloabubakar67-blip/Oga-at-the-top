// The arithmetic of the national debt. Kept free of other engine imports so
// that effects on `nation.debt` can be routed to a named creditor.

import { DEBTS } from '../content/treasury';
import { pointsPerTn, serviceRatio } from './accounts';
import type { DebtId, GameState } from './types';

const round = (x: number) => Math.round(x * 1000) / 1000;

/** Points of debt service per ₦tn owed: the debt's interest rate against the last year's revenue (engine/accounts.ts).
 *  A weaker naira no longer bumps a rate: the foreign debt itself is revalued (currency.ts). */
export function rateOf(s: GameState, id: DebtId): number {
  return pointsPerTn(s, id);
}

/** Points of debt service (share of revenue) this debt accounts for. */
export function servicePoints(s: GameState, id: DebtId): number {
  return s.debts[id] * rateOf(s, id);
}

/** nation.debt is debt service: interest against the last year's revenue. */
export function syncDebt(s: GameState): void {
  if (!s.debts || typeof s.debts.eurobond !== 'number') return;
  // A save from before a debt existed owes nothing on it.
  for (const d of DEBTS) if (typeof s.debts[d.id] !== 'number') s.debts[d.id] = 0;
  s.nation.debt = Math.min(130, Math.max(0, serviceRatio(s)));
}

export function addOwed(s: GameState, id: DebtId, tn: number): number {
  const before = s.debts[id];
  s.debts[id] = round(Math.max(0, before + tn));
  // Money the central bank lends the government is created; repaying it withdraws it. Relabelling it (securitisation) does neither.
  if (id === 'ways') {
    const a = (s.accounts ??= { revHist: [], created: before, reserveLog: [] });
    a.created = Math.max(0, a.created + (s.debts[id] - before));
  }
  syncDebt(s);
  return s.debts[id] - before;
}

/** An effect written as points of debt service: new borrowing goes to domestic bonds, relief comes off the dearest debt first. */
export function shiftPoints(s: GameState, pts: number): void {
  if (pts >= 0) { addOwed(s, 'bonds', pts / rateOf(s, 'bonds')); return; }
  let left = -pts;
  for (const id of ['eurobond', 'bonds', 'ways', 'lender'] as DebtId[]) {
    if (left <= 0) break;
    const r = rateOf(s, id);
    const take = Math.min(s.debts[id], left / r);
    s.debts[id] = round(s.debts[id] - take);
    left -= take * r;
  }
  syncDebt(s);
}

export const ARREARS: DebtId[] = ['gas', 'contractors', 'pensions'];
export const totalArrears = (s: GameState) => ARREARS.reduce((a, id) => a + s.debts[id], 0);
export const totalFunds = (s: GameState) => s.funds.abroad + s.funds.buffer + s.funds.infra + s.funds.growth;
