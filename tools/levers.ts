// What each order is worth, measured rather than read from its text. From states that
// real presidencies pass through, each order that could be given is given to a copy,
// and both copies are played on with the same seed. The difference is the order's
// effect, after its knock-on effects. An order that another order of the same kind
// matches or beats on every measure, for no more capital or money, is always beaten.
// Run with `npm run simulate -- 6 --levers`.

import { EVENTS } from '../content';
import { ORDERS, ORDER_BY_ID, type Order } from '../content/agenda';
import { SECTORS } from '../content/treasury';
import { projectMargin } from '../engine/election';
import { ACTION_COST, applyAction, availability, canAct, canOrder, movesLeft } from '../engine/reduce';
import { budgetPoints, usualBudget } from '../engine/treasury';
import type { ActionId, GameState, SectorId } from '../engine/types';
import { ZONES, approval, test } from '../engine/vars';

const METRICS = ['margin', 'approval', 'money', 'integrity', 'capacity', 'security', 'pc'] as const;
type Metric = typeof METRICS[number];
type Row = Record<Metric, number>;

/** The money the state has, net: cash and funds less what it owes. */
const money = (s: GameState) => s.nation.fiscalSpace + Object.values(s.funds).reduce((a, b) => a + b, 0) - Object.values(s.debts).reduce((a, b) => a + b, 0);

function measure(s: GameState): Row {
  return { margin: projectMargin(s), approval: approval(s), money: money(s), integrity: s.nation.integrity, capacity: s.nation.capacity, security: s.nation.security, pc: s.pc };
}

/** A month played without a strategy: every file gets its first open choice, the usual budget is signed. */
function month(s: GameState): GameState {
  if (s.phase === 'papers') s = applyAction(s, { type: 'DISMISS_PAPER' });
  if (s.phase === 'election') s = applyAction(s, { type: 'ELECTION_DONE' });
  for (const it of [s.desk.lead, ...s.desk.minors]) {
    if (!it || it.resolved) continue;
    const e = EVENTS[it.eventId];
    if (!e) continue;
    const c = e.choices.find((x) => availability(s, x).ok) ?? e.choices[0];
    s = applyAction(s, { type: 'CHOOSE', eventId: e.id, choiceId: c.id });
  }
  if (s.budget.due) {
    const alloc = usualBudget() as Record<SectorId, number>;
    while (SECTORS.reduce((a, x) => a + (alloc[x.id] ?? 0), 0) > budgetPoints(70, s)) {
      const top = SECTORS.filter((x) => x.id !== 'padding').sort((p, q) => (alloc[q.id] ?? 0) - (alloc[p.id] ?? 0))[0];
      alloc[top.id] -= 1;
    }
    s = applyAction(s, { type: 'BUDGET', benchmark: 70, alloc });
    if (s.budget.pending) s = applyAction(s, { type: 'BUDGET_RESOLVE', choice: 'accept' });
  }
  return applyAction(s, { type: 'END_MONTH' });
}

function ahead(s: GameState, months: number): GameState {
  for (let i = 0; i < months && s.phase !== 'verdict'; i++) s = month(s);
  return s;
}

const minus = (a: Row, b: Row): Row => Object.fromEntries(METRICS.map((k) => [k, a[k] - b[k]])) as Row;

interface Lever { id: string; kind: string; group: string; cost: { pc: number; naira: number }; situational: boolean }
interface Tally { n: number; offered: number; at6: Row; at18: Row; per: Map<number, Row> }

const zero = (): Row => Object.fromEntries(METRICS.map((k) => [k, 0])) as Row;
const add = (a: Row, b: Row) => { for (const k of METRICS) a[k] += b[k]; };

/** Lets a situational order be measured whenever its moment holds, not only when it happened to be drawn. */
function offer(s: GameState, o: Order): GameState {
  if (!o.situational || s.offers.some((x) => x.id === o.id)) return s;
  if (o.when && !test(s, o.when)) return s;
  const c = structuredClone(s);
  c.offers.push({ id: o.id, since: c.turn, until: c.turn + 3 } as never);
  return c;
}

export function measureLevers(samples: GameState[], shortHorizon = 6): void {
  const levers: Lever[] = [
    ...ORDERS.map((o) => ({ id: o.id, kind: 'order', group: o.situational ? `moment` : o.group, cost: { pc: o.pc, naira: o.naira }, situational: !!o.situational })),
    ...(Object.keys(ACTION_COST) as ActionId[]).map((id) => ({ id, kind: 'in person', group: 'in person', cost: { pc: ACTION_COST[id], naira: 0 }, situational: false })),
  ];
  const tally: Record<string, Tally> = Object.fromEntries(levers.map((l) => [l.id, { n: 0, offered: 0, at6: zero(), at18: zero(), per: new Map<number, Row>() }]));
  console.log(`${samples.length} sample states; each lever played ${shortHorizon} and 18 months on against the same state without it\n`);
  for (const [si, base] of samples.entries()) {
    if (base.phase !== 'desk' || movesLeft(base) <= 0) continue;
    const b6 = ahead(structuredClone(base), shortHorizon);
    const b18 = ahead(structuredClone(b6), 18 - shortHorizon);
    const m6 = measure(b6), m18 = measure(b18);
    for (const l of levers) {
      let s = base;
      let act: Parameters<typeof applyAction>[1] | null = null;
      if (l.kind === 'order') {
        const o = ORDER_BY_ID[l.id];
        s = offer(base, o);
        if (canOrder(s, o).ok) act = { type: 'ORDER', id: o.id };
      } else if (canAct(base, l.id as ActionId).ok) {
        const zone = [...ZONES].sort((a, b) => base.zones[a].approval - base.zones[b].approval)[0];
        act = { type: 'ACT', action: l.id as ActionId, zone };
      }
      if (!act) continue;
      const t = tally[l.id];
      t.offered++;
      try {
        const w = applyAction(structuredClone(s), act);
        const w6 = ahead(w, shortHorizon);
        const w18 = ahead(structuredClone(w6), 18 - shortHorizon);
        add(t.at6, minus(measure(w6), m6));
        const d18 = minus(measure(w18), m18);
        add(t.at18, d18);
        t.per.set(si, d18);
        t.n++;
      } catch { /* an order that cannot run here is not counted */ }
    }
  }
  const avg = (r: Row, n: number) => Object.fromEntries(METRICS.map((k) => [k, n ? r[k] / n : 0])) as Row;
  const usable = samples.filter((s) => s.phase === 'desk').length;
  const f = (v: number, d = 1) => (v >= 0 ? '+' : '') + v.toFixed(d);
  const rows = levers.map((l) => ({ l, t: tally[l.id], a6: avg(tally[l.id].at6, tally[l.id].n), a18: avg(tally[l.id].at18, tally[l.id].n) }));
  console.log('lever'.padEnd(18) + 'group'.padEnd(11) + 'cost'.padEnd(12) + 'open'.padStart(6) + '   │ at 18 months: margin approval money integrity capacity security capital   │ margin at ' + shortHorizon);
  for (const g of [...new Set(levers.map((l) => l.group))]) {
    for (const r of rows.filter((x) => x.l.group === g)) {
      const open = Math.round((r.t.offered / Math.max(1, usable)) * 100);
      const cost = `${r.l.cost.pc}pc ₦${r.l.cost.naira}`;
      console.log(r.l.id.padEnd(18) + g.padEnd(11) + cost.padEnd(12) + `${open}%`.padStart(6) + '   │ '
        + [f(r.a18.margin), f(r.a18.approval), f(r.a18.money, 2), f(r.a18.integrity), f(r.a18.capacity), f(r.a18.security), f(r.a18.pc, 0)].map((x) => x.padStart(8)).join('') + '   │ ' + f(r.a6.margin).padStart(6) + (r.t.n < 5 ? '   (few samples)' : ''));
    }
  }
  // Always beaten: in the months when both were open, another lever was no worse on any measure, for no more cost.
  console.log('\nAlways beaten (in the months both were open, at least 5, another lever was no worse on any measure at 18 months, for no more capital or money):');
  let any = false;
  const tol = 0.15;
  for (const r of rows) {
    if (r.t.n < 5) continue;
    const better: string[] = [];
    for (const x of rows) {
      if (x === r || x.l.cost.pc > r.l.cost.pc || x.l.cost.naira > r.l.cost.naira) continue;
      const both = [...r.t.per.keys()].filter((k) => x.t.per.has(k));
      if (both.length < 5) continue;
      const mean = (t: Tally, k: Metric) => both.reduce((a, i) => a + t.per.get(i)![k], 0) / both.length;
      if (METRICS.every((k) => mean(x.t, k) >= mean(r.t, k) - tol)) better.push(`${x.l.id} (${both.length} months)`);
    }
    if (better.length) { any = true; console.log(`  ${r.l.id}: beaten by ${better.join(', ')}`); }
  }
  if (!any) console.log('  none');
  // Does nothing that lasts: no measure moves by more than a little after 18 months.
  console.log('\nLeaves little behind after 18 months (no measure moves by more than 0.5, margin by more than 0.3):');
  const faint = rows.filter((r) => r.t.n >= 5 && Math.abs(r.a18.margin) < 0.3 && METRICS.filter((k) => k !== 'margin' && k !== 'pc').every((k) => Math.abs(r.a18[k]) < 0.5));
  console.log('  ' + (faint.map((r) => `${r.l.id} (${r.l.group})`).join(', ') || 'none'));
  console.log('\nRarely open (in under 10% of sampled months; candidates for the moment list, not for cutting):');
  console.log('  ' + (rows.filter((r) => r.t.offered / Math.max(1, usable) < 0.1).map((r) => `${r.l.id} ${Math.round(r.t.offered / Math.max(1, usable) * 100)}%`).join(', ') || 'none'));
}
