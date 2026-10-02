# 5. Events

Events are the content of the game. The engine is small; the writing is the product. This chapter defines the standard every event is written to.

## 5.1 Kinds of event

| Kind | Selected by | Example |
|---|---|---|
| **Standalone** | Weighted random from the eligible pool; fires once | An aide posts from the wrong account |
| **Recurring** | Weighted random with a cooldown; weight often tied to a pressure | Grid collapse; petrol scarcity |
| **Chain** | Scheduled as a follow-up by an earlier event | Each step of the university funding dispute |
| **Threshold** | Fires when a variable or pressure crosses a line | Forced devaluation when reserves hit the floor |
| **Calendar** | Fixed turn or month | Independence Day broadcast; budget presentation |
| **Milestone** | Raised by pushing a reform | Tariff decision in the power track |

Each event is also either a **lead** file or a **minor** matter (1.3).

## 5.2 Schema

Events are data. The engine never contains event-specific logic.

```ts
type Tone = 'grave' | 'dry' | 'farce' | 'absurd';

interface GameEvent {
  id: string;                       // 'uni.ultimatum'
  kind: 'standalone' | 'recurring' | 'chain' | 'threshold' | 'calendar' | 'milestone';
  slot: 'lead' | 'minor';
  category: 'economy' | 'labour' | 'security' | 'infrastructure'
          | 'politics' | 'scandal' | 'ceremonial' | 'fortune' | 'foreign';
  tone: Tone;

  // Eligibility and selection
  when?: Condition;
  weight?: number | WeightRule[];   // rules let pressures raise the weight
  cooldown?: number;                // months before a recurring event may repeat
  maxOccurrences?: number;
  deadline?: { months: number; defaultChoice: string };

  // Presentation
  office: string;                   // letterhead: 'Office of the Chief of Staff'
  classification?: 'ROUTINE' | 'URGENT' | 'CONFIDENTIAL' | 'SECRET';
  channel?: 'file' | 'phone' | 'whatsapp' | 'broadcast';
  title: string;
  body: TextBlock[];                // blocks can be conditional
  statement?: string;               // the official line, shown as a quoted release
  cast: RoleRef[];                  // roles involved; resolved at fire time
  trace?: string[];                 // pressures and flags whose causes to show

  reads: AdviserRead[];             // 5.4
  choices: Choice[];
}

interface Choice {
  id: string;
  label: string;                    // 'Offer phased implementation'
  detail?: string;                  // one line of what it means
  requires?: Condition;             // hidden entirely if false and hideIfLocked
  instrument?: Instrument;          // 3.10; shown locked with the reason if unavailable
  cost?: { pc?: number; naira?: number };
  signature?: boolean;              // triggers the signing moment
  outcomes: Outcome[];              // first whose 'when' passes, or weighted by 'chance'
}

interface Outcome {
  when?: Condition;
  chance?: number;
  result: TextBlock[];              // what the player is told happened, immediately
  effects: Effect[];                // applied now
  schedule?: Scheduled[];           // delayed, entered in the ledger with causeId
  pressures?: PressureDelta[];
  flags?: FlagSet[];
  followUps?: FollowUp[];           // { event, after: [min, max], chance?, when? }
  memories?: MemoryWrite[];         // per character
  debts?: DebtWrite[];              // create, pay or void a debt
  news: NewsSeed;                   // 7.3
  archive: ArchiveEntry;            // the neutral record for the archive
}

interface Effect {
  target: string;                   // 'street.labour' | 'nation.reserves' | 'zone.NE.approval'
  delta: number;
  spread?: number;                  // outcome variance
  scaleBy?: string;                 // e.g. minister competence
}
```

### Conditions

A small JSON structure, so content can be written and validated without code.

```ts
type Condition =
  | { all: Condition[] } | { any: Condition[] } | { not: Condition }
  | { var: string; op: '<' | '<=' | '>' | '>=' | '==' | '!='; value: number | string }
  | { flag: string; is?: string | boolean }
  | { role: string; attr: string; op: string; value: number }
  | { turn: { gte?: number; lte?: number } }
  | { month: number[] }
  | { memory: { role: string; kind: string } }
  | { inherited: string };          // true if the cause belongs to a previous president
```

### What makes an event file acceptable

A content linter (chapter 10) rejects any event that fails these.

1. Every choice has a `news` seed and an `archive` entry.
2. At least one choice has a delayed consequence (a schedule, pressure, flag or follow-up). Events where nothing echoes are not allowed.
3. No choice is strictly dominated. Each option must be best under some state of the world.
4. At least two adviser reads, from different roles.
5. Every referenced flag, role, event ID and variable exists.
6. `tone: 'grave'` events pass the tone rules in 5.6.
7. No effect targets a bloc directly; effects target actors.

## 5.3 The Director

The Director assembles each month's desk. It is a pacing system, and it is what makes the game feel authored instead of random.

**Order of selection for the lead file:**

1. A due chain follow-up, if any (oldest first).
2. A fired threshold event.
3. A calendar event for this month.
4. A milestone decision file raised by last month's Push.
5. Otherwise, a weighted draw from the eligible pool.

If more than one is due, the extras queue. Chain steps may slip a month; threshold events may not.

**Pacing constraints applied to the draw:**

- **Tension budget.** Each event has an intensity from 1 to 5. A running three-month total is kept under a ceiling that rises slowly through the term. After a 5, the next lead is at most a 3 unless a chain forces it.
- **Tone rotation.** The rules in 1.5: no more than two grave leads in a row, a light item every three months, good news every five.
- **Category spread.** No category more than twice in four months unless driven by a pressure.
- **Agenda relevance.** Events touching the player's three priorities get a weight bonus. The game talks about what the player said they cared about.
- **Callbacks.** Events whose conditions reference a decision made twelve or more months ago get a weight bonus. The Director prefers events that prove the world remembers.

**Minor matters** are drawn after the lead, preferring ones that involve characters whose relationship moved recently, so that the phone feels like a response to what the player has been doing.

## 5.4 Adviser reads: imperfect information

Each event carries reads from two to four advisers. A read is an opinion with a confidence label, shown before the player chooses.

```ts
interface AdviserRead {
  role: string;                     // 'finance' | 'sa_political' | 'nsa' | ...
  on?: string;                      // a specific choice, or the situation generally
  claim: ReadClaim;                 // structured: what they predict, about what
  lines: {                          // authored text variants
    accurate: string;
    optimistic: string;             // what a loyal, weak adviser says
    selfServing?: string;           // what a competent, disloyal one says
    vague: string;                  // what an incompetent one says
  };
}
```

At fire time the engine picks the line from the adviser's attributes (3.5) and assigns a label:

| Label | Meaning |
|---|---|
| High confidence | Competent adviser, good data |
| Moderate confidence | Competent adviser, weak data; or the reverse |
| Low confidence | Weak on both |
| Intelligence incomplete | `capacity` too low, or the matter is outside their brief |
| Advisers disagree | Two reads contradict; both are shown |

The label is honest about the adviser's reliability. It is not a guarantee about the outcome: a high-confidence read can still be wrong when the dice go against it, and the player learns which advisers have been right before.

**No numbers on choices.** A choice shows its PC and naira cost and the instrument it needs, because the president would know those. Everything else comes through reads.

After the choice, the **result** text says what visibly happened. Hidden effects stay hidden until they surface.

### Track record

The archive keeps each adviser's reads against what happened. After a year the player can see that the Finance Minister has been right eight times in ten and the Information Minister twice. This makes adviser quality something the player observes, not something they are told.

## 5.5 Positive and ceremonial events

**Fortune** events are good news with a decision attached (4.6): a harvest, a startup listing abroad, a tournament win, a successful security operation, an oil price rise. The choice is always how to use it, and claiming too much credit is usually an option with a cost.

**Ceremonial** events are low-stakes by design and widen the presidency beyond crises: Independence Day, a state banquet, national honours (who gets one is a patronage decision in formal dress), schoolchildren visiting the Villa, a state visit. They carry small choices about tone and symbolism, mostly affecting `cohesion`, `standing` and individual relationships.

National honours deserve a note: the honours list is a quiet way to pay debts without spending integrity on appointments, and an over-long list is its own headline.

## 5.6 Tone rules

Every event declares a tone. The tone constrains the writing.

| Tone | Used for | Rules |
|---|---|---|
| **grave** | Attacks, mass casualties, floods, deaths in protests, acute hardship | No jokes in the body, the options or the result. Victims are described plainly and with respect. The only permitted irony is quoting an official statement and letting it stand. The tabloid and the youth outlet switch to their sober templates. No farce may share the same month's desk. |
| **dry** | Most political and economic events | Understatement. The humour is the distance between the statement and the brief. The brief never winks. |
| **farce** | Gaffes, leaks, wrong-account posts, committee recursion | Can be openly funny. Still written in official register; the comedy is that everyone keeps a straight face. |
| **absurd** | Events where logic itself gives way (5.11) | Reported with complete procedural seriousness. The brief never signals that it knows. No exaggeration beyond what the public record already contains; the real thing is stranger than anything a writer would add. |

### Voice

- The brief is written the way a competent civil servant writes: complete sentences, passive where responsibility is being avoided, precise figures.
- The **official statement** is the fixed joke format. It uses the stock phrases ("has directed," "remains committed," "stakeholders have been engaged," "no cause for alarm," "in due course," "extant provisions") exactly as they are used in real life. The brief beside it contains the facts. The game never explains the gap.
- Figures are specific. "₦38.7bn on strategic capacity-building interventions," never "a lot of money."
- Options are written as instructions a president would give, in the president's register: "Direct the Minister to step aside pending investigation."

### What the writing does not do

- It does not say or imply that Nigerians are unserious, or that the country is hopeless.
- It does not attribute traits to ethnic groups, religions or zones.
- It does not use real politicians, parties, companies or outlets, and no character is identifiable as a real person (3.13). Real absurdities are used as archetypes under the transformation rule in 5.11.
- It does not soften the absurdity. If the public record contains an explanation that defies logic, the game's version defies logic to the same degree.
- It does not use memes or internet slang in the brief. StreetReport's headlines may, sparingly.
- It does not mock people for being poor, afraid or bereaved.

## 5.7 Worked example: a chain opener

```ts
{
  id: 'uni.ultimatum',
  kind: 'chain', slot: 'lead', category: 'labour', tone: 'dry',
  when: { all: [
    { flag: 'uni.agreement', is: 'inherited_unfunded' },
    { turn: { gte: 4 } },
  ]},
  office: 'Office of the Chief of Staff',
  classification: 'URGENT',
  title: 'University academics issue fourteen-day ultimatum',
  trace: ['flag:uni.agreement', 'pressure:arrears'],
  body: [
    'The {ACADEMIC_UNION} has issued a fourteen-day ultimatum over the agreement signed eleven years ago.',
    'Full implementation would cost ₦420bn over three years. No provision exists in the current budget.',
    { when: { role: 'education', attr: 'competence', op: '<=', value: 2 },
      text: 'The Honourable Minister of Education describes negotiations so far as fruitful.' },
  ],
  statement: 'The Federal Government remains committed to the revitalisation of tertiary education and is engaging all stakeholders.',
  reads: [
    { role: 'sa_political', lines: {
        accurate:   'Sir, negotiations have not been fruitful. They met once. The Minister left early.',
        optimistic: 'Sir, the union is posturing. They always do this.',
        vague:      'Sir, it is a delicate matter.' } },
    { role: 'finance', on: 'implement', lines: {
        accurate:   'We can find year one only by cutting capital releases. Years two and three are unfunded.',
        optimistic: 'It is manageable, Sir.',
        vague:      'The numbers are being reviewed.' } },
  ],
  choices: [
    { id: 'implement', label: 'Implement in full',
      cost: { naira: 0.14 }, instrument: 'budget',
      outcomes: [ /* services +, arrears -, fiscalSpace -, other unions take note → followUp 'labour.me_too' */ ] },
    { id: 'phase', label: 'Offer phased implementation',
      outcomes: [ /* flag uni.agreement = 'phased'; schedule a check each October:
                     if not funded in the budget → 'uni.bad_faith' */ ] },
    { id: 'talk', label: 'Request a further round of negotiations',
      outcomes: [ /* buys 2 months; wageGrievance +; followUp 'uni.ultimatum_expires' */ ] },
    { id: 'committee', label: 'Constitute a Presidential Committee on University Funding',
      outcomes: [ /* buys 4 months; integrity -1; press seed 'committee';
                     followUp 'uni.committee_reports' whose recommendations are the original agreement */ ] },
    { id: 'refuse', label: 'Decline, and prepare for industrial action',
      cost: { pc: 10 },
      outcomes: [ /* followUp 'uni.strike_begins' after 1 month */ ] },
  ],
}
```

Notes on why this is a good event:

- It is inherited. The trace shows a previous government's signature.
- No option is free and none is stupid. The committee is the comfortable one and the one that costs the institution.
- "Phased implementation" creates an obligation the October budget must honour. The player has just made a promise to their future self.
- The Minister's line appears only when the Minister is weak. The translator's read contradicts it only when the translator is good.

## 5.8 Worked example: a farce

```ts
{
  id: 'villa.wrong_account',
  kind: 'standalone', slot: 'lead', category: 'scandal', tone: 'farce',
  when: { var: 'bloc.villa.inner', op: '<', value: 70 },
  office: 'Office of the Special Adviser, Media and Publicity',
  channel: 'phone',
  title: 'A post from the official Presidency account',
  body: [
    'At 23:14 the official Presidency account posted: "You people should be grateful."',
    'The post was deleted at 23:19. Screenshots exist.',
    'The account is managed by a Senior Special Assistant on New Media, who is not answering his phone.',
  ],
  choices: [
    { id: 'fire',      label: 'Relieve the aide of his appointment' },
    { id: 'apologise', label: 'Issue an apology in the President\'s name' },
    { id: 'hacked',    label: 'State that the account was compromised' },
    { id: 'ignore',    label: 'No comment' },
    { id: 'admin',     label: 'Attribute the post to an unauthorised administrator' },
  ],
}
```

Outcomes branch on state. "The account was compromised" works if the Press is Solid and fails loudly if The Republic Monitor is hostile, because it asks the platform. Firing the aide is clean unless he is a governor's nephew, in which case it is a slight with a `causeId`. "No comment" is fine at 60% approval and becomes the story at 35%.

## 5.9 Content catalogue: first eighty

Titles and hooks. Storylines list their steps. This is the target for the first full content pass; the slice (chapter 10) uses the items marked ◆, plus second-term and succession material listed there.

### Storylines (10)

1. ◆ **The Subsidy.** Pressure to remove → decision → pump price → fares → strike notice → negotiation → (palliatives that arrive in tranches) → either revenue recovery or quiet restoration.
2. ◆ **The University Agreement.** Ultimatum → response → bad faith or funding → strike → students → resolution or a lost academic year.
3. ◆ **The Minister and the ₦38.7bn.** Report → response → investigation or committee → Senate hearing → the minister's sponsor calls → conclusion or disappearance.
4. **The Naira.** Widening gap → central bank resists → float or defend → inflation → the governor's tenure question.
5. **Minimum Wage.** Review due → tripartite committee → the figure → governors say they cannot pay → Act → states default.
6. **The Farm Belt.** Clashes → displaced farmers → harvest shortfall → food prices → governors demand state police → constitutional question. *Grave.*
7. **The Refinery.** 95% complete → new completion date → another → audit, sale, or commissioning.
8. **The Senate President.** Cool relations → held nominees → price named → pay, fight, or replace him.
9. **Sectional Government.** The counting → the table → open letter from an elder → visit, rebalance, or dismiss the concern.
10. **The Ticket.** Elders' meeting → rival emerges → governors' terms → primary.

### Recurring (12)

◆ Grid collapse · ◆ Petrol scarcity · Flooding (*grave*) · Cabinet leak · Party defection wave · Strike notice from a sector union · Kidnapping incident (*grave*) · Pipeline vandalism · Assembly summons a minister · Oil price swing · Governor requests bailout · Court injunction against an executive order

### Political (12)

◆ Senate screening ("take a bow") · Budget insertions · Party convention · A governor decamps · ◆ Open letter from Baba · Constituency project demands · Election petition ruling · Two senators threaten each other on live television during the tax debate · The committee to review the report of the previous committee · A minister declares for governor · The message sent to the wrong WhatsApp group · Opposition unites, or fails to

### Economic (10)

◆ Lender offers a facility with conditions · Tax bill resistance · Import ban proposal · Rating downgrade · Tariff increase · Port congestion · Central bank financing request · Diaspora bond · A windfall · Fuel marketers' unpaid claims

### Security and disaster (6, all *grave*)

◆ Attack on a farming community · School abduction · Insurgent attack on a base · Piracy incident · Major flood displacement · Building collapse

### Farce and light (6)

◆ The wrong-account post · A minister's live television interview · The government website is down, and has been since March · A statue is unveiled · An aide's convoy · The presidential jet needs maintenance abroad

### Fortune and ceremonial (6)

◆ Bumper harvest · Tournament victory · Startup listing · Independence Day broadcast · National honours list · State visit

### Stranger than fiction (14)

See 5.11. ◆ The animal and the money · ◆ The mace leaves the chamber · ◆ The official who fainted · The gate · The office that could not be used · The missing budget · The national carrier · The statue · ◆ The feeding programme · The warehouse · The grass · The President is not a clone · The certificate · The ministry of happiness

### Temptations (8)

See 3.12. ◆ The security vote · ◆ The preferred contractor · A birthday gift · The cousin's company · An allocation for a friend · ◆ Logistics for the Distinguished Senators · The windfall nobody has counted · ◆ Matters arising from the previous administration

## 5.10 Writing process

1. A storyline is outlined as a graph before any text is written: nodes are events, edges are choices with their delays and conditions.
2. Each event is drafted to the schema with outcomes as comments, as in 5.7.
3. Effects are filled in as words first (small, moderate, large), converted to numbers by a single table, then tuned by the harness.
4. Headlines are written last, once the outcomes are fixed (7.3).

Authoring in TypeScript files validated by a schema is sufficient until there are around a hundred events. The writer's-room tool is specified in chapter 10 and should not be built before then.

## 5.11 Stranger than fiction

Nigerian public life has produced official explanations and scenes that no satirist would dare invent. The game does not shy away from them. They are a category of their own, with their own tone (`absurd`) and their own rules.

### The source material

These are archetypes drawn from the public record of the last decade or so. They are listed by type, without names, because the game uses the type and never the people.

| Archetype | The shape of it |
|---|---|
| **The animal and the money** | An official explains that a large sum in a government office was swallowed, carted away or eaten by an animal: a snake, monkeys, a gorilla, termites. The explanation is given on the record and with a straight face. |
| **The office that could not be used** | A president returns from a long absence abroad and works from home because rodents have damaged his office. |
| **The mace leaves the chamber** | During plenary, men walk into the Senate, pick up the mace, and leave with it. |
| **The gate** | Legislators locked out of the Assembly complex climb over the gate in their robes. |
| **The official who fainted** | An agency head under questioning about spending collapses at the hearing. The chairman's microphone becomes the story. |
| **The missing budget** | The Appropriation Bill cannot be found in the Assembly. Later, more than one version exists. |
| **The national carrier** | A new national airline is unveiled with an aircraft borrowed from another country's airline and repainted for the day. |
| **The statue** | A state government erects a large statue of a foreign head of state who is facing charges at home. |
| **The ministry of happiness** | A state creates a cabinet post for happiness and fulfilment. |
| **The feeding programme** | A school feeding programme reports feeding pupils throughout a period when the schools were closed. |
| **The warehouse** | Citizens discover warehouses of relief supplies that were never distributed. |
| **The grass** | A contract of several hundred million naira is awarded to clear grass. |
| **The clone** | The President is obliged to state publicly that he is himself and has not been replaced. |
| **The certificate** | A senior official's school certificate cannot be produced. The school, the examinations body and the official each issue statements. The statements do not agree. |
| **The grid** | The national grid collapses for the twelfth time in a year. The statement on restoration is the same statement as the previous eleven. |

Writers should add to this list from the record. The standard for inclusion is that a reasonable foreigner would assume it was made up.

### The transformation rule

Every archetype is rebuilt before use, so that the mechanism survives and nobody is identifiable.

1. Change at least three of: the institution, the amount, the animal or object, the location, the rank of the official, the year.
2. The institution is fictional wherever wrongdoing is alleged (3.13).
3. Never pair an archetype with the same office that it was really attached to. If the real explanation came from a clerk at an examinations body, the game's version comes from somewhere else entirely.
4. The official who offers the explanation is a role, not a recurring named character, unless a recurring character's attributes genuinely make them the person who would say it.
5. The absurd element itself is not toned down.

So the game does not have a snake at an examinations office. It has a fictional pensions board in a different state reporting that ₦4.3bn in payment vouchers was consumed by a goat that gained access to the strong room, and a permanent secretary who would like it noted that the goat has since been apprehended.

### Why these are strategy and not just jokes

An absurd event is always a real decision. The president is being asked, formally, to respond to something that makes no sense, and each response says something about the kind of state they are running.

Typical options on an "animal and the money" file:

- **Accept the explanation.** The matter is closed. `integrity` falls; the press has its best week of the year; every other agency learns what will be believed.
- **Order a forensic audit.** Costs PC and time; implicates whoever is actually responsible, who has a sponsor.
- **Refer to a committee.** The committee visits the strong room.
- **Direct that the animal be produced.** It works about as well as one would expect, and the youth outlet covers the search.

### Absurdity is a symptom

The weight of absurd events rises as `integrity` and `capacity` fall. A hollowed-out state produces more of them, and a well-run one produces fewer. A president who has accepted two impossible explanations will be offered a third. Some baseline remains regardless, because some of it is ambient.

### Absurdity is also a tool

When the president's own exposure surfaces (3.12), the cover-story options include the archetypes. The president may be the one who directs that the records be reported as eaten. It can work. It is archived.

### Handling

- No winking. No character says "you could not make this up." The brief is filed, numbered and stamped like any other.
- One absurd lead file every six to eight months at normal integrity, never in the same month as a grave file.
- Each archetype is used once per world. They are not recurring events, with the exception of the grid.
- The papers split: the broadsheet reports it flatly, the tabloid celebrates, the investigative outlet asks where the money went, and the business paper prices it in.
