import React, { useMemo } from 'react';
import { History, AlertTriangle, Info } from 'lucide-react';
import { marketMemory, isMemoryFailure, MIN_SEPARATION_MINUTES, EXCLUSION_MINUTES } from '../../services/marketMemory';
import { ArchiveSeries } from './useArchiveSeries';
import WarmupNotice from './WarmupNotice';

/**
 * MARKET MEMORY panel.
 *
 * Presents the nearest historical analogues of the current market and, more
 * importantly, whether their outcomes differ from the base rate at all. The
 * base-rate column is not decoration: without it a "62% went up" reading looks
 * like a signal even when the market rises 62% of the time regardless.
 */
const MarketMemoryPanel: React.FC<{ series: ArchiveSeries }> = ({ series }) => {
  const result = useMemo(() => {
    if (!series.now || series.history.length === 0) return null;
    return marketMemory.search(series.now, series.history, 25);
  }, [series.now, series.history]);

  if (series.loading) {
    return <div className="glass-panel rounded-xl p-8 text-center text-slate-400">Loading archived sessions…</div>;
  }

  if (!series.now) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center">
        <History size={40} className="mx-auto mb-3 text-slate-600" />
        <h3 className="text-lg font-bold text-white mb-1">Waiting for live data</h3>
        <p className="text-sm text-slate-400">
          Market Memory compares the current moment against your archive. It needs {series.minLiveBars} minutes of live
          session data — the rest of the feature window is seeded from your previous session.
        </p>
      </div>
    );
  }

  if (!result) return null;

  if (isMemoryFailure(result)) {
    return (
      <div className="glass-panel rounded-xl p-6 border border-amber-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-amber-300 mb-1">Not enough comparable history</h3>
            <p className="text-sm text-slate-300">{result.reason}</p>
          </div>
        </div>
      </div>
    );
  }

  const anySignificant = result.outcomes.some(o => o.significant);

  return (
    <div className="space-y-4">
      {series.warmingUp && <WarmupNotice liveBars={series.liveBars} />}
      <div className="glass-panel rounded-xl p-5">
        <div className="flex items-center gap-2 mb-1">
          <History size={16} className="text-cyan-400" />
          <h3 className="text-base font-bold text-white">Market Memory</h3>
        </div>
        <p className="text-xs text-slate-400">
          {result.analogues.length} independent historical analogues drawn from {result.searched.toLocaleString('en-IN')} archived
          minutes. Matches within {EXCLUSION_MINUTES} minutes of now are excluded, and selected analogues are kept at least{' '}
          {MIN_SEPARATION_MINUTES} minutes apart so one afternoon cannot masquerade as many observations.
        </p>
      </div>

      <div
        className={`rounded-xl p-4 border ${
          anySignificant ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-800/50 border-white/10'
        }`}
      >
        <div className="flex items-start gap-2">
          <Info size={15} className={anySignificant ? 'text-emerald-400 mt-0.5 shrink-0' : 'text-slate-400 mt-0.5 shrink-0'} />
          <p className="text-sm text-slate-200">{result.verdict}</p>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h4 className="text-sm font-bold text-white">What followed, versus what usually follows</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/60 text-slate-400 text-xs">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Horizon</th>
                <th className="px-3 py-2 text-right font-semibold">n</th>
                <th className="px-3 py-2 text-right font-semibold">Median</th>
                <th className="px-3 py-2 text-right font-semibold">25th–75th</th>
                <th className="px-3 py-2 text-right font-semibold">Rose</th>
                <th className="px-3 py-2 text-right font-semibold">Base rate</th>
                <th className="px-3 py-2 text-right font-semibold">Edge</th>
                <th className="px-3 py-2 text-center font-semibold">Signal?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.outcomes.map(o => (
                <tr key={o.horizon} className="hover:bg-white/5">
                  <td className="px-3 py-2 font-semibold text-white">{o.horizon} min</td>
                  <td className="px-3 py-2 text-right text-slate-400">{o.samples}</td>
                  <td
                    className={`px-3 py-2 text-right font-mono font-semibold ${
                      o.median > 0 ? 'text-emerald-400' : o.median < 0 ? 'text-rose-400' : 'text-slate-300'
                    }`}
                  >
                    {o.median > 0 ? '+' : ''}
                    {o.median.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-400 text-xs">
                    {o.p25.toFixed(0)} to {o.p75.toFixed(0)}
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-200">{(o.probUp * 100).toFixed(0)}%</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-500">{(o.baseProbUp * 100).toFixed(0)}%</td>
                  <td
                    className={`px-3 py-2 text-right font-mono ${
                      o.significant ? 'text-emerald-400 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {o.edgePts > 0 ? '+' : ''}
                    {o.edgePts.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {o.significant ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                        z={o.z.toFixed(1)}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-600">noise</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-white/10 bg-slate-900/40">
          <p className="text-[11px] text-slate-500">
            "Edge" is the analogue up-rate minus the unconditional up-rate, in percentage points. It is only marked a
            signal when a two-proportion test clears z = 1.96, which most of the time it will not.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h4 className="text-sm font-bold text-white">Closest analogues</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/60 text-slate-400 text-xs">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">When</th>
                <th className="px-3 py-2 text-right font-semibold">Similarity</th>
                <th className="px-3 py-2 text-right font-semibold">Nifty</th>
                <th className="px-3 py-2 text-right font-semibold">Sent</th>
                <th className="px-3 py-2 text-right font-semibold">PCR</th>
                <th className="px-3 py-2 text-right font-semibold">+5m</th>
                <th className="px-3 py-2 text-right font-semibold">+15m</th>
                <th className="px-3 py-2 text-right font-semibold">+30m</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {result.analogues.slice(0, 12).map(a => (
                <tr key={a.t} className="hover:bg-white/5">
                  <td className="px-3 py-2 font-mono text-xs text-slate-300">{a.label}</td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-14 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400" style={{ width: `${Math.round(a.similarity * 100)}%` }} />
                      </div>
                      <span className="font-mono text-xs text-slate-400 w-8">{(a.similarity * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-slate-300">{a.ltp.toFixed(0)}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-400">{a.sent.toFixed(0)}</td>
                  <td className="px-3 py-2 text-right font-mono text-slate-400">{a.pcr.toFixed(2)}</td>
                  {[5, 15, 30].map(h => {
                    const v = a.forward[h];
                    return (
                      <td
                        key={h}
                        className={`px-3 py-2 text-right font-mono ${
                          !Number.isFinite(v)
                            ? 'text-slate-600'
                            : v > 0
                              ? 'text-emerald-400'
                              : v < 0
                                ? 'text-rose-400'
                                : 'text-slate-300'
                        }`}
                      >
                        {Number.isFinite(v) ? `${v > 0 ? '+' : ''}${v.toFixed(0)}` : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MarketMemoryPanel;
