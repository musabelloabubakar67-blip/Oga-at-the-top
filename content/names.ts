import type { Character } from '../engine/types';

// THE NAME REGISTRY
// Every name in the game is a parody name: a real-sounding honorific and first
// name attached to a surname that is a word from political life. Nobody is
// called Protocol, Structure or Bow-and-Go, so none of these can be anyone.
// Rule: never parody a specific real person's name, nickname or title.

/** Tokens usable in event text as {TOKEN}. */
export const NAMES: Record<string, string> = {
  SENPRES: 'Distinguished Senator Bala Bow-and-Go',
  SPEAKER: 'Rt. Hon. Tayo Point-of-Order',
  CHAIR: 'Chief Okey Structure',
  GOVCHAIR: 'Governor Preye Allocation',
  LABOUR: 'Comrade Sunday Aluta',
  OPP: 'Dr Kabiru Alternative',
  EDITOR: 'Zainab Receipts',
  ELDER: 'Pa Josiah Communiqué',
  NSA: 'Maj. Gen. D. D. Situation (rtd)',
  INFO: 'Hon. Deji Clarification',
  CBN: 'Dr Hauwa Basis-Point',
  SPECIAL: 'Hon. Titus Workshop',
  EDU: 'Prof. Angela Fruitful',
  POWERMIN: 'Engr. Chidi Megawatt',
  WORKS: 'Engr. Lanre Almost-Complete',
  LABMIN: 'Barr. Ifeanyi Tripartite',
  AIDE: 'Mr Jide Handle',
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
    id: 'cos', role: 'Chief of Staff', name: 'Alhaji Musa Protocol', short: 'Protocol',
    competence: 3, clout: 3, loyalty: 4, integrity: 3,
  },
  {
    id: 'sap', role: 'Special Adviser, Political Matters', name: 'Otunba Kola Radar', short: 'Radar',
    competence: 4, clout: 2, loyalty: 4, integrity: 3,
  },
  { id: 'nsa', role: 'National Security Adviser', name: NAMES.NSA, short: 'Situation', competence: 3, clout: 3, loyalty: 3, integrity: 3 },
  { id: 'info', role: 'Minister of Information', name: NAMES.INFO, short: 'Clarification', competence: 2, clout: 2, loyalty: 5, integrity: 3 },
  { id: 'labmin', role: 'Minister of Labour', name: NAMES.LABMIN, short: 'Tripartite', competence: 3, clout: 2, loyalty: 3, integrity: 3 },
  { id: 'edu', role: 'Minister of Education', name: NAMES.EDU, short: 'Fruitful', competence: 2, clout: 2, loyalty: 4, integrity: 3 },
  { id: 'power', role: 'Minister of Power', name: NAMES.POWERMIN, short: 'Megawatt', competence: 3, clout: 2, loyalty: 3, integrity: 3 },
];

export const FINANCE_CANDIDATES: Seed[] = [
  {
    id: 'fin', role: 'Minister of Finance', name: 'Dr Halima Spreadsheet', short: 'Spreadsheet',
    competence: 5, clout: 1, loyalty: 3, integrity: 5, zone: 'NE',
    blurb: 'Development economist, twenty years abroad. Reputation: brilliant, blunt, and unknown to the party. Nobody sponsored her.',
  },
  {
    id: 'fin', role: 'Minister of Finance', name: 'Chief Benson Chop-Remain', short: 'Chop-Remain',
    competence: 2, clout: 5, loyalty: 5, integrity: 1, zone: 'SS',
    blurb: 'Party treasurer through three election cycles. Reputation: generous, connected, loyal to whoever is in the chair. Sponsored by the Governors\' Forum.',
  },
  {
    id: 'fin', role: 'Minister of Finance', name: 'Senator Ezekiel Turn-By-Turn', short: 'Turn-By-Turn',
    competence: 3, clout: 4, loyalty: 3, integrity: 2, zone: 'NC',
    blurb: 'Two-time minister, one-time governor, back again. Reputation: knows where every file is buried. The Senate will ask him to take a bow and go.',
  },
];
