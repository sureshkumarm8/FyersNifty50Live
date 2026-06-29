import React, { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, AlertCircle, Clock, Phone, Key } from 'lucide-react';

interface TokenGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenSaved: (token: string) => void;
}

export const TokenGeneratorModal: React.FC<TokenGeneratorModalProps> = ({
  isOpen,
  onClose,
  onTokenSaved,
}) => {
  const [status, setStatus] = useState<'idle' | 'authenticating' | 'otp' | 'saving' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [requestToken, setRequestToken] = useState('');
  const [step, setStep] = useState<'init' | 'login' | 'otp' | 'complete'>('init');
  const [loginUrl, setLoginUrl] = useState('');

  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setStatus('idle');
      setMessage('');
      setSessionId(null);
      setRequestToken('');
      setStep('init');
      setLoginUrl('');
    }
  }, [isOpen]);

  /**
   * Step 1: Initialize authentication session
   */
  const initializeAuth = async () => {
    setStatus('authenticating');
    setMessage('🔄 Initializing authentication...');
    setStep('login');

    try {
      const response = await fetch('/api/paytm-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'init-session' }),
      });

      const data = await response.json();

      if (data.success) {
        setSessionId(data.sessionId);
        setLoginUrl(data.loginUrl);
        setStatus('idle');
        setMessage('');
      } else {
        throw new Error(data.error || 'Failed to initialize session');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  /**
   * Step 2: Open login in browser and wait for callback
   */
  const handleOpenLogin = () => {
    if (loginUrl) {
      window.open(loginUrl, 'PaytmLogin', 'width=600,height=700');
      setStatus('otp');
      setMessage('👤 Please complete login in the popup window');
      setStep('otp');
    }
  };

  /**
   * Step 3: User pastes request token from redirect URL
   */
  const handleSubmitRequestToken = async () => {
    if (!requestToken || !sessionId) {
      setStatus('error');
      setMessage('❌ Please enter the request token');
      return;
    }

    setStatus('saving');
    setMessage('💾 Exchanging token...');

    try {
      const response = await fetch('/api/paytm-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete-auth',
          sessionId,
          requestToken,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save token to Redis
        const saveResponse = await fetch('/api/save-paytm-token-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: data.accessToken,
            source: 'native-generator',
            timestamp: new Date().toISOString(),
          }),
        });

        const saveData = await saveResponse.json();

        if (saveData.success) {
          setStatus('success');
          setMessage(`✅ Token saved successfully!\nValid for: ${saveData.expires_in || '24 hours'}`);
          setStep('complete');

          // Auto-close after 3 seconds
          setTimeout(() => {
            onTokenSaved(data.accessToken);
            onClose();
          }, 3000);
        } else {
          throw new Error('Failed to save token');
        }
      } else {
        throw new Error(data.error || 'Failed to exchange token');
      }
    } catch (error) {
      setStatus('error');
      setMessage(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">🚀 Generate Paytm AccessToken</h2>
            <p className="text-purple-100 text-sm mt-1">Complete OTP login to generate your token</p>
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
                status === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : status === 'error'
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-blue-50 border border-blue-200'
              }`}
            >
              {status === 'authenticating' || status === 'saving' ? (
                <>
                  <Loader className="animate-spin text-blue-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-sm text-blue-700 whitespace-pre-line">{message}</span>
                </>
              ) : status === 'success' ? (
                <>
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-sm text-green-700 whitespace-pre-line">{message}</span>
                </>
              ) : status === 'error' ? (
                <>
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                  <span className="text-sm text-red-700 whitespace-pre-line">{message}</span>
                </>
              ) : (
                <span className="text-sm text-blue-700">{message}</span>
              )}
            </div>
          )}

          {/* Step 1: Initialize */}
          {step === 'init' && (
            <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-900 mb-2">Step 1: Initialize</h3>
                <p className="text-sm text-purple-700 mb-3">
                  Click the button below to start the authentication process
                </p>
                <button
                  onClick={initializeAuth}
                  disabled={status === 'authenticating'}
                  className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg font-medium transition"
                >
                  {status === 'authenticating' ? (
                    <>
                      <Loader className="inline animate-spin mr-2" size={16} />
                      Initializing...
                    </>
                  ) : (
                    '🔑 Start Authentication'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Login */}
          {step === 'login' && loginUrl && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <Phone size={18} />
                  Step 2: Complete OTP
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                  A popup will open asking you to login with your mobile number and OTP
                </p>
                <button
                  onClick={handleOpenLogin}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  📱 Open Login in Browser
                </button>
                <p className="text-xs text-blue-600 mt-2">
                  ℹ️ If popup didn't open, check your browser popup settings
                </p>
              </div>
            </div>
          )}

          {/* Step 3: OTP Input */}
          {step === 'otp' && sessionId && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <Key size={18} />
                  Step 3: Enter Request Token
                </h3>
                <p className="text-sm text-amber-700 mb-3">
                  After OTP, you'll be redirected. Copy the URL and paste it below to extract the request token.
                </p>
                <textarea
                  value={requestToken}
                  onChange={(e) => setRequestToken(e.target.value)}
                  placeholder="Paste the redirect URL here (starting with https://developer.paytmmoney.com/...)"
                  className="w-full p-3 border border-amber-300 rounded-lg text-sm font-mono resize-none"
                  rows={3}
                />
                <p className="text-xs text-amber-600 mt-2">
                  The request token will be automatically extracted from the URL
                </p>
                <button
                  onClick={handleSubmitRequestToken}
                  disabled={!requestToken || status === 'saving'}
                  className="w-full mt-3 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg font-medium transition"
                >
                  {status === 'saving' ? (
                    <>
                      <Loader className="inline animate-spin mr-2" size={16} />
                      Processing...
                    </>
                  ) : (
                    '✅ Complete Authentication'
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 'complete' && status === 'success' && (
            <div className="text-center space-y-3">
              <div className="text-6xl">🎉</div>
              <p className="text-lg font-semibold text-green-600">Token Generated Successfully!</p>
              <p className="text-sm text-gray-600">Closing in a moment...</p>
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
