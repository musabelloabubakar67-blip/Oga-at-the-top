import { CFG, dateLabel, termTurnOf } from './config';
import { capitalIncome } from './capital';
import { describe } from './effects';
import { peopleTick } from './people';
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
      cause: cause && !cause.sealed ? `${cause.headline} (${dateLabel(cause.turn)})` : undefined,
    });
    if (l.note) s.news.push({ chronicle: l.note[0], street: l.note[1], weight: 3 });
  }
}

export function economyTick(s: GameState): void {
  const e = CFG.economy;
  const n = s.nation;
  const subsidy = String(s.flags['policy.subsidy'] ?? 'partial');

  s.petrolRef = toward(s.petrolRef, n.petrolPrice, e.petrolRefRate);
  const bias = Number(s.flags['econ.inflBias'] ?? 0);
  const target = e.inflationBase + (n.debt - 50) * e.debtToInflation + (50 - n.security) * e.securityToInflation
    + petrolShock(s) * e.shockToInflation + bias + (s.counters['bonus.inflation'] ?? 0)
    + Math.max(0, n.debt - e.debtCliff) * e.debtCliffToInflation
    + Math.max(0, 30 - s.blocs.establishment) * 0.25;
  n.inflation = clamp(toward(n.inflation, target, e.inflationRate), 3, 80);

  // Petrol tracks general prices once it is market-priced.
  if (subsidy === 'removed') n.petrolPrice *= 1 + n.inflation / 100 / 24;

  const drift = e.fiscalBase + (e.subsidyDrift[subsidy] ?? 0)
    + (n.capacity - 34) * e.capacityToFiscal
    - (n.debt - 66) * e.debtToFiscal
    + (n.integrity - 28) * e.integrityToFiscal
    + ((s.chars.fin?.competence ?? 3) - 3) * 0.012
    + (s.counters['bonus.fiscal'] ?? 0)
    + (n.jobs - 34) * e.jobsToFiscal;
  n.fiscalSpace += drift;
  if (n.fiscalSpace < 0) {
    n.debt = clamp(n.debt - n.fiscalSpace * e.borrowToDebt, 20, 130);
    n.fiscalSpace = 0;
    s.counters.borrowed = (s.counters.borrowed ?? 0) + 1;
  } else if (n.fiscalSpace > 2.5) {
    n.debt = clamp(n.debt - e.debtPaydown, 20, 130);
  }

  n.fiscalSpace = clamp(n.fiscalSpace, -5, 15);

  // Past the cliff with nothing in the account, capital spending stops.
  const austerity = n.debt > e.debtCliff && n.fiscalSpace <= 0.05;
  n.power = clamp(n.power - e.powerDecay - (austerity ? e.austerityPower : 0), 0, 100);
  n.security = clamp(n.security - e.securityDecay - (austerity ? e.austeritySecurity : 0), 0, 100);

  n.jobs = clamp(n.jobs - e.jobsDecay, 0, 100);
  // What reform built keeps paying, every month.
  for (const k of ['security', 'power', 'capacity', 'integrity', 'jobs'] as const) {
    const b = s.counters[`bonus.${k}`] ?? 0;
    if (b) applyFx(s, [`nation.${k}`, b]);
  }

  // The example is followed: exposure erodes integrity slowly.
  const recent = s.exposures.filter((x) => s.turn - x.turn <= 12).length;
  n.integrity = clamp(n.integrity - recent * 0.06, 0, 100);

  const p = s.pressures;
  const capped = subsidy !== 'removed';
  p.fuelSupplyStress = clamp(p.fuelSupplyStress + (capped ? 1.6 + (n.fiscalSpace < 0.5 ? 1.2 : 0) : -3), 0, 100);
  p.wageGrievance = clamp(p.wageGrievance + (hardship(s) - 45) * 0.08, 0, 100);
  const finRisk = Math.max(0, 3 - (s.chars.fin?.integrity ?? 3)) * 0.3;
  p.scandalHeat = clamp(p.scandalHeat + (40 - n.integrity) * 0.05 + recent * 0.4 + finRisk - 0.5, 0, 100);

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
    50 + (s.nation.fiscalSpace > 1 ? 4 : -4) - (s.nation.debt - 66) * 0.3,
    b.establishmentRate,
  );
  s.blocs.press = toward(s.blocs.press, 50, b.pressRate);
  for (const k of BLOCS) s.blocs[k] = clamp(s.blocs[k], 0, 100);

  s.counters.scar = (s.counters.scar ?? 0) * CFG.scar.decay + Math.max(0, h - CFG.scar.above) * CFG.scar.gain;
  const a = CFG.approval;
  for (const z of ZONES) {
    const zone = s.zones[z];
    // Voters punish hardship more than they reward its absence.
    const target = a.base + zone.lean - (h - 45) * (h > 45 ? a.hardship : a.relief) - (45 - zoneSecurity(s, z)) * a.security
      + (s.blocs.press - 50) * a.press - s.counters.scar * a.scar
      - Math.max(0, s.turn - a.fatigueAfter) * a.fatigue;
    zone.approval = clamp(toward(zone.approval, target, a.rate), 5, 95);
  }

  s.pc = clamp(s.pc + capitalIncome(s).total, 0, CFG.pc.max);

  peopleTick(s);

  // Two blocs breaking in the same month starts removal proceedings.
  const breaking = BLOCS.filter((k) => s.blocs[k] < b.breaking);
  if (breaking.length >= 2 && !s.flags['removal.active'] && s.turn - (s.counters.removalTurn ?? -99) > 12) {
    s.flags['removal.active'] = true;
    s.counters.removalTurn = s.turn;
    s.queue.push({ event: 'removal.notice', due: s.turn });
  }
}
