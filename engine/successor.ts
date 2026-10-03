// The succession. Anyone in the named cast can be groomed and backed: a governor,
// a senator, a minister, the Finance Minister. What they bring to the election
// is their clout, their record and how long you have spent building them up.
// What they bring to you afterwards is their loyalty, which remembers how you
// treated them, and their integrity, which decides whether loyalty is enough.

import { PEOPLE, PERSON_BY_ID } from '../content/people';
import { termTurnOf } from './config';
import { following, personView } from './people';
import { grievances } from './targets';
import type { GameState } from './types';
import { clamp, standing } from './vars';

export interface Candidate {
  id: string; name: string; title: string;
  /** Points added to the party's share at the succession election, before the usual successor penalty. */
  strength: number;
  /** 0 to 100: how they will treat you once they hold the Villa. */
  loyalty: number;
  integrity: number;
  groomed: number;
  why: string[];
}

export const GROOM_PC = 4;
export const GROOM_MAX = 3;

const TEMPER_INTEGRITY: Record<string, number> = { principled: 5, loyal: 3, ambitious: 3, transactional: 2 };

export function candidateIds(s: GameState): string[] {
  return [...PEOPLE.filter((p) => !s.people[p.id]?.gone).map((p) => p.id), ...(s.chars.fin ? ['fin'] : [])];
}

export function candidate(s: GameState, id: string): Candidate {
  const groomed = s.counters[`groom.${id}`] ?? 0;
  const why: string[] = [];
  let clout: number, competence: number, integrity: number, rel: number, name: string, title: string;
  if (id === 'fin') {
    const c = s.chars.fin;
    clout = 2; competence = c.competence; integrity = c.integrity; rel = 50 + (c.loyalty - 3) * 10; name = c.name; title = 'Minister of Finance';
  } else {
    const p = PERSON_BY_ID[id];
    const v = personView(s, id);
    clout = p.clout; competence = v.competence ?? (p.group === 'governor' ? 3 : 3);
    integrity = v.integrity ?? TEMPER_INTEGRITY[p.temper] ?? 3; rel = standing(s, id); name = v.name ?? p.name; title = p.title;
  }
  let strength = (clout - 3) * 0.7 + (competence - 3) * 0.4 + groomed * 0.5;
  if (clout >= 4) why.push('Has a structure of their own');
  if (clout <= 2) why.push('Has no structure: the party barely knows them');
  if (competence >= 4) why.push('A record that can be campaigned on');
  if (id !== 'fin' && PERSON_BY_ID[id].group === 'minister') {
    const f = following(s, id);
    strength += f * 0.3;
    if (f >= 2) why.push('A following earned in office');
  }
  if (groomed) why.push(`Groomed by you for ${groomed === 1 ? 'a season' : `${groomed} seasons`}`);
  const wrongs = grievances(s, id).length;
  let loyalty = rel - wrongs * 15 + groomed * 5;
  if (wrongs) why.push(`Remembers ${wrongs === 1 ? 'what you did to them' : `${wrongs} things you did to them`}`);
  if (id !== 'fin' && PERSON_BY_ID[id].temper === 'ambitious') { loyalty -= 10; why.push('Ambitious: gratitude will not last'); }
  return { id, name, title, strength: Math.round(clamp(strength, -2, 3) * 10) / 10, loyalty: clamp(Math.round(loyalty), 0, 100), integrity, groomed, why };
}

/** The three the party is talking about: whoever you have groomed first, then the strongest. */
export function shortlist(s: GameState): Candidate[] {
  return candidateIds(s).map((id) => candidate(s, id)).sort((a, b) => b.groomed - a.groomed || b.strength - a.strength).slice(0, 3);
}

export function canGroom(s: GameState, id: string, movesLeft: number): { ok: boolean; reason?: string } {
  const tt = termTurnOf(s.turn);
  if (s.term !== 2 || tt < 12 || tt > 36) return { ok: false, reason: 'Successors are groomed in the second term, from month 12 to month 36.' };
  if (s.flags['succession.backed']) return { ok: false, reason: 'You have already backed a successor.' };
  if ((s.counters[`groom.${id}`] ?? 0) >= GROOM_MAX) return { ok: false, reason: 'As built up as they can be.' };
  if (s.counters[`groomed.${id}`] !== undefined && s.turn - s.counters[`groomed.${id}`] < 4) return { ok: false, reason: 'Too soon: once a season.' };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < GROOM_PC) return { ok: false, reason: `Needs ${GROOM_PC} political capital.` };
  return { ok: true };
}

/** A visible step: the chairmanship of a committee, a foreign trip at your side, the launch of a reform. The others notice. */
export function groom(s: GameState, id: string): string {
  s.pc = clamp(s.pc - GROOM_PC, 0, 100);
  s.counters[`groom.${id}`] = (s.counters[`groom.${id}`] ?? 0) + 1;
  s.counters[`groomed.${id}`] = s.turn;
  if (s.people[id]) s.people[id].rel = clamp(s.people[id].rel + 4, 0, 100);
  // Everyone else with ambitions sees who is being built up.
  for (const p of PEOPLE) {
    if (p.id === id || s.people[p.id]?.gone) continue;
    if (p.temper === 'ambitious' || p.clout >= 5) s.people[p.id].rel = clamp(s.people[p.id].rel - 3, 0, 100);
  }
  const c = candidate(s, id);
  return `You give ${c.name} a platform: a committee to chair, a seat at your side, a reform to launch. The others with ambitions take note.`;
}

/** Backing them at the convention. Sets the strength the succession election uses. */
export function backSuccessor(s: GameState, id: string): string {
  const c = candidate(s, id);
  s.flags['succession.backed'] = id;
  s.flags['succession.strength'] = c.strength;
  s.flags['successor.loyalty'] = c.loyalty;
  s.flags['successor.integrity'] = c.integrity;
  s.flags['successor.name'] = c.name;
  return '';
}
