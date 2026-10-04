// Set pieces. A normal month is strategic; a night is not. The clock moves only
// when the President acts or waits, and every act costs minutes. Beats arrive at
// their time if the state of the world allows them, so the cast moves without
// waiting. Options close as the night goes on, and what is chosen cannot be
// unchosen. What was really happening is drawn at the start and told at dawn,
// with what each decision turned out to mean.

import { NIGHTS, NIGHT_BY_ID, type SetPiece } from '../content/setpieces';
import { snapshot, diff } from './effects';
import { record } from './archive';
import { termTurnOf } from './config';
import { rand } from './rng';
import { fill } from './text';
import type { Fx, GameState, Night } from './types';
import { applyFx } from './vars';

export const clockLabel = (m: number) => {
  const t = ((m % 1440) + 1440) % 1440;
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

const say = (s: GameState, n: Night, text: string) => fill(s, Object.entries(n.cast).reduce((x, [k, v]) => x.split(`{${k}}`).join(v), text));

/** Begin a night, if everyone it needs is there. */
export function startNight(s: GameState, id: string): boolean {
  const sp = NIGHT_BY_ID[id];
  if (!sp) return false;
  const cast: Record<string, string> = {};
  for (const [k, f] of Object.entries(sp.cast)) {
    const v = f(s);
    if (!v) return false;
    cast[k] = v;
  }
  const weights = sp.truths.map((t) => Math.max(0, t.weight(s)));
  const total = weights.reduce((a, b) => a + b, 0);
  let x = rand(s) * total;
  const truth = sp.truths[Math.max(0, weights.findIndex((w) => (x -= w) <= 0))].id;
  s.night = { id, clock: sp.start, truth, cast, seen: [], chosen: [], closed: [], log: [] };
  s.night.log.push({ at: sp.start, text: say(s, s.night, sp.opening), kind: 'beat' });
  s.counters['night.last'] = s.turn;
  s.counters[`night.${id}`] = s.turn;
  beats(s, sp, s.night);
  return true;
}

/** Whatever was due by now happens, if the world allows it. */
function beats(s: GameState, sp: SetPiece, n: Night): void {
  for (const b of sp.beats) {
    if (n.seen.includes(b.id) || b.at > n.clock) continue;
    n.seen.push(b.id);
    // A beat whose moment passed without the world allowing it leaves a silent mark.
    if (b.when && !b.when(s, n)) { n.closed.push(`~${b.id}`); continue; }
    n.log.push({ at: b.at, text: say(s, n, typeof b.text === 'function' ? b.text(s, n) : b.text), kind: 'beat' });
    n.closed.push(...(b.closes ?? []));
    for (const f of b.fx ?? []) applyFx(s, f);
  }
}

/** What the President can still do. */
export function nightOptions(s: GameState): SetPiece['options'] {
  const n = s.night;
  if (!n || n.done) return [];
  const sp = NIGHT_BY_ID[n.id];
  const happened = new Set([...n.chosen, ...n.seen.filter((id) => !n.closed.includes(`~${id}`))]);
  return sp.options.filter((o) => !n.chosen.includes(o.id) && !n.closed.includes(o.id)
    && n.clock >= (o.from ?? -9999) && n.clock <= (o.until ?? 9999)
    && (o.needs ?? []).every((x) => happened.has(x)) && !(o.not ?? []).some((x) => happened.has(x)));
}

export function nightChoose(s: GameState, id: string): void {
  const n = s.night;
  if (!n || n.done) return;
  const sp = NIGHT_BY_ID[n.id];
  const o = nightOptions(s).find((x) => x.id === id);
  if (!o) return;
  n.chosen.push(o.id);
  n.log.push({ at: n.clock, text: say(s, n, o.text), kind: 'you' });
  n.closed.push(...(o.closes ?? []));
  for (const f of o.fx ?? []) applyFx(s, f);
  n.clock += o.minutes;
  beats(s, sp, n);
  if (o.ends || n.clock >= sp.dawn) dawn(s);
}

export function nightWait(s: GameState): void {
  const n = s.night;
  if (!n || n.done) return;
  const sp = NIGHT_BY_ID[n.id];
  n.clock += 30;
  beats(s, sp, n);
  if (n.clock >= sp.dawn) dawn(s);
}

/** Morning: what was really happening, and what each decision turned out to mean. */
function dawn(s: GameState): void {
  const n = s.night!;
  const sp = NIGHT_BY_ID[n.id];
  const before = snapshot(s);
  const truth = sp.truths.find((t) => t.id === n.truth)!;
  const lines: string[] = [say(s, n, truth.reveal)];
  const fx: Fx[] = [...(truth.fx ?? [])];
  for (const id of n.chosen) {
    const o = sp.options.find((x) => x.id === id)!;
    fx.push(...(o.dawn?.[n.truth] ?? o.dawn?.all ?? []));
    const after = o.after?.[n.truth] ?? o.after?.all;
    if (after) lines.push(say(s, n, after));
  }
  for (const f of fx) applyFx(s, f);
  sp.morning?.(s, n);
  const changes = diff(before, snapshot(s));
  n.done = { title: say(s, n, truth.title), text: lines.join(' '), changes };
  s.report.push({ kind: changes.filter((c) => c.good).length >= changes.length / 2 ? 'reform' : 'failure', title: `${sp.title}: ${n.done.title.toLowerCase()}`, cause: `The night of ${clockLabel(sp.start)} to ${clockLabel(n.clock)}`, text: n.done.text, changes });
  record(s, `night.${n.id}`, n.truth, 'politics', `${sp.title}: ${n.done.title}.`, 2);
  if (truth.news) s.news.push({ chronicle: say(s, n, truth.news[0]), street: say(s, n, truth.news[1]), weight: 7, valence: changes.filter((c) => c.good).length >= changes.length / 2 ? 1 : -1, topic: sp.topic, body: n.done.text });
}

/** Back to the desk. Election night hands over to the count. */
export function nightEnd(s: GameState): void {
  const n = s.night;
  if (!n?.done) return;
  s.night = undefined;
  if (n.id === 'collation' && s.election) s.phase = 'election';
}

/** Each month: perhaps a night, if the world has made one likely, and not too often. */
export function nightTick(s: GameState): void {
  if (s.night || s.turn - (s.counters['night.last'] ?? -99) < 10) return;
  const order = [...NIGHTS].filter((sp) => sp.chance > 0).sort(() => rand(s) - 0.5);
  for (const sp of order) {
    if (s.turn - (s.counters[`night.${sp.id}`] ?? -99) < 48 || !sp.when(s)) continue;
    if (rand(s) < sp.chance && startNight(s, sp.id)) return;
  }
}

/** Election night, when the count is close: the delayed states are still out. */
export function maybeCollation(s: GameState): boolean {
  if (!s.election || Math.abs(s.election.margin) >= 4 || termTurnOf(s.turn) < 40) return false;
  return startNight(s, 'collation');
}
