// The era a presidency leaves behind. Debts and half-built projects are inherited
// anyway; this is what changed in politics. Each shift is read from the last
// presidency, applied to the new one, and told to the incoming President once.

import { MILESTONE_BY_ID, ORDER_BY_ID } from '../content/agenda';
import { PEOPLE, PERSON_BY_ID } from '../content/people';
import { TYCOONS, TYCOON_BY_ID } from '../content/tycoons';
import type { Winner } from './succession';
import type { GameState } from './types';
import { clamp } from './vars';

export interface Shift { title: string; text: string; apply: (s: GameState) => void }

export function eraShifts(prev: GameState, w: Winner): Shift[] {
  const out: Shift[] = [];
  const was = `President ${prev.president.name}`;

  // The party: one that ended at war with itself stays divided.
  if (prev.blocs.party < 35) {
    out.push(w.sameParty
      ? { title: 'Your party is divided', text: `The ${prev.president.party} ended ${was}'s years at war with itself. The faction that lost the primary is still counting.`, apply: (s) => { s.counters.scar = (s.counters.scar ?? 0) + 1; s.blocs.party = clamp(s.blocs.party - 8, 0, 100); } }
      : { title: 'The defeated party has split', text: `The ${prev.president.party} has broken into two camps, each blaming the other for losing the Villa. Neither can hurt you much alone.`, apply: (s) => { s.flags['opposition.split'] = true; } });
  }

  // A governor the last President built up is now a kingmaker.
  const gov = PEOPLE.filter((p) => p.group === 'governor' && prev.people[p.id] && !prev.people[p.id].gone && prev.people[p.id].rel >= 85 && (prev.people[p.id].grants ?? 0) >= 2)
    .sort((a, b) => (prev.people[b.id].rel + (prev.people[b.id].grants ?? 0) * 5) - (prev.people[a.id].rel + (prev.people[a.id].grants ?? 0) * 5))[0];
  if (gov) {
    const name = prev.people[gov.id].name ?? gov.name;
    out.push({
      title: `${name} is a kingmaker`, text: `${was} made ${name} the most useful governor in the federation. The delegates from the ${gov.zone} now move when ${name} says so${w.sameParty ? '' : ', and ' + name + ' remembers who did the making'}.`,
      apply: (s) => {
        const p = (s.people[gov.id] ??= { rel: 50, granted: false, courted: [] });
        p.clout = Math.min(5, (PERSON_BY_ID[gov.id].clout ?? 3) + 2);
        if (!w.sameParty) p.rel = clamp(p.rel - 15, 0, 100);
        s.flags['era.kingmaker'] = gov.id;
      },
    });
  }

  // The businessman the last President favoured most has bought into the press.
  const fav = TYCOONS.filter((t) => prev.tycoons[t.id] && (prev.tycoons[t.id].granted || prev.tycoons[t.id].rel >= 70))
    .sort((a, b) => (prev.tycoons[b.id].rel + (prev.tycoons[b.id].granted ? 20 : 0)) - (prev.tycoons[a.id].rel + (prev.tycoons[a.id].granted ? 20 : 0)))[0];
  if (fav && fav.id !== 'ty_media' && prev.flags['era.media'] !== fav.id) {
    out.push({
      title: `${fav.short} owns a newspaper now`, text: `${fav.name} did well out of ${was}'s years and has bought a controlling stake in The Stakeholder. Its coverage of you will follow how ${fav.short} feels about you.`,
      apply: (s) => { s.flags['era.media'] = fav.id; },
    });
  }

  // An honest agency with a record answers to nobody now, including you.
  const graft = (prev.institutions ?? []).find((i) => i.id === 'graft');
  const charged = (prev.cases ?? []).length;
  if (graft && graft.head.integrity >= 4 && charged >= 1) {
    out.push({
      title: 'The anti-corruption agency answers to nobody', text: `Under ${graft.head.name} the agency charged ${charged} ${charged === 1 ? 'person' : 'people'} in ${was}'s time. It has learned that it can, and it will not take instructions from you either.`,
      apply: (s) => { const i = (s.institutions ?? []).find((x) => x.id === 'graft'); if (i) i.head.loyalty = Math.min(i.head.loyalty, 2); },
    });
  }

  // An order the Supreme Court struck down is no longer a power of the office.
  const struck = Object.keys(prev.counters).filter((k) => k.startsWith('struck.')).map((k) => k.slice(7)).filter((id) => ORDER_BY_ID[id]);
  if (struck.length) {
    const names = struck.map((id) => ORDER_BY_ID[id].name.toLowerCase());
    out.push({
      title: 'The Supreme Court has narrowed the office', text: `In ${was}'s time the court struck down the power to ${names.map((n) => `“${n}”`).join(' and ')}. The judgment stands: no President can use it again.`,
      apply: (s) => { for (const id of struck) s.flags[`law.struck.${id}`] = true; },
    });
  }

  // A reform the Assembly defeated has become conventional wisdom.
  const defeated = [...new Set(prev.agenda.failed.map((f) => f.id))].filter((id) => !prev.agenda.done.includes(id) && MILESTONE_BY_ID[id]);
  if (defeated.length) {
    const names = defeated.map((id) => MILESTONE_BY_ID[id].m.name);
    out.push({
      title: 'What was defeated is now the received view', text: `The Assembly threw out ${names.join(', ')} under ${was}. Since then it has become what every newspaper says should be done. It costs less to propose now.`,
      apply: (s) => { for (const id of defeated) s.flags[`era.wisdom.${id}`] = true; },
    });
  }

  return out;
}

/** Who owns The Stakeholder this era. */
export function mediaOwner(s: GameState): string {
  const id = s.flags['era.media'];
  return typeof id === 'string' && TYCOON_BY_ID[id] ? id : 'ty_media';
}
