// The books: what the country owes, what it has saved, what oil is paying,
// and how the year's budget is divided. This replaces the single debt number.

import { MILESTONE_BY_ID } from '../content/agenda';
import { BENCHMARKS, DEBTS, DEBT_BY_ID, FUND_BY_ID, SECTORS, SECTOR_BY_ID } from '../content/treasury';
import { PEOPLE } from '../content/people';
import { CFG, monthOf, yearOf } from './config';
import { ARREARS, addOwed, rateOf, servicePoints, syncDebt } from './ledger';
import { policyFiscalLines } from './policies';
import { institutionFiscalLines } from './institutions';
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
  return ((s.oil.price * s.oil.output) / 1.75 - s.budget.benchmark) * 0.0035;
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
  add(subsidy === 'removed' ? 'No petrol subsidy to pay' : 'The petrol subsidy', (e.subsidyDrift[subsidy] ?? 0) * crude,
    subsidy === 'removed' ? `What ending the subsidy freed, at $${Math.round(s.oil.price)} oil.` : `The gap between the pump price and the cost, paid monthly. Dearer as crude rises: $${Math.round(s.oil.price)} now.`);
  add('Debt service', -(n.debt - 66) * e.debtToFiscal, 'Against the 66% of revenue you inherited. Each point retired is worth about ₦36bn a year.');
  add('Tax collection', (n.capacity - 34) * e.capacityToFiscal, 'A state that works collects what it is owed. Rises with state capacity.');
  add('Leakage', (n.integrity - 28) * e.integrityToFiscal, 'Less is stolen as integrity rises.');
  add('Industry and jobs', (n.jobs - 34) * e.jobsToFiscal, 'Factories and payrolls pay tax.');
  add('The Finance Minister', ((s.chars.fin?.competence ?? 3) - 3) * 0.012, 'A competent one finds money. A weak one loses it.');
  add('Your reforms and orders', s.counters['bonus.fiscal'] ?? 0, 'The permanent effect of what you have built, cut or promised.');
  for (const l of policyFiscalLines(s)) add(l.label, l.value, l.hint);
  for (const l of institutionFiscalLines(s)) add(l.label, l.value, l.hint);
  add('The insurgency', -Math.max(0, s.theatres.NE - 50) * 0.0009, 'The war in the North East is paid for every month.');
  const points = BENCHMARKS.find((b) => b.price === s.budget.benchmark)?.points ?? 10;
  const spare = points - SECTORS.reduce((a, x) => a + (s.budget.alloc[x.id] ?? 0), 0);
  add('Unallocated in the budget', spare * 0.02, 'Budget points you chose not to spend.');
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

/** What each point above or below the usual does, every month, for the year. */
function budgetTick(s: GameState): void {
  const months = s.turn - (s.counters.budgetTurn ?? 0);
  const held = !!s.budget.late && months <= 3;
  const d = (id: SectorId) => {
    const v = (s.budget.alloc[id] ?? 0) - SECTOR_BY_ID[id].usual;
    return held && v > 0 ? 0 : v;
  };
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
}

/** How far farming money moves the inflation the economy is heading for. */
export function budgetInflation(s: GameState): number {
  return -0.35 * ((s.budget.alloc.agric ?? 0) - SECTOR_BY_ID.agric.usual);
}

export function budgetPoints(benchmark: number): number {
  return BENCHMARKS.find((b) => b.price === benchmark)?.points ?? 10;
}

/** What the Appropriations chairman expects for his colleagues. */
export function paddingDemand(s: GameState): number {
  const chair = s.people.sen_approp;
  return chair && chair.rel >= 70 ? 2 : 3;
}

export function canBudget(s: GameState, benchmark: number, alloc: Record<SectorId, number>): { ok: boolean; reason?: string } {
  if (!s.budget.due) return { ok: false, reason: 'There is no bill on the desk.' };
  if (!BENCHMARKS.some((b) => b.price === benchmark)) return { ok: false };
  let sum = 0;
  for (const x of SECTORS) {
    const v = alloc[x.id] ?? 0;
    if (v < 0 || v > x.max || !Number.isInteger(v)) return { ok: false, reason: `${x.name}: between 0 and ${x.max}.` };
    sum += v;
  }
  if (sum > budgetPoints(benchmark)) return { ok: false, reason: 'You have allocated more than the budget holds.' };
  return { ok: true };
}

/** Signs the year's budget. Returns what happened in the Assembly. */
export function setBudget(s: GameState, benchmark: number, alloc: Record<SectorId, number>): string {
  const demand = paddingDemand(s);
  const short = Math.max(0, demand - (alloc.padding ?? 0));
  const chair = s.people.sen_approp;
  s.budget = { year: yearOf(s.turn, s.startYear) + 1, benchmark, alloc: { ...alloc }, due: false, late: false };
  s.counters.budgetTurn = s.turn;
  let text: string;
  if (short > 0) {
    if (chair) chair.rel = clamp(chair.rel - 7 * short, 0, 100);
    if (senate(s) < 54) {
      s.budget.late = true;
      applyFx(s, ['nation.capacity', -1.5]);
      applyFx(s, ['bloc.establishment', -3]);
      applyFx(s, ['nation.integrity', 1]);
      text = `The Appropriations Committee wanted ${demand} points for its members' projects and got ${alloc.padding ?? 0}. The bill sits in committee until March. Nothing above last year's level is released for three months.`;
      s.news.push({ chronicle: 'BUDGET STALLS IN SENATE OVER CONSTITUENCY PROJECTS', street: 'SENATORS HOLD BUDGET: "WHERE OUR OWN?"', weight: 5, valence: -1, topic: 'politics', about: 'sen_approp', body: text });
    } else {
      applyFx(s, ['nation.integrity', 1.5]);
      applyFx(s, ['bloc.press', 3]);
      text = `The Appropriations Committee wanted ${demand} points for its members' projects and got ${alloc.padding ?? 0}. Your senators passed it anyway. The chairman has made a note.`;
      s.news.push({ chronicle: 'SENATE PASSES BUDGET WITHOUT THE USUAL INSERTIONS', street: 'BUDGET PASS, PADDING NO DEY. SENATOR ZANGO DEY VEX', weight: 5, valence: 1, topic: 'politics', about: 'sen_approp', body: text });
    }
  } else {
    if (chair) chair.rel = clamp(chair.rel + 4 + 3 * ((alloc.padding ?? 0) - demand), 0, 100);
    text = `The Appropriation Act for ${s.budget.year} is signed before the cameras. The Assembly's own projects are in it, as agreed.`;
    s.news.push({ chronicle: `PRESIDENT SIGNS ${s.budget.year} BUDGET; OIL BENCHMARK $${benchmark}`, street: `BUDGET ${s.budget.year} DON LAND. OIL BENCHMARK NA $${benchmark}`, weight: 4.5, valence: 0, topic: 'money', body: text });
  }
  return text;
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
