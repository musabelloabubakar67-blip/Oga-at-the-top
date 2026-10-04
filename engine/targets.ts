// Orders aimed at someone: a governor, a senator, a businessman, a rival, a
// newspaper, a zone. Effects written with $T land on the target and $Z on the
// target's zone. A hostile order is remembered by whoever it hit; and the same
// weapon used again and again works less well each time.

import { rivalOf } from './rivals';
import { OUTLETS as PRESS } from '../content/press';
import { PEOPLE, PERSON_BY_ID, RIVALS, RIVAL_BY_ID } from '../content/people';
import { TYCOONS, TYCOON_BY_ID } from '../content/tycoons';
import { STATES, STATE_BY_ID } from '../content/states';
import type { Fx, GameState, ZoneId } from './types';
import { ZONES, ZONE_NAME, standing } from './vars';

export type TargetKind = 'theatre' | 'governor' | 'politician' | 'tycoon' | 'rival' | 'zone' | 'paper' | 'state';

export interface Target { id: string; label: string; detail?: string }

/** Everyone an order of this kind can be aimed at, the least friendly first. */
export function targetsFor(s: GameState, kind: TargetKind): Target[] {
  switch (kind) {
    case 'governor':
    case 'politician':
      return PEOPLE.filter((p) => (kind === 'governor' ? p.group === 'governor' : p.group === 'governor' || p.group === 'senator') && !s.people[p.id]?.gone)
        .sort((a, b) => standing(s, a.id) - standing(s, b.id))
        .map((p) => ({ id: p.id, label: s.people[p.id]?.name ?? p.name, detail: `${p.title}, standing ${Math.round(standing(s, p.id))}` }));
    case 'tycoon':
      return [...TYCOONS].sort((a, b) => (s.tycoons[a.id]?.rel ?? 50) - (s.tycoons[b.id]?.rel ?? 50))
        .map((t) => ({ id: t.id, label: t.name, detail: `${t.title}, standing ${Math.round(s.tycoons[t.id]?.rel ?? 50)}` }));
    case 'rival':
      return RIVALS.filter((r) => !s.flags[`rival.${r.id}.in`]).sort((a, b) => (s.opposition[b.id] ?? 0) - (s.opposition[a.id] ?? 0))
        .map((r) => ({ id: r.id, label: r.name, detail: `${r.party}, strength ${Math.round(s.opposition[r.id] ?? 30)}` }));
    case 'zone':
      return [...ZONES].sort((a, b) => s.zones[a].approval - s.zones[b].approval)
        .map((z) => ({ id: z, label: `the ${ZONE_NAME[z]}`, detail: `approval ${Math.round(s.zones[z].approval)}%` }));
    case 'paper':
      return Object.values(PRESS).map((p) => ({ id: p.id, label: p.name, detail: p.note }));
    case 'state':
      return [...STATES].sort((a, b) => s.zones[a.zone].approval - s.zones[b.zone].approval || b.voters - a.voters)
        .map((st) => ({ id: st.id, label: st.name, detail: `${ZONE_NAME[st.zone]}, ${st.voters}m voters` }));
    case 'theatre':
      return [...ZONES].map((z) => ({ id: z, label: `the ${ZONE_NAME[z]}` }));
  }
}

export function targetName(s: GameState, kind: TargetKind, id: string): { name: string; short: string } {
  if (kind === 'governor' || kind === 'politician') {
    const p = PERSON_BY_ID[id];
    return { name: s.people[id]?.name ?? p?.name ?? id, short: s.people[id]?.short ?? p?.short ?? id };
  }
  if (kind === 'tycoon') return { name: TYCOON_BY_ID[id]?.name ?? id, short: TYCOON_BY_ID[id]?.short ?? id };
  if (kind === 'rival') return RIVAL_BY_ID[id] ? { name: rivalOf(s, id).name, short: rivalOf(s, id).short } : { name: id, short: id };
  if (kind === 'state') { const n = STATE_BY_ID[id]?.name ?? id; return { name: `${n} State`, short: n }; }
  if (kind === 'paper') { const n = PRESS[id as keyof typeof PRESS]?.name ?? id; return { name: n, short: n }; }
  return { name: `the ${ZONE_NAME[id as ZoneId]}`, short: ZONE_NAME[id as ZoneId] };
}

function zoneOf(kind: TargetKind, id: string): ZoneId | undefined {
  if (kind === 'zone' || kind === 'theatre') return id as ZoneId;
  if (kind === 'state') return STATE_BY_ID[id]?.zone;
  if (kind === 'governor' || kind === 'politician') return PERSON_BY_ID[id]?.zone;
  return undefined;
}

/** Closing or attacking a newspaper does different things depending on whose paper it is. */
function paperFx(s: GameState, id: string, k: number): Fx[] {
  switch (id) {
    case 'chronicle': return [['bloc.press', -12 * k], ['nation.integrity', -5 * k]];
    case 'street': return [['bloc.street', -6 * k], ['bloc.press', -6 * k]];
    case 'stakeholder': return [['tycoon.ty_media', -20 * k], ['bloc.press', -5 * k]];
    default: {
      const top = RIVALS.filter((r) => !s.flags[`rival.${r.id}.in`]).sort((a, b) => (s.opposition[b.id] ?? 0) - (s.opposition[a.id] ?? 0))[0];
      return [['bloc.press', -6 * k], ...(top ? [[`rival.${top.id}`, 4 * k] as Fx] : [])];
    }
  }
}

/** The effects as they land on this target. */
export function aimFx(s: GameState, kind: TargetKind, id: string, fx: Fx[]): Fx[] {
  const z = zoneOf(kind, id);
  return fx.flatMap(([t, v, ...rest]): Fx[] => {
    if (t === 'paper') return paperFx(s, id, v);
    const key = t.replace('$T', id).replace('$Z', z ?? 'NW');
    return [[key, v, ...rest] as Fx];
  });
}

export function aimText(s: GameState, kind: TargetKind, id: string, text: string): string {
  const n = targetName(s, kind, id);
  const z = zoneOf(kind, id);
  return text.replace(/\{T\}/g, n.name).replace(/\{T_SHORT\}/g, n.short).replace(/\{T_ZONE\}/g, z ? `the ${ZONE_NAME[z]}` : 'the state');
}

// ---------------------------------------------------------------- wear-out

const WEAR_MONTHS = 24;

/** How many times this order has been used in the last two years. */
export function recentUses(s: GameState, orderId: string): number {
  return (s.orderLog ?? []).filter((x) => x.id === orderId && s.turn - x.turn < WEAR_MONTHS).length;
}

/** A weapon used again works less well: three quarters as well each time within two years. */
export function wearFactor(s: GameState, orderId: string): number {
  return Math.pow(0.75, recentUses(s, orderId));
}

// ---------------------------------------------------------------- the wronged

const MEMORY = 24;

/** Someone hit by a hostile order remembers it. */
export function wrong(s: GameState, kind: TargetKind, id: string, what: string): void {
  if (kind === 'zone' || kind === 'theatre' || kind === 'paper' || kind === 'state') return;
  (s.wronged ??= []).push({ who: id, kind, turn: s.turn, what, until: s.turn + MEMORY });
}

export function grievances(s: GameState, id: string): NonNullable<GameState['wronged']> {
  return (s.wronged ?? []).filter((w) => w.who === id && w.until > s.turn);
}

/** Every month: those who remember will not warm to you past a point until it passes. */
export function wrongedTick(s: GameState): void {
  for (const w of s.wronged ?? []) {
    if (w.until <= s.turn) continue;
    if (s.people[w.who]) s.people[w.who].rel = Math.min(s.people[w.who].rel, 45);
    if (s.tycoons[w.who]) s.tycoons[w.who].rel = Math.min(s.tycoons[w.who].rel, 40);
  }
  if (s.wronged && s.wronged.length > 80) s.wronged = s.wronged.slice(-80);
}

