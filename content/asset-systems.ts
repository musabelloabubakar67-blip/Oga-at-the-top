// WHAT EACH OPERATING ASSET CHANGES (plan 12)
// Beyond its earnings and its record, each asset feeds one particular system,
// in proportion to how well it actually runs (its manager, its condition, its
// security, how much of it was built). The numbers are monthly at full output.
//
// dollars:   $bn a month earned abroad (exports, tourism, investment) — the dollar flow.
// imports:   $bn a month of imports it replaces — the dollar flow.
// reserves:  $bn a month added to the central bank's reserves (gold bought into them).
// buildCut:  share off the cost of every new infrastructure project (domestic steel).
// obligation: a condition it must meet at home before it may earn abroad.

import type { Cond } from '../engine/types';

export interface AssetSystem {
  dollars?: number;
  imports?: number;
  reserves?: number;
  buildCut?: number;
  obligation?: { when: Cond; text: string };
  /** What it changes, in one line, for the asset card. */
  does: string;
}

export const ASSET_SYSTEMS: Record<string, AssetSystem> = {
  refinery: { imports: 0.15, does: 'Replaces petrol bought abroad: half the country\'s imports at full output. Its crude comes through the creeks.' },
  refinery_delta: { imports: 0.06, does: 'Replaces a fifth of the petrol bought abroad. Its crude comes through the creeks.' },
  refinery_kaduna: { imports: 0.04, does: 'Replaces a seventh of the petrol bought abroad. Its crude crosses two theatres to reach it.' },
  steel: { buildCut: 0.08, imports: 0.02, does: 'Every new road, rail line and plant is built with domestic steel: infrastructure costs 8% less.' },
  lithium: { dollars: 0.03, does: 'Refined lithium sold abroad, in dollars.' },
  smelter: { dollars: 0.035, does: 'Aluminium sold abroad, in dollars.' },
  export_power: { dollars: 0.04, obligation: { when: { v: ['nation.power', '>=', 45] }, text: 'The contracts oblige the country to supply itself first: while power at home is below 45, nothing is exported.' }, does: 'Electricity sold to the neighbours in dollars, once the country itself is supplied.' },
  gold: { reserves: 0.05, does: 'Gold bought from licensed miners into the central bank\'s reserves, valued at the world price.' },
  hospital: { imports: 0.02, does: 'Treatment that people used to fly abroad for: dollars that no longer leave.' },
  rail: { imports: 0.01, does: 'Freight by rail instead of imported diesel and trucks; farm produce reaches city markets for less.' },
  coastal: { does: 'Opens the coastal states to markets: jobs along the route and cheaper goods in the ports.' },
  hub: { dollars: 0.02, does: 'Re-exports and transit trade, paid in dollars.' },
  rice: { dollars: 0.015, imports: 0.01, does: 'Rice the country no longer imports, and some it sells abroad.' },
  wheat: { imports: 0.02, does: 'Wheat the country no longer imports.' },
  car: { imports: 0.02, does: 'Cars assembled at home instead of bought abroad.' },
  petrochem: { dollars: 0.03, does: 'Fertiliser and plastics sold abroad, and fertiliser cheap enough for farmers at home.' },
  cannabis: { dollars: 0.01, does: 'Licensed medical cannabis sold abroad.' },
  charter: { dollars: 0.02, does: 'Investment from abroad into firms that register in the charter city.' },
  games: { dollars: 0.005, does: 'Visitors and broadcasting rights, paid in dollars.' },
  nuclear: { does: 'Electricity on the grid that does not depend on gas.' },
};
