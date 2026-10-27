// ml/lotSize.test.ts
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// constants/lotSize.ts
var NIFTY_LOT_SIZE = 65;
function assertValidLotSize(qty) {
  return qty > 0 && qty % NIFTY_LOT_SIZE === 0;
}

// ml/lotSize.test.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var CSV_PATH = path.join(__dirname, "../api/paytm/option_security_master.csv");
console.log("\n--- NIFTY Lot Size Master Verification ---");
if (!fs.existsSync(CSV_PATH)) {
  console.error(`\u274C Master CSV not found at: ${CSV_PATH}`);
  process.exit(1);
}
var csvData = fs.readFileSync(CSV_PATH, "utf-8");
var lines = csvData.split("\n");
var masterLotSizes = /* @__PURE__ */ new Set();
var niftyRowCount = 0;
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  const cols = line.split(",");
  if (cols.length < 6) continue;
  const symbol = cols[1].replace(/"/g, "");
  if (symbol.startsWith("NIFTY-")) {
    const lotSize = parseInt(cols[5].replace(/"/g, ""), 10);
    if (!isNaN(lotSize)) {
      masterLotSizes.add(lotSize);
      niftyRowCount++;
    }
  }
}
console.log(`Parsed ${niftyRowCount} NIFTY- rows from master CSV.`);
console.log(`Unique lot sizes found in CSV:`, Array.from(masterLotSizes));
var failed = 0;
function check(label, cond, detail) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` \u2014 ${detail}` : ""}`);
  }
}
check("Master CSV has only one unique lot size for NIFTY-", masterLotSizes.size === 1, `Got ${masterLotSizes.size}`);
var csvLotSize = Array.from(masterLotSizes)[0];
check("Master CSV lot size is 65", csvLotSize === 65, `Got ${csvLotSize}`);
check("constants/lotSize.ts exports 65", NIFTY_LOT_SIZE === 65, `Got ${NIFTY_LOT_SIZE}`);
check("Constant matches master CSV exactly", NIFTY_LOT_SIZE === csvLotSize, `${NIFTY_LOT_SIZE} !== ${csvLotSize}`);
check("assertValidLotSize(65) is true", assertValidLotSize(65));
check("assertValidLotSize(130) is true", assertValidLotSize(130));
check("assertValidLotSize(75) is false", !assertValidLotSize(75));
check("assertValidLotSize(0) is false", !assertValidLotSize(0));
console.log(failed ? "\n\u274C FAILED" : "\n\u2705 PASS \u2014 NIFTY lot size matches master CSV (65)\n");
process.exit(failed ? 1 : 0);
