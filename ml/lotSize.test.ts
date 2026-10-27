import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { NIFTY_LOT_SIZE, assertValidLotSize } from '../constants/lotSize';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, '../api/paytm/option_security_master.csv');

console.log('\n--- NIFTY Lot Size Master Verification ---');

if (!fs.existsSync(CSV_PATH)) {
  console.error(`❌ Master CSV not found at: ${CSV_PATH}`);
  process.exit(1);
}

const csvData = fs.readFileSync(CSV_PATH, 'utf-8');
const lines = csvData.split('\n');

const masterLotSizes = new Set<number>();
let niftyRowCount = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const cols = line.split(',');
  if (cols.length < 6) continue;
  const symbol = cols[1].replace(/"/g, '');
  if (symbol.startsWith('NIFTY-')) {
    const lotSize = parseInt(cols[5].replace(/"/g, ''), 10);
    if (!isNaN(lotSize)) {
      masterLotSizes.add(lotSize);
      niftyRowCount++;
    }
  }
}

console.log(`Parsed ${niftyRowCount} NIFTY- rows from master CSV.`);
console.log(`Unique lot sizes found in CSV:`, Array.from(masterLotSizes));

let failed = 0;

function check(label: string, cond: boolean, detail?: string) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

check('Master CSV has only one unique lot size for NIFTY-', masterLotSizes.size === 1, `Got ${masterLotSizes.size}`);
const csvLotSize = Array.from(masterLotSizes)[0];
check('Master CSV lot size is 65', csvLotSize === 65, `Got ${csvLotSize}`);
check('constants/lotSize.ts exports 65', NIFTY_LOT_SIZE === 65, `Got ${NIFTY_LOT_SIZE}`);
check('Constant matches master CSV exactly', NIFTY_LOT_SIZE === csvLotSize, `${NIFTY_LOT_SIZE} !== ${csvLotSize}`);
check('assertValidLotSize(65) is true', assertValidLotSize(65));
check('assertValidLotSize(130) is true', assertValidLotSize(130));
check('assertValidLotSize(75) is false', !assertValidLotSize(75));
check('assertValidLotSize(0) is false', !assertValidLotSize(0));

console.log(failed ? '\n❌ FAILED' : '\n✅ PASS — NIFTY lot size matches master CSV (65)\n');
process.exit(failed ? 1 : 0);
