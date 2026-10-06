import type { Cond, GameEvent } from '../../engine/types';

// WHAT SUCCESS BRINGS (plans 12.A9 and 14.T10)
// A bet that works does not only add to the scorecard. It creates something the
// country did not have, and with it a question nobody had to answer before:
// who gets the refinery's petrol, who pays for a branch line, who regulates a
// payment rail that seven countries now use. Each file below can only arise
// because a big bet succeeded, and each is a real choice between people who
// all have a case.

const won = (id: string): Cond => ({ v: [`venture.${id}`, '==', 1] });

export const SUCCESS_FILES: GameEvent[] = [
  {
    id: 'success.refinery', kind: 'standalone', slot: 'lead', category: 'economy', tone: 'dry', intensity: 3, reactive: true, topic: 'oil',
    when: won('refinery'), weight: 16,
    office: 'Federal Ministry of Petroleum Resources', stamp: 'CONFIDENTIAL',
    title: 'The neighbours want to buy our petrol',
    body: [
      'The Rivers refinery is running above its rated output. Three neighbouring governments have asked to buy what the country does not use, in dollars, at the market price.',
      'The marketers point out that "what the country does not use" depends on what the regulated price is, and that the queues come back whenever cargoes leave.',
    ],
    reads: [
      { role: 'fin', good: 'Dollars we earn instead of borrowing, {SIR}. But write the home market into the contract first, or the first scarcity will be blamed on Cotonou.', weak: 'Sell all of it, {SIR}. Dollars are dollars.' },
      { role: 'sap', good: 'The day there is a queue in Lagos while tankers cross the border, nobody will remember that the refinery works.' },
    ],
    choices: [
      {
        id: 'contract', label: 'Export the surplus, with the home market supplied first by contract', pc: 4,
        outcomes: [{
          result: 'The contracts are signed with a domestic supply clause: export cargoes load only when the national stock is above thirty days. The neighbours accept it. The dollars arrive monthly.',
          fx: [['fx.reserves', 2], ['bonus.fiscal', 0.01], ['bloc.establishment', 3]],
          flags: { 'refinery.exports': 'contracted' },
          news: ['NIGERIA SIGNS PETROL EXPORT DEALS WITH HOME-SUPPLY GUARANTEE', 'WE DON START TO SELL PETROL TO NEIGHBOURS. HOME FIRST, DEM SAY'],
          archive: 'Exported refinery surplus under contracts that put the home market first.', sig: 2,
        }],
      },
      {
        id: 'sell', label: 'Sell whatever they will buy',
        outcomes: [{
          result: 'Export cargoes leave weekly. The reserves rise. So, within two months, do the queues in the north, where the tankers no longer go.',
          fx: [['fx.reserves', 4], ['bonus.fiscal', 0.015], ['pressure.fuelSupplyStress', 12], ['bloc.street', -3]],
          flags: { 'refinery.exports': 'open' },
          news: ['REFINERY EXPORTS SURGE; NORTHERN QUEUES RETURN', 'PETROL DEY CROSS BORDER. WE DEY QUEUE FOR KANO'],
          archive: 'Sold refinery output abroad without protecting the home market.', sig: 2,
        }],
      },
      {
        id: 'home', label: 'Keep every litre at home',
        outcomes: [{
          result: 'The neighbours are told no. The depots stay full and the queues stay away. The Finance Ministry notes the dollars that were offered.',
          fx: [['pressure.fuelSupplyStress', -8], ['bloc.establishment', -2], ['approval', 1]],
          flags: { 'refinery.exports': 'none' },
          news: ['FG REJECTS PETROL EXPORT REQUESTS, PRIORITISES HOME SUPPLY', 'OUR PETROL NA FOR US FIRST'],
          archive: 'Kept the refinery\'s output for the home market.', sig: 1,
        }],
      },
    ],
  },
  {
    id: 'success.steel', kind: 'standalone', slot: 'lead', category: 'economy', tone: 'dry', intensity: 2, reactive: true, topic: 'money',
    when: { any: [won('steel'), won('steel_sale')] }, weight: 14,
    office: 'Federal Ministry of Industry, Trade and Investment', stamp: 'URGENT',
    title: 'The steel complex wants protection',
    body: [
      'The complex is producing. Its managers say it cannot compete with steel dumped from abroad at below cost, and want a tariff.',
      'The builders, the car assemblers and the fabricators who buy steel say a tariff would make everything they make dearer. Alhaji Kabir Birniwa\'s factories use more steel than anyone.',
    ],
    reads: [
      { role: 'fin', good: 'A tariff moves the cost from the complex to everyone who buys steel, {SIR}. It is a choice about who pays, not whether.', weak: 'Protect our industry, {SIR}. That is what industry is for.' },
    ],
    choices: [
      {
        id: 'tariff', label: 'Impose the tariff',
        outcomes: [{
          result: 'Imported steel costs a quarter more. The complex adds a shift. The builders add the difference to their quotes.',
          fx: [['nation.jobs', 3], ['nation.inflation', 0.6], ['tycoon.ty_maker', -6]],
          news: ['FG IMPOSES 25% TARIFF ON IMPORTED STEEL', 'STEEL TARIFF: OUR FACTORY HAPPY, BUILDERS VEX'],
          archive: 'Protected the revived steel complex with a tariff.', sig: 2,
        }],
      },
      {
        id: 'compete', label: 'Let it compete',
        outcomes: [{
          result: 'No tariff. The complex cuts its prices and its night shift. The fabricators thank you; the steelworkers\' union does not.',
          fx: [['nation.jobs', -2], ['bloc.establishment', 3], ['tycoon.ty_maker', 4]],
          news: ['NO TARIFF FOR STEEL COMPLEX: "COMPETE," SAYS FG', 'GOVERNMENT TELL STEEL: GO COMPETE'],
          archive: 'Refused the steel complex a tariff.', sig: 1,
        }],
      },
      {
        id: 'offtake', label: 'Have the public projects buy its steel at an agreed price', pc: 3,
        outcomes: [{
          result: 'Rail, roads and the people\'s car plant buy from the complex at a price fixed for three years. The complex gets a market; the projects get steel that cost a little more and arrived on time.',
          fx: [['nation.jobs', 2], ['bonus.fiscal', -0.005], ['bloc.establishment', 1]],
          news: ['PUBLIC PROJECTS TO BUY LOCAL STEEL UNDER THREE-YEAR DEAL', 'GOVERNMENT PROJECT GO USE OUR OWN STEEL'],
          archive: 'Gave the steel complex a public offtake contract.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'success.export_power', kind: 'standalone', slot: 'lead', category: 'infrastructure', tone: 'dry', intensity: 2, reactive: true, topic: 'power',
    when: won('export_power'), weight: 14,
    office: 'Federal Ministry of Power', stamp: 'CONFIDENTIAL',
    title: 'A neighbour has stopped paying for its electricity',
    body: [
      'One of the three countries buying power across the border has not paid for four months. Its utility is insolvent and its government asks for patience.',
      'Cutting supply would black out its capital. Not cutting it means the generators here are running for nothing, and the other two buyers are watching.',
    ],
    reads: [
      { role: 'power', good: 'If one pays nothing and keeps the lights, the other two will ask why they pay, {SIR}.', weak: 'They are our brothers, {SIR}. They will pay.' },
    ],
    choices: [
      {
        id: 'cut', label: 'Cut supply until the arrears are paid',
        outcomes: [{
          result: 'The interconnector is switched off at midnight. Their capital goes dark; their finance minister is in Abuja by Thursday with half the arrears.',
          fx: [['bonus.fiscal', 0.005], ['bloc.establishment', 3], ['bloc.press', -2]],
          news: ['NIGERIA CUTS POWER TO NEIGHBOUR OVER UNPAID BILLS', 'DEM NO PAY, WE OFF THEIR LIGHT'],
          archive: 'Cut power exports to a neighbour that had stopped paying.', sig: 2,
        }],
      },
      {
        id: 'credit', label: 'Keep supplying, and let the arrears run',
        outcomes: [{
          result: 'Supply continues. The arrears reach eight months. The other two buyers ask for the same terms.',
          fx: [['bonus.fiscal', -0.01], ['bloc.establishment', -3]],
          news: ['FG KEEPS POWER FLOWING DESPITE UNPAID BILLS', 'NEIGHBOUR NO PAY, LIGHT STILL DEY GO'],
          archive: 'Let a neighbour run up arrears for electricity.', sig: 1,
        }],
      },
      {
        id: 'prepay', label: 'Move every buyer to prepaid contracts, guaranteed by their central banks', pc: 4,
        outcomes: [{
          result: 'The new contracts are prepaid, in dollars, through the regional central banks. One buyer leaves; two stay and pay in advance. Supply at home gets the night-time surplus back.',
          fx: [['bonus.fiscal', 0.01], ['nation.power', 2], ['bloc.establishment', 2]],
          news: ['POWER EXPORTS MOVE TO PREPAID CONTRACTS', 'PAY FIRST, LIGHT COME AFTER'],
          archive: 'Put electricity exports on prepaid, guaranteed contracts.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'success.rail', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, reactive: true, topic: 'politics',
    when: won('rail'), weight: 16,
    office: 'Nigeria Governors\' Forum', stamp: 'URGENT',
    title: 'Every governor wants a branch line',
    body: [
      'The train runs Lagos to Kano in five hours and is full. The governors of states it does not touch have written, jointly, to ask why their people paid for a railway they cannot reach.',
      'The lender has offered a second loan on the same terms. The Debt Office has noted what the first one costs every year.',
    ],
    reads: [
      { role: 'fin', good: 'The first line pays because it joins the two largest markets, {SIR}. The branches will not. A second loan is a second loan.', weak: 'Build them all, {SIR}. Railways pay for themselves.' },
      { role: 'sap', good: 'Say no to all of them and the line becomes "the Lagos–Kano line" in every speech from now to the election.' },
    ],
    choices: [
      {
        id: 'loan', label: 'Take the second loan: branches to the east and north-east',
        outcomes: [{
          result: 'The second loan is signed. Survey teams leave for Maiduguri and Port Harcourt. Every governor issues a statement claiming it.',
          fx: [['debt.eurobond', 1.5], ['nation.jobs', 4], ['bloc.party', 6], ['zone.NE.approval', 4], ['zone.SE.approval', 4], ['bloc.establishment', -4]],
          news: ['FG SIGNS SECOND RAIL LOAN FOR EAST, NORTH-EAST BRANCHES', 'RAIL DON DEY COME OUR SIDE'],
          archive: 'Took a second foreign loan for branch railway lines.', sig: 3,
        }],
      },
      {
        id: 'states', label: 'Branches if the states pay half',
        outcomes: [{
          result: 'Two states put up their half. The others discover that they wanted the railway rather less than they wanted the federal government to pay for it.',
          fx: [['bloc.party', -2], ['nation.capacity', 1], ['nation.jobs', 1]],
          news: ['FG OFFERS RAIL BRANCHES TO STATES THAT CO-FUND', 'IF YOU WANT RAIL, PAY HALF'],
          archive: 'Offered branch railway lines to states that would pay half.', sig: 2,
        }],
      },
      {
        id: 'maintain', label: 'No branches: fund the maintenance of the line that exists',
        outcomes: [{
          result: 'The money goes to track, rolling stock and the depot. The trains keep running on time. The governors keep writing.',
          fx: [['bloc.establishment', 4], ['bloc.party', -4], ['zone.NE.approval', -2]],
          news: ['FG PRIORITISES RAIL MAINTENANCE OVER NEW LINES', 'FIX THE ONE WEY DEY FIRST'],
          archive: 'Refused new branch lines and funded the maintenance of the first.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'success.fintech', kind: 'standalone', slot: 'lead', category: 'economy', tone: 'dry', intensity: 2, reactive: true, topic: 'money',
    when: won('fintech'), weight: 14,
    office: 'Central Bank', stamp: 'CONFIDENTIAL',
    title: 'The central bank wants the payment rail',
    body: [
      'A fifth of West Africa\'s cross-border payments now clear through a server room in Lagos. {CBN} writes that a system this important cannot be supervised by nobody, and proposes that the central bank run it.',
      'The founders say the central bank\'s systems are why traders went around the banks in the first place. Mrs Folake Adetoro\'s bank would like to buy a stake.',
    ],
    reads: [
      { role: 'fin', good: 'It needs a supervisor, {SIR}. It does not need an owner who also competes with it.', weak: 'The central bank knows best, {SIR}.' },
    ],
    choices: [
      {
        id: 'regulator', label: 'An independent payments regulator, by law', pc: 6,
        outcomes: [{
          result: 'A bill creates a payments regulator with its own board. The central bank sits on it. The rail stays independent and becomes accountable.',
          fx: [['nation.integrity', 2], ['nation.capacity', 1], ['bloc.establishment', 3], ['nation.jobs', 1]],
          news: ['BILL CREATES INDEPENDENT PAYMENTS REGULATOR', 'NEW REGULATOR FOR PAYMENT RAIL. CBN GET ONE SEAT'],
          archive: 'Created an independent regulator for the regional payment rail.', sig: 2,
        }],
      },
      {
        id: 'cbn', label: 'Give it to the central bank',
        outcomes: [{
          result: 'The central bank takes it over. Transfers slow down; two of the seven countries start looking at a rival system run from Accra.',
          fx: [['bloc.establishment', 2], ['nation.jobs', -2], ['bonus.fiscal', -0.005]],
          news: ['CENTRAL BANK TAKES CONTROL OF REGIONAL PAYMENT RAIL', 'CBN DON COLLECT THE PAYMENT RAIL'],
          archive: 'Handed the regional payment rail to the central bank.', sig: 2,
        }],
      },
      {
        id: 'sell', label: 'Let Mrs Adetoro\'s bank buy in',
        outcomes: [{
          result: 'The bank takes a quarter of the company. Mrs Adetoro is delighted. The other banks in the region are not, and say so to their governments.',
          fx: [['tycoon.ty_bank', 10], ['bloc.establishment', -2], ['nation.integrity', -1]],
          news: ['ADETORO BANK BUYS STAKE IN PAYMENT RAIL', 'BIG BANK DON ENTER PAYMENT RAIL'],
          archive: 'Let Mrs Adetoro\'s bank buy into the regional payment rail.', sig: 2,
        }],
      },
    ],
  },
  {
    id: 'success.census', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, reactive: true, topic: 'politics',
    when: won('census'), weight: 16,
    office: 'Office of the Attorney General', stamp: 'URGENT',
    title: 'Six states have taken the census to court',
    body: [
      'The six states the census found to be smaller than they had claimed have filed suit in the Supreme Court. Their allocations under the new revenue formula fall from next month.',
      'Their governors say the count missed their people. The count\'s biometric records say otherwise, and are public.',
    ],
    reads: [
      { role: 'sap', good: 'Lose this, {SIR}, and no government will count again for thirty years. Win it too hard and six governors are your enemies to the end.', weak: 'Give them back their numbers, {SIR}. It is only arithmetic.' },
    ],
    choices: [
      {
        id: 'defend', label: 'Defend the count in court, with the records', pc: 5,
        outcomes: [{
          result: 'The records are put before the court one ward at a time. The suits are dismissed. The six governors say they will remember it, and do.',
          fx: [['nation.integrity', 2], ['nation.capacity', 1], ['bloc.party', -4], ['bloc.press', 3]],
          ops: [['governors', -3]],
          news: ['SUPREME COURT UPHOLDS CENSUS; SIX STATES LOSE SUIT', 'COURT SAY THE COUNT STAND'],
          archive: 'Defended the census in the Supreme Court and won.', sig: 3,
        }],
      },
      {
        id: 'phase', label: 'Phase the new formula in over four years',
        outcomes: [{
          result: 'The suits are withdrawn in exchange for a four-year transition. The count stands; the money moves slowly.',
          fx: [['bloc.party', 3], ['nation.integrity', -0.5]],
          ops: [['governors', 2]],
          news: ['CENSUS SUITS WITHDRAWN AFTER FOUR-YEAR PHASE-IN AGREED', 'DEM DON SETTLE CENSUS CASE. MONEY GO MOVE SMALL SMALL'],
          archive: 'Settled the census suits with a four-year phase-in.', sig: 2,
        }],
      },
      {
        id: 'recount', label: 'Order a recount in the six states', naira: 0.1,
        outcomes: [{
          result: 'The recount finds what the count found, a year later and at a cost. Every state not in the six asks for one too.',
          fx: [['nation.capacity', -1], ['bloc.establishment', -2], ['bloc.party', 2]],
          news: ['FG ORDERS RECOUNT IN SIX DISPUTED STATES', 'DEM GO COUNT AGAIN'],
          archive: 'Ordered a census recount in six states.', sig: 1,
        }],
      },
    ],
  },
  {
    id: 'success.charter', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 3, reactive: true, topic: 'reform',
    when: won('charter'), weight: 14,
    office: 'Office of the Attorney General', stamp: 'CONFIDENTIAL',
    title: 'The charter city\'s court has ruled against a federal agency',
    body: [
      'The commercial court in the charter zone has ruled that a federal revenue agency cannot levy a charge the zone\'s charter exempts. The agency has asked you to set the ruling aside.',
      'Forty firms signed leases because the zone\'s rules would hold against the government. This is the first time they have had to.',
    ],
    reads: [
      { role: 'sap', good: 'Overrule it once, {SIR}, and the charter is a brochure.', weak: 'Nobody overrules the federal government, {SIR}.' },
      { role: 'fin', good: 'The charge is small. The precedent is not.' },
    ],
    choices: [
      {
        id: 'obey', label: 'The ruling stands',
        outcomes: [{
          result: 'The agency withdraws the charge. Six more firms sign leases in the month the ruling is reported abroad.',
          fx: [['nation.integrity', 3], ['bloc.establishment', 5], ['nation.jobs', 2], ['bloc.villa', -2]],
          news: ['FG ACCEPTS CHARTER COURT RULING AGAINST REVENUE AGENCY', 'GOVERNMENT LOSE CASE, ACCEPT AM. NA NEW THING'],
          archive: 'Accepted the charter city court\'s ruling against a federal agency.', sig: 3,
        }],
      },
      {
        id: 'override', label: 'Set the ruling aside by executive order',
        outcomes: [{
          result: 'The order is issued. The charge is collected. Three firms announce they are reviewing their leases, and one leaves.',
          fx: [['nation.integrity', -3], ['bloc.establishment', -8], ['nation.jobs', -2], ['bonus.fiscal', 0.003]],
          flags: { 'charter.overridden': true },
          news: ['PRESIDENT OVERRIDES CHARTER CITY COURT', 'THE CHARTER NA PAPER. GOVERNMENT DON SHOW'],
          archive: 'Overrode the charter city\'s court by executive order.', sig: 3,
        }],
      },
      {
        id: 'appeal', label: 'Appeal it to the Supreme Court', pc: 3,
        outcomes: [{
          result: 'The appeal is filed. The firms in the zone wait to see what the charter is worth. Some of them wait elsewhere.',
          fx: [['bloc.establishment', -2]],
          news: ['FG APPEALS CHARTER CITY RULING', 'GOVERNMENT CARRY CHARTER CASE GO SUPREME COURT'],
          archive: 'Appealed the charter city court\'s ruling.', sig: 1,
        }],
      },
    ],
  },
  {
    id: 'success.hospital', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 2, reactive: true, topic: 'people',
    when: won('hospital'), weight: 14,
    office: 'Office of the Chief of Staff', stamp: 'CONFIDENTIAL',
    title: 'Officials are still flying abroad for treatment',
    body: [
      'The hospital city is open and its waiting list is three weeks. In the same quarter, forty-one senior officials had treatment abroad at public expense, eleven of them for procedures the hospital city performs.',
      '{STREET} has printed the list.',
    ],
    reads: [
      { role: 'sap', good: 'Ban it and you lose friends who are ill, {SIR}. Do not and the hospital is a monument to what you say.' },
    ],
    choices: [
      {
        id: 'ban', label: 'No public money for treatment abroad that the hospital city provides', pc: 5,
        outcomes: [{
          result: 'The circular is issued and published. Two ministers rebook in Abuja. One discovers that the condition no longer requires treatment.',
          fx: [['nation.integrity', 2], ['bloc.street', 5], ['bloc.villa', -3], ['bloc.party', -3], ['bonus.fiscal', 0.004]],
          news: ['FG BANS OVERSEAS TREATMENT FOR OFFICIALS WHERE CARE IS AVAILABLE AT HOME', 'NO MORE LONDON HOSPITAL WITH OUR MONEY'],
          archive: 'Ended public funding of overseas treatment that the hospital city provides.', sig: 3,
        }],
      },
      {
        id: 'example', label: 'Have your own check-up there, publicly, and say nothing else',
        outcomes: [{
          result: 'You are photographed in the waiting room, then in the scanner. Bookings by officials rise. The list in {STREET} does not get shorter.',
          fx: [['approval', 2], ['bloc.press', 2]],
          news: ['PRESIDENT HAS CHECK-UP AT HOSPITAL CITY', 'PRESIDENT DON GO OUR OWN HOSPITAL'],
          archive: 'Had a public check-up at the hospital city.', sig: 1,
        }],
      },
      {
        id: 'leave', label: 'Leave it: officials\' health is a private matter',
        outcomes: [{
          result: 'Nothing changes. {STREET} prints the next quarter\'s list.',
          fx: [['bloc.street', -3], ['bloc.press', -2]],
          quiet: 'Nothing is announced; the list itself is the news.', archive: 'Left officials\' overseas treatment alone.',
        }],
      },
    ],
  },
];
