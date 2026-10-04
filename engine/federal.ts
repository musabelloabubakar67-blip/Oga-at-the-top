// Federal character. The big posts (the six ministers, the Finance Minister, the
// Chief of Staff and the political adviser, and at half weight the heads of the
// institutions and assets) are counted by zone. A zone with less than its share
// cools on the government every month; a zone with nobody at all is loudest, and
// its governor takes it personally. A President who fills the table from home is
// called what such Presidents are called.

import { ORIGIN, NORTH } from '../content/federal';
import { PEOPLE } from '../content/people';
import { personView, governorOf } from './people';
import type { GameState, ZoneId } from './types';
import { ZONES, ZONE_NAME, applyFx, clamp } from './vars';

export interface Post { name: string; post: string; zone: ZoneId | null; weight: number }

/** Where someone comes from, if it is known. */
export function zoneOf(s: GameState, name: string): ZoneId | null {
  return s.origins?.[name] ?? ORIGIN[name] ?? null;
}

export const sameHalf = (a: ZoneId, b: ZoneId) => NORTH.includes(a) === NORTH.includes(b);

export function posts(s: GameState): Post[] {
  const out: Post[] = [];
  for (const p of PEOPLE.filter((x) => x.group === 'minister')) {
    const v = personView(s, p.id);
    if (!v.gone) out.push({ name: v.name, post: p.title, zone: zoneOf(s, v.name), weight: 1 });
  }
  for (const [id, post] of [['fin', 'Minister of Finance'], ['cos', 'Chief of Staff'], ['sap', 'Political Adviser']] as const) {
    const c = s.chars[id];
    if (c) out.push({ name: c.name, post, zone: zoneOf(s, c.name), weight: 1 });
  }
  if (s.vp) out.push({ name: s.vp.name, post: 'Vice President', zone: s.vp.zone, weight: 1 });
  for (const i of s.institutions ?? []) out.push({ name: i.head.name, post: 'Head of an institution', zone: zoneOf(s, i.head.name), weight: 0.5 });
  for (const a of s.assets ?? []) out.push({ name: a.head.name, post: 'Manager of an asset', zone: zoneOf(s, a.head.name), weight: 0.5 });
  return out;
}

export interface ZoneShare { zone: ZoneId; count: number; fair: number; names: string[]; effect: number; why: string }

/** Each zone's share of the big posts, against an even share, and what it is doing to the zone's mood every month. */
export function federalCharacter(s: GameState): { zones: ZoneShare[]; nepotism: boolean; home: number } {
  const ps = posts(s).filter((p) => p.zone);
  const total = ps.reduce((a, p) => a + p.weight, 0);
  const fair = total / 6;
  const home = s.president.homeZone;
  const homeCount = ps.filter((p) => p.zone === home).reduce((a, p) => a + p.weight, 0);
  const nepotism = homeCount >= fair * 2 + 0.5;
  const zones = ZONES.map((z) => {
    const mine = ps.filter((p) => p.zone === z);
    const count = mine.reduce((a, p) => a + p.weight, 0);
    const d = count - fair;
    let effect = clamp(0.04 * d, -0.06, 0.06);
    let why = d >= 0.5 ? 'More than its share: grateful' : d <= -0.5 ? 'Less than its share: keeping count' : 'About its share';
    if (count === 0) { effect -= 0.05; why = `Nobody at the table. The ${ZONE_NAME[z]} says so every week`; }
    return { zone: z, count, fair, names: mine.map((p) => p.name), effect: Math.round(effect * 1000) / 1000, why };
  });
  return { zones, nepotism, home: homeCount };
}

export function federalTick(s: GameState): void {
  const f = federalCharacter(s);
  for (const z of f.zones) {
    applyFx(s, [`zone.${z.zone}.approval`, z.effect]);
    const g = governorOf(z.zone);
    if (z.count === 0 && g && s.people[g.id]) s.people[g.id].rel = clamp(s.people[g.id].rel - 0.15, 0, 100);
  }
  if (f.nepotism) applyFx(s, ['bloc.press', -0.04]);
  // The first month a zone is shut out, the papers notice.
  for (const z of f.zones) {
    const key = `shut.${z.zone}`;
    if (z.count === 0 && s.counters[key] === undefined && s.turn >= 3) {
      s.counters[key] = s.turn;
      s.news.push({ chronicle: `"NOT ONE OF OUR SONS OR DAUGHTERS": ${ZONE_NAME[z.zone].toUpperCase()} LEADERS DECRY CABINET`, street: `${ZONE_NAME[z.zone].toUpperCase()} SAY DEM NO DEY THE TABLE`, weight: 4, valence: -1, topic: 'politics', body: 'Elders and the zone\'s caucus in the Assembly have issued a communiqué counting the federal appointments. Their column is empty.' });
    }
    if (z.count > 0) delete s.counters[key];
  }
}
