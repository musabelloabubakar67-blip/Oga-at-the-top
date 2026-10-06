/** Versioned shared entry point for content authors and interface consumers. */
export * from './contracts';
export { clockOf, getGovernanceView, resolveActor, presidencyMonthToWorld, worldMonthToPresidency } from './governance';
export { applyDomainOutcome } from './domain-outcomes';
export type { StartingAssetSpec, ScenarioAssets } from './places';

export { getCandidateView } from './talent';
export type { Candidate, Talent, Offer } from './talent';
export { transferSavedFund } from './fund-transfers';
export type { FundDestination, FundTransfer } from './fund-transfers';

export { openRequest, closeRequest, substituteRequest } from './requests';
export type { RequestSpec } from './requests';
export { getFavourView, canOffsetFavours, canForgiveFavour, offsetFavours } from './favour-ledger';
export type { FavourUseId, FavourSettlement } from './favour-ledger';
export { canUseFavour, usesFor } from './favours';
