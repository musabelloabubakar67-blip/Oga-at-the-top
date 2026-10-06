import type { ActorRef, RecordOrigin, RequestChange, RequestRecord, RequestStatus, RequestTerms } from './contracts';
import { clockOf, ensureGovernance, resolveActor } from './governance';
import type { GameState } from './types';

export interface RequestSpec { id: string; requester: ActorRef; object: string; text: string; episodeId?: string; ambition?: string; terms?: RequestTerms; previous?: string; changedBy?: RequestChange }
const validText = (t: string) => typeof t === 'string' && !!t.trim();
const termsKey = (t?: RequestTerms) => JSON.stringify(t ? [t.description, t.naira ?? 0, t.politicalCapital ?? 0] : null);
export function validateRequestTerms(t: RequestTerms | undefined): void {
  if (!t) return;
  if (!validText(t.description)) throw new Error('Missing request terms');
  for (const n of [t.naira, t.politicalCapital]) if (n !== undefined && (!Number.isFinite(n) || n < 0)) throw new Error('Invalid request cost');
}
export function openRequest(s: GameState, spec: RequestSpec, origin?: RecordOrigin): RequestRecord {
  // No changes, including identity migration, occur until every authoring check passes.
  const copy = structuredClone(s), g = ensureGovernance(copy);
  if (!validText(spec.id) || ['__proto__', 'constructor', 'prototype'].includes(spec.id) || Object.hasOwn(g.requests, spec.id)) throw new Error('Duplicate or reserved request ID');
  if (!validText(spec.object) || !validText(spec.text)) throw new Error('Missing request object or text');
  validateRequestTerms(spec.terms);
  if (spec.episodeId && g.episodes[spec.episodeId]?.status !== 'open') throw new Error('Request episode is not open');
  const requester = resolveActor(copy, spec.requester);
  const administrationId = g.administrationId;
  const same = Object.values(g.requests).filter((r) => r.requester === requester && r.object === spec.object && r.origin.administrationId === administrationId);
  if (same.some((r) => r.status === 'open')) throw new Error('This person already has that request open');
  const previous = spec.previous ? g.requests[spec.previous] : undefined;
  if (spec.previous || spec.changedBy) {
    if (!previous || previous.status === 'open' || previous.requester !== requester) throw new Error('A changed request needs a closed request from the same person');
    if (!['offer', 'appeal', 'threat', 'coalition', 'evidence'].includes(spec.changedBy!)) throw new Error('Missing material change reason');
    if (previous.object === spec.object && previous.text === spec.text && termsKey(previous.terms) === termsKey(spec.terms)) throw new Error('A changed request needs changed terms or evidence');
  } else if (same.length) throw new Error('A closed request needs a materially changed replacement');
  const now = clockOf(copy).worldMonth;
  const r: RequestRecord = { id: spec.id, object: spec.object, text: spec.text, terms: spec.terms ? structuredClone(spec.terms) : undefined, episodeId: spec.episodeId, ambition: spec.ambition, previous: spec.previous, changedBy: spec.changedBy, requester, origin: origin ? { ...origin } : { administrationId, eventId: 'person.want' }, made: now, status: 'open', history: [{ at: now, status: 'open', text: spec.text }] };
  g.requests[r.id] = r; s.governance = copy.governance; return r;
}
export function closeRequest(s: GameState, id: string, status: Exclude<RequestStatus, 'open' | 'substituted'>, response: string): void {
  const r = s.governance?.requests[id];
  if (!r || r.status !== 'open') throw new Error('Request is not open');
  if (!['refused', 'granted', 'withdrawn', 'lapsed'].includes(status) || !validText(response)) throw new Error('Invalid request resolution');
  const now = clockOf(s).worldMonth;
  r.status = status; r.closed = now; r.response = response;
  (r.history ??= [{ at: r.made, status: 'open', text: r.text }]).push({ at: now, status, text: response });
}
export function substituteRequest(s: GameState, id: string, text: string, accepted: boolean, terms?: RequestTerms): void {
  const r = s.governance?.requests[id];
  if (!r || r.status !== 'open') throw new Error('Request is not open');
  if (!validText(text) || typeof accepted !== 'boolean') throw new Error('Missing substitution decision');
  validateRequestTerms(terms);
  if (text === r.text && termsKey(terms) === termsKey(r.terms)) throw new Error('Substitution needs a different offer');
  const now = clockOf(s).worldMonth;
  r.substitution = { offered: now, text, accepted, terms: terms ? structuredClone(terms) : undefined };
  (r.history ??= [{ at: r.made, status: 'open', text: r.text }]).push({ at: now, status: accepted ? 'substituted' : 'open', text: accepted ? 'Accepted substitute: ' + text : 'Rejected substitute: ' + text });
  if (accepted) { r.status = 'substituted'; r.closed = now; r.response = text; }
}
