// EPISODES: RECURRING PROBLEMS AS DEVELOPING STORIES (plan 07.A3-A6)
// A recurring file belongs to a family and a subject. The first one opens an
// episode; later ones are its developments, paced so that an open problem does
// not demand the same decision every month. When the family's exit condition
// holds, the episode closes with a report that says what was achieved and what
// the solved problem turns into, and the recurring files stop. If the problem
// comes back, the new episode begins by saying how long the solution held.
// Episodes are mirrored into the governance register (contract R2) so the
// register and the archive see the same stories.

import { FAMILIES, FAMILY_OF, type Family } from '../content/families';
import type { DeskClassification } from './contracts';
import { clockOf, ensureGovernance } from './governance';
import { mo } from './config';
import type { GameEvent, GameState, ReportItem } from './types';
import { test, ZONE_NAME } from './vars';

export interface Episode { family: string; subject: string; opened: number; beats: { turn: number; event: string }[]; closed?: number; record?: string }

export const episodes = (s: GameState) => (s.families ??= {});
export const subjectOf = (f: Family, eventId: string) => f.subjects?.[eventId] ?? f.id;
const key = (f: Family, subject: string) => `${f.id}:${subject}`;
const subjectName = (subject: string) => (ZONE_NAME as Record<string, string>)[subject] ?? subject;

/** The problem is solved for this subject. Families without an exit are never solved. */
export function solved(s: GameState, f: Family, subject: string): boolean {
  const c = f.exitBy?.[subject] ?? f.exit;
  return !!c && test(s, c);
}

/** The live episode for this event's subject, if any. */
export function liveEpisode(s: GameState, eventId: string): Episode | undefined {
  const f = FAMILY_OF[eventId];
  if (!f) return undefined;
  const ep = episodes(s)[key(f, subjectOf(f, eventId))];
  return ep && ep.closed === undefined ? ep : undefined;
}

/** Why a drawn file in a family should not come now: the problem is solved, or the episode had a beat too recently.
 *  Queued follow-ups are intentional beats and are not checked here. */
export function familyBlocks(s: GameState, e: GameEvent): boolean {
  const f = FAMILY_OF[e.id];
  if (!f) return false;
  const subject = subjectOf(f, e.id);
  if ((e.kind === 'recurring' || e.kind === 'threshold') && solved(s, f, subject)) return true;
  const ep = episodes(s)[key(f, subject)];
  const last = ep?.closed === undefined ? ep?.beats.at(-1)?.turn : undefined;
  return last !== undefined && s.turn - last < f.gap;
}

/** A file in a family has reached the desk: open the episode, or record its development. */
export function beat(s: GameState, eventId: string): void {
  const f = FAMILY_OF[eventId];
  if (!f) return;
  const subject = subjectOf(f, eventId), k = key(f, subject);
  const table = episodes(s);
  let ep = table[k];
  const g = ensureGovernance(s), now = clockOf(s).worldMonth;
  if (!ep || ep.closed !== undefined) {
    // The problem is back: say how long the solution held.
    if (ep?.closed !== undefined) {
      s.report.push({ kind: 'failure', cls: 'condition', title: `${f.name}${subject !== f.id ? ` (${subjectName(subject)})` : ''}: the problem is back`, text: `It had been settled for ${mo(Math.max(1, s.turn - ep.closed))}. Whatever held it has stopped holding.`, changes: [] });
    }
    const record = `episode.${g.administrationId}.${k}.${s.turn}`;
    ep = table[k] = { family: f.id, subject, opened: s.turn, beats: [], record };
    if (!g.episodes[record]) g.episodes[record] = { origin: { administrationId: g.administrationId, eventId }, episodeId: record, family: f.id, subject, classification: 'decision', opened: now, changed: now, stage: 'opened', status: 'open', developments: [{ at: now, stage: 'opened', note: `First file: ${eventId}.` }] };
  } else if (ep.record && g.episodes[ep.record]?.status === 'open') {
    const r = g.episodes[ep.record];
    const stage = `development ${ep.beats.length + 1}`;
    r.stage = stage; r.changed = now; r.classification = 'decision';
    r.developments.push({ at: now, stage, note: `${eventId}, ${mo(Math.max(1, s.turn - (ep.beats.at(-1)?.turn ?? s.turn)))} after the last.` });
  }
  ep.beats.push({ turn: s.turn, event: eventId });
}

/** Monthly: solved problems close with a report that says what was achieved and what comes next. */
export function episodeTick(s: GameState): void {
  const g = s.governance;
  for (const ep of Object.values(episodes(s))) {
    if (ep.closed !== undefined) continue;
    const f = FAMILIES.find((x) => x.id === ep.family);
    if (!f?.closing || !solved(s, f, ep.subject)) continue;
    ep.closed = s.turn;
    s.flags[`closed.${f.id}${ep.subject !== f.id ? '.' + ep.subject : ''}`] = s.turn;
    const where = ep.subject !== f.id ? ` (${subjectName(ep.subject)})` : '';
    s.report.push({ kind: 'reform', cls: 'closing', title: `${f.closing.title}${where}`, cause: `${f.name}: ${ep.beats.length} file${ep.beats.length === 1 ? '' : 's'} over ${mo(Math.max(1, s.turn - ep.opened))}`, text: `${f.closing.text}${f.next ? ` ${f.next}` : ''}`, changes: [] });
    const r = ep.record ? g?.episodes[ep.record] : undefined;
    if (r && r.status === 'open') { r.status = 'resolved'; r.classification = 'closing'; r.changed = clockOf(s).worldMonth; r.developments.push({ at: r.changed, stage: r.stage, note: f.closing.title }); }
  }
}

/** How a line in the month's report should be read: a decision taken, progress, a standing condition, or something closed. */
export function reportClass(r: ReportItem): DeskClassification {
  if (r.cls) return r.cls;
  if (/^(A promise kept|A promise broken|Commitment review|A deal that held|What really happened|Delegation ended|In force)/.test(r.title)) return 'closing';
  if (r.kind === 'reform' || /^Report from|launches|grown into the job/.test(r.title)) return 'progress';
  return 'condition';
}
