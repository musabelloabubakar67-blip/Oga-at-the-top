 in progress | Refinery and university chains audited and kept; second strike beat now says what was lost |in progress | Fuel reserve (D2), double metering (D3), lender programme and subsidy (D9), invented order and bill (D7, D8) fixed on the branch |in progress | STORY-FAMILIES.md specifies each family; episode contract R2 pending |in progress | STORY-FAMILIES.md: 12 families mapped to every event |authored | EVENT-AUDIT.md: all 180 events individually, 14 confirmed defects |# Experience coverage checklist

One row per bullet in the master action plan (sections 01 to 18). IDs are section.A (action) or section.T (acceptance test) and a running number within the section. Status starts at planned; it moves to authored, integrated or verified only with a commit and evidence. Engine-only bullets are listed so nothing is unassigned; their content and interface share is still mine.

Baseline `4227861`. Contract v0.

| ID | Requirement | Owner note | Status | Evidence |
|---|---|---|---|---|
| 01.A1 | Establish durable identities for people, institutions, assets, agreements and episodes. Office and individual identity must be separate. |  | planned | |
| 01.A2 | Introduce a world calendar that continues across presidencies, with presidency-relative dates for term mechanics. Migrate existing founding dates, deadlines and durations correctly. |  | planned | |
| 01.A3 | Fix inherited institutions producing negative performance after turn resets. |  | planned | |
| 01.A4 | Preserve repeal state, selected policy approaches, active cases, deferred effects, unfinished projects, contracts and financial obligations through succession. |  | planned | |
| 01.A5 | Attribute adviser records to actual individuals, not the office they occupy. A replacement starts their own forecasting record. |  | planned | |
| 01.A6 | Evaluate forecasts when their stated observation horizon arrives, against realised outcomes. Never score future scheduled effects as already achieved. |  | planned | |
| 01.A7 | Replace narrative assertions derived from unrelated gauges with specific evidence or appropriately attributed allegations. The identity-data repair must not invent a sale of data from generic scandal heat. |  | planned | |
| 01.A8 | Preserve nonfinancial misconduct in investigations, archives and endings. A protected or celebrated retirement may coexist with a documented record of abuse. |  | planned | |
| 01.A9 | Reconcile inconsistent monetary units, double counting, missing liabilities and derived gauges with their underlying accounts. |  | planned | |
| 01.T10 | A three-government history preserves functioning institutions, repealed policies, live cases, commitments and currency exposures without calendar corruption. | joint | planned | |
| 01.T11 | Replacing an adviser does not transfer their accuracy record. Delayed predictions remain pending until observable. | joint | planned | |
| 01.T12 | Endings distinguish reputation, legal exposure, personal wealth and documented misconduct. | joint | planned | |
| 02.A1 | Replace the overloaded certificate form with a transition experience: country dossier, identity/background, route to power, mandate, completed certificate, oath, private briefing and first exercise of power. |  | planned | |
| 02.A2 | Keep all existing inheritances, with the outgoing government's claims, verified conditions, unresolved obligations, a worthwhile functioning asset and named holders of leverage. |  | in progress | content/dossiers.ts (six dossiers) and their starting assets, declared on each scenario and running from month one (S6, 97c12ff); dossiers.check.ts verifies figures and assets against newGame. Dossier screens wait on R6. |
| 02.A3 | Separate professional background from electoral coalition and financing. Include establishment, broad coalition, mobilisation and continuity routes, with differentiated commitments and support. |  | authored, not integrated | content/routes.ts: four routes (party machine, broad coalition, movement, heir), each with how it won, strengths, costs, proposed effects, favours owed and a stored expectation; the heir is open only where there is a government to continue. Background kept separate. Waits on R6. |
| 02.A4 | Make the financier a deliberate choice or a clearly explained consequence. Include small-contributor support with its own strengths and costs. |  | authored, not integrated | content/routes.ts: the financier is a choice among the five businessmen (terms quoted from their standing demand) or small contributors (no favour; a public commitment to publish the accounts). tests/experience/routes.check.ts. Waits on R6; parameters to agree with Codex. |
| 02.A5 | Give party identity political substance through programme, constituencies and coalition agreements rather than editable names alone. |  | planned | |
| 02.A6 | Retain the four-point mandate, expressed as understandable public outcomes. Show relevant reform approaches and optional detail without requiring the player to understand seventeen tracks first. |  | planned | |
| 02.A7 | Allow an optional explicit governing constraint, such as protecting investigations or ruling out a particular financing approach. Store it as a commitment. |  | planned | |
| 02.A8 | Present the certificate as a completed ceremonial instrument with validated identity, home state, party, world year and unique historical reference. Resolve inconsistent oath/certificate ordering and silent identity defaults. |  | planned | |
| 02.A9 | Improve typography, spacing, fictional seal and document composition. Move policy configuration and biographies into appropriate documents. |  | planned | |
| 02.A10 | Show starting effects accurately, including which choices survive scenario and inheritance application. |  | planned | |
| 02.A11 | Provide a compact route for experienced players through the same meaningful choices. |  | planned | |
| 02.T12 | Every inheritance has a complete opening. The Reformer’s Handover is a required detailed acceptance scenario, not a limit on implementation. | joint | planned | |
| 02.T13 | A new player makes informed commitments and sees their first consequences without studying the complete reform catalogue. | joint | planned | |
| 02.T14 | No consequential choice is silently selected or overwritten without explanation. | joint | planned | |
| 03.A1 | Let the President appoint the initial government from a proposed slate that can be accepted, altered or left partly vacant. |  | planned | |
| 03.A2 | Choose the running mate at the appropriate electoral point; select Chief of Staff, Finance, major ministers and available institutional appointments directly. |  | planned | |
| 03.A3 | Contextualise the first Finance appointment through a real payment, conflicting information and political expectations. |  | planned | |
| 03.A4 | Let coalition agreements constrain appointments through visible negotiations, not invisible forced choices. |  | planned | |
| 03.A5 | Build a shared pool of named candidates with careers, expertise, relationships, previous decisions and role-specific suitability. |  | in progress | content/candidates.ts: twenty named candidates with careers, fields, suitable roles, views and patrons; candidates.check.ts. Waits on R5.  Integrated by Codex (7423828); interface: ui/Talent.tsx dossiers via getCandidateView and named notes in each post's list, browser-checked. |
| 03.A6 | Make candidates recruitable, unavailable, retained, dismissed, promoted or recruited by successors and opponents. Develop deputies into credible future candidates. |  | planned | |
| 03.A7 | Implement exceptional candidates with distinctive capabilities and explicit acceptance conditions: authority, independence, protected funding, specialist teams, recruitment effort or political concessions. |  | authored, not integrated | Four exceptional candidates with proposed capabilities, conditions and breach reactions (content/candidates.ts). Waits on R5. |
| 03.A8 | Include excellent candidates without compulsory hidden disasters. Brilliance still depends on resources and organisational support. |  | authored, not integrated | Three excellent candidates with no conditions beyond the job's resources (Tamuno, Danladi, Ajala). |
| 03.A9 | Remove automatic reliance on generic loyalist/technocrat/party replacement categories as the full depth of recruitment. |  | planned | |
| 03.T10 | Two governments appointing different teams encounter different delivery, advice and political consequences. | joint | planned | |
| 03.T11 | Exceptional recruits change available capabilities, not just ratings. Their conditions persist and breaches have concrete reactions. | joint | planned | |
| 03.T12 | Records and favours follow the relevant person rather than silently attaching to a replacement officeholder. | joint | planned | |
| 04.A1 | Give institutions mandates, legal powers, staff, funding, organisational culture, independence and oversight arrangements. |  | planned | |
| 04.A2 | Model independent action: investigations of allies, publication of unwelcome statistics, refusal to certify unfinished work or regulatory rejection of unsuitable projects. |  | planned | |
| 04.A3 | Support competent, timid, doctrinaire, industry-captured and procedurally slow institutions. Independence is not an automatic virtue score. |  | planned | |
| 04.A4 | Let strong leaders develop routines and successors that survive their departure. |  | planned | |
| 04.A5 | Define which presidential actions are executive orders, legislative matters, federal bargains or decisions of independent bodies. |  | planned | |
| 04.A6 | Implement entrenchment and constitutional provisions as persistent rules governing authority and successor constraints. |  | planned | |
| 04.A7 | Give judges legal philosophy, procedural standards, administrative ability, integrity and pressure responses. Cases consider authority, evidence, precedent and procedure rather than treating independence as opposition. |  | planned | |
| 04.A8 | Respect vacancies and the game's constitutional appointment processes; avoid wholesale presidential replacement of every court. |  | planned | |
| 04.T9 | A capable independent institution can help the country and constrain its founder in the same campaign. | joint | planned | |
| 04.T10 | A constitutional change alters future legal or governing behaviour. A court outcome explains its reasoning and relevant evidence. | joint | planned | |
| 05.A1 | Store persistent requests with a specific object, requester, status, terms and history. Separate underlying ambitions from individual requests. |  | in progress | First authored requests with object, requester and response (road, Appropriations understanding); records.check.ts. Old want loop still active (R3). |
| 05.A2 | Refusal closes the request. Renewed pressure requires a changed offer, appeal, threat, coalition move or other material development. |  | in progress | Authored requests close on refusal with a stated response; renewal on material change waits on R3. |
| 05.A3 | Differentiate responses by motive, personality, leverage, legitimacy and explanation. Do not create a universal grudge from two unrelated refusals. |  | planned | |
| 05.A4 | Replace time-window rotation as the principal model of unresolved requests. |  | planned | |
| 05.A5 | Preserve promise objects. An unrelated concession must not fulfil a promise; substitutions require recipient agreement. |  | in progress | Promises stored as commitments with precise text (Dandume ministry, elders' terms, Gwarzo terms); later files note them by original id. |
| 05.A6 | Reconcile bilateral favours through explicit offset, partial settlement, forgiveness or negotiated replacement. Track remaining size and terms consistently for politicians and tycoons. |  | planned | |
| 05.A7 | Add contextual uses: withdraw a demand, broker contact, amend a provision, deliver an agreement, supply actual evidence, release a partner from a term, secure project support and forgive an obligation. |  | planned | |
| 05.A8 | Retain existing mobilisation, whipping, acceleration, money, investment, coverage, endorsement and witness-related uses where appropriate. |  | planned | |
| 05.A9 | Match assistance to actual influence and capability. Reject or explain uses that cannot produce an effect, such as accelerating an empty ministry brief. |  | planned | |
| 05.A10 | Represent bond purchases as financing with liabilities, distinct from donations and private investment. |  | planned | |
| 05.A11 | Make reconciliation address the dispute rather than automatically erasing all grievances after any grant. |  | planned | |
| 05.T12 | A refused request cannot return unchanged as an unresolved ask. | joint | planned | |
| 05.T13 | Mutual debts can settle partly or fully, with a traceable residual. Favour support has an identifiable target and effect. | joint | planned | |
| 05.T14 | Precise commitments remain precise through grants, replacements, succession and negotiations. | joint | in progress | Commitments survive succession and are re-openable per administration (records.check.ts); grants and replacements wait on R3/R5. |
| 06.A1 | Give political actors positions on particular issues, with projects they pursue. General relationship warmth does not determine every position. |  | planned | |
| 06.A2 | Turn pacts into coordinated demands and delivery commitments with a shared objective. |  | planned | |
| 06.A3 | Negotiate legislation through provisions, implementation dates, geography, revenue distribution, oversight and appointments. |  | planned | |
| 06.A4 | Preserve concessions in the resulting agreement and implementation; passing a law begins delivery of its settlement. |  | planned | |
| 06.A5 | Delegate objectives, budget, authority, limits and reporting standards to ministers. Routine work proceeds without repeated presidential clicks. |  | planned | |
| 06.A6 | Escalate exceptions, missed targets, funding disputes and breaches. Evaluate written ministerial targets on their actual deadline, including the government’s contribution to failure. |  | planned | |
| 06.A7 | Build a unified commitments register for public promises, political settlements, targets, contracts, deadlines and financial obligations. |  | in progress | ui/Register.tsx: register page reading getGovernanceView (open commitments by due date, due-for-review with honest empty judgement, requests and answers, settled records, in-person promises, inherited records labelled); nav badge counts reviews due. Browser-checked at desktop and 375px. Kept/broken judgement waits on R4. |
| 06.T8 | A major bill passes through negotiation and produces enforceable obligations plus differentiated later reactions. | joint | planned | |
| 06.T9 | A six-month target creates an actual review with outcomes for delivery, failure, withheld funding or disputed evidence. | joint | planned | |
| 07.A1 | Audit every event, choice, outcome, recurrence and headline on the authoritative build. Historical inventory counts are not a cap or current truth. |  | planned | |
| 07.A2 | Organise electricity, fuel, universities, wages, procurement, industry, cabinet performance, security, coalition politics and succession into developing story families. |  | planned | |
| 07.A3 | Specify condition, episode, intervention, response, next development and exit for each family. |  | planned | |
| 07.A4 | Make repetition controls aware of interaction type, person, request, episode and recent experience, not just file ID. |  | planned | |
| 07.A5 | Review queued-event cooldown exceptions. Allow intentional scheduled beats while preventing accidental spam and duplicate unresolved episodes. |  | planned | |
| 07.A6 | Separate new decisions, progress updates, persistent conditions and closing reports in presentation. |  | planned | |
| 07.A7 | Audit verbs including investigate, prosecute, appoint, negotiate, implement and monitor. Deliver the promised mechanics or describe the action accurately as limited. |  | planned | |
| 07.A8 | Fix resource and history contradictions: depleted fuel reserves, dismissed people, completed reforms, settled disputes, committed funds and ongoing cases. |  | planned | |
| 07.A9 | Make debt crises, procurement disputes and project warnings evolve through changed participants, credibility, bargaining positions and options. |  | planned | |
| 07.A10 | Preserve stronger refinery and university chains, checking their assertions against actual state. Refresh repeated committee, denial, completion-percentage and ribbon-cutting jokes through specific mechanisms. |  | planned | |
| 07.A11 | Ensure competent advice does not automatically reveal the only sensible choice. Committees, talks and delay can have genuine uses with specific costs. |  | planned | |
| 07.T12 | Long campaign traces include closure and quiet progress, not constant equivalent interruptions. | joint | planned | |
| 07.T13 | Every recurring family has meaningful development and a resolution or transformation condition. | joint | planned | |
| 07.T14 | Solved problems stop demanding the same decision; their descendants acknowledge the achievement. | joint | planned | |
| 08.A1 | Give reports source, date, confidence, incentives and scope. Spending records, delivery claims and field findings answer different questions. |  | planned | |
| 08.A2 | Let investigations consume time and access, with opportunities to delay action, expose allies or contradict public announcements. |  | planned | |
| 08.A3 | Build authored mysteries around shortages, obstruction, delivery claims and patronage; retain deterministic resolution. |  | planned | |
| 08.A4 | Record what was known when deciding, what was forecast and what later occurred. |  | planned | |
| 08.A5 | Keep numeric effects inspectable, with uncertainty clearly attributed. Never replace explanation with hidden arbitrary punishment. |  | planned | |
| 08.T6 | A player can reach different defensible conclusions from incomplete evidence and later trace why an assessment proved right or wrong. | joint | planned | |
| 09.A1 | Separate treasury cash, fiscal revenue/expenditure, private economic activity, external dollar flows and central-bank reserves. |  | planned | |
| 09.A2 | Label gross flows and baseline deviations correctly. Oil exports cannot become negative merely because earnings fall below a reference level. |  | planned | |
| 09.A3 | Separate domestic fiscal diversification from foreign-exchange earnings. Tax collection does not itself produce exports. |  | planned | |
| 09.A4 | Track reserves through explicit purchases, sales, official receipts, payments and valuation effects; avoid unexplained automatic allocation of private inflows. |  | planned | |
| 09.A5 | Show usable reserves, external financing pressure and intervention. Model reserve constraints under managed rates as well as pegs. |  | planned | |
| 09.A6 | Allow floating pressure to work through prices without mandatory reserve depletion, while explicitly accounting for any intervention or accumulation. |  | planned | |
| 09.A7 | Connect reserve adequacy to external obligations and confidence through clear mechanisms, not a universal high-reserves-equals-strong-currency bonus. |  | planned | |
| 09.A8 | Store foreign borrowing and principal exposure in their currency. Convert stock valuations and payments consistently; prevent derived debt recalculation erasing depreciation effects. |  | planned | |
| 09.A9 | Distinguish contractual rates, refinancing costs, inflation and exchange-rate valuation. Calculate service burden against actual revenue. |  | planned | |
| 09.A10 | Record diaspora bonds and other financing as liabilities with currency, terms and payment schedules. Verify announced proceeds against conversions. |  | planned | |
| 09.A11 | Give the foreign investment fund actual currency exposure, investment returns and valuation changes. Distinguish sovereign investments from readily usable reserves. |  | planned | |
| 09.A12 | Audit central-bank lending, securitisation and inflation effects. Do not imply that changing a debt label alone extinguishes created liquidity without a mechanism. |  | planned | |
| 09.A13 | Audit all deficits, arrears, savings, repayments and funds for conservation and double counting. Explain debt-service costs versus principal repayments. |  | planned | |
| 09.A14 | Audit fiscal federal transfers, oil benchmarks, subsidy pricing, import costs, debt thresholds and spending multipliers for economic meaning and gameplay. |  | planned | |
| 09.T15 | Every cash receipt has a source; financing creates its corresponding obligation; disposal removes its corresponding ownership. | joint | planned | |
| 09.T16 | Depreciation effects persist in foreign obligations. Changes in actual revenue affect service ratios. | joint | planned | |
| 09.T17 | Tax reform, export growth and reserve accumulation can occur separately and connect only through explicit mechanisms. | joint | planned | |
| 10.A1 | Split the combined track into a taxation track covering who pays and how collection works, and a treasury track covering budgeting, spending, borrowing, saving and accountability. |  | planned | |
| 10.A2 | Reassign existing reforms deliberately: exemptions and collection under tax; remittance, public accounts, debt and expenditure controls under treasury. |  | planned | |
| 10.A3 | Add meaningful alternatives on consumption, income/property, incentives, informal-business regimes, wealthy noncompliance, rates versus collection and central versus coordinated administration. |  | planned | |
| 10.A4 | Make tax incidence, compliance, administrative cost and affected constituencies matter alongside revenue. |  | planned | |
| 10.A5 | Treasury success delivers predictable releases, credible budgets, fewer arrears, transparent procurement and manageable financing. |  | planned | |
| 10.A6 | Update mandates, prerequisites, ministerial responsibility, descriptions, balance scripts and migration for the split. |  | planned | |
| 10.T7 | Strong collection with weak spending, and disciplined spending with a narrow tax base, are distinct playable conditions. | joint | planned | |
| 11.A1 | Build an asset and ownership register covering disposable property, equipment, enterprise stakes and revenue rights, with valuation, use, encumbrances and income. |  | planned | |
| 11.A2 | Add a treasury emergency-funds view showing net proceeds, timing, conditions, costs and future obligations. |  | planned | |
| 11.A3 | Support surplus auctions, minority-stake sales, privatisation, leases/concessions, established tax-debt collection, stolen-fund recovery, savings withdrawals, emergency borrowing and expenditure reductions/deferrals. |  | planned | |
| 11.A4 | Distinguish orderly auctions, expedited competitive disposal and negotiated sales. Use bidders, reserve prices, diligence and payment completion; clean fair-price transactions must be possible. |  | planned | |
| 11.A5 | Remove sold ownership and future income. Prevent duplicate sales, disposal of already pledged interests and invented free assets. |  | planned | |
| 11.A6 | Treat essential services, occupied property and strategic assets differently from genuinely surplus holdings. |  | planned | |
| 11.A7 | Let proceeds arrive on actual schedules. A valuation or announcement is not immediately spendable cash. |  | planned | |
| 11.A8 | Track deferred contractual payments as obligations where appropriate. Repeated disposals leave a poorer balance sheet for successors. |  | planned | |
| 11.T9 | A salary crisis can be resolved through a combination of timed measures with lasting, visible trade-offs. | joint | planned | |
| 12.A1 | Audit every big bet's promised output, costs, financing, prerequisites, failure causes, success effects and operating asset. |  | planned | |
| 12.A2 | Replace generic full-success/full-failure resolution where inappropriate with commissioning, partial operation, delays, scale changes and genuine failure. |  | planned | |
| 12.A3 | Separate essential operating conditions, cost/speed/scale factors, political acceptance and external uncertainty. |  | planned | |
| 12.A4 | Preserve warnings, partners, delay, rescue, revival and expansion, but connect interventions to the actual constraint they address. |  | planned | |
| 12.A5 | Connect refinery throughput to petrol imports and feedstock; steel/lithium to downstream capability; electricity exports to dollar contracts and domestic supply obligations; corridors to market access; gold purchases to valued reserve assets; healthcare to treatment access and avoided overseas spending. |  | planned | |
| 12.A6 | Give the constitution actual negotiated rules, diaspora finance actual debt and voting changes, census actual allocation consequences, and other victories their distinctive mechanism. |  | planned | |
| 12.A7 | Correct rail financing and all other narrative/unit mismatches. |  | planned | |
| 12.A8 | Replace decorative production records with observed quantities driving relevant outcomes. Management, maintenance, security and demand affect continuing performance. |  | planned | |
| 12.A9 | Reward achievement through capabilities, resolved constraints, beneficiaries, new opportunities and enduring recognition, alongside balanced numerical effects. |  | planned | |
| 12.T10 | Each bet demonstrably changes a specific system beyond generic bonuses. | joint | planned | |
| 12.T11 | Successful assets can operate, degrade, recover and be inherited. Partial delivery remains useful and historically distinguishable. | joint | planned | |
| 13.A1 | Separate military capability from national security outcomes. Track readiness, personnel, command/intelligence and conduct through readable diagnostics. |  | planned | |
| 13.A2 | Add named defence leadership, operational commanders and logistics expertise with differing professional positions and political ties. |  | authored, not integrated | content/military.ts: thirteen named officers (defence leadership, intelligence, logistics, procurement, a commander per theatre) with doctrines that disagree, political ties, needs with dollar shares, unresolved records; military.check.ts. Waits on R9. |
| 13.A3 | Choose mission objectives, priority theatres, resources, conduct limits and success evidence; delegate operational execution. |  | authored, not integrated | content/military.ts MISSIONS: eight drafts across all six theatres with objectives, conduct limits, verifiable evidence and what must follow. Waits on R9. |
| 13.A4 | Connect pay, supplies, procurement, maintenance and dollar-dependent spare parts to actual accounts and readiness. |  | planned | |
| 13.A5 | Model local cooperation, civilian harm, intelligence and displacement. Tactical gains need not produce lasting security. |  | planned | |
| 13.A6 | Add procurement investigations, command disputes, appointments, leaks, ambition and resistance to political misuse. Coup risk is exceptional and causally grounded, not the institution's sole purpose. |  | planned | |
| 13.A7 | Add distinct military/logistics/corridor/repair/intelligence/demobilisation bets with partial outcomes and continuing support requirements. |  | planned | |
| 13.A8 | Preserve command transitions, contracts, deployments, professional improvements and unresolved abuses across governments. |  | authored, not integrated | Unresolved records carried by officers (an unreleased board of inquiry, half-paid compensation, missing spare-parts packages). Waits on R9. |
| 13.T9 | A corridor campaign produces a year of causally connected funding, operational, civilian and political developments. Coverage must extend across the game's theatres; this scenario is a verification case, not a pilot-only scope. | joint | planned | |
| 13.T10 | Professionalisation reduces routine presidential workload while strengthening lawful institutional limits. | joint | planned | |
| 14.A1 | Introduce recurring households, workers and businesses driven by actual prices, access, employment, security, power and service outcomes. |  | planned | |
| 14.A2 | Let people organise, petition, relocate, change employment or support alternatives. Avoid one uniform voice of the public. |  | planned | |
| 14.A3 | Model representative economic groups: salaried households, informal traders, farmers, manufacturers and import-dependent businesses. |  | planned | |
| 14.A4 | Distinguish educational access/completion/quality, health access/outcomes, coverage/reliability, affordability/fiscal durability and distribution/national output. |  | planned | |
| 14.A5 | Make rival policy approaches capable of different successes and recognisable failures, with adequate financing and implementation. |  | planned | |
| 14.A6 | Connect ports, corridors, industrial clusters, power networks and service catchments to project performance and beneficiaries. |  | planned | |
| 14.A7 | Let development create new constituencies: taxpayers demand accountability, firms seek credit and entry, workers organise, graduates expect jobs and capable agencies resist misuse. |  | planned | |
| 14.A8 | Support wealthy-but-unequal, capable-central, decentralised and politically open governing outcomes without making one universal score the only legitimate ambition. |  | planned | |
| 14.T9 | National improvement can coexist with a specific group losing out, with reasons visible. | joint | planned | |
| 14.T10 | Later administrations face new political questions caused by earlier successes, not only stronger versions of the same crisis. | joint | planned | |
| 15.A1 | Separate construction from operation; create staffing, servicing, supply and renewal obligations with adequate delegation. |  | planned | |
| 15.A2 | Escalate maintenance only when a material change requires presidential judgement. |  | planned | |
| 15.A3 | Diagnose design failure, funding delay, incapable execution, obstruction and external shocks separately. Remedies must address the relevant cause. |  | planned | |
| 15.A4 | Give opponents programmes, constituencies and specific proposals. Allow them to be right, to defend a neglected group and to campaign for particular reversals. |  | planned | |
| 15.A5 | Support adopting, negotiating, defeating or demonstrating an alternative to an opposition proposal. |  | planned | |
| 15.T6 | Replacing a minister does not magically fix missing funding. A functioning asset reduces old problems while requiring intelligible upkeep. | joint | planned | |
| 15.T7 | Opposition strategy is more than an inverse approval gauge. | joint | planned | |
| 16.A1 | Make succession a strategy pursued while governing, not only a replacement setup after the ending. Allow grooming several credible candidates, testing them through delegated responsibility, negotiating endorsements and choosing when to declare support. |  | planned | |
| 16.A2 | Separate successor competence, electoral appeal, coalition acceptance, personal loyalty and commitment to particular policies. A loyal incompetent heir and a capable independent successor must produce different risks and rewards. |  | planned | |
| 16.A3 | Make preparation matter through the party nomination, campaign, constitutional process and transfer of authority. Use the actual party and political history, not a hardcoded player-party assumption. Endorsement improves prospects but cannot guarantee a win. |  | planned | |
| 16.A4 | Store a negotiated succession settlement naming policies to preserve, appointments or coalitions to respect, unfinished work to complete and institutional protections. Distinguish public programme commitments from private expectations or improper protection bargains. |  | planned | |
| 16.A5 | Reward a well-played succession with a government able to maintain functioning assets, complete commitments and sustain legitimate reforms. Credit the originating administration without giving the former President automatic control over the successor. |  | planned | |
| 16.A6 | Give successors independent ambitions and evidence-based reasons to honour, reinterpret, renegotiate or break particular terms. Do not make betrayal a compulsory twist or blind loyalty the only successful outcome. |  | planned | |
| 16.A7 | Let the player negotiate continuity with a rival, accept an independently successful heir, mishandle a nomination, lose influence through overreach or establish institutions that preserve a legacy without a loyal individual. |  | planned | |
| 16.A8 | Preserve supported patronage networks and obligations, with explicit distinctions between personal favours and obligations of the state. Failed succession can leave factions, exposed bargains and contested legacy decisions rather than merely reset relationships. |  | planned | |
| 16.A9 | Make repeated presidencies transform the inherited political landscape. Succession success is judged through continuity, delivery, institutional survival, legitimacy and the successor's own results, separately from the predecessor's personal safety and influence. |  | planned | |
| 16.A10 | Build history-derived succession dossiers: delivered/reversed/abandoned policies, funded obligations, institutional independence, powerful beneficiaries and electoral promises. |  | planned | |
| 16.A11 | Differentiate heirs, victorious rivals and replacements after disgrace. Include public handovers and private letters where supported by history. |  | planned | |
| 16.A12 | Offer consequential preservation, investigation, renegotiation or rupture toward the predecessor's settlement. |  | planned | |
| 16.A13 | Implement a bounded playable post-office chapter using remaining networks, investigations, legacy defence, settlements and rebuilding influence. |  | planned | |
| 16.A14 | Support complicated legacies: an honest former leader can undermine a successor; a corrupt former leader can defend a valuable institution. |  | planned | |
| 16.A15 | Implement versioned country export/import with a structured handover letter for asynchronous human succession. The predecessor's interpretation remains separate from verified state. |  | planned | |
| 16.A16 | Preserve deterministic seed/state, schema compatibility, integrity checks and unsupported-version explanations. |  | planned | |
| 16.T17 | Preparation during office measurably changes nomination support, transition conditions and prospects for policy survival. Its effects are explained to the player and recorded in history. | joint | planned | |
| 16.T18 | A competent independent successor can count as a successful legacy. A protected former President whose programme collapses cannot be described as an unqualified succession success. | joint | planned | |
| 16.T19 | A well-prepared heir, failed heir and negotiated rival handover lead to distinct inherited commitments, relationships and post-office possibilities. | joint | planned | |
| 16.T20 | Another player can inherit a completed exported country and encounter its real obligations and disputed history. | joint | planned | |
| 16.T21 | Losing office opens meaningful decisions rather than merely ending the record. | joint | planned | |
| 17.A1 | Turn the archive into causal histories of institutions, assets, agreements and citizens. |  | planned | |
| 17.A2 | Distinguish announcement, authorisation, financing and delivery; originating versus completing administrations; prediction versus observation; allegation versus established event. |  | planned | |
| 17.A3 | Add attributed government, press, opposition and citizen interpretations of a shared verified history. |  | planned | |
| 17.A4 | Reflect accumulated history through office documents, objects and changes in presentation, with an appropriately different post-office setting. |  | planned | |
| 17.A5 | Make briefings lead to a short explained action shortlist tied to urgent problems, coalition stability and preparation; retain the complete toolbox. |  | planned | |
| 17.A6 | Build guided first-month decisions and consequence explanations without locking experienced players into a tutorial. |  | planned | |
| 17.A7 | Add short authored scenarios, deterministic daily seeds, replayable shared starting conditions and shareable verdicts/history extracts grounded in actual outcomes. |  | planned | |
| 17.A8 | Keep views concise and accessible. Routine progress belongs on commitments and status screens. |  | planned | |
| 17.T9 | A player can explain why a current dispute exists and trace it through earlier decisions. | joint | planned | |
| 17.T10 | Shared verdicts and history extracts do not invent outcomes or erase misconduct. | joint | planned | |
| 18.A1 | Update simulator strategies to exercise rival policies, reversals, recruitment, negotiated settlements, favours, emergency financing, military missions and maintenance. |  | planned | |
| 18.A2 | Retain comparisons across reformer, information-checking/trusting, machine, institutionalist, populist and kleptocratic programmes, with transparent script limitations. |  | planned | |
| 18.A3 | Investigate dominance rather than enforcing equal re-election rates. Corruption must have credible immediate benefits, dependencies and later risks. |  | planned | |
| 18.A4 | Add regression checks for reproduced defects and state invariants, not tests that merely restate implementation. |  | planned | |
| 18.A5 | Run type checking, content lint, appropriate scenario checks, multi-seed balance simulations and multi-government runs. |  | planned | |
| 18.A6 | Browser-playtest every opening, core monthly play, team recruitment, negotiations, emergency finance, military, operating assets, succession, post-office play and imports/exports. Check responsive layout and accessibility. |  | planned | |
| 18.A7 | Refresh README counts, GDD chapters, opening descriptions, handoff/deployment status and all affected player-facing wording. Resolve missing-headline warnings or explicitly justify intentional blanks. |  | planned | |
| 18.A8 | Produce a completion record mapping every plan requirement to implementation, evidence and remaining failures. All requirements must be satisfied or clearly reported as blocked; do not silently reclassify work as future scope. |  | planned | |
