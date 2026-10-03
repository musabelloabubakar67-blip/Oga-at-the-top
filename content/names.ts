import type { Character } from '../engine/types';

// THE NAME REGISTRY
// Every character has an ordinary Nigerian name: a first name and a surname of
// the kind found in the part of the country they come from. Each full name was
// searched on the web before it was used, and none belongs to a politician,
// official, businessman or other public figure. A common name will always be
// shared by private individuals somewhere; that cannot be avoided and is not
// the test. The test is that no reader could take a character for a real
// person in public life.
// Rule: before adding or changing a name, search it. If the search finds a
// public figure, choose another. Parties, newspapers, unions and companies
// keep their invented names.

/** Tokens usable in event text as {TOKEN}. */
export const NAMES: Record<string, string> = {
  SENPRES: 'Distinguished Senator Bala Maigari',
  SPEAKER: 'Rt. Hon. Tayo Adesokan',
  CHAIR: 'Chief Okey Anyadike',
  GOVCHAIR: 'Governor Preye Koroye',
  LABOUR: 'Comrade Sunday Ogbeide',
  OPP: 'Dr Kabiru Malumfashi',
  EDITOR: 'Zainab Bunu',
  ELDER: 'Pa Josiah Ilesanmi',
  NSA: 'Maj. Gen. Danjuma Zakari (rtd)',
  INFO: 'Hon. Deji Olatunbosun',
  CBN: 'Dr Hauwa Gumel',
  SPECIAL: 'Hon. Titus Agbo',
  EDU: 'Prof. Angela Ezeani',
  POWERMIN: 'Engr. Chidi Ogbuagu',
  WORKS: 'Engr. Lanre Oyelaran',
  LABMIN: 'Barr. Ifeanyi Nwadike',
  AIDE: 'Mr Jide Ajibade',
  COUSIN: 'Cousin Friday',
  CONTRACTOR: 'Trust-Me Global Resources Limited',
  UNION: "Nigeria Workers' Front",
  ACADEMICS: "Senior Academics' Union",
  DOCTORS: 'Association of Resident Physicians',
  OPPARTY: "People's Alternative Movement",
  CHRONICLE: 'The Federal Chronicle',
  STREET: 'Street Gist',
  PENSIONS: 'National Pensions Verification Board',
  FEEDING: 'Rural Schools Nutrition Agency',
  AIRLINE: 'Air Naija Pride',
};

export const DEFAULT_PARTY = { name: 'Progressive Stakeholders Congress', short: 'PSC' };

type Seed = Omit<Character, 'rel' | 'notes'>;

export const CAST: Seed[] = [
  {
    id: 'cos', role: 'Chief of Staff', name: 'Alhaji Musa Dantsoho', short: 'Dantsoho',
    competence: 3, clout: 3, loyalty: 4, integrity: 3,
  },
  {
    id: 'sap', role: 'Special Adviser, Political Matters', name: 'Otunba Kola Fadahunsi', short: 'Fadahunsi',
    competence: 4, clout: 2, loyalty: 4, integrity: 3,
  },
  { id: 'nsa', role: 'National Security Adviser', name: NAMES.NSA, short: 'Zakari', competence: 3, clout: 3, loyalty: 3, integrity: 3 },
  { id: 'info', role: 'Minister of Information', name: NAMES.INFO, short: 'Olatunbosun', competence: 2, clout: 2, loyalty: 5, integrity: 3 },
  { id: 'labmin', role: 'Minister of Labour', name: NAMES.LABMIN, short: 'Nwadike', competence: 3, clout: 2, loyalty: 3, integrity: 3 },
  { id: 'edu', role: 'Minister of Education', name: NAMES.EDU, short: 'Ezeani', competence: 2, clout: 2, loyalty: 4, integrity: 3 },
  { id: 'power', role: 'Minister of Power', name: NAMES.POWERMIN, short: 'Ogbuagu', competence: 3, clout: 2, loyalty: 3, integrity: 3 },
];

export const FINANCE_CANDIDATES: Seed[] = [
  {
    id: 'fin', role: 'Minister of Finance', name: 'Dr Halima Gwarzo', short: 'Gwarzo',
    competence: 5, clout: 1, loyalty: 3, integrity: 5, zone: 'NE',
    blurb: 'Development economist, twenty years abroad. Reputation: brilliant, blunt, and unknown to the party. Nobody sponsored her.',
  },
  {
    id: 'fin', role: 'Minister of Finance', name: 'Chief Benson Ekpenyong', short: 'Ekpenyong',
    competence: 2, clout: 5, loyalty: 3, integrity: 1, zone: 'SS', patron: 'gov_ss', rep: { competence: 2, loyalty: 5 },
    blurb: 'Party treasurer through three election cycles. Reputation: generous, connected, loyal to whoever is in the chair. Sponsored by the Governors\' Forum.',
  },
  {
    id: 'fin', role: 'Minister of Finance', name: 'Senator Ezekiel Lohor', short: 'Lohor',
    competence: 3, clout: 4, loyalty: 3, integrity: 2, zone: 'NC', patron: 'self',
    blurb: 'Two-time minister, one-time governor, back again. Reputation: knows where every file is buried. The Senate will ask him to take a bow and go.',
  },
];
