import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Eye, RefreshCw, Play, Pause, Clock, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Minus, Activity, Monitor, MonitorOff,
  Trash2, Camera, Cpu, Radio, ChevronRight, ExternalLink, HardDrive,
  FolderOpen, FileJson, Archive, Download, Zap
} from 'lucide-react';
import { VisionRun, VisionShot, VisionStatus, VisionVerdict, VisionBias } from '../types';
import { visionService, shotUrl, VisionSidecarOfflineError } from '../services/visionService';
import { visionArchive, VisionArchiveSummary, VisionArchiveImport } from '../services/visionArchive';

interface VisionAnalysisProps {
  niftyLtp: number | null;
}

const BIAS_STYLE: Record<VisionBias, { chip: string; text: string; Icon: React.ElementType }> = {
  bullish: { chip: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-400', Icon: TrendingUp },
  bearish: { chip: 'bg-red-500/10 border-red-500/30', text: 'text-red-400', Icon: TrendingDown },
  neutral: { chip: 'bg-slate-500/10 border-slate-500/30', text: 'text-slate-300', Icon: Minus },
  choppy: { chip: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-400', Icon: Activity },
  unclear: { chip: 'bg-slate-700/30 border-white/10', text: 'text-slate-400', Icon: AlertTriangle },
};

const biasStyle = (bias?: VisionBias) => BIAS_STYLE[bias || 'unclear'] || BIAS_STYLE.unclear;

const AUTO_SYNC_KEY = 'vision.archive.autoSync';
const SYNC_MINS_KEY = 'vision.archive.syncMinutes';
const SYNC_MINUTE_OPTIONS = [1, 2, 5, 15];

const timeOf = (iso?: string) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '--:--:--';

/** Countdown to the next scheduled capture. */
const Countdown: React.FC<{ target: number | null }> = ({ target }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  if (!target) return <span className="font-mono text-slate-500">paused</span>;
  const left = Math.max(0, Math.round((target - now) / 1000));
  return <span className="font-mono text-white">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>;
};

const LevelList: React.FC<{ title: string; items: string[]; tone: 'up' | 'down' }> = ({ title, items, tone }) => (
  <div className="space-y-2">
    <h4 className={`text-[10px] font-bold uppercase tracking-wider ${tone === 'up' ? 'text-emerald-400' : 'text-red-400'}`}>{title}</h4>
    {items?.length ? (
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-slate-300 flex gap-2 leading-relaxed">
            <ChevronRight size={12} className={`mt-0.5 shrink-0 ${tone === 'up' ? 'text-emerald-500' : 'text-red-500'}`} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-xs text-slate-600">None identified.</p>
    )}
  </div>
);

const Verdict: React.FC<{ verdict: VisionVerdict; niftyLtp: number | null }> = ({ verdict, niftyLtp }) => {
  const style = biasStyle(verdict.bias);
  const { Icon } = style;

  return (
    <div className="space-y-4">
      <div className={`flex flex-wrap items-center gap-4 p-4 rounded-xl border ${style.chip}`}>
        <div className={`flex items-center gap-2 ${style.text}`}>
          <Icon size={24} />
          <span className="text-2xl font-black uppercase tracking-wide">{verdict.bias}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Confidence</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${verdict.confidence >= 70 ? 'bg-emerald-500' : verdict.confidence >= 45 ? 'bg-amber-500' : 'bg-red-500'}`}
                style={{ width: `${Math.min(100, Math.max(0, verdict.confidence))}%` }}
              />
            </div>
            <span className="text-sm font-bold text-white font-mono">{verdict.confidence}%</span>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Spot (read from chart)</span>
          <span className="text-sm font-bold text-white font-mono">{verdict.spot_estimate}</span>
        </div>
        {niftyLtp && (
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Live Feed</span>
            <span className="text-sm font-bold text-blue-400 font-mono">{niftyLtp.toFixed(2)}</span>
          </div>
        )}
        {!verdict.readable && (
          <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold">
            <AlertTriangle size={12} /> CHARTS NOT FULLY READABLE
          </div>
        )}
      </div>

      <div className="glass-panel p-4 rounded-xl">
        <h4 className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-2">Combined View</h4>
        <p className="text-sm text-slate-200 leading-relaxed">{verdict.combined_view}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Price Action (Kite)</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{verdict.price_action}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Open Interest (Sensibull)</h4>
          <p className="text-xs text-slate-300 leading-relaxed">{verdict.oi_read}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-1">Highest Call OI</h4>
          <p className="text-sm text-white font-mono font-bold">{verdict.highest_call_oi_strike}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">Highest Put OI</h4>
          <p className="text-sm text-white font-mono font-bold">{verdict.highest_put_oi_strike}</p>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-blue-400 mb-1">Expected Range</h4>
          <p className="text-sm text-white font-mono font-bold">{verdict.expected_range}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 glass-panel p-4 rounded-xl">
        <LevelList title="Supports" items={verdict.supports} tone="up" />
        <LevelList title="Resistances" items={verdict.resistances} tone="down" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-400 mb-2">Watch For</h4>
          <ul className="space-y-1.5">
            {verdict.watch_for?.map((w, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-2 leading-relaxed">
                <Eye size={12} className="mt-0.5 shrink-0 text-amber-500" /><span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="glass-panel p-4 rounded-xl">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-red-400 mb-2">Risks</h4>
          <ul className="space-y-1.5">
            {verdict.risks?.map((r, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-2 leading-relaxed">
                <AlertTriangle size={12} className="mt-0.5 shrink-0 text-red-500" /><span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {verdict.notes && (
        <p className="text-[11px] text-slate-500 italic px-1">{verdict.notes}</p>
      )}
    </div>
  );
};

/** Screenshot tile. Live runs stream from the sidecar proxy; archived ones come out of IndexedDB. */
const ShotCard: React.FC<{ shot: VisionShot; archived: boolean }> = ({ shot, archived }) => {
  const [src, setSrc] = useState<string | null>(archived ? null : shotUrl(shot.shotUrl));

  useEffect(() => {
    if (!archived) {
      setSrc(shotUrl(shot.shotUrl));
      return;
    }
    let objectUrl: string | null = null;
    let cancelled = false;
    setSrc(null);
    visionArchive
      .getImage(shot.file)
      .then((blob) => {
        if (!blob || cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [archived, shot.file, shot.shotUrl]);

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-white truncate">{shot.label}</h3>
        <div className="flex items-center gap-2 shrink-0">
          {shot.awaitingLogin && <span className="text-[9px] font-bold text-amber-400 uppercase">Login</span>}
          {shot.ok ? <CheckCircle2 size={13} className="text-emerald-500" /> : <AlertTriangle size={13} className="text-red-500" />}
          <a href={shot.url} target="_blank" rel="noreferrer" className="text-slate-500 hover:text-white">
            <ExternalLink size={12} />
          </a>
        </div>
      </div>
      {src ? (
        <a href={src} target="_blank" rel="noreferrer">
          <img src={src} alt={shot.label} loading="lazy" className="w-full bg-slate-950 hover:opacity-90 transition-opacity" />
        </a>
      ) : (
        <div className="p-8 text-center text-xs text-slate-500">
          {shot.error || (archived ? 'Screenshot not included in this import.' : 'No screenshot captured.')}
        </div>
      )}
      {shot.notes?.length ? (
        <p className="px-4 py-2 text-[10px] text-amber-500/80 border-t border-white/5">{shot.notes.join(' · ')}</p>
      ) : null}
    </div>
  );
};

interface ImporterProps {
  summary: VisionArchiveSummary | null;
  busy: string | null;
  note: string | null;
  /** The folder is remembered but the browser needs one click to re-grant read access. */
  needsReconnect: boolean;
  syncing: boolean;
  onPickFolder: () => void;
  onFiles: (files: FileList | File[]) => void;
  onResync: () => void;
}

/**
 * Loads an export produced by the capture engine (`npm run export` there, or written
 * automatically after every run) straight off disk. Nothing is uploaded — the files are
 * read in the browser and cached in IndexedDB, so this works on a deployed build with
 * no local server at all.
 */
const ArchiveImporter: React.FC<ImporterProps> = ({
  summary, busy, note, needsReconnect, syncing, onPickFolder, onFiles, onResync,
}) => {
  const folderInput = useRef<HTMLInputElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
      }}
      className={`rounded-xl border-2 border-dashed p-4 space-y-3 transition-colors ${
        dragging ? 'border-cyan-500 bg-cyan-500/5' : 'border-slate-700 bg-slate-950/40'
      }`}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-white">
        <Archive size={14} className="text-cyan-400" /> Import saved analysis
      </div>
      <p className="text-[11px] text-slate-400 leading-relaxed">
        The engine mirrors every run into{' '}
        <span className="font-mono text-slate-300">liveImageAnalsis/data/exports/</span>. Pick that folder once — or drop
        <span className="font-mono text-slate-300"> vision-YYYY-MM-DD.json</span> files here — and the whole history,
        charts included, is read locally in your browser.
        {visionArchive.directoryPickerSupported() && ' A picked folder is remembered and re-scanned automatically, so new captures appear on their own.'}
      </p>

      {needsReconnect && (
        <button
          onClick={onResync}
          disabled={Boolean(busy)}
          className="w-full px-3 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-200 hover:bg-amber-500/25 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
        >
          <RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />
          Reconnect {summary?.sourceName ? `"${summary.sourceName}"` : 'folder'} to resume auto-sync
        </button>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => (visionArchive.directoryPickerSupported() ? onPickFolder() : folderInput.current?.click())}
          disabled={Boolean(busy)}
          className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-2"
        >
          <FolderOpen size={14} /> Choose exports folder
        </button>

        <button
          onClick={() => fileInput.current?.click()}
          disabled={Boolean(busy)}
          className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-2"
        >
          <FileJson size={14} /> Choose JSON files
        </button>

        {summary?.canResync && (
          <button
            onClick={onResync}
            disabled={Boolean(busy)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 disabled:opacity-40 text-slate-200 rounded-lg text-xs font-bold flex items-center gap-2"
            title="Re-read the folder picked earlier and pull in anything new"
          >
            <RefreshCw size={14} className={busy || syncing ? 'animate-spin' : ''} /> Sync now
          </button>
        )}
      </div>

      {busy && <p className="text-[11px] text-cyan-300 font-mono truncate">{busy}</p>}
      {!busy && note && (
        <p className="text-[11px] text-emerald-300 flex items-center gap-1.5">
          <CheckCircle2 size={12} className="shrink-0" /> {note}
        </p>
      )}

      {summary && summary.runs > 0 && (
        <p className="text-[11px] text-slate-400">
          <span className="text-emerald-400 font-bold">{summary.runs} runs</span> and {summary.images} screenshots cached
          {summary.sourceName ? ` from ${summary.sourceName}` : ''}
          {summary.days.length ? ` · ${summary.days.length} day(s): ${summary.days.slice(0, 4).map((d) => d.date).join(', ')}` : ''}
        </p>
      )}

      {/* webkitdirectory is non-standard but supported everywhere, and hands us the PNGs too. */}
      <input
        ref={folderInput}
        type="file"
        multiple
        // @ts-expect-error - non-standard directory picker attributes
        webkitdirectory=""
        directory=""
        className="hidden"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
      <input
        ref={fileInput}
        type="file"
        multiple
        accept=".json,.png,.jpg,.jpeg,.webp"
        className="hidden"
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
    </div>
  );
};

const OfflineNotice: React.FC<{
  message: string;
  onRetry: () => void;
  onOpenArchive: () => void;
  importer: ImporterProps;
}> = ({ message, onRetry, onOpenArchive, importer }) => (
  <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex items-start justify-center">
    <div className="glass-panel rounded-2xl p-8 max-w-2xl w-full space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400"><HardDrive size={24} /></div>
        <div>
          <h2 className="text-lg font-bold text-white">Capture Engine Not Running</h2>
          <p className="text-xs text-slate-400">{message}</p>
        </div>
      </div>

      {(importer.summary?.runs ?? 0) > 0 && (
        <button
          onClick={onOpenArchive}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
        >
          <Zap size={14} /> Open imported analysis ({importer.summary?.runs} runs)
        </button>
      )}

      <ArchiveImporter {...importer} />

      <div className="space-y-3 text-xs text-slate-300">
        <p className="leading-relaxed">
          Live capture drives a real Chrome window that stays logged in to Zerodha Kite and Sensibull,
          screenshots both charts every cycle and reads them with a local Ollama vision model. That part has to run
          on your machine — but its exports can be imported and reviewed anywhere, including here.
        </p>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] space-y-1">
          <div className="text-slate-500"># 1. start the local dashboard server</div>
          <div className="text-cyan-400">npm run server</div>
          <div className="text-slate-500 pt-2"># 2. start the capture engine</div>
          <div className="text-cyan-400">cd ../liveImageAnalsis &amp;&amp; npm start</div>
          <div className="text-slate-500 pt-2"># or export the history for importing above</div>
          <div className="text-cyan-400">cd ../liveImageAnalsis &amp;&amp; npm run export</div>
          <div className="text-slate-500"># add --embed for one self-contained file per day</div>
        </div>
        <p className="text-[11px] text-slate-500">
          The engine listens on <span className="font-mono text-slate-400">http://localhost:4321</span>.
          Override with <span className="font-mono text-slate-400">VISION_SIDECAR_URL</span> if you moved it.
        </p>
      </div>

      <button
        onClick={onRetry}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
      >
        <RefreshCw size={14} /> Retry Connection
      </button>
    </div>
  </div>
);

export const VisionAnalysis: React.FC<VisionAnalysisProps> = ({ niftyLtp }) => {
  const [status, setStatus] = useState<VisionStatus | null>(null);
  const [runs, setRuns] = useState<VisionRun[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [offline, setOffline] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const didLoad = useRef(false);

  // --- archive (imported) mode ---
  const [source, setSource] = useState<'live' | 'archive'>('live');
  const [archiveSummary, setArchiveSummary] = useState<VisionArchiveSummary | null>(null);
  const [archiveRuns, setArchiveRuns] = useState<VisionRun[]>([]);
  const [archiveDay, setArchiveDay] = useState<string>('all');
  const [importBusy, setImportBusy] = useState<string | null>(null);
  const [importNote, setImportNote] = useState<string | null>(null);
  const [showImporter, setShowImporter] = useState(false);
  const [autoSync, setAutoSync] = useState(() => localStorage.getItem(AUTO_SYNC_KEY) !== 'off');
  const [syncMinutes, setSyncMinutes] = useState(() => Number(localStorage.getItem(SYNC_MINS_KEY)) || 1);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [needsReconnect, setNeedsReconnect] = useState(false);
  const syncInFlight = useRef(false);
  // Set when the user explicitly asks for the live engine, so the auto-switch below
  // doesn't yank them straight back into the archive.
  const preferLive = useRef(false);

  const loadArchive = useCallback(async (day: string = 'all') => {
    if (!visionArchive.supported()) return null;
    try {
      const [summary, stored] = await Promise.all([
        visionArchive.getSummary(),
        visionArchive.getRuns(day === 'all' ? undefined : day),
      ]);
      setArchiveSummary(summary);
      setArchiveRuns(stored);
      return summary;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, []);

  const runImport = useCallback(
    async (label: string, job: () => Promise<VisionArchiveImport | null>) => {
      setImportBusy(label);
      setImportNote(null);
      setError(null);
      try {
        const result = await job();
        if (!result) {
          setImportNote('No folder is remembered yet — pick the exports folder first.');
          return;
        }
        setArchiveDay('all');
        const summary = await loadArchive('all');
        setImportNote(
          result.runs || result.images
            ? `Imported ${result.runs} run(s) and ${result.images} screenshot(s) from ${result.bundles} bundle(s).`
            : 'Nothing new to import — everything in that folder was already loaded.'
        );
        if (result.errors.length) setError(result.errors.slice(0, 3).join(' · '));
        if ((summary?.runs ?? 0) > 0) setSelectedId(null);
      } catch (err: any) {
        if (err?.name !== 'AbortError') setError(err.message || 'Import failed.');
      } finally {
        setImportBusy(null);
      }
    },
    [loadArchive]
  );

  /**
   * Pulls anything new out of the connected folder. The silent variant is what the timer
   * calls: it never prompts, so a lapsed permission just flips the Reconnect button on
   * instead of throwing a dialog at the user once a minute.
   */
  const syncNow = useCallback(
    async (silent = true) => {
      if (syncInFlight.current) return;
      syncInFlight.current = true;
      if (!silent) setSyncing(true);
      else setSyncing(true);
      try {
        const result = await visionArchive.resync(undefined, { silent });
        if (!result) {
          setNeedsReconnect((await visionArchive.folderAccess()) === 'prompt');
          return;
        }
        setNeedsReconnect(false);
        setLastSyncAt(Date.now());
        if (result.unchanged) return;
        await loadArchive(archiveDay);
        if (result.newRunIds.length) {
          setImportNote(`Auto-sync picked up ${result.newRunIds.length} new run(s).`);
          // Keep following the latest capture unless a specific run is pinned.
          if (!selectedId) setSelectedId(null);
        }
      } catch (err: any) {
        if (!silent) setError(err.message || 'Folder sync failed.');
      } finally {
        syncInFlight.current = false;
        setSyncing(false);
      }
    },
    [archiveDay, loadArchive, selectedId]
  );

  // Reconnect on load: if the folder grant is still live, the archive fills itself in.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!visionArchive.supported()) return;
      const access = await visionArchive.folderAccess();
      if (cancelled) return;
      if (access === 'prompt') setNeedsReconnect(true);
      if (access === 'granted') await syncNow(true);
    })();
    return () => { cancelled = true; };
    // Intentionally once on mount - syncNow is stable enough for the initial pull.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The poll itself. Cheap: the engine's index.json carries the latest run id, so an
  // unchanged folder costs one small file read.
  useEffect(() => {
    if (!autoSync || !archiveSummary?.canResync) return;
    const timer = setInterval(() => syncNow(true), Math.max(1, syncMinutes) * 60000);
    return () => clearInterval(timer);
  }, [autoSync, syncMinutes, archiveSummary?.canResync, syncNow]);

  useEffect(() => { localStorage.setItem(AUTO_SYNC_KEY, autoSync ? 'on' : 'off'); }, [autoSync]);
  useEffect(() => { localStorage.setItem(SYNC_MINS_KEY, String(syncMinutes)); }, [syncMinutes]);

  const importer: ImporterProps = {
    summary: archiveSummary,
    busy: importBusy,
    note: importNote,
    onPickFolder: () => runImport('Reading folder…', () => visionArchive.pickDirectory((m) => setImportBusy(m))),
    onFiles: (files) =>
      runImport('Reading files…', () =>
        visionArchive.importFiles(files, (done, total) => setImportBusy(`Reading ${done}/${total}…`))
      ),
    onResync: () => runImport('Re-syncing folder…', () => visionArchive.resync((m) => setImportBusy(m))),
    needsReconnect,
    syncing,
  };

  const load = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([visionService.getStatus(), visionService.getHistory(40)]);
      setStatus(s);
      setRuns(h);
      setOffline(null);
      preferLive.current = false;
      setError(s.lastError);
    } catch (err: any) {
      if (err instanceof VisionSidecarOfflineError) setOffline(err.message);
      else setError(err.message);
    }
  }, []);

  useEffect(() => {
    if (didLoad.current) return;
    didLoad.current = true;
    load();
    loadArchive();
  }, [load, loadArchive]);

  // Live push from the engine: status transitions and finished runs.
  useEffect(() => {
    if (offline || source === 'archive') return;
    const unsubscribe = visionService.subscribe({
      onStatus: (s) => { setStatus(s); setError(s.lastError); },
      onRun: (run) => setRuns((prev) => (prev.some((r) => r.id === run.id) ? prev : [run, ...prev].slice(0, 40))),
      onError: (message) => setError(message),
    });
    return unsubscribe;
  }, [offline, source]);

  // With an engine that can't be reached and an archive already on hand, there is nothing
  // useful to click: show the imported data straight away.
  useEffect(() => {
    if (offline && source === 'live' && !preferLive.current && (archiveSummary?.runs ?? 0) > 0) {
      setSource('archive');
    }
  }, [offline, source, archiveSummary?.runs]);

  const act = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (err: any) {
      if (err instanceof VisionSidecarOfflineError) setOffline(err.message);
      else setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const archiveMode = source === 'archive';

  if (offline && !archiveMode) {
    return (
      <OfflineNotice
        message={offline}
        onRetry={() => { preferLive.current = true; setOffline(null); load(); }}
        onOpenArchive={() => { preferLive.current = false; setSelectedId(null); setSource('archive'); }}
        importer={importer}
      />
    );
  }

  const activeRuns = archiveMode ? archiveRuns : runs;
  const selected = activeRuns.find((r) => r.id === selectedId) || activeRuns[0] || null;
  const verdict = selected?.analysis?.parsed || null;
  const isLive = !selectedId || selected?.id === activeRuns[0]?.id;
  const needsLogin = archiveMode ? [] : status?.targets?.filter((t) => t.awaitingLogin) || [];

  return (
    <div className="flex flex-col h-full overflow-hidden p-4 max-w-7xl mx-auto w-full gap-4">

      {/* Header + controls */}
      <div className="flex flex-wrap justify-between items-center gap-3 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Eye className="text-cyan-400" />
            VISION <span className="text-cyan-500">ANALYSIS</span>
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xs text-slate-400 font-mono">
              {archiveMode ? 'Imported archive — read-only replay' : 'Chart screenshots read by a local vision model'}
            </p>
            {archiveMode && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-amber-900/30 border-amber-500/20">
                <Archive size={10} className="text-amber-300" />
                <span className="text-[9px] font-bold uppercase tracking-wide text-amber-300">Archive</span>
              </div>
            )}
            {!archiveMode && status && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-cyan-900/30 border-cyan-500/20">
                <span className="relative flex h-2 w-2">
                  {status.phase !== 'idle' && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${status.paused ? 'bg-slate-500' : 'bg-cyan-500'}`} />
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wide text-cyan-300">
                  {status.paused ? 'Paused' : status.phase === 'idle' ? 'Idle' : status.phase}
                </span>
              </div>
            )}
            {!archiveMode && status && (
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <Cpu size={11} /> {status.model}
              </span>
            )}
            {archiveMode && archiveSummary?.lastImportAt && (
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <Download size={11} /> imported {new Date(archiveSummary.lastImportAt).toLocaleString('en-IN')}
              </span>
            )}
          </div>
        </div>

        {archiveMode ? (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={archiveDay}
              onChange={(e) => { setArchiveDay(e.target.value); setSelectedId(null); loadArchive(e.target.value); }}
              className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white outline-none cursor-pointer focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">All days ({archiveSummary?.runs || 0})</option>
              {archiveSummary?.days.map((d) => (
                <option key={d.date} value={d.date}>{d.date} ({d.runs})</option>
              ))}
            </select>

            {archiveSummary?.canResync && (
              <div
                className={`flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg border text-xs ${
                  needsReconnect
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : autoSync
                      ? 'bg-emerald-500/10 border-emerald-500/25'
                      : 'bg-slate-900/50 border-white/5'
                }`}
                title={
                  needsReconnect
                    ? 'The browser needs one click to re-grant access to the folder'
                    : `Re-scans ${archiveSummary.sourceName || 'the exports folder'} every ${syncMinutes} min and imports new runs automatically`
                }
              >
                <button
                  onClick={() => (needsReconnect ? syncNow(false) : setAutoSync((v) => !v))}
                  className="flex items-center gap-1.5 font-bold"
                >
                  <RefreshCw
                    size={13}
                    className={`${syncing ? 'animate-spin ' : ''}${
                      needsReconnect ? 'text-amber-300' : autoSync ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  />
                  <span className={needsReconnect ? 'text-amber-200' : autoSync ? 'text-emerald-300' : 'text-slate-400'}>
                    {needsReconnect ? 'Reconnect' : autoSync ? 'Auto-sync' : 'Paused'}
                  </span>
                </button>

                {!needsReconnect && (
                  <select
                    value={syncMinutes}
                    onChange={(e) => setSyncMinutes(Number(e.target.value))}
                    className="bg-transparent text-[11px] text-slate-400 outline-none cursor-pointer"
                    title="How often the folder is re-scanned"
                  >
                    {SYNC_MINUTE_OPTIONS.map((m) => (
                      <option key={m} value={m} className="bg-slate-950">{m}m</option>
                    ))}
                  </select>
                )}

                {!needsReconnect && lastSyncAt && (
                  <span className="text-[10px] font-mono text-slate-500 hidden md:inline">{timeOf(new Date(lastSyncAt).toISOString())}</span>
                )}

                <button
                  onClick={() => syncNow(false)}
                  disabled={syncing}
                  className="text-[10px] font-bold uppercase text-slate-400 hover:text-white px-1.5 disabled:opacity-40"
                  title="Sync now"
                >
                  Now
                </button>
              </div>
            )}

            <button
              onClick={() => setShowImporter((v) => !v)}
              className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-xs font-bold flex items-center gap-2"
            >
              <FolderOpen size={14} /><span className="hidden sm:inline">Import data</span>
            </button>

            <button
              onClick={() => { preferLive.current = true; setSource('live'); setSelectedId(null); setOffline(null); load(); }}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-2"
              title="Switch back to the live capture engine"
            >
              <Radio size={14} /><span className="hidden sm:inline">Live engine</span>
            </button>

            <button
              onClick={() => {
                if (!confirm('Delete the imported archive from this browser? The exported files on disk are untouched.')) return;
                visionArchive.clear().then(() => { setArchiveRuns([]); setSelectedId(null); loadArchive('all'); });
              }}
              className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-all"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {status && (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900/50 border border-white/5 text-xs">
              <Clock size={13} className="text-slate-500" />
              <span className="text-slate-400">Next</span>
              <Countdown target={status.paused ? null : status.nextRunAt} />
            </div>
          )}

          {status && (
            <select
              value={Math.round(status.intervalMs / 60000)}
              disabled={busy}
              onChange={(e) => act(() => visionService.setInterval(Number(e.target.value)))}
              className="bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-xs text-white outline-none cursor-pointer focus:ring-2 focus:ring-cyan-500"
            >
              {status.intervalOptions.map((m) => (
                <option key={m} value={m}>{m} min</option>
              ))}
            </select>
          )}

          <button
            onClick={() => act(() => visionService.runNow())}
            disabled={busy || status?.running}
            className="px-3 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
          >
            <Camera size={14} className={status?.running ? 'animate-pulse' : ''} />
            <span className="hidden sm:inline">{status?.running ? 'Running...' : 'Capture Now'}</span>
          </button>

          <button
            onClick={() => act(() => (status?.paused ? visionService.resume() : visionService.pause()))}
            disabled={busy}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
          >
            {status?.paused ? <Play size={14} /> : <Pause size={14} />}
            <span className="hidden sm:inline">{status?.paused ? 'Resume' : 'Pause'}</span>
          </button>

          {status?.windowControl && (
            <button
              onClick={() => act(() => visionService.setWindowVisible(!status.windowVisible))}
              disabled={busy}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
              title={status.windowVisible ? 'Tuck the capture browser away' : 'Bring the capture browser on screen (to log in)'}
            >
              {status.windowVisible ? <MonitorOff size={14} /> : <Monitor size={14} />}
            </button>
          )}

          <button
            onClick={() => { if (confirm('Delete all captured runs and screenshots?')) act(() => visionService.clearHistory()); }}
            disabled={busy}
            className="px-3 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-lg text-xs font-bold transition-all"
          >
            <Trash2 size={14} />
          </button>

          {(archiveSummary?.runs ?? 0) > 0 && (
            <button
              onClick={() => { setSource('archive'); setSelectedId(null); loadArchive(archiveDay); }}
              className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 text-amber-300 hover:bg-amber-500/20 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
              title="Review an imported export instead of the live engine"
            >
              <Archive size={14} /><span className="hidden sm:inline">Archive</span>
            </button>
          )}
        </div>
        )}
      </div>

      {/* Import panel (archive mode) */}
      {archiveMode && showImporter && (
        <div className="shrink-0">
          <ArchiveImporter {...importer} />
        </div>
      )}
      {importNote && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
          <CheckCircle2 size={14} className="shrink-0" /><span>{importNote}</span>
          <button onClick={() => setImportNote(null)} className="ml-auto text-emerald-500/70 hover:text-emerald-300">✕</button>
        </div>
      )}

      {/* Alerts */}
      {needsLogin.length > 0 && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
          <AlertTriangle size={16} className="shrink-0" />
          <span>
            Manual login required for <strong>{needsLogin.map((t) => t.label).join(', ')}</strong>.
            {status?.windowControl && ' Use the monitor button to bring the capture browser on screen.'}
          </span>
        </div>
      )}
      {error && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
          <AlertTriangle size={16} className="shrink-0" /><span>{error}</span>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex gap-4 overflow-hidden">

        {/* Run history rail */}
        <div className="hidden lg:flex flex-col w-56 shrink-0 glass-panel rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <Radio size={14} className="text-slate-500" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Runs</h3>
            <span className="ml-auto text-[10px] text-slate-500 font-mono">{activeRuns.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
            {activeRuns.map((run, idx) => {
              const s = biasStyle(run.analysis?.parsed?.bias);
              const active = selected?.id === run.id;
              return (
                <button
                  key={run.id}
                  onClick={() => setSelectedId(run.id)}
                  className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${active ? 'bg-cyan-500/10 border-l-2 border-cyan-500' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-300">{timeOf(run.startedAt)}</span>
                    {idx === 0 && (
                      <span className={`text-[9px] font-bold uppercase ${archiveMode ? 'text-amber-400' : 'text-cyan-400'}`}>
                        {archiveMode ? 'Newest' : 'Live'}
                      </span>
                    )}
                    {archiveMode && run.day && idx > 0 && activeRuns[idx - 1]?.day !== run.day && (
                      <span className="text-[9px] font-mono text-slate-500">{run.day}</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className={`text-[10px] font-bold uppercase ${s.text}`}>
                      {run.analysis?.parsed?.bias || (run.analysis?.ok ? 'unparsed' : 'failed')}
                    </span>
                    {run.analysis?.parsed && (
                      <span className="text-[10px] font-mono text-slate-500">{run.analysis.parsed.confidence}%</span>
                    )}
                  </div>
                </button>
              );
            })}
            {activeRuns.length === 0 && (
              <p className="p-4 text-xs text-slate-500">
                {archiveMode ? 'Nothing imported yet.' : 'No runs captured yet.'}
              </p>
            )}
          </div>
        </div>

        {/* Selected run */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {!selected && !archiveMode && (
            <div className="glass-panel rounded-xl p-8 text-center">
              <Camera size={40} className="mx-auto text-slate-700 mb-3" />
              <p className="text-sm text-slate-400">No captures yet. Press <strong className="text-white">Capture Now</strong> to take the first one.</p>
            </div>
          )}

          {!selected && archiveMode && (
            <div className="glass-panel rounded-xl p-6 space-y-4">
              <div className="text-center">
                <Archive size={40} className="mx-auto text-slate-700 mb-3" />
                <p className="text-sm text-slate-400">
                  Nothing imported for this selection. Point the picker at the engine's
                  <span className="font-mono text-slate-300"> data/exports </span> folder.
                </p>
              </div>
              <ArchiveImporter {...importer} />
            </div>
          )}

          {selected && (
            <>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Clock size={13} /> {timeOf(selected.startedAt)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Activity size={13} /> {(selected.durationMs / 1000).toFixed(1)}s
                </span>
                {selected.manual && <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-bold uppercase">Manual</span>}
                {isLive && !archiveMode && <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase">Latest</span>}
                {archiveMode && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">
                    {selected.day || 'archived'}
                  </span>
                )}
                {selectedId && !isLive && (
                  <button onClick={() => setSelectedId(null)} className="text-cyan-400 hover:underline text-[11px]">
                    Back to latest
                  </button>
                )}
              </div>

              {/* Screenshots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selected.shots.map((shot) => (
                  <ShotCard key={shot.id} shot={shot} archived={archiveMode} />
                ))}
              </div>

              {/* Verdict */}
              {verdict ? (
                <Verdict verdict={verdict} niftyLtp={niftyLtp} />
              ) : (
                <div className="glass-panel rounded-xl p-6">
                  <div className="flex items-center gap-2 text-amber-400 mb-2">
                    <AlertTriangle size={16} />
                    <h3 className="text-sm font-bold">
                      {selected.analysis?.skipped ? 'Analysis Skipped' : 'No Structured Result'}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selected.analysis?.error || 'The model replied but the response could not be parsed.'}
                  </p>
                  {selected.analysis?.raw && (
                    <pre className="mt-3 p-3 bg-slate-950 rounded-lg text-[10px] text-slate-500 overflow-x-auto max-h-40 custom-scrollbar">
                      {selected.analysis.raw.slice(0, 1200)}
                    </pre>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisionAnalysis;
