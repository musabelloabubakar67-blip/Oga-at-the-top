// BILLS, CONCESSIONS AND PROGRAMME COALITIONS (plan 06)
// A reform that needs the Assembly is a bill. Each senator votes from their
// position on the issue, their regard for the President, any debt of a vote they
// owe, and whatever has been conceded to them: first sites in their zone, a
// share for the states, a later start, an oversight committee or the chair of
// the new body. A bill passes if the party carries it, or if the whip count
// shows a majority. When it passes, every concession becomes a public
// commitment in the register: kept, it builds trust; revoked, it is a broken
// deal with a name on it. Those who were outvoted remember, and those who were
// bought expect the price to be paid.
//
// Two politicians who are cool towards the President can make a pact. A pact is
// a joint demand on an issue: accept it, and both carry bills on that issue
// with the concession they asked for built in; refuse it, and they vote
// together against them.

import { MILESTONE_BY_ID } from '../content/agenda';
import { PEOPLE, PERSON_BY_ID } from '../content/people';
import { CONCESSIONS, ISSUE_NAME, STANCES, type ConcessionKind } from '../content/positions';
import { clockOf, ensureGovernance, resolveActor } from './governance';
import { closeRequest, openRequest } from './requests';
import type { Fx, GameState } from './types';
import { applyFx, clamp, standing, test } from './vars';

export interface Concession { voter: string; kind: ConcessionKind; at: number; commitment?: string; revoked?: number; reacted?: boolean; payUntil?: number }
export interface Bill { id: string; concessions: Concession[]; passed?: number; deferred?: { due: number; fx: Fx[] }; votes?: { id: string; yes: boolean }[] }
export interface Coalition { id: string; members: [string, string]; issue: string; demand: ConcessionKind; made: number; status: 'open' | 'accepted' | 'refused' | 'lapsed'; answered?: number; request?: string }

/** A share for the states, per month, for two years. */
export const REVENUE_SHARE = 0.02;
export const REVENUE_MONTHS = 24;
export const DEFER_MONTHS = 6;
export const OVERSIGHT_MONTHS = 12;
export const COALITION_LAPSE = 12;

export const bills = (s: GameState) => (s.bills ??= {});
export const coalitions = (s: GameState) => (s.coalitions ??= []);

/** A reform the Assembly must vote on: one whose condition is the Senate. */
export function isBill(id: string): boolean {
  const needs = MILESTONE_BY_ID[id]?.m.needs;
  return !!needs && 'v' in needs && needs.v[0] === 'senate';
}
/** A constitutional change needs two thirds, and the governors' state assemblies as well. */
export function isAmendment(id: string): boolean {
  const needs = MILESTONE_BY_ID[id]?.m.needs;
  return !!needs && 'v' in needs && needs.v[0] === 'senate' && Number(needs.v[2]) >= 56;
}
export const issueOf = (id: string) => MILESTONE_BY_ID[id]?.track.id ?? '';

export function votersFor(s: GameState, id: string): string[] {
  const groups = isAmendment(id) ? ['senator', 'governor'] : ['senator'];
  return PEOPLE.filter((p) => groups.includes(p.group) && s.people[p.id] && !s.people[p.id].gone).map((p) => p.id);
}

export interface VoterView { id: string; name: string; weight: number; score: number; yes: boolean; reasons: string[]; concession?: Concession }

export function voterView(s: GameState, id: string, voter: string): VoterView {
  const issue = issueOf(id), st = s.people[voter];
  const position = STANCES[voter]?.positions[issue] ?? 0;
  const reasons: string[] = [];
  let score = position * 12;
  if (position) reasons.push(`${position > 0 ? 'For' : 'Against'} on ${ISSUE_NAME[issue] ?? issue} (${position > 0 ? '+' : ''}${position})`);
  const regard = (standing(s, voter) - 50) * 0.6;
  score += regard;
  if (Math.abs(regard) >= 3) reasons.push(regard > 0 ? 'Warm towards you' : 'Cool towards you');
  // Members follow the party's mood as well as their own.
  const party = (s.blocs.party - 50) * 0.3;
  score += party;
  if (Math.abs(party) >= 3) reasons.push(party > 0 ? 'The party is with you' : 'The party is not with you');
  if ((st?.compliantUntil ?? 0) >= s.turn) { score += 40; reasons.push('Owes you a vote'); }
  if (st?.grudge) { score -= 10; reasons.push('Holds a grievance'); }
  const c = bills(s)[id]?.concessions.find((x) => x.voter === voter && !x.revoked);
  // A concession is worth half to someone who does not trust the President to deliver it.
  if (c) { const trust = standing(s, voter) < 35 ? 0.5 : 1; score += (18 + (STANCES[voter]?.prefers === c.kind ? 8 : 0)) * trust; reasons.push(`Conceded: ${CONCESSIONS[c.kind].name.toLowerCase()}${trust < 1 ? ', but doubts you will deliver it' : ''}`); }
  for (const k of coalitions(s).filter((k) => k.members.includes(voter) && k.issue === issue)) {
    if (k.status === 'accepted') { score += 15; reasons.push('Their pact\'s demand was accepted'); }
    if (k.status === 'refused' && s.turn - (k.answered ?? 0) <= 24) { score -= 15; reasons.push('Their pact\'s demand was refused'); }
  }
  const p = PERSON_BY_ID[voter];
  return { id: voter, name: st?.name ?? p.name, weight: st?.clout ?? p.clout, score: Math.round(score), yes: score >= 0, reasons, concession: c };
}

export function whipCount(s: GameState, id: string): { voters: VoterView[]; yes: number; total: number; need: number; majority: boolean } {
  const voters = votersFor(s, id).map((v) => voterView(s, id, v));
  const total = voters.reduce((a, v) => a + v.weight, 0), yes = voters.filter((v) => v.yes).reduce((a, v) => a + v.weight, 0);
  const need = total * (isAmendment(id) ? 2 / 3 : 0.5);
  return { voters, yes, total, need, majority: total > 0 && yes > need };
}

/** The party carries it, or the count does. */
export function billPasses(s: GameState, id: string): boolean {
  const needs = MILESTONE_BY_ID[id]?.m.needs;
  if (!needs || test(s, needs)) return true;
  return isBill(id) && whipCount(s, id).majority;
}

export function canConcede(s: GameState, id: string, voter: string, kind: ConcessionKind, moves: number): { ok: boolean; reason?: string } {
  if (!isBill(id) || !votersFor(s, id).includes(voter) || !CONCESSIONS[kind]) return { ok: false };
  const b = bills(s)[id];
  if (b?.passed !== undefined || s.agenda.done.includes(id)) return { ok: false, reason: 'The bill has already passed.' };
  if (b?.concessions.some((c) => c.voter === voter && !c.revoked)) return { ok: false, reason: 'Already has a concession on this bill.' };
  if (moves <= 0) return { ok: false, reason: "This month's moves are used." };
  return { ok: true };
}

/** Negotiate a provision with one voter. It binds only if the bill passes. */
export function concede(s: GameState, id: string, voter: string, kind: ConcessionKind): string {
  const b = (bills(s)[id] ??= { id, concessions: [] });
  b.concessions.push({ voter, kind, at: s.turn });
  s.desk.actionsUsed += 1;
  s.people[voter].rel = clamp(s.people[voter].rel + 2, 0, 100);
  const v = voterView(s, id, voter);
  return `${v.name} is offered ${CONCESSIONS[kind].name.toLowerCase()}. ${v.yes ? 'The vote is now with you.' : 'It is not yet enough for the vote.'} It binds if the bill passes.`;
}

/** At the final vote: concessions become commitments, provisions take effect, and the outvoted remember.
 *  Returns the reform's effects if a later start defers them. */
export function billPassed(s: GameState, id: string, effects: Fx[]): Fx[] | null {
  if (!isBill(id)) return null;
  const b = (bills(s)[id] ??= { id, concessions: [] });
  const count = whipCount(s, id);
  b.passed = s.turn;
  b.votes = count.voters.map((v) => ({ id: v.id, yes: v.yes }));
  // A pact whose demand was accepted is paid on every bill on its issue.
  for (const k of coalitions(s).filter((k) => k.status === 'accepted' && k.issue === issueOf(id))) {
    for (const m of k.members) if (votersFor(s, id).includes(m) && !b.concessions.some((c) => c.voter === m && !c.revoked)) b.concessions.push({ voter: m, kind: k.demand, at: s.turn });
  }
  const g = ensureGovernance(s), now = clockOf(s).worldMonth, name = MILESTONE_BY_ID[id].m.name;
  let defer = false;
  for (const c of b.concessions.filter((c) => !c.revoked)) {
    const st = s.people[c.voter], who = st?.name ?? PERSON_BY_ID[c.voter].name, seat = STANCES[c.voter]?.seat ?? 'NC';
    switch (c.kind) {
      case 'geography': applyFx(s, [`zone.${seat}.approval`, 2]); applyFx(s, ['approval', -0.3]); break;
      case 'revenue': c.payUntil = s.turn + REVENUE_MONTHS; break;
      case 'date': defer = true; break;
      case 'oversight': applyFx(s, ['nation.integrity', 1]); break;
      case 'appointment': applyFx(s, ['nation.integrity', -1.5]); st.rel = clamp(st.rel + 6, 0, 100); break;
    }
    st.rel = clamp(st.rel + 4, 0, 100);
    s.flags[`concession.${id}.${c.voter}`] = 1;
    const cid = `bill.${g.administrationId}.${id}.${c.voter}`;
    if (!g.commitments[cid]) {
      g.commitments[cid] = { id: cid, origin: { administrationId: g.administrationId, eventId: 'bill.passed', choiceId: id }, responsible: g.offices.president, parties: [g.offices.president, resolveActor(s, { office: c.voter })], object: 'bill-concession', text: `${name}: ${CONCESSIONS[c.kind].name.toLowerCase()} for ${who}. ${CONCESSIONS[c.kind].text}`, made: now, due: now + 12, visibility: 'public', status: 'open', notes: [], verify: { flag: `concession.${id}.${c.voter}`, is: 1 } };
    }
    c.commitment = cid;
  }
  // The outvoted remember; those who voted for it with nothing promised are owed a little goodwill.
  for (const v of count.voters) if (!v.yes) s.people[v.id].rel = clamp(s.people[v.id].rel - 3, 0, 100);
  if (!defer) return null;
  b.deferred = { due: s.turn + DEFER_MONTHS, fx: effects };
  return effects;
}

export function canRevoke(s: GameState, id: string, voter: string): { ok: boolean; reason?: string } {
  const c = bills(s)[id]?.concessions.find((x) => x.voter === voter && !x.revoked);
  if (!c || bills(s)[id]?.passed === undefined) return { ok: false };
  const cm = c.commitment ? s.governance?.commitments[c.commitment] : undefined;
  if (cm && cm.status !== 'open' && cm.status !== 'review-due') return { ok: false, reason: 'The commitment has already been reviewed.' };
  return { ok: true };
}

/** Go back on a concession after the vote. It saves what it cost, and it is a broken deal. */
export function revoke(s: GameState, id: string, voter: string): string {
  const c = bills(s)[id]!.concessions.find((x) => x.voter === voter && !x.revoked)!;
  c.revoked = s.turn; c.payUntil = undefined;
  s.flags[`concession.${id}.${voter}`] = 0;
  const st = s.people[voter], who = st.name ?? PERSON_BY_ID[voter].name;
  st.rel = clamp(st.rel - 20, 0, 100);
  (s.wronged ??= []).push({ who: voter, kind: 'deal', turn: s.turn, what: `a concession withdrawn after the vote on ${MILESTONE_BY_ID[id].m.name.toLowerCase()}`, until: s.turn + 36 });
  const cm = c.commitment ? s.governance?.commitments[c.commitment] : undefined;
  if (cm) { cm.status = 'broken'; cm.notes.push({ at: clockOf(s).worldMonth, text: 'Withdrawn by the President after the vote.' }); }
  // Everyone who was promised something on any bill hears of it.
  for (const b of Object.values(bills(s))) for (const x of b.concessions) if (!x.revoked && x.voter !== voter && s.people[x.voter]) s.people[x.voter].rel = clamp(s.people[x.voter].rel - 4, 0, 100);
  return `The concession to ${who} is withdrawn. It saves what it cost. ${who} will not trade a vote for a promise again, and everyone else promised something has noticed.`;
}

/** Monthly: shares paid, hearings held, deferred provisions take effect, kept deals rewarded. */
export function billTick(s: GameState): void {
  for (const b of Object.values(bills(s))) {
    for (const c of b.concessions) {
      if (c.revoked || b.passed === undefined) continue;
      if (c.kind === 'revenue' && (c.payUntil ?? 0) >= s.turn) applyFx(s, ['nation.fiscalSpace', -REVENUE_SHARE]);
      if (c.kind === 'oversight' && s.turn - b.passed <= OVERSIGHT_MONTHS && s.turn > b.passed) applyFx(s, ['pc', -0.3]);
      const cm = c.commitment ? s.governance?.commitments[c.commitment] : undefined;
      if (cm?.status === 'kept' && !c.reacted) {
        c.reacted = true;
        if (s.people[c.voter]) s.people[c.voter].rel = clamp(s.people[c.voter].rel + 6, 0, 100);
        s.report.push({ kind: 'consequence', title: `A deal that held: ${MILESTONE_BY_ID[b.id].m.name}`, text: `A year on, what was conceded to ${PERSON_BY_ID[c.voter].short} has been delivered. The next negotiation starts from trust.`, changes: [] });
      }
    }
    if (b.deferred && s.turn >= b.deferred.due) {
      for (const fx of b.deferred.fx) applyFx(s, fx);
      s.report.push({ kind: 'reform', title: `In force: ${MILESTONE_BY_ID[b.id].m.name}`, text: 'The later start agreed in the Assembly has arrived; the law\'s main provisions now take effect.', changes: [] });
      delete b.deferred;
    }
  }
  for (const k of coalitions(s)) if (k.status === 'open' && s.turn - k.made >= COALITION_LAPSE) {
    k.status = 'lapsed'; k.answered = s.turn;
    if (k.request && s.governance?.requests[k.request]?.status === 'open') closeRequest(s, k.request, 'lapsed', 'The President never answered.');
    for (const m of k.members) if (s.people[m]) s.people[m].rel = clamp(s.people[m].rel - 3, 0, 100);
  }
}

// ---------------------------------------------------------------- programme coalitions (06.A2)

/** Two politicians who have made a pact put a joint demand on the issue where they stand furthest from the government. */
export function formCoalition(s: GameState, a: string, b: string): Coalition | null {
  if (!STANCES[a] || !STANCES[b]) return null;
  if (coalitions(s).some((k) => k.members.includes(a) && k.members.includes(b) && (k.status === 'open' || k.status === 'accepted'))) return null;
  const issues = [...new Set([...Object.keys(STANCES[a].positions), ...Object.keys(STANCES[b].positions)])];
  if (!issues.length) return null;
  const sum = (i: string) => (STANCES[a].positions[i] ?? 0) + (STANCES[b].positions[i] ?? 0);
  const issue = issues.sort((x, y) => sum(x) - sum(y))[0];
  const demand = STANCES[a].prefers;
  const k: Coalition = { id: `pact.${a}.${b}.${s.turn}`, members: [a, b], issue, demand, made: s.turn, status: 'open' };
  try {
    const r = openRequest(s, { id: `coalition.${clockOf(s).administrationId}.${k.id}`, requester: { office: a }, object: `coalition:${issue}`, text: `${PERSON_BY_ID[a].short} and ${PERSON_BY_ID[b].short}: ${CONCESSIONS[demand].name.toLowerCase()} written into any law on ${ISSUE_NAME[issue] ?? issue}, as the price of their votes.`, ambition: 'coalition', changedBy: undefined });
    k.request = r.id;
  } catch { /* a request on this subject is already open or answered; the pact stands without a second record */ }
  coalitions(s).push(k);
  return k;
}

export function canAnswerCoalition(s: GameState, id: string): { ok: boolean; reason?: string } {
  const k = coalitions(s).find((x) => x.id === id);
  if (!k || k.status !== 'open') return { ok: false };
  return { ok: true };
}

/** Accept: both carry bills on the issue, with their demand built into each. Refuse: they vote together against. */
export function answerCoalition(s: GameState, id: string, accept: boolean): string {
  const k = coalitions(s).find((x) => x.id === id)!;
  k.status = accept ? 'accepted' : 'refused'; k.answered = s.turn;
  if (k.request && s.governance?.requests[k.request]?.status === 'open') closeRequest(s, k.request, accept ? 'granted' : 'refused', accept ? 'Accepted: the demand is built into every bill on the issue.' : 'Refused.');
  const names = k.members.map((m) => PERSON_BY_ID[m].short).join(' and ');
  for (const m of k.members) if (s.people[m]) s.people[m].rel = clamp(s.people[m].rel + (accept ? 6 : -6), 0, 100);
  return accept
    ? `${names} have their demand: every law on ${ISSUE_NAME[k.issue] ?? k.issue} will carry ${CONCESSIONS[k.demand].name.toLowerCase()}, and they will carry those laws.`
    : `${names} are refused. On ${ISSUE_NAME[k.issue] ?? k.issue}, they now vote together, against.`;
}
