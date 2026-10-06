// THE TAX SYSTEM AND SPENDING DISCIPLINE (plan 10)
// Two scores, worked out each month from their causes so they can be traced
// and can slip back when a reform is undone.
//
// The tax base: how much of what is owed is assessed and collected. It rises
// with the taxation reforms, a capable state and a competent Finance Minister.
// Every tax has a burden (someone who pays it and feels it each month) and some
// cost to administer.
//
// Spending discipline: whether collected money reaches what it was budgeted
// for. It rises with the Treasury reforms and the Finance Minister.
// Discipline makes releases predictable, cuts what is stolen in buying, slows
// contractor arrears and makes market borrowing cheaper. Without it, part of
// whatever the tax reforms collect is lost between the account and the project.
//
// Kept free of treasury.ts and reduce.ts so both can read it.

import { MILESTONE_BY_ID } from '../content/agenda';
import { BURDEN, FISCAL_PROFILE, type Burden } from '../content/tracks-fiscal';
import type { GameState } from './types';
import { applyFx, registerFiscal } from './vars';

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
export const BASE_START = 28;
export const DISCIPLINE_START = 30;

export interface ScoreLine { label: string; value: number }

const finComp = (s: GameState) => s.chars?.fin?.competence ?? 3;
const delivered = (s: GameState) => s.agenda.done.filter((id) => FISCAL_PROFILE[id]);

/** The tax base, 0–100, and what it is made of. */
export function taxBase(s: GameState): { v: number; lines: ScoreLine[] } {
  const lines: ScoreLine[] = [{ label: 'Where the country started', value: BASE_START }];
  for (const id of delivered(s)) { const b = FISCAL_PROFILE[id].base; if (b) lines.push({ label: MILESTONE_BY_ID[id]?.m.name ?? id, value: b }); }
  const cap = Math.round((s.nation.capacity - 34) * 0.25);
  if (cap) lines.push({ label: 'A state that can find and assess people', value: cap });
  const fin = (finComp(s) - 3) * 3;
  if (fin) lines.push({ label: 'The Finance Minister', value: fin });
  return { v: clamp(lines.reduce((a, l) => a + l.value, 0), 0, 100), lines };
}

/** Spending discipline, 0–100, and what it is made of. */
export function discipline(s: GameState): { v: number; lines: ScoreLine[] } {
  const lines: ScoreLine[] = [{ label: 'Where the country started', value: DISCIPLINE_START }];
  for (const id of delivered(s)) { const d = FISCAL_PROFILE[id].discipline; if (d) lines.push({ label: MILESTONE_BY_ID[id]?.m.name ?? id, value: d }); }
  // Integrity already counts through what is stolen (the leakage line); discipline is about the system.
  const fin = (finComp(s) - 3) * 3;
  if (fin) lines.push({ label: 'The Finance Minister', value: fin });
  return { v: clamp(lines.reduce((a, l) => a + l.value, 0), 0, 100), lines };
}

/** What the taxation reforms in force raise each month, ₦tn (their lasting revenue). */
export function taxRaised(s: GameState): number {
  return delivered(s).filter((id) => FISCAL_PROFILE[id].base).reduce((a, id) => {
    const m = MILESTONE_BY_ID[id]?.m;
    return a + Math.max(0, (m?.done ?? []).filter(([p]) => p === 'bonus.fiscal').reduce((x, [, v]) => x + v, 0));
  }, 0);
}

/** The share of newly collected tax lost before it is spent, at this discipline. */
export const lostShare = (s: GameState) => clamp((55 - discipline(s).v) / 100, 0, 0.3);

/** Monthly lines for the Treasury's books. */
export function fiscalSystemLines(s: GameState): { label: string; value: number; hint: string }[] {
  const out: { label: string; value: number; hint: string }[] = [];
  const admin = delivered(s).reduce((a, id) => a + (FISCAL_PROFILE[id].admin ?? 0), 0);
  if (admin) out.push({ label: 'Running the tax administration', value: -admin, hint: 'Inspectors, registers and systems for the taxes now in force.' });
  const lost = taxRaised(s) * lostShare(s);
  if (lost >= 0.0005) out.push({ label: 'Collected, then lost in spending', value: -lost, hint: `Spending discipline is ${Math.round(discipline(s).v)}: about ${Math.round(lostShare(s) * 100)}% of what the new taxes raise is lost between the account and the project. The Treasury reforms close the gap.` });
  // The Finance Minister's own effect is already a line of its own; this is what the Treasury reforms built.
  const d = delivered(s).reduce((a, id) => a + (FISCAL_PROFILE[id].discipline ?? 0), 0);
  if (d >= 1) out.push({ label: 'Spending discipline', value: d * 0.0006, hint: 'Less is lost in buying, and less is paid twice, under the Treasury reforms in force.' });
  return out;
}

/** How much more (or less) of a budgeted increase reaches the ministries. */
export const releaseFactor = (s: GameState) => clamp(0.9 + discipline(s).v / 300, 0.85, 1.2);
/** How fast a cash shortfall becomes contractor arrears. */
export const arrearsFactor = (s: GameState) => clamp(1.3 - discipline(s).v / 100, 0.5, 1.3);
/** The discount lenders give a disciplined treasury on market borrowing. Below the starting discipline they charge what they always charged. */
export const lenderFactor = (s: GameState) => 1 - clamp((discipline(s).v - DISCIPLINE_START) / 500, 0, 0.14);

/** Who is paying the taxes in force, with how many taxes each. */
export function burdens(s: GameState): { burden: Burden; label: string; who: string; taxes: string[] }[] {
  const by = new Map<Burden, string[]>();
  for (const id of delivered(s)) { const b = FISCAL_PROFILE[id].burden; if (b) by.set(b, [...(by.get(b) ?? []), MILESTONE_BY_ID[id]?.m.name ?? id]); }
  return [...by.entries()].map(([burden, taxes]) => ({ burden, label: BURDEN[burden].label, who: BURDEN[burden].who, taxes }));
}

/** Monthly: the people who pay each tax feel it. */
export function fiscalSystemTick(s: GameState): void {
  for (const b of burdens(s)) for (const [path, v] of BURDEN[b.burden].fx) applyFx(s, [path, v * b.taxes.length]);
  // Lenders price the treasury they see: read by the interest rate on market debt.
  s.counters['fiscal.lender'] = Math.round(lenderFactor(s) * 1000) / 1000;
}

registerFiscal((s, what) => (what === 'base' ? taxBase(s).v : what === 'discipline' ? discipline(s).v : 0));

export type FiscalCondition = 'strong' | 'collects-but-leaks' | 'disciplined-but-narrow' | 'weak';

/** Which of the four conditions the public finances are in. */
export function fiscalCondition(s: GameState): { id: FiscalCondition; text: string } {
  const b = taxBase(s).v, d = discipline(s).v;
  if (b >= 50 && d >= 55) return { id: 'strong', text: 'A broad tax base, and a treasury that spends what it collects on what it budgeted.' };
  if (b >= 50) return { id: 'collects-but-leaks', text: `The state collects well and spends badly: part of what the new taxes raise is lost before it reaches a project${d < DISCIPLINE_START ? ', releases are erratic and arrears build' : ''}. The Treasury reforms close the gap.` };
  if (d >= 55) return { id: 'disciplined-but-narrow', text: 'The treasury is disciplined and believed, and runs on very little: the tax base is narrow, so oil still decides what can be afforded.' };
  return { id: 'weak', text: 'A narrow tax base and loose spending: the state collects little and loses part of what it spends.' };
}
