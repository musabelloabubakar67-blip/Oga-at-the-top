import { afterOffice, type After } from './afterlife';
import { yearOf } from './config';
import { fill } from './text';
import type { EndingKind, GameState } from './types';
import { approval, hardship } from './vars';

export type Grade = 'Transformed' | 'Stronger' | 'Held' | 'Weaker' | 'Squandered';

export interface Dimension { name: string; grade: Grade; score: number; from: string; to: string }

export interface Verdict {
  epithet: string;
  years: string;
  ending: EndingKind;
  endingLine: string;
  narrative: string[];
  dims: Dimension[];
  ledger: null | {
    tolerated: number; political: number; personal: number; witnesses: number; trail: string;
    bought: string; aftermath: string;
  };
  left: string[];
  defining: string[];
  /** What happens to you after noon on the last day. */
  after: After;
}

function grade(delta: number, steps: [number, number, number, number]): [Grade, number] {
  if (delta >= steps[0]) return ['Transformed', 2];
  if (delta >= steps[1]) return ['Stronger', 1];
  if (delta > steps[2]) return ['Held', 0];
  if (delta > steps[3]) return ['Weaker', -1];
  return ['Squandered', -2];
}

const be = (name: string) => (name === 'Institutions' || name.includes(' and ') ? 'are' : 'is');

const ENDING_LINE: Record<EndingKind, string> = {
  term_limit: 'You served two full terms and handed over on the appointed day.',
  defeated: 'You lost the election.',
  ticket_denied: 'Your own party denied you its ticket. You served out the term and watched the election from the Villa.',
  removed: 'You were removed from office by the National Assembly.',
  resigned: 'You resigned.',
  annulled: 'The courts annulled your election. The Vice President was sworn in that afternoon, and you left by the back gate.',
};

export function verdict(s: GameState): Verdict {
  const b = s.baseline;
  const n = s.nation;
  const h = hardship(s);
  const app = approval(s);
  const arrears = s.debts.gas + s.debts.contractors + s.debts.pensions;
  const saved = s.funds.abroad + s.funds.buffer + s.funds.infra + s.funds.growth;
  const owed0 = s.counters['base.arrears'] ?? 2.5;
  const dim = (name: string, delta: number, steps: [number, number, number, number], from: string, to: string): Dimension => {
    const [g, score] = grade(delta, steps);
    return { name, grade: g, score, from, to };
  };

  const dims: Dimension[] = [
    dim('Prosperity', b.hardship - h, [20, 8, -4, -12], `Inflation ${b.inflation.toFixed(0)}%`, `${n.inflation.toFixed(0)}%`),
    dim('Fiscal stability', (b.debt - n.debt) + (n.fiscalSpace - b.fiscalSpace + saved - (arrears - owed0)) * 4, [25, 10, -5, -15], `Debt service ${b.debt.toFixed(0)}% of revenue, ₦${owed0.toFixed(1)}tn unpaid`, `${n.debt.toFixed(0)}%, ₦${arrears.toFixed(1)}tn unpaid, ₦${saved.toFixed(1)}tn saved`),
    dim('Security', n.security - b.security, [24, 10, -4, -12], `Index ${b.security.toFixed(0)}`, n.security.toFixed(0)),
    dim('Power and infrastructure', n.power - b.power, [24, 10, -4, -12], `Index ${b.power.toFixed(0)}`, n.power.toFixed(0)),
    dim('Jobs and industry', n.jobs - b.jobs, [24, 10, -4, -12], `Index ${b.jobs.toFixed(0)}`, n.jobs.toFixed(0)),
    dim('Institutions', (n.capacity - b.capacity + n.integrity - b.integrity) / 2, [18, 7, -3, -10], `Capacity ${b.capacity.toFixed(0)} → ${n.capacity.toFixed(0)}`, `integrity ${b.integrity.toFixed(0)} → ${n.integrity.toFixed(0)}`),
    dim('Public trust', app - b.approval, [8, 2, -6, -14], `Approval ${b.approval.toFixed(0)}%`, `${app.toFixed(0)}%`),
  ];
  const perf = dims.slice(0, 6).reduce((a, d) => a + d.score, 0) / 6;
  const byScore = [...dims.slice(0, 6)].sort((x, y) => y.score - x.score);
  const best = byScore[0];
  const worst = byScore[byScore.length - 1];

  const personal = s.purseTaken.personal;
  const political = s.purseTaken.political;
  const tolerated = s.counters.tolerated ?? 0;
  const witnesses = new Set(s.exposures.flatMap((x) => x.witnesses)).size;
  const trail = s.exposures.reduce((a, x) => a + x.trail, 0);
  const ending = s.ending ?? 'term_limit';
  const allyWon = !!s.flags['succession.won'];
  const inst = dims[5].score;
  const fiscal = dims[1].score;

  const after = afterOffice(s);
  let epithet: string;
  if (after.kind === 'prison') epithet = 'The Convicted President';
  else if (after.kind === 'exile') epithet = 'The President in Exile';
  else if (ending === 'removed') epithet = 'The Cautionary Tale';
  else if (ending === 'resigned') epithet = 'The One Who Walked Away';
  else if (ending === 'annulled') epithet = 'The Annulled';
  else if (personal >= 40 && perf < 0) epithet = 'The Looter';
  else if (personal >= 40 && perf >= 0.4) epithet = 'The One Who Ate and Worked';
  else if (perf >= 0.8 && ending !== 'term_limit') epithet = 'The Reformer They Voted Out';
  else if (perf >= 0.8) epithet = 'The Consequential President';
  else if (inst >= 1 && perf > -0.3) epithet = 'The Builder of Boring Things';
  else if (fiscal <= -1 && app >= 48) epithet = 'The Generous One';
  else if (tolerated >= 4 && personal < 10) epithet = 'The One Who Saw Nothing';
  else if (ending === 'term_limit' && perf <= -0.4) epithet = app >= 46 ? 'The Popular President' : 'The Survivor';
  else if (ending === 'term_limit') epithet = 'The Survivor';
  else if (ending === 'ticket_denied') epithet = 'The Orphan of the Party';
  else epithet = 'The One-Term President';

  const p1 = ending === 'defeated' && s.election
    ? `You lost the election, carrying ${s.election.states.filter((x) => x.won).length} of 37.`
    : ENDING_LINE[ending];

  const p2Parts: string[] = [];
  if (best.score > 0) p2Parts.push(`${best.name} ${be(best.name)} ${best.grade.toLowerCase()} since the day you were sworn in.`);
  if (worst.score < 0) p2Parts.push(`${worst.name} ${be(worst.name)} ${worst.grade.toLowerCase()}, and your successor will open that file first.`);
  if (!p2Parts.length) p2Parts.push('The country you hand over is, by most measures, the country you were handed. Whether that is an achievement depends on who is asked.');
  if (s.flags['policy.subsidy'] === 'removed') p2Parts.push('The petrol subsidy is gone, and nobody who follows you will have to be the one who removed it.');
  else p2Parts.push('The petrol subsidy is still there, under a different name, waiting for someone braver or more desperate.');

  const p3Parts: string[] = [];
  if (ending === 'term_limit') {
    p3Parts.push(allyWon
      ? 'Your party kept the Villa. Whether your successor remembers who put them there is a separate question.'
      : 'Your party lost the Villa on your way out, and has already begun to explain that it was your fault.');
  } else if (ending === 'defeated') {
    p3Parts.push(perf >= 0.4
      ? 'Your party blames you. Economists will spend the next decade arguing about your presidency.'
      : 'Your party blames you. For once, the party and the public agree.');
  } else if (ending === 'ticket_denied') {
    p3Parts.push('The people who denied you the ticket have since lost the election without your help.');
  } else if (ending === 'removed') {
    p3Parts.push('The panel\'s report ran to 600 pages. Most Nigerians read only the last line.');
  } else if (ending === 'annulled') {
    p3Parts.push('The judgment ran to 400 pages. It will be cited in every election petition for a generation, which is a kind of legacy.');
  } else {
    p3Parts.push('History is kinder to those who leave than to those who are carried out. Slightly.');
  }
  const closing = perf >= 0.8
    ? 'It was difficult. It was not impossible.'
    : perf <= -0.6
      ? 'The next President has been handed a longer list than you were.'
      : 'Somebody else\'s turn.';

  const left: string[] = [];
  if (s.flags['uni.agreement'] === 'inherited_unfunded' || s.flags['uni.agreement'] === 'broken' || s.flags['uni.agreement'] === 'phased') {
    left.push('The university funding agreement, still not fully funded.');
  }
  if (s.flags['wage.agreement'] === 'signed_unfunded') left.push('A minimum wage the states say they cannot pay.');
  if (n.debt > b.debt + 5) left.push(`Debt service at ${n.debt.toFixed(0)}% of revenue, up from ${b.debt.toFixed(0)}%.`);
  if (s.flags['policy.subsidy'] !== 'removed') left.push('A petrol subsidy nobody will admit exists.');
  if (s.flags['promise.second_term']) left.push('A campaign promise the treasury never heard about.');
  if ((s.counters.committees ?? 0) >= 3) left.push(`${s.counters.committees} presidential committees whose reports are awaited.`);
  if (arrears > 1.5) left.push(`₦${arrears.toFixed(1)}tn owed to contractors, pensioners and gas suppliers.`);
  if (saved > 1) left.push(`₦${saved.toFixed(1)}tn in savings, which is more than any President has handed over.`);
  const owing = s.favours.filter((f) => f.dir === 'owing').length;
  if (owing) left.push(`${owing === 1 ? 'A debt' : `${owing} debts`} of your own, to people who will now come to your house instead of the Villa.`);
  const lost = Object.keys(s.ventures.causes).length;
  if (lost >= 2) left.push(`${lost} monuments to things that were announced before they were possible.`);
  if (left.length === 1 && saved > 1) left.unshift('Very little.');
  if (!left.length) left.push('Nothing of note. The handover notes are, for once, shorter than the inauguration speech.');

  return {
    epithet,
    years: `${s.startYear} – ${yearOf(Math.min(s.turn, 96), s.startYear)}`,
    ending,
    endingLine: ENDING_LINE[ending],
    narrative: [p1, p2Parts.join(' '), p3Parts.join(' '), closing].map((t) => fill(s, t)),
    dims,
    ledger: personal + political + tolerated > 0 ? {
      tolerated, political, personal, witnesses,
      trail: trail >= 8 ? 'substantial' : trail >= 3 ? 'findable' : 'thin',
      bought: personal >= 2 ? `What you kept would have built about ${Math.round(personal / 2)} km of federal road.` : '',
      aftermath: personal >= 10 ? 'Immunity ended today.' : 'You took nothing for yourself.',
    } : null,
    left,
    after,
    // The election result is the verdict's first line; the list is for what you chose to do.
    defining: s.archive.filter((a) => a.sig === 3 && a.turn > 0 && !a.sealed && a.eventId !== 'election').map((a) => a.headline).slice(-8),
  };
}
