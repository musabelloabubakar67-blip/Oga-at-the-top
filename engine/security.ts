// Six theatres, each with its own cause and its own cost to the country.

import { THEATRES, THEATRE_BY_ZONE } from '../content/theatres';
import { CFG, monthOf } from './config';
import type { GameState, ZoneId } from './types';
import { ZONES, clamp, hardship, shiftThreat, syncSecurity } from './vars';

export function initSecurity(s: GameState): void {
  s.theatres = Object.fromEntries(THEATRES.map((t) => [t.zone, t.start])) as Record<ZoneId, number>;
  s.focus = null;
  syncSecurity(s);
}

export function threatWord(v: number): string {
  if (v >= 75) return 'Out of control';
  if (v >= 60) return 'Dangerous';
  if (v >= 45) return 'Contested';
  if (v >= 30) return 'Contained';
  return 'Quiet';
}

/** How much each theatre is moving by itself this month, and why. Positive is worse. */
export function theatreDrift(s: GameState, z: ZoneId): { d: number; why: string[] } {
  const h = hardship(s);
  const n = s.nation;
  const why: string[] = [];
  let d = CFG.economy.securityDecay;
  const add = (v: number, text: string) => { if (Math.abs(v) >= 0.02) { d += v; why.push(`${text} (${v > 0 ? 'worse' : 'better'})`); } };
  const austerity = n.debt > CFG.economy.debtCliff && n.fiscalSpace <= 0.05;
  switch (z) {
    case 'NW':
      add((h - 55) * 0.012, 'Cost-of-living pressure');
      break;
    case 'NE':
      if (austerity) add(0.35, 'The government has no money for the war');
      if (s.people.gov_ne?.granted) add(-0.12, 'Reconstruction is under way');
      break;
    case 'NC':
      add((h - 55) * 0.008, 'Cost-of-living pressure');
      if ([4, 5, 6, 7].includes(monthOf(s.turn)) && !s.agenda.done.includes('f2')) add(0.18, 'Planting season, unprotected');
      break;
    case 'SW':
      add(-(n.jobs - 38) * 0.012, 'Jobs and industry');
      break;
    case 'SE':
      add(-(s.zones.SE.approval - 48) * 0.02, 'How the South East feels about you');
      break;
    case 'SS':
      add((32 - n.integrity) * 0.015, 'Integrity');
      if (s.flags['oil.metered']) add(-0.25, 'Terminals are metered');
      if (s.ventures.won.includes('amnesty')) add(-0.15, 'The amnesty is being paid');
      break;
  }
  if (austerity && z !== 'NE') add(CFG.economy.austeritySecurity, 'Austerity');
  if (s.focus === z) add(-0.6, 'The security effort is concentrated here');
  else if (s.focus) add(0.1, 'Forces have been moved elsewhere');
  return { d, why };
}

export function securityTick(s: GameState): void {
  for (const z of ZONES) shiftThreat(s, z, theatreDrift(s, z).d);
  // What the theatres cost, beyond fear.
  if (s.theatres.SE > 55) s.nation.jobs = clamp(s.nation.jobs - (s.theatres.SE - 55) * 0.002, 0, 100);
  if (s.theatres.SW > 60) s.blocs.establishment = clamp(s.blocs.establishment - 0.15, 0, 100);
  syncSecurity(s);
}

/** How far the farm belt and the North West push food prices. */
export function foodInflation(s: GameState): number {
  return ((s.theatres.NW + s.theatres.NC) / 2 - 55) * 0.07;
}

export function canFocus(s: GameState, zone: ZoneId | null, movesLeft: number): { ok: boolean; reason?: string } {
  if (zone === s.focus) return { ok: false, reason: 'That is where they already are.' };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  const last = s.counters.focusTurn;
  if (last !== undefined && s.turn - last < 3) return { ok: false, reason: `The redeployment is still under way. ${3 - (s.turn - last)} more months.` };
  return { ok: true };
}

export function setFocus(s: GameState, zone: ZoneId | null): string {
  s.focus = zone;
  s.counters.focusTurn = s.turn;
  return zone
    ? `The Defence Headquarters moves men and aircraft to deal with ${THEATRE_BY_ZONE[zone].name.toLowerCase()}. Every other theatre has a little less.`
    : 'Forces return to their usual stations. No theatre has priority.';
}
