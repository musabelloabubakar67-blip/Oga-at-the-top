# 6. Regions and Elections

## 6.1 Geography

The game uses Nigeria's real political geography: 36 states and the Federal Capital Territory, grouped in six geopolitical zones.

| Zone | States | Approx. share of registered voters |
|---|---|---|
| North West | Jigawa, Kaduna, Kano, Katsina, Kebbi, Sokoto, Zamfara | 24% |
| South West | Ekiti, Lagos, Ogun, Ondo, Osun, Oyo | 19% |
| North Central | Benue, Kogi, Kwara, Nasarawa, Niger, Plateau, and the FCT | 16% |
| South South | Akwa Ibom, Bayelsa, Cross River, Delta, Edo, Rivers | 15% |
| North East | Adamawa, Bauchi, Borno, Gombe, Taraba, Yobe | 13% |
| South East | Abia, Anambra, Ebonyi, Enugu, Imo | 12% |

Shares are rounded from the public voter register and should be refreshed from the electoral commission's published figures when the data file is built.

### Two resolutions

- **Zones are simulated.** Approval, local security, grievance and salience are tracked for six zones every month.
- **States are simulated only where it matters:** governors, project locations, local crises on the map, and the election.

Running 37 full simulations monthly would add cost and noise without adding decisions.

### State data

```ts
interface StateData {
  id: StateId;
  zone: ZoneId;
  voters: number;               // registered, in thousands
  lean: number;                 // -20 to +20 toward the president's party; set at each election
  governor: { characterId: string; party: PartyId; termEndsTurn: number };
  traits: {                     // facts, used by event conditions and by salience
    oilProducing: boolean;
    farmBelt: boolean;
    floodRisk: 0 | 1 | 2 | 3;
    majorPort: boolean;
    industrialBase: 0 | 1 | 2 | 3;
    urbanShare: number;
  };
  local: { security: number; services: number; projects: ProjectId[] };
}
```

Traits are physical and economic facts. There are no cultural or attitudinal fields.

## 6.2 Zone approval

Each zone has an approval percentage. National approval is the voter-weighted average.

Each month a zone's approval moves a fraction of the way toward a target:

```
target = base
       - hardshipTerm   * salience.hardship
       - insecurityTerm * salience.security
       - servicesTerm   * salience.services
       + deliveryTerm   (projects commissioned, visible local wins)
       - sectionalGrievance
       + partisanTerm   (state leans, home-zone effect)
       + eventShocks
```

## 6.3 Salience: how regional politics stays honest

The rule that keeps the game clear of stereotype: **what a zone cares about is computed from what is happening there.**

```
salience.issue(zone) = severity(issue, zone) ^ k  /  sum over issues
```

- Where kidnapping is acute, security dominates approval. If security there is restored, security stops dominating and the cost of living takes over.
- Where a port city's economy is suffering from congestion and FX shortages, those dominate.
- A zone hit by floods cares about relief and reconstruction until it is rebuilt.

No zone has a hard-coded priority. The same zone behaves differently in different games and across a single presidency, because conditions differ. A player who fixes a zone's worst problem finds the zone's politics change in response.

Local severity is fed by state traits and events. A fuel price rise hurts more where transport distances are long. A flood hits where `floodRisk` is high. Farm-belt insecurity is a security issue locally and a food-price issue everywhere else, three to nine months later.

## 6.4 The ticket

A sitting president is not automatically the party's candidate.

At turn 37 the Party's condition decides the shape of the primary:

| Party mood | Result |
|---|---|
| Devoted or Solid | Affirmation by consensus. A ceremonial event. |
| Wary | A challenger emerges. The **Ticket** storyline: negotiate with governors, settle debts, or fight a real primary. |
| Strained | A serious primary. Can be lost. |
| Breaking | The party is already splitting; see 3.4. |

Paying outstanding debts, the governors' relationships, and the running-mate decision (keep or replace) all feed the primary. A president who has refused patronage for three years reaches this point with clean institutions and a party that has been waiting.

Losing the primary does not end the game. The president serves out the term with collapsing PC and one remaining freedom: nothing left to lose. Some of the best reform windows open here.

In a second term this storyline becomes the **succession**: the president can back a successor, stay neutral, or be ignored.

## 6.5 The campaign (turns 40 to 45)

Campaign actions become available in the action slot. Using the slot to campaign means not using it to govern, which is the point.

| Action | Effect | Cost |
|---|---|---|
| Rally in a zone | Turnout and share in that zone | Time |
| Settle with a governor | That state's machine works for you | A debt, or a concession |
| Message: record | Works if the indices actually improved | Backfires if hardship is high |
| Message: fear of the alternative | Works when the opposition is weak or divided | `cohesion` falls |
| Message: promise | Approval now | A flagged promise the second term must honour |
| Debate | Variance; rewards a president with a real record | Risk |
| Decline to debate | Safe | The empty chair is the story |

### Campaign finance

A war chest is needed for nationwide reach. Three sources:

- **Small donors and party dues.** Clean and thin. Scales with approval and Street mood.
- **Financiers.** Ample. Each contribution is a new debt for the second term.
- **State resources.** Ample and deniable. Large `integrity` cost, feeds `scandalHeat`, and is the first thing the tribunal and the investigative clock look for.
- **The purse.** Whatever the president has put in the drawer over four years (3.12). No new debts, no new paper trail at the point of spending. This is the pay-off the corrupt path has been building toward, and it is decisive at the primary, where delegates are few and can be counted.

### The opposition

The opposition is simulated lightly but is not passive.

- `oppositionStrength` rises with hardship, scandals and defections from the ruling party.
- `oppositionUnity` decides whether there is one challenger or two. A divided opposition can let an unpopular president win on a plurality. The president can influence this, cleanly or otherwise.

## 6.6 The vote model

Calculated state by state.

```
share(state) = 50
             + lean(state)
             + 0.35 * (zoneApproval - 50)
             + governorEffect      // ±4: aligned governor × his local standing × relationship
             + machine             // ±3: Party bloc condition
             + campaign            // ±3: rallies, message fit
             + homeEffect          // +6 home state, +3 home zone, +2 running mate's zone
             - scandalDrag         // 0 to 4
             - sectionalGrievance  // zone-specific
             + noise               // small, seeded

turnout(state) = base * enthusiasm * securityFactor
votes(state)   = voters * turnout * share
```

- **Governor effect** is where relationships built or burned over four years are cashed. A governor with a recorded slight sits on his hands.
- **Turnout** is its own lever. Low enthusiasm in a stronghold is as damaging as losing a swing state. Insecurity suppresses turnout where it is worst.
- **Third candidates** take share from the incumbent or the main challenger depending on `oppositionUnity`.

### Winning

The constitutional test has two parts:

1. The highest number of votes nationally.
2. At least 25% of the votes in at least two thirds of the 37 units (36 states and the FCT). The game uses **25 units**.

If no candidate satisfies both, there is a **run-off** one month later between the top two.

The second requirement matters to strategy. A president who is overwhelmingly popular in two zones and unwelcome in the rest can win the count and fail the spread. National cohesion is an electoral asset.

(How the FCT counts toward the spread has been argued in real courts. The game takes the simple reading for its rule and uses the ambiguity as tribunal storyline material.)

## 6.7 Election night

The set-piece of each term. The player watches; the only input is to continue.

- States are declared one at a time in an order built for tension: safe states first, then states that reveal a trend, the closest and largest last.
- A running display shows the national tally, the count of states at or above 25% for each candidate, and a map filling in.
- Each declaration has a line from the returning officer and, where earned, a line of consequence: *"Rivers. The Governor did not attend the final rally."* These lines are generated from character memory and the trace, so the night replays the term.
- The commission's results portal experiences technical challenges at least once.
- Outlets call the result at different times. The Federal Chronicle waits for the commission. NaijaNow does not.

A full night takes three to four minutes. A "skip to result" control exists and is not prominent.

## 6.8 After the result

| Outcome | What follows |
|---|---|
| Clear win | Second inauguration at turn 48. A short second-term transition: reshuffle, new agenda pick (keep two, change one). |
| Narrow win | An election petition. A tribunal storyline through the first months of the second term, decided by legal soundness, campaign finance choices, and `integrity`. |
| Run-off | One more month with campaign actions only. |
| Loss | Concede, or contest. Conceding promptly raises `cohesion`, `standing` and the legacy. Contesting can occasionally succeed and always costs. Then a handover period (turns 46 to 48) in which the player decides what to leave tidy and what to leave for the successor. |

The handover choices are small and telling: sign the last-minute contracts or not, make the late appointments or not, brief the incoming team properly or not. They are recorded, and the next president inherits them (chapter 8).

## 6.9 Elections that are not the president's

- **Off-cycle governorship elections** occur during the term as events. Each tests the party machine and changes a governor.
- **Assembly composition** is reset at each general election from the same state-level model, so a president can win while losing the Senate.
- **Defections** change composition between elections.
