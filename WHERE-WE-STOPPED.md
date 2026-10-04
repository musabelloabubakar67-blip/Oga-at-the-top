# Where we stopped

Written 2 October 2026, at commit `cebfcfe` on `main`; the plan below added 3 October 2026. Read this first when picking the project up in a new session, then read [docs/gdd/00-as-built.md](docs/gdd/00-as-built.md), which describes the game as it is in the code.

## What this is

*Oga at the Top*: a satirical Nigerian presidency strategy game for the browser. Next.js 15 static export, React 19, TypeScript strict, Tailwind 4. The engine in `engine/` is pure and deterministic (`applyAction(state, action)`, seeded random numbers held in the state). Everything authored is data in `content/`.

## Run and check

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run typecheck
```

```bash
npm run lint:content
```

```bash
npm run simulate -- 40 --probe
```

Other simulator modes: `-- 12 --scenarios`, `-- 4 --world`, `-- --trace`. Run the type-check, the content lint and one simulator pass after any change to content or the engine.

## What is built

- Six named debts, four funds, an oil price, an annual budget, the states' share of revenue.
- Six security theatres with drivers and a focus.
- Sixteen named politicians (governors, senators, ministers with scorecards), five businessmen, three rivals who act, and a two-way ledger of favours.
- 196 reforms in 17 tracks. Foundations go in order (any order on four loose tracks); deepening opens once they are settled. Nineteen repairs emerge from history, four rival pairs close each other, existing laws carry statute-book notes, and eleven delivered reforms can be reversed for one move and restored by a later President. The agenda leads with status sections and folds the full library by generation.
- 32 big bets with named conditions for success, 16 of them opened by reforms.
- 132 event files. All of them read the systems above, offer choices that depend on them, and write back to named people and balances.
- Four newspapers, two printed each month.
- Six starting scenarios, playing on as the next President in the same country, and an election tribunal (a narrow win is petitioned; a narrow loss can be petitioned or bought).
- Saves carried forward by `engine/migrate.ts`.
- The setup screen laid out as a certificate of return with four schedules.

## Commits so far

| Commit | What |
|---|---|
| `15c6376` | Baseline two-term slice |
| `8b92452` | Rebuild around named causes and named people |
| `e084bbf` | Design documents brought up to date |
| `7600c8b` | Scenarios, successor play, tribunal |
| `eaf4dff` | Older event files rewritten to use the new systems |
| `cebfcfe` | Four any-order reform tracks; certificate redesign |

## Not verified

- Twelve event files never arise in simulator play, because the bots never give the orders that cause them (VAT, price freeze, printing money, duties, service chiefs among them). They pass the lint and type-check but have not been played.
- No reform from the four new tracks has been played to delivery in the browser; only the simulator has run them.
- The tribunal ruling has only run in the simulator. The petition file was opened in the browser.
- `npm run build` has not been re-run since the event rewrite.

## Balance at this commit (30 to 40 presidencies each)

| Strategy | Re-elected |
|---|---|
| Reformer, flawless play | 100% (83% in The Morning After) |
| Machine politician | about 60–70% |
| Clean institutionalist | about 27–38% |
| Kleptocrat | about 17–20% |
| Populist | about 13–15% |
| Random, do-nothing | 0% |

Open questions: the flawless reformer never loses outside one scenario; the populist may now be too weak; the institutionalist dropped after the new tracks were added. No hand-played balance pass has been done.

## Plan agreed on 3 October 2026

This replaces the list under "What to do next" below, which is kept for its detail. Phases run in order; each ends with type-check, content lint, a simulator pass compared with the last, chapter 0 updated, and a commit.

| Phase | What | State |
|---|---|---|
| 0 | Baseline: build, lint, simulator table | Done |
| 1 | Security theatre by theatre; offensive aimed at a theatre | Done |
| 2 | Effects calculated from the state (with their reasons); standing policies charged monthly against the economy; dials on national orders; a lasting effect for the 11 reforms that have none | Done |
| 3 | Done. People who change: wants drawn from situation and loyalty (about 12 templates by role plus each person's signature want), appetite that grows, refusals that become grudges; ministers whose true character surfaces, who build a following; three files for the first Finance pick | |
| 4 | Done. 4a: institutions; every order given a dial, context or lasting effect. 4b: sixteen orders aimed at a governor, senator, businessman, rival, paper or zone (ten converted, seven new); hostile ones wear out and are remembered for two years; a Supreme Court of seven named justices with vacancies, Senate confirmation, challenges to hostile orders, injunctions against contested reforms, and the election petition decided by the bench | |
| 5 | Done. Any of the named cast can be groomed and backed, with strength, loyalty and integrity shown; life after office from elder statesman to prison or exile, decided by what can be found and who protects you; delivered reforms attacked by businessmen, governors, the Senate and the courts; a tension curve in the director | |
| 6 | Done. A table of all 37 states with how each would vote today and what has been put there; seventeen big bets built in a chosen state, running as assets under a manager with returns, upkeep, capture and an effect on the state's vote, or leaving an abandoned site | |

The UI redesign for desktop is done (owner, 3 October): six sections behind a rail, a top bar with previews, a coming-up strip, aimed orders on people cards, a tile map. Chapter 0, section 0.1, describes it.

Added after the budget (owner, 3 October): the rice reserve fix, the refinery minister chain and the honest refinery bet, the Finance Minister's oil forecast, the naira (rates, reserves, three central bank stances, a strong economy strengthening it), and the talking-points audit (rivals, your people, editorials, the Chief of Staff and five phone messages now speak to the new systems). Balance after all of it (100 each): flawless reformer 75%, any-order reformer 54%, Machine 63%, Institutionalist 46%, Populist 34%, Kleptocrat 14%. Open: the Institutionalist and Kleptocrat have fallen (60% and 23% before the naira); the currency alone accounts for 3 to 5 points of that, the rest is unexplained and needs a closer look. No human has yet played a full term on the new screen.

The budget was rebuilt (owner, 3 October): inflation shrinks it, points have diminishing returns and are worth more where the problem is worse, ministries spend only part of each increase (by the minister's competence and the cash in hand) and lines can be rushed or held, works money is sited by zone, the Assembly sends back its own version with insertions (sign, split or veto), cuts below last year are felt, and a supplementary budget can be passed when oil moves $12. Chapter 0, Oil and the budget. Balance after it (100 each): flawless reformer 82%, any-order reformer 52%, populist 36%, institutionalist 60%, machine 63%, kleptocrat 23%.

Balance after phases 4b to 6 (100 each): flawless reformer 80%, any-order reformer 67%, institutionalist 64%, machine 63%, kleptocrat 29%, populist 28%. Machine was 67% before rival attacks drew sympathy back. The populist moves between 23% and 35% with small changes (noise at 100 runs is about ±5); it loses on hardship (73 to 79), which may be the right lesson or may be too harsh: the owner's call. After office: reformers end as elder statesmen, the machine mostly on trial or investigated, the kleptocrat in exile (it moves money abroad), the populist investigated about half the time.

Batch of 4 October (owner): shocks at even odds and impossible to miss; a talent pool of 48 for every appointment, with refusals, flattering files and background checks; institutions with an inside (ramp-up, a running record, funding dial, heads per job, their own files); oil dependence computed from its causes (75% at the start, about 40% after two strong reforming terms; it scales oil gaps and windfalls, adds budget points and non-oil dollars); the four any-order tracks rewritten with items that matter (census, governors' compact, gas buses, wage deal, northern border, amnesty, loot register, crop exports, cheap remittances, and the kept items given lasting effects); failed big bets revivable once; inherited presidencies' files checked against the world they fire in (`mine.<id>`, `pred.drawer`). Not built from the talent-pool discussion: a sacked appointee who talks to the press. Then: prosecutions followed to a verdict (`engine/cases.ts`), running assets with records, expansion and manager changes in the big-bets panel, and the asset-declaration check narrowed to money taken for yourself. Balance after all of it (60 each): flawless reformer 80%, any-order 62%, institutionalist 62%, machine 42%, populist 38%, kleptocrat 13%. Open, for the owner: the machine was about 70% before this batch; it lost the patronage items (six new states, national airline, fixed pump price) and the governors' compact does not replace them.

Parked: the Vice President, the military as a political actor, lenders with conditions, the exchange rate, intelligence that can be wrong.

Owner decisions, 3 October: the flat security bonus comes off the security reforms; life after office can end the game badly; wants use role templates plus one signature want each.

Balance pass done on 3 October (60 each): reformer 88%, machine 55%, kleptocrat 43%, institutionalist 32%, populist 23%. The owner chose to leave the kleptocrat where it is. Reformers then got pain before payoff on fourteen reforms: a flawless reformer that times them wins 88%, one that takes reforms in any order 62%. Keeping the subsidy or ignoring debts still costs a flawless reformer almost nothing; that is open. Shocks were then added (the owner asked not to be told what they are; see `content/shocks.ts`): flawless reformer 77%, any-order reformer 63%, machine 73%, institutionalist 40%, kleptocrat 33%, populist 30%. Chapter 0, section 0.7 and the tools table, has the mechanics and the numbers.

Phase 3 added advice that can mislead (owner's rule change: forecasts before, what happened after), wants that change, ministers' arcs and the first Finance Minister's files. Balance after it (100 each): reformer 79%, any-order reformer 53%, trusts advisers 73%, checks the record 84%, institutionalist 45%, machine 55%, populist 34%, kleptocrat 30%. Owner decisions: forecasts on files only; a pool of six replacement advisers (built; each name searched on 3 October); judges in phase 4.

Every phase must teach the simulator bots its new actions, or the balance table stops meaning anything. Do the full balance pass after phase 2, not before.

## What to do next

The reform-library implementation is complete locally on `claude/handoff-review-0txtze` (4 October); publishing is blocked (see Publishing status). The historical list below predates that work; chapter 0 section 0.4 governs the current reform system. The owner playtests the new screen. In rough order of value:

1. Play the new tracks by hand and tune the nine tempting reforms so that each is a real temptation, not an obvious trap.
2. Event files that react to the new reforms (what happens after six new states, a fixed pump price, closed borders, the falsehood law).
3. Big bets opened by the new tracks.
4. A balance pass on the populist and the reformer.
5. Play the twelve unplayed event files.
6. Bad or double-edged reforms inside the ten sequential tracks. This needs a design decision first, because a sequential track is blocked by an item the player refuses.
7. Not built at all: onboarding, sound and art, courts beyond the tribunal, ministers beyond the six.

## Standing rules from the owner

These were given across several playtests and are not up for re-opening.

- **Chapter 0 governs.** `docs/gdd/00-as-built.md` is the source of truth. Keep it current when a system changes. Chapters 01 to 10 are the original design with a note on where the build differs.
- **Names.** Characters have ordinary Nigerian names. Every full name must be searched on the web (`"First Surname" Nigeria`) before use and replaced if the search finds a public figure. The owner's words: "character names should never collide with real public figures. I'm not trying to get sued" and "give characters normal nigerian names. just not known real life names". Parody surnames were tried and rejected. Parties, newspapers, unions and companies keep invented names. The registry is `content/names.ts`.
- **No gendered pronouns** for any slot that different people can fill (cast files, replaceable ministers).
- **Never name a real organisation as a wrongdoer, and never reuse a real person's famous quote.**
- **Effects are shown, not hidden.** No silent caps. Every outcome needs a named cause and, where possible, a named person.
- **The player must feel powerful.** Big levers, visible progress, a world that remembers. Ambition is priced, never capped.
- **Corruption is a real and effective choice**, not softened or moralised.
- **Nothing static or repeating.** Lists of things to do change with the situation. A crisis must not contradict a reform already delivered. Before keeping any recurring file, ask what the player could have done to stop it.
- **Not all reforms are good reforms.** The leader has to choose carefully.
- **Do not restart brainstorming.** Challenge weak ideas and make decisions.
- **Finish the approved list before reporting.** Do not present deferred items as a status.
- **Keep estimates tight** and offer the streamlined version first.
- **Push only when the owner approves.**

## How the work has been done

- Content edits to event files were made with small Node scripts that require every anchor to match exactly once, so a failed edit stops loudly instead of landing in the wrong event. Events in `content/events/minor.ts` and the phone section of `reactive.ts` open with `...phone, id:` and need the event boundary found by the next top-level `{`.
- The local preview runs on port 3417 (`.claude/launch.json`, name `oga`). Button labels are uppercased by CSS, so match text case-insensitively when driving the page.
- The game saves to the browser under `oatt.save`; past presidents are under `oatt.history.v1`. Back these up before testing in a browser the owner also plays in.
- Line endings: the repository is edited on Windows. Git warns about LF to CRLF; the warnings are harmless.

## Reform-library verification, 4 October 2026

40 presidencies per strategy, seeds `1000 + i * 7919`, Standard Inheritance. The old-selector column reruns the branch's handoff state with the original bot selection; the final column uses the first reform whose `milestoneStatus` is `next`. The handoff table was recorded before the second-edition library was balance-tested. Rates below are exact counts out of forty (the simulator rounds its display).

| Strategy | Handoff table | Branch, old selector | Final | Mean delivered, old → final |
|---|---|---|---|---|
| Reformer, checks the record | 90% | 90% | 92.5% (37/40) | 58.5 → 59.4 |
| Reformer | 75% | 82.5% | 82.5% (33/40) | 55.0 → 55.1 |
| Reformer, trusts advisers | 65% | 70% | 70% (28/40) | 38.5 → 38.4 |
| Populist | 57% | 27.5% | 27.5% (11/40) | 15.5 → 15.5 |
| Institutionalist | 55% | 70% | 70% (28/40) | 28.6 → 28.6 |
| Machine | 53% | 57.5% | 60% (24/40) | 15.3 → 15.3 |
| Kleptocrat | 10% | 10% | 10% (4/40) | 4.3 → 4.3 |

Generation-2 costs were left unchanged in `content/tracks4.ts`: the reformer does not deliver many more reforms after the bot fix (55.0 → 55.1; checking the record 58.5 → 59.4). The larger Populist fall and Institutionalist rise relative to the handoff table are already present with the old selector, so this completion does not explain them. They remain balance questions for the owner; no engine mechanics were retuned. Forty runs carry roughly eight percentage points of sampling noise; these are bot results, not a human assessment of difficulty or fun.

Checks passed: `npm run typecheck`, `npm run lint:content` (19 existing missing-headline warnings), the seven-bot `npx tsx tools/simulate.ts 40` pass, and `npx tsx tools/simulate.ts 3 --world` (three worlds, twelve presidencies). Separate the bot names in `ONLY` with `|`, because two names contain commas. `npx tsx tools/check-reforms.ts` also checks 196 unique ids and the retired-id list, foundation gates, all four rival pairs, emergence, all eleven reversals, move guards, determinism, inherited restoration names, public promises and upcoming items.

The world bots do not choose `REVERSE`, so the world run alone does not exercise voluntary reversal; focused regression fixtures cover all eleven reversals across a handover. No browser playtest was run, as requested. Visual layout, browser interactions and human balance remain for the owner. The production build and static export passed with `npm run build -- --turbopack`. The default Webpack build could not be verified here: Webpack rejects the `!` in the Windows workspace path; a clean-path copy was denied by the environment. Twenty-seven files did not fire in the seven-bot balance pass, so that pass does not verify every authored event.

## Publishing status

Implementation and verification are complete locally on `claude/handoff-review-0txtze`. Publishing is pending: terminal `git push` failed, and the connected GitHub write returned `MCP tool call requires approval, but approval policy is never`. The remote branch is still at `ea4b2dee81ff681e2d796ce91d77cac5f2b76dbb`. No pull request was opened. Push these local commits from a session that permits repository writes.
