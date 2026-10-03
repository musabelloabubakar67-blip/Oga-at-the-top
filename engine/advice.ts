// Advice. Before a decision the President sees a named adviser's forecast, not the
// truth: competence decides how far off it can be, loyalty and patron decide which
// way it leans. After the decision what actually happened is shown, and every
// adviser's record of forecasts against outcomes is kept where the President can
// read it. Nothing is hidden for long; it has to be checked.

import { PEOPLE, PERSON_BY_ID } from '../content/people';
import { TYCOONS, TYCOON_BY_ID } from '../content/tycoons';
import { ADVISER_POOL, REPLACEABLE } from '../content/names';
import { describe } from './effects';
import { rand } from './rng';
import type { Choice, Fx, GameEvent, GameState, Outcome } from './types';
import { test } from './vars';

/** Advisers who are also ministers: their name and competence follow whoever holds the brief. */
export const LINKED: Record<string, string> = { power: 'min_power', nsa: 'min_defence' };

export interface Adviser {
  role: string;
  name: string;
  short: string;
  title: string;
  competence: number;
  loyalty: number;
  integrity: number;
  /** Who they really serve: 'president', 'self', or a businessman's, governor's or senator's id. */
  patron: string;
  rep: { competence: number; loyalty: number };
}

export function adviser(s: GameState, role: string): Adviser | null {
  const c = s.chars[role];
  if (!c) return null;
  const linked = LINKED[role] ? s.people[LINKED[role]] : undefined;
  const base = LINKED[role] ? PERSON_BY_ID[LINKED[role]] : undefined;
  const competence = linked?.competence ?? base?.competence ?? c.competence;
  return {
    role, title: c.role,
    name: linked?.name ?? base?.name ?? c.name,
    short: linked?.short ?? base?.short ?? c.short,
    competence, loyalty: c.loyalty, integrity: linked?.integrity ?? base?.integrity ?? c.integrity,
    patron: c.patron ?? 'president',
    rep: c.rep ?? { competence, loyalty: c.loyalty },
  };
}

export function patronName(id: string): string {
  if (id === 'president') return 'you';
  if (id === 'self') return 'themselves';
  return TYCOON_BY_ID[id]?.short ?? PERSON_BY_ID[id]?.short ?? id;
}

/** Disloyal advisers serve someone else when it matters. */
export function leans(a: Adviser): boolean {
  return a.patron !== 'president' && a.loyalty <= 3;
}

/**
 * At the start of a presidency: reputations are what the files say. One or two of
 * the inner circle are quietly serving someone else, and look exactly as loyal as
 * before; one may be thought abler than they are.
 */
export function seedAdvisers(s: GameState): void {
  for (const c of Object.values(s.chars)) {
    c.patron = c.patron ?? 'president';
    c.rep = c.rep ?? { competence: c.competence, loyalty: c.loyalty };
  }
  const pool = Object.keys(s.chars).filter((r) => r !== 'cos' && s.chars[r].patron === 'president');
  const patrons = [...TYCOONS.map((t) => t.id), ...PEOPLE.filter((p) => p.group !== 'minister').map((p) => p.id)];
  const turned = 1 + (rand(s) < 0.5 ? 1 : 0);
  for (let i = 0; i < turned && pool.length; i++) {
    const role = pool.splice(Math.floor(rand(s) * pool.length), 1)[0];
    const c = s.chars[role];
    c.patron = patrons[Math.floor(rand(s) * patrons.length)];
    c.loyalty = Math.max(1, c.loyalty - 2);
  }
  if (rand(s) < 0.5) {
    const roles = Object.keys(s.chars).filter((r) => !LINKED[r]);
    const c = s.chars[roles[Math.floor(rand(s) * roles.length)]];
    c.rep = { ...c.rep!, competence: Math.min(5, c.competence + 1) };
  }
}

/** Who is still available to bring in. */
export function poolFor(s: GameState): typeof ADVISER_POOL {
  const taken = new Set([...Object.values(s.chars).map((c) => c.name), ...(s.institutions ?? []).map((i) => i.head.name)]);
  return ADVISER_POOL.filter((c) => !taken.has(c.name) && !s.flags[`pool.gone.${c.short}`]);
}

export const REPLACE_PC = 6;

export function canReplaceAdviser(s: GameState, role: string, name: string, movesLeft: number): { ok: boolean; reason?: string } {
  if (!REPLACEABLE.includes(role) || !s.chars[role]) return { ok: false };
  if (!poolFor(s).some((c) => c.name === name)) return { ok: false, reason: 'Not available.' };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < REPLACE_PC) return { ok: false, reason: `Needs ${REPLACE_PC} political capital.` };
  return { ok: true };
}

/** Bring someone in. The one who leaves does not come back. */
export function replaceAdviser(s: GameState, role: string, name: string): string {
  const old = s.chars[role];
  const next = ADVISER_POOL.find((c) => c.name === name)!;
  s.flags[`pool.gone.${old.short}`] = true;
  s.chars[role] = { ...next, id: role, role: old.role, rel: 40, notes: [], patron: next.patron ?? 'president', rep: next.rep ?? { competence: next.competence, loyalty: next.loyalty } };
  return `${old.name} is thanked and leaves the Villa. ${next.name} is the new ${old.role}.`;
}

/** The adviser whose brief a file falls under. */
export function adviserFor(s: GameState, e: GameEvent): Adviser | null {
  for (const r of e.reads ?? []) { const a = adviser(s, r.role); if (a) return a; }
  return adviser(s, 'cos');
}

/** Who gives a second opinion: the Chief of Staff, or the political adviser if the Chief of Staff gave the first. */
export function secondFor(s: GameState, first: string): Adviser | null {
  return adviser(s, first === 'cos' ? 'sap' : 'cos');
}

const hash = (x: string) => { let h = 2166136261; for (let i = 0; i < x.length; i++) h = Math.imul(h ^ x.charCodeAt(i), 16777619); return (h >>> 0) / 4294967296; };

/** The outcome a file's choice is expected to have, as the game would preview it. */
export function expectedOutcome(s: GameState, c: Choice): Outcome {
  return c.outcomes.find((x) => test(s, x.when)) ?? c.outcomes[c.outcomes.length - 1];
}

/** What the patron stands to gain from an outcome. */
function patronGain(a: Adviser, o: Outcome, c: Choice): number {
  if (a.patron === 'self') return (o.exposure ? 3 : 0) + (c.purse ? 2 : 0) + (o.fx ?? []).reduce((v, [t, d]) => v + (t === 'purse' ? d * 0.2 : 0), 0);
  return [...(o.fx ?? []), ...(o.later ?? []).flatMap((l) => l.fx)].reduce((v, [t, d]) => v + (t === `tycoon.${a.patron}` || t === `person.${a.patron}` ? d : 0), 0);
}

const FOR_YOU: Record<string, number> = {
  approval: 3, pc: 0.3, 'nation.integrity': 0.5, 'nation.capacity': 0.8, 'nation.power': 0.6, 'nation.security': 0.6, 'nation.jobs': 0.6,
  'nation.inflation': -1, 'nation.fiscalSpace': 6, 'nation.debt': -0.5, 'bonus.fiscal': 150,
  'pressure.scandalHeat': -0.3, 'pressure.wageGrievance': -0.2, 'pressure.fuelSupplyStress': -0.2,
};
const goodFor = ([t, d]: Fx) => (FOR_YOU[t] ?? (t.startsWith('bloc.') ? 0.4 : t.startsWith('theatre.') ? -0.5 : 0)) * d;

/** One adviser's forecast of one choice. */
export function forecast(s: GameState, e: GameEvent, c: Choice, role: string, aidFx: (fx: Fx[] | undefined) => Fx[]): { now: Fx[]; later: Fx[] } {
  const a = adviser(s, role);
  const o = expectedOutcome(s, c);
  const now = aidFx(o.fx);
  if (c.naira) now.push(['nation.fiscalSpace', -c.naira]);
  const later = (o.later ?? []).flatMap((l) => l.fx);
  if (!a) return { now, later };
  const seed = `${e.id}.${c.id}.${role}.${s.turn}`;
  // Competence: how far off it can be.
  const spread = Math.max(0, 4 - a.competence) * 0.3;
  // Loyalty and patron: which way it leans, on the option the patron would choose.
  const favoured = leans(a) ? favouredChoice(s, e, a) : null;
  const shade = (fx: Fx[], tag: string): Fx[] => fx
    .map(([t, d], i): Fx => {
      let v = d * (1 + (hash(`${seed}.${tag}.${i}`) * 2 - 1) * spread);
      const good = goodFor([t, d]) >= 0;
      if (favoured === c.id) v *= good ? 1.3 : 0.4;
      else if (favoured) v *= good ? 0.7 : 1.2;
      return [t, Math.round(v * 1000) / 1000];
    })
    // The weak miss what they were not looking for: the worst risk goes unmentioned half the time.
    .filter(([t, d], i, all) => !(a.competence <= 2 && hash(`${seed}.${tag}.miss`) < 0.5 && goodFor([t, d]) < 0 && Math.abs(goodFor([t, d])) === Math.max(...all.map((f) => Math.abs(Math.min(0, goodFor(f)))))));
  return { now: shade(now, 'now'), later: shade(later, 'later') };
}

/** The option a disloyal adviser's patron would want. */
function favouredChoice(s: GameState, e: GameEvent, a: Adviser): string | null {
  let best: string | null = null;
  let top = 0.5;
  for (const c of e.choices) {
    const g = patronGain(a, expectedOutcome(s, c), c);
    if (g > top) { top = g; best = c.id; }
  }
  return best;
}

/** What the adviser recommends: what is best for you, as they see it, or what is best for whoever they really serve. */
export function recommend(s: GameState, e: GameEvent, role: string, aidFx: (fx: Fx[] | undefined) => Fx[], usable: (c: Choice) => boolean): string | null {
  const a = adviser(s, role);
  if (!a) return null;
  const options = e.choices.filter(usable);
  if (!options.length) return null;
  const favoured = leans(a) ? favouredChoice(s, e, a) : null;
  if (favoured && options.some((c) => c.id === favoured)) return favoured;
  let best = options[0].id;
  let top = -Infinity;
  for (const c of options) {
    const f = forecast(s, e, c, role, aidFx);
    const v = [...f.now, ...f.later].reduce((x, fx) => x + goodFor(fx), 0) - (c.pc ?? 0) * 0.3 - (c.purse ? 3 : 0);
    if (v > top) { top = v; best = c.id; }
  }
  return best;
}

/** Signed arrows per label, the way the President reads a forecast. */
const arrowsOf = (fx: Fx[]) => Object.fromEntries(describe(fx).map((c) => [c.label, Math.sign(c.delta) * c.arrows.length]));

/** How far a forecast was from what happened, in arrows. */
export function missBy(forecastFx: Fx[], actualFx: Fx[]): number {
  const f = arrowsOf(forecastFx);
  const t = arrowsOf(actualFx);
  return [...new Set([...Object.keys(f), ...Object.keys(t)])].reduce((v, k) => v + Math.abs((f[k] ?? 0) - (t[k] ?? 0)), 0);
}

/** After a decision: what the adviser said, what happened, and whom it served. */
export function logAdvice(s: GameState, e: GameEvent, c: Choice, role: string, said: { now: Fx[]; later: Fx[] }, recommended: string | null, actual: Outcome, aidFx: (fx: Fx[] | undefined) => Fx[]): void {
  const a = adviser(s, role);
  if (!a) return;
  const real = [...aidFx(actual.fx), ...(c.naira ? [['nation.fiscalSpace', -c.naira] as Fx] : []), ...(actual.later ?? []).flatMap((l) => l.fx)];
  const miss = missBy([...said.now, ...said.later], real);
  const served = leans(a) && recommended === c.id && patronGain(a, actual, c) > 0 ? a.patron : undefined;
  (s.advice ??= []).push({ role, turn: s.turn, event: e.id, choice: c.id, followed: recommended === c.id, miss, served });
  if (s.advice.length > 120) s.advice.shift();
}

/** An adviser's record: forecasts checked against what happened, and whom their advice served. */
export function trackRecord(s: GameState, role: string): { checked: number; close: number; followed: number; served: [string, number][] } {
  const rows = (s.advice ?? []).filter((r) => r.role === role);
  const served: Record<string, number> = {};
  for (const r of rows) if (r.served) served[r.served] = (served[r.served] ?? 0) + 1;
  return { checked: rows.length, close: rows.filter((r) => r.miss <= 1).length, followed: rows.filter((r) => r.followed).length, served: Object.entries(served) as [string, number][] };
}

export type AidFx = (fx: Fx[] | undefined) => Fx[];
