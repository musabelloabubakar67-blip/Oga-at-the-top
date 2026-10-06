/** Public authoring contract. Imports are type-only: safe in content and React. */
export const CONTRACT_VERSION = '1.0.0' as const;
export const GOVERNANCE_SCHEMA_VERSION = 1 as const;

export type PersonId = string;
export type OfficeId = string;
export type InstitutionId = string;
export type AssetId = string;
export type CaseId = string;
export type AgreementId = string;
export type EpisodeId = string;
export type RequestId = string;
export type CommitmentId = string;
export type AdministrationId = string;
/** Zero-based month from this world's origin; never a presidency-relative turn. */
export type WorldMonth = number;
export type PresidencyMonth = number;
export type ContractVersion = typeof CONTRACT_VERSION;
export type ActorRef = { person: PersonId } | { office: OfficeId };
export type DeskClassification = 'decision' | 'progress' | 'condition' | 'closing';

export interface WorldClock {
  worldMonth: WorldMonth;
  presidencyMonth: PresidencyMonth;
  administrationId: AdministrationId;
  accuracy: 'exact' | 'estimated-legacy';
}
export interface RecordOrigin {
  administrationId: AdministrationId;
  eventId?: string;
  choiceId?: string;
}
export interface PersonIdentity {
  id: PersonId;
  name: string;
  /** Legacy source is an identifier, not a claim about the person's career. */
  legacyKey?: string;
}
export interface EpisodeBinding {
  family: string;
  subject: string;
  episodeId: EpisodeId;
  classification: DeskClassification;
}
export interface EpisodeRecord extends EpisodeBinding {
  origin: RecordOrigin;
  opened: WorldMonth;
  changed: WorldMonth;
  stage: string;
  status: 'open' | 'resolved';
  developments: { at: WorldMonth; stage: string; note: string }[];
}
export type RequestChange = 'offer' | 'appeal' | 'threat' | 'coalition' | 'evidence';
export type RequestStatus = 'open' | 'refused' | 'granted' | 'substituted' | 'withdrawn' | 'lapsed';
export interface RequestTerms { description: string; naira?: number; politicalCapital?: number }
export interface RequestRecord {
  origin: RecordOrigin;
  id: RequestId;
  requester: PersonId;
  object: string;
  text: string;
  episodeId?: EpisodeId;
  made: WorldMonth;
  status: RequestStatus;
  ambition?: string;
  terms?: RequestTerms;
  previous?: RequestId;
  changedBy?: RequestChange;
  history?: { at: WorldMonth; status: RequestStatus; text: string }[];
  substitution?: { offered: WorldMonth; text: string; accepted: boolean; terms?: RequestTerms };
  /** Snapshot used by the existing person-deal interface. */
  legacyWant?: { kind: string; done: string; fx: import('./types').Fx[]; office: string };
  closed?: WorldMonth;
  response?: string;
}
export interface CommitmentRecord {
  origin: RecordOrigin;
  id: CommitmentId;
  responsible: PersonId;
  object: string;
  text: string;
  made: WorldMonth;
  due: WorldMonth;
  visibility: 'public' | 'private';
  /** A due commitment awaits evidence; reaching the date is never success. */
  status: 'open' | 'review-due' | 'kept' | 'broken' | 'renegotiated';
  notes: { at: WorldMonth; text: string }[];
}
export interface GovernanceState {
  schemaVersion: typeof GOVERNANCE_SCHEMA_VERSION;
  contractVersion: typeof CONTRACT_VERSION;
  originMonth: WorldMonth;
  clockAccuracy: WorldClock['accuracy'];
  administrationId: AdministrationId;
  persons: Record<PersonId, PersonIdentity>;
  offices: Record<OfficeId, PersonId>;
  episodes: Record<EpisodeId, EpisodeRecord>;
  requests: Record<RequestId, RequestRecord>;
  commitments: Record<CommitmentId, CommitmentRecord>;
}

/** Only implemented effects are exposed. Financial/military APIs are not placeholders. */
export type DomainEffect =
  | { type: 'episode.open'; id: EpisodeId; family: string; subject: string; stage: string; classification: DeskClassification; note: string }
  | { type: 'episode.advance'; id: EpisodeId; stage: string; note: string; classification: DeskClassification }
  | { type: 'episode.resolve'; id: EpisodeId; note: string }
  | { type: 'request.open'; id: RequestId; requester: ActorRef; object: string; text: string; episodeId?: EpisodeId; ambition?: string; terms?: RequestTerms; previous?: RequestId; changedBy?: RequestChange }
  | { type: 'request.close'; id: RequestId; status: Exclude<RequestStatus, 'open' | 'substituted'>; response: string }
  | { type: 'request.substitute'; id: RequestId; text: string; accepted: boolean; terms?: RequestTerms }
  | { type: 'commitment.open'; id: CommitmentId; responsible: ActorRef; object: string; text: string; afterMonths: number; visibility: 'public' | 'private' }
  | { type: 'commitment.note'; id: CommitmentId; text: string };

export interface DomainOutcome {
  version: typeof CONTRACT_VERSION;
  effects: DomainEffect[];
}

export const SUPPORTED_OUTCOME_EFFECTS = [
  'episode.open', 'episode.advance', 'episode.resolve', 'request.open',
  'request.close', 'request.substitute', 'commitment.open', 'commitment.note',
] as const;

export interface GovernanceView {
  contractVersion: typeof CONTRACT_VERSION;
  clock: WorldClock;
  persons: PersonIdentity[];
  offices: Record<OfficeId, PersonId>;
  episodes: EpisodeRecord[];
  requests: RequestRecord[];
  commitments: CommitmentRecord[];
}
