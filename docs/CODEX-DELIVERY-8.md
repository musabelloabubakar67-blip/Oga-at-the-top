# Codex delivery 8: candidate identities and currency interventions

Baseline: Claude's 3f20eea, consumed by fast-forward. Branch: redesign/codex-systems. Contract DSL remains 1.0.0; public exports are additive.

## R5: named pool connected, contract still outstanding

All twenty authored candidates enter the persistent pool on first use. Sixteen ordinary candidates can be selected through existing minister, adviser, institution and asset-manager appointment offers, subject to the existing refusal checks. Fit, competence, integrity, loyalty and patrons use the existing engine arithmetic. Careers and field information survive saves and monthly refreshes. Generated candidates remain the background pool, including in older saves; the migration neither rerolls saved candidates nor advances the game RNG. Appointed generated candidates now remain in the pool rather than expiring while employed.

Named people bind to their canonical cand.* identity in governance records across offices. getCandidateView from engine/public returns detached dossiers without modifying the source save; it exposes displayed traits and hides a backed candidate's patron/reputation until checked. Existing candidatesFor, headsFor and poolFor automatically include named people whose authored roles match the vacancy, even beyond the usual shortlist cutoff.

The four exceptional candidates are present with their proposed capabilities and stated conditions, but the old appointment buttons refuse them with "Requires a negotiated appointment on the stated terms." This prevents silently accepting costly terms or advertising benefits with no engine effect. R5 is **not complete**: approach/acceptance state, costs, breach enforcement and capability effects remain immediate work. The three plain-excellence descriptions are authored proposals; current engine benefits come from their competence and existing role formulas, not new logistics or field-verification mechanics.

## S3: delivered

fundmove now validates its source, destination and fraction before making a transfer. State grants remain outside federal ownership and are recorded in GameState.fundTransfers, with administration era, month, source and amount; the history is copied independently into successor saves.

The one integration edit in Claude-owned content/shocks.ts changes shock.flight/defend from fundmove abroad -> states to abroad -> currency. No other content was changed.

A currency transfer auctions sovereign-fund dollars, using the existing fund convention (naira trillions) and the current exchange rate. At 1500 naira per dollar, 1.5 trillion naira corresponds to 1 billion dollars. The fund is debited, the auction is recorded with rate and both units, and the dollar supply enters the next currency tick once. It is excluded from reserve accumulation: a sale directly from the sovereign fund does not also deposit those dollars in CBN reserves or credit the spendable federal treasury. The outcome and preview describe the correct destination. Legacy transfers are not retroactively invented.

This closes the specific lost-transfer defect. The broader economy audit remains open: dollar-denominated fund valuation, central-bank versus sovereign-fund stocks, foreign debt valuation, fiscal flows and transactions still need the R7 design. Existing monthly currency formulas remain a simplified model, not a calibrated macroeconomic simulation.

## Validation

TypeScript passed. 25 contract checks passed, including legacy pool migration, canonical identity, appointment exclusivity, detached views, exceptional appointment gating, state-transfer inheritance, unit conversion, one-shot dollar flow, no reserve/treasury double credit, malformed-transfer atomicity, and the actual CHOOSE currency defence path. All four experience suites passed; content lint passed with zero warnings. Two simulated worlds completed eight chained presidencies without an engine exception. No browser verification was performed for this engine delivery.

## Relay to Claude

Fast-forward redesign/codex-systems. Use getCandidateView for candidate dossiers and the existing appointment selectors for ordinary candidates. Proposed exceptional capabilities must remain labelled proposals until the negotiated appointment contract is delivered. S3 requires no further content edit for shock.flight. R3, R4, the remainder of R5, R6 and S1 remain outstanding immediate work; the full redesign is not complete.
