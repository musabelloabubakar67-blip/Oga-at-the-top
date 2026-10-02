import { STATES } from '../content/states';
import { CFG } from './config';
import { governorEffect, strongestRival } from './people';
import { rand } from './rng';
import type { ElectionResult, GameState, StateResult } from './types';
import { ZONE_NAME, approval, clamp } from './vars';

/** A rough reading of where a re-election would stand today, in points of margin. */
export function projectMargin(s: GameState): number {
  const e = CFG.election;
  const machine = ((s.blocs.party - 50) / 50) * e.machine;
  const chest = Math.min(e.chestCap, s.campaign.chest * e.chestPer);
  const field = (s.flags['opposition.united'] ? e.united : 0) + (s.flags['opposition.split'] ? e.split : 0)
    - (s.counters.scar ?? 0) * e.scar + e.incumbency - (strongestRival(s).strength - 45) * e.rival;
  const twoWay = 50 + (approval(s) - 50) * e.approval + machine + chest - s.pressures.scandalHeat / e.scandal + field + 0.6;
  return 2 * twoWay - 100;
}

/** State-by-state result for the president (re-election) or the president's chosen successor. */
export function runElection(s: GameState, kind: 'reelection' | 'succession'): ElectionResult {
  const e = CFG.election;
  const machine = ((s.blocs.party - 50) / 50) * e.machine;
  const chest = Math.min(e.chestCap, s.campaign.chest * e.chestPer);
  const scandal = s.pressures.scandalHeat / e.scandal;
  const field = (s.flags['opposition.united'] ? e.united : 0) + (s.flags['opposition.split'] ? e.split : 0) - (s.counters.scar ?? 0) * e.scar + (kind === 'reelection' ? e.incumbency : 0)
    - (strongestRival(s).strength - 45) * e.rival;
  const backing = kind === 'succession' ? Number(s.flags['succession.strength'] ?? -2) - e.successorPenalty : 0;

  const states: StateResult[] = STATES.map((st) => {
    const zone = s.zones[st.zone];
    const rallies = Math.min(e.rallyCap, s.campaign.rallies[st.zone] ?? 0);
    const home = kind === 'reelection'
      ? (st.id === s.president.home ? e.home : st.zone === s.president.homeZone ? e.homeZone : 0)
      : 0;
    const noise = (rand(s) * 2 - 1) * e.noise;
    const third = 5 + rand(s) * 5;
    const twoWay = clamp(
      50 + (s.stateLean[st.id] ?? 0) + (zone.approval - 50) * e.approval + machine + rallies * e.rally
        + chest - scandal + home + backing + field + governorEffect(s, st.zone) + noise,
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
  };
}
