// DELEGATION (plan 06.A5, A6)
// The President can hand a minister an objective: a reform track, a budget the
// minister may commit without asking, a term, and how often to report. Within
// those limits the minister launches the next reform on the track without a
// presidential click. Anything outside them comes back up as an exception: a
// bill that needs the Assembly, a cost over the budget, no room on the agenda,
// no money. Every delegation carries a six-month written target, judged on its
// actual deadline with the government's own contribution to any failure.

import { MILESTONE_BY_ID } from '../content/agenda';
import { PERSON_BY_ID } from '../content/people';
import { setMinisterTarget } from './commitments';
import { hooks } from './hooks';
import { personView } from './people';
import { reformName } from './reforms';
import type { GameState } from './types';
import { clamp } from './vars';

export interface Delegation { office: string; track: string; budget: number; spent: number; since: number; until: number; reporting: 1 | 3; target?: string; escalated: string[]; launched: string[] }

export const DELEGATE_PC = 2;
export const TARGET_MONTHS = 6;

export const delegations = (s: GameState) => (s.delegations ??= {});

export function canDelegate(s: GameState, office: string, track: string, moves: number): { ok: boolean; reason?: string } {
  const p = PERSON_BY_ID[office];
  if (p?.group !== 'minister' || !s.people[office] || s.people[office].gone) return { ok: false };
  if (!(p.tracks ?? []).includes(track)) return { ok: false, reason: 'Not in this minister\'s brief.' };
  if (delegations(s)[office]) return { ok: false, reason: 'Already holds a delegation.' };
  if (moves <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < DELEGATE_PC) return { ok: false, reason: `Needs ${DELEGATE_PC} political capital.` };
  return { ok: true };
}

/** Hand over an objective with a budget, a term and a reporting rhythm. */
export function delegate(s: GameState, office: string, track: string, budget: number, months: number, reporting: 1 | 3): string {
  s.pc = clamp(s.pc - DELEGATE_PC, 0, 100);
  s.desk.actionsUsed += 1;
  let target: string | undefined;
  try { target = setMinisterTarget(s, office, TARGET_MONTHS, 8); } catch { /* a target is already running; it stands */ }
  delegations(s)[office] = { office, track, budget, spent: 0, since: s.turn, until: s.turn + months, reporting, target, escalated: [], launched: [] };
  const name = personView(s, office).name;
  return `${name} has the objective in writing: the next reforms on the track, up to ₦${Math.round(budget * 1000)}bn, for ${months} months, reporting ${reporting === 1 ? 'monthly' : 'every quarter'}. Anything outside that comes back to you. A six-month target is set with it.`;
}

export function endDelegation(s: GameState, office: string, why = 'The President took the objective back.'): void {
  const d = delegations(s)[office];
  if (!d) return;
  delete delegations(s)[office];
  s.report.push({ kind: 'consequence', title: `Delegation ended: ${personView(s, office).short}`, text: `${why} ${d.launched.length ? `Launched under it: ${d.launched.map((id) => reformName(s, id)).join('; ')}.` : 'Nothing was launched under it.'} ₦${Math.round(d.spent * 1000)}bn of ₦${Math.round(d.budget * 1000)}bn committed.`, changes: [] });
}

/** The next reform on the delegated track that could be started now, if any. */
function nextOn(s: GameState, track: string): string | null {
  for (const [id, e] of Object.entries(MILESTONE_BY_ID)) if (e.track.id === track && hooks.milestoneStatus(s, id) === 'next') return id;
  return null;
}

/** Monthly: the minister works within the limits, escalates what falls outside them, and reports. */
export function delegationTick(s: GameState): void {
  for (const d of Object.values(delegations(s))) {
    if (s.people[d.office]?.gone || s.vacancies?.[d.office]) { endDelegation(s, d.office, 'The minister left the post.'); continue; }
    if (s.turn > d.until) { endDelegation(s, d.office, 'The term of the delegation is over.'); continue; }
    const name = personView(s, d.office).short;
    const busy = s.agenda.active.some((a) => MILESTONE_BY_ID[a.id]?.track.id === d.track);
    const id = busy ? null : nextOn(s, d.track);
    if (id) {
      const m = MILESTONE_BY_ID[id].m;
      const cost = hooks.launchMoney(s, id);
      const escalate = (why: string) => {
        if (d.escalated.includes(id + why)) return;
        d.escalated.push(id + why);
        s.report.push({ kind: 'consequence', title: `${name} escalates: ${reformName(s, id)}`, cause: 'Outside the delegated limits', text: why, changes: [] });
      };
      if (m.needs) escalate('It needs the Assembly. The minister cannot negotiate a bill; launch it yourself when the votes are there.');
      else if (d.spent + cost > d.budget + 1e-9) escalate(`It would commit ₦${Math.round(cost * 1000)}bn, beyond the ₦${Math.round((d.budget - d.spent) * 1000)}bn left in the delegated budget.`);
      else {
        const why = hooks.launchDelegated(s, id);
        if (why) escalate(why);
        else {
          d.spent += cost; d.launched.push(id);
          s.report.push({ kind: 'reform', title: `${name} launches ${reformName(s, id)}`, cause: 'Under delegated authority', text: `Within the objective and the budget you set. ₦${Math.round(d.spent * 1000)}bn of ₦${Math.round(d.budget * 1000)}bn now committed.`, changes: [] });
        }
      }
    }
    if ((s.turn - d.since) % d.reporting === 0 && s.turn > d.since) {
      const active = s.agenda.active.filter((a) => MILESTONE_BY_ID[a.id]?.track.id === d.track);
      s.report.push({ kind: 'consequence', title: `Report from ${name}`, cause: 'Delegated objective', text: active.length ? active.map((a) => `${reformName(s, a.id)}: ${Math.round(Math.min(99, a.progress))}%.`).join(' ') : 'Nothing under way on the track this month.', changes: [] });
    }
  }
}
