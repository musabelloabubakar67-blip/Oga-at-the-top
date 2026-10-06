// HOW THE COURT DECIDES (plan 04.A7)
// A case is decided on four questions: did the government have the authority,
// is the evidence enough, what has the court held before, and were those
// affected heard? Each justice weighs them by their legal philosophy and
// procedural standards; a sympathy for or against the government moves them a
// little; a justice of low integrity who bends can be moved a lot. The
// judgment explains which question decided it, and who dissented.

import { PHILOSOPHY_NAME, PROFILE, type JudicialProfile, type Philosophy } from '../content/courts';
import type { Justice } from './courts';
import type { GameState } from './types';

/** The facts of a case, each from 0 (against the government) to 1 (for it). */
export interface Facts {
  authority: number;
  evidence: number;
  precedent: number;
  procedure: number;
  /** What the case is about, for the judgment. */
  subject: string;
  /** Plain words for each fact, as the judgment would put them. */
  says: { authority: [string, string]; evidence: [string, string]; precedent: [string, string]; procedure: [string, string] };
  /** Whether someone with money or the government's ear has leaned on the bench. */
  pressedBy?: 'government' | 'challenger';
}

const WEIGHTS: Record<Philosophy, { authority: number; evidence: number; precedent: number; procedure: number; defer: number }> = {
  textual: { authority: 0.5, evidence: 0.2, precedent: 0.15, procedure: 0.15, defer: 0 },
  purposive: { authority: 0.25, evidence: 0.3, precedent: 0.25, procedure: 0.2, defer: 0 },
  deferential: { authority: 0.35, evidence: 0.25, precedent: 0.2, procedure: 0.2, defer: 0.15 },
  rights: { authority: 0.2, evidence: 0.3, precedent: 0.1, procedure: 0.4, defer: -0.05 },
};

/** A justice's profile: authored for the named ones, derived for the Court of Appeal's nominees. */
export function profileOf(j: Pick<Justice, 'short' | 'name' | 'lean' | 'integrity'>): JudicialProfile {
  const p = PROFILE[j.short];
  if (p) return p;
  let h = 0;
  for (const c of j.name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const phil: Philosophy[] = j.lean === 'you' ? ['deferential', 'deferential', 'purposive', 'textual'] : ['textual', 'purposive', 'rights', 'deferential'];
  return { philosophy: phil[h % 4], procedure: Math.max(1, Math.min(5, j.integrity - 1 + (h % 3))), admin: 1 + (h >> 3) % 5, pressure: j.integrity <= 2 ? 'bends' : 'firm' };
}

export interface Vote { justice: Justice; forGovt: boolean; score: number; decisive: keyof Omit<Facts, 'subject' | 'says' | 'pressedBy'> }

/** How one justice votes, and the question that weighed most with them. */
export function justiceVote(j: Justice, f: Facts): Vote {
  const p = profileOf(j);
  const w = { ...WEIGHTS[p.philosophy] };
  w.procedure *= 0.7 + p.procedure * 0.12;
  const total = w.authority + w.evidence + w.precedent + w.procedure;
  const parts = { authority: f.authority * w.authority, evidence: f.evidence * w.evidence, precedent: f.precedent * w.precedent, procedure: f.procedure * w.procedure };
  let score = (parts.authority + parts.evidence + parts.precedent + parts.procedure) / total + w.defer;
  // A sympathy, not a vote.
  score += j.lean === 'you' ? 0.08 : j.lean === 'them' ? -0.08 : 0;
  // A justice who bends goes the way of whoever leans on them.
  if (p.pressure === 'bends' && j.integrity <= 2 && f.pressedBy) score += f.pressedBy === 'government' ? 0.3 : -0.3;
  const forGovt = score >= 0.5;
  // The question that decided it for this justice: the strongest reason on their side.
  const keys = Object.keys(parts) as (keyof typeof parts)[];
  const decisive = keys.sort((a, b) => (forGovt ? (f[b] * (w as Record<string, number>)[b]) - (f[a] * (w as Record<string, number>)[a]) : ((1 - f[b]) * (w as Record<string, number>)[b]) - ((1 - f[a]) * (w as Record<string, number>)[a])))[0];
  return { justice: j, forGovt, score, decisive };
}

export interface Judgment { upheld: boolean; for: number; against: number; reasoning: string; votes: Vote[] }

/** The bench decides, and writes down why. */
export function decide(js: Justice[], f: Facts): Judgment {
  const votes = js.map((j) => justiceVote(j, f));
  const forG = votes.filter((v) => v.forGovt).length, against = votes.length - forG;
  const upheld = forG > against;
  const majority = votes.filter((v) => v.forGovt === upheld);
  const counts = new Map<string, number>();
  for (const v of majority) counts.set(v.decisive, (counts.get(v.decisive) ?? 0) + 1);
  const ground = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as keyof Facts['says'];
  const lead = majority.find((v) => v.decisive === ground)?.justice ?? majority[0]?.justice;
  const dissent = votes.filter((v) => v.forGovt !== upheld);
  const said = f.says[ground]?.[upheld ? 1 : 0] ?? '';
  const reasoning = `${upheld ? 'Upheld' : 'Struck down'}, ${Math.max(forG, against)} to ${Math.min(forG, against)}. ${lead ? `${lead.name}, who ${PHILOSOPHY_NAME[profileOf(lead).philosophy]}, wrote for the majority: ` : ''}${said}${dissent.length ? ` ${dissent.map((d) => d.justice.short).join(' and ')} dissented${dissent.length === 1 ? `, on ${dissent[0].decisive}` : ''}.` : ''}`;
  return { upheld, for: forG, against, reasoning, votes };
}

/** How long the bench takes: good administrators decide on time. */
export function benchSpeed(js: Justice[]): number {
  if (!js.length) return 1;
  return js.reduce((a, j) => a + profileOf(j).admin, 0) / js.length / 3;
}

export const factName = { authority: 'authority', evidence: 'evidence', precedent: 'precedent', procedure: 'procedure' };
export type { GameState };
