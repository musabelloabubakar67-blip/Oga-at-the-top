import { heirZone } from './successor';
import { STATES } from '../content/states';
import { TYCOONS } from '../content/tycoons';
import { CFG } from './config';
import { governorEffect, strongestRival } from './people';
import { ZONES, ZONE_WEIGHT } from './vars';
import { local } from './places';
import { rand } from './rng';
import type { ElectionResult, GameState, StateResult } from './types';
import { ZONE_NAME, approval, clamp, registerOutlook } from './vars';

/** What the businessmen's money is doing to the race: points of vote share. */
export function moneyEffect(s: GameState): number {
  let v = 0;
  for (const t of TYCOONS) {
    const rel = s.tycoons[t.id]?.rel ?? 50;
    if (rel >= 60) v += CFG.election.tycoon * 0.6;
    if (rel < 35) v -= CFG.election.tycoon * smearDiscount(s);
  }
  return v;
}

/** Money spent against a President with a clean record buys less: there is less to smear. */
export function smearDiscount(s: GameState): number {
  return 1 - Math.max(0, s.nation.integrity - 40) / 100;
}

/** Voters credit a clean record, in points of share. */
export function cleanRecord(s: GameState): number {
  return Math.max(0, s.nation.integrity - 62) * CFG.election.clean;
}

/** Results published from every polling unit leave the party machine less to do. */
export function machineWeight(s: GameState): number {
  return s.agenda.done.includes('r4') ? 0.6 : 1;
}

/** A rough reading of where a re-election would stand today, in points of margin. */
export function projectMargin(s: GameState): number {
  const e = CFG.election;
  const machine = ((s.blocs.party - 50) / 50) * e.machine * machineWeight(s);
  const chest = Math.min(e.chestCap, s.campaign.chest * e.chestPer);
  const field = (s.flags['opposition.united'] ? e.united * (s.flags['opposition.broad'] ? 1.5 : 1) : 0) + (s.flags['opposition.split'] ? e.split : 0)
    - (s.counters.scar ?? 0) * e.scar + e.incumbency - (strongestRival(s).strength - 45) * e.rival + moneyEffect(s) + cleanRecord(s);
  const governors = ZONES.reduce((a, z) => a + governorEffect(s, z) * ZONE_WEIGHT[z], 0);
  const rallies = ZONES.reduce((a, z) => a + Math.min(e.rallyCap, s.campaign.rallies[z] ?? 0) * e.rally * ZONE_WEIGHT[z], 0);
  const twoWay = 50 + (approval(s) - 50) * e.approval + machine + chest - s.pressures.scandalHeat / e.scandal + field + governors + rallies + 0.6;
  return 2 * twoWay - 100;
}

/** State-by-state result for the president (re-election) or the president's chosen successor. */
export function runElection(s: GameState, kind: 'reelection' | 'succession', steady = false): ElectionResult {
  const e = CFG.election;
  const machine = ((s.blocs.party - 50) / 50) * e.machine * machineWeight(s);
  const chest = Math.min(e.chestCap, s.campaign.chest * e.chestPer);
  const scandal = s.pressures.scandalHeat / e.scandal;
  const field = (s.flags['opposition.united'] ? e.united * (s.flags['opposition.broad'] ? 1.5 : 1) : 0) + (s.flags['opposition.split'] ? e.split : 0) - (s.counters.scar ?? 0) * e.scar + (kind === 'reelection' ? e.incumbency : 0)
    - (strongestRival(s).strength - 45) * e.rival + moneyEffect(s) + cleanRecord(s);
  const backing = kind === 'succession' ? Number(s.flags['succession.strength'] ?? -2) - e.successorPenalty : 0;
  // A successor carries their own zone, as the President carried theirs.
  const heirHome = kind === 'succession' && s.flags['succession.backed'] ? heirZone(s, String(s.flags['succession.backed'])) : null;
  // Nobody controls the mood of the country on the day. Usually small; now and then it decides a close race.
  const swing = steady ? 0 : (rand(s) + rand(s) - 1) * e.swing;

  const states: StateResult[] = STATES.map((st) => {
    const zone = s.zones[st.zone];
    const rallies = Math.min(e.rallyCap, s.campaign.rallies[st.zone] ?? 0);
    const home = kind === 'reelection'
      ? (st.id === s.president.home ? e.home : st.zone === s.president.homeZone ? e.homeZone : 0)
      : (heirHome && st.zone === heirHome ? e.homeZone : 0);
    const noise = steady ? 0 : (rand(s) * 2 - 1) * e.noise;
    const third = steady ? 7.5 : 5 + rand(s) * 5;
    const twoWay = clamp(
      50 + (s.stateLean[st.id] ?? 0) + (zone.approval - 50) * e.approval + machine + rallies * e.rally
        + chest - scandal + home + backing + field + governorEffect(s, st.zone) + local(s, st.id).v * e.approval + noise + swing,
      8, 92,
    );
    const share = twoWay * (1 - third / 100);
    const opp = (100 - twoWay) * (1 - third / 100);

    let line: string | undefined;
    if (st.id === s.president.home && kind === 'reelection') {
      line = share > opp ? 'The President\'s home state holds.' : 'The President has lost at home.';
    } else if (rallies >= 2 && share > opp) line = `Three visits to the ${ZONE_NAME[st.zone]} in six months. They noticed.`;
    else if (zone.approval < 34 && share < opp) line = 'The returning officer reads the figures to a silent hall.';
    else if (Math.abs(share - opp) < 1.5) line = 'Agents for both parties are disputing the collation.';

    return { id: st.id, name: st.name, zone: st.zone, voters: st.voters, share, opp, won: share > opp, line };
  });

  let votesFor = 0;
  let votesAgainst = 0;
  let spread = 0;
  for (const r of states) {
    votesFor += r.voters * r.share;
    votesAgainst += r.voters * r.opp;
    if (r.share >= 25) spread++;
  }
  // Safe states first, the closest and largest last.
  states.sort((a, b) => Math.abs(b.share - b.opp) - b.voters - (Math.abs(a.share - a.opp) - a.voters));

  return {
    turn: s.turn, kind, states, votesFor, votesAgainst, spread,
    approval: approval(s),
    margin: ((votesFor - votesAgainst) / (votesFor + votesAgainst)) * 100,
    won: votesFor > votesAgainst && spread >= 25,
    swing,
  };
}

registerOutlook(projectMargin);
