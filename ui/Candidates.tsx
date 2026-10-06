'use client';

import { useState } from 'react';
import { federalCharacter } from '../engine/federal';
import { ZONE_NAME } from '../engine/vars';
import { CHECK_PC, HUNT_PC, patronLabel, specName, type Offer } from '../engine/talent';
import type { Action, GameState } from '../engine/types';
import { canLeaveVacant, getVacancyView, type AppointmentPost } from '../engine/public';
import { NamedNote, postName, postsFor } from './Talent';

const word = (v: number, hi: string, mid: string, lo: string) => (v >= 4 ? hi : v <= 2 ? lo : mid);

/**
 * People who could take a job, from the talent pool: their field, what their file
 * says (or the truth, once checked), whether they would refuse, and the buttons to
 * appoint, check or search for more.
 */
export function Candidates({ s, role, offers, dispatch, appoint, can, label, left }: {
  s: GameState; role: string; offers: Offer[]; dispatch: (a: Action) => void;
  appoint: (name: string) => void; can: (name: string) => { ok: boolean; reason?: string }; label: string; left: number;
}) {
  const fc = federalCharacter(s);
  const [showAll, setShowAll] = useState(false);
  const willing = offers.filter((o) => !o.refuses);
  const unwilling = offers.length - willing.length;
  const list = showAll ? offers : willing;
  return (
    <div className="mt-2">
      {unwilling > 0 && (
        <p className="mb-1 text-[13px] text-ink-soft">
          {unwilling} more {unwilling === 1 ? 'person' : 'people'} would not take it.{' '}
          <button onClick={() => setShowAll(!showAll)} className="underline hover:text-ink">{showAll ? 'Hide them' : 'Show who, and why'}</button>
        </p>
      )}
      {!list.length && <p className="text-[13px] text-alarm">Nobody suitable will take it at the moment.</p>}
      <ul className="space-y-2">
        {list.map((o) => {
          // Someone who will not take the post cannot be appointed to it; the button says so instead of doing nothing.
          const ok = o.refuses ? { ok: false, reason: o.refuses } : can(o.c.name);
          const t = o.shown;
          return (
            <li key={o.c.id} className={`border-l-2 pl-3 ${o.refuses ? 'border-alarm/50' : 'border-honour'}`}>
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-serif">{o.c.name}</span>
                <span className={`label ${o.fit ? 'text-state' : 'text-ink-soft'}`}>{specName(o.c)}{o.fit ? ' · right field' : ' · outside their field (−1)'} · {ZONE_NAME[o.c.zone]}{(() => { const z = fc.zones.find((x) => x.zone === o.c.zone)!; return z.count === 0 ? ' · would end its exclusion' : z.count - z.fair >= 0.5 ? ` · already has ${z.count}` : ''; })()}</span>
              </p>
              <p className="text-[13px] leading-snug text-ink-soft">{o.c.blurb}</p>
              {o.c.named && <NamedNote id={o.c.id} />}
              <p className="text-[13px] leading-snug">
                <span className="label mr-1 text-ink-soft">{o.c.checked ? 'Checked' : 'File says'}</span>
                {word(t.competence, 'very able', 'competent', 'out of their depth')} ({t.competence}), {word(t.loyalty, 'loyal', 'reliable enough', 'their own person')} ({t.loyalty}), {word(t.integrity, 'clean', 'ordinary', 'questions about money')} ({t.integrity})
                {o.c.checked ? `; answers to ${patronLabel(o.c)}` : ''}.
              </p>
              {o.refuses && <p className="text-[13px] text-alarm">Will not take it: {o.refuses}</p>}
              <div className="mt-1 flex flex-wrap gap-2">
                <button disabled={!ok.ok} title={ok.reason} onClick={() => appoint(o.c.name)}
                  className={`border px-3 py-1 text-sm ${ok.ok ? 'border-ink/30 hover:border-state' : 'border-ink/10 opacity-45'}`}>{label}</button>
                {!o.c.checked && (
                  <button disabled={s.pc < CHECK_PC} onClick={() => dispatch({ type: 'CHECK_CANDIDATE', id: o.c.id })}
                    className="border border-ink/20 px-3 py-1 text-sm hover:border-state disabled:opacity-45">Background check · {CHECK_PC} capital</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <button disabled={left <= 0 || s.pc < HUNT_PC} onClick={() => dispatch({ type: 'HEADHUNT', role })}
        className="mt-2 border border-ink/30 px-3 py-1 text-sm hover:border-state disabled:opacity-45">
        Search for more people in this field · {HUNT_PC} capital · 1 move
      </button>
      <Vacancy s={s} role={role} dispatch={dispatch} left={left} />
    </div>
  );
}

/** Leaving a post empty is a choice too (contract R5): career staff carry on, the post's rating is zero and any capability ends. */
function Vacancy({ s, role, dispatch, left }: { s: GameState; role: string; dispatch: (a: Action) => void; left: number }) {
  const p = postsFor(s, role)[0];
  return p ? <Vacate s={s} p={p} dispatch={dispatch} left={left} /> : null;
}

/** The vacancy choice for any post: ministers, Finance, advisers, institution heads and asset managers. */
export function Vacate({ s, p, dispatch, left }: { s: GameState; p: AppointmentPost; dispatch: (a: Action) => void; left: number }) {
  const [sure, setSure] = useState(false);
  const empty = Object.values(getVacancyView(s)).find((v) => postName(v.post) === postName(p));
  if (empty) return <p className="mt-2 text-[13px] text-honour">Vacant by your choice since {empty.previousName.replace(/^A /, 'a ')} left. Career staff carry on without an appointed head; appointing someone fills it.</p>;
  const can = canLeaveVacant(s, p, left);
  if (!sure) return <button onClick={() => setSure(true)} className="mt-2 ml-2 border border-ink/20 px-3 py-1 text-sm text-ink-soft hover:border-alarm">Leave the post vacant…</button>;
  return (
    <div className="mt-2 border-l-2 border-alarm pl-3 text-[13px] leading-snug">
      <p>The current holder leaves and nobody replaces them. Career staff keep the post running, with no one in charge: its rating is zero until it is filled, and any capability tied to the holder ends. 1 move, 2 capital.</p>
      <div className="mt-1 flex gap-2">
        <button disabled={!can.ok} title={can.reason} onClick={() => { dispatch({ type: 'LEAVE_VACANT', post: p }); setSure(false); }} className="border border-alarm/60 px-3 py-1 text-sm hover:border-alarm disabled:opacity-45">Leave {postName(p)} vacant</button>
        <button onClick={() => setSure(false)} className="border border-ink/20 px-3 py-1 text-sm">Not now</button>
      </div>
      {!can.ok && can.reason && <p className="mt-1 text-ink-soft">{can.reason}</p>}
    </div>
  );
}
