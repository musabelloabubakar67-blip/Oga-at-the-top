'use client';

// THE CITIZENS (plan 14)
// Eleven people, each living on a different part of the national picture. What
// each says is read from this month's state, so the same figures can be good
// for one and bad for another. What they would do about it (organise, petition,
// move, change work, back an alternative) happens in the game (engine/society.ts):
// each act is recorded with its month and has effects on their group and zone.

import { useState } from 'react';
import { CITIZENS, type Citizen } from '../content/citizens';
import { STATE_BY_ID } from '../content/states';
import { SECTOR_BY_ID } from '../content/treasury';
import type { GameState } from '../engine/types';
import { dateLabel } from '../engine/config';
import { getVar, test } from '../engine/vars';

const ACT: Record<Citizen['responses'][number]['act'], string> = {
  organise: 'Organising', petition: 'Petitioning', relocate: 'Moving', switch: 'Changing work', support: 'Backing an alternative',
};

/** A value as the person would feel it, without pretending to more precision than the game has. */
function shown(path: string, n: number): string {
  if (path === 'nation.petrolPrice') return `₦${Math.round(n)}/litre`;
  if (path === 'nation.inflation') return `${Math.round(n)}% inflation`;
  if (path === 'fx.premium') return `street rate ${n}% above official`;
  if (path === 'fx.reserves') return `reserves ${Math.round(n)}`;
  if (path === 'debt.pensions') return `₦${n.toFixed(1)}tn owed`;
  const [head, key] = path.split('.');
  if (head === 'pressure') return n >= 60 ? 'acute' : n >= 40 ? 'rising' : 'calm';
  if (head === 'theatre') return n >= 65 ? 'severe' : n >= 50 ? 'serious' : 'contained';
  if (head === 'nation') return `${{ power: 'power', jobs: 'industry and jobs', integrity: 'integrity', capacity: 'state capacity', security: 'security' }[key] ?? key} ${Math.round(n)} out of 100`;
  if (head === 'budget') {
    const sector = SECTOR_BY_ID[key as keyof typeof SECTOR_BY_ID];
    if (!sector) return '';
    return `${sector.name.toLowerCase()} ${n > sector.usual ? 'above' : n < sector.usual ? 'below' : 'at'} the usual share this year`;
  }
  return `${Math.round(n)} out of 100`;
}

function Person({ s, c }: { s: GameState; c: Citizen }) {
  const [open, setOpen] = useState(false);
  const line = c.lines.find((l) => test(s, l.when));
  const done = (s.society?.acts ?? []).filter((a) => a.who === c.id).slice(-3);
  return (
    <li className="border border-ink/20 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="font-serif text-lg">{c.name}</span>
        <span className="label shrink-0 text-ink-soft">{STATE_BY_ID[c.state]?.name ?? c.state}</span>
      </div>
      <p className="label text-ink-soft">{c.work}</p>
      <p className={`mt-1 font-serif leading-snug ${line ? '' : 'italic text-ink-soft'}`}>“{line?.text ?? c.otherwise}”</p>
      {done.length > 0 && (
        <ul className="mt-2 space-y-0.5 border-l-2 border-honour pl-2 text-[13px] leading-snug">
          {done.map((a) => <li key={a.turn + a.act}><span className="label mr-1 text-honour">{ACT[a.act]} · {dateLabel(a.turn, s.startYear)}</span>{a.text}</li>)}
        </ul>
      )}
      {open && (
        <div className="mt-2 space-y-1 text-[13px] leading-snug">
          <p>{c.household}</p>
          <p className="label text-ink-soft">Turns on</p>
          <ul className="space-y-0.5">
            {c.dependsOn.map((d) => <li key={d.path}>{d.why} <span className="text-ink-soft">Now: {shown(d.path, getVar(s, d.path))}.</span></li>)}
          </ul>
          <p><span className="label mr-1 text-state">Helped by</span>{c.gains}</p>
          <p><span className="label mr-1 text-alarm">Hurt by</span>{c.loses}</p>
        </div>
      )}
      <button onClick={() => setOpen(!open)} className="mt-2 border border-ink/20 px-3 py-1 text-sm hover:border-state">{open ? 'Less' : 'Household and what moves it'}</button>
    </li>
  );
}

export function Citizens({ s }: { s: GameState }) {
  return (
    <div className="paper p-6 xl:p-8">
      <p className="label text-state">The people · this month</p>
      <h2 className="mt-1 font-serif text-3xl">Eleven people who will never meet you</h2>
      <p className="mt-1 max-w-prose text-[14px] text-ink-soft">Each lives on a different part of the national figures. A good month for one can be a bad month for another.</p>
      <ul className="mt-4 grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
        {CITIZENS.map((c) => <Person key={c.id} s={s} c={c} />)}
      </ul>
    </div>
  );
}
