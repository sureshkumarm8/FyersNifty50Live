import { useEffect, useRef, useState } from 'react';
import { VisionRun } from '../../types';
import { imageStorageService } from '../../services/imageStorage';
import { DECISION_STATE_KEY, META_STATE_KEY } from '../premarket/model';
import { visionService } from '../../services/visionService';
import { visionArchive } from '../../services/visionArchive';
import { istDayKey } from '../../services/sniperEngine';

export interface PilotSharedSources {
  decision: unknown;
  chartMeta: unknown;
  visionRuns: VisionRun[];
  loading: boolean;
  checkedAt: number | null;
  errors: string[];
}

const message = (error: unknown) => error instanceof Error ? error.message : String(error);

export function usePilotSources(enabled: boolean, visionScreenActive: boolean): PilotSharedSources {
  const [sources, setSources] = useState<PilotSharedSources>({
    decision: null, chartMeta: null, visionRuns: [], loading: true, checkedAt: null, errors: []
  });
  const visionActive = useRef(visionScreenActive);
  visionActive.current = visionScreenActive;
  useEffect(() => {
    if (!enabled) return;
    let stopped = false;
    let busy = false;
    let nextFolderSync = 0;
    let controller: AbortController | null = null;
    const refresh = async () => {
      if (busy || stopped) return;
      busy = true;
      const errors: string[] = [];
      const day = istDayKey(Date.now());
      const cachedVision = async () => {
        // Reuse the folder already configured by Vision, without another picker,
        // capture, model call, or changing its auto-sync preference.
        if (!visionActive.current && Date.now() >= nextFolderSync) {
          nextFolderSync = Date.now() + 60_000;
          try {
            const enabled = localStorage.getItem('vision.archive.autoSync') !== 'off';
            const configured = Number(localStorage.getItem('vision.archive.syncMinutes'));
            nextFolderSync = Date.now() + Math.max(1, Number.isFinite(configured) ? configured : 1) * 60_000;
            if (enabled) {
              const access = await visionArchive.folderAccess();
              if (access === 'granted') {
                const result = await visionArchive.resync(undefined, { silent: true });
                if (result?.errors.length) errors.push(`Vision folder: ${result.errors.join('; ')}`);
              } else if (access === 'prompt') {
                errors.push('Vision folder permission expired. Reconnect the already-configured folder in Vision.');
              }
            }
          } catch (error) {
            errors.push(`Vision folder sync failed; reading the existing cache without renewing its timestamps. ${message(error)}`);
          }
        }
        return visionArchive.getRuns(day);
      };
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 8000);
      const [premarket, meta, archive, live] = await Promise.allSettled([
        imageStorageService.loadState<unknown>(DECISION_STATE_KEY),
        imageStorageService.loadState<unknown>(META_STATE_KEY),
        cachedVision(),
        visionService.getLatest(controller.signal)
      ]);
      clearTimeout(timeout);
      if (premarket.status === 'rejected') errors.push(`PreMkt: ${message(premarket.reason)}`);
      if (meta.status === 'rejected') errors.push(`PreMkt chart metadata: ${message(meta.reason)}`);
      if (archive.status === 'rejected') errors.push(`Vision archive: ${message(archive.reason)}`);
      if (live.status === 'rejected') errors.push(`Live Vision unavailable; checking existing archive. ${message(live.reason)}`);
      if (!stopped) {
        setSources(previous => {
          const runs = new Map<string, VisionRun>();
          for (const run of previous.visionRuns) {
            const captured = Date.parse(run.startedAt);
            if (Number.isFinite(captured) && istDayKey(captured) === day) runs.set(run.id, run);
          }
          if (archive.status === 'fulfilled') for (const run of archive.value) runs.set(run.id, run);
          if (live.status === 'fulfilled' && live.value) runs.set(live.value.id, live.value);
          return {
            decision: premarket.status === 'fulfilled' ? premarket.value ?? null : previous.decision,
            chartMeta: meta.status === 'fulfilled' ? meta.value ?? null : previous.chartMeta,
            visionRuns: [...runs.values()], loading: false, checkedAt: Date.now(), errors
          };
        });
      }
      busy = false;
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 15_000);
    return () => { stopped = true; clearInterval(timer); controller?.abort(); };
  }, [enabled]);
  return sources;
}
