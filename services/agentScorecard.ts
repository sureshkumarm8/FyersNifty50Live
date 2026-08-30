/**
 * AGENT SCORECARD — measured track records for the AI Lab agents.
 *
 * Before this existed, every agent reported a confidence it invented
 * (`Math.min(70 + sentimentTrend, 95)` and similar) and nothing in the system
 * ever checked whether the agent had been right. This service replaces asserted
 * confidence with earned confidence:
 *
 *   1. Every agent call is logged with the market state at that moment.
 *   2. Once enough time has passed the call is graded against what the index
 *      actually did at +5, +15 and +30 minutes.
 *   3. The agent's displayed reliability becomes its measured hit rate, reported
 *      with a Wilson interval so a 3-for-4 start cannot masquerade as 75%.
 *
 * An agent that cannot beat a coin flip is visibly demoted rather than quietly
 * carried. That is the whole point.
 */

import { dbService } from './db';

export type AgentAction = 'BUY' | 'SELL' | 'HOLD';
export const GRADING_HORIZONS = [5, 15, 30] as const;
export type GradingHorizon = (typeof GRADING_HORIZONS)[number];

/**
 * A move smaller than this is treated as "no move" rather than a win for
 * whichever side happened to be called. Roughly the median 15-minute move in the
 * archive, so noise cannot inflate a hit rate.
 */
export const NEUTRAL_BAND_PTS = 8;

export interface AgentCall {
  id: string;
  agent: string;
  timestamp: number;
  action: AgentAction;
  /** What the agent claimed at the time, kept so calibration can be measured. */
  claimedConfidence: number;
  reasoning: string[];
  /** Index level when the call was made. */
  ltp: number;
  sent: number;
  pcr: number;
  /** Realised move in points per horizon, filled in by grading. */
  outcomes: Partial<Record<GradingHorizon, number>>;
  /** Per-horizon verdict. null while still pending. */
  verdicts: Partial<Record<GradingHorizon, 'win' | 'loss' | 'flat'>>;
  graded: number; // 0/1 — indexed, so IndexedDB can filter
}

export interface AgentStats {
  agent: string;
  /** Calls graded at the reference horizon. */
  samples: number;
  wins: number;
  losses: number;
  flats: number;
  /** Directional hit rate over decisive calls only (0-1), or null if none. */
  hitRate: number | null;
  /** Wilson 95% lower bound — the number to actually trust. */
  hitRateLow: number | null;
  hitRateHigh: number | null;
  /** Mean signed points gained by following this agent. */
  expectancy: number | null;
  /** Mean claimed confidence, for comparison against hitRate. */
  claimedAvg: number | null;
  /** How the agent should be presented given its record. */
  grade: 'unproven' | 'harmful' | 'coin-flip' | 'edge';
  decisiveCalls: number;
  /** Independent-equivalent sample size after discounting overlapping windows. */
  effectiveSamples: number;
}

const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Wilson score interval. Used instead of a raw proportion because early samples
 * are wildly overconfident: 3 wins from 4 calls is 75% by naive maths but its
 * lower bound is 30%, which is the honest reading.
 */
export function wilson(wins: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 1];
  const p = wins / n;
  const d = 1 + (z * z) / n;
  const centre = p + (z * z) / (2 * n);
  const spread = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (centre - spread) / d), Math.min(1, (centre + spread) / d)];
}

/**
 * Effective sample size for a set of calls whose outcome windows overlap.
 *
 * Calls made every 5 minutes and graded over 15 are not independent: each
 * outcome shares two thirds of its window with its neighbours, so a run of luck
 * is counted three times over. Without this correction a coin flip logged
 * frequently enough will eventually clear a Wilson lower bound of 50% and be
 * presented as a proven edge — which is exactly what it is not.
 *
 * Overlapping observations are discounted by the ratio of their spacing to the
 * horizon, the standard treatment for serially correlated forecasts.
 */
export function effectiveSampleSize(timestamps: number[], horizonMin: number): number {
  const n = timestamps.length;
  if (n < 2 || horizonMin <= 0) return n;
  const sorted = [...timestamps].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) gaps.push((sorted[i] - sorted[i - 1]) / 60000);
  gaps.sort((a, b) => a - b);
  const medianGap = gaps[Math.floor(gaps.length / 2)];
  if (!(medianGap > 0)) return 1;
  return Math.max(1, n * Math.min(1, medianGap / horizonMin));
}

/** Grade one call at one horizon. */
export function verdictFor(action: AgentAction, movePts: number): 'win' | 'loss' | 'flat' {
  if (action === 'HOLD') return Math.abs(movePts) <= NEUTRAL_BAND_PTS ? 'win' : 'loss';
  if (Math.abs(movePts) <= NEUTRAL_BAND_PTS) return 'flat';
  const up = movePts > 0;
  return (action === 'BUY') === up ? 'win' : 'loss';
}

/** Signed points earned by following the call (HOLD earns nothing). */
export const signedPnl = (action: AgentAction, movePts: number): number =>
  action === 'BUY' ? movePts : action === 'SELL' ? -movePts : 0;

export const agentScorecard = {
  /**
   * Record a fresh call. Duplicate suppression: an agent repeating the same
   * action within `minGapMs` is not logged again, otherwise a 5-second refresh
   * loop would manufacture thousands of correlated "calls" and make a single
   * lucky decision look like overwhelming evidence.
   */
  log: async (
    calls: Array<{
      agent: string;
      action: AgentAction;
      claimedConfidence: number;
      reasoning: string[];
    }>,
    market: { ltp: number; sent: number; pcr: number; timestamp?: number },
    minGapMs = 5 * 60000
  ): Promise<number> => {
    if (!(market.ltp > 0) || calls.length === 0) return 0;
    const now = market.timestamp ?? Date.now();
    const existing = await dbService.getAllAgentCalls();

    const fresh: AgentCall[] = [];
    for (const c of calls) {
      const last = existing
        .filter((e: AgentCall) => e.agent === c.agent)
        .sort((a: AgentCall, b: AgentCall) => b.timestamp - a.timestamp)[0];
      if (last && last.action === c.action && now - last.timestamp < minGapMs) continue;
      fresh.push({
        id: uid(),
        agent: c.agent,
        timestamp: now,
        action: c.action,
        claimedConfidence: c.claimedConfidence,
        reasoning: c.reasoning,
        ltp: market.ltp,
        sent: market.sent,
        pcr: market.pcr,
        outcomes: {},
        verdicts: {},
        graded: 0
      });
    }
    await dbService.putAgentCalls(fresh);
    return fresh.length;
  },

  /**
   * Grade every call that is now old enough, using the session history as the
   * source of truth for where the index actually went.
   *
   * `history` may be in any order; it only needs `timestamp` and `niftyLtp`.
   */
  grade: async (history: Array<{ timestamp?: number; niftyLtp: number }>): Promise<number> => {
    const series = history
      .filter(h => Number.isFinite(h.timestamp as number) && h.niftyLtp > 0)
      .map(h => ({ t: h.timestamp as number, ltp: h.niftyLtp }))
      .sort((a, b) => a.t - b.t);
    if (series.length === 0) return 0;

    /** Index level at time t, from the nearest sample within 3 minutes. */
    const levelAt = (t: number): number | null => {
      let best: { d: number; ltp: number } | null = null;
      for (const s of series) {
        const d = Math.abs(s.t - t);
        if (!best || d < best.d) best = { d, ltp: s.ltp };
      }
      return best && best.d <= 3 * 60000 ? best.ltp : null;
    };

    const calls: AgentCall[] = await dbService.getAllAgentCalls();
    const updated: AgentCall[] = [];

    for (const call of calls) {
      let changed = false;
      for (const h of GRADING_HORIZONS) {
        if (call.verdicts[h]) continue;
        const target = call.timestamp + h * 60000;
        if (Date.now() < target) continue; // not yet due
        const lvl = levelAt(target);
        if (lvl === null) continue;
        const move = lvl - call.ltp;
        call.outcomes[h] = move;
        call.verdicts[h] = verdictFor(call.action, move);
        changed = true;
      }
      if (changed) {
        call.graded = GRADING_HORIZONS.every(h => call.verdicts[h]) ? 1 : 0;
        updated.push(call);
      }
    }
    await dbService.putAgentCalls(updated);
    return updated.length;
  },

  getCalls: async (): Promise<AgentCall[]> => {
    const calls: AgentCall[] = await dbService.getAllAgentCalls();
    return calls.sort((a, b) => b.timestamp - a.timestamp);
  },

  reset: async () => dbService.clearAgentCalls(),

  /** Aggregate a set of calls into per-agent statistics at one horizon. */
  stats: (calls: AgentCall[], horizon: GradingHorizon = 15): AgentStats[] => {
    const byAgent = new Map<string, AgentCall[]>();
    for (const c of calls) {
      if (!byAgent.has(c.agent)) byAgent.set(c.agent, []);
      byAgent.get(c.agent)!.push(c);
    }

    return [...byAgent.entries()].map(([agent, list]) => {
      const graded = list.filter(c => c.verdicts[horizon]);
      const wins = graded.filter(c => c.verdicts[horizon] === 'win').length;
      const losses = graded.filter(c => c.verdicts[horizon] === 'loss').length;
      const flats = graded.filter(c => c.verdicts[horizon] === 'flat').length;
      const decisive = wins + losses;

      const hitRate = decisive > 0 ? wins / decisive : null;
      // Wilson is computed on the effective sample, not the raw count, so that
      // overlapping outcome windows cannot manufacture statistical confidence.
      const decisiveCalls = graded.filter(c => c.verdicts[horizon] !== 'flat');
      const nEff = effectiveSampleSize(decisiveCalls.map(c => c.timestamp), horizon);
      const [lo, hi] =
        decisive > 0
          ? wilson(Math.round((wins / decisive) * nEff), Math.round(nEff))
          : [null, null];
      const pnls = graded.map(c => signedPnl(c.action, c.outcomes[horizon] ?? 0));
      const expectancy = pnls.length ? pnls.reduce((a, b) => a + b, 0) / pnls.length : null;
      const claimedAvg = list.length ? list.reduce((a, c) => a + c.claimedConfidence, 0) / list.length : null;

      // Grading deliberately leans on the Wilson bounds, not the point estimate.
      let grade: AgentStats['grade'] = 'unproven';
      if (nEff >= 20 && decisive >= 20 && lo !== null && hi !== null) {
        if (lo > 0.5) grade = 'edge';
        else if (hi < 0.5) grade = 'harmful';
        else grade = 'coin-flip';
      }

      return {
        agent,
        samples: graded.length,
        wins,
        losses,
        flats,
        hitRate,
        hitRateLow: lo,
        hitRateHigh: hi,
        expectancy,
        claimedAvg,
        grade,
        decisiveCalls: decisive,
        effectiveSamples: Math.round(nEff)
      };
    }).sort((a, b) => (b.hitRateLow ?? -1) - (a.hitRateLow ?? -1));
  }
};
