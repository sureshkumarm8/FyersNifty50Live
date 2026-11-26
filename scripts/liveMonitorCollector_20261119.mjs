import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TODAY = '2026-11-19';
const JOURNAL_DIR = path.join(ROOT, 'TradingJournal', TODAY, 'live-monitor');
const MINUTE_FILE = path.join(JOURNAL_DIR, 'minute.jsonl');
const OI_FILE = path.join(JOURNAL_DIR, 'oi.jsonl');
const DECISIONS_FILE = path.join(JOURNAL_DIR, 'decisions.md');

fs.mkdirSync(JOURNAL_DIR, { recursive: true });

function getIST() {
  const d = new Date();
  const istStr = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
  const [h, m, s] = istStr.split(':').map(Number);
  return { timeStr: istStr, totalMins: h * 60 + m, h, m, s, ms: d.getMilliseconds() };
}

let lastDecisionLogged = null;
let lastSniperState = null;
let openingRangeLogged = false;
let orHigh = null;
let orLow = null;

// Scenario B state
let bState = 'IDLE'; // IDLE -> ARMED_LONG / ARMED_SHORT -> TRIGGERED / BLOCKED -> WINDOW_CLOSED
let activeFloor = 25200;
let activeCeiling = 25300;
let testLow = null;
let testHigh = null;
let closeBuffer = []; // 1-minute close prices
let triggerAttempts = 0;

async function pollOpsState() {
  try {
    const res = await fetch('http://localhost:5001/api/ops/state', { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    return null;
  }
}

async function triggerSnapshot() {
  try {
    const res = await fetch('http://localhost:4321/api/snapshots', { method: 'POST' });
    return await res.json();
  } catch (err) {
    return { error: err.message };
  }
}

function appendMinute(record) {
  fs.appendFileSync(MINUTE_FILE, JSON.stringify(record) + '\n');
}

function appendDecision(text) {
  fs.appendFileSync(DECISIONS_FILE, text + '\n');
  console.log(`[Decision] ${text}`);
}

function checkScenarioB(spot, totalMins, timeStr) {
  if (spot === null) return { state: bState, activeFloor, activeCeiling, testLow, testHigh, note: 'spot null' };

  // Prior to 09:25: IDLE
  if (totalMins < 9 * 60 + 25) {
    return { state: 'IDLE', activeFloor, activeCeiling, testLow, testHigh, note: 'Watching opening 09:15-09:25' };
  }

  // After 09:45: Window closed
  if (totalMins >= 9 * 60 + 45) {
    if (bState !== 'WINDOW_CLOSED') {
      bState = 'WINDOW_CLOSED';
      appendDecision(`${timeStr} B-PHASE: 09:45 reached. Scenario B trigger window closed. Total triggers: ${triggerAttempts}. Scenario B finishes with 0 trades (flat).`);
    }
    return { state: 'WINDOW_CLOSED', activeFloor, activeCeiling, testLow, testHigh, note: 'Window closed at 09:45' };
  }

  // Window 09:25 - 09:45
  if (bState === 'IDLE') {
    // Check arm conditions
    // Arm LONG if spot within 10 pts of active floor
    if (Math.abs(spot - activeFloor) <= 10 || spot < activeFloor) {
      bState = 'ARMED_LONG';
      testLow = spot;
      appendDecision(`${timeStr} B-ARM: B LONG arm @${spot}, active floor ${activeFloor}, testLow ${testLow}. Tracking for 2 consecutive closes >= 10 pts above testLow.`);
    } else if (Math.abs(spot - activeCeiling) <= 10 || spot > activeCeiling) {
      bState = 'ARMED_SHORT';
      testHigh = spot;
      appendDecision(`${timeStr} B-ARM: B SHORT arm @${spot}, active ceiling ${activeCeiling}, testHigh ${testHigh}. Tracking for 2 consecutive closes <= 10 pts below testHigh.`);
    }
  }

  if (bState === 'ARMED_LONG') {
    if (spot < testLow) {
      testLow = spot;
    }
    closeBuffer.push(spot);
    if (closeBuffer.length > 5) closeBuffer.shift();

    // Check trigger condition: 2 consecutive closes >= testLow + 10 and latest > previous
    if (closeBuffer.length >= 2) {
      const c1 = closeBuffer[closeBuffer.length - 2];
      const c2 = closeBuffer[closeBuffer.length - 1];
      if (c1 >= testLow + 10 && c2 >= testLow + 10 && c2 > c1 && triggerAttempts < 2) {
        // Trigger check: stop = testLow - 8
        const stop = testLow - 8;
        const stopDist = c2 - stop;
        triggerAttempts++;
        if (stopDist > 25) {
          bState = 'TRIGGER_BLOCKED';
          appendDecision(`${timeStr} B-BLOCKED: Scenario B LONG reclaim pattern completed (c1=${c1}, c2=${c2} > testLow ${testLow} + 10). TRIGGER BLOCKED: Stop level ${stop.toFixed(2)} (testLow - 8) is ${stopDist.toFixed(2)} pts away from entry (${c2}), exceeding 25-pt limit. Trade skipped.`);
        } else {
          bState = 'TRIGGERED';
          const target = c2 + 30;
          appendDecision(`${timeStr} B-TRIGGER: B LONG trigger @${c2}, stop ${stop.toFixed(2)}, target ${target.toFixed(2)} (stop distance ${stopDist.toFixed(2)} pts).`);
        }
      }
    }
  }

  if (bState === 'ARMED_SHORT') {
    if (spot > testHigh) {
      testHigh = spot;
    }
    closeBuffer.push(spot);
    if (closeBuffer.length > 5) closeBuffer.shift();

    if (closeBuffer.length >= 2) {
      const c1 = closeBuffer[closeBuffer.length - 2];
      const c2 = closeBuffer[closeBuffer.length - 1];
      if (c1 <= testHigh - 10 && c2 <= testHigh - 10 && c2 < c1 && triggerAttempts < 2) {
        const stop = testHigh + 8;
        const stopDist = stop - c2;
        triggerAttempts++;
        if (stopDist > 25) {
          bState = 'TRIGGER_BLOCKED';
          appendDecision(`${timeStr} B-BLOCKED: Scenario B SHORT reclaim pattern completed (c1=${c1}, c2=${c2} < testHigh ${testHigh} - 10). TRIGGER BLOCKED: Stop level ${stop.toFixed(2)} (testHigh + 8) is ${stopDist.toFixed(2)} pts away from entry (${c2}), exceeding 25-pt limit. Trade skipped.`);
        } else {
          bState = 'TRIGGERED';
          const target = c2 - 30;
          appendDecision(`${timeStr} B-TRIGGER: B SHORT trigger @${c2}, stop ${stop.toFixed(2)}, target ${target.toFixed(2)} (stop distance ${stopDist.toFixed(2)} pts).`);
        }
      }
    }
  }

  return { state: bState, activeFloor, activeCeiling, testLow, testHigh, note: `Trigger attempts: ${triggerAttempts}` };
}

async function collectTick() {
  const { timeStr, totalMins } = getIST();
  const stateData = await pollOpsState();
  const snap = stateData?.snapshot;
  const spot = snap?.market?.spot ?? null;
  const sniper = snap?.engines?.sniper ?? {};
  const momentum = snap?.engines?.momentum ?? {};
  const positions = snap?.positions ?? [];

  // Range lock capture at 09:25
  if (totalMins >= 9 * 60 + 25 && !openingRangeLogged && sniper.state) {
    openingRangeLogged = true;
    appendDecision(`${timeStr} A-RANGE: 09:15-09:25 range check. Spot: ${spot}, Sniper state: ${sniper.state}, lastDecision: "${sniper.lastDecision}".`);
  }

  // Check decision changes
  if (sniper.lastDecision && sniper.lastDecision !== lastDecisionLogged) {
    appendDecision(`${timeStr} A-DECISION: "${sniper.lastDecision}" Spot: ${spot}`);
    lastDecisionLogged = sniper.lastDecision;
  }

  if (sniper.state && sniper.state !== lastSniperState) {
    appendDecision(`${timeStr} A-STATE: Switched from ${lastSniperState} to ${sniper.state}. Spot: ${spot}`);
    lastSniperState = sniper.state;
  }

  // Scenario B update
  const bData = checkScenarioB(spot, totalMins, timeStr);

  // Build minute record
  const record = {
    t: timeStr,
    spot: spot,
    sniper: {
      state: sniper.state ?? 'UNKNOWN',
      armed: sniper.armed ?? false,
      lastDecision: sniper.lastDecision ?? ''
    },
    momentum: {
      state: momentum.state ?? 'UNKNOWN',
      lastGate: momentum.lastGate ?? ''
    },
    positions: positions.map(p => ({
      strategy: p.strategy,
      symbol: p.symbol,
      entry: p.entry,
      ltp: p.ltp,
      stop: p.stop,
      target: p.target
    })),
    hist: {
      pcr: snap?.market?.pcr ?? null,
      callWall: activeCeiling,
      putWall: activeFloor,
      activeFloor: activeFloor,
      activeCeiling: activeCeiling
    },
    B: bData,
    dataOk: !stateData?.stale && spot !== null,
    issues: stateData?.stale ? ['state stale'] : []
  };

  appendMinute(record);
  console.log(`[${timeStr}] Minute logged: spot=${spot}, sniper=${sniper.state}, B=${bData.state}`);
}

// Scheduled checkpoints
const scheduledTimes = ['08:58', '09:20', '09:29', '09:44', '10:30', '12:30', '15:15'];
const snapshotsTaken = {};
scheduledTimes.forEach(t => snapshotsTaken[t] = false);

async function loop() {
  const { totalMins, h, m, s, timeStr } = getIST();

  // Sensibull snapshot checkpoints
  const hm = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  if (snapshotsTaken[hm] === false) {
    snapshotsTaken[hm] = true;
    console.log(`[Sensibull] Triggering scheduled snapshot at ${hm}...`);
    appendDecision(`${timeStr} OI-SNAPSHOT: Triggering scheduled Sensibull read for ${hm}`);
    await triggerSnapshot();
  }

  // Only log minute ticks starting at 09:14:00 (or if user requests earlier)
  if (totalMins >= 9 * 60 + 14) {
    await collectTick().catch(e => console.error('collectTick error:', e));
  } else {
    // Pre-market status check every minute
    if (s < 10) {
      const stateData = await pollOpsState();
      console.log(`[${timeStr}] Pre-market idle: ageSec=${stateData?.ageSec}, spot=${stateData?.snapshot?.market?.spot}`);
    }
  }

  // Check EOD at 15:35
  if (totalMins >= (15 * 60 + 35)) {
    console.log('[EOD] 15:35 reached. Live collection finished.');
    appendDecision(`${timeStr} EOD-CLOSE: Market session closed at 15:35. Live collection completed.`);
    process.exit(0);
  }

  // In fast window (09:14 to 10:35): sleep until next minute boundary (~60s)
  // In slow window (10:35 to 15:35): sleep 5 mins
  // In pre-market (< 09:14): sleep 15s to catch exact snapshot minutes
  let delayMs = 15_000;
  if (totalMins >= 9 * 60 + 14 && totalMins <= 10 * 60 + 35) {
    delayMs = 60_000;
  } else if (totalMins > 10 * 60 + 35) {
    delayMs = 300_000;
  }

  setTimeout(loop, delayMs);
}

console.log(`[LiveMonitorCollector_20261119] Started for ${TODAY} at ${getIST().timeStr}`);
loop();
