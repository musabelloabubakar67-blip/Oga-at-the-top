// The books: what the country owes, what it has saved, what oil is paying,
// and how the year's budget is divided. This replaces the single debt number.

import { MILESTONE_BY_ID } from '../content/agenda';
import { BENCHMARKS, DEBTS, DEBT_BY_ID, FUND_BY_ID, SECTORS, SECTOR_BY_ID } from '../content/treasury';
import { PEOPLE } from '../content/people';
import { CFG, monthOf, yearOf } from './config';
import { ARREARS, addOwed, rateOf, servicePoints, syncDebt } from './ledger';
import { policyFiscalLines } from './policies';
import { institutionFiscalLines } from './institutions';
import { assetFiscalLines } from './places';
import { personView } from './people';
import { logOilForecast, oilForecastTick } from './oilforecast';
import { fxScale } from './currency';
import { nonOilPoints, oilWeight } from './dependence';
import { rand } from './rng';
import type { DebtId, FundId, GameState, SectorId, ZoneId } from './types';
import { ZONES, applyFx, clamp, hardship, senate, shiftThreat, syncSecurity } from './vars';

export { rateOf, servicePoints, syncDebt };

const round = (x: number) => Math.round(x * 1000) / 1000;

export function usualBudget(): Record<SectorId, number> {
  return Object.fromEntries(SECTORS.map((x) => [x.id, x.usual])) as Record<SectorId, number>;
}

export function initTreasury(s: GameState): void {
  s.debts = Object.fromEntries(DEBTS.map((d) => [d.id, d.start])) as Record<DebtId, number>;
  s.funds = { abroad: 0, buffer: 0.3, infra: 0, growth: 0 };
  s.oil = { price: 74, output: 1.75, prev: 74 };
  s.budget = { year: s.startYear, benchmark: 70, alloc: usualBudget(), due: false };
  syncDebt(s);
}

// ---------------------------------------------------------------- oil

/** Barrels a day, in millions. Theft in the creeks comes straight off the top. */
export function oilOutput(s: GameState): number {
  return clamp(1.95 - (s.theatres.SS - 40) * 0.012, 0.9, 2.1);
}

/** What oil is paying against what the budget assumed, ₦tn a month. Positive is saved; negative comes out of the treasury. */
export function oilGap(s: GameState): number {
  // The less the budget leans on oil, the less its price moves the treasury, either way.
  return ((s.oil.price * s.oil.output) / 1.75 - s.budget.benchmark) * 0.0035 * oilWeight(s);
}

function oilTick(s: GameState): void {
  s.oil.prev = s.oil.price;
  const level = s.oil.path?.find(([until]) => s.turn <= until)?.[1] ?? 72;
  let p = s.oil.price + (level - s.oil.price) * 0.07 + (rand(s) * 2 - 1) * 4.5;
  // Now and then the market moves for reasons that have nothing to do with you.
  if (rand(s) < 0.04) {
    const up = rand(s) < 0.45;
    p += up ? 16 : -18;
    s.news.push(up
      ? { chronicle: `OIL JUMPS TO $${Math.round(p)} ON SUPPLY FEARS`, street: `OIL DON CLIMB REACH $${Math.round(p)}. MONEY DEY COME?`, weight: 3, valence: 1, topic: 'oil', body: `Crude rose sharply this month. The budget assumed $${s.budget.benchmark}; anything above it is paid into the stabilisation account.` }
      : { chronicle: `OIL SLUMPS TO $${Math.round(p)}; BUDGET ASSUMED $${s.budget.benchmark}`, street: `OIL PRICE DON FALL REACH $${Math.round(p)}. WAHALA`, weight: 3.5, valence: -1, topic: 'oil', body: `Crude fell sharply this month. Every dollar below the $${s.budget.benchmark} the budget assumed comes out of the treasury.` });
  }
  s.oil.price = clamp(p, 35, 125);
  s.oil.output = oilOutput(s);
  oilForecastTick(s);
}

// ---------------------------------------------------------------- the monthly flow

export interface FlowLine { label: string; value: number; hint: string }

/** Where the treasury's money comes from and goes each month, itemised. */
export function fiscalFlow(s: GameState): { lines: FlowLine[]; total: number; saved: number } {
  const e = CFG.economy;
  const n = s.nation;
  const subsidy = String(s.flags['policy.subsidy'] ?? 'partial');
  const lines: FlowLine[] = [];
  const add = (label: string, value: number, hint: string) => { if (Math.abs(value) >= 0.0005) lines.push({ label, value, hint }); };

  add('Running the government', e.fiscalBase, 'Salaries and overheads, against ordinary revenue.');
  // The gap between the pump price and the cost of fuel moves with the price of crude.
  const crude = s.oil.price / 72;
  const subsidyNow = (e.subsidyDrift[subsidy] ?? 0) * crude * (subsidy === 'removed' ? 1 : fxScale(s));
  add(subsidy === 'removed' ? 'No petrol subsidy to pay' : 'The petrol subsidy', subsidyNow,
    subsidy === 'removed' ? `What ending the subsidy freed, at $${Math.round(s.oil.price)} oil.` : `The gap between the pump price and the cost, paid monthly. Dearer as crude rises: $${Math.round(s.oil.price)} now.`);
  add('Oil revenue at this year\'s exchange rate', (fxScale(s) - 1) * 0.08, 'Oil is sold in dollars. A naira that has fallen further than inflation explains turns each dollar into more naira; one that has held does the opposite.');
  add('Debt service', -(n.debt - 66) * e.debtToFiscal, 'Against the 66% of revenue you inherited. Each point retired is worth about ₦36bn a year.');
  add('Tax collection', (n.capacity - 34) * e.capacityToFiscal, 'A state that works collects what it is owed. Rises with state capacity.');
  add('Leakage', (n.integrity - 28) * e.integrityToFiscal, 'Less is stolen as integrity rises.');
  add('Industry and jobs', (n.jobs - 34) * e.jobsToFiscal, 'Factories and payrolls pay tax.');
  add('The Finance Minister', ((s.chars.fin?.competence ?? 3) - 3) * 0.012, 'A competent one finds money. A weak one loses it.');
  add('Your reforms and orders', s.counters['bonus.fiscal'] ?? 0, 'The permanent effect of what you have built, cut or promised.');
  for (const l of policyFiscalLines(s)) add(l.label, l.value, l.hint);
  for (const l of institutionFiscalLines(s)) add(l.label, l.value, l.hint);
  for (const l of assetFiscalLines(s)) add(l.label, l.value, l.hint);
  add('The insurgency', -Math.max(0, s.theatres.NE - 50) * 0.0009, 'The war in the North East is paid for every month.');
  const points = s.budget.points ?? (BENCHMARKS.find((b) => b.price === s.budget.benchmark)?.points ?? 10);
  const spare = points - SECTORS.reduce((a, x) => a + (s.budget.alloc[x.id] ?? 0), 0);
  add('Unallocated in the budget', spare * 0.02, 'Budget points you chose not to spend.');
  const rel = releaseFiscal(s);
  if (Math.abs(rel) >= 0.0005) add('Budget not yet released', rel, 'Increases the ministries have not spent stay in the treasury; money you rushed out cost a premium.');
  const gap = oilGap(s);
  if (gap < 0) add('Oil below the benchmark', gap, `Oil is paying less than the $${s.budget.benchmark} the budget assumed.`);
  // Revenue belongs to the federation, not to Abuja. Once the centre is comfortably in surplus, the states take most of the rest.
  const raw = lines.reduce((a, l) => a + l.value, 0);
  const keep = CFG.economy.federalKeep;
  if (raw > keep.above) add('The states\' share of the surplus', -(raw - keep.above) * (1 - keep.share), `Above ₦${Math.round(keep.above * 1000)}bn a month, the states take ${Math.round((1 - keep.share) * 100)}% of every extra naira.`);
  const total = lines.reduce((a, l) => a + l.value, 0);
  return { lines, total, saved: Math.max(0, gap) };
}

// ---------------------------------------------------------------- the budget

/** The minister who spends each sector's money, and so decides how much of it is spent. */
export const SECTOR_MINISTER: Partial<Record<SectorId, string>> = { security: 'min_defence', power: 'min_works', people: 'min_service', agric: 'min_agric' };

const STEP = [1, 0.7, 0.5, 0.35, 0.25, 0.2];
/** Each point above last year's level does less than the one before. Cuts bite in full. */
export function effectiveIncrease(d: number): number {
  if (d <= 0) return d;
  let v = 0;
  for (let i = 0; i < d; i++) v += STEP[Math.min(i, STEP.length - 1)];
  return v;
}

/** How much a point does this year: money goes further where the problem is worse. */
export function potency(s: GameState, id: SectorId): { k: number; why: string } {
  const worst = Math.max(...ZONES.map((z) => s.theatres[z]));
  const r = (x: number) => Math.round(clamp(x, 0.6, 1.4) * 100) / 100;
  switch (id) {
    case 'security': return { k: r(0.6 + worst / 100), why: `The worst theatre is at ${Math.round(worst)}` };
    case 'power': return { k: r(1.4 - s.nation.power / 100), why: `Power is at ${Math.round(s.nation.power)}` };
    case 'people': return { k: r(0.7 + s.pressures.wageGrievance / 100), why: `Labour anger is at ${Math.round(s.pressures.wageGrievance)}` };
    case 'agric': return { k: r(0.6 + s.nation.inflation / 40), why: `Inflation is ${Math.round(s.nation.inflation)}%` };
    default: return { k: 1, why: '' };
  }
}

/** How much of each sector's increase actually leaves the treasury: the minister's competence, the cash in hand, and your instruction. */
export function releaseRate(s: GameState, id: SectorId): { rate: number; why: string[] } {
  const why: string[] = [];
  if (id === 'debt' || id === 'padding') return { rate: 1, why: [id === 'debt' ? 'Debt service is paid by the Debt Office, in full' : 'Members\' projects are always released'] };
  let rate = 0.85;
  const min = SECTOR_MINISTER[id];
  if (min) {
    const v = personView(s, min);
    const comp = v.competence ?? 3;
    rate = clamp(0.45 + 0.12 * comp, 0.4, 1.05);
    why.push(`${v.name}, competence ${comp}`);
  }
  if (s.nation.fiscalSpace < 0.3) { rate *= 0.7; why.push('There is almost no cash: releases are rationed'); }
  const mode = s.budget.release?.[id] ?? 'normal';
  if (mode === 'full') { rate = 1; why.push('You ordered it released in full'); }
  if (mode === 'hold') { rate *= 0.5; why.push('You are holding half of it back'); }
  return { rate: Math.round(clamp(rate, 0, 1) * 100) / 100, why };
}

/** Inflation eats the budget: every 8 points of inflation above 18% costs a point to spend, up to three. */
export function erosion(s: GameState): number {
  return clamp(Math.ceil((s.nation.inflation - 18) / 8), 0, 3);
}

export function budgetPoints(benchmark: number, s?: GameState): number {
  return (BENCHMARKS.find((b) => b.price === benchmark)?.points ?? 10) - (s ? erosion(s) - nonOilPoints(s) : 0);
}

/** The monthly effect of a sector's allocation this year, before the instruction on releases changes it. */
function sectorDelta(s: GameState, id: SectorId, held: boolean): number {
  const raw = (s.budget.alloc[id] ?? 0) - SECTOR_BY_ID[id].usual;
  if (raw > 0) return held ? 0 : effectiveIncrease(raw) * potency(s, id).k * releaseRate(s, id).rate;
  return raw * potency(s, id).k;
}

/** What each sector does, every month, for the year. */
function budgetTick(s: GameState): void {
  const months = s.turn - (s.counters.budgetTurn ?? 0);
  const held = !!s.budget.late && months <= 3;
  const d = (id: SectorId) => sectorDelta(s, id, held);
  for (const z of ZONES) shiftThreat(s, z, -0.07 * d('security'));
  s.nation.power = clamp(s.nation.power + 0.07 * d('power'), 0, 100);
  s.nation.jobs = clamp(s.nation.jobs + 0.025 * d('power'), 0, 100);
  s.blocs.street = clamp(s.blocs.street + 0.12 * d('people'), 0, 100);
  s.pressures.wageGrievance = clamp(s.pressures.wageGrievance - 0.2 * d('people'), 0, 100);
  if (s.budget.alloc.debt > 0 && !held) addOwed(s, 'bonds', -0.02 * s.budget.alloc.debt);
  const pad = d('padding');
  for (const p of PEOPLE) {
    if (p.group !== 'senator') continue;
    const st = s.people[p.id];
    if (st && !st.gone) st.rel = clamp(st.rel + 0.2 * pad, 0, 100);
  }
  if (pad > 0) s.nation.integrity = clamp(s.nation.integrity - 0.05 * pad, 0, 100);
  // Works money is spent somewhere. Where it goes above an even share, the zone notices; where it goes below, so does that one.
  const sites = s.budget.sites;
  if (sites && !held) {
    const total = ZONES.reduce((a, z) => a + (sites[z] ?? 0), 0);
    const rate = releaseRate(s, 'power').rate;
    for (const z of ZONES) {
      const tilt = (sites[z] ?? 0) - total / 6;
      if (Math.abs(tilt) < 0.01) continue;
      s.zones[z].approval = clamp(s.zones[z].approval + 0.1 * tilt * rate, 0, 100);
      const gov = PEOPLE.find((p) => p.group === 'governor' && p.zone === z);
      if (gov && s.people[gov.id] && !s.people[gov.id].gone) s.people[gov.id].rel = clamp(s.people[gov.id].rel + 0.15 * tilt, 0, 100);
    }
  }
  // Rushing money out the door costs integrity: procurement is skipped.
  const rushed = SECTORS.filter((x) => s.budget.release?.[x.id] === 'full' && (s.budget.alloc[x.id] ?? 0) > x.usual).length;
  if (rushed) s.nation.integrity = clamp(s.nation.integrity - 0.02 * rushed, 0, 100);
}

/** Cash effects of releases: unreleased increases stay in the treasury; rushing them costs a premium. */
export function releaseFiscal(s: GameState): number {
  let v = 0;
  for (const x of SECTORS) {
    const up = (s.budget.alloc[x.id] ?? 0) - x.usual;
    if (up <= 0) continue;
    const r = releaseRate(s, x.id).rate;
    v += up * (1 - r) * 0.02;
    if (s.budget.release?.[x.id] === 'full') v -= up * 0.006;
  }
  return v;
}

/** How far farming money moves the inflation the economy is heading for. */
export function budgetInflation(s: GameState): number {
  return -0.35 * sectorDelta(s, 'agric', !!s.budget.late && s.turn - (s.counters.budgetTurn ?? 0) <= 3);
}

/** What the Appropriations Committee will insert for members' projects: more when the Senate is not yours and the chairman is not your friend. */
export function paddingDemand(s: GameState): number {
  const chair = s.people.sen_approp;
  const rel = chair?.rel ?? 50;
  return clamp(2 + (senate(s) < 50 ? 1 : 0) + (rel < 45 ? 1 : 0) - (rel >= 70 ? 1 : 0), 1, 5);
}

export function canBudget(s: GameState, benchmark: number, alloc: Record<SectorId, number>): { ok: boolean; reason?: string } {
  if (!s.budget.due) return { ok: false, reason: 'There is no bill on the desk.' };
  if (s.budget.pending) return { ok: false, reason: 'The Assembly has sent back its version.' };
  if (!BENCHMARKS.some((b) => b.price === benchmark)) return { ok: false };
  let sum = 0;
  for (const x of SECTORS) {
    const v = alloc[x.id] ?? 0;
    if (v < 0 || v > x.max || !Number.isInteger(v)) return { ok: false, reason: `${x.name}: between 0 and ${x.max}.` };
    sum += v;
  }
  if (sum > budgetPoints(benchmark, s)) return { ok: false, reason: 'You have allocated more than the budget holds.' };
  return { ok: true };
}

/** The Assembly's version: your bill, with members' projects raised to what the committee wants, paid for out of your largest lines. */
export function amend(s: GameState, alloc: Record<SectorId, number>): { amended: Record<SectorId, number>; insert: number; cut: [SectorId, number][] } {
  const demand = paddingDemand(s);
  const insert = Math.max(0, demand - (alloc.padding ?? 0));
  const amended = { ...alloc };
  const cut: Record<string, number> = {};
  let need = insert;
  amended.padding = (amended.padding ?? 0) + insert;
  while (need > 0) {
    const from = SECTORS.filter((x) => x.id !== 'padding' && (amended[x.id] ?? 0) > 0).sort((a, b) => (amended[b.id] ?? 0) - (amended[a.id] ?? 0))[0];
    if (!from) break;
    amended[from.id] -= 1;
    cut[from.id] = (cut[from.id] ?? 0) + 1;
    need -= 1;
  }
  return { amended, insert, cut: Object.entries(cut) as [SectorId, number][] };
}

/** Sending the bill to the Assembly. If it asks for nothing more, it is law; otherwise its version comes back. */
export function setBudget(s: GameState, benchmark: number, alloc: Record<SectorId, number>, sites?: Partial<Record<ZoneId, number>>): string {
  const a = amend(s, alloc);
  const points = budgetPoints(benchmark, s);
  if (a.insert === 0) return enact(s, benchmark, alloc, sites, points, 'clean');
  s.budget.pending = { benchmark, alloc: { ...alloc }, amended: a.amended, insert: a.insert, sites: sites ? { ...sites } : undefined, points };
  return `The Assembly sends the bill back with ${a.insert} more ${a.insert === 1 ? 'point' : 'points'} for members' projects, taken from ${a.cut.map(([id, n]) => `${SECTOR_BY_ID[id].name.toLowerCase()} (${n})`).join(' and ')}. Sign their version, veto it, or split the difference.`;
}

export type BudgetChoice = 'accept' | 'veto' | 'split';

/** What each answer to the Assembly would do, for display before choosing. */
export function vetoHolds(s: GameState): boolean { return senate(s) >= 54; }

export function resolveBudget(s: GameState, choice: BudgetChoice): string {
  const p = s.budget.pending;
  if (!p) return '';
  const chair = s.people.sen_approp;
  if (choice === 'accept') {
    if (chair) chair.rel = clamp(chair.rel + 4, 0, 100);
    applyFx(s, ['nation.integrity', -1]);
    return enact(s, p.benchmark, p.amended, p.sites, p.points, 'accepted');
  }
  if (choice === 'split') {
    const half = Math.ceil(p.insert / 2);
    const mid = amendBy(p.alloc, half);
    applyFx(s, ['pc', -4]);
    if (chair) chair.rel = clamp(chair.rel - 2, 0, 100);
    return enact(s, p.benchmark, mid, p.sites, p.points, 'split');
  }
  if (chair) chair.rel = clamp(chair.rel - 7 * p.insert, 0, 100);
  if (vetoHolds(s)) {
    applyFx(s, ['nation.integrity', 1.5]);
    applyFx(s, ['bloc.press', 3]);
    return enact(s, p.benchmark, p.alloc, p.sites, p.points, 'veto');
  }
  const text = enact(s, p.benchmark, p.alloc, p.sites, p.points, 'stalled');
  s.budget.late = true;
  applyFx(s, ['nation.capacity', -1.5]);
  applyFx(s, ['bloc.establishment', -3]);
  applyFx(s, ['nation.integrity', 1]);
  return text;
}

function amendBy(alloc: Record<SectorId, number>, n: number): Record<SectorId, number> {
  const out = { ...alloc };
  out.padding = (out.padding ?? 0) + n;
  for (let i = 0; i < n; i++) {
    const from = SECTORS.filter((x) => x.id !== 'padding' && (out[x.id] ?? 0) > 0).sort((a, b) => (out[b.id] ?? 0) - (out[a.id] ?? 0))[0];
    if (from) out[from.id] -= 1;
  }
  return out;
}

const CUT_FX: Partial<Record<SectorId, [string, number][]>> = {
  people: [['bloc.street', -3], ['pressure.wageGrievance', 4]],
  security: [['bloc.establishment', -2], ['bloc.villa', -1]],
  agric: [['zone.NW.approval', -1], ['zone.NC.approval', -1]],
  power: [['bloc.establishment', -1], ['bloc.party', -1]],
};

/** The bill becomes law. Last year's levels are what people now expect: cutting below them is noticed, and each sector's minister reacts. */
function enact(s: GameState, benchmark: number, alloc: Record<SectorId, number>, sites: Partial<Record<ZoneId, number>> | undefined, points: number, how: 'clean' | 'accepted' | 'split' | 'veto' | 'stalled'): string {
  const prev = { ...s.budget.alloc };
  const supplementary = s.budget.supplementary;
  const sameYear = !!s.budget.reopened;
  s.budget = {
    year: sameYear ? s.budget.year : yearOf(s.turn, s.startYear) + 1, benchmark, alloc: { ...alloc }, due: false, late: false,
    prevAlloc: prev, sites: sites ? fitSites(sites, alloc.power ?? 0) : evenSites(alloc.power ?? 0), points, release: {}, supplementary,
  };
  s.counters.budgetTurn = s.turn;
  s.flags['budget.how'] = how;
  logOilForecast(s);
  const cuts: string[] = [];
  for (const x of SECTORS) {
    const was = prev[x.id] ?? x.usual;
    const now = alloc[x.id] ?? 0;
    if (now < was && CUT_FX[x.id]) { for (const f of CUT_FX[x.id]!) applyFx(s, [f[0], f[1] * (was - now)]); cuts.push(x.name.toLowerCase()); }
    const min = SECTOR_MINISTER[x.id];
    if (min && s.people[min] && !s.people[min].gone && now !== was) s.people[min].rel = clamp(s.people[min].rel + (now > was ? 4 : -5) * Math.abs(now - was), 0, 100);
  }
  const cutLine = cuts.length ? ` Cut below last year: ${cuts.join(', ')}. The people who depended on it have noticed.` : '';
  const yr = s.budget.year;
  const say: Record<typeof how, string> = {
    clean: `The Appropriation Act for ${yr} passes as sent. The Assembly's projects are in it, as agreed.`,
    accepted: `You sign the Assembly's version of the ${yr} budget, insertions and all.`,
    split: `You and the committee meet halfway. The ${yr} budget carries half the insertions it asked for.`,
    veto: `You veto the Assembly's version. Your senators sustain the veto and pass your bill. Senator Zango has made a note.`,
    stalled: `You veto the Assembly's version and the Senate will not pass yours. The bill sits in committee until March: nothing above last year's level is released for three months.`,
  };
  const text = say[how] + cutLine;
  s.news.push(how === 'stalled'
    ? { chronicle: 'BUDGET STALLS IN SENATE OVER CONSTITUENCY PROJECTS', street: 'SENATORS HOLD BUDGET: "WHERE OUR OWN?"', weight: 5, valence: -1, topic: 'politics', about: 'sen_approp', body: text }
    : { chronicle: `PRESIDENT SIGNS ${yr} BUDGET; OIL BENCHMARK $${benchmark}${how === 'accepted' ? ' WITH ASSEMBLY INSERTIONS' : ''}`, street: `BUDGET ${yr} DON LAND. OIL BENCHMARK NA $${benchmark}`, weight: 4.5, valence: 0, topic: 'money', body: text });
  return text;
}

/** Works points sited to match the works line: the Assembly's cuts come out of the zone with the most. */
export function fitSites(sites: Partial<Record<ZoneId, number>>, n: number): Partial<Record<ZoneId, number>> {
  const out = { ...sites };
  const sum = () => ZONES.reduce((a, z) => a + (out[z] ?? 0), 0);
  while (sum() > n) { const z = [...ZONES].sort((a, b) => (out[b] ?? 0) - (out[a] ?? 0))[0]; out[z] = (out[z] ?? 0) - 1; }
  while (sum() < n) { const z = [...ZONES].sort((a, b) => (out[a] ?? 0) - (out[b] ?? 0))[0]; out[z] = (out[z] ?? 0) + 1; }
  return out;
}

export function evenSites(points: number): Partial<Record<ZoneId, number>> {
  const out: Partial<Record<ZoneId, number>> = {};
  ZONES.forEach((z, i) => { out[z] = Math.floor(points / 6) + (i < points % 6 ? 1 : 0); });
  return out;
}

export function setRelease(s: GameState, id: SectorId, mode: 'normal' | 'full' | 'hold'): void {
  (s.budget.release ??= {})[id] = mode;
}

/** When oil has moved $12 or more from what the budget assumed, the budget can be reopened once a year. */
export function canSupplementary(s: GameState): { ok: boolean; reason?: string } {
  if (s.budget.due) return { ok: false, reason: 'A bill is already on the desk.' };
  if (s.budget.supplementary === s.budget.year) return { ok: false, reason: 'Already reopened once this year.' };
  if (s.turn - (s.counters.budgetTurn ?? 0) < 3) return { ok: false, reason: 'Too soon after it was signed.' };
  if (Math.abs(s.oil.price - s.budget.benchmark) < 12) return { ok: false, reason: `Oil is within $12 of the $${s.budget.benchmark} the budget assumed.` };
  if (s.pc < 4) return { ok: false, reason: 'Needs 4 political capital.' };
  return { ok: true };
}

export function supplementary(s: GameState): string {
  s.pc = clamp(s.pc - 4, 0, 100);
  s.budget.supplementary = s.budget.year;
  s.budget.reopened = true;
  s.budget.due = true;
  return `A supplementary budget for ${s.budget.year} goes to the Assembly. Set a new oil price and divide the money again. The committee will want its share again.`;
}

// ---------------------------------------------------------------- paying what is owed

export function canPay(s: GameState, id: DebtId, amount: number): { ok: boolean; reason?: string } {
  const owed = s.debts[id];
  if (owed <= 0.001) return { ok: false, reason: 'Nothing is owed.' };
  if (amount <= 0) return { ok: false };
  if (s.nation.fiscalSpace < Math.min(amount, owed) - 0.001) return { ok: false, reason: 'The treasury does not hold that much. Debts are paid in cash, not with more debt.' };
  return { ok: true };
}

/** Pays a creditor from the treasury. Returns what it did, for the record. */
export function pay(s: GameState, id: DebtId, amount: number): string {
  const def = DEBT_BY_ID[id];
  const before = s.debts[id];
  const paid = Math.min(amount, before);
  s.nation.fiscalSpace -= paid;
  addOwed(s, id, -paid);
  const cleared = s.debts[id] <= 0.001;
  if (id === 'gas' && cleared) return clearGas(s);
  if (id === 'contractors' && before > 0.5 && s.debts[id] <= 0.5) return contractorsBack(s);
  if (id === 'pensions' && cleared) return pensionsPaid(s);
  if (def.kind === 'bond') {
    if (id === 'ways') return 'The overdraft at the central bank is paid down. Less new money is chasing the same goods, and prices will show it within the quarter.';
    applyFx(s, ['bloc.establishment', paid >= 1 ? 2 : 1]);
    return id === 'eurobond'
      ? 'The Debt Office buys back foreign bonds in the market. Fewer dollars leave the country every quarter from now on.'
      : 'Domestic bonds are retired early. The banks have a little more to lend to somebody else.';
  }
  return `${def.name}: part of what is owed has been paid. The rest is still doing its damage.`;
}

function clearGas(s: GameState): string {
  // Paying the gas suppliers is the first reform on the power track, however it is done.
  if (!s.agenda.done.includes('p1')) {
    s.agenda.active = s.agenda.active.filter((a) => a.id !== 'p1');
    s.agenda.done.push('p1');
    for (const fx of MILESTONE_BY_ID.p1?.m.done ?? []) applyFx(s, fx);
    s.news.push({ chronicle: 'IDLE POWER PLANTS RETURN AS FG CLEARS GAS DEBT', street: 'GOVERNMENT PAY GAS DEBT. LIGHT DON IMPROVE', weight: 6, valence: 1, topic: 'power', about: 'min_power', body: 'The gas suppliers have been paid in full. Plants that stood idle for want of fuel are generating again.' });
    return 'The gas suppliers are paid in full. Plants that stood idle for want of fuel come back within weeks. The debt will build again for as long as electricity is sold for less than it costs.';
  }
  applyFx(s, ['nation.power', 3]);
  return 'The gas suppliers are paid again. The plants keep running.';
}

function contractorsBack(s: GameState): string {
  if (s.turn - (s.counters.contractorsBack ?? -99) >= 12) {
    s.counters.contractorsBack = s.turn;
    applyFx(s, ['nation.jobs', 3]);
    applyFx(s, ['bloc.establishment', 5]);
    applyFx(s, ['nation.capacity', 1.5]);
    s.news.push({ chronicle: 'CONTRACTORS RETURN TO SITE AS FG CLEARS ARREARS', street: 'CONTRACTORS DON COLLECT. WORK DON START AGAIN', weight: 5, valence: 1, topic: 'money', about: 'min_works', body: 'Certificates up to six years old have been honoured. Sites abandoned under the last administration are staffed again.' });
  }
  return 'The certificates are honoured. Contractors return to sites they left years ago, and everything you are building now moves at full speed.';
}

function pensionsPaid(s: GameState): string {
  applyFx(s, ['bloc.street', 5]);
  applyFx(s, ['approval', 2]);
  applyFx(s, ['pressure.wageGrievance', -10]);
  s.news.push({ chronicle: 'PENSION ARREARS CLEARED IN FULL', street: 'PENSIONERS DON COLLECT. SOME DON WAIT SIX YEARS', weight: 5, valence: 1, topic: 'labour', body: 'Pensions outstanding since the last administration have been paid. The verification queue outside the pension office has gone.' });
  return 'Every pension outstanding is paid. The queue outside the pension office, which had become a landmark, is gone.';
}

export function canSecuritise(s: GameState): { ok: boolean; reason?: string } {
  if (s.debts.ways < 0.5) return { ok: false, reason: 'There is too little left to be worth converting.' };
  if (s.pc < 8) return { ok: false, reason: 'Needs 8 political capital.' };
  if (senate(s) < 50) return { ok: false, reason: 'The Senate must approve the conversion, and you do not have the Senate.' };
  return { ok: true };
}

/** Turns the central bank overdraft into long bonds: inflation falls, interest rises. */
export function securitise(s: GameState): string {
  const amount = s.debts.ways;
  s.pc = clamp(s.pc - 8, 0, 100);
  s.debts.ways = 0;
  addOwed(s, 'bonds', amount);
  applyFx(s, ['bloc.establishment', 4]);
  s.flags['ways.converted'] = true;
  s.news.push({ chronicle: `SENATE APPROVES CONVERSION OF ₦${amount.toFixed(1)}TN CENTRAL BANK OVERDRAFT TO BONDS`, street: 'THE MONEY DEM PRINT DON TURN TO PROPER DEBT', weight: 4.5, valence: 1, topic: 'money', body: 'The overdraft becomes forty-year bonds. Money that was created is now money that is owed, at interest, to people who will want it back.' });
  return `₦${amount.toFixed(1)}tn of central bank lending becomes forty-year bonds. It stops feeding inflation. It starts costing interest.`;
}

// ---------------------------------------------------------------- the funds

export function canFund(s: GameState, id: FundId, amount: number): { ok: boolean; reason?: string } {
  if (amount > 0) {
    if (s.nation.fiscalSpace < amount - 0.001) return { ok: false, reason: 'The treasury does not hold that much.' };
    return { ok: true };
  }
  if (s.funds[id] < -amount - 0.001) return { ok: false, reason: 'The fund does not hold that much.' };
  if (id === 'infra' && s.pc < 6) return { ok: false, reason: 'The fund is ring-fenced by law. Breaking it open needs 6 political capital.' };
  return { ok: true };
}

/** Positive amounts are deposits; negative are withdrawals. */
export function moveFund(s: GameState, id: FundId, amount: number): string {
  const def = FUND_BY_ID[id];
  s.nation.fiscalSpace -= amount;
  s.funds[id] = round(Math.max(0, s.funds[id] + amount));
  if (amount > 0) {
    if (id === 'abroad' || id === 'buffer') applyFx(s, ['bloc.establishment', 1.5]);
    return `₦${Math.round(amount * 1000)}bn is paid into ${def.name}. ${def.gives}`;
  }
  if (id === 'abroad') applyFx(s, ['bloc.establishment', -2.5]);
  if (id === 'infra') { s.pc = clamp(s.pc - 6, 0, 100); applyFx(s, ['bloc.establishment', -2]); }
  return `₦${Math.round(-amount * 1000)}bn is brought back from ${def.name} into the treasury.`;
}

const INFRA_TRACKS = new Set(['power', 'works', 'industry', 'food']);
export const drawsOnInfra = (track: string) => INFRA_TRACKS.has(track);

/** How a building cost is met: the infrastructure fund first, at a discount, then the treasury. */
export function buildCost(s: GameState, naira: number, infra: boolean): { fund: number; treasury: number } {
  if (!infra || s.funds.infra <= 0.001 || naira <= 0) return { fund: 0, treasury: naira };
  const fund = Math.min(s.funds.infra, naira * 0.75);
  return { fund: round(fund), treasury: round(naira - fund / 0.75) };
}

export function payBuild(s: GameState, naira: number, infra: boolean, touches?: Record<string, number>): void {
  const c = buildCost(s, naira, infra);
  if (c.fund) s.funds.infra = round(s.funds.infra - c.fund);
  if (c.treasury) applyFx(s, ['nation.fiscalSpace', -c.treasury], touches);
}

function fundsTick(s: GameState): void {
  const f = s.funds;
  if (f.abroad > 0) f.abroad = round(f.abroad * (1 + 0.0055 + Math.max(0, s.nation.inflation - 15) * 0.0004));
  if (f.infra > 0.05 && s.nation.integrity < 30) {
    f.infra = round(f.infra * 0.99);
    if (s.turn - (s.counters.infraLeak ?? -99) >= 9) {
      s.counters.infraLeak = s.turn;
      s.report.push({ kind: 'failure', title: 'The Infrastructure Fund is leaking', text: 'About one per cent a month is leaving the fund through its managers. This stops when integrity reaches 30.', changes: [] });
    }
  }
  if (f.growth > 0.05 && s.turn % 12 === 0) {
    const r = rand(s);
    const mult = r < 0.15 ? 0.7 : r < 0.45 ? 1.05 : 1.22;
    const before = f.growth;
    f.growth = round(before * mult);
    const pct = Math.round((mult - 1) * 100);
    if (mult < 1) {
      applyFx(s, ['bloc.press', -3]);
      applyFx(s, ['approval', -1]);
      s.news.push({ chronicle: `GROWTH PORTFOLIO LOSES ₦${Math.round((before - f.growth) * 1000)}BN IN A YEAR`, street: 'THE MONEY GOVERNMENT USE GAMBLE DON LOSS', weight: 5, valence: -1, topic: 'money', body: 'The state\'s venture portfolio fell 30% this year. Its managers describe the loss as "unrealised". The opposition describes it otherwise.' });
      s.report.push({ kind: 'failure', title: `The Growth Portfolio lost ${-pct}% this year`, text: 'This is the bad year in seven. Nothing you did caused it; holding the portfolio was the decision.', changes: [] });
    } else {
      s.report.push({ kind: 'reform', title: `The Growth Portfolio returned ${pct}% this year`, text: `It now holds ₦${f.growth.toFixed(2)}tn.`, changes: [] });
    }
  }
  // Saving abroad while people are hungry is noticed.
  if (f.abroad > 1 && hardship(s) > 55) applyFx(s, ['approval', -0.12 * Math.min(3, f.abroad)]);
}

/** What holding money costs politically this month, for display. */
export function fundCosts(s: GameState): string[] {
  const out: string[] = [];
  if (s.funds.abroad > 1 && hardship(s) > 55) out.push('The fund abroad is costing you approval while cost-of-living pressure is above 55.');
  if (s.funds.buffer > 1.5) out.push('The governors can see ₦1.5tn in the stabilisation account. They are cooling towards you and will ask for it.');
  if (s.nation.fiscalSpace > 3) out.push('More than ₦3tn is sitting in the treasury. The governors and the Senate resent idle money in Abuja.');
  if (s.funds.infra > 0.05 && s.nation.integrity < 30) out.push('The Infrastructure Fund is leaking 1% a month. This stops when integrity reaches 30.');
  return out;
}

// ---------------------------------------------------------------- the month

/** What the unpaid bills do to the country while they stand. */
function arrearsTick(s: GameState): void {
  const d = s.debts;
  // Power is sold below cost until the tariff is fixed, so the gas bill builds again.
  // Clearing the gas debt means paying suppliers as they deliver: arrears build half as fast until the tariff covers the cost.
  if (!s.agenda.done.includes('p3')) addOwed(s, 'gas', 0.035 * (s.agenda.done.includes('p1') ? 0.5 : 1));
  if (d.gas > 0.2) s.nation.power = clamp(s.nation.power - 0.1 * Math.min(2.5, d.gas / 0.7), 0, 100);
  if (d.contractors > 0.5) s.nation.jobs = clamp(s.nation.jobs - 0.04 * Math.min(3, d.contractors / 1.2), 0, 100);
  if (d.pensions > 0.2) {
    const weight = Math.min(3, d.pensions / 0.6);
    s.pressures.wageGrievance = clamp(s.pressures.wageGrievance + 0.5 * weight, 0, 100);
    s.blocs.street = clamp(s.blocs.street - 0.25 * weight, 0, 100);
  }
  if (d.bonds > 12) s.nation.jobs = clamp(s.nation.jobs - (d.bonds - 12) * 0.015, 0, 100);
}

/** Contractors who have not been paid work slowly. */
export function buildSpeed(s: GameState): number {
  return s.debts.contractors > 0.5 ? 0.85 : 1;
}

/** Inflation that comes from money the central bank created. */
export function printedInflation(s: GameState): number {
  return s.debts.ways * 0.62;
}

export function treasuryTick(s: GameState): void {
  const e = CFG.economy;
  const n = s.nation;
  oilTick(s);

  // Anything spent that the treasury did not hold was borrowed, if anyone would lend.
  if (n.fiscalSpace < 0) {
    const short = -n.fiscalSpace;
    if (n.debt < e.noLendingAbove) addOwed(s, 'bonds', short);
    else addOwed(s, 'ways', short);
    n.fiscalSpace = 0;
  }

  const flow = fiscalFlow(s);
  n.fiscalSpace += flow.total;
  if (flow.saved > 0) s.funds.buffer = round(s.funds.buffer + flow.saved);

  if (n.fiscalSpace < 0) {
    let short = -n.fiscalSpace;
    n.fiscalSpace = 0;
    // Savings first. That is what they are for.
    const fromBuffer = Math.min(s.funds.buffer, short);
    s.funds.buffer = round(s.funds.buffer - fromBuffer);
    short -= fromBuffer;
    if (short > 0.0005) {
      s.counters.borrowed = (s.counters.borrowed ?? 0) + 1;
      // A government that is short borrows some and simply does not pay the rest.
      const lend = n.debt < e.noLendingAbove;
      addOwed(s, lend ? 'bonds' : 'ways', short * (lend ? 0.5 : 0.5));
      addOwed(s, 'contractors', short * 0.3);
      addOwed(s, 'pensions', short * 0.2);
    }
  }
  n.fiscalSpace = clamp(n.fiscalSpace, 0, 15);

  budgetTick(s);
  arrearsTick(s);
  fundsTick(s);
  syncDebt(s);
  syncSecurity(s);

  // December: next year's Appropriation Bill is on the desk.
  if (monthOf(s.turn) === 12 && s.budget.year <= yearOf(s.turn, s.startYear)) s.budget.due = true;
}

export { ARREARS };
export type { ZoneId };
