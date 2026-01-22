
import React, { useState, useEffect, useRef } from 'react';
import { FyersCredentials } from '../types';
import { X, Save, AlertTriangle, ShieldCheck, Upload, Download, FileJson, Trash2, ToggleLeft, ToggleRight, Clock, Bot } from 'lucide-react';

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
  const [bypassMarketHours, setBypassMarketHours] = useState(currentCreds.bypassMarketHours || false);
  const [aiEnabled, setAiEnabled] = useState(currentCreds.aiEnabled !== undefined ? currentCreds.aiEnabled : true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setAppId(currentCreds.appId);
      setAccessToken(currentCreds.accessToken);
      setBypassMarketHours(currentCreds.bypassMarketHours || false);
      setAiEnabled(currentCreds.aiEnabled !== undefined ? currentCreds.aiEnabled : true);
    }
  }, [isOpen, currentCreds]);

  const handleSave = () => {
    onSave({ appId, accessToken, bypassMarketHours, aiEnabled });
    onClose();
  };

  const handleReset = () => {
    if (confirm("⚠️ WARNING: This will permanently delete your API credentials and reset all application data. Are you sure you want to proceed?")) {
        localStorage.clear();
        window.location.reload();
    }
  };

  const handleDownloadTemplate = () => {
    const template = {
      appId: "XV1234567-100",
      accessToken: "YOUR_GENERATED_ACCESS_TOKEN_HERE",
      bypassMarketHours: false,
      aiEnabled: true
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "fyers_config_template.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        let loaded = false;
        
        if (json.appId) {
          setAppId(json.appId);
          loaded = true;
        }
        if (json.accessToken) {
          setAccessToken(json.accessToken);
          loaded = true;
        }
        if (json.bypassMarketHours !== undefined) {
            setBypassMarketHours(json.bypassMarketHours);
        }
        if (json.aiEnabled !== undefined) {
            setAiEnabled(json.aiEnabled);
        }

        if (!loaded) {
          alert("Invalid JSON format. File must contain 'appId' or 'accessToken' fields.");
        }
      } catch (err) {
        alert("Error parsing JSON file. Please ensure it is a valid JSON.");
      }
    };
    reader.readAsText(file);
    // Reset value so same file can be selected again if needed
    event.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-panel rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10 glass-header">
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
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          
          <div className="space-y-4">
             {/* Info Box */}
             <div className="bg-blue-900/20 border border-blue-800/50 p-3 rounded text-sm text-blue-200 flex gap-2 items-start">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-blue-400" />
                <p>
                  <strong>Secure Proxy:</strong> Requests are routed through the secure serverless backend. Credentials are stored locally in your browser.
                </p>
             </div>

             {/* Import/Export Tools */}
             <div className="flex gap-3 mb-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  className="hidden" 
                  accept=".json"
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                >
                  <Upload size={16} />
                  Import Config
                </button>

                <button 
                  onClick={handleDownloadTemplate}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
                >
                  <Download size={16} />
                  Get Template
                </button>
             </div>

             <div className="relative border-t border-gray-800 my-4">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gray-900 px-2 text-xs text-gray-500">OR ENTER MANUALLY</span>
             </div>

            {/* Inputs */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                App ID (Client ID)
              </label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="e.g., XV1234567-100"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-gray-600 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Access Token
              </label>
              <textarea
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="Paste your generated access token here..."
                rows={4}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-gray-600 font-mono text-xs resize-none"
              />
            </div>

            {/* AI Toggle */}
            <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-lg ${aiEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-500'}`}>
                      <Bot size={18} />
                   </div>
                   <div>
                      <p className="text-sm font-medium text-slate-200">Enable AI Features</p>
                      <p className="text-xs text-slate-500">Quant Analysis, Sniper Scope & Chat</p>
                   </div>
                </div>
                <button 
                  onClick={() => setAiEnabled(!aiEnabled)}
                  className={`transition-colors duration-200 focus:outline-none ${aiEnabled ? 'text-indigo-400' : 'text-slate-600'}`}
                >
                    {aiEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
            </div>

            {/* Market Hours Bypass Toggle */}
            <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-white/5">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                      <Clock size={18} />
                   </div>
                   <div>
                      <p className="text-sm font-medium text-slate-200">Test Mode (Bypass Timing)</p>
                      <p className="text-xs text-slate-500">Fetch data outside market hours (09:17 - 15:15)</p>
                   </div>
                </div>
                <button 
                  onClick={() => setBypassMarketHours(!bypassMarketHours)}
                  className={`transition-colors duration-200 focus:outline-none ${bypassMarketHours ? 'text-green-400' : 'text-slate-600'}`}
                >
                    {bypassMarketHours ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                </button>
            </div>

             <div className="bg-yellow-900/20 border border-yellow-800/50 p-3 rounded text-xs text-yellow-200 flex gap-2 items-start">
                <AlertTriangle size={14} className="mt-0.5 shrink-0 text-yellow-500" />
                <p>
                  Ensure your App ID includes the suffix (e.g. -100) and the token is valid for the current session (tokens expire daily).
                </p>
             </div>
             
             {/* Danger Zone */}
             <div className="pt-4 border-t border-white/5 mt-4">
                 <h3 className="text-red-400 text-xs font-bold uppercase mb-2">Danger Zone</h3>
                 <button 
                    onClick={handleReset}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 rounded-lg text-sm text-red-300 transition-colors"
                 >
                    <Trash2 size={16} />
                    Reset App Data
                 </button>
             </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex justify-end">
          <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
          >
            <Save size={18} />
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};
