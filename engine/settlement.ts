// SUCCESSION AS A STRATEGY, AND THE SETTLEMENT THAT OUTLIVES THE PRESIDENT (plan 16)
// While governing, the President can test candidates with delegated work,
// negotiate endorsements, and judge each on separate qualities: competence,
// electoral appeal, coalition acceptance, loyalty and commitment to the
// programme. Before leaving, the President can negotiate a settlement with the
// successor (or, when defeated, with the winner): policies to keep, appointments
// to respect, unfinished work to finish, protections to leave in place, and,
// improperly, private protection or patronage. The successor inherits it with a
// dossier built from the record, and decides, on the evidence, what to honour,
// renegotiate, break or investigate. Success is judged on the programme's
// survival and the successor's own record, separately from the former
// President's personal safety.

import { MILESTONE_BY_ID } from '../content/agenda';
import { INSTITUTION_BY_ID } from '../content/institutions';
import { PERSON_BY_ID } from '../content/people';
import { TYCOON_BY_ID } from '../content/tycoons';
import { VENTURE_BY_ID } from '../content/ventures';
import { rules } from './constitution';
import { reformName } from './reforms';
import { rand } from './rng';
import { candidate } from './successor';
import type { GameState } from './types';
import { applyFx, clamp, standing } from './vars';

// ---------------------------------------------------------------- the candidates, on separate qualities

export interface Profile { id: string; name: string; competence: number; appeal: number; acceptance: number; loyalty: number; commitment: number; integrity: number; notes: string[] }

const TEMPER_COMMIT: Record<string, number> = { loyal: 0.7, principled: 0.6, ambitious: 0.35, transactional: 0.45 };

/** How a possible successor stands on each quality that matters, kept apart. */
export function profileOf(s: GameState, id: string): Profile {
  const c = candidate(s, id);
  const p = PERSON_BY_ID[id];
  const notes: string[] = [];
  const competence = id === 'vp' ? s.vp?.competence ?? 3 : id === 'fin' ? s.chars.fin?.competence ?? 3 : (s.people[id]?.competence ?? p?.competence ?? 3);
  const governors = ['gov_nw', 'gov_ne', 'gov_nc', 'gov_sw', 'gov_se', 'gov_ss'].filter((g) => s.people[g] && !s.people[g].gone).map((g) => standing(s, g));
  let acceptance = s.blocs.party * 0.5 + (governors.reduce((a, x) => a + x, 0) / Math.max(1, governors.length)) * 0.3 + (p?.clout ?? 3) * 4;
  const endorsed = (s.counters[`endorse.${id}.party`] ? 1 : 0) + (s.counters[`endorse.${id}.governors`] ? 1 : 0);
  acceptance += endorsed * 8;
  if (endorsed) notes.push(`Endorsed by ${endorsed === 2 ? 'the party and the governors' : s.counters[`endorse.${id}.party`] ? 'the party' : 'the governors'}`);
  let commitment = id === 'vp' ? 0.55 : id === 'fin' ? 0.6 : TEMPER_COMMIT[p?.temper ?? 'transactional'] ?? 0.5;
  commitment += Math.min(0.2, c.groomed * 0.03 + (s.counters[`credits.${id}`] ?? 0) * 0.04);
  const tested = s.flags[`tested.${id}`];
  if (tested === 'passed') notes.push('Passed a delegated test: ran a hard brief and delivered');
  if (tested === 'failed') notes.push('Failed a delegated test, in public');
  if (commitment >= 0.65) notes.push('Would carry your programme forward');
  else if (commitment < 0.45) notes.push('Has their own programme, and would keep only what suits it');
  return { id, name: c.name, competence, appeal: c.strength, acceptance: Math.round(clamp(acceptance, 0, 100)), loyalty: c.loyalty, commitment: Math.round(clamp(commitment, 0, 1) * 100) / 100, integrity: c.integrity, notes };
}

// ---------------------------------------------------------------- testing and endorsing

export const TEST_PC = 3;
export const TEST_MONTHS = 4;
export const ENDORSE_PC = 4;

export function canTest(s: GameState, id: string, moves: number): { ok: boolean; reason?: string } {
  if (s.flags[`tested.${id}`] || s.counters[`testing.${id}`] !== undefined) return { ok: false, reason: 'Already tested.' };
  if (moves <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < TEST_PC) return { ok: false, reason: `Needs ${TEST_PC} political capital.` };
  return { ok: true };
}

/** Give a candidate a hard brief for four months, in public. Competence decides how it goes, and the country sees it. */
export function testCandidate(s: GameState, id: string): string {
  s.pc = clamp(s.pc - TEST_PC, 0, 100);
  s.desk.actionsUsed += 1;
  s.counters[`testing.${id}`] = s.turn + TEST_MONTHS;
  return `${profileOf(s, id).name} is given the hardest brief in the government for ${TEST_MONTHS} months, in public. How it goes will be seen by everyone, including the party.`;
}

export function canEndorse(s: GameState, id: string, from: 'party' | 'governors', moves: number): { ok: boolean; reason?: string } {
  if (s.counters[`endorse.${id}.${from}`]) return { ok: false, reason: 'Already secured.' };
  if (moves <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < ENDORSE_PC) return { ok: false, reason: `Needs ${ENDORSE_PC} political capital.` };
  return { ok: true };
}

/** Negotiate an endorsement. It improves the candidate's prospects; it cannot guarantee them. */
export function endorse(s: GameState, id: string, from: 'party' | 'governors'): string {
  s.pc = clamp(s.pc - ENDORSE_PC, 0, 100);
  s.desk.actionsUsed += 1;
  s.counters[`endorse.${id}.${from}`] = s.turn;
  // Endorsements are bought with promises: the party wants posts, the governors want projects.
  if (from === 'party') applyFx(s, ['bloc.party', -2]); else applyFx(s, ['nation.fiscalSpace', -0.1]);
  return `${from === 'party' ? 'The party executive' : 'The governors'} agree to endorse ${profileOf(s, id).name}, for a price: ${from === 'party' ? 'posts in the next government' : 'projects in their states'}.`;
}

// ---------------------------------------------------------------- the settlement

export type TermKind = 'policy' | 'appointment' | 'unfinished' | 'protection' | 'private' | 'patronage';
export interface Term { id: string; kind: TermKind; ref: string; text: string; public: boolean; improper: boolean; stateObligation?: boolean }
export interface Settlement { with: string; withName: string; kind: 'heir' | 'rival'; terms: Term[]; turn: number }

/** What could be put into a settlement now, drawn from the record. */
export function termOptions(s: GameState): Term[] {
  const out: Term[] = [];
  for (const id of s.agenda.done.filter((r) => MILESTONE_BY_ID[r]?.m.reversal || (MILESTONE_BY_ID[r]?.m.start ?? []).some(([, v]) => v < 0)).slice(-5)) {
    out.push({ id: `policy.${id}`, kind: 'policy', ref: id, text: `Keep "${reformName(s, id)}" in force`, public: true, improper: false });
  }
  for (const a of s.agenda.active.slice(0, 3)) out.push({ id: `unfinished.${a.id}`, kind: 'unfinished', ref: a.id, text: `Finish "${reformName(s, a.id)}"`, public: true, improper: false });
  for (const v of s.ventures.active.slice(0, 2)) out.push({ id: `unfinished.${v.id}`, kind: 'unfinished', ref: v.id, text: `Finish ${VENTURE_BY_ID[v.id]?.name ?? v.id}`, public: true, improper: false });
  for (const i of (s.institutions ?? []).slice(0, 3)) out.push({ id: `appointment.${i.id}`, kind: 'appointment', ref: i.id, text: `Keep ${i.head.name} at ${INSTITUTION_BY_ID[i.id]?.name.replace(/^(A|An|The) /, 'the ').toLowerCase()}`, public: true, improper: false });
  for (const r of rules(s).filter((x) => !x.entrenched).slice(0, 2)) out.push({ id: `protection.${r.id}`, kind: 'protection', ref: r.id, text: `Leave "${r.name.toLowerCase()}" in force`, public: true, improper: false });
  for (const [id, t] of Object.entries(s.tycoons).filter(([, t]) => t.granted).slice(0, 2)) {
    // A licence granted in law is the state's obligation; a promise made to a friend is a personal favour.
    out.push({ id: `patronage.${id}`, kind: 'patronage', ref: id, text: `Honour ${TYCOON_BY_ID[id]?.name ?? id}'s licence`, public: true, improper: false, stateObligation: true });
  }
  for (const f of s.favours.filter((x) => x.dir === 'owing').slice(0, 2)) out.push({ id: `patronage.favour.${f.id}`, kind: 'patronage', ref: f.who, text: `Settle a personal favour you owe ${f.who.startsWith('ty_') ? TYCOON_BY_ID[f.who]?.name : PERSON_BY_ID[f.who]?.name ?? f.who}`, public: false, improper: true, stateObligation: false });
  out.push({ id: 'private.immunity', kind: 'private', ref: 'president', text: 'No investigation of the outgoing President', public: false, improper: true });
  return out;
}

/** Whether the counterpart accepts a term, and why. */
export function accepts(s: GameState, withId: string, t: Term, rival: boolean): { ok: boolean; why: string } {
  if (rival) {
    if (t.kind === 'private') return { ok: s.purseTaken.personal < 5, why: s.purseTaken.personal < 5 ? 'There is nothing to investigate; it costs them nothing.' : 'The winner will not promise to look away from what they campaigned on.' };
    if (t.kind === 'unfinished' || t.kind === 'protection') return { ok: true, why: 'A new government is glad to inherit finished work and settled rules.' };
    return { ok: t.kind !== 'patronage', why: t.kind === 'patronage' ? 'Your patrons are not theirs.' : 'Accepted, in public, as the price of a peaceful handover.' };
  }
  const p = profileOf(s, withId);
  if (t.kind === 'private' || (t.improper && !t.stateObligation)) return { ok: p.integrity <= 3 && p.loyalty >= 60, why: p.integrity <= 3 && p.loyalty >= 60 ? 'Agreed privately. It is the kind of promise that is kept until it is not.' : `${p.name} will not make a private promise of that kind.` };
  if (t.kind === 'policy' || t.kind === 'unfinished') return { ok: p.commitment >= 0.4 || p.loyalty >= 60, why: p.commitment >= 0.4 ? 'They believe in it.' : p.loyalty >= 60 ? 'They owe you, and say yes.' : 'It is not their programme.' };
  return { ok: p.loyalty >= 45 || p.integrity >= 4, why: 'Accepted.' };
}

export const TERM_PC = 2;

/** Negotiate a settlement: each accepted term is recorded; each refused one is refused on the record. */
export function negotiateSettlement(s: GameState, withId: string, withName: string, termIds: string[], rival: boolean): string {
  const opts = termOptions(s);
  const terms: Term[] = [];
  const refused: string[] = [];
  for (const id of termIds.slice(0, 5)) {
    const t = opts.find((x) => x.id === id);
    if (!t) continue;
    s.pc = clamp(s.pc - TERM_PC, 0, 100);
    const a = accepts(s, withId, t, rival);
    if (a.ok) {
      terms.push(t);
      if (t.improper) s.exposures.push({ kind: 'political', amount: 0, witnesses: [withId], trail: 1, turn: s.turn, causeId: 'settlement', label: `A private succession bargain: ${t.text.toLowerCase()}.` });
    } else refused.push(`${t.text}: ${a.why}`);
  }
  s.settlement = { with: withId, withName, kind: rival ? 'rival' : 'heir', terms, turn: s.turn };
  return `${withName} agrees to ${terms.length} term${terms.length === 1 ? '' : 's'}.${refused.length ? ` Refused: ${refused.join(' ')}` : ''}`;
}

/** At the handover: how likely each delivered reform is to survive the next government, and why. */
export function survivalForecast(s: GameState): { share: number; lines: string[] } {
  const done = s.agenda.done;
  if (!done.length) return { share: 1, lines: [] };
  const heir = String(s.flags['succession.backed'] ?? '');
  const p = heir && s.flags['succession.won'] ? profileOf(s, heir) : null;
  const protectedIds = new Set((s.settlement?.terms ?? []).filter((t) => t.kind === 'policy').map((t) => t.ref));
  const entrenched = rules(s).filter((r) => r.entrenched).length;
  const base = p ? 0.55 + p.commitment * 0.4 : 0.55;
  let total = 0;
  for (const id of done) total += Math.min(1, base + (protectedIds.has(id) ? 0.2 : 0) + entrenched * 0.03 + (MILESTONE_BY_ID[id]?.m.reversal ? 0 : 0.15));
  const share = Math.round((total / done.length) * 100) / 100;
  const lines = [
    p ? `${p.name} would keep about ${Math.round((0.55 + p.commitment * 0.4) * 100)}% of what they inherit unprompted (commitment ${p.commitment}).` : 'A successor who owes you nothing keeps what works and what is popular.',
    protectedIds.size ? `${protectedIds.size} reform${protectedIds.size === 1 ? ' is' : 's are'} named in the settlement.` : 'No reform is named in a settlement.',
    entrenched ? `${entrenched} rule${entrenched === 1 ? ' is' : 's are'} entrenched and cannot be undone by decision.` : 'Nothing is entrenched.',
  ];
  return { share, lines };
}

// ---------------------------------------------------------------- the successor's side

export interface DossierLine { label: string; items: string[] }
export interface Inheritance {
  kind: 'heir' | 'rival' | 'disgrace' | 'replacement';
  predecessor: string;
  /** Built from the record, not from what the predecessor says. */
  dossier: DossierLine[];
  /** The predecessor's own account, which may not match the dossier. */
  letter: string | null;
  publicHandover: string;
  settlement: Settlement | null;
  /** What the new government did with each term. */
  stances: Record<string, 'honoured' | 'renegotiated' | 'broken' | 'investigated'>;
  /** What the predecessor had delivered, to judge the legacy later. */
  programme: string[];
  institutions: string[];
  /** The predecessor's fate after office, kept apart from the programme's. */
  safety: string;
}

/** Built at the handover, from the record of the government that left. */
export function buildInheritance(prev: GameState, sameParty: boolean, safety: string): Inheritance {
  const ending = prev.ending ?? 'term_limit';
  const kind: Inheritance['kind'] = ['removed', 'resigned', 'annulled'].includes(ending) ? 'disgrace' : sameParty ? (prev.flags['succession.won'] ? 'heir' : 'replacement') : 'rival';
  const reversed = Object.keys(prev.flags).filter((k) => k.startsWith('reversed.')).map((k) => reformName(prev, k.slice(9)));
  const promises = (prev.pledges ?? []).filter((p) => p.status === 'open').map((p) => p.text ?? p.id);
  const beneficiaries = Object.entries(prev.tycoons).filter(([, t]) => t.rel >= 65 || t.granted).map(([id]) => TYCOON_BY_ID[id]?.name ?? id);
  const dossier: DossierLine[] = [
    { label: 'Delivered and in force', items: prev.agenda.done.slice(-8).map((id) => reformName(prev, id)) },
    { label: 'Reversed', items: reversed },
    { label: 'Abandoned half-way', items: prev.agenda.active.map((a) => `${reformName(prev, a.id)} (${Math.round(a.progress)}%)`) },
    { label: 'Obligations already funded or owed', items: [`₦${(prev.debts.contractors + prev.debts.pensions + prev.debts.gas).toFixed(1)}tn owed to contractors, pensioners and gas suppliers`, ...(prev.ventures.active.map((v) => `${VENTURE_BY_ID[v.id]?.name} under construction`))] },
    { label: 'How independent the institutions are', items: (prev.institutions ?? []).map((i) => `${INSTITUTION_BY_ID[i.id]?.name}: headed by ${i.head.name}${i.head.integrity >= 4 ? ', who answers to the rules' : i.head.patron !== 'president' ? `, who answers to ${i.head.patron}` : ''}`) },
    { label: 'Who did well out of it', items: beneficiaries },
    { label: 'Promises made to voters and still open', items: promises },
  ].filter((d) => d.items.length);
  const s = prev.settlement ?? null;
  const rel = s?.kind === 'heir' || sameParty;
  const letter = rel || s ? `${prev.president.name} writes privately: "${prev.agenda.done.length >= 15 ? 'The country is in better shape than the papers say.' : 'I leave you a hard country.'} ${s?.terms.length ? `We agreed ${s.terms.length} things. Hold to them and history will be kind to us both.` : ''} ${prev.purseTaken.personal >= 10 ? 'Some of what you will hear about me is exaggerated.' : 'Ask me anything; I will tell you the truth.'}"`.replace(/  +/g, ' ') : null;
  const publicHandover = kind === 'disgrace' ? `There is no ceremony. ${prev.president.name} left office before the term ended, and the handover is a letter from the Secretary to the Government.` : kind === 'rival' ? `${prev.president.name} hands over the instruments of office at the Eagle Square ceremony, and leaves before the lunch.` : `${prev.president.name} hands over at Eagle Square and stays for the lunch.`;
  return { kind, predecessor: prev.president.name, dossier, letter, publicHandover, settlement: s, stances: {}, programme: [...prev.agenda.done], institutions: (prev.institutions ?? []).map((i) => i.id), safety };
}

/** For the new President: what the evidence says about each inherited term. */
export function termAdvice(s: GameState, t: Term): string {
  if (t.kind === 'policy') return s.agenda.done.includes(t.ref) ? 'It is in force and working; breaking it would cost you its constituency.' : 'It is no longer in force.';
  if (t.kind === 'unfinished') return s.agenda.active.some((a) => a.id === t.ref) || s.ventures.active.some((v) => v.id === t.ref) ? 'It is still under way; finishing it costs money you could spend elsewhere.' : 'It is no longer under way.';
  if (t.kind === 'private') return 'An improper promise: honouring it protects your predecessor; breaking it may expose what was promised.';
  if (t.kind === 'patronage') return t.stateObligation ? 'A licence granted in law: a state obligation, enforceable in court.' : 'A personal favour your predecessor owed: not the state\'s obligation.';
  return 'Keeping it costs little and leaves the rules as you found them.';
}

export type Stance = 'honoured' | 'renegotiated' | 'broken' | 'investigated';

/** The new President's decision on one inherited term, with consequences that follow from what the term was. */
export function decideTerm(s: GameState, termId: string, stance: Stance): string {
  const inh = s.inheritance;
  const t = inh?.settlement?.terms.find((x) => x.id === termId);
  if (!inh || !t) return '';
  inh.stances[termId] = stance;
  s.desk.actionsUsed += 1;
  const pred = s.predecessor;
  const relDelta = stance === 'honoured' ? 6 : stance === 'renegotiated' ? -3 : -15;
  if (pred) pred.rel = clamp((pred.rel ?? 40) + relDelta, 0, 100);
  if (stance === 'renegotiated') s.pc = clamp(s.pc - 3, 0, 100);
  if (stance === 'broken' && s.predecessor?.sameParty) applyFx(s, ['bloc.party', -4]);
  if (stance === 'broken' && t.public) applyFx(s, ['bloc.press', 2]);
  if (stance === 'investigated' && t.improper) {
    applyFx(s, ['nation.integrity', 3]); applyFx(s, ['bloc.street', 3]);
    s.flags['pred.investigated'] = true;
    if (pred) pred.rel = 0;
  }
  if (stance === 'honoured' && t.kind === 'private') applyFx(s, ['nation.integrity', -2]);
  return `${stance === 'honoured' ? 'You keep' : stance === 'renegotiated' ? 'You reopen' : stance === 'broken' ? 'You break' : 'You open an investigation into'} "${t.text}". ${termAdvice(s, t)}`;
}

/** The predecessor's succession legacy, judged on the programme and the successor's record, apart from personal safety. */
export function successionVerdict(s: GameState): { programme: number; institutions: string; honoured: number; broken: number; successor: string; safety: string; text: string } | null {
  const inh = s.inheritance;
  if (!inh) return null;
  const kept = inh.programme.filter((id) => s.agenda.done.includes(id)).length;
  const programme = inh.programme.length ? kept / inh.programme.length : 1;
  const stood = inh.institutions.filter((id) => (s.institutions ?? []).some((i) => i.id === id)).length;
  const st = Object.values(inh.stances);
  const honoured = st.filter((x) => x === 'honoured').length, broken = st.filter((x) => x === 'broken' || x === 'investigated').length;
  const successor = s.ending ? (['term_limit'].includes(s.ending) ? 'served out the term' : s.ending === 'defeated' ? 'lost the next election' : 'did not finish the term') : 'still in office';
  const good = programme >= 0.7 && stood >= inh.institutions.length * 0.7;
  const text = `${Math.round(programme * 100)}% of ${inh.predecessor}'s programme survives; ${stood} of ${inh.institutions.length} institutions stand. ${good ? 'As a succession, it held' : programme < 0.5 ? 'As a succession, it failed: the programme did not survive' : 'As a succession, it partly held'}${inh.kind === 'rival' && good ? ', and under a rival, which is the harder test' : ''}. Separately, ${inh.predecessor} is ${inh.safety.toLowerCase()}${!good && /protected/i.test(inh.safety) ? ': safe in person, not in legacy' : ''}.`;
  return { programme, institutions: `${stood}/${inh.institutions.length}`, honoured, broken, successor, safety: inh.safety, text };
}

/** Monthly: delegated tests report. */
export function settlementTick(s: GameState): void {
  for (const [k, due] of Object.entries(s.counters)) {
    if (!k.startsWith('testing.') || s.turn < due) continue;
    const id = k.slice(8);
    delete s.counters[k];
    const p = profileOf(s, id);
    const passed = rand(s) < 0.2 + p.competence * 0.14;
    s.flags[`tested.${id}`] = passed ? 'passed' : 'failed';
    s.report.push({ kind: passed ? 'reform' : 'failure', title: `${p.name}'s test: ${passed ? 'passed' : 'failed'}`, text: passed ? 'The brief was delivered, and the party noticed who delivered it.' : 'The brief went wrong in public. The party has noticed that too.', changes: [] });
  }
}
