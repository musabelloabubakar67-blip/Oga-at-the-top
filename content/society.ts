// THE COUNTRY'S PEOPLE, BY HOW THEY LIVE (plan 14)
// Representative economic groups, each with the conditions its fortune actually
// turns on; what each public service delivers, measured on more than one
// dimension; and the constituencies that development itself creates. The
// citizen cast (content/citizens.ts) are members of these groups.

import type { Cond } from '../engine/types';
import type { Group } from './citizens';

const v = (path: string, op: '<' | '<=' | '>' | '>=' | '==', n: number): Cond => ({ v: [path, op, n] });

export interface Driver {
  label: string;
  /** Game value read each month. */
  path: string;
  /** Points of fortune per unit above `from` (negative weights hurt). */
  per: number;
  from: number;
  /** Clamp of this driver's contribution. */
  max?: number;
}

export interface GroupDef {
  id: Group;
  name: string;
  /** Roughly how many people, for weighting, millions. */
  size: number;
  base: number;
  drivers: Driver[];
  /** Assets whose output reaches them. */
  assets?: string[];
}

export const GROUPS: GroupDef[] = [
  { id: 'salaried', name: 'Salaried households', size: 9, base: 55, drivers: [
    { label: 'Inflation eats a fixed salary', path: 'nation.inflation', per: -1.2, from: 15 },
    { label: 'Wage talks', path: 'pressure.wageGrievance', per: -0.25, from: 30 },
    { label: 'Schools and clinics they can use', path: 'svc.afford', per: 0.3, from: 50 },
  ] },
  { id: 'trader', name: 'Informal traders', size: 30, base: 52, drivers: [
    { label: 'Prices of goods they resell', path: 'nation.inflation', per: -0.6, from: 15 },
    { label: 'The street rate for dollars', path: 'fx.premium', per: -0.4, from: 10 },
    { label: 'Customers with money', path: 'nation.jobs', per: 0.4, from: 35 },
  ], assets: ['hub', 'coastal', 'rail'] },
  { id: 'farmer', name: 'Farmers', size: 35, base: 48, drivers: [
    { label: 'Attacks on farms in the farm belt', path: 'theatre.NC', per: -0.6, from: 50 },
    { label: 'Attacks in the North West', path: 'theatre.NW', per: -0.3, from: 50 },
    { label: 'Fuel for pumps and lorries', path: 'nation.petrolPrice', per: -0.02, from: 700, max: 15 },
    { label: 'Farm spending in the budget', path: 'budget.agric', per: 4, from: 2 },
  ], assets: ['rice', 'wheat', 'corridor_ops', 'petrochem', 'rail'] },
  { id: 'manufacturer', name: 'Manufacturers', size: 2, base: 40, drivers: [
    { label: 'Electricity', path: 'nation.power', per: 0.8, from: 35 },
    { label: 'The street rate for imported inputs', path: 'fx.premium', per: -0.4, from: 10 },
    { label: 'Demand at home', path: 'nation.jobs', per: 0.4, from: 35 },
  ], assets: ['steel', 'smelter', 'car', 'petrochem', 'charter', 'lithium'] },
  { id: 'importer', name: 'Import-dependent businesses', size: 3, base: 55, drivers: [
    { label: 'The street rate for dollars', path: 'fx.premium', per: -1.1, from: 10 },
    { label: 'Reserves to buy dollars from', path: 'fx.reserves', per: 0.6, from: 25, max: 10 },
    { label: 'Lagos and its roads', path: 'theatre.SW', per: -0.3, from: 45 },
  ], assets: ['hub'] },
  { id: 'transport', name: 'Transport workers', size: 4, base: 55, drivers: [
    { label: 'The pump price', path: 'nation.petrolPrice', per: -0.035, from: 700, max: 25 },
    { label: 'Petrol queues', path: 'pressure.fuelSupplyStress', per: -0.3, from: 30 },
  ], assets: ['refinery', 'refinery_delta', 'refinery_kaduna', 'coastal'] },
  { id: 'graduate', name: 'Young graduates', size: 6, base: 30, drivers: [
    { label: 'Jobs', path: 'nation.jobs', per: 1.5, from: 34 },
    { label: 'Whether merit is rewarded', path: 'nation.integrity', per: 0.3, from: 30 },
    { label: 'What their education was worth', path: 'svc.edu.quality', per: 0.2, from: 40 },
  ], assets: ['charter', 'hub'] },
  { id: 'fisher', name: 'Fishing and farming families of the creeks', size: 3, base: 50, drivers: [
    { label: 'The creeks', path: 'theatre.SS', per: -0.8, from: 50 },
    { label: 'Honest government on the spills', path: 'nation.integrity', per: 0.3, from: 30 },
  ] },
  { id: 'displaced', name: 'People displaced by conflict', size: 3, base: 25, drivers: [
    { label: 'Whether home is safe', path: 'theatre.NE', per: -0.8, from: 55 },
    { label: 'Clinics and schools in the camps and at home', path: 'svc.health.access', per: 0.25, from: 40 },
  ], assets: ['ddr'] },
  { id: 'pensioner', name: 'Pensioners', size: 3, base: 52, drivers: [
    { label: 'Pensions owed and unpaid', path: 'debt.pensions', per: -20, from: 0.3 },
    { label: 'Inflation on a fixed pension', path: 'nation.inflation', per: -0.8, from: 15 },
  ] },
  { id: 'health', name: 'Health workers', size: 1, base: 50, drivers: [
    { label: 'Pay disputes', path: 'pressure.wageGrievance', per: -0.3, from: 30 },
    { label: 'Health spending', path: 'budget.people', per: 4, from: 2 },
    { label: 'Power in the wards', path: 'nation.power', per: 0.2, from: 35 },
  ], assets: ['hospital'] },
];
export const GROUP_BY_ID = Object.fromEntries(GROUPS.map((g) => [g.id, g])) as Record<Group, GroupDef>;

// ---------------------------------------------------------------- what services deliver

export type ServiceDim =
  | 'edu.access' | 'edu.completion' | 'edu.quality'
  | 'health.access' | 'health.outcomes'
  | 'power.coverage' | 'power.reliability'
  | 'afford' | 'durable';

export const DIM_NAME: Record<ServiceDim, string> = {
  'edu.access': 'Children in school', 'edu.completion': 'Children who finish', 'edu.quality': 'What they learn',
  'health.access': 'People who can reach care', 'health.outcomes': 'Whether care works',
  'power.coverage': 'Homes connected', 'power.reliability': 'Hours of supply',
  afford: 'What people can afford', durable: 'Whether the budget can sustain it',
};
export const DIM_START: Record<ServiceDim, number> = {
  'edu.access': 45, 'edu.completion': 35, 'edu.quality': 35, 'health.access': 35, 'health.outcomes': 35,
  'power.coverage': 45, 'power.reliability': 30, afford: 45, durable: 50,
};

/** What each reform does on each dimension. `funded`: it needs money in the budget, or its gains turn into the failure below. */
export interface ServiceEffect {
  dims: Partial<Record<ServiceDim, number>>;
  /** Who gains most: tilts the distribution (positive reaches the poorer, negative the better-off). */
  reach?: number;
  funded?: { sector: 'people' | 'power'; failure: string };
  /** The recognisable way this approach fails. */
  risk?: string;
}

export const SERVICE_EFFECTS: Record<string, ServiceEffect> = {
  k1: { dims: { 'edu.access': 12 }, reach: 3 },
  k2: { dims: { 'edu.quality': 4, durable: 3 } },
  e3: { dims: { 'edu.access': 5, 'edu.completion': 6 }, reach: 2 },
  e2: { dims: { 'edu.quality': 5, 'edu.completion': 3 } },
  e5: { dims: { 'edu.access': 10, 'edu.completion': 8, afford: 5, durable: -4 }, reach: 3, funded: { sector: 'people', failure: 'Free in name: classrooms of ninety and no books, because the money did not follow the children.' } },
  k6: { dims: { 'edu.quality': 5 } },
  k7: { dims: { 'edu.quality': 8, durable: -2 } },
  k8: { dims: { 'edu.completion': 5, 'edu.quality': 3 }, reach: 1 },
  k9: { dims: { 'edu.quality': 5 } },
  k10: { dims: { 'edu.access': 4, 'edu.completion': 4 }, reach: 2 },
  k11: { dims: { 'edu.quality': 8, durable: 6, afford: -6, 'edu.access': -2 }, reach: -4, risk: 'Fees rise faster than loans, and the poorest students leave.' },
  k12: { dims: { 'edu.access': 6, afford: 8, durable: -6 }, reach: 3, funded: { sector: 'people', failure: 'Free universities without the money: lecturers strike, labs close, the degree is worth less every year.' } },
  e1: { dims: { 'health.access': 10 }, reach: 3 },
  m2: { dims: { 'health.outcomes': 6 } },
  m3: { dims: { 'health.access': 6, 'health.outcomes': 3 }, reach: 3 },
  e4: { dims: { 'health.access': 8, afford: 6, durable: -3 }, reach: 1 },
  m5: { dims: { 'health.outcomes': 8 }, reach: 2 },
  m6: { dims: { 'health.outcomes': 4, durable: 2 } },
  m7: { dims: { 'health.outcomes': 2, durable: 2 } },
  m9: { dims: { 'health.outcomes': 5 } },
  m10: { dims: { afford: 6 }, reach: 3 },
  m11: { dims: { 'health.access': 5, 'health.outcomes': 4, durable: 3 }, reach: -3, risk: 'Insurers pay late, and the informal workers who were never enrolled stay outside.' },
  m12: { dims: { 'health.access': 9, afford: 9, durable: -6 }, reach: 4, funded: { sector: 'people', failure: 'Free at the clinic, and nothing on the shelves: the queue is for a prescription to take to a private chemist.' } },
  p2: { dims: { 'power.reliability': 8 } },
  p3: { dims: { 'power.reliability': 4, durable: 5, afford: -4 } },
  p4: { dims: { 'power.reliability': 6 } },
  p5: { dims: { 'power.reliability': 10 }, reach: -3 },
  p6: { dims: { 'power.reliability': 4, durable: 3 } },
  p9: { dims: { 'power.coverage': 12 }, reach: 4 },
  p11: { dims: { afford: 5 }, reach: 3 },
  p14: { dims: { 'power.reliability': 7, durable: 4, afford: -3 }, risk: 'Better supply for those who can pay, and disconnections for those who cannot.' },
  p15: { dims: { 'power.coverage': 5, afford: 4, durable: -5, 'power.reliability': -2 }, reach: 2, funded: { sector: 'power', failure: 'A public company that keeps the tariff low and the lights off, because nobody funds the gap.' } },
};

// ---------------------------------------------------------------- constituencies that success creates

export interface Constituency {
  id: string;
  name: string;
  /** What has to be true for them to exist. Once they exist, they persist. */
  emerge: Cond;
  /** Why they exist, in a line. */
  because: string;
  /** What they want, and what happens each month they do not get it. */
  wants: string;
  /** When this holds they are satisfied; otherwise the pressure below applies. */
  satisfied: Cond;
  pressure: [string, number][];
}

export const CONSTITUENCIES: Constituency[] = [
  { id: 'taxpayers', name: 'Taxpayers who ask where it goes', emerge: v('fiscal.base', '>=', 50),
    because: 'Enough people now pay tax to notice what it buys.',
    wants: 'Published budgets and honest spending.', satisfied: v('nation.integrity', '>=', 42),
    pressure: [['bloc.press', -0.08], ['approval', -0.04]] },
  { id: 'credit', name: 'Firms that want credit and a way in', emerge: { any: [v('nation.jobs', '>=', 48), v('group.manufacturer', '>=', 62)] },
    because: 'Growing firms have outgrown the money their owners can raise.',
    wants: 'Banks that lend to newcomers, and markets not closed by incumbents.', satisfied: { any: [{ flag: 'credit.opened' }, v('tycoon.ty_bank', '<', 40)] },
    pressure: [['bloc.establishment', -0.06]] },
  { id: 'unions', name: 'Organised industrial workers', emerge: v('assets.industry', '>=', 2),
    because: 'The new plants employ thousands under one roof, and they have found each other.',
    wants: 'Recognition, bargaining and safety on the floor.', satisfied: { flag: 'unions.recognised' },
    pressure: [['pressure.wageGrievance', 0.15]] },
  { id: 'graduates', name: 'Graduates who were promised work', emerge: { all: [{ any: [v('agenda.e5', '==', 1), v('agenda.k12', '==', 1), v('agenda.k8', '==', 1)] }, v('svc.edu.completion', '>=', 50)] },
    because: 'More young people finished school and university than ever before.',
    wants: 'Jobs that use what they learned.', satisfied: v('nation.jobs', '>=', 45),
    pressure: [['bloc.street', -0.08], ['approval', -0.03]] },
  { id: 'agencies', name: 'Capable agencies that resist misuse', emerge: v('nation.capacity', '>=', 56),
    because: 'The civil service now has people good enough to know an improper instruction when they see one.',
    wants: 'Rules, not phone calls.', satisfied: v('nation.integrity', '>=', 38),
    pressure: [['bloc.villa', -0.06]] },
];
