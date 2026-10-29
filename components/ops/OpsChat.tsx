import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Brain, CheckCircle2, ListChecks, Loader2, Send, ShieldAlert, Square, Wrench, XCircle } from 'lucide-react';
import { applyProgress, askOps, ChatEvent, ProgressItem } from '../../services/opsClient';

interface Turn {
  id: number;
  question: string;
  /** Live preview of what the agent is doing; absent on turns saved before it existed. */
  progress?: ProgressItem[];
  startedAt?: number;
  finishedAt?: number;
  answer: string | null;
  flags: string[];
  error: string | null;
  provider?: string;
  usage?: { inputTokens: number; outputTokens: number } | null;
}

export const QUICK_PROMPTS = ['Ready for open?', 'Why no trade today?', 'What happened at 10:40?', 'Summarise today'];

const HISTORY_KEY = 'nifty50ops_chat_v1';

const loadTurns = (): Turn[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}');
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
    return raw.day === today && Array.isArray(raw.turns) ? raw.turns : [];
  } catch {
    return [];
  }
};

const secs = (ms?: number) => (ms === undefined ? '' : ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`);

const StepIcon: React.FC<{ item: ProgressItem }> = ({ item }) => {
  if (item.status === 'running') return <Loader2 className="mt-0.5 h-3.5 w-3.5 shrink-0 animate-spin text-cyan-300" />;
  if (item.status === 'blocked') return <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />;
  if (item.status === 'failed') return <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />;
  if (item.kind === 'think') return <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-300" />;
  if (item.kind === 'plan') return <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-300" />;
  if (item.kind === 'tool') return <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />;
  return <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />;
};

/** The step list: what it asked, what came back, how long each step took. */
const ProgressList: React.FC<{ items: ProgressItem[]; now: number }> = ({ items, now }) => (
  <ul className="space-y-1">
    {items.map((it, i) => (
      <li key={i} className={`flex items-start gap-1.5 ${it.status === 'running' ? 'text-slate-100' : 'text-slate-400'}`}>
        <StepIcon item={it} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className={it.status === 'running' ? 'font-semibold' : ''}>
              {it.label}
              {it.status === 'running' ? '…' : ''}
            </span>
            <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-500">
              {it.status === 'running' ? secs(now - it.startedAt) : it.kind === 'plan' ? '' : secs(it.ms)}
            </span>
          </div>
          {it.detail && (
            <div className={`break-words text-[11px] ${it.status === 'blocked' ? 'text-amber-300/80' : it.status === 'failed' ? 'text-rose-300/80' : it.kind === 'plan' ? 'italic text-slate-500' : 'text-slate-500'}`}>
              {it.detail}
            </div>
          )}
        </div>
      </li>
    ))}
  </ul>
);

/** Renders **bold** and `code` only; answers are plain text with bullets. */
const renderText = (text: string) =>
  text.split('\n').map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`|_\([^)]*\)_)/g).map((p, k) => {
      if (p.startsWith('**') && p.endsWith('**')) return <strong key={k} className="text-slate-100">{p.slice(2, -2)}</strong>;
      if (p.startsWith('`') && p.endsWith('`')) return <code key={k} className="rounded bg-slate-800 px-1 text-[12px]">{p.slice(1, -1)}</code>;
      if (p.startsWith('_(') && p.endsWith(')_')) return <em key={k} className="text-slate-500">{p.slice(1, -1)}</em>;
      return <React.Fragment key={k}>{p}</React.Fragment>;
    });
    return <div key={i} className={line.trim() === '' ? 'h-2' : ''}>{parts}</div>;
  });

/**
 * The Nifty50Ops chat. Each answer shows the tool calls behind it, collapsed.
 * Text arrives only after the server's post-check, so it appears in one piece.
 */
export const OpsChat: React.FC<{ level: number | null }> = ({ level }) => {
  const [turns, setTurns] = useState<Turn[]>(loadTurns);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    try {
      const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      localStorage.setItem(HISTORY_KEY, JSON.stringify({ day, turns: turns.slice(-30) }));
    } catch {
      /* storage full: the chat still works this session */
    }
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [turns]);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Re-render once a second while working so the running step's timer moves.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!busy) return;
    const t = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(t);
  }, [busy]);


  const ask = useCallback(async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    const id = Date.now();
    const history = turns
      .filter(t => t.answer)
      .slice(-3)
      .flatMap(t => [
        { role: 'user' as const, content: t.question },
        { role: 'assistant' as const, content: t.answer as string }
      ]);
    setTurns(prev => [...prev, {
      id, question: q, progress: [{ kind: 'stage', label: 'Sending your question', status: 'running', startedAt: Date.now() }],
      startedAt: Date.now(), answer: null, flags: [], error: null
    }]);
    setInput('');
    setBusy(true);
    const update = (fn: (t: Turn) => Turn) => setTurns(prev => prev.map(t => (t.id === id ? fn(t) : t)));
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      await askOps(q, history, (e: ChatEvent) => {
        const at = Date.now();
        update(t => {
          const next: Turn = { ...t, progress: applyProgress(t.progress ?? [], e, at) };
          if (e.type === 'meta') next.provider = e.provider;
          else if (e.type === 'answer') { next.answer = e.text; next.flags = e.flags; next.finishedAt = at; }
          else if (e.type === 'done') { next.usage = e.usage; next.finishedAt = next.finishedAt ?? at; }
          else if (e.type === 'error') { next.error = e.error; next.finishedAt = at; }
          return next;
        });
      }, ctrl.signal);
    } catch (err: any) {
      const at = Date.now();
      update(t => ({
        ...t,
        progress: applyProgress(t.progress ?? [], { type: 'error', error: '' }, at),
        error: err?.name === 'AbortError' ? 'Stopped.' : err?.message ?? 'request failed',
        finishedAt: at
      }));
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }, [busy, turns]);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-white/5 bg-slate-900/40">
      <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2">
        <Bot className="h-4 w-4 text-cyan-300" />
        <span className="text-sm font-bold text-slate-100">Ask Nifty50Ops</span>
        <span className="text-[10px] text-slate-500">
          {level === null ? '' : `L${level} · ${level === 0 ? 'read-only' : 'read + routine ops'}`} · never places trades
        </span>
        {turns.length > 0 && (
          <button className="ml-auto text-[10px] text-slate-500 hover:text-slate-300" onClick={() => setTurns([])} disabled={busy}>
            clear
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3 text-[13px] leading-relaxed text-slate-300">
        {turns.length === 0 && (
          <div className="text-slate-500">
            Ask about readiness, engine state, why something did or didn't trade, or what happened at a time. Answers cite the data and its age.
          </div>
        )}
        {turns.map(t => (
          <div key={t.id} className="space-y-2">
            <div className="ml-auto w-fit max-w-[85%] rounded-xl bg-cyan-600/20 px-3 py-1.5 text-slate-100">{t.question}</div>
            {t.progress && t.progress.length > 0 && (
              t.answer || t.error ? (
                <details className="rounded-lg border border-white/5 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-400">
                  <summary className="cursor-pointer select-none">
                    <Wrench className="mr-1 inline h-3 w-3" />
                    Worked {t.startedAt && t.finishedAt ? secs(t.finishedAt - t.startedAt) : ''}
                    {' · '}
                    {t.progress.filter(p => p.kind === 'tool').length} lookup{t.progress.filter(p => p.kind === 'tool').length === 1 ? '' : 's'}
                    {t.progress.some(p => p.status === 'blocked') ? ' · some blocked' : ''}
                  </summary>
                  <div className="mt-1.5 pb-1">
                    <ProgressList items={t.progress} now={now} />
                  </div>
                </details>
              ) : (
                <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2.5 py-2 text-[12px]">
                  <div className="mb-1.5 flex items-center gap-2 text-[10px] uppercase tracking-wider text-cyan-300/80">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Working{t.provider ? ` · ${t.provider}` : ''} · {secs(now - (t.startedAt ?? now))}
                    <button
                      onClick={() => abortRef.current?.abort()}
                      className="ml-auto flex items-center gap-1 normal-case tracking-normal text-slate-400 hover:text-rose-300"
                      title="Stop waiting for this answer"
                    >
                      <Square className="h-3 w-3" /> stop
                    </button>
                  </div>
                  <ProgressList items={t.progress} now={now} />
                </div>
              )
            )}
            {t.answer ? (
              <div className="rounded-xl bg-slate-800/50 px-3 py-2">
                {renderText(t.answer)}
                <div className="mt-1 text-[10px] text-slate-500">
                  {[t.provider, ...t.flags, t.usage ? `${t.usage.inputTokens + t.usage.outputTokens} tokens` : null].filter(Boolean).join(' · ')}
                </div>
              </div>
            ) : t.error ? (
              <div className="rounded-xl bg-rose-500/10 px-3 py-2 text-rose-200">{t.error}</div>
            ) : t.progress?.length ? null : (
              <div className="flex items-center gap-2 text-slate-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> working…
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="space-y-2 border-t border-white/5 p-2">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_PROMPTS.map(p => (
            <button
              key={p}
              onClick={() => ask(p)}
              disabled={busy}
              className="rounded-full border border-white/10 px-2.5 py-0.5 text-[11px] text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 disabled:opacity-40"
            >
              {p}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={e => {
            e.preventDefault();
            void ask(input);
          }}
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about health, state, the journal…"
            className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-950/60 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-cyan-500/50"
            disabled={busy}
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="flex items-center gap-1 rounded-lg bg-cyan-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OpsChat;
