// THE OPPOSITION'S PROPOSALS, AND HOW THE PRESIDENT ANSWERS (plan 15.A4, 15.A5)
// A rival makes a proposal when the problem it names exists. Unanswered, it is
// campaigned on every month. The President can adopt it (the rival gets the
// credit), negotiate a smaller version, defeat it (costly if the rival was
// right), or promise a different answer and show within six months that it
// works. The rivals' strength moves with how their proposals fare, not only
// with the President's approval.

import { PROPOSALS, PROPOSAL_BY_ID } from '../content/proposals';
import { RIVAL_BY_ID } from '../content/people';
import type { GameState } from './types';
import { applyFx, clamp, senate, test } from './vars';

export type Answer = 'adopt' | 'negotiate' | 'defeat' | 'alternative';
export interface OpenProposal { id: string; opened: number; answer?: Answer; answered?: number; due?: number; outcome?: string }

export const ALTERNATIVE_MONTHS = 6;
export const CAMPAIGN_MONTHS = 8;

export function proposals(s: GameState): OpenProposal[] {
  return (s.proposals ??= []);
}

const bump = (s: GameState, rival: string, d: number) => { s.opposition[rival] = clamp((s.opposition[rival] ?? 30) + d, 5, 95); };
const rivalName = (id: string) => RIVAL_BY_ID[id]?.name ?? id;

/** Monthly: rivals propose where there is a real problem; unanswered proposals are campaigned on; promised alternatives are judged. */
export function proposalTick(s: GameState): void {
  const list = proposals(s);
  const open = list.filter((p) => !p.answer || (p.answer === 'alternative' && !p.outcome));
  for (const def of PROPOSALS) {
    if (open.length >= 3) break;
    const last = list.filter((p) => p.id === def.id).pop();
    if (last && s.turn - last.opened < 24) continue;
    if (!test(s, def.when)) continue;
    const p: OpenProposal = { id: def.id, opened: s.turn };
    list.push(p); open.push(p);
    s.news.push({ chronicle: `${rivalName(def.rival).toUpperCase()} PROPOSES: ${def.title.toUpperCase()}`, street: `${(RIVAL_BY_ID[def.rival]?.short ?? def.rival).toUpperCase()} GET PLAN: ${def.title.toUpperCase()}`, weight: 4, valence: -1, topic: 'politics', about: def.rival, body: def.text });
    s.report.push({ kind: 'consequence', title: `The opposition proposes: ${def.title}`, cause: rivalName(def.rival), text: `${def.text} Speaking for: ${def.for}. Answer it from Power, The opposition.`, changes: [] });
  }
  for (const p of list) {
    const def = PROPOSAL_BY_ID[p.id];
    if (!def) continue;
    if (!p.answer) {
      for (const f of def.campaign) applyFx(s, f);
      bump(s, def.rival, test(s, def.right) ? 0.5 : 0.15);
      if (s.turn - p.opened >= CAMPAIGN_MONTHS) { p.answer = 'defeat'; p.answered = s.turn; p.outcome = 'Never answered: it became a campaign promise.'; bump(s, def.rival, 3); }
    } else if (p.answer === 'alternative' && !p.outcome && s.turn >= (p.due ?? 0)) {
      const met = test(s, def.alternative.met);
      p.outcome = met ? `Your alternative worked: ${def.alternative.text.charAt(0).toLowerCase()}${def.alternative.text.slice(1)}.` : 'You promised a better answer and did not deliver it.';
      bump(s, def.rival, met ? -4 : 4);
      applyFx(s, ['approval', met ? 1.5 : -1.5]);
      s.report.push({ kind: met ? 'reform' : 'failure', title: `${def.title}: ${met ? 'your alternative worked' : 'your alternative never came'}`, cause: rivalName(def.rival), text: p.outcome, changes: [] });
    }
  }
}

export function canAnswer(s: GameState, id: string, how: Answer, moves: number): { ok: boolean; reason?: string } {
  const p = proposals(s).find((x) => x.id === id && !x.answer);
  if (!p) return { ok: false };
  if (moves <= 0) return { ok: false, reason: "This month's moves are used." };
  if (how === 'negotiate' && senate(s) < 45) return { ok: false, reason: 'Nobody in the Senate will broker it: your support there is below 45.' };
  if ((how === 'negotiate' || how === 'defeat') && s.pc < 3) return { ok: false, reason: 'Needs 3 political capital.' };
  return { ok: true };
}

/** Answer a proposal. Its consequences depend on whether the rival was right. */
export function answer(s: GameState, id: string, how: Answer): string {
  const p = proposals(s).find((x) => x.id === id && !x.answer)!;
  const def = PROPOSAL_BY_ID[id];
  const right = test(s, def.right);
  p.answer = how; p.answered = s.turn;
  s.desk.actionsUsed += 1;
  switch (how) {
    case 'adopt':
      for (const f of def.adopt) applyFx(s, f);
      if (def.reverses) { s.agenda.done = s.agenda.done.filter((x) => x !== def.reverses); s.flags[`reversed.${def.reverses}`] = Number(s.flags[`reversed.${def.reverses}`] ?? 0) + 1; }
      bump(s, def.rival, 2); applyFx(s, ['approval', 1]);
      p.outcome = `Adopted. ${rivalName(def.rival)} takes the credit, and the problem is addressed.`;
      return `You adopt "${def.title}". ${rivalName(def.rival)} says it was their idea, which it was.`;
    case 'negotiate':
      s.pc = clamp(s.pc - 3, 0, 100);
      for (const f of def.negotiate) applyFx(s, f);
      bump(s, def.rival, 1); applyFx(s, ['bloc.party', -1]);
      p.outcome = 'Negotiated: a smaller version, passed with both sides\' votes.';
      return `A smaller version of "${def.title}" is agreed with ${rivalName(def.rival)}'s senators. Both sides claim it.`;
    case 'defeat':
      s.pc = clamp(s.pc - 3, 0, 100);
      if (right) { bump(s, def.rival, 3); applyFx(s, ['approval', -1.5]); p.outcome = `Defeated, but they were right: ${def.for.toLowerCase()} noticed.`; }
      else { bump(s, def.rival, -4); applyFx(s, ['approval', 0.5]); p.outcome = 'Defeated, and the argument against it held.'; }
      return right ? `Your senators vote it down. The problem it named is real, and ${def.for.toLowerCase()} know who voted how.` : `Your senators vote it down, and the case against it holds: the problem was smaller than ${rivalName(def.rival)} claimed.`;
    case 'alternative':
      p.due = s.turn + ALTERNATIVE_MONTHS;
      return `You answer with your own approach: ${def.alternative.text.charAt(0).toLowerCase()}${def.alternative.text.slice(1)}. In ${ALTERNATIVE_MONTHS} months the country will see whether it works.`;
  }
}
