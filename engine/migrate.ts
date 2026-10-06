import { ensureHoldings } from './holdings';
import { ensureMilitary } from './military';
import { bindFavours } from './favour-ledger';
import { refreshRequests } from './wants';
import { ensureGovernance, markCommitmentsDue } from './governance';

// Saved games survive updates. An older save is brought forward to the current
// shape: systems it has never heard of are started from the state it is in.
// A current save has any missing field filled from a fresh game, so adding a
// field to the state does not strand anybody's presidency.

import { initVP } from './vp';
import { EVENTS } from '../content';
import { MILESTONE_BY_ID } from '../content/agenda';
import { seedAdvisers } from './advice';
import { DEBTS } from '../content/treasury';
import { initTycoons } from './favours';
import { syncDebt } from './ledger';
import { stampMinisters } from './people';
import { newGame } from './reduce';
import { usualBudget } from './treasury';
import type { GameState, Setup, ZoneId } from './types';
import { ZONES, clamp, syncSecurity } from './vars';

export const SAVE_VERSION = 3;

type Loose = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

function setupOf(raw: Loose): Setup {
  return raw.setup ?? {
    seed: raw.seed ?? 1,
    name: raw.president?.name ?? 'Adewale',
    party: raw.president?.party ?? 'Progressive Stakeholders Congress',
    partyShort: raw.president?.partyShort ?? 'PSC',
    home: raw.president?.home ?? 'KN',
    background: raw.president?.background ?? 'governor',
    address: raw.president?.address ?? 'sir',
    finance: raw.chars?.fin?.name ?? '',
    priorities: raw.agenda?.tracks ?? [],
  };
}

/** Version 2 had one debt number, one security number and no businessmen. */
function fromV2(raw: Loose): void {
  raw.setup = setupOf(raw);
  raw.version = 3;

  // Security by theatre, from the old national figure and zone offsets.
  raw.theatres = {};
  for (const z of ZONES) {
    const old = (raw.nation?.security ?? 38) + (raw.zones?.[z]?.security ?? 0);
    raw.theatres[z as ZoneId] = clamp(100 - old, 3, 97);
    if (raw.zones?.[z]) delete raw.zones[z].security;
  }
  raw.focus = null;

  // The debt, split among its creditors in the proportions it started in.
  const scale = (raw.nation?.debt ?? 66) / 66;
  raw.debts = {};
  for (const d of DEBTS) raw.debts[d.id] = d.kind === 'bond' ? Math.round(d.start * scale * 100) / 100 : d.start;
  if (raw.agenda?.done?.includes('p1')) raw.debts.gas = 0.2;
  if (raw.counters?.['order.arrears'] !== undefined) { raw.debts.contractors = 0.4; raw.debts.pensions = 0; }

  raw.funds = { abroad: 0, buffer: raw.flags?.['sovereign.fund'] ? 2 : 0.3, infra: 0, growth: 0 };
  raw.oil = { price: 74, output: 1.75, prev: 74 };
  raw.budget = { year: 2027 + Math.floor(((raw.turn ?? 1) + 4) / 12), benchmark: 70, alloc: usualBudget(), due: false };
  raw.oppLog = [];
  raw.used = {};
  raw.stories = [];
  raw.bets = {};
  raw.ventures = { ...(raw.ventures ?? { active: [], won: [], lost: [] }), causes: {} };
  raw.papers = [];
  delete raw.paper;
  if (raw.phase === 'papers') raw.phase = 'desk';

  const s = raw as GameState;
  initTycoons(s);
  stampMinisters(s);
  syncDebt(s);
  syncSecurity(s);
}

/** Brings a saved game up to date. Returns null if it cannot be read. */
export function migrate(raw: unknown): GameState | null {
  try {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Loose;
    if (r.version === 2) fromV2(r);
    if (r.version !== SAVE_VERSION) return null;

    // Anything the state has gained since this was saved starts as it would in a new game.
    const fresh = newGame(setupOf(r)) as unknown as Loose;
    for (const key of Object.keys(fresh)) {
      if (key === 'governance') continue;
      if (r[key] === undefined) r[key] = fresh[key];
      else if (fresh[key] && typeof fresh[key] === 'object' && !Array.isArray(fresh[key]) && typeof r[key] === 'object' && !Array.isArray(r[key])) {
        // One level down: a new debt, a new fund, a new person.
        for (const k of Object.keys(fresh[key])) if (r[key][k] === undefined && !KEYED_BY_PLAY.has(key)) r[key][k] = fresh[key][k];
      }
    }
    const s = r as GameState;
    ensureGovernance(s);
    markCommitmentsDue(s);
    refreshRequests(s);
    bindFavours(s);
    // Saves from before the register (plan 11) start owning everything, with the established tax debts.
    ensureHoldings(s);
    // Saves from before the armed forces were an institution (plan 13) start with the command as authored.
    ensureMilitary(s);
    // Saves from before taxation and the Treasury were two tracks (plan 10): a declared
    // Treasury priority covered both halves of the old track, so it keeps covering both.
    if (s.agenda.tracks.includes('treasury') && !s.agenda.tracks.includes('tax')) s.agenda.tracks.push('tax');
    if (!s.counters['rules.theatres']) theatreRules(s);
    if (!s.counters['rules.policies']) policyRules(s);
    // Saves from before advisers had reputations and patrons.
    if (s.chars.cos && !s.chars.cos.rep) seedAdvisers(s);
    // Saves from before there was a Vice President.
    if (!s.vp) initVP(s);
    // Institutions set up before files could ask about them.
    for (const i of s.institutions ?? []) s.flags[`inst.${i.id}`] = true;
    // Reforms that have been taken off the agenda leave the books; their standing costs end with them.
    const known = (id: string) => !!MILESTONE_BY_ID[id];
    s.agenda.done = s.agenda.done.filter(known);
    s.agenda.active = s.agenda.active.filter((a) => known(a.id));
    s.agenda.failed = s.agenda.failed.filter((a) => known(a.id));
    // A file that no longer exists cannot be decided.
    if (s.desk?.lead && !EVENTS[s.desk.lead.eventId]) s.desk.lead = null;
    s.desk.minors = (s.desk?.minors ?? []).filter((m) => EVENTS[m.eventId]);
    s.queue = (s.queue ?? []).filter((q) => EVENTS[q.event]);
    return s;
  } catch {
    return null;
  }
}

/** Security reforms delivered before they worked theatre by theatre get their lasting measures now. */
function theatreRules(s: GameState): void {
  for (const id of s.agenda.done) {
    for (const [t, v] of MILESTONE_BY_ID[id]?.m.done ?? []) {
      if (t === 'drift.all') for (const z of ZONES) s.counters[`drift.${z}`] = (s.counters[`drift.${z}`] ?? 0) + v;
      else if (t.startsWith('drift.') || t.startsWith('sec.')) s.counters[t] = (s.counters[t] ?? 0) + v;
    }
    // The old forward bases and police posts paid a flat national bonus instead.
    if (id === 's2' || id === 's5') s.counters['bonus.security'] = Math.max(0, (s.counters['bonus.security'] ?? 0) - 0.05);
  }
  s.counters['rules.theatres'] = 1;
}

/** The fixed permanent costs the tempting reforms used to carry. Their standing policies now cost them monthly. */
const OLD_POLICY_BONUS: Record<string, [string, number][]> = {
  h1: [['bonus.inflation', 1.5]], h2: [['bonus.fiscal', -0.05]], h4: [['bonus.inflation', 1], ['bonus.fiscal', -0.025]],
  o2: [['bonus.inflation', 2]], o4: [['bonus.fiscal', -0.03]], r2: [['bonus.fiscal', -0.04]], g3: [['bonus.fiscal', -0.025]],
};

function policyRules(s: GameState): void {
  for (const id of s.agenda.done) for (const [k, v] of OLD_POLICY_BONUS[id] ?? []) s.counters[k] = (s.counters[k] ?? 0) - v;
  s.counters['rules.policies'] = 1;
}

/** Parts of the state whose keys are created by playing, not by the game's content. */
const KEYED_BY_PLAY = new Set(['flags', 'counters', 'fired', 'choices', 'used', 'bets', 'prev', 'stateLean', 'campaign']);
