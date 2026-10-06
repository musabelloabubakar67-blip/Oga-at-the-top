// QUESTIONS WITH MORE THAN ONE DEFENSIBLE ANSWER (plan 08)
// Each mystery has competing explanations. Which one is true is decided by the
// state of the country when the question opens (deterministic, and caused):
// fuel queues are hoarding when the importer is hostile, vandalism when the
// creeks are burning, smuggling otherwise. The President hears from sources
// that see different parts of it, each with its own reliability and its own
// reason to shade the truth, and decides, usually before the evidence is
// complete. Months later the truth comes out, and every report can be traced.

import type { Cond, Fx } from '../engine/types';

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });

export type Method = 'claim' | 'audit' | 'field' | 'intel';

export interface MethodDef {
  name: string;
  source: string;
  /** How often its finding is right, when the question is within its scope. */
  accuracy: number;
  months: number;
  pc: number;
  naira: number;
  incentive: string;
}

export const METHODS: Record<Method, MethodDef> = {
  claim: { name: 'The ministry\'s own account', source: 'The ministry responsible', accuracy: 0.35, months: 0, pc: 0, naira: 0, incentive: 'It is the ministry\'s own work being judged; its account favours the explanation that is nobody\'s fault.' },
  audit: { name: 'An audit of the spending records', source: 'The Auditor-General', accuracy: 0.85, months: 2, pc: 2, naira: 0.01, incentive: 'No stake in the answer, but it sees only what the money did, not what happened on the ground.' },
  field: { name: 'A field team on the ground', source: 'A team from the delivery office and two independent engineers', accuracy: 0.75, months: 1, pc: 3, naira: 0.02, incentive: 'Sees what is there to see; misses what happened before it arrived, and can be shown around.' },
  intel: { name: 'An intelligence brief', source: 'The secret service', accuracy: 0.6, months: 0, pc: 1, naira: 0, incentive: 'Fast, and well informed about people; it has its own friends and enemies, and they appear in its briefs.' },
};

export interface Hypothesis {
  id: string;
  /** The explanation, as a conclusion the President could announce. */
  text: string;
  /** What the President does if this is the conclusion. */
  response: { label: string; right: Fx[]; wrong: Fx[]; resolves: string };
  /** Who it implicates, if anyone (an ally exposed by the inquiry). */
  implicates?: string;
}

export interface Mystery {
  id: string;
  title: string;
  question: string;
  when: Cond;
  /** Which explanation is true, decided in order from the state of the country when the question opens. */
  truth: { when: Cond; is: string }[];
  /** The explanation if no rule above holds. */
  otherwise: string;
  hypotheses: Hypothesis[];
  /** What each method can see: the explanations it is able to confirm or rule out. */
  scope: Record<Method, string[]>;
  /** What a month of not deciding costs. */
  waiting: Fx[];
  /** A public announcement already made, which the inquiry may contradict. */
  announced?: { text: string; is: string };
}

export const MYSTERIES: Mystery[] = [
  {
    id: 'myst.fuel', title: 'Why the fuel queues are back',
    question: 'The queues are back in six cities. Depots report stock; stations report none. Somebody is lying, or something is broken.',
    when: v('pressure.fuelSupplyStress', '>=', 55),
    truth: [{ when: v('tycoon.ty_fuel', '<', 45), is: 'hoard' }, { when: v('theatre.SS', '>=', 60), is: 'pipes' }],
    otherwise: 'smuggle',
    hypotheses: [
      { id: 'hoard', text: 'The depot owners are hoarding to force a price rise.', implicates: 'ty_fuel',
        response: { label: 'Order the depots opened and the stock released at the regulated price', right: [['pressure.fuelSupplyStress', -20], ['tycoon.ty_fuel', -8], ['approval', 2]], wrong: [['tycoon.ty_fuel', -10], ['bloc.establishment', -3]], resolves: 'The depots were full. Their owners were waiting for a price rise.' } },
      { id: 'pipes', text: 'The pipelines from the coast have been cut; the depots inland cannot be refilled.',
        response: { label: 'Send the navy and repair crews to the pipelines', right: [['pressure.fuelSupplyStress', -18], ['theatre.SS', -3]], wrong: [['nation.fiscalSpace', -0.05]], resolves: 'The pipelines had been tapped in four places; the depots inland were running dry.' } },
      { id: 'smuggle', text: 'Subsidised petrol is being smuggled across the borders, where it sells for twice the price.',
        response: { label: 'Close the border filling stations and track the tankers', right: [['pressure.fuelSupplyStress', -15], ['bonus.fiscal', 0.004]], wrong: [['zone.NW.approval', -2], ['zone.SW.approval', -2]], resolves: 'A third of the subsidised petrol was leaving by road for the neighbours.' } },
    ],
    scope: { claim: ['pipes', 'smuggle'], audit: ['smuggle'], field: ['hoard', 'pipes'], intel: ['hoard', 'smuggle', 'pipes'] },
    waiting: [['approval', -0.6], ['pressure.fuelSupplyStress', 2]],
    announced: { text: 'The Ministry has said publicly that "vandals" are to blame.', is: 'pipes' },
  },
  {
    id: 'myst.classrooms', title: 'Whether the classrooms were built',
    question: 'The Ministry of Education reports 1,200 classrooms built under last year\'s programme, on time and on budget. A senator from the North West says he has visited four sites and found two.',
    when: { all: [{ turn: [8] }, v('agenda.k1', '==', 1)] },
    truth: [{ when: v('nation.integrity', '>=', 45), is: 'built' }, { when: v('debt.contractors', '>', 1), is: 'partly' }],
    otherwise: 'paper',
    hypotheses: [
      { id: 'built', text: 'They were built, as the ministry says. The senator saw the wrong sites.',
        response: { label: 'Stand by the ministry and publish the list of sites', right: [['bloc.press', 2], ['approval', 1]], wrong: [['nation.integrity', -4], ['bloc.press', -5], ['pressure.scandalHeat', 6]], resolves: 'Every site on the list had a classroom on it. The senator had been shown the wrong four.' } },
      { id: 'partly', text: 'Most were built, badly: contractors who were not paid cut corners.',
        response: { label: 'Pay the contractors\' arrears and order the bad ones rebuilt', right: [['debt.contractors', -0.3], ['nation.capacity', 1]], wrong: [['nation.fiscalSpace', -0.1]], resolves: 'Most classrooms stood; a third had no roofs, built by contractors still owed for the work.' } },
      { id: 'paper', text: 'Many exist only on paper: the money was paid and the classrooms were not built.',
        response: { label: 'Refer the programme to the anti-corruption agency', right: [['nation.integrity', 4], ['bloc.press', 3], ['bloc.party', -3]], wrong: [['bloc.party', -4], ['nation.capacity', -1]], resolves: 'Four hundred of the classrooms had been paid for and never built.' } },
    ],
    scope: { claim: ['built'], audit: ['paper', 'partly'], field: ['built', 'partly', 'paper'], intel: ['paper'] },
    waiting: [['bloc.press', -0.5]],
    announced: { text: 'You praised the programme in a speech last month.', is: 'built' },
  },
  {
    id: 'myst.stall', title: 'Why the reform has stalled',
    question: 'A reform you launched has not moved in three months. The ministry says it is "being processed". Something, or someone, is stopping it.',
    when: { all: [{ turn: [10] }, v('reforms.active', '>=', 2)] },
    truth: [{ when: v('nation.capacity', '<', 38), is: 'capacity' }, { when: v('govs', '<', 3), is: 'governor' }],
    otherwise: 'patron',
    hypotheses: [
      { id: 'capacity', text: 'The ministry simply cannot do it: too few people who know how.',
        response: { label: 'Second a team from the delivery office to the ministry', right: [['nation.capacity', 2]], wrong: [['bloc.establishment', -2]], resolves: 'The ministry had four people working on it, none trained for the job.' } },
      { id: 'governor', text: 'A permanent secretary is slowing it on behalf of a governor who loses from it.',
        response: { label: 'Move the permanent secretary and tell the governor why', right: [['nation.capacity', 1], ['bloc.party', -2]], wrong: [['bloc.party', -4], ['nation.capacity', -1]], resolves: 'The permanent secretary had been taking instructions from a governor\'s office.' } },
      { id: 'patron', text: 'The minister is slowing it for a businessman who profits from the old arrangement.',
        response: { label: 'Confront the minister and set a deadline in writing', right: [['bloc.press', 2], ['nation.integrity', 2]], wrong: [['bloc.villa', -3]], resolves: 'The minister had been meeting the businessman weekly, and the reform waited in the minister\'s tray.' } },
    ],
    scope: { claim: ['capacity'], audit: ['capacity'], field: ['capacity', 'governor'], intel: ['governor', 'patron'] },
    waiting: [['approval', -0.2]],
  },
  {
    id: 'myst.medicines', title: 'Where the medicines went',
    question: 'Clinics in three zones report empty shelves. The budget for essential medicines was released in full.',
    when: { all: [{ turn: [6] }, v('agenda.e1', '==', 1)] },
    truth: [{ when: v('fx.premium', '>=', 25), is: 'dollars' }, { when: v('budget.people', '<', 2), is: 'budget' }],
    otherwise: 'diverted',
    hypotheses: [
      { id: 'dollars', text: 'The suppliers could not buy dollars to import them; the money sat unspent.',
        response: { label: 'Give medicine importers a priority dollar allocation', right: [['bloc.street', 3], ['fx.reserves', -0.5]], wrong: [['fx.reserves', -0.5], ['nation.integrity', -1]], resolves: 'The suppliers had the naira and could not find the dollars.' } },
      { id: 'budget', text: 'There was never enough money: the release covered three months of a year\'s need.',
        response: { label: 'Fund a supplementary allocation for medicines', right: [['bloc.street', 4], ['nation.fiscalSpace', -0.1]], wrong: [['nation.fiscalSpace', -0.1]], resolves: 'The allocation had been set at a quarter of what the clinics use.' } },
      { id: 'diverted', text: 'The medicines were delivered to the stores and sold privately from there.',
        response: { label: 'Audit the stores and prosecute the storekeepers', right: [['nation.integrity', 3], ['bloc.street', 3]], wrong: [['bloc.street', -2], ['pressure.wageGrievance', 4]], resolves: 'The medicines reached the state stores and left them by the back door, for private pharmacies.' } },
    ],
    scope: { claim: ['dollars', 'budget'], audit: ['budget', 'diverted'], field: ['diverted'], intel: ['diverted'] },
    waiting: [['bloc.street', -0.6]],
  },
];

export const MYSTERY_BY_ID = Object.fromEntries(MYSTERIES.map((m) => [m.id, m]));
