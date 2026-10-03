// Delivered reforms do not stay delivered by themselves. Whoever lost from one
// waits until it is safe, then comes for it: a businessman with lawyers and a
// lobby, the Senate with a repeal bill, or a court someone can reach.

import { MILESTONE_BY_ID } from '../content/agenda';
import { PERSON_BY_ID } from '../content/people';
import { TYCOONS } from '../content/tycoons';
import { contested } from './courts';
import type { GameState } from './types';
import { applyFx, standing } from './vars';

/** Who lost from it: a businessman or governor it cost when launched, or the least friendly businessman if it cost the establishment. */
export function loserOf(s: GameState, id: string): string | null {
  const m = MILESTONE_BY_ID[id]?.m;
  if (!m) return null;
  const hits = (m.start ?? []).filter(([, v]) => v < 0).map(([t]) => t);
  const ty = hits.find((t) => t.startsWith('tycoon.'));
  if (ty) return ty.slice(7);
  const gov = hits.find((t) => t.startsWith('person.gov'));
  if (gov && PERSON_BY_ID[gov.slice(7)] && !s.people[gov.slice(7)]?.gone) return gov.slice(7);
  if (hits.includes('bloc.establishment')) return [...TYCOONS].sort((a, b) => (s.tycoons[a.id]?.rel ?? 50) - (s.tycoons[b.id]?.rel ?? 50))[0].id;
  return null;
}

const hostility = (s: GameState, id: string) => s.tycoons[id]?.rel ?? standing(s, id);

/** The delivered reform most likely to be attacked now: contested, delivered at least six months ago, not attacked in two and a half years. */
export function attackedReform(s: GameState): string | null {
  const list = s.agenda.done.filter((id) => contested(id)
    && s.turn - (s.counters[`done.${id}`] ?? 0) >= 6
    && s.turn - (s.counters[`attack.${id}`] ?? -99) >= 30
    && loserOf(s, id));
  list.sort((a, b) => hostility(s, loserOf(s, a)!) - hostility(s, loserOf(s, b)!));
  return list[0] ?? null;
}

export function reformLoser(s: GameState): string | null {
  const id = attackedReform(s);
  return id ? loserOf(s, id) : null;
}
export const reformLoserTycoon = (s: GameState) => { const l = reformLoser(s); return l && s.tycoons[l] ? l : null; };
export const reformLoserGovernor = (s: GameState) => { const l = reformLoser(s); return l && PERSON_BY_ID[l]?.group === 'governor' ? l : null; };

/** Undo part of what a reform delivered. A full repeal takes it off the books: it can be passed again. */
export function weaken(s: GameState, id: string, share: number): string {
  const entry = MILESTONE_BY_ID[id];
  if (!entry || !s.agenda.done.includes(id)) return '';
  const { m } = entry;
  s.counters[`attack.${id}`] = s.turn;
  if (share <= 0) return `${m.name} survives intact.`;
  for (const [t, v] of m.done) if (t !== 'pc') applyFx(s, [t, -v * Math.min(share, 0.6)]);
  if (share >= 1) {
    s.agenda.done = s.agenda.done.filter((x) => x !== id);
    for (const k of Object.keys(m.flags ?? {})) delete s.flags[k];
    s.counters[`repealed.${id}`] = s.turn;
    return `${m.name} is repealed. It can be passed again, from the beginning.`;
  }
  s.counters[`weak.${id}`] = (s.counters[`weak.${id}`] ?? 0) + 1;
  return `${m.name} survives, weakened.`;
}
