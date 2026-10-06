// WHAT THE STATE OWNS (plan 11)
// Property, equipment, enterprise stakes, concessions and rights the federal
// government could sell, lease or pledge to raise money. Each has a fair value
// (₦tn, at the game's scale), what it earns or costs the treasury each month
// while it is owned, and what makes selling it more than a transaction. Selling
// removes the ownership and the income; a concession keeps the ownership and
// gives up the income for its term. Nothing here is free money: every naira
// raised is something the next government no longer owns.

export type HoldingKind = 'property' | 'equipment' | 'stake' | 'concession' | 'right';
export type SaleMethod = 'auction' | 'expedited' | 'negotiated' | 'concession' | 'minority';

export interface Holding {
  id: string;
  name: string;
  kind: HoldingKind;
  /** Fair value of the whole holding, ₦tn. */
  value: number;
  /** ₦tn a month to the treasury while owned (negative: it costs money to keep). */
  income: number;
  /** The share of the state's oil income that comes with it (oil stakes only). */
  oilShare?: number;
  /** What the holding is for, and why selling it is not only about price. */
  note: string;
  /** If set, the holding serves people or is occupied: a sale has a public cost. */
  essential?: string;
  /** How it can be sold. A stake can only be sold in part ('minority') or listed. */
  methods: SaleMethod[];
  /** Businessmen who would bid. */
  buyers: string[];
  /** The big bet that brings it back to life. Once that bet is won it is a working plant: worth more, and its earnings are the operating asset's. */
  revives?: string;
}

// THE THREE STATE REFINERIES
// Each is its own holding and its own big bet: reviving one does not revive the
// others, and selling one closes only its own rehabilitation. A revived plant
// sells for what a working plant is worth.
export const REFINERIES: { holding: string; venture: string; state: string; name: string; note: string }[] = [
  { holding: 'refinery_rivers', venture: 'refinery', state: 'RI', name: 'The Rivers refinery', note: 'The largest of the three, on the creeks. It has lost money for twenty years.' },
  { holding: 'refinery_delta', venture: 'refinery_delta', state: 'DE', name: 'The Delta refinery', note: 'Fed by a pipeline through the swamps, which is tapped more often than it flows.' },
  { holding: 'refinery_kaduna', venture: 'refinery_kaduna', state: 'KD', name: 'The Kaduna refinery', note: 'Six hundred kilometres of pipeline from the coast. Crude has not arrived in years.' },
];
/** What a working, revived plant is worth to a buyer, ₦tn. */
export const REVIVED_VALUE = 0.9;
export const REFINERY_OF_VENTURE: Record<string, string> = Object.fromEntries(REFINERIES.map((r) => [r.venture, r.holding]));

export const HOLDINGS: Holding[] = [
  {
    id: 'federal_properties', name: 'Idle federal property', kind: 'property', value: 0.9, income: 0.0005,
    note: 'Eleven thousand buildings and plots in Lagos and Abuja, most empty since the capital moved.',
    essential: 'Some are occupied by former ministers and retired permanent secretaries, who will need to be moved.',
    methods: ['auction', 'expedited', 'negotiated'], buyers: ['ty_bank', 'ty_trade', 'ty_media'],
  },
  {
    id: 'hotels', name: 'Four federal hotels', kind: 'property', value: 0.3, income: 0.0004,
    note: 'Built for conferences in the 1980s, occupied mostly by conferences about the hotels.',
    methods: ['auction', 'expedited', 'negotiated', 'concession'], buyers: ['ty_bank', 'ty_trade'],
  },
  {
    id: 'aircraft', name: 'The government aircraft fleet', kind: 'equipment', value: 0.12, income: -0.002,
    note: 'Eleven aircraft, of which four fly. Maintenance is paid monthly whether they fly or not.',
    essential: 'Ministers will have to fly commercial, and will say so.',
    methods: ['auction', 'expedited', 'negotiated'], buyers: ['ty_trade', 'ty_maker'],
  },
  {
    id: 'noc', name: 'The national oil company', kind: 'stake', value: 6, income: 0, oilShare: 0.15,
    note: 'Wholly owned. Its profits are part of the oil revenue the treasury receives.',
    essential: 'The largest company in the country. Selling any of it is a political event, and a majority would need the Assembly.',
    methods: ['minority'], buyers: ['ty_bank', 'ty_fuel'],
  },
  {
    id: 'jv_stakes', name: 'Stakes in the oil joint ventures', kind: 'stake', value: 3.5, income: 0, oilShare: 0.25,
    note: 'The state\'s share of the fields it operates with foreign partners. A quarter of oil income flows through them.',
    methods: ['auction', 'minority'], buyers: ['ty_fuel', 'ty_bank'],
  },
  {
    id: 'discos', name: 'The state\'s 40% in the electricity distribution companies', kind: 'stake', value: 0.4, income: 0,
    note: 'Kept when distribution was privatised. It earns nothing; it gives the state a voice on the boards.',
    methods: ['auction', 'negotiated'], buyers: ['ty_maker', 'ty_bank'],
  },
  {
    id: 'ports', name: 'Port terminal concessions, up for renewal', kind: 'concession', value: 0.6, income: 0.003,
    note: 'The terminals pay the ports authority a monthly fee. Renewing the concessions early brings an upfront payment and gives up the fees.',
    methods: ['concession'], buyers: ['ty_trade', 'ty_maker'],
  },
  {
    id: 'airports', name: 'The four main airports', kind: 'concession', value: 0.5, income: 0.002,
    note: 'Run by a federal agency. A concession to an operator brings money now and lets the operator keep the fees.',
    essential: 'Fares and airport charges will rise under an operator.',
    methods: ['concession'], buyers: ['ty_trade', 'ty_bank'],
  },
  {
    id: 'spectrum', name: 'Unsold broadband spectrum', kind: 'right', value: 0.45, income: 0,
    note: 'Frequencies the state has never auctioned. Sold properly, they fetch their value once.',
    methods: ['auction', 'negotiated'], buyers: ['ty_media', 'ty_bank'],
  },
  ...REFINERIES.map((r): Holding => ({
    id: r.holding, name: r.name, kind: 'equipment', value: 0.17, income: -0.0013,
    note: `${r.note} A buyer who can run it is worth more than the price.`,
    essential: 'The refinery unions will picket any sale.',
    methods: ['auction', 'negotiated'], buyers: ['ty_fuel', 'ty_maker'],
    revives: r.venture,
  })),
];

export const HOLDING_BY_ID: Record<string, Holding> = Object.fromEntries(HOLDINGS.map((h) => [h.id, h]));

/** What each sale method means, as the Treasury explains it. */
export const METHOD: Record<SaleMethod, { name: string; text: string; price: number; months: number }> = {
  auction: { name: 'Open auction', text: 'Advertised, with bidders, a reserve price and due diligence. The fairest price, and the slowest.', price: 1, months: 4 },
  expedited: { name: 'Expedited competitive sale', text: 'A short tender to the bidders already known. Faster, and the buyers know you are in a hurry.', price: 0.8, months: 1 },
  negotiated: { name: 'Negotiated sale to one buyer', text: 'One buyer, chosen by the Presidency, at a price agreed in private. Fast, cheap, and remembered.', price: 0.7, months: 1 },
  concession: { name: 'Concession or lease', text: 'An operator pays upfront for the right to run it and keep its income for ten years. The state keeps the ownership.', price: 0.35, months: 2 },
  minority: { name: 'Minority stake sale', text: 'Up to a fifth of the stake is sold to investors at a time. The state keeps control, and loses that share of the income.', price: 0.9, months: 3 },
};

/** Taxes owed and established by assessment: collectable, slowly, at a political cost (₦tn at the start). */
export const TAX_ARREARS_START = 0.6;
