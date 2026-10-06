// What people want changes. Each governor, senator and minister asks first for the
// thing they came in wanting; after that, what they ask for follows their situation
// and their mood, and every grant makes the next request bigger. Two refusals make
// a grudge, and a grudge is an opening for the opposition.

import { clockOf, ensureGovernance, resolveActor } from './governance';
import { closeRequest, openRequest } from './requests';
import type { RequestRecord } from './contracts';
import { PERSON_BY_ID } from '../content/people';
import { termTurnOf } from './config';
import type { Fx, GameState, ZoneId } from './types';
import { ZONE_NAME, applyFx } from './vars';

export interface Want { recordId?: string; id: string; text: string; done: string; naira?: number; pc?: number; fx: Fx[] }

interface Template {
  id: string;
  groups: ('governor' | 'senator' | 'minister')[];
  when?: (s: GameState, id: string) => boolean;
  text: (s: GameState, id: string) => string;
  done: string;
  naira?: number;
  pc?: number;
  fx: (s: GameState, id: string) => Fx[];
}

const zoneOf = (id: string): ZoneId | undefined => PERSON_BY_ID[id]?.zone;
const zoneName = (id: string) => { const z = zoneOf(id); return z ? `the ${ZONE_NAME[z]}` : 'the state'; };

const TEMPLATES: Template[] = [
  // Governors
  { id: 'projects', groups: ['governor'], naira: 0.3, text: (s, id) => `Federal projects in ${zoneName(id)}: a road, a hospital and a ribbon to cut before the next election.`, done: 'The projects are approved. The ribbons are ordered.',
    fx: (s, id) => [[`zone.${zoneOf(id) ?? 'NW'}.approval`, 3], ['nation.jobs', 0.5]] },
  { id: 'troops', groups: ['governor'], pc: 4, when: (s, id) => !!zoneOf(id) && s.theatres[zoneOf(id)!] >= 55, text: (s, id) => `Troops and police for ${zoneName(id)}, where the killings have not stopped.`, done: 'The deployment is ordered. The governor is photographed with the commander.',
    fx: (s, id) => [[`theatre.${zoneOf(id)}`, -4], ['bloc.establishment', -1]] },
  { id: 'ally', groups: ['governor', 'senator'], pc: 6, text: () => 'A seat in the cabinet for an ally, in a brief with a budget.', done: 'The ally is sworn in. The brief has a budget, and the ally has plans for it.',
    fx: () => [['bloc.party', 3], ['nation.integrity', -1], ['nation.capacity', -0.5]] },
  { id: 'cover', groups: ['governor', 'senator'], pc: 5, when: (s) => s.nation.integrity < 40, text: () => 'The anti-corruption agency kept away from some old contracts.', done: 'The agency finds other things to look at.',
    fx: () => [['nation.integrity', -2], ['pressure.scandalHeat', 3]] },
  { id: 'ticket', groups: ['governor'], pc: 8, when: (s) => s.term === 1 && termTurnOf(s.turn) >= 26 && termTurnOf(s.turn) <= 38, text: () => 'A say in who runs with you next time, and where the convention is held.', done: 'The convention will be held where the governor wanted, which happens to be very near the governor.',
    fx: () => [['bloc.party', 4]] },
  // Senators
  { id: 'constituency', groups: ['senator'], naira: 0.15, text: () => 'Constituency projects, written into the budget where the committee can see them.', done: 'The projects are in the budget. The committee has seen them.',
    fx: () => [['bloc.party', 2], ['nation.integrity', -0.5]] },
  { id: 'chair', groups: ['senator'], pc: 4, text: () => 'A committee chairmanship for a colleague who has been waiting.', done: 'The colleague chairs the committee, and is grateful in the usual way.',
    fx: () => [['bloc.party', 2]] },
  { id: 'contract', groups: ['senator', 'governor'], naira: 0.1, when: (s) => s.nation.integrity < 35, text: () => 'A contract cleared for a friend who has been very patient.', done: 'The contract is cleared. The friend is no longer patient, only grateful.',
    fx: () => [['nation.integrity', -2], ['pressure.scandalHeat', 2]] },
  { id: 'amend', groups: ['senator'], pc: 3, when: (s) => s.agenda.active.length > 0, text: () => 'An amendment to one of your bills that protects an industry in the constituency.', done: 'The amendment goes in. The industry is protected, and so is the senator\'s seat.',
    fx: () => [['nation.jobs', -0.5], ['bloc.establishment', -1]] },
  // Ministers
  { id: 'budget', groups: ['minister'], naira: 0.25, text: () => 'A bigger budget for the ministry, released on time for once.', done: 'The money is released. The ministry\'s projects move a little faster.',
    fx: () => [['nation.capacity', 0.5]] },
  { id: 'permsec', groups: ['minister'], pc: 3, text: () => 'The removal of an obstructive permanent secretary.', done: 'The permanent secretary is redeployed. Files that were stuck begin to move.',
    fx: () => [['nation.capacity', 1], ['bloc.establishment', -1]] },
  { id: 'portfolio', groups: ['minister'], pc: 6, when: (s, id) => (s.people[id]?.ambition ?? PERSON_BY_ID[id]?.ambition ?? 0) >= 2, text: () => 'A bigger portfolio: two more agencies under the ministry.', done: 'Two agencies move under the ministry. So does a great deal of attention.',
    fx: () => [['bloc.party', -1], ['nation.capacity', 0.5]] },
];

const WINDOW = 8;
const hash = (x: string) => { let h = 2166136261; for (let i = 0; i < x.length; i++) h = Math.imul(h ^ x.charCodeAt(i), 16777619); return (h >>> 0) / 4294967296; };

/** Each grant makes the next request bigger. */
export function appetite(s: GameState, id: string): number {
  return 1 + 0.35 * (s.people[id]?.grants ?? 0);
}


function personId(s: GameState, id: string): string | undefined {
  return s.governance?.offices[id];
}
function records(s: GameState, id: string): RequestRecord[] {
  const actor = personId(s, id);
  return Object.values(s.governance?.requests ?? {}).filter((r) => r.legacyWant?.office === id && r.requester === actor && r.origin.administrationId === clockOf(s).administrationId);
}
function termsOf(w: Want) { return { description: w.text, naira: w.naira, politicalCapital: w.pc }; }
function wasAnswered(all: RequestRecord[], w: Want): boolean {
  return all.some((r) => r.status !== 'open' && r.object === w.id && r.text === w.text && JSON.stringify(r.terms) === JSON.stringify(termsOf(w)));
}

/** A pure read: requests keep their exact terms until answered. Closed asks stay closed. */
export function currentWant(s: GameState, id: string): Want | null {
  const p = PERSON_BY_ID[id], st = s.people[id];
  if (!p || !st || st.gone) return null;
  const all = records(s, id);
  const open = all.find((r) => r.status === 'open');
  if (open?.legacyWant) return { recordId: open.id, id: open.object, text: open.text, done: open.legacyWant.done, naira: open.terms?.naira, pc: open.terms?.politicalCapital, fx: open.legacyWant.fx };
  const window = Math.floor(s.turn / WINDOW);
  const justAnswered = all.some((r) => r.closed !== undefined && Math.floor((r.closed - (s.governance?.originMonth ?? 0) + 1) / WINDOW) === window);
  if (justAnswered || (st.grantedAt !== undefined && Math.floor(st.grantedAt / WINDOW) === window) || (st.refusedAt !== undefined && Math.floor(st.refusedAt / WINDOW) === window)) return null;
  // Legacy refusal timestamps show that an initial ask has already been answered;
  // we do not invent which later template was refused in an old save.
  if (!st.granted && !st.name && p.want && !all.some((r) => r.object === 'signature') && st.refusedAt === undefined) return { id: 'signature', text: p.want.text, done: p.want.done, naira: p.want.naira, pc: p.want.pc, fx: p.want.fx };
  if (st.name && s.turn - (st.since ?? s.turn) < 6) return null;
  const k = appetite(s, id), round = (x: number) => Math.round(x * 100) / 100;
  const options = TEMPLATES.filter((t) => t.groups.includes(p.group as 'governor') && (!t.when || t.when(s, id))).map((t): Want => ({ id: t.id, text: t.text(s, id), done: t.done, naira: t.naira ? round(t.naira * k) : undefined, pc: t.pc ? Math.round(t.pc * k) : undefined, fx: t.fx(s, id) })).filter((w) => !wasAnswered(all, w));
  if (!options.length) return null;
  return options[Math.floor(hash(id + '.' + window + '.' + (st.grants ?? 0)) * options.length)];
}

/** Engine boundary: store the exact proposal and its stable requester identity. */
export function refreshRequests(s: GameState, only?: string): void {
  const g = ensureGovernance(s), now = clockOf(s).worldMonth;
  for (const r of Object.values(g.requests)) if (r.status === 'open' && r.legacyWant && (r.origin.administrationId !== g.administrationId || g.offices[r.legacyWant.office] !== r.requester)) {
    closeRequest(s, r.id, 'withdrawn', 'The requester left the post or the administration changed.');
  }
  for (const id of only ? [only] : Object.keys(s.people)) {
    const w = currentWant(s, id);
    if (!w || w.recordId) continue;
    const requester = resolveActor(s, { office: id });
    const prior = records(s, id).filter((r) => r.status !== 'open').sort((a, b) => b.made - a.made)[0];
    const recordId = 'want.' + g.administrationId + '.' + encodeURIComponent(requester) + '.' + now + '.' + w.id;
    const r = openRequest(s, { id: recordId, requester: { person: requester }, object: w.id, text: w.text, terms: termsOf(w), ambition: PERSON_BY_ID[id]?.group, previous: prior?.id, changedBy: prior ? 'offer' : undefined });
    r.legacyWant = { kind: w.id, office: id, done: w.done, fx: structuredClone(w.fx) };
  }
}

export function grantRequest(s: GameState, id: string): void {
  refreshRequests(s, id);
  const w = currentWant(s, id);
  if (w?.recordId) closeRequest(s, w.recordId, 'granted', w.done);
}

/** Refusal closes this request. It neither deletes debts nor manufactures a grudge. */
export function refuse(s: GameState, id: string): string {
  refreshRequests(s, id);
  const st = s.people[id], w = currentWant(s, id);
  if (!st || !w?.recordId) return '';
  closeRequest(s, w.recordId, 'refused', 'The President declined this request.');
  st.refusals = (st.refusals ?? 0) + 1; st.refusedAt = s.turn;
  st.rel = Math.max(0, st.rel - 5);
  const crooked = w.fx.some(([t, d]) => t === 'nation.integrity' && d < 0);
  if (crooked) { applyFx(s, ['nation.integrity', 1]); applyFx(s, ['bloc.press', 1]); }
  const name = st.short ?? PERSON_BY_ID[id]?.short ?? id;
  return name + ' is told no. This request is closed.' + (crooked ? ' The public refusal of the improper request is noticed.' : '');
}
export function canRefuse(s: GameState, id: string): { ok: boolean; reason?: string } {
  return currentWant(s, id) ? { ok: true } : { ok: false, reason: 'Has no open request.' };
}
export function grudgeLine(s: GameState, id: string): string | null {
  return s.people[id]?.grudge ? 'Holds an existing grievance.' : null;
}
