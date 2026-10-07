// The former President. In a country played on from one presidency to the next,
// the last President is still there: in the party, on television, in the files.
// Of your party, they can hold the elders and the delegates for you or against
// you. Of the other, they are the opposition's most quoted voice. They want
// things, and how you answer is remembered.

import { CFG } from './config';
import { strongestRival } from './people';
import type { GameState } from './types';
import { applyFx, clamp } from './vars';

export function predActive(s: GameState): boolean {
  return !!s.predecessor && !s.flags['pred.gone'];
}

/** A case against the former President ends any friendship, and a conviction ends the influence. */
export function predTick(s: GameState): void {
  const p = s.predecessor;
  if (!p || !predActive(s)) return;
  const rel = (p.rel ??= p.sameParty ? 60 : 25);
  const charged = (s.cases ?? []).find((c) => c.who === 'pred');
  if (charged && !charged.outcome) p.rel = Math.min(rel, 5);
  if (charged?.outcome === 'convicted' || charged?.outcome === 'fled') { s.flags['pred.gone'] = true; return; }
  // Old loyalties fade; old grudges a little slower.
  p.rel = clamp(p.rel + ((p.sameParty ? 50 : 30) - p.rel) * 0.01, 0, 100);
  if (p.sameParty) {
    if (p.rel >= 60) applyFx(s, ['bloc.party', 0.03]);
    if (p.rel < 35) applyFx(s, ['bloc.party', -0.07]);
  } else if (p.rel < 35) {
    const r = strongestRival(s);
    s.opposition[r.id] = clamp((s.opposition[r.id] ?? 30) + 0.08, 5, 95);
  }
  // Complicated legacies (plan 16.A14). An honest former President who is crossed is believed when they criticise.
  if (p.kept < 5 && p.rel < 30) applyFx(s, ['bloc.press', -0.1]);
  // A party chairman from the last government pulls the party their way.
  if (s.flags['post.chair'] && p.sameParty) applyFx(s, ['bloc.party', p.rel >= 50 ? 0.05 : -0.08]);
  // A former President with an institute defends the institutions, whatever else they did: abolishing one costs more.
  if (s.flags['post.foundation'] && (s.inheritance?.institutions ?? []).some((id) => !(s.institutions ?? []).some((i) => i.id === id)) && !s.flags['pred.defended']) {
    s.flags['pred.defended'] = true;
    applyFx(s, ['bloc.press', -4]); applyFx(s, ['nation.integrity', -1]);
    s.news.push({ chronicle: `FORMER PRESIDENT ${p.name.toUpperCase()} CONDEMNS ABOLITION OF INSTITUTION`, street: 'OLD OGA SAY DEM NO SUPPOSED CLOSE AM', weight: 5, valence: -1, topic: 'politics', body: `${p.name}'s institute calls it "the dismantling of a check that outlasts any of us". Some of the people saying so remember what else the former President did.` });
  }
}

export function predMood(rel: number): string {
  return rel >= 70 ? 'A friend' : rel >= 50 ? 'Cordial' : rel >= 35 ? 'Cool' : rel >= 15 ? 'Hostile' : 'An enemy';
}

/** What the former President is doing to you, every month, in words. */
export function predEffect(s: GameState): string {
  const p = s.predecessor;
  if (!p || !predActive(s)) return '';
  const rel = p.rel ?? 50;
  if (p.sameParty) return rel >= 60 ? 'Keeps the party elders in line for you.' : rel < 35 ? 'Works the party elders and delegates against you every month.' : 'Neither helps nor hinders, for now.';
  return rel < 35 ? 'Lends the opposition his name and his donors every month.' : 'Keeps a statesman\'s distance from the opposition.';
}

export const PRED_VISIT_PC = 3;
export function canVisit(s: GameState, movesLeft: number): { ok: boolean; reason?: string } {
  if (!predActive(s)) return { ok: false };
  if (s.turn - (s.counters['pred.visit'] ?? -99) < CFG.electionTermTurn / 4) return { ok: false, reason: 'You called on the former President recently.' };
  if ((s.cases ?? []).some((c) => c.who === 'pred' && !c.outcome)) return { ok: false, reason: 'Not while your government is prosecuting them.' };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < PRED_VISIT_PC) return { ok: false, reason: `Needs ${PRED_VISIT_PC} political capital.` };
  return { ok: true };
}

export function visit(s: GameState): string {
  const p = s.predecessor!;
  s.pc = clamp(s.pc - PRED_VISIT_PC, 0, 100);
  s.counters['pred.visit'] = s.turn;
  p.rel = clamp((p.rel ?? 50) + 10, 0, 100);
  return `You fly to ${p.name}'s home town for lunch and three hours of advice. The photographs say continuity. ${p.name} says, afterwards, that you listen, which is the best thing one President says of another.`;
}
