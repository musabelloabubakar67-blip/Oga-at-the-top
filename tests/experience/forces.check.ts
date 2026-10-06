// Experience check: the armed forces as an institution under civilian control (plan 13).
// Run: npx tsx tests/experience/forces.check.ts
//
// - readiness is separate from security and has readable causes: pay, dollars, backlog, command;
// - a corridor campaign gives a year of causally connected funding, operational, civilian and political developments;
// - every theatre has a mission; tactical gains fade without local cooperation and hold with it;
// - harm to civilians goes on the record and is carried to the next government;
// - professionalisation reduces routine reports and makes unlawful orders refused;
// - a coup needs several real grievances at once.

import assert from 'node:assert/strict';
import { EVENTS } from '../../content';
import { MISSIONS } from '../../content/military';
import { FINANCE_CANDIDATES } from '../../content/names';
import { coupRisk, dollarShortage, ensureMilitary, militaryTick, readinessTarget, startMission, wouldRefuse } from '../../engine/military';
import { newGame } from '../../engine/reduce';
import { fiscalFlow } from '../../engine/treasury';
import type { GameState } from '../../engine/types';
import { ZONES, test } from '../../engine/vars';

const setup = { seed: 47, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 80; s.nation.fiscalSpace = 3; return s; };
const month = (s: GameState) => { s.turn += 1; militaryTick(s); };

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('readiness is its own measure, with every cause readable', () => {
  const s = fresh();
  const base = readinessTarget(s).v;
  ensureMilitary(s).arrears = 3;
  assert.ok(readinessTarget(s).v < base, 'late pay lowers readiness');
  assert.ok(readinessTarget(s).lines.some((l) => /late/.test(l.label)));
  const t = fresh();
  t.fx!.parallel = t.fx!.rate * 1.6; t.fx!.reserves = 6;
  assert.ok(dollarShortage(t) > 0.3 && readinessTarget(t).v < readinessTarget(fresh()).v, 'a dollar shortage grounds what must be bought abroad');
  assert.equal(t.nation.security, fresh().nation.security, 'capability is not the security outcome');
});

check('a corridor campaign produces a year of connected developments', () => {
  const s = fresh();
  startMission(s, 'msn.sw.corridor', 'standard', [true, true]);
  const cost = fiscalFlow(s).lines.find((l) => l.label === 'Military operations');
  assert.ok(cost && cost.value < 0, 'the campaign is paid for from the treasury');
  const threat = s.theatres.SW;
  for (let i = 0; i < 12; i++) month(s);
  const x = ensureMilitary(s).missions[0];
  assert.ok(x.ended, 'it ends after a year');
  assert.ok(s.theatres.SW < threat, 'the threat fell');
  const texts = x.log.map((l) => l.text).join(' ');
  assert.ok(/deploy|grounded/i.test(texts), 'funding and deployment in the first month');
  assert.ok(/three months/i.test(texts) && /Six months/i.test(texts) && /After a year/i.test(texts), 'quarterly evidence, a political turn at six months, a verdict at twelve');
  assert.ok(x.log.length >= 5);
});

check('every theatre has a mission; gains fade without cooperation and hold with it', () => {
  for (const z of ZONES) assert.ok(MISSIONS.some((d) => d.theatre === z), `${z} has a mission`);
  const run = (coop: number) => {
    const s = fresh();
    startMission(s, 'msn.nw.forest', 'surge', [false, false]);
    for (let i = 0; i < 6; i++) month(s);
    ensureMilitary(s).missions[0].ended = s.turn;
    ensureMilitary(s).local.NW.cooperation = coop;
    const after = s.theatres.NW;
    for (let i = 0; i < 12; i++) month(s);
    return s.theatres.NW - after;
  };
  assert.ok(run(30) > run(70) + 0.5, 'the fighters return where people do not cooperate');
});

check('harm to civilians is recorded and carried to the next government', () => {
  const s = fresh();
  startMission(s, 'msn.nw.forest', 'surge', [false, false]);
  for (let i = 0; i < 12; i++) month(s);
  const m = ensureMilitary(s);
  assert.ok(m.missions[0].harm > 3, 'dropped limits and a surge harm civilians');
  assert.ok(m.local.NW.displaced > 0);
  const abuses = m.abuses.filter((a) => !a.resolved).length;
  s.turn = 49; s.ending = 'defeated';
  const next = newGame({ ...setup, name: 'Successor' }, s);
  assert.equal(next.military!.abuses.filter((a) => !a.resolved).length, abuses);
  assert.deepEqual(next.military!.posts, m.posts);
});

check('professional forces report less and refuse unlawful orders', () => {
  const s = fresh();
  s.agenda.done.push('s3', 's7', 's9');
  assert.ok(wouldRefuse(s), 'a professional command refuses');
  const reports = (prof: boolean) => {
    const t = fresh();
    if (prof) t.agenda.done.push('s3', 's7', 's9');
    startMission(t, 'msn.sw.corridor', 'standard', [true, true]);
    t.report = [];
    month(t);
    return t.report.filter((r) => /operation/.test(r.title)).length;
  };
  assert.ok(reports(true) < reports(false), 'routine reports are handled by the command');
  // The misuse file obeys the command's answer.
  const e = EVENTS['mil.misuse'];
  const troops = e.choices.find((c) => c.id === 'troops')!;
  assert.ok(test(s, troops.outcomes[0].when!), 'the refusal outcome applies');
});

check('a coup needs several real grievances at once', () => {
  const s = fresh();
  assert.equal(coupRisk(s).risk, 0);
  const m = ensureMilitary(s);
  m.arrears = 5; m.misused = 2;
  assert.ok(coupRisk(s).causes.length >= 3 && coupRisk(s).risk > 0, 'late pay, misuse and an ambitious commander');
  s.agenda.done.push('s3', 's7', 's9');
  assert.ok(coupRisk(s).causes.length < 3, 'a professional force settles grievances by rule');
});

console.log(`${passed} armed forces checks passed.`);
