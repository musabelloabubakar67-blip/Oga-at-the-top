import type { ZoneId } from '../engine/types';

export interface StateData {
  id: string;
  name: string;
  zone: ZoneId;
  /** Registered voters in millions. Approximate, rounded from the public register; refresh before release. */
  voters: number;
}

export const STATES: StateData[] = [
  { id: 'JI', name: 'Jigawa', zone: 'NW', voters: 2.35 },
  { id: 'KD', name: 'Kaduna', zone: 'NW', voters: 4.34 },
  { id: 'KN', name: 'Kano', zone: 'NW', voters: 5.92 },
  { id: 'KT', name: 'Katsina', zone: 'NW', voters: 3.52 },
  { id: 'KB', name: 'Kebbi', zone: 'NW', voters: 2.03 },
  { id: 'SO', name: 'Sokoto', zone: 'NW', voters: 2.17 },
  { id: 'ZA', name: 'Zamfara', zone: 'NW', voters: 1.93 },

  { id: 'AD', name: 'Adamawa', zone: 'NE', voters: 2.2 },
  { id: 'BA', name: 'Bauchi', zone: 'NE', voters: 2.75 },
  { id: 'BO', name: 'Borno', zone: 'NE', voters: 2.51 },
  { id: 'GO', name: 'Gombe', zone: 'NE', voters: 1.58 },
  { id: 'TA', name: 'Taraba', zone: 'NE', voters: 2.02 },
  { id: 'YO', name: 'Yobe', zone: 'NE', voters: 1.49 },

  { id: 'BE', name: 'Benue', zone: 'NC', voters: 2.78 },
  { id: 'KO', name: 'Kogi', zone: 'NC', voters: 1.93 },
  { id: 'KW', name: 'Kwara', zone: 'NC', voters: 1.7 },
  { id: 'NA', name: 'Nasarawa', zone: 'NC', voters: 1.9 },
  { id: 'NI', name: 'Niger', zone: 'NC', voters: 2.7 },
  { id: 'PL', name: 'Plateau', zone: 'NC', voters: 2.79 },
  { id: 'FC', name: 'FCT', zone: 'NC', voters: 1.57 },

  { id: 'EK', name: 'Ekiti', zone: 'SW', voters: 0.99 },
  { id: 'LA', name: 'Lagos', zone: 'SW', voters: 7.06 },
  { id: 'OG', name: 'Ogun', zone: 'SW', voters: 2.69 },
  { id: 'ON', name: 'Ondo', zone: 'SW', voters: 1.99 },
  { id: 'OS', name: 'Osun', zone: 'SW', voters: 1.95 },
  { id: 'OY', name: 'Oyo', zone: 'SW', voters: 3.28 },

  { id: 'AB', name: 'Abia', zone: 'SE', voters: 2.12 },
  { id: 'AN', name: 'Anambra', zone: 'SE', voters: 2.66 },
  { id: 'EB', name: 'Ebonyi', zone: 'SE', voters: 1.6 },
  { id: 'EN', name: 'Enugu', zone: 'SE', voters: 2.11 },
  { id: 'IM', name: 'Imo', zone: 'SE', voters: 2.42 },

  { id: 'AK', name: 'Akwa Ibom', zone: 'SS', voters: 2.36 },
  { id: 'BY', name: 'Bayelsa', zone: 'SS', voters: 1.06 },
  { id: 'CR', name: 'Cross River', zone: 'SS', voters: 1.77 },
  { id: 'DE', name: 'Delta', zone: 'SS', voters: 3.22 },
  { id: 'ED', name: 'Edo', zone: 'SS', voters: 2.5 },
  { id: 'RI', name: 'Rivers', zone: 'SS', voters: 3.54 },
];

export const STATE_BY_ID: Record<string, StateData> = Object.fromEntries(STATES.map((s) => [s.id, s]));
