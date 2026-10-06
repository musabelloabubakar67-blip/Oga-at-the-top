// Where things are. Big bets are built in a state the President chooses; the ones
// that work become assets that run every month under a manager, and the ones
// that fail leave a site behind. Each state's figures are its zone's, plus
// what has been put there. What is put in a state shows in how it votes.

import { ASSETS, EXPANSION } from '../content/assets';
import { ASSET_SYSTEMS } from '../content/asset-systems';
import { STATES, STATE_BY_ID } from '../content/states';
import { VENTURE_BY_ID } from '../content/ventures';
import { REHEAD_PC, headsFor, type Head } from './institutions';
import { release, take } from './talent';
import { canAppointExceptional } from './recruitment';
import type { Fx, GameState } from './types';
import { ZONE_NAME, applyFx, clamp, test } from './vars';
import { buildCost, payBuild } from './treasury';
import { hooks } from './hooks';

export function assets(s: GameState): NonNullable<GameState['assets']> {
  return s.assets ?? [];
}

export interface StartingAssetSpec { asset: string; site: string; condition?: number }
export interface ScenarioAssets { assets?: StartingAssetSpec[] }

/** Historical operating assets are not bets won by the incoming President. */
export function initialiseScenarioAssets(s: GameState, scenario: ScenarioAssets): void {
  const specs = scenario.assets ?? [];
  const ids = new Set(assets(s).map((a) => a.id));
  for (const spec of specs) {
    const def = ASSETS[spec.asset];
    if (!def || !STATE_BY_ID[spec.site] || !def.sites.includes(spec.site)) throw new Error('Invalid starting asset or site');
    if (ids.has(spec.asset)) throw new Error('Duplicate starting asset');
    if (spec.condition !== undefined && (!Number.isFinite(spec.condition) || spec.condition < 0 || spec.condition > 1)) throw new Error('Asset condition must be between zero and one');
    ids.add(spec.asset);
  }
  const manager = specs.length ? headsFor(s).find((h) => h.name === 'A career civil servant') : undefined;
  if (specs.length && !manager) throw new Error('No starting asset manager');
  for (const spec of specs) {
    (s.assets ??= []).push({ id: spec.asset, state: spec.site, condition: spec.condition ?? 1,
      head: structuredClone(manager!), since: 0 });
    (s.sites ??= {})[spec.asset] = spec.site;
    s.flags[`asset.${spec.asset}`] = true;
  }
}

const leans = (h: Head) => h.patron !== 'president' && h.loyalty <= 3;

/** How well an asset is running, and why. */
export function assetPerformance(s: GameState, id: string): { k: number; why: string[]; captured: boolean } {
  const a = assets(s).find((x) => x.id === id);
  if (!a) return { k: 0, why: [], captured: false };
  const why: string[] = [];
  let k = 0.5 + 0.15 * a.head.competence;
  const condition = a.condition ?? 1;
  k *= condition;
  if (condition < 1) why.push(`Physical condition: ${Math.round(condition * 100)}% of output`);
  const scale = a.scale ?? 1;
  if (scale < 1) { k *= scale; why.push(`Only ${Math.round(scale * 100)}% of the design was built`); }
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
  const lines = assets(s).map((a) => {
    const value = assetFiscal(s, a.id);
    return { label: `${ASSETS[a.id].name}, ${STATE_BY_ID[a.state]?.name}`, value, hint: value >= 0 ? `What it earns, under ${a.head.name.replace(/^A /, 'a ')}.` : 'What it costs to keep running.' };
  });
  const upkeep = assets(s).reduce((x, a) => x + upkeepCost(s, a.id), 0);
  if (upkeep > 0.0005) lines.push({ label: 'Maintaining the state\'s plants', value: -upkeep, hint: 'Spares, overhauls and engineers for every operating asset whose maintenance is not deferred.' });
  return lines;
}

// ---------------------------------------------------------------- wear, maintenance and finishing (plan 12)

export const WEAR = { base: 0.003, deferred: 0.006, insecure: 0.004, careless: 0.003, restore: 0.005, floor: 0.25 };

/** Condition lost each month, and why. Maintenance, a capable manager and a quiet zone slow it, or reverse it. */
export function wear(s: GameState, id: string): { rate: number; why: string[] } {
  const a = assets(s).find((x) => x.id === id);
  if (!a) return { rate: 0, why: [] };
  const why: string[] = [];
  let rate = WEAR.base;
  const kept = (a.upkeep ?? 'maintained') === 'maintained';
  if (!kept) { rate += WEAR.deferred; why.push('Maintenance is deferred'); }
  const zone = STATE_BY_ID[a.state]?.zone;
  if (zone && s.theatres[zone] >= 65) { rate += WEAR.insecure; why.push('Equipment is stolen and sabotaged'); }
  if (a.head.competence <= 2) { rate += WEAR.careless; why.push('Its manager does not keep it up'); }
  if (kept && a.head.competence >= 4) { rate -= WEAR.restore; why.push('A capable manager keeps it in good order'); }
  return { rate, why };
}

/** What maintaining it costs each month. Deferred, nothing, for now. */
export function upkeepCost(s: GameState, id: string): number {
  const a = assets(s).find((x) => x.id === id);
  if (!a || (a.upkeep ?? 'maintained') === 'deferred') return 0;
  return Math.max(0.001, Math.abs(ASSETS[id]?.fiscal ?? 0) * 0.15) * (1 + 0.25 * (a.level ?? 0));
}

export function setUpkeep(s: GameState, id: string, mode: 'maintained' | 'deferred'): string {
  const a = assets(s).find((x) => x.id === id);
  if (!a) return '';
  a.upkeep = mode;
  return mode === 'deferred'
    ? `Maintenance at ${ASSETS[id].name.toLowerCase()} is deferred. It saves money every month and wears out faster: what is not spent now is spent later, on a refurbishment.`
    : `Maintenance at ${ASSETS[id].name.toLowerCase()} resumes.`;
}

export const refurbishCost = (s: GameState, id: string) => ({ naira: Math.round((VENTURE_BY_ID[id]?.naira ?? 0.5) * 0.25 * 20) / 20, pc: 2, months: 4 });

export function canRefurbish(s: GameState, id: string): { ok: boolean; reason?: string } {
  const a = assets(s).find((x) => x.id === id);
  if (!a) return { ok: false };
  if (a.refurbishing) return { ok: false, reason: 'A refurbishment is under way.' };
  if ((a.condition ?? 1) > 0.85) return { ok: false, reason: 'It is in good condition.' };
  const c = refurbishCost(s, id);
  if (s.pc < c.pc) return { ok: false, reason: `Needs ${c.pc} political capital.` };
  if (buildCost(s, c.naira, true).treasury > s.nation.fiscalSpace + 0.3) return { ok: false, reason: 'There is not the money in the treasury.' };
  return { ok: true };
}

export function refurbish(s: GameState, id: string): string {
  const a = assets(s).find((x) => x.id === id)!;
  const c = refurbishCost(s, id);
  s.pc = clamp(s.pc - c.pc, 0, 100);
  payBuild(s, c.naira, true);
  a.refurbishing = s.turn + c.months;
  return `A refurbishment of ${ASSETS[id].name.toLowerCase()} begins. In about ${c.months} months it will be back to its design condition.`;
}

/** Finishing a partial delivery: what was not built the first time. */
export function finishCost(s: GameState, id: string): { naira: number; pc: number; months: number } {
  const a = assets(s).find((x) => x.id === id);
  const left = 1 - (a?.scale ?? 1);
  const v = VENTURE_BY_ID[id];
  return { naira: Math.round((v?.naira ?? 0.5) * left * 0.8 * 20) / 20, pc: 3, months: Math.max(3, Math.round((v?.months ?? 12) * left * 0.6)) };
}

export function canFinish(s: GameState, id: string): { ok: boolean; reason?: string } {
  const a = assets(s).find((x) => x.id === id);
  if (!a || (a.scale ?? 1) >= 1) return { ok: false };
  if (a.completing) return { ok: false, reason: 'The rest is being built.' };
  const c = finishCost(s, id);
  if (s.pc < c.pc) return { ok: false, reason: `Needs ${c.pc} political capital.` };
  if (buildCost(s, c.naira, true).treasury > s.nation.fiscalSpace + 0.3) return { ok: false, reason: 'There is not the money in the treasury.' };
  return { ok: true };
}

export function finish(s: GameState, id: string): string {
  const a = assets(s).find((x) => x.id === id)!;
  const c = finishCost(s, id);
  s.pc = clamp(s.pc - c.pc, 0, 100);
  payBuild(s, c.naira, true);
  a.completing = s.turn + c.months;
  return `Work resumes on the part of ${ASSETS[id].name.toLowerCase()} that was never built. In about ${c.months} months it should run at its design scale.`;
}

/** What an asset does to its particular system this month, at its actual output. */
export function assetSystem(s: GameState, id: string): { dollars: number; imports: number; reserves: number; buildCut: number; blocked?: string } {
  const sys = ASSET_SYSTEMS[id];
  const zero = { dollars: 0, imports: 0, reserves: 0, buildCut: 0 };
  if (!sys || !assets(s).some((a) => a.id === id)) return zero;
  const k = assetPerformance(s, id).k;
  if (sys.obligation && !test(s, sys.obligation.when)) return { ...zero, imports: (sys.imports ?? 0) * k, blocked: sys.obligation.text };
  return { dollars: (sys.dollars ?? 0) * k, imports: (sys.imports ?? 0) * k, reserves: (sys.reserves ?? 0) * k, buildCut: Math.min(0.15, (sys.buildCut ?? 0) * k) };
}

/** All assets together, for the dollar flow and the cost of building. */
export function assetTrade(s: GameState): { dollars: number; imports: number; reserves: number; buildCut: number } {
  return assets(s).reduce((t, a) => {
    const x = assetSystem(s, a.id);
    return { dollars: t.dollars + x.dollars, imports: t.imports + x.imports, reserves: t.reserves + x.reserves, buildCut: t.buildCut + x.buildCut };
  }, { dollars: 0, imports: 0, reserves: 0, buildCut: 0 });
}
hooks.buildCut = (s) => Math.min(0.15, assetTrade(s).buildCut);
hooks.assetSystem = assetSystem;

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
    if (a.refurbishing && s.turn >= a.refurbishing) {
      a.refurbishing = undefined;
      a.condition = 1;
      s.report.push({ kind: 'consequence', title: `${ASSETS[a.id].name}: refurbished`, text: 'It is back to its design condition.', changes: [] });
    }
    if (a.completing && s.turn >= a.completing) {
      a.completing = undefined;
      const was = a.scale ?? 1;
      a.scale = 1;
      // What the part never built would have delivered arrives now.
      for (const [t, v] of VENTURE_BY_ID[a.id]?.win ?? []) if (t.startsWith('bonus.') || t.startsWith('nation.') || t.startsWith('pressure.')) applyFx(s, [t, v * (1 - was)]);
      if (s.bets[a.id]) s.bets[a.id].scale = 1;
      s.news.push({ chronicle: `${ASSETS[a.id].name.toUpperCase()} FINALLY COMPLETED`, street: `${ASSETS[a.id].name.replace(/^The /, '').toUpperCase()} DON FINISH PROPER`, weight: 4, valence: 1, topic: 'bet', body: 'The part of the design that was never built is now running.' });
      s.report.push({ kind: 'reform', title: `${ASSETS[a.id].name}: finished`, text: `It now runs at its full design scale, up from ${Math.round(was * 100)}%.`, changes: [] });
    }
    // Wear: what is not maintained runs down, and a run-down plant produces less.
    if (!a.refurbishing) {
      const before = a.condition ?? 1;
      const w = wear(s, a.id);
      a.condition = Math.round(clamp(before - w.rate, WEAR.floor, 1) * 1000) / 1000;
      if (before >= 0.6 && a.condition < 0.6) s.report.push({ kind: 'failure', title: `${ASSETS[a.id].name} is running down`, cause: w.why.join('; ') || 'Age', text: 'It now produces less than two thirds of what it was built for. Restore its maintenance, change its manager, or refurbish it.', changes: [] });
    }
    const gold = assetSystem(s, a.id).reserves;
    if (gold > 0 && s.fx) {
      s.fx.reserves += gold;
      const log = (s.accounts ??= { revHist: [], created: s.debts?.ways ?? 0, reserveLog: [] }).reserveLog;
      log.push({ turn: s.turn, flow: gold, intervention: 0, note: `Gold bought into the reserves from ${ASSETS[a.id].name.toLowerCase()}` });
      if (log.length > 36) log.shift();
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
export function settleSite(s: GameState, id: string, won: boolean, scale = 1): void {
  const state = s.sites?.[id];
  if (!state || !ASSETS[id]) return;
  if (won) {
    const head = headsFor(s).find((h) => h.name === 'A career civil servant')!;
    (s.assets ??= []).push({ id, state, head, since: s.turn, ...(scale < 1 ? { scale } : {}) });
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
  if (h.cid) { const can = canAppointExceptional(s, h.cid, { kind: 'asset', id }); if (!can.ok) return can; }
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < REHEAD_PC) return { ok: false, reason: `Needs ${REHEAD_PC} political capital.` };
  return { ok: true };
}

export function setManager(s: GameState, id: string, headName: string): string {
  const a = assets(s).find((x) => x.id === id)!;
  const proposed = headsFor(s, 'asset').find((h) => h.name === headName)!;
  if (proposed.cid && !canAppointExceptional(s, proposed.cid, { kind: 'asset', id }).ok) throw new Error('Exceptional appointment terms are not agreed or funded');
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
