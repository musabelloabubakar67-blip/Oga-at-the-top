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
  /** What it adds to the armed forces each month at full output (plan 13): readiness points, backlog cleared,
   *  share of the dollar shortage covered, intelligence points. */
  military?: { readiness?: number; depots?: number; spares?: number; intel?: number };
  /** What it is connected to (plan 14.A6): any of these built makes it run better, since goods, inputs or people can reach it. */
  with?: { ids: string[]; why: string };
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
  // The armed forces (plan 13): what each military asset adds every month at full output.
  depots: { military: { depots: 1.6, readiness: 4 }, does: 'Clears the maintenance backlog every month, so the forces have more of what they already own.' },
  fleetrepair: { military: { spares: 0.45, readiness: 6 }, does: 'Spares bought on a schedule: a weak naira or thin reserves ground half as many aircraft.' },
  fusion: { military: { intel: 15 }, does: 'Better intelligence for every mission: fewer mistakes, less harm to civilians.' },
  corridor_ops: { does: 'Keeps the roads of the farm belt open all year: the threat falls a little every month and food reaches the markets.' },
  ddr: { does: 'Fighters who leave the bush have somewhere to go: violence in the North East feeds less on itself, for as long as the camps are funded.' },
};

// What connects to what (plan 14.A6): a port needs a corridor out of it, a plant needs its inputs.
const LINKS: Record<string, { ids: string[]; why: string }> = {
  hub: { ids: ['rail', 'coastal'], why: 'Cargo leaves the port by rail or the coastal highway instead of waiting nine days on the road' },
  rice: { ids: ['rail', 'corridor_ops'], why: 'The harvest reaches the cities on a guarded road or the railway' },
  wheat: { ids: ['rail', 'corridor_ops'], why: 'The grain reaches the mills on a guarded road or the railway' },
  car: { ids: ['steel'], why: 'Body panels from domestic steel' },
  petrochem: { ids: ['refinery', 'refinery_delta', 'refinery_kaduna'], why: 'Feedstock from a working refinery' },
  smelter: { ids: ['nuclear', 'export_power'], why: 'Power that does not fail on the pot lines' },
  charter: { ids: ['hub', 'coastal'], why: 'A port and a highway for the firms in the zone' },
  coastal: { ids: ['hub'], why: 'A port at the end of the road' },
  steel: { ids: ['rail'], why: 'Ore and coal by rail' },
  hospital: { ids: ['fusion'], why: '' },
};
for (const [id, link] of Object.entries(LINKS)) if (ASSET_SYSTEMS[id] && link.why) ASSET_SYSTEMS[id].with = link;
