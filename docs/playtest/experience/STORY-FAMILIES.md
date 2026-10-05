# Story families

Plan section 07: organise electricity, fuel, universities, wages, procurement, industry, cabinet performance, security, coalition politics and succession into developing families, each with condition, episode, intervention, response, next development and exit. Baseline `4227861`, contract v0.

Each family below is written against the episode contract requested as R2 (`family`, `subject`, `state`, beats typed decision / progress / condition / closing). Where a family can already be improved with today's DSL, the interim step is listed. Existing event ids are kept wherever saves or flags depend on them.

Common rules for every family:

- **One live episode per subject.** A second grid collapse while the first episode is open is a development of that episode, not a new file.
- **A recurrence names what changed** since the last beat: who, how much, what was tried.
- **Unchanged conditions go to the status views** (Treasury, the country, the commitments register), not the desk.
- **Success closes the episode with a closing report** and, where the plan asks, opens a different question (development creates new constituencies).
- **No episode contradicts a delivered reform, a settled dispute, an empty reserve or a dismissed person.**

## Electricity

| | |
|---|---|
| Subject | The national grid (one subject), and each gas supplier debt episode. |
| Condition | Power below 50 and the corridors (p2) not rebuilt; or gas debt above ₦1tn. |
| Episode states | `fragile` → `collapsed` → `diagnosed` (gas / transmission / tariff / sabotage) → `repaired` or `patched` → `closed` when p2 and p3 are delivered and gas debt is under ₦0.3tn. |
| Interventions | Pay gas; reinforce lines (budget or Infrastructure Fund); tariff (p3); probe (now produces a real diagnosis, not a panel joke); regulator independence. |
| Responses | Suppliers, the minister (marked by name), Band A customers, manufacturers (Birniwa), the press. |
| Next development | A patch shortens the next interval but names the corridor that will fail next. A tariff delivered moves the story to refunds (`react.tariff`). Rebuilt corridors end collapses and open supply-quality politics: factories ask for dedicated feeders, states ask for a share. |
| Exit | Closing report: "Six months without a national collapse", crediting the minister and the administration that started the corridors. |
| Existing events | `grid.collapse`, `shock.blackout` (merge: the severe beat), `debt.gas`, `tariff.power`, `react.tariff`. |
| Interim (today's DSL) | Done: none yet. Next: merge `shock.blackout` text into a severity variant of `grid.collapse`; make `probe` produce a diagnosis line keyed on `debt.gas` and `agenda.p2`. |

## Fuel and the subsidy

| | |
|---|---|
| Subject | The pump price regime; each scarcity episode; the strategic reserve; the refinery. |
| Condition | Subsidy partial or full and fuel supply stress above 45. |
| Episode states | Scarcity: `queues` → `verified` (claims checked) → `ended` (paid / reserve / imports / favour) with the reserve tracked as `full` or `empty`. Subsidy: `inherited` → `phasing` / `removed` / `retained` → labour beats → `dividend`. |
| Interventions | Pay claims; release or refill the reserve (done); direct imports; call in Amangala's favour; inspect the depots (R8: resolves "neither statement has been verified"). |
| Responses | Amangala, the marketers, labour, governors, the street, the bond market. |
| Next development | Each scarcity names the last remedy and why it did not hold. Removal ends scarcities and opens the dividend and labour questions. |
| Exit | Removal plus a working supply: the family closes with "the price is simply the price". |
| Existing events | `subsidy.*`, `petrol.scarcity`, `react.freeze`, `tycoon.depots`, `minor.refinery`, `refinery.exposed`, `refinery.scandal`, `minor.amangala`. The refinery and subsidy chains are protected. |
| Interim | Done: reserve state (D2), recurrence line, lender programme routed through the subsidy beats (D9). |

## Universities

| | |
|---|---|
| Subject | The eleven-year-old agreement (one subject). |
| Condition | Agreement inherited unfunded. |
| Episode states | `ultimatum` → `talks` (with a genuine timetable) → `phased` / `implemented` / `broken` → `strike` (month counted) → `settled`. |
| Interventions | Implement; phase; talks with a dated offer (talks buy a defined period at a stated cost); funding law (e2); Zango's favour. |
| Responses | The union, students, the minister, other unions (`labour.me_too`). |
| Next development | The strike's second beat says how many months and what was lost (graduates, lecturers abroad). Implementation opens quality questions: what the money bought (plan 14: access versus quality). |
| Exit | Closing report from the union (`react.labour_thanks`). |
| Existing events | `uni.ultimatum`, `uni.committee`, `uni.tranche`, `uni.strike`, `labour.me_too`, `react.labour_thanks`. Protected chain. |

## Wages and labour

| | |
|---|---|
| Subject | The minimum wage; each union's agreement; pensions. |
| Episode states | `review` → `figure chosen` → `states defaulting` → `funded` / `named` / `left`. Doctors: `strike` → `paid` / `half paid (second half due)` → `closed`. |
| Next development | Half-payments become dated commitments (R4) instead of vanishing. |
| Existing events | `wage.review`, `wage.states`, `doctors.strike`, `minor.labour`, `subsidy.ultimatum`, `subsidy.strike`, `debt.pensions`. |

## Procurement and contractors

| | |
|---|---|
| Subject | Each major contract (the transmission corridor, the flagship bets); the contractor arrears. |
| Episode states | `award` (clean / preferred) → `mobilised` → `delivering` / `stalled` (arrears, injunction) → `delivered` / `abandoned`. Arrears: `owed` → `judgment` → `paid` / `notes` / `appealed`. |
| Next development | The chosen contractor's record shows in delivery: the corridor awarded to the financier's nephew runs late and over, and that appears in the electricity family as the cause. |
| Existing events | `tempt.contractor`, `react.contracting`, `court.injunction`, `debt.contractors`, `minor.birthday`, `collapse.building`, `handover.contracts`. |
| Interim | Done: the injunction now needs open contracting in force (D7). |

## Industry

| | |
|---|---|
| Subject | Each industrial site (the economic zone, Birniwa's plants, new investors). |
| Episode states | `courted` → `deal` (holiday / squeeze / standard) → `building` → `operating` → new politics (workers organise, suppliers want credit, a rival town wants its own zone). |
| Acceptance history 1 | Power and a privileged investment deal create factories and a patron; a successor confronts procurement opening and an investigation; a third government inherits workers, new firms and competing interests. This family carries it. |
| Existing events | `shock.factory`, `inst.zone.factory` (rewritten from a ribbon scene into the first beat of this history), `tycoon.layoff`, `react.duties`, `fortune.startup` + `shock.listing` (merge). |

## Cabinet performance

| | |
|---|---|
| Subject | Each minister (by person, not office: plan 01 and 03). |
| Episode states | `appointed` (with terms where exceptional, R5) → `targeted` (written target, S1) → `reviewed` (met / missed / funding withheld / evidence disputed) → `kept` / `reshuffled` / `resigned to run`. |
| Next development | A missed target with withheld funding is the government's failure and is said so. |
| Existing events | `min.failing`, `min.star`, `min.dirty`, `min.resigns`, `fin.*` arcs (the model for exceptional terms), `farce.interview`, `cabinet.leak`, `second.minister_runs`. |
| Interim | Done: no credit for being put on a target; the target is recorded. |

## Security, all six theatres

| | |
|---|---|
| Subject | Each theatre (North West, North East, North Central, South West, South East, South South), each mission (R9). |
| Episode states | `incident` → `response` (mission: objective, commander, resources, conduct limits) → `operating` (supply, intelligence, civilian cooperation) → `holding` / `tactical gain without security` / `failed` → `closed` when the theatre drops below its danger line for a sustained period. |
| Coverage | North West: `abduction`. North East: `sec.insurgency`. North Central: `attack.farms`. South West: `sec.highway`. South East: `sec.sitathome`. South South: `sec.oil`, `react.oilco`. Each gets a mission arc and a named commander (plan 13). |
| Acceptance history 6 | A corridor mission over a year: funding, operations, civilians, politics. |

## Coalition politics

| | |
|---|---|
| Subject | The party, the Senate, each governor, each request (R3). |
| Episode states | Requests: `asked` → `granted` / `refused (closed)` / `substituted (accepted)` → a new request only with a material change. Party: `restless` → `stakeholders` → `ticket` → `primary`. |
| Existing events | `senate.screening`, `elder.letter`, `party.decamp`, `opposition.unites`, `ticket.*`, `break.*`, `owe.*`, `cast.call`, `promise.clash`, `minor.governor_call` (the model request), `minor.chair`, `minor.zango`, `react.clean_party`, `react.patronage`, `budget.projects`. |
| Interim | Recurrence lines for `elder.letter` and `party.decamp` (next commit). |

## Succession

| | |
|---|---|
| Subject | The succession settlement (R13). |
| Episode states | Prepared during office: `grooming` (several candidates tested through delegated responsibility) → `negotiating` (endorsements, continuity programme) → `declared` → `nomination` → `campaign` → `transfer`. |
| Existing events | `succession.choice`, `succession.fallout`, `second.*`, `handover.*`, `inherit.matters`, `pred.*`. |

## Treasury and debt

| | |
|---|---|
| Subject | Each named debt; each fund; the oil benchmark year. |
| Episode states | Debt: `serviceable` → `stressed` → `crisis` → `programme` / `printed` / `restructured` / `fund used`. |
| Existing events | `debt.crisis`, `debt.maturity`, `debt.contractors`, `debt.pensions`, `downgrade`, `lender.offer`, `oil.shortfall`, `fund.share`, `fund.raid`, `react.print`, `minor.cbn`, `minor.bdc`, `break.establishment`. |
| Interim | Done: D4, D6, D9. |

## Floods, harvests and other shocks

| | |
|---|---|
| Subject | Each shock; the flood defences (one state, not two). |
| Merge | `flood` with `shock.flood`; `fortune.harvest` with `shock.bumper`; `fortune.football` with `shock.cup`; `grid.collapse` with `shock.blackout`; `fortune.startup` with `shock.listing`. One defence state: `agenda.w4` and `flood.defences` become the same thing. |
