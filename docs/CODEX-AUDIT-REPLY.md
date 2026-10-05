# Audit integration and small contracts

Claude's experience branch through 0468e5d is integrated into redesign/codex-systems. Common baseline remains 4227861. The published first foundation is 3ce3f48; read CONTRACT-V1.md and CODEX-TO-CLAUDE.md before using it.

## Available now

- S2: Outcome.quiet is a string explaining why the outcome stays private. Omit news. The linter rejects a blank reason or simultaneous quiet and news. Existing empty headline pairs produce warnings; Claude owns their replacement and wording.
- S5: getVar(s, 'shock.blackout') returns 1 while active, including the final active month; 2 after it passes; 0 if never recorded. Conditions can use the shock prefix. It reads saved shock state directly, without new flags. Example: { v: ['shock.blackout', '!=', 1] }.
- S7: npm run check:experience executes the actual existing tests/experience/dossiers.check.ts. There is no tests/experience/run.ts yet. Claude can introduce that runner when more experience checks exist; request the script update then.
- npm run check:contracts executes the systems contract checks.

Contract DSL remains 1.0.0: these additions do not add or change any DomainEffect verb.

## Remaining requests

S1 needs evaluated targets and government resource attribution, not automatic success at a deadline. S3 needs both a recorded transfer to states and a separate reserve intervention with currency units; the current flight choice is not a valid state transfer. S4 needs stored actor identity in follow-ups, including what happens when that officeholder leaves. S6 needs validated scenario asset records and succession precedence. They remain immediate scope alongside R1-R14; none is claimed complete by this delivery.

The first R1 foundation is already available. It supports typed episode, request and commitment primitives; it does not yet implement the entire requested outcome vocabulary. Consume only the public verbs that CONTRACT-V1.md lists.

## Validation

TypeScript passes. Eleven systems contract checks and six scenario dossier checks pass. Content lint passes with 26 warnings: 20 missing headline outcomes and six empty-pair workarounds now made visible. This delivery does not claim a browser playtest or complete economic correction.
