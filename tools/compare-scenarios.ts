import { readFileSync, writeFileSync } from 'node:fs';
interface Row {
  scenario: string; bot: string; index: number; seed: number; reelected: boolean;
  months: number; ending: string | null; eve: Record<string, number> | null;
}
interface Report { runs: number; seedFormula: string; rows: Row[] }
const [beforePath, afterPath, outputPrefix] = process.argv.slice(2);
if (!beforePath || !afterPath || !outputPrefix) throw new Error('Provide before JSON, after JSON, output prefix');
const before = JSON.parse(readFileSync(beforePath, 'utf8')) as Report;
const after = JSON.parse(readFileSync(afterPath, 'utf8')) as Report;
if (before.runs !== after.runs || before.seedFormula !== after.seedFormula) throw new Error('Different run plans');
if (before.rows.length !== before.runs || after.rows.length !== after.runs) throw new Error('Incomplete or multi-strategy report');
const key = (r: Row) => [r.scenario, r.bot, r.seed].join(':');
const afterByKey = new Map(after.rows.map((r) => [key(r), r]));
if (afterByKey.size !== after.rows.length || new Set(before.rows.map(key)).size !== before.rows.length) throw new Error('Duplicate seeds');
const pairs = before.rows.map((b) => {
  const a = afterByKey.get(key(b));
  if (!a || a.index !== b.index) throw new Error('Unmatched seed');
  return { b, a };
});
if (new Set(pairs.map(({ b }) => b.scenario + ':' + b.bot)).size !== 1) throw new Error('Compare one scenario and bot');
const n = pairs.length;
const winsBefore = pairs.filter(({ b }) => b.reelected).length;
const winsAfter = pairs.filter(({ a }) => a.reelected).length;
const gains = pairs.filter(({ b, a }) => !b.reelected && a.reelected).length;
const losses = pairs.filter(({ b, a }) => b.reelected && !a.reelected).length;
const delta = (winsAfter - winsBefore) / n;
const variance = n > 1 ? (gains + losses - n * delta * delta) / (n - 1) : 0;
const half = 1.96 * Math.sqrt(variance / n);
const discordant = gains + losses;
let term = 2 ** -discordant, tail = term;
for (let k = 1; k <= Math.min(gains, losses); k++) { term *= (discordant - k + 1) / k; tail += term; }
const average = (values: number[]) => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const bothEve = pairs.filter(({ b, a }) => b.eve && a.eve);
const metrics = ['margin', 'approval', 'hardship', 'treasury', 'debt', 'arrears', 'scandal', 'party', 'money'];
const summary = {
  scenario: pairs[0].b.scenario, bot: pairs[0].b.bot, runs: n, seedFormula: before.seedFormula,
  winsBefore, winsAfter, rateBefore: winsBefore / n, rateAfter: winsAfter / n,
  deltaPercentagePoints: 100 * delta, approximatePaired95Interval: [100 * (delta - half), 100 * (delta + half)],
  gains, losses, unchanged: n - discordant, exactPairedP: discordant ? Math.min(1, 2 * tail) : 1,
  firstEight: { before: pairs.slice(0, 8).filter(({ b }) => b.reelected).length, after: pairs.slice(0, 8).filter(({ a }) => a.reelected).length },
  meanMonths: { before: average(pairs.map(({ b }) => b.months)), after: average(pairs.map(({ a }) => a.months)) },
  reachedEve: { before: pairs.filter(({ b }) => b.eve).length, after: pairs.filter(({ a }) => a.eve).length, both: bothEve.length },
  matchedEve: Object.fromEntries(metrics.map((m) => [m, {
    before: average(bothEve.map(({ b }) => b.eve![m])), after: average(bothEve.map(({ a }) => a.eve![m])),
  }])),
};
const columns = ['index', 'seed', 'won_before', 'won_after', 'months_before', 'months_after', 'ending_before', 'ending_after', ...metrics.flatMap((m) => [`eve_${m}_before`, `eve_${m}_after`])];
const csv = [columns.join(','), ...pairs.map(({ b, a }) => [
  b.index, b.seed, Number(b.reelected), Number(a.reelected), b.months, a.months, b.ending, a.ending,
  ...metrics.flatMap((m) => [b.eve?.[m] ?? '', a.eve?.[m] ?? '']),
].join(','))].join('\n') + '\n';
writeFileSync(outputPrefix + '.csv', csv);
writeFileSync(outputPrefix + '.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
