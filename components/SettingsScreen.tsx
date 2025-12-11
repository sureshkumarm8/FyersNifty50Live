
import React, { useState, useEffect, useRef } from 'react';
import { FyersCredentials } from '../types';
import { X, Save, AlertTriangle, ShieldCheck, Upload, Download, Trash2, Clock, HelpCircle, ArrowLeft, ToggleLeft, ToggleRight } from 'lucide-react';
import { REFRESH_OPTIONS, COLUMN_GLOSSARY } from '../constants';

interface SettingsScreenProps {
  onBack: () => void;
  onSave: (creds: FyersCredentials) => void;
  currentCreds: FyersCredentials;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  onBack, 
  onSave, 
  currentCreds 
}) => {
  const [appId, setAppId] = useState(currentCreds.appId);
  const [accessToken, setAccessToken] = useState(currentCreds.accessToken);
  const [bypassMarketHours, setBypassMarketHours] = useState(currentCreds.bypassMarketHours || false);
  const [refreshInterval, setRefreshInterval] = useState(currentCreds.refreshInterval || REFRESH_OPTIONS[3].value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave({ appId, accessToken, bypassMarketHours, refreshInterval });
    onBack();
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
      refreshInterval: 60000
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
        if (json.appId) setAppId(json.appId);
        if (json.accessToken) setAccessToken(json.accessToken);
        if (json.bypassMarketHours !== undefined) setBypassMarketHours(json.bypassMarketHours);
        if (json.refreshInterval !== undefined) setRefreshInterval(json.refreshInterval);
      } catch (err) {
        alert("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 animate-in fade-in duration-300">
      <header className="flex-none glass-header z-10 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 bg-slate-800/50 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-white">Settings & Glossary</h1>
        </div>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
        >
          <Save size={18} />
          Save & Close
        </button>
      </header>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-blue-300 mb-4 border-b border-blue-500/20 pb-2">API Credentials</h2>
              <div className="space-y-4">
                 <div className="bg-blue-900/20 border border-blue-800/50 p-3 rounded text-sm text-blue-200 flex gap-2 items-start">
                    <ShieldCheck size={16} className="mt-0.5 shrink-0 text-blue-400" />
                    <p>Requests are proxied securely. Credentials are only stored locally in your browser.</p>
                 </div>

                 <div className="flex gap-3">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json"/>
                    <button onClick={() => fileInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
                      <Upload size={16} /> Import
                    </button>
                    <button onClick={handleDownloadTemplate} className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors">
                      <Download size={16} /> Template
                    </button>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">App ID (Client ID)</label>
                    <input type="text" value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="e.g., XV1234567-100" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-600 font-mono text-sm"/>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1">Access Token</label>
                    <textarea value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="Paste your generated access token here..." rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-600 font-mono text-xs resize-none"/>
                 </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold text-blue-300 mb-4 border-b border-blue-500/20 pb-2">General</h2>
              <div className="space-y-4">
                  <div>
                      <label className="block text-sm font-medium text-slate-400 mb-1">Refresh Interval</label>
                      <select value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all">
                          {REFRESH_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                  </div>
                  <div className="flex items-center justify-between bg-slate-800/50 p-3 rounded-lg border border-white/5">
                      <div className="flex items-center gap-3">
                         <div>
                            <p className="text-sm font-medium text-slate-200">Test Mode (Bypass Timing)</p>
                            <p className="text-xs text-slate-500">Fetch data outside market hours (09:17 - 15:15)</p>
                         </div>
                      </div>
                      <button onClick={() => setBypassMarketHours(!bypassMarketHours)} className={`transition-colors duration-200 focus:outline-none ${bypassMarketHours ? 'text-green-400' : 'text-slate-600'}`}>
                          {bypassMarketHours ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                  </div>
              </div>
            </section>
            
            <section>
              <h2 className="text-lg font-semibold text-red-400 mb-4 border-b border-red-500/20 pb-2">Danger Zone</h2>
              <div className="bg-red-900/10 p-4 rounded-lg border border-red-500/20">
                  <p className="text-sm text-red-300 mb-3">This will permanently delete all stored settings and data.</p>
                  <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 rounded-lg text-sm text-red-300 transition-colors">
                    <Trash2 size={16} /> Reset App Data
                  </button>
              </div>
            </section>
          </div>
          
          <div className="space-y-6">
            <section className="glass-panel rounded-xl p-6">
              <h2 className="text-lg font-semibold text-purple-300 mb-4 border-b border-purple-500/20 pb-2 flex items-center gap-2">
                <HelpCircle size={20} /> Column Glossary & Formulas
              </h2>
              <div className="space-y-4 text-sm max-h-[80vh] overflow-y-auto custom-scrollbar pr-2">
                {COLUMN_GLOSSARY.map(item => (
                  <div key={item.term} className="border-b border-white/5 pb-2">
                    <p className="font-bold text-slate-200">{item.term}</p>
                    <p className="text-slate-400 text-xs">{item.def}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
