'use client';

import { FINANCIER, TYCOON_BY_ID } from '../content/tycoons';
import { useState } from 'react';
import { TRACKS } from '../content/agenda';
import { reformName } from '../engine/reforms';
import { DEFAULT_PARTY, FINANCE_CANDIDATES } from '../content/names';
import { SCENARIOS } from '../content/scenarios';
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

/** What the next President is handed, when the world carries on. */
export interface Handover { party: string; partyShort: string; sameParty: boolean; how: string; notes: string[]; era?: { title: string; text: string }[]; predecessor: string; epithet: string; /** Finance Ministers of the last government. */ served?: string[] }

export function SetupScreen({ onStart, onBack, handover }: { onStart: (s: Setup) => void; onBack: () => void; handover?: Handover }) {
  const [name, setName] = useState('');
  const [scenario, setScenario] = useState('standard');
  const [address, setAddress] = useState<'sir' | 'ma'>('sir');
  const [party, setParty] = useState(handover?.party ?? DEFAULT_PARTY.name);
  const [partyShort, setPartyShort] = useState(handover?.partyShort ?? DEFAULT_PARTY.short);
  const [home, setHome] = useState('KN');
  const [background, setBackground] = useState<Background>('governor');
  // A Finance Minister of the last government is marked; from the other side, they will not serve you.
  const barred = (name: string) => !!handover && !handover.sameParty && !!handover.served?.includes(name);
  const [finance, setFinance] = useState((FINANCE_CANDIDATES.find((c) => !barred(c.name)) ?? FINANCE_CANDIDATES[0]).name);
  const [priorities, setPriorities] = useState<string[]>([]);
  const toggle = (id: string) => setPriorities((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : p));
  const ready = priorities.length === 4;

    const card = (on: boolean) =>
    `text-left border p-4 transition-colors ${on ? 'border-state bg-state/10' : 'border-ink/20 hover:border-ink/50'}`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="paper cert slide-in px-6 py-10 sm:px-14 sm:py-14">
        <header className="text-center">
          <div className="cert-seal mx-auto"><span className="text-2xl leading-none">✦</span></div>
          <p className="label mt-4 text-ink-soft">Federal Republic of Nigeria</p>
          <p className="label text-ink-soft">Independent Electoral Commission</p>
          <h1 className="mt-3 font-serif text-4xl tracking-wide sm:text-5xl">Certificate of Return</h1>
          <p className="label mt-2 text-ink-soft">Form EC 8E(A) · Presidential election · No. 000{handover ? '2' : '1'}</p>
          {handover && <p className="label mt-1 text-state">The next President, in the same country</p>}
        </header>

        <p className="mx-auto mt-8 max-w-2xl text-center font-serif text-xl leading-[2.4]">
          This is to certify that
          {' '}<input aria-label="Surname of the President" className="cert-field w-48" value={name} maxLength={24} placeholder="surname" onChange={(e) => setName(e.target.value)} />{' '}
          of
          {' '}<select aria-label="Home state" className="cert-field" value={home} onChange={(e) => setHome(e.target.value)}>
            {STATES.map((s) => <option key={s.id} value={s.id}>{s.name} State, {ZONE_NAME[s.zone]}</option>)}
          </select>,
          candidate of the
          {' '}<input aria-label="Party" className="cert-field w-80 max-w-full" value={party} maxLength={48} disabled={!!handover} onChange={(e) => setParty(e.target.value)} />{' '}
          (<input aria-label="Acronym" className="cert-field w-20" value={partyShort} maxLength={6} disabled={!!handover} onChange={(e) => setPartyShort(e.target.value.toUpperCase())} />),
          having satisfied the requirements of the law and scored the highest number of votes, is hereby declared elected and returned as
          {' '}<span className="whitespace-nowrap font-semibold">President of the Federal Republic.</span>
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <span className="label text-ink-soft">To be addressed as</span>
          {(['sir', 'ma'] as const).map((a) => (
            <button key={a} onClick={() => setAddress(a)} className={`${card(address === a)} px-4 py-1.5 font-serif`}>
              {a === 'sir' ? 'Mr President · Sir' : 'Madam President · Ma'}
            </button>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="cert-sign text-3xl text-ink">A. B. Returning</p>
            <p className="mt-1 w-56 border-t border-ink/50 pt-1 label text-ink-soft">Chairman and Chief Returning Officer</p>
            <p className="mt-1 text-sm text-ink-soft">Given under my hand at Abuja.</p>
          </div>
          <span className="stamp text-state" style={{ transform: 'rotate(-8deg)' }}>DECLARED</span>
        </div>

        <p className="mt-12 text-center font-serif italic text-ink-soft">The schedules below form part of this certificate. Complete all four.</p>

        {handover ? (
          <section className="mt-10 border-l-2 border-honour bg-paper-dim px-4 py-3">
            <h2 className="label text-state">Schedule I · What you are being handed</h2>
            <p className="mt-1 font-serif text-lg leading-snug">{handover.how}</p>
            <p className="mt-1 text-sm text-ink-soft">President {handover.predecessor} is remembered as “{handover.epithet}”. The country is exactly as it was left: nothing has been reset.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 font-serif leading-snug">
              {handover.notes.map((n) => <li key={n}>{n}</li>)}
            </ul>
            {handover.era && handover.era.length > 0 && (
              <div className="mt-3">
                <p className="label text-state">The era you inherit</p>
                <ul className="mt-1 space-y-1.5">
                  {handover.era.map((x) => <li key={x.title}><span className="font-serif text-lg">{x.title}.</span> <span className="text-sm leading-snug text-ink-soft">{x.text}</span></li>)}
                </ul>
              </div>
            )}
          </section>
        ) : (
          <>
            <h2 className="schedule mt-10"><span className="label text-state">Schedule I</span><span className="font-serif text-xl">What you inherit</span></h2>
            <p className="mt-2 text-sm text-ink-soft">The country you are handed. It sets how hard the first two years are, and what the test is.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {SCENARIOS.map((x) => (
                <button key={x.id} onClick={() => setScenario(x.id)} className={card(scenario === x.id)}>
                  <span className="block font-serif text-lg">{x.name}</span><span className="label block text-ink-soft">{x.difficulty}</span>
                  <span className="mt-1 block text-sm leading-snug text-ink-soft">{x.blurb}</span>
                  <span className="mt-1.5 block text-[13px] leading-snug text-state">The test: {x.test}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <h2 className="schedule mt-10"><span className="label text-state">Schedule II</span><span className="font-serif text-xl">How you got here</span></h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {BACKGROUNDS.map((b) => (
            <button key={b.id} onClick={() => setBackground(b.id)} className={card(background === b.id)}>
              <span className="block font-serif text-lg">{b.name}</span>
              <span className="mt-1 block text-sm leading-snug text-ink-soft">{b.text}</span>
              <span className="mt-1.5 block text-[13px] leading-snug text-alarm">Your campaign was paid for by {TYCOON_BY_ID[FINANCIER[b.id]].name}, {TYCOON_BY_ID[FINANCIER[b.id]].title.replace(/^./, (x) => x.toLowerCase())}. You owe.</span>
            </button>
          ))}
        </div>

        <h2 className="schedule mt-10"><span className="label text-state">Schedule III</span><span className="font-serif text-xl">Your four-point agenda</span></h2>
        <p className="mt-2 text-sm text-ink-soft">Choose four of the {TRACKS.length} tracks ({priorities.length} chosen). These are what you promised, what the papers will hold you to, and where your reforms cost least. You can still act outside them, at a higher price.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {TRACKS.map((t) => (
            <button key={t.id} onClick={() => toggle(t.id)} className={card(priorities.includes(t.id))}>
              <span className="block font-serif text-lg">{t.name}</span>
              <span className="mt-1 block text-sm leading-snug text-ink-soft">{t.goal}. {t.milestones.filter((m) => (m.gen ?? 1) === 1).map((m) => reformName(null, m.id)).join(' · ')}</span>
              <span className="mt-1 block text-[13px] text-ink-soft">Deepening follows the foundations; repairs appear when the country needs them.</span>
            </button>
          ))}
        </div>

        <h2 className="schedule mt-10"><span className="label text-state">Schedule IV</span><span className="font-serif text-xl">Your first appointment: Minister of Finance</span></h2>
        <p className="mt-2 text-sm text-ink-soft">Three names are on the desk. What you read here is reputation. Reputation is sometimes wrong.</p>
        <div className="mt-3 grid gap-3">
          {FINANCE_CANDIDATES.map((c) => (
            <button key={c.name} disabled={barred(c.name)} onClick={() => setFinance(c.name)} className={`${card(finance === c.name)} ${barred(c.name) ? 'opacity-50' : ''}`}>
              <span className="block font-serif text-lg">{c.name}</span>
              <span className="mt-1 block text-sm leading-snug text-ink-soft">{c.blurb}</span>
              {handover?.served?.includes(c.name) && <span className="mt-1 block text-[13px] text-alarm">{barred(c.name) ? `Served as Finance Minister under President ${handover.predecessor}, of the party you beat. Will not serve you.` : `Served as Finance Minister under President ${handover.predecessor}.`}</span>}
            </button>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-between border-t rule pt-6">
          <button onClick={onBack} className="label text-ink-soft hover:text-ink">← Back</button>
          <button
            disabled={!ready}
            onClick={() => onStart({ seed: Date.now() % 2147483647, scenario, name, party, partyShort, home, background, address, finance, priorities })}
            className={`px-6 py-3 font-serif text-lg ${ready ? 'bg-state text-paper hover:bg-state-lit' : 'bg-ink/15 text-ink-soft'}`}
          >
            {ready ? 'So help me God' : `Choose ${4 - priorities.length} more ${4 - priorities.length === 1 ? 'priority' : 'priorities'}`}
          </button>
        </div>
      </div>
    </main>
  );
}
