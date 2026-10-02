// The opposition acts. Each rival has moves of their own, taken when the
// President gives them the opening, and each can be dealt with directly.

import { MILESTONE_BY_ID } from '../content/agenda';
import { PEOPLE, PERSON_BY_ID, RIVALS, RIVAL_BY_ID } from '../content/people';
import { personView, strongestRival } from './people';
import { rand } from './rng';
import type { GameState, NewsSeed, ZoneId } from './types';
import { ZONES, ZONE_NAME, addFavour, applyFx, approval, clamp, hardship, standing } from './vars';

function log(s: GameState, rival: string, text: string, news?: Omit<NewsSeed, 'weight'> & { weight?: number }): void {
  s.oppLog.push({ turn: s.turn, rival, text });
  if (s.oppLog.length > 14) s.oppLog.shift();
  s.counters[`oppmove.${rival}`] = s.turn;
  if (news) s.news.push({ weight: 3.5, valence: -1, topic: 'politics', about: rival, ...news });
}

const bump = (s: GameState, id: string, d: number) => { s.opposition[id] = clamp((s.opposition[id] ?? 30) + d, 5, 95); };

/** The governor or senator most open to an approach. */
export function wooTarget(s: GameState): string | null {
  const open = PEOPLE.filter((p) => p.group !== 'minister' && !s.people[p.id]?.gone && standing(s, p.id) < 48)
    .sort((a, b) => standing(s, a.id) - standing(s, b.id));
  return open[0]?.id ?? null;
}

function moveStrong(s: GameState): boolean {
  const r = RIVAL_BY_ID.strong;
  const target = wooTarget(s);
  if (target) {
    const st = s.people[target];
    const p = personView(s, target);
    st.rel = clamp(st.rel - 7, 0, 100);
    if (st.rel < 20) {
      st.gone = true;
      bump(s, 'strong', 8);
      applyFx(s, ['bloc.party', -6]);
      s.favours = s.favours.filter((f) => f.who !== target);
      log(s, 'strong', `${p.name} has left your party for ${r.name}'s.`, {
        chronicle: `${p.short.toUpperCase()} DEFECTS TO ${r.party.toUpperCase()}`, street: `${p.short.toUpperCase()} DON DECAMP. E FOLLOW ${r.short.toUpperCase()} GO`,
        weight: 6, body: `${p.name}, who ${p.title.toLowerCase()}, crossed to the ${r.party} at a rally this weekend, citing "irreconcilable neglect". The Presidency says the door remains open, which it does, from the outside.`,
      });
      return true;
    }
    log(s, 'strong', `${r.short} spent a weekend with ${p.name}. ${p.short} is now ${st.rel < 30 ? 'one conversation from leaving' : 'listening'}.`, {
      chronicle: `${r.short.toUpperCase()} IN CLOSED-DOOR TALKS WITH ${p.short.toUpperCase()}`, street: `${r.short.toUpperCase()} DEY TOAST ${p.short.toUpperCase()}`,
      body: `${r.name} was received at ${p.short}'s country home on Saturday. Aides to both men described the visit as "purely social". Neither man has been social with the other in six years.`,
    });
    // The President hears about it and can answer.
    const lastWoo = s.fired['opp.woo']?.slice(-1)[0] ?? -99;
    if ((s.fired['opp.woo']?.length ?? 0) < 3 && s.turn - lastWoo >= 12 && !s.queue.some((q) => q.event === 'opp.woo')) s.queue.push({ event: 'opp.woo', due: s.turn + 1 });
    return true;
  }
  if (s.blocs.party < 46) {
    applyFx(s, ['bloc.party', -3]);
    bump(s, 'strong', 3);
    log(s, 'strong', `${r.short} opened offices in four hundred wards, most of them staffed by people who used to work for you.`, {
      chronicle: `${r.party.toUpperCase()} OPENS 400 WARD OFFICES`, street: `${r.short.toUpperCase()} DON BUILD STRUCTURE FOR 400 WARD`,
      body: 'The offices are rented, painted and staffed. Several of the ward chairmen held the same position in the ruling party until last month.',
    });
    return true;
  }
  return false;
}

function moveAlt(s: GameState): boolean {
  const r = RIVAL_BY_ID.alt;
  if (s.exposures.some((x) => x.kind !== 'tolerated') && s.turn - (s.counters.dossier ?? -99) > 14) {
    s.counters.dossier = s.turn;
    applyFx(s, ['pressure.scandalHeat', 7]);
    applyFx(s, ['bloc.press', -2]);
    bump(s, 'alt', 3);
    if (!s.stories.some((x) => x.id === 'drawer')) s.stories.push({ id: 'drawer', stage: 0, next: s.turn + 1 });
    log(s, 'alt', `${r.short} gave the newspapers a file on payments out of the Villa. Somebody inside is talking to him.`, {
      chronicle: 'OPPOSITION RELEASES DOSSIER ON VILLA SPENDING', street: `${r.short.toUpperCase()} DON RELEASE PAPER. E GET RECEIPT`,
      topic: 'scandal', body: `${r.name} released forty pages of what he called "documents from inside the Villa". The Presidency describes them as forgeries and has begun looking for whoever photocopied them.`,
    });
    return true;
  }
  const law = s.agenda.active.find((a) => MILESTONE_BY_ID[a.id]?.m.needs && a.progress > 20 && a.progress < 85);
  if (law && s.turn - (s.counters.injunction ?? -99) > 16) {
    s.counters.injunction = s.turn;
    law.progress = Math.max(5, law.progress - 16);
    const name = MILESTONE_BY_ID[law.id].m.name;
    log(s, 'alt', `${r.short}'s lawyers obtained an injunction against "${name}". It has lost about three months.`, {
      chronicle: `COURT HALTS PRESIDENT'S ${name.toUpperCase()}`, street: 'COURT DON STOP PRESIDENT BILL. LAWYERS DEY CHOP',
      body: `A Federal High Court granted an interim order on the application of the ${r.party}. The Attorney General expects to have it lifted, in what he calls due course.`,
    });
    return true;
  }
  if (s.nation.debt > 74 || s.nation.inflation > 26) {
    applyFx(s, ['bloc.establishment', -3]);
    bump(s, 'alt', 2.5);
    log(s, 'alt', `${r.short} published a shadow budget. Bankers and donors have been seen reading it.`, {
      chronicle: 'OPPOSITION UNVEILS "SHADOW BUDGET"', street: `${r.short.toUpperCase()} DON WRITE HIM OWN BUDGET`, topic: 'money',
      body: 'The document runs to forty pages and balances. Asked whether it would survive contact with the National Assembly, its author said that was the President\'s problem, for now.',
    });
    return true;
  }
  return false;
}

function moveFire(s: GameState): boolean {
  const r = RIVAL_BY_ID.fire;
  const h = hardship(s);
  if (h > 55 && s.turn - (s.counters.march ?? -99) > 9) {
    s.counters.march = s.turn;
    applyFx(s, ['bloc.street', -4]);
    applyFx(s, ['approval', -1]);
    bump(s, 'fire', 3);
    log(s, 'fire', `${r.short} led marches in Lagos, Abuja and Kano over the cost of living.`, {
      chronicle: 'THOUSANDS MARCH OVER COST OF LIVING', street: '"WE NO FIT BREATHE": YOUTHS MARCH FOR THREE CITIES', topic: 'prices',
      body: `The marches were peaceful, large and filmed from every angle. ${r.name} read out the price of a bag of rice on the day of the inauguration and the price today, and said nothing else.`,
    });
    return true;
  }
  const weak = [...ZONES].sort((a, b) => s.zones[a].approval - s.zones[b].approval)[0] as ZoneId;
  const gov = PEOPLE.find((p) => p.group === 'governor' && p.zone === weak);
  if (gov && standing(s, gov.id) >= 58) {
    log(s, 'fire', `${r.short} tried to hold a rally in the ${ZONE_NAME[weak]}. ${personView(s, gov.id).short}'s people made sure the stadium was "under renovation".`);
    return true;
  }
  applyFx(s, [`zone.${weak}.approval`, -2.5]);
  bump(s, 'fire', 2);
  log(s, 'fire', `${r.short} toured the ${ZONE_NAME[weak]}, where you are weakest. The crowds were young and large.`, {
    chronicle: `${r.short.toUpperCase()} DRAWS CROWDS IN ${ZONE_NAME[weak].toUpperCase()}`, street: `${ZONE_NAME[weak].toUpperCase()} FULL GROUND FOR ${r.short.toUpperCase()}`,
    body: `${r.name} spent four days in the ${ZONE_NAME[weak]}. The governor's office declined to comment on the size of the crowds, which is a comment.`,
  });
  return true;
}

const MOVES: Record<string, (s: GameState) => boolean> = { strong: moveStrong, alt: moveAlt, fire: moveFire };

export function oppositionTick(s: GameState): void {
  if (s.turn < 5) return;
  // One rival moves at most each month; the stronger they are, the oftener.
  const order = [...RIVALS].sort((a, b) => (s.opposition[b.id] ?? 0) - (s.opposition[a.id] ?? 0));
  for (const r of order) {
    if (s.flags[`rival.${r.id}.in`]) continue;
    const last = s.counters[`oppmove.${r.id}`] ?? -99;
    if (s.turn - last < 5) continue;
    if (rand(s) >= (s.opposition[r.id] ?? 30) / 220) continue;
    if (MOVES[r.id](s)) return;
  }
}

// ---------------------------------------------------------------- dealing with them

export type RivalOp = 'coopt' | 'debate' | 'agencies' | 'spoiler';

export function canRival(s: GameState, id: string, op: RivalOp, movesLeft: number): { ok: boolean; reason?: string } {
  const r = RIVAL_BY_ID[id];
  if (!r) return { ok: false };
  if (movesLeft <= 0) return { ok: false, reason: "This month's moves are used." };
  const inside = !!s.flags[`rival.${id}.in`];
  if (op === 'coopt') {
    if (inside) return { ok: false, reason: 'Already brought in.' };
    if (s.pc < r.deal.pc) return { ok: false, reason: `Needs ${r.deal.pc} political capital.` };
    if (r.deal.naira && r.deal.naira > s.nation.fiscalSpace && s.nation.debt >= 100) return { ok: false, reason: 'There is no money, and nobody will lend it.' };
    if ((s.opposition[id] ?? 0) > 62) return { ok: false, reason: 'Too strong to need you. Nobody joins a government they expect to replace.' };
  }
  if (op === 'debate') {
    if (inside) return { ok: false, reason: 'Sits in your government.' };
    if ((s.counters[`debate.${id}`] ?? -99) > s.turn - 8) return { ok: false, reason: 'You debated within the year.' };
  }
  if (op === 'agencies') {
    if (inside) return { ok: false, reason: 'Sits in your government.' };
    if (s.pc < 6) return { ok: false, reason: 'Needs 6 political capital.' };
    if ((s.counters[`agencies.${id}`] ?? -99) > s.turn - 12) return { ok: false, reason: 'The agencies have been already. A second visit would look like what it is.' };
  }
  if (op === 'spoiler') {
    if (s.flags['opposition.split']) return { ok: false, reason: 'Already done.' };
    if (s.purse < 15) return { ok: false, reason: 'Needs ₦15bn in the drawer.' };
  }
  return { ok: true };
}

export function rivalDeal(s: GameState, id: string, op: RivalOp): { text: string; archive: string; sealed?: boolean } {
  const r = RIVAL_BY_ID[id];
  if (op === 'coopt') {
    s.pc = clamp(s.pc - r.deal.pc, 0, 100);
    if (r.deal.naira) applyFx(s, ['nation.fiscalSpace', -r.deal.naira]);
    if (id === 'strong') {
      bump(s, id, -18);
      s.flags[`rival.${id}.in`] = true;
      applyFx(s, ['bloc.party', 6]);
      const sw = s.people.gov_sw;
      if (sw) sw.rel = clamp(sw.rel - 8, 0, 100);
      addFavour(s, 'strong', 'owing', 2, 'Dandume came home on a promise of a ministry.');
    } else if (id === 'alt') {
      bump(s, id, -16);
      s.flags[`rival.${id}.in`] = true;
      applyFx(s, ['bloc.establishment', 5]);
      applyFx(s, ['bloc.party', -5]);
      applyFx(s, ['nation.capacity', 1.5]);
    } else {
      bump(s, id, -12);
      applyFx(s, ['bloc.street', 5]);
      applyFx(s, ['nation.jobs', 2]);
      applyFx(s, ['bloc.party', -3]);
    }
    s.news.push({
      chronicle: id === 'fire' ? 'PRESIDENT ADOPTS OPPOSITION YOUTH JOBS BILL' : `${r.short.toUpperCase()} JOINS GOVERNMENT`,
      street: id === 'fire' ? 'PRESIDENT DON CARRY TEGA BILL. WHO GET AM?' : `${r.short.toUpperCase()} DON ENTER GOVERNMENT. POLITICS!`,
      weight: 6, valence: 1, topic: 'politics', about: id, body: r.deal.done,
    });
    return { text: r.deal.done, archive: `${r.deal.name}.` };
  }
  if (op === 'debate') {
    s.counters[`debate.${id}`] = s.turn;
    const edge = approval(s) - (s.opposition[id] ?? 30) + (rand(s) * 2 - 1) * 8;
    if (edge > 0) {
      bump(s, id, -7);
      applyFx(s, ['approval', 1.5]);
      applyFx(s, ['bloc.press', 3]);
      s.news.push({ chronicle: `PRESIDENT BESTS ${r.short.toUpperCase()} IN TELEVISED DEBATE`, street: `PRESIDENT FINISH ${r.short.toUpperCase()} FOR DEBATE`, weight: 4.5, valence: 1, topic: 'politics', about: id });
      return { text: `Ninety minutes, live. You had the facts and, for once, the facts were on your side. ${r.short} is asked afterwards what went wrong.`, archive: `Debated ${r.name} and won.` };
    }
    bump(s, id, 6);
    applyFx(s, ['approval', -1.5]);
    s.news.push({ chronicle: `${r.short.toUpperCase()} LANDS BLOWS IN DEBATE WITH PRESIDENT`, street: `${r.short.toUpperCase()} WASH PRESIDENT FOR LIVE TV`, weight: 4.5, valence: -1, topic: 'politics', about: id });
    return { text: `Ninety minutes, live. ${r.short} asked what a bag of rice costs. You gave a figure from the Statistics Bureau. The clip has four million views.`, archive: `Debated ${r.name} and lost.` };
  }
  if (op === 'agencies') {
    s.pc = clamp(s.pc - 6, 0, 100);
    s.counters[`agencies.${id}`] = s.turn;
    applyFx(s, ['nation.integrity', -3]);
    applyFx(s, ['bloc.press', -5]);
    if (rand(s) < 0.35) {
      bump(s, id, 14);
      applyFx(s, ['bloc.street', -4]);
      s.news.push({ chronicle: `${r.short.toUpperCase()} DETAINED, RELEASED; CROWDS GATHER`, street: `DEM ARREST ${r.short.toUpperCase()}. NOW E BE HERO`, weight: 5.5, valence: -1, topic: 'politics', about: id });
      return { text: `${r.short} is held for nine hours and released without charge, into a crowd. You have made a martyr, with cameras.`, archive: `Set the security agencies on ${r.name}. It made a martyr.`, sealed: true };
    }
    bump(s, id, -10);
    s.news.push({ chronicle: `ANTI-GRAFT AGENCY QUESTIONS ${r.short.toUpperCase()}`, street: `DEM DON INVITE ${r.short.toUpperCase()} COME ANSWER QUESTION`, weight: 4, valence: 0, topic: 'politics', about: id });
    return { text: `The agency "invites" ${r.short} to explain certain accounts. Donors grow cautious. Everyone knows who sent them.`, archive: `Set the security agencies on ${r.name}.`, sealed: true };
  }
  // spoiler
  s.purse -= 15;
  s.purseTaken.political += 15;
  s.flags['opposition.split'] = true;
  s.flags['opposition.united'] = false;
  s.exposures.push({ kind: 'political', amount: 15, witnesses: ['sap'], trail: 1, turn: s.turn, causeId: '', label: 'Funded a spoiler candidate to split the opposition.' });
  applyFx(s, ['pressure.scandalHeat', 4]);
  return {
    text: 'A fourth candidate enters the race with a new party, a large billboard budget and no visible means of support. The opposition vote will be divided on election day.',
    archive: 'Funded a spoiler candidate to split the opposition.', sealed: true,
  };
}

export { strongestRival, PERSON_BY_ID };
