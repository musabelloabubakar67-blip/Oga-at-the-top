// The rivals as they stand in this world. The three are written in content; when
// a President takes office from the other side, the rival slot of the winning
// party passes to the party that lost, under whoever now leads it.

import { RIVALS, RIVAL_BY_ID, type Rival } from '../content/people';
import type { GameState } from './types';

export function rivalOf(s: GameState, id: string): Rival {
  const base = RIVAL_BY_ID[id] ?? RIVAL_BY_ID.alt;
  // Dandume left the party of the first President. Governing for another party, he is not "of your own party".
  const origin = String(s.flags['party.origin'] ?? s.president.party);
  if (base.id === 'strong' && origin !== s.president.party && s.rivalSwap?.id !== 'strong') {
    return {
      ...base,
      style: `A former governor of the ${origin} who left it with his delegates. Knows where everything is buried because he helped bury it.`,
      feeds: 'Grows when your party is divided and your governors are unhappy, and on every defector he can collect.',
      deal: { ...base.deal, name: 'Bring him across: a ministry and his delegates', text: 'He crosses to your party with his people. Your own governors will ask what he did to deserve it, and you will owe him.', done: 'He crosses, to drums, at a rally in his old state. Your governors smile for the photographs.' },
    };
  }
  const o = s.rivalSwap;
  if (!o || o.id !== base.id) return base;
  return {
    ...base, name: o.name, short: o.short, party: o.party,
    style: 'Led the party in government until the election. Now leads it in opposition, with a grievance and a long list of what you will get wrong.',
    feeds: 'Grows on anything that makes the last government look better than this one: debt, prices and broken promises.',
    deal: { name: 'Offer a seat in a government of national unity', text: 'The defeated party\'s leader joins your government. The party you beat relaxes; your own party asks what winning was for.', pc: 12, done: 'The offer is accepted after a week of public reluctance. The defeated party splits over it, which was part of the point.' },
    lines: [
      'We left this government a country that was working. Look at it now.',
      'The people have seen the alternative, and the alternative is not working.',
      'We will be back, and we will remember who was patient.',
    ],
    situational: [],
  };
}

export function rivalsOf(s: GameState): Rival[] {
  return RIVALS.map((r) => rivalOf(s, r.id));
}
