// Turning effects into something the player can read: predicted effects on a
// choice, and the measured change after a decision.

import type { Change, Fx, GameState } from './types';
import { BLOCS, ZONE_NAME, approval } from './vars';
import type { ZoneId } from './types';
import { PERSON_BY_ID, RIVAL_BY_ID } from '../content/people';

interface Meta { label: string; upIsGood: boolean; steps: [number, number]; fmt: (d: number) => string }

const pts = (d: number) => `${d > 0 ? '+' : ''}${Math.abs(d) >= 10 || Number.isInteger(d) ? Math.round(d) : d.toFixed(1)}`;
const index: Omit<Meta, 'label'> = { upIsGood: true, steps: [3, 7], fmt: pts };

const META: Record<string, Meta> = {
  'nation.inflation': { label: 'Inflation', upIsGood: false, steps: [1.5, 3], fmt: (d) => `${pts(d)} pts` },
  'nation.petrolPrice': { label: 'Pump price', upIsGood: false, steps: [200, 400], fmt: (d) => `${d > 0 ? '+' : '−'}₦${Math.abs(Math.round(d))}` },
  'nation.fiscalSpace': { label: 'Treasury', upIsGood: true, steps: [0.2, 0.5], fmt: (d) => `${d > 0 ? '+' : '−'}₦${Math.abs(d) >= 1 ? `${Math.abs(d).toFixed(1)}tn` : `${Math.round(Math.abs(d) * 1000)}bn`}` },
  'nation.debt': { label: 'Debt burden', upIsGood: false, steps: [3, 6], fmt: (d) => `${pts(d)} pts` },
  'nation.security': { label: 'Security', ...index },
  'nation.power': { label: 'Power', ...index },
  'nation.capacity': { label: 'State capacity', ...index },
  'nation.integrity': { label: 'Integrity', ...index },
  'nation.jobs': { label: 'Jobs and industry', ...index },
  'bloc.villa': { label: 'The Villa', ...index },
  'bloc.party': { label: 'The Party', ...index },
  'bloc.street': { label: 'The Street', ...index },
  'bloc.establishment': { label: 'The Establishment', ...index },
  'bloc.press': { label: 'The Press', ...index },
  approval: { label: 'Approval', upIsGood: true, steps: [2, 4], fmt: (d) => `${pts(d)} pts` },
  pc: { label: 'Political capital', upIsGood: true, steps: [5, 10], fmt: pts },
  purse: { label: 'The drawer', upIsGood: true, steps: [10, 50], fmt: (d) => `${d > 0 ? '+' : '−'}₦${Math.abs(Math.round(d))}bn` },
  'pressure.fuelSupplyStress': { label: 'Fuel scarcity risk', upIsGood: false, steps: [8, 15], fmt: pts },
  'pressure.wageGrievance': { label: 'Labour anger', upIsGood: false, steps: [8, 15], fmt: pts },
  'pressure.scandalHeat': { label: 'Scandal risk', upIsGood: false, steps: [6, 12], fmt: pts },
  'bonus.fiscal': { label: 'Revenue, permanently', upIsGood: true, steps: [0.02, 0.04], fmt: (d) => `${d > 0 ? '+' : '−'}₦${Math.round(Math.abs(d) * 12 * 1000)}bn a year` },
  'bonus.inflation': { label: 'Inflation, permanently', upIsGood: false, steps: [1.5, 3], fmt: (d) => `${pts(d)} pts` },
  ...Object.fromEntries(([['power', 'Power'], ['security', 'Security'], ['capacity', 'State capacity'], ['integrity', 'Integrity'], ['jobs', 'Jobs and industry']] as const).map(([k, label]) =>
    [`bonus.${k}`, { label: `${label}, every year`, upIsGood: true, steps: [0.03, 0.06] as [number, number], fmt: (d: number) => pts(Math.round(d * 12 * 10) / 10) }])),
};

function metaFor(target: string): Meta | null {
  if (META[target]) return META[target];
  const p = target.split('.');
  if (p[0] === 'rival' && RIVAL_BY_ID[p[1]]) return { label: RIVAL_BY_ID[p[1]].name, upIsGood: false, steps: [10, 20], fmt: pts };
  if (p[0] === 'person' && PERSON_BY_ID[p[1]]) return { label: PERSON_BY_ID[p[1]].short, upIsGood: true, steps: [6, 12], fmt: pts };
  if (p[0] === 'zone') {
    const name = ZONE_NAME[p[1] as ZoneId];
    return p[2] === 'security'
      ? { label: `Security, ${name}`, ...index }
      : { label: `Approval, ${name}`, upIsGood: true, steps: [2, 4], fmt: (d) => `${pts(d)} pts` };
  }
  return null;
}

function change(target: string, delta: number): Change | null {
  const m = metaFor(target);
  if (!m || Math.abs(delta) < 1e-6) return null;
  return { label: m.label, delta, good: delta > 0 === m.upIsGood, text: m.fmt(delta) };
}

/** Arrows for a predicted effect: one, two or three by size. */
export function arrows(c: Change, target?: string): string {
  const m = target ? metaFor(target) : Object.values(META).find((x) => x.label === c.label);
  const a = Math.abs(c.delta);
  const n = !m ? 1 : a >= m.steps[1] ? 3 : a >= m.steps[0] ? 2 : 1;
  return (c.delta > 0 ? '▲' : '▼').repeat(n);
}

/** Predicted changes from a list of effects, merged by target. */
export function describe(fx: Fx[]): (Change & { arrows: string })[] {
  const sum: Record<string, number> = {};
  for (const [t, d] of fx) sum[t] = (sum[t] ?? 0) + d;
  const out: (Change & { arrows: string })[] = [];
  for (const [t, d] of Object.entries(sum)) {
    const c = change(t, d);
    if (c) out.push({ ...c, arrows: arrows(c, t) });
  }
  return out;
}

const WATCH = [
  'approval', 'pc', 'nation.inflation', 'nation.petrolPrice', 'nation.fiscalSpace', 'nation.debt',
  'nation.security', 'nation.power', 'nation.capacity', 'nation.integrity', 'nation.jobs',
  ...BLOCS.map((b) => `bloc.${b}`), 'purse',
];

export type Snapshot = Record<string, number>;

export function snapshot(s: GameState): Snapshot {
  const out: Snapshot = { approval: approval(s), pc: s.pc, purse: s.purse };
  for (const k of ['inflation', 'petrolPrice', 'fiscalSpace', 'debt', 'security', 'power', 'capacity', 'integrity', 'jobs'] as const) out[`nation.${k}`] = s.nation[k];
  for (const b of BLOCS) out[`bloc.${b}`] = s.blocs[b];
  return out;
}

const NOISE: Record<string, number> = { 'nation.fiscalSpace': 0.005, 'nation.petrolPrice': 4, approval: 0.25 };

/** What measurably changed between two moments. */
export function diff(before: Snapshot, after: Snapshot): Change[] {
  const out: Change[] = [];
  for (const k of WATCH) {
    const d = (after[k] ?? 0) - (before[k] ?? 0);
    if (Math.abs(d) < (NOISE[k] ?? 0.4)) continue;
    const c = change(k, d);
    if (c) out.push(c);
  }
  return out;
}
