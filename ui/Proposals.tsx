'use client';

// THE OPPOSITION'S PROPOSALS (plan 15)
// What each rival proposes, for whom, whether the problem it names is real, and
// the four ways to answer: adopt, negotiate, defeat, or show a better answer.

import { RIVAL_BY_ID } from '../content/people';
import { PROPOSAL_BY_ID } from '../content/proposals';
import { dateLabel } from '../engine/config';
import { describe } from '../engine/effects';
import { ALTERNATIVE_MONTHS, CAMPAIGN_MONTHS, canAnswer, proposals, type Answer } from '../engine/proposals';
import { movesLeft } from '../engine/reduce';
import type { Action, Fx, GameState } from '../engine/types';
import { test } from '../engine/vars';

const btn = (ok: boolean) => `border px-2.5 py-1 text-sm text-left ${ok ? 'border-ink/30 hover:border-state' : 'border-ink/10 opacity-45'}`;
const fx = (list: Fx[]) => describe(list).map((c) => `${c.label} ${c.arrows}`).join(', ');

export function Proposals({ s, dispatch }: { s: GameState; dispatch: (a: Action) => void }) {
  const list = s.proposals ?? [];
  const left = movesLeft(s);
  return (
    <section className="mt-4">
      <h3 className="label border-b rule pb-1 text-ink-soft">What the opposition proposes</h3>
      {list.length === 0 && <p className="mt-1 text-[13px] text-ink-soft">No proposals yet. The rivals propose when something is going wrong for a group they can speak for.</p>}
      <ul className="mt-2 space-y-2">
        {[...list].reverse().map((p) => {
          const def = PROPOSAL_BY_ID[p.id];
          if (!def) return null;
          const right = test(s, def.right);
          const how = (a: Answer) => canAnswer(s, p.id, a, left);
          return (
            <li key={p.id + p.opened} className="border border-ink/20 p-3 text-[13px] leading-snug">
              <p className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-serif text-lg">{def.title}</span><span className="label text-ink-soft">{RIVAL_BY_ID[def.rival]?.name} · for {def.for.toLowerCase()} · {dateLabel(p.opened, s.startYear)}</span></p>
              <p>{def.text}</p>
              <p className={right ? 'text-alarm' : 'text-ink-soft'}>{right ? 'The problem it names is real and serious now.' : 'The problem is real, but smaller than they say.'}</p>
              {!p.answer ? (
                <>
                  <p className="text-ink-soft">Unanswered, it is campaigned on every month; after {CAMPAIGN_MONTHS} months it becomes their election promise.</p>
                  <div className="mt-1 grid gap-1 md:grid-cols-2">
                    <button disabled={!how('adopt').ok} title={how('adopt').reason} onClick={() => dispatch({ type: 'PROPOSAL', id: p.id, how: 'adopt' })} className={btn(how('adopt').ok)}>Adopt it · {fx(def.adopt)}; they get the credit{def.reverses ? '; the reform it targets is undone' : ''}</button>
                    <button disabled={!how('negotiate').ok} title={how('negotiate').reason} onClick={() => dispatch({ type: 'PROPOSAL', id: p.id, how: 'negotiate' })} className={btn(how('negotiate').ok)}>Negotiate a smaller version · 3 capital · {fx(def.negotiate)}</button>
                    <button disabled={!how('defeat').ok} title={how('defeat').reason} onClick={() => dispatch({ type: 'PROPOSAL', id: p.id, how: 'defeat' })} className={btn(how('defeat').ok)}>Defeat it · 3 capital · {right ? 'costly: they are right' : 'the case against it holds'}</button>
                    <button disabled={!how('alternative').ok} title={how('alternative').reason} onClick={() => dispatch({ type: 'PROPOSAL', id: p.id, how: 'alternative' })} className={btn(how('alternative').ok)}>Show a better answer within {ALTERNATIVE_MONTHS} months: {def.alternative.text.charAt(0).toLowerCase()}{def.alternative.text.slice(1)}{test(s, def.alternative.met) ? ' (already in place)' : ''}</button>
                  </div>
                </>
              ) : (
                <p className="mt-1">{p.outcome ?? (p.answer === 'alternative' ? `You promised a better answer; judged ${dateLabel(p.due ?? s.turn, s.startYear)}.` : '')}</p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
