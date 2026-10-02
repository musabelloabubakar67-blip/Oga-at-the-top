# 9. Interface

> **As built.** This chapter is the original design. [Chapter 0](00-as-built.md) describes the game in the code. The main differences here:
>
> - One desk screen with modal panels: the file, the phone, executive powers, politics (governors, senators, ministers, the money, the opposition, favours), the Treasury (books, debts, funds), the budget, the scorecard and security, the archive, the drawer, and the papers.
> - The Cabinet Room, National Assembly, Situation Room and Power Map (9.8 to 9.13) are tabs of the politics and scorecard panels, not separate screens.
> - Portraits, the signature animation beyond a mark, and the mementos shelf are not built.


## 9.1 Principles

1. **A game, not a dashboard.** If a screen could be mistaken for an analytics product, it is wrong. Information arrives as documents, messages, newspapers and people, with deliberate pacing between them.
2. **The office frames; it does not constrain.** The desk is home and the source of ritual. Dedicated screens exist for anything that needs room.
3. **Dignified surface, absurd contents.** The interface is always composed and formal. The comedy is in what the composed, formal documents say.
4. **Words before numbers.** Political state is shown as language. Numbers appear where a president would see numbers: prices, budgets, votes.
5. **One decision in focus.** No screen asks for two unrelated decisions at once.

## 9.2 Visual language

### Palette

| Role | Colour | Use |
|---|---|---|
| Ground | Deep charcoal `#16181A`, matte black `#0E0F10` | Backgrounds, the desk |
| Paper | Warm ivory `#F2ECDD` | Files, newspapers, letters |
| Ink | Near-black `#1B1B1B` on paper; ivory on dark | Text |
| State | Forest green `#1F4D3A` | Seals, primary actions, the flag |
| Honour | Muted gold `#B0914F` | Rules, crests, signature moments |
| Alarm | Oxblood `#8C2B2B` | Used rarely: URGENT stamps, Breaking mood |

Colour is not used to score things. Mood words are not traffic-lit. A bloc at *Strained* is set in the same ink as one at *Solid*; the word carries the meaning, and oxblood is reserved for *Breaking*.

### Type

- **Documents:** a serif with authority for briefs and broadsheets.
- **Interface:** a restrained grotesque for labels and controls.
- **Typewriter or monospace:** classification stamps, reference numbers, dates.
- **Per outlet:** each paper has its own masthead face and headline style. The tabloid shouts in condensed sans; the Chronicle does not raise its voice.

### Objects

Documents look like documents: letterhead, reference number (`PRES/COS/2028/114`), date, classification stamp, signature block. These details are cheap and do most of the atmospheric work.

### Motion

Slow and weighted. A file slides onto the desk. A newspaper lands. A stamp comes down. Nothing bounces. Transitions between phases take 300 to 500 ms and can be skipped by tapping. Reduced-motion preference is respected.

### Sound

Sparse: paper, a pen, a phone vibrating on wood, a distant generator when the grid is down. A short musical sting for election night and the legacy screen only. Off by default on mobile.

## 9.3 Screen map

```
Title ─ New world / Continue / History of Presidents
  │
Transition (create president → background → mandate → running mate → agenda → cabinet)
  │
THE DESK  ◄──────────────── home; one per month
  ├─ Papers            (phase 1, full-screen)
  ├─ File              (lead decision)
  ├─ Phone             (minor matters, groups)
  ├─ Action menu       (phase 4)
  │
  ├─ Cabinet Room
  ├─ National Assembly
  ├─ Agenda
  ├─ Budget            (October; otherwise read-only)
  ├─ Situation Room
  ├─ Power Map
  ├─ Press Review
  └─ Archive
  │
Election Night ─ Legacy Verdict ─ History of Presidents
```

## 9.4 The Desk

The home screen. A presidential desk from above, on dark ground.

- **Top strip:** the date ("Monday, 4 September 2028"), month of term ("Month 16 of 48"), and a quiet countdown to the next fixture ("Budget presentation: 1 month").
- **Centre:** the lead file, closed, with its stamp and title visible. Minor matters appear as a lit phone.
- **Left:** the folded newspaper (reopens this month's front page).
- **Right, a narrow column:** the standing figures. Approval. Political capital. Four or five headline economic figures with their age ("Inflation 21.4%, *August, provisional*"). The five bloc moods as words with arrows.
- **Lower edge:** entry points to the dedicated rooms, as labelled tabs on a desk blotter.
- **The Chief of Staff's note:** two lines on a card, new each month.
- **The drawer:** a locked drawer at the edge of the desk, unlabelled. It holds the purse (3.12): the balance, where it came from, who knows, and what it can be spent on. It is never mentioned by the interface and never highlighted. A player who never opens it has a clean presidency. Inside, the register is informal and euphemistic; the word used is *logistics*.

The end-of-month control appears only when the lead file has been decided. It reads **"That will be all."**

On first play, rooms unlock over the first three months so the desk starts nearly empty.

## 9.5 The File

A lead decision opens as a document over the desk.

1. **Header:** letterhead of the issuing office, reference, date, classification stamp.
2. **Brief:** three to six short paragraphs.
3. **Official statement,** where there is one: set apart as a quoted press release. This is the fixed position of the game's main joke, and players should come to look for it.
4. **Tabs:** *Advice* (adviser reads, each with portrait, role and confidence label) and *How did we get here?* (the trace, when one exists).
5. **Options:** a list of typed instructions. Each shows only its PC cost, its naira cost and its required instrument. Locked options remain visible with the reason: *Requires two thirds of the Senate.*

Choosing an option shows a confirmation in the president's voice ("Direct the Minister to step aside pending investigation.") and then the **result**: a short paragraph, sometimes a reaction line from a character, sometimes nothing more than "The directive has been conveyed."

Where `signature: true`, the confirmation is the signing moment: the document, a pen, a held press or a drawn stroke, the seal. About ten per term.

## 9.6 The Papers

Full-screen front page on a dark ground, styled per outlet. Lead headline, standfirst, two further stories, the number of the month, a sidebar.

The paper lands with a soft sound, is read, and is dismissed with a swipe or a key. A small link opens the **Press Review**: all six outlets' headlines for the month in a column, each in its own typography, which is where the six-voices design is most visible.

## 9.7 The Phone

A phone lying on the desk. Two tabs.

- **Messages:** direct threads with characters. A minor matter is a message with two or three reply options written as replies. Leaving a message on read is allowed and noticed.
- **Groups:** read-only threads. Unread counts. The president does not post. Typing indicators that stop. Messages that were deleted. "~Party Chairman left."

The Special Adviser's glosses appear as his own messages in a pinned thread, so his translation of what a governor meant sits next to what the governor said.

The phone is the one place where informal register is right: abbreviations, voice-note references, "Good morning Your Excellency" followed by the request.

## 9.8 Cabinet Room

A long table seen from the head. Ten seats for the key portfolios, with the Chief of Staff, the Secretary to the Government and the NSA along the side.

- Each seat shows a portrait in one of three states: composed, uneasy, hostile. These reflect hidden relationship and loyalty, filtered by how good the president's information is.
- Selecting a minister opens their card: reputation (and true attributes once known), sponsor, zone, record in office, memories of note, and what the Special Adviser says about them.
- When a policy is before cabinet, ministers lean in with a one-line position. Selecting them gives the argument.
- Empty seats are empty chairs. A side panel shows the zone tally of appointments as a plain six-row table, which is how federal character becomes visible.
- Appointment, dismissal and reshuffle happen here.

## 9.9 National Assembly

A split chamber view: Senate on one side, House on the other, seats shaded by party, with the current whip estimate for the selected bill overlaid as sure, leaning and against.

Below, the **bill tracker**: each live bill as a horizontal track through its eight stages, with its current strength shown as three marks, the latest stall reason in the Assembly's own words, and the available tools (lobby, concede, trade, go public).

Presiding officers appear with portraits and their current disposition as the Special Adviser reads it.

## 9.10 Agenda

Three columns, one per priority. Each shows its milestones as a vertical sequence: done, in progress, blocked, not started. A blocked milestone states exactly what it is waiting for: *Awaiting a budget line. Next budget: October.*

Each completed milestone shows its entrenchment. The latest published scorecard from the papers sits at the top.

## 9.11 Budget

Opens fully in October; read-only otherwise.

1. **The envelope,** presented by the Finance Minister as a single statement: revenue, less debt service, less wages, less transfers, less subsidy, equals what is left. Seeing two thirds of revenue leave before any choice is made is the lesson of this screen.
2. **Borrowing:** four levels, each with the Finance Minister's and the central bank governor's read.
3. **Allocation:** seven rows, four levels each, a running total against the envelope. Each row shows last year's level, the minister's plea, and any milestone or project that depends on it.
4. **Submission,** then passage as a short sequence of minor matters, ending with the signature.

## 9.12 Situation Room

A large map of Nigeria on a dark wall, with states outlined and zones lightly grouped. This is the visual signature of the game.

**Layers,** one at a time: security · food and prices · power · flooding · projects · approval · governors (by party and disposition) · elections (last result).

- Each layer shades states and places markers for live incidents and active projects.
- Selecting a state opens a side card: governor, local conditions, projects, current issues by salience, the last election result.
- Precision follows `capacity`: at low capacity layers are coarse and labelled with their age; at high capacity they are sharp and current.
- Abandoned projects stay on the projects layer permanently, with the name of the president who started them.

The salience readout on the state card is the main way a player learns that what a place cares about depends on what is happening there.

## 9.13 Power Map

The politics screen. Five blocs arranged around the presidency. Each shows its mood word and trend.

Opening a bloc shows its actors as names with **whatever the president currently knows**: sometimes a clear read, sometimes "no recent contact," sometimes two advisers disagreeing. Known debts are listed against their creditors with their due dates.

This screen should feel like a briefing note about people. It must not become five progress bars with sub-bars.

## 9.14 Archive

A timeline by year. Filters by category. Defining decisions marked with the seal. Each entry opens to show what followed from it. A tab holds adviser track records. A tab holds every official statement issued, with a mark against those later shown to be untrue.

## 9.15 Election Night

A dedicated dark screen, built like a broadcast. Map centre; national tally and the 25% counter to one side; a declaration feed below. States fill one at a time. Lines of consequence appear beneath declarations where earned. A running chyron in NaijaNow's style.

The only control is to continue, plus an unobtrusive skip.

## 9.16 Legacy Verdict and History

The verdict is a sequence, not a page: the final front page, then the epithet alone on a dark screen, then the narrative, then the ten dimensions with causes, then the reforms table, then the bill left behind, then the option to export the record and to begin the next presidency.

History of Presidents is a gallery of framed portraits with a brass plate under each. Later, the same portraits can hang on the wall behind the desk.

## 9.17 Loading and waiting

Any wait longer than a moment shows a line in official register:

- Consultations are ongoing…
- Constituting committee…
- Awaiting presidential assent…
- Stakeholders are being engaged…
- The report has been submitted. Implementation pending…
- Necessary measures are being put in place…

## 9.18 Responsive behaviour

Designed for laptop and tablet first. Fully playable on a phone.

| Element | Desktop and tablet | Phone |
|---|---|---|
| Desk | Spatial desk with side column | A vertical stack: date, standing figures in a compact strip, the file, the phone, the paper |
| File | Document with tabs beside the options | Full-screen document; tabs become a segmented control; options pinned at the bottom |
| Papers | Full front page | Lead and standfirst first; the rest scrolls |
| Phone | An object on the desk | Native-feeling full screen, which suits it |
| Cabinet Room | The table | A list of seats with portraits |
| Situation Room | Map with side card | Map with a bottom sheet; pinch to zoom |
| Budget | Table | One sector per row, levels as a four-step control |
| Election Night | Map and feed side by side | Feed first, map above it at reduced height |

The core loop of papers, file, phone and end of month must be comfortable with one thumb.

## 9.19 Accessibility

- All text meets contrast requirements against both paper and dark grounds.
- Mood and status are never conveyed by colour alone.
- Full keyboard play on desktop: number keys for options, a key to advance.
- Text size control. The game is mostly reading.
- Motion and sound are optional.

## 9.20 Later, cheaply

- **Mementos:** a shelf behind the desk that gains an object for each defining archive entry: a framed front page, a ribbon-cutting photograph, a hard hat, a gavel. Driven entirely by archive data.
- **Portrait expressions beyond three.**
- **Ambient desk states:** the lamp is on when the grid is down and the generator note is audible.
