// THE NAMED CANDIDATE POOL (plan 03; content input for contract R5)
// People who can be appointed, each with a career, a field, the roles they suit,
// what they believe and what they will not do. Most are ordinary appointments.
// Four are exceptional: each brings a capability the government does not
// otherwise have, on stated terms, and reacts in a stated way if the terms are
// broken. Some excellent people carry no hidden catch at all: they need only the
// resources the job needs (plan 03: "excellence is not always a trap").
//
// Names: ordinary Nigerian names, each searched on the web on 6 October 2026 and
// kept only if no public figure shares it (rule in content/names.ts). Rejected in
// that pass: Babatunde Olaleye, Chinedu Okeke, Tunde Fagbemi, Terhemba Agber,
// Ifunanya Okoye, Damilola Ogunleye, Nkechi Obiefuna. No text here uses a
// gendered pronoun for a candidate.
//
// Status: authored content. Recruitment state, approaching, appointment with
// terms, breach detection and capability effects wait on contract R5. Every
// capability and condition below is a proposed definition for Codex to give
// engine meaning; until then nothing reads this file.

import type { ZoneId } from '../engine/types';
import type { Spec } from './talent';

/** A stated term of appointment, and what happens if the government breaks it. */
export interface Condition {
  id: string;
  /** What the candidate requires, in the words of their acceptance letter. */
  text: string;
  /** How the engine would test it (proposed; R5 defines the mechanism). */
  test: string;
  /** What the candidate does when it is broken. */
  breach: string;
}

/** Something the government can do only while this person holds the post (proposed; R5). */
export interface Capability {
  id: string;
  /** What it lets the government do, or do better, in play. */
  text: string;
  /** Which existing files, reforms or systems it touches. */
  touches: string[];
}

export interface CareerStep { years: string; post: string }

export interface NamedCandidate {
  id: string;
  name: string;
  short: string;
  zone: ZoneId;
  spec: Spec;
  /** Role keys from ROLE_SPECS in content/talent.ts. */
  roles: string[];
  career: CareerStep[];
  /** One line on what they are actually good at. */
  expertise: string;
  /** What they believe about the job, which shapes the advice they give. */
  view: string;
  /** True traits, 1–5 (loyalty 1–5). What a background check would find. */
  traits: { competence: number; loyalty: number; integrity: number; clout: number; ambition: number };
  /** Who they answer to: 'president' (their own person), 'self', or a person or businessman id. */
  patron: string;
  /** What the file says before a check, where it differs from the truth. */
  reputation?: string;
  exceptional?: { capabilities: Capability[]; conditions: Condition[] };
  /** Excellent with no conditions beyond the job's own resources. */
  plainExcellence?: string;
}

export const CANDIDATES: NamedCandidate[] = [
  // ---------------------------------------------------------------- the four exceptional
  {
    id: 'cand.nwachukwu', name: 'Dr Adaeze Nwachukwu', short: 'Nwachukwu', zone: 'SE', spec: 'economics', roles: ['fin', 'fund', 'tax'],
    career: [
      { years: '12 years', post: 'Sovereign debt adviser at a development bank abroad, on four restructurings' },
      { years: '3 years', post: 'Debt Management Office, head of strategy, until resigning over a bond issue' },
    ],
    expertise: 'Restructuring debt without a default, and knowing which creditor will move first.',
    view: 'The debt is a negotiation, not a sentence. Most of what Nigeria pays in interest is the price of not being believed.',
    traits: { competence: 5, loyalty: 3, integrity: 5, clout: 2, ambition: 1 }, patron: 'president',
    exceptional: {
      capabilities: [
        { id: 'cap.debt_restructuring', text: 'In a debt crisis, a negotiated restructuring is available that does not count as a default, and refinancing a maturing bond costs less.', touches: ['debt.crisis', 'debt.maturity', 'debt.eurobond'] },
      ],
      conditions: [
        { id: 'cond.refuse_unfunded', text: 'The Finance Minister may refuse spending that has no money behind it, in writing, and the President will not overrule that in private.', test: 'Overruling the minister on an unfunded budget or supplementary (as in fin.gwarzo.budget → overrule)', breach: 'Resigns the same week with a published letter. The establishment and the bond market mark the government down; the capability leaves too.' },
        { id: 'cond.debt_team', text: 'A team of twelve specialists, paid at market rates, for the life of the appointment.', test: 'A recurring cost the budget must carry (proposed ₦4bn a year)', breach: 'Without the team the capability lapses; the minister stays, capable, and says publicly why it lapsed.' },
      ],
    },
  },
  {
    id: 'cand.chukwuma', name: 'Engr. Ifeanyi Chukwuma', short: 'Chukwuma', zone: 'SE', spec: 'engineering', roles: ['min_power', 'power', 'asset'],
    career: [
      { years: '15 years', post: 'Transmission engineer, then grid operations lead, for a utility abroad' },
      { years: '4 years', post: 'Rebuilt a regional grid after a collapse, on time and on budget' },
    ],
    expertise: 'Finding which line will fail next, and fixing it before it does.',
    view: 'The grid does not collapse by surprise. It collapses where nobody was looking.',
    traits: { competence: 5, loyalty: 3, integrity: 4, clout: 1, ambition: 1 }, patron: 'president',
    exceptional: {
      capabilities: [
        { id: 'cap.grid_diagnostics', text: 'A grid collapse is diagnosed on the day (gas, transmission or tariff), the right remedy is named, and the corridor reform moves faster.', touches: ['grid.collapse', 'shock.blackout', 'p2'] },
      ],
      conditions: [
        { id: 'cond.engineers', text: 'Forty engineers recruited from abroad, paid properly, with houses.', test: 'A recurring cost (proposed ₦5bn a year)', breach: 'The engineers leave within a quarter; the capability lapses.' },
        { id: 'cond.no_patronage', text: 'No political appointments into the transmission company while in office.', test: 'Granting a governor\'s or senator\'s request for a board or management post in the power sector', breach: 'Resigns, and says on air which appointment it was.' },
      ],
    },
  },
  {
    id: 'cand.udeagha', name: 'Barr. Chiamaka Udeagha', short: 'Udeagha', zone: 'SE', spec: 'law', roles: ['graft', 'min_justice'],
    career: [
      { years: '10 years', post: 'Prosecutor of financial crime, with a conviction record the defence bar respects' },
      { years: '5 years', post: 'Ran asset tracing for a regional anti-money-laundering body' },
    ],
    expertise: 'Building a money-laundering case that survives appeal.',
    view: 'A prosecution that loses on procedure is a gift to the accused. Do it slowly once rather than quickly twice.',
    traits: { competence: 5, loyalty: 2, integrity: 5, clout: 2, ambition: 2 }, patron: 'president',
    exceptional: {
      capabilities: [
        { id: 'cap.complex_prosecution', text: 'Financial cases are more likely to end in conviction and take less time; recovered assets are traced abroad.', touches: ['cases', 'loot', 'inst.graft.ally', 'minister.outcome'] },
      ],
      conditions: [
        { id: 'cond.no_direction', text: 'No instruction from the Villa on any case, in either direction, and the agency\'s budget protected from mid-year cuts.', test: 'Having a case file returned or delayed (inst.graft.ally → stop, fin.ekpenyong.file → bury, favour.offer → review); or cutting the agency\'s funding', breach: 'Resigns and publishes the instruction. Integrity and the press fall; the next chief appointed is believed less.' },
      ],
    },
  },
  {
    id: 'cand.adeyemo', name: 'Prof. Funmilayo Adeyemo', short: 'Adeyemo', zone: 'SW', spec: 'administration', roles: ['edu', 'min_service', 'delivery'],
    career: [
      { years: '9 years', post: 'Vice-chancellor of a state university that never closed for a strike in those nine years' },
      { years: '6 years', post: 'Chaired a national committee on university funding whose report was implemented' },
    ],
    expertise: 'Settling with the academics, and getting them to sign a timetable they keep.',
    view: 'The union does not want a committee. It wants a line in the budget it can point to.',
    traits: { competence: 5, loyalty: 3, integrity: 4, clout: 3, ambition: 2 }, patron: 'president',
    exceptional: {
      capabilities: [
        { id: 'cap.university_settlement', text: 'The university agreement can be settled on a phased timetable the union accepts without a strike, at less than full cost.', touches: ['uni.ultimatum', 'uni.tranche', 'uni.strike', 'e2'] },
      ],
      conditions: [
        { id: 'cond.protected_line', text: 'Health and schools at no less than their share of this year\'s budget for as long as the appointment lasts.', test: 'Signing a budget that cuts the health and schools allocation (budget.people below its starting level)', breach: 'Resigns in front of the union\'s executive; the union treats the settlement as broken.' },
      ],
    },
  },

  // ---------------------------------------------------------------- excellent, without a catch
  {
    id: 'cand.tamuno', name: 'Mrs Ebiere Tamuno', short: 'Tamuno', zone: 'SS', spec: 'engineering', roles: ['min_works', 'zone', 'asset'],
    career: [
      { years: '11 years', post: 'Terminal operations manager at a port in West Africa' },
      { years: '5 years', post: 'Cut container clearance at that port from fourteen days to three' },
    ],
    expertise: 'Making a port clear cargo in two days.',
    view: 'Every agency at the port has a reason to be there and a stamp. Fewer stamps, faster ships.',
    traits: { competence: 5, loyalty: 3, integrity: 4, clout: 2, ambition: 1 }, patron: 'president',
    plainExcellence: 'Delivers the ports reform and the economic zone faster, if they are funded. Asks for nothing else.',
  },
  {
    id: 'cand.danladi', name: 'Dr Rakiya Danladi', short: 'Danladi', zone: 'NC', spec: 'economics', roles: ['delivery', 'reserve', 'fund'],
    career: [
      { years: '14 years', post: 'Statistician, then director, at the national statistics office' },
      { years: '3 years', post: 'Designed a household survey that international lenders now copy' },
    ],
    expertise: 'Telling the President what is actually happening, with a margin of error.',
    view: 'A delivery claim without a field check is an opinion.',
    traits: { competence: 5, loyalty: 3, integrity: 5, clout: 1, ambition: 0 }, patron: 'president',
    plainExcellence: 'Reports are checked against field data before they reach the desk (plan 08). Needs only the survey budget.',
  },
  {
    id: 'cand.ajala', name: 'Maj. Gen. Sunday Ajala (rtd)', short: 'Ajala', zone: 'SW', spec: 'security', roles: ['min_defence', 'policing'],
    career: [
      { years: '30 years', post: 'Army logistics, ending as the officer who kept the North East supplied' },
      { years: '2 years', post: 'Retired; teaches logistics at the staff college' },
    ],
    expertise: 'Getting fuel, ammunition and rations to a unit before it needs them.',
    view: 'Most of the battles this army lost, it lost in the supply depot.',
    traits: { competence: 4, loyalty: 4, integrity: 4, clout: 2, ambition: 0 }, patron: 'president',
    plainExcellence: 'Units are supplied: the "no fuel" and "short of ammunition" failures stop happening where the money is released.',
  },

  // ---------------------------------------------------------------- ordinary appointments, each with a view
  {
    id: 'cand.kolo', name: 'Hajiya Maryam Kolo', short: 'Kolo', zone: 'NC', spec: 'administration', roles: ['edu', 'min_service', 'jobs'],
    career: [
      { years: '20 years', post: 'Public health, ending as director of a state primary health care agency' },
    ],
    expertise: 'Running clinics that open on time and have drugs.',
    view: 'The ward clinic is the government most people ever meet.',
    traits: { competence: 4, loyalty: 4, integrity: 4, clout: 2, ambition: 1 }, patron: 'president',
  },
  {
    id: 'cand.anyanwu', name: 'Dr Kelechi Anyanwu', short: 'Anyanwu', zone: 'SE', spec: 'economics', roles: ['fin', 'fund', 'reserve'],
    career: [
      { years: '10 years', post: 'Health economist, then an insurer\'s chief actuary' },
    ],
    expertise: 'Pricing insurance so that it pays out and survives.',
    view: 'An insurance scheme that the poor cannot use is a tax on the poor.',
    traits: { competence: 4, loyalty: 3, integrity: 4, clout: 1, ambition: 1 }, patron: 'president',
  },
  {
    id: 'cand.garkuwa', name: 'Engr. Musa Garkuwa', short: 'Garkuwa', zone: 'NW', spec: 'engineering', roles: ['min_works', 'asset'],
    career: [
      { years: '22 years', post: 'Federal roads engineer, the last eight as a zonal controller' },
    ],
    expertise: 'Knowing which contractor will finish, and which one only mobilises.',
    view: 'Finish what was started before you start anything else.',
    traits: { competence: 4, loyalty: 4, integrity: 3, clout: 3, ambition: 1 }, patron: 'gov_nw',
    reputation: 'The file describes an independent engineer. Governor Batagarawa recommended the appointment and expects to be remembered for it.',
  },
  {
    id: 'cand.kangiwa', name: 'Dr Bello Kangiwa', short: 'Kangiwa', zone: 'NW', spec: 'economics', roles: ['min_agric', 'reserve'],
    career: [
      { years: '16 years', post: 'Agronomist at a research institute, then ran an inputs programme in three states' },
    ],
    expertise: 'Getting seed and fertiliser to farmers before the rains, not after.',
    view: 'A late input is a wasted input.',
    traits: { competence: 4, loyalty: 3, integrity: 3, clout: 2, ambition: 1 }, patron: 'president',
  },
  {
    id: 'cand.etim', name: 'Mrs Uduak Etim', short: 'Etim', zone: 'SS', spec: 'administration', roles: ['cos', 'min_service', 'delivery'],
    career: [
      { years: '25 years', post: 'Federal civil service, ending as a permanent secretary who cleaned up a payroll' },
    ],
    expertise: 'Making the civil service do what it was told, on paper and then in fact.',
    view: 'Every ghost on the payroll has a sponsor. Find the sponsor and the ghost disappears.',
    traits: { competence: 4, loyalty: 4, integrity: 4, clout: 2, ambition: 0 }, patron: 'president',
  },
  {
    id: 'cand.bakori', name: 'Alhaji Nuhu Bakori', short: 'Bakori', zone: 'NW', spec: 'politics', roles: ['cos', 'sap', 'vp'],
    career: [
      { years: '3 terms', post: 'Party organiser who won elections for other people' },
      { years: '4 years', post: 'Chief of staff to a governor' },
    ],
    expertise: 'Counting votes in the Senate and delegates at a convention, accurately.',
    view: 'Nobody votes for a programme. They vote for the person who called them.',
    traits: { competence: 3, loyalty: 5, integrity: 2, clout: 4, ambition: 2 }, patron: 'self',
    reputation: 'The file says loyal and clean. Loyal is true.',
  },
  {
    id: 'cand.olatunji', name: 'Mr Femi Olatunji', short: 'Olatunji', zone: 'SW', spec: 'economics', roles: ['fin', 'fund', 'tax'],
    career: [
      { years: '18 years', post: 'Central bank, reserves and foreign exchange, ending as a deputy director' },
    ],
    expertise: 'Running the reserves without pretending they are bigger than they are.',
    view: 'A rate defended with reserves you do not have is a rate you will lose all at once.',
    traits: { competence: 4, loyalty: 3, integrity: 4, clout: 2, ambition: 1 }, patron: 'ty_bank',
    reputation: 'The file does not mention that Mrs Adetoro\'s bank proposed the name.',
  },
  {
    id: 'cand.goni', name: 'Dr Amina Goni', short: 'Goni', zone: 'NE', spec: 'economics', roles: ['fin', 'delivery', 'reserve'],
    career: [
      { years: '12 years', post: 'Budget office, ending as head of the capital budget' },
    ],
    expertise: 'Releasing capital money on a schedule contractors can plan around.',
    view: 'Half the arrears are money released too late to be spent well.',
    traits: { competence: 4, loyalty: 3, integrity: 4, clout: 1, ambition: 1 }, patron: 'president',
  },
  {
    id: 'cand.akinde', name: 'Barr. Oluwaseun Akinde', short: 'Akinde', zone: 'SW', spec: 'law', roles: ['min_justice', 'tax'],
    career: [
      { years: '15 years', post: 'Commercial litigator, then a state\'s solicitor-general' },
    ],
    expertise: 'Drafting a law that survives the Supreme Court.',
    view: 'Most of our reforms are struck down for the drafting, not the policy.',
    traits: { competence: 4, loyalty: 3, integrity: 3, clout: 2, ambition: 2 }, patron: 'sen_pres',
    reputation: 'The file presents an independent lawyer. Senator Maigari expects to be consulted.',
  },
  {
    id: 'cand.eze', name: 'Mr Chidozie Eze', short: 'Eze', zone: 'SE', spec: 'engineering', roles: ['min_works', 'asset'],
    career: [
      { years: '14 years', post: 'Quantity surveyor, then head of a federal procurement review unit' },
    ],
    expertise: 'Knowing what a road should cost, to the kilometre.',
    view: 'An inflated contract is a debt to a contractor that nobody voted for.',
    traits: { competence: 4, loyalty: 3, integrity: 5, clout: 1, ambition: 1 }, patron: 'president',
  },
  {
    id: 'cand.adelusi', name: 'Mr Kayode Adelusi', short: 'Adelusi', zone: 'SW', spec: 'economics', roles: ['fin', 'fund'],
    career: [
      { years: '16 years', post: 'Debt Management Office, ending as head of the domestic bond desk' },
    ],
    expertise: 'Selling bonds the market will buy, at a price the treasury can bear.',
    view: 'The auction tells you what the market thinks of you before the newspapers do.',
    traits: { competence: 4, loyalty: 4, integrity: 3, clout: 1, ambition: 1 }, patron: 'president',
  },
  {
    id: 'cand.ikyaa', name: 'Engr. Tersoo Ikyaa', short: 'Ikyaa', zone: 'NC', spec: 'engineering', roles: ['min_agric', 'min_works', 'asset'],
    career: [
      { years: '18 years', post: 'Water engineer on the river basin authority, then a dam safety inspector' },
    ],
    expertise: 'Irrigation and flood works that are built to the design.',
    view: 'A dam that is not maintained is a flood that has been scheduled.',
    traits: { competence: 4, loyalty: 3, integrity: 4, clout: 1, ambition: 0 }, patron: 'gov_nc',
    reputation: 'The file does not say that Governor Nyitse put the name forward.',
  },
  {
    id: 'cand.adesida', name: 'Mr Wale Adesida', short: 'Adesida', zone: 'SW', spec: 'administration', roles: ['delivery', 'min_service'],
    career: [
      { years: '10 years', post: 'Built payment systems for banks, then a government identity platform' },
    ],
    expertise: 'Putting a government service online so that it works on a cheap phone.',
    view: 'If it needs a fixer, it is not digital.',
    traits: { competence: 4, loyalty: 3, integrity: 4, clout: 1, ambition: 2 }, patron: 'president',
  },
];

export const CANDIDATE_BY_ID = Object.fromEntries(CANDIDATES.map((c) => [c.id, c]));
