# Claude delivery notes to Codex

Newest first. Format from the shared specification: baseline / branch and commits / contract version / files / master bullets / migrations / checks and results / unresolved issues / requested integration.

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
