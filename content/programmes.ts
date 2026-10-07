// THE PARTY'S PROGRAMME (plan 02.A5)
// A party is more than its name: it stands for something, speaks for some people
// more than others, and came to power on an agreement with someone. The
// programme sets which groups regard the government as theirs, shifts the blocs
// a little, and binds a coalition agreement that is judged on the register.
// The programmes are generic positions, not portraits of any real party.

import type { Cond, Fx } from '../engine/types';

export interface Programme {
  id: string;
  name: string;
  text: string;
  /** Groups (content/society.ts) who regard the programme as speaking for them. */
  constituencies: import('./citizens').Group[];
  fx: Fx[];
  agreement: { with: string; text: string; afterMonths: number; verify: Cond; judgedBy: string };
}

export const PROGRAMMES: Programme[] = [
  {
    id: 'enterprise', name: 'Enterprise and open markets', text: 'Private investment, open trade and a smaller state that pays its bills.',
    constituencies: ['manufacturer', 'importer', 'graduate'],
    fx: [['bloc.establishment', 3], ['bloc.street', -1]],
    agreement: { with: 'the chambers of commerce', text: 'No rise in VAT for the first two years.', afterMonths: 24, verify: { v: ['ordered.tax', '==', 0] }, judgedBy: 'Judged by whether VAT is raised before the date.' },
  },
  {
    id: 'labour', name: 'Wages, prices and public services', text: 'Fair pay, affordable food and services that work, paid for by those who can.',
    constituencies: ['salaried', 'transport', 'health', 'pensioner'],
    fx: [['bloc.street', 3], ['bloc.establishment', -2]],
    agreement: { with: 'the labour movement', text: 'Pension arrears cleared within two years.', afterMonths: 24, verify: { v: ['debt.pensions', '<', 0.2] }, judgedBy: 'Judged by the pension arrears on the date.' },
  },
  {
    id: 'federal', name: 'Power to the states', text: 'More money and responsibility for the states, and less for Abuja.',
    constituencies: ['farmer', 'fisher', 'trader'],
    fx: [['bloc.party', 2], ['bloc.villa', -1]],
    agreement: { with: 'the governors', text: 'A first federation reform delivered within the term.', afterMonths: 48, verify: { v: ['tracks.r', '>=', 1] }, judgedBy: 'Judged by whether a federation reform is delivered by the end of the term.' },
  },
];

export const PROGRAMME_BY_ID: Record<string, Programme> = Object.fromEntries(PROGRAMMES.map((p) => [p.id, p]));
