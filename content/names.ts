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

/**
 * Who can be brought in to replace an adviser. The President sees the reputation;
 * the truth is in the traits, and shows in their record once they start advising.
 */
export const ADVISER_POOL: Seed[] = [
  { id: 'pool', role: '', name: 'Dr Nkechi Obidike', short: 'Obidike', competence: 4, clout: 1, loyalty: 3, integrity: 5, patron: 'president',
    blurb: 'Fifteen years in the civil service\'s policy unit. Said to be able, careful, nobody\'s protégé.' },
  { id: 'pool', role: '', name: 'Alhaji Sani Dankani', short: 'Dankani', competence: 2, clout: 3, loyalty: 3, integrity: 2, patron: 'gov_nw', rep: { competence: 3, loyalty: 5 },
    blurb: 'Party organiser in the North West for two elections. Said to be tireless, and devoted to whoever is President.' },
  { id: 'pool', role: '', name: 'Mrs Funmi Akinwale', short: 'Akinwale', competence: 3, clout: 2, loyalty: 4, integrity: 4, patron: 'president',
    blurb: 'Former editor of a Lagos daily. Said to be shrewd about the press, honest about bad news.' },
  { id: 'pool', role: '', name: 'Mr Ibrahim Gwadabe', short: 'Gwadabe', competence: 4, clout: 2, loyalty: 2, integrity: 2, patron: 'self', rep: { competence: 4, loyalty: 4 },
    blurb: 'Retired permanent secretary. Said to be knows where every file is, and how to make it move.' },
  { id: 'pool', role: '', name: 'Barr. Uche Nwankwor', short: 'Nwankwor', competence: 4, clout: 2, loyalty: 2, integrity: 3, patron: 'ty_bank', rep: { competence: 4, loyalty: 4 },
    blurb: 'Commercial lawyer with clients in every boardroom. Said to be brilliant, discreet, available at short notice.' },
  { id: 'pool', role: '', name: 'Mallam Hassan Gidado', short: 'Gidado', competence: 3, clout: 1, loyalty: 5, integrity: 4, patron: 'president', rep: { competence: 2, loyalty: 5 },
    blurb: 'Ran the campaign\'s policy desk at twenty-nine. Said to be loyal to a fault, and young for the job.' },
];

/** Advisers who can be replaced from the pool. The Finance Minister and the two who are also ministers have their own routes. */
export const REPLACEABLE = ['cos', 'sap', 'info', 'labmin', 'edu'];

