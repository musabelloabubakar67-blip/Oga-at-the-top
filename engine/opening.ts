// THE OPENING (plan 02, contract R6)
// What the President chose before the oath, applied to the new game: the
// coalition that won the election, who paid for it, an optional rule the
// government binds itself to, and the first cabinet. Each choice is applied
// through the same routines the game uses later, so its effects are real:
// favours owed are favours, promises are dated commitments with agreed tests,
// and appointments are appointments.
//
// Nothing is silently defaulted. A legacy setup without these fields keeps the
// old behaviour (financier from background, the Governors' Forum debt).

import { TRACKS } from '../content/agenda';
import { CANDIDATE_BY_ID } from '../content/candidates';
import { FINANCE_CANDIDATES } from '../content/names';
import { PERSON_BY_ID } from '../content/people';
import { CONSTRAINT_BY_ID, FINANCIER_BY_ID, ROUTE_BY_ID, type StartingCommitment } from '../content/routes';
import { SCENARIO_BY_ID } from '../content/scenarios';
import { STATE_BY_ID } from '../content/states';
import { TYCOON_BY_ID } from '../content/tycoons';
import { poolFor, replaceAdviser } from './advice';
import { CONTRACT_VERSION } from './contracts';
import { applyDomainOutcome } from './domain-outcomes';
import { clockOf } from './governance';
import { replaceMinisterWith } from './people';
import { leaveVacant, type AppointmentPost } from './recruitment';
import { candidatesFor, release, take } from './talent';
import type { Fx, GameState, Setup } from './types';
import { addFavour, applyFx } from './vars';

/** Offices the opening cabinet is chosen for: the same eight as the proposed slate. */
export const OPENING_OFFICES = ['fin', 'min_defence', 'min_power', 'min_works', 'min_service', 'min_agric', 'min_justice', 'cos'] as const;
export type OpeningOffice = (typeof OPENING_OFFICES)[number];

const postOf = (office: string): AppointmentPost =>
  office === 'fin' ? { kind: 'finance' } : office === 'cos' ? { kind: 'adviser', id: 'cos' } : { kind: 'minister', id: office };

/** Routes this President can claim: continuity needs a government to continue. */
export function routeOpen(routeId: string, scenario: string, successorSameParty?: boolean): boolean {
  const r = ROUTE_BY_ID[routeId as keyof typeof ROUTE_BY_ID];
  if (!r) return false;
  if (!r.onlyWhen) return true;
  if (successorSameParty !== undefined) return !!r.onlyWhen.successorSameParty && successorSameParty;
  return !!r.onlyWhen.scenarios?.includes(scenario);
}

/** Every reason a setup cannot be sworn in. Empty means valid. */
export function validateSetup(setup: Setup, opts: { successorSameParty?: boolean; barredFinance?: string[] } = {}): string[] {
  const out: string[] = [];
  if (!setup.name?.trim()) out.push('The President needs a name for the certificate.');
  if (!STATE_BY_ID[setup.home]) out.push('Choose a home state.');
  if (!setup.party?.trim() || !setup.partyShort?.trim()) out.push('The party needs a name and an acronym.');
  if (!SCENARIO_BY_ID[setup.scenario ?? 'standard']) out.push('Choose an inheritance.');
  const tracks = new Set(TRACKS.map((t) => t.id));
  if (new Set(setup.priorities).size !== 4 || setup.priorities.some((p) => !tracks.has(p))) out.push('Choose four different points for the mandate.');
  if (!FINANCE_CANDIDATES.some((c) => c.name === setup.finance)) out.push('Choose a Minister of Finance.');
  if (opts.barredFinance?.includes(setup.finance)) out.push(`${setup.finance} will not serve this government.`);
  if (setup.route !== undefined && !routeOpen(setup.route, setup.scenario ?? 'standard', opts.successorSameParty)) out.push('That route to power is not open in this inheritance.');
  if (setup.financier !== undefined && !FINANCIER_BY_ID[setup.financier as keyof typeof FINANCIER_BY_ID]) out.push('Choose who paid for the campaign.');
  if (setup.constraint && !CONSTRAINT_BY_ID[setup.constraint]) out.push('Unknown governing constraint.');
  const picked = Object.values(setup.team ?? {}).filter((v) => v && v !== 'keep' && v !== 'vacant');
  if (new Set(picked).size !== picked.length) out.push('The same person cannot hold two offices.');
  for (const [office, id] of Object.entries(setup.team ?? {})) {
    if (!(OPENING_OFFICES as readonly string[]).includes(office)) out.push(`Unknown office ${office}.`);
    else if (id && id !== 'keep' && id !== 'vacant') {
      const c = CANDIDATE_BY_ID[id];
      if (!c) out.push(`Unknown candidate for ${office}.`);
      else if (c.exceptional) out.push(`${c.name} serves only on negotiated terms: approach them after taking office.`);
      else if (!c.roles.includes(office)) out.push(`${c.name} cannot serve as ${office}.`);
    }
  }
  return out;
}

function openCommitment(s: GameState, prefix: string, c: StartingCommitment, cause: string): void {
  const admin = clockOf(s).administrationId;
  applyDomainOutcome(s, { version: CONTRACT_VERSION, effects: [{
    type: 'commitment.open', id: `${prefix}.${c.object}.${admin}`, responsible: { office: c.responsible }, object: c.object, text: c.text,
    afterMonths: c.afterMonths, visibility: c.visibility, verify: c.verify,
  }] }, { eventId: 'transition', choiceId: cause });
}

/** Apply the route, financier, constraint and opening cabinet. Called by newGame once governance exists. */
export function applyOpening(s: GameState, setup: Setup): void {
  const bump = (fx: Fx[]) => fx.forEach((f) => applyFx(s, f));
  const route = setup.route ? ROUTE_BY_ID[setup.route as keyof typeof ROUTE_BY_ID] : undefined;
  const fin = setup.financier ? FINANCIER_BY_ID[setup.financier as keyof typeof FINANCIER_BY_ID] : undefined;
  const constraint = setup.constraint ? CONSTRAINT_BY_ID[setup.constraint] : undefined;
  if (route) {
    s.flags.route = route.id;
    bump(route.fx);
    for (const d of route.owes) addFavour(s, d.who, 'owing', d.size, d.why);
    for (const c of route.commitments) openCommitment(s, 'opening.route', c, 'route');
    s.archive.push({ id: 'a-route', turn: 0, eventId: 'transition', choiceId: 'route', category: 'politics', headline: `Won the election as ${route.name.replace(/^The /, 'the ').replace(/^A /, 'a ')}: ${route.howWon}`, sig: 2, touches: {} });
  }
  if (fin) {
    bump(fin.fx);
    for (const d of fin.owes) addFavour(s, d.who, 'owing', d.size, d.why);
    for (const c of fin.commitments) openCommitment(s, 'opening.financier', c, 'financier');
    s.archive.push({ id: 'a-financier', turn: 0, eventId: 'transition', choiceId: 'financier', category: 'politics', headline: TYCOON_BY_ID[fin.id] ? `The campaign was paid for by ${fin.label}.` : `The campaign was paid for by ${fin.label.replace(/^./, (x) => x.toLowerCase())}.`, sig: 1, touches: {} });
  }
  if (constraint) {
    s.flags.constraint = constraint.id;
    bump(constraint.fx);
    openCommitment(s, 'opening.constraint', { object: constraint.id, text: constraint.text, responsible: 'president', afterMonths: 48, visibility: 'public', verify: constraint.verify, judgedBy: constraint.judgedBy }, 'constraint');
    s.archive.push({ id: 'a-constraint', turn: 0, eventId: 'transition', choiceId: 'constraint', category: 'politics', headline: `Bound the government on the first day: ${constraint.text}`, sig: 2, touches: {} });
  }
  applyTeam(s, setup.team ?? {});
}

/** The first cabinet. Appointments use the game's own routines; their political effects are real. */
function applyTeam(s: GameState, team: Record<string, string>): void {
  const pc = s.pc, used = s.desk.actionsUsed;
  for (const office of OPENING_OFFICES) {
    const choice = team[office];
    if (!choice || choice === 'keep') continue;
    s.pc = 999; s.desk.actionsUsed = 0;
    if (choice === 'vacant') {
      const text = leaveVacant(s, postOf(office), 1);
      s.archive.push({ id: `a-team-${office}`, turn: 0, eventId: 'transition', choiceId: 'team', category: 'politics', headline: `Left a post vacant on the first day. ${text}`, sig: 1, touches: {} });
      continue;
    }
    const c = CANDIDATE_BY_ID[choice];
    if (!c || c.exceptional) continue;
    if (office === 'fin') {
      const o = candidatesFor(s, 'fin', 99).find((x) => x.c.id === choice && !x.refuses);
      if (!o) continue;
      const old = s.chars.fin;
      take(s, o.c.id); release(s, old.name);
      s.chars.fin = { id: 'fin', role: 'Minister of Finance', name: o.c.name, short: o.c.short, competence: o.effective, clout: o.c.clout, loyalty: o.c.loyalty, integrity: o.c.integrity, patron: o.c.patron, rep: { competence: o.shown.competence, loyalty: o.shown.loyalty }, blurb: o.c.blurb, rel: 40, notes: [] };
      s.flags['fin.pick'] = 'pool';
      s.archive = s.archive.filter((a) => a.id !== 'a-fin');
      s.archive.push({ id: 'a-fin', turn: 0, eventId: 'transition', choiceId: 'finance', category: 'politics', headline: `Appointed ${o.c.name} as Minister of Finance.`, sig: 2, touches: {} });
    } else if (office === 'cos') {
      const o = poolFor(s, 'cos').find((x) => x.c.id === choice && !x.refuses);
      if (!o) continue;
      const text = replaceAdviser(s, 'cos', o.c.name);
      s.archive.push({ id: 'a-team-cos', turn: 0, eventId: 'transition', choiceId: 'team', category: 'politics', headline: text, sig: 1, touches: {} });
    } else if (PERSON_BY_ID[office]?.group === 'minister') {
      const o = candidatesFor(s, office, 99).find((x) => x.c.id === choice && !x.refuses);
      if (!o) continue;
      const r = replaceMinisterWith(s, office, o);
      s.archive.push({ id: `a-team-${office}`, turn: 0, eventId: 'transition', choiceId: 'team', category: 'politics', headline: `Appointed ${o.c.name} as ${PERSON_BY_ID[office].title}. ${r.text}`, sig: 1, touches: {} });
    }
  }
  s.pc = pc; s.desk.actionsUsed = used;
}

export interface StartingEffect { path: string; delta: number }
export interface OpeningPreview {
  effects: StartingEffect[];
  favours: { who: string; size: number; why: string }[];
  commitments: { text: string; due: number; visibility: string; judgedBy?: string }[];
}
/** What the route, financier, constraint and cabinet change, measured by building the game with and without them. */
export function startingEffects(build: (setup: Setup) => GameState, setup: Setup): OpeningPreview {
  // A neutral baseline: no route debts, no financier (an unknown id applies nothing), no rule, no cabinet changes.
  const bare: Setup = { ...setup, route: '__none', financier: '__none', constraint: undefined, team: undefined };
  const a = build(bare), b = build(setup);
  const paths: string[] = [
    ...Object.keys(b.blocs).map((k) => `bloc.${k}`),
    ...['inflation', 'integrity', 'capacity', 'jobs'].map((k) => `nation.${k}`),
    'pc', 'campaign', 'pressure.scandalHeat',
    ...Object.keys(b.tycoons).map((k) => `tycoon.${k}`),
  ];
  const read = (s: GameState, p: string): number => {
    const [h, k] = p.split('.');
    if (h === 'bloc') return s.blocs[k as keyof typeof s.blocs];
    if (h === 'nation') return s.nation[k as keyof typeof s.nation] as number;
    if (h === 'pressure') return s.pressures[k as keyof typeof s.pressures];
    if (h === 'tycoon') return s.tycoons[k]?.rel ?? 0;
    if (h === 'campaign') return s.campaign.chest;
    return s.pc;
  };
  const effects = paths.map((p) => ({ path: p, delta: Math.round((read(b, p) - read(a, p)) * 10) / 10 })).filter((e) => Math.abs(e.delta) >= 0.5);
  const route = setup.route ? ROUTE_BY_ID[setup.route as keyof typeof ROUTE_BY_ID] : undefined;
  const fin = setup.financier ? FINANCIER_BY_ID[setup.financier as keyof typeof FINANCIER_BY_ID] : undefined;
  const cons = setup.constraint ? CONSTRAINT_BY_ID[setup.constraint] : undefined;
  const favours = [...(route?.owes ?? []), ...(fin?.owes ?? [])];
  const commitments = [
    ...[...(route?.commitments ?? []), ...(fin?.commitments ?? [])].map((c) => ({ text: c.text, due: c.afterMonths, visibility: c.visibility, judgedBy: c.judgedBy })),
    ...(cons ? [{ text: cons.text, due: 48, visibility: 'public', judgedBy: cons.judgedBy }] : []),
  ];
  return { effects, favours, commitments };
}
