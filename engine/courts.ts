// The Supreme Court: seven seats, each with a lean and a retirement date. The
// President fills vacancies, subject to the Senate. The bench decides the election
// petition, hears challenges to orders that hit someone hard, and can freeze a
// reform with an injunction. A bench packed with loyalists lets the President do
// more and costs the country's trust; packing it is remembered.

import { BENCH, NOMINEES, type Lean } from '../content/courts';
import { MILESTONE_BY_ID, ORDER_BY_ID } from '../content/agenda';
import { diff, snapshot } from './effects';
import { rand } from './rng';
import { aimFx, targetName, type TargetKind } from './targets';
import type { Fx, GameState } from './types';
import { applyFx, clamp, registerBench, senate } from './vars';

export interface Justice { name: string; short: string; lean: Lean; integrity: number; retires: number; chief?: boolean; mine?: boolean; blurb: string }
export interface Bench { seats: (Justice | null)[]; packed: number; spent: string[] }

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

/** Who can be nominated now, and whether the Senate would confirm them. */
export function nominees(s: GameState) {
  const b = bench(s);
  const sitting = new Set(b.seats.map((j) => j?.name));
  return NOMINEES.filter((n) => !b.spent.includes(n.name) && !sitting.has(n.name)).map((n) => {
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
    return `The Senate rejects ${n.name}. The seat stays empty, and you have spent capital to be refused.`;
  }
  for (const f of n.fx) applyFx(s, f as Fx);
  b.seats[seat] = { name: n.name, short: n.short, lean: n.lean, integrity: n.integrity, blurb: n.blurb, retires: s.turn + 120, mine: true };
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
    const m = MILESTONE_BY_ID[a.id].m;
    a.progress = Math.max(0, a.progress - (100 / m.months) * 3);
    s.news.push({ chronicle: `COURT FREEZES ${m.name.toUpperCase()}`, street: 'COURT DON STOP THE REFORM FOR NOW', weight: 5, valence: -1, topic: 'reform', body: 'An interim injunction, granted on an application filed by people who stand to lose from it, halts the work for three months.' });
    s.report.push({ kind: 'consequence', title: `Injunction: ${m.name}`, cause: 'The Supreme Court', text: `Someone who loses from it found a justice willing to listen. Three months of work are lost. ${reachable} of the seated justices can be reached like this; replace them as they retire and this stops.`, changes: [] });
  }
}

registerBench(benchVars);
