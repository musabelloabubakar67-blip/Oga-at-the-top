// Focused regression checks; no browser playtest. Run: npx tsx tools/check-reforms.ts
import assert from 'node:assert/strict';
import { MILESTONE_BY_ID, TRACKS } from '../content/agenda';
import { FINANCE_CANDIDATES } from '../content/names';
import { applyAction, canLaunch, canReverse, milestoneStatus, movesLeft, newGame, reformName } from '../engine/reduce';
import { applyFx } from '../engine/vars';
import { eraShifts } from '../engine/era';
import { pledgeOptions } from '../engine/promises';
import { upcoming } from '../engine/upcoming';
import { movesTotal } from '../engine/capital';

const setup = {
  seed: 42, name: 'Tester', party: 'Progressive Stakeholders Congress', partyShort: 'PSC',
  home: 'KN', background: 'governor' as const, address: 'sir' as const,
  finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'],
};
const fresh = () => {
  const s = newGame(setup);
  s.phase = 'desk';
  s.pc = 100;
  s.nation.fiscalSpace = 100;
  return s;
};

const ids = TRACKS.flatMap((t) => t.milestones.map((m) => m.id));
assert.equal(TRACKS.length, 18);
assert.equal(ids.length, 220);
assert.equal(new Set(ids).size, ids.length);
for (const id of ['r2', 'r5', 'h2', 'h4', 'o2', 'o4', 'o5', 'g3', 'g5']) assert.ok(!ids.includes(id));

// Sequential foundations gate deepening; every deepening reform opens together.
for (const track of TRACKS) {
  const s = fresh();
  const foundations = track.milestones.filter((m) => (m.gen ?? 1) === 1);
  for (const m of track.milestones.filter((m) => m.gen === 2)) assert.equal(milestoneStatus(s, m.id), 'later');
  s.agenda.done = foundations.map((m) => m.id);
  for (const m of track.milestones.filter((m) => m.gen === 2)) {
    assert.equal(milestoneStatus(s, m.id), (m.excludes ?? []).some((id) => s.agenda.done.includes(id)) ? 'closed' : 'next');
  }
}

// Each rival closes its alternative while active and delivered. The bots skip it.
for (const [chosen, closed] of [['p14', 'p15'], ['m11', 'm12'], ['k11', 'k12'], ['g4', 'g13']]) {
  const s = fresh();
  const track = MILESTONE_BY_ID[chosen].track;
  s.agenda.done = track.milestones.filter((m) => (m.gen ?? 1) === 1 && m.id !== chosen && m.id !== closed).map((m) => m.id);
  s.agenda.active = [{ id: chosen, progress: 5 }];
  assert.equal(milestoneStatus(s, closed), 'closed');
  assert.equal(canLaunch(s, closed).ok, false);
  const next = track.milestones.find((m) => milestoneStatus(s, m.id) === 'next');
  assert.notEqual(next?.id, chosen);
  assert.notEqual(next?.id, closed);
  s.agenda.active = [];
  s.agenda.done.push(chosen);
  assert.equal(milestoneStatus(s, closed), 'closed');
}
const repair = fresh();
assert.equal(milestoneStatus(repair, 'p11'), 'hidden');
repair.agenda.done.push('p3');
repair.nation.inflation = 24;
assert.equal(milestoneStatus(repair, 'p11'), 'next');
repair.nation.inflation = 15;
assert.equal(milestoneStatus(repair, 'p11'), 'hidden');

// Every supported reversal costs exactly one move, removes its record and flags,
// stays deterministic and leaves the predecessor state untouched.
let reversals = 0;
for (const m of TRACKS.flatMap((t) => t.milestones).filter((m) => m.reversal)) {
  const s = fresh();
  s.agenda.done.push(m.id);
  for (const fx of m.done) applyFx(s, fx);
  Object.assign(s.flags, m.flags);
  const before = structuredClone(s);
  const left = movesLeft(s);
  assert.ok(canReverse(s, m.id).ok);
  const a = { type: 'REVERSE' as const, id: m.id };
  const reversed = applyAction(s, a);
  assert.deepEqual(s, before);
  assert.deepEqual(reversed, applyAction(s, a));
  assert.equal(reversed.rng, s.rng);
  assert.equal(movesLeft(reversed), left - 1);
  assert.ok(!reversed.agenda.done.includes(m.id));
  assert.equal(reversed.flags[`reversed.${m.id}`], 1);
  assert.equal(reversed.counters[`reversedAt.${m.id}`], s.turn);
  for (const k of Object.keys(m.flags ?? {})) assert.equal(reversed.flags[k], undefined);
  assert.ok(reformName(reversed, m.id).startsWith('Restore: '));
  assert.equal(canReverse(reversed, m.id).ok, false);
  s.desk.actionsUsed = movesTotal(s);
  assert.equal(canReverse(s, m.id).ok, false);
  assert.deepEqual(applyAction(s, a), s);
  // A later presidency sees the restoration and the era note, with no bonus restored for free.
  const heir = newGame({ ...setup, seed: 43 }, reversed);
  assert.equal(heir.flags[`reversed.${m.id}`], 1);
  assert.ok(!heir.agenda.done.includes(m.id));
  assert.ok(reformName(heir, m.id).startsWith('Restore: '));
  assert.ok(eraShifts(reversed, { sameParty: true, party: setup.party, partyShort: setup.partyShort, how: '' }).some((x) => x.title === 'A reform was undone'));
  reversals++;
}
assert.equal(reversals, 11);

// Restoration names reach both public promises and the coming-up strip.
const restoring = fresh();
restoring.agenda.done = ['p1', 'p2'];
restoring.flags['reversed.p3'] = 1;
assert.ok(canLaunch(restoring, 'p3').ok);
const launched = applyAction(restoring, { type: 'LAUNCH', id: 'p3' });
assert.match(launched.lastAction!.text, /Restore:/);
assert.ok(pledgeOptions(launched, 'public', 4).some((p) => p.text.startsWith('Restore:')));
launched.agenda.active.find((a) => a.id === 'p3')!.progress = 99;
assert.ok(upcoming(launched).some((x) => x.text.startsWith('Restore:')));
console.log('Reform checks passed: 18 tracks, 220 unique ids, 11 rival pairs, emergence, 11 reversals and inherited restorations.');
