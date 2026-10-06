import { CANDIDATES } from '../content/candidates';
import { PERSON_BY_ID } from '../content/people';
import { TYCOON_BY_ID } from '../content/tycoons';
import { CFG } from './config';
import { CONTRACT_VERSION, GOVERNANCE_SCHEMA_VERSION } from './contracts';
import type { ActorRef, GovernanceState, GovernanceView, PersonId, PresidencyMonth, WorldClock, WorldMonth } from './contracts';
import type { GameState } from './types';

function legacyIdentity(g: GovernanceState, office: string, name: string): void {
  // Names identify legacy occupants only. New candidate APIs will supply canonical IDs.
  const source = office === 'president' ? `${office}:${g.administrationId}` : office;
  const id = `legacy:${encodeURIComponent(source)}:${encodeURIComponent(name)}`;
  g.persons[id] ??= { id, name, legacyKey: office };
  g.offices[office] = id;
}

/** Initialise old saves without inventing an exact historical elapsed duration. */
export function ensureGovernance(s: GameState, exactNewWorld = false): GovernanceState {
  if (s.governance && (s.governance.schemaVersion !== GOVERNANCE_SCHEMA_VERSION || s.governance.contractVersion !== CONTRACT_VERSION)) {
    throw new Error('Unsupported governance save or contract version');
  }
  const g = s.governance ??= {
    schemaVersion: GOVERNANCE_SCHEMA_VERSION,
    contractVersion: CONTRACT_VERSION,
    originMonth: Math.max(0, (s.startYear - CFG.startYear) * 12),
    clockAccuracy: exactNewWorld ? 'exact' : 'estimated-legacy',
    administrationId: `administration:${s.era}`,
    persons: {}, offices: {}, episodes: {}, requests: {}, commitments: {},
  };
  if (!Number.isSafeInteger(g.originMonth) || g.originMonth < 0 || !g.persons || !g.offices || !g.episodes || !g.requests || !g.commitments) {
    throw new Error('Invalid governance save');
  }
  // No longer occupied offices are removed; the historical person registry remains.
  const occupied = new Set<string>();
  const bind = (office: string, name: string) => {
    occupied.add(office);
    const named = office !== 'president' ? CANDIDATES.find((c) => c.name === name) : undefined;
    if (named) {
      g.persons[named.id] ??= { id: named.id, name };
      g.offices[office] = named.id;
      return;
    }
    const current = g.persons[g.offices[office]];
    if (!current || current.name !== name) legacyIdentity(g, office, name);
  };
  bind('president', s.president.name);
  for (const [id, p] of Object.entries(s.people)) if (!p.gone) bind(id, p.name ?? PERSON_BY_ID[id]?.name ?? id);
  for (const [id, c] of Object.entries(s.chars)) bind(`adviser:${id}`, c.name);
  for (const id of Object.keys(s.tycoons)) bind(id, TYCOON_BY_ID[id]?.name ?? id);
  if (s.vp) bind('vp', s.vp.name);
  for (const office of Object.keys(g.offices)) if (!occupied.has(office)) delete g.offices[office];
  return g;
}

export function clockOf(s: GameState): WorldClock {
  const g = s.governance;
  return {
    worldMonth: (g?.originMonth ?? Math.max(0, (s.startYear - CFG.startYear) * 12)) + Math.max(0, s.turn - 1),
    presidencyMonth: Math.max(0, s.turn - 1),
    administrationId: g?.administrationId ?? `administration:${s.era}`,
    accuracy: g?.clockAccuracy ?? 'estimated-legacy',
  };
}

export function presidencyMonthToWorld(s: GameState, month: PresidencyMonth): WorldMonth {
  if (!Number.isSafeInteger(month) || month < 0) throw new Error('Invalid presidency month');
  const clock = clockOf(s);
  return clock.worldMonth - clock.presidencyMonth + month;
}

/** Historical world dates can precede this presidency and therefore return negative months. */
export function worldMonthToPresidency(s: GameState, month: WorldMonth): PresidencyMonth {
  if (!Number.isSafeInteger(month) || month < 0) throw new Error('Invalid world month');
  const clock = clockOf(s);
  return month - (clock.worldMonth - clock.presidencyMonth);
}

export function resolveActor(s: GameState, ref: ActorRef): PersonId {
  const g = ensureGovernance(s);
  const id = 'person' in ref ? ref.person : g.offices[ref.office];
  if (!id || !g.persons[id]) throw new Error('Unknown person or unoccupied office');
  return id;
}

/** Carry world records, but never assert that a new officeholder is the old person. */
export function inheritGovernance(s: GameState, previous: GameState): void {
  const prev = structuredClone(previous);
  const g = ensureGovernance(prev);
  s.governance = structuredClone(g);
  s.governance.originMonth = g.originMonth + Math.max(1, prev.turn - 1);
  s.governance.administrationId = `administration:${s.era}`;
  s.governance.offices = {};
  ensureGovernance(s);
}

export function markCommitmentsDue(s: GameState): void {
  const g = ensureGovernance(s);
  const now = clockOf(s).worldMonth;
  for (const c of Object.values(g.commitments)) if (c.status === 'open' && c.due <= now) c.status = 'review-due';
}

/** Detached serialisable view. Calling it never mutates the input state. */
export function getGovernanceView(s: GameState): GovernanceView {
  const copy = structuredClone(s);
  markCommitmentsDue(copy);
  const g = ensureGovernance(copy);
  return {
    contractVersion: CONTRACT_VERSION, clock: clockOf(copy),
    persons: Object.values(g.persons), offices: { ...g.offices },
    episodes: Object.values(g.episodes), requests: Object.values(g.requests),
    commitments: Object.values(g.commitments),
  };
}
