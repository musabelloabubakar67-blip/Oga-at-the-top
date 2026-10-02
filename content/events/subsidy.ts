import type { Choice, GameEvent } from '../../engine/types';

// STORYLINE: The Subsidy.
// The inherited subsidy costs about ₦4.2tn a year. Removing it is the single
// most expensive political act available and the main source of fiscal room.

const decide: Choice[] = [
  {
    id: 'remove', label: 'Remove the subsidy in full, effective midnight', pc: 15, sign: true,
    outcomes: [{
      result: 'The announcement is made in the fourth paragraph of a speech about something else. By morning the queues have gone and the price has not come back.',
      fx: [['nation.petrolPrice', 500], ['bonus.fiscal', 0.06], ['bloc.establishment', 8], ['bloc.street', -10], ['approval', -5, 1], ['pressure.wageGrievance', 15]],
      flags: { 'policy.subsidy': 'removed' },
      later: [{
        after: [2, 3], fx: [['approval', -2], ['bloc.street', -3]], label: 'Transport fares respond to the new pump price.',
        note: ['TRANSPORT FARES DOUBLE ON MAJOR ROUTES', '"TREK TO WORK": NIGERIANS REACT TO NEW FARES'],
      }],
      follow: [
        { event: 'subsidy.pump', after: 1 },
        { event: 'subsidy.ultimatum', after: [2, 3] },
        { event: 'subsidy.dividend', after: [12, 14], when: { flag: 'policy.subsidy', is: 'removed' } },
      ],
      news: ['PRESIDENT ANNOUNCES ENERGY MARKET REFORMS', 'SUBSIDY IS GONE! PETROL NOW ₦1,450'],
      archive: 'Removed the petrol subsidy in full.', sig: 3,
    }],
  },
  {
    id: 'phase', label: 'Phase it out over twelve months', pc: 8,
    outcomes: [{
      result: 'The first adjustment takes effect on the first of the month. The second is scheduled, which in Abuja is a promise to revisit.',
      fx: [['nation.petrolPrice', 170], ['bloc.establishment', 3], ['bloc.street', -4], ['approval', -2, 1], ['pressure.wageGrievance', 6]],
      flags: { 'policy.subsidy': 'phasing' },
      follow: [{ event: 'subsidy.phase2', after: [5, 6] }],
      news: ['FG BEGINS "GRADUAL" SUBSIDY EXIT', 'PETROL UP AGAIN, AND THEY SAY NA JUST THE BEGINNING'],
      archive: 'Began a phased removal of the petrol subsidy.', sig: 2,
    }],
  },
  {
    id: 'keep', label: 'Retain the subsidy and fund the gap by borrowing',
    outcomes: [{
      result: 'The pump price holds. The Debt Management Office is asked to "explore options", and does.',
      fx: [['bloc.street', 3], ['approval', 1.5], ['bloc.establishment', -6], ['nation.debt', 3]],
      follow: [{ event: 'subsidy.return', after: [14, 18], when: { not: { flag: 'policy.subsidy', is: 'removed' } } }],
      news: ['PRESIDENCY: SUBSIDY STAYS "FOR NOW"', 'PETROL PRICE NO GO CHANGE — PRESIDENCY'],
      archive: 'Retained the petrol subsidy and borrowed to fund it.', sig: 2,
    }],
  },
];

export const SUBSIDY: GameEvent[] = [
  {
    id: 'subsidy.memo', kind: 'standalone', slot: 'lead', category: 'economy', tone: 'dry', intensity: 4,
    when: { all: [{ turn: [2] }, { flag: 'policy.subsidy', is: 'partial' }, { never: 'subsidy.report' }] },
    weight: 80,
    office: 'Federal Ministry of Finance', stamp: 'CONFIDENTIAL',
    title: 'Memorandum on the cost of petrol under-recovery',
    body: [
      'The pump price of petrol is being held at ₦950 per litre. The landing cost is ₦1,430.',
      'The difference is being paid from the Federation Account at a rate of ₦4.2tn a year. This is more than the capital budgets for health, education and power combined.',
      'The previous administration described the arrangement as temporary in each of its last six budgets.',
      'The Ministry recommends a decision before the next allocation meeting. The Ministry notes that it has made this recommendation before.',
    ],
    statement: 'The Federal Government remains sensitive to the plight of Nigerians and will not take any decision that inflicts hardship on the masses.',
    trace: [['pressure.fuelSupplyStress', 1], ['nation.debt', 1]],
    reads: [
      { role: 'fin', good: 'Every month we wait costs ₦350bn we do not have. Remove it now, {SIR}, while they still believe you are new.', weak: 'It is manageable, {SIR}. We can always borrow.' },
      { role: 'sap', good: 'Labour will not accept removal. They will say so within the hour and strike within the quarter. But your capital will never be higher than it is today.' },
    ],
    choices: [
      ...decide,
      {
        id: 'committee', label: 'Constitute a Presidential Committee on Petroleum Pricing',
        outcomes: [{
          result: 'A committee of seventeen is inaugurated. It is given six weeks. It asks for twelve.',
          fx: [['nation.integrity', -0.5], ['bloc.press', -2], ['counter.committees', 1], ['nation.debt', 1]],
          follow: [{ event: 'subsidy.report', after: 4 }],
          news: ['PRESIDENT INAUGURATES COMMITTEE ON PETROLEUM PRICING', 'ANOTHER COMMITTEE. WE DON TIRE'],
          archive: 'Referred the subsidy question to a presidential committee.',
        }],
      },
    ],
  },
  {
    id: 'subsidy.report', kind: 'chain', slot: 'lead', category: 'economy', tone: 'farce', intensity: 3,
    when: { flag: 'policy.subsidy', is: 'partial' },
    office: 'Presidential Committee on Petroleum Pricing', stamp: 'ROUTINE',
    title: 'The Committee submits its report',
    body: [
      'The Committee has submitted its report after four months, eleven sittings and a study tour.',
      'The report runs to 340 pages. Its recommendations are those of the Finance Ministry memorandum, in a different font.',
      'The Committee requests that its members be considered for the implementation committee.',
    ],
    trace: [['flag:policy.subsidy', 1], ['nation.debt', 1]],
    reads: [
      { role: 'fin', good: 'We have lost four months and ₦1.4tn to learn what we knew, {SIR}.', weak: 'A very thorough report, {SIR}.' },
    ],
    choices: decide,
  },
  {
    id: 'subsidy.pump', kind: 'chain', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3,
    office: 'Office of the Chief of Staff', stamp: 'URGENT',
    title: 'Pump price: first month',
    body: [
      'Petrol is selling at ₦1,450 in Lagos and above ₦1,600 in the North East. Inter-city fares have roughly doubled.',
      'Governors are asking what the Federal Government intends to do "to cushion the effect". Several have already announced that they are consulting.',
      'The Ministry of Humanitarian Services has a register of vulnerable households. Its accuracy has not been tested.',
    ],
    statement: '{MRP} feels the pain of Nigerians and has directed that palliative measures be rolled out without delay.',
    trace: [['flag:policy.subsidy', 1]],
    reads: [
      { role: 'sap', good: 'They need to see something this month, {SIR}. It does not need to be large. It needs to arrive.' },
      { role: 'fin', on: 'transfers', good: 'We can afford transfers. I cannot promise the register is real. The last audit found 14,000 beneficiaries named "Test Test".', weak: 'The register is robust, {SIR}.' },
    ],
    choices: [
      {
        id: 'transfers', label: 'Approve cash transfers to 12 million households', naira: 0.4,
        outcomes: [
          {
            when: { v: ['nation.capacity', '<', 40] },
            result: 'The first tranche is paid. A third of it reaches households. The rest reaches people who are, on paper, households.',
            fx: [['bloc.street', 3], ['approval', 1], ['nation.integrity', -1], ['pressure.scandalHeat', 6]],
            news: ['FG BEGINS PAYMENT OF PALLIATIVE IN TRANCHES', 'PALLIATIVE: "WE NEVER SEE SHISHI" — BENEFICIARIES'],
            archive: 'Paid cash transfers through an unverified register.',
          },
          {
            result: 'The first tranche is paid and, to general surprise, arrives.',
            fx: [['bloc.street', 6], ['approval', 2.5]],
            news: ['12 MILLION HOUSEHOLDS RECEIVE FIRST TRANCHE', 'ALERT DON ENTER! PALLIATIVE LANDS'],
            archive: 'Paid cash transfers to 12 million households.',
          },
        ],
      },
      {
        id: 'buses', label: 'Announce 11,500 gas-powered buses', naira: 0.2,
        outcomes: [{
          result: 'The announcement is well received. Procurement begins.',
          fx: [['approval', 1]],
          later: [{
            after: [7, 10], fx: [['approval', -1], ['bloc.press', -2]], label: 'The first buses arrive.',
            note: ['FIRST GAS-POWERED BUSES ARRIVE', 'FG PROMISED 11,500 BUSES. 12 DON LAND'],
          }],
          news: ['FG TO DEPLOY 11,500 CNG BUSES NATIONWIDE', 'BUSES ARE COMING, THEY SAY'],
          archive: 'Announced 11,500 gas-powered buses.',
        }],
      },
      {
        id: 'award', label: 'Approve a ₦35,000 wage award for six months', naira: 0.5,
        outcomes: [{
          result: 'Federal workers receive the award. State workers ask their governors, who are consulting.',
          fx: [['bloc.street', 7], ['pressure.wageGrievance', -15], ['approval', 1.5]],
          later: [{ after: 6, fx: [['pressure.wageGrievance', 12], ['bloc.street', -3]], label: 'The six-month wage award expires.', note: ['WAGE AWARD LAPSES; LABOUR SEEKS EXTENSION', 'THE ₦35K DON STOP. WETIN NEXT?'] }],
          news: ['PRESIDENT APPROVES PROVISIONAL WAGE AWARD', '₦35K FOR SIX MONTHS. AFTER THAT NKO?'],
          archive: 'Approved a six-month wage award for federal workers.',
        }],
      },
      {
        id: 'patience', label: 'Appeal to Nigerians for patience',
        outcomes: [{
          result: 'The appeal is issued. It is the fourth appeal for patience this year, counting the previous administration\'s three.',
          fx: [['bloc.street', -4], ['approval', -2], ['pressure.wageGrievance', 8]],
          news: ['PRESIDENT URGES PATIENCE, SAYS GAINS WILL COME', '"BE PATIENT" — MAN WHO NO DEY BUY FUEL'],
          archive: 'Appealed for patience after the pump price rise.',
        }],
      },
    ],
  },
  {
    id: 'subsidy.ultimatum', kind: 'chain', slot: 'lead', category: 'labour', tone: 'dry', intensity: 4,
    when: { any: [{ flag: 'policy.subsidy', is: 'removed' }, { flag: 'policy.subsidy', is: 'phasing' }] },
    office: 'Federal Ministry of Labour and Employment', stamp: 'URGENT',
    title: 'Fourteen-day ultimatum from the {UNION}',
    body: [
      'The {UNION} has issued a fourteen-day ultimatum demanding a reversal of the pump price and a new national minimum wage.',
      '{LABOUR} told a press conference that "the government has declared war on the Nigerian worker."',
      'The Honourable Minister of Labour reports that preliminary discussions were cordial.',
    ],
    statement: 'Government and Labour are engaging in the spirit of social dialogue. There is no cause for alarm.',
    trace: [['pressure.wageGrievance', 1], ['flag:policy.subsidy', 1]],
    reads: [
      { role: 'sap', good: 'Aluta cannot back down in public. Give him something he can call a victory and he will call it one.' },
      { role: 'labmin', good: 'They will settle for a wage commitment, {SIR}. They will then expect it to be honoured, which is where these things usually go wrong.' },
    ],
    choices: [
      {
        id: 'negotiate', label: 'Negotiate: bring forward the minimum wage review', pc: 5, naira: 0.3,
        outcomes: [{
          result: 'After nine hours, government and labour announce that they have "reached an understanding". The strike is suspended, which is not the same as called off.',
          fx: [['bloc.street', 5], ['pressure.wageGrievance', -12]],
          flags: { 'wage.review': 'promised' },
          follow: [{ event: 'wage.review', after: [5, 8] }],
          news: ['FG, LABOUR REACH UNDERSTANDING; STRIKE SUSPENDED', 'STRIKE SUSPENDED. "UNDERSTANDING" NO BE AGREEMENT O'],
          archive: 'Promised labour an early minimum wage review to avert a strike.',
        }],
      },
      {
        id: 'reverse', label: 'Partially restore the subsidy',
        outcomes: [{
          result: 'The pump price is reduced "following wide consultations". Labour declares victory. The bond market draws its own conclusion.',
          fx: [['nation.petrolPrice', -300], ['bonus.fiscal', -0.06], ['bloc.street', 8], ['approval', 3], ['bloc.establishment', -10], ['pressure.wageGrievance', -10], ['pc', -6]],
          flags: { 'policy.subsidy': 'partial' },
          follow: [{ event: 'subsidy.return', after: [12, 16], when: { not: { flag: 'policy.subsidy', is: 'removed' } } }],
          news: ['FG REVIEWS PUMP PRICE DOWNWARD AFTER CONSULTATIONS', 'LABOUR WINS! PETROL PRICE COMES DOWN'],
          archive: 'Reversed course and partially restored the petrol subsidy.', sig: 3,
        }],
      },
      {
        id: 'court', label: 'Direct the Attorney General to obtain an injunction',
        outcomes: [
          {
            chance: 0.5,
            result: 'The Industrial Court restrains the strike. Labour complies, and files the order away with the others.',
            fx: [['bloc.street', -5], ['bloc.press', -3], ['pressure.wageGrievance', 6]],
            news: ['COURT RESTRAINS LABOUR FROM PROCEEDING ON STRIKE', 'GOVERNMENT RUNS TO COURT. LABOUR NO HAPPY'],
            archive: 'Obtained a court order restraining the strike.',
          },
          {
            result: 'The order is granted at 4pm on Friday. Labour says it has not been served. The strike begins on Monday.',
            fx: [['bloc.street', -5], ['bloc.press', -3]],
            follow: [{ event: 'subsidy.strike', after: 1 }],
            news: ['LABOUR SAYS IT WAS NOT SERVED COURT ORDER', '"WHICH ORDER?" — LABOUR, AS STRIKE BEGINS'],
            archive: 'Sought a court order against the strike. Labour ignored it.',
          },
        ],
      },
      {
        id: 'face', label: 'Decline the demands and prepare for a strike', pc: 10,
        outcomes: [{
          result: 'The ultimatum expires. Airports, ports and banks are picketed from 6am.',
          fx: [['bloc.establishment', 3]],
          follow: [{ event: 'subsidy.strike', after: 1 }],
          news: ['ULTIMATUM EXPIRES; NATIONWIDE STRIKE BEGINS', 'TOTAL SHUTDOWN: NIGERIA ON LOCKDOWN'],
          archive: 'Refused labour\'s demands and let the ultimatum expire.',
        }],
      },
    ],
  },
  {
    id: 'subsidy.strike', kind: 'chain', slot: 'lead', category: 'labour', tone: 'dry', intensity: 5,
    office: 'Office of the Chief of Staff', stamp: 'URGENT',
    title: 'General strike: day four',
    body: [
      'The national grid has been shut down by the electricity workers. Airports are closed. The ports are not clearing cargo.',
      'The Manufacturers\' Association estimates losses at ₦150bn a day.',
      'The Honourable Minister of Information has described the strike as "largely ineffective". He did so by telephone, as his office is locked.',
    ],
    trace: [['pressure.wageGrievance', 1], ['bloc.street', -1]],
    reads: [
      { role: 'sap', good: 'They cannot hold beyond ten days, {SIR}. Their members are daily-paid. The question is whether we can hold for nine.' },
      { role: 'nsa', good: 'No violence so far. I would keep the police well back. One incident changes everything.' },
    ],
    choices: [
      {
        id: 'concede', label: 'Concede a wage award and a new minimum wage timetable', naira: 0.6,
        outcomes: [{
          result: 'The strike is called off at midnight. Labour\'s communiqué thanks {MRP} for "listening at last".',
          fx: [['bloc.street', 10], ['pressure.wageGrievance', -25], ['bloc.establishment', -3], ['approval', 2]],
          flags: { 'wage.review': 'promised' },
          follow: [{ event: 'wage.review', after: [4, 6] }],
          news: ['STRIKE CALLED OFF AS FG, LABOUR SIGN AGREEMENT', 'LABOUR 1, GOVERNMENT 0'],
          archive: 'Ended the general strike by conceding a wage award.', sig: 2,
        }],
      },
      {
        id: 'hold', label: 'Hold the line', pc: 15,
        outcomes: [
          {
            when: { v: ['approval', '>=', 42] },
            result: 'On day nine the strike collapses. The policy stands. So does the grievance.',
            fx: [['bloc.street', -8], ['bloc.establishment', 6], ['pc', 8], ['pressure.wageGrievance', 10]],
            news: ['LABOUR SUSPENDS STRIKE WITHOUT AGREEMENT', 'STRIKE DON END. HUNGER NEVER END'],
            archive: 'Outlasted the general strike without concessions.', sig: 3,
          },
          {
            result: 'On day eleven the strike is still on and the markets have joined. You concede on worse terms than were offered on day four.',
            fx: [['bloc.street', -12], ['approval', -5], ['bloc.establishment', -5], ['nation.fiscalSpace', -0.6], ['pressure.wageGrievance', -10], ['bloc.villa', -4]],
            news: ['FG YIELDS AFTER ELEVEN-DAY SHUTDOWN', 'ELEVEN DAYS! GOVERNMENT FINALLY BOWS'],
            archive: 'Tried to outlast the general strike and failed.', sig: 2,
          },
        ],
      },
      {
        id: 'drift', label: 'Issue a statement that talks are ongoing',
        outcomes: [{
          result: 'The statement is issued daily for nine days. On the tenth, with the banks shut and fuel gone, the Ministry of Labour signs what it is given.',
          fx: [['bloc.street', -6], ['approval', -4], ['bloc.establishment', -6], ['bloc.villa', -3], ['nation.debt', 2], ['pressure.wageGrievance', -8]],
          flags: { 'wage.review': 'promised' },
          follow: [{ event: 'wage.review', after: [3, 5] }],
          news: ['STRIKE ENDS AFTER TEN DAYS AS FG ACCEPTS LABOUR TERMS', 'TEN DAYS OF "TALKS ARE ONGOING". THEN DEM SIGN'],
          archive: 'Let the general strike run for ten days and then accepted labour\'s terms.', sig: 2,
        }],
      },
      {
        id: 'settle', label: 'Arrange logistics for the union leadership', purse: 8,
        outcomes: [{
          result: 'The strike is suspended "in the overriding national interest". The rank and file learn of it from the radio.',
          fx: [['bloc.street', 3], ['nation.integrity', -1.5]],
          later: [{
            after: [8, 12], fx: [['pressure.wageGrievance', 22], ['bloc.street', -5]], label: 'The union elects a new leadership on a platform of no more settlements.',
            note: ['LABOUR ELECTS NEW LEADERSHIP IN STORMY CONGRESS', 'LABOUR SACKS LEADERS: "THEY SOLD US"'],
          }],
          exposure: { kind: 'political', amount: 8, witnesses: ['labour'], trail: 1 },
          news: ['LABOUR SUSPENDS STRIKE IN "NATIONAL INTEREST"', 'STRIKE SUSPENDED OVERNIGHT. WHO COLLECT WETIN?'],
          archive: 'Settled the union leadership to end the general strike.',
        }],
      },
    ],
  },
  {
    id: 'subsidy.phase2', kind: 'chain', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3,
    when: { flag: 'policy.subsidy', is: 'phasing' },
    office: 'Federal Ministry of Finance', stamp: 'CONFIDENTIAL',
    title: 'Subsidy exit: the second adjustment is due',
    body: [
      'The second and final adjustment under the phased exit falls due this month.',
      'The first adjustment saved ₦1.1tn on an annual basis. The remaining subsidy still costs ₦2.9tn.',
      { when: { termTurn: [25] }, text: 'Several governors have asked whether this is "the right time", by which they mean the election calendar.' },
    ],
    trace: [['flag:policy.subsidy', 1]],
    reads: [
      { role: 'fin', good: 'If we pause now we will have taken the pain for a third of the gain, {SIR}.', weak: 'We can revisit after the harvest, {SIR}.' },
      { role: 'sap', good: 'Nobody will thank you for finishing. Several people will thank you for pausing, and none of them will mean it.' },
    ],
    choices: [
      {
        id: 'complete', label: 'Complete the exit', pc: 10, sign: true,
        outcomes: [{
          result: 'The final adjustment takes effect. For the first time in a generation the pump price is simply the price.',
          fx: [['nation.petrolPrice', 330], ['bonus.fiscal', 0.06], ['bloc.street', -7], ['approval', -3, 1], ['bloc.establishment', 7], ['pressure.wageGrievance', 10]],
          flags: { 'policy.subsidy': 'removed' },
          follow: [
            { event: 'subsidy.ultimatum', after: [1, 2], chance: 0.6 },
            { event: 'subsidy.dividend', after: [12, 14], when: { flag: 'policy.subsidy', is: 'removed' } },
          ],
          news: ['SUBSIDY ERA ENDS AS FINAL ADJUSTMENT TAKES EFFECT', 'PETROL DON GO UP AGAIN. THEY SAY NA THE LAST'],
          archive: 'Completed the phased removal of the petrol subsidy.', sig: 3,
        }],
      },
      {
        id: 'pause', label: 'Pause the exit pending further consultation',
        outcomes: [{
          result: 'The second adjustment is deferred. No new date is given, which everyone understands.',
          fx: [['bloc.establishment', -6], ['bloc.press', -2], ['bloc.street', 2]],
          flags: { 'policy.subsidy': 'partial' },
          follow: [{ event: 'subsidy.return', after: [12, 16], when: { not: { flag: 'policy.subsidy', is: 'removed' } } }],
          news: ['FG DEFERS SECOND PHASE OF SUBSIDY EXIT', 'GOVERNMENT PRESSES PAUSE. FOR HOW LONG?'],
          archive: 'Paused the subsidy exit halfway.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'subsidy.dividend', kind: 'chain', slot: 'lead', category: 'fortune', tone: 'dry', intensity: 2,
    when: { flag: 'policy.subsidy', is: 'removed' },
    office: 'Federal Ministry of Finance', stamp: 'ROUTINE',
    title: 'Federation Account: a surplus over projection',
    body: [
      'Twelve months after subsidy removal, distributable revenue is ₦1.1tn above projection.',
      'The Governors\' Forum has learned of this. {GOVCHAIR} has written to request "an equitable and immediate sharing formula".',
      'This is the first time since the return to democracy that the Ministry is asking what to do with money instead of where to find it.',
    ],
    trace: [['flag:policy.subsidy', 1]],
    reads: [
      { role: 'fin', good: 'Put it into transmission or pay down the expensive debt. If it is shared, {SIR}, it will be gone by Christmas and we will have nothing to show.', weak: 'The governors have been very supportive, {SIR}.' },
      { role: 'sap', good: 'The governors want it shared. They will remember who said no. They will also remember who said yes, briefly.' },
    ],
    choices: [
      {
        id: 'power', label: 'Commit it to the transmission network',
        outcomes: [{
          result: 'Contracts for 14 substations and 2,100 km of line are signed. Completion is projected in three years, which the Minister describes as "soon".',
          fx: [['nation.fiscalSpace', 0.2], ['bloc.party', -5]],
          later: [{ after: [10, 14], fx: [['nation.power', 9], ['approval', 2]], label: 'New transmission capacity comes on line.', note: ['GRID ADDS 1,800MW AS NEW LINES ARE ENERGISED', 'LIGHT DON BETTER SMALL. NO BE LIE'] }],
          news: ['SUBSIDY SAVINGS TO FUND GRID EXPANSION', 'THEY SAY THE MONEY GO BRING LIGHT. WE DEY WATCH'],
          archive: 'Committed the subsidy savings to the transmission network.', sig: 3,
        }],
      },
      {
        id: 'debt', label: 'Retire the most expensive debt',
        outcomes: [{
          result: 'The Debt Management Office buys back ₦1tn of short-dated paper. Nobody outside Marina notices.',
          fx: [['nation.debt', -7], ['bloc.establishment', 6], ['nation.fiscalSpace', 0.2]],
          news: ['FG RETIRES ₦1TN OF DOMESTIC DEBT', 'GOVERNMENT PAYS DEBT. NA WE GO CHOP DEBT?'],
          archive: 'Used the subsidy savings to retire debt.', sig: 2,
        }],
      },
      {
        id: 'share', label: 'Share it with the states',
        outcomes: [{
          result: 'The allocation committee meets for forty minutes. Several governors announce new airports.',
          fx: [['bloc.party', 10], ['pc', 5], ['nation.integrity', -1], ['bloc.establishment', -3]],
          news: ['STATES RECEIVE RECORD ALLOCATION', 'GOVERNORS DON COLLECT. WATCH THE CONVOYS'],
          archive: 'Shared the subsidy savings with the state governments.', sig: 2,
        }],
      },
      {
        id: 'relief', label: 'Fund a permanent social register and monthly transfers',
        outcomes: [{
          result: 'The register is rebuilt against bank verification numbers. It shrinks by a third and starts working.',
          fx: [['bloc.street', 6], ['approval', 2], ['nation.capacity', 2], ['nation.fiscalSpace', 0.1], ['pressure.wageGrievance', -8]],
          news: ['FG LAUNCHES VERIFIED SOCIAL REGISTER', 'MONTHLY ALERT FOR POOR HOUSEHOLDS BEGINS'],
          archive: 'Used the subsidy savings to build a working social register.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'subsidy.return', kind: 'chain', slot: 'lead', category: 'economy', tone: 'dry', intensity: 4,
    when: { not: { flag: 'policy.subsidy', is: 'removed' } }, max: 2,
    office: 'Federal Ministry of Finance', stamp: 'CONFIDENTIAL',
    title: '"Under-recovery": the bill',
    body: [
      'The national oil company has stopped remitting to the Federation Account. It states that it is recovering the cost of "under-recovery", a term it prefers to subsidy.',
      'The amount withheld this year is ₦5.6tn. Three states cannot pay salaries.',
      'The landing cost has risen since the matter was last considered. Removal would now mean a larger increase than the one previously judged too painful.',
    ],
    statement: 'There is no subsidy. What exists is a price-stabilisation mechanism.',
    trace: [['flag:policy.subsidy', 1], ['nation.debt', 1]],
    reads: [
      { role: 'fin', good: 'This is the decision we declined to make, {SIR}, with interest.', weak: 'The oil company assures us the situation is temporary.' },
    ],
    choices: [
      {
        id: 'remove', label: 'Remove it now', pc: 20, sign: true,
        outcomes: [{
          result: 'The price moves by more than it would have a year ago. So does everything else.',
          fx: [['nation.petrolPrice', 620], ['bonus.fiscal', 0.06], ['bloc.street', -13], ['approval', -6, 1], ['bloc.establishment', 8], ['pressure.wageGrievance', 18]],
          flags: { 'policy.subsidy': 'removed' },
          follow: [
            { event: 'subsidy.ultimatum', after: [1, 2] },
            { event: 'subsidy.dividend', after: [12, 14], when: { flag: 'policy.subsidy', is: 'removed' } },
          ],
          news: ['FG ENDS "PRICE STABILISATION"; PUMP PRICE JUMPS', 'SO SUBSIDY DEY ALL THIS WHILE? PETROL HITS ₦1,570'],
          archive: 'Removed the petrol subsidy late, at a higher price.', sig: 3,
        }],
      },
      {
        id: 'borrow', label: 'Borrow to cover the states\' shortfall',
        outcomes: [{
          result: 'A "budget support facility" is extended to the states. It is a loan to pay for a subsidy that officially does not exist.',
          fx: [['nation.debt', 6], ['bloc.establishment', -6], ['bloc.party', 3]],
          follow: [{ event: 'subsidy.return', after: [14, 18], when: { not: { flag: 'policy.subsidy', is: 'removed' } } }],
          news: ['FG EXTENDS BUDGET SUPPORT TO STATES', 'MORE BORROWING. OUR PIKIN GO PAY'],
          archive: 'Borrowed again to keep the subsidy.', sig: 2,
        }],
      },
      {
        id: 'capital', label: 'Cut capital spending to absorb it',
        outcomes: [{
          result: 'Capital releases are suspended for two quarters. Contractors leave site. The price of petrol does not change.',
          fx: [['nation.power', -4], ['nation.security', -2], ['bloc.establishment', -3]],
          follow: [{ event: 'subsidy.return', after: [14, 18], when: { not: { flag: 'policy.subsidy', is: 'removed' } } }],
          news: ['CAPITAL RELEASES SUSPENDED AS REVENUE FALLS SHORT', 'CONTRACTORS PACK LOAD AS GOVERNMENT NO PAY'],
          archive: 'Cut capital spending to keep petrol cheap.', sig: 2,
        }],
      },
    ],
  },
];
