import { reformName } from './reforms';
// The papers. Two of four are printed each month, on the same lead story, by
// editors who do not agree about it. Every line is chosen for what the story
// is about and whether it is good or bad for the government.

import { rivalOf } from './rivals';
import { MILESTONE_BY_ID } from '../content/agenda';
import { COOL_LINES, GRUDGE_LINES, LOYAL_LINES, PEOPLE, PERSON_BY_ID, RIVAL_BY_ID } from '../content/people';
import {
  COMMENT, EDITORIALS, FILLERS, HOSTILE_BAD, HOSTILE_GOOD, LOYAL_BAD, LOYAL_GOOD, MINISTER_EXCUSE, MINISTER_PROUD,
  OUTLETS, SIDEBARS, STORIES, STORY_BY_ID, STRAPS, VILLA_LEAK,
} from '../content/press';
import { THEATRE_BY_ZONE } from '../content/theatres';
import { TYCOONS, TYCOON_BY_ID } from '../content/tycoons';
import { VENTURE_BY_ID } from '../content/ventures';
import { risksOf } from './bets';
import { dateLabel, termTurnOf } from './config';
import { kindOf, who } from './favours';
import { personView, relWord, scorecard, strongestRival } from './people';
import { fill, naira } from './text';
import type { FrontPage, GameState, NewsSeed, OutletId, Stance, Topic } from './types';
import { ZONES, ZONE_NAME, applyFx, approval, hardship, standing, test } from './vars';
import { mediaOwner } from './era';
import { talkTick } from './narrative';

// ---------------------------------------------------------------- printing a line once

/** True if this line may be printed now. Marks it as printed. */
function once(s: GameState, key: string, gap = Infinity): boolean {
  const last = s.used[key];
  if (last !== undefined && s.turn - last < gap) return false;
  s.used[key] = s.turn;
  return true;
}

/** The first line in the pool that has not been printed (or not for `gap` months). */
function pick(s: GameState, pool: string, lines: string[] | undefined, gap = Infinity): string | null {
  if (!lines?.length) return null;
  const offset = s.seed % lines.length;
  for (let i = 0; i < lines.length; i++) {
    const j = (i + offset) % lines.length;
    if (once(s, `${pool}.${j}`, gap)) return lines[j];
  }
  return null;
}

// ---------------------------------------------------------------- what the state itself makes news of

function simSeeds(s: GameState): NewsSeed[] {
  const out: NewsSeed[] = [];
  const h = s.hist;
  if (h.length >= 3) {
    const d = s.nation.inflation - h[h.length - 3].inflation;
    const v = s.nation.inflation.toFixed(1);
    if (d > 1.2) out.push({ chronicle: `INFLATION RISES TO ${v}% — STATISTICS BUREAU`, street: `${v}%: "EVERYTHING DON COST" — MARKET WOMEN`, weight: 2.2, valence: -1, topic: 'prices', body: `Prices are rising at ${v}% a year, the Statistics Bureau said, up ${d.toFixed(1)} points in two months. Food and transport led the increase.` });
    if (d < -1.2) out.push({ chronicle: `INFLATION EASES TO ${v}%`, street: `INFLATION "DOWN" TO ${v}%. HAS ANYBODY TOLD THE MARKET?`, weight: 2.2, valence: 1, topic: 'prices', body: `Inflation has slowed to ${v}%, down ${(-d).toFixed(1)} points in two months. Traders say the fall has yet to reach the stalls.` });
  }
  const app = approval(s);
  const da = app - s.approvalPrev;
  if (da < -4) out.push({ chronicle: `PRESIDENT'S APPROVAL SLIPS TO ${Math.round(app)}% — POLL`, street: `POLL: ONLY ${Math.round(app)}% STILL DEY WITH {NAME}`, weight: 2, valence: -1, topic: 'politics' });
  if (da > 4) out.push({ chronicle: `APPROVAL RECOVERS TO ${Math.round(app)}% — POLL`, street: `${Math.round(app)}%: THE STREET IS WARMING UP`, weight: 1.8, valence: 1, topic: 'politics' });

  // The opposition and your own people make news of their own.
  const rival = strongestRival(s);
  const prevRival = s.counters.rivalPrev ?? rival.strength;
  if (rival.strength - prevRival > 3) {
    const r = rivalOf(s, rival.id);
    out.push({ chronicle: `${r.name.toUpperCase()} GAINS GROUND IN NEW POLL`, street: `${r.short.toUpperCase()} DEY GATHER CROWD`, weight: 2.4, valence: -1, topic: 'politics', about: r.id, body: `${r.name} of the ${r.party} is now the President's strongest challenger. ${r.feeds}` });
  }
  s.counters.rivalPrev = rival.strength;
  for (const p of PEOPLE) {
    if (p.group === 'minister') continue;
    const st = s.people[p.id];
    if (!st || st.gone) continue;
    const key = `mood.${p.id}`;
    const was = s.counters[key] ?? st.rel;
    if (was >= 40 && st.rel < 40) {
      out.push({ chronicle: `${p.short.toUpperCase()} BREAKS RANKS: "WE WERE NOT CARRIED ALONG"`, street: `${p.short.toUpperCase()} DON VEX FOR PRESIDENT`, weight: 2.6, valence: -1, topic: 'people', about: p.id, body: `${p.name}, who ${p.title.toLowerCase()}, told reporters the Presidency had stopped consulting its own party. Aides describe the relationship as "cordial", which in Abuja it is not.` });
    }
    s.counters[key] = st.rel;
  }
  return out;
}

/** Small stories drawn from the President's own books, people and projects. Each needs a reason to be true. */
function stateSeeds(s: GameState): NewsSeed[] {
  const out: (NewsSeed & { key: string; gap: number })[] = [];
  const add = (key: string, gap: number, seed: NewsSeed) => out.push({ ...seed, key, gap });
  const d = s.debts;
  if (d.contractors > 1) add('contractors', 9, { chronicle: `CONTRACTORS OWED ${naira(d.contractors).toUpperCase()} ABANDON FEDERAL SITES`, street: `GOVERNMENT DEY OWE CONTRACTORS ${naira(d.contractors).toUpperCase()}. WORK DON STOP`, weight: 1.6, valence: -1, topic: 'money', about: 'min_works' });
  if (d.pensions > 0.4) add('pensions', 9, { chronicle: `PENSION ARREARS NOW ${naira(d.pensions).toUpperCase()}`, street: 'PENSIONERS STILL DEY WAIT. SOME SINCE 2021', weight: 1.6, valence: -1, topic: 'labour' });
  if (d.gas > 0.6) add('gas', 9, { chronicle: `GAS SUPPLIERS WARN OF CUTS OVER ${naira(d.gas).toUpperCase()} DEBT`, street: 'GAS PEOPLE SAY DEM GO CUT SUPPLY. LIGHT GO WORSE', weight: 1.8, valence: -1, topic: 'power', about: 'min_power' });
  if (d.ways < 1 && s.turn > 12) add('ways', 99, { chronicle: 'CENTRAL BANK OVERDRAFT ALL BUT CLEARED', street: 'GOVERNMENT DON STOP TO DEY PRINT MONEY', weight: 1.6, valence: 1, topic: 'money' });
  if (s.funds.abroad > 0.8) add('abroad', 12, { chronicle: `FUTURE GENERATIONS FUND NOW HOLDS ${naira(s.funds.abroad).toUpperCase()}`, street: `${naira(s.funds.abroad).toUpperCase()} DEY ABROAD FOR "FUTURE". WETIN OF NOW?`, weight: 1.4, valence: 0, topic: 'money' });
  if (s.funds.buffer > 1.2) add('buffer', 10, { chronicle: `GOVERNORS EYE ${naira(s.funds.buffer).toUpperCase()} IN STABILISATION ACCOUNT`, street: 'GOVERNORS DON SEE THE MONEY. DEM WAN SHARE AM', weight: 1.6, valence: 0, topic: 'money', about: 'gov_ss' });
  const gap = s.oil.price - s.budget.benchmark;
  if (Math.abs(gap) > 8) add('oil', 7, gap > 0
    ? { chronicle: `OIL AT $${Math.round(s.oil.price)}, $${Math.round(gap)} ABOVE BUDGET BENCHMARK`, street: `OIL DON REACH $${Math.round(s.oil.price)}. WHO DEY KEEP THE CHANGE?`, weight: 1.6, valence: 1, topic: 'oil' }
    : { chronicle: `OIL AT $${Math.round(s.oil.price)}, $${Math.round(-gap)} BELOW BUDGET BENCHMARK`, street: `OIL NA $${Math.round(s.oil.price)}. BUDGET SAY $${s.budget.benchmark}. YAWA`, weight: 1.9, valence: -1, topic: 'oil' });
  if (s.oil.output < 1.5) add('output', 10, { chronicle: `OIL OUTPUT FALLS TO ${s.oil.output.toFixed(2)}M BARRELS A DAY ON THEFT`, street: 'DEM DEY THIEF OUR OIL FOR BROAD DAYLIGHT', weight: 1.8, valence: -1, topic: 'oil', about: 'min_defence' });

  // Ministers.
  const cards = PEOPLE.filter((p) => p.group === 'minister').map((p) => scorecard(s, p.id)).filter((c) => c.months >= 8).sort((a, b) => a.score - b.score);
  if (cards.length) {
    const worst = cards[0];
    const best = cards[cards.length - 1];
    const w = personView(s, worst.id);
    const b = personView(s, best.id);
    if (s.agenda.done.includes('v4')) {
      add(`card.worst.${w.name}`, 14, { chronicle: `${w.short.toUpperCase()} RANKED LAST IN MINISTERIAL SCORECARD`, street: `${w.short.toUpperCase()} CARRY LAST FOR MINISTERS RESULT`, weight: 1.8, valence: -1, topic: 'people', about: worst.id });
      if (best.score >= 60) add(`card.best.${b.name}`, 14, { chronicle: `${b.short.toUpperCase()} TOPS MINISTERIAL SCORECARD`, street: `${b.short.toUpperCase()} NA THE BEST MINISTER — RESULT`, weight: 1.5, valence: 1, topic: 'people', about: best.id });
    } else if (worst.score < 40) {
      add(`card.quiet.${w.name}`, 16, { chronicle: `LAWMAKERS QUERY ${w.title.toUpperCase()} OVER STALLED PROJECTS`, street: `WETIN ${w.short.toUpperCase()} DEY DO FOR THAT MINISTRY?`, weight: 1.5, valence: -1, topic: 'people', about: worst.id });
    }
  }

  // Work in progress.
  for (const a of s.agenda.active) {
    const m = MILESTONE_BY_ID[a.id];
    if (m && a.progress >= 50) add(`prog.${a.id}`, 99, { chronicle: `"${reformName(s, a.id).toUpperCase()}" PAST HALFWAY — MINISTRY`, street: `${m.track.name.toUpperCase()}: MINISTRY SAY WORK DON REACH HALF`, weight: 1.3, valence: 1, topic: 'reform' });
  }
  for (const a of s.ventures.active) {
    const v = VENTURE_BY_ID[a.id];
    if (!v || a.progress < 40) continue;
    const unmet = risksOf(s, v).filter((r) => !r.ok);
    if (unmet.length) add(`doubt.${a.id}`, 99, { chronicle: `DOUBTS GROW OVER ${v.name.toUpperCase()}`, street: `THIS ${v.name.toUpperCase()} MATTER: E GO WORK SO?`, weight: 1.9, valence: -1, topic: 'bet', about: v.brief, body: unmet[0].risk.warn });
  }

  // The theatres.
  for (const z of ZONES) {
    const t = THEATRE_BY_ZONE[z];
    const before = s.counters[`threat.${z}`] ?? s.theatres[z];
    if (before >= 60 && s.theatres[z] < 50) add(`calm.${z}`, 24, { chronicle: `${t.name.toUpperCase()}: SHARP FALL IN INCIDENTS`, street: z === 'SS' ? 'OIL THIEF DEM DON REDUCE' : `${ZONE_NAME[z].toUpperCase()} DON CALM SMALL. PEOPLE DEY WAKA FOR NIGHT`, weight: 2, valence: 1, topic: 'security', about: 'min_defence' });
    if (s.turn % 6 === 0) s.counters[`threat.${z}`] = s.theatres[z];
  }

  // The money men.
  for (const t of TYCOONS) {
    const rel = s.tycoons[t.id]?.rel ?? 50;
    if (rel >= 68) add(`friend.${t.id}`, 30, { chronicle: `${t.short.toUpperCase()} PLEDGES "FULL SUPPORT" FOR PRESIDENT'S AGENDA`, street: `${t.short.toUpperCase()} AND PRESIDENT DON BE FIVE AND SIX`, weight: 1.3, valence: 0, topic: 'money', about: t.id });
  }

  return out.filter((x) => once(s, `seed.${x.key}`, x.gap));
}

function anniversary(s: GameState): NewsSeed | null {
  const tt = termTurnOf(s.turn);
  if (tt !== 13 && tt !== 25 && tt !== 37) return null;
  const years = Math.floor((s.turn - 1) / 12);
  const better = s.baseline.hardship - hardship(s);
  const word = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'][years] ?? String(years);
  const plural = years === 1 ? 'YEAR' : 'YEARS';
  const done = s.agenda.done.length;
  const body = `The administration has delivered ${done} of the reforms on its list${done === 0 ? ', which is to say none' : ''}. Cost-of-living pressure is ${better > 3 ? 'lower' : better < -3 ? 'higher' : 'about where it was'} than on inauguration day. Debt service takes ${Math.round(s.nation.debt)}% of revenue, against ${Math.round(s.baseline.debt)}% then.`;
  const base = { weight: 6, body, topic: 'general' as Topic };
  if (better > 6) return { ...base, chronicle: `${word} ${plural} ON: THE HARD CHOICES BEGIN TO PAY`, street: `${word} ${plural} OF {NAME}: E DON BETTER SMALL, WE NO GO LIE`, valence: 1 };
  if (better < -6) return { ...base, chronicle: `${word} ${plural} ON: PROMISES OUTPACE DELIVERY`, street: `${word} ${plural} OF {NAME}: "WE ARE JUST MANAGING"`, valence: -1 };
  return { ...base, chronicle: `${word} ${plural} ON: A PRESIDENCY STILL FINDING ITS FEET`, street: `${word} ${plural} OF {NAME}: SAME STORY, NEW MASTHEAD`, valence: 0 };
}

// ---------------------------------------------------------------- stories that run for months

const PART = ['Part one', 'Part two', 'Part three', 'Part four'];

function storySeeds(s: GameState): NewsSeed[] {
  const out: NewsSeed[] = [];
  const keep: GameState['stories'] = [];
  for (const st of s.stories) {
    const def = STORY_BY_ID[st.id];
    if (!def) continue;
    if (st.next > s.turn) { keep.push(st); continue; }
    // A minister series follows the minister. If they have gone, so has the story.
    const subjectGone = !!st.about && !!PERSON_BY_ID[st.about] && st.name !== undefined && (s.people[st.about]?.name ?? PERSON_BY_ID[st.about].name) !== st.name;
    if (!test(s, def.alive) || subjectGone) {
      if (st.stage > 0 && def.closed) {
        for (const fx of def.closed.fx ?? []) applyFx(s, fx);
        out.push({ chronicle: def.closed.chronicle, street: def.closed.street, body: def.closed.body, weight: 4.5, valence: 1, topic: def.topic, about: st.about });
      }
      continue;
    }
    const part = def.parts[st.stage];
    if (!part) continue;
    if (st.stage === 0 && st.about && PERSON_BY_ID[st.about]) st.name = s.people[st.about]?.name ?? PERSON_BY_ID[st.about].name;
    for (const fx of part.fx ?? []) applyFx(s, fx);
    out.push({
      chronicle: part.chronicle, street: part.street, body: part.body, weight: 4.6 + st.stage * 0.4, valence: -1, topic: def.topic, about: st.about,
      series: `${PART[st.stage]} of ${['', 'one', 'two', 'three', 'four'][def.parts.length]}`,
    });
    st.stage += 1;
    st.next = s.turn + def.gap;
    if (st.stage < def.parts.length) keep.push(st);
  }
  s.stories = keep;
  return out;
}

/** Things the press starts looking into without being asked. */
function startStories(s: GameState): void {
  const has = (id: string) => s.stories.some((x) => x.id === id) || s.used[`story.${id}`] !== undefined;
  const start = (id: string, about?: string) => { s.used[`story.${id}`] = s.turn; s.stories.push({ id, about, stage: 0, next: s.turn + 1 }); };
  if (!has('pensioners') && s.turn >= 8 && s.debts.pensions > 0.5) start('pensioners');
  if (!has('drawer') && s.exposures.filter((x) => x.kind !== 'tolerated').reduce((a, x) => a + x.trail, 0) >= 4) start('drawer');
  if (!has('licence') && TYCOONS.some((t) => s.tycoons[t.id]?.granted)) start('licence', TYCOONS.find((t) => s.tycoons[t.id]?.granted)?.id);
}

// ---------------------------------------------------------------- putting a page together

function stanceOf(s: GameState, outlet: OutletId): Stance {
  if (outlet === 'chronicle') return 'record';
  if (outlet === 'street') return 'street';
  if (outlet === 'rejoinder') return 'hostile';
  const friendly = (s.tycoons[mediaOwner(s)]?.rel ?? 50) >= 50 || (s.counters.pressFriend ?? -1) > s.turn;
  return friendly ? 'loyal' : 'hostile';
}

function headline(s: GameState, seed: NewsSeed, outlet: OutletId, stance: Stance): string {
  if (outlet === 'street') return seed.street;
  if (outlet === 'chronicle' || seed.grave || seed.weight <= 0) return seed.chronicle;
  const topic = seed.topic ?? 'general';
  // A partisan paper takes a side even when the news has none.
  const good = stance === 'loyal' ? (seed.valence ?? 0) >= 0 : (seed.valence ?? 0) > 0;
  if (stance === 'loyal') {
    if (seed.loyal) return seed.loyal;
    const pool = good ? LOYAL_GOOD : LOYAL_BAD;
    return pick(s, `lh.${good}.${topic}`, pool[topic]) ?? pick(s, `lh.${good}.general`, pool.general) ?? seed.chronicle;
  }
  if (seed.hostile) return seed.hostile;
  const pool = good ? HOSTILE_GOOD : HOSTILE_BAD;
  const r = rivalOf(s, strongestRival(s).id).short.toUpperCase();
  const line = pick(s, `hh.${good}.${topic}`, pool[topic]) ?? pick(s, `hh.${good}.general`, pool.general);
  return line ? line.replace('{R}', r) : seed.chronicle;
}

function quotesFor(s: GameState, seed: NewsSeed, stance: Stance): FrontPage['quotes'] {
  if (seed.grave) return undefined;
  const out: NonNullable<FrontPage['quotes']> = [];
  const good = (seed.valence ?? 0) > 0;
  const about = seed.about;
  const kind = about ? kindOf(about) : 'other';

  // The person the story is about speaks first.
  if (about && kind === 'minister' && (stance === 'record' || stance === 'loyal') && seed.valence) {
    const line = pick(s, good ? 'q.proud' : 'q.excuse', good ? MINISTER_PROUD : MINISTER_EXCUSE);
    const w = who(s, about);
    if (line) out.push({ who: w.name, role: w.title, line: fill(s, line) });
  }
  if (about && (kind === 'governor' || kind === 'senator') && stance !== 'street') {
    const p = personView(s, about);
    const warm = p.standing >= 55;
    // Someone the President has used the state against says so.
    const hurt = (s.wronged ?? []).some((w) => w.who === about && w.until > s.turn);
    const line = hurt ? pick(s, 'q.grudge', GRUDGE_LINES, 10) ?? pick(s, 'q.cool', COOL_LINES) : pick(s, warm ? 'q.loyal' : 'q.cool', warm ? LOYAL_LINES : COOL_LINES);
    if (line) out.push({ who: p.name, role: `${p.title} · ${relWord(p.standing)}`, line: fill(s, line) });
  }
  // The broadsheet gives the opposition its say on bad news. The hostile paper has already made it the headline.
  if (stance === 'record' && !good && seed.valence) {
    const r = rivalOf(s, strongestRival(s).id);
    // What the President has actually done comes first; the stock lines fill the gaps.
    const apt = (r.situational ?? []).filter((x) => test(s, x.when)).map((x) => x.text);
    const line = pick(s, `q.${r.id}.sit`, apt, 18) ?? pick(s, `q.${r.id}`, r.lines);
    if (line) out.push({ who: r.name, role: r.party, line });
  }
  // A hostile paper with a source inside a Villa that is coming apart.
  if (stance === 'hostile' && s.blocs.villa < 45) {
    const line = pick(s, 'q.leak', VILLA_LEAK);
    if (line) out.push({ who: 'A senior official in the Villa', role: 'who asked not to be named', line });
  }
  // On a party matter, somebody from your own side says what their loyalty allows.
  if (!out.length && stance === 'record' && (seed.topic === 'politics' || seed.topic === 'reform')) {
    const mine = PEOPLE.filter((p) => p.group !== 'minister' && !s.people[p.id]?.gone);
    const p = personView(s, mine[(s.turn + s.seed) % mine.length].id);
    const warm = standing(s, p.id) >= 55;
    if (warm === good || !warm) {
      const line = pick(s, warm ? 'q.loyal' : 'q.cool', warm ? LOYAL_LINES : COOL_LINES);
      if (line) out.push({ who: p.name, role: `${p.title} · ${relWord(p.standing)}`, line: fill(s, line) });
    }
  }
  return out.length ? out.slice(0, 2) : undefined;
}

function editorialFor(s: GameState, outlet: OutletId): string | undefined {
  for (let i = 0; i < EDITORIALS.length; i++) {
    const e = EDITORIALS[i];
    const line = e[outlet];
    if (!line || !test(s, e.when)) continue;
    if (once(s, `ed.${outlet}.${i}`, 60)) return line;
  }
  return undefined;
}

function sidebarFor(s: GameState): FrontPage['sidebar'] {
  const offset = s.seed % SIDEBARS.length;
  for (let i = 0; i < SIDEBARS.length; i++) {
    const j = (i + offset) % SIDEBARS.length;
    const b = SIDEBARS[j];
    if (test(s, b.when) && once(s, `side.${j}`)) return { kicker: b.kicker, text: b.text };
  }
  return undefined;
}

function figuresFor(s: GameState): NonNullable<FrontPage['figures']> {
  const p = s.prev;
  const n = s.nation;
  const dir = (now: number, was: number | undefined, tiny: number): 1 | 0 | -1 => (was === undefined || Math.abs(now - was) < tiny ? 0 : now > was ? 1 : -1);
  return [
    { label: 'Inflation', value: `${n.inflation.toFixed(1)}%`, dir: dir(n.inflation, p['nation.inflation'], 0.15), good: false },
    { label: 'Petrol', value: `₦${Math.round(n.petrolPrice / 5) * 5}`, dir: dir(n.petrolPrice, p['nation.petrolPrice'], 4), good: false },
    { label: 'Oil', value: `$${Math.round(s.oil.price)}`, dir: dir(s.oil.price, s.oil.prev, 1.5), good: true },
    { label: 'Treasury', value: n.fiscalSpace <= 0.01 ? 'Empty' : `₦${n.fiscalSpace.toFixed(1)}tn`, dir: dir(n.fiscalSpace, p['nation.fiscalSpace'], 0.03), good: true },
    { label: 'Debt service', value: `${Math.round(n.debt)}%`, dir: dir(n.debt, p['nation.debt'], 0.3), good: false },
    { label: 'Approval', value: `${Math.round(approval(s))}%`, dir: dir(approval(s), s.approvalPrev, 0.6), good: true },
  ];
}

function page(s: GameState, outlet: OutletId, seeds: NewsSeed[], first: boolean, special?: string): FrontPage {
  const lead = seeds[0];
  const stance = stanceOf(s, outlet);
  const pct = 95 + Math.min(4, Math.floor((s.counters.refinery ?? 0) / 4));
  const tokens = (t: string) => fill(s, t).replace('{REFINERY}', String(pct)).replace('{DONE}', String(s.agenda.done.length));
  const voice = (x: NewsSeed) => tokens(outlet === 'street' ? x.street : x.chronicle);
  const mood = lead.grave ? 'grave' : (lead.valence ?? 0) > 0 ? 'good' : 'bad';
  const strapPool = STRAPS[stance];
  const strapList = (lead.valence ?? 0) > 0 ? strapPool.good : (lead.valence ?? 0) < 0 || stance === 'hostile' ? strapPool.bad : stance === 'loyal' ? strapPool.good : strapPool.flat;
  const partisan = stance === 'loyal' || stance === 'hostile';
  const head = tokens(headline(s, lead, outlet, stance));
  const comment = lead.weight > 0 ? pick(s, `c.${stance}.${mood}`, COMMENT[stance][mood], mood === 'grave' ? 24 : Infinity) : null;
  const sidebar = first ? sidebarFor(s) : undefined;
  return {
    outlet, stance, turn: s.turn, date: dateLabel(s.turn, s.startYear),
    // A reaction gets a strap that says whose it is. A plain report does not pretend to be one.
    strap: partisan && !lead.grave ? (head !== tokens(lead.chronicle) ? strapList[(s.turn + s.seed) % strapList.length] : strapPool.flat[0]) : undefined,
    lead: head, topic: lead.topic, grave: lead.grave,
    // A partisan paper leads on the reaction. The facts go underneath.
    fact: partisan && head !== tokens(lead.chronicle) ? tokens(lead.chronicle) : undefined,
    standfirst: comment ? tokens(comment) : '',
    body: lead.body ? tokens(lead.body) : undefined,
    quotes: lead.weight > 0 ? quotesFor(s, lead, stance) : undefined,
    others: seeds.slice(1, 3).map(voice),
    sidebar: sidebar ? { kicker: sidebar.kicker, text: tokens(sidebar.text) } : undefined,
    figures: first ? figuresFor(s) : undefined,
    editorial: (() => { const e = editorialFor(s, outlet); return e ? tokens(e) : undefined; })(),
    special, series: lead.series,
    owner: outlet === 'stakeholder' ? `${TYCOON_BY_ID[mediaOwner(s)].name} · ${stance === 'loyal' ? 'with you' : 'against you'}` : outlet === 'rejoinder' ? `Backs ${RIVAL_BY_ID[strongestRival(s).id].name}` : undefined,
  };
}

/** Which two papers are on the desk this month: one that reports, one that takes sides. */
function pair(s: GameState): [OutletId, OutletId] {
  const a: OutletId = s.turn % 2 === 0 ? 'chronicle' : 'street';
  const b: OutletId = Math.floor(s.turn / 2) % 2 === 0 ? 'rejoinder' : 'stakeholder';
  return [a, b];
}

export function buildPapers(s: GameState): void {
  startStories(s);
  const special = anniversary(s);
  const seeds: NewsSeed[] = [...s.news, ...simSeeds(s), ...storySeeds(s)];
  if (special) seeds.push(special);
  seeds.sort((a, b) => b.weight - a.weight);
  talkTick(s, seeds);
  if (seeds.length < 3) seeds.push(...stateSeeds(s).sort((a, b) => b.weight - a.weight));
  for (let i = 0; seeds.length < 3 && i < FILLERS.length; i++) {
    const j = (i + s.seed) % FILLERS.length;
    const f = FILLERS[j];
    if (test(s, f.when) && once(s, `fill.${j}`)) seeds.push({ chronicle: f.h[0], street: f.h[1], weight: 0, topic: 'general' });
  }
  while (seeds.length < 3) seeds.push({ chronicle: 'NO FURTHER NEWS, SAYS MINISTER OF INFORMATION', street: 'NOTHING DEY HAPPEN. FOR ONCE', weight: 0, topic: 'general' });

  const [a, b] = special ? (['chronicle', 'rejoinder'] as [OutletId, OutletId]) : pair(s);
  s.counters.refinery = (s.counters.refinery ?? 0) + 1;
  s.papers = [
    page(s, a, seeds, true, special ? 'ANNIVERSARY EDITION' : undefined),
    page(s, b, seeds, false, special ? 'ANNIVERSARY EDITION' : undefined),
  ];
  s.news = [];
}

export { OUTLETS };
