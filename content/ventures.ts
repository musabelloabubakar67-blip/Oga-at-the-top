import type { Cond, Fx } from '../engine/types';

// BIG BETS
// Bold, risky initiatives. A bet does not fail by dice alone: each names the
// things that must be true for it to work. Those are shown before the bet is
// taken, watched while it runs, and judged on the day it opens. When a bet
// fails, the record says which condition failed and what would have saved it.
//
// Most bets are opened by a reform. Deliver the reform and the bet it makes
// possible appears. A few can be attempted without the groundwork, at odds
// that say what the groundwork was for.

export interface Risk {
  id: string;
  /** What must be true, as the player reads it. */
  label: string;
  ok: Cond;
  /** How much of the chance of success is lost if this is not true. */
  cost: number;
  /** Shown part-way through, while there is still time. */
  warn: string;
  /** The post-mortem, if this is what killed it. */
  fail: string;
  /** What the President could do about it. */
  fix: string;
}

export interface Venture {
  id: string;
  name: string;
  blurb: string;
  pc: number;
  naira: number;
  months: number;
  /** Chance of success with every condition met. What remains is luck. */
  top: number;
  risks: Risk[];
  /** The minister in whose brief it sits. */
  brief?: string;
  /** Building work: can be paid from the Infrastructure Fund. */
  infra?: boolean;
  /** A businessman who will co-finance it if he is with you. */
  partner?: string;
  /** Appears when this is true. */
  when?: Cond;
  /** The reform that opens it, for display. */
  opened?: string;
  start?: Fx[];
  win: Fx[];
  lose: Fx[];
  winText: string;
  loseText: string;
  /** What went wrong when nothing the President did was to blame. */
  luck: string;
  winNews: [string, string];
  loseNews: [string, string];
}

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });
const done = (id: string): Cond => v(`agenda.${id}`, '==', 1);

// ---- conditions that recur

const contractors = (cost = 0.2): Risk => ({
  id: 'contractors', label: 'Contractors are being paid (arrears under ₦500bn)', ok: v('debt.contractors', '<=', 0.5), cost,
  warn: 'The firms on site are still owed for earlier work and have slowed to a walk.',
  fail: 'The contractors walked off. They were owed for the last job and saw no reason to finish this one.',
  fix: 'Pay the contractor arrears down below ₦500bn (The Treasury).',
});
const minister = (id: string, title: string, cost = 0.18): Risk => ({
  id: 'minister', label: `A capable ${title} (competence 4 or better)`, ok: v(`comp.${id}`, '>=', 4), cost,
  warn: `The ${title} has not visited the site and cannot say what stage it is at.`,
  fail: `Nobody was in charge. The ${title} signed what was put in front of him and learned of the collapse from the newspapers.`,
  fix: `Replace the ${title} with a technocrat (Politics, Your ministers).`,
});
const power = (n: number, cost = 0.2): Risk => ({
  id: 'power', label: `Reliable electricity (Power at ${n} or better)`, ok: v('nation.power', '>=', n), cost,
  warn: 'The site is running on diesel, and the diesel budget ran out in the second month.',
  fail: 'There was no electricity to run it. It was built for a grid the country does not have.',
  fix: `Raise Power to ${n}: the power reforms, or more for power in the budget.`,
});
const integrity = (n: number, cost = 0.2): Risk => ({
  id: 'integrity', label: `An honest enough state (Integrity at ${n} or better)`, ok: v('nation.integrity', '>=', n), cost,
  warn: 'Auditors report that a third of the money has gone to firms registered this year.',
  fail: 'It was eaten. The money went to companies registered the week it was announced.',
  fix: `Raise Integrity to ${n}: the Clean Government reforms, or an audit.`,
});
const capacity = (n: number, cost = 0.18): Risk => ({
  id: 'capacity', label: `A state that can run things (State capacity at ${n} or better)`, ok: v('nation.capacity', '>=', n), cost,
  warn: 'The agency in charge has not filled the posts or issued the rules.',
  fail: 'The state could not administer it. The rules were never issued and the office never staffed.',
  fix: `Raise State capacity to ${n}: the reforms in A State That Works.`,
});
const quiet = (zone: string, name: string, n: number, cost = 0.22): Risk => ({
  id: `quiet${zone}`, label: `${name} under control (threat at ${n} or lower)`, ok: v(`theatre.${zone}`, '<=', n), cost,
  warn: 'Workers have been abducted from the site twice. The insurers have withdrawn.',
  fail: 'It was not safe. After the third attack the firms pulled their people out and did not come back.',
  fix: `Bring the threat down to ${n}: concentrate the security effort there, or the security reforms.`,
});
const partner = (id: string, name: string, cost = 0.18): Risk => ({
  id: 'partner', label: `${name} is with you (60 or better) and puts money in`, ok: v(`tycoon.${id}`, '>=', 60), cost,
  warn: `${name} was expected to invest and has not. The state is carrying all of it.`,
  fail: `The state tried to run a business. ${name}, who knows how, stayed out and watched.`,
  fix: `Win ${name} round (Politics, The money).`,
});
const reform = (id: string, name: string, cost = 0.3): Risk => ({
  id: `reform.${id}`, label: `Delivered: ${name}`, ok: done(id), cost,
  warn: `It depends on "${name}", which has not been delivered.`,
  fail: `The groundwork was never laid. It depended on "${name}", which was not delivered.`,
  fix: `Deliver the reform "${name}" first.`,
});
const senate = (n: number, cost = 0.25): Risk => ({
  id: 'senate', label: `The Senate is with you (${n} or better)`, ok: v('senate', '>=', n), cost,
  warn: 'The Senate leadership has let it be known that it has "concerns".',
  fail: 'The Senate killed it. Your own senators did not turn up for the vote.',
  fix: 'Win over your senators (Politics), call in a favour, or give the Assembly its projects in the budget.',
});
const lenders = (n: number, cost = 0.2): Risk => ({
  id: 'lenders', label: `Lenders trust you (debt service under ${n}%)`, ok: v('nation.debt', '<', n), cost,
  warn: 'The lenders have asked for new guarantees before releasing the next tranche.',
  fail: 'The financing collapsed. The lenders looked at the debt and stopped the tranches.',
  fix: `Bring debt service under ${n}% of revenue (The Treasury).`,
});

export const VENTURES: Venture[] = [
  // ---------------------------------------------------------------- open from the start
  {
    id: 'steel', name: 'Revive the steel complex', pc: 6, naira: 1.2, months: 18, top: 0.85, brief: 'min_works', infra: true, partner: 'ty_maker',
    blurb: 'It has consumed money for forty years and produced almost no steel. Everyone who has tried has failed, and for the same four reasons.',
    risks: [power(48, 0.25), contractors(0.18), minister('min_works', 'Minister of Works', 0.15), partner('ty_maker', 'Birniwa', 0.15)],
    win: [['nation.jobs', 12], ['bonus.jobs', 0.06], ['bonus.fiscal', 0.03], ['approval', 4]],
    lose: [['nation.integrity', -3], ['bloc.press', -6], ['approval', -2]],
    winText: 'The blast furnace is lit. The first billet is rolled on live television. A generation of engineers who were told it could never happen is asked to stay on.',
    loseText: 'The plant is declared "98% complete" and stays that way. The money is spent. The grass around the rolling mill is very well cut.',
    luck: 'The foreign technical partner went into liquidation four months before commissioning and took the drawings with it.',
    winNews: ['STEEL COMPLEX PRODUCES FIRST STEEL IN FORTY YEARS', 'THE STEEL DON COMMOT! AFTER 40 YEARS'],
    loseNews: ['STEEL COMPLEX REVIVAL STALLS AFTER ₦2TN', 'STEEL COMPANY DON CHOP ANOTHER ₦2TN. NO STEEL'],
  },
  {
    id: 'charter', name: 'A charter city on the coast', pc: 10, naira: 0.8, months: 14, top: 0.85, brief: 'min_works', infra: true,
    blurb: 'A free zone with its own port, courts and power. Investors get rules that hold. Critics will call it a country within a country.',
    risks: [reform('i1', 'Forty-eight-hour ports', 0.25), integrity(36, 0.2), quiet('SW', 'The South West', 50, 0.15)],
    start: [['bloc.party', -3]],
    win: [['nation.jobs', 10], ['bonus.fiscal', 0.03], ['bonus.jobs', 0.05], ['bloc.establishment', 6]],
    lose: [['bloc.establishment', -5], ['nation.integrity', -2], ['bloc.press', -3]],
    winText: 'Forty firms sign leases in the first year. A court in the zone decides a commercial dispute in eleven days, which makes the national news.',
    loseText: 'The land is allocated, re-allocated, and litigated. The zone has a gate, a signboard and a governing council of twenty-two.',
    luck: 'A global shipping slump emptied the order books of the three anchor tenants in the same quarter.',
    winNews: ['CHARTER CITY DRAWS $6BN IN FIRST-YEAR INVESTMENT', 'NEW CITY DON START. NA LIKE DUBAI SMALL'],
    loseNews: ['CHARTER CITY MIRED IN LAND DISPUTES', 'THE "NEW DUBAI" NA SIGNBOARD AND BUSH'],
  },
  {
    id: 'crypto', name: 'Make Lagos Africa\'s crypto capital', pc: 8, naira: 0.1, months: 8, top: 0.8, brief: 'min_service', partner: 'ty_bank',
    blurb: 'Licence the exchanges, tax the gains, court the founders. The central bank thinks this is how you lose a currency.',
    risks: [capacity(42, 0.2), integrity(34, 0.2), partner('ty_bank', 'Adetoro', 0.15)],
    start: [['bloc.establishment', -4], ['bloc.street', 4]],
    win: [['nation.jobs', 5], ['nation.fiscalSpace', 0.6], ['bonus.fiscal', 0.02], ['bloc.street', 5]],
    lose: [['bloc.establishment', -6], ['nation.inflation', 2], ['pressure.scandalHeat', 10], ['bloc.street', -6]],
    winText: 'Nine exchanges are licensed. The tax office collects from an industry it could not previously find.',
    loseText: 'The largest licensed exchange halts withdrawals on a Sunday. Two million people had money in it. Its founder is believed to be in a country without an extradition treaty.',
    luck: 'The global market fell by two thirds in a fortnight and took the largest local exchange with it.',
    winNews: ['LAGOS OVERTAKES NAIROBI AS CRYPTO HUB', 'CRYPTO BOYS DON GET LICENCE. DEM DEY PAY TAX'],
    loseNews: ['LICENSED CRYPTO EXCHANGE COLLAPSES; TWO MILLION AFFECTED', 'THE EXCHANGE DON RUN. OUR MONEY DON GO'],
  },
  {
    id: 'cannabis', name: 'Licence cannabis for export', pc: 12, naira: 0.1, months: 10, top: 0.88, brief: 'min_agric',
    blurb: 'Medicinal and industrial, export only, heavily taxed. It already grows here. The clerics and half your cabinet will be appalled.',
    risks: [integrity(36, 0.3), minister('min_agric', 'Minister of Agriculture', 0.15)],
    start: [['bloc.establishment', -5], ['bloc.party', -4], ['bloc.press', 2]],
    win: [['nation.jobs', 5], ['bonus.fiscal', 0.03], ['zone.SW.approval', 3], ['zone.SS.approval', 3]],
    lose: [['nation.integrity', -3], ['approval', -2], ['bloc.establishment', -3]],
    winText: 'Twelve licensed estates ship to four countries. Excise receipts exceed the entire solid minerals sector. The clerics are still appalled.',
    loseText: 'Forty licences are issued. Thirty-one go to companies registered the same week. Nothing is exported; a great deal is diverted.',
    luck: 'The two largest buying countries changed their import rules in the month the first harvest was ready.',
    winNews: ['CANNABIS EXPORTS EARN $900M IN FIRST YEAR', 'WEED DON TURN TO FOREIGN EXCHANGE'],
    loseNews: ['CANNABIS LICENCES WENT TO SHELL COMPANIES — AUDIT', 'DEM SHARE THE LICENCE AMONG THEMSELVES'],
  },
  {
    id: 'lithium', name: 'No lithium leaves unprocessed', pc: 8, naira: 0.3, months: 14, top: 0.85, brief: 'min_works', partner: 'ty_maker',
    blurb: 'Ban raw exports and require processing here. Either a battery industry, or the miners sell through a neighbour.',
    risks: [quiet('NC', 'The farm belt, where the mines are', 55, 0.22), power(44, 0.18), integrity(34, 0.15)],
    win: [['nation.jobs', 8], ['bonus.fiscal', 0.03], ['bonus.jobs', 0.04]],
    lose: [['bloc.establishment', -5], ['nation.fiscalSpace', -0.2], ['theatre.NC', 3]],
    winText: 'Two processing plants open in Nasarawa. A battery maker announces a third. The ban is copied by two neighbours.',
    loseText: 'Official lithium exports fall to zero. Unofficial ones, across the border by lorry at night, do not.',
    luck: 'The world price of lithium halved the year the plants opened.',
    winNews: ['FIRST LITHIUM PROCESSING PLANTS OPEN', 'WE DEY MAKE BATTERY THING FOR NASARAWA NOW'],
    loseNews: ['LITHIUM SMUGGLING SOARS AFTER EXPORT BAN', 'DEM DEY CARRY THE LITHIUM PASS BORDER FOR NIGHT'],
  },
  {
    id: 'creative', name: 'An export fund for music and film', pc: 0, naira: 0.2, months: 8, top: 0.88, brief: 'min_service',
    blurb: 'The country\'s best-known exports got there with no help at all. Touring infrastructure, royalties collection, studios.',
    risks: [integrity(32, 0.45)],
    win: [['nation.jobs', 5], ['bloc.street', 6], ['approval', 2], ['bonus.jobs', 0.03]],
    lose: [['nation.integrity', -2], ['bloc.street', -3], ['bloc.press', -2]],
    winText: 'Royalties collected abroad triple. Three arenas open. The artists thank nobody in government, which is the correct outcome.',
    loseText: 'The fund is disbursed to "creative consultants". No artist anyone has heard of received anything. Several say so, in songs.',
    luck: 'The streaming platforms changed their royalty terms mid-year and the collection agency\'s model stopped adding up.',
    winNews: ['CREATIVE EXPORTS PASS $2BN', 'AFROBEATS MONEY DEY ENTER NAIJA NOW'],
    loseNews: ['ARTISTS SAY CREATIVE FUND WENT TO CRONIES', 'THE ARTIST DON SING ABOUT THE FUND WEY E NO SEE'],
  },
  {
    id: 'rail', name: 'High-speed rail, Lagos to Kano, on a foreign loan', pc: 6, naira: 0.5, months: 20, top: 0.85, brief: 'min_works', infra: true,
    blurb: 'A $9bn loan. The largest project since independence. It will carry your name for a century, or your successor will cancel it at kilometre 140.',
    risks: [lenders(80, 0.22), contractors(0.18), minister('min_works', 'Minister of Works', 0.15), quiet('NW', 'The North West, where the line ends', 60, 0.12)],
    start: [['debt.eurobond', 1.5], ['approval', 2]],
    win: [['nation.jobs', 9], ['approval', 5], ['bonus.jobs', 0.05], ['zone.NW.approval', 4], ['zone.SW.approval', 4]],
    lose: [['debt.eurobond', 1], ['bloc.press', -5], ['approval', -3]],
    winText: 'The first train runs Lagos to Kano in five hours. The fare is affordable. People who have never seen the other half of the country go and look at it.',
    loseText: 'The line reaches Ilorin and stops. The loan does not stop. The stations beyond it are finished, staffed, and have no track.',
    luck: 'The lender\'s own government changed, and the new one froze every overseas project it had inherited.',
    winNews: ['LAGOS–KANO IN FIVE HOURS AS RAIL LINE OPENS', 'TRAIN FROM LAGOS REACH KANO BEFORE NIGHT!'],
    loseNews: ['RAIL LINE STALLS AT ILORIN; LOAN REPAYMENTS BEGIN', 'TRAIN STATION DEY, RAIL NO DEY'],
  },
  {
    id: 'cng', name: 'Convert a million vehicles to gas', pc: 0, naira: 0.6, months: 12, top: 0.85, brief: 'min_power', partner: 'ty_fuel',
    blurb: 'The country burns its gas and imports its petrol. Conversion kits and filling stations. It answers the pump price for good, if the stations get built.',
    risks: [
      { id: 'stations', label: 'Somebody builds the filling stations: Amangala is not against you (35 or better)', ok: v('tycoon.ty_fuel', '>=', 35), cost: 0.25, warn: 'The fuel marketers, who own the forecourts, have declined to install a single gas pump.', fail: 'There were conversion kits and no filling stations. The people who own the forecourts sell petrol, and saw no reason to stop.', fix: 'Keep Amangala from turning against you, or win him round (Politics, The money).' },
      contractors(0.15), reform('p1', 'Clear the gas debt', 0.15),
    ],
    win: [['bonus.inflation', -1.5], ['bloc.street', 5], ['nation.jobs', 3], ['approval', 2]],
    lose: [['approval', -2], ['bloc.press', -3]],
    winText: 'Commercial buses convert first. Fares fall by a third on the gas routes, and the transport unions, for once, issue a statement of thanks.',
    loseText: '160,000 vehicles are converted. There are 40 filling stations. The queues for gas are now longer than the ones for petrol were.',
    luck: 'A cylinder from an unlicensed workshop exploded at a motor park, and public confidence went with it.',
    winNews: ['BUS FARES FALL AS ONE MILLION VEHICLES SWITCH TO GAS', 'TRANSPORT DON CHEAP FOR GAS BUS'],
    loseNews: ['GAS-CONVERTED VEHICLES STRANDED FOR LACK OF STATIONS', 'I CONVERT MY MOTOR. WHERE I GO BUY THE GAS?'],
  },
  {
    id: 'ipo', name: 'List the national oil company', pc: 16, naira: 0, months: 10, top: 0.85, brief: 'min_justice',
    blurb: 'Sell 40% on the stock exchange. Shareholders would demand the accounts every quarter. Everyone who lives off the opacity will fight it.',
    risks: [reform('t2', 'Make the oil company publish and remit', 0.3), senate(52, 0.25)],
    start: [['bloc.party', -6], ['bloc.establishment', -4]],
    win: [['nation.fiscalSpace', 2.5], ['nation.integrity', 5], ['bonus.fiscal', 0.04], ['bloc.establishment', 6]],
    lose: [['pc', -8], ['bloc.party', -4], ['bloc.press', -3]],
    winText: 'The offer is three times subscribed. Eight million Nigerians now own shares in the company that was, on paper, always theirs.',
    loseText: 'The Assembly passes a resolution "in defence of the national patrimony". The listing is suspended. The company remains owned by everyone and answerable to no one.',
    luck: 'World markets fell by a fifth in the week of the offer and the underwriters pulled it.',
    winNews: ['OIL COMPANY LISTS; EIGHT MILLION NIGERIANS BUY SHARES', 'YOU FIT BUY SHARE FOR OIL COMPANY NOW'],
    loseNews: ['NATIONAL ASSEMBLY BLOCKS OIL COMPANY LISTING', 'SENATORS NO GREE MAKE WE BUY THE SHARE'],
  },
  {
    id: 'diaspora', name: 'Diaspora bond and the diaspora vote', pc: 8, naira: 0, months: 6, top: 0.9,
    blurb: 'Seventeen million Nigerians abroad send home more than oil earns. Let them invest, and let them vote. Politicians distrust voters they cannot reach.',
    risks: [
      { id: 'naira', label: 'The naira is holding (inflation under 26%)', ok: v('nation.inflation', '<', 26), cost: 0.25, warn: 'Subscriptions are slow. The diaspora can read an inflation figure.', fail: 'Nobody abroad would lend in a currency losing a quarter of its value a year.', fix: 'Bring inflation under 26%.' },
      integrity(32, 0.2),
    ],
    start: [['bloc.party', -3]],
    win: [['nation.fiscalSpace', 1.2], ['bloc.establishment', 3], ['bloc.street', 3], ['bonus.fiscal', 0.01]],
    lose: [['bloc.press', -3], ['pc', -4]],
    winText: 'The bond raises $2.4bn in six weeks. Polling units open in eleven cities abroad.',
    loseText: 'The bond is undersubscribed. The voting bill is referred to a committee, which has asked for a study tour of eleven cities abroad.',
    luck: 'A rival bond from a neighbouring country opened the same week at a better rate.',
    winNews: ['DIASPORA BOND RAISES $2.4BN', 'ABROAD PEOPLE DON SEND MONEY COME'],
    loseNews: ['DIASPORA BOND FALLS SHORT; VOTING BILL STALLS', 'DIASPORA NO TRUST GOVERNMENT WITH THEIR DOLLAR'],
  },
  {
    id: 'nuclear', name: 'A nuclear power station with a foreign partner', pc: 10, naira: 1.5, months: 20, top: 0.8, brief: 'min_power', infra: true,
    blurb: 'Only a state that can run things should try this. The conditions below are the difference between a reactor and a fence.',
    risks: [capacity(52, 0.25), reform('p4', 'Electricity market law', 0.2), lenders(82, 0.15), minister('min_power', 'Minister of Power', 0.12)],
    start: [['debt.eurobond', 1]],
    win: [['nation.power', 15], ['bonus.power', 0.08], ['nation.jobs', 4], ['approval', 3]],
    lose: [['debt.eurobond', 1.2], ['bloc.press', -5], ['approval', -2]],
    winText: 'The first reactor reaches criticality on schedule, which nobody on either side of the contract expected.',
    loseText: 'The site is cleared, fenced and guarded. The partner has asked for the second payment before pouring any concrete.',
    luck: 'The partner\'s reactor design was withdrawn by its own regulator after an incident on another continent.',
    winNews: ['FIRST NUCLEAR REACTOR JOINS THE GRID', 'NUCLEAR LIGHT DON START. WE NO BELIEVE AM'],
    loseNews: ['NUCLEAR PLANT STALLS AFTER $2BN', 'NUCLEAR PROJECT: NA ONLY FENCE DEM BUILD'],
  },
  {
    id: 'amnesty', name: 'Amnesty and buy-back for the armed groups', pc: 10, naira: 0.4, months: 8, top: 0.82, brief: 'min_defence',
    when: v('nation.security', '<', 46),
    blurb: 'Pay them to stop. It worked once, in the creeks, for a while. It will be called rewarding murder, and that will not be wrong.',
    risks: [minister('min_defence', 'National Security Adviser', 0.2), integrity(30, 0.22), reform('s1', 'Pay and equip the troops', 0.15)],
    start: [['bloc.press', -4], ['bloc.street', -3]],
    win: [['nation.security', 9], ['theatre.SS', -6], ['zone.NW.approval', 4], ['zone.NC.approval', 4], ['bonus.fiscal', -0.015]],
    lose: [['nation.security', -5], ['nation.integrity', -3], ['approval', -3]],
    winText: 'Eleven thousand men hand in weapons. The roads reopen. The stipends are now a permanent line in the budget, and everyone knows what happens if it is cut.',
    loseText: 'The weapons handed in are old. The money buys new ones. Three groups that had not existed before the amnesty apply for it.',
    luck: 'A commander who had signed was killed by a rival, and his men went back to the forest to settle it.',
    winNews: ['11,000 GUNMEN SURRENDER UNDER AMNESTY', 'BANDITS DON DROP GUN. ROAD DON OPEN'],
    loseNews: ['AMNESTY CASH "FUNDED NEW WEAPONS" — REPORT', 'DEM COLLECT AMNESTY MONEY, BUY NEW GUN'],
  },
  {
    id: 'swap', name: 'A debt-for-development swap', pc: 6, naira: 0, months: 8, top: 0.85,
    when: v('nation.debt', '>', 78),
    blurb: 'Creditors write off a share in exchange for audited spending on health and climate. They will want to see the accounts. All of them.',
    risks: [integrity(38, 0.3), reform('t1', 'One tax ID, automated collection', 0.2)],
    win: [['debt.eurobond', -2.5], ['bloc.establishment', 5], ['nation.integrity', 2]],
    lose: [['bloc.establishment', -4], ['pc', -4]],
    winText: 'Six creditors agree. The auditors they send are thorough, polite, and here for five years.',
    loseText: 'The creditors ask for three years of audited accounts. The Accountant-General asks for more time.',
    luck: 'The largest creditor was itself downgraded and withdrew from every restructuring it was in.',
    winNews: ['CREDITORS WRITE OFF $7BN IN DEBT SWAP', 'DEM DON FORGIVE US SOME DEBT'],
    loseNews: ['DEBT SWAP TALKS COLLAPSE OVER ACCOUNTS', 'CREDITORS SAY: SHOW US YOUR BOOK FIRST'],
  },
  {
    id: 'steel_sale', name: 'Sell the steel complex for one naira', pc: 8, naira: 0, months: 8, top: 0.88, brief: 'min_works', partner: 'ty_maker',
    when: v('venture.steel', '==', -1),
    blurb: 'You tried to revive it and failed, like everyone before you. Give it to whoever will run it and stop paying its wage bill.',
    risks: [integrity(36, 0.3), partner('ty_maker', 'Birniwa', 0.18)],
    start: [['bloc.party', -4]],
    win: [['nation.jobs', 8], ['bonus.fiscal', 0.02], ['bonus.jobs', 0.04]],
    lose: [['bloc.press', -3], ['nation.integrity', -2]],
    winText: 'A buyer takes it for one naira and a performance bond. It produces steel within the year. The lesson is uncomfortable.',
    loseText: 'It is sold to a company that strips the scrap and leaves. The one naira is still in escrow.',
    luck: 'The buyer\'s bank failed between signing and completion.',
    winNews: ['PRIVATISED STEEL COMPLEX ROLLS FIRST STEEL', 'THE STEEL COMPANY DON WORK, AFTER DEM SELL AM ₦1'],
    loseNews: ['STEEL COMPLEX BUYER STRIPS PLANT FOR SCRAP', 'DEM BUY THE STEEL COMPANY, SELL AM AS CONDEMN IRON'],
  },
  {
    id: 'constitution', name: 'A new constitution, by referendum', pc: 20, naira: 0.2, months: 14, top: 0.8, brief: 'min_justice',
    when: { term: 2 },
    blurb: 'The second-term gamble. A people\'s constitution to replace the one the soldiers left. Everyone agrees it is needed and nobody agrees on a single clause.',
    risks: [
      senate(56, 0.25),
      { id: 'governors', label: 'Four of your six governors are with you', ok: v('govs', '>=', 4), cost: 0.22, warn: 'Three governors have told their state assemblies to "study" the draft.', fail: 'The governors killed it in the state assemblies. It needed twenty-four of them and got nineteen.', fix: 'Win over your governors (Politics), or call in what they owe.' },
      { id: 'popular', label: 'The country is listening (approval at 48% or better)', ok: v('approval', '>=', 48), cost: 0.18, warn: 'Turnout at the public hearings is thin. People have other things on their minds.', fail: 'The referendum became a vote on you, and you were not popular enough to carry it.', fix: 'Raise approval to 48%.' },
    ],
    start: [['bloc.party', -6]],
    win: [['nation.integrity', 8], ['nation.capacity', 6], ['bonus.fiscal', 0.03], ['bloc.street', 8], ['approval', 5]],
    lose: [['pc', -10], ['bloc.party', -8], ['approval', -3]],
    winText: 'The referendum passes in thirty states. It is the first constitution in the country\'s history that anybody voted for.',
    loseText: 'The conference sits for eleven months and produces 600 recommendations. The Assembly notes them.',
    luck: 'A court ruled the referendum law defective a week before the vote, on a point nobody had noticed.',
    winNews: ['NIGERIANS ADOPT NEW CONSTITUTION BY REFERENDUM', 'WE THE PEOPLE: NEW CONSTITUTION DON LAND'],
    loseNews: ['CONSTITUTIONAL CONFERENCE ENDS WITHOUT AGREEMENT', '600 RECOMMENDATIONS. ZERO CONSTITUTION'],
  },
  {
    id: 'games', name: 'Host the continental games', pc: 4, naira: 0.7, months: 14, top: 0.85, brief: 'min_works', infra: true,
    when: { term: 2 },
    blurb: 'Stadiums, roads, and three weeks when the world looks. Either a monument or the most expensive embarrassment of your presidency.',
    risks: [contractors(0.22), power(50, 0.2), minister('min_works', 'Minister of Works', 0.15)],
    win: [['approval', 5], ['nation.jobs', 4], ['bloc.street', 5], ['bonus.jobs', 0.02]],
    lose: [['nation.debt', 3], ['bloc.press', -5], ['approval', -3]],
    winText: 'The games open on time, in finished stadiums, under working floodlights. People who expected to be embarrassed are briefly, fiercely proud.',
    loseText: 'The athletes\' village has no water. The opening ceremony is held by generator. The clip of the scoreboard goes around the world.',
    luck: 'An outbreak in the region led eleven countries to withdraw in the final month.',
    winNews: ['NIGERIA HOSTS FLAWLESS CONTINENTAL GAMES', 'WE HOST AM AND WE NO FALL HAND'],
    loseNews: ['GAMES OPEN IN UNFINISHED STADIUMS', 'ATHLETE DEM DEY BATH WITH SACHET WATER'],
  },

  // ---------------------------------------------------------------- opened by reforms
  {
    id: 'export_power', name: 'Sell electricity to the neighbours', pc: 4, naira: 0.3, months: 10, top: 0.88, brief: 'min_power', infra: true,
    when: done('p4'), opened: 'Electricity market law',
    blurb: 'With a working market you have a surplus at night. Four neighbouring countries are running on diesel.',
    risks: [power(58, 0.25), reform('p2', 'Rebuild the weakest transmission corridors', 0.2)],
    win: [['bonus.fiscal', 0.03], ['nation.jobs', 3], ['bloc.establishment', 4]],
    lose: [['approval', -2], ['bloc.press', -3]],
    winText: 'Power flows across three borders. It is the first thing the country has exported in a decade that is not dug out of the ground.',
    loseText: 'The neighbours sign, receive the power, and do not pay. The arrears are now a diplomatic matter.',
    luck: 'A coup in the largest buying country voided the contract.',
    winNews: ['NIGERIA BECOMES NET POWER EXPORTER', 'WE DEY SELL LIGHT TO OTHER COUNTRY NOW'],
    loseNews: ['NEIGHBOURS OWE $400M FOR EXPORTED POWER', 'DEM COLLECT OUR LIGHT, NO PAY'],
  },
  {
    id: 'smelter', name: 'An aluminium smelter on surplus power', pc: 6, naira: 0.9, months: 14, top: 0.88, brief: 'min_power', infra: true, partner: 'ty_maker',
    when: done('p5'), opened: 'Twenty-four-hour power in ten cities',
    blurb: 'A smelter is electricity turned into metal. You now have the electricity. The one built in the 1990s has not smelted since.',
    risks: [partner('ty_maker', 'Birniwa', 0.22), quiet('SS', 'The South South, where the gas is', 55, 0.18), contractors(0.15)],
    win: [['nation.jobs', 9], ['bonus.jobs', 0.05], ['bonus.fiscal', 0.03], ['zone.SS.approval', 4]],
    lose: [['bloc.press', -4], ['nation.integrity', -2], ['approval', -2]],
    winText: 'The pot lines are energised and stay energised. Ingots leave by sea within the year. A town that had been waiting since 1997 holds a thanksgiving service.',
    loseText: 'The smelter is commissioned by the Vice President and switched off the following week for want of gas.',
    luck: 'World aluminium prices fell by a third and the offtake agreement was torn up.',
    winNews: ['SMELTER SHIPS FIRST ALUMINIUM IN THIRTY YEARS', 'ALUMINIUM COMPANY DON WAKE UP AFTER 30 YEARS'],
    loseNews: ['SMELTER COMMISSIONED, THEN SHUT, IN SAME MONTH', 'DEM OPEN AM MONDAY, CLOSE AM FRIDAY'],
  },
  {
    id: 'borders', name: 'Reopen the northern trade routes', pc: 4, naira: 0.3, months: 8, top: 0.88, brief: 'min_defence',
    when: done('s2'), opened: 'Forward bases in the farm belt and the North West',
    blurb: 'The Kano–Maradi road carried half of the Sahel\'s trade until it became too dangerous to drive. With the bases in place it could again.',
    risks: [quiet('NW', 'The North West', 52, 0.3), quiet('NE', 'The North East', 60, 0.15), minister('min_defence', 'National Security Adviser', 0.12)],
    win: [['nation.jobs', 5], ['bonus.inflation', -1], ['zone.NW.approval', 5], ['zone.NE.approval', 3], ['bonus.fiscal', 0.015]],
    lose: [['theatre.NW', 5], ['approval', -2], ['bloc.press', -3]],
    winText: 'Lorries run to the border in convoy, and then without one. Kano\'s markets fill with cattle, onions and customs officers.',
    loseText: 'The first convoy is ambushed forty kilometres out. The road is declared open and nobody uses it.',
    luck: 'The neighbour on the other side of the border closed it, for reasons of its own.',
    winNews: ['NORTHERN TRADE CORRIDOR REOPENS AFTER NINE YEARS', 'KANO–MARADI ROAD DON OPEN. MARKET DON FULL'],
    loseNews: ['TRADE CONVOY AMBUSHED ON "REOPENED" ROAD', 'DEM SAY ROAD DON SAFE. E NO SAFE'],
  },
  {
    id: 'gold', name: 'Bring the gold fields under licence', pc: 8, naira: 0.2, months: 10, top: 0.85, brief: 'min_defence',
    when: done('s5'), opened: 'A court and a police post in every local government',
    blurb: 'The gold in the North West pays for the guns. Licence the diggers, buy the gold at the pit, and the gangs lose their paymaster.',
    risks: [quiet('NW', 'The North West', 48, 0.28), integrity(40, 0.25)],
    win: [['bonus.fiscal', 0.04], ['nation.jobs', 5], ['theatre.NW', -8], ['zone.NW.approval', 4]],
    lose: [['nation.integrity', -3], ['theatre.NW', 6], ['bloc.press', -3]],
    winText: 'Forty thousand diggers hold licences. The central bank buys their gold at the pit head. The men who used to tax them find the forest less profitable.',
    loseText: 'The licences go to four companies owned by people who do not dig. The diggers go on selling to the men with the guns.',
    luck: 'The gold price fell sharply and the buying scheme ran at a loss from its first month.',
    winNews: ['CENTRAL BANK BUYS FIRST LICENSED GOLD', 'GOLD DIGGERS DON GET LICENCE. BANDIT MONEY DON CUT'],
    loseNews: ['GOLD LICENCES WENT TO POLITICIANS\' FIRMS — REPORT', 'BIG MEN COLLECT THE GOLD LICENCE. BANDIT STILL DEY'],
  },
  {
    id: 'buyback', name: 'Buy back the foreign bonds at a discount', pc: 4, naira: 1.5, months: 6, top: 0.9,
    when: done('t4'), opened: 'Fiscal responsibility law',
    blurb: 'With a debt ceiling in law your bonds trade below face value. Buy them now, quietly, and ₦1.5tn retires ₦2.5tn of debt.',
    risks: [
      lenders(72, 0.25),
      { id: 'quiet', label: 'The market does not see you coming: Adetoro is not against you (35 or better)', ok: v('tycoon.ty_bank', '>=', 35), cost: 0.25, warn: 'Somebody has been buying your bonds ahead of you. The price is rising.', fail: 'The banks got there first. They bought the bonds ahead of you and sold them back to you at full price.', fix: 'Keep Adetoro from turning against you (Politics, The money).' },
    ],
    win: [['debt.eurobond', -2.5], ['bloc.establishment', 6]],
    lose: [['debt.eurobond', -1.2], ['bloc.press', -3]],
    winText: 'The Debt Office buys through four banks over six weeks. By the time the market notices, a third of the foreign debt is gone at sixty cents in the dollar.',
    loseText: 'The price moved against you from the first day. You retired ₦1.2tn of debt for ₦1.5tn, which is not what a buyback is for.',
    luck: 'A rally in emerging-market debt lifted the price of every such bond in the world in the same fortnight.',
    winNews: ['NIGERIA RETIRES $2BN OF EUROBONDS AT A DISCOUNT', 'WE PAY OUR FOREIGN DEBT FOR HALF PRICE'],
    loseNews: ['EUROBOND BUYBACK "LEAKED TO TRADERS"', 'THE BUYBACK: BANKERS CHOP THE PROFIT'],
  },
  {
    id: 'loot', name: 'Bring the looted money home', pc: 10, naira: 0.1, months: 12, top: 0.82, brief: 'min_justice',
    when: done('c2'), opened: 'Anti-corruption courts with time limits',
    blurb: 'Forty years of it sits in property and accounts abroad. Foreign courts will return it to a government whose own hands are clean.',
    risks: [
      { id: 'clean', label: 'Nothing in your own drawer', ok: v('exposure.count', '==', 0), cost: 0.3, warn: 'A foreign prosecutor has asked, politely, about certain transfers out of the Villa.', fail: 'The foreign courts looked at your own record and declined to help. The list that leaked had your people on it.', fix: 'This cannot be fixed once there is something in the drawer.' },
      reform('c4', 'An independent prosecutor', 0.22), minister('min_justice', 'Attorney General', 0.15),
    ],
    win: [['nation.fiscalSpace', 1.8], ['nation.integrity', 4], ['approval', 3], ['bloc.press', 4]],
    lose: [['bloc.establishment', -5], ['pc', -5], ['pressure.scandalHeat', 8]],
    winText: 'Three jurisdictions return ₦1.8tn. The flats in London are sold. The former owners issue statements describing the money as "a family matter".',
    loseText: 'The requests are filed and returned for "further particulars". The list of names leaks, and several of them are sitting in your cabinet.',
    luck: 'A change of government abroad shelved every pending asset-recovery case.',
    winNews: ['₦1.8TN IN LOOTED FUNDS RETURNED FROM ABROAD', 'THE MONEY WEY DEM THIEF DON RETURN'],
    loseNews: ['ASSET RECOVERY LIST NAMES SERVING MINISTERS', 'THE LOOT LIST: SEE WHO DEY INSIDE'],
  },
  {
    id: 'census', name: 'Hold the census, honestly', pc: 10, naira: 0.4, months: 10, top: 0.85, brief: 'min_service',
    when: done('v3'), opened: 'Digital government',
    blurb: 'Nobody knows how many Nigerians there are, and every governor has a reason to keep it that way. Biometric, published, and binding on the revenue formula.',
    risks: [
      capacity(50, 0.22),
      { id: 'governors', label: 'Four of your six governors are with you', ok: v('govs', '>=', 4), cost: 0.28, warn: 'Two governors have told their people not to open the door to enumerators.', fail: 'Eleven governors rejected the figures for their own states, and the count died in court.', fix: 'Win over your governors (Politics), or call in what they owe.' },
    ],
    start: [['bloc.party', -4]],
    win: [['nation.capacity', 6], ['bonus.fiscal', 0.02], ['nation.integrity', 3], ['bloc.establishment', 4]],
    lose: [['bloc.party', -8], ['approval', -2]],
    winText: 'The figure is published: 231 million. Six states are smaller than they have claimed for thirty years. The revenue formula is adjusted. It holds.',
    loseText: 'The figures are published and immediately rejected by every state that lost. The census joins the others, in a warehouse.',
    luck: 'Flooding in the count month put four states beyond the reach of enumerators.',
    winNews: ['CENSUS: NIGERIA IS 231 MILLION', 'WE DON KNOW HOW MANY WE BE: 231 MILLION'],
    loseNews: ['GOVERNORS REJECT CENSUS FIGURES', 'CENSUS WAHALA: EVERY STATE SAY DEM PLENTY PASS'],
  },
  {
    id: 'hub', name: 'Make Lagos the trade capital of the free-trade area', pc: 6, naira: 0.5, months: 12, top: 0.86, brief: 'min_works', infra: true,
    when: done('i1'), opened: 'Forty-eight-hour ports',
    blurb: 'Ports that clear in two days could carry the trade of eight landlocked neighbours. They are currently using three other countries\' ports.',
    risks: [reform('v3', 'Digital government', 0.2), quiet('SW', 'The South West', 50, 0.18), contractors(0.15)],
    win: [['nation.jobs', 7], ['bonus.fiscal', 0.03], ['bonus.jobs', 0.03], ['bloc.establishment', 4]],
    lose: [['bloc.establishment', -4], ['bloc.press', -2]],
    winText: 'Transit cargo for the Sahel triples. A neighbouring port authority sends a delegation to find out what happened.',
    loseText: 'The cargo clears the port in two days and then spends nine on the road out of it.',
    luck: 'A regional trade dispute closed two land borders for most of the year.',
    winNews: ['LAGOS OVERTAKES RIVALS AS REGION\'S TRANSIT PORT', 'OTHER COUNTRY DEM DEY USE OUR PORT NOW'],
    loseNews: ['TRANSIT CARGO STUCK ON PORT ACCESS ROADS', 'PORT FAST, ROAD SLOW. TRAILER FULL EVERYWHERE'],
  },
  {
    id: 'rice', name: 'Become a rice exporter', pc: 4, naira: 0.4, months: 12, top: 0.86, brief: 'min_agric',
    when: done('f3'), opened: 'Storage and rural roads',
    blurb: 'With storage and roads, the harvest reaches a mill instead of rotting. The people who import rice have noticed.',
    risks: [
      quiet('NC', 'The farm belt', 52, 0.22), minister('min_agric', 'Minister of Agriculture', 0.15),
      { id: 'importers', label: 'The importers do not sabotage it: Ezeudu is not against you (35 or better)', ok: v('tycoon.ty_trade', '>=', 35), cost: 0.22, warn: 'Cheap foreign rice is being landed at night on the western coast and sold below your farmers\' cost.', fail: 'It was drowned. Smuggled rice flooded the markets at the harvest and the mills could not sell.', fix: 'Keep Ezeudu from turning against you, or win him round (Politics, The money).' },
    ],
    win: [['bonus.inflation', -1.5], ['nation.jobs', 5], ['zone.NW.approval', 3], ['zone.NC.approval', 3], ['bonus.fiscal', 0.015]],
    lose: [['nation.inflation', 1], ['approval', -2]],
    winText: 'The first export shipment leaves for Cotonou, which for forty years sent rice the other way.',
    loseText: 'The mills are built and stand at a third of capacity. Paddy rots at the gate while smuggled rice sells in the market.',
    luck: 'The rains failed across the rice belt in the year the mills came on.',
    winNews: ['NIGERIA EXPORTS RICE FOR THE FIRST TIME', 'WE DEY SELL RICE GIVE OTHER COUNTRY NOW'],
    loseNews: ['RICE MILLS IDLE AS SMUGGLED GRAIN FLOODS MARKET', 'DEM BUILD RICE MILL. SMUGGLER SPOIL MARKET'],
  },
  {
    id: 'wheat', name: 'End wheat imports', pc: 6, naira: 0.6, months: 14, top: 0.84, brief: 'min_agric',
    when: done('f5'), opened: 'Irrigation for a million hectares',
    blurb: 'Bread is made from imported wheat paid for in dollars. Irrigated land in the north can grow it. Millers will have to be made to buy it.',
    risks: [quiet('NW', 'The North West', 52, 0.22), minister('min_agric', 'Minister of Agriculture', 0.15), partner('ty_maker', 'Birniwa', 0.2)],
    win: [['bonus.inflation', -2], ['bonus.fiscal', 0.03], ['nation.jobs', 5], ['zone.NW.approval', 4], ['zone.NE.approval', 3]],
    lose: [['nation.inflation', 1.5], ['approval', -2], ['bloc.street', -3]],
    winText: 'The dry-season wheat harvest covers two thirds of what the mills need. The price of bread stops following the dollar.',
    loseText: 'The wheat is grown. The millers say it is the wrong kind and go on importing. Bread costs what it cost.',
    luck: 'A heatwave at flowering halved the yield in the first two seasons.',
    winNews: ['LOCAL WHEAT NOW SUPPLIES TWO THIRDS OF MILLS', 'BREAD NO DEY FOLLOW DOLLAR AGAIN'],
    loseNews: ['MILLERS REJECT LOCAL WHEAT', 'DEM PLANT WHEAT. FLOUR MILL SAY E NO GOOD'],
  },
  {
    id: 'car', name: 'A people\'s car, assembled here', pc: 6, naira: 0.7, months: 14, top: 0.85, brief: 'min_works', partner: 'ty_maker',
    when: done('i4'), opened: 'Industrial corridors',
    blurb: 'A small, cheap car built in the corridors, with a rule that government buys nothing else. The last three "made in Nigeria" cars were imported whole.',
    risks: [power(55, 0.22), partner('ty_maker', 'Birniwa', 0.2), reform('i3', 'Buy Nigerian: the procurement mandate', 0.15)],
    win: [['nation.jobs', 9], ['bonus.jobs', 0.05], ['approval', 3], ['bloc.street', 4]],
    lose: [['nation.integrity', -2], ['bloc.press', -4], ['approval', -2]],
    winText: 'Forty thousand are sold in the first year. It is not a good car. It is a cheap one, built by people who are paid, and that turns out to be the point.',
    loseText: 'The car is unveiled by the President. A journalist finds the import papers. It was built abroad and the badge was changed in Lagos.',
    luck: 'The foreign partner supplying engines was bought by a competitor and ended the contract.',
    winNews: ['40,000 LOCALLY BUILT CARS SOLD IN FIRST YEAR', 'NAIJA MOTOR DON DEY ROAD. E CHEAP'],
    loseNews: ['"MADE IN NIGERIA" CAR WAS IMPORTED WHOLE', 'THE NAIJA MOTOR NA TOKUNBO WITH NEW BADGE'],
  },
  {
    id: 'petrochem', name: 'A petrochemicals and fertiliser complex', pc: 6, naira: 0.9, months: 16, top: 0.86, brief: 'min_works', infra: true, partner: 'ty_fuel',
    when: done('i5'), opened: 'Refine every barrel at home',
    blurb: 'Refining at home leaves the feedstock for plastics and fertiliser, both of which the country imports. The fuel importers are looking for a new business.',
    risks: [partner('ty_fuel', 'Amangala', 0.22), quiet('SS', 'The South South', 52, 0.2), contractors(0.15)],
    win: [['bonus.fiscal', 0.04], ['bonus.inflation', -1], ['nation.jobs', 8], ['bonus.jobs', 0.04], ['zone.SS.approval', 4]],
    lose: [['bloc.press', -4], ['approval', -2], ['bloc.establishment', -3]],
    winText: 'Fertiliser is made from the country\'s own gas and sold to its own farmers. The men who imported both have become the men who make them.',
    loseText: 'The complex is built beside a refinery that cannot spare the feedstock. It imports its inputs, which was the thing it was built to end.',
    luck: 'A fire at the commissioning stage destroyed the main cracker.',
    winNews: ['FERTILISER, PLASTICS COMPLEX ENDS IMPORTS', 'WE DEY MAKE OUR OWN FERTILISER NOW'],
    loseNews: ['PETROCHEMICAL COMPLEX IMPORTS ITS OWN INPUTS', 'DEM BUILD FACTORY TO STOP IMPORT. E DEY IMPORT'],
  },
  {
    id: 'satellite', name: 'Launch a satellite built by Nigerian engineers', pc: 4, naira: 0.4, months: 12, top: 0.82, brief: 'min_service',
    when: done('d3'), opened: 'Three million technical talent',
    blurb: 'Not bought and renamed: designed and built here, for broadband and for watching the borders. It will be called a waste until the day it works.',
    risks: [reform('d5', 'A national compute and data-centre programme', 0.22), capacity(48, 0.2), minister('min_service', 'Minister of Industry', 0.15)],
    win: [['approval', 4], ['bloc.street', 6], ['nation.jobs', 3], ['bonus.jobs', 0.03], ['nation.security', 2]],
    lose: [['bloc.press', -5], ['approval', -2]],
    winText: 'It reaches orbit and answers. The engineers are in their twenties. The control room in Abuja is on every screen in the country for a day.',
    loseText: 'The rocket was hired and most of the satellite, it emerges, was too. It is in orbit. It is not, in any useful sense, yours.',
    luck: 'The launch vehicle failed in its second stage. Nobody on your side of the contract was at fault.',
    winNews: ['NIGERIAN-BUILT SATELLITE REACHES ORBIT', 'OUR OWN SATELLITE DON REACH SKY. NA WE BUILD AM'],
    loseNews: ['"LOCALLY BUILT" SATELLITE WAS BOUGHT ABROAD', 'THE SATELLITE: DEM BUY AM, PAINT AM GREEN-WHITE-GREEN'],
  },
  {
    id: 'fintech', name: 'Take the payment rail to the neighbours', pc: 4, naira: 0.2, months: 10, top: 0.88, brief: 'min_service', partner: 'ty_bank',
    when: done('d4'), opened: 'Payments and identity as public rails',
    blurb: 'A trader in Kano could pay a supplier in Accra in seconds. Whoever builds the rail for West Africa collects on every transfer for a generation.',
    risks: [partner('ty_bank', 'Adetoro', 0.25), { id: 'naira', label: 'The naira is holding (inflation under 24%)', ok: v('nation.inflation', '<', 24), cost: 0.22, warn: 'The neighbours\' central banks are reluctant to settle in a currency that is sliding.', fail: 'No other country would settle in naira while it was losing value this fast.', fix: 'Bring inflation under 24%.' }],
    win: [['bonus.fiscal', 0.03], ['nation.jobs', 5], ['bloc.establishment', 4], ['bonus.jobs', 0.02]],
    lose: [['bloc.establishment', -3], ['bloc.press', -2]],
    winText: 'Seven countries connect. A fifth of West Africa\'s cross-border payments now clear through a server room in Lagos.',
    loseText: 'Two countries sign and none connect. The banks, who were not consulted, build their own.',
    luck: 'A regional bloc launched a competing system with donor money in the same quarter.',
    winNews: ['SEVEN COUNTRIES JOIN NIGERIAN PAYMENT RAIL', 'OUR TRANSFER SYSTEM DON REACH GHANA, SENEGAL'],
    loseNews: ['REGIONAL PAYMENT SCHEME FINDS NO TAKERS', 'NEIGHBOURS NO GREE USE OUR TRANSFER'],
  },
  {
    id: 'hospital', name: 'End medical tourism: a hospital city', pc: 4, naira: 0.8, months: 14, top: 0.85, brief: 'min_service', infra: true,
    when: done('e1'), opened: 'A working clinic in every ward',
    blurb: 'A billion dollars a year leaves in the pockets of people flying abroad to be treated, most of them officials. Build what they fly to.',
    risks: [reform('e2', 'Fund the universities and doctors by law', 0.25), power(50, 0.2), contractors(0.15)],
    win: [['approval', 4], ['bloc.street', 6], ['bonus.fiscal', 0.02], ['nation.jobs', 3]],
    lose: [['approval', -3], ['bloc.press', -4]],
    winText: 'It opens with doctors who came home to staff it. The first patient through the door is a minister, on the President\'s instruction.',
    loseText: 'It opens without specialists, who are in Riyadh and Manchester. In the same week a minister is photographed at a clinic in London.',
    luck: 'The equipment supplier collapsed with the deposits of eleven countries.',
    winNews: ['DOCTORS RETURN FROM ABROAD TO STAFF HOSPITAL CITY', 'BIG MEN DEY TREAT FOR NAIJA NOW'],
    loseNews: ['FLAGSHIP HOSPITAL OPENS WITHOUT SPECIALISTS', 'FINE HOSPITAL, NO DOCTOR'],
  },
  {
    id: 'coastal', name: 'A coastal highway to Abidjan, with the neighbours', pc: 6, naira: 1.2, months: 18, top: 0.85, brief: 'min_works', infra: true,
    when: done('w3'), opened: 'Deep sea port and rail link',
    blurb: 'Five countries, a thousand kilometres, and the busiest trade corridor on the continent. Announced by every government since 1975.',
    risks: [contractors(0.2), lenders(82, 0.18), quiet('SS', 'The South South', 55, 0.15), minister('min_works', 'Minister of Works', 0.15)],
    win: [['nation.jobs', 9], ['bonus.jobs', 0.04], ['bonus.fiscal', 0.02], ['zone.SS.approval', 4], ['zone.SW.approval', 4]],
    lose: [['debt.bonds', 1], ['bloc.press', -4], ['approval', -2]],
    winText: 'The Nigerian section is finished first, which nobody in the other four capitals expected. Lagos to Accra becomes a day\'s drive.',
    loseText: 'Forty-seven kilometres are built, in three unconnected pieces. Each piece has been commissioned.',
    luck: 'Two of the partner governments fell in the same year and their successors reopened the route.',
    winNews: ['COASTAL HIGHWAY OPENS: LAGOS TO ACCRA IN A DAY', 'YOU FIT DRIVE REACH GHANA FOR ONE DAY NOW'],
    loseNews: ['COASTAL HIGHWAY: 47KM BUILT, IN THREE PIECES', 'DEM COMMISSION ROAD WEY NO CONNECT'],
  },
];

export const VENTURE_BY_ID = Object.fromEntries(VENTURES.map((x) => [x.id, x]));
