// Your governors, senators and ministers, and the opposition they may defect to.

import { MILESTONE_BY_ID, TRACK_BY_ID } from '../content/agenda';
import { PEOPLE, PERSON_BY_ID, REPLACEMENTS, RIVALS, type Person } from '../content/people';
import { VENTURES } from '../content/ventures';
import { CFG } from './config';
import type { GameState, Mark, PersonState, ZoneId } from './types';
import { canRefuse, currentWant, refuse } from './wants';
import { release, take, type Offer } from './talent';
import { addFavour, applyFx, approval, clamp, getVar, groupStanding, hardship, senate, standing } from './vars';

export { senate, standing };
export type { PersonState };

export function initPeople(s: GameState): void {
  const bg = s.president.background;
  s.people = {};
  for (const p of PEOPLE) {
    let rel = p.loyalty;
    if (bg === 'governor' && p.group === 'governor') rel += 8;
    if (bg === 'legislator' && p.group === 'senator') rel += 10;
    if (bg === 'technocrat') rel += p.group === 'minister' ? 6 : -5;
    if (bg === 'outsider') rel -= 6;
    if (p.zone && p.zone === s.president.homeZone) rel += 8;
    s.people[p.id] = { rel: clamp(rel, 5, 95), granted: false, courted: [] };
  }
  s.opposition = { alt: 38, fire: 32, strong: 30 };
  s.oppLog = [];
}

/** Ministers are judged from the day they take the brief. Called once the country's numbers are set. */
export function stampMinisters(s: GameState): void {
  for (const p of PEOPLE) {
    if (p.group !== 'minister' || !p.metric) continue;
    const st = s.people[p.id];
    if (st && st.since === undefined) { st.since = s.turn; st.base = getVar(s, p.metric[0]); st.marks = st.marks ?? []; }
  }
}

export function personView(s: GameState, id: string): Person & PersonState & { standing: number } {
  const base = PERSON_BY_ID[id];
  const st = s.people[id];
  return {
    ...base, ...st,
    name: st.name ?? base.name, short: st.short ?? base.short,
    competence: st.competence ?? base.competence, clout: st.clout ?? base.clout, bio: st.bio ?? base.bio,
    integrity: st.integrity ?? base.integrity, ambition: st.ambition ?? base.ambition,
    standing: standing(s, id),
  };
}

export function relWord(v: number): string {
  if (v >= 75) return 'Devoted';
  if (v >= 58) return 'With you';
  if (v >= 42) return 'Wavering';
  if (v >= 25) return 'Unhappy';
  return 'Against you';
}

const weighted = groupStanding;

export function governorOf(zone: ZoneId): Person | undefined {
  return PEOPLE.find((p) => p.group === 'governor' && p.zone === zone);
}

/** Points of vote share a zone's governor delivers, or withholds. */
export function governorEffect(s: GameState, zone: ZoneId): number {
  const g = governorOf(zone);
  if (!g) return 0;
  const pledged = (s.counters[`deliver.${g.id}`] ?? -99) > s.turn ? 1.5 : 0;
  return (((standing(s, g.id) - 50) / 50) * (1.5 + g.clout * 0.4) + pledged) * CFG.election.governor;
}

export function ministerFor(track: string): Person | undefined {
  return PEOPLE.find((p) => p.group === 'minister' && p.tracks?.includes(track));
}

/** How fast a reform track moves under its minister. */
export function ministerSpeed(s: GameState, track: string): number {
  const m = ministerFor(track);
  const st = m ? s.people[m.id] : undefined;
  const comp = m ? (st?.competence ?? m.competence ?? 3) : 3;
  const published = s.agenda.done.includes('v4') ? 0.05 : 0;
  const sulking = st && st.rel < 30 ? 0.9 : 1;
  return (0.82 + comp * 0.06 + published) * sulking;
}

export function strongestRival(s: GameState): { id: string; strength: number } {
  const [id, strength] = Object.entries(s.opposition).sort((a, b) => b[1] - a[1])[0] ?? ['alt', 40];
  return { id, strength };
}

export function peopleTick(s: GameState): void {
  const idle = s.nation.fiscalSpace > 3 || s.funds.buffer > 1.5;
  for (const p of PEOPLE) {
    const st = s.people[p.id];
    if (!st || st.gone) continue;
    const bloc = p.group === 'minister' ? s.blocs.villa : s.blocs.party;
    let d = (50 - st.rel) * 0.03 + (bloc - 50) * 0.03;
    // The ambitious drift away as the election nears; the principled warm to clean government.
    if (p.temper === 'ambitious' && approval(s) < 45) d -= 0.5;
    if (p.temper === 'principled') d += (s.nation.integrity - 35) * 0.02;
    if (p.temper === 'transactional' && !st.granted) d -= 0.45;
    // Governors resent money sitting in Abuja while their states are short.
    if (p.group === 'governor' && idle) d -= 0.4;
    st.rel = clamp(st.rel + d, 0, 100);
  }
  // Someone who knows what is in the drawer, and has turned, talks.
  for (const p of PEOPLE) {
    const st = s.people[p.id];
    if (!st || s.counters[`talked.${p.id}`] !== undefined) continue;
    if ((st.gone || st.rel < 22) && s.exposures.some((x) => x.kind !== 'tolerated' && x.witnesses.includes(p.id))) {
      s.counters[`talked.${p.id}`] = s.turn;
      applyFx(s, ['pressure.scandalHeat', 10]);
      for (const x of s.exposures) if (x.witnesses.includes(p.id)) x.trail = Math.min(3, x.trail + 1) as 0 | 1 | 2 | 3;
      const v = personView(s, p.id);
      s.news.push({
        chronicle: `${v.short.toUpperCase()} ALLEGES "ARRANGEMENTS" WITH THE VILLA`, street: `${v.short.toUpperCase()} DON OPEN MOUTH. E SAY E KNOW THINGS`,
        weight: 5, valence: -1, topic: 'scandal', about: p.id,
        body: `${v.name}, who ${p.title.toLowerCase()}, told reporters there were matters involving the Presidency that "the public deserves to understand". No details were given. None were needed.`,
      });
    }
  }

  // The party's mood follows its governors and senators.
  const leaders = (weighted(s, 'governor') + weighted(s, 'senator')) / 2;
  s.blocs.party = clamp(s.blocs.party + (leaders - 50) * 0.03, 0, 100);

  const h = hardship(s);
  const target: Record<string, number> = {
    alt: 34 + s.pressures.scandalHeat * 0.3 + Math.max(0, 50 - s.blocs.establishment) * 0.5 + Math.max(0, s.nation.debt - 70) * 0.3,
    fire: 24 + Math.max(0, h - 40) * 0.9 + Math.max(0, 50 - s.blocs.street) * 0.5,
    strong: 26 + Math.max(0, 50 - s.blocs.party) * 0.9 + Math.max(0, 50 - weighted(s, 'governor')) * 0.6,
  };
  for (const r of RIVALS) {
    const cap = s.flags[`rival.${r.id}.in`] ? 28 : 95;
    const now = s.opposition[r.id] ?? 30;
    s.opposition[r.id] = clamp(now + (Math.min(cap, target[r.id]) - now) * 0.1, 5, cap);
  }
}

// ---------------------------------------------------------------- dealings

export type PersonOp = 'court' | 'grant' | 'pressure' | 'refuse';

export function canDeal(s: GameState, id: string, op: PersonOp, movesLeft: number): { ok: boolean; reason?: string } {
  const p = PERSON_BY_ID[id];
  const st = s.people[id];
  if (!p || !st) return { ok: false };
  if (st.gone) return { ok: false, reason: 'Has crossed to the opposition.' };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  if (op === 'refuse') return canRefuse(s, id);
  if (op === 'grant') {
    const w = currentWant(s, id);
    if (!w) return { ok: false, reason: st.name ? 'New in the job. Has not asked for anything yet.' : 'Has nothing to ask for just now.' };
    if (w.pc && s.pc < w.pc) return { ok: false, reason: `Needs ${w.pc} political capital.` };
    if (w.naira && w.naira > s.nation.fiscalSpace && s.nation.debt >= 100) return { ok: false, reason: 'There is no money, and nobody will lend it.' };
  }
  if (op === 'pressure') {
    if (p.group === 'minister') return { ok: false };
    if (s.pc < 4) return { ok: false, reason: 'Needs 4 political capital.' };
    if (st.compliantUntil && st.compliantUntil > s.turn) return { ok: false, reason: 'Already being leaned on.' };
  }
  return { ok: true };
}

/** Returns the text of what happened. The caller counts the move and records the archive entry. */
export function deal(s: GameState, id: string, op: PersonOp): { text: string; archive: string; sealed?: boolean } {
  const p = personView(s, id);
  const st = s.people[id];
  if (op === 'court') {
    const recent = st.courted.filter((t) => s.turn - t <= 12).length;
    const gain = Math.max(3, 10 - recent * 4);
    st.rel = clamp(st.rel + gain, 0, 100);
    st.courted.push(s.turn);
    return {
      text: recent === 0
        ? `You give ${p.short} an hour, alone, with no aides. It is more than most presidents manage in a term, and it is remembered.`
        : `Another hour with ${p.short}. Welcome, but the novelty is wearing off. Attention is not the same as delivery.`,
      archive: `Spent time with ${p.name}.`,
    };
  }
  if (op === 'refuse') return { text: refuse(s, id), archive: `Refused ${p.name} what was asked.` };
  const w = op === 'grant' ? currentWant(s, id) : null;
  if (op === 'grant' && w) {
    if (w.pc) s.pc = clamp(s.pc - w.pc, 0, 100);
    if (w.naira) applyFx(s, ['nation.fiscalSpace', -w.naira]);
    for (const fx of w.fx) applyFx(s, fx);
    st.rel = clamp(st.rel + 26, 0, 100);
    st.granted = true;
    // Every grant makes the next ask bigger.
    st.grants = (st.grants ?? 0) + 1;
    st.grantedAt = s.turn;
    // Being given something settles old refusals.
    st.refusals = 0;
    st.grudge = false;
    // They owe you now, and everyone watching knows it.
    applyFx(s, ['pc', CFG.agenda.grantPc]);
    addFavour(s, id, 'owed', p.clout >= 5 ? 3 : 2, `You gave ${p.short} what was asked: ${w.text.replace(/\.$/, '').toLowerCase()}.`);
    return { text: `${w.done} ${p.short} owes you, and knows it.${st.grants > 1 ? ' The next request will be bigger; they always are.' : ''}`, archive: `Gave ${p.name} what was asked: ${w.text.replace(/\.$/, '').toLowerCase()}.` };
  }
  // pressure
  s.pc = clamp(s.pc - 4, 0, 100);
  // With anti-corruption courts that sit, the file is a real case, and it keeps them cooperative longer.
  st.compliantUntil = s.turn + (s.agenda.done.includes('c2') ? 14 : 8);
  st.rel = clamp(st.rel - 18, 0, 100);
  applyFx(s, ['nation.integrity', -1.5]);
  return {
    text: `The anti-corruption agency opens a file on ${p.short}'s accounts. Nothing is said. ${p.short} becomes extremely cooperative, and will remember exactly why.`,
    archive: `Had a file opened on ${p.name} to secure cooperation.`,
    sealed: true,
  };
}

export function replaceMinister(s: GameState, id: string, kind: keyof typeof REPLACEMENTS): { text: string; archive: string } {
  const old = personView(s, id);
  const base = PERSON_BY_ID[id];
  const r = REPLACEMENTS[kind];
  const used = new Set(Object.values(s.people).map((x) => x.name));
  const name = r.names.find((n) => !used.has(n)) ?? r.names[0];
  s.people[id] = {
    rel: r.loyalty, granted: false, courted: [], name, short: name.split(' ').slice(-1)[0],
    competence: r.competence, clout: r.clout, integrity: r.integrity, ambition: r.ambition, bio: r.bio,
    since: s.turn, base: base.metric ? getVar(s, base.metric[0]) : 0, marks: [],
  };
  applyFx(s, ['bloc.party', kind === 'party' ? 5 : -4 - old.clout]);
  applyFx(s, ['bloc.villa', -2]);
  if (kind === 'party') applyFx(s, ['nation.integrity', -1.5]);
  // The sponsor of a sacked nominee takes it personally, unless it was his own man who left.
  let sponsor = '';
  const sp = base.sponsor ? s.people[base.sponsor] : undefined;
  if (sp && old.name === base.name) {
    sp.rel = clamp(sp.rel - (kind === 'technocrat' ? 10 : 5), 0, 100);
    sponsor = ` ${PERSON_BY_ID[base.sponsor!].short}, whose nominee that was, has stopped returning calls.`;
  }
  // The advisers who brief you are the same people.
  const adviser = id === 'min_power' ? 'power' : id === 'min_defence' ? 'nsa' : null;
  if (adviser && s.chars[adviser]) {
    s.chars[adviser] = { ...s.chars[adviser], name, short: s.people[id].short ?? name, competence: r.competence, clout: r.clout };
  }
  return {
    text: (kind === 'technocrat'
      ? `${old.name} is thanked. ${name} arrives with a laptop and no entourage. The ministry's files begin to move.`
      : `${old.name} is thanked. ${name} arrives with forty aides. The governors are pleased; the permanent secretary updates her CV.`) + sponsor,
    archive: `Replaced ${old.name} with ${name} as ${old.title}.`,
  };
}

/** A named person from the talent pool takes the ministry. Their backer, if any, is pleased; the party reads the appointment by who that is. */
export function replaceMinisterWith(s: GameState, id: string, o: Offer): { text: string; archive: string } {
  const old = personView(s, id);
  const base = PERSON_BY_ID[id];
  const c = o.c;
  take(s, c.id);
  release(s, old.name);
  s.people[id] = {
    rel: clamp(40 + (c.loyalty - 3) * 8, 5, 95), granted: false, courted: [], name: c.name, short: c.short,
    competence: o.effective, clout: c.clout, integrity: c.integrity, ambition: c.ambition, bio: c.blurb,
    since: s.turn, base: base.metric ? getVar(s, base.metric[0]) : 0, marks: [],
  };
  const partyMan = c.patron.startsWith('gov_') || c.patron.startsWith('sen_');
  applyFx(s, ['bloc.party', partyMan ? 4 : -2 - old.clout]);
  applyFx(s, ['bloc.villa', -2]);
  if (partyMan && s.people[c.patron]) s.people[c.patron].rel = clamp(s.people[c.patron].rel + 6, 0, 100);
  if (s.tycoons[c.patron]) s.tycoons[c.patron].rel = clamp(s.tycoons[c.patron].rel + 6, 0, 100);
  let sponsor = '';
  const sp = base.sponsor ? s.people[base.sponsor] : undefined;
  if (sp && old.name === base.name) {
    sp.rel = clamp(sp.rel - 8, 0, 100);
    sponsor = ` ${PERSON_BY_ID[base.sponsor!].short}, whose nominee that was, has stopped returning calls.`;
  }
  const adviser = id === 'min_power' ? 'power' : id === 'min_defence' ? 'nsa' : null;
  if (adviser && s.chars[adviser]) s.chars[adviser] = { ...s.chars[adviser], name: c.name, short: c.short, competence: o.effective, clout: c.clout };
  return {
    text: `${old.name} is thanked. ${c.name}, ${o.fit ? 'from the right field' : 'from outside the field'}, is sworn in.${sponsor}`,
    archive: `Replaced ${old.name} with ${c.name} as ${old.title}.`,
  };
}

// ---------------------------------------------------------------- minister scorecards

export function addMark(s: GameState, id: string, d: number, text: string): void {
  const st = s.people[id];
  if (!st) return;
  const marks: Mark[] = st.marks ?? [];
  marks.push({ turn: s.turn, d, text });
  st.marks = marks.slice(-6);
}

export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface Scorecard {
  id: string;
  grade: Grade;
  score: number;
  /** Published scorecards exist only once the delivery unit does. */
  published: boolean;
  months: number;
  lines: { label: string; value: string; good: boolean | null }[];
  marks: Mark[];
  /** What the Chief of Staff makes of them. */
  read: string;
}

export function scorecard(s: GameState, id: string): Scorecard {
  const base = PERSON_BY_ID[id];
  const p = personView(s, id);
  const st = s.people[id];
  const tracks = base.tracks ?? [];
  const mine = (mid: string) => tracks.includes(MILESTONE_BY_ID[mid]?.track.id ?? '');
  const since = st.since ?? 1;
  const delivered = s.archive.filter((a) => a.choiceId === 'done' && a.eventId.startsWith('reform.') && a.turn >= since && mine(a.eventId.slice(7))).length;
  const defeated = s.agenda.failed.filter((f) => f.turn >= since && mine(f.id)).length;
  const running = s.agenda.active.filter((a) => mine(a.id)).length;
  const lost = VENTURES.filter((v) => v.brief === id && s.ventures.lost.includes(v.id)).length;
  const won = VENTURES.filter((v) => v.brief === id && s.ventures.won.includes(v.id)).length;
  const metric = base.metric;
  const delta = metric ? (getVar(s, metric[0]) - (st.base ?? getVar(s, metric[0]))) * metric[1] : 0;
  const marks = st.marks ?? [];
  const markSum = marks.reduce((a, m) => a + m.d, 0);
  const comp = p.competence ?? 3;
  const score = clamp(
    20 + comp * 8 + Math.min(24, delivered * 6) + won * 6 - lost * 7 - defeated * 4 + running * 2
      + clamp(delta * 0.8, -12, 15) + clamp(markSum * 3, -15, 12),
    0, 100,
  );
  const grade: Grade = score >= 72 ? 'A' : score >= 58 ? 'B' : score >= 44 ? 'C' : score >= 30 ? 'D' : 'F';
  const metricName = metric ? (TRACK_BY_ID[tracks[0]]?.goal ?? 'The brief') : 'The brief';
  const fmt = (d: number) => `${d > 0 ? '+' : ''}${Math.abs(d) >= 10 ? Math.round(d) : d.toFixed(1)}`;
  const lines: Scorecard['lines'] = [
    { label: 'Reforms delivered', value: String(delivered), good: delivered > 0 ? true : null },
    { label: 'Under way now', value: `${running}, at ${Math.round(ministerSpeed(s, tracks[0] ?? '') * 100)}% speed`, good: null },
    { label: metricName, value: `${fmt(delta)} since taking the brief`, good: Math.abs(delta) < 1 ? null : delta > 0 },
  ];
  if (won || lost) lines.push({ label: 'Big bets in the brief', value: `${won} worked, ${lost} failed`, good: lost > won ? false : won > 0 ? true : null });
  if (defeated) lines.push({ label: 'Bills lost in the Assembly', value: String(defeated), good: false });

  let read: string;
  const months = s.turn - since;
  const integ = p.integrity ?? 3;
  const amb = p.ambition ?? 0;
  if (months < 6 && !marks.length) read = comp >= 4 ? 'New to the brief. The record elsewhere is good.' : comp <= 2 ? 'New to the brief. Came with a great many delegates and very few references.' : 'New to the brief. Too early to judge.';
  else if (integ <= 2 && (st.marks ?? []).some((m) => m.text.startsWith('Audit'))) read = 'The auditors have questions about the ministry\'s accounts.';
  else if (amb >= 3 && score >= 58) read = 'Delivering, and making sure everybody knows it. Is being talked about for your job.';
  else if (score >= 72) read = 'The best you have. Leave them alone and give them what they ask for.';
  else if (comp <= 2 && p.clout >= 4) read = 'Not up to the brief. Too well connected to remove cheaply.';
  else if (st.rel < 35) read = 'Capable enough, and no longer on your side.';
  else if (score < 44) read = 'Not delivering. The ministry runs itself, slowly.';
  else read = 'Adequate. Nothing is on fire and nothing is finished.';

  return { id, grade, score, published: s.agenda.done.includes('v4'), months: s.turn - since, lines, marks: marks.slice(-4).reverse(), read };
}

/** The minister whose brief a file falls in, if any. */
export function ministerForEvent(category: string, eventId: string): string | null {
  if (category === 'infrastructure') return /grid|tariff|power/.test(eventId) ? 'min_power' : 'min_works';
  if (category === 'security') return 'min_defence';
  if (category === 'scandal') return 'min_justice';
  if (category === 'labour') return 'min_service';
  return null;
}

// ---------------------------------------------------------------- ministers' arcs

/** Whether a minister's real competence has shown: ten months in the job, or published scorecards. */
export function competenceShown(s: GameState, id: string): boolean {
  const st = s.people[id];
  return s.agenda.done.includes('v4') || s.turn - (st?.since ?? 1) >= 10 || st?.repCompetence === undefined;
}

/** The competence the President sees: the reputation until the record shows the truth. */
export function seenCompetence(s: GameState, id: string): number {
  const p = personView(s, id);
  return competenceShown(s, id) ? p.competence ?? 3 : s.people[id]?.repCompetence ?? p.competence ?? 3;
}

/** A minister's following, 0 to 5: time in the job, what they have delivered, and their own weight. */
export function following(s: GameState, id: string): number {
  const p = personView(s, id);
  const st = s.people[id];
  const months = s.turn - (st?.since ?? s.turn);
  const delivered = (st?.marks ?? []).filter((m) => m.d > 0).length;
  return clamp(Math.floor(months / 12) + Math.floor(delivered / 2) + Math.floor((p.clout ?? 2) / 2), 0, 5);
}

/** At the start: one or two ministers are not what their files say. */
export function seedMinisters(s: GameState, roll: () => number): void {
  const list = PEOPLE.filter((p) => p.group === 'minister');
  const n = 1 + (roll() < 0.5 ? 1 : 0);
  for (let i = 0; i < n; i++) {
    const p = list.splice(Math.floor(roll() * list.length), 1)[0];
    const st = s.people[p.id];
    const real = p.competence ?? 3;
    // Overrated or underrated by a point; never off the scale.
    const off = real >= 5 || (real > 1 && roll() < 0.5) ? -1 : 1;
    if (st) st.repCompetence = real + off;
  }
}

