import { CONTRACT_VERSION } from '../../engine/contracts';
import type { Cond, GameEvent } from '../../engine/types';

// FILES THAT COME FROM THE PRESIDENT'S OWN SITUATION
// None of these is drawn from a list. Each arises because of something in this
// particular presidency: a debt left unpaid, a favour owed, a businessman who
// has turned, a minister who is failing, a bet in trouble, a theatre out of
// control. Where a file is about a person, the engine fills in who.
//
// {WHO}, {WHO_SHORT}, {WHO_TITLE}, {WHO_WANT} and $WHO are filled from the cast.

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });
const all = (...c: Cond[]): Cond => ({ all: c });

export const SYSTEM: GameEvent[] = [
  // ================================================================ what you owe
  {
    id: 'owe.tycoon', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, reactive: true, topic: 'money',
    cast: { WHO: 'creditorTycoon' }, cooldown: 12, max: 4, weight: 14,
    office: 'Office of the Chief of Staff', stamp: 'CONFIDENTIAL',
    title: '{WHO_SHORT} would like a word about the campaign',
    body: [
      '{WHO} has asked to see you alone. The message says it is "nothing urgent" and was delivered by hand, by a man who waited for the reply.',
      'You owe {WHO_SHORT}. The request is specific: {WHO_WANT}',
      'Nothing was ever written down. That is what makes it binding.',
    ],
    reads: [
      { role: 'sap', good: 'You can pay, you can stall, or you can say the account is closed. Stalling costs more each time, {SIR}. Refusing costs it all at once.' },
      { role: 'fin', good: 'What is being asked for comes out of prices or out of the accounts, {SIR}. It is not free because it is not in the budget.', weak: 'A reasonable request from a patriot, {SIR}.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Give {WHO_SHORT} what is asked', requires: v('granted.$WHO', '==', 0),
        outcomes: [{
          result: 'It is done by the end of the week.',
          ops: [['grant', '$WHO']],
          news: ['FG GRANTS CONCESSION TO {WHO_SHORT} GROUP', 'BIG MAN DON COLLECT FROM GOVERNMENT'],
          archive: 'Repaid {WHO} for the campaign with what was asked.', sig: 2,
        }],
      },
      {
        id: 'contract', label: 'Find {WHO_SHORT} a contract instead', naira: 0.3,
        outcomes: [{
          result: 'A supply contract is awarded without tender to a company registered in March. {WHO_SHORT} regards the account as settled, for now.',
          fx: [['nation.integrity', -2], ['tycoon.$WHO', 8], ['pressure.scandalHeat', 4]],
          ops: [['settle', '$WHO']],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['$WHO'], trail: 2 },
          archive: 'Settled a campaign debt to {WHO} with a no-bid contract.',
        }],
      },
      {
        id: 'stall', label: 'Tell {WHO_SHORT} the time is not right',
        outcomes: [{
          result: '{WHO_SHORT} says it is perfectly understood, in a tone that makes clear it is. You will be asked again, and it will be for more.',
          fx: [['tycoon.$WHO', -8]],
          ops: [['grow', '$WHO']],
          archive: 'Put off repaying {WHO}.',
        }],
      },
      {
        id: 'refuse', label: 'Tell {WHO_SHORT} the campaign is over and so is the account', pc: 6,
        outcomes: [{
          result: 'You say it plainly. {WHO_SHORT} thanks you for your candour and leaves. Within the month that money is in somebody else\'s campaign.',
          fx: [['tycoon.$WHO', -24], ['nation.integrity', 2], ['bloc.press', 3], ['bloc.party', -3]],
          ops: [['repudiate', '$WHO']],
          news: ['PRESIDENT "OWES NOBODY", SAYS VILLA AFTER RIFT WITH FINANCIER', 'PRESIDENT DON TELL BIG MAN: I NO OWE YOU'],
          archive: 'Told {WHO} that the campaign debt would not be repaid.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'owe.governor', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2, reactive: true, topic: 'people',
    cast: { WHO: 'creditorGovernor' }, cooldown: 12, max: 4, weight: 12,
    office: 'Nigeria Governors\' Forum', stamp: 'URGENT',
    title: '{WHO_SHORT} is calling in what you owe',
    body: [
      '{WHO} has come to Abuja unannounced and is in the waiting room. He has brought nobody with him, which is how you know it is serious.',
      'He delivered for you. He would now like: {WHO_WANT}',
    ],
    reads: [
      { role: 'sap', good: 'He has counted what he is owed to the last delegate, {SIR}. If you send him home empty he will have a different conversation with someone else.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Give {WHO_SHORT} what is asked', requires: v('granted.$WHO', '==', 0),
        outcomes: [{
          result: 'He leaves by the front door, smiling, where the correspondents can see him.',
          ops: [['grant', '$WHO']],
          news: ['PRESIDENT, {WHO_SHORT} IN "FRUITFUL" VILLA MEETING', '{WHO_SHORT} COME VILLA, COMMOT WITH SMILE'],
          archive: 'Repaid {WHO} with what was asked.', sig: 2,
        }],
      },
      {
        id: 'agency', label: 'Give his nominee an agency to run instead',
        outcomes: [{
          result: 'His nominee is sworn in as head of a federal agency. It is not what he asked for. It is enough.',
          fx: [['nation.integrity', -2], ['nation.capacity', -1.5], ['person.$WHO', 8], ['pressure.scandalHeat', 2]],
          ops: [['settle', '$WHO']],
          news: ['PRESIDENT NAMES NEW AGENCY HEAD', 'ANOTHER GOVERNOR BOY DON COLLECT APPOINTMENT'],
          archive: 'Settled a debt to {WHO} with an appointment.',
        }],
      },
      {
        id: 'stall', label: 'Ask {WHO_SHORT} for more time',
        outcomes: [{
          result: 'He gives you the time. He does not give it graciously, and the debt has grown.',
          fx: [['person.$WHO', -8]],
          ops: [['grow', '$WHO']],
          archive: 'Put off repaying {WHO}.',
        }],
      },
      {
        id: 'refuse', label: 'Tell {WHO_SHORT} that delivering your state is the job, not a loan', pc: 5,
        outcomes: [{
          result: 'He hears you out, stands, and says he will remember the lesson. He leaves by the side door.',
          fx: [['person.$WHO', -18], ['bloc.party', -4], ['nation.integrity', 1]],
          ops: [['repudiate', '$WHO']],
          news: ['{WHO_SHORT} LEAVES VILLA "DISAPPOINTED"', '{WHO_SHORT} COMMOT VILLA WITH LONG FACE'],
          archive: 'Refused to repay {WHO}.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'owe.decamp', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, reactive: true, topic: 'people',
    when: all({ flag: 'rival.strong.in' }, v('owing.strong', '>', 0)), weight: 16,
    office: 'Office of the Chief of Staff', stamp: 'CONFIDENTIAL',
    title: 'Senator Dandume would like his ministry now',
    body: [
      'Senator Garba Dandume returned to your party on a promise. He has been patient for some months and has now stopped.',
      'He wants the Ministry of Works, which is occupied. He has mentioned that the door he came in by also opens outward.',
    ],
    reads: [
      { role: 'sap', good: 'If he walks out a second time, {SIR}, he takes more with him than he brought. If he gets Works, the man who has it will want to know why.' },
    ],
    choices: [
      {
        id: 'give', label: 'Give him a ministry',
        outcomes: [{
          result: 'A ministry is found, by dividing one that existed. He is sworn in on a Monday and has forty appointees by Friday.',
          fx: [['nation.capacity', -3], ['bloc.party', -3], ['nation.integrity', -2], ['person.gov_sw', -6]],
          ops: [['settle', 'strong']],
          news: ['DANDUME SWORN IN AS MINISTER', 'DANDUME DON COLLECT MINISTRY. POLITICS NA GAME'],
          archive: 'Gave Senator Dandume the ministry he was promised.', sig: 2,
        }],
      },
      {
        id: 'stall', label: 'Tell him after the budget',
        outcomes: [{
          result: 'He accepts this with a smile that does not reach anything.',
          fx: [['bloc.party', -2], ['rival.strong', 4]],
          ops: [['grow', 'strong']],
          follow: [{ event: 'owe.decamp.leaves', after: [5, 8], when: v('owing.strong', '>', 0) }],
          // "After the budget" is now a dated private promise; the follow-up addresses it by this id.
          domain: { version: CONTRACT_VERSION, effects: [{ type: 'commitment.open', id: 'dandume.ministry.$ADMIN', responsible: { office: 'president' }, object: 'ministry-for-dandume', text: 'Give Senator Garba Dandume a ministry "after the budget", as promised when he returned to the party.', afterMonths: 6, visibility: 'private' }] },
          archive: 'Put Senator Dandume off.',
        }],
      },
      {
        id: 'renege', label: 'Tell him he is lucky to have been taken back', pc: 6,
        outcomes: [{
          result: 'He leaves the party for the second time, with rather more people than he left with the first time.',
          fx: [['rival.strong', 16], ['bloc.party', -6]],
          flags: { 'rival.strong.in': false },
          ops: [['repudiate', 'strong']],
          news: ['DANDUME DEFECTS AGAIN, ACCUSES PRESIDENT OF "BETRAYAL"', 'DANDUME DON DECAMP AGAIN. E CARRY PEOPLE FOLLOW BODY'],
          archive: 'Reneged on the promise to Senator Dandume.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'owe.decamp.leaves', kind: 'chain', slot: 'minor', category: 'politics', tone: 'dry', intensity: 2, channel: 'phone', office: 'Phone', from: 'Senator Garba Dandume',
    title: 'About the ministry',
    body: ['Your Excellency. The budget has passed. I have not heard from you. I am holding a press conference on Thursday and would prefer to know what I am announcing.'],
    choices: [
      {
        id: 'give', label: 'You will have it by Wednesday',
        outcomes: [{ result: 'He has it by Wednesday.', fx: [['nation.capacity', -3], ['nation.integrity', -2]], ops: [['settle', 'strong']], domain: { version: CONTRACT_VERSION, effects: [{ type: 'commitment.note', id: 'dandume.ministry.$ADMIN', text: 'Given, late, under the threat of a press conference.' }] }, archive: 'Gave Senator Dandume his ministry, under threat.' }],
      },
    ],
    ignored: {
      result: 'The press conference is held. He announces his departure, and reads out a list of things you promised him.',
      fx: [['rival.strong', 16], ['bloc.party', -6], ['bloc.press', -3]], flags: { 'rival.strong.in': false }, ops: [['repudiate', 'strong']],
      domain: { version: CONTRACT_VERSION, effects: [{ type: 'commitment.note', id: 'dandume.ministry.$ADMIN', text: 'Not given. He left the party and read the promise out at a press conference.' }] },
      news: ['DANDUME QUITS RULING PARTY AGAIN', 'DANDUME DON GO AGAIN. E READ PRESIDENT PROMISE FOR TV'],
      archive: 'Lost Senator Dandume a second time.',
    },
  },

  // ================================================================ what the country owes
  {
    id: 'debt.gas', kind: 'recurring', slot: 'lead', category: 'infrastructure', tone: 'dry', intensity: 3, reactive: true, topic: 'power',
    when: all(v('debt.gas', '>', 1.0), { turn: [5] }), cooldown: 14, max: 4, weight: 16,
    office: 'Federal Ministry of Power', stamp: 'URGENT',
    title: 'The gas suppliers have shut the valves',
    body: [
      'The companies that supply gas to the power plants have cut deliveries by half. They are owed more than a trillion naira, and have been told it is "being processed" by three governments.',
      'Eleven plants are idle. They are in working order. There is nothing to burn in them.',
      { when: v('agenda.p1', '==', 1), text: 'This debt was cleared once. It has built up again because electricity is still sold for less than it costs to make: every unit generated adds to what is owed.' },
      { when: v('agenda.p3', '==', 0), text: '{POWERMIN} notes that this will keep happening until the tariff covers the cost of supply.' },
    ],
    statement: 'The current load-shedding is due to gas constraints, which are being addressed.',
    trace: [['debt.gas', 1], ['nation.power', -1]],
    reads: [
      { role: 'power', good: 'Pay them and the plants are back in a fortnight, {SIR}. Fix the tariff and I never have to bring you this file again.', weak: 'It is sabotage by the gas companies, {SIR}.' },
      { role: 'fin', good: 'It is the same bill as last time with interest. We can pay it now or pay more of it later.', weak: 'They can wait, {SIR}. They always have.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Pay them in full',
        outcomes: [{
          result: 'The transfer is made the same day.',
          fx: [['bloc.establishment', 3]],
          ops: [['paydebt', 'gas', 1]],
          news: ['FG SETTLES GAS DEBT; PLANTS RESTART', 'GOVERNMENT DON PAY GAS MONEY. LIGHT GO BETTER'],
          archive: 'Paid the gas suppliers in full after they cut supply.', sig: 2,
        }],
      },
      {
        id: 'half', label: 'Pay half and promise the rest',
        outcomes: [{
          result: 'Half is paid. Half the plants restart. The suppliers have heard the promise about the rest before.',
          fx: [['nation.power', 2]],
          ops: [['paydebt', 'gas', 0.5]],
          news: ['FG PAYS PART OF GAS DEBT', 'GOVERNMENT PAY HALF. LIGHT COME HALF'],
          archive: 'Paid half of what was owed to the gas suppliers.',
        }],
      },
      {
        id: 'order', label: 'Order them to supply, and remind them who issues their licences',
        outcomes: [{
          result: 'Supply resumes under protest. Two of the companies write to their embassies. The debt is exactly where it was, and so is the reason for it.',
          fx: [['nation.power', 1], ['bloc.establishment', -5], ['nation.jobs', -1], ['counter.strongarm', 1]],
          later: [{ after: [4, 6], fx: [['nation.power', -3], ['bloc.establishment', -2]], label: 'Gas companies cut investment after being forced to supply unpaid.' }],
          news: ['FG ORDERS GAS FIRMS TO RESUME SUPPLY', 'GOVERNMENT FORCE GAS PEOPLE. DEM NO PAY THEM'],
          archive: 'Forced the gas suppliers to deliver without paying them.',
        }],
      },
    ],
  },
  {
    id: 'debt.contractors', kind: 'recurring', slot: 'lead', category: 'infrastructure', tone: 'dry', intensity: 3, reactive: true, topic: 'money',
    when: all(v('debt.contractors', '>', 1.7), { turn: [8] }), cooldown: 18, max: 3, weight: 14,
    office: 'Federal Ministry of Works', stamp: 'URGENT',
    title: 'The contractors have gone to court',
    body: [
      'An association of four hundred contractors has obtained judgment against the Federal Government for unpaid certificates. The sum, with interest, is rising monthly.',
      'They have stopped work on every federal site in the country. A bailiff has been seen measuring the furniture at the Ministry of Works.',
      'Every reform and big bet that involves building is running slow for the same reason.',
    ],
    trace: [['debt.contractors', 1]],
    reads: [
      { role: 'fin', good: 'We can pay cash, {SIR}, or we can give them paper and pay interest on it for ten years. What we cannot do is build anything while we owe them.', weak: 'Contractors always complain, {SIR}.' },
      { role: 'sap', good: 'Half of these firms belong to people in the party. They will be grateful. The other half built the roads.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Pay half of it now, in cash',
        outcomes: [{
          result: 'Half of every certificate is honoured, oldest first.',
          ops: [['paydebt', 'contractors', 0.5]],
          news: ['FG PAYS CONTRACTORS HALF OF ARREARS', 'CONTRACTORS DON COLLECT HALF'],
          archive: 'Paid half of the arrears owed to contractors.', sig: 2,
        }],
      },
      {
        id: 'notes', label: 'Issue promissory notes for all of it',
        outcomes: [{
          result: 'Every certificate becomes a ten-year note that a bank will discount. The contractors have their money by the end of the month. You have a larger debt and working sites.',
          fx: [['bloc.establishment', 3], ['nation.jobs', 2]],
          ops: [['notes', 'contractors']],
          news: ['FG ISSUES NOTES TO CLEAR CONTRACTOR DEBT', 'GOVERNMENT GIVE CONTRACTORS PAPER. BANK GO CHANGE AM'],
          archive: 'Converted contractor arrears into promissory notes.', sig: 2,
        }],
      },
      {
        id: 'appeal', label: 'Appeal the judgment',
        outcomes: [{
          result: 'The appeal is filed. It will take two years. The sites stay empty, and the interest runs.',
          fx: [['nation.jobs', -3], ['bloc.establishment', -5], ['debt.contractors', 0.2], ['nation.power', -1]],
          news: ['FG APPEALS CONTRACTORS\' JUDGMENT', 'GOVERNMENT CARRY CONTRACTORS GO APPEAL. WORK DON STOP'],
          archive: 'Appealed rather than pay the contractors.',
        }],
      },
    ],
  },
  {
    id: 'debt.pensions', kind: 'recurring', slot: 'lead', category: 'labour', tone: 'grave', intensity: 3, reactive: true,
    when: all(v('debt.pensions', '>', 1.0), { turn: [8] }), cooldown: 20, max: 3, weight: 14,
    office: 'National Pensions Verification Board', stamp: 'URGENT',
    title: 'A pensioner has died in the verification queue',
    body: [
      'A retired railway worker, aged 78, collapsed and died yesterday outside the pension office in Abuja. He had been in the queue since four in the morning. He was owed fifty-one months of pension.',
      'Four hundred others were waiting with him. They have not left.',
      'The arrears now exceed a trillion naira.',
    ],
    statement: 'The Board commiserates with the family and reiterates its commitment to the welfare of senior citizens.',
    trace: [['debt.pensions', 1]],
    reads: [
      { role: 'cos', good: 'They are sitting on the pavement outside the gate, {SIR}. Every camera in Abuja is there.' },
      { role: 'fin', good: 'It is a trillion we owe to people who are running out of time to collect it. I would find it.', weak: 'The verification exercise is ongoing, {SIR}.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Pay every pension outstanding, this month',
        outcomes: [{
          result: 'You go to the gate and tell them yourself. The payments begin within the week.',
          ops: [['paydebt', 'pensions', 1]],
          news: ['PRESIDENT ORDERS ALL PENSION ARREARS PAID', 'PRESIDENT COME OUTSIDE, TELL PENSIONERS: YOUR MONEY DON READY'],
          archive: 'Paid every pension outstanding after a pensioner died in the queue.', sig: 3,
        }],
      },
      {
        id: 'half', label: 'Pay half now and end the verification queue',
        outcomes: [{
          result: 'Half is paid. Verification moves to the banks. The queue disperses, and half the debt remains.',
          fx: [['bloc.street', 2], ['pressure.wageGrievance', -5]],
          ops: [['paydebt', 'pensions', 0.5]],
          news: ['FG PAYS HALF OF PENSION ARREARS, SCRAPS QUEUE', 'PENSIONERS COLLECT HALF. QUEUE DON END'],
          archive: 'Paid half the pension arrears and ended physical verification.',
        }],
      },
      {
        id: 'condole', label: 'Send condolences and order an inquiry',
        outcomes: [{
          result: 'A statement is issued. A panel is constituted. The queue is still there in the morning, and it is longer.',
          fx: [['approval', -4], ['bloc.street', -6], ['bloc.press', -5], ['pressure.wageGrievance', 8], ['counter.committees', 1]],
          news: ['PRESIDENT ORDERS PROBE INTO PENSIONER\'S DEATH', 'PENSIONER DIE FOR QUEUE. GOVERNMENT SET UP PANEL'],
          archive: 'Ordered an inquiry after a pensioner died waiting to be paid.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'debt.maturity', kind: 'recurring', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3, topic: 'money',
    when: all({ any: [{ turn: [18, 24] }, { turn: [62, 70] }] }, v('debt.eurobond', '>=', 2)), cooldown: 30, max: 2, weight: 30,
    office: 'Debt Management Office', stamp: 'URGENT',
    title: 'A foreign bond falls due',
    body: [
      'A Eurobond issued eleven years ago matures next month. ₦1.5tn must be repaid, in dollars, on the day.',
      'It was sold by a government that assumed somebody else would be in office when it came due. It was right.',
      { when: v('fund.abroad', '>=', 1.5), text: 'The Future Generations Fund holds enough to meet it.' },
      { when: v('nation.debt', '>=', 90), text: 'At the present level of debt, nobody will lend you the money to replace it.' },
    ],
    trace: [['nation.debt', 1], ['debt.eurobond', 1]],
    reads: [
      { role: 'fin', good: 'If we have the cash, {SIR}, pay it: it is the dearest debt we have. If we roll it over, we roll it over at today\'s rate, which is worse than the one it was sold at.', weak: 'The market will be understanding, {SIR}.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Pay it from the treasury', naira: 1.5,
        outcomes: [{
          result: 'The bond is redeemed on the day. The Debt Office issues a one-line statement, which is how these things should go.',
          fx: [['debt.eurobond', -1.5], ['bloc.establishment', 5]],
          news: ['NIGERIA REDEEMS ₦1.5TN EUROBOND ON SCHEDULE', 'WE DON PAY ONE BIG FOREIGN DEBT'],
          archive: 'Redeemed a maturing Eurobond from the treasury.', sig: 2,
        }],
      },
      {
        id: 'fund', label: 'Pay it from the Future Generations Fund', requires: v('fund.abroad', '>=', 1.5), locked: 'The fund abroad does not hold ₦1.5tn.',
        outcomes: [{
          result: 'The fund pays the bond, dollar for dollar. It is what the money was saved for, and the papers that called you a miser are briefly quiet.',
          fx: [['fund.abroad', -1.5], ['debt.eurobond', -1.5], ['bloc.establishment', 4], ['approval', 1]],
          news: ['SOVEREIGN FUND PAYS OFF MATURING EUROBOND', 'THE MONEY DEM SAVE DON PAY DEBT'],
          archive: 'Redeemed a maturing Eurobond from the Future Generations Fund.', sig: 2,
        }],
      },
      {
        id: 'roll', label: 'Issue a new bond to repay the old one', requires: v('nation.debt', '<', 90), locked: 'Nobody will lend at this level of debt.',
        outcomes: [{
          result: 'A new bond is sold to repay the old. The coupon is two points higher. The debt is the same size and costs more.',
          fx: [['debt.eurobond', 0.35], ['bloc.establishment', -2]],
          news: ['NIGERIA REFINANCES EUROBOND AT HIGHER RATE', 'WE BORROW TO PAY WETIN WE BORROW'],
          archive: 'Refinanced a maturing Eurobond at a higher rate.',
        }],
      },
      {
        id: 'reschedule', label: 'Ask the bondholders for more time',
        outcomes: [{
          result: 'The bondholders agree to wait, at a price. The rating agencies do not wait at all.',
          fx: [['debt.eurobond', 0.6], ['bloc.establishment', -9], ['bloc.press', -3], ['nation.inflation', 1.5]],
          later: [{ after: [3, 5], fx: [['debt.bonds', 0.4], ['bloc.establishment', -3]], label: 'Borrowing costs rise after the rescheduling.', note: ['RATING CUT AFTER EUROBOND RESCHEDULING', 'DEM DON DOWNGRADE US AGAIN'] }],
          news: ['NIGERIA SEEKS DELAY ON EUROBOND REPAYMENT', 'WE NO FIT PAY. WE DEY BEG FOR TIME'],
          archive: 'Rescheduled a Eurobond the country could not repay.', sig: 3,
        }],
      },
    ],
  },

  // ================================================================ what the country has saved
  {
    id: 'fund.share', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, reactive: true, topic: 'money',
    when: v('fund.buffer', '>', 1.5), cooldown: 14, max: 4, weight: 16,
    office: 'Nigeria Governors\' Forum', stamp: 'URGENT',
    title: 'The governors have seen the stabilisation account',
    body: [
      'The stabilisation account holds more than ₦1.5tn. The governors have noticed.',
      '{GOVCHAIR} writes that it is "morally indefensible for the centre to hoard while the states cannot pay salaries", and requests an emergency meeting of the allocation committee.',
      'Thirty of thirty-six governors have signed. They include all of your own party\'s.',
    ],
    trace: [['fund.buffer', 1]],
    reads: [
      { role: 'fin', good: 'It is the first time in twenty years we could survive a fall in the oil price, {SIR}. But money they can see is money they will ask for. Abroad, they cannot see it.', weak: 'The governors make a fair point, {SIR}.' },
      { role: 'sap', good: 'Share some, move some, or spend it on what we owe. Leaving it where it is and saying no costs you all six of them.' },
    ],
    choices: [
      {
        id: 'share', label: 'Share half of it with the states',
        outcomes: [{
          result: 'The committee meets and shares. Several states clear salary arrears. Several others buy vehicles.',
          fx: [['bloc.party', 8], ['pc', 5], ['bloc.street', 2], ['nation.integrity', -1]],
          ops: [['fundmove', 'buffer', 'states', 0.5], ['governors', 7]],
          news: ['STATES SHARE HALF OF STABILISATION ACCOUNT', 'GOVERNORS DON COLLECT. WATCH THE CONVOY'],
          archive: 'Shared half the stabilisation account with the states.', sig: 2,
        }],
      },
      {
        id: 'abroad', label: 'Move it abroad, into the Future Generations Fund', pc: 6,
        outcomes: [{
          result: 'The transfer is made overnight. In the morning the account the governors were looking at is empty, and the money is somewhere none of them can telephone.',
          fx: [['bloc.establishment', 5], ['bloc.party', -5]],
          ops: [['fundmove', 'buffer', 'abroad', 1], ['governors', -6]],
          news: ['PRESIDENT MOVES STABILISATION FUNDS OFFSHORE "FOR POSTERITY"', 'PRESIDENT CARRY THE MONEY GO ABROAD. GOVERNORS DEY VEX'],
          archive: 'Moved the stabilisation account into the fund abroad to keep it from the governors.', sig: 3,
        }],
      },
      {
        id: 'arrears', label: 'Use it to pay the pensioners',
        requires: v('debt.pensions', '>', 0.2), locked: 'There are no pension arrears left to pay.',
        outcomes: [{
          result: 'You announce that the account will be used to pay what the federation owes its own retired workers. The governors find this difficult to argue against in public.',
          fx: [['bloc.party', -2]],
          ops: [['fundmove', 'buffer', 'treasury', 1], ['paydebt', 'pensions', 1], ['governors', -2]],
          news: ['STABILISATION FUNDS TO CLEAR PENSION ARREARS', 'THE MONEY GO PAY PENSIONERS. GOVERNORS NO FIT TALK'],
          archive: 'Used the stabilisation account to pay pension arrears.', sig: 2,
        }],
      },
      {
        id: 'refuse', label: 'Tell them it is the country\'s savings and it stays where it is',
        outcomes: [{
          result: 'You tell them the money is not theirs. They would like to know whose it is. So, increasingly, would the press.',
          fx: [['bloc.party', -5], ['bloc.establishment', 3]],
          ops: [['governors', -6]],
          news: ['PRESIDENCY REBUFFS GOVERNORS OVER SAVINGS', 'PRESIDENT SIT DOWN ON TOP MONEY'],
          archive: 'Refused to share the stabilisation account with the governors.',
        }],
      },
    ],
  },
  {
    id: 'fund.raid', kind: 'standalone', slot: 'lead', category: 'temptation', tone: 'dry', intensity: 3, reactive: true, topic: 'money',
    when: all({ term: 1 }, { termTurn: [34, 43] }, v('fund.abroad', '>=', 1), { not: { flag: 'ticket.lost' } }), weight: 18,
    office: 'Office of the Party Chairman', stamp: 'CONFIDENTIAL',
    title: 'The party would like the savings to come home',
    body: [
      '{CHAIR} has been to see you about the fund abroad. There is an election in a few months, he observes, and "the future generations cannot vote in it".',
      'The proposal is that the fund be brought home and spent on visible projects in the states that matter. He has a list of the states.',
    ],
    reads: [
      { role: 'fin', good: 'It took four years to put there and it will take four months to spend, {SIR}. There will be nothing to show for it by March except the election result.', weak: 'It is our money, {SIR}.' },
      { role: 'sap', good: 'He is not wrong about the election. He is not thinking about anything after it.' },
    ],
    choices: [
      {
        id: 'refuse', label: 'The fund stays where it is',
        outcomes: [{
          result: 'You say no. He says he will explain your reasons to the governors, and the way he says it is not a kindness.',
          fx: [['bloc.party', -6], ['bloc.establishment', 4], ['nation.integrity', 1]],
          flags: { 'fund.defended': true },
          archive: 'Refused to bring the savings home for the election.', sig: 2,
        }],
      },
      {
        id: 'half', label: 'Bring half home for "priority projects"',
        outcomes: [{
          result: 'Half the fund is repatriated and spent in eleven states. The roads are tarred to the edge of each constituency and no further.',
          fx: [['bloc.party', 7], ['approval', 2], ['bloc.establishment', -6], ['nation.integrity', -2], ['nation.jobs', 2]],
          ops: [['fundmove', 'abroad', 'states', 0.5]],
          news: ['FG DRAWS ON SOVEREIGN FUND FOR "PRIORITY PROJECTS"', 'ELECTION DON NEAR. GOVERNMENT DON BREAK THE SAVINGS'],
          archive: 'Spent half the fund abroad on projects before the election.', sig: 3,
        }],
      },
      {
        id: 'drawer', label: 'Bring it home, and keep some of it close', requires: { flag: 'drawer.open' },
        outcomes: [{
          result: 'The fund comes home. Most of it reaches the projects. ₦25bn does not, and is in the drawer by Friday.',
          fx: [['purse', 25], ['bloc.party', 7], ['approval', 2], ['bloc.establishment', -7], ['nation.integrity', -4]],
          ops: [['fundmove', 'abroad', 'states', 0.6]],
          exposure: { kind: 'personal', amount: 25, witnesses: ['fin', 'sap'], trail: 2 },
          archive: 'Raided the fund abroad before the election.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'oil.shortfall', kind: 'recurring', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3, reactive: true, topic: 'oil',
    when: all(v('oil.gap', '<', -12), v('fund.buffer', '<', 0.2), { turn: [9] }), cooldown: 12, max: 4, weight: 16,
    office: 'Budget Office of the Federation', stamp: 'URGENT',
    title: 'Oil is far below what the budget assumed',
    body: [
      'Crude is selling at ${OIL} a barrel. The budget you signed assumed ${BENCH}. The stabilisation account is empty.',
      'Every month the gap comes straight out of the treasury. At this rate the capital budget cannot be released in full.',
    ],
    trace: [['fund.buffer', -1]],
    reads: [
      { role: 'fin', good: 'We budgeted on a price we did not get and saved nothing against it, {SIR}. We cut, we borrow, or we print. I would cut and borrow, in that order.', weak: 'The price will recover, {SIR}.' },
    ],
    choices: [
      {
        id: 'cut', label: 'Cut capital spending for the rest of the year',
        outcomes: [{
          result: 'Capital releases are halved. Sites that had just reopened close again. The books hold.',
          fx: [['nation.fiscalSpace', 0.5], ['nation.power', -2], ['nation.jobs', -2], ['bloc.party', -3]],
          later: [{ after: [5, 8], fx: [['nation.power', -1.5]], label: 'Projects starved of capital fall behind.' }],
          news: ['FG CUTS CAPITAL BUDGET AS OIL SLUMPS', 'OIL FALL, GOVERNMENT CUT PROJECT'],
          archive: 'Cut capital spending when oil fell below the budget benchmark.', sig: 2,
        }],
      },
      {
        id: 'borrow', label: 'Borrow through it', requires: v('nation.debt', '<', 100), locked: 'Nobody will lend at this level of debt.',
        outcomes: [{
          result: 'The Debt Office sells ₦700bn of bonds. Spending continues as budgeted. The debt is that much larger.',
          fx: [['nation.fiscalSpace', 0.7], ['debt.bonds', 0.7]],
          news: ['FG BORROWS ₦700BN TO COVER OIL SHORTFALL', 'OIL MONEY NO REACH. GOVERNMENT DON BORROW AGAIN'],
          archive: 'Borrowed to cover an oil revenue shortfall.',
        }],
      },
      {
        id: 'print', label: 'Have the central bank cover the gap',
        outcomes: [{
          result: 'The overdraft is extended by a trillion. Nothing is cut and nothing is borrowed. Everything will simply cost more.',
          fx: [['nation.fiscalSpace', 1], ['debt.ways', 1], ['tycoon.ty_bank', -6], ['bloc.establishment', -5]],
          news: ['CENTRAL BANK FUNDS BUDGET GAP', 'DEM DON START TO PRINT AGAIN'],
          archive: 'Had the central bank cover an oil revenue shortfall.',
        }],
      },
    ],
  },

  // ================================================================ the money men
  {
    id: 'tycoon.hoard', kind: 'recurring', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3, reactive: true, topic: 'prices',
    when: all(v('tycoon.ty_trade', '<', 35), { turn: [6] }), cooldown: 16, max: 3, weight: 15,
    office: 'Federal Ministry of Industry, Trade and Investment', stamp: 'URGENT',
    title: 'There is no rice in the market',
    body: [
      'The price of a bag of rice has risen by a third in three weeks. There has been no change in the harvest, the exchange rate or the duty.',
      'Customs reports that the warehouses of Chief (Dr) Obinna Ezeudu are full to the roof. Nothing has left them since the month you and he fell out.',
      { when: v('agenda.f4', '==', 1), text: 'The automatic import rule has begun to bring in grain from outside. It will take six weeks to reach the markets.' },
      { when: { flag: 'grain.reserve' }, text: 'The strategic grain reserve you filled is full. Released into the markets, it would undercut him within a fortnight.' },
      { when: { flag: 'inst.reserve' }, text: 'The grain reserve agency has stock in its silos and the authority to sell it.' },
    ],
    trace: [['tycoon.ty_trade', -1]],
    reads: [
      { role: 'fin', good: 'He is showing you what he can do, {SIR}. You can outlast him if the borders are open. If they are not, he is the border.', weak: 'It is a seasonal fluctuation, {SIR}.' },
      { role: 'sap', good: 'Raid him and the party\'s donors all learn something. Go and see him and he learns something. Decide which lesson you can afford.' },
    ],
    choices: [
      {
        id: 'raid', label: 'Send Customs and the cameras into his warehouses', pc: 5,
        outcomes: [{
          result: 'The warehouses are opened on live television. Four hundred thousand tonnes are sold at the gate. He issues a statement about "the investment climate".',
          fx: [['nation.inflation', -1.5], ['approval', 2], ['bloc.street', 4], ['bloc.establishment', -4], ['tycoon.ty_trade', -10], ['bloc.party', -3]],
          news: ['CUSTOMS SEIZES HOARDED RICE FROM EZEUDU WAREHOUSES', 'DEM OPEN EZEUDU STORE. RICE FULL EVERYWHERE'],
          archive: 'Raided Chief Ezeudu\'s warehouses during a rice shortage.', sig: 2,
        }],
      },
      {
        id: 'see', label: 'Go and see him', requires: v('granted.ty_trade', '==', 0), locked: 'You have already given him what he asked for. He wants more than there is.',
        outcomes: [{
          result: 'You see him. The lorries leave his warehouses the following morning.',
          fx: [['nation.inflation', -1]],
          ops: [['grant', 'ty_trade']],
          news: ['RICE PRICES EASE AFTER PRESIDENT MEETS IMPORTERS', 'PRESIDENT GO SEE EZEUDU. RICE DON SHOW'],
          archive: 'Gave Chief Ezeudu what he wanted to end a rice shortage.', sig: 2,
        }],
      },
      {
        id: 'release', label: 'Release the grain reserve into the markets', requires: { any: [{ flag: 'grain.reserve' }, { flag: 'inst.reserve' }] }, locked: 'There is no reserve to release. Fill one in a good harvest, or set up a reserve agency.',
        outcomes: [{
          result: 'Reserve grain reaches the markets in ten days, at last month\'s price. His warehouses are full of rice that is suddenly worth less than he paid for it. The reserve will need refilling.',
          fx: [['nation.inflation', -2], ['bloc.street', 4], ['approval', 1.5], ['tycoon.ty_trade', -8]],
          flags: { 'grain.reserve': false },
          news: ['FG RELEASES GRAIN RESERVE; RICE PRICES FALL', 'GOVERNMENT DON OPEN THE RESERVE. RICE DON CHEAP'],
          archive: 'Broke a rice shortage by releasing the grain reserve.', sig: 2,
        }],
      },
      {
        id: 'open', label: 'Open the borders to rice for ninety days', requires: v('agenda.f4', '==', 0),
        outcomes: [{
          result: 'Rice comes in over every land border. The price falls in a month. His stock is suddenly worth a good deal less than he paid for it.',
          fx: [['nation.inflation', -2], ['bloc.street', 3], ['tycoon.ty_trade', -6], ['bloc.party', -3], ['nation.jobs', -1]],
          news: ['FG OPENS BORDERS TO RICE FOR 90 DAYS', 'BORDER DON OPEN. RICE GO CHEAP'],
          archive: 'Opened the borders to break a rice shortage.',
        }],
      },
      {
        id: 'wait', label: 'Wait for the harvest',
        outcomes: [{
          when: { flag: 'inst.reserve' },
          result: 'The reserve agency sells from its silos on its own authority. It takes the edge off; it does not end it.',
          fx: [['nation.inflation', 0.8], ['approval', -1], ['bloc.street', -1]],
          news: ['RESERVE AGENCY SELLS GRAIN AS RICE PRICES CLIMB', 'RESERVE AGENCY DEY SELL. E HELP SMALL'],
          archive: 'Left a rice shortage to the grain reserve agency.',
        }, {
          result: 'The harvest is three months off. People notice every one of them.',
          fx: [['nation.inflation', 2], ['approval', -3], ['bloc.street', -4]],
          news: ['RICE HITS RECORD AS FG URGES CALM', 'RICE DON COST PASS. GOVERNMENT SAY MAKE WE WAIT'],
          archive: 'Waited out a rice shortage.',
        }],
      },
    ],
  },
  {
    id: 'tycoon.layoff', kind: 'recurring', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3, reactive: true, topic: 'money',
    when: all(v('tycoon.ty_maker', '<', 35), { turn: [6] }), cooldown: 18, max: 2, weight: 14,
    office: 'Federal Ministry of Industry, Trade and Investment', stamp: 'URGENT',
    title: 'Birniwa is closing two plants',
    body: [
      'Alhaji Kabir Birniwa has announced the closure of two factories and the loss of nine thousand jobs, citing "an environment that is no longer conducive".',
      'He made the announcement at one of the plants, in front of the workers, and named the policy he holds responsible. It is one of yours.',
    ],
    trace: [['tycoon.ty_maker', -1]],
    reads: [
      { role: 'fin', good: 'The plants made money last year, {SIR}. This is a negotiation conducted with nine thousand hostages.', weak: 'We should consider his concerns, {SIR}.' },
    ],
    choices: [
      {
        id: 'credit', label: 'Offer a credit line to keep the plants open', naira: 0.3,
        outcomes: [{
          result: 'The credit is accepted. The plants stay open. He describes the outcome as "constructive", which is his word for winning.',
          fx: [['nation.jobs', 2], ['tycoon.ty_maker', 10], ['bloc.street', 2]],
          news: ['FG CREDIT LINE SAVES 9,000 FACTORY JOBS', 'GOVERNMENT GIVE BIG MAN LOAN, WORKERS KEEP JOB'],
          archive: 'Paid to keep Birniwa\'s factories open.',
        }],
      },
      {
        id: 'seize', label: 'Put the plants into receivership and keep them running', pc: 8,
        outcomes: [{
          result: 'A receiver is appointed over both plants. They stay open under managers who have never run a factory. Every other investor in the country takes note.',
          fx: [['nation.jobs', 1], ['bloc.establishment', -7], ['tycoon.ty_maker', -10], ['bloc.street', 4]],
          later: [{ after: [6, 9], fx: [['nation.jobs', -3], ['nation.fiscalSpace', -0.2]], label: 'The plants in receivership are losing money the state must cover.' }],
          news: ['FG TAKES OVER BIRNIWA PLANTS', 'GOVERNMENT DON COLLECT THE FACTORY'],
          archive: 'Took Birniwa\'s factories into receivership.', sig: 3,
        }],
      },
      {
        id: 'close', label: 'Let them close',
        outcomes: [{
          result: 'The gates are locked on a Friday. Nine thousand people go home. He has shown what he came to show.',
          fx: [['nation.jobs', -4], ['bloc.street', -4], ['approval', -2]],
          news: ['9,000 JOBS GO AS BIRNIWA SHUTS PLANTS', 'FACTORY DON CLOSE. 9,000 PEOPLE DON LOSE WORK'],
          archive: 'Let Birniwa close two factories.',
        }],
      },
    ],
  },
  {
    id: 'tycoon.depots', kind: 'recurring', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3, reactive: true, topic: 'prices',
    when: all(v('tycoon.ty_fuel', '<', 35), v('pressure.fuelSupplyStress', '>', 40), { turn: [6] }), cooldown: 16, max: 3, weight: 15,
    office: 'Office of the Chief of Staff', stamp: 'URGENT',
    title: 'The depots are "under maintenance"',
    body: [
      'Nine of the country\'s largest fuel depots have closed for maintenance in the same week. All nine belong to Chief Tonye Amangala.',
      'Queues have formed in six cities. He has let it be known that the maintenance could be completed quite quickly.',
    ],
    statement: 'There is no scarcity. Motorists are advised against panic buying.',
    trace: [['tycoon.ty_fuel', -1], ['pressure.fuelSupplyStress', 1]],
    reads: [
      { role: 'fin', good: 'He supplies a third of the petrol, {SIR}. We can replace him through the oil company, at a cost, or we can pay what he says he is owed.', weak: 'Maintenance is routine, {SIR}.' },
    ],
    choices: [
      {
        id: 'import', label: 'Have the oil company import directly and bypass him', naira: 0.4,
        outcomes: [{
          result: 'Cargoes are landed at the state depots. The queues clear in three weeks. His depots reopen, with nothing to sell.',
          fx: [['pressure.fuelSupplyStress', -22], ['tycoon.ty_fuel', -6], ['approval', 1]],
          news: ['OIL COMPANY IMPORTS DIRECT AS PRIVATE DEPOTS SHUT', 'GOVERNMENT BRING FUEL BY ITSELF. QUEUE DON REDUCE'],
          archive: 'Bypassed Amangala\'s depots with direct imports.', sig: 2,
        }],
      },
      {
        id: 'pay', label: 'Pay what he says he is owed', requires: v('granted.ty_fuel', '==', 0), locked: 'You have paid him once already.',
        outcomes: [{
          result: 'The maintenance is completed overnight.',
          ops: [['grant', 'ty_fuel']],
          news: ['DEPOTS REOPEN AFTER FG SETTLES MARKETERS\' CLAIMS', 'DEPOT DON OPEN. GOVERNMENT PAY SOMETHING'],
          archive: 'Paid Amangala\'s claims to reopen his depots.', sig: 2,
        }],
      },
      {
        id: 'padlock', label: 'Send the regulator to revoke the depot licences', pc: 5,
        outcomes: [{
          result: 'Three licences are revoked on camera. The other six depots discover that their maintenance is finished.',
          fx: [['pressure.fuelSupplyStress', -12], ['tycoon.ty_fuel', -10], ['bloc.establishment', -3], ['approval', 1]],
          news: ['REGULATOR REVOKES THREE DEPOT LICENCES', 'DEM SEIZE AMANGALA DEPOT. THE REST DON OPEN SHARP SHARP'],
          archive: 'Revoked Amangala\'s depot licences.',
        }],
      },
      {
        id: 'wait', label: 'Call it maintenance and wait',
        outcomes: [{
          result: 'The queues lengthen. The black-market price doubles. The maintenance continues.',
          fx: [['approval', -3], ['bloc.street', -4], ['pressure.fuelSupplyStress', 10]],
          news: ['FUEL QUEUES SPREAD TO SIX CITIES', 'NO FUEL. GOVERNMENT SAY NA "MAINTENANCE"'],
          archive: 'Waited out a fuel scarcity engineered by Amangala.',
        }],
      },
    ],
  },
  {
    id: 'tycoon.offer', kind: 'recurring', slot: 'minor', category: 'temptation', tone: 'dry', intensity: 1, channel: 'phone', office: 'Phone',
    cast: { WHO: 'generousTycoon' }, from: '{WHO}',
    when: all({ term: 1 }, { termTurn: [26, 43] }, { not: { flag: 'ticket.lost' } }), cooldown: 8, max: 2, weight: 12,
    title: 'A small contribution',
    body: ['Your Excellency. A small contribution to the work ahead: ₦8bn, through the usual channels. No conditions whatsoever. Kindly confirm where it should go.'],
    choices: [
      {
        id: 'take', label: 'Say where it should go',
        outcomes: [{
          result: 'The money reaches the campaign through eleven companies and a foundation. Nothing is asked for in return, which is how you know it will be something large.',
          fx: [['campaign', 8], ['pressure.scandalHeat', 3]],
          favour: ['$WHO', 'owing', 2],
          exposure: { kind: 'political', amount: 8, witnesses: ['$WHO'], trail: 1 },
          archive: 'Took ₦8bn from {WHO} for the campaign.',
        }],
      },
      {
        id: 'decline', label: 'Say thank you, and decline',
        outcomes: [{
          result: 'There is a pause on the line, and then the observation that the offer remains open. It is the first time anybody has said no.',
          fx: [['tycoon.$WHO', -3], ['nation.integrity', 0.5], ['counter.declined', 1]],
          archive: 'Declined campaign money from {WHO}.',
        }],
      },
    ],
    ignored: { result: 'You do not reply. It is taken as a no, and with mild offence.', fx: [['tycoon.$WHO', -2], ['counter.declined', 1]], archive: 'Left an offer of campaign money from {WHO} unanswered.' },
  },
  {
    id: 'tycoon.paper', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 3, reactive: true,
    when: all(v('tycoon.ty_media', '>=', 45), { any: [v('story.drawer', '>=', 1), v('story.minister', '>=', 1), v('story.licence', '>=', 1)] }), weight: 18,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: 'Oyewole can make the story go away',
    body: [
      'A newspaper series is running against the government and has two parts to go. Otunba Gbenga Oyewole owns one of the papers carrying it and advertises in the others.',
      'He has sent word that he "regrets the tone" and that it could, if you wished, be allowed to lapse.',
    ],
    reads: [
      { role: 'sap', good: 'He can do it, {SIR}. And once he has done it for you, he can undo it, and you will both know that.' },
      { role: 'info', good: 'I could issue a rebuttal, {SIR}.', weak: 'We should issue a strong statement, {SIR}.' },
    ],
    choices: [
      {
        id: 'bury', label: 'Let him deal with it',
        outcomes: [{
          result: 'The series ends without its final parts. No explanation is printed. You owe him now, and he is not a man who forgets a debt he can collect.',
          fx: [['pressure.scandalHeat', -8], ['nation.integrity', -2], ['bloc.press', -2]],
          ops: [['storyend']],
          favour: ['ty_media', 'owing', 2],
          archive: 'Had Otunba Oyewole kill a newspaper series.',
        }],
      },
      {
        id: 'answer', label: 'Answer the story yourself, on the record', pc: 4,
        outcomes: [{
          result: 'You give the paper an hour, with the documents on the table. It is uncomfortable. The next part of the series is shorter and less sure of itself.',
          fx: [['pressure.scandalHeat', -8], ['bloc.press', 5], ['approval', -1], ['nation.integrity', 1]],
          news: ['PRESIDENT ANSWERS ALLEGATIONS IN ON-RECORD INTERVIEW', 'PRESIDENT SIT DOWN ANSWER QUESTION. WE NEVER SEE THAT ONE BEFORE'],
          archive: 'Answered a newspaper investigation on the record.', sig: 2,
        }],
      },
      {
        id: 'leave', label: 'Let it run',
        outcomes: [{
          result: 'You send no reply. The series continues.',
          fx: [['tycoon.ty_media', -3], ['counter.letrun', 1]],
          quiet: 'A decision not to answer. The series itself is already in the papers.', archive: 'Declined Otunba Oyewole\'s offer to kill a story.',
        }],
      },
    ],
  },

  // ================================================================ your ministers
  {
    id: 'min.star', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2, reactive: true, topic: 'people',
    cast: { WHO: 'starMinister' }, when: { turn: [14] }, cooldown: 30, max: 2, weight: 12,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: '{WHO_SHORT} is being measured for your chair',
    body: [
      '{WHO}, {WHO_TITLE}, has the best record in your cabinet, and has made sure it is known. Two newspapers have run profiles. One used the word "presidential".',
      'A group calling itself "Friends of {WHO_SHORT}" has opened an office in Abuja. Nobody will say who pays the rent.',
    ],
    reads: [
      { role: 'sap', good: 'You have three choices, {SIR}: make the ambition yours, cut it down, or pretend not to see it. The third is the one that usually ends presidencies.' },
    ],
    choices: [
      {
        id: 'back', label: 'Praise {WHO_SHORT} in public and bind the ambition to yours',
        outcomes: [{
          result: 'You call {WHO_SHORT} "the future of this party" at a public event. The minister is delighted. Several governors, each of whom thought that was them, are not.',
          fx: [['person.$WHO', 14], ['bloc.party', -4], ['person.gov_sw', -8], ['nation.capacity', 1]],
          favour: ['$WHO', 'owed', 2],
          news: ['PRESIDENT HAILS {WHO_SHORT} AS "THE FUTURE"', 'PRESIDENT DON ANOINT {WHO_SHORT}? GOVERNORS DEY LOOK'],
          archive: 'Publicly endorsed {WHO} as a future leader.', sig: 2,
        }],
      },
      {
        id: 'clip', label: 'Take the best part of the brief away',
        outcomes: [{
          result: 'The ministry is "restructured". {WHO_SHORT} keeps the title and loses the budget. The reforms in the brief slow down.',
          fx: [['person.$WHO', -20], ['nation.capacity', -2], ['bloc.villa', 2]],
          ops: [['mark', '$WHO', -1, 'Had the brief cut by the President']],
          news: ['MINISTRY SPLIT IN SURPRISE RESTRUCTURING', 'DEM DON CUT {WHO_SHORT} WING'],
          archive: 'Clipped the wings of {WHO}.',
        }],
      },
      {
        id: 'brief', label: 'Have the Villa brief against {WHO_SHORT}',
        outcomes: [{
          result: 'Unnamed sources describe the minister as "a good administrator with no political base". The minister knows exactly which unnamed sources.',
          fx: [['person.$WHO', -10], ['bloc.press', -2], ['bloc.villa', 2], ['counter.briefed', 1]],
          quiet: 'Unattributed briefing. It reaches the papers only as anonymous comment.', archive: 'Had the Villa brief against {WHO}.',
        }],
      },
      {
        id: 'ignore', label: 'Let the work speak. It is good work',
        outcomes: [{
          result: 'You do nothing. The minister goes on delivering. The office in Abuja takes a second floor.',
          fx: [['person.$WHO', 3], ['rival.alt', 2], ['counter.ambition', 1]],
          quiet: 'Nothing is done, so there is nothing to report.', archive: 'Left {WHO} to it.',
        }],
      },
    ],
  },
  {
    id: 'min.failing', kind: 'recurring', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2, reactive: true, topic: 'people',
    cast: { WHO: 'weakMinister' }, when: { turn: [12] }, cooldown: 20, max: 3, weight: 13,
    office: 'Office of the Chief of Staff', stamp: 'CONFIDENTIAL',
    title: '{WHO_SHORT} is not delivering',
    body: [
      'The Chief of Staff has put the ministerial scorecards on your desk with one name circled: {WHO}, {WHO_TITLE}.',
      'Nothing in the brief has been delivered. Everything in it is described as "95% complete".',
      'The minister is somebody\'s nominee. Whoever that is will take a dismissal personally.',
    ],
    reads: [
      { role: 'cos', good: 'Every reform in that brief is running slow, {SIR}, and every big bet in it is likelier to fail. That is what the minister costs you each month.' },
      { role: 'sap', good: 'Sack the minister and you answer to the sponsor. Keep the minister and the sponsor owes you. It depends which you need more.' },
    ],
    choices: [
      {
        id: 'sack', label: 'Dismiss {WHO_SHORT} and appoint on merit', pc: 6,
        outcomes: [{
          result: 'The letter is delivered before breakfast.',
          fx: [['nation.capacity', 2], ['bloc.press', 3]],
          ops: [['sack', '$WHO', 'technocrat']],
          news: ['PRESIDENT SACKS {WHO_SHORT}, NAMES TECHNOCRAT', '{WHO_SHORT} DON GO. PERSON WEY SABI WORK DON ENTER'],
          archive: 'Dismissed {WHO} for failing to deliver.', sig: 2,
        }],
      },
      {
        id: 'target', label: 'Give {WHO_SHORT} six months and a target in writing',
        outcomes: [{
          result: 'The minister signs the target in your presence and is visibly shaken to learn that it will be checked. The Chief of Staff diarises the review for six months from today.',
          // No credit until the target is met. The review itself waits on contract R4 (a stored target and
          // the minister's scorecard as a variable); the flag records that a target is outstanding.
          fx: [['person.$WHO', -4], ['nation.capacity', 1], ['counter.targets', 1]],
          flags: { 'target.$WHO': true },
          ops: [['target', '$WHO', 6]],
          quiet: 'The target is signed in private. It becomes news only if it is missed.', archive: 'Put {WHO} on a written target, to be reviewed in six months.',
        }],
      },
      {
        id: 'protect', label: 'Keep {WHO_SHORT}. The party would not forgive it',
        outcomes: [{
          result: 'The minister stays. Word reaches the sponsor that the President held the line. Both of them now owe you.',
          fx: [['bloc.party', 3], ['nation.capacity', -2], ['person.$WHO', 10]],
          favour: ['$WHO', 'owed', 2],
          quiet: 'Keeping a minister is not news. The sponsor hears of it privately.', archive: 'Kept {WHO} in post despite the scorecard.',
        }],
      },
    ],
  },
  {
    id: 'min.dirty', kind: 'recurring', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 3, reactive: true,
    cast: { WHO: 'dirtyMinister' }, when: all({ turn: [10] }, v('pressure.scandalHeat', '>', 28)), cooldown: 14, max: 3, weight: 12,
    office: 'Office of the Auditor-General for the Federation', stamp: 'SECRET',
    title: 'The auditors have found something in {WHO_SHORT}\'s ministry',
    body: [
      'The Auditor-General has sent you a file, by hand, about {WHO}, {WHO_TITLE}.',
      'Eleven contracts were awarded to companies that share two addresses. ₦40bn has been paid. The projects cannot be located.',
      'The minister has not been told that the file exists.',
    ],
    reads: [
      { role: 'sap', good: 'If you act, the party asks who is next. If you keep the file, the minister is yours for life, and so is the file.' },
      { role: 'info', good: 'If it is going to come out, {SIR}, it is better that it comes out from us.', weak: 'We should deny it, {SIR}.' },
    ],
    choices: [
      {
        id: 'prosecute', label: 'Dismiss {WHO_SHORT} and send the file to the prosecutors', pc: 8,
        outcomes: [{
          result: 'The minister is dismissed at noon and arraigned within the month. The party is very quiet.',
          fx: [['nation.integrity', 4], ['approval', 2], ['bloc.press', 5], ['bloc.party', -6], ['pressure.scandalHeat', -10]],
          ops: [['charge', '$WHO', 'Eleven contracts to companies at two addresses', 0.04], ['sack', '$WHO', 'technocrat'], ['seen', '$WHO'], ['storyend', 'minister']],
          news: ['PRESIDENT SACKS {WHO_SHORT}; MINISTER TO FACE TRIAL', '{WHO_SHORT} DON ENTER WAHALA. PRESIDENT HAND AM OVER'],
          archive: 'Dismissed and prosecuted {WHO}.', sig: 3,
        }],
      },
      {
        id: 'resign', label: 'A quiet resignation "on health grounds"',
        outcomes: [{
          result: 'The minister resigns to attend to a medical condition and is thanked for meritorious service. The party supplies a replacement. The ₦40bn is not mentioned.',
          fx: [['nation.integrity', 1], ['bloc.party', -1], ['pressure.scandalHeat', -4]],
          ops: [['sack', '$WHO', 'party'], ['seen', '$WHO'], ['storyend', 'minister']],
          news: ['{WHO_SHORT} RESIGNS ON HEALTH GROUNDS', '{WHO_SHORT} "SICK", RESIGN. WE SABI THE SICKNESS'],
          archive: 'Eased {WHO} out quietly.',
        }],
      },
      {
        id: 'keep', label: 'Keep the minister. The file goes in your drawer',
        outcomes: [{
          result: 'You show the minister the first page and put the file away. The minister understands the arrangement at once. So, in time, will a newspaper.',
          fx: [['nation.integrity', -2], ['person.$WHO', 15]],
          favour: ['$WHO', 'owed', 3],
          ops: [['seen', '$WHO'], ['mark', '$WHO', -1, 'Audit: questions over the ministry\'s accounts'], ['story', 'minister', '$WHO']],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['$WHO'], trail: 2 },
          archive: 'Kept the auditors\' file on {WHO} and kept the minister.',
        }],
      },
    ],
  },

  // ================================================================ the opposition acts
  {
    id: 'opp.woo', kind: 'chain', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, reactive: true, topic: 'people',
    cast: { WHO: 'wooed' }, max: 3,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: 'Dandume has been to see {WHO_SHORT}',
    body: [
      'Senator Garba Dandume spent the weekend at the country home of {WHO}, who {WHO_TITLE}.',
      '{WHO_SHORT} has not returned your Chief of Staff\'s call. What {WHO_SHORT} has wanted from you, and not had, is this: {WHO_WANT}',
      'If {WHO_SHORT} goes, the delegates go too, and so does anything that was owed to you.',
    ],
    reads: [
      { role: 'sap', good: 'Not gone yet, {SIR}. Waiting to see what you do this week. People who have decided do not leak the meeting.' },
    ],
    choices: [
      {
        id: 'grant', label: 'Give {WHO_SHORT} what was asked for', requires: v('granted.$WHO', '==', 0),
        outcomes: [{
          result: 'It is done, and announced. Dandume is told there is nothing to discuss.',
          ops: [['grant', '$WHO']],
          news: ['{WHO_SHORT} "FIRMLY" WITH PRESIDENT AFTER VILLA TALKS', '{WHO_SHORT} NO GO ANYWHERE AGAIN. PRESIDENT DON SETTLE AM'],
          archive: 'Kept {WHO} from defecting by granting what was asked.', sig: 2,
        }],
      },
      {
        id: 'call', label: 'Send the jet for {WHO_SHORT} tonight', pc: 4,
        outcomes: [{
          result: 'Three hours, alone. You promise nothing specific and mean most of it. {WHO_SHORT} goes home thoughtful.',
          fx: [['person.$WHO', 12]],
          quiet: 'A meeting at night, without an announcement.', archive: 'Talked {WHO} out of defecting, for now.',
        }],
      },
      {
        id: 'file', label: 'Remind {WHO_SHORT} what is in the file',
        outcomes: [{
          result: 'A message is passed about certain accounts. {WHO_SHORT} stays, and will not forgive it.',
          fx: [['nation.integrity', -1.5], ['pc', -4]],
          ops: [['lean', '$WHO']],
          archive: 'Threatened {WHO} to prevent a defection.',
        }],
      },
      {
        id: 'go', label: 'Let {WHO_SHORT} go',
        outcomes: [{
          result: 'You say, in public, that the party is bigger than any individual. The individual concerned takes the hint.',
          fx: [['person.$WHO', -8], ['bloc.party', -2], ['rival.strong', 3]],
          news: ['{WHO_SHORT} FREE TO LEAVE: "THE PARTY IS BIGGER THAN ANY INDIVIDUAL" — PRESIDENCY', 'PRESIDENT SAY MAKE {WHO_SHORT} GO IF E WAN GO'], archive: 'Did nothing to stop {WHO} from talking to the opposition.',
        }],
      },
    ],
  },
  {
    id: 'favour.offer', kind: 'recurring', slot: 'lead', category: 'temptation', tone: 'dry', intensity: 2, topic: 'scandal',
    cast: { WHO: 'troubledGovernor' }, when: all({ turn: [9] }, v('nation.integrity', '>', 20)), cooldown: 22, max: 3, weight: 8,
    office: 'Office of the Attorney General of the Federation', stamp: 'SECRET',
    title: 'The anti-graft agency is about to charge {WHO_SHORT}',
    body: [
      'The anti-corruption agency has completed its investigation of {WHO}, who {WHO_TITLE}. Charges will be filed on Monday.',
      '{WHO_SHORT} telephoned at midnight. He did not ask for anything. He said he hoped you would remember who your friends are.',
      { when: v('inst.graft', '>=', 0), text: 'It is the agency you set up that built this case. Its chief will learn what you decide, and so will every investigator under the chief.' },
    ],
    reads: [
      { role: 'sap', good: 'A governor who owes you his liberty is worth more than a governor who likes you, {SIR}. He is also a witness to what you did.' },
    ],
    choices: [
      {
        id: 'review', label: 'Have the file sent back "for further review"',
        outcomes: [{
          result: 'The file is recalled for review. It will be under review for the rest of your presidency. He sends a ram at Sallah, and his delegates whenever you ask.',
          fx: [['nation.integrity', -3], ['person.$WHO', 12], ['pressure.scandalHeat', 3]],
          favour: ['$WHO', 'owed', 3],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['$WHO'], trail: 2 },
          archive: 'Stopped the prosecution of {WHO}.',
        }],
      },
      {
        id: 'warn', label: 'Let him know it is coming, and nothing more',
        outcomes: [{
          result: 'He is told on Friday. By Monday his lawyers have an injunction. He knows who warned him.',
          fx: [['nation.integrity', -1], ['person.$WHO', 5]],
          favour: ['$WHO', 'owed', 1],
          archive: 'Tipped off {WHO} about a prosecution.',
        }],
      },
      {
        id: 'law', label: 'Let the law take its course',
        outcomes: [{
          result: 'The charges are filed. He is photographed on the steps of the court. He tells the cameras he is the victim of a witch-hunt directed from the Villa.',
          fx: [['person.$WHO', -16], ['nation.integrity', 2.5], ['bloc.press', 3], ['bloc.party', -4]],
          ops: [['charge', '$WHO', 'Theft of state funds while governor', 0.15], ['governors', -2]],
          news: ['{WHO_SHORT} ARRAIGNED ON CORRUPTION CHARGES', 'DEM DON CARRY {WHO_SHORT} GO COURT'],
          archive: 'Allowed the prosecution of {WHO} to proceed.', sig: 2,
        }],
      },
    ],
  },

  // ================================================================ the theatres
  {
    id: 'sec.oil', kind: 'recurring', slot: 'lead', category: 'security', tone: 'dry', intensity: 3, reactive: true, topic: 'oil',
    when: all(v('theatre.SS', '>', 64), { turn: [5] }), cooldown: 18, max: 3, weight: 13,
    office: 'Office of the National Security Adviser', stamp: 'SECRET',
    title: 'A quarter of the oil is being stolen',
    body: [
      'Output has fallen to {OUTPUT} million barrels a day. The wells are producing more than that. The difference leaves through illegal connections, in barges, at night, within sight of three naval bases.',
      'Every barrel lost is revenue the budget assumed.',
      { when: v('focus.SS', '==', 1), text: 'The forces you concentrated in the creeks have slowed it. They have not stopped it, because the people stealing are better paid than the people guarding.' },
    ],
    trace: [['theatre.SS', 1], ['nation.integrity', -1]],
    reads: [
      { role: 'nsa', good: 'I can tell you which vessels, {SIR}, and who owns them. Some of the owners have been to dinner here.' },
      { role: 'fin', good: 'It is the largest single leak in the budget. Measure what leaves the terminals and most of it stops.', weak: 'Losses are within industry norms, {SIR}.' },
    ],
    choices: [
      {
        id: 'meter', label: 'Meter every terminal and publish the volumes daily', pc: 8, naira: 0.2,
        requires: { not: { flag: 'oil.metered' } }, locked: 'The terminals are already metered.',
        outcomes: [{
          result: 'Meters go on every export terminal. What leaves is published each morning. Within a quarter the "losses" have halved, having been measured.',
          fx: [['theatre.SS', -9], ['nation.integrity', 3], ['bloc.establishment', -4]],
          flags: { 'oil.metered': true },
          news: ['OIL THEFT COLLAPSES AS TERMINALS ARE METERED', 'DEM PUT METER. THE OIL THIEF DON REDUCE'],
          archive: 'Metered every oil terminal and published daily volumes.', sig: 3,
        }],
      },
      {
        id: 'contract', label: 'Pay the men who know the creeks to guard the pipelines',
        outcomes: [{
          result: 'A surveillance contract goes to a company owned by people who used to break the pipelines. Theft falls sharply on the lines they guard. They now have a contract, and a veto.',
          fx: [['theatre.SS', -12], ['nation.integrity', -3], ['bonus.fiscal', -0.012], ['zone.SS.approval', 3]],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['gov_ss'], trail: 1 },
          news: ['FG AWARDS PIPELINE SURVEILLANCE CONTRACT', 'DEM GIVE THE CONTRACT TO THE SAME PEOPLE WEY DEY BREAK PIPE'],
          archive: 'Paid former militants to guard the pipelines.', sig: 2,
        }],
      },
      {
        id: 'navy', label: 'Order the navy to burn every illegal refinery it finds', naira: 0.3,
        outcomes: [{
          result: 'Four hundred illegal refineries are destroyed in a month. So is a good deal of mangrove, and the livelihood of every village near one.',
          fx: [['theatre.SS', -6], ['zone.SS.approval', -4]],
          later: [{ after: [5, 8], fx: [['theatre.SS', 5]], label: 'The illegal refineries are rebuilt.' }],
          news: ['NAVY DESTROYS 400 ILLEGAL REFINERIES', 'NAVY BURN KPO-FIRE REFINERY. VILLAGE PEOPLE DEY CRY'],
          archive: 'Ordered the navy to destroy illegal refineries.',
        }],
      },
    ],
  },
  {
    id: 'sec.sitathome', kind: 'recurring', slot: 'lead', category: 'security', tone: 'dry', intensity: 3, reactive: true,
    when: all(v('theatre.SE', '>', 66), { turn: [5] }), cooldown: 18, max: 3, weight: 12,
    office: 'Office of the National Security Adviser', stamp: 'SECRET',
    title: 'The South East has stopped opening on Mondays',
    body: [
      'For the ninth consecutive week, markets, banks and schools across the South East have stayed shut on Monday, on the orders of people nobody elected.',
      'The governors say it is fear. The traders say it is fear and agreement, in proportions they will not discuss on the telephone.',
      { when: v('zone.SE.approval', '<', 40), text: 'Approval of your government in the zone is the lowest in the country. The agitation feeds on that.' },
    ],
    trace: [['theatre.SE', 1], ['zone.SE.approval', -1]],
    reads: [
      { role: 'nsa', good: 'I can put a soldier on every junction, {SIR}. I cannot make a trader open a shop. This one is not mine to solve.' },
      { role: 'sap', good: 'They want to be asked, {SIR}. Nobody has asked them anything since the war.' },
    ],
    choices: [
      {
        id: 'go', label: 'Go there, and stay a week', pc: 4,
        outcomes: [{
          result: 'You spend a week in the five states, without the full convoy. You are told a great deal, bluntly. The Monday after you leave, half the markets open.',
          fx: [['theatre.SE', -7], ['zone.SE.approval', 7], ['person.gov_se', 6]],
          news: ['PRESIDENT SPENDS WEEK IN SOUTH EAST', 'PRESIDENT COME EAST, SLEEP ONE WEEK. PEOPLE TALK THEIR MIND'],
          archive: 'Spent a week in the South East during the sit-at-home.', sig: 2,
        }],
      },
      {
        id: 'political', label: 'Offer a political settlement: release, dialogue and projects', pc: 8, naira: 0.3,
        outcomes: [{
          result: 'Detainees are released into the custody of the zone\'s elders. Talks open. The establishment calls it surrender. The markets open on Monday.',
          fx: [['theatre.SE', -14], ['zone.SE.approval', 6], ['bloc.establishment', -5], ['bloc.party', -3], ['person.gov_se', 8]],
          news: ['FG OPENS DIALOGUE WITH SOUTH EAST AGITATORS', 'GOVERNMENT AND AGITATORS DON SIT DOWN TALK'],
          archive: 'Offered a political settlement in the South East.', sig: 3,
        }],
      },
      {
        id: 'troops', label: 'Deploy to enforce the opening of markets', naira: 0.3,
        outcomes: [{
          result: 'Soldiers stand at the market gates. The gates are open. The stalls are empty. The footage is everywhere by noon.',
          fx: [['theatre.SE', -2], ['zone.SE.approval', -7], ['bloc.press', -3]],
          later: [{ after: [3, 5], fx: [['theatre.SE', 7]], label: 'The deployment in the South East hardens the agitation.' }],
          news: ['TROOPS DEPLOYED TO REOPEN SOUTH EAST MARKETS', 'SOLDIER DEY MARKET. NOBODY COME SELL'],
          archive: 'Sent troops to enforce the opening of South East markets.',
        }],
      },
    ],
  },
  {
    id: 'sec.highway', kind: 'recurring', slot: 'lead', category: 'security', tone: 'grave', intensity: 3, reactive: true,
    when: all(v('theatre.SW', '>', 62), { turn: [5] }), cooldown: 20, max: 3, weight: 11,
    office: 'Office of the National Security Adviser', stamp: 'URGENT',
    title: 'Kidnappers on the expressway',
    body: [
      'Gunmen stopped eleven vehicles on the Lagos–Ibadan expressway at dusk yesterday and took thirty-four people into the forest. Two who resisted were killed.',
      'It is the fourth such attack on the country\'s busiest road this quarter. The police post nearest the scene had one vehicle, without fuel.',
    ],
    statement: 'The Inspector-General has deployed tactical teams and assures road users of their safety.',
    trace: [['theatre.SW', 1]],
    reads: [
      { role: 'nsa', good: 'The governors of the six states want to run their own outfit, {SIR}. It works. It is also an armed force that does not answer to you.' },
    ],
    choices: [
      {
        id: 'joint', label: 'Fund a permanent joint patrol of the highway', naira: 0.3,
        outcomes: [{
          result: 'A joint force takes over the corridor, with vehicles, fuel and radios. The victims are recovered within the fortnight.',
          fx: [['theatre.SW', -9], ['zone.SW.approval', 3]],
          news: ['JOINT FORCE TAKES OVER EXPRESSWAY SECURITY; VICTIMS FREED', 'EXPRESSWAY: SECURITY DON FULL GROUND. VICTIMS DON RETURN'],
          archive: 'Funded a permanent joint patrol of the Lagos–Ibadan expressway.', sig: 2,
        }],
      },
      {
        id: 'regional', label: 'Back the governors\' regional security outfit',
        outcomes: [{
          result: 'The regional outfit is recognised and armed. It knows the forest and clears it. It answers to six governors, one of whom wants your job.',
          fx: [['theatre.SW', -8], ['person.gov_sw', 8], ['bloc.establishment', -3], ['nation.integrity', -1], ['counter.regional', 1]],
          news: ['FG RECOGNISES SOUTH WEST SECURITY OUTFIT', 'REGIONAL SECURITY DON GET FEDERAL BACKING'],
          archive: 'Recognised the South West governors\' security outfit.', sig: 2,
        }],
      },
      {
        id: 'statement', label: 'Direct the Inspector-General to fish out the perpetrators',
        outcomes: [{
          result: 'A directive is issued. The families raise the ransom themselves.',
          fx: [['theatre.SW', 3], ['approval', -3], ['zone.SW.approval', -4], ['bloc.press', -3]],
          news: ['PRESIDENT ORDERS MANHUNT FOR EXPRESSWAY KIDNAPPERS', 'FAMILIES PAY RANSOM AS POLICE "INVESTIGATE"'],
          archive: 'Issued a directive after an expressway kidnapping.',
        }],
      },
    ],
  },
  {
    id: 'sec.insurgency', kind: 'recurring', slot: 'lead', category: 'security', tone: 'grave', intensity: 4, reactive: true,
    when: all(v('theatre.NE', '>', 76), { turn: [6] }), cooldown: 20, max: 3, weight: 12,
    office: 'Defence Headquarters', stamp: 'SECRET',
    title: 'A garrison town has fallen in the North East',
    body: [
      'Insurgents overran a garrison town in the North East at dawn. The battalion withdrew. An unknown number of soldiers and civilians are dead, and forty thousand people are on the road south.',
      'The unit had reported being short of ammunition for six weeks.',
      { when: v('focus.NE', '==', 0), text: 'The forces that might have reinforced it are deployed elsewhere.' },
    ],
    statement: 'The troops made a tactical withdrawal. The situation is being brought under control.',
    trace: [['theatre.NE', 1]],
    reads: [
      { role: 'nsa', good: 'We can retake it, {SIR}. Holding it is the question, and that is a question of money every month, not courage.' },
      { role: 'fin', good: 'The war costs what it costs, {SIR}. It costs more each month it is going badly.', weak: 'The military has adequate funding, {SIR}.' },
    ],
    choices: [
      {
        id: 'retake', label: 'Retake the town and hold it', naira: 0.5,
        outcomes: [{
          result: 'The town is retaken in nine days. A larger garrison is left behind, with supply by air.',
          fx: [['theatre.NE', -9], ['zone.NE.approval', 3], ['approval', 1]],
          ops: [['focus', 'NE']],
          news: ['TROOPS RETAKE GARRISON TOWN', 'ARMY DON COLLECT THE TOWN BACK'],
          archive: 'Retook and garrisoned a fallen town in the North East.', sig: 2,
        }],
      },
      {
        id: 'relief', label: 'Put the displaced first: food, shelter and escorts', naira: 0.3,
        outcomes: [{
          result: 'Camps are opened on the road south and supplied within the week. The town remains in the insurgents\' hands.',
          fx: [['zone.NE.approval', 5], ['theatre.NE', -2], ['bloc.street', 2]],
          news: ['FG OPENS CAMPS FOR 40,000 DISPLACED', '40,000 PEOPLE DON RUN. GOVERNMENT OPEN CAMP'],
          archive: 'Prioritised relief for those displaced from a fallen town.',
        }],
      },
      {
        id: 'commander', label: 'Replace the theatre commander', pc: 5,
        outcomes: [{
          result: 'The commander is relieved. His successor asks for ammunition before he asks for anything else.',
          fx: [['theatre.NE', -3], ['bloc.establishment', -3]],
          later: [{ after: [3, 5], fx: [['theatre.NE', -5]], label: 'The new theatre commander\'s reorganisation takes effect.' }],
          news: ['THEATRE COMMANDER REMOVED AFTER TOWN FALLS', 'PRESIDENT DON REMOVE THE COMMANDER'],
          archive: 'Replaced the theatre commander in the North East.',
        }],
      },
    ],
  },

  // ================================================================ a bet in trouble
  {
    id: 'bet.trouble', kind: 'recurring', slot: 'lead', category: 'infrastructure', tone: 'dry', intensity: 3, reactive: true, topic: 'bet',
    cast: { BET: 'shakyBet' }, cooldown: 3, max: 8, weight: 18,
    office: 'Office of the Chief of Staff', stamp: 'URGENT',
    title: '{BET}: a warning from the site',
    body: [
      'You staked the government on this. The Chief of Staff has been to see it, unannounced.',
      '{BET_RISK}',
      'It is not too late. What would put it right: {BET_FIX}',
    ],
    reads: [
      { role: 'cos', good: 'It will fail as it stands, {SIR}, and when it does the report will say why. You can fix the cause, throw money at it, or buy yourself time to do either.' },
    ],
    choices: [
      {
        id: 'rescue', label: 'Send a task team with money and authority',
        outcomes: [{
          result: 'The Villa takes it over.',
          ops: [['betrescue', '$BET']],
          archive: 'Sent a task team to rescue a big bet: {BET}.',
        }],
      },
      {
        id: 'delay', label: 'Push the opening back and fix what is wrong',
        outcomes: [{
          result: 'The date moves.',
          ops: [['betdelay', '$BET']],
          news: ['FG POSTPONES FLAGSHIP PROJECT', 'THE PROJECT DON SHIFT. AGAIN'],
          archive: 'Postponed a big bet to fix what was wrong: {BET}.',
        }],
      },
      {
        id: 'press', label: 'Press on as planned',
        outcomes: [{
          result: 'You tell the Chief of Staff that it will be fine. He writes that down.',
          fx: [['counter.pressedon', 1]],
          ops: [['betseen', '$BET']],
          archive: 'Was warned about a big bet and pressed on: {BET}.',
        }],
      },
    ],
  },
];
