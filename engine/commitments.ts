import { PERSON_BY_ID } from '../content/people';
import { EVENTS } from '../content';
import { SECTORS } from '../content/treasury';
import type { CommitmentRecord, ReviewVerdict } from './contracts';
import { clockOf, ensureGovernance, getGovernanceView, resolveActor, markCommitmentsDue } from './governance';
import { scorecard } from './people';
import { releaseRate, SECTOR_MINISTER, setRelease } from './treasury';
import { test } from './vars';
import type { GameState } from './types';

const pending = (c: CommitmentRecord) => c.status === 'open' || c.status === 'review-due';
const text = (s: string) => typeof s === 'string' && !!s.trim();
export function governmentContribution(c: CommitmentRecord): string[] {
  const out: string[] = [];
  if (c.resources) {
    const r = c.resources, missing = Math.max(0, r.naira - r.released);
    out.push(`₦${r.released.toFixed(3)}tn of the ₦${r.naira.toFixed(3)}tn committed was released; ₦${missing.toFixed(3)}tn was not released.`);
  }
  if (c.target) for (const sector of SECTORS) {
    const samples = c.target.samples.filter((r) => r.sector === sector.id);
    if (!samples.length) continue;
    const allocated = samples.reduce((n, r) => n + r.allocated, 0), released = samples.reduce((n, r) => n + r.released, 0);
    const government = samples.reduce((n, r) => n + (r.governmentWithheld ?? 0), 0);
    out.push(`${sector.name}: ${released.toFixed(2)} of ${allocated.toFixed(2)} budget point-months at the modelled release rate; ${samples.filter((r) => r.mode === 'hold').length} month(s) held by presidential instruction. ${government.toFixed(2)} point-months lost to government holds, cash rationing, stalled increases or cuts below the target's starting allocation. ${[...new Set(samples.flatMap((r) => r.reasons))].join('; ')}.`);
  }
  return out;
}
function withheld(c: CommitmentRecord): boolean {
  return !!(c.resources && c.resources.released + 1e-9 < c.resources.naira)
    || !!c.target?.samples.some((r) => (r.governmentWithheld ?? 0) > 1e-9);
}
export function fundCommitment(s: GameState, id: string, amount: number, reason: string): void {
  const c = s.governance?.commitments[id];
  if (!c || !pending(c) || (c.review && c.review.verdict !== 'disputed') || !c.resources) throw new Error('No pending resource commitment');
  if (!Number.isFinite(amount) || amount <= 0 || !text(reason)) throw new Error('Invalid commitment payment');
  if (amount > c.resources.naira - c.resources.released + 1e-9) throw new Error('Payment exceeds the outstanding allocation');
  if (amount > s.nation.fiscalSpace) throw new Error('Insufficient treasury cash');
  const clock = clockOf(s);
  s.nation.fiscalSpace -= amount; c.resources.released += amount;
  c.resources.payments.push({ at: clock.worldMonth, administrationId: clock.administrationId, amount, reason });
  c.notes.push({ at: clock.worldMonth, text: `Released ₦${amount.toFixed(3)}tn: ${reason}` });
}
export function reviewCommitment(s: GameState, id: string, verdict: ReviewVerdict, evidence: string[]): void {
  const c = s.governance?.commitments[id], now = clockOf(s).worldMonth;
  if (!c || !pending(c) || (c.review && c.review.verdict !== 'disputed')) throw new Error('Commitment has already been reviewed or is not pending');
  if (now < c.due) throw new Error('Commitment is not due for review');
  if (!['met', 'missed', 'withheld', 'disputed'].includes(verdict) || !Array.isArray(evidence) || !evidence.length || evidence.some((v) => !text(v))) throw new Error('A review needs a verdict and evidence');
  if (verdict === 'met' && c.verify && !test(s, c.verify)) throw new Error('The agreed verification condition was not met');
  if (['missed', 'withheld'].includes(verdict) && c.verify && test(s, c.verify)) throw new Error('The agreed verification condition was met');
  if (c.target && verdict !== 'disputed') {
    if (s.governance!.offices[c.target.office] !== c.responsible) throw new Error('The person given this target has left the post');
    const met = scorecard(s, c.target.office).score >= c.target.baseline + c.target.improvement;
    if ((verdict === 'met') !== met) throw new Error('The verdict contradicts the measured target');
  }
  if (verdict === 'withheld' && !withheld(c)) throw new Error('No recorded government withholding supports that verdict');
  c.review = { at: now, verdict, evidence: [...evidence], governmentContribution: governmentContribution(c) };
  if (c.target && s.governance!.offices[c.target.office] === c.responsible) c.review.score = scorecard(s, c.target.office).score;
  (c.reviews ??= []).push(structuredClone(c.review));
  c.status = verdict === 'met' ? 'kept' : verdict === 'disputed' ? 'review-due' : 'broken';
  c.notes.push({ at: now, text: `Review: ${verdict}. ${evidence.join(' ')} ${c.review.governmentContribution.join(' ')}`.trim() });
  for (const v of ['met', 'missed', 'withheld', 'disputed']) s.flags[`review.${id}.${v}`] = v === verdict;
  s.report.push({ kind: verdict === 'met' ? 'consequence' : 'failure', title: `Commitment review: ${verdict}`, text: `${c.text} ${evidence.join(' ')} ${c.review.governmentContribution.join(' ')}`, changes: [] });
}
/** Only commitments with an agreed measurable test are automatically judged. */
export function reviewCommitmentsDue(s: GameState): void {
  markCommitmentsDue(s);
  const now = clockOf(s).worldMonth;
  for (const c of Object.values(s.governance!.commitments)) {
    if (!pending(c) || c.review || c.due > now) continue;
    if (c.target) {
      const t = c.target, current = s.governance!.offices[t.office];
      if (current !== c.responsible) {
        reviewCommitment(s, c.id, 'disputed', ['The person given this target is no longer in the post. The replacement is not judged on the predecessor’s target.']);
        continue;
      }
      const score = scorecard(s, t.office).score, met = score >= t.baseline + t.improvement;
      const verdict = met ? 'met' : withheld(c) ? 'withheld' : 'missed';
      reviewCommitment(s, c.id, verdict, [`Score ${score.toFixed(1)} against ${t.baseline.toFixed(1)} at the start; the agreed improvement was ${t.improvement} points.`]);
    } else if (c.verify) {
      const met = test(s, c.verify);
      reviewCommitment(s, c.id, met ? 'met' : withheld(c) ? 'withheld' : 'missed', [met ? 'The agreed verification condition is met.' : 'The agreed verification condition is not met.']);
    }
  }
}
/** Sample actual releases in the monthly budget tick, rather than today's policy at review. */
export function sampleTargetBudgets(s: GameState): void {
  const now = clockOf(s).worldMonth;
  for (const c of Object.values(s.governance?.commitments ?? {})) {
    if (!c.target || !pending(c) || c.review || now <= c.made || now > c.due) continue;
    if (s.governance!.offices[c.target.office] !== c.responsible) continue;
    for (const sector of SECTORS.filter((x) => SECTOR_MINISTER[x.id] === c.target!.office)) {
      if (c.target.samples.some((r) => r.at === now && r.sector === sector.id)) continue;
      const allocated = s.budget.alloc[sector.id] ?? 0;
      const release = releaseRate(s, sector.id);
      const mode = s.budget.release?.[sector.id] ?? 'normal';
      const increase = Math.max(0, allocated - sector.usual);
      const stalled = !!s.budget.late && s.turn - (s.counters.budgetTurn ?? 0) <= 3;
      const blocked = stalled ? increase : 0;
      const availableIncrease = Math.max(0, increase - blocked);
      const released = Math.min(allocated, sector.usual) + availableIncrease * release.rate;
      const cuts = Math.max(0, (c.target.budgetBaseline?.[sector.id] ?? allocated) - allocated);
      const held = mode === 'hold' ? availableIncrease * release.rate : 0;
      const rationed = release.why.includes('There is almost no cash: releases are rationed') && mode !== 'full'
        ? availableIncrease * release.rate * (mode === 'hold' ? 2 : 1) * (1 / 0.7 - 1) : 0;
      c.target.samples.push({ at: now, sector: sector.id, allocated, released, mode, governmentWithheld: held + Math.min(increase, blocked) + cuts + rationed, reasons: [...release.why, ...(blocked ? ['The budget stalled; increases were not released'] : []), ...(cuts ? [cuts + ' budget points cut below the allocation when the target was set'] : [])] });
    }
  }
}
export function setMinisterTarget(s: GameState, office: string, months: number, improvement = 10): string {
  if (PERSON_BY_ID[office]?.group !== 'minister' || !s.people[office] || s.people[office].gone || !Number.isSafeInteger(months) || months < 1 || !Number.isFinite(improvement) || improvement <= 0) throw new Error('Invalid ministerial target');
  const g = ensureGovernance(s), now = clockOf(s).worldMonth, responsible = resolveActor(s, { office });
  if (Object.values(g.commitments).some((c) => c.target?.office === office && c.responsible === responsible && pending(c) && !c.review)) throw new Error('This minister already has a pending target');
  const id = `target.${g.administrationId}.${office}.${now}`;
  if (Object.hasOwn(g.commitments, id)) throw new Error('A target was already set this month');
  const baseline = scorecard(s, office).score;
  if (baseline + improvement > 100) throw new Error('The target exceeds the scorecard maximum');
  g.commitments[id] = { id, origin: { administrationId: g.administrationId, eventId: 'min.failing', choiceId: 'target' }, responsible, parties: [g.offices.president, responsible], object: 'minister-score-improvement', text: `${g.persons[responsible].name}: improve the scorecard by ${improvement} points within ${months} months.`, made: now, due: now + months, visibility: 'private', status: 'open', notes: [], target: { office, baseline, improvement, samples: [], budgetBaseline: { ...s.budget.alloc } } };
  if (EVENTS['min.target.review']) s.queue.push({ event: 'min.target.review', due: s.turn + months, cast: { WHO: office, TARGET: id }, castPersons: { WHO: responsible } });
  return id;
}
/** Restore future releases; historical shortfalls remain evidence, not a cash invoice. */
export function authoriseTargetReleases(s: GameState, id: string): string {
  const g = ensureGovernance(s), c = g.commitments[id];
  if (!c?.target || c.review?.verdict !== 'withheld' || g.offices[c.target.office] !== c.responsible
    || c.origin.administrationId !== g.administrationId) throw new Error('No current withheld target supports this release instruction');
  const sectors = SECTORS.filter((x) => SECTOR_MINISTER[x.id] === c.target!.office);
  for (const sector of sectors) setRelease(s, sector.id, 'full');
  const text = `Full future releases authorised for ${sectors.map((x) => x.name).join(', ')}. Past withholding remains in the review; subsequent spending is charged through the budget.`;
  c.notes.push({ at: clockOf(s).worldMonth, text });
  return text;
}

export function commitmentsView(s: GameState) {
  return getGovernanceView(s).commitments.map((c) => ({ ...c, governmentContribution: c.review?.governmentContribution ?? governmentContribution(c) })).sort((a, b) => a.due - b.due);
}
