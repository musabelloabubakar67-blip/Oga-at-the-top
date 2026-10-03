import { EVENTS, EVENT_LIST } from '../content';
import { materialise, resolveCast } from './cast';
import { CFG, termTurnOf } from './config';
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
  if (!e.cast) return test(s, e.when);
  // A file about a person arises only if there is such a person, and its conditions are about them.
  const cast = resolveCast(s, e);
  return !!cast && test(s, materialise(s, e, cast).when);
}

function item(s: GameState, e: GameEvent): DeskItem {
  const cast = e.cast ? resolveCast(s, e) ?? undefined : undefined;
  return cast && Object.keys(cast).length ? { eventId: e.id, cast } : { eventId: e.id };
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

/**
 * How hot the presidency should feel this month, from 1 to 5. Quiet in the first
 * months, building through the term to the election, a breath after it, and
 * building again to the end. The second term starts hotter than the first.
 */
export function tension(s: GameState): number {
  const tt = termTurnOf(s.turn);
  const base = s.term === 1 ? 2.2 : 2.8;
  if (s.term === 1 && tt > 48) return base;
  const rise = tt <= 6 ? 0 : Math.min(1, (tt - 6) / 36);
  return base + rise * (s.term === 1 ? 1.8 : 1.9);
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
    // Files near the month's tension are likelier; far from it, rarer, never impossible.
    w *= Math.exp(-0.35 * Math.abs(e.intensity - tension(s)));
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
    if (!spent && test(s, q.when) && (e.cast ? !!resolveCast(s, e) && test(s, materialise(s, e, resolveCast(s, e)!).when) : test(s, e.when))) return e;
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
  if (s.pressures.scandalHeat > 60) notes.push([12, 'There are journalists asking questions around the ministries, {SIR}. Specific questions. It is costing us in the polls every month.']);
  if (s.nation.fiscalSpace < 0.3) notes.push([11, 'Finance says the account is almost empty. Anything new will be borrowed.']);
  if (h > 65) notes.push([15, 'Prices, {SIR}. That is all anybody is talking about.']);
  if (s.pc < 15) notes.push([16, '{SIR}, we have very little capital left. People have noticed they can say no to us.']);
  if (s.debts.gas > 0.9) notes.push([12, 'The gas suppliers are owed again, {SIR}. The plants will go idle before they go unpaid much longer.']);
  if (s.debts.contractors > 1.5) notes.push([10, 'The contractors have stopped coming to site, {SIR}. Everything we are building is slower for it.']);
  if (s.debts.pensions > 0.8) notes.push([11, 'The pensioners are outside the gate again, {SIR}. There are more of them each week.']);
  if (s.budget.due) notes.push([40, 'The Appropriation Bill is on your desk, {SIR}. Nothing is released until you sign it.']);
  const owing = s.favours.filter((f) => f.dir === 'owing' && s.turn - f.turn > 14).length;
  if (owing) notes.push([9, owing === 1 ? 'Somebody we owe has been patient for over a year, {SIR}. That patience is not a gift.' : 'We owe several people who have been patient for over a year, {SIR}. They will not ask twice.']);
  const hot = (['NW', 'NE', 'NC', 'SW', 'SE', 'SS'] as const).filter((z) => s.theatres[z] >= 76);
  if (hot.length) notes.push([13, 'The security reports are bad, {SIR}. I would look at where the forces are concentrated.']);
  if (s.oil.price < s.budget.benchmark - 10 && s.funds.buffer < 0.2) notes.push([12, 'Oil is well below what the budget assumed and there is nothing in the stabilisation account, {SIR}. The gap comes out of the treasury.']);

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
  if (queuedMinor) { mark(s, queuedMinor); minors.push(item(s, queuedMinor)); }
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
    minors.push(item(s, m));
  }

  s.desk = {
    lead: lead ? item(s, lead) : null,
    minors,
    actionsUsed: 0,
    drawerUsed: false,
    note: chiefOfStaffNote(s),
  };
}
