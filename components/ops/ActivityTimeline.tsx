import React from 'react';
import { AlertTriangle, Bell, Bot, Clock, PlayCircle, ShieldAlert } from 'lucide-react';
import { OpsEvent } from '../../services/opsClient';

const time = (ms: number) =>
  new Date(ms).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

function describe(e: OpsEvent): { icon: React.ReactNode; text: string; tone: string } {
  if (e.kind === 'run') {
    const tone = e.status === 'failed' ? 'text-rose-300' : e.status === 'done' ? 'text-emerald-300' : 'text-slate-400';
    return { icon: <PlayCircle className="h-3.5 w-3.5" />, text: `${e.job} ${e.status}${e.error ? ` — ${e.error}` : ''}`, tone };
  }
  if (e.kind === 'notify') return { icon: <Bell className="h-3.5 w-3.5" />, text: `${e.title}: ${e.message}`, tone: 'text-sky-200' };
  if (e.kind === 'alert') {
    const critical = e.severity === 'critical';
    return {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      text: `${e.rule ?? 'alert'}: ${e.message ?? ''}`,
      tone: critical ? 'text-rose-300' : e.severity === 'info' ? 'text-slate-400' : 'text-amber-300'
    };
  }
  if (e.kind === 'tool_denied') return { icon: <ShieldAlert className="h-3.5 w-3.5" />, text: `denied ${e.tool}: ${e.reason}`, tone: 'text-amber-300' };
  if (e.kind === 'answer') {
    const text = typeof e.text === 'string' ? e.text : '';
    return { icon: <Bot className="h-3.5 w-3.5" />, text: `answered: ${text.slice(0, 120)}${text.length > 120 ? '…' : ''}`, tone: 'text-slate-400' };
  }
  return { icon: <Clock className="h-3.5 w-3.5" />, text: e.kind, tone: 'text-slate-500' };
}

/** Today's daemon runs, alerts, notifications and answers, newest first. */
export const ActivityTimeline: React.FC<{ events: OpsEvent[] }> = ({ events }) => (
  <div className="flex h-full min-h-0 flex-col rounded-2xl border border-white/5 bg-slate-900/40">
    <div className="border-b border-white/5 px-3 py-2 text-sm font-bold text-slate-100">Activity · today</div>
    <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-2 text-[12px]">
      {events.length === 0 && <li className="text-slate-500">Nothing yet. Daemon runs, alerts and notifications appear here.</li>}
      {[...events].reverse().map((e, i) => {
        const d = describe(e);
        return (
          <li key={`${e.timestamp}-${i}`} className={`flex items-start gap-2 ${d.tone}`}>
            <span className="mt-0.5 shrink-0 font-mono text-[10px] text-slate-500">{time(e.timestamp)}</span>
            <span className="mt-0.5 shrink-0">{d.icon}</span>
            <span className="min-w-0 break-words">{d.text}</span>
          </li>
        );
      })}
    </ul>
  </div>
);

export default ActivityTimeline;
