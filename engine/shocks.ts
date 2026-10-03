// Shocks: what happens to the country from outside. Each hits (or pays) every month
// for a few months; what the President built, and how the government answered,
// decides how much. Every cushion and every gap is named.

import { SHOCKS, SHOCK_BY_ID, type Guard, type ShockDef } from '../content/shocks';
import { diff, snapshot } from './effects';
import { rand, weighted } from './rng';
import type { Fx, GameState } from './types';
import { applyFx, test } from './vars';

/** How much of a shock lands this month, and why. Bad: the share felt. Good: the share caught. */
export function shockFactor(s: GameState, d: ShockDef): { factor: number; met: Guard[]; missing: Guard[] } {
  const met = d.guards.filter((g) => test(s, g.when));
  const missing = d.guards.filter((g) => !met.includes(g) && !g.when.hasOwnProperty('flag'));
  const sum = met.reduce((a, g) => a + g.share, 0);
  const factor = d.good ? Math.min(1.5, (d.base ?? 0.4) + sum) : Math.max(0.15, 1 - sum);
  return { factor, met, missing };
}

export function shockFx(s: GameState, d: ShockDef): Fx[] {
  const { factor } = shockFactor(s, d);
  return d.hit.map(([t, v]) => [t, Math.round(v * factor * 1000) / 1000] as Fx);
}

export interface ShockView { def: ShockDef; left: number; factor: number; met: Guard[]; missing: Guard[]; fx: Fx[] }

export function activeShocks(s: GameState): ShockView[] {
  return (s.shocks?.active ?? []).map((a) => {
    const def = SHOCK_BY_ID[a.id];
    const f = shockFactor(s, def);
    return { def, left: a.until - s.turn + 1, ...f, fx: shockFx(s, def) };
  });
}

const CHANCE = 0.07;
const REST = 10;

export function shockTick(s: GameState): void {
  // What is under way lands, cushioned or caught.
  for (const a of s.shocks.active) {
    const d = SHOCK_BY_ID[a.id];
    if (!d) continue;
    const { factor, met, missing } = shockFactor(s, d);
    const before = snapshot(s);
    for (const f of shockFx(s, d)) applyFx(s, f);
    const pct = Math.round(factor * 100);
    const why = d.good
      ? `${pct}% of it is being caught.${met.length ? ` Because: ${met.map((g) => g.label.toLowerCase()).join('; ')}.` : ''}${missing.length ? ` Lost for want of: ${missing.map((g) => g.label.toLowerCase()).join('; ')}.` : ''}`
      : `${pct}% of it is being felt.${met.length ? ` Cushioned by: ${met.map((g) => g.label.toLowerCase()).join('; ')}.` : ''}${missing.length ? ` Nothing in place for: ${missing.map((g) => g.label.toLowerCase()).join('; ')}.` : ''}`;
    const left = a.until - s.turn;
    s.report.push({ kind: 'consequence', title: `${d.name}${left > 0 ? `: ${left} more month${left === 1 ? '' : 's'}` : ': the last month'}`, cause: 'From outside the country', text: why, changes: diff(before, snapshot(s)) });
  }
  s.shocks.active = s.shocks.active.filter((a) => a.until > s.turn);

  // Something new, now and then.
  if (s.turn < 6 || s.shocks.active.length || s.turn - s.shocks.last < REST) return;
  if (rand(s) >= CHANCE) return;
  const d = weighted(s, SHOCKS.filter((x) => !s.shocks.seen.includes(x.id) && test(s, x.when)), (x) => x.weight);
  if (!d) return;
  s.shocks.active.push({ id: d.id, since: s.turn, until: s.turn + d.months });
  s.shocks.seen.push(d.id);
  s.shocks.last = s.turn;
  s.queue.push({ event: d.file, due: s.turn });
  s.news.push({ chronicle: d.news[0], street: d.news[1], weight: 7, valence: d.good ? 1 : -1, topic: 'general' });
}
