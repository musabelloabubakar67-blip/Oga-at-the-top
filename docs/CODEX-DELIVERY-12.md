# Delivery 12: Claude delivery 15 integrated

Baseline: published systems `6878dce`, plus Claude `f36732c` (delivery 15).
Both branches' histories are preserved by the integration merge.

## Consumed

The real favour/request controls, detached views, partial calls, bilateral offsets,
forgiveness, settlements and former-presidency claims are integrated. The authored
`min.target.review`, the six verification/review paths, the doctors' resource payment
and the register's verdict and government contribution are integrated. Claude's
browser check is recorded in `docs/playtest/experience/CLAUDE-TO-CODEX.md`; Codex did
not repeat that browser check.

The `tools/lint-content.ts` entry for the engine-queued `min.target.review` is retained.

## Two integration fixes

1. `commitment.note` accepts an existing settled record. The chained-presidency
   simulation otherwise crashed when a later conversation attempted to annotate a
   promise already judged at its due date. A note appends history; it cannot reopen
   the promise, change its verdict or erase the original government contribution.
   Missing IDs still fail atomically.
2. The target review's `again` option previously deducted an arbitrary ₦100bn while
   leaving the release instruction unchanged. It now explicitly authorises **future**
   full releases for the exact target's ministry and sets a new six-month target.
   Past withholding and the original review stay intact. The budget model handles
   subsequent spending; no historical budget-point sample is converted into invented
   naira or presented as arrears paid. The instruction does not resolve stalled bills
   or restore a cut allocation, which the next review can still attribute.

Public addition: `authoriseTargetReleases(state, targetId)`; authored operation:
`['targetrelease', '$TARGET']`. It requires a reviewed withheld target belonging to
this administration and the original current officeholder. No other sector's release
instruction changes. The linter and choice preview recognise the operation.

Surgical content integration: only `min.target.review`'s `again` label, result,
operations, cost and archive wording were adjusted. Claude should retain these
changes when wiring further experience work.

## S9 status correction

S9 was delivered in published systems `6878dce` before this merge. Both talent and
court generators reject `BLOCKED_NAMES`, with deterministic fallback and no renaming
of existing saved candidates. Its six regression checks remain in the contract suite.
Claude's delivery 15 list calls S9 outstanding because that branch had consumed
`cae4d72`, rather than `6878dce`. It is closed in this combined tree.

## Validation

- Type-check passed.
- 62 contract checks passed, including three new integration regression checks.
- All ten experience suites passed.
- Content lint: 190 events, zero warnings.
- `simulate 2 --world`: eight chained presidencies completed after the note fix.

## Immediate outstanding scope

R5 exceptional appointments, R6 validated opening, R2 episode routing, and R7–R14
remain assigned to Codex. Existing content inputs and mocks do not complete their
engine behaviours. No workstream is deferred or marked complete by this checkpoint.

Next engine work is R5: negotiated appointment terms, real recurring team costs,
funding and political breach reactions, and all four capability effects. Appointment
paths traced for this work are Finance, minister/adviser replacement, institution
establishment/head replacement and asset managers. Terms must be checked across
all of them rather than merely enabling the existing buttons.
