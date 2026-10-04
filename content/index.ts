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
import { SYSTEM } from './events/system';
import { TRIBUNAL } from './events/tribunal';
import { SHOCK_FILES } from './shocks';
import { CABINET } from './events/cabinet';
import { ATTACKS } from './events/attacks';
import { REFINERY } from './events/refinery';
import { INSTITUTION_FILES } from './events/institutions';
import { PREDECESSOR_FILES } from './events/predecessor';
import { CAST_FILES, PROMISE_FILES } from './events/promises';

export const EVENT_LIST: GameEvent[] = [
  ...SUBSIDY, ...LABOUR, ...SCANDAL, ...POLITICS, ...RECURRING, ...ABSURD, ...SECOND, ...MINOR, ...REACTIVE, ...SYSTEM, ...TRIBUNAL, ...SHOCK_FILES, ...CABINET, ...ATTACKS, ...REFINERY, ...INSTITUTION_FILES, ...PREDECESSOR_FILES, ...PROMISE_FILES, ...CAST_FILES,
];

export const EVENTS: Record<string, GameEvent> = Object.fromEntries(EVENT_LIST.map((e) => [e.id, e]));

export { EDITORIALS, FILLERS, SIDEBARS, WEAK_LINES } from './press';
