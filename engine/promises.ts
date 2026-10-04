// Promises. The President's word is a currency that can be spent before it is
// earned. A promise buys goodwill now; keeping it builds credibility with that
// person (or with the public, if it was public); letting the deadline approach
// creates tension; breaking it makes a grudge. Two promises of the same thing to
// two people (the same ministry to two governors) work until somebody compares
// notes, and then they are a file.

import { MILESTONE_BY_ID } from '../content/agenda';
import { PEOPLE, PERSON_BY_ID } from '../content/people';
import { TYCOON_BY_ID } from '../content/tycoons';
import { VENTURE_BY_ID } from '../content/ventures';
import { mo } from './config';
import { who } from './favours';
import { personView, replaceMinister } from './people';
import { rand } from './rng';
import type { GameState, Pledge, PledgeKind } from './types';
import { currentWant } from './wants';
import { applyFx, clamp } from './vars';

export const PUBLIC = 'public';
const MAX_OPEN_EACH = 2;

const pledges = (s: GameState) => (s.pledges ??= []);
export const openPledges = (s: GameState) => pledges(s).filter((p) => p.status === 'open');

/** Your word with someone: promises kept less promises broken. */
export function word(s: GameState, to: string): { kept: number; broken: number } {
  const all = pledges(s).filter((p) => p.to === to);
  return { kept: all.filter((p) => p.status === 'kept').length, broken: all.filter((p) => p.status === 'broken').length };
}

/** How much a new promise is believed: more for a record of keeping them, nothing after two broken. */
function belief(s: GameState, to: string): number {
  const w = word(s, to);
  if (w.broken - w.kept >= 2) return 0;
  return clamp(1 + 0.25 * (w.kept - w.broken), 0.25, 2);
}

export interface PledgeOption { kind: PledgeKind; object?: string; text: string; months: number; ok: boolean; reason?: string }

const ministries = () => PEOPLE.filter((p) => p.group === 'minister');

/** What the President could promise this person, or the public. */
export function pledgeOptions(s: GameState, to: string, moves: number): PledgeOption[] {
  const out: PledgeOption[] = [];
  const mine = openPledges(s).filter((p) => p.to === to);
  const gate = (o: Omit<PledgeOption, 'ok' | 'reason'>): PledgeOption => {
    if (moves <= 0) return { ...o, ok: false, reason: "This month's moves are used." };
    if (to !== PUBLIC && mine.length >= MAX_OPEN_EACH) return { ...o, ok: false, reason: 'You already owe them two promises.' };
    if (mine.some((p) => p.kind === o.kind && p.object === o.object)) return { ...o, ok: false, reason: 'You have already promised that.' };
    return { ...o, ok: true };
  };
  if (to === PUBLIC) {
    out.push(gate({ kind: 'notax', text: 'No new taxes for a year', months: 12 }));
    if (s.flags['policy.subsidy'] !== 'removed') out.push(gate({ kind: 'subsidy', text: 'The petrol subsidy stays for a year', months: 12 }));
    for (const a of s.agenda.active.slice(0, 3)) {
      const m = MILESTONE_BY_ID[a.id]?.m;
      if (m) out.push(gate({ kind: 'project', object: a.id, text: `${m.name}, delivered within a year`, months: 12 }));
    }
    for (const v of s.ventures.active.slice(0, 2)) {
      const d = VENTURE_BY_ID[v.id];
      if (d) out.push(gate({ kind: 'project', object: v.id, text: `${d.name}, completed within eighteen months`, months: 18 }));
    }
    return out;
  }
  const p = PERSON_BY_ID[to];
  const t = TYCOON_BY_ID[to];
  if (p?.group === 'governor' || p?.group === 'senator') {
    for (const m of ministries()) out.push(gate({ kind: 'slot', object: m.id, text: `You will name the next ${personView(s, m.id).title}`, months: 12 }));
  }
  if (p?.group === 'minister') out.push(gate({ kind: 'keep', object: to, text: 'You keep your post for at least a year', months: 12 }));
  const want = p ? currentWant(s, to) : null;
  if (want) out.push(gate({ kind: 'want', text: `${want.text.replace(/\.$/, '')}, within nine months`, months: 9 }));
  if (t && !s.tycoons[to]?.granted) out.push(gate({ kind: 'want', text: `${t.want.text.replace(/\.$/, '')}, within nine months`, months: 9 }));
  return out;
}

/** Make a promise. Goodwill now, believed in proportion to your record with them. */
export function pledge(s: GameState, to: string, kind: PledgeKind, object: string | undefined, text: string, months: number): string {
  const list = pledges(s);
  const id = (list.reduce((m, p) => Math.max(m, p.id), 0) || 0) + 1;
  const p: Pledge = { id, to, kind, object, text, made: s.turn, due: s.turn + months, status: 'open', snap: snapshotFor(s, to, kind), holder: kind === 'keep' ? personView(s, to).name : undefined };
  // The same post promised to someone else: a ministry to two people, or a ministry to one and its minister told they stay.
  const other = post(p) ? openPledges(s).find((x) => post(x) === post(p) && x.to !== to) : undefined;
  if (other) { p.clash = other.id; other.clash = id; }
  list.push(p);
  const b = belief(s, to);
  if (to === PUBLIC) {
    applyFx(s, ['approval', 1.5 * b]);
    applyFx(s, ['bloc.street', 3 * b]);
    return b === 0 ? `You promise: ${text.toLowerCase()}. Nobody in the motor parks believes it; they have heard you before.` : `You promise, in public: ${text.toLowerCase()}. It is on every front page, with the date.`;
  }
  const name = who(s, to).short;
  if (s.people[to]) s.people[to].rel = clamp(s.people[to].rel + 8 * b, 0, 100);
  if (s.tycoons[to]) s.tycoons[to].rel = clamp(s.tycoons[to].rel + 8 * b, 0, 100);
  if (b === 0) return `${name} listens politely. After the last two times, the promise is worth what it costs you to make it.`;
  return `${name} takes the promise and repeats it back to you, slowly, so you both remember the words.${other ? ' Somewhere, someone else has been promised the same thing.' : ''}`;
}

/** The post a promise is about, if it is about one. */
const post = (p: Pledge) => (p.kind === 'slot' || p.kind === 'keep' ? `post:${p.object}` : '');

/** What has to change for the promise to count as kept or broken. */
function snapshotFor(s: GameState, to: string, kind: PledgeKind): number | undefined {
  if (kind === 'want') return s.people[to]?.grants ?? 0;
  if (kind === 'notax') return (s.counters['order.tax'] ?? -999) + (s.counters['order.bank_tax'] ?? -999);
  return undefined;
}

function kept(s: GameState, p: Pledge): boolean {
  switch (p.kind) {
    case 'want': return TYCOON_BY_ID[p.to] ? !!s.tycoons[p.to]?.granted : (s.people[p.to]?.grants ?? 0) > (p.snap ?? 0);
    case 'project': return !!p.object && (s.agenda.done.includes(p.object) || s.ventures.won.includes(p.object));
    default: return false;
  }
}

function broken(s: GameState, p: Pledge): boolean {
  switch (p.kind) {
    case 'keep': return personView(s, p.to).name !== p.holder;
    case 'notax': return (s.counters['order.tax'] ?? -999) + (s.counters['order.bank_tax'] ?? -999) !== p.snap;
    case 'subsidy': return s.flags['policy.subsidy'] === 'removed';
    case 'project': return !!p.object && s.ventures.lost.includes(p.object);
    default: return false;
  }
}

/** Promises that hold until the deadline without anything to do are kept when it passes. */
const keptByTime = (k: PledgeKind) => k === 'keep' || k === 'notax' || k === 'subsidy';

export function keep(s: GameState, p: Pledge, quiet = false): void {
  p.status = 'kept';
  p.closed = s.turn;
  if (p.to === PUBLIC) {
    applyFx(s, ['approval', 1.5]);
    applyFx(s, ['bloc.street', 3]);
    applyFx(s, ['bloc.press', 2]);
  } else {
    if (s.people[p.to]) s.people[p.to].rel = clamp(s.people[p.to].rel + 6, 0, 100);
    if (s.tycoons[p.to]) s.tycoons[p.to].rel = clamp(s.tycoons[p.to].rel + 6, 0, 100);
  }
  if (!quiet) s.report.push({ kind: 'reform', title: `A promise kept: ${p.text.toLowerCase()}`, cause: p.to === PUBLIC ? 'Made in public' : `Made to ${who(s, p.to).name}`, text: p.to === PUBLIC ? 'The papers that printed the promise print that it was kept, smaller.' : `${who(s, p.to).short} noticed. Next time your word will count for more.`, changes: [] });
}

export function breakPledge(s: GameState, p: Pledge, why: string): void {
  p.status = 'broken';
  p.closed = s.turn;
  if (p.to === PUBLIC) {
    applyFx(s, ['approval', -3]);
    applyFx(s, ['bloc.street', -5]);
    applyFx(s, ['bloc.press', -4]);
    s.news.push({ chronicle: `"WE WERE PROMISED": ${p.text.toUpperCase()} — WHAT HAPPENED?`, street: 'PRESIDENT PROMISE. PRESIDENT FORGET', weight: 4, valence: -1, topic: 'politics', body: `The promise was made on the record ${mo(s.turn - p.made)} ago. ${why}` });
  } else {
    if (s.people[p.to]) s.people[p.to].rel = clamp(s.people[p.to].rel - 18, 0, 100);
    if (s.tycoons[p.to]) s.tycoons[p.to].rel = clamp(s.tycoons[p.to].rel - 18, 0, 100);
    if (PERSON_BY_ID[p.to]) (s.wronged ??= []).push({ who: p.to, kind: 'promise', turn: s.turn, what: `a broken promise (${p.text.toLowerCase()})`, until: s.turn + 24 });
  }
  s.report.push({ kind: 'failure', title: `A promise broken: ${p.text.toLowerCase()}`, cause: p.to === PUBLIC ? 'Made in public' : `Made to ${who(s, p.to).name}`, text: why, changes: [] });
}

/** Give the promised ministry to the person it was promised to. Anyone else promised it is let down. */
export function canHonour(s: GameState, id: number, moves: number): { ok: boolean; reason?: string } {
  const p = pledges(s).find((x) => x.id === id);
  if (!p || p.status !== 'open' || p.kind !== 'slot') return { ok: false };
  if (moves <= 0) return { ok: false, reason: "This month's moves are used." };
  return { ok: true };
}

export function honour(s: GameState, id: number): string {
  const p = pledges(s).find((x) => x.id === id)!;
  const r = replaceMinister(s, p.object!, 'party');
  keep(s, p, true);
  const rivals = openPledges(s).filter((x) => x.kind === 'slot' && x.object === p.object && x.to !== p.to);
  for (const x of rivals) breakPledge(s, x, `The ministry ${who(s, x.to).short} was promised has gone to ${who(s, p.to).short}'s nominee. ${who(s, x.to).short} found out from the television.`);
  // A minister promised the post has lost it; that promise breaks next month when the change is seen.
  return `${r.text} The nominee came from ${who(s, p.to).short}'s list, as promised.`;
}

/** Every month: promises are kept, broken, grow tense, or are found out. */
export function pledgeTick(s: GameState): void {
  for (const p of openPledges(s)) {
    if (kept(s, p)) { keep(s, p); continue; }
    if (broken(s, p)) { breakPledge(s, p, p.kind === 'keep' ? 'They were removed from the post before the year was out.' : p.kind === 'notax' ? 'A new tax was ordered before the year was out.' : p.kind === 'subsidy' ? 'The subsidy went.' : 'It failed.'); continue; }
    if (s.turn >= p.due) {
      if (keptByTime(p.kind)) keep(s, p);
      else breakPledge(s, p, `The deadline passed ${p.to === PUBLIC ? 'and the papers kept the cutting' : `and ${who(s, p.to).short} kept count`}.`);
      continue;
    }
    // The last three months: reminders, and patience running out.
    const left = p.due - s.turn;
    if (left <= 3 && !keptByTime(p.kind) && p.to !== PUBLIC) {
      if (s.people[p.to]) s.people[p.to].rel = clamp(s.people[p.to].rel - 1, 0, 100);
      if (s.tycoons[p.to]) s.tycoons[p.to].rel = clamp(s.tycoons[p.to].rel - 1, 0, 100);
      if (!p.warned) {
        p.warned = true;
        s.report.push({ kind: 'consequence', title: `${who(s, p.to).short} reminds you of a promise`, cause: `Made ${mo(s.turn - p.made)} ago`, text: `"${p.text}." ${mo(left)} left, and they are counting.`, changes: [] });
      }
    }
    // Two people promised the same thing compare notes sooner or later.
    if (p.clash && !s.flags['clash.live']) {
      const other = pledges(s).find((x) => x.id === p.clash);
      if (other?.status === 'open' && p.id < other.id && rand(s) < 0.08) {
        s.flags['clash.live'] = true;
        s.flags['clash.a'] = p.to;
        s.flags['clash.b'] = other.to;
        s.flags['clash.pa'] = p.id;
        s.flags['clash.pb'] = other.id;
        s.queue.push({ event: 'promise.clash', due: s.turn + 1 });
      }
    }
  }
}

/** Ops for files: settle a clash by keeping one promise, breaking or buying off the other. */
export function pledgeOp(s: GameState, name: string, flag: string): string {
  const id = Number(s.flags[flag]);
  const p = pledges(s).find((x) => x.id === id);
  if (!p || p.status !== 'open') return '';
  s.flags['clash.live'] = false;
  if (name === 'honour') {
    if (p.kind === 'slot') return honour(s, id);
    keep(s, p, true);
    for (const x of openPledges(s).filter((y) => post(y) === post(p) && y.id !== p.id)) breakPledge(s, x, `The post stays with ${who(s, p.to).short}. ${who(s, x.to).short} was told otherwise.`);
    return '';
  }
  if (name === 'breakp') { breakPledge(s, p, `${who(s, p.to).short} learned that the same ministry had been promised to someone else.`); return ''; }
  if (name === 'settlep') { p.status = 'kept'; p.closed = s.turn; return ''; }
  return '';
}

/** What the briefing should worry about: promises close to their deadline. */
export function duePledges(s: GameState): Pledge[] {
  return openPledges(s).filter((p) => !keptByTime(p.kind) && p.due - s.turn <= 3);
}

export const pledgeName = (s: GameState, p: Pledge) => (p.to === PUBLIC ? 'the public' : who(s, p.to).name);
