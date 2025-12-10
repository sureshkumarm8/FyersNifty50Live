import React, { useState, useEffect } from 'react';
import { FyersCredentials } from '../types';
import { X, Save, AlertTriangle } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (creds: FyersCredentials) => void;
  currentCreds: FyersCredentials;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  currentCreds 
}) => {
  const [appId, setAppId] = useState(currentCreds.appId);
  const [accessToken, setAccessToken] = useState(currentCreds.accessToken);
  const [isDemoMode, setIsDemoMode] = useState(currentCreds.isDemoMode);

  useEffect(() => {
    if (isOpen) {
      setAppId(currentCreds.appId);
      setAccessToken(currentCreds.accessToken);
      setIsDemoMode(currentCreds.isDemoMode);
    }
  }, [isOpen, currentCreds]);

  const handleSave = () => {
    onSave({ appId, accessToken, isDemoMode });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            API Configuration
          </h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          
          {/* Demo Mode Toggle */}
          <div className="flex items-center justify-between bg-gray-800/50 p-3 rounded-lg border border-gray-700">
            <div>
              <label className="text-white font-medium block">Demo Mode</label>
              <p className="text-xs text-gray-400">Use mock data (No API key needed)</p>
            </div>
            <button 
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDemoMode ? 'bg-blue-600' : 'bg-gray-600'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDemoMode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          {!isDemoMode && (
            <div className="space-y-4">
               <div className="bg-yellow-900/20 border border-yellow-800/50 p-3 rounded text-sm text-yellow-200 flex gap-2 items-start">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p>
                    <strong>CORS Warning:</strong> Direct calls to Fyers API from a browser may fail without a proxy or CORS extension.
                  </p>
               </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  App ID (Client ID)
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="e.g., XV1234567-100"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">
                  Access Token
                </label>
                <input
                  type="password"
                  value={accessToken}
                  onChange={(e) => setAccessToken(e.target.value)}
                  placeholder="Your generated access token"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <Save size={18} />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};