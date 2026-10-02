# 7. Media

The press is the game's narrator. It tells the player what their decisions meant, in six voices that disagree. It is also a bloc with power of its own.

## 7.1 The six outlets

All fictional.

| Outlet | Type | Voice | Leads with | Audience weight |
|---|---|---|---|---|
| **The Federal Chronicle** | Broadsheet of record | Measured, institutional, passive constructions | Policy, statements, process | Establishment, Villa |
| **NaijaNow** | Rolling breaking news | Short, urgent, present tense, "BREAKING:" | Whatever just happened | General public |
| **The Republic Monitor** | Investigative | Precise, documentary, names figures and dates | What was not announced | Civil society, Press peers |
| **The Daily Gbas Gbos** | Tabloid | Loud, personal, fond of quotation marks | Feuds, gaffes, who slighted whom | Markets and transport, mass readership |
| **Business Abuja** | Financial daily | Dry, numerical, unimpressed | Markets, FX, budgets | Organised business, investors |
| **StreetReport** | Online, youth-led | Conversational, quotes ordinary people, reports what is trending | How it lands on the street | Students and youth |

### Outlet state

```ts
interface Outlet {
  id: OutletId;
  stance: -2 | -1 | 0 | 1 | 2;     // toward this president
  access: number;                  // 0 to 100: how well the Villa has treated them
  credibility: number;             // how much their framing moves opinion
  beats: Category[];               // what they prefer to lead with
  audience: Record<ActorId, number>;
}
```

**Stance** moves with:

- how the president treats the press: interviews granted, media chats held, journalists harassed or protected;
- whether official statements turn out to be true. An outlet that printed "no cause for alarm" a week before the alarm remembers;
- the outlet's own interests. Business Abuja warms to fiscal discipline. StreetReport cools with hardship. The Monitor is never above neutral for long, and should not be.

The Press bloc's mood is the credibility-weighted average of stances.

## 7.2 What the press does mechanically

1. **Framing.** After each decision, each relevant actor's reaction is nudged by the stance of the outlets its members read. The same subsidy removal costs more Street standing when StreetReport and Gbas Gbos are hostile than when they are neutral. Framing modifies effects within a band (roughly ±25%); it does not invent them.
2. **Stickiness.** Press mood sets how long a scandal stays on the front page, which sets how long it drains standing.
3. **Disclosure.** The papers sometimes reveal hidden state: the parallel-market gap, a governors' meeting, a minister's property. A hostile press reveals more of what hurts; a well-treated press is not kinder but is fairer.
4. **Investigation.** See 7.6.

The president cannot control the press. The available levers are access, honesty, and occasionally pressure, which works once and is recorded.

## 7.3 Headline generation

No language model. Headlines are authored or templated, selected by rule.

### The news seed

Every outcome in every event carries one:

```ts
interface NewsSeed {
  tags: string[];                  // ['subsidy', 'reform', 'price_rise']
  valence: -2 | -1 | 0 | 1 | 2;    // for the government
  weight: number;                  // newsworthiness; decides lead vs inside
  tone: Tone;                      // inherited from the event
  slots: Record<string, string>;   // { minister: role ref, amount: '₦38.7bn' }
  authored?: Partial<Record<OutletId, string>>;   // hand-written headlines
}
```

### Selection

For each outlet on the page:

1. If the seed has an **authored** headline for that outlet, use it.
2. Otherwise choose a **template** matching (outlet, tag, valence bucket, stance bucket), fill its slots, and avoid any template used in the last twelve months.
3. If nothing matches, fall back to the outlet's generic templates for the category.

Major events and every storyline step get authored headlines for at least three outlets. Templates carry everything else.

### The same event, six ways

Subsidy removal, stance neutral:

| Outlet | Headline |
|---|---|
| Federal Chronicle | PRESIDENT ANNOUNCES ENERGY MARKET REFORMS |
| NaijaNow | BREAKING: FG ENDS SUBSIDY, PETROL PRICES SET TO RISE |
| Republic Monitor | WHO WAS PAID: INSIDE ₦4.2TN OF SUBSIDY CLAIMS |
| Daily Gbas Gbos | "NO GOING BACK!" PRESIDENT DARES LABOUR |
| Business Abuja | MARKETS RESPOND TO FISCAL REFORM; BONDS RALLY |
| StreetReport | "TREK TO WORK": NIGERIANS REACT TO NEW PETROL PRICES |

The same event with the Chronicle hostile becomes *PRESIDENCY ENDS SUBSIDY WITHOUT CONSULTATION, SAY GOVERNORS.* Stance changes which true thing leads.

### Template form

```
[outlet: chronicle] [tag: scandal] [valence: -1] [stance: 0]
"{MINISTER_TITLE} INVITED TO CLARIFY {AMOUNT} EXPENDITURE"

[outlet: gbasgbos] [tag: scandal] [valence: -1] [stance: any]
"{AMOUNT}! WHERE IS THE MONEY, {MINISTER_SHORT}?"

[outlet: naijanow] [tag: committee] [valence: 0]
"BREAKING: FG CONSTITUTES COMMITTEE ON {SUBJECT}"

[outlet: monitor] [tag: committee] [valence: 0] [requires: flag committee_count >= 3]
"A COMMITTEE TO REVIEW THE COMMITTEE: {COUNT} PANELS, NO REPORT PUBLISHED"
```

The last example shows templates reading game state. Counters such as committees constituted, days without a cabinet, and completion dates announced for the refinery are tracked precisely so the papers can keep score. The papers keeping score is a running joke that the player's own behaviour writes.

### Sober mode

For `grave` events, the tabloid and StreetReport switch to a restrained template set. No puns, no quotation-mark sarcasm, no trending-topic framing. The Chronicle and NaijaNow report facts. The Monitor may ask what was known beforehand. Criticism of the government's response is permitted and often warranted; levity is not.

## 7.4 The front page

One front page per month, shown in the Papers phase.

**Which outlet?** The paper on the desk rotates, weighted toward the outlet with the most to say this month: Business Abuja after a budget, the Monitor when its clock completes, Gbas Gbos after a farce. Over a term the player sees all six. A press-review screen lists every outlet's headline for the month for players who want all of it.

**Layout:**

| Slot | Content |
|---|---|
| Masthead | Outlet, date, edition number |
| Lead | The highest-weight seed, in this outlet's voice, with a two-sentence standfirst |
| Second and third stories | Next seeds by weight, preferring different categories |
| Number of the month | One statistic, framed by the outlet (may be stale; see 2.4) |
| Column or sidebar | Rotating: an editorial line, a vox pop, a quote of the week, an opposition statement, a correction |
| Ticker (NaijaNow, StreetReport) | Three one-line items, one of which is often an early warning |

Seeds come from three sources: player decisions, simulation movements (inflation prints, a grid collapse, an oil price move), and character actions (a governor's statement, an elder's letter).

The sidebar is the best home for short-form satire: the correction that makes it worse, the vox pop that says in eight words what the brief took a page to avoid.

### Special editions

- **Anniversary** (turns 12, 24, 36): the agenda scorecard. Each of the three priorities graded by the outlet, from milestone progress and index movement.
- **Election morning** and **the morning after**.
- **The final edition**: the retrospective that opens the legacy screen (chapter 8).

## 7.5 The president's media tools

- **Media chat** (action: Address the nation, variant). Live questions. Rewards a president whose facts are good; punishes one hiding something. Raises access.
- **Exclusive interview** to one outlet. Raises that outlet's access and stance; annoys the others slightly.
- **The Information Minister.** A competent one shapes framing honestly. A weak one issues statements that become the story.
- **Statements.** Many choices implicitly choose an official line. Lines that prove false are stored as flags and cost stance when the truth surfaces. "The account was compromised" is a statement with a half-life.
- **Brown envelopes.** Money from the purse (3.12). Softens most outlets for a few months and can slow an investigation. Every journalist paid is a witness. Offered to the investigative outlet, it becomes the next front page.
- **Pressure.** Withdrawing advertising, leaning on a proprietor, arresting a journalist. Each works in the short term, costs `integrity` and `standing`, turns the whole Press bloc, and appears in the legacy verdict by name.

## 7.6 The investigative clock

The Republic Monitor runs investigations as hidden progress bars.

```ts
interface Investigation {
  subject: string;                 // a role, a contract, a programme
  progress: number;                // 0 to 100, hidden
  seededBy: string;                // causeId: the decision that created the exposure
  findings: 'minor' | 'serious' | 'impeachable';
}
```

- An investigation starts when `scandalHeat` is high and there is something to find: a low-integrity appointee, a patronage contract, campaign money from state resources.
- It advances monthly, faster with press hostility, with leaks from a disloyal Villa, and with the editor's attributes.
- Before publication the player may get a warning: a request for comment. This is a decision file. Respond honestly, stonewall, pre-empt with one's own disclosure, or try to stop it.
- Publication fires a scandal event sized to the findings.

The clock is the reason integrity decisions have teeth without the game moralising. A deal done in year 1 is a front page in year 3, and the trace shows the player exactly which afternoon it came from.

A president with a clean record should experience the Monitor as a nuisance. A president without one should experience it as weather.

## 7.7 Volume of writing

For the first full release:

| Item | Count |
|---|---|
| Authored headlines | About 3 per outcome on major events: roughly 400 |
| Generic templates | About 20 per outlet: 120 |
| Sober templates | About 8 per outlet: 48 |
| Sidebars | 60 |
| Standfirst templates | 40 |

This is the second-largest writing job after the events themselves and should be budgeted as such.
