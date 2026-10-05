# Event audit at the baseline

Plan section 07. Baseline `4227861`, contract v0. Every one of the 180 events in the registry was read in full (title, body, every choice and every outcome) on 5 October 2026. This is the individual audit the plan asks for; the family rewrites in `STORY-FAMILIES.md` and the commits that follow act on it.

## How to read it

Each event is judged against the scene standard: why this situation, why now, why this person, what judgement is required, what persists, how the consequence returns, what changes on recurrence, and what closes the episode.

| Verdict | Meaning |
|---|---|
| **Keep** | Sound. Polish only. |
| **Revise** | Fixable in content now, with the existing DSL. |
| **Rebuild** | Needs an engine contract before it can be done properly. The contract is named (R1–R14, see `CONTRACT-REQUESTS.md`). Text work starts now. |
| **Merge** | Duplicates another event or system. The two become one family. |
| **Retire** | Remove once its family replaces it. Nothing is retired without a replacement. |

Type is what the scene is: **decision**, **escalation** (a decision inside a running episode), **progress** (should be a status line, not a file), **condition** (an unchanged state that keeps interrupting), or **closing** (an episode's end).

## Confirmed defects (verified against the code, not inferred)

| # | Event(s) | Defect | Fix | Owner |
|---|---|---|---|---|
| D1 | `min.failing` → choice `target` | "Six months and a target in writing" adds a +1 mark to the minister at once and never returns. The target is never checked. The plan names this case. | Remove the immediate mark. Author `min.target.review`, scheduled six months later, judging delivery, failure, funding the government withheld, and disputed evidence. A proper version needs R4. | Content now; R4 later |
| D2 | `petrol.scarcity` → choice `reserve` | Sets `reserve.empty`, which nothing reads. The empty reserve can be released again. The plan names this case. | `requires: not reserve.empty`, a refill path, and text that reads the reserve's state. | Content now |
| D3 | `react.oilco` → `meter`, `sec.oil` → `meter` | Two files meter the terminals. `sec.oil` checks `oil.metered`; `react.oilco` does not, so metering can be bought twice. Same headline in both. | Guard `react.oilco` and give it a different post-metering choice. | Content now |
| D4 | `debt.crisis` → `print` | The result says the overdraft grows by ₦3.5tn. The headline says ₦6tn. | Make the headline agree. Plan 09 also asks that "money it creates" be an explicit transaction (R7). | Content now; R7 |
| D5 | `shock.flight` → `defend` | "Spend the savings defending the naira" runs `fundmove abroad → states`. The money leaves the fund for an account that does not exist, and no reserves are sold. | Needs a reserve sale transaction (R7). Until then, report it to Codex as an accounting defect. | Codex (engine), R7 |
| D6 | `debt.maturity` → headline | "$1BN EUROBOND" against "₦1.5tn". It implies an exchange rate the game does not hold for that bond. | Name the amount in the bond's own currency once R7 stores it. Interim: state the naira figure only. | Content now; R7 |
| D7 | `court.injunction` | Asserts "your executive order on procurement transparency" whether or not any such order was given. Plan 01 forbids inventing an incident. | Cast on an actual order or reform the player gave (`c1`, or an order from the procurement group). If none exists, the file does not arise. | Content now |
| D8 | `senate.fight` | Asserts "your Tax Administration Bill" in second reading even when no tax reform is under way. | Require `active.t1` or another tax bill under way. | Content now |
| D9 | `debt.crisis` → `programme` | Accepting the lender's programme silently sets `policy.subsidy: removed`. A huge policy change is hidden in a flag. | Make the condition visible in the choice and text, and route it through the subsidy family's removal beats. | Content now |
| D10 | `owe.tycoon`, `owe.governor` → `refuse` | Refusing to pay a creditor *settles* the debt. Refusal erases the obligation instead of closing a request and changing the relationship. | R3: refusal closes the request; the favour remains, or is formally repudiated with a consequence. | R3 |
| D11 | `minor.clearair` → `meet` | `forgive` deletes every grievance with that person after one meeting, whatever the dispute. Plan 05 forbids this. | R3: reconciliation addresses the named dispute. | R3 |
| D12 | 16 outcomes | Empty headline strings `''` (not missing, empty). Inconsistent with the 64 outcomes that omit the headline. | Either write a headline or omit the field deliberately, with a reason recorded (private outcomes). | Content now |
| D13 | `fortune.harvest` / `shock.bumper`, `fortune.startup` / `shock.listing`, `fortune.football` / `shock.cup`, `grid.collapse` / `shock.blackout`, `flood` / `shock.flood` | Five pairs: the same situation exists twice, in the event deck and in the shock system, with different numbers and different flags (`flood.defences` vs `agenda.w4`). A player can see both. | Merge each pair into one family with one state. | Content now (merge), R2 |
| D14 | 53 repeating events | Most repeat their body unchanged. Exceptions: `grid.collapse`, `flood`, `minor.refinery` vary with a count, and `attack.farms` varies with `s2`. | Story families with episode state (R2). Interim: each recurrence must carry a development line. | R2; content now |

### Status of the defects

| Defect | Status on this branch |
|---|---|
| D1 | Partly fixed: the immediate +1 credit is removed and a `target.<id>` flag records the target. The review waits on request S1. |
| D2 | Fixed: the release needs a reserve; a refill choice exists; the text says when the reserve is empty and when the scarcity has happened before. |
| D3 | Fixed: `react.oilco` cannot meter twice; once metered it offers publishing the meter readings against the company's loss claims. |
| D4 | Fixed: the headline says ₦3.5tn. |
| D5 | Engine defect, sent as S3. |
| D6 | Fixed: the headline states ₦1.5tn. The bond's own currency waits on R7. |
| D7 | Fixed: the injunction arises only when the open contracting rules (c1) are in force, names them, and fires once. |
| D8 | Fixed: the tax debate needs the tax reform (t1) under way. |
| D9 | Fixed: the choice says it includes the petrol condition; when the subsidy is still in place the result says it ends and the usual subsidy beats follow. |
| D10, D11 | Wait on R3. |
| D12 | Fixed. All 26 headline warnings resolved one by one: public acts have real headlines, private ones a `quiet` reason (S2, contract 1.0.0). |
| D13 | Fixed for four pairs, one waiting. Harvest, championship and listing: each pair is mutually exclusive (whichever comes first tells it), and the shock's grain purchase now fills the same grain reserve that `tycoon.hoard` can release. Flood: one defence state. The seasonal flood stops once the defences reform (w4) is delivered or the great flood shock has happened, and the shock credits defences the government committed to in a seasonal flood. Blackout: the shock's file says it is not one of the ordinary collapses; and `grid.collapse` no longer fires while the blackout is active (S5). |
| D14 | In progress. Recurrence now carries a development, tied to what the player did last time, in `petrol.scarcity`, `elder.letter` (the second letter answers the visit, rebuttal or silence), `party.decamp` (a smaller second wave that remembers how the first was handled, with its own outcome), `uni.strike` (the sixth month, and what has been lost), `minor.independence` (the second broadcast is checked against the first) and `pred.speech`. The rest wait on R2 or follow in later commits. |

## Per-event verdicts

### Electricity

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `grid.collapse` | condition → escalation | Rebuild (R2) · Merge with `shock.blackout` | Good cause lines (gas debt, p1 delivered, Infrastructure Fund). The probe choice is a stock "panel". It recurs up to three times with the same body apart from one count line. | Electricity family: collapse → diagnosis (gas / transmission / tariff) → repair, with the corridor investment ending the old cause. |
| `shock.blackout` | escalation | Merge | Duplicates `grid.collapse` with two choices. The blame choice changes nothing. | Becomes the severe beat of the same episode. |
| `debt.gas` | condition | Revise · Rebuild (R2) | Cause-aware (p1 done, p3 missing). "Order them to supply" is a real option with an honest cost. It repeats four times unchanged. | Development lines by count; with p3 delivered the file must stop (it does, via the debt). |
| `tariff.power` | decision | Keep | Clear trade-off and an honest cost. The "independent by law" regulator line foreshadows plan 04. | Link to the institutions content once R10 lands. |
| `react.tariff` | decision | Keep | Follows from p3. Consequence lands on the minister. | Add a closing beat when refunds are working. |
| `minor.children` | decision (ceremonial) | Revise | Charming. Her question should depend on power state: no light in her school only while power is poor. | Condition the question on `nation.power`. |

### Fuel and subsidy

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `subsidy.memo` | decision | Keep · Revise | Strong opener. "Remove" and "remove and save" share a headline (`PRESIDENT ANNOUNCES ENERGY MARKET REFORMS`). | Distinct headline for the saving variant. |
| `subsidy.report` | decision (farce) | Keep | The committee joke earns its place once, because it follows the player's own choice of committee. | None. |
| `subsidy.pump` | escalation | Keep | Real choices with different reach (transfers depend on capacity). | Tie transfers to the citizens cast (R12). |
| `subsidy.ultimatum` | escalation | Keep | Good. The favour line hints at a use that no choice offers. | Add the favour use the text promises (R3) or remove the line. |
| `subsidy.strike` | escalation | Keep | Strong; the hold outcome depends on approval. | None. |
| `subsidy.phase2` | decision | Keep | | None. |
| `subsidy.dividend` | closing → decision | Keep | A success that creates a new decision, as the plan wants. | Show where each option's money goes (R7). |
| `subsidy.return` | escalation | Rebuild (R2) | Can recur twice. The second time it should say what changed (the landing cost is higher, the states more desperate). | Development lines. |
| `petrol.scarcity` | condition | Revise (D2) · Rebuild (R2) | Unverified competing claims ("neither statement has been verified") is good plan-08 material, but nothing lets the player verify. It repeats up to four times. | Reserve state (D2); an "inspect the depots" choice that resolves the claim (R8). |
| `react.freeze` | escalation | Keep | | None. |
| `tycoon.depots` | escalation | Revise | Good leverage scene. Repeats three times identically. | Development by count, and his reaction to the last outcome. |
| `minor.refinery` | escalation (farce) | Keep | One of the plan's protected chains. The amounts escalate correctly with `refpaid`. The goat reappears (also in `absurd.goat`). | Keep one goat. |
| `refinery.exposed` | decision | Keep | Protected chain; consequences are clear. | None. |
| `refinery.scandal` | closing | Keep | Good: the classified report is remembered. | None. |
| `minor.amangala` | decision | Keep | | None. |

### Universities, wages and labour

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `uni.ultimatum` | decision | Keep | Protected chain. "Further round of negotiations" is pure futility. | Give talks a genuine use: an honest timetable that buys a defined period (plan 07's "committees, talks and delay can have genuine uses"). |
| `uni.committee` | escalation (farce) | Keep | Funny once, and only follows the player's committee choice. | None. |
| `uni.tranche` | escalation | Keep | Reads the budget correctly. | None. |
| `uni.strike` | escalation | Revise | Can recur twice with the same body ("third month"). | The second occurrence must say fifth month and what has been lost. |
| `labour.me_too` | escalation | Keep | | None. |
| `wage.review` | decision | Revise | The `extend` choice sends the committee to a resort, a second committee joke in the family. | Make extension buy a real data exercise, with a cost. |
| `wage.states` | escalation | Keep | | None. |
| `doctors.strike` | decision | Revise | `part` says "in due course" and nothing returns to collect it. | Schedule the second half as a commitment (R4). Interim: a follow beat in three weeks. |
| `minor.labour` | decision | Keep | | None. |
| `react.labour_thanks` | closing | Keep | Exactly the closing report the plan wants. | Present as a closing report (R2 classification). |

### Treasury and debt

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `debt.crisis` | escalation | Revise (D4, D9) | Strong options. Two defects. | Fix both. |
| `debt.maturity` | decision | Revise (D6) | Good choices; currency mismatch. | Fix the headline now; currency once R7 lands. |
| `debt.contractors` | escalation | Keep | Notes versus cash is the right kind of trade-off. | Show the liability change (R7). |
| `debt.pensions` | escalation | Keep · Revise | Grave and honest. "Condole and order an inquiry" is the stock panel. | Let an inquiry produce something real (who is in the queue and why). |
| `downgrade` | decision | Keep | | None. |
| `lender.offer` | decision | Keep | Conditions read the reform state. | None. |
| `oil.shortfall` | condition | Rebuild (R2) | Repeats four times, identical. | Development by oil path and the budget's benchmark. |
| `fund.share` | condition | Rebuild (R2) | Repeats four times, identical. | The governors' argument should change with what was done last time. |
| `fund.raid` | decision | Keep | | None. |
| `react.print` | decision | Keep | | None. |
| `react.fin_surplus` | decision | Keep | | None. |
| `minor.cbn` | condition | Rebuild (R2, R7) | Repeats three times. "Bring forward cargo payments" is a real timing trade, which is good. | Reserve view (R7). |
| `minor.bdc` | condition | Keep | Repeats twice. | Second time: what the raid achieved. |
| `break.establishment` | escalation | Keep | | None. |
| `react.vat` | decision | Keep | | Tax track split (plan 10) will retarget it. |

### Procurement, contractors and industry

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `tempt.contractor` | decision | Keep | Clean temptation with the financier named. | Delivery of the corridor should follow from the chosen contractor (R7, plan 12). |
| `react.contracting` | decision | Keep | | None. |
| `collapse.building` | decision | Revise | "Prosecute" creates no case; "panel" ends in "not published". | Prosecution should open a case (the engine has `charge`). |
| `minor.birthday` | decision | Keep | | None. |
| `minor.cousin` | decision | Keep | | None. |
| `tycoon.hoard` | escalation | Keep | Releasing the reserve is state-aware. | Repetition development. |
| `tycoon.layoff` | escalation | Keep | | Workers as a recurring group (R12). |
| `react.duties` | decision | Keep | | None. |
| `inst.zone.factory` | closing → decision | Revise | A ribbon scene. It should create the next politics (plan 14: workers, credit, entry). | Rewrite as the first beat of the industrial history (acceptance history 1). |
| `inst.reserve.contract` | decision | Keep | | None. |
| `shock.factory` | decision | Keep | | Connect to the industrial family. |
| `fortune.startup` | decision | Merge with `shock.listing` | Same company, different valuation. | One family, one state. |
| `shock.listing` | decision | Merge | | |

### Cabinet performance

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `min.failing` | decision | Revise (D1) | "95% complete" is a stock device; the target is never checked. | D1, then a review that weighs resources withheld. |
| `min.star` | decision | Keep | | None. |
| `min.dirty` | decision | Keep | | None. |
| `min.resigns` | decision | Keep | | None. |
| `fin.gwarzo.books`, `fin.gwarzo.offer`, `fin.gwarzo.budget` | decision | Keep | A real arc with a capable minister and stated terms ("a free hand over the budget"), which is plan 03's exceptional-candidate pattern in miniature. `books` → `internal` has an empty headline (D12). | Use as the model for R5 conditions; make the terms enforceable. |
| `fin.ekpenyong.list`, `fin.ekpenyong.bailout`, `fin.ekpenyong.file` | decision | Keep | Empty headlines on two outcomes (D12). | |
| `fin.lohor.committee`, `fin.lohor.senate`, `fin.lohor.contract` | decision | Keep | `committee → agree` writes nothing down and has no consequence. | Make the understanding a stored commitment (R4). |
| `farce.interview` | decision | Keep | | None. |
| `cabinet.leak` | decision | Keep | | None. |
| `second.minister_runs` | decision | Keep | | None. |
| `break.villa` | escalation | Keep | | None. |

### Security (all six theatres)

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `attack.farms` (North Central) | escalation | Keep · Rebuild (R9) | Good: s2 changes the story. "Statement" is the stock condemnation. | Mission content (R9): command, supply, civilian cooperation. |
| `abduction` (North West) | escalation | Keep · Rebuild (R9) | Strong. No persistence: the three missing children never return as a thread. | The missing children as a story that closes. |
| `sec.oil` (South South) | condition | Revise (D3) | Good options. Repeats. | |
| `sec.sitathome` (South East) | condition | Keep · Rebuild (R2, R12) | Repeats three times identically. | Traders and households as recurring cast. |
| `sec.highway` (South West) | escalation | Keep | | Repetition development. |
| `sec.insurgency` (North East) | escalation | Keep · Rebuild (R9) | "Replace the theatre commander": the commander has no name. | Named commanders (plan 13). |
| `react.chiefs` | decision | Keep · Rebuild (R9) | | Named defence leadership. |
| `react.statepolice` | decision | Keep | | None. |
| `shock.border` | decision | Keep | | Military content. |
| `flood` | escalation | Merge with `shock.flood` | Two flood systems with different defence flags (`flood.defences` versus `agenda.w4`). | One family; one defence state. |
| `shock.flood` | escalation | Merge | | |
| `shock.drought`, `shock.outbreak` | decision | Keep | Read the relevant reforms (f5, e1). | Citizens (R12). |

### Coalition politics: party, Senate and governors

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `senate.screening` | decision | Rebuild (R5, R6) | The first file of every game. With the plan's selectable government it becomes part of the appointment flow. | Rewrite against the slate (R5). |
| `senate.fight` | decision | Revise (D8) | | |
| `elder.letter` | condition | Revise | The second letter is identical to the first. | Second letter answers what you did with the first. |
| `party.decamp` | escalation | Revise · Rebuild (R2) | Repeats with the same numbers ("eleven members"). | Numbers and names from state. |
| `opposition.unites` | decision | Keep | Outlook-aware. | Opposition programmes (plan 15). |
| `ticket.elders` | decision | Keep | | None. |
| `ticket.primary` | decision | Keep | | None. |
| `break.street` | escalation | Keep | | Citizens (R12). |
| `break.party` | escalation | Keep | | None. |
| `break.press` | escalation | Keep | | None. |
| `removal.notice`, `removal.vote` | escalation | Keep | `resign` has an empty headline (D12). | |
| `react.clean_party` | decision | Keep | A real political price for clean government. | Issue positions (R11). |
| `react.patronage` | decision | Keep | | None. |
| `react.payroll` | decision | Keep | | None. |
| `minor.governor_call` | decision | Rebuild (R3) | The road request is the cleanest example of a concrete request object. | Model case for R3. |
| `react.road_done` | closing | Keep | | Present as a closing report. |
| `minor.chair` | decision | Rebuild (R3) | | |
| `minor.radar` | decision | Keep | | |
| `minor.zango` | condition | Rebuild (R3) | | |
| `minor.trip`, `minor.honours` | decision | Keep | | None. |
| `absurd.mace` | decision (absurd) | Keep | | None. |
| `absurd.statue` | decision | Keep | Cast on a real governor. | None. |
| `budget.projects` | decision | Keep | | None. |
| `vp.camp`, `vp.ticket` | decision | Keep | `vp.ticket` points the player to a screen: good. | |

### Requests and favours

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `owe.tycoon` | decision | Rebuild (R3) · D10 | "Stall" grows the debt on a timer; "refuse" erases it. | Request object, closure, explicit settlement. |
| `owe.governor` | decision | Rebuild (R3) · D10 | Same. | Same. |
| `owe.decamp`, `owe.decamp.leaves` | escalation | Keep | A precise promise (a ministry) that is kept, stalled or broken. | Store as a commitment (R4). |
| `cast.call` | decision | Rebuild (R3) | "Not this year" leaves the request open forever. | Closure. |
| `promise.clash` | escalation | Keep · R3 | "Something else for each" settles both promises without either recipient agreeing. Plan 05 forbids substituting without agreement. | Substitution needs acceptance (R3). |
| `minor.clearair` | decision | Rebuild (R3) · D11 | | |
| `favour.offer` | decision | Keep | | None. |
| `tycoon.offer` | decision | Keep | | Bond purchases versus donations (plan 05, R7). |
| `tycoon.paper` | decision | Keep | | None. |
| `opp.woo` | escalation | Keep | | None. |

### Scandal and the drawer

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `minister.report`, `minister.sponsor`, `minister.outcome`, `minister.hearing` | chain | Keep | Strong chain with real branches. `outcome` → "procedural lapses" when fixed: good evidence handling. | Investigation content (R8). |
| `tempt.security_vote` | decision | Keep | | None. |
| `tempt.windfall` | decision | Keep | | None. |
| `exposure.comment` | escalation | Keep | | None. |
| `react.drawer_cos` | decision | Keep | | None. |
| `absurd.goat` | decision (absurd) | Keep | Second goat (see `minor.refinery`). | One of the two goats goes. |
| `absurd.feeding` | decision | Keep | | Mystery content (R8): the register is evidence. |
| `farce.wrong_account` | decision | Keep | | None. |
| `minor.convoy` | decision | Keep | | None. |
| `inst.graft.ally` | decision | Keep | Exactly plan 04's "institution investigates the founder's ally". | Acceptance history 8. |
| `inst.jobs.ghosts` | decision | Keep | | None. |
| `second.book` | decision | Keep | | None. |
| `second.tenure` | decision | Keep | | None. |

### Reforms under attack

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `reform.lobby`, `reform.governors`, `reform.repeal`, `reform.court` | escalation | Keep · Rebuild (R10, R11) | Cast-driven and varied. Court outcomes are loyalty-driven; plan 04 wants reasons. | Case reasoning (R10); negotiated amendments (R11). |

### Predecessor, handover and succession

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `pred.son`, `pred.audit`, `pred.state`, `pred.speech`, `pred.campaign` | decision | Keep | Personal and specific. `pred.speech` repeats twice unchanged. | Development on recurrence. |
| `inherit.matters` | decision | Keep | | Predecessor letters (plan 16). |
| `succession.choice`, `succession.fallout` | decision | Rebuild (R13) | Succession is a single choice at the end. Plan 16 wants it prepared during office. | Succession preparation content. |
| `second.promise`, `second.override` | decision | Keep | | None. |
| `handover.contracts`, `handover.notes`, `handover.concede` | decision | Keep | | Export/import and letters (R13). |
| `tribunal.petition`, `tribunal.ruling` | decision | Rebuild (R10) | Rulings are partly chance. Plan 04 wants reasons. | Case reasoning. |

### Ceremony, fortune and farce

| Event | Type | Verdict | Finding | Next |
|---|---|---|---|---|
| `minor.independence` | decision | Revise | Draft A and B are the same every year (`max: 2`). | The second year's drafts reflect the record. |
| `minor.title` | decision | Keep | | None. |
| `fortune.harvest` | decision | Merge with `shock.bumper` | | |
| `shock.bumper` | decision | Merge | | |
| `fortune.football` | decision | Merge with `shock.cup` | | |
| `shock.cup` | decision | Merge | | |
| `shock.crops`, `shock.remit`, `shock.discovery` | decision | Keep | | Economic content (R7). |
| `absurd.airline` | decision | Keep | Conflicts with the reform o4 (national airline by Act): if o4 is delivered, the "no aircraft" premise must change. | Condition on o4. |
| `absurd.clone` | decision | Keep | | None. |
| `farce.website` | decision | Keep | | None. |
| `farce.jet` | decision | Keep | "The national carrier does not have an aircraft" contradicts o4 if delivered. | Condition on o4. |
| `react.venture_won` | closing | Keep | | Present as a closing report. |
| `bet.trouble` | escalation | Keep · Rebuild (plan 12) | Varies by bet. | Partial outcomes and operations. |

## Coverage

All 180 event ids in the registry are named in the tables above (checked by script against `event-audit.json`). Fourteen confirmed defects are listed as D1 to D14. Repetition: 53 events can fire more than once; of these, the ones marked Rebuild (R2) or Revise for recurrence repeat their body without a material development and must gain one.

This document is updated in the same commit as each change it describes.
