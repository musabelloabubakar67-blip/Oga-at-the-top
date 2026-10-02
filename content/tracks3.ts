import type { Track } from '../engine/types';

// Four tracks where the items can be taken in any order, and where not everything
// on the list is good for the country. Some are what the party, the street or a
// businessman wants. They pay at once and cost for good, and the costs are shown.

const SENATE = { needs: { v: ['senate', '>=', 50] as [string, '>=', number] }, needsText: 'You do not have the Senate. Win over your senators first.' };

export const LOOSE_TRACKS: Track[] = [
  {
    id: 'federation', name: 'Restructure the Federation', goal: 'Who holds power, and where', metric: 'nation.capacity', loose: true,
    milestones: [
      {
        id: 'r1', name: 'Pay the local governments directly', pc: 10, naira: 0, months: 5,
        blurb: 'Council money goes to councils, not through the governors\' joint accounts. Every governor in the country will oppose it, including yours.',
        start: [['bloc.party', -5], ['person.gov_ss', -8], ['person.gov_nw', -8], ['person.gov_sw', -8]],
        done: [['nation.capacity', 4], ['bloc.street', 5], ['nation.integrity', 3], ['bonus.jobs', 0.02], ['person.gov_ne', -6], ['person.gov_nc', -6], ['person.gov_se', -6]],
        news: ['COUNCILS RECEIVE ALLOCATIONS DIRECTLY FOR FIRST TIME', 'LOCAL GOVERNMENT MONEY NO DEY PASS GOVERNOR HAND AGAIN'],
        archive: 'Paid local governments directly, over the governors\' objections.',
      },
      {
        id: 'r2', name: 'Create six new states', pc: 4, naira: 0.4, months: 8, popular: true, ...SENATE,
        blurb: 'One in each zone. Six new governors, six assemblies, six sets of commissioners, and a capital city each. The party has wanted this for thirty years. None of the six could pay its own salaries.',
        start: [['bloc.party', 6]],
        done: [['bloc.party', 9], ['approval', 4], ['person.sen_pres', 8], ['person.sen_lead', 6], ['bonus.fiscal', -0.04], ['nation.capacity', -4], ['nation.integrity', -2]],
        news: ['SIX NEW STATES CREATED; CAPITALS NAMED', 'SIX NEW STATE! SIX NEW GOVERNOR TO FEED'],
        archive: 'Created six new states, none of which could pay its own way.',
      },
      {
        id: 'r3', name: 'Resource control: producing states keep a quarter', pc: 12, naira: 0, months: 7, ...SENATE,
        blurb: 'Derivation rises from 13% to 25%. It may be the only thing that quiets the creeks for good. It comes out of the centre\'s share and the North\'s, and the North will say so.',
        start: [['zone.NW.approval', -3], ['zone.NE.approval', -3]],
        done: [['theatre.SS', -12], ['zone.SS.approval', 10], ['person.gov_ss', 15], ['bonus.fiscal', -0.035], ['zone.NW.approval', -4], ['zone.NE.approval', -4], ['person.gov_nw', -8]],
        news: ['DERIVATION RAISED TO 25%; OIL STATES CELEBRATE', 'NIGER DELTA GO NOW KEEP QUARTER OF THE OIL MONEY'],
        archive: 'Raised derivation to 25% for the oil-producing states.',
      },
      {
        id: 'r4', name: 'Results transmitted from the polling unit, by law', pc: 12, naira: 0.1, months: 6, ...SENATE,
        blurb: 'Every result sheet photographed and published before it leaves the polling unit. It is the reform every opposition demands and every incumbent postpones. You are the incumbent.',
        start: [['bloc.party', -6]],
        done: [['nation.integrity', 6], ['bloc.press', 7], ['bloc.street', 4], ['bloc.party', -6], ['bloc.establishment', 3], ['rival.fire', -5]],
        flags: { 'electoral.reform': true },
        news: ['ELECTORAL ACT AMENDED: RESULTS TO BE PUBLISHED AT THE POLLING UNIT', 'NO MORE "SERVER ISSUE". RESULT GO SHOW FOR POLLING UNIT'],
        archive: 'Made polling-unit results public by law, against your own party\'s interest.',
      },
      {
        id: 'r5', name: 'A part-time legislature', pc: 22, naira: 0, months: 10,
        needs: { v: ['senate', '>=', 62] }, needsText: 'The Senate will not vote to halve itself unless nearly all of it is yours.',
        blurb: 'Legislators sit ninety days a year and are paid for ninety days. The most popular idea in the country and the least popular in the building that must pass it.',
        start: [['person.sen_pres', -12], ['person.sen_approp', -12], ['bloc.party', -6]],
        done: [['approval', 7], ['bloc.street', 9], ['bonus.fiscal', 0.03], ['nation.integrity', 3], ['person.sen_lead', -10], ['person.sen_rebel', -10]],
        news: ['NATIONAL ASSEMBLY GOES PART-TIME', 'SENATORS GO NOW WORK NINETY DAYS, COLLECT NINETY DAYS PAY'],
        archive: 'Made the National Assembly part-time.',
      },
    ],
  },
  {
    id: 'welfare', name: 'Relief for the People', goal: 'Cash, prices and comfort', metric: 'bloc.street', loose: true,
    milestones: [
      {
        id: 'h1', name: 'A price control board for staple foods', pc: 2, naira: 0.1, months: 3, popular: true,
        blurb: 'Rice, garri, bread and cooking oil sold at the government\'s price or not at all. The street will cheer on the day. Traders will sell at that price for about a fortnight, and then stop selling.',
        done: [['approval', 5], ['bloc.street', 7], ['bonus.inflation', 1.5], ['nation.jobs', -4], ['tycoon.ty_trade', -12], ['nation.integrity', -2], ['bloc.establishment', -5]],
        news: ['PRICE CONTROL BOARD FIXES COST OF RICE, BREAD, GARRI', 'GOVERNMENT DON FIX PRICE. NOW THE RICE DON DISAPPEAR'],
        archive: 'Set up a price control board for staple foods.',
      },
      {
        id: 'h2', name: 'A pump price fixed by Act of the Assembly', pc: 3, naira: 0, months: 4, popular: true,
        blurb: 'The price of petrol written into law, so that no President can raise it again without the Senate. Nothing you could sign would be more popular. The difference is paid by the Treasury, every month, for ever.',
        done: [['approval', 7], ['bloc.street', 10], ['bonus.fiscal', -0.05], ['tycoon.ty_fuel', 12], ['bloc.establishment', -9], ['tycoon.ty_bank', -6], ['pressure.wageGrievance', -10]],
        news: ['PETROL PRICE NOW FIXED BY LAW', 'FUEL PRICE DON ENTER LAW. NOBODY FIT INCREASE AM'],
        archive: 'Fixed the pump price by Act of the Assembly.',
      },
      {
        id: 'h3', name: 'A monthly transfer to the ten million poorest households', pc: 4, naira: 0.5, months: 7,
        blurb: 'Paid to a verified identity, published by ward. It costs money every year and there is no ribbon to cut. Children stay in school and small traders restock.',
        done: [['bloc.street', 8], ['approval', 4], ['bonus.fiscal', -0.03], ['bonus.jobs', 0.025], ['pressure.wageGrievance', -10], ['nation.jobs', 3]],
        news: ['TEN MILLION HOUSEHOLDS NOW RECEIVE MONTHLY TRANSFER', 'ALERT DEY ENTER EVERY MONTH FOR POOR PEOPLE. E REAL'],
        archive: 'Began a monthly cash transfer to the ten million poorest households.',
      },
      {
        id: 'h4', name: 'A ₦150,000 minimum wage, by order', pc: 3, naira: 0.3, months: 3, popular: true,
        blurb: 'More than double, for everyone, at once. Labour will carry you shoulder high. The states cannot pay it and most employers will not, and those who can will employ fewer people.',
        done: [['bloc.street', 11], ['approval', 5], ['pressure.wageGrievance', -30], ['nation.jobs', -6], ['bonus.inflation', 1], ['bonus.fiscal', -0.025], ['tycoon.ty_maker', -12], ['person.gov_nw', -6], ['person.gov_ne', -6], ['person.gov_se', -6]],
        news: ['MINIMUM WAGE NOW ₦150,000', '₦150K MINIMUM WAGE! WHO GO PAY AM NA ANOTHER MATTER'],
        archive: 'Ordered a ₦150,000 minimum wage.',
      },
      {
        id: 'h5', name: 'A million homes, on mortgages people can get', pc: 6, naira: 1.2, months: 16,
        blurb: 'Land titles that can be registered in a week, and twenty-year loans at single digits. The banks will need persuading, and then they will want all of it.',
        done: [['nation.jobs', 10], ['approval', 4], ['bonus.jobs', 0.04], ['tycoon.ty_bank', 6], ['bloc.street', 4]],
        news: ['FIRST 200,000 FAMILIES MOVE INTO MORTGAGE HOMES', 'ORDINARY PERSON DON GET HOUSE LOAN. FOR NIGERIA'],
        archive: 'Built a million homes on long mortgages.',
      },
    ],
  },
  {
    id: 'order', name: 'Order and National Pride', goal: 'Discipline, borders and the flag', metric: 'approval', loose: true,
    milestones: [
      {
        id: 'o1', name: 'A law against "falsehood" on the internet', pc: 5, naira: 0, months: 4, popular: true, ...SENATE,
        blurb: 'Fines and prison for publishing what a minister certifies to be false. Your own people have drafted it and are keen. It would make your worst weeks quieter, and it would be used by every President after you.',
        start: [['bloc.villa', 4], ['bloc.press', -5]],
        done: [['pressure.scandalHeat', -18], ['bloc.villa', 4], ['bloc.press', -12], ['bloc.street', -8], ['nation.integrity', -4], ['rival.fire', 9], ['bloc.establishment', -3]],
        news: ['INTERNET FALSEHOOD ACT SIGNED; FIRST ARRESTS MADE', 'TALK TRUE FOR ONLINE, GO PRISON. NA THE NEW LAW'],
        archive: 'Signed a law against "falsehood" on the internet.',
      },
      {
        id: 'o2', name: 'Close the land borders, permanently', pc: 3, naira: 0.1, months: 3, popular: true,
        blurb: 'Nothing comes in by road. The manufacturers have asked for it for years and will be grateful. Food from the neighbours stops, prices rise, and the smugglers pay the same officers a little more.',
        done: [['tycoon.ty_maker', 12], ['nation.jobs', 3], ['bonus.inflation', 2], ['tycoon.ty_trade', -8], ['zone.NW.approval', -4], ['theatre.NW', 4], ['nation.integrity', -2]],
        news: ['LAND BORDERS CLOSED "UNTIL FURTHER NOTICE"', 'BORDER DON CLOSE. RICE DON COST. SMUGGLER STILL DEY PASS'],
        archive: 'Closed the land borders permanently.',
      },
      {
        id: 'o3', name: 'Ranching law and grazing reserves', pc: 12, naira: 0.6, months: 10, ...SENATE,
        blurb: 'Open grazing ends; ranches are built and paid for. It goes to the root of the killing in the farm belt. Herders\' leaders and half the northern caucus will call it an attack on a way of life.',
        start: [['zone.NW.approval', -4], ['person.gov_nw', -8]],
        done: [['theatre.NC', -14], ['zone.NC.approval', 8], ['person.gov_nc', 12], ['bonus.inflation', -1], ['zone.NW.approval', -3], ['nation.jobs', 3]],
        news: ['FARM-BELT ATTACKS FALL AS RANCHES OPEN', 'COW DON GET HIM OWN HOUSE. FARMER FIT SLEEP'],
        archive: 'Ended open grazing and built ranches.',
      },
      {
        id: 'o4', name: 'A national airline and a national shipping line', pc: 2, naira: 0.5, months: 6, popular: true,
        blurb: 'By Act, with boards of forty each. The party has the board lists ready. The last national airline left debts that were still being paid twenty years later.',
        start: [['bloc.party', 4]],
        done: [['approval', 3], ['bloc.party', 7], ['bonus.fiscal', -0.03], ['nation.integrity', -3], ['debt.contractors', 0.4], ['bloc.press', -3]],
        news: ['NATIONAL AIRLINE, SHIPPING LINE ESTABLISHED BY LAW', 'WE GET AIRLINE AGAIN. HOW MANY PLANE? TWO'],
        archive: 'Established a national airline and a national shipping line.',
      },
      {
        id: 'o5', name: 'The death penalty for corruption', pc: 4, naira: 0, months: 4, popular: true, ...SENATE,
        blurb: 'The crowd wants it and will love you for it. Judges who would not convict for ten years will certainly not convict for death, and every case will now take longer. Your own party will ask whom it is meant for.',
        start: [['bloc.party', -6]],
        done: [['approval', 6], ['bloc.street', 9], ['nation.integrity', -3], ['bloc.establishment', -5], ['bloc.press', -3], ['nation.capacity', -1]],
        news: ['DEATH PENALTY FOR CORRUPTION SIGNED INTO LAW', 'IF YOU THIEF GOVERNMENT MONEY, NA ROPE. SO DEM TALK'],
        archive: 'Signed the death penalty for corruption into law.',
      },
    ],
  },
  {
    id: 'resources', name: 'Beyond Oil', goal: 'Gas, minerals and the sea', metric: 'nation.jobs', loose: true,
    milestones: [
      {
        id: 'g1', name: 'End gas flaring: pipe it to plants and kitchens', pc: 6, naira: 0.7, months: 12,
        blurb: 'The gas burned off in the creeks every night would run a third of the grid. Capture it, pipe it and sell it.',
        done: [['nation.power', 6], ['bonus.power', 0.03], ['bonus.fiscal', 0.012], ['zone.SS.approval', 4], ['nation.jobs', 3]],
        news: ['FLARES GO OUT ACROSS THE DELTA AS GAS REACHES POWER PLANTS', 'THE FIRE WEY DEY BURN FOR CREEK DON QUENCH'],
        archive: 'Ended gas flaring and piped the gas to power plants and homes.',
      },
      {
        id: 'g2', name: 'Mining licences auctioned in public', pc: 9, naira: 0.2, months: 8,
        blurb: 'Every gold, lithium and tin licence bid for in the open, and the old ones reviewed. Much of the illegal mining in the North West belongs to people you know.',
        start: [['person.gov_nw', -8], ['bloc.party', -4]],
        done: [['bonus.fiscal', 0.02], ['nation.jobs', 5], ['theatre.NW', -5], ['nation.integrity', 3], ['bloc.establishment', 4]],
        news: ['FIRST PUBLIC MINING AUCTION RAISES ₦400BN', 'GOLD LICENCE NOW NA AUCTION. BIG MEN DEY VEX'],
        archive: 'Auctioned mining licences in public and reviewed the old ones.',
      },
      {
        id: 'g3', name: 'Ban the export of every raw commodity', pc: 3, naira: 0, months: 3, popular: true,
        blurb: 'No cocoa, cashew, sesame or ore leaves unprocessed. It sounds like industrial policy and the manufacturers will applaud. There are not the factories to process any of it, and the farmers will have nobody to sell to.',
        done: [['approval', 3], ['tycoon.ty_maker', 9], ['bonus.fiscal', -0.025], ['nation.jobs', -5], ['zone.SW.approval', -3], ['zone.NC.approval', -3], ['bloc.establishment', -6]],
        news: ['FG BANS EXPORT OF ALL RAW COMMODITIES', 'COCOA FARMER NO FIT SELL OUTSIDE AGAIN. WHO GO BUY?'],
        archive: 'Banned the export of all raw commodities.',
      },
      {
        id: 'g4', name: 'Sell the state\'s shares in the oil joint ventures', pc: 8, naira: 0, months: 6,
        blurb: 'About ₦3.5tn, in cash, in your term. In exchange the Treasury gives up that share of oil revenue in every term after it. Whether this is prudence or pawning depends entirely on what you do with the money.',
        start: [['bloc.street', -3]],
        done: [['nation.fiscalSpace', 3.5], ['bonus.fiscal', -0.045], ['bloc.establishment', 6], ['bloc.street', -4], ['tycoon.ty_bank', 5]],
        news: ['FG SELLS JOINT VENTURE STAKES FOR ₦3.5TN', 'GOVERNMENT DON SELL OIL SHARE. THE MONEY, WHERE E DEY GO?'],
        archive: 'Sold the state\'s shares in the oil joint ventures.',
      },
      {
        id: 'g5', name: 'A fishing fleet, shipyards and coastal ports', pc: 5, naira: 0.9, months: 15,
        blurb: 'The country imports most of its fish and repairs its ships abroad. Slow, unglamorous, and it employs the young men the creeks otherwise employ.',
        done: [['nation.jobs', 9], ['bonus.jobs', 0.04], ['zone.SS.approval', 5], ['theatre.SS', -5], ['bonus.inflation', -0.5]],
        news: ['FIRST NIGERIAN-BUILT TRAWLERS LAUNCHED', 'WE DON DEY BUILD SHIP. FISH GO CHEAP SMALL'],
        archive: 'Built a fishing fleet, shipyards and coastal ports.',
      },
    ],
  },
];
