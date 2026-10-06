import type { Cond, Fx } from '../engine/types';

// THE MONEY
// Five businessmen and women, each holding a part of the economy. They paid for
// somebody's campaign (possibly yours), they want something specific, and they
// can help or hurt in ways no minister can. All are composites with parody
// names; none is a portrait of any real person.

export interface Tycoon {
  id: string;
  name: string;
  short: string;
  /** What they control. */
  title: string;
  bio: string;
  /** What they do for you while they are with you (60 or better). */
  friendly: string;
  /** What they do to you once they have turned (below 35). */
  hostile: string;
  /** The rival they fund once they have turned. */
  funds: string;
  /** The newspaper they own, if any. */
  paper?: string;
  /** Things about your government that move them, while true. */
  moved: { when: Cond; d: number; text: string }[];
  want: { text: string; pc?: number; naira?: number; fx: Fx[]; done: string };
  squeeze: { name: string; fx: Fx[]; done: string };
}

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });

export const TYCOONS: Tycoon[] = [
  {
    id: 'ty_trade', name: 'Chief (Dr) Obinna Ezeudu', short: 'Ezeudu',
    title: 'Importer of rice, sugar, wheat and fertiliser',
    bio: 'Holds the licences for half of what the country eats. Has funded every winning presidential campaign in twenty years, and three of the losing ones.',
    friendly: 'Releases stock when prices run: inflation is about half a point lower.',
    hostile: 'His warehouses fill and the markets empty: inflation is more than a point higher. He funds Senator Dandume.',
    funds: 'strong',
    moved: [
      { when: v('ordered.duties', '==', 1), d: -16, text: 'You suspended the import duties his licences were built on.' },
      { when: v('agenda.f4', '==', 1), d: -20, text: 'Staples now come in automatically when prices spike.' },
      { when: v('agenda.t3', '==', 1), d: -24, text: 'You ended the waivers.' },
      { when: v('agenda.x5', '==', 1), d: -14, text: 'The tax service audited him on what he owns, not what he declared.' },
      { when: v('agenda.x13', '==', 1), d: 8, text: 'The amnesty let him declare what he had, cheaply.' },
      { when: v('agenda.c1', '==', 1), d: -8, text: 'Every contract is published now, including his.' },
      { when: v('agenda.i1', '==', 1), d: -8, text: 'Cargo clears the port in two days. His advantage was knowing whom to call.' },
      { when: v('venture.rice', '==', 1), d: -12, text: 'The country grows its own rice now.' },
      { when: v('nation.inflation', '>', 27), d: 6, text: 'Scarcity suits him.' },
    ],
    want: {
      text: 'A three-year exclusive licence to import rice.',
      fx: [['bonus.inflation', 1], ['nation.integrity', -3], ['bloc.party', 2]],
      done: 'The licence is gazetted on a Friday evening. By Monday there is one price for rice in the country, and it is his.',
    },
    squeeze: {
      name: 'Send Customs to count what is in his warehouses',
      fx: [['nation.fiscalSpace', 0.35], ['nation.integrity', 1.5]],
      done: 'Customs counts for nine days. The unpaid duty comes to ₦350bn, and he pays it by transfer, the same afternoon, without a word.',
    },
  },
  {
    id: 'ty_maker', name: 'Alhaji Kabir Birniwa', short: 'Birniwa',
    title: 'Manufacturer: flour, packaging, bottling and whatever is protected this year',
    bio: 'Employs sixty thousand people and reminds every government of it. Has enjoyed "pioneer status" for nineteen consecutive years.',
    friendly: 'Builds and hires: jobs and industry rise a little every month.',
    hostile: 'Closes lines and lets people go: jobs and industry fall every month. He funds Dr Malumfashi.',
    funds: 'alt',
    moved: [
      { when: v('agenda.i3', '==', 1), d: 14, text: 'Government now buys local first.' },
      { when: v('agenda.i2', '==', 1), d: 10, text: 'Cheap credit for manufacturers.' },
      { when: v('nation.power', '>', 50), d: 8, text: 'His factories run on the grid now, not on diesel.' },
      { when: v('agenda.i1', '==', 1), d: 6, text: 'His inputs clear the port in two days.' },
      { when: v('agenda.t3', '==', 1), d: -14, text: 'You ended the import waivers.' },
      { when: v('agenda.x6', '==', 1), d: -18, text: 'You abolished the tax holidays his factories ran on.' },
      { when: v('agenda.x7', '==', 1), d: 6, text: 'Incentives come by published rule now, and his factories qualify.' },
      { when: v('agenda.p3', '==', 1), d: -8, text: 'His factories now pay what electricity costs.' },
      { when: v('agenda.t1', '==', 1), d: -8, text: 'The tax office can see all of his companies at once.' },
      { when: v('ordered.tax', '==', 1), d: -8, text: 'You raised VAT on everything he sells.' },
    ],
    want: {
      text: 'Pioneer status for another ten years, and a ban on the imports that compete with him.',
      fx: [['bonus.fiscal', -0.02], ['nation.jobs', 3], ['nation.integrity', -2], ['bonus.inflation', 0.5]],
      done: 'The tax holiday is renewed and the import ban gazetted. He announces two new factories. The products cost a little more than the ones they replaced.',
    },
    squeeze: {
      name: 'Have the tax office reopen nineteen years of returns',
      fx: [['nation.fiscalSpace', 0.4], ['nation.jobs', -2]],
      done: 'The assessment runs to ₦400bn. He pays, and then pauses the expansion of two plants "pending clarity on the investment climate".',
    },
  },
  {
    id: 'ty_bank', name: 'Mrs Folake Adetoro', short: 'Adetoro',
    title: 'Chairs the largest bank and speaks for the other twenty',
    bio: 'Her bank holds a tenth of the government\'s domestic debt and most of its ministers\' mortgages. Has never raised her voice. Has never needed to.',
    friendly: 'The bond auctions go well: domestic debt costs less to service, and the establishment warms.',
    hostile: 'The banks ask for more to hold your paper: domestic debt costs more, and the establishment cools. She funds Dr Malumfashi.',
    funds: 'alt',
    moved: [
      { when: v('ordered.print', '==', 1), d: -18, text: 'You had the central bank create money.' },
      { when: { flag: 'print.renounced' }, d: 8, text: 'You renounced central bank financing.' },
      { when: v('debt.ways', '<', 2), d: 10, text: 'The central bank overdraft is nearly gone.' },
      { when: v('nation.debt', '>', 85), d: -12, text: 'She has begun to wonder whether she will be repaid.' },
      { when: v('nation.debt', '<', 55), d: 10, text: 'The government\'s paper is sound.' },
      { when: v('agenda.t4', '==', 1), d: 10, text: 'There is a debt ceiling in law.' },
      { when: v('agenda.y1', '==', 1), d: -10, text: 'The agency deposits her banks held have gone into one treasury account.' },
      { when: v('agenda.y4', '==', 1), d: 6, text: 'The government borrows on a published calendar.' },
      { when: v('agenda.x5', '==', 1), d: -8, text: 'The tax service reads the accounts of her customers.' },
      { when: v('agenda.d4', '==', 1), d: -14, text: 'A public payments rail takes the fees her banks lived on.' },
      { when: v('agenda.c2', '==', 1), d: -8, text: 'The new courts are hearing cases about bank loans to politicians.' },
      { when: v('nation.inflation', '>', 30), d: -8, text: 'Inflation is eating her loan book.' },
    ],
    want: {
      text: 'Two more years before the banks must admit which of their loans are bad.',
      fx: [['bloc.establishment', 4], ['nation.integrity', -2], ['bonus.jobs', -0.01]],
      done: 'The circular is issued. Several banks that were insolvent on Friday are sound on Monday.',
    },
    squeeze: {
      name: 'Order a stress test of the banks and publish it',
      fx: [['nation.fiscalSpace', 0.2], ['nation.integrity', 2], ['bloc.establishment', -6]],
      done: 'The results are published. Four banks fail. Their owners are made to find new capital, and the levy for the test goes to the treasury.',
    },
  },
  {
    id: 'ty_fuel', name: 'Chief Tonye Amangala', short: 'Amangala',
    title: 'Fuel importer: depots, tankers and a jetty',
    bio: 'Supplies a third of the country\'s petrol. Has been paid subsidy on cargoes that never landed by four administrations, and regards it as a pension.',
    friendly: 'His depots stay full: the risk of fuel scarcity falls every month.',
    hostile: 'His depots are "under maintenance": the risk of fuel scarcity rises every month. He funds Senator Dandume.',
    funds: 'strong',
    moved: [
      { when: { flag: 'policy.subsidy', is: 'removed' }, d: -18, text: 'You ended the subsidy, and his claims with it.' },
      { when: { flag: 'policy.subsidy', is: 'full' }, d: 14, text: 'The pump price is frozen and somebody must be paid the difference.' },
      { when: v('agenda.i5', '==', 1), d: -24, text: 'The country refines its own petrol. Nobody needs his jetty.' },
      { when: v('agenda.t2', '==', 1), d: -14, text: 'The oil company publishes its accounts. His arrangements with it are in them.' },
      { when: v('venture.cng', '==', 1), d: -10, text: 'A million vehicles no longer buy what he sells.' },
      { when: { chose: ['petrol.scarcity', 'pay'] }, d: 8, text: 'You paid the marketers\' claims.' },
    ],
    want: {
      text: '₦600bn in old subsidy claims, paid without verification.', naira: 0.6,
      fx: [['pressure.fuelSupplyStress', -20], ['nation.integrity', -3]],
      done: 'The claims are paid as presented. The tankers load the same night. Nobody asks which cargoes they were for.',
    },
    squeeze: {
      name: 'Audit his subsidy claims back to the first one',
      fx: [['nation.fiscalSpace', 0.5], ['nation.integrity', 2], ['pressure.fuelSupplyStress', 14]],
      done: 'The auditors find eleven cargoes that were paid for and never discharged. He refunds ₦500bn. His depots develop faults.',
    },
  },
  {
    id: 'ty_media', name: 'Otunba Gbenga Oyewole', short: 'Oyewole',
    title: 'Telecoms and media: a network, a television station and The Daily Stakeholder',
    bio: 'Decides what forty million people see before breakfast. Describes himself as a friend of every government, always in the present tense.',
    friendly: 'The Daily Stakeholder is on your side, and the press as a whole is a little warmer every month.',
    hostile: 'The Daily Stakeholder turns on you, and the press cools every month. He funds whoever is leading the opposition.',
    funds: 'lead',
    paper: 'stakeholder',
    moved: [
      { when: { flag: 'press.gag' }, d: -24, text: 'You sent a bill to gag the online press.' },
      { when: v('agenda.d1', '==', 1), d: 10, text: 'Fibre reaches every local government, on poles he does not have to pay governors for.' },
      { when: v('agenda.d2', '==', 1), d: 6, text: 'The Startup Act.' },
      { when: v('agenda.d4', '==', 1), d: -12, text: 'A public payments rail competes with his own.' },
      { when: v('agenda.c3', '==', 1), d: -8, text: 'Asset declarations are public. He would rather his were not.' },
      { when: v('approval', '>', 55), d: 8, text: 'He backs winners.' },
      { when: v('approval', '<', 38), d: -10, text: 'He does not back losers.' },
    ],
    want: {
      text: 'His spectrum licence renewed at the price he paid in 2011.',
      fx: [['bonus.fiscal', -0.012], ['nation.integrity', -2], ['bloc.press', 3]],
      done: 'The licence is renewed at the old price. The Daily Stakeholder discovers that you have been underrated.',
    },
    squeeze: {
      name: 'Have the regulator price his spectrum at the market',
      fx: [['nation.fiscalSpace', 0.45], ['bloc.press', -5]],
      done: 'The regulator sets a market price and he pays ₦450bn. His television station begins a series on the cost of the presidential fleet.',
    },
  },
];

export const TYCOON_BY_ID = Object.fromEntries(TYCOONS.map((t) => [t.id, t]));

/** Who paid for the campaign, by the kind of politician the President was. */
export const FINANCIER: Record<string, string> = {
  governor: 'ty_trade', legislator: 'ty_fuel', technocrat: 'ty_bank', outsider: 'ty_media',
};
