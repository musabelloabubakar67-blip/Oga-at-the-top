'use client';

import { verdict } from '../engine/legacy';
import type { GameState } from '../engine/types';

export function VerdictScreen({ s, onDone }: { s: GameState; onDone: () => void }) {
  const v = verdict(s);
  const tone = (g: string) => (g === 'Transformed' || g === 'Stronger' ? 'text-state' : g === 'Held' ? 'text-ink-soft' : 'text-alarm');
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="fade-in text-center">
        <p className="label text-honour">President {s.president.name} · {s.president.party} · {v.years}</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-ivory sm:text-6xl">“{v.epithet}”</h1>
      </div>

      <article className="paper slide-in mt-10 p-6 sm:p-10">
        <div className="space-y-4 font-serif text-xl leading-relaxed">
          {v.narrative.map((p, i) => <p key={i} className={i === v.narrative.length - 1 ? 'italic text-ink-soft' : ''}>{p}</p>)}
        </div>

        <h2 className="label mt-10 border-b rule pb-2 text-ink-soft">Against what you inherited</h2>
        <ul className="mt-2 divide-y divide-ink/10">
          {v.dims.map((d) => (
            <li key={d.name} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5">
              <span className="font-serif text-lg">{d.name}</span>
              <span className="text-right">
                <span className={`font-serif text-lg ${tone(d.grade)}`}>{d.grade}</span>
                <span className="label block text-ink-soft">{d.from} → {d.to}</span>
              </span>
            </li>
          ))}
        </ul>

        {v.defining.length > 0 && (
          <>
            <h2 className="label mt-10 border-b rule pb-2 text-ink-soft">What you will be remembered for</h2>
            <ul className="mt-3 space-y-1.5 font-serif text-lg">
              {v.defining.map((d, i) => <li key={i}><span className="mr-2 text-honour">◆</span>{d}</li>)}
            </ul>
          </>
        )}

        <h2 className="label mt-10 border-b rule pb-2 text-ink-soft">The bill left behind</h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 font-serif text-lg">
          {v.left.map((d, i) => <li key={i}>{d}</li>)}
        </ul>

        {v.ledger && (
          <section className="mt-10 bg-wood p-5 text-ivory">
            <p className="label text-honour">The private ledger</p>
            <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 font-serif sm:grid-cols-4">
              <div><dt className="label text-mute">Looked away</dt><dd className="text-2xl">{v.ledger.tolerated}×</dd></div>
              <div><dt className="label text-mute">Political</dt><dd className="text-2xl">₦{Math.round(v.ledger.political)}bn</dd></div>
              <div><dt className="label text-mute">Personal</dt><dd className="text-2xl">₦{Math.round(v.ledger.personal)}bn</dd></div>
              <div><dt className="label text-mute">People who know</dt><dd className="text-2xl">{v.ledger.witnesses}</dd></div>
            </dl>
            <p className="mt-4 font-serif text-ivory/85">Paper trail: {v.ledger.trail}. {v.ledger.bought}</p>
            <p className="mt-1 font-serif italic text-honour">{v.ledger.aftermath}</p>
          </section>
        )}

        <div className="mt-10 text-right">
          <button onClick={onDone} className="bg-state px-6 py-3 font-serif text-lg text-paper hover:bg-state-lit">Enter the history books</button>
        </div>
      </article>
    </main>
  );
}
