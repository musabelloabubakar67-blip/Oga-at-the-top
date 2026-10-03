// The naira. An official rate, a black-market rate, foreign reserves, and the
// central bank's stance. Dollars come in from oil, remittances and exports, and
// go out on fuel imports, debt and capital that is leaving. Where they balance
// is the naira's fair value; the stance decides how far the official rate is
// held away from it, and what that costs in reserves. A weaker naira raises
// prices and the cost of the subsidy and foreign debt, and raises the naira
// value of oil revenue. A defended naira with a black-market premium is a
// standing opportunity for whoever gets dollars at the official rate.

import type { GameState } from './types';
import { clamp, hardship } from './vars';

export type Stance = 'peg' | 'managed' | 'float';
export const STANCE_NAME: Record<Stance, string> = { peg: 'Defend the naira', managed: 'A managed rate', float: 'Let it float' };

export interface Fx { rate: number; fair: number; parallel: number; reserves: number; stance: Stance; hist: number[]; base: number }

export function initCurrency(s: GameState): void {
  s.fx = { rate: 1500, fair: 1560, parallel: 1600, reserves: 33, stance: 'managed', hist: [], base: 1500 };
  s.flags['fx.stance'] = 'managed';
}

export function fx(s: GameState): Fx {
  if (!s.fx) initCurrency(s);
  return s.fx!;
}

/** Dollars in and out each month, $bn, with the reasons. */
export function fxFlow(s: GameState): { lines: { label: string; value: number }[]; total: number } {
  const n = s.nation;
  const national = s.agenda.done.includes('i5');
  const plant = (s.assets ?? []).some((a) => a.id === 'refinery') || !!s.flags['refinery.sold'];
  const lines = [
    { label: 'Oil exports', value: (s.oil.price * s.oil.output - 128) * 0.02 },
    { label: 'Money sent home from abroad', value: 0.25 },
    { label: 'Non-oil exports', value: (n.jobs - 34) * 0.008 },
    { label: 'Petrol imports', value: national ? -0.05 : plant ? -0.15 : -0.3 },
    { label: 'Foreign debt service', value: -0.12 - Math.max(0, n.debt - 66) * 0.004 },
    // A country that works attracts dollars; one that is falling apart loses them. What is not already counted above.
    { label: 'Investors on the economy', value: (n.power - 35) * 0.006 + (n.security - 35) * 0.006 + (n.capacity - 34) * 0.004 + clamp(n.fiscalSpace, -1, 3) * 0.04 + Math.min(20, s.agenda.done.length) * 0.01 - Math.max(0, hardship(s) - 60) * 0.005 },
    { label: 'Capital leaving, or arriving', value: (s.blocs.establishment - 50) * 0.006 + (n.integrity - 35) * 0.003 - Math.max(0, premium(s) - 0.2) * 0.6 },
  ];
  return { lines, total: lines.reduce((a, l) => a + l.value, 0) };
}

export function premium(s: GameState): number {
  const f = s.fx;
  return f ? f.parallel / f.rate - 1 : 0;
}

/** Depreciation of the official rate over the last year, as a fraction. */
export function yearFall(s: GameState): number {
  const f = fx(s);
  const then = f.hist.length ? f.hist[0] : f.rate;
  return f.rate / then - 1;
}

/** The fall beyond what the gap between our inflation and the world's explains: the part that makes imports dearer in real terms. */
export function realFall(s: GameState): number {
  const months = Math.max(1, fx(s).hist.length - 1);
  return yearFall(s) - ((s.nation.inflation - 4) / 100) * (months / 12);
}

/** Points of inflation the naira is adding: a real fall passed through to prices, and a wide premium pricing imports at the black-market rate. */
export function fxInflation(s: GameState): number {
  return clamp(realFall(s) * 100 * 0.3, -2, 12) + Math.max(0, premium(s) - 0.15) * 12;
}

/** The subsidy and oil revenue are priced in dollars: how far the naira has moved them in real terms since the start. */
export function fxScale(s: GameState): number {
  const f = fx(s);
  // Strip out the fall that ordinary inflation explains, so a steady naira leaves the budget where it was.
  const months = f.hist.length;
  const expected = Math.pow(1 + (s.nation.inflation - 4) / 100 / 12, months);
  const then = f.hist.length ? f.hist[0] : f.base;
  return clamp((f.rate / then) / expected, 0.6, 2);
}

/** Every month: the fair value moves, the stance decides the official rate and what it costs, and the black market prices the difference. */
export function currencyTick(s: GameState): void {
  const f = fx(s);
  const flow = fxFlow(s).total;
  const prevRate = f.rate;
  // Fair value: prices rising faster than abroad, and dollars short, both weaken it.
  f.fair *= 1 + (s.nation.inflation - 4) / 100 / 12;
  f.fair *= 1 - clamp(flow, -1.5, 1.5) * 0.012;
  const stance = (s.flags['fx.stance'] as Stance | undefined) ?? f.stance;
  if (stance !== f.stance) { f.stance = stance; if (stance === 'float') floatNow(s); }
  const gap = f.fair / f.rate - 1;
  if (f.stance === 'float') {
    f.rate += (f.fair - f.rate) * 0.35;
    f.reserves += Math.max(0, flow) * 0.5;
    f.parallel = f.rate * 1.03;
  } else if (f.stance === 'managed') {
    f.rate += (f.fair - f.rate) * 0.2;
    f.reserves += flow - Math.max(0, gap) * 1.5;
    f.parallel = f.rate * (1.04 + Math.max(0, gap) * 0.6);
  } else {
    // Defending a rate: every dollar the market wants and cannot find at the official rate comes out of the reserves.
    f.reserves += flow - Math.max(0, gap) * 4;
    f.parallel = Math.max(f.rate * 1.04, f.fair * 1.05);
  }
  f.reserves = clamp(f.reserves, 0, 120);
  // When the reserves run out, the peg breaks, whatever the President wants.
  if (f.stance === 'peg' && f.reserves < 5) {
    f.rate = f.fair;
    f.stance = 'managed';
    s.flags['fx.stance'] = 'managed';
    s.nation.inflation = clamp(s.nation.inflation + 4, 3, 80);
    s.blocs.street = clamp(s.blocs.street - 6, 0, 100);
    s.blocs.establishment = clamp(s.blocs.establishment - 5, 0, 100);
    s.news.push({ chronicle: `NAIRA COLLAPSES TO ₦${Math.round(f.rate)} AS RESERVES RUN DRY`, street: 'NAIRA DON FALL FLAT. DOLLAR DON FINISH', weight: 8, valence: -1, topic: 'money', body: 'The central bank could no longer defend the official rate. It moved overnight to what the market had been paying for months.' });
    s.report.push({ kind: 'failure', title: 'The peg broke', cause: 'The reserves ran out', text: `The central bank spent its reserves defending a rate the market did not believe. When they fell below $5bn, the naira went to ₦${Math.round(f.rate)} in a night. Prices will follow.`, changes: [] });
  }
  // A month's change in the naira moves the cost of foreign debt.
  const move = f.rate / prevRate - 1 - (s.nation.inflation - 4) / 100 / 12;
  if (Math.abs(move) > 0.001) s.nation.debt = clamp(s.nation.debt + move * 100 * 0.12, 0, 200);
  f.hist.push(f.rate);
  if (f.hist.length > 12) f.hist.shift();
  // Importers love a defended naira and dollars at the official rate; manufacturers like a weaker one that keeps imports out.
  const trade = s.tycoons.ty_trade;
  const maker = s.tycoons.ty_maker;
  if (trade) trade.rel = clamp(trade.rel + (f.stance === 'peg' ? 0.4 : f.stance === 'float' ? -0.25 : 0), 0, 100);
  if (maker) maker.rel = clamp(maker.rel + (f.stance === 'float' ? 0.25 : f.stance === 'peg' ? -0.15 : 0), 0, 100);
  if (premium(s) > 0.3) s.blocs.establishment = clamp(s.blocs.establishment - 0.2, 0, 100);
}

/** Moving to a float: most of the gap closes at once. */
export function floatNow(s: GameState): void {
  const f = fx(s);
  f.rate += (f.fair - f.rate) * 0.7;
  f.parallel = f.rate * 1.03;
}

export function currencyLine(s: GameState): string {
  const f = fx(s);
  return `₦${Math.round(f.rate).toLocaleString('en-GB')} to the dollar, ₦${Math.round(f.parallel).toLocaleString('en-GB')} on the street`;
}
