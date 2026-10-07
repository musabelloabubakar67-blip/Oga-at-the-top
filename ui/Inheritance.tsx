'use client';

// WHAT YOU INHERITED (plan 16)
// The handover, the predecessor's private letter (their account), the dossier
// built from the record (which may disagree with the letter), the settlement
// they negotiated and what you choose to do with each term, and how their
// succession is being judged.

import { movesLeft } from '../engine/reduce';
import { successionVerdict, termAdvice, type Stance } from '../engine/settlement';
import type { Action, GameState } from '../engine/types';

const STANCES: { id: Stance; label: string }[] = [
  { id: 'honoured', label: 'Honour it' }, { id: 'renegotiated', label: 'Reopen it · 3 capital' }, { id: 'broken', label: 'Break it' }, { id: 'investigated', label: 'Investigate it' },
];

export function Inheritance({ s, dispatch }: { s: GameState; dispatch: (a: Action) => void }) {
  const inh = s.inheritance;
  if (!inh) return null;
  const left = movesLeft(s);
  const v = successionVerdict(s);
  return (
    <section className="paper p-6 xl:p-8">
      <p className="label text-state">What you inherited · {inh.kind === 'heir' ? 'as the chosen heir' : inh.kind === 'rival' ? 'from a defeated government' : inh.kind === 'disgrace' ? 'after a President left in disgrace' : 'as the party\'s replacement'}</p>
      <h2 className="mt-1 font-serif text-3xl">From {inh.predecessor}</h2>
      <p className="mt-2 text-sm">{inh.publicHandover}</p>
      {inh.letter && (
        <div className="mt-3 border-l-2 border-honour pl-3">
          <p className="label text-honour">A private letter · their account, not the record</p>
          <p className="font-serif italic">{inh.letter}</p>
        </div>
      )}
      <h3 className="label mt-5 border-b rule pb-1 text-ink-soft">The dossier · built from the record</h3>
      <ul className="mt-1 space-y-1 text-[13px] leading-snug">
        {inh.dossier.map((d) => <li key={d.label}><span className="font-semibold">{d.label}:</span> {d.items.slice(0, 6).join('; ')}{d.items.length > 6 ? `; and ${d.items.length - 6} more` : ''}.</li>)}
      </ul>
      {inh.settlement && (
        <>
          <h3 className="label mt-5 border-b rule pb-1 text-ink-soft">The settlement {inh.predecessor} negotiated{inh.settlement.kind === 'heir' ? ' with you' : ''}</h3>
          <ul className="mt-1 space-y-2 text-[13px] leading-snug">
            {inh.settlement.terms.map((t) => (
              <li key={t.id} className="border border-ink/15 p-2">
                <p><span className="font-semibold">{t.text}</span>{t.improper ? <span className="text-alarm"> · a private bargain</span> : ' · public'}{t.stateObligation ? ' · an obligation of the state' : ''}</p>
                <p className="text-ink-soft">{termAdvice(s, t)}</p>
                {inh.stances[t.id] ? <p className="label text-state">You {inh.stances[t.id]} it.</p> : (
                  <div className="mt-1 flex flex-wrap gap-1">{STANCES.filter((x) => x.id !== 'investigated' || t.improper).map((x) => <button key={x.id} disabled={left <= 0} onClick={() => dispatch({ type: 'TERM', id: t.id, stance: x.id })} className={`border px-2 py-0.5 ${left > 0 ? 'border-ink/30 hover:border-state' : 'border-ink/10 opacity-45'}`}>{x.label}</button>)}</div>
                )}
              </li>
            ))}
            {!inh.settlement.terms.length && <li className="text-ink-soft">Nothing was agreed.</li>}
          </ul>
        </>
      )}
      {v && (
        <>
          <h3 className="label mt-5 border-b rule pb-1 text-ink-soft">How {inh.predecessor}'s succession is judged, so far</h3>
          <p className="mt-1 text-[13px] leading-snug">{v.text}</p>
        </>
      )}
    </section>
  );
}
