import React, { useEffect, useState, useMemo } from 'react';
import { Award, AlertTriangle, RefreshCw, Trash2, Activity } from 'lucide-react';
import { agentScorecard, AgentCall, AgentStats, GRADING_HORIZONS, GradingHorizon } from '../../services/agentScorecard';
import { calibrationReport, isCalibrationFailure } from '../../services/calibrationMonitor';

const GRADE_CLASS: Record<AgentStats['grade'], string> = {
  edge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'coin-flip': 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  harmful: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  unproven: 'bg-slate-700/40 text-slate-400 border-slate-600/40'
};

const GRADE_LABEL: Record<AgentStats['grade'], string> = {
  edge: 'EDGE',
  'coin-flip': 'COIN FLIP',
  harmful: 'HARMFUL',
  unproven: 'UNPROVEN'
};

/**
 * AGENT SCORECARD.
 *
 * The agents used to display a confidence number that nothing ever checked.
 * This panel replaces that with a measured record: how often each agent has
 * actually been right, with a Wilson lower bound so that three wins out of four
 * cannot pass itself off as 75% reliability.
 */
const ScorecardPanel: React.FC<{ refreshKey?: number }> = ({ refreshKey }) => {
  const [calls, setCalls] = useState<AgentCall[]>([]);
  const [horizon, setHorizon] = useState<GradingHorizon>(15);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const c = await agentScorecard.getCalls();
        if (!cancelled) setCalls(c);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce, refreshKey]);

  const stats = useMemo(() => agentScorecard.stats(calls, horizon), [calls, horizon]);
  const cal = useMemo(() => calibrationReport(calls, horizon), [calls, horizon]);

  const pending = calls.filter(c => c.graded === 0).length;

  const handleReset = async () => {
    if (!window.confirm('Delete the entire agent track record? Measured reliability will restart from zero.')) return;
    await agentScorecard.reset();
    setNonce(n => n + 1);
  };

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-xl p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Award size={16} className="text-amber-400" />
              <h3 className="text-base font-bold text-white">Agent Scorecard</h3>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Every agent call is recorded and graded against what the market actually did. Reliability shown here is
              measured, never asserted — and an agent stays <span className="text-slate-300 font-semibold">UNPROVEN</span> until
              it has 20 decisive calls, because anything less cannot separate skill from luck.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={horizon}
              onChange={e => setHorizon(Number(e.target.value) as GradingHorizon)}
              className="bg-slate-800 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-semibold"
            >
              {GRADING_HORIZONS.map(h => (
                <option key={h} value={h}>
                  {h} min horizon
                </option>
              ))}
            </select>
            <button
              onClick={() => setNonce(n => n + 1)}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10"
              title="Refresh"
            >
              <RefreshCw size={13} />
            </button>
            <button
              onClick={handleReset}
              className="p-2 rounded-lg bg-slate-800 hover:bg-rose-900/50 text-slate-400 hover:text-rose-300 border border-white/10"
              title="Clear track record"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-slate-500">
          <span>{calls.length.toLocaleString('en-IN')} calls logged</span>
          <span>{(calls.length - pending).toLocaleString('en-IN')} graded</span>
          <span>{pending.toLocaleString('en-IN')} awaiting outcome</span>
        </div>
      </div>

      {loading && <div className="glass-panel rounded-xl p-8 text-center text-slate-400">Loading track record…</div>}

      {!loading && calls.length === 0 && (
        <div className="glass-panel rounded-xl p-8 text-center">
          <Activity size={40} className="mx-auto mb-3 text-slate-600" />
          <h3 className="text-lg font-bold text-white mb-1">No track record yet</h3>
          <p className="text-sm text-slate-400 max-w-lg mx-auto">
            Run the agents during a live session. Each call is logged here and graded automatically once enough time has
            passed, building the evidence base that turns stated confidence into measured reliability.
          </p>
        </div>
      )}

      {!loading && stats.length > 0 && (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60 text-slate-400 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Agent</th>
                  <th className="px-3 py-2 text-center font-semibold">Verdict</th>
                  <th className="px-3 py-2 text-right font-semibold">Decisive</th>
                  <th className="px-3 py-2 text-right font-semibold">Independent</th>
                  <th className="px-3 py-2 text-right font-semibold">W / L</th>
                  <th className="px-3 py-2 text-right font-semibold">Hit rate</th>
                  <th className="px-3 py-2 text-right font-semibold">95% range</th>
                  <th className="px-3 py-2 text-right font-semibold">Claimed</th>
                  <th className="px-3 py-2 text-right font-semibold">Expectancy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {stats.map(s => {
                  const overclaim =
                    s.claimedAvg !== null && s.hitRate !== null ? s.claimedAvg - s.hitRate * 100 : null;
                  return (
                    <tr key={s.agent} className="hover:bg-white/5">
                      <td className="px-3 py-2 font-semibold text-white">{s.agent}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${GRADE_CLASS[s.grade]}`}>
                          {GRADE_LABEL[s.grade]}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right text-slate-400 font-mono">{s.decisiveCalls}</td>
                      <td className="px-3 py-2 text-right text-slate-500 font-mono">{s.effectiveSamples}</td>
                      <td className="px-3 py-2 text-right font-mono text-slate-300">
                        {s.wins} / {s.losses}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-white">
                        {s.hitRate === null ? '—' : `${(s.hitRate * 100).toFixed(0)}%`}
                      </td>
                      <td className="px-3 py-2 text-right font-mono text-xs text-slate-500">
                        {s.hitRateLow === null
                          ? '—'
                          : `${(s.hitRateLow * 100).toFixed(0)}–${(s.hitRateHigh! * 100).toFixed(0)}%`}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono ${
                          overclaim !== null && overclaim > 15 ? 'text-amber-400' : 'text-slate-400'
                        }`}
                      >
                        {s.claimedAvg === null ? '—' : `${s.claimedAvg.toFixed(0)}%`}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono font-semibold ${
                          s.expectancy === null
                            ? 'text-slate-500'
                            : s.expectancy > 0
                              ? 'text-emerald-400'
                              : 'text-rose-400'
                        }`}
                      >
                        {s.expectancy === null
                          ? '—'
                          : `${s.expectancy > 0 ? '+' : ''}${s.expectancy.toFixed(1)} pts`}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2.5 border-t border-white/10 bg-slate-900/40">
            <p className="text-[11px] text-slate-500">
              The 95% range is a Wilson interval computed on the <span className="text-slate-400">independent</span>{' '}
              count, not the raw one: calls made minutes apart but graded over a longer horizon share most of their
              outcome window, so counting them separately would let a coin flip clear a 50% floor and pass itself off as
              an edge. Trust the lower bound rather than the point estimate. Expectancy is the mean points gained per
              call by following the agent, so a high hit rate with negative expectancy means it is right often and wrong
              big.
            </p>
          </div>
        </div>
      )}

      <div className="glass-panel rounded-xl p-5">
        <h4 className="text-sm font-bold text-white mb-1">Confidence calibration</h4>
        {isCalibrationFailure(cal) ? (
          <div className="flex items-start gap-2 mt-2">
            <AlertTriangle size={14} className="text-slate-500 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-400">{cal.reason}</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-300 mb-3">{cal.verdict}</p>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Brier score</div>
                <div className="text-lg font-bold text-white font-mono">{cal.brier.toFixed(3)}</div>
                <div className="text-[10px] text-slate-500">vs {cal.brierBaseline.toFixed(3)} baseline</div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Skill</div>
                <div
                  className={`text-lg font-bold font-mono ${cal.skill > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                >
                  {(cal.skill * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-500">over a constant guess</div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Overconfidence</div>
                <div
                  className={`text-lg font-bold font-mono ${
                    Math.abs(cal.overconfidence) > 15 ? 'text-amber-400' : 'text-slate-200'
                  }`}
                >
                  {cal.overconfidence > 0 ? '+' : ''}
                  {cal.overconfidence.toFixed(0)}
                </div>
                <div className="text-[10px] text-slate-500">points claimed over actual</div>
              </div>
            </div>
            <table className="w-full text-sm">
              <thead className="bg-slate-800/60 text-slate-400 text-xs">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Claimed band</th>
                  <th className="px-3 py-2 text-right font-semibold">n</th>
                  <th className="px-3 py-2 text-right font-semibold">Said</th>
                  <th className="px-3 py-2 text-right font-semibold">Was right</th>
                  <th className="px-3 py-2 text-right font-semibold">Gap</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cal.bins.map(b => (
                  <tr key={b.lo} className="hover:bg-white/5">
                    <td className="px-3 py-2 text-slate-300 font-mono text-xs">
                      {b.lo}–{Math.min(b.hi, 100)}%
                    </td>
                    <td className="px-3 py-2 text-right text-slate-400 font-mono">{b.n}</td>
                    <td className="px-3 py-2 text-right text-slate-300 font-mono">{b.claimed.toFixed(0)}%</td>
                    <td className="px-3 py-2 text-right text-white font-mono font-semibold">{b.actual.toFixed(0)}%</td>
                    <td
                      className={`px-3 py-2 text-right font-mono font-semibold ${
                        b.gap < -15 ? 'text-rose-400' : b.gap > 10 ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {b.gap > 0 ? '+' : ''}
                      {b.gap.toFixed(0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};

export default ScorecardPanel;
