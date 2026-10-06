// Big bets. Each names what must be true for it to work; those conditions are
// watched while it runs and judged on the day it opens.

import { ASSETS } from '../content/assets';
import { settleSite } from './places';
import { TYCOON_BY_ID } from '../content/tycoons';
import { VENTURES, VENTURE_BY_ID, type Risk, type Venture } from '../content/ventures';
import { record } from './archive';
import { CFG } from './config';
import { describe, diff, snapshot } from './effects';
import { addMark } from './people';
import { rand } from './rng';
import { buildCost, buildSpeed, payBuild } from './treasury';
import type { GameState } from './types';
import { applyFx, clamp, test } from './vars';

export interface RiskView { risk: Risk; ok: boolean }

export function risksOf(s: GameState, v: Venture): RiskView[] {
  return v.risks.map((risk) => ({ risk, ok: test(s, risk.ok) }));
}

export function ventureOdds(s: GameState, v: Venture): number {
  // A missing cost-and-speed factor mostly makes it late and dear (ventureTick); only half of it is risk to the opening.
  const lost = risksOf(s, v).reduce((a, r) => a + (r.ok ? 0 : r.risk.cost * (r.risk.kind === 'cost' ? 0.5 : 1)), 0);
  const rescued = s.bets[v.id]?.rescued ? 0.12 : 0;
  // A second attempt knows exactly what went wrong the first time.
  const learned = s.bets[v.id]?.revived ? REVIVE_LEARNED : 0;
  // Appraised before it was built.
  const appraised = (s.agenda.done.includes('w8') ? 0.08 : 0) + (s.bets[v.id]?.reviewed ? 0.05 : 0);
  return clamp(v.top - lost + rescued + learned + appraised, 0.05, 0.95);
}

/** A businessman who is with you pays part of it. */
export function partnerIn(s: GameState, v: Venture): boolean {
  if (!v.partner) return false;
  const st = s.bets[v.id];
  if (st && st.partner !== undefined) return st.partner;
  return (s.tycoons[v.partner]?.rel ?? 0) >= 60;
}

export function ventureNaira(s: GameState, v: Venture): number {
  return Math.round(v.naira * (partnerIn(s, v) ? 0.6 : 1) * 20) / 20;
}

export type VentureStatus = 'won' | 'lost' | 'active' | 'open';

export function ventureStatus(s: GameState, id: string): VentureStatus {
  if (s.ventures.won.includes(id)) return 'won';
  if (s.ventures.lost.includes(id)) return 'lost';
  if (s.ventures.active.some((a) => a.id === id)) return 'active';
  return 'open';
}

/** A big bet appears on the list only when the situation that creates it exists. */
export function ventureVisible(s: GameState, v: Venture): boolean {
  return ventureStatus(s, v.id) !== 'open' || test(s, v.when);
}

export function canVenture(s: GameState, v: Venture): { ok: boolean; reason?: string } {
  if (s.assets?.some((a) => a.id === v.id)) return { ok: false, reason: 'This operating asset already exists. Expand its existing site instead.' };
  const st = ventureStatus(s, v.id);
  if (st !== 'open') return { ok: false };
  if (v.when && !test(s, v.when)) return { ok: false, reason: 'Not available.' };
  if (s.ventures.active.length >= CFG.agenda.ventureSlots) return { ok: false, reason: `You can run ${CFG.agenda.ventureSlots} big bets at a time.` };
  if (s.pc < v.pc) return { ok: false, reason: `Needs ${v.pc} political capital.` };
  const cost = buildCost(s, ventureNaira(s, v), !!v.infra).treasury;
  if (cost > s.nation.fiscalSpace && s.nation.debt >= CFG.economy.noLendingAbove) {
    return { ok: false, reason: 'There is no money, and nobody will lend it.' };
  }
  return { ok: true };
}

export function launchVenture(s: GameState, id: string, site?: string): void {
  const v = VENTURE_BY_ID[id];
  if (!v || !canVenture(s, v).ok) return;
  const where = ASSETS[id] ? (site && ASSETS[id].sites.includes(site) ? site : ASSETS[id].sites[0]) : undefined;
  if (where) (s.sites ??= {})[id] = where;
  const before = snapshot(s);
  const withPartner = partnerIn(s, v);
  const naira = ventureNaira(s, v);
  s.pc = clamp(s.pc - v.pc, 0, 100);
  const entry = record(s, `venture.${id}`, 'launch', 'action', `Staked the government on: ${v.name}.`, 2);
  payBuild(s, naira, !!v.infra, entry.touches);
  for (const fx of v.start ?? []) applyFx(s, fx, entry.touches);
  s.bets[id] = { warned: [], partner: withPartner };
  s.ventures.active.push({ id, progress: 0 });
  if (withPartner && v.partner && s.tycoons[v.partner]) s.tycoons[v.partner].rel = clamp(s.tycoons[v.partner].rel + 4, 0, 100);
  s.news.push({ chronicle: `PRESIDENT ANNOUNCES: ${v.name.toUpperCase()}`, street: `PRESIDENT WAN TRY AM: ${v.name.toUpperCase()}`, weight: 4, valence: 0, topic: 'bet', about: v.brief, body: v.blurb });
  const unmet = risksOf(s, v).filter((r) => !r.ok);
  const partnerLine = withPartner && v.partner ? ` ${TYCOON_BY_ID[v.partner].short} is putting in 40% of the money.` : '';
  s.lastAction = {
    text: `${v.name}: announced.${partnerLine} ${unmet.length ? `${unmet.length} of the things it depends on ${unmet.length === 1 ? 'is' : 'are'} not in place. You have about ${v.months} months to put that right.` : `Everything it depends on is in place. What is left is luck, and about ${v.months} months.`}`,
    changes: diff(before, snapshot(s)),
  };
}

// ---------------------------------------------------------------- reviving a failure

/** A failed bet leaves a half-built site and a known cause. Once the dust has settled, it can be tried once more. */
export const REVIVE_WAIT = 6;
export const REVIVE_LEARNED = 0.06;
/** How far along a revived bet starts: the site, the designs and some of the equipment survive. */
const REVIVE_START = 40;

export function reviveCost(s: GameState, v: Venture): { pc: number; naira: number; months: number } {
  return { pc: v.pc + 4, naira: Math.round(ventureNaira(s, v) * 0.6 * 20) / 20, months: Math.round(v.months * (1 - REVIVE_START / 100)) };
}

export function canRevive(s: GameState, id: string): { ok: boolean; reason?: string } {
  const v = VENTURE_BY_ID[id];
  if (!v || ventureStatus(s, id) !== 'lost') return { ok: false };
  if (s.bets[id]?.revived) return { ok: false, reason: 'It has failed twice. Nobody will put money into it a third time.' };
  const since = s.turn - (s.counters[`lost.${id}`] ?? -99);
  if (since < REVIVE_WAIT) return { ok: false, reason: `It failed ${since === 0 ? 'this month' : `${since} month${since === 1 ? '' : 's'} ago`}. Nobody will touch it for another ${REVIVE_WAIT - since}.` };
  if (s.ventures.active.length >= CFG.agenda.ventureSlots) return { ok: false, reason: `You can run ${CFG.agenda.ventureSlots} big bets at a time.` };
  const c = reviveCost(s, v);
  if (s.pc < c.pc) return { ok: false, reason: `Needs ${c.pc} political capital: you are asking people to believe in it again.` };
  if (buildCost(s, c.naira, !!v.infra).treasury > s.nation.fiscalSpace && s.nation.debt >= CFG.economy.noLendingAbove) return { ok: false, reason: 'There is no money, and nobody will lend it.' };
  return { ok: true };
}

export function revive(s: GameState, id: string): void {
  const v = VENTURE_BY_ID[id];
  if (!v || !canRevive(s, id).ok) return;
  const c = reviveCost(s, v);
  const before = snapshot(s);
  const cause = s.ventures.causes[id];
  const entry = record(s, `venture.${id}`, 'revive', 'action', `Revived a failed bet: ${v.name}.`, 2);
  s.pc = clamp(s.pc - c.pc, 0, 100);
  payBuild(s, c.naira, !!v.infra, entry.touches);
  s.ventures.lost = s.ventures.lost.filter((x) => x !== id);
  delete s.ventures.causes[id];
  s.ventures.active.push({ id, progress: REVIVE_START });
  s.bets[id] = { warned: [], partner: partnerIn(s, v), revived: true };
  // The abandoned site becomes a building site again.
  const state = s.sites?.[id];
  const label = `The abandoned site of ${v.name.toLowerCase()}`;
  if (state) s.placed = (s.placed ?? []).filter((p) => !(p.kind === 'abandoned' && p.state === state && p.label === label));
  s.news.push({ chronicle: `${v.name.toUpperCase()}: WORK RESUMES ON FAILED PROJECT`, street: `DEM WAN TRY ${v.name.toUpperCase()} AGAIN. THIS TIME NA THIS TIME?`, weight: 4, valence: 0, topic: 'bet', about: v.brief, body: `${v.blurb} The first attempt failed${cause ? `: ${cause.toLowerCase()}` : ''}.` });
  const unmet = risksOf(s, v).filter((r) => !r.ok);
  const sameCause = cause && unmet.some((r) => r.risk.label === cause);
  s.lastAction = {
    text: `${v.name}: revived, ${REVIVE_START}% of the way there. What was learned is worth ${Math.round(REVIVE_LEARNED * 100)} points of the odds. ${sameCause ? `What sank it last time is still not in place: ${cause}.` : cause && cause !== 'Bad luck' ? `What sank it last time is now in place.` : ''} ${unmet.length ? `${unmet.length} of the things it depends on ${unmet.length === 1 ? 'is' : 'are'} not in place.` : 'Everything it depends on is in place.'} If it fails again, it stays failed.`.replace(/  +/g, ' '),
    changes: diff(before, snapshot(s)),
  };
}

// ---------------------------------------------------------------- intervening

export function rescueCost(v: Venture): number {
  return Math.max(0.15, Math.round(v.naira * 0.25 * 20) / 20);
}

export function canRescue(s: GameState, id: string): { ok: boolean; reason?: string } {
  const v = VENTURE_BY_ID[id];
  if (!v || ventureStatus(s, id) !== 'active') return { ok: false };
  if (s.bets[id]?.rescued) return { ok: false, reason: 'Already reinforced once.' };
  if (s.pc < 3) return { ok: false, reason: 'Needs 3 political capital.' };
  if (rescueCost(v) > s.nation.fiscalSpace && s.nation.debt >= CFG.economy.noLendingAbove) return { ok: false, reason: 'There is no money, and nobody will lend it.' };
  return { ok: true };
}

/** More money and better people: improves the odds whatever is wrong. */
export function rescue(s: GameState, id: string): string {
  const v = VENTURE_BY_ID[id];
  s.pc = clamp(s.pc - 3, 0, 100);
  applyFx(s, ['nation.fiscalSpace', -rescueCost(v)]);
  (s.bets[id] ??= { warned: [] }).rescued = true;
  return `A task team from the Villa moves on to the site of "${v.name}" with money and authority. It does not fix what is wrong. It makes it matter less: the odds improve by 12 points.`;
}

export function canDelay(s: GameState, id: string): { ok: boolean; reason?: string } {
  if (ventureStatus(s, id) !== 'active') return { ok: false };
  if (s.bets[id]?.delayed) return { ok: false, reason: 'Already postponed once. A second delay would be a cancellation.' };
  return { ok: true };
}

/** Buys time to put the conditions right. */
export function delay(s: GameState, id: string): string {
  const v = VENTURE_BY_ID[id];
  const a = s.ventures.active.find((x) => x.id === id);
  if (a) a.progress = Math.max(0, a.progress - 30);
  (s.bets[id] ??= { warned: [] }).delayed = s.turn;
  applyFx(s, ['approval', -1]);
  applyFx(s, ['bloc.press', -2]);
  return `The opening of "${v.name}" is put back by about ${Math.round(v.months * 0.3)} months. The Minister of Information describes this as "a strategic realignment of timelines".`;
}

// ---------------------------------------------------------------- the month

/** The active bet with a condition unmet, far enough along to matter. */
export function shakyBet(s: GameState): string | null {
  for (const a of s.ventures.active) {
    const v = VENTURE_BY_ID[a.id];
    if (!v || a.progress < 35 || a.progress > 90) continue;
    if (s.counters[`trouble.${a.id}`] !== undefined) continue;
    if (risksOf(s, v).some((r) => !r.ok)) return a.id;
  }
  return null;
}

export function worstRisk(s: GameState, v: Venture): Risk | null {
  const unmet = risksOf(s, v).filter((r) => !r.ok).sort((a, b) => b.risk.cost - a.risk.cost);
  return unmet[0]?.risk ?? null;
}

export function ventureTick(s: GameState): void {
  const still: GameState['ventures']['active'] = [];
  for (const a of s.ventures.active) {
    const v = VENTURE_BY_ID[a.id];
    if (!v) continue;
    // Each missing cost-and-speed factor slows the work and adds an overrun every month it stays missing.
    const lagging = costShortfalls(s, v);
    const speed = (0.8 + s.nation.capacity / 200) * (v.infra ? buildSpeed(s) : 1) * Math.pow(SLOW_PER_FACTOR, lagging.length);
    a.progress += (100 / v.months) * speed;
    const st = (s.bets[a.id] ??= { warned: [] });
    if (lagging.length && v.naira > 0) {
      const over = Math.round((v.naira / v.months) * OVERRUN_PER_FACTOR * lagging.length * 1000) / 1000;
      payBuild(s, over, !!v.infra);
      s.counters[`overrun.${v.id}`] = Math.round(((s.counters[`overrun.${v.id}`] ?? 0) + over) * 1000) / 1000;
    }

    if (a.progress < 100) {
      // Part-way through, the site reports what is going wrong while there is time to fix it.
      if (a.progress >= 35) {
        for (const r of risksOf(s, v)) {
          if (r.ok || st.warned.includes(r.risk.id)) continue;
          st.warned.push(r.risk.id);
          s.report.push({
            kind: 'failure', title: `Warning from the site: ${v.name}`, cause: `Not in place: ${r.risk.label}`,
            text: `${r.risk.warn} What you can do: ${r.risk.fix} The odds are now ${Math.round(ventureOdds(s, v) * 100)}%.`, changes: [],
          });
        }
      }
      still.push(a);
      continue;
    }

    // The day it opens (plan 12). It works in full; or it misses its opening because of
    // something that can still be put right, once; or part of it works; or it fails.
    const odds = ventureOdds(s, v);
    const roll = rand(s);
    const fixable = worstRisk(s, v);
    const outcome = resolveBet(odds, roll, !!fixable && !st.slipped);
    if (outcome === 'slip') {
      a.progress = SLIP_TO;
      st.slipped = s.turn;
      const months = Math.max(1, Math.round((100 - SLIP_TO) / ((100 / v.months) * speed)));
      record(s, `venture.${v.id}`, 'slip', 'action', `Missed its opening: ${v.name}.`, 2);
      s.news.push({ chronicle: `${v.name.toUpperCase()}: OPENING POSTPONED`, street: `${v.name.toUpperCase()}: DEM SHIFT THE DATE`, weight: 4, valence: -1, topic: 'bet', about: v.brief, body: fixable!.warn });
      s.report.push({ kind: 'failure', title: `It missed its opening: ${v.name}`, cause: `Not in place: ${fixable!.label}`,
        text: `${fixable!.warn} It has not failed yet. There are about ${months} more months, once, to put it right: ${fixable!.fix} The odds are ${Math.round(odds * 100)}%.`, changes: [] });
      still.push(a);
      continue;
    }
    const won = outcome !== 'failed';
    const scale = outcome === 'partial' ? PARTIAL_SCALE : 1;
    const before = snapshot(s);
    const cause = outcome === 'full' ? null : fixable;
    const rec = record(s, `venture.${v.id}`, won ? (scale < 1 ? 'partial' : 'won') : 'lost', 'action', `${won ? (scale < 1 ? 'Partly delivered' : 'Succeeded') : 'Failed'}: ${v.name}.`, 3);
    const fx: typeof v.win = won ? v.win.map(([t, x]) => [t, Math.round(x * scale * 1000) / 1000]) : v.lose;
    for (const f of fx) applyFx(s, f, rec.touches);
    (won ? s.ventures.won : s.ventures.lost).push(v.id);
    if (scale < 1) st.scale = scale;
    if (won) for (const [k, x] of Object.entries(v.winFlags ?? {})) s.flags[k] = x;
    if (!won) s.counters[`lost.${v.id}`] = s.turn;
    settleSite(s, v.id, won, scale);
    if (won) applyFx(s, ['pc', Math.round(CFG.agenda.ventureWinPc * scale)]);
    if (v.brief) addMark(s, v.brief, won ? (scale < 1 ? 1 : 2) : -2, `${won ? (scale < 1 ? 'Partly delivered' : 'Delivered') : 'Presided over the failure of'}: ${v.name}`);
    if (v.partner && st.partner && s.tycoons[v.partner]) s.tycoons[v.partner].rel = clamp(s.tycoons[v.partner].rel + (won ? (scale < 1 ? 2 : 6) : -10), 0, 100);

    let why: string;
    if (won && scale < 1) {
      const finishLine = ASSETS[v.id] ? ' The rest can be finished later, from the asset\'s card.' : ' What was delivered stays delivered.';
      why = `Only ${Math.round(scale * 100)}% of it works${cause ? `: ${cause.fail}` : ''}. It delivers that share of what it promised.${finishLine}`;
    } else if (won) {
      const carried = risksOf(s, v).filter((r) => !r.ok);
      why = carried.length ? `It worked in spite of ${carried.length === 1 ? 'one thing' : `${carried.length} things`} not being in place. You were lucky at ${Math.round(odds * 100)}%.` : 'Everything it depended on was in place.';
    } else if (cause) {
      why = `Why it failed: ${cause.fail} What would have saved it: ${cause.fix}${st.revived ? ' It has now failed twice.' : ` The site stays. Once that is put right, it can be revived in ${REVIVE_WAIT} months.`}`;
      s.ventures.causes[v.id] = cause.label;
    } else {
      why = `Why it failed: ${v.luck} Nothing you did caused this. Everything it depended on was in place, and the odds were ${Math.round(odds * 100)}%.${st.revived ? '' : ` It can be tried again in ${REVIVE_WAIT} months.`}`;
      s.ventures.causes[v.id] = 'Bad luck';
    }
    const news: [string, string] = won ? (scale < 1 ? [`${v.name.toUpperCase()} OPENS, PARTLY`, `${v.name.toUpperCase()}: SOME DEY WORK, SOME NO DEY`] : v.winNews) : v.loseNews;
    s.news.push({
      chronicle: news[0], street: news[1], weight: 7, valence: won ? 1 : -1, topic: 'bet', about: v.brief,
      body: `${won ? v.winText : v.loseText}${cause ? ` ${cause.fail}` : ''}`,
    });
    s.report.push({
      kind: won ? 'reform' : 'failure', title: `${won ? (scale < 1 ? 'It partly worked' : 'It worked') : 'It failed'}: ${v.name}`,
      cause: won && scale === 1 ? undefined : cause ? `Not in place: ${cause.label}` : won ? undefined : 'Bad luck',
      text: `${won ? v.winText : v.loseText} ${why}${(s.counters[`overrun.${v.id}`] ?? 0) > 0.0005 ? ` It ran ₦${Math.round((s.counters[`overrun.${v.id}`] ?? 0) * 1000)}bn over budget, for want of what it needed to be built cheaply and on time.` : ''}`,
      changes: [...diff(before, snapshot(s)), ...describe(fx.filter((f) => f[0].startsWith('bonus.')))],
    });
  }
  s.ventures.active = still;
}

/** How much each missing cost-and-speed factor slows the work, and what it adds to the bill each month (a share of the monthly budget). */
export const SLOW_PER_FACTOR = 0.88;
export const OVERRUN_PER_FACTOR = 0.12;

/** The cost-and-speed factors not in place: they make it late and dear rather than impossible. */
export function costShortfalls(s: GameState, v: Venture): Risk[] {
  return risksOf(s, v).filter((r) => !r.ok && r.risk.kind === 'cost').map((r) => r.risk);
}

/** Where a bet that missed its opening is put back to, and how much of the design a partial delivery runs. */
export const SLIP_TO = 80;
export const PARTIAL_SCALE = 0.5;

/** How the opening day goes, from the odds and the draw. Of what would once have been failure,
 *  a fixable cause first costs time (once), then some of it may work; the rest fails. */
export function resolveBet(odds: number, roll: number, canSlip: boolean): 'full' | 'slip' | 'partial' | 'failed' {
  if (roll < odds) return 'full';
  const miss = 1 - odds;
  if (canSlip && roll < odds + miss * 0.3) return 'slip';
  if (roll < odds + miss * 0.55) return 'partial';
  return 'failed';
}

/** Bets that a newly delivered reform has just made possible. */
export function openedBy(s: GameState, milestoneId: string): Venture[] {
  return VENTURES.filter((v) => {
    if (!v.when || !('v' in v.when) || v.when.v[0] !== `agenda.${milestoneId}`) return false;
    return ventureStatus(s, v.id) === 'open';
  });
}
