# Oga at the Top — Shared Integration Specification

Date: 5 October 2026. Initial contract: v0, agreed design pending implementation.

Read with `ACTION-PLAN.md`, `CODEX-HANDOFF.md` and `CLAUDE-HANDOFF.md`. The complete action plan is authoritative for scope. These documents divide delivery; they do not reduce or defer it.

## Collaboration agreement

Codex owns simulation, persistent accounts and integration. Claude owns the authored world, content definitions and player-facing experience. Both implement code in their assigned areas. Claude is not restricted to writing suggestions; Codex is not restricted to reviewing them.

Use separate worktrees or checkouts and branches from one explicitly recorded authoritative commit. Proposed branches: `redesign/codex-systems` and `redesign/claude-experience`. Do not create branches from the historically named commits without establishing which revision is current. Record baseline hash, contract version and incoming integration commit in every delivery note.

Neither agent can assume direct access to the other chat session. The user relays handoffs, questions and committed changes. Exchange commit hashes when both can fetch the repository; otherwise use a Git bundle or patch, never an unexplained replacement folder. Do not force-push, overwrite user work or publish as an incidental part of collaboration.

All workstreams are immediate. Implementation dependencies determine integration order, not future phases. When an API is unavailable, continue authoring, audits, layouts and independent tests; record the specific dependent blocker. Do not ship fake engine behaviour to make a screen look complete.

## Exclusive path ownership

| Paths | Editing owner | Review / integration responsibility |
|---|---|---|
| `engine/**`, including types, reducer, migration, RNG, economy and all new simulation modules | Codex | Claude reviews player meaning and interface needs |
| `content/**`, including existing events, agenda/tracks, candidates, assets, courts, institutions and ventures | Claude | Codex reviews economic parameters, rule semantics and invariants |
| `app/**`, `ui/**`, application styling and new interface assets | Claude | Codex checks reducer/API integration and state safety |
| Existing `tools/**`, simulator/linter changes, new engine regression tooling | Codex | Claude supplies coverage requirements and authored scenarios |
| New `tests/experience/**` and `docs/playtest/experience/**` | Claude | Codex includes these checks in final verification |
| New `tests/engine/**` and `docs/playtest/systems/**` | Codex | Claude reviews externally visible outcomes |
| Existing GDD, README and player documentation | Claude | Codex verifies technical and economic statements |
| `docs/ACTION-PLAN.md`, these three handoffs, integration coverage and completion report | Codex | Both propose corrections; retain user scope |
| Root package/config/lockfiles, deployment configuration, root handoff/status files | Codex | Claude requests dependency/config changes with justification |

Read actual repository instructions first. Paths may differ on the authoritative revision; record any ownership remapping before editing. Never edit read-only synced project sources. Existing engine defects requiring a content change are sent to Claude as exact file/field requirements, not silently edited on both branches. Claude requests engine changes through the same process. File moves across boundaries require an explicit ownership update.

## Contract design to make concrete before cross-boundary integration

The following are required concepts, not claims about APIs already present. Codex publishes typed definitions and adapters in an engine-owned public module; Claude consumes those exact exports. Preserve usable existing reducer/actions rather than replacing them gratuitously.

| Contract | Required data and behaviour |
|---|---|
| Identity and time | Stable person, office, institution, asset, case, episode, agreement and commitment IDs; world month distinct from presidency month; source administration; versioned saves |
| Claim / evidence / forecast | Source person or institution, subject, timestamp, status, evidence references, confidence where applicable; prediction horizon and pending/resolved assessment |
| Request | Requester person, objective, concrete object, terms, opened/closed dates, status, response history and episode linkage; refusal closes that specific request |
| Commitment | Parties, precise object/outcome, responsible actor, resources, due date, conditions, verification, status and causal origin; public/private character distinguished |
| Favour | Actual counterpart, direction, remaining strength, origin, settlement terms and use eligibility; explicit partial bilateral settlement |
| Candidate | Stable individual, role eligibility, demonstrated expertise, capabilities, conditions, sponsorship, availability and recruitment state; unknown information labelled |
| Delegation | Responsible person, objective, budget, discretion, limits, reporting cadence, measures and exception conditions |
| Authority | Required legal route, decision owner, consent/majority/vacancy conditions and reasons for unavailability |
| Financial transaction | Currency, amount, source/destination, transaction type, cash timing, liability/ownership changes and cause; no ambiguity between stock, flow and index |
| Public asset / operation | Ownership share, location, current use, valuation basis, encumbrances, output, maintenance, operating costs, demand and transferable obligations |
| Sale / financing | Eligible interest, method, bids or financing terms, expected versus settled proceeds, conditions, dates and resulting ownership/debt |
| Military mission | Theatre, objective, commander, resources, readiness, conduct limits, evidence, operational state and civilian outcomes |
| Negotiated programme | Provisions, parties, concessions, enforcement conditions, votes/endorsements and linked commitments |
| Story episode | Family, subject, state, material developments, next eligible beat, repetition identity, resolution and causally linked updates |
| Succession settlement | Candidate, nomination/electoral support, public continuity programme, private expectations, institutional protections and later compliance |
| Country transfer | Schema and contract versions, complete persistent state, RNG state, chronology, handover interpretation and validation metadata |

Prefer narrow derived views and validated actions. UI must not mutate GameState directly or duplicate financial/eligibility logic. Publish action availability with reasons, effect previews and relevant uncertainty; distinguish quotes/estimates from settled outcomes.

Required view surfaces: transition dossier, government/candidates, requests/favours, commitments, institutional/court authority, treasury/accounts, emergency funds, military missions, operating projects, citizens/places, succession, post-office and history/export. Exact function names are implementation decisions and must be recorded in the contract changelog. A view must identify its observation time and provisional information where relevant.

## Content and interface boundary

Codex defines which engine-supported outcomes and conditions the content DSL can express, including episode transitions, commitments, transactions, evidence, actor reactions and delayed resolution. Claude authors all content against that version and controls content registries/barrel exports.

Do not encode a bond as a cash bonus or an auction as a headline. Do not encode a refused request as just a relationship loss. When a desired narrative cannot be represented, file an engine request describing the necessary state transition, affected files, proposed semantics and one example outcome.

Claude provides engine fixtures separately from presentation mocks. Mocks are labelled, deterministic and limited to interface development; final acceptance must use the real reducer. Neither agent declares completion based on the other agent's future work.

## Complete workstream allocation

| Master ID | Codex deliverable | Claude deliverable |
|---|---|---|
| 01 Foundations | Identity/time migration, persistent history, advice evaluation, inheritance and account fixes | Correct evidence wording, history/endings presentation and content assertions |
| 02 Opening | Validated setup/mandate/coalition actions and starting-state effects | All inheritance dossiers, electoral choices, ceremony, compact route and tutorial |
| 03 Team/talent | Recruitment, suitability, careers, conditions and capability mechanics | Full slate selection, named pool, exceptional biographies/terms and candidate UI |
| 04 Institutions/courts | Authority, autonomy, performance, case reasoning and constitutional rules | Institutional options, judges, case content and legal explanations |
| 05 Requests/favours | Specific objects, closure, responses, offsets and contextual uses | Refreshed request content, terms, reactions, settlement and favour interface |
| 06 Coalitions/delegation | Negotiated provisions, enforcement, delegation, targets and register | Bargaining scenes, bill choices, political projects and commitments UI |
| 07 Content refresh | Episode director, scheduling, queue controls and invariant checks | Complete event/choice/outcome audit and all family rewrites |
| 08 Information | Evidence, investigations, source incentives and forecast horizons | Authored mysteries, conflicting reports, source attribution and investigation UI |
| 09 Economy | Accounts, FX/reserves, debt, investments, taxes/exports and conservation | Economically accurate definitions, parameters agreed with Codex and explanatory UI |
| 10 Tax/treasury | Track identity compatibility, functional policy effects and migration | Track restructuring, alternative programmes, mandates and content registries |
| 11 Emergency funds | Assets, bids, settlement, finance, timing and obligations | Asset definitions, disposal stories, buyers/options and emergency-funds UI |
| 12 Big bets | Partial outcomes, operations, output dependencies and financing | Audit every bet, distinctive rewards, risks, reactions and operating-project UI |
| 13 Military | Capability, missions, command, conduct, supply, accounts and succession | Named military cast, all-theatre story coverage, missions/bets and military UI |
| 14 Citizens/development | Group/place dependencies, service outcomes and emergent constituency state | Recurring cast, local stories, rival policy content and citizen/place views |
| 15 Upkeep/opposition | Maintenance, diagnosis, delegation and opposition programme behaviour | Distinct failure stories, opposition proposals and relief/progress feedback |
| 16 Succession/afterlife | Preparation, settlements, nominations, continuity, post-office actions and transfer | Successor openings/letters, aftermath decisions, legacy interpretation and handover UI |
| 17 History/experience | Causal queries, shared seed/replay/export and shortlist eligibility | History book, attributed voices, office aesthetic, short scenarios, daily-seed and share views |
| 18 Validation/docs | Engine checks, simulator/linter support, balance and final integration | Experience checks, browser playtests and complete GDD/player-documentation refresh |

The row allocation does not replace the master bullets. Each owner keeps a per-bullet checklist, including cross-owner dependencies. No unassigned requirement is allowed.

## Delivery and integration protocol

1. Record common baseline and contract v0; Codex publishes the first concrete typed contract and example fixtures. Claude starts content audit/design immediately and connects to the published exports as they become available.
2. Deliver cohesive commits with file list, plan IDs, contract version, migrations, commands run, results and explicit blockers. Do not submit one enormous unexplained dump.
3. Request a contract change with reason, input/output example, save/content impact and proposed migration. Codex owns publishing the updated contract; Claude owns consuming it.
4. Codex integrates on a dedicated integration branch, preserving both authors' work. Review cross-boundary semantics, not just merge conflicts. Run relevant checks after each meaningful integration.
5. Resolve failures against agreed behaviour. Do not weaken acceptance criteria or silently remove content to obtain a green build.
6. Complete all master scope, save migrations and connected histories before declaring the redesign complete. Publishing is a separate concrete action subject to applicable authorization.

## Required evidence and shared acceptance histories

Run typecheck, content lint, relevant engine and experience checks, appropriate builds, multi-seed balance and multi-government simulations. Browser-playtest integrated systems, responsive layouts and accessibility. Report warnings and unverified areas candidly.

The eleven master acceptance histories are jointly owned: industrial transformation across three governments; Reformer’s Handover; refusal and bilateral settlement; payroll liquidity crisis; currency shock; military corridor mission; exceptional recruitment; independent institution versus founder; competing public-service approaches; defeat and human handover; succession earned through play.

Codex supplies reproducible state and verifies mechanics. Claude supplies complete authored paths and validates the player experience. Both examine causal explanations, episode closure and historical persistence.

## Questions and delivery-note formats

Cross-owner request: `Plan IDs / owned files / requested contract or definition / example / required-by integration / independent work continuing`.

Delivery note: `Baseline / branch and commits / contract version / files / master bullets completed / migrations / checks and results / unresolved issues / requested integration`.

Maintain `docs/INTEGRATION-COVERAGE.md` during implementation: one row per master requirement, engine/content/UI owner, implementing commits, evidence and status. Initial status is planned, not implemented. Completion requires real integrated evidence.
