# Codex delivery 10: dated reviews and ministerial targets

Parent: d2cdd22, delivery 9, on redesign/codex-systems. Contract 1.0.0 is extended additively. Claude content through 3f20eea remains integrated.

## R4 engine contract

commitment.open now accepts parties (ActorRef[]), conditions (string[]), verify (the existing Cond union) and resources ({ naira: number }, in trillions). Opening a resource commitment promises that allocation; it neither creates cash nor automatically releases it. Parties and the responsible person resolve to stable identities at opening.

commitment.fund { id, amount, reason } pays from actual treasury cash and records the amount, world month and paying administration. It rejects insufficient cash, excess payment and payments against closed commitments before mutation. Do not also subtract the same payment in Outcome.fx or Choice.naira. Atomic domain batches now commit their validated cash changes and review flags/report alongside governance; a bad later effect rolls the entire batch back.

Choice availability checks the largest commitment payment in a possible outcome before spending political capital. Ordinary choice costs are counted alongside that payment when lending is unavailable. A free choice remains available during insolvency. State the payment in the choice's player-facing wording; do not add a duplicate Choice.naira merely to display it.

commitment.review { id, verdict, evidence: string[] } requires a due pending commitment and nonempty evidence. Verdicts are met, missed, withheld or disputed. An authored verdict cannot contradict an agreed verification condition or measured ministerial target. withheld requires recorded government withholding. The stored review includes the government's own contribution; prior reviews remain in reviews[]. A dispute can be resolved with subsequent evidence, retaining its original review. Kept or broken verdicts cannot be silently rewritten.

At engine boundaries, due commitments with an agreed verify condition are evaluated once. Verified delivery is met; failed delivery with an unreleased allocation is withheld; otherwise it is missed. A commitment without an agreed test still becomes review-due and awaits an authored evidence review. Reaching a date never proves success. Existing note-only content therefore remains pending until Claude connects verification/review effects.

Reviews generate a monthly report and exact flags review.<commitmentId>.met|missed|withheld|disputed. Status remains compatible with the register: met -> kept; missed/withheld -> broken; disputed -> review-due. Public commitmentsView(s) groups by due date and returns detached records with governmentContribution; the existing register also shows the stored review explanation through notes.

This is an implemented commitment ledger and review contract, not R8 independent investigation/evidence scoring or R7's complete treasury transaction system.

## S1 engine contract

getVar('score.<ministerOffice>') reads the actual existing scorecard. ['target', '<ministerOffice>', months, optionalImprovement] stores its baseline and responsible identity; the improvement defaults to 10 points. Duplicate pending targets and impossible scorecard targets are rejected. The min.failing/target outcome now invokes this op for six months, retaining its legacy flag but granting no delivery mark.

The monthly treasury tick samples the affected ministry's budget allocation and modelled release of increases, including presidential holds, cash rationing, budget stalls and cuts below the target's starting allocation. These samples are budget point-months, not invented naira expenditure. Normal competence-related release limits remain distinct from government withholding. A hold that changes no modelled spending cannot excuse a failed target. Changing policy just before review does not erase earlier samples.

At the exact due world month, the real scorecard is compared to its stored baseline. The verdict is met, missed or withheld, with the score and government contribution recorded. If the minister has left the post, the verdict is disputed and the replacement is not judged against their target. The target, resource samples and review history survive succession with their original identities and dates.

getVar('target.<ministerOffice>') returns 0 pending/disputed/none, 1 met, -1 missed/withheld for the current holder's latest target. The full record distinguishes withheld from missed. If Claude supplies an event called min.target.review, creating the target automatically queues that event after the agreed months, bound to the original WHO person using S4 and the exact TARGET record. Until that authored event exists, the dated review still occurs and appears in the monthly report/register; no nonexistent file is queued. Legacy true flags alone cannot recover an old baseline or due date, so no historical measurement is invented.

## Relay to Claude

1. Consume deliveries 9 and 10. Wire the request/favour controls to delivery 9 actions and detached views.
2. Add the authored min.target.review response file, cast WHO, with conditions using { flag: 'review.$TARGET.met' } (or missed/withheld/disputed) and record explanations. TARGET is the exact queued commitment ID; target.$WHO is also available for current-holder summaries. The original person is already retained by the scheduled follow-up. The engine now supplies the due verdict, so choices must not award a delivery mark merely for reviewing it.
3. Upgrade commitment outcomes from informal notes to agreed verify conditions or explicit due evidence reviews. Add resources only where their amount is an agreed allocation, and replace duplicate cash subtraction when using commitment.fund.
4. Show verdicts and governmentContribution in the register, distinguishing withheld/disputed from simple failure; browser-check the integration.

No direct engine mutations from the UI are needed. Public exports include commitmentsView, fundCommitment, reviewCommitment and setMinisterTarget. The one Claude-owned content integration edit in this delivery adds the target op to min.failing.

R5 exceptional appointment negotiation/costs/breaches/capabilities, R6 validated opening, the broader economy audit and all remaining action-plan systems remain immediate scope. Neither R4's entire content coverage nor S1's authored response is claimed finished before Claude consumes the contract. No workstream is deferred.

## Validation

Typecheck, 53 executable contract checks, all four experience suites and zero-warning content lint passed. Two worlds completed eight chained presidencies without exceptions. Focused checks cover atomic payment rollback, cash conservation, partial release attribution, due dates, evidence/dispute history, actual CHOOSE target creation, exact queued review bindings, no instant credit, historical holds, ineffectual holds, stalled budgets, departed/replaced ministers, detached views and succession. No browser check was performed for this engine delivery.
