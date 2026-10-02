# 8. Legacy and Persistence

The world remembers. This chapter defines what is recorded, how a presidency is judged, and what the next president walks into.

## 8.1 The Presidential Archive

Every outcome writes an archive entry. The archive is the game's memory and feeds five other systems.

```ts
interface ArchiveEntry {
  id: string;                      // also the causeId used by the ledger
  turn: number;
  presidencyId: string;
  category: Category;
  headline: string;                // 'Removed fuel subsidy'
  detail: string;                  // one neutral sentence
  significance: 1 | 2 | 3;         // 3 = defining
  tags: string[];
  cast: string[];                  // characters involved
  signature?: boolean;
}
```

Entries are written in a neutral register: what was done, not whether it was wise.

**The archive powers:**

| System | Use |
|---|---|
| The trace (2.6) | "How did we get here?" on crisis files |
| Character memory (3.5) | Grievances and favours link back to entries |
| The legacy verdict (8.2) | Defining decisions and the narrative |
| Newspapers (7.4) | Anniversary scorecards and the retrospective |
| Election night (6.7) | The lines of consequence as states declare |

**Player view:** a timeline by year, filterable by category, with defining decisions marked. Each entry can be opened to show what followed from it: the scheduled effects it created and whether they have landed. Looking back at a decision and seeing its descendants is a quiet version of the trace that the player can browse at will.

Adviser track records (5.4) live here too.

## 8.2 The legacy verdict

Shown at the end of every presidency, however it ended. There is no single score.

### Ten dimensions

| Dimension | Measured from |
|---|---|
| Prosperity | Growth, jobs, hardship |
| Fiscal stability | Debt service ratio, reserves, subsidy and arrears left behind |
| Security | National and zonal security |
| Infrastructure | Infrastructure and power indices; projects commissioned |
| Public services | Services index |
| State capacity | `capacity` |
| Institutional strength | `integrity`; court orders obeyed; independence of regulators respected |
| Public trust | Approval trajectory; statements that proved false |
| National cohesion | `cohesion`; zone approval spread; sectional grievance |
| Political survival | How the presidency ended; state of the party left behind |

### Judged against the inheritance

Each dimension is graded on **change from what was inherited**, not on its absolute level.

| Grade | Meaning |
|---|---|
| Transformed | Far stronger than found |
| Stronger | Clearly better |
| Held | Roughly as found |
| Weaker | Clearly worse |
| Squandered | Far worse than found |

A president who takes over a wreck and leaves it merely poor has done well, and the verdict says so. A president who inherits a boom and coasts is graded *Held* and the verdict says that too. This is what makes later presidencies in the same world fair to play.

Each grade is shown with its one or two biggest causes, pulled from the archive.

### The reforms table

Every completed milestone and signed bill, with its entrenchment:

| Reform | Instrument | Status at handover |
|---|---|---|
| Subsidy removal | Executive | Fragile |
| Tax Administration Act | Act | Entrenched |
| Electricity market amendments | Act | Established |

This table is the most honest measure of a presidency: what will still be true in ten years.

### The bill left behind

A plain list of liabilities handed to the successor: unfunded agreements, arrears, debts taken on, projects started and unfinished, promises made in the campaign. A popular president's page here can be long.

### The private ledger

If the president took, tolerated or financed politics illicitly (3.12), the verdict opens the sealed part of the archive and states it without comment:

> **Tolerated:** 6 instances. **Political finance:** ₦41bn. **Personal:** ₦84bn, of which ₦60bn offshore.
> **People who know:** 5. **Paper trail:** substantial.
> **Immunity ended today.**

The amounts are also shown as what they would have bought: kilometres of road, months of the university agreement, megawatts. This is the only place the game draws that comparison, and it does so once.

A corrupt presidency is graded on the same ten dimensions as any other. If the indices rose, the verdict says they rose. It also says what was taken.

### The epithet and the narrative

The verdict opens with a short epithet and three paragraphs, assembled from authored fragments selected by rule.

The epithet is chosen from the *shape* of the ten grades, not their sum:

| Shape | Epithet |
|---|---|
| High performance, lost the election | The Reformer They Voted Out |
| Low performance, won comfortably | The Popular President |
| Institutions transformed, everything else moderate | The Builder of Boring Things |
| Strong early, undone late | The Unfinished Presidency |
| Survived everything, changed nothing | The Survivor |
| Fiscal stability squandered, approval high | The Generous One |
| Removed from office | The Cautionary Tale |
| Large private fortune, indices fell | The Looter |
| Large private fortune, indices rose | The One Who Ate and Worked |
| Clean personally, tolerated everything | The Man Who Saw Nothing |
| Broad improvement and re-election | The Consequential President |

About twenty epithets cover the space. Each has variants so the same shape does not always read the same.

Example narrative, assembled:

> You lost the election by four states.
>
> Inflation is down by nine points, power supply has improved for the first time in a decade, and three of your reforms are now law and politically untouchable. Your successor will take credit for the revenue they produce.
>
> Your party blames you. The governors you refused have not forgiven you, and Rivers was closer than it needed to be. Economists will spend the next decade arguing about your presidency.

Each sentence is a fragment keyed to a condition: the ending, the two best dimensions, the entrenched reforms, the state of the party, a character memory with high weight, a closing line by shape. Around 150 fragments give enough variety.

### What the verdict never does

- It never reduces to a number or a letter.
- It never calls a lost election a failure by itself, or a won one a success.
- It records abuses plainly. Ignored court orders, press arrests, deaths in protests under the president's orders are listed by name and are not offset by good numbers elsewhere.

## 8.3 Succession

When a presidency ends, the player creates the next president in the same world, or starts a new world.

**The next president is whoever won.**

- If the player won two terms, the successor's party depends on the final election, which the outgoing president influenced through the succession storyline (6.4).
- If the player lost, **the player now plays the person who beat them.** Their former party is the opposition. Their former ministers are in the Senate, on television, and occasionally in court.
- If the player was removed, the vice president completed the term off-screen; the next election is resolved by the model, and the player takes the winner.

The transition setup (1.2) runs again with the new world state. The background and mandate choices remain; the mandate options are constrained by how the election actually went.

## 8.4 The inheritance

What carries over, and how it appears to the new president.

| Carries over | How it shows up |
|---|---|
| All 22 nation variables | The starting dashboard. The Finance Minister's first briefing is an account of what was left. |
| All pressures | Invisibly. The new president's first year is partly the old president's pressures maturing. |
| World-scoped flags | Event conditions. `labour.wageAgreement = 'signed_unfunded'` is now the new president's problem. |
| The liabilities list | A file on day one: *Obligations of the previous administration.* |
| Reforms, with entrenchment | Each can be kept, strengthened or reversed. Reversing costs PC in proportion to entrenchment. Fragile reforms can be reversed by signature; entrenched ones need an Act and a fight. |
| Projects | On the map with their true progress, which may differ from what was reported. Finish, abandon or rename. |
| Institutions | `capacity` and `integrity` are exactly as left. A hollowed-out state stays hollow. |
| The central bank governor and other fixed-term officials | In post, with their own view of the new president |
| Characters | See below |
| Assembly composition and governors | From the election model |
| Outlet stance | Resets toward neutral; credibility and memory of false statements persist for the institution, not the person |
| The archive | Complete. Traces cross presidencies. |
| The predecessor's exposure records | A file in the first year: *Matters arising from the previous administration.* Probe, settle quietly, or let it rest (3.12). Each choice has a constituency. A probe pleases the Street and the press, alarms everyone in the new president's own party with something to hide, and sets the precedent for what the next successor will do to the player. |

### Characters across presidencies

- **The former president** becomes an elder with clout proportional to their legacy, and opinions. A respected predecessor's endorsement or open letter matters. A disgraced one is a liability to their own party.
- **Recurring figures** age and move: a minister becomes a senator, a governor finishes his term and becomes a party elder, a labour leader retires and is replaced by a more militant deputy.
- **Relationships reset** toward the new president based on party and on what the new president's party did to them.
- Characters retire after a span of years. New ones are generated from archetype pools to keep the cast full.

### Inherited crises

The Director gives a weight bonus in a new president's first year to events whose trace leads back to the previous presidency. The `inherited` condition lets the writing change:

> **Inherited:** "Labour demands implementation of the agreement signed by the previous administration."
> **Own:** "Labour demands implementation of the agreement Mr President signed in March."

Blaming the predecessor is an available option on inherited files. It works for about a year. The papers track how often it is used.

## 8.5 History of Presidents

A gallery of every presidency in this world.

```
PRESIDENT [PLAYER NAME]                            2027 – 2031
[Party] · Kano · One term · Defeated

"The Reformer They Voted Out"

Inflation         24% → 15%        Growth          2.9% → 4.1%
Debt service      66% → 51%        Approval        58% → 41%
Projects          3 commissioned   Reforms         5, of which 3 entrenched
Scandals          2                Cabinet         14 ministers in 10 seats
Undeclared        ₦0

Left behind: one unfinished rail line; a funded wage agreement.
```

Each record opens to the full legacy verdict and archive.

A world with five or six presidencies becomes a small political history: a refinery started by one, stalled under two, commissioned by a fourth; a tax act that survived three attempts at repeal; a debt crisis with a visible author. This is the long-game payoff and the reason to keep one world going.

A record can be exported as a shareable image, which is the natural route to people showing each other their presidencies.

## 8.6 What is saved

```ts
interface Save {
  version: number;
  world: {
    seed: number; rngState: number;
    turn: number;                  // absolute, across presidencies
    nation: NationState;
    pressures: Pressures;
    flags: Record<string, FlagValue>;     // world-scoped
    states: StateData[]; zones: ZoneState[];
    characters: Character[];
    projects: Project[];
    reforms: Reform[];
    liabilities: Liability[];
    outlets: Outlet[];
    ledger: ScheduledEffect[];
    archive: ArchiveEntry[];
    history: PresidencyRecord[];
  };
  presidency: {
    id: string; president: PresidentProfile;
    termFlags: Record<string, FlagValue>;
    politicalCapital: number;
    blocs: BlocState; cabinet: Cabinet; debts: Debt[];
    agenda: AgendaState; bills: Bill[];
    desk: DeskState;               // this month's files, so a reload resumes exactly
    baseline: NationState;         // snapshot at inauguration, for the verdict
  };
}
```

Autosave at every phase change. Three manual world slots. No save-scumming protection beyond the seeded generator: reloading and choosing the same option yields the same result, which removes most of the incentive.
