// What deserves the President's attention this month. Nothing new is measured here:
// the Chief of Staff sorts what every other system already knows into three things
// that can hurt the government, two openings, and the thing everyone is shouting
// about that probably does not matter. Each line leads to where it is dealt with.

import { ORDER_BY_ID } from '../content/agenda';
import { concerns } from './director';
import { who } from './favours';
import { canOrder } from './reduce';
import { fill } from './text';
import type { GameState, Topic } from './types';
import { upcoming, type Section } from './upcoming';
import { BLOCS, ZONES, favoursOwed, hardship } from './vars';

export interface Item { text: string; go: Section; tab?: string }
export interface Attention { hurt: Item[]; open: Item[]; noise: string | null }

const WORD: Record<Topic, string> = {
  prices: 'prices', money: 'money', power: 'electricity', security: 'security', politics: 'politics', scandal: 'a scandal',
  labour: 'labour', reform: 'a reform', bet: 'a big bet', oil: 'oil', people: 'one of our people', general: 'it',
};

/** Whether the figures under a story are quiet, so the story is noise. Stories about what we did are never noise. */
function calm(s: GameState, topic: Topic): boolean {
  switch (topic) {
    case 'prices': return hardship(s) < 50;
    case 'money': return s.nation.fiscalSpace > 0.5 && s.nation.debt < 75 && s.debts.contractors < 0.8;
    case 'labour': return s.pressures.wageGrievance < 45 && s.debts.pensions < 0.4;
    case 'security': return ZONES.every((z) => s.theatres[z] < 65);
    case 'power': return s.nation.power >= 35 && s.debts.gas < 0.6;
    case 'scandal': return s.pressures.scandalHeat < 40;
    case 'politics': case 'people': return BLOCS.every((b) => s.blocs[b] >= 35);
    case 'oil': return Math.abs(s.oil.price - s.budget.benchmark) < 8;
    default: return false;
  }
}

const lower = (x: string) => x[0].toLowerCase() + x.slice(1);

export function attention(s: GameState): Attention {
  const worries = concerns(s);
  const coming = upcoming(s);
  // What can hurt us: the Chief of Staff's worries first, then what the calendar says will bite.
  const hurt: (Item & { w: number; topic?: Topic })[] = [
    ...worries.filter((c) => c[5] !== 'good').map((c) => ({ w: c[0], text: fill(s, c[1]), go: c[2], tab: c[3], topic: c[4] })),
    ...coming.filter((c) => c.tone === 'bad').map((c) => ({ w: 18 - c.months * 3, text: c.text, go: c.go, tab: c.tab })),
  ].sort((a, b) => b.w - a.w);
  // A weaker Chief of Staff sees less.
  const n = (s.chars.cos?.competence ?? 3) >= 3 ? 3 : 2;
  const seen = new Set<string>();
  const top = hurt.filter((x) => (seen.has(x.text) ? false : (seen.add(x.text), true))).slice(0, n);

  // Openings: powers about to lapse, favours waiting to be called in, good news on the calendar.
  const open: (Item & { w: number })[] = [];
  for (const x of s.offers) {
    const o = ORDER_BY_ID[x.id];
    if (!o || !canOrder(s, o).ok) continue;
    const left = x.until - s.turn;
    if (left <= 1) open.push({ w: 14, text: `Last chance, this month only: ${lower(o.name)}`, go: 'orders' });
    else if (x.since === s.turn) open.push({ w: 9, text: `New this month: ${lower(o.name)}`, go: 'orders' });
  }
  const owed = favoursOwed(s).sort((a, b) => b.size - a.size)[0];
  if (owed) open.push({ w: 8 + owed.size, text: `${who(s, owed.who).short} owes you a favour (${lower(owed.why).replace(/\.$/, '')})`, go: 'power', tab: 'owed' });
  for (const c of worries.filter((x) => x[5] === 'good')) open.push({ w: c[0], text: fill(s, c[1]), go: c[2], tab: c[3] });
  for (const c of coming.filter((x) => x.tone !== 'bad')) open.push({ w: 12 - c.months * 2, text: c.text, go: c.go, tab: c.tab });
  open.sort((a, b) => b.w - a.w);
  // Something already on the list of dangers is not also an opening.
  const fresh = open.filter((x) => !top.some((h) => h.go === x.go && h.tab === x.tab && (x.tab || h.text === x.text)));

  // The noise: the papers' lead, when it is about nothing on the list above.
  const lead = s.papers[0];
  const loud = lead && !lead.grave && lead.topic && calm(s, lead.topic) && !top.some((x) => x.topic === lead.topic);
  const noise = loud ? `Everyone is talking about ${WORD[lead.topic!]}: "${lead.lead}". It is loud, and nothing we watch says it needs you this month.` : null;

  return { hurt: top.map(({ text, go, tab }) => ({ text, go, tab })), open: fresh.slice(0, 2).map(({ text, go, tab }) => ({ text, go, tab })), noise };
}
