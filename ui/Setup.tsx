'use client';

import { useState } from 'react';
import { TRACKS } from '../content/agenda';
import { DEFAULT_PARTY, FINANCE_CANDIDATES } from '../content/names';
import { STATES } from '../content/states';
import type { Background, Setup } from '../engine/types';
import { ZONE_NAME } from '../engine/vars';
import type { HistoryRecord } from './Game';

export function Title({ canContinue, history, onContinue, onNew }: {
  canContinue: boolean; history: HistoryRecord[]; onContinue: () => void; onNew: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="label text-honour">The Presidency · Federal Republic of Nigeria</p>
      <h1 className="mt-4 font-serif text-6xl leading-none text-ivory sm:text-7xl">Oga at the Top</h1>
      <p className="mt-6 max-w-xl font-serif text-xl leading-relaxed text-ivory/80">
        You have been sworn in. You can govern well. Doing the right thing and surviving long enough for it to work are two different problems.
      </p>
      <div className="mt-10 flex flex-wrap gap-3">
        {canContinue && (
          <button onClick={onContinue} className="bg-state px-6 py-3 font-serif text-lg text-ivory hover:bg-state-lit">
            Return to the Villa
          </button>
        )}
        <button onClick={onNew} className="border border-honour/60 px-6 py-3 font-serif text-lg text-ivory hover:bg-honour/10">
          {canContinue ? 'Begin a new presidency' : 'Take the oath'}
        </button>
      </div>
      {history.length > 0 && (
        <section className="mt-16">
          <p className="label text-mute">Past Presidents</p>
          <ul className="mt-3 divide-y divide-ivory/10 border-y border-ivory/10">
            {history.map((h, i) => (
              <li key={i} className="flex flex-wrap items-baseline justify-between gap-x-6 py-3">
                <span className="font-serif text-lg">President {h.name} <span className="text-mute">· {h.party} · {h.years}</span></span>
                <span className="font-serif italic text-honour">“{h.epithet}”</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <p className="mt-16 max-w-xl text-sm leading-relaxed text-mute">
        A work of satire. Every person, party, union, company and newspaper in this game is fictional. Any resemblance to anyone is the fault of the system.
      </p>
    </main>
  );
}

const BACKGROUNDS: { id: Background; name: string; text: string }[] = [
  { id: 'governor', name: 'Former governor', text: 'The party is yours and so are its habits. Strong with the structure; the auditors already know your name.' },
  { id: 'technocrat', name: 'Technocrat', text: 'Investors and the civil service trust you. The party has not decided whether you are one of them.' },
  { id: 'legislator', name: 'Career legislator', text: 'You know where every vote in the Assembly is buried. Your own office is less disciplined.' },
  { id: 'outsider', name: 'Outsider', text: 'The street and the press are with you. The party and the establishment are waiting for you to fail.' },
];

export function SetupScreen({ onStart, onBack }: { onStart: (s: Setup) => void; onBack: () => void }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState<'sir' | 'ma'>('sir');
  const [party, setParty] = useState(DEFAULT_PARTY.name);
  const [partyShort, setPartyShort] = useState(DEFAULT_PARTY.short);
  const [home, setHome] = useState('KN');
  const [background, setBackground] = useState<Background>('governor');
  const [finance, setFinance] = useState(FINANCE_CANDIDATES[0].name);
  const [priorities, setPriorities] = useState<string[]>([]);
  const toggle = (id: string) => setPriorities((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : p));
  const ready = priorities.length === 4;

  const input = 'w-full border-b border-ink/30 bg-transparent py-2 font-serif text-xl text-ink outline-none focus:border-state';
  const card = (on: boolean) =>
    `text-left border p-4 transition-colors ${on ? 'border-state bg-state/10' : 'border-ink/20 hover:border-ink/50'}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="paper slide-in p-6 sm:p-10">
        <div className="flex items-start justify-between">
          <div>
            <p className="label text-ink-soft">Independent Electoral Commission</p>
            <h1 className="mt-1 font-serif text-3xl">Certificate of Return</h1>
          </div>
          <span className="stamp text-state text-xs">DECLARED</span>
        </div>
        <p className="mt-4 font-serif text-ink-soft">
          Having satisfied the requirements of the law and scored the highest number of votes, the candidate named below is hereby returned as President.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          <label className="block">
            <span className="label text-ink-soft">Surname of the President</span>
            <input className={input} value={name} maxLength={24} placeholder="e.g. Adewale" onChange={(e) => setName(e.target.value)} />
          </label>
          <div>
            <span className="label text-ink-soft">Form of address</span>
            <div className="mt-2 flex gap-2">
              {(['sir', 'ma'] as const).map((a) => (
                <button key={a} onClick={() => setAddress(a)} className={`${card(address === a)} px-4 py-2 font-serif`}>
                  {a === 'sir' ? 'Mr President · Sir' : 'Madam President · Ma'}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="label text-ink-soft">Party</span>
            <input className={input} value={party} maxLength={48} onChange={(e) => setParty(e.target.value)} />
          </label>
          <label className="block">
            <span className="label text-ink-soft">Acronym</span>
            <input className={input} value={partyShort} maxLength={6} onChange={(e) => setPartyShort(e.target.value.toUpperCase())} />
          </label>
          <label className="block sm:col-span-2">
            <span className="label text-ink-soft">Home state</span>
            <select className={input} value={home} onChange={(e) => setHome(e.target.value)}>
              {STATES.map((s) => <option key={s.id} value={s.id}>{s.name} — {ZONE_NAME[s.zone]}</option>)}
            </select>
          </label>
        </div>

        <h2 className="label mt-10 text-ink-soft">How you got here</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {BACKGROUNDS.map((b) => (
            <button key={b.id} onClick={() => setBackground(b.id)} className={card(background === b.id)}>
              <span className="block font-serif text-lg">{b.name}</span>
              <span className="mt-1 block text-sm leading-snug text-ink-soft">{b.text}</span>
            </button>
          ))}
        </div>

        <h2 className="label mt-10 text-ink-soft">Your four-point agenda</h2>
        <p className="mt-1 text-sm text-ink-soft">Choose four of the ten. These are what you promised, what the papers will hold you to, and where your reforms cost least. You can still act outside them, at a higher price.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {TRACKS.map((t) => (
            <button key={t.id} onClick={() => toggle(t.id)} className={card(priorities.includes(t.id))}>
              <span className="block font-serif text-lg">{t.name}</span>
              <span className="mt-1 block text-sm leading-snug text-ink-soft">{t.goal}. {t.milestones.map((m) => m.name).join(' · ')}</span>
            </button>
          ))}
        </div>

        <h2 className="label mt-10 text-ink-soft">Your first appointment: Minister of Finance</h2>
        <p className="mt-1 text-sm text-ink-soft">Three names are on the desk. What you read here is reputation. Reputation is sometimes wrong.</p>
        <div className="mt-3 grid gap-3">
          {FINANCE_CANDIDATES.map((c) => (
            <button key={c.name} onClick={() => setFinance(c.name)} className={card(finance === c.name)}>
              <span className="block font-serif text-lg">{c.name}</span>
              <span className="mt-1 block text-sm leading-snug text-ink-soft">{c.blurb}</span>
            </button>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between border-t rule pt-6">
          <button onClick={onBack} className="label text-ink-soft hover:text-ink">← Back</button>
          <button
            disabled={!ready}
            onClick={() => onStart({ seed: Date.now() % 2147483647, name, party, partyShort, home, background, address, finance, priorities })}
            className={`px-6 py-3 font-serif text-lg ${ready ? 'bg-state text-paper hover:bg-state-lit' : 'bg-ink/15 text-ink-soft'}`}
          >
            {ready ? 'So help me God' : `Choose ${4 - priorities.length} more ${4 - priorities.length === 1 ? 'priority' : 'priorities'}`}
          </button>
        </div>
      </div>
    </main>
  );
}
