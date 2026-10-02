// View models: what the player is allowed to see. The UI reads these and
// never the hidden numbers behind them.

import { EVENTS } from '../content';
import { WEAK_LINES } from '../content';
import { fill } from './text';
import type { ArchiveEntry, BlocId, GameEvent, GameState, Read } from './types';
import { BLOCS } from './vars';

export type Mood = 'Devoted' | 'Solid' | 'Wary' | 'Strained' | 'Breaking';

export function mood(v: number): Mood {
  if (v >= 80) return 'Devoted';
  if (v >= 60) return 'Solid';
  if (v >= 40) return 'Wary';
  if (v >= 20) return 'Strained';
  return 'Breaking';
}

export const BLOC_NAME: Record<BlocId, string> = {
  villa: 'The Villa', party: 'The Party', street: 'The Street',
  establishment: 'The Establishment', press: 'The Press',
};

export function blocView(s: GameState): { id: BlocId; name: string; mood: Mood; trend: '↑' | '↓' | '→' }[] {
  return BLOCS.map((id) => {
    const d = s.blocs[id] - s.blocsPrev[id];
    return { id, name: BLOC_NAME[id], mood: mood(s.blocs[id]), trend: d > 1.5 ? '↑' : d < -1.5 ? '↓' : '→' };
  });
}

export function indexWord(v: number): string {
  if (v >= 75) return 'Strong';
  if (v >= 55) return 'Functional';
  if (v >= 40) return 'Fragile';
  if (v >= 25) return 'Poor';
  return 'Critical';
}

/** Official statistics lag when the state is weak. */
export function statistics(s: GameState): { label: string; value: string; note?: string }[] {
  const stale = s.nation.capacity < 45 && s.hist.length > 1;
  const src = stale ? s.hist[s.hist.length - 2] : s.nation;
  return [
    { label: 'Inflation', value: `${src.inflation.toFixed(1)}%`, note: stale ? 'last month, provisional' : undefined },
    { label: 'Petrol', value: `₦${Math.round(s.nation.petrolPrice / 5) * 5}/l` },
    { label: 'Fiscal space', value: s.nation.fiscalSpace <= 0.01 ? 'None. Borrowing.' : `₦${s.nation.fiscalSpace.toFixed(1)}tn` },
    { label: 'Debt service', value: `${Math.round(src.debt)}% of revenue` },
    { label: 'Security', value: indexWord(s.nation.security) },
    { label: 'Power', value: indexWord(s.nation.power) },
  ];
}

export interface ReadView { name: string; role: string; line: string; confidence: string; on?: string }

function hash(t: string): number {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function resolveRead(s: GameState, e: GameEvent, r: Read): ReadView | null {
  const c = s.chars[r.role];
  if (!c) return null;
  const weak = c.competence <= 2;
  const pool = WEAK_LINES[r.role] ?? WEAK_LINES.default;
  const line = weak ? (r.weak ?? pool[hash(e.id + r.role) % pool.length]) : r.good;
  const confidence = c.competence >= 4
    ? (s.nation.capacity >= 40 ? 'High confidence' : 'Moderate confidence')
    : c.competence === 3 ? 'Moderate confidence' : 'Low confidence';
  const on = r.on ? e.choices.find((x) => x.id === r.on)?.label : undefined;
  return { name: c.name, role: c.role, line: fill(s, line), confidence, on: on ? fill(s, on) : undefined };
}

/** "How did we get here?" — the archived decisions that pushed this problem along. */
export function traceFor(s: GameState, e: GameEvent): ArchiveEntry[] {
  if (!e.trace) return [];
  const hits = s.archive.filter((a) =>
    a.turn < s.turn && !a.sealed && e.trace!.some(([path, dir]) => {
      const d = a.touches[path];
      return d !== undefined && (path.startsWith('flag:') || Math.sign(d) === dir);
    }));
  return hits.slice(-5);
}

export function deskEvent(s: GameState, id: string): GameEvent | undefined {
  return EVENTS[id];
}

// ---------------------------------------------------------------- legible strategy

import { describe } from './effects';
import { projectMargin } from './election';
import { who } from './favours';
import { opText } from './ops';
import { aidedFx } from './reduce';
import type { Aid, Choice, Fx } from './types';
import { hardship, test } from './vars';

export interface Preview {
  now: ReturnType<typeof describe>;
  later: ReturnType<typeof describe>;
  /** Things the choice does that are not numbers: who is paid, who is replaced, what is owed. */
  notes: string[];
  risky: boolean;
  leadsOn: boolean;
}

/** What the President's advisers expect a choice to do. Risky choices show their likelier outcome. */
export function previewChoice(s: GameState, c: Choice, aid?: Aid): Preview {
  const o = c.outcomes.find((x) => test(s, x.when)) ?? c.outcomes[c.outcomes.length - 1];
  const now: Fx[] = [...aidedFx(s, o.fx, aid)];
  if (c.naira) now.push(['nation.fiscalSpace', -c.naira]);
  const notes = (o.ops ?? []).map((op) => opText(s, op)).filter((x): x is string => !!x);
  if (o.favour) {
    const w = who(s, o.favour[0]);
    notes.push(o.favour[1] === 'owed' ? `${w.short} will owe you` : `You will owe ${w.short}`);
  }
  if (o.exposure) notes.push('Somebody will know what you did');
  return {
    now: describe(now),
    later: describe((o.later ?? []).flatMap((l) => l.fx)),
    notes,
    risky: c.outcomes.some((x) => x.chance !== undefined),
    leadsOn: (o.follow?.length ?? 0) > 0,
  };
}

export interface Gauge { label: string; value: string; bar?: number; delta: number; since: number; upIsGood: boolean; unit: string }

export function gauges(s: GameState): Gauge[] {
  const n = s.nation;
  const b = s.baseline;
  const p = s.prev;
  const h = hardship(s);
  const arrears = s.debts.gas + s.debts.contractors + s.debts.pensions;
  const saved = s.funds.abroad + s.funds.buffer + s.funds.infra + s.funds.growth;
  const g = (label: string, value: string, now: number, prev: number | undefined, base: number, upIsGood: boolean, unit: string, bar?: number): Gauge =>
    ({ label, value, bar, delta: now - (prev ?? now), since: now - base, upIsGood, unit });
  return [
    g('Cost-of-living pressure', Math.round(h).toString(), h, p.hardship, b.hardship, false, '', h),
    g('Inflation', `${n.inflation.toFixed(1)}%`, n.inflation, p['nation.inflation'], b.inflation, false, ' pts'),
    g('Treasury', n.fiscalSpace <= 0.01 ? 'Empty' : `₦${n.fiscalSpace.toFixed(1)}tn`, n.fiscalSpace, p['nation.fiscalSpace'], b.fiscalSpace, true, 'tn'),
    g('Debt service', `${Math.round(n.debt)}% of revenue`, n.debt, p['nation.debt'], b.debt, false, ' pts'),
    g('Unpaid bills', arrears <= 0.01 ? 'None' : `₦${arrears.toFixed(1)}tn`, arrears, p['debt.arrears'], 2.5, false, 'tn'),
    g('Saved', saved <= 0.01 ? 'Nothing' : `₦${saved.toFixed(1)}tn`, saved, p['fund.total'], 0.3, true, 'tn'),
    g('Security', Math.round(n.security).toString(), n.security, p['nation.security'], b.security, true, '', n.security),
    g('Power', Math.round(n.power).toString(), n.power, p['nation.power'], b.power, true, '', n.power),
    g('Jobs and industry', Math.round(n.jobs).toString(), n.jobs, p['nation.jobs'], b.jobs, true, '', n.jobs),
    g('State capacity', Math.round(n.capacity).toString(), n.capacity, p['nation.capacity'], b.capacity, true, '', n.capacity),
    g('Integrity', Math.round(n.integrity).toString(), n.integrity, p['nation.integrity'], b.integrity, true, '', n.integrity),
  ];
}

export function outlook(s: GameState): { word: string; margin: number } {
  const m = projectMargin(s);
  const word = m > 6 ? 'Strong' : m > 2 ? 'Leaning your way' : m > -2 ? 'Toss-up' : m > -6 ? 'Leaning away' : 'Unlikely';
  return { word, margin: m };
}

// ---------------------------------------------------------------- the record

import { MILESTONE_BY_ID } from '../content/agenda';
import { IN_FORCE, RECORD } from '../content/record';
import { VENTURE_BY_ID } from '../content/ventures';

export interface RecordView { wins: string[]; losses: string[]; inForce: string[]; lasting: ReturnType<typeof describe> }

/** What the presidency has to show for itself so far. */
export function recordOf(s: GameState): RecordView {
  const wins: string[] = [];
  const losses: string[] = [];
  for (const id of s.agenda.done) { const m = MILESTONE_BY_ID[id]; if (m) wins.push(`Delivered: ${m.m.name}`); }
  for (const id of s.ventures.won) { const v = VENTURE_BY_ID[id]; if (v) wins.push(`It worked: ${v.name}`); }
  for (const id of s.ventures.lost) { const v = VENTURE_BY_ID[id]; if (v) losses.push(`It failed: ${v.name}${s.ventures.causes[id] ? ` (${s.ventures.causes[id].replace(/ \(.*$/, '').toLowerCase()})` : ''}`); }
  for (const id of new Set(s.agenda.failed.map((f) => f.id))) {
    if (!s.agenda.done.includes(id)) { const m = MILESTONE_BY_ID[id]; if (m) losses.push(`Defeated in the Assembly: ${m.m.name}`); }
  }
  for (const r of RECORD) if (test(s, r.when)) (r.kind === 'win' ? wins : losses).push(r.text);

  const n = s.nation;
  const b = s.baseline;
  const idx: [string, number, number][] = [
    ['Power', n.power - b.power, 1], ['Security', n.security - b.security, 1], ['Jobs and industry', n.jobs - b.jobs, 1],
    ['State capacity', n.capacity - b.capacity, 1], ['Integrity', n.integrity - b.integrity, 1],
  ];
  for (const [label, d] of idx) {
    if (d >= 8) wins.push(`${label} up ${Math.round(d)} points since you took office`);
    if (d <= -6) losses.push(`${label} down ${Math.round(-d)} points since you took office`);
  }
  const di = n.inflation - b.inflation;
  if (di <= -4) wins.push(`Inflation down ${Math.round(-di)} points`);
  if (di >= 4) losses.push(`Inflation up ${Math.round(di)} points`);
  const dd = n.debt - b.debt;
  if (dd <= -6) wins.push(`Debt burden down ${Math.round(-dd)} points`);
  if (dd >= 8) losses.push(`Debt burden up ${Math.round(dd)} points`);

  const lasting = describe(Object.entries(s.counters).filter(([k, v]) => k.startsWith('bonus.') && Math.abs(v) > 1e-6).map(([k, v]) => [k, v] as Fx));
  return { wins, losses, inForce: IN_FORCE.filter((x) => test(s, x.when)).map((x) => x.text), lasting };
}
