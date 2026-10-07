'use client';

// THE TITLE AND THE TRANSITION INTO OFFICE (plan 02)
// The opening is a sequence of decisions: the inheritance and its dossier, who
// the President is, the coalition that won and the money behind it, the
// mandate and an optional governing rule, the first government, and the
// completed certificate with the measured consequences of every choice. The
// engine applies each choice (engine/opening.ts); nothing is defaulted.

import { useMemo, useState, type ReactNode } from 'react';
import { TRACKS } from '../content/agenda';
import { CANDIDATES, CANDIDATE_BY_ID } from '../content/candidates';
import { DOSSIER_BY_SCENARIO } from '../content/dossiers';
import { ORIGIN } from '../content/federal';
import { CAST, DEFAULT_PARTY, FINANCE_CANDIDATES, NAMES } from '../content/names';
import { PERSON_BY_ID } from '../content/people';
import { CONSTRAINTS, FINANCIERS, ROUTES } from '../content/routes';
import { SCENARIOS } from '../content/scenarios';
import { STATES, STATE_BY_ID } from '../content/states';
import { TYCOON_BY_ID } from '../content/tycoons';
import { CFG } from '../engine/config';
import { describe } from '../engine/effects';
import { routeOpen, startingEffects, validateSetup } from '../engine/opening';
import { newGame } from '../engine/reduce';
import { reformName } from '../engine/reforms';
import type { Background, Fx, GameState, Setup, ZoneId } from '../engine/types';
import { ZONE_NAME } from '../engine/vars';
import type { HistoryRecord } from './Game';

export function Title({ canContinue, history, onContinue, onNew, onInherit }: {
  canContinue: boolean; history: HistoryRecord[]; onContinue: () => void; onNew: () => void;
  /** Inherit a country another player exported (plan 16). Returns a reason if the file is refused. */
  onInherit?: (text: string) => string | null;
}) {
  const [refused, setRefused] = useState<string | null>(null);
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
        {onInherit && (
          <label className="cursor-pointer border border-ivory/25 px-6 py-3 font-serif text-lg text-ivory hover:bg-ivory/5">
            Inherit a country from another player
            <input type="file" accept="application/json,.json" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setRefused(onInherit(await f.text())); }} />
          </label>
        )}
      </div>
      {refused && <p className="mt-3 max-w-xl text-sm text-[#e08a7c]">{refused}</p>}
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

/** Professional background only. The coalition and the money are separate choices. */
const BACKGROUNDS: { id: Background; name: string; text: string }[] = [
  { id: 'governor', name: 'Former governor', text: 'The party is yours and so are its habits. Strong with the structure; the auditors already know your name.' },
  { id: 'technocrat', name: 'Technocrat', text: 'Investors and the civil service trust you. The party has not decided whether you are one of them.' },
  { id: 'legislator', name: 'Career legislator', text: 'You know where every vote in the Assembly is buried. Your own office is less disciplined.' },
  { id: 'outsider', name: 'Outsider', text: 'The street and the press are with you. The party and the establishment are waiting for you to fail.' },
];

function Effects({ fx }: { fx: Fx[] }) {
  const lines = describe(fx);
  if (!lines.length) return <p className="text-ink-soft">No measurable change.</p>;
  return <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5">{lines.map((c) => <li key={c.label} className={c.good ? 'text-state' : 'text-alarm'}>{c.arrows} {c.label}</li>)}</ul>;
}

/** What the next President is handed, when the world carries on. */
export interface Handover { party: string; partyShort: string; sameParty: boolean; how: string; notes: string[]; era?: { title: string; text: string }[]; predecessor: string; epithet: string; /** Finance Ministers of the last government. */ served?: string[] }

/** The transition into office (plan 02): dossier, identity, route, money, mandate, first government, certificate, oath. */
const STEPS = ['The inheritance', 'Who you are', 'How you won', 'The mandate', 'The first government', 'The certificate'] as const;

const card = (on: boolean) => `text-left border p-4 transition-colors ${on ? 'border-state bg-state/10' : 'border-ink/20 hover:border-ink/50'}`;
const small = (on: boolean) => `text-left border px-3 py-1.5 text-sm transition-colors ${on ? 'border-state bg-state/10' : 'border-ink/20 hover:border-ink/50'}`;
const TEAM_OFFICES: { id: string; title: string }[] = [
  { id: 'cos', title: 'Chief of Staff' }, { id: 'min_defence', title: 'National Security Adviser' }, { id: 'min_power', title: 'Minister of Power' },
  { id: 'min_works', title: 'Minister of Works' }, { id: 'min_justice', title: 'Attorney General' }, { id: 'min_agric', title: 'Minister of Agriculture' },
  { id: 'min_service', title: 'Minister of Industry and the Public Service' },
];
const STATUS_TONE: Record<string, string> = { confirmed: 'text-state', 'partly true': 'text-honour', false: 'text-alarm', disputed: 'text-ink-soft' };

function Schedule({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="schedule"><span className="label text-state">{n}</span><span className="font-serif text-xl">{title}</span></h2>
      {children}
    </section>
  );
}

export function SetupScreen({ onStart, onBack, handover, previous }: { onStart: (s: Setup) => void; onBack: () => void; handover?: Handover; previous?: GameState }) {
  const [step, setStep] = useState(0);
  const [compact, setCompact] = useState(false);
  const [name, setName] = useState('');
  const [scenario, setScenario] = useState('standard');
  const [address, setAddress] = useState<'sir' | 'ma' | null>(null);
  const [party, setParty] = useState(handover?.party ?? DEFAULT_PARTY.name);
  const [partyShort, setPartyShort] = useState(handover?.partyShort ?? DEFAULT_PARTY.short);
  const [home, setHome] = useState('');
  const [background, setBackground] = useState<Background | null>(null);
  const [route, setRoute] = useState<string | null>(null);
  const [financier, setFinancier] = useState<string | null>(null);
  const [constraint, setConstraint] = useState<string>('');
  const barred = (n: string) => !!handover && !handover.sameParty && !!handover.served?.includes(n);
  const [finance, setFinance] = useState<string | null>(null);
  const [team, setTeam] = useState<Record<string, string>>({});
  const [priorities, setPriorities] = useState<string[]>([]);
  const [detail, setDetail] = useState(false);
  const toggle = (id: string) => setPriorities((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 4 ? [...p, id] : p));
  const seed = useMemo(() => Date.now() % 2147483647, []);
  const dossier = handover ? undefined : DOSSIER_BY_SCENARIO[scenario];

  const setup: Setup = {
    seed, scenario, name: name.trim(), party: party.trim(), partyShort: partyShort.trim(), home, background: background ?? 'governor', address: address ?? 'sir',
    finance: finance ?? '', priorities, route: route ?? undefined, financier: financier ?? undefined, constraint: constraint || undefined, team,
  };
  const problems = [
    ...(address ? [] : ['Choose how you will be addressed.']),
    ...(background ? [] : ['Choose your background.']),
    ...(route ? [] : ['Choose how you won.']),
    ...(financier ? [] : ['Choose who paid for the campaign.']),
    ...validateSetup(setup, { successorSameParty: handover?.sameParty, barredFinance: handover?.served?.filter(barred) }),
  ];
  const ready = problems.length === 0;
  const preview = useMemo(() => (ready ? startingEffects((x) => newGame(x, previous), setup) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ready, JSON.stringify(setup)]);
  const year = (previous ? previous.startYear + Math.floor((previous.turn - 1) / 12) : CFG.startYear);
  const reference = `EC/${year}/${String(seed % 100000).padStart(5, '0')}`;
  const show = (i: number) => compact || step === i;

  const routeOpenHere = (id: string) => routeOpen(id, scenario, handover ? handover.sameParty : undefined);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <div className="paper cert slide-in px-5 py-8 sm:px-12 sm:py-12">
        <header className="text-center">
          <div className="cert-seal mx-auto"><span className="text-2xl leading-none">✦</span></div>
          <p className="label mt-4 text-ink-soft">Federal Republic of Nigeria · The transition</p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl">{handover ? 'The next President, in the same country' : 'From the declaration to the oath'}</h1>
          <p className="mt-2 text-sm text-ink-soft">Every choice here has consequences you will meet in office. Nothing is chosen for you.</p>
        </header>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
          <ol className="flex flex-wrap gap-1.5">
            {STEPS.map((t, i) => (
              <li key={t}><button onClick={() => { setCompact(false); setStep(i); }} className={`label border px-2 py-1 ${!compact && step === i ? 'border-state text-ink' : 'border-ink/15 text-ink-soft'}`}>{i + 1}. {t}</button></li>
            ))}
          </ol>
          <button onClick={() => setCompact(!compact)} className="label text-ink-soft underline">{compact ? 'One step at a time' : 'Everything on one page'}</button>
        </div>

        {show(0) && (
          <Schedule n="I" title={handover ? 'What you are being handed' : 'What you inherit'}>
            {handover ? (
              <div className="mt-3 border-l-2 border-honour bg-paper-dim px-4 py-3">
                <p className="font-serif text-lg leading-snug">{handover.how}</p>
                <p className="mt-1 text-sm text-ink-soft">President {handover.predecessor} is remembered as “{handover.epithet}”. The country is exactly as it was left.</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 font-serif leading-snug">{handover.notes.map((n) => <li key={n}>{n}</li>)}</ul>
                {handover.era && handover.era.length > 0 && (
                  <ul className="mt-3 space-y-1.5">{handover.era.map((x) => <li key={x.title}><span className="font-serif text-lg">{x.title}.</span> <span className="text-sm text-ink-soft">{x.text}</span></li>)}</ul>
                )}
              </div>
            ) : (
              <>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {SCENARIOS.map((x) => (
                    <button key={x.id} onClick={() => { setScenario(x.id); if (route && !routeOpen(route, x.id)) setRoute(null); }} className={card(scenario === x.id)}>
                      <span className="block font-serif text-lg">{x.name}</span><span className="label block text-ink-soft">{x.difficulty}</span>
                      <span className="mt-1 block text-sm leading-snug text-ink-soft">{x.blurb}</span>
                    </button>
                  ))}
                </div>
                {dossier && (
                  <div className="mt-4 space-y-3 text-[13px] leading-snug">
                    <p className="font-serif text-base italic">{dossier.predecessor}</p>
                    <div>
                      <p className="label text-ink-soft">What they told you, and what the records show</p>
                      <ul className="mt-1 space-y-1.5">{dossier.claims.map((c) => (
                        <li key={c.claim} className="border-l-2 border-ink/20 pl-2">“{c.claim}” <span className="text-ink-soft">({c.source})</span><br /><span className={`label mr-1 ${STATUS_TONE[c.status]}`}>{c.status}</span>{c.finding} <span className="text-ink-soft">Checked by {c.checkedBy}.</span></li>
                      ))}</ul>
                    </div>
                    <div>
                      <p className="label text-ink-soft">Owed from the first day</p>
                      <ul className="mt-1 space-y-0.5">{dossier.obligations.map((o) => <li key={o.what}>{o.what}{o.amount ? ` (${o.amount})` : ''} · to {o.owedTo} · {o.due}</li>)}</ul>
                    </div>
                    <p><span className="label mr-1 text-state">What works</span>{dossier.asset.why}</p>
                    <div>
                      <p className="label text-ink-soft">Who holds something over you</p>
                      <ul className="mt-1 space-y-0.5">{dossier.leverage.map((l) => <li key={l.who + l.holds}>{whoName(l.who)}: {l.holds} Wants: {l.wants}</li>)}</ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </Schedule>
        )}

        {show(1) && (
          <Schedule n="II" title="Who you are">
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="text-sm">Surname<input aria-label="Surname of the President" className="cert-field mt-1 block w-full" value={name} maxLength={24} placeholder="surname" onChange={(e) => setName(e.target.value)} /></label>
              <label className="text-sm">Home state
                <select aria-label="Home state" className="cert-field mt-1 block w-full" value={home} onChange={(e) => setHome(e.target.value)}>
                  <option value="">Choose…</option>
                  {STATES.map((st) => <option key={st.id} value={st.id}>{st.name} State, {ZONE_NAME[st.zone]}</option>)}
                </select>
              </label>
              <label className="text-sm">Party<input aria-label="Party" className="cert-field mt-1 block w-full" value={party} maxLength={48} disabled={!!handover} onChange={(e) => setParty(e.target.value)} /></label>
              <label className="text-sm">Acronym<input aria-label="Acronym" className="cert-field mt-1 block w-28" value={partyShort} maxLength={6} disabled={!!handover} onChange={(e) => setPartyShort(e.target.value.toUpperCase())} /></label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(['sir', 'ma'] as const).map((a) => <button key={a} onClick={() => setAddress(a)} className={small(address === a)}>{a === 'sir' ? 'Mr President · Sir' : 'Madam President · Ma'}</button>)}
            </div>
            <p className="label mt-5 text-ink-soft">What you did before</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {BACKGROUNDS.map((b) => (
                <button key={b.id} onClick={() => setBackground(b.id)} className={card(background === b.id)}>
                  <span className="block font-serif text-lg">{b.name}</span>
                  <span className="mt-1 block text-sm leading-snug text-ink-soft">{b.text}</span>
                </button>
              ))}
            </div>
          </Schedule>
        )}

        {show(2) && (
          <Schedule n="III" title="How you won, and who paid">
            <p className="mt-2 text-sm text-ink-soft">The coalition that carried you, and the money behind the campaign, are separate choices. Each starts you owing something.</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {ROUTES.map((r) => {
                const open = routeOpenHere(r.id);
                return (
                  <button key={r.id} disabled={!open} onClick={() => setRoute(r.id)} className={`${card(route === r.id)} ${open ? '' : 'opacity-50'}`}>
                    <span className="block font-serif text-lg">{r.name}</span>
                    <span className="mt-1 block text-sm leading-snug">{r.howWon}</span>
                    {open ? (
                      <>
                        <span className="mt-1 block text-[13px] leading-snug text-state">{r.strengths}</span>
                        <span className="block text-[13px] leading-snug text-alarm">{r.costs}</span>
                        {r.commitments.map((c) => <span key={c.object} className="mt-1 block text-[13px] text-ink-soft">Promised: {c.text}</span>)}
                      </>
                    ) : <span className="mt-1 block text-[13px] text-ink-soft">{r.closedText}</span>}
                  </button>
                );
              })}
            </div>
            <p className="label mt-5 text-ink-soft">Who paid for the campaign</p>
            <div className="mt-2 grid gap-3 sm:grid-cols-2">
              {FINANCIERS.map((f) => (
                <button key={f.id} onClick={() => setFinancier(f.id)} className={card(financier === f.id)}>
                  <span className="block font-serif text-lg">{f.label}</span>
                  <span className="mt-1 block text-sm leading-snug">{f.terms}</span>
                  <span className="mt-1 block text-[13px] leading-snug text-state">{f.strengths}</span>
                  <span className="block text-[13px] leading-snug text-alarm">{f.costs}</span>
                </button>
              ))}
            </div>
          </Schedule>
        )}

        {show(3) && (
          <Schedule n="IV" title="The mandate">
            <p className="mt-2 text-sm text-ink-soft">Four outcomes you promise the country ({priorities.length} of 4). Reforms toward them cost less, and the papers will hold you to them.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {TRACKS.map((t) => (
                <button key={t.id} onClick={() => toggle(t.id)} className={card(priorities.includes(t.id))}>
                  <span className="block font-serif text-lg">{t.goal}</span>
                  <span className="label block text-ink-soft">{t.name}</span>
                  {detail && <span className="mt-1 block text-[13px] leading-snug text-ink-soft">First reforms: {t.milestones.filter((m) => (m.gen ?? 1) === 1).map((m) => reformName(null, m.id)).join(' · ')}</span>}
                </button>
              ))}
            </div>
            <button onClick={() => setDetail(!detail)} className="label mt-2 text-ink-soft underline">{detail ? 'Hide the reforms' : 'Show the first reforms under each'}</button>
            <p className="label mt-6 text-ink-soft">An optional rule for your government</p>
            <p className="mt-1 text-sm text-ink-soft">Announced on the first day and kept on the register for the whole term. Breaking it is public.</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button onClick={() => setConstraint('')} className={card(constraint === '')}><span className="block font-serif text-lg">No such rule</span><span className="mt-1 block text-sm text-ink-soft">Keep every option open.</span></button>
              {CONSTRAINTS.map((c) => (
                <button key={c.id} onClick={() => setConstraint(c.id)} className={card(constraint === c.id)}>
                  <span className="block font-serif text-lg">{c.name}</span>
                  <span className="mt-1 block text-sm leading-snug">{c.text}</span>
                  <span className="mt-1 block text-[13px] leading-snug text-state">{c.strengths}</span>
                  <span className="block text-[13px] leading-snug text-alarm">{c.costs}</span>
                </button>
              ))}
            </div>
          </Schedule>
        )}

        {show(4) && (
          <Schedule n="V" title="The first government">
            <p className="mt-2 text-sm text-ink-soft">The Minister of Finance first: three names were on the desk on the night. Then the rest of the cabinet: keep who is there, appoint from the files, or leave a post empty.</p>
            <div className="mt-3 grid gap-2">
              {FINANCE_CANDIDATES.map((c) => (
                <button key={c.name} disabled={barred(c.name)} onClick={() => setFinance(c.name)} className={`${card(finance === c.name)} ${barred(c.name) ? 'opacity-50' : ''}`}>
                  <span className="block font-serif text-lg">{c.name}</span>
                  <span className="mt-1 block text-sm leading-snug text-ink-soft">{c.blurb}</span>
                  {handover?.served?.includes(c.name) && <span className="mt-1 block text-[13px] text-alarm">{barred(c.name) ? `Served under President ${handover.predecessor}, of the party you beat. Will not serve you.` : `Served under President ${handover.predecessor}.`}</span>}
                </button>
              ))}
            </div>
            <ul className="mt-5 space-y-3">
              {TEAM_OFFICES.map((o) => {
                const incumbent = o.id === 'cos' ? CAST.find((c) => c.id === 'cos')!.name : PERSON_BY_ID[o.id]?.name;
                const options = CANDIDATES.filter((c) => c.roles.includes(o.id) && !c.exceptional);
                const exceptional = CANDIDATES.filter((c) => c.roles.includes(o.id) && c.exceptional);
                const pick = team[o.id] ?? 'keep';
                return (
                  <li key={o.id} className="border-l-2 border-ink/20 pl-3">
                    <p className="label text-ink-soft">{o.title}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <button onClick={() => setTeam({ ...team, [o.id]: 'keep' })} className={small(pick === 'keep')}>Keep {incumbent}</button>
                      {options.map((c) => {
                        const elsewhere = Object.entries(team).some(([k, v]) => k !== o.id && v === c.id);
                        return (
                          <button key={c.id} disabled={elsewhere} title={elsewhere ? 'Already chosen for another office.' : c.view} onClick={() => setTeam({ ...team, [o.id]: c.id })} className={`${small(pick === c.id)} disabled:opacity-40`}>
                            {c.name} <span className="text-ink-soft">· {ZONE_NAME[c.zone]}{c.patron !== 'president' ? ' · backed' : ''}</span>
                          </button>
                        );
                      })}
                      <button onClick={() => setTeam({ ...team, [o.id]: 'vacant' })} className={small(pick === 'vacant')}>Leave it vacant</button>
                    </div>
                    {pick !== 'keep' && pick !== 'vacant' && <p className="mt-1 text-[13px] text-ink-soft">{CANDIDATE_BY_ID[pick]?.expertise} “{CANDIDATE_BY_ID[pick]?.view}”</p>}
                    {pick === 'vacant' && <p className="mt-1 text-[13px] text-alarm">Career staff run it with no one in charge until you appoint someone.</p>}
                    {exceptional.length > 0 && <p className="mt-1 text-[13px] text-honour">{exceptional.map((c) => c.name).join(', ')} could also serve here, but only on terms negotiated after you take office (Power, The talent).</p>}
                  </li>
                );
              })}
            </ul>
            <ZoneBalance team={team} finance={finance} />
          </Schedule>
        )}

        {show(5) && (
          <Schedule n="VI" title="The certificate">
            {!ready ? (
              <div className="mt-3 border-l-2 border-alarm pl-3 text-sm">
                <p className="label text-alarm">Before the certificate can be issued</p>
                <ul className="mt-1 list-disc pl-5">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
              </div>
            ) : (
              <>
                <div className="mt-4 border border-ink/30 px-5 py-6 text-center">
                  <p className="label text-ink-soft">Independent Electoral Commission · Certificate of Return · No. {reference}</p>
                  <p className="mx-auto mt-4 max-w-xl font-serif text-xl leading-relaxed">
                    This is to certify that <strong>{name.trim()}</strong> of {STATE_BY_ID[home]?.name} State, candidate of the {party.trim()} ({partyShort.trim()}), having satisfied the requirements of the law and scored the highest number of votes in the election of {year}, is hereby declared elected and returned as <strong>President of the Federal Republic</strong>.
                  </p>
                  <div className="mt-6 flex flex-wrap items-end justify-between gap-4 text-left">
                    <div>
                      <p className="cert-sign text-2xl text-ink">A. B. Returning</p>
                      <p className="mt-1 w-56 border-t border-ink/50 pt-1 label text-ink-soft">Chairman and Chief Returning Officer</p>
                    </div>
                    <span className="stamp text-state" style={{ transform: 'rotate(-8deg)' }}>DECLARED</span>
                  </div>
                </div>
                {preview && (
                  <div className="mt-6 grid gap-4 text-[13px] leading-snug sm:grid-cols-2">
                    <div>
                      <p className="label text-ink-soft">What your choices change on the first morning</p>
                      <Effects fx={preview.effects.map((e) => [e.path, e.delta] as Fx)} />
                      <p className="mt-1 text-ink-soft">Measured on the country you will actually take over, after the inheritance is applied.</p>
                    </div>
                    <div>
                      <p className="label text-ink-soft">Owed from the first day</p>
                      <ul className="mt-1 space-y-0.5">{preview.favours.length ? preview.favours.map((f) => <li key={f.who + f.why}>{whoName(f.who)} · {'●'.repeat(f.size)} · {f.why}</li>) : <li>Nobody.</li>}</ul>
                      <p className="label mt-3 text-ink-soft">Promised, and how each will be judged</p>
                      <ul className="mt-1 space-y-1">{preview.commitments.map((c) => <li key={c.text}>{c.text} <span className="text-ink-soft">({c.visibility}, due in {c.due} months.) {c.judgedBy}</span></li>)}</ul>
                    </div>
                  </div>
                )}
              </>
            )}
          </Schedule>
        )}

        <div className="mt-10 flex items-center justify-between border-t rule pt-6">
          <button onClick={() => (!compact && step > 0 ? setStep(step - 1) : onBack())} className="label text-ink-soft hover:text-ink">← Back</button>
          {!compact && step < STEPS.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="bg-state px-6 py-3 font-serif text-lg text-paper hover:bg-state-lit">{STEPS[step + 1]} →</button>
          ) : (
            <button disabled={!ready} onClick={() => onStart(setup)} className={`px-6 py-3 font-serif text-lg ${ready ? 'bg-state text-paper hover:bg-state-lit' : 'bg-ink/15 text-ink-soft'}`}>
              {ready ? 'Take the oath: so help me God' : `${problems.length} thing${problems.length === 1 ? '' : 's'} still to decide`}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}

function ZoneBalance({ team, finance }: { team: Record<string, string>; finance: string | null }) {
  const zones = new Set<ZoneId>();
  const fin = FINANCE_CANDIDATES.find((c) => c.name === finance);
  if (fin?.zone) zones.add(fin.zone);
  for (const o of TEAM_OFFICES) {
    const pick = team[o.id] ?? 'keep';
    if (pick === 'vacant') continue;
    const z = pick === 'keep' ? ORIGIN[o.id === 'cos' ? CAST.find((c) => c.id === 'cos')!.name : PERSON_BY_ID[o.id]?.name ?? ''] : CANDIDATE_BY_ID[pick]?.zone;
    if (z) zones.add(z);
  }
  const missing = (Object.keys(ZONE_NAME) as ZoneId[]).filter((z) => !zones.has(z));
  return (
    <p className={`mt-4 text-[13px] ${missing.length ? 'text-alarm' : 'text-state'}`}>
      {missing.length ? `Nobody in these offices from ${missing.map((z) => ZONE_NAME[z]).join(', ')}. The Senate and the governors will count, and the federal character rules expect every zone.` : 'Every zone is represented in these offices.'}
    </p>
  );
}

function whoName(id: string): string {
  return PERSON_BY_ID[id]?.name ?? TYCOON_BY_ID[id]?.name ?? (NAMES as Record<string, string>)[id] ?? id;
}
