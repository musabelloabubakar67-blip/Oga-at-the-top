// The cast acts on its own. Each named politician wants things, fears someone, and
// has leverage; each month the game asks what one or two of them do about it,
// given the state of the world. They call, demand, back your rival, leak, court
// the Vice President, offer help, or make deals with each other that you hear
// about later. Nothing here waits for the President.

import { PEOPLE, PERSON_BY_ID } from '../content/people';
import { who } from './favours';
import { strongestRival } from './people';
import { rivalOf } from './rivals';
import { openPledges } from './promises';
import { rand } from './rng';
import type { GameState } from './types';
import { applyFx, clamp, standing } from './vars';
import { currentWant } from './wants';

/** Whom each of them fears gaining the President's ear. Authored; everyone else fears nobody in particular. */
const FEARS: Record<string, string> = {
  gov_nw: 'gov_ne', gov_ne: 'gov_nw', gov_nc: 'sen_approp', gov_sw: 'min_service', gov_se: 'gov_ss', gov_ss: 'gov_se',
  sen_pres: 'sen_lead', sen_lead: 'sen_pres', sen_approp: 'gov_nc', sen_rebel: 'min_works', min_works: 'sen_rebel', min_service: 'gov_sw',
};

/** What they can bring to bear, in a phrase. */
export function leverage(id: string): string {
  const p = PERSON_BY_ID[id];
  if (!p) return '';
  if (p.group === 'governor') return `${p.clout + 3} senators and the ${p.zone} delegates`;
  if (p.group === 'senator') return p.clout >= 5 ? 'the Senate floor and its timetable' : 'a bloc of votes on the floor';
  return 'a ministry, its contracts and its leaks';
}

export const fears = (id: string) => FEARS[id];

const key = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
export const tie = (s: GameState, a: string, b: string) => s.ties?.[key(a, b)] ?? 50;
const shift = (s: GameState, a: string, b: string, d: number) => { (s.ties ??= {})[key(a, b)] = clamp(tie(s, a, b) + d, 0, 100); };

type Act = 'call' | 'undermine' | 'rival' | 'leak' | 'vp' | 'offer' | 'pact' | 'protest';
interface Move { who: string; act: Act; w: number; other?: string }

const live = (s: GameState, id: string) => !!s.people[id] && !s.people[id].gone;
const temper = (id: string) => PERSON_BY_ID[id]?.temper ?? 'loyal';
const grudge = (s: GameState, id: string) => (s.wronged ?? []).some((w) => w.who === id && w.until > s.turn);

/** Everything each of them might do this month, weighted by how much the world pushes them to it. */
function options(s: GameState): Move[] {
  const out: Move[] = [];
  // One call waits at a time: the phone reads whoever is calling from a single flag.
  const calling = s.queue.some((q) => q.event === 'cast.call');
  for (const p of PEOPLE) {
    const id = p.id;
    if (!live(s, id) || s.turn - (s.counters[`cast.${id}`] ?? -99) < 5) continue;
    const r = standing(s, id);
    const t = temper(id);
    const clout = p.clout;
    // A call: they want something and think you might give it.
    if (!calling && currentWant(s, id) && r >= 35 && r < 80 && !openPledges(s).some((x) => x.to === id) && p.group !== 'minister') out.push({ who: id, act: 'call', w: 2 + (t === 'transactional' ? 2 : 0) });
    // The one they fear is closer to you than they are.
    const f = FEARS[id];
    if (f && live(s, f) && standing(s, f) > r + 10) out.push({ who: id, act: 'undermine', other: f, w: 3 + (standing(s, f) - r) / 10 });
    // Cold, and with something to gain from someone else winning.
    if (r < 35 && t !== 'loyal' && p.group !== 'minister') out.push({ who: id, act: 'rival', w: 3 + (grudge(s, id) ? 3 : 0) + clout * 0.5 });
    // Inside the government and unhappy.
    if (r < 40 && (p.group === 'minister' || p.group === 'senator')) out.push({ who: id, act: 'leak', w: 2 + (grudge(s, id) ? 2 : 0) });
    // The Vice President is the other door into the Villa.
    if (s.vp && r < 50 && (t === 'ambitious' || t === 'transactional') && (s.vp.rel ?? 50) < 55 && tie(s, id, 'vp') < 70) out.push({ who: id, act: 'vp', w: 2 + (s.vp.ambition ?? 0) });
    // Warm, and wants to be seen to be useful.
    if (r >= 72 && t !== 'principled') out.push({ who: id, act: 'offer', w: 2 + clout * 0.3 });
    // The principled say so out loud when the government stops being clean.
    if (t === 'principled' && (s.pressures.scandalHeat > 55 || s.nation.integrity < 28)) out.push({ who: id, act: 'protest', w: 3 });
    // Two cold people find each other.
    if (r < 50 && t !== 'loyal') {
      const partner = PEOPLE.filter((q) => q.id !== id && live(s, q.id) && standing(s, q.id) < 50 && temper(q.id) !== 'loyal' && tie(s, id, q.id) < 75)
        .sort((a, b) => standing(s, a.id) - standing(s, b.id))[0];
      if (partner) out.push({ who: id, act: 'pact', other: partner.id, w: 0.8 + clout * 0.2 });
    }
  }
  return out;
}

function log(s: GameState, id: string, act: Act, text: string, title: string, other?: string): void {
  (s.castLog ??= []).push({ turn: s.turn, who: id, act, text, other });
  if (s.castLog.length > 40) s.castLog.shift();
  s.counters[`cast.${id}`] = s.turn;
  s.report.push({ kind: act === 'offer' ? 'reform' : 'consequence', title, cause: `${who(s, id).name}, on their own initiative`, text, changes: [] });
}

function act(s: GameState, m: Move): void {
  const id = m.who;
  const p = PERSON_BY_ID[id];
  const me = who(s, id);
  const k = p.clout / 4;
  switch (m.act) {
    case 'call': {
      s.flags['cast.caller'] = id;
      s.queue.push({ event: 'cast.call', due: s.turn + 1 });
      s.counters[`cast.${id}`] = s.turn;
      return;
    }
    case 'undermine': {
      const o = who(s, m.other!);
      shift(s, id, m.other!, -15);
      if (s.people[m.other!]) s.people[m.other!].rel = clamp(s.people[m.other!].rel - 3 * k, 0, 100);
      s.news.push({ chronicle: `${me.short.toUpperCase()} ACCUSES ${o.short.toUpperCase()} OF "MISLEADING THE PRESIDENT"`, street: `${me.short.toUpperCase()} AND ${o.short.toUpperCase()} DON START`, weight: 2.6, valence: -1, topic: 'people', about: id, body: `${me.name} told reporters that ${o.name} has the President's ear "for now". Aides to ${o.short} said they would not dignify it.` });
      log(s, id, 'undermine', `${me.short} thinks ${o.short} is getting too close to you, and has started saying so in public. ${me.short} has ${leverage(id)}.`, `${me.short} is briefing against ${o.short}`, m.other);
      return;
    }
    case 'rival': {
      const r = { ...strongestRival(s), ...rivalOf(s, strongestRival(s).id) };
      s.opposition[r.id] = clamp((s.opposition[r.id] ?? 40) + 1.2 * k, 0, 100);
      if (p.group === 'governor') applyFx(s, ['bloc.party', -1 * k]);
      s.news.push({ chronicle: `${me.short.toUpperCase()} SEEN WITH ${r.short.toUpperCase()} IN ${p.zone ?? 'ABUJA'}`, street: `${me.short.toUpperCase()} DON DEY WAKA WITH OPPOSITION`, weight: 3, valence: -1, topic: 'politics', about: id, body: `${me.name} described the meeting with ${r.name} as "social". It lasted four hours.` });
      log(s, id, 'rival', `${me.short} has given up waiting for you and is talking to ${r.name}. With ${leverage(id)}, that is worth something to them.`, `${me.short} is talking to your rival`);
      return;
    }
    case 'leak': {
      applyFx(s, ['pressure.scandalHeat', 2 + k]);
      applyFx(s, ['bloc.press', -2]);
      s.news.push({ chronicle: 'LEAKED MEMO SHOWS DIVISIONS AT THE TOP OF GOVERNMENT', street: 'INSIDE GIST: DEM NO GREE THEMSELF FOR VILLA', weight: 3.2, valence: -1, topic: 'politics', body: 'The memo, dated last month, records an argument nobody in government will confirm took place.' });
      log(s, id, 'leak', `A memo from inside the government is in the papers. Nobody has said where it came from; everyone in the Villa thinks it was ${me.short}.`, 'A leak from inside the government');
      return;
    }
    case 'vp': {
      shift(s, id, 'vp', 15);
      if (s.vp) s.vp.rel = clamp((s.vp.rel ?? 50) - 2, 0, 100);
      s.news.push({ chronicle: `${me.short.toUpperCase()} AND THE VICE PRESIDENT DINE IN ABUJA`, street: `${me.short.toUpperCase()} DEY VISIT VP HOUSE`, weight: 2.4, valence: -1, topic: 'politics', about: id, body: `Guests at the dinner included two party elders and a television proprietor.` });
      log(s, id, 'vp', `${me.short} has started calling the Vice President instead of you. The Vice President is taking the calls.`, `${me.short} is courting the Vice President`, 'vp');
      return;
    }
    case 'offer': {
      const id2 = (s.favours.reduce((a, f) => Math.max(a, f.id), 0) || 0) + 1;
      s.favours.push({ id: id2, who: id, dir: 'owed', size: 1, why: p.group === 'senator' ? 'Offered to deliver votes on the next bill.' : p.group === 'governor' ? 'Offered to deliver the delegates when it matters.' : 'Offered to take a hard decision off your hands.', turn: s.turn });
      log(s, id, 'offer', `${me.short} has come to offer help, unasked, and wants it known that it was unasked. You can call it in later.`, `${me.short} offers help`);
      return;
    }
    case 'protest': {
      applyFx(s, ['bloc.press', -2]);
      applyFx(s, ['nation.integrity', 0.5]);
      s.news.push({ chronicle: `${me.short.toUpperCase()}: "THIS IS NOT WHAT WE WERE ELECTED TO DO"`, street: `${me.short.toUpperCase()} TALK TRUE FOR PUBLIC`, weight: 3, valence: -1, topic: 'scandal', about: id, body: `${me.name} said the government had "lost its way on integrity" and would not say more.` });
      log(s, id, 'protest', `${me.short} has said in public what others say in private about how clean the government is.`, `${me.short} criticises the government in public`);
      return;
    }
    case 'pact': {
      const o = who(s, m.other!);
      shift(s, id, m.other!, 20);
      const bloc = tie(s, id, m.other!) >= 70;
      if (bloc) applyFx(s, ['bloc.party', -1]);
      // The Vice President hears of any deal that might be about the succession.
      if (s.vp && (PERSON_BY_ID[m.other!]?.clout ?? 0) + p.clout >= 8) s.vp.rel = clamp((s.vp.rel ?? 50) - 3, 0, 100);
      s.news.push({ chronicle: `${me.short.toUpperCase()} AND ${o.short.toUpperCase()} IN "PRIVATE MEETING" — AIDES`, street: `${me.short.toUpperCase()} AND ${o.short.toUpperCase()} DON JOIN HAND?`, weight: 2.4, valence: -1, topic: 'politics', about: id, body: 'Neither side would say what was discussed. Both sides said it was not about the President.' });
      log(s, id, 'pact', `${me.short} and ${o.short} have been meeting. Neither is happy with you${bloc ? ', and together they now move votes in the party' : ''}.`, `${me.short} and ${o.short} are making a deal`, m.other);
      return;
    }
  }
}

/** Every month: at most two of the cast act. */
export function agencyTick(s: GameState): void {
  const opts = options(s);
  const done = new Set<string>();
  for (let i = 0; i < 2 && opts.length; i++) {
    const calling = s.queue.some((q) => q.event === 'cast.call');
    const pool = opts.filter((m) => !done.has(m.who) && !(calling && m.act === 'call'));
    if (!pool.length) break;
    // Fewer moves in quiet months: the chance of anyone acting rises with how much pushes them.
    const total = pool.reduce((a, m) => a + m.w, 0);
    if (rand(s) > Math.min(0.6, total / 30)) break;
    let x = rand(s) * total;
    const pick = pool.find((m) => (x -= m.w) <= 0) ?? pool[0];
    done.add(pick.who);
    act(s, pick);
  }
}

/** What someone did most recently on their own, for their card. */
export function lastMove(s: GameState, id: string): { turn: number; text: string } | null {
  const e = [...(s.castLog ?? [])].reverse().find((x) => x.who === id);
  return e ? { turn: e.turn, text: e.text } : null;
}
