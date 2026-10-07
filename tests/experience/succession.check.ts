// Experience check: succession, the settlement, the year after and handing a country on (plan 16).
// Run: npx tsx tests/experience/succession.check.ts
//
// - preparation in office changes nomination support and the forecast survival of the programme;
// - a competent independent successor can be a successful legacy; a protected predecessor whose programme collapsed is not;
// - an heir, a failed heir and a negotiated rival handover inherit different things;
// - another player can inherit an exported country, with its real obligations; altered or newer files are refused;
// - losing office opens decisions.

import assert from 'node:assert/strict';
import { FINANCE_CANDIDATES } from '../../content/names';
import { afterOffice } from '../../engine/afterlife';
import { exportCountry, importCountry } from '../../engine/exporting';
import { choosePost, postStep } from '../../engine/postoffice';
import { newGame } from '../../engine/reduce';
import { negotiateSettlement, successionVerdict, survivalForecast, termOptions } from '../../engine/settlement';
import { backSuccessor, candidate } from '../../engine/successor';
import type { GameState } from '../../engine/types';

const setup = { seed: 71, scenario: 'standard', name: 'Check', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN', background: 'governor' as const, address: 'sir' as const, finance: FINANCE_CANDIDATES[0].name, priorities: ['power', 'security', 'food', 'works'] };
const fresh = (): GameState => { const s = newGame(setup); s.phase = 'desk'; s.pc = 90; return s; };
const finished = (ending: GameState['ending'], won = false): GameState => {
  const s = fresh();
  s.agenda.done.push('p1', 'p2', 'p3', 't1', 't3', 'c1');
  s.turn = 97; s.term = 2; s.ending = ending; s.phase = 'verdict';
  if (won) { backSuccessor(s, 'vp'); s.flags['succession.won'] = true; }
  return s;
};

let passed = 0;
const check = (label: string, run: () => void) => { run(); passed++; console.log(`PASS ${label}`); };

check('preparation in office changes nomination support and the survival forecast', () => {
  const s = fresh();
  const id = 'vp';
  const before = candidate(s, id).strength;
  s.flags[`tested.${id}`] = 'passed';
  s.counters[`endorse.${id}.party`] = 1; s.counters[`endorse.${id}.governors`] = 1;
  assert.ok(candidate(s, id).strength > before + 1, 'a passed test and two endorsements add appeal');
  assert.ok(candidate(s, id).why.some((w) => /Endorsed/.test(w)), 'and say why');
  const bare = finished('term_limit', true);
  const prepared = finished('term_limit', true);
  negotiateSettlement(prepared, 'vp', 'the Vice President', termOptions(prepared).filter((t) => t.kind === 'policy').map((t) => t.id), false);
  assert.ok(survivalForecast(prepared).share > survivalForecast(bare).share, 'a settlement naming reforms raises their survival');
});

check('heir, failed heir and rival handover inherit different things', () => {
  const heirPrev = finished('term_limit', true);
  negotiateSettlement(heirPrev, 'vp', 'the Vice President', termOptions(heirPrev).slice(0, 2).map((t) => t.id), false);
  const heir = newGame({ ...setup, name: 'Heir' }, heirPrev);
  const failed = newGame({ ...setup, name: 'Replacement' }, finished('term_limit', false));
  const rivalPrev = finished('defeated');
  negotiateSettlement(rivalPrev, 'alt', 'the winner', termOptions(rivalPrev).filter((t) => t.kind === 'unfinished' || t.kind === 'protection' || t.kind === 'policy').slice(0, 2).map((t) => t.id), true);
  const rival = newGame({ ...setup, name: 'Rival' }, rivalPrev);
  assert.equal(heir.inheritance?.kind, 'heir');
  assert.ok(heir.inheritance?.letter && heir.inheritance.settlement?.terms.length, 'the heir gets a letter and a settlement');
  assert.notEqual(failed.inheritance?.kind, 'heir');
  assert.equal(failed.inheritance?.settlement, null, 'a failed heir inherits no settlement');
  assert.equal(rival.inheritance?.kind, 'rival');
  assert.ok(rival.inheritance!.dossier.length > 0, 'every successor gets a dossier built from the record');
});

check('a competent independent successor can be a success; a protected predecessor with a collapsed programme is not', () => {
  const prev = finished('defeated');
  const next = newGame({ ...setup, name: 'Rival' }, prev);
  assert.match(successionVerdict(next)!.text, /it held/, 'the programme survives under a rival');
  const t = newGame({ ...setup, name: 'Rival' }, prev);
  t.agenda.done = []; t.inheritance!.safety = 'Protected';
  const v = successionVerdict(t)!;
  assert.match(v.text, /failed/);
  assert.match(v.text, /safe in person, not in legacy/, 'personal safety is judged apart from the programme');
});

check('another player can inherit an exported country; altered and newer files are refused', () => {
  const prev = finished('term_limit');
  prev.debts.contractors = 2.4;
  const file = exportCountry(prev, 'I leave you a sound economy.');
  const text = JSON.stringify(file);
  const r = importCountry(text);
  assert.ok(r.ok, r.ok ? '' : r.reason);
  if (!r.ok) return;
  assert.equal(r.letter, 'I leave you a sound economy.');
  assert.ok(r.verified.some((l) => /owed to contractors/.test(l)), 'the verified record sits beside the letter');
  const next = newGame({ ...setup, name: 'Second player' }, r.prev);
  assert.equal(next.debts.contractors, 2.4, 'the real obligations come with it');
  const edited = JSON.parse(text); edited.state.debts.contractors = 0;
  const bad = importCountry(JSON.stringify(edited));
  assert.ok(!bad.ok && /altered/.test(bad.reason));
  const newer = { ...file, version: 99 };
  const nv = importCountry(JSON.stringify(newer));
  assert.ok(!nv.ok && /newer version/.test(nv.reason));
});

check('losing office opens decisions that change what happens next', () => {
  const s = finished('defeated');
  s.purseTaken.personal = 30;
  s.exposures.push({ kind: 'personal', amount: 30, witnesses: ['ty_trade', 'ty_bank'], trail: 3, turn: 10, causeId: 'x', label: 'x' });
  const shieldBefore = afterOffice(s).shield.length;
  assert.ok(postStep(s), 'there is a decision to make');
  choosePost(s, postStep(s)!.choices[0].id);
  const inquiry = postStep(s)!;
  assert.equal(inquiry.id, 'inquiry', 'with money taken, the agency calls');
  choosePost(s, 'cooperate');
  assert.ok(afterOffice(s).shield.length > shieldBefore, 'cooperating changes the outcome');
  choosePost(s, postStep(s)!.choices[0].id);
  choosePost(s, 'foundation');
  assert.ok(s.post!.done && s.post!.log.length === 4, 'four decisions, recorded');
});

console.log(`${passed} succession checks passed.`);
