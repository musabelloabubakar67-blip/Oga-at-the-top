# Completion record

The action plan (`docs/ACTION-PLAN.md`) against what was built, as of 7 October 2026 on `redesign/claude-experience`. Every requirement has a row with its evidence in `COVERAGE.md`; this page summarises them.

## Status of all 201 requirements

| Status | Count | Meaning |
|---|---|---|
| Verified | 55 | An acceptance test or check exercises it |
| Integrated | 144 | Built, wired into play, with evidence named |
| Authored | 1 | 07.A1: the event audit, written as a document |
| Blocked | 1 | 18.A3: balance, waiting on a design decision (below) |

All eleven connected acceptance histories are verified (`HISTORIES.md`, `tests/experience/histories.check.ts`).

Checks at completion: TypeScript; 83 contract checks; 30 experience suites; content lint with no warnings; reform checks (18 tracks, 220 reforms, 11 rival pairs).

## What remains

**Balance (18.A3), blocked on a decision.** The simulator shows that any government that keeps the petrol subsidy and skips fiscal reform ends its term above 100% debt service, where lending stops and arrears and printing take over. Latest run, 30 presidencies each:

| Strategy | Re-elected | Aim |
|---|---|---|
| Reformer | 93% | 75–85% |
| Machine politician | 77% | 55–70% |
| Institutionalist | 60% | 30–40% |
| Kleptocrat | 10% | 20–30% (an earlier ruling accepted 30–43%) |
| Populist | 3% | 25–35% |

Results move by about ±9 points between runs at this size. The question for the owner is whether ignoring the treasury should be survivable. If so, the simplest lever is the no-lending line (`CFG.economy.noLendingAbove`, now 100) or the subsidy's cost. One short run afterwards would confirm the effect.

**Browser playtest gaps (18.A5).** Not re-walked by hand in this pass: night scenes, exporting and importing a country, and the year after office. All three are covered by engine checks (`succession.check.ts`).
