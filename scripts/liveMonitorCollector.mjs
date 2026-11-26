import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const JOURNAL_DIR = path.join(ROOT, 'TradingJournal', TODAY, 'live-monitor');
const MINUTE_FILE = path.join(JOURNAL_DIR, 'minute.jsonl');
const OI_FILE = path.join(JOURNAL_DIR, 'oi.jsonl');
const DECISIONS_FILE = path.join(JOURNAL_DIR, 'decisions.md');

fs.mkdirSync(JOURNAL_DIR, { recursive: true });

function getIST() {
  const d = new Date();
  const istStr = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
  const [h, m, s] = istStr.split(':').map(Number);
  return { timeStr: istStr, totalMins: h * 60 + m, h, m, s };
}

let lastDecisionLogged = null;
let testLow = 25232.9;

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

async function collectTick() {
  const { timeStr, totalMins, s } = getIST();
  const stateData = await pollOpsState();
  const snap = stateData?.snapshot;
  const spot = snap?.market?.spot ?? null;
  const sniper = snap?.engines?.sniper ?? {};
  const momentum = snap?.engines?.momentum ?? {};
  const positions = snap?.positions ?? [];

  if (spot && spot < testLow) {
    testLow = spot;
  }

  // Check decision changes
  if (sniper.lastDecision && sniper.lastDecision !== lastDecisionLogged) {
    appendDecision(`${timeStr} A-DECISION: "${sniper.lastDecision}" Spot: ${spot}`);
    lastDecisionLogged = sniper.lastDecision;
  }

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
      pcr: 1.06,
      callWall: 25500,
      putWall: 25000,
      activeFloor: 25200
    },
    B: {
      state: totalMins < 9 * 60 + 45 ? 'ARMED_LONG' : 'WINDOW_CLOSED',
      wall: 25200,
      testLow: testLow,
      note: totalMins < 9 * 60 + 45 ? `Monitoring testLow ${testLow}` : 'Window closed at 09:45; 0 trades entered.'
    },
    dataOk: !stateData?.stale && spot !== null,
    issues: stateData?.stale ? ['state stale'] : []
  };

  appendMinute(record);
  console.log(`[${timeStr}] Minute logged: spot=${spot}, sniper=${sniper.state}, positions=${positions.length}`);
}

// Scheduled reads
let sensibullTaken = {
  '10:30': false,
  '12:30': false,
  '15:15': false
};

async function loop() {
  const { totalMins, h, m, timeStr } = getIST();

  // Determine interval: 1 min if <= 10:35, 5 min thereafter
  const inFastWindow = totalMins <= (10 * 60 + 35);

  await collectTick().catch(e => console.error('collectTick error:', e));

  // Sensibull checkpoints
  const hm = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  if (sensibullTaken[hm] === false) {
    sensibullTaken[hm] = true;
    console.log(`[Sensibull] Triggering scheduled snapshot at ${hm}...`);
    appendDecision(`${timeStr} OI-SNAPSHOT: Triggering scheduled Sensibull read for ${hm}`);
    await triggerSnapshot();
  }

  // Check EOD at 15:35
  if (totalMins >= (15 * 60 + 35)) {
    console.log('[EOD] 15:35 reached. Live collection finished.');
    process.exit(0);
  }

  const delayMs = inFastWindow ? 60_000 : 300_000;
  setTimeout(loop, delayMs);
}

console.log(`[LiveMonitorCollector] Started for ${TODAY} at ${getIST().timeStr}`);
loop();
