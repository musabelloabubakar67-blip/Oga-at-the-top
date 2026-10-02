# 3. Politics

> **As built.** This chapter is the original design. [Chapter 0](00-as-built.md) describes the game in the code. The main differences here:
>
> - Blocs are as designed. Actors inside them are sixteen named people (six governors, four senators, six ministers), five businesspeople and three rivals.
> - Political capital is an itemised monthly income; acting without enough is allowed and costs the party and the Villa.
> - Patronage and debts (3.7) exist as the favours ledger, running both ways, and as the businessmen. See chapter 0.3.
> - The National Assembly (3.9) is the Senate figure: the party's mood and the four senators. Laws are voted on when a reform is ready.
> - The party primary is decided by convention delegates held by governors and senators.
> - Section 3.13, the naming protocol, is in force again in a simpler form: ordinary names, each searched. The parody-name decision recorded in older notes is withdrawn.
> - Federal character (3.8) and the wider cabinet are not built.


This chapter is the political survival scoreboard: who holds power over the president, how that power is displayed, and how it is won, spent and lost.

## 3.1 Blocs and actors

Five blocs. Each is an aggregate of named actors. The player sees the bloc; the game simulates the actors.

| Bloc | Actors (hidden standing 0 to 100) | What they want | What they can do to you |
|---|---|---|---|
| **The Villa** | Cabinet · Inner circle (aides, kitchen cabinet) | Access, protection, relevance | Leak, slow-walk, resign in public, brief against each other |
| **The Party** | National Working Committee · Governors' Forum · National Assembly caucus · Elders and financiers | Appointments, the ticket, a say | Block bills, defect, deny the ticket, start impeachment |
| **The Street** | Organised labour · Students and youth · Civil society · Markets and transport | Relief from hardship, dignity, being listened to | Strike, protest, shut down cities, vote |
| **The Establishment** | Security leadership · Organised business · Senior bureaucracy · Traditional and religious leaders | Stability, predictability, their existing arrangements | Withhold cooperation, move capital, quietly stop implementing |
| **The Press** | The six outlets (chapter 7) | Access, stories, vindication | Frame everything; make scandals stick or slide |

Bloc standing is a weighted average of its actors. Weights shift with the calendar: the Governors' Forum weighs more in the Party from turn 37, when the ticket is at stake.

### Display

Each bloc shows one word and a trend arrow.

| Standing | Mood |
|---|---|
| 80 and above | Devoted |
| 60 to 79 | Solid |
| 40 to 59 | Wary |
| 20 to 39 | Strained |
| Below 20 | Breaking |

Actor-level truth reaches the player only through people: the Special Adviser's commentary, phone messages, WhatsApp groups, and the papers. A bloc can read *Solid* while one of its actors is close to revolt. This is the "61% approval, governors hostile" situation from the handoff, and it is the normal state of play.

### Why actors matter

Effects in events target actors, not blocs. Removing subsidy hits `street.labour` and `street.transport` hard, hits `establishment.business` positively, and leaves `street.civil` roughly neutral. The bloc word may barely move while labour heads for a strike.

## 3.2 Political capital

Political capital (PC) is the president's ability to make things happen. It is a number from 0 to 100 that the player can see, because it is the player's own resource.

**Start:** 75 (landslide), 60 (narrow), 42 (court-affirmed).

**Monthly change:**

```
+2   base
+ (nationalApproval - 45) / 10
+1   for each bloc at Solid or Devoted
-1   for each bloc at Strained
-3   for each bloc at Breaking
+3   during the honeymoon (turns 1 to 6)
-2   in the final 12 months of a second term
```

**Windfalls:** a bill signed (+5), a reform milestone completed (+3), a crisis visibly handled well (+2 to +6), a legacy project commissioned (+6).

**Typical costs:**

| Action | PC |
|---|---|
| Push a reform milestone | 6 to 15 |
| Lobby a bill through a stage | 5 to 12 |
| Dismiss a minister with high clout | 8 to 20 |
| Refuse a political debt | 5 to 15 |
| Override a governor publicly | 10 |
| Go over the Assembly's head to the public | 8, and it can backfire |
| Painful option in a crisis file | 0 to 25, stated on the option |

At zero PC the president can still choose between options on the desk but cannot take actions, push bills or refuse demands. This is what "lame duck" feels like mechanically.

PC is deliberately distinct from approval. A popular president with a hostile party has approval but little capital. An unpopular president with a disciplined party can still pass laws.

## 3.3 Approval

Approval is tracked per zone and aggregated nationally by registered voters (6.2). Each zone's approval drifts toward a target set by:

- local hardship, local security and local services, weighted by **salience** (6.3);
- event shocks;
- a partisan floor and ceiling from the zone's party lean;
- `sectionalGrievance` for that zone.

Approval is public and shown as a percentage, because it would be published by pollsters. It is the least hidden number in the game and the most misleading one.

## 3.4 How a presidency ends

| Ending | Trigger | Is it game over? |
|---|---|---|
| Term limit | End of a second term | No. Legacy verdict, then succession. |
| Election defeat | Chapter 6 | No. Legacy verdict; you then play the winner. |
| Ticket denied | Lose the primary (6.4) | No. Serve out the term as a lame duck. |
| Removal | Impeachment succeeds | Yes, for this president. Verdict, then succession. |
| Resignation | Offered as an option in extreme chains | Yes. A dignified exit scores better than a removal. |

### Breaking

A single bloc reaching **Breaking** does not end the government. It starts that bloc's crisis chain, which is survivable but expensive.

| Bloc | Chain | Shape |
|---|---|---|
| Villa | **The Exodus** | Resignations, then leaks, then a tell-all interview. Reform progress halts. Second action slot lost. |
| Party | **The Ticket Is Not Automatic** | Defections, loss of the Assembly majority, a rival faction's "stakeholders' meeting." |
| Street | **Total Shutdown** | General strike, protests, ports and airports closed. Mishandling it can cost lives, which starts a judicial inquiry and marks the legacy. |
| Establishment | **The Quiet Withdrawal** | Capital leaves, the currency runs, security chiefs become unavailable, files stop moving. |
| Press | **Open Season** | Every scandal sticks. The investigative clock runs at double speed. |

### Removal

Removal proceedings begin when **two blocs are Breaking in the same month**, or when the Party is Breaking and a live scandal carries the flag `impeachable`.

Impeachment is a chain, not a dice roll, and follows the constitutional shape:

1. Notice of allegations signed by one third of the Assembly.
2. Motion to investigate, requiring two thirds of each chamber.
3. A panel appointed by the Chief Justice.
4. Adoption of the panel's report by two thirds of each chamber.

Each stage takes a month and is contestable with PC, concessions, the courts, and whatever relationships the player has left. A president with a loyal Senate President can survive stage 2. One without cannot. The player always gets at least three turns of warning before removal is possible.

## 3.5 Characters

Characters are what make politics personal. Each holds a **role**; events refer to roles, so "the Finance Minister" resolves to whoever currently holds the job.

### Attributes

| Attribute | Scale | Drives |
|---|---|---|
| Competence | 1 to 5 | Execution rate in their sector; quality of their advice; outcomes of events they handle |
| Clout | 1 to 5 | How much their support or hostility moves their actor group |
| Loyalty | 1 to 5 | Leak risk, defection risk, whether they tell you the truth |
| Ambition | 1 to 5 | Likelihood of positioning for higher office, resigning to contest |
| Integrity | 1 to 5 | Monthly scandal hazard; contribution to `scandalHeat` |
| Relationship | -100 to +100 | Their current stance toward the president. Hidden. |

Plus: home state and zone, sponsor (who put them forward), a private want (what they are really after), and a public line (what they say they want).

### Memory

Each character keeps a short log of things the president did to or for them. Entries have a weight and decay slowly; betrayals decay slowest.

```ts
interface Memory {
  turn: number;
  kind: 'favour' | 'slight' | 'betrayal' | 'rescue' | 'promise' | 'promise_broken';
  weight: number;
  note: string;      // "Passed over for Finance after delivering three states"
  causeId: string;   // links to the archive
}
```

Events can check memory. A governor who was publicly overruled in year 1 is the governor who does not deliver his state in year 4, and the election night screen can say why.

### Honest and dishonest advice

Advice quality depends on two attributes together:

| | High competence | Low competence |
|---|---|---|
| **High loyalty** | Accurate, and delivered straight | Tells you what you want to hear |
| **Low loyalty** | Accurate, but shaded toward their own interest | Unreliable in both directions |

The comfortable adviser and the useful adviser are often different people. This is a cabinet-building decision the player makes without being told they are making it.

### The standing cast

Fourteen recurring roles. **No names are assigned in this document.** Every name is issued through the naming protocol in 3.13 and recorded in the name registry; nothing unvetted goes into content.

| Role | Function in play |
|---|---|
| Chief of Staff | Runs the desk. Monthly read. Gatekeeper. |
| Special Adviser, Political | **The translator.** Explains what people actually mean. |
| Secretary to the Government | Bureaucracy; committees; where files go to rest |
| National Security Adviser | Security briefs, with confidence levels |
| Finance Minister | Budget, debt, the conversation with lenders |
| Central Bank Governor | Independent. Inherited. Removable only with two thirds of the Senate. |
| Party Chairman | The ticket; party discipline |
| Senate President | Bills, confirmations, impeachment |
| Speaker | The larger, rowdier chamber |
| Chair, Governors' Forum | Speaks for the governors, mostly |
| Labour leader | Heads the (fictional) labour centre |
| Opposition leader | The alternative government, he says |
| Investigative editor | Runs the investigative outlet's desk |
| Party elder | A retired statesman who issues open letters at the worst possible time |

When a player's presidency ends, **that president joins the cast as an elder** in the next presidency, with opinions.

### The translator

The Special Adviser on Political Matters is the game's main device for hidden information.

> **The Governor:** "I remain fully committed to Mr President's agenda."
> **Special Adviser:** "Sir, he is not. He held a meeting in Dubai on Thursday. Four governors attended."

The adviser's commentary is generated from true hidden state, degraded by his competence and coloured by his loyalty. He is the tutorial, the user interface for politics, and a character who can be lost. If he is fired, poached, or quietly working for someone else, the player goes partly blind.

## 3.6 Cabinet

### Ten key portfolios

Finance · Petroleum · Power · Works · Agriculture · Education · Health · Labour · Justice (Attorney General) · Information.

Each key minister's competence feeds the execution rate for their sector, and each appears in events for their brief. The remaining ministries are not individually simulated; they exist as a count by zone for the federal-character tally (3.8).

The president may retain the Petroleum portfolio personally. This gives direct control and removes a confirmation fight. It also means every fuel queue is the president's personally, and the papers know it.

### Appointment

Each vacancy offers three candidates drawn from archetypes:

| Archetype | Typical profile | Comes with |
|---|---|---|
| Technocrat | High competence, low clout | Investor approval; party resentment |
| Party loyalist | High loyalty, middling competence | Party approval |
| Governor's nominee | Variable; high clout in one zone | A governor's goodwill, and his expectations |
| Financier's candidate | Often low integrity | A debt repaid |
| Old hand | A former governor or minister, back again | Clout, baggage, and automatic confirmation |
| Outsider | High integrity, no network | Street and press goodwill; an Establishment that waits for them to fail |

The player sees each candidate's **reputation**: a rough read of their attributes that may be wrong. **Vetting** takes one month and reveals true competence and integrity. Appointing without vetting is faster and is how scandals get into the cabinet.

Appointing a candidate pleases their sponsor. Rejecting one slights the sponsor in proportion to the sponsor's clout.

### Confirmation

Ministers require Senate confirmation, played as a minor matter per batch.

- Former legislators are asked to take a bow and go.
- Technocrats without sponsors are asked detailed questions about the price of garri.
- A hostile Senate President can hold a nominee indefinitely. Releasing the nominee has a price.

### Dismissal, reshuffle and the alternatives

For any minister in trouble the player has more options than "sack":

- **Dismiss.** Clean. Costs PC scaled to clout. Their sponsor remembers.
- **Suspend pending investigation.** Buys time; the investigation must then actually conclude or it becomes its own story.
- **Redeploy.** Move them to a ministry where they can do less harm. Recognisable, and noticed.
- **Express full confidence.** Costs nothing today. Ties the president to whatever emerges.
- **Refer to a committee.** The matter enters a process and may never leave it. `integrity` pays.

A reshuffle (moving several ministers at once) is an action. It resets some relationships, pays some debts and creates new slights. The mid-term reshuffle at turn 24 is expected; skipping it is itself a statement.

### Ministers have their own plans

From turn 30, ministers with high ambition begin positioning. Some will resign to contest a governorship. Some will be persuaded to stay, at a price. A competent minister lost to ambition in year 4 is a real loss, and a foreseeable one.

## 3.7 Patronage and debts

Patronage exists in the game as explicit objects called **debts**, because pretending it does not exist would make the simulation false, and making it abstract would make it invisible.

A debt is a specific obligation to a specific character:

> **Owed to the Chair of the Governors' Forum.** Delivered three states in the general election. Expects Petroleum, or the board of the Delta development commission. Patient until turn 12.

The president starts with one to five debts depending on background (1.2). New debts are created whenever help is bought: a bill lobbied through with favours, a governor who calls off a revolt, campaign funding from a magnate.

Each debt can be:

- **Paid** in appointments, contracts or projects. Usually costs `integrity` or competence in a ministry.
- **Paid differently**: an honest alternative that the creditor may or may not accept (a policy concession, a real project in their state, public credit).
- **Refused.** Costs PC and the relationship.
- **Left to expire.** The creditor acts on it, often at the worst moment.

### The price of saying no falls as institutions rise

This is how the game avoids the conclusion that patronage is compulsory.

```
costOfRefusal = base * creditorClout * (1 - leverage)
leverage      = f(nationalApproval, integrity, capacity, partyReformMilestones)
```

A president with strong approval, credible institutions and a reformed party (direct primaries, transparent party finance) can refuse most debts at modest cost. A weak president cannot. The player can work to become the first kind. The system is a trade-off the player can change, never a moral assumption.

## 3.8 Federal character

The game keeps a tally of senior appointments by zone: the ten key portfolios, the security chiefs, the heads of the main revenue agencies, and the wider cabinet count.

An **imbalance index** is computed from the spread against an even distribution. It is hidden. When it crosses thresholds:

1. The Special Adviser mentions it: "Sir, people have started counting appointments."
2. A newspaper publishes the count as a table.
3. `sectionalGrievance` rises in under-represented zones; `cohesion` falls.
4. A lead file arrives: the *sectional government* storyline.

The tension is genuine. The best available candidate is sometimes from an already over-represented zone. The player can accept the imbalance and manage the politics, or balance and accept a weaker appointment, or do the harder thing and build a deeper bench (a civil-service reform milestone widens every candidate pool).

The president's own home zone counts double in public perception. Appointing well from one's own zone is the most expensive kind of good appointment.

## 3.9 The National Assembly

### Composition

Senate (109) and House (360). Each chamber has a party composition set at the election and changed by defections. Support is displayed as a **whip count** with a confidence label:

> **Senate, Tax Administration Bill:** Sure 48 · Leaning 11 · Against 50. *Chief Whip, moderate confidence.*

The count is an estimate. Its accuracy depends on the Party bloc's condition and the presiding officer's relationship with the president.

### Bills

A bill is an object with a **strength** from 3 (as drafted) to 1 (gutted), and a stage.

```
Drafting → First reading → Committee → Public hearing → Third reading (vote)
        → Harmonisation → Assent → Implementation
```

Each stage takes one to three months. Each month, a bill in the Assembly either advances, stalls, or is amended. Stalls come with reasons, generated from the real cause:

- "The hearing has been postponed. The committee could not form a quorum."
- "The Chairman is on an oversight visit to Dubai."
- "Distinguished Senators have requested further consultation with stakeholders."

The player's tools, each used as an action or offered in a minor matter:

| Tool | Cost | Effect |
|---|---|---|
| Lobby | PC | Raises this month's chance of advancing |
| Concede | Bill strength drops by 1 | Unblocks the stage |
| Trade | Creates a debt; `integrity` falls | Reliably unblocks |
| Logistics | Money from the purse (3.12) | Reliably unblocks at full strength, no debt. Creates an exposure record with every legislator involved as a witness. |
| Go public | PC; needs approval above 55 | Strong push, or a backfire that hardens the opposition |
| Wait | Nothing | The bill may die with the session |

A maximum of three presidential bills can be live at once. A bill's effects scale with its strength when it is finally signed, and **implementation** is its own stage: a signed law with a weak agency behind it under-delivers until capacity catches up.

### What the Assembly does unprompted

Oversight hearings, summoning ministers, padding the budget (4.4), screening nominees, passing its own bills for the president to sign or veto, overriding a veto with two thirds, and starting impeachment.

## 3.10 Constitutional and institutional limits

The president is not omnipotent. Options in events and actions declare the **instrument** they need, and are shown as unavailable with the reason when the requirement is not met.

| The president wants to | Needs |
|---|---|
| Spend money | An Appropriation Act |
| Borrow | A resolution of the National Assembly |
| Appoint ministers, ambassadors, heads of key agencies | Senate confirmation |
| Remove the central bank governor | Two thirds of the Senate |
| Change the minimum wage | An Act |
| Declare a state of emergency in a state | Two thirds of both chambers, within days |
| Create state police; change revenue sharing | A constitutional amendment: two thirds of the Assembly and 24 state assemblies |
| Direct policing in a state | The governor's cooperation, in practice |
| Allocate land for a project | The governor (land is vested in the states) |
| Run an election a certain way | Nothing. The electoral commission is independent, and interfering is recorded. |
| Do something by executive order | Nothing, but a court may suspend it, and a successor can reverse it with a signature |

The courts appear through events, not as a subsystem. An executive action has a legal soundness; a challenge succeeds or fails on that soundness. Obeying an adverse ruling costs the policy and protects the institution. Ignoring one keeps the policy, damages `integrity` and `standing`, and is remembered in the legacy verdict.

The instrument chosen for a reform also determines how long it lasts (4.1): an order is fast and fragile; an Act is slow and durable; a constitutional amendment is nearly permanent and nearly impossible.

## 3.11 The phone

The phone is where politics becomes personal and where hidden state leaks to the player.

- **Direct messages** from characters carry minor matters: requests, warnings, demands, congratulations that are also requests.
- **Groups** are authored threads the president can read. Tone and silence in a group track the hidden standing of its actor.

| Group | Tracks |
|---|---|
| PRESIDENCY CORE TEAM | Villa inner circle |
| CABINET (NO FORWARDS PLS) | Cabinet |
| NWC OFFICIAL | What the party says |
| NWC REAL | What the party thinks. The president is not supposed to be in this one. Access depends on the Special Adviser. |
| PROGRESSIVE GOVERNORS FORUM | Governors |
| SENATE CAUCUS | Senate whip count, roughly |

Groups are also a source of events: the message sent to the wrong group, the screenshot that reaches the youth outlet, the minister who "left."

## 3.12 Corruption as a choice

The president can be corrupt. This is a full system, because a Nigerian presidency simulator in which the player cannot steal, cannot buy a vote and cannot look away would be describing somewhere else.

### Rules of the design

1. **Available.** Corrupt options appear routinely, in plain official language, next to the honest ones.
2. **Effective.** Corruption works. It is the fastest, most reliable way to buy political survival in the game. If it did not work, it would not be a temptation and the satire would be false.
3. **Never required.** A clean presidency is always viable (3.7, and the Institutionalist bot in chapter 10). The game does not assume the player or any character is corrupt.
4. **Never punished by fiat.** There is no random "you were caught" roll. Consequences arrive only through mechanisms the player can see coming: people who know, journalists who dig, and successors who inherit the files.
5. **Never moralised in the moment.** No pop-up disapproves. The record is kept, and the verdict states it plainly.

### Three different things

The game tracks these separately, because the verdict treats them differently and because they are different in life.

| Kind | What it is | Example |
|---|---|---|
| **Tolerating** | Looking away while allies take | "Express full confidence in the Minister" |
| **Political finance** | Taking in order to fund politics | Kickback routed to the campaign |
| **Personal enrichment** | Taking for oneself and one's family | The front company; the property abroad |

A president can finish with the verdict line: *"He took nothing for himself. Everything around him was for sale."*

### The Drawer

Illicit money sits in a private resource called **the purse**, in naira. In the interface it is a locked drawer in the presidential desk (9.4). In conversation it is always called **logistics**.

**Ways in:**

| Source | How it appears | Side effect |
|---|---|---|
| Security vote | A standing, unaudited allocation. Draw from it quietly each month. | Low exposure; security spending under-delivers |
| Contract inflation | On any project or procurement: choose the preferred contractor | Cost up, real progress down, reported progress unchanged |
| FX and subsidy arbitrage | Dollars at the official rate, or subsidy claims, for friends | Large. Only exists under the peg or the subsidy, so **the president now profits personally from the policies that are ruining the country**, and reform costs them money |
| Appointments | A financier's candidate comes with a contribution | A low-integrity minister |
| Licences and allocations | Oil blocks, import waivers, lifting contracts | `oilTheft`, `integrity` |
| Windfalls | A share of any unbudgeted inflow | The savings that were not saved |
| Gifts | A contractor's "goodwill" on a birthday | Small; the giver expects to be remembered |
| Family | A relative's company; a relative on the payroll | The tabloid's favourite subject |

**Ways out:**

| Use | Effect |
|---|---|
| Buy votes in the Assembly | A bill advances reliably, at full strength, with no debt created |
| Delegates | Secures the ticket at the primary |
| Campaign | War chest without new debts to financiers |
| Settle a governor, elder or union leadership | Immediate standing gain. Settled union leaders are later replaced by angrier ones. |
| Brown envelopes | Softens an outlet's stance for a few months; can slow an investigation. Fails badly against the investigative outlet. |
| Keep the Villa sweet | Loyalty, while the money lasts |
| Keep it | A private fortune. Does nothing during play. Recorded in the history as *undeclared*. Useful after office for legal defence, a successor's campaign, or leaving the country. |

### What it costs

**Leakage.** Every act lowers `integrity` and adds a `graft` term to the execution rate (2.5). Stolen money is money that did not become roads, and the indices reflect it.

**Exposure.** Every act creates a record:

```ts
interface Exposure {
  causeId: string;                 // archived in a sealed part of the archive
  kind: 'tolerated' | 'political' | 'personal';
  amount: number;
  witnesses: string[];             // characters who know
  paperTrail: 0 | 1 | 2 | 3;       // how findable it is
  offshore: boolean;
}
```

**Leverage.** Every witness now holds leverage over the president. A minister with leverage cannot be safely dismissed, disciplined or refused. The loyalty relationship inverts: the president becomes the one who must keep them happy. A cabinet full of accomplices is a cabinet the president cannot manage.

**The example is followed.** Each appointee's monthly scandal hazard scales with the president's own exposure count. When the president takes, everyone below takes more, and the option "dismiss the Minister for corruption" starts returning the result "The Minister has asked for a private word."

**The press.** Exposure with a paper trail is what the investigative clock (7.6) looks for.

**Abroad.** Offshore exposure can surface through a foreign court or a leaked filing. This costs `standing` and is outside the president's power to settle.

### Immunity, and why the succession matters

A sitting president cannot be prosecuted. Impeachment is the only danger in office, and it is political.

**Immunity ends at the handover.** From that day every exposure record belongs to whoever is president next. A corrupt president therefore cares intensely about three things an honest one can ignore: winning the second term, controlling the party's choice of successor, and the state of the anti-corruption agency on the way out.

When the player then plays the successor (8.3), the predecessor's file is on the desk in the first year: **probe, settle quietly, or let it rest.** The former president, now an elder with a purse, will lobby, offer and threaten. If the player was that former president, they are deciding what to do about themselves.

### Anti-corruption as a weapon

A president may run the anti-corruption track honestly, or selectively.

- **Honest:** raises `integrity`, implicates allies, costs Party standing.
- **Selective:** investigations open on opponents. It works. Opposition figures under investigation defect to the ruling party, after which their files stop moving. The Party grows, `oppositionStrength` falls, `integrity` falls, and the agency itself is damaged for whoever inherits it.

A president can be personally corrupt and run a selective anti-corruption campaign at the same time. The papers will notice the pattern before the public does.

### Cover stories

When an exposure surfaces, the response options include the honest ones and the traditional ones: deny, blame a predecessor, constitute a committee, discover that the records were destroyed. The more absurd explanations in 5.11 are available here to the president as tools.

## 3.13 Naming protocol

Characters have ordinary Nigerian names. No character may be mistakable for a real public figure.

1. Choose a first name and a surname of the kind found where the character comes from.
2. Search the full name on the web, in quotation marks, with "Nigeria".
3. If the search finds a politician, official, businessman, athlete, journalist, cleric or anyone in the news under that name, choose another. Private individuals with a professional profile do not count; a common name will always be shared by somebody.
4. Do not give a character a real public figure's distinctive surname in the same line of work, even with a different first name.
5. Record the name in `content/names.ts`, `content/people.ts` or `content/tycoons.ts`. Nowhere else.
6. Businesspeople are composites. A sector plus a home town can identify a real person faster than a name, so none is given a home town.
7. Parties, newspapers, unions, agencies and companies have invented names and are never real organisations accused of anything.
8. A character whose slot can be filled by different people (a cast file, a replaced minister) is written without gendered pronouns.

History: the first build used parody surnames taken from political vocabulary (Protocol, Structure, Bow-and-Go). They could not collide with anyone, and the player disliked them as names. They were replaced on 2 October 2026. In the vetting pass 47 names were searched and about one candidate in five was rejected, among them a Commonwealth Games boxer, a party financier once arrested by the anti-graft agency, a House of Representatives aspirant and a newspaper editor.
