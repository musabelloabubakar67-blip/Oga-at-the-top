// Former officials. A Chief of Staff, a Finance Minister or a minister who saw
// what went into the drawer does not forget it on leaving. Each month the game
// notices who has left a post that witnessed something; for two years after,
// they may publish (a memoir, an interview, a deposition) unless they were given
// somewhere comfortable to go.

import { mo } from './config';
import { PEOPLE } from '../content/people';
import { personView } from './people';
import type { GameState } from './types';
import { applyFx, clamp } from './vars';
import { rand } from './rng';

export type Former = NonNullable<GameState['formers']>[number];

/** The posts whose holders are witnesses to what the President does. */
const SLOTS: [string, string][] = [['cos', 'Chief of Staff'], ['fin', 'Minister of Finance'], ['sap', 'Political Adviser'], ...PEOPLE.filter((p) => p.group === 'minister').map((p) => [p.id, p.title] as [string, string])];
export const LANDING_PC = 3;
const WINDOW = 24;

function holder(s: GameState, id: string): string | undefined {
  return s.chars[id]?.name ?? (s.people[id] ? personView(s, id).name : undefined);
}

export function formersTick(s: GameState): void {
  const was = (s.holders ??= {});
  for (const [id, post] of SLOTS) {
    const now = holder(s, id);
    const before = was[id];
    if (before && now && before !== now) {
      const knows = s.exposures.filter((x) => x.witnesses.includes(id)).length;
      if (knows > 0) (s.formers ??= []).push({ name: before, post, slot: id, left: s.turn, knows });
    }
    if (now) was[id] = now;
  }
  for (const f of s.formers ?? []) {
    if (f.quiet || f.spoke || s.turn - f.left > WINDOW) continue;
    if (rand(s) >= 0.025 * Math.min(4, f.knows)) continue;
    f.spoke = s.turn;
    applyFx(s, ['pressure.scandalHeat', 6 + 2 * Math.min(4, f.knows)]);
    applyFx(s, ['bloc.press', -2]);
    for (const x of s.exposures) if (x.witnesses.includes(f.slot)) x.trail = Math.min(3, x.trail + 1) as 0 | 1 | 2 | 3;
    s.news.push({ chronicle: `FORMER ${f.post.toUpperCase()} ${f.name.toUpperCase()}: "WHAT I SAW IN THE VILLA"`, street: `${f.name.toUpperCase()} DON OPEN MOUTH`, weight: 7, valence: -1, topic: 'scandal', body: `${f.name}, who left the post of ${f.post} ${mo(s.turn - f.left)} ago, has given a long interview. It is careful about dates and very careful about amounts.` });
    s.report.push({ kind: 'failure', title: `${f.name} talked`, cause: `Left as ${f.post} knowing ${f.knows} ${f.knows === 1 ? 'thing' : 'things'}`, text: 'Everything they witnessed is now easier to find. A soft landing would have kept them quiet.', changes: [] });
  }
}

/** Those who left knowing something, and have not yet spoken or been looked after. */
export function risky(s: GameState): Former[] {
  return (s.formers ?? []).filter((f) => !f.quiet && !f.spoke && s.turn - f.left <= WINDOW);
}

export function canLand(s: GameState, name: string, movesLeft: number): { ok: boolean; reason?: string } {
  if (!risky(s).some((f) => f.name === name)) return { ok: false };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < LANDING_PC) return { ok: false, reason: `Needs ${LANDING_PC} political capital.` };
  return { ok: true };
}

/** An embassy, a board, a fellowship abroad: somewhere far enough and comfortable enough. */
export function land(s: GameState, name: string): string {
  const f = risky(s).find((x) => x.name === name)!;
  s.pc = clamp(s.pc - LANDING_PC, 0, 100);
  f.quiet = true;
  applyFx(s, ['nation.integrity', -0.5]);
  return `${f.name} is nominated as ambassador to a pleasant country with a good school for the children. The memoir is postponed indefinitely.`;
}
