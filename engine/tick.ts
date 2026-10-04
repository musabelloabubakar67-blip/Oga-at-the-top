import { formersTick } from './formers';
import { predTick } from './predecessor';
import { vpTick } from './vp';
import { federalTick } from './federal';
import { caseTick } from './cases';
import { CFG, dateLabel } from './config';
import { capitalIncome } from './capital';
import { describe } from './effects';
import { tycoonInflation, tycoonTick } from './favours';
import { oppositionTick } from './opposition';
import { peopleTick } from './people';
import { foodInflation, securityTick } from './security';
import { policyGoodwill, policyInflationLines, policyTick } from './policies';
import { institutionInflationLines, institutionTick } from './institutions';
import { assetTick } from './places';
import { currencyTick, fxInflation } from './currency';
import { budgetInflation, printedInflation, treasuryTick } from './treasury';
import type { GameState, Nation } from './types';
import { BLOCS, ZONES, applyFx, approval, clamp, hardship, petrolShock, test, zoneSecurity } from './vars';

const toward = (x: number, target: number, rate: number) => x + (target - x) * rate;

/** Scheduled effects that have come due. Their causes were recorded when they were scheduled. */
export function applyLedger(s: GameState): void {
  const due = s.ledger.filter((l) => l.due <= s.turn);
  s.ledger = s.ledger.filter((l) => l.due > s.turn);
  for (const l of due) {
    if (!test(s, l.when)) continue;
    for (const fx of l.fx) applyFx(s, fx);
    const cause = s.archive.find((a) => a.id === l.causeId);
    s.report.push({
      kind: 'consequence', title: l.label, changes: describe(l.fx),
      cause: cause && !cause.sealed ? `${cause.headline} (${dateLabel(cause.turn, s.startYear)})` : undefined,
    });
    if (l.note) {
      const mood = l.fx.reduce((a, f) => a + (f[0] === 'approval' ? f[1] : 0), 0);
      s.news.push({ chronicle: l.note[0], street: l.note[1], weight: 3, valence: Math.sign(mood), topic: 'general' });
    }
  }
}

/** Where inflation is heading, and why. */
export function inflationTarget(s: GameState): { lines: { label: string; value: number }[]; total: number } {
  const e = CFG.economy;
  const n = s.nation;
  const lines = [
    { label: 'The underlying rate', value: e.inflationBase },
    { label: 'Debt service', value: (n.debt - 50) * e.debtToInflation + Math.max(0, n.debt - e.debtCliff) * e.debtCliffToInflation },
    { label: 'Money the central bank created', value: printedInflation(s) },
    { label: 'Insecurity on the farms', value: foodInflation(s) },
    { label: 'The pump price', value: petrolShock(s) * e.shockToInflation },
    { label: 'Wage deals and other commitments', value: Number(s.flags['econ.inflBias'] ?? 3) - 3 },
    { label: 'Your reforms and orders', value: s.counters['bonus.inflation'] ?? 0 },
    { label: 'Farming in the budget', value: budgetInflation(s) },
    { label: 'The importers', value: tycoonInflation(s) },
    { label: 'The naira', value: fxInflation(s) },
    { label: 'A nervous establishment', value: Math.max(0, 30 - s.blocs.establishment) * 0.25 },
    ...policyInflationLines(s),
    ...institutionInflationLines(s),
  ].filter((l) => Math.abs(l.value) >= 0.05);
  return { lines, total: lines.reduce((a, l) => a + l.value, 0) };
}

export function economyTick(s: GameState): void {
  const e = CFG.economy;
  const n = s.nation;
  const subsidy = String(s.flags['policy.subsidy'] ?? 'partial');

  s.petrolRef = toward(s.petrolRef, n.petrolPrice, e.petrolRefRate);
  n.inflation = clamp(toward(n.inflation, inflationTarget(s).total, e.inflationRate), 3, 80);

  // Petrol tracks general prices once it is market-priced.
  if (subsidy === 'removed') n.petrolPrice *= 1 + n.inflation / 100 / 24;

  // The books: oil, the monthly flow, the budget, the unpaid bills and the funds.
  treasuryTick(s);
  currencyTick(s);

  // Past the cliff with nothing in the account, capital spending stops.
  const austerity = n.debt > e.debtCliff && n.fiscalSpace <= 0.05;
  // Under the electricity market law, states and private firms keep generation going.
  n.power = clamp(n.power - e.powerDecay * (s.agenda.done.includes('p4') ? 0.5 : 1) - (austerity ? e.austerityPower : 0), 0, 100);
  n.jobs = clamp(n.jobs - e.jobsDecay, 0, 100);
  // What reform built keeps paying, every month.
  for (const k of ['security', 'power', 'capacity', 'integrity', 'jobs'] as const) {
    const b = s.counters[`bonus.${k}`] ?? 0;
    if (b) applyFx(s, [`nation.${k}`, b]);
  }
  securityTick(s);
  // What the standing policies do this month, worked out against the economy as it is.
  policyTick(s);
  // What has been built keeps running.
  institutionTick(s);
  caseTick(s);
  federalTick(s);
  vpTick(s);
  predTick(s);
  formersTick(s);
  assetTick(s);

  // The example is followed: exposure erodes integrity slowly.
  const recent = s.exposures.filter((x) => s.turn - x.turn <= 12).length;
  n.integrity = clamp(n.integrity - recent * 0.06, 0, 100);

  const p = s.pressures;
  const capped = subsidy !== 'removed';
  p.fuelSupplyStress = clamp(p.fuelSupplyStress + (capped ? 1.6 + (n.fiscalSpace < 0.5 ? 1.2 : 0) : -3), 0, 100);
  p.wageGrievance = clamp(p.wageGrievance + (hardship(s) - 45) * 0.08, 0, 100);
  const finRisk = Math.max(0, 3 - (s.chars.fin?.integrity ?? 3)) * 0.2;
  // Looking away is noticed less than taking. Taking for yourself is noticed most.
  // Asset declarations make taking for yourself easier to see.
  const declared = s.agenda.done.includes('c3');
  const heat = s.exposures.filter((x) => s.turn - x.turn <= 12).reduce((a, x) => a + (x.kind === 'tolerated' ? 0.15 : x.kind === 'political' ? 0.4 : declared ? 0.75 : 0.5), 0);
  if (declared && !s.exposures.some((x) => x.kind === 'personal' && s.turn - x.turn <= 12)) n.integrity = clamp(n.integrity + 0.03, 0, 100);
  // Scandal settles at a level set by how the government behaves. Revelations push it up; it comes back down if nothing feeds it.
  // With contracts published, there is less to find.
  const settles = clamp(18 + (40 - n.integrity) * 1.1 + heat * 9 + finRisk * 12 - (s.agenda.done.includes('c1') ? 5 : 0), 0, 100);
  p.scandalHeat = clamp(toward(p.scandalHeat, settles, 0.08), 0, 100);

  s.hist.push({ ...n } as Nation);
  if (s.hist.length > 4) s.hist.shift();
}

export function politicsTick(s: GameState): void {
  const b = CFG.blocs;
  const h = hardship(s);
  const app = approval(s);
  const cos = s.chars.cos;

  s.blocs.street = toward(s.blocs.street, b.streetBase - h * b.streetHardship, b.streetRate);
  s.blocs.party = toward(s.blocs.party, 50 + (app - 45) * 0.5, b.partyRate);
  s.blocs.villa = toward(s.blocs.villa, 55 + ((cos?.competence ?? 3) - 3) * 4, b.villaRate);
  s.blocs.establishment = toward(
    s.blocs.establishment,
    50 + (s.nation.fiscalSpace + s.funds.buffer + s.funds.abroad > 1 ? 4 : -4) - (s.nation.debt - 66) * 0.3,
    b.establishmentRate,
  );
  s.blocs.press = toward(s.blocs.press, 50, b.pressRate);
  // Too much, too fast: the party tires of a President who is changing everything at once.
  s.blocs.party -= Math.max(0, s.agenda.active.length - CFG.agenda.easyLoad) * CFG.agenda.loadParty;
  for (const k of BLOCS) s.blocs[k] = clamp(s.blocs[k], 0, 100);

  s.counters.scar = (s.counters.scar ?? 0) * CFG.scar.decay + Math.max(0, h - CFG.scar.above) * CFG.scar.gain;
  const a = CFG.approval;
  // The crowd-pleasers stay popular for as long as they stand.
  const goodwill = policyGoodwill(s);
  for (const z of ZONES) {
    const zone = s.zones[z];
    // Voters punish hardship more than they reward its absence.
    const target = a.base + zone.lean - (h - 45) * (h > 45 ? a.hardship : a.relief) - (45 - zoneSecurity(s, z)) * (zoneSecurity(s, z) > 45 ? a.security * 0.5 : a.security)
      + (s.blocs.press - 50) * a.press - s.counters.scar * a.scar
      - Math.max(0, s.pressures.scandalHeat - a.scandalAbove) * a.scandal
      - Math.max(0, s.turn - a.fatigueAfter) * a.fatigue
      + goodwill;
    zone.approval = clamp(toward(zone.approval, target, a.rate), 5, 95);
  }

  s.pc = clamp(s.pc + capitalIncome(s).total, 0, CFG.pc.max);

  peopleTick(s);
  tycoonTick(s);
  oppositionTick(s);

  // Two blocs breaking in the same month starts removal proceedings.
  const breaking = BLOCS.filter((k) => s.blocs[k] < b.breaking);
  if (breaking.length >= 2 && !s.flags['removal.active'] && s.turn - (s.counters.removalTurn ?? -99) > 12) {
    s.flags['removal.active'] = true;
    s.counters.removalTurn = s.turn;
    s.queue.push({ event: 'removal.notice', due: s.turn });
  }
}
