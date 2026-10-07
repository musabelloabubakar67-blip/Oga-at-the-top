// A COUNTRY THAT CAN BE HANDED TO ANOTHER PLAYER (plan 16.A15, 16.A16)
// A finished presidency can be exported as a file: the whole country as it was
// left, with a structured handover. The outgoing player's letter is their
// interpretation; the verified handover notes are the record. They are kept
// apart, so the next player can see where the letter and the record disagree.
// The file carries a format version, the save schema version, the seed and a
// checksum: an altered file, or one made by a newer version of the game, is
// refused with a reason rather than loaded wrongly.

import { migrate, SAVE_VERSION } from './migrate';
import { handoverNotes, winnerOf } from './succession';
import type { GameState } from './types';

export const EXPORT_FORMAT = 'oga-country';
export const EXPORT_VERSION = 1;

export interface CountryFile {
  format: string;
  version: number;
  saveVersion: number;
  seed: number;
  /** FNV-1a of the state as written: detects edits. */
  checksum: string;
  handover: {
    president: string;
    party: string;
    ending: string;
    year: number;
    /** What the record says. */
    verified: string[];
    /** What the outgoing player says. Their interpretation, not the record. */
    letter: string;
    winner: string;
  };
  state: GameState;
}

function fnv(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}

/** The finished country, ready to hand to another player. */
export function exportCountry(s: GameState, letter: string): CountryFile {
  if (s.phase !== 'verdict') throw new Error('Only a finished presidency can be handed on.');
  const state = structuredClone(s);
  const body = JSON.stringify(state);
  return {
    format: EXPORT_FORMAT, version: EXPORT_VERSION, saveVersion: SAVE_VERSION, seed: s.seed ?? 0, checksum: fnv(body),
    handover: { president: s.president.name, party: s.president.party, ending: s.ending ?? 'term_limit', year: s.startYear, verified: handoverNotes(s), letter: letter.trim().slice(0, 4000), winner: winnerOf(s).how },
    state,
  };
}

export type ImportResult = { ok: true; prev: GameState; letter: string; verified: string[] } | { ok: false; reason: string };

/** Read a country file. Every refusal says why. */
export function importCountry(text: string): ImportResult {
  let f: CountryFile;
  try { f = JSON.parse(text); } catch { return { ok: false, reason: 'This is not a country file: it could not be read.' }; }
  if (!f || f.format !== EXPORT_FORMAT) return { ok: false, reason: 'This is not a country file from Oga at the Top.' };
  if (typeof f.version !== 'number' || f.version > EXPORT_VERSION) return { ok: false, reason: `This country was exported by a newer version of the game (file format ${f.version}; this game reads up to ${EXPORT_VERSION}). Update the game to inherit it.` };
  if (typeof f.saveVersion !== 'number' || f.saveVersion > SAVE_VERSION) return { ok: false, reason: `This country uses a newer save format (${f.saveVersion}; this game reads up to ${SAVE_VERSION}).` };
  if (!f.state || fnv(JSON.stringify(f.state)) !== f.checksum) return { ok: false, reason: 'This file has been altered since it was exported: its checksum does not match. A country cannot be inherited from an edited record.' };
  if ((f.state.seed ?? 0) !== f.seed) return { ok: false, reason: 'The file\'s seed does not match its state.' };
  const prev = migrate({ ...f.state, version: f.state.version ?? f.saveVersion });
  if (!prev) return { ok: false, reason: `This country's save format (${f.saveVersion}) cannot be migrated to this version of the game.` };
  if (prev.phase !== 'verdict') return { ok: false, reason: 'Only a finished presidency can be inherited.' };
  return { ok: true, prev, letter: f.handover?.letter ?? '', verified: f.handover?.verified ?? [] };
}
