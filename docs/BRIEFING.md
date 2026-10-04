# Oga at the Top: a briefing for a second opinion

Written 4 October 2026 to hand to another reviewer, human or model, for a fresh view. It is self-contained: you should not need the code to follow it. The section **Changes since this briefing was written** at the end is kept current as work lands, so this file does not fall behind the game.

What we want from you is at the bottom: **Questions for a fresh reviewer**. Disagree where you think we are wrong.

## 1. The game in one paragraph

A satirical strategy game about being President of Nigeria, played in the browser. One turn is a month, a term is 48 months, a presidency is one or two terms, and the next President inherits the same country: the same debts, half-built projects and unpaid bills, and a former President who still calls. The tone is dry: memos, newspapers (one formal, one in Pidgin), advisers who are sometimes wrong. The premise: you *can* govern well, but doing the right thing and surviving long enough for it to work are two different problems. Corruption is a real, effective choice, not a moral trap.

## 2. What the player does each month

1. **The papers**: two front pages on the same story.
2. **The desk**: one lead file that must be decided (a memo with context, a named adviser's advice and forecast, three or four choices; consequences come back months later), up to two phone messages, and the budget in December.
3. **Moves** (four a month): executive orders, personal appearances, dealings with named people, favours called in.
4. **Free actions**: launch reforms and big bets, pay debts, move money between funds. These cost money or political capital, not moves.
5. **End the month**: the simulation ticks, and every consequence is reported with its cause.

Everything the player can do shows its expected effect before and its measured effect after. Files show an adviser's forecast instead, which can be wrong; advisers keep a visible record.

## 3. The systems, briefly

- **Economy.** Nine national figures (inflation, pump price, treasury, debt service, security, power, state capacity, integrity, jobs), three building pressures (fuel scarcity, labour anger, scandal). Six named debts with different costs, four funds, an oil price, an annual budget the Assembly rewrites, oil dependence that falls as the non-oil economy grows, and a currency with reserves and a street rate.
- **Security.** Six theatres, each with drivers; offensives aimed at a theatre.
- **Politics.** Five blocs (the Villa, the Party, the Street, the Establishment, the Press). About sixteen named politicians with wants that change, grudges and favours owed both ways; five businessmen; three rivals who act on their own; a Vice President from the other half of the country; the former President; a Supreme Court of named justices; federal character (posts must be spread across six zones).
- **Reforms.** 196 reforms in 17 tracks: foundations, deepening, emerging repairs, rival answers and eleven reversals. Some reforms are bad or tempting on purpose. 32 big bets, built in a chosen state, which succeed or fail on named conditions, can be revived once, and run as assets with a manager.
- **Institutions.** An anti-corruption agency and others with heads, budgets and their own files; prosecutions run to a verdict.
- **Events.** About 140 files, each reading the systems and writing back to named people. Shocks arrive unannounced.
- **Elections and the end.** Midterm governorships, a re-election with a state-by-state count and a breakdown of every cause of the margin, or a succession where you groom and back an heir. The verdict grades you against what you inherited, keeps a private ledger of what you took, and decides life after office (elder statesman, investigated, exile, prison).
- **Tooling.** A deterministic engine and a simulator that plays hundreds of presidencies with scripted strategies (reformer, machine politician, institutionalist, populist, kleptocrat, random).

## 4. Balance today (simulator, 40 presidencies per strategy, 4 October, with the cast and the nights)

| Strategy | Re-elected |
|---|---|
| Reformer who reads the advisers' record | about 90% |
| Reformer who times reforms well | about 75% |
| Reformer who trusts advisers | about 65% |
| Populist | about 57% |
| Clean institutionalist | about 55% |
| Machine politician | about 53% (it steals narrow losses on election night, at a heavy cost) |
| Kleptocrat | about 10% |
| Does nothing | 0% |

Noise at 40 runs is about eight points either way. Before the autonomous cast the machine was about 40% and the kleptocrat about 23%: the people they leave cold now act against them.

## 5. What the playtests found

Two kinds of test were run: a scripted autopilot through the browser, and saves built at the right moment (mid-term, an inherited term, a second term) then played by hand-written scripts.

- **Correctness is in good shape.** Every system works end to end in the browser, from charges through verdicts to a succession election. About twenty bugs were found and fixed, mostly about an inherited presidency (the old cabinet carrying over, the winning party's own leader listed as a rival) and about feedback that left things out.
- **Legibility is the problem.** The same symptom kept appearing: the Orders page was 5,900 pixels long on the first day; the succession tab listed nineteen heirs with identical buttons; disabled buttons explained themselves only on hover; a lost succession election was explained in one sentence. Each was patched, but the cause is structural: the game has 42 kinds of player action and 75 executive orders (20 always available, 55 that appear only when their moment comes and then lapse), and most levers come down to "spend capital, nudge a number".
- **What the tests could not tell us** is whether the game is fun. Bots and scripts prove that things work. No human outside the project has played a full term.

## 6. What we have decided to do

A second reviewer's feedback was folded into one plan on 4 October, with the owner's rule that it is delivered with as little code as possible: calculate rather than store, route everything through files, prefer data to code, and add at most one new piece of saved state per workstream.

### 6.1 Phase 1: no new systems (built)

| | What | How |
|---|---|---|
| W1 | **The President's attention.** The Chief of Staff's note becomes a briefing: up to three things that can hurt the government, two openings, and the story everyone is shouting about that probably does not matter. Each line opens the screen where it is dealt with. | Ranks what the game already knows. The "noise" line appears only when the figures under the papers' lead are calm. |
| W2 | **Advisers with a worldview.** Bias is belief, not a hidden trait. Every adviser weighs by their brief; some are openly close to a camp and sincerely count its gain as the country's, so they are right whenever the two agree. Overruled advisers cool on you; a disloyal one may leak. The record shows whom followed advice has helped. | Replaces the secret "serves a patron" switch. |
| W3 | **The era you inherit.** The next presidency inherits changed politics, not just numbers: a divided party, a kingmaker governor, a businessman who now owns a newspaper, an agency that takes no instructions, a power the Supreme Court took away, a defeated reform that is now the received view. | Six rules read from the last presidency, shown on the handover certificate. |

**Gate lifted by the owner (4 October):** everything below was built straight through, without a playtest; the owner is playtesting it.

### 6.2 Phase 2: built 4 October, in order of difficulty

- **Consequence theatre.** Large three-month movements become dispatches from the office that would announce them, crediting the past decision that most pushed the figure, by name and date. The papers' coverage becomes one line on what people are saying about the government.
- **Contextual actions.** A troubled gauge, a worry in the briefing, a decided file and each adviser's card offer the open powers that help, judged from the orders' own effects. The Orders screen stays as the toolbox.
- **Promises.** First-class: a ministry, a post kept, what someone wants, or public pledges (no new taxes, the subsidy, a reform by a date). Kept builds credibility with that person or the public; delayed brings reminders; broken makes a grudge or a headline. The same post promised twice becomes a file when the two compare notes.
- **The cast acts on its own.** Each named politician has aims, a rival they fear, and leverage; each month one or two call, undermine their rival, back yours, leak, court the Vice President, offer help, protest, or make pacts with each other.
- **Set pieces.** One night engine and six nights: coup rumours, the count on a close election night, a strike deadline, a Friday run on the naira, a dam release upstream, a viral video of a minister. Information arrives late, the cast moves on its own beats, options close, decisions cannot be undone, and the truth is told at dawn.

- **The reform library, second edition.** 196 reforms in 17 tracks. Foundations come first (any order on four loose tracks); deepening opens once foundations are delivered or ruled out by a delivered rival. Nineteen repairs appear only when their historical conditions hold. Four pairs of rival answers close each other. Existing laws and programmes carry a statute-book note, with lower capital cost and shorter work. Eleven delivered reforms can be undone for one move, showing the gain and the lasting effects lost; successors inherit the damage and can pay to restore them. The agenda is organised by status, with priorities first and the full library folded by generation. Reforms are wired into courts, convictions, forecasts, arrears, gas debt, bets, campaign money, dependence, protests and nights. Bots choose the first reform whose status is next on each track.

Not done: an interface for a unified people engine, new stat bars, cutting orders (the measurement found almost none always beaten), hundreds more files.

### 6.3 Proposed and not taken (for now)

Mobile-first layout (the audience is overwhelmingly on phones; the game is built for desktop); a shareable verdict card and a daily seed; shorter modes (a hundred days, crisis starts); a history book across several presidencies.

## 7. Constraints any suggestion must respect

- Characters have ordinary Nigerian names that do not belong to public figures. Parties, newspapers, unions and companies are invented. No real organisation is named as a wrongdoer; no real famous quotes.
- No gendered pronouns for any role different people can fill.
- Effects are shown, never hidden; every outcome has a named cause.
- The player must feel powerful: ambition is priced, never capped.
- Corruption is effective, not moralised.
- Nothing static or repeating: options change with the situation.
- Not all reforms are good reforms.

## 8. Questions for a fresh reviewer

1. The autonomous cast is limited to two moves a month so it does not bury the player. Is that the right lever, or should the briefing alone decide what reaches the President?
2. Five verbs for the cast (ally, fund, leak, undermine, bargain): what is missing that Nigerian politics would make obvious?
3. On a disputed election night, which single irreversible decision would you put at the centre, and what should the player know when making it?
4. The era shifts are six rules. Which change in the political world would most make you want to play the next presidency, and is it on the list?
5. Advisers now have open camps and sincere beliefs. Is there still a way for the player to "solve" them, and how would you stop it?
6. Where is the satire weakest: which system is still a spreadsheet wearing agbada?

## Changes since this briefing was written

Kept current as work lands. Newest last.

| Date | Step | What changed |
|---|---|---|
| 4 Oct 2026 | — | Briefing written; consolidation started |
| 4 Oct 2026 | A | A measuring tool (`npm run simulate -- 5 --levers`) gives each order to a copy of a real game state and plays both copies on with the same seed. A first run on 48 states found almost no order that another order open in the same month always beats. The real weakness is different: many orders change little after 18 months. Correction: there are 20 standing orders, not 61; the other 55 already appear only when their moment comes. |
| 4 Oct 2026 | — | Paused by the owner: people will play first, and steps D, B, C and E go ahead only where play shows they are needed |
| 4 Oct 2026 | Plan | The second reviewer's feedback folded into the plan in section 6, delivered with as little code as possible. The consolidation steps are dropped. |
| 4 Oct 2026 | W1–W3 | Phase 1 built: the Chief of Staff's briefing, advisers with a worldview, the era you inherit. |
| 4 Oct 2026 | Phase 2 | Built without a playtest at the owner's request: consequence theatre and what people are saying, contextual actions, promises, the autonomous cast, and six nights on one set-piece engine. |
| 4 Oct 2026 | Reform library | Completed the second edition: agenda by status, generation groups, emerging repairs, closed rivals, statute-book notes, eleven guarded reversal buttons, restoration names throughout play, and status-aware simulator bots. Chapter 0 section 0.4 and the handoff documents now describe 17 tracks and 196 reforms. Checks and balance are recorded below. |

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
