import type { Cond, Fx } from '../engine/types';

// BIG BETS
// Bold, risky initiatives. Each has odds, shown to the player, that improve
// with a capable and honest state. Win or lose, the result is permanent.

export interface Venture {
  id: string;
  name: string;
  blurb: string;
  pc: number;
  naira: number;
  months: number;
  /** Base chance of success, before the state's capacity and integrity are counted. */
  odds: number;
  when?: Cond;
  start?: Fx[];
  win: Fx[];
  lose: Fx[];
  winText: string;
  loseText: string;
  winNews: [string, string];
  loseNews: [string, string];
}

export const VENTURES: Venture[] = [
  {
    id: 'steel', name: 'Revive the steel complex', pc: 6, naira: 1.2, months: 18, odds: 0.4,
    blurb: 'It has consumed money for forty years and produced almost no steel. Everyone who has tried has failed. If it works, it is an industrial base.',
    win: [['nation.jobs', 12], ['bonus.jobs', 0.06], ['bonus.fiscal', 0.03], ['approval', 4]],
    lose: [['nation.integrity', -3], ['bloc.press', -6], ['approval', -2]],
    winText: 'The blast furnace is lit. The first billet is rolled on live television. A generation of engineers who were told it could never happen is asked to stay on.',
    loseText: 'The plant is declared "98% complete" and stays that way. The money is spent. The grass around the rolling mill is very well cut.',
    winNews: ['STEEL COMPLEX PRODUCES FIRST STEEL IN FORTY YEARS', 'THE STEEL DON COMMOT! AFTER 40 YEARS'],
    loseNews: ['STEEL COMPLEX REVIVAL STALLS AFTER ₦2TN', 'STEEL COMPANY DON CHOP ANOTHER ₦2TN. NO STEEL'],
  },
  {
    id: 'charter', name: 'A charter city on the coast', pc: 10, naira: 0.8, months: 14, odds: 0.5,
    blurb: 'A free zone with its own port, courts and power. Investors get rules that hold. Critics will call it a country within a country.',
    start: [['bloc.party', -3]],
    win: [['nation.jobs', 10], ['bonus.fiscal', 0.03], ['bonus.jobs', 0.05], ['bloc.establishment', 6]],
    lose: [['bloc.establishment', -5], ['nation.integrity', -2], ['bloc.press', -3]],
    winText: 'Forty firms sign leases in the first year. A court in the zone decides a commercial dispute in eleven days, which makes the national news.',
    loseText: 'The land is allocated, re-allocated, and litigated. The zone has a gate, a signboard and a governing council of twenty-two.',
    winNews: ['CHARTER CITY DRAWS $6BN IN FIRST-YEAR INVESTMENT', 'NEW CITY DON START. NA LIKE DUBAI SMALL'],
    loseNews: ['CHARTER CITY MIRED IN LAND DISPUTES', 'THE "NEW DUBAI" NA SIGNBOARD AND BUSH'],
  },
  {
    id: 'crypto', name: 'Make Lagos Africa\'s crypto capital', pc: 8, naira: 0.1, months: 8, odds: 0.45,
    blurb: 'Licence the exchanges, tax the gains, court the founders. The central bank thinks this is how you lose a currency.',
    start: [['bloc.establishment', -4], ['bloc.street', 4]],
    win: [['nation.jobs', 5], ['nation.fiscalSpace', 0.6], ['bonus.fiscal', 0.02], ['bloc.street', 5]],
    lose: [['bloc.establishment', -6], ['nation.inflation', 2], ['pressure.scandalHeat', 10], ['bloc.street', -6]],
    winText: 'Nine exchanges are licensed. The tax office collects from an industry it could not previously find.',
    loseText: 'The largest licensed exchange halts withdrawals on a Sunday. Two million people had money in it. Its founder is believed to be in a country without an extradition treaty.',
    winNews: ['LAGOS OVERTAKES NAIROBI AS CRYPTO HUB', 'CRYPTO BOYS DON GET LICENCE. DEM DEY PAY TAX'],
    loseNews: ['LICENSED CRYPTO EXCHANGE COLLAPSES; TWO MILLION AFFECTED', 'THE EXCHANGE DON RUN. OUR MONEY DON GO'],
  },
  {
    id: 'cannabis', name: 'Licence cannabis for export', pc: 12, naira: 0.1, months: 10, odds: 0.6,
    blurb: 'Medicinal and industrial, export only, heavily taxed. It already grows here. The clerics and half your cabinet will be appalled.',
    start: [['bloc.establishment', -5], ['bloc.party', -4], ['bloc.press', 2]],
    win: [['nation.jobs', 5], ['bonus.fiscal', 0.03], ['zone.SW.approval', 3], ['zone.SS.approval', 3]],
    lose: [['nation.integrity', -3], ['approval', -2], ['bloc.establishment', -3]],
    winText: 'Twelve licensed estates ship to four countries. Excise receipts exceed the entire solid minerals sector. The clerics are still appalled.',
    loseText: 'Forty licences are issued. Thirty-one go to companies registered the same week. Nothing is exported; a great deal is diverted.',
    winNews: ['CANNABIS EXPORTS EARN $900M IN FIRST YEAR', 'WEED DON TURN TO FOREIGN EXCHANGE'],
    loseNews: ['CANNABIS LICENCES WENT TO SHELL COMPANIES — AUDIT', 'DEM SHARE THE LICENCE AMONG THEMSELVES'],
  },
  {
    id: 'lithium', name: 'No lithium leaves unprocessed', pc: 8, naira: 0.3, months: 14, odds: 0.5,
    blurb: 'Ban raw exports and require processing here. Either a battery industry, or the miners sell through a neighbour.',
    win: [['nation.jobs', 8], ['bonus.fiscal', 0.03], ['bonus.jobs', 0.04]],
    lose: [['bloc.establishment', -5], ['nation.fiscalSpace', -0.2], ['nation.security', -2]],
    winText: 'Two processing plants open in Nasarawa. A battery maker announces a third. The ban is copied by two neighbours.',
    loseText: 'Official lithium exports fall to zero. Unofficial ones, across the border by lorry at night, do not.',
    winNews: ['FIRST LITHIUM PROCESSING PLANTS OPEN', 'WE DEY MAKE BATTERY THING FOR NASARAWA NOW'],
    loseNews: ['LITHIUM SMUGGLING SOARS AFTER EXPORT BAN', 'DEM DEY CARRY THE LITHIUM PASS BORDER FOR NIGHT'],
  },
  {
    id: 'creative', name: 'An export fund for music and film', pc: 0, naira: 0.2, months: 8, odds: 0.7,
    blurb: 'The country\'s best-known exports got there with no help at all. Touring infrastructure, royalties collection, studios.',
    win: [['nation.jobs', 5], ['bloc.street', 6], ['approval', 2], ['bonus.jobs', 0.03]],
    lose: [['nation.integrity', -2], ['bloc.street', -3], ['bloc.press', -2]],
    winText: 'Royalties collected abroad triple. Three arenas open. The artists thank nobody in government, which is the correct outcome.',
    loseText: 'The fund is disbursed to "creative consultants". No artist anyone has heard of received anything. Several say so, in songs.',
    winNews: ['CREATIVE EXPORTS PASS $2BN', 'AFROBEATS MONEY DEY ENTER NAIJA NOW'],
    loseNews: ['ARTISTS SAY CREATIVE FUND WENT TO CRONIES', 'THE ARTIST DON SING ABOUT THE FUND WEY E NO SEE'],
  },
  {
    id: 'rail', name: 'High-speed rail, Lagos to Kano, on a foreign loan', pc: 6, naira: 0.5, months: 20, odds: 0.5,
    blurb: 'A $9bn loan. The largest project since independence. It will carry your name for a century, or your successor will cancel it at kilometre 140.',
    start: [['nation.debt', 6], ['approval', 2]],
    win: [['nation.jobs', 9], ['approval', 5], ['bonus.jobs', 0.05], ['zone.NW.approval', 4], ['zone.SW.approval', 4]],
    lose: [['nation.debt', 4], ['bloc.press', -5], ['approval', -3]],
    winText: 'The first train runs Lagos to Kano in five hours. The fare is affordable. People who have never seen the other half of the country go and look at it.',
    loseText: 'The line reaches Ilorin and stops. The loan does not stop. The stations beyond it are finished, staffed, and have no track.',
    winNews: ['LAGOS–KANO IN FIVE HOURS AS RAIL LINE OPENS', 'TRAIN FROM LAGOS REACH KANO BEFORE NIGHT!'],
    loseNews: ['RAIL LINE STALLS AT ILORIN; LOAN REPAYMENTS BEGIN', 'TRAIN STATION DEY, RAIL NO DEY'],
  },
  {
    id: 'cng', name: 'Convert a million vehicles to gas', pc: 0, naira: 0.6, months: 12, odds: 0.55,
    blurb: 'The country burns its gas and imports its petrol. Conversion kits and filling stations. It answers the pump price for good, if the stations get built.',
    win: [['bonus.inflation', -1.5], ['bloc.street', 5], ['nation.jobs', 3], ['approval', 2]],
    lose: [['approval', -2], ['bloc.press', -3]],
    winText: 'Commercial buses convert first. Fares fall by a third on the gas routes, and the transport unions, for once, issue a statement of thanks.',
    loseText: '160,000 vehicles are converted. There are 40 filling stations. The queues for gas are now longer than the ones for petrol were.',
    winNews: ['BUS FARES FALL AS ONE MILLION VEHICLES SWITCH TO GAS', 'TRANSPORT DON CHEAP FOR GAS BUS'],
    loseNews: ['GAS-CONVERTED VEHICLES STRANDED FOR LACK OF STATIONS', 'I CONVERT MY MOTOR. WHERE I GO BUY THE GAS?'],
  },
  {
    id: 'ipo', name: 'List the national oil company', pc: 16, naira: 0, months: 10, odds: 0.5,
    blurb: 'Sell 40% on the stock exchange. Shareholders would demand the accounts every quarter. Everyone who lives off the opacity will fight it.',
    start: [['bloc.party', -6], ['bloc.establishment', -4]],
    win: [['nation.fiscalSpace', 2.5], ['nation.integrity', 5], ['bonus.fiscal', 0.04], ['bloc.establishment', 6]],
    lose: [['pc', -8], ['bloc.party', -4], ['bloc.press', -3]],
    winText: 'The offer is three times subscribed. Eight million Nigerians now own shares in the company that was, on paper, always theirs.',
    loseText: 'The Assembly passes a resolution "in defence of the national patrimony". The listing is suspended. The company remains owned by everyone and answerable to no one.',
    winNews: ['OIL COMPANY LISTS; EIGHT MILLION NIGERIANS BUY SHARES', 'YOU FIT BUY SHARE FOR OIL COMPANY NOW'],
    loseNews: ['NATIONAL ASSEMBLY BLOCKS OIL COMPANY LISTING', 'SENATORS NO GREE MAKE WE BUY THE SHARE'],
  },
  {
    id: 'diaspora', name: 'Diaspora bond and the diaspora vote', pc: 8, naira: 0, months: 6, odds: 0.65,
    blurb: 'Seventeen million Nigerians abroad send home more than oil earns. Let them invest, and let them vote. Politicians distrust voters they cannot reach.',
    start: [['bloc.party', -3]],
    win: [['nation.fiscalSpace', 1.2], ['bloc.establishment', 3], ['bloc.street', 3], ['bonus.fiscal', 0.01]],
    lose: [['bloc.press', -3], ['pc', -4]],
    winText: 'The bond raises $2.4bn in six weeks. Polling units open in eleven cities abroad.',
    loseText: 'The bond is undersubscribed. The voting bill is referred to a committee, which has asked for a study tour of eleven cities abroad.',
    winNews: ['DIASPORA BOND RAISES $2.4BN', 'ABROAD PEOPLE DON SEND MONEY COME'],
    loseNews: ['DIASPORA BOND FALLS SHORT; VOTING BILL STALLS', 'DIASPORA NO TRUST GOVERNMENT WITH THEIR DOLLAR'],
  },
  {
    id: 'export_power', name: 'Sell electricity to the neighbours', pc: 4, naira: 0.3, months: 10, odds: 0.65,
    when: { v: ['agenda.p4', '==', 1] },
    blurb: 'With a working market you have a surplus at night. Four neighbouring countries are running on diesel.',
    win: [['bonus.fiscal', 0.03], ['nation.jobs', 3], ['bloc.establishment', 4]],
    lose: [['approval', -2], ['bloc.press', -3]],
    winText: 'Power flows across three borders. It is the first thing the country has exported in a decade that is not dug out of the ground.',
    loseText: 'The neighbours sign, receive the power, and do not pay. The arrears are now a diplomatic matter.',
    winNews: ['NIGERIA BECOMES NET POWER EXPORTER', 'WE DEY SELL LIGHT TO OTHER COUNTRY NOW'],
    loseNews: ['NEIGHBOURS OWE $400M FOR EXPORTED POWER', 'DEM COLLECT OUR LIGHT, NO PAY'],
  },
  {
    id: 'nuclear', name: 'A nuclear power station with a foreign partner', pc: 10, naira: 1.5, months: 20, odds: 0.4,
    when: { v: ['nation.capacity', '>=', 52] },
    blurb: 'Only a state that can run things should try this. Yours might now be one.',
    start: [['nation.debt', 4]],
    win: [['nation.power', 15], ['bonus.power', 0.08], ['nation.jobs', 4], ['approval', 3]],
    lose: [['nation.debt', 5], ['bloc.press', -5], ['approval', -2]],
    winText: 'The first reactor reaches criticality on schedule, which nobody on either side of the contract expected.',
    loseText: 'The site is cleared, fenced and guarded. The partner has asked for the second payment before pouring any concrete.',
    winNews: ['FIRST NUCLEAR REACTOR JOINS THE GRID', 'NUCLEAR LIGHT DON START. WE NO BELIEVE AM'],
    loseNews: ['NUCLEAR PLANT STALLS AFTER $2BN', 'NUCLEAR PROJECT: NA ONLY FENCE DEM BUILD'],
  },
  {
    id: 'amnesty', name: 'Amnesty and buy-back for the armed groups', pc: 10, naira: 0.4, months: 8, odds: 0.5,
    when: { v: ['nation.security', '<', 42] },
    blurb: 'Pay them to stop. It worked once, in the creeks, for a while. It will be called rewarding murder, and that will not be wrong.',
    start: [['bloc.press', -4], ['bloc.street', -3]],
    win: [['nation.security', 12], ['zone.NW.approval', 4], ['zone.NC.approval', 4], ['bonus.fiscal', -0.015]],
    lose: [['nation.security', -5], ['nation.integrity', -3], ['approval', -3]],
    winText: 'Eleven thousand men hand in weapons. The roads reopen. The stipends are now a permanent line in the budget, and everyone knows what happens if it is cut.',
    loseText: 'The weapons handed in are old. The money buys new ones. Three groups that had not existed before the amnesty apply for it.',
    winNews: ['11,000 GUNMEN SURRENDER UNDER AMNESTY', 'BANDITS DON DROP GUN. ROAD DON OPEN'],
    loseNews: ['AMNESTY CASH "FUNDED NEW WEAPONS" — REPORT', 'DEM COLLECT AMNESTY MONEY, BUY NEW GUN'],
  },
  {
    id: 'swap', name: 'A debt-for-development swap', pc: 6, naira: 0, months: 8, odds: 0.55,
    when: { v: ['nation.debt', '>', 82] },
    blurb: 'Creditors write off a share in exchange for audited spending on health and climate. They will want to see the accounts. All of them.',
    win: [['nation.debt', -12], ['bloc.establishment', 5], ['nation.integrity', 2]],
    lose: [['bloc.establishment', -4], ['pc', -4]],
    winText: 'Six creditors agree. The auditors they send are thorough, polite, and here for five years.',
    loseText: 'The creditors ask for three years of audited accounts. The Accountant-General asks for more time.',
    winNews: ['CREDITORS WRITE OFF $7BN IN DEBT SWAP', 'DEM DON FORGIVE US SOME DEBT'],
    loseNews: ['DEBT SWAP TALKS COLLAPSE OVER ACCOUNTS', 'CREDITORS SAY: SHOW US YOUR BOOK FIRST'],
  },
  {
    id: 'steel_sale', name: 'Sell the steel complex for one naira', pc: 8, naira: 0, months: 8, odds: 0.7,
    when: { v: ['venture.steel', '==', -1] },
    blurb: 'You tried to revive it and failed, like everyone before you. Give it to whoever will run it and stop paying its wage bill.',
    start: [['bloc.party', -4]],
    win: [['nation.jobs', 8], ['bonus.fiscal', 0.02], ['bonus.jobs', 0.04]],
    lose: [['bloc.press', -3], ['nation.integrity', -2]],
    winText: 'A buyer takes it for one naira and a performance bond. It produces steel within the year. The lesson is uncomfortable.',
    loseText: 'It is sold to a company that strips the scrap and leaves. The one naira is still in escrow.',
    winNews: ['PRIVATISED STEEL COMPLEX ROLLS FIRST STEEL', 'THE STEEL COMPANY DON WORK, AFTER DEM SELL AM ₦1'],
    loseNews: ['STEEL COMPLEX BUYER STRIPS PLANT FOR SCRAP', 'DEM BUY THE STEEL COMPANY, SELL AM AS CONDEMN IRON'],
  },
  {
    id: 'constitution', name: 'A new constitution, by referendum', pc: 20, naira: 0.2, months: 14, odds: 0.35,
    when: { term: 2 },
    blurb: 'The second-term gamble. A people\'s constitution to replace the one the soldiers left. Everyone agrees it is needed and nobody agrees on a single clause.',
    start: [['bloc.party', -6]],
    win: [['nation.integrity', 8], ['nation.capacity', 6], ['bonus.fiscal', 0.03], ['bloc.street', 8], ['approval', 5]],
    lose: [['pc', -10], ['bloc.party', -8], ['approval', -3]],
    winText: 'The referendum passes in thirty states. It is the first constitution in the country\'s history that anybody voted for.',
    loseText: 'The conference sits for eleven months and produces 600 recommendations. The Assembly notes them.',
    winNews: ['NIGERIANS ADOPT NEW CONSTITUTION BY REFERENDUM', 'WE THE PEOPLE: NEW CONSTITUTION DON LAND'],
    loseNews: ['CONSTITUTIONAL CONFERENCE ENDS WITHOUT AGREEMENT', '600 RECOMMENDATIONS. ZERO CONSTITUTION'],
  },
  {
    id: 'games', name: 'Host the continental games', pc: 4, naira: 0.7, months: 14, odds: 0.55,
    when: { term: 2 },
    blurb: 'Stadiums, roads, and three weeks when the world looks. Either a monument or the most expensive embarrassment of your presidency.',
    win: [['approval', 5], ['nation.jobs', 4], ['bloc.street', 5], ['bonus.jobs', 0.02]],
    lose: [['nation.debt', 3], ['bloc.press', -5], ['approval', -3]],
    winText: 'The games open on time, in finished stadiums, under working floodlights. People who expected to be embarrassed are briefly, fiercely proud.',
    loseText: 'The athletes\' village has no water. The opening ceremony is held by generator. The clip of the scoreboard goes around the world.',
    winNews: ['NIGERIA HOSTS FLAWLESS CONTINENTAL GAMES', 'WE HOST AM AND WE NO FALL HAND'],
    loseNews: ['GAMES OPEN IN UNFINISHED STADIUMS', 'ATHLETE DEM DEY BATH WITH SACHET WATER'],
  },
];

export const VENTURE_BY_ID = Object.fromEntries(VENTURES.map((v) => [v.id, v]));
