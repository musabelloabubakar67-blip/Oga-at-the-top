'use client';

// THE ARMED FORCES (plan 13)
// The instrument, apart from the outcome: readiness with every cause, the
// command and its disagreements, the missions the President has ordered and
// what each month of them did, and what is still on the record.

import { useState } from 'react';
import { MISSIONS, OFFICERS } from '../content/military';
import { dateLabel } from '../engine/config';
import {
  POST_TITLE, RESOURCES, candidatesFor, canAppoint, canStartMission, coupRisk, dollarShortage, ensureMilitary, evidenceText, holder,
  missionCost, professional, readinessTarget, type Resources,
} from '../engine/military';
import { movesLeft } from '../engine/reduce';
import { naira } from '../engine/text';
import type { Action, GameState, ZoneId } from '../engine/types';
import { ZONES, ZONE_NAME } from '../engine/vars';

const short = (id: string) => OFFICERS.find((o) => o.id === id)?.name ?? id;
const btn = (ok: boolean) => `border px-2.5 py-1 text-sm ${ok ? 'border-ink/30 hover:border-state' : 'border-ink/10 opacity-45'}`;
const DOCTRINE: Record<string, string> = { hold: 'hold ground', manoeuvre: 'mobile raids', air: 'air power', population: 'protect people first', intelligence: 'intelligence first', sustainment: 'maintain what exists', acquisition: 'buy new equipment' };

function Gauge({ label, v, text }: { label: string; v: number; text: string }) {
  return (
    <div className="border border-ink/15 p-2">
      <p className="flex justify-between"><span className="label text-ink-soft">{label}</span><span className="font-serif text-lg">{Math.round(v)}</span></p>
      <div className="h-1 bg-ink/10"><div className="h-1 bg-state" style={{ width: `${Math.round(v)}%` }} /></div>
      <p className="mt-1 text-[12.5px] leading-snug text-ink-soft">{text}</p>
    </div>
  );
}

function NewMission({ s, dispatch, zone }: { s: GameState; dispatch: (a: Action) => void; zone: ZoneId }) {
  const drafts = MISSIONS.filter((x) => x.theatre === zone);
  const [pick, setPick] = useState(drafts[0]?.id ?? '');
  const [res, setRes] = useState<Resources>('standard');
  const d = drafts.find((x) => x.id === pick);
  const [kept, setKept] = useState<boolean[]>(d ? d.limits.map(() => true) : []);
  if (!d) return null;
  const can = canStartMission(s, d.id, movesLeft(s));
  const c = holder(s, `theatre.${zone}`);
  return (
    <div className="mt-2 border-l-2 border-state/40 pl-3 text-[13px] leading-snug">
      {drafts.length > 1 && (
        <div className="flex flex-wrap gap-2">{drafts.map((x) => <button key={x.id} onClick={() => { setPick(x.id); setKept(x.limits.map(() => true)); }} className={btn(true) + (x.id === pick ? ' bg-state/10' : '')}>{x.objective.split(':')[0].slice(0, 60)}</button>)}</div>
      )}
      <p className="mt-1"><span className="font-semibold">Objective:</span> {d.objective}</p>
      <p><span className="font-semibold">Evidence it worked:</span> {d.evidence}</p>
      <p><span className="font-semibold">What must follow:</span> {d.lasting}</p>
      <p className="text-ink-soft">For it: {d.for.map(short).join(', ') || 'nobody in the command'}. Against it: {d.against.map(short).join(', ') || 'nobody in the command'}.</p>
      <p className="mt-1 font-semibold">Limits on how it is fought</p>
      {d.limits.map((l, i) => (
        <label key={l} className="block"><input type="checkbox" checked={kept[i] ?? true} onChange={(e) => setKept(kept.map((k, j) => (j === i ? e.target.checked : k)))} /> {l}{kept[i] === false ? <span className="text-alarm"> · dropped: faster, and more harm to civilians</span> : ''}</label>
      ))}
      <p className="mt-1 font-semibold">Resources</p>
      <div className="flex flex-wrap gap-2">{(Object.keys(RESOURCES) as Resources[]).map((r) => <button key={r} onClick={() => setRes(r)} className={btn(true) + (r === res ? ' bg-state/10' : '')}>{RESOURCES[r].name} · {naira(RESOURCES[r].perMonth * 12)} a year</button>)}</div>
      <p className="text-ink-soft">{RESOURCES[res].text} Run by {c.name}, who believes in {DOCTRINE[c.doctrine]}.</p>
      <button disabled={!can.ok} title={can.reason} onClick={() => dispatch({ type: 'MISSION_START', id: d.id, resources: res, kept })} className={`mt-1 ${btn(can.ok)}`}>Order it and delegate it · 3 capital, a move</button>
      {!can.ok && can.reason && <span className="ml-2 text-ink-soft">{can.reason}</span>}
    </div>
  );
}

export function Military({ s, dispatch }: { s: GameState; dispatch: (a: Action) => void }) {
  const m = ensureMilitary(structuredClone(s));
  const view = structuredClone(s);
  const target = readinessTarget(view);
  const [open, setOpen] = useState<ZoneId | null>(null);
  const [post, setPost] = useState<string | null>(null);
  const coup = coupRisk(view);
  const left = movesLeft(s);
  const open_ = m.abuses.filter((a) => !a.resolved);
  return (
    <section className="paper p-6 xl:p-8">
      <p className="label text-state">The armed forces</p>
      <h2 className="mt-1 font-serif text-3xl">The instrument, not the outcome</h2>
      <p className="mt-1 text-sm text-ink-soft">How safe the country is shows on the map. This is what the forces can do, who commands them, what they have been ordered to do, and what is on their record.</p>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Gauge label="Readiness" v={m.readiness} text={`Heading for ${Math.round(target.v)}. ${dollarShortage(view) > 0.05 ? 'Parts bought in dollars are short.' : 'Spares are being bought.'}`} />
        <Gauge label="Intelligence" v={m.intel} text="Better intelligence, fewer mistakes: less harm on every mission." />
        <Gauge label="Conduct" v={m.conduct} text={`${professional(view)} professional reform${professional(view) === 1 ? '' : 's'} in force. ${m.refused ? `Unlawful orders refused: ${m.refused}.` : ''}`} />
      </div>
      <ul className="mt-2 grid gap-x-6 text-[13px] sm:grid-cols-2">
        {target.lines.map((l) => <li key={l.label} className="flex justify-between gap-3"><span>{l.label}</span><span className="tabular-nums text-ink-soft">{l.value > 0 ? `+${l.value}` : l.value}</span></li>)}
      </ul>
      {m.arrears > 0 && <p className="mt-1 text-[13px] text-alarm">Pay is {m.arrears} month{m.arrears === 1 ? '' : 's'} late.</p>}
      {coup.causes.length >= 2 && <p className="mt-1 text-[13px] text-alarm">Grievances in the ranks: {coup.causes.join('; ')}.</p>}

      <h3 className="label mt-6 border-b rule pb-1 text-ink-soft">The theatres and their missions{missionCost(view) > 0 ? ` · operations cost ${naira(missionCost(view) * 12)} a year` : ''}</h3>
      <ul className="mt-2 space-y-2">
        {ZONES.map((z) => {
          const x = m.missions.find((y) => !y.ended && y.theatre === z);
          const loc = m.local[z];
          const c = holder(view, `theatre.${z}`);
          return (
            <li key={z} className="border border-ink/15 p-3">
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-serif text-lg">{ZONE_NAME[z]}</span>
                <span className="label text-ink-soft">threat {Math.round(s.theatres[z])} · cooperation {Math.round(loc.cooperation)} · {Math.round(loc.displaced)}k displaced{loc.unheld > 0.5 ? ` · ${Math.round(loc.unheld)} points not yet held` : ''}</span>
              </p>
              <p className="text-[13px] text-ink-soft">{c.title}: {c.name}. “{c.position}”</p>
              {x ? (
                <div className="mt-1 text-[13px] leading-snug">
                  <p><span className="font-semibold">Running since {dateLabel(x.started, s.startYear)}:</span> {MISSIONS.find((d) => d.id === x.id)?.objective} {RESOURCES[x.resources].name} resources. So far: {evidenceText(view, x)}</p>
                  <ul className="mt-1 space-y-0.5 text-ink-soft">{x.log.slice(-4).map((l, i) => <li key={i}>{dateLabel(l.turn, s.startYear)}: {l.text}</li>)}</ul>
                  <button onClick={() => dispatch({ type: 'MISSION_END', id: x.id })} className={`mt-1 ${btn(true)}`}>End the operation</button>
                </div>
              ) : MISSIONS.some((d) => d.theatre === z) && (
                <>
                  <button onClick={() => setOpen(open === z ? null : z)} className="label mt-1 text-state underline">{open === z ? 'Close' : 'Order a mission'}</button>
                  {open === z && <NewMission s={s} dispatch={dispatch} zone={z} />}
                </>
              )}
            </li>
          );
        })}
      </ul>

      <h3 className="label mt-6 border-b rule pb-1 text-ink-soft">The command</h3>
      <ul className="mt-2 grid gap-2 xl:grid-cols-2">
        {Object.keys(m.posts).map((p) => {
          const o = holder(view, p);
          return (
            <li key={p} className="border border-ink/15 p-2 text-[13px] leading-snug">
              <p className="flex justify-between gap-2"><span className="font-serif text-base">{o.name}</span><span className="label text-ink-soft">{POST_TITLE[p] ?? p}</span></p>
              {o.id ? <p className="text-ink-soft">Believes in {DOCTRINE[o.doctrine]}. Competence {o.traits.competence}, integrity {o.traits.integrity}, refuses unlawful orders {o.traits.restraint}/5. {o.tieText}</p> : <p className="text-ink-soft">The next officer in seniority: competent, tied to nobody.</p>}
              {o.disputes?.map((d) => <p key={d.with} className="text-ink-soft">Disagrees with {OFFICERS.find((x) => x.id === d.with)?.short}: {d.over}</p>)}
              <button onClick={() => setPost(post === p ? null : p)} className="label mt-1 text-state underline">{post === p ? 'Close' : 'Change who holds it · 3 capital'}</button>
              {post === p && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {[...candidatesFor(view, p).map((c) => c.id), ''].filter((id) => id !== m.posts[p]).map((id) => {
                    const ok = canAppoint(view, p, id, left);
                    const who = id ? OFFICERS.find((x) => x.id === id)! : null;
                    return <button key={id || 'senior'} disabled={!ok.ok} title={ok.reason} onClick={() => { dispatch({ type: 'MIL_APPOINT', post: p, officer: id }); setPost(null); }} className={btn(ok.ok)}>{who ? `${who.short} (${DOCTRINE[who.doctrine]})` : 'Retire; the next in seniority'}</button>;
                  })}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <h3 className="label mt-6 border-b rule pb-1 text-ink-soft">On the record</h3>
      {open_.length === 0 ? <p className="mt-1 text-[13px] text-ink-soft">Nothing unresolved.</p> : (
        <ul className="mt-1 space-y-1 text-[13px] leading-snug">{open_.map((a) => <li key={a.id}><span className="text-ink-soft">{a.turn ? dateLabel(a.turn, s.startYear) : 'Before this government'} · {ZONE_NAME[a.zone]}:</span> {a.text}</li>)}</ul>
      )}
      {m.inquiries.length > 0 && <ul className="mt-2 space-y-1 text-[13px]">{m.inquiries.map((q) => <li key={q.id}>Inquiry into {q.subject}, opened {dateLabel(q.opened, s.startYear)}: {q.status === 'open' ? 'sitting' : q.finding}</li>)}</ul>}
    </section>
  );
}
