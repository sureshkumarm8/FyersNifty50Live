import React, { useState, useRef } from 'react';
import { FyersCredentials, MarketSnapshot } from '../types';
import { callAI } from '../services/aiProvider';
import { 
  Upload, X, Maximize2, Newspaper, TrendingUp, Activity, Clock, 
  CheckCircle, AlertTriangle, Zap, Target, Save, Loader2, ChevronDown, ChevronUp 
} from 'lucide-react';

interface PreMarketAnalyzerProps {
  credentials: FyersCredentials;
  aiEnabled?: boolean;
  historyLog?: MarketSnapshot[];
}

interface TabData {
  newsAnalysis: string;
  preMarketAnalysis: string;
  liveValidation: string;
  postMarketAnalysis: string;
}

interface Images {
  yesterdayIntraday: string | null;
  yesterdayOI: string | null;
  last5DayChart: string | null;
  multiOI: string | null;
  systemPlan: string | null;
}

const ImageUploadCard = ({ 
  label, 
  imageSrc, 
  onChange, 
  onClick 
}: { 
  label: string; 
  imageSrc: string | null; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick: () => void;
}) => (
  <div className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed transition-all h-28 group overflow-hidden cursor-pointer ${
    imageSrc ? 'border-indigo-500/50 bg-indigo-900/20' : 'border-slate-700 hover:border-indigo-500/30 bg-slate-800'
  }`}>
    {imageSrc && (
      <div className="absolute inset-0 z-0">
        <img src={imageSrc} alt={label} className="w-full h-full object-cover opacity-50 group-hover:opacity-30" />
      </div>
    )}
    <div className="relative z-10 flex flex-col items-center text-center">
      <Upload size={20} className={imageSrc ? 'text-indigo-400' : 'text-slate-500'} />
      <span className={`text-xs font-bold mt-1 ${imageSrc ? 'text-indigo-300' : 'text-slate-400'}`}>{label}</span>
      {imageSrc && <span className="text-[10px] text-emerald-400 mt-1">✓ Ready</span>}
    </div>
    <input 
      type="file" 
      accept="image/*" 
      onChange={onChange} 
      className="absolute inset-0 opacity-0 cursor-pointer" 
    />
    {imageSrc && (
      <button 
        onClick={onClick} 
        className="absolute top-1 right-1 p-1 bg-slate-900/70 rounded hover:bg-slate-700 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
        title="Preview"
      >
        <Maximize2 size={14} />
      </button>
    )}
  </div>
);

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
  
  const [images, setImages] = useState<Images>({
    yesterdayIntraday: null,
    yesterdayOI: null,
    last5DayChart: null,
    multiOI: null,
    systemPlan: null,
  });

  const [analysisData, setAnalysisData] = useState<TabData>({
    newsAnalysis: '',
    preMarketAnalysis: '',
    liveValidation: '',
    postMarketAnalysis: '',
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    news: true,
    premarket: true,
    live: true,
    post: true,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Images) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setImages(prev => ({ ...prev, [field]: result }));
    };
    reader.readAsDataURL(file);
  };

  const analyzeTab = async (tab: 'news' | 'premarket' | 'live' | 'post') => {
    if (isAnalyzing || !aiEnabled) return;
    
    setIsAnalyzing(true);
    try {
      let systemInstruction = '';
      let userContent = '';

      switch (tab) {
        case 'news':
          systemInstruction = `You are a financial news analyst for Indian markets. Analyze the market sentiment from news and provide concise insights about Nifty 50 outlook.`;
          userContent = `Analyze current market news sentiment for Nifty 50. Consider: global cues, FII activity, sectors in focus, macroeconomic data releases. Format: Key news items, Sentiment (Bullish/Bearish/Neutral), Impact on Nifty.`;
          break;

        case 'premarket':
          systemInstruction = `You are a technical analyst. Analyze pre-market charts and data.`;
          userContent = `Based on yesterday's trading:
          - Intraday chart analysis
          - OI data insights
          - Last 5-day trend
          - Multi-OI structure
          
          Provide: Key levels, Support/Resistance, Opening bias prediction, Risk zones.`;
          break;

        case 'live':
          systemInstruction = `You are a live market validator. Check if the pre-market plan is playing out.`;
          userContent = `Market has opened. Validate:
          - Is the planned direction correct?
          - Are key levels holding?
          - Any changes needed to the setup?
          - Immediate action items?`;
          break;

        case 'post':
          systemInstruction = `You are a post-market analyst. Review what happened and lessons learned.`;
          userContent = `After market close, analyze:
          - Did the plan work? Why/why not?
          - What changed from pre-market prediction?
          - Tomorrow's setup based on today's close?`;
          break;
      }

      const responseText = await callAI(credentials, systemInstruction, userContent);
      setAnalysisData(prev => ({
        ...prev,
        [tab === 'news' ? 'newsAnalysis' : tab === 'premarket' ? 'preMarketAnalysis' : tab === 'live' ? 'liveValidation' : 'postMarketAnalysis']: responseText
      }));
    } catch (error: any) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
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
      <div className="flex gap-2 border-b border-slate-700">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-t-lg transition-all ${
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* News Analysis Tab */}
        {activeTab === 'news' && (
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <button
                onClick={() => toggleSection('news')}
                className="flex items-center justify-between w-full mb-3"
              >
                <div className="flex items-center gap-2">
                  <Newspaper size={18} className="text-amber-400" />
                  <span className="font-bold text-slate-200">Market News & Sentiment</span>
                </div>
                {expandedSections.news ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSections.news && (
                <div className="space-y-3">
                  {analysisData.newsAnalysis && (
                    <div className="bg-slate-900 p-3 rounded text-sm text-slate-200 whitespace-pre-wrap">
                      {analysisData.newsAnalysis}
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
            {/* Image Uploads */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <h3 className="font-bold text-slate-200 mb-3 flex items-center gap-2">
                <Upload size={16} /> Chart Data
              </h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <ImageUploadCard
                  label="Yesterday Intraday"
                  imageSrc={images.yesterdayIntraday}
                  onChange={(e) => handleImageUpload(e, 'yesterdayIntraday')}
                  onClick={() => setPreviewImage(images.yesterdayIntraday)}
                />
                <ImageUploadCard
                  label="Yesterday OI"
                  imageSrc={images.yesterdayOI}
                  onChange={(e) => handleImageUpload(e, 'yesterdayOI')}
                  onClick={() => setPreviewImage(images.yesterdayOI)}
                />
                <ImageUploadCard
                  label="Last 5 Days"
                  imageSrc={images.last5DayChart}
                  onChange={(e) => handleImageUpload(e, 'last5DayChart')}
                  onClick={() => setPreviewImage(images.last5DayChart)}
                />
                <ImageUploadCard
                  label="Multi OI"
                  imageSrc={images.multiOI}
                  onChange={(e) => handleImageUpload(e, 'multiOI')}
                  onClick={() => setPreviewImage(images.multiOI)}
                />
              </div>
              <ImageUploadCard
                label="Trading System Plan"
                imageSrc={images.systemPlan}
                onChange={(e) => handleImageUpload(e, 'systemPlan')}
                onClick={() => setPreviewImage(images.systemPlan)}
              />
            </div>

            {/* Analysis */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <button
                onClick={() => toggleSection('premarket')}
                className="flex items-center justify-between w-full mb-3"
              >
                <div className="flex items-center gap-2">
                  <TrendingUp size={18} className="text-blue-400" />
                  <span className="font-bold text-slate-200">Pre-Market Analysis</span>
                </div>
                {expandedSections.premarket ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSections.premarket && (
                <div className="space-y-3">
                  {analysisData.preMarketAnalysis && (
                    <div className="bg-slate-900 p-3 rounded text-sm text-slate-200 whitespace-pre-wrap">
                      {analysisData.preMarketAnalysis}
                    </div>
                  )}
                  <button
                    onClick={() => analyzeTab('premarket')}
                    disabled={isAnalyzing || !images.yesterdayIntraday}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <TrendingUp size={16} />}
                    {isAnalyzing ? 'Analyzing...' : 'Generate Plan'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Live Validation Tab */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <button
                onClick={() => toggleSection('live')}
                className="flex items-center justify-between w-full mb-3"
              >
                <div className="flex items-center gap-2">
                  <Activity size={18} className="text-green-400" />
                  <span className="font-bold text-slate-200">Live Market Validation</span>
                </div>
                {expandedSections.live ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSections.live && (
                <div className="space-y-3">
                  <div className="bg-slate-900 p-3 rounded text-xs text-slate-400">
                    Current Nifty: {historyLog?.[historyLog.length - 1]?.niftyLtp || 'N/A'} | 
                    Change: {historyLog?.[historyLog.length - 1]?.ptsChg || 'N/A'} pts
                  </div>

                  {analysisData.liveValidation && (
                    <div className="bg-slate-900 p-3 rounded text-sm text-slate-200 whitespace-pre-wrap">
                      {analysisData.liveValidation}
                    </div>
                  )}
                  <button
                    onClick={() => analyzeTab('live')}
                    disabled={isAnalyzing}
                    className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                    {isAnalyzing ? 'Validating...' : 'Validate Plan'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Post-Market Tab */}
        {activeTab === 'post' && (
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <button
                onClick={() => toggleSection('post')}
                className="flex items-center justify-between w-full mb-3"
              >
                <div className="flex items-center gap-2">
                  <Clock size={18} className="text-purple-400" />
                  <span className="font-bold text-slate-200">After 1 Hour Analysis</span>
                </div>
                {expandedSections.post ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSections.post && (
                <div className="space-y-3">
                  {analysisData.postMarketAnalysis && (
                    <div className="bg-slate-900 p-3 rounded text-sm text-slate-200 whitespace-pre-wrap">
                      {analysisData.postMarketAnalysis}
                    </div>
                  )}
                  <button
                    onClick={() => analyzeTab('post')}
                    disabled={isAnalyzing}
                    className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Target size={16} />}
                    {isAnalyzing ? 'Analyzing...' : 'Analyze Session'}
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
