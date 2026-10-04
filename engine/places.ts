// Where things are. Big bets are built in a state the President chooses; the ones
// that work become assets that run every month under a manager, and the ones
// that fail leave a site behind. Each state's figures are its zone's, plus
// what has been put there. What is put in a state shows in how it votes.

import { ASSETS, EXPANSION } from '../content/assets';
import { STATES, STATE_BY_ID } from '../content/states';
import { VENTURE_BY_ID } from '../content/ventures';
import { REHEAD_PC, headsFor, type Head } from './institutions';
import { release, take } from './talent';
import type { Fx, GameState } from './types';
import { ZONE_NAME, applyFx, clamp } from './vars';
import { buildCost, payBuild } from './treasury';

export function assets(s: GameState): NonNullable<GameState['assets']> {
  return s.assets ?? [];
}

const leans = (h: Head) => h.patron !== 'president' && h.loyalty <= 3;

/** How well an asset is running, and why. */
export function assetPerformance(s: GameState, id: string): { k: number; why: string[]; captured: boolean } {
  const a = assets(s).find((x) => x.id === id);
  if (!a) return { k: 0, why: [], captured: false };
  const why: string[] = [];
  let k = 0.5 + 0.15 * a.head.competence;
  const zone = STATE_BY_ID[a.state]?.zone;
  if (zone && s.theatres[zone] >= 65) { k *= 0.6; why.push(`The ${ZONE_NAME[zone]} is dangerous: it runs at 60%`); }
  const captured = leans(a.head);
  if (captured) { k *= 0.6; why.push(`${a.head.name} runs it for someone else`); }
  if (a.head.integrity <= 2) { k *= 0.85; why.push('Its manager takes a cut'); }
  if (a.level) { k *= 1 + EXPANSION.gain * a.level; why.push(`Expanded ${a.level === 1 ? 'once' : 'twice'}: +${Math.round(EXPANSION.gain * a.level * 100)}%`); }
  return { k, why, captured };
}

export function assetFx(s: GameState, id: string): Fx[] {
  const d = ASSETS[id];
  if (!d) return [];
  const { k } = assetPerformance(s, id);
  return d.fx.map(([t, v]) => [t, Math.round(v * k * 1000) / 1000]);
}

export function assetFiscal(s: GameState, id: string): number {
  const d = ASSETS[id];
  if (!d) return 0;
  const level = assets(s).find((x) => x.id === id)?.level ?? 0;
  // Bigger costs more to keep running; what earns, earns with how well it runs.
  return d.fiscal > 0 ? d.fiscal * assetPerformance(s, id).k : d.fiscal * (1 + 0.15 * level);
}

export function assetFiscalLines(s: GameState): { label: string; value: number; hint: string }[] {
  return assets(s).map((a) => {
    const value = assetFiscal(s, a.id);
    return { label: `${ASSETS[a.id].name}, ${STATE_BY_ID[a.state]?.name}`, value, hint: value >= 0 ? `What it earns, under ${a.head.name.replace(/^A /, 'a ')}.` : 'What it costs to keep running.' };
  });
}

/** What a further expansion costs: a share of what the bet cost to build. */
export function expansionCost(s: GameState, id: string): { naira: number; pc: number; months: number } {
  return { naira: Math.round((VENTURE_BY_ID[id]?.naira ?? 0.5) * EXPANSION.share * 20) / 20, pc: EXPANSION.pc, months: EXPANSION.months };
}

export function canExpand(s: GameState, id: string): { ok: boolean; reason?: string } {
  const a = assets(s).find((x) => x.id === id);
  if (!a) return { ok: false };
  if (a.expanding) return { ok: false, reason: 'An expansion is already being built.' };
  if ((a.level ?? 0) >= EXPANSION.max) return { ok: false, reason: 'It is as large as the site allows.' };
  const c = expansionCost(s, id);
  if (s.pc < c.pc) return { ok: false, reason: `Needs ${c.pc} political capital.` };
  if (buildCost(s, c.naira, true).treasury > s.nation.fiscalSpace + 0.3) return { ok: false, reason: 'There is not the money in the treasury.' };
  return { ok: true };
}

export function expand(s: GameState, id: string): string {
  const a = assets(s).find((x) => x.id === id)!;
  const c = expansionCost(s, id);
  s.pc = clamp(s.pc - c.pc, 0, 100);
  payBuild(s, c.naira, true);
  a.expanding = s.turn + c.months;
  return `Work begins on expanding ${ASSETS[id].name.toLowerCase()}. In about ${c.months} months it will produce a quarter more.`;
}

export function assetTick(s: GameState): void {
  for (const a of assets(s)) {
    if (a.expanding && s.turn >= a.expanding) {
      a.expanding = undefined;
      a.level = (a.level ?? 0) + 1;
      s.news.push({ chronicle: `${ASSETS[a.id].name.toUpperCase()} EXPANDED`, street: `${ASSETS[a.id].name.replace(/^The /, '').toUpperCase()} DON BIG PASS BEFORE`, weight: 3, valence: 1, topic: 'bet', body: 'The expansion opened on schedule.' });
    }
    const k = assetPerformance(s, a.id).k;
    for (const r of ASSETS[a.id].record) (a.record ??= {})[r.label] = (a.record[r.label] ?? 0) + r.per * k;
    for (const f of assetFx(s, a.id)) applyFx(s, f);
    if (!leans(a.head)) continue;
    const p = a.head.patron;
    if (s.tycoons[p]) s.tycoons[p].rel = clamp(s.tycoons[p].rel + 0.5, 0, 100);
    else if (s.people[p]) s.people[p].rel = clamp(s.people[p].rel + 0.5, 0, 100);
    if (!a.seen && s.turn - a.since >= 6) {
      a.seen = true;
      const name = ASSETS[a.id].name;
      s.news.push({ chronicle: `WHO REALLY RUNS ${name.replace(/^The /, '').toUpperCase()}?`, street: 'DEM SAY NA ANOTHER PERSON DEY CHOP AM', weight: 5, valence: -1, topic: 'scandal', body: `Contracts and jobs at ${name.toLowerCase()} have followed one interest for six months.` });
      s.report.push({ kind: 'consequence', title: `${name}: captured`, cause: a.head.name, text: 'It has been run for someone other than the country. Output is cut and the patron is the better for it. Replace the manager, or live with it.', changes: [] });
    }
  }
}

/** On the day a bet is decided: a working asset or an abandoned site, in the state it was built in. */
export function settleSite(s: GameState, id: string, won: boolean): void {
  const state = s.sites?.[id];
  if (!state || !ASSETS[id]) return;
  if (won) {
    const head = headsFor(s).find((h) => h.name === 'A career civil servant')!;
    (s.assets ??= []).push({ id, state, head, since: s.turn });
    s.flags[`asset.${id}`] = true;
  } else {
    s.flags['site.abandoned'] = true;
    (s.placed ??= []).push({ state, kind: 'abandoned', label: `The abandoned site of ${VENTURE_BY_ID[id]?.name.toLowerCase() ?? id}`, turn: s.turn });
  }
}

export function canSetManager(s: GameState, id: string, head: string, movesLeft: number): { ok: boolean; reason?: string } {
  const a = assets(s).find((x) => x.id === id);
  if (!a) return { ok: false };
  const h = headsFor(s, 'asset').find((x) => x.name === head);
  if (a.head.name === head || !h) return { ok: false, reason: 'Not available.' };
  if (h.refuses) return { ok: false, reason: h.refuses };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < REHEAD_PC) return { ok: false, reason: `Needs ${REHEAD_PC} political capital.` };
  return { ok: true };
}

export function setManager(s: GameState, id: string, headName: string): string {
  const a = assets(s).find((x) => x.id === id)!;
  const old = a.head;
  a.head = headsFor(s, 'asset').find((h) => h.name === headName)!;
  const cid = (a.head as Head).cid;
  if (cid) take(s, cid);
  release(s, old.name);
  a.since = s.turn;
  a.seen = false;
  s.pc = clamp(s.pc - REHEAD_PC, 0, 100);
  if (leans(old) && s.tycoons[old.patron]) s.tycoons[old.patron].rel = clamp(s.tycoons[old.patron].rel - 8, 0, 100);
  if (leans(old) && s.people[old.patron]) s.people[old.patron].rel = clamp(s.people[old.patron].rel - 8, 0, 100);
  return `${a.head.name} takes over ${ASSETS[id].name.toLowerCase()}.`;
}

/** What has been put in a state, and what it does for the President there, in points of approval. */
export function local(s: GameState, stateId: string): { v: number; items: { label: string; v: number }[] } {
  const items: { label: string; v: number }[] = [];
  for (const a of assets(s)) if (a.state === stateId) items.push({ label: `${ASSETS[a.id].name}${assetPerformance(s, a.id).captured ? ' (captured)' : ''}`, v: assetPerformance(s, a.id).captured ? 1.5 : 3 });
  for (const v of s.ventures.active) if (s.sites?.[v.id] === stateId) items.push({ label: `Building: ${VENTURE_BY_ID[v.id]?.name}`, v: 1 });
  for (const p of s.placed ?? []) if (p.state === stateId) items.push({ label: p.label, v: p.kind === 'abandoned' ? -2 : 2 });
  const v = clamp(items.reduce((a, x) => a + x.v, 0), -6, 6);
  return { v, items };
}

export const STATE_IDS = STATES.map((x) => x.id);
