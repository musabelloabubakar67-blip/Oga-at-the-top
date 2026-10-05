// ROUTES TO POWER AND THE MONEY BEHIND THEM (plan 02.A3, 02.A4)
// Today the professional background silently picks the campaign's financier
// (`FINANCIER` in content/tycoons.ts). The plan separates three things:
//   - background: what the President did before (kept as it is);
//   - route: which coalition actually won the election, and what it expects;
//   - financier: who paid, chosen deliberately, including small contributors.
// Each choice has stated strengths, stated costs, starting effects, and what is
// owed. Owing is a favour; a stated expectation is a commitment, stored so the
// register shows it and a later file can be judged against it.
//
// Status: authored content. The setup steps that offer these choices, and the
// application of their effects, favours and commitments, wait on contract R6.
// Every number here is a proposal for Codex to agree before it lands (plan 09:
// economic parameters are agreed with the engine owner). Nothing reads this file yet.

import type { Fx } from '../engine/types';
import { TYCOON_BY_ID } from './tycoons';

/** The businessman's standing demand, quoted from content/tycoons.ts so it cannot drift. */
const asks = (id: string) => `What will be asked in return: ${TYCOON_BY_ID[id].want.text.replace(/^./, (c) => c.toLowerCase())}`;

export type RouteId = 'establishment' | 'coalition' | 'mobilisation' | 'continuity';
export type FinancierId = 'ty_trade' | 'ty_maker' | 'ty_bank' | 'ty_fuel' | 'ty_media' | 'small';

/** A favour the new government starts owing: who, how much (1–3), and why. */
export interface StartingDebt { who: string; size: 1 | 2 | 3; why: string }

/** An expectation the new government starts under, stored as a commitment. */
export interface StartingCommitment {
  object: string;
  text: string;
  /** Who is responsible: an office key the contract resolves to a person. */
  responsible: string;
  afterMonths: number;
  visibility: 'public' | 'private';
}

export interface Route {
  id: RouteId;
  name: string;
  /** How the election was won, in one sentence the certificate can quote. */
  howWon: string;
  strengths: string;
  costs: string;
  /** Proposed starting effects. */
  fx: Fx[];
  owes: StartingDebt[];
  commitments: StartingCommitment[];
  /** When this route is open to a new President. Absent: always. */
  onlyWhen?: { scenarios?: string[]; successorSameParty?: boolean };
  /** Why it is closed, shown on the choice. */
  closedText?: string;
}

export interface Financier {
  id: FinancierId;
  label: string;
  /** What they paid for, and what they will expect, in one line. */
  terms: string;
  strengths: string;
  costs: string;
  fx: Fx[];
  owes: StartingDebt[];
  commitments: StartingCommitment[];
  /** The route this financier usually goes with, for the default. Never forced. */
  usualRoute?: RouteId;
}

export const ROUTES: Route[] = [
  {
    id: 'establishment', name: 'The party machine',
    howWon: 'The party\'s governors and the national executive delivered their states and their delegates.',
    strengths: 'A party that answers your calls, governors who start on your side, and delegates when the primary comes.',
    costs: 'The governors delivered and will say so. The street did not choose you so much as accept you.',
    fx: [['bloc.party', 8], ['bloc.street', -4], ['person.gov_ss', 6], ['person.gov_nw', 4], ['person.gov_sw', 4]],
    // The Governors' Forum debt already exists in every game today (initTycoons); under this route it is the route's debt.
    owes: [{ who: 'gov_ss', size: 2, why: 'Koroye\'s Governors\' Forum delivered three states for you.' }],
    commitments: [{
      object: 'consult-governors-on-federal-appointments', text: 'Consult each governor before making federal appointments in their state.',
      responsible: 'president', afterMonths: 24, visibility: 'private',
    }],
  },
  {
    id: 'coalition', name: 'A broad coalition',
    howWon: 'A merger of parties and regional leaders, each of whom brought a zone and expects a share of the government for it.',
    strengths: 'Support that is even across the zones, and a Senate where your partners\' members vote with you.',
    costs: 'Partners expect ministries, and a coalition can be renegotiated by anyone who feels short-changed.',
    fx: [['bloc.party', 2], ['bloc.establishment', 3], ['person.sen_pres', 6], ['person.sen_lead', 4], ['zone.SE.approval', 3], ['zone.NE.approval', 3]],
    owes: [{ who: 'sen_pres', size: 1, why: 'Senator Maigari brought his party into the coalition.' }],
    commitments: [{
      object: 'coalition-partners-four-ministries', text: 'Give the coalition partners four ministries within the first year, as agreed before the election.',
      responsible: 'president', afterMonths: 12, visibility: 'public',
    }],
  },
  {
    id: 'mobilisation', name: 'A movement',
    howWon: 'Young voters, volunteers and people who had never voted before turned out for a promise to change how the government spends.',
    strengths: 'The street and the press start with you, and a public that has heard you promise something specific.',
    costs: 'The party regards you as a guest. The establishment has not decided whether you are serious. The promise is on tape.',
    fx: [['bloc.street', 10], ['bloc.press', 5], ['approval', 3], ['bloc.party', -8], ['bloc.establishment', -4]],
    owes: [],
    commitments: [{
      object: 'cut-cost-of-governance', text: 'Cut the cost of running the government within the first year: the campaign\'s signature promise.',
      responsible: 'president', afterMonths: 12, visibility: 'public',
    }],
  },
  {
    id: 'continuity', name: 'The heir',
    howWon: 'You ran as the outgoing government\'s chosen successor, on its record and with its machinery.',
    strengths: 'An administration that knows you, staff who stay, and a party that sees your victory as its own.',
    costs: 'Everything the last government did is now yours to defend, including what it did badly.',
    fx: [['bloc.party', 6], ['bloc.villa', 6], ['approval', -2]],
    owes: [],
    commitments: [{
      object: 'complete-predecessor-projects', text: 'Complete the outgoing government\'s unfinished projects, as promised in the campaign.',
      responsible: 'president', afterMonths: 24, visibility: 'public',
    }],
    // Only where there is a government to continue: the outgoing party is yours, or the scenario's
    // predecessor left in good enough standing to run on. Not after a removal, a rout or a collapse.
    onlyWhen: { scenarios: ['standard', 'boom'], successorSameParty: true },
    closedText: 'There is no outgoing government you could have run as the heir to.',
  },
];

export const FINANCIERS: Financier[] = [
  {
    id: 'ty_trade', label: 'Chief (Dr) Obinna Ezeudu',
    terms: `Paid for the campaign through the import business. ${asks('ty_trade')}`,
    strengths: 'A full campaign chest and an importer on your side when food prices bite.',
    costs: 'A favour you owe in full, and a licence request that would cost the farmers.',
    fx: [['tycoon.ty_trade', 14]], owes: [{ who: 'ty_trade', size: 3, why: 'Ezeudu paid for your campaign.' }], commitments: [],
    usualRoute: 'establishment',
  },
  {
    id: 'ty_maker', label: 'Alhaji Kabir Birniwa',
    terms: `Paid for the campaign through the manufacturing group. ${asks('ty_maker')}`,
    strengths: 'A manufacturer with sixty thousand workers who will hear that you are their candidate.',
    costs: 'A favour you owe in full, and a request that would raise prices for everyone who buys what he makes.',
    fx: [['tycoon.ty_maker', 14]], owes: [{ who: 'ty_maker', size: 3, why: 'Birniwa paid for your campaign.' }], commitments: [],
    usualRoute: 'coalition',
  },
  {
    id: 'ty_bank', label: 'Mrs Folake Adetoro',
    terms: `Paid for the campaign through friends of the bank. ${asks('ty_bank')}`,
    strengths: 'The banks start on your side, which steadies the bond market in your first year.',
    costs: 'A favour you owe in full, and a request that hides a banking problem until it is larger.',
    fx: [['tycoon.ty_bank', 14], ['bloc.establishment', 3]], owes: [{ who: 'ty_bank', size: 3, why: 'Adetoro paid for your campaign.' }], commitments: [],
    usualRoute: 'establishment',
  },
  {
    id: 'ty_fuel', label: 'Chief Tonye Amangala',
    terms: `Paid for the campaign through the fuel business. ${asks('ty_fuel')}`,
    strengths: 'Depots that stay supplied while he is pleased with you.',
    costs: 'A favour you owe in full, and a request that is the subsidy in another form.',
    fx: [['tycoon.ty_fuel', 14]], owes: [{ who: 'ty_fuel', size: 3, why: 'Amangala paid for your campaign.' }], commitments: [],
    usualRoute: 'coalition',
  },
  {
    id: 'ty_media', label: 'Otunba Gbenga Oyewole',
    terms: `Paid for the campaign and gave it airtime. ${asks('ty_media')}`,
    strengths: 'A television station and The Daily Stakeholder that start as friends.',
    costs: 'A favour you owe in full, and a request that would cost the treasury a fair price for the spectrum.',
    fx: [['tycoon.ty_media', 14], ['bloc.press', 3]], owes: [{ who: 'ty_media', size: 3, why: 'Oyewole paid for your campaign.' }], commitments: [],
    usualRoute: 'mobilisation',
  },
  {
    id: 'small', label: 'Small contributors',
    terms: 'Two million people gave a little each, online and at rallies. Nobody paid enough to ask for anything.',
    strengths: 'No businessman holds a debt over you, and the campaign\'s money is a story you can tell.',
    costs: 'A thinner campaign chest, a party that funded none of it, and a public promise to publish where every naira came from.',
    fx: [['bloc.street', 4], ['nation.integrity', 2], ['bloc.party', -3]],
    owes: [],
    commitments: [{
      object: 'publish-campaign-accounts', text: 'Publish the campaign\'s accounts, contributor by contributor, within six months of taking office.',
      responsible: 'president', afterMonths: 6, visibility: 'public',
    }],
    usualRoute: 'mobilisation',
  },
];

export const ROUTE_BY_ID = Object.fromEntries(ROUTES.map((r) => [r.id, r])) as Record<RouteId, Route>;
export const FINANCIER_BY_ID = Object.fromEntries(FINANCIERS.map((f) => [f.id, f])) as Record<FinancierId, Financier>;
