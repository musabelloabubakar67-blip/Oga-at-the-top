# Shared contract 1.0.0 — first executable delivery

Baseline: `422786119dd1695d11d64282bd8f043c38a70352`. Owner: Codex. Branch: `redesign/codex-systems`.

Import the runtime and types from `engine/public.ts`. The literal `CONTRACT_VERSION` is `1.0.0`. This is the initial R1 implementation and usable primitives for R2–R4, not completion of those systems or R5–R14. Their requests remain in immediate scope.

## Authoring

Existing `Outcome` fields remain compatible. Add `domain: { version: CONTRACT_VERSION, effects: [...] }` to an outcome. Supported effects: `episode.open`, `episode.advance`, `episode.resolve`, `request.open`, `request.close`, `commitment.open`, `commitment.note`. Exact discriminated shapes are in `engine/contracts.ts`; unsupported types/versions and invalid transitions fail explicitly.

```ts
import { CONTRACT_VERSION } from '../engine/public';
import type { Outcome } from '../engine/types';

const outcome: Outcome = {
  result: 'The governor is told that the contract must go to tender.',
  archive: 'Refused the governor a direct award.',
  domain: { version: CONTRACT_VERSION, effects: [
    { type: 'request.open', id: 'governor-road-episode-1',
      requester: { office: 'gov_nw' }, object: 'road-direct-award',
      text: 'Award the road contract to the nominated firm.' },
    { type: 'request.close', id: 'governor-road-episode-1', status: 'refused',
      response: 'The contract must go to competitive tender.' },
  ] },
};
```

IDs are persistent and cannot be reopened by repeating the same ID. Author a request open at the point it arises, then close that existing record at decision time. The compact example shows a self-contained one-off file; repeating it will correctly fail as a duplicate. Use a distinct episode ID for a genuine new episode. Dynamic cast replacement already substitutes `$WHO` inside an office reference when a file has the matching cast token.

`ActorRef` is `{ office: string }` or `{ person: string }`. Legacy office keys include `gov_nw`, `min_works`, `ty_trade`, `vp`, `president` and `adviser:fin`. Resolve an office to a stable person with `resolveActor`. A stored request/commitment retains that individual after office replacement. Legacy identities are explicitly prefixed; cross-role named-candidate identity reconciliation is part of R5, not invented from matching names.

`GameEvent.episode` accepts family, subject, episodeId and classification (`decision`, `progress`, `condition`, `closing`). Metadata can be authored now; director suppression and desk routing are R2 work still to integrate. Do not claim that adding metadata already fixes repeat selection.

## Clocks and saved state

`clockOf(state)` returns zero-based worldMonth, zero-based presidencyMonth, administrationId and accuracy. New worlds are exact; migrated legacy elapsed history is labelled estimated. A successor carries the world origin and records rather than resetting their due dates. Legacy engine `turn` remains one-based and is not replaced yet.

Use `presidencyMonthToWorld(state, month)` and `worldMonthToPresidency(state, month)` for explicit conversions. Historical dates can produce negative presidency-relative months. The contract exports all R1 ID names, `PresidencyMonth`, and the `ContractVersion` type; use the uppercase `CONTRACT_VERSION` constant in outcomes.

Opened domain records carry their originating administration; outcomes executed through CHOOSE also retain event and choice IDs. This origin is retained through succession. It is not yet the complete financing/delivery causal history requested in R14.

`GameState.governance` has its own schema version 1 while legacy save version remains 3. Migration rejects unsupported governance versions. This additive change does not claim to repair all legacy date fields; institutions, court terms, prior ledgers and other legacy systems still require the broader calendar conversion.

## Consumption and runtime

`getGovernanceView(state)` returns a detached serialisable view with clock, identities, offices, episodes, requests and commitments. Reading the view does not mutate state or RNG. Supported domain effects execute through the existing CHOOSE/reducer outcome path. Batch effects apply atomically; unsupported operations do not silently become bonuses.

Commitment opening records a responsible person, precise object, public/private visibility and positive integer duration. At its deadline the status becomes `review-due`. There is deliberately no automatic kept/broken judgement or manual author-written success operation in this initial contract. Target metrics, actual government resource contributions and evidence-based review are R4 work still to implement.

## Important boundaries

- New request records do not yet replace the old `currentWant` loop. Do not advertise R3 as complete.
- Favour offset, recruitment, initial slate, setup, financial transactions, military, authority, citizen simulation and export/import remain outstanding contracts.
- New records are not yet a complete causal archive and do not imply full adviser attribution migration.
- Claude owns content registries and authored conversion. This delivery edits engine code, engine checks and this technical contract note only.

Verification command: `node --import tsx tools/check-contracts.ts`. Use typecheck and existing focused reform checks alongside it. Delivery notes report actual results; they must not infer completion from type availability.
