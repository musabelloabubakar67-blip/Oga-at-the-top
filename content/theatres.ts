import type { ZoneId } from '../engine/types';

// SECURITY, BY THEATRE
// One named threat in each zone. The national security figure is the weighted
// picture across all six. Each has its own cause and its own cost, so "security"
// is six problems, not one number.

export interface TheatreDef {
  zone: ZoneId;
  name: string;
  start: number;
  blurb: string;
  /** What it costs the country while it is bad. */
  costs: string;
  /** What moves it. */
  driver: string;
}

export const THEATRES: TheatreDef[] = [
  {
    zone: 'NW', name: 'Banditry and kidnapping for ransom', start: 71,
    blurb: 'Armed gangs in the forests tax villages, close roads and take schoolchildren.',
    costs: 'Farmers pay a levy to plant and another to harvest. With the farm belt, it sets the price of food.',
    driver: 'Recruits best when cost-of-living pressure is above 55; state police absorb part of that. Forward bases, local courts and paid troops hold it down every month.',
  },
  {
    zone: 'NE', name: 'The insurgency', start: 73,
    blurb: 'Fifteen years old. Two million people are still unable to go home.',
    costs: 'The war is a charge on the treasury every month it stays above 50.',
    driver: 'Eases with reconstruction, paid troops and police posts. Worsens quickly when the government runs out of money.',
  },
  {
    zone: 'NC', name: 'Violence in the farm belt', start: 68,
    blurb: 'Night attacks on farming communities. Whole districts no longer plant.',
    costs: 'The largest single driver of food prices in the country.',
    driver: 'Worst in the planting months, April to July, unless planting is secured. Rises with hardship, less so with state police. Forward bases and local courts hold it down.',
  },
  {
    zone: 'SW', name: 'Highway kidnapping and city gangs', start: 50,
    blurb: 'The commercial capital and the roads into it.',
    costs: 'Investors read these headlines. Above 60 the establishment cools every month.',
    driver: 'Follows work: it falls as jobs and industry rise above 38, and climbs when they fall. State police and local courts help.',
  },
  {
    zone: 'SE', name: 'Separatist agitation and the sit-at-home', start: 60,
    blurb: 'Markets shut every Monday on the orders of people nobody elected.',
    costs: 'Above 55, jobs and industry fall every month.',
    driver: 'Political, not military. It follows how the South East feels about you: approval there above 48 eases it. An offensive here does half the work and costs approval.',
  },
  {
    zone: 'SS', name: 'Oil theft and pipeline sabotage', start: 57,
    blurb: 'A fifth of the country\'s crude leaves through somebody else\'s hose.',
    costs: 'Every stolen barrel is revenue lost. Oil output falls as this rises, and the budget with it.',
    driver: 'Rises as integrity falls below 32. Metered terminals and a working amnesty hold it down.',
  },
];

export const THEATRE_BY_ZONE = Object.fromEntries(THEATRES.map((t) => [t.zone, t])) as Record<ZoneId, TheatreDef>;
