'use client';

import { mo } from '../engine/config';
import { rivalsOf } from '../engine/rivals';
import { canLand, LANDING_PC, risky } from '../engine/formers';
import { canPortfolio, canReplaceVP, PORTFOLIO_PC, REPLACE_VP_PC, vpCandidates, vpTarget } from '../engine/vp';
import { canVisit, predEffect, predMood, PRED_VISIT_PC } from '../engine/predecessor';
import { federalCharacter, posts } from '../engine/federal';
import { Cases } from './Cases';
import { Inline, Overlay, CloseButton } from './shell';
import { Aimed } from './Aimed';
import { Candidates } from './Candidates';
import { candidatesFor } from '../engine/talent';
import { useContext, useState } from 'react';
import { PEOPLE, PERSON_BY_ID, RIVALS, type Group } from '../content/people';
import { TYCOONS } from '../content/tycoons';
import { dateLabel } from '../engine/config';
import { describe } from '../engine/effects';
import { moneyEffect } from '../engine/election';
import { canCall, canTycoon, kindOf, regard, tycoonMood, usesFor, who } from '../engine/favours';
import { canRival } from '../engine/opposition';
import {
  canDeal, governorEffect, ministerSpeed, personView, relWord, scorecard, senate, strongestRival,
} from '../engine/people';
import { movesLeft, sackCost } from '../engine/reduce';
import { competenceShown, following, seenCompetence } from '../engine/people';
import { currentWant, grudgeLine } from '../engine/wants';
import { REPLACE_PC, adviser, canReplaceAdviser, patronName, poolFor, trackRecord } from '../engine/advice';
import { REPLACEABLE } from '../content/names';
import { naira } from '../engine/text';
import type { Action, Favour, GameState } from '../engine/types';
import { grievances } from '../engine/targets';
import { CREDIT_PC, GROOM_MAX, GROOM_PC, canCredit, canGroom, candidate, candidateIds, creditable, groomWindow, shortlist } from '../engine/successor';
import { NOMINATE_PC, bench, benchVars, canNominate, forecastChallenge, nominees } from '../engine/courts';
import { ZONE_NAME, approval, delegates, favoursOwed, favoursOwing } from '../engine/vars';

type Dispatch = (a: Action) => void;
type Tab = Group | 'advisers' | 'money' | 'opposition' | 'courts' | 'succession' | 'owed' | 'federal';

const INTRO: Record<Tab, string> = {
  federal: 'Where the people you appoint come from, zone by zone.',
  governor: 'Each leads your party\'s governors in a zone. On election day a governor who is with you delivers votes there. One who is not sits on their hands. One who is neglected long enough can be taken by the opposition. They also own the delegates who decide whether you get the party\'s ticket for a second term: you need 47%.',
  senator: 'Reforms that need a law are voted on in the Senate, and your own senators decide whether they pass. Bills pass when the Senate stands at 50 or better; constitutional changes need more. The budget goes through them every December.',
  minister: 'A minister\'s competence sets how fast the reforms in the brief move, and whether the big bets in it can work. Each is judged from the day they took the job.',
  money: 'Five people who hold parts of the economy. Each can help or hurt in ways no minister can, and each wants something specific. Money that is with you campaigns for you. Money that is against you funds your rivals.',
  opposition: 'Three rivals, each feeding on a different failure, and each with moves of their own. Whoever is strongest on election day is who you face.',
  advisers: 'Every forecast on your desk comes from one of these people. Reputation is what the files say about them. The record is what actually happened: how often their forecasts were close, and whom their advice turned out to serve. Read it before you trust them.',
  owed: 'Nothing here is written down anywhere else. What people owe you can be spent, once, on the politics screen or on a file on your desk. What you owe will be called in.',
  succession: 'Anyone in your government can be built up to succeed you. What they bring to the election is their structure, their record and how long you have spent on them. What they bring you afterwards is their loyalty, which remembers how you treated them, and their integrity, which decides whether loyalty is enough to protect what you did.',
  courts: 'Seven justices who will outlast you. They decide your election petition on appeal, whether your harshest orders stand, and whether someone who loses from a reform can freeze it. When a seat falls vacant you choose who fills it, and the Senate decides whether to let you.',
};

export function senateLine(s: GameState): string {
  const v = senate(s);
  return v >= 56 ? 'Firmly yours' : v >= 50 ? 'With you, narrowly' : v >= 44 ? 'Slipping away' : 'Against you';
}

const btn = (ok: boolean, tone: 'plain' | 'good' | 'bad' = 'plain') =>
  `border px-3 py-1.5 text-left font-serif ${!ok ? 'border-ink/10 opacity-45'
    : tone === 'good' ? 'border-state bg-state/10 hover:bg-state/20'
      : tone === 'bad' ? 'border-alarm/50 text-alarm hover:bg-alarm/5'
        : 'border-ink/30 hover:border-state hover:bg-state/5'}`;

function Fx({ fx }: { fx: Parameters<typeof describe>[0] }) {
  return (
    <span className="mt-1 flex flex-wrap gap-x-3 text-[13px]">
      {describe(fx).map((c, i) => (
        <span key={i} className={c.good ? 'text-state' : 'text-alarm'}><span className="text-ink-soft">{c.label}</span> {c.arrows}</span>
      ))}
    </span>
  );
}

/** A favour owed to the President, and what it can be spent on. */
function Owed({ s, f, dispatch, left }: { s: GameState; f: Favour; dispatch: Dispatch; left: number }) {
  const [open, setOpen] = useState(false);
  const w = who(s, f.who);
  const can = canCall(s, f, left);
  return (
    <div className="mt-2 border-l-2 border-state bg-state/5 px-3 py-2">
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-serif leading-snug">{w.short} owes you <span className="text-state">{'●'.repeat(f.size)}</span></span>
        <button onClick={() => setOpen(!open)} disabled={!can.ok} className={`label ${can.ok ? 'text-state hover:underline' : 'text-ink-soft'}`}>{open ? 'Not now' : 'Call it in →'}</button>
      </p>
      <p className="text-[13px] leading-snug text-ink-soft">{f.why} Since {dateLabel(f.turn, s.startYear)}.{!can.ok && can.reason ? ` ${can.reason}` : ''}</p>
      {open && can.ok && (
        <div className="mt-2 flex flex-col gap-1.5">
          {usesFor(s, f).map((u) => (
            <button key={u.id} onClick={() => { dispatch({ type: 'FAVOUR', id: f.id, use: u.id }); setOpen(false); }} className={btn(true, 'good')}>
              {u.label}<span className="block text-[13px] leading-snug text-ink-soft">{u.detail}</span>
            </button>
          ))}
          <p className="text-[12.5px] text-ink-soft">Costs one move. The favour is spent, and nobody enjoys paying: they will like you a little less.</p>
        </div>
      )}
    </div>
  );
}

function Owing({ s, f }: { s: GameState; f: Favour }) {
  const w = who(s, f.who);
  const months = s.turn - f.turn;
  return (
    <div className="mt-2 border-l-2 border-alarm bg-alarm/5 px-3 py-2">
      <p className="font-serif leading-snug">You owe {w.short} <span className="text-alarm">{'●'.repeat(f.size)}</span></p>
      <p className="text-[13px] leading-snug text-ink-soft">{f.why} {months >= 8 ? 'They have waited long enough to ask.' : `They will ask within ${8 - months} months.`} Giving them what they want settles it.</p>
    </div>
  );
}

function FavoursOf({ s, id, dispatch, left }: { s: GameState; id: string; dispatch: Dispatch; left: number }) {
  return (
    <>
      {favoursOwed(s, id).map((f) => <Owed key={f.id} s={s} f={f} dispatch={dispatch} left={left} />)}
      {favoursOwing(s, id).map((f) => <Owing key={f.id} s={s} f={f} />)}
    </>
  );
}

function Bar({ v, bad }: { v: number; bad?: boolean }) {
  return <div className="mt-2 h-1.5 bg-ink/10"><div className={`h-1.5 transition-all duration-700 ${bad ? 'bg-alarm' : 'bg-state'}`} style={{ width: `${Math.max(2, v)}%` }} /></div>;
}

const GRADE: Record<string, string> = { A: 'text-state', B: 'text-state', C: 'text-ink', D: 'text-alarm', F: 'text-alarm' };

export function PeopleModal({ s, dispatch, onClose, start }: { s: GameState; dispatch: Dispatch; onClose: () => void; start?: Tab }) {
  const wide = useContext(Inline);
  const cards = wide ? 'grid items-start gap-3 xl:grid-cols-2' : 'space-y-3';
  const [tab, setTab] = useState<Tab>(start ?? 'governor');
  const [swap, setSwap] = useState<string | null>(null);
  const [before] = useState(s.lastAction?.text);
  const said = s.lastAction && s.lastAction.text !== before ? s.lastAction.text : null;
  const left = movesLeft(s);
  const top = strongestRival(s);
  const owed = favoursOwed(s);
  const owing = favoursOwing(s);
  const money = moneyEffect(s);
  const tabs: [Tab, string][] = [
    ['advisers', 'Your advisers'], ['governor', 'Your governors'], ['senator', 'Your senators'], ['minister', 'Your ministers'],
    ['money', 'The money'], ['opposition', 'The opposition'], ['courts', 'The courts'], ['succession', 'The succession'] as [Tab, string], ['federal', 'Federal character'] as [Tab, string], ['owed', `Favours · ${owed.length} owed to you, ${owing.length} by you`],
  ];

  return (
    <Overlay onClose={onClose} paper>
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="label text-state">Politics</p>
            <h2 className="mt-1 font-serif text-3xl">Who is with you</h2>
          </div>
          <p className="label text-right text-ink-soft">{left} {left === 1 ? 'move' : 'moves'} left<br />Senate: {senateLine(s)} ({Math.round(senate(s))})<br />Convention delegates with you: {Math.round(delegates(s))}%</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 border-b rule">
          {tabs.map(([id, name]) => (
            <button key={id} onClick={() => setTab(id)} className={`label pb-2 ${tab === id ? 'border-b-2 border-state text-ink' : 'text-ink-soft'}`}>{name}</button>
          ))}
        </div>
        <p className="mt-3 text-sm leading-snug text-ink-soft">{INTRO[tab]}</p>
        {said && <p className="fade-in mt-3 border-l-2 border-honour bg-paper-dim px-3 py-2 font-serif leading-snug">{said}</p>}

        {tab === 'advisers' && <VicePresident s={s} dispatch={dispatch} left={left} />}
        {tab === 'advisers' && <Formers s={s} dispatch={dispatch} left={left} />}
        {tab === 'advisers' && (
          <ul className="mt-4 space-y-3">
            {Object.keys(s.chars).map((role) => {
              const a = adviser(s, role);
              if (!a) return null;
              const r = trackRecord(s, role);
              return (
                <li key={role} className="border border-ink/20 p-3">
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-serif text-lg">{a.name}</span>
                    <span className="label text-ink-soft">{a.title}</span>
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">
                    Reputation: {a.rep.competence >= 4 ? 'able' : a.rep.competence <= 2 ? 'out of their depth' : 'adequate'}, {a.rep.loyalty >= 4 ? 'loyal' : a.rep.loyalty <= 2 ? 'their own person' : 'reliable enough'}.
                  </p>
                  <p className="mt-1 text-sm">
                    {r.checked === 0 ? 'No forecasts checked yet.' : `Forecasts checked: ${r.checked}. Close to what happened: ${r.close} (${Math.round((r.close / r.checked) * 100)}%). You followed their recommendation ${r.followed} ${r.followed === 1 ? 'time' : 'times'}.`}
                  </p>
                  {r.served.map(([who, n]) => (
                    <p key={who} className="mt-1 text-sm text-alarm">Their recommendations have helped {patronName(who)} {n} {n === 1 ? 'time' : 'times'}.</p>
                  ))}
                  {REPLACEABLE.includes(role) && (
                    <button onClick={() => setSwap(swap === role ? null : role)} className="mt-2 border border-ink/30 px-3 py-1 font-serif text-sm hover:border-state">
                      {swap === role ? 'Keep them' : 'Replace…'}
                    </button>
                  )}
                  {swap === role && (
                    <Candidates s={s} role={role} offers={poolFor(s, role)} dispatch={dispatch} left={left}
                      can={(name) => canReplaceAdviser(s, role, name, left)} label={`Bring in as ${a.title} · ${REPLACE_PC} capital · 1 move`}
                      appoint={(name) => { dispatch({ type: 'REPLACE_ADVISER', role, name }); setSwap(null); }} />
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {tab === 'succession' && <Succession s={s} dispatch={dispatch} left={left} />}
        {tab === 'courts' && <Courts s={s} dispatch={dispatch} left={left} />}
        {tab === 'federal' && <Federal s={s} />}

        {tab === 'owed' && (
          <div className="mt-4">
            <h3 className="label border-b rule pb-1 text-state">Owed to you</h3>
            {owed.length === 0 && <p className="mt-2 font-serif italic text-ink-soft">Nobody owes you anything. Favours are made by giving people what they want, shielding them, or backing them when it costs you.</p>}
            {owed.map((f) => <Owed key={f.id} s={s} f={f} dispatch={dispatch} left={left} />)}
            <h3 className="label mt-6 border-b rule pb-1 text-alarm">Owed by you</h3>
            {owing.length === 0 && <p className="mt-2 font-serif italic text-ink-soft">You owe nobody. It will not last.</p>}
            {owing.map((f) => <Owing key={f.id} s={s} f={f} />)}
          </div>
        )}

        {tab === 'money' && (
          <>
            <p className={`mt-3 text-sm ${money >= 0 ? 'text-state' : 'text-alarm'}`}>
              On election day the money is worth {money >= 0 ? '+' : ''}{money.toFixed(1)} points of vote share to you.
            </p>
            <ul className={`mt-3 ${cards}`}>
              {TYCOONS.map((t) => {
                const st = s.tycoons[t.id];
                const grant = canTycoon(s, t.id, 'grant', left);
                const squeeze = canTycoon(s, t.id, 'squeeze', left);
                const take = canTycoon(s, t.id, 'take', left);
                const court = canTycoon(s, t.id, 'court', left);
                return (
                  <li key={t.id} className="border border-ink/20 p-4">
                    <p className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-serif text-xl">{t.name}</span>
                      <span className={`font-serif ${st.rel < 35 ? 'text-alarm' : st.rel >= 60 ? 'text-state' : ''}`}>{tycoonMood(st.rel)}</span>
                    </p>
                    <p className="label text-ink-soft">{t.title}{s.flags.financier === t.id ? ' · paid for your campaign' : ''}</p>
                    <Bar v={st.rel} bad={st.rel < 35} />
                    <p className="mt-2 text-sm leading-snug">{t.bio}</p>
                    <p className={`mt-1 text-sm leading-snug ${st.rel >= 60 ? 'text-state' : 'text-ink-soft'}`}><span className="label mr-1">With you</span>{t.friendly}</p>
                    <p className={`mt-1 text-sm leading-snug ${st.rel < 35 ? 'text-alarm' : 'text-ink-soft'}`}><span className="label mr-1">Against you</span>{t.hostile}</p>
                    {st.reasons.length > 0 && (
                      <p className="mt-1.5 text-[13px] leading-snug text-ink-soft"><span className="label mr-1">Why</span>{st.reasons.join(' ')}</p>
                    )}
                    <Wronged s={s} id={t.id} />
                    <Aimed s={s} kind="tycoon" id={t.id} dispatch={dispatch} />
                    <FavoursOf s={s} id={t.id} dispatch={dispatch} left={left} />

                    <div className="mt-3 border-l-2 border-honour bg-paper-dim px-3 py-2">
                      <p className="label text-ink-soft">{st.inherited ? 'Your predecessor gave, and it is up for renewal' : st.granted ? 'You gave' : 'Wants'}</p>
                      <p className="font-serif leading-snug">{t.want.text}</p>
                      {(!st.granted || st.inherited) && <Fx fx={st.inherited ? t.want.fx.map(([k, d]) => [k, d * 0.5] as [string, number]) : t.want.fx} />}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(!st.granted || st.inherited) && (
                        <button disabled={!grant.ok} title={grant.reason} onClick={() => dispatch({ type: 'TYCOON', id: t.id, op: 'grant' })} className={btn(grant.ok, 'good')}>
                          {st.inherited ? 'Renew it in your name' : 'Give what is asked'}{[t.want.pc && ` · ${st.inherited ? Math.round(t.want.pc / 2) : t.want.pc} capital`, t.want.naira && ` · ${naira(st.inherited ? t.want.naira / 2 : t.want.naira)}`].filter(Boolean).join('')}
                        </button>
                      )}
                      <button disabled={!court.ok} title={court.reason} onClick={() => dispatch({ type: 'TYCOON', id: t.id, op: 'court' })} className={btn(court.ok, 'good')}>
                        Invite to the Villa · 3 capital · warmer for a year
                      </button>
                      <button disabled={!take.ok} title={take.reason} onClick={() => dispatch({ type: 'TYCOON', id: t.id, op: 'take' })} className={btn(take.ok)}>
                        Take ₦8bn for the campaign
                      </button>
                      <button disabled={!squeeze.ok} title={squeeze.reason} onClick={() => dispatch({ type: 'TYCOON', id: t.id, op: 'squeeze' })} className={btn(squeeze.ok, 'bad')}>
                        {t.squeeze.name} · 5 capital
                      </button>
                    </div>
                    <Fx fx={t.squeeze.fx} />
                    <p className="mt-2 text-[13px] leading-snug text-ink-soft">
                      Giving what is asked wins them, settles anything you owe them, and otherwise leaves them owing you. An invitation to the Villa costs nothing but time and capital and warms them for a year, a little less each time. What a predecessor did to them, good or bad, counts for half. Taking money puts you in their debt, and they become a witness. Setting the agencies on them brings in money and makes an enemy for two years.
                    </p>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {tab === 'opposition' && <FormerPresident s={s} dispatch={dispatch} left={left} />}
        {tab === 'opposition' && (
          <>
            <ul className={`mt-4 ${cards}`}>
              {rivalsOf(s).map((r) => {
                const v = s.opposition[r.id] ?? 0;
                const inside = !!s.flags[`rival.${r.id}.in`];
                const coopt = canRival(s, r.id, 'coopt', left);
                const debate = canRival(s, r.id, 'debate', left);
                const agencies = canRival(s, r.id, 'agencies', left);
                const funders = TYCOONS.filter((t) => s.tycoons[t.id].rel < 35 && (t.funds === r.id || (t.funds === 'lead' && top.id === r.id)));
                return (
                  <li key={r.id} className="border border-ink/20 p-4">
                    <p className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-serif text-xl">{r.name}</span>
                      {inside ? <span className="label border border-state/50 px-1.5 py-0.5 text-state">In your government</span>
                        : top.id === r.id && <span className="label border border-alarm/50 px-1.5 py-0.5 text-alarm">Your likely challenger</span>}
                    </p>
                    <p className="label text-ink-soft">{r.party} · strength {Math.round(v)}</p>
                    <Wronged s={s} id={r.id} />
                    {!inside && <Aimed s={s} kind="rival" id={r.id} dispatch={dispatch} />}
                    <Bar v={v} bad />
                    <p className="mt-2 text-sm leading-snug">{r.style}</p>
                    <p className="mt-1 text-sm italic leading-snug text-ink-soft">{r.feeds}</p>
                    {funders.length > 0 && <p className="mt-1 text-sm text-alarm">Funded by {funders.map((t) => t.short).join(' and ')}, who {funders.length === 1 ? 'has' : 'have'} turned against you.</p>}
                    <FavoursOf s={s} id={r.id} dispatch={dispatch} left={left} />
                    {!inside && (
                      <div className="mt-3 flex flex-col gap-2">
                        <button disabled={!coopt.ok} onClick={() => dispatch({ type: 'RIVAL', id: r.id, op: 'coopt' })} className={btn(coopt.ok, 'good')}>
                          {r.deal.name} · {r.deal.pc} capital{r.deal.naira ? ` · ${naira(r.deal.naira)}` : ''}
                          <span className="block text-[13px] leading-snug text-ink-soft">{coopt.ok ? r.deal.text : coopt.reason}</span>
                        </button>
                        <button disabled={!debate.ok} onClick={() => dispatch({ type: 'RIVAL', id: r.id, op: 'debate' })} className={btn(debate.ok)}>
                          Debate them, live
                          <span className="block text-[13px] leading-snug text-ink-soft">{debate.ok ? `Your approval against their strength, with some luck. You win if you are the more popular; today that is ${Math.round(approval(s))} against ${Math.round(v)}.` : debate.reason}</span>
                        </button>
                        <button disabled={!agencies.ok} onClick={() => dispatch({ type: 'RIVAL', id: r.id, op: 'agencies' })} className={btn(agencies.ok, 'bad')}>
                          Set the agencies on them · 6 capital
                          <span className="block text-[13px] leading-snug text-ink-soft">{agencies.ok ? 'Weakens them sharply. Costs integrity and the press. About one time in three it makes a martyr and they come back stronger.' : agencies.reason}</span>
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
            {!!s.flags['drawer.open'] && !s.flags['drawer.sealed'] && (() => {
              const sp = canRival(s, top.id, 'spoiler', left);
              return (
                <button disabled={!sp.ok} onClick={() => dispatch({ type: 'RIVAL', id: top.id, op: 'spoiler' })} className={`mt-3 w-full ${btn(sp.ok, 'bad')}`}>
                  Fund a spoiler candidate · ₦15bn from the drawer
                  <span className="block text-[13px] leading-snug text-ink-soft">{sp.ok ? 'A fourth candidate, a new party and a large billboard budget. Splits the opposition vote on election day. Somebody will know.' : sp.reason}</span>
                </button>
              );
            })()}
            <h3 className="label mt-6 border-b rule pb-1 text-ink-soft">What they have been doing</h3>
            {s.oppLog.length === 0
              ? <p className="mt-2 font-serif italic text-ink-soft">Nothing yet. They are waiting for you to give them an opening.</p>
              : (
                <ul className="mt-2 space-y-1.5">
                  {[...s.oppLog].reverse().slice(0, 8).map((m, i) => (
                    <li key={i} className="flex gap-3 font-serif leading-snug">
                      <span className="label w-24 shrink-0 pt-1 text-ink-soft">{dateLabel(m.turn, s.startYear)}</span><span>{m.text}</span>
                    </li>
                  ))}
                </ul>
              )}
          </>
        )}

        {(tab === 'governor' || tab === 'senator' || tab === 'minister') && (
          <ul className={`mt-4 ${cards}`}>
            {PEOPLE.filter((p) => p.group === tab).map((base) => {
              const p = personView(s, base.id);
              const st = s.people[base.id];
              const court = canDeal(s, p.id, 'court', left);
              const grant = canDeal(s, p.id, 'grant', left);
              const press = canDeal(s, p.id, 'pressure', left);
              const leaned = !!p.compliantUntil && p.compliantUntil > s.turn;
              const eff = p.zone ? governorEffect(s, p.zone) : 0;
              const card = base.group === 'minister' ? scorecard(s, base.id) : null;
              const original = !st.name;
              const want = currentWant(s, p.id);
              const sponsor = base.sponsor && original ? PERSON_BY_ID[base.sponsor] : null;
              return (
                <li key={p.id} className={`border p-4 ${st.gone ? 'border-alarm/40 opacity-70' : 'border-ink/20'}`}>
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-serif text-xl">{p.name}</span>
                    <span className={`font-serif ${st.gone || p.standing < 42 ? 'text-alarm' : p.standing >= 58 ? 'text-state' : ''}`}>
                      {st.gone ? 'Gone to the opposition' : relWord(p.standing)}{leaned && !st.gone && ' (obeying)'}
                    </span>
                  </p>
                  <p className="label text-ink-soft">{p.title} · influence {'●'.repeat(p.clout ?? 1)}{'○'.repeat(5 - (p.clout ?? 1))}</p>
                  <Bar v={p.standing} bad={p.standing < 42} />
                  <p className="mt-2 text-sm leading-snug">{p.bio}</p>

                  {p.zone && !st.gone && (
                    <p className={`mt-1 text-sm ${eff >= 0 ? 'text-state' : 'text-alarm'}`}>
                      On election day in the {ZONE_NAME[p.zone]}: {eff >= 0 ? '+' : ''}{eff.toFixed(1)} points
                    </p>
                  )}

                  {card && (
                    <div className="mt-3 border border-ink/15 bg-paper-dim p-3">
                      <p className="flex items-baseline justify-between gap-2">
                        <span className="label text-ink-soft">{card.published ? 'Published scorecard' : 'Scorecard · the Chief of Staff\'s private view'} · {card.months} months in the job</span>
                        <span className={`font-serif text-3xl ${GRADE[card.grade]}`}>{card.grade}</span>
                      </p>
                      <p className="font-serif leading-snug">{card.read}</p>
                      <ul className="mt-2 grid gap-x-4 gap-y-0.5 text-sm sm:grid-cols-2">
                        <li className="flex justify-between gap-2">
                          <span className="text-ink-soft">{competenceShown(s, p.id) ? 'Competence, proven in office' : 'Competence, by reputation'}</span>
                          <span>{'●'.repeat(seenCompetence(s, p.id))}{'○'.repeat(5 - seenCompetence(s, p.id))}</span>
                        </li>
                        {competenceShown(s, p.id) && st.repCompetence !== undefined && st.repCompetence !== p.competence && (
                          <li className="col-span-full text-[13px] text-ink-soft">{(p.competence ?? 3) > st.repCompetence ? 'Better than the files said.' : 'Not as able as the files said.'}</li>
                        )}
                        <li className="flex justify-between gap-2"><span className="text-ink-soft">Following</span><span>{['None', 'A few', 'Some', 'Considerable', 'Large', 'A faction'][following(s, p.id)]}</span></li>
                        {card.lines.map((l) => (
                          <li key={l.label} className="flex justify-between gap-2">
                            <span className="text-ink-soft">{l.label}</span>
                            <span className={l.good === null ? '' : l.good ? 'text-state' : 'text-alarm'}>{l.value}</span>
                          </li>
                        ))}
                        <li className="flex justify-between gap-2"><span className="text-ink-soft">Ambition</span><span>{['Content', 'Some', 'Considerable', 'Wants your job'][p.ambition ?? 0]}</span></li>
                        {sponsor && <li className="flex justify-between gap-2"><span className="text-ink-soft">Nominee of</span><span>{sponsor.short}</span></li>}
                      </ul>
                      {card.marks.length > 0 && (
                        <ul className="mt-2 space-y-0.5 text-[13px] leading-snug">
                          {card.marks.map((m, i) => (
                            <li key={i} className={m.d > 0 ? 'text-state' : 'text-alarm'}>{m.d > 0 ? '＋' : '−'} {m.text} <span className="text-ink-soft">({dateLabel(m.turn, s.startYear)})</span></li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-2 text-[12.5px] text-ink-soft">
                        Reforms in this brief run at {Math.round(ministerSpeed(s, base.tracks?.[0] ?? '') * 100)}% speed. Big bets in it need competence of 4 or better.
                        {!card.published && ' Deliver "Delivery unit and published scorecards" and these become public, and every minister works a little harder.'}
                      </p>
                    </div>
                  )}

                  <FavoursOf s={s} id={p.id} dispatch={dispatch} left={left} />

                  {want && !st.gone && (
                    <div className="mt-3 border-l-2 border-honour bg-paper-dim px-3 py-2">
                      <p className="label text-ink-soft">Wants{(st.grants ?? 0) > 0 ? ` · given ${st.grants} ${st.grants === 1 ? 'thing' : 'things'} before, and the asks grow` : ''}</p>
                      <p className="font-serif leading-snug">{want.text}</p>
                      <Fx fx={want.fx} />
                    </div>
                  )}
                  {!want && !st.gone && (st.grants ?? 0) > 0 && <p className="mt-2 text-[13px] text-ink-soft">Satisfied for now. They will ask again.</p>}
                  <Wronged s={s} id={p.id} />
                  {grudgeLine(s, p.id) && <p className={`mt-1 text-[13px] ${st.grudge ? 'text-alarm' : 'text-ink-soft'}`}>{grudgeLine(s, p.id)}</p>}

                  {!st.gone && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button disabled={!court.ok} title={court.reason} onClick={() => dispatch({ type: 'PERSON', id: p.id, op: 'court' })} className={btn(court.ok)}>
                        Give them your time
                      </button>
                      {want && (
                        <button disabled={!grant.ok} title={grant.reason} onClick={() => dispatch({ type: 'PERSON', id: p.id, op: 'grant' })} className={btn(grant.ok, 'good')}>
                          Give them what they want{[want.pc && ` · ${want.pc} capital`, want.naira && ` · ${naira(want.naira)}`].filter(Boolean).join('')}
                        </button>
                      )}
                      {want && (() => {
                        const no = canDeal(s, p.id, 'refuse', left);
                        return (
                          <button disabled={!no.ok} title={no.reason} onClick={() => dispatch({ type: 'PERSON', id: p.id, op: 'refuse' })} className={btn(no.ok, 'bad')}>
                            Refuse · no move
                          </button>
                        );
                      })()}
                      {base.group !== 'minister' && (
                        <button disabled={!press.ok} title={press.reason} onClick={() => dispatch({ type: 'PERSON', id: p.id, op: 'pressure' })} className={btn(press.ok, 'bad')}>
                          Lean on them · 4 capital
                        </button>
                      )}
                      {base.group === 'minister' && (['technocrat', 'party'] as const).map((kind) => {
                        const cost = sackCost(s, p.id);
                        const ok = left > 0 && s.pc >= cost;
                        return (
                          <button key={kind} disabled={!ok} onClick={() => dispatch({ type: 'REPLACE_MINISTER', id: p.id, kind })} className={btn(ok)}>
                            {kind === 'technocrat' ? 'Replace with a technocrat' : 'Replace with a party nominee'} · {cost} capital
                          </button>
                        );
                      })}
                      {base.group === 'minister' && (
                        <button onClick={() => setSwap(swap === p.id ? null : p.id)} className={btn(true)}>{swap === p.id ? 'Close the list' : 'Choose someone…'}</button>
                      )}
                    </div>
                  )}
                  {base.group === 'minister' && swap === p.id && (() => {
                    const cost = sackCost(s, p.id);
                    return (
                      <Candidates s={s} role={p.id} offers={candidatesFor(s, p.id, 10)} dispatch={dispatch} left={left} label={`Appoint as ${p.title} · ${cost} capital · 1 move`}
                        can={() => (left <= 0 ? { ok: false, reason: "This month's moves are used." } : s.pc < cost ? { ok: false, reason: `Needs ${cost} political capital.` } : { ok: true })}
                        appoint={(name) => { dispatch({ type: 'REPLACE_MINISTER', id: p.id, kind: 'technocrat', name }); setSwap(null); }} />
                    );
                  })()}
                  {base.group !== 'minister' && !st.gone && (
                    <p className="mt-2 text-[13px] leading-snug text-ink-soft">
                      Time warms them a little, less each visit. Giving them what they want wins them properly and leaves them owing you a favour. Leaning on them buys eight months of obedience and a lasting grudge.
                    </p>
                  )}
                  {(tab === 'governor' || tab === 'senator') && !st.gone && <Aimed s={s} kind={tab} id={p.id} dispatch={dispatch} />}
                  {base.group === 'minister' && (
                    <p className="mt-2 text-[13px] leading-snug text-ink-soft">
                      A technocrat is highly competent and clean, and the party will resent it{sponsor ? `; ${sponsor.short} will take it personally` : ''}. A party nominee pleases the governors, slows every reform in the brief, and is not to be trusted with money.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <CloseButton onClose={onClose} className="mt-6" />
    </Overlay>
  );
}

export { kindOf, regard };

/** What your orders have done to them, and how long they will remember it. */
function Wronged({ s, id }: { s: GameState; id: string }) {
  const g = grievances(s, id);
  if (!g.length) return null;
  return (
    <p className="mt-1 text-[13px] leading-snug text-alarm">
      <span className="label mr-1">Remembers</span>
      {g.map((w) => `${w.what} (${dateLabel(w.turn)}; for ${w.until - s.turn} more months)`).join(' ')}
    </p>
  );
}

const LEAN: Record<string, string> = { you: 'With you', free: 'Independent', them: 'Against you' };

/** The Supreme Court: who sits, how they lean, who retires when, and whom you could put there. */
function Courts({ s, dispatch, left }: { s: GameState; dispatch: Dispatch; left: number }) {
  const b = bench(s);
  const v = benchVars(s);
  const f = forecastChallenge(s);
  const pool = nominees(s);
  const [seat, setSeat] = useState<number | null>(null);
  return (
    <div className="mt-4">
      <h3 className="label border-b rule pb-1 text-ink-soft">Prosecutions</h3>
      <Cases s={s} dispatch={dispatch} />
      <h3 className="label mt-5 border-b rule pb-1 text-ink-soft">The Supreme Court</h3>
      <p className="mt-2 text-sm text-ink-soft">
        The Supreme Court hears the election petition on appeal, challenges to orders that hit someone hard, and applications to freeze reforms.
        {' '}A challenge decided today would go {f.against} against you, {f.for} for you{f.unsure ? `, ${f.unsure} for whoever reaches them first` : ''}.
        {' '}{v.loyal >= 4 ? 'Four or more owe you their seats: the petition cannot be lost.' : v.honest >= 4 ? 'Four or more cannot be reached: a dirty campaign can be annulled.' : 'Neither side has four.'}
        {' '}{v.bought + v.hostile > 0 ? `${new Set(b.seats.filter((j) => j && j.lean !== 'you' && (j.lean === 'them' || j.integrity <= 2)).map((j) => j!.name)).size} can be reached by people who want a reform stopped.` : 'Nobody on the bench will freeze a reform for a fee.'}
        {b.packed > 0 ? ` You have appointed ${b.packed} loyalist${b.packed === 1 ? '' : 's'}${b.packed >= 3 ? ', and the country has noticed' : ''}.` : ''}
      </p>
      <ul className="mt-3 space-y-2">
        {b.seats.map((j, i) => (
          <li key={i} className="border border-ink/20 p-3">
            {j ? (
              <>
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-serif text-lg">{j.name}{j.chief ? ' · Chief Justice' : ''}</span>
                  <span className={`label ${j.lean === 'you' ? 'text-state' : j.lean === 'them' ? 'text-alarm' : 'text-ink-soft'}`}>{LEAN[j.lean]} · integrity {j.integrity}</span>
                </p>
                <p className="mt-1 text-sm leading-snug text-ink-soft">{j.blurb}{j.mine ? ' Appointed by you.' : ''} {j.retires - s.turn <= 96 ? `Retires in ${mo(j.retires - s.turn)}.` : ''}</p>
              </>
            ) : (
              <>
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-serif text-lg italic">Vacant</span>
                  <button onClick={() => setSeat(seat === i ? null : i)} className="label border border-ink/25 px-2 py-0.5 hover:border-state">{seat === i ? 'Close' : `Nominate · ${NOMINATE_PC} capital`}</button>
                </p>
                {seat === i && (
                  <ul className="mt-2 space-y-2">
                    {pool.map((n) => {
                      const can = canNominate(s, i, n.name, left);
                      return (
                        <li key={n.name}>
                          <button disabled={!can.ok} onClick={() => { dispatch({ type: 'NOMINATE', seat: i, name: n.name }); setSeat(null); }}
                            className={`w-full border px-3 py-2 text-left ${can.ok ? 'border-ink/25 hover:border-state hover:bg-state/5' : 'border-ink/10 opacity-50'}`}>
                            <span className="flex flex-wrap items-baseline justify-between gap-2">
                              <span className="font-serif">{n.name}</span>
                              <span className={`label ${n.lean === 'you' ? 'text-state' : 'text-ink-soft'}`}>{LEAN[n.lean]} · integrity {n.integrity}</span>
                            </span>
                            <span className="block text-sm leading-snug text-ink-soft">{n.blurb}</span>
                            <Fx fx={n.fx as never} />
                            <span className={`block text-[13px] ${n.confirms ? 'text-ink-soft' : 'text-alarm'}`}>{n.why}{n.confirms ? '' : ' The Senate would reject them today, and the nominee would not be offered again.'}</span>
                            {n.lean === 'you' && b.packed === 2 && <span className="block text-[13px] text-alarm">A third loyalist and the bench is called packed: integrity −4, press −5, and it is remembered.</span>}
                            {!can.ok && can.reason && <span className="block text-[13px] text-alarm">{can.reason}</span>}
                          </button>
                        </li>
                      );
                    })}
                    {pool.length === 0 && <li className="text-sm italic text-ink-soft">Nobody left to nominate. The seat stays empty.</li>}
                  </ul>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Who could succeed you, what each would bring, and grooming them. */
function VicePresident({ s, dispatch, left }: { s: GameState; dispatch: Dispatch; left: number }) {
  const vp = s.vp;
  const [swap, setSwap] = useState(false);
  if (!vp) return null;
  const tg = vpTarget(s);
  const port = canPortfolio(s, left);
  const working = vp.portfolio !== undefined && s.turn - vp.portfolio < 24;
  const heir = s.flags['succession.backed'] === 'vp';
  return (
    <div className="mt-4 border border-state/40 p-4">
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-serif text-xl">{vp.name}</span>
        <span className={`font-serif ${vp.rel < 35 ? 'text-alarm' : vp.rel >= 60 ? 'text-state' : ''}`}>{vp.rel >= 70 ? 'Your partner' : vp.rel >= 50 ? 'Loyal' : vp.rel >= 35 ? 'Restless' : 'Working against you'}</span>
      </p>
      <p className="label text-ink-soft">Vice President · {ZONE_NAME[vp.zone]} · since {dateLabel(vp.since, s.startYear)}{working ? ' · chairs the economic council' : ''}{vp.sidelined ? ' · sidelined' : ''}{heir ? ' · your chosen successor' : ''}</p>
      <Bar v={vp.rel} bad={vp.rel < 35} />
      <p className="mt-2 text-sm leading-snug">{vp.blurb}</p>
      <p className="mt-1 text-[13px] leading-snug text-ink-soft">
        Competence {vp.competence}, loyalty {vp.loyalty}, integrity {vp.integrity}, clout {vp.clout}{vp.ambition >= 2 ? ', and ambitious' : ''}. {tg.why.length ? `${tg.why.join('. ')}.` : ''}
        {' '}Carries the {ZONE_NAME[vp.zone]} at your re-election. {working && vp.rel >= 50 ? `The council work adds to state capacity every month.` : ''} {vp.rel < 35 ? 'A cold, ambitious Vice President briefs against you and strains the party every month.' : ''}
        {' '}The Vice President can be groomed as your successor from the succession tab, with a head start for every year at your side.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button disabled={!port.ok} title={port.reason} onClick={() => dispatch({ type: 'VP', op: 'portfolio' })} className={btn(port.ok, 'good')}>Give the Vice President real work · {PORTFOLIO_PC} capital</button>
        <button disabled={vp.sidelined || left <= 0} onClick={() => dispatch({ type: 'VP', op: 'sideline' })} className={btn(!vp.sidelined && left > 0, 'bad')}>Sideline the Vice President</button>
        <button onClick={() => setSwap(!swap)} className={btn(true)}>{swap ? 'Keep the ticket' : 'Change the running mate'}</button>
      </div>
      {swap && (
        <div className="mt-2">
          {(() => { const c = canReplaceVP(s, '', left); return c.reason && c.reason !== 'Not available.' ? <p className="text-[13px] text-ink-soft">{c.reason}</p> : null; })()}
          <Candidates s={s} role="vp" offers={vpCandidates(s)} dispatch={dispatch} left={left} label={`Make running mate · ${REPLACE_VP_PC} capital · 1 move`}
            appoint={(name) => { dispatch({ type: 'VP', op: 'replace', name }); setSwap(false); }} can={(name) => canReplaceVP(s, name, left)} />
        </div>
      )}
    </div>
  );
}

function Formers({ s, dispatch, left }: { s: GameState; dispatch: Dispatch; left: number }) {
  const list = risky(s);
  if (!list.length) return null;
  return (
    <div className="mt-4 border border-alarm/40 p-4">
      <p className="label text-alarm">Former officials who know things</p>
      <p className="mt-1 text-[13px] leading-snug text-ink-soft">They left posts that witnessed what went into the drawer. For two years after leaving, any of them may talk; the more they saw, the likelier. A soft landing keeps them quiet.</p>
      <ul className="mt-2 space-y-1.5">
        {list.map((f) => {
          const can = canLand(s, f.name, left);
          return (
            <li key={f.name} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span><span className="font-serif">{f.name}</span> <span className="text-ink-soft">· former {f.post} · witnessed {f.knows} · {mo(24 - (s.turn - f.left))} of risk left</span></span>
              <button disabled={!can.ok} title={can.reason} onClick={() => dispatch({ type: 'LAND_FORMER', name: f.name })} className={btn(can.ok)}>An embassy abroad · {LANDING_PC} capital</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FormerPresident({ s, dispatch, left }: { s: GameState; dispatch: Dispatch; left: number }) {
  const p = s.predecessor;
  if (!p) return null;
  const gone = !!s.flags['pred.gone'];
  const rel = p.rel ?? 50;
  const can = canVisit(s, left);
  return (
    <div className="mt-4 border border-ink/25 p-4">
      <p className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-serif text-xl">President {p.name} (former)</span>
        <span className={`font-serif ${rel < 35 ? 'text-alarm' : rel >= 60 ? 'text-state' : ''}`}>{gone ? 'Out of the picture' : predMood(rel)}</span>
      </p>
      <p className="label text-ink-soft">{p.party}{p.sameParty ? ' · your own party' : ' · the other party'}{p.zone ? ` · ${ZONE_NAME[p.zone]}` : ''} · remembered as {p.epithet}</p>
      {!gone && <Bar v={rel} bad={rel < 35} />}
      <p className="mt-2 text-sm leading-snug">{gone ? 'Convicted, or abroad and out of reach. The influence went with the freedom.' : predEffect(s)}</p>
      {!gone && (
        <>
          <p className="mt-1 text-[13px] leading-snug text-ink-soft">The former President asks for things through files: a post, a road, an audit left alone. How you answer moves this. A case against them ends the friendship; a conviction ends the influence.</p>
          <button disabled={!can.ok} title={can.reason} onClick={() => dispatch({ type: 'PRED_VISIT' })} className={`mt-2 ${btn(can.ok, 'good')}`}>Call on the former President · {PRED_VISIT_PC} capital · +10</button>

        </>
      )}
    </div>
  );
}

function Federal({ s }: { s: GameState }) {
  const f = federalCharacter(s);
  const ps = posts(s);
  return (
    <div className="mt-4">
      <p className="text-sm text-ink-soft">
        The constitution asks that federal appointments reflect the country, and every zone keeps count. The big posts (six ministers, Finance, the Chief of Staff and the political adviser, and at half weight the heads of institutions and managers of assets) are counted by where the holder comes from. A zone below its share cools on you every month; a zone with nobody at all cools faster, and its governor takes it personally. Replace people from the ministers, advisers and institutions screens; every candidate shows their zone.
        {f.nepotism ? <span className="text-alarm"> Your own zone holds {f.home} of the posts: the papers have a word for it, and use it every month.</span> : ''}
      </p>
      <table className="mt-3 w-full text-left text-sm">
        <thead><tr className="label text-ink-soft"><th className="py-1">Zone</th><th className="text-right">Posts</th><th className="text-right">Even share</th><th className="pl-3">Who</th><th className="text-right">Approval a year</th></tr></thead>
        <tbody className="divide-y divide-ink/10">
          {f.zones.map((z) => (
            <tr key={z.zone}>
              <td className="py-1.5 font-serif">{ZONE_NAME[z.zone]}{z.zone === s.president.homeZone ? ' (home)' : ''}</td>
              <td className={`text-right tabular-nums ${z.count === 0 ? 'text-alarm' : ''}`}>{z.count}</td>
              <td className="text-right tabular-nums text-ink-soft">{z.fair.toFixed(1)}</td>
              <td className="pl-3 text-[13px] text-ink-soft">{z.names.join(', ') || '—'}<span className="block">{z.why}</span></td>
              <td className={`text-right tabular-nums ${z.effect < 0 ? 'text-alarm' : z.effect > 0 ? 'text-state' : ''}`}>{z.effect > 0 ? '+' : ''}{(z.effect * 12).toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {ps.some((p) => !p.zone) && <p className="mt-2 text-[13px] text-ink-soft">Not counted, origin not on record: {ps.filter((p) => !p.zone).map((p) => p.name).join(', ')}.</p>}
      <p className="mt-2 text-[13px] text-ink-soft">The succession follows the same rule: after a President from one half of the country, the party expects a candidate from the other.</p>
    </div>
  );
}

function Succession({ s, dispatch, left }: { s: GameState; dispatch: Dispatch; left: number }) {
  const backed = s.flags['succession.backed'];
  const list = candidateIds(s).map((id) => candidate(s, id)).sort((a, b) => b.groomed - a.groomed || b.strength - a.strength);
  const top = new Set(shortlist(s).map((c) => c.id));
  const shut = groomWindow(s);
  const reforms = creditable(s);
  const [pickR, setPickR] = useState<Record<string, string>>({});
  const [all, setAll] = useState(false);
  // The list, the groomed and the Vice President always show; the rest fold away.
  const shown = all ? list : list.filter((c, i) => top.has(c.id) || c.groomed > 0 || c.id === 'vp' || i < 5);
  const hidden = list.length - shown.length;
  return (
    <div className="mt-4">
      <p className="text-sm text-ink-soft">
        {backed ? `You have backed ${String(s.flags['successor.name'] ?? 'a successor')}.` : 'The party chooses its candidate in month 37 of the second term. The three names it is talking about are marked; grooming someone puts them on the list.'}
        {' '}You can start a year into the first term: an heir built up over two terms carries more weight, but before your own re-election the ambitious notice more and wonder whether you mean to run. Crediting them with a reform you delivered gives them a record to campaign on.
        {shut ? <span className="text-alarm"> {shut}</span> : null}
        {' '}Strength is points of share at the election, before the usual cost of not being you (−3). Loyalty above 75 protects you whatever you did; an honest successor (integrity 4 or 5) will not protect much theft on loyalty alone.
      </p>
      <ul className="mt-3 space-y-2">
        {shown.map((c) => {
          const can = canGroom(s, c.id, left);
          return (
            <li key={c.id} className={`border p-3 ${top.has(c.id) ? 'border-state/50' : 'border-ink/15'}`}>
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-serif text-lg">{c.name}{top.has(c.id) && <span className="label ml-2 text-state">on the list</span>}</span>
                <span className="label text-ink-soft">
                  strength <span className={c.strength >= 0 ? 'text-state' : 'text-alarm'}>{c.strength >= 0 ? '+' : ''}{c.strength}</span>
                  {' · '}loyalty <span className={c.loyalty >= 60 ? 'text-state' : c.loyalty < 40 ? 'text-alarm' : ''}>{c.loyalty}</span>
                  {' · '}integrity {c.integrity}
                </span>
              </p>
              <p className="label text-ink-soft">{c.title}</p>
              {c.why.length > 0 && <p className="mt-1 text-[13px] leading-snug text-ink-soft">{c.why.join('. ')}.</p>}
              {!backed && (
                <button disabled={!can.ok} onClick={() => dispatch({ type: 'GROOM', id: c.id })}
                  className={`mt-2 border px-3 py-1 text-sm ${can.ok ? 'border-ink/25 hover:border-state' : 'border-ink/10 opacity-50'}`}>
                  Give them a platform · {GROOM_PC} capital · strength +0.4, loyalty +5{c.groomed ? ` (${c.groomed}/${GROOM_MAX})` : ''}
                </button>
              )}
              {!backed && !can.ok && can.reason && <span className="ml-2 text-[13px] text-ink-soft">{can.reason}</span>}
              {!backed && !shut && reforms.length > 0 && (() => {
                const r = pickR[c.id] ?? reforms[0].id;
                const cr = canCredit(s, c.id, r, left);
                return (
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                    <select value={r} onChange={(e) => setPickR({ ...pickR, [c.id]: e.target.value })} className="max-w-xs border border-ink/25 bg-paper px-2 py-1">
                      {reforms.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                    </select>
                    <button disabled={!cr.ok} title={cr.reason} onClick={() => dispatch({ type: 'GROOM_CREDIT', id: c.id, reform: r })}
                      className={`border px-3 py-1 ${cr.ok ? 'border-ink/25 hover:border-state' : 'border-ink/10 opacity-50'}`}>
                      Give them the credit · {CREDIT_PC} capital · strength +0.3, loyalty +4
                    </button>

                  </div>
                );
              })()}
            </li>
          );
        })}
      </ul>
      {(hidden > 0 || all) && (
        <button onClick={() => setAll(!all)} className="mt-2 text-sm text-ink-soft underline decoration-ink/30 hover:text-ink">
          {all ? 'Show only the likeliest' : `${hidden} more who could be built up, weaker today`}
        </button>
      )}
    </div>
  );
}
