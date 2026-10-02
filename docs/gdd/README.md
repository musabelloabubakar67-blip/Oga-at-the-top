# Game Design Document

**Working title:** *Oga at the Top* (chosen for now; not yet checked against existing games or trademarks).

**Build status:** a playable two-term slice exists. See [the project README](../../README.md) for how to run it and where it departs from this document.

**One line:** A satirical Nigerian presidency simulator where you can genuinely govern well, but doing the right thing and surviving long enough for it to work are two different problems.

**Status:** Design v1. No code exists yet. Every number in this document is a starting value for tuning, not a commitment.

## Chapters

| # | File | Answers |
|---|------|---------|
| 1 | [01-structure-and-turns.md](01-structure-and-turns.md) | What a month is, what a term is, what the player does each turn, the calendar |
| 2 | [02-simulation-model.md](02-simulation-model.md) | Every tracked variable, what is hidden, how the economy ticks, how delayed consequences work |
| 3 | [03-politics.md](03-politics.md) | Blocs, actors, political capital, characters, cabinet, federal character, patronage, National Assembly, constitutional limits, how a presidency ends |
| 4 | [04-agenda-and-budget.md](04-agenda-and-budget.md) | Reform tracks, presidential actions, the budget, legacy projects, institutional capacity |
| 5 | [05-events.md](05-events.md) | Event schema, the Director (pacing), adviser reads and imperfect information, tone rules, the first content catalogue |
| 6 | [06-regions-and-elections.md](06-regions-and-elections.md) | States and zones, derived issue salience, primaries, campaign, the vote model, election night, tribunal |
| 7 | [07-media.md](07-media.md) | Six outlets, stance, headline generation, the front page, the investigative clock |
| 8 | [08-legacy-and-persistence.md](08-legacy-and-persistence.md) | Archive, legacy verdict, what the next president inherits, history of presidents |
| 9 | [09-interface.md](09-interface.md) | Screen-by-screen design, visual language, mobile behaviour |
| 10 | [10-tech-and-build-plan.md](10-tech-and-build-plan.md) | Architecture, save format, balance harness, vertical slice scope, build order |

## Design pillars

These are the tests every feature has to pass. They restate the agreed principles as things that can be checked.

1. **Two scoreboards.** Government performance and political survival are tracked separately and can diverge in both directions. Any mechanic that makes them the same number is wrong.
2. **Difficult, not impossible.** A competent, patient player can leave every national index higher than they found it. The balance harness (chapter 10) must show a reformer strategy that succeeds and a populist strategy that wins re-election while degrading the inheritance.
3. **Nothing is forgotten.** Every decision is archived with an ID, and every delayed effect carries the ID of the decision that caused it, so the game can show the player the chain later.
4. **You cannot do it alone.** Significant actions need a second signature: the Senate, the governors, the courts, a regulator. Coalition-building is the core skill.
5. **Institutions pay compound interest.** State capacity and integrity multiply the effect of everything else, in both directions.
6. **Satire of incentives, not of people.** The joke is the gap between the official statement and the reality. Grave events carry no jokes about victims.
7. **Nigerian by construction.** Real geography, real constitutional machinery, real political vocabulary. Fictional people, parties, outlets and companies, none of them identifiable as anyone real.
8. **The whole menu.** The president can govern honestly, tolerate, or steal. Corruption is available, effective and never required. The game records it and does not lecture.
9. **Stranger than fiction.** Where the public record defies logic, the game defies logic to the same degree, with a straight face.
10. **Advice, not arithmetic.** The player decides from adviser reads and newspapers, with honest uncertainty, never from a table of `+5 / -3`.

## Decisions made in this document

Where the handoff left a question open, this document picks an answer. The ones most worth your review:

| Decision | Choice | Why |
|---|---|---|
| Setting | Real Nigeria: real states, zones, constitution, institutions. All people, parties, unions, media and companies are fictional. | A fictional country name would cost authenticity and gain nothing; the fiction that matters legally and creatively is the cast. |
| Turn | One turn is one month. A term is 48 turns, June of year 1 to May of year 5. | Matches the real 29 May inauguration and gives a 45 to 60 minute term. |
| Faction display | Five blocs shown as mood words with a trend, never as numbers. Each bloc is an aggregate of named actors the player learns about through advisers and the phone. | Delivers "61% approval but the governors are plotting" without five health bars. |
| How a presidency ends | A single bloc collapsing is a survivable crisis with its own storyline. Two blocs collapsing at once starts removal proceedings. Otherwise: lost primary, lost election, term limit, or resignation. | The inspiration's "any bar at zero ends the game" is too arcade for this design and makes hidden politics feel unfair. |
| Coups | Not in the game. | The Fourth Republic frame is constitutional. A coup ending would undercut "difficult, not impossible" and turn the Establishment into a kill switch. |
| Political capital | A spendable currency, earned from standing and wins, spent on actions. | Makes "can I get this done" a resource decision each month. |
| Regional politics | Issue salience is computed from local conditions each month. Nothing about a zone's priorities is hard-coded. | The stated requirement to avoid stereotypes, implemented as a rule. |
| Cabinet size | Ten key portfolios are individually simulated. The remaining ministers exist only as a federal-character tally. | The constitution requires a minister from every state; simulating 40 people would bury the interesting ten. |
| Succession | After your presidency ends, you play whoever won the election, including the person who beat you. | The strongest version of "the world remembers": you inherit your own mess from the other side. |
| LLMs at runtime | None. All text is authored or templated. | Already agreed; the engine is deterministic and seedable as a result. |
| Corruption | A full system (3.12): a hidden purse, many ways to fill it, powerful ways to spend it. Costs arrive through witnesses who gain leverage, the press, and the end of immunity at handover. | It has to work to be a real temptation, and it has to cost through mechanisms, not through a random "caught" roll. |
| Absurdity | A fourth tone, `absurd`, and a catalogue of archetypes from the public record (5.11), rebuilt under a transformation rule so the mechanism survives and nobody is identifiable. More frequent as institutions decay. | Lets the game be as ridiculous as reality while staying inside the naming rule. |
| Names | **Parody names.** Every character has a real-sounding honorific and first name attached to a surname that is a word from political life: Alhaji Musa Protocol, Chief Okey Structure, Senator Bala Bow-and-Go, Zainab Receipts. The registry is `content/names.ts`. This replaces the search-based protocol in 3.13. One rule survives from it: never parody a specific real person's name, nickname or title. | Nobody is called Protocol or Bow-and-Go, so the names cannot collide, and they are funnier. |
| Faith balance | Kept out of the numbers. Present only in the running-mate choice and a small number of carefully written events. | Confirmed. |
| Starting scenarios | Six inheritances (2.9), chosen when a world is created. | Confirmed. They double as world difficulty. |
| The slice | Runs a full presidency of up to two terms, then the handover, then into the next president's first year. | A slice ending at the first election was rejected; inheritance is the central promise and has to be playable. |

## Ideas from the handoff that I changed, shrank or cut

The handoff asks for weak ideas to be challenged. These are the ones I pushed back on.

- **Daily rhythm (morning briefing, afternoon assembly, night calls).** Cut as a time system. With 48 months per term, a day clock is unplayable. The ritual survives as the fixed order of phases inside each month (papers, briefing, desk, action).
- **Signature mechanic.** Kept, but only for laws, budgets and key appointments: roughly ten signatures a term. On every decision it becomes a chore within fifteen minutes.
- **Body language and character animation.** Replaced with three portrait states per character (composed, uneasy, hostile). It carries the same information at a tenth of the art cost. Animation can come later.
- **WhatsApp interface.** Kept, and given a job. It is the main channel through which the player sees actor-level political mood, so reading the groups is intelligence-gathering. It is not a general chat simulator; threads are authored.
- **Office that fills with mementos.** Deferred to after the slice. Cheap version specified in chapter 9: a shelf driven by archive milestones.
- **Unemployment, GDP and prosperity as separate tracked numbers.** Folded into growth, a jobs index and a derived hardship index. Three overlapping prosperity numbers would move together and confuse the player.
- **Drag-and-drop budget folders.** Replaced with four funding levels per sector. Sliders and dragging invite false precision and are bad on phones.
- **Achievements, leaderboards, cloud saves.** Out of scope for this document beyond noting where they attach.
- **Number of variables.** The handoff suggests 15 to 25. This design has 22 national variables and 9 hidden pressures. The slice uses 6 and 3.

## Open questions for you

1. **Title.** Pick from the shortlist at the top, or reject them all and say what you want it to sound like.
2. **How far the slice runs into the second presidency.** The design assumes the next president's first year. Say if you want the slice to run the successor's whole term.
3. **Outlet names.** The six from the handoff are unvetted and at least one resembles a real publication. They will be replaced through the protocol unless you want to keep specific ones and check them yourself.
