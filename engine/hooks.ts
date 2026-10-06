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
};
