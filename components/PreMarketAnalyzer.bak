import React, { useState, useEffect } from 'react';
import { FyersCredentials, MarketSnapshot } from '../types';
import { callAI } from '../services/aiProvider';
import { Upload, X, Newspaper, TrendingUp, Activity, Clock, Loader2, ChevronDown, ChevronUp, RotateCcw, Zap } from 'lucide-react';

interface PreMarketAnalyzerProps {
  credentials: FyersCredentials;
  aiEnabled?: boolean;
  historyLog?: MarketSnapshot[];
}

export const PreMarketAnalyzer: React.FC<PreMarketAnalyzerProps> = ({ credentials, aiEnabled = true }) => {
  const [activeTab, setActiveTab] = useState<'news' | 'premarket' | 'live' | 'post'>('news');
  const [newsAnalysis, setNewsAnalysis] = useState('');
  const [preMarketAnalysis, setPreMarketAnalysis] = useState('');
  const [postAnalysis, setPostAnalysis] = useState('');
  const [liveChecks, setLiveChecks] = useState<{ time: string; text: string }[]>([]);
  
  const [uploadedImages, setUploadedImages] = useState<Record<string, string | null>>({
    intraday: null,
    oi: null,
    fiveDay: null,
    multiOI: null,
  });

  const [pendingImages, setPendingImages] = useState<{ name: string; data: string }[]>([]);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [expandedLive, setExpandedLive] = useState<Record<number, boolean>>({});
  const [draggedImage, setDraggedImage] = useState<{ name: string; data: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('preMarketData');
    if (saved) {
      const data = JSON.parse(saved);
      setNewsAnalysis(data.newsAnalysis || '');
      setPreMarketAnalysis(data.preMarketAnalysis || '');
      setPostAnalysis(data.postAnalysis || '');
      setLiveChecks(data.liveChecks || []);
      setUploadedImages(data.uploadedImages || {});
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('preMarketData', JSON.stringify({
      newsAnalysis, preMarketAnalysis, postAnalysis, liveChecks, uploadedImages,
    }));
  }, [newsAnalysis, preMarketAnalysis, postAnalysis, liveChecks, uploadedImages]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let processed = 0;
    const totalFiles = files.length;
    const newImages: { name: string; data: string }[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        processed++;
        return;
      }

      const reader = new FileReader();
      reader.onload = (evt) => {
        const result = evt.target?.result as string;
        newImages.push({ name: file.name, data: result });
        processed++;
        setUploadProgress(Math.round((processed / totalFiles) * 100));

        if (processed === totalFiles) {
          setPendingImages(prev => [...prev, ...newImages]);
          setTimeout(() => setUploadProgress(0), 500);
        }
      };

      reader.onerror = () => {
        console.error(`Failed to read file: ${file.name}`);
        processed++;
      };

      reader.readAsDataURL(file);
    });
  };

  const assignImageToZone = (imageName: string, imageData: string, zoneId: string) => {
    setUploadedImages(prev => ({ ...prev, [zoneId]: imageData }));
    setPendingImages(prev => prev.filter(img => img.name !== imageName));
  };

  const removePendingImage = (imageName: string) => {
    setPendingImages(prev => prev.filter(img => img.name !== imageName));
  };

  const analyzeTab = async () => {
    if (isAnalyzing || !aiEnabled) return;
    setIsAnalyzing(true);

    try {
      let system = '';
      let prompt = '';

      switch (activeTab) {
        case 'news':
          system = 'You are a financial analyst. Analyze market sentiment for Nifty 50. Format clearly with Bullish/Bearish/Neutral. Keep it SHORT and actionable.';
          prompt = 'Current market sentiment for Nifty 50 considering: FII activity, global cues, sectors, macro data. Rate and impact.';
          break;
        case 'premarket':
          system = 'You are a technical analyst. Analyze yesterday trading data. Format clearly with entry bias, key levels, risk zones. KEEP IT SHORT.';
          prompt = `Analyze: yesterday intraday chart, OI structure, 5-day trend, multi-strike levels. Provide entry bias and key S/R levels. SHORT analysis.`;
          break;
        case 'live':
          system = 'Validate if market is working as planned. Format clearly. KEEP IT SHORT.';
          prompt = 'Is market playing per plan? Key levels holding? Adjustments needed? SHORT response.';
          break;
        case 'post':
          system = 'Post-market review. Did system work? Why/why not? Tomorrow bias? KEEP IT SHORT.';
          prompt = 'Session review: Did system work today? Key learnings? Tomorrow bias based on close? SHORT.';
          break;
      }

      const response = await callAI(credentials, system, prompt);

      if (activeTab === 'news') setNewsAnalysis(response);
      else if (activeTab === 'premarket') setPreMarketAnalysis(response);
      else if (activeTab === 'post') setPostAnalysis(response);
      else if (activeTab === 'live') {
        setLiveChecks(prev => [...prev, {
          time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          text: response,
        }]);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetTab = () => {
    if (activeTab === 'news') setNewsAnalysis('');
    else if (activeTab === 'premarket') {
      setPreMarketAnalysis('');
      setUploadedImages({ intraday: null, oi: null, fiveDay: null, multiOI: null });
    } else if (activeTab === 'live') setLiveChecks([]);
    else if (activeTab === 'post') setPostAnalysis('');
  };

  const zones = [
    { id: 'intraday', label: '📊 Yesterday 1H Chart' },
    { id: 'oi', label: '📈 Yesterday OI' },
    { id: 'fiveDay', label: '📉 5-Day Chart' },
    { id: 'multiOI', label: '🎯 Multi Strike OI' },
  ];

  return (
    <div className="flex flex-col h-full gap-4 p-4 overflow-hidden bg-slate-900">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700 justify-between items-end">
        <div className="flex gap-2">
          {[
            { id: 'news', label: 'News', icon: Newspaper },
            { id: 'premarket', label: 'Pre-Market', icon: TrendingUp },
            { id: 'live', label: 'Live', icon: Activity },
            { id: 'post', label: 'Post', icon: Clock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 py-2 text-sm font-bold rounded-t flex items-center gap-1 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={resetTab}
          className="text-red-400 hover:text-red-300 text-xs font-bold flex items-center gap-1 px-2"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="space-y-3">
            {newsAnalysis && (
              <div className="bg-slate-800 p-4 rounded border border-slate-700 text-sm text-slate-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {newsAnalysis}
              </div>
            )}
            <button
              onClick={analyzeTab}
              disabled={isAnalyzing}
              className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />}
              {isAnalyzing ? 'Analyzing...' : 'Analyze News'}
            </button>
          </div>
        )}

        {/* Pre-Market Tab */}
        {activeTab === 'premarket' && (
          <div className="space-y-3">
            {/* Upload */}
            <div className="bg-slate-800 p-4 rounded border border-slate-700">
              <label className="block w-full p-6 border-2 border-dashed border-blue-500/50 rounded cursor-pointer hover:border-blue-400 bg-blue-900/10 text-center">
                <div className="text-slate-300 text-sm font-bold">📤 Click or drag screenshots</div>
                <div className="text-xs text-slate-400">All Mac screenshots accepted</div>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-2 bg-slate-700 h-2 rounded overflow-hidden">
                  <div className="bg-blue-500 h-full transition-all" style={{ width: `${uploadProgress}%` }} />
                </div>
              )}
            </div>

            {/* Pending Images - Drag to assign */}
            {pendingImages.length > 0 && (
              <div className="bg-slate-800 p-4 rounded border border-amber-500/50">
                <div className="text-xs font-bold text-amber-300 mb-3">📸 Screenshots uploaded - Drag to assign to zones below</div>
                <div className="flex gap-2 flex-wrap">
                  {pendingImages.map(img => (
                    <div
                      key={img.name}
                      draggable
                      onDragStart={() => setDraggedImage(img)}
                      className="relative group h-16 w-16 rounded border-2 border-amber-500 bg-amber-900/20 cursor-move overflow-hidden hover:border-amber-400"
                      title={img.name}
                    >
                      <img src={img.data} alt={img.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePendingImage(img.name)}
                        className="absolute top-0 right-0 bg-red-600 text-white p-0.5 rounded-bl text-xs opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Zone Grid - Drop to assign */}
            <div className="bg-slate-800 p-4 rounded border border-slate-700">
              <div className="text-xs font-bold text-slate-300 mb-3">🎯 Drag screenshots here to assign</div>
              <div className="grid grid-cols-2 gap-2">
                {zones.map(zone => (
                  <div
                    key={zone.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('border-emerald-400', 'bg-emerald-900/30');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-900/30');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('border-emerald-400', 'bg-emerald-900/30');
                      if (draggedImage) {
                        assignImageToZone(draggedImage.name, draggedImage.data, zone.id);
                        setDraggedImage(null);
                      }
                    }}
                    className={`relative h-24 rounded border-2 overflow-hidden cursor-pointer transition ${
                      uploadedImages[zone.id]
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-slate-600 bg-slate-900 hover:border-emerald-400'
                    }`}
                    onClick={() => uploadedImages[zone.id] && setPreviewImage(uploadedImages[zone.id])}
                  >
                    {uploadedImages[zone.id] ? (
                      <>
                        <img
                          src={uploadedImages[zone.id]!}
                          alt={zone.label}
                          className="w-full h-full object-cover hover:opacity-80"
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900 to-transparent p-1 text-xs font-bold text-emerald-300">
                          {zone.label}
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-xs text-slate-500 text-center px-2">
                        <div>{zone.label}</div>
                        <div className="text-[10px] mt-1">Drag here</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Analysis */}
            {preMarketAnalysis && (
              <div className="bg-slate-800 p-4 rounded border border-slate-700 text-sm text-slate-200 whitespace-pre-wrap max-h-64 overflow-y-auto">
                {preMarketAnalysis}
              </div>
            )}

            <button
              onClick={analyzeTab}
              disabled={isAnalyzing}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <TrendingUp size={16} />}
              {isAnalyzing ? 'Analyzing...' : 'Analyze Pre-Market'}
            </button>
          </div>
        )}

        {/* Live Tab */}
        {activeTab === 'live' && (
          <div className="space-y-3">
            <button
              onClick={analyzeTab}
              disabled={isAnalyzing}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Activity size={16} />}
              {isAnalyzing ? 'Checking...' : 'Add Live Check'}
            </button>

            {liveChecks.length > 0 && (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {liveChecks.map((check, idx) => (
                  <div key={idx} className="bg-slate-800 p-3 rounded border border-slate-700">
                    <button
                      onClick={() => setExpandedLive(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      className="flex items-center justify-between w-full text-xs font-bold text-emerald-400"
                    >
                      <span>{check.time}</span>
                      {expandedLive[idx] ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    {expandedLive[idx] && (
                      <div className="mt-2 text-xs text-slate-300 whitespace-pre-wrap border-t border-slate-700 pt-2">
                        {check.text}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Post Tab */}
        {activeTab === 'post' && (
          <div className="space-y-3">
            {postAnalysis && (
              <div className="bg-slate-800 p-4 rounded border border-slate-700 text-sm text-slate-200 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {postAnalysis}
              </div>
            )}
            <button
              onClick={analyzeTab}
              disabled={isAnalyzing}
              className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded font-bold flex items-center justify-center gap-2"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={16} /> : <Clock size={16} />}
              {isAnalyzing ? 'Analyzing...' : 'Review Session'}
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700"
          >
            <X className="text-white" size={20} />
          </button>
          <img
            src={previewImage}
            className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
