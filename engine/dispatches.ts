// Consequence theatre. The simulation already knows why every number moved; this
// turns the biggest movements into something that happened in the country, in the
// voice of whoever would announce it, with the decision that most plausibly caused
// it named and dated. The same numbers, told as events. At most two a month, and
// the same figure does not report again for six months.

import { describe } from './effects';
import { mo } from './config';
import type { GameState, Nation } from './types';

type Key = 'capacity' | 'integrity' | 'power' | 'security' | 'jobs' | 'inflation' | 'fiscalSpace';

interface Voice { who: string; step: number; good: 1 | -1; up: string[]; down: string[] }

// Announcements are made by invented or generic offices; no real organisation is named.
const VOICE: Record<Key, Voice> = {
  capacity: { who: 'the Head of Service', step: 2, good: 1,
    up: ['Ministries clear their backlog of approvals for the first time in years', 'Federal agencies meet their service targets in a quarterly review'],
    down: ['Approvals stall across the ministries; files go "missing" in three', 'The civil service misses most of its quarterly targets'] },
  integrity: { who: 'the Auditor-General', step: 2, good: 1,
    up: ['The audit report finds fewer unexplained payments than any year on record', 'Procurement complaints fall for a second quarter'],
    down: ['The audit report lists payments nobody can explain', 'Procurement complaints double in a quarter'] },
  power: { who: 'the grid operator', step: 2, good: 1,
    up: ['The national grid holds above its target for a full month', 'Factories report fewer hours on diesel generators'],
    down: ['The national grid collapses twice in a month', 'Distribution companies ration supply to most feeders'] },
  security: { who: 'Defence Headquarters', step: 2, good: 1,
    up: ['Two highways reopen to night travel', 'Reported attacks fall for a second month'],
    down: ['Attacks on highways rise sharply', 'Villages in two states are emptied by raids'] },
  jobs: { who: 'the Statistics Bureau', step: 2, good: 1,
    up: ['Factory hiring rises for a third quarter', 'New business registrations reach a record'],
    down: ['Factory closures outnumber openings', 'Youth unemployment rises again in the labour survey'] },
  inflation: { who: 'the Statistics Bureau', step: 1.5, good: -1,
    up: ['Food prices jump again in the monthly market survey', 'Transport fares rise in every zone surveyed'],
    down: ['Food prices fall in the market survey for the first time in a year', 'Transport fares ease in the monthly survey'] },
  fiscalSpace: { who: 'the revenue service', step: 0.4, good: 1,
    up: ['Revenue collections reach their highest level in four years', 'The Treasury beats its monthly revenue target'],
    down: ['The Treasury misses its revenue target by a wide margin', 'Revenue collections fall short for a second month'] },
};

/** The past decision that most plausibly pushed this figure the way it went. */
function culprit(s: GameState, target: string, sign: number): { headline: string; ago: number } | null {
  let best: { headline: string; ago: number; w: number } | null = null;
  for (const a of s.archive) {
    const d = a.touches?.[target];
    if (!d || Math.sign(d) !== sign) continue;
    const ago = s.turn - a.turn;
    if (ago < 1 || ago > 30) continue;
    const w = Math.abs(d) * a.sig / (1 + ago / 12);
    if (!best || w > best.w) best = { headline: a.headline, ago, w };
  }
  return best;
}

const lower = (x: string) => { const first = x.split(/\.\s/)[0].replace(/\.$/, ''); return first[0].toLowerCase() + first.slice(1); };

/** After the month's simulation: the biggest movements become dispatches in the report. */
export function dispatchTick(s: GameState, before: Nation): void {
  // Measured over the last three months: change in a country is a trend, not a twitch.
  const base = s.hist.length >= 3 ? s.hist[0] : before;
  const moves = (Object.keys(VOICE) as Key[])
    .map((k) => ({ k, d: s.nation[k] - base[k] }))
    .filter(({ k, d }) => Math.abs(d) >= VOICE[k].step && s.turn - (s.counters[`dispatch.${k}`] ?? -99) >= 6)
    .sort((a, b) => Math.abs(b.d) / VOICE[b.k].step - Math.abs(a.d) / VOICE[a.k].step)
    .slice(0, 2);
  for (const { k, d } of moves) {
    const v = VOICE[k];
    const up = d > 0;
    const good = (up ? 1 : -1) === v.good;
    const lines = up ? v.up : v.down;
    const title = lines[(s.turn + s.seed) % lines.length];
    const c = culprit(s, `nation.${k}`, Math.sign(d));
    const credit = c
      ? good
        ? `${v.who[0].toUpperCase()}${v.who.slice(1)} credits part of it to a decision ${mo(c.ago)} ago: ${lower(c.headline)}.`
        : `Officials trace part of it to a decision ${mo(c.ago)} ago: ${lower(c.headline)}.`
      : good ? 'Nobody in government has yet claimed it.' : 'Nobody has yet been blamed.';
    s.counters[`dispatch.${k}`] = s.turn;
    s.report.push({ kind: good ? 'reform' : 'failure', title, cause: `Announced by ${v.who}`, text: credit, changes: describe([[`nation.${k}`, Math.round(d * 100) / 100]]) });
  }
}
