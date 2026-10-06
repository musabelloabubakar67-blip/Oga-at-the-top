import { CONTRACT_VERSION, type DomainOutcome } from '../../engine/contracts';
import type { GameEvent } from '../../engine/types';

// REACTIVE FILES
// Each of these exists only because of something the President did: an order,
// a delivered reform, a big bet, a standing policy. The Director weights them
// well above generic events, so the desk reflects the presidency being run.

const phone = { slot: 'minor', channel: 'phone', office: 'Phone', intensity: 1 } as const;
// The road commitment opened in minor.governor_call, addressed by its original id.
const roadDone = (text: string): DomainOutcome => ({ version: CONTRACT_VERSION, effects: [{ type: 'commitment.note', id: 'road.ss.finish.$ADMIN', text }] });
/** The road is finished: the commitment's agreed test (contract R4). */
const ROAD_DONE = { 'road.ss.done': true };

export const REACTIVE: GameEvent[] = [
  {
    id: 'react.vat', kind: 'standalone', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3, reactive: true,
    when: { v: ['mine.tax', '==', 1] }, weight: 12,
    office: 'Federal Ministry of Industry, Trade and Investment', stamp: 'URGENT',
    title: 'The markets have closed over VAT',
    body: [
      'Traders in Onitsha, Kano, Aba and Lagos have shut their markets for a third day over the VAT increase you ordered.',
      'Their complaint is specific: the tax now falls on garri, bread and paracetamol at the same rate as champagne.',
      'Revenue from the increase is running ₦50bn a month ahead of projection.',
      'Most of every VAT naira goes to the states. The governors, who are collecting the gain, have been very quiet about the anger.',
      { when: { v: ['tycoon.ty_trade', '>=', 30] }, text: 'Chief Obinna Ezeudu\'s importers have closed their warehouses in sympathy. It is the first time anyone has seen them agree with a market woman.' },
    ],
    trace: [['bonus.fiscal', 1]],
    reads: [
      { role: 'fin', good: 'Exempt food and medicine and we keep two thirds of the gain, {SIR}. Reverse it and we have taken the anger for nothing.', weak: 'The traders will tire, {SIR}.' },
    ],
    choices: [
      {
        id: 'exempt', label: 'Exempt food, medicine and school fees',
        outcomes: [{
          result: 'The exemptions are gazetted. The markets reopen. The tax now falls mainly on people who can afford an accountant.',
          fx: [['bonus.fiscal', -0.015], ['bloc.street', 6], ['approval', 2], ['bonus.inflation', -0.5], ['tycoon.ty_trade', 3]],
          flags: { 'vat.exempt': true },
          news: ['FG EXEMPTS FOOD, MEDICINE FROM VAT', 'NO VAT FOR GARRI AGAIN. MARKET DON OPEN'],
          archive: 'Exempted food, medicine and school fees from the VAT increase.', sig: 2,
        }],
      },
      {
        id: 'hold', label: 'Hold the line',
        outcomes: [{
          result: 'The markets reopen on the sixth day because traders have to eat. They have not forgotten.',
          fx: [['bloc.street', -6], ['approval', -3], ['pressure.wageGrievance', 8], ['bloc.establishment', 3], ['tycoon.ty_trade', -5]],
          ops: [['governors', 2]],
          news: ['MARKETS REOPEN AS FG STANDS FIRM ON VAT', 'MARKET OPEN, BUT TRADERS DEY VEX'],
          archive: 'Refused to amend the VAT increase despite market closures.',
        }],
      },
      {
        id: 'reverse', label: 'Reverse the increase',
        outcomes: [{
          result: 'VAT returns to 7.5%. The traders celebrate. The Finance Ministry rewrites the budget.',
          fx: [['bonus.fiscal', -0.05], ['approval', 3], ['bloc.street', 5], ['bloc.establishment', -6], ['pc', -5], ['tycoon.ty_trade', 5]],
          ops: [['governors', -3]],
          flags: { 'vat.reversed': true },
          news: ['FG REVERSES VAT INCREASE', 'VAT DON GO BACK. PRESIDENT DON HEAR WORD'],
          archive: 'Reversed your own VAT increase.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'react.freeze', kind: 'standalone', slot: 'lead', category: 'economy', tone: 'dry', intensity: 4, reactive: true,
    when: { all: [{ v: ['mine.price_freeze', '==', 1] }, { flag: 'policy.subsidy', is: 'full' }] }, weight: 12,
    office: 'Office of the Chief of Staff', stamp: 'URGENT',
    title: 'The marketers have stopped importing',
    body: [
      'Since you froze the pump price, private marketers have stopped importing petrol. They cannot sell at your price and nobody has paid them the difference.',
      'The national oil company is now the sole importer. It has eleven days of stock and is funding the gap by withholding ₦600bn a month from the Federation Account.',
      'Petrol is cheap wherever it can be found.',
      { when: { v: ['tycoon.ty_fuel', '>=', 30] }, text: 'Chief Tonye Amangala, who supplies a third of the country\'s petrol, says he will load the day he is paid and not before.' },
    ],
    statement: 'There is no scarcity. What exists is a temporary distribution challenge.',
    trace: [['flag:policy.subsidy', 1], ['pressure.fuelSupplyStress', 1]],
    reads: [
      { role: 'fin', good: 'You fixed the price, {SIR}. You did not fix the cost. Someone is paying the difference and it is us, monthly.', weak: 'The oil company has it in hand, {SIR}.' },
    ],
    choices: [
      {
        id: 'pay', label: 'Pay the marketers the difference', naira: 0.7,
        outcomes: [{
          result: 'The claims are paid. Tankers load. You have bought three months.',
          fx: [['pressure.fuelSupplyStress', -30], ['approval', 1], ['tycoon.ty_fuel', 8]],
          news: ['FG PAYS ₦1.2TN TO KEEP PETROL AT FROZEN PRICE', 'GOVERNMENT DEY PAY ₦1.2TN MAKE FUEL NO COST'],
          archive: 'Paid marketers to sustain the frozen pump price.',
        }],
      },
      {
        id: 'unfreeze', label: 'Lift the freeze',
        outcomes: [{
          result: 'The price is released. It jumps past where it started. People who cheered the freeze are less forgiving than people who never had it.',
          fx: [['nation.petrolPrice', 380], ['approval', -6], ['bloc.street', -9], ['bloc.establishment', 6], ['bonus.fiscal', 0.05], ['pressure.fuelSupplyStress', -25]],
          flags: { 'policy.subsidy': 'partial' },
          news: ['FG LIFTS PUMP PRICE FREEZE', 'THE CHEAP FUEL DON END. E PAIN PASS BEFORE'],
          archive: 'Lifted your own pump price freeze.', sig: 3,
        }],
      },
      {
        id: 'ration', label: 'Keep the price; let the queues do the rationing',
        outcomes: [{
          result: 'The price holds. The queue outside the Villa gate is two kilometres long. The black market price is three times yours.',
          fx: [['approval', -4], ['bloc.street', -6], ['pressure.fuelSupplyStress', 15], ['nation.jobs', -2], ['tycoon.ty_fuel', -6]],
          ops: [['governors', -2]],
          news: ['FUEL QUEUES STRETCH FOR KILOMETRES NATIONWIDE', 'FUEL CHEAP BUT E NO DEY. WETIN WE GAIN?'],
          archive: 'Kept the pump price frozen through a nationwide scarcity.',
        }],
      },
    ],
  },
  {
    id: 'react.print', kind: 'standalone', slot: 'lead', category: 'economy', tone: 'dry', intensity: 4, reactive: true,
    when: { v: ['mine.print', '==', 1] }, weight: 12,
    office: 'Central Bank', stamp: 'CONFIDENTIAL',
    title: 'The price of the money you printed',
    body: [
      '{CBN} reports that the naira has lost 22% since the central bank began financing the budget on your instruction.',
      'A loaf of bread has gone from ₦1,400 to ₦1,950. The Governor notes that she said this would happen, and has kept the memorandum.',
      { when: { v: ['debt.ways', '>', 5] }, text: 'The overdraft at the central bank now stands above ₦5tn, at an interest rate the Treasury sets for itself.' },
    ],
    trace: [['bonus.inflation', 1]],
    reads: [
      { role: 'fin', good: 'We can stop, {SIR}, and say so in public, and it will begin to unwind. Or we can do it again, and it will get easier each time and worse each time.', weak: 'Speculators are responsible, {SIR}.' },
    ],
    choices: [
      {
        id: 'stop', label: 'End central bank financing and say so publicly', pc: 6,
        outcomes: [{
          result: 'You announce that it will not happen again and sign an order that makes it hard to. The naira steadies within the month.',
          fx: [['bonus.inflation', -1.5], ['bloc.establishment', 7], ['nation.integrity', 1.5]],
          flags: { 'print.renounced': true },
          news: ['PRESIDENT ENDS CENTRAL BANK FINANCING OF BUDGET', 'PRESIDENT SAY E NO GO PRINT MONEY AGAIN'],
          archive: 'Publicly ended central bank financing of the budget.', sig: 2,
        }],
      },
      {
        id: 'rates', label: 'Direct the Governor to raise interest rates sharply',
        outcomes: [{
          result: 'Rates go to 32%. Inflation slows. So does every business that borrows.',
          fx: [['bonus.inflation', -2.5], ['nation.jobs', -4], ['bloc.establishment', -3]],
          news: ['CENTRAL BANK RAISES RATES TO 32%', 'BANK LOAN DON COST PASS. BUSINESS DEY CLOSE'],
          archive: 'Had interest rates raised sharply to contain inflation you caused.',
        }],
      },
      {
        id: 'blame', label: 'Blame speculators and order arrests of currency traders',
        outcomes: [{
          result: 'Forty bureau de change operators are arrested on television. The naira falls a further 8% the following week.',
          fx: [['bonus.inflation', 1], ['bloc.press', -4], ['bloc.establishment', -5], ['approval', 1]],
          news: ['SECURITY AGENTS ARREST CURRENCY "SPECULATORS"', 'DEM ARREST MONEY CHANGERS. DOLLAR STILL CLIMB'],
          archive: 'Blamed currency traders for inflation caused by printing money.',
        }],
      },
      {
        id: 'bonds', label: 'Turn the whole overdraft into long bonds, and close the window by law', pc: 8, sign: true,
        requires: { v: ['debt.ways', '>', 2] },
        outcomes: [{
          result: 'The overdraft is converted into forty-year bonds at a rate the market sets. It costs more every month, and it can never again be drawn on a telephone call. The naira recovers a third of what it lost.',
          fx: [['bonus.inflation', -2.5], ['bloc.establishment', 8], ['nation.integrity', 2], ['tycoon.ty_bank', 6]],
          ops: [['notes', 'ways']],
          flags: { 'print.renounced': true },
          news: ['CENTRAL BANK OVERDRAFT CONVERTED TO BONDS; WINDOW CLOSED', 'PRINTING MACHINE DON LOCK. GOVERNMENT GO BORROW LIKE EVERYBODY'],
          archive: 'Converted the central bank overdraft into bonds and ended the practice by law.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'react.oilco', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 3, reactive: true,
    when: { v: ['agenda.t2', '==', 1] }, weight: 12,
    office: 'Office of the National Security Adviser', stamp: 'SECRET',
    title: 'A sudden outbreak of pipeline vandalism',
    body: [
      'Since the oil company was made to publish its accounts and remit in full, reported pipeline vandalism has risen fourfold. Reported losses match, almost exactly, the amount it now has to remit.',
      'The company requests a ₦300bn "pipeline security" contract, to be awarded without tender, to firms it will nominate.',
      { when: { v: ['theatre.SS', '>', 55] }, text: 'The Niger Delta is dangerous enough that some of the breaks are real. That is what makes the rest of them deniable.' },
      { when: { flag: 'oil.metered' }, text: 'The export terminals are already metered. The losses the company reports do not show up at the meters. They show up only in its own accounts.' },
    ],
    trace: [['bonus.fiscal', 1]],
    reads: [
      { role: 'nsa', good: 'I have flown the lines, {SIR}. The breaks are real. They are also very neat, and very near access roads.' },
      { role: 'sap', good: 'You took their money. This is them taking it back by another door.' },
    ],
    choices: [
      {
        id: 'meter', label: 'Meter every terminal and publish daily volumes', pc: 8, naira: 0.2,
        requires: { not: { flag: 'oil.metered' } }, locked: 'The terminals are already metered.',
        outcomes: [{
          result: 'Meters are installed at every export terminal. The "vandalism" stops within the quarter, having been measured.',
          fx: [['nation.integrity', 3], ['bonus.fiscal', 0.02], ['bloc.establishment', -4], ['theatre.SS', -3], ['tycoon.ty_fuel', -5]],
          flags: { 'oil.metered': true },
          news: ['OIL COMPANY\'S "VANDALISM" FALLS AFTER TERMINALS ARE METERED', 'DEM PUT METER. THE "VANDALS" DON DISAPPEAR'],
          archive: 'Metered every oil terminal and published daily volumes.', sig: 3,
        }],
      },
      {
        id: 'compare', label: 'Publish the meter readings beside the company\'s loss claims', pc: 5,
        requires: { flag: 'oil.metered' },
        outcomes: [{
          result: 'The two columns are published side by side, terminal by terminal. Where the meters show oil leaving, the company reports it lost. The claims stop the following month, and the company\'s audit committee asks for a meeting with its own managers.',
          fx: [['nation.integrity', 3], ['bonus.fiscal', 0.015], ['bloc.establishment', -3], ['bloc.press', 3], ['tycoon.ty_fuel', -4]],
          news: ['METER DATA CONTRADICTS OIL COMPANY\'S VANDALISM CLAIMS', 'METER SAY OIL COMOT. COMPANY SAY VANDALS. WHO DEY LIE?'],
          archive: 'Published terminal meter readings against the oil company\'s claimed losses.', sig: 2,
        }],
      },
      {
        id: 'contract', label: 'Approve the security contract',
        outcomes: [{
          result: 'The contract is awarded. Vandalism falls on the lines the contractors guard and rises on the ones they do not.',
          fx: [['nation.fiscalSpace', -0.3], ['bonus.fiscal', -0.02], ['nation.integrity', -3], ['bloc.establishment', 4], ['theatre.SS', 3], ['tycoon.ty_fuel', 5], ['person.gov_ss', 5]],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['oilco'], trail: 2 },
          news: ['FG AWARDS ₦300BN PIPELINE SECURITY CONTRACT', '₦300BN TO GUARD PIPE. WHO COLLECT AM?'],
          archive: 'Approved a no-bid pipeline security contract.',
        }],
      },
    ],
  },
  {
    id: 'react.contracting', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2, reactive: true,
    when: { v: ['agenda.c1', '==', 1] }, weight: 12,
    office: 'Bureau of Public Procurement', stamp: 'ROUTINE',
    title: 'Nobody is bidding',
    body: [
      'Since every federal contract began to be published, the established contractors have stopped bidding. Eleven tenders this month received no offers.',
      'Their association says, privately, that "there is nothing left in it". Publicly it cites "an unfavourable operating environment".',
      'A number of smaller firms, and two foreign ones, have asked whether the tenders are still open.',
      { when: { v: ['debt.contractors', '>', 0.5] }, text: 'They add that the government has not paid them for the last jobs. That part is true, and it is the only part they can say in public.' },
    ],
    trace: [['nation.integrity', 1]],
    reads: [
      { role: 'sap', good: 'They expect you to blink, {SIR}. If the roads stop being built, you take the blame, and the old arrangements come back as a rescue.' },
    ],
    choices: [
      {
        id: 'open', label: 'Open the tenders to anyone who can post a bond',
        outcomes: [{
          result: 'Two hundred new firms bid. Prices come in 30% lower. Some of the new firms are not very good, and are found out early because it is all published.',
          fx: [['nation.jobs', 4], ['nation.fiscalSpace', 0.3], ['bloc.party', -5], ['nation.capacity', 1.5], ['bonus.jobs', 0.02], ['tycoon.ty_trade', -4]],
          ops: [['mark', 'min_works', 1, 'Opened federal tenders to new firms']],
          news: ['NEW FIRMS UNDERBID OLD GUARD BY 30%', 'SMALL CONTRACTOR DON COLLECT WORK. BIG MEN DEY VEX'],
          archive: 'Opened federal tenders to new bidders after the old contractors boycotted.', sig: 2,
        }],
      },
      {
        id: 'threshold', label: 'Raise the publication threshold to ₦5bn',
        outcomes: [{
          result: 'The threshold is raised "to reduce administrative burden". The contractors return. Almost every contract is now ₦4.9bn.',
          fx: [['nation.integrity', -5], ['bloc.party', 5], ['bloc.press', -4], ['tycoon.ty_trade', 4]],
          ops: [['mark', 'min_works', -1, 'Let contracts slip back out of sight']],
          news: ['FG RAISES CONTRACT PUBLICATION THRESHOLD', 'EVERY CONTRACT NA ₦4.9BN NOW. YOU SEE AM?'],
          archive: 'Gutted open contracting by raising the publication threshold.', sig: 2,
        }],
      },
      {
        id: 'pay', label: 'Pay the old contractors what they are owed, and keep every tender open',
        requires: { v: ['debt.contractors', '>', 0.5] },
        outcomes: [{
          result: 'With the arrears paid, the "unfavourable operating environment" loses its only honest clause. Half the old firms come back and bid against the new ones, in public, at prices nobody had seen from them before.',
          fx: [['nation.jobs', 5], ['nation.capacity', 2], ['bloc.party', -2], ['bloc.establishment', 4], ['bonus.jobs', 0.02]],
          ops: [['paydebt', 'contractors', 1], ['mark', 'min_works', 1, 'Paid the contractors and kept the tenders open']],
          news: ['FG CLEARS CONTRACTOR ARREARS; OLD AND NEW FIRMS BID IN THE OPEN', 'GOVERNMENT PAY CONTRACTORS. NOW EVERYBODY DEY BID'],
          archive: 'Paid the contractors\' arrears and kept open contracting intact.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'react.payroll', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2, reactive: true,
    when: { v: ['mine.v1', '==', 1] }, weight: 12,
    office: 'Office of the Head of the Civil Service', stamp: 'CONFIDENTIAL',
    title: 'The ghosts had sponsors',
    body: [
      'The payroll audit removed 71,000 names. The Head of Service now has the list of who put them there.',
      'It includes 400 "constituency aides" drawing salaries for Senator Efe Akpojotor, a permanent secretary\'s entire extended family, and a block of 2,100 belonging to a governor.',
      'Several of those named have asked for the list not to be published. One has asked what you would like in return.',
    ],
    reads: [
      { role: 'sap', good: 'This is leverage, {SIR}, if you want it to be. Or it is a cleaner government. It cannot be both.' },
    ],
    choices: [
      {
        id: 'publish', label: 'Publish the list and refer it for prosecution', pc: 8,
        outcomes: [{
          result: 'The list is published. Eleven officials are charged. The governor issues a statement that his 2,100 were "volunteers".',
          fx: [['nation.integrity', 5], ['bloc.press', 5], ['approval', 2], ['bloc.party', -6], ['person.sen_rebel', -15]],
          ops: [['governors', -2], ['senators', -2]],
          news: ['FG NAMES OFFICIALS BEHIND 71,000 GHOST WORKERS', 'SEE WHO GET THE GHOST WORKERS'],
          archive: 'Published and prosecuted the sponsors of 71,000 ghost workers.', sig: 3,
        }],
      },
      {
        id: 'recover', label: 'Recover the money quietly; no prosecutions',
        outcomes: [{
          result: 'Refunds are negotiated in private. ₦90bn comes back. Nobody is named.',
          fx: [['nation.fiscalSpace', 0.09], ['bloc.party', 2], ['nation.integrity', -1]],
          news: ['FG RECOVERS ₦90BN FROM PAYROLL FRAUD', '₦90BN RETURN. NOBODY GO JAIL'],
          archive: 'Recovered ghost-worker money privately, without prosecutions.',
        }],
      },
      {
        id: 'keep', label: 'Keep the list in the drawer',
        outcomes: [{
          result: 'The list goes into the left-hand drawer. Forty people in the Assembly now vote the way you ask, for reasons they do not discuss.',
          fx: [['pc', 12], ['bloc.party', 8], ['nation.integrity', -4]],
          ops: [['senators', 4]],
          favour: ['sen_rebel', 'owed', 2],
          flags: { 'drawer.open': true },
          exposure: { kind: 'political', amount: 0, witnesses: ['cos', 'hos'], trail: 1 },
          archive: 'Kept the ghost-worker list as leverage over the Assembly.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'react.statepolice', kind: 'standalone', slot: 'lead', category: 'security', tone: 'grave', intensity: 4, reactive: true,
    cast: { WHO: 'troubledGovernor' }, when: { v: ['mine.s4', '==', 1] }, weight: 12,
    office: 'Office of the Attorney General of the Federation', stamp: 'URGENT',
    title: 'A governor has used his police',
    body: [
      '{WHO}\'s new state police have arrested the opposition\'s candidate for governor, his campaign manager and two journalists, six weeks before the election.',
      '{WHO_SHORT} is of your party. The charges are "conduct likely to cause a breach of the peace".',
      'This is the abuse that opponents of state police predicted. It is the first test of the law you signed.',
    ],
    trace: [['nation.security', 1]],
    reads: [
      { role: 'sap', good: 'Whatever you do here is what every governor will assume is permitted, {SIR}.' },
    ],
    choices: [
      {
        id: 'intervene', label: 'Have the Attorney General take over the case and release them', pc: 10,
        outcomes: [{
          result: 'The detainees are released within the day. {WHO_SHORT} is furious. Thirty-five other governors take note of where the line is.',
          fx: [['nation.integrity', 4], ['bloc.press', 6], ['bloc.party', -8], ['approval', 2], ['person.$WHO', -14], ['rival.fire', -3]],
          ops: [['governors', -2]],
          flags: { 'statepolice.checked': true },
          news: ['FG ORDERS RELEASE OF DETAINED OPPOSITION CANDIDATE', 'PRESIDENT TELL GOVERNOR: RELEASE THEM NOW'],
          archive: 'Overrode a governor who used state police against his opponents.', sig: 3,
        }],
      },
      {
        id: 'silent', label: 'Say it is a matter for the state',
        outcomes: [{
          result: 'The Presidency declines to comment. {WHO_SHORT} understands what has been given, and what is owed for it. Within the year, four more states have done the same.',
          fx: [['nation.integrity', -5], ['bloc.press', -7], ['bloc.party', 4], ['nation.security', -3], ['bloc.street', -4], ['person.$WHO', 8], ['rival.fire', 6], ['rival.alt', 4]],
          favour: ['$WHO', 'owed', 2],
          news: ['PRESIDENCY SILENT AS STATE POLICE DETAIN OPPOSITION', 'STATE POLICE DON TURN TO GOVERNOR THUGS'],
          archive: 'Stayed silent when a governor used state police against opponents.', sig: 3,
        }],
      },
    ],
  },
  {
    id: 'react.patronage', kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'dry', intensity: 2, reactive: true,
    when: { v: ['mine.patronage', '==', 1] }, weight: 12,
    office: 'Office of the Chief of Staff', stamp: 'CONFIDENTIAL',
    title: 'One of the party\'s ministers',
    body: [
      'A minister you appointed in the reshuffle for the party has awarded a ₦46bn contract to a company registered at his own house.',
      'He is the nominee of four governors. He points out, reasonably, that he was not appointed for his procurement skills.',
    ],
    trace: [['bloc.party', 1], ['nation.integrity', -1]],
    reads: [
      { role: 'sap', good: 'You gave the party the ministries, {SIR}. This is what the party does with ministries.' },
    ],
    choices: [
      {
        id: 'sack', label: 'Dismiss him and cancel the contract', pc: 8,
        outcomes: [{
          result: 'He is dismissed. The four governors want to know what the reshuffle was for.',
          fx: [['nation.integrity', 3], ['bloc.party', -8], ['bloc.press', 3]],
          ops: [['governors', -3]],
          news: ['MINISTER SACKED OVER ₦46BN CONTRACT TO OWN FIRM', 'MINISTER GIVE HIMSELF CONTRACT. PRESIDENT SACK AM'],
          archive: 'Dismissed a party-nominated minister for awarding himself a contract.',
        }],
      },
      {
        id: 'allow', label: 'Let it stand',
        outcomes: [{
          result: 'The contract proceeds. Three other ministers register companies.',
          fx: [['nation.integrity', -4], ['nation.capacity', -2], ['bloc.party', 3], ['pressure.scandalHeat', 10], ['debt.contractors', 0.05]],
          ops: [['governors', 2]],
          exposure: { kind: 'tolerated', amount: 0, witnesses: ['minister'], trail: 2 },
          news: ['MINISTER\'S FIRM WINS ₦46BN CONTRACT', 'MINISTER HOUSE ADDRESS NA THE COMPANY ADDRESS'],
          archive: 'Allowed a minister to award a contract to his own company.',
        }],
      },
    ],
  },
  {
    id: 'react.duties', kind: 'standalone', slot: 'lead', category: 'economy', tone: 'dry', intensity: 2, reactive: true,
    when: { v: ['mine.duties', '==', 1] }, weight: 12,
    office: 'Federal Ministry of Agriculture', stamp: 'ROUTINE',
    title: 'The rice millers',
    body: [
      'Rice is 20% cheaper since you suspended import duties. Forty-one local mills have closed and laid off 30,000 workers.',
      'The millers say they invested because a previous government promised them protection. That is true.',
      'Consumers outnumber millers by about four thousand to one.',
      'Chief Obinna Ezeudu, who holds the import licences, has never been more supportive of your government. Alhaji Kabir Birniwa, who owns four of the mills, has never been less.',
    ],
    trace: [['bonus.inflation', -1]],
    reads: [
      { role: 'fin', good: 'Both things are true, {SIR}. Cheaper rice and dead mills. You can soften one with money, or undo the other.', weak: 'The millers always complain, {SIR}.' },
    ],
    choices: [
      {
        id: 'support', label: 'Keep the duties off; give the mills cheap power and credit', naira: 0.3,
        outcomes: [{
          result: 'Twenty-six mills reopen with lower costs. Rice stays cheap. It is the expensive way to be right.',
          fx: [['nation.jobs', 3], ['bloc.establishment', 3], ['bloc.street', 2], ['tycoon.ty_maker', 6]],
          ops: [['mark', 'min_agric', 1, 'Kept rice cheap and the mills open']],
          news: ['FG BACKS RICE MILLS WITH POWER, CREDIT', 'RICE CHEAP AND MILL STILL DEY WORK'],
          archive: 'Kept food duties off and supported local mills to compete.', sig: 2,
        }],
      },
      {
        id: 'restore', label: 'Restore the duties',
        outcomes: [{
          result: 'Duties return. So does the old price. The mills reopen and the millers send a delegation of thanks.',
          fx: [['bonus.inflation', 2.5], ['approval', -3], ['bloc.street', -5], ['bloc.party', 4], ['nation.jobs', 2], ['tycoon.ty_trade', -8], ['tycoon.ty_maker', 6]],
          news: ['IMPORT DUTIES ON RICE RESTORED', 'RICE DON COST AGAIN. THANK YOU, PRESIDENT'],
          archive: 'Restored food import duties after suspending them.', sig: 2,
        }],
      },
      {
        id: 'hold', label: 'Hold the policy; the mills must compete',
        outcomes: [{
          result: 'The policy stands. Fifteen mills survive, and they are the fifteen that were actually milling.',
          fx: [['nation.jobs', -3], ['bloc.establishment', -4], ['zone.NW.approval', -3], ['tycoon.ty_trade', 5], ['tycoon.ty_maker', -7], ['person.gov_nw', -4]],
          news: ['FG RULES OUT RETURN OF RICE DUTIES', 'MILL WORKERS LOSE JOB. RICE STILL CHEAP'],
          archive: 'Let local rice mills close rather than restore duties.',
        }],
      },
    ],
  },
  {
    id: 'react.tariff', kind: 'standalone', slot: 'lead', category: 'infrastructure', tone: 'dry', intensity: 2, reactive: true,
    when: { v: ['mine.p3', '==', 1] }, weight: 12,
    office: 'Electricity Regulatory Commission', stamp: 'ROUTINE',
    title: 'Billed for twenty hours, supplied nine',
    body: [
      'Under the tariff you approved, customers promised twenty hours a day pay the higher rate. Meter data shows that a third of them are receiving nine.',
      'The distribution companies are collecting the higher tariff regardless. They describe the shortfall as "transitional".',
      { when: { v: ['debt.gas', '>', 0.3] }, text: 'The distribution companies say they cannot supply what the generators do not send, and the generators say they cannot burn gas nobody has paid for.' },
    ],
    trace: [['nation.power', 1]],
    reads: [
      { role: 'power', good: 'The tariff was the bargain, {SIR}: pay more, get more. If we do not enforce their half, we have simply raised prices.', weak: 'The companies are doing their best, {SIR}.' },
    ],
    choices: [
      {
        id: 'refund', label: 'Order automatic refunds for every hour not supplied', pc: 5,
        outcomes: [{
          result: 'Refunds appear on bills from next month. Supply to the affected areas improves remarkably quickly once it costs the companies money.',
          fx: [['nation.power', 3], ['approval', 2], ['bloc.street', 3], ['bloc.establishment', -3], ['bonus.power', 0.02], ['tycoon.ty_maker', 4]],
          ops: [['mark', 'min_power', 1, 'Made the power companies refund hours not supplied']],
          news: ['POWER FIRMS MUST REFUND FOR HOURS NOT SUPPLIED', 'NO LIGHT, NO PAY: REFUND DON START'],
          archive: 'Forced power companies to refund customers for hours not supplied.', sig: 2,
        }],
      },
      {
        id: 'transitional', label: 'Accept that it is transitional',
        outcomes: [{
          result: 'It remains transitional. Customers stop paying, on the reasonable ground that they are not receiving.',
          fx: [['approval', -2], ['bloc.street', -3], ['nation.power', -2], ['bonus.power', -0.03], ['debt.gas', 0.2]],
          ops: [['mark', 'min_power', -1, 'Let customers be billed for power they never got']],
          news: ['CUSTOMERS BOYCOTT BILLS OVER SUPPLY SHORTFALL', 'WE NO GO PAY FOR LIGHT WEY WE NO SEE'],
          archive: 'Let power companies charge the higher tariff without supplying the hours.',
        }],
      },
    ],
  },
  {
    id: 'react.chiefs', kind: 'standalone', slot: 'lead', category: 'security', tone: 'dry', intensity: 2, reactive: true,
    when: { v: ['mine.chiefs', '==', 1] }, weight: 10,
    office: 'Office of the National Security Adviser', stamp: 'SECRET',
    title: 'The officers you retired',
    body: [
      'By convention, appointing new service chiefs retires every officer senior to them. Your choices have ended the careers of sixty-one generals.',
      'A "Forum of Retired Senior Officers" has issued a statement of concern about "the direction of the armed forces". Several of its members have since been seen at Senator Garba Dandume\'s house.',
    ],
    reads: [
      { role: 'nsa', good: 'They are angry, not dangerous, {SIR}. Give them something to do and somewhere to be. Idle generals write letters.' },
    ],
    choices: [
      {
        id: 'use', label: 'Give them posts: ambassadors, boards, a veterans\' commission',
        outcomes: [{
          result: 'Eighteen become ambassadors. The Forum\'s next statement praises "the President\'s respect for service".',
          fx: [['bloc.establishment', 5], ['nation.integrity', -1], ['bloc.party', -2], ['rival.strong', -3]],
          news: ['EX-GENERALS NAMED AMBASSADORS', 'RETIRED GENERALS DON GET NEW WORK'],
          archive: 'Found posts for the generals retired by your choice of service chiefs.',
        }],
      },
      {
        id: 'ignore', label: 'Thank them for their service',
        outcomes: [{
          result: 'A statement thanks them. Six join Senator Dandume\'s security committee, and are very well informed.',
          fx: [['bloc.establishment', -4], ['pressure.scandalHeat', 5], ['rival.strong', 7]],
          news: ['RETIRED GENERALS JOIN OPPOSITION', 'GENERALS DON PORT GO OPPOSITION'],
          archive: 'Left the retired generals to the opposition.',
        }],
      },
    ],
  },
  {
    id: 'react.clean_party', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, reactive: true,
    when: { all: [{ v: ['nation.integrity', '>=', 48] }, { v: ['bloc.party', '<', 45] }, { turn: [14] }] }, weight: 12,
    office: 'Office of the Special Adviser, Political Matters', stamp: 'CONFIDENTIAL',
    title: 'The party says there is nothing in it for them',
    body: [
      'A delegation of your own party\'s governors and senators has asked for a private meeting. They are not angry. They are confused.',
      'The contracts are published. The boards are filled on merit. The security vote has receipts. They would like to know, in the Chairman\'s words, "what a person is supposed to campaign with".',
      'They control the primary. They are asking politely, this time.',
      'By the Special Adviser\'s count, about {DELEGATES} in every hundred delegates would be yours at a convention held today.',
    ],
    trace: [['nation.integrity', 1], ['bloc.party', -1]],
    reads: [
      { role: 'sap', good: 'They are not wrong about how elections are won here, {SIR}. You can give them projects they can point at, or you can give them what they are actually asking for.' },
    ],
    choices: [
      {
        id: 'projects', label: 'Give every district a visible, audited project', naira: 0.5,
        outcomes: [{
          result: 'Each of them gets a road, a clinic or a transformer, built to specification and published. It is patronage with receipts. They take it.',
          fx: [['bloc.party', 10], ['approval', 2], ['nation.jobs', 2]],
          ops: [['governors', 3], ['senators', 3]],
          flags: { 'party.projects': true },
          news: ['FG ROLLS OUT 469 CONSTITUENCY PROJECTS, ALL PUBLISHED', 'EVERY SENATOR GET PROJECT. THIS TIME WE FIT CHECK AM'],
          archive: 'Gave every legislative district an audited project to keep the party.', sig: 2,
        }],
      },
      {
        id: 'old', label: 'Let them have the boards and the contracts back',
        outcomes: [{
          result: 'The party relaxes. So do several of your reforms.',
          fx: [['bloc.party', 16], ['pc', 8], ['nation.integrity', -8], ['bloc.press', -5]],
          ops: [['governors', 5], ['senators', 5]],
          news: ['PARTY STALWARTS RETURN TO BOARDS', 'THE OLD WAY DON COME BACK'],
          archive: 'Gave the party back the boards and contracts.', sig: 3,
        }],
      },
      {
        id: 'no', label: 'Tell them to campaign on the results',
        outcomes: [{
          result: 'They thank you for your time. The Chairman\'s driver is seen at the opposition secretariat that evening.',
          fx: [['bloc.party', -7], ['nation.integrity', 1], ['bloc.press', 3]],
          ops: [['governors', -3], ['senators', -3]],
          news: ['PRESIDENT TO PARTY: "CAMPAIGN ON RESULTS"', 'PRESIDENT TELL PARTY MAKE DEM USE RESULT CAMPAIGN'],
          archive: 'Told your own party to campaign on results.',
        }],
      },
      {
        id: 'fund', label: 'Build the projects from the Infrastructure Fund, one per district, all published',
        requires: { v: ['fund.infra', '>=', 0.5] },
        outcomes: [{
          result: 'Each of them gets a road, a clinic or a transformer, paid for from money already set aside and listed line by line on the fund\'s website. They take it. It did not cost the budget a naira.',
          fx: [['fund.infra', -0.5], ['bloc.party', 10], ['approval', 2], ['nation.jobs', 2]],
          ops: [['governors', 3], ['senators', 3]],
          flags: { 'party.projects': true },
          news: ['INFRASTRUCTURE FUND TO BUILD 469 CONSTITUENCY PROJECTS, ALL PUBLISHED', 'EVERY SENATOR GET PROJECT. THIS TIME WE FIT CHECK AM'],
          archive: 'Kept the party with audited projects paid for from the Infrastructure Fund.', sig: 2,
        }],
      },
    ],
  },

  // ---------------------------------------------------------------- phone

  {
    ...phone, id: 'react.road_done', kind: 'chain', category: 'ceremonial', tone: 'dry', reactive: true,
    from: '{GOVCHAIR}',
    title: 'The road',
    body: [
      'Your Excellency. The road is finished. I did not believe it either. My people are asking when you will come and commission it.',
      'I have told them it was my idea. I trust that is acceptable.',
    ],
    choices: [
      {
        id: 'go', label: 'Go and commission it',
        outcomes: [{
          result: 'You cut the ribbon. He makes a speech in which the road is mostly his. The crowd knows better.',
          fx: [['zone.SS.approval', 5], ['bloc.party', 4], ['approval', 1], ['person.gov_ss', 4]],
          news: ['PRESIDENT COMMISSIONS FEDERAL ROAD', 'ROAD WEY PRESIDENT PROMISE DON FINISH. E SHOCK US'],
          flags: ROAD_DONE, domain: roadDone('Finished and commissioned by the President, with the governor speaking.'),
          archive: 'Commissioned the federal road you funded at a governor\'s request.',
        }],
      },
      {
        id: 'his', label: '"It was your idea. Commission it yourself."',
        outcomes: [{
          result: 'He is delighted and, for the first time, slightly in your debt.',
          fx: [['bloc.party', 7], ['pc', 3], ['person.gov_ss', 10]],
          favour: ['gov_ss', 'owed', 1],
          flags: ROAD_DONE, domain: roadDone('Finished. The governor commissioned it and took the credit, with the President\'s agreement.'),
          archive: 'Let the governor take the credit for a road you funded.',
        }],
      },
    ],
    ignored: {
      result: 'He commissions it himself and does not mention you.',
      fx: [['bloc.party', 2]],
      flags: ROAD_DONE, domain: roadDone('Finished. The governor commissioned it alone; the President did not reply.'),
      archive: 'Did not attend the commissioning of a road you funded.',
    },
  },
  {
    ...phone, id: 'react.fin_surplus', kind: 'standalone', category: 'economy', tone: 'dry', reactive: true,
    when: { all: [{ flag: 'policy.subsidy', is: 'removed' }, { v: ['nation.fiscalSpace', '>=', 2] }] }, weight: 10,
    from: '{FIN}',
    title: 'A note on the balance',
    body: [
      '{SIR}, for the first time since I took this job I am writing to say there is money. ₦2tn uncommitted.',
      'I would rather you decided what it is for before the Assembly decides for you. The reforms list and the big bets are both on your desk. So is the list of people we owe.',
    ],
    choices: [
      {
        id: 'noted', label: '"Noted. I have plans for it."',
        outcomes: [{ result: 'The Minister says that is all a Finance Minister ever wants to hear.', fx: [['rel.fin', 5]], archive: 'Acknowledged the Finance Minister\'s note on the surplus.' }],
      },
      {
        id: 'save', label: '"Put a trillion of it abroad before anyone sees it."',
        outcomes: [{ result: 'A trillion naira leaves for the Future Generations Fund that afternoon. The governors learn of it from the newspapers.', fx: [['nation.fiscalSpace', -1], ['fund.abroad', 1], ['rel.fin', 8], ['bloc.establishment', 3]], ops: [['governors', -2]], archive: 'Moved a trillion naira of surplus into the fund abroad.' }],
      },
      {
        id: 'arrears', label: '"Pay the pensioners in full and half the contractors."',
        requires: { v: ['debt.arrears', '>', 0.5] },
        outcomes: [{ result: 'The Minister has the schedules ready, and had them ready before writing to you.', fx: [['rel.fin', 6], ['bloc.street', 2]], ops: [['paydebt', 'pensions', 1], ['paydebt', 'contractors', 0.5]], archive: 'Spent a surplus on pension and contractor arrears.' }],
      },
    ],
    ignored: { result: 'The note sits unanswered. So does the money.', archive: 'Did not reply to the Finance Minister\'s note on the surplus.' },
  },
  {
    ...phone, id: 'react.labour_thanks', kind: 'standalone', category: 'labour', tone: 'dry', reactive: true,
    when: { any: [{ all: [{ flag: 'wage.agreement', is: 'funded' }, { v: ['pred', '==', 0] }] }, { v: ['mine.e2', '==', 1] }] }, weight: 10,
    from: '{LABOUR}',
    title: 'Not a threat, for once',
    body: [
      '{MRP}. I have been in this movement thirty years and I have never sent a message like this one. The agreement was honoured. On time.',
      'My executive council does not know what to do with itself. I will find them something. But I wanted you to hear it from me.',
    ],
    choices: [
      {
        id: 'thanks', label: '"We keep our word. Tell them that."',
        outcomes: [{ result: 'He does tell them. It is quoted on the evening news, by a union leader, about a government.', fx: [['bloc.street', 4], ['pressure.wageGrievance', -10], ['approval', 1]], archive: 'Was thanked by the labour leader for honouring an agreement.' }],
      },
    ],
    ignored: { result: 'You do not reply. He does not take it personally.', archive: 'Did not reply to the labour leader\'s thanks.' },
  },
  {
    ...phone, id: 'react.drawer_cos', kind: 'standalone', category: 'temptation', tone: 'dry', reactive: true,
    when: { v: ['exposure.total', '>=', 30] }, weight: 10,
    from: '{COS}',
    title: 'A small matter',
    body: [
      '{SIR}. My daughter is getting married in December. Abuja weddings are not what they were.',
      'I mention it only because I keep the drawer, and I know what is in it, and I have never asked for anything.',
    ],
    choices: [
      {
        id: 'gift', label: 'Send a generous gift', purse: 5,
        outcomes: [{ result: 'The wedding is magnificent. He never mentions the drawer again, which is what you paid for.', fx: [['bloc.villa', 4], ['rel.cos', 15]], archive: 'Paid the Chief of Staff for his discretion.' }],
      },
      {
        id: 'card', label: 'Send a card',
        outcomes: [{ result: 'He thanks you for the card. He is a little less careful, afterwards, about who hears what.', fx: [['bloc.villa', -5], ['pressure.scandalHeat', 12], ['rel.cos', -20]], archive: 'Declined to pay the Chief of Staff for his discretion.' }],
      },
    ],
    ignored: { result: 'He notes the silence.', fx: [['bloc.villa', -4], ['pressure.scandalHeat', 8]], archive: 'Ignored the Chief of Staff\'s hint about the drawer.' },
  },
  {
    ...phone, id: 'react.venture_won', kind: 'standalone', category: 'fortune', tone: 'dry', reactive: true,
    when: { v: ['bets.won', '>=', 1] }, weight: 10,
    from: '{SAP}',
    title: 'About the thing that worked',
    body: [
      '{SIR}, eleven people have called me today to explain that it was their idea. Three of them voted against it.',
      'The Chairman wants a rally to celebrate. The opposition says it was started under them.',
    ],
    choices: [
      {
        id: 'share', label: 'Share the credit widely',
        outcomes: [{ result: 'Everyone who opposed it is thanked by name. They are now invested in its survival, which is worth more than the applause.', fx: [['bloc.party', 6], ['bloc.establishment', 3]], ops: [['governors', 2], ['senators', 2]], archive: 'Shared the credit for a successful big bet.' }],
      },
      {
        id: 'own', label: 'Hold the rally. It was yours.',
        outcomes: [{ result: 'The rally is enormous. It is, for an afternoon, entirely yours.', fx: [['approval', 3], ['bloc.street', 3], ['bloc.party', -2]], archive: 'Claimed sole credit for a successful big bet.' }],
      },
    ],
    ignored: { result: 'Others claim it in your absence.', fx: [['bloc.party', 1]], archive: 'Let others claim the credit for a successful big bet.' },
  },
];
