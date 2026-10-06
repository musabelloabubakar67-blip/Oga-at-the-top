// THE CITIZEN CAST (plan 14; content input for contract R12)
// Eleven people the President never meets, one for each way the country earns a
// living or fails to. What each says this month is read from the actual state of
// the game (prices, power, jobs, security in their theatre, pensions, the
// exchange rate, the budget), so the same national figure can be good news for
// one of them and bad news for another (plan 14, acceptance T9). There is no
// single voice of the public.
//
// Names: ordinary Nigerian names, each searched on the web on 6 October 2026 and
// kept only if no public figure shares it. Rejected in that pass: Terkaa Ugondo
// and Yagana Bulama (both real people named in news reports of a death or a
// displacement), Kenechukwu Ibeabuchi (a boxer shares the surname), Morenike
// Odunsi and Morenike Adesalu (a singer's surname; a near-identical artist),
// Rifkatu Gyari (the first name is closely tied to one of the abducted Chibok
// schoolgirls). No text uses a gendered pronoun for a citizen.
//
// Status: `lines` are live: the country page shows them now, evaluated with the
// existing condition language. `responses` (organising, petitioning, moving,
// changing work, backing an alternative) are proposed behaviour for R12 and are
// shown as such; nothing in the engine acts on them yet.

import type { Cond, ZoneId } from '../engine/types';

export type Group =
  | 'salaried' | 'trader' | 'farmer' | 'manufacturer' | 'importer' | 'transport'
  | 'graduate' | 'fisher' | 'displaced' | 'pensioner' | 'health';

export interface CitizenLine { when: Cond; text: string }

export interface CitizenResponse {
  when: Cond;
  /** What they do (14.A2). Proposed for R12. */
  act: 'organise' | 'petition' | 'relocate' | 'switch' | 'support';
  text: string;
}

export interface Citizen {
  id: string;
  name: string;
  short: string;
  group: Group;
  work: string;
  /** State id from content/states.ts. */
  state: string;
  zone: ZoneId;
  household: string;
  /** The game values their life actually turns on, and why. */
  dependsOn: { path: string; why: string }[];
  /** What they say this month: the first line whose condition holds. */
  lines: CitizenLine[];
  /** What they say when nothing above applies. */
  otherwise: string;
  responses: CitizenResponse[];
  /** The kind of national progress that helps them, and the kind that costs them. */
  gains: string;
  loses: string;
}

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });
const all = (...c: Cond[]): Cond => ({ all: c });

export const CITIZENS: Citizen[] = [
  {
    id: 'cit.bature', name: 'Mrs Ladi Bature', short: 'Bature', group: 'salaried', work: 'Secondary school teacher', state: 'KD', zone: 'NW',
    household: 'Two children in school, a husband who drives for a ministry, a salary that arrives late more often than on time.',
    dependsOn: [{ path: 'nation.inflation', why: 'A fixed salary loses to every price rise.' }, { path: 'pressure.wageGrievance', why: 'Whether the wage talks are moving.' }, { path: 'budget.people', why: 'Schools and salaries come out of the same line.' }],
    lines: [
      { when: { v: ['venture.census', '==', 1] }, text: 'The census found our school. For the first time the state has a teacher allocation for the children we actually have.' },
      { when: v('pressure.wageGrievance', '>=', 60), text: 'The union says strike. I cannot afford a strike and I cannot afford not to.' },
      { when: v('nation.inflation', '>=', 30), text: 'My salary buys half of what it bought when I started. I teach in the morning and sell recharge cards in the afternoon.' },
      { when: v('nation.inflation', '>=', 20), text: 'Prices went up again this term. I mark other schools\' exam scripts at night for the extra.' },
      { when: v('nation.inflation', '<=', 15), text: 'For the first time in years the salary lasted the month. I bought a second uniform for my daughter without borrowing.' },
    ],
    otherwise: 'We manage. Managing is a full-time job.',
    responses: [
      { when: v('pressure.wageGrievance', '>=', 60), act: 'organise', text: 'Joins the teachers\' branch executive and argues for a strike vote.' },
      { when: v('nation.inflation', '>=', 32), act: 'switch', text: 'Leaves the classroom for a private school that pays on time.' },
    ],
    gains: 'Lower inflation; wages paid on time; a funded settlement.', loses: 'Subsidy removal without transfers; unfunded wage agreements that the states cannot pay.',
  },
  {
    id: 'cit.nwaigwe', name: 'Ogechi Nwaigwe', short: 'Nwaigwe', group: 'trader', work: 'Fabric trader, Onitsha main market', state: 'AN', zone: 'SE',
    household: 'Three apprentices, a stall inherited from an aunt, a supplier in Cotonou and another in Kano.',
    dependsOn: [{ path: 'theatre.SE', why: 'Markets shut on Mondays when the agitation is strong.' }, { path: 'fx.premium', why: 'Imported cloth is priced at the street rate.' }, { path: 'nation.inflation', why: 'Customers buy less when food costs more.' }],
    lines: [
      { when: { v: ['venture.coastal', '==', 1] }, text: 'Lagos to Accra in a day. I have customers in Accra now who used to buy in Lagos and resell.' },
      { when: v('theatre.SE', '>', 66), text: 'Monday is gone. Nobody orders it shut in writing. Nobody opens.' },
      { when: v('fx.premium', '>=', 20), text: 'I price in the morning and again at noon. The supplier will not hold a rate for a week.' },
      { when: v('theatre.SE', '>=', 58), text: 'Monday is quiet. A few of us open. Most wait to see who opens first.' },
      { when: v('theatre.SE', '<', 50), text: 'Five days of trade again. The apprentices are talking about opening a second stall.' },
    ],
    otherwise: 'The market is open and the customers are careful.',
    responses: [
      { when: v('theatre.SE', '>', 70), act: 'relocate', text: 'Moves part of the stock to a cousin\'s shop in Abuja.' },
      { when: v('fx.premium', '>=', 25), act: 'petition', text: 'Signs the market association\'s letter to the central bank.' },
    ],
    gains: 'Open markets; a stable exchange rate; working roads east.', loses: 'Border closures; troops at the market gates; a rate that changes twice a day.',
  },
  {
    id: 'cit.igbaukum', name: 'Msughter Igbaukum', short: 'Igbaukum', group: 'farmer', work: 'Yam and rice farmer', state: 'BE', zone: 'NC',
    household: 'Eleven hectares, four of them planted last year. A wife, five children and a brother\'s family since the attack on their village.',
    dependsOn: [{ path: 'theatre.NC', why: 'Whether it is safe to farm the far fields at planting time.' }, { path: 'budget.agric', why: 'Fertiliser and extension services.' }, { path: 'nation.petrolPrice', why: 'Diesel for the pump and transport to market.' }],
    lines: [
      { when: { v: ['venture.rice', '==', 1] }, text: 'A mill buys paddy at the farm gate now, and pays the same week. I planted rice where the yams used to be.' },
      { when: v('theatre.NC', '>=', 66), text: 'We plant the fields we can see from the house. The rest is grass this year.' },
      { when: v('nation.petrolPrice', '>=', 1200), text: 'The lorry to Makurdi costs more than the yams in it.' },
      { when: v('theatre.NC', '<', 50), text: 'All eleven hectares are in. The soldiers on the road at night made the difference.' },
    ],
    otherwise: 'Planting what we dare. Selling what we must.',
    responses: [
      { when: v('theatre.NC', '>=', 70), act: 'relocate', text: 'Moves the family to the state capital and goes back only to harvest.' },
      { when: all(v('theatre.NC', '>=', 60), v('zone.NC.approval', '<', 45)), act: 'support', text: 'Listens to the opposition candidate who promises state police.' },
    ],
    gains: 'Secure planting seasons; rural roads; reliable fertiliser.', loses: 'Open borders to cheap rice; insecurity at planting time.',
  },
  {
    id: 'cit.nwaobilor', name: 'Kenechukwu Nwaobilor', short: 'Nwaobilor', group: 'manufacturer', work: 'Owner, a shoe and bag workshop in Aba', state: 'AB', zone: 'SE',
    household: 'Twenty-two workers, two generators, and orders from three West African countries.',
    dependsOn: [{ path: 'nation.power', why: 'The workshop runs on diesel when the grid is down.' }, { path: 'nation.jobs', why: 'Demand from people with wages.' }, { path: 'fx.premium', why: 'Glue, leather dyes and machine parts are imported.' }],
    lines: [
      { when: { v: ['venture.car', '==', 1] }, text: 'The people\'s car plant buys our seat covers. Twenty-two workers became thirty-five.' },
      { when: v('nation.power', '<', 35), text: 'Diesel is my biggest cost after wages. Some months it is bigger than wages.' },
      { when: v('nation.power', '>=', 55), text: 'The grid held for three weeks. I turned off a generator and hired two more people with what it saved.' },
      { when: v('fx.premium', '>=', 20), text: 'The buyers in Accra want a price for three months. I cannot give a price for three days.' },
    ],
    otherwise: 'Busy enough. Never sure for how long.',
    responses: [
      { when: v('nation.power', '<', 30), act: 'switch', text: 'Lays off six workers and imports finished shoes to sell instead.' },
      { when: v('nation.power', '>=', 55), act: 'organise', text: 'Joins the cluster association asking for a dedicated feeder line, and offers to pay for it.' },
    ],
    gains: 'Reliable power; a predictable exchange rate; protected markets for finished goods.', loses: 'Tariff rises before supply improves; import waivers for big importers.',
  },
  {
    id: 'cit.okelola', name: 'Adunni Okelola', short: 'Okelola', group: 'importer', work: 'Medicine importer and distributor', state: 'LA', zone: 'SW',
    household: 'A warehouse in Ikeja, nine pharmacies as customers, and a credit line in dollars.',
    dependsOn: [{ path: 'fx.premium', why: 'Every pack is paid for in dollars.' }, { path: 'fx.reserves', why: 'Whether the banks will sell dollars at all.' }, { path: 'theatre.SW', why: 'The trucks use the expressway.' }],
    lines: [
      { when: { v: ['venture.hub', '==', 1] }, text: 'Containers clear the port in two days now. I used to budget three weeks and a man to sit at the gate.' },
      { when: v('fx.reserves', '<', 18), text: 'The bank says it has no dollars this month. The pharmacies say they have no insulin.' },
      { when: v('fx.premium', '>=', 20), text: 'I buy dollars on the street now. The price of every medicine on my list has gone up by a third.' },
      { when: v('theatre.SW', '>', 62), text: 'Two of my drivers refuse the expressway after dark. Deliveries take a day longer.' },
      { when: v('fx.premium', '<', 10), text: 'The rate held for a quarter. I ordered six months of stock at once and lowered my prices.' },
    ],
    otherwise: 'Shelves full, margins thin.',
    responses: [
      { when: v('fx.premium', '>=', 25), act: 'petition', text: 'Lobbies through the pharmaceutical importers\' association for priority dollar allocation.' },
      { when: v('fx.reserves', '<', 15), act: 'relocate', text: 'Opens a second warehouse in Accra to buy from there.' },
    ],
    gains: 'A stable, unified exchange rate; safe roads into Lagos.', loses: 'Rationed dollars; local-content rules that arrive before local factories do.',
  },
  {
    id: 'cit.gwammaja', name: 'Auwalu Gwammaja', short: 'Gwammaja', group: 'transport', work: 'Tricycle rider, Kano', state: 'KN', zone: 'NW',
    household: 'A tricycle on hire-purchase, a wife and three children, and a daily payment to the owner.',
    dependsOn: [{ path: 'nation.petrolPrice', why: 'Fuel is the day\'s first cost.' }, { path: 'pressure.fuelSupplyStress', why: 'Queues are hours not worked.' }, { path: 'nation.inflation', why: 'Passengers walk when food costs more.' }],
    lines: [
      { when: { v: ['venture.cng', '==', 1] }, text: 'I converted the keke to gas. Fuel takes a third of what it did. The owner has noticed and raised the daily payment.' },
      { when: v('pressure.fuelSupplyStress', '>=', 50), text: 'I queued from five until eleven for fuel. By then the morning passengers were gone.' },
      { when: v('nation.petrolPrice', '>=', 1200), text: 'Fares went up. Passengers went down. I carry four people where I used to carry three.' },
      { when: { flag: 'policy.subsidy', is: 'removed' }, text: 'They said the subsidy money would come back to us as buses and cash. I am still waiting to see which.' },
      { when: v('nation.petrolPrice', '>=', 900), text: 'Fuel takes the first part of every day\'s money and the owner takes the next. I work the evening for myself.' },
    ],
    otherwise: 'Fuel, the owner\'s payment, and whatever is left.',
    responses: [
      { when: v('nation.petrolPrice', '>=', 1300), act: 'organise', text: 'Joins the riders\' association strike against the new fare levy.' },
      { when: v('pressure.fuelSupplyStress', '>=', 60), act: 'switch', text: 'Hands the tricycle back and looks for work on a building site.' },
    ],
    gains: 'Steady fuel supply; transfers that actually reach people; cheaper food.', loses: 'Subsidy removal without visible transfers; scarcity.',
  },
  {
    id: 'cit.oyekanmi', name: 'Damilare Oyekanmi', short: 'Oyekanmi', group: 'graduate', work: 'Economics graduate, job-seeker', state: 'OY', zone: 'SW',
    household: 'Lives with parents in Ibadan. Two years out of university, one year of national service, forty applications.',
    dependsOn: [{ path: 'nation.jobs', why: 'Whether there are jobs for graduates at all.' }, { path: 'nation.integrity', why: 'Whether jobs go to the qualified or the connected.' }, { path: 'nation.power', why: 'The freelance work needs a laptop that is charged.' }],
    lines: [
      { when: { any: [{ v: ['venture.fintech', '==', 1] }, { v: ['venture.creative', '==', 1] }, { v: ['venture.satellite', '==', 1] }] }, text: 'I got a job building the thing the country now exports. Half my class is applying behind me.' },
      { when: v('nation.jobs', '<', 36), text: 'Every interview asks who sent me. My father has stopped asking how the interviews went.' },
      { when: v('nation.jobs', '>=', 45), text: 'Two offers in a month. I took the one that pays less and trains more.' },
      { when: v('nation.integrity', '<', 30), text: 'The recruitment exercise was cancelled. The list of the hired was published before the test.' },
    ],
    otherwise: 'Applying. Freelancing. Waiting.',
    responses: [
      { when: v('nation.jobs', '<', 30), act: 'relocate', text: 'Applies for a visa to study abroad, and means to stay.' },
      { when: all(v('nation.jobs', '<', 32), v('nation.integrity', '<', 35)), act: 'support', text: 'Volunteers for the opposition campaign that talks about merit.' },
      { when: v('nation.jobs', '>=', 45), act: 'organise', text: 'Starts asking, as a taxpayer now, where the tax goes (plan 14.A7).' },
    ],
    gains: 'Industry and services that hire; merit recruitment.', loses: 'Hiring freezes; public jobs given as patronage.',
  },
  {
    id: 'cit.ayibakuro', name: 'Tonbara Ayibakuro', short: 'Ayibakuro', group: 'fisher', work: 'Fisher, Bayelsa creeks', state: 'BY', zone: 'SS',
    household: 'A canoe, nets mended every Sunday, and a family that also farms cassava on the riverbank.',
    dependsOn: [{ path: 'theatre.SS', why: 'Oil theft means spills, and spills mean no fish.' }, { path: 'nation.integrity', why: 'Whether spill compensation is paid to the people who lost the fish.' }],
    lines: [
      { when: { v: ['venture.amnesty', '==', 1] }, text: 'The boys who used to break the pipes are on stipends. The creek is quieter. Everyone knows what happens if the stipends stop.' },
      { when: v('theatre.SS', '>', 64), text: 'There is oil on the water again from the illegal refineries. The fish have gone where we cannot follow.' },
      { when: { flag: 'oil.metered' }, text: 'Since they put meters on the terminals the barges come less often. The creek is cleaner this season.' },
      { when: v('theatre.SS', '>', 55), text: 'Some weeks there is a sheen on the water. The old men say the creek was never like this.' },
      { when: v('theatre.SS', '<', 45), text: 'A good catch three weeks running. My son wants to buy an outboard engine.' },
    ],
    otherwise: 'Some weeks fish, some weeks oil.',
    responses: [
      { when: v('theatre.SS', '>', 68), act: 'switch', text: 'Takes work at an illegal refinery, because it is the only work.' },
      { when: v('theatre.SS', '>', 60), act: 'petition', text: 'Joins the community\'s suit for spill compensation.' },
    ],
    gains: 'Metered terminals; clean-up; compensation paid to communities.', loses: 'Navy burning refineries near villages; payouts to the people who broke the pipes.',
  },
  {
    id: 'cit.abatcha', name: 'Kellu Abatcha', short: 'Abatcha', group: 'displaced', work: 'Farmer, living in a camp for the displaced', state: 'BO', zone: 'NE',
    household: 'Six people in one shelter. The farm is forty kilometres north, in a district nobody has been allowed to return to.',
    dependsOn: [{ path: 'theatre.NE', why: 'Whether the home district is safe.' }, { path: 'budget.people', why: 'Food and services in the camp.' }],
    lines: [
      { when: { v: ['venture.wheat', '==', 1] }, text: 'The wheat scheme hires people from the camp to work the irrigated plots. It is not our land, but it is work, and it is farming.' },
      { when: v('theatre.NE', '>=', 76), text: 'More families arrived this week from another town. The ration was cut to make room.' },
      { when: v('theatre.NE', '>=', 70), text: 'Nobody from our district has been allowed home this year. We hear the fields have gone back to bush.' },
      { when: v('theatre.NE', '<', 55), text: 'They are letting families go home to two districts. We have been told ours is next.' },
      { when: v('theatre.NE', '<', 65), text: 'The road north is open in daylight. Some men go to farm and come back before dark.' },
    ],
    otherwise: 'Waiting. The children are in the camp school. That is something.',
    responses: [
      { when: v('theatre.NE', '<', 55), act: 'relocate', text: 'Goes home, if there is a police post, a borehole and a school there to go home to.' },
      { when: v('theatre.NE', '>=', 76), act: 'petition', text: 'Signs the camp leaders\' letter to the governor about the ration.' },
    ],
    gains: 'Towns that are held, not only retaken; reconstruction before return.', loses: 'Camps closed before the districts are safe.',
  },
  {
    id: 'cit.ezeokoli', name: 'Pa Boniface Ezeokoli', short: 'Ezeokoli', group: 'pensioner', work: 'Retired railway clerk', state: 'EN', zone: 'SE',
    household: 'Thirty-four years of service, a widow\'s house in Enugu, and a pension that is paid when it is paid.',
    dependsOn: [{ path: 'debt.pensions', why: 'Arrears owed to retired federal workers.' }, { path: 'nation.inflation', why: 'A fixed pension loses to every price rise.' }],
    lines: [
      { when: { v: ['venture.loot', '==', 1] }, text: 'They say the money from the flats in London will pay our arrears. I will believe it when the alert comes.' },
      { when: v('debt.pensions', '>', 1), text: 'Fifty months owed. I go to the verification office every quarter to prove I am alive.' },
      { when: v('debt.pensions', '>', 0.3), text: 'They paid some arrears. Not mine. The office says my file is "under processing".' },
      { when: v('debt.pensions', '<=', 0.1), text: 'The pension came into the bank on the first of the month. I told everyone at church.' },
    ],
    otherwise: 'Waiting for the next payment, and the one after.',
    responses: [
      { when: v('debt.pensions', '>', 1), act: 'organise', text: 'Joins the retirees sitting outside the pension board\'s gate.' },
    ],
    gains: 'Arrears cleared; payment through the banks.', loses: 'Verification exercises; inflation.',
  },
  {
    id: 'cit.tsado', name: 'Lami Tsado', short: 'Tsado', group: 'health', work: 'Nurse, a general hospital in Minna', state: 'NI', zone: 'NC',
    household: 'Night shifts, a husband who teaches, and a cousin abroad who keeps sending application forms.',
    dependsOn: [{ path: 'budget.people', why: 'Drugs, equipment and salaries in public hospitals.' }, { path: 'nation.power', why: 'The theatre runs on a generator when the grid fails.' }, { path: 'pressure.wageGrievance', why: 'Strikes by doctors and nurses.' }],
    lines: [
      { when: { v: ['venture.hospital', '==', 1] }, text: 'Two of our best nurses went to the hospital city. It pays better. The patients who used to fly abroad go there now, and the ones who cannot still come to us.' },
      { when: v('pressure.wageGrievance', '>=', 60), text: 'The doctors are on strike. We nurses are not, so the ward is ours, and we are not doctors.' },
      { when: v('nation.power', '<', 32), text: 'We delivered a baby by torchlight on Tuesday. The diesel for the generator had been "approved".' },
      { when: v('nation.power', '>=', 55), text: 'The power has been steady for a month. The oxygen machine has not stopped once.' },
    ],
    otherwise: 'Short of staff. Short of supplies. Still open.',
    responses: [
      { when: v('pressure.wageGrievance', '>=', 55), act: 'relocate', text: 'Fills in the forms the cousin sent and takes a job abroad.' },
      { when: v('pressure.wageGrievance', '>=', 45), act: 'organise', text: 'Stands for the nurses\' union branch.' },
    ],
    gains: 'Hospitals funded to run, not only to be opened; reliable power.', loses: 'Settlements for doctors that leave nurses out; cuts to the people\'s budget.',
  },
];

export const CITIZEN_BY_ID: Record<string, Citizen> = Object.fromEntries(CITIZENS.map((c) => [c.id, c]));
