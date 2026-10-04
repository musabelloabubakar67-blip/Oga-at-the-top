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
- **Reforms.** 70 reforms in 14 tracks, ten of them sequential. Some reforms are bad or tempting on purpose. 32 big bets, built in a chosen state, which succeed or fail on named conditions, can be revived once, and run as assets with a manager.
- **Institutions.** An anti-corruption agency and others with heads, budgets and their own files; prosecutions run to a verdict.
- **Events.** About 140 files, each reading the systems and writing back to named people. Shocks arrive unannounced.
- **Elections and the end.** Midterm governorships, a re-election with a state-by-state count and a breakdown of every cause of the margin, or a succession where you groom and back an heir. The verdict grades you against what you inherited, keeps a private ledger of what you took, and decides life after office (elder statesman, investigated, exile, prison).
- **Tooling.** A deterministic engine and a simulator that plays hundreds of presidencies with scripted strategies (reformer, machine politician, institutionalist, populist, kleptocrat, random).

## 4. Balance today (simulator, 60 presidencies per strategy)

| Strategy | Re-elected |
|---|---|
| Reformer who times reforms well | about 80% |
| Reformer taking reforms in any order | about 62% |
| Clean institutionalist | about 62% |
| Machine politician | about 42% |
| Populist | about 38% |
| Kleptocrat | about 13% |
| Does nothing | 0% |

The owner has decided to leave the machine politician and the successor penalty where they are.

## 5. What the playtests found

Two kinds of test were run: a scripted autopilot through the browser, and saves built at the right moment (mid-term, an inherited term, a second term) then played by hand-written scripts.

- **Correctness is in good shape.** Every system works end to end in the browser, from charges through verdicts to a succession election. About twenty bugs were found and fixed, mostly about an inherited presidency (the old cabinet carrying over, the winning party's own leader listed as a rival) and about feedback that left things out.
- **Legibility is the problem.** The same symptom kept appearing: the Orders page was 5,900 pixels long on the first day; the succession tab listed nineteen heirs with identical buttons; disabled buttons explained themselves only on hover; a lost succession election was explained in one sentence. Each was patched, but the cause is structural: the game has 42 kinds of player action and about 61 standing orders, and most levers come down to "spend capital, nudge a number".
- **What the tests could not tell us** is whether the game is fun. Bots and scripts prove that things work. No human outside the project has played a full term.

## 6. What we have decided to do

### 6.1 Consolidate without losing depth (in progress)

Depth here means the number of strategies that work and how much choices interact, not the number of buttons. The test for each lever: *does it ever create a decision no other lever creates?* Three rules:

1. **Cut only what is always beaten.** A lever bots rarely use may be situational; it moves into the time-limited offers that appear only when their moment comes.
2. **Share the way of acting, not the results.** One panel for people, but what an action costs and does stays specific to the person.
3. **Never take away the player's choice of timing.** Buttons stay, folded; files are added for the moment acting matters most.

Five steps, in order:

| Step | What |
|---|---|
| A | The simulator reports how often each lever is used and what it achieves per point of capital |
| D | Standing orders cut from about 61 to about 25; situational ones become time-limited offers |
| B | One way of dealing with people: court, reward, pressure, use, with the consequences specific to each person |
| C | Big bets and institutions share one card: fund it, change who runs it, shut it, with an institution's head and patron kept |
| E | Files that arrive when acting matters (a long court vacancy, a failing asset, a case worth backing), with the buttons still available |

Checks after each step: every effect reachable before is still reachable; the strategies above keep distinct results and win rates (if they converge, the change flattened something and is reverted).

### 6.2 Next, after consolidation

- **The cast acts on its own.** People pursue agendas without being asked: the VP undermining the heir, ministers leaking against each other, a governor playing the President against the opposition. Step B is the foundation: one model for people means everyone can act with the same verbs, aimed at the President or at each other.
- **Set pieces.** Election night is the best moment in the game because it breaks the monthly loop (declarations arrive slowly, the close ones last). Add a few crises played hour by hour: a coup rumour overnight, fuel-queue riots, a kidnapping with a deadline.
- **Advisers with agendas.** Advisers already have forecast records. Some will skew advice towards their own interest in ways a careful player can detect, so that reading advice becomes a skill.

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

1. Is consolidation the right first move, or would you test with players before cutting anything?
2. Of the three rules in 6.1, which do you think is most likely to fail in practice, and how would you catch it?
3. "One way of dealing with people with four verbs": is that too abstract for a satire that lives on specifics? What would you do instead?
4. What would make an hour-by-hour crisis feel different from a normal file, mechanically, not just in pacing?
5. How should a player detect an adviser's bias without it becoming a puzzle with one answer?
6. What is missing that would make someone play a second presidency?
7. Where is the satire weakest: which system is a spreadsheet wearing a costume?

## Changes since this briefing was written

Kept current as work lands. Newest last.

| Date | Step | What changed |
|---|---|---|
| 4 Oct 2026 | — | Briefing written; consolidation started |
