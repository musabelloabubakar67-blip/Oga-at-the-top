// Political capital is an income. This says where it comes from, so the
// player can see it and decide which source to grow.

import { PEOPLE } from '../content/people';
import { TYCOONS } from '../content/tycoons';
import { CFG, termTurnOf } from './config';
import type { GameState } from './types';
import { BLOCS, approval, standing } from './vars';

export interface CapitalLine { label: string; value: number; hint: string }

const BLOC_LABEL: Record<string, string> = {
  villa: 'the Villa', party: 'the party', street: 'the street', establishment: 'the establishment', press: 'the press',
};

export function capitalIncome(s: GameState): { lines: CapitalLine[]; total: number; capped: boolean } {
  const c = CFG.pc;
  const lines: CapitalLine[] = [{ label: 'The office itself', value: c.base, hint: 'Every President has some.' }];

  const app = (approval(s) - c.approvalPivot) / c.approvalDiv;
  lines.push({ label: 'Public approval', value: app, hint: 'Above 45% approval adds; below it drains.' });

  let withYou = 0;
  let against = 0;
  for (const p of PEOPLE) {
    if (p.group === 'minister') continue;
    const v = standing(s, p.id);
    if (v >= 58) withYou++;
    else if (v < 42) against++;
  }
  if (withYou) lines.push({ label: withYou === 1 ? '1 governor or senator with you' : `${withYou} governors and senators with you`, value: withYou * c.perAlly, hint: 'Each one who is with you adds. Win them on the politics screen.' });
  if (against) lines.push({ label: against === 1 ? '1 governor or senator unhappy' : `${against} governors and senators unhappy`, value: -against * c.perAlly, hint: 'Each one who is unhappy drains.' });

  const solid = BLOCS.filter((k) => s.blocs[k] >= 60);
  const strained = BLOCS.filter((k) => s.blocs[k] < 40 && s.blocs[k] >= 20);
  const breaking = BLOCS.filter((k) => s.blocs[k] < 20);
  if (solid.length) lines.push({ label: `Solid support: ${solid.map((k) => BLOC_LABEL[k]).join(', ')}`, value: solid.length * c.perSolid, hint: 'Each bloc at Solid or better adds.' });
  if (strained.length) lines.push({ label: `Strained: ${strained.map((k) => BLOC_LABEL[k]).join(', ')}`, value: -strained.length * c.perStrained, hint: 'Each Strained bloc drains.' });
  if (breaking.length) lines.push({ label: `Breaking: ${breaking.map((k) => BLOC_LABEL[k]).join(', ')}`, value: -breaking.length * c.perBreaking, hint: 'A Breaking bloc drains heavily.' });

  const friends = TYCOONS.filter((t) => (s.tycoons[t.id]?.rel ?? 50) >= 60).length;
  const enemies = TYCOONS.filter((t) => (s.tycoons[t.id]?.rel ?? 50) < 35).length;
  if (friends) lines.push({ label: friends === 1 ? '1 businessman with you' : `${friends} businessmen with you`, value: friends * c.perTycoon, hint: 'Money that is on your side makes politicians easier to persuade.' });
  if (enemies) lines.push({ label: enemies === 1 ? '1 businessman against you' : `${enemies} businessmen against you`, value: -enemies * c.perTycoon, hint: 'Money that is against you is paying somebody to say no.' });

  const kept = Math.min(c.keptCap, s.agenda.done.length * c.perReform);
  if (kept) lines.push({ label: `${s.agenda.done.length} reforms delivered`, value: kept, hint: 'A President who delivers is harder to refuse. Each delivered reform adds, permanently.' });

  const load = Math.max(0, s.agenda.active.length - CFG.agenda.easyLoad);
  if (load) lines.push({ label: `Driving ${s.agenda.active.length} reforms at once`, value: -load * CFG.agenda.loadPc, hint: `Every reform under way beyond ${CFG.agenda.easyLoad} takes authority to keep moving, and strains the party.` });

  const tt = termTurnOf(s.turn);
  if (s.term === 1 && tt <= CFG.honeymoonMonths) lines.push({ label: 'Honeymoon', value: c.honeymoon, hint: 'The first six months.' });
  if (s.term === 2 && tt > 36) lines.push({ label: 'Lame duck', value: c.lameDuck, hint: 'Everyone is looking past you to the succession.' });
  if (s.flags['ticket.lost'] || s.flags['election.lost']) lines.push({ label: 'On the way out', value: -4, hint: 'You will not be here next year, and they know it.' });

  let total = lines.reduce((a, l) => a + l.value, 0);
  const capped = total > 0 && s.pc > c.softCap;
  if (capped) total *= 0.5;
  return { lines, total, capped };
}

/** How many things the President can personally do this month. A well-run Villa gets more done. */
export function movesTotal(s: GameState): number {
  const m = CFG.moves;
  return m.base + (s.blocs.villa >= m.bonusAt ? 1 : 0) - (s.blocs.villa < m.penaltyAt ? 1 : 0);
}
