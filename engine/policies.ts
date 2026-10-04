// Standing policies. The tempting reforms do not cost a fixed amount: each month
// their cost is worked out against the economy as it is, and the reason is given.
// A minimum wage the economy can carry is spent in the shops; one it cannot is
// paid in lost jobs and states that do not pay it.

import { MILESTONE_BY_ID } from '../content/agenda';
import { CFG } from './config';
import type { Fx, GameState } from './types';
import { applyFx, clamp, hardship } from './vars';
import { oilWeight } from './dependence';

export interface Line { label: string; value: number }

/** How much the economy can carry, 0 to 100, and why. */
export function economyStrength(s: GameState): { v: number; lines: Line[] } {
  const n = s.nation;
  const lines: Line[] = [
    { label: 'Jobs and industry', value: (n.jobs - 40) * 0.7 },
    { label: 'Inflation', value: -(n.inflation - 15) * 0.8 },
    { label: 'The oil price', value: (s.oil.price - 70) * 0.25 * oilWeight(s) },
    { label: 'The treasury', value: clamp(n.fiscalSpace, -1, 3) * 3 },
    { label: 'Debt service', value: -(n.debt - 70) * 0.3 },
  ].filter((l) => Math.abs(l.value) >= 0.5);
  return { v: clamp(50 + lines.reduce((a, l) => a + l.value, 0), 0, 100), lines };
}

/** What a policy does this month: to revenue, to inflation, and to everything else. */
/** approval: points of lasting popularity while it stands, on top of everything else that moves approval. */
export interface PolicyNow { fiscal: number; inflation: number; approval: number; fx: Fx[]; why: string }

interface PolicyDef {
  /** The reform that puts it in force. */
  id: string;
  /** A short name for the books. */
  short: string;
  now: (s: GameState) => Omit<PolicyNow, 'approval'>;
  /** The popularity it keeps while it stands: what made it tempting. */
  goodwill: (s: GameState) => number;
  /** Undoing it costs this much capital, and this. */
  repealPc: number;
  repeal: Fx[];
}

const r1 = (x: number) => Math.round(x);
const done = (s: GameState, id: string) => s.agenda.done.includes(id);

/** The wage the economy can pay, in thousands of naira a month. */
export function affordableWage(s: GameState): number {
  return r1(60 + 1.2 * economyStrength(s).v);
}

const DEFS: PolicyDef[] = [
  {
    id: 'h3', short: 'The cash transfer', goodwill: (s) => (hardship(s) > 55 ? 1.5 : 0.6), repealPc: 8, repeal: [['approval', -3], ['bloc.street', -8]],
    now: (s) => {
      const h = hardship(s);
      const k = 0.5 + h / 100;
      const census = !!s.flags.census;
      return { fiscal: census ? -0.014 : -0.021, inflation: 0, fx: [['bloc.street', 0.04 * k], ['pressure.wageGrievance', -0.12 * k], ['nation.jobs', 0.01]],
        why: `Hardship is at ${r1(h)}: the harder the times, the more a transfer is worth in calm.${census ? ' The census took the ghosts off the list.' : ' Without a census, about a third of it reaches people who do not exist or do not need it.'}` };
    },
  },
  {
    id: 'h6', short: 'Gas buses and conversion kits', goodwill: (s) => (s.flags['policy.subsidy'] === 'removed' ? 1 : 0.3), repealPc: 4, repeal: [['bloc.street', -4]],
    now: (s) => {
      const gas = done(s, 'g1');
      const fiscal = gas ? -0.003 : -0.006;
      if (s.flags['policy.subsidy'] === 'removed') {
        return { fiscal, inflation: -0.5, fx: [['pressure.wageGrievance', -0.25], ['bloc.street', 0.05]],
          why: `The petrol subsidy is gone, so every bus on gas is a fare that did not triple.${gas ? ' Gas that used to be flared keeps it cheap.' : ''}` };
      }
      return { fiscal, inflation: -0.1, fx: [['bloc.street', 0.01]],
        why: `Petrol is still subsidised, so gas saves riders little. End the subsidy and the buses carry its cost.${gas ? ' Gas that used to be flared keeps it cheap.' : ''}` };
    },
  },
  {
    id: 'h7', short: 'The wage deal with labour', goodwill: () => 0.5, repealPc: 10, repeal: [['pressure.wageGrievance', 25], ['bloc.street', -8]],
    now: (s) => {
      const over = Math.max(0, s.nation.inflation - 10);
      return { fiscal: -0.003 - 0.0009 * over, inflation: 0.02 * over, fx: [['pressure.wageGrievance', -0.6]],
        why: over ? `Inflation is ${r1(s.nation.inflation)}%: pay rises with it, and the ${r1(over)} points above 10% are paid by the treasury and passed back into prices. Labour stays off the streets.` : `Inflation is ${r1(s.nation.inflation)}%, so the deal costs almost nothing. Labour stays off the streets.` };
    },
  },
  {
    id: 'h5', short: 'The mortgage programme', goodwill: () => 0.5, repealPc: 4, repeal: [['tycoon.ty_bank', -6]],
    now: (s) => s.nation.inflation < 20
      ? { fiscal: -0.004, inflation: 0, fx: [['nation.jobs', 0.03], ['bloc.street', 0.01]], why: `Inflation is ${r1(s.nation.inflation)}%: a twenty-year loan still makes sense, and the building sites hire.` }
      : { fiscal: -0.012, inflation: 0, fx: [], why: `Inflation is ${r1(s.nation.inflation)}%: nobody signs a twenty-year loan, and the interest subsidy is paid on homes that are not selling. Below 20% it works again.` },
  },
  {
    id: 'r1', short: 'Councils paid directly', goodwill: () => 0.3, repealPc: 6, repeal: [['bloc.street', -5], ['bloc.party', 4]],
    now: (s) => s.nation.capacity >= 42
      ? { fiscal: 0, inflation: 0, fx: [['bloc.street', 0.03], ['nation.jobs', 0.015], ['pressure.wageGrievance', -0.06]], why: `State capacity is ${r1(s.nation.capacity)}: the councils can be audited, so teachers and health workers are paid.` }
      : { fiscal: 0, inflation: 0, fx: [['bloc.street', 0.01], ['nation.integrity', -0.015]], why: `State capacity is ${r1(s.nation.capacity)}: nobody can audit seven hundred councils, and the chairmen keep what the governors used to. Above 42 it starts to work.` },
  },
  {
    id: 'r7', short: 'The governors\' compact', goodwill: () => 0, repealPc: 8, repeal: [['person.gov_nw', -15], ['person.gov_ne', -15], ['person.gov_nc', -15], ['person.gov_sw', -15], ['person.gov_se', -15], ['person.gov_ss', -15], ['bloc.party', -8]],
    now: (s) => ({ fiscal: -0.00025 * s.oil.price, inflation: 0, fx: [['person.gov_nw', 0.3], ['person.gov_ne', 0.3], ['person.gov_nc', 0.3], ['person.gov_sw', 0.3], ['person.gov_se', 0.3], ['person.gov_ss', 0.3], ['bloc.party', 0.02]],
      why: `Three more points of the federation account go to the states. At $${r1(s.oil.price)} oil that is a real sum, and the governors are grateful for it every month.` }),
  },
  {
    id: 'o7', short: 'The amnesty', goodwill: () => 0, repealPc: 4, repeal: [['theatre.NW', 4], ['bloc.press', 2]],
    now: (s) => {
      const since = s.turn - (s.counters['done.o7'] ?? s.turn);
      if (since > 24) return { fiscal: -0.002, inflation: 0, fx: [], why: 'Two years on, the men who came in have settled or gone. The stipends are a small line in the budget.' };
      const work = (s.institutions ?? []).some((i) => i.id === 'jobs') || done(s, 'd3');
      return work
        ? { fiscal: -0.005, inflation: 0, fx: [['theatre.NW', -0.05], ['theatre.NE', -0.04]], why: 'The men who came in have work to go to, and the forests stay emptier.' }
        : { fiscal: -0.005, inflation: 0, fx: [['theatre.NW', 0.2], ['theatre.NE', 0.15]], why: 'The men who came in have a stipend and nothing to do. Some go back every month. A youth jobs corps or technical training would hold them.' };
    },
  },
  {
    id: 'o8', short: 'The recovered-loot register', goodwill: () => 0.5, repealPc: 4, repeal: [['bloc.street', -4], ['bloc.press', -4]],
    now: (s) => {
      const agency = (s.institutions ?? []).some((i) => i.id === 'graft');
      const fiscal = 0.003 + Math.max(0, s.nation.integrity - 30) * 0.0002 + (agency ? 0.004 : 0);
      return { fiscal, inflation: 0, fx: [['bloc.street', 0.02], ['nation.integrity', 0.015], ['bloc.establishment', -0.03]],
        why: `Integrity ${r1(s.nation.integrity)}${agency ? ', and an anti-corruption agency to chase it' : ''}: that sets how much comes back each month. Every sum has a signboard; the people named lobby against you.` };
    },
  },
  {
    id: 'h1', short: 'The price control board', goodwill: (s) => (s.nation.inflation > 12 ? 1.5 : 0.3),  repealPc: 6, repeal: [['approval', -2], ['bloc.street', -5]],
    now: (s) => {
      const excess = Math.max(0, s.nation.inflation - 12);
      if (excess < 1) return { fiscal: -0.003, inflation: 0, fx: [], why: 'Prices are close to what food costs to grow, so the board has little to do but meet.' };
      return { fiscal: -0.003, inflation: -Math.min(5, 0.25 * excess), fx: [['nation.jobs', -0.004 * excess], ['pressure.scandalHeat', 0.04 * excess]],
        why: `Inflation is ${r1(s.nation.inflation)}%. The board holds the shelf price down; the further it is from what food costs to grow, the more farmers stop selling and the more inspectors are paid to look away.` };
    },
  },
  {
    id: 'o1', short: 'The internet falsehood law', goodwill: () => 0,  repealPc: 4, repeal: [['bloc.press', 6], ['bloc.villa', -3]],
    now: (s) => {
      const abuse = Math.max(0, 45 - s.nation.integrity) * 0.003;
      return { fiscal: 0, inflation: 0, fx: [['pressure.scandalHeat', -0.15], ['bloc.press', -0.08], ...(abuse ? [['nation.integrity', -abuse] as Fx] : [])],
        why: abuse ? `With integrity at ${r1(s.nation.integrity)}, the law is used on critics, not liars. It keeps stories quiet and costs a little integrity every month.` : 'Integrity is high enough that the courts throw out most cases brought under it. It keeps a few stories quiet.' };
    },
  },
];

export const POLICY_BY_ID: Record<string, PolicyDef> = Object.fromEntries(DEFS.map((d) => [d.id, d]));

export function policyName(id: string): string {
  return POLICY_BY_ID[id]?.short ?? MILESTONE_BY_ID[id]?.m.name ?? id;
}

/** Policies in force: delivered, and not repealed. */
export function activePolicies(s: GameState): string[] {
  return DEFS.map((d) => d.id).filter((id) => s.agenda.done.includes(id) && !s.flags[`repealed.${id}`]);
}

export function policyNow(s: GameState, id: string): PolicyNow | null {
  const d = POLICY_BY_ID[id];
  return d ? { ...d.now(s), approval: d.goodwill(s) } : null;
}

/** Popularity the policies in force keep, added to where approval is heading in every zone. */
export function policyGoodwill(s: GameState): number {
  return activePolicies(s).reduce((a, id) => a + POLICY_BY_ID[id].goodwill(s), 0);
}

/** Lines for the treasury's monthly flow. */
export function policyFiscalLines(s: GameState): { label: string; value: number; hint: string }[] {
  return activePolicies(s).map((id) => {
    const p = policyNow(s, id)!;
    return { label: policyName(id), value: p.fiscal, hint: p.why };
  }).filter((l) => Math.abs(l.value) >= 0.0005);
}

/** Lines for where inflation is heading. */
export function policyInflationLines(s: GameState): Line[] {
  return activePolicies(s).map((id) => ({ label: policyName(id), value: policyNow(s, id)!.inflation })).filter((l) => Math.abs(l.value) >= 0.05);
}

/** Everything else a policy does, every month. */
export function policyTick(s: GameState): void {
  for (const id of activePolicies(s)) for (const f of policyNow(s, id)!.fx) applyFx(s, f);
}

export function canRepeal(s: GameState, id: string): { ok: boolean; reason?: string } {
  const d = POLICY_BY_ID[id];
  if (!d || !activePolicies(s).includes(id)) return { ok: false, reason: 'Not in force.' };
  if (s.pc < d.repealPc) return { ok: false, reason: `Needs ${d.repealPc} political capital.` };
  return { ok: true };
}

export function repealCost(id: string): { pc: number; fx: Fx[] } {
  const d = POLICY_BY_ID[id];
  return { pc: d?.repealPc ?? 0, fx: d?.repeal ?? [] };
}

/** Undo it. The people who wanted it remember. */
export function repeal(s: GameState, id: string): string {
  const d = POLICY_BY_ID[id];
  s.pc = clamp(s.pc - d.repealPc, 0, CFG.pc.max);
  for (const f of d.repeal) applyFx(s, f);
  s.flags[`repealed.${id}`] = s.turn;
  return `${d.short} is repealed. Those who asked for it will say you never meant it.`;
}
