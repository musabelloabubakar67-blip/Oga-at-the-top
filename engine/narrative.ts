// The story people believe about the government: what the papers have been printing,
// remembered with a slow decay, reduced to one line. It moves when the coverage does.

import type { GameState, NewsSeed, Topic } from './types';

const LINE: Partial<Record<Topic, [string, string]>> = {
  prices: ['the government that tamed prices', 'a government that cannot bring prices down'],
  money: ['a government that pays its bills', 'a government that is broke'],
  power: ['the government that kept the lights on', 'a government of blackouts'],
  security: ['the government that reopened the roads', 'a government that has lost the highways'],
  politics: ['a government that knows how to win', 'a government at war with itself'],
  scandal: ['a government that cleaned house', 'a government of scandals'],
  labour: ['a government that made peace with labour', 'a government at war with labour'],
  reform: ['a government that actually builds things', 'a government of announcements'],
  bet: ['the government of big projects', 'the government of abandoned sites'],
  oil: ['a government riding the oil price', 'a government at the mercy of the oil price'],
  people: ['a government that keeps its friends', 'a government its own people are walking away from'],
};

/** Each month, before the papers are printed: the coverage is remembered, and older coverage fades. */
export function talkTick(s: GameState, seeds: NewsSeed[]): void {
  for (const k of Object.keys(s.counters)) if (k.startsWith('talk.')) s.counters[k] *= 0.9;
  for (const x of seeds.slice(0, 6)) {
    if (!x.topic || !LINE[x.topic] || x.weight <= 0) continue;
    const key = `talk.${x.topic}.${(x.valence ?? 0) > 0 ? 'good' : (x.valence ?? 0) < 0 ? 'bad' : ''}`;
    if (key.endsWith('.')) continue;
    s.counters[key] = (s.counters[key] ?? 0) + Math.min(8, x.weight);
  }
}

/** What people say about this government, once there is enough coverage to say it. */
export function narrative(s: GameState): string | null {
  const top = Object.entries(s.counters).filter(([k]) => k.startsWith('talk.')).sort((a, b) => b[1] - a[1])[0];
  if (!top || top[1] < 6) return null;
  const [, topic, side] = top[0].split('.');
  const pair = LINE[topic as Topic];
  return pair ? pair[side === 'good' ? 0 : 1] : null;
}
