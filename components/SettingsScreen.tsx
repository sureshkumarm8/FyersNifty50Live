
import React, { useState, useRef } from 'react';
import { FyersCredentials } from '../types';
import { 
  Save, ShieldCheck, Upload, Download, Trash2, 
  ArrowLeft, ToggleLeft, ToggleRight, 
  Settings as SettingsIcon, BookOpen, Star, 
  CheckCircle, AlertTriangle, Zap, BarChart4, Clock,
  Layout, MousePointerClick, TrendingUp, Target, Activity, Bot
} from 'lucide-react';
import { REFRESH_OPTIONS, COLUMN_GLOSSARY } from '../constants';
import { dbService } from '../services/db';

interface SettingsScreenProps {
  onBack: () => void;
  onSave: (creds: FyersCredentials) => void;
  currentCreds: FyersCredentials;
}

type Tab = 'configs' | 'guide' | 'glossary' | 'review';

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  onBack, 
  onSave, 
  currentCreds 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('configs');
  const [appId, setAppId] = useState(currentCreds.appId);
  const [accessToken, setAccessToken] = useState(currentCreds.accessToken);
  const [googleApiKey, setGoogleApiKey] = useState(currentCreds.googleApiKey || '');
  const [bypassMarketHours, setBypassMarketHours] = useState(currentCreds.bypassMarketHours || false);
  const [refreshInterval, setRefreshInterval] = useState(currentCreds.refreshInterval || REFRESH_OPTIONS[3].value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onSave({ appId, accessToken, googleApiKey, bypassMarketHours, refreshInterval });
    onBack();
  };

  const handleReset = async () => {
    if (confirm("⚠️ WARNING: This will permanently delete your API credentials and reset all application data (including database history). Are you sure you want to proceed?")) {
        try {
            await dbService.clearAll();
            localStorage.clear();
            window.location.reload();
        } catch (e) {
            alert("Failed to clear database. Please clear browser data manually.");
        }
    }
  };

  const handleDownloadTemplate = () => {
    const template = {
      appId: "XV1234567-100",
      accessToken: "YOUR_GENERATED_ACCESS_TOKEN_HERE",
      googleApiKey: "YOUR_GEMINI_API_KEY_HERE",
      bypassMarketHours: false,
      refreshInterval: 60000
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "nifty50_config_template.json");
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
        if (json.googleApiKey) setGoogleApiKey(json.googleApiKey);
        if (json.bypassMarketHours !== undefined) setBypassMarketHours(json.bypassMarketHours);
        if (json.refreshInterval !== undefined) setRefreshInterval(json.refreshInterval);
        alert("Configuration imported successfully!");
      } catch (err) {
        alert("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 animate-in fade-in duration-300">
      <header className="flex-none glass-header z-10 pt-4 px-4 pb-0 flex flex-col gap-4">
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
            <button 
                onClick={onBack}
                className="p-2 bg-slate-800/50 border border-white/10 rounded-xl text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            >
                <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white">System Configuration</h1>
            </div>
            <button
            onClick={handleSave}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
            >
            <Save size={18} />
            <span className="hidden sm:inline">Save & Close</span>
            </button>
        </div>

        <div className="flex gap-1 overflow-x-auto custom-scrollbar">
            <button 
                onClick={() => setActiveTab('configs')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'configs' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                <SettingsIcon size={16} /> Configuration
            </button>
            <button 
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'guide' ? 'border-emerald-500 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                <Layout size={16} /> Dashboard Guide
            </button>
            <button 
                onClick={() => setActiveTab('glossary')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'glossary' ? 'border-purple-500 text-purple-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                <BookOpen size={16} /> Glossary
            </button>
            <button 
                onClick={() => setActiveTab('review')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'review' ? 'border-yellow-500 text-yellow-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                <Star size={16} /> Review
            </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-slate-950">
        
        {activeTab === 'configs' && (
            <div className="max-w-3xl mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                <section className="glass-panel p-6 rounded-xl">
                    <h2 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2"><SettingsIcon size={18}/> API Credentials</h2>
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
                            <label className="block text-sm font-medium text-slate-400 mb-1">Fyers App ID (Client ID)</label>
                            <input type="text" value={appId} onChange={(e) => setAppId(e.target.value)} placeholder="e.g., XV1234567-100" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-600 font-mono text-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Fyers Access Token</label>
                            <textarea value={accessToken} onChange={(e) => setAccessToken(e.target.value)} placeholder="Paste your generated access token here..." rows={4} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-600 font-mono text-xs resize-none"/>
                        </div>
                        
                        <div className="pt-2 border-t border-white/5">
                            <label className="block text-sm font-medium text-indigo-400 mb-1 flex items-center gap-2"><Bot size={14}/> Google Gemini API Key</label>
                            <input type="password" value={googleApiKey} onChange={(e) => setGoogleApiKey(e.target.value)} placeholder="Enter Gemini API Key (Required for AI Features)" className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder-slate-600 font-mono text-sm"/>
                            <p className="text-xs text-slate-500 mt-1">Leave empty to use environment variable if configured.</p>
                        </div>
                    </div>
                </section>
                
                <section className="glass-panel p-6 rounded-xl">
                    <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center gap-2"><Zap size={18}/> General Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Refresh Interval</label>
                            <select value={refreshInterval} onChange={(e) => setRefreshInterval(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all">
                                {REFRESH_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
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
                            <button onClick={() => setBypassMarketHours(!bypassMarketHours)} className={`transition-colors duration-200 focus:outline-none ${bypassMarketHours ? 'text-green-400' : 'text-slate-600'}`}>
                                {bypassMarketHours ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                            </button>
                        </div>
                    </div>
                </section>

                <section className="glass-panel p-6 rounded-xl border border-red-500/20 bg-red-900/5">
                    <h2 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h2>
                    <p className="text-sm text-red-300/70 mb-3">This will permanently delete all stored settings and data.</p>
                    <button onClick={handleReset} className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-red-900/20 hover:bg-red-900/40 border border-red-900/50 rounded-lg text-sm text-red-300 transition-colors">
                        <Trash2 size={16} /> Reset App Data
                    </button>
                </section>
            </div>
        )}

        {activeTab === 'guide' && (
             <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300 pb-20">
                 {/* Introduction */}
                 <div className="glass-panel p-6 rounded-xl border-l-4 border-blue-500">
                     <h2 className="text-xl font-bold text-white mb-2">How to Read this Dashboard</h2>
                     <p className="text-slate-300 text-sm leading-relaxed">
                         This terminal is designed for <strong className="text-blue-300">trend confirmation</strong>. 
                         Unlike standard broker terminals that show raw prices, this dashboard aggregates the "weighted impact" of stocks on the Nifty 50 Index 
                         and compares buying/selling pressure in real-time.
                     </p>
                 </div>

                 {/* Block 1: The Decision Engine */}
                 <div className="space-y-3">
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Zap size={16} /> The Decision Engine (Top Block)
                     </h3>
                     <div className="glass-panel p-5 rounded-xl">
                         <div className="flex flex-col md:flex-row gap-6">
                             <div className="flex-1">
                                 <div className="mb-2 bg-slate-800/50 p-2 rounded border border-white/5 inline-block">
                                     <span className="text-xs font-mono font-bold text-white">STRONG BUY / NEUTRAL / STRONG SELL</span>
                                 </div>
                                 <p className="text-sm text-slate-300 mb-3">
                                     This bar represents the <strong className="text-white">Trend Strength Score</strong>. It combines three factors over a selected time window (e.g., 5 mins):
                                 </p>
                                 <ul className="text-xs space-y-2 text-slate-400 list-disc pl-4">
                                     <li><strong className="text-blue-300">Price Score:</strong> Is Nifty moving significantly in one direction?</li>
                                     <li><strong className="text-emerald-300">Option Flow:</strong> Are big players buying Calls or Puts?</li>
                                     <li><strong className="text-purple-300">Breadth Scalar:</strong> Is the majority of the market participating?</li>
                                 </ul>
                             </div>
                             <div className="flex-1 bg-slate-900/30 p-4 rounded-lg border border-white/5 text-sm">
                                 <h4 className="font-bold text-white mb-2">Interpreting Signals:</h4>
                                 <ul className="space-y-2">
                                     <li className="flex gap-2"><span className="text-emerald-400 font-bold">STRONG BUY:</span> Momentum + Option Flow are both bullish. High probability trend.</li>
                                     <li className="flex gap-2"><span className="text-red-400 font-bold">STRONG SELL:</span> Momentum + Option Flow are both bearish.</li>
                                     <li className="flex gap-2"><span className="text-yellow-400 font-bold">TRAP / DIVERGENCE:</span> Price is moving up, but Option Flow is bearish (or vice versa). Proceed with caution.</li>
                                 </ul>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Block 2: Cockpit Cards */}
                 <div className="space-y-3">
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Layout size={16} /> Cockpit Metrics
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="glass-panel p-4 rounded-xl">
                             <div className="text-emerald-400 font-bold text-sm mb-1 flex items-center gap-2"><Activity size={14}/> Weighted Breadth</div>
                             <p className="text-xs text-slate-400 mb-2">
                                 Shows the % of Nifty 50 <strong>Weightage</strong> that is bullish.
                             </p>
                             <div className="text-[10px] text-slate-500 bg-slate-900/50 p-2 rounded">
                                 <strong>Why it matters:</strong> If 30 stocks are green but HDFC Bank & Reliance (Heavyweights) are red, this % will be low, indicating a weak index.
                             </div>
                         </div>
                         <div className="glass-panel p-4 rounded-xl">
                             <div className="text-blue-400 font-bold text-sm mb-1 flex items-center gap-2"><Target size={14}/> Net Option Flow</div>
                             <p className="text-xs text-slate-400 mb-2">
                                 (Call Buying - Put Buying) - (Call Selling - Put Selling).
                             </p>
                             <div className="text-[10px] text-slate-500 bg-slate-900/50 p-2 rounded">
                                 <strong>Positive Green:</strong> Traders are aggressively buying Calls. <br/>
                                 <strong>Negative Red:</strong> Traders are aggressively buying Puts.
                             </div>
                         </div>
                         <div className="glass-panel p-4 rounded-xl">
                             <div className="text-yellow-400 font-bold text-sm mb-1 flex items-center gap-2"><Zap size={14}/> Momentum (1m)</div>
                             <p className="text-xs text-slate-400 mb-2">
                                 Immediate buying vs selling pressure in the last 60 seconds.
                             </p>
                             <div className="text-[10px] text-slate-500 bg-slate-900/50 p-2 rounded">
                                 Used for scalping. Shows who is "hitting the market" right now.
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Block 3: Stock Table */}
                 <div className="space-y-3">
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <MousePointerClick size={16} /> Stock Table Logic
                     </h3>
                     <div className="glass-panel p-5 rounded-xl">
                         <table className="w-full text-xs text-left mb-4 opacity-70">
                             <thead className="border-b border-white/10 text-slate-500">
                                 <tr>
                                     <th className="py-2">Symbol</th>
                                     <th className="py-2">LTP</th>
                                     <th className="py-2 text-emerald-400">1m %</th>
                                     <th className="py-2 text-blue-400">Net Strength</th>
                                 </tr>
                             </thead>
                             <tbody>
                                 <tr>
                                     <td className="py-2">RELIANCE</td>
                                     <td className="py-2">2450.00</td>
                                     <td className="py-2 text-emerald-400">+0.15%</td>
                                     <td className="py-2 font-bold text-blue-400">+12%</td>
                                 </tr>
                             </tbody>
                         </table>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                             <div>
                                 <h4 className="font-bold text-white mb-1">Active Bar (Blue Line)</h4>
                                 <p className="text-slate-400 text-xs">The blue vertical bar on the left of a stock name indicates it is currently selected or being hovered. Click to open the detailed 1-minute chart view.</p>
                             </div>
                             <div>
                                 <h4 className="font-bold text-blue-300 mb-1">Net Strength (Key Metric)</h4>
                                 <p className="text-slate-400 text-xs">
                                     Formula: <code className="bg-slate-800 px-1 rounded">Bid Qty % Change - Ask Qty % Change</code>. 
                                     <br/>
                                     If <strong>Net Strength is Green</strong>, buyers are adding limit orders faster than sellers. If Price is falling but Strength is Green, it might be a reversal/absorption.
                                 </p>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Block 4: Options Chain */}
                 <div className="space-y-3">
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                         <Target size={16} /> Options Chain Logic
                     </h3>
                     <div className="glass-panel p-5 rounded-xl flex flex-col sm:flex-row gap-4">
                         <div className="flex-1">
                             <h4 className="text-white font-bold text-sm mb-2">Smart Strike Selection</h4>
                             <p className="text-xs text-slate-400 leading-relaxed">
                                 The app automatically calculates the <strong>Nearest Tuesday Expiry</strong>. It checks for holidays and moves the date if needed. It dynamically loads 25 strikes above and below the current Spot Price.
                             </p>
                         </div>
                         <div className="flex-1 border-l border-white/10 pl-4">
                             <h4 className="text-white font-bold text-sm mb-2">Interpreting Option Data</h4>
                             <p className="text-xs text-slate-400 leading-relaxed">
                                 Look at the <strong>Net Strength</strong> column in the Options view. 
                                 <br/><br/>
                                 If <span className="text-emerald-400">CE Strength is Green</span> and <span className="text-red-400">PE Strength is Red</span>, market participants are positioning for a move UP.
                             </p>
                         </div>
                     </div>
                 </div>

             </div>
        )}

        {activeTab === 'glossary' && (
             <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-300">
                <div className="glass-panel p-6 rounded-xl">
                    <div className="mb-6 flex items-center gap-3">
                        <div className="p-3 bg-purple-500/20 rounded-xl">
                            <BookOpen size={24} className="text-purple-400" />
                        </div>
                        <div>
                             <h2 className="text-xl font-bold text-white">Metrics Glossary</h2>
                             <p className="text-slate-400 text-sm">Understanding the formulas behind Nifty50.AI</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {COLUMN_GLOSSARY.map(item => (
                        <div key={item.term} className="p-4 bg-slate-800/50 rounded-lg border border-white/5 hover:bg-slate-800 transition-colors">
                            <p className="font-bold text-blue-300 mb-1 font-mono">{item.term}</p>
                            <p className="text-slate-400 text-sm leading-relaxed">{item.def}</p>
                        </div>
                        ))}
                    </div>
                </div>
             </div>
        )}

        {activeTab === 'review' && (
             <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-300 pb-20">
                <div className="glass-panel p-6 sm:p-8 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <Star size={120} className="text-yellow-500" />
                    </div>
                    
                    <div className="mb-8">
                         <h2 className="text-2xl font-black text-white mb-2">Trader's Review</h2>
                         <div className="flex items-center gap-2">
                            <div className="flex text-yellow-500">
                                <Star fill="currentColor" size={16} />
                                <Star fill="currentColor" size={16} />
                                <Star fill="currentColor" size={16} />
                                <Star fill="currentColor" size={16} />
                                <Star fill="currentColor" size={16} />
                            </div>
                            <span className="text-slate-400 text-sm font-medium">Internal Audit</span>
                         </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-emerald-900/10 border border-emerald-500/20 p-5 rounded-xl">
                             <h3 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2"><CheckCircle size={18}/> Strengths</h3>
                             <ul className="space-y-3">
                                 <li className="flex gap-3 text-sm text-slate-300">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2"></span>
                                    <span>
                                        <strong className="text-white block mb-1">Session-Relative Data</strong>
                                        By filtering out "Gap Up/Down" noise, the Day % metric focuses purely on intraday flow. This is crucial for catching gap fades or reversals that standard broker terminals miss.
                                    </span>
                                 </li>
                                 <li className="flex gap-3 text-sm text-slate-300">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2"></span>
                                    <span>
                                        <strong className="text-white block mb-1">Weighted Index Impact</strong>
                                        Moves are weighted by Nifty 50 contribution. Seeing HDFC Bank and Reliance move together is prioritized over smaller cap movements, giving a truer picture of index direction.
                                    </span>
                                 </li>
                                 <li className="flex gap-3 text-sm text-slate-300">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2"></span>
                                    <span>
                                        <strong className="text-white block mb-1">Order Flow (Bid/Ask Strength)</strong>
                                        Tracks the intent, not just price. Falling Bid Strength while Price rises is a key leading indicator for traps.
                                    </span>
                                 </li>
                             </ul>
                        </div>

                        <div className="bg-yellow-900/10 border border-yellow-500/20 p-5 rounded-xl">
                             <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2"><AlertTriangle size={18}/> Critical Considerations</h3>
                             <ul className="space-y-3">
                                 <li className="flex gap-3 text-sm text-slate-300">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2"></span>
                                    <span>
                                        <strong className="text-white block mb-1">Data Persistence</strong>
                                        "Day %" is relative to the session start. Refreshing the browser resets the baseline unless local storage is intact. Do not clear cache mid-day.
                                    </span>
                                 </li>
                                 <li className="flex gap-3 text-sm text-slate-300">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2"></span>
                                    <span>
                                        <strong className="text-white block mb-1">Execution Lag</strong>
                                        The API snapshot interval (1s+) is excellent for trend decisions but too slow for tape reading/scalping. Execute trades on your broker's terminal.
                                    </span>
                                 </li>
                             </ul>
                        </div>

                        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Final Verdict</p>
                                <h3 className="text-2xl font-black text-white">8.5/10</h3>
                                <p className="text-sm text-blue-300">Potent Trend Confirmation Cockpit</p>
                            </div>
                            <div className="text-right">
                                <BarChart4 size={40} className="text-slate-700" />
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        )}

      </div>
    </div>
  );
};
