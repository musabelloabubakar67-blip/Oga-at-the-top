import { BLOCKED_NAMES } from '../content/talent';
import type { ZoneId } from './types';

export interface GeneratedName { first: string; last: string; title: string; zone: ZoneId }
export interface NameBank { firsts: readonly string[]; lasts: readonly string[]; titles: readonly string[]; zone: ZoneId }
export const fullGeneratedName = (n: GeneratedName) => `${n.title} ${n.first} ${n.last}`;

/** Keep ordinary seeded draws; exhausted retries scan vetted banks without more dice. */
export function chooseGeneratedName(draw: () => GeneratedName, banks: readonly NameBank[], used: ReadonlySet<string>, attempts: number): GeneratedName {
  const available = (n: GeneratedName) => !BLOCKED_NAMES.has(`${n.first} ${n.last}`) && !used.has(fullGeneratedName(n));
  for (let i = 0; i < attempts; i++) { const n = draw(); if (available(n)) return n; }
  for (const bank of banks) for (const first of bank.firsts) for (const last of bank.lasts) for (const title of bank.titles) {
    const n = { first, last, title, zone: bank.zone }; if (available(n)) return n;
  }
  throw new Error('No unused, unblocked generated name remains in the vetted banks');
}
