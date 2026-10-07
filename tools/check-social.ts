import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../content/names';
import { newGame, applyAction } from '../engine/reduce';
import { currentWant, refreshRequests, refuse } from '../engine/wants';
import { openRequest, closeRequest, substituteRequest } from '../engine/requests';
import { addFavour } from '../engine/vars';
import { bindFavours, getFavourView, offsetFavours, canOffsetFavours, canForgiveFavour } from '../engine/favour-ledger';
import { canUseFavour, callFavour, dueCreditor } from '../engine/favours';
import { runOp } from '../engine/ops';
import { pledge, pledgeTick } from '../engine/promises';
import { ensureGovernance } from '../engine/governance';

const setup = { seed: 42, name: 'Tester', party: 'PSC', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = () => { const s = newGame(setup); s.phase = 'desk'; s.pc = 50; s.favours = []; s.favourSettlements = []; return s; };
const favour = (s: ReturnType<typeof fresh>, who: string, dir: 'owed' | 'owing', size: number) => { addFavour(s, who, dir, size, 'Test obligation'); bindFavours(s); return s.favours.at(-1)!; };

export function runSocialChecks(): number {
  let passed = 0;
  const check = (label: string, test: () => void) => { test(); passed++; process.stdout.write('PASS ' + label + '\n'); };
  check('refusal closes the exact ask without erasing debt or repeating unchanged requests', () => {
    const s = fresh(), id = Object.keys(s.people).find((id) => currentWant(s, id))!;
    const initial = currentWant(s, id)!;
    const debt = favour(s, id, 'owing', 2);
    const before = JSON.stringify(s);
    const out = applyAction(s, { type: 'PERSON', id, op: 'refuse' });
    assert.equal(JSON.stringify(s), before);
    assert.equal(out.governance!.requests[initial.recordId!].status, 'refused');
    assert.equal(out.favours.find((f) => f.id === debt.id)!.size, 2);
    assert.equal(currentWant(out, id), null);
    out.turn += 8; refreshRequests(out, id);
    const second = currentWant(out, id);
    if (second) {
      assert.notEqual(second.recordId, initial.recordId);
      assert.ok(second.id !== initial.id || second.text !== initial.text || second.naira !== initial.naira || second.pc !== initial.pc);
      refuse(out, id);
      assert.equal(out.people[id].grudge, undefined);
    }
  });
  check('closed requests require changed terms; accepted substitutes close with history', () => {
    const s = fresh(), who = Object.keys(s.people)[0];
    const spec = { id: 'test.ask', requester: { office: who }, object: 'new-road', text: 'Build a road', terms: { description: 'Full road', naira: 1, politicalCapital: 2 } };
    openRequest(s, spec); closeRequest(s, spec.id, 'refused', 'Too expensive');
    const before = JSON.stringify(s);
    assert.throws(() => openRequest(s, { ...spec, id: 'test.repeat', previous: spec.id, changedBy: 'offer', terms: { politicalCapital: 2, naira: 1, description: 'Full road' } }));
    assert.equal(JSON.stringify(s), before);
    openRequest(s, { ...spec, id: 'test.revised', previous: spec.id, changedBy: 'offer', terms: { description: 'Shorter road', naira: 0.2 } });
    substituteRequest(s, 'test.revised', 'Repair the existing road', false);
    assert.equal(s.governance!.requests['test.revised'].status, 'open');
    const terms = { description: 'Repair only', naira: 0.1 };
    substituteRequest(s, 'test.revised', 'Repair the existing road', true, terms); terms.naira = 999;
    const r = s.governance!.requests['test.revised'];
    assert.equal(r.status, 'substituted'); assert.equal(r.history!.length, 3);
    assert.equal(r.substitution!.terms!.naira, 0.1);
  });
  check('bilateral settlement preserves residual strength and creates no money or capital', () => {
    const s = fresh(), who = Object.keys(s.people)[0];
    const a = favour(s, who, 'owed', 3), b = favour(s, who, 'owing', 2);
    const cash = s.nation.fiscalSpace, pc = s.pc;
    const out = applyAction(s, { type: 'SETTLE_FAVOURS', ids: [a.id, b.id] });
    assert.equal(out.favours.length, 1); assert.equal(out.favours[0].size, 1);
    assert.equal(out.nation.fiscalSpace, cash); assert.equal(out.pc, pc);
    assert.equal(out.favourSettlements!.length, 2); assert.equal(out.favourSettlements![0].otherId, b.id);
    assert.equal(s.favours.length, 2);
  });
  check('cross-person offsets and forgiving money you owe are rejected', () => {
    const s = fresh(), people = Object.keys(s.people);
    const a = favour(s, people[0], 'owed', 3), b = favour(s, people[1], 'owing', 2);
    const before = JSON.stringify(s);
    assert.equal(canOffsetFavours(s, a.id, b.id).ok, false);
    assert.throws(() => offsetFavours(s, a.id, b.id));
    assert.equal(canForgiveFavour(s, b.id).ok, false);
    assert.equal(JSON.stringify(s), before);
  });
  check('invalid favour services spend nothing; valid partial calls retain the balance', () => {
    const s = fresh(), who = Object.keys(s.people)[0]; s.people[who].rel = 80;
    const f = favour(s, who, 'owed', 3);
    const before = JSON.stringify(s);
    assert.equal(canUseFavour(s, f.id, 'cash', 1).ok, false);
    assert.throws(() => callFavour(s, f, 'magic'));
    assert.equal(JSON.stringify(s), before);
    const pc = s.pc; callFavour(s, f, 'capital', 1);
    assert.equal(s.pc, pc + 5); assert.equal(s.favours[0].size, 2);
    assert.equal(s.favourSettlements![0].units, 1);
    s.favours[0].eligibleUses = ['decision'];
    assert.equal(canUseFavour(s, f.id, 'capital', 1).ok, false);
  });
  check('request withdrawal spends one unit and closes only the specified request', () => {
    const s = fresh(), who = Object.keys(s.people)[0]; s.people[who].rel = 80;
    const f = favour(s, who, 'owed', 3), initial = currentWant(s, who)!;
    openRequest(s, { id: 'test.other', requester: { office: who }, object: 'other', text: 'Another request' });
    callFavour(s, f, 'withdraw-request', undefined, initial.recordId);
    assert.equal(s.governance!.requests[initial.recordId!].status, 'withdrawn');
    assert.equal(s.governance!.requests['test.other'].status, 'open');
    assert.equal(s.favours[0].size, 2);
  });
  check('repudiation closes repayment demands but retains the underlying debt', () => {
    const s = fresh(), who = Object.keys(s.people).find((id) => id.startsWith('gov'))!;
    const f = favour(s, who, 'owing', 2); s.turn = 20;
    assert.equal(dueCreditor(s, 'governor'), who);
    runOp(s, ['repudiate', who]);
    assert.equal(s.favours.find((x) => x.id === f.id)!.size, 2);
    assert.equal(dueCreditor(s, 'governor'), null);
    assert.ok(Object.values(s.governance!.requests).some((r) => r.object === 'repay-favour:' + f.id && r.status === 'refused'));
    const n = Object.keys(s.governance!.requests).length; runOp(s, ['repudiate', who]);
    assert.equal(Object.keys(s.governance!.requests).length, n);
  });
  check('a decision spends a credit without deleting debts owed to the same person', () => {
    const s = fresh(), who = Object.keys(s.people)[0];
    favour(s, who, 'owed', 1); const owing = favour(s, who, 'owing', 3); const other = favour(s, who, 'owed', 2);
    runOp(s, ['void', who]);
    assert.equal(s.favours.find((f) => f.id === owing.id)!.size, 3);
    assert.equal(s.favours.find((f) => f.id === other.id)!.size, 2);
  });
  check('replacement and succession do not transfer personal claims; history remains independent', () => {
    const s = fresh(); s.people.min_works.rel = 80;
    const f = favour(s, 'min_works', 'owed', 3);
    s.people.min_works.name = 'Replacement Person'; ensureGovernance(s);
    assert.equal(canUseFavour(s, f.id, 'capital', 1).ok, false);
    assert.equal(getFavourView(s).balances[0].currentParties, false);
    const next = newGame({ ...setup, name: 'Successor' }, s);
    assert.equal(canUseFavour(next, f.id, 'capital', 1).ok, false);
    assert.ok(next.favours.some((x) => x.id === f.id));
    assert.equal(new Set(next.favours.map((x) => x.id)).size, next.favours.length);
    next.favours.find((x) => x.id === f.id)!.size = 1;
    assert.equal(s.favours.find((x) => x.id === f.id)!.size, 3);
    runOp(next, ['spendall']); assert.ok(next.favours.some((x) => x.id === f.id));
  });
  check('a promise to satisfy one ask cannot be kept by granting a later different ask', () => {
    const s = fresh(), who = Object.keys(s.people)[0];
    pledge(s, who, 'want', undefined, 'I will grant this request', 24);
    const p = s.pledges!.at(-1)!; assert.ok(p.requestId);
    refuse(s, who); s.people[who].grants = 10; s.people[who].granted = true;
    pledgeTick(s); assert.equal(p.status, 'open');
  });
  check('partial forgiveness preserves the residual claim and every debt you owe', () => {
    const s = fresh(), who = Object.keys(s.people)[0];
    const a = favour(s, who, 'owed', 3), b = favour(s, who, 'owing', 2);
    const out = applyAction(s, { type: 'FORGIVE_FAVOUR', id: a.id, units: 1 });
    assert.equal(out.favours.find((f) => f.id === a.id)!.size, 2);
    assert.equal(out.favours.find((f) => f.id === b.id)!.size, 2);
    assert.equal(out.favourSettlements![0].mode, 'forgiven');
  });
  check('a businessman buying government bonds creates the matching liability', () => {
    const s = fresh(), who = Object.keys(s.tycoons)[0]; s.tycoons[who].rel = 80;
    const f = favour(s, who, 'owed', 2);
    const cash = s.nation.fiscalSpace, debt = s.debts.bonds;
    callFavour(s, f, 'bonds', 1);
    assert.ok(Math.abs(s.nation.fiscalSpace - cash - 0.15) < 1e-9);
    assert.ok(Math.abs(s.debts.bonds - debt - 0.15) < 1e-9);
    assert.equal(s.favours[0].size, 1);
    // Private investment is not financing: no treasury money, and no liability (plan 05.A10).
    const cash2 = s.nation.fiscalSpace, debt2 = s.debts.bonds;
    callFavour(s, s.favours[0], 'invest', 1);
    assert.equal(s.nation.fiscalSpace, cash2); assert.equal(s.debts.bonds, debt2);
  });
  check('ministerial acceleration is unavailable with no reform to accelerate', () => {
    const s = fresh(); s.people.min_works.rel = 80;
    const f = favour(s, 'min_works', 'owed', 2);
    assert.equal(canUseFavour(s, f.id, 'overtime', 1).ok, false);
  });
  return passed;
}
