// The next President inherits the country exactly as it was left: the debts,
// the savings, the reforms, the half-built projects, the theatres, and the
// consequences still on their way.

import { PEOPLE } from '../content/people';
import { zoneOf } from './federal';
import { poolFor, replaceAdviser } from './advice';
import { candidatesFor } from './talent';
import { replaceMinisterWith } from './people';
import { rivalOf } from './rivals';
import { ORDER_BY_ID, TRACKS } from '../content/agenda';
import { RIVAL_BY_ID } from '../content/people';
import { runElection } from './election';
import { verdict } from './legacy';
import { strongestRival } from './people';
import type { ArchiveEntry, GameState, Predecessor } from './types';
import { ZONES, approval, clamp, hardship } from './vars';
import { eraShifts } from './era';

export interface Winner { sameParty: boolean; party: string; partyShort: string; rival?: string; how: string }

const initials = (name: string) => name.split(/\s+/).filter((w) => /^[A-Z]/.test(w) && !/^(of|the)$/i.test(w)).map((w) => w[0]).join('').slice(0, 4);

/** Who holds the Villa after this presidency. */
export function winnerOf(prev: GameState): Winner {
  const rival = rivalOf(prev, strongestRival(prev).id);
  const own: Winner = { sameParty: true, party: prev.president.party, partyShort: prev.president.partyShort, how: '' };
  const other: Winner = { sameParty: false, party: rival.party, partyShort: initials(rival.party), rival: rival.id, how: '' };
  const ending = prev.ending ?? 'term_limit';
  if (ending === 'defeated') return { ...other, how: `${rival.party} won the election that President ${prev.president.name} lost.` };
  if (ending === 'term_limit' && prev.succession) {
    return prev.succession.won
      ? { ...own, how: `${prev.president.party} kept the Villa at the end of President ${prev.president.name}'s second term.` }
      : { ...other, how: `${rival.party} took the Villa at the end of President ${prev.president.name}'s second term.` };
  }
  // Denied the ticket, removed, resigned or annulled: the election is held without the President.
  const result = runElection(structuredClone(prev), 'succession');
  const why = ending === 'ticket_denied' ? 'was denied the party\'s ticket' : ending === 'removed' ? 'was removed from office' : ending === 'annulled' ? 'had the election annulled' : 'left office early';
  return result.won
    ? { ...own, how: `President ${prev.president.name} ${why}. ${prev.president.party} held on at the election that followed.` }
    : { ...other, how: `President ${prev.president.name} ${why}. ${rival.party} won the election that followed.` };
}

const MILESTONE_COUNT = TRACKS.reduce((a, t) => a + t.milestones.length, 0);

/** What the incoming President is told on the first morning. */
export function handoverNotes(prev: GameState): string[] {
  const n = prev.nation;
  const arrears = prev.debts.gas + prev.debts.contractors + prev.debts.pensions;
  const saved = prev.funds.abroad + prev.funds.buffer + prev.funds.infra + prev.funds.growth;
  const hot = ZONES.filter((z) => prev.theatres[z] >= 65).length;
  const candid = !!prev.flags['handover.candid'] || prev.ending !== 'term_limit';
  const out = [
    candid
      ? `Debt service takes ${Math.round(n.debt)}% of revenue. ₦${arrears.toFixed(1)}tn is owed to contractors, pensioners and gas suppliers.`
      : `Debt service takes ${Math.round(n.debt)}% of revenue. The notes you were left call the economy "on a sound footing" and give no figure for what is owed to contractors, pensioners and gas suppliers. The Treasury will have to tell you.`,
    `The treasury holds ₦${n.fiscalSpace.toFixed(1)}tn and the funds hold ₦${saved.toFixed(1)}tn.`,
    `Inflation is ${n.inflation.toFixed(0)}%. The petrol subsidy is ${prev.flags['policy.subsidy'] === 'removed' ? 'gone' : 'still in place'}.`,
    `${prev.agenda.done.length} of ${MILESTONE_COUNT} reforms are in force${prev.agenda.active.length ? `, and ${prev.agenda.active.length} ${prev.agenda.active.length === 1 ? 'is' : 'are'} half-finished` : ''}.`,
    hot ? `${hot} of the six security theatres ${hot === 1 ? 'is' : 'are'} dangerous or worse.` : 'No security theatre is worse than contested.',
  ];
  if (prev.ventures.active.length) out.push(`${prev.ventures.active.length} big ${prev.ventures.active.length === 1 ? 'bet is' : 'bets are'} still being built, on your predecessor's promise.`);
  if (prev.purseTaken.personal >= 10) out.push('There are questions about your predecessor that nobody has yet asked in public.');
  return out;
}

// What stays true of the country whoever is President.
const WORLD_FLAG = /^(reversed\.|law\.|policy\.uni\.|wage\.|oil\.|flood\.|refinery\.|grain\.|vat\.|print\.|ways\.|lender\.|doctors\.|statepolice\.|econ\.)/;
// Decisions that cannot be taken twice.
const WORLD_ORDERS = ['tax', 'duties', 'subsidy_end', 'price_freeze', 'merge'];

/** Overwrites a freshly made state with the world as the predecessor left it. */
export function applyInheritance(s: GameState, prev: GameState, w: Winner): void {
  // Months actually served. A presidency that ends at the handover has served the whole term.
  const span = Math.min(96, Math.max(1, prev.turn - 1));
  s.era = prev.era + 1;
  s.startYear = prev.startYear + Math.ceil(span / 48) * 4;

  s.nation = { ...prev.nation };
  s.petrolRef = prev.petrolRef;
  s.hist = [{ ...prev.nation }];
  s.pressures = {
    fuelSupplyStress: prev.pressures.fuelSupplyStress,
    wageGrievance: prev.pressures.wageGrievance * 0.85,
    // The scandals were the last government's. The habits that made them are still in the building.
    scandalHeat: w.sameParty ? prev.pressures.scandalHeat * 0.6 : prev.pressures.scandalHeat * 0.3,
  };
  s.debts = { ...prev.debts };
  s.funds = { ...prev.funds };
  s.fundTransfers = structuredClone(prev.fundTransfers ?? []);
  s.oil = { ...prev.oil };
  s.budget = { ...prev.budget, alloc: { ...prev.budget.alloc }, year: s.startYear, due: false };
  s.theatres = { ...prev.theatres };
  s.focus = null;
  s.used = { ...prev.used };

  for (const [k, v] of Object.entries(prev.flags)) if (WORLD_FLAG.test(k)) s.flags[k] = v;
  for (const [k, v] of Object.entries(prev.counters)) if (k.startsWith('bonus.') || k.startsWith('drift.') || k.startsWith('sec.') || k === 'refinery') s.counters[k] = v;
  for (const id of WORLD_ORDERS) if (prev.counters[`order.${id}`] !== undefined && ORDER_BY_ID[id]) s.counters[`order.${id}`] = -999;

  // Reforms delivered stay delivered. Those under way are still under way, at the stage they had reached.
  s.agenda.done = [...prev.agenda.done];
  // What was built keeps running under the same heads, captured or not.
  s.institutions = (prev.institutions ?? []).map((i) => ({ ...i, head: { ...i.head } }));
  // What was built stays where it was built, with whoever runs it; the bench sits on.
  s.assets = structuredClone(prev.assets ?? []);
  s.placed = (prev.placed ?? []).map((p) => ({ ...p }));
  s.sites = { ...(prev.sites ?? {}) };
  if (prev.fx) s.fx = { ...prev.fx, hist: [...prev.fx.hist] };
  if (prev.bench) {
    // The calendar restarts at month one. Justices loyal to the last President are loyal to their party.
    const shift = prev.turn - 1;
    const flip = (l: 'you' | 'free' | 'them') => (w.sameParty ? l : l === 'you' ? 'them' : l === 'them' ? 'you' : l);
    s.bench = { packed: 0, spent: [], seats: prev.bench.seats.map((j) => j && { ...j, lean: flip(j.lean), mine: false, retires: Math.max(2, j.retires - shift) }) };
  }
  s.agenda.active = prev.agenda.active.map((a) => ({ id: a.id, progress: a.progress }));
  s.agenda.failed = [];
  s.ventures = { active: prev.ventures.active.map((a) => ({ ...a })), won: [...prev.ventures.won], lost: [...prev.ventures.lost], causes: { ...prev.ventures.causes } };
  s.bets = structuredClone(prev.bets);
  // A licence once given stays given.
  for (const [id, t] of Object.entries(prev.tycoons)) if (t.granted && s.tycoons[id]) { s.tycoons[id].granted = true; s.tycoons[id].inherited = true; }

  // The mood the new President walks into.
  const h = hardship(s);
  const base = w.sameParty ? clamp(50 + (approval(prev) - 45) * 0.4, 42, 58) : 57;
  for (const z of ZONES) s.zones[z].approval = clamp(base + s.zones[z].lean, 5, 95);
  s.blocs.street = clamp((78 - h * 0.75) * 0.6 + 55 * 0.4, 20, 75);
  s.blocs.establishment = clamp(52 - (s.nation.debt - 66) * 0.3, 25, 70);
  s.blocs.party = w.sameParty ? clamp(prev.blocs.party * 0.5 + 30, 40, 68) : s.blocs.party;
  s.blocs.press = 55;

  // The archive crosses presidencies, so that "how did we get here?" can answer.
  const tag = `p${prev.era}-`;
  const carried: ArchiveEntry[] = prev.archive
    .filter((a) => !a.sealed && a.sig >= 2)
    .slice(-60)
    .map((a) => ({ ...a, id: tag + a.id, turn: Math.min(0, a.turn - span), category: 'inherited' as const }));
  s.archive = [...carried, ...s.archive.filter((a) => a.eventId === 'transition')];
  // Consequences already on their way still arrive.
  s.ledger = prev.ledger.map((l) => ({ ...l, due: Math.max(1, l.due - span), causeId: tag + l.causeId }));

  const v = verdict(prev);
  const pred: Predecessor = {
    name: prev.president.name, party: prev.president.party, epithet: v.epithet, sameParty: w.sameParty,
    kept: prev.purseTaken.personal, trail: prev.exposures.reduce((a, x) => a + x.trail, 0), ending: prev.ending ?? 'term_limit',
    rel: w.sameParty ? 60 : 25, zone: prev.president.homeZone, home: prev.president.home,
  };
  s.predecessor = pred;
  s.flags['party.origin'] = String(prev.flags['party.origin'] ?? prev.president.party);
  freshCabinet(s);
  // What changed in politics, not just in the accounts.
  for (const x of eraShifts(prev, w)) x.apply(s);
  // From the other side: the rival slot of the party that won now belongs to the party that lost, under the outgoing Vice President.
  if (!w.sameParty && w.rival) {
    const lead = prev.vp ?? { name: `Senator ${prev.president.name.split(' ').slice(-1)[0]}`, short: prev.president.name.split(' ').slice(-1)[0] };
    s.rivalSwap = { id: w.rival, name: lead.name, short: lead.short, party: prev.president.party };
    s.opposition[w.rival] = Math.max(s.opposition[w.rival] ?? 30, 40);
  } else {
    s.rivalSwap = prev.rivalSwap;
  }
  if (pred.kept >= 10 || pred.trail >= 4) s.flags['inherit.exposures'] = true;
  // What the last President did with the security vote decides what the drawer holds now.
  s.flags['pred.drawer'] = prev.flags['drawer.sealed'] ? 'sealed' : prev.flags['drawer.open'] ? 'took' : 'left';
}

/** A new President forms a new government: ministers and Villa staff from the talent pool, spread across the zones. */
function freshCabinet(s: GameState): void {
  const blocs = { ...s.blocs };
  const tycoons = Object.fromEntries(Object.entries(s.tycoons).map(([k, v]) => [k, v.rel]));
  const ministers = PEOPLE.filter((p) => p.group === 'minister');
  const rels = Object.fromEntries(Object.entries(s.people).map(([k, v]) => [k, v.rel]));
  const count: Record<string, number> = {};
  const bump = (z?: string | null) => { if (z) count[z] = (count[z] ?? 0) + 1; };
  bump(s.vp?.zone); bump(s.chars.fin ? zoneOf(s, s.chars.fin.name) : null);
  const best = <T extends { c: { zone: string }; effective: number; refuses: string | null; fit: boolean }>(offers: T[]) =>
    offers.filter((o) => !o.refuses && o.effective >= 3).sort((a, b) => (count[a.c.zone] ?? 0) - (count[b.c.zone] ?? 0) || Number(b.fit) - Number(a.fit) || b.effective - a.effective)[0];
  for (const m of ministers) {
    const o = best(candidatesFor(s, m.id, 99).filter((x) => x.fit));
    if (!o) continue;
    replaceMinisterWith(s, m.id, o);
    bump(o.c.zone);
  }
  for (const role of ['cos', 'sap']) {
    const o = best(poolFor(s, role));
    if (!o || !s.chars[role]) continue;
    replaceAdviser(s, role, o.c.name);
    bump(o.c.zone);
  }
  // Forming a government is not a political event: undo the moods the replacements would otherwise move.
  s.blocs = blocs;
  for (const [k, v] of Object.entries(tycoons)) if (s.tycoons[k]) s.tycoons[k].rel = v;
  for (const [k, v] of Object.entries(rels)) if (s.people[k] && !ministers.some((m) => m.id === k)) s.people[k].rel = v;
}
