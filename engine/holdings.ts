// THE STATE'S HOLDINGS AND EMERGENCY MONEY (plan 11)
// A register of what the state owns, and the ways to raise money in a hurry:
// selling or leasing holdings, collecting established tax debts, borrowing at
// a premium, withdrawing savings, deferring payments. Every measure states its
// net proceeds, when the money actually arrives, its conditions and what it
// leaves owed or given up. A sale is not cash until it settles; a sale can fail
// diligence; what is sold stops earning; nothing can be sold twice, or while it
// is pledged or already on the market.

import { HOLDINGS, HOLDING_BY_ID, METHOD, REFINERIES, REVIVED_VALUE, TAX_ARREARS_START, type Holding, type SaleMethod } from '../content/holdings';
import { TYCOON_BY_ID } from '../content/tycoons';
import { CFG } from './config';
import { addOwed } from './ledger';
import { rand } from './rng';
import type { GameState } from './types';
import { applyFx, clamp } from './vars';

export interface HoldingState {
  share: number;
  conceded?: { until: number; to: string };
  pledged?: string;
  history: { at: number; method: SaleMethod | 'listing' | 'reform'; share: number; price: number; buyer?: string }[];
}
export interface PendingSale { id: string; holding: string; method: SaleMethod; share: number; price: number; buyer?: string; started: number; due: number }

export const SALE_PC = 2;
export const COLLECT_PC = 3;

export function ensureHoldings(s: GameState): Record<string, HoldingState> {
  s.holdings ??= Object.fromEntries(HOLDINGS.map((h) => [h.id, { share: 1, history: [] }]));
  // Saves from before the refineries were three: each plant inherits what was left of the old holding.
  const old = s.holdings.refineries;
  if (old) {
    for (const r of REFINERIES) s.holdings[r.holding] ??= { share: old.share, history: [...old.history] };
    delete s.holdings.refineries;
    for (const x of s.sales ?? []) if (x.holding === 'refineries') x.holding = REFINERIES[0].holding;
  }
  for (const h of HOLDINGS) s.holdings[h.id] ??= { share: 1, history: [] };
  s.sales ??= [];
  s.receivables ??= { tax: TAX_ARREARS_START };
  return s.holdings;
}

/** A refinery whose rehabilitation has been won is a working plant. */
export const revived = (s: GameState, h: Holding): boolean => !!h.revives && s.ventures.won.includes(h.revives);
/** What the whole holding is worth today. */
export const holdingValue = (s: GameState, h: Holding): number => (revived(s, h) ? REVIVED_VALUE : h.value);
/** Its monthly income to the treasury. A revived plant's earnings are counted by its operating asset. */
export const holdingIncome = (s: GameState, h: Holding): number => (revived(s, h) ? 0 : h.income);

const pendingShare = (s: GameState, id: string) => (s.sales ?? []).filter((x) => x.holding === id).reduce((a, x) => a + x.share, 0);

/** Each month's income from what the state still owns and has not leased out. */
export function holdingsIncome(s: GameState): number {
  const h = s.holdings;
  if (!h) return HOLDINGS.reduce((a, x) => a + holdingIncome(s, x), 0);
  return HOLDINGS.reduce((a, x) => a + (h[x.id]?.conceded && h[x.id].conceded!.until > s.turn ? 0 : holdingIncome(s, x) * (h[x.id]?.share ?? 1)), 0);
}

/** Who would buy: the businessman among the interested buyers who is warmest to the President. */
function buyerFor(s: GameState, id: string): string {
  const buyers = HOLDING_BY_ID[id].buyers;
  return [...buyers].sort((a, b) => (s.tycoons?.[b]?.rel ?? 50) - (s.tycoons?.[a]?.rel ?? 50))[0];
}

export interface Quote { price: number; months: number; buyer?: string; conditions: string[]; costs: string[]; obligations: string[] }

/** What a sale would raise, when, and what it costs or leaves behind. */
export function saleQuote(s: GameState, id: string, method: SaleMethod, share: number): Quote {
  const h = HOLDING_BY_ID[id], m = METHOD[method];
  // Buyers pay less for a country that frightens them, and know when the seller is in a hurry.
  const market = clamp(0.85 + (s.blocs.establishment / 50) * 0.15 - Math.max(0, (s.fx ? s.fx.parallel / s.fx.rate - 1 : 0) - 0.2) * 0.5, 0.6, 1.1);
  const price = Math.round(holdingValue(s, h) * share * m.price * (method === 'negotiated' ? 1 : market) * 1000) / 1000;
  const buyer = method === 'negotiated' || method === 'concession' ? buyerFor(s, id) : undefined;
  const conditions = [
    `${SALE_PC} political capital and one move to start.`,
    method === 'auction' ? 'Bidders, a reserve price and due diligence: a weak record on integrity can make bidders walk away.' : method === 'expedited' ? 'Known bidders only.' : '',
    method === 'minority' && id === 'noc' ? 'The state keeps a majority: no more than a fifth at a time, and never below 51%.' : '',
  ].filter(Boolean);
  const costs = [
    method === 'negotiated' && buyer ? `${TYCOON_BY_ID[buyer]?.name} is grateful; integrity falls and the press will ask how the price was set.` : '',
    h.essential ?? '',
  ].filter(Boolean);
  const obligations = [
    revived(s, h) ? 'A working plant: the buyer takes its output and its earnings. The petrol still stays in the country.' : '',
    method === 'concession' ? `The ${h.income > 0 ? `${Math.round(h.income * 12000)}bn a year it earns goes` : 'income goes'} to the operator for ten years.` : h.income > 0 ? `Its income, about ₦${Math.round(h.income * share * 12000)}bn a year, ends.` : h.income < 0 ? `Its running cost, about ₦${Math.round(-h.income * share * 12000)}bn a year, ends too.` : '',
    h.oilShare ? `The state's share of oil income falls by about ${Math.round(h.oilShare * share * 100)}% for good.` : '',
    'The next government inherits a smaller state.',
  ].filter(Boolean);
  return { price, months: m.months, buyer, conditions, costs, obligations };
}

export function canSell(s: GameState, id: string, method: SaleMethod, share: number, moves: number): { ok: boolean; reason?: string } {
  const h = HOLDING_BY_ID[id];
  if (!h) return { ok: false, reason: 'Nothing by that name is owned.' };
  const st = ensureHoldings(s)[id];
  if (!h.methods.includes(method)) return { ok: false, reason: `${h.name} cannot be sold that way.` };
  if (st.pledged) return { ok: false, reason: `Already pledged: ${st.pledged}.` };
  if (pendingShare(s, id) > 0) return { ok: false, reason: 'A sale is already under way.' };
  if (method === 'concession' && st.conceded && st.conceded.until > s.turn) return { ok: false, reason: 'Already leased to an operator.' };
  if (!(share > 0) || share > st.share + 1e-9) return { ok: false, reason: 'The state does not own that much of it.' };
  if (method === 'minority' && (share > 0.2 + 1e-9 || (id === 'noc' && st.share - share < 0.51 - 1e-9))) return { ok: false, reason: 'A minority sale is at most a fifth, and the oil company stays majority-owned.' };
  if (moves <= 0 || s.pc < SALE_PC) return { ok: false, reason: `Needs one move and ${SALE_PC} political capital.` };
  return { ok: true };
}

/** Starts a sale. The money arrives when it settles, not now. */
export function startSale(s: GameState, id: string, method: SaleMethod, share: number, moves: number): string {
  const can = canSell(s, id, method, share, moves); if (!can.ok) throw new Error(can.reason);
  const q = saleQuote(s, id, method, share), h = HOLDING_BY_ID[id];
  s.pc -= SALE_PC; s.desk.actionsUsed += 1;
  s.sales!.push({ id: `sale.${id}.${s.turn}`, holding: id, method, share, price: q.price, buyer: q.buyer, started: s.turn, due: s.turn + q.months });
  if (method === 'negotiated' && q.buyer) {
    applyFx(s, [`tycoon.${q.buyer}`, 12]);
    applyFx(s, ['nation.integrity', -2]);
    s.exposures.push({ kind: 'political', amount: 0, witnesses: [q.buyer], trail: 1, turn: s.turn, causeId: '', label: `Sold ${h.name} to ${TYCOON_BY_ID[q.buyer]?.name} at a negotiated price.` });
  }
  return `${METHOD[method].name} begun: ${h.name}${share < 1 ? `, ${Math.round(share * 100)}%` : ''}. Expected about ₦${Math.round(q.price * 1000)}bn, in ${q.months} month${q.months === 1 ? '' : 's'}.`;
}

/** Monthly: sales settle (or fail), leases run out, tax collection comes in. */
export function holdingsTick(s: GameState): void {
  ensureHoldings(s);
  const due = s.sales!.filter((x) => x.due <= s.turn);
  s.sales = s.sales!.filter((x) => x.due > s.turn);
  for (const sale of due) {
    const h = HOLDING_BY_ID[sale.holding], st = s.holdings![sale.holding];
    const failChance = sale.method === 'auction' ? (s.nation.integrity < 25 ? 0.15 : 0.04) : sale.method === 'expedited' || sale.method === 'minority' ? 0.05 : 0;
    if (rand(s) < failChance) {
      s.report.push({ kind: 'failure', title: `The sale of ${h.name.toLowerCase()} fell through`, text: 'The bidders withdrew at due diligence. No money came in, and the holding is still owned. It can be offered again.', changes: [] });
      s.news.push({ chronicle: `BIDDERS PULL OUT OF ${h.name.toUpperCase()} SALE`, street: 'THE BUYERS DON RUN. NO MONEY', weight: 3, valence: -1, topic: 'money' });
      continue;
    }
    s.nation.fiscalSpace += sale.price;
    if (sale.method === 'concession') st.conceded = { until: s.turn + 120, to: sale.buyer ?? 'an operator' };
    else st.share = Math.round((st.share - sale.share) * 1000) / 1000;
    st.history.push({ at: s.turn, method: sale.method, share: sale.share, price: sale.price, buyer: sale.buyer });
    // What selling it costs, beyond the price.
    if (sale.holding === 'federal_properties') applyFx(s, ['bloc.party', -2]);
    if (sale.holding === 'aircraft') applyFx(s, ['bloc.villa', -2]);
    if (sale.holding === 'airports') applyFx(s, ['bloc.street', -2]);
    if (h.revives) {
      applyFx(s, ['pressure.wageGrievance', 5]);
      // A sold working plant leaves the state's operating assets; the buyer runs it.
      if (st.share <= 0.001 && s.assets?.some((a) => a.id === h.revives)) {
        s.assets = s.assets.filter((a) => a.id !== h.revives);
        s.flags[`asset.${h.revives}`] = false;
      }
    }
    if (sale.holding === 'noc' || sale.holding === 'jv_stakes') applyFx(s, ['bloc.establishment', 3]);
    s.report.push({ kind: 'consequence', title: `${METHOD[sale.method].name} completed: ${h.name}`, text: `₦${Math.round(sale.price * 1000)}bn paid into the treasury${sale.buyer ? ` by ${TYCOON_BY_ID[sale.buyer]?.name ?? sale.buyer}` : ''}. ${sale.method === 'concession' ? 'The state keeps the ownership; the operator keeps the income for ten years.' : 'It is no longer the state\'s.'}`, changes: [] });
    s.news.push({ chronicle: `FG COMPLETES SALE OF ${h.name.toUpperCase()}: ₦${Math.round(sale.price * 1000)}BN`, street: 'GOVERNMENT DON SELL AM. MONEY DON ENTER', weight: 4, valence: 0, topic: 'money' });
  }
  for (const st of Object.values(s.holdings!)) if (st.conceded && st.conceded.until <= s.turn) delete st.conceded;
  const r = s.receivables!;
  if (r.collecting && r.collecting.until >= s.turn && r.tax > 0) {
    const got = Math.min(r.tax, r.collecting.perMonth);
    r.tax = Math.round((r.tax - got) * 1000) / 1000;
    s.nation.fiscalSpace += got;
  }
  if (r.collecting && (r.collecting.until < s.turn || r.tax <= 0)) delete r.collecting;
}

/** Recording a sale made by a reform, a bet or an order: the ownership and income go, so it cannot be sold again. */
export function recordDisposal(s: GameState, id: string, share: number, price: number, how: 'listing' | 'reform', buyer?: string): void {
  const st = ensureHoldings(s)[id];
  if (!st) return;
  const sold = Math.min(st.share, share);
  st.share = Math.round((st.share - sold) * 1000) / 1000;
  st.history.push({ at: s.turn, method: how, share: sold, price, buyer });
}

/** The state's share of oil income still owned, after stake sales. */
export function oilShareOwned(s: GameState): number {
  const h = s.holdings;
  if (!h) return 1;
  return 1 - HOLDINGS.reduce((a, x) => a + (x.oilShare ?? 0) * (1 - (h[x.id]?.share ?? 1)), 0);
}

// ---------------------------------------------------------------- other emergency measures

export function canCollect(s: GameState, moves: number): { ok: boolean; reason?: string } {
  const r = ensureHoldings(s) && s.receivables!;
  if (r.collecting) return { ok: false, reason: 'A collection drive is already under way.' };
  if (r.tax < 0.02) return { ok: false, reason: 'There is almost nothing left to collect.' };
  if (moves <= 0 || s.pc < COLLECT_PC) return { ok: false, reason: `Needs one move and ${COLLECT_PC} political capital.` };
  return { ok: true };
}
/** What a collection drive brings in: a capable state collects more of what is owed. */
export function collectQuote(s: GameState): { total: number; perMonth: number; months: number } {
  const r = ensureHoldings(s) && s.receivables!;
  const share = clamp(0.4 + (s.nation.capacity - 34) * 0.015, 0.3, 0.9);
  const total = Math.round(r.tax * share * 1000) / 1000;
  return { total, perMonth: Math.round((total / 4) * 1000) / 1000, months: 4 };
}
export function startCollection(s: GameState, moves: number): string {
  const can = canCollect(s, moves); if (!can.ok) throw new Error(can.reason);
  const q = collectQuote(s);
  s.pc -= COLLECT_PC; s.desk.actionsUsed += 1;
  s.receivables!.collecting = { until: s.turn + q.months, perMonth: q.perMonth };
  for (const id of Object.keys(s.tycoons ?? {})) applyFx(s, [`tycoon.${id}`, -3]);
  applyFx(s, ['bloc.establishment', -2]);
  return `The tax office goes after assessed debts it has never collected. About ₦${Math.round(q.total * 1000)}bn over ${q.months} months. Every businessman with an assessment is suddenly less friendly.`;
}

export function canBorrowNow(s: GameState, amount: number, moves: number): { ok: boolean; reason?: string } {
  if (s.nation.debt >= CFG.economy.noLendingAbove) return { ok: false, reason: 'Nobody will lend at this level of debt service.' };
  if (!(amount > 0) || amount > 1) return { ok: false, reason: 'An emergency issue is at most ₦1tn.' };
  if (moves <= 0) return { ok: false, reason: "This month's moves are used." };
  return { ok: true };
}
/** An emergency bond issue: money now, at a premium, owed for years. */
export function borrowNow(s: GameState, amount: number, moves: number): string {
  const can = canBorrowNow(s, amount, moves); if (!can.ok) throw new Error(can.reason);
  s.desk.actionsUsed += 1;
  s.nation.fiscalSpace += amount;
  addOwed(s, 'bonds', Math.round(amount * 1.08 * 1000) / 1000);
  applyFx(s, ['bloc.establishment', -2]);
  return `An emergency bond issue raises ₦${Math.round(amount * 1000)}bn this week. The Debt Office records ₦${Math.round(amount * 1080)}bn owed: the premium is the price of being in a hurry.`;
}
