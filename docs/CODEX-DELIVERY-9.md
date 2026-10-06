# Codex delivery 9: requests and personal favour balances

Parent: 7423828 on redesign/codex-systems. Claude content through 3f20eea remains integrated. Contract 1.0.0 is extended additively.

## R3 engine delivery

Person requests are stored at engine boundaries with the exact proposal, cost and stable requester identity. The existing PERSON/refuse action closes that record, leaves underlying debts intact and stops that unchanged request returning. A later ambition can generate a different ask. Two refusals no longer manufacture a permanent grudge. Existing grievances remain meaningful. A replacement or new administration withdraws the former occupant's open person request.

Public API: openRequest, closeRequest, substituteRequest, RequestSpec. A closed request can return only with previous and changedBy (offer, appeal, threat, coalition or evidence), plus a changed object, text or terms. An identical proposal with reordered cost fields is still identical. Rejected substitutes leave the original open; accepted substitutes close it as substituted and record the history. The record does not itself pay costs or deliver the alternative: authored outcomes must apply the agreed effects. request.substitute is also supported in the atomic domain DSL.

Favours now retain their original counterpart and President, rather than attaching personal debts to whichever person occupies an office. Old balances and settlement history survive succession as historical claims; the successor cannot spend them. Legacy saves bind existing live balances once; missing former-holder history cannot be reconstructed.

Public API: getFavourView, usesFor, canUseFavour, canOffsetFavours, canForgiveFavour. Views detach balances/history; currentParties tells the UI whether the current occupants hold that debt. Settlement entries retain units, remaining strength, mode, world date, administration and paired ID. Nonzero residuals retain their original IDs.

Actions:

- FAVOUR { id, use, units?, target? }: consumes validated strength and one move. Existing services plus local mediation, legislative oversight and withdrawal of a specified open request. Role, relationship, allowed uses, active projects, crisis and target eligibility are checked before spending anything. Silence and request withdrawal each spend one unit; other services default to the full remaining strength.
- SETTLE_FAVOURS { ids: [number, number], units? }: equal offsets only for opposite debts between the same two actual people. Defaults to the smaller balance. Bookkeeping is free and creates no cash or political capital.
- FORGIVE_FAVOUR { id, units? }: forgives a claim owed to the current President, retaining any residual. It cannot forgive money the President owes.

Written decisions journal credit consumption. void spends one credit owed by that person and leaves debts in the other direction intact. spendall excludes former Presidents' claims. repudiate refuses a repayment demand without deleting its underlying debt; unchanged demands stop recurring. A stronger subsequent demand carries a changed-terms link. Tycoon grants offset only the credit earned, preserving residual balances. A businessman buying government bonds now creates matching bond principal instead of free treasury cash.

Want promises bind to the exact request: granting a later unrelated ask cannot fulfil the earlier promise.

## Surgical Claude-owned integration edits

Four repayment-refusal outcomes in content/events/system.ts use repudiate rather than settle. ui/Register.tsx labels substituted and lapsed requests. Two assertions in tests/experience/records.check.ts select the Appropriations request by ID rather than array position now that the register includes person requests. No new interaction layout was authored.

## Validation and relay

Typecheck and 38 contract checks passed. All four experience suites passed; content lint has zero warnings. Two worlds completed eight chained presidencies without exceptions. No browser check was performed for these engine changes.

Claude can now wire the request histories and favour controls to these actions; R3's player interface still needs that integration and browser verification. Keep exceptional candidate terms labelled as proposals until R5 is delivered. R4/S1, the remainder of R5, R6, the economy audit and the other action-plan systems remain immediate scope. This delivery does not complete the redesign.
