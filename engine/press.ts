import { EDITORIALS, FILLERS, SIDEBARS, STANDFIRSTS } from '../content';
import { COOL_LINES, LOYAL_LINES, PEOPLE, RIVAL_BY_ID } from '../content/people';
import { termTurnOf } from './config';
import { personView, relWord, strongestRival } from './people';
import { rand } from './rng';
import { fill } from './text';
import type { FrontPage, GameState, NewsSeed, OutletId } from './types';
import { approval, hardship, test } from './vars';

function simSeeds(s: GameState): NewsSeed[] {
  const out: NewsSeed[] = [];
  const h = s.hist;
  if (h.length >= 3) {
    const d = s.nation.inflation - h[h.length - 3].inflation;
    const v = s.nation.inflation.toFixed(1);
    if (d > 1.2) out.push({ chronicle: `INFLATION RISES TO ${v}% — STATISTICS BUREAU`, street: `${v}%: "EVERYTHING DON COST" — MARKET WOMEN`, weight: 2.2, valence: -1, body: `Prices are rising at ${v}% a year, the Statistics Bureau said, up ${d.toFixed(1)} points in two months. Food and transport led the increase.` });
    if (d < -1.2) out.push({ chronicle: `INFLATION EASES TO ${v}%`, street: `INFLATION "DOWN" TO ${v}%. HAS ANYBODY TOLD THE MARKET?`, weight: 2.2, valence: 1, body: `Inflation has slowed to ${v}%, down ${(-d).toFixed(1)} points in two months. Traders say the fall has yet to reach the stalls.` });
  }
  const app = approval(s);
  const da = app - s.approvalPrev;
  if (da < -4) out.push({ chronicle: `PRESIDENT'S APPROVAL SLIPS TO ${Math.round(app)}% — POLL`, street: `POLL: ONLY ${Math.round(app)}% STILL DEY WITH {NAME}`, weight: 2, valence: -1 });
  if (da > 4) out.push({ chronicle: `APPROVAL RECOVERS TO ${Math.round(app)}% — POLL`, street: `${Math.round(app)}%: THE STREET IS WARMING UP`, weight: 1.8, valence: 1 });
  if (s.counters.borrowed && s.counters.borrowed % 6 === 1 && s.nation.fiscalSpace === 0) {
    out.push({ chronicle: 'FG TURNS TO DOMESTIC DEBT MARKET TO FUND SHORTFALL', street: 'GOVERNMENT IS BORROWING AGAIN. FOR WHAT, EXACTLY?', weight: 1.6, valence: -1 });
  }

  // The opposition and your own people make news of their own.
  const rival = strongestRival(s);
  const prevRival = s.counters.rivalPrev ?? rival.strength;
  if (rival.strength - prevRival > 3) {
    const r = RIVAL_BY_ID[rival.id];
    out.push({ chronicle: `${r.name.toUpperCase()} GAINS GROUND IN NEW POLL`, street: `${r.name.split(' ').slice(-1)[0].toUpperCase()} DEY GATHER CROWD`, weight: 2.4, valence: -1, body: `${r.name} of the ${r.party} is now the President's strongest challenger. ${r.feeds}` });
  }
  s.counters.rivalPrev = rival.strength;
  for (const p of PEOPLE) {
    if (p.group === 'minister') continue;
    const st = s.people[p.id];
    if (!st) continue;
    const key = `mood.${p.id}`;
    const was = s.counters[key] ?? st.rel;
    if (was >= 40 && st.rel < 40) {
      out.push({ chronicle: `${p.short.toUpperCase()} BREAKS RANKS: "WE WERE NOT CARRIED ALONG"`, street: `${p.short.toUpperCase()} DON VEX FOR PRESIDENT`, weight: 2.6, valence: -1, body: `${p.name}, who ${p.title.toLowerCase()}, told reporters the Presidency had stopped consulting its own party. Aides describe the relationship as "cordial", which in Abuja it is not.` });
    }
    s.counters[key] = st.rel;
  }
  return out;
}

function anniversary(s: GameState): NewsSeed | null {
  const tt = termTurnOf(s.turn);
  if (tt !== 13 && tt !== 25 && tt !== 37) return null;
  const years = Math.floor((s.turn - 1) / 12);
  const better = s.baseline.hardship - hardship(s);
  const word = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN'][years] ?? String(years);
  const plural = years === 1 ? 'YEAR' : 'YEARS';
  const done = s.agenda.done.length;
  const body = `The administration has delivered ${done} of the reforms it promised${done === 0 ? ', which is to say none' : ''}. Cost-of-living pressure is ${better > 3 ? 'lower' : better < -3 ? 'higher' : 'about where it was'} than on inauguration day.`;
  if (better > 6) return { chronicle: `${word} ${plural} ON: THE HARD CHOICES BEGIN TO PAY`, street: `${word} ${plural} OF {NAME}: E DON BETTER SMALL, WE NO GO LIE`, weight: 6, valence: 1, body };
  if (better < -6) return { chronicle: `${word} ${plural} ON: PROMISES OUTPACE DELIVERY`, street: `${word} ${plural} OF {NAME}: "WE ARE JUST MANAGING"`, weight: 6, valence: -1, body };
  return { chronicle: `${word} ${plural} ON: A PRESIDENCY STILL FINDING ITS FEET`, street: `${word} ${plural} OF {NAME}: SAME STORY, NEW MASTHEAD`, weight: 6, valence: 0, body };
}

/** Picks from a pool without repeating until the pool is exhausted. */
function fresh(s: GameState, key: string, size: number): number {
  const used = (s.counters[key] ?? 0) % size;
  const offset = s.seed % size;
  s.counters[key] = (s.counters[key] ?? 0) + 1;
  return (used + offset) % size;
}

function quotes(s: GameState, valence: number): FrontPage['quotes'] {
  const out: NonNullable<FrontPage['quotes']> = [];
  const rival = RIVAL_BY_ID[strongestRival(s).id];
  out.push({ who: rival.name, role: rival.party, line: rival.lines[fresh(s, `q.${rival.id}`, rival.lines.length)] });
  // One of your own, who says what their loyalty permits.
  const mine = PEOPLE.filter((p) => p.group !== 'minister');
  const p = personView(s, mine[Math.floor(rand(s) * mine.length)].id);
  const warm = p.standing >= 55;
  const pool = warm ? LOYAL_LINES : COOL_LINES;
  if (warm || valence <= 0) {
    out.push({ who: p.name, role: `${p.title} · ${relWord(p.standing)}`, line: fill(s, pool[fresh(s, warm ? 'q.loyal' : 'q.cool', pool.length)]) });
  }
  return out;
}

export function buildPaper(s: GameState): void {
  const special = anniversary(s);
  const seeds = [...s.news, ...simSeeds(s)];
  if (special) seeds.push(special);
  seeds.sort((a, b) => b.weight - a.weight);

  const outlet: OutletId = special ? 'chronicle' : s.turn % 2 === 0 ? 'chronicle' : 'street';
  while (seeds.length < 3) {
    const f = FILLERS[fresh(s, 'filler', FILLERS.length)];
    seeds.push({ chronicle: f[0], street: f[1], weight: 0 });
  }

  const pct = 95 + Math.min(4, Math.floor((s.counters.refinery ?? 0) / 4));
  const tokens = (t: string) => fill(s, t).replace('{REFINERY}', String(pct)).replace('{DONE}', String(s.agenda.done.length));
  const head = (x: NewsSeed) => tokens(x[outlet]);

  const eligible = SIDEBARS.filter((b) => test(s, b.when));
  const side = eligible[fresh(s, 'sidebar', eligible.length)] ?? SIDEBARS[0];
  const stand = STANDFIRSTS[outlet];
  s.counters.refinery = (s.counters.refinery ?? 0) + 1;

  const p = s.prev;
  const n = s.nation;
  const dir = (now: number, was: number | undefined, tiny: number): 1 | 0 | -1 => (was === undefined || Math.abs(now - was) < tiny ? 0 : now > was ? 1 : -1);
  const figures: NonNullable<FrontPage['figures']> = [
    { label: 'Inflation', value: `${n.inflation.toFixed(1)}%`, dir: dir(n.inflation, p['nation.inflation'], 0.15), good: false },
    { label: 'Petrol', value: `₦${Math.round(n.petrolPrice / 5) * 5}`, dir: dir(n.petrolPrice, p['nation.petrolPrice'], 4), good: false },
    { label: 'Treasury', value: n.fiscalSpace <= 0.01 ? 'Empty' : `₦${n.fiscalSpace.toFixed(1)}tn`, dir: dir(n.fiscalSpace, p['nation.fiscalSpace'], 0.03), good: true },
    { label: 'Debt service', value: `${Math.round(n.debt)}%`, dir: dir(n.debt, p['nation.debt'], 0.3), good: false },
    { label: 'Approval', value: `${Math.round(approval(s))}%`, dir: dir(approval(s), s.approvalPrev, 0.6), good: true },
  ];

  const eds = EDITORIALS.filter((e) => test(s, e.when));
  const editorial = eds.length ? tokens(eds[fresh(s, 'editorial', eds.length)][outlet]) : undefined;

  const lead = seeds[0];
  const page: FrontPage = {
    outlet,
    turn: s.turn,
    lead: head(lead),
    standfirst: tokens(stand[fresh(s, `stand.${outlet}`, stand.length)]),
    others: [head(seeds[1]), head(seeds[2])],
    number: { label: figures[s.turn % figures.length].label, value: figures[s.turn % figures.length].value },
    sidebar: { kicker: side.kicker, text: tokens(side.text) },
    special: special ? 'ANNIVERSARY EDITION' : undefined,
    body: lead.body ? tokens(lead.body) : undefined,
    quotes: lead.weight > 0 ? quotes(s, lead.valence ?? 0) : undefined,
    figures,
    editorial,
  };
  s.paper = page;
  s.news = [];
}
