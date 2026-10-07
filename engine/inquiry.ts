// WHAT WAS KNOWN, WHAT WAS DECIDED, AND WHAT TURNED OUT TO BE TRUE (plan 08)
// A question opens with the truth already settled by the state of the country,
// unseen. Reports arrive from sources that see different parts of it, each with
// a date, a confidence, an incentive and a scope. The President decides when
// they choose, on what they have; what was known is recorded with the
// decision. Three months later the truth comes out, and every report is traced:
// which pointed the right way, which did not, and why.

import { METHODS, MYSTERIES, MYSTERY_BY_ID, type Method, type Mystery } from '../content/mysteries';
import { rand } from './rng';
import type { GameState } from './types';
import { applyFx, clamp, test } from './vars';

export interface Report { method: Method; turn: number; says: string | null; text: string; confidence: 'low' | 'medium' | 'high' }

export interface Inquiry {
  id: string;
  opened: number;
  /** Settled when the question opens; unseen until the reveal. */
  truth: string;
  reports: Report[];
  probing: { method: Method; due: number }[];
  decided?: { turn: number; hypothesis: string; known: number; support: number; against: number };
  revealed?: number;
  right?: boolean;
}

export const REVEAL_AFTER = 3;

/** A specific, attributed report rather than an assertion drawn from the general mood (plan 01.A7): once the
 *  identity rails exist and integrity is low, a newspaper may publish records offered for sale. It is an allegation. */
function breachTick(s: GameState): void {
  if (s.flags['data.breach'] || !s.agenda.done.includes('d4') || s.nation.integrity >= 38) return;
  if (rand(s) >= 0.04) return;
  s.flags['data.breach'] = 'alleged';
  s.news.push({ chronicle: 'IDENTITY RECORDS OFFERED FOR SALE ONLINE, NEWSPAPER REPORTS', street: 'DEM DEY SELL OUR DATA? — NEWSPAPER', weight: 5, valence: -1, topic: 'scandal', body: 'The Federal Chronicle has published samples of what it says are identity records offered for sale. The identity agency denies any breach. Nobody has yet investigated.' });
}
/** Months a question can stay undecided before events overtake it. */
export const LAPSE_AFTER = 6;

const confidenceOf = (m: Method): Report['confidence'] => (METHODS[m].accuracy >= 0.8 ? 'high' : METHODS[m].accuracy >= 0.6 ? 'medium' : 'low');

export function inquiries(s: GameState): Inquiry[] {
  return (s.inquiries ??= []);
}

/** What one source finds: within its scope it is usually right; outside it, it can only rule things out. */
function findings(s: GameState, q: Inquiry, m: Method): Report {
  const def = MYSTERY_BY_ID[q.id];
  const scope = def.scope[m];
  const name = (h: string) => def.hypotheses.find((x) => x.id === h)!.text;
  const base = { method: m, turn: s.turn, confidence: confidenceOf(m) };
  if (!scope.includes(q.truth)) {
    // It cannot see the real cause, but it can say what it did not find. A biased source still names its favourite.
    if (m === 'claim') return { ...base, says: scope[0], text: `${METHODS[m].source}: "${name(scope[0])}"` };
    return { ...base, says: null, text: `${METHODS[m].source}: nothing found supports ${scope.map((h) => `"${name(h).replace(/\.$/, '')}"`).join(' or ')}.` };
  }
  const right = rand(s) < METHODS[m].accuracy;
  const wrongs = scope.filter((h) => h !== q.truth);
  const says = right || !wrongs.length ? q.truth : (m === 'claim' ? wrongs[0] : wrongs[Math.floor(rand(s) * wrongs.length)]);
  return { ...base, says, text: `${METHODS[m].source}: "${name(says)}"` };
}

/** Monthly: questions open, inquiries report, waiting costs, and decisions meet the truth. */
export function inquiryTick(s: GameState): void {
  breachTick(s);
  const list = inquiries(s);
  const open = list.filter((q) => !q.decided);
  for (const m of MYSTERIES) {
    if (open.length >= 2) break;
    const last = list.filter((q) => q.id === m.id).pop();
    if (last && s.turn - last.opened < 24) continue;
    if (!test(s, m.when)) continue;
    const truth = m.truth.find((t) => test(s, t.when))?.is ?? m.otherwise;
    const q: Inquiry = { id: m.id, opened: s.turn, truth, reports: [], probing: [] };
    q.reports.push(findings(s, q, 'claim'));
    list.push(q);
    open.push(q);
    s.report.push({ kind: 'consequence', title: `A question: ${m.title}`, text: `${m.question} The ministry has given its account. Commission an inquiry, or decide on what you have (The register, Questions).`, changes: [] });
  }
  for (const q of list) {
    const def = MYSTERY_BY_ID[q.id];
    for (const p of q.probing.filter((x) => x.due <= s.turn)) q.reports.push(findings(s, q, p.method));
    q.probing = q.probing.filter((x) => x.due > s.turn);
    if (!q.decided) {
      for (const f of def.waiting) applyFx(s, f);
      // Undecided for too long, events overtake it: the truth comes out without a decision, and the delay is on the record.
      if (s.turn - q.opened >= LAPSE_AFTER) {
        q.decided = { turn: s.turn, hypothesis: '', known: q.reports.length, support: 0, against: 0 };
        q.right = false;
        q.revealed = s.turn;
        const truth = MYSTERY_BY_ID[q.id].hypotheses.find((h) => h.id === q.truth)!;
        s.report.push({ kind: 'failure', title: `Overtaken by events: ${def.title.toLowerCase()}`, text: `You did not decide in ${LAPSE_AFTER} months, and the question answered itself in the papers. ${truth.response.resolves} Nothing was done about it.`, changes: [] });
      }
    }
    if (q.decided && !q.revealed && s.turn - q.decided.turn >= REVEAL_AFTER) reveal(s, q);
  }
}

export function canProbe(s: GameState, id: string, m: Method, moves: number): { ok: boolean; reason?: string } {
  const q = inquiries(s).find((x) => x.id === id && !x.decided);
  if (!q) return { ok: false };
  if (q.probing.some((p) => p.method === m) || q.reports.some((r) => r.method === m)) return { ok: false, reason: 'Already asked.' };
  const d = METHODS[m];
  if (moves <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < d.pc) return { ok: false, reason: `Needs ${d.pc} political capital.` };
  return { ok: true };
}

/** Commission a source. Its report arrives when it is ready, not now. */
export function probe(s: GameState, id: string, m: Method): string {
  const q = inquiries(s).find((x) => x.id === id)!;
  const d = METHODS[m];
  s.pc = clamp(s.pc - d.pc, 0, 100);
  s.desk.actionsUsed += 1;
  if (d.naira) applyFx(s, ['nation.fiscalSpace', -d.naira]);
  if (d.months === 0) { q.reports.push(findings(s, q, m)); return `${d.name}: it is on your desk.`; }
  q.probing.push({ method: m, due: s.turn + d.months });
  return `${d.name} is commissioned. It reports in ${d.months} month${d.months === 1 ? '' : 's'}; until then the problem goes on.`;
}

/** Decide on what is known now. What was known is recorded with the decision. */
export function decideInquiry(s: GameState, id: string, hypothesis: string): string {
  const q = inquiries(s).find((x) => x.id === id && !x.decided)!;
  const def = MYSTERY_BY_ID[id];
  const h = def.hypotheses.find((x) => x.id === hypothesis)!;
  const support = q.reports.filter((r) => r.says === hypothesis).length;
  const against = q.reports.filter((r) => r.says && r.says !== hypothesis).length;
  q.decided = { turn: s.turn, hypothesis, known: q.reports.length, support, against };
  q.right = hypothesis === q.truth;
  for (const f of q.right ? h.response.right : h.response.wrong) applyFx(s, f);
  s.desk.actionsUsed += 1;
  return `${h.response.label}. You decided on ${q.reports.length} report${q.reports.length === 1 ? '' : 's'}, ${support} pointing this way and ${against} another. Whether it was the right reading will be clear in about ${REVEAL_AFTER} months.`;
}

/** The truth comes out, and every report is traced. */
function reveal(s: GameState, q: Inquiry): void {
  const def = MYSTERY_BY_ID[q.id];
  q.revealed = s.turn;
  const truth = def.hypotheses.find((h) => h.id === q.truth)!;
  const lines = q.reports.map((r) => `${METHODS[r.method].name} (${r.confidence} confidence): ${r.says === q.truth ? 'pointed the right way' : r.says === null ? 'correctly found nothing within its sight' : `pointed the wrong way: ${METHODS[r.method].incentive.charAt(0).toLowerCase()}${METHODS[r.method].incentive.slice(1)}`}.`);
  const contradicted = def.announced && def.announced.is !== q.truth ? ` ${def.announced.text} It was wrong, and the press has the dates.` : '';
  if (contradicted) applyFx(s, ['bloc.press', -2]);
  if (q.right && truth.implicates && s.tycoons[truth.implicates]) s.flags[`dirty.${truth.implicates}.inquiry`] = true;
  s.report.push({ kind: q.right ? 'reform' : 'failure', title: `What really happened: ${def.title.toLowerCase()}`,
    text: `${truth.response.resolves} You ${q.right ? 'read it right' : 'read it wrong'}, deciding on ${q.decided!.known} report${q.decided!.known === 1 ? '' : 's'}. ${lines.join(' ')}${contradicted}`, changes: [] });
}

/** For the register: what each source would cost and how far it can see. */
export function methodsFor(id: string): { method: Method; can: string[] }[] {
  const def: Mystery = MYSTERY_BY_ID[id];
  return (Object.keys(METHODS) as Method[]).filter((m) => m !== 'claim').map((m) => ({ method: m, can: def.scope[m] }));
}
