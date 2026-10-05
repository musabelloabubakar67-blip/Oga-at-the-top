/** Versioned shared entry point for content authors and interface consumers. */
export * from './contracts';
export { clockOf, getGovernanceView, resolveActor, presidencyMonthToWorld, worldMonthToPresidency } from './governance';
export { applyDomainOutcome } from './domain-outcomes';
export type { StartingAssetSpec, ScenarioAssets } from './places';
