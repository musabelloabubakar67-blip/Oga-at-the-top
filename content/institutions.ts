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
}

export const INSTITUTIONS: InstitutionDef[] = [
  {
    id: 'graft', name: 'The anti-corruption agency, under a chief you appoint', pc: 8, naira: 0,
    blurb: 'An agency with a head who answers to you. An honest, able chief makes cases stick and frightens the right people. A chief who is neither protects whoever they serve, starting with you.',
    start: [['bloc.press', 3], ['bloc.party', -4]],
    fx: [['nation.integrity', 0.06], ['pressure.scandalHeat', -0.15], ['bloc.party', -0.05]],
    crooked: [['nation.integrity', -0.04], ['pressure.scandalHeat', -0.3], ['bloc.press', -0.05]],
    fiscal: -0.004, abolishPc: 6, abolish: [['bloc.press', -5], ['nation.integrity', -3]],
  },
  {
    id: 'jobs', name: 'A national youth jobs corps', pc: 0, naira: 0.4,
    blurb: 'A million young people on public works: drains, roads, classrooms. It pays for itself only in votes and calm.',
    start: [['bloc.street', 4], ['approval', 1]],
    fx: [['nation.jobs', 0.05], ['bloc.street', 0.03], ['pressure.wageGrievance', -0.12]],
    crooked: [['nation.integrity', -0.02]],
    fiscal: -0.02, abolishPc: 6, abolish: [['bloc.street', -8], ['approval', -2]],
  },
  {
    id: 'power', name: 'A presidential task force on power', pc: 6, naira: 0.3,
    blurb: 'Engineers with the authority to cut through the ministries, the regulator and the distribution companies.',
    fx: [['nation.power', 0.07]],
    crooked: [['nation.integrity', -0.03]],
    fiscal: -0.008, abolishPc: 3, abolish: [['bloc.establishment', -2]],
  },
  {
    id: 'zone', name: 'A special economic zone at the ports', pc: 6, naira: 0.5,
    blurb: 'Land, customs and power in one place, run by one authority. Factories come if the power holds.',
    fx: [['nation.jobs', 0.06], ['zone.SW.approval', 0.03]],
    crooked: [['nation.integrity', -0.03]],
    fiscal: 0.012, needs: { label: 'Reliable power (45 or better)', v: ['nation.power', '>=', 45], else: 0.5 },
    abolishPc: 4, abolish: [['bloc.establishment', -4], ['nation.jobs', -2]],
  },
  {
    id: 'tax', name: 'A large-taxpayer office', pc: 8, naira: 0,
    blurb: 'A small unit that audits the hundred largest companies and nobody else. The companies will notice before the treasury does.',
    fx: [['bloc.establishment', -0.05]],
    crooked: [['nation.integrity', -0.04]],
    fiscal: 0.015, abolishPc: 2, abolish: [['bloc.establishment', 3]],
  },
  {
    id: 'delivery', name: 'A presidential delivery office', pc: 6, naira: 0,
    blurb: 'Twenty people who track every promise and chase every ministry. The ministries will call it interference, which is the point.',
    fx: [['nation.capacity', 0.04], ['bloc.establishment', -0.02]],
    fiscal: -0.003, abolishPc: 2, abolish: [['nation.capacity', -1]],
  },
  {
    id: 'reserve', name: 'A strategic grain reserve agency', pc: 0, naira: 0.3,
    blurb: 'Buys when harvests are good and sells when prices spike. The buying contracts are where the money is, and everyone knows it.',
    fx: [['bloc.street', 0.02]],
    crooked: [['nation.integrity', -0.04], ['pressure.scandalHeat', 0.1]],
    fiscal: -0.01, inflation: 0.4, abolishPc: 3, abolish: [['bloc.street', -3]],
  },
  {
    id: 'policing', name: 'A community policing trust, with the governors', pc: 4, naira: 0.3,
    blurb: 'Federal money for local policing, spent by the states under federal audit. The governors like the money and dislike the audit.',
    start: [['bloc.party', 3]],
    fx: [['theatre.NW', -0.03], ['theatre.NC', -0.03], ['theatre.NE', -0.03], ['theatre.SW', -0.03], ['theatre.SE', -0.03], ['theatre.SS', -0.03]],
    crooked: [['nation.integrity', -0.02]],
    fiscal: -0.01, abolishPc: 4, abolish: [['bloc.party', -4]],
  },
  {
    id: 'fund', name: 'A sovereign wealth authority', pc: 4, naira: 0,
    blurb: 'Takes a share of every month\'s surplus and invests it for the long run. Run well, it grows. Run by the wrong person, it disappears more quietly than anything else in government.',
    fx: [['nation.fiscalSpace', -0.05], ['fund.growth', 0.058]],
    crooked: [['nation.integrity', -0.03], ['fund.growth', -0.03]],
    fiscal: 0, needs: { label: 'Money in the treasury (₦1tn or more)', v: ['nation.fiscalSpace', '>=', 1], else: 0 },
    abolishPc: 2, abolish: [['bloc.establishment', -3]],
  },
];

export const INSTITUTION_BY_ID = Object.fromEntries(INSTITUTIONS.map((d) => [d.id, d]));
