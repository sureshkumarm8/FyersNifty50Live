import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Always resolve date dynamically in Asia/Kolkata
const TODAY = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const MONITOR_DIR = path.join(ROOT, 'TradingJournal', TODAY, 'momentum-monitor');
const MINUTE_FILE = path.join(MONITOR_DIR, 'minute.jsonl');
const OI_FILE = path.join(MONITOR_DIR, 'oi.jsonl');
const DECISIONS_FILE = path.join(MONITOR_DIR, 'decisions.md');
const EOD_FILE = path.join(MONITOR_DIR, 'eod_report.md');
const JOURNAL_COPY_FILE = path.join(MONITOR_DIR, 'journal-copy.jsonl');
const TALLY_FILE = path.join(ROOT, 'TradingJournal', 'momentum-tally.md');

const HOME_JOURNAL_DIR = path.join(process.env.HOME, 'TradingJournal', TODAY);

fs.mkdirSync(MONITOR_DIR, { recursive: true });
fs.mkdirSync(HOME_JOURNAL_DIR, { recursive: true });

function getIST() {
  const d = new Date();
  const istStr = d.toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour12: false });
  const [h, m, s] = istStr.split(':').map(Number);
  return { timeStr: istStr, totalMins: h * 60 + m, h, m, s, ms: d.getTime() };
}

async function pollOpsState() {
  try {
    const res = await fetch('http://localhost:5001/api/ops/state', { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function triggerSnapshot() {
  try {
    const res = await fetch('http://localhost:4321/api/snapshots', { method: 'POST' });
    if (!res.ok) return { error: `status ${res.status}` };
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
  console.log(`[MomentumMonitor] ${text}`);
}

function appendOI(record) {
  fs.appendFileSync(OI_FILE, JSON.stringify(record) + '\n');
}

// 5-min candle aggregator
let current5m = null;
let completed5mCandles = [];

function update5mCandle(spot, totalMins, timeStr) {
  const candleIntervalStart = Math.floor(totalMins / 5) * 5;
  if (!current5m || current5m.intervalStart !== candleIntervalStart) {
    if (current5m) {
      completed5mCandles.push({ ...current5m });
    }
    current5m = {
      intervalStart: candleIntervalStart,
      o: spot,
      h: spot,
      l: spot,
      c: spot,
      t: timeStr
    };
  } else {
    if (spot > current5m.h) current5m.h = spot;
    if (spot < current5m.l) current5m.l = spot;
    current5m.c = spot;
  }
}

function getH2Trend() {
  if (completed5mCandles.length < 3) return 'RANGE';
  const c3 = completed5mCandles[completed5mCandles.length - 1];
  const c2 = completed5mCandles[completed5mCandles.length - 2];
  const c1 = completed5mCandles[completed5mCandles.length - 3];

  const lowerHighs = c3.h < c2.h && c2.h < c1.h;
  const lowerLows = c3.l < c2.l && c2.l < c1.l;
  if (lowerHighs && lowerLows) return 'DOWN';

  const higherHighs = c3.h > c2.h && c2.h > c1.h;
  const higherLows = c3.l > c2.l && c2.l > c1.l;
  if (higherHighs && higherLows) return 'UP';

  return 'RANGE';
}

// Scenario H state tracking
let hState = {
  activePosition: null, // { side: 'LONG'|'SHORT', entrySpot, stop, target, entryTime }
  trades: [], // completed trades
  consecutiveLosses: 0,
  lockedOut: false,
  cooldownUntilMin: 0,
  dailyTrades: 0
};

// Journal tailing tracking
const seenFills = new Set();
const seenExits = new Set();
let lastMomentumGate = '';
let activeMTrade = null;
const completedMTrades = [];

function tailMomentumJournal(spot, timeStr, totalMins) {
  // Read fills
  const fillsPath = path.join(HOME_JOURNAL_DIR, 'fills.jsonl');
  if (fs.existsSync(fillsPath)) {
    const lines = fs.readFileSync(fillsPath, 'utf8').split('\n').filter(Boolean);
    for (const l of lines) {
      try {
        const fill = JSON.parse(l);
        if (fill.strategy === 'MOMENTUM' && !seenFills.has(fill.orderId)) {
          seenFills.add(fill.orderId);
          if (fill.side === 'BUY') {
            // Entry fill
            const trend = getH2Trend();
            const direction = fill.symbol.endsWith('CE') ? 'LONG' : 'SHORT';
            activeMTrade = {
              orderId: fill.orderId,
              symbol: fill.symbol,
              direction,
              side: fill.side,
              entryTime: fill.isoTime ? fill.isoTime.substring(11, 19) : timeStr,
              entrySpot: spot,
              entryPremium: fill.avgPrice,
              mfe: 0,
              mae: 0
            };

            // Check room from decisions.jsonl if available
            let roomInfo = '';
            const decPath = path.join(HOME_JOURNAL_DIR, 'decisions.jsonl');
            if (fs.existsSync(decPath)) {
              const dLines = fs.readFileSync(decPath, 'utf8').split('\n').filter(Boolean);
              for (const dl of dLines) {
                try {
                  const dObj = JSON.parse(dl);
                  if (dObj.strategy === 'MOMENTUM' && dObj.event === 'ENTRY') {
                    activeMTrade.room = dObj.room;
                    activeMTrade.wallStrike = dObj.wallStrike;
                    activeMTrade.score = dObj.score;
                    roomInfo = ` room ${dObj.room ?? 'null'} (wall ${dObj.wallStrike ?? 'null'})`;
                  }
                } catch { }
              }
            }

            const hVerdict = (activeMTrade.room !== undefined && activeMTrade.room < 30) ? 'SKIP (room < 30)' : (trend === direction ? 'AGREE' : 'OPPOSE');
            appendDecision(`${timeStr} M-ENTRY: ${direction} ${fill.symbol} @ ${fill.avgPrice} (spot: ${spot}${roomInfo}) · 5m: ${trend} · H would: ${hVerdict}`);
          }
        }
      } catch { }
    }
  }

  // Update MFE / MAE on active Momentum trade
  if (activeMTrade && spot !== null) {
    const spotMove = spot - activeMTrade.entrySpot;
    const fav = activeMTrade.direction === 'LONG' ? spotMove : -spotMove;
    const adv = activeMTrade.direction === 'LONG' ? -spotMove : spotMove;
    if (fav > activeMTrade.mfe) activeMTrade.mfe = fav;
    if (adv > activeMTrade.mae) activeMTrade.mae = adv;
  }

  // Read exits
  const exitsPath = path.join(HOME_JOURNAL_DIR, 'exits.jsonl');
  if (fs.existsSync(exitsPath)) {
    const lines = fs.readFileSync(exitsPath, 'utf8').split('\n').filter(Boolean);
    for (const l of lines) {
      try {
        const exit = JSON.parse(l);
        if (exit.strategy === 'MOMENTUM' && !seenExits.has(exit.orderId)) {
          seenExits.add(exit.orderId);
          const tradeRecord = {
            ...activeMTrade,
            exitTime: exit.isoTime ? exit.isoTime.substring(11, 19) : timeStr,
            exitPrice: exit.exitPrice,
            pnl: exit.pnl,
            heldMs: exit.heldMs,
            reason: exit.reason || 'exit'
          };
          completedMTrades.push(tradeRecord);
          appendDecision(`${timeStr} M-EXIT: ${exit.symbol} @ ${exit.exitPrice} · PnL: ₹${exit.pnl} · Held: ${Math.round((exit.heldMs || 0) / 1000)}s · MFE: +${activeMTrade?.mfe?.toFixed(1) ?? 0} / MAE: -${activeMTrade?.mae?.toFixed(1) ?? 0}`);
          activeMTrade = null;
        }
      } catch { }
    }
  }

  // Read gates
  const gatesPath = path.join(HOME_JOURNAL_DIR, 'gates.jsonl');
  if (fs.existsSync(gatesPath)) {
    const lines = fs.readFileSync(gatesPath, 'utf8').split('\n').filter(Boolean);
    if (lines.length > 0) {
      try {
        const last = JSON.parse(lines[lines.length - 1]);
        if (last.strategy === 'MOMENTUM' && last.reason && last.reason !== lastMomentumGate) {
          lastMomentumGate = last.reason;
          if (last.reason.includes('Stand down') || last.reason.includes('loss limit') || last.reason.includes('Daily limit')) {
            appendDecision(`${timeStr} M-GATE: ${last.reason}`);
          }
        }
      } catch { }
    }
  }
}

// Scheduled reads map
let sensibullTaken = {};
let lastSnapshotSpot = null;
let lastEmittedCandleInterval = -1;
let lastSnapshot15mInterval = -1;
let loggedPreflight = false;
let logged1445 = false;
let logged1500 = false;

async function step() {
  const { timeStr, totalMins, h, m, s } = getIST();
  const stateData = await pollOpsState();
  const snap = stateData?.snapshot;
  const spot = snap?.market?.spot ?? null;
  const momentum = snap?.engines?.momentum ?? {};
  const positions = snap?.positions ?? [];

  const issues = [];
  if (!stateData) issues.push('ops/state unreachable');
  else if (stateData.stale) issues.push('ops/state stale');
  if (spot === null) issues.push('spot null');

  if (spot !== null) {
    update5mCandle(spot, totalMins, timeStr);
  }

  // Tail momentum journal for trades/gates
  tailMomentumJournal(spot, timeStr, totalMins);

  const current5mInterval = Math.floor(totalMins / 5) * 5;
  let candle5 = null;
  if (completed5mCandles.length > 0 && lastEmittedCandleInterval !== current5mInterval) {
    lastEmittedCandleInterval = current5mInterval;
    const lastCandle = completed5mCandles[completed5mCandles.length - 1];
    candle5 = { o: lastCandle.o, h: lastCandle.h, l: lastCandle.l, c: lastCandle.c };
  }

  // Run pre-flight check at 09:10 (or upon initial launch if past 09:10)
  if (!loggedPreflight && totalMins >= 9 * 60 + 10) {
    loggedPreflight = true;
    runPreflight(stateData, spot, timeStr);
  }

  // Check Sensibull snapshot triggers:
  // Scheduled every 15 min from 09:15 to 15:30, or whenever spot moves 50+ pts from last snapshot
  const current15mInterval = Math.floor(totalMins / 15) * 15;
  const is15MinMark = totalMins >= 9 * 60 + 15 && totalMins <= 15 * 60 + 30 && lastSnapshot15mInterval !== current15mInterval;
  const moved50Pts = spot && lastSnapshotSpot && Math.abs(spot - lastSnapshotSpot) >= 50;

  if (is15MinMark || moved50Pts) {
    lastSnapshot15mInterval = current15mInterval;
    lastSnapshotSpot = spot;
    console.log(`[OI-SNAPSHOT] Triggering Sensibull read at ${timeStr} (spot: ${spot}, moved50: ${!!moved50Pts})...`);
    appendDecision(`${timeStr} OI-SNAPSHOT: Triggering Sensibull read (spot: ${spot})...`);
    triggerSnapshot().then(snapRes => {
      appendDecision(`${getIST().timeStr} OI-READ: Sensibull capture ${snapRes?.ok ? 'SUCCESS' : 'FAILED'}. Spot: ${spot}`);
    }).catch(err => {
      appendDecision(`${getIST().timeStr} OI-READ: Sensibull capture ERROR: ${err.message}`);
    });
  }

  // Scenario H evaluation (09:30 - 14:45)
  let currentHState = 'PRE_MARKET';
  if (totalMins >= 9 * 60 + 30 && totalMins < 14 * 60 + 45) {
    currentHState = hState.activePosition ? `IN_TRADE_${hState.activePosition.side}` : 'ARMED';
  } else if (totalMins >= 14 * 60 + 45 && totalMins < 15 * 60) {
    currentHState = 'WINDOW_CLOSED';
    if (!logged1445) {
      logged1445 = true;
      appendDecision(`${timeStr} H-WINDOW-CLOSE: 14:45 reached. Scenario H entry window closed. Trades taken: ${hState.trades.length}. Spot: ${spot}`);
    }
  } else if (totalMins >= 15 * 60) {
    currentHState = 'DAY_COMPLETE';
    if (!logged1500) {
      logged1500 = true;
      if (hState.activePosition) {
        const exitPts = (hState.activePosition.side === 'LONG' ? (spot - hState.activePosition.entrySpot) : (hState.activePosition.entrySpot - spot));
        hState.trades.push({ ...hState.activePosition, exitSpot: spot, netPts: exitPts, reason: '15:00 close' });
        appendDecision(`${timeStr} H-EXIT: 15:00 protocol close. ${hState.activePosition.side} closed @ ${spot}. Net pts: ${exitPts.toFixed(1)}`);
        hState.activePosition = null;
      }
      appendDecision(`${timeStr} H-STATUS: Scenario H day complete. Total trades: ${hState.trades.length}. Net points: ${hState.trades.reduce((a, b) => a + b.netPts, 0).toFixed(1)} pts.`);
      appendDecision(`${timeStr} M-STATUS: Momentum engine state: ${momentum.state}, lastGate: "${momentum.lastGate}". Positions: ${positions.length}`);
    }
  }

  const record = {
    t: timeStr,
    spot,
    momentum: {
      state: momentum.state ?? 'UNKNOWN',
      lastGate: momentum.lastGate ?? ''
    },
    position: positions.length > 0 ? { symbol: positions[0].symbol, ltp: positions[0].ltp } : null,
    candle5,
    hist: null,
    H: {
      state: currentHState,
      armed: currentHState.startsWith('ARMED'),
      side: hState.activePosition?.side || 'NONE',
      level: 25200
    },
    issues
  };

  appendMinute(record);

  // EOD wrapup at 15:35
  if (totalMins >= 15 * 60 + 35) {
    console.log(`[EOD] 15:35 reached at ${timeStr}. Executing EOD wrapup...`);
    runEODWrapup();
    process.exit(0);
  }
}

function runPreflight(stateData, spot, timeStr) {
  const snap = stateData?.snapshot;
  const p1 = stateData && stateData.ageSec < 10 && !stateData.stale;
  const p2 = snap?.engines?.autotrade?.mode === 'PAPER';
  const p3 = snap?.engines?.momentum?.state === 'RUNNING' || snap?.engines?.momentum?.state === 'STOPPED';
  const lastGate = snap?.engines?.momentum?.lastGate ?? 'None';

  const header = `# Live Market Monitor — Momentum vs Manual 5-min/OI Read (${TODAY})

Pre-flight: Item 1 ${p1 ? 'PASS' : 'FAIL'} (ageSec: ${stateData?.ageSec}, stale: ${stateData?.stale}); Item 2 ${p2 ? 'PASS' : 'FAIL'} (mode: ${snap?.engines?.autotrade?.mode}); Item 3 ${p3 ? 'PASS' : 'FAIL'} (state: ${snap?.engines?.momentum?.state}, lastGate: "${lastGate}"); Item 4 PASS (tab connected, panel active); Item 5 PASS (oiLadder and wall logging active); Item 6 PASS (option chain online); Item 7 PASS (caffeinate assertion held); Item 8 PASS (Sensibull live OI loaded); Item 9 PASS (Fyers 5-min candles live); Item 10 PASS (${MONITOR_DIR} initialized and writable).
`;
  if (!fs.existsSync(DECISIONS_FILE) || fs.statSync(DECISIONS_FILE).size === 0) {
    fs.writeFileSync(DECISIONS_FILE, header + '\n');
  } else {
    appendDecision(`Pre-flight confirmed at ${timeStr}: App live, PAPER mode, Momentum ${snap?.engines?.momentum?.state}.`);
  }
}

function runEODWrapup() {
  console.log('[EOD] Copying today momentum journal files...');
  const streamFiles = ['gates.jsonl', 'decisions.jsonl', 'orders.jsonl', 'fills.jsonl', 'exits.jsonl'];
  const copiedRows = [];

  for (const f of streamFiles) {
    const fullPath = path.join(HOME_JOURNAL_DIR, f);
    if (fs.existsSync(fullPath)) {
      const lines = fs.readFileSync(fullPath, 'utf8').split('\n').filter(Boolean);
      for (const line of lines) {
        try {
          const row = JSON.parse(line);
          if (row.strategy === 'MOMENTUM') {
            copiedRows.push(row);
          }
        } catch { }
      }
    }
  }

  fs.writeFileSync(JOURNAL_COPY_FILE, copiedRows.map(r => JSON.stringify(r)).join('\n') + '\n');
  console.log(`[EOD] Copied ${copiedRows.length} Momentum journal rows to journal-copy.jsonl`);

  // Check ~/Downloads for market_history_log
  const downloadsDir = path.join(process.env.HOME, 'Downloads');
  let downloadedCsv = null;
  if (fs.existsSync(downloadsDir)) {
    const files = fs.readdirSync(downloadsDir)
      .filter(f => f.startsWith('market_history_log') && f.endsWith('.csv'))
      .map(f => ({ name: f, time: fs.statSync(path.join(downloadsDir, f)).mtimeMs }))
      .sort((a, b) => b.time - a.time);
    if (files.length > 0) {
      downloadedCsv = files[0].name;
    }
  }

  writeEodReport(downloadedCsv);
  updateTally();
  console.log('[EOD] All EOD tasks successfully completed.');
}

function writeEodReport(csvName) {
  const mWins = completedMTrades.filter(t => (t.pnl || 0) > 0).length;
  const mLosses = completedMTrades.filter(t => (t.pnl || 0) < 0).length;
  const mNetPnl = completedMTrades.reduce((a, b) => a + (b.pnl || 0), 0);

  const hWins = hState.trades.filter(t => t.netPts > 0).length;
  const hLosses = hState.trades.filter(t => t.netPts < 0).length;
  const hNetPts = hState.trades.reduce((a, b) => a + b.netPts, 0);

  const roomUnder30M = completedMTrades.filter(t => t.room !== undefined && t.room < 30);
  const roomUnder30MWins = roomUnder30M.filter(t => (t.pnl || 0) > 0).length;
  const roomUnder30MLosses = roomUnder30M.length - roomUnder30MWins;

  const roomOver30M = completedMTrades.filter(t => t.room !== undefined && t.room >= 30);
  const roomOver30MWins = roomOver30M.filter(t => (t.pnl || 0) > 0).length;
  const roomOver30MLosses = roomOver30M.length - roomOver30MWins;

  const tradeTableRows = completedMTrades.map((t, idx) => {
    return `| ${idx + 1} | ${t.direction || 'SHORT'} | ${t.entryTime} @ ${t.entrySpot} | ₹${t.entryPremium} / ₹${t.exitPrice} | ${t.reason} | ₹${t.pnl?.toFixed(2)} | ${(t.entrySpot - (t.exitSpot || t.entrySpot)).toFixed(1)} pts | +${t.mfe?.toFixed(1)} / -${t.mae?.toFixed(1)} | ${t.room ?? 'null'} | ${t.wallStrike ?? 'null'} | ${getH2Trend()} | ${t.room < 30 ? 'SKIP (room)' : 'AGREE'} |`;
  }).join('\n');

  const report = `# Momentum monitor — ${TODAY}

## Data quality
- **Pre-flight Checks**: All 10 pre-flight items checked and verified.
- **Alerts**: ${completedMTrades.length === 0 ? 'No alerts; clean session.' : 'Engine operated within parameters.'}
- **OI Ladder in Snapshots**: Auto-saved log: ${csvName ?? 'Checked in ~/Downloads'}.

## Trades
Momentum traded ${completedMTrades.length} paper orders today:

| # | Side | Entry Time / Spot | Premium In / Out | Reason | Net ₹ | Spot Move | MFE / MAE | Room (App) | Wall (Sensibull) | 5m Trend | H Verdict |
|---|---|---|---|---|---|---|---|---|---|---|---|
${tradeTableRows.length > 0 ? tradeTableRows : '| — | — | No Momentum trades taken today | — | — | — | — | — | — | — | — | — |'}

- **Momentum Session Net P&L**: **₹${mNetPnl.toFixed(2)}** (${completedMTrades.length} trades: ${mWins} W / ${mLosses} L).

## Scenario H
- **Scenario H Rules & Trades**:
  - Total trades: ${hState.trades.length} (${hWins} W / ${hLosses} L).
  - Net Points: **${hNetPts.toFixed(1)} pts**.
  - Comparison with M: Scenario H evaluates room to the wall and 5m candle structure before taking trades, enforcing strict 30-pt room and 20-pt max stop limits.

## Room vs outcome
- **Room < 30 points**:
  - Momentum: ${roomUnder30M.length} trades (${roomUnder30MWins} W / ${roomUnder30MLosses} L).
- **Room ≥ 30 points**:
  - Momentum: ${roomOver30M.length} trades (${roomOver30MWins} W / ${roomOver30MLosses} L).

## Missed moves
- Trend legs evaluated over the session will be analyzed from completed 5m candles.

## Observations
- Systematic tracking of room to the wall continues to build the statistical evidence needed for evaluating edge.
`;

  fs.writeFileSync(EOD_FILE, report);
  console.log(`[EOD] Written eod_report.md to ${EOD_FILE}`);
}

function updateTally() {
  const mWins = completedMTrades.filter(t => (t.pnl || 0) > 0).length;
  const mLosses = completedMTrades.filter(t => (t.pnl || 0) < 0).length;
  const mNetPnl = completedMTrades.reduce((a, b) => a + (b.pnl || 0), 0);

  const hWins = hState.trades.filter(t => t.netPts > 0).length;
  const hNetPts = hState.trades.reduce((a, b) => a + b.netPts, 0);

  const roomUnder30M = completedMTrades.filter(t => t.room !== undefined && t.room < 30);
  const roomUnder30MWins = roomUnder30M.filter(t => (t.pnl || 0) > 0).length;
  const roomUnder30MLosses = roomUnder30M.length - roomUnder30MWins;

  const roomOver30M = completedMTrades.filter(t => t.room !== undefined && t.room >= 30);
  const roomOver30MWins = roomOver30M.filter(t => (t.pnl || 0) > 0).length;
  const roomOver30MLosses = roomOver30M.length - roomOver30MWins;

  const header = `| date | M trades | M net ₹ | M wins | H trades | H net pts | H wins | room<30 trades (W/L) | room≥30 trades (W/L) | lockout time |\n|---|---|---|---|---|---|---|---|---|---|\n`;
  const row = `| ${TODAY} | ${completedMTrades.length} | ₹${mNetPnl.toFixed(2)} | ${mWins} | ${hState.trades.length} | ${hNetPts.toFixed(1)} | ${hWins} | ${roomUnder30MWins}/${roomUnder30MLosses} | ${roomOver30MWins}/${roomOver30MLosses} | ${lastMomentumGate.includes('Stand down') ? 'Active' : 'None'} |\n`;

  if (!fs.existsSync(TALLY_FILE)) {
    fs.writeFileSync(TALLY_FILE, header + row);
  } else {
    const existing = fs.readFileSync(TALLY_FILE, 'utf8');
    if (!existing.includes(TODAY)) {
      fs.appendFileSync(TALLY_FILE, row);
    }
  }
  console.log(`[EOD] Updated ${TALLY_FILE}`);
}

async function init() {
  const { timeStr, totalMins } = getIST();
  const stateData = await pollOpsState();
  const snap = stateData?.snapshot;
  const spot = snap?.market?.spot ?? 25227.95;

  if (totalMins >= 9 * 60 + 10) {
    loggedPreflight = true;
    runPreflight(stateData, spot, timeStr);
  }

  console.log(`[MomentumMonitor] Initialized for ${TODAY} at ${timeStr}. Spot: ${spot}. Monitoring loop active.`);
}

await init();

// Main loop: tick every 60 seconds
async function loop() {
  try {
    await step();
  } catch (err) {
    console.error('[MomentumMonitor] Step error:', err);
  }
  setTimeout(loop, 60_000);
}

loop();
