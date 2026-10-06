import { bindFavours, consumeFavour, favourBelongs, type FavourUseId } from './favour-ledger';
import { closeRequest } from './requests';
// What is owed, in both directions, and the businessmen who do most of the owing.

import { mo } from './config';
import { rivalOf } from './rivals';
import { MILESTONE_BY_ID } from '../content/agenda';
import { PERSON_BY_ID, RIVAL_BY_ID } from '../content/people';
import { FINANCIER, TYCOONS, TYCOON_BY_ID, type Tycoon } from '../content/tycoons';
import { strongestRival } from './people';
import type { Favour, GameState } from './types';
import { addFavour, applyFx, clamp, favoursOwed, favoursOwing, standing, test } from './vars';

export { favoursOwed, favoursOwing };

// ---------------------------------------------------------------- who is who

export type Kind = 'governor' | 'senator' | 'minister' | 'tycoon' | 'rival' | 'other';

export function kindOf(id: string): Kind {
  if (TYCOON_BY_ID[id]) return 'tycoon';
  if (RIVAL_BY_ID[id]) return 'rival';
  return PERSON_BY_ID[id]?.group ?? 'other';
}

export interface Who { name: string; short: string; title: string }

export function who(s: GameState, id: string): Who {
  const t = TYCOON_BY_ID[id];
  if (t) return { name: t.name, short: t.short, title: t.title };
  const r = RIVAL_BY_ID[id] ? rivalOf(s, id) : undefined;
  if (r) return { name: r.name, short: r.short, title: r.party };
  const p = PERSON_BY_ID[id];
  if (p) {
    const st = s.people[id];
    return { name: st?.name ?? p.name, short: st?.short ?? p.short, title: p.title };
  }
  if (id === 'vp' && s.vp) return { name: s.vp.name, short: s.vp.short, title: 'Vice President' };
  const c = s.chars[id];
  if (c) return { name: c.name, short: c.short, title: c.role };
  return { name: id, short: id, title: '' };
}

/** How this person stands with the President, 0-100. */
export function regard(s: GameState, id: string): number {
  if (TYCOON_BY_ID[id]) return s.tycoons[id]?.rel ?? 50;
  if (RIVAL_BY_ID[id]) return 50;
  return standing(s, id);
}

// ---------------------------------------------------------------- tycoons

export function initTycoons(s: GameState): void {
  s.tycoons = {};
  s.favours = [];
  for (const t of TYCOONS) s.tycoons[t.id] = { rel: 50, granted: false, reasons: [] };
  const backer = FINANCIER[s.president.background] ?? 'ty_trade';
  s.tycoons[backer].rel = 64;
  s.flags.financier = backer;
  addFavour(s, backer, 'owing', 3, `${TYCOON_BY_ID[backer].short} paid for your campaign.`);
  // The Governors' Forum delivered, and has mentioned it since.
  addFavour(s, 'gov_ss', 'owing', 2, 'Koroye delivered three states for you.');
}

export function tycoonMood(rel: number): string {
  if (rel >= 75) return 'Your man';
  if (rel >= 60) return 'With you';
  if (rel >= 35) return 'Watching';
  return 'Against you';
}

const COURT_MONTHS = 12;
const COURT_PC = 3;
/** Each courtship is worth less than the one before. */
const courtBonus = (n: number) => Math.max(4, 12 - 3 * (n - 1));

/** A condition on a reform or order that a predecessor, not this President, delivered. */
function inheritedAct(s: GameState, c: Tycoon['moved'][number]['when']): boolean {
  if (!('v' in c)) return false;
  const [path] = c.v;
  const m = /^(agenda|ordered)\.(.+)$/.exec(path);
  return !!m && !test(s, { v: [`mine.${m[2]}`, '==', 1] });
}

function target(s: GameState, t: Tycoon): { v: number; reasons: string[] } {
  const st = s.tycoons[t.id];
  let v = 50;
  const reasons: string[] = [];
  if (s.flags.financier === t.id) { v += 8; reasons.push('Backed your campaign.'); }
  if (st.granted && !st.inherited) { v += 20; reasons.push('You granted what was asked.'); }
  if (st.granted && st.inherited) { v += 12; reasons.push('What your predecessor gave still stands, and they would like it to keep standing. Renewing it in your name would make it yours.'); }
  if (st.courted !== undefined && s.turn - st.courted < COURT_MONTHS) { const d = courtBonus(st.courtN ?? 1); v += d; reasons.push(`You made time for ${t.short} at the Villa (+${d}).`); }
  if (st.squeezed !== undefined && s.turn - st.squeezed < 24) { v -= 26; reasons.push('You set the agencies on the business.'); }
  for (const m of t.moved) {
    if (!test(s, m.when)) continue;
    // What a predecessor did is felt at half the weight: the business has adjusted, and the grudge was with them.
    const theirs = inheritedAct(s, m.when);
    v += theirs ? m.d * 0.5 : m.d;
    reasons.push(theirs ? `Done before you, and felt half as much: ${m.text.replace(/^You /, 'The government ')}` : m.text);
  }
  const owing = favoursOwing(s, t.id).filter((f) => s.turn - f.turn > 18).length;
  if (owing) { v -= 8 * owing; reasons.push('You owe, and have been slow to pay.'); }
  return { v: clamp(v, 5, 95), reasons };
}

export function tycoonTick(s: GameState): void {
  for (const t of TYCOONS) {
    const st = s.tycoons[t.id];
    const tg = target(s, t);
    const before = st.rel;
    st.rel = clamp(st.rel + (tg.v - st.rel) * 0.1, 0, 100);
    st.reasons = tg.reasons;
    // A businessman who has turned, and who knows something, makes sure it is known.
    if (st.rel < 30 && s.counters[`talked.${t.id}`] === undefined && s.exposures.some((x) => x.witnesses.includes(t.id))) {
      s.counters[`talked.${t.id}`] = s.turn;
      applyFx(s, ['pressure.scandalHeat', 12]);
      for (const x of s.exposures) if (x.witnesses.includes(t.id)) x.trail = Math.min(3, x.trail + 1) as 0 | 1 | 2 | 3;
      s.news.push({
        chronicle: `${t.short.toUpperCase()} "KEPT RECORDS" OF DEALINGS WITH PRESIDENCY`, street: `${t.short.toUpperCase()} SAY E GET RECEIPT FOR EVERYTHING`,
        weight: 5, valence: -1, topic: 'scandal', about: t.id,
        body: `Associates of ${t.name} say every payment made to the ruling party was documented. They have not said what they intend to do with the documents.`,
      });
    }
    if (before >= 35 && st.rel < 35) {
      s.news.push({
        chronicle: `${t.short.toUpperCase()} BREAKS WITH PRESIDENCY`, street: `${t.short.toUpperCase()} DON TURN BACK FOR PRESIDENT`,
        weight: 4.5, valence: -1, topic: 'money', about: t.id,
        body: `${t.name}, ${t.title.toLowerCase()}, is no longer a friend of the government. ${t.hostile}`,
      });
    }
    const friendly = st.rel >= 60;
    const hostile = st.rel < 35;
    if (!friendly && !hostile) continue;
    switch (t.id) {
      case 'ty_maker': s.nation.jobs = clamp(s.nation.jobs + (friendly ? 0.05 : -0.06), 0, 100); break;
      case 'ty_bank': s.blocs.establishment = clamp(s.blocs.establishment + (friendly ? 0.3 : -0.5), 0, 100); break;
      case 'ty_fuel': s.pressures.fuelSupplyStress = clamp(s.pressures.fuelSupplyStress + (friendly ? -1.2 : 1.5), 0, 100); break;
      case 'ty_media': s.blocs.press = clamp(s.blocs.press + (friendly ? 0.5 : -0.6), 0, 100); break;
    }
    if (hostile) {
      const rival = t.funds === 'lead' ? strongestRival(s).id : t.funds;
      s.opposition[rival] = clamp((s.opposition[rival] ?? 30) + 0.55, 5, 95);
    }
  }
}

/** What the commodity importer's mood does to prices. */
export function tycoonInflation(s: GameState): number {
  const rel = s.tycoons.ty_trade?.rel ?? 50;
  return rel >= 60 ? -0.5 : rel < 35 ? 1.2 : 0;
}

export type TycoonOp = 'grant' | 'squeeze' | 'take' | 'court';

export function canTycoon(s: GameState, id: string, op: TycoonOp, movesLeft: number): { ok: boolean; reason?: string } {
  const t = TYCOON_BY_ID[id];
  const st = s.tycoons[id];
  if (!t || !st) return { ok: false };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (op === 'grant') {
    if (st.granted && !st.inherited) return { ok: false, reason: 'Already granted.' };
    if (t.want.pc && s.pc < t.want.pc) return { ok: false, reason: `Needs ${t.want.pc} political capital.` };
    if (t.want.naira && t.want.naira > s.nation.fiscalSpace && s.nation.debt >= 100) return { ok: false, reason: 'There is no money, and nobody will lend it.' };
  }
  if (op === 'court') {
    if (st.courted !== undefined && s.turn - st.courted < COURT_MONTHS) return { ok: false, reason: `You saw ${t.short} ${s.turn - st.courted === 0 ? 'this month' : `${mo(s.turn - st.courted)} ago`}. Once a year is attention; more is a request.` };
    if (s.pc < COURT_PC) return { ok: false, reason: `Needs ${COURT_PC} political capital.` };
  }
  if (op === 'squeeze') {
    if (st.squeezed !== undefined && s.turn - st.squeezed < 24) return { ok: false, reason: 'The agencies have been through the books already. There is nothing more to find for two years.' };
    if (s.pc < 5) return { ok: false, reason: 'Needs 5 political capital.' };
  }
  if (op === 'take') {
    if (st.rel < 40) return { ok: false, reason: 'Is not offering.' };
    if ((s.counters[`took.${id}`] ?? -99) > s.turn - 12) return { ok: false, reason: 'Gave within the year. Asking again so soon has a price you would not like.' };
  }
  return { ok: true };
}

export function tycoonDeal(s: GameState, id: string, op: TycoonOp): { text: string; archive: string; sealed?: boolean } {
  const t = TYCOON_BY_ID[id];
  const st = s.tycoons[id];
  if (op === 'court') {
    s.pc = clamp(s.pc - COURT_PC, 0, 100);
    st.courted = s.turn;
    st.courtN = (st.courtN ?? 0) + 1;
    st.rel = clamp(st.rel + 4, 0, 100);
    return { text: `${t.short} comes to the Villa for dinner and a long talk about the economy. Nothing is promised. ${t.short} leaves feeling heard, which is rarer than being given things, and lasts about a year.`, archive: `Made time for ${t.name} at the Villa.` };
  }
  if (op === 'grant') {
    // Renewing what a predecessor gave costs half, and does half the damage again.
    const k = st.inherited ? 0.5 : 1;
    const renewed = !!st.inherited;
    if (t.want.pc) s.pc = clamp(s.pc - Math.round(t.want.pc * k), 0, 100);
    if (t.want.naira) applyFx(s, ['nation.fiscalSpace', -t.want.naira * k]);
    for (const [target, d] of t.want.fx) applyFx(s, [target, d * k]);
    st.granted = true;
    st.inherited = false;
    if (renewed) {
      st.rel = clamp(st.rel + 15, 0, 100);
      addFavour(s, id, 'owed', 1, `You renewed what your predecessor gave ${t.short}.`);
      return { text: `It is renewed in your name. ${t.short} now has it from you, and says so. ${t.short} owes you.`, archive: `Renewed for ${t.name} what the last government gave: ${t.want.text.replace(/\.$/, '').toLowerCase()}.` };
    }
    st.rel = clamp(st.rel + 22, 0, 100);
    // Two strength of value settles the same counterpart's debt first.
    const debt = favoursOwing(s, id)[0];
    if (debt) {
      const paid = Math.min(2, debt.size);
      consumeFavour(s, debt.id, paid, 'settled', 'Settled against a granted concession');
      if (paid < 2) addFavour(s, id, 'owed', 2 - paid, 'Remaining value of a granted concession.');
      return { text: `${t.want.done} The granted concession is credited against what you owed ${t.short}.`, archive: `Gave ${t.name} what was asked: ${t.want.text.replace(/\.$/, '').toLowerCase()}.` };
    }
    addFavour(s, id, 'owed', 2, `You gave ${t.short} what was asked: ${t.want.text.replace(/\.$/, '').toLowerCase()}.`);
    return { text: `${t.want.done} ${t.short} owes you.`, archive: `Gave ${t.name} what was asked: ${t.want.text.replace(/\.$/, '').toLowerCase()}.` };
  }
  if (op === 'squeeze') {
    s.pc = clamp(s.pc - 5, 0, 100);
    for (const fx of t.squeeze.fx) applyFx(s, fx);
    st.squeezed = s.turn;
    st.rel = clamp(st.rel - 24, 0, 100);
    // Anything they owed you is void, and anything you owed them is now a grievance.
    for (const f of [...s.favours].filter((f) => f.who === id && f.dir === 'owed')) consumeFavour(s, f.id, f.size, 'voided', 'Counterpart repudiated the debt after coercion');
    s.news.push({
      chronicle: `FG MOVES AGAINST ${t.short.toUpperCase()} BUSINESS EMPIRE`, street: `GOVERNMENT DON FACE ${t.short.toUpperCase()}. BIG MAN DEY SWEAT`,
      weight: 4.5, valence: 0, topic: 'money', about: id, body: t.squeeze.done,
    });
    return { text: t.squeeze.done, archive: `${t.squeeze.name}.` };
  }
  // take: money for the campaign, and a debt.
  s.campaign.chest += 8;
  s.counters[`took.${id}`] = s.turn;
  addFavour(s, id, 'owing', 2, `${t.short} put ₦8bn into your campaign.`);
  s.exposures.push({ kind: 'political', amount: 8, witnesses: [id], trail: 1, turn: s.turn, causeId: '', label: `Took ₦8bn from ${t.name} for the campaign.` });
  applyFx(s, ['pressure.scandalHeat', 3]);
  return {
    text: `₦8bn reaches the campaign through eleven companies and a foundation. ${t.short} asks for nothing. That is how you know it will be something large.`,
    archive: `Took ₦8bn from ${t.name} for the campaign.`, sealed: true,
  };
}

// ---------------------------------------------------------------- calling favours in

export interface Use { id: FavourUseId; label: string; detail: string; ok?: boolean; reason?: string; targets?: { id: string; label: string }[] }

/** What this favour can be spent on. */
export function usesFor(s: GameState, f: Favour, units = f.size): Use[] {
  const k = kindOf(f.who);
  const n = units;
  const out: Use[] = [];
  if (k === 'governor') {
    out.push({ id: 'deliver', label: 'Deliver the zone', detail: `Approval in the zone rises now, and on election day the governor delivers an extra ${(1.5).toFixed(1)} points there for the next ${6 * n} months.` });
    out.push({ id: 'mediate', label: 'Mediate locally', detail: 'The governor convenes local leaders: theatre threat falls by ' + (3 * n) + ' points.' });
    out.push({ id: 'calm', label: 'Bring the governors into line', detail: `The party warms by about ${4 * n} points.` });
  }
  if (k === 'senator') {
    out.push({ id: 'oversight', label: 'Back an oversight hearing', detail: 'Capacity rises by ' + n + ' and integrity by ' + (0.5 * n) + ' points.' });
    out.push({ id: 'whip', label: 'Whip the vote', detail: `Votes as you ask for ${4 * n} months, and brings colleagues along. No grudge: it is a debt being paid.` });
  }
  if (k === 'minister') {
    out.push({ id: 'overtime', label: 'Drive the ministry', detail: `Every reform under way in the brief jumps forward by ${10 * n}%.` });
  }
  if (k === 'tycoon') {
    out.push({ id: 'cash', label: 'Money for the campaign', detail: `₦${6 * n}bn into the campaign chest. No new debt: this is the debt.` });
    out.push({ id: 'invest', label: 'Put money into the country', detail: `Buys your bonds and builds: ₦${150 * n}bn to the treasury and jobs rise.` });
    if (TYCOON_BY_ID[f.who]?.paper) out.push({ id: 'press', label: 'A kind word in print', detail: `The press warms by about ${4 * n} points and a running story against you is dropped.` });
  }
  if (k !== 'rival') out.push({ id: 'capital', label: 'Stand up for you in public', detail: `${5 * n} political capital.` });
  if (s.exposures.some((x) => x.witnesses.includes(f.who))) out.push({ id: 'silence', label: 'Forget what they saw', detail: 'They stop being a witness to what is in the drawer.' });
  const asks = Object.values(s.governance?.requests ?? {}).filter((r) => r.status === 'open' && r.requester === f.counterpart);
  if (asks.length) out.push({ id: 'withdraw-request', label: 'Withdraw a request', detail: 'Withdraw a specified open request.', targets: asks.map((r) => ({ id: r.id, label: r.text })) });
  return out.map((use) => {
    let reason: string | undefined;
    if (!Number.isSafeInteger(n) || n < 1 || n > f.size) reason = 'Choose strength within the remaining balance.';
    else if (f.eligibleUses && !f.eligibleUses.includes(use.id)) reason = 'The terms of this debt do not allow that use.';
    else if (use.id === 'overtime' && !s.agenda.active.some((a) => (PERSON_BY_ID[f.who]?.tracks ?? []).includes(MILESTONE_BY_ID[a.id]?.track.id ?? ''))) reason = 'There is no active reform in this ministry to accelerate.';
    else if (use.id === 'mediate' && s.theatres[PERSON_BY_ID[f.who]?.zone ?? 'NW'] < 35) reason = 'No local security crisis calls for mediation.';
    return { ...use, ok: !reason, reason };
  });
}

export function canCall(s: GameState, f: Favour | undefined, movesLeft: number): { ok: boolean; reason?: string } {
  const providedId = f?.id;
  const actual = s.favours.find((x) => x.id === providedId);
  if (!actual || !favourBelongs(s, actual)) return { ok: false, reason: 'The debt belongs to a different person or President.' };
  if (!f || actual.dir !== 'owed') return { ok: false };
  f = actual;
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (s.people[f.who]?.gone) return { ok: false, reason: 'Has crossed to the opposition. The debt went with them.' };
  if (regard(s, f.who) < 30) return { ok: false, reason: 'No longer takes your calls. Mend the relationship first.' };
  return { ok: true };
}

export function canUseFavour(s: GameState, id: number, use: string, movesLeft: number, units?: number, target?: string): { ok: boolean; reason?: string } {
  const f = s.favours.find((f) => f.id === id);
  const base = canCall(s, f, movesLeft);
  if (!base.ok || !f) return base;
  const n = units ?? (use === 'silence' || use === 'withdraw-request' ? 1 : f.size);
  if ((use === 'silence' || use === 'withdraw-request') && n !== 1) return { ok: false, reason: 'This service uses one strength.' };
  if (!Number.isSafeInteger(n) || n < 1 || n > f.size) return { ok: false, reason: 'Invalid remaining strength.' };
  const option = usesFor(s, f, n).find((o) => o.id === use);
  if (!option) return { ok: false, reason: 'This person cannot provide that service.' };
  if (!option.ok) return { ok: false, reason: option.reason };
  if (use === 'withdraw-request' && (!option.targets?.some((x) => x.id === target) && !(target === undefined && option.targets?.length === 1))) return { ok: false, reason: 'Choose an open request from this person.' };
  return { ok: true };
}

/** Validated service: spends only the requested strength and journals the residual. */
export function callFavour(s: GameState, f: Favour, use: string, units?: number, target?: string): { text: string; archive: string } {
  const eligible = canUseFavour(s, f.id, use, 1, units, target);
  if (!eligible.ok) throw new Error(eligible.reason);
  f = s.favours.find((x) => x.id === f.id)!;
  bindFavours(s);
  const n = units ?? (use === 'silence' || use === 'withdraw-request' ? 1 : f.size);
  const w = who(s, f.who), remaining = f.size - n;
  let text = '';
  switch (use) {
    case 'deliver': {
      const zone = PERSON_BY_ID[f.who]!.zone!;
      applyFx(s, ['zone.' + zone + '.approval', 2 + n]);
      s.counters['deliver.' + f.who] = s.turn + 6 * n;
      text = w.short + ' works the zone for the President.'; break;
    }
    case 'calm': applyFx(s, ['bloc.party', 4 * n]); text = w.short + ' brings the governors into line.'; break;
    case 'whip': {
      const st = s.people[f.who]; st.compliantUntil = Math.max(st.compliantUntil ?? 0, s.turn + 4 * n);
      for (const [id, p] of Object.entries(PERSON_BY_ID)) if (p.group === 'senator' && id !== f.who && s.people[id]) s.people[id].rel = clamp(s.people[id].rel + 2 * n, 0, 100);
      text = w.short + ' counts the votes and visits the doubtful.'; break;
    }
    case 'overtime': {
      const tracks = PERSON_BY_ID[f.who]!.tracks ?? [];
      for (const a of s.agenda.active) if (tracks.includes(MILESTONE_BY_ID[a.id]?.track.id ?? '')) a.progress = Math.min(99, a.progress + 10 * n);
      text = w.short + ' drives the active reforms in the ministry forward.'; break;
    }
    case 'cash': s.campaign.chest += 6 * n; text = 'The campaign receives ' + (6 * n) + ' billion naira.'; break;
    case 'invest': applyFx(s, ['debt.bonds', 0.15 * n]); applyFx(s, ['nation.fiscalSpace', 0.15 * n]); applyFx(s, ['nation.jobs', 1.5 * n]); text = w.short + ' buys the bond issue and invests in a plant. The borrowing remains a treasury liability.'; break;
    case 'press': applyFx(s, ['bloc.press', 4 * n]); s.stories.shift(); text = 'The Daily Stakeholder prints a kind word; the running series ends.'; break;
    case 'silence': for (const x of s.exposures) x.witnesses = x.witnesses.filter((id) => id !== f.who); applyFx(s, ['pressure.scandalHeat', -6]); text = w.short + ' stops corroborating what was seen.'; break;
    case 'mediate': applyFx(s, ['theatre.' + PERSON_BY_ID[f.who]!.zone!, -3 * n]); text = w.short + ' convenes local leaders and negotiates room for the security effort.'; break;
    case 'oversight': applyFx(s, ['nation.capacity', n]); applyFx(s, ['nation.integrity', 0.5 * n]); text = w.short + ' backs an oversight hearing and follows up the findings.'; break;
    case 'withdraw-request': {
      const asks = Object.values(s.governance!.requests).filter((r) => r.status === 'open' && r.requester === f.counterpart);
      const request = asks.find((r) => r.id === target) ?? asks[0];
      closeRequest(s, request.id, 'withdrawn', 'Withdrawn in settlement of a favour.');
      text = w.short + ' withdraws the request: ' + request.text; break;
    }
    case 'capital': applyFx(s, ['pc', 5 * n]); text = w.short + ' publicly stands behind the President.'; break;
    default: throw new Error('Unsupported favour service');
  }
  consumeFavour(s, f.id, n, 'used', 'Called in a service', use);
  if (s.people[f.who]) s.people[f.who].rel = clamp(s.people[f.who].rel - 3 * n, 0, 100);
  if (s.tycoons[f.who]) s.tycoons[f.who].rel = clamp(s.tycoons[f.who].rel - 3 * n, 0, 100);
  return { text: text + (remaining ? ' Remaining strength: ' + remaining + '.' : ' This debt is settled.'), archive: 'Called in ' + n + ' strength from ' + w.name + '.' };
}

/** Someone the President owes who has waited long enough to ask. */
export function dueCreditor(s: GameState, kind: Kind): string | null {
  const due = favoursOwing(s).filter((f) => f.disputedAt === undefined && kindOf(f.who) === kind && s.turn - f.turn >= 8 && !s.people[f.who]?.gone);
  due.sort((a, b) => a.turn - b.turn);
  return due[0]?.who ?? null;
}
