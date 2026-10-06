import assert from 'node:assert/strict';
import { CANDIDATE_BY_ID } from '../content/candidates';
import { EVENTS } from '../content';
import { FINANCE_CANDIDATES } from '../content/names';
import { applyAction, newGame, availability, canAppoint } from '../engine/reduce';
import { canAppointExceptional, canApproach, getRecruitmentView, hasCapability, reconcileRecruitment, recruitmentTick, type AppointmentPost } from '../engine/recruitment';
import { getCandidateView, proposedSlate, talent } from '../engine/talent';
import { materialise } from '../engine/cast';
import { getVar } from '../engine/vars';
import { convictionOdds, trialLength, charge, caseTick } from '../engine/cases';
import { syncDebt } from '../engine/ledger';
import { ensureGovernance, clockOf } from '../engine/governance';
import { canEstablish, establish, canReplaceHead } from '../engine/institutions';
import { canReplaceAdviser, adviser } from '../engine/advice';
import { canSetManager } from '../engine/places';
import { openRequest, closeRequest } from '../engine/requests';
const setup = { seed: 42, name: 'Tester', party: 'PSC', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = () => { const s = newGame(setup); s.phase = 'desk'; s.pc = 100; s.nation.fiscalSpace = 10; talent(s); return s; };
const terms = (id: string) => CANDIDATE_BY_ID[id].exceptional!.conditions.map((x) => x.id);
function agree(s: ReturnType<typeof fresh>, id: string, post: AppointmentPost) { return applyAction(s, { type: 'APPROACH_CANDIDATE', id, post, acceptedTerms: terms(id) }); }
function hired(id: string, post: AppointmentPost) {
  let s = agree(fresh(), id, post); s.desk.actionsUsed = 0;
  const name = CANDIDATE_BY_ID[id].name;
  if (post.kind === 'finance') s = applyAction(s, { type: 'REPLACE_FIN', name });
  else if (post.kind === 'minister') s = applyAction(s, { type: 'REPLACE_MINISTER', id: post.id, kind: 'technocrat', name });
  else if (post.kind === 'adviser') s = applyAction(s, { type: 'REPLACE_ADVISER', role: post.id, name });
  else if (post.kind === 'institution') s = applyAction(s, { type: 'ESTABLISH', id: post.id, head: name });
  else s = applyAction(s, { type: 'SET_MANAGER', id: post.id, name });
  assert.equal(s.recruitment!.at(-1)!.status, 'active');
  return s;
}
function choose(s: ReturnType<typeof fresh>, eventId: string, choiceId: string) { s.phase = 'desk'; s.desk.lead = { eventId }; return applyAction(s, { type: 'CHOOSE', eventId, choiceId }); }
export function runRecruitmentChecks(): number {
  let n = 0; const check = (label: string, run: () => void) => { run(); n++; process.stdout.write('PASS ' + label + '\n'); };
  check('declining one exceptional term closes the approach; unchanged retries do not consume more capital', () => {
    const s = fresh(), id = 'cand.nwachukwu', post = { kind: 'finance' } as const;
    const out = applyAction(s, { type: 'APPROACH_CANDIDATE', id, post, acceptedTerms: [terms(id)[0]] });
    assert.equal(out.recruitment!.at(-1)!.status, 'declined'); assert.match(out.recruitment!.at(-1)!.reason, /twelve specialists/);
    assert.equal(s.recruitment, undefined); assert.equal(out.pc, s.pc - 2);
    const retry = applyAction(out, { type: 'APPROACH_CANDIDATE', id, post, acceptedTerms: [terms(id)[0]] });
    assert.equal(retry.pc, out.pc); assert.equal(retry.recruitment!.length, 1);
    const changed = agree(out, id, post); assert.equal(changed.recruitment!.at(-1)!.status, 'agreed'); assert.equal(hasCapability(changed, 'cap.debt_restructuring'), false);
  });
  check('an agreement is bound to its exact post, and every alternate hiring route checks it', () => {
    const s = agree(fresh(), 'cand.chukwuma', { kind: 'institution', id: 'power' }), c = CANDIDATE_BY_ID['cand.chukwuma'];
    assert.equal(canAppointExceptional(s, c.id, { kind: 'minister', id: 'min_power' }).ok, false);
    const denied = applyAction(s, { type: 'REPLACE_MINISTER', id: 'min_power', kind: 'technocrat', name: c.name }); assert.notEqual(denied.people.min_power.name, c.name);
    assert.equal(canReplaceAdviser(s, 'power', c.name, 1).ok, false);
    s.assets = [{ id: 'nuclear', state: 'KN', since: 1, head: { name: 'An acting head', competence: 2, loyalty: 3, integrity: 3, patron: 'president', rep: { competence: 2, loyalty: 3 } } }];
    assert.equal(canSetManager(s, 'nuclear', c.name, 1).ok, false);
    const finance = agree(fresh(), 'cand.nwachukwu', { kind: 'institution', id: 'fund' }); finance.desk.actionsUsed = 0;
    const bypass = applyAction(finance, { type: 'REPLACE_FIN', name: CANDIDATE_BY_ID['cand.nwachukwu'].name }); assert.notEqual(bypass.chars.fin.name, CANDIDATE_BY_ID['cand.nwachukwu'].name);
    assert.equal(canReplaceHead(s, 'power', c.name, 1).ok, false); // not built yet
  });
  check('the real Finance appointment activates its capability and debits twelve exact monthly team payments once', () => {
    const s = hired('cand.nwachukwu', { kind: 'finance' }), r = s.recruitment!.at(-1)!;
    assert.equal(getVar(s, 'cap.debt_restructuring'), 1); assert.equal(s.governance!.offices['adviser:fin'], 'cand.nwachukwu');
    const start = s.nation.fiscalSpace; recruitmentTick(s); assert.equal(s.nation.fiscalSpace, start);
    for (let i = 0; i < 11; i++) { s.turn++; recruitmentTick(s); }
    assert.equal(r.payments.length, 12); assert.ok(Math.abs(r.payments.reduce((a, x) => a + x.amount, 0) - 0.004) < 1e-12);
    assert.ok(Math.abs(start - s.nation.fiscalSpace - 11 * 0.004 / 12) < 1e-12);
  });
  check('appointment funding is checked again after negotiation, including establishment costs', () => {
    const s = agree(fresh(), 'cand.nwachukwu', { kind: 'finance' }); s.nation.fiscalSpace = 0; s.desk.actionsUsed = 0;
    const out = applyAction(s, { type: 'REPLACE_FIN', name: CANDIDATE_BY_ID['cand.nwachukwu'].name }); assert.equal(out.chars.fin.name, s.chars.fin.name); assert.equal(out.pc, s.pc);
    const inst = agree(fresh(), 'cand.chukwuma', { kind: 'institution', id: 'power' }); inst.nation.fiscalSpace = 0.0005;
    assert.equal(canEstablish(inst, 'power', CANDIDATE_BY_ID['cand.chukwuma'].name, 1).ok, false);
    assert.throws(() => establish(inst, 'power', CANDIDATE_BY_ID['cand.chukwuma'].name));
  });
  check('unfunded debt expertise lapses without sacking the minister; actual payroll payment restores it', () => {
    let s = hired('cand.nwachukwu', { kind: 'finance' }); const name = s.chars.fin.name;
    s = applyAction(s, { type: 'HOLD_RECRUITMENT', id: 'cand.nwachukwu' }); s.turn++; recruitmentTick(s);
    assert.equal(hasCapability(s, 'cap.debt_restructuring'), false); assert.equal(s.chars.fin.name, name);
    const arrears = s.recruitment!.at(-1)!.arrears, cash = s.nation.fiscalSpace;
    const out = applyAction(s, { type: 'FUND_RECRUITMENT', id: 'cand.nwachukwu' });
    assert.ok(Math.abs(cash - out.nation.fiscalSpace - arrears) < 1e-12); assert.equal(hasCapability(out, 'cap.debt_restructuring'), true); assert.equal(out.recruitment!.at(-1)!.arrears, 0);
  });
  check('engineers leave after three missed payrolls, not the first; replacement stops future charges', () => {
    let s = hired('cand.chukwuma', { kind: 'minister', id: 'min_power' });
    s = applyAction(s, { type: 'HOLD_RECRUITMENT', id: 'cand.chukwuma' });
    for (let i = 1; i <= 3; i++) { s.turn++; recruitmentTick(s); assert.equal(hasCapability(s, 'cap.grid_diagnostics'), i < 3); }
    s.desk.actionsUsed = 0; const out = applyAction(s, { type: 'REPLACE_MINISTER', id: 'min_power', kind: 'technocrat' });
    const r = out.recruitment!.at(-1)!; assert.equal(r.status, 'ended'); const payments = r.payments.length, debt = r.arrears;
    out.turn++; recruitmentTick(out); assert.equal(r.payments.length, payments); assert.equal(r.arrears, debt);
  });
  check('political electricity appointments cause the named engineer to resign, without punishing old requests', () => {
    const s = hired('cand.chukwuma', { kind: 'minister', id: 'min_power' });
    openRequest(s, { id: 'test.power.board', requester: { office: 'gov_nw' }, object: 'transmission-board', text: 'Appoint a political nominee to the transmission company board.' });
    closeRequest(s, 'test.power.board', 'granted', 'Appointment approved'); reconcileRecruitment(s); ensureGovernance(s);
    assert.equal(s.recruitment!.at(-1)!.status, 'resigned'); assert.equal(hasCapability(s, 'cap.grid_diagnostics'), false);
    assert.match(s.news.at(-1)!.body!, /political appointment/); assert.equal(canApproach(s, 'cand.chukwuma', { kind: 'minister', id: 'min_power' }, terms('cand.chukwuma'), 1).ok, false);
  });
  check('cutting the protected education allocation resigns the mediator and breaks the settlement', () => {
    const s = hired('cand.adeyemo', { kind: 'adviser', id: 'edu' }); const floor = s.budget.alloc.people;
    s.budget.alloc.people = floor - 1; reconcileRecruitment(s);
    assert.equal(s.recruitment!.at(-1)!.status, 'resigned'); assert.equal(s.flags['uni.agreement'], 'broken'); assert.ok(s.queue.some((x) => x.event === 'uni.strike'));
  });
  check('prosecution capability improves odds and duration; a mid-year budget cut ends it and damages lasting trust', () => {
    const ordinary = fresh(); charge(ordinary, 'gov_nw', 'Financial transfers', 0.04); const base = convictionOdds(ordinary, ordinary.cases![0]).p, length = trialLength(ordinary);
    const s = hired('cand.udeagha', { kind: 'institution', id: 'graft' }); charge(s, 'gov_nw', 'Financial transfers', 0.04);
    assert.ok(convictionOdds(s, s.cases![0]).p > base); assert.ok(trialLength(s) < length);
    const out = applyAction(s, { type: 'FUND_INSTITUTION', id: 'graft', level: 'lean' });
    assert.equal(hasCapability(out, 'cap.complex_prosecution'), false); assert.equal(out.recruitment!.at(-1)!.status, 'resigned'); assert.equal(out.counters['graft.trustLost'], 1);
  });
  check('a fresh case instruction triggers the prosecutor’s published resignation', () => {
    const s = hired('cand.udeagha', { kind: 'minister', id: 'min_justice' }); charge(s, 'gov_nw', 'Financial transfers', 0.04);
    const out = applyAction(s, { type: 'CASE', id: s.cases![0].id, op: 'drop' }); assert.equal(out.recruitment!.at(-1)!.status, 'resigned'); assert.match(out.news.at(-1)!.body!, /case was directed/);
  });
  check('debt negotiation through CHOOSE conserves principal, charges its fee and reduces actual debt service', () => {
    const s = hired('cand.nwachukwu', { kind: 'finance' }); s.debts.bonds += 10; syncDebt(s);
    const principal = { ...s.debts }, cash = s.nation.fiscalSpace, service = s.nation.debt;
    const out = choose(s, 'debt.crisis', 'expert.restructure');
    assert.deepEqual(out.debts, principal); assert.ok(Math.abs(out.nation.fiscalSpace - (cash - 0.12)) < 1e-12); assert.ok(out.nation.debt < service);
    assert.equal(out.flags['crisis.last'], 'negotiated'); assert.equal(s.debtTerms, undefined);
  });
  check('expert refinancing changes only the redeemed share’s coupon, not outstanding principal', () => {
    const s = hired('cand.nwachukwu', { kind: 'finance' }); s.debts.bonds = 2; syncDebt(s); assert.ok(s.nation.debt < 90);
    const out = choose(s, 'debt.maturity', 'expert.refinance'); assert.deepEqual(out.debts, s.debts);
    assert.ok(Math.abs(out.debtTerms!.eurobond!.rateFactor - (1 - 0.08 * 1.5 / s.debts.eurobond)) < 1e-12);
    assert.ok(Math.abs(s.nation.fiscalSpace - out.nation.fiscalSpace - 0.06) < 1e-12);
  });
  check('diagnosing gas arrears pays the exact invoice once, and inactive expertise exposes no extra choice', () => {
    const s = hired('cand.chukwuma', { kind: 'minister', id: 'min_power' }); s.debts.gas = 0.8;
    const out = choose(s, 'grid.collapse', 'expert.remedy'); assert.equal(out.debts.gas, 0); assert.ok(Math.abs(s.nation.fiscalSpace - out.nation.fiscalSpace - 0.8) < 1e-12); assert.equal(out.flags['grid.diagnosis'], 'gas');
    assert.ok(!materialise(fresh(), EVENTS['grid.collapse'], undefined).choices.some((x) => x.id === 'expert.remedy'));
  });
  check('the negotiated university deal records and pays its real balance once through the reducer', () => {
    let s = hired('cand.adeyemo', { kind: 'adviser', id: 'edu' }); const cash = s.nation.fiscalSpace;
    s = choose(s, 'uni.ultimatum', 'expert.settlement'); const id = `uni.negotiated.${s.governance!.administrationId}`;
    assert.ok(Math.abs(cash - s.nation.fiscalSpace - 0.075) < 1e-12); assert.equal(s.governance!.commitments[id].resources!.released, 0); assert.ok(s.queue.some((x) => x.event === 'uni.negotiated.balance'));
    s.turn += 12; const dueCash = s.nation.fiscalSpace; s.desk.lead = null; s.desk.minors = [{ eventId: 'uni.negotiated.balance' }];
    const out = applyAction(s, { type: 'CHOOSE', eventId: 'uni.negotiated.balance', choiceId: 'pay' });
    assert.ok(Math.abs(dueCash - out.nation.fiscalSpace - 0.15) < 1e-12); assert.equal(out.governance!.commitments[id].review!.verdict, 'met');
    const twice = applyAction(out, { type: 'CHOOSE', eventId: 'uni.negotiated.balance', choiceId: 'pay' }); assert.equal(twice.nation.fiscalSpace, out.nation.fiscalSpace);
  });
  check('unfunded university balances have a real withheld verdict and strike follow-up', () => {
    let s = hired('cand.adeyemo', { kind: 'adviser', id: 'edu' }); s = choose(s, 'uni.strike', 'expert.settlement'); s.turn += 12; s.nation.fiscalSpace = 0;
    const e = materialise(s, EVENTS['uni.negotiated.balance'], undefined); assert.equal(availability(s, e.choices[0]).ok, false);
    s.desk.lead = null; s.desk.minors = [{ eventId: e.id }];
    const out = applyAction(s, { type: 'CHOOSE', eventId: e.id, choiceId: 'wait' }); assert.equal(Object.values(out.governance!.commitments).find((x) => x.object === 'negotiated-university-balance')!.review!.verdict, 'withheld'); assert.equal(out.flags['uni.agreement'], 'broken');
  });
  check('views and materialised choices are detached; a successor inherits signed debt terms but no personal capability', () => {
    const s = choose(hired('cand.nwachukwu', { kind: 'finance' }), 'debt.crisis', 'expert.restructure'), before = JSON.stringify(s), rng = s.rng;
    getRecruitmentView(s)[0].acceptedTerms.length = 0; getCandidateView(s)[0].name = 'Changed'; materialise(s, EVENTS['debt.crisis'], undefined);
    assert.equal(JSON.stringify(s), before); assert.equal(s.rng, rng);
    const next = newGame({ ...setup, name: 'Successor' }, s); assert.deepEqual(next.debtTerms, s.debtTerms); assert.equal(hasCapability(next, 'cap.debt_restructuring'), false);
    assert.equal(next.recruitment![0].status, 'ended'); next.recruitment![0].history.length = 0; assert.notEqual(s.recruitment![0].history.length, 0);
    assert.ok(clockOf(next).worldMonth >= clockOf(s).worldMonth);
  });
  check('the shared appointment action charges one appointment and one team payment, with linked office identity', () => {
    const post = { kind: 'minister', id: 'min_power' } as const;
    const s = agree(fresh(), 'cand.chukwuma', post); s.desk.actionsUsed = 0;
    const before = JSON.stringify(s); assert.equal(canAppoint(s, 'cand.chukwuma', post, 1).ok, true); assert.equal(JSON.stringify(s), before);
    const out = applyAction(s, { type: 'APPOINT', id: 'cand.chukwuma', post });
    assert.equal(out.desk.actionsUsed, 1); assert.equal(out.recruitment!.at(-1)!.payments.length, 1);
    assert.equal(out.chars.power.name, out.people.min_power.name);
    assert.equal(out.governance!.offices.min_power, 'cand.chukwuma'); assert.equal(out.governance!.offices['adviser:power'], 'cand.chukwuma');
  });
  check('a deliberately vacant ministry loses its capability and both linked identities, and can be filled again', () => {
    const s = hired('cand.chukwuma', { kind: 'minister', id: 'min_power' }); s.desk.actionsUsed = 0;
    const out = applyAction(s, { type: 'LEAVE_VACANT', post: { kind: 'minister', id: 'min_power' } });
    assert.equal(out.recruitment!.at(-1)!.status, 'ended'); assert.equal(hasCapability(out, 'cap.grid_diagnostics'), false);
    assert.equal(out.governance!.offices.min_power, undefined); assert.equal(out.governance!.offices['adviser:power'], undefined); assert.equal(adviser(out, 'power'), null);
    out.desk.actionsUsed = 0;
    const filled = applyAction(out, { type: 'REPLACE_MINISTER', id: 'min_power', kind: 'technocrat' });
    assert.equal(filled.vacancies!.min_power, undefined); assert.equal(filled.vacancies!['adviser:power'], undefined);
    assert.ok(filled.governance!.offices.min_power); assert.equal(filled.chars.power.name, filled.people.min_power.name);
  });
  check('a successor can pay inherited payroll arrears partially without reinstating an appointment', () => {
    let s = hired('cand.nwachukwu', { kind: 'finance' }); s = applyAction(s, { type: 'HOLD_RECRUITMENT', id: 'cand.nwachukwu' });
    s.turn++; recruitmentTick(s); const r = s.recruitment!.at(-1)!;
    const next = newGame({ ...setup, name: 'Successor' }, s); next.phase = 'desk'; next.nation.fiscalSpace = 1;
    const out = applyAction(next, { type: 'PAY_RECRUITMENT_ARREARS', id: r.id, amount: r.arrears / 2 });
    assert.ok(Math.abs(out.nation.fiscalSpace - (1 - r.arrears / 2)) < 1e-12);
    assert.ok(Math.abs(out.recruitment!.at(-1)!.arrears - r.arrears / 2) < 1e-12);
    assert.equal(out.recruitment!.at(-1)!.status, 'ended'); assert.equal(hasCapability(out, 'cap.debt_restructuring'), false);
    const paid = applyAction(out, { type: 'PAY_RECRUITMENT_ARREARS', id: r.id }); assert.equal(paid.recruitment!.at(-1)!.arrears, 0);
    const twice = applyAction(paid, { type: 'PAY_RECRUITMENT_ARREARS', id: r.id }); assert.equal(twice.nation.fiscalSpace, paid.nation.fiscalSpace);
  });
  check('the opening slate is a detached proposal with unique people and explicit coalition constraints', () => {
    const s = fresh(), before = JSON.stringify(s), slate = proposedSlate(s);
    const ids = slate.appointments.flatMap((a) => a.candidateId ? [a.candidateId] : []);
    assert.equal(new Set(ids).size, ids.length); assert.equal(slate.appointments.length, 8); assert.equal(slate.coalitionConstraints[0].kind, 'zone-balance');
    for (const id of ids) assert.equal(!!CANDIDATE_BY_ID[id].exceptional, false);
    slate.appointments[0].name = 'Changed'; assert.equal(JSON.stringify(s), before);
  });
  check('foreign asset tracing recovers only the stated share once when a powerful accused flees', () => {
    const base = hired('cand.udeagha', { kind: 'minister', id: 'min_justice' }); base.nation.fiscalSpace = 15; charge(base, 'gov_nw', 'Financial transfers', 0.006);
    base.cases![0].stage = 'trial'; base.cases![0].trialFrom = base.turn;
    let fled: typeof base | undefined;
    for (let seed = 1; seed <= 512; seed++) { const s = structuredClone(base); s.rng = seed; caseTick(s); if (s.cases![0].outcome === 'fled') { fled = s; break; } }
    assert.ok(fled, 'a deterministic flight seed must be exercised');
    const c = fled.cases![0]; assert.equal(c.traced!.amount, 0.0015); assert.ok(Math.abs(c.recover - 0.0045) < 1e-12);
    assert.ok(Math.abs(fled.nation.fiscalSpace - base.nation.fiscalSpace - 0.0015) < 1e-12);
    const cash = fled.nation.fiscalSpace; caseTick(fled); assert.equal(fled.nation.fiscalSpace, cash);
  });
  return n;
}
