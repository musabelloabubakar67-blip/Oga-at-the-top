import { CONTRACT_VERSION } from '../../engine/contracts';
import type { Cond, GameEvent } from '../../engine/types';

// THE CABINET
// The first Finance Minister, chosen on the certificate, has a story of their own:
// three files each, different for each of the three candidates. And a minister with
// ambition and a following can walk out and run against the President.

const pick = (who: string, from: number, to: number): Cond => ({ all: [{ flag: 'fin.pick', is: who }, { not: { flag: 'fin.replaced' } }, { turn: [from, to] }] });
const fin = (id: string, who: string, from: number, to: number, title: string, body: GameEvent['body'], reads: GameEvent['reads'], choices: GameEvent['choices'], also?: Cond): GameEvent => ({
  id: `fin.${who}.${id}`, kind: 'threshold', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3, max: 1,
  when: also ? { all: [pick(who, from, to), also] } : pick(who, from, to), office: 'Federal Ministry of Finance', stamp: 'CONFIDENTIAL', title, body, reads, choices,
});

export const CABINET: GameEvent[] = [
  // ---------------------------------------------------------------- Gwarzo
  fin('books', 'gwarzo', 6, 10, 'The real figures', [
    'Dr Gwarzo has finished counting. The arrears the government owes contractors are a third larger than the figure published last year.',
    'The minister wants to publish the true number before anyone else does.',
  ], [{ role: 'fin', good: 'The number will come out, {SIR}. The only question is whether we publish it or someone publishes it about us.' }], [
    { id: 'publish', label: 'Publish the true figures', pc: 4, outcomes: [{ result: 'The figures are published with a plan to pay them. The markets mark the government up for honesty and down for the debt, in roughly equal measure.', fx: [['approval', -1.5], ['bloc.establishment', 4], ['nation.integrity', 3], ['bloc.press', 3], ['debt.contractors', 0.3], ['rel.fin', 15]], news: ['FINANCE MINISTER PUBLISHES TRUE ARREARS FIGURE', 'GOVERNMENT CONFESS: WE OWE PASS WETIN WE TALK'], archive: 'Published the true arrears figure.', sig: 2 }] },
    { id: 'internal', label: 'Keep it inside the ministry for now', outcomes: [{ result: 'The figure stays in a locked drawer. Dr Gwarzo complies, and starts keeping a note of what was decided and by whom.', fx: [['nation.integrity', -1], ['rel.fin', -15]], quiet: 'The figure stays inside the ministry, by decision.', archive: 'Kept the true arrears figure inside the ministry.', sig: 1 }] },
  ], { v: ['debt.contractors', '>=', 0.6] }),
  fin('offer', 'gwarzo', 16, 20, 'An offer from abroad', [
    'An international development bank has offered Dr Gwarzo a vice-presidency. The offer is generous and expires in a fortnight.',
    'The minister has not asked for anything. The Chief of Staff thinks she is waiting to be asked to stay.',
  ], [{ role: 'cos', good: 'Ministers who can do the job are rarer than ministers who want it, {SIR}. Keeping this one will cost you something the party will notice.' }], [
    { id: 'keep', label: 'Match it: a free hand over the budget', pc: 8, outcomes: [{ result: 'You give the minister control of the budget timetable and the right to refuse unfunded spending. The party grumbles. The minister stays.', fx: [['bloc.establishment', 4], ['bloc.party', -4], ['bonus.fiscal', 0.008], ['rel.fin', 20]], flags: { 'fin.terms': true }, news: ['FINANCE MINISTER STAYS, WITH WIDER POWERS', 'GWARZO NO GO AGAIN. SHE DON GET MORE POWER'],
      // Her terms are a public commitment by the President, tested by the election budget a year later.
      domain: { version: CONTRACT_VERSION, effects: [{ type: 'commitment.open', id: 'fin.terms.gwarzo.$ADMIN', responsible: { office: 'president' }, object: 'finance-minister-budget-authority', text: 'The Finance Minister controls the budget timetable and may refuse spending that is not funded.', afterMonths: 24, visibility: 'public', verify: { not: { flag: 'fin.terms.broken' } } }] },
      archive: 'Kept the Finance Minister by giving her a free hand over the budget.', sig: 2 }] },
    { id: 'go', label: 'Thank her and let her go', outcomes: [{ result: 'Dr Gwarzo leaves with a handshake and a farewell dinner. Her successor is sworn in the same week.', fx: [['bloc.establishment', -5]], ops: [['finleave']], news: ['FINANCE MINISTER RESIGNS FOR INTERNATIONAL POST', 'GWARZO DON TRAVEL. ANOTHER PERSON DON ENTER'], archive: 'Let the Finance Minister leave for an international post.', sig: 2 }] },
  ]),
  fin('budget', 'gwarzo', 28, 32, 'Her budget or yours', [
    'The election is a year away. The party wants a spending budget. Dr Gwarzo has written to you: she will not sign one she cannot fund.',
    'Her letter is two pages long and does not use the word "resign". It does not need to.',
  ], [{ role: 'sap', good: 'A spending budget wins votes, {SIR}. A Finance Minister resigning over it loses some. I cannot tell you which is bigger.' }], [
    // If she stayed on stated terms, this is the test of them; the note goes on the original commitment.
    { id: 'back', label: 'Back the minister', outcomes: [
      { when: { flag: 'fin.terms' }, result: 'The budget is funded and dull. The terms you gave her held at the first real test. The party calls it a mistake in an election year. The markets call it the first budget they have believed in a decade.', fx: [['approval', -1], ['bloc.establishment', 6], ['bloc.party', -5], ['bonus.fiscal', 0.01]], news: ['FG BUDGET: NO ELECTION-YEAR SPLURGE', 'BUDGET NO GET SWEET. MINISTER WIN'], domain: { version: CONTRACT_VERSION, effects: [{ type: 'commitment.note', id: 'fin.terms.gwarzo.$ADMIN', text: 'Honoured: she refused the unfunded election budget and the President backed her.' }] }, archive: 'Backed the Finance Minister against an election-year budget, as her terms required.', sig: 2 },
      { result: 'The budget is funded and dull. The party calls it a mistake in an election year. The markets call it the first budget they have believed in a decade.', fx: [['approval', -1], ['bloc.establishment', 5], ['bloc.party', -5], ['bonus.fiscal', 0.01]], news: ['FG BUDGET: NO ELECTION-YEAR SPLURGE', 'BUDGET NO GET SWEET. MINISTER WIN'], archive: 'Backed the Finance Minister against an election-year budget.', sig: 2 },
    ] },
    { id: 'overrule', label: 'Overrule her and let her go', outcomes: [
      { when: { flag: 'fin.terms' }, result: 'The spending budget passes. Dr Gwarzo resigns the same afternoon, in a statement of nine words, two of which are "the terms". Investors read the other seven.', fx: [['approval', 2], ['bloc.street', 4], ['bloc.establishment', -8], ['bonus.fiscal', -0.012]], ops: [['finleave']], flags: { 'fin.terms.broken': true }, news: ['FINANCE MINISTER RESIGNS, SAYS PRESIDENT BROKE HIS WORD ON BUDGET', 'GWARZO DON RESIGN. SHE SAY PRESIDENT NO KEEP AGREEMENT'], domain: { version: CONTRACT_VERSION, effects: [{ type: 'commitment.note', id: 'fin.terms.gwarzo.$ADMIN', text: 'Broken: the President overruled her on the election budget and she resigned.' }] }, archive: 'Broke the terms you gave the Finance Minister; she resigned over the election budget.', sig: 3 },
      { result: 'The spending budget passes. Dr Gwarzo resigns the same afternoon, in a statement of nine words.', fx: [['approval', 2], ['bloc.street', 4], ['bloc.establishment', -6], ['bonus.fiscal', -0.012]], ops: [['finleave']], news: ['FINANCE MINISTER RESIGNS OVER ELECTION BUDGET', 'GWARZO DON RESIGN. BUDGET DON SWEET'], archive: 'Overruled the Finance Minister on the election budget; she resigned.', sig: 3 },
    ] },
  ]),
  // ---------------------------------------------------------------- Ekpenyong
  fin('list', 'ekpenyong', 6, 10, 'The party\'s list', [
    'Chief Ekpenyong has a list of two thousand party members who "worked hard in the campaign". The minister proposes they join the ministry as consultants.',
    'The list is very long. The consultancy is not described.',
  ], [{ role: 'sap', good: 'The party will remember it either way, {SIR}. It is cheaper to remember being given jobs than being refused them.' }], [
    { id: 'approve', label: 'Approve the list', outcomes: [{ result: 'Two thousand consultants are engaged. Several turn up.', fx: [['bloc.party', 6], ['person.gov_ss', 5], ['bonus.fiscal', -0.01], ['nation.integrity', -2], ['rel.fin', 10]], news: ['FINANCE MINISTRY ENGAGES 2,000 CONSULTANTS', 'PARTY PEOPLE DON GET WORK FOR FINANCE'], archive: 'Approved two thousand party members as Finance Ministry consultants.', sig: 2 }] },
    { id: 'half', label: 'Approve half, quietly', outcomes: [{ result: 'A thousand are engaged. The other thousand are told they are on a waiting list, which they correctly understand to be a no.', fx: [['bloc.party', 2], ['bonus.fiscal', -0.005], ['nation.integrity', -1]], news: ['FINANCE MINISTRY ENGAGES 1,000 CONSULTANTS', 'HALF THE PARTY LIST DON GET WORK. THE OTHER HALF DEY WAIT'], archive: 'Approved half the party\'s list of consultants.', sig: 1 }] },
    { id: 'refuse', label: 'Refuse', outcomes: [{ result: 'The list goes back unsigned. Chief Ekpenyong takes it to the Governors\' Forum that evening.', fx: [['bloc.party', -3], ['person.gov_ss', -6], ['rel.fin', -15]], quiet: 'The list was never announced, so neither is its refusal.', archive: 'Refused the party\'s list of consultants.', sig: 1 }] },
  ]),
  fin('bailout', 'ekpenyong', 16, 20, 'A loan for the governors', [
    'The Governors\' Forum wants a salary bailout for eleven states, "as a loan". Chief Ekpenyong has already drafted the terms, which are generous to the states and silent on repayment.',
  ], [{ role: 'cos', good: 'Whose minister is the Finance Minister, {SIR}? It would be useful to know before you sign.' }], [
    { id: 'sign', label: 'Sign the bailout', naira: 0.4, outcomes: [{ result: 'Salaries are paid in eleven states. The governors thank the Finance Minister by name, and you by title.', fx: [['person.gov_ss', 6], ['nation.integrity', -1]], ops: [['governors', 5]], news: ['FG APPROVES SALARY BAILOUT FOR 11 STATES', 'GOVERNORS DON COLLECT BAILOUT'], archive: 'Signed a salary bailout for eleven states.', sig: 2 }] },
    { id: 'refuse', label: 'Refuse unless the states publish their payrolls', outcomes: [{ result: 'Three states publish their payrolls and get the loan. Eight decide they can manage after all.', fx: [['person.gov_ss', -8], ['nation.integrity', 2], ['rel.fin', -10]], ops: [['governors', -3]], news: ['FG TIES BAILOUT TO PUBLISHED PAYROLLS', 'NO PAYROLL, NO BAILOUT'], archive: 'Tied the states\' bailout to published payrolls.', sig: 2 }] },
  ]),
  fin('file', 'ekpenyong', 28, 32, 'A file on the Finance Minister', [
    'The anti-corruption agency has reopened a file from Chief Ekpenyong\'s years as party treasurer. The agency is asking whether it may proceed.',
  ], [{ role: 'sap', good: 'If it proceeds, the governors who sponsored the Chief will take it personally, {SIR}. If it does not, someone will ask why.' }], [
    { id: 'proceed', label: 'Let it proceed', outcomes: [{ result: 'The agency proceeds. The Chief resigns to "clear his name" and is replaced the next morning.', fx: [['nation.integrity', 3], ['person.gov_ss', -8], ['bloc.party', -3]], ops: [['charge', 'fin', 'Diversion of party funds as treasurer', 0.03], ['finleave']], news: ['FINANCE MINISTER RESIGNS AS ANTI-GRAFT PROBE REOPENS', 'EKPENYONG DON RESIGN. THAT OLD FILE DON OPEN'], archive: 'Let the anti-corruption agency proceed against the Finance Minister.', sig: 3 }] },
    { id: 'bury', label: 'Ask the agency to wait until after the election', outcomes: [{ result: 'The agency waits. So does the file. So, now, does a journalist who heard about it.', fx: [['nation.integrity', -3], ['person.gov_ss', 4]], exposure: { kind: 'political', amount: 10, witnesses: ['fin'], trail: 2 }, quiet: 'A request that an agency wait is made in private. The journalist has not yet published.', archive: 'Asked the anti-corruption agency to delay a case against the Finance Minister.', sig: 2 }] },
  ]),
  // ---------------------------------------------------------------- Lohor
  fin('committee', 'lohor', 6, 10, 'An understanding with the committee', [
    'Senator Lohor proposes an understanding with the Appropriations Committee: their projects go in early, and the budget passes on time every year.',
    'The minister calls it "legislative cooperation". The committee chairman calls it "the usual".',
  ], [{ role: 'sap', good: 'It works, {SIR}. That is the trouble with it.' }], [
    { id: 'agree', label: 'Agree to the understanding', outcomes: [{ result: 'The understanding is reached over dinner. The budget will pass on time. Nobody writes anything down.', fx: [['person.sen_approp', 10], ['person.sen_pres', 4], ['nation.integrity', -2], ['bonus.fiscal', -0.008]], quiet: 'An understanding reached over dinner and never written down.',
      // Nothing is written down by them; the game keeps it as a private commitment so the next budget can be judged against it.
      domain: { version: CONTRACT_VERSION, effects: [
        { type: 'request.open', id: 'approp.understanding.$ADMIN', requester: { office: 'sen_approp' }, object: 'appropriations-projects-first', text: 'Members\' constituency projects go into the budget first; in return the budget passes on time.' },
        { type: 'request.close', id: 'approp.understanding.$ADMIN', status: 'granted', response: 'Agreed over dinner, through the Finance Minister.' },
        { type: 'commitment.open', id: 'approp.projects.$ADMIN', responsible: { office: 'president' }, object: 'appropriations-projects-first', text: 'Put the Appropriations Committee\'s projects into the budget first, in return for its passage on time.', afterMonths: 12, visibility: 'private', verify: { v: ['budget.padding', '>=', 3] } },
      ] },
      archive: 'Agreed an understanding with the Appropriations Committee.', sig: 1 }] },
    { id: 'refuse', label: 'Refuse: the budget goes through on its merits', outcomes: [{ result: 'The budget will go through on its merits, which is to say slowly. Senator Lohor says nothing and makes a note.', fx: [['person.sen_approp', -6], ['rel.fin', -10]], quiet: 'A refusal given in a private meeting.',
      domain: { version: CONTRACT_VERSION, effects: [
        { type: 'request.open', id: 'approp.understanding.$ADMIN', requester: { office: 'sen_approp' }, object: 'appropriations-projects-first', text: 'Members\' constituency projects go into the budget first; in return the budget passes on time.' },
        { type: 'request.close', id: 'approp.understanding.$ADMIN', status: 'refused', response: 'The budget goes through on its merits.' },
      ] },
      archive: 'Refused a budget understanding with the Appropriations Committee.', sig: 1 }] },
  ]),
  fin('senate', 'lohor', 16, 20, 'The Senate wants its man', [
    'The Senate President has asked that Senator Lohor also chair the party\'s campaign finance committee. The minister has not said no.',
  ], [{ role: 'cos', good: 'A Finance Minister who raises campaign money is a Finance Minister with two masters, {SIR}. One of them is not you.' }], [
    { id: 'allow', label: 'Allow it', outcomes: [{ result: 'Senator Lohor chairs the committee. The campaign chest fills. Several contracts are signed in the same month.', fx: [['campaign', 4], ['person.sen_pres', 6], ['nation.integrity', -2]], news: ['FINANCE MINISTER TO CHAIR PARTY CAMPAIGN FINANCE', 'MINISTER GO GATHER CAMPAIGN MONEY'], archive: 'Let the Finance Minister chair the party\'s campaign finance.', sig: 2 }] },
    { id: 'refuse', label: 'Refuse: one job at a time', outcomes: [{ result: 'The Senate President is told no, politely. The answer is received less politely.', fx: [['person.sen_pres', -5], ['nation.integrity', 1]], quiet: 'A private reply to the Senate President.', archive: 'Refused to let the Finance Minister run campaign finance.', sig: 1 }] },
  ]),
  fin('contract', 'lohor', 28, 32, 'A contract with a familiar name', [
    'A road contract worth ₦40bn has gone to a firm whose directors include the Finance Minister\'s brother-in-law. A newspaper has the documents.',
  ], [{ role: 'sap', good: 'The newspaper will print on Sunday, {SIR}. What we do before Sunday is the story.' }], [
    { id: 'sack', label: 'Sack the minister before Sunday', outcomes: [{ result: 'Senator Lohor is out by Saturday. The Sunday paper runs it on page four.', fx: [['nation.integrity', 2], ['person.sen_pres', -4], ['bloc.press', 3]], ops: [['finleave']], news: ['FINANCE MINISTER SACKED OVER ROAD CONTRACT', 'LOHOR DON GO. CONTRACT WAHALA'], archive: 'Sacked the Finance Minister over a contract to a relative\'s firm.', sig: 3 }] },
    { id: 'repay', label: 'Cancel the contract quietly and keep the minister', pc: 5, outcomes: [{ result: 'The contract is cancelled "for review". The Sunday paper runs it anyway, with the cancellation as the second paragraph.', fx: [['nation.integrity', 0.5], ['bloc.press', -2]], news: ['ROAD CONTRACT CANCELLED AMID QUESTIONS', 'DEM DON CANCEL THE CONTRACT. WE DEY WATCH'], archive: 'Cancelled a contract to the Finance Minister\'s relative and kept the minister.', sig: 2 }] },
    { id: 'cover', label: 'Stand by the minister', outcomes: [{ result: 'You stand by the minister. The contract stands. So does the story, for three weeks.', fx: [['nation.integrity', -2], ['pressure.scandalHeat', 8]], exposure: { kind: 'tolerated', amount: 10, witnesses: ['fin'], trail: 2 }, news: ['PRESIDENT STANDS BY FINANCE MINISTER', 'PRESIDENT SAY LOHOR NO DO ANYTHING'], archive: 'Stood by the Finance Minister over a contract to a relative\'s firm.', sig: 2 }] },
  ]),

  // ---------------------------------------------------------------- the walkout
  {
    id: 'min.resigns', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, reactive: true, topic: 'people',
    cast: { WHO: 'leavingMinister' }, when: { turn: [18] }, cooldown: 24, max: 2, weight: 14,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: '{WHO_SHORT} is about to resign and run',
    body: [
      '{WHO}, {WHO_TITLE}, has told friends that the resignation letter is written. The plan is to announce it on a Monday and declare for the presidency by Friday.',
      'The minister has a following now: people who owe their jobs, their contracts or their good name to that ministry. They will not all stay behind.',
      { when: { v: ['count.min.resigns', '>=', 2] }, text: 'One minister has already left to run against you. This one watched how that was handled.' },
    ],
    reads: [
      { role: 'sap', good: 'Ministers who leave to run take a piece of the party with them, {SIR}. The question is how big a piece, and whether you would rather pay for it now.' },
    ],
    choices: [
      {
        id: 'offer', label: 'Make an offer: a bigger brief and a public promise', pc: 8,
        outcomes: [{ result: '{WHO_SHORT} accepts the bigger brief and the promise, in that order. The letter goes back in the drawer, where both of you know it is kept.', fx: [['person.$WHO', 20], ['bloc.party', 2]], news: ['{WHO_SHORT} TAKES ON EXPANDED BRIEF', 'MINISTER NO RESIGN AGAIN. E DON COLLECT MORE WORK'], archive: 'Kept an ambitious minister with a bigger brief and a promise.', sig: 2 }],
      },
      {
        id: 'release', label: 'Let {WHO_SHORT} go',
        outcomes: [{ result: '{WHO_SHORT} resigns on Monday and declares on Friday, taking two senators\' worth of goodwill and most of the ministry\'s press office.', fx: [['bloc.party', -4], ['rival.strong', 6], ['approval', -1]], ops: [['sack', '$WHO', 'technocrat']], news: ['MINISTER RESIGNS TO CHALLENGE PRESIDENT', 'MINISTER DON RESIGN. E WAN BE PRESIDENT'], archive: 'Let an ambitious minister resign to run against you.', sig: 3 }],
      },
      {
        id: 'sack', label: 'Sack {WHO_SHORT} first',
        outcomes: [{ result: '{WHO_SHORT} is sacked on Sunday night. Monday\'s resignation becomes Monday\'s grievance, and grievances travel further.', fx: [['bloc.party', -2], ['rival.strong', 3], ['approval', -2], ['bloc.press', -2]], ops: [['sack', '$WHO', 'party']], news: ['PRESIDENT SACKS MINISTER AHEAD OF RESIGNATION', 'PRESIDENT DON SACK AM BEFORE E RESIGN'], archive: 'Sacked an ambitious minister before the resignation could land.', sig: 2 }],
      },
    ],
  },
];
