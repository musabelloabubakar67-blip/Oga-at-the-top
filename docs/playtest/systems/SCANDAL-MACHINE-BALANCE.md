# After the Scandal: matched Machine balance check

Completed 6 October 2026. Before: 97c12ff. After: e83c0b3. Machine strategy, scandal scenario, 256 presidencies per version (512 total). Both use the same instrumented harness, verified identical by SHA256, with seeds 500 + index * 131, indices 0 through 255.

## Result

| Measure | Before | After |
|---|---:|---:|
| Re-elected | 144/256 | 148/256 |
| Re-election rate | 56.25% | 57.8125% |
| Mean months in office | 69.00 | 71.28 |
| First eight seeds | 6/8 | 3/8 |

The larger run does not reproduce the dramatic drop in the original eight-run comparison. The observed difference is +1.5625 percentage points. Among matched seeds, 34 switched from loss to win, 30 from win to loss, and 192 kept the same outcome.

An approximate paired 95% interval for the change is -4.57 to +7.70 percentage points. The exact two-sided paired test gives p = 0.708. These are diagnostics under a seed-sampling interpretation, not proof of equivalence. This is one scripted strategy in one scenario; it does not establish human-player difficulty or balance for every inheritance.

Decision: retain the declared hospital condition and upkeep. This sample does not justify tuning them to repair a re-election regression. No gameplay parameter or authored content was changed by this check.

## Election-eve diagnostics

All 256 runs in each version reached month 44. The following are means of the last recorded month-44 desk snapshot, not election results:

| Measure | Before | After |
|---|---:|---:|
| Projected margin, points | -4.019 | -3.990 |
| Approval | 45.604 | 45.723 |
| Hardship | 41.045 | 41.070 |
| Treasury, naira trillions | 0.084 | 0.101 |
| Debt-service metric | 89.720 | 89.884 |
| Arrears, naira trillions | 1.739 | 1.690 |
| Scandal heat | 90.409 | 90.002 |
| Party bloc | 81.177 | 81.444 |
| Money-men contribution, points | 2.261 | 2.160 |

There is no broad deterioration in these average election-eve measures. They do not identify the cause of each individual seed's changed outcome.

## What the hospital actually changes

ASSETS.hospital.fiscal is -0.003: naira 3bn monthly upkeep, not income. At an unexpanded site, 48 operating ticks cost naira 0.144tn. Its other current effects are a small press-bloc gain, local electoral support in the FCT, and patient-treatment production records. Negative upkeep is paid in full even at reduced physical condition.

For seed 500, both versions begin with identical nation values, RNG state and desk files; the after version additionally contains the hospital. Matching seeds do not guarantee identical later random draws: changed affordability, choices and event eligibility can diverge the subsequent execution path. The financier-content revisions remain inert until R6 applies explicit setup choices.

## Evidence and reproduction

scandal-machine-paired.csv contains every matched seed, re-election outcomes, ending, months in office and election-eve measures. scandal-machine-paired.json contains the computed summary. tools/compare-scenarios.ts rejects incomplete, unmatched or duplicate-seed reports.

Use a separate worktree at 97c12ff for the before version and at e83c0b3 for the after version. Copy the current tools/simulate.ts into both so the harness is identical; keep the respective engine/content revisions unchanged. Ensure the output directory exists.

    node --import tsx tools/simulate.ts 256 --scenarios --scenario=scandal --bot=Machine --results=before.json
    node --import tsx tools/simulate.ts 256 --scenarios --scenario=scandal --bot=Machine --results=after.json
    node --import tsx tools/compare-scenarios.ts before.json after.json paired

Run the first command in the before worktree and the second in the after worktree. Use the actual paths to both reports for the third command. The harness checkpoints results and prints progress every 16 presidencies. Default unfiltered scenario runs retain their previous seed schedule and strategies.
