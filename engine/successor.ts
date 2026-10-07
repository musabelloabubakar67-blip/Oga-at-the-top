import { reformName } from './reforms';
// The succession. Anyone in the named cast can be groomed and backed: a governor,
// a senator, a minister, the Finance Minister. What they bring to the election
// is their clout, their record and how long you have spent building them up.
// What they bring to you afterwards is their loyalty, which remembers how you
// treated them, and their integrity, which decides whether loyalty is enough.

import { MILESTONE_BY_ID } from '../content/agenda';
import { PEOPLE, PERSON_BY_ID } from '../content/people';
import { termTurnOf } from './config';
import { following, personView } from './people';
import { grievances } from './targets';
import type { GameState, ZoneId } from './types';
import { sameHalf, zoneOf } from './federal';
import { ZONE_NAME, clamp, standing } from './vars';

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
export const GROOM_MAX = 6;
export const CREDIT_PC = 2;
export const CREDIT_MAX = 4;
/** Grooming opens a year into the first term and closes when the party chooses. */
const OPENS = 12;
const CLOSES = 36;

const TEMPER_INTEGRITY: Record<string, number> = { principled: 5, loyal: 3, ambitious: 3, transactional: 2 };

export function candidateIds(s: GameState): string[] {
  return [...(s.vp ? ['vp'] : []), ...PEOPLE.filter((p) => !s.people[p.id]?.gone).map((p) => p.id), ...(s.chars.fin ? ['fin'] : [])];
}

/** Where a possible successor comes from. */
export function heirZone(s: GameState, id: string): ZoneId | null {
  if (id === 'fin') return s.chars.fin ? zoneOf(s, s.chars.fin.name) : null;
  if (id === 'vp') return s.vp?.zone ?? null;
  const p = PERSON_BY_ID[id];
  if (!p) return null;
  return p.zone ?? zoneOf(s, personView(s, id).name);
}

export function candidate(s: GameState, id: string): Candidate {
  const groomed = s.counters[`groom.${id}`] ?? 0;
  const why: string[] = [];
  let clout: number, competence: number, integrity: number, rel: number, name: string, title: string;
  if (id === 'vp') {
    const vp = s.vp!;
    clout = vp.clout; competence = vp.competence; integrity = vp.integrity; rel = vp.rel; name = vp.name; title = 'Vice President';
  } else if (id === 'fin') {
    const c = s.chars.fin;
    clout = 2; competence = c.competence; integrity = c.integrity; rel = 50 + (c.loyalty - 3) * 10; name = c.name; title = 'Minister of Finance';
  } else {
    const p = PERSON_BY_ID[id];
    const v = personView(s, id);
    clout = p.clout; competence = v.competence ?? (p.group === 'governor' ? 3 : 3);
    integrity = v.integrity ?? TEMPER_INTEGRITY[p.temper] ?? 3; rel = standing(s, id); name = v.name ?? p.name; title = p.title;
  }
  const credits = Math.min(CREDIT_MAX, s.counters[`credits.${id}`] ?? 0);
  // Built up over two terms, a nobody can become a contender; the record they are given is what makes it believable.
  let strength = (clout - 3) * 0.7 + (competence - 3) * 0.4 + groomed * 0.4 + credits * 0.3;
  if (credits) why.push(`Has ${credits === 1 ? 'a reform' : `${credits} reforms`} to campaign on, credited by you`);
  // A delegated test the country watched, and endorsements negotiated (plan 16): they improve the odds; they guarantee nothing.
  const tested = s.flags[`tested.${id}`];
  if (tested === 'passed') { strength += 0.6; why.push('Delivered a hard brief in public (+0.6)'); }
  if (tested === 'failed') { strength -= 0.6; why.push('Failed a hard brief in public (−0.6)'); }
  const endorsements = (s.counters[`endorse.${id}.party`] ? 1 : 0) + (s.counters[`endorse.${id}.governors`] ? 1 : 0);
  if (endorsements) { strength += endorsements * 0.4; why.push(`Endorsed by ${endorsements === 2 ? 'the party and the governors' : 'one of the party or the governors'} (+${(endorsements * 0.4).toFixed(1)})`); }
  const early = s.counters[`groomEarly.${id}`] ?? 0;
  if (early) { strength += Math.min(2, early) * 0.2; why.push('Built up since the first term: the country is used to the idea'); }
  if (clout >= 4) why.push('Has a structure of their own');
  if (id === 'vp') { const years = Math.floor((s.turn - (s.vp?.since ?? s.turn)) / 12); const b = Math.min(1, 0.25 * years); strength += b; if (b) why.push(`${years} ${years === 1 ? 'year' : 'years'} as Vice President: already the government's second face (+${b})`); }
  const zone = heirZone(s, id);
  if (zone) {
    why.push(`Would carry the ${ZONE_NAME[zone]} as their home zone`);
    // The unwritten rule: after a President from one half of the country, the ticket goes to the other.
    if (sameHalf(zone, s.president.homeZone)) { strength -= 1.5; why.push(`From the same half of the country as you: the party's rotation says it is the other half's turn (−1.5)`); }
    else { strength += 0.5; why.push('From the other half of the country, as the rotation expects (+0.5)'); }
  }
  if (clout <= 2) why.push('Has no structure: the party barely knows them');
  if (competence >= 4) why.push('A record that can be campaigned on');
  if (PERSON_BY_ID[id]?.group === 'minister') {
    const f = following(s, id);
    strength += f * 0.3;
    if (f >= 2) why.push('A following earned in office');
  }
  if (groomed) why.push(`Groomed by you for ${groomed === 1 ? 'a season' : `${groomed} seasons`}`);
  const wrongs = grievances(s, id).length;
  let loyalty = rel - wrongs * 15 + groomed * 5 + credits * 4;
  if (wrongs) why.push(`Remembers ${wrongs === 1 ? 'what you did to them' : `${wrongs} things you did to them`}`);
  if (PERSON_BY_ID[id]?.temper === 'ambitious' || (id === 'vp' && (s.vp?.ambition ?? 0) >= 2)) { loyalty -= 10; why.push('Ambitious: gratitude will not last'); }
  return { id, name, title, strength: Math.round(clamp(strength, -2, 4) * 10) / 10, loyalty: clamp(Math.round(loyalty), 0, 100), integrity, groomed, why };
}

/** The three the party is talking about: whoever you have groomed first, then the strongest. */
export function shortlist(s: GameState): Candidate[] {
  return candidateIds(s).map((id) => candidate(s, id)).sort((a, b) => b.groomed - a.groomed || b.strength - a.strength).slice(0, 3);
}

/** Whether grooming is open now, and if not, why. */
export function groomWindow(s: GameState): string | null {
  const tt = termTurnOf(s.turn);
  if (s.term === 1 && tt < OPENS) return `Successors can be built up from month ${OPENS} of your first term.`;
  if (s.term === 2 && tt > CLOSES) return 'The party has chosen. It is too late to build anyone up.';
  if (s.flags['ticket.lost'] || s.flags['election.lost']) return 'You will not be choosing a successor.';
  return null;
}

export function canGroom(s: GameState, id: string, movesLeft: number): { ok: boolean; reason?: string } {
  const shut = groomWindow(s);
  if (shut) return { ok: false, reason: shut };
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
  if (s.term === 1) s.counters[`groomEarly.${id}`] = (s.counters[`groomEarly.${id}`] ?? 0) + 1;
  if (s.people[id]) s.people[id].rel = clamp(s.people[id].rel + 4, 0, 100);
  // Everyone else with ambitions sees who is being built up; before your own re-election, they also wonder whether you mean to run.
  const sting = s.term === 1 ? 5 : 3;
  for (const p of PEOPLE) {
    if (p.id === id || s.people[p.id]?.gone) continue;
    if (p.temper === 'ambitious' || p.clout >= 5) s.people[p.id].rel = clamp(s.people[p.id].rel - sting, 0, 100);
  }
  const c = candidate(s, id);
  return `You give ${c.name} a platform: a committee to chair, a seat at your side, a reform to launch. The others with ambitions take note.`;
}

/** Your delivered reforms that nobody has yet been given the credit for. */
export function creditable(s: GameState): { id: string; name: string }[] {
  return s.agenda.done.filter((r) => s.counters[`done.${r}`] !== undefined && !s.flags[`credit.${r}`]).map((r) => ({ id: r, name: reformName(s, r) }));
}

export function canCredit(s: GameState, id: string, reform: string, movesLeft: number): { ok: boolean; reason?: string } {
  const shut = groomWindow(s);
  if (shut) return { ok: false, reason: shut };
  if (s.flags['succession.backed']) return { ok: false, reason: 'You have already backed a successor.' };
  if ((s.counters[`credits.${id}`] ?? 0) >= CREDIT_MAX) return { ok: false, reason: 'They have as many achievements as anyone will believe.' };
  if (!creditable(s).some((r) => r.id === reform)) return { ok: false, reason: 'Not a reform you delivered, or already credited to someone.' };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < CREDIT_PC) return { ok: false, reason: `Needs ${CREDIT_PC} political capital.` };
  return { ok: true };
}

/** Give them the credit for something you delivered: they launch it, they are photographed with it, they campaign on it. */
export function credit(s: GameState, id: string, reform: string): string {
  s.pc = clamp(s.pc - CREDIT_PC, 0, 100);
  s.flags[`credit.${reform}`] = id;
  s.counters[`credits.${id}`] = (s.counters[`credits.${id}`] ?? 0) + 1;
  if (s.people[id]) s.people[id].rel = clamp(s.people[id].rel + 3, 0, 100);
  const c = candidate(s, id);
  const r = reformName(s, reform);
  s.news.push({ chronicle: `PRESIDENT HAILS ${c.name.toUpperCase()} AS THE FORCE BEHIND "${r.toUpperCase()}"`, street: `NA ${c.name.toUpperCase()} DO AM, PRESIDENT TALK`, weight: 3, valence: 1, topic: 'politics', body: `${c.name} will lead the next phase. Nobody in the party missed what the President was saying.` });
  return `${c.name} is given the credit for ${r.toLowerCase()}: the launch, the photographs and the speeches. It is a record they can now run on, and they know whose it was.`;
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
