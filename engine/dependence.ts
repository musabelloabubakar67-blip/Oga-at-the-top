// How much of the government's money comes from oil. Diversifying does not make
// oil a minor source: at best a President moves it from three quarters of the
// budget to under half. But a budget that leans less on oil feels its price
// less, in both directions, and earns points to spend from what is taxed at home.
// The figure is worked out each month from its causes, so it can slip back.

import type { GameState } from './types';
import { clamp } from './vars';

export interface DepLine { label: string; value: number; hint: string }

/** Reforms that build revenue or dollars outside oil, and by how many points each lowers dependence. */
export const DIVERSIFIERS: Record<string, number> = {
  t1: 3, t3: 3, t5: 2, i1: 2, i2: 1, i4: 3, d2: 1, d3: 1, f5: 2, w3: 1,
  g1: 3, g2: 3, g4: 5, g6: 2, g7: 3,
  i6: 1, i7: 2, i8: 1, i9: 1, i10: 1, d9: 2, d10: 1, f8: 1, f10: 2, w9: 1, u7: 1, j3: 1,
  g8: 3, g9: 2, g10: 2, g11: 2, g12: 1, t10: 1,
};

const START = 75;

export function dependence(s: GameState): { v: number; lines: DepLine[] } {
  const n = s.nation;
  const lines: DepLine[] = [];
  const add = (label: string, value: number, hint: string) => { if (Math.abs(value) >= 0.5) lines.push({ label, value, hint }); };
  add('Taxes collected at home', -(n.capacity - 34) * 0.18, 'A state that can collect what it is owed needs oil less.');
  add('Factories, farms and payrolls', -(n.jobs - 34) * 0.2, 'Every business that grows is a taxpayer that is not a barrel.');
  add('Oil output', (s.oil.output - 1.75) * 12, 'More barrels make oil a bigger share; theft in the creeks makes it smaller, for the wrong reason.');
  const reforms = s.agenda.done.reduce((a, id) => a + (DIVERSIFIERS[id] ?? 0), 0);
  add('Reforms that earn outside oil', -reforms, 'Tax reforms, export industries, minerals, gas and the sale of oil stakes.');
  const built = (id: string) => (s.institutions ?? []).some((i) => i.id === id);
  add('Institutions that earn', -((built('tax') ? 3 : 0) + (built('zone') ? 2 : 0)), 'The large-taxpayer office and the economic zone.');
  const v = clamp(START + lines.reduce((a, l) => a + l.value, 0), 35, 85);
  return { v, lines };
}

/** How hard the oil price hits the budget, against the 75% the game starts at. */
export function oilWeight(s: GameState): number {
  return dependence(s).v / START;
}

/** Budget points earned from revenue that is not oil: one for every ten points below where the country started. */
export function nonOilPoints(s: GameState): number {
  return Math.max(0, Math.floor((START - dependence(s).v) / 10));
}

/** Dollars a month from exports that are not oil, beyond what jobs already earn. */
export function nonOilDollars(s: GameState): number {
  return Math.max(0, START - dependence(s).v) * 0.01;
}
