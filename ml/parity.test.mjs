import fs from 'fs';
import { rawInference } from '../services/predictionModel.ts';
const cases = JSON.parse(fs.readFileSync('ml/parity-cases.json', 'utf8'));
let fail = 0, n = 0;
for (const c of cases) {
  const got = rawInference(c.x);
  for (const h of Object.keys(c.out)) for (const k of ['drift', 'sigma', 'sent', 'pcr']) {
    n++;
    const a = c.out[h][k], b = got[h][k];
    if (Math.abs(a - b) > 1e-6 * Math.max(1, Math.abs(a))) { fail++; console.log(`MISMATCH h=${h} ${k}: train=${a} browser=${b}`); }
  }
}
console.log(`${n} comparisons, ${fail} mismatches`);
console.log(fail ? 'FAIL' : 'PASS — browser inference reproduces the training pipeline');
process.exit(fail ? 1 : 0);
