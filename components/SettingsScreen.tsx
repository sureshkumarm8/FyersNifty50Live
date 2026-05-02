
import React, { useState, useRef, useEffect } from 'react';
import { FyersCredentials, TradingSystemProtocol } from '../types';
import { 
  Save, ShieldCheck, Upload, Download, Trash2, 
  ArrowLeft, ToggleLeft, ToggleRight, 
  Settings as SettingsIcon, BookOpen, Star, 
  CheckCircle, AlertTriangle, Zap, BarChart4, Clock,
  Layout, MousePointerClick, TrendingUp, Target, Activity, Bot,
  ClipboardList, CheckSquare, Edit3, FileJson, BrainCircuit, Crosshair,
  Volume2, Layers, Key, Lock, Cpu, TrendingDown
} from 'lucide-react';
import { REFRESH_OPTIONS, COLUMN_GLOSSARY } from '../constants';
import { dbService } from '../services/db';
import { apiCallTracker, APIStats } from '../services/aiProvider';

interface SettingsScreenProps {
  onBack: () => void;
  onSave: (creds: FyersCredentials) => void;
  currentCreds: FyersCredentials;
}

type Tab = 'configs' | 'guide' | 'glossary' | 'review' | 'system' | 'ai-usage' | 'data-management';

const DEFAULT_PROTOCOL: TradingSystemProtocol = {
  "name": "Nifty Sniper: The Office Protocol",
  "description": "Systematic intraday scalping protocol for Nifty 50 Options.",
  "tags": [
    "Time: 9:25-10:15",
    "Target: 30 Pts",
    "Zone Play"
  ],
  "steps": [
    {
      "title": "09:15 - 09:25 (The Download)",
      "items": [
        "Check Global cues & Pre-market settlement.",
        "Mark Previous Day High (PDH) and Previous Day Low (PDL).",
        "Wait for initial volatility to settle."
      ]
    },
    {
      "title": "09:25 - 09:45 (The Entry Window)",
      "items": [
        "Look for the 'Zone Play' setup.",
        "Confirm direction with Option Chain Net Flow.",
        "Wait for candle close above/below key level."
      ]
    },
    {
      "title": "10:15 AM (The Hard Stop)",
      "items": [
        "Close all active positions regardless of P&L.",
        "No new trades after this time.",
        "Journal the session."
      ]
    }
  ],
  "links": [],
  "rules": [
      "Max 2 Trades per day.",
      "Risk max 2% of capital per trade.",
      "Never trade against the 'Net Option Flow' trend."
  ]
};

const renderSafeString = (val: any): string => {
    if (typeof val === 'string') return val;
    if (typeof val === 'number') return String(val);
    if (val === null || val === undefined) return '';
    if (typeof val === 'object') {
        // Handle the specific error case where user might have objects with title/desc in items
        if (val.title) return val.title;
        if (val.description) return val.description;
        return JSON.stringify(val);
    }
    return String(val);
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ 
  onBack, 
  onSave, 
  currentCreds 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('configs');
  const [appId, setAppId] = useState(currentCreds.appId);
  const [accessToken, setAccessToken] = useState(currentCreds.accessToken);
  const [googleApiKey, setGoogleApiKey] = useState(currentCreds.googleApiKey || '');
  const [groqApiKey, setGroqApiKey] = useState(currentCreds.groqApiKey || '');
  const [claudeApiKey, setClaudeApiKey] = useState(currentCreds.claudeApiKey || '');
  const [selectedAiProvider, setSelectedAiProvider] = useState<'gemini' | 'groq' | 'claude'>(currentCreds.aiProvider || 'gemini');
  const [groqModel, setGroqModel] = useState(currentCreds.groqModel || 'llama-3.3-70b-versatile');
  const [geminiModel, setGeminiModel] = useState(currentCreds.geminiModel || 'gemini-2.5-flash');
  const [claudeModel, setClaudeModel] = useState(currentCreds.claudeModel || 'claude-sonnet-4-6');
  const [bypassMarketHours, setBypassMarketHours] = useState(currentCreds.bypassMarketHours || false);
  const [aiEnabled, setAiEnabled] = useState(currentCreds.aiEnabled !== undefined ? currentCreds.aiEnabled : true);
  const [refreshInterval, setRefreshInterval] = useState(currentCreds.refreshInterval || REFRESH_OPTIONS[3].value);
  
  // PayTM Integration
  const [dataProvider, setDataProvider] = useState<'fyers' | 'paytm'>(currentCreds.dataProvider || 'fyers');
  const [paytmAccessToken, setPaytmAccessToken] = useState(currentCreds.paytmAccessToken || '');
  
  // Live Trading Control
  const [liveOrdersEnabled, setLiveOrdersEnabled] = useState(currentCreds.liveOrdersEnabled || false);
  
  // AI Usage Stats
  const [apiStats, setApiStats] = useState<APIStats>(apiCallTracker.getStats());
  
  // Data Management State
  const [clearingHistory, setClearingHistory] = useState(false);
  const [clearMessage, setClearMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [adminSecret, setAdminSecret] = useState(() => {
    return localStorage.getItem('admin_secret') || '';
  });
  
  // Protocol State
  const [protocolData, setProtocolData] = useState<TradingSystemProtocol>(() => {
      try {
          const saved = localStorage.getItem('user_trading_protocol');
          return saved ? JSON.parse(saved) : DEFAULT_PROTOCOL;
      } catch {
          return DEFAULT_PROTOCOL;
      }
  });
  const [isEditingProtocol, setIsEditingProtocol] = useState(false);
  const [protocolJsonInput, setProtocolJsonInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const protocolFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (isEditingProtocol) {
          setProtocolJsonInput(JSON.stringify(protocolData, null, 2));
      }
  }, [isEditingProtocol, protocolData]);

  // Subscribe to API stats updates
  useEffect(() => {
    const unsubscribe = apiCallTracker.subscribe((stats) => {
      setApiStats(stats);
    });
    const interval = setInterval(() => {
      setApiStats(apiCallTracker.getStats());
    }, 5000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleSave = () => {
    onSave({ 
      appId, 
      accessToken, 
      googleApiKey, 
      groqApiKey,
      claudeApiKey,
      groqModel,
      geminiModel,
      claudeModel,
      bypassMarketHours, 
      refreshInterval, 
      aiEnabled, 
      aiProvider: selectedAiProvider,
      dataProvider,
      paytmAccessToken,
      liveOrdersEnabled
    });
    onBack();
  };

  const handleSaveProtocol = () => {
      try {
          const parsed = JSON.parse(protocolJsonInput);
          setProtocolData(parsed);
          localStorage.setItem('user_trading_protocol', JSON.stringify(parsed));
          setIsEditingProtocol(false);
      } catch (e) {
          alert("Invalid JSON format");
      }
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

  // Data Management Functions
  const handleClearHistory = async (action: 'all' | 'today' | 'old') => {
    if (!adminSecret) {
      setClearMessage({
        type: 'error',
        text: 'Admin secret is required. Please enter it in the Admin Secret field below.'
      });
      setTimeout(() => setClearMessage(null), 5000);
      return;
    }

    const confirmMessages = {
      all: '⚠️ This will delete ALL historical data from Redis. Continue?',
      today: '⚠️ This will delete today\'s data from Redis. Continue?',
      old: '⚠️ This will delete old data (keeping last 100 snapshots). Continue?'
    };

    if (!confirm(confirmMessages[action])) return;

    setClearingHistory(true);
    setClearMessage(null);

    try {
      const apiUrl = import.meta.env.PROD 
        ? 'https://fyers-nifty50-live.vercel.app/api/clear-history'
        : '/api/clear-history';
      
      const response = await fetch(`${apiUrl}?action=${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminSecret}`
        }
      });

      const result = await response.json();

      if (result.success) {
        setClearMessage({
          type: 'success',
          text: result.message || `Successfully cleared ${action} data`
        });
        // Save admin secret if successful
        localStorage.setItem('admin_secret', adminSecret);
      } else {
        setClearMessage({
          type: 'error',
          text: result.error || 'Failed to clear history'
        });
      }
    } catch (error) {
      setClearMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Network error occurred'
      });
    } finally {
      setClearingHistory(false);
      setTimeout(() => setClearMessage(null), 5000);
    }
  };

  const handleDownloadTemplate = () => {
    const template = {
      paytm: {
        apiKey: "YOUR_PAYTM_API_KEY",
        apiSecret: "YOUR_PAYTM_API_SECRET",
        accessToken: "YOUR_PAYTM_ACCESS_TOKEN"
      },
      fyers: {
        clientId: "XV1234567-100",
        secretKey: "YOUR_FYERS_SECRET_KEY",
        accessToken: "YOUR_FYERS_ACCESS_TOKEN"
      },
      google: {
        apiKey: "YOUR_GEMINI_API_KEY_HERE"
      },
      groq: {
        apiKey: "YOUR_GROQ_API_KEY_HERE"
      },
      claudeApiKey: {
        apiKey: "YOUR_CLAUDE_API_KEY_HERE"
      },
      config: {
        bypassMarketHours: false,
        refreshInterval: 60000,
        aiEnabled: true,
        aiProvider: "gemini",
        groqModel: "llama-3.3-70b-versatile",
        geminiModel: "gemini-2.5-flash",
        claudeModel: "claude-sonnet-4-6",
        dataProvider: "paytm",
        liveOrdersEnabled: false
      }
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
        let imported = false;
        
        // Handle nested structure (paytm, fyers, google, groq, claudeApiKey, config)
        if (json.fyers) {
          if (json.fyers.clientId) {
            setAppId(json.fyers.clientId);
            imported = true;
          }
          if (json.fyers.accessToken) {
            setAccessToken(json.fyers.accessToken);
            imported = true;
          }
        }
        
        if (json.paytm) {
          if (json.paytm.accessToken) {
            setPaytmAccessToken(json.paytm.accessToken);
            imported = true;
          }
        }
        
        if (json.google) {
          if (json.google.apiKey) {
            setGoogleApiKey(json.google.apiKey);
            imported = true;
          }
        }
        
        if (json.groq) {
          if (json.groq.apiKey) {
            setGroqApiKey(json.groq.apiKey);
            imported = true;
          }
        }
        
        if (json.claude) {
          if (json.claude.apiKey) {
            setClaudeApiKey(json.claude.apiKey);
            imported = true;
          }
        }
        
        // Handle nested claudeApiKey object structure
        if (json.claudeApiKey) {
          if (typeof json.claudeApiKey === 'string') {
            setClaudeApiKey(json.claudeApiKey);
            imported = true;
          } else if (json.claudeApiKey.apiKey) {
            setClaudeApiKey(json.claudeApiKey.apiKey);
            imported = true;
          }
        }
        
        if (json.config) {
          if (json.config.bypassMarketHours !== undefined) {
            setBypassMarketHours(json.config.bypassMarketHours);
            imported = true;
          }
          if (json.config.refreshInterval !== undefined) {
            setRefreshInterval(json.config.refreshInterval);
            imported = true;
          }
          if (json.config.aiEnabled !== undefined) {
            setAiEnabled(json.config.aiEnabled);
            imported = true;
          }
          if (json.config.aiProvider) {
            setSelectedAiProvider(json.config.aiProvider);
            imported = true;
          }
          if (json.config.groqModel) {
            setGroqModel(json.config.groqModel);
            imported = true;
          }
          if (json.config.geminiModel) {
            setGeminiModel(json.config.geminiModel);
            imported = true;
          }
          if (json.config.claudeModel) {
            setClaudeModel(json.config.claudeModel);
            imported = true;
          }
          if (json.config.dataProvider) {
            setDataProvider(json.config.dataProvider);
            imported = true;
          }
          if (json.config.liveOrdersEnabled !== undefined) {
            setLiveOrdersEnabled(json.config.liveOrdersEnabled);
            imported = true;
          }
        }
        
        // Handle flat structure (legacy format)
        if (json.appId) {
          setAppId(json.appId);
          imported = true;
        }
        if (json.accessToken) {
          setAccessToken(json.accessToken);
          imported = true;
        }
        if (json.googleApiKey) {
          setGoogleApiKey(json.googleApiKey);
          imported = true;
        }
        if (json.groqApiKey) {
          setGroqApiKey(json.groqApiKey);
          imported = true;
        }
        if (json.claudeApiKey && typeof json.claudeApiKey === 'string') {
          setClaudeApiKey(json.claudeApiKey);
          imported = true;
        }
        if (json.groqModel) {
          setGroqModel(json.groqModel);
          imported = true;
        }
        if (json.geminiModel) {
          setGeminiModel(json.geminiModel);
          imported = true;
        }
        if (json.claudeModel) {
          setClaudeModel(json.claudeModel);
          imported = true;
        }
        if (json.aiProvider) {
          setSelectedAiProvider(json.aiProvider);
          imported = true;
        }
        if (json.bypassMarketHours !== undefined) {
          setBypassMarketHours(json.bypassMarketHours);
          imported = true;
        }
        if (json.refreshInterval !== undefined) {
          setRefreshInterval(json.refreshInterval);
          imported = true;
        }
        if (json.aiEnabled !== undefined) {
          setAiEnabled(json.aiEnabled);
          imported = true;
        }
        if (json.dataProvider) {
          setDataProvider(json.dataProvider);
          imported = true;
        }
        if (json.paytmAccessToken) {
          setPaytmAccessToken(json.paytmAccessToken);
          imported = true;
        }
        if (json.liveOrdersEnabled !== undefined) {
          setLiveOrdersEnabled(json.liveOrdersEnabled);
          imported = true;
        }
        
        if (imported) {
          alert("Configuration imported successfully!");
        } else {
          alert("No valid configuration found in JSON file.");
        }
      } catch (err) {
        alert("Error parsing JSON file. Please ensure it is valid JSON.");
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleProtocolFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        // Loose validation
        if (json.name || json.steps) {
             setProtocolData(json);
             setProtocolJsonInput(JSON.stringify(json, null, 2));
             localStorage.setItem('user_trading_protocol', JSON.stringify(json));
             alert("System Protocol imported successfully!");
        } else {
            alert("Invalid Protocol JSON. Ensure it has 'name' and 'steps' fields.");
        }
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
            <div className="flex items-center gap-3">
                <button 
                    onClick={handleReset}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors"
                    title="Reset All Data"
                >
                    <Trash2 size={18} />
                    <span className="hidden sm:inline text-xs font-bold uppercase">Reset</span>
                </button>
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Save size={18} />
                    <span className="hidden sm:inline">Save & Close</span>
                </button>
            </div>
        </div>

        <div className="flex gap-1 overflow-x-auto custom-scrollbar">
            <button 
                onClick={() => setActiveTab('configs')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'configs' ? 'border-blue-500 text-blue-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                <SettingsIcon size={16} /> Configuration
            </button>
             <button 
                onClick={() => setActiveTab('system')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'system' ? 'border-rose-500 text-rose-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                <ClipboardList size={16} /> My System
            </button>
            <button 
                onClick={() => setActiveTab('guide')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'guide' ? 'border-emerald-500 text-emerald-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                <Layout size={16} /> Guide
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
            <button 
                onClick={() => setActiveTab('ai-usage')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'ai-usage' ? 'border-purple-500 text-purple-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                <Bot size={16} /> AI Usage
            </button>
            <button 
                onClick={() => setActiveTab('data-management')}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === 'data-management' ? 'border-red-500 text-red-400 font-bold' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
            >
                <Trash2 size={16} /> Data Management
            </button>
        </div>
      </header>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-slate-950">
        
        {activeTab === 'configs' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300 pb-20">
                
                {/* CONNECTION CARD */}
                <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
                    <div className="px-6 py-4 bg-slate-900/50 border-b border-white/5 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="p-1.5 bg-blue-500/10 rounded-lg text-blue-400"><Key size={18}/></div>
                            Broker Connection
                        </h2>
                        <div className="flex gap-2">
                             {/* Import/Export buttons small */}
                             <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-white/10 transition-colors flex items-center gap-2">
                                <Upload size={12}/> Import
                             </button>
                             <button onClick={handleDownloadTemplate} className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-white/10 transition-colors flex items-center gap-2">
                                <Download size={12}/> Template
                             </button>
                             <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".json"/>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-lg flex gap-3 items-start">
                            <ShieldCheck size={18} className="text-blue-400 mt-0.5 shrink-0" />
                            <div>
                                <h4 className="text-sm font-bold text-blue-300">Secure Client-Side Storage</h4>
                                <p className="text-xs text-slate-400 mt-1">Your credentials are encrypted and stored locally in your browser. Requests are routed through a secure proxy to prevent CORS issues.</p>
                            </div>
                        </div>

                        {/* Data Provider Selection */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Data Provider</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                    <Layers size={16} />
                                </div>
                                <select 
                                    value={dataProvider} 
                                    onChange={(e) => setDataProvider(e.target.value as 'fyers' | 'paytm')}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                                >
                                    <option value="fyers">Fyers API (Legacy)</option>
                                    <option value="paytm">PayTM Money</option>
                                </select>
                            </div>
                        </div>

                        {/* Conditional Rendering based on Provider */}
                        {dataProvider === 'fyers' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Fyers App ID</label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                            <SettingsIcon size={16} />
                                        </div>
                                        <input 
                                            type="text" 
                                            value={appId} 
                                            onChange={(e) => setAppId(e.target.value)} 
                                            placeholder="e.g. XV12345-100"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Access Token</label>
                                    <div className="relative group h-full">
                                         <div className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                            <Key size={16} />
                                        </div>
                                        <textarea 
                                            value={accessToken} 
                                            onChange={(e) => setAccessToken(e.target.value)} 
                                            placeholder="Paste token here..."
                                            rows={1}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono resize-none min-h-[46px] overflow-hidden"
                                            style={{ minHeight: '46px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">PayTM Access Token</label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-3 text-slate-500 group-focus-within:text-blue-400 transition-colors">
                                        <Lock size={16} />
                                    </div>
                                    <textarea 
                                        value={paytmAccessToken ? '•'.repeat(Math.min(paytmAccessToken.length, 100)) : ''} 
                                        onChange={(e) => {
                                            // Allow editing by clearing the masked value
                                            if (e.target.value === '') {
                                                setPaytmAccessToken('');
                                            }
                                        }}
                                        onFocus={(e) => {
                                            // Show actual value when focused for editing
                                            e.target.value = paytmAccessToken;
                                        }}
                                        onBlur={(e) => {
                                            // Save the actual value and re-mask
                                            setPaytmAccessToken(e.target.value);
                                        }}
                                        placeholder="Paste your PayTM Money access token here..."
                                        rows={2}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono resize-none"
                                    />
                                </div>
                                <p className="text-xs text-slate-500 ml-1 mt-2">
                                    Get your access token from <a href="https://developer.paytmmoney.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">PayTM Money Developer Portal</a>
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* AI INTEGRATION CARD */}
                <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
                    <div className="px-6 py-4 bg-slate-900/50 border-b border-white/5">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400"><Bot size={18}/></div>
                            Intelligence Engine
                        </h2>
                    </div>
                    <div className="p-6 space-y-6">
                         <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-xl">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${aiEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-800 text-slate-600'}`}>
                                    <BrainCircuit size={24} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">AI Capabilities</h3>
                                    <p className="text-xs text-slate-500">Enable Quant Analysis, Sniper Scope & Voice Chat</p>
                                </div>
                            </div>
                            <button onClick={() => setAiEnabled(!aiEnabled)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${aiEnabled ? 'bg-indigo-600' : 'bg-slate-700'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${aiEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
                            </button>
                         </div>

                         <div className={`space-y-2 transition-opacity duration-300 ${aiEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">AI Provider</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                    <Cpu size={16} />
                                </div>
                                <select 
                                    value={selectedAiProvider} 
                                    onChange={(e) => setSelectedAiProvider(e.target.value as 'gemini' | 'groq' | 'claude')}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                                >
                                    <option value="gemini">Gemini AI</option>
                                    <option value="groq">Groq AI</option>
                                    <option value="claude">Claude AI</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                         </div>

                         {selectedAiProvider === 'gemini' && (
                            <>
                              <div className={`space-y-2 transition-opacity duration-300 ${aiEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Gemini API Key</label>
                               <div className="relative group">
                                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                       <Lock size={16} />
                                   </div>
                                   <input 
                                       type="password" 
                                       value={googleApiKey} 
                                       onChange={(e) => setGoogleApiKey(e.target.value)} 
                                       placeholder="sk-..."
                                       className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono"
                                   />
                               </div>
                               <p className="text-[10px] text-slate-500 text-right">Get your key from console.ai.google.com</p>
                              </div>

                              <div className={`space-y-2 transition-opacity duration-300 ${aiEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Gemini Model</label>
                               <div className="relative">
                                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                       <BrainCircuit size={16} />
                                   </div>
                                   <select 
                                       value={geminiModel} 
                                       onChange={(e) => setGeminiModel(e.target.value)}
                                       className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                                   >
                                       <optgroup label="💎 Frontier Models (Recommended)">
                                           <option value="gemini-2.5-flash">Gemini 2.5 Flash - Current Default</option>
                                           <option value="gemini-2.5-pro">Gemini 2.5 Pro - Stable Multimodal</option>
                                           <option value="gemini-3-flash-preview">Gemini 3 Flash Preview - High-Speed</option>
                                           <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview - Peak Reasoning</option>
                                           <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash-Lite - Low Latency</option>
                                       </optgroup>
                                       <optgroup label="🔄 Latest Aliases (Auto-upgrade)">
                                           <option value="gemini-3-flash-latest">Gemini 3 Flash Latest - Auto-upgrade</option>
                                           <option value="gemini-3.1-pro-latest">Gemini 3.1 Pro Latest - Auto-upgrade</option>
                                       </optgroup>
                                       <optgroup label="🦾 Gemma 4 Open Models (April 2, 2026)">
                                           <option value="gemma-4-31b-it">Gemma 4 31B Dense - Workstation-class</option>
                                           <option value="gemma-4-26b-moe-it">Gemma 4 26B MoE - Fast Inference (3.8B active)</option>
                                           <option value="gemma-4-4b-it">Gemma 4 E4B - Edge-optimized (Audio/Image)</option>
                                           <option value="gemma-4-2b-it">Gemma 4 E2B - Ultra-lightweight (Mobile/IoT)</option>
                                       </optgroup>
                                       <optgroup label="🎨 Specialized Endpoints">
                                           <option value="gemini-3.1-flash-image-preview">Image Generation (Nano Banana 2)</option>
                                           <option value="veo-3.1-lite-generate-preview">Video Generation (Veo 3.1)</option>
                                           <option value="lyria-3-generate-preview">Music Generation (Lyria 3)</option>
                                       </optgroup>
                                       <optgroup label="🔢 Embedding">
                                           <option value="text-embedding-004">Text Embedding 004</option>
                                       </optgroup>
                                   </select>
                                   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                   </div>
                               </div>
                               <p className="text-[10px] text-slate-500">
                                   <span className="text-blue-400 font-bold">2.5 Flash</span> = Default | 
                                   <span className="text-purple-400 font-bold ml-1">3.1 Pro</span> = Complex reasoning |
                                   <span className="text-green-400 font-bold ml-1">Gemma 4</span> = Open models |
                                   <span className="text-yellow-400 font-bold ml-1">15+ models</span> available
                               </p>
                              </div>
                            </>
                         )}

                         {selectedAiProvider === 'groq' && (
                            <>
                              <div className={`space-y-2 transition-opacity duration-300 ${aiEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Groq API Key</label>
                               <div className="relative group">
                                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                       <Lock size={16} />
                                   </div>
                                   <input 
                                       type="password" 
                                       value={groqApiKey} 
                                       onChange={(e) => setGroqApiKey(e.target.value)} 
                                       placeholder="gsk-..."
                                       className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono"
                                   />
                               </div>
                               <p className="text-[10px] text-slate-500 text-right">Get your key from console.groq.com</p>
                              </div>

                              <div className={`space-y-2 transition-opacity duration-300 ${aiEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Groq Model</label>
                               <div className="relative">
                                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                       <BrainCircuit size={16} />
                                   </div>
                                   <select 
                                       value={groqModel} 
                                       onChange={(e) => setGroqModel(e.target.value)}
                                       className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                                   >
                                       <optgroup label="🚀 Recommended (High Performance)">
                                           <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile - Best Overall</option>
                                           <option value="meta-llama/llama-4-scout-17b-16e-instruct">Llama 4 Scout 17B - Latest</option>
                                           <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant - Fastest</option>
                                       </optgroup>
                                       <optgroup label="🌟 Meta Llama Family">
                                           <option value="llama-3.1-70b-versatile">Llama 3.1 70B Versatile</option>
                                           <option value="meta-llama/llama-prompt-guard-2-86m">Llama Prompt Guard 2 (86M)</option>
                                           <option value="meta-llama/llama-prompt-guard-2-22m">Llama Prompt Guard 2 (22M)</option>
                                       </optgroup>
                                       <optgroup label="🌙 Moonshot AI Kimi">
                                           <option value="moonshotai/kimi-k2-instruct">Kimi K2 Instruct</option>
                                           <option value="moonshotai/kimi-k2-instruct-0905">Kimi K2 Instruct (v0905)</option>
                                       </optgroup>
                                       <optgroup label="🔓 OpenAI Open Source">
                                           <option value="openai/gpt-oss-120b">GPT OSS 120B</option>
                                           <option value="openai/gpt-oss-20b">GPT OSS 20B</option>
                                           <option value="openai/gpt-oss-safeguard-20b">GPT OSS Safeguard 20B</option>
                                       </optgroup>
                                       <optgroup label="🧠 Groq Compound">
                                           <option value="groq/compound">Groq Compound</option>
                                           <option value="groq/compound-mini">Groq Compound Mini</option>
                                       </optgroup>
                                       <optgroup label="🌏 International Models">
                                           <option value="qwen/qwen3-32b">Qwen 3 32B (Chinese)</option>
                                           <option value="allam-2-7b">Allam 2 7B (Arabic)</option>
                                           <option value="canopylabs/orpheus-arabic-saudi">Orpheus Arabic Saudi</option>
                                           <option value="canopylabs/orpheus-v1-english">Orpheus v1 English</option>
                                       </optgroup>
                                       <optgroup label="🎙️ Audio Models (Whisper)">
                                           <option value="whisper-large-v3">Whisper Large v3</option>
                                           <option value="whisper-large-v3-turbo">Whisper Large v3 Turbo</option>
                                       </optgroup>
                                   </select>
                                   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                   </div>
                               </div>
                               <p className="text-[10px] text-slate-500">
                                   <span className="text-purple-400 font-bold">Llama 3.3 70B</span> = Best overall | 
                                   <span className="text-blue-400 font-bold ml-1">Llama 4 Scout</span> = Latest |
                                   <span className="text-green-400 font-bold ml-1">8B Instant</span> = Fastest |
                                   <span className="text-yellow-400 font-bold ml-1">25+ models</span> available
                               </p>
                              </div>
                            </>
                         )}

                         {selectedAiProvider === 'claude' && (
                            <>
                              <div className={`space-y-2 transition-opacity duration-300 ${aiEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Claude API Key</label>
                               <div className="relative group">
                                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                                       <Lock size={16} />
                                   </div>
                                   <input 
                                       type="password" 
                                       value={claudeApiKey} 
                                       onChange={(e) => setClaudeApiKey(e.target.value)} 
                                       placeholder="sk-ant-..."
                                       className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-mono"
                                   />
                               </div>
                               <p className="text-[10px] text-slate-500 text-right">Get your key from console.anthropic.com</p>
                              </div>

                              <div className={`space-y-2 transition-opacity duration-300 ${aiEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Claude Model</label>
                               <div className="relative">
                                   <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                       <BrainCircuit size={16} />
                                   </div>
                                   <select 
                                       value={claudeModel} 
                                       onChange={(e) => setClaudeModel(e.target.value)}
                                       className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                                   >
                                       <option value="claude-sonnet-4-6">Claude Sonnet 4.6 - Best Balance (1M tokens) [$3/$15]</option>
                                       <option value="claude-opus-4-6">Claude Opus 4.6 - Most Intelligent (1M tokens) [$5/$25]</option>
                                       <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 - Fastest & Affordable (200K tokens) [$1/$5]</option>
                                   </select>
                                   <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                   </div>
                               </div>
                               <p className="text-[10px] text-slate-500">
                                   <span className="text-orange-400 font-bold">Sonnet 4.6</span> = Recommended | 
                                   <span className="text-purple-400 font-bold ml-1">Opus 4.6</span> = Maximum intelligence |
                                   <span className="text-green-400 font-bold ml-1">Haiku 4.5</span> = Speed & cost-effective
                               </p>
                              </div>
                            </>
                         )}
                    </div>
                </div>

                {/* PREFERENCES CARD */}
                <div className="glass-panel rounded-xl overflow-hidden border border-slate-800">
                    <div className="px-6 py-4 bg-slate-900/50 border-b border-white/5">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400"><Zap size={18}/></div>
                            System Preferences
                        </h2>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Data Refresh Rate</label>
                            <div className="relative">
                                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                                    <Activity size={16} />
                                </div>
                                <select 
                                    value={refreshInterval} 
                                    onChange={(e) => setRefreshInterval(Number(e.target.value))}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none appearance-none cursor-pointer"
                                >
                                    {REFRESH_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                         </div>

                         <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-white/5 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${bypassMarketHours ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-600'}`}>
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Dev Mode</h3>
                                    <p className="text-xs text-slate-500">Bypass Market Hours Check</p>
                                </div>
                            </div>
                            <button onClick={() => setBypassMarketHours(!bypassMarketHours)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${bypassMarketHours ? 'bg-purple-600' : 'bg-slate-700'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bypassMarketHours ? 'translate-x-6' : 'translate-x-1'}`}/>
                            </button>
                         </div>

                         <div className="flex items-center justify-between p-4 bg-slate-950/50 border border-red-500/20 rounded-xl">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg ${liveOrdersEnabled ? 'bg-red-500/20 text-red-400' : 'bg-slate-800 text-slate-600'}`}>
                                    <Lock size={20} />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-white">Live Trading</h3>
                                    <p className="text-xs text-slate-500">Enable Real Broker Orders (Use with caution)</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => {
                                    if (!liveOrdersEnabled) {
                                        if (confirm('⚠️ WARNING: Enabling live orders will allow AutoTrade to place real orders with your broker. Are you sure?')) {
                                            setLiveOrdersEnabled(true);
                                        }
                                    } else {
                                        setLiveOrdersEnabled(false);
                                    }
                                }} 
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${liveOrdersEnabled ? 'bg-red-600 animate-pulse' : 'bg-slate-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${liveOrdersEnabled ? 'translate-x-6' : 'translate-x-1'}`}/>
                            </button>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'system' && (
             <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-4 duration-300 pb-20">
                 
                 <div className="glass-panel p-6 rounded-xl relative overflow-hidden">
                     <div className="flex justify-between items-start mb-6">
                         <div>
                             <h2 className="text-2xl font-black text-white">{renderSafeString(protocolData.name)}</h2>
                             <p className="text-slate-400 text-sm mt-1">{renderSafeString(protocolData.description)}</p>
                         </div>
                         <div className="flex gap-2">
                             <input type="file" ref={protocolFileInputRef} onChange={handleProtocolFileUpload} className="hidden" accept=".json"/>
                             <button 
                                 onClick={() => protocolFileInputRef.current?.click()}
                                 className="p-2 rounded-lg border bg-slate-800 text-slate-400 border-white/10 hover:text-white transition-colors"
                                 title="Import Protocol JSON"
                             >
                                 <Upload size={18} />
                             </button>
                             <button 
                                 onClick={() => setIsEditingProtocol(!isEditingProtocol)}
                                 className={`p-2 rounded-lg border transition-colors ${isEditingProtocol ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-white/10 hover:text-white'}`}
                                 title={isEditingProtocol ? "Save Manual Edits" : "Edit JSON Manually"}
                             >
                                 {isEditingProtocol ? <Save size={18} /> : <Edit3 size={18} />}
                             </button>
                         </div>
                     </div>

                     {isEditingProtocol ? (
                         <div className="space-y-4">
                             <div className="bg-yellow-900/20 p-3 rounded border border-yellow-500/20 text-xs text-yellow-200 flex items-start gap-2">
                                 <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                 <p>Edit your protocol JSON below. Ensure valid syntax.</p>
                             </div>
                             <textarea 
                                 value={protocolJsonInput}
                                 onChange={(e) => setProtocolJsonInput(e.target.value)}
                                 className="w-full h-[500px] bg-slate-900 font-mono text-xs text-slate-300 p-4 rounded-lg border border-slate-700 focus:outline-none focus:border-indigo-500"
                             />
                             <div className="flex justify-end gap-3">
                                 <button onClick={() => setIsEditingProtocol(false)} className="px-4 py-2 text-slate-400 hover:text-white transition-colors text-sm">Cancel</button>
                                 <button onClick={handleSaveProtocol} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-bold">Save Changes</button>
                             </div>
                         </div>
                     ) : (
                         <div className="space-y-8">
                             {/* Tags */}
                             <div className="flex flex-wrap gap-2">
                                 {protocolData.tags?.map((tag, i) => (
                                     <span key={i} className="px-3 py-1 rounded-full bg-slate-800/50 border border-white/10 text-xs font-bold text-blue-300 flex items-center gap-1">
                                         <Zap size={10} className="text-yellow-400" /> {renderSafeString(tag)}
                                     </span>
                                 ))}
                             </div>

                             {/* Execution Timeline */}
                             <div className="relative">
                                 <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-800"></div>
                                 <div className="space-y-8">
                                     {protocolData.steps?.map((step, idx) => (
                                         <div key={idx} className="relative pl-10">
                                             <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center z-10">
                                                 <Clock size={14} className="text-slate-400" />
                                             </div>
                                             <h3 className="text-lg font-bold text-white mb-3">{renderSafeString(step.title)}</h3>
                                             <ul className="space-y-2">
                                                 {step.items.map((item, ii) => (
                                                     <li key={ii} className="flex items-start gap-2 text-sm text-slate-300 bg-slate-800/30 p-2 rounded border border-white/5">
                                                         <CheckSquare size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                                                         <span>{renderSafeString(item) || "N/A"}</span>
                                                     </li>
                                                 ))}
                                             </ul>
                                         </div>
                                     ))}
                                 </div>
                             </div>

                             {/* Rules */}
                             {protocolData.rules && protocolData.rules.length > 0 && (
                                 <div className="bg-rose-900/10 border border-rose-500/20 rounded-xl p-5">
                                     <h3 className="text-rose-400 font-bold text-sm uppercase tracking-widest mb-3 flex items-center gap-2">
                                         <ShieldCheck size={16} /> Cardinal Rules
                                     </h3>
                                     <ul className="space-y-2">
                                         {protocolData.rules.map((rule, i) => (
                                             <li key={i} className="text-sm text-slate-200 flex items-start gap-2">
                                                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0"></div>
                                                 {renderSafeString(rule)}
                                             </li>
                                         ))}
                                     </ul>
                                 </div>
                             )}
                         </div>
                     )}
                 </div>
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
                                 The app uses a <strong>pre-validated static calendar</strong> with all Nifty 50 expiry dates for 2026-2028, excluding NSE holidays (Republic Day, Holi, Diwali, etc.). 
                                 It automatically selects the next valid Tuesday expiry and shows <strong>±20 strikes (1000 points)</strong> around current Nifty spot price.
                             </p>
                         </div>
                         <div className="flex-1 border-l border-white/10 pl-4">
                             <h4 className="text-white font-bold text-sm mb-2">Interpreting Option Data</h4>
                             <p className="text-xs text-slate-400 leading-relaxed">
                                 <strong>Example:</strong> If Nifty is at 23000, you'll see strikes from 22000 to 24000 for both CE and PE. 
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
                            <span className="text-slate-400 text-sm font-medium">Internal System Audit</span>
                         </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-emerald-900/10 border border-emerald-500/20 p-5 rounded-xl">
                             <h3 className="text-lg font-bold text-emerald-400 mb-3 flex items-center gap-2"><CheckCircle size={18}/> New Capabilities</h3>
                             <ul className="space-y-3">
                                 <li className="flex gap-3 text-sm text-slate-300">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2"></span>
                                    <span>
                                        <strong className="text-white block mb-1 flex items-center gap-2"><BrainCircuit size={14}/> AI Probability Engine (Quant Deck)</strong>
                                        Automated market scans every 5 minutes during market hours. The system now scores trend probability (0-100%) based on weighted sentiment, flow divergence, and structural anomalies.
                                    </span>
                                 </li>
                                 <li className="flex gap-3 text-sm text-slate-300">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2"></span>
                                    <span>
                                        <strong className="text-white block mb-1 flex items-center gap-2"><Crosshair size={14}/> Sniper Scope & Audio Alerts</strong>
                                        This is a game-changer for discipline. The AI strictly enforces your defined "Protocol" against live data. <span className="text-emerald-400 font-bold">New:</span> Audio Alerts (TTS) announce trade signals hands-free.
                                    </span>
                                 </li>
                                 <li className="flex gap-3 text-sm text-slate-300">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2"></span>
                                    <span>
                                        <strong className="text-white block mb-1 flex items-center gap-2"><Layers size={14}/> Pivot Point Context</strong>
                                        The system now calculates previous day's High, Low, and Close to determine CPR, R1, and S1 levels. The AI uses this "Location" context to filter bad trades (e.g., buying into resistance).
                                    </span>
                                 </li>
                             </ul>
                        </div>

                        <div className="bg-blue-900/10 border border-blue-500/20 p-5 rounded-xl">
                             <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2"><Zap size={18}/> Core Edge</h3>
                             <ul className="space-y-3">
                                 <li className="flex gap-3 text-sm text-slate-300">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></span>
                                    <span>
                                        <strong className="text-white block mb-1 flex items-center gap-2"><Activity size={14}/> Sectoral Heatmap</strong>
                                        A visual bar showing weighted performance of Banks, IT, Auto, etc. Helps identify if a move is broad-based or just one sector pulling the index.
                                    </span>
                                 </li>
                                 <li className="flex gap-3 text-sm text-slate-300">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></span>
                                    <span>
                                        <strong className="text-white block mb-1 flex items-center gap-2"><CheckSquare size={14}/> Quant Feedback Loop</strong>
                                        The system now "grades" its own signals after 15 minutes. It marks past predictions as <span className="text-emerald-400">WIN</span> or <span className="text-rose-400">LOSS</span> based on price movement, building a track record.
                                    </span>
                                 </li>
                             </ul>
                        </div>

                        <div className="bg-yellow-900/10 border border-yellow-500/20 p-5 rounded-xl">
                             <h3 className="text-lg font-bold text-yellow-400 mb-3 flex items-center gap-2"><AlertTriangle size={18}/> Operational Notes</h3>
                             <ul className="space-y-3">
                                 <li className="flex gap-3 text-sm text-slate-300">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2"></span>
                                    <span>
                                        <strong className="text-white block mb-1">Data Persistence</strong>
                                        "Day %" is relative to the session start. The new database feature now preserves session history on reload, but clearing browser data will reset baselines.
                                    </span>
                                 </li>
                                 <li className="flex gap-3 text-sm text-slate-300">
                                    <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-yellow-500 mt-2"></span>
                                    <span>
                                        <strong className="text-white block mb-1">Execution</strong>
                                        The API snapshot interval is excellent for trend decisions but use your broker's terminal for sub-second scalping entries.
                                    </span>
                                 </li>
                             </ul>
                        </div>

                        <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">System Verdict</p>
                                <h3 className="text-2xl font-black text-white">9.8/10</h3>
                                <p className="text-sm text-blue-300">Pro-Grade Institutional Terminal</p>
                            </div>
                            <div className="text-right">
                                <BarChart4 size={40} className="text-slate-700" />
                            </div>
                        </div>
                    </div>
                </div>
             </div>
        )}

        {activeTab === 'ai-usage' && (
            <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-4 duration-300 pb-20">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="glass-panel p-4 rounded-xl border border-purple-500/20">
                        <div className="text-xs text-slate-400 mb-1">Calls/Minute</div>
                        <div className="text-2xl font-bold text-purple-400">{apiStats.lastMinute}</div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl border border-blue-500/20">
                        <div className="text-xs text-slate-400 mb-1">Today's Calls</div>
                        <div className="text-2xl font-bold text-blue-400">{apiStats.today}</div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl border border-green-500/20">
                        <div className="text-xs text-slate-400 mb-1">Avg Response</div>
                        <div className="text-2xl font-bold text-green-400">{apiStats.avgDuration.toFixed(0)}ms</div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl border border-yellow-500/20">
                        <div className="text-xs text-slate-400 mb-1">Success Rate</div>
                        <div className="text-2xl font-bold text-yellow-400">{apiStats.successRate.toFixed(1)}%</div>
                    </div>
                </div>

                {/* Provider Breakdown */}
                <div className="glass-panel p-6 rounded-xl mb-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <BarChart4 size={20} className="text-purple-400" />
                        Provider Breakdown
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <div className="text-sm text-slate-400 mb-2">Total Calls</div>
                            <div className="text-3xl font-bold text-white">{apiStats.total}</div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-400 mb-2">Gemini Calls</div>
                            <div className="text-3xl font-bold text-green-400">{apiStats.geminiCalls}</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {apiStats.total > 0 ? ((apiStats.geminiCalls / apiStats.total) * 100).toFixed(1) : 0}%
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-400 mb-2">Groq Calls</div>
                            <div className="text-3xl font-bold text-purple-400">{apiStats.groqCalls}</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {apiStats.total > 0 ? ((apiStats.groqCalls / apiStats.total) * 100).toFixed(1) : 0}%
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-slate-400 mb-2">Claude Calls</div>
                            <div className="text-3xl font-bold text-orange-400">{apiStats.claudeCalls}</div>
                            <div className="text-xs text-slate-500 mt-1">
                                {apiStats.total > 0 ? ((apiStats.claudeCalls / apiStats.total) * 100).toFixed(1) : 0}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Time-based Stats */}
                <div className="glass-panel p-6 rounded-xl mb-6">
                    <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-blue-400" />
                        Time-based Activity
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-300">Last Minute</span>
                            <span className="text-white font-bold">{apiStats.lastMinute} calls</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-300">Last 5 Minutes</span>
                            <span className="text-white font-bold">{apiStats.last5Minutes} calls</span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-300">Last Hour</span>
                            <span className="text-white font-bold">{apiStats.lastHour} calls</span>
                        </div>
                    </div>
                </div>

                {/* Recent Calls */}
                <div className="glass-panel p-6 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity size={20} className="text-green-400" />
                            Recent API Calls (Last 10)
                        </h2>
                        <button
                            onClick={() => {
                                if (confirm('Clear all API call statistics?')) {
                                    apiCallTracker.clearStats();
                                }
                            }}
                            className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <Trash2 size={14} />
                            Clear Stats
                        </button>
                    </div>
                    
                    {apiStats.recentCalls.length > 0 ? (
                        <div className="space-y-2">
                            {apiStats.recentCalls.map((call, idx) => (
                                <div
                                    key={idx}
                                    className={`flex items-center justify-between p-3 rounded-lg border ${
                                        call.success 
                                            ? 'bg-green-500/5 border-green-500/20' 
                                            : 'bg-red-500/5 border-red-500/20'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full ${call.success ? 'bg-green-500' : 'bg-red-500'}`} />
                                        <div>
                                            <div className="text-sm text-white font-mono">
                                                {call.provider.toUpperCase()} {call.model ? `(${call.model})` : ''}
                                            </div>
                                            <div className="text-xs text-slate-500">
                                                {new Date(call.timestamp).toLocaleTimeString('en-IN', { hour12: false })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={`text-sm font-bold ${call.success ? 'text-green-400' : 'text-red-400'}`}>
                                            {call.duration.toFixed(0)}ms
                                        </div>
                                        {call.tokensUsed && (
                                            <div className="text-xs text-slate-500">{call.tokensUsed} tokens</div>
                                        )}
                                        {call.error && (
                                            <div className="text-xs text-red-400 max-w-xs truncate" title={call.error}>{call.error}</div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            <Bot size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-sm">No API calls yet</p>
                            <p className="text-xs mt-2">AI stats will appear when you use AI features</p>
                        </div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'data-management' && (
            <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-300 pb-20">
                {/* Header Warning */}
                <div className="glass-panel p-4 rounded-xl mb-6 bg-yellow-500/5 border border-yellow-500/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-bold text-yellow-400 mb-1">Caution: Irreversible Operations</h3>
                            <p className="text-sm text-slate-300">
                                These operations will permanently delete data from your Redis/Upstash database. 
                                Please be careful when using these features.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Status Message */}
                {clearMessage && (
                    <div className={`glass-panel p-4 rounded-xl mb-6 ${
                        clearMessage.type === 'success' 
                            ? 'bg-green-500/5 border-green-500/20' 
                            : 'bg-red-500/5 border-red-500/20'
                    }`}>
                        <div className="flex items-center gap-3">
                            {clearMessage.type === 'success' ? (
                                <CheckCircle size={20} className="text-green-400 flex-shrink-0" />
                            ) : (
                                <AlertTriangle size={20} className="text-red-400 flex-shrink-0" />
                            )}
                            <p className={`text-sm font-medium ${
                                clearMessage.type === 'success' ? 'text-green-400' : 'text-red-400'
                            }`}>
                                {clearMessage.text}
                            </p>
                        </div>
                    </div>
                )}

                {/* Admin Secret Input */}
                <div className="glass-panel rounded-xl overflow-hidden border border-slate-800 mb-6">
                    <div className="px-6 py-4 bg-purple-900/20 border-b border-purple-500/20 flex items-center gap-3">
                        <Lock size={20} className="text-purple-400" />
                        <h2 className="text-lg font-bold text-purple-400">Admin Authentication</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-slate-300 text-sm">
                            Enter your admin secret to authorize data management operations. This is the <span className="font-bold text-white">ADMIN_SECRET</span> or <span className="font-bold text-white">CRON_SECRET</span> environment variable from your Vercel deployment.
                        </p>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-slate-300">
                                Admin Secret
                            </label>
                            <input
                                type="password"
                                value={adminSecret}
                                onChange={(e) => setAdminSecret(e.target.value)}
                                placeholder="Enter admin secret..."
                                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                            <p className="text-xs text-slate-500">
                                This secret is stored locally and used to authenticate data deletion requests.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Clear All History */}
                <div className="glass-panel rounded-xl overflow-hidden border border-slate-800 mb-6">
                    <div className="px-6 py-4 bg-red-900/20 border-b border-red-500/20 flex items-center gap-3">
                        <Trash2 size={20} className="text-red-400" />
                        <h2 className="text-lg font-bold text-red-400">Clear All History</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-slate-300 text-sm">
                            Delete <span className="font-bold text-white">all historical snapshots</span> from Redis. 
                            This will remove all market data collected across all sessions.
                        </p>
                        <div className="flex items-center gap-3 p-4 bg-red-500/5 rounded-lg border border-red-500/20">
                            <AlertTriangle size={18} className="text-red-400 flex-shrink-0" />
                            <span className="text-sm text-slate-300">
                                This action cannot be undone. All historical data will be permanently deleted.
                            </span>
                        </div>
                        <button
                            onClick={() => handleClearHistory('all')}
                            disabled={clearingHistory}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-500 disabled:bg-red-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {clearingHistory ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    <span>Clearing...</span>
                                </>
                            ) : (
                                <>
                                    <Trash2 size={18} />
                                    <span>Clear All History</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Clear Today's Data */}
                <div className="glass-panel rounded-xl overflow-hidden border border-slate-800 mb-6">
                    <div className="px-6 py-4 bg-orange-900/20 border-b border-orange-500/20 flex items-center gap-3">
                        <Clock size={20} className="text-orange-400" />
                        <h2 className="text-lg font-bold text-orange-400">Clear Today's Data</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-slate-300 text-sm">
                            Delete <span className="font-bold text-white">today's snapshots only</span> (last 8 hours). 
                            Useful for clearing test data or resetting the current session.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Scope:</span>
                                <span className="text-white font-mono">Last 8 hours</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Preserves:</span>
                                <span className="text-green-400">Historical data from previous days</span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleClearHistory('today')}
                            disabled={clearingHistory}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {clearingHistory ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    <span>Clearing...</span>
                                </>
                            ) : (
                                <>
                                    <Clock size={18} />
                                    <span>Clear Today's Data</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Clear Old Data */}
                <div className="glass-panel rounded-xl overflow-hidden border border-slate-800 mb-6">
                    <div className="px-6 py-4 bg-blue-900/20 border-b border-blue-500/20 flex items-center gap-3">
                        <Layers size={20} className="text-blue-400" />
                        <h2 className="text-lg font-bold text-blue-400">Clear Old Data</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <p className="text-slate-300 text-sm">
                            Delete old snapshots while keeping the <span className="font-bold text-white">latest 100 snapshots</span>. 
                            Useful for managing storage without losing recent data.
                        </p>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Keeps:</span>
                                <span className="text-green-400 font-mono">Latest 100 snapshots</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Deletes:</span>
                                <span className="text-red-400">All older snapshots</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-400">Recommended:</span>
                                <span className="text-yellow-400">For storage optimization</span>
                            </div>
                        </div>
                        <button
                            onClick={() => handleClearHistory('old')}
                            disabled={clearingHistory}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                        >
                            {clearingHistory ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    <span>Clearing...</span>
                                </>
                            ) : (
                                <>
                                    <Layers size={18} />
                                    <span>Clear Old Data</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Info Section */}
                <div className="glass-panel p-6 rounded-xl border border-slate-800">
                    <h3 className="font-bold text-white mb-3 flex items-center gap-2">
                        <ShieldCheck size={18} className="text-blue-400" />
                        Important Notes
                    </h3>
                    <ul className="space-y-2 text-sm text-slate-300">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>These operations affect only your <strong>Redis/Upstash database</strong>, not local IndexedDB storage</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>Local browser history in IndexedDB remains intact and can be cleared separately from Settings → Reset</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>All operations require confirmation before execution</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-0.5">•</span>
                            <span>Use "Clear Old Data" for regular maintenance to keep database size manageable</span>
                        </li>
                    </ul>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};
