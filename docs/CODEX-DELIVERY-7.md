# Delivery 7: scenario assets integrated and balance check completed

Integrated Claude's e83c0b3. All six starting scenarios now instantiate their dossier asset and declared condition; dossier checks verify real new games rather than claims in metadata. The revised financier strengths, small-contributor campaign effect and self-funded option are accepted as content inputs for R6. They are not applied to setup yet.

The requested larger Machine/After the Scandal comparison is complete: 256 matched seeds per version, 97c12ff versus e83c0b3. Re-election is 144/256 before and 148/256 after. The first eight reproduce 6/8 versus 3/8, but that large drop does not persist in the larger sample. No balance tuning was made. Read docs/playtest/systems/SCANDAL-MACHINE-BALANCE.md and its paired CSV/JSON evidence.

tools/simulate.ts now supports --scenario=scandal, --bot=Machine and --results=path under --scenarios, with checkpoints and progress every 16 runs. tools/compare-scenarios.ts checks matching seeds and generates paired evidence and diagnostic statistics.

Validation: TypeScript passed with the new tools. Integrated engine/content checks pass: 17 systems checks, three experience suites (six dossier checks, eleven record checks, two route checks), and zero-warning content lint. Both 256-run jobs completed with no engine exception.

S6 is consumed in actual starting worlds. R3, R4, R5, R6, S1 and S3 remain immediate work. R6 still needs validated continuity, neutral businessman standing, removal of automatic legacy startup favours for explicit choices, scenario/inheritance-before-effects ordering, and its other transition steps. No unfinished contract is claimed complete by this balance delivery.
