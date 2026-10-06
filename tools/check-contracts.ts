import { candidate, candidatesFor, getCandidateView, release, take, talent, talentTick } from '../engine/talent';
import { transferSavedFund } from '../engine/fund-transfers';
import { currencyTick, fxFlow } from '../engine/currency';
import { runOp } from '../engine/ops';
import assert from 'node:assert/strict';
import { getVar } from '../engine/vars';
import { bindCast, eventOf, materialise } from '../engine/cast';
import { buildDesk } from '../engine/director';
import { assetPerformance, assetTick, initialiseScenarioAssets, type ScenarioAssets } from '../engine/places';
import { SCENARIO_BY_ID } from '../content/scenarios';
import { canVenture } from '../engine/bets';
import { VENTURE_BY_ID } from '../content/ventures';
import { EVENTS } from '../content';
import { FINANCE_CANDIDATES } from '../content/names';
import { migrate } from '../engine/migrate';
import { applyAction, newGame } from '../engine/reduce';
import { ensureGovernance, markCommitmentsDue } from '../engine/governance';
import { CONTRACT_VERSION, applyDomainOutcome, clockOf, getGovernanceView, resolveActor, presidencyMonthToWorld, worldMonthToPresidency } from '../engine/public';
import type { DomainEffect, DomainOutcome } from '../engine/public';
import type { GameEvent } from '../engine/types';
import { runSocialChecks } from './check-social';

const setup = { seed: 42, name: 'Tester', party: 'PSC', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = () => newGame(setup);
const effect = (...effects: DomainEffect[]): DomainOutcome => ({ version: CONTRACT_VERSION, effects });
let passed = 0;
function check(label: string, run: () => void) { run(); passed++; process.stdout.write(`PASS ${label}\n`); }

check('new worlds have exact clocks; advancement uses world months', () => {
  const s = fresh();
  assert.equal(clockOf(s).worldMonth, 0);
  assert.equal(clockOf(s).accuracy, 'exact');
  s.turn = 7;
  assert.equal(clockOf(s).worldMonth, 6);
});

check('replacement retains predecessor identity without transferring requests', () => {
  const s = fresh();
  const person = resolveActor(s, { office: 'min_works' });
  applyDomainOutcome(s, effect({ type: 'request.open', id: 'old-request', requester: { person }, object: 'road', text: 'Build the road.' }));
  s.people.min_works.name = 'Replacement Test Minister';
  ensureGovernance(s);
  const replacement = resolveActor(s, { office: 'min_works' });
  assert.notEqual(person, replacement);
  assert.equal(s.governance!.requests['old-request'].requester, person);
  assert.ok(s.governance!.persons[person]);
});

check('invalid batch is atomic and unknown versions are rejected', () => {
  const s = fresh();
  const before = JSON.stringify(s);
  assert.throws(() => applyDomainOutcome(s, effect(
    { type: 'episode.open', id: 'a', family: 'power', subject: 'corridor', stage: 'funded', classification: 'decision', note: 'Funds approved.' },
    { type: 'request.close', id: 'missing', status: 'refused', response: 'No.' },
  )), /not open/);
  assert.equal(JSON.stringify(s), before);
  assert.throws(() => applyDomainOutcome(s, { version: 'future', effects: [] } as unknown as DomainOutcome), /version/);
});

check('episode resolution is durable and does not silently reopen', () => {
  const s = fresh();
  applyDomainOutcome(s, effect(
    { type: 'episode.open', id: 'road', family: 'transport', subject: 'north', stage: 'funded', classification: 'decision', note: 'Funding settled.' },
    { type: 'episode.advance', id: 'road', stage: 'delivered', classification: 'progress', note: 'The road opened.' },
    { type: 'episode.resolve', id: 'road', note: 'Completion verified.' },
  ));
  assert.equal(s.governance!.episodes.road.status, 'resolved');
  assert.equal(s.governance!.episodes.road.classification, 'closing');
  assert.throws(() => applyDomainOutcome(s, effect({ type: 'episode.advance', id: 'road', stage: 'funded', classification: 'decision', note: 'Again.' })), /not open/);
});

check('duplicate open requests are rejected and refusal closes the specific object', () => {
  const s = fresh();
  const open: DomainEffect = { type: 'request.open', id: 'ask', requester: { office: 'gov_nw' }, object: 'road-contract', text: 'Award this contract.' };
  applyDomainOutcome(s, effect(open));
  assert.throws(() => applyDomainOutcome(s, effect({ ...open, id: 'duplicate' })), /already/);
  applyDomainOutcome(s, effect({ type: 'request.close', id: 'ask', status: 'refused', response: 'Competitive tender is required.' }));
  assert.equal(s.governance!.requests.ask.status, 'refused');
  assert.equal(s.governance!.requests.ask.object, 'road-contract');
  assert.throws(() => applyDomainOutcome(s, effect({ type: 'request.close', id: 'ask', status: 'granted', response: 'Unrelated appointment.' })), /not open/);
});

check('deadline creates a pending review, never automatic success', () => {
  const s = fresh();
  applyDomainOutcome(s, effect({ type: 'commitment.open', id: 'target', responsible: { office: 'min_works' }, object: 'bridge', text: 'Deliver the bridge.', afterMonths: 6, visibility: 'public' }));
  s.turn = 6; markCommitmentsDue(s);
  assert.equal(s.governance!.commitments.target.status, 'open');
  s.turn = 7; markCommitmentsDue(s);
  assert.equal(s.governance!.commitments.target.status, 'review-due');
});

check('successor preserves world dates, old people and outstanding commitments', () => {
  const s = fresh();
  s.turn = 43;
  applyDomainOutcome(s, effect({ type: 'commitment.open', id: 'target', responsible: { office: 'min_works' }, object: 'bridge', text: 'Deliver the bridge.', afterMonths: 10, visibility: 'public' }));
  const responsible = s.governance!.commitments.target.responsible;
  s.turn = 49; s.ending = 'defeated';
  const next = newGame({ ...setup, name: 'Successor' }, s);
  assert.equal(clockOf(next).worldMonth, 48);
  assert.equal(clockOf(next).presidencyMonth, 0);
  assert.equal(presidencyMonthToWorld(next, 4), 52);
  assert.equal(worldMonthToPresidency(next, 52), 4);
  assert.equal(worldMonthToPresidency(next, 40), -8);
  assert.equal(next.governance!.commitments.target.due, 52);
  assert.equal(next.governance!.commitments.target.responsible, responsible);
  assert.ok(next.governance!.persons[responsible]);
});

check('legacy saves migrate without claiming an exact clock; future schema fails', () => {
  const s = fresh(); delete s.governance; s.turn = 23;
  const old = migrate(structuredClone(s));
  assert.ok(old);
  assert.equal(clockOf(old).accuracy, 'estimated-legacy');
  assert.equal(clockOf(old).presidencyMonth, 22);
  const future = structuredClone(old); (future.governance as unknown as { schemaVersion: number }).schemaVersion = 99;
  assert.equal(migrate(future), null);
});

check('derived views cannot mutate the game and do not advance RNG', () => {
  const s = fresh(); const before = JSON.stringify(s);
  const view = getGovernanceView(s); view.persons[0].name = 'Changed';
  assert.equal(JSON.stringify(s), before);
});

check('typed effects execute through actual CHOOSE, without changing input state', () => {
  const s = fresh(); s.phase = 'desk';
  const file: GameEvent = {
    id: 'contracts.test', kind: 'standalone', slot: 'lead', category: 'politics', tone: 'dry', intensity: 1,
    office: 'President', title: 'Test', body: ['Test'],
    choices: [{ id: 'no', label: 'Refuse', outcomes: [{ result: 'Refused.', archive: 'Refused a contract.', domain: effect(
      { type: 'request.open', id: 'choose-ask', requester: { office: 'gov_nw' }, object: 'contract', text: 'Award it.' },
      { type: 'request.close', id: 'choose-ask', status: 'refused', response: 'Tender required.' },
    ) }] }],
  };
  EVENTS[file.id] = file;
  try {
    s.desk.lead = { eventId: file.id };
    const before = JSON.stringify(s);
    const next = applyAction(s, { type: 'CHOOSE', eventId: file.id, choiceId: 'no' });
    assert.equal(next.governance!.requests['choose-ask'].status, 'refused');
    assert.equal(next.governance!.requests['choose-ask'].origin.eventId, file.id);
    assert.equal(next.governance!.requests['choose-ask'].origin.choiceId, 'no');
    assert.equal(JSON.stringify(s), before);
  } finally { delete EVENTS[file.id]; }
});

check('scoped ids execute repeatedly through CHOOSE and survive succession', () => {
  const id = 'records.$ADMIN.$MONTH';
  const file: GameEvent = {
    id: 'contract.scoped', slot: 'lead', kind: 'recurring', category: 'politics', tone: 'dry',
    intensity: 1, office: 'President', title: 'Scoped records', body: ['Decide.'],
    choices: [{ id: 'record', label: 'Record', outcomes: [{
      result: 'Recorded.', archive: 'Recorded.',
      domain: effect(
        { type: 'episode.open', id, family: 'test', subject: 'road', stage: 'asked', classification: 'decision', note: 'Asked.' },
        { type: 'request.open', id, requester: { office: 'min_works' }, episodeId: id, object: 'road', text: 'Build it.' },
        { type: 'request.close', id, status: 'refused', response: 'No.' },
        { type: 'episode.resolve', id, note: 'Closed.' },
        { type: 'commitment.open', id, responsible: { office: 'adviser:fin' }, object: 'balance', text: 'Pay.', afterMonths: 3, visibility: 'public' },
      ),
    }] }],
  };
  const source = JSON.stringify(file);
  EVENTS[file.id] = file;
  const choose = (s: ReturnType<typeof fresh>) => {
    s.phase = 'desk';
    s.desk.lead = { eventId: file.id };
    const request = file.choices[0].outcomes[0].domain!.effects.find((e) => e.type === 'request.open')!;
    if (request.type !== 'request.open') throw Error('fixture');
    const original = request.object; request.object = 'road-invoice-' + clockOf(s).worldMonth;
    try { return applyAction(s, { type: 'CHOOSE', eventId: file.id, choiceId: 'record' }); } finally { request.object = original; }
  };
  try {
    let s = choose(fresh());
    const first = Object.keys(s.governance!.requests).find((id) => id.startsWith('records.'))!;
    assert.equal(first, 'records.administration:0.0');
    assert.equal(s.governance!.requests[first].episodeId, first);
    assert.equal(s.governance!.requests[first].status, 'refused');
    s.turn++;
    s = choose(s);
    assert.equal(Object.keys(s.governance!.requests).filter((id) => id.startsWith('records.')).length, 2);
    // Duplicate same-month execution remains invalid; scoping is not an overwrite.
    s.desk.lead = { eventId: file.id };
    assert.throws(() => choose(s));
    s.turn = 49; s.ending = 'defeated';
    const successor = choose(newGame({ ...setup, name: 'Successor' }, s));
    assert.equal(Object.keys(successor.governance!.requests).filter((id) => id.startsWith('records.')).length, 3);
    assert.ok(successor.governance!.requests['records.administration:1.48']);
    assert.equal(successor.governance!.commitments[first].due, 3);
    assert.equal(JSON.stringify(file), source);
  } finally { delete EVENTS[file.id]; }
});

check('record scoping handles cast, private ignored outcomes and episode bindings without mutating views', () => {
  const s = fresh();
  const file: GameEvent = {
    id: 'contract.materialise', slot: 'minor', kind: 'recurring', category: 'politics', tone: 'dry',
    cast: { WHO: 'failingMinister' }, intensity: 1, office: 'President', title: 'Test', body: ['$ADMIN is literal prose.'],
    episode: { family: 'test', subject: 'road', episodeId: 'episode.$ADMIN.$MONTH', classification: 'decision' },
    ignored: { result: 'Leave it.', archive: 'Left.', domain: effect({ type: 'episode.resolve', id: 'episode.$ADMIN.$MONTH', note: 'Closed.' }) },
    choices: [{ id: 'yes', label: 'Yes', outcomes: [{ result: 'Yes.', archive: 'Yes.',
      domain: effect({ type: 'commitment.open', id: 'promise.$WHO.$ADMIN', responsible: { office: '$WHO' }, object: 'road', text: '$MONTH remains literal prose.', afterMonths: 2, visibility: 'private' }),
    }] }],
  };
  const before = JSON.stringify(s), source = JSON.stringify(file);
  const rendered = materialise(s, file, { WHO: 'min_works' });
  assert.equal(rendered.episode!.episodeId, 'episode.administration:0.0');
  assert.equal(rendered.ignored!.domain!.effects[0].id, rendered.episode!.episodeId);
  const promise = rendered.choices[0].outcomes[0].domain!.effects[0];
  assert.equal(promise.id, 'promise.min_works.administration:0');
  assert.ok(promise.type === 'commitment.open');
  assert.deepEqual(promise.responsible, { office: 'min_works' });
  assert.equal(promise.text, '$MONTH remains literal prose.');
  assert.equal(rendered.body[0], '$ADMIN is literal prose.');
  assert.equal(JSON.stringify(s), before);
  assert.equal(JSON.stringify(file), source);
});

check('shock lifecycle reads active, expired and legacy saved records without mutation', () => {
  const s = fresh();
  assert.equal(getVar(s, 'shock.blackout'), 0);
  s.shocks.active.push({ id: 'blackout', since: s.turn, until: s.turn + 2 });
  s.shocks.seen.push('blackout');
  assert.equal(getVar(s, 'shock.blackout'), 1);
  s.turn += 2;
  assert.equal(getVar(s, 'shock.blackout'), 1);
  s.turn++;
  const before = JSON.stringify(s);
  assert.equal(getVar(s, 'shock.blackout'), 2);
  assert.equal(getVar(s, 'shock.unknown'), 0);
  assert.equal(JSON.stringify(s), before);
  s.shocks.active = [];
  assert.equal(getVar(s, 'shock.blackout'), 2);
});

check('follow-up binds its selected person through CHOOSE and desk selection', () => {
  const target: GameEvent = {
    id: 'contracts.follow', kind: 'chain', slot: 'minor', category: 'politics', tone: 'dry', intensity: 1,
    office: 'President', title: 'Review {WHO}', body: ['Review.'], cast: { WHO: 'weakMinister' },
    ignored: { result: 'Left.', archive: 'Left.' },
    choices: [{ id: 'yes', label: 'Yes', outcomes: [{ result: 'Done.', archive: 'Done.', fx: [['person.$WHO', 1]] }] }],
  };
  const source: GameEvent = {
    ...target, id: 'contracts.source', kind: 'standalone',
    choices: [{ id: 'yes', label: 'Yes', outcomes: [{ result: 'Wait.', archive: 'Wait.',
      follow: [{ event: target.id, after: 1, cast: { WHO: '$WHO' } }] }] }],
  };
  EVENTS[source.id] = source; EVENTS[target.id] = target;
  try {
    const s = fresh(); s.phase = 'desk';
    s.desk.minors = [{ eventId: source.id, cast: { WHO: 'min_works' } }];
    const next = applyAction(s, { type: 'CHOOSE', eventId: source.id, choiceId: 'yes' });
    const q = next.queue.find((q) => q.event === target.id)!;
    assert.equal(q.cast!.WHO, 'min_works');
    assert.equal(q.castPersons!.WHO, next.governance!.offices.min_works);
    next.turn++;
    buildDesk(next);
    const item = next.desk.minors.find((m) => m.eventId === target.id)!;
    assert.equal(item.cast!.WHO, 'min_works');
    assert.equal(eventOf(next, item)!.choices[0].outcomes[0].fx![0][0], 'person.min_works');
    // Replacing this officeholder while the file is on the desk must withdraw it.
    next.people.min_works.name = 'Replacement';
    const after = applyAction(next, { type: 'CHOOSE', eventId: target.id, choiceId: 'yes' });
    assert.equal(after.desk.minors.find((m) => m.eventId === target.id)!.resolved!.choiceId, 'withdrawn');
    assert.equal(after.choices[target.id], undefined);
    assert.ok(after.report.some((r) => r.title === 'Follow-up withdrawn'));
    // Matching keys inherit automatically, and bind before a sack in the same outcome.
    delete source.choices[0].outcomes[0].follow![0].cast;
    source.choices[0].outcomes[0].ops = [['sack', '$WHO', 'technocrat']];
    const second = fresh(); second.phase = 'desk';
    const originalPerson = second.governance!.offices.min_works;
    second.desk.minors = [{ eventId: source.id, cast: { WHO: 'min_works' } }];
    const sacked = applyAction(second, { type: 'CHOOSE', eventId: source.id, choiceId: 'yes' });
    const queued = sacked.queue.find((q) => q.event === target.id)!;
    assert.equal(queued.castPersons!.WHO, originalPerson);
    assert.notEqual(sacked.governance!.offices.min_works, originalPerson);
    sacked.turn++; buildDesk(sacked);
    assert.ok(!sacked.desk.minors.some((m) => m.eventId === target.id));
  } finally { delete EVENTS[source.id]; delete EVENTS[target.id]; }
});

check('queued follow-up cancels on replacement without selecting another person', () => {
  const file: GameEvent = {
    id: 'contracts.bound', kind: 'chain', slot: 'minor', category: 'politics', tone: 'dry', intensity: 1,
    office: 'President', title: 'Review', body: ['Review.'], cast: { WHO: 'weakMinister' },
    ignored: { result: 'Left.', archive: 'Left.' }, choices: [],
  };
  EVENTS[file.id] = file;
  try {
    const s = fresh();
    s.queue = [{ event: file.id, due: s.turn, ...bindCast(s, { WHO: 'min_works' }) }];
    s.people.min_works.name = 'Another holder';
    buildDesk(s);
    assert.ok(!s.desk.minors.some((m) => m.eventId === file.id));
    assert.equal(s.queue.length, 0);
    assert.ok(s.report.some((r) => r.title === 'Follow-up withdrawn'));
  } finally { delete EVENTS[file.id]; }
});

check('scenario assets are validated, productive and inherited without false achievements', () => {
  const scenario = SCENARIO_BY_ID.standard as typeof SCENARIO_BY_ID.standard & ScenarioAssets;
  const original = scenario.assets;
  try {
    scenario.assets = [{ asset: 'wheat', site: 'KN', condition: 0.6 }];
    const s = fresh();
    assert.equal(s.assets![0].state, 'KN');
    assert.equal(s.assets![0].condition, 0.6);
    assert.ok(!s.ventures.won.includes('wheat'));
    assert.equal(canVenture(s, VENTURE_BY_ID.wheat).ok, false);
    const k = assetPerformance(s, 'wheat').k;
    s.assets![0].condition = 1;
    assert.ok(Math.abs(k / assetPerformance(s, 'wheat').k - 0.6) < 0.000001);
    s.assets![0].condition = 0.6;
    assetTick(s);
    assert.ok(Object.values(s.assets![0].record!).some((v) => v > 0));
    s.turn = 49; s.ending = 'defeated';
    // An inherited world wins over a scenario template, even an invalid template.
    scenario.assets = [{ asset: 'invalid', site: 'invalid' }];
    const successor = newGame({ ...setup, name: 'Successor' }, s);
    assert.equal(successor.assets![0].condition, 0.6);
    assert.equal(successor.assets![0].state, 'KN');
    const record = JSON.stringify(s.assets![0].record);
    assetTick(successor);
    assert.equal(JSON.stringify(s.assets![0].record), record);
  } finally {
    if (original === undefined) delete scenario.assets; else scenario.assets = original;
  }
});

check('starting asset batch validates before modifying any state', () => {
  const s = fresh(), before = JSON.stringify(s);
  for (const specs of [
    [{ asset: 'wheat', site: 'KN' }, { asset: 'unknown', site: 'KN' }],
    [{ asset: 'wheat', site: 'KN' }, { asset: 'wheat', site: 'KN' }],
    [{ asset: 'wheat', site: 'XX' }],
    [{ asset: 'wheat', site: 'KN', condition: 1.1 }],
    [{ asset: 'wheat', site: 'KN', condition: NaN }],
  ]) {
    assert.throws(() => initialiseScenarioAssets(s, { assets: specs }));
    assert.equal(JSON.stringify(s), before);
  }
});


check('named pool upgrades old saves once without altering generated files or RNG', () => {
  const s = fresh(), t = talent(s);
  t.pool = t.pool.filter((c) => !c.named); delete t.namedVersion;
  const old = JSON.stringify(t.pool), rng = s.rng, seq = t.seq;
  talent(s); talent(s);
  assert.equal(t.pool.filter((c) => c.named).length, 20);
  assert.equal(JSON.stringify(t.pool.filter((c) => !c.named)), old);
  assert.equal(t.seq, seq); assert.equal(s.rng, rng);
  const snapshot = JSON.stringify(s);
  const view = getCandidateView(s); assert.equal(JSON.stringify(s), snapshot); view[0].career![0].post = 'Edited view';
  assert.notEqual(candidate(s, view[0].id)!.career![0].post, 'Edited view');
});

check('named careers persist, appointed generated identities do not expire, and release restores availability', () => {
  const s = fresh(); const t = talent(s); const generated = t.pool.find((c) => !c.named && c.id.startsWith('c'))!;
  take(s, generated.id); generated.until = 1;
  take(s, 'cand.tamuno');
  s.turn = 100; talentTick(s);
  assert.ok(candidate(s, generated.id));
  assert.equal(t.pool.filter((c) => c.named).length, 20);
  assert.ok(!candidatesFor(s, 'min_works', 99).some((o) => o.c.id === 'cand.tamuno'));
  release(s, candidate(s, 'cand.tamuno')!.name);
  assert.ok(candidate(s, 'cand.tamuno')!.until > s.turn);
});

check('real minister appointment consumes named candidate and binds canonical identity', () => {
  const s = fresh(); s.phase = 'desk'; s.pc = 100;
  const o = candidatesFor(s, 'min_works', 99).find((o) => o.c.id === 'cand.tamuno')!;
  assert.equal(o.refuses, null); assert.equal(o.effective, 5);
  const out = applyAction(s, { type: 'REPLACE_MINISTER', id: 'min_works', kind: 'technocrat', name: o.c.name });
  assert.equal(out.people.min_works.name, o.c.name);
  assert.equal(resolveActor(out, { office: 'min_works' }), o.c.id);
  assert.ok(talent(out).taken.includes(o.c.id));
  assert.ok(!candidatesFor(out, 'asset', 99).some((offer) => offer.c.id === o.c.id));
  assert.notEqual(s.people.min_works.name, o.c.name);
});

check('legacy appointment buttons cannot silently accept exceptional terms', () => {
  const s = fresh(); s.phase = 'desk'; s.pc = 100;
  const name = candidate(s, 'cand.nwachukwu')!.name;
  const out = applyAction(s, { type: 'REPLACE_FIN', name });
  assert.equal(out.chars.fin.name, s.chars.fin.name);
  assert.equal(out.pc, s.pc);
  assert.ok(getCandidateView(out).find((c) => c.id === 'cand.nwachukwu')!.reason?.includes('terms'));
});

check('state grants conserve fund movements and remain attributed after succession', () => {
  const s = fresh(); s.funds.buffer = 2;
  const cash = s.nation.fiscalSpace;
  const transfer = transferSavedFund(s, 'buffer', 'states', 0.25);
  assert.equal(s.funds.buffer, 1.5); assert.equal(transfer.naira, 0.5);
  assert.equal(s.nation.fiscalSpace, cash);
  const next = newGame({ ...setup, name: 'Next' }, s);
  assert.deepEqual(next.fundTransfers, s.fundTransfers);
  next.fundTransfers![0].naira = 99;
  assert.equal(s.fundTransfers![0].naira, 0.5);
});

check('FX auction converts units once and does not create treasury cash or double-count reserves', () => {
  const s = fresh(); s.funds.abroad = 3; s.fx!.rate = 1500;
  s.fx!.stance = 'float'; s.flags['fx.stance'] = 'float';
  const cash = s.nation.fiscalSpace, reserves = s.fx!.reserves;
  const baselineFlow = fxFlow(s).total;
  const text = runOp(s, ['fundmove', 'abroad', 'currency', 0.5]);
  assert.equal(s.funds.abroad, 1.5); assert.equal(s.fx!.interventionDollars, 1);
  assert.equal(s.fx!.reserves, reserves); assert.equal(s.nation.fiscalSpace, cash);
  assert.ok(text.includes('$1.000bn'));
  assert.ok(Math.abs(fxFlow(s).total - baselineFlow - 1) < 1e-9);
  currencyTick(s); assert.equal(s.fx!.interventionDollars, 0);
  assert.ok(Math.abs(s.fx!.reserves - reserves - Math.max(0, baselineFlow) * 0.5) < 1e-9);
  assert.equal(s.fundTransfers![0].dollars, 1);
  const outcome = EVENTS['shock.flight'].choices.find((c) => c.id === 'defend')!.outcomes[0];
  assert.deepEqual(outcome.ops![0], ['fundmove', 'abroad', 'currency', 0.5]);
});

check('actual currency defence CHOOSE records the auction and preserves its input', () => {
  const s = fresh(); s.phase = 'desk'; s.funds.abroad = 3;
  s.desk.lead = { eventId: 'shock.flight' };
  const before = JSON.stringify(s);
  const out = applyAction(s, { type: 'CHOOSE', eventId: 'shock.flight', choiceId: 'defend' });
  assert.equal(out.funds.abroad, 1.5);
  assert.equal(out.fundTransfers![0].to, 'currency');
  assert.equal(out.fundTransfers![0].dollars, 1);
  assert.equal(JSON.stringify(s), before);
});

check('malformed fund transfers fail before mutation', () => {
  const s = fresh(), before = JSON.stringify(s);
  for (const op of [['abroad', 'states', -1], ['abroad', 'states', 2], ['abroad', 'unknown', 0.5], ['abroad', 'abroad', 0.5], ['unknown', 'states', 1]] as const) {
    assert.throws(() => runOp(s, ['fundmove', ...op]));
    assert.equal(JSON.stringify(s), before);
  }
});

// Static authoring contract must reject arbitrary effect strings.
// @ts-expect-error unsupported effects cannot be authored in the v1 DSL
const unsupported: DomainEffect = { type: 'cash.magic' };
void unsupported;
passed += runSocialChecks();
process.stdout.write(`${passed} contract checks passed.\n`);
