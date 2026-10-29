#!/usr/bin/env node
/**
 * NIFTY50OPS DAEMON — the daily routine with no clicks.
 *
 *   08:35  pre-flight (starts server.js if it is down)
 *   08:50  pull pre-market charts and verify them
 *   09:05  readiness check → one notification
 *   09:15–15:30  watchdog every 30 s (code rules, no LLM)
 *   15:35  scorecard + debrief.md
 *   15:45  exit
 *
 * Started by launchd at 08:25 on weekdays (scripts/launchd/com.fyers.opsdaemon.plist),
 * which replaces com.fyers.morningrunner. Exits at once on weekends and NSE
 * holidays. Holds `caffeinate -dimsu` while it runs so the Mac cannot idle-sleep
 * through the session — the cause of every past stall.
 *
 *   node scripts/opsDaemon.mjs                 run the day
 *   node scripts/opsDaemon.mjs --once verify   run one job now (preflight|charts|verify|watchdog|debrief)
 *   node scripts/opsDaemon.mjs --dry           print notifications instead of sending
 *   node scripts/opsDaemon.mjs --no-model      never call the model (deterministic wording)
 */

import { spawn } from 'node:child_process';
import { mkdirSync, openSync } from 'node:fs';
import { join } from 'node:path';
import { loadOpsEnv, opsConfig } from '../ops/config.mjs';
import { createRuntime } from '../ops/runtime.mjs';
import {
  SCHEDULE, completedJobs, createWatchdog, jobCharts, jobDebrief, jobPreflight, jobVerify, runJob
} from '../ops/daemonJobs.mjs';
import { istDateStr, istMinutes, istTimeStr, isTradingDay, PROJECT_ROOT } from '../ops/time.mjs';

const argv = process.argv.slice(2);
const flag = name => argv.includes(name);
const onceIdx = argv.indexOf('--once');
const once = onceIdx >= 0 ? argv[onceIdx + 1] : null;

loadOpsEnv();
const daemonRt = createRuntime({ level: opsConfig().daemonLevel });
daemonRt.dryRun = flag('--dry');
daemonRt.useModel = !flag('--no-model');

const log = msg => console.log(`[${istTimeStr()} IST] ${msg}`);

function startServer() {
  if (process.env.OPS_DAEMON_START_SERVER === 'false') return Promise.resolve();
  const logDir = join(PROJECT_ROOT, 'TradingJournal', 'launchd');
  mkdirSync(logDir, { recursive: true });
  const out = openSync(join(logDir, 'server.log'), 'a');
  log('Server is down — starting node server.js');
  const child = spawn(process.execPath, ['server.js'], {
    cwd: PROJECT_ROOT,
    detached: true,
    stdio: ['ignore', out, out],
    env: { ...process.env, NODE_ENV: process.env.NODE_ENV || 'development' }
  });
  child.unref();
  return Promise.resolve();
}

const JOBS = {
  preflight: () => jobPreflight(daemonRt, { startServer }),
  charts: () => jobCharts(daemonRt),
  verify: () => jobVerify(daemonRt),
  debrief: () => jobDebrief(daemonRt)
};

if (once) {
  if (once === 'watchdog') {
    const alerts = await createWatchdog(daemonRt)();
    log(`watchdog: ${alerts.length} alert(s)${alerts.length ? ` — ${alerts.map(a => a.rule).join(', ')}` : ''}`);
  } else if (JOBS[once]) {
    const result = await runJob(daemonRt, once, JOBS[once]);
    log(`${once}: ${JSON.stringify(result)}`);
  } else {
    console.error(`Unknown job "${once}". Use one of: ${[...Object.keys(JOBS), 'watchdog'].join(', ')}`);
    process.exit(2);
  }
  process.exit(0);
}

if (!isTradingDay()) {
  log(`${istDateStr()} is not an NSE trading day — nothing to do.`);
  process.exit(0);
}
if (istMinutes() >= SCHEDULE.exit) {
  log('Started after 15:45 — nothing left to do today.');
  process.exit(0);
}

// Keep the Mac awake for exactly as long as this process lives (-w <pid>).
if (process.platform === 'darwin') {
  const caf = spawn('caffeinate', ['-dimsu', '-w', String(process.pid)], { stdio: 'ignore', detached: true });
  caf.unref();
  log(`caffeinate -dimsu held (pid ${caf.pid})`);
}

log(`Nifty50Ops daemon up · L${daemonRt.level} · ${daemonRt.config.provider}:${daemonRt.config.model}${daemonRt.dryRun ? ' · dry run' : ''}`);
const done = completedJobs();
if (done.size) log(`Already done today: ${[...done].join(', ')}`);

const watchdog = createWatchdog(daemonRt);
let busy = false;
let lastWatch = 0;

async function tick() {
  if (busy) return;
  busy = true;
  try {
    const m = istMinutes();
    const due = (job, at, until = SCHEDULE.exit) => !done.has(job) && m >= at && m < until;

    if (due('preflight', SCHEDULE.preflight)) {
      await runJob(daemonRt, 'preflight', JOBS.preflight);
      done.add('preflight');
    }
    // Charts after the open are no use to the pre-market plan; skip if late.
    if (due('charts', SCHEDULE.charts, SCHEDULE.watchStart)) {
      await runJob(daemonRt, 'charts', JOBS.charts);
      done.add('charts');
    }
    if (due('verify', SCHEDULE.verify, SCHEDULE.debrief)) {
      await runJob(daemonRt, 'verify', JOBS.verify);
      done.add('verify');
    }
    if (m >= SCHEDULE.watchStart && m < SCHEDULE.watchEnd && Date.now() - lastWatch >= 30_000) {
      lastWatch = Date.now();
      await watchdog().catch(err => log(`watchdog error: ${err.message}`));
    }
    if (due('debrief', SCHEDULE.debrief)) {
      await runJob(daemonRt, 'debrief', JOBS.debrief);
      done.add('debrief');
    }
    if (m >= SCHEDULE.exit) {
      log('15:45 — routine complete, exiting.');
      process.exit(0);
    }
  } finally {
    busy = false;
  }
}

await tick();
setInterval(tick, 5_000);
