'use client';

import { useState } from 'react';
import { ORDERS, type Order } from '../content/agenda';
import { forecastChallenge } from '../engine/courts';
import { describe } from '../engine/effects';
import { canOrder, orderOutcome } from '../engine/reduce';
import { grievances, recentUses, wearFactor } from '../engine/targets';
import { naira } from '../engine/text';
import type { Action, Fx, GameState } from '../engine/types';
import { test } from '../engine/vars';
import { usePreview } from './shell';

type Kind = 'governor' | 'senator' | 'tycoon' | 'rival';

const fits = (o: Order, kind: Kind) =>
  kind === 'governor' ? o.target === 'governor' || o.target === 'politician'
    : kind === 'senator' ? o.target === 'politician'
      : o.target === kind;

/** Every order that can be aimed at this person and is open now: what it would do to them, and to you. */
export function Aimed({ s, kind, id, dispatch }: { s: GameState; kind: Kind; id: string; dispatch: (a: Action) => void }) {
  const [open, setOpen] = useState(false);
  const all = ORDERS.filter((o) => fits(o, kind));
  const now = all.filter((o) => (o.situational ? s.offers.some((x) => x.id === o.id) : test(s, o.when)));
  const later = all.length - now.length;
  if (!all.length) return null;
  return (
    <div className="mt-3 border-t rule pt-2">
      <button onClick={() => setOpen(!open)} className="label flex w-full items-baseline justify-between text-state hover:underline">
        <span>Orders you can aim at them · {now.length} open now</span>
        <span>{open ? 'Close' : 'Open'}</span>
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5">
          {now.map((o) => <Row key={o.id} s={s} o={o} id={id} dispatch={dispatch} />)}
          {!now.length && <li className="text-sm italic text-ink-soft">Nothing aimed at them is open this month.</li>}
          {later > 0 && <li className="text-[13px] text-ink-soft">{later} more {later === 1 ? 'order opens' : 'orders open'} when the moment comes.</li>}
        </ul>
      )}
    </div>
  );
}

function Row({ s, o, id, dispatch }: { s: GameState; o: Order; id: string; dispatch: (a: Action) => void }) {
  const can = canOrder(s, o);
  const out = orderOutcome(o, s, id);
  const now: Fx[] = [...(out.fx ?? [])];
  if (o.naira) now.push(['nation.fiscalSpace', -o.naira]);
  const action: Action = { type: 'ORDER', id: o.id, target: id };
  const hover = usePreview(action, can.ok);
  const uses = o.hostile ? recentUses(s, o.id) : 0;
  const court = (o.hostile ?? 0) >= 3 ? forecastChallenge(s) : null;
  return (
    <li>
      <button disabled={!can.ok} onClick={() => dispatch(action)} {...hover}
        className={`w-full border px-3 py-2 text-left ${can.ok ? 'border-ink/20 hover:border-state hover:bg-state/5' : 'border-ink/10 opacity-50'}`}>
        <span className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-serif">{o.name}{o.hostile ? <span className="label ml-2 text-alarm">hostile</span> : <span className="label ml-2 text-state">reward</span>}</span>
          <span className="label text-ink-soft">{[o.pc ? `${o.pc} capital` : null, o.naira ? naira(o.naira) : null].filter(Boolean).join(' · ') || 'free'}</span>
        </span>
        <span className="mt-0.5 block text-[13px] text-ink-soft">{describe(now).map((c) => `${c.label} ${c.text}`).join(' · ')}</span>
        {(out.later ?? []).length > 0 && <span className="block text-[13px] text-ink-soft">Later: {(out.later ?? []).flatMap((l) => describe(l.fx)).map((c) => `${c.label} ${c.text}`).join(' · ')}</span>}
        {o.hostile && <span className="block text-[13px] text-alarm">Remembered for two years{grievances(s, id).length ? `, on top of ${grievances(s, id).length} grudge${grievances(s, id).length === 1 ? '' : 's'} already` : ''}.{uses ? ` Worn: works at ${Math.round(wearFactor(s, o.id) * 100)}%.` : ''}{court ? ` In court: ${court.against} against you, ${court.for} for${court.unsure ? `, ${court.unsure} for sale` : ''}.` : ''}</span>}
        {!can.ok && can.reason && <span className="block text-[13px] text-alarm">{can.reason}</span>}
      </button>
    </li>
  );
}
