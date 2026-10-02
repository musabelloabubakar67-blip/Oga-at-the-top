# 0. The Game As Built

This chapter describes what is in the code today. Where it disagrees with chapters 1 to 10, this chapter is right and the other is the older plan. Every number here is in `engine/config.ts` or the content files and is a tuning value, not a commitment.

Last brought up to date: 2 October 2026.

## 0.1 What the player does

One turn is one month. A term is 48 months; a presidency is one or two terms.

Each month:

1. **The papers.** Two newspapers, on the same lead story.
2. **The desk.** At most one lead file that must be decided, up to two phone messages that can be ignored, and in December the budget.
3. **Moves.** Four a month (five with a Solid Villa, three with a collapsing one). A move is an executive power, a personal appearance, a dealing with a person, a favour called in, or a redeployment of the security effort.
4. **Free actions.** Launching reforms and big bets, paying debts, moving money between funds, signing the budget. These cost money or political capital, not moves.
5. **End the month.** The simulation ticks and the consequences are reported, each with its cause.

Everything the player can do shows its expected effects before, and its measured effects after. Nothing important is hidden: every number that moves has a screen that says why.

## 0.2 The country

Nine national figures: inflation, pump price, the treasury, debt service, security, power, state capacity, integrity, jobs and industry. Three pressures that build towards crises: fuel scarcity, labour anger, scandal. A derived cost-of-living pressure drives approval.

Index gains have diminishing returns: getting from bad to bearable is quick, bearable to good is slow.

### Debts (`content/treasury.ts`, `engine/treasury.ts`, `engine/ledger.ts`)

There is no single debt number. Six named debts, each with a creditor, a cost while it stands and a function when paid:

| Debt | Starts | While it stands | When paid |
|---|---|---|---|
| Foreign bonds | ₦5.7tn | 4 points of debt service per ₦1tn, more when inflation is above 20%. Falls due in lumps. | Each ₦1tn is about ₦140bn a year back |
| Domestic bonds | ₦10tn | 3 points per ₦1tn. Every deficit lands here. Above ₦12tn, jobs suffer. | ₦110bn a year per ₦1tn |
| Central bank overdraft | ₦4.8tn | 2.5 points per ₦1tn, and 0.6 points of inflation per ₦1tn | Inflation falls. Can be converted to bonds (needs the Senate) |
| Gas suppliers | ₦700bn | Power falls monthly. Builds again until the tariff reform (p3) is delivered | Idle plants return; counts as the first power reform |
| Contractors | ₦1.2tn | Above ₦500bn, building reforms and bets run 15% slower; jobs fall | Jobs, capacity and the establishment improve |
| Pensions and salaries | ₦600bn | Labour anger rises, the street cools | Street, approval and labour improve |

Debt service (shown as a percentage of revenue) is the sum of the first three. Above 90% with an empty treasury, capital spending stops. Above 100%, nobody lends.

When the treasury is short at month end the stabilisation account is drawn first. After that, half the shortfall is borrowed and half is simply not paid: 30% to contractor arrears, 20% to pension arrears.

Debts are paid from cash only, at no cost in moves.

### Funds

Four places to put a surplus:

- **Stabilisation account.** Oil earnings above the budget benchmark are paid in automatically. Covers shortfalls before borrowing. Above ₦1.5tn the governors demand it be shared.
- **Future Generations Fund** (abroad). Grows about 7% a year. Cannot be raided by the party. Above ₦1tn it costs approval while cost-of-living pressure is above 55.
- **Infrastructure Fund.** Pays for power, works, industry and food reforms, and building bets, at a 25% discount. Leaks 1% a month while integrity is below 30.
- **Growth Portfolio.** Judged once a year: usually +5% or +22%; about one year in seven, −30%.

Money left idle in the treasury above ₦3tn turns the governors against the President.

### Oil and the budget

Oil has a price that wanders around $72 with occasional shocks, and an output that falls as oil theft in the South South rises.

Every December the President signs a budget: an assumed oil price (60, 70, 80 or 90 dollars, giving 8, 10, 12 or 14 points) and an allocation of those points across six areas. Each point above or below last year's level shifts that area a little every month for a year. The Appropriations chairman expects three points for legislators' projects; giving fewer either passes over him (if the Senate is at 54 or better) or delays the budget to March.

Oil above the benchmark is saved. Oil below it comes out of the treasury every month.

### The federation's share

Once the centre's monthly income passes ₦120bn, the states take 60% of everything above it. Without this a successful reformer ends with more money than there is anything to spend it on.

### Security (`content/theatres.ts`, `engine/security.ts`)

Six theatres, one per zone, each a threat from 0 to 100 with its own cause and cost. The national security figure is their weighted average.

| Zone | Theatre | Costs | Moved by |
|---|---|---|---|
| North West | Banditry and kidnapping | Food prices | Cost-of-living pressure |
| North East | The insurgency | A monthly charge on the treasury | Austerity; reconstruction |
| North Central | Farm-belt violence | The largest driver of food prices | Planting season unless secured; hardship |
| South West | Highway kidnapping, city gangs | The establishment | Jobs |
| South East | Agitation and sit-at-home | Jobs | Approval in the South East |
| South South | Oil theft | Oil output, so the budget | Integrity; metering; the amnesty |

The President can concentrate the security effort on one theatre: it improves steadily and the other five get slightly worse.

## 0.3 Politics

Five blocs (the Villa, the party, the street, the establishment, the press), shown as moods. Two breaking at once starts removal proceedings.

**Political capital** is a monthly income, itemised on the desk: the office, approval above 45%, each governor or senator with you, each Solid bloc, each businessman with you, each delivered reform; less for unhappy allies, strained blocs and each reform under way beyond three. It can also be raised by three executive powers, each paid for differently.

### People (`content/people.ts`, `engine/people.ts`)

Six governors (one leading each zone), four senators, six ministers.

- **Governors** deliver or withhold votes in their zone, and own convention delegates.
- **Senators** decide whether reforms that need a law pass, and whether the budget passes on time.
- **Ministers** set the speed of reforms in their brief. Each has competence, integrity, ambition, a want and sometimes a sponsor who will resent a sacking. Each has a **scorecard**: reforms delivered, results in the brief since they took it, big bets won and lost, and marks earned from files decided on their watch. The scorecards become public when the delivery-unit reform is delivered.

Each can be given time, given what they want, or leaned on. Giving a governor or senator what they want creates a favour.

**The party primary** is decided by delegates. A governor or senator who is with the President, or who owes the President a favour, brings their delegates. 47% wins a contested primary.

### Favours (`engine/favours.ts`)

A ledger running both ways. People who owe the President can be called on once: to deliver a zone, whip the Senate, drive a ministry, fund the campaign, quieten the press, stand up in public, or forget what they witnessed. A favour can also be attached to a decision on the desk, where it saves political capital and softens the political damage.

What the President owes is called in after about eight months, as a file. Paying settles it; stalling makes it larger; refusing makes an enemy. The game starts with two debts: to whoever financed the campaign, and to the governor who delivered three states.

### The money (`content/tycoons.ts`)

Five businesspeople, each holding a sector: commodity imports, manufacturing, banking, fuel, and telecoms and media. Each has a standing with the President that moves with what the government does: reforms that end waivers, publish accounts or open markets turn several of them hostile.

- With the President (60 or better): a monthly benefit in their sector, political capital, votes, and they co-finance big bets (40% of the cost).
- Against (below 35): a monthly harm, a crisis file of their own, and money for a rival.

Each can be given what they want, squeezed by the agencies for cash, or tapped for campaign money, which creates a debt and a witness.

### The opposition (`engine/opposition.ts`)

Three rivals, each growing on a different failure. They act: courting an unhappy governor or senator until they defect, publishing dossiers when money has moved, obtaining injunctions against reforms, marching when prices are high, touring the weakest zone. The President can co-opt each at a price, debate them, set the agencies on them, or fund a spoiler.

Half-way through each term three states elect governors. The result is scored and reported with its reasons.

### The drawer

Corruption is available throughout: the security vote, logistics for the Assembly, buying the primary, a spoiler candidate. It buys real things. Every act has witnesses, and a witness who turns against the President talks.

## 0.4 Reforms and big bets

**Reforms** (`content/agenda.ts`, `content/tracks2.ts`): ten tracks of five, fifty in all. Each costs political capital and money, takes time, and delivers a permanent change. The President declares four priority tracks; others cost half as much capital again. Five can run at once, six at state capacity 50, seven at 65. Each one under way beyond three costs political capital and strains the party every month. Reforms that need a law are voted on when ready and can be defeated.

**Big bets** (`content/ventures.ts`, `engine/bets.ts`): 32 risky initiatives. Each lists the conditions it depends on (a capable minister, paid contractors, reliable power, a quiet theatre, a delivered reform, a businessman as partner). Each unmet condition costs a stated share of the odds. Part-way through, the site reports what is not in place and what would fix it. The President can fix the cause, send a task team, or postpone the opening. The outcome names the condition that failed. If every condition was met and it still failed, the report says it was bad luck.

Sixteen of the bets appear only when a specific reform is delivered. The rest can be attempted without the groundwork, at odds that show what the groundwork was for.

**Executive powers** (`content/agenda.ts`, `content/orders2.ts`): 14 standing and 55 situational. Five situational ones are on offer at a time and lapse.

## 0.5 Files and the phone

129 events. Selection order: calendar, thresholds, queued follow-ups, then a weighted draw in which files arising from the President's own decisions weigh 3.5 times a generic one.

**Cast files.** A file can name a role instead of a person: the creditor who is due, the minister who is failing, the bet in trouble, the governor being courted. The engine fills the role from the state when the file is drawn, and the effects land on that person (`engine/cast.ts`).

**Operations.** An outcome can pay a named debt, grant a want, move a fund, sack a minister, rescue a bet or start a newspaper series (`engine/ops.ts`).

**Help on a decision.** On any lead file the President can attach a favour, or put the minister of the brief in front of it: the damage to approval is halved and it goes on the minister's scorecard.

**Write-back.** Effects on a zone move its governor. Results in a brief mark its minister. Files from the Senate or the Governors' Forum move the person who runs it.

Tone rule: grave files carry no jokes, and every paper prints them straight.

## 0.6 The press (`content/press.ts`, `engine/press.ts`)

Four papers: The Federal Chronicle (record), Street Gist (the street), The Daily Stakeholder (owned by the media businessman; loyal or hostile as he is), The Daily Rejoinder (the opposition's).

Two are printed each month on the same lead: one that reports and one that takes sides. The partisan paper leads on a reaction, with the facts underneath. Every story carries a subject and whether it is good or bad for the government, and every line is chosen to match. Jokes are printed once per game. Slow-month stories come from the President's own books, people and projects.

Series run over several months (unpaid pensioners, payments out of the Villa, a minister's contracts, a licence given to a financier) and end early if the President removes the cause.

## 0.7 Elections and the verdict

Re-election is decided state by state from zone approval, the party machine, governors, rallies, the campaign chest, scandal, the strongest rival, and whether the money is with or against the President. The outlook on the desk counts the same things.

The verdict grades seven dimensions against what was inherited, including what is still owed and what was saved, names an epithet, and lists what is handed on.

## 0.8 Names

Every character has an ordinary Nigerian name. Each full name was searched on the web before use and replaced if the search found a public figure. The rule and the registry are in `content/names.ts`. Parties, newspapers, unions and companies keep invented names.

## 0.9 Tools

- `npm run typecheck`, `npm run lint:content` (references, tokens, operations, cast selectors, bet conditions, the "nothing echoes" and softlock rules).
- `npm run simulate -- 40 --probe` plays whole presidencies with seven scripted strategies and reports outcomes, and the state on the eve of the first election.
- Saves are brought forward by `engine/migrate.ts`: an older save has new systems started from the state it is in, and any missing field is filled from a fresh game.

Simulator results at the time of writing (40 presidencies each):

| Strategy | Re-elected | Note |
|---|---|---|
| Random | 0% | |
| Do-nothing | 0% | |
| Populist | about 55% | Debt service ends above 110%, ₦9tn unpaid |
| Machine politician | about 45% | |
| Clean institutionalist | about 40% | Loses the primary or the election when it neglects the party |
| Kleptocrat | about 73% | Keeps about ₦430bn; the country is left worse on every measure |
| Reformer (flawless play) | 100% | Delivers about 44 of 50 reforms; leaves debt service above 80% |

## 0.10 Not built

- Playing on as the successor in the same world.
- Alternative starting scenarios.
- An election tribunal and a wider court system.
- Ministers beyond the six, and governors beyond the six zone leaders.
- Onboarding, sound and art.
- A hand-played balance pass. The flawless reformer bot always wins re-election, and the kleptocrat wins more often than the machine politician.
- A rewrite of the older event text. The 103 files written before these systems read the new state through conditions and cast names, and write back through the hooks above, but most of their prose predates debts, favours and businessmen.
