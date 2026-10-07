// DEPUTIES AND PROMOTIONS (plan 03.A6)
// A minister can be given a deputy from the talent pool. Serving under a capable
// minister, a deputy grows into the job: a year under a competent minister adds
// competence, and a deputy can be promoted into the post without the cost and
// disruption of an outside replacement. A promoted deputy becomes a possible
// successor in their own right. Strong people who are dismissed do not vanish:
// the opposition recruits them.

import { PERSON_BY_ID } from '../content/people';
import { personView, replaceMinisterWith } from './people';
import { candidatesFor, take, talent } from './talent';
import type { GameState } from './types';
import { clamp } from './vars';

export const DEPUTY_PC = 2;
export const PROMOTE_PC = 2;

export function deputies(s: GameState): Record<string, { cid: string; since: number; grown: number }> {
  return (s.deputies ??= {});
}

/** Who could deputise in a ministry: people in the pool who fit the post. */
export function deputyOptions(s: GameState, post: string) {
  return candidatesFor(s, post, 6).filter((o) => o.fit && !o.refuses && !o.c.exceptional);
}

export function canAppointDeputy(s: GameState, post: string, cid: string, moves: number): { ok: boolean; reason?: string } {
  if (PERSON_BY_ID[post]?.group !== 'minister') return { ok: false };
  if (deputies(s)[post]) return { ok: false, reason: 'The ministry already has a deputy.' };
  if (!deputyOptions(s, post).some((o) => o.c.id === cid)) return { ok: false, reason: 'Not available.' };
  if (moves <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < DEPUTY_PC) return { ok: false, reason: `Needs ${DEPUTY_PC} political capital.` };
  return { ok: true };
}

export function appointDeputy(s: GameState, post: string, cid: string): string {
  const o = deputyOptions(s, post).find((x) => x.c.id === cid)!;
  take(s, cid);
  deputies(s)[post] = { cid, since: s.turn, grown: 0 };
  s.pc = clamp(s.pc - DEPUTY_PC, 0, 100);
  s.desk.actionsUsed += 1;
  return `${o.c.name} becomes deputy to ${personView(s, post).name}. A year under a capable minister will show what they can do.`;
}

/** Monthly: deputies under capable ministers grow into the job. */
export function deputyTick(s: GameState): void {
  const t = talent(s);
  for (const [post, d] of Object.entries(deputies(s))) {
    const c = t.pool.find((x) => x.id === d.cid);
    if (!c) { delete deputies(s)[post]; continue; }
    const months = s.turn - d.since;
    if (months > 0 && months % 12 === 0 && (personView(s, post).competence ?? 3) >= 4 && c.competence < 5) {
      c.competence += 1; d.grown += 1;
      s.report.push({ kind: 'consequence', title: `${c.name} has grown into the job`, text: `A year as deputy to a capable minister: ${c.name} is now ready for more.`, changes: [] });
    }
  }
}

export function canPromote(s: GameState, post: string, moves: number): { ok: boolean; reason?: string } {
  const d = deputies(s)[post];
  if (!d) return { ok: false };
  if (s.turn - d.since < 6) return { ok: false, reason: 'Too new to step up: six months as deputy first.' };
  if (moves <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < PROMOTE_PC) return { ok: false, reason: `Needs ${PROMOTE_PC} political capital.` };
  return { ok: true };
}

/** The deputy steps up. Continuity costs less than an outside appointment. */
export function promote(s: GameState, post: string): string {
  const d = deputies(s)[post];
  const c = talent(s).pool.find((x) => x.id === d.cid)!;
  const t = talent(s);
  t.taken = t.taken.filter((x) => x !== c.id);
  const o = candidatesFor(s, post, 99).find((x) => x.c.id === c.id)!;
  const old = personView(s, post).name;
  const text = replaceMinisterWith(s, post, o).text;
  delete deputies(s)[post];
  s.pc = clamp(s.pc - PROMOTE_PC, 0, 100);
  s.desk.actionsUsed += 1;
  s.archive.push({ id: `promote.${post}.${s.turn}`, turn: s.turn, eventId: 'promotion', choiceId: post, category: 'politics', headline: `Promoted ${c.name}, the deputy, to replace ${old}.`, sig: 2, touches: {} });
  return `${c.name} steps up from deputy. ${text}`;
}
