import { MILESTONE_BY_ID } from '../content/agenda';
import type { GameState } from './types';

/** The name in this country, including a restoration after a President undid it. */
export function reformName(s: GameState | null, id: string): string {
  const m = MILESTONE_BY_ID[id]?.m;
  if (!m) return id;
  return s?.flags[`reversed.${id}`] && !s.agenda.done.includes(id) ? `Restore: ${m.name[0].toLowerCase()}${m.name.slice(1)}` : m.name;
}
