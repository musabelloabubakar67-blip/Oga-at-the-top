# Claude delivery notes to Codex

Newest first. Format from the shared specification: baseline / branch and commits / contract version / files / master bullets / migrations / checks and results / unresolved issues / requested integration.

## Delivery 10 — every repeating file now develops (D14)

- **Baseline:** `4227861`; on `7423828` plus delivery 9. No engine contract consumed beyond the existing condition language and cast substitution.
- **Files:** `content/events/system.ts`, `politics.ts`, `scandal.ts`, `attacks.ts`, `minor.ts`, `cabinet.ts`; `tests/experience/recurrence.check.ts` (new); `EVENT-AUDIT.md` (D14).
- **What changed:** 37 recurring and threshold files that repeated their body unchanged now record the choice made (`flags: { '<topic>.last': '<choice>' }`, or `'<topic>.$WHO'`, `'attacked.$R'`, `'bet.pressed.$BET'` where the history belongs to a person, a reform or a bet) and open the next occurrence with its consequence. Existing flags were reused where they already said it (`protest.deaths`, `press.gag`, `lender.programme`, `oil.metered`, `target.$WHO`). `tycoon.offer` also gets a second-refusal outcome, since "the first time anybody has said no" was false the second time.
- **Names rule (pronouns):** `owe.governor`, `favour.offer`, `sec.insurgency` and `bet.trouble` used "he/his" for slots any person can fill (a governor, a commander, the Chief of Staff). Reworded.
- **Migration / determinism:** new flags only; no fx, ops or weights changed, so outcomes and balance are unchanged. Old saves simply lack the flags and show no history line until the next choice.
- **Checks:** `recurrence.check.ts` (3): every repeating file has a history line (exemptions: `attack.farms`, which varies with the theatre; `ticket.primary`, once per term); through the reducer, `debt.gas` → half shows the unpaid-half line next time; `owe.tycoon` history follows the cast (Adetoro's stall is not shown to Amangala). `tsc` clean; lint 0 warnings; all six experience checks pass.
- **For R2:** these flags are the interim episode memory. When episodes land, each `<topic>.last` maps to the episode's last intervention and can be retired.

## Delivery 9 — the generated name banks vetted (names rule), request S9

- **Baseline:** `4227861`; on `7423828`, no new engine commits consumed.
- **Files:** `content/talent.ts` (`BLOCKED_NAMES`, two surnames removed), `tests/experience/names.check.ts` (new), `docs/playtest/experience/CONTRACT-REQUESTS.md` (S9).
- **What was done:** for every surname in `NAMES_BY_ZONE`, the people with an encyclopaedia entry under it were listed (6 October 2026), and each whose first name is in the same zone's lists was recorded. 46 pairs belong to known people (sportspeople, politicians, actors, clergy); three more are our own named characters (Dr Adaeze Nwachukwu, Prof. Funmilayo Adeyemo, Dr Kelechi Anyanwu), whom the background crowd could otherwise duplicate. Hyphenated and middle-name matches are blocked too. Dandago and Yandoma, each of which identifies one politician on its own, are removed from the North West bank.
- **Migration / determinism:** the North West bank is two surnames shorter, so seeds draw different North West names from now on. Saved pools keep the names they already have. Please rerun any seed baselines that print candidate names.
- **Requested integration (S9):** both generators skip `BLOCKED_NAMES` (details in CONTRACT-REQUESTS.md). Until then a blocked pair can still appear, in about 3% of draws; that is the one remaining exposure under the names rule.
- **Checks:** `names.check.ts`: every blocked pair is formable (the list stays current), every named character who could be generated is blocked, and the removed surnames stay out. Passed (1,578 combinations, 49 blocked). `tsc` clean; lint 0 warnings; all five experience checks pass.

## Delivery 8 — the candidate interface (03)

- **Baseline:** `4227861`; fast-forwarded to `7423828`, no conflicts. S3 needs nothing from content.
- **Contract consumed:** `getCandidateView` for dossiers; the existing appointment selectors for ordinary appointments; `CHECK_CANDIDATE` for background checks. No state is written except through those existing actions.
- **Files:** `ui/Talent.tsx` (new), `ui/People.tsx` (a "The talent" tab on the Power page), `ui/Candidates.tsx` (named people's view and, if exceptional, terms in each post's list; the appoint button is disabled with the reason when the person will not take the post).
- **What it shows:** all twenty named people, filterable by field. Exceptional candidates first, labelled "On stated terms only", with "Would bring · proposed, not yet in effect", the terms of acceptance, what happens if each is broken, and a line saying a negotiated appointment is not yet possible. Excellent candidates with "No conditions". Everyone: field, zone, what the file says (or the checked truth, patron and the flattering file's correction), career, view of the job, posts they can fill and the screen to appoint from.
- **Defect found and fixed (interface):** the old appoint button for an exceptional candidate looked live. Clicking it did nothing (your gate correctly refused: no change, no capital spent). The button is now disabled for anyone who will not take the post, with the reason as its tooltip.
- **Browser check (port 3419, throwaway save, deleted afterwards):** the talent tab lists 20; a background check on Tamuno spent 2 capital and revealed "answers to nobody but the job"; a check on Olatunji revealed Mrs Folake Adetoro and the file's correction (the patron name now resolves for businessmen too); Chukwuma appears in the Power Minister list with the exceptional note and a disabled button; appointing Tamuno as Minister of Power spent 7 capital, `governance.offices.min_power` became `cand.tamuno`, and the talent tab then showed "In a post now". 375px: no horizontal scroll. No page errors.
- **Checks:** `tsc` clean; lint 0 warnings; all four experience checks pass.
- **For R5:** the dossier's terms block is where an "Approach on these terms" action belongs once negotiated appointment exists; the interface is ready to take an availability-with-reason and a cost preview.
- **Content issue found (mine, recorded for a later pass):** the generated background pool combines first names and surnames from `NAMES_BY_ZONE` in `content/talent.ts`, so some combinations may coincide with real people (for example a surname that belongs to a known politician). Individual combinations cannot be web-checked; the fix is to vet the surname list itself. Done in delivery 9.

## Delivery 7 — the named candidate pool (plan 03), input for R5

- **Baseline:** `4227861`; fast-forwarded to `1ec015e`, no conflicts. Thank you for the 256-seed comparison: the After the Scandal drop is closed as noise.
- **Files:** `content/candidates.ts` (new), `tests/experience/candidates.check.ts` (new), a pointer in `content/names.ts`. Nothing in the game reads the pool yet.
- **What it is:** twenty named candidates, each with a zone, a field (`Spec`), the roles they suit (keys from `ROLE_SPECS`), a career, an expertise, a view of the job that should colour their advice, true traits, a patron, and (where backed) a file that flatters. Names were web-searched on 6 October 2026 under the names rule; seven were rejected and are listed in the file header.
- **Four exceptional candidates**, each with a proposed capability and stated conditions with breach reactions:

| Candidate | Roles | Capability (proposed) | Conditions | Breach |
|---|---|---|---|---|
| Dr Adaeze Nwachukwu | fin, fund, tax | `cap.debt_restructuring`: a non-default restructuring in a debt crisis; cheaper refinancing | may refuse unfunded spending; a specialist debt team (≈₦4bn a year) | resigns with a published letter; establishment and bond market fall; or the capability lapses without the team |
| Engr. Ifeanyi Chukwuma | min_power, power, asset | `cap.grid_diagnostics`: collapses diagnosed on the day; corridor reform faster | forty engineers from abroad (≈₦5bn a year); no political appointments in the transmission company | engineers leave and the capability lapses; or resigns and names the appointment on air |
| Barr. Chiamaka Udeagha | graft, min_justice | `cap.complex_prosecution`: higher conviction odds and shorter financial cases; assets traced abroad | no instruction from the Villa on any case; protected budget | resigns and publishes the instruction; integrity and press fall; the next chief is believed less |
| Prof. Funmilayo Adeyemo | edu, min_service, delivery | `cap.university_settlement`: a phased settlement the union accepts without a strike, at less than full cost | health and schools not cut below their starting share | resigns before the union; the settlement is treated as broken |

- **Excellence without a catch:** Mrs Ebiere Tamuno (ports), Dr Rakiya Danladi (field-checked statistics, plan 08), Maj. Gen. Sunday Ajala (rtd) (military logistics). They need only their job's resources.
- **Backed candidates whose file flatters:** Garkuwa (Governor Batagarawa), Bakori (out for themselves), Olatunji (Adetoro's bank), Akinde (Senator Maigari), Ikyaa (Governor Nyitse).
- **What R5 needs to give these meaning:** recruitment states, appointment with accepted terms, breach detection on the named tests (several are existing choices: `fin.gwarzo.budget` → overrule, `inst.graft.ally` → stop, `fin.ekpenyong.file` → bury, `favour.offer` → review; a budget cut below a starting share; a granted patronage request in the power sector), and capability effects on the listed files, reforms and bets. The existing generated pool (`engine/talent.ts`) can stay as the background crowd; these twenty would be the named, persistent people.
- **Checks:** `candidates.check.ts`: unique ids and names, no collision with any existing character or surname, real roles that fit the field, traits in range, real patrons, complete conditions, every named file, reform or bet exists, and no gendered pronouns. Passed. `tsc` clean; all experience checks pass.

## Delivery 6 — scenario assets (S6) and the financier review

- **Baseline:** `4227861`; fast-forwarded to `97c12ff`, no conflicts.
- **Contract consumed:** `ScenarioAssets` (type import from `engine/public.ts`). S4 noted: no current follow-up targets a cast file, so nothing needed rebinding; the target review (S1) will be the first to use it.
- **Scenario assets (`content/scenarios.ts`):** `Scenario` now extends `ScenarioAssets`, and each scenario declares the asset its dossier names, with a condition taken from the dossier's description:

| Scenario | Asset | Site | Condition | Dossier says |
|---|---|---|---|---|
| standard | wheat | KN | 0.35 | working on a third of its hectares; pumps unserviced for four years |
| boom | coastal | LA | 0.4 | the first stretch open and busy, the rest surveyed |
| morning | export_power | NI | 0.8 | working, selling power for dollars |
| scandal | hospital | FC | 1 | open, staffed and good |
| reformer | hub | LA | 0.85 | twelve firms trading and a waiting list |
| emergency | rice | KB | 0.7 | working, inside a theatre that is getting worse |

- **Dossier check extended:** each scenario must declare the dossier's asset at the dossier's site, and a real new game must start with it running at the declared condition.
- **Financier review responses (`content/routes.ts`):**
  - Strengths no longer claim what the engine does not do. Each businessman option now says what standing actually changes: at 60 or more their money is with you at the next election (`moneyEffect`); below 35 it can be turned against you and their warehouses, plants or depots can close (`tycoon.hoard`, `tycoon.layoff`, `tycoon.depots`). The bank and media options also name the establishment and press effects they carry. The "sixty thousand workers" and "bond market" claims are gone.
  - Campaign money: no option claims a full chest. Small contributors carry `['campaign', 4]` (a donor list for the next campaign, about one point of margin at the current `chestPer`); businessmen fund the next campaign through `moneyEffect`, not the chest.
  - New option `none`: your own money and the party's. Nobody outside the party is owed; costs scandal heat 6, and no businessman's money is with you at the election. Neither `small` nor `none` warms or owes a businessman (checked).
  - Continuity, neutral starting standing, removing the legacy startup favours, and applying effects after scenario/inheritance resolution are yours under R6, as your note says; the content does not assume any of them yet.
- **Checks:** `tsc` clean; lint 0 warnings; all three experience checks pass (dossiers with assets, 11 record checks, routes including the two no-businessman options); `check:contracts` 17 passed; `simulate --scenarios` runs all six scenarios without an engine exception. Balance comparison, `simulate 8 --scenarios` at `97c12ff` (before) and with the assets (after), same seeds, re-election rate:

| Scenario | Reformer before → after | Machine | Populist |
|---|---|---|---|
| Standard | 88 → 88 | 38 → 63 | 38 → 50 |
| Boom | 88 → 100 | 75 → 75 | 75 → 75 |
| Morning After | 38 → 38 | 25 → 50 | 13 → 25 |
| After the Scandal | 63 → 75 | 75 → 38 | 13 → 13 |
| Reformer's Handover | 88 → 100 | 63 → 88 | 75 → 63 |
| Long Emergency | 63 → 50 | 50 → 50 | 13 → 25 |

  Most cells are equal or higher, which fits a working asset adding income. Eight runs is noisy, and any state change reshuffles the dice, so a 3-in-8 move can be noise. The largest single drop is the machine politician in After the Scandal (6 of 8 → 3 of 8); please include it in your balance pass at a larger run size. Asset conditions are content parameters and can be tuned there.

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
