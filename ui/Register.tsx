'use client';

// THE REGISTER (plan 06.A7)
// One place for what the government has undertaken and what has been asked of it:
// commitments with their due dates and what has happened to them, requests and
// how they were answered, and the promises made in person. Read-only: it reads
// the engine's governance view (contract 1.0.0) and the existing promise records,
// and never changes state.

import { mo } from '../engine/config';
import { getGovernanceView } from '../engine/public';
import type { CommitmentRecord, CommitmentReview, GovernanceView, RequestChange, RequestRecord, ReviewVerdict } from '../engine/public';
import { pledgeName } from '../engine/promises';
import type { GameState } from '../engine/types';

const ago = (n: number) => (n <= 0 ? 'this month' : `${mo(n)} ago`);
const nameOf = (v: GovernanceView, id: string) => v.persons.find((p) => p.id === id)?.name ?? 'someone no longer in office';

/** Where a record came from, relative to the government reading it. */
function provenance(v: GovernanceView, administrationId: string): string | null {
  return administrationId === v.clock.administrationId ? null : 'Inherited from a previous government';
}

function dueText(v: GovernanceView, c: CommitmentRecord): { text: string; urgent: boolean } {
  const left = c.due - v.clock.worldMonth;
  if (c.status === 'review-due' || left <= 0) return { text: 'Due for review now', urgent: true };
  return { text: `Due in ${mo(left)}`, urgent: left <= 2 };
}

const STATUS: Record<CommitmentRecord['status'], string> = {
  open: 'Open', 'review-due': 'Due for review', kept: 'Kept', broken: 'Broken', renegotiated: 'Renegotiated',
};
const CHANGED: Record<RequestChange, string> = { offer: 'a better offer', appeal: 'an appeal', threat: 'a threat', coalition: 'more people behind it', evidence: 'new evidence' };
const ANSWER: Record<RequestRecord['status'], string> = {
  open: 'Not yet answered', granted: 'Granted', refused: 'Refused', withdrawn: 'Withdrawn', substituted: 'Substitute accepted', lapsed: 'Lapsed',
};

/** Verdicts (contract R4) say more than kept or broken: withheld means the government did not release what the work needed. */
const VERDICT: Record<ReviewVerdict, { text: string; tone: string }> = {
  met: { text: 'Met', tone: 'text-state' },
  missed: { text: 'Missed', tone: 'text-alarm' },
  withheld: { text: 'Failed · not funded', tone: 'text-honour' },
  disputed: { text: 'Disputed', tone: 'text-ink-soft' },
};
const naira = (tn: number) => (tn <= 0 ? '₦0' : tn >= 1 ? `₦${tn.toFixed(2)}tn` : `₦${Math.round(tn * 1000)}bn`);
/** The engine writes amounts in trillions to three places; say them as a reader would ("₦19bn", not "₦0.019tn"). */
const money = (text: string) => text.replace(/₦(\d+\.\d+)tn/g, (_, n) => (Number(n) === 0 ? '₦0' : naira(Number(n))));

function Review({ v, r, earlier }: { v: GovernanceView; r: CommitmentReview; earlier?: boolean }) {
  return (
    <div className={`mt-2 border-l-2 pl-3 text-[13px] leading-snug ${earlier ? 'border-ink/15 text-ink-soft' : r.verdict === 'met' ? 'border-state' : r.verdict === 'withheld' ? 'border-honour' : r.verdict === 'disputed' ? 'border-ink/30' : 'border-alarm'}`}>
      <p><span className={`label mr-1 ${VERDICT[r.verdict].tone}`}>{earlier ? 'Earlier review · ' : 'Review · '}{VERDICT[r.verdict].text}</span> · {ago(v.clock.worldMonth - r.at)}{r.score !== undefined ? ` · scorecard ${Math.round(r.score)}` : ''}</p>
      {r.evidence.length > 0 && <ul className="mt-0.5 list-disc pl-4">{r.evidence.map((e) => <li key={e}>{e}</li>)}</ul>}
      {r.governmentContribution.length > 0 && (
        <p className="mt-1"><span className="label mr-1 text-honour">{'The government\'s own part'}</span>{money(r.governmentContribution.join(' '))}</p>
      )}
    </div>
  );
}

function Commitment({ v, c }: { v: GovernanceView; c: CommitmentRecord }) {
  const due = dueText(v, c);
  const from = provenance(v, c.origin.administrationId);
  const settled = c.status === 'kept' || c.status === 'broken' || c.status === 'renegotiated';
  const verdict = c.review ? VERDICT[c.review.verdict] : null;
  const notes = c.notes.filter((n) => !n.text.startsWith('Review:'));
  const earlier = (c.reviews ?? []).filter((r) => r !== c.review && !(c.review && r.at === c.review.at && r.verdict === c.review.verdict));
  return (
    <li className={`border p-3 ${due.urgent && !settled ? 'border-alarm/60' : 'border-ink/20'}`}>
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-serif text-lg leading-snug">{c.text}</span>
        <span className={`label shrink-0 ${verdict ? verdict.tone : settled ? (c.status === 'kept' ? 'text-state' : 'text-alarm') : due.urgent ? 'text-alarm' : 'text-ink-soft'}`}>
          {verdict ? verdict.text : settled ? STATUS[c.status] : due.text}
        </span>
      </p>
      {c.resources && (
        <p className="mt-0.5 text-[13px]">
          Allocated {naira(c.resources.naira)} · released {naira(c.resources.released)}
          {c.resources.released < c.resources.naira ? <span className="text-honour"> · {naira(c.resources.naira - c.resources.released)} {settled ? 'never released' : 'not yet released'}</span> : null}
        </p>
      )}
      {c.target && (
        <p className="mt-0.5 text-[13px]">Target: the ministry scorecard from {Math.round(c.target.baseline)} to at least {Math.round(c.target.baseline + c.target.improvement)} by the due date.</p>
      )}
      {c.conditions && c.conditions.length > 0 && <p className="mt-0.5 text-[13px] text-ink-soft">Conditions: {c.conditions.join('; ')}</p>}
      <p className="mt-0.5 text-[13px] text-ink-soft">
        {nameOf(v, c.responsible)} is responsible · {c.visibility === 'public' ? 'made in public' : 'private'} · made {ago(v.clock.worldMonth - c.made)}
        {from ? ` · ${from}` : ''}
      </p>
      {notes.length > 0 && (
        <ol className="mt-2 space-y-0.5 border-l-2 border-ink/15 pl-3 text-[13px]">
          {notes.map((n, i) => <li key={i}><span className="text-ink-soft">{ago(v.clock.worldMonth - n.at)}:</span> {money(n.text)}</li>)}
        </ol>
      )}
      {earlier.map((r, i) => <Review key={i} v={v} r={r} earlier />)}
      {c.review && <Review v={v} r={c.review} />}
      {c.status === 'review-due' && !c.review && c.notes.length === 0 && (
        <p className="mt-2 text-[13px] italic text-ink-soft">Nothing has been recorded against it. Whether it was kept is not yet judged.</p>
      )}
    </li>
  );
}

/** What each governor, senator and minister currently wants: one line each, answered from Politics. */
function Standing({ v, list }: { v: GovernanceView; list: RequestRecord[] }) {
  return (
    <ul className="mt-2 space-y-1 text-[13px]">
      {list.map((r) => (
        <li key={r.id} className="flex flex-wrap justify-between gap-3 border-b border-ink/10 py-1">
          <span>{r.text} <span className="text-ink-soft">· {nameOf(v, r.requester)}</span></span>
          <span className="text-ink-soft">{ago(v.clock.worldMonth - r.made)}</span>
        </li>
      ))}
    </ul>
  );
}

function Request({ v, r }: { v: GovernanceView; r: RequestRecord }) {
  const from = provenance(v, r.origin.administrationId);
  return (
    <li className="border border-ink/20 p-3">
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-serif leading-snug">{r.text}</span>
        <span className={`label shrink-0 ${r.status === 'granted' ? 'text-state' : r.status === 'open' ? 'text-honour' : 'text-ink-soft'}`}>{ANSWER[r.status]}</span>
      </p>
      <p className="mt-0.5 text-[13px] text-ink-soft">
        Asked by {nameOf(v, r.requester)} · {ago(v.clock.worldMonth - r.made)}{from ? ` · ${from}` : ''}
      </p>
      {r.terms && r.terms.description !== r.text && <p className="mt-1 text-[13px]">Terms: {r.terms.description}</p>}
      {r.previous && <p className="mt-1 text-[13px] text-ink-soft">Asked before and answered; back with something changed{r.changedBy ? ` (${CHANGED[r.changedBy]})` : ''}.</p>}
      {r.substitution && <p className="mt-1 text-[13px]">Offered instead: {r.substitution.text} <span className="text-ink-soft">({r.substitution.accepted ? 'accepted' : 'turned down'})</span></p>}
      {r.response && <p className="mt-1 text-[13px]">Answer: {r.response}</p>}
    </li>
  );
}

export function Register({ s }: { s: GameState }) {
  const v = getGovernanceView(s);
  const pending = v.commitments.filter((c) => c.status === 'open' || c.status === 'review-due').sort((a, b) => a.due - b.due);
  const settled = v.commitments.filter((c) => !pending.includes(c)).sort((a, b) => b.made - a.made);
  const asked = v.requests.filter((r) => r.status === 'open' && !r.legacyWant);
  const standing = v.requests.filter((r) => r.status === 'open' && r.legacyWant);
  const answered = v.requests.filter((r) => r.status !== 'open').sort((a, b) => (b.closed ?? b.made) - (a.closed ?? a.made)).slice(0, 12);
  const pledges = (s.pledges ?? []).filter((p) => p.status === 'open').sort((a, b) => a.due - b.due);
  const empty = pending.length === 0 && settled.length === 0 && v.requests.length === 0 && pledges.length === 0;

  return (
    <div className="paper p-6 xl:p-8">
      <p className="label text-state">The register</p>
      <h2 className="mt-1 font-serif text-3xl">What the government has undertaken, and what it has been asked</h2>
      <p className="mt-2 max-w-3xl text-sm text-ink-soft">
        A commitment names who must deliver it and when it falls due. Reaching the date is not the same as keeping it: each one is judged on what was actually done, and that record stays with the person responsible.
      </p>

      {empty && <p className="mt-6 font-serif italic text-ink-soft">Nothing has been undertaken on the record yet.</p>}

      {pending.length > 0 && (
        <section className="mt-6">
          <h3 className="label text-ink-soft">Open commitments · {pending.length}</h3>
          <ul className="mt-2 space-y-2">{pending.map((c) => <Commitment key={c.id} v={v} c={c} />)}</ul>
        </section>
      )}

      {pledges.length > 0 && (
        <section className="mt-6">
          <h3 className="label text-ink-soft">Promises made in person · {pledges.length}</h3>
          <ul className="mt-2 space-y-1 text-[13px]">
            {pledges.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-3 border-b border-ink/10 py-1">
                <span>{p.text} <span className="text-ink-soft">· to {pledgeName(s, p)}</span></span>
                <span className={p.due - s.turn <= 3 ? 'text-alarm' : 'text-ink-soft'}>{p.due - s.turn <= 0 ? 'due now' : `due in ${mo(p.due - s.turn)}`}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {asked.length > 0 && (
        <section className="mt-6">
          <h3 className="label text-ink-soft">Waiting for an answer · {asked.length}</h3>
          <ul className="mt-2 space-y-2">{asked.map((r) => <Request key={r.id} v={v} r={r} />)}</ul>
        </section>
      )}

      {standing.length > 0 && (
        <section className="mt-6">
          <h3 className="label text-ink-soft">What people want from you · {standing.length}</h3>
          <p className="mt-1 text-[13px] text-ink-soft">Each person's current ask. Grant, refuse or bargain from Power, under each person; a refused ask returns only if something about it changes.</p>
          <Standing v={v} list={standing} />
        </section>
      )}

      {answered.length > 0 && (
        <section className="mt-6">
          <h3 className="label text-ink-soft">Answered</h3>
          <ul className="mt-2 space-y-2">{answered.map((r) => <Request key={r.id} v={v} r={r} />)}</ul>
        </section>
      )}

      {settled.length > 0 && (
        <section className="mt-6">
          <h3 className="label text-ink-soft">Settled commitments</h3>
          <ul className="mt-2 space-y-2">{settled.map((c) => <Commitment key={c.id} v={v} c={c} />)}</ul>
        </section>
      )}
    </div>
  );
}
