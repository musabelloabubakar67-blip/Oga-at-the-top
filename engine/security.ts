// Six theatres, each with its own cause and its own cost to the country.

import { MILESTONE_BY_ID } from '../content/agenda';
import { reformName } from './reforms';
import { ensureMilitary, readinessFactor } from './military';
import { THEATRES, THEATRE_BY_ZONE } from '../content/theatres';
import { CFG, monthOf } from './config';
import type { GameState, Outcome, ZoneId } from './types';
import { ZONES, ZONE_NAME, clamp, hardship, shiftThreat, syncSecurity } from './vars';

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
  // State police take some of the anger that would otherwise become recruits.
  const shield = Math.min(0.75, s.counters['sec.shield'] ?? 0);
  const living = shield ? `Cost-of-living pressure, ${Math.round(shield * 100)}% absorbed by state police` : 'Cost-of-living pressure';
  switch (z) {
    case 'NW':
      add((h - 55) * 0.012 * (1 - shield), living);
      break;
    case 'NE':
      if (austerity) add(0.35, 'The government has no money for the war');
      if (s.people.gov_ne?.granted) add(-0.12, 'Reconstruction is under way');
      break;
    case 'NC':
      add((h - 55) * 0.008 * (1 - shield), living);
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
  // What has been built here keeps working, every month.
  const lasting = s.counters[`drift.${z}`] ?? 0;
  if (lasting) add(lasting, measuresIn(s, z) || 'Lasting measures');
  // Courts and police posts keep cleared ground cleared.
  const hold = Math.min(0.75, s.counters['sec.hold'] ?? 0);
  if (hold && d > 0 && s.theatres[z] < 45) {
    const cut = d * hold;
    d -= cut;
    why.push('Cleared ground is held by courts and police posts (better)');
  }
  return { d, why };
}

/** The delivered reforms that keep working in a theatre, by name. */
function measuresIn(s: GameState, z: ZoneId): string {
  return s.agenda.done
    .map((id) => MILESTONE_BY_ID[id]?.m)
    .filter((m) => m && m.done.some(([t, v]) => (t === `drift.${z}` || t === 'drift.all') && v < 0))
    .map((m) => reformName(s, m!.id))
    .join('; ');
}

/** How hard an offensive in a theatre would hit, and why. */
export function offensiveStrength(s: GameState, z: ZoneId): { strike: number; why: string[]; held: boolean } {
  const why: string[] = [];
  let strike = (1 + (s.counters['sec.strike'] ?? 0)) * readinessFactor(s);
  for (const id of s.agenda.done) {
    const m = MILESTONE_BY_ID[id]?.m;
    if (m?.done.some(([t, v]) => t === 'sec.strike' && v > 0)) why.push(reformName(s, id).toLowerCase());
  }
  const ready = ensureMilitary(s).readiness;
  if (Math.abs(ready - 50) >= 5) why.push(`the forces are at ${Math.round(ready)}% readiness`);
  if (s.focus === z) { strike += 0.25; why.push('the forces are already concentrated there'); }
  if (z === 'SE') { strike *= 0.5; why.push('the South East is a political problem, and soldiers make it worse'); }
  const held = (s.counters[`drift.${z}`] ?? 0) <= -0.08 || (s.counters['sec.hold'] ?? 0) > 0;
  return { strike, why, held };
}

/** The theatre in the worst state. */
export function worstTheatre(s: GameState): ZoneId {
  return [...ZONES].sort((a, b) => s.theatres[b] - s.theatres[a])[0];
}

/** A military offensive aimed at one theatre. Its weight comes from what has been built. */
export function offensiveOutcome(s: GameState, z: ZoneId, base: Outcome): Outcome {
  const { strike, held } = offensiveStrength(s, z);
  const where = ZONE_NAME[z];
  const r = (x: number) => Math.round(x * 10) / 10;
  return {
    ...base,
    result: `Operations begin against ${THEATRE_BY_ZONE[z].name.toLowerCase()} in the ${where}. The Defence Headquarters issues daily figures. You ask for weekly ones that have been checked.`,
    fx: [[`theatre.${z}`, r(-4 * strike)], ['bloc.establishment', 2], ...(z === 'SE' ? [['zone.SE.approval', -4] as [string, number]] : [])],
    later: [
      { after: [3, 5], fx: [[`theatre.${z}`, r(-8 * strike)], ['approval', 1.5]], label: `The offensive clears the main camps in the ${where}.`, note: base.later?.[0]?.note },
      ...(held ? [] : [{ after: [9, 12] as [number, number], fx: [[`theatre.${z}`, 7] as [string, number]], label: `Nobody held the ground in the ${where}. The fighters come back to the camps the army left.` }]),
    ],
    archive: `Ordered a sustained military offensive in the ${where}.`,
  };
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
