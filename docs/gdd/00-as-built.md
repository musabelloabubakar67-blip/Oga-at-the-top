# 0. The Game As Built

This chapter describes what is in the code today. Where it disagrees with chapters 1 to 10, this chapter is right and the other is the older plan. Every number here is in `engine/config.ts` or the content files and is a tuning value, not a commitment.

Last brought up to date: 3 October 2026.

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

Oil above the benchmark is saved. Oil below it comes out of the treasury every month. The petrol subsidy's monthly cost (or, once removed, what removing it saves) moves with the price of crude, in proportion to $72.

### The federation's share

Once the centre's monthly income passes ₦120bn, the states take 60% of everything above it. Without this a successful reformer ends with more money than there is anything to spend it on.

### Security (`content/theatres.ts`, `engine/security.ts`)

Six theatres, one per zone, each a threat from 0 to 100 with its own cause and cost. The national security figure is their weighted average.

| Zone | Theatre | Costs | Moved by |
|---|---|---|---|
| North West | Banditry and kidnapping | Food prices | Cost-of-living pressure; forward bases, local courts, paid troops |
| North East | The insurgency | A monthly charge on the treasury | Austerity; reconstruction; paid troops, police posts |
| North Central | Farm-belt violence | The largest driver of food prices | Planting season unless secured; hardship; forward bases, local courts |
| South West | Highway kidnapping, city gangs | The establishment | Jobs; state police, local courts |
| South East | Agitation and sit-at-home | Jobs | Approval in the South East |
| South South | Oil theft | Oil output, so the budget | Integrity; metering; the amnesty |

The President can concentrate the security effort on one theatre: it improves steadily and the other five get slightly worse.

**Security reforms work theatre by theatre.** None of them raises the national figure directly. Each delivers a one-off fall in named theatres and lasting measures, all shown before signing and listed by name among each theatre's causes every month:

| Reform | One-off | Lasting |
|---|---|---|
| Pay and equip the troops | North East −5, North West and North Central −3 | Monthly easing in those three; offensives +50% |
| Forward bases | North West −12, North Central −10 | North West −0.25 and North Central −0.2 a month |
| Audit the defence procurement account | North East −4 | Every theatre −0.03 a month; offensives +50% |
| State police | South West −6, South East, North West, North Central −4 | Cost of living feeds violence half as much; South West and South East ease monthly |
| A court and a police post in every local government | Five theatres −3 to −5 | Half of any worsening is stopped in a theatre below 45; monthly easing in four |

Effects with the targets `drift.<zone>` (or `drift.all`), `sec.strike`, `sec.shield` and `sec.hold` record these measures; they are carried into a successor's presidency.

**The military offensive is aimed at one theatre**, chosen by the President. It takes 4 points off at once and 8 more three to five months later, multiplied by its strength: 1, plus half for paid troops, half for an audited procurement account, a quarter if the forces are already concentrated there, all halved in the South East (where it also costs 4 points of approval in the zone). If nothing holds the ground afterwards (police posts and courts anywhere, or lasting measures worth at least 0.08 a month in that theatre: forward bases in the north, paid troops in the North East, state police in the South West), 7 points come back nine to twelve months later. The card shows the strength, its reasons and whether the ground will be held.

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

**Reforms** (`content/agenda.ts`, `content/tracks2.ts`, `content/tracks3.ts`): fourteen tracks of five, seventy in all. Ten tracks are taken in order. Four (Restructure the Federation, Relief for the People, Order and National Pride, Beyond Oil) can be taken in any order, and nine of their twenty items are what the party, the street or a businessman wants rather than what is good for the country: new states, a price control board, a pump price fixed by law, a decreed minimum wage, an internet falsehood law, closed borders, a national airline, the death penalty for corruption, a ban on raw exports. They pay at once and cost permanently, and both are shown before signing. The scripted reformers skip them. Each costs political capital and money, takes time, and delivers a permanent change. The President declares four priority tracks; others cost half as much capital again. Five can run at once, six at state capacity 50, seven at 65. Each one under way beyond three costs political capital and strains the party every month. Reforms that need a law are voted on when ready and can be defeated.

**Standing policies** (`engine/policies.ts`). The nine tempting reforms carry no fixed permanent cost. Once delivered, each is a standing policy whose cost is worked out every month against the economy as it is, with its reason, and shown in the Treasury's monthly flow, in where inflation is heading, and on a Standing policies tab. The reform card shows a year of it at today's economy before signing.

*What the economy can carry* is a figure from 0 to 100: 50, plus jobs (above 40), less inflation (above 15), plus oil (above $70), plus the treasury, less debt service (above 70). The minimum wage it can pay is ₦60k plus ₦1.2k per point.

| Policy | Costs more when | Pays when |
|---|---|---|
| ₦150,000 minimum wage | The economy can carry less than ₦150k: jobs, revenue, inflation and labour anger, in proportion to the gap | It can carry it: a little growth and street support |
| Price control board | Inflation is above 12: it holds prices down, but jobs and scandal rise with the gap | Inflation is low: it costs little |
| Pump price fixed by law | Oil and inflation rise; above $80 importers stop and fuel scarcity builds | — |
| Closed land borders | Few farm reforms delivered and the farm belt violent: inflation | Power at 45 or better: factories replace imports |
| National airline and shipping line | State capacity and integrity are low | A capable, clean state nearly breaks even |
| Six new states | Oil earns more (their share of it) | — (the party is pleased monthly) |
| Ban on raw exports | Power is below 55: farmers cannot sell | Power at 55 or better: jobs |
| Internet falsehood law | Integrity is below 45: it is used on critics | — |
| Death penalty for corruption | No anti-corruption courts: selective prosecution | Anti-corruption courts: integrity rises |

Any of them can be repealed for capital and a named political cost. Old saves have the fixed costs these reforms used to carry removed once.

**Pain before payoff.** Fourteen reforms hurt the public every month while they are under way, before they pay: the tariff (bills rise before the light improves), transmission corridors (planned outages), one tax ID, ending the waivers, the payroll audit, merit recruitment, opening the borders to staples, forty-eight-hour ports, resource control, the ranching law, selling the joint-venture shares, the procurement audit, payments and identity rails, and the rail backbone. The card shows the total over the build and why (`during`, `duringText`; the lint requires the reason), and a reform under way says what it is costing. Timing is the skill: launched early in a term, or after re-election, one at a time, the pain is over before the vote; stacked late, it lands on it.

**Lasting effects.** Every reform now changes something for as long as it stands. Eight that had nothing lasting change how the country works, described on the card as *For as long as it stands*: clearing the gas debt halves the growth of gas arrears until the tariff; the electricity market law halves the monthly loss of power; open contracting settles scandal 5 points lower; anti-corruption courts keep a person leaned on cooperative for 14 months instead of 8; asset declarations raise integrity monthly while nothing is taken personally, and make personal taking 50% more visible; digital government makes reforms 8% faster; the delivery unit halves the capital cost of replacing a minister; results transmitted from the polling unit cut the party machine's weight at elections by 40% and narrow a petitionable win from 7 points to 4.

**Big bets** (`content/ventures.ts`, `engine/bets.ts`): 32 risky initiatives. Each lists the conditions it depends on (a capable minister, paid contractors, reliable power, a quiet theatre, a delivered reform, a businessman as partner). Each unmet condition costs a stated share of the odds. Part-way through, the site reports what is not in place and what would fix it. The President can fix the cause, send a task team, or postpone the opening. The outcome names the condition that failed. If every condition was met and it still failed, the report says it was bad luck.

Sixteen of the bets appear only when a specific reform is delivered. The rest can be attempted without the groundwork, at odds that show what the groundwork was for.

**Executive powers** (`content/agenda.ts`, `content/orders2.ts`): 14 standing and 55 situational. Five situational ones are on offer at a time and lapse. Four have a dial: VAT to 10, 12.5 or 15%; relief to 5, 15 or 25 million households; a $1bn, $3bn or $5bn Eurobond; ₦1tn, ₦2tn or ₦4tn from the central bank. Each level sets the cost and scales the effects. VAT revenue scales with what the economy can carry (half to one and a half times); a Eurobond is repaid at ₦1 plus 1% per point of debt service above 70 for every ₦1 lent.

## 0.5 Files and the phone

132 events offering 413 choices. Selection order: calendar, thresholds, queued follow-ups, then a weighted draw in which files arising from the President's own decisions weigh 3.5 times a generic one.

**Cast files.** A file can name a role instead of a person: the creditor who is due, the minister who is failing, the bet in trouble, the governor being courted. The engine fills the role from the state when the file is drawn, and the effects land on that person (`engine/cast.ts`).

**Operations.** An outcome can pay a named debt, grant a want, move a fund, sack a minister, rescue a bet, start a newspaper series, warm or cool every governor or senator, spend every favour owed at once, or count as delivering a reform (`engine/ops.ts`).

**Every file reads the books.** All eleven event files, including the nine written before the systems in 0.2 and 0.3, now do three things. Their text changes with the named debts, funds, theatres, businessmen, governors, senators, favours and the budget. They offer choices that exist only because of that state: pay the pensioners first, build from the Infrastructure Fund, have a senator who owes you bury a bill, ask the media owner to starve a story, move the security effort to the theatre that was hit. And their outcomes land on named people and named balances, not only on the seven national numbers. 48 choices are conditional on the state and 132 outcomes run an operation.

**Help on a decision.** On any lead file the President can attach a favour, or put the minister of the brief in front of it: the damage to approval is halved and it goes on the minister's scorecard.

**Write-back.** Effects on a zone move its governor. Results in a brief mark its minister. Files from the Senate or the Governors' Forum move the person who runs it.

Tone rule: grave files carry no jokes, and every paper prints them straight.

## 0.6 The press (`content/press.ts`, `engine/press.ts`)

Four papers: The Federal Chronicle (record), Street Gist (the street), The Daily Stakeholder (owned by the media businessman; loyal or hostile as he is), The Daily Rejoinder (the opposition's).

Two are printed each month on the same lead: one that reports and one that takes sides. The partisan paper leads on a reaction, with the facts underneath. Every story carries a subject and whether it is good or bad for the government, and every line is chosen to match. Jokes are printed once per game. Slow-month stories come from the President's own books, people and projects.

Series run over several months (unpaid pensioners, payments out of the Villa, a minister's contracts, a licence given to a financier) and end early if the President removes the cause.

## 0.7 Elections and the verdict

Re-election is decided state by state from zone approval, the party machine, governors, rallies, the campaign chest, scandal, the strongest rival, whether the money is with or against the President, and a clean record. The outlook on the desk counts the same things, except the mood on the day.

- **The mood on the day.** A national swing of up to 7 points of share either way (two random draws, so usually under 3), named on the result screen when it moves the vote by a point or more. A flawless President can lose a close race and an underdog can win one. The outlook's tooltip says so.
- **A clean record.** Integrity above 62 adds 0.08 points of share per point. Money spent against the President loses force as integrity rises above 40 (at 73, it buys about two-thirds as much): there is less to smear. Money working for the President is unaffected.
- **The opposition merger** arrives in month 34 of every first term. Against a President whose projected margin is 6 or more, the merger cannot fail and is broad: it draws in everyone who wants a change and costs 4.5 points of share (9 of margin) instead of 3. Otherwise leaving it alone splits it half the time. Paying the open-minded chairman costs ₦20bn from the drawer and works 60% of the time; when it fails the merger goes ahead and the offer leaks. Event conditions can read the projected margin as `outlook`.
- **Weights.** Approval counts 0.38 points of share per point (was 0.45); the party machine 4 (was 5); a united opposition −3 (was −2).
- **Popular policies.** Each crowd-pleaser in force keeps approval a little higher for as long as it stands (the ₦150,000 wage 2 points when the economy can carry it and 1 when not; the fixed pump price 2; the price control board 1.5 while inflation is above 12; the death penalty 1.5; the others 0.3 to 0.5), shown on the card and in the policies tab. Voters give less lasting credit for low hardship than before (0.10 a point, was 0.25).

**The primary.** Delegates are 65% the clout of governors and senators who are with the President or owe a favour, 35% the party's mood, plus 1.5 for each point of approval above 50: delegates defy their governors for a popular President. A President with 55% approval (was 58%) and 36% of delegates can also win on the floor.

The verdict grades seven dimensions against what was inherited, including what is still owed and what was saved, names an epithet, and lists what is handed on. The baseline is the scenario or inheritance the presidency actually started from.

**The tribunal** (`content/events/tribunal.ts`). A win by fewer than seven points is petitioned. How the campaign was paid for is the evidence: a clean campaign is upheld, a bought convention or a funded spoiler can be annulled by honest courts (ending: The Annulled), and a panel can be spoken to at a price. A loss by under three points can be petitioned by the President: honest courts overturn it a little under half the time, on the result sheets, and the presidency continues into a second term. Weak courts can be bought, with a chance of being named in open court.

## 0.7a Scenarios and succession

**Starting scenarios** (`content/scenarios.ts`), chosen on the certificate of return: The Standard Inheritance, The Boom, The Morning After, After the Scandal, The Reformer's Handover, The Long Emergency. Each sets the nation, the named debts and funds, the oil price path, the theatres, the blocs and the inherited archive, and states its test.

**Succession** (`engine/succession.ts`). At the verdict the player can take the oath as the next President. The winner of the following election is worked out from the state left behind. The new presidency starts in the same country: debts, funds, oil, budget, theatres, delivered and half-finished reforms, big bets under construction, licences already granted, consequences already on their way, and the archive (marked as inherited). The calendar moves on by the years served. Handover notes that were not candid give the successor no figure for what is owed. A situational power, "Blame the previous administration", is available early and wears out. If the predecessor kept money or left a trail, a file about it arrives in the first year.

## 0.8 Names

Every character has an ordinary Nigerian name. Each full name was searched on the web before use and replaced if the search found a public figure. The rule and the registry are in `content/names.ts`. Parties, newspapers, unions and companies keep invented names.

## 0.9 Tools

- `npm run typecheck`, `npm run lint:content` (references, tokens, operations, cast selectors, bet conditions, the "nothing echoes" and softlock rules).
- `npm run simulate -- 40 --probe` plays whole presidencies with seven scripted strategies and reports outcomes, and the state on the eve of the first election, including each theatre. Every bot except Random and Do-nothing concentrates forces on the worst theatre above 55 and orders an offensive there above 60.
- Saves are brought forward by `engine/migrate.ts`: an older save has new systems started from the state it is in, and any missing field is filled from a fresh game.

Simulator results at the time of writing (40 presidencies each):

| Strategy | Re-elected | Note |
|---|---|---|
| Random | 0–2% | |
| Do-nothing | about 2% | |
| Populist | about 20% | Takes the crowd-pleasers, avoids scandal, spends on relief in election year; usually leads at month 34 and meets a broad merger |
| Machine politician | about 57% | Takes crowd-pleasers too, borrows before elections; often leads at month 34 and meets a broad merger |
| Clean institutionalist | about 42% | Grants only wants that cost no integrity, protects the party in the year before the primary; no longer loses the ticket |
| Kleptocrat | about 38–43% | Keeps about ₦310bn; buys the opposition chairman or a spoiler. Above the 20–30% first aimed for; the owner chose to leave it, because corruption works |
| Reformer (flawless play) | about 88% | Times its painful reforms (early in a term or after re-election, one at a time). Loses about one election in eight: its lead invites a broad merger, and the mood on the day can take a close one |
| Reformer, any order | about 62% | The same script without the timing: painful reforms land on the election |
| Reformer, keeps subsidy | about 87% | Keeping the subsidy costs a flawless reformer nothing at the ballot |
| Reformer, ignores debts | about 82% | Leaving debts unpaid costs a flawless reformer little |

The three imperfect reformers measure how narrow the reformer's path is. Timing is now worth about 26 points; the subsidy and the debts are not yet decisions that change who wins. The populist, machine, reformer and institutionalist bots all time their painful reforms; only the "any order" reformer does not.

The balance pass of 3 October (60 presidencies each) set these. Aims were reformer 75–85%, machine 55–70%, institutionalist 30–40%, populist 25–35%, kleptocrat 20–30%. The bots now value each choice by the chance-weighted average of its outcomes rather than its last one, so they see gambles as the engine plays them; before this the kleptocrat never noticed that a bribe could break the merger. The probe prints margin percentiles (p10, p50, p90), opposition unity and integrity. By scenario (12 each) the reformer ranges from 42% (The Morning After) to 100% (The Long Emergency), the populist from 0% (The Morning After, The Long Emergency) to 83% (The Reformer's Handover).


Before the balance pass, standing policies and dials moved them (phase 2). The engine changes alone left every strategy within sampling noise except the machine politician, which rose. The falls came from what the bots now do: the populist and machine take the crowd-pleasers, the institutionalist raises VAT, and bots that borrowed $3bn every time the treasury ran low spiralled into debt (the machine fell to 28% until it borrowed only before elections and below 80 debt service). `SKIP=pop,rep,relief,bond,vat npm run simulate` switches those behaviours off one by one.

Security by theatre moved them before that. Once the bots used the security focus and the offensive (under the old flat rules) the kleptocrat rose from 20% to 57%: the two levers were stronger than the table showed, because no bot used them. With theatre-by-theatre reforms and a targeted offensive, national security on the eve of the first election fell for every governing strategy (the reformer's from 71 to 58) and the kleptocrat returned to about 23%.

The event rewrite moved them before that. Before it the kleptocrat was re-elected 73% of the time and the machine politician 40%; debts to financiers and governors now come due inside ordinary files, which is what the kleptocrat cannot pay. By scenario (12 presidencies each), a reformer is re-elected 83% of the time in The Morning After and 100% elsewhere; the machine politician ranges from 17% (The Morning After) to 92% (The Reformer's Handover). `--world` chains four presidents through one country.

## 0.10 Not built

- A court system beyond the election tribunal.
- Ministers beyond the six, and governors beyond the six zone leaders.
- Onboarding, sound and art.
- A hand-played balance pass. The flawless reformer bot always wins re-election outside The Morning After, and the populist bot may now be too weak.
- Twelve files never arise in bot play because the bots never give the orders that cause them (the VAT, price-freeze, money-printing, duties and service-chiefs reactions among them). They are linted and type-checked but have not been played.
