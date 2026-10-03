// Files are about people and things in this particular game. An event names a
// role ("the minister who is failing", "the bet that is in trouble"); the engine
// fills it from the state when the file is drawn.

import { EVENTS } from '../content';
import { PEOPLE, PERSON_BY_ID } from '../content/people';
import { THEATRE_BY_ZONE } from '../content/theatres';
import { TYCOONS, TYCOON_BY_ID } from '../content/tycoons';
import { VENTURE_BY_ID } from '../content/ventures';
import { shakyBet, worstRisk } from './bets';
import { dueCreditor, who } from './favours';
import { wooTarget } from './opposition';
import { following, personView, scorecard } from './people';
import { currentWant } from './wants';
import type { DeskItem, GameEvent, GameState, ZoneId } from './types';
import { ZONES, ZONE_NAME, favoursOwed, standing } from './vars';

type Selector = (s: GameState) => string | null;

const ministers = () => PEOPLE.filter((p) => p.group === 'minister');

export const SELECTORS: Record<string, Selector> = {
  creditorTycoon: (s) => dueCreditor(s, 'tycoon'),
  creditorGovernor: (s) => dueCreditor(s, 'governor'),
  wooed: (s) => wooTarget(s),
  /** The minister doing worst, once there has been time to judge. */
  weakMinister: (s) => {
    const list = ministers().map((p) => scorecard(s, p.id)).filter((c) => c.months >= 9 && c.score < 44).sort((a, b) => a.score - b.score);
    return list[0]?.id ?? null;
  },
  /** A minister who is delivering and ambitious. */
  starMinister: (s) => {
    const list = ministers().filter((p) => (personView(s, p.id).ambition ?? 0) >= 2).map((p) => scorecard(s, p.id)).filter((c) => c.months >= 10 && c.score >= 58);
    return list[0]?.id ?? null;
  },
  /** An ambitious minister with a following, unhappy with you, ready to walk out and run. */
  leavingMinister: (s) => {
    const list = ministers().filter((p) => {
      const st = s.people[p.id];
      return st && !st.gone && (personView(s, p.id).ambition ?? 0) >= 2 && following(s, p.id) >= 2 && s.turn - (st.since ?? 1) >= 18 && standing(s, p.id) < 55;
    });
    return list[0]?.id ?? null;
  },
  /** A minister whose hands are not clean, in a brief with money in it. */
  dirtyMinister: (s) => {
    const list = ministers().filter((p) => (personView(s, p.id).integrity ?? 3) <= 2 && s.turn - (s.people[p.id]?.since ?? 1) >= 7 && !s.flags[`dirty.${p.id}.${s.people[p.id]?.name ?? ''}`]);
    return list[0]?.id ?? null;
  },
  shakyBet: (s) => shakyBet(s),
  /** The theatre that is worst. */
  hotTheatre: (s) => {
    const z = [...ZONES].sort((a, b) => s.theatres[b] - s.theatres[a])[0];
    return s.theatres[z] >= 70 ? z : null;
  },
  /** A businessman on good enough terms to offer money. */
  generousTycoon: (s) => {
    const list = TYCOONS.filter((t) => (s.tycoons[t.id]?.rel ?? 0) >= 50 && (s.counters[`took.${t.id}`] ?? -99) < s.turn - 12)
      .sort((a, b) => s.tycoons[b.id].rel - s.tycoons[a.id].rel);
    return list[0]?.id ?? null;
  },
  /** A governor with something to hide and nobody yet holding it over him. */
  troubledGovernor: (s) => {
    const list = PEOPLE.filter((p) => p.group === 'governor' && p.temper !== 'principled' && !s.people[p.id]?.gone && favoursOwed(s, p.id).length === 0 && standing(s, p.id) < 72)
      .sort((a, b) => b.clout - a.clout);
    return list[0]?.id ?? null;
  },
};

/** Chooses who a file is about. Null if any role cannot be filled, in which case the file does not arise. */
export function resolveCast(s: GameState, e: GameEvent): Record<string, string> | null {
  if (!e.cast) return {};
  const out: Record<string, string> = {};
  for (const [key, sel] of Object.entries(e.cast)) {
    const id = SELECTORS[sel]?.(s);
    if (!id) return null;
    out[key] = id;
  }
  return out;
}

const esc = (t: string) => JSON.stringify(t).slice(1, -1);

function tokens(s: GameState, key: string, id: string): [string, string][] {
  const out: [string, string][] = [];
  const v = VENTURE_BY_ID[id];
  if (v) {
    const risk = worstRisk(s, v);
    out.push([`{${key}}`, v.name], [`{${key}_RISK}`, risk?.warn ?? 'The site reports that all is well.'], [`{${key}_FIX}`, risk?.fix ?? '']);
    return out;
  }
  if ((ZONES as string[]).includes(id)) {
    out.push([`{${key}}`, ZONE_NAME[id as ZoneId]], [`{${key}_THREAT}`, THEATRE_BY_ZONE[id as ZoneId].name.toLowerCase()]);
    return out;
  }
  const w = who(s, id);
  const want = currentWant(s, id)?.text ?? PERSON_BY_ID[id]?.want?.text ?? TYCOON_BY_ID[id]?.want.text ?? '';
  out.push([`{${key}}`, w.name], [`{${key}_SHORT}`, w.short], [`{${key}_TITLE}`, w.title], [`{${key}_WANT}`, want]);
  return out;
}

/** The event as it reads in this game: names filled in and effects pointed at the right people. */
export function materialise(s: GameState, e: GameEvent, cast: Record<string, string> | undefined): GameEvent {
  if (!e.cast || !cast || !Object.keys(cast).length) return e;
  let json = JSON.stringify(e);
  for (const [key, id] of Object.entries(cast)) {
    for (const [tok, text] of tokens(s, key, id)) json = json.split(tok).join(esc(text));
    json = json.split(`$${key}`).join(id);
  }
  return JSON.parse(json) as GameEvent;
}

export function eventOf(s: GameState, item: DeskItem | null | undefined): GameEvent | undefined {
  if (!item) return undefined;
  const e = EVENTS[item.eventId];
  return e ? materialise(s, e, item.cast) : undefined;
}
