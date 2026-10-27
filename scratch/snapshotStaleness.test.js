// ml/snapshotStaleness.test.ts
import assert from "node:assert";
import crypto from "node:crypto";
function sha1Hex(buffer) {
  return crypto.createHash("sha1").update(buffer).digest("hex");
}
function processSnapshots(incoming, storedHashes) {
  const accepted = [];
  const skippedStale = [];
  const updatedHashes = { ...storedHashes };
  for (const item of incoming) {
    if (item.stale) {
      skippedStale.push(item.file);
      continue;
    }
    const hash = sha1Hex(item.buffer);
    if (storedHashes[item.file] === hash) {
      skippedStale.push(item.file);
      continue;
    }
    updatedHashes[item.file] = hash;
    accepted.push(item.file);
  }
  return { accepted, skippedStale, updatedHashes };
}
console.log("\n--- Snapshot Staleness & Dedup Verification Suite ---");
var buf1 = Buffer.from("fyers_5m_candle_12345");
var buf2 = Buffer.from("kite_15m_candle_67890");
var initialHashes = {};
var round1 = processSnapshots(
  [
    { file: "fyers_5m.png", buffer: buf1 },
    { file: "kite_15m.png", buffer: buf2 }
  ],
  initialHashes
);
assert.strictEqual(round1.accepted.length, 2, "Both fresh snapshots should be accepted");
assert.strictEqual(round1.skippedStale.length, 0, "No snapshots should be skipped on first capture");
assert.strictEqual(typeof round1.updatedHashes["fyers_5m.png"], "string");
console.log("  ok   Fresh captures accepted & hashed");
var round2 = processSnapshots(
  [
    { file: "fyers_5m.png", buffer: buf1 },
    // exact same buffer
    { file: "kite_15m.png", buffer: Buffer.from("kite_15m_candle_NEW_DATA") }
    // fresh new buffer
  ],
  round1.updatedHashes
);
assert.strictEqual(round2.accepted.length, 1, "Only modified capture accepted");
assert.strictEqual(round2.accepted[0], "kite_15m.png", "Modified capture accepted");
assert.strictEqual(round2.skippedStale.length, 1, "Byte-identical capture skipped as stale");
assert.strictEqual(round2.skippedStale[0], "fyers_5m.png", "fyers_5m.png skipped as stale");
console.log("  ok   Byte-identical snapshot correctly flagged as stale");
var round3 = processSnapshots(
  [
    { file: "fyers_15m.png", buffer: Buffer.from("brand_new_123"), stale: true }
  ],
  round2.updatedHashes
);
assert.strictEqual(round3.accepted.length, 0);
assert.strictEqual(round3.skippedStale.length, 1);
assert.strictEqual(round3.skippedStale[0], "fyers_15m.png");
console.log("  ok   Sidecar explicit stale flag honored");
console.log("\n\u2705 PASS \u2014 Snapshot staleness and hash-based dedup verified!\n");
