// WHY A REFORM IS SLOW, AND WHAT WOULD ACTUALLY FIX IT (plan 15.A3)
// A reform's pace is the product of separate causes: money, the people
// executing it, obstruction, shocks from outside, and whether its design can
// pass at all. The diagnosis names each and the remedy that addresses it, so a
// better minister is not mistaken for missing money.

import { MILESTONE_BY_ID } from '../content/agenda';
import { CFG } from './config';
import { ministerFor, ministerSpeed } from './people';
import { activeShocks } from './shocks';
import { buildSpeed, drawsOnInfra } from './treasury';
import type { GameState, SectorId } from './types';
import { test } from './vars';

export type Cause = 'funding' | 'execution' | 'obstruction' | 'shock' | 'design';
export const CAUSE_NAME: Record<Cause, string> = {
  funding: 'Funding', execution: 'Execution', obstruction: 'Obstruction', shock: 'An outside shock', design: 'Design',
};

export interface Finding { cause: Cause; factor: number; text: string; remedy: string }

/** The budget sector a track's money comes through. */
export const TRACK_SECTOR: Record<string, SectorId> = { power: 'power', security: 'security', people: 'people', schools: 'people', food: 'agric' };

/** A held release slows the reforms that spend through that sector. */
export function heldFactor(s: GameState, track: string): number {
  const sec = TRACK_SECTOR[track];
  return sec && s.budget.release?.[sec] === 'hold' ? 0.6 : 1;
}

/** Every cause slowing a reform under way, worst first. */
export function diagnose(s: GameState, id: string): Finding[] {
  const entry = MILESTONE_BY_ID[id];
  if (!entry) return [];
  const { m, track } = entry;
  const out: Finding[] = [];
  const austerity = s.nation.debt > CFG.economy.debtCliff && s.nation.fiscalSpace <= 0.05;
  if (austerity) out.push({ cause: 'funding', factor: 0.5, text: 'The treasury is empty and nobody will lend: every reform runs at half speed.', remedy: 'Find money: raise it (The Treasury, Raising money) or cut debt service. A new minister will not help.' });
  if (heldFactor(s, track.id) < 1) out.push({ cause: 'funding', factor: 0.6, text: 'You are holding back the budget release this reform spends through.', remedy: 'Release the sector in full (The Treasury, this year\'s budget).' });
  if (drawsOnInfra(track.id) && buildSpeed(s) < 1) out.push({ cause: 'funding', factor: buildSpeed(s), text: 'Contractors are owed for earlier work and have slowed down.', remedy: 'Pay the contractors\' arrears (The Treasury, What is owed).' });
  const ms = ministerSpeed(s, track.id);
  const min = ministerFor(track.id);
  if (ms < 0.98) out.push({ cause: 'execution', factor: ms, text: `${min ? 'The minister responsible is not up to it, or is sulking' : 'Nobody competent is in charge of it'}.`, remedy: 'Replace or win over the minister, or set up the delivery office to chase it.' });
  if (s.nation.capacity < 40) out.push({ cause: 'execution', factor: 0.8 + s.nation.capacity / 200, text: `The civil service is thin (capacity ${Math.round(s.nation.capacity)}): every reform moves slowly.`, remedy: 'Build capacity: the payroll audit, merit recruitment, digital government.' });
  if (s.counters[`injunct.${id}`] !== undefined && s.turn - (s.counters[`injunct.${id}`] ?? 0) < 6) out.push({ cause: 'obstruction', factor: 0.8, text: 'A court froze it at the request of someone who loses from it.', remedy: 'Fight the injunction on the merits, or settle with whoever brought it. Neither money nor a new minister changes a court order.' });
  for (const sh of activeShocks(s)) if (sh.factor > 0.3) { out.push({ cause: 'shock', factor: 0.9, text: `${sh.def.name} is absorbing the government's attention.`, remedy: 'Ride it out, or deal with the shock first; nothing about the reform itself is wrong.' }); break; }
  if (m.needs && !test(s, m.needs)) out.push({ cause: 'design', factor: 1, text: m.needsText ?? 'As designed, it cannot pass the vote at the end.', remedy: 'Change the politics before it reaches the vote, or it will fail however fast it moves.' });
  return out.sort((a, b) => a.factor - b.factor);
}
