/**
 * Shared archive loader for the AI Lab intelligence panels.
 *
 * Market Memory, Regime Radar and Session Debrief all reason over the same
 * thing: every archived minute, expressed in the forecast model's feature space
 * and labelled with what happened next. Building that series costs a pass over
 * every stored snapshot, so it is built once here and shared.
 *
 * Archives are converted per-day. A snapshot that stores only "HH:MM:SS" has no
 * date of its own, so it must be anchored to the archive it came from —
 * otherwise every session collapses onto today and the feature windows read
 * across month boundaries as if they were consecutive minutes.
 */

import { useState, useEffect, useCallback } from 'react';
import { dbService } from '../../services/db';
import {
  toModelRows,
  buildLabelledSeries,
  buildFeatureSeries,
  prepareRows,
  MIN_LIVE_BARS,
  ModelInputRow,
  LabelledPoint,
  FeaturePoint
} from '../../services/predictionModel';

export interface ArchiveSeries {
  /** Every archived minute, labelled with forward outcomes. */
  history: LabelledPoint[];
  /** Feature points for the live session, newest last. */
  live: FeaturePoint[];
  /** The most recent live feature point — the "now" every panel reasons about. */
  now: FeaturePoint | null;
  /** Raw archived rows, for callers that need to seed their own warm-up. */
  archiveRows: ModelInputRow[];
  /** Bars of genuine live data behind `now`. */
  liveBars: number;
  /** True when the feature windows behind `now` were seeded from the archive. */
  warmingUp: boolean;
  /** Minimum live bars needed before any reading is offered. */
  minLiveBars: number;
  sessions: number;
  snapshots: number;
  loading: boolean;
  error: string | null;
  reload: () => void;
}

export function useArchiveSeries(liveLog: Array<any>): ArchiveSeries {
  const [history, setHistory] = useState<LabelledPoint[]>([]);
  const [archiveRows, setArchiveRows] = useState<ModelInputRow[]>([]);
  const [sessions, setSessions] = useState(0);
  const [snapshots, setSnapshots] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce(n => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        await dbService.init();
        const archives = await dbService.getAllArchives();
        const rows: ModelInputRow[] = [];
        for (const a of archives) {
          rows.push(...toModelRows(a.snapshots as any, a.date));
        }
        rows.sort((x, y) => x.t - y.t);
        const labelled = buildLabelledSeries(rows);
        if (cancelled) return;
        setHistory(labelled);
        setArchiveRows(rows);
        setSessions(archives.length);
        setSnapshots(rows.length);
      } catch (e: any) {
        if (!cancelled) setError(e?.message ?? 'Failed to load archived sessions.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [nonce]);

  // Seed the warm-up from the archive so the panels are usable ~5 minutes into
  // the session instead of ~32. Everything downstream is told that it happened.
  const liveRaw = liveLog && liveLog.length ? toModelRows(liveLog as any) : [];
  const prepared = prepareRows(liveRaw, archiveRows);
  const usable = prepared.liveBars >= MIN_LIVE_BARS;
  const live = usable ? buildFeatureSeries(prepared.rows) : [];

  return {
    history,
    live,
    now: live.length ? live[live.length - 1] : null,
    archiveRows,
    liveBars: prepared.liveBars,
    warmingUp: prepared.backfilledBars > 0,
    minLiveBars: MIN_LIVE_BARS,
    sessions,
    snapshots,
    loading,
    error,
    reload
  };
}
