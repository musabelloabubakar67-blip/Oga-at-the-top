// Content linter. Fails the build on broken references and schema-rule violations (GDD 5.2).

import { EVENTS, EVENT_LIST } from '../content';
import { ORDERS } from '../content/agenda';
import { CAST, NAMES } from '../content/names';
import type { Cond, Fx, GameEvent, Outcome } from '../engine/types';

const errors: string[] = [];
const warn: string[] = [];
const err = (e: GameEvent, m: string) => errors.push(`${e.id}: ${m}`);

const TARGET = /^(nation\.(inflation|petrolPrice|fiscalSpace|debt|security|power|capacity|integrity|jobs)|pressure\.(fuelSupplyStress|wageGrievance|scandalHeat)|bloc\.(villa|party|street|establishment|press)|zone\.(NW|NE|NC|SW|SE|SS)\.(approval|security)|approval|pc|purse|rel\.\w+|counter\.\w+|campaign|bonus\.(fiscal|inflation|power|security|capacity|integrity|jobs)|rival\.(alt|fire|strong)|person\.\w+)$/;
const READ_PATH = /^(nation|pressure|bloc|zone|approval|hardship|pc|purse|turn|termTurn|exposure|rel|leverage|char|count|counter|campaign|agenda|bonus|ordered|venture|senate|person|rival|tracks)(\.|$)/;
const TOKENS = new Set(['PRES', 'NAME', 'SIR', 'MRP', 'PARTY', 'PSHORT', 'HOME', 'YEAR', 'FIN', 'FINSHORT', 'COS', 'SAP', 'REFINERY', 'DONE', ...Object.keys(NAMES)]);
const ROLES = new Set([...CAST.map((c) => c.id), 'fin']);

const seen = new Set<string>();
for (const e of EVENT_LIST) {
  if (seen.has(e.id)) err(e, 'duplicate id');
  seen.add(e.id);
}

function checkCond(e: GameEvent, c: Cond | undefined): void {
  if (!c) return;
  if ('all' in c) return c.all.forEach((x) => checkCond(e, x));
  if ('any' in c) return c.any.forEach((x) => checkCond(e, x));
  if ('not' in c) return checkCond(e, c.not);
  if ('v' in c && !READ_PATH.test(c.v[0])) err(e, `unknown variable in condition: ${c.v[0]}`);
  if ('chose' in c && !EVENTS[c.chose[0]]) err(e, `condition references unknown event: ${c.chose[0]}`);
  if ('fired' in c && !EVENTS[c.fired]) err(e, `condition references unknown event: ${c.fired}`);
  if ('never' in c && !EVENTS[c.never]) err(e, `condition references unknown event: ${c.never}`);
}

function checkFx(e: GameEvent, fx: Fx[] | undefined): void {
  for (const f of fx ?? []) if (!TARGET.test(f[0])) err(e, `unknown effect target: ${f[0]}`);
}

function checkText(e: GameEvent, t: string | undefined): void {
  for (const m of (t ?? '').matchAll(/\{([A-Z_]+)\}/g)) if (!TOKENS.has(m[1])) err(e, `unknown token {${m[1]}}`);
}

function checkOutcome(e: GameEvent, o: Outcome, where: string): boolean {
  checkCond(e, o.when);
  checkFx(e, o.fx);
  checkText(e, o.result);
  checkText(e, o.archive);
  if (!o.archive) err(e, `${where}: missing archive entry`);
  for (const l of o.later ?? []) { checkFx(e, l.fx); checkCond(e, l.when); l.note?.forEach((n) => checkText(e, n)); }
  for (const f of o.follow ?? []) {
    if (!EVENTS[f.event]) err(e, `${where}: follow-up to unknown event ${f.event}`);
    checkCond(e, f.when);
  }
  o.news?.forEach((n) => checkText(e, n));
  if (e.slot === 'lead' && !o.news && !o.ends && !o.exposure && e.category !== 'temptation') warn.push(`${e.id}/${where}: lead outcome has no headline`);
  return !!(o.later?.length || o.follow?.length || o.flags || o.exposure || o.fx?.some((f) => f[0].startsWith('pressure.') || f[0].startsWith('counter.') || f[0].startsWith('bonus.')));
}

let leads = 0;
let minors = 0;
for (const e of EVENT_LIST) {
  if (e.slot === 'lead') leads++; else minors++;
  checkCond(e, e.when);
  checkText(e, e.title); checkText(e, e.office); checkText(e, e.from); checkText(e, e.statement);
  for (const b of e.body) {
    if (typeof b === 'string') checkText(e, b);
    else { checkText(e, b.text); checkCond(e, b.when); }
  }
  for (const r of e.reads ?? []) {
    if (!ROLES.has(r.role)) err(e, `read from unknown role: ${r.role}`);
    if (r.on && !e.choices.some((c) => c.id === r.on)) err(e, `read refers to unknown choice: ${r.on}`);
    checkText(e, r.good); checkText(e, r.weak);
  }
  if (e.slot === 'lead' && (e.reads?.length ?? 0) < 1) err(e, 'lead file has no adviser read');
  if (e.choices.length < 1) err(e, 'no choices');
  if (e.slot === 'minor' && !e.ignored) err(e, 'minor matter has no ignored outcome');
  if (e.ignored) checkOutcome(e, e.ignored, 'ignored');
  for (const t of e.trace ?? []) if (!t[0].startsWith('flag:') && !TARGET.test(t[0])) err(e, `unknown trace target: ${t[0]}`);

  let echoes = false;
  const ids = new Set<string>();
  for (const c of e.choices) {
    if (ids.has(c.id)) err(e, `duplicate choice id ${c.id}`);
    ids.add(c.id);
    checkCond(e, c.requires);
    checkText(e, c.label);
    if (!c.outcomes.length) err(e, `choice ${c.id} has no outcome`);
    const last = c.outcomes[c.outcomes.length - 1];
    if (last && (last.when || last.chance !== undefined)) err(e, `choice ${c.id}: final outcome must be unconditional`);
    for (const o of c.outcomes) if (checkOutcome(e, o, c.id)) echoes = true;
  }
  if (e.slot === 'lead' && !echoes) err(e, 'nothing echoes: no delayed consequence on any choice');
  // A president with no capital and an empty drawer must still be able to decide.
  if (e.slot === 'lead' && !e.choices.some((c) => !c.purse && !c.requires)) err(e, 'no choice is always available (softlock)');

  // Tone rules: grave events carry no farce in the youth outlet's headline.
  if (e.tone === 'grave') {
    for (const c of e.choices) for (const o of c.outcomes) {
      if (o.news && /LOL|😂|CHOP|SHARP-SHARP/.test(o.news[1])) err(e, `grave event with a flippant headline: ${o.news[1]}`);
    }
  }
}

for (const o of ORDERS) {
  const pseudo = { id: `order.${o.id}` } as GameEvent;
  checkCond(pseudo, o.when);
  checkFx(pseudo, o.fx);
  for (const l of o.later ?? []) { checkFx(pseudo, l.fx); checkCond(pseudo, l.when); }
  for (const f of o.follow ?? []) if (!EVENTS[f.event]) err(pseudo, `follow-up to unknown event ${f.event}`);
  if (o.event && !EVENTS[o.event[0]]?.choices.some((c) => c.id === o.event![1])) err(pseudo, 'points at an unknown event choice');
}

const chains = EVENT_LIST.filter((e) => e.kind === 'chain');
const followed = new Set<string>();
for (const e of EVENT_LIST) for (const c of e.choices) for (const o of c.outcomes) for (const f of o.follow ?? []) followed.add(f.event);
followed.add('removal.notice'); // queued by the engine
for (const e of EVENT_LIST) if (e.ignored) for (const f of e.ignored.follow ?? []) followed.add(f.event);
for (const e of chains) if (!followed.has(e.id)) err(e, 'chain event is never queued by anything');

console.log(`${EVENT_LIST.length} events: ${leads} lead files, ${minors} minor matters. ${ORDERS.length} executive powers, ${ORDERS.filter((o) => o.situational).length} of them situational.`);
for (const w of warn) console.log(`  warn  ${w}`);
if (errors.length) {
  for (const m of errors) console.error(`  ERROR ${m}`);
  process.exit(1);
}
console.log('Content lint passed.');
