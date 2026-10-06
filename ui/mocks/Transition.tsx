'use client';

// TRANSITION AND TEAM SELECTION (mock for R6, with R5's proposed slate)
// The opening as plan 02 describes it, built from the real authored content:
// the inheritance dossier (claims against findings), the route to power, who
// paid for it, and then the first team, chosen from the named pool. What the
// engine must still provide: validating each step, `startingEffects(setup)` so
// the preview is never overwritten by a scenario, and storing the debts and
// commitments these choices create. Here they are only summed and listed.

import { useState } from 'react';
import { CANDIDATES } from '../../content/candidates';
import { DOSSIER_BY_SCENARIO } from '../../content/dossiers';
import { CAST, FINANCE_CANDIDATES } from '../../content/names';
import { PERSON_BY_ID } from '../../content/people';
import { FINANCIERS, ROUTES } from '../../content/routes';
import { SCENARIOS } from '../../content/scenarios';
import { STATE_BY_ID } from '../../content/states';
import { TYCOON_BY_ID } from '../../content/tycoons';
import { ZONE_NAME } from '../../engine/vars';
import type { ZoneId } from '../../engine/types';
import { Choice, Effects, MockFrame } from './Mock';

const STEPS = ['Inheritance', 'Route', 'Financier', 'Team', 'Summary'] as const;
type Step = (typeof STEPS)[number];

const OFFICES: { id: string; title: string; incumbent: { name: string; zone?: ZoneId } }[] = [
  { id: 'fin', title: 'Minister of Finance', incumbent: { name: FINANCE_CANDIDATES[0].name, zone: FINANCE_CANDIDATES[0].zone } },
  { id: 'min_works', title: 'Minister of Works', incumbent: { name: PERSON_BY_ID.min_works.name, zone: PERSON_BY_ID.min_works.zone } },
  { id: 'min_power', title: 'Minister of Power', incumbent: { name: PERSON_BY_ID.min_power.name, zone: PERSON_BY_ID.min_power.zone } },
  { id: 'min_justice', title: 'Attorney General', incumbent: { name: PERSON_BY_ID.min_justice.name, zone: PERSON_BY_ID.min_justice.zone } },
  { id: 'min_agric', title: 'Minister of Agriculture', incumbent: { name: PERSON_BY_ID.min_agric.name, zone: PERSON_BY_ID.min_agric.zone } },
  { id: 'min_service', title: 'Minister of Industry and the Public Service', incumbent: { name: PERSON_BY_ID.min_service.name, zone: PERSON_BY_ID.min_service.zone } },
  { id: 'cos', title: 'Chief of Staff', incumbent: { name: CAST.find((c) => c.id === 'cos')!.name, zone: 'NW' } },
];

const who = (id: string) => PERSON_BY_ID[id]?.name ?? TYCOON_BY_ID[id]?.name ?? id;
const STATUS_TONE: Record<string, string> = { confirmed: 'text-state', 'partly true': 'text-honour', false: 'text-alarm', disputed: 'text-ink-soft' };

export function TransitionMock() {
  const [scenario, setScenario] = useState('standard');
  const [step, setStep] = useState<Step>('Inheritance');
  const [route, setRoute] = useState<string | null>(null);
  const [financier, setFinancier] = useState<string | null>(null);
  const [team, setTeam] = useState<Record<string, string>>({});

  const d = DOSSIER_BY_SCENARIO[scenario];
  const routes = ROUTES.filter((r) => !r.onlyWhen?.scenarios || r.onlyWhen.scenarios.includes(scenario));
  const r = ROUTES.find((x) => x.id === route);
  const f = FINANCIERS.find((x) => x.id === financier);
  const chosen = OFFICES.map((o) => {
    const c = CANDIDATES.find((x) => x.id === team[o.id]);
    return { office: o, name: c?.name ?? o.incumbent.name, zone: c?.zone ?? o.incumbent.zone, kept: !c };
  });
  const zones = chosen.reduce<Record<string, number>>((m, c) => { if (c.zone) m[c.zone] = (m[c.zone] ?? 0) + 1; return m; }, {});
  const missing = (Object.keys(ZONE_NAME) as ZoneId[]).filter((z) => !zones[z]);

  return (
    <MockFrame id="transition" contract="R6 (transition) and R5 (proposed slate)" title="From the certificate to the first cabinet"
      purpose="The opening as a sequence of decisions, using the authored dossiers, routes, financiers and candidates. The engine will validate each step and store what it creates.">
      <div className="flex flex-wrap gap-2">
        {SCENARIOS.map((s) => <Choice key={s.id} active={scenario === s.id} on={() => { setScenario(s.id); setRoute(null); }}>{s.name}</Choice>)}
      </div>
      <ol className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((s, i) => <li key={s}><button onClick={() => setStep(s)} className={`label border px-2 py-1 ${step === s ? 'border-state text-ink' : 'border-ink/15 text-ink-soft'}`}>{i + 1}. {s}</button></li>)}
      </ol>

      {step === 'Inheritance' && d && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div>
            <p className="label text-ink-soft">What they told you, and what the records show</p>
            <ul className="mt-1 space-y-2 text-[13px] leading-snug">
              {d.claims.map((c) => (
                <li key={c.claim} className="border-l-2 border-ink/20 pl-2">
                  <p>“{c.claim}” <span className="text-ink-soft">({c.source})</span></p>
                  <p><span className={`label mr-1 ${STATUS_TONE[c.status]}`}>{c.status}</span>{c.finding} <span className="text-ink-soft">Checked by {c.checkedBy}.</span></p>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3 text-[13px] leading-snug">
            <div>
              <p className="label text-ink-soft">What you inherit owing</p>
              <ul className="mt-1 space-y-0.5">{d.obligations.map((o) => <li key={o.what}>{o.what}{o.amount ? ` (${o.amount})` : ''} · owed to {o.owedTo} · {o.due}</li>)}</ul>
            </div>
            <div>
              <p className="label text-state">What works</p>
              <p>{d.asset.why} <span className="text-ink-soft">({STATE_BY_ID[d.asset.site]?.name}; {d.asset.condition})</span></p>
            </div>
            <div>
              <p className="label text-ink-soft">Who holds something over you</p>
              <ul className="mt-1 space-y-0.5">{d.leverage.map((l) => <li key={l.who + l.holds}>{who(l.who)}: {l.holds} Wants: {l.wants}</li>)}</ul>
            </div>
          </div>
        </div>
      )}

      {step === 'Route' && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {routes.map((x) => (
            <Choice key={x.id} active={route === x.id} on={() => setRoute(x.id)}>
              <span className="font-serif text-lg">{x.name}</span>
              <span className="mt-1 block text-[13px]">{x.howWon}</span>
              <span className="mt-1 block text-[13px] text-state">{x.strengths}</span>
              <span className="block text-[13px] text-alarm">{x.costs}</span>
            </Choice>
          ))}
          {ROUTES.filter((x) => !routes.includes(x)).map((x) => <p key={x.id} className="text-[13px] text-ink-soft">{x.name}: {x.closedText ?? 'Not open in this inheritance.'}</p>)}
        </div>
      )}

      {step === 'Financier' && (
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {FINANCIERS.map((x) => (
            <Choice key={x.id} active={financier === x.id} on={() => setFinancier(x.id)}>
              <span className="font-serif text-lg">{x.label}</span>
              <span className="mt-1 block text-[13px]">{x.terms}</span>
              <span className="mt-1 block text-[13px] text-state">{x.strengths}</span>
              <span className="block text-[13px] text-alarm">{x.costs}</span>
            </Choice>
          ))}
        </div>
      )}

      {step === 'Team' && (
        <div className="mt-4 space-y-3">
          {OFFICES.map((o) => {
            const options = CANDIDATES.filter((c) => c.roles.includes(o.id));
            return (
              <div key={o.id} className="border-l-2 border-ink/20 pl-3">
                <p className="label text-ink-soft">{o.title}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Choice active={!team[o.id]} on={() => setTeam({ ...team, [o.id]: '' })}>Keep {o.incumbent.name}</Choice>
                  {options.map((c) => (
                    <Choice key={c.id} active={team[o.id] === c.id} disabled={!!c.exceptional}
                      why={c.exceptional ? 'Serves only on stated terms: see the approach mock.' : undefined}
                      on={() => setTeam({ ...team, [o.id]: c.id })}>
                      {c.name}{c.exceptional ? ' · on terms' : ''}{c.patron !== 'president' && c.reputation ? ' · backed' : ''}
                    </Choice>
                  ))}
                </div>
              </div>
            );
          })}
          <p className={`text-[13px] ${missing.length ? 'text-alarm' : 'text-state'}`}>
            {missing.length ? `No one from ${missing.map((z) => ZONE_NAME[z]).join(', ')}. The Senate will count. (Proposed coalition constraint for R5.)` : 'Every zone is represented.'}
          </p>
        </div>
      )}

      {step === 'Summary' && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2 text-[13px] leading-snug">
          <div>
            <p className="label text-ink-soft">Starting effects (summed here; the engine's starting-effects preview (R6) will be authoritative)</p>
            <Effects fx={[...(r?.fx ?? []), ...(f?.fx ?? [])]} empty="Choose a route and a financier." />
            <p className="label mt-3 text-ink-soft">Owed from the first day</p>
            <ul className="mt-1 space-y-0.5">{[...(r?.owes ?? []), ...(f?.owes ?? [])].map((o) => <li key={o.who + o.why}>{who(o.who)} · {'●'.repeat(o.size)} · {o.why}</li>)}</ul>
            <p className="label mt-3 text-ink-soft">Promised from the first day (stored as commitments)</p>
            <ul className="mt-1 space-y-0.5">{[...(r?.commitments ?? []), ...(f?.commitments ?? [])].map((c) => <li key={c.object}>{c.text} <span className="text-ink-soft">({c.visibility}, {c.afterMonths} months)</span></li>)}</ul>
          </div>
          <div>
            <p className="label text-ink-soft">The first cabinet</p>
            <ul className="mt-1 space-y-0.5">{chosen.map((c) => <li key={c.office.id}>{c.office.title}: {c.name}{c.kept ? ' (kept)' : ''}{c.zone ? ` · ${ZONE_NAME[c.zone]}` : ''}</li>)}</ul>
            {d && <p className="mt-3 italic text-ink-soft">First act, as the Chief of Staff sees it: {d.firstAct.text}</p>}
          </div>
        </div>
      )}
    </MockFrame>
  );
}
