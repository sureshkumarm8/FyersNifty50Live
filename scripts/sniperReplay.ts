/**
 * SNIPER MULTI-DAY REPLAY
 * -----------------------
 * Replays archived market_history_log CSVs through the REAL live code
 * (services/sniperEngine.ts + EnhancedSignalGenerator), alongside the
 * wall-reclaim prototype and a naive baseline, and prints a per-day trade list
 * plus a summary.
 *
 * Unlike ml/backtest/sniperCore.mjs (a reimplementation of the rules), nothing
 * here restates the engine, so a change to the engine shows up directly.
 *
 * Usage:
 *   npm run replay:sniper                       # default archive folders
 *   npm run replay:sniper -- <dir|file> ...     # explicit sources
 *
 * Archives are exported repeatedly and named by export time, so every file is
 * merged by its `timestamp` column and regrouped by IST day. A day is used only
 * if it has the full schema, at least 6 minutes of the 09:15-09:25 range and 55
 * minutes of 09:15-10:30.
 *
 * Limits: spot points, no costs. Decisions are taken on each logged snapshot
 * (~30-60s apart), so stops realise worse than their nominal size. The morning
 * thesis and the AI risk officer are not replayed (both can only subtract).
 * Option-flow fields from 2026-11-12 to 2026-11-17 are corrupt (strike list
 * capped at 25000) and 10-22 / 10-27 / 11-11 logged zero OI.
 */
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { buildOpeningRange, evaluate, checkExit, istMinutesOf, istDayKey } from '../services/sniperEngine';
import { EnhancedSignalGenerator } from '../services/enhancedSignalGenerator';
import type { MarketSnapshot } from '../types';

type Row = MarketSnapshot & { timestamp: number };
type Side = 'LONG' | 'SHORT';
interface Trade {
  side: Side;
  entryAt: string;
  entry: number;
  exitAt: string;
  exit: number;
  pts: number;
  reason: string;
}

const OPEN = 555;   // 09:15
const ENTRY = 565;  // 09:25
const NO_NEW = 585; // 09:45
const FLAT = 630;   // 10:30
const REQUIRED = ['timestamp', 'niftyLtp', 'overallSent', 'pcr', 'optionsSent', 'callsBuyQty'];

// --- loading ----------------------------------------------------------------

const DEFAULT_SOURCES = [
  path.join(os.homedir(), 'Downloads/TRADING_FINANCE/Market_History'),
  path.join(os.homedir(), 'Downloads')
];

function csvFiles(source: string, recursive: boolean): string[] {
  if (!fs.existsSync(source)) return [];
  if (fs.statSync(source).isFile()) return [source];
  return fs.readdirSync(source, { withFileTypes: true }).flatMap(e => {
    const full = path.join(source, e.name);
    if (e.isDirectory()) return recursive ? csvFiles(full, true) : [];
    return /^market_history_log_.*\.csv$/.test(e.name) ? [full] : [];
  });
}

/** Quoted-CSV line split; the history export quotes every field. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '', quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (quoted) {
      if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') quoted = false;
      else cur += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function readFile(file: string): Row[] {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const hdr = splitCsvLine(lines[0]);
  if (!REQUIRED.every(k => hdr.includes(k))) return [];
  return lines.slice(1).flatMap(line => {
    const v = splitCsvLine(line);
    const o: any = {};
    hdr.forEach((h, i) => {
      const raw = v[i] ?? '';
      o[h] = h === 'time' || h === 'oiLadder' ? raw : raw === '' ? null : Number(raw);
    });
    return isFinite(o.timestamp) && o.niftyLtp > 0 ? [o as Row] : [];
  });
}

/** Merge every source by timestamp and regroup by IST day. */
function loadDays(sources: string[]): Map<string, Row[]> {
  const byDay = new Map<string, Map<number, Row>>();
  const files = sources.flatMap(s => csvFiles(s, s !== DEFAULT_SOURCES[1]));
  for (const f of files) {
    for (const r of readFile(f)) {
      const day = istDayKey(r.timestamp);
      if (!byDay.has(day)) byDay.set(day, new Map());
      byDay.get(day)!.set(r.timestamp, r);
    }
  }
  const usable = new Map<string, Row[]>();
  for (const [day, rows] of [...byDay].sort(([a], [b]) => a.localeCompare(b))) {
    const sorted = [...rows.values()].sort((a, b) => a.timestamp - b.timestamp);
    const minutes = new Set(sorted.map(M).filter(m => m >= OPEN && m <= FLAT));
    const opening = [...minutes].filter(m => m < ENTRY).length;
    if (minutes.size >= 55 && opening >= 6) usable.set(day, sorted);
  }
  console.log(`${files.length} files, ${byDay.size} days found, ${usable.size} usable`);
  return usable;
}

const M = (r: Row) => istMinutesOf(new Date(r.timestamp));

// --- A/B: the real engine ---------------------------------------------------

function engine(rows: Row[], pcrMode: 'recorded' | 'off'): Trade[] {
  const trades: Trade[] = [];
  let range: any = null, pos: any = null, peak = 0, done = false, entryAt = '';
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i], now = new Date(r.timestamp), m = M(r);
    if (m < OPEN || m > FLAT + 5) continue;
    const hist = rows.slice(0, i + 1).reverse();
    // The live panel persists the range once the entry window opens.
    range = buildOpeningRange(hist, null, now, range && m >= ENTRY ? range : null) ?? range;
    if (pos) {
      const pts = (r.niftyLtp - pos.entrySpot) * (pos.direction === 'LONG' ? 1 : -1);
      peak = Math.max(peak, pts);
      const x = checkExit({ setup: pos, spot: r.niftyLtp, now, peakPoints: peak });
      if (x.exit) {
        trades.push({ side: pos.direction, entryAt, entry: pos.entrySpot, exitAt: r.time, exit: r.niftyLtp, pts: +pts.toFixed(1), reason: x.reason! });
        pos = null;
      }
    }
    if (pos || done) continue;
    const s = hist.length >= 5
      ? EnhancedSignalGenerator.generateSignal(hist, range?.support ?? r.niftyLtp - 50, range?.resistance ?? r.niftyLtp + 50, r.niftyLtp)
      : { direction: 'NEUTRAL' as const, confidence: 0, reasons: [] as string[] };
    const ev = evaluate({
      now,
      spot: r.niftyLtp,
      range,
      signalDirection: s.direction,
      signalConfidence: s.confidence,
      signalReasons: s.reasons,
      hasOpenPosition: false,
      dailyTradeDone: done,
      expiry: '000000',
      pcr: pcrMode === 'off' ? null : r.pcr,
      thesis: null
    });
    if (ev.canEnter && ev.setup) {
      pos = { ...ev.setup, entrySpot: r.niftyLtp };
      peak = 0;
      done = true;
      entryAt = r.time;
    }
  }
  return trades;
}

// --- C/D: wall-reclaim prototype --------------------------------------------
// Rules were fixed from the manual process before any result was seen; do not
// tune them on this archive.
// Wall = opening-range extreme (09:15-09:25). Arm when price tests within 10 of
// it during 09:25-09:45. Trigger on two consecutive 1-min closes >= 10 pts off
// the test extreme and still moving away (optionally breadth agreeing over
// 3 min). Stop = test extreme -/+ 8, skipped if risk > 25. Target +30. Flat at
// 10:30. At most 2 attempts a day.

function wallReclaim(rows: Row[], useBreadth: boolean): Trade[] {
  const bars: Row[] = [];
  for (const r of rows) {
    if (bars.length && M(bars[bars.length - 1]) === M(r)) bars[bars.length - 1] = r;
    else bars.push(r);
  }
  const orPx = rows.filter(r => M(r) >= OPEN && M(r) < ENTRY).map(r => r.niftyLtp);
  if (orPx.length < 3) return [];
  const hi = Math.max(...orPx), lo = Math.min(...orPx);

  const trades: Trade[] = [];
  let attempts = 0, testLow: number | null = null, testHigh: number | null = null;
  let pos: { side: Side; entry: number; stop: number; at: string } | null = null;

  for (let i = 0; i < bars.length; i++) {
    const b = bars[i], m = M(b), px = b.niftyLtp;
    if (m < ENTRY) continue;
    if (pos) {
      const sign = pos.side === 'LONG' ? 1 : -1;
      // Every snapshot inside the minute, stop checked before target.
      let hit: { r: Row; reason: string } | null = null;
      for (const r of rows.filter(r => M(r) === m)) {
        if (sign * (r.niftyLtp - pos.stop) <= 0) { hit = { r, reason: 'STOP' }; break; }
        if (sign * (r.niftyLtp - pos.entry) >= 30) { hit = { r, reason: 'TARGET' }; break; }
      }
      if (!hit && m >= FLAT) hit = { r: b, reason: 'TIME' };
      if (hit) {
        trades.push({ side: pos.side, entryAt: pos.at, entry: pos.entry, exitAt: hit.r.time, exit: hit.r.niftyLtp, pts: +(sign * (hit.r.niftyLtp - pos.entry)).toFixed(1), reason: hit.reason });
        pos = null;
        testLow = testHigh = null;
      }
      continue;
    }
    if (m >= NO_NEW || attempts >= 2) continue;
    if (px <= lo + 10) testLow = testLow == null ? px : Math.min(testLow, px);
    if (px >= hi - 10) testHigh = testHigh == null ? px : Math.max(testHigh, px);
    const prev = bars[i - 1]?.niftyLtp, b3 = bars[i - 3];
    const breadthUp = !useBreadth || (!!b3 && b.overallSent > b3.overallSent);
    const breadthDn = !useBreadth || (!!b3 && b.overallSent < b3.overallSent);
    if (testLow != null && prev != null && px >= testLow + 10 && prev >= testLow + 10 && px > prev && breadthUp) {
      const stop = testLow - 8;
      if (px - stop <= 25) { pos = { side: 'LONG', entry: px, stop, at: b.time }; attempts++; continue; }
    }
    if (testHigh != null && prev != null && px <= testHigh - 10 && prev <= testHigh - 10 && px < prev && breadthDn) {
      const stop = testHigh + 8;
      if (stop - px <= 25) { pos = { side: 'SHORT', entry: px, stop, at: b.time }; attempts++; }
    }
  }
  return trades;
}

// --- E: naive baseline: 09:25 in the direction of the opening drift, +30/-15 -

function naive(rows: Row[]): Trade[] {
  const or = rows.filter(r => M(r) >= OPEN && M(r) < ENTRY);
  const e = rows.find(r => M(r) >= ENTRY);
  if (or.length < 3 || !e) return [];
  const side: Side = e.niftyLtp >= or[0].niftyLtp ? 'LONG' : 'SHORT';
  const sign = side === 'LONG' ? 1 : -1;
  for (const r of rows.filter(r => r.timestamp > e.timestamp)) {
    const p = (r.niftyLtp - e.niftyLtp) * sign;
    if (p <= -15 || p >= 30 || M(r) >= FLAT) {
      return [{ side, entryAt: e.time, entry: e.niftyLtp, exitAt: r.time, exit: r.niftyLtp, pts: +p.toFixed(1), reason: p <= -15 ? 'STOP' : p >= 30 ? 'TARGET' : 'TIME' }];
    }
  }
  return [];
}

// --- report -----------------------------------------------------------------

const STRATEGIES: Record<string, (rows: Row[]) => Trade[]> = {
  'A engine (as live)': r => engine(r, 'recorded'),
  'B engine, PCR gate off': r => engine(r, 'off'),
  'C wall-reclaim +breadth': r => wallReclaim(r, true),
  'D wall-reclaim, no breadth': r => wallReclaim(r, false),
  'E naive 09:25 drift': naive
};

const describe = (t: Trade[]) =>
  t.length ? t.map(x => `${x.side[0]}@${x.entryAt.slice(0, 5)} ${x.pts > 0 ? '+' : ''}${x.pts} ${x.reason}`).join(' | ') : '—';

function main() {
  const args = process.argv.slice(2);
  const days = loadDays(args.length ? args : DEFAULT_SOURCES);
  const all: Record<string, Trade[]> = Object.fromEntries(Object.keys(STRATEGIES).map(k => [k, []]));

  for (const [day, rows] of days) {
    const w = rows.filter(r => M(r) >= ENTRY && M(r) <= FLAT).map(r => r.niftyLtp);
    const or = rows.filter(r => M(r) >= OPEN && M(r) < ENTRY).map(r => r.niftyLtp);
    console.log(`\n${day}  OR ${Math.round(Math.max(...or) - Math.min(...or))}pt  09:25-10:30 range ${Math.round(Math.max(...w) - Math.min(...w))}pt  (${Math.round(w[0])} → ${Math.round(w[w.length - 1])})`);
    for (const [name, run] of Object.entries(STRATEGIES)) {
      const t = run(rows);
      all[name].push(...t);
      console.log(`  ${name.padEnd(28)} ${describe(t)}`);
    }
  }

  console.log('\n=== SUMMARY (spot points; ~0.85x on a 250-ITM option) ===');
  for (const [name, t] of Object.entries(all)) {
    const wins = t.filter(x => x.pts > 0);
    const net = t.reduce((a, x) => a + x.pts, 0);
    const grossWin = wins.reduce((a, x) => a + x.pts, 0);
    const grossLoss = -t.filter(x => x.pts <= 0).reduce((a, x) => a + x.pts, 0);
    let eq = 0, peak = 0, dd = 0;
    t.forEach(x => { eq += x.pts; peak = Math.max(peak, eq); dd = Math.max(dd, peak - eq); });
    console.log(
      `${name.padEnd(28)} trades ${String(t.length).padStart(2)}  win ${t.length ? Math.round((100 * wins.length) / t.length) : 0}%` +
      `  net ${net.toFixed(0).padStart(5)}  avg ${t.length ? (net / t.length).toFixed(1) : '0'}` +
      `  PF ${grossLoss ? (grossWin / grossLoss).toFixed(2) : '∞'}  maxDD ${dd.toFixed(0)}`
    );
  }
}

main();
