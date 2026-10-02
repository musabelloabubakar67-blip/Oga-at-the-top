# Oga at the Top

A satirical Nigerian presidency simulator. You can govern well. Doing the right thing and surviving long enough for it to work are two different problems.

The full design is in [docs/gdd](docs/gdd/README.md). This repository currently holds a playable slice: one presidency of up to two terms.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:3000. The game saves to the browser automatically.

## Other commands

| Command | What it does |
|---|---|
| `npm run lint:content` | Checks every event: references resolve, every lead file has a delayed consequence and an option that is always available, tokens exist |
| `npm run simulate -- 200` | Plays 200 presidencies with each of seven scripted strategies and prints re-election rates, endings and legacy grades |
| `npm run simulate -- --trace` | Prints one reformer presidency decision by decision, with the "How did we get here?" trace for each file |
| `npm run typecheck` | TypeScript check |
| `npm run build` | Static export to `out/` |

## Layout

| Path | Contents |
|---|---|
| `engine/` | Pure TypeScript simulation. No React, no browser APIs. `reduce.ts` is the entry point; every coefficient is in `config.ts` |
| `content/events/` | The events, as data, grouped by storyline |
| `content/names.ts` | The name registry. Every name is a parody name |
| `content/press.ts` | Filler headlines, sidebars, adviser stock lines |
| `ui/` | The screens |
| `tools/` | Content linter and balance simulator |

## What the slice includes

- **Setup:** name, form of address, party, home state, background, four priorities out of ten reform tracks, and the choice of Finance Minister
- **The month:** newspaper, Chief of Staff's note, a report of what your earlier decisions delivered, one lead file, phone messages, and four presidential moves (five with a well-run Villa, three with a collapsing one)
- **Reforms** (`content/agenda.ts`, `content/tracks2.ts`): ten tracks of five reforms each. The fifth unlocks when the first four are delivered. Reforms cost capital, money and time; most carry a running cost or a named loser; those that need a law are voted on in the Senate and can be defeated
- **Big bets** (`content/ventures.ts`): seventeen risky initiatives with stated odds that improve with state capacity and integrity. Seven appear only when the situation creates them. Success and failure are both permanent
- **Executive powers** (`content/agenda.ts`, `content/orders2.ts`): 68 in all. Thirteen are standing powers (subsidy, bond, central bank financing, VAT, debt, relief, offensive, service chiefs, reshuffles). Fifty-five are powers of the moment: up to five are on offer at a time, each for a few months, chosen from whatever the season, the state of the country, the electoral calendar and the opposition make possible. A lapsed option does not return for ten months
- **Your people** (`content/people.ts`): six governors, four senators and six ministers, each with loyalty, influence and a want. Give them time, give them what they want, lean on them, or replace ministers. Governors' loyalty moves votes in their zone; senators' loyalty decides whether bills pass; ministers' competence sets reform speed
- **The opposition:** three rivals who each grow on a different failure. The strongest is the one you face
- **Events:** 106 (87 lead files, 19 phone matters). Thirteen lead files exist only because of something the President did, and are weighted above generic events. Recurring crises stop for good once their cause is fixed
- **Political capital** (`engine/capital.ts`): a monthly income itemised on the desk, from approval, governors and senators who are with you, solid blocs and delivered reforms. It can also be raised directly: from the public (costs approval), with money (constituency projects), with patronage (board seats, costs integrity), by giving people what they want, or from the drawer
- **Legibility:** expected effects on every option, measured changes after every decision, live figures with month-on-month movement, a re-election outlook, a scorecard, and a standing record of achievements, failures, policies in force and permanent effects
- **The drawer:** the security vote, logistics for the Assembly (including buying a vote the Senate would otherwise defeat), the campaign
- **Newspapers:** a lead story with body text, reactions quoted from the strongest rival and one of your own people, the month in figures, an editorial, and a sidebar
- A state-by-state election night, a second term, and a legacy verdict judged against what was inherited

## Where it departs from the design document

- **Effects are shown, not hidden.** The design document's "advice, not arithmetic" pillar was dropped after the first playtest: hidden consequences made choices feel arbitrary and progress invisible. Every option now shows its expected effects as arrows, and every decision shows what changed in numbers. Chance and long-run knock-ons are still uncertain.
- **Political capital can be overdrawn.** An option that costs more capital than you have can still be taken; the party and the Villa lose standing in proportion.

- Blocs are simulated at bloc level; the actors inside them are not built.
- Nine national variables and three pressures, not the full 22 and 9.
- Two newspapers (broadsheet and youth outlet), not six.
- No budget screen, bill tracker, map, WhatsApp groups or federal character. People have wants, but not the full debts ledger.
- The presidency ends at the verdict. Playing the successor in the same world is not built; past presidents are only listed on the title screen.
- No Zustand, Zod or Motion: plain React state, TypeScript types plus the linter, and CSS transitions.
