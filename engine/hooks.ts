// Late-bound links between engine modules that import each other in a cycle.
// This module imports nothing, so it is always initialised first; a module
// lower in the chain installs its function here, and one higher up calls it.

import type { GameState } from './types';

export type AssetTrade = { dollars: number; imports: number; reserves: number; buildCut: number; blocked?: string };

export const hooks = {
  /** Share taken off infrastructure by domestic steel (engine/places.ts). */
  buildCut: (_s: GameState): number => 0,
  /** What one operating asset does to the dollar flow and the reserves (engine/places.ts). */
  assetSystem: (_s: GameState, _id: string): AssetTrade => ({ dollars: 0, imports: 0, reserves: 0, buildCut: 0 }),
  /** What the military's missions cost the treasury this month (engine/military.ts). */
  missionCost: (_s: GameState): number => 0,
  /** Readings of the armed forces for conditions: readiness, intel, conduct, cooperation.<zone>, competence.<post> (engine/military.ts). */
  military: (_s: GameState, _path: string[]): number => 0,
  /** Readings of groups, services and development for conditions: group.<id>, svc.<dim>, assets.industry (engine/society.ts). */
  society: (_s: GameState, _path: string[]): number => 0,
  /** Where a reform stands, what it would take from the treasury, and a launch on a minister's delegated authority (engine/reduce.ts). */
  milestoneStatus: (_s: GameState, _id: string): string => 'hidden',
  launchMoney: (_s: GameState, _id: string): number => 0,
  /** Launches without the President's capital; returns why it cannot, or null. */
  launchDelegated: (_s: GameState, _id: string): string | null => 'Not available.',
};
