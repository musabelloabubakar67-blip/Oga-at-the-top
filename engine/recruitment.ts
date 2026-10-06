import { CANDIDATE_BY_ID } from '../content/candidates';
import { INSTITUTION_BY_ID } from '../content/institutions';
import { CAST, REPLACEABLE } from '../content/names';
import { PERSON_BY_ID } from '../content/people';
import { clockOf } from './governance';
import type { GameState } from './types';

export type AppointmentPost = { kind: 'finance' } | { kind: 'minister' | 'adviser' | 'institution' | 'asset'; id: string };
export const LINKED_POSTS: Record<string, string> = { power: 'min_power', nsa: 'min_defence' };
export interface Recruitment {
  id: string; candidateId: string; administrationId: string; post: AppointmentPost;
  acceptedTerms: string[]; made: number; since?: number;
  status: 'declined' | 'agreed' | 'active' | 'suspended' | 'resigned' | 'ended';
  reason: string; monthlyCost: number; missed: number; arrears: number; paidAt?: number;
  funding: boolean; peopleFloor: number; agencyFloor: number; budgetYear: number;
  archiveFrom: number; leanedCases: string[]; grantedRequests: string[];
  payments: { at: number; amount: number; reason: string }[];
  history: { at: number; text: string }[];
}
const MONTHLY: Record<string, number> = { 'cand.nwachukwu': 0.004 / 12, 'cand.chukwuma': 0.005 / 12 };
const fundingRank = (s: GameState) => ({ lean: 0, standard: 1, generous: 2 }[(s.institutions ?? []).find((i) => i.id === 'graft')?.funding ?? 'standard']);
const samePost = (a: AppointmentPost, b: AppointmentPost) => a.kind === b.kind && ('id' in a ? 'id' in b && a.id === b.id : true);
const current = (s: GameState, id: string) => (s.recruitment ?? []).filter((r) => r.candidateId === id && r.administrationId === s.governance?.administrationId).at(-1);
export function recruitmentRole(post: AppointmentPost): string {
  return post.kind === 'finance' ? 'fin' : post.kind === 'asset' ? 'asset' : post.id;
}
function holder(s: GameState, post: AppointmentPost): string | undefined {
  if (post.kind === 'finance') return s.chars.fin?.name;
  if (post.kind === 'minister') return s.people[post.id]?.gone ? undefined : s.people[post.id]?.name ?? PERSON_BY_ID[post.id]?.name;
  if (post.kind === 'adviser') return s.chars[post.id]?.name;
  return (post.kind === 'asset' ? s.assets : s.institutions)?.find((x) => x.id === post.id)?.head.name;
}
function validPost(s: GameState, id: string, p: AppointmentPost): boolean {
  const c = CANDIDATE_BY_ID[id];
  if (!c?.exceptional || !c.roles.includes(recruitmentRole(p))) return false;
  if (p.kind === 'finance') return !!s.chars.fin;
  if (p.kind === 'minister') return PERSON_BY_ID[p.id]?.group === 'minister' && !!s.people[p.id];
  if (p.kind === 'adviser') return REPLACEABLE.includes(p.id) && !!s.chars[p.id] && CAST.some((x) => x.id === p.id);
  if (p.kind === 'institution') return !!INSTITUTION_BY_ID[p.id];
  // Grid expertise is applicable to electricity assets, not every public company.
  return !!s.assets?.some((x) => x.id === p.id && ['nuclear', 'export_power'].includes(x.id));
}
export const APPROACH_PC = 2;
export function appointmentKey(p: AppointmentPost): string { return p.kind === 'finance' ? 'adviser:fin' : p.kind === 'minister' ? p.id : `${p.kind}:${p.id}`; }
export function canLeaveVacant(s: GameState, post: AppointmentPost, moves: number): { ok: boolean; reason?: string } {
  const valid = post.kind === 'finance' ? !!s.chars.fin : post.kind === 'minister' ? PERSON_BY_ID[post.id]?.group === 'minister' && !!s.people[post.id]
    : post.kind === 'adviser' ? REPLACEABLE.includes(post.id) && !!s.chars[post.id]
    : post.kind === 'institution' ? !!s.institutions?.some((i) => i.id === post.id) : post.kind === 'asset' && !!s.assets?.some((a) => a.id === post.id);
  if (!valid || s.vacancies?.[appointmentKey(post)]) return { ok: false, reason: 'No filled post to leave vacant.' };
  return moves > 0 && s.pc >= 2 ? { ok: true } : { ok: false, reason: 'Needs one move and two political capital.' };
}
export function leaveVacant(s: GameState, post: AppointmentPost, moves: number): string {
  const can = canLeaveVacant(s, post, moves); if (!can.ok) throw new Error(can.reason);
  const old = holder(s, post) ?? 'The officeholder';
  if (post.kind === 'finance' || post.kind === 'adviser') {
    const key = post.kind === 'finance' ? 'fin' : post.id, c = s.chars[key];
    Object.assign(c, { name: `Vacant: ${c.role}`, short: 'Vacant', competence: 0, loyalty: 0, integrity: 0, clout: 0, patron: 'president', rep: { competence: 0, loyalty: 0 } });
  } else if (post.kind === 'minister') {
    Object.assign(s.people[post.id], { name: `Vacant: ${PERSON_BY_ID[post.id].title}`, short: 'Vacant', competence: 0, integrity: 0, clout: 0, gone: true });
    for (const [role, ministry] of Object.entries(LINKED_POSTS)) if (ministry === post.id && s.chars[role]) {
      Object.assign(s.chars[role], { name: `Vacant: ${s.chars[role].role}`, short: 'Vacant', competence: 0, loyalty: 0, integrity: 0, clout: 0, rep: { competence: 0, loyalty: 0 } });
      (s.vacancies ??= {})[`adviser:${role}`] = { post: { kind: 'adviser', id: role }, at: clockOf(s).worldMonth, previousName: old };
    }
  }
  else {
    const x = (post.kind === 'institution' ? s.institutions : s.assets)!.find((x) => x.id === post.id)!;
    x.head = { ...actingHead('Vacant: no appointed head'), competence: 0, loyalty: 0, integrity: 0, rep: { competence: 0, loyalty: 0 } };
  }
  const c = s.talent?.pool.find((c) => c.name === old); if (c && s.talent) s.talent.taken = s.talent.taken.filter((id) => id !== c.id);
  (s.vacancies ??= {})[appointmentKey(post)] = { post: structuredClone(post), at: clockOf(s).worldMonth, previousName: old };
  s.pc -= 2; s.desk.actionsUsed++; reconcileRecruitment(s);
  return `${old} leaves. The post remains vacant by presidential choice; career staff continue without an appointed head.`;
}
export function canApproach(s: GameState, id: string, post: AppointmentPost, terms: string[], moves: number): { ok: boolean; reason?: string } {
  const c = CANDIDATE_BY_ID[id], r = current(s, id);
  if (!validPost(s, id, post)) return { ok: false, reason: 'This is not a suitable, available post.' };
  if (!Array.isArray(terms) || new Set(terms).size !== terms.length || terms.some((t) => !c.exceptional!.conditions.some((k) => k.id === t))) return { ok: false, reason: 'Answer only the stated appointment terms.' };
  if (r && ['agreed', 'active', 'suspended', 'resigned'].includes(r.status)) return { ok: false, reason: r.status === 'resigned' ? 'Will not return to this administration after the breach.' : 'This administration already has an appointment agreement.' };
  if (r?.status === 'declined' && samePost(r.post, post) && [...r.acceptedTerms].sort().join('|') === [...terms].sort().join('|')) return { ok: false, reason: 'The same offer was declined; change the terms or the post.' };
  const occupied = [s.chars.fin?.name, ...Object.values(s.chars).map((x) => x.name), ...Object.entries(s.people).filter(([, x]) => !x.gone).map(([key, x]) => x.name ?? PERSON_BY_ID[key]?.name), ...(s.institutions ?? []).map((x) => x.head.name), ...(s.assets ?? []).map((x) => x.head.name)];
  if (occupied.includes(c.name) && holder(s, post) !== c.name) return { ok: false, reason: 'Already holds another post.' };
  if (s.nation.integrity < 32 && (s.nation.integrity <= s.baseline.integrity - 4 || s.purseTaken.personal >= 10)) return { ok: false, reason: 'Will not serve a government with your record on corruption.' };
  if (moves <= 0 || s.pc < APPROACH_PC) return { ok: false, reason: 'Needs one move and two political capital.' };
  const all = c.exceptional!.conditions.every((k) => terms.includes(k.id));
  if (all && (MONTHLY[id] ?? 0) > s.nation.fiscalSpace) return { ok: false, reason: 'The treasury cannot fund the first month of the specialist team.' };
  return { ok: true };
}
export function approach(s: GameState, id: string, post: AppointmentPost, acceptedTerms: string[], moves: number): string {
  const allowed = canApproach(s, id, post, acceptedTerms, moves);
  if (!allowed.ok) throw new Error(allowed.reason);
  const c = CANDIDATE_BY_ID[id], now = clockOf(s), refused = c.exceptional!.conditions.filter((k) => !acceptedTerms.includes(k.id));
  const reason = refused.length ? `${c.short} declines: ${refused.map((k) => k.text).join(' ')}` : `${c.short} agrees to this post on every stated term. The capability begins only when the appointment takes effect.`;
  const r: Recruitment = { id: `recruit.${now.administrationId}.${id}.${(s.recruitment ?? []).length}`, candidateId: id, administrationId: now.administrationId, post: structuredClone(post), acceptedTerms: [...acceptedTerms], made: now.worldMonth,
    status: refused.length ? 'declined' : 'agreed', reason, monthlyCost: MONTHLY[id] ?? 0, missed: 0, arrears: 0, funding: true, peopleFloor: s.budget.alloc.people, agencyFloor: fundingRank(s), budgetYear: s.budget.year,
    archiveFrom: s.archive.length, leanedCases: (s.cases ?? []).filter((x) => x.leaned).map((x) => x.id), grantedRequests: Object.values(s.governance?.requests ?? {}).filter((x) => x.status === 'granted').map((x) => x.id), payments: [], history: [{ at: now.worldMonth, text: reason }] };
  (s.recruitment ??= []).push(r); s.pc -= APPROACH_PC; s.desk.actionsUsed++;
  return reason;
}
/** Every legacy hiring route must check the exact post, not just a candidate's name. */
export function canAppointExceptional(s: GameState, id: string, post: AppointmentPost, otherCashCost = 0): { ok: boolean; reason?: string } {
  if (!CANDIDATE_BY_ID[id]?.exceptional) return { ok: true };
  const r = current(s, id);
  if (!r || r.status !== 'agreed' || !samePost(r.post, post)) return { ok: false, reason: 'Requires a negotiated appointment on the stated terms for this exact post.' };
  if (s.nation.integrity < 32 && (s.nation.integrity <= s.baseline.integrity - 4 || s.purseTaken.personal >= 10)) return { ok: false, reason: 'Will not serve a government with your record on corruption.' };
  if (id === 'cand.adeyemo' && s.budget.alloc.people < r.peopleFloor) return { ok: false, reason: 'The allocation agreed during negotiation has already been cut.' };
  if (r.monthlyCost + otherCashCost > s.nation.fiscalSpace) return { ok: false, reason: 'Insufficient cash for the appointment and its first specialist-team payment.' };
  return { ok: true };
}
export function exceptionalRefusal(s: GameState, id: string, role?: string): string | null {
  const r = current(s, id);
  return r?.status === 'agreed' && (!role || recruitmentRole(r.post) === role) ? null : 'Requires a negotiated appointment on the stated terms.';
}
function record(s: GameState, r: Recruitment, text: string, failure = false) {
  r.history.push({ at: clockOf(s).worldMonth, text }); r.reason = text;
  s.report.push({ kind: failure ? 'failure' : 'consequence', title: `${CANDIDATE_BY_ID[r.candidateId].short}: appointment terms`, text, changes: [] });
}
function payTeam(s: GameState, r: Recruitment, amount: number, reason: string) {
  s.nation.fiscalSpace -= amount;
  r.payments.push({ at: clockOf(s).worldMonth, amount, reason });
}
function actingHead(name: string) { return { name, competence: 2, loyalty: 3, integrity: 3, patron: 'president', rep: { competence: 2, loyalty: 3 } }; }
function resign(s: GameState, r: Recruitment, reason: string) {
  r.status = 'resigned'; record(s, r, reason, true);
  const p = r.post, c = CANDIDATE_BY_ID[r.candidateId];
  if (p.kind === 'finance' || p.kind === 'adviser') {
    const key = p.kind === 'finance' ? 'fin' : p.id, old = s.chars[key];
    if (old) s.chars[key] = { ...old, ...actingHead(`Acting ${old.role}`), short: 'Acting', clout: 1, rel: 40, notes: [] };
  } else if (p.kind === 'minister') {
    const old = s.people[p.id];
    if (old) Object.assign(old, { name: `Acting ${PERSON_BY_ID[p.id].title}`, short: 'Acting', competence: 2, integrity: 3, clout: 1, since: s.turn, base: 0, marks: [] });
    for (const [role, ministry] of Object.entries(LINKED_POSTS)) if (ministry === p.id && s.chars[role]) Object.assign(s.chars[role], { ...actingHead(`Acting ${PERSON_BY_ID[p.id].title}`), short: 'Acting', clout: 1 });
  } else {
    const x = (p.kind === 'asset' ? s.assets : s.institutions)?.find((x) => x.id === p.id);
    if (x) { x.head = actingHead('An acting head'); x.since = s.turn; }
  }
  if (s.talent) s.talent.taken = s.talent.taken.filter((id) => id !== c.id);
  if (c.id === 'cand.nwachukwu') { s.blocs.establishment = Math.max(0, s.blocs.establishment - 8); s.tycoons.ty_bank.rel = Math.max(0, s.tycoons.ty_bank.rel - 8); }
  if (c.id === 'cand.udeagha') { s.nation.integrity = Math.max(0, s.nation.integrity - 3); s.blocs.press = Math.max(0, s.blocs.press - 5); s.counters['graft.trustLost'] = (s.counters['graft.trustLost'] ?? 0) + 1; }
  if (c.id === 'cand.adeyemo') { s.flags['uni.agreement'] = 'broken'; s.queue.push({ event: 'uni.strike', due: s.turn + 1 }); }
  s.news.push({ chronicle: `${c.short.toUpperCase()} RESIGNS OVER BROKEN APPOINTMENT TERMS`, street: `${c.short.toUpperCase()} DON LEAVE. THE TERMS WERE WRITTEN`, weight: 6, valence: -1, topic: 'people', body: reason });
}
/** Activate after the actual appointment; record removal before checking unrelated successors. */
export function reconcileRecruitment(s: GameState): void {
  const now = clockOf(s);
  for (const [key, v] of Object.entries(s.vacancies ?? {})) { const name = holder(s, v.post); if (name && !name.startsWith('Vacant:')) delete s.vacancies![key]; }
  for (const r of s.recruitment ?? []) {
    if (r.administrationId !== now.administrationId || !['agreed', 'active', 'suspended'].includes(r.status)) continue;
    const c = CANDIDATE_BY_ID[r.candidateId];
    if (holder(s, r.post) !== c.name) {
      if (r.status !== 'agreed') { r.status = 'ended'; record(s, r, `${c.short} left the agreed post; its capability and team charges end.`); }
      continue;
    }
    if (r.status === 'agreed') {
      if (r.monthlyCost > s.nation.fiscalSpace) throw new Error('Exceptional appointment took effect without its specialist-team funding');
      r.status = 'active'; r.since = now.worldMonth; r.paidAt = now.worldMonth;
      r.agencyFloor = fundingRank(s); r.budgetYear = s.budget.year;
      r.archiveFrom = s.archive.length; r.leanedCases = (s.cases ?? []).filter((x) => x.leaned).map((x) => x.id);
      r.grantedRequests = Object.values(s.governance?.requests ?? {}).filter((x) => x.status === 'granted').map((x) => x.id);
      if (r.monthlyCost) payTeam(s, r, r.monthlyCost, 'First month of the specialist team');
      record(s, r, `${c.short} takes the agreed post. The accepted terms are now in force.`);
    }
    const recent = s.archive.slice(r.archiveFrom);
    if (c.id === 'cand.nwachukwu' && recent.some((x) => x.eventId === 'fin.gwarzo.budget' && x.choiceId === 'overrule')) resign(s, r, `${c.name} resigns with a published letter: the President overruled the written refusal of unfunded spending.`);
    else if (c.id === 'cand.udeagha' && (recent.some((x) => (x.eventId === 'inst.graft.ally' && x.choiceId === 'stop') || (x.eventId === 'fin.ekpenyong.file' && x.choiceId === 'bury') || (x.eventId === 'favour.offer' && ['review', 'warn'].includes(x.choiceId))) || (s.cases ?? []).some((x) => x.leaned && !r.leanedCases.includes(x.id)) || (r.budgetYear === s.budget.year && fundingRank(s) < r.agencyFloor))) resign(s, r, `${c.name} resigns and publishes the interference: a case was directed from the Villa or the agency's protected funding was cut.`);
    else if (c.id === 'cand.adeyemo' && s.budget.alloc.people < r.peopleFloor) resign(s, r, `${c.name} resigns before the union executive: health and schools were cut below the allocation agreed at appointment.`);
    else if (c.id === 'cand.chukwuma') {
      const appointment = recent.find((x) => x.choiceId === 'grant' && /power|transmission|electricity/i.test(x.headline) && /board|appoint|management|director|nominee/i.test(x.headline))?.headline
        ?? Object.values(s.governance?.requests ?? {}).find((x) => x.status === 'granted' && !r.grantedRequests.includes(x.id) && /power|transmission|electricity/i.test(x.text) && /board|appoint|management|director|nominee/i.test(x.text))?.text;
      if (appointment) resign(s, r, `${c.name} resigns on air and identifies the political appointment: ${appointment}`);
    }
    if (r.status !== 'resigned' && r.budgetYear !== s.budget.year) { r.budgetYear = s.budget.year; r.agencyFloor = fundingRank(s); }
  }
}
export function recruitmentTick(s: GameState): void {
  reconcileRecruitment(s); const now = clockOf(s);
  for (const r of s.recruitment ?? []) {
    if (r.administrationId !== now.administrationId || !['active', 'suspended'].includes(r.status) || !r.monthlyCost || r.paidAt === now.worldMonth) continue;
    r.paidAt = now.worldMonth;
    if (r.funding && r.monthlyCost <= s.nation.fiscalSpace && r.arrears < 1e-12) {
      payTeam(s, r, r.monthlyCost, 'Monthly specialist-team payroll'); r.missed = 0; continue;
    }
    r.arrears += r.monthlyCost; r.missed++;
    if (r.candidateId === 'cand.nwachukwu' || r.missed >= 3) {
      if (r.status !== 'suspended') {
        r.status = 'suspended';
        const c = CANDIDATE_BY_ID[r.candidateId], reason = `${c.short}'s specialist team is unfunded. The capability lapses; the officeholder remains in post.`;
        record(s, r, reason, true);
        s.news.push({ chronicle: `${c.short.toUpperCase()} REPORTS SPECIALIST TEAM FUNDING LAPSE`, street: 'THE OFFICEHOLDER STAYS. THE TEAM MONEY NEVER COME', weight: 3, valence: -1, topic: 'people', body: reason });
      }
    } else record(s, r, `Engineer payroll missed (${r.missed}/3). The team will leave if the third monthly payroll is missed.`, true);
  }
}
export function canFundRecruitment(s: GameState, id: string): { ok: boolean; reason?: string; amount: number } {
  const r = current(s, id), amount = r?.arrears ?? 0;
  if (!r || !['active', 'suspended'].includes(r.status) || !r.monthlyCost) return { ok: false, reason: 'No specialist team in this administration.', amount };
  if (amount > s.nation.fiscalSpace) return { ok: false, reason: 'Insufficient cash to clear the recorded payroll arrears.', amount };
  return { ok: true, amount };
}
export function fundRecruitment(s: GameState, id: string): string {
  const can = canFundRecruitment(s, id); if (!can.ok) throw new Error(can.reason);
  const r = current(s, id)!;
  if (can.amount) payTeam(s, r, can.amount, 'Clear specialist-team payroll arrears');
  r.arrears = 0; r.missed = 0; r.funding = true; r.status = 'active';
  const text = `${CANDIDATE_BY_ID[id].short}'s specialist team is funded again. The capability is restored.`;
  record(s, r, text); return text;
}
export function holdRecruitmentFunding(s: GameState, id: string): string {
  const r = current(s, id);
  if (!r || !['active', 'suspended'].includes(r.status) || !r.monthlyCost) throw new Error('No specialist team to withhold');
  r.funding = false; const text = 'Future specialist-team payroll is held by presidential instruction; missed payments will be recorded.';
  record(s, r, text); return text;
}
export function canPayRecruitmentArrears(s: GameState, recordId: string, amount?: number): { ok: boolean; reason?: string; amount: number } {
  const r = s.recruitment?.find((r) => r.id === recordId), n = amount ?? r?.arrears ?? 0;
  if (!r || !Number.isFinite(n) || n <= 0 || n > r.arrears + 1e-12) return { ok: false, reason: 'Payment must fit the recorded unpaid payroll.', amount: n };
  return n <= s.nation.fiscalSpace ? { ok: true, amount: n } : { ok: false, reason: 'Insufficient treasury cash.', amount: n };
}
export function payRecruitmentArrears(s: GameState, recordId: string, amount?: number): string {
  const can = canPayRecruitmentArrears(s, recordId, amount); if (!can.ok) throw new Error(can.reason);
  const r = s.recruitment!.find((r) => r.id === recordId)!;
  payTeam(s, r, can.amount, `Payroll arrears paid by ${clockOf(s).administrationId}`); r.arrears = Math.max(0, r.arrears - can.amount);
  const text = `Paid ₦${(can.amount * 1000).toFixed(3)}bn of recorded specialist-team payroll arrears. This does not reinstate a former appointment or grant its capability.`;
  record(s, r, text); return text;
}
export function getVacancyView(s: GameState) { return structuredClone(s.vacancies ?? {}); }
export function hasCapability(s: GameState, id: string): boolean {
  return (s.recruitment ?? []).some((r) => r.administrationId === s.governance?.administrationId && r.status === 'active'
    && holder(s, r.post) === CANDIDATE_BY_ID[r.candidateId]?.name && CANDIDATE_BY_ID[r.candidateId]?.exceptional?.capabilities.some((x) => x.id === id));
}
export function getRecruitmentView(s: GameState) {
  return structuredClone((s.recruitment ?? []).map((r) => ({ ...r, currentAdministration: r.administrationId === s.governance?.administrationId,
    capabilities: CANDIDATE_BY_ID[r.candidateId]?.exceptional?.capabilities.map((x) => ({ ...x, active: hasCapability(s, x.id) && r.status === 'active' && r.administrationId === s.governance?.administrationId })) ?? [] })));
}
