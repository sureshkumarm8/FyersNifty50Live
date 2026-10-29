import React from 'react';
import { OpsCheck, OpsHealth, OpsStateReply } from '../../services/opsClient';

const tone = (ok: boolean | null, critical = false) =>
  ok === null
    ? 'border-slate-700 bg-slate-800/60 text-slate-400'
    : ok
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
      : critical
        ? 'border-rose-500/40 bg-rose-500/15 text-rose-200'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-200';

const Pill: React.FC<{ label: string; value: string; ok: boolean | null; critical?: boolean; title?: string }> = ({ label, value, ok, critical, title }) => (
  <div className={`flex min-w-0 items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] ${tone(ok, critical)}`} title={title}>
    <span className="font-semibold uppercase tracking-wide opacity-70">{label}</span>
    <span className="truncate font-mono">{value}</span>
  </div>
);

const find = (h: OpsHealth | null, id: string): OpsCheck | undefined => h?.checks.find(c => c.id === id);

/**
 * One row: server · token · sidecar · app snapshot age · kill · mode.
 * Everything here is from deterministic checks; the model is not involved.
 */
export const StatusStrip: React.FC<{ health: OpsHealth | null; state: OpsStateReply | null; error: string | null }> = ({ health, state, error }) => {
  const server = find(health, 'server');
  const token = find(health, 'token');
  const sidecar = find(health, 'sidecar');
  const kill = find(health, 'kill');
  const snap = state?.snapshot;
  const at = snap?.engines?.autotrade;
  const appOk = state ? Boolean(snap) && !state.stale : null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {error && <Pill label="Server" value="unreachable" ok={false} critical title={error} />}
      {!error && <Pill label="Server" value={server ? (server.ok ? 'up' : 'down') : '…'} ok={server ? server.ok : null} critical title={server?.detail} />}
      <Pill label="Token" value={token ? (token.ok ? 'present' : 'missing') : '…'} ok={token ? token.ok : null} title={token?.detail} />
      <Pill label="Sidecar" value={sidecar ? (sidecar.ok ? 'up' : 'down') : '…'} ok={sidecar ? sidecar.ok : null} title={sidecar?.detail} />
      <Pill
        label="App"
        value={snap ? `${Math.round(state!.ageSec ?? 0)}s ago` : 'not reporting'}
        ok={appOk}
        critical
        title="Age of the last snapshot the app tab published. Stale means the tab is closed, frozen or the Mac slept."
      />
      <Pill label="Kill" value={kill ? (kill.ok ? 'clear' : 'LATCHED') : at?.killed ? 'LATCHED' : '…'} ok={kill ? kill.ok : at ? !at.killed : null} critical title={kill?.detail} />
      <Pill label="Mode" value={at ? at.mode : '—'} ok={at ? at.mode === 'PAPER' : null} critical={at?.mode === 'LIVE'} />
      {health && <span className="ml-auto text-[10px] text-slate-500">checked {health.asOf}</span>}
    </div>
  );
};

export default StatusStrip;
