import type { Fx } from '../engine/types';

// INSTITUTIONS
// Things an order can build that keep running: a task force, a zone, an agency.
// Each has a head the President chooses, a monthly upkeep and a monthly output.
// A capable head makes it work; a head who serves someone else captures it, and
// the capture shows. What is built is handed on to the next President.

export interface InstitutionDef {
  id: string;
  name: string;
  blurb: string;
  /** Cost to set up. */
  pc: number;
  naira: number;
  /** The moment it is set up. */
  start?: Fx[];
  /** Every month, at a head of ordinary competence. Scaled by the head's competence; reduced when captured. */
  fx: Fx[];
  /** ₦tn a month: negative is upkeep, positive is revenue it raises. Scaled like fx when positive. */
  fiscal: number;
  /** Points of inflation it holds down while it runs. */
  inflation?: number;
  /** Effects that turn against the President if the head's integrity is 2 or less. */
  crooked?: Fx[];
  /** What it needs to work at full strength, and what it does without it. */
  needs?: { label: string; v: [string, '>=' | '<', number]; else: number };
  /** Undoing it. */
  abolishPc: number;
  abolish: Fx[];
  /** Months to reach full strength. */
  ramp: number;
  /** What it counts, each month, at full strength: label, amount, and how to show the running total. */
  record: { label: string; per: number; unit?: string; cap?: number }[];
  /** Set below for every institution (plan 04.A1). */
  charter?: Charter;
}

/** What an institution is for, what it may do, who can remove its head, who watches it, and how it tends to behave. */
export interface Charter {
  mandate: string;
  powers: string[];
  /** presidential: the President removes the head at will; statutory: a law protects the head; constitutional: only an amendment can touch it. */
  independence: 'presidential' | 'statutory' | 'constitutional';
  oversight: string;
  /** How it behaves under an ordinary head (plan 04.A3): the head and its own routines can change this. */
  culture: Culture;
}
export type Culture = 'competent' | 'timid' | 'doctrinaire' | 'captured' | 'slow';
export const CULTURE_NAME: Record<Culture, string> = {
  competent: 'Competent: does its job, including when the job is inconvenient',
  timid: 'Timid: does what it is asked and nothing it is not',
  doctrinaire: 'Doctrinaire: applies its rule whatever the cost, to friend and foe',
  captured: 'Captured: serves the interest it was meant to regulate',
  slow: 'Procedurally slow: right in the end, and late',
};

export const INSTITUTIONS: InstitutionDef[] = [
  {
    id: 'graft', name: 'The anti-corruption agency, under a chief you appoint', pc: 8, naira: 0,
    blurb: 'An agency with a head who answers to you. An honest, able chief makes cases stick and frightens the right people. A chief who is neither protects whoever they serve, starting with you.',
    start: [['bloc.press', 3], ['bloc.party', -4]],
    fx: [['nation.integrity', 0.06], ['pressure.scandalHeat', -0.15], ['bloc.party', -0.05]],
    crooked: [['nation.integrity', -0.04], ['pressure.scandalHeat', -0.3], ['bloc.press', -0.05]],
    fiscal: -0.004, abolishPc: 6, abolish: [['bloc.press', -5], ['nation.integrity', -3]],
    ramp: 9, record: [{ label: 'Investigations opened', per: 3 }, { label: 'Money recovered', per: 6, unit: '₦bn' }],
  },
  {
    id: 'jobs', name: 'A national youth jobs corps', pc: 0, naira: 0.4,
    blurb: 'A million young people on public works: drains, roads, classrooms. It pays for itself only in votes and calm.',
    start: [['bloc.street', 4], ['approval', 1]],
    fx: [['nation.jobs', 0.05], ['bloc.street', 0.03], ['pressure.wageGrievance', -0.12]],
    crooked: [['nation.integrity', -0.02]],
    fiscal: -0.02, abolishPc: 6, abolish: [['bloc.street', -8], ['approval', -2]],
    ramp: 6, record: [{ label: 'Young people enrolled', per: 45, unit: 'thousand', cap: 1000 }, { label: 'Classrooms and drains repaired', per: 120 }],
  },
  {
    id: 'power', name: 'A presidential task force on power', pc: 6, naira: 0.3,
    blurb: 'Engineers with the authority to cut through the ministries, the regulator and the distribution companies.',
    fx: [['nation.power', 0.07]],
    crooked: [['nation.integrity', -0.03]],
    fiscal: -0.008, abolishPc: 3, abolish: [['bloc.establishment', -2]],
    ramp: 8, record: [{ label: 'Megawatts restored', per: 70 }],
  },
  {
    id: 'zone', name: 'A special economic zone at the ports', pc: 6, naira: 0.5,
    blurb: 'Land, customs and power in one place, run by one authority. Factories come if the power holds.',
    fx: [['nation.jobs', 0.06], ['zone.SW.approval', 0.03]],
    crooked: [['nation.integrity', -0.03]],
    fiscal: 0.012, needs: { label: 'Reliable power (45 or better)', v: ['nation.power', '>=', 45], else: 0.5 },
    abolishPc: 4, abolish: [['bloc.establishment', -4], ['nation.jobs', -2]],
    ramp: 12, record: [{ label: 'Firms moved in', per: 0.7 }, { label: 'Jobs in the zone', per: 1.8, unit: 'thousand' }],
  },
  {
    id: 'tax', name: 'A large-taxpayer office', pc: 8, naira: 0,
    blurb: 'A small unit that audits the hundred largest companies and nobody else. The companies will notice before the treasury does.',
    fx: [['bloc.establishment', -0.05]],
    crooked: [['nation.integrity', -0.04]],
    fiscal: 0.015, abolishPc: 2, abolish: [['bloc.establishment', 3]],
    ramp: 8, record: [{ label: 'Large companies audited', per: 5 }, { label: 'Additional tax collected', per: 15, unit: '₦bn' }],
  },
  {
    id: 'delivery', name: 'A presidential delivery office', pc: 6, naira: 0,
    blurb: 'Twenty people who track every promise and chase every ministry. The ministries will call it interference, which is the point.',
    fx: [['nation.capacity', 0.04], ['bloc.establishment', -0.02]],
    fiscal: -0.003, abolishPc: 2, abolish: [['nation.capacity', -1]],
    ramp: 6, record: [{ label: 'Promises tracked', per: 12, cap: 240 }, { label: 'Months taken off reforms under way', per: 0.6 }],
  },
  {
    id: 'reserve', name: 'A strategic grain reserve agency', pc: 0, naira: 0.3,
    blurb: 'Buys when harvests are good and sells when prices spike. The buying contracts are where the money is, and everyone knows it.',
    fx: [['bloc.street', 0.02]],
    crooked: [['nation.integrity', -0.04], ['pressure.scandalHeat', 0.1]],
    fiscal: -0.01, inflation: 0.4, abolishPc: 3, abolish: [['bloc.street', -3]],
    ramp: 10, record: [{ label: 'Grain in the silos', per: 18, unit: 'thousand tonnes', cap: 400 }],
  },
  {
    id: 'policing', name: 'A community policing trust, with the governors', pc: 4, naira: 0.3,
    blurb: 'Federal money for local policing, spent by the states under federal audit. The governors like the money and dislike the audit.',
    start: [['bloc.party', 3]],
    fx: [['theatre.NW', -0.03], ['theatre.NC', -0.03], ['theatre.NE', -0.03], ['theatre.SW', -0.03], ['theatre.SE', -0.03], ['theatre.SS', -0.03]],
    crooked: [['nation.integrity', -0.02]],
    fiscal: -0.01, abolishPc: 4, abolish: [['bloc.party', -4]],
    ramp: 9, record: [{ label: 'Community police posts opened', per: 14 }, { label: 'Officers trained', per: 0.9, unit: 'thousand' }],
  },
  {
    id: 'fund', name: 'A sovereign wealth authority', pc: 4, naira: 0,
    blurb: 'Takes a share of every month\'s surplus and invests it for the long run. Run well, it grows. Run by the wrong person, it disappears more quietly than anything else in government.',
    fx: [['nation.fiscalSpace', -0.05], ['fund.growth', 0.058]],
    crooked: [['nation.integrity', -0.03], ['fund.growth', -0.03]],
    fiscal: 0, needs: { label: 'Money in the treasury (₦1tn or more)', v: ['nation.fiscalSpace', '>=', 1], else: 0 },
    abolishPc: 2, abolish: [['bloc.establishment', -3]],
    ramp: 6, record: [{ label: 'Invested for the long run', per: 50, unit: '₦bn' }],
  },
];

INSTITUTIONS.push(
  {
    id: 'stats', name: 'An independent national statistics bureau', pc: 4, naira: 0.05,
    blurb: 'Figures nobody in the Villa writes. It will publish the true inflation and unemployment rates, including in an election year.',
    fx: [['nation.capacity', 0.03]],
    fiscal: -0.002, abolishPc: 6, abolish: [['bloc.press', -4], ['nation.integrity', -3]],
    ramp: 6, record: [{ label: 'Surveys published', per: 2 }],
  },
  {
    id: 'regulator', name: 'A projects appraisal and environment regulator', pc: 6, naira: 0.05,
    blurb: 'Every big project is appraised before it starts: the land, the money, the people moved, the river downstream. It will say no, sometimes to you.',
    fx: [['nation.integrity', 0.02]],
    fiscal: -0.003, abolishPc: 6, abolish: [['bloc.press', -3], ['bloc.establishment', -2]],
    ramp: 8, record: [{ label: 'Projects appraised', per: 1.5 }, { label: 'Projects refused or sent back', per: 0.3 }],
  },
);

const CHARTERS: Record<string, Charter> = {
  graft: { mandate: 'Investigate and prosecute the theft of public money, whoever took it.', powers: ['Arrest and charge', 'Freeze accounts with a court order', 'Trace assets abroad'], independence: 'presidential', oversight: 'The President appoints and removes its head; the Senate confirms.', culture: 'competent' },
  jobs: { mandate: 'Put young people to work on public works.', powers: ['Hire and pay', 'Contract small works'], independence: 'presidential', oversight: 'The Ministry of Youth.', culture: 'slow' },
  power: { mandate: 'Restore electricity supply by cutting through delay.', powers: ['Direct the distribution companies on outages', 'Fast-track repairs'], independence: 'presidential', oversight: 'The President.', culture: 'competent' },
  zone: { mandate: 'Run the economic zone: land, customs and power in one place.', powers: ['Lease land', 'Clear customs', 'License firms'], independence: 'statutory', oversight: 'A board with the investors on it.', culture: 'competent' },
  tax: { mandate: 'Audit the largest companies.', powers: ['Demand records', 'Assess and collect'], independence: 'statutory', oversight: 'The revenue service and the courts.', culture: 'doctrinaire' },
  delivery: { mandate: 'Track every promise and chase every ministry.', powers: ['Demand reports', 'Publish progress'], independence: 'presidential', oversight: 'The President.', culture: 'competent' },
  reserve: { mandate: 'Buy grain when harvests are good and sell when prices spike.', powers: ['Buy and store', 'Release stocks'], independence: 'presidential', oversight: 'The Ministry of Agriculture.', culture: 'captured' },
  policing: { mandate: 'Fund local policing in the states, under federal audit.', powers: ['Grant funds', 'Audit the states'], independence: 'statutory', oversight: 'A joint board of the governors and the federal government.', culture: 'slow' },
  fund: { mandate: 'Save part of every surplus and invest it for the long run.', powers: ['Invest abroad and at home'], independence: 'statutory', oversight: 'A board, and the Assembly once a year.', culture: 'competent' },
  stats: { mandate: 'Measure the country honestly, and publish what it measures.', powers: ['Survey households and firms', 'Publish without clearance'], independence: 'statutory', oversight: 'A board of statisticians; the Assembly hears its reports.', culture: 'doctrinaire' },
  regulator: { mandate: 'Appraise every big project before it starts.', powers: ['Approve, send back or refuse a project', 'Require resettlement plans'], independence: 'statutory', oversight: 'The courts hear appeals against it.', culture: 'slow' },
};
for (const d of INSTITUTIONS) d.charter = CHARTERS[d.id];

export const INSTITUTION_BY_ID = Object.fromEntries(INSTITUTIONS.map((d) => [d.id, d]));
