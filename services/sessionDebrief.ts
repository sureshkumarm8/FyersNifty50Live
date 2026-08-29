/**
 * SESSION DEBRIEF — the end-of-day accounting.
 *
 * Every other panel looks forward. This one looks back and asks the only
 * question that compounds: what did the system claim today, what actually
 * happened, and what should change tomorrow? Without this the terminal can
 * generate confident output indefinitely without ever learning that it is
 * wrong.
 *
 * Nothing here is generated text dressed up as insight — every line is derived
 * from a graded call or a measured move.
 */

import { AgentCall, AgentStats, GRADING_HORIZONS } from './agentScorecard';
import { LabelledPoint } from './predictionModel';
import { calibrationReport, isCalibrationFailure } from './calibrationMonitor';

export interface SessionMove {
  open: number;
  close: number;
  high: number;
  low: number;
  netPts: number;
  rangePts: number;
  bars: number;
}

export interface DebriefLine {
  kind: 'good' | 'bad' | 'neutral';
  text: string;
}

export interface SessionDebrief {
  ok: true;
  date: string;
  move: SessionMove;
  callsMade: number;
  callsGraded: number;
  decisive: number;
  /** Best and worst agent by expectancy, when enough calls exist. */
  best: AgentStats | null;
  worst: AgentStats | null;
  findings: DebriefLine[];
  /** Specific, checkable actions for tomorrow. */
  actions: string[];
}

export interface DebriefFailure {
  ok: false;
  reason: string;
}

/** `strict` is off, so boolean-literal discriminants need an explicit guard. */
export const isDebriefFailure = (r: SessionDebrief | DebriefFailure): r is DebriefFailure => r.ok === false;

const dayKey = (t: number) => {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export function buildDebrief(
  bars: LabelledPoint[],
  calls: AgentCall[],
  stats: AgentStats[],
  date?: string
): SessionDebrief | DebriefFailure {
  const target = date ?? (bars.length ? dayKey(bars[bars.length - 1].t) : dayKey(Date.now()));
  const dayBars = bars.filter(b => dayKey(b.t) === target);

  if (dayBars.length < 20) {
    return { ok: false, reason: `Only ${dayBars.length} bars recorded for ${target} — not enough to debrief a session.` };
  }

  const ltps = dayBars.map(b => b.ltp);
  const move: SessionMove = {
    open: ltps[0],
    close: ltps[ltps.length - 1],
    high: Math.max(...ltps),
    low: Math.min(...ltps),
    netPts: ltps[ltps.length - 1] - ltps[0],
    rangePts: Math.max(...ltps) - Math.min(...ltps),
    bars: dayBars.length
  };

  const dayCalls = calls.filter(c => dayKey(c.timestamp) === target);
  const graded = dayCalls.filter(c => c.graded === 1);
  const decisive = graded.filter(c => c.action !== 'HOLD');

  const ranked = stats
    .filter(s => s.expectancy !== null && s.decisiveCalls >= 5)
    .sort((a, b) => (b.expectancy ?? 0) - (a.expectancy ?? 0));

  const findings: DebriefLine[] = [];
  const actions: string[] = [];

  // 1. What the market did, framed against its own range.
  const efficiency = move.rangePts > 0 ? Math.abs(move.netPts) / move.rangePts : 0;
  findings.push({
    kind: 'neutral',
    text:
      efficiency > 0.6
        ? `Directional session: ${move.netPts >= 0 ? '+' : ''}${move.netPts.toFixed(0)} pts net across a ${move.rangePts.toFixed(0)}-pt range — ${(efficiency * 100).toFixed(0)}% of the movement went one way.`
        : `Two-way session: a ${move.rangePts.toFixed(0)}-pt range delivered only ${move.netPts >= 0 ? '+' : ''}${move.netPts.toFixed(0)} pts net. Trend-following was fighting the tape.`
  });

  // 2. Did anything actually get measured?
  if (decisive.length === 0) {
    findings.push({
      kind: 'neutral',
      text: `${dayCalls.length} calls logged but none were decisive and graded, so nothing was learned today. HOLD costs nothing and teaches nothing.`
    });
    actions.push('No gradeable calls were made. If the agents are permanently on HOLD, their thresholds are too conservative to ever be tested.');
  } else {
    const wins = decisive.filter(c => c.verdicts[15] === 'win').length;
    const rate = wins / decisive.length;
    findings.push({
      kind: rate > 0.55 ? 'good' : rate < 0.45 ? 'bad' : 'neutral',
      text: `${decisive.length} decisive calls graded at 15m: ${wins} correct (${(rate * 100).toFixed(0)}%). ${
        rate < 0.45
          ? 'Below a coin flip — taking the opposite side would have done better, which usually means a threshold is inverted rather than that the signal is strong.'
          : rate > 0.55
            ? 'Above a coin flip, though a single session is far too small to call it an edge.'
            : 'Indistinguishable from chance over one session.'
      }`
    });
  }

  // 3. Who helped and who hurt.
  const best = ranked.length ? ranked[0] : null;
  const worst = ranked.length > 1 ? ranked[ranked.length - 1] : null;
  if (best && (best.expectancy ?? 0) > 0) {
    findings.push({
      kind: 'good',
      text: `${best.agent} leads on expectancy at ${(best.expectancy ?? 0).toFixed(1)} pts per call over ${best.decisiveCalls} decisive calls (hit rate ${(100 * (best.hitRate ?? 0)).toFixed(0)}%, 95% floor ${(100 * (best.hitRateLow ?? 0)).toFixed(0)}%).`
    });
  }
  if (worst && (worst.expectancy ?? 0) < -1) {
    findings.push({
      kind: 'bad',
      text: `${worst.agent} is losing ${Math.abs(worst.expectancy ?? 0).toFixed(1)} pts per call across ${worst.decisiveCalls} decisive calls.`
    });
    actions.push(`Mute ${worst.agent} or invert its threshold — it has been net negative, and acting on it costs money.`);
  }

  // 4. Was the confidence honest?
  const cal = calibrationReport(calls, 15);
  if (!isCalibrationFailure(cal)) {
    findings.push({
      kind: cal.skill > 0 ? 'good' : 'bad',
      text: `Confidence calibration: ${cal.verdict}`
    });
    if (cal.overconfidence > 15) {
      actions.push(`Discount every stated confidence by roughly ${cal.overconfidence.toFixed(0)} points until the curve flattens.`);
    }
  } else {
    findings.push({ kind: 'neutral', text: cal.reason });
  }

  // 5. Anything left permanently ungraded is a silent failure.
  const stale = dayCalls.filter(c => c.graded === 0 && Date.now() - c.timestamp > 60 * 60000).length;
  if (stale > 0) {
    findings.push({
      kind: 'bad',
      text: `${stale} calls from today were never graded despite being over an hour old — the grading loop is not keeping up, so the scorecard understates activity.`
    });
  }

  if (actions.length === 0) {
    actions.push(
      decisive.length < 5
        ? 'Keep logging. Fewer than five decisive calls is too thin a record to change anything on.'
        : 'Nothing in today\'s record justifies a change. Continue and re-check once the sample is larger.'
    );
  }

  return {
    ok: true,
    date: target,
    move,
    callsMade: dayCalls.length,
    callsGraded: graded.length,
    decisive: decisive.length,
    best,
    worst,
    findings,
    actions
  };
}
