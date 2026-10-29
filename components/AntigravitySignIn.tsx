import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle, AlertTriangle, ExternalLink, Loader2, LogIn, X } from 'lucide-react';
import { AntigravityLogin, antigravitySignIn } from '../services/aiProvider';

/**
 * Sign in to the Antigravity CLI without a terminal.
 *
 * 1. "Sign in with Google" makes the local server start the CLI's login and
 *    opens the Google link it prints.
 * 2. Google redirects to antigravity.google/oauth-callback, which shows
 *    "Paste this code into your application to complete authentication".
 * 3. The code is pasted here; the server types it into the waiting CLI.
 *
 * The CLI only waits 60 s for the code and each link works once, so the
 * countdown is shown and "Start again" always fetches a fresh link.
 */
export const AntigravitySignIn: React.FC = () => {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [login, setLogin] = useState<AntigravityLogin>({ state: 'idle' });
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now());
  const popup = useRef<Window | null>(null);

  const refresh = () =>
    antigravitySignIn
      .status()
      .then(s => {
        setSignedIn(s.signedIn);
        if (s.login.state === 'awaiting_code') setLogin(s.login);
      })
      .catch(e => setError(e.message));

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    if (login.state !== 'awaiting_code') return;
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [login.state]);

  const secondsLeft = login.expiresAt ? Math.max(0, Math.round((login.expiresAt - now) / 1000)) : 0;
  const expired = login.state === 'awaiting_code' && secondsLeft === 0;

  const start = async () => {
    setError(null);
    setCode('');
    // Open the tab inside the click so the popup blocker allows it; point it at
    // Google once the server has the link.
    popup.current = window.open('', '_blank');
    setLogin({ state: 'starting' });
    try {
      const next = await antigravitySignIn.start();
      setLogin(next);
      setNow(Date.now());
      if (next.state === 'awaiting_code' && next.url) {
        if (popup.current && !popup.current.closed) popup.current.location.href = next.url;
      } else {
        popup.current?.close();
        if (next.state === 'signed_in') setSignedIn(true);
      }
    } catch (e: any) {
      popup.current?.close();
      setLogin({ state: 'idle' });
      setError(e.message);
    }
  };

  const submit = async () => {
    setError(null);
    setLogin(prev => ({ ...prev, state: 'verifying' }));
    try {
      const next = await antigravitySignIn.submitCode(code.trim());
      setLogin(next);
      if (next.state === 'signed_in') {
        setSignedIn(true);
        setCode('');
      }
    } catch (e: any) {
      setLogin({ state: 'failed', message: e.message });
    }
  };

  const cancel = async () => {
    setLogin(await antigravitySignIn.cancel().catch(() => ({ state: 'idle' as const })));
    setCode('');
  };

  const waiting = login.state === 'awaiting_code' || login.state === 'verifying';

  return (
    <div className="space-y-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Antigravity account</span>
        {signedIn === null ? (
          error ? <span className="text-[11px] text-slate-500">unknown</span> : <Loader2 size={12} className="animate-spin text-slate-500" />
        ) : signedIn ? (
          <span className="flex items-center gap-1 text-[11px] text-emerald-400"><CheckCircle size={12} /> signed in</span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] text-amber-400"><AlertTriangle size={12} /> not signed in</span>
        )}
      </div>

      {!waiting && (
        <button
          onClick={start}
          disabled={login.state === 'starting'}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {login.state === 'starting' ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
          {signedIn ? 'Sign in again' : 'Sign in with Google'}
        </button>
      )}

      {waiting && (
        <div className="space-y-2">
          <ol className="list-decimal space-y-1 pl-4 text-[11px] leading-relaxed text-slate-400">
            <li>
              Sign in with Google in the tab that opened
              {login.url && (
                <>
                  {' '}(or{' '}
                  <a href={login.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-blue-300 underline">
                    open the link <ExternalLink size={10} />
                  </a>
                  )
                </>
              )}
              .
            </li>
            <li>
              On <span className="font-mono text-blue-300">antigravity.google/oauth-callback</span> copy the code under
              "Paste this code into your application to complete authentication".
            </li>
            <li>Paste it here and press Complete sign-in.</li>
          </ol>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && code.trim() && !expired) void submit(); }}
              placeholder="Paste the authorization code"
              disabled={login.state === 'verifying' || expired}
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 font-mono text-xs text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={submit}
              disabled={!code.trim() || login.state === 'verifying' || expired}
              className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
            >
              {login.state === 'verifying' ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
              Complete sign-in
            </button>
            <button onClick={cancel} title="Cancel" className="rounded-lg bg-slate-800 px-2 text-slate-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className={`text-[11px] ${secondsLeft <= 15 ? 'text-amber-400' : 'text-slate-500'}`}>
            {login.state === 'verifying'
              ? 'Checking the code with Google…'
              : expired
                ? 'This link has expired (the CLI only waits 60 s).'
                : `${secondsLeft} s left to paste the code — the CLI stops waiting after 60 s.`}
            {expired && (
              <button onClick={start} className="ml-2 font-bold text-blue-300 underline">Start again</button>
            )}
          </div>
        </div>
      )}

      {(login.state === 'signed_in' || login.state === 'failed' || login.state === 'cancelled') && login.message && (
        <div className={`text-[11px] ${login.state === 'signed_in' ? 'text-emerald-400' : login.state === 'failed' ? 'text-rose-400' : 'text-slate-400'}`}>
          {login.message}
        </div>
      )}
      {error && <div className="text-[11px] text-rose-400">{error}</div>}
    </div>
  );
};

export default AntigravitySignIn;
