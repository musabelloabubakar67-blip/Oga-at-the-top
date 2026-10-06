import type { ZoneId } from '../engine/types';

// THE TALENT POOL
// Everyone who could be appointed to anything: a ministry, an adviser's desk, the
// head of an institution, the manager of an asset. People are generated from
// ordinary first names and surnames of each region. Well-known political and
// business family names are left out on purpose. Every person has a speciality,
// and a file that is not always the truth.

export type Spec = 'economics' | 'security' | 'law' | 'administration' | 'engineering' | 'politics' | 'media';

export const SPEC_NAME: Record<Spec, string> = {
  economics: 'economist', security: 'security professional', law: 'lawyer', administration: 'administrator',
  engineering: 'engineer', politics: 'politician', media: 'communications professional',
};

/** Honorifics by speciality: the first that fits the person's sex is used. */
export const TITLES: Record<Spec, { m: string[]; f: string[] }> = {
  economics: { m: ['Dr', 'Prof.', 'Mr'], f: ['Dr', 'Prof.', 'Mrs'] },
  security: { m: ['AIG (rtd)', 'Brig. Gen. (rtd)', 'Mr'], f: ['CP (rtd)', 'Dr', 'Mrs'] },
  law: { m: ['Barr.', 'Dr'], f: ['Barr.', 'Dr'] },
  administration: { m: ['Mr', 'Alhaji', 'Dr'], f: ['Mrs', 'Hajiya', 'Dr'] },
  engineering: { m: ['Engr.', 'Engr.', 'Dr'], f: ['Engr.', 'Dr'] },
  politics: { m: ['Hon.', 'Chief', 'Alhaji'], f: ['Hon.', 'Chief (Mrs)', 'Hajiya'] },
  media: { m: ['Mr', 'Dr'], f: ['Mrs', 'Ms'] },
};

/** Ordinary names by zone. No famous political or business family names. */
export const NAMES_BY_ZONE: Record<ZoneId, { m: string[]; f: string[]; last: string[] }> = {
  NW: { m: ['Aminu', 'Bashir', 'Haruna', 'Ibrahim', 'Kabiru', 'Lawal', 'Mustapha', 'Nasiru', 'Sani', 'Umar', 'Yakubu', 'Zubairu', 'Shehu', 'Garba'], f: ['Aisha', 'Fatima', 'Hadiza', 'Hauwa', 'Maryam', 'Rabi', 'Safiya', 'Zainab', 'Bilkisu', 'Jamila'], last: ['Dawakin', 'Jibia', 'Kankia', 'Sabo', 'Tsiga', 'Kafin', 'Tudun', 'Birnin'] },
  NE: { m: ['Abba', 'Babagana', 'Goni', 'Kashim', 'Modu', 'Mohammed', 'Usman', 'Bukar', 'Adamu', 'Isa', 'Saleh', 'Ali'], f: ['Amina', 'Falmata', 'Hafsat', 'Ya Kaka', 'Zara', 'Halima', 'Asabe', 'Hamsatu'], last: ['Bama', 'Dikwa', 'Gombe', 'Kukawa', 'Mafa', 'Ngala', 'Bulama', 'Kolo', 'Mongonu', 'Damboa'] },
  NC: { m: ['Terver', 'Aondona', 'Emmanuel', 'Samuel', 'Ojonugwa', 'Idris', 'Musa', 'Gabriel', 'Peter', 'Yohanna', 'Danjuma', 'Ndagi'], f: ['Doosuur', 'Mnena', 'Ladi', 'Rhoda', 'Esther', 'Nguavese', 'Ene', 'Hannatu'], last: ['Agba', 'Akaa', 'Iorver', 'Tyav', 'Ogbole', 'Abah', 'Gbadamosi', 'Ndako', 'Kolo', 'Dogo', 'Gyang', 'Pam', 'Shaku', 'Usman'] },
  SW: { m: ['Adebayo', 'Babatunde', 'Femi', 'Kunle', 'Olumide', 'Segun', 'Tunde', 'Wale', 'Yinka', 'Kayode', 'Dapo', 'Lekan', 'Gbenga', 'Bode'], f: ['Bisi', 'Folake', 'Funmilayo', 'Kemi', 'Ronke', 'Titi', 'Yetunde', 'Bukola', 'Ngozi', 'Omolara', 'Shade'], last: ['Adeyemo', 'Afolabi', 'Ajayi', 'Alabi', 'Ogunleye', 'Ojo', 'Olaniyan', 'Oyelade', 'Bamidele', 'Fasina', 'Oladipo', 'Ayoola', 'Ogunbiyi'] },
  SE: { m: ['Chidi', 'Chinedu', 'Emeka', 'Ikenna', 'Kelechi', 'Nnamdi', 'Obinna', 'Uche', 'Chukwudi', 'Ifeanyi', 'Nkem', 'Okey'], f: ['Adaeze', 'Chiamaka', 'Chioma', 'Ifeoma', 'Ngozi', 'Nkiru', 'Obiageli', 'Uju', 'Amaka', 'Ebele'], last: ['Anyanwu', 'Eze', 'Nwosu', 'Okafor', 'Okeke', 'Onyeka', 'Ugwu', 'Nwachukwu', 'Okoro', 'Agu', 'Chukwu', 'Iheanacho', 'Nnaji', 'Udo'] },
  SS: { m: ['Ebi', 'Tamuno', 'Ovie', 'Efe', 'Bassey', 'Etim', 'Osaro', 'Iyobo', 'Tari', 'Ese', 'Ekpo', 'Ita'], f: ['Ebiere', 'Ovo', 'Edidiong', 'Ekaette', 'Osas', 'Tamara', 'Ufuoma', 'Itohan', 'Eno'], last: ['Briggs', 'Douglas', 'Ekpo', 'Etim', 'Okoh', 'Omoregie', 'Oruma', 'Tobi', 'Uwem', 'Edet', 'Akpan', 'Emuobo', 'Ighodaro'] },
};

/**
 * First name + surname pairs the banks above can form that belong to a known
 * person, so a generator must never produce them. Built on 6 October 2026 by
 * listing, for every surname in the banks, the people with an encyclopaedia
 * entry under it, and keeping each whose first name is in the same zone's
 * lists (hyphenated and middle-name matches included, to be safe). Two
 * surnames that identify one politician on their own (Dandago, Yandoma) were
 * removed from the banks instead. The named characters are blocked as well, so
 * the background crowd never produces a second person with a character's name.
 * tests/experience/names.check.ts keeps this list honest.
 */
export const BLOCKED_NAMES: ReadonlySet<string> = new Set([
  // South East
  'Ngozi Anyanwu', 'Emeka Eze', 'Obinna Eze', 'Ifeanyi Eze', 'Uche Nwosu', 'Ngozi Nwosu',
  'Emeka Okafor', 'Uche Okafor', 'Amaka Okafor', 'Chioma Okafor', 'Nnamdi Okafor', 'Chinedu Okafor',
  'Nkem Okeke', 'Uche Okeke', 'Uju Okeke', 'Chidi Okeke', 'Ifeanyi Okeke', 'Ebele Okeke', 'Chinedu Okeke',
  'Uche Ugwu', 'Obinna Nwachukwu', 'Chinedu Chukwu', 'Kelechi Iheanacho', 'Ifeoma Iheanacho', 'Uche Nnaji',
  // South West
  'Kayode Adeyemo', 'Segun Afolabi', 'Kunle Ajayi', 'Yinka Ajayi', 'Kayode Alabi', 'Tunde Alabi', 'Bisi Alabi',
  'Wale Ojo', 'Femi Ojo', 'Tunde Bamidele', 'Wale Oladipo',
  // South South
  'Etim Ekpo', 'Bassey Ekpo', 'Bassey Etim', 'Bassey Akpan', 'Osas Ighodaro',
  // North Central
  'Samuel Agba', 'Gabriel Gbadamosi', 'Samuel Pam', 'Musa Usman', 'Esther Usman',
  // Named characters the banks could otherwise repeat
  'Adaeze Nwachukwu', 'Funmilayo Adeyemo', 'Kelechi Anyanwu',
]);

/** Which specialities each appointment wants. Anyone else works a point below their competence. */
export const ROLE_SPECS: Record<string, Spec[]> = {
  // Ministers
  min_power: ['engineering'], min_works: ['engineering', 'administration'], min_agric: ['economics', 'administration'],
  min_justice: ['law'], min_defence: ['security'], min_service: ['administration'], fin: ['economics'], vp: ['politics', 'administration'],
  // Advisers
  cos: ['administration', 'politics'], sap: ['politics'], info: ['media', 'politics'], labmin: ['administration', 'law'], edu: ['administration'],
  // Institutions
  graft: ['law', 'security'], jobs: ['administration'], power: ['engineering'], zone: ['economics'], tax: ['economics', 'law'],
  delivery: ['administration'], reserve: ['economics', 'administration'], policing: ['security'], fund: ['economics'],
  // Assets (managers)
  asset: ['engineering', 'economics', 'administration'],
};

/** One line of background per speciality, to make a person more than a set of numbers. */
export const BACKGROUNDS: Record<Spec, string[]> = {
  economics: ['Fifteen years at a development bank abroad.', 'Taught economics and advised two state governments.', 'Ran research at a Lagos investment bank.', 'A former central bank director.'],
  security: ['Retired from the police after thirty years, the last five in intelligence.', 'Commanded troops in the North East.', 'Ran security for an oil company in the Delta.', 'A former customs comptroller.'],
  law: ['Senior Advocate with a commercial practice.', 'A former state Attorney General.', 'Prosecuted for the anti-corruption agency for a decade.', 'Taught constitutional law.'],
  administration: ['A retired permanent secretary.', 'Ran a state civil service commission.', 'Twenty years in the federal civil service.', 'Managed a large teaching hospital.'],
  engineering: ['Built transmission lines for a decade.', 'Ran a power plant in the South South.', 'A former chief engineer at the ports authority.', 'Founded a construction firm that finished its projects.'],
  politics: ['Two terms in the House of Representatives.', 'A party organiser who has won three elections for other people.', 'A former state commissioner.', 'Chaired a local government and is proud of it.'],
  media: ['Edited a national daily.', 'Ran communications for a telecoms company.', 'A broadcaster with a following.', 'Spokesperson for two ministries.'],
};
