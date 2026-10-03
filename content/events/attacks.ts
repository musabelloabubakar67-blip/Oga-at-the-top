import type { Cond, GameEvent } from '../../engine/types';

// DELIVERED REFORMS UNDER ATTACK
// Whoever lost from a reform comes back for it once it is law: with a lobby,
// with a repeal bill, with a governor who will not implement it, or with a
// court someone can reach. Each file names the reform and who is coming for it.

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });
const after: Cond = { turn: [10] };

export const ATTACKS: GameEvent[] = [
  {
    id: 'reform.lobby', kind: 'recurring', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3, cooldown: 10, weight: 12,
    cast: { R: 'attackedReform', BY: 'reformLoserTycoon' }, when: after,
    office: 'Office of the Chief of Staff', stamp: 'CONFIDENTIAL',
    title: '{BY_SHORT} wants {R} undone',
    body: [
      '{BY} has spent a year living with {R}. The year is over. The lawyers have drafted amendments that would leave the reform\'s name and remove most of its teeth, and a quiet word has reached the Chief of Staff about what gratitude would look like.',
      'Agree and the reform is hollowed out. Refuse and {BY_SHORT} becomes an enemy with money.',
    ],
    reads: [{ role: 'cos', good: 'It is your reform, {SIR}. It is also their money, and they have more patience than we have months.' }],
    choices: [
      { id: 'hold', label: 'Refuse. The reform stands as passed', pc: 6, outcomes: [{
        result: '{BY_SHORT} is told no, politely, in writing. The reply comes through the newspapers.',
        fx: [['tycoon.$BY', -12], ['bloc.press', 2]], ops: [['weaken', '$R', 0]],
        news: ['FG REJECTS MOVES TO WATER DOWN {R}', 'GOVERNMENT SAY NO TO {BY_SHORT}'], archive: 'Refused to let {BY} water down {R}.', sig: 2 }] },
      { id: 'amend', label: 'Agree amendments that save face on both sides', outcomes: [{
        result: 'The amendments pass with the reform\'s name intact. Half of what it did goes with them.',
        fx: [['tycoon.$BY', 10], ['bloc.establishment', 2]], ops: [['weaken', '$R', 0.5]],
        news: ['FG AMENDS {R} AFTER INDUSTRY TALKS', 'DEM DON SOFTEN {R}'], archive: 'Agreed amendments that weakened {R}.', sig: 2 }] },
      { id: 'sell', label: 'Let them have it, for a consideration', outcomes: [{
        result: 'The reform is quietly suspended "pending review". Something arrives in the drawer that reviews will never find.',
        fx: [['tycoon.$BY', 16], ['nation.integrity', -3], ['purse', 15]], ops: [['weaken', '$R', 1]],
        exposure: { kind: 'personal', amount: 15, witnesses: ['cos'], trail: 2 },
        news: ['{R} SUSPENDED PENDING REVIEW', 'THE REFORM DON STOP. NOBODY KNOW WHY'], archive: 'Let {BY} have {R} repealed, for a consideration.', sig: 3 }] },
    ],
  },
  {
    id: 'reform.governors', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, cooldown: 10, weight: 12,
    cast: { R: 'attackedReform', BY: 'reformLoserGovernor' }, when: after,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'URGENT',
    title: '{BY_SHORT} will not implement {R}',
    body: [
      '{BY} has told the governors\' forum that {R} will not be implemented in any state that values its independence. Several states have taken the hint. The reform is law in Abuja and a rumour everywhere else.',
    ],
    reads: [{ role: 'sap', good: 'A law the states will not carry out is a press release, {SIR}. Either make them, pay them, or let it shrink.' }],
    choices: [
      { id: 'force', label: 'Make them: withhold their federal grants until they comply', pc: 6, outcomes: [{
        result: 'The grants are held. {BY_SHORT} complies within a month and holds a press conference about it within a week.',
        fx: [['person.$BY', -12], ['bloc.party', -3]], ops: [['weaken', '$R', 0]],
        news: ['FG WITHHOLDS GRANTS FROM DEFIANT STATES', 'GOVERNMENT HOLD GOVERNORS MONEY'], archive: 'Forced {BY} to implement {R}.', sig: 2 }] },
      { id: 'pay', label: 'Pay them: a federal grant for implementation', naira: 0.4, outcomes: [{
        result: 'The money goes out. The reform goes in. Each governor discovers a passion for it.',
        fx: [['person.$BY', 6]], ops: [['weaken', '$R', 0]],
        news: ['STATES TO GET FUNDS TO IMPLEMENT {R}', 'GOVERNORS DON COLLECT MONEY TO DO WETIN LAW SAY'], archive: 'Paid the states to implement {R}.', sig: 1 }] },
      { id: 'shrink', label: 'Let it shrink', outcomes: [{
        result: 'The reform applies where governors want it to, which is not many places.',
        fx: [['person.$BY', 8]], ops: [['weaken', '$R', 0.5]],
        news: ['{R} STALLS IN THE STATES', 'THE REFORM NO REACH STATES'], archive: 'Let {R} shrink in the states.', sig: 1 }] },
    ],
  },
  {
    id: 'reform.repeal', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 4, cooldown: 12, weight: 10,
    cast: { R: 'attackedReform' }, when: { all: [after, v('senate', '<', 52)] },
    office: 'Office of the Senate President', stamp: 'URGENT',
    title: 'The Senate moves to repeal {R}',
    body: [
      'A repeal bill for {R} has passed first reading with the votes of senators who voted for it two years ago. The people who lost from it have been generous to the people who can undo it.',
      'You have about {SENATE} senators. A repeal needs a majority; overriding your veto needs two thirds.',
    ],
    reads: [{ role: 'sap', good: 'Whip it and you spend capital you will need, {SIR}. Veto it and you find out how many senators are still yours.' }],
    choices: [
      { id: 'whip', label: 'Whip the senators', pc: 10, outcomes: [
        { when: v('senate', '>=', 42), result: 'The bill dies in committee. The committee chairman is thanked by telephone.',
          fx: [['bloc.party', -2]], ops: [['weaken', '$R', 0]],
          news: ['REPEAL BILL DIES IN COMMITTEE', 'SENATE NO FIT REMOVE THE REFORM'], archive: 'Whipped the Senate to save {R}.', sig: 2 },
        { result: 'The whip fails. The repeal passes, and so does the override.',
          fx: [['bloc.party', -4], ['pc', -4]], ops: [['weaken', '$R', 1]],
          news: ['SENATE REPEALS {R}', 'SENATE DON CANCEL {R}'], archive: 'Failed to stop the Senate repealing {R}.', sig: 3 },
      ] },
      { id: 'veto', label: 'Let it pass, then veto it', pc: 5, outcomes: [
        { when: v('senate', '>=', 35), result: 'The veto holds. The Senate cannot find two thirds, and spends a week saying so.',
          fx: [['bloc.party', -4], ['bloc.press', 2]], ops: [['weaken', '$R', 0]],
          news: ['PRESIDENT VETOES REPEAL OF {R}', 'PRESIDENT NO SIGN. REFORM STAND'], archive: 'Vetoed the repeal of {R}.', sig: 2 },
        { result: 'The Senate overrides the veto with four votes to spare. It is the first override in a decade.',
          fx: [['bloc.party', -6], ['pc', -6]], ops: [['weaken', '$R', 1]],
          news: ['SENATE OVERRIDES PRESIDENT; {R} REPEALED', 'SENATE DON OVERRIDE PRESIDENT'], archive: 'Was overridden by the Senate over {R}.', sig: 3 },
      ] },
      { id: 'deal', label: 'Accept amendments instead of repeal', outcomes: [{
        result: 'The repeal is withdrawn in exchange for amendments. The reform survives with less in it.',
        fx: [['bloc.party', 4]], ops: [['weaken', '$R', 0.5]],
        news: ['SENATE, PRESIDENCY AGREE AMENDMENTS TO {R}', 'DEM DON AGREE TO CUT THE REFORM SMALL'], archive: 'Accepted amendments to {R} to stop a repeal.', sig: 1 }] },
    ],
  },
  {
    id: 'reform.court', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, cooldown: 12, weight: 10,
    cast: { R: 'attackedReform', BY: 'reformLoser' }, when: { all: [after, { any: [v('bench.bought', '>=', 1), v('bench.hostile', '>=', 2)] }] },
    office: 'Office of the Attorney General', stamp: 'URGENT',
    title: '{R} is in the Supreme Court',
    body: [
      'A suit filed on behalf of {BY} asks the Supreme Court to strike down {R} as unconstitutional. The argument is thin. Whether that matters depends on who is sitting.',
      { when: v('bench.honest', '>=', 4), text: 'Most of the bench cannot be reached. The Attorney General expects to win.' },
      { when: v('bench.honest', '<', 4), text: 'Enough of the bench can be reached that the Attorney General will not predict the outcome.' },
    ],
    reads: [{ role: 'sap', good: 'Defend it and we find out what the court is worth, {SIR}. Settle and we keep half for certain.' }],
    choices: [
      { id: 'defend', label: 'Defend the reform in court', pc: 4, outcomes: [
        { when: v('bench.honest', '>=', 4), result: 'The court upholds the reform in a judgment of eleven pages. It is the shortest judgment of the year.',
          fx: [['bloc.press', 2], ['nation.integrity', 1]], ops: [['weaken', '$R', 0]],
          news: ['SUPREME COURT UPHOLDS {R}', 'SUPREME COURT SAY THE REFORM STAND'], archive: 'Defended {R} in the Supreme Court and won.', sig: 2 },
        { when: v('bench.loyal', '>=', 4), result: 'The court upholds the reform. The justices you appointed write the judgment.',
          fx: [['bloc.press', -1]], ops: [['weaken', '$R', 0]],
          news: ['SUPREME COURT UPHOLDS {R}, 4–3', 'SUPREME COURT SAY THE REFORM STAND'], archive: 'Defended {R} in a Supreme Court of your appointing.', sig: 2 },
        { chance: 0.5, result: 'The court strikes the reform down, four to three, on grounds the dissent calls "invented for the occasion".',
          fx: [['pc', -3]], ops: [['weaken', '$R', 1]],
          news: ['SUPREME COURT STRIKES DOWN {R}', 'COURT DON CANCEL {R}'], archive: 'Lost {R} in the Supreme Court.', sig: 3 },
        { result: 'The court upholds the reform, four to three. The minority judgment is longer than the majority\'s.',
          fx: [], ops: [['weaken', '$R', 0]],
          news: ['SPLIT COURT UPHOLDS {R}', 'COURT SAY THE REFORM STAND, BARELY'], archive: 'Narrowly saved {R} in the Supreme Court.', sig: 2 },
      ] },
      { id: 'settle', label: 'Settle: narrow the reform to what will survive', outcomes: [{
        result: 'The suit is withdrawn in exchange for regulations that narrow the reform.',
        fx: [], ops: [['weaken', '$R', 0.5]],
        news: ['FG SETTLES SUIT OVER {R}', 'GOVERNMENT DON SETTLE CASE'], archive: 'Settled a suit by narrowing {R}.', sig: 1 }] },
    ],
  },
];
