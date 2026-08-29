import React, { useMemo, useState } from 'react';
import { Radar, AlertTriangle, Calculator, Info } from 'lucide-react';
import { regimeRadar, isRegimeFailure, VolState, TrendState } from '../../services/regimeRadar';
import { planRisk, isRiskFailure } from '../../services/riskSizer';
import { forecast, isForecastFailure, toModelRows } from '../../services/predictionModel';
import { ArchiveSeries } from './useArchiveSeries';
import WarmupNotice from './WarmupNotice';

const VOL_CLASS: Record<VolState, string> = {
  calm: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
  normal: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  active: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
  violent: 'bg-rose-500/20 text-rose-300 border-rose-500/40'
};

const TREND_CLASS: Record<TrendState, string> = {
  trending: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  mixed: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
  chopping: 'bg-violet-500/20 text-violet-300 border-violet-500/40'
};

/**
 * REGIME RADAR + RISK SIZER.
 *
 * These belong together: the regime determines how far the market can travel,
 * and that distance is what a stop has to survive. Sizing computed without it
 * is just a round number.
 */
const RegimeRadarPanel: React.FC<{ series: ArchiveSeries; liveLog: any[] }> = ({ series, liveLog }) => {
  const [capital, setCapital] = useState(500000);
  const [riskPct, setRiskPct] = useState(1);
  const [pointValue, setPointValue] = useState(75);

  const reading = useMemo(() => {
    if (!series.now || series.history.length === 0) return null;
    return regimeRadar.read(series.now, series.history, [5, 15, 30]);
  }, [series.now, series.history]);

  const band = useMemo(() => {
    if (!liveLog?.length) return null;
    // Seed the warm-up from the archive so a band exists minutes into the
    // session; forecast() widens it to keep the stated coverage true.
    const f = forecast(toModelRows(liveLog as any), series.archiveRows);
    if (isForecastFailure(f)) return null;
    const h30 = f.horizons.find(h => h.minutes === 30) ?? f.horizons[f.horizons.length - 1];
    if (!h30) return null;
    // The band is quoted on the projected level, so the spot it is anchored to
    // is that level minus the expected move.
    return {
      bandPts: h30.bandPts,
      spot: h30.niftyLtp - h30.ptsChg,
      horizon: h30.minutes,
      multiplier: f.warmupMultiplier
    };
  }, [liveLog, series.archiveRows]);

  const plan = useMemo(() => {
    if (!band) return null;
    return planRisk(
      {
        capital,
        riskPerTrade: riskPct / 100,
        pointValue,
        bandPts: band.bandPts,
        horizon: band.horizon,
        spot: band.spot
      },
      isRegimeFailure(reading) ? undefined : reading
    );
  }, [band, capital, riskPct, pointValue, reading]);

  if (series.loading) {
    return <div className="glass-panel rounded-xl p-8 text-center text-slate-400">Loading archived sessions…</div>;
  }

  if (!reading) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center">
        <Radar size={40} className="mx-auto mb-3 text-slate-600" />
        <h3 className="text-lg font-bold text-white mb-1">Waiting for live data</h3>
        <p className="text-sm text-slate-400">
          The radar classifies the current session against archived regimes. It needs {series.minLiveBars} minutes of
          live data — the rest of the feature window is seeded from your previous session.
        </p>
      </div>
    );
  }

  if (isRegimeFailure(reading)) {
    return (
      <div className="glass-panel rounded-xl p-6 border border-amber-500/30">
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-400 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-300">{reading.reason}</p>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-4">
      {series.warmingUp && <WarmupNotice liveBars={series.liveBars} multiplier={band?.multiplier} />}
      <div className="glass-panel rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Radar size={16} className="text-cyan-400" />
          <h3 className="text-base font-bold text-white">Current Regime</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${VOL_CLASS[reading.vol]}`}>
            {reading.vol.toUpperCase()} volatility
          </span>
          <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${TREND_CLASS[reading.trend]}`}>
            {reading.trend.toUpperCase()}
          </span>
          <span className="px-3 py-1 rounded-lg text-xs font-bold border bg-slate-500/20 text-slate-300 border-slate-500/40">
            {reading.tod.toUpperCase()}
          </span>
        </div>
        <p className="text-sm text-slate-300 mb-2">{reading.summary}</p>
        <p className="text-sm text-slate-400 italic">{reading.guidance}</p>
      </div>

      <div className="glass-panel rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h4 className="text-sm font-bold text-white">How this regime has historically behaved</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-800/60 text-slate-400 text-xs">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Horizon</th>
                <th className="px-3 py-2 text-right font-semibold">Comparable</th>
                <th className="px-3 py-2 text-right font-semibold">Typical move</th>
                <th className="px-3 py-2 text-right font-semibold">Market average</th>
                <th className="px-3 py-2 text-right font-semibold">Ratio</th>
                <th className="px-3 py-2 text-right font-semibold">Reached by 20%</th>
                <th className="px-3 py-2 text-right font-semibold">Rose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[5, 15, 30].map(h => {
                const st = reading.stats[h];
                if (!st) return null;
                return (
                  <tr key={h} className="hover:bg-white/5">
                    <td className="px-3 py-2 font-semibold text-white">{h} min</td>
                    <td className="px-3 py-2 text-right text-slate-400">{st.samples.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold text-white">
                      ±{st.medAbsMove.toFixed(1)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-500">±{st.baseMedAbsMove.toFixed(1)}</td>
                    <td
                      className={`px-3 py-2 text-right font-mono font-semibold ${
                        st.moveRatio > 1.1 ? 'text-amber-400' : st.moveRatio < 0.9 ? 'text-sky-400' : 'text-slate-300'
                      }`}
                    >
                      {st.moveRatio.toFixed(2)}×
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-300">±{st.p80AbsMove.toFixed(0)}</td>
                    <td className="px-3 py-2 text-right font-mono text-slate-400">{(st.probUp * 100).toFixed(0)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2.5 border-t border-white/10 bg-slate-900/40">
          <p className="text-[11px] text-slate-500">
            Regime boundaries are quantiles of your own archive, not fixed numbers — they move as the archive grows.
            Volatility state orders forward movement monotonically across the archive, which is why it drives stop width
            below.
          </p>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calculator size={16} className="text-emerald-400" />
          <h3 className="text-base font-bold text-white">Position Sizing</h3>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Direction is not predictable at these horizons, but the calibrated band is — it covers 78–81% of outcomes in
          every volatility regime. Sizing spends that reliability where it pays: on stop distance.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <label className="block">
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Capital (₹)</span>
            <input
              type="number"
              value={capital}
              onChange={e => setCapital(Number(e.target.value))}
              className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-slate-400 font-semibold uppercase">Risk per trade (%)</span>
            <input
              type="number"
              step="0.1"
              value={riskPct}
              onChange={e => setRiskPct(Number(e.target.value))}
              className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono"
            />
          </label>
          <label className="block">
            <span className="text-[11px] text-slate-400 font-semibold uppercase">₹ per point / lot</span>
            <input
              type="number"
              value={pointValue}
              onChange={e => setPointValue(Number(e.target.value))}
              className="mt-1 w-full bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono"
            />
          </label>
        </div>

        {!band && (
          <div className="rounded-lg bg-slate-800/60 border border-white/10 p-4 text-sm text-slate-400">
            No calibrated band yet — the forecast needs {series.minLiveBars} minutes of live session data.
          </div>
        )}

        {plan && isRiskFailure(plan) && (
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-4">
            <div className="flex items-start gap-2">
              <AlertTriangle size={15} className="text-amber-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-300">{plan.reason}</p>
            </div>
          </div>
        )}

        {plan && !isRiskFailure(plan) && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Stop distance</div>
                <div className="text-xl font-bold text-white font-mono">{plan.stopPts.toFixed(1)}</div>
                <div className="text-[10px] text-slate-500">points</div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Target</div>
                <div className="text-xl font-bold text-emerald-400 font-mono">{plan.targetPts.toFixed(1)}</div>
                <div className="text-[10px] text-slate-500">{plan.rr.toFixed(1)}:1 reward/risk</div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">Lots</div>
                <div className="text-xl font-bold text-white font-mono">{plan.lots}</div>
                <div className="text-[10px] text-slate-500">₹{plan.riskAmount.toLocaleString('en-IN')} at risk</div>
              </div>
              <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
                <div className="text-[10px] text-slate-500 uppercase font-semibold">P(stop hit)</div>
                <div className="text-xl font-bold text-amber-400 font-mono">
                  {(plan.probStopHit * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-slate-500">before {band?.horizon}m</div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-lg p-3">
                <div className="text-[10px] text-emerald-300 uppercase font-bold mb-1">If long</div>
                <div className="flex justify-between text-sm font-mono text-slate-200">
                  <span>Stop {plan.longStop.toFixed(1)}</span>
                  <span>Target {plan.longTarget.toFixed(1)}</span>
                </div>
              </div>
              <div className="bg-rose-500/10 border border-rose-500/25 rounded-lg p-3">
                <div className="text-[10px] text-rose-300 uppercase font-bold mb-1">If short</div>
                <div className="flex justify-between text-sm font-mono text-slate-200">
                  <span>Stop {plan.shortStop.toFixed(1)}</span>
                  <span>Target {plan.shortTarget.toFixed(1)}</span>
                </div>
              </div>
            </div>

            {plan.notes.map((n, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-400 mb-1.5">
                <Info size={13} className="mt-0.5 shrink-0 text-slate-500" />
                <span>{n}</span>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

export default RegimeRadarPanel;
