'use client';

// THE TALENT POOL (plan 03)
// Every named person who could serve, read from the engine's candidate view:
// what their file says (or the truth, once checked), their career and what they
// believe about the job, whether they are free, and where they can be appointed.
// The four exceptional candidates show their terms and what they would bring;
// those benefits are labelled as proposals until the negotiated appointment
// (contract R5) gives them effect. Appointment itself happens where the post is:
// ordinary candidates appear in each post's own list of people.

import { useState } from 'react';
import { CANDIDATE_BY_ID } from '../content/candidates';
import { INSTITUTION_BY_ID } from '../content/institutions';
import { CAST } from '../content/names';
import { PERSON_BY_ID } from '../content/people';
import { SPEC_NAME } from '../content/talent';
import { TYCOON_BY_ID } from '../content/tycoons';
import { getCandidateView } from '../engine/public';
import { CHECK_PC } from '../engine/talent';
import type { Action, GameState } from '../engine/types';
import { ZONE_NAME } from '../engine/vars';

type View = ReturnType<typeof getCandidateView>[number];

const word = (v: number, hi: string, mid: string, lo: string) => (v >= 4 ? hi : v <= 2 ? lo : mid);

/** A role key as a post the reader recognises, and the screen where it is filled. */
function post(role: string): { name: string; where: string } {
  if (role === 'fin') return { name: 'Minister of Finance', where: 'the desk, under the Finance Ministry' };
  if (role === 'vp') return { name: 'Running mate', where: 'Your advisers' };
  if (role === 'asset') return { name: 'Manager of a public asset', where: 'The country, under each asset' };
  const person = PERSON_BY_ID[role];
  if (person) return { name: person.title, where: 'Your ministers' };
  const adviser = CAST.find((c) => c.id === role);
  if (adviser) return { name: adviser.role, where: 'Your advisers' };
  const inst = INSTITUTION_BY_ID[role];
  if (inst) return { name: `Head of ${inst.name.replace(/^An? |^The /, '').replace(/,.*$/, '')}`, where: 'The country, under institutions' };
  return { name: role, where: 'the post\'s own screen' };
}

const STATE: Record<View['state'], { text: string; tone: string }> = {
  available: { text: 'Available', tone: 'text-state' },
  appointed: { text: 'In a post now', tone: 'text-honour' },
  unavailable: { text: 'Will not serve at present', tone: 'text-alarm' },
};

function Dossier({ s, c, dispatch }: { s: GameState; c: View; dispatch: (a: Action) => void }) {
  const [open, setOpen] = useState(false);
  const t = c.shown;
  const exceptional = c.conditions.length > 0;
  // An exceptional candidate is held back by the terms, not by a refusal: say so.
  const gated = exceptional && c.state === 'unavailable' && !!c.reason?.startsWith('Requires a negotiated appointment');
  const st = gated ? { text: 'On stated terms only', tone: 'text-honour' } : STATE[c.state];
  return (
    <li className={`border p-3 ${exceptional ? 'border-honour/60' : 'border-ink/20'}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-serif text-lg">{c.name}</span>
        <span className={`label shrink-0 ${st.tone}`}>{st.text}</span>
      </div>
      <p className="label text-ink-soft">{SPEC_NAME[c.spec]} · {ZONE_NAME[c.zone]}{exceptional ? ' · exceptional' : ''}</p>
      <p className="mt-1 text-[13px] leading-snug">{c.expertise}</p>
      <p className="mt-1 text-[13px] leading-snug">
        <span className="label mr-1 text-ink-soft">{c.checked ? 'Checked' : 'File says'}</span>
        {word(t.competence, 'very able', 'competent', 'out of their depth')} ({t.competence}), {word(t.loyalty, 'loyal', 'reliable enough', 'their own person')} ({t.loyalty}), {word(t.integrity, 'clean', 'ordinary', 'questions about money')} ({t.integrity})
        {c.checked ? `; answers to ${c.patron === 'president' ? 'nobody but the job' : c.patron === 'self' ? 'themselves' : c.patron ? (PERSON_BY_ID[c.patron]?.name ?? TYCOON_BY_ID[c.patron]?.name ?? c.patron) : 'nobody but the job'}` : ''}.
      </p>
      {c.checked && c.reputation && <p className="text-[13px] italic text-ink-soft">{c.reputation}</p>}
      {c.reason && c.state === 'unavailable' && !gated && <p className="text-[13px] text-alarm">{c.reason}</p>}

      {c.plainExcellence && (
        <p className="mt-2 border-l-2 border-state pl-2 text-[13px] leading-snug"><span className="label mr-1 text-state">No conditions</span>{c.plainExcellence}</p>
      )}

      {exceptional && (
        <div className="mt-2 border-l-2 border-honour pl-2">
          <p className="label text-honour">Would bring · proposed, not yet in effect</p>
          <ul className="mt-0.5 space-y-0.5 text-[13px] leading-snug">
            {c.proposedCapabilities.map((cap) => <li key={cap.id}>{cap.text}</li>)}
          </ul>
          <p className="label mt-2 text-honour">Terms of acceptance</p>
          <ul className="mt-0.5 space-y-1 text-[13px] leading-snug">
            {c.conditions.map((k) => <li key={k.id}>{k.text} <span className="text-ink-soft">If broken: {k.breach}</span></li>)}
          </ul>
          <p className="mt-1 text-[13px] italic text-ink-soft">An appointment on these terms has to be negotiated. That is not possible yet; the ordinary appointment lists will not accept this candidate.</p>
        </div>
      )}

      {open && (
        <div className="mt-2 space-y-1 text-[13px] leading-snug">
          <p><span className="label mr-1 text-ink-soft">Career</span>{c.career?.map((x) => `${x.post} (${x.years})`).join('; ')}</p>
          <p><span className="label mr-1 text-ink-soft">On the job</span>“{c.view}”</p>
          <p><span className="label mr-1 text-ink-soft">Can serve as</span>{(c.roles ?? []).map((r) => post(r).name).join(', ')}</p>
          {!exceptional && c.state === 'available' && <p className="text-ink-soft">Appoint from {[...new Set((c.roles ?? []).map((r) => post(r).where))].join(', or ')}.</p>}
        </div>
      )}

      <div className="mt-2 flex flex-wrap gap-2">
        <button onClick={() => setOpen(!open)} className="border border-ink/20 px-3 py-1 text-sm hover:border-state">{open ? 'Less' : 'Career, views and posts'}</button>
        {!c.checked && (
          <button disabled={s.pc < CHECK_PC} onClick={() => dispatch({ type: 'CHECK_CANDIDATE', id: c.id })}
            className="border border-ink/20 px-3 py-1 text-sm hover:border-state disabled:opacity-45">Background check · {CHECK_PC} capital</button>
        )}
      </div>
    </li>
  );
}

export function TalentPool({ s, dispatch }: { s: GameState; dispatch: (a: Action) => void }) {
  const all = getCandidateView(s);
  const [field, setField] = useState<string>('all');
  const shown = all.filter((c) => field === 'all' || c.spec === field);
  const exceptional = shown.filter((c) => c.conditions.length > 0);
  const rest = shown.filter((c) => c.conditions.length === 0)
    .sort((a, b) => Number(!!b.plainExcellence) - Number(!!a.plainExcellence) || a.name.localeCompare(b.name));
  const fields = [...new Set(all.map((c) => c.spec))];
  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        {['all', ...fields].map((f) => (
          <button key={f} onClick={() => setField(f)} className={`label border px-2 py-1 ${field === f ? 'border-state text-ink' : 'border-ink/15 text-ink-soft'}`}>
            {f === 'all' ? `Everyone · ${all.length}` : SPEC_NAME[f as keyof typeof SPEC_NAME]}
          </button>
        ))}
      </div>
      {all.length === 0 && <p className="mt-3 font-serif italic text-ink-soft">Nobody is on the list yet.</p>}
      {exceptional.length > 0 && (
        <section className="mt-4">
          <h3 className="label text-ink-soft">Exceptional · they would change what the government can do, on their terms</h3>
          <ul className="mt-2 grid items-start gap-3 xl:grid-cols-2">{exceptional.map((c) => <Dossier key={c.id} s={s} c={c} dispatch={dispatch} />)}</ul>
        </section>
      )}
      {rest.length > 0 && (
        <section className="mt-5">
          <h3 className="label text-ink-soft">Everyone else</h3>
          <ul className="mt-2 grid items-start gap-3 xl:grid-cols-2">{rest.map((c) => <Dossier key={c.id} s={s} c={c} dispatch={dispatch} />)}</ul>
        </section>
      )}
    </div>
  );
}

/** For the post's own list: the named person's career, view and (if exceptional) terms, in brief. */
export function NamedNote({ id }: { id: string }) {
  const c = CANDIDATE_BY_ID[id];
  if (!c) return null;
  return (
    <div className="text-[13px] leading-snug">
      <p className="text-ink-soft">“{c.view}”</p>
      {c.exceptional && (
        <p className="text-honour">Exceptional, and serves only on stated terms (see The talent). Proposed benefit: {c.exceptional.capabilities.map((x) => x.text).join(' ')}</p>
      )}
      {c.plainExcellence && <p className="text-state">{c.plainExcellence}</p>}
    </div>
  );
}
