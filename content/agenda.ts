import type { Cond, ExposureSpec, FlagValue, Follow, Fx, Later, Track } from '../engine/types';
import { SITUATIONAL } from './orders2';
import { MORE_TRACKS } from './tracks2';

// THE REFORM AGENDA
// Six tracks of four reforms each. A reform is launched, paid for, takes time,
// and then delivers. The President's three declared priorities cost the listed
// political capital; reforms outside them cost half as much again.

// Reforms are written at their headline cost and duration, then scaled here so tuning is one number.
const COST = 1.8;
const TIME = 1.2;
const CAPITAL = 1;

const RAW: Track[] = [
  {
    id: 'power', name: 'Light Up Nigeria', goal: 'Electricity that stays on', metric: 'nation.power',
    milestones: [
      {
        id: 'p1', name: 'Clear the gas debt', pc: 0, naira: 0.4, months: 3,
        blurb: 'The plants exist. They are idle because the gas suppliers have not been paid.',
        done: [['nation.power', 7], ['bloc.establishment', 3]],
        news: ['IDLE POWER PLANTS RETURN AS FG CLEARS GAS DEBT', 'GOVERNMENT PAY GAS DEBT. LIGHT DON IMPROVE'],
        archive: 'Cleared the power sector\'s gas debt. Idle plants came back.',
      },
      {
        id: 'p2', name: 'Rebuild the weakest transmission corridors', pc: 4, naira: 0.7, months: 9,
        blurb: 'Forty-year-old lines are why the grid collapses. Replace the worst six.',
        done: [['nation.power', 12], ['approval', 2], ['bonus.power', 0.06]],
        news: ['GRID COLLAPSES END AS SIX CORRIDORS ARE REBUILT', 'NEPA NO DEY TAKE LIGHT ANYHOW AGAIN'],
        archive: 'Rebuilt the six weakest transmission corridors.',
      },
      {
        id: 'p3', name: 'Cost-reflective tariff with a lifeline band', pc: 12, naira: 0, months: 2,
        blurb: 'Those who get twenty hours pay what it costs. The poorest are protected. The loudest are not.',
        start: [['approval', -2], ['bloc.press', -4]],
        done: [['nation.power', 7], ['bonus.fiscal', 0.02], ['bonus.power', 0.05]],
        news: ['POWER SECTOR SOLVENT FOR FIRST TIME IN A DECADE', 'LIGHT BILL COST, BUT LIGHT DEY'],
        archive: 'Made the electricity tariff cost-reflective, with a protected lifeline band.',
      },
      {
        id: 'p4', name: 'Electricity market law', pc: 15, naira: 0.1, months: 12,
        needs: { v: ['senate', '>=', 50] }, needsText: 'You do not have the Senate. Win over your senators first.',
        blurb: 'Let states and private firms generate and sell. Ends the monopoly that has failed for fifty years.',
        done: [['nation.power', 14], ['nation.capacity', 2], ['bloc.establishment', 5], ['approval', 2]],
        news: ['PRESIDENT SIGNS ELECTRICITY MARKET ACT', 'STATES CAN NOW GIVE THEIR OWN LIGHT'],
        archive: 'Signed the Electricity Market Act.',
      },
    ],
  },
  {
    id: 'security', name: 'Secure the Country', goal: 'Fewer attacks, safer roads and farms', metric: 'nation.security',
    milestones: [
      {
        id: 's1', name: 'Pay and equip the troops', pc: 0, naira: 0.35, months: 3,
        blurb: 'Allowances, fuel and radios. The unit that took three hours to move had no diesel.',
        done: [['nation.security', 6], ['bloc.establishment', 3]],
        news: ['TROOPS RECEIVE ARREARS, NEW EQUIPMENT', 'SOLDIERS DON COLLECT THEIR MONEY. AT LAST'],
        archive: 'Paid the troops\' arrears and re-equipped front-line units.',
      },
      {
        id: 's2', name: 'Forward bases in the farm belt and the North West', pc: 4, naira: 0.6, months: 8,
        blurb: 'Put the response ten minutes from the villages instead of ninety.',
        done: [['nation.security', 10], ['zone.NC.security', 4], ['zone.NW.security', 4], ['approval', 2], ['bonus.security', 0.05]],
        news: ['ATTACKS FALL SHARPLY AS FORWARD BASES OPEN', 'FARMERS RETURN: "WE CAN SLEEP NOW"'],
        archive: 'Opened forward operating bases across the farm belt and the North West.',
      },
      {
        id: 's3', name: 'Audit the defence procurement account', pc: 14, naira: 0, months: 4,
        blurb: 'Find out where the equipment budget has been going. Some senior people already know.',
        start: [['bloc.establishment', -6], ['bloc.villa', -2]],
        done: [['nation.security', 7], ['nation.integrity', 4], ['bonus.fiscal', 0.015]],
        news: ['DEFENCE AUDIT FINDS ₦300BN IN PHANTOM CONTRACTS', 'THE ARMS MONEY: SEE WHO CHOP AM'],
        archive: 'Audited the defence procurement account.',
      },
      {
        id: 's4', name: 'State police: the constitutional amendment', pc: 18, naira: 0.1, months: 14,
        needs: { v: ['senate', '>=', 56] }, needsText: 'It needs two thirds of the Senate and 24 state assemblies. Your senators and governors must be firmly with you.',
        blurb: 'Policing by people who know the terrain. The governors have wanted it for years. So have their opponents\' fears.',
        done: [['nation.security', 14], ['bloc.party', 5], ['nation.integrity', -2]],
        news: ['STATE POLICE BECOMES LAW AS 26 ASSEMBLIES RATIFY', 'STATE POLICE DON LAND. GOVERNORS, NO MISBEHAVE'],
        archive: 'Amended the Constitution to create state police.',
      },
    ],
  },
  {
    id: 'treasury', name: 'Fix the Treasury', goal: 'More revenue, less debt', metric: 'nation.fiscalSpace',
    milestones: [
      {
        id: 't1', name: 'One tax ID, automated collection', pc: 5, naira: 0.15, months: 6,
        blurb: 'Six agencies keep six lists. Merge them and collect what is already owed.',
        done: [['nation.fiscalSpace', 0.5], ['bonus.fiscal', 0.03], ['nation.capacity', 2]],
        news: ['TAX COLLECTION UP 30% UNDER UNIFIED ID', 'TAX PEOPLE DON SABI EVERYBODY NOW'],
        archive: 'Unified the tax identification system.',
      },
      {
        id: 't2', name: 'Make the oil company publish and remit', pc: 14, naira: 0, months: 5,
        blurb: 'Audited accounts, published. Revenue paid to the Federation Account, not explained away.',
        start: [['bloc.establishment', -5], ['bloc.party', -4]],
        done: [['nation.fiscalSpace', 0.8], ['bonus.fiscal', 0.03], ['nation.integrity', 4]],
        news: ['OIL COMPANY PUBLISHES FIRST AUDITED ACCOUNTS IN A DECADE', 'OIL MONEY DON START TO REACH THE ACCOUNT'],
        archive: 'Forced the national oil company to publish its accounts and remit revenue.',
      },
      {
        id: 't3', name: 'End the waivers and duty loopholes', pc: 12, naira: 0, months: 4,
        blurb: '₦1.6tn a year in import waivers, mostly to people who fund parties.',
        start: [['bloc.party', -6]],
        done: [['nation.fiscalSpace', 0.5], ['bonus.fiscal', 0.025], ['bloc.establishment', -2]],
        news: ['FG SCRAPS ₦1.6TN IN IMPORT WAIVERS', 'BIG MEN WAIVER DON END'],
        archive: 'Abolished discretionary import waivers.',
      },
      {
        id: 't4', name: 'Fiscal responsibility law with a binding debt ceiling', pc: 15, naira: 0, months: 10,
        needs: { v: ['senate', '>=', 50] }, needsText: 'You do not have the Senate. Win over your senators first.',
        blurb: 'Ties your hands, and your successor\'s. That is the point.',
        done: [['nation.debt', -10], ['bloc.establishment', 8], ['bonus.fiscal', 0.01]],
        news: ['DEBT CEILING BECOMES LAW; RATING UPGRADED', 'GOVERNMENT NO FIT BORROW ANYHOW AGAIN'],
        archive: 'Signed a fiscal responsibility law with a binding debt ceiling.',
      },
    ],
  },
  {
    id: 'clean', name: 'Clean Government', goal: 'Less stolen, more believed', metric: 'nation.integrity',
    milestones: [
      {
        id: 'c1', name: 'Open contracting', pc: 8, naira: 0, months: 3,
        blurb: 'Every award above ₦50m published: who, how much, and who else bid.',
        start: [['bloc.party', -4]],
        done: [['nation.integrity', 7], ['bloc.press', 5]],
        news: ['EVERY FEDERAL CONTRACT NOW PUBLISHED ONLINE', 'YOU FIT CHECK WHO COLLECT CONTRACT NOW'],
        archive: 'Published every federal contract above ₦50m.',
      },
      {
        id: 'c2', name: 'Anti-corruption courts with time limits', pc: 10, naira: 0.1, months: 8,
        needs: { v: ['senate', '>=', 50] }, needsText: 'You do not have the Senate. Win over your senators first.',
        blurb: 'Cases end in eighteen months instead of eighteen years.',
        done: [['nation.integrity', 8], ['approval', 1.5]],
        news: ['FIRST CONVICTIONS UNDER NEW ANTI-GRAFT COURTS', 'BIG MAN DON ENTER PRISON. FOR REAL'],
        archive: 'Created special anti-corruption courts with statutory time limits.',
      },
      {
        id: 'c3', name: 'Public asset declarations, starting with yours', pc: 12, naira: 0, months: 2,
        needs: { v: ['exposure.count', '==', 0] }, needsText: 'You cannot publish what is in the drawer.',
        blurb: 'Yours first, then the cabinet, then everyone on the federal payroll above director.',
        start: [['bloc.villa', -5]],
        done: [['nation.integrity', 7], ['approval', 3], ['bloc.press', 4]],
        news: ['PRESIDENT, CABINET PUBLISH ASSET DECLARATIONS', 'PRESIDENT SHOW US WETIN E GET. YOUR TURN, MINISTERS'],
        archive: 'Published your own asset declaration and required the cabinet to follow.',
      },
      {
        id: 'c4', name: 'An independent prosecutor', pc: 16, naira: 0.05, months: 10,
        needs: { v: ['senate', '>=', 55] }, needsText: 'The Senate will not create an office that can investigate senators unless yours are firmly with you.',
        blurb: 'Appointed for one fixed term, removable only by the Senate. Can investigate anyone, including the Villa.',
        done: [['nation.integrity', 11], ['bloc.press', 4], ['bloc.street', 4], ['bonus.integrity', 0.08]],
        news: ['INDEPENDENT PROSECUTOR\'S OFFICE OPENS', 'NOBODY IS ABOVE THE LAW? WE GO SEE'],
        archive: 'Established an independent prosecutor\'s office.',
      },
    ],
  },
  {
    id: 'service', name: 'A State That Works', goal: 'A government that can carry out an instruction', metric: 'nation.capacity',
    milestones: [
      {
        id: 'v1', name: 'Payroll audit', pc: 8, naira: 0, months: 4,
        blurb: 'Biometric verification of every federal worker. Estimates of ghost workers start at 60,000.',
        start: [['bloc.villa', -3], ['bloc.establishment', -3]],
        done: [['nation.capacity', 5], ['nation.fiscalSpace', 0.3], ['bonus.fiscal', 0.01]],
        news: ['PAYROLL AUDIT REMOVES 71,000 GHOST WORKERS', 'GHOST WORKERS DON VANISH. 71,000 OF THEM'],
        archive: 'Removed 71,000 ghost workers from the federal payroll.',
      },
      {
        id: 'v2', name: 'Merit recruitment and pay reform', pc: 8, naira: 0.3, months: 8,
        blurb: 'Hire by examination. Pay the core service enough that the best stop leaving.',
        done: [['nation.capacity', 9], ['bonus.capacity', 0.05]],
        news: ['CIVIL SERVICE HIRES BY EXAM FOR FIRST TIME IN 30 YEARS', 'NO CONNECTION, NO PROBLEM: DEM HIRE BY EXAM'],
        archive: 'Introduced merit recruitment and pay reform in the core civil service.',
      },
      {
        id: 'v3', name: 'Digital government', pc: 0, naira: 0.3, months: 8,
        blurb: 'One ID, one portal, no "come back tomorrow".',
        done: [['nation.capacity', 8], ['approval', 2], ['nation.integrity', 2]],
        news: ['PASSPORTS, PERMITS NOW ISSUED ONLINE IN 48 HOURS', 'PASSPORT FOR TWO DAYS, NO "ANYTHING FOR THE BOYS"'],
        archive: 'Put the main federal services online.',
      },
      {
        id: 'v4', name: 'Delivery unit and published scorecards', pc: 10, naira: 0, months: 6,
        blurb: 'Every ministry\'s targets and results, published quarterly. Ministers will hate it.',
        start: [['bloc.villa', -4]],
        done: [['nation.capacity', 10], ['bloc.press', 3]],
        news: ['MINISTRY SCORECARDS GO PUBLIC', 'SEE YOUR MINISTER RESULT. SOME FAIL WOEFULLY'],
        archive: 'Created a delivery unit and published ministry scorecards.',
      },
    ],
  },
  {
    id: 'food', name: 'Food on the Table', goal: 'Lower food prices', metric: 'nation.inflation',
    milestones: [
      {
        id: 'f1', name: 'Inputs before the rains', pc: 0, naira: 0.25, months: 5,
        blurb: 'Fertiliser and seed delivered in March, not in August.',
        done: [['bonus.inflation', -1.5], ['approval', 1.5]],
        news: ['HARVEST UP AS INPUTS REACH FARMERS ON TIME', 'FERTILISER REACH FARMERS BEFORE RAIN. MIRACLE'],
        archive: 'Delivered farm inputs before the planting season.',
      },
      {
        id: 'f2', name: 'Secure planting and harvest', pc: 4, naira: 0.3, months: 6,
        blurb: 'Escorts and patrols in the farm belt for the two months that matter.',
        done: [['bonus.inflation', -1.5], ['nation.security', 3], ['zone.NC.approval', 3]],
        news: ['FARMERS BACK ON ABANDONED LAND UNDER ESCORT', 'FARMERS DON RETURN TO FARM'],
        archive: 'Secured the farm belt through planting and harvest.',
      },
      {
        id: 'f3', name: 'Storage and rural roads', pc: 0, naira: 0.6, months: 10,
        blurb: 'A third of the harvest rots before it reaches a market.',
        done: [['bonus.inflation', -2], ['zone.NW.approval', 3], ['zone.NC.approval', 3]],
        news: ['POST-HARVEST LOSSES HALVED BY NEW SILOS, ROADS', 'TOMATO NO DEY ROT FOR ROAD AGAIN'],
        archive: 'Built storage and rural roads across the farm belt.',
      },
      {
        id: 'f4', name: 'Open the borders to staples when prices spike', pc: 12, naira: 0, months: 2,
        blurb: 'An automatic rule. The licence-holders who profit from scarcity fund the party.',
        start: [['bloc.party', -5], ['bloc.establishment', -3]],
        done: [['bonus.inflation', -2], ['bloc.street', 5], ['approval', 2]],
        news: ['RICE PRICES FALL AS IMPORT RULE TAKES EFFECT', 'RICE DON CHEAP SMALL. THANK GOD'],
        archive: 'Made staple imports automatic when prices spike.',
      },
    ],
  },
];

// TRADE-OFFS
// Nothing built is free to keep. Clinics need staff, bases need fuel, roads need
// maintenance; and most reforms take something from someone. These are added to
// the reforms above so that a president who builds everything must also pay for it.
const EXTRA: Record<string, { start?: Fx[]; done?: Fx[] }> = {
  p2: { done: [['bonus.fiscal', -0.01]] },
  s1: { done: [['bonus.fiscal', -0.012]] },
  s2: { done: [['bonus.fiscal', -0.018]] },
  t1: { done: [['approval', -1.5]] },
  t3: { done: [['nation.jobs', -3]] },
  c2: { start: [['bloc.party', -4]] },
  c4: { start: [['bloc.party', -6], ['bloc.villa', -4]] },
  v2: { done: [['bonus.fiscal', -0.015]] },
  v3: { start: [['bloc.establishment', -3]] },
  f1: { done: [['bonus.fiscal', -0.01]] },
  f2: { done: [['bonus.fiscal', -0.01]] },
  f4: { done: [['nation.jobs', -4]] },
  i2: { done: [['bonus.inflation', 0.5], ['bonus.fiscal', -0.01]] },
  d2: { done: [['bonus.fiscal', -0.008]] },
  d3: { done: [['bonus.fiscal', -0.008]] },
  e1: { done: [['bonus.fiscal', -0.02]] },
  e2: { done: [['bonus.fiscal', -0.02]] },
  e3: { done: [['bonus.fiscal', -0.01]] },
  w1: { done: [['bonus.fiscal', -0.008]] },
  w3: { done: [['bonus.fiscal', -0.008]] },
};

// CAPSTONES
// The fifth reform on each track. It unlocks only when the first four are
// delivered, so the list of what can be done grows as the presidency does.
const CAPSTONES: Record<string, Track['milestones'][number]> = {
  power: {
    id: 'p5', name: 'Twenty-four-hour power in ten cities', pc: 10, naira: 1.0, months: 12,
    blurb: 'Ring-fenced, metered, guaranteed. Proof that it can be done, in places big enough that nobody can call it a pilot.',
    done: [['nation.power', 12], ['nation.jobs', 6], ['approval', 4], ['bonus.jobs', 0.04], ['bonus.fiscal', -0.02]],
    news: ['TEN CITIES NOW HAVE ROUND-THE-CLOCK POWER', 'LIGHT NO DEY GO FOR TEN CITIES. GENERATOR SELLERS DEY CRY'],
    archive: 'Delivered twenty-four-hour power in ten cities.',
  },
  security: {
    id: 's5', name: 'A court and a police post in every local government', pc: 8, naira: 0.6, months: 10,
    blurb: 'Security that outlasts the offensive: somewhere to report a crime and somewhere to try it.',
    done: [['nation.security', 10], ['nation.integrity', 3], ['bonus.security', 0.05], ['bonus.fiscal', -0.02]],
    news: ['EVERY LOCAL GOVERNMENT NOW HAS A COURT AND POLICE POST', 'YOU FIT REPORT CASE FOR YOUR OWN VILLAGE NOW'],
    archive: 'Put a court and a police post in every local government.',
  },
  treasury: {
    id: 't5', name: 'A new revenue formula: states that collect, keep', pc: 18, naira: 0, months: 12,
    needs: { v: ['senate', '>=', 56] }, needsText: 'It needs two thirds of the Senate. Your senators and governors must be firmly with you.',
    blurb: 'Ends the monthly pilgrimage to Abuja to share oil money. Rich states gain. Poor states will need a floor, and a reason to vote for it.',
    start: [['bloc.party', -8]],
    done: [['bonus.fiscal', 0.05], ['nation.capacity', 3], ['bonus.jobs', 0.03], ['bloc.party', 4]],
    news: ['NEW REVENUE FORMULA ENDS MONTHLY ALLOCATION RITUAL', 'STATES GO DEY EAT WETIN DEM KILL'],
    archive: 'Rewrote the revenue formula so that states keep what they collect.',
  },
  clean: {
    id: 'c5', name: 'End immunity for serving officials', pc: 20, naira: 0, months: 14,
    needs: { v: ['senate', '>=', 58] }, needsText: 'A constitutional amendment that every governor has reason to oppose. Your senators must be solidly with you.',
    blurb: 'Governors and presidents can be prosecuted in office. Including you. Including now.',
    start: [['bloc.party', -8], ['bloc.villa', -6]],
    done: [['nation.integrity', 14], ['bloc.press', 6], ['bloc.street', 6], ['approval', 3], ['bonus.integrity', 0.08]],
    news: ['IMMUNITY CLAUSE REMOVED FROM CONSTITUTION', 'NO MORE IMMUNITY. GOVERNOR, YOUR TIME DON REACH'],
    archive: 'Removed constitutional immunity for serving officials, including yourself.',
  },
  service: {
    id: 'v5', name: 'Devolve sixty functions to the states, with the money', pc: 14, naira: 0, months: 12,
    blurb: 'Abuja stops pretending to run primary schools and rural roads. The centre gets smaller and better.',
    done: [['nation.capacity', 10], ['bonus.capacity', 0.05], ['bloc.party', 6], ['bonus.fiscal', 0.015]],
    news: ['SIXTY FEDERAL FUNCTIONS HANDED TO STATES', 'ABUJA DON REDUCE. STATE GO DO THEIR OWN WORK'],
    archive: 'Devolved sixty federal functions to the states.',
  },
  food: {
    id: 'f5', name: 'Irrigation for a million hectares', pc: 4, naira: 1.2, months: 16,
    blurb: 'Farming that does not depend on the rains. Three harvests a year where there is now one.',
    done: [['bonus.inflation', -3], ['nation.jobs', 6], ['zone.NW.approval', 4], ['zone.NE.approval', 4], ['bonus.fiscal', -0.015]],
    news: ['DRY-SEASON HARVEST BREAKS RECORDS UNDER NEW IRRIGATION', 'FARMERS DEY HARVEST THREE TIMES FOR ONE YEAR'],
    archive: 'Irrigated a million hectares.',
  },
  industry: {
    id: 'i5', name: 'Refine every barrel at home', pc: 10, naira: 1.0, months: 16,
    blurb: 'Crude sold to domestic refiners in naira; no more exporting oil to import petrol.',
    done: [['nation.jobs', 10], ['bonus.fiscal', 0.04], ['bonus.inflation', -1], ['pressure.fuelSupplyStress', -40]],
    news: ['NIGERIA STOPS IMPORTING PETROL', 'WE NO DEY IMPORT FUEL AGAIN. AFTER HOW MANY YEARS?'],
    archive: 'Ended petrol imports by refining domestically.',
  },
  digital: {
    id: 'd5', name: 'A national compute and data-centre programme', pc: 4, naira: 0.8, months: 12,
    blurb: 'Data centres on cheap gas power, and a rule that public data is processed here.',
    done: [['nation.jobs', 9], ['nation.capacity', 4], ['bonus.jobs', 0.05], ['bonus.fiscal', 0.015]],
    news: ['WEST AFRICA\'S LARGEST DATA CENTRE CLUSTER OPENS', 'BIG TECH DON COME BUILD FOR NAIJA'],
    archive: 'Built a national data-centre programme.',
  },
  people: {
    id: 'e5', name: 'Free secondary education, actually funded', pc: 10, naira: 1.0, months: 14,
    needs: { v: ['senate', '>=', 50] }, needsText: 'You do not have the Senate. Win over your senators first.',
    blurb: 'Fees, books and a meal. Ten million children who are currently hawking, farming or married.',
    done: [['approval', 6], ['bloc.street', 10], ['bonus.jobs', 0.04], ['bonus.fiscal', -0.03]],
    news: ['TEN MILLION RETURN TO SCHOOL AS FEES ARE ABOLISHED', 'SCHOOL DON FREE. PIKIN DEM DON RETURN'],
    archive: 'Made secondary education free and funded it.',
  },
  works: {
    id: 'w5', name: 'A rail backbone linking all six zones', pc: 8, naira: 1.5, months: 20,
    blurb: 'Standard gauge, north to south and east to west. The thing every government since independence has announced.',
    done: [['nation.jobs', 12], ['approval', 5], ['bonus.jobs', 0.05], ['bonus.fiscal', -0.02], ['bonus.inflation', -1]],
    news: ['RAIL NOW LINKS ALL SIX GEOPOLITICAL ZONES', 'TRAIN DON REACH EVERYWHERE. E SHOCK US'],
    archive: 'Completed a rail backbone linking all six zones.',
  },
};

export const TRACKS: Track[] = [...RAW, ...MORE_TRACKS].map((t) => ({
  ...t,
  milestones: [...t.milestones, ...(CAPSTONES[t.id] ? [CAPSTONES[t.id]] : [])].map((m) => ({
    ...m,
    start: [...(m.start ?? []), ...(EXTRA[m.id]?.start ?? [])],
    done: [...m.done, ...(EXTRA[m.id]?.done ?? [])],
    pc: Math.round(m.pc * CAPITAL), naira: Math.round(m.naira * COST * 20) / 20, months: Math.round(m.months * TIME),
  })),
}));

export const TRACK_BY_ID = Object.fromEntries(TRACKS.map((t) => [t.id, t]));
export const MILESTONE_BY_ID = Object.fromEntries(TRACKS.flatMap((t) => t.milestones.map((m) => [m.id, { track: t, m }])));

// EXECUTIVE POWERS
// Things the President can simply do. Large, immediate, and with a stated price.

export interface Order {
  id: string;
  group: 'capital' | 'economy' | 'security' | 'relief' | 'politics' | 'moment';
  /** Offered only while its moment lasts, a few at a time. */
  situational?: boolean;
  /** Months it stays on offer. */
  window?: number;
  exposure?: ExposureSpec;
  name: string;
  blurb: string;
  pc: number;
  naira: number;
  /** Months before it can be used again. 0 means once per presidency. */
  cooldown: number;
  when?: Cond;
  lockedText?: string;
  result: string;
  fx?: Fx[];
  later?: Later[];
  flags?: Record<string, FlagValue>;
  follow?: Follow[];
  news: [string, string];
  archive: string;
  sig?: 1 | 2 | 3;
  /** Use the outcome of an existing event choice instead of the fields above. */
  event?: [string, string];
}

const subsidised: Cond = { not: { flag: 'policy.subsidy', is: 'removed' } };

export const STANDING: Order[] = [
  {
    id: 'country', group: 'capital', name: 'Go over their heads to the country', pc: 0, naira: 0, cooldown: 5,
    when: { v: ['approval', '>=', 47] }, lockedText: 'You need approval of 47% or better. An unpopular President who appeals to the public is simply reminded.',
    blurb: 'Town halls, radio, a week on the road. Turn public support into leverage over the politicians. It spends a little of the goodwill it uses.',
    result: 'You spend a week telling the country what you want and who is in the way. Senators\' phones ring. Several of them call yours.',
    fx: [['pc', 12], ['approval', -1.5], ['bloc.party', -2]],
    news: ['PRESIDENT TAKES AGENDA DIRECT TO THE PUBLIC', 'PRESIDENT DON CARRY THE MATTER COME MEET US'],
    archive: 'Went over the politicians\' heads to the public.',
  },
  {
    id: 'projects', group: 'capital', name: 'Fund the districts', pc: 0, naira: 0.3, cooldown: 5,
    blurb: 'A road, a clinic or a transformer for every legislator to commission, built to specification and published. Capital bought with money.',
    result: 'Four hundred and sixty-nine projects are approved. Each has a plaque, and each plaque has a legislator\'s name above yours.',
    fx: [['pc', 11], ['bloc.party', 4], ['nation.jobs', 1]],
    news: ['FG APPROVES 469 CONSTITUENCY PROJECTS', 'EVERY SENATOR GET PROJECT TO COMMISSION'],
    archive: 'Funded a project in every legislative district.',
  },
  {
    id: 'boards', group: 'capital', name: 'Hand out the boards', pc: 0, naira: 0, cooldown: 8,
    blurb: 'Four hundred board seats, to whoever the party names. The fastest capital there is, paid for in the quality of your own agencies.',
    result: 'The list is published on a Friday evening. Several appointees are surprised to learn which agency they now chair, and where it is.',
    fx: [['pc', 12], ['bloc.party', 6], ['nation.integrity', -3], ['nation.capacity', -1.5]],
    news: ['PRESIDENT NAMES 400 TO FEDERAL BOARDS', 'BOARD APPOINTMENT DON LAND. PARTY PEOPLE DEY JUBILATE'],
    archive: 'Distributed four hundred board seats to the party.',
  },
  {
    id: 'subsidy_end', group: 'economy', name: 'End the petrol subsidy', pc: 15, naira: 0, cooldown: 0,
    blurb: 'The largest single decision available to you. Frees about ₦2tn a year. The pump price rises by half overnight.',
    when: subsidised, lockedText: 'The subsidy has already been removed.',
    event: ['subsidy.memo', 'remove'],
    result: '', news: ['', ''], archive: '',
  },
  {
    id: 'price_freeze', group: 'economy', name: 'Freeze the pump price', pc: 0, naira: 0, cooldown: 0,
    blurb: 'Fix petrol below cost by presidential directive. Popular today. The bill arrives monthly.',
    when: { not: { flag: 'policy.subsidy', is: 'full' } }, lockedText: 'The price is already frozen.',
    result: 'The pump price is cut and fixed by directive. Motorists cheer. The national oil company begins keeping a second set of numbers.',
    fx: [['nation.petrolPrice', -200], ['bonus.fiscal', -0.05], ['approval', 5], ['bloc.street', 8], ['bloc.establishment', -9], ['pressure.fuelSupplyStress', 20], ['pressure.wageGrievance', -10]],
    flags: { 'policy.subsidy': 'full' },
    follow: [{ event: 'subsidy.return', after: [12, 16], when: { not: { flag: 'policy.subsidy', is: 'removed' } } }],
    news: ['PRESIDENT ORDERS PUMP PRICE CUT, FREEZE', 'PETROL DON CHEAP! PRESIDENT DO AM'],
    archive: 'Froze the pump price of petrol by directive.', sig: 3,
  },
  {
    id: 'bond', group: 'economy', name: 'Issue a $3bn Eurobond', pc: 0, naira: 0, cooldown: 12,
    blurb: 'Money now. Debt service later, in dollars, and dearer whenever the naira falls.',
    when: { v: ['nation.debt', '<', 100] }, lockedText: 'Nobody will lend at this level of debt.',
    result: 'The bond is oversubscribed at a coupon the Finance Ministry describes as "competitive" and the Debt Office describes privately.',
    fx: [['nation.fiscalSpace', 2], ['debt.eurobond', 2]],
    news: ['NIGERIA RAISES $3BN IN EUROBOND SALE', 'WE DON BORROW ANOTHER $3BN. WHO GO PAY?'],
    archive: 'Issued a $3bn Eurobond.', sig: 2,
  },
  {
    id: 'print', group: 'economy', name: 'Direct the central bank to finance the budget', pc: 6, naira: 0, cooldown: 12,
    blurb: 'The fastest money there is. It goes on the central bank overdraft, and every naira of it shows up in the price of bread until it is paid back.',
    result: 'The advance is extended. The Governor complies in writing and under protest.',
    fx: [['nation.fiscalSpace', 2], ['debt.ways', 2], ['bonus.inflation', 1.5], ['bloc.establishment', -8]],
    news: ['CENTRAL BANK EXTENDS ₦4TN ADVANCE TO FG', 'DEM DON START TO PRINT MONEY. PRICE GO CRAZE'],
    archive: 'Ordered the central bank to finance the budget.', sig: 3,
  },
  {
    id: 'tax', group: 'economy', name: 'Raise VAT', pc: 10, naira: 0, cooldown: 0,
    blurb: 'Permanent revenue. Everyone pays it, and everyone notices.',
    result: 'VAT rises from 7.5% to 12.5%. Revenue follows. So does the price of everything with a receipt.',
    fx: [['bonus.fiscal', 0.05], ['nation.inflation', 1.5], ['approval', -3], ['bloc.street', -5], ['bloc.establishment', 3]],
    news: ['VAT RISES TO 12.5%', 'VAT DON GO UP. EVERYTHING GO COST MORE'],
    archive: 'Raised VAT to 12.5%.', sig: 3,
  },
  {
    id: 'relief', group: 'relief', name: 'Emergency relief: cash to 15 million households', pc: 0, naira: 0.5, cooldown: 10,
    blurb: 'Direct transfers. Takes the edge off hardship for a season. It is not a policy; it is a painkiller.',
    result: 'The transfers go out over three weeks. For the first time in months, the motor parks are discussing something other than prices.',
    fx: [['approval', 4], ['bloc.street', 9], ['pressure.wageGrievance', -15]],
    news: ['15 MILLION HOUSEHOLDS RECEIVE EMERGENCY TRANSFER', 'ALERT DON ENTER FOR 15 MILLION HOUSE'],
    archive: 'Paid emergency cash transfers to 15 million households.', sig: 2,
  },
  {
    id: 'duties', group: 'relief', name: 'Suspend import duties on staple foods', pc: 8, naira: 0.2, cooldown: 0,
    blurb: 'Rice, wheat and maize come in duty-free. Prices fall. Local millers and licence-holders will be at the Villa by Friday.',
    result: 'Duties are suspended for 180 days and then, quietly, indefinitely. A bag of rice falls by a fifth.',
    fx: [['bonus.inflation', -2.5], ['approval', 2], ['bloc.street', 4], ['bloc.party', -4], ['bloc.establishment', -3]],
    news: ['FG SUSPENDS DUTIES ON RICE, WHEAT, MAIZE', 'RICE GO CHEAP: PRESIDENT REMOVE IMPORT DUTY'],
    archive: 'Suspended import duties on staple foods.', sig: 2,
  },
  {
    id: 'offensive', group: 'security', name: 'Order a sustained military offensive', pc: 5, naira: 0.4, cooldown: 10,
    blurb: 'Air and ground operations against the camps. Results in months, not days, and not without cost.',
    result: 'Operations begin in three states. The Defence Headquarters issues daily figures. You ask for weekly ones that have been checked.',
    fx: [['nation.security', 3], ['bloc.establishment', 2]],
    later: [{ after: [3, 5], fx: [['nation.security', 6], ['approval', 2]], label: 'The military offensive clears the main camps.', note: ['TROOPS OVERRUN MAJOR BANDIT CAMPS', 'ARMY DON CLEAR THE BUSH. ROAD DON SAFE SMALL'] }],
    news: ['PRESIDENT ORDERS MAJOR OFFENSIVE IN THREE STATES', 'PRESIDENT DON SEND ARMY ENTER BUSH'],
    archive: 'Ordered a sustained military offensive.', sig: 2,
  },
  {
    id: 'chiefs', group: 'security', name: 'Replace the service chiefs', pc: 12, naira: 0, cooldown: 30,
    blurb: 'New commanders, chosen on record. The ones you remove have friends.',
    result: 'Four new service chiefs are named at dawn. The outgoing ones learn of it from the radio, which is traditional.',
    fx: [['bloc.establishment', -6], ['bloc.villa', -2], ['approval', 1.5]],
    later: [{ after: [4, 6], fx: [['nation.security', 7], ['nation.capacity', 1]], label: 'The new service chiefs\' reorganisation takes effect.' }],
    news: ['PRESIDENT SACKS SERVICE CHIEFS, NAMES REPLACEMENTS', 'SERVICE CHIEFS DON GO. NEW ONES, OYA PERFORM'],
    archive: 'Replaced the service chiefs.', sig: 3,
  },
  {
    id: 'reshuffle', group: 'politics', name: 'Reshuffle the cabinet on performance', pc: 10, naira: 0, cooldown: 20,
    blurb: 'Remove the six weakest ministers regardless of who sponsored them.',
    result: 'Six ministers are dropped. Their sponsors are informed afterwards. The replacements are told, in writing, what they will be measured on.',
    fx: [['nation.capacity', 4], ['bloc.party', -7], ['bloc.villa', 3], ['bloc.press', 3], ['approval', 1.5]],
    news: ['SIX MINISTERS DROPPED IN CABINET SHAKE-UP', 'SIX MINISTERS DON LOSE WORK. GOVERNORS DEY VEX'],
    archive: 'Reshuffled the cabinet on performance.', sig: 2,
  },
  {
    id: 'patronage', group: 'politics', name: 'Reshuffle the cabinet for the party', pc: 0, naira: 0, cooldown: 20,
    blurb: 'Give the governors and the elders the ministries they have been asking for.',
    result: 'Eight ministries change hands. The party is delighted. Three of the new ministers ask where their ministries are.',
    fx: [['bloc.party', 12], ['pc', 6], ['nation.capacity', -4], ['nation.integrity', -3], ['bloc.press', -3]],
    news: ['PRESIDENT BRINGS PARTY STALWARTS INTO CABINET', 'CABINET DON TURN TO PARTY MEETING'],
    archive: 'Reshuffled the cabinet to satisfy the party.', sig: 2,
  },
];

export const ORDERS: Order[] = [...STANDING, ...SITUATIONAL];

export const ORDER_BY_ID = Object.fromEntries(ORDERS.map((o) => [o.id, o]));
