// Cases. When someone is charged, the charge does not end with the headline: it
// becomes a case that goes to trial and ends in a verdict, months later. What
// decides it is shown: the courts, the agency and its chief, the prosecutor, how
// clean the government is, how powerful the accused is, and whether the bench can
// be reached. The President can stand behind a case or lean on it.

import { midName } from './text';
import { hasCapability } from './recruitment';
import { NAMES } from '../content/names';
import { PERSON_BY_ID } from '../content/people';
import { addExposure } from './archive';
import { who } from './favours';
import { benchVars as benchOf } from './courts';
import { rand } from './rng';
import type { GameState } from './types';
import { applyFx, clamp } from './vars';

export type Case = NonNullable<GameState['cases']>[number];
export interface OddsLine { label: string; value: number }

const BACK_PC = 3;
/** Months from charge to the opening of the trial. */
const TO_TRIAL = 3;

const graft = (s: GameState) => (s.institutions ?? []).find((i) => i.id === 'graft');

export function cases(s: GameState): Case[] {
  return s.cases ?? [];
}

export function openCases(s: GameState): Case[] {
  return cases(s).filter((c) => !c.outcome);
}

/** How long the trial runs once it opens. */
export function trialLength(s: GameState): number {
  const base = s.agenda.done.includes('c2') ? 7 : 14;
  // Courts that are digitised and run by managers move faster.
  return Math.max(4, Math.round(base * (s.agenda.done.includes('j2') ? 0.8 : 1) * (s.agenda.done.includes('j6') ? 0.85 : 1) * (hasCapability(s, 'cap.complex_prosecution') ? 0.7 : 1)));
}

/** Who is prosecuting, in a phrase. */
export function prosecutor(s: GameState): string {
  const g = graft(s);
  if (g) return `the anti-corruption agency, under ${midName(g.head.name)}`;
  return s.agenda.done.includes('c4') ? 'the independent prosecutor' : 'the Attorney General\'s office';
}

/** The chance of a conviction, and everything that moves it. */
export function convictionOdds(s: GameState, c: Case): { p: number; lines: OddsLine[] } {
  const lines: OddsLine[] = [{ label: 'An ordinary case in an ordinary court', value: 0.3 }];
  const add = (label: string, value: number) => { if (Math.abs(value) >= 0.01) lines.push({ label, value }); };
  if (s.agenda.done.includes('c2')) add('Anti-corruption courts with time limits', 0.2);
  if (hasCapability(s, 'cap.complex_prosecution')) add('The complex-prosecution specialist builds evidence that survives appeal', 0.15);
  if (s.counters['graft.trustLost']) add('Public interference damaged trust in the prosecution service', -Math.min(0.12, s.counters['graft.trustLost'] * 0.03));
  const g = graft(s);
  if (g) {
    const honest = g.head.integrity >= 3 && !(g.head.patron !== 'president' && g.head.loyalty <= 3);
    add(honest ? `An agency chief who cannot be bought (${midName(g.head.name)})` : `An agency chief who serves someone else (${midName(g.head.name)})`, honest ? 0.15 : -0.15);
    if (s.flags['graft.leash']) add('The agency has learned that some files come back', -0.1);
  }
  if (s.agenda.done.includes('c4')) add('An independent prosecutor', 0.1);
  if (s.agenda.done.includes('s8')) add('A national forensic network', 0.08);
  if (s.agenda.done.includes('s9')) add('Witnesses who are protected', 0.06);
  if (s.agenda.done.includes('j9')) add('Digital and forensic evidence admissible', 0.06);
  add(`Integrity in government: ${Math.round(s.nation.integrity)}`, (s.nation.integrity - 35) * 0.005);
  const clout = PERSON_BY_ID[c.who]?.clout ?? (c.who === 'pred' ? 5 : 3);
  add(`${c.name} has friends: clout ${clout}`, -0.04 * clout);
  if (c.backed) add('You stood behind the case in public', 0.08);
  const bench = benchOf(s);
  if ((bench.bought ?? 0) >= 1 && !s.agenda.done.includes('j7')) add('Some of the judges can be reached, by either side', -0.1);
  return { p: clamp(lines.reduce((a, l) => a + l.value, 0), 0.05, 0.9), lines };
}

/** Opens a case. `who` is a person, a character such as the Finance Minister, or 'pred' for the last President. */
export function charge(s: GameState, id: string, what: string, recover: number): void {
  const name = id === 'pred' ? (s.predecessor?.name ?? 'Your predecessor') : id === 'special' ? NAMES.SPECIAL : who(s, id).name;
  if (openCases(s).some((c) => c.who === id && c.name === name)) return;
  const list = (s.cases ??= []);
  list.push({ id: `case${s.turn}-${list.length}`, who: id, name, what, opened: s.turn, stage: 'charged', months: 0, recover, by: graft(s) ? 'agency' : 'prosecutors' });
}

export function canBack(s: GameState, id: string): { ok: boolean; reason?: string } {
  const c = cases(s).find((x) => x.id === id);
  if (!c || c.outcome) return { ok: false };
  if (c.backed) return { ok: false, reason: 'You have already said so.' };
  if (s.pc < BACK_PC) return { ok: false, reason: `Needs ${BACK_PC} political capital.` };
  return { ok: true };
}

/** Say in public that the case has the President's support. */
export function backCase(s: GameState, id: string): string {
  const c = cases(s).find((x) => x.id === id)!;
  c.backed = true;
  s.pc = clamp(s.pc - BACK_PC, 0, 100);
  applyFx(s, ['bloc.press', 2]);
  applyFx(s, ['bloc.party', -2]);
  if (PERSON_BY_ID[c.who]) applyFx(s, [`person.${c.who}`, -8]);
  return `You say, on the record, that the case against ${c.name} will be followed to the end. The prosecutors hear it; so do ${c.name}'s friends.`;
}

export function canDrop(s: GameState, id: string): { ok: boolean; reason?: string } {
  const c = cases(s).find((x) => x.id === id);
  if (!c || c.outcome) return { ok: false };
  if (c.leaned) return { ok: false, reason: 'You have tried once. Trying again would be in writing.' };
  return { ok: true };
}

/** Lean on the prosecution. An honest agency chief may refuse, and say so. */
export function dropCase(s: GameState, id: string): string {
  const c = cases(s).find((x) => x.id === id)!;
  c.leaned = true;
  const g = graft(s);
  const honest = g && g.head.integrity >= 4;
  applyFx(s, ['nation.integrity', -2]);
  addExposure(s, { kind: 'tolerated', amount: 0, witnesses: ['cos'], trail: 2 }, '', `Leaned on the prosecution of ${c.name}.`);
  if (honest && rand(s) < 0.6) {
    applyFx(s, ['pressure.scandalHeat', 10]);
    applyFx(s, ['bloc.press', -4]);
    s.news.push({ chronicle: `ANTI-GRAFT CHIEF REFUSES VILLA REQUEST TO DROP ${c.name.toUpperCase()} CASE`, street: 'VILLA TALK SAY MAKE DEM DROP CASE. CHIEF SAY NO', weight: 7, valence: -1, topic: 'scandal', body: `${g!.head.name} declined, in writing, and the letter reached the press.` });
    return `${g!.head.name} refuses, in writing. The case goes on, and the letter is in tomorrow's papers.`;
  }
  c.outcome = 'dropped';
  c.closed = s.turn;
  if (PERSON_BY_ID[c.who]) applyFx(s, [`person.${c.who}`, 12]);
  s.news.push({ chronicle: `PROSECUTION OF ${c.name.toUpperCase()} WITHDRAWN`, street: `${c.name.toUpperCase()} CASE DON DIE`, weight: 5, valence: -1, topic: 'scandal', body: 'The prosecution filed a notice of discontinuance without explanation.' });
  return `The prosecution files a notice of discontinuance. ${c.name} is grateful, and knows why.`;
}

/** Every month: cases move towards trial and verdict. */
export function caseTick(s: GameState): void {
  for (const c of openCases(s)) {
    c.months++;
    if (c.stage === 'charged' && c.months >= TO_TRIAL) {
      c.stage = 'trial';
      c.trialFrom = s.turn;
      s.news.push({ chronicle: `TRIAL OF ${c.name.toUpperCase()} OPENS`, street: `${c.name.toUpperCase()} DON ENTER DOCK`, weight: 3, valence: 0, topic: 'scandal', body: `${c.what}. Prosecuted by ${prosecutor(s)}.` });
      continue;
    }
    if (c.stage !== 'trial') continue;
    // The powerful sometimes leave before the verdict.
    const clout = PERSON_BY_ID[c.who]?.clout ?? 3;
    if (clout >= 4 && rand(s) < 0.015 * clout) {
      c.outcome = 'fled';
      c.closed = s.turn;
      if (hasCapability(s, 'cap.complex_prosecution') && c.recover > 0 && !c.traced) {
        const amount = c.recover * 0.25;
        c.traced = { at: s.turn, amount }; c.recover -= amount;
        // A recorded recovery is money, not a bounded national score.
        s.nation.fiscalSpace += amount;
        s.report.push({ kind: 'consequence', title: `${c.name}: assets traced abroad`, text: `The specialist recovered ₦${(amount * 1000).toFixed(1)}bn abroad, one quarter of the case's recorded recoverable assets. The remainder has not been recovered.`, changes: [] });
      }
      applyFx(s, ['nation.integrity', -1]);
      s.news.push({ chronicle: `${c.name.toUpperCase()} JUMPS BAIL, LEAVES THE COUNTRY`, street: `${c.name.toUpperCase()} DON JAPA`, weight: 6, valence: -1, topic: 'scandal', body: 'The passport had been surrendered. A second one had not.' });
      s.report.push({ kind: 'failure', title: `${c.name} fled before the verdict`, cause: c.what, text: 'Bail was granted on a surety nobody checked. The case is open and the accused is abroad.', changes: [] });
      continue;
    }
    if (s.turn - (c.trialFrom ?? s.turn) < trialLength(s)) continue;
    const { p } = convictionOdds(s, c);
    const guilty = rand(s) < p;
    c.outcome = guilty ? 'convicted' : 'acquitted';
    c.closed = s.turn;
    if (guilty) {
      applyFx(s, ['nation.integrity', 2.5]);
      applyFx(s, ['bloc.press', 3]);
      applyFx(s, ['pressure.scandalHeat', -5]);
      if (c.recover) applyFx(s, ['nation.fiscalSpace', c.recover]);
      if (PERSON_BY_ID[c.who]) applyFx(s, [`person.${c.who}`, -20]);
      s.counters['cases.convicted'] = (s.counters['cases.convicted'] ?? 0) + 1;
    } else {
      applyFx(s, ['nation.integrity', -1.5]);
      applyFx(s, ['bloc.press', -2]);
    }
    s.news.push(guilty
      ? { chronicle: `${c.name.toUpperCase()} CONVICTED`, street: `${c.name.toUpperCase()} DON LOSE. PRISON DEY WAIT`, weight: 7, valence: 1, topic: 'scandal', body: `${c.what}. The court found the case proved.${c.recover ? ` ₦${Math.round(c.recover * 1000)}bn is forfeited to the treasury.` : ''}` }
      : { chronicle: `${c.name.toUpperCase()} ACQUITTED`, street: `${c.name.toUpperCase()} DON WALK FREE`, weight: 6, valence: -1, topic: 'scandal', body: `${c.what}. The court found the evidence insufficient.` });
    s.report.push({
      kind: guilty ? 'reform' : 'failure', title: `${c.name}: ${guilty ? 'convicted' : 'acquitted'}`, cause: c.what,
      text: `After ${c.months} months the court ${guilty ? 'convicted' : 'acquitted'}. The odds on the day were ${Math.round(p * 100)}%.`, changes: [],
    });
  }
}
