// STORY FAMILIES (plan 07.A2, A3)
// The desk's recurring problems, organised as developing stories rather than a
// lottery of files. Each family names its events, the subject an episode is
// about (one live episode per subject), the condition under which the problem
// is solved, and the closing report that says so. While a family is solved its
// recurring files stop arriving; if the problem returns, the first file of the
// new episode is preceded by a note of how long it had held.
//
// Families without an exit are ongoing politics (the cabinet, the coalition,
// industry): they never close, but they are paced like the rest.
// Written against docs/playtest/experience/STORY-FAMILIES.md.

import type { Cond } from '../engine/types';

export interface Family {
  id: string;
  name: string;
  /** Event ids in this family. */
  events: string[];
  /** The subject of each event's episode, where a family has several (a theatre, a debt); otherwise the family itself. */
  subjects?: Record<string, string>;
  /** Solved: recurring files stop. */
  exit?: Cond;
  /** Solved, per subject, where subjects differ. */
  exitBy?: Record<string, Cond>;
  /** Months that must pass between drawn beats of an open episode (queued beats are exempt). */
  gap: number;
  /** The closing report. */
  closing?: { title: string; text: string };
  /** What the solved problem turns into: the next question, said in the closing report. */
  next?: string;
}

export const FAMILIES: Family[] = [
  {
    id: 'electricity', name: 'Electricity', gap: 4,
    events: ['grid.collapse', 'debt.gas'],
    exit: { all: [{ v: ['agenda.p2', '==', 1] }, { v: ['debt.gas', '<', 0.3] }, { v: ['nation.power', '>=', 55] }] },
    closing: { title: 'Six months without a national collapse', text: 'The corridors are rebuilt and the gas suppliers are paid. The grid has stopped being news.' },
    next: 'The next question is quality, not survival: factories want dedicated feeders, and the states want a share of the supply.',
  },
  {
    id: 'fuel', name: 'Fuel and the subsidy', gap: 4,
    events: ['petrol.scarcity', 'tycoon.depots', 'tycoon.hoard', 'minor.refinery'],
    exit: { all: [{ flag: 'policy.subsidy', is: 'removed' }, { v: ['pressure.fuelSupplyStress', '<', 40] }] },
    closing: { title: 'The price is simply the price', text: 'The subsidy is gone and the depots are full. Queues are a memory, and the marketers have nothing left to threaten.' },
    next: 'What was saved is now the argument: where the money goes, and whether anyone can see it arrive.',
  },
  {
    id: 'wages', name: 'Wages and labour', gap: 5,
    events: ['doctors.strike', 'minor.labour', 'debt.pensions'],
    exit: { all: [{ v: ['debt.pensions', '<', 0.2] }, { v: ['pressure.wageGrievance', '<', 35] }] },
    closing: { title: 'The unions have nothing on the calendar', text: 'Pensions are paid on time and the agreements are being honoured. Labour has gone quiet, which is its way of saying so.' },
    next: 'The unions now bargain over productivity and pay scales rather than arrears.',
  },
  {
    id: 'procurement', name: 'Procurement and contractors', gap: 5,
    events: ['tempt.contractor', 'debt.contractors', 'court.injunction', 'bet.trouble'],
    exit: { all: [{ v: ['debt.contractors', '<', 0.3] }, { v: ['nation.integrity', '>=', 55] }] },
    closing: { title: 'Contracts are boring again', text: 'Contractors are paid on certificate and awards are published. Sites are working, and nobody calls the Villa about a payment.' },
    next: 'Open contracting brings new bidders, and the old ones lobby against the rules that let them in.',
  },
  {
    id: 'treasury', name: 'Treasury and debt', gap: 5,
    events: ['debt.crisis', 'debt.maturity', 'oil.shortfall', 'minor.cbn', 'minor.bdc', 'treasury.payroll'],
    exit: { all: [{ v: ['nation.debt', '<', 45] }, { v: ['nation.fiscalSpace', '>', 0.8] }] },
    closing: { title: 'The treasury can plan a year ahead', text: 'Debt is down, the account has cash, and the bond market has stopped asking questions.' },
    next: 'With room to spend, the argument is about what to build first.',
  },
  {
    id: 'security', name: 'Security', gap: 3,
    events: ['sec.oil', 'sec.sitathome', 'sec.highway', 'sec.insurgency', 'attack.farms', 'mil.leak', 'mil.misuse'],
    subjects: { 'sec.oil': 'SS', 'sec.sitathome': 'SE', 'sec.highway': 'SW', 'sec.insurgency': 'NE', 'attack.farms': 'NC', 'mil.leak': 'forces', 'mil.misuse': 'forces' },
    exitBy: { SS: { v: ['theatre.SS', '<', 40] }, SE: { v: ['theatre.SE', '<', 40] }, SW: { v: ['theatre.SW', '<', 40] }, NE: { v: ['theatre.NE', '<', 40] }, NC: { v: ['theatre.NC', '<', 40] } },
    closing: { title: 'A theatre is quiet', text: 'The theatre has stayed below its danger line. The roads are open and the markets are trading.' },
    next: 'Peace brings returnees, land disputes and a reconstruction bill.',
  },
  { id: 'cabinet', name: 'Cabinet performance', gap: 4, events: ['min.star', 'min.failing', 'min.dirty', 'min.resigns', 'cabinet.leak'] },
  { id: 'coalition', name: 'Coalition politics', gap: 3, events: ['elder.letter', 'party.decamp', 'minor.governor_call', 'minor.chair', 'minor.zango', 'owe.tycoon', 'owe.governor', 'fund.share', 'reform.governors', 'reform.repeal', 'opposition.unites'] },
  { id: 'industry', name: 'Industry', gap: 4, events: ['tycoon.layoff', 'tycoon.offer', 'reform.lobby'] },
];

export const FAMILY_OF: Record<string, Family> = Object.fromEntries(FAMILIES.flatMap((f) => f.events.map((e) => [e, f])));
