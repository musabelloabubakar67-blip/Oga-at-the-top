# 1. Structure and Turns

> **As built.** This chapter is the original design. [Chapter 0](00-as-built.md) describes the game in the code. The main differences here:
>
> - A month has four moves (three to five with the state of the Villa), not a single action. Reforms, big bets, debt payments, fund movements and the budget cost no move.
> - The budget is a set-piece every December and blocks the month until it is signed.
> - Half-way through each term three states elect governors, and the result is scored.
> - The transition is one screen: name, form of address, party, home state, background (which sets who financed the campaign), four priority tracks and a Finance Minister.


## 1.1 Time

| Unit | Definition |
|---|---|
| Turn | One calendar month |
| Year | Twelve turns. The fiscal year is January to December |
| Term | 48 turns: June of year 1 through May of year 5 |
| Presidency | One or two terms (constitutional limit) |
| World | An unbounded sequence of presidencies sharing one persistent state |

The first presidency is sworn in on 29 May 2027. Turn 1 is June 2027.

Target play time is 45 to 60 seconds per month and 45 to 60 minutes per term. Quiet months must exist; a month with one file and no drama takes twenty seconds and is what makes the loud months land.

## 1.2 Before turn 1: the transition

A short setup sequence, framed as the weeks between the election and the inauguration.

0. **Choose the inheritance** (new worlds only). One of the starting scenarios in 2.9. In a continuing world this step is skipped: the inheritance is whatever the last president left.
1. **Create the president.** Name, portrait, home state, party name and colour.
2. **Background.** Sets starting modifiers and the number of political debts owed (see 3.7).

   | Background | Starts stronger | Starts weaker | Debts |
   |---|---|---|---|
   | Former governor | Party, governors, clout | Integrity perception | 5 |
   | Technocrat | Investor confidence, adviser accuracy | Party, National Assembly | 2 |
   | Career legislator | National Assembly, bill speed | Villa discipline | 4 |
   | Outsider | Street, press goodwill | Party, Establishment | 1 |

3. **Mandate.** This is the difficulty setting, expressed in fiction.

   | Mandate | Effect |
   |---|---|
   | Landslide | High starting political capital, long honeymoon |
   | Narrow win | Standard |
   | Affirmed by the Supreme Court | Low starting capital, legitimacy questioned, an election petition storyline runs through the first six months |

4. **Running mate.** Choose a zone. Affects zone balance and the election model.
5. **The agenda.** Pick three priorities from ten (chapter 4). Governments here announce N-point agendas; the player announces theirs, and the papers will hold them to it.
6. **First appointments.** Fill the key portfolios now with limited vetting, or take time. Each month without a cabinet reveals more about candidates and costs standing. The press counts the days.

## 1.3 The month

Every month runs the same five phases in the same order. The fixed order is the ritual.

```
1. PAPERS      Front page reacts to last month. One click to dismiss.
2. BRIEFING    The desk shows what changed. Chief of Staff gives a two-line read.
3. THE DESK    One lead file. Up to two minor matters (usually via the phone).
4. ACTION      One presidential action of the player's choosing.
5. CLOSE       "End the month." The simulation ticks. Delayed effects resolve.
```

### Phase 1: Papers

A front page (chapter 7). It reports on decisions the player made, things the simulation did, and occasionally things the player has not been briefed on yet. The paper is sometimes the first place a problem appears.

### Phase 2: Briefing

The desk view updates. Changed indicators are marked. The Chief of Staff offers a short read of the month ("Sir, two things. Labour, and the Senate President has stopped returning calls."). This line is generated from whichever hidden values moved most, filtered through the Chief of Staff's competence. A weak Chief of Staff misses things.

### Phase 3: The desk

- **One lead file.** A full briefing with adviser reads and three to five options. This is the main decision of the month.
- **Zero to two minor matters.** Short, two or three options, usually arriving as phone messages. Many are relationship management: a governor wants a call returned, a minister wants approval.

Minor matters can be left unanswered. Silence is a choice and is recorded as one.

Some lead files carry a **deadline** in months. A file left past its deadline resolves itself with its default option, which is usually the worst one. Deferring is legitimate for one month and costly after that.

### Phase 4: Action

The player takes one presidential action (full list in 4.2): push a reform milestone, lobby the National Assembly, call in a governor, reshuffle, tour a zone, address the nation, order an audit, travel abroad, or consult and rebuild capital.

A second action slot opens when the Villa is in good order (Villa mood Solid or better and a Chief of Staff with competence 4 or more). A disciplined presidency literally gets more done.

This phase is what stops the game being a crisis inbox. The desk is what the country does to the president; the action is what the president does to the country.

### Phase 5: Close

The player ends the month. The engine then, in order:

1. Applies due scheduled effects from the ledger (2.6).
2. Ticks the economy and national systems.
3. Advances bills, reform milestones and projects.
4. Updates actor standing, bloc moods, zone approval and political capital.
5. Rolls character behaviour (leaks, defections, scandals, ambitions).
6. Checks threshold triggers and ending conditions.
7. Asks the Director (5.3) to assemble next month's desk and the newsroom to set the front page.

## 1.4 The calendar

Fixed moments give the term a shape. The player learns to plan around them.

### Every year

| Month | Fixture |
|---|---|
| June | 12 June, Democracy Day. Anniversary scorecards in the papers. Quarterly agenda review. |
| September | Quarterly agenda review. Flood season risk peaks. |
| October | 1 October, Independence Day broadcast (ceremonial choice of message). Budget presented to the National Assembly. |
| December | Budget due to pass. It frequently does not. Quarterly agenda review. |
| January | New fiscal year. Budget takes effect if passed; otherwise the old one rolls over and capital projects stall. |
| March | Quarterly agenda review. Planting season; farm inputs decisions bite or pay here. |

### Once per term

| Turn | Month | Fixture |
|---|---|---|
| 1 to 3 | Jun to Aug, year 1 | Senate screening of ministers. Honeymoon. |
| 6 | Nov, year 1 | Honeymoon ends. |
| 12 | May, year 2 | First anniversary. Agenda scorecard published. |
| 24 | May, year 3 | Mid-term. Full "Two Years On" edition. Reshuffle expected. |
| 30 | Nov, year 3 | Ambitious ministers begin positioning for the next cycle. |
| 37 | Jun, year 4 | Primary season opens. The ticket must be secured (6.4). |
| 40 | Sep, year 4 | Campaign period opens. Campaign actions become available. |
| 45 | Feb, year 5 | General election. Election night. |
| 46 | Mar, year 5 | Petitions filed. Tribunal storyline if the margin was thin. |
| 48 | May, year 5 | Handover, or second inauguration. Legacy verdict. |

A second term repeats the calendar from turn 49 with three differences: no honeymoon, no re-election to plan for, and authority drains in the final year as everyone positions for the succession.

### Why the calendar matters to strategy

- Reforms that hurt should be front-loaded into the honeymoon, when capital is high and the election is far away. The game never says this. Players discover it.
- The budget in October is the one moment each year when priorities become money. A reform track without a budget line does not move.
- From turn 37 the party holds real leverage, because it controls the ticket. Debts unpaid by then are called in.

## 1.5 Pacing rules

- Maximum three decisions on the desk in a month (one lead, two minor).
- No more than two grave lead files in consecutive months unless a storyline requires it.
- At least one light or farcical item every three months.
- At least one genuinely good-news file every five months, with a decision about how to use it.
- At least one month in six with only a lead file and nothing else.

These are enforced by the Director (5.3), not left to chance.
