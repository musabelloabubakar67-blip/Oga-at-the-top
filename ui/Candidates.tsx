'use client';

import { CHECK_PC, HUNT_PC, patronLabel, specName, type Offer } from '../engine/talent';
import type { Action, GameState } from '../engine/types';

const word = (v: number, hi: string, mid: string, lo: string) => (v >= 4 ? hi : v <= 2 ? lo : mid);

/**
 * People who could take a job, from the talent pool: their field, what their file
 * says (or the truth, once checked), whether they would refuse, and the buttons to
 * appoint, check or search for more.
 */
export function Candidates({ s, role, offers, dispatch, appoint, can, label, left }: {
  s: GameState; role: string; offers: Offer[]; dispatch: (a: Action) => void;
  appoint: (name: string) => void; can: (name: string) => { ok: boolean; reason?: string }; label: string; left: number;
}) {
  return (
    <div className="mt-2">
      <ul className="space-y-2">
        {offers.map((o) => {
          const ok = can(o.c.name);
          const t = o.shown;
          return (
            <li key={o.c.id} className={`border-l-2 pl-3 ${o.refuses ? 'border-alarm/50' : 'border-honour'}`}>
              <p className="flex flex-wrap items-baseline justify-between gap-2">
                <span className="font-serif">{o.c.name}</span>
                <span className={`label ${o.fit ? 'text-state' : 'text-ink-soft'}`}>{specName(o.c)}{o.fit ? ' · right field' : ' · outside their field (−1)'}</span>
              </p>
              <p className="text-[13px] leading-snug text-ink-soft">{o.c.blurb}</p>
              <p className="text-[13px] leading-snug">
                <span className="label mr-1 text-ink-soft">{o.c.checked ? 'Checked' : 'File says'}</span>
                {word(t.competence, 'very able', 'competent', 'out of their depth')} ({t.competence}), {word(t.loyalty, 'loyal', 'reliable enough', 'their own person')} ({t.loyalty}), {word(t.integrity, 'clean', 'ordinary', 'questions about money')} ({t.integrity})
                {o.c.checked ? `; answers to ${patronLabel(o.c)}` : ''}.
              </p>
              {o.refuses && <p className="text-[13px] text-alarm">Will not take it: {o.refuses}</p>}
              <div className="mt-1 flex flex-wrap gap-2">
                <button disabled={!ok.ok} title={ok.reason} onClick={() => appoint(o.c.name)}
                  className={`border px-3 py-1 text-sm ${ok.ok ? 'border-ink/30 hover:border-state' : 'border-ink/10 opacity-45'}`}>{label}</button>
                {!o.c.checked && (
                  <button disabled={s.pc < CHECK_PC} onClick={() => dispatch({ type: 'CHECK_CANDIDATE', id: o.c.id })}
                    className="border border-ink/20 px-3 py-1 text-sm hover:border-state disabled:opacity-45">Background check · {CHECK_PC} capital</button>
                )}
              </div>
              {!ok.ok && ok.reason && !o.refuses && <p className="text-[13px] text-ink-soft">{ok.reason}</p>}
            </li>
          );
        })}
      </ul>
      <button disabled={left <= 0 || s.pc < HUNT_PC} onClick={() => dispatch({ type: 'HEADHUNT', role })}
        className="mt-2 border border-ink/30 px-3 py-1 text-sm hover:border-state disabled:opacity-45">
        Search for more people in this field · {HUNT_PC} capital · 1 move
      </button>
    </div>
  );
}
