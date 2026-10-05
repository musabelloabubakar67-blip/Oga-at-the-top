import assert from 'node:assert/strict';
import { getVar } from '../engine/vars';
import { materialise } from '../engine/cast';
import { EVENTS } from '../content';
import { FINANCE_CANDIDATES } from '../content/names';
import { migrate } from '../engine/migrate';
import { applyAction, newGame } from '../engine/reduce';
import { ensureGovernance, markCommitmentsDue } from '../engine/governance';
import { CONTRACT_VERSION, applyDomainOutcome, clockOf, getGovernanceView, resolveActor, presidencyMonthToWorld, worldMonthToPresidency } from '../engine/public';
import type { DomainEffect, DomainOutcome } from '../engine/public';
import type { GameEvent } from '../engine/types';

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
    return applyAction(s, { type: 'CHOOSE', eventId: file.id, choiceId: 'record' });
  };
  try {
    let s = choose(fresh());
    const first = Object.keys(s.governance!.requests)[0];
    assert.equal(first, 'records.administration:0.0');
    assert.equal(s.governance!.requests[first].episodeId, first);
    assert.equal(s.governance!.requests[first].status, 'refused');
    s.turn++;
    s = choose(s);
    assert.equal(Object.keys(s.governance!.requests).length, 2);
    // Duplicate same-month execution remains invalid; scoping is not an overwrite.
    s.desk.lead = { eventId: file.id };
    assert.throws(() => choose(s));
    s.turn = 49; s.ending = 'defeated';
    const successor = choose(newGame({ ...setup, name: 'Successor' }, s));
    assert.equal(Object.keys(successor.governance!.requests).length, 3);
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

// Static authoring contract must reject arbitrary effect strings.
// @ts-expect-error unsupported effects cannot be authored in the v1 DSL
const unsupported: DomainEffect = { type: 'cash.magic' };
void unsupported;
process.stdout.write(`${passed} contract checks passed.\n`);
