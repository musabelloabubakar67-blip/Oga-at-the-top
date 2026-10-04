// What is coming: the things that will bite in the next few months, gathered
// from every system so the player does not have to open each screen to find them.

import { MILESTONE_BY_ID, ORDER_BY_ID } from '../content/agenda';
import { PEOPLE } from '../content/people';
import { CFG, termTurnOf } from './config';
import { bench, benchVars, contested } from './courts';
import { activeShocks } from './shocks';
import { convictionOdds, openCases, trialLength } from './cases';
import { grievances, targetName, type TargetKind } from './targets';
import type { GameState } from './types';
import { who } from './favours';
import { canSupplementary } from './treasury';

export type Section = 'desk' | 'orders' | 'reforms' | 'power' | 'country' | 'treasury';
export interface Coming { months: number; text: string; tone: 'bad' | 'good' | 'neutral'; go: Section; tab?: string }

export function upcoming(s: GameState): Coming[] {
  const out: Coming[] = [];
  const tt = termTurnOf(s.turn);

  // The calendar.
  const toElection = CFG.electionTermTurn - tt;
  if (s.term === 1 && toElection > 0 && toElection <= 12) out.push({ months: toElection, text: `The election in ${toElection} ${toElection === 1 ? 'month' : 'months'}`, tone: 'neutral', go: 'country' });
  if (s.term === 2 && tt >= 12 && tt < 34 && !s.flags['succession.backed']) out.push({ months: 34 - tt, text: `The party picks its candidate in ${34 - tt} months: groom a successor`, tone: 'neutral', go: 'power', tab: 'succession' });
  for (const c of openCases(s)) {
    const left = c.stage === 'charged' ? 3 - c.months + trialLength(s) : Math.max(1, trialLength(s) - (s.turn - (c.trialFrom ?? s.turn)));
    if (left <= 4) out.push({ months: left, text: `Verdict on ${c.name}: ${Math.round(convictionOdds(s, c).p * 100)}% to convict`, tone: 'neutral', go: 'power', tab: 'courts' });
  }
  if (s.budget.due) out.push({ months: 0, text: s.budget.pending ? 'The Assembly has sent back its version of the budget' : 'The budget is waiting to be signed', tone: 'bad', go: 'treasury' });
  if (canSupplementary(s).ok) out.push({ months: 0, text: `Oil is $${Math.round(Math.abs(s.oil.price - s.budget.benchmark))} ${s.oil.price > s.budget.benchmark ? 'above' : 'below'} the budget: a supplementary budget is possible`, tone: 'neutral', go: 'treasury' });

  // The naira.
  if (s.fx && s.fx.stance === 'peg' && s.fx.reserves < 14) out.push({ months: 1, text: `Reserves at $${s.fx.reserves.toFixed(1)}bn: the peg breaks below $5bn`, tone: 'bad', go: 'treasury' });
  if (s.fx && s.fx.parallel / s.fx.rate - 1 > 0.25) out.push({ months: 0, text: `The street pays ${Math.round((s.fx.parallel / s.fx.rate - 1) * 100)}% over the official rate`, tone: 'bad', go: 'treasury' });

  // The bench.
  const b = bench(s);
  b.seats.forEach((j) => {
    if (j && j.retires - s.turn <= 3 && j.retires - s.turn >= 0) out.push({ months: j.retires - s.turn, text: `${j.short} retires from the Supreme Court`, tone: 'neutral', go: 'power', tab: 'courts' });
  });
  const vacant = b.seats.filter((j) => !j).length;
  if (vacant) out.push({ months: 0, text: `${vacant === 1 ? 'A seat' : `${vacant} seats`} on the Supreme Court to fill`, tone: 'neutral', go: 'power', tab: 'courts' });
  const reach = benchVars(s).bought + benchVars(s).hostile;
  const exposed = s.agenda.active.filter((a) => contested(a.id) && s.counters[`injunct.${a.id}`] === undefined);
  if (reach && exposed.length) out.push({ months: 1, text: `${exposed.length === 1 ? MILESTONE_BY_ID[exposed[0].id].m.name : `${exposed.length} reforms`} could be frozen: ${Math.round(Math.min(1, 0.03 * reach) * 100)}% a month`, tone: 'bad', go: 'power', tab: 'courts' });

  // Hostile orders about to be challenged.
  for (const o of (s.orderLog ?? []).filter((x) => x.turn === s.turn)) {
    const d = ORDER_BY_ID[o.id];
    if (d && (d.hostile ?? 0) >= 3 && d.target && o.target) out.push({ months: 1, text: `${targetName(s, d.target as TargetKind, o.target).short} will challenge ${d.name.toLowerCase()} in court`, tone: 'bad', go: 'power', tab: 'courts' });
  }

  // Grudges ending, and grudges that bind.
  for (const w of s.wronged ?? []) {
    const left = w.until - s.turn;
    if (left > 0 && left <= 2) out.push({ months: left, text: `${who(s, w.who).short} stops holding a grudge`, tone: 'good', go: 'power' });
  }
  const bitter = PEOPLE.filter((p) => grievances(s, p.id).length >= 2);
  if (bitter.length) out.push({ months: 0, text: `${bitter.map((p) => who(s, p.id).short).join(', ')} ${bitter.length === 1 ? 'holds' : 'hold'} more than one grudge`, tone: 'bad', go: 'power' });

  // Shocks ending.
  for (const x of activeShocks(s)) out.push({ months: x.left, text: `${x.def.name}: ${x.left <= 1 ? 'the last month' : `${x.left} more months`}, ${Math.round(x.factor * 100)}% ${x.def.good ? 'caught' : 'felt'}`, tone: x.def.good ? 'good' : 'bad', go: 'desk' });

  // Reforms about to land.
  for (const a of s.agenda.active) {
    const m = MILESTONE_BY_ID[a.id]?.m;
    if (!m) continue;
    const months = Math.ceil(((100 - a.progress) / 100) * m.months);
    if (months <= 2) out.push({ months, text: `${m.name} ${m.needs ? 'goes to the Assembly' : 'is delivered'}`, tone: 'good', go: 'reforms' });
  }

  // Bets about to be decided.
  for (const v of s.ventures.active) if (v.progress >= 85) out.push({ months: 1, text: 'A big bet is about to open', tone: 'neutral', go: 'reforms' });

  return out.sort((a, b) => a.months - b.months).slice(0, 8);
}
