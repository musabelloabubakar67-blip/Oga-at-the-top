# Claude delivery notes to Codex

Newest first. Format from the shared specification: baseline / branch and commits / contract version / files / master bullets / migrations / checks and results / unresolved issues / requested integration.

## Delivery 5 — routes to power and the financier (02.A3, 02.A4), input for R6

- **Files:** `content/routes.ts` (new), `tests/experience/routes.check.ts` (new). Nothing in the game reads them yet.
- **What it is:** the content side of R6's `Route` and `Financier` steps. Four routes (`establishment`, `coalition`, `mobilisation`, `continuity`) and six financier options (the five businessmen, or small contributors). Each has stated strengths and costs, proposed starting effects (`Fx[]`), favours owed (`{ who, size, why }`), and starting expectations stored as commitments (`{ object, text, responsible, afterMonths, visibility }`, the shape of `commitment.open`). `continuity` is restricted (`onlyWhen`) and says why when closed.
- **What it replaces:** today `FINANCIER` in `content/tycoons.ts` picks the financier from the professional background, and `initTycoons` always adds the financier's favour and Koroye's. Under R6: the background keeps its current effects; the route adds its own (the Koroye favour belongs to the party-machine route); the financier is chosen. I have not removed `FINANCIER`, so nothing changes until the setup steps exist.
- **Parameters to agree:** every number in the file is a proposal. Magnitudes follow the existing background effects (±3 to ±10 on blocs; +14 on the backing businessman, which reproduces today's starting standing of 64).
- **Example (for R6's `startingEffects(setup)` preview):** background technocrat + route mobilisation + small contributors gives street +10 and +4, press +5, approval +3, integrity +2, capacity +3, party -8, -8 and -3, establishment +8 and -4; no favour owed to any businessman; two public commitments (cut the cost of governance within 12 months; publish the campaign accounts within 6).
- **Checks:** `routes.check.ts` applies every proposed effect to a real new game and fails if one changes nothing (verified: a made-up target is caught), checks that debts and offices resolve, and that each businessman is offered once. Passed. `tsc` clean.

## Delivery 4 — the register screen (06.A7)

- **Baseline:** `4227861`; on top of `40cb5b5` and delivery 3.
- **Contract consumed:** 1.0.0 read-only: `getGovernanceView` and its record types from `engine/public.ts`. No state is written from the interface; no formula is duplicated.
- **Files:** `ui/Register.tsx` (new), `ui/Desk.tsx` (a "The register" page in the navigation, and a badge counting commitments due for review), `content/events/minor.ts` (the road request no longer says "his state").
- **What it shows:** open commitments by due date (who is responsible, public or private, when made, notes against it, inherited records labelled as such); commitments that have reached their date shown as "due for review", with the statement that reaching the date is not keeping it; requests waiting and answered, with the answer given; settled commitments; and the existing in-person promises (`s.pledges`) so there is one place to look.
- **Browser check (dev server from this worktree, port 3419, a throwaway save):** chose "fund the road" and "pay half" through the real interface; the register listed the two commitments and the granted request; after advancing to the due month the doctors' commitment showed "due for review now" and the navigation badge read 1. At 375px wide: no horizontal scroll, labels wrap under titles. No page errors. The test save was deleted afterwards.
- **Checks:** `tsc` clean; lint 0 warnings; `check:experience` passed (dossiers, 11 record checks).
- **Needs from you:** R4 judgements (kept / broken / renegotiated, with resource attribution) so settled commitments carry a verdict; R3 so the old want loop's asks appear here as requests.

## Delivery 3 — the first authored records (S8)

- **Baseline:** `4227861`. Fast-forwarded to `40cb5b5`; no conflicts.
- **Branch:** `redesign/claude-experience`, head after `40cb5b5`.
- **Contract version consumed:** 1.0.0 with the S8 tokens. Verbs used: `request.open`, `request.close`, `commitment.open`, `commitment.note`. No episode records yet (repetition routing is R2).
- **Files:** `content/events/minor.ts`, `reactive.ts`, `labour.ts`, `system.ts`, `cabinet.ts`, `politics.ts`, `secondterm.ts`; `tests/experience/records.check.ts`; documents.
- **What the six files now record:**

| File | Record | Id | Closed or noted by |
|---|---|---|---|
| `minor.governor_call` | Koroye's request for the road: withdrawn (called back), granted (funded), refused (message ignored, at month end) | `road.ss.$ADMIN` | Same outcome |
| `minor.governor_call` → `road` | Public commitment of the Works minister to finish the road within 12 months | `road.ss.finish.$ADMIN` | `react.road_done`, all three paths, by the original id |
| `doctors.strike` → `part` | Public commitment of the Finance Minister to pay the remaining ₦19bn, due in 3 months | `doctors.balance.$ADMIN` | Review waits on R4/S1 |
| `owe.decamp` → `stall` | Private promise of a ministry for Dandume "after the budget", 6 months | `dandume.ministry.$ADMIN` | `owe.decamp.leaves`: given late, or not given and read out at a press conference |
| `fin.gwarzo.offer` → `keep` | Public commitment that the Finance Minister controls the budget timetable and may refuse unfunded spending | `fin.terms.gwarzo.$ADMIN` | `fin.gwarzo.budget`: honoured (back) or broken (overrule), with different results and headlines; guarded by a flag set only with the record |
| `fin.lohor.committee` | Zango's request (granted or refused) and, if granted, a private commitment to put the committee's projects first | `approp.understanding.$ADMIN`, `approp.projects.$ADMIN` | Next budget, once R4 can judge it |
| `ticket.elders` → `terms` | Private commitment to concede the secretariat and consult the elders on second-term appointments, 16 months | `elders.terms.$ADMIN` | `second.promise`: honoured, partly honoured, broken, or renegotiated by favours; guarded by a flag set only with the record (an executive order sets `promise.second_term` without one) |

- **Identity notes:** Dandume is a rival and may not hold a resolvable office, so his promise is recorded with the President as responsible and him named in the text. Requesters and responsible parties otherwise use `gov_ss`, `sen_approp`, `min_works`, `adviser:fin` and `president`.
- **Checks and results:** `tsc` clean; content lint passed (0 warnings); `npm run check:experience` passed (2 checks: 6 dossiers, 11 record checks); `npm run check:contracts` passed (13); `simulate 2 --world` ran eight chained presidencies through the real reducer without a failure.
- **Record checks cover:** each choice opens or closes the record its text implies; follow-ups address the original id after months have passed; the month-end path for an ignored message; a budget file that must not touch a record never opened; the order-set flag that has no record; a successor opening the same records again.
- **Unresolved:** commitment reviews (S1/R4), follow-up identity (S4) and episode routing (R2) are still needed before recurring files can carry records. S3 and S6 also outstanding.

## Delivery 2 — consuming contract 1.0.0 (S2, S5, S7)

- **Baseline:** `4227861`. Fast-forwarded to `b07f3e8` from `redesign/codex-systems`; no merge commit, no conflicts.
- **Branch:** `redesign/claude-experience`. Commit: see the head of the branch after `b07f3e8`.
- **Contract version consumed:** 1.0.0. Used: `Outcome.quiet` (S2), the `shock.<id>` variable (S5). Not used: `domain` effects (see S8).
- **Files:** `content/events/cabinet.ts`, `content/events/predecessor.ts`, `content/events/system.ts`, `content/events/recurring.ts`, `tests/experience/run.ts`, `docs/playtest/experience/CONTRACT-REQUESTS.md`, `docs/playtest/experience/EVENT-AUDIT.md`, this file.
- **Master bullets:** 07.A1 (headline audit closed), 07.A8 (blackout contradiction), 18.A7 ("resolve missing-headline warnings or explicitly justify intentional blanks").
- **What changed:**
  - All 26 lint warnings resolved, each judged on its own. Public acts got real headlines (a board appointment, a finished road, a call on the former President, a public rebuttal, a campaign appearance, a ticket statement, an invitation to leave the party). Private acts got a `quiet` reason (an unannounced meeting, an understanding never written down, a target signed in private). The six `news: ['', '']` workarounds are gone.
  - `grid.collapse` no longer fires while the blackout shock is active (`{ v: ['shock.blackout', '!=', 1] }`).
  - `tests/experience/run.ts` runs every `*.check.ts` in the folder and fails if any fails.
- **Migrations:** none. No ids changed.
- **Checks and results:** `tsc` clean. Content lint passed with **0 warnings** (was 26). `npm run check:experience` passed (6 dossiers). `npm run check:contracts` passed (11). `npx tsx tests/experience/run.ts` passed.
- **Unresolved, and why no records were authored yet:** contract 1.0.0 throws on a duplicate record id inside CHOOSE, and every file can fire again in a successor's presidency in the same world. A static id in content would crash a later game. Request **S8** asks for `$ADMIN` (and an occurrence token) substituted in effect ids. Six one-off files are ready to carry records the moment it lands; they are listed with the request.
- **Requested integration:** change `check:experience` in `package.json` to `tsx tests/experience/run.ts` (S7 follow-up). S1, S3, S4, S6 remain outstanding; S8 is new.

## Delivery 1 — audit, families, dossiers (integrated at `b07f3e8`)

Commits `7b9f286`, `5d8d893`, `da4463a`, `0468e5d`. See `INVENTORY.md`, `EVENT-AUDIT.md`, `STORY-FAMILIES.md`, `content/dossiers.ts`, `tests/experience/dossiers.check.ts`.
