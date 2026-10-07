// What people want changes. Each governor, senator and minister asks first for the
// thing they came in wanting; after that, what they ask for follows their situation:
// a pressing need comes before patronage, and every grant makes the next request
// bigger. A refusal closes the request. How it is taken depends on why they asked,
// who they are and whether they were told why (plan 05.A3): an improper ask refused
// costs little, a real need refused without a word costs a great deal. A grudge
// forms only from two refusals of the same kind of ask, never from two unrelated
// ones, and a grant settles only the grievance it answers (05.A11).

import { clockOf, ensureGovernance, resolveActor } from './governance';
import { closeRequest, openRequest } from './requests';
import type { RequestRecord } from './contracts';
import { PERSON_BY_ID, type Temper } from '../content/people';
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

/** Months after an answer before the same person asks for something new. Not a rotating window: the clock starts at the answer. */
export const NEXT_ASK = 6;
/** Why someone asks: a real need for their people, patronage for their network, or something improper. */
export type Motive = 'need' | 'patronage' | 'improper';
const MOTIVE: Record<string, Motive> = { projects: 'need', troops: 'need', budget: 'need', permsec: 'need', ally: 'patronage', ticket: 'patronage', constituency: 'patronage', chair: 'patronage', amend: 'patronage', portfolio: 'patronage', cover: 'improper', contract: 'improper' };
export function motiveOf(object: string, fx: Fx[] = []): Motive {
  if (MOTIVE[object]) return MOTIVE[object];
  return fx.some(([t, d]) => t === 'nation.integrity' && d < 0) ? 'improper' : 'patronage';
}
export const MOTIVE_NAME: Record<Motive, string> = { need: 'a need in their state or ministry', patronage: 'patronage for their network', improper: 'an improper favour' };
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
  // The next ask comes a fixed time after the last answer, whenever that was.
  const origin = s.governance?.originMonth ?? 0;
  const lastAnswer = Math.max(-99, ...all.filter((r) => r.closed !== undefined).map((r) => r.closed! - origin + 1), st.grantedAt ?? -99, st.refusedAt ?? -99);
  if (s.turn - lastAnswer < NEXT_ASK) return null;
  // Legacy refusal timestamps show that an initial ask has already been answered;
  // we do not invent which later template was refused in an old save.
  if (!st.granted && !st.name && p.want && !all.some((r) => r.object === 'signature') && st.refusedAt === undefined) return { id: 'signature', text: p.want.text, done: p.want.done, naira: p.want.naira, pc: p.want.pc, fx: p.want.fx };
  if (st.name && s.turn - (st.since ?? s.turn) < 6) return null;
  const k = appetite(s, id), round = (x: number) => Math.round(x * 100) / 100;
  const options = TEMPLATES.filter((t) => t.groups.includes(p.group as 'governor') && (!t.when || t.when(s, id))).map((t): Want => ({ id: t.id, text: t.text(s, id), done: t.done, naira: t.naira ? round(t.naira * k) : undefined, pc: t.pc ? Math.round(t.pc * k) : undefined, fx: t.fx(s, id) })).filter((w) => !wasAnswered(all, w));
  if (!options.length) return null;
  // A pressing situation comes first; otherwise the person's own order of wants, which moves on with each answer.
  const pressing = options.filter((w) => TEMPLATES.find((t) => t.id === w.id)?.when && motiveOf(w.id) === 'need');
  const pool = pressing.length ? pressing : options;
  return pool[Math.floor(hash(id + '.' + all.length + '.' + (st.grants ?? 0)) * pool.length)];
}

/** What else could be offered in place of the open request: the other things this person could
 *  plausibly want now, at their current appetite (plan 05.A5 substitution). */
export function alternativesFor(s: GameState, id: string): Want[] {
  const p = PERSON_BY_ID[id], cur = currentWant(s, id);
  if (!p || !cur) return [];
  const k = appetite(s, id), round = (x: number) => Math.round(x * 100) / 100;
  return TEMPLATES.filter((t) => t.id !== cur.id && t.groups.includes(p.group as 'governor') && (!t.when || t.when(s, id)))
    .map((t): Want => ({ id: t.id, text: t.text(s, id), done: t.done, naira: t.naira ? round(t.naira * k) : undefined, pc: t.pc ? Math.round(t.pc * k) : undefined, fx: t.fx(s, id) }));
}
/** What a want is worth to the person asking, in political capital: money counts at twenty points a trillion. */
export const wantValue = (w: Pick<Want, 'pc' | 'naira'>) => (w.pc ?? 0) + 20 * (w.naira ?? 0);

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
    // The same rule openRequest applies: any answered request from this person on this subject in this
    // administration, whichever office it was filed under, is what a new ask must differ from.
    const answered = (r: RequestRecord) => r.status !== 'open' && r.requester === requester && r.origin.administrationId === g.administrationId;
    const sameObject = Object.values(g.requests).filter((r) => answered(r) && r.object === w.id).sort((a, b) => b.made - a.made)[0];
    const key = (t?: { description?: string; naira?: number; politicalCapital?: number }) => JSON.stringify(t ? [t.description, t.naira ?? 0, t.politicalCapital ?? 0] : null);
    if (sameObject && sameObject.text === w.text && key(sameObject.terms) === key(termsOf(w))) continue;
    const prior = sameObject ?? records(s, id).filter((r) => r.status !== 'open').sort((a, b) => b.made - a.made)[0];
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

/** Political capital to sit them down and explain a refusal. */
export const EXPLAIN_PC = 1;

/** How a refusal lands: by motive, by temperament, by their weight, and by whether they were told why. */
export function refusalCost(s: GameState, id: string, motive: Motive, explained: boolean): number {
  const base = { need: 9, patronage: 5, improper: 2 }[motive];
  const temper: Temper = PERSON_BY_ID[id]?.temper ?? 'loyal';
  const k = { loyal: 0.6, transactional: 1, ambitious: 1.3, principled: motive === 'improper' ? 0 : 0.8 }[temper];
  const clout = s.people[id]?.clout ?? PERSON_BY_ID[id]?.clout ?? 3;
  return Math.round(base * k * (0.8 + 0.1 * clout) * (explained ? (motive === 'need' ? 0.5 : 0.4) : 1));
}

/** Refusal closes this request. It neither deletes debts nor manufactures a grudge from unrelated refusals. */
export function refuse(s: GameState, id: string, explained = false): string {
  refreshRequests(s, id);
  const st = s.people[id], w = currentWant(s, id);
  if (!st || !w?.recordId) return '';
  const motive = motiveOf(w.id, w.fx);
  if (explained) s.pc = Math.max(0, s.pc - EXPLAIN_PC);
  closeRequest(s, w.recordId, 'refused', explained ? 'The President declined this request and explained why.' : 'The President declined this request.');
  st.refusals = (st.refusals ?? 0) + 1; st.refusedAt = s.turn;
  st.rel = Math.max(0, st.rel - refusalCost(s, id, motive, explained));
  const grievances = (st.grievances ??= []);
  grievances.push({ motive, turn: s.turn, explained, object: w.id });
  const name = st.short ?? PERSON_BY_ID[id]?.short ?? id;
  // A grudge needs two unexplained refusals of the same kind of ask, within two years. An improper ask refused is no grievance.
  const same = grievances.filter((g) => g.motive === motive && !g.explained && s.turn - g.turn <= 24);
  let grudge = '';
  if (motive !== 'improper' && same.length >= 2 && !st.grudge) {
    st.grudge = true; st.grudgeMotive = motive;
    (s.wronged ??= []).push({ who: id, kind: 'refusal', turn: s.turn, what: `two refusals of ${MOTIVE_NAME[motive]}`, until: s.turn + 24 });
    grudge = ` That is the second time ${name} has been refused ${MOTIVE_NAME[motive]} without a reason. It is now a grievance, and the opposition will hear of it.`;
  }
  if (motive === 'improper') { applyFx(s, ['nation.integrity', 1]); applyFx(s, ['bloc.press', 1]); }
  const how = motive === 'improper' ? ' The refusal of an improper request is noticed, and few hold it against you.'
    : explained ? ` You explain why. ${name} does not like it, but understands it.` : motive === 'need' ? ` It was a real need, and ${name} was given no reason.` : '';
  return `${name} is told no. This request is closed.${how}${grudge}`;
}
export function canRefuse(s: GameState, id: string, explained = false): { ok: boolean; reason?: string } {
  if (!currentWant(s, id)) return { ok: false, reason: 'Has no open request.' };
  if (explained && s.pc < EXPLAIN_PC) return { ok: false, reason: `Needs ${EXPLAIN_PC} political capital.` };
  return { ok: true };
}
/** A grant settles only the grievance it answers: patronage given does not mend a need refused (05.A11). */
export function reconcile(s: GameState, id: string, object: string, fx: Fx[] = []): string | null {
  const st = s.people[id];
  if (!st) return null;
  const motive = motiveOf(object, fx);
  st.grievances = (st.grievances ?? []).filter((g) => g.motive !== motive);
  st.refusals = st.grievances.length;
  if (st.grudge && (st.grudgeMotive ?? motive) === motive) {
    st.grudge = false; delete st.grudgeMotive;
    s.wronged = (s.wronged ?? []).filter((w) => !(w.who === id && w.kind === 'refusal'));
    return 'The grievance this answers is settled.';
  }
  return st.grudge ? `The older grievance, over ${MOTIVE_NAME[st.grudgeMotive as Motive] ?? 'something else'}, is not.` : null;
}
export function grudgeLine(s: GameState, id: string): string | null {
  const st = s.people[id];
  if (st?.grudge) return `Holds a grievance: refused ${MOTIVE_NAME[st.grudgeMotive as Motive] ?? 'what was asked'} twice, without a reason. Only giving that kind of thing will settle it.`;
  const g = (st?.grievances ?? []).filter((x) => s.turn - x.turn <= 24 && x.motive !== 'improper');
  return g.length ? `Refused before: ${g.map((x) => MOTIVE_NAME[x.motive as Motive]).join('; ')}.` : null;
}
