import React, { useState } from 'react';
import { CheckCircle, AlertTriangle, RefreshCw, Terminal } from 'lucide-react';
import { LocalCliAIProvider } from '../types';
import { LOCAL_CLI_LABEL, callAI, listLocalCliProviders } from '../services/aiProvider';
import AntigravitySignIn from './AntigravitySignIn';

/** Suggestions only; any model the CLI accepts can be typed in. Empty = the CLI's default. */
const MODEL_SUGGESTIONS: Record<LocalCliAIProvider, string[]> = {
  'claude-code': ['haiku', 'sonnet', 'opus'],
  copilot: ['claude-haiku-4.5', 'claude-sonnet-4.5', 'claude-sonnet-4', 'gpt-5'],
  antigravity: ['gemini-3.8-flash-medium', 'gemini-3.8-flash-high', 'claude-sonnet-4-6']
};

const SIGN_IN: Record<LocalCliAIProvider, string> = {
  'claude-code': 'claude',
  copilot: 'copilot',
  antigravity: 'agy'
};

/**
 * Settings for the three local CLI providers. The CLI runs on this Mac through
 * the local server, using whatever account it is signed into; no key is stored
 * in the app. Each call starts the CLI, so answers take a few seconds (Copilot
 * ~20 s) and each one may count against that account's plan.
 */
export const LocalAISettings: React.FC<{
  provider: LocalCliAIProvider;
  model: string;
  onModelChange: (m: string) => void;
  enabled: boolean;
}> = ({ provider, model, onModelChange, enabled }) => {
  const [status, setStatus] = useState<{ type: 'idle' | 'checking' | 'success' | 'error'; text: string }>({ type: 'idle', text: '' });

  const check = async () => {
    setStatus({ type: 'checking', text: 'Looking for the CLI…' });
    try {
      const rows = await listLocalCliProviders();
      const row = rows.find(r => r.provider === provider);
      if (!row?.installed) {
        setStatus({ type: 'error', text: `\`${SIGN_IN[provider]}\` was not found on this Mac.` });
        return;
      }
      setStatus({ type: 'checking', text: `Found ${row.version ?? SIGN_IN[provider]}. Sending a test prompt…` });
      const started = performance.now();
      const reply = await callAI(
        { appId: '', accessToken: '', aiProvider: provider, claudeCodeModel: model, copilotModel: model, antigravityModel: model },
        'You are a connectivity check.',
        'Reply with exactly: OK'
      );
      setStatus({ type: 'success', text: `Answered "${reply.trim().slice(0, 40)}" in ${((performance.now() - started) / 1000).toFixed(1)} s.` });
    } catch (e: any) {
      setStatus({ type: 'error', text: e?.message ?? 'Check failed' });
    }
  };

  const tone =
    status.type === 'success' ? 'text-emerald-400' : status.type === 'error' ? 'text-rose-400' : 'text-slate-400';

  return (
    <div className={`space-y-3 transition-opacity duration-300 ${enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
      <div className="flex items-start gap-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl">
        <div className="p-2 bg-orange-500/10 rounded-lg text-orange-400 shrink-0"><Terminal size={18} /></div>
        <div className="space-y-1 text-[11px] text-slate-400 leading-relaxed">
          <h3 className="text-sm font-bold text-orange-300">{LOCAL_CLI_LABEL[provider]} — runs on this Mac</h3>
          <p>
            The local server runs <span className="font-mono text-orange-300">{SIGN_IN[provider]}</span> with the account it is
            already signed into. No key is stored here.{' '}
            {provider === 'antigravity'
              ? 'Sign in below if it is not signed in yet.'
              : <>If it has never been used, run <span className="font-mono text-orange-300">{SIGN_IN[provider]}</span> once in a terminal to sign in.</>}
          </p>
          <p>
            Its own tools (shell, file edits, MCP servers) are switched off for these calls. Text only: chart images still go
            to Gemini or Ollama. Only works with the app running locally (<span className="font-mono">npm run dev</span>),
            and each call takes a few seconds.
          </p>
        </div>
      </div>

      {provider === 'antigravity' && <AntigravitySignIn />}

      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Model (optional)</label>
        <input
          type="text"
          value={model}
          onChange={e => onModelChange(e.target.value)}
          placeholder="CLI default"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono"
        />
        {MODEL_SUGGESTIONS[provider].length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {['', ...MODEL_SUGGESTIONS[provider]].map(m => (
              <button
                key={m || 'default'}
                onClick={() => onModelChange(m)}
                className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-all border ${model === m ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' : 'bg-slate-800/50 text-slate-400 border-white/5 hover:bg-slate-700/50'}`}
              >
                {m || 'default'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={check}
          disabled={status.type === 'checking'}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 disabled:opacity-50"
        >
          <RefreshCw size={14} className={status.type === 'checking' ? 'animate-spin' : ''} /> Check & test
        </button>
        {status.text && (
          <span className={`flex items-center gap-1 text-[11px] ${tone}`}>
            {status.type === 'success' && <CheckCircle size={12} />}
            {status.type === 'error' && <AlertTriangle size={12} />}
            {status.text}
          </span>
        )}
      </div>
    </div>
  );
};

export default LocalAISettings;
