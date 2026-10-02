// Balance harness (GDD 10.6). Plays whole presidencies with scripted strategies
// and prints distributions. Usage: npm run simulate -- [runs] [--trace]

import { EVENTS, EVENT_LIST } from '../content';
import { FINANCE_CANDIDATES } from '../content/names';
import { dateLabel } from '../engine/config';
import { verdict } from '../engine/legacy';
import { TRACKS } from '../content/agenda';
import { PEOPLE } from '../content/people';
import { VENTURE_BY_ID } from '../content/ventures';
import { canDeal } from '../engine/people';
import { movesLeft } from '../engine/reduce';
import { standing } from '../engine/vars';
import { applyAction, availability, canAct, canDrawer, canLaunch, canVenture, newGame } from '../engine/reduce';
import type { Choice, Fx, GameState, ZoneId } from '../engine/types';
import { ZONES, approval, hardship } from '../engine/vars';
import { traceFor } from '../engine/view';

type Weights = Record<string, number>;
interface Bot {
  name: string;
  finance: number;
  w: Weights;
  purse: boolean;
  pcAversion: number;
  tracks?: string[];
  reforms?: 'all' | 'free' | 'grease';
  bets?: string[];
  act: (s: GameState) => [string, ZoneId?] | null;
}

const lowestZone = (s: GameState): ZoneId => [...ZONES].sort((a, b) => s.zones[a].approval - s.zones[b].approval)[0];
const campaigning = (s: GameState) => canAct(s, 'rally').ok;

const BOTS: Bot[] = [
  { name: 'Random', finance: 2, w: {}, purse: true, pcAversion: 0, act: (s) => (campaigning(s) ? ['rally', lowestZone(s)] : ['tour', lowestZone(s)]) },
  {
    name: 'Populist', finance: 1, purse: false, pcAversion: 0.4, tracks: ['power', 'food', 'security', 'people'], reforms: 'free',
    w: { approval: 3, 'bloc.street': 1.5, 'bloc.party': 0.6, 'pressure.wageGrievance': -0.3, 'nation.petrolPrice': -0.02 },
    act: (s) => (campaigning(s) ? ['rally', lowestZone(s)] : ['tour', lowestZone(s)]),
  },
  {
    name: 'Reformer', finance: 0, purse: false, pcAversion: 0.05, tracks: ['treasury', 'power', 'service', 'industry'], reforms: 'all', bets: ['diaspora', 'creative', 'cng'],
    w: {
      'nation.integrity': 1.5, 'nation.capacity': 2, 'nation.power': 1.5, 'nation.security': 1.5, 'nation.fiscalSpace': 8,
      'nation.debt': -1.2, 'bloc.establishment': 0.3, 'bloc.street': 0.25, 'bloc.party': 0.5, approval: 0.5, 'nation.inflation': -1, 'nation.petrolPrice': 0.012, 'nation.jobs': 1.5, 'bonus.fiscal': 200, 'bonus.jobs': 100,
    },
    act: (s) => (campaigning(s) ? ['rally', lowestZone(s)] : s.blocs.party < 48 ? ['convene'] : s.pc > 45 && s.pressures.scandalHeat > 35 && canAct(s, 'audit').ok ? ['audit'] : ['tour', lowestZone(s)]),
  },
  {
    name: 'Institutionalist', finance: 0, purse: false, pcAversion: 0.05, tracks: ['clean', 'service', 'security', 'people'], reforms: 'all',
    w: { 'nation.integrity': 3, 'nation.capacity': 3, 'bloc.press': 0.3, approval: 0.3, 'counter.committees': -3 },
    act: (s) => (campaigning(s) ? ['rally', lowestZone(s)] : s.pc > 30 && canAct(s, 'audit').ok ? ['audit'] : s.blocs.party < 48 ? ['convene'] : ['tour', lowestZone(s)]),
  },
  {
    name: 'Machine', finance: 1, purse: false, pcAversion: 0.2, tracks: ['power', 'security', 'food', 'works'], reforms: 'free',
    w: { 'bloc.party': 2, 'bloc.establishment': 1, 'bloc.villa': 1, pc: 1, approval: 0.5 },
    act: (s) => (campaigning(s) ? ['rally', lowestZone(s)] : ['convene']),
  },
  {
    name: 'Kleptocrat', finance: 1, purse: true, pcAversion: 0.3, tracks: ['power', 'security', 'works', 'industry'], reforms: 'grease',
    w: { purse: 4, approval: 2, 'bloc.street': 1, 'bloc.party': 1.5 },
    act: (s) => (campaigning(s) ? ['rally', lowestZone(s)] : ['tour', lowestZone(s)]),
  },
  {
    name: 'Do-nothing', finance: 2, purse: false, pcAversion: 2,
    w: { 'counter.committees': 5 },
    act: () => ['convene'],
  },
];

function score(bot: Bot, c: Choice, s: GameState): number {
  const o = c.outcomes[c.outcomes.length - 1];
  const all: Fx[] = [...(o.fx ?? []), ...(o.later ?? []).flatMap((l) => l.fx)];
  let v = 0;
  for (const [t, d] of all) v += (bot.w[t] ?? 0) * d;
  v -= (c.pc ?? 0) * bot.pcAversion;
  if (c.purse && bot.name === 'Kleptocrat') v += 12;
  if (c.naira) v += (bot.w['nation.fiscalSpace'] ?? 0) * -c.naira;
  if (o.ends) v -= 1000;
  if (bot.name === 'Do-nothing' && !c.pc && !c.naira) v += 2;
  if (bot.name === 'Random') v = Math.random() * 10;
  return v + (s.turn % 7) * 1e-6;
}

function play(bot: Bot, seed: number, log = false): GameState {
  let s = newGame({
    seed, name: 'Tester', party: 'Progressive Stakeholders Congress', partyShort: 'PSC', home: 'KN',
    background: 'governor', address: 'sir', finance: FINANCE_CANDIDATES[bot.finance].name,
    priorities: bot.tracks ?? ['power', 'security', 'food', 'works'],
  });
  let guard = 0;
  while (s.phase !== 'verdict' && guard++ < 2000) {
    if (s.phase === 'papers') { s = applyAction(s, { type: 'DISMISS_PAPER' }); continue; }
    if (s.phase === 'election') { s = applyAction(s, { type: 'ELECTION_DONE' }); continue; }
    for (const item of [s.desk.lead, ...s.desk.minors]) {
      if (!item || item.resolved) continue;
      const e = EVENTS[item.eventId];
      const options = e.choices.filter((c) => availability(s, c).ok && (bot.purse || !c.purse));
      if (!options.length) {
        if (item === s.desk.lead) throw new Error(`No available choice on ${e.id} at turn ${s.turn}`);
        continue;
      }
      const best = options.map((c) => [score(bot, c, s), c] as const).sort((a, b) => b[0] - a[0])[0][1];
      if (log && item === s.desk.lead) {
        const tr = traceFor(s, e);
        console.log(`\n[${dateLabel(s.turn)}] ${e.title}  → ${best.label}`);
        for (const t of tr) console.log(`     trace: ${t.turn <= 0 ? 'previous administration' : dateLabel(t.turn)} — ${t.headline}`);
      }
      s = applyAction(s, { type: 'CHOOSE', eventId: e.id, choiceId: best.id });
      if (s.phase === 'verdict') return s;
    }
    if (bot.purse && bot.name === 'Kleptocrat' && s.flags['drawer.open']) {
      if (canDrawer(s, 'security_vote').ok) s = applyAction(s, { type: 'DRAWER', op: 'security_vote' });
      if (s.blocs.party < 45 && canDrawer(s, 'assembly').ok) s = applyAction(s, { type: 'DRAWER', op: 'assembly' });
      if (canDrawer(s, 'campaign').ok && s.campaign.chest < 16) s = applyAction(s, { type: 'DRAWER', op: 'campaign' });
      if (s.blocs.villa < 45 && canDrawer(s, 'villa').ok) s = applyAction(s, { type: 'DRAWER', op: 'villa' });
    }
    if (bot.reforms) {
      for (const id of s.agenda.tracks) {
        const next = TRACKS.find((t) => t.id === id)!.milestones.find((m) => !s.agenda.done.includes(m.id) && !s.agenda.active.some((x) => x.id === m.id));
        if (!next) continue;
        const chk = canLaunch(s, next.id);
        if (bot.reforms === 'grease' && !chk.ok && chk.grease) { s = applyAction(s, { type: 'LAUNCH', id: next.id, grease: true }); continue; }
        if (!chk.ok) continue;
        if (bot.reforms === 'free' && next.pc > 7) continue;
        if (bot.reforms === 'grease' && next.naira > s.nation.fiscalSpace + 0.5) continue;
        if (bot.reforms === 'all' && next.naira > s.nation.fiscalSpace && s.nation.debt > 80) continue;
        if (bot.reforms === 'all' && s.pc - next.pc < 12) continue;
        s = applyAction(s, { type: 'LAUNCH', id: next.id });
      }
    }
    for (const id of bot.bets ?? []) {
      const v = VENTURE_BY_ID[id];
      if (canVenture(s, v).ok && s.nation.fiscalSpace > v.naira + 1 && s.pc > v.pc + 15) s = applyAction(s, { type: 'VENTURE', id });
    }
    if (bot.name === 'Reformer' && s.turn === 2) s = applyAction(s, { type: 'ORDER', id: 'subsidy_end' });
    if (bot.reforms === 'all' && s.nation.fiscalSpace > 4) s = applyAction(s, { type: 'ORDER', id: 'paydown' });
    const a = bot.act(s);
    if (a && canAct(s, a[0] as never).ok) s = applyAction(s, { type: 'ACT', action: a[0] as never, zone: a[1] });
    // Whatever move is left goes on people: grant a want if it is cheap, otherwise an hour of time.
    if (bot.name !== 'Do-nothing' && bot.name !== 'Random') {
      while (movesLeft(s) > 0) {
        const pool = PEOPLE.filter((p) => p.group !== 'minister').sort((x, y) => standing(s, x.id) - standing(s, y.id));
        const target = pool[0];
        const generous = bot.name === 'Machine' || bot.name === 'Kleptocrat' || bot.name === 'Populist';
        const op = generous && canDeal(s, target.id, 'grant', movesLeft(s)).ok && (target.want?.naira ?? 0) <= s.nation.fiscalSpace + 0.3 ? 'grant' : 'court';
        if (!canDeal(s, target.id, op, movesLeft(s)).ok) break;
        s = applyAction(s, { type: 'PERSON', id: target.id, op });
      }
    }
    s = applyAction(s, { type: 'END_MONTH' });
  }
  return s;
}

const args = process.argv.slice(2);
const runs = Number(args.find((a) => /^\d+$/.test(a)) ?? 200);

if (args.includes('--trace')) {
  const s = play(BOTS[2], 7, true);
  const v = verdict(s);
  console.log(`\n=== ${v.epithet} (${v.years}) ===`);
  v.narrative.forEach((p) => console.log(p));
  v.dims.forEach((d) => console.log(`  ${d.name.padEnd(26)} ${d.grade.padEnd(12)} ${d.from} → ${d.to}`));
  process.exit(0);
}

const everFired = new Set<string>();
const fireCount: Record<string, number> = {};
console.log(`${runs} presidencies per strategy\n`);
for (const bot of BOTS) {
  const endings: Record<string, number> = {};
  const epithets: Record<string, number> = {};
  const dims: Record<string, number> = {};
  let elApp = 0, elMargin = 0, elN = 0, elParty = 0;
  let months = 0, reelected = 0, quiet = 0, unique = 0, app = 0, hard = 0, personal = 0;
  for (let i = 0; i < runs; i++) {
    const s = play(bot, 1000 + i * 7919);
    const v = verdict(s);
    endings[v.ending] = (endings[v.ending] ?? 0) + 1;
    epithets[v.epithet] = (epithets[v.epithet] ?? 0) + 1;
    for (const d of v.dims) dims[d.name] = (dims[d.name] ?? 0) + d.score;
    months += Math.min(s.turn, 96);
    if (s.flags['election.won']) reelected++;
    if (s.election) { elApp += s.election.approval; elMargin += s.election.margin; elN++; }
    unique += Object.keys(s.fired).length;
    quiet += Math.min(s.turn, 96) - Object.values(s.fired).reduce((a, f) => a + f.length, 0) + s.archive.filter((a) => EVENTS[a.eventId]?.slot === 'minor').length;
    app += approval(s); hard += hardship(s); personal += s.purseTaken.personal;
    for (const [id, f] of Object.entries(s.fired)) { everFired.add(id); fireCount[id] = (fireCount[id] ?? 0) + f.length; }
  }
  const pct = (n: number) => `${Math.round((n / runs) * 100)}%`;
  console.log(`── ${bot.name}`);
  console.log(`   months in office ${(months / runs).toFixed(0)} · re-elected ${pct(reelected)} · final approval ${(app / runs).toFixed(0)}% · hardship ${(hard / runs).toFixed(0)} · kept ₦${(personal / runs).toFixed(0)}bn`);
  console.log(`   at first election: approval ${(elApp / Math.max(1, elN)).toFixed(0)}% · margin ${(elMargin / Math.max(1, elN)).toFixed(1)} pts · contested ${elN}`);
  console.log(`   endings   ${Object.entries(endings).map(([k, n]) => `${k} ${pct(n)}`).join(' · ')}`);
  console.log(`   legacy    ${Object.entries(dims).map(([k, n]) => `${k.split(' ')[0]} ${(n / runs).toFixed(1)}`).join(' · ')}`);
  console.log(`   epithets  ${Object.entries(epithets).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, n]) => `${k} ${pct(n)}`).join(' · ')}`);
  console.log(`   distinct events per presidency ${(unique / runs).toFixed(0)}\n`);
}
const never = EVENT_LIST.filter((e) => !everFired.has(e.id)).map((e) => e.id);
console.log(`Events never fired in any run: ${never.length ? never.join(', ') : 'none'}`);
const total = runs * BOTS.length;
const common = Object.entries(fireCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, n]) => `${k} ${(n / total).toFixed(1)}×`);
console.log(`Most frequent: ${common.join(' · ')}`);
