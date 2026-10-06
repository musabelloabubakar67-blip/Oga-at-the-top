// Institutions: what an order builds that keeps running. Each has a head chosen
// by the President, an upkeep and an output every month. The head's competence
// sets the output; a head who serves someone else captures it, and after a while
// the capture shows, with the name of whoever is being served.

import { ruleInForce } from './constitution';
import { mo } from './config';
import { canAppointExceptional } from './recruitment';
import { INSTITUTIONS, INSTITUTION_BY_ID, type Culture, type InstitutionDef } from '../content/institutions';
import { PERSON_BY_ID } from '../content/people';
import { TYCOON_BY_ID } from '../content/tycoons';
import { VENTURE_BY_ID } from '../content/ventures';
import { charge } from './cases';
import { candidatesFor, release, specName, take } from './talent';
import { CFG } from './config';
import { diff, snapshot } from './effects';
import type { Fx, GameState } from './types';
import { applyFx, clamp, getVar, hardship, senate, test } from './vars';

/** Bodies the independent-appointments law protects. */
export const WATCHDOGS = ['graft', 'stats', 'regulator'];

export interface Head { name: string; competence: number; loyalty: number; integrity: number; patron: string; rep: { competence: number; loyalty: number }; blurb?: string; /** From the talent pool. */ cid?: string; spec?: string; fit?: boolean; refuses?: string | null; integrityShown?: number }

/** Two kinds of head who are always available; anyone left in the adviser pool can also be appointed. */
const GENERIC: Head[] = [
  { name: 'A career civil servant', competence: 3, loyalty: 3, integrity: 3, patron: 'president', rep: { competence: 3, loyalty: 3 }, blurb: 'Twenty years in the service. Knows the rules, and which of them matter.' },
  { name: 'A party nominee', competence: 2, loyalty: 3, integrity: 2, patron: 'gov_nw', rep: { competence: 3, loyalty: 4 }, blurb: 'Recommended by the party\'s governors, who will want to be consulted about the contracts.' },
];

export function built(s: GameState): NonNullable<GameState['institutions']> {
  return s.institutions ?? [];
}

/** Everyone who could take this job now: the two kinds always available, and the people in the talent pool, best fitted first. */
export function headsFor(s: GameState, role = 'asset'): Head[] {
  const pool = candidatesFor(s, role, 12).map((o): Head => ({
    name: o.c.name, competence: o.effective, loyalty: o.c.loyalty, integrity: o.c.integrity, patron: o.c.patron,
    rep: { competence: Math.max(1, o.shown.competence - (o.fit ? 0 : 1)), loyalty: o.shown.loyalty }, integrityShown: o.shown.integrity,
    blurb: o.c.blurb, cid: o.c.id, spec: specName(o.c), fit: o.fit, refuses: o.refuses,
  }));
  return [...GENERIC, ...pool];
}

/** Someone appointed from the pool is in a job now. */
function appointed(s: GameState, h: Head): void {
  if (h.cid) take(s, h.cid);
}

const leans = (h: Head) => h.patron !== 'president' && h.loyalty <= 3;

/** How well it is working this month, from 0 up, and why. */
export function performance(s: GameState, id: string): { k: number; why: string[]; captured: boolean } {
  const inst = built(s).find((i) => i.id === id);
  const d = INSTITUTION_BY_ID[id];
  if (!inst || !d) return { k: 0, why: [], captured: false };
  const why: string[] = [];
  let k = 0.5 + 0.15 * inst.head.competence;
  if (d.needs) {
    const [path, op, n] = d.needs.v;
    const v = getVar(s, path);
    const met = op === '>=' ? v >= n : v < n;
    if (!met) { k *= d.needs.else; why.push(`Without ${d.needs.label.toLowerCase()}, it runs at ${Math.round(d.needs.else * 100)}%`); }
  }
  const captured = leans(inst.head);
  if (captured) k *= 0.6;
  // A new institution takes months to reach full strength.
  const months = s.turn - (inst.founded ?? inst.since);
  const ramp = Math.min(1, 0.3 + 0.7 * months / d.ramp);
  if (ramp < 1) { k *= ramp; why.push(`Still being set up: ${Math.round(ramp * 100)}% of full strength, full in ${mo(Math.max(1, Math.ceil(d.ramp - months)))}`); }
  const f = FUNDING[inst.funding ?? 'standard'];
  if (f.out !== 1) { k *= f.out; why.push(`${f.name}: output ×${f.out}`); }
  if (id === 'graft' && s.flags['graft.leash']) { k *= 0.6; why.push('You stopped one of its cases, and every investigator noticed'); }
  if ((inst.routine ?? 0) >= 0.5) { k *= 1.15; why.push('Routines built by a strong head keep it working: +15%'); }
  return { k, why, captured };
}

/** What it does this month. */
export function monthlyFx(s: GameState, id: string): Fx[] {
  const inst = built(s).find((i) => i.id === id);
  const d = INSTITUTION_BY_ID[id];
  if (!inst || !d) return [];
  const { k, captured } = performance(s, id);
  const out: Fx[] = d.fx.map(([t, v]) => [t, Math.round(v * k * 1000) / 1000]);
  if (d.crooked && (inst.head.integrity <= 2 || captured)) out.push(...d.crooked);
  return out;
}

export function institutionFiscalLines(s: GameState): { label: string; value: number; hint: string }[] {
  return built(s).map((i) => {
    const d = INSTITUTION_BY_ID[i.id];
    const { k } = performance(s, i.id);
    const value = d.fiscal > 0 ? d.fiscal * k : d.fiscal;
    const f = FUNDING[i.funding ?? 'standard'];
    const ghosts = i.id === 'jobs' && s.flags['jobs.ghosts'] ? 1.3 : 1;
    const v = d.fiscal > 0 ? value : value * f.cost * ghosts;
    return { label: d.name, value: v, hint: d.fiscal > 0 ? `Revenue it raises, under ${i.head.name.replace(/^A /, 'a ')}.` : `What it costs to run, ${f.name.toLowerCase()}${ghosts > 1 ? ', including the ghost workers on its payroll' : ''}.` };
  }).filter((l) => Math.abs(l.value) >= 0.0005);
}

export function institutionInflationLines(s: GameState): { label: string; value: number }[] {
  return built(s).filter((i) => INSTITUTION_BY_ID[i.id].inflation).map((i) => ({ label: INSTITUTION_BY_ID[i.id].name, value: -(INSTITUTION_BY_ID[i.id].inflation ?? 0) * performance(s, i.id).k }));
}

/** How it behaves now (plan 04.A3): its charter's culture, changed by its head and its own routines. */
export function cultureOf(s: GameState, id: string): Culture {
  const i = built(s).find((x) => x.id === id);
  const base = INSTITUTION_BY_ID[id]?.charter?.culture ?? 'competent';
  if (!i) return base;
  if (leans(i.head)) return 'captured';
  if (i.head.loyalty >= 4 && i.head.patron === 'president' && i.head.integrity <= 3 && (i.routine ?? 0) < 0.5) return 'timid';
  if ((i.routine ?? 0) >= 0.5 || (i.head.competence >= 4 && i.head.integrity >= 4)) return base === 'doctrinaire' ? 'doctrinaire' : 'competent';
  return base === 'captured' && i.head.integrity >= 4 ? 'slow' : base;
}

/** Whether it will act against the government's wishes: its culture, its legal protection and its head. */
export function independentEnough(s: GameState, id: string): boolean {
  const c = cultureOf(s, id);
  const legal = INSTITUTION_BY_ID[id]?.charter?.independence ?? 'presidential';
  const protectedHead = legal !== 'presidential' || ruleInForce(s, 'watchdogs');
  return (c === 'competent' || c === 'doctrinaire') && (protectedHead || (built(s).find((x) => x.id === id)?.head.integrity ?? 0) >= 4);
}

/** Things institutions do on their own (plan 04.A2). Each can help the country and constrain the President in the same year. */
function independentActs(s: GameState): void {
  const has = (id: string) => built(s).some((i) => i.id === id);
  const act = (id: string, text: string, news: [string, string]) => {
    const i = built(s).find((x) => x.id === id)!;
    (i.acts ??= []).push({ turn: s.turn, text });
    if (i.acts.length > 12) i.acts.shift();
    s.report.push({ kind: 'consequence', title: `${INSTITUTION_BY_ID[id].name}, on its own`, cause: i.head.name, text, changes: [] });
    s.news.push({ chronicle: news[0], street: news[1], weight: 5, valence: 0, topic: 'politics', body: text });
  };
  const once = (key: string, months: number) => { const last = s.counters[key]; if (last !== undefined && s.turn - last < months) return false; s.counters[key] = s.turn; return true; };
  // The anti-corruption agency charges someone close to the President.
  if (has('graft') && independentEnough(s, 'graft')) {
    const ally = Object.entries(s.people).filter(([, p]) => !p.gone && p.rel >= 65).map(([id]) => id)
      .find((id) => Object.keys(s.flags).some((k) => k.startsWith(`dirty.${id}.`)) && !(s.cases ?? []).some((c) => c.who === id));
    if (ally && once('inst.act.graft', 10)) {
      charge(s, ally, 'contracts awarded without tender', 0.05);
      applyFx(s, ['nation.integrity', 2]); applyFx(s, ['bloc.press', 3]); applyFx(s, ['bloc.party', -3]);
      act('graft', `The agency has charged ${PERSON_BY_ID[ally]?.name ?? ally}, who is close to you, over contracts awarded without tender. It did not ask first.`, ['ANTI-GRAFT AGENCY CHARGES ALLY OF THE PRESIDENT', 'EFCC NO SPARE OGA PERSON THIS TIME']);
    }
  }
  // The statistics bureau publishes the figure the government would rather it did not.
  if (has('stats') && independentEnough(s, 'stats') && (s.nation.inflation >= 25 || hardship(s) >= 62) && once('inst.act.stats', 9)) {
    applyFx(s, ['approval', -1.5]); applyFx(s, ['bloc.press', 3]); applyFx(s, ['nation.integrity', 1]); applyFx(s, ['nation.capacity', 1]);
    act('stats', `The bureau publishes its quarterly survey: inflation at ${Math.round(s.nation.inflation)}% and one household in three skipping meals. The figures the Villa used were lower. Planners in every ministry now use the bureau's.`, ['STATISTICS BUREAU: INFLATION HIGHER THAN GOVERNMENT CLAIMS', 'STATISTICS PEOPLE DON TALK TRUE. E NO SWEET']);
  }
  // The regulator sends back a project that is not ready to start.
  if (has('regulator') && independentEnough(s, 'regulator')) {
    for (const a of s.ventures.active) {
      const st = (s.bets[a.id] ??= { warned: [] });
      if (st.reviewed || a.progress > 20) continue;
      st.reviewed = true;
      const v = VENTURE_BY_ID[a.id];
      const unmet = (v?.risks ?? []).filter((r) => r.kind === 'essential' && !test(s, r.ok));
      if (unmet.length) {
        a.progress = Math.max(0, a.progress - 15);
        act('regulator', `The regulator has sent back "${v.name}" until this is in place: ${unmet[0].label.charAt(0).toLowerCase()}${unmet[0].label.slice(1)}. Two months are lost; the project that resumes is less likely to fail.`, ['REGULATOR SENDS BACK PRESIDENTIAL PROJECT', 'REGULATOR SAY THE PROJECT NEVER READY']);
        break;
      }
    }
  }
  // The large-taxpayer office audits a businessman the President counts as a friend.
  if (has('tax') && independentEnough(s, 'tax')) {
    const friend = Object.entries(s.tycoons).find(([, t]) => t.rel >= 70)?.[0];
    if (friend && once('inst.act.tax', 12)) {
      s.tycoons[friend].rel = clamp(s.tycoons[friend].rel - 8, 0, 100);
      applyFx(s, ['nation.fiscalSpace', 0.06]);
      act('tax', `The large-taxpayer office has audited ${TYCOON_BY_ID[friend]?.name ?? friend}, a friend of the Villa, and assessed ₦60bn in unpaid tax. The businessman has asked you to intervene.`, ['TAX OFFICE ASSESSES BILLIONS FROM FRIEND OF THE PRESIDENT', 'TAX PEOPLE DON CATCH OGA FRIEND']);
    }
  }
}

/** Every month: the output lands, and a captured institution serves its patron, which shows after six months. */
export function institutionTick(s: GameState): void {
  independentActs(s);
  for (const i of built(s)) {
    // A strong head builds routines that outlast them; neglect lets them decay.
    i.routine = clamp((i.routine ?? 0) + (i.head.competence >= 4 && i.head.integrity >= 4 ? 0.03 : -0.01), 0, 1);
    for (const f of monthlyFx(s, i.id)) applyFx(s, f);
    // What it did this month, in its own units.
    const d0 = INSTITUTION_BY_ID[i.id];
    const k0 = performance(s, i.id).k;
    const crooked = i.head.integrity <= 2 || leans(i.head);
    i.record ??= {};
    for (const r of d0.record) {
      let add = r.per * k0;
      if (i.id === 'graft' && r.label === 'Convictions' && crooked) add *= 0.2;
      if (i.id === 'graft' && r.label === 'Money recovered' && crooked) add *= 0.3;
      i.record[r.label] = Math.min(r.cap ?? Infinity, (i.record[r.label] ?? 0) + add);
    }
    // The delivery office chases every reform under way.
    if (i.id === 'delivery') for (const a of s.agenda.active) a.progress += 1.5 * k0;
    if (!leans(i.head)) continue;
    const p = i.head.patron;
    if (s.tycoons[p]) s.tycoons[p].rel = clamp(s.tycoons[p].rel + 0.5, 0, 100);
    else if (s.people[p]) s.people[p].rel = clamp(s.people[p].rel + 0.5, 0, 100);
    if (!i.seen && s.turn - i.since >= 6) {
      i.seen = true;
      const d = INSTITUTION_BY_ID[i.id];
      s.news.push({ chronicle: `QUESTIONS OVER WHO REALLY RUNS ${d.name.replace(/^(A|The) /, '').toUpperCase()}`, street: 'DEM SAY NA ANOTHER PERSON DEY CONTROL AM', weight: 5, valence: -1, topic: 'scandal', body: `Contracts, appointments and decisions at ${d.name.replace(/^(A|The) /, 'the ').toLowerCase()} have followed one interest for six months.` });
      s.report.push({ kind: 'consequence', title: `${d.name}: captured`, cause: i.head.name, text: `It has been serving someone other than you. Its output is cut and its head's patron is the better for it. Replace the head, or live with it.`, changes: [] });
    }
  }
}

export function canEstablish(s: GameState, id: string, head: string, movesLeft: number): { ok: boolean; reason?: string } {
  const d = INSTITUTION_BY_ID[id];
  if (!d) return { ok: false };
  if (built(s).some((i) => i.id === id)) return { ok: false, reason: 'Already set up.' };
  const h = headsFor(s, id).find((x) => x.name === head);
  if (!h) return { ok: false, reason: 'Not available.' };
  if (h.refuses) return { ok: false, reason: h.refuses };
  if (h.cid) { const can = canAppointExceptional(s, h.cid, { kind: 'institution', id }, d.naira); if (!can.ok) return can; }
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < d.pc) return { ok: false, reason: `Needs ${d.pc} political capital.` };
  if (d.naira > s.nation.fiscalSpace && s.nation.debt >= CFG.economy.noLendingAbove) return { ok: false, reason: 'There is no money, and nobody will lend it.' };
  return { ok: true };
}

export function establish(s: GameState, id: string, headName: string): { text: string; changes: ReturnType<typeof diff> } {
  const d = INSTITUTION_BY_ID[id];
  const head = headsFor(s, id).find((h) => h.name === headName)!;
  if (head.cid && !canAppointExceptional(s, head.cid, { kind: 'institution', id }, d.naira).ok) throw new Error('Exceptional appointment terms are not agreed or funded');
  appointed(s, head);
  const before = snapshot(s);
  s.pc = clamp(s.pc - d.pc, 0, 100);
  if (d.naira) applyFx(s, ['nation.fiscalSpace', -d.naira]);
  for (const f of d.start ?? []) applyFx(s, f);
  // A party nominee pleases the party the day they are named.
  if (head.name === 'A party nominee') applyFx(s, ['bloc.party', 3]);
  (s.institutions ??= []).push({ id, head, since: s.turn, founded: s.turn, funding: 'standard', record: {} });
  // Files can ask whether an institution exists.
  s.flags[`inst.${id}`] = true;
  return { text: `${d.name} is set up, headed by ${head.name.replace(/^A /, 'a ')}.`, changes: diff(before, snapshot(s)) };
}

export const FUNDING: Record<'lean' | 'standard' | 'generous', { name: string; out: number; cost: number }> = {
  lean: { name: 'Lean funding', out: 0.7, cost: 0.6 },
  standard: { name: 'Standard funding', out: 1, cost: 1 },
  generous: { name: 'Generous funding', out: 1.25, cost: 1.5 },
};

export function setFunding(s: GameState, id: string, level: 'lean' | 'standard' | 'generous'): string {
  const inst = built(s).find((i) => i.id === id);
  if (!inst) return '';
  inst.funding = level;
  return `${INSTITUTION_BY_ID[id].name} moves to ${FUNDING[level].name.toLowerCase()}.`;
}

export const REHEAD_PC = 4;

export function canReplaceHead(s: GameState, id: string, head: string, movesLeft: number): { ok: boolean; reason?: string } {
  const inst = built(s).find((i) => i.id === id);
  if (!inst) return { ok: false };
  const h = headsFor(s, id).find((x) => x.name === head);
  if (inst.head.name === head || !h) return { ok: false, reason: 'Not available.' };
  if (ruleInForce(s, 'watchdogs') && WATCHDOGS.includes(id) && senate(s) < 50) return { ok: false, reason: 'Under the independent appointments law, a watchdog head can be replaced only with the consent of the Senate (support of 50 or better).' };
  if (h.refuses) return { ok: false, reason: h.refuses };
  if (h.cid) { const can = canAppointExceptional(s, h.cid, { kind: 'institution', id }); if (!can.ok) return can; }
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.pc < REHEAD_PC) return { ok: false, reason: `Needs ${REHEAD_PC} political capital.` };
  return { ok: true };
}

export function replaceHead(s: GameState, id: string, headName: string): string {
  const inst = built(s).find((i) => i.id === id)!;
  const proposed = headsFor(s, id).find((h) => h.name === headName)!;
  if (proposed.cid && !canAppointExceptional(s, proposed.cid, { kind: 'institution', id }).ok) throw new Error('Exceptional appointment terms are not agreed or funded');
  const old = inst.head;
  inst.head = headsFor(s, id).find((h) => h.name === headName)!;
  appointed(s, inst.head);
  release(s, old.name);
  inst.since = s.turn;
  inst.seen = false;
  s.pc = clamp(s.pc - REHEAD_PC, 0, 100);
  // Whoever was being served notices.
  if (leans(old) && s.tycoons[old.patron]) s.tycoons[old.patron].rel = clamp(s.tycoons[old.patron].rel - 8, 0, 100);
  if (leans(old) && s.people[old.patron]) s.people[old.patron].rel = clamp(s.people[old.patron].rel - 8, 0, 100);
  return `${old.name} leaves ${INSTITUTION_BY_ID[id].name.replace(/^(A|The) /, 'the ').toLowerCase()}. ${inst.head.name} takes over.`;
}

export function canAbolish(s: GameState, id: string): { ok: boolean; reason?: string } {
  const d = INSTITUTION_BY_ID[id];
  if (!d || !built(s).some((i) => i.id === id)) return { ok: false };
  if (s.pc < d.abolishPc) return { ok: false, reason: `Needs ${d.abolishPc} political capital.` };
  return { ok: true };
}

export function abolish(s: GameState, id: string): string {
  const d = INSTITUTION_BY_ID[id];
  s.pc = clamp(s.pc - d.abolishPc, 0, 100);
  for (const f of d.abolish) applyFx(s, f);
  s.institutions = built(s).filter((i) => i.id !== id);
  delete s.flags[`inst.${id}`];
  return `${d.name} is wound up. Its staff are redeployed; its files are not.`;
}

export function available(s: GameState): InstitutionDef[] {
  return INSTITUTIONS.filter((d) => !built(s).some((i) => i.id === d.id));
}
