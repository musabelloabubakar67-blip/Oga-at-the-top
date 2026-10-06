import { openRequest, closeRequest, substituteRequest } from './requests';
import { CONTRACT_VERSION } from './contracts';
import type { DomainEffect, DomainOutcome, GovernanceState, RecordOrigin } from './contracts';
import { clockOf, ensureGovernance, resolveActor } from './governance';
import type { GameState } from './types';

const text = (value: string, label: string) => {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Missing ${label}`);
  return value;
};
const fresh = (table: Record<string, unknown>, id: string) => {
  text(id, 'record ID');
  if (Object.hasOwn(table, id) || ['__proto__', 'constructor', 'prototype'].includes(id)) throw new Error(`Duplicate or reserved record ID: ${id}`);
};
function applyOne(s: GameState, g: GovernanceState, effect: DomainEffect, origin: RecordOrigin): void {
  const now = clockOf(s).worldMonth;
  switch (effect.type) {
    case 'episode.open':
      fresh(g.episodes, effect.id);
      g.episodes[effect.id] = {
        origin: { ...origin },
        episodeId: effect.id, family: text(effect.family, 'family'), subject: text(effect.subject, 'subject'),
        classification: effect.classification, opened: now, changed: now,
        stage: text(effect.stage, 'stage'), status: 'open',
        developments: [{ at: now, stage: effect.stage, note: text(effect.note, 'development') }],
      };
      break;
    case 'episode.advance': {
      const e = g.episodes[effect.id];
      if (!e || e.status !== 'open') throw new Error('Episode is not open');
      if (e.stage === effect.stage) throw new Error('An episode needs a changed stage');
      e.stage = text(effect.stage, 'stage'); e.changed = now; e.classification = effect.classification;
      e.developments.push({ at: now, stage: e.stage, note: text(effect.note, 'development') });
      break;
    }
    case 'episode.resolve': {
      const e = g.episodes[effect.id];
      if (!e || e.status !== 'open') throw new Error('Episode is not open');
      e.status = 'resolved'; e.changed = now; e.classification = 'closing';
      e.developments.push({ at: now, stage: e.stage, note: text(effect.note, 'closing explanation') });
      break;
    }
    case 'request.open':
      openRequest(s, effect, origin); Object.assign(g, s.governance); s.governance = g; break;
    case 'request.close': closeRequest(s, effect.id, effect.status, effect.response); break;
    case 'request.substitute': substituteRequest(s, effect.id, effect.text, effect.accepted, effect.terms); break;
    case 'commitment.open':
      fresh(g.commitments, effect.id);
      if (!Number.isSafeInteger(effect.afterMonths) || effect.afterMonths < 1) throw new Error('Commitment duration must be positive whole months');
      if (!['public', 'private'].includes(effect.visibility)) throw new Error('Invalid commitment visibility');
      g.commitments[effect.id] = {
        origin: { ...origin },
        id: effect.id, responsible: resolveActor(s, effect.responsible),
        object: text(effect.object, 'commitment object'), text: text(effect.text, 'commitment text'),
        made: now, due: now + effect.afterMonths, visibility: effect.visibility, status: 'open', notes: [],
      };
      break;
    case 'commitment.note': {
      const c = g.commitments[effect.id];
      if (!c || !['open', 'review-due'].includes(c.status)) throw new Error('Commitment is not pending');
      c.notes.push({ at: now, text: text(effect.text, 'commitment note') });
      break;
    }
    default: throw new Error(`Unsupported outcome effect: ${(effect as { type: string }).type}`);
  }
  if ('classification' in effect && !['decision', 'progress', 'condition', 'closing'].includes(effect.classification)) throw new Error('Invalid desk classification');
}

/** Validate and apply atomically: a bad later effect cannot leave earlier records behind. */
export function applyDomainOutcome(s: GameState, outcome: DomainOutcome, cause?: { eventId: string; choiceId: string }): void {
  if (outcome.version !== CONTRACT_VERSION || !Array.isArray(outcome.effects)) throw new Error('Unsupported domain outcome version or effects');
  const draft = structuredClone(s);
  const g = ensureGovernance(draft);
  const origin: RecordOrigin = { administrationId: g.administrationId, ...cause };
  for (const effect of outcome.effects) applyOne(draft, g, effect, origin);
  s.governance = draft.governance;
}
