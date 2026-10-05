import type { ScenarioAssets } from '../engine/public';
import type { BlocId, DebtId, FlagValue, FundId, Nation, Pressures, ZoneId } from '../engine/types';

// STARTING SCENARIOS
// A new world begins from a chosen inheritance. Each is also a state that play
// can produce: hand over a country in this condition and your successor starts
// here.

/** `assets`: the operating asset each inheritance starts with (see content/dossiers.ts); condition 0–1 scales its output. */
export interface Scenario extends ScenarioAssets {
  id: string;
  name: string;
  difficulty: string;
  /** What the handover notes say. */
  blurb: string;
  /** What the test is. */
  test: string;
  nation?: Partial<Nation>;
  pressures?: Partial<Pressures>;
  blocs?: Partial<Record<BlocId, number>>;
  debts?: Partial<Record<DebtId, number>>;
  funds?: Partial<Record<FundId, number>>;
  theatres?: Partial<Record<ZoneId, number>>;
  oil?: number;
  /** Where the oil price is heading, by month: [until turn, price]. After the last, the usual level. */
  oilPath?: [number, number][];
  /** Added to approval in every zone at the start. */
  approval?: number;
  flags?: Record<string, FlagValue>;
  /** Reforms the predecessor had already delivered. */
  done?: string[];
  /** What the previous administration did, for the archive: [months ago, headline, what it touched]. */
  history: [number, string, Record<string, number>][];
  /** The outgoing government's own account, for the inauguration paper. */
  farewell: string;
}

const STANDARD_HISTORY: Scenario['history'] = [
  [30, 'Signed the university funding agreement. No budget line was created.', { 'flag:uni.agreement': 1, 'pressure.wageGrievance': 6 }],
  [24, 'Stopped paying the gas suppliers. The power plants went idle.', { 'nation.power': -6, 'debt.gas': 0.7 }],
  [20, 'Deferred maintenance of the transmission network for a third year.', { 'nation.power': -6 }],
  [16, 'Had the central bank lend the government ₦4.8tn it created for the purpose.', { 'debt.ways': 4.8, 'nation.inflation': 3 }],
  [14, 'Capped the pump price of petrol and funded the difference by borrowing.', { 'nation.fiscalSpace': -1.2, 'nation.debt': 6, 'pressure.fuelSupplyStress': 12 }],
  [9, 'Borrowed to pay salaries, and left contractors and pensioners unpaid.', { 'nation.debt': 5, 'debt.contractors': 1.2, 'debt.pensions': 0.6 }],
  [6, 'Announced that the refinery was 95% complete.', { 'counter.refinery': 1 }],
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'standard', assets: [{ asset: 'wheat', site: 'KN', condition: 0.35 }], // working on a third of its hectares; pumps unserviced for four years
    name: 'The Standard Inheritance', difficulty: 'Normal',
    blurb: 'Everything is fragile and nothing has broken yet. A petrol subsidy nobody admits to, two thirds of revenue going on interest, ₦2.5tn of unpaid bills, and a university agreement signed eleven years ago and never funded.',
    test: 'Whether you can fix any of it before it breaks.',
    history: STANDARD_HISTORY,
    farewell: 'OUTGOING ADMINISTRATION SAYS IT IS LEAVING THE ECONOMY "ON A SOUND FOOTING"',
  },
  {
    id: 'boom', assets: [{ asset: 'coastal', site: 'LA', condition: 0.4 }], // the first stretch open and busy, the rest surveyed
    name: 'The Boom', difficulty: 'Easy to survive, hard to govern well',
    blurb: 'Oil is at $98. The stabilisation account is full, the treasury is flush and the country is in a generous mood. Institutions are as weak as ever, every governor expects a share, and the price will not stay where it is.',
    test: 'Whether you save anything before the price falls, some time in your second year.',
    nation: { fiscalSpace: 3.4, integrity: 22, capacity: 30, inflation: 19 },
    funds: { buffer: 2.4 },
    blocs: { street: 60, party: 66, establishment: 58 },
    debts: { pensions: 0.2, contractors: 0.8 },
    oil: 98, oilPath: [[15, 96], [40, 50]],
    approval: 4,
    flags: { 'scenario.boom': true },
    history: [
      [26, 'Spent an oil windfall on a 40% rise in the cost of running the government.', { 'nation.capacity': -3, 'bonus.fiscal': -0.02 }],
      [18, 'Shared the excess crude account with the governors, twice.', { 'bloc.party': 6, 'nation.integrity': -3 }],
      [12, 'Signed the university funding agreement. No budget line was created.', { 'flag:uni.agreement': 1 }],
      [6, 'Announced that the refinery was 95% complete.', { 'counter.refinery': 1 }],
    ],
    farewell: 'OUTGOING ADMINISTRATION: "WE ARE LEAVING THE TREASURY FULL"',
  },
  {
    id: 'morning', assets: [{ asset: 'export_power', site: 'NI', condition: 0.8 }], // working, selling power for dollars
    name: 'The Morning After', difficulty: 'Hard',
    blurb: 'Your predecessor defended the currency until the reserves ran out. The naira was let go in the final month. Inflation is above 30%, the treasury is all but empty, ₦3.5tn is unpaid, and a lender\'s programme is on the table with its conditions attached.',
    test: 'Whether you can stabilise a country with nothing in the account and nobody willing to wait.',
    nation: { inflation: 30, petrolPrice: 1150, fiscalSpace: 0.6, jobs: 32 },
    pressures: { wageGrievance: 46, fuelSupplyStress: 40 },
    blocs: { street: 40, establishment: 38, party: 54 },
    debts: { eurobond: 6.6, ways: 5.6, gas: 0.9, contractors: 1.7, pensions: 0.9 },
    funds: { buffer: 0 },
    approval: -3,
    flags: { 'scenario.morning': true },
    history: [
      [22, 'Spent the foreign reserves defending an exchange rate nobody believed.', { 'nation.debt': 8, 'debt.eurobond': 1.7 }],
      [15, 'Had the central bank lend the government ₦5.6tn it created for the purpose.', { 'debt.ways': 5.6, 'nation.inflation': 6 }],
      [9, 'Stopped paying contractors, pensioners and gas suppliers.', { 'debt.contractors': 1.7, 'debt.pensions': 0.9, 'debt.gas': 0.9 }],
      [1, 'Let the naira go, in the last month, and left for the airport.', { 'nation.inflation': 9, 'nation.petrolPrice': 300 }],
    ],
    farewell: 'OUTGOING PRESIDENT: "HISTORY WILL VINDICATE THE DEFENCE OF THE NAIRA"',
  },
  {
    id: 'scandal', assets: [{ asset: 'hospital', site: 'FC', condition: 1 }], // open, staffed and good
    name: 'After the Scandal', difficulty: 'Hard, political',
    blurb: 'Your predecessor was removed from office. Integrity and public trust are at the floor, the party is split between those who voted for the removal and those who did not, the press is in open season, and the street expects prosecutions.',
    test: 'Whether you clean house and keep a party, or keep the party and the stain.',
    nation: { integrity: 14, capacity: 30 },
    pressures: { scandalHeat: 68 },
    blocs: { party: 44, press: 40, street: 46, villa: 48, establishment: 46 },
    approval: -4,
    flags: { 'scenario.scandal': true, 'inherit.exposures': true },
    history: [
      [20, 'Awarded ₦900bn in contracts to eleven companies registered in the same week.', { 'nation.integrity': -8, 'pressure.scandalHeat': 20 }],
      [11, 'Ignored three rulings of the Supreme Court.', { 'nation.integrity': -5 }],
      [4, 'Was removed from office by the National Assembly, 81 votes to 22.', { 'bloc.party': -14, 'pressure.scandalHeat': 25 }],
      [2, 'The Vice President completed the term and signed nothing.', { 'nation.capacity': -3 }],
    ],
    farewell: 'REMOVED PRESIDENT\'S FILES "ARE BEING STUDIED" — ATTORNEY GENERAL',
  },
  {
    id: 'reformer', assets: [{ asset: 'hub', site: 'LA', condition: 0.85 }], // twelve firms trading and a waiting list
    name: 'The Reformer\'s Handover', difficulty: 'Normal; a test of restraint',
    blurb: 'Your predecessor ended the subsidy, cleared the gas debt, unified the tax system and lost the election for it. Revenue is rising and the books are sounder than they have been in twenty years. Prices are brutal, labour is furious, and the easy applause is in undoing all of it.',
    test: 'Whether you keep what was done long enough for it to pay.',
    nation: { inflation: 31, petrolPrice: 1480, integrity: 38, capacity: 42, fiscalSpace: 1.9, power: 37 },
    pressures: { wageGrievance: 62, fuelSupplyStress: 8 },
    blocs: { street: 36, establishment: 60, party: 52 },
    debts: { eurobond: 5, bonds: 8.6, ways: 2.6, gas: 0, contractors: 0.6 },
    approval: -5,
    flags: { 'policy.subsidy': 'removed', 'scenario.reformer': true },
    done: ['p1', 't1'],
    history: [
      [28, 'Ended the petrol subsidy.', { 'flag:policy.subsidy': 1, 'nation.petrolPrice': 530 }],
      [20, 'Cleared the power sector\'s gas debt and unified the tax identification system.', { 'nation.power': 7, 'bonus.fiscal': 0.03 }],
      [12, 'Paid down the central bank overdraft by half.', { 'debt.ways': -2.2 }],
      [1, 'Lost the election and conceded on the night.', { approval: 0 }],
    ],
    farewell: 'DEFEATED PRESIDENT: "I DID WHAT WAS NECESSARY. YOU ARE WELCOME"',
  },
  {
    id: 'emergency', assets: [{ asset: 'rice', site: 'KB', condition: 0.7 }], // working, inside a theatre that is getting worse
    name: 'The Long Emergency', difficulty: 'Hard, and grave',
    blurb: 'Security has collapsed across the North West, the North East and the farm belt. Defence takes most of the budget, the farms are emptying, food prices follow, and the governors want their own police.',
    test: 'Whether you can make the country safe before anything else becomes possible.',
    nation: { inflation: 28, jobs: 30, fiscalSpace: 1.2 },
    theatres: { NW: 85, NE: 87, NC: 83, SW: 56, SE: 64, SS: 62 },
    blocs: { establishment: 46, street: 46 },
    approval: -3,
    flags: { 'scenario.emergency': true },
    history: [
      [26, 'Withdrew the forward bases in the farm belt to save money.', { 'nation.security': -8 }],
      [18, 'Left the troops\' allowances unpaid for eleven months.', { 'nation.security': -6 }],
      [10, 'Declared the war over, at a rally.', { 'nation.security': -4 }],
      [6, 'Announced that the refinery was 95% complete.', { 'counter.refinery': 1 }],
    ],
    farewell: 'OUTGOING ADMINISTRATION: INSECURITY "A GLOBAL PHENOMENON"',
  },
];

export const SCENARIO_BY_ID = Object.fromEntries(SCENARIOS.map((x) => [x.id, x]));
