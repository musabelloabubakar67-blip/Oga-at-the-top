# Delivery 13: exceptional recruitment engine

Baseline: systems `1a6815b`, which includes Claude delivery 15. This is an additive
contract 1.0.0 delivery. Claude owns the recruitment/appointments interface; its
mock is not yet a working screen. R6 setup and the remaining immediate workstreams
are still open.

## Recruitment and appointments

`engine/public.ts` exports `AppointmentPost`, `Recruitment`, `canApproach`,
`canAppoint`, `getRecruitmentView`, `getCandidateView`, `proposedSlate`,
`hasCapability`, `canFundRecruitment`, `canLeaveVacant`, `getVacancyView` and
`canPayRecruitmentArrears`. Views and availability checks do not mutate the game
or consume its random generator.

Posts are `{kind:'finance'}` or
`{kind:'minister'|'adviser'|'institution'|'asset', id:string}`. Use authored candidate
roles to present suitable posts. Electricity asset expertise applies to existing
`nuclear` and `export_power` assets, not arbitrary public companies.

Example, using `dispatch` as the application's existing action dispatcher:

```ts
const id = 'cand.nwachukwu';
const post = { kind: 'finance' } as const;
const acceptedTerms = ['cond.refuse_unfunded', 'cond.debt_team'];
// Read canApproach(state, id, post, acceptedTerms, movesLeft(state)) first.
dispatch({ type: 'APPROACH_CANDIDATE', id, post, acceptedTerms });
// Agreement reserves terms for this exact post; it does not appoint the person.
// Read canAppoint(state, id, post, movesLeft(state)) on the updated state.
dispatch({ type: 'APPOINT', id, post });
```

An approach costs one move and two political capital. Omitting a demanded term
produces a recorded refusal with the unmet terms. The identical declined offer
cannot be repeated; changing terms or post permits a new approach. Agreement,
appointment, suspension, resignation and departure are distinct stored states.
An appointment rechecks treasury cash, the government's corruption record and
protected allocation. Legacy appointment actions and lower-level appointment
helpers also enforce the agreement, so they cannot bypass its terms. Ordinary
named candidates retain their existing appointment costs and conditions.

`APPOINT` delegates to the existing Finance, minister, adviser, institution or
asset appointment route: one appointment move, existing political cost and agency
establishment cost where applicable. The first team payment is charged once on
activation. There is no capability while an offer is merely agreed.

`proposedSlate(state)` supplies eight proposed opening offices, named alternatives,
negotiation requirements and explicit zone-balance constraints. It uses the files'
shown ratings and applies no appointments or effects. It is an input to R6, not
a replacement for the still-pending validated setup.

`LEAVE_VACANT` takes a post, one move and two political capital. Career staff
continue without an appointed head; officeholder ratings are zero, personal
capabilities end and the canonical office has no occupant. Power and Defence
minister identities now also remain consistent with their linked adviser slots.
Filling the post removes its vacancy marker. Vacancy controls await Claude's UI.

## Costs and breached terms

Nwachukwu's specialist team costs 0.004 trillion naira per year; Chukwuma's costs
0.005. Twelve exact monthly payments equal the annual amount. These debit actual
treasury cash and have a payroll journal; no invented budget points are converted
into money. The first month is paid on appointment, then once per world month.

`HOLD_RECRUITMENT` takes a candidate ID and holds future team payroll. Missed
payments accumulate as government obligations. Nwachukwu's capability lapses on
the first miss, Chukwuma's after three consecutive misses. Both remain in post and
the funding lapse is publicly reported. `FUND_RECRUITMENT` takes a candidate ID,
pays the full recorded arrears and restores the current team's capability.

Replacement, vacancy, resignation or administration change stops future charges,
but preserves unpaid payroll. `PAY_RECRUITMENT_ARREARS` takes the recruitment
**record ID**, plus an optional partial `amount` in trillion naira. A successor can
pay it. Payment never reinstates an old appointment. Payroll arrears are a separate
obligation ledger exposed in the recruitment view, not contractor debt silently
added to or cleared by the existing contractor payment action.

Accepted political terms are enforced after actual actions:

- Overruling the Finance Minister's written unfunded-budget refusal makes
  Nwachukwu resign with a published letter; establishment and banker standing fall.
- A newly granted political electricity appointment makes Chukwuma resign and
  identify that appointment publicly. Pre-appointment grants are not retroactive
  breaches.
- Villa case interference or a midyear anti-graft funding cut makes Udeagha resign,
  publish the interference and leave a lasting prosecution-trust penalty. Annual
  budgets reset the agency funding baseline; ministerial Justice has no separate
  invented agency budget.
- Cutting health and schools below Adeyemo's agreed allocation makes the mediator
  resign before the union and triggers a broken settlement/strike follow-up.

An acting head replaces a resigned officeholder. A person who resigned over breach
will not return to the same administration. A successor must negotiate anew;
inherited institutions do not silently convey a personal capability.

## Four active capabilities

The public conditions `cap.debt_restructuring`, `cap.grid_diagnostics`,
`cap.complex_prosecution` and `cap.university_settlement` read as 1 only while
the contracted person actually holds the agreed post with an active team.

| Capability | Engine behaviour |
|---|---|
| Debt | Extra debt-crisis exchange reduces domestic and foreign bond coupons by 18%, with a 55% original-coupon floor and a 0.12tn execution fee. Refinancing a 1.5tn maturity costs 0.06tn and lowers only that redeemed share's coupon by 8%. Principal stays owed; neither records a default. Signed terms survive departure/succession. |
| Grid | Collapse/blackout files diagnose gas, transmission or collection/dispatch and offer a matching funded remedy. Gas invoices are paid exactly once; transmission costs 0.18tn and collection/dispatch 0.06tn. Active expertise accelerates the ongoing `p2` corridor reform by 30%. |
| Prosecution | Conviction odds gain 15 percentage points within the existing 90% ceiling, trial duration falls by 30% within the four-month minimum, and a powerful accused fleeing enables one recovery of a quarter of that case's recorded recoverable assets. Remaining assets are not also credited. |
| Universities | A protected-budget settlement costs 0.225tn: 0.075tn now and a public 0.15tn commitment due in twelve months. Its follow-up pays the balance once or records withholding and a renewed strike notice. |

Extra choices are materialised without changing source content or RNG. Losing the
capability removes the extra options; ordinary options retain their existing
behaviour. Debt portfolio terms are represented as weighted coupon factors, not
as deleted principal. These additions do not complete the broader economy audit.

Surgical content addition: `uni.negotiated.balance` in `content/events/labour.ts`.
The engine queues it; the content linter recognises that source. Claude may polish
its prose, retaining the commitment payment/review mechanics and amounts. The
existing `min.target.review` linter exception is retained.

## Validation and handoff

Type-check, 83 contract checks, all ten experience suites and content lint pass
(191 events, zero warnings). Two simulated worlds complete eight chained
presidencies. Focused checks cover actual reducer appointments/choices, exact team
payments, post mismatch, funding lapses, resignation, linked identity/vacancy,
partial inherited-arrears payments, principal conservation, bounded recovery and
one-shot university balance payments. This is engine verification; no new browser
check or recruitment UI delivery is claimed.

Claude can now replace the R5 recruitment mock with these actions and detached
views, show annual/monthly costs and outstanding payroll, surface breach history,
and provide the explicit vacancy choice. R6 setup is the next Codex contract.
R2 and R7-R14 remain immediate assigned work, including military, citizens,
tax/treasury separation, emergency asset sales, economy and meaningful succession.
