'use client';

import { NIGHT_BY_ID } from '../content/setpieces';
import { clockLabel, nightOptions } from '../engine/night';
import { fill } from '../engine/text';
import type { Action, Change, GameState } from '../engine/types';

type Dispatch = (a: Action) => void;

function Changes({ changes }: { changes: Change[] }) {
  if (!changes.length) return null;
  return (
    <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
      {changes.map((c) => <span key={c.label}>{c.label} <span className={c.good ? 'text-[#9fd3b6]' : 'text-[#e8a597]'}>{c.text}</span></span>)}
    </p>
  );
}

/** A night played by the clock. */
export function NightScreen({ s, dispatch }: { s: GameState; dispatch: Dispatch }) {
  const n = s.night!;
  const sp = NIGHT_BY_ID[n.id];
  const opts = nightOptions(s);
  const say = (t: string) => fill(s, Object.entries(n.cast).reduce((x, [k, v]) => x.split(`{${k}}`).join(v), t));
  const left = sp.dawn - n.clock;
  return (
    <div className="fade-in fixed inset-0 z-50 overflow-y-auto bg-[#07090b] px-3 py-6 sm:py-10" role="dialog" aria-label={sp.title}>
      <div className="mx-auto max-w-3xl">
        <div className="flex items-baseline justify-between gap-4 border-b border-ivory/15 pb-3">
          <div>
            <p className="label text-honour">{sp.title}</p>
            <p className="mt-1 text-sm text-mute">Every decision takes time. Others will not wait for you. What you decide tonight cannot be taken back, and you will not know until morning whether it was right.</p>
          </div>
          <div className="text-right">
            <p className="font-serif text-5xl tabular-nums text-ivory">{clockLabel(n.clock)}</p>
            {!n.done && <p className="label text-mute">dawn in {Math.floor(left / 60)}h {String(left % 60).padStart(2, '0')}m</p>}
          </div>
        </div>

        <ol className="mt-4 space-y-3">
          {n.log.map((l, i) => (
            <li key={i} className={`border-l-2 pl-4 ${l.kind === 'you' ? 'border-honour' : 'border-ivory/25'}`}>
              <p className="label text-mute">{clockLabel(l.at)}{l.kind === 'you' ? ' · you' : ''}</p>
              <p className={`font-serif text-lg leading-snug ${l.kind === 'you' ? 'text-honour/90' : 'text-ivory/90'}`}>{l.text}</p>
            </li>
          ))}
        </ol>

        {!n.done ? (
          <div className="mt-6">
            <p className="label text-mute">What you can still do</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {opts.map((o) => (
                <li key={o.id}>
                  <button onClick={() => dispatch({ type: 'NIGHT', option: o.id })} className="h-full w-full border border-ivory/20 px-4 py-3 text-left hover:border-honour hover:bg-ivory/5">
                    <span className="block font-serif text-[17px] leading-snug text-ivory">{say(o.label)}</span>
                    <span className="label mt-1 block text-mute">{o.ends ? 'ends the night' : `takes ${o.minutes} minutes`}{o.until !== undefined ? ` · only until ${clockLabel(o.until)}` : ''}</span>
                  </button>
                </li>
              ))}
              <li>
                <button onClick={() => dispatch({ type: 'NIGHT_WAIT' })} className="h-full w-full border border-dashed border-ivory/20 px-4 py-3 text-left hover:border-ivory/50">
                  <span className="block font-serif text-[17px] text-ivory/80">Wait, and watch</span>
                  <span className="label mt-1 block text-mute">30 minutes</span>
                </button>
              </li>
            </ul>
          </div>
        ) : (
          <div className="mt-6 border border-honour/40 bg-ivory/5 p-5">
            <p className="label text-honour">Morning</p>
            <p className="mt-1 font-serif text-2xl text-ivory">{n.done.title}</p>
            <p className="mt-2 font-serif text-lg leading-relaxed text-ivory/85">{n.done.text}</p>
            <Changes changes={n.done.changes} />
            <div className="mt-5 text-right">
              <button onClick={() => dispatch({ type: 'NIGHT_END' })} autoFocus className="bg-paper px-5 py-2.5 font-serif text-ink hover:bg-white">{n.id === 'collation' ? 'To the declaration' : 'Back to the desk'}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
