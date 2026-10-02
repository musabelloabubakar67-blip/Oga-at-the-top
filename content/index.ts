import type { GameEvent } from '../engine/types';
import { ABSURD } from './events/absurd';
import { LABOUR } from './events/labour';
import { MINOR } from './events/minor';
import { POLITICS } from './events/politics';
import { REACTIVE } from './events/reactive';
import { RECURRING } from './events/recurring';
import { SCANDAL } from './events/scandal';
import { SECOND } from './events/secondterm';
import { SUBSIDY } from './events/subsidy';

export const EVENT_LIST: GameEvent[] = [
  ...SUBSIDY, ...LABOUR, ...SCANDAL, ...POLITICS, ...RECURRING, ...ABSURD, ...SECOND, ...MINOR, ...REACTIVE,
];

export const EVENTS: Record<string, GameEvent> = Object.fromEntries(EVENT_LIST.map((e) => [e.id, e]));

export { EDITORIALS, FILLERS, SIDEBARS, STANDFIRSTS, WEAK_LINES } from './press';
