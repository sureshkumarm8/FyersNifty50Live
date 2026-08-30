import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Eye, RefreshCw, Play, Pause, Clock, AlertTriangle, CheckCircle2,
  TrendingUp, TrendingDown, Minus, Activity, Monitor, MonitorOff,
  Trash2, Camera, Cpu, Radio, ChevronRight, ExternalLink, HardDrive
} from 'lucide-react';
import { VisionRun, VisionStatus, VisionVerdict, VisionBias } from '../types';
import { visionService, shotUrl, VisionSidecarOfflineError } from '../services/visionService';

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

const OfflineNotice: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="flex-1 flex items-center justify-center p-6">
    <div className="glass-panel rounded-2xl p-8 max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400"><HardDrive size={24} /></div>
        <div>
          <h2 className="text-lg font-bold text-white">Capture Engine Not Running</h2>
          <p className="text-xs text-slate-400">{message}</p>
        </div>
      </div>

      <div className="space-y-3 text-xs text-slate-300">
        <p className="leading-relaxed">
          This screen drives a real Chrome window that stays logged in to Zerodha Kite and Sensibull,
          screenshots both charts every cycle and reads them with a local Ollama vision model.
          It has to run on your machine, so it is not available in a deployed build.
        </p>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-[11px] space-y-1">
          <div className="text-slate-500"># 1. start the local dashboard server</div>
          <div className="text-cyan-400">npm run server</div>
          <div className="text-slate-500 pt-2"># 2. start the capture engine</div>
          <div className="text-cyan-400">cd ../liveImageAnalsis &amp;&amp; npm start</div>
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

  const load = useCallback(async () => {
    try {
      const [s, h] = await Promise.all([visionService.getStatus(), visionService.getHistory(40)]);
      setStatus(s);
      setRuns(h);
      setOffline(null);
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
  }, [load]);

  // Live push from the engine: status transitions and finished runs.
  useEffect(() => {
    if (offline) return;
    const unsubscribe = visionService.subscribe({
      onStatus: (s) => { setStatus(s); setError(s.lastError); },
      onRun: (run) => setRuns((prev) => (prev.some((r) => r.id === run.id) ? prev : [run, ...prev].slice(0, 40))),
      onError: (message) => setError(message),
    });
    return unsubscribe;
  }, [offline]);

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

  if (offline) return <OfflineNotice message={offline} onRetry={() => { setOffline(null); load(); }} />;

  const selected = runs.find((r) => r.id === selectedId) || runs[0] || null;
  const verdict = selected?.analysis?.parsed || null;
  const isLive = !selectedId || selected?.id === runs[0]?.id;
  const needsLogin = status?.targets?.filter((t) => t.awaitingLogin) || [];

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
            <p className="text-xs text-slate-400 font-mono">Chart screenshots read by a local vision model</p>
            {status && (
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
            {status && (
              <span className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                <Cpu size={11} /> {status.model}
              </span>
            )}
          </div>
        </div>

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
        </div>
      </div>

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
            <span className="ml-auto text-[10px] text-slate-500 font-mono">{runs.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-white/5">
            {runs.map((run, idx) => {
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
                    {idx === 0 && <span className="text-[9px] font-bold text-cyan-400 uppercase">Live</span>}
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
            {runs.length === 0 && (
              <p className="p-4 text-xs text-slate-500">No runs captured yet.</p>
            )}
          </div>
        </div>

        {/* Selected run */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1">
          {!selected && (
            <div className="glass-panel rounded-xl p-8 text-center">
              <Camera size={40} className="mx-auto text-slate-700 mb-3" />
              <p className="text-sm text-slate-400">No captures yet. Press <strong className="text-white">Capture Now</strong> to take the first one.</p>
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
                {isLive && <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase">Latest</span>}
                {selectedId && !isLive && (
                  <button onClick={() => setSelectedId(null)} className="text-cyan-400 hover:underline text-[11px]">
                    Back to latest
                  </button>
                )}
              </div>

              {/* Screenshots */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selected.shots.map((shot) => {
                  const src = shotUrl(shot.shotUrl);
                  return (
                    <div key={shot.id} className="glass-panel rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between gap-2">
                        <h3 className="text-xs font-bold text-white truncate">{shot.label}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {shot.awaitingLogin && (
                            <span className="text-[9px] font-bold text-amber-400 uppercase">Login</span>
                          )}
                          {shot.ok
                            ? <CheckCircle2 size={13} className="text-emerald-500" />
                            : <AlertTriangle size={13} className="text-red-500" />}
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
                          {shot.error || 'No screenshot captured.'}
                        </div>
                      )}
                      {shot.notes?.length ? (
                        <p className="px-4 py-2 text-[10px] text-amber-500/80 border-t border-white/5">{shot.notes.join(' · ')}</p>
                      ) : null}
                    </div>
                  );
                })}
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
