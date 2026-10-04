// The Vice President. Chosen as the running mate from the other half of the
// country, as tickets are. A Vice President given work and respect is a second
// pair of hands and, in time, the obvious heir. One left with nothing to do, and
// ambition to spare, builds a camp of their own inside your party.

import { NORTH } from '../content/federal';
import { CFG, termTurnOf } from './config';
import { generatePerson, candidatesFor, type Offer } from './talent';
import type { GameState, ZoneId } from './types';
import { ZONES, applyFx, clamp } from './vars';

export const PORTFOLIO_PC = 3;
export const REPLACE_VP_PC = 8;

export function otherHalf(z: ZoneId): ZoneId[] {
  const north = NORTH.includes(z);
  return ZONES.filter((x) => NORTH.includes(x) !== north);
}

export function initVP(s: GameState): void {
  const c = generatePerson(s, 'politics', otherHalf(s.president.homeZone), 3);
  s.vp = { name: c.name, short: c.short, zone: c.zone, competence: c.competence, loyalty: c.loyalty, integrity: c.integrity, clout: Math.max(2, c.clout), ambition: c.ambition, rel: 55, since: s.turn, blurb: c.blurb };
  (s.origins ??= {})[c.name] = c.zone;
}

/** Where the Vice President's standing is heading, and why. */
export function vpTarget(s: GameState): { v: number; why: string[] } {
  const vp = s.vp!;
  const why: string[] = [];
  let v = 50 + (vp.loyalty - 3) * 8;
  if (vp.portfolio !== undefined && s.turn - vp.portfolio < 24) { v += 12; why.push('Has real work to do'); }
  if (vp.sidelined) { v -= 25; why.push('Has been sidelined, and knows it'); }
  if (vp.ambition >= 2) { v -= 8; why.push('Ambitious'); }
  if (s.flags['succession.backed'] === 'vp') { v += 20; why.push('Is your chosen successor'); }
  else if (s.flags['succession.backed']) { v -= 20; why.push('Was passed over for the succession'); }
  return { v: clamp(v, 5, 95), why };
}

export function vpTick(s: GameState): void {
  const vp = s.vp;
  if (!vp) return;
  vp.rel = clamp(vp.rel + (vpTarget(s).v - vp.rel) * 0.06, 0, 100);
  // Real work, done well, shows in the machinery of government.
  if (vp.portfolio !== undefined && s.turn - vp.portfolio < 24 && vp.rel >= 50) applyFx(s, ['nation.capacity', 0.02 * (vp.competence - 2)]);
  // A cold, ambitious deputy briefs against you; a sidelined one has less reach.
  if (vp.rel < 35 && vp.ambition >= 1) {
    const k = vp.sidelined ? 0.5 : 1;
    applyFx(s, ['bloc.party', -0.06 * k]);
    applyFx(s, ['pressure.scandalHeat', 0.04 * k]);
    if (vp.briefing === undefined) {
      vp.briefing = s.turn;
      s.news.push({ chronicle: `VICE PRESIDENT'S CAMP "DISTANCES" ITSELF FROM VILLA POLICIES`, street: 'VP AND OGA NO DEY SEE EYE TO EYE', weight: 5, valence: -1, topic: 'politics', body: `Aides to ${vp.name} have been briefing journalists that the Vice President was "not consulted".` });
    }
  }
}

export function canPortfolio(s: GameState, movesLeft: number): { ok: boolean; reason?: string } {
  const vp = s.vp;
  if (!vp) return { ok: false };
  if (vp.portfolio !== undefined && s.turn - vp.portfolio < 12) return { ok: false, reason: 'The Vice President was given a brief within the year.' };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < PORTFOLIO_PC) return { ok: false, reason: `Needs ${PORTFOLIO_PC} political capital.` };
  return { ok: true };
}

/** The economic council, a reform to drive, a region to settle: work that is seen. */
export function givePortfolio(s: GameState): string {
  const vp = s.vp!;
  s.pc = clamp(s.pc - PORTFOLIO_PC, 0, 100);
  vp.portfolio = s.turn;
  vp.sidelined = false;
  vp.rel = clamp(vp.rel + 8, 0, 100);
  return `${vp.name} chairs the economic council and the delivery reviews for two years. A competent Vice President makes the government work better; any Vice President with a job is less trouble than one without.`;
}

export function sideline(s: GameState): string {
  const vp = s.vp!;
  vp.sidelined = true;
  vp.portfolio = undefined;
  vp.rel = clamp(vp.rel - 20, 0, 100);
  return `${vp.name} is no longer invited to the morning meetings. The diary fills with funerals and trade fairs. The Vice President notices; so does the party.`;
}

/** A new running mate can be chosen before the party's primary for the second term. */
export function canReplaceVP(s: GameState, name: string, movesLeft: number): { ok: boolean; reason?: string } {
  if (!s.vp) return { ok: false };
  const tt = termTurnOf(s.turn);
  if (s.term !== 1 || tt < 24 || tt > CFG.electionTermTurn - 4) return { ok: false, reason: 'A running mate can be changed only on the way to the second-term ticket, from month 24 of the first term.' };
  const o = vpCandidates(s).find((x) => x.c.name === name);
  if (!o) return { ok: false, reason: 'Not available.' };
  if (o.refuses) return { ok: false, reason: o.refuses };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < REPLACE_VP_PC) return { ok: false, reason: `Needs ${REPLACE_VP_PC} political capital.` };
  return { ok: true };
}

export function vpCandidates(s: GameState): Offer[] {
  return candidatesFor(s, 'vp', 8).filter((o) => o.c.spec === 'politics' || o.c.spec === 'administration' || o.c.spec === 'economics');
}

export function replaceVP(s: GameState, name: string): string {
  const old = s.vp!;
  const o = vpCandidates(s).find((x) => x.c.name === name)!;
  s.pc = clamp(s.pc - REPLACE_VP_PC, 0, 100);
  applyFx(s, ['bloc.party', -3 - old.clout]);
  applyFx(s, [`zone.${old.zone}.approval`, -3]);
  const c = o.c;
  s.vp = { name: c.name, short: c.short, zone: c.zone, competence: c.competence, loyalty: c.loyalty, integrity: c.integrity, clout: Math.max(2, c.clout), ambition: c.ambition, rel: 60, since: s.turn, blurb: c.blurb };
  (s.origins ??= {})[c.name] = c.zone;
  if (s.flags['succession.backed'] === 'vp') delete s.flags['succession.backed'];
  for (const k of Object.keys(s.counters)) if (k.endsWith('.vp') && (k.startsWith('groom') || k.startsWith('credits'))) delete s.counters[k];
  return `${old.name} is dropped from the ticket and ${c.name} takes the place. The ${old.zone} reads it as a slight; ${old.name}'s people read it as a declaration.`;
}
