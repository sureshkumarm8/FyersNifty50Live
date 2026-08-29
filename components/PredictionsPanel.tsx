/**
 * PREDICTIONS PANEL — model-driven forecaster, usable from any screen.
 *
 * Both methods now run the trained model in services/predictionModel.ts rather
 * than the old hand-tuned decay curves. They differ only in what they feed it:
 *
 *   Method 1  ARCHIVED  Features built from stored archives alone. Works with
 *                       no live feed.
 *   Method 2  HYBRID    Features built from the live session, with archived
 *                       rows backfilling the warm-up window when the session is
 *                       still young. Once enough live bars exist it is pure live.
 *
 * Why the output looks different to the old version: the old table's Adv/Dec,
 * Stk Str, Call/Put Str and Buy/Sell flow columns were produced by Math.random()
 * and by arithmetic over archive columns that are identically zero in every
 * exported row, so they were noise presented as forecasts. They are gone. What
 * replaced them is the part the data actually supports — a calibrated price
 * range — plus the sentiment and PCR forecasts, which were measured to beat
 * persistence out-of-sample.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Brain, Download, Info, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { MarketSnapshot } from '../types';
import { dbService } from '../services/db';
import {
  forecast,
  isForecastFailure,
  usableRunBars,
  toModelRows,
  MIN_BARS,
  ForecastResult,
  MODEL_META,
  HorizonForecast,
  ModelInputRow
} from '../services/predictionModel';

/** Kept as the panel's public row type; now sourced from the model. */
export type PredictedSnapshot = HorizonForecast;

const pct = (v: number) => `${(v * 100).toFixed(0)}%`;

/** Model card — states up front what the model can and cannot do. */
const ModelCard: React.FC = () => (
  <div className="mb-4 rounded-lg border border-white/10 bg-slate-900/40 p-3">
    <div className="flex items-start gap-2">
      <ShieldCheck size={15} className="mt-0.5 flex-shrink-0 text-emerald-400" />
      <div className="text-[11px] leading-relaxed text-slate-300">
        <span className="font-bold text-emerald-400">Validated model</span>
        <span className="text-slate-500">
          {' '}
          • trained on {MODEL_META.dataset.samples.toLocaleString()} samples from {MODEL_META.dataset.sessions} sessions
          ({MODEL_META.dataset.from} → {MODEL_META.dataset.to})
        </span>
        <div className="mt-1 grid grid-cols-1 gap-x-6 gap-y-0.5 sm:grid-cols-2">
          <div>
            <span className="text-emerald-400">✓</span> 80% range band covered{' '}
            <span className="font-mono text-white">78–81%</span> of outcomes in every volatility regime
          </div>
          <div>
            <span className="text-emerald-400">✓</span> Sentiment &amp; PCR beat persistence at all six horizons
          </div>
          <div className="sm:col-span-2">
            <span className="text-amber-400">⚠</span> Direction is <span className="font-bold">not</span> predictable at
            these horizons — walk-forward testing beat “assume no move” by 0.1%, i.e. not at all. Treat the range, not
            the midpoint, as the forecast.
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const PredictionTable: React.FC<{ predictions: PredictedSnapshot[]; type: string }> = ({
  predictions,
  type
}) => {
  const archived = type === 'archived';
  const timeCls = archived ? 'text-blue-400' : 'text-purple-400';
  const confCell = archived ? 'bg-blue-500/10' : 'bg-purple-500/10';
  const confBar = archived ? 'bg-blue-500' : 'bg-purple-500';
  const confText = archived ? 'text-blue-400' : 'text-purple-400';

  return (
    <div className="overflow-x-auto">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-xs text-slate-400">
          {archived ? '📦 Features built from archived snapshots' : '⚡ Features built from the live session'}
        </div>
        <div className="font-mono text-xs text-slate-500">
          {predictions.length} horizons • next {predictions[predictions.length - 1]?.minutes ?? 0} minutes
        </div>
      </div>
      <table className="w-full border-collapse text-center text-sm">
        <thead className="glass-header sticky top-0 text-[9px] font-bold uppercase tracking-widest text-slate-500 sm:text-[10px]">
          <tr>
            <th className="px-2 py-2 text-left sm:px-4 sm:py-3">Time</th>
            <th className="px-1 py-2 sm:px-2 sm:py-3">Expected Nifty</th>
            <th className="px-1 py-2 sm:px-2 sm:py-3">Pts Chg</th>
            <th className="border-l border-white/5 bg-white/5 px-1 py-2 sm:px-2 sm:py-3">80% Range</th>
            <th className="bg-white/5 px-1 py-2 sm:px-2 sm:py-3">Band ±</th>
            <th className="border-l border-white/5 px-1 py-2 sm:px-2 sm:py-3">P(Up)</th>
            <th className="border-l border-white/5 px-1 py-2 sm:px-2 sm:py-3">Overall Sent.</th>
            <th className="px-1 py-2 sm:px-2 sm:py-3">PCR</th>
            <th className={`border-l border-white/5 px-1 py-2 sm:px-2 sm:py-3 ${confCell}`}>Conf</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 bg-slate-900/20">
          {predictions.map((p, idx) => {
            // Anything inside a coin-flip window is shown as neutral rather than
            // dressed up as a call the model cannot make.
            const decisive = Math.abs(p.probUp - 0.5) > 0.05;
            return (
              <tr key={idx} className="group transition-colors hover:bg-white/5">
                <td
                  className={`border-r border-white/5 bg-slate-900/30 px-2 py-2 text-left font-mono text-[10px] font-bold sm:px-4 sm:py-3 sm:text-sm ${timeCls}`}
                >
                  {p.time}
                  <span className="ml-1 text-[9px] text-slate-600">+{p.minutes}m</span>
                </td>
                <td className="px-1 py-2 font-mono text-[10px] text-slate-300 group-hover:text-white sm:px-2 sm:py-3 sm:text-sm">
                  {p.niftyLtp.toFixed(2)}
                </td>
                <td
                  className={`px-1 py-2 font-mono text-[10px] font-bold sm:px-2 sm:py-3 sm:text-sm ${
                    p.ptsChg >= 0 ? 'text-bull' : 'text-bear'
                  }`}
                >
                  {p.ptsChg > 0 ? '+' : ''}
                  {p.ptsChg.toFixed(1)}
                </td>
                <td className="border-l border-white/5 bg-white/5 px-1 py-2 font-mono text-[10px] sm:px-2 sm:py-3 sm:text-sm">
                  <span className="text-bear">{p.low.toFixed(0)}</span>
                  <span className="mx-1 text-slate-600">–</span>
                  <span className="text-bull">{p.high.toFixed(0)}</span>
                </td>
                <td className="bg-white/5 px-1 py-2 font-mono text-[10px] font-bold text-amber-300 sm:px-2 sm:py-3 sm:text-sm">
                  ±{p.bandPts.toFixed(0)}
                </td>
                <td className="border-l border-white/5 px-1 py-2 text-[10px] sm:px-2 sm:py-3 sm:text-sm">
                  {decisive ? (
                    <span className={`font-bold ${p.probUp > 0.5 ? 'text-bull' : 'text-bear'}`}>{pct(p.probUp)}</span>
                  ) : (
                    <span
                      className="font-mono text-slate-500"
                      title="Inside the model's coin-flip range — no directional edge"
                    >
                      {pct(p.probUp)}
                    </span>
                  )}
                </td>
                <td className="border-l border-white/5 bg-white/5 px-1 py-2 text-[10px] font-bold sm:px-2 sm:py-3 sm:text-sm">
                  <span className={p.overallSent >= 0 ? 'text-bull text-glow-green' : 'text-bear text-glow-red'}>
                    {p.overallSent > 0 ? '+' : ''}
                    {p.overallSent.toFixed(1)}%
                  </span>
                </td>
                <td
                  className={`px-1 py-2 font-mono text-[10px] font-bold sm:px-2 sm:py-3 sm:text-sm ${
                    p.pcr > 1 ? 'text-bull' : p.pcr < 0.7 ? 'text-bear' : 'text-blue-200'
                  }`}
                >
                  {p.pcr.toFixed(2)}
                </td>
                <td className={`border-l border-white/5 px-1 py-2 sm:px-2 sm:py-3 ${confCell}`}>
                  <div className="flex items-center justify-center gap-1">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-800">
                      <div className={`h-full transition-all ${confBar}`} style={{ width: `${p.confidence}%` }} />
                    </div>
                    <span className={`min-w-[25px] text-[9px] font-bold ${confText}`}>{p.confidence.toFixed(0)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <div className="mt-4 flex items-start gap-3 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
        <AlertTriangle size={16} className="mt-0.5 flex-shrink-0 text-yellow-400" />
        <div className="text-xs text-slate-300">
          <p className="mb-1 font-bold text-yellow-400">How to read this</p>
          <p>
            The <span className="font-bold">80% Range</span> is the trustworthy output: the index finished inside it in
            roughly 4 of every 5 back-tested cases. The Expected Nifty column is the band's midpoint and carries no
            proven directional edge — do not trade it on its own.
          </p>
        </div>
      </div>
    </div>
  );
};

interface PredictionsPanelProps {
  /** Live session snapshots, newest first. */
  historyLog: MarketSnapshot[];
  currentSnapshot?: MarketSnapshot | null;
  /**
   * Archives already loaded by the host screen. Omit and the panel reads them
   * from IndexedDB itself, so it works standalone.
   */
  archivedSnapshots?: MarketSnapshot[];
}

export const PredictionsPanel: React.FC<PredictionsPanelProps> = ({
  historyLog,
  currentSnapshot,
  archivedSnapshots: providedArchives
}) => {
  const [loadedArchives, setLoadedArchives] = useState<MarketSnapshot[]>([]);
  /** Date-anchored model rows, one group per archived day. */
  const [archiveDayRows, setArchiveDayRows] = useState<ModelInputRow[][]>([]);
  const [archivedPredictions, setArchivedPredictions] = useState<PredictedSnapshot[]>([]);
  const [hybridPredictions, setHybridPredictions] = useState<PredictedSnapshot[]>([]);
  const [isArchivePredicting, setIsArchivePredicting] = useState(false);
  const [isHybridPredicting, setIsHybridPredicting] = useState(false);
  const [archiveError, setArchiveError] = useState<string | null>(null);
  const [hybridError, setHybridError] = useState<string | null>(null);
  const [hybridBackfilled, setHybridBackfilled] = useState(false);
  /** Kept so the warm-up notice can state the live-bar count and band widening. */
  const [hybridWarmup, setHybridWarmup] = useState<ForecastResult | null>(null);

  const archivedSnapshots = providedArchives ?? loadedArchives;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await dbService.init();
        const archives = await dbService.getAllArchives();
        // Anchor each day's snapshots with that archive's own date. Flattening
        // first would discard the date, and snapshots that carry only a
        // "HH:MM:SS" label would all collapse onto today.
        const perDay = archives
          .slice()
          .sort((a, b) => (a.date < b.date ? -1 : 1))
          .map(a => toModelRows(a.snapshots || [], a.date))
          .filter(rows => rows.length > 0);
        const all: MarketSnapshot[] = [];
        archives.forEach(archive => all.push(...(archive.snapshots || [])));
        all.sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
        if (!cancelled) {
          setArchiveDayRows(perDay);
          if (!providedArchives) setLoadedArchives(all);
        }
      } catch (error) {
        console.error('❌ Predictions: failed to load archived data:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [providedArchives]);

  // Always modelled from the date-anchored rows, so Method 1 behaves the same
  // whether the host screen supplied archives or the panel loaded them.
  const archiveRows = useMemo(() => archiveDayRows.flat(), [archiveDayRows]);

  /**
   * The gate is the longest unbroken, densely-sampled run — not the total row
   * count: 654 rows spread thinly over four months still cannot feed a
   * 32-minute window.
   */
  const archiveBestRun = useMemo(() => usableRunBars(archiveRows), [archiveRows]);
  const liveRows = useMemo(() => {
    const rows = toModelRows(historyLog);
    if (rows.length === 0 && currentSnapshot) return toModelRows([currentSnapshot]);
    return rows;
  }, [historyLog, currentSnapshot]);

  const generateArchived = useCallback(() => {
    setIsArchivePredicting(true);
    setArchiveError(null);
    try {
      const result = forecast(archiveRows);
      if (isForecastFailure(result)) {
        setArchiveError(result.reason);
        setArchivedPredictions([]);
        return;
      }
      setArchivedPredictions(result.horizons);
    } catch (error) {
      console.error('Archived prediction error:', error);
      setArchiveError('Failed to generate archived predictions.');
    } finally {
      setIsArchivePredicting(false);
    }
  }, [archiveRows]);

  const generateHybrid = useCallback(() => {
    setIsHybridPredicting(true);
    setHybridError(null);
    try {
      // Early in a session there are not enough live bars to fill the model's
      // 30-minute feature windows. forecast() seeds them from the previous
      // session — level-aligned and re-timestamped so the seed and the session
      // read as one run — and widens the band to keep its 80% coverage true.
      //
      // The previous implementation simply prepended raw archive rows. Because
      // those sit months before the live session, the gap detector split them
      // apart and the "hybrid" forecast was silently computed from the archive
      // run alone rather than from today.
      const result = forecast(liveRows, archiveRows);
      setHybridBackfilled(!isForecastFailure(result) && result.backfilled);
      setHybridWarmup(!isForecastFailure(result) && result.backfilled ? result : null);
      if (isForecastFailure(result)) {
        setHybridError(result.reason);
        setHybridPredictions([]);
        return;
      }
      setHybridPredictions(result.horizons);
    } catch (error) {
      console.error('Hybrid prediction error:', error);
      setHybridError('Failed to generate hybrid predictions.');
    } finally {
      setIsHybridPredicting(false);
    }
  }, [liveRows, archiveRows]);

  return (
    <>
      {/* Method 1: Archived Snapshot Predictions */}
      <div className="glass-panel mb-6 rounded-xl border border-blue-500/30 bg-blue-500/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-600 p-2">
              <Download size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Method 1: Archived Data Predictions</h2>
              <p className="text-xs text-slate-400">
                Model features from history only • {archivedSnapshots.length} archived snapshots
              </p>
            </div>
          </div>
          <button
            onClick={generateArchived}
            disabled={isArchivePredicting || archiveBestRun < MIN_BARS}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900"
          >
            {isArchivePredicting ? (
              <>
                <Activity className="animate-spin" size={14} />
                Analyzing...
              </>
            ) : (
              <>
                <Brain size={14} />
                Generate from Archive
              </>
            )}
          </button>
        </div>

        <ModelCard />

        {archiveBestRun < MIN_BARS && (
          <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
            <p className="mb-1 text-sm font-bold text-yellow-400">⚠️ Insufficient archived data</p>
            <p className="text-xs text-slate-400">
              The model needs {MIN_BARS} minutes of <span className="font-bold">continuous</span> history. Longest
              unbroken run found across {archiveDayRows.length} archived day{archiveDayRows.length === 1 ? '' : 's'}:{' '}
              {archiveBestRun} minute{archiveBestRun === 1 ? '' : 's'}. Import a fuller session to use this method.
            </p>
          </div>
        )}

        {archiveError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {archiveError}
          </div>
        )}

        {archivedPredictions.length > 0 && <PredictionTable predictions={archivedPredictions} type="archived" />}

        {archivedPredictions.length === 0 && !archiveError && archiveBestRun >= MIN_BARS && (
          <div className="py-8 text-center text-slate-500">
            <Brain size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">Click "Generate from Archive" to forecast the next 30 minutes</p>
            <p className="mt-2 text-xs text-blue-400">
              ✓ latest unbroken run: {archiveBestRun} minutes across {archiveDayRows.length} archived day
              {archiveDayRows.length === 1 ? '' : 's'}
            </p>
          </div>
        )}
      </div>

      {/* Method 2: Hybrid Live + Archived Predictions */}
      <div className="glass-panel rounded-xl border border-purple-500/30 bg-purple-500/5 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-purple-600 p-2">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Method 2: Hybrid Predictions</h2>
              <p className="text-xs text-slate-400">
                Live session, archive-backfilled while warming up • Live: {historyLog.length} | Archived:{' '}
                {archivedSnapshots.length}
              </p>
            </div>
          </div>
          <button
            onClick={generateHybrid}
            disabled={isHybridPredicting || liveRows.length === 0}
            className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-purple-500 disabled:cursor-not-allowed disabled:bg-purple-900"
          >
            {isHybridPredicting ? (
              <>
                <Activity className="animate-spin" size={14} />
                Predicting...
              </>
            ) : (
              <>
                <Zap size={14} />
                Generate Hybrid
              </>
            )}
          </button>
        </div>

        <ModelCard />

        {liveRows.length === 0 && (
          <div className="mb-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
            <p className="mb-1 text-sm font-bold text-yellow-400">⚠️ No live data yet</p>
            <p className="text-xs text-slate-400">Start the live feed to use this method.</p>
          </div>
        )}

        {hybridError && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
            {hybridError}
          </div>
        )}

        {hybridBackfilled && hybridWarmup && hybridPredictions.length > 0 && (
          <div className="mb-3 flex items-start gap-2 rounded-lg border border-purple-500/30 bg-purple-500/10 p-2 text-[11px] text-purple-200">
            <Info size={13} className="mt-0.5 flex-shrink-0" />
            <span>
              Warming up on <span className="font-bold">{hybridWarmup.liveBars} minute
              {hybridWarmup.liveBars === 1 ? '' : 's'}</span> of live data — the {MIN_BARS}-minute feature window is
              seeded from your previous session, price-aligned so the overnight gap is not read as a move. The band is
              widened <span className="font-mono font-bold">{hybridWarmup.warmupMultiplier.toFixed(1)}×</span> so its
              stated 80% coverage stays true this early, and tightens automatically as the session stands on its own.
            </span>
          </div>
        )}

        {hybridPredictions.length > 0 && <PredictionTable predictions={hybridPredictions} type="hybrid" />}

        {hybridPredictions.length === 0 && !hybridError && liveRows.length > 0 && (
          <div className="py-8 text-center text-slate-500">
            <Sparkles size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-sm">Click "Generate Hybrid" to forecast the next 30 minutes</p>
            <p className="mt-2 text-xs text-purple-400">✓ {liveRows.length} live rows available</p>
          </div>
        )}
      </div>
    </>
  );
};

export default PredictionsPanel;
