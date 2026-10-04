// The Supreme Court: seven seats, each with a lean and a retirement date. The
// President fills vacancies, subject to the Senate. The bench decides the election
// petition, hears challenges to orders that hit someone hard, and can freeze a
// reform with an injunction. A bench packed with loyalists lets the President do
// more and costs the country's trust; packing it is remembered.

import { BENCH, NOMINEES, type Lean, type NomineeDef } from '../content/courts';
import { NAMES_BY_ZONE } from '../content/talent';
import { MILESTONE_BY_ID, ORDER_BY_ID } from '../content/agenda';
import { diff, snapshot } from './effects';
import { rand } from './rng';
import { aimFx, targetName, type TargetKind } from './targets';
import type { Fx, GameState } from './types';
import { applyFx, clamp, registerBench, senate } from './vars';

export interface Justice { name: string; short: string; lean: Lean; integrity: number; retires: number; chief?: boolean; mine?: boolean; blurb: string }
export interface Bench { seats: (Justice | null)[]; packed: number; spent: string[]; extra?: NomineeDef[]; seq?: number }

export const NOMINATE_PC = 3;

const seed = (s: GameState): Bench => ({ seats: BENCH.map((b) => ({ ...b, retires: b.retires + Math.max(0, s.turn - 1) })), packed: 0, spent: [] });

/** The bench as it stands. Reading does not change the state; the monthly tick seeds it in older saves. */
export function bench(s: GameState): Bench {
  return s.bench ?? seed(s);
}

const seated = (s: GameState) => bench(s).seats.filter((j): j is Justice => !!j);
/** How a justice votes on a case the President would rather win. */
function vote(j: Justice): number {
  if (j.lean === 'you') return 1;
  if (j.lean === 'them') return -1;
  return j.integrity >= 3 ? -1 : 0;
}

export function benchVars(s: GameState): Record<string, number> {
  const js = seated(s);
  return {
    loyal: js.filter((j) => j.lean === 'you').length,
    honest: js.filter((j) => j.lean !== 'you' && j.integrity >= 3).length,
    hostile: js.filter((j) => j.lean === 'them').length,
    bought: js.filter((j) => j.lean !== 'you' && j.integrity <= 2).length,
    vacant: bench(s).seats.filter((j) => !j).length,
    packed: bench(s).packed,
  };
}

// The named nominees run out; the Court of Appeal does not. Each new name is drawn
// from its own seeded sequence, so it is the same in every replay of the game.
const MIN_CHOICE = 5;
const ZONE_IDS = ['NW', 'NE', 'NC', 'SW', 'SE', 'SS'] as const;
const BLURBS = {
  free: [
    'Fifteen years on the Court of Appeal. Writes plainly and is rarely reversed.',
    'A former law faculty dean. Has views on the constitution and has published them.',
    'Known for long hours and short judgments. Nobody has found the price.',
    'Came up through the state high courts. Careful, and careful to be seen as careful.',
  ],
  freeWeak: [
    'Respected on paper. Lawyers who appear before the court say the paper is not the whole story.',
    'Has never written a dissent. Some call it collegiality.',
  ],
  you: [
    'Was at law school with you and has stayed in touch. The Senate knows.',
    'Recommended by your Attorney General, who describes the nominee as "sound".',
  ],
  youWeak: [
    'Recommended by the party\'s legal committee. Rules the way the committee would.',
    'Owes the appointment to the party and has said so at a fundraiser.',
  ],
};

function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

function newNominee(s: GameState, b: Bench): NomineeDef {
  b.seq = (b.seq ?? 0) + 1;
  const r = prng((s.seed ?? 1) * 4099 + b.seq * 92821);
  const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(r() * xs.length)];
  const bank = NAMES_BY_ZONE[pick(ZONE_IDS)];
  const female = r() < 0.4;
  const taken = new Set([...NOMINEES.map((n) => n.name), ...(b.extra ?? []).map((n) => n.name), ...b.seats.map((j) => j?.name)]);
  let first = pick(female ? bank.f : bank.m), last = pick(bank.last);
  for (let i = 0; i < 6 && taken.has(`Justice ${first} ${last}`); i++) { first = pick(female ? bank.f : bank.m); last = pick(bank.last); }
  const lean: Lean = r() < 0.3 ? 'you' : 'free';
  const x = r();
  const integrity = x < 0.1 ? 1 : x < 0.3 ? 2 : x < 0.65 ? 3 : x < 0.9 ? 4 : 5;
  const weak = integrity <= 2;
  const blurb = pick(lean === 'you' ? (weak ? BLURBS.youWeak : BLURBS.you) : (weak ? BLURBS.freeWeak : BLURBS.free));
  // A friend of the President must get past the Senate; an honest friend is the hardest sell.
  const senate = lean === 'you' ? 40 + 5 * integrity : 0;
  const fx: [string, number][] = lean === 'you'
    ? (weak ? [['bloc.party', 3], ['bloc.press', -4], ['nation.integrity', -2]] : [['bloc.press', -2]])
    : integrity >= 4 ? [['bloc.press', 2], ['nation.integrity', 1]] : weak ? [] : [['bloc.establishment', 1]];
  return { name: `Justice ${first} ${last}`, short: last, lean, integrity, senate, fx, blurb };
}

/** The named nominees who are friends of the President are this President's friends, not the next one's. */
const named = (s: GameState) => NOMINEES.filter((n) => !(s.predecessor && n.lean === 'you'));

/** Keeps at least five people who could be nominated. */
function topUp(s: GameState, b: Bench): void {
  const sitting = new Set(b.seats.map((j) => j?.name));
  const free = () => [...named(s), ...(b.extra ?? [])].filter((n) => !b.spent.includes(n.name) && !sitting.has(n.name)).length;
  while (free() < MIN_CHOICE) (b.extra ??= []).push(newNominee(s, b));
}

/** Who can be nominated now, and whether the Senate would confirm them. */
export function nominees(s: GameState) {
  const b = bench(s);
  const sitting = new Set(b.seats.map((j) => j?.name));
  return [...named(s), ...(b.extra ?? [])].filter((n) => !b.spent.includes(n.name) && !sitting.has(n.name)).map((n) => {
    const sen = senate(s);
    return { ...n, confirms: sen >= n.senate, why: n.senate ? `The Senate confirms with support of ${n.senate} or better (now ${Math.round(sen)}).` : 'The Senate will confirm without a fight.' };
  });
}

export function canNominate(s: GameState, seat: number, name: string, movesLeft: number): { ok: boolean; reason?: string } {
  const b = bench(s);
  if (b.seats[seat] !== null) return { ok: false, reason: 'The seat is filled.' };
  if (!nominees(s).some((n) => n.name === name)) return { ok: false, reason: 'Not available.' };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < NOMINATE_PC) return { ok: false, reason: `Needs ${NOMINATE_PC} political capital.` };
  return { ok: true };
}

export function nominate(s: GameState, seat: number, name: string): string {
  const b = (s.bench ??= seed(s));
  const n = nominees(s).find((x) => x.name === name)!;
  s.pc = clamp(s.pc - NOMINATE_PC, 0, 100);
  b.spent.push(n.name);
  if (!n.confirms) {
    applyFx(s, ['pc', -3]);
    s.news.push({ chronicle: `SENATE REJECTS ${n.short.toUpperCase()} FOR SUPREME COURT`, street: `SENATE NO GREE FOR ${n.short.toUpperCase()}`, weight: 4, valence: -1, topic: 'politics', body: `${n.name} was rejected after a day of hearings. The seat stays empty.` });
    topUp(s, b);
    return `The Senate rejects ${n.name}. The seat stays empty, and you have spent capital to be refused.`;
  }
  for (const f of n.fx) applyFx(s, f as Fx);
  b.seats[seat] = { name: n.name, short: n.short, lean: n.lean, integrity: n.integrity, blurb: n.blurb, retires: s.turn + 120, mine: true };
  topUp(s, b);
  if (n.lean === 'you') {
    b.packed += 1;
    if (b.packed === 3) {
      applyFx(s, ['nation.integrity', -4]);
      applyFx(s, ['bloc.press', -5]);
      s.flags['bench.packed'] = true;
      s.news.push({ chronicle: 'THIRD LOYALIST ON THE SUPREME COURT: "THE BENCH IS PACKED"', street: 'PRESIDENT DON FILL COURT WITH IM PEOPLE', weight: 7, valence: -1, topic: 'politics', body: 'Three of the seven justices now owe their seats and their sympathies to the President. The Bar has called an emergency meeting.' });
    }
  }
  s.news.push({ chronicle: `${n.short.toUpperCase()} CONFIRMED TO SUPREME COURT`, street: `${n.short.toUpperCase()} DON ENTER SUPREME COURT`, weight: 3, valence: 0, topic: 'politics', body: `${n.name} is sworn in. ${n.blurb}` });
  return `${n.name} is confirmed and sworn in.${n.lean === 'you' ? ' The court now leans a little more your way, and everyone can count.' : ''}`;
}

/** How a challenge to this order would go before the bench as it stands. */
export function forecastChallenge(s: GameState): { against: number; for: number; unsure: number } {
  const v = seated(s).map(vote);
  return { against: v.filter((x) => x < 0).length, for: v.filter((x) => x > 0).length, unsure: v.filter((x) => x === 0).length };
}

/** A reform someone powerful loses from: it can be frozen by a court that someone powerful can reach. */
export function contested(id: string): boolean {
  const m = MILESTONE_BY_ID[id]?.m;
  return !!m?.start?.some(([t, v]) => v < 0 && (t === 'bloc.establishment' || t.startsWith('tycoon.') || t.startsWith('person.gov')));
}

export function courtTick(s: GameState): void {
  const b = (s.bench ??= seed(s));
  topUp(s, b);
  // Empty seats are noticed: after four months the backlog is news, and lawyers and investors grumble every month.
  const vacant = b.seats.filter((j) => !j).length;
  s.counters['bench.empty'] = vacant ? (s.counters['bench.empty'] ?? 0) + 1 : 0;
  if (vacant && (s.counters['bench.empty'] ?? 0) > 4) {
    applyFx(s, ['bloc.establishment', -0.04 * vacant]);
    if ((s.counters['bench.empty'] ?? 0) === 5) {
      s.news.push({ chronicle: `SUPREME COURT ${vacant} JUSTICE${vacant === 1 ? '' : 'S'} SHORT; APPEALS BACKLOG GROWS`, street: 'SUPREME COURT NO GET ENOUGH JUDGE. CASES DEY WAIT', weight: 3, valence: -1, topic: 'politics', body: `The Bar Association has written to the President about the empty seats. Commercial appeals are now listed for hearing in three years.` });
    }
  }
  // Retirements.
  b.seats.forEach((j, i) => {
    if (!j || j.retires > s.turn) return;
    b.seats[i] = null;
    s.news.push({ chronicle: `JUSTICE ${j.short.toUpperCase()} RETIRES FROM THE SUPREME COURT`, street: `ONE SUPREME COURT JUDGE DON RETIRE`, weight: 3, valence: 0, topic: 'politics', body: `${j.name} retires. The President nominates the replacement; the Senate confirms.` });
    s.report.push({ kind: 'consequence', title: 'A seat on the Supreme Court is vacant', cause: j.name, text: `${j.name} has retired. Nominate a replacement from the Courts tab under Politics. Whoever you choose will sit long after you leave.`, changes: [] });
  });

  // Challenges to last month's hostile orders.
  const js = seated(s);
  for (const o of (s.orderLog ?? []).filter((x) => x.turn === s.turn - 1)) {
    const def = ORDER_BY_ID[o.id];
    if (!def || (def.hostile ?? 0) < 3 || !o.target || !def.target) continue;
    const votes = js.map((j) => (vote(j) === 0 ? (rand(s) < 0.5 ? 1 : -1) : vote(j)));
    const against = votes.filter((x) => x < 0).length;
    const forYou = votes.filter((x) => x > 0).length;
    const who = targetName(s, def.target as TargetKind, o.target).name;
    const before = snapshot(s);
    if (against > forYou) {
      // Half of what landed on the target is undone.
      const undo = aimFx(s, def.target as TargetKind, o.target, def.fx ?? []).filter(([t]) => t.startsWith('person.') || t.startsWith('tycoon.') || t.startsWith('rival.')).map(([t, v]) => [t, -v / 2] as Fx);
      for (const f of undo) applyFx(s, f);
      applyFx(s, ['pc', -3]);
      applyFx(s, ['bloc.press', 2]);
      s.counters.struck = (s.counters.struck ?? 0) + 1;
      s.news.push({ chronicle: `SUPREME COURT VOIDS ORDER AGAINST ${who.toUpperCase()}, ${against}–${forYou}`, street: `COURT SAY WETIN PRESIDENT DO ${who.toUpperCase()} NO LEGAL`, weight: 6, valence: -1, topic: 'politics', body: `${who} challenged the order and won. The court\'s judgment calls it "an exercise of power in search of a law".` });
      s.report.push({ kind: 'consequence', title: `Struck down: ${def.name}`, cause: 'The Supreme Court', text: `${who} went to court and won, ${against} to ${forYou}. Half the damage is undone and you look like a President who loses in court.`, changes: diff(before, snapshot(s)) });
    } else {
      s.report.push({ kind: 'consequence', title: `Upheld: ${def.name}`, cause: 'The Supreme Court', text: `${who} challenged the order and lost, ${forYou} to ${against}.${benchVars(s).loyal >= 3 ? ' The bench you built held.' : ''}`, changes: [] });
    }
  }

  // Injunctions: a justice who can be reached freezes a reform for someone who loses from it.
  const reachable = js.filter((j) => j.lean !== 'you' && (j.lean === 'them' || j.integrity <= 2)).length;
  for (const a of s.agenda.active) {
    if (!contested(a.id) || s.counters[`injunct.${a.id}`] !== undefined) continue;
    if (rand(s) >= 0.03 * reachable) continue;
    s.counters[`injunct.${a.id}`] = s.turn;
    s.counters.injunctions = (s.counters.injunctions ?? 0) + 1;
    const m = MILESTONE_BY_ID[a.id].m;
    a.progress = Math.max(0, a.progress - (100 / m.months) * 3);
    s.news.push({ chronicle: `COURT FREEZES ${m.name.toUpperCase()}`, street: 'COURT DON STOP THE REFORM FOR NOW', weight: 5, valence: -1, topic: 'reform', body: 'An interim injunction, granted on an application filed by people who stand to lose from it, halts the work for three months.' });
    s.report.push({ kind: 'consequence', title: `Injunction: ${m.name}`, cause: 'The Supreme Court', text: `Someone who loses from it found a justice willing to listen. Three months of work are lost. ${reachable} of the seated justices can be reached like this; replace them as they retire and this stops.`, changes: [] });
  }
}

registerBench(benchVars);
