# 10. Technical Architecture and Build Plan

## 10.1 Shape

A static web app. The whole game runs in the browser. There is no server in the first release.

```
Static host (CDN)
   └─ Next.js app, statically exported
        ├─ UI layer        React components, screens, animation
        ├─ UI store        thin; holds the current GameState and view state
        ├─ Engine          pure TypeScript; no React, no DOM, no network
        ├─ Content         events, templates, characters, states: typed data
        └─ Persistence     saves in browser storage
```

**The one rule that matters:** the engine is a pure, deterministic library. Given a state, an action and the seeded generator, it returns a new state. It imports nothing from the UI. Everything else in this chapter follows from that.

## 10.2 Stack

| Concern | Choice | Note |
|---|---|---|
| Framework | Next.js (App Router) with static export | No server features are used. Vite would also do; Next is chosen for routing and a later path to accounts. |
| Language | TypeScript, strict | The content schema is the type system |
| Styling | Tailwind with design tokens from 9.2 | |
| Animation | Motion (formerly Framer Motion) | |
| UI state | Zustand | The store holds state and dispatches to the engine |
| Validation | Zod | Content and saves are validated at load |
| Storage | localStorage for the slice; IndexedDB once worlds hold several presidencies | A long world's archive will outgrow localStorage |
| Tests | Vitest | Engine unit tests and the harness |
| Map | A simplified SVG of state boundaries | Source from an openly licensed dataset; check the licence when sourcing |
| Hosting | Any static host (Cloudflare Pages, Vercel, Netlify) | Verify current free-tier limits at deployment time |

No runtime language model, no database, no accounts in the first release.

## 10.3 Repository layout

```
/app                     Next.js routes: thin; mount screens
/ui
  /screens               Desk, File, Papers, Phone, CabinetRoom, Assembly, ...
  /components            Document, Stamp, Masthead, Portrait, MoodWord, ...
  /store                 Zustand store; selectors
/engine
  state.ts               GameState types
  reduce.ts              applyAction(state, action) → state
  tick.ts                the monthly close: ledger, economy, politics, checks
  director.ts            desk assembly and pacing
  conditions.ts          the condition evaluator
  effects.ts             apply effects, schedule, pressures, flags
  advisers.ts            read selection and confidence
  press.ts               seed → headlines → front page
  assembly.ts            bills, whip counts
  election.ts            vote model, order of declaration
  legacy.ts              grades, epithet, narrative assembly
  rng.ts                 seeded generator
  config.ts              every tuning coefficient in one place
/content
  /events                one file per storyline or group
  /headlines             templates per outlet
  /characters            cast, archetype pools
  /data                  states, zones, starting scenario
  /legacy                epithets, narrative fragments
  schema.ts              Zod schemas mirroring chapter 5
/tools
  lint-content.ts        the content linter
  simulate.ts            the balance harness
/docs/gdd                this document
```

## 10.4 Engine design

### State and actions

```ts
type Action =
  | { type: 'DISMISS_PAPER' }
  | { type: 'CHOOSE'; eventId: string; choiceId: string }
  | { type: 'IGNORE_MINOR'; eventId: string }
  | { type: 'TAKE_ACTION'; action: PresidentialAction }
  | { type: 'SET_BUDGET'; budget: BudgetSubmission }
  | { type: 'APPOINT'; role: Role; characterId: string }
  | { type: 'END_MONTH' };

function applyAction(state: GameState, action: Action): GameState;
```

The UI never mutates state and never computes game logic. It renders a state and dispatches actions.

### Why purity pays

- **Saves** are the state serialised. Loading is deserialising and validating.
- **Bugs** reproduce from a save and a list of actions.
- **Balance** can be tested without a browser (10.6).
- **A server** can later run the same engine to verify shared records, with no rewrite.

### View models

The engine exposes selectors that return what the player is *allowed to see*: mood words, stale statistics, adviser lines, estimated whip counts. The UI is never handed hidden values. This keeps the imperfect-information design from being broken by a convenient shortcut in a component.

### Config

Every coefficient named in chapter 2 lives in `engine/config.ts`. Tuning is changing numbers in one file and re-running the harness.

## 10.5 Content pipeline

- Events are TypeScript objects conforming to the schema in 5.2, grouped in files by storyline.
- At build time, `lint-content` runs the acceptance rules in 5.2: every reference resolves, every choice has a news seed and an archive entry, every event has a delayed consequence, grave events contain no farce templates, no effect targets a bloc directly.
- A second pass builds the **storyline graph** for each chain and reports dead ends, unreachable steps and steps with no exit.
- The build fails on a lint error. Content errors must be impossible to ship.

### The writer's room

Not built until content passes roughly a hundred events. When it is:

- A private web form over the same schema, with dropdowns for flags, roles and variables drawn from the live definitions.
- A storyline graph view.
- A preview that renders the file, the adviser reads under different cabinet qualities, and the six headlines.
- Output is the same typed data, committed to the repository. No content database is needed until non-developers are writing daily.

## 10.6 The balance harness

A command-line tool that plays thousands of presidencies with scripted strategies and reports distributions. This is how "difficult, not impossible" is tested instead of asserted.

**Bots:**

| Bot | Strategy |
|---|---|
| Random | Picks uniformly. Baseline. |
| Populist | Always the option best for approval now. Never refuses a debt. |
| Reformer | Front-loads hard reforms, funds social protection, invests in capacity. |
| Machine politician | Maximises Party and Establishment standing; pays every debt. |
| Institutionalist | Never takes a shortcut; always obeys courts; picks public service reform. Never opens the drawer. |
| Kleptocrat | Fills the purse from every source; spends it on votes, delegates and the campaign; keeps the rest. |
| Pragmatist | Clean personally; uses political finance and tolerates allies when survival requires it. |
| Do-nothing | Convenes stakeholders every month; always picks the committee. |

**Targets the design must hit:**

| Claim | Test |
|---|---|
| Good governance is possible | Reformer finishes with most national indices above inheritance in a clear majority of runs |
| Good governance is not free | Reformer's re-election rate is well below Populist's |
| Populism has a bill | Populist wins re-election often and leaves fiscal stability graded Weaker or Squandered in most runs |
| Institutions compound | Institutionalist's second term outperforms its first by a visible margin |
| Drift is punished | Do-nothing survives a first term more often than not, and scores Held or Weaker nearly everywhere |
| Corruption works | Kleptocrat's rate of surviving and winning a second term is among the highest of any bot |
| Corruption has a bill | Kleptocrat leaves state capacity and institutional strength graded Weaker or Squandered in most runs, ends with several witnesses holding leverage, and is probed by a successor in a substantial share of worlds |
| Clean is viable | Institutionalist completes a term in a clear majority of runs and wins re-election in a meaningful minority |
| No dominant strategy | No bot leads on more than half of the ten legacy dimensions |
| Removal is rare and earned | Removal occurs in a small minority of non-random runs, and never without three turns of warning |
| Pacing holds | Tone and category rules from 1.5 are never violated |
| Content is used | No event fires in more than a set share of runs or in none |

Exact thresholds are set once the slice exists and real distributions can be seen.

## 10.7 Saves

- Format in 8.6. Every save carries a `version`.
- A migration function per version bump. Old saves load or fail with a clear message; they never load wrongly.
- Autosave on every phase change. Three world slots.
- Export and import as a file, which gives a manual backup and a route to device transfer before any cloud feature exists.

## 10.8 Performance and offline

- Text content for the full first release is well under a megabyte compressed. Art and audio dominate; portraits ship as AVIF or WebP at two sizes.
- Rooms are code-split. The desk, file, papers and phone load first.
- After first load the game needs no network. Adding a service worker and a manifest makes it installable as a PWA; this is a small task and belongs after the slice.

## 10.9 Later, when a backend earns its place

A backend is justified by features, in this order:

1. **Shared presidency records** with a public link and image.
2. **Cloud saves** across devices, which needs accounts.
3. **Aggregate statistics** ("38% of presidents removed the subsidy in their first year"), which is good content for the papers.
4. **Challenges:** a fixed seed and inheritance that everyone plays.

A hosted Postgres service with authentication covers all four. Because the engine is pure, a serverless function can replay a submitted action list to verify a record before it is published.

---

# Build Plan

## 10.10 The vertical slice

The first playable. It answers two questions: **is a term of this fun, and does the world remembering make a player want another presidency?**

The slice therefore does not stop at the first election. It runs a full presidency (one or two terms), the handover, and into the next president's first year in the same world. A first term is 45 to 60 minutes; a two-term presidency is about two hours. This roughly doubles the content the slice needs compared with a single-term slice, and that cost is accepted because inheritance is the game's central promise and cannot be judged without it.

### In the slice

| System | Slice version |
|---|---|
| President | Name, portrait, party, home state, background. One mandate (narrow win). |
| Term | First term, election, and a second term if won. Legacy verdict at the end of the presidency, however it ends. |
| Succession | The player continues as the next president in the same world. Carries over: nation variables, pressures, world flags, liabilities, exposure records, the archive. The former president appears as an elder. |
| Scenario | The Standard Inheritance only. The scenario is a data file from the start, so the other five (2.9) are content, not code. |
| Month loop | All five phases |
| Nation variables | 6: inflation, petrol price, fiscal space, security, power, capacity. Hardship derived. |
| Pressures | 3: fuel supply stress, wage grievance, scandal heat |
| Politics | Five blocs simulated at bloc level (no actors yet). Approval national with six zone values. Political capital. |
| Characters | 3 with full attributes and memory: Chief of Staff, Special Adviser (the translator), Finance Minister (appointed from three candidates). Others appear as names in text. |
| Events | About 50. The three storylines and the items marked ◆ in 5.9 (about 30), plus second-term material (succession, lame-duck files, promises coming due: about 10) and inheritance material written with `inherited` variants (about 10). Recurring events and state-driven text variants carry the repetition across 96 months. |
| Corruption | The drawer with two sources (security vote, preferred contractor) and three uses (Assembly logistics, campaign, keep). Exposure records, witness leverage, and the successor's probe decision. |
| Absurd events | Four, built to the transformation rule in 5.11 |
| Adviser reads | Yes, with confidence labels |
| The ledger and the trace | Yes. This is the heart of the design and must be in the slice. |
| Actions | 4: address the nation, tour a zone, order an audit, convene stakeholders |
| Press | One front page a month with headlines from two outlets (the broadsheet and the youth outlet), authored only |
| Names | The registry and the naming protocol (3.13) are in force from the first event written |
| Budget | Not in the slice. Fiscal space moves by events. |
| Assembly | Not in the slice as a system. Appears in events. |
| Election | State-by-state model from zone approval and lean; election night screen |
| Legacy | Six dimensions against baseline, epithet, three-paragraph narrative, the private ledger, archive timeline |
| Screens | Title, transition, desk (with the drawer), file, papers, phone (messages only), archive, election night, verdict, History of Presidents |
| Save | localStorage, autosave |

### Deliberately not in the slice

Agenda tracks, budget, cabinet room, bill tracker, situation room map, power map, WhatsApp groups, debts, federal character, projects, six outlets, the investigative clock, alternative scenarios, character ageing and replacement.

The slice keeps the four things that make this game different from a card-swiping clone: **adviser reads instead of numbers, consequences that arrive later with a trace, a verdict judged on more than survival, and a successor who inherits all of it.** If those work with 50 events, the rest is depth. If they do not, no amount of depth will rescue it.

## 10.11 Phases

Each phase ends with something that can be evaluated. No phase is "infrastructure only" beyond the first.

### Phase 0: Engine and proof of memory

- Repository, tooling, types for state, conditions, effects, the ledger.
- Seeded generator, the reducer, the monthly tick for the six slice variables.
- Five events from the Subsidy storyline, end to end.
- A text-only harness that plays 48 months and prints the archive and one trace.

**Exit test:** a printed trace in month 20 correctly lists a decision from month 3.

### Phase 1: The desk loop

- Design tokens, the Document component, stamps, letterhead.
- Transition screens, the desk, the file with advice and trace tabs, the result.
- End of month, autosave, reload.

**Exit test:** a person can play twelve months in a browser with the five events repeating, and it already feels like a presidency and not a form.

### Phase 2: Slice content and endings

- First-term events to about thirty; three characters with memory; the translator's lines.
- The Director with pacing rules.
- Papers with two outlets. Phone messages. Four actions.
- The drawer, exposure records and leverage. Four absurd events.
- Election model, election night, archive screen.
- Content linter in the build, including the name registry check.

**Exit test:** a complete first term, start to election night, in 45 to 60 minutes.

### Phase 2b: The second term and the handover

- Second-term rules (no honeymoon, draining authority) and about ten second-term events.
- Legacy verdict with the private ledger. History of Presidents.
- Succession: create the next president in the same world; inheritance of state, flags, liabilities and exposure; about ten events with `inherited` variants; the former president as an elder; the probe decision.

**Exit test:** a trace in the second presidency names a decision made by the first.

### Phase 3: Playtest and balance

- The harness with the eight bots against slice content.
- Five to ten people play it unassisted. Watch for: do they read the advice, do they notice the trace, do they laugh at the statements, do they start a second run.
- Tune coefficients; rewrite the events that did not land.

**Decision gate.** Continue only if players start a second presidency without being asked. If they do not, the problem is in the loop or the writing, and more systems will not fix it.

### Phase 4: Governing

Agenda tracks and milestones · the budget · the ten-portfolio cabinet with appointment, vetting and confirmation · the Cabinet Room · debts and federal character · bills and the Assembly screen · full action list.

**Exit test:** the Reformer and Populist bots produce the divergent outcomes in 10.6.

### Phase 5: The world

All 22 variables and 9 pressures · actors inside blocs and the Power Map · the Situation Room map · six outlets, templates and the investigative clock · WhatsApp groups · projects · the full corruption system (all sources and uses, offshore exposure, selective prosecution) · the five further starting scenarios · character ageing and replacement across presidencies · content to the eighty in 5.9 and beyond.

**Exit test:** three consecutive presidencies in one world, with a trace in the third that names the first.

### Phase 6: Reach

PWA · shareable records · sound · art pass on portraits and mementos · the writer's room · then, and only then, a backend.

## 10.12 Risks

| Risk | Mitigation |
|---|---|
| **Content volume.** The engine takes weeks; the writing takes months. The two-term slice needs about 50 events. | The schema and linter are built first so writing is never blocked on code. Phase 2 can be playtested as a single term while Phase 2b content is written. |
| **Corruption becomes the dominant strategy,** or reads as the game's recommendation. | Harness targets in 10.6: it must work and it must cost. The drawer is never highlighted, and the Institutionalist target guarantees a clean path. |
| **An absurd event is traceable to a real person.** | The transformation rule in 5.11, fictional agencies wherever wrongdoing is alleged, and review of every absurd event against its source. |
| **Hidden information feels unfair.** | Adviser confidence labels, the trace after the fact, and the three-turn warning before any ending. Test for this explicitly in Phase 3. |
| **Tone slips** into cynicism or into mockery of victims. | Tone is a schema field with lint rules, and a named reviewer reads every grave event. |
| **Balance collapses** to one dominant strategy. | The harness and the "no bot leads on more than half the dimensions" target. |
| **Scope creep** before the slice is proven. | The Phase 3 gate. Nothing from Phases 4 to 6 starts before it. |
| **Resemblance to real people.** | The naming protocol and registry in 3.13, enforced by the linter; a lawyer's review before commercial release. |
| **It looks like a dashboard.** | The view-model rule (the UI cannot access raw numbers for politics) and the document-first component set. |

## 10.13 First tasks

In order, when building starts:

1. Scaffold the repository and tooling.
2. Write `engine/state.ts`, `conditions.ts`, `effects.ts`, `rng.ts` with tests.
3. Write `content/schema.ts` and the linter.
4. Author the Subsidy storyline's first five events against the schema.
5. Write `tick.ts` for the slice variables and the ledger.
6. Run the text harness and read a trace.

Everything visual waits until step 6 produces a trace worth showing.
