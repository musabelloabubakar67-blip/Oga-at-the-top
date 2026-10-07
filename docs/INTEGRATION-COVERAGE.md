# Integration coverage - current immediate scope

Latest checkpoint (7 October 2026): Claude owns the engine, content and interface on `redesign/claude-experience`. Plans 01 to 17 are integrated with experience checks; plan 18 (balance, verification and documentation) is in progress. Row-level evidence for every action and acceptance line is in `docs/playtest/experience/COVERAGE.md`; the eleven connected histories are in `docs/playtest/experience/HISTORIES.md`. Earlier delivery notes below are kept as history.

| Master workstream | Evidence (commits, checks) | Status |
|---|---|---|
| 01 History/foundations | Identity registry, world clock, migration (Codex); adviser records by person, dated forecasts, chained worlds carrying institutions, assets, forces, inquiries, judgments and cases; misconduct in the verdict (4fc42fa; foundations.check.ts) | Integrated |
| 02 Opening | Transition with dossier, route, financier, rule, first cabinet and running mate (a37885d, 4fc42fa); party programmes with coalition agreements (5bda1f9); dossiers.check.ts, opening.check.ts | Integrated |
| 03 Team/talent | Named pool, exceptional recruitment R5 (140eb87, ec8a646); deputies, promotion, opposition recruitment (4fc42fa); government.check.ts, recruitment.check.ts | Integrated |
| 04 Institutions/courts | Charters, independent action, binding rules, reasoned judgments (c83724f; institutions.check.ts) | Integrated |
| 05 Requests/favours | R3 (Codex); refusals by motive, grudges by kind, substitution with consent, targeted favour services, bonds as financing (0ce0280; requests.check.ts) | Integrated |
| 06 Coalitions/delegation | R4/S1 reviews (Codex); issue positions, negotiated bills, coalitions, delegation (a938669; legislation.check.ts, targets.check.ts) | Integrated |
| 07 Content refresh | Event audit and families; episodes, pacing, report presentation, verb audit (d9ae90a; stories.check.ts, VERB-AUDIT.md) | Integrated; repeated joke refresh (07.A10) continues in plan 18 |
| 08 Evidence/information | Mysteries, sourced reports, decisions traced to the truth (0c68d70; inquiry.check.ts) | Integrated |
| 09 Economy | Gross accounts (6b7041a); reserve cover, managed-rate constraint, fund returns, conservation audit (5bda1f9; economy.check.ts, money.check.ts) | Integrated; economic-meaning audit of constants (09.A14) in plan 18 |
| 10 Tax/treasury | Two tracks with their own foundations and objectives (502b19e, 2178c59; fiscal.check.ts) | Integrated and verified |
| 11 Emergency funds | Holdings, three refineries, timed sales, collection, borrowing, deferral (b56e470, 9f8bcd4; holdings.check.ts) | Integrated |
| 12 Big bets | Partial openings, wear, system links, bets audit (0bfc6a3, 78b5b86; bets.check.ts, success.check.ts) | Integrated |
| 13 Military | Forces as an institution, missions, conduct, coups (b5be5d7; military.check.ts, forces.check.ts) | Integrated |
| 14 Citizens/development | Groups, services, constituencies (2650c93; society.check.ts, citizens.check.ts) | Integrated |
| 15 Maintenance/opposition | Diagnosis by cause, opposition proposals (2178c59; opposition.check.ts) | Integrated |
| 16 Succession/afterlife | Settlement, the year after, export and import of countries (e744320; succession.check.ts) | Integrated |
| 17 History/experience | Threads, shortlist, short scenarios, sharing (d2645b7; history.check.ts) | Integrated; concision and accessibility pass in plan 18 |
| 18 Verification/docs | 83 contract checks, 30 experience suites, content lint, reform checks, verb and bets audits, multi-seed simulation, histories | In progress: balance, browser playtests, documentation |

Content/UI ownership remains Claude's and is not evaluated as complete from its inventory alone. Claude's branch through 0468e5d is now integrated, including its audit, dossiers and content repairs.

Recorded checks before publication: contract checks passed (10); TypeScript passed; focused reform checks passed; content lint passed with the existing 19 missing-headline warnings. These checks concern the first contract only, not the complete redesign.

Audit follow-up: S2, S5 and S7 delivered; see CODEX-AUDIT-REPLY.md. After integration, TypeScript, 11 contract checks and six dossier checks pass. Content lint passes with 26 warnings: 20 missing headlines and six explicit warnings about existing empty headline pairs. Claude can replace the latter with justified private outcomes. S1, S3, S4 and S6 remain outstanding immediate work.

Next integration: Claude's df6da18 consumes S2/S5 and resolves all 26 warnings. S8 record scoping now works through CHOOSE across months and succession; the experience script uses Claude's new runner. TypeScript, 13 systems checks, six dossier validations and zero-warning content lint pass. See CODEX-S8-REPLY.md. The prior 26-warning entry records the earlier delivery.

Delivery 6: Claude's 6fcf4f2 is integrated, including the register and route/financier proposals. S4 binds queued subjects and withdraws office-dependent files after replacement; S6 accepts validated scenario assets and preserves condition/output through succession. Scenario declarations still need Claude's content entries. TypeScript, 17 systems checks, all three experience suites, zero-warning lint and two worlds/eight chained presidencies pass. See CODEX-DELIVERY-6.md for limits and R6 parameter agreement.

Delivery 7: e83c0b3 supplies all six scenario asset declarations, verified in real new games. S6 is consumed. The larger matched Machine/scandal comparison (256 seeds per version) gives 144 re-elections before and 148 after, so the earlier 6/8 to 3/8 drop is not reproduced at scale. No tuning was made. Checkpointed simulation and paired evidence are in CODEX-DELIVERY-7.md and docs/playtest/systems/SCANDAL-MACHINE-BALANCE.md. R3/R4/R5/R6/S1/S3 remain outstanding.

Delivery 8: Claude 3f20eea integrated. R5 ordinary named appointments, persistent dossiers and canonical identities connected; exceptional contracts/effects remain outstanding. S3 records state transfers and routes currency defence into a one-shot sovereign-fund FX auction with explicit units and no duplicate reserve/treasury credit. TypeScript, 25 contract checks, four experience suites, zero-warning lint and eight chained presidencies passed. See CODEX-DELIVERY-8.md; full economy audit and R3/R4/R5 remainder/R6/S1 remain immediate work.

Delivery 9: R3 engine delivery connects actual person requests, durable refusal, materially changed alternatives and accepted substitutes. Favours support validated partial uses, bilateral offsets, forgiveness and preserved personal ownership through replacement/succession. Refused repayment demands retain liabilities; bond purchases create matching principal. Typecheck, 38 contract checks, four experience suites, zero-warning lint and eight chained presidencies passed. Claude's R3 controls/browser check remain outstanding. See CODEX-DELIVERY-9.md. R4/S1, R5 remainder, R6 and broader economy/design work remain immediate scope.

Delivery 10: R4 supports parties, agreed tests, actual treasury payments, due evidence verdicts, disputes and government contribution. S1 stores real ministerial scorecard baselines, samples modelled budget releases throughout the target period, and reviews the original person at the due world month; the existing written-target choice invokes it. Typecheck, 53 contract checks, four experience suites, zero-warning lint and eight chained presidencies passed. Claude's authored target response, commitment coverage and interaction/browser checks remain outstanding. See CODEX-DELIVERY-10.md. R5 remainder, R6 and the wider immediate plan remain assigned.
