// CITIZENS, GROUPS AND THE CONSTITUENCIES DEVELOPMENT CREATES (plan 14)
// Each economic group's fortune is worked out each month from what it actually
// depends on, with the reasons kept, so the country can improve while one group
// loses and the player can see why. Public services are measured on several
// dimensions at once: access is not completion, and coverage is not reliability.
// The citizen cast act on their circumstances (organise, petition, move, change
// work, back an alternative), and what they do has effects. Success creates new
// constituencies that later governments must answer to.

import { ASSETS } from '../content/assets';
import { CITIZENS, type Citizen, type Group } from '../content/citizens';
import { CONSTITUENCIES, DIM_START, GROUPS, GROUP_BY_ID, SERVICE_EFFECTS, type ServiceDim } from '../content/society';
import { hooks } from './hooks';
import { reformName } from './reforms';
import { assetPerformance, assets } from './places';
import type { GameState, ZoneId } from './types';
import { applyFx, clamp, getVar, test } from './vars';

export type Act = Citizen['responses'][number]['act'];

export interface Society {
  /** Each group's fortune over the last year, newest last. */
  hist: Record<string, number[]>;
  /** What each citizen has done, and when. */
  acts: { who: string; act: Act; text: string; turn: number }[];
  /** How organised each group is (0–3). */
  organised: Record<string, number>;
  /** Constituencies created by development, and when. They outlive the government that created them. */
  constituencies: Record<string, number>;
  /** National output over the last year, for "the country improved while this group lost". */
  output: number[];
}

export function ensureSociety(s: GameState): Society {
  s.society ??= { hist: {}, acts: [], organised: {}, constituencies: {}, output: [] };
  return s.society;
}

// ---------------------------------------------------------------- services

/** What a service-dimension reform is worth now: in full if funded, turned into its failure if not. */
function adequacy(s: GameState, id: string): number {
  const e = SERVICE_EFFECTS[id];
  if (!e?.funded) return 1;
  const share = (s.budget.alloc[e.funded.sector] ?? 2) - 2;
  const cash = s.nation.fiscalSpace >= 0.3 ? 1 : 0.6;
  return clamp((0.55 + share * 0.2) * cash + (s.nation.capacity - 34) * 0.005, 0.2, 1.1);
}

/** Every service dimension, with what moves it. */
export function services(s: GameState): Record<ServiceDim, { v: number; lines: { label: string; value: number }[] }> {
  const out = {} as Record<ServiceDim, { v: number; lines: { label: string; value: number }[] }>;
  for (const d of Object.keys(DIM_START) as ServiceDim[]) out[d] = { v: DIM_START[d], lines: [{ label: 'Where the country started', value: DIM_START[d] }] };
  const add = (d: ServiceDim, label: string, x: number) => { if (Math.abs(x) >= 0.5) { out[d].v += x; out[d].lines.push({ label, value: Math.round(x) }); } };
  for (const id of s.agenda.done) {
    const e = SERVICE_EFFECTS[id];
    if (!e) continue;
    const k = adequacy(s, id);
    const name = reformTitle(id);
    for (const [d, x] of Object.entries(e.dims) as [ServiceDim, number][]) {
      // An unfunded gain is a smaller one; an unfunded free service also loses quality.
      add(d, k < 0.8 && x > 0 ? `${name} (underfunded)` : name, x > 0 ? x * Math.min(1, k) : x);
    }
    if (e.funded && k < 0.7) add(id.startsWith('k') || id.startsWith('e') ? 'edu.quality' : id.startsWith('p') ? 'power.reliability' : 'health.outcomes', `${name}: ${e.funded.failure.split(':')[0]}`, -6 * (0.7 - k) / 0.5);
  }
  // Outside conditions: clinics need power, schools close where there is fighting, budgets decide afford and durability.
  add('health.outcomes', 'Clinics with electricity', (s.nation.power - 35) * 0.15);
  add('power.reliability', 'Generation and the grid', (s.nation.power - 35) * 0.5);
  add('edu.access', 'Schools closed by fighting', -Math.max(0, (s.theatres.NE + s.theatres.NW) / 2 - 55) * 0.4);
  add('durable', 'The budget behind them', clamp((s.nation.fiscalSpace - 0.5) * 6, -10, 8) - Math.max(0, s.nation.debt - 80) * 0.15);
  add('afford', 'Prices', -(s.nation.inflation - 15) * 0.4);
  for (const d of Object.keys(out) as ServiceDim[]) out[d].v = clamp(Math.round(out[d].v), 0, 100);
  return out;
}

const reformTitle = (id: string) => reformName(null, id);

/** The reforms in force whose approach has a known way of failing, and whether it is failing now. */
export function serviceRisks(s: GameState): { id: string; text: string; failing: boolean }[] {
  return s.agenda.done.filter((id) => SERVICE_EFFECTS[id]?.risk || SERVICE_EFFECTS[id]?.funded).map((id) => {
    const e = SERVICE_EFFECTS[id];
    const failing = e.funded ? adequacy(s, id) < 0.7 : id === 'm11' ? (s.debts.contractors > 1 || s.nation.fiscalSpace < 0.1) : (e.reach ?? 0) < 0 && fortune(s, 'trader').v < 45;
    return { id, text: failing ? (e.funded?.failure ?? e.risk!) : (e.risk ?? `Holds while it is funded. ${e.funded!.failure}`), failing };
  });
}

/** Who the services reach: positive, the poorer; negative, the better-off. */
export function reach(s: GameState): number {
  return s.agenda.done.reduce((a, id) => a + (SERVICE_EFFECTS[id]?.reach ?? 0) * adequacy(s, id), 0);
}

// ---------------------------------------------------------------- groups

/** A group's fortune this month, 0–100, and every reason. */
export function fortune(s: GameState, g: Group): { v: number; lines: { label: string; value: number }[] } {
  const def = GROUP_BY_ID[g];
  const lines = [{ label: 'An ordinary year', value: def.base }];
  for (const d of def.drivers) {
    let x = (read(s, d.path) - d.from) * d.per;
    if (d.max !== undefined) x = clamp(x, -d.max, d.max);
    if (Math.abs(x) >= 0.5) lines.push({ label: d.label, value: Math.round(x) });
  }
  for (const id of def.assets ?? []) {
    const a = assets(s).find((x) => x.id === id);
    if (a) lines.push({ label: `${ASSETS[id].name}`, value: Math.round(4 * assetPerformance(s, id).k) });
  }
  const org = ensureSociety(s).organised[g] ?? 0;
  if (org) lines.push({ label: 'Organised: they bargain together', value: org });
  return { v: clamp(Math.round(lines.reduce((a, l) => a + l.value, 0)), 0, 100), lines };
}

/** Reads the game, including service dimensions. */
function read(s: GameState, path: string): number {
  if (path.startsWith('svc.')) return services(s)[path.slice(4) as ServiceDim]?.v ?? 0;
  return getVar(s, path);
}

/** National output: what the country produces, apart from who gets it. */
export function output(s: GameState): number {
  const n = s.nation;
  return Math.round((n.jobs + n.power + n.capacity) / 3);
}

/** Groups losing ground while the country gains, with the reason that hurts most. */
export function leftBehind(s: GameState): { group: Group; name: string; fell: number; why: string }[] {
  const soc = ensureSociety(s);
  const national = soc.output.length >= 6 ? soc.output[soc.output.length - 1] - soc.output[0] : 0;
  if (national <= 0) return [];
  return GROUPS.map((g) => {
    const h = soc.hist[g.id] ?? [];
    const fell = h.length >= 6 ? h[0] - h[h.length - 1] : 0;
    const worst = fortune(s, g.id).lines.slice(1).sort((a, b) => a.value - b.value)[0];
    return { group: g.id, name: g.name, fell, why: worst && worst.value < 0 ? worst.label : 'Others have gained more' };
  }).filter((x) => x.fell >= 3);
}

/** The gap between the best-off and the worst-off groups, weighted by how many people are in each. */
export function inequality(s: GameState): number {
  const f = GROUPS.map((g) => ({ v: fortune(s, g.id).v, w: g.size }));
  const mean = f.reduce((a, x) => a + x.v * x.w, 0) / f.reduce((a, x) => a + x.w, 0);
  return Math.round(Math.sqrt(f.reduce((a, x) => a + x.w * (x.v - mean) ** 2, 0) / f.reduce((a, x) => a + x.w, 0)));
}

// ---------------------------------------------------------------- what citizens do

/** What an act does beyond the citizen: to their group, their zone, and the country. */
function actEffects(s: GameState, c: Citizen, act: Act): void {
  const soc = ensureSociety(s);
  const z = c.zone as ZoneId;
  switch (act) {
    case 'organise':
      soc.organised[c.group] = Math.min(3, (soc.organised[c.group] ?? 0) + 1);
      if (['salaried', 'health', 'transport', 'pensioner'].includes(c.group)) applyFx(s, ['pressure.wageGrievance', 2]);
      if (c.group === 'manufacturer' || c.group === 'graduate') applyFx(s, ['bloc.establishment', 1]);
      break;
    case 'petition':
      applyFx(s, ['bloc.press', 0.5]);
      applyFx(s, [`zone.${z}.approval`, -0.3]);
      break;
    case 'relocate':
      applyFx(s, [`zone.${z}.approval`, -0.5]);
      // Those who leave the country take their skills with them.
      if (c.group === 'graduate' || c.group === 'health') applyFx(s, ['nation.capacity', -0.3]);
      if (c.group === 'trader' || c.group === 'importer') applyFx(s, ['nation.jobs', -0.2]);
      break;
    case 'switch':
      if (c.group === 'manufacturer') applyFx(s, ['nation.jobs', -0.4]);
      if (c.group === 'fisher') applyFx(s, ['theatre.SS', 1]);
      if (c.group === 'salaried') applyFx(s, ['nation.capacity', -0.2]);
      break;
    case 'support':
      applyFx(s, [`zone.${z}.approval`, -1]);
      s.counters['opposition.recruits'] = (s.counters['opposition.recruits'] ?? 0) + 1;
      break;
  }
}

/** Monthly: fortunes are recorded, citizens act on their circumstances, constituencies form and press. */
export function societyTick(s: GameState): void {
  const soc = ensureSociety(s);
  for (const g of GROUPS) {
    const h = (soc.hist[g.id] ??= []);
    h.push(fortune(s, g.id).v);
    if (h.length > 12) h.shift();
  }
  soc.output.push(output(s));
  if (soc.output.length > 12) soc.output.shift();
  // A citizen acts when their circumstances call for it, at most once a year for each kind of act.
  for (const c of CITIZENS) for (const r of c.responses) {
    if (!test(s, r.when)) continue;
    const last = soc.acts.filter((a) => a.who === c.id && a.act === r.act).pop();
    if (last && s.turn - last.turn < 12) continue;
    soc.acts.push({ who: c.id, act: r.act, text: r.text, turn: s.turn });
    actEffects(s, c, r.act);
    s.news.push({ chronicle: `${c.name.toUpperCase()}, ${c.work.toUpperCase()}: ${r.act === 'relocate' ? 'LEAVING' : r.act === 'organise' ? 'ORGANISING' : r.act === 'petition' ? 'PETITIONING' : r.act === 'switch' ? 'CHANGING WORK' : 'BACKING THE OPPOSITION'}`, street: r.text.toUpperCase().slice(0, 80), weight: 2, valence: -1, topic: 'people', body: r.text });
  }
  if (soc.acts.length > 80) soc.acts.splice(0, soc.acts.length - 80);
  // Development creates constituencies. Once formed, they persist and press for what they want.
  for (const k of CONSTITUENCIES) {
    if (soc.constituencies[k.id] === undefined && test(s, k.emerge)) {
      soc.constituencies[k.id] = s.turn;
      s.report.push({ kind: 'consequence', title: `A new constituency: ${k.name}`, text: `${k.because} They want: ${k.wants}`, changes: [] });
    }
    if (soc.constituencies[k.id] !== undefined && !test(s, k.satisfied)) for (const f of k.pressure) applyFx(s, f);
  }
}

// ---------------------------------------------------------------- what kind of country it is becoming

export interface Profile { id: 'wealthy-unequal' | 'capable-central' | 'decentralised' | 'open' | 'stalled'; name: string; text: string; score: number }

/** Several legitimate outcomes, each with its own measure; none is the single right answer. */
export function profiles(s: GameState): Profile[] {
  const n = s.nation;
  const devolved = (s.agenda.done.includes('t5') ? 1 : 0) + (s.agenda.done.includes('s4') ? 1 : 0) + (s.flags['constitution.clause'] === 'devolve' ? 1 : 0) + (s.agenda.done.includes('p4') ? 1 : 0);
  const central = (s.agenda.done.includes('x12') ? 1 : 0) + (s.agenda.done.includes('p15') ? 1 : 0);
  const open = (s.agenda.done.includes('c8') ? 1 : 0) + (s.flags['constitution.clause'] === 'recall' ? 1 : 0) + (s.flags['diaspora.vote'] ? 1 : 0);
  const list: Profile[] = [
    { id: 'wealthy-unequal', name: 'Wealthier, and unequal', text: 'Output has grown faster than its reach: the country is richer and some groups are no better off.', score: (output(s) - 40) + (inequality(s) - 10) },
    { id: 'capable-central', name: 'A capable centre', text: 'Federal institutions that work and decide: strong capacity, central revenue and command.', score: (n.capacity - 40) + central * 6 - devolved * 3 },
    { id: 'decentralised', name: 'Decentralised', text: 'States that collect, police and power themselves: more done close to home, more variation between states.', score: devolved * 7 + (n.capacity - 40) * 0.3 },
    { id: 'open', name: 'Politically open', text: 'Honest money in politics, voters with more ways to be heard, a press that is believed.', score: (n.integrity - 35) + open * 6 + (s.blocs.press - 50) * 0.3 },
  ];
  const best = Math.max(...list.map((p) => p.score));
  return best < 8 ? [{ id: 'stalled', name: 'Not yet becoming anything', text: 'No direction has taken hold: the country is much as it was.', score: best }, ...list] : list.sort((a, b) => b.score - a.score);
}

// Readings for conditions: group.<id>, svc.<dim>, assets.industry, society.unequal.
hooks.society = (s, p) => {
  if (p[0] === 'group') return fortune(s, p[1] as Group).v;
  if (p[0] === 'svc') return services(s)[p.slice(1).join('.') as ServiceDim]?.v ?? 0;
  if (p[0] === 'assets' && p[1] === 'industry') return assets(s).filter((a) => ['steel', 'smelter', 'car', 'petrochem', 'refinery', 'refinery_delta', 'refinery_kaduna', 'lithium'].includes(a.id)).length;
  if (p[0] === 'unequal') return inequality(s);
  if (p[0] === 'constituency') return ensureSociety(s).constituencies[p[1]] !== undefined ? 1 : 0;
  return 0;
};
