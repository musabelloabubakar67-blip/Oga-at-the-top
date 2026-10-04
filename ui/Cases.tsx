'use client';

import { canBack, canDrop, cases, convictionOdds, prosecutor, trialLength } from '../engine/cases';
import type { Action, GameState } from '../engine/types';

type Dispatch = (a: Action) => void;

const OUTCOME: Record<string, string> = { convicted: 'Convicted', acquitted: 'Acquitted', dropped: 'Dropped', fled: 'Fled abroad' };

/** Every prosecution: where it stands, what decides it, and what the President can do. */
export function Cases({ s, dispatch, compact }: { s: GameState; dispatch: Dispatch; compact?: boolean }) {
  const all = cases(s);
  if (!all.length) return compact ? null : <p className="mt-2 text-sm text-ink-soft">Nobody has been charged. When a file ends in charges, the case appears here and runs to a verdict.</p>;
  const open = all.filter((c) => !c.outcome);
  const closed = all.filter((c) => c.outcome);
  return (
    <div className="mt-2">
      {open.length > 0 && (
        <ul className="space-y-2">
          {open.map((c) => {
            const o = convictionOdds(s, c);
            const len = trialLength(s);
            const done = c.stage === 'charged' ? c.months / 3 * 0.2 : 0.2 + 0.8 * Math.min(1, (s.turn - (c.trialFrom ?? s.turn)) / len);
            const left = c.stage === 'charged' ? 3 - c.months + len : Math.max(1, len - (s.turn - (c.trialFrom ?? s.turn)));
            const back = canBack(s, c.id);
            const drop = canDrop(s, c.id);
            return (
              <li key={c.id} className="border border-ink/20 bg-paper-dim/50 px-3 py-2">
                <p className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-serif text-lg">{c.name}</span>
                  <span className={`label ${o.p >= 0.5 ? 'text-state' : 'text-alarm'}`}>{Math.round(o.p * 100)}% to convict</span>
                </p>
                <p className="text-[13px] text-ink-soft">{c.what}. {c.stage === 'charged' ? 'Charged; the trial opens soon' : 'On trial'} · verdict in about {left} months · prosecuted by {prosecutor(s)}{c.backed ? ' · you have backed it in public' : ''}.</p>
                <div className="mt-1 h-1.5 bg-ink/10"><div className="h-1.5 bg-state" style={{ width: `${Math.round(done * 100)}%` }} /></div>
                {!compact && (
                  <ul className="mt-1.5 grid gap-x-4 text-[12.5px] sm:grid-cols-2">
                    {o.lines.map((l) => (
                      <li key={l.label} className="flex justify-between gap-2"><span className="text-ink-soft">{l.label}</span><span className={l.value >= 0 ? 'text-state' : 'text-alarm'}>{l.value >= 0 ? '+' : '−'}{Math.round(Math.abs(l.value) * 100)}</span></li>
                    ))}
                  </ul>
                )}
                <div className="mt-2 flex flex-wrap gap-2 text-sm">
                  <button disabled={!back.ok} title={back.reason} onClick={() => dispatch({ type: 'CASE', id: c.id, op: 'back' })}
                    className={`border px-2.5 py-1 ${back.ok ? 'border-state/60 hover:bg-state/10' : 'border-ink/10 opacity-45'}`}>Back it in public · 3 capital · +8 points</button>
                  <button disabled={!drop.ok} title={drop.reason} onClick={() => dispatch({ type: 'CASE', id: c.id, op: 'drop' })}
                    className={`border px-2.5 py-1 ${drop.ok ? 'border-ink/30 hover:border-alarm' : 'border-ink/10 opacity-45'}`}>Lean on the prosecutors to drop it · integrity, and an honest chief may refuse in public</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {closed.length > 0 && (
        <ul className="mt-2 space-y-0.5 text-[13px]">
          {closed.slice(-8).reverse().map((c) => (
            <li key={c.id} className="flex justify-between gap-3">
              <span><span className="font-serif">{c.name}</span> <span className="text-ink-soft">· {c.what}</span></span>
              <span className={c.outcome === 'convicted' ? 'text-state' : 'text-alarm'}>{OUTCOME[c.outcome!]}{c.outcome === 'convicted' && c.recover ? `, ₦${Math.round(c.recover * 1000)}bn recovered` : ''}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
