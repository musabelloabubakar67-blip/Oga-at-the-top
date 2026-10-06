'use client';

// THE TALENT POOL (plan 03)
// Every named person who could serve, read from the engine's candidate view:
// what their file says (or the truth, once checked), their career and what they
// believe about the job, whether they are free, and where they can be appointed.
// The four exceptional candidates are recruited here (contract R5): choose the
// post, answer each stated term, approach, then appoint once they agree. After
// that the dossier shows the team's cost, the capability while it is active,
// missed payroll, any breach and what followed. Ordinary candidates are appointed
// where the post is, in each post's own list of people.

import { useState } from 'react';
import { ASSETS } from '../content/assets';
import { CANDIDATE_BY_ID } from '../content/candidates';
import { INSTITUTION_BY_ID } from '../content/institutions';
import { CAST, REPLACEABLE } from '../content/names';
import { PERSON_BY_ID } from '../content/people';
import { SPEC_NAME } from '../content/talent';
import { TYCOON_BY_ID } from '../content/tycoons';
import { canApproach, canAppoint, canFundRecruitment, canPayRecruitmentArrears, getCandidateView, getRecruitmentView, type AppointmentPost } from '../engine/public';
import { movesLeft } from '../engine/reduce';
import { CHECK_PC } from '../engine/talent';
import type { Action, GameState } from '../engine/types';
import { ZONE_NAME } from '../engine/vars';

/** The appointment posts a role key can mean in this game (contract R5). An asset role means each electricity asset that exists. */
export function postsFor(s: GameState, role: string): AppointmentPost[] {
  if (role === 'fin') return [{ kind: 'finance' }];
  if (PERSON_BY_ID[role]?.group === 'minister') return [{ kind: 'minister', id: role }];
  if (REPLACEABLE.includes(role)) return [{ kind: 'adviser', id: role }];
  if (INSTITUTION_BY_ID[role]) return [{ kind: 'institution', id: role }];
  if (role === 'asset') return (s.assets ?? []).filter((a) => ['nuclear', 'export_power'].includes(a.id)).map((a) => ({ kind: 'asset', id: a.id }));
  return [];
}
export function postName(p: AppointmentPost): string {
  if (p.kind === 'finance') return 'Minister of Finance';
  if (p.kind === 'minister') return PERSON_BY_ID[p.id]?.title ?? p.id;
  if (p.kind === 'adviser') return CAST.find((c) => c.id === p.id)?.role ?? p.id;
  if (p.kind === 'institution') return `Head of ${(INSTITUTION_BY_ID[p.id]?.name ?? p.id).replace(/^An? |^The /, '').replace(/,.*$/, '')}`;
  const asset = ASSETS[p.id]?.name;
  return `Manager of ${asset ? asset.replace(/^The /, 'the ') : p.id}`;
}
const postKey = (p: AppointmentPost) => (p.kind === 'finance' ? 'finance' : `${p.kind}:${p.id}`);
const bn = (tn: number) => (tn * 1000 < 1 ? `₦${Math.round(tn * 1e6)}m` : `₦${Math.round(tn * 1000 * 10) / 10}bn`);
const RSTATE: Record<string, { text: string; tone: string }> = {
  declined: { text: 'Declined', tone: 'text-alarm' }, agreed: { text: 'Agreed · not yet appointed', tone: 'text-honour' },
  active: { text: 'In post on agreed terms', tone: 'text-state' }, suspended: { text: 'In post · team unfunded', tone: 'text-alarm' },
  resigned: { text: 'Resigned over a breach', tone: 'text-alarm' }, ended: { text: 'Appointment ended', tone: 'text-ink-soft' },
};

/** Negotiated appointment for an exceptional candidate (contract R5). */
function Recruit({ s, c, dispatch }: { s: GameState; c: View; dispatch: (a: Action) => void }) {
  const cand = CANDIDATE_BY_ID[c.id];
  const terms = cand?.exceptional?.conditions ?? [];
  const posts = (cand?.roles ?? []).flatMap((r) => postsFor(s, r)).filter((p, i, all) => all.findIndex((q) => postKey(q) === postKey(p)) === i);
  // Start on the first post that is actually open to this person.
  const [pick, setPick] = useState(() => Math.max(0, posts.findIndex((p) => canApproach(s, c.id, p, terms.map((k) => k.id), 1).reason !== 'This is not a suitable, available post.')));
  const [accepted, setAccepted] = useState<Record<string, boolean>>(() => Object.fromEntries(terms.map((k) => [k.id, true])));
  const left = movesLeft(s);
  const mine = getRecruitmentView(s).filter((r) => r.candidateId === c.id);
  const r = mine.filter((x) => x.currentAdministration).at(-1);
  const inherited = mine.filter((x) => !x.currentAdministration && x.arrears > 1e-12);
  const target = posts[Math.min(pick, posts.length - 1)];
  const chosen = terms.filter((k) => accepted[k.id]).map((k) => k.id);
  const asking = !r || r.status === 'declined';
  const can = target ? canApproach(s, c.id, target, chosen, left) : { ok: false, reason: 'No post this person can fill exists yet.' };
  const appoint = r?.status === 'agreed' ? canAppoint(s, c.id, r.post, left) : null;
  const fund = r && ['active', 'suspended'].includes(r.status) && r.monthlyCost ? canFundRecruitment(s, c.id) : null;
  const yearly = (r?.monthlyCost ?? 0) * 12;

  return (
    <div className="mt-2 border-l-2 border-honour pl-2 text-[13px] leading-snug">
      <p className="label text-honour">Would bring{r?.status === 'active' ? ' · in effect now' : ' · only once appointed on these terms'}</p>
      <ul className="mt-0.5 space-y-0.5">
        {(r?.capabilities ?? cand?.exceptional?.capabilities.map((x) => ({ ...x, active: false })) ?? []).map((cap) => (
          <li key={cap.id}>{'active' in cap && cap.active ? <span className="label mr-1 text-state">Active</span> : null}{cap.text}</li>
        ))}
      </ul>

      {r && (
        <p className="mt-2"><span className={`label mr-1 ${RSTATE[r.status].tone}`}>{RSTATE[r.status].text}</span>{postName(r.post)}. {r.reason}</p>
      )}

      {asking && (
        <>
          {posts.length > 1 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {posts.map((p, i) => <button key={postKey(p)} onClick={() => setPick(i)} className={`border px-2 py-0.5 ${i === pick ? 'border-state text-ink' : 'border-ink/20 text-ink-soft'}`}>{postName(p)}</button>)}
            </div>
          )}
          <p className="label mt-2 text-honour">Terms of acceptance · answer each one</p>
          <ul className="mt-0.5 space-y-1">
            {terms.map((k) => (
              <li key={k.id}>
                <label className="flex gap-2">
                  <input type="checkbox" checked={!!accepted[k.id]} onChange={(e) => setAccepted({ ...accepted, [k.id]: e.target.checked })} className="mt-1" />
                  <span>{k.text} <span className="text-ink-soft">If broken: {k.breach}</span></span>
                </label>
              </li>
            ))}
          </ul>
          {chosen.length < terms.length && <p className="mt-1 text-alarm">Any term refused and the answer will be no, with the reason on the record.</p>}
          <button disabled={!can.ok} title={can.reason} onClick={() => target && dispatch({ type: 'APPROACH_CANDIDATE', id: c.id, post: target, acceptedTerms: chosen })}
            className="mt-2 border border-ink/30 px-3 py-1 text-sm hover:border-state disabled:opacity-45">
            Approach for {target ? postName(target) : 'a post'} · 1 move, 2 capital
          </button>
          {!can.ok && can.reason && <p className="mt-1 text-ink-soft">{can.reason}</p>}
        </>
      )}

      {r?.status === 'agreed' && appoint && (
        <>
          <button disabled={!appoint.ok} title={appoint.reason} onClick={() => dispatch({ type: 'APPOINT', id: c.id, post: r.post })}
            className="mt-2 border border-ink/30 px-3 py-1 text-sm hover:border-state disabled:opacity-45">
            Appoint as {postName(r.post)}{r.monthlyCost ? ` · first month of the team, ${bn(r.monthlyCost)}` : ''}
          </button>
          {!appoint.ok && appoint.reason && <p className="mt-1 text-ink-soft">{appoint.reason}</p>}
        </>
      )}

      {r && ['active', 'suspended'].includes(r.status) && r.monthlyCost > 0 && (
        <div className="mt-2">
          <p>Specialist team: {bn(yearly)} a year, paid monthly ({bn(r.monthlyCost)}).{r.missed ? <span className="text-alarm"> {r.missed} month{r.missed === 1 ? '' : 's'} unpaid; {bn(r.arrears)} owed.</span> : null}{!r.funding ? <span className="text-alarm"> Payroll held by your instruction.</span> : null}</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {r.funding && <button onClick={() => dispatch({ type: 'HOLD_RECRUITMENT', id: c.id })} className="border border-ink/20 px-3 py-1 text-sm hover:border-alarm">Hold the team's payroll</button>}
            {fund && (!r.funding || r.arrears > 0) && (
              <button disabled={!fund.ok} title={fund.reason} onClick={() => dispatch({ type: 'FUND_RECRUITMENT', id: c.id })} className="border border-ink/30 px-3 py-1 text-sm hover:border-state disabled:opacity-45">
                Fund the team again{fund.amount ? ` · pay ${bn(fund.amount)} owed` : ''}
              </button>
            )}
          </div>
        </div>
      )}

      {inherited.map((x) => {
        const pay = canPayRecruitmentArrears(s, x.id);
        return (
          <p key={x.id} className="mt-2">
            <span className="label mr-1 text-alarm">Unpaid from a former government</span>{bn(x.arrears)} of team payroll from {c.short}&apos;s time as {postName(x.post)}. Paying it does not bring back that appointment.{' '}
            <button disabled={!pay.ok} title={pay.reason} onClick={() => dispatch({ type: 'PAY_RECRUITMENT_ARREARS', id: x.id })} className="underline disabled:opacity-45">Pay it</button>
          </p>
        );
      })}

      {r && r.history.length > 1 && (
        <ol className="mt-2 space-y-0.5 border-l border-ink/15 pl-2 text-ink-soft">{r.history.map((h, i) => <li key={i}>{h.text}</li>)}</ol>
      )}
    </div>
  );
}

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

      {exceptional && <Recruit s={s} c={c} dispatch={dispatch} />}

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
        <p className="text-honour">Exceptional: serves only on stated terms. Approach them first under Power, The talent; once they agree to this post they can be appointed here. Would bring: {c.exceptional.capabilities.map((x) => x.text).join(' ')}</p>
      )}
      {c.plainExcellence && <p className="text-state">{c.plainExcellence}</p>}
    </div>
  );
}
