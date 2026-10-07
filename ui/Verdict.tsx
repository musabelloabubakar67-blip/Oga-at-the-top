'use client';

import { breakdown } from '../engine/election';
import { verdict } from '../engine/legacy';
import { winnerOf } from '../engine/succession';
import type { Action, GameState } from '../engine/types';
import { Aftermath } from './Aftermath';
import { useState } from 'react';
import { shareText } from '../engine/history';

/** A shareable extract (plan 17): what happened, with the private ledger included when there is one. */
function ShareVerdict({ s }: { s: GameState }) {
  const [copied, setCopied] = useState(false);
  const text = shareText(s);
  return (
    <section className="mt-10 border-t rule pt-6">
      <h2 className="label text-ink-soft">Share the verdict</h2>
      <pre className="mt-2 whitespace-pre-wrap bg-ink/5 p-3 font-mono text-[12.5px]">{text}</pre>
      <button onClick={() => { navigator.clipboard?.writeText(text).then(() => setCopied(true)).catch(() => setCopied(false)); }} className="mt-2 border border-ink/30 px-3 py-1 text-sm hover:border-state">{copied ? 'Copied' : 'Copy it'}</button>
    </section>
  );
}

export function VerdictScreen({ s, onDone, onSucceed, dispatch }: { s: GameState; onDone: () => void; onSucceed: () => void; dispatch: (a: Action) => void }) {
  const v = verdict(s);
  const w = winnerOf(s);
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
              <span className="ml-auto text-right">
                <span className={`font-serif text-lg ${tone(d.grade)}`}>{d.grade}</span>
                <span className="label block text-ink-soft">{d.from.includes('→') ? `${d.from} · ${d.to}` : `${d.from} → ${d.to}`}</span>
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

        {s.succession && (
          <>
            <h2 className="label mt-10 border-b rule pb-2 text-ink-soft">The election you were not in</h2>
            <p className="mt-3 font-serif text-lg">
              {String(s.flags['successor.name'] ?? 'Your party\'s candidate')} {s.succession.won ? 'won' : 'lost'} by {Math.abs(s.succession.margin).toFixed(1)} points, carrying {s.succession.states.filter((x) => x.won).length} of {s.succession.states.length} states.
            </p>
            <p className="label mt-3 text-ink-soft">What decided it, in points of margin</p>
            <ul className="mt-1 grid gap-x-6 text-sm sm:grid-cols-2">
              {breakdown(s, 'succession').map((l) => (
                <li key={l.label} className="flex justify-between gap-3 border-b border-ink/10 py-0.5"><span>{l.label}</span><span className={l.value >= 0 ? 'text-state' : 'text-alarm'}>{l.value > 0 ? '+' : '−'}{Math.abs(l.value).toFixed(1)}</span></li>
              ))}
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

        <section className={`mt-10 border-l-4 p-5 ${v.after.bad ? 'border-alarm bg-alarm/5' : 'border-state bg-state/5'}`}>
          <p className="label text-ink-soft">After noon on the last day</p>
          <h2 className={`mt-1 font-serif text-3xl ${v.after.bad ? 'text-alarm' : 'text-state'}`}>{v.after.title}</h2>
          <p className="mt-2 font-serif text-lg leading-snug">{v.after.text}</p>
          {(v.after.risk.length > 0 || v.after.shield.length > 0) && (
            <div className="mt-3 grid gap-4 text-sm sm:grid-cols-2">
              <div><p className="label text-alarm">Against you</p><ul className="mt-1 list-disc pl-5">{v.after.risk.map((x) => <li key={x}>{x}</li>)}{!v.after.risk.length && <li>Nothing</li>}</ul></div>
              <div><p className="label text-state">Protecting you</p><ul className="mt-1 list-disc pl-5">{v.after.shield.map((x) => <li key={x}>{x}</li>)}{!v.after.shield.length && <li>Nobody</li>}</ul></div>
            </div>
          )}
        </section>

        <ShareVerdict s={s} />
        <Aftermath s={s} dispatch={dispatch} />

        <section className="mt-10 border-t rule pt-6">
          <h2 className="label text-ink-soft">What happens next</h2>
          <p className="mt-2 font-serif text-lg leading-snug">{w.how}</p>
          <p className="mt-1 text-sm leading-snug text-ink-soft">
            You can take the oath as the next President, of {w.party}, in the country exactly as you have left it: the same debts, savings, reforms, half-built projects and unpaid bills. {w.sameParty ? '' : 'You will be governing from the other side.'}
          </p>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button onClick={onDone} className="border border-ink/30 px-5 py-3 font-serif text-lg hover:border-state">Enter the history books</button>
            <button onClick={onSucceed} className="bg-state px-6 py-3 font-serif text-lg text-paper hover:bg-state-lit">Take the oath as the next President</button>
          </div>
        </section>
      </article>
    </main>
  );
}
