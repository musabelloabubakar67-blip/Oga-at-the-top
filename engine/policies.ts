// Standing policies. The tempting reforms do not cost a fixed amount: each month
// their cost is worked out against the economy as it is, and the reason is given.
// A minimum wage the economy can carry is spent in the shops; one it cannot is
// paid in lost jobs and states that do not pay it.

import { MILESTONE_BY_ID } from '../content/agenda';
import { CFG } from './config';
import type { Fx, GameState } from './types';
import { applyFx, clamp } from './vars';

export interface Line { label: string; value: number }

/** How much the economy can carry, 0 to 100, and why. */
export function economyStrength(s: GameState): { v: number; lines: Line[] } {
  const n = s.nation;
  const lines: Line[] = [
    { label: 'Jobs and industry', value: (n.jobs - 40) * 0.7 },
    { label: 'Inflation', value: -(n.inflation - 15) * 0.8 },
    { label: 'The oil price', value: (s.oil.price - 70) * 0.25 },
    { label: 'The treasury', value: clamp(n.fiscalSpace, -1, 3) * 3 },
    { label: 'Debt service', value: -(n.debt - 70) * 0.3 },
  ].filter((l) => Math.abs(l.value) >= 0.5);
  return { v: clamp(50 + lines.reduce((a, l) => a + l.value, 0), 0, 100), lines };
}

/** What a policy does this month: to revenue, to inflation, and to everything else. */
export interface PolicyNow { fiscal: number; inflation: number; fx: Fx[]; why: string }

interface PolicyDef {
  /** The reform that puts it in force. */
  id: string;
  /** A short name for the books. */
  short: string;
  now: (s: GameState) => PolicyNow;
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
    id: 'h4', short: 'The ₦150,000 minimum wage', repealPc: 10, repeal: [['approval', -3], ['bloc.street', -8], ['pressure.wageGrievance', 20]],
    now: (s) => {
      const can = affordableWage(s);
      const gap = 150 - can;
      if (gap <= 0) {
        return { fiscal: 0, inflation: 0.3, fx: [['nation.jobs', 0.03], ['bloc.street', 0.05]],
          why: `The economy can carry about ₦${can}k. The wage is paid, and it is spent in the shops.` };
      }
      return { fiscal: -0.0005 * gap, inflation: 0.025 * gap, fx: [['nation.jobs', -0.005 * gap], ['pressure.wageGrievance', 0.04 * gap]],
        why: `The economy can carry about ₦${can}k. The ₦${gap}k gap is paid in jobs lost, states that do not pay it, and strikes by workers who were promised it.` };
    },
  },
  {
    id: 'h1', short: 'The price control board', repealPc: 6, repeal: [['approval', -2], ['bloc.street', -5]],
    now: (s) => {
      const excess = Math.max(0, s.nation.inflation - 12);
      if (excess < 1) return { fiscal: -0.003, inflation: 0, fx: [], why: 'Prices are close to what food costs to grow, so the board has little to do but meet.' };
      return { fiscal: -0.003, inflation: -Math.min(5, 0.25 * excess), fx: [['nation.jobs', -0.004 * excess], ['pressure.scandalHeat', 0.04 * excess]],
        why: `Inflation is ${r1(s.nation.inflation)}%. The board holds the shelf price down; the further it is from what food costs to grow, the more farmers stop selling and the more inspectors are paid to look away.` };
    },
  },
  {
    id: 'h2', short: 'The pump price fixed by law', repealPc: 12, repeal: [['approval', -4], ['bloc.street', -8], ['pressure.wageGrievance', 15]],
    now: (s) => {
      const oil = s.oil.price;
      const fiscal = -(0.015 + 0.0006 * Math.max(0, oil - 45) + 0.0008 * Math.max(0, s.nation.inflation - 12));
      const stress = Math.max(0, (oil - 80) * 0.06);
      return { fiscal, inflation: 0, fx: stress ? [['pressure.fuelSupplyStress', stress]] : [],
        why: `The law fixes the price; the treasury pays the difference. At $${r1(oil)} oil and ${r1(s.nation.inflation)}% inflation the difference is large${stress ? ', and above $80 importers stop bringing fuel in at a loss' : ''}.` };
    },
  },
  {
    id: 'o2', short: 'The closed land borders', repealPc: 6, repeal: [['tycoon.ty_maker', -10], ['tycoon.ty_trade', 8]],
    now: (s) => {
      const farms = ['f1', 'f2', 'f3', 'f5'].filter((id) => done(s, id)).length;
      const belt = (s.theatres.NW + s.theatres.NC) / 2;
      const inflation = Math.max(0.3, 2.2 - 0.6 * farms + (belt - 50) * 0.04);
      const power = s.nation.power >= 45;
      return { fiscal: 0, inflation, fx: [['nation.jobs', power ? 0.02 : -0.01], ['theatre.NW', 0.03]],
        why: `${farms ? `${farms} farm reform${farms > 1 ? 's' : ''} delivered` : 'No farm reform delivered'}, and the farm belt at ${r1(belt)}: that sets how much of the imported food the country can replace. ${power ? 'With power, some factories replace imports.' : 'Without reliable power, factories cannot replace what was imported.'} Smugglers work the northern border.` };
    },
  },
  {
    id: 'o4', short: 'The national airline and shipping line', repealPc: 4, repeal: [['bloc.party', -5]],
    now: (s) => {
      const fiscal = Math.min(0.005, -0.03 + 0.0005 * (s.nation.capacity - 35) + 0.0004 * (s.nation.integrity - 30));
      return { fiscal, inflation: 0, fx: [],
        why: fiscal > -0.005 ? 'Run by a state that works and does not steal, the carriers come close to paying their way.' : `State capacity ${r1(s.nation.capacity)} and integrity ${r1(s.nation.integrity)}: the carriers lose money every month, and the losses rise as the state weakens.` };
    },
  },
  {
    id: 'r2', short: 'The six new states', repealPc: 20, repeal: [['bloc.party', -12], ['approval', -2]],
    now: (s) => ({ fiscal: -0.0004 * s.oil.price, inflation: 0, fx: [['bloc.party', 0.02]],
      why: `Six new governments take their share of the federation account. The more oil earns ($${r1(s.oil.price)}), the more their share costs the centre.` }),
  },
  {
    id: 'g3', short: 'The ban on raw exports', repealPc: 5, repeal: [['tycoon.ty_maker', -8], ['approval', -1]],
    now: (s) => s.nation.power >= 55
      ? { fiscal: -0.008, inflation: 0, fx: [['nation.jobs', 0.04]], why: `Power is at ${r1(s.nation.power)}: there is electricity to process what used to be shipped raw, and the factories hire.` }
      : { fiscal: -0.02, inflation: 0, fx: [['nation.jobs', -0.03], ['zone.NC.approval', -0.03]], why: `Power is at ${r1(s.nation.power)}: there is not enough electricity to process the crops, so farmers cannot sell them at all. Above 55 the ban starts to pay.` },
  },
  {
    id: 'o1', short: 'The internet falsehood law', repealPc: 4, repeal: [['bloc.press', 6], ['bloc.villa', -3]],
    now: (s) => {
      const abuse = Math.max(0, 45 - s.nation.integrity) * 0.003;
      return { fiscal: 0, inflation: 0, fx: [['pressure.scandalHeat', -0.15], ['bloc.press', -0.08], ...(abuse ? [['nation.integrity', -abuse] as Fx] : [])],
        why: abuse ? `With integrity at ${r1(s.nation.integrity)}, the law is used on critics, not liars. It keeps stories quiet and costs a little integrity every month.` : 'Integrity is high enough that the courts throw out most cases brought under it. It keeps a few stories quiet.' };
    },
  },
  {
    id: 'o5', short: 'The death penalty for corruption', repealPc: 4, repeal: [['bloc.street', -4], ['bloc.establishment', 3]],
    now: (s) => done(s, 'c2')
      ? { fiscal: 0, inflation: 0, fx: [['nation.integrity', 0.03]], why: 'Tried in anti-corruption courts with time limits, the threat is believed, and officials behave.' }
      : { fiscal: 0, inflation: 0, fx: [['pressure.scandalHeat', 0.08], ['bloc.establishment', -0.05], ['nation.integrity', -0.01]], why: 'Without courts that work, it is used on the President\'s opponents and nobody else. The establishment notices.' },
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
  return POLICY_BY_ID[id]?.now(s) ?? null;
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
