// Contextual actions. Every order already says what it touches; this finds the ones
// that bear on what the President is looking at (a gauge, a worry, a file, an
// adviser's brief), open now, best first. The full Orders screen stays as the
// toolbox; this only puts the right few within reach.

import { ORDER_BY_ID, type Order } from '../content/agenda';
import { canOrder, orderOutcome, standingOrders } from './reduce';
import type { Category, GameState, Topic } from './types';

/** What helps, as [target prefix, the direction that helps]. */
type Want = [string, 1 | -1][];

const PRICES: Want = [['nation.inflation', -1], ['bonus.inflation', -1], ['nation.petrolPrice', -1]];
const MONEY: Want = [['nation.fiscalSpace', 1], ['bonus.fiscal', 1]];
const SECURITY: Want = [['nation.security', 1], ['sec.', 1], ['theatre.', -1], ['drift.', -1]];
const LABOUR: Want = [['pressure.wageGrievance', -1], ['bloc.street', 1]];
const CLEAN: Want = [['nation.integrity', 1], ['pressure.scandalHeat', -1]];
const PARTY: Want = [['bloc.party', 1], ['pc', 1]];

/** What each thing on the screen is about. Gauges by their label, worries by topic, files by category, advisers by role. */
const WANTS: Record<string, Want> = {
  'Cost-of-living pressure': [...PRICES, ['pressure.wageGrievance', -1]], Inflation: PRICES, Treasury: MONEY,
  'The naira': [['fx.reserves', 1], ['fx.rate', -1]], 'Debt service': [['nation.debt', -1], ['debt.', -1]],
  'Unpaid bills': [['debt.contractors', -1], ['debt.pensions', -1], ['debt.gas', -1]], Saved: [['fund.', 1]],
  Security: SECURITY, Power: [['nation.power', 1]], 'Jobs and industry': [['nation.jobs', 1]],
  'State capacity': [['nation.capacity', 1]], Integrity: CLEAN,
  'topic:prices': PRICES, 'topic:money': MONEY, 'topic:oil': MONEY, 'topic:power': [['nation.power', 1]], 'topic:security': SECURITY,
  'topic:labour': LABOUR, 'topic:scandal': CLEAN, 'topic:politics': PARTY, 'topic:people': PARTY,
  'cat:economy': [...PRICES, ...MONEY], 'cat:labour': LABOUR, 'cat:security': SECURITY, 'cat:infrastructure': [['nation.power', 1], ['nation.jobs', 1]],
  'cat:politics': PARTY, 'cat:scandal': CLEAN,
  'role:fin': [...MONEY, ['nation.debt', -1], ['debt.', -1]], 'role:nsa': SECURITY, 'role:power': [['nation.power', 1]], 'role:labmin': LABOUR,
  'role:info': [['bloc.press', 1], ['approval', 1]], 'role:edu': [['nation.capacity', 1]], 'role:sap': [['approval', 1], ['bloc.street', 1]],
  'role:cos': [['bloc.villa', 1], ['bloc.party', 1]],
};

/** One unit of each kind of effect, so that money, prices and indices can be compared. */
function unit(t: string): number {
  if (t === 'nation.fiscalSpace' || t.startsWith('debt.') || t.startsWith('fund.')) return 0.2;
  if (t === 'bonus.fiscal') return 0.02;
  if (t === 'nation.petrolPrice') return 100;
  if (t.startsWith('pressure.')) return 5;
  if (t === 'nation.inflation' || t === 'bonus.inflation' || t === 'approval') return 1;
  if (t.startsWith('sec.') || t.startsWith('drift.')) return 0.2;
  return 2;
}

function score(s: GameState, o: Order, want: Want): number {
  const out = orderOutcome(o, s);
  const fx = [...(out.fx ?? []), ...(out.later ?? []).flatMap((l) => l.fx)];
  let v = 0;
  for (const [t, d] of fx) {
    const w = want.find(([p]) => t === p || (p.endsWith('.') && t.startsWith(p)));
    if (w) v += Math.sign(d) * w[1] * Math.min(3, Math.abs(d) / unit(t));
  }
  return v;
}

/** The open orders that bear on something, best first. */
export function powersFor(s: GameState, key: string, max = 3): Order[] {
  const want = WANTS[key];
  if (!want) return [];
  const open = [...standingOrders(s), ...s.offers.map((x) => ORDER_BY_ID[x.id]).filter(Boolean)];
  return open
    .filter((o) => canOrder(s, o).ok)
    .map((o) => ({ o, v: score(s, o, want) }))
    .filter((x) => x.v >= 0.5)
    .sort((a, b) => b.v - a.v)
    .slice(0, max)
    .map((x) => x.o);
}

export const topicKey = (t?: Topic) => (t ? `topic:${t}` : '');
export const categoryKey = (c?: Category) => (c ? `cat:${c}` : '');
export const roleKey = (r: string) => `role:${r}`;
