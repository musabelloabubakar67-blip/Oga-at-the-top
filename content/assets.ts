import type { Fx } from '../engine/types';

// WHAT BIG BETS LEAVE BEHIND
// A bet that builds something is built somewhere. The President picks the state
// when it is launched. If it works, it becomes an asset that runs every month
// under a manager the President appoints: it earns or costs money, does
// something for the country, and lifts the state it stands in. A manager who
// serves someone else captures it, as with institutions. If it fails, the site
// is left standing in that state, and the state remembers.

export interface AssetDef {
  /** Where it can be built. */
  sites: string[];
  /** ₦tn a month at a manager of ordinary competence. Negative is upkeep. */
  fiscal: number;
  /** Every month, at a manager of ordinary competence. */
  fx: Fx[];
  /** What it is called once it runs. */
  name: string;
}

export const ASSETS: Record<string, AssetDef> = {
  steel: { name: 'The steel complex', sites: ['KO', 'DE', 'ED'], fiscal: 0.01, fx: [['nation.jobs', 0.03]] },
  charter: { name: 'The charter city', sites: ['LA', 'OG', 'AK', 'CR', 'DE'], fiscal: 0.012, fx: [['nation.jobs', 0.04]] },
  cannabis: { name: 'The licensed cannabis farms', sites: ['ON', 'ED', 'OS', 'EK'], fiscal: 0.008, fx: [['nation.jobs', 0.01]] },
  lithium: { name: 'The lithium refinery', sites: ['NA', 'KW', 'EK', 'KO'], fiscal: 0.015, fx: [['nation.jobs', 0.02]] },
  rail: { name: 'The high-speed rail line and its depot', sites: ['LA', 'KN', 'KD', 'OY', 'KW', 'NI'], fiscal: -0.006, fx: [['nation.jobs', 0.03], ['nation.capacity', 0.01]] },
  nuclear: { name: 'The nuclear power station', sites: ['KO', 'AK', 'NI'], fiscal: -0.004, fx: [['nation.power', 0.05]] },
  games: { name: 'The games village and stadiums', sites: ['LA', 'FC', 'RI', 'KN', 'OY'], fiscal: -0.008, fx: [['bloc.street', 0.01]] },
  export_power: { name: 'The export interconnector', sites: ['NI', 'KB', 'OY', 'BO'], fiscal: 0.012, fx: [] },
  smelter: { name: 'The aluminium smelter', sites: ['AK', 'CR', 'RI'], fiscal: 0.015, fx: [['nation.jobs', 0.02]] },
  gold: { name: 'The licensed gold fields', sites: ['ZA', 'NI', 'OS', 'KB', 'KT'], fiscal: 0.02, fx: [] },
  hub: { name: 'The free-trade hub', sites: ['LA', 'OG'], fiscal: 0.015, fx: [['nation.jobs', 0.02]] },
  rice: { name: 'The rice export belt', sites: ['KB', 'JI', 'NI', 'EB', 'KN', 'BE'], fiscal: 0.004, fx: [['nation.jobs', 0.03], ['nation.inflation', -0.02]] },
  wheat: { name: 'The wheat irrigation scheme', sites: ['KN', 'JI', 'KT', 'SO', 'BA'], fiscal: 0.002, fx: [['nation.jobs', 0.02], ['nation.inflation', -0.02]] },
  car: { name: 'The people\'s car plant', sites: ['AN', 'OG', 'KN', 'LA', 'KD'], fiscal: 0.005, fx: [['nation.jobs', 0.04]] },
  petrochem: { name: 'The petrochemicals complex', sites: ['DE', 'RI', 'AK', 'LA'], fiscal: 0.02, fx: [['nation.jobs', 0.02]] },
  hospital: { name: 'The hospital city', sites: ['FC', 'LA', 'EN', 'KN'], fiscal: -0.003, fx: [['bloc.press', 0.01]] },
  coastal: { name: 'The coastal highway', sites: ['LA', 'OG', 'ON', 'DE', 'BY', 'RI', 'AK', 'CR'], fiscal: -0.002, fx: [['nation.jobs', 0.02]] },
};
