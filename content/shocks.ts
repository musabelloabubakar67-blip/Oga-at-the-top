import type { Cond, Fx, GameEvent } from '../engine/types';

// SHOCKS
// Things that happen to the country, not because of the President. Each lasts a
// few months and hits (or pays) every month. What the President built beforehand
// decides how hard: every cushion, and every way of catching a windfall, is named,
// and so is what was missing. Each arrives with a file: how the government answers
// is one more cushion, or one more way to catch it. Each happens at most once in a
// presidency.

export interface Guard { label: string; when: Cond; share: number }

export interface ShockDef {
  id: string;
  good: boolean;
  /** What the desk calls it while it lasts. */
  name: string;
  months: number;
  weight: number;
  when?: Cond;
  /** Every month it lasts, before cushions (bad) or at full capture (good). */
  hit: Fx[];
  /** Bad: each met guard takes its share off the hit. Good: the share of the windfall caught starts at `base` and each met guard adds to it. */
  guards: Guard[];
  base?: number;
  /** The file that arrives with it. */
  file: string;
  news: [string, string];
}

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });
const done = (id: string): Cond => v(`agenda.${id}`, '>=', 1);
const answered = (id: string, choice: string): Cond => ({ flag: `shock.${id}`, is: choice });

export const SHOCKS: ShockDef[] = [
  {
    id: 'flood', good: false, name: 'The floods', months: 4, weight: 10, when: { month: [7, 8, 9, 10] },
    hit: [['zone.NC.approval', -1.2], ['zone.NE.approval', -0.6], ['nation.inflation', 0.5], ['nation.fiscalSpace', -0.04], ['theatre.NC', 0.5]],
    guards: [
      { label: 'Flood defences on the Niger and Benue held', when: done('w4'), share: 0.6 },
      { label: 'Grain in storage kept food moving', when: done('f3'), share: 0.15 },
      { label: 'The stabilisation account paid for relief at once', when: v('fund.buffer', '>=', 1), share: 0.1 },
      { label: 'Relief went out under federal control', when: answered('flood', 'relief'), share: 0.25 },
      { label: 'The army moved people out ahead of the water', when: answered('flood', 'army'), share: 0.15 },
    ],
    file: 'shock.flood',
    news: ['FLOODS SUBMERGE COMMUNITIES ALONG NIGER AND BENUE', 'WATER DON CARRY WHOLE VILLAGE'],
  },
  {
    id: 'drought', good: false, name: 'The failed harvest', months: 6, weight: 8,
    hit: [['nation.inflation', 0.6], ['theatre.NW', 0.4], ['theatre.NE', 0.3], ['bloc.street', -0.4]],
    guards: [
      { label: 'Irrigation kept a million hectares green', when: done('f5'), share: 0.35 },
      { label: 'Storage and rural roads moved what did grow', when: done('f3'), share: 0.2 },
      { label: 'Inputs had gone out before the rains', when: done('f1'), share: 0.15 },
      { label: 'Planting and harvest were protected', when: done('f2'), share: 0.1 },
      { label: 'Staples were imported in time', when: answered('drought', 'imports'), share: 0.25 },
      { label: 'Cash reached the poorest households', when: answered('drought', 'cash'), share: 0.2 },
    ],
    file: 'shock.drought',
    news: ['RAINS FAIL ACROSS THE NORTH; HARVEST WORST IN DECADES', 'NO RAIN, NO FOOD. NORTH DEY SUFFER'],
  },
  {
    id: 'outbreak', good: false, name: 'The outbreak', months: 5, weight: 7,
    hit: [['nation.jobs', -0.3], ['approval', -0.6], ['nation.fiscalSpace', -0.03], ['nation.capacity', -0.2]],
    guards: [
      { label: 'A working clinic in every ward found it early', when: done('e1'), share: 0.35 },
      { label: 'Health insurance meant people came forward', when: done('e4'), share: 0.2 },
      { label: 'A capable civil service ran the response', when: v('nation.capacity', '>=', 55), share: 0.15 },
      { label: 'Payments rails got support to the quarantined', when: done('d4'), share: 0.1 },
      { label: 'The cities were closed early', when: answered('outbreak', 'close'), share: 0.3 },
      { label: 'Clinics were staffed and paid at once', when: answered('outbreak', 'staff'), share: 0.2 },
    ],
    file: 'shock.outbreak',
    news: ['HEALTH AUTHORITIES CONFIRM OUTBREAK IN THREE STATES', 'SICKNESS DON ENTER. EVERYBODY WASH HAND'],
  },
  {
    id: 'flight', good: false, name: 'The capital flight', months: 6, weight: 8,
    hit: [['nation.inflation', 0.5], ['debt.eurobond', 0.08], ['nation.jobs', -0.15], ['bloc.establishment', -0.4]],
    guards: [
      { label: 'Savings abroad defended the naira', when: v('fund.abroad', '>=', 2), share: 0.3 },
      { label: 'Debt service was low enough to reassure lenders', when: v('nation.debt', '<', 70), share: 0.2 },
      { label: 'A binding debt ceiling was already law', when: done('t4'), share: 0.2 },
      { label: 'Investors trusted the books', when: v('nation.integrity', '>=', 50), share: 0.1 },
      { label: 'The central bank let the naira find its level', when: answered('flight', 'float'), share: 0.2 },
      { label: 'The savings were spent defending the naira', when: answered('flight', 'defend'), share: 0.3 },
    ],
    file: 'shock.flight',
    news: ['FOREIGN INVESTORS PULL OUT AS WORLD RATES RISE', 'DOLLAR DEY RUN COMOT. NAIRA DEY SHAKE'],
  },
  {
    id: 'blackout', good: false, name: 'The grid collapse', months: 3, weight: 8,
    hit: [['nation.power', -1.2], ['nation.jobs', -0.2], ['approval', -0.5]],
    guards: [
      { label: 'The rebuilt corridors carried the load', when: done('p2'), share: 0.4 },
      { label: 'States and private plants kept generating', when: done('p4'), share: 0.2 },
      { label: 'Gas that used to be flared kept the plants fed', when: done('g1'), share: 0.15 },
      { label: 'The pipelines in the South South were safe', when: v('theatre.SS', '<', 45), share: 0.15 },
      { label: 'Engineers were flown in and paid', when: answered('blackout', 'engineers'), share: 0.25 },
    ],
    file: 'shock.blackout',
    news: ['NATIONAL GRID COLLAPSES; MOST OF THE COUNTRY IN DARKNESS', 'NEPA DON TAKE LIGHT FOR WHOLE COUNTRY'],
  },
  {
    id: 'border', good: false, name: 'The war next door', months: 8, weight: 7,
    hit: [['theatre.NE', 0.6], ['theatre.NW', 0.4], ['nation.fiscalSpace', -0.02]],
    guards: [
      { label: 'Paid, equipped troops held the border', when: done('s1'), share: 0.2 },
      { label: 'Forward bases were already in place', when: done('s2'), share: 0.2 },
      { label: 'Police posts and courts in every local government', when: done('s5'), share: 0.15 },
      { label: 'The security effort was already in the North East', when: v('focus.NE', '>=', 1), share: 0.15 },
      { label: 'The border was closed and patrolled', when: answered('border', 'close'), share: 0.2 },
      { label: 'Camps took in the refugees, away from the fighting', when: answered('border', 'camps'), share: 0.2 },
    ],
    file: 'shock.border',
    news: ['COUP AND FIGHTING ACROSS THE NORTHERN BORDER; REFUGEES CROSS', 'WAR FOR NEXT COUNTRY. PEOPLE DEY RUN ENTER'],
  },
  {
    id: 'discovery', good: true, name: 'The offshore find', months: 12, weight: 7, base: 0.3,
    hit: [['nation.fiscalSpace', 0.05], ['bloc.establishment', 0.2]],
    guards: [
      { label: 'The oil company publishes and remits', when: done('t2'), share: 0.4 },
      { label: 'The books are clean enough that little leaks', when: v('nation.integrity', '>=', 45), share: 0.2 },
      { label: 'The terminals in the South South are safe', when: v('theatre.SS', '<', 50), share: 0.2 },
      { label: 'Signed under published terms', when: answered('discovery', 'open'), share: 0.2 },
    ],
    file: 'shock.discovery',
    news: ['MAJOR OFFSHORE OIL FIELD DISCOVERED', 'NEW OIL DON SHOW. WHO GO CHOP AM?'],
  },
  {
    id: 'remit', good: true, name: 'The diaspora surge', months: 8, weight: 7, base: 0.4,
    hit: [['nation.inflation', -0.4], ['approval', 0.3], ['nation.jobs', 0.1]],
    guards: [
      { label: 'Payments rails carry it cheaply', when: done('d4'), share: 0.3 },
      { label: 'The diaspora bond gave it somewhere to go', when: v('venture.diaspora', '>=', 1), share: 0.2 },
      { label: 'The naira trades freely', when: { flag: 'policy.subsidy', is: 'removed' }, share: 0.1 },
      { label: 'Banks were told to make it easy', when: answered('remit', 'welcome'), share: 0.2 },
    ],
    file: 'shock.remit',
    news: ['MONEY SENT HOME HITS RECORD; NAIRA FIRMS', 'DIASPORA DON SEND MONEY. NAIRA DON GET STRENGTH'],
  },
  {
    id: 'factory', good: true, name: 'The investment wave', months: 10, weight: 7, base: 0.2,
    hit: [['nation.jobs', 0.35], ['nation.fiscalSpace', 0.015], ['zone.SW.approval', 0.2]],
    guards: [
      { label: 'Power is reliable enough to run a factory', when: v('nation.power', '>=', 55), share: 0.4 },
      { label: 'Forty-eight-hour ports', when: done('i1'), share: 0.25 },
      { label: 'The roads into the commercial capital are safe', when: v('theatre.SW', '<', 50), share: 0.15 },
      { label: 'A tax holiday was offered', when: answered('factory', 'holiday'), share: 0.25 },
    ],
    file: 'shock.factory',
    news: ['GLOBAL MANUFACTURERS SCOUT NIGERIA AS SUPPLY CHAINS MOVE', 'FOREIGN FACTORY DEY FIND WHERE TO LAND'],
  },
  {
    id: 'bumper', good: true, name: 'The bumper harvest', months: 5, weight: 7, base: 0.4,
    hit: [['nation.inflation', -0.6], ['bloc.street', 0.3]],
    guards: [
      { label: 'Storage and rural roads kept it from rotting', when: done('f3'), share: 0.4 },
      { label: 'Farms were protected through the harvest', when: done('f2'), share: 0.2 },
      { label: 'The surplus was bought into the reserve', when: answered('bumper', 'reserve'), share: 0.3 },
    ],
    file: 'shock.bumper',
    news: ['RECORD HARVEST; FOOD PRICES FALL', 'FOOD DON PLENTY. GARRI DON CHEAP'],
  },
  {
    id: 'cup', good: true, name: 'The trophy', months: 2, weight: 5, base: 1,
    hit: [['approval', 1], ['bloc.street', 0.6]],
    guards: [],
    file: 'shock.cup',
    news: ['NATIONAL TEAM ARE CONTINENTAL CHAMPIONS', 'WE WIN! WE WIN! THE CUP DON COME HOME'],
  },
];

export const SHOCK_BY_ID = Object.fromEntries(SHOCKS.map((d) => [d.id, d]));

// ---------------------------------------------------------------- the files

const file = (id: string, title: string, office: string, body: GameEvent['body'], choices: GameEvent['choices'], tone: GameEvent['tone'] = 'grave', category: GameEvent['category'] = 'fortune'): GameEvent => ({
  id: `shock.${id}`, kind: 'chain', slot: 'lead', category, tone, intensity: (tone === 'grave' ? 4 : 2) as GameEvent['intensity'], max: 1,
  office, stamp: 'URGENT', title, body, choices, reads: READS[id],
});
const READS: Record<string, GameEvent['reads']> = {
  flood: [{ role: 'sap', good: 'The camps are where the next six months will be decided, {SIR}. Whoever is seen running them will be thanked or blamed for all of it.' }],
  drought: [{ role: 'fin', good: 'Imports cost dollars, {SIR}, and cash costs naira. Doing nothing costs both, later, and more.' }],
  outbreak: [{ role: 'cos', good: 'Close early and you will be blamed for the closing. Close late and you will be blamed for the dead. Only one of those can be undone.' }],
  flight: [{ role: 'fin', good: 'Defending the naira buys time with savings, {SIR}. Letting it go buys nothing but ends sooner. Controls buy a black market.' }],
  blackout: [{ role: 'power', good: 'Money will bring it back faster, {SIR}. Speeches will not bring it back at all.' }],
  border: [{ role: 'nsa', good: 'The fighters will come in with the refugees, {SIR}, whatever we do. The question is whether they come into camps we run or villages we do not.' }],
  discovery: [{ role: 'fin', good: 'Every naira of it that is published is a naira that is harder to steal, {SIR}. Including by us.' }],
  remit: [{ role: 'fin', good: 'It is the cheapest foreign exchange the country will ever receive, {SIR}. Taxing it is the quickest way to make it go elsewhere.' }],
  factory: [{ role: 'fin', good: 'They are choosing between four countries, {SIR}. A tax holiday is cheaper than losing them; consultancies are dearer than both.' }],
  bumper: [{ role: 'fin', good: 'Buying now is cheap, {SIR}. Next year\'s lean season will be expensive either way, and less so with a full reserve.' }],
  cup: [{ role: 'sap', good: 'Hold the cup for the photograph, {SIR}, but not for long. The country can tell when a President is borrowing a goal.' }],
};

const pick = (id: string, choice: string) => ({ [`shock.${id}`]: choice });

export const SHOCK_FILES: GameEvent[] = [
  file('flood', 'The rivers have burst their banks', 'Federal Ministry of Water Resources', [
    'The Niger and the Benue are both above their highest recorded level. Hundreds of communities are under water, and the water is still rising.',
    { when: done('w4'), text: 'The new defences are holding along most of the stretch they cover. The worst damage is outside them.' },
    { when: { not: done('w4') }, text: 'There are no defences worth the name. The reservoir across the border released water three days ago, and nobody downstream was told in time.' },
    'Every month this lasts will cost food, money and goodwill in the North Central and the North East. How the government answers decides how much.',
  ], [
    { id: 'relief', label: 'Federal relief, under federal control', naira: 0.3, outcomes: [{ result: 'Relief goes out under federal officers, not the governors\'. It is slower to start and arrives whole.', fx: [['approval', 1], ['person.gov_nc', -3]], flags: pick('flood', 'relief'), news: ['FG TAKES CHARGE OF FLOOD RELIEF', 'FG SAY NA THEM GO SHARE RELIEF THIS TIME'], archive: 'Ran flood relief under federal control.', sig: 2 }] },
    { id: 'army', label: 'Send the army to move people out', pc: 4, outcomes: [{ result: 'Soldiers and boats evacuate eleven thousand people ahead of the second crest. The photographs are of soldiers carrying grandmothers.', fx: [['bloc.establishment', 2]], flags: pick('flood', 'army'), news: ['TROOPS EVACUATE THOUSANDS AHEAD OF FLOODWATER', 'SOLDIERS DEY CARRY PEOPLE COMOT FOR WATER'], archive: 'Sent the army to evacuate the flooded communities.', sig: 2 }] },
    { id: 'states', label: 'Send the money to the governors', naira: 0.2, outcomes: [{ result: 'The money goes to the state emergency agencies. Some of it reaches the camps.', fx: [['person.gov_nc', 6], ['nation.integrity', -1]], flags: pick('flood', 'states'), news: ['FG RELEASES FLOOD FUNDS TO STATES', 'FLOOD MONEY DON REACH GOVERNOR HAND'], archive: 'Sent flood relief money to the states.', sig: 1 }] },
  ]),
  file('drought', 'The rains have failed', 'Federal Ministry of Agriculture', [
    'The rains came late and stopped early across the whole of the North. The ministry estimates the grain harvest at half of last year\'s.',
    { when: done('f5'), text: 'The irrigated schemes are the only green on the satellite map.' },
    'Food prices will climb for months, and hunger recruits for whoever is paying in the forests.',
  ], [
    { id: 'imports', label: 'Import staples now, duty-free', naira: 0.3, outcomes: [{ result: 'Ships are chartered within a week. The first cargoes land before prices peak. The local millers are not pleased.', fx: [['tycoon.ty_trade', 6], ['tycoon.ty_maker', -4]], flags: pick('drought', 'imports'), news: ['FG ORDERS EMERGENCY GRAIN IMPORTS', 'FOOD DEY COME FROM ABROAD'], archive: 'Ordered emergency grain imports when the rains failed.', sig: 2 }] },
    { id: 'cash', label: 'Cash for the poorest households in the North', naira: 0.25, outcomes: [{ result: 'Transfers reach two million households. Prices still climb; fewer people go hungry while they do.', fx: [['zone.NW.approval', 2], ['zone.NE.approval', 2]], flags: pick('drought', 'cash'), news: ['DROUGHT: CASH TRANSFERS FOR TWO MILLION FAMILIES', 'MONEY DON ENTER FOR NORTH FAMILIES'], archive: 'Sent cash to the poorest households when the harvest failed.', sig: 2 }] },
    { id: 'wait', label: 'Wait for the market to settle', outcomes: [{ result: 'The market settles at a higher price, eventually.', fx: [['bloc.street', -3]], flags: pick('drought', 'wait'), news: ['FOOD PRICES SOAR AS GOVERNMENT WAITS', 'GOVERNMENT DEY LOOK. FOOD DEY COST'], archive: 'Left the failed harvest to the market.', sig: 1 }] },
  ]),
  file('outbreak', 'An outbreak in three states', 'Federal Ministry of Health', [
    'A fever with no name yet has killed forty people in a fortnight. Cases are doubling every nine days.',
    { when: done('e1'), text: 'The ward clinics reported the first cluster within a day. That is why there are three states and not twelve.' },
    { when: { not: done('e1') }, text: 'The first cases were treated as malaria for two weeks, because there was nobody to test them.' },
    'Every month it spreads costs work, money and trust.',
  ], [
    { id: 'close', label: 'Close the affected cities for six weeks', pc: 8, outcomes: [{ result: 'The cities close. Markets empty. The curve bends within a month, and the traders never quite forgive it.', fx: [['nation.jobs', -2], ['bloc.street', -4]], flags: pick('outbreak', 'close'), news: ['THREE CITIES CLOSED TO CONTAIN OUTBREAK', 'LOCKDOWN! MARKET DON CLOSE'], archive: 'Closed three cities to contain an outbreak.', sig: 3 }] },
    { id: 'staff', label: 'Pay and staff the clinics at once', naira: 0.2, outcomes: [{ result: 'Nurses who had not been paid since spring are paid, and come back. Testing doubles in a week.', fx: [['pressure.wageGrievance', -5]], flags: pick('outbreak', 'staff'), news: ['HEALTH WORKERS PAID AS OUTBREAK RESPONSE SCALES UP', 'NURSES DON COLLECT SALARY. DEM DON RETURN'], archive: 'Paid and staffed the clinics in an outbreak.', sig: 2 }] },
    { id: 'calm', label: 'Reassure the public and carry on', outcomes: [{ result: 'The Minister of Health says there is no cause for alarm. The cases say otherwise.', fx: [['bloc.press', -4]], flags: pick('outbreak', 'calm'), news: ['MINISTER: "NO CAUSE FOR ALARM"', 'DEM SAY MAKE WE NO FEAR. WE DEY FEAR'], archive: 'Played down an outbreak.', sig: 1 }] },
  ]),
  file('flight', 'The money is leaving', 'Central Bank', [
    'Interest rates abroad have risen sharply. Foreign investors are selling naira assets as fast as the market will take them.',
    { when: v('fund.abroad', '>=', 2), text: 'There is enough saved abroad to defend the naira for a while.' },
    { when: v('fund.abroad', '<', 2), text: 'There is almost nothing saved abroad to defend it with.' },
    'Every month it runs, prices rise and every dollar owed gets dearer.',
  ], [
    { id: 'defend', label: 'Spend the savings defending the naira', requires: v('fund.abroad', '>=', 1), locked: 'There is not enough saved abroad to defend anything.', outcomes: [{ result: 'The central bank sells dollars every morning for a month. The naira holds. The savings do not.', fx: [['bloc.establishment', 4]], ops: [['fundmove', 'abroad', 'states', 0.5]], flags: pick('flight', 'defend'), news: ['CENTRAL BANK SPENDS RESERVES TO HOLD NAIRA', 'CBN DEY SELL DOLLAR TO SAVE NAIRA'], archive: 'Spent half the savings abroad defending the naira.', sig: 2 }] },
    { id: 'float', label: 'Let the naira find its level', pc: 6, outcomes: [{ result: 'The naira falls by a fifth in a week, and then stops. The money that was leaving starts to come back to buy cheap.', fx: [['nation.inflation', 2], ['approval', -2]], flags: pick('flight', 'float'), news: ['NAIRA FALLS 20% AS CBN STEPS BACK', 'NAIRA DON FALL. CBN SAY MAKE E FIND IN LEVEL'], archive: 'Let the naira float through capital flight.', sig: 3 }] },
    { id: 'controls', label: 'Impose capital controls', outcomes: [{ result: 'Dollars can no longer leave without approval. A parallel market opens the same afternoon, two streets from the central bank.', fx: [['bloc.establishment', -6], ['nation.integrity', -2], ['tycoon.ty_bank', -6]], flags: pick('flight', 'controls'), news: ['FG RESTRICTS DOLLAR OUTFLOWS', 'BLACK MARKET DON OPEN FOR DOLLAR'], archive: 'Imposed capital controls.', sig: 2 }] },
  ], 'grave', 'economy'),
  file('blackout', 'The grid has collapsed', 'Federal Ministry of Power', [
    'The national grid went down at 2.14 this morning. Most of the country has no public power.',
    { when: done('p2'), text: 'The rebuilt corridors are back first. The engineers say the rest will follow them.' },
    'Every month it limps, factories run on diesel or stop.',
  ], [
    { id: 'engineers', label: 'Fly in engineers and pay whatever it takes', naira: 0.2, outcomes: [{ result: 'Two hundred engineers are working within a week. Power returns region by region, fastest where the lines were newest.', fx: [['bloc.establishment', 2]], flags: pick('blackout', 'engineers'), news: ['EMERGENCY TEAMS RESTORE POWER REGION BY REGION', 'LIGHT DEY RETURN SMALL SMALL'], archive: 'Paid for an emergency restoration of the grid.', sig: 2 }] },
    { id: 'blame', label: 'Blame the operators publicly', outcomes: [{ result: 'You blame the operators. The operators blame the gas suppliers. The gas suppliers blame the pipelines. The grid stays down.', fx: [['bloc.press', -2]], flags: pick('blackout', 'blame'), news: ['PRESIDENT BLAMES OPERATORS FOR GRID FAILURE', 'NA BLAME DEY GIVE LIGHT NOW?'], archive: 'Blamed the operators for the grid collapse.', sig: 1 }] },
  ], 'grave', 'infrastructure'),
  file('border', 'A coup across the border', 'National Security Adviser', [
    'The army of the country across the northern border has seized power. Fighting has spread to the border districts, and refugees are crossing at forty points.',
    { when: done('s2'), text: 'The forward bases are within an hour of every crossing.' },
    'Every month it lasts, guns and fighters come across with the refugees.',
  ], [
    { id: 'close', label: 'Close the border and patrol it', pc: 4, outcomes: [{ result: 'The border is closed. It is a long border.', fx: [['zone.NW.approval', -2], ['tycoon.ty_trade', -4]], flags: pick('border', 'close'), news: ['FG CLOSES NORTHERN BORDER AFTER COUP', 'BORDER DON CLOSE. NOBODY PASS'], archive: 'Closed the northern border after the coup next door.', sig: 2 }] },
    { id: 'camps', label: 'Open camps for the refugees, away from the fighting', naira: 0.2, outcomes: [{ result: 'Camps open forty kilometres back from the border. The refugees are fed, counted and, mostly, disarmed.', fx: [['bloc.press', 3], ['approval', 1]], flags: pick('border', 'camps'), news: ['FG OPENS CAMPS FOR REFUGEES FROM NORTHERN NEIGHBOUR', 'CAMP DON OPEN FOR PEOPLE WEY DEY RUN WAR'], archive: 'Opened camps for refugees from the war next door.', sig: 2 }] },
    { id: 'ignore', label: 'It is not our war', outcomes: [{ result: 'It is not our war. Some of the people fighting it now live here.', flags: pick('border', 'ignore'), news: ['FG: "NOT OUR WAR"', 'GOVERNMENT SAY NA THEIR WAHALA'], archive: 'Stayed out of the war next door.', sig: 1 }] },
  ], 'grave', 'security'),
  file('discovery', 'A field offshore', 'Federal Ministry of Petroleum Resources', [
    'An exploration well forty miles offshore has struck a field the ministry describes as "transformational". The word has been used before.',
    { when: done('t2'), text: 'Under the law you passed, every barrel and every naira of it will be published.' },
    { when: { not: done('t2') }, text: 'The national oil company will account for it in the usual way, which is to say, eventually.' },
    'How much of it reaches the treasury depends on how the deal is signed and how clean the books are.',
  ], [
    { id: 'open', label: 'Sign it under published terms', pc: 6, outcomes: [{ result: 'The contract is published in full on the day it is signed. The bidders who wanted it private withdraw.', fx: [['nation.integrity', 2], ['tycoon.ty_fuel', -4]], flags: pick('discovery', 'open'), news: ['OFFSHORE FIELD CONTRACT PUBLISHED IN FULL', 'OIL CONTRACT DON DEY INTERNET. EVERYBODY SEE AM'], archive: 'Signed the new offshore field under published terms.', sig: 2 }] },
    { id: 'friend', label: 'Award it to a friendly operator', outcomes: [{ result: 'The licence goes to a company registered last month. Something arrives in the drawer. Less arrives in the treasury.', fx: [['tycoon.ty_fuel', 8], ['nation.integrity', -3], ['purse', 20]], flags: pick('discovery', 'friend'), exposure: { kind: 'personal', amount: 20, witnesses: ['fin'], trail: 2 }, news: ['NEW OFFSHORE LICENCE AWARDED', 'WHO GET THE OIL? NOBODY KNOW'], archive: 'Awarded the new offshore field to a friendly operator.', sig: 2 }] },
  ], 'dry', 'fortune'),
  file('remit', 'Money coming home', 'Central Bank', [
    'Money sent home by Nigerians abroad has reached a record. The naira has firmed for six weeks in a row.',
    'How much of it stays, and works, depends on how easy the banks make it.',
  ], [
    { id: 'welcome', label: 'Tell the banks to make it easy and cheap', pc: 3, outcomes: [{ result: 'Fees fall by half by directive. The banks complain, and then advertise it.', fx: [['tycoon.ty_bank', -3]], flags: pick('remit', 'welcome'), news: ['CBN HALVES FEES ON MONEY SENT HOME', 'TRANSFER FROM ABROAD DON CHEAP'], archive: 'Made it cheaper to send money home.', sig: 1 }] },
    { id: 'tax', label: 'Tax it', outcomes: [{ result: 'A levy on inbound transfers is announced. The money keeps coming, through other channels.', fx: [['nation.fiscalSpace', 0.1], ['approval', -2]], flags: pick('remit', 'tax'), news: ['FG ANNOUNCES LEVY ON MONEY SENT HOME', 'DEM WAN TAX THE MONEY WEY OUR PEOPLE SEND'], archive: 'Taxed money sent home.', sig: 1 }] },
  ], 'dry', 'fortune'),
  file('factory', 'The manufacturers are looking', 'Federal Ministry of Industry, Trade and Investment', [
    'Three global manufacturers are moving production out of Asia and have Nigeria on a shortlist of four.',
    { when: v('nation.power', '<', 55), text: 'Their scouts asked about power first, and did not like the answer.' },
    { when: v('nation.power', '>=', 55), text: 'Their scouts asked about power first, and wrote the answer down.' },
    'How many of them come depends on what they find when they land.',
  ], [
    { id: 'holiday', label: 'Offer a five-year tax holiday', pc: 4, outcomes: [{ result: 'The holiday is offered. Two of the three sign letters of intent.', fx: [['bonus.fiscal', -0.005]], flags: pick('factory', 'holiday'), news: ['FG OFFERS TAX HOLIDAY TO MANUFACTURERS', 'NO TAX FOR FIVE YEARS. COME BUILD FACTORY'], archive: 'Offered a tax holiday to win new factories.', sig: 2 }] },
    { id: 'squeeze', label: 'Let the ministers negotiate their own terms', outcomes: [{ result: 'The ministers negotiate. The terms include several consultancies. One of the three goes elsewhere.', fx: [['nation.integrity', -2], ['purse', 15]], flags: pick('factory', 'squeeze'), exposure: { kind: 'tolerated', amount: 15, witnesses: ['fin'], trail: 2 }, news: ['INVESTMENT TALKS DRAG ON', 'DEM DEY NEGOTIATE. WE DEY WAIT'], archive: 'Let the ministers negotiate their own terms with the manufacturers.', sig: 1 }] },
    { id: 'standard', label: 'Standard terms, no favours', outcomes: [{ result: 'Standard terms are offered. Whoever comes, comes for the country.', flags: pick('factory', 'standard'), news: ['FG: STANDARD TERMS FOR NEW INVESTORS', 'NO SPECIAL TREATMENT FOR ANYBODY'], archive: 'Offered new investors standard terms.', sig: 1 }] },
  ], 'dry', 'economy'),
  file('bumper', 'A bumper harvest', 'Federal Ministry of Agriculture', [
    'The rains were perfect and the farms were quiet. The harvest is the largest anyone at the ministry can remember.',
    { when: { not: done('f3') }, text: 'Without storage or roads, a good share of it will rot by the roadside, and farm-gate prices will collapse.' },
  ], [
    { id: 'reserve', label: 'Buy the surplus into the grain reserve', naira: 0.2, outcomes: [{ result: 'The reserve buys at a floor price. Farmers are paid, and next year\'s lean season has a cushion.', fx: [['zone.NC.approval', 2], ['zone.NW.approval', 2]], flags: pick('bumper', 'reserve'), news: ['FG BUYS RECORD HARVEST INTO RESERVE', 'GOVERNMENT DON BUY FARMERS CORN'], archive: 'Bought a record harvest into the grain reserve.', sig: 2 }] },
    { id: 'market', label: 'Let prices fall', outcomes: [{ result: 'Prices fall. City families eat better. Farmers sell at a loss.', fx: [['zone.NC.approval', -2]], flags: pick('bumper', 'market'), news: ['FOOD PRICES TUMBLE AFTER RECORD HARVEST', 'FOOD CHEAP. FARMERS DEY CRY'], archive: 'Let food prices fall after a record harvest.', sig: 1 }] },
  ], 'dry', 'fortune'),
  file('cup', 'Champions', 'Office of the Special Adviser, Media', [
    'The national team has won the continental cup on penalties. The country has stopped work to celebrate, and shows no sign of starting again.',
  ], [
    { id: 'holiday', label: 'Declare a public holiday and receive the team', outcomes: [{ result: 'The team is received at the Villa. You hold the trophy for the photograph, slightly too long.', fx: [['approval', 2], ['nation.jobs', -0.5]], flags: pick('cup', 'holiday'), news: ['PRESIDENT DECLARES HOLIDAY FOR CHAMPIONS', 'HOLIDAY! PRESIDENT DON DANCE WITH CUP'], archive: 'Declared a public holiday for the champions.', sig: 1 }] },
    { id: 'quiet', label: 'Congratulate them and let them have their day', outcomes: [{ result: 'A short statement. The day belongs to the players, and the country notices that you let it.', fx: [['bloc.press', 2]], flags: pick('cup', 'quiet'), news: ['PRESIDENT CONGRATULATES CHAMPIONS', 'PRESIDENT SAY WELL DONE'], archive: 'Congratulated the champions and stayed out of the photograph.', sig: 1 }] },
  ], 'farce', 'ceremonial'),
];
