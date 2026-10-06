import { FUND_BY_ID } from '../content/treasury';
import { fx } from './currency';
import type { FundId, GameState } from './types';

export type FundDestination = FundId | 'treasury' | 'states' | 'currency';
export interface FundTransfer { era: number; turn: number; from: FundId; to: FundDestination; naira: number; dollars?: number; rate?: number }

/** Funds are carried in naira trillions. FX auctions settle in dollar billions. */
export function transferSavedFund(s: GameState, from: FundId, to: FundDestination, fraction = 1): FundTransfer {
  if (!FUND_BY_ID[from] || !Number.isFinite(s.funds[from]) || s.funds[from] < 0) throw new Error('Invalid source fund');
  if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1) throw new Error('Fund fraction must be between zero and one');
  if (!['treasury', 'states', 'currency'].includes(to) && !FUND_BY_ID[to as FundId]) throw new Error('Unknown fund destination');
  if (FUND_BY_ID[to as FundId] && (!Number.isFinite(s.funds[to as FundId]) || s.funds[to as FundId] < 0)) throw new Error('Invalid destination fund');
  if (from === to) throw new Error('Source and destination are the same fund');
  const amount = s.funds[from] * fraction;
  // Validate before initialising currency or touching either account.
  const rate = s.fx?.rate ?? 1500;
  if (to === 'currency' && (!Number.isFinite(rate) || rate <= 0)) throw new Error('Invalid exchange rate');
  const dollars = amount * 1000 / rate;
  if (to === 'currency' && !Number.isFinite(dollars + (s.fx?.interventionDollars ?? 0))) throw new Error('Invalid intervention amount');
  const record: FundTransfer = { era: s.era, turn: s.turn, from, to, naira: amount };
  s.funds[from] -= amount;
  if (to === 'treasury') s.nation.fiscalSpace += amount;
  else if (to === 'currency') {
    const f = fx(s);
    record.rate = f.rate;
    record.dollars = dollars;
    // Sovereign-fund dollars sold directly into the market. They are not also
    // credited to central-bank reserves or the spendable federal treasury.
    f.interventionDollars = (f.interventionDollars ?? 0) + record.dollars;
  } else if (to !== 'states') s.funds[to as FundId] += amount;
  // State grants leave federal ownership, but remain auditable transfers.
  (s.fundTransfers ??= []).push(record);
  return record;
}
