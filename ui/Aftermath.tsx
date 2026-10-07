'use client';

// AFTER OFFICE (plan 16)
// At the handover: a settlement with the heir or the winner, a forecast of what
// will survive, the year after as a set of decisions, and the country exported
// for another player with a letter that is kept apart from the record.

import { useState } from 'react';
import { RIVAL_BY_ID } from '../content/people';
import { exportCountry } from '../engine/exporting';
import { ensurePost, postStep } from '../engine/postoffice';
import { accepts, survivalForecast, termOptions } from '../engine/settlement';
import { winnerOf } from '../engine/succession';
import type { Action, GameState } from '../engine/types';

export function Aftermath({ s, dispatch }: { s: GameState; dispatch: (a: Action) => void }) {
  const w = winnerOf(s);
  const heir = s.flags['succession.won'] && s.flags['succession.backed'] ? String(s.flags['succession.backed']) : null;
  const counterpart = heir ? { id: heir, name: String(s.flags['successor.name'] ?? 'your successor'), rival: false } : !w.sameParty && w.rival ? { id: w.rival, name: RIVAL_BY_ID[w.rival]?.name ?? 'the winner', rival: true } : null;
  const opts = termOptions(s);
  const [pick, setPick] = useState<string[]>([]);
  const [letter, setLetter] = useState('');
  const forecast = survivalForecast(s);
  const step = postStep(structuredClone(s));
  const download = () => {
    const file = exportCountry(s, letter);
    const url = URL.createObjectURL(new Blob([JSON.stringify(file)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url; a.download = `oga-country-${s.president.name.replace(/\W+/g, '-').toLowerCase()}-${s.startYear}.json`;
    a.click(); URL.revokeObjectURL(url);
  };
  return (
    <>
      <section className="mt-10 border-t rule pt-6">
        <h2 className="label text-ink-soft">What will survive you</h2>
        <p className="mt-2 font-serif text-lg">About {Math.round(forecast.share * 100)}% of the reforms you delivered are likely to outlast the next government.</p>
        <ul className="mt-1 list-disc pl-5 text-sm">{forecast.lines.map((l) => <li key={l}>{l}</li>)}</ul>
        {counterpart && !s.settlement && (
          <div className="mt-4 border border-ink/20 p-4">
            <p className="font-serif text-lg">Negotiate a settlement with {counterpart.name}{counterpart.rival ? ', who beat you' : ''}</p>
            <p className="text-sm text-ink-soft">Up to five terms, two capital each. Public terms bind in politics; private ones are bargains, and recorded as such.</p>
            <ul className="mt-2 space-y-1 text-sm">
              {opts.map((t) => {
                const a = accepts(s, counterpart.id, t, counterpart.rival);
                return (
                  <li key={t.id}>
                    <label className="flex gap-2"><input type="checkbox" checked={pick.includes(t.id)} disabled={!pick.includes(t.id) && pick.length >= 5} onChange={(e) => setPick(e.target.checked ? [...pick, t.id] : pick.filter((x) => x !== t.id))} />
                      <span>{t.text}{t.improper ? <span className="text-alarm"> · a private bargain</span> : ''}{t.stateObligation ? <span className="text-ink-soft"> · an obligation of the state</span> : ''} <span className={a.ok ? 'text-state' : 'text-ink-soft'}>· {a.ok ? 'likely accepted' : a.why}</span></span>
                    </label>
                  </li>
                );
              })}
            </ul>
            <button disabled={!pick.length} onClick={() => dispatch({ type: 'SETTLE', with: counterpart.id, name: counterpart.name, terms: pick, rival: counterpart.rival })} className={`mt-2 border px-3 py-1 text-sm ${pick.length ? 'border-ink/30 hover:border-state' : 'border-ink/10 opacity-45'}`}>Propose these terms</button>
          </div>
        )}
        {s.settlement && (
          <div className="mt-4 text-sm">
            <p className="font-semibold">Settled with {s.settlement.withName}:</p>
            <ul className="list-disc pl-5">{s.settlement.terms.map((t) => <li key={t.id}>{t.text}{t.improper ? ' (private)' : ''}</li>)}{!s.settlement.terms.length && <li>Nothing was agreed.</li>}</ul>
          </div>
        )}
      </section>

      <section className="mt-10 border-t rule pt-6">
        <h2 className="label text-ink-soft">The year after</h2>
        {(s.post?.log ?? []).map((l) => <p key={l.title} className="mt-1 text-sm"><span className="font-semibold">{l.title}.</span> {l.choice}. {l.text}</p>)}
        {step ? (
          <div className="mt-3 border border-ink/20 p-4">
            <p className="font-serif text-lg">{step.title}</p>
            <p className="text-sm">{step.text}</p>
            <div className="mt-2 grid gap-1 sm:grid-cols-2">{step.choices.map((c) => <button key={c.id} onClick={() => dispatch({ type: 'POST', choice: c.id })} className="border border-ink/30 px-3 py-1 text-left text-sm hover:border-state"><span className="font-semibold">{c.label}</span> <span className="text-ink-soft">{c.text}</span></button>)}</div>
            <p className="label mt-2 text-ink-soft">Influence left: {ensurePost(structuredClone(s)).influence}</p>
          </div>
        ) : <p className="mt-1 text-sm text-ink-soft">The first year out is over.</p>}
      </section>

      <section className="mt-10 border-t rule pt-6">
        <h2 className="label text-ink-soft">Hand the country to another player</h2>
        <p className="mt-1 text-sm text-ink-soft">The file carries the whole country as you left it, the record of the handover, and your letter. Your letter is your account; the next President will see the record beside it.</p>
        <textarea value={letter} onChange={(e) => setLetter(e.target.value)} rows={4} placeholder="A letter to whoever comes next." className="mt-2 w-full border border-ink/25 bg-paper p-2 text-sm" />
        <button onClick={download} className="mt-2 border border-ink/30 px-3 py-1 text-sm hover:border-state">Export this country</button>
      </section>
    </>
  );
}
