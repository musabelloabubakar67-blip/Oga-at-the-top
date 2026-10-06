import { CANDIDATES } from '../content/candidates';
import { PERSON_BY_ID, RIVAL_BY_ID } from '../content/people';
import { TYCOON_BY_ID } from '../content/tycoons';
import { clockOf, ensureGovernance } from './governance';
import type { Favour, GameState } from './types';

export type FavourUseId = 'deliver' | 'calm' | 'whip' | 'overtime' | 'cash' | 'invest' | 'press' | 'capital' | 'silence' | 'mediate' | 'oversight' | 'withdraw-request' | 'decision';
export interface FavourSettlement { at: number; administrationId: string; mode: 'used' | 'offset' | 'forgiven' | 'settled' | 'voided'; favour: Favour; units: number; remaining: number; reason: string; use?: string; otherId?: number }

/** Resolve against current occupants without mutating a save from a read. */
export function favourParties(s: GameState, who: string): { counterpart: string; president: string } {
  const g = s.governance;
  const key = (office: string, name: string) => {
    const named = office !== 'president' ? CANDIDATES.find((c) => c.name === name) : undefined;
    if (named) return named.id;
    const old = g?.persons[g.offices[office]];
    if (old?.name === name) return old.id;
    const source = office === 'president' ? office + ':' + clockOf(s).administrationId : office;
    return 'legacy:' + encodeURIComponent(source) + ':' + encodeURIComponent(name);
  };
  const person = s.people[who], character = s.chars[who], tycoon = TYCOON_BY_ID[who];
  const counterpart = person ? key(who, person.name ?? PERSON_BY_ID[who]?.name ?? who)
    : character ? key('adviser:' + who, character.name) : tycoon ? key(who, tycoon.name)
    : who === 'vp' && s.vp ? key('vp', s.vp.name) : 'legacy:other:' + who;
  return { counterpart, president: key('president', s.president.name) };
}
/** Legacy saves cannot reconstruct former holders; bind their live balances once. */
export function bindFavours(s: GameState): void {
  const g = ensureGovernance(s);
  for (const f of s.favours) {
    if (!f.counterpart || !f.president) {
      const parties = favourParties(s, f.who);
      f.counterpart ??= parties.counterpart; f.president ??= parties.president;
    }
    g.persons[f.counterpart] ??= { id: f.counterpart, name: s.people[f.who]?.name ?? PERSON_BY_ID[f.who]?.name ?? s.chars[f.who]?.name ?? TYCOON_BY_ID[f.who]?.name ?? RIVAL_BY_ID[f.who]?.name ?? f.who };
    f.originalSize ??= f.size;
  }
}
export function favourBelongs(s: GameState, f: Favour): boolean {
  const p = favourParties(s, f.who);
  return (!f.president || f.president === p.president) && (!f.counterpart || f.counterpart === p.counterpart);
}
export function consumeFavour(s: GameState, id: number, units: number, mode: FavourSettlement['mode'], reason: string, use?: string, otherId?: number): void {
  const f = s.favours.find((f) => f.id === id);
  if (!f || !Number.isSafeInteger(units) || units < 1 || units > f.size) throw new Error('Invalid favour strength');
  bindFavours(s);
  const remaining = f.size - units, clock = clockOf(s);
  (s.favourSettlements ??= []).push({ at: clock.worldMonth, administrationId: clock.administrationId, mode, favour: structuredClone(f), units, remaining, reason, use, otherId });
  if (remaining === 0) s.favours = s.favours.filter((f) => f.id !== id); else f.size = remaining;
}
export function canOffsetFavours(s: GameState, a: number, b: number, units?: number): { ok: boolean; reason?: string; units?: number } {
  const x = s.favours.find((f) => f.id === a), y = s.favours.find((f) => f.id === b);
  if (!x || !y || a === b || x.dir === y.dir) return { ok: false, reason: 'Needs two opposite live debts.' };
  const px = { ...favourParties(s, x.who), ...(x.counterpart ? { counterpart: x.counterpart } : {}), ...(x.president ? { president: x.president } : {}) };
  const py = { ...favourParties(s, y.who), ...(y.counterpart ? { counterpart: y.counterpart } : {}), ...(y.president ? { president: y.president } : {}) };
  if (px.counterpart !== py.counterpart || px.president !== py.president) return { ok: false, reason: 'Only the same two people can offset their debts.' };
  if (px.president !== favourParties(s, x.who).president) return { ok: false, reason: 'These personal debts belong to another President.' };
  const n = units ?? Math.min(x.size, y.size);
  if (!Number.isSafeInteger(n) || n < 1 || n > Math.min(x.size, y.size)) return { ok: false, reason: 'The offset exceeds the remaining strength.' };
  return { ok: true, units: n };
}
export function offsetFavours(s: GameState, a: number, b: number, units?: number): number {
  const check = canOffsetFavours(s, a, b, units);
  if (!check.ok) throw new Error(check.reason);
  const n = check.units!;
  consumeFavour(s, a, n, 'offset', 'Bilateral settlement', undefined, b);
  consumeFavour(s, b, n, 'offset', 'Bilateral settlement', undefined, a);
  return n;
}
export function getFavourView(s: GameState) {
  const copy = structuredClone(s); bindFavours(copy);
  return { balances: copy.favours.map((f) => ({ ...f, currentParties: favourBelongs(copy, f) })), settlements: copy.favourSettlements ?? [] };
}

export function canForgiveFavour(s: GameState, id: number, units?: number): { ok: boolean; reason?: string } {
  const f = s.favours.find((f) => f.id === id);
  if (!f || f.dir !== 'owed') return { ok: false, reason: 'Only a debt owed to you can be forgiven.' };
  if (f.president && f.president !== favourParties(s, f.who).president) return { ok: false, reason: 'Another President owns that claim.' };
  const n = units ?? f.size;
  if (!Number.isSafeInteger(n) || n < 1 || n > f.size) return { ok: false, reason: 'Choose strength within the remaining balance.' };
  return { ok: true };
}
/** Preserve personal balances as historical claims; the successor cannot spend them. */
export function inheritFavours(s: GameState, previous: GameState): void {
  const old = structuredClone(previous); bindFavours(old);
  let seq = Math.max(previous.counters.favourSeq ?? 0, ...old.favours.map((f) => f.id), ...(old.favourSettlements ?? []).map((e) => e.favour.id));
  const fresh = s.favours.map((f) => ({ ...f, id: ++seq, president: s.governance!.offices.president }));
  s.favours = [...old.favours, ...fresh];
  s.favourSettlements = structuredClone(old.favourSettlements ?? []);
  s.counters.favourSeq = seq;
}
