# 0. The Game As Built

This chapter describes what is in the code today. Where it disagrees with chapters 1 to 10, this chapter is right and the other is the older plan. Every number here is in `engine/config.ts` or the content files and is a tuning value, not a commitment.

Last brought up to date: 4 October 2026.

## 0.1 What the player does

One turn is one month. A term is 48 months; a presidency is one or two terms.

Each month:

1. **The papers.** Two newspapers, on the same lead story.
2. **The desk.** At most one lead file that must be decided, up to two phone messages that can be ignored, and in December the budget.
3. **Moves.** Four a month (five with a Solid Villa, three with a collapsing one). A move is an executive power, a personal appearance, a dealing with a person, a favour called in, or a redeployment of the security effort.
4. **Free actions.** Launching reforms and big bets, paying debts, moving money between funds, signing the budget. These cost money or political capital, not moves.
5. **End the month.** The simulation ticks and the consequences are reported, each with its cause.

Everything the player can do shows its expected effects before, and its measured effects after. Reforms, orders, policies and bets show their effects exactly. On a file, the effects shown before the decision are a named adviser's forecast, which can be wrong (owner's rule, 3 October: forecasts before, what actually happened after, with the cause). Nothing important is hidden for long: every number that moves has a screen that says why, and every adviser has a record.

**The screen** (desktop first; `ui/Desk.tsx`, `ui/shell.tsx`, `ui/StateMap.tsx`, `ui/Aimed.tsx`, `engine/upcoming.ts`). A rail on the left switches between six sections: the desk, orders, reforms and bets, power, the country and the Treasury, with a count on each that needs attention (unanswered files, new orders, empty seats on the court, the budget). A bar across the top shows the date, approval, capital, the treasury, moves and the re-election outlook, and holds the button that ends the month. Below it, a coming-up strip lists what will bite soon (the election, the succession, the budget, retirements and vacancies on the court, reforms that could be frozen, orders about to be challenged, grudges ending, shocks ending, reforms about to land, bets about to open); each item opens the section it concerns.
- **The desk** has three columns: the brief (the Chief of Staff's briefing, what was just done, the consequences report), what needs deciding (the lead file, the budget, the phone, shocks under way) and the country (capital, gauges, blocs, the record).
- **Dispatches** (`engine/dispatches.ts`). A large three-month movement in state capacity, integrity, power, security, jobs (2 points), inflation (1.5) or revenue (₦400bn) becomes a dispatch in the report, announced by the office that would announce it, crediting or blaming the past decision that most pushed that figure, from the archive, by size, weight and recency. At most two a month; the same figure not again for six months.
- **What people are saying** (`engine/narrative.ts`). The papers' coverage is remembered (decaying 10% a month) by topic and tone and reduced to one line about the government, shown with the papers and in the briefing.
- **Powers that bear on this** (`engine/context.ts`). A troubled gauge, a worry in the briefing, a decided file and each adviser's card offer up to three open orders that help with it, judged from each order's own effects, opening the usual order card. The Orders screen remains the full toolbox.
- **The Chief of Staff's briefing** (`engine/attention.ts`) answers what deserves the President's attention this month, from what every system already knows: up to three things that can hurt the government (the Chief of Staff's weighted worries, then what the coming-up list says will bite), two openings (powers in their last month or new this month, the largest favour owed to you, good news on the calendar), and the story everyone is shouting about, shown only when the paper's lead is about something whose figures are calm. Each line opens the screen and tab where it is dealt with. A Chief of Staff of competence 2 or less sees only two threats.
- **Previews.** Pointing at an order shows where it would leave approval, capital and the treasury in the top bar, and the gauges and blocs on the desk (the order is applied to a copy of the state; files with chance outcomes are not previewed).
- **Orders** can be filtered to those aimed at someone or those possible now; institutions come last.
- **Power** shows people two to a card row. Each governor, senator, businessman and rival card lists every order that can be aimed at them and is open now, with its effect on them and on you, whether they will remember it, wear-out, and how the court would rule.
- **The country** opens on a tile map of the 37 states, placed roughly as on the map, coloured by how each would vote today, with a dashed border where the theatre is dangerous, a dot for an asset and a square for an abandoned site; clicking a state shows its figures. The scorecard, the states table and security follow.
- Files, the phone, the budget, the drawer, the archive and the papers still open as windows.

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

Every December the President sends a budget to the Assembly (`engine/treasury.ts`, the budget window and the Treasury's budget tab).
- **The forecast** (`engine/oilforecast.ts`). The budget window shows the Finance Minister's forecast for the coming year: a midpoint and a range. The true expectation is the price drifting towards the scenario's path. The minister's figure is off by up to ±4 dollars per point of competence below 5 (fixed for the year), the range widens by 3 for each point below 4, and a minister who serves a patron adds 6 (one with integrity of 2 or less adds 3): more oil on paper means more to spend. Each signed budget records the forecast, and after twelve months the window shows what was said against what oil averaged.
- **What it holds.** An assumed oil price (60, 70, 80 or 90 dollars, giving 8, 10, 12 or 14 points), less a point for every 8 points of inflation above 18% (up to three), divided across six areas.
- **What a point does.** Effects are measured against each area's usual level. Each point above it does less than the one before (100%, 70%, 50%, 35%, 25%, 20%); cuts bite in full. Each area is worth more when its problem is worse, from ×0.6 to ×1.4: defence by the worst theatre, works by how little power there is, health and schools by labour anger, farming by inflation.
- **Passed is not spent.** Of each increase, a ministry spends 0.45 + 0.12 × its minister's competence (40% to 100%), 70% of that when the treasury holds under ₦0.3tn. Debt repayment and members' projects are always released. During the year each line can be rushed out (all of it, at a premium of ₦6bn a month per point, and integrity −0.02 a month for skipped procurement) or half held back; what is not spent stays in the treasury.
- **Where the works money goes.** Works points are sited by zone. A zone given more than an even share gains 0.1 approval a month per point above it (scaled by what is spent), and its governor 0.15 standing; a zone given less loses the same. It shows in how the states vote.
- **The Assembly's version.** The Appropriations Committee wants 2 points for members' projects, 3 if the Senate is under 50, one more if its chairman is cool towards you (under 45), one less if warm (70 or more). Short of that, the bill comes back with the difference inserted from your largest lines. Sign their version (on time, integrity −1), meet them halfway (4 capital), or veto it: with the Senate at 54 or better your bill passes (integrity +1.5, press +3, the chairman −7 a point); otherwise it stalls to March and nothing above last year is released for three months.
- **Commitments.** Last year's levels are what people expect. Cutting below them is felt at once: health and schools cost the street 3 and add 4 labour anger per point, defence costs the establishment 2 and the Villa 1, farming costs the North West and North Central a point of approval each, works costs the establishment and the party a point. Each area's minister warms 4 per point raised and cools 5 per point cut.
- **A supplementary budget.** When oil has moved $12 or more from the benchmark, at least three months after signing, the year's budget can be reopened once for 4 capital, Assembly and all.

Oil above the benchmark is saved. Oil below it comes out of the treasury every month. The petrol subsidy's monthly cost (or, once removed, what removing it saves) moves with the price of crude, in proportion to $72.

### Oil dependence (`engine/dependence.ts`, the Treasury's flow tab)

Oil starts at 75% of revenue. Each month the share is worked out from its causes: tax capacity, jobs, oil output, reforms that earn outside oil (tax reforms, export industries, gas, minerals, crops, remittances, the sale of the oil stakes), and the tax office and economic zone. It runs from 35% to 85%, and a strong two-term reformer reaches about 40%, so oil stays the largest single source. The oil gap and windfall, and oil's weight in the economy's strength, scale with it; every ten points below 75 adds a budget point; and non-oil exports earn the naira dollars in proportion.

### The federation's share

Once the centre's monthly income passes ₦120bn, the states take 60% of everything above it. Without this a successful reformer ends with more money than there is anything to spend it on.

### The naira (`engine/currency.ts`, the Treasury's naira tab, a gauge on the desk)

An official rate (₦1,500 to the dollar at the start), a street rate, foreign reserves ($33bn) and the central bank's stance.
- **Dollars in and out each month:** oil exports (rising with price and output), money sent home, non-oil exports (with jobs), petrol imports (much smaller once domestic refining is in place), foreign debt service, investors' view of the economy (power, security, state capacity, cash in the treasury and delivered reforms bring dollars in; hardship above 60 sends them out), and capital arriving or leaving (with the establishment, integrity, and a wide street premium). It starts near zero. A strong economy therefore strengthens the naira and a weak one weakens it, on top of inflation, which moves fair value every month.
- **Fair value** rises with the gap between our inflation and the world's (4%), and falls further when dollars are short.
- **The stance.** *Managed* (the start): the official rate closes a fifth of the gap each month, reserves smooth it, a small premium on the street. *Float*: most of the gap closes at once and the rest quickly; no black market; reserves are left alone. *Defend the naira*: the official rate is held; every month the market's shortfall comes out of the reserves (four times the gap, plus any net outflow); the street prices at fair value. When defended reserves fall below $5bn the peg breaks overnight: the rate jumps to fair value, inflation +4, the street −6, the establishment −5. Changing stance is a standing order with a six-month cooldown (float 10 capital; managed 4; defend 6), each with its effect on the blocs, the importer (Ezeudu) and the manufacturer (Birniwa), who also drift each month: importers like a defended naira, manufacturers a weaker one.
- **Dollars at the official rate, for a friend.** While the naira is defended and the street premium is 15% or more, an order sells a businessman dollars at the official rate: their standing +14, reserves −$1.5bn, ₦12bn into the drawer with a trail of 2, integrity −2.
- **What it does.** Inflation gains 0.3 points per point of real fall over the last year (the fall beyond the inflation gap; from −2 to +12), plus 12 per unit of street premium above 15%. The subsidy's cost and oil revenue in naira scale with the year's real move (a real fall makes the subsidy dearer and oil revenue larger). A month's real fall adds 0.12 points of debt service per percent. A premium above 30% costs the establishment 0.2 a month.
- **Shown:** a gauge on the desk (official and street rates), the naira tab (rates, premium, reserves, how long a defended naira's reserves last, every flow line, every effect), and the coming-up strip when defended reserves fall under $14bn or the premium passes 25%.

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

Each can be given time, given what they want, refused, or leaned on. Giving a governor or senator what they want creates a favour.

**What they want changes** (`engine/wants.ts`). Each asks first for the signature want written for them. After that, what they ask for is drawn from templates by role and by situation (federal projects, troops when their zone is violent, a cabinet seat for an ally, the anti-corruption agency kept away when integrity is low, a say on the ticket near the primary; constituency projects, a committee chair or an amendment for senators; a bigger budget, a permanent secretary removed or a bigger portfolio for ministers). A new ask comes every eight months unless the last was granted in that window. Each grant makes the next ask cost 35% more. Refusing costs no move: it costs 5 points of standing, and refusing a crooked ask (one that costs integrity) earns a point of integrity and press goodwill. Two refusals make a grudge: 8 more points, and the opposition courts that person first and from 15 points higher up. Any grant settles old refusals and the grudge.

**Ministers have an arc.** One or two ministers per presidency are a point better or worse than their files say; the card shows their reputation until the truth shows (ten months in the job, or at once with published scorecards), and then says whether they turned out better or worse. Each has a **following** (0–5, from time in the job, what they delivered and their clout), shown on the card; a sacking costs that much more capital. An ambitious minister with a following, eighteen months in the job and unhappy with the President, may resign to run (`min.resigns`): an offer keeps them, letting them go or sacking them first strengthens the opposition.

**The first Finance Minister** chosen on the certificate has three files of their own, different for each candidate, around months 6–10, 16–20 and 28–32 (`content/events/cabinet.ts`); they stop if that minister leaves. A Finance Minister can leave mid-term through those files (`finleave`); the next is the first other candidate.

**The party primary** is decided by delegates. A governor or senator who is with the President, or who owes the President a favour, brings their delegates. 47% wins a contested primary.

### Advisers (`engine/advice.ts`)

The inner circle (Chief of Staff, the political adviser, the security adviser, the Finance Minister and four other ministers) advise on files. The Minister of Power and the security adviser are the same people as the ministers of those briefs.

Each adviser has a true competence, loyalty and integrity, a **worldview** and a **reputation** (what the files say). Bias is belief, not a hidden trait (owner's decision, 4 October): nobody is simply crooked, and a biased adviser is right whenever their camp's interest and the country's agree.

- **Worldview.** Every adviser weighs by their brief: the Finance Minister by the books (fiscal effects double, popular ones half), the political adviser by the crowd, the security adviser security first, the Chief of Staff what keeps the house quiet (the Villa, the party, the pressures). Some are also known to be close to a **camp**: a businessman, governor or senator, or themselves. Each presidency gives one or two of the inner circle a camp (loyalty −1) and may make one look abler than they are. The Finance candidates carry their own camps. The camp is shown on the advisers tab and on every file they advise on.
- **Forecasts.** Each option on a file shows the forecast of the adviser whose brief it is. Competence sets the error (none at 4 or 5; up to ±30%, ±60% or ±90% of each effect at 3, 2 and 1), and an adviser of competence 2 or less leaves out the worst risk half the time. An option their camp gains from looks better to them, sincerely: its good effects ×1.15, its harms ×0.8. A Finance Minister with a camp forecasts oil $4 high.
- **Recommendations.** The best option as the adviser sees it: their brief's weighting, with what their camp gains counted as the country's gain (half a point per point of the camp's standing gained). The file marks an option their camp gains from ("Ezeudu gains").
- **When ignored.** Overruling an adviser costs 3 points of their standing with you. One with loyalty 2 or less whose standing is under 35 has a one-in-five chance of telling the papers they warned you (scandal +2).
- **What happened** is shown after the decision as before. Each forecast is checked against the outcome (in arrows; within one arrow counts as close) and kept.
- **The record**, on the advisers tab of the people screen: forecasts checked, how many were close, how often the President followed them, and whom the advice the President followed has helped. The file shows the adviser's reputation and record beside the forecasts.
- **Replacing an adviser.** The Chief of Staff, the political adviser and the information, labour and education ministers can be replaced from a pool of six (`ADVISER_POOL` in `content/names.ts`) for a move and 6 capital. The President sees each candidate's background and reputation; some are not what they seem, and it shows in their record. Whoever leaves does not come back.
- **A second opinion** from the Chief of Staff (or the political adviser, if the Chief of Staff gave the first) costs a move and shows their forecast under each option.

Reforms, orders, policies and bets are not forecast; they show their effects exactly.

### The Vice President (`engine/vp.ts`, top of Your advisers)

Generated at the start as the running mate, from the other half of the country, with competence, loyalty, integrity, clout and ambition, and counted in federal character. The Vice President's zone is worth 70% of the home-zone bonus at re-election. Standing moves towards 50 plus 8 per point of loyalty above 3, plus 12 while they have real work, less 25 if sidelined, less 8 if ambitious, plus 20 if they are the chosen successor and less 20 if passed over. Real work (a move and 3 capital, once a year, lasting two years) adds to state capacity monthly at competence above 2. Below 35, an ambitious Vice President briefs against the President: the party and scandal heat move every month (half as much if sidelined), and the papers notice once. A new running mate can be chosen from the talent pool between month 24 of the first term and a few months before the election, for 8 capital, costing the party and the old Vice President's zone. The Vice President can be groomed as successor and gains 0.25 strength for each year in office, up to 1. Files: the Vice President's support group, and the question of the ticket.

### The former President (`engine/predecessor.ts`, top of The opposition)

In a world played on from one presidency to the next, the last President has a standing with the new one: 60 if of the same party, 25 if not, drifting slowly back. Of the same party, above 60 they keep the elders in line (party +0.03 a month); below 35 they work against you (−0.07). Of the other party, below 35 they lend the strongest rival their name. A visit costs a move and 3 capital (+10). Files: a son who wants a ministry, the audit of the last year, a road to the home town before a birthday, a hostile lecture, and an offer to campaign. A case against the former President drops the standing to 5; a conviction or flight ends the influence.

### Things that do not disappear

- **Former officials** (`engine/formers.ts`, Your advisers and the coming-up strip). Each month the game notes who has left a post that witnessed something (Chief of Staff, Finance, the political adviser, the ministers). For two years they may talk, 2.5% a month for each thing they saw (up to four): scandal heat, a press cost, and every exposure they witnessed becomes easier to find. An embassy abroad (a move and 3 capital) keeps them quiet.
- **Members' projects** (the Treasury's This Year tab). Each budget point of constituency projects commissions three a month; the share ever finished rises with integrity and state capacity. From month 18, once 150 are commissioned, a file offers an audit before further payment, publication with sponsors' names, or leaving it to the Assembly.
- **Defeated laws** remember the senators who did not deliver, and the reform card says so, with where each stands now, when the law can be brought back.

### Federal character (`content/federal.ts`, `engine/federal.ts`, the Federal character tab under Politics)

The big posts are counted by the holder's zone: the six ministers, the Finance Minister, the Chief of Staff and the political adviser count one each, heads of institutions and managers of assets half each. Authored characters have a recorded origin; anyone appointed from the talent pool carries their own zone. An even share is the total over six. Each month a zone's approval moves by 0.04 for every post above or below its share (at most ±0.06), and a zone with nobody at all loses a further 0.05 and its governor 0.15 of standing; the first month it is shut out the papers print its elders' communiqué. A home zone holding twice its share and more draws a small monthly press cost. The first cabinet has nobody from the North East and, unless Ekpenyong runs Finance, nobody from the South South. Every candidate list shows the candidate's zone and whether they would end a zone's exclusion or add to a crowded one, and always includes the best available person from each zone. The succession follows the rotation: an heir from the same half of the country as the President loses 1.5 strength; one from the other half gains 0.5. Religion is not modelled.

### Prosecutions (`engine/cases.ts`, the courts tab, the anti-corruption agency's card)

A file that ends in charges (a governor, a minister, the Finance Minister, the Minister of Special Duties, the last President) opens a case. It goes to trial after three months and to a verdict after fourteen more, or seven with anti-corruption courts. The chance of conviction is shown with its causes: the courts, the agency and whether its chief can be bought, an independent prosecutor, integrity, the accused's clout, a bench that can be reached, and whether the President backed the case in public (3 capital, +8 points). The President can instead lean on the prosecutors to drop it, at a cost in integrity and an exposure; an honest agency chief may refuse, in writing, and the letter leaks. The powerful sometimes jump bail. A conviction forfeits money to the treasury. With the agency built, its cases sit on its card and the files say it is the agency's case. Verdicts within four months show in the coming-up strip.

### The courts (`content/courts.ts`, `engine/courts.ts`)

A Supreme Court of seven named justices, shown in the Courts tab under Politics. Each leans towards the President, towards nobody, or against, and has an integrity from 1 to 5 and a retirement date. The bench at the start has one justice leaning the President's way (retires in month 14), two against (months 22 and 46), and four independents (months 33, 70, 85, and the Chief Justice beyond the presidency). So four seats fall vacant before the first election.
- **Vacancies** are filled from five nominees (a move and 3 capital). There are always at least five: when the named nominees are used up or refused, Court of Appeal justices are put forward from a seeded sequence, each leaning towards the President (three in ten) or nobody, with an integrity from 1 to 5; a friend of the President needs Senate support of 40 plus 5 for each point of integrity. The named nominees who are the President's friends are not offered to a successor. The two independents are confirmed without a fight. The three loyalists need Senate support of 45, 50 or 55; a rejected nominee costs 3 more capital and is never offered again. Each nominee has a stated effect on the press, integrity, the party or the establishment. The third loyalist appointed makes the bench "packed": integrity −4 and press −5, and the fact is recorded.
- **How justices vote** on a case the President would rather win: loyalists for, those leaning against against, honest independents (integrity 3 or more) against, and those of integrity 2 or less for whoever reaches them first (a coin flip).
- **Challenges to orders.** A hostile order of 3 or more is challenged the next month. If the votes against outnumber the votes for, half of what it did to the target is undone, the President loses 3 capital and the press gains 2.
- **Injunctions.** A reform that costs the establishment, a businessman or a governor when launched can be frozen once by a court someone can reach: each month a 3% chance for every seated justice who leans against the President or has integrity of 2 or less. A freeze loses three months of progress.
- **The election petition** is decided on appeal by the bench (see 0.7).

### The talent pool (`content/talent.ts`, `engine/talent.ts`)

Every appointment draws on one pool of people (owner, 4 October): ministers (any portfolio, from a list of named people, or the old quick technocrat or party-nominee options), the Finance Minister (the three known names or anyone suitable), the replaceable advisers, institution heads and asset managers.
- **The people.** 48 are available at any time, generated from ordinary first names and surnames of each zone (well-known political and business family names left out). Each has a speciality (economics, security, law, administration, engineering, politics, communications), competence, loyalty, integrity, clout, ambition, and a patron: their own person (55%), out for themselves (15%), or close to a governor, senator or businessman. The six hand-written advisers from earlier versions are in the pool too.
- **Fit.** Each job wants certain specialities (an engineer for the power task force, a lawyer for the Attorney General, an economist for Finance). Anyone outside the field works a point below their competence; the list shows who fits and puts them first.
- **The file.** What the list shows is the file, which flatters anyone with a backer or out for themselves. A background check (2 capital, no move) shows the truth, including their patron.
- **Refusals.** A person of integrity 4 or more refuses a government whose integrity is under 32. Some of the most able refuse a President under 38% approval. Anyone whose patron is cold to you (under 35) or holds a grievance against you refuses. The reason is shown.
- **It refreshes.** People stay available for 6 to 15 months, then move on, and new ones arrive. Someone who leaves a job goes back into the pool for eight months. Searching for more (3 capital and a move) brings three people in the job's field, one of them at least competence 4.

### Promises (`engine/promises.ts`, the Promises tab under Politics and each person's card)

The President's word is a currency that can be spent before it is earned. A promise costs a move and is one of: to a governor or senator, that they will name the next holder of a ministry; to a minister, that they keep their post for a year; to anyone (a politician or a businessman), what they currently want within nine months; to the public, no new taxes for a year, the subsidy kept for a year, or a reform or big bet under way delivered by a date.

- **Made:** goodwill now, +8 standing (public: approval +1.5, the street +3), scaled by your record with them: +25% for each promise kept, −25% for each broken, and nothing at all once broken outnumbers kept by two.
- **Kept** when what was promised happens (the want granted, the reform delivered, the bet opened), or, for the post, the taxes and the subsidy, when the year passes without it being broken: +6 standing (public: approval +1.5, street +3, press +2).
- **Delayed:** in the last three months a reminder arrives and standing falls a point a month; due promises are in the Chief of Staff's briefing.
- **Broken** at the deadline, or at once if the minister is removed, a tax is ordered, the subsidy goes or the bet fails: −18 standing and a grudge for two years; a public promise broken costs approval 3, the street 5, the press 4, and makes the papers.
- **Contradictions.** Two promises about the same post (a ministry to two governors, or a ministry to a governor and its minister told they stay) work until the two compare notes: 8% a month, then a file (`promise.clash`) in which the President keeps one, buys both off (10 capital, ₦300bn), or denies it (integrity −2, scandal +6, and both tell the papers). A ministry promise can be kept directly from the Promises tab: the promised person's nominee takes the post, and anyone else promised it is let down.

### The cast acts on its own (`engine/agency.ts`)

Each named politician has aims (their current want, their temperament), a rival they fear gaining the President's ear (authored for twelve of them), and leverage (a governor's senators and delegates, the Senate floor, a ministry and its leaks). Each month at most two of them act, each no more than once in five months, with a chance that rises with how much the world pushes them:

- **Call** (one at a time): a phone message asking when they will get what they want; promise it, give it now, or say not this year.
- **Undermine** the rival they fear, when that rival stands ten points closer to you: their tie falls, the rival cools on you, and it is in the papers.
- **Back your rival** when below 35 and not loyal: the strongest rival gains strength (1.2 × clout/4), a governor costs the party.
- **Leak**, a minister or senator below 40: scandal heat and the press.
- **Court the Vice President**, when ambitious or transactional, below 50, and the Vice President is cool on you: their tie rises and the Vice President cools further.
- **Offer help**, when above 72: a favour owed to you, unasked.
- **Protest**, the principled, when scandal heat is above 55 or integrity below 28.
- **A pact** between two cold, not loyal politicians: their tie rises; once it reaches 70 they move party votes together (party −1), and a pact between big figures cools the Vice President.

Ties between people are kept from 0 to 100. Each move appears in the report with the person's name, in the papers, on their card ("on their own, two months ago…") and, when it cuts against you, in the Chief of Staff's briefing.

### Favours (`engine/favours.ts`)

A ledger running both ways. People who owe the President can be called on once: to deliver a zone, whip the Senate, drive a ministry, fund the campaign, quieten the press, stand up in public, or forget what they witnessed. A favour can also be attached to a decision on the desk, where it saves political capital and softens the political damage.

What the President owes is called in after about eight months, as a file. Paying settles it; stalling makes it larger; refusing makes an enemy. The game starts with two debts: to whoever financed the campaign, and to the governor who delivered three states.

### The money (`content/tycoons.ts`)

Five businesspeople, each holding a sector: commodity imports, manufacturing, banking, fuel, and telecoms and media. Each has a standing with the President that moves with what the government does: reforms that end waivers, publish accounts or open markets turn several of them hostile.

Winning them back: an invitation to the Villa (a move and 3 capital, once a year each) warms a businessman for twelve months, by 12 points the first time and 3 fewer each time after, never below 4. What a predecessor did, a reform that hurt them or one that helped, counts for half (`mine.<id>` decides whose it was). A want a predecessor granted still stands and is worth 12 rather than 20; the new President can renew it in their own name for half the cost and half the damage, which wins the rest and leaves the businessman owing.

- With the President (60 or better): a monthly benefit in their sector, political capital, votes, and they co-finance big bets (40% of the cost).
- Against (below 35): a monthly harm, a crisis file of their own, and money for a rival.

Each can be given what they want, squeezed by the agencies for cash, or tapped for campaign money, which creates a debt and a witness.

### The opposition (`engine/opposition.ts`)

Three rivals, each growing on a different failure. They act: courting an unhappy governor or senator until they defect, publishing dossiers when money has moved, obtaining injunctions against reforms, marching when prices are high, touring the weakest zone. The President can co-opt each at a price, debate them, set the agencies on them, or fund a spoiler.

Half-way through each term three states elect governors. The result is scored and reported with its reasons.

### The drawer

Corruption is available throughout: the security vote, logistics for the Assembly, buying the primary, a spoiler candidate. It buys real things. Every act has witnesses, and a witness who turns against the President talks.

## 0.4 Reforms and big bets

**Reforms** (`content/agenda.ts`, `content/tracks2.ts`, `content/tracks3.ts`, `content/tracks4.ts`): 196 reforms in 17 tracks. The tracks are Light Up Nigeria; Secure the Country; Fix the Treasury; Clean Government; A State That Works; Food on the Table; Made in Nigeria; A Digital Economy; Healthy Nigeria; Schools and Skills; Roads, Rail and Ports; Restructure the Federation; Relief for the People; One Nigeria; Beyond Oil; Justice That Works; and Cities, Water and Housing. Health and schools have separate tracks. The amnesty belongs to security, the loot register to clean government, ranching to food, and housing to cities. Reform ids stay fixed; retired ids are never reused.

- **Foundations (generation 1)** go in order, except on the four loose tracks (Restructure the Federation, Relief for the People, One Nigeria and Beyond Oil), where they can be taken in any order. A foundation is settled when delivered or excluded by a delivered rival.
- **Deepening (generation 2)** opens together once every foundation in that track is settled. The library then says *Foundations complete*. These reforms can be chosen in any order.
- **Emerging repairs (generation 3)** are created by the country's history. There are nineteen, each with a condition and an explanation (`emerge`, `emergeText`): lifeline tariffs not enforced, corruption in the meter market, cases waiting for justice, and other consequences of earlier choices. An unstarted repair is hidden until its condition holds; once active or delivered, its record stays visible. Emergence is calculated from the state, not saved as another system.
- **Rival answers** exclude one another while active or delivered: private distribution under hard regulation or public power (p14/p15); insurance through competing insurers or tax-funded clinic care (m11/m12); university fees with student loans or free public universities (k11/k12); selling the oil stakes or keeping them in a national energy company (g4/g13). A closed reform is struck through with the rival's name and the reason; it cannot be launched.
- **The statute book** (`onBooks`) distinguishes an existing law or programme from implementing it. Its capital cost is multiplied by 0.7 and its duration by 0.75, with rounding and the usual priority multiplier. The note and the already-adjusted costs are shown before launch. Laws and programmes have invented names, including the Power Sector Act, the Founders' Charter and Skills Million.
- **Reversal** is available on eleven delivered reforms. It costs one move, shows the immediate gain and the lasting effects taken back, removes the reform from the delivered record, takes back its `bonus.*`, `sec.*` and `drift.*` effects and its flags, and records `reversed.<id>` and `reversedAt.<id>`. It does not take back the old one-off gains. The new President inherits the reversal flag and the country it left. An undone reform reads *Restore: ...* until delivered again; restoration pays the normal launch costs and follows the same status gates.

**The agenda screen** (`ui/Desk.tsx`) leads with Under way, Emerging, Needs attention (the reform most exposed to attack and undone reforms), Ready now, and Needs the Assembly. Other launch barriers sit under a folded Blocked section. The full seventeen-track library is folded below it, with each track grouped into Foundations, Deepening, and visible repairs. Declared priorities come first. Emerging and attention rows retain their launch controls; disabled actions show their reasons. Delivered reforms with a reversal show its effects and a button guarded by `canReverse`. Restoration names also appear in reports, files, promises and the coming-up strip.

The President declares four priority tracks; the others cost half as much capital again. Five reforms can run at once, six at state capacity 50, seven at 65. Each under way beyond three costs political capital and strains the party monthly. Reforms that need a law are voted on when ready and can be defeated. Every launch shows its start, build-period, delivery and standing effects. The new reforms feed the existing systems: trial length, conviction odds, judicial independence, injunctions, oil forecasts, contractor arrears, gas escrow, appraisal of bets, declared campaign money, oil dependence, protests and the crisis nights. Ministers own all seventeen tracks; the Infrastructure Fund can pay for cities too.

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

**Big bets** (`content/ventures.ts`, `engine/bets.ts`): 33 risky initiatives. Each lists the conditions it depends on (a capable minister, paid contractors, reliable power, a quiet theatre, a delivered reform, a businessman as partner). Each unmet condition costs a stated share of the odds. Part-way through, the site reports what is not in place and what would fix it. The President can fix the cause, send a task team, or postpone the opening. The outcome names the condition that failed. If every condition was met and it still failed, the report says it was bad luck. A failed bet can be revived once, by the same President or a later one, six months after it failed: it starts 40% built, costs 60% of the money and four more capital than the first attempt, and gains 6 points of odds for knowing what went wrong. The abandoned site becomes a building site again. A second failure is final. A bet that works becomes an asset with a running record in its own units (barrels refined, passengers, tonnes); its manager can be replaced, and it can be expanded twice, each time for 40% of what the bet cost and 3 capital, giving 25% more output after six months (upkeep rises 15% for each). Running assets are shown in the big-bets panel as well as on the states page.

**Where bets are built, and what they leave** (`content/assets.ts`, `engine/places.ts`). Seventeen bets build something and are built in a state the President picks from a short list when launching (the steel complex in Kogi, Delta or Edo; the charter city on the coast; the rice belt in the north or Ebonyi and Benue; and so on). The card shows each candidate state's zone approval and whether its theatre is unsafe. While building, it lifts that state by 1 point of approval. If it works, it becomes an asset that runs every month under a manager (a career civil servant at first; anyone in the adviser pool can be appointed for a move and 4 capital): it earns or costs a stated sum (from −₦0.008tn to +₦0.02tn a month) and does something for the country (jobs, power, lower inflation), all scaled by 0.5 + 0.15 × the manager's competence, at 60% in a theatre of 65 or worse, at 60% again if the manager leans to a patron (who gains 0.5 standing a month; the capture is reported after six months), and at 85% if the manager's integrity is 2 or less. A working asset lifts its state by 3 points of approval (1.5 if captured). If the bet fails, the abandoned site costs its state 2 points for good. Assets, sites and the bench are handed on to the next President; the bench's loyalties flip if the other party takes over.

**The states** (the Country screen). A table of all 37: voters, the zone's approval, the theatre's threat, what has been put there with its effect, and how the state would vote today (the election model run without the mood on the day or local noise), sortable by closeness, size or zone. What is put in a state enters its vote at the same weight as approval (0.38 points of share per point), within ±6 points of approval. The second-term monument is now built in a chosen state and counts +2 there.

**The refinery** (`content/ventures.ts`, `content/events/refinery.ts`, `content/events/minor.ts`). The Minister of State's phone message asks for $290m, then $410m, then $600m. Paying twice brings the money trail to the front page months later. An unannounced visit finds the plant idle and opens a file: sack the minister and publish the engineers' report, prosecute (some money comes back), or cover it up (the trail may surface later). Publishing opens the honest version of the bet: rehabilitating the refineries, sited in Rivers, Delta or Kaduna. It can be attempted without the report at a quarter less odds. Its risks: the report, paid contractors, integrity of 36, a South South theatre under 60, and Amangala (who imports what the refinery does not make) not at war with you. If it works, fuel scarcity risk −30 and the asset keeps reducing it; petrol imports, and the dollars they cost, halve (the national refining reform nearly ends them).

Sixteen of the bets appear only when a specific reform is delivered. The rest can be attempted without the groundwork, at odds that show what the groundwork was for.

**Institutions** (`content/institutions.ts`, `engine/institutions.ts`). Orders can build things that keep running: an anti-corruption agency under a chief you appoint, a youth jobs corps, a power task force, a special economic zone, a large-taxpayer office, a delivery office, a grain reserve agency, a community policing trust and a sovereign wealth authority. Each costs capital or money to set up and a move, has a monthly upkeep (or raises revenue) shown in the treasury's flow, and a monthly output shown as a year of it. Each has a head, chosen from a career civil servant, a party nominee or anyone left in the adviser pool, shown by reputation only. Output is 65% to 125% by the head's competence, and some need conditions (the zone needs power of 45; the wealth authority needs ₦1tn in the treasury). A head who serves someone else captures it: output falls to 60%, their patron gains every month, and a crooked head turns some effects against the President (the anti-corruption agency then protects friends and costs integrity). After six months the capture is reported. A head can be replaced (a move and 4 capital) and an institution wound up. A successor inherits them, heads and all.

**What an institution is like to run** (owner, 4 October: more than a poster).
- **Ramp-up.** A new institution starts at 30% and reaches full strength over 6 to 12 months (the agency 9, the jobs corps 6, the power task force 8, the zone 12, the tax office 8, the delivery office 6, the reserve 10, the policing trust 9, the fund 6), shown as a bar.
- **A running record since it was set up, in its own units:** cases opened, convictions and money recovered (the agency; a crooked or captured chief convicts a fifth as many and recovers less); young people enrolled and classrooms repaired (the corps); megawatts restored (the task force); firms moved in and jobs (the zone); companies audited and tax collected (the tax office); promises tracked and months taken off reforms under way (the delivery office, which now really speeds every reform under way by 1.5% of progress a month at full strength); grain in the silos (the reserve); posts opened and officers trained (the policing trust); money invested (the fund).
- **Funding.** Lean (output ×0.7, cost ×0.6), standard, or generous (output ×1.25, cost ×1.5), changeable at any time.
- **The head** is shown with their field, months in post, and the evidence of capture; heads come from the talent pool.
- **Its own files.** The agency asks to charge a crooked minister (letting it proceed costs the party and wins integrity; stopping it leashes the agency, cutting its output by 40% for good, and leaves a trail). The jobs corps is found paying ghost workers (purge and prosecute, clean up quietly, or leave it and pay 30% more to run it). The zone's first factory opens, with more following if you open it yourself. Ezeudu wants the reserve's buying contract (award it for a consideration, or put it to open tender).


**Executive powers** (`content/agenda.ts`, `content/orders2.ts`): 16 standing and 55 situational. Five situational ones are on offer at a time and lapse. Twelve have a dial: VAT, relief, the Eurobond, central-bank financing, constituency projects, board seats, suspended duties, transport vouchers, the thirteenth month, the election pay rise and examination fees, and austerity at the top (the convoy; and half the air fleet; and political pay). Others depend on the moment: going over the politicians' heads and cashing in popularity pay by approval, the youth dialogue by labour anger, an emergency convention by the party's unhappiness, the currency redesign hurts more in a weak economy, and the year of return pays by the economy. Four orders became institutions (the anti-corruption chief, public works, the power emergency) and three were cut (the foreign medical ban, the rationing timetable, and the jets and pay cuts, folded into austerity at the top). Each level sets the cost and scales the effects. VAT revenue scales with what the economy can carry (half to one and a half times); a Eurobond is repaid at ₦1 plus 1% per point of debt service above 70 for every ₦1 lent.

**Aimed orders** (`engine/targets.ts`). Sixteen orders are aimed at someone, and the player picks whom: a governor (emergency rule in that state, paying councils directly with that governor made the example, moving a federal agency out), a governor or senator (a public inquiry, withdrawing the security detail, siting a federal project), a businessman (a windfall tax written to fit, revoking a licence, a waiver with a kickback and a trail, the idle-assets sale to a chosen buyer, a seat beside you on a state visit), a rival (banning their rallies, leaking a file, which leaves a trail), a newspaper (suspension, which costs different things for each of the four papers: the paper of record costs press and integrity, the street's paper the street, the businessman's paper the businessman, the opposition's paper hands its candidate strength), or a zone (fertiliser before the rains, the second-term monument). The picker lists the least friendly first and marks anyone already wronged.
- **Wear-out.** Ten are hostile. Each use within two years makes the next one work at three quarters the strength, shown on the card.
- **The wronged.** Whoever a hostile order hits remembers it for 24 months: their standing cannot rise above 45 (a businessman's above 40) until it passes. It is shown on their card with the date and the months left.
- **Challenges.** Orders of hostility 3 or more are taken to the Supreme Court the next month (see 0.3, The courts). The card shows how the bench would vote today.

## 0.5 Files and the phone

132 events offering 413 choices. Selection order: calendar, thresholds, queued follow-ups, then a weighted draw in which files arising from the President's own decisions weigh 3.5 times a generic one.

**The tension curve** (`engine/director.ts`, `tension`). Each month has a target intensity: 2.2 for the first six months of a first term, rising evenly to 4.0 by month 42; a second term starts at 2.8 and rises to 4.7. In the weighted draw a file's weight is multiplied by e^(−0.35 × the distance between its intensity and the target), so quiet files dominate early, heavy ones late, and nothing is ruled out.

**Delivered reforms under attack** (`content/events/attacks.ts`, `engine/attacks.ts`). A delivered reform that cost a businessman, a governor or the establishment when launched can be attacked from six months after delivery, at most once every 30 months. Whoever lost from it is named in the file: a businessman with a lobby (refuse for 6 capital, amend and lose half of it, or sell it for ₦15bn into the drawer with a trail), a governor who will not implement it (withhold grants, pay ₦0.4tn, or let it shrink), the Senate with a repeal bill when support is under 52 (whip it, which holds at 42 or better; veto it, which holds at 35 or better; or accept amendments), or the Supreme Court when one justice can be bought or two lean against you (an honest bench or four loyalists uphold it; otherwise even odds). Weakening reverses half of what the reform delivered. A repeal reverses 60%, takes the reform off the books with its lasting effect, and lets it be passed again.

**Cast files.** A file can name a role instead of a person: the creditor who is due, the minister who is failing, the bet in trouble, the governor being courted. The engine fills the role from the state when the file is drawn, and the effects land on that person (`engine/cast.ts`).

**Operations.** An outcome can pay a named debt, grant a want, move a fund, sack a minister, rescue a bet, start a newspaper series, warm or cool every governor or senator, spend every favour owed at once, or count as delivering a reform (`engine/ops.ts`).

**Every file reads the books.** All eleven event files, including the nine written before the systems in 0.2 and 0.3, now do three things. Their text changes with the named debts, funds, theatres, businessmen, governors, senators, favours and the budget. They offer choices that exist only because of that state: pay the pensioners first, build from the Infrastructure Fund, have a senator who owes you bury a bill, ask the media owner to starve a story, move the security effort to the theatre that was hit. And their outcomes land on named people and named balances, not only on the seven national numbers. 48 choices are conditional on the state and 132 outcomes run an operation.

**Help on a decision.** On any lead file the President can attach a favour, or put the minister of the brief in front of it: the damage to approval is halved and it goes on the minister's scorecard.

**Write-back.** Effects on a zone move its governor. Results in a brief mark its minister. Files from the Senate or the Governors' Forum move the person who runs it.

Tone rule: grave files carry no jokes, and every paper prints them straight.

**Asset declarations.** The reform, the day-one order and the big bet that need a clean record check only money taken for yourself or held in the drawer (`exposure.personal`), not campaign money or political deals.

**Inherited premises.** The calendar restarts at month one for every President, so a file's premise is checked against the world it fires in, not the default start: the true-arrears file needs real contractor arrears; the security vote is not offered if the predecessor put it on the books, and says so if they left it untouched (`pred.drawer`); the transmission-corridor tender needs the corridors unbuilt; the refinery minister's "mechanical completion" stops once the refinery has been rebuilt or is being rebuilt; and the reactive files that say "you ordered" or "the law you signed" read `mine.<id>`, which is true only for what this President did. Lines that once said "you" about reforms a predecessor may have delivered are worded neutrally.

## 0.5b Nights (`engine/night.ts`, `content/setpieces.ts`, `ui/Night.tsx`)

A normal month is strategic; a night is not. The clock moves only when the President acts (each option takes minutes) or waits (30 minutes). Beats arrive at their time if the state of the world allows them, so the cast moves without waiting: a cold governor posts something unhelpful, a restless Vice President calls party leaders, the least loyal adviser stops answering, the Chief of Army Staff is unreachable unless the service chiefs were replaced recently. Options close as the night goes on, by the clock or because something happened. What is really going on is drawn at the start from the state of the world and told at dawn, with what each decision turned out to mean; every option has different effects by truth. At most one night every ten months, each kind once a term.

| Night | When it can happen | What might really be going on |
|---|---|---|
| The rumour (00:40) | Security below 35, approval below 38, a theatre at 75, or the chiefs just replaced; 8% a month | A training exercise; a few officers testing the water; a failed attempt |
| The count (21:30) | Every close re-election (margin under 4): it runs before the declaration | You had won; you had lost. Police at the collation centres turn a narrow loss into a win at a heavy cost; conceding turns a narrow win into a loss |
| The deadline (21:00) | Labour anger 70 or more; 12% | The union was bluffing; the union meant it |
| The naira's Friday (20:00) | Street premium over 30% or reserves under $10bn; 10% | A few traders; real flight |
| The water (23:00) | August to October; 8% | A small release; a large one |
| The video (22:00) | Scandal heat 50 or more; 8% | Real and recent; real and six years old; doctored |

## 0.5a Shocks (`content/shocks.ts`, `engine/shocks.ts`)

The owner asked not to be told what the shocks are, so this section describes the mechanism and leaves the list to the content file.

Shocks are things that happen to the country from outside, good and bad, at even odds (owner, 4 October: the good and the bad carry the same total weight). After month 6, with none under way and at least ten months since the last, each month has a 7% chance of one (12% from month 8 until the first has arrived), drawn by weight from those not yet seen this presidency (some only in certain months). In 40 simulated first terms, 1.6 arrived per term on average, one term in forty saw none, and 56% were good. Each lasts a few months and arrives with a lead file and the front page.

Every month a shock lasts, its effects land scaled by what is in place. A bad shock is reduced by each *cushion* that holds (a delivered reform, a fund with money in it, a quiet theatre, the government's answer in the file), down to 15% of its full force. A good shock is *caught*: a base share (60% unless stated, so luck still feels like luck) plus each thing in place, up to 150%. It sits at the top of the desk's "to decide" column, stamped SHOCK or WINDFALL in its first month and with the months left after, with a running tally of what it has done so far, and every shock under way is in the coming-up strip. The desk shows the shock, the months left, the share felt or caught, each month's effects, and every cushion met (✓) or missing (✗); the monthly report repeats it with the reasons. The lint requires every bad shock to have at least one cushion the President could have built.

## 0.6 The press (`content/press.ts`, `engine/press.ts`)

Four papers: The Federal Chronicle (record), Street Gist (the street), The Daily Stakeholder (owned by the media businessman; loyal or hostile as he is), The Daily Rejoinder (the opposition's).

Two are printed each month on the same lead: one that reports and one that takes sides. The partisan paper leads on a reaction, with the facts underneath. Every story carries a subject and whether it is good or bad for the government, and every line is chosen to match. Jokes are printed once per game. Slow-month stories come from the President's own books, people and projects.

Series run over several months (unpaid pensioners, payments out of the Villa, a minister's contracts, a licence given to a financier) and end early if the President removes the cause.

**What people say about what you did** (owner, 3 October: the talking points must catch up). The press, the rivals, your own people, the Chief of Staff and the phone all now read the systems built since phase 3:
- **Rivals** each have situational lines, preferred over their stock lines when they apply: the street premium, a float, a peg, a packed bench, orders struck down, injunctions, the budget signed with insertions or stalled or vetoed, abandoned sites, a covered-up refinery, a working refinery, an immunity law, a backed successor, the governors with grievances, and orders aimed at that rival.
- **Your governors and senators**, quoted in a story about them, speak from their grievance when they hold one from your orders.
- **Editorials, sidebars and headline fillers** cover the naira (premium, a large fall, a float, falling reserves), the bench, struck orders, injunctions, how the budget passed, grievances, abandoned sites, the refinery, the immunity law and the succession. The "refinery is 98% complete" filler stops once the plant is exposed or rebuilt.
- **The Chief of Staff** warns about defended reserves, a wide premium, a vacant seat on the court, the Assembly's version of the budget, three or more grievances, an order about to be challenged, the succession timetable and the refinery engineers. The note is rewritten after the budget or a file is dealt with.
- **New phone messages**: the central bank governor when defended reserves fall under $18bn (let it move, hold the line, or bring oil receipts forward and pay for it later); the bureau de change operators when the premium passes 20%; Senator Zango after a veto or a stalled budget; Amangala offering a "consultancy" while the refinery is being rebuilt; and anyone holding a grievance, asking to clear the air (meeting them ends the grievance early).

## 0.7 Elections and the verdict

Re-election is decided state by state from zone approval, the party machine, governors, rallies, the campaign chest, scandal, the strongest rival, whether the money is with or against the President, and a clean record. The outlook on the desk counts the same things, except the mood on the day.

- **The mood on the day.** A national swing of up to 7 points of share either way (two random draws, so usually under 3), named on the result screen when it moves the vote by a point or more. A flawless President can lose a close race and an underdog can win one. The outlook's tooltip says so.
- **A clean record.** Integrity above 62 adds 0.08 points of share per point. Money spent against the President loses force as integrity rises above 40 (at 73, it buys about two-thirds as much): there is less to smear. Money working for the President is unaffected.
- **The opposition merger** arrives in month 34 of every first term. Against a President whose projected margin is 6 or more, the merger cannot fail and is broad: it draws in everyone who wants a change and costs 4.5 points of share (9 of margin) instead of 3. Otherwise leaving it alone splits it half the time. Paying the open-minded chairman costs ₦20bn from the drawer and works 60% of the time; when it fails the merger goes ahead and the offer leaks. Event conditions can read the projected margin as `outlook`.
- **Weights.** Approval counts 0.38 points of share per point (was 0.45); the party machine 4 (was 5); a united opposition −3 (was −2).
- **Popular policies.** Each crowd-pleaser in force keeps approval a little higher for as long as it stands (the ₦150,000 wage 2 points when the economy can carry it and 1 when not; the fixed pump price 2; the price control board 1.5 while inflation is above 12; the death penalty 1.5; the others 0.3 to 0.5), shown on the card and in the policies tab. Voters give less lasting credit for low hardship than before (0.10 a point, was 0.25).

**The primary.** Delegates are 65% the clout of governors and senators who are with the President or owe a favour, 35% the party's mood, plus 1.5 for each point of approval above 50: delegates defy their governors for a popular President. A President with 55% approval (was 58%) and 36% of delegates can also win on the floor.

The verdict grades seven dimensions against what was inherited, including what is still owed and what was saved, names an epithet, and lists what is handed on. The baseline is the scenario or inheritance the presidency actually started from.

**The tribunal** (`content/events/tribunal.ts`). A win by fewer than seven points is petitioned. How the campaign was paid for is the evidence: a clean campaign is upheld, a bought convention or a funded spoiler can be annulled when four or more justices cannot be reached (55% of the time; ending: The Annulled). When four or more owe the President their seats, the election is upheld 4–3 at a cost in press and integrity. A panel can also be spoken to at a price. A loss by under three points can be petitioned by the President: honest courts overturn it a little under half the time, on the result sheets, and the presidency continues into a second term. Weak courts can be bought, with a chance of being named in open court.

## 0.7a Scenarios and succession

**Starting scenarios** (`content/scenarios.ts`), chosen on the certificate of return: The Standard Inheritance, The Boom, The Morning After, After the Scandal, The Reformer's Handover, The Long Emergency. Each sets the nation, the named debts and funds, the oil price path, the theatres, the blocs and the inherited archive, and states its test.

**Backing a successor** (`engine/successor.ts`, the succession tab in Politics, open from the first term). Anyone in the named cast can be the candidate: the six governors, four senators, six ministers and the Finance Minister. Each shows three numbers. Strength (points of share at the succession election, before the usual −3 for not being the President; from −2 to 4) is 0.7 per point of clout above 3, 0.4 per point of competence above 3, 0.3 per point of a minister's following, 0.4 for each platform given, 0.3 for each delivered reform credited to them (up to four), and 0.2 for each of the first two platforms given in the first term (the country is used to the idea). Loyalty is their standing with you, less 15 for each grievance they hold from your orders, less 10 if ambitious, plus 5 for each platform and 4 for each credit. Integrity is a minister's, or read from temperament. A platform costs a move and 4 capital, once a season, up to six times, from month 12 of the first term to month 36 of the second; each other ambitious figure or figure of clout 5 cools by 3, or by 5 before the first election, when they also wonder whether you mean to run. Crediting a reform you delivered (a move and 2 capital, each reform once) gives them a record to campaign on. A backed successor who is a governor or senator carries their own zone, worth the home-zone bonus there. The succession file in month 34 to 37 names the three the party is talking about (groomed first, then strongest). Backing one sets the strength, loyalty and integrity carried to the election and after it; the governors' fallout, fighting, buying or calling in favours adjust that strength. Simulated, a reformer who builds and backs an heir now keeps the presidency about two times in three; before, it almost never did.

**Life after office** (`engine/afterlife.ts`, shown on the verdict). Immunity ends at noon on the last day. Against the President: what was kept (2 × √(₦bn kept ÷ 10)), political money handled (up to 2), the paper trail (up to 3), witnesses (up to 2), removal from office (2), and, if the other side holds the Villa, each grievance the incoming rival holds (up to 2). Protecting the President: a successor of the same party who owes the Villa to the President (loyalty ÷ 25, halved if the successor is honest, the loyalty is under 75 and more than ₦40bn was kept), each justice appointed by the President (0.4 each, from two), an immunity law (2.5 with an ally in power, 1 without), leaving with approval of 55% or better (1), and favours still owed (up to 2). A President who kept under ₦5bn and left little trail becomes an elder statesman, has a quiet retirement, or is harassed by a rival they persecuted. Otherwise the difference decides: protected (0 or less), investigated (to 2.5), then exile if money was moved abroad, on trial (to 6), or prison. Prison and exile replace the epithet. Two standing orders prepare for it: moving money abroad (months 38 to 48 of either term, with ₦20bn kept or in the drawer; a trail of 1) and an immunity law (second term, months 36 to 46, Senate support of 55 or better, 15 capital, integrity −5, press −8).

**Succession** (`engine/succession.ts`). At the verdict the player can take the oath as the next President. The winner of the following election is worked out from the state left behind. The new presidency starts in the same country: debts, funds, oil, budget, theatres, delivered and half-finished reforms, big bets under construction, licences already granted, consequences already on their way, and the archive (marked as inherited). The calendar moves on by the years served. Handover notes that were not candid give the successor no figure for what is owed. **The era you inherit** (`engine/era.ts`, on the handover certificate) is what changed in politics, read from the last presidency: a party that ended below 35 stays divided (one more primary scar and party −8 if it is yours; the defeated opposition is split if it is not); a governor the last President built up (standing 85 or more and two wants granted) becomes a kingmaker with clout +2, cooler by 15 if the Villa changed hands; the businessman most favoured buys The Stakeholder, whose stance then follows that businessman; an honest anti-corruption agency (head of integrity 4 or more) that charged anyone takes no instructions from the new President (head's loyalty 2 at most); an order the Supreme Court struck down can no longer be given by any President; and a reform the Assembly defeated has become the received view and costs 40% less capital to launch. A situational power, "Blame the previous administration", is available early and wears out. If the predecessor kept money or left a trail, a file about it arrives in the first year.

## 0.8 Names

Every character has an ordinary Nigerian name. Each full name was searched on the web before use and replaced if the search found a public figure. The rule and the registry are in `content/names.ts`. Parties, newspapers, unions and companies keep invented names.

## 0.9 Tools

- `npx tsx tools/check-reforms.ts` checks the second-edition status gates, rival choices, reversals, handovers and restoration names without a browser. The current balance comparison is recorded in `docs/BRIEFING.md` under Reform-library verification.
- `npm run typecheck`, `npm run lint:content` (references, tokens, operations, cast selectors, bet conditions, the "nothing echoes" and softlock rules).
- `npm run simulate -- 40 --probe` plays whole presidencies with seven scripted strategies and reports outcomes, and the state on the eve of the first election, including each theatre. Every bot except Random and Do-nothing concentrates forces on the worst theatre above 55 and orders an offensive there above 60.
- Saves are brought forward by `engine/migrate.ts`: an older save has new systems started from the state it is in, and any missing field is filled from a fresh game.

Simulator results at the time of writing (40 presidencies each):

| Strategy | Re-elected | Note |
|---|---|---|
| Random | 0–2% | |
| Do-nothing | about 2% | |
| Populist | about 34% | Takes the crowd-pleasers, avoids scandal, spends on relief in election year; usually leads at month 34 and meets a broad merger |
| Machine politician | about 55% | Takes crowd-pleasers too, borrows before elections; often leads at month 34 and meets a broad merger |
| Clean institutionalist | about 45% | Grants only wants that cost no integrity, protects the party in the year before the primary; no longer loses the ticket |
| Kleptocrat | about 30–43% | Keeps about ₦310bn; buys the opposition chairman or a spoiler. Above the 20–30% first aimed for; the owner chose to leave it, because corruption works |
| Reformer (flawless play) | about 79% | Times its painful reforms (early in a term or after re-election, one at a time). Loses about one election in eight: its lead invites a broad merger, and the mood on the day can take a close one |
| Reformer, any order | about 53% | The same script without the timing: painful reforms land on the election |
| Reformer, keeps subsidy | about 82% | Keeping the subsidy costs a flawless reformer nothing at the ballot |
| Reformer, ignores debts | about 84% |
| Reformer, trusts advisers | about 73% | Takes every recommendation on files |
| Reformer, checks the record | about 84% | Asks for a second opinion when an adviser's record is poor or keeps helping someone else | Leaving debts unpaid costs a flawless reformer little |

Phase 3 (advisers, wants, ministers' arcs) was balanced on 100 presidencies each: blind trust in advisers costs a reformer about 11 points, checking their record recovers it. The populist declines crooked asks as it declines scandal in files; the institutionalist refuses crooked asks openly only to people solidly with it; refusing everyone cost it half its wins. With shocks (about three a presidency for those who last), the flawless reformer fell from 88% and the machine rose from 57%. The three imperfect reformers measure how narrow the reformer's path is. Timing is now worth about 26 points; the subsidy and the debts are not yet decisions that change who wins. The populist, machine, reformer and institutionalist bots all time their painful reforms; only the "any order" reformer does not.

The balance pass of 3 October (60 presidencies each) set these. Aims were reformer 75–85%, machine 55–70%, institutionalist 30–40%, populist 25–35%, kleptocrat 20–30%. The bots now value each choice by the chance-weighted average of its outcomes rather than its last one, so they see gambles as the engine plays them; before this the kleptocrat never noticed that a bribe could break the merger. The probe prints margin percentiles (p10, p50, p90), opposition unity and integrity. By scenario (12 each) the reformer ranges from 42% (The Morning After) to 100% (The Long Emergency), the populist from 0% (The Morning After, The Long Emergency) to 83% (The Reformer's Handover).


Before the balance pass, standing policies and dials moved them (phase 2). The engine changes alone left every strategy within sampling noise except the machine politician, which rose. The falls came from what the bots now do: the populist and machine take the crowd-pleasers, the institutionalist raises VAT, and bots that borrowed $3bn every time the treasury ran low spiralled into debt (the machine fell to 28% until it borrowed only before elections and below 80 debt service). `SKIP=pop,rep,relief,bond,vat npm run simulate` switches those behaviours off one by one.

Security by theatre moved them before that. Once the bots used the security focus and the offensive (under the old flat rules) the kleptocrat rose from 20% to 57%: the two levers were stronger than the table showed, because no bot used them. With theatre-by-theatre reforms and a targeted offensive, national security on the eve of the first election fell for every governing strategy (the reformer's from 71 to 58) and the kleptocrat returned to about 23%.

The event rewrite moved them before that. Before it the kleptocrat was re-elected 73% of the time and the machine politician 40%; debts to financiers and governors now come due inside ordinary files, which is what the kleptocrat cannot pay. By scenario (12 presidencies each), a reformer is re-elected 83% of the time in The Morning After and 100% elsewhere; the machine politician ranges from 17% (The Morning After) to 92% (The Reformer's Handover). `--world` chains four presidents through one country.

## 0.10 Not built

- Lower courts. The Supreme Court is built (0.3).
- The successor as a character in the next presidency: taking the oath continues as the President, not as the person backed.
- Ministers beyond the six, and governors beyond the six zone leaders. Governors are not tied to a state, on purpose: a fictional governor of a real state would read as its real one.
- Onboarding, sound and art.
- A hand-played balance pass. The flawless reformer bot always wins re-election outside The Morning After, and the populist bot may now be too weak.
- Twelve files never arise in bot play because the bots never give the orders that cause them (the VAT, price-freeze, money-printing, duties and service-chiefs reactions among them). They are linted and type-checked but have not been played.
