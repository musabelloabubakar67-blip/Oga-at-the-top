// Your governors, senators and ministers, and the opposition they may defect to.

import { PEOPLE, PERSON_BY_ID, REPLACEMENTS, RIVALS, type Person } from '../content/people';
import { CFG } from './config';
import type { GameState, ZoneId } from './types';
import { applyFx, approval, clamp, groupStanding, hardship, senate, standing } from './vars';

export { senate, standing };

export interface PersonState {
  rel: number;
  granted: boolean;
  compliantUntil?: number;
  courted: number[];
  /** Set when a minister has been replaced. */
  name?: string;
  short?: string;
  competence?: number;
  clout?: number;
  bio?: string;
}

export function initPeople(s: GameState): void {
  const bg = s.president.background;
  s.people = {};
  for (const p of PEOPLE) {
    let rel = p.loyalty;
    if (bg === 'governor' && p.group === 'governor') rel += 8;
    if (bg === 'legislator' && p.group === 'senator') rel += 10;
    if (bg === 'technocrat') rel += p.group === 'minister' ? 6 : -5;
    if (bg === 'outsider') rel -= 6;
    if (p.zone && p.zone === s.president.homeZone) rel += 8;
    s.people[p.id] = { rel: clamp(rel, 5, 95), granted: false, courted: [] };
  }
  s.opposition = { alt: 38, fire: 32, strong: 30 };
}

export function personView(s: GameState, id: string): Person & PersonState & { standing: number } {
  const base = PERSON_BY_ID[id];
  const st = s.people[id];
  return {
    ...base, ...st,
    name: st.name ?? base.name, short: st.short ?? base.short,
    competence: st.competence ?? base.competence, clout: st.clout ?? base.clout, bio: st.bio ?? base.bio,
    standing: standing(s, id),
  };
}

export function relWord(v: number): string {
  if (v >= 75) return 'Devoted';
  if (v >= 58) return 'With you';
  if (v >= 42) return 'Wavering';
  if (v >= 25) return 'Unhappy';
  return 'Against you';
}

const weighted = groupStanding;

export function governorOf(zone: ZoneId): Person | undefined {
  return PEOPLE.find((p) => p.group === 'governor' && p.zone === zone);
}

/** Points of vote share a zone's governor delivers, or withholds. */
export function governorEffect(s: GameState, zone: ZoneId): number {
  const g = governorOf(zone);
  if (!g) return 0;
  return ((standing(s, g.id) - 50) / 50) * (1.5 + g.clout * 0.4);
}

/** How fast a reform track moves under its minister. */
export function ministerSpeed(s: GameState, track: string): number {
  const m = PEOPLE.find((p) => p.group === 'minister' && p.tracks?.includes(track));
  const comp = m ? (s.people[m.id]?.competence ?? m.competence ?? 3) : 3;
  return 0.82 + comp * 0.06;
}

export function strongestRival(s: GameState): { id: string; strength: number } {
  const [id, strength] = Object.entries(s.opposition).sort((a, b) => b[1] - a[1])[0] ?? ['alt', 40];
  return { id, strength };
}

export function peopleTick(s: GameState): void {
  for (const p of PEOPLE) {
    const st = s.people[p.id];
    if (!st) continue;
    const bloc = p.group === 'minister' ? s.blocs.villa : s.blocs.party;
    let d = (50 - st.rel) * 0.03 + (bloc - 50) * 0.03;
    // The ambitious drift away as the election nears; the principled warm to clean government.
    if (p.temper === 'ambitious' && approval(s) < 45) d -= 0.5;
    if (p.temper === 'principled') d += (s.nation.integrity - 35) * 0.02;
    if (p.temper === 'transactional' && !st.granted) d -= 0.45;
    st.rel = clamp(st.rel + d, 0, 100);
  }
  // The party's mood follows its governors and senators.
  const leaders = (weighted(s, 'governor') + weighted(s, 'senator')) / 2;
  s.blocs.party = clamp(s.blocs.party + (leaders - 50) * 0.03, 0, 100);

  const h = hardship(s);
  const target: Record<string, number> = {
    alt: 34 + s.pressures.scandalHeat * 0.3 + Math.max(0, 50 - s.blocs.establishment) * 0.5 + Math.max(0, s.nation.debt - 70) * 0.3,
    fire: 24 + Math.max(0, h - 40) * 0.9 + Math.max(0, 50 - s.blocs.street) * 0.5,
    strong: 26 + Math.max(0, 50 - s.blocs.party) * 0.9 + Math.max(0, 50 - weighted(s, 'governor')) * 0.6,
  };
  for (const r of RIVALS) {
    s.opposition[r.id] = clamp((s.opposition[r.id] ?? 30) + (target[r.id] - (s.opposition[r.id] ?? 30)) * 0.1, 5, 95);
  }
}

// ---------------------------------------------------------------- dealings

export type PersonOp = 'court' | 'grant' | 'pressure';

export function canDeal(s: GameState, id: string, op: PersonOp, movesLeft: number): { ok: boolean; reason?: string } {
  const p = PERSON_BY_ID[id];
  const st = s.people[id];
  if (!p || !st) return { ok: false };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (op === 'grant') {
    if (!p.want) return { ok: false };
    if (st.granted) return { ok: false, reason: 'Already granted.' };
    if (p.want.pc && s.pc < p.want.pc) return { ok: false, reason: `Needs ${p.want.pc} political capital.` };
    if (p.want.naira && p.want.naira > s.nation.fiscalSpace && s.nation.debt >= 100) return { ok: false, reason: 'There is no money, and nobody will lend it.' };
  }
  if (op === 'pressure') {
    if (s.pc < 4) return { ok: false, reason: 'Needs 4 political capital.' };
    if (st.compliantUntil && st.compliantUntil > s.turn) return { ok: false, reason: 'Already being leaned on.' };
  }
  return { ok: true };
}

/** Returns the text of what happened. The caller counts the move and records the archive entry. */
export function deal(s: GameState, id: string, op: PersonOp): { text: string; archive: string; sealed?: boolean } {
  const p = personView(s, id);
  const st = s.people[id];
  if (op === 'court') {
    const recent = st.courted.filter((t) => s.turn - t <= 12).length;
    const gain = Math.max(3, 10 - recent * 4);
    st.rel = clamp(st.rel + gain, 0, 100);
    st.courted.push(s.turn);
    return {
      text: recent === 0
        ? `You give ${p.short} an hour, alone, with no aides. It is more than most presidents manage in a term, and it is remembered.`
        : `Another hour with ${p.short}. Welcome, but the novelty is wearing off. Attention is not the same as delivery.`,
      archive: `Spent time with ${p.name}.`,
    };
  }
  if (op === 'grant' && p.want) {
    if (p.want.pc) s.pc = clamp(s.pc - p.want.pc, 0, 100);
    if (p.want.naira) applyFx(s, ['nation.fiscalSpace', -p.want.naira]);
    for (const fx of p.want.fx) applyFx(s, fx);
    st.rel = clamp(st.rel + 28, 0, 100);
    st.granted = true;
    // They owe you now, and everyone watching knows it.
    applyFx(s, ['pc', CFG.agenda.grantPc]);
    return { text: p.want.done, archive: `Gave ${p.name} what was asked: ${p.want.text.replace(/\.$/, '').toLowerCase()}.` };
  }
  // pressure
  s.pc = clamp(s.pc - 4, 0, 100);
  st.compliantUntil = s.turn + 8;
  st.rel = clamp(st.rel - 18, 0, 100);
  applyFx(s, ['nation.integrity', -1.5]);
  return {
    text: `The anti-corruption agency opens a file on ${p.short}'s accounts. Nothing is said. ${p.short} becomes extremely cooperative, and will remember exactly why.`,
    archive: `Had a file opened on ${p.name} to secure cooperation.`,
    sealed: true,
  };
}

export function replaceMinister(s: GameState, id: string, kind: keyof typeof REPLACEMENTS): { text: string; archive: string } {
  const old = personView(s, id);
  const r = REPLACEMENTS[kind];
  const used = new Set(Object.values(s.people).map((x) => x.name));
  const name = r.names.find((n) => !used.has(n)) ?? r.names[0];
  s.people[id] = {
    rel: r.loyalty, granted: false, courted: [], name, short: name.split(' ').slice(-1)[0],
    competence: r.competence, clout: r.clout, bio: r.bio,
  };
  applyFx(s, ['bloc.party', kind === 'party' ? 5 : -4 - old.clout]);
  applyFx(s, ['bloc.villa', -2]);
  if (kind === 'party') applyFx(s, ['nation.integrity', -1.5]);
  return {
    text: kind === 'technocrat'
      ? `${old.name} is thanked. ${name} arrives with a laptop and no entourage. The ministry's files begin to move.`
      : `${old.name} is thanked. ${name} arrives with forty aides. The governors are pleased; the permanent secretary updates her CV.`,
    archive: `Replaced ${old.name} with ${name} as ${old.title}.`,
  };
}
