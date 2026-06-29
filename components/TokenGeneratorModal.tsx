import React, { useState, useEffect } from 'react';
import { X, Loader, CheckCircle, AlertCircle, Clock } from 'lucide-react';

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
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [iframeReady, setIframeReady] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Listen for postMessage from iframe
    const handleMessage = (event: MessageEvent) => {
      // Security: Verify origin
      const allowedOrigins = [
        'https://live-quotes-data.vercel.app',
        'http://localhost:3000', // for local development
      ];

      if (!allowedOrigins.includes(event.origin)) {
        console.warn('Message from untrusted origin:', event.origin);
        return;
      }

      if (event.data?.type === 'TOKEN_GENERATED') {
        const token = event.data.payload?.accessToken;

        if (!token) {
          setStatus('error');
          setMessage('❌ Invalid token received from generator');
          return;
        }

        setStatus('loading');
        setMessage('💾 Saving token to Redis...');

        // Save to Redis via API
        fetch('/api/save-paytm-token-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accessToken: token,
            source: 'embedded-generator',
            timestamp: new Date().toISOString(),
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.success) {
              setStatus('success');
              setMessage(
                `✅ Token saved successfully!\nValid for: ${data.expires_in || '24 hours'}`
              );

              // Auto-close after 3 seconds
              setTimeout(() => {
                onTokenSaved(token);
                onClose();
              }, 3000);
            } else {
              throw new Error(data.error || 'Failed to save token');
            }
          })
          .catch((error) => {
            setStatus('error');
            setMessage(`❌ Error: ${error.message}`);
          });
      } else if (event.data?.type === 'IFRAME_READY') {
        setIframeReady(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen, onClose, onTokenSaved]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
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
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Status Bar */}
          {status !== 'idle' && (
            <div
              className={`p-4 border-b flex items-start gap-3 ${
                status === 'success'
                  ? 'bg-green-50 border-green-200'
                  : status === 'error'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-blue-50 border-blue-200'
              }`}
            >
              {status === 'loading' && (
                <>
                  <Loader className="animate-spin text-blue-600 flex-shrink-0 mt-1" size={20} />
                  <span
                    className={`text-sm whitespace-pre-line ${
                      status === 'success'
                        ? 'text-green-700'
                        : status === 'error'
                          ? 'text-red-700'
                          : 'text-blue-700'
                    }`}
                  >
                    {message}
                  </span>
                </>
              )}
              {status === 'success' && (
                <>
                  <CheckCircle className="text-green-600 flex-shrink-0 mt-1" size={20} />
                  <span className="text-sm text-green-700 whitespace-pre-line">{message}</span>
                </>
              )}
              {status === 'error' && (
                <>
                  <AlertCircle className="text-red-600 flex-shrink-0 mt-1" size={20} />
                  <span className="text-sm text-red-700 whitespace-pre-line">{message}</span>
                </>
              )}
            </div>
          )}

          {/* iFrame Container */}
          <div className="flex-1 overflow-hidden">
            {!iframeReady && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Loader className="animate-spin mx-auto mb-2 text-purple-600" size={32} />
                  <p className="text-gray-600">Loading token generator...</p>
                </div>
              </div>
            )}
            <iframe
              src="https://live-quotes-data.vercel.app/?embedded=true"
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: iframeReady || status !== 'idle' ? 'block' : 'none',
              }}
              title="Paytm Token Generator"
              allow="camera; microphone"
            />
          </div>
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
