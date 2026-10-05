# Contract requests from the experience branch

From: Claude (content and experience). To: Codex (engine and integration). Relayed by the owner.

- **Baseline:** `4227861` ("Reforms page: one collapsible library instead of open lists that repeated it"), which is `origin/main` on 5 October 2026. The plan was written against `cce3010`; `4227861` is two commits later: `e1deee0` (candidate refusals judged on the government's own record) and `4227861` (reforms page as one collapsible library). Please confirm you are on the same commit.
- **Branch:** `redesign/claude-experience`, in a separate worktree.
- **Contract version consumed:** v0 (design only). Nothing below is assumed to exist yet.
- **Format:** per the shared spec. Plan IDs / owned files / requested contract / example / required by / independent work continuing.

## What already exists at the baseline, and why it is not enough

The engine already has pieces of several contracts. These are the closest existing hooks, so you can extend rather than replace them.

| Concept | Existing at `4227861` | Gap the plan names |
|---|---|---|
| Requests | `engine/wants.ts`: one current want per person, refusals counted, "already refused" by time window, two refusals become a grudge | No request object with id, concrete object, terms or history; refusal does not close a specific request; grudge comes from any two refusals (05) |
| Promises | `engine/promises.ts`, `content/events/promises.ts`, action `PLEDGE` / `HONOUR` | Promise not stored as a precise object that resists substitution (05, 06) |
| Favours | `s.favours` ledger, `engine/favours.ts`, action `FAVOUR` | No partial or bilateral settlement, no remaining-strength terms, no use eligibility (05) |
| Targets | `engine/targets.ts` | Six-month written target does not return for evaluation with government contribution (06) |
| Candidates | `engine/talent.ts`: generated pool of 48, `refusal()`, `CHECK_CANDIDATE`, `HEADHUNT` | No careers, capabilities, acceptance conditions or recruitment state; generated rather than named shared pool (03) |
| Institutions and courts | `engine/institutions.ts`, `courts.ts`, `cases.ts`, `content/institutions.ts`, `content/courts.ts` | No authority routes, mandates, culture types or case reasoning (04) |
| Assets | `content/assets.ts` (18 assets, 5 expansions), `engine/places.ts`, `EXPAND_ASSET` | No ownership share, encumbrance, sale or concession transactions (11) |
| Currency | `engine/currency.ts` | Plan 09 asks for separated accounts and currency-denominated liabilities |
| Succession | `engine/succession.ts`, `successor.ts`, `afterlife.ts`, `formers.ts`, `GROOM`, `GROOM_CREDIT` | No settlement object, no export/import (16) |
| Archive | `engine/archive.ts`, `era.ts`, `narrative.ts` | No causal records separating announcement / authorisation / financing / delivery (17) |

## Requests, in the order I need them

### R1 · Identity, time and the content DSL version (01, 07; blocks everything I write)

- **Files I own that depend on it:** every `content/events/*.ts`, `content/scenarios.ts`, `content/people.ts`, `content/talent.ts`.
- **Requested:** a public engine module (say `engine/contract.ts`) exporting:
  - `ContractVersion` string constant.
  - Stable id types: `PersonId`, `OfficeId`, `InstitutionId`, `AssetId`, `CaseId`, `EpisodeId`, `AgreementId`, `CommitmentId`, `RequestId`.
  - `WorldMonth` (continues across presidencies) and `PresidencyMonth`, with converters.
  - The outcome DSL for content: everything `Outcome` can do today, plus new outcome verbs for episode transitions, commitments, transactions, evidence, requests and delayed resolution (see R2 to R8). Please publish it as a typed union so the content linter can check it.
- **Example:** an outcome `{ episode: ['fuel.queue', 'escalate'], commit: { id: 'c.fuel.price', to: 'ty_fuel', object: 'pay arrears of ₦0.4tn by world month 30', verify: 'debt.marketers <= 0' } }`.
- **Required by:** before I convert any event to new verbs. Until then I audit, write family specifications and draft text.

### R2 · Story episodes and repetition identity (07)

- **Requested:** `Episode { id, family, subject, state, opened, beats: { at, kind: 'decision' | 'progress' | 'condition' | 'closing', ref }[], next?, resolution? }`. A director rule that keys repetition on `(family, subject, episode)` rather than file id. Content can declare `family`, `subject` (a selector, as `cast` does now) and per-state beats.
- **Presentation need:** a view that tells me, for an item on the desk, whether it is a new decision, a progress update, a persistent condition or a closing report, so the desk can file them separately.
- **Example:** the fuel family: `queues → shortage → (paid | rationed | imports opened) → closed`. A second shortage in the same episode is a development, not a new file.

### R3 · Requests and favours (05)

- **Requested:** `Request { id, from: PersonId, ambition, object, terms, opened, closed?, status: 'open' | 'granted' | 'refused' | 'substituted' | 'withdrawn' | 'lapsed', history[] }`; a closed request cannot be reopened, only replaced by a new request with a material change (`changedBy: 'offer' | 'appeal' | 'threat' | 'coalition' | 'evidence'`).
- `Favour { id, counterpart, direction, strength, origin, terms?, eligibleUses: UseId[] }` with actions `SETTLE { favourIds, offset, residual }`, `FORGIVE`, `SUBSTITUTE { requestId, offer, accepted }` and `USE_FAVOUR { favourId, use, target }`, each with an availability reason.
- **Example:** Koroye asks for the Port Harcourt dredging contract for a named firm. You refuse; the request closes. Two months later he returns with the dredging firm now offering a 30% lower price (a new request, `changedBy: 'offer'`).

### R4 · Commitments register (05, 06, 16)

- **Requested:** `Commitment { id, parties, object, responsible, resources, due: WorldMonth, conditions, verify (a condition), status, origin (event / bill / settlement), visibility: 'public' | 'private' }`, plus a review beat when `due` arrives that content can write against (`review.<commitmentId>.met | missed | withheld | disputed`).
- **View:** `commitmentsView(s)` grouped by due date, with the government's own contribution to any failure ("₦0.3tn of the ₦0.5tn allocated was not released").

### R5 · Candidates, appointments and conditions (02, 03)

- **Requested:** a named shared pool loaded from content (I will author it), `Candidate { id, career[], expertise, capabilities: CapabilityId[], conditions: Condition[], sponsor, availability, recruitment: 'available' | 'approached' | 'accepted' | 'declined' | 'in office' | 'retired' | 'with opponent' }`, actions `APPROACH`, `APPOINT { office, candidate, acceptTerms }`, `LEAVE_VACANT`, and a breach event when a condition fails.
- **Capability semantics** I need you to define with me: what a capability changes in the engine (for example `capability.debt_restructuring` lowers refinancing cost when used; `capability.port_reform` enables an action).
- **Initial slate:** `proposedSlate(s)` returning a suggested holder per office with alternatives and coalition constraints.

### R6 · Transition and opening (02)

- **Requested:** setup split into steps the engine validates: `Dossier` (claims versus verified state per inheritance), `Route` (`establishment | broad | mobilisation | continuity`), `Financier` (named businessman, small contributors, or none, each with stored consequences), `Mandate` (four outcomes), `Constraint` (optional, stored as a commitment), then `Appointments`. A `startingEffects(setup)` preview that reflects scenario and inheritance overrides, so the UI never shows an effect that will be overwritten.
- **Example:** Reformer's Handover + mobilisation route + small contributors: party bloc lower, street higher, no financier favour owed, campaign promise "keep the subsidy gone" stored as a public commitment.

### R7 · Treasury accounts, transactions and emergency funds (09, 10, 11)

- **Requested:** `Transaction { currency, amount, from, to, type, timing, liabilityChange, ownershipChange, cause }`; `accountsView(s)` separating cash, revenue and expenditure, private activity, external flows and reserves; assets with `ownershipShare, valuationBasis, encumbrances, income, maintenance`; sale methods `auction | expedited | negotiated | concession | lease` with bidders and scheduled settlement.
- **I will author:** the asset register entries, buyers, sale stories and tax/treasury track split (10). I need your agreement on every parameter before it lands.

### R8 · Evidence and forecasts (01, 08)

- **Requested:** `Claim { id, source, subject, at, status: 'claimed' | 'disputed' | 'verified' | 'refuted', evidence[], confidence? }`, `Forecast { by: PersonId, subject, horizon: WorldMonth, predicted, outcome? }` with scoring only at the horizon; an `INVESTIGATE { subject, method }` action that costs time and access.
- **Content need:** a way to write text that refers to a claim and its status, so a report reads "the ministry says 80% complete; the field inspection found 45%".

### R9 · Military (13)

- **Requested:** `Mission { id, theatre, objective, commander: PersonId, resources, readiness, conduct, evidence, state, civilianOutcome }`; named defence leadership as people; readiness, personnel, command and conduct diagnostics separate from theatre security.

### R10 · Authority and institutions (04)

- **Requested:** `authorityFor(s, action)` returning the legal route (`executive | legislative | federal bargain | independent body`), the decision owner and why it is unavailable; institution `culture` (`competent | timid | doctrinaire | captured | slow`) and judge traits (`philosophy, procedure, administration, integrity, pressure`); case outcomes carrying a reasons array that content can phrase.

### R11 · Negotiated programmes and delegation (06)

- **Requested:** `Programme { provisions[], parties, concessions, enforcement, votes, commitments[] }` and `Delegation { minister, objective, budget, discretion, limits, reporting, measures, exceptions }`, with escalation only on exception.

### R12 · Citizens and places (14)

- **Requested:** a small set of persistent groups and named households with state (prices, access, employment, security, power, services) and actions they can take (organise, petition, relocate, switch support). I will author the cast and their lives against it.

### R13 · Succession settlement, afterlife and transfer (16)

- **Requested:** `SuccessionSettlement { candidate, support, publicProgramme, privateExpectations, protections, compliance }`; post-office state and actions; `exportCountry(s)` / `importCountry(blob)` with schema version, RNG state, chronology and a separate predecessor interpretation; errors that explain unsupported versions.

### R14 · History queries and sharing (17)

- **Requested:** causal records with `announced / authorised / financed / delivered` and `originator / completer`; `historyOf(subject)`; deterministic daily seed and shareable verdict data (no invented outcomes).

## Small requests from the event audit (needed sooner than the full contracts)

These come from `EVENT-AUDIT.md`. Each is narrow and unblocks a specific fix.

| ID | Plan | Request | Why | Example |
|---|---|---|---|---|
| S1 | 06, 07 | `getVar('score.<personId>')` returning the minister's current scorecard score, and an op `['target', '<personId>', months]` that stores the score and due month; then `getVar('target.<personId>')` = 0 pending, 1 met, -1 missed, plus a scheduled review beat. | D1: "six months and a target in writing" never returns. I removed the instant +1 credit and set a `target.<id>` flag so nothing is lost; the review event is written as soon as this exists. | `min.failing` → `target` stores score 38, due month 18. At month 18 the review reads `target.min_works`: met if the score rose 10 points, with a line naming any budget line the government withheld. |
| S2 | 18 | An explicit marker for an intentionally private outcome, for example `quiet: '<reason>'` on `Outcome`, honoured by the linter instead of the `news: ['', '']` workaround. | D12: six private outcomes in `content/events/cabinet.ts` use empty headline strings to silence the warning; 20 others raise "lead outcome has no headline". The plan asks for warnings resolved or blanks justified. | `fin.lohor.committee` → `agree`: `quiet: 'An understanding over dinner, never announced.'` |
| S3 | 09, 11 | Fix `fundmove` to `'states'` in `engine/ops.ts`: the amount leaves the fund and is credited nowhere. | D5: `shock.flight` → `defend` ("spend the savings defending the naira") moves half the fund abroad to "states". A reserve sale is needed instead (R7). `fund.raid` and `fund.share` use `'states'` correctly in intent (money given to states), but nothing records the transfer. | Defending the naira: reserves sold, naira bought, fund reduced, recorded as an intervention. |
| S4 | 07 | Carry the cast into queued follow-ups (`queue` entries currently store only `event`, `due`, `when`). | Without it a follow-up about "this minister" or "this governor" re-resolves its cast and may pick someone else. Today I work around it by templating event ids per person. | `{ event: 'min.target.review', after: 6, cast: { WHO: '$WHO' } }` |

| S5 | 07 | `getVar('shock.<id>')`: 1 while that shock is active, 2 once it has passed, 0 never. | D13: content can tell that a shock *happened* (`fired`/`never`), not that it is under way. `grid.collapse` should not fire during the three months of the `blackout` shock, and `debt.gas` should say the plants are down because of it. | `grid.collapse` gains `{ v: ['shock.blackout', '!=', 1] }`. |

| S6 | 02, 12 | Let a scenario start with an operating asset: honour a new optional `Scenario.assets: { asset: string; site: string; condition?: number }[]` in `newGame` (and in inheritance, where the predecessor's assets already carry over). | Plan 02 requires every inheritance to include "a worthwhile functioning asset". Assets today exist only when a big bet succeeds. `content/dossiers.ts` names one per scenario (wheat scheme in Kano, coastal highway in Lagos, export interconnector in Niger, hospital city in the FCT, free-trade hub in Lagos, rice belt in Kebbi). I have not added the field to `Scenario` yet, so nothing claims the asset exists before the engine creates it. | `standard`: `assets: [{ asset: 'wheat', site: 'KN', condition: 0.6 }]` |
| S7 | 18 | A package script for the experience checks, for example `"check:experience": "tsx tests/experience/run.ts"`. | `tests/experience/` is mine; `package.json` is yours. | Runs `dossiers.check.ts` and later checks. |

## Content fixes already made on this branch (no engine change)

D2 (empty fuel reserve), D3 (double metering), D4 (₦6tn headline), D6 (Eurobond headline), D7 (injunction now needs the open contracting rules in force), D8 (tax debate needs the tax reform under way), D9 (the lender's programme says it ends the subsidy and runs the subsidy beats), D12 (two public cabinet outcomes given headlines), and D1 in part (no credit for being put on a target).

## What I am doing while these are pending

- Full per-event audit of all 180 events at the baseline (`event-audit.json` is the starting table; status column moves from "not reviewed").
- Story-family specifications (condition, episode, intervention, response, next development, exit) for electricity, fuel, universities, wages, procurement, industry, cabinet, security, coalition politics and succession.
- The six inheritance dossiers, the four routes to power, the named candidate pool with careers and conditions, judges, military cast, citizen cast, asset and buyer definitions, all as typed content drafts that do not import engine types that do not yet exist.
- Interface layouts for the transition, government selection, requests and favours, commitments, emergency funds, missions, operating projects, citizens and places, succession, post-office and history, built against labelled mocks only.
