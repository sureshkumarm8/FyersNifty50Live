import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, CheckCircle2, XCircle, MinusCircle, ArrowRight } from 'lucide-react';
import { agentScorecard, AgentCall } from '../../services/agentScorecard';
import { buildDebrief, isDebriefFailure } from '../../services/sessionDebrief';
import { ArchiveSeries } from './useArchiveSeries';

const ICON = {
  good: <CheckCircle2 size={15} className="text-emerald-400 mt-0.5 shrink-0" />,
  bad: <XCircle size={15} className="text-rose-400 mt-0.5 shrink-0" />,
  neutral: <MinusCircle size={15} className="text-slate-500 mt-0.5 shrink-0" />
};

/**
 * SESSION DEBRIEF.
 *
 * Closes the loop. Every other panel makes a claim about the future; this one
 * checks the claims already made and states what should change. A system that
 * never does this can be confidently wrong forever.
 */
const DebriefPanel: React.FC<{ series: ArchiveSeries }> = ({ series }) => {
  const [calls, setCalls] = useState<AgentCall[]>([]);

  useEffect(() => {
    let cancelled = false;
    agentScorecard.getCalls().then(c => {
      if (!cancelled) setCalls(c);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => agentScorecard.stats(calls, 15), [calls]);

  const debrief = useMemo(() => {
    const bars = series.live.length
      ? series.live.map(p => ({ ...p, forward: {} as Record<number, number> }))
      : series.history;
    if (!bars.length) return null;
    return buildDebrief(bars as any, calls, stats);
  }, [series.live, series.history, calls, stats]);

  if (series.loading) {
    return <div className="glass-panel rounded-xl p-8 text-center text-slate-400">Loading session data…</div>;
  }

  if (!debrief) {
    return (
      <div className="glass-panel rounded-xl p-8 text-center">
        <ClipboardList size={40} className="mx-auto mb-3 text-slate-600" />
        <h3 className="text-lg font-bold text-white mb-1">Nothing to debrief yet</h3>
        <p className="text-sm text-slate-400">A session needs to be recorded before it can be reviewed.</p>
      </div>
    );
  }

  if (isDebriefFailure(debrief)) {
    return (
      <div className="glass-panel rounded-xl p-6">
        <p className="text-sm text-slate-400">{debrief.reason}</p>
      </div>
    );
  }

  const m = debrief.move;

  return (
    <div className="space-y-4">
      <div className="glass-panel rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <ClipboardList size={16} className="text-cyan-400" />
          <h3 className="text-base font-bold text-white">Session Debrief — {debrief.date}</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Net</div>
            <div
              className={`text-lg font-bold font-mono ${m.netPts >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
            >
              {m.netPts >= 0 ? '+' : ''}
              {m.netPts.toFixed(0)}
            </div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Range</div>
            <div className="text-lg font-bold text-white font-mono">{m.rangePts.toFixed(0)}</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Calls</div>
            <div className="text-lg font-bold text-white font-mono">{debrief.callsMade}</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Decisive</div>
            <div className="text-lg font-bold text-white font-mono">{debrief.decisive}</div>
          </div>
          <div className="bg-slate-800/60 rounded-lg p-3 border border-white/5">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Bars</div>
            <div className="text-lg font-bold text-white font-mono">{m.bars}</div>
          </div>
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5">
        <h4 className="text-sm font-bold text-white mb-3">What happened</h4>
        <div className="space-y-2.5">
          {debrief.findings.map((f, i) => (
            <div key={i} className="flex items-start gap-2.5">
              {ICON[f.kind]}
              <p className="text-sm text-slate-300 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel rounded-xl p-5 border border-cyan-500/25">
        <h4 className="text-sm font-bold text-white mb-3">What to change</h4>
        <div className="space-y-2.5">
          {debrief.actions.map((a, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <ArrowRight size={15} className="text-cyan-400 mt-0.5 shrink-0" />
              <p className="text-sm text-slate-300 leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DebriefPanel;
