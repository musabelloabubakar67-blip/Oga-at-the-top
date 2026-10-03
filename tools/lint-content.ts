// Content linter. Fails the build on broken references and schema-rule violations.

import { EVENTS, EVENT_LIST } from '../content';
import { ORDERS, TRACKS } from '../content/agenda';
import { CAST, NAMES } from '../content/names';
import { PEOPLE, PERSON_BY_ID, RIVALS } from '../content/people';
import { EDITORIALS, FILLERS, SIDEBARS, STORIES } from '../content/press';
import { TYCOONS, TYCOON_BY_ID } from '../content/tycoons';
import { VENTURES } from '../content/ventures';
import { SHOCKS } from '../content/shocks';
import { SELECTORS } from '../engine/cast';
import type { Cond, Fx, GameEvent, Op2, Outcome } from '../engine/types';

const errors: string[] = [];
const warn: string[] = [];
type Ref = { id: string };
const err = (e: Ref, m: string) => errors.push(`${e.id}: ${m}`);

const TARGET = /^(nation\.(inflation|petrolPrice|fiscalSpace|debt|security|power|capacity|integrity|jobs)|pressure\.(fuelSupplyStress|wageGrievance|scandalHeat)|bloc\.(villa|party|street|establishment|press)|zone\.(NW|NE|NC|SW|SE|SS)\.(approval|security)|approval|pc|purse|rel\.\w+|counter\.\w+|campaign|bonus\.(fiscal|inflation|power|security|capacity|integrity|jobs)|rival\.(alt|fire|strong)|person\.\w+|debt\.(eurobond|bonds|ways|gas|contractors|pensions)|fund\.(abroad|buffer|infra|growth)|tycoon\.\w+|theatre\.(NW|NE|NC|SW|SE|SS)|drift\.(NW|NE|NC|SW|SE|SS|all)|sec\.(strike|shield|hold)|oil\.price)$/;
const READ_PATH = /^(nation|pressure|bloc|zone|approval|hardship|pc|purse|turn|termTurn|exposure|rel|leverage|char|count|counter|campaign|agenda|bonus|ordered|venture|bets|senate|person|rival|tracks|debt|fund|oil|budget|tycoon|theatre|drift|sec|favour|owing|favours|debts|active|focus|story|gone|comp|govs|granted|delegates|margin|outlook|era|pred)(\.|$)/;
const BASE_TOKENS = ['PRES', 'NAME', 'SIR', 'MRP', 'PARTY', 'PSHORT', 'HOME', 'YEAR', 'FIN', 'FINSHORT', 'COS', 'SAP', 'REFINERY', 'DONE', 'OIL', 'BENCH', 'OUTPUT', 'BUDGETYEAR', 'DELEGATES', 'PRED', 'PREDPARTY', 'BACKER', 'BACKER_SHORT', 'SENATE', ...Object.keys(NAMES)];
const ROLES = new Set([...CAST.map((c) => c.id), 'fin']);
const OPS = new Set(['backer', 'spendall', 'deliver', 'paydebt', 'notes', 'grant', 'settle', 'grow', 'void', 'governors', 'senators', 'fundmove', 'betrescue', 'betdelay', 'betseen', 'sack', 'mark', 'seen', 'lean', 'story', 'storyend', 'focus', 'defect', 'finleave']);
const KNOWN = new Set([...PEOPLE.map((p) => p.id), ...TYCOONS.map((t) => t.id), ...RIVALS.map((r) => r.id)]);

const seen = new Set<string>();
for (const e of EVENT_LIST) {
  if (seen.has(e.id)) err(e, 'duplicate id');
  seen.add(e.id);
}

/** A cast key stands in for somebody; any name will do for checking the shape. */
const plain = (t: string) => t.replace(/\$[A-Z]+/g, 'x');

function checkCond(e: Ref, c: Cond | undefined): void {
  if (!c) return;
  if ('all' in c) return c.all.forEach((x) => checkCond(e, x));
  if ('any' in c) return c.any.forEach((x) => checkCond(e, x));
  if ('not' in c) return checkCond(e, c.not);
  if ('v' in c) {
    const path = plain(c.v[0]);
    if (!READ_PATH.test(path)) err(e, `unknown variable in condition: ${c.v[0]}`);
    const p = path.split('.');
    if ((p[0] === 'person' || p[0] === 'comp' || p[0] === 'gone') && p[1] !== 'x' && !PERSON_BY_ID[p[1]]) err(e, `condition names an unknown person: ${c.v[0]}`);
    if (p[0] === 'tycoon' && p[1] !== 'x' && !TYCOON_BY_ID[p[1]]) err(e, `condition names an unknown businessman: ${c.v[0]}`);
  }
  if ('chose' in c && !EVENTS[c.chose[0]]) err(e, `condition references unknown event: ${c.chose[0]}`);
  if ('fired' in c && !EVENTS[c.fired]) err(e, `condition references unknown event: ${c.fired}`);
  if ('never' in c && !EVENTS[c.never]) err(e, `condition references unknown event: ${c.never}`);
}

function checkFx(e: Ref, fx: Fx[] | undefined): void {
  for (const f of fx ?? []) {
    const t = plain(f[0]);
    if (!TARGET.test(t)) err(e, `unknown effect target: ${f[0]}`);
    const p = t.split('.');
    if (p[0] === 'person' && p[1] !== 'x' && !PERSON_BY_ID[p[1]]) err(e, `effect names an unknown person: ${f[0]}`);
    if (p[0] === 'tycoon' && p[1] !== 'x' && !TYCOON_BY_ID[p[1]]) err(e, `effect names an unknown businessman: ${f[0]}`);
  }
}

function checkOps(e: Ref, ops: Op2[] | undefined): void {
  for (const op of ops ?? []) if (!OPS.has(op[0])) err(e, `unknown operation: ${op[0]}`);
}

function tokensFor(e: GameEvent): Set<string> {
  const out = new Set(BASE_TOKENS);
  for (const k of Object.keys(e.cast ?? {})) for (const suffix of ['', '_SHORT', '_TITLE', '_WANT', '_RISK', '_FIX', '_THREAT']) out.add(k + suffix);
  return out;
}

function checkText(e: GameEvent, t: string | undefined, tokens: Set<string>): void {
  for (const m of (t ?? '').matchAll(/\{([A-Z_]+)\}/g)) if (!tokens.has(m[1])) err(e, `unknown token {${m[1]}}`);
}

function checkOutcome(e: GameEvent, o: Outcome, where: string, tokens: Set<string>): boolean {
  checkCond(e, o.when);
  checkFx(e, o.fx);
  checkOps(e, o.ops);
  checkText(e, o.result, tokens);
  checkText(e, o.archive, tokens);
  if (!o.archive) err(e, `${where}: missing archive entry`);
  if (o.favour && !o.favour[0].startsWith('$') && !KNOWN.has(o.favour[0])) err(e, `${where}: favour names nobody known: ${o.favour[0]}`);
  for (const l of o.later ?? []) { checkFx(e, l.fx); checkCond(e, l.when); l.note?.forEach((n) => checkText(e, n, tokens)); }
  for (const f of o.follow ?? []) {
    if (!EVENTS[f.event]) err(e, `${where}: follow-up to unknown event ${f.event}`);
    checkCond(e, f.when);
  }
  o.news?.forEach((n) => checkText(e, n, tokens));
  if (e.slot === 'lead' && !o.news && !o.ends && !o.exposure && !o.ops && e.category !== 'temptation') warn.push(`${e.id}/${where}: lead outcome has no headline`);
  return !!(o.later?.length || o.follow?.length || o.flags || o.exposure || o.ops?.length || o.favour
    || o.fx?.some((f) => /^(pressure|counter|bonus|debt|fund|tycoon|theatre|person|rival)\./.test(f[0])));
}

let leads = 0;
let minors = 0;
let cast = 0;
for (const e of EVENT_LIST) {
  if (e.slot === 'lead') leads++; else minors++;
  if (e.cast) cast++;
  const tokens = tokensFor(e);
  for (const sel of Object.values(e.cast ?? {})) if (!SELECTORS[sel]) err(e, `cast uses an unknown selector: ${sel}`);
  checkCond(e, e.when);
  checkText(e, e.title, tokens); checkText(e, e.office, tokens); checkText(e, e.from, tokens); checkText(e, e.statement, tokens);
  for (const b of e.body) {
    if (typeof b === 'string') checkText(e, b, tokens);
    else { checkText(e, b.text, tokens); checkCond(e, b.when); }
  }
  for (const r of e.reads ?? []) {
    if (!ROLES.has(r.role)) err(e, `read from unknown role: ${r.role}`);
    if (r.on && !e.choices.some((c) => c.id === r.on)) err(e, `read refers to unknown choice: ${r.on}`);
    checkText(e, r.good, tokens); checkText(e, r.weak, tokens);
  }
  if (e.slot === 'lead' && (e.reads?.length ?? 0) < 1) err(e, 'lead file has no adviser read');
  if (e.choices.length < 1) err(e, 'no choices');
  if (e.slot === 'minor' && !e.ignored) err(e, 'minor matter has no ignored outcome');
  if (e.ignored) checkOutcome(e, e.ignored, 'ignored', tokens);
  for (const t of e.trace ?? []) if (!t[0].startsWith('flag:') && !TARGET.test(t[0])) err(e, `unknown trace target: ${t[0]}`);

  let echoes = false;
  const ids = new Set<string>();
  for (const c of e.choices) {
    if (ids.has(c.id)) err(e, `duplicate choice id ${c.id}`);
    ids.add(c.id);
    checkCond(e, c.requires);
    checkText(e, c.label, tokens);
    if (!c.outcomes.length) err(e, `choice ${c.id} has no outcome`);
    const last = c.outcomes[c.outcomes.length - 1];
    if (last && (last.when || last.chance !== undefined)) err(e, `choice ${c.id}: final outcome must be unconditional`);
    for (const o of c.outcomes) if (checkOutcome(e, o, c.id, tokens)) echoes = true;
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

// An aimed order is checked as if it were aimed at a sample target of its kind.
const SAMPLE: Record<string, [string, string]> = { governor: ['gov_nw', 'NW'], politician: ['gov_nw', 'NW'], tycoon: ['ty_trade', 'NW'], rival: ['alt', 'NW'], zone: ['NW', 'NW'], paper: ['chronicle', 'NW'], theatre: ['NW', 'NW'] };
for (const o of ORDERS) {
  const ref = { id: `order.${o.id}` };
  const [tid, tz] = o.target ? SAMPLE[o.target] : ['', ''];
  const aim = (fx: Fx[] | undefined) => fx?.filter((f) => !(o.target === 'paper' && f[0] === 'paper')).map(([t, ...rest]) => [t.replace('$T', tid).replace('$Z', tz), ...rest] as Fx);
  const texts = [o.result, o.archive, ...o.news, ...(o.later ?? []).flatMap((l) => [l.label, ...(l.note ?? [])])];
  const fxKeys = [...(o.fx ?? []), ...(o.later ?? []).flatMap((l) => l.fx)].map((f) => f[0]);
  if (!o.target && (texts.some((x) => /\{T(_SHORT|_ZONE)?\}/.test(x)) || fxKeys.some((k) => k.includes('$')))) err(ref, 'names a target but the order is not aimed at anyone');
  if (o.hostile && (!o.target || o.target === 'theatre')) err(ref, 'hostile, but not aimed at anyone');
  if ((o.target === 'zone' || o.target === 'paper') && fxKeys.some((k) => k.includes('$T'))) err(ref, `$T means nothing for an order aimed at a ${o.target}`);
  checkCond(ref, o.when);
  checkFx(ref, aim(o.fx));
  for (const l of o.later ?? []) { checkFx(ref, aim(l.fx)); checkCond(ref, l.when); }
  for (const f of o.follow ?? []) if (!EVENTS[f.event]) err(ref, `follow-up to unknown event ${f.event}`);
  if (o.event && !EVENTS[o.event[0]]?.choices.some((c) => c.id === o.event![1])) err(ref, 'points at an unknown event choice');
}

// Reforms, big bets, businessmen and the press all carry conditions and effects of their own.
const milestones = new Set(TRACKS.flatMap((t) => t.milestones.map((m) => m.id)));
for (const t of TRACKS) for (const m of t.milestones) {
  const ref = { id: `reform.${m.id}` };
  checkCond(ref, m.needs); checkFx(ref, m.start); checkFx(ref, m.done); checkFx(ref, m.during);
  if (m.during?.length && !m.duringText) err(ref, 'a reform that hurts while under way must say why (duringText)');
}
for (const v of VENTURES) {
  const ref = { id: `bet.${v.id}` };
  checkCond(ref, v.when); checkFx(ref, v.start); checkFx(ref, v.win); checkFx(ref, v.lose);
  if (!v.risks.length) err(ref, 'a big bet with nothing it depends on fails for no reason');
  if (v.top - v.risks.reduce((a, r) => a + r.cost, 0) > 0.45) warn.push(`bet.${v.id}: even with nothing in place the odds stay above 45%`);
  if (v.brief && !PERSON_BY_ID[v.brief]) err(ref, `unknown minister: ${v.brief}`);
  if (v.partner && !TYCOON_BY_ID[v.partner]) err(ref, `unknown partner: ${v.partner}`);
  for (const r of v.risks) {
    checkCond(ref, r.ok);
    if (!r.warn || !r.fail || !r.fix) err(ref, `condition ${r.id} is missing its warning, cause or remedy`);
    if ('v' in r.ok && r.ok.v[0].startsWith('agenda.') && !milestones.has(r.ok.v[0].slice(7))) err(ref, `depends on an unknown reform: ${r.ok.v[0]}`);
  }
  if (v.when && 'v' in v.when && v.when.v[0].startsWith('agenda.') && !milestones.has(v.when.v[0].slice(7))) err(ref, `opened by an unknown reform: ${v.when.v[0]}`);
}
for (const t of TYCOONS) {
  const ref = { id: `tycoon.${t.id}` };
  for (const m of t.moved) checkCond(ref, m.when);
  checkFx(ref, t.want.fx); checkFx(ref, t.squeeze.fx);
}
for (const p of PEOPLE) if (p.want) checkFx({ id: `person.${p.id}` }, p.want.fx);
SIDEBARS.forEach((b, i) => checkCond({ id: `sidebar.${i}` }, b.when));
FILLERS.forEach((b, i) => checkCond({ id: `filler.${i}` }, b.when));
EDITORIALS.forEach((b, i) => checkCond({ id: `editorial.${i}` }, b.when));
for (const st of STORIES) {
  const ref = { id: `story.${st.id}` };
  checkCond(ref, st.alive);
  for (const p of st.parts) checkFx(ref, p.fx);
  checkFx(ref, st.closed?.fx);
}

const chains = EVENT_LIST.filter((e) => e.kind === 'chain');
const followed = new Set<string>();
for (const e of EVENT_LIST) for (const c of e.choices) for (const o of c.outcomes) for (const f of o.follow ?? []) followed.add(f.event);
// Queued by the engine.
followed.add('removal.notice');
followed.add('opp.woo');
followed.add('tribunal.petition');
for (const d of SHOCKS) followed.add(d.file);
for (const e of EVENT_LIST) if (e.ignored) for (const f of e.ignored.follow ?? []) followed.add(f.event);
for (const e of chains) if (!followed.has(e.id)) err(e, 'chain event is never queued by anything');

const opened = VENTURES.filter((v) => v.opened).length;
console.log(`${EVENT_LIST.length} events: ${leads} lead files, ${minors} minor matters, ${cast} cast from the state.`);
console.log(`${ORDERS.length} executive powers, ${ORDERS.filter((o) => o.situational).length} of them situational. ${TRACKS.length} reform tracks, ${milestones.size} reforms.`);
console.log(`${VENTURES.length} big bets, ${opened} opened by reforms. ${TYCOONS.length} businessmen. ${SIDEBARS.length + FILLERS.length + EDITORIALS.length} conditioned press lines, ${STORIES.length} running stories.`);
for (const w of warn) console.log(`  warn  ${w}`);
// Shocks: effects, cushions and files must all resolve.
for (const d of SHOCKS) {
  const ref = { id: `shock.${d.id}` };
  checkFx(ref, d.hit);
  checkCond(ref, d.when);
  for (const g of d.guards) checkCond(ref, g.when);
  if (!EVENTS[d.file]) err(ref, `file ${d.file} does not exist`);
  if (!d.good && d.guards.filter((g) => !('flag' in g.when)).length === 0) err(ref, 'a bad shock needs at least one thing the President could have built to cushion it');
}

if (errors.length) {
  for (const m of errors) console.error(`  ERROR ${m}`);
  process.exit(1);
}
console.log('Content lint passed.');
