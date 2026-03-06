import React, { useState, useRef, useEffect } from 'react';
import { FyersCredentials, MarketSnapshot } from '../types';
import { callAI } from '../services/aiProvider';
import { 
  Upload, X, Maximize2, Newspaper, TrendingUp, Activity, Clock, 
  CheckCircle, AlertTriangle, Zap, Target, Loader2, ChevronDown, ChevronUp, GripHorizontal 
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

interface DragItem {
  id: string;
  type: string;
  data: string | null;
}

const ImageCard = ({ 
  id,
  label, 
  imageSrc, 
  onDragStart,
  onClick 
}: { 
  id: string;
  label: string; 
  imageSrc: string | null; 
  onDragStart: (e: React.DragEvent, id: string) => void;
  onClick: () => void;
}) => (
  <div
    draggable
    onDragStart={(e) => onDragStart(e, id)}
    className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed transition-all h-28 group overflow-hidden cursor-move ${
      imageSrc ? 'border-indigo-500/50 bg-indigo-900/20' : 'border-slate-700 hover:border-indigo-500/30 bg-slate-800'
    }`}
  >
    {imageSrc && (
      <div className="absolute inset-0 z-0">
        <img src={imageSrc} alt={label} className="w-full h-full object-cover opacity-50 group-hover:opacity-30" />
      </div>
    )}
    <div className="relative z-10 flex flex-col items-center text-center">
      <GripHorizontal size={16} className={imageSrc ? 'text-indigo-400' : 'text-slate-500'} />
      <span className={`text-xs font-bold mt-1 ${imageSrc ? 'text-indigo-300' : 'text-slate-400'}`}>{label}</span>
      {imageSrc && <span className="text-[10px] text-emerald-400 mt-1">✓ Ready</span>}
    </div>
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

const DragDropZone = ({ 
  id,
  label, 
  onDrop,
  imageSrc,
  onClick 
}: { 
  id: string;
  label: string; 
  onDrop: (e: React.DragEvent, id: string) => void;
  imageSrc: string | null;
  onClick: () => void;
}) => (
  <div
    onDragOver={(e) => e.preventDefault()}
    onDrop={(e) => onDrop(e, id)}
    className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed transition-all min-h-24 ${
      imageSrc ? 'border-emerald-500/50 bg-emerald-900/20' : 'border-slate-700 hover:border-emerald-500/30 bg-slate-800'
    }`}
  >
    {imageSrc && (
      <div className="absolute inset-0 z-0">
        <img src={imageSrc} alt={label} className="w-full h-full object-cover opacity-50" />
      </div>
    )}
    <div className="relative z-10 flex flex-col items-center text-center">
      <Upload size={20} className={imageSrc ? 'text-emerald-400' : 'text-slate-500'} />
      <span className={`text-xs font-bold mt-1 ${imageSrc ? 'text-emerald-300' : 'text-slate-400'}`}>{label}</span>
      {imageSrc && (
        <button 
          onClick={onClick} 
          className="absolute top-1 right-1 p-1 bg-slate-900/70 rounded hover:bg-slate-700 text-white"
          title="Preview"
        >
          <Maximize2 size={14} />
        </button>
      )}
    </div>
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
  
  const [uploadedImages, setUploadedImages] = useState<{ [key: string]: string | null }>({
    intraday: null,
    oi: null,
    fiveDay: null,
    multiOI: null,
  });

  const [analysisData, setAnalysisData] = useState<TabData>({
    newsAnalysis: '',
    preMarketAnalysis: '',
    liveValidation: [],
    postMarketAnalysis: '',
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    news: true,
    premarket: true,
    live: true,
    post: true,
  });

  const [systemPlan, setSystemPlan] = useState<string>('');
  const [liveCharts, setLiveCharts] = useState<{ chart: string | null; oi: string | null }>({ chart: null, oi: null });
  const [currentValidationNote, setCurrentValidationNote] = useState('');
  const [expandedValidations, setExpandedValidations] = useState<{ [key: string]: boolean }>({});

  // Load system plan from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('tradingSystemProtocol');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setSystemPlan(data.description || 'No system plan saved');
      } catch (e) {
        setSystemPlan('Could not load system plan');
      }
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        // Auto-assign based on filename or let user drag
        setUploadedImages(prev => ({ ...prev, [file.name.split('.')[0]]: result }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ id, data: uploadedImages[id] }));
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const draggedData = e.dataTransfer.getData('text/plain');
    if (!draggedData) return;

    try {
      const { id, data } = JSON.parse(draggedData);
      setUploadedImages(prev => ({
        ...prev,
        [targetId]: data,
        [id]: prev[targetId],
      }));
    } catch (err) {
      console.error('Drag drop error:', err);
    }
  };

  const analyzeTab = async (tab: 'news' | 'premarket' | 'live' | 'post') => {
    if (isAnalyzing || !aiEnabled) return;
    
    setIsAnalyzing(true);
    try {
      let systemInstruction = '';
      let userContent = '';

      switch (tab) {
        case 'news':
          systemInstruction = `You are a financial news analyst for Indian markets. Analyze market sentiment relative to our trading system.
          
          Our Trading System:
          ${systemPlan}
          
          Analyze how current news aligns or conflicts with our system.`;
          userContent = `Analyze current market news sentiment for Nifty 50. Consider: global cues, FII activity, sectors. How does this support/contradict our system plan?`;
          break;

        case 'premarket':
          systemInstruction = `You are a technical analyst. Analyze charts to validate our trading system.
          
          Our System:
          ${systemPlan}
          
          Analyze if today's setup aligns with our system rules.`;
          userContent = `Analyze yesterday's trading and multi-timeframe setup. Key levels, opening bias, risk zones according to our system.`;
          break;

        case 'live':
          systemInstruction = `Validate if market is playing out per our system plan.`;
          userContent = `Market has opened. Is our planned setup working? Key levels holding? Adjustments needed per our system?`;
          break;

        case 'post':
          systemInstruction = `Post-market review against our trading system.`;
          userContent = `Did our system plan work today? Why/why not? Lessons? Tomorrow's setup?`;
          break;
      }

      const responseText = await callAI(credentials, systemInstruction, userContent);
      
      if (tab === 'live') {
        // Add to live validation history
        setAnalysisData(prev => ({
          ...prev,
          liveValidation: [
            ...prev.liveValidation,
            {
              timestamp: new Date().toLocaleTimeString(),
              analysis: responseText,
              chartFile: liveCharts.chart,
              oiFile: liveCharts.oi,
            }
          ]
        }));
        setLiveCharts({ chart: null, oi: null });
        setCurrentValidationNote('');
      } else {
        setAnalysisData(prev => ({
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

  const tabs = [
    { id: 'news', label: 'News Analysis', icon: Newspaper },
    { id: 'premarket', label: 'Pre-Market', icon: TrendingUp },
    { id: 'live', label: 'Live Validation', icon: Activity },
    { id: 'post', label: 'Post-Market', icon: Clock },
  ] as const;

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-hidden">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 overflow-x-auto">
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
                  <span className="font-bold text-slate-200">System-Aligned News Sentiment</span>
                </div>
                {expandedSections.news ? <ChevronUp /> : <ChevronDown />}
              </button>

              {expandedSections.news && (
                <div className="space-y-3">
                  <div className="bg-slate-900 p-3 rounded text-xs text-slate-300">
                    <strong>System Plan Summary:</strong>
                    <p className="mt-1 italic truncate">{systemPlan}</p>
                  </div>
                  
                  {analysisData.newsAnalysis && (
                    <div className="bg-slate-900 p-3 rounded text-sm text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
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
            {/* Bulk Upload */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <h3 className="font-bold text-slate-200 mb-3">📤 Upload All Charts & Drag to Position</h3>
              <label className="block w-full p-4 border-2 border-dashed border-slate-600 rounded-lg hover:border-slate-400 cursor-pointer transition">
                <div className="text-center">
                  <Upload size={24} className="mx-auto mb-2 text-slate-400" />
                  <span className="text-sm text-slate-300">Click to upload all chart images</span>
                </div>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  className="hidden" 
                />
              </label>
            </div>

            {/* Drag & Drop Zones */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
              <h3 className="font-bold text-slate-200">Drop images to correct position</h3>
              <div className="grid grid-cols-2 gap-3">
                <DragDropZone
                  id="intraday"
                  label="Yesterday Intraday"
                  onDrop={handleDrop}
                  imageSrc={uploadedImages.intraday}
                  onClick={() => setPreviewImage(uploadedImages.intraday)}
                />
                <DragDropZone
                  id="oi"
                  label="Yesterday OI"
                  onDrop={handleDrop}
                  imageSrc={uploadedImages.oi}
                  onClick={() => setPreviewImage(uploadedImages.oi)}
                />
                <DragDropZone
                  id="fiveDay"
                  label="Last 5 Days"
                  onDrop={handleDrop}
                  imageSrc={uploadedImages.fiveDay}
                  onClick={() => setPreviewImage(uploadedImages.fiveDay)}
                />
                <DragDropZone
                  id="multiOI"
                  label="Multi OI"
                  onDrop={handleDrop}
                  imageSrc={uploadedImages.multiOI}
                  onClick={() => setPreviewImage(uploadedImages.multiOI)}
                />
              </div>
            </div>

            {/* System Plan Display */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
              <h3 className="font-bold text-slate-200 mb-2">📋 Your Trading System</h3>
              <div className="bg-slate-900 p-3 rounded text-sm text-slate-300 max-h-24 overflow-y-auto italic">
                {systemPlan || 'No system plan configured in Settings > My System'}
              </div>
            </div>

            {/* Analysis */}
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
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
                  {analysisData.preMarketAnalysis && (
                    <div className="bg-slate-900 p-3 rounded text-sm text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {analysisData.preMarketAnalysis}
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
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 space-y-3">
              <h3 className="font-bold text-slate-200 mb-2">📊 Upload Live Charts for Validation</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Nifty 1-min Chart</label>
                  <label className="block w-full p-2 border-2 border-dashed border-slate-600 rounded-lg hover:border-slate-400 cursor-pointer transition text-center">
                    <Upload size={16} className="mx-auto mb-1 text-slate-400" />
                    <span className="text-xs text-slate-300">Upload 1-min</span>
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
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Sensibull OI</label>
                  <label className="block w-full p-2 border-2 border-dashed border-slate-600 rounded-lg hover:border-slate-400 cursor-pointer transition text-center">
                    <Upload size={16} className="mx-auto mb-1 text-slate-400" />
                    <span className="text-xs text-slate-300">Upload OI</span>
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
                </div>
              </div>

              <textarea
                value={currentValidationNote}
                onChange={(e) => setCurrentValidationNote(e.target.value)}
                placeholder="Add notes about market conditions (optional)"
                className="w-full p-2 bg-slate-900 border border-slate-700 rounded text-sm text-slate-200 h-16"
              />

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
            {analysisData.liveValidation.length > 0 && (
              <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                <h3 className="font-bold text-slate-200 mb-3">📋 Validation History</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {analysisData.liveValidation.map((validation, idx) => (
                    <div key={idx} className="bg-slate-900 p-3 rounded border border-slate-700">
                      <button
                        onClick={() => toggleValidation(validation.timestamp)}
                        className="flex items-center justify-between w-full"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-slate-500">{validation.timestamp}</span>
                          <span className="text-xs text-emerald-400">✓ Validation</span>
                        </div>
                        {expandedValidations[validation.timestamp] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {expandedValidations[validation.timestamp] && (
                        <div className="mt-2 space-y-2 text-xs text-slate-300">
                          <p className="whitespace-pre-wrap">{validation.analysis}</p>
                          {validation.chartFile && (
                            <button
                              onClick={() => setPreviewImage(validation.chartFile)}
                              className="text-blue-400 hover:text-blue-300"
                            >
                              View 1-min Chart
                            </button>
                          )}
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
            <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
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
                  {analysisData.postMarketAnalysis && (
                    <div className="bg-slate-900 p-3 rounded text-sm text-slate-200 whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {analysisData.postMarketAnalysis}
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
