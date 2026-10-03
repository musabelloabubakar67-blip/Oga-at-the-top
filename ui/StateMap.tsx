'use client';

import { useState } from 'react';
import { ASSETS } from '../content/assets';
import { STATE_BY_ID } from '../content/states';
import { THEATRE_BY_ZONE } from '../content/theatres';
import { runElection } from '../engine/election';
import { assets, local } from '../engine/places';
import type { GameState } from '../engine/types';
import { ZONE_NAME } from '../engine/vars';

// Each state as a tile, placed roughly where it sits on the map: north at the top, Lagos bottom left, the delta bottom right.
const GRID: Record<string, [number, number]> = {
  SO: [1, 0], KT: [2, 0], KN: [3, 0], JI: [4, 0], YO: [5, 0], BO: [6, 0],
  KB: [0, 1], ZA: [1, 1], KD: [2, 1], BA: [3, 1], GO: [4, 1], AD: [5, 1],
  KW: [0, 2], NI: [1, 2], FC: [2, 2], PL: [3, 2], TA: [4, 2],
  OY: [0, 3], OS: [1, 3], KO: [2, 3], NA: [3, 3], BE: [4, 3],
  OG: [0, 4], EK: [1, 4], ED: [2, 4], EN: [3, 4], EB: [4, 4],
  LA: [0, 5], ON: [1, 5], DE: [2, 5], AN: [3, 5], AB: [4, 5], CR: [5, 5],
  BY: [1, 6], RI: [2, 6], IM: [3, 6], AK: [4, 6],
};

const T = 76;
const GAP = 6;

function fill(margin: number): string {
  const k = Math.min(1, Math.abs(margin) / 20);
  // Green for states you would carry, red for those you would lose; pale when close.
  return margin >= 0 ? `rgba(31, 77, 58, ${0.18 + 0.72 * k})` : `rgba(140, 43, 43, ${0.18 + 0.72 * k})`;
}

/** The country as tiles: how each state would vote today, where the danger is, and what you have built. */
export function StateMap({ s }: { s: GameState }) {
  const proj = runElection(structuredClone(s), s.term === 2 ? 'succession' : 'reelection', true);
  const byId = Object.fromEntries(proj.states.map((r) => [r.id, r]));
  const [pick, setPick] = useState<string>(s.president.home);
  const sel = byId[pick];
  const here = local(s, pick);
  const z = STATE_BY_ID[pick]?.zone;
  const W = 7 * (T + GAP);
  const H = 7 * (T + GAP);
  return (
    <div className="grid gap-6 xl:grid-cols-[auto_1fr]">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-[560px] max-w-full" role="img" aria-label="Map of the states">
        {Object.entries(GRID).map(([id, [c, r]]) => {
          const st = byId[id];
          if (!st) return null;
          const m = st.share - st.opp;
          const zone = STATE_BY_ID[id].zone;
          const hot = s.theatres[zone] >= 65;
          const built = assets(s).some((a) => a.state === id);
          const scar = (s.placed ?? []).some((p) => p.state === id && p.kind === 'abandoned');
          const x = c * (T + GAP);
          const y = r * (T + GAP);
          return (
            <g key={id} onClick={() => setPick(id)} className="cursor-pointer">
              <title>{`${st.name}: ${m >= 0 ? '+' : ''}${m.toFixed(1)}`}</title>
              <rect x={x} y={y} width={T} height={T} fill={fill(m)} stroke={pick === id ? '#b0914f' : hot ? '#8c2b2b' : '#1b1b1b22'} strokeWidth={pick === id ? 4 : hot ? 3 : 1} strokeDasharray={hot && pick !== id ? '6 4' : undefined} />
              <text x={x + 8} y={y + 22} className="font-mono" fontSize="15" fill="#1b1b1b">{id}</text>
              <text x={x + 8} y={y + T - 12} fontSize="15" fill="#1b1b1b" fontFamily="Georgia, serif">{Math.round(m) > 0 ? '+' : ''}{Math.round(m) === 0 ? '0' : Math.round(m)}</text>
              {s.president.home === id && <text x={x + T - 22} y={y + 22} fontSize="16" fill="#b0914f">★</text>}
              {built && <circle cx={x + T - 14} cy={y + T - 16} r={6} fill="#1f4d3a" stroke="#f2ecdd" strokeWidth={2} />}
              {scar && <rect x={x + T - 32} y={y + T - 22} width={11} height={11} fill="#8c2b2b" stroke="#f2ecdd" strokeWidth={2} />}
            </g>
          );
        })}
      </svg>
      <div>
        {sel && z && (
          <div className="border border-ink/20 p-4">
            <p className="label text-ink-soft">{ZONE_NAME[z]} · {sel.voters.toFixed(1)}m voters</p>
            <h4 className="mt-1 font-serif text-2xl">{sel.name}{s.president.home === pick ? ' · home' : ''}</h4>
            <p className={`mt-1 font-serif text-lg ${sel.share >= sel.opp ? 'text-state' : 'text-alarm'}`}>
              {sel.share >= sel.opp ? 'Would vote for ' : 'Would vote against '}{s.term === 2 ? 'your party' : 'you'} today, by {Math.abs(sel.share - sel.opp).toFixed(1)} points
            </p>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <dt className="text-ink-soft">Zone approval</dt><dd className="text-right">{Math.round(s.zones[z].approval)}%</dd>
              <dt className="text-ink-soft">{THEATRE_BY_ZONE[z].name}</dt><dd className={`text-right ${s.theatres[z] >= 65 ? 'text-alarm' : ''}`}>{Math.round(s.theatres[z])}</dd>
              <dt className="text-ink-soft">What is here</dt><dd className="text-right">{here.v > 0 ? '+' : ''}{here.v} approval</dd>
            </dl>
            {here.items.length > 0
              ? <ul className="mt-2 list-disc pl-5 text-sm">{here.items.map((x) => <li key={x.label}>{x.label} ({x.v > 0 ? '+' : ''}{x.v})</li>)}</ul>
              : <p className="mt-2 text-sm italic text-ink-soft">Nothing of yours is built here. A big bet sited here would lift it.</p>}
            {assets(s).filter((a) => a.state === pick).map((a) => <p key={a.id} className="mt-1 text-[13px] text-ink-soft">{ASSETS[a.id].name} is run by {a.head.name}.</p>)}
          </div>
        )}
        <p className="mt-3 text-[13px] leading-snug text-ink-soft">
          Green: would vote for {s.term === 2 ? 'your party' : 'you'}; red: against; the deeper the colour, the wider the margin. A dashed red border: the zone&apos;s theatre is dangerous. A dot: an asset you built. A red square: an abandoned site. ★ home. The mood on the day is not counted.
        </p>
      </div>
    </div>
  );
}
