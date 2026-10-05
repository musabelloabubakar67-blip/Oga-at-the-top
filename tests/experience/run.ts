// Runs every experience check in this folder, in order, and fails if any fails.
// Run: npx tsx tests/experience/run.ts   (requested as `npm run check:experience`)

import { spawnSync } from 'child_process';
import { readdirSync } from 'fs';
import path from 'path';

const dir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const checks = readdirSync(dir).filter((f) => f.endsWith('.check.ts')).sort();
let failed = 0;
for (const f of checks) {
  const r = spawnSync(process.execPath, ['--import', 'tsx', path.join(dir, f)], { stdio: 'inherit' });
  if (r.status !== 0) failed += 1;
}
console.log(failed ? `${failed} of ${checks.length} experience checks failed.` : `All ${checks.length} experience checks passed.`);
process.exit(failed ? 1 : 0);
