'use client';

// THE BILL, THE PACTS AND DELEGATED OBJECTIVES (plan 06)
// A reform the Assembly votes on shows its whip count: each voter, which way
// they lean, and why. A provision can be conceded to any of them; it binds only
// if the bill passes. After the vote the concessions are commitments, and can be
// withdrawn at a price. Pacts between politicians come as joint demands. A
// minister can be given an objective, a budget and a term.

import { useState } from 'react';
import { CONCESSIONS, ISSUE_NAME, STANCES, type ConcessionKind } from '../content/positions';
import { MILESTONE_BY_ID } from '../content/agenda';
import { PERSON_BY_ID } from '../content/people';
import { mo } from '../engine/config';
import { canDelegate, delegations } from '../engine/delegation';
import { canConcede, canRevoke, coalitions, isAmendment, isBill, whipCount } from '../engine/legislature';
import { personView } from '../engine/people';
import { reformName } from '../engine/reforms';
import type { Action, GameState } from '../engine/types';

type Dispatch = (a: Action) => void;
const KINDS = Object.keys(CONCESSIONS) as ConcessionKind[];

/** The whip count for a bill, with concessions to negotiate before the vote, or to honour after it. */
export function BillPanel({ s, id, dispatch, left }: { s: GameState; id: string; dispatch: Dispatch; left: number }) {
  const [open, setOpen] = useState<string | null>(null);
  if (!isBill(id)) return null;
  const b = s.bills?.[id];
  if (b?.passed !== undefined) {
    const live = b.concessions;
    if (!live.length) return null;
    return (
      <div className="mt-2 border-l-2 border-honour/50 pl-2 text-[12.5px] leading-snug">
        <p className="label text-mute">Passed with concessions · now commitments</p>
        {live.map((c) => {
          const can = canRevoke(s, id, c.voter);
          return (
            <p key={c.voter} className="mt-0.5 text-ivory/75">
              {personView(s, c.voter).short}: {CONCESSIONS[c.kind].name.toLowerCase()}{c.revoked ? <span className="text-alarm"> · withdrawn</span> : ''}
              {can.ok && <button onClick={() => dispatch({ type: 'REVOKE_CONCESSION', id, voter: c.voter })} className="ml-2 text-alarm hover:underline">Withdraw it · a broken deal</button>}
            </p>
          );
        })}
      </div>
    );
  }
  const w = whipCount(s, id);
  return (
    <div className="mt-2 border-l-2 border-honour/50 pl-2 text-[12.5px] leading-snug">
      <p className="label text-mute">The whip count · {Math.round(w.yes)} of {Math.round(w.total)} weight for, {isAmendment(id) ? 'two thirds' : 'a majority'} needed · {w.majority ? <span className="text-state">it would pass</span> : <span className="text-alarm">it would fall</span>}</p>
      <ul className="mt-1 space-y-0.5">
        {w.voters.map((v) => (
          <li key={v.id}>
            <span className={v.yes ? 'text-state' : 'text-alarm'}>{v.yes ? 'For' : 'Against'}</span> <span className="text-ivory/85">{v.name}</span> <span className="text-mute">· weight {v.weight} · {v.reasons.join('; ') || 'no strong view'}</span>
            {!v.concession && (
              <button onClick={() => setOpen(open === v.id ? null : v.id)} className="ml-2 text-honour hover:underline">{open === v.id ? 'Not now' : 'Negotiate'}</button>
            )}
            {open === v.id && (
              <span className="mt-1 flex flex-wrap gap-1.5">
                {KINDS.map((k) => {
                  const can = canConcede(s, id, v.id, k, left);
                  const pref = STANCES[v.id]?.prefers === k;
                  return (
                    <button key={k} disabled={!can.ok} title={`${CONCESSIONS[k].text} ${CONCESSIONS[k].cost}${can.reason ? ' ' + can.reason : ''}`} onClick={() => { dispatch({ type: 'CONCEDE', id, voter: v.id, kind: k }); setOpen(null); }} className={`border px-2 py-0.5 ${can.ok ? 'border-honour/50 text-honour hover:bg-honour/10' : 'border-ivory/10 text-ivory/30'}`}>
                      {CONCESSIONS[k].name}{pref ? ' · what they want most' : ''}
                    </button>
                  );
                })}
              </span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-1 text-mute">Each concession costs a move and binds only if the bill passes; after the vote it is a public commitment. The party can still carry it without any of this.</p>
    </div>
  );
}

/** Joint demands from pacts between politicians. */
export function Coalitions({ s, dispatch }: { s: GameState; dispatch: Dispatch }) {
  const list = coalitions(s).filter((k) => k.status === 'open' || s.turn - (k.answered ?? k.made) <= 12);
  if (!list.length) return null;
  return (
    <section className="mt-4">
      <p className="label text-ink-soft">Pacts and their demands</p>
      <ul className="mt-1 space-y-2">
        {list.map((k) => (
          <li key={k.id} className="border border-ink/20 p-3">
            <p className="font-serif leading-snug">{k.members.map((m) => personView(s, m).name).join(' and ')} want {CONCESSIONS[k.demand].name.toLowerCase()} written into every law on {ISSUE_NAME[k.issue] ?? k.issue}, as the price of their votes.</p>
            <p className="text-[13px] text-ink-soft">{CONCESSIONS[k.demand].cost} Accepted, they carry such bills; refused, they vote together against them for two years.{k.status === 'open' ? ` Lapses in ${mo(Math.max(1, 12 - (s.turn - k.made)))}.` : ` ${k.status === 'accepted' ? 'Accepted' : k.status === 'refused' ? 'Refused' : 'Lapsed unanswered'}.`}</p>
            {k.status === 'open' && (
              <div className="mt-2 flex flex-wrap gap-2">
                <button onClick={() => dispatch({ type: 'COALITION', id: k.id, accept: true })} className="border border-state/50 px-3 py-1 font-serif text-state hover:bg-state/10">Accept the demand</button>
                <button onClick={() => dispatch({ type: 'COALITION', id: k.id, accept: false })} className="border border-alarm/50 px-3 py-1 font-serif text-alarm hover:bg-alarm/10">Refuse it</button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

const BUDGETS = [0.1, 0.3, 0.6];

/** Hand a minister an objective, a budget, a term and a reporting rhythm. */
export function Delegate({ s, post, dispatch, left }: { s: GameState; post: string; dispatch: Dispatch; left: number }) {
  const tracks = PERSON_BY_ID[post]?.tracks ?? [];
  const [track, setTrack] = useState(tracks[0] ?? '');
  const [budget, setBudget] = useState(0.3);
  const [months, setMonths] = useState(12);
  const [reporting, setReporting] = useState<1 | 3>(3);
  const [open, setOpen] = useState(false);
  const d = delegations(s)[post];
  if (d) {
    return (
      <div className="mt-2 border-l-2 border-state/50 bg-state/5 px-3 py-2 text-[13px] leading-snug">
        <p className="label text-ink-soft">Delegated objective · until {mo(Math.max(0, d.until - s.turn))} from now</p>
        <p>{ISSUE_NAME[d.track] ?? d.track}: ₦{Math.round(d.spent * 1000)}bn of ₦{Math.round(d.budget * 1000)}bn committed, reporting {d.reporting === 1 ? 'monthly' : 'quarterly'}.{d.launched.length ? ` Launched: ${d.launched.map((id) => reformName(s, id)).join('; ')}.` : ''}</p>
        <button onClick={() => dispatch({ type: 'END_DELEGATION', office: post })} className="label mt-1 text-alarm hover:underline">Take it back</button>
      </div>
    );
  }
  if (!tracks.length) return null;
  const can = canDelegate(s, post, track, left);
  return (
    <div className="mt-2 text-[13px]">
      <button onClick={() => setOpen(!open)} className="label text-state hover:underline">{open ? 'Not now' : 'Delegate an objective →'}</button>
      {open && (
        <div className="mt-1 space-y-1.5 border-l-2 border-state/40 pl-3">
          <p className="text-ink-soft">The minister launches the next reforms on the track within the budget, without asking. Bills, overruns and anything outside the limits come back to you. A six-month target comes with it.</p>
          <p className="flex flex-wrap items-center gap-2">
            <span className="label text-ink-soft">Objective</span>
            {tracks.map((t) => <button key={t} onClick={() => setTrack(t)} className={`border px-2 ${t === track ? 'border-state' : 'border-ink/20 text-ink-soft'}`}>{ISSUE_NAME[t] ?? t}</button>)}
          </p>
          <p className="flex flex-wrap items-center gap-2">
            <span className="label text-ink-soft">Budget</span>
            {BUDGETS.map((b) => <button key={b} onClick={() => setBudget(b)} className={`border px-2 ${b === budget ? 'border-state' : 'border-ink/20 text-ink-soft'}`}>₦{Math.round(b * 1000)}bn</button>)}
            <span className="label text-ink-soft">Term</span>
            {[6, 12, 24].map((m) => <button key={m} onClick={() => setMonths(m)} className={`border px-2 ${m === months ? 'border-state' : 'border-ink/20 text-ink-soft'}`}>{m} months</button>)}
            <span className="label text-ink-soft">Reports</span>
            {([3, 1] as const).map((r) => <button key={r} onClick={() => setReporting(r)} className={`border px-2 ${r === reporting ? 'border-state' : 'border-ink/20 text-ink-soft'}`}>{r === 1 ? 'monthly' : 'quarterly'}</button>)}
          </p>
          <button disabled={!can.ok} title={can.reason} onClick={() => { dispatch({ type: 'DELEGATE', office: post, track, budget, months, reporting }); setOpen(false); }} className={`border px-3 py-1 font-serif ${can.ok ? 'border-state/50 text-state hover:bg-state/10' : 'border-ink/10 text-ink-soft'}`}>
            Delegate · 2 capital, 1 move{can.reason ? ` · ${can.reason}` : ''}
          </button>
        </div>
      )}
    </div>
  );
}

/** For the register: settlements in force and objectives delegated. */
export function RegisterSettlements({ s }: { s: GameState }) {
  const deals = Object.values(s.bills ?? {}).filter((b) => b.passed !== undefined && b.concessions.length);
  const dels = Object.values(s.delegations ?? {});
  const owing = s.favours.filter((f) => f.dir === 'owing');
  if (!deals.length && !dels.length && !owing.length) return null;
  return (
    <>
      {deals.length > 0 && (
        <section className="mt-6">
          <h3 className="label text-ink-soft">Political settlements · laws passed with concessions</h3>
          <ul className="mt-2 space-y-1 text-[13px]">
            {deals.map((b) => (
              <li key={b.id} className="border-b border-ink/10 py-1">
                <span className="font-serif">{MILESTONE_BY_ID[b.id]?.m.name ?? b.id}</span> <span className="text-ink-soft">· passed {mo(Math.max(0, s.turn - b.passed!))} ago</span>
                <span className="block text-ink-soft">{b.concessions.map((c) => `${personView(s, c.voter).short}: ${CONCESSIONS[c.kind].name.toLowerCase()}${c.revoked ? ' (withdrawn)' : ''}`).join(' · ')}{b.deferred ? ` · in force in ${mo(Math.max(0, b.deferred.due - s.turn))}` : ''}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      {dels.length > 0 && (
        <section className="mt-6">
          <h3 className="label text-ink-soft">Delegated objectives</h3>
          <ul className="mt-2 space-y-1 text-[13px]">
            {dels.map((d) => <li key={d.office} className="border-b border-ink/10 py-1">{personView(s, d.office).name}: {ISSUE_NAME[d.track] ?? d.track} · ₦{Math.round(d.spent * 1000)}bn of ₦{Math.round(d.budget * 1000)}bn · ends in {mo(Math.max(0, d.until - s.turn))}</li>)}
          </ul>
        </section>
      )}
      {owing.length > 0 && (
        <section className="mt-6">
          <h3 className="label text-ink-soft">Personal debts the President owes · {owing.length}</h3>
          <ul className="mt-2 space-y-1 text-[13px]">
            {owing.map((f) => <li key={f.id} className="border-b border-ink/10 py-1">{f.why} <span className="text-ink-soft">· strength {f.size} · {mo(Math.max(0, s.turn - f.turn))} old{f.disputedAt !== undefined ? ' · repayment refused' : ''}</span></li>)}
          </ul>
        </section>
      )}
    </>
  );
}
