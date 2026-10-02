'use client';

import { useState } from 'react';
import { PEOPLE, RIVALS, type Group } from '../content/people';
import { describe } from '../engine/effects';
import { canDeal, governorEffect, ministerSpeed, personView, relWord, senate, strongestRival } from '../engine/people';
import { movesLeft } from '../engine/reduce';
import { naira } from '../engine/text';
import type { Action, GameState } from '../engine/types';
import { ZONE_NAME } from '../engine/vars';

type Dispatch = (a: Action) => void;
type Tab = Group | 'opposition';

const TABS: [Tab, string][] = [['governor', 'Your governors'], ['senator', 'Your senators'], ['minister', 'Your ministers'], ['opposition', 'The opposition']];

const INTRO: Record<Tab, string> = {
  governor: 'Each leads your party\'s governors in a zone. On election day a governor who is with you delivers votes there. One who is not sits on his hands.',
  senator: 'Reforms that need a law are voted on in the Senate. Your own senators decide whether they pass. Bills pass when the Senate stands at 50 or better; constitutional changes need more.',
  minister: 'A minister\'s competence sets how fast the reforms in their brief move. You can replace any of them: with a technocrat the party resents, or a nominee the party loves.',
  opposition: 'Three rivals, each feeding on a different failure. Whoever is strongest on election day is who you face.',
};

export function senateLine(s: GameState): string {
  const v = senate(s);
  return v >= 56 ? 'Firmly yours' : v >= 50 ? 'With you, narrowly' : v >= 44 ? 'Slipping away' : 'Against you';
}

export function PeopleModal({ s, dispatch, onClose }: { s: GameState; dispatch: Dispatch; onClose: () => void }) {
  const [tab, setTab] = useState<Tab>('governor');
  const left = movesLeft(s);
  const top = strongestRival(s);

  return (
    <div className="fade-in fixed inset-0 z-30 overflow-y-auto bg-pit/80 px-3 py-6 sm:py-10" onClick={onClose} role="dialog">
      <div className="slide-in paper mx-auto max-w-3xl p-5 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-baseline justify-between gap-4">
          <div>
            <p className="label text-state">Politics</p>
            <h2 className="mt-1 font-serif text-3xl">Who is with you</h2>
          </div>
          <p className="label text-right text-ink-soft">{left} {left === 1 ? 'move' : 'moves'} left<br />Senate: {senateLine(s)} ({Math.round(senate(s))})</p>
        </div>

        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 border-b rule">
          {TABS.map(([id, name]) => (
            <button key={id} onClick={() => setTab(id)} className={`label pb-2 ${tab === id ? 'border-b-2 border-state text-ink' : 'text-ink-soft'}`}>{name}</button>
          ))}
        </div>
        <p className="mt-3 text-sm leading-snug text-ink-soft">{INTRO[tab]}</p>

        {tab === 'opposition' ? (
          <ul className="mt-4 space-y-3">
            {RIVALS.map((r) => {
              const v = s.opposition[r.id] ?? 0;
              return (
                <li key={r.id} className="border border-ink/20 p-4">
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-serif text-xl">{r.name}</span>
                    {top.id === r.id && <span className="label border border-alarm/50 px-1.5 py-0.5 text-alarm">Your likely challenger</span>}
                  </p>
                  <p className="label text-ink-soft">{r.party}</p>
                  <div className="mt-2 h-1.5 bg-ink/10"><div className="h-1.5 bg-alarm transition-all duration-700" style={{ width: `${v}%` }} /></div>
                  <p className="mt-2 text-sm leading-snug">{r.style}</p>
                  <p className="mt-1 text-sm italic leading-snug text-ink-soft">{r.feeds}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <ul className="mt-4 space-y-3">
            {PEOPLE.filter((p) => p.group === tab).map((base) => {
              const p = personView(s, base.id);
              const court = canDeal(s, p.id, 'court', left);
              const grant = canDeal(s, p.id, 'grant', left);
              const press = canDeal(s, p.id, 'pressure', left);
              const leaned = !!p.compliantUntil && p.compliantUntil > s.turn;
              const eff = p.zone ? governorEffect(s, p.zone) : 0;
              return (
                <li key={p.id} className="border border-ink/20 p-4">
                  <p className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-serif text-xl">{p.name}</span>
                    <span className={`font-serif ${p.standing < 42 ? 'text-alarm' : p.standing >= 58 ? 'text-state' : ''}`}>{relWord(p.standing)}{leaned && ' (leaned on)'}</span>
                  </p>
                  <p className="label text-ink-soft">{p.title} · influence {'●'.repeat(p.clout ?? 1)}{'○'.repeat(5 - (p.clout ?? 1))}</p>
                  <div className="mt-2 h-1.5 bg-ink/10"><div className={`h-1.5 transition-all duration-700 ${p.standing < 42 ? 'bg-alarm' : 'bg-state'}`} style={{ width: `${p.standing}%` }} /></div>
                  <p className="mt-2 text-sm leading-snug">{p.bio}</p>

                  {p.zone && (
                    <p className={`mt-1 text-sm ${eff >= 0 ? 'text-state' : 'text-alarm'}`}>
                      On election day in the {ZONE_NAME[p.zone]}: {eff >= 0 ? '+' : ''}{eff.toFixed(1)} points
                    </p>
                  )}
                  {p.group === 'minister' && (
                    <p className="mt-1 text-sm text-ink-soft">
                      Competence {'●'.repeat(p.competence ?? 3)}{'○'.repeat(5 - (p.competence ?? 3))} · reforms in this brief run at {Math.round(ministerSpeed(s, base.tracks?.[0] ?? '') * 100)}% speed
                    </p>
                  )}

                  {base.want && !p.name?.includes('undefined') && p.group !== 'minister' && (
                    <div className="mt-3 border-l-2 border-honour bg-paper-dim px-3 py-2">
                      <p className="label text-ink-soft">{p.granted ? 'You gave them' : 'Wants'}</p>
                      <p className="font-serif leading-snug">{base.want.text}</p>
                      {!p.granted && (
                        <p className="mt-1 flex flex-wrap gap-x-3 text-[13px]">
                          {describe(base.want.fx).map((c, i) => (
                            <span key={i} className={c.good ? 'text-state' : 'text-alarm'}><span className="text-ink-soft">{c.label}</span> {c.arrows}</span>
                          ))}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button disabled={!court.ok} onClick={() => dispatch({ type: 'PERSON', id: p.id, op: 'court' })}
                      className={`border px-3 py-1.5 font-serif ${court.ok ? 'border-ink/30 hover:border-state hover:bg-state/5' : 'border-ink/10 opacity-45'}`}>
                      Give them your time
                    </button>
                    {base.want && p.group !== 'minister' && !p.granted && (
                      <button disabled={!grant.ok} onClick={() => dispatch({ type: 'PERSON', id: p.id, op: 'grant' })}
                        className={`border px-3 py-1.5 font-serif ${grant.ok ? 'border-state bg-state/10 hover:bg-state/20' : 'border-ink/10 opacity-45'}`}>
                        Give them what they want{[base.want.pc && ` · ${base.want.pc} capital`, base.want.naira && ` · ${naira(base.want.naira)}`].filter(Boolean).join('')}
                      </button>
                    )}
                    {p.group !== 'minister' && (
                      <button disabled={!press.ok} onClick={() => dispatch({ type: 'PERSON', id: p.id, op: 'pressure' })}
                        className={`border px-3 py-1.5 font-serif ${press.ok ? 'border-alarm/50 text-alarm hover:bg-alarm/5' : 'border-ink/10 opacity-45'}`}>
                        Lean on them · 4 capital
                      </button>
                    )}
                    {p.group === 'minister' && (['technocrat', 'party'] as const).map((kind) => {
                      const ok = left > 0 && s.pc >= 6;
                      return (
                        <button key={kind} disabled={!ok} onClick={() => dispatch({ type: 'REPLACE_MINISTER', id: p.id, kind })}
                          className={`border px-3 py-1.5 font-serif ${ok ? 'border-ink/30 hover:border-state hover:bg-state/5' : 'border-ink/10 opacity-45'}`}>
                          {kind === 'technocrat' ? 'Replace with a technocrat' : 'Replace with a party nominee'} · 6 capital
                        </button>
                      );
                    })}
                  </div>
                  {p.group !== 'minister' && (
                    <p className="mt-2 text-[13px] leading-snug text-ink-soft">
                      Time warms them a little, less each visit. Giving them what they want wins them properly, at the price shown, and earns you 5 political capital. Leaning on them buys eight months of obedience and a lasting grudge.
                    </p>
                  )}
                  {p.group === 'minister' && (
                    <p className="mt-2 text-[13px] leading-snug text-ink-soft">
                      A technocrat is highly competent and the party will resent it. A party nominee pleases the governors and slows every reform in the brief.
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-6 text-right"><button onClick={onClose} className="bg-ink px-5 py-2.5 font-serif text-paper hover:bg-state">Close</button></div>
      </div>
    </div>
  );
}
