// The record of what the President did, and what is known about it.

import { fill } from './text';
import type { ArchiveEntry, ExposureSpec, GameState } from './types';
import { applyFx } from './vars';

export function record(
  s: GameState, eventId: string, choiceId: string, category: ArchiveEntry['category'],
  headline: string, sig: 1 | 2 | 3, sealed = false,
): ArchiveEntry {
  const entry: ArchiveEntry = {
    id: `a${s.archive.length}`, turn: s.turn, eventId, choiceId, category,
    headline: fill(s, headline), sig, sealed, touches: {},
  };
  s.archive.push(entry);
  return entry;
}

export function addExposure(s: GameState, x: ExposureSpec, causeId: string, label: string): void {
  s.exposures.push({ ...x, turn: s.turn, causeId, label });
  if (x.kind === 'tolerated') s.counters.tolerated = (s.counters.tolerated ?? 0) + 1;
  applyFx(s, ['pressure.scandalHeat', 2 + x.trail * 2]);
}
