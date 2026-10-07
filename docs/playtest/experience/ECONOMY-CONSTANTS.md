# Economy constants: what each one means

Plan 09.A14. Every coefficient that moves money, with the economic quantity it stands for, the reasoning behind its size, and whether it still does anything. Units are ₦tn a month at the game's scale, in the starting year's prices, unless stated. Sources: `engine/accounts.ts` (ACC), `engine/config.ts` (CFG.economy), `engine/treasury.ts`, `engine/currency.ts`.

## Revenue

| Constant | Value | Meaning | Assessment |
|---|---|---|---|
| `ACC.oilK` | 0.003 | Naira revenue per dollar of oil price per month at 1.75m barrels a day and the starting real exchange rate | At $74 a barrel, oil brings ₦0.21tn a month, about two thirds of federal revenue: the oil dependence the game is about. Scales with output, the real rate and the share of oil stakes still owned |
| `ACC.nonOilBase` | 0.10 | Taxes and other revenue at home at the starting capacity and jobs | Raised from 0.0725 in the plan 18 balance pass: at 0.0725 a government that did no fiscal reform ran a deficit of 40% of revenue and reached default within one term whatever else it did, so only one programme was viable. At 0.10 the same government drifts from 60% to about 95% debt service: a crisis looming, not a certainty |
| Capacity and jobs terms in `nonOilRevenue` | 0.004 and 0.003 per point | A capable state collects more; a larger economy has more to tax | Kept; the tax track's base (`fiscal.base`) adds to it |
| `CFG.economy.federalKeep` | above 0.12, share 0.4 | When the month's balance is more than ₦120bn in surplus, the states take 60% of the excess and the centre keeps 40% (the states take more under the fiscal-autonomy clause) | Stands for the federation account: windfalls are shared, so an oil boom helps the centre less than its size suggests |

## Spending and debt

| Constant | Value | Meaning | Assessment |
|---|---|---|---|
| `ACC.running` | 0.1005 | Salaries and overheads of the federal government | The largest fixed line; payroll crises arise when cash cannot meet it |
| `ACC.interest` | eurobond 14.4%, bonds 10.8%, ways 9%, lender 3% | Annual rates on each interest-bearing debt | Ordered as in reality: foreign commercial debt dearest, a concessional lender cheapest, the central bank overdraft below the market |
| `debtCliff` | 90 | Debt service (interest against revenue, %) above which an empty treasury means austerity: capital spending stops, power and security decay faster | A service ratio this high leaves almost nothing for government; the effects are the visible signs of that |
| `noLendingAbove` | 100 | Debt service above which nobody lends: shortfalls are covered by the central bank overdraft (printing) and arrears | The point at which market access closes |
| `debtCliffToInflation` | 0.5 | Inflation added per point of service above the cliff | The cost of monetising a deficit |
| `subsidyDrift` | full −0.16 to removed +0.07 | What each petrol price regime does to the monthly balance | The subsidy is the largest discretionary line; removal frees money but costs the street |
| `capacityToFiscal`, `debtToFiscal`, `integrityToFiscal`, `jobsToFiscal`, `borrowToDebt`, `debtPaydown` | removed | Coefficients of the deviation model that preceded gross accounts | Read nowhere; removed from `engine/config.ts` in the plan 18 audit |

## Deficits and arrears

When the month ends short, savings are drawn first (the stabilisation account). Any remaining shortfall is split: half borrowed (bonds while lending is open, the overdraft after), and the rest becomes arrears to contractors (30%, or 12% once payment discipline reform is in force) and pensioners (20%). This is why an unreformed treasury shows its trouble first as unpaid contractors and pensioners rather than as new debt.

## The external account

| Constant | Value | Meaning |
|---|---|---|
| Imports of goods and services | $2.56bn a month at the start | What the economy buys abroad; grows a little with jobs |
| Petrol imports | $0.3bn a month, less what working refineries replace | The largest single import; each refinery's share is its real output |
| Foreign debt service | $0.12bn a month plus more as service rises | Dollars owed abroad |
| `COVER_SAFE` | 4 months | Reserve cover below which creditors and investors leave ($0.08bn a month per month short) |
| Managed rate | 2 months of cover | Below this the central bank cannot smooth the rate |
| Fund abroad return | about 0.3% a month with market swings | Invested, not held as reserves; revalued with the naira |

## Spending multipliers

Budget sectors raise their outcomes through `releaseRate` and each sector's usual level (content/treasury.ts). A release of less than the allocation slows reforms that spend through that sector (`heldFactor`), so a budget cut appears as slower delivery, not as an abstract loss. Multipliers on jobs and power from spending are the reform effects themselves; there is no separate Keynesian multiplier, by design.
