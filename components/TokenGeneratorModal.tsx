/**
 * PAYTM ACCESS TOKEN GENERATOR — one click, then the OTP.
 *
 * The old flow made the user press four buttons: initialise, open the login,
 * paste the redirect URL, then confirm. Three of those were the app asking the
 * user to do work the app could do itself.
 *
 * What is left is a single "Login with Paytm" button. The popup is opened
 * synchronously inside the click (a popup opened after an `await` is blocked by
 * every browser), pointed at the login URL once the session comes back, and then
 * four listeners race to capture the requestToken the moment it exists:
 *
 *   1. postMessage  — zero-click, when the Paytm redirect URL points back here.
 *   2. popup URL    — zero-click, readable only while the popup is same-origin.
 *   3. clipboard    — the user copies the redirect URL; we notice on window focus.
 *   4. paste/typing — the manual fallback, anywhere in the modal.
 *
 * Whichever wins, the exchange fires automatically. There is no "confirm" step:
 * having a valid token and asking the user to press a button to use it is
 * ceremony, not safety.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Loader, CheckCircle, AlertCircle, Clock, Key, Download, ExternalLink, ClipboardCheck } from 'lucide-react';

interface TokenGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSaved: (token: string) => void;
  currentCreds?: any;
}

type Phase = 'idle' | 'starting' | 'waiting' | 'exchanging' | 'success' | 'error';

/** How the token arrived — shown so the user knows the app is doing the work. */
type Source = 'callback' | 'popup' | 'clipboard' | 'paste' | 'manual';

const SOURCE_LABEL: Record<Source, string> = {
  callback: 'captured automatically from the Paytm redirect',
  popup: 'captured automatically from the login window',
  clipboard: 'picked up from your clipboard',
  paste: 'read from what you pasted',
  manual: 'entered manually'
};

/**
 * Accepts a full redirect URL, a bare query string, or the token on its own.
 * Returns null when the text plainly is not a token, so a clipboard full of
 * unrelated text never triggers a pointless round trip.
 */
export function extractRequestToken(raw: string): string | null {
  if (!raw) return null;
  const text = raw.trim();
  if (!text || text.length > 4000) return null;

  const fromQuery = text.match(/[?&#]?requestToken=([^&\s"'<>]+)/i);
  if (fromQuery?.[1]) return decodeURIComponent(fromQuery[1]);

  // A bare token: no spaces, no scheme, long enough to be real.
  if (/^[A-Za-z0-9._-]{16,}$/.test(text) && !/^https?:/i.test(text)) return text;

  return null;
}

export const TokenGeneratorModal: React.FC<TokenGeneratorModalProps> = ({
  isOpen,
  onClose,
  onTokenSaved,
  currentCreds,
}) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [requestToken, setRequestToken] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [autoDetect, setAutoDetect] = useState(true);

  const popupRef = useRef<Window | null>(null);
  const sessionRef = useRef<string | null>(null);
  sessionRef.current = sessionId;
  /** One exchange at a time — four listeners can fire on the same token. */
  const claimedRef = useRef(false);
  const autoDetectRef = useRef(autoDetect);
  autoDetectRef.current = autoDetect;
  /** Clipboard text already considered, so we do not re-submit it every poll. */
  const seenClipboardRef = useRef<string | null>(null);

  const closePopup = useCallback(() => {
    try {
      popupRef.current?.close();
    } catch {
      /* already gone */
    }
    popupRef.current = null;
  }, []);

  const reset = useCallback(() => {
    setPhase('idle');
    setMessage('');
    setSessionId(null);
    setRequestToken('');
    setLoginUrl('');
    setGeneratedToken(null);
    setSource(null);
    setPopupBlocked(false);
    claimedRef.current = false;
    seenClipboardRef.current = null;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      closePopup();
      reset();
    }
  }, [isOpen, closePopup, reset]);

  // Never leave an orphaned login window behind.
  useEffect(() => () => closePopup(), [closePopup]);

  /**
   * Exchange the request token for an access token. Called by every capture
   * path, so it guards against re-entry rather than trusting its callers.
   */
  const exchange = useCallback(
    async (rawToken: string, via: Source) => {
      const token = extractRequestToken(rawToken);
      if (!token || claimedRef.current) return;
      claimedRef.current = true;

      setRequestToken(token);
      setSource(via);
      setPhase('exchanging');
      setMessage('🔐 Token received — exchanging it for your access token…');
      closePopup();

      try {
        const response = await fetch('/api/paytm-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'complete-auth',
            sessionId: sessionRef.current,
            requestToken: token,
          }),
        });

        const text = await response.text();
        if (!text) throw new Error('Empty response from server');

        const data = JSON.parse(text);

        if (data.success) {
          setPhase('success');
          setMessage('✅ Access token generated and saved. Valid for 24 hours.');
          setGeneratedToken(data.accessToken);
          onTokenSaved(data.accessToken);
          return;
        }

        const errorMsg = data.details || data.error || 'Failed to exchange token';
        if (errorMsg.includes('Invalid Api Key') || errorMsg.includes('Invalid Api Secret')) {
          throw new Error(`API credentials issue: ${errorMsg}\n\nCheck PAYTM_API_KEY and PAYTM_API_SECRET.`);
        }
        if (/request.?token/i.test(errorMsg)) {
          throw new Error(`${errorMsg}\n\nA request token is single-use and expires quickly — start the login again.`);
        }
        throw new Error(errorMsg);
      } catch (error) {
        console.error('[TokenGenerator] Exchange failed:', error);
        // A failed exchange must not lock the modal: let the next attempt through.
        claimedRef.current = false;
        seenClipboardRef.current = null;
        setPhase('error');
        setMessage(`❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },
    [closePopup, onTokenSaved]
  );

  const exchangeRef = useRef(exchange);
  exchangeRef.current = exchange;

  /**
   * The single entry point. The popup is opened first, synchronously, so the
   * browser still counts it as user-initiated; only then do we go and fetch the
   * session it should navigate to.
   */
  const startLogin = useCallback(async () => {
    claimedRef.current = false;
    seenClipboardRef.current = null;
    setPopupBlocked(false);
    setSource(null);
    setRequestToken('');
    setPhase('starting');
    setMessage('🔄 Opening the Paytm login…');

    const popup = window.open('', 'PaytmLogin', 'width=560,height=740,noopener=no');
    popupRef.current = popup;
    if (!popup) setPopupBlocked(true);

    try {
      const response = await fetch('/api/paytm-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init-session' }),
      });

      const text = await response.text();
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      if (!text) throw new Error('Empty response from server');

      const data = JSON.parse(text);
      if (!data.success) throw new Error(data.error || data.hint || 'Failed to initialise session');

      setSessionId(data.sessionId);
      sessionRef.current = data.sessionId;
      setLoginUrl(data.loginUrl);

      if (popup && !popup.closed) {
        popup.location.href = data.loginUrl;
      }

      setPhase('waiting');
      setMessage('📱 Sign in and approve the OTP in the Paytm window — the token is captured automatically.');
    } catch (error) {
      console.error('[TokenGenerator] Init failed:', error);
      closePopup();
      setPhase('error');
      setMessage(`❌ ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [closePopup]);

  const listening = phase === 'waiting';

  // --- capture 1: our own callback page posting back from the popup ----------
  useEffect(() => {
    if (!listening) return;
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      const token = event.data?.requestToken;
      if (event.data?.type === 'paytm-auth' && typeof token === 'string') {
        exchangeRef.current(token, 'callback');
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [listening]);

  // --- capture 2: read the popup's own URL once it comes back same-origin ----
  useEffect(() => {
    if (!listening) return;
    const id = window.setInterval(() => {
      const popup = popupRef.current;
      if (!popup) return;
      if (popup.closed) {
        popupRef.current = null;
        return;
      }
      try {
        // Throws while the popup sits on Paytm's domain — that is expected.
        const href = popup.location.href;
        if (href && href.includes('requestToken=')) exchangeRef.current(href, 'popup');
      } catch {
        /* cross-origin, nothing to read */
      }
    }, 600);
    return () => window.clearInterval(id);
  }, [listening]);

  // --- capture 3: the clipboard, checked only while this tab has focus -------
  useEffect(() => {
    if (!listening || !autoDetect) return;
    if (!navigator.clipboard?.readText) return;

    let stopped = false;

    const check = async () => {
      if (stopped || !autoDetectRef.current || claimedRef.current) return;
      if (!document.hasFocus()) return;
      try {
        const text = await navigator.clipboard.readText();
        if (!text || text === seenClipboardRef.current) return;
        seenClipboardRef.current = text;
        const token = extractRequestToken(text);
        if (token) exchangeRef.current(token, 'clipboard');
      } catch {
        // Permission denied or unsupported: stop asking and let the user paste.
        stopped = true;
        setAutoDetect(false);
      }
    };

    const id = window.setInterval(check, 1500);
    window.addEventListener('focus', check);
    check();
    return () => {
      stopped = true;
      window.clearInterval(id);
      window.removeEventListener('focus', check);
    };
  }, [listening, autoDetect]);

  // --- capture 4: a paste anywhere in the modal ------------------------------
  useEffect(() => {
    if (!listening) return;
    const onPaste = (event: ClipboardEvent) => {
      const text = event.clipboardData?.getData('text');
      if (text && extractRequestToken(text)) exchangeRef.current(text, 'paste');
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [listening]);

  // --- capture 5: typing/pasting into the fallback box ----------------------
  const onManualChange = (value: string) => {
    setRequestToken(value);
    if (extractRequestToken(value)) exchangeRef.current(value, 'manual');
  };

  const handleDownloadConfig = () => {
    if (!generatedToken) return;

    const config = {
      paytm: {
        apiKey: "YOUR_PAYTM_API_KEY",
        apiSecret: "YOUR_PAYTM_API_SECRET",
        accessToken: generatedToken
      },
      fyers: {
        clientId: currentCreds?.appId || "YOUR_FYERS_CLIENT_ID",
        secretKey: "YOUR_FYERS_SECRET_KEY",
        accessToken: currentCreds?.accessToken || "YOUR_FYERS_ACCESS_TOKEN"
      },
      google: {
        apiKey: currentCreds?.googleApiKey || "YOUR_GEMINI_API_KEY_HERE"
      },
      groq: {
        apiKey: currentCreds?.groqApiKey || "YOUR_GROQ_API_KEY_HERE"
      },
      claude: {
        apiKey: currentCreds?.claudeApiKey || "YOUR_CLAUDE_API_KEY_HERE"
      },
      config: {
        bypassMarketHours: currentCreds?.bypassMarketHours || false,
        refreshInterval: currentCreds?.refreshInterval || 60000,
        aiEnabled: currentCreds?.aiEnabled !== false,
        aiProvider: currentCreds?.aiProvider || "gemini",
        groqModel: currentCreds?.groqModel || "mixtral-8x7b-32768",
        geminiModel: currentCreds?.geminiModel || "gemini-2.0-flash",
        claudeModel: currentCreds?.claudeModel || "claude-3-5-sonnet-20241022",
        cerebrasModel: currentCreds?.cerebrasModel || "cerebras/llama-3.1-70b",
        ollamaBaseUrl: currentCreds?.ollamaBaseUrl || "http://localhost:11434",
        ollamaModel: currentCreds?.ollamaModel || "llama3.1:8b",
        dataProvider: "paytm",
        liveOrdersEnabled: currentCreds?.liveOrdersEnabled || false
      },
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `nifty50_config_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">🚀 Generate Paytm AccessToken</h2>
            <p className="text-purple-100 text-sm mt-1">One click, then your OTP — the token is captured for you</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Status Message */}
          {message && (
            <div
              className={`p-4 rounded-lg flex items-start gap-3 ${
                phase === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : phase === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-blue-50 border border-blue-200'
              }`}
            >
              {phase === 'starting' || phase === 'exchanging' ? (
                <>
                  <Loader className="animate-spin text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-sm text-blue-700 whitespace-pre-line">{message}</span>
                </>
              ) : phase === 'success' ? (
                <>
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-sm text-green-700 whitespace-pre-line">{message}</span>
                </>
              ) : phase === 'error' ? (
                <>
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-sm text-red-700 whitespace-pre-line">{message}</span>
                </>
              ) : (
                <span className="text-sm text-blue-700 whitespace-pre-line">{message}</span>
              )}
            </div>
          )}

          {/* One button. The popup, the OTP wait and the token capture all hang
              off this single action. */}
          {phase !== 'success' && (
            <button
              onClick={startLogin}
              disabled={phase === 'starting' || phase === 'exchanging'}
              className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              {phase === 'starting' || phase === 'exchanging' ? (
                <>
                  <Loader className="animate-spin" size={16} />
                  {phase === 'starting' ? 'Opening login…' : 'Generating token…'}
                </>
              ) : (
                <>
                  <Key size={16} />
                  {phase === 'idle' ? '🔑 Login with Paytm' : '🔄 Restart login'}
                </>
              )}
            </button>
          )}

          {/* Waiting on the OTP: explain what will happen, do not demand a click. */}
          {phase === 'waiting' && (
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
                  <Loader className="animate-spin" size={16} />
                  Waiting for your Paytm login
                </div>
                <ol className="text-xs text-blue-700 list-decimal list-inside space-y-1">
                  <li>Enter your mobile number and OTP in the Paytm window.</li>
                  <li>
                    If the browser lands on a page instead of returning here, just copy that page's
                    address — the token is detected automatically.
                  </li>
                </ol>
                {autoDetect ? (
                  <p className="flex items-center gap-1.5 text-xs text-green-700 font-medium">
                    <ClipboardCheck size={14} />
                    Clipboard auto-detect is on — copying the redirect URL is enough.
                  </p>
                ) : (
                  <p className="text-xs text-amber-700">
                    Clipboard access is unavailable, so paste the redirect URL below (Ctrl/Cmd+V works anywhere in
                    this window).
                  </p>
                )}
              </div>

              {popupBlocked && loginUrl && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800 mb-2">
                    Your browser blocked the popup. Open the login manually:
                  </p>
                  <a
                    href={loginUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-900 underline"
                  >
                    <ExternalLink size={14} />
                    Open Paytm login
                  </a>
                </div>
              )}

              {/* Fallback only — collapsed, never the primary instruction. */}
              <details className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <summary className="cursor-pointer text-xs font-medium text-gray-600">
                  Auto-detect not working? Paste the redirect URL here
                </summary>
                <textarea
                  value={requestToken}
                  onChange={(e) => onManualChange(e.target.value)}
                  placeholder="https://…?requestToken=ABC123…"
                  className="mt-2 w-full p-3 border border-gray-300 rounded-lg text-sm font-mono resize-none"
                  rows={3}
                />
                <p className="mt-1 text-xs text-gray-500">
                  The token is extracted and exchanged the moment it looks valid — nothing else to press.
                </p>
              </details>
            </div>
          )}

          {/* Success */}
          {phase === 'success' && (
            <div className="text-center space-y-6">
              <div className="text-6xl">🎉</div>
              <div>
                <p className="text-lg font-semibold text-green-600">Token Generated Successfully!</p>
                <p className="text-sm text-gray-600 mt-1">
                  Your PayTM Money access token is ready to use
                  {source ? ` — ${SOURCE_LABEL[source]}.` : '.'}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
                <div className="text-sm text-gray-700">
                  <p className="font-semibold mb-2">✅ Token Details:</p>
                  <ul className="text-left space-y-1 text-xs">
                    <li>• <strong>Valid for:</strong> 24 hours from generation</li>
                    <li>• <strong>Auto-refresh:</strong> Daily at midnight</li>
                    <li>• <strong>Storage:</strong> Encrypted in your browser</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={handleDownloadConfig}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
              >
                <Download size={18} />
                💾 Download Config File (Optional)
              </button>

              <p className="text-xs text-gray-500">
                The config file includes your new PayTM token and can be imported later to restore your settings.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t p-4 flex justify-between items-center">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock size={16} />
            <span>Token valid for 24 hours • Auto-refreshes daily</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
