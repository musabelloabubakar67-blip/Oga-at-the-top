// WHERE PEOPLE STAND ON THE ISSUES (plan 06.A1)
// Each governor and senator has positions on particular issues, by reform track,
// from -2 (will fight it) to +2 (will carry it), and a project of their own that
// they pursue whatever their mood. General warmth towards the President moves a
// vote at the margin; a position moves it more. Unlisted issues are 0: no view
// that a deal or a mood cannot settle.

import type { ZoneId } from '../engine/types';

export interface Stance {
  /** Where their votes come from. Senators lead blocs; this is the zone their bloc answers to. */
  seat: ZoneId;
  positions: Partial<Record<string, -2 | -1 | 0 | 1 | 2>>;
  /** What they are building, and will trade their vote for. */
  project: string;
  /** The concession they value most in any negotiation. */
  prefers: ConcessionKind;
}

export type ConcessionKind = 'geography' | 'revenue' | 'date' | 'oversight' | 'appointment';

export const CONCESSIONS: Record<ConcessionKind, { name: string; text: string; cost: string }> = {
  geography: { name: 'First sites in their zone', text: 'The first projects, offices or pilots under the law go to their zone.', cost: 'Other zones notice: a little approval elsewhere.' },
  revenue: { name: 'A share for the states', text: 'A share of what the law raises or saves goes to the states for two years.', cost: '₦20bn a month from the treasury for two years.' },
  date: { name: 'A later start', text: 'The law passes now; its main provisions take effect six months later.', cost: 'Six months before the benefits arrive.' },
  oversight: { name: 'A joint oversight committee', text: 'An Assembly committee oversees implementation and holds hearings.', cost: 'Hearings cost a little capital each month for a year; integrity improves.' },
  appointment: { name: 'They name the board chair', text: 'They nominate who chairs the body the law creates.', cost: 'Integrity falls: the chair is theirs, not the law\'s.' },
};

export const STANCES: Record<string, Stance> = {
  gov_nw: { seat: 'NW', positions: { tax: -2, federation: -1, food: 2, security: 2, clean: -1 }, project: 'an irrigation scheme for the dry-season farmers in the state', prefers: 'geography' },
  gov_ne: { seat: 'NE', positions: { security: 2, schools: 2, people: 1, federation: 1 }, project: 'rebuilding the schools that were burnt', prefers: 'revenue' },
  gov_nc: { seat: 'NC', positions: { treasury: -1, tax: -1, federation: 2, order: 1 }, project: 'clearing the arrears owed to state workers', prefers: 'revenue' },
  gov_sw: { seat: 'SW', positions: { power: 2, industry: 2, digital: 2, federation: 2, clean: -1 }, project: 'a deep-sea port and the rail line to it', prefers: 'geography' },
  gov_se: { seat: 'SE', positions: { federation: 2, justice: 1, clean: 1, order: -1 }, project: 'a fair share of federal appointments for the zone, counted', prefers: 'appointment' },
  gov_ss: { seat: 'SS', positions: { federation: 2, tax: -1, power: 1, order: -1 }, project: 'a larger share of oil revenue for the producing states', prefers: 'revenue' },
  sen_pres: { seat: 'NW', positions: { clean: -2, justice: -1, tax: -1, order: 1 }, project: 'control of which bills reach the floor', prefers: 'appointment' },
  sen_lead: { seat: 'SE', positions: { power: 1, treasury: 1, digital: 1, people: 1 }, project: 'a reputation for passing the government\'s programme', prefers: 'date' },
  sen_approp: { seat: 'NC', positions: { treasury: -2, tax: 1, clean: -1, federation: 1 }, project: 'members\' projects in every budget', prefers: 'revenue' },
  sen_rebel: { seat: 'SS', positions: { clean: 2, justice: 2, order: -2, security: -1, digital: 1 }, project: 'an anti-corruption record that the government cannot ignore', prefers: 'oversight' },
};

export const ISSUE_NAME: Record<string, string> = {
  power: 'electricity', security: 'security', tax: 'tax', treasury: 'public money', clean: 'corruption', food: 'food and farming',
  industry: 'industry', digital: 'digital government', people: 'health and welfare', schools: 'schools', federation: 'the federation and revenue sharing',
  order: 'public order', justice: 'the courts', resources: 'oil and resources', cities: 'cities', service: 'the civil service', welfare: 'welfare', works: 'works',
};
