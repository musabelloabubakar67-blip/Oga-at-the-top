# Oga at the Top

A satirical Nigerian presidency strategy game. You can govern well. Doing the right thing and surviving long enough for it to work are two different problems.

**What the game is, system by system, is in [docs/gdd/00-as-built.md](docs/gdd/00-as-built.md).** The rest of [docs/gdd](docs/gdd/README.md) is the original design, with a note at the head of each chapter saying where the build differs.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000. The game saves to the browser automatically, and saves are carried forward across updates.

## Other commands

| Command | What it does |
|---|---|
| `npm run typecheck` | TypeScript check |
| `npm run lint:content` | Checks all content: references, tokens, operations, cast selectors, big-bet conditions; every lead file must have a delayed consequence and an option that is always available |
| `npm run simulate -- 40 --probe` | Plays 40 presidencies with each of twelve scripted strategies; prints re-election rates, endings, legacy grades, and the state on the eve of the first election |
| `npm run simulate -- --trace` | Prints one reformer presidency decision by decision |
| `npm run simulate -- 12 --scenarios` | Re-election rates for three strategies in each of the six starting scenarios |
| `npm run simulate -- 4 --world` | Chains four presidents through one country, each inheriting what the last one left |
| `npm run build` | Static export to `out/` |

## Layout

| Path | Contents |
|---|---|
| `engine/` | Pure TypeScript simulation. No React, no browser APIs. `reduce.ts` is the entry point; every coefficient is in `config.ts` |
| `engine/treasury.ts`, `ledger.ts` | Debts, funds, oil, the budget, the monthly flow |
| `engine/people.ts`, `favours.ts`, `opposition.ts` | Governors, senators, ministers and scorecards; favours and businessmen; rivals and their moves |
| `engine/security.ts`, `bets.ts`, `press.ts` | Theatres; big bets and their conditions; the four papers |
| `engine/cast.ts`, `ops.ts` | How a file is filled from the state, and what an outcome can do beyond numbers |
| `engine/succession.ts`, `content/scenarios.ts` | Playing on as the next President in the same country; the six starting inheritances |
| `engine/migrate.ts` | Brings older saves forward |
| `content/` | Everything authored, as data: events, reforms, big bets, executive powers, people, businessmen, debts, theatres, press lines |
| `content/names.ts` | The name registry and the naming rule |
| `ui/` | The screens |
| `engine/legislature.ts`, `delegation.ts` | Bills, concessions and pacts; objectives delegated to ministers |
| `engine/episodes.ts`, `content/families.ts` | Recurring problems as developing stories, with exits |
| `engine/institutions.ts`, `courts.ts`, `military.ts`, `society.ts` | Independent agencies, the court, the armed forces, citizens and groups |
| `tests/experience/` | Thirty experience suites; `npm run check:experience` |
| `tools/` | Content linter, balance simulator, contract checks, bets and verb audits |

## In one paragraph

Each month the President reads two newspapers that disagree, decides at most one file, and has four moves. There are 220 reforms on eighteen tracks and forty big bets, each with a price and, for the bets, a list of things that must be true for them to work. The country owes six named debts and has four places to keep savings. Sixteen named politicians, five businesspeople and three rivals each want something and stand somewhere on the issues; bills are negotiated with them, and what is owed runs in both directions. Ministers can be given objectives; institutions, courts and the armed forces act on their own rules; citizens and groups feel what the government does. Corruption is available and works. After four years there is an election; after eight, a verdict against what was inherited.
