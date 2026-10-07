// THE HISTORY BOOK (plan 17)
// The archive turned into causal threads: each reform, bet, institution,
// question, case, settlement and citizen has its own history, with each entry
// marked for what it was (announced, authorised, financed, delivered, failed;
// alleged or established; forecast or observed) and which government did it.
// The same verified facts are read by the government, the press, the
// opposition and the citizens, each in their own way. Nothing here is invented:
// every line comes from the record.

import { MILESTONE_BY_ID } from '../content/agenda';
import { CITIZENS } from '../content/citizens';
import { INSTITUTION_BY_ID } from '../content/institutions';
import { MYSTERY_BY_ID } from '../content/mysteries';
import { PROPOSAL_BY_ID } from '../content/proposals';
import { RIVAL_BY_ID } from '../content/people';
import { VENTURE_BY_ID } from '../content/ventures';
import { verdict } from './legacy';
import { reformName } from './reforms';
import type { ArchiveEntry, GameState } from './types';

export type Stage = 'announced' | 'authorised' | 'financed' | 'delivered' | 'failed' | 'reversed' | 'alleged' | 'established' | 'forecast' | 'observed' | 'agreed' | 'broken' | 'acted';
export const STAGE_NAME: Record<Stage, string> = {
  announced: 'Announced', authorised: 'Authorised', financed: 'Financed', delivered: 'Delivered', failed: 'Failed', reversed: 'Reversed',
  alleged: 'Alleged', established: 'Established', forecast: 'Forecast', observed: 'Observed', agreed: 'Agreed', broken: 'Broken', acted: 'Done',
};

export interface Entry { turn: number; text: string; stage: Stage; earlier: boolean }
export interface Thread { id: string; kind: 'reform' | 'bet' | 'institution' | 'question' | 'case' | 'agreement' | 'citizen' | 'court'; title: string; entries: Entry[]; status: string }

const STAGE_OF: Record<string, Stage> = { launch: 'announced', grease: 'authorised', done: 'delivered', failed: 'failed', reverse: 'reversed', won: 'delivered', partial: 'delivered', lost: 'failed', slip: 'announced', revive: 'announced', establish: 'delivered', rehead: 'acted', abolish: 'reversed', manager: 'acted' };

/** Every causal thread the record supports, newest activity first. */
export function threads(s: GameState): Thread[] {
  const by = new Map<string, Thread>();
  const add = (id: string, kind: Thread['kind'], title: string, e: Entry) => {
    const t = by.get(id) ?? { id, kind, title, entries: [], status: '' };
    t.entries.push(e);
    by.set(id, t);
  };
  for (const a of s.archive.filter((x) => !x.sealed)) {
    const [head, key] = a.eventId.split('.');
    const earlier = a.turn <= 0 || a.category === 'inherited';
    const stage = STAGE_OF[a.choiceId] ?? 'acted';
    if (head === 'reform' && MILESTONE_BY_ID[key]) {
      // A reform that needs the Assembly is authorised by the vote that delivers it.
      if (a.choiceId === 'done' && MILESTONE_BY_ID[key].m.needs) add(`reform.${key}`, 'reform', reformName(s, key), { turn: a.turn, text: 'The Assembly voted it through.', stage: 'authorised', earlier });
      add(`reform.${key}`, 'reform', reformName(s, key), { turn: a.turn, text: a.headline, stage, earlier });
      if (a.choiceId === 'launch' && MILESTONE_BY_ID[key].m.naira > 0) add(`reform.${key}`, 'reform', reformName(s, key), { turn: a.turn, text: 'Its cost was paid from the treasury.', stage: 'financed', earlier });
    } else if (head === 'venture' && VENTURE_BY_ID[key]) {
      add(`bet.${key}`, 'bet', VENTURE_BY_ID[key].name, { turn: a.turn, text: a.headline, stage, earlier });
      if (a.choiceId === 'launch') add(`bet.${key}`, 'bet', VENTURE_BY_ID[key].name, { turn: a.turn, text: 'Financed at launch.', stage: 'financed', earlier });
    } else if (head === 'institution' && INSTITUTION_BY_ID[key]) {
      add(`inst.${key}`, 'institution', INSTITUTION_BY_ID[key].name, { turn: a.turn, text: a.headline, stage, earlier });
    }
  }
  for (const i of s.institutions ?? []) for (const x of i.acts ?? []) add(`inst.${i.id}`, 'institution', INSTITUTION_BY_ID[i.id]?.name ?? i.id, { turn: x.turn, text: x.text, stage: 'acted', earlier: false });
  for (const q of s.inquiries ?? []) {
    const def = MYSTERY_BY_ID[q.id];
    if (!def) continue;
    add(`q.${q.id}.${q.opened}`, 'question', def.title, { turn: q.opened, text: def.question, stage: 'alleged', earlier: false });
    if (q.decided?.hypothesis) add(`q.${q.id}.${q.opened}`, 'question', def.title, { turn: q.decided.turn, text: `Concluded on ${q.decided.known} report${q.decided.known === 1 ? '' : 's'}: ${def.hypotheses.find((h) => h.id === q.decided!.hypothesis)?.text}`, stage: 'forecast', earlier: false });
    if (q.revealed) add(`q.${q.id}.${q.opened}`, 'question', def.title, { turn: q.revealed, text: def.hypotheses.find((h) => h.id === q.truth)?.response.resolves ?? '', stage: 'observed', earlier: false });
  }
  for (const c of s.cases ?? []) {
    add(`case.${c.id}`, 'case', `The case against ${c.name}`, { turn: c.opened, text: `Charged: ${c.what}.`, stage: 'alleged', earlier: false });
    if (c.outcome) add(`case.${c.id}`, 'case', `The case against ${c.name}`, { turn: c.closed ?? s.turn, text: `Verdict: ${c.outcome}.`, stage: c.outcome === 'convicted' ? 'established' : 'observed', earlier: false });
  }
  for (const j of s.judgments ?? []) add(`court.${j.turn}.${j.subject}`, 'court', `Judgment: ${j.subject}`, { turn: j.turn, text: j.reasoning, stage: 'established', earlier: false });
  for (const p of s.proposals ?? []) {
    const def = PROPOSAL_BY_ID[p.id];
    if (!def) continue;
    add(`prop.${p.id}.${p.opened}`, 'agreement', `${RIVAL_BY_ID[def.rival]?.name}'s proposal: ${def.title}`, { turn: p.opened, text: def.text, stage: 'announced', earlier: false });
    if (p.answer) add(`prop.${p.id}.${p.opened}`, 'agreement', `${RIVAL_BY_ID[def.rival]?.name}'s proposal: ${def.title}`, { turn: p.answered ?? s.turn, text: p.outcome ?? `Answered: ${p.answer}.`, stage: p.answer === 'adopt' || p.answer === 'negotiate' ? 'agreed' : 'acted', earlier: false });
  }
  for (const t of s.inheritance?.settlement?.terms ?? []) {
    const st = s.inheritance!.stances[t.id];
    add(`settle.${t.id}`, 'agreement', `Settlement term: ${t.text}`, { turn: 0, text: `Agreed by ${s.inheritance!.predecessor}${t.improper ? ', privately' : ''}.`, stage: 'agreed', earlier: true });
    if (st) add(`settle.${t.id}`, 'agreement', `Settlement term: ${t.text}`, { turn: s.turn, text: `This government ${st} it.`, stage: st === 'honoured' ? 'agreed' : 'broken', earlier: false });
  }
  for (const a of s.society?.acts ?? []) {
    const c = CITIZENS.find((x) => x.id === a.who);
    if (c) add(`cit.${c.id}`, 'citizen', `${c.name}, ${c.work.toLowerCase()}`, { turn: a.turn, text: a.text, stage: 'acted', earlier: false });
  }
  const out = [...by.values()];
  for (const t of out) {
    t.entries.sort((a, b) => a.turn - b.turn);
    const first = t.entries[0], last = t.entries[t.entries.length - 1];
    const crossed = first.earlier && !last.earlier;
    t.status = `${STAGE_NAME[last.stage]}${crossed ? ', begun by an earlier government and continued by this one' : first.earlier ? ', by an earlier government' : ''}`;
  }
  return out.sort((a, b) => (b.entries[b.entries.length - 1]?.turn ?? 0) - (a.entries[a.entries.length - 1]?.turn ?? 0));
}

/** The decisions in the record that moved something: how a current dispute came to exist. */
export function whyExists(s: GameState, paths: string[]): ArchiveEntry[] {
  return s.archive.filter((a) => !a.sealed && paths.some((p) => a.touches[p] !== undefined)).slice(-6);
}

/** The paths a thread's subject turns on, for tracing why it is contested. */
export function pathsFor(t: Thread): string[] {
  const [kind, id] = t.id.split('.');
  if (kind === 'prop') { const def = PROPOSAL_BY_ID[t.id.split('.').slice(1, -1).join('.')]; return def ? [...def.campaign.map(([p]) => p), ...def.adopt.map(([p]) => p)] : []; }
  if (kind === 'reform') return (MILESTONE_BY_ID[id]?.m.done ?? []).map(([p]) => p);
  if (kind === 'bet') return (VENTURE_BY_ID[id]?.win ?? []).map(([p]) => p);
  return [];
}

/** The same verified thread, as four parties read it. */
export function readings(t: Thread): { who: string; text: string }[] {
  const last = t.entries[t.entries.length - 1];
  const failed = ['failed', 'reversed', 'broken'].includes(last.stage);
  const doneIt = ['delivered', 'established', 'agreed'].includes(last.stage);
  return [
    { who: 'The government', text: failed ? 'A setback, inherited conditions, lessons learned.' : doneIt ? 'Delivered, as promised.' : 'On course.' },
    { who: 'The press', text: failed ? `It failed: ${last.text}` : doneIt ? `It happened: ${last.text} The cost and the delays are in our archive.` : `Still not done: ${t.entries.length} stages, ${last.turn - t.entries[0].turn} months.` },
    { who: 'The opposition', text: failed ? 'We warned them.' : doneIt ? 'Late, over budget, and ours first.' : 'Another announcement.' },
    { who: 'The citizens', text: failed ? 'Nothing changed where we live.' : doneIt ? 'Some of us noticed. Not all.' : 'We will believe it when we see it.' },
  ];
}

/** A shareable extract: the verdict, grounded in what happened, misconduct included. */
export function shareText(s: GameState): string {
  const v = verdict(s);
  const lines = [
    `Oga at the Top: President ${s.president.name} (${s.president.party}), ${v.years}.`,
    `"${v.epithet}". ${v.dims.map((d) => `${d.name}: ${d.grade}`).join('; ')}.`,
    ...(v.defining.length ? [`Remembered for: ${v.defining.slice(0, 3).join('; ')}.`] : []),
    `After office: ${v.after.title}.`,
  ];
  // Misconduct is part of the record and is never left out of a shared verdict.
  if (v.ledger && (v.ledger.personal >= 1 || v.ledger.political >= 1 || v.ledger.tolerated)) lines.push(`The private ledger: ₦${Math.round(v.ledger.personal)}bn kept, ₦${Math.round(v.ledger.political)}bn in political money, looked away ${v.ledger.tolerated} time${v.ledger.tolerated === 1 ? '' : 's'}.`);
  if (s.flags['short.met'] !== undefined) lines.push(`Short scenario goal: ${s.flags['short.met'] ? 'met' : 'not met'}.`);
  lines.push(`Seed ${s.seed ?? 0}, ${s.setup.scenario ?? 'standard'}.`);
  return lines.join('\n');
}

/** What sits on the desk: objects that only exist because of what this government did. */
export function deskObjects(s: GameState): string[] {
  const out: string[] = [];
  if (s.ventures.won.some((id) => id.startsWith('refinery'))) out.push('A sealed bottle of the first petrol from the revived refinery');
  if (s.flags['constitution.new']) out.push('A signed copy of the new constitution');
  if ((s.judgments ?? []).some((j) => !j.upheld)) out.push('A judgment that went against you, framed by a lawyer as a joke');
  if (s.ventures.won.includes('rail')) out.push('A train ticket, Lagos to Kano, first class, unused');
  if ((s.military?.refused ?? 0) > 0) out.push('A letter from the Chief of Defence Staff, declining an order');
  if (s.agenda.done.length >= 20) out.push('A wall chart of reforms, most of them ticked');
  if (s.purseTaken.personal >= 10) out.push('A drawer that is locked, and a key you keep on your person');
  if (s.inheritance?.letter) out.push(`A letter from ${s.inheritance.predecessor}, read more than once`);
  return out;
}

// ---------------------------------------------------------------- shared starting conditions

/** Today's country: the same seed for everyone on the same day. */
export function dailySeed(d = new Date()): number {
  return d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
}

/** A code that reproduces a starting position exactly: seed, scenario and the choices that shape the opening. */
export function encodeStart(x: { seed: number; scenario?: string; background?: string; home?: string }): string {
  return `${x.seed}-${x.scenario ?? 'standard'}-${x.background ?? 'governor'}-${x.home ?? 'KN'}`;
}

export function decodeStart(code: string): { seed: number; scenario: string; background: string; home: string } | null {
  const m = code.trim().match(/^(\d{1,9})-([a-z]+)-([a-z]+)-([A-Z]{2})$/);
  return m ? { seed: Number(m[1]), scenario: m[2], background: m[3], home: m[4] } : null;
}
