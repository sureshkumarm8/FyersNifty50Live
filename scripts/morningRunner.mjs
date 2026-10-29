#!/usr/bin/env node
/**
 * MORNING RUNNER (Milestone M5.1) — one-shot pre-flight.
 *
 * The checks live in ops/preflight.mjs and are shared with the ops daemon
 * (scripts/opsDaemon.mjs), which runs this same pre-flight at 08:35 and then
 * carries on with the rest of the day. This script is kept for running the
 * pre-flight by hand: `npm run runner`.
 */

import { appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { sendNotification } from '../services/notify.mjs';
import { loadOpsEnv } from '../ops/config.mjs';
import { runPreflight } from '../ops/preflight.mjs';
import { ensureJournalDir, istDateStr, isTradingDay } from '../ops/time.mjs';

loadOpsEnv();

console.log('\n============================================================');
console.log('🌅 Morning Trading Session Runner');
console.log('============================================================\n');

if (!isTradingDay()) {
  console.log(`ℹ️ ${istDateStr()} is a weekend or NSE holiday. Markets are closed.`);
  process.exit(0);
}

const dateStr = istDateStr();
const logFile = join(ensureJournalDir(dateStr), 'runner.log');

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  appendFileSync(logFile, line + '\n');
}

log(`Session initialized for ${dateStr}. Logging to ${logFile}`);
log('Running pre-flight system integrity checks...');

const report = await runPreflight();
for (const c of report.checks) {
  log(`${c.ok ? '✅' : c.critical ? '❌' : '⚠️'} ${c.label}: ${c.detail}`);
}

if (!report.ok) {
  await sendNotification('Pre-Flight FAILED', `Critical: ${report.failedCritical.join(', ')}. Check runner.log.`);
  process.exit(1);
}

log('🚀 Pre-flight sequence complete.');
await sendNotification(
  'Morning Prep Armed',
  `Pre-flight passed for ${dateStr}${report.warnings.length ? ` (warnings: ${report.warnings.join(', ')})` : ''}. Open http://localhost:5173/#premarket?autopull=1`
);

console.log('\n============================================================');
console.log('✅ Morning runner completed pre-flight verification.');
console.log('============================================================\n');
