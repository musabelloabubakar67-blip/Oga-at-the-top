// WHAT TO DO FIRST (plan 17.A5, 17.A6)
// A short, explained shortlist drawn from the state of the country: urgent
// problems, coalition stability and preparation for what is coming. The full
// toolbox stays where it is; this only says where to look first, and why. In
// the first month of a new presidency a short guide is offered, and it can be
// dismissed.

import { PROPOSAL_BY_ID } from '../content/proposals';
import { termTurnOf } from './config';
import { diagnose } from './diagnosis';
import type { GameState } from './types';
import { ZONES, ZONE_NAME, senate, test } from './vars';

export type Where = 'treasury' | 'register' | 'power' | 'reforms' | 'country' | 'desk';
export interface Pick { text: string; why: string; go: Where; urgency: number }

export function shortlist(s: GameState): Pick[] {
  const out: Pick[] = [];
  if (s.nation.fiscalSpace < 0.1) out.push({ text: 'Find money before the next payroll', why: `The treasury holds ₦${Math.round(s.nation.fiscalSpace * 1000)}bn. Salaries are due monthly, and a sale takes weeks to settle.`, go: 'treasury', urgency: 10 });
  const q = (s.inquiries ?? []).find((x) => !x.decided);
  if (q) out.push({ text: 'Decide what is really going on', why: `A question has been open since month ${q.opened}, and it costs something every month it waits.`, go: 'register', urgency: 6 });
  const p = (s.proposals ?? []).find((x) => !x.answer && test(s, PROPOSAL_BY_ID[x.id]?.right ?? { v: ['turn', '<', 0] }));
  if (p) out.push({ text: `Answer the opposition's proposal: ${PROPOSAL_BY_ID[p.id].title.toLowerCase()}`, why: 'The problem it names is real, and they are campaigning on it every month you do not answer.', go: 'power', urgency: 7 });
  const starved = s.agenda.active.find((a) => diagnose(s, a.id)[0]?.cause === 'funding');
  if (starved) out.push({ text: 'A reform is starved of money', why: diagnose(s, starved.id)[0].text, go: 'reforms', urgency: 5 });
  const hot = ZONES.filter((z) => s.theatres[z] >= 72 && !(s.military?.missions ?? []).some((m) => !m.ended && m.theatre === z));
  if (hot.length) out.push({ text: `Order a mission in the ${ZONE_NAME[hot[0]]}`, why: `The threat there is ${Math.round(s.theatres[hot[0]])} and no operation is running.`, go: 'country', urgency: 6 });
  if (s.blocs.party < 38 || senate(s) < 42) out.push({ text: 'Shore up your coalition', why: s.blocs.party < 38 ? `The party is at ${Math.round(s.blocs.party)}: below 35, the ticket is at risk.` : `Senate support is ${Math.round(senate(s))}: laws you need will fail.`, go: 'power', urgency: 7 });
  if (s.term === 2 && termTurnOf(s.turn) >= 18 && termTurnOf(s.turn) <= 36 && !s.flags['succession.backed']) out.push({ text: 'Prepare a successor', why: 'The party chooses in month 37. Testing and endorsing a candidate takes months.', go: 'power', urgency: 4 });
  if (s.budget.due) out.push({ text: 'Sign or reshape the budget', why: 'Nothing new is released until it is signed.', go: 'treasury', urgency: 8 });
  return out.sort((a, b) => b.urgency - a.urgency).slice(0, 3);
}

/** The first month of a new presidency: a short guide, not a tutorial. */
export function firstMonthGuide(s: GameState): Pick[] | null {
  if (s.turn > 2 || s.predecessor) return null;
  return [
    { text: 'Read the briefing and the file on your desk', why: 'Each file says who it affects and what each choice will do. Nothing is decided until you choose.', go: 'desk', urgency: 0 },
    { text: 'Launch one reform in a declared priority', why: 'Priorities cost less capital, and reforms take months: starting early is how anything is finished.', go: 'reforms', urgency: 0 },
    { text: 'Look at the Treasury before spending', why: 'The books show what comes in and what goes out, line by line.', go: 'treasury', urgency: 0 },
  ];
}
