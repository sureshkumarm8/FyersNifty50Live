/**
 * Backtest of the wall-setup state machine (services/wallSetup.ts) on recorded sessions.
 *
 * Sources, best first, per day:
 *   1. ~/TradingJournal/history/<date>.jsonl   (scripts/exportHistory.mjs: 30s snapshots with oiLadder)
 *   2. ~/Downloads/market_history_log_*.csv     (the app's CSV export: 30s with oiLadder)
 *   3. ~/TradingJournal/<date>/state.jsonl spot (~1 min) + the Sniper rows' logged walls
 *
 * Every CONFIRMED plan is walked forward on 1-minute bars: stop (wall -/+ 5)
 * is checked before target (+30 or next wall - 5) inside a bar; unfinished
 * after 60 min = TIMEOUT at that bar's close. Signals only count 09:30-14:45.
 *
 *   npx tsx scripts/wallSetupReplay.ts [YYYY-MM-DD ...] [--events]
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { wallContext } from '../services/oiWalls';
import {
  Bar, PlanOutcome, SetupEvent, WallsAt, initialSetupState, scorePlan, stepWallSetup, toMinuteBars
} from '../services/wallSetup';

const HOME = os.homedir();
const JOURNAL = path.join(HOME, 'TradingJournal');
const args = process.argv.slice(2);
const SHOW_EVENTS = args.includes('--events');
const DAYS = args.filter(a => /^\d{4}-\d{2}-\d{2}$/.test(a));

interface Tick { t: number; spot: number; oiLadder?: string | null }
interface DaySource { label: string; ticks: Tick[]; wallsAt: (t: number) => WallsAt | null }

const hhmm = (t: number) => new Date(t).toLocaleTimeString('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit' });
const istDay = (t: number) => new Date(t).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
const istMin = (t: number) => { const [h, m] = hhmm(t).split(':').map(Number); return h * 60 + m; };
const readJsonl = (f: string) =>
  fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean) : [];

function ladderSource(label: string, ticks: Tick[]): DaySource {
  const laddered = ticks.filter(t => t.oiLadder);
  return {
    label,
    ticks,
    wallsAt: (t: number) => {
      // History newest-first up to t, as wallContext expects.
      const hist: { timestamp: number; oiLadder: string }[] = [];
      for (let i = laddered.length - 1; i >= 0 && hist.length < 40; i--) {
        if (laddered[i].t <= t) hist.push({ timestamp: laddered[i].t, oiLadder: laddered[i].oiLadder! });
      }
      if (!hist.length || t - hist[0].timestamp > 5 * 60_000) return null;
      const spot = ticks.filter(x => x.t <= t).pop()?.spot;
      if (!spot) return null;
      const w = wallContext(hist, spot, 5);
      return { floor: w.floor, floorOIChangePct: w.floorOIChangePct, ceiling: w.ceiling, ceilingOIChangePct: w.ceilingOIChangePct };
    }
  };
}

function csvRows(file: string): Tick[] {
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter(Boolean);
  // The app's export quotes every field; none contains a comma.
  const split = (l: string) => l.split(',').map(c => c.replace(/^"|"$/g, ''));
  const head = split(lines[0]);
  const iT = head.indexOf('timestamp'), iS = head.indexOf('niftyLtp'), iL = head.indexOf('oiLadder');
  return lines.slice(1).map(l => {
    const c = split(l);
    return { t: Number(c[iT]), spot: Number(c[iS]), oiLadder: c[iL] || null };
  }).filter(r => Number.isFinite(r.t) && r.spot > 0);
}

function loadDay(day: string): DaySource | null {
  const hist = path.join(JOURNAL, 'history', `${day}.jsonl`);
  if (fs.existsSync(hist)) {
    const ticks = readJsonl(hist).map((r: any) => ({ t: r.timestamp, spot: r.niftyLtp, oiLadder: r.oiLadder ?? null })).filter((r: Tick) => r.spot > 0);
    if (ticks.some((t: Tick) => t.oiLadder)) return ladderSource('history export (30s + oiLadder)', ticks);
  }
  const dl = path.join(HOME, 'Downloads');
  const csvs = fs.existsSync(dl) ? fs.readdirSync(dl).filter(f => /^market_history_log.*\.csv$/.test(f)) : [];
  for (const f of csvs) {
    const rows = csvRows(path.join(dl, f)).filter(r => istDay(r.t) === day);
    if (rows.length > 100 && rows.some(r => r.oiLadder)) return ladderSource(`CSV ${f} (30s + oiLadder)`, rows);
  }
  const stateF = path.join(JOURNAL, day, 'state.jsonl');
  if (!fs.existsSync(stateF)) return null;
  const ticks: Tick[] = readJsonl(stateF)
    .map((r: any) => ({ t: r.timestamp, spot: r.snapshot?.market?.spot }))
    .filter((r: Tick) => r.spot > 0 && istDay(r.t) === day);
  const wallRows = readJsonl(path.join(JOURNAL, day, 'decisions.jsonl'))
    .filter((r: any) => r.walls && Number.isFinite(r.walls.floor))
    .map((r: any) => ({ t: r.timestamp, w: r.walls }));
  if (!wallRows.length) return null;
  return {
    label: `journal (~1 min spot + ${wallRows.length} logged wall reads)`,
    ticks,
    wallsAt: (t: number) => {
      const row = [...wallRows].reverse().find(r => r.t <= t);
      if (!row || t - row.t > 15 * 60_000) return null;
      return { floor: row.w.floor, floorOIChangePct: row.w.floorOIChangePct, ceiling: row.w.ceiling, ceilingOIChangePct: row.w.ceilingOIChangePct };
    }
  };
}

interface Signal { day: string; ev: SetupEvent; out: PlanOutcome }

function replay(day: string): { src: DaySource; events: SetupEvent[]; signals: Signal[]; noWallBars: number; bars: Bar[] } | null {
  const src = loadDay(day);
  if (!src) return null;
  const bars = toMinuteBars(src.ticks).filter(b => istMin(b.t) >= 9 * 60 + 15 && istMin(b.t) <= 15 * 60 + 30);
  const state = initialSetupState();
  const events: SetupEvent[] = [];
  const signals: Signal[] = [];
  let noWallBars = 0;
  for (const b of bars) {
    const walls = src.wallsAt(b.t + 59_000);
    if (!walls) { noWallBars++; continue; }
    for (const ev of stepWallSetup(state, b, walls)) {
      events.push(ev);
      const m = istMin(ev.t);
      if (ev.stage === 'CONFIRMED' && ev.plan && m >= 9 * 60 + 30 && m <= 14 * 60 + 45) {
        signals.push({ day, ev, out: scorePlan(ev.plan, ev.t, bars) });
      }
    }
  }
  return { src, events, signals, noWallBars, bars };
}

const days = DAYS.length
  ? DAYS
  : fs.readdirSync(JOURNAL).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();

const all: Signal[] = [];
for (const day of days) {
  const r = replay(day);
  if (!r) continue;
  const failures = r.events.filter(e => e.stage === 'FAILED');
  console.log(`\n=== ${day} · ${r.src.label} · ${r.bars.length} bars${r.noWallBars ? ` (${r.noWallBars} without walls)` : ''} ===`);
  if (SHOW_EVENTS) for (const e of r.events) console.log(`  ${hhmm(e.t)} ${e.side.padEnd(5)} ${e.stage.padEnd(9)} ${Math.round(e.spot)}  ${e.note}`);
  for (const f of failures) console.log(`  ${hhmm(f.t)} ${f.side} FAILED   wall ${f.wall} · ${f.note}`);
  for (const s of r.signals) {
    const p = s.ev.plan!;
    console.log(
      `  ${hhmm(s.ev.t)} ${p.side.padEnd(5)} CONFIRMED wall ${p.wall} entry ${p.entry} stop ${p.stop} tgt ${p.target}${p.targetCapped ? '(cap)' : ''}` +
      ` room ${p.room ?? '?'}${p.roomOk ? '' : ' SHORT-ROOM'} defended ${p.wallDefended ?? '?'}` +
      `  -> ${s.out.result} ${s.out.points >= 0 ? '+' : ''}${s.out.points} pts at ${hhmm(s.out.exitT)} (MFE ${s.out.mfe} / MAE ${s.out.mae})`
    );
  }
  if (!r.signals.length) console.log('  no confirmed setups 09:30-14:45');
  all.push(...r.signals);
}

const summarize = (label: string, list: Signal[]) => {
  if (!list.length) return console.log(`${label.padEnd(36)} n=0`);
  const wins = list.filter(s => s.out.points > 0).length;
  const pts = list.reduce((a, s) => a + s.out.points, 0);
  const tgt = list.filter(s => s.out.result === 'TARGET').length;
  const stp = list.filter(s => s.out.result === 'STOP').length;
  console.log(
    `${label.padEnd(36)} n=${String(list.length).padStart(2)}  win ${Math.round((wins / list.length) * 100)}%  target ${tgt} stop ${stp} timeout ${list.length - tgt - stp}` +
    `  net ${pts >= 0 ? '+' : ''}${Math.round(pts * 10) / 10} pts  avg ${Math.round((pts / list.length) * 10) / 10}`
  );
};

console.log('\n=== SUMMARY (spot points, before charges) ===');
summarize('all confirmed setups', all);
summarize('first setup of the day only', days.map(d => all.find(s => s.day === d)).filter(Boolean) as Signal[]);
summarize('room >= 30 (your rule)', all.filter(s => s.ev.plan!.roomOk));
summarize('room < 30', all.filter(s => !s.ev.plan!.roomOk));
summarize('wall defended (writers adding)', all.filter(s => s.ev.plan!.wallDefended === true));
summarize('wall not defended', all.filter(s => s.ev.plan!.wallDefended === false));
summarize('09:30-10:30 (your trading window)', all.filter(s => istMin(s.ev.t) <= 10 * 60 + 30));
summarize('after 10:30', all.filter(s => istMin(s.ev.t) > 10 * 60 + 30));
summarize('room >= 30 AND wall defended', all.filter(s => s.ev.plan!.roomOk && s.ev.plan!.wallDefended === true));
summarize('first setup of the day, room >= 30', days.map(d => all.find(s => s.day === d && s.ev.plan!.roomOk)).filter(Boolean) as Signal[]);
summarize('LONG off floor', all.filter(s => s.ev.side === 'LONG'));
summarize('SHORT off ceiling', all.filter(s => s.ev.side === 'SHORT'));
console.log('\nCaveat: bars are built from 30s-1min snapshots, so intrabar highs/lows are approximate; few days = not evidence of an edge.');
