# Content and screen inventory at the baseline

Baseline `4227861`, branch `redesign/claude-experience`, taken 5 October 2026. Machine-readable versions: `inventory.json` (counts) and `event-audit.json` (one row per event, the starting table for the full audit in plan section 07). These counts are a starting point, not a cap.

## Events

| Measure | Count |
|---|---|
| Events in the registry | 180 |
| Choices | 532 |
| Outcomes | 573 |
| Outcomes that only move numbers (no flag, operation, favour, delayed effect, follow-up or exposure) | 183 |
| Outcomes with no headline | 80 |
| Events that recur or can fire more than once | 53 |
| Events cast from state (`cast`) | 21 |
| Events whose every outcome only moves numbers | 17 |

By file: system 26, minor 18, reactive 17, politics 15, shocks 13, secondterm 13, recurring 11, absurd 10, cabinet 10, labour 8, predecessor 8, scandal 8, subsidy 8, attacks 4, institutions 4, tribunal 3, promises 2, refinery 2.

By kind: standalone 62, recurring 49, chain 41, threshold 17, calendar 11. By tone: dry 138, grave 18, farce 17, absurd 7.

Stock devices the plan asks to refresh (events containing them): committee or panel 30, ribbon or commissioning 8, denial 4, completion percentage 3, goat 3, generic "please call" 1.

Repeated headlines: an empty headline string appears 16 times; "PRESIDENT ANNOUNCES ENERGY MARKET REFORMS" and "SUBSIDY IS GONE! PETROL NOW ₦1,450" three times each; nine more twice.

## Reforms, orders and bets

- 17 tracks, 196 reforms: 89 foundations, 89 deepening, 18 generation-three. 21 repairs, 8 rival pairs' members, 11 reversals, 5 already on the books, 5 marked popular. Four tracks take foundations in any order (federation, welfare, order, resources).
- Treasury is still one combined track of 11 reforms; plan section 10 splits it into tax and treasury.
- 75 executive orders, 55 of them situational.
- 33 big bets, 16 opened by reforms, 93 named risks.

## People and places

- 16 hand-written politicians (6 governors, 4 senators, 6 ministers), 5 businessmen, 6 named advisers, 7 named cast in `names.ts`.
- Talent pool: generated (48 at a time) from 7 specialities and zone name banks. No careers, capabilities or conditions.
- 9 institutions, a bench of 7 judges and 5 nominees, 18 public assets with 5 expansions, 6 security theatres, 37 states, 6 night set-pieces, 13 shocks.
- 6 starting scenarios: standard, boom, morning, scandal, reformer, emergency.
- Press: 4 outlets, 35 editorials, 43 sidebars, 34 fillers, 48 tone lines, 4 running stories.

## Screens

| File | Lines | Main views |
|---|---|---|
| `ui/Desk.tsx` | 1,820 | Desk, briefing, file and phone modals, orders, institutions, agenda and reform rows, ventures, record, nation, drawer, archive, status bar, assets, states |
| `ui/People.tsx` | 850 | People, promises, favours owed and owing, wronged, courts, vice president, former officials, former President, federal, succession |
| `ui/Treasury.tsx` | 585 | Budget, Assembly version, this year, flow, policies, owed, saved, naira |
| `ui/Setup.tsx` | 210 | Title, certificate of return |
| `ui/Paper.tsx` | 142 | The two newspapers |
| `ui/Election.tsx` | 114 | Election night |
| `ui/Game.tsx` | 114 | Phase routing and saves |
| `ui/Verdict.tsx` | 107 | Verdict |
| `ui/StateMap.tsx`, `Night.tsx`, `Aimed.tsx`, `Candidates.tsx`, `Cases.tsx`, `shell.tsx` | 35–94 each | Map, night set-pieces, aimed powers, candidate list, cases, overlay |

No screen exists yet for: the transition dossier, the government slate, a requests view, a commitments register, emergency funds, military missions, operating projects, citizens and places, post-office play, export and import, or the history book.

## Engine surface the screens use today

50 action types, from `DISMISS_PAPER` to `ELECTION_DONE`. Engine modules include `wants`, `promises`, `targets`, `talent`, `institutions`, `courts`, `cases`, `currency`, `succession`, `successor`, `afterlife`, `formers`, `archive`, `era`, `narrative`, `director`. See `CONTRACT-REQUESTS.md` for how each relates to the contracts the plan needs.
