'use client';

import { breakdown } from '../engine/election';
import { useEffect, useState } from 'react';
import type { GameState } from '../engine/types';
import { fill } from '../engine/text';

export function ElectionNight({ s, onDone }: { s: GameState; onDone: () => void }) {
  const result = s.election!;
  const total = result.states.length;
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (shown >= total) return;
    // The last few declarations are slower. They are the close ones.
    const t = setTimeout(() => setShown((n) => n + 1), shown > total - 8 ? 1500 : 650);
    return () => clearTimeout(t);
  }, [shown, total]);

  const declared = result.states.slice(0, shown);
  let votesFor = 0, votesAgainst = 0, spread = 0, won = 0;
  for (const r of declared) {
    votesFor += r.voters * r.share; votesAgainst += r.voters * r.opp;
    if (r.share >= 25) spread++;
    if (r.won) won++;
  }
  const sum = votesFor + votesAgainst || 1;
  const pct = (votesFor / sum) * 100;
  const done = shown >= total;
  const feed = [...declared].reverse();

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <p className="label text-honour">Presidential election · National collation centre, Abuja</p>
      <h1 className="mt-1 font-serif text-4xl text-ivory sm:text-5xl">Election night</h1>

      <section className="mt-6 border border-ivory/10 p-4 sm:p-5">
        <div className="flex items-baseline justify-between font-serif">
          <span className="text-xl text-ivory">{s.president.name} <span className="text-mute">· {s.president.partyShort}</span></span>
          <span className="text-xl text-ivory"><span className="text-mute">{fill(s, '{OPPARTY}')} · </span>{fill(s, '{OPP}')}</span>
        </div>
        <div className="mt-3 flex h-3 overflow-hidden bg-ivory/10">
          <div className="bg-state-lit transition-all duration-500" style={{ width: `${shown ? pct : 50}%` }} />
          <div className="flex-1 bg-alarm" />
        </div>
        <div className="mt-2 flex justify-between font-serif text-3xl text-ivory">
          <span>{shown ? pct.toFixed(1) : '—'}%</span>
          <span>{shown ? (100 - pct).toFixed(1) : '—'}%</span>
        </div>
        <div className="label mt-3 flex flex-wrap justify-between gap-2 text-mute">
          <span>Declared {shown} of {total}</span>
          <span>States won {won}</span>
          <span className={spread >= 25 ? 'text-state-lit' : ''}>25% in {spread} of the required 25</span>
        </div>
      </section>

      {done ? (
        <section className="paper slide-in mt-6 p-6 sm:p-8">
          <p className="label text-ink-soft">Declaration of result</p>
          <h2 className="mt-1 font-serif text-3xl leading-tight">
            {result.won
              ? `President ${s.president.name} is returned for a second term.`
              : `${fill(s, '{OPP}')} is declared President-elect.`}
          </h2>
          <p className="mt-3 font-serif text-lg text-ink-soft">
            {result.won
              ? `Margin: ${result.margin.toFixed(1)} points. Approval on polling day was ${Math.round(result.approval)}%. The petition will be filed by Friday.`
              : `Margin: ${Math.abs(result.margin).toFixed(1)} points. Approval on polling day was ${Math.round(result.approval)}%. You have three months left in the Villa.`}
          </p>
          {(() => {
            const lines = breakdown(s, result.kind);
            return (
              <div className="mt-3">
                <p className="label text-ink-soft">What decided it, in points of margin</p>
                <ul className="mt-1 grid gap-x-6 text-sm sm:grid-cols-2">
                  {lines.map((l) => (
                    <li key={l.label} className="flex justify-between gap-3 border-b border-ink/10 py-0.5"><span>{l.label}</span><span className={l.value >= 0 ? 'text-state' : 'text-alarm'}>{l.value > 0 ? '+' : '−'}{Math.abs(l.value).toFixed(1)}</span></li>
                  ))}
                </ul>
                <p className="mt-1 text-[12.5px] text-ink-soft">Each state also has its own lean, its zone's approval and what you built there; the rest is the mood on the day.</p>
              </div>
            );
          })()}
          {result.swing !== undefined && Math.abs(result.swing) >= 1 && (
            <p className="mt-2 text-sm text-ink-soft">
              The mood of the country on the day moved the vote {Math.abs(result.swing * 2).toFixed(1)} points {result.swing > 0 ? 'towards you' : 'away from you'}{Math.abs(result.swing * 2) > Math.abs(result.margin) ? ', more than the margin itself' : ''}.
            </p>
          )}
          <div className="mt-6 text-right">
            <button onClick={onDone} autoFocus className="bg-ink px-5 py-2.5 font-serif text-paper hover:bg-state">
              {result.won ? 'Back to work' : 'Return to the Villa'}
            </button>
          </div>
        </section>
      ) : (
        <div className="mt-4 text-right">
          <button onClick={() => setShown(total)} className="label text-mute hover:text-ivory">Skip to the declaration</button>
        </div>
      )}

      <ol className="mt-6 divide-y divide-ivory/10">
        {feed.map((r, i) => (
          <li key={r.id} className={`flex flex-wrap items-baseline gap-x-4 py-2.5 ${i === 0 && !done ? 'fade-in' : ''}`}>
            <span className="w-28 font-serif text-lg text-ivory">{r.name}</span>
            <span className={`label w-32 whitespace-nowrap ${r.won ? 'text-state-lit' : 'text-[#d06a5c]'}`}>{r.won ? 'Held' : 'Lost'} · {r.share.toFixed(0)}–{r.opp.toFixed(0)}</span>
            {r.line && <span className="font-serif text-sm italic text-ivory/65">{r.line}</span>}
          </li>
        ))}
        {!shown && <li className="py-6 font-serif italic text-mute">The results viewing portal is experiencing technical challenges. Collation continues manually.</li>}
      </ol>
    </main>
  );
}
