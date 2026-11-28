/**
 * MANUAL DECISION — the one sentence at the top of the Manual tab.
 *
 * Collapses the market phase, the walls, the setup stage on each side, the
 * trader's own one-trade-a-day rule and any trade they logged into a single
 * word plus one line. It describes what the trader's system sees; it never
 * recommends a trade (the 6-day replay of the mechanical setup showed no edge).
 *
 * Pure module: no React, no I/O, no clock (the phase is passed in).
 */
import type { SetupEvent, SetupPlan, Stage, WallsAt } from './wallSetup';

export type MarketPhase = 'CLOSED' | 'PRE_OPEN' | 'OPENING' | 'WINDOW' | 'LATE';
export type DecisionWord =
  | 'MARKET CLOSED' | 'PREPARE' | 'NO DATA' | 'IN TRADE' | 'DONE FOR TODAY'
  | 'SETUP CONFIRMED' | 'CAUTION' | 'WALL FAILED' | 'WATCH' | 'WAIT';
export type Tone = 'slate' | 'sky' | 'amber' | 'emerald' | 'rose' | 'violet';

export interface ManualDecision { word: DecisionWord; tone: Tone; line: string; plan?: SetupPlan | null }

/** 09:00 pre-open · 09:15 opening (watch only) · 09:30 your window · 14:45 late · 15:30 closed. */
export function marketPhase(istMinutes: number, weekday: number): MarketPhase {
  if (weekday === 0 || weekday === 6) return 'CLOSED';
  if (istMinutes < 9 * 60 || istMinutes > 15 * 60 + 30) return 'CLOSED';
  if (istMinutes < 9 * 60 + 15) return 'PRE_OPEN';
  if (istMinutes < 9 * 60 + 30) return 'OPENING';
  if (istMinutes < 14 * 60 + 45) return 'WINDOW';
  return 'LATE';
}

export interface DecisionInput {
  phase: MarketPhase;
  spot: number | null;
  walls: WallsAt | null;
  long: { stage: Stage; last: SetupEvent | null };
  short: { stage: Stage; last: SetupEvent | null };
  /** ms since the bar of each side's last event; Infinity when none. */
  ageMs: { long: number; short: number };
  tradesToday: number;
  maxTrades: number;
  watched: { side: 'LONG' | 'SHORT'; entry: number | null; stop: number | null; target: number | null } | null;
  nextOpenLabel: string;
}

const n = (x: number) => Math.round(x).toLocaleString('en-IN');
const RECENT = 4 * 60_000;

export function deriveManualDecision(i: DecisionInput): ManualDecision {
  if (i.phase === 'CLOSED') {
    return { word: 'MARKET CLOSED', tone: 'slate', line: `Review mode. ${i.nextOpenLabel}. Use your record and lessons below to prepare.` };
  }
  if (i.watched && i.spot !== null) {
    const w = i.watched;
    const sign = w.side === 'LONG' ? 1 : -1;
    const pts = w.entry !== null ? Math.round(sign * (i.spot - w.entry)) : null;
    const toStop = w.stop !== null ? Math.round(sign * (i.spot - w.stop)) : null;
    const toTarget = w.target !== null ? Math.round(sign * (w.target - i.spot)) : null;
    return {
      word: 'IN TRADE',
      tone: 'violet',
      line: `${w.side} ${pts !== null ? `${pts >= 0 ? '+' : ''}${pts} pts` : ''} · ${toStop !== null ? `${toStop} pts above your stop` : 'no stop logged'} · ${toTarget !== null ? `${toTarget} pts to target` : 'no target logged'}. Exit at your levels, without arguing.`
    };
  }
  if (i.tradesToday >= i.maxTrades) {
    return { word: 'DONE FOR TODAY', tone: 'emerald', line: `${i.tradesToday}/${i.maxTrades} trade taken. Your system stops here; save the trade in the journal below.` };
  }
  if (i.phase === 'PRE_OPEN') {
    return { word: 'PREPARE', tone: 'sky', line: 'Pre-open. Read the walls and the plan; nothing is entered before 09:15.' };
  }
  if (i.spot === null || !i.walls) {
    return { word: 'NO DATA', tone: 'amber', line: 'No live price or OI ladder yet. Check the token and that the app tab is open.' };
  }
  const sides = [
    { name: 'LONG' as const, wall: i.walls.floor, chg: i.walls.floorOIChangePct, s: i.long, age: i.ageMs.long },
    { name: 'SHORT' as const, wall: i.walls.ceiling, chg: i.walls.ceilingOIChangePct, s: i.short, age: i.ageMs.short }
  ];
  const conf = sides.find(x => x.s.last?.stage === 'CONFIRMED' && x.age <= RECENT && x.s.last.plan);
  if (conf) {
    const p = conf.s.last!.plan!;
    const issues = [!p.roomOk ? `only ${p.room ?? '?'} pts of room` : null, p.wallDefended === false ? 'writers are leaving the wall' : null].filter(Boolean);
    const levels = `entry ~${n(p.entry)}, stop ${n(p.stop)}, target ${n(p.target)}, room ${p.room ?? '?'}`;
    if (issues.length) return { word: 'CAUTION', tone: 'amber', line: `${conf.name} setup at ${n(p.wall)} confirmed, but ${issues.join(' and ')}. ${levels}.`, plan: p };
    const early = i.phase === 'OPENING' ? ' It is still the opening 15 minutes.' : i.phase === 'LATE' ? ' Late session: smaller moves.' : '';
    return { word: 'SETUP CONFIRMED', tone: 'emerald', line: `${conf.name} off ${n(p.wall)}: ${levels}. Your call: run the 5-line checklist.${early}`, plan: p };
  }
  const failed = sides.find(x => x.s.last?.stage === 'FAILED' && x.age <= RECENT);
  if (failed) {
    return { word: 'WALL FAILED', tone: 'rose', line: `${n(failed.s.last!.wall)} broke (${failed.s.last!.note}). No ${failed.name} here; wait for the next wall to hold.` };
  }
  const watching = sides.find(x => ['AT_WALL', 'STALLING', 'TURNING'].includes(x.s.stage));
  if (watching && watching.wall !== null) {
    const away = Math.round(Math.abs(i.spot - watching.wall));
    const next = watching.s.stage === 'TURNING'
      ? `turning: wait for a close through ~${n(Number(/break level (\d+)/.exec(watching.s.last?.note ?? '')?.[1] ?? watching.wall))}`
      : watching.s.stage === 'STALLING'
        ? `the move is stalling: wait for a ${watching.name === 'LONG' ? 'higher low' : 'lower high'}`
        : `still moving into it: let it stall first`;
    const writers = watching.chg === null || watching.chg === undefined ? '' : `, writers ${watching.chg > 0 ? '+' : ''}${watching.chg}%`;
    return { word: 'WATCH', tone: 'sky', line: `Price at the ${n(watching.wall)} ${watching.name === 'LONG' ? 'floor' : 'ceiling'} (${away} pts${writers}): ${next}.` };
  }
  const toFloor = i.walls.floor !== null ? Math.round(i.spot - i.walls.floor) : null;
  const toCeil = i.walls.ceiling !== null ? Math.round(i.walls.ceiling - i.spot) : null;
  const opening = i.phase === 'OPENING' ? ' Opening 15 minutes: watch only.' : '';
  return { word: 'WAIT', tone: 'slate', line: `Mid-range: ${toFloor ?? '?'} pts to the floor, ${toCeil ?? '?'} to the ceiling. No setup.${opening}` };
}

export interface RecordTrade { date: string; side: 'LONG' | 'SHORT' | null; net: number | null; gross: number | null; spotPts: number | null; rulesKept: number; rulesBroken: number; brokenRules?: string[]; exitDriver: string | null }
export interface OnTrack {
  trades: number; wins: number; winRate: number | null; net: number; netComplete: boolean;
  rulesPct: number | null; avgPts: number | null; sampleGoal: number;
  workOn: string[]; verdict: string; tone: Tone;
}

/** "Am I on track?" from the trader's own record. Honest about sample size. */
export function onTrack(trades: RecordTrade[], goalWinRate = 75, sampleGoal = 15): OnTrack {
  const money = (t: RecordTrade) => (t.net ?? t.gross ?? 0);
  const wins = trades.filter(t => money(t) > 0).length;
  const winRate = trades.length ? Math.round((wins / trades.length) * 100) : null;
  const kept = trades.reduce((a, t) => a + t.rulesKept, 0), broken = trades.reduce((a, t) => a + t.rulesBroken, 0);
  const rulesPct = kept + broken ? Math.round((kept / (kept + broken)) * 100) : null;
  const pts = trades.map(t => t.spotPts).filter((x): x is number => x !== null);
  const counts: Record<string, number> = {};
  trades.forEach(t => (t.brokenRules ?? []).forEach(r => { counts[r] = (counts[r] ?? 0) + 1; }));
  trades.forEach(t => { if (t.exitDriver === 'GREED' || t.exitDriver === 'FEAR') counts[`exit by ${t.exitDriver.toLowerCase()}`] = (counts[`exit by ${t.exitDriver.toLowerCase()}`] ?? 0) + 1; });
  const workOn = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, 4);
  const thin = trades.length < sampleGoal;
  let tone: Tone = 'slate';
  let verdict = 'No trades recorded yet.';
  if (trades.length) {
    const winsOk = (winRate ?? 0) >= goalWinRate;
    const rulesOk = (rulesPct ?? 0) >= 80;
    tone = winsOk && rulesOk ? 'emerald' : winsOk || rulesOk ? 'amber' : 'rose';
    verdict = `${winsOk ? 'On track' : 'Below goal'} on results (${winRate}% vs ${goalWinRate}%)` +
      `${rulesPct !== null ? `, rules kept ${rulesPct}%` : ''}.` +
      `${thin ? ` ${trades.length} of ${sampleGoal} trades: too few to judge the system yet.` : ''}`;
  }
  return {
    trades: trades.length, wins, winRate,
    net: Math.round(trades.reduce((a, t) => a + money(t), 0) * 100) / 100,
    netComplete: trades.every(t => t.net !== null),
    rulesPct, avgPts: pts.length ? Math.round(pts.reduce((a, b) => a + b, 0) / pts.length) : null,
    sampleGoal, workOn, verdict, tone
  };
}
