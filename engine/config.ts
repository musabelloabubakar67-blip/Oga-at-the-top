// Every tuning coefficient lives here. Change numbers, re-run `npm run simulate`.

export const CFG = {
  termLength: 48,
  electionTermTurn: 45,
  primaryTermTurn: 37,
  campaignOpensTermTurn: 40,
  honeymoonMonths: 6,
  cleanCost: 0.8,
  // Acting without the capital is allowed. The party and the Villa pay for it.
  overdraft: { party: 0.4, villa: 0.2 },
  agenda: { slots: 3, slotsAtCapacity: 50, offAgendaPc: 1.5, donePc: 4, donePriorityPc: 7, ventureWinPc: 8, grantPc: 5, retryAfter: 12, greasePurse: 10, ventureSlots: 2, offers: 5, offerRest: 10 },
  startYear: 2027,

  pc: {
    base: 2, approvalPivot: 45, approvalDiv: 8, honeymoon: 3, lameDuck: -2, max: 100, softCap: 80,
    perAlly: 0.3, perSolid: 0.6, perStrained: 0.8, perBreaking: 2, perReform: 0.2, keptCap: 3,
  },
  // What the President can personally do in a month. Launching reforms and big bets does not count.
  moves: { base: 4, bonusAt: 60, penaltyAt: 30 },

  economy: {
    petrolRefRate: 0.06,
    inflationRate: 0.15,
    inflationBase: 15,
    debtToInflation: 0.12,
    securityToInflation: 0.12,
    shockToInflation: 22,
    fiscalBase: -0.03,
    subsidyDrift: { full: -0.16, partial: -0.1, phasing: -0.06, removed: 0.07 } as Record<string, number>,
    capacityToFiscal: 0.004,
    debtToFiscal: 0.003,
    integrityToFiscal: 0.002,
    borrowToDebt: 3,
    debtPaydown: 0.15,
    powerDecay: 0.12,
    securityDecay: 0.08,
    debtCliff: 90,
    debtCliffToInflation: 0.5,
    austerityPower: 0.35,
    austeritySecurity: 0.25,
    noLendingAbove: 100,
    jobsDecay: 0.05,
    jobsToFiscal: 0.003,
  },

  hardship: { base: 17.6, inflation: 1.5, shock: 45, power: 0.5, jobs: 0.4 },

  blocs: {
    streetBase: 78, streetHardship: 0.75, streetRate: 0.08,
    partyRate: 0.08, villaRate: 0.06, establishmentRate: 0.06, pressRate: 0.07,
    breaking: 20,
  },

  approval: { base: 49, hardship: 0.55, relief: 0.25, fatigue: 0.09, fatigueAfter: 12, security: 0.25, press: 0.05, rate: 0.18, scar: 0.3 },
  // Voters remember the worst months for a long time.
  scar: { above: 55, gain: 0.04, decay: 0.97 },

  election: {
    approval: 0.45, machine: 5, rally: 1.5, rallyCap: 3, chestPer: 0.25, chestCap: 3,
    scandal: 22, home: 6, homeZone: 3, noise: 2.5, successorPenalty: 3,
    united: -2, split: 2, scar: 0.4, incumbency: 1, rival: 0.08,
  },

  director: { quietChance: 0.2, minorOne: 0.42, minorTwo: 0.08 },
};

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthOf(turn: number): number {
  return ((turn + 4) % 12) + 1;
}
export function yearOf(turn: number): number {
  return CFG.startYear + Math.floor((turn + 4) / 12);
}
export function termTurnOf(turn: number): number {
  return ((turn - 1) % CFG.termLength) + 1;
}
export function dateLabel(turn: number): string {
  return `${MONTHS[monthOf(turn) - 1]} ${yearOf(turn)}`;
}
