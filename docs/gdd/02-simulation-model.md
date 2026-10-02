# 2. Simulation Model

> **As built.** This chapter is the original design. [Chapter 0](00-as-built.md) describes the game in the code. The main differences here:
>
> - Nine national figures and three pressures, not twenty-two and nine.
> - Nothing is hidden (2.4 is superseded). Expected and measured effects are shown, and the treasury, inflation, political capital and each theatre have itemised explanations.
> - Debt is a ledger of six named debts; debt service is derived from three of them. Security is derived from six theatres. There are four funds, an oil price and an annual budget. See chapter 0.2.
> - Starting scenarios (2.9) are not built. There is one inheritance.


The simulation has three layers with different speeds and different visibility.

| Layer | Examples | Speed | Player sees |
|---|---|---|---|
| **Nation** | Inflation, security, power, capacity | Slow, laggy | Real figures, sometimes stale |
| **Politics** | Blocs, actors, approval, capital | Fast | Words and trends, plus what advisers tell them |
| **Pressures** | Fuel supply stress, wage grievance, scandal heat | Accumulating | Nothing directly; only symptoms and warnings |

## 2.1 Nation variables (22)

These are the government performance scoreboard. Economic variables use real units because Nigerians argue about the exchange rate in naira, not in index points. System and institution variables are indices from 0 to 100.

### Economy

| Variable | Unit | Start (2027) | Notes |
|---|---|---|---|
| `inflation` | % year on year | 24 | Moves 15% of the way to its target each month |
| `fxRate` | ₦ per $ | 1,450 | Behaviour depends on the currency regime flag |
| `reserves` | $bn | 34 | Drained by defending a peg, fuel imports, debt service |
| `growth` | % annual | 2.9 | |
| `jobs` | 0 to 100 | 38 | Shown to the player as an unemployment estimate |
| `petrolPrice` | ₦ per litre | 950 | Set by subsidy regime, FX rate and supply |
| `oilOutput` | m barrels/day | 1.45 | Partly endogenous: falls with oil theft and Delta insecurity |
| `oilPrice` | $ per barrel | 74 | Exogenous random walk with authored shocks |

### Fiscal

| Variable | Unit | Start | Notes |
|---|---|---|---|
| `revenue` | ₦tn per year | 21 | Oil plus non-oil; non-oil scales with growth and tax administration |
| `debtServiceRatio` | % of revenue | 66 | The number that quietly decides what is affordable |
| `subsidyBill` | ₦tn per year | 4.2 | Zero when subsidy is fully removed |
| `fiscalSpace` | ₦tn, derived | — | Revenue minus debt service, wages, statutory transfers and subsidy. This is the budget envelope |

### National systems (0 to 100)

| Variable | Start | What it means |
|---|---|---|
| `security` | 38 | National composite; each zone also has its own value |
| `power` | 30 | Delivered electricity and grid reliability |
| `food` | 42 | Supply and affordability |
| `infrastructure` | 35 | Roads, rail, ports |
| `services` | 36 | Health and education delivery |

### Institutions (0 to 100)

| Variable | Start | What it means |
|---|---|---|
| `capacity` | 34 | Can the state execute? Drives execution rate and data quality |
| `integrity` | 28 | Inverse of corruption in practice, and perception of it |
| `investorConfidence` | 40 | Drives capital inflows and growth |
| `standing` | 45 | International reputation and leverage |
| `cohesion` | 44 | Do the zones feel they belong to the same project? |

### Derived, shown to the player

- **Hardship** (0 to 100): a cost-of-living composite of inflation, food, petrol price relative to wages, jobs and power. Hardship is the main driver of approval and of labour's mood. It is the single most important derived number in the game.
- **National approval** (%): voter-weighted average of the six zone approvals (6.2).

## 2.2 Political variables

Detailed in chapter 3. Listed here for completeness.

- `politicalCapital` (0 to 100): spendable.
- Five **blocs**, each an aggregate of two to four **actors** with standing from 0 to 100.
- Six **outlet stances** from -2 to +2.
- Per **character**: relationship (-100 to +100) and a memory log.
- Per **zone**: approval, sectional grievance, local security.
- Per **chamber**: a whip count (sure, leaning, against).

## 2.3 Pressures (9 hidden accumulators)

Pressures are the mechanism for slow, compounding consequences. Each runs from 0 to 100, accumulates from conditions and decisions, and fires threshold events when it gets high. The player never sees the number. They see the symptoms, the adviser who notices, and eventually the crisis.

| Pressure | Rises with | Falls with | Fires |
|---|---|---|---|
| `fuelSupplyStress` | Low reserves, FX scarcity, marketer debts, capped prices | Deregulation, domestic refining, FX availability | Petrol scarcity, queues, black market |
| `gridFragility` | Underfunded maintenance, gas debts, vandalism | Power capex, gas payment discipline | Grid collapse (recurring) |
| `wageGrievance` | Hardship rising faster than wages, broken agreements | Wage awards actually paid, falling inflation | Strike notices, general strike |
| `arrears` | Agreements signed without budget lines | Payments, renegotiation | "Government has reneged" storylines; inherited by successors |
| `farmDistress` | Insecurity in farm belts, input costs, flooding, underfunding | Agriculture spending, security in the Middle Belt and North West | Food price spikes, farmer protests |
| `oilTheft` | Delta insecurity, weak integrity, surveillance contract politics | Security spending, community settlements, integrity | Output drops, revenue shortfalls |
| `scandalHeat` | Low-integrity appointees, patronage deals, press hostility | Audits, prosecutions that conclude, transparency reforms | Scandals; feeds the investigative clock (7.6) |
| `sectionalGrievance` (per zone) | Appointment imbalance, neglected local crises, tone-deaf statements | Visits, balanced appointments, projects that finish | "Running a sectional government?" storyline; cohesion loss |
| `reformFatigue` | Painful reforms stacked close together without visible payoff | Time, visible wins, relief measures | Backlash events; makes every further reform costlier |

`reformFatigue` is the guard against the obvious degenerate strategy of doing every hard thing in month one. Reforms can be front-loaded, but not all of them.

## 2.4 What is hidden

| Information | Visibility |
|---|---|
| Economic figures | Shown as real numbers, but with a lag and an error band that both shrink as `capacity` rises. At low capacity the inflation figure is two months old and labelled "provisional". |
| System indices | Shown as five-step words (Critical, Poor, Fragile, Functional, Strong) with a trend arrow. Exact value available in the situation room only when capacity is above 60. |
| Bloc mood | Five-step word with a trend arrow. Never a number. |
| Actor standing | Hidden. Revealed in fragments by the Special Adviser, the phone, and the papers. |
| Character attributes | Reputation is visible (a rough, sometimes wrong read). True values are revealed by vetting and by experience. |
| Character relationship | Hidden. The Special Adviser translates. |
| Pressures | Hidden entirely. |
| Outcome of a choice | Adviser reads with confidence labels (5.4). |
| Whip count | Shown as an estimate with a confidence label. |

The principle: **the player always has enough information to make a reasoned decision and never enough to make a certain one.** Investing in institutions and in competent, honest advisers is how the player buys better information.

## 2.5 The monthly tick

Directional specification. Coefficients are tuning parameters and live in one config file.

### Prices and currency

```
inflationTarget = 12
                + fxPassThrough(12-month change in fxRate)
                + fuelPassThrough(6-month change in petrolPrice)
                + foodGap(60 - food)
                + monetisation(deficit financed by central bank)
                - tightness(central bank stance)

inflation += 0.15 * (inflationTarget - inflation)
```

Currency behaviour depends on the regime flag:

- **Managed peg.** `fxRate` holds. `reserves` drain in proportion to pressure. A hidden parallel-market gap opens. Business Abuja reports the gap before the central bank admits it. When reserves hit a floor, a forced devaluation event fires, and it is worse than a chosen one.
- **Float.** `fxRate` moves with pressure immediately. The gap closes. Investor confidence rises after a lag. Inflation takes the hit up front.

`pressure = importDemand + debtService - oilEarnings - capitalInflows(investorConfidence) - remittances`

### Revenue and debt

```
revenue = oilOutput * oilPrice * fxRate * governmentTake
        + nonOilBase * growthFactor * taxAdministration(capacity, flags)

debtServiceRatio rises with: borrowing level chosen in the budget,
                             fxRate depreciation (foreign debt),
                             central bank tightness (domestic debt)
```

Removing subsidy and floating the currency both raise naira revenue. This is the fiscal reward for the two most politically expensive decisions in the game, and it arrives several months after the pain.

### Growth and jobs

```
growthTarget = 3 + a*investorConfidence + b*power + c*infrastructure + d*security
                 - e*inflationDrag - shocks
jobs drifts toward a level set by growth, with a long lag
```

### National systems

Each system index moves toward a target set by delivered spending in its sector over the previous 6 to 18 months, modified by the competence of its minister and by shocks.

```
delivered = allocated * executionRate
executionRate = 0.35 + 0.45 * (capacity/100) + 0.15 * (integrity/100) + ministerBonus - graft
```

`graft` is the share taken out of that sector by the president's own arrangements and by appointees following the example (3.12).

At starting values, roughly 55 kobo of every budgeted naira turns into outcomes. A president who raises capacity and integrity to 70 gets about 77 kobo. **This is how institutional reform becomes the best long-term investment in the game without the game ever saying so.**

### Institutions

`capacity` and `integrity` only move through decisions: appointments, reform milestones, how scandals are handled, whether shortcuts are taken. They do not drift on their own, except that both decay slowly when patronage deals are made and when ministries are left vacant.

## 2.6 The ledger: delayed consequences

Every outcome can schedule future effects. This is the core memory mechanism.

```ts
interface ScheduledEffect {
  id: string;
  causeId: string;          // the archived decision that created this
  dueTurn: number;          // may be a range resolved at scheduling time
  effects: Effect[];
  condition?: Condition;    // only fires if still true when due
  visible: boolean;         // does the player get a forecast line?
  label: string;            // "Transport fares respond to the new pump price"
}
```

Three kinds of delay, used deliberately:

1. **Scheduled effects** (months): a decision's known second-order results, such as fares rising two months after a pump price change.
2. **Pressures** (quarters): decisions that tilt an accumulator, such as underfunding agriculture nudging `farmDistress` every month.
3. **Flags and inheritance** (years): a state of the world that later events check, such as `wage_agreement_unfunded`.

### The trace

Because every scheduled effect and every pressure contribution records its `causeId`, a crisis file can carry a **"How did we get here?"** tab. It lists the two to four archived decisions that contributed most, in date order, in neutral language:

> **October 2027.** Agriculture funded at *Lean* in the 2028 budget.
> **March 2028.** Fertiliser support request declined.
> **August 2028.** Request to redeploy troops to the Benue farm belt deferred.
> **February 2029.** Food prices up 41% on the year.

This is the single most important piece of feedback in the game. It turns "bad luck" into "that was me," and it works identically for inherited decisions, where the names in the trace belong to a previous president.

The trace shows contributing decisions without percentages. It informs; it does not solve the game for the player.

## 2.7 Flags

Boolean or small-value facts about the world, namespaced.

```
policy.subsidy            'full' | 'partial' | 'removed' | 'restored'
policy.fxRegime           'peg' | 'float'
labour.wageAgreement      'none' | 'signed_unfunded' | 'funded' | 'broken'
uni.agreement             'inherited_unfunded' | 'phased' | 'implemented' | 'broken'
cabinet.finance.status    'ok' | 'under_investigation' | 'suspended'
senate.president.hostile  boolean
emergency.declared.<zone> boolean
```

Each flag declares its scope:

- `term`: cleared at the end of the presidency.
- `world`: persists across presidencies and becomes part of the inheritance (chapter 8).

## 2.8 Randomness

All randomness comes from a seeded generator stored in the save. The same save and the same choices always produce the same result, which makes bugs reproducible and the balance harness possible. Outcome variance is real but bounded: an effect of `-8` with `spread: 3` lands between -11 and -5.

Luck exists (oil price, rainfall, a minister saying something on live television) but no single random roll may end a presidency.

## 2.9 Starting scenarios

A new world begins from a chosen **inheritance**. The scenario is a data file: starting values for the nation variables and pressures, a set of world flags, a liabilities list, the predecessor's exposure records, and a short fictional history of who left it this way. It doubles as the difficulty setting for the world, alongside the mandate (1.2), which sets difficulty for the president.

| Scenario | The inheritance | Difficulty |
|---|---|---|
| **The Standard Inheritance** | Described below. Everything is fragile and nothing has broken yet. | Normal |
| **The Boom** | Oil is high, reserves are full, approval of government is generous. Institutions are weak, every governor expects a share, and the price will fall in year two. The test is whether the player saves anything. | Easy to survive, hard to govern well |
| **The Morning After** | The predecessor defended the currency until the reserves ran out. Forced devaluation, inflation above 35%, arrears everywhere, a lender's programme on the table. Nothing left to lose and no money to do it with. | Hard |
| **After the Scandal** | The predecessor was removed. `integrity` and public trust are at the floor, the party is split, the press is in open season, and the Street expects prosecutions. The predecessor's exposure file is large. | Hard, political |
| **The Reformer's Handover** | Subsidy gone, currency floated, institutions improving, revenue rising. Hardship is high, labour is furious, the reforms are all fragile, and the easy applause is in reversing them. | Normal; a test of restraint |
| **The Long Emergency** | Security has deteriorated across three zones. The budget is dominated by defence, the farm belt is emptying, and the governors want state police. | Hard, grave in tone |

Every scenario is also a state that play can produce. A world that has run for a few presidencies generates its own inheritance, and the authored scenarios are simply good ones to start from.

### The Standard Inheritance

A fixed, fictional 2027 designed for play, not as a forecast:

- Subsidy partially in place and costing ₦4.2tn a year.
- Currency on a managed peg with a widening hidden gap.
- A university funding agreement signed by a previous government and never funded.
- A minimum wage review legally due within 18 months.
- A refinery project officially 95% complete, as it has been for some time.
- A central bank governor with three years left on a fixed term, appointed by the predecessor.
- Debt service eating two thirds of revenue.

Every one of these is a storyline seed. Every one has a good-governance path that costs political capital and a comfortable path that passes the bill to someone else.
