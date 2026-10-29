/**
 * NIFTY50OPS — the operator tab.
 *
 * Status strip (deterministic health) · chat with the ops agent (answers cite
 * their data) · today's activity timeline (daemon runs, alerts, notifications).
 * The agent behind it is read-only by default and never places trades; see
 * NIFTY50OPS_AGENT_PLAN.md and ops/.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Radar } from 'lucide-react';
import {
  fetchOpsConfig, fetchOpsEvents, fetchOpsHealth, fetchOpsState, OpsConfig, OpsEvent, OpsHealth, OpsStateReply, saveOpsProvider
} from '../services/opsClient';
import { FyersCredentials } from '../types';
import { getAIProviderLabel, isLocalCliProvider, localCliModel } from '../services/aiProvider';
import StatusStrip from './ops/StatusStrip';
import OpsChat from './ops/OpsChat';
import ActivityTimeline from './ops/ActivityTimeline';

/**
 * The provider the agent should use, from the app's Settings. Gemini keeps the
 * server's own model (the key and model live in .env.local); Groq, Claude API
 * and Cerebras keys exist only in the browser, so the server cannot use them.
 */
export function opsProviderFromSettings(c: FyersCredentials): { provider: string; model: string | null } | null {
  const p = c.aiProvider || 'gemini';
  if (isLocalCliProvider(p)) return { provider: p, model: localCliModel(c, p) || null };
  if (p === 'ollama') return { provider: 'ollama', model: c.ollamaModel || null };
  if (p === 'gemini') return { provider: 'gemini', model: null };
  return null;
}

const OpsAgent: React.FC<{ active: boolean; credentials: FyersCredentials }> = ({ active, credentials }) => {
  const [health, setHealth] = useState<OpsHealth | null>(null);
  const [state, setState] = useState<OpsStateReply | null>(null);
  const [events, setEvents] = useState<OpsEvent[]>([]);
  const [config, setConfig] = useState<OpsConfig | null>(null);
  const [providerNote, setProviderNote] = useState<string | null>(null);
  const wanted = opsProviderFromSettings(credentials);
  const wantedKey = wanted ? `${wanted.provider}|${wanted.model ?? ''}` : `unsupported|${credentials.aiProvider}`;

  // Follow the AI Provider picked in Settings (saved on the server, so the
  // daemon uses it too).
  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    if (!wanted) {
      setProviderNote(`${getAIProviderLabel(credentials)} can't run on the server (its key is only in this browser), so Nifty50Ops keeps its own provider.`);
      fetchOpsConfig().then(c => { if (!cancelled) setConfig(c); }).catch(() => {});
      return () => { cancelled = true; };
    }
    saveOpsProvider(wanted.provider, wanted.model)
      .then(c => { if (!cancelled) { setConfig(c); setProviderNote(null); } })
      .catch(e => {
        if (cancelled) return;
        setProviderNote(e.message);
        fetchOpsConfig().then(c => { if (!cancelled) setConfig(c); }).catch(() => {});
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, wantedKey]);

  const [error, setError] = useState<string | null>(null);
  const sinceRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    const loadHealth = () =>
      fetchOpsHealth()
        .then(h => { if (!cancelled) { setHealth(h); setError(null); } })
        .catch(e => { if (!cancelled) setError(e.message); });
    const loadState = () => fetchOpsState().then(s => { if (!cancelled) setState(s); }).catch(() => {});
    const loadEvents = () =>
      fetchOpsEvents(sinceRef.current)
        .then(evts => {
          if (cancelled || evts.length === 0) return;
          sinceRef.current = Math.max(...evts.map(e => e.timestamp)) + 1;
          setEvents(prev => [...prev, ...evts].slice(-300));
        })
        .catch(() => {});

    void loadHealth();
    void loadState();
    void loadEvents();
    const h = window.setInterval(loadHealth, 30_000);
    const s = window.setInterval(loadState, 5_000);
    const ev = window.setInterval(loadEvents, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(h);
      window.clearInterval(s);
      window.clearInterval(ev);
    };
  }, [active]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 px-3 pb-3 sm:px-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-cyan-300" />
          <h1 className="text-base font-black tracking-tight text-slate-100">Nifty50Ops</h1>
          {config && (
            <span
              className="text-[10px] text-slate-500"
              title={config.source === 'settings' ? 'From Settings → AI Provider' : config.source === 'env' ? 'From OPS_AI_PROVIDER in .env.local' : 'Default: Gemini key if set, else Ollama'}
            >
              {config.provider}{config.model ? `:${config.model}` : ''} · {config.source === 'settings' ? 'from Settings' : config.source === 'env' ? 'from .env.local' : 'default'}
            </span>
          )}
          {providerNote && <span className="text-[10px] text-amber-400">{providerNote}</span>}
        </div>
        <div className="min-w-0 flex-1">
          <StatusStrip health={health} state={state} error={error} />
        </div>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="min-h-[420px] lg:col-span-2">
          <OpsChat level={config?.chatLevel ?? null} />
        </div>
        <div className="min-h-[240px]">
          <ActivityTimeline events={events} />
        </div>
      </div>
    </div>
  );
};

export default OpsAgent;
