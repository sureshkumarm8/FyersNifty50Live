import React, { useState, useRef, useEffect } from 'react';
import { FyersCredentials, MarketSnapshot } from '../types';
import { callAI } from '../services/aiProvider';
import { 
  Upload, X, Maximize2, Newspaper, TrendingUp, Activity, Clock, 
  CheckCircle, AlertTriangle, Zap, Target, Loader2, ChevronDown, ChevronUp,
  RotateCcw, TrendingUpIcon, Flame, Sparkles, ArrowUp, ArrowDown, Minus
} from 'lucide-react';

interface PreMarketAnalyzerProps {
  credentials: FyersCredentials;
  aiEnabled?: boolean;
  historyLog?: MarketSnapshot[];
}

interface TabData {
  newsAnalysis: string;
  preMarketAnalysis: string;
  liveValidation: { timestamp: string; analysis: string; chartFile: string | null; oiFile: string | null }[];
  postMarketAnalysis: string;
}

interface TradingSystemProtocol {
  name: string;
  description: string;
  tags?: string[];
  rules?: { rule: string; description: string }[];
}

const SentimentParser = ({ text }: { text: string }) => {
  // Clean text by removing markdown and unwanted symbols
  const cleanText = text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/<current_datetime>[^<]*<\/current_datetime>/g, '') // Remove datetime tags
    .replace(/#{1,6}\s+/g, '') // Remove markdown headers
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/\*\*/g, '') // Remove bold markers
    .replace(/^\s*[-•*]\s+/gm, '• ') // Normalize bullet points
    .replace(/\n\n+/g, '\n') // Remove excessive newlines
    .split('\n')
    .filter(line => line.trim() && !line.includes('current_datetime'))
    .map(line => line.trim());

  const sentiments = ['Bullish', 'Bearish', 'Neutral'];
  
  const getSentimentColor = (text: string) => {
    if (text.includes('Bullish')) return 'bg-emerald-900/30 border-emerald-500/50 text-emerald-300';
    if (text.includes('Bearish')) return 'bg-red-900/30 border-red-500/50 text-red-300';
    if (text.includes('Neutral')) return 'bg-amber-900/30 border-amber-500/50 text-amber-300';
    return 'bg-slate-900/30 border-slate-500/50 text-slate-300';
  };

  const getSentimentIcon = (text: string) => {
    if (text.includes('Bullish')) return <ArrowUp className="text-emerald-400" size={18} />;
    if (text.includes('Bearish')) return <ArrowDown className="text-red-400" size={18} />;
    return <Minus className="text-amber-400" size={18} />;
  };

  return (
    <div className="space-y-3">
      {cleanText.map((line, idx) => {
        if (!line.trim()) return null;
        
        const isSentiment = sentiments.some(s => line.includes(s)) && (line.includes('Bullish') || line.includes('Bearish') || line.includes('Neutral'));
        const isBullet = line.startsWith('•');
        const isRating = line.includes('Rating:') || line.includes('/10');
        
        return (
          <div key={idx}>
            {isRating ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-900/20 border border-amber-500/30 mt-3">
                <Flame size={16} className="text-amber-400" />
                <span className="text-sm text-amber-300 font-bold">{line}</span>
              </div>
            ) : isSentiment ? (
              <div className={`flex items-center gap-3 p-3 rounded-lg border font-bold ${getSentimentColor(line)}`}>
                {getSentimentIcon(line)}
                <span className="text-sm">{line}</span>
              </div>
            ) : isBullet ? (
              <div className="flex items-start gap-2 text-slate-300 text-sm ml-2">
                <span className="text-slate-500 font-bold">•</span>
                <span className="leading-relaxed">{line.substring(2)}</span>
              </div>
            ) : (
              <p className="text-slate-300 text-sm leading-relaxed pl-2">{line}</p>
            )}
          </div>
        );
      })}
    </div>
  );
};

const ImageModal = ({ src, onClose }: { src: string | null; onClose: () => void }) => {
  if (!src) return null;
  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 backdrop-blur-md"
      onClick={onClose}
    >
      <button 
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full text-white hover:bg-slate-700"
      >
        <X size={24} />
      </button>
      <img 
        src={src} 
        className="max-w-full max-h-[90vh] rounded-lg shadow-2xl border border-slate-700 object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export const PreMarketAnalyzer: React.FC<PreMarketAnalyzerProps> = ({ 
  credentials, 
  aiEnabled = true,
  historyLog 
}) => {
  const [activeTab, setActiveTab] = useState<'news' | 'premarket' | 'live' | 'post'>('news');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [tabData, setTabData] = useState<TabData>({
    newsAnalysis: '',
    preMarketAnalysis: '',
    liveValidation: [],
    postMarketAnalysis: '',
  });

  const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string | null }>({
    intraday: null,
    oi: null,
    fiveDay: null,
    multiOI: null,
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    news: true,
    premarket: true,
    live: true,
    post: true,
  });

  const [systemPlan, setSystemPlan] = useState<TradingSystemProtocol | null>(null);
  const [liveCharts, setLiveCharts] = useState<{ chart: string | null; oi: string | null }>({ chart: null, oi: null });
  const [expandedValidations, setExpandedValidations] = useState<{ [key: string]: boolean }>({});
  const [uploadProgress, setUploadProgress] = useState(0);

  // Load from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('preMarketAnalyzerData');
    const savedImages = localStorage.getItem('preMarketImages');
    
    if (savedData) {
      try {
        setTabData(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to load tab data:', e);
      }
    }
    
    if (savedImages) {
      try {
        setUploadedImages(JSON.parse(savedImages));
      } catch (e) {
        console.error('Failed to load images:', e);
      }
    }

    // Load system plan
    const savedProtocol = localStorage.getItem('user_trading_protocol');
    if (savedProtocol) {
      try {
        const protocol = JSON.parse(savedProtocol);
        setSystemPlan(protocol);
      } catch (e) {
        console.error('Failed to load system plan:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('preMarketAnalyzerData', JSON.stringify(tabData));
  }, [tabData]);

  useEffect(() => {
    localStorage.setItem('preMarketImages', JSON.stringify(uploadedImages));
  }, [uploadedImages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const totalFiles = files.length;
    let processed = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const filename = file.name.split('.')[0].toLowerCase();
        
        // Map common filenames to zones
        let zone = filename;
        if (filename.includes('intraday') || filename.includes('1h') || filename.includes('hourly')) zone = 'intraday';
        else if (filename.includes('oi') || filename.includes('open')) zone = 'oi';
        else if (filename.includes('5day') || filename.includes('5d') || filename.includes('week')) zone = 'fiveDay';
        else if (filename.includes('multi') || filename.includes('oi')) zone = 'multiOI';
        
        setUploadedImages(prev => ({ 
          ...prev, 
          [zone]: result 
        }));
        
        processed++;
        setUploadProgress((processed / totalFiles) * 100);
        
        if (processed === totalFiles) {
          setTimeout(() => setUploadProgress(0), 1000);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Try to get dragged data from our custom data transfer
    const draggedData = e.dataTransfer.getData('application/json');
    if (!draggedData) return;

    try {
      const { sourceId, imageData } = JSON.parse(draggedData);
      // Swap the images
      setUploadedImages(prev => {
        const temp = prev[targetId];
        return {
          ...prev,
          [targetId]: prev[sourceId],
          [sourceId]: temp,
        };
      });
    } catch (err) {
      console.error('Drag drop error:', err);
    }
  };

  const handleDragStart = (e: React.DragEvent, sourceId: string) => {
    const imageData = uploadedImages[sourceId];
    if (!imageData) return;
    
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify({ 
      sourceId, 
      imageData 
    }));
  };

  const analyzeTab = async (tab: 'news' | 'premarket' | 'live' | 'post') => {
    if (isAnalyzing || !aiEnabled) return;
    
    setIsAnalyzing(true);
    try {
      let systemInstruction = '';
      let userContent = '';

      const systemDesc = systemPlan ? `${systemPlan.name}: ${systemPlan.description}` : 'No system defined';

      switch (tab) {
        case 'news':
          systemInstruction = `You are a financial news analyst for Indian markets. Analyze market sentiment relative to this trading system:
          
          ${systemDesc}
          
          Provide a concise, structured analysis. Format with clear sections and sentiment indicators.`;
          userContent = `Analyze current market news sentiment for Nifty 50. Consider: global cues, FII activity, sectors, macroeconomic data. Rate as Bullish/Bearish/Neutral and explain impact on our system. Keep it short and actionable.`;
          break;

        case 'premarket':
          systemInstruction = `You are a technical analyst validating charts against this trading system:
          
          ${systemDesc}`;
          userContent = `Analyze yesterday's trading: intraday chart pattern, OI structure, 5-day trend, multi-strike levels. Provide entry bias, key S/R levels, risk zones according to our system.`;
          break;

        case 'live':
          systemInstruction = `Validate if market is playing out per the system plan: ${systemDesc}`;
          userContent = `Market is live. Is our setup working? Key levels holding? Adjustments needed? Format with clear sections.`;
          break;

        case 'post':
          systemInstruction = `Post-market analysis against the system: ${systemDesc}`;
          userContent = `Did our system work today? Why/why not? Key learnings? Tomorrow's bias based on close?`;
          break;
      }

      const responseText = await callAI(credentials, systemInstruction, userContent);
      
      if (tab === 'live') {
        setTabData(prev => ({
          ...prev,
          liveValidation: [
            ...prev.liveValidation,
            {
              timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
              analysis: responseText,
              chartFile: liveCharts.chart,
              oiFile: liveCharts.oi,
            }
          ]
        }));
        setLiveCharts({ chart: null, oi: null });
      } else {
        setTabData(prev => ({
          ...prev,
          [tab === 'news' ? 'newsAnalysis' : tab === 'premarket' ? 'preMarketAnalysis' : 'postMarketAnalysis']: responseText
        }));
      }
    } catch (error: any) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const toggleValidation = (timestamp: string) => {
    setExpandedValidations(prev => ({ ...prev, [timestamp]: !prev[timestamp] }));
  };

  const resetTab = () => {
    switch (activeTab) {
      case 'news':
        setTabData(prev => ({ ...prev, newsAnalysis: '' }));
        break;
      case 'premarket':
        setUploadedImages({ intraday: null, oi: null, fiveDay: null, multiOI: null });
        setTabData(prev => ({ ...prev, preMarketAnalysis: '' }));
        break;
      case 'live':
        setTabData(prev => ({ ...prev, liveValidation: [] }));
        setLiveCharts({ chart: null, oi: null });
        break;
      case 'post':
        setTabData(prev => ({ ...prev, postMarketAnalysis: '' }));
        break;
    }
  };

  const tabs = [
    { id: 'news', label: 'News Analysis', icon: Newspaper },
    { id: 'premarket', label: 'Pre-Market', icon: TrendingUp },
    { id: 'live', label: 'Live Validation', icon: Activity },
    { id: 'post', label: 'Post-Market', icon: Clock },
  ] as const;

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 overflow-x-auto items-end justify-between">
        <div className="flex gap-2 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-t-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        
        <button
          onClick={resetTab}
          className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-red-400 hover:text-red-300 transition-colors"
          title="Clear this tab"
        >
          <RotateCcw size={14} /> Reset
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* News Analysis Tab */}
        {activeTab === 'news' && (
          <div className="space-y-4">
            {/* System Info Card */}
            {systemPlan && (
              <div className="bg-gradient-to-r from-amber-900/30 to-orange-900/30 p-5 rounded-lg border border-amber-500/30 backdrop-blur-sm">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-amber-500/20 rounded-lg">
                    <Flame size={20} className="text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-300 text-sm">{systemPlan.name}</h3>
                    <p className="text-slate-300 text-xs mt-1 leading-relaxed">{systemPlan.description}</p>
                    {systemPlan.tags && systemPlan.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {systemPlan.tags.map((tag, i) => (
                          <span key={i} className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded-full border border-amber-500/30">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Main Analysis Card - Full Width */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Newspaper size={18} className="text-amber-400" />
                  <span className="font-bold text-slate-200">Market Sentiment Analysis</span>
                </div>
                {expandedSections.news ? <ChevronUp /> : <ChevronDown />}
              </div>

              {expandedSections.news && (
                <div className="space-y-4">
                  {tabData.newsAnalysis ? (
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 max-h-96 overflow-y-auto">
                      <SentimentParser text={tabData.newsAnalysis} />
                    </div>
                  ) : (
                    <div className="text-slate-400 text-sm text-center py-8">
                      Click "Analyze News" to generate sentiment analysis
                    </div>
                  )}
                  <button
                    onClick={() => analyzeTab('news')}
                    disabled={isAnalyzing}
                    className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze News'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pre-Market Tab */}
        {activeTab === 'premarket' && (
          <div className="space-y-4">
            {/* Bulk Upload */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
              <h3 className="font-bold text-slate-200 mb-3 flex items-center gap-2">
                <Upload size={16} /> Upload All Charts
              </h3>
              <label className="block w-full p-8 border-2 border-dashed border-indigo-600/50 rounded-lg hover:border-indigo-400 cursor-pointer transition bg-indigo-900/10">
                <div className="text-center">
                  <Sparkles size={32} className="mx-auto mb-3 text-indigo-400" />
                  <span className="text-sm text-slate-300 font-bold block">Click or drag files to upload</span>
                  <span className="text-xs text-slate-400 block mt-2">Upload multiple chart images at once</span>
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </label>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-3 bg-slate-900 rounded-full h-2">
                  <div 
                    className="bg-indigo-500 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              {uploadProgress === 100 && (
                <div className="mt-3 text-xs text-emerald-400 font-bold">✓ Images uploaded successfully</div>
              )}
            </div>

            {/* Uploaded Images Preview */}
            {Object.values(uploadedImages).some(img => img) && (
              <div className="bg-slate-800 p-5 rounded-lg border border-emerald-500/30">
                <h3 className="font-bold text-emerald-300 mb-3">✓ Uploaded Images - Click to preview, drag to reorder</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'intraday', label: '📊 Yesterday Intraday' },
                    { id: 'oi', label: '📈 Yesterday OI' },
                    { id: 'fiveDay', label: '📉 Last 5 Days' },
                    { id: 'multiOI', label: '🎯 Multi OI' },
                  ].map(zone => 
                    uploadedImages[zone.id] ? (
                      <div
                        key={zone.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, zone.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, zone.id)}
                        className="relative group rounded-lg overflow-hidden border-2 border-emerald-500/50 bg-emerald-900/20 cursor-move h-40 transition-all hover:border-emerald-400"
                      >
                        <img 
                          src={uploadedImages[zone.id]!} 
                          alt={zone.label} 
                          className="w-full h-full object-cover opacity-75 group-hover:opacity-100 transition-opacity"
                          onClick={() => setPreviewImage(uploadedImages[zone.id])}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Maximize2 size={28} className="text-white mb-2" />
                          <span className="text-white text-xs font-bold">Click to preview</span>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/90 p-2 text-xs text-emerald-300 font-bold border-t border-emerald-500/30">
                          {zone.label}
                        </div>
                      </div>
                    ) : (
                      <div
                        key={zone.id}
                        className="relative rounded-lg border-2 border-dashed border-slate-600 bg-slate-900/30 h-40 flex items-center justify-center cursor-default"
                      >
                        <div className="text-center">
                          <span className="text-slate-400 text-xs font-bold block">{zone.label}</span>
                          <span className="text-slate-500 text-[10px] mt-1 block">Upload image</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Drag & Drop Zones - Optional Reordering */}
            {Object.values(uploadedImages).some(img => img) && (
              <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                <h3 className="font-bold text-slate-200 text-sm mb-3">📍 Drag images to reorder zones</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'intraday', label: '📊 Yesterday Intraday' },
                    { id: 'oi', label: '📈 Yesterday OI' },
                    { id: 'fiveDay', label: '📉 Last 5 Days' },
                    { id: 'multiOI', label: '🎯 Multi OI' },
                  ].map(zone => (
                    <div
                      key={zone.id}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.add('border-indigo-400', 'bg-indigo-900/20');
                      }}
                      onDragLeave={(e) => {
                        e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-900/20');
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.currentTarget.classList.remove('border-indigo-400', 'bg-indigo-900/20');
                        handleDrop(e, zone.id);
                      }}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-lg border-2 border-dashed transition-all min-h-24 cursor-default ${
                        uploadedImages[zone.id] 
                          ? 'border-emerald-500/50 bg-emerald-900/20' 
                          : 'border-slate-600 bg-slate-900/30'
                      }`}
                    >
                      <span className="text-sm font-bold text-slate-200">{zone.label}</span>
                      {uploadedImages[zone.id] ? (
                        <>
                          <span className="text-[10px] text-emerald-400 mt-1 font-bold">✓ Assigned</span>
                          <span className="text-[10px] text-slate-400 mt-2">Drag to swap</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-slate-400 mt-1">Drag image here</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Plan Display */}
            {systemPlan && (
              <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 p-5 rounded-lg border border-blue-500/30 backdrop-blur-sm">
                <h3 className="font-bold text-blue-300 mb-2 flex items-center gap-2">
                  <Sparkles size={16} /> Your System Rules
                </h3>
                <p className="text-slate-300 text-xs mb-3 italic">{systemPlan.description}</p>
                {systemPlan.rules && systemPlan.rules.length > 0 && (
                  <div className="space-y-2">
                    {systemPlan.rules.slice(0, 3).map((rule, i) => (
                      <div key={i} className="flex gap-2 text-xs">
                        <span className="text-blue-400 font-bold">•</span>
                        <span className="text-slate-300">{rule.rule}</span>
                      </div>
                    ))}
                    {systemPlan.rules.length > 3 && (
                      <span className="text-xs text-slate-400">+{systemPlan.rules.length - 3} more rules</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Analysis */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
              <button
                onClick={() => toggleSection('premarket')}
                className="flex items-center justify-between w-full mb-3"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-400" />
                  <span className="font-bold text-slate-200">System Analysis</span>
                </div>
                {expandedSections.premarket ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSections.premarket && (
                <div className="space-y-3">
                  {tabData.preMarketAnalysis && (
                    <div className="bg-slate-900 p-4 rounded text-sm text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto border border-slate-700">
                      {tabData.preMarketAnalysis}
                    </div>
                  )}
                  <button
                    onClick={() => analyzeTab('premarket')}
                    disabled={isAnalyzing || !uploadedImages.intraday}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <TrendingUp size={16} />}
                    {isAnalyzing ? 'Analyzing...' : 'Generate System Plan'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Validation Tab */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {/* Chart Upload for Validation */}
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700 space-y-3">
              <h3 className="font-bold text-slate-200 mb-2">📊 Upload Live Charts for Validation</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Nifty 1-min Chart</label>
                  <label className="block w-full p-4 border-2 border-dashed border-slate-600 rounded-lg hover:border-green-500/50 cursor-pointer transition text-center bg-slate-900/30">
                    <Upload size={20} className="mx-auto mb-1 text-slate-400" />
                    <span className="text-xs text-slate-300">Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => setLiveCharts(prev => ({ ...prev, chart: evt.target?.result as string }));
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden" 
                    />
                  </label>
                  {liveCharts.chart && <span className="text-xs text-emerald-400 mt-1 block font-bold">✓ Ready</span>}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">Sensibull OI</label>
                  <label className="block w-full p-4 border-2 border-dashed border-slate-600 rounded-lg hover:border-green-500/50 cursor-pointer transition text-center bg-slate-900/30">
                    <Upload size={20} className="mx-auto mb-1 text-slate-400" />
                    <span className="text-xs text-slate-300">Upload</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => setLiveCharts(prev => ({ ...prev, oi: evt.target?.result as string }));
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden" 
                    />
                  </label>
                  {liveCharts.oi && <span className="text-xs text-emerald-400 mt-1 block font-bold">✓ Ready</span>}
                </div>
              </div>

              <button
                onClick={() => analyzeTab('live')}
                disabled={isAnalyzing}
                className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
              >
                {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                {isAnalyzing ? 'Validating...' : 'Add Validation Check'}
              </button>
            </div>

            {/* Validation History */}
            {tabData.liveValidation.length > 0 && (
              <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
                <h3 className="font-bold text-slate-200 mb-3 flex items-center gap-2">
                  <Activity size={16} /> Validation Checks ({tabData.liveValidation.length})
                </h3>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {tabData.liveValidation.map((validation, idx) => (
                    <div key={idx} className="bg-slate-900 p-3 rounded border border-slate-700 hover:border-slate-600 transition">
                      <button
                        onClick={() => toggleValidation(validation.timestamp)}
                        className="flex items-center justify-between w-full"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500 bg-slate-800 px-2 py-1 rounded">{validation.timestamp}</span>
                          <span className="text-xs text-emerald-400 font-bold">✓ Check #{idx + 1}</span>
                        </div>
                        {expandedValidations[validation.timestamp] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {expandedValidations[validation.timestamp] && (
                        <div className="mt-3 space-y-2 text-xs text-slate-300 pt-3 border-t border-slate-700">
                          <p className="whitespace-pre-wrap">{validation.analysis}</p>
                          <div className="flex gap-2 pt-2">
                            {validation.chartFile && (
                              <button
                                onClick={() => setPreviewImage(validation.chartFile)}
                                className="px-2 py-1 text-blue-400 hover:text-blue-300 bg-slate-800 rounded text-xs"
                              >
                                View 1-min Chart
                              </button>
                            )}
                            {validation.oiFile && (
                              <button
                                onClick={() => setPreviewImage(validation.oiFile)}
                                className="px-2 py-1 text-blue-400 hover:text-blue-300 bg-slate-800 rounded text-xs"
                              >
                                View OI
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Post-Market Tab */}
        {activeTab === 'post' && (
          <div className="space-y-4">
            <div className="bg-slate-800 p-5 rounded-lg border border-slate-700">
              <button
                onClick={() => toggleSection('post')}
                className="flex items-center justify-between w-full mb-3"
              >
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-purple-400" />
                  <span className="font-bold text-slate-200">Session Review</span>
                </div>
                {expandedSections.post ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSections.post && (
                <div className="space-y-3">
                  {tabData.postMarketAnalysis && (
                    <div className="bg-slate-900 p-4 rounded text-sm text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto border border-slate-700">
                      {tabData.postMarketAnalysis}
                    </div>
                  )}
                  <button
                    onClick={() => analyzeTab('post')}
                    disabled={isAnalyzing}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Target size={16} />}
                    {isAnalyzing ? 'Analyzing...' : 'Review Session'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      <ImageModal src={previewImage} onClose={() => setPreviewImage(null)} />
    </div>
  );
};
