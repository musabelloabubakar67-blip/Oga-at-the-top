// Experience check: requests, refusal, precise promises and favours (plan 05).
// Run: npx tsx tests/experience/requests.check.ts
//
// - a refused request never returns unchanged, and the next ask follows the last answer;
// - refusals are taken differently by motive and explanation; a grudge needs two refusals
//   of the same kind, and only a grant of that kind settles it;
// - a grant to someone the President owes settles the debt first, leaving a traceable residual;
// - favour services name a target and change it: brokering, testimony, project support, release;
// - a promise stays precise: a substitute needs the recipient's agreement.

import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../../content/names';
import { callFavour, canUseFavour, usesFor } from '../../engine/favours';
import { closeRequest, openRequest } from '../../engine/requests';
import { ventureOdds } from '../../engine/bets';
import { VENTURE_BY_ID } from '../../content/ventures';
import { pledge, substitute, substitutes, pledgeTick } from '../../engine/promises';
import { applyAction, newGame } from '../../engine/reduce';
import type { GameState } from '../../engine/types';
import { addFavour, favoursOwing } from '../../engine/vars';
import { NEXT_ASK, currentWant, refreshRequests, refusalCost, refuse } from '../../engine/wants';

const setup = { seed: 51, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 90; s.nation.fiscalSpace = 5; return s; };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

/** Clears whatever this person has open, then puts a specific ask in front of the President. */
function ask(s: GameState, office: string, object: string, text = `Request: ${object}.`): string {
  refreshRequests(s);
  const g = s.governance!, me = g.offices[office];
  for (const r of Object.values(g.requests)) if (r.status === 'open' && r.requester === me) closeRequest(s, r.id, 'withdrawn', 'Cleared for the check.');
  const prev = Object.values(g.requests).filter((r) => r.requester === me && r.object === object).at(-1);
  const id = `check.${office}.${object}.${s.turn}.${Object.keys(g.requests).length}`;
  const r = openRequest(s, { id, requester: { office }, object, text: prev ? `${text} (again, on new terms)` : text, terms: { description: text, politicalCapital: 2 }, previous: prev?.id, changedBy: prev ? 'offer' : undefined });
  r.legacyWant = { kind: object, office, done: 'It is done.', fx: [] };
  return id;
}

check('a refused request never returns unchanged; the next ask follows the last answer', () => {
  const s = fresh(), id = 'gov_nw';
  refreshRequests(s, id);
  const first = currentWant(s, id)!;
  refuse(s, id);
  const refused = Object.values(s.governance!.requests).filter((r) => r.status === 'refused');
  for (let m = 1; m <= 30; m++) {
    s.turn += 1;
    refreshRequests(s, id);
    const w = currentWant(s, id);
    if (m < NEXT_ASK) assert.equal(w, null, 'nothing new until the interval after the answer');
    if (w) assert.ok(!refused.some((r) => r.object === w.id && r.text === w.text), 'not the refused ask again');
    if (w && m >= NEXT_ASK) { refuse(s, id); refused.push(...Object.values(s.governance!.requests).filter((r) => r.status === 'refused')); }
  }
  assert.ok(first);
});

check('refusals land by motive and explanation; grudges need two of the same kind', () => {
  const s = fresh(), id = 'gov_ne';
  assert.ok(refusalCost(s, id, 'need', false) > refusalCost(s, id, 'need', true), 'an explanation softens it');
  assert.ok(refusalCost(s, id, 'need', false) > refusalCost(s, id, 'improper', false), 'an improper ask refused costs little');
  ask(s, id, 'ally'); refuse(s, id);
  s.turn += 1; ask(s, id, 'projects'); refuse(s, id);
  assert.ok(!s.people[id].grudge, 'two unrelated refusals make no grudge');
  s.turn += 1; ask(s, id, 'troops'); refuse(s, id, true);
  assert.ok(!s.people[id].grudge, 'an explained refusal does not count towards one');
  s.turn += 1; ask(s, id, 'troops', 'Troops again.'); refuse(s, id);
  assert.ok(s.people[id].grudge && s.people[id].grudgeMotive === 'need', 'two unexplained refusals of a need do');
  // Patronage given does not settle a need refused; a need met does.
  s.turn += 1; ask(s, id, 'ticket');
  let next = applyAction(s, { type: 'PERSON', id, op: 'grant' });
  assert.ok(next.people[id].grudge, 'a different kind of grant leaves the grievance');
  next.turn += 1; next.desk.actionsUsed = 0; ask(next, id, 'projects', 'Projects, on new terms.');
  next = applyAction(next, { type: 'PERSON', id, op: 'grant' });
  assert.ok(!next.people[id].grudge, 'the same kind of grant settles it');
});

check('a grant to someone the President owes settles the debt first, with a traceable residual', () => {
  const s = fresh(), id = 'sen_approp';
  s.favours = s.favours.filter((f) => f.who !== id);
  addFavour(s, id, 'owing', 3, 'Carried the budget through committee.');
  ask(s, id, 'chair');
  const next = applyAction(s, { type: 'PERSON', id, op: 'grant' });
  const left = favoursOwing(next, id);
  assert.equal(left.length, 1); assert.equal(left[0].size, 1, 'two of three settled; one still owed');
  const log = next.favourSettlements!.filter((x) => x.favour.who === id && x.mode === 'settled');
  assert.equal(log.length, 1); assert.equal(log[0].remaining, left[0].size);
});

check('favour services name a target and change it', () => {
  const s = fresh();
  // Brokering: a governor brings a cool colleague to the table.
  s.people.gov_sw.rel = 80; s.people.gov_se.rel = 30;
  addFavour(s, 'gov_sw', 'owed', 2, 'Delivered the zone.'); const f = s.favours.at(-1)!;
  const broker = usesFor(s, f, 1).find((u) => u.id === 'broker')!;
  assert.ok(broker.targets!.some((t) => t.id === 'gov_se'));
  const before = s.people.gov_se.rel;
  callFavour(s, f, 'broker', 1, 'gov_se');
  assert.equal(s.people.gov_se.rel, before + 5);
  // Project support raises the odds of a named bet under way.
  const v = Object.keys(VENTURE_BY_ID)[0];
  s.ventures.active.push({ id: v, progress: 10 });
  const odds = ventureOdds(s, VENTURE_BY_ID[v]);
  const g = s.favours.find((x) => x.who === 'gov_sw' && x.dir === 'owed')!;
  assert.ok(canUseFavour(s, g.id, 'project', 1, 1, v).ok);
  callFavour(s, g, 'project', 1, v);
  assert.ok(ventureOdds(s, VENTURE_BY_ID[v]) > odds);
  // Assistance with nothing to act on is refused with a reason.
  addFavour(s, 'min_works', 'owed', 1, 'Owes the appointment.'); const t = s.favours.at(-1)!;
  s.people.min_works.rel = 80;
  assert.match(usesFor(s, t, 1).find((u) => u.id === 'evidence')!.reason ?? '', /No open inquiry/);
});

check('a promise stays precise: a substitute needs the recipient to agree, or it stands', () => {
  const s = fresh(), id = 'gov_nc';
  s.people[id].rel = 70;
  ask(s, id, 'projects');
  pledge(s, id, 'want', undefined, 'Federal projects, within nine months', 9);
  const p = s.pledges!.at(-1)!;
  const options = substitutes(s, p.id);
  assert.ok(options.length > 0);
  const no = options.find((o) => !o.accepts), yes = options.find((o) => o.accepts);
  if (no) {
    substitute(s, p.id, no.want.id);
    assert.equal(p.status, 'open', 'a refused substitute leaves the promise as it was');
    assert.equal(s.governance!.requests[p.requestId!].status, 'open');
  }
  assert.ok(yes, 'something worth as much can be offered');
  substitute(s, p.id, yes!.want.id);
  assert.equal(p.status, 'kept');
  assert.equal(s.governance!.requests[p.requestId!].status, 'substituted');
  // A favour can release the President from a promise without it being broken.
  ask(s, 'gov_nw', 'ally');
  s.people.gov_nw.rel = 80;
  pledge(s, 'gov_nw', 'want', undefined, 'A seat for an ally, within nine months', 9);
  const q = s.pledges!.at(-1)!;
  addFavour(s, 'gov_nw', 'owed', 1, 'Owes the convention.'); const f = s.favours.at(-1)!;
  callFavour(s, f, 'release', 1, String(q.id));
  assert.equal(q.status, 'released');
  s.turn = q.due + 1; pledgeTick(s);
  assert.equal(q.status, 'released', 'and is not broken later');
});

console.log(`${passed} request and favour checks passed.`);
