import type { Cond, Fx, ZoneId } from '../engine/types';

// YOUR PEOPLE
// The governors who lead each zone's caucus, the senators who decide whether
// your bills live, and the ministers who run your reforms. All names are
// parody names (see names.ts).

export type Group = 'governor' | 'senator' | 'minister';
export type Temper = 'loyal' | 'transactional' | 'ambitious' | 'principled';

export interface Want {
  text: string;
  pc?: number;
  naira?: number;
  /** What granting it does besides pleasing them. */
  fx: Fx[];
  done: string;
}

export interface Person {
  id: string;
  group: Group;
  name: string;
  short: string;
  title: string;
  zone?: ZoneId;
  /** Ministers: the reform tracks they run. */
  tracks?: string[];
  clout: number;
  competence?: number;
  loyalty: number;
  temper: Temper;
  bio: string;
  want?: Want;
}

export const PEOPLE: Person[] = [
  // ---------------------------------------------------------------- governors
  {
    id: 'gov_nw', group: 'governor', zone: 'NW', name: 'Governor Sani Stomach-Infrastructure', short: 'Stomach-Infrastructure',
    title: 'Leads your governors in the North West', clout: 5, loyalty: 55, temper: 'transactional',
    bio: 'Wins elections with rice and holds them with more rice. Controls the largest bloc of delegates in the party.',
    want: { text: 'Fertiliser for the zone to be distributed through his local government chairmen.', naira: 0.2, fx: [['nation.integrity', -2], ['zone.NW.approval', 3]], done: 'The fertiliser goes out with his photograph on every bag.' },
  },
  {
    id: 'gov_ne', group: 'governor', zone: 'NE', name: 'Governor Ibrahim Reconstruction', short: 'Reconstruction',
    title: 'Leads your governors in the North East', clout: 3, loyalty: 60, temper: 'loyal',
    bio: 'Runs a state that has been rebuilding for twelve years. Asks for little and is used to getting less.',
    want: { text: 'A federal reconstruction fund for the towns that are still rubble.', naira: 0.4, fx: [['zone.NE.approval', 6], ['zone.NE.security', 3], ['bloc.street', 2]], done: 'Rebuilding starts in four towns. He names a school after you without being asked.' },
  },
  {
    id: 'gov_nc', group: 'governor', zone: 'NC', name: 'Governor Terver Bailout', short: 'Bailout',
    title: 'Leads your governors in the North Central', clout: 3, loyalty: 50, temper: 'transactional',
    bio: 'Owes his workers seven months. Blames the previous governor, the federal government and the rains, in that order.',
    want: { text: 'A salary bailout for his state, "as a loan".', naira: 0.3, fx: [['zone.NC.approval', 3], ['nation.debt', 1]], done: 'Salaries are paid. The "loan" will not be repaid, and you both know it.' },
  },
  {
    id: 'gov_sw', group: 'governor', zone: 'SW', name: 'Governor Segun Flyover', short: 'Flyover',
    title: 'Leads your governors in the South West', clout: 5, loyalty: 50, temper: 'ambitious',
    bio: 'Builds things, opens them twice, and is running for your job in every way short of saying so.',
    want: { text: 'A ₦400bn refund for federal roads he says his state repaired.', naira: 0.4, fx: [['zone.SW.approval', 2], ['nation.integrity', -1]], done: 'The refund is paid. He announces it as proof of his own influence in Abuja.' },
  },
  {
    id: 'gov_se', group: 'governor', zone: 'SE', name: 'Governor Chidi Zoning', short: 'Zoning',
    title: 'Leads your governors in the South East', clout: 3, loyalty: 45, temper: 'principled',
    bio: 'Keeps a spreadsheet of every federal appointment by zone. The spreadsheet is accurate, which is the problem.',
    want: { text: 'Federal approval for a seaport and a rail spur, long promised and never funded.', pc: 6, naira: 0.3, fx: [['zone.SE.approval', 7], ['nation.jobs', 2]], done: 'The approval is gazetted. For once his spreadsheet has an entry in the right-hand column.' },
  },
  {
    id: 'gov_ss', group: 'governor', zone: 'SS', name: 'Governor Preye Allocation', short: 'Allocation',
    title: 'Chairs the Governors\' Forum; leads the South South', clout: 5, loyalty: 50, temper: 'transactional',
    bio: 'Speaks for all thirty-six governors, mostly. Delivered three states for you and has mentioned it since.',
    want: { text: 'The chairmanship of the petroleum regulator for his nominee.', fx: [['nation.integrity', -3], ['nation.capacity', -1.5]], done: 'His man is sworn in. The regulator becomes noticeably more understanding.' },
  },

  // ---------------------------------------------------------------- senators
  {
    id: 'sen_pres', group: 'senator', name: 'Senator Bala Bow-and-Go', short: 'Bow-and-Go',
    title: 'President of the Senate', clout: 5, loyalty: 55, temper: 'transactional',
    bio: 'Decides which bills are heard and which are "stepped down". Has never lost a vote he allowed to be taken.',
    want: { text: 'Six hundred constituency projects for senators to commission.', naira: 0.35, fx: [['nation.integrity', -2]], done: 'The projects are approved. The Senate discovers a new respect for the executive.' },
  },
  {
    id: 'sen_lead', group: 'senator', name: 'Senator Uche Ayes-Have-It', short: 'Ayes-Have-It',
    title: 'Senate Majority Leader', clout: 4, loyalty: 60, temper: 'loyal',
    bio: 'Your floor manager. Can count votes to the nearest senator and tell you each one\'s price.',
    want: { text: 'To be consulted before bills are sent, not after.', pc: 4, fx: [['nation.capacity', 1]], done: 'You start sending him drafts a week early. He fixes two of them, which is irritating and useful.' },
  },
  {
    id: 'sen_approp', group: 'senator', name: 'Senator Dauda Padding', short: 'Padding',
    title: 'Chairs the Appropriations Committee', clout: 4, loyalty: 45, temper: 'transactional',
    bio: 'Every naira the government spends passes through his committee and leaves slightly lighter.',
    want: { text: 'A free hand on the "zonal intervention" lines of the budget.', fx: [['nation.integrity', -3], ['bonus.fiscal', -0.01]], done: 'The lines are his. The budget passes on time for the first time in years.' },
  },
  {
    id: 'sen_rebel', group: 'senator', name: 'Senator Efe Walkout', short: 'Walkout',
    title: 'Leads the reform caucus', clout: 3, loyalty: 40, temper: 'principled',
    bio: 'From your own party and your loudest critic. Twenty senators follow her out of the chamber when she goes.',
    want: { text: 'Televised public hearings on every executive bill, with the documents published.', pc: 5, fx: [['nation.integrity', 3], ['bloc.press', 4], ['bloc.party', -4]], done: 'The hearings are televised. They are long, awkward, and impossible to argue with.' },
  },

  // ---------------------------------------------------------------- ministers
  {
    id: 'min_power', group: 'minister', name: 'Engr. Chidi Megawatt', short: 'Megawatt', title: 'Minister of Power',
    tracks: ['power'], clout: 2, competence: 3, loyalty: 55, temper: 'loyal',
    bio: 'An engineer who knows the grid and is tired of explaining it. Adequate. Could be better; could be much worse.',
  },
  {
    id: 'min_works', group: 'minister', name: 'Engr. Lanre Almost-Complete', short: 'Almost-Complete', title: 'Minister of Works',
    tracks: ['works', 'industry'], clout: 4, competence: 2, loyalty: 60, temper: 'transactional',
    bio: 'A former governor. Every project under him is 95% complete. He came with four states\' worth of delegates.',
  },
  {
    id: 'min_agric', group: 'minister', name: 'Dr Aisha Bumper-Harvest', short: 'Bumper-Harvest', title: 'Minister of Agriculture',
    tracks: ['food'], clout: 1, competence: 4, loyalty: 50, temper: 'principled',
    bio: 'An agronomist who has actually farmed. Nobody in the party knows who sponsored her, because nobody did.',
  },
  {
    id: 'min_justice', group: 'minister', name: 'Barr. Emeka Extant-Provisions', short: 'Extant-Provisions', title: 'Attorney General',
    tracks: ['clean', 'treasury'], clout: 3, competence: 3, loyalty: 65, temper: 'loyal',
    bio: 'Can find a legal basis for anything you want, which is his value and his danger.',
  },
  {
    id: 'min_defence', group: 'minister', name: 'Maj. Gen. D. D. Situation (rtd)', short: 'Situation', title: 'National Security Adviser',
    tracks: ['security'], clout: 3, competence: 3, loyalty: 55, temper: 'loyal',
    bio: 'On top of the situation. Honest about what he does not know, which is rarer than it should be.',
  },
  {
    id: 'min_service', group: 'minister', name: 'Mrs Kemi Value-Chain', short: 'Value-Chain', title: 'Minister of Industry and the Public Service',
    tracks: ['service', 'digital', 'people'], clout: 2, competence: 4, loyalty: 45, temper: 'ambitious',
    bio: 'Ran a bank. Runs her ministries like one. Is said to be writing down everything she sees.',
  },
];

export const PERSON_BY_ID = Object.fromEntries(PEOPLE.map((p) => [p.id, p]));

/** Replacements available when a minister is dismissed. */
export const REPLACEMENTS = {
  technocrat: { names: ['Dr Zainab Deliverables', 'Engr. Tunde Key-Performance', 'Dr Ifeoma Baseline', 'Mr Yusuf Workplan'], competence: 5, clout: 1, loyalty: 50, temper: 'principled' as Temper, bio: 'Recruited on record alone. Nobody in the party has heard of them, and they intend to keep it that way.' },
  party: { names: ['Chief Bayo Loyalty', 'Alhaji Garba Structure', 'Hon. Nkem Delegate', 'Otunba Wale Stakeholder'], competence: 2, clout: 4, loyalty: 70, temper: 'transactional' as Temper, bio: 'Nominated by the governors. Arrived with forty aides and a list.' },
};

// THE OPPOSITION
// Three rivals. Each grows on a different failure, so who the President ends
// up facing depends on how the President governed.

export interface Rival {
  id: string;
  name: string;
  party: string;
  style: string;
  feeds: string;
  /** Quotes for the papers. */
  lines: string[];
}

export const RIVALS: Rival[] = [
  {
    id: 'alt', name: 'Dr Kabiru Alternative', party: "People's Alternative Movement",
    style: 'The government-in-waiting. A former minister with a shadow cabinet and a costed manifesto nobody has read.',
    feeds: 'Grows on scandal, a nervous establishment and rising debt.',
    lines: [
      'This government confuses announcements with achievements.',
      'We have a costed alternative. It is forty pages. I invite the President to read any one of them.',
      'Competence is not a slogan. It is the thing that has been missing.',
      'When we were in government the files moved. I do not say they moved well. They moved.',
    ],
  },
  {
    id: 'fire', name: 'Barr. Tega Enough-Is-Enough', party: 'Movement of the Fed-Up',
    style: 'A thirty-nine-year-old lawyer with two million followers and no structure in a single ward.',
    feeds: 'Grows on hardship and an angry street.',
    lines: [
      'Go to any market and ask the woman selling pepper whether she has felt this "reform".',
      'They are not suffering with us. They are suffering us.',
      'My generation has been told to be patient since before we were born.',
      'I do not need a structure. I need people who are tired. There are two hundred million.',
    ],
  },
  {
    id: 'strong', name: 'Senator Garba Decamp', party: 'New Structure Party',
    style: 'A former governor of your own party who left with his delegates. Knows where everything is buried because he helped bury it.',
    feeds: 'Grows when your party is divided and your governors are unhappy.',
    lines: [
      'I built that party. I know exactly what it is worth.',
      'The President does not pick calls. In politics, that is all you need to know about a leader.',
      'My people are still inside. They are waiting for me to say the word.',
      'In my state we did this ten years ago, quietly, and nobody held a summit about it.',
    ],
  },
];

export const RIVAL_BY_ID = Object.fromEntries(RIVALS.map((r) => [r.id, r]));

/** What your own people say to the papers, by how they feel about you. */
export const LOYAL_LINES = [
  '{MRP} has shown uncommon courage.',
  'I was in the room. This was the right call and it was not an easy one.',
  'History will be kinder than the headlines.',
  'My people are fully behind {MRP} on this.',
];
export const COOL_LINES = [
  'I was not consulted.',
  'We remain loyal party members. We are also watching.',
  'I will study the details before I comment further.',
  'The party is bigger than any one individual.',
];

export type { Cond };
