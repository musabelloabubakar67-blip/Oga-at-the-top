import { EVENTS, EVENT_LIST } from '../content';
import { CFG } from './config';
import { rand, weighted } from './rng';
import { fill } from './text';
import type { DeskItem, GameEvent, GameState } from './types';
import { BLOCS, getVar, hardship, test } from './vars';

const LIGHT = new Set(['farce', 'absurd']);

function lastFired(s: GameState, id: string): number {
  const f = s.fired[id];
  return f && f.length ? f[f.length - 1] : -999;
}

function defaultCooldown(e: GameEvent): number {
  switch (e.kind) {
    case 'recurring': return 9;
    case 'threshold': return 10;
    case 'calendar': return 6;
    default: return 0;
  }
}

export function eligible(s: GameState, e: GameEvent): boolean {
  const count = s.fired[e.id]?.length ?? 0;
  const max = e.max ?? (e.kind === 'standalone' ? 1 : Infinity);
  if (count >= max) return false;
  if (s.turn - lastFired(s, e.id) <= (e.cooldown ?? defaultCooldown(e))) return false;
  return test(s, e.when);
}

function weightOf(s: GameState, e: GameEvent): number {
  let w = e.weight ?? 10;
  if (e.weightBy) w *= Math.max(0.1, getVar(s, e.weightBy) / 50);
  if (e.weightInv) w *= Math.max(0.1, (100 - getVar(s, e.weightInv)) / 50);
  // Farce is seasoning. It should not be the meal.
  if (LIGHT.has(e.tone)) w *= 0.55;
  // What the President did comes back before what merely happens.
  if (e.reactive) w *= 3.5;
  return w;
}

function mark(s: GameState, e: GameEvent): void {
  (s.fired[e.id] ??= []).push(s.turn);
  if (e.slot === 'lead') {
    s.recent.push({ tone: e.tone, category: e.category, intensity: e.intensity });
    if (s.recent.length > 6) s.recent.shift();
  }
}

function drawLead(s: GameState): GameEvent | null {
  const r = s.recent;
  const last2 = r.slice(-2);
  const noGrave = last2.length === 2 && last2.every((x) => x.tone === 'grave');
  const hot = last2.reduce((a, x) => a + x.intensity, 0) >= 8;
  const sameCat = last2.length === 2 && last2[0].category === last2[1].category ? last2[0].category : null;
  const lightDue = r.length >= 3 && !r.slice(-3).some((x) => LIGHT.has(x.tone) || x.category === 'fortune');

  const pool = EVENT_LIST.filter((e) =>
    e.slot === 'lead' && (e.kind === 'standalone' || e.kind === 'recurring') && eligible(s, e)
    && !(noGrave && e.tone === 'grave') && !(hot && e.intensity > 3) && e.category !== sameCat);

  return weighted(s, pool, (e) => {
    let w = weightOf(s, e);
    if (lightDue && (LIGHT.has(e.tone) || e.category === 'fortune')) w *= 1.6;
    return w;
  });
}

function takeQueued(s: GameState, slot: 'lead' | 'minor'): GameEvent | null {
  s.queue.sort((a, b) => a.due - b.due);
  for (let i = 0; i < s.queue.length; i++) {
    const q = s.queue[i];
    if (q.due > s.turn) break;
    const e = EVENTS[q.event];
    if (!e || e.slot !== slot) continue;
    s.queue.splice(i, 1);
    const spent = (s.fired[e.id]?.length ?? 0) >= (e.max ?? Infinity);
    if (!spent && test(s, q.when) && test(s, e.when)) return e;
    i--;
  }
  return null;
}

function chiefOfStaffNote(s: GameState): string {
  const cos = s.chars.cos;
  const notes: [number, string][] = [];
  const h = hardship(s);
  for (const k of BLOCS) {
    const v = s.blocs[k];
    const d = v - s.blocsPrev[k];
    const name = { villa: 'the Villa', party: 'the party', street: 'the street', establishment: 'the establishment', press: 'the press' }[k];
    if (v < 25) notes.push([30 - v + 20, `{SIR}, ${name} is close to breaking. I would not leave it another month.`]);
    else if (d < -4) notes.push([-d * 2, `{SIR}, we are losing ${name}. It moved against us this month.`]);
    else if (d > 5) notes.push([d, `${name[0].toUpperCase()}${name.slice(1)} is warmer than it was, {SIR}.`]);
  }
  if (s.pressures.wageGrievance > 60) notes.push([14, 'Labour is counting days, {SIR}. They have not said so publicly yet.']);
  if (s.pressures.fuelSupplyStress > 60) notes.push([13, 'The marketers say depots are running low. They always say that. This time the depots agree.']);
  if (s.pressures.scandalHeat > 60) notes.push([12, 'There are journalists asking questions around the ministries, {SIR}. Specific questions.']);
  if (s.nation.fiscalSpace < 0.3) notes.push([11, 'Finance says the account is almost empty. Anything new will be borrowed.']);
  if (h > 65) notes.push([15, 'Prices, {SIR}. That is all anybody is talking about.']);
  if (s.pc < 15) notes.push([16, '{SIR}, we have very little capital left. People have noticed they can say no to us.']);

  notes.sort((a, b) => b[0] - a[0]);
  // A weaker Chief of Staff misses the second thing.
  const n = cos && cos.competence >= 4 ? 2 : 1;
  const picked = notes.slice(0, n).map((x) => x[1]);
  if (!picked.length) return fill(s, 'A quiet month so far, {SIR}. I do not trust it.');
  return fill(s, picked.join(' '));
}

export function buildDesk(s: GameState): void {
  let lead: GameEvent | null = null;

  const calendar = EVENT_LIST.filter((e) => e.slot === 'lead' && e.kind === 'calendar' && eligible(s, e));
  if (calendar.length) lead = calendar.sort((a, b) => b.intensity - a.intensity)[0];

  if (!lead) {
    const thresholds = EVENT_LIST.filter((e) => e.slot === 'lead' && e.kind === 'threshold' && eligible(s, e));
    if (thresholds.length) lead = thresholds.sort((a, b) => b.intensity - a.intensity)[0];
  }
  if (!lead) lead = takeQueued(s, 'lead');
  if (!lead) {
    const lastQuiet = s.flags['desk.quiet'] === true;
    if (!lastQuiet && s.turn > 3 && rand(s) < CFG.director.quietChance) lead = null;
    else lead = drawLead(s);
  }
  s.flags['desk.quiet'] = lead === null;
  if (lead) mark(s, lead);

  const minors: DeskItem[] = [];
  const queuedMinor = takeQueued(s, 'minor');
  if (queuedMinor) { mark(s, queuedMinor); minors.push({ eventId: queuedMinor.id }); }
  const roll = rand(s);
  const want = roll < CFG.director.minorTwo ? 2 : roll < CFG.director.minorTwo + CFG.director.minorOne ? 1 : 0;
  while (minors.length < want) {
    const pool = EVENT_LIST.filter((e) =>
      e.slot === 'minor' && e.kind !== 'chain' && eligible(s, e)
      && !minors.some((m) => m.eventId === e.id)
      && !(lead?.tone === 'grave' && LIGHT.has(e.tone)));
    const m = weighted(s, pool, (e) => weightOf(s, e));
    if (!m) break;
    mark(s, m);
    minors.push({ eventId: m.id });
  }

  s.desk = {
    lead: lead ? { eventId: lead.id } : null,
    minors,
    actionsUsed: 0,
    drawerUsed: false,
    note: chiefOfStaffNote(s),
  };
}
