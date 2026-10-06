// The arithmetic of the national debt. Kept free of other engine imports so
// that effects on `nation.debt` can be routed to a named creditor.

import { DEBTS, DEBT_BY_ID } from '../content/treasury';
import type { DebtId, GameState } from './types';

const round = (x: number) => Math.round(x * 1000) / 1000;

/** Dollar debt costs more as the naira weakens. */
export function rateOf(s: GameState, id: DebtId): number {
  const d = DEBT_BY_ID[id];
  const factor = s.debtTerms?.[id]?.rateFactor ?? 1;
  if (id === 'eurobond') return d.rate * (1 + Math.max(0, s.nation.inflation - 20) * 0.012) * factor;
  // A banker who is with you keeps the auctions friendly; one who is not does the opposite.
  if (id === 'bonds') {
    const rel = s.tycoons?.ty_bank?.rel ?? 50;
    return (d.rate + (rel >= 60 ? -0.25 : rel < 35 ? 0.35 : 0)) * factor;
  }
  return d.rate;
}

/** Points of debt service (share of revenue) this debt accounts for. */
export function servicePoints(s: GameState, id: DebtId): number {
  return s.debts[id] * rateOf(s, id);
}

/** nation.debt is the sum of the interest-bearing debts. */
export function syncDebt(s: GameState): void {
  let total = 0;
  for (const d of DEBTS) if (d.kind === 'bond') total += servicePoints(s, d.id);
  s.nation.debt = Math.min(130, Math.max(0, total));
}

export function addOwed(s: GameState, id: DebtId, tn: number): number {
  const before = s.debts[id];
  s.debts[id] = round(Math.max(0, before + tn));
  syncDebt(s);
  return s.debts[id] - before;
}

/** An effect written as points of debt service: new borrowing goes to domestic bonds, relief comes off the dearest debt first. */
export function shiftPoints(s: GameState, pts: number): void {
  if (pts >= 0) { addOwed(s, 'bonds', pts / rateOf(s, 'bonds')); return; }
  let left = -pts;
  for (const id of ['eurobond', 'bonds', 'ways'] as DebtId[]) {
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
