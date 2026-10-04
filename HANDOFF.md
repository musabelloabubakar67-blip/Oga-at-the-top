# Handoff: finish the reform library, second edition

Branch `claude/handoff-review-0txtze`. Read `WHERE-WE-STOPPED.md` (standing rules), `docs/gdd/00-as-built.md` (chapter 0, the source of truth), and `docs/BRIEFING.md` (the plan and change log) before changing anything.

## What this work is

The owner asked for the reform system to be rebuilt along the lines of a second reviewer's critique: reforms as policy generations, repairs created by history, rival answers, reversal, and everything wired into the existing systems. The owner approved this plan and asked for it to be built straight through, with no playtest; the owner playtests.

## Done and committed

- **Mechanics** (`engine/types.ts` Milestone, `engine/reduce.ts`):
  - `gen` 1/2/3: foundations go in order (any order on loose tracks); generation 2 opens when every foundation is delivered or ruled out by a rival; generation 3 appears only while `emerge(s)` is true.
  - `excludes`: rival reforms close each other (status `closed`).
  - `onBooks`: the reform is already on the statute book. It costs 0.7× capital and takes 0.75× the months.
  - `reversal`: the `REVERSE` action applies `gain`, takes back the reform's `bonus.*`, `sec.*` and `drift.*` effects and its flags, removes it from `agenda.done`, and sets the flag `reversed.<id>` (carried across presidencies via `WORLD_FLAG` in `engine/succession.ts`) and the counter `reversedAt.<id>`.
  - `reformName(s, id)` shows "Restore: …" for an undone reform.
  - `milestoneStatus` returns `done | active | next | later | closed | hidden`.
- **Content** (`content/tracks4.ts`, assembled in `restructure()` in `content/agenda.ts`). 17 tracks, 196 reforms; ids never change.
  - Health and Schools split: `people` is now Healthy Nigeria; `schools` is new.
  - Order is rebuilt as One Nigeria. The amnesty (o7) moved to security, the loot register (o8) to clean government, ranching (o3) to food, housing (h5) to cities.
  - New tracks `justice` and `cities`.
  - Every track has its deepening, plus 19 repair reforms with `emerge` tests.
  - Four rival pairs: p14/p15, m11/m12, k11/k12, g4/g13.
  - Eleven reversals.
  - Programme names are invented: the Power Sector Act, the Founders' Charter, the Skills Million programme.
  - Ministers own the new tracks (`content/people.ts`); the Infrastructure Fund pays for `cities`.
- **Hooks**:
  - Conviction odds: s8, s9 and j9 raise them; j7 removes "judges can be reached" (`engine/cases.ts`).
  - Trial length: shorter with j2 and j6.
  - Injunctions: j10 cuts their chance (`engine/courts.ts`, `engine/upcoming.ts`).
  - Fiscal council t6: halves the oil forecast's error and removes its lean (`engine/oilforecast.ts`).
  - Cash rule t7: shortfalls become fewer contractor arrears. Gas escrow p8: stops gas debt building (`engine/treasury.ts`).
  - Appraisal w8: +0.08 on big bets' odds (`engine/bets.ts`).
  - Declared campaign money c8: businessmen's money counts ×0.75 at elections (`engine/election.ts`).
  - New diversifiers in `engine/dependence.ts`.
  - The public order act o13 damps the cast's protests (`engine/agency.ts`).
  - Nights set the flag `night.<id>` to the truth at dawn (`engine/night.ts`). The water night gains a disaster-service beat and option when o9 is done; professional police s6 make a real coup less likely (`content/setpieces.ts`).
  - The era shifts list reforms the last President undid (`engine/era.ts`).
- Typecheck and content lint pass. The reform work has **not** been balance-tested.

## Still to do, in order

1. **Agenda screen by status** (`ui/Desk.tsx`, functions `Agenda` and `TrackCard`).
   - Pull the per-reform rendering out of `TrackCard` into a `ReformRow` component.
   - `Agenda` shows these sections:
     - Under way
     - Emerging: generation-3 reforms with status `next`, plus any reform whose `emerge` is true, with `emergeText`
     - Needs attention: reforms under attack (see `engine/attacks.ts`, `attackedReform`) and undone reforms (flag `reversed.<id>`, not done)
     - Ready now (status `next` and `canLaunch` ok; declared priority tracks first)
     - Needs the Assembly (status `next`, `needs` failing)
     - Blocked (other reasons), folded
     - Then the full library of 17 tracks, folded.
   - In `TrackCard`, group by generation: "Foundations", then "Deepening" (shown once the foundations are complete: "Foundations complete"). Hide generation-3 reforms until they emerge. Show `closed` rivals struck through, with the reason.
   - Show the `onBooks` note on the reform.
   - Use `reformName(s, id)` everywhere a reform name is shown: the agenda, reports, promises, upcoming.
2. **Reversal button**: on delivered reforms with `m.reversal`, add a button `{reversal.label} · 1 move` that dispatches `{ type: 'REVERSE', id }`, guarded by `canReverse`, with the `gain` effects shown through `describe()`.
3. **Bots** (`tools/simulate.ts`, the `if (bot.reforms)` block): choose the next reform per track as the first milestone with `milestoneStatus(s, id) === 'next'`. Today the bots take the first not done, which stalls on rivals and hidden repairs. Also update `wantsSecond`-style code only if it breaks.
4. **Checks**:
   - `npm run typecheck`, `npm run lint:content`.
   - Simulator, comparing with the last table (40 runs each: Reformer, checks the record 90%, Reformer 75%, trusts advisers 65%, Populist 57%, Institutionalist 55%, Machine 53%, Kleptocrat 10%):
     - `ONLY="Reformer|Machine|Institutionalist|Populist|Kleptocrat|Reformer, trusts advisers|Reformer, checks the record" npx tsx tools/simulate.ts 40`
     - Separate bot names with `|`; names contain commas.
   - `npx tsx tools/simulate.ts 3 --world` to see repairs and reversals across presidencies.
   - If the reformer bots now deliver many more reforms, tune the generation-2 costs in `content/tracks4.ts`, not the engine.
5. **Docs**: chapter 0 section 0.4 (reforms and big bets) needs to describe generations, emergence, rivals, the statute book, reversal and the 17 tracks. Add a row to the change log in `docs/BRIEFING.md` and update its section 6.2. `WHERE-WE-STOPPED.md` lists "70 reforms in 14 tracks"; correct it.
6. Commit and push to `claude/handoff-review-0txtze`. Commit messages end with the attribution lines this repository uses.

## Rules that matter here

- Never change a reform id. Events and flags read `c2`, `r4`, `p1`, `v4` and others. Retired ids (r2, r5, h2, h4, o2, o4, o5, g3, g5) must not be reused.
- Invented names only for laws, programmes, parties, papers and companies. Never name a real organisation as a wrongdoer; no real famous quotes.
- No gendered pronouns for roles different people can fill.
- Effects are shown, never hidden; every outcome has a named cause.
- `engine/` stays pure and deterministic: random numbers come from `rand(s)`.
