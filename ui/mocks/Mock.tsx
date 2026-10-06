'use client';

// The frame every design mock sits in. A mock shows how a screen will work once
// its engine contract exists; it changes nothing in any game and is never
// linked from the game itself. The banner names the contract it waits on.

import type { ReactNode } from 'react';
import { describe } from '../../engine/effects';
import type { Fx } from '../../engine/types';

export function MockFrame({ id, contract, title, purpose, children }: { id: string; contract: string; title: string; purpose: string; children: ReactNode }) {
  return (
    <section id={id} className="paper scroll-mt-6 p-5 xl:p-8">
      <p className="label border border-alarm/50 px-2 py-1 text-alarm">Design mock · waits on {contract} · nothing here changes a game</p>
      <h2 className="mt-3 font-serif text-3xl">{title}</h2>
      <p className="mt-1 max-w-prose text-[14px] text-ink-soft">{purpose}</p>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Effects as the game already words them, so mocks preview in the real language. */
export function Effects({ fx, empty = 'No immediate effect.' }: { fx: Fx[]; empty?: string }) {
  const lines = describe(fx);
  if (!lines.length) return <p className="text-[13px] text-ink-soft">{empty}</p>;
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-[13px]">
      {lines.map((c) => <li key={c.label} className={c.good ? 'text-state' : 'text-alarm'}>{c.arrows} {c.label}</li>)}
    </ul>
  );
}

export function Choice({ on, active, disabled, why, children }: { on: () => void; active?: boolean; disabled?: boolean; why?: string; children: ReactNode }) {
  return (
    <button onClick={on} disabled={disabled} title={why}
      className={`border px-3 py-1.5 text-left text-sm disabled:opacity-45 ${active ? 'border-state bg-state/10' : 'border-ink/20 hover:border-state'}`}>
      {children}
    </button>
  );
}
