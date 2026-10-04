import type { GameEvent } from '../../engine/types';

// STORYLINES: The University Agreement, and the Minimum Wage.

export const LABOUR: GameEvent[] = [
  {
    id: 'uni.ultimatum', kind: 'standalone', slot: 'lead', category: 'labour', tone: 'dry', intensity: 3,
    when: { all: [{ turn: [5] }, { flag: 'uni.agreement', is: 'inherited_unfunded' }] },
    weight: 40,
    office: 'Office of the Chief of Staff', stamp: 'URGENT',
    title: 'University academics issue fourteen-day ultimatum',
    body: [
      'The {ACADEMICS} has issued a fourteen-day ultimatum over the agreement signed eleven years ago.',
      'Full implementation would cost ₦420bn over three years. No provision exists in the current budget, or in any of the previous eleven.',
      'The Honourable Minister of Education describes negotiations so far as fruitful.',
      { when: { v: ['active.e2', '==', 1] }, text: 'The bill that would fund the universities by law is already before the Assembly. The union has noticed, and is waiting to see whether it survives the Senate.' },
      { when: { v: ['budget.people', '<', 2] }, text: 'This year\'s budget gave health and schools less than last year\'s. The union has the figures.' },
    ],
    statement: 'The Federal Government remains committed to the revitalisation of tertiary education and is engaging all stakeholders.',
    trace: [['flag:uni.agreement', 1]],
    reads: [
      { role: 'sap', good: '{SIR}, negotiations have not been fruitful. They met once. The Minister left early.' },
      { role: 'fin', on: 'implement', good: 'We can find year one only by borrowing. Years two and three are unfunded.', weak: 'It is manageable, {SIR}.' },
    ],
    choices: [
      {
        id: 'implement', label: 'Implement the agreement in full', naira: 0.42, sign: true,
        outcomes: [{
          result: 'The first release is made. The union\'s statement uses the word "commend", which its archivist confirms is a first.',
          fx: [['bloc.street', 6], ['approval', 2], ['pressure.wageGrievance', -8], ['nation.capacity', 1]],
          ops: [['mark', 'min_service', 1, 'Honoured the eleven-year-old university agreement']],
          flags: { 'uni.agreement': 'implemented' },
          follow: [{ event: 'labour.me_too', after: [3, 5] }],
          news: ['FG RELEASES FUNDS FOR UNIVERSITY AGREEMENT', 'VARSITY WAHALA DON END? LECTURERS "COMMEND" FG'],
          archive: 'Implemented the eleven-year-old university agreement in full.', sig: 3,
        }],
      },
      {
        id: 'phase', label: 'Offer phased implementation over three years', naira: 0.1,
        outcomes: [{
          result: 'The union accepts, "in good faith and with our eyes open". The second tranche is due in twelve months.',
          fx: [['bloc.street', 3], ['pressure.wageGrievance', -4]],
          flags: { 'uni.agreement': 'phased' },
          follow: [{ event: 'uni.tranche', after: 12 }],
          news: ['FG, LECTURERS AGREE PHASED IMPLEMENTATION', 'LECTURERS ACCEPT INSTALMENT PAYMENT'],
          archive: 'Promised the universities phased implementation.', sig: 2,
        }],
      },
      {
        id: 'talk', label: 'Request a further round of negotiations',
        outcomes: [{
          result: 'A new round is scheduled. The venue is changed twice.',
          fx: [['pressure.wageGrievance', 5], ['bloc.press', -1]],
          follow: [{ event: 'uni.strike', after: 2 }],
          news: ['FG, LECTURERS TO RESUME TALKS', 'TALKS ABOUT TALKS CONTINUE'],
          archive: 'Asked the university union for more talks.',
        }],
      },
      {
        id: 'committee', label: 'Constitute a Presidential Committee on University Funding',
        outcomes: [{
          result: 'The Committee is inaugurated. Its terms of reference include reviewing the reports of the previous four committees.',
          fx: [['nation.integrity', -0.5], ['counter.committees', 1], ['pressure.wageGrievance', 4]],
          follow: [{ event: 'uni.committee', after: 4 }],
          news: ['PRESIDENT SETS UP COMMITTEE ON VARSITY FUNDING', 'COMMITTEE NUMBER FIVE ON THE SAME MATTER'],
          archive: 'Referred the university agreement to a presidential committee.',
        }],
      },
      {
        id: 'refuse', label: 'Decline, and prepare for industrial action', pc: 8,
        outcomes: [{
          result: 'The Ministry informs the union that the agreement "is not implementable in its present form".',
          fx: [['bloc.establishment', 2], ['bloc.street', -3]],
          ops: [['mark', 'min_service', -1, 'Told the universities their agreement would not be honoured']],
          flags: { 'uni.agreement': 'broken' },
          follow: [{ event: 'uni.strike', after: 1 }],
          news: ['FG: VARSITY AGREEMENT "NOT IMPLEMENTABLE"', 'GOVERNMENT TELLS LECTURERS: NO MONEY'],
          archive: 'Told the university union its agreement would not be honoured.', sig: 2,
        }],
      },
      {
        id: 'law', label: 'Take the union to the Senate gallery: the funding law is being passed',
        requires: { v: ['active.e2', '==', 1] },
        outcomes: [{
          result: 'The union\'s executive watches a committee stage from the gallery. It is not impressed by the Senate. It is impressed that the bill exists, and suspends the ultimatum until the vote.',
          fx: [['bloc.street', 2], ['pressure.wageGrievance', -5], ['bloc.press', 2], ['counter.gallery', 1]],
          news: ['LECTURERS SUSPEND ULTIMATUM PENDING FUNDING BILL', 'LECTURERS SAY DEM GO WAIT FOR THE BILL'],
          archive: 'Persuaded the university union to wait for the funding law.',
        }],
      },
    ],
  },
  {
    id: 'uni.committee', kind: 'chain', slot: 'lead', category: 'labour', tone: 'farce', intensity: 2,
    office: 'Presidential Committee on University Funding', stamp: 'ROUTINE',
    title: 'The Committee on University Funding reports',
    body: [
      'The Committee has reported. It recommends implementation of the agreement signed eleven years ago.',
      'It further recommends the constitution of a standing committee to monitor implementation.',
      'The union has stated that it will not appear before any further committee "in this life".',
    ],
    trace: [['flag:uni.agreement', 1]],
    reads: [{ role: 'sap', good: 'We are where we were, {SIR}, less four months and one excuse.' }],
    choices: [
      {
        id: 'implement', label: 'Accept the report and implement', naira: 0.42,
        outcomes: [{
          result: 'Funds are released. The standing committee is quietly not constituted.',
          fx: [['bloc.street', 4], ['approval', 1], ['pressure.wageGrievance', -6]],
          flags: { 'uni.agreement': 'implemented' },
          news: ['FG ADOPTS COMMITTEE REPORT, RELEASES VARSITY FUNDS', 'FINALLY. AFTER COMMITTEE UPON COMMITTEE'],
          archive: 'Implemented the university agreement after a committee recommended it.', sig: 2,
        }],
      },
      {
        id: 'study', label: 'Direct that the report be studied',
        outcomes: [{
          result: 'A white paper committee is constituted to study the report of the committee.',
          fx: [['counter.committees', 1], ['bloc.press', -3], ['pressure.wageGrievance', 6]],
          flags: { 'uni.agreement': 'broken' },
          follow: [{ event: 'uni.strike', after: 1 }],
          news: ['WHITE PAPER PANEL TO REVIEW VARSITY REPORT', 'A COMMITTEE TO READ THE COMMITTEE\'S REPORT'],
          archive: 'Set up a committee to study the committee\'s report.',
        }],
      },
    ],
  },
  {
    id: 'uni.tranche', kind: 'chain', slot: 'lead', category: 'labour', tone: 'dry', intensity: 3,
    when: { flag: 'uni.agreement', is: 'phased' }, max: 1,
    office: 'Federal Ministry of Education', stamp: 'URGENT',
    title: 'University agreement: second tranche is due',
    body: [
      'The second tranche of ₦140bn under the phased agreement fell due last week.',
      'The Budget Office reports that the line was "inadvertently omitted" from the Appropriation Act.',
      'The union has written to remind {MRP} of the words "in good faith".',
      { when: { v: ['budget.padding', '>=', 3] }, text: 'The line was removed in the Appropriations Committee, where Senator Zango needed the room for members\' constituency projects. You signed the budget he sent back.' },
      { when: { v: ['budget.people', '>=', 3] }, text: 'This year\'s budget gave health and schools more than last year\'s. The tranche was left out all the same.' },
    ],
    trace: [['flag:uni.agreement', 1]],
    reads: [
      { role: 'fin', good: 'It was not inadvertent, {SIR}. It was the first thing cut when the envelope shrank.', weak: 'An administrative oversight, {SIR}.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Pay the tranche from the contingency vote', naira: 0.14,
        outcomes: [{
          result: 'The tranche is paid eleven days late. In this sector that counts as early. You direct that the final tranche be written into the budget as a standing line, so that nobody has to ask again.',
          fx: [['bloc.street', 4], ['pressure.wageGrievance', -8], ['approval', 1]],
          flags: { 'uni.agreement': 'implemented' },
          news: ['FG PAYS SECOND TRANCHE TO UNIVERSITIES', 'GOVERNMENT KEEPS PROMISE. MARK THE DATE'],
          archive: 'Paid the second tranche of the university agreement and made the rest a standing budget line.', sig: 2,
        }],
      },
      {
        id: 'defer', label: 'Defer to the next budget cycle',
        outcomes: [{
          result: 'The union accuses the Presidency of bad faith. It is difficult to draft a rebuttal.',
          fx: [['bloc.street', -4], ['bloc.press', -3], ['pressure.wageGrievance', 10]],
          flags: { 'uni.agreement': 'broken' },
          follow: [{ event: 'uni.strike', after: 1 }],
          news: ['LECTURERS ACCUSE FG OF BAD FAITH OVER TRANCHE', '"THEY HAVE DONE IT AGAIN" — LECTURERS'],
          archive: 'Deferred the second tranche of the university agreement.', sig: 2,
        }],
      },
      {
        id: 'zango', label: 'Have Senator Zango put the line back. He owes you',
        requires: { v: ['favour.sen_approp', '>', 0] },
        outcomes: [{
          result: 'Senator Zango discovers a drafting error and corrects it by supplementary appropriation in nine days. The tranche is paid. The favour is spent.',
          fx: [['bloc.street', 4], ['pressure.wageGrievance', -8], ['approval', 1], ['nation.fiscalSpace', -0.14]],
          ops: [['void', 'sen_approp']],
          flags: { 'uni.agreement': 'implemented' },
          news: ['SENATE RESTORES "OMITTED" UNIVERSITY FUNDING', 'SENATE DON RETURN THE MONEY DEM "FORGET"'],
          archive: 'Called in a favour to restore the university tranche to the budget.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'uni.strike', kind: 'chain', slot: 'lead', category: 'labour', tone: 'dry', intensity: 4,
    when: { not: { flag: 'uni.agreement', is: 'implemented' } }, max: 2,
    office: 'Federal Ministry of Education', stamp: 'URGENT',
    title: 'Universities: the strike enters its third month',
    body: [
      'All federal universities have been closed for nine weeks. 1.8 million students are at home.',
      'Student union leaders have blocked the Lagos–Ibadan expressway and the airport road in Abuja.',
      'The Honourable Minister has invoked "no work, no pay". The union has replied that this is the status quo.',
      { when: { v: ['theatre.SW', '>', 55] }, text: 'The blockade of the expressway has held traffic still for hours at a time. The gangs who work that road have had their best month.' },
    ],
    trace: [['flag:uni.agreement', 1]],
    reads: [
      { role: 'sap', good: 'Parents vote, {SIR}. Every week this runs is a week they are feeding an idle undergraduate.' },
      { role: 'edu', good: 'They will return if we pay the withheld salaries and half of the first tranche.', weak: 'Discussions remain fruitful, {SIR}.' },
    ],
    choices: [
      {
        id: 'settle', label: 'Settle: pay withheld salaries and fund year one', naira: 0.3,
        outcomes: [{
          result: 'Lecture halls reopen. The academic calendar is declared "adjusted", meaning a year has been lost and renamed.',
          fx: [['bloc.street', 5], ['approval', 1.5], ['pressure.wageGrievance', -8]],
          flags: { 'uni.agreement': 'phased' },
          follow: [{ event: 'uni.tranche', after: 12 }],
          news: ['UNIVERSITIES REOPEN AFTER FG, UNION DEAL', 'SCHOOL DON RESUME! STUDENTS REJOICE, SMALL'],
          archive: 'Settled the university strike with a partial payment.', sig: 2,
        }],
      },
      {
        id: 'nopay', label: 'Enforce "no work, no pay" and wait', pc: 6,
        outcomes: [
          {
            chance: 0.45,
            result: 'After five months the union suspends the strike without an agreement. The best lecturers have used the time to find jobs abroad.',
            fx: [['bloc.street', -6], ['approval', -2], ['nation.capacity', -1.5], ['pressure.wageGrievance', 8]],
            flags: { 'uni.agreement': 'broken' },
            news: ['LECTURERS SUSPEND STRIKE "FOR THE STUDENTS"', 'STRIKE ENDS. HALF THE DEPARTMENT DON JAPA'],
            archive: 'Outlasted the university strike without an agreement.', sig: 2,
          },
          {
            result: 'The strike holds. Students occupy the Ministry car park. The other campus unions join in sympathy.',
            fx: [['bloc.street', -8], ['approval', -3], ['bloc.press', -3], ['pressure.wageGrievance', 10], ['theatre.SW', 2]],
            ops: [['mark', 'min_service', -1, 'The university strike spread on the ministry\'s watch']],
            follow: [{ event: 'uni.strike', after: 3 }],
            news: ['STUDENTS OCCUPY EDUCATION MINISTRY', '#OPENOURSCHOOLS: STUDENTS SLEEP FOR MINISTRY GATE'],
            archive: 'Tried to wait out the university strike. It spread.',
          },
        ],
      },
      {
        id: 'address', label: 'Meet the student leaders at the Villa',
        outcomes: [{
          result: 'The students are received, photographed and given lunch. Their communiqué thanks {MRP} and maintains every demand.',
          fx: [['bloc.street', 2], ['bloc.press', 1]],
          follow: [{ event: 'uni.strike', after: 2 }],
          news: ['PRESIDENT HOSTS STUDENT LEADERS', 'STUDENTS CHOP JOLLOF FOR VILLA. STRIKE CONTINUES'],
          archive: 'Met student leaders at the Villa while the strike continued.',
        }],
      },
    ],
  },
  {
    id: 'labour.me_too', kind: 'chain', slot: 'lead', category: 'labour', tone: 'dry', intensity: 2,
    office: 'Federal Ministry of Labour and Employment', stamp: 'ROUTINE',
    title: 'Other unions have noticed',
    body: [
      'Following the settlement with the academics, the {DOCTORS}, the polytechnic lecturers and the judiciary workers have each written to request "parity of treatment".',
      'Each cites an agreement. The Ministry has located two of the three.',
      { when: { v: ['debt.pensions', '>', 0.3] }, text: 'The pensioners\' union has written too. Theirs is not a claim for parity. It is an invoice, and it is older than any of the others.' },
    ],
    reads: [
      { role: 'labmin', good: 'The doctors\' claim is the genuine one, {SIR}, and the one where a strike kills people.' },
      { role: 'fin', good: 'We cannot honour all three. I would rather be told which than be told to find the money.', weak: 'We will manage, {SIR}.' },
    ],
    choices: [
      {
        id: 'doctors', label: 'Honour the doctors\' agreement; negotiate the others', naira: 0.15,
        outcomes: [{
          result: 'The doctors\' hazard allowance is paid. The other two unions are invited to a meeting, then another.',
          fx: [['bloc.street', 3], ['pressure.wageGrievance', -5]],
          flags: { 'doctors.paid': true },
          news: ['FG PAYS DOCTORS\' HAZARD ALLOWANCE', 'DOCTORS GET PAID. OTHERS: "WETIN WE DO?"'],
          archive: 'Honoured the resident doctors\' agreement.',
        }],
      },
      {
        id: 'all', label: 'Honour all three', naira: 0.4,
        outcomes: [{
          result: 'All three are paid. A fourth union writes the following week.',
          fx: [['bloc.street', 6], ['pressure.wageGrievance', -12], ['bloc.establishment', -3]],
          flags: { 'doctors.paid': true },
          news: ['FG SETTLES OUTSTANDING AGREEMENTS WITH THREE UNIONS', 'GOVERNMENT IS PAYING EVERYBODY. WHO IS NEXT?'],
          archive: 'Honoured three outstanding union agreements at once.',
        }],
      },
      {
        id: 'none', label: 'Decline: the university settlement was exceptional',
        outcomes: [{
          result: 'The unions note the position. The doctors begin counting days.',
          fx: [['pressure.wageGrievance', 10], ['bloc.street', -3]],
          news: ['FG RULES OUT FURTHER SETTLEMENTS', '"NO MONEY FOR DOCTORS" — GOVERNMENT'],
          archive: 'Refused parity claims from three other unions.',
        }],
      },
      {
        id: 'pensioners', label: 'Pay the pensioners first: theirs is a debt, not a demand',
        requires: { v: ['debt.pensions', '>', 0.2] },
        outcomes: [{
          result: 'The pension arrears are cleared before any new agreement is honoured. The other unions cannot easily object in public, and do not.',
          fx: [['pressure.wageGrievance', -4]],
          ops: [['paydebt', 'pensions', 1]],
          news: ['FG CLEARS PENSION ARREARS BEFORE NEW CLAIMS', 'PENSIONERS FIRST: GOVERNMENT PAY OLD DEBT'],
          archive: 'Paid the pension arrears ahead of new union claims.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'wage.review', kind: 'chain', slot: 'lead', category: 'labour', tone: 'dry', intensity: 4,
    office: 'Tripartite Committee on the National Minimum Wage', stamp: 'URGENT',
    title: 'Minimum wage: the three figures',
    body: [
      'The Tripartite Committee has concluded its sittings without agreement. It has submitted three figures.',
      'Labour: ₦250,000. Organised private sector: ₦62,000. The Governors\' Forum: "what each state can afford", which the Forum declines to express as a number.',
      'The current minimum wage buys less than one bag of rice.',
      { when: { v: ['tycoon.ty_maker', '>=', 35] }, text: 'Alhaji Kabir Birniwa, speaking for the manufacturers, says that anything above ₦70,000 will mean he must "regretfully reduce headcount". He employs sixty thousand people.' },
      { when: { v: ['tycoon.ty_maker', '<', 35] }, text: 'Alhaji Kabir Birniwa has already begun laying people off, and will blame whatever figure you choose.' },
    ],
    statement: 'Government will pay a wage that is fair, realistic and sustainable.',
    trace: [['pressure.wageGrievance', 1]],
    reads: [
      { role: 'fin', good: 'The Federal Government can pay ₦70,000. Perhaps twelve states can. The rest will sign and default.', weak: 'Any figure is workable, {SIR}.' },
      { role: 'sap', good: 'Labour will take seventy if you say it standing next to them. The governors will clap and then not pay.' },
    ],
    choices: [
      {
        id: 'seventy', label: 'Send a ₦70,000 bill to the National Assembly', naira: 0.35, pc: 6, sign: true,
        outcomes: [{
          result: 'The bill passes both chambers in a single day, which the Senate describes as a demonstration of what is possible.',
          fx: [['bloc.street', 8], ['approval', 2.5], ['pressure.wageGrievance', -25], ['bloc.establishment', -2]],
          ops: [['governors', -2]],
          flags: { 'wage.agreement': 'signed_unfunded', 'econ.inflBias': 4 },
          follow: [{ event: 'wage.states', after: [5, 8] }],
          news: ['PRESIDENT SIGNS ₦70,000 MINIMUM WAGE INTO LAW', '₦70K! E NO REACH BUT WE MOVE'],
          archive: 'Signed a ₦70,000 minimum wage into law.', sig: 3,
        }],
      },
      {
        id: 'high', label: 'Meet labour halfway at ₦120,000', naira: 0.7, pc: 4, sign: true,
        outcomes: [{
          result: 'Labour carries {MRP}\'s portrait through Abuja. The private sector begins laying off by the end of the quarter.',
          fx: [['bloc.street', 13], ['approval', 4], ['pressure.wageGrievance', -40], ['bloc.establishment', -9], ['debt.bonds', 1], ['tycoon.ty_maker', -10], ['nation.jobs', -2]],
          ops: [['governors', -5]],
          flags: { 'wage.agreement': 'signed_unfunded', 'econ.inflBias': 7 },
          follow: [{ event: 'wage.states', after: [4, 6] }],
          news: ['PRESIDENT APPROVES ₦120,000 MINIMUM WAGE', '₦120K!!! WORKERS\' PRESIDENT'],
          archive: 'Signed a ₦120,000 minimum wage into law.', sig: 3,
        }],
      },
      {
        id: 'extend', label: 'Extend the Committee\'s mandate by ninety days',
        requires: { v: ['count.wage.review', '<', 2] },
        outcomes: [{
          result: 'The Committee is asked to "harmonise the positions". It adjourns to a resort in Uyo to do so.',
          fx: [['pressure.wageGrievance', 12], ['bloc.street', -3], ['counter.committees', 1]],
          follow: [{ event: 'wage.review', after: 4 }],
          news: ['MINIMUM WAGE COMMITTEE GETS 90 MORE DAYS', 'WAGE COMMITTEE DON GO RESORT GO THINK'],
          archive: 'Extended the minimum wage committee instead of choosing a figure.',
        }],
      },
      {
        id: 'low', label: 'Adopt the private sector figure of ₦62,000', pc: 8,
        outcomes: [{
          result: 'Labour walks out of the announcement. The figure is described on the evening news as "an insult with decimals".',
          fx: [['bloc.street', -7], ['bloc.establishment', 5], ['pressure.wageGrievance', 12], ['tycoon.ty_maker', 8]],
          ops: [['governors', 3]],
          flags: { 'wage.agreement': 'low' },
          news: ['FG SETTLES ON ₦62,000 MINIMUM WAGE', '₦62K? "NA INSULT" — LABOUR'],
          archive: 'Set the minimum wage at the employers\' figure.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'wage.states', kind: 'chain', slot: 'lead', category: 'labour', tone: 'dry', intensity: 3,
    when: { flag: 'wage.agreement', is: 'signed_unfunded' },
    office: 'Nigeria Governors\' Forum', stamp: 'ROUTINE',
    title: 'Twenty-two states have not paid the new wage',
    body: [
      'Six months after the Minimum Wage Act, twenty-two states have not implemented it. Nine have constituted committees.',
      '{GOVCHAIR} writes that the states "wholeheartedly support the new wage and regret that they are unable to pay it".',
      'Labour holds the Federal Government responsible, on the grounds that it signed.',
      { when: { v: ['fund.buffer', '>=', 0.5] }, text: 'The governors have observed that the stabilisation account holds enough to pay it. They observe this at every meeting.' },
    ],
    trace: [['flag:wage.agreement', 1]],
    reads: [
      { role: 'sap', good: 'The governors want a bailout. They would also like you to take the blame while they wait for it.' },
      { role: 'fin', good: 'A bailout rewards the states that did not try. But the workers are not the ones who chose their governors\' priorities.', weak: 'The states have a point, {SIR}.' },
    ],
    choices: [
      {
        id: 'bailout', label: 'Extend a wage support facility to the states', naira: 0.5,
        outcomes: [{
          result: 'The facility is disbursed. Most of it reaches workers. One governor commissions a flyover.',
          fx: [['bloc.party', 8], ['bloc.street', 4], ['pressure.wageGrievance', -8]],
          ops: [['governors', 6]],
          flags: { 'wage.agreement': 'funded' },
          news: ['FG RELEASES WAGE SUPPORT TO STATES', 'BAILOUT AGAIN. GOVERNORS NO DEY TIRE'],
          archive: 'Bailed out the states to pay the new minimum wage.', sig: 2,
        }],
      },
      {
        id: 'name', label: 'Publish the list of defaulting states', pc: 8,
        outcomes: [{
          result: 'The list is published on the Ministry\'s website, which stays up long enough for it to be screenshotted.',
          fx: [['bloc.party', -9], ['bloc.street', 5], ['bloc.press', 4], ['approval', 1.5]],
          ops: [['governors', -8]],
          memory: [['sap', 3, 'You published the governors\' wage defaults.']],
          news: ['FG NAMES 22 STATES DEFAULTING ON MINIMUM WAGE', 'SEE THE LIST: GOVERNORS WEY NO GREE PAY'],
          archive: 'Publicly named the states that did not pay the minimum wage.', sig: 2,
        }],
      },
      {
        id: 'leave', label: 'Note that wages are a matter for each state',
        outcomes: [{
          result: 'The Presidency restates the federal principle. Workers in twenty-two states restate theirs.',
          fx: [['bloc.street', -5], ['pressure.wageGrievance', 14], ['bloc.party', 2]],
          news: ['PRESIDENCY: STATES RESPONSIBLE FOR OWN WAGE BILLS', 'YOU SIGN AM, YOU NO GO PAY AM?'],
          archive: 'Left the states to default on the minimum wage.',
        }],
      },
      {
        id: 'conditional', label: 'Pay it from the stabilisation account, to states that publish their payrolls',
        requires: { v: ['fund.buffer', '>=', 0.5] },
        outcomes: [{
          result: 'Fourteen states publish their payrolls within the month and are paid. Eight do not, and their workers now know exactly why. Three payrolls turn out to be a third shorter than the wage bill claimed.',
          fx: [['fund.buffer', -0.5], ['bloc.street', 5], ['nation.integrity', 2.5], ['pressure.wageGrievance', -8], ['bloc.party', -3]],
          ops: [['governors', -3]],
          flags: { 'wage.agreement': 'funded' },
          news: ['WAGE SUPPORT FOR STATES THAT PUBLISH PAYROLLS', 'SHOW YOUR PAYROLL, COLLECT MONEY — PRESIDENT TO GOVERNORS'],
          archive: 'Paid the states\' wage shortfall on condition they published their payrolls.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'doctors.strike', kind: 'recurring', slot: 'lead', category: 'labour', tone: 'grave', intensity: 3,
    when: { all: [{ turn: [10] }, { not: { flag: 'doctors.paid' } }, { v: ['pressure.wageGrievance', '>', 35] }] },
    weight: 8, weightBy: 'pressure.wageGrievance', max: 1,
    office: 'Federal Ministry of Health', stamp: 'URGENT',
    title: 'Resident doctors withdraw services',
    body: [
      'The {DOCTORS} has begun an indefinite strike in all federal hospitals over unpaid allowances and the number of doctors leaving the country.',
      'Emergency wards are being run by consultants and house officers. Teaching hospitals in four cities have stopped admitting.',
      'The amount in dispute is ₦38bn.',
      { when: { v: ['agenda.e1', '==', 1] }, text: 'The ward clinics are taking patients the teaching hospitals have turned away. They were not built for this.' },
    ],
    trace: [['pressure.wageGrievance', 1]],
    reads: [
      { role: 'labmin', good: 'This is the one strike where each day has a count, {SIR}. I would not test it.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Pay the arrears in full', naira: 0.04,
        outcomes: [{
          result: 'Payment is made within the week. The doctors return to wards that are short of the colleagues who left during the dispute.',
          fx: [['bloc.street', 3], ['approval', 1], ['pressure.wageGrievance', -8]],
          flags: { 'doctors.paid': true },
          news: ['DOCTORS CALL OFF STRIKE AS FG PAYS ARREARS', 'DOCTORS RESUME. THANK GOD'],
          archive: 'Paid the resident doctors\' arrears.',
        }],
      },
      {
        id: 'part', label: 'Pay half now, the rest "in due course"', naira: 0.02,
        outcomes: [{
          result: 'The strike is suspended for three weeks while the union considers the meaning of "due course".',
          fx: [['pressure.wageGrievance', 3]],
          news: ['DOCTORS SUSPEND STRIKE FOR 21 DAYS', 'DOCTORS GIVE GOVERNMENT THREE WEEKS'],
          archive: 'Paid half of the doctors\' arrears.',
        }],
      },
      {
        id: 'court', label: 'Seek an order compelling them to return',
        outcomes: [{
          result: 'The order is obtained. The doctors comply slowly. Applications for foreign licensing exams reach a record.',
          fx: [['bloc.street', -4], ['approval', -1.5], ['nation.capacity', -1], ['pressure.wageGrievance', 8]],
          news: ['COURT ORDERS STRIKING DOCTORS BACK TO WORK', 'DOCTORS TO GOVERNMENT: SEE YOU IN SASKATCHEWAN'],
          archive: 'Used a court order to end the doctors\' strike.',
        }],
      },
    ],
  },
];
