// The talent pool. A changing list of people who could be appointed to anything.
// Each has a speciality, true traits and a file that may flatter them. The pool
// refreshes as people arrive and move on, so it never runs dry; the best of them
// can refuse a government they do not trust. Appointing someone takes them out of
// the pool for every other job.

import { ADVISER_POOL } from '../content/names';
import { PERSON_BY_ID } from '../content/people';
import { BACKGROUNDS, NAMES_BY_ZONE, ROLE_SPECS, SPEC_NAME, TITLES, type Spec } from '../content/talent';
import { TYCOON_BY_ID } from '../content/tycoons';
import type { GameState, ZoneId } from './types';
import { approval, clamp } from './vars';

export interface Candidate {
  id: string; name: string; short: string; spec: Spec; zone: ZoneId;
  competence: number; loyalty: number; integrity: number; clout: number; ambition: number;
  /** 'president' (their own person), 'self', or the id of a governor, senator or businessman. */
  patron: string;
  /** What their file says. */
  rep: { competence: number; loyalty: number; integrity: number };
  blurb: string;
  /** Months they stay available. */
  until: number;
  /** Their file has been checked: the truth is known. */
  checked?: boolean;
}

export interface Talent { pool: Candidate[]; taken: string[]; seq: number }

const POOL_SIZE = 48;
const ZONES: ZoneId[] = ['NW', 'NE', 'NC', 'SW', 'SE', 'SS'];
const SPECS: Spec[] = ['economics', 'security', 'law', 'administration', 'engineering', 'politics', 'media'];
const PATRONS = ['gov_nw', 'gov_ne', 'gov_nc', 'gov_sw', 'gov_se', 'gov_ss', 'sen_pres', 'sen_approp', 'ty_trade', 'ty_bank', 'ty_fuel', 'ty_maker', 'ty_media'];

// A small seeded generator, so the pool does not disturb the game's own dice.
function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pickOf = <T,>(r: () => number, xs: T[]): T => xs[Math.floor(r() * xs.length)];
const weighted = (r: () => number, w: number[]): number => { const t = w.reduce((a, b) => a + b, 0); let x = r() * t; for (let i = 0; i < w.length; i++) { x -= w[i]; if (x < 0) return i; } return w.length - 1; };

function generate(s: GameState, t: Talent, spec?: Spec, floor = 1): Candidate {
  t.seq += 1;
  const r = prng((s.seed ?? 1) * 7919 + t.seq * 104729);
  const zone = pickOf(r, ZONES);
  const sp = spec ?? pickOf(r, SPECS);
  const female = r() < 0.35;
  const bank = NAMES_BY_ZONE[zone];
  const used = new Set([...t.pool.map((c) => c.name), ...t.taken]);
  let name = '', last = '';
  for (let i = 0; i < 6; i++) {
    const first = pickOf(r, female ? bank.f : bank.m);
    last = pickOf(r, bank.last);
    const title = pickOf(r, female ? TITLES[sp].f : TITLES[sp].m);
    name = `${title} ${first} ${last}`;
    if (!used.has(name)) break;
  }
  const competence = Math.max(floor, 1 + weighted(r, [10, 25, 35, 22, 8]));
  const integrity = 1 + weighted(r, [10, 20, 35, 25, 10]);
  const loyalty = 2 + weighted(r, [25, 40, 25, 10]);
  const patronRoll = r();
  const patron = patronRoll < 0.55 ? 'president' : patronRoll < 0.7 ? 'self' : pickOf(r, PATRONS);
  // Files flatter: those with a backer, or out for themselves, look better on paper.
  const lift = patron === 'president' ? 0 : 1;
  const noise = () => (r() < 0.25 ? (r() < 0.5 ? -1 : 1) : 0);
  const rep = {
    competence: clamp(competence + noise() + (lift && r() < 0.6 ? 1 : 0), 1, 5),
    loyalty: clamp(loyalty + noise() + (lift && r() < 0.7 ? 1 : 0), 1, 5),
    integrity: clamp(integrity + noise() + (lift && r() < 0.5 ? 1 : 0), 1, 5),
  };
  const blurb = `${pickOf(r, BACKGROUNDS[sp])} ${traitLine(rep)}`;
  return {
    id: `c${t.seq}`, name, short: last, spec: sp, zone, competence, loyalty, integrity, clout: 1 + weighted(r, [30, 35, 20, 10, 5]),
    ambition: weighted(r, [40, 30, 20, 10]), patron, rep, blurb, until: s.turn + 6 + Math.floor(r() * 10),
  };
}

function traitLine(rep: Candidate['rep']): string {
  const c = rep.competence >= 4 ? 'Said to be very good at the job' : rep.competence <= 2 ? 'Said to be out of their depth' : 'Said to be competent';
  const l = rep.loyalty >= 4 ? 'and loyal' : rep.loyalty <= 2 ? 'and their own person' : 'and reliable enough';
  const i = rep.integrity >= 4 ? ', with clean hands.' : rep.integrity <= 2 ? ', with questions about money.' : '.';
  return `${c} ${l}${i}`;
}

/** The pool, created on first use. The hand-written people from earlier versions are in it too. */
export function talent(s: GameState): Talent {
  if (s.talent) return s.talent;
  const t: Talent = { pool: [], taken: [], seq: 0 };
  const specOf: Record<string, Spec> = { Obidike: 'administration', Dankani: 'politics', Akinwale: 'media', Gwadabe: 'administration', Nwankwor: 'law', Gidado: 'politics' };
  for (const p of ADVISER_POOL) {
    t.pool.push({
      id: `h${p.short}`, name: p.name, short: p.short, spec: specOf[p.short] ?? 'administration', zone: 'NC',
      competence: p.competence, loyalty: p.loyalty, integrity: p.integrity, clout: p.clout, ambition: 1, patron: p.patron ?? 'president',
      rep: { competence: p.rep?.competence ?? p.competence, loyalty: p.rep?.loyalty ?? p.loyalty, integrity: p.integrity }, blurb: p.blurb ?? '', until: 999,
    });
  }
  while (t.pool.length < POOL_SIZE) t.pool.push(generate(s, t));
  // Anyone already in a job is not available for another.
  const working = new Set([...Object.values(s.chars).map((c) => c.name), ...(s.institutions ?? []).map((i) => i.head.name), ...(s.assets ?? []).map((a) => a.head.name)]);
  for (const c of t.pool) if (working.has(c.name)) t.taken.push(c.id);
  s.talent = t;
  return t;
}

/** Every month: some people move on, and new ones become available. */
export function talentTick(s: GameState): void {
  const t = talent(s);
  t.pool = t.pool.filter((c) => c.until > s.turn);
  while (t.pool.length < POOL_SIZE) t.pool.push(generate(s, t));
}

export function fits(c: Candidate, role: string): boolean {
  return (ROLE_SPECS[role] ?? ROLE_SPECS.asset).includes(c.spec);
}

/** Competence in this job: a point lower outside their field. */
export function competenceIn(c: Candidate, role: string): number {
  return Math.max(1, c.competence - (fits(c, role) ? 0 : 1));
}

const patronName = (id: string) => TYCOON_BY_ID[id]?.short ?? PERSON_BY_ID[id]?.short ?? id;

/** Why this person will not take the job, if they will not. */
export function refusal(s: GameState, c: Candidate): string | null {
  if (c.integrity >= 4 && s.nation.integrity < 32) return 'Will not serve a government with this record on corruption.';
  if (c.competence >= 4 && approval(s) < 38 && (parseInt(c.id.replace(/\D/g, '') || '0', 10) % 2 === 0)) return 'Thinks the government is sinking, and will not go down with it.';
  const p = c.patron;
  const rel = s.tycoons[p]?.rel ?? s.people[p]?.rel;
  if (rel !== undefined && rel < 35) return `Their patron, ${patronName(p)}, has told them to stay away from your government.`;
  if ((s.wronged ?? []).some((w) => w.who === p && w.until > s.turn)) return `Their patron, ${patronName(p)}, has a grievance against you.`;
  return null;
}

export interface Offer { c: Candidate; fit: boolean; effective: number; refuses: string | null; shown: Candidate['rep'] }

/** Who could take this job now: those who fit first, then the best on paper. */
export function candidatesFor(s: GameState, role: string, n = 10): Offer[] {
  const t = talent(s);
  return t.pool.filter((c) => !t.taken.includes(c.id))
    .map((c) => ({ c, fit: fits(c, role), effective: competenceIn(c, role), refuses: refusal(s, c), shown: c.checked ? { competence: c.competence, loyalty: c.loyalty, integrity: c.integrity } : c.rep }))
    .sort((a, b) => Number(b.fit) - Number(a.fit) || b.shown.competence - a.shown.competence || b.shown.integrity - a.shown.integrity)
    .slice(0, n);
}

export function candidate(s: GameState, id: string): Candidate | undefined {
  return talent(s).pool.find((c) => c.id === id);
}

/** Take someone out of the pool: they are in a job now. */
export function take(s: GameState, id: string): void {
  const t = talent(s);
  if (!t.taken.includes(id)) t.taken.push(id);
}

/** Someone leaving a job goes back into the pool for a while, unless they were sacked in disgrace. */
export function release(s: GameState, name: string): void {
  const t = talent(s);
  const c = t.pool.find((x) => x.name === name);
  if (c) { t.taken = t.taken.filter((x) => x !== c.id); c.until = s.turn + 8; }
}

export const CHECK_PC = 2;
export const HUNT_PC = 3;

/** A background check: the truth about one person. */
export function check(s: GameState, id: string): string {
  const c = candidate(s, id);
  if (!c) return '';
  s.pc = clamp(s.pc - CHECK_PC, 0, 100);
  c.checked = true;
  const p = c.patron === 'president' ? 'answers to nobody but the job' : c.patron === 'self' ? 'is out for themselves' : `is close to ${patronName(c.patron)}`;
  return `The background check on ${c.name} is back: competence ${c.competence}, loyalty ${c.loyalty}, integrity ${c.integrity}, and ${p}.`;
}

/** Headhunting: three more people in the field this job wants, at least one of them strong. */
export function headhunt(s: GameState, role: string): string {
  const t = talent(s);
  s.pc = clamp(s.pc - HUNT_PC, 0, 100);
  const specs = ROLE_SPECS[role] ?? ROLE_SPECS.asset;
  const found = [generate(s, t, specs[0], 4), generate(s, t, specs[specs.length - 1], 3), generate(s, t, specs[0], 2)];
  t.pool.push(...found);
  return `The search turns up ${found.map((c) => c.name).join(', ')}: ${SPEC_NAME[specs[0]]}s, available now.`;
}

export const specName = (c: Candidate) => SPEC_NAME[c.spec];
export const patronLabel = (c: Candidate) => (c.patron === 'president' ? 'nobody' : c.patron === 'self' ? 'themselves' : patronName(c.patron));
