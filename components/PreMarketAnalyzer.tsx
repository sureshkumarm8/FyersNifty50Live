import React, { useState, useEffect } from 'react';
import { FyersCredentials, MarketSnapshot } from '../types';
import { callAI } from '../services/aiProvider';
import { Upload, X, Newspaper, TrendingUp, Activity, Clock, Loader2, ChevronDown, ChevronUp, RotateCcw, Zap, Flame, Sparkles, AlertCircle, CheckCircle2, Eye, Download } from 'lucide-react';

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
  const [liveChecks, setLiveChecks] = useState<{ time: string; text: string; status?: 'pass' | 'fail' }[]>([]);
  
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

  const zones = [
    { id: 'intraday', label: '📊 Intraday 1H', color: 'from-blue-500 to-cyan-500' },
    { id: 'oi', label: '📈 OI Data', color: 'from-purple-500 to-pink-500' },
    { id: 'fiveDay', label: '📉 5-Day View', color: 'from-green-500 to-emerald-500' },
    { id: 'multiOI', label: '🎯 Multi OI', color: 'from-orange-500 to-red-500' },
  ];

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
    if (!aiEnabled) return;
    setIsAnalyzing(true);

    try {
      let prompt = '';
      if (activeTab === 'news') {
        prompt = 'Analyze current market news and provide trading sentiment. Keep it brief, actionable, and organized with clear sections.';
      } else if (activeTab === 'premarket') {
        const hasImages = Object.values(uploadedImages).some(img => img);
        prompt = `As a professional trader, analyze these pre-market conditions:
${hasImages ? '- Charts uploaded and ready for analysis' : '- No charts provided, use general pre-market analysis'}
- Provide key levels, support/resistance
- Expected market direction
- Trading plan for first hour (09:15-10:15)
- Risk points to watch
Keep analysis concise and highly actionable.`;
      } else if (activeTab === 'live') {
        prompt = 'Generate a live market validation checkpoint. Include: Current price action, Trend strength, Risk/Reward setup, Next action.';
      } else if (activeTab === 'post') {
        prompt = 'Provide post-market session review. Include: Winners/Losers, Key lessons, Plan for tomorrow, Overall rating.';
      }

      const response = await callAI(prompt);
      
      if (activeTab === 'news') setNewsAnalysis(response);
      else if (activeTab === 'premarket') setPreMarketAnalysis(response);
      else if (activeTab === 'live') {
        const check = { time: new Date().toLocaleTimeString(), text: response, status: 'pass' as const };
        setLiveChecks(prev => [check, ...prev]);
      } else if (activeTab === 'post') setPostAnalysis(response);
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
      setPendingImages([]);
    } else if (activeTab === 'live') setLiveChecks([]);
    else if (activeTab === 'post') setPostAnalysis('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-b border-slate-700/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-3">
                <Sparkles size={32} className="text-yellow-400" />
                Pre-Market Intelligence
              </h1>
              <p className="text-slate-400 text-sm mt-1">Real-time market analysis & trading preparation</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-emerald-400">{new Date().toLocaleTimeString()}</div>
              <div className="text-xs text-slate-400">{new Date().toLocaleDateString()}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation - Beautiful Gradient */}
      <div className="sticky top-0 z-40 bg-slate-800/80 backdrop-blur-md border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex gap-2 overflow-x-auto py-3">
            {[
              { id: 'news', label: '📰 News', icon: Newspaper, color: 'from-amber-500 to-orange-500' },
              { id: 'premarket', label: '🎯 Pre-Market', icon: TrendingUp, color: 'from-blue-500 to-cyan-500' },
              { id: 'live', label: '⚡ Live Checks', icon: Activity, color: 'from-emerald-500 to-green-500' },
              { id: 'post', label: '📊 Post Session', icon: Clock, color: 'from-purple-500 to-pink-500' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-2 rounded-lg font-bold text-sm whitespace-nowrap transition-all duration-300 ${
                  activeTab === tab.id
                    ? `bg-gradient-to-r ${tab.color} text-white shadow-lg scale-105`
                    : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 p-4 rounded-lg border border-amber-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={20} className="text-amber-400" />
                  <span className="text-amber-300 font-bold">Trending</span>
                </div>
                <p className="text-sm text-slate-300">Market sentiment analysis</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-4 rounded-lg border border-blue-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={20} className="text-blue-400" />
                  <span className="text-blue-300 font-bold">Hot Topics</span>
                </div>
                <p className="text-sm text-slate-300">Breaking news & updates</p>
              </div>
              <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-4 rounded-lg border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={20} className="text-emerald-400" />
                  <span className="text-emerald-300 font-bold">Impact</span>
                </div>
                <p className="text-sm text-slate-300">Market implications</p>
              </div>
            </div>

            {newsAnalysis && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700/50 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Newspaper size={20} className="text-amber-400" />
                  <h2 className="text-lg font-bold text-slate-100">Market Sentiment Analysis</h2>
                </div>
                <div className="prose prose-invert max-w-none">
                  <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                    {newsAnalysis}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={analyzeTab}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
              {isAnalyzing ? 'Analyzing Market...' : 'Analyze News & Sentiment'}
            </button>

            {newsAnalysis && (
              <button
                onClick={resetTab}
                className="w-full bg-slate-700/50 hover:bg-slate-600 text-slate-300 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw size={16} />
                Reset Analysis
              </button>
            )}
          </div>
        )}

        {/* Pre-Market Tab */}
        {activeTab === 'premarket' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Upload Section */}
            <div className="bg-gradient-to-br from-blue-900/30 to-cyan-900/30 p-6 rounded-xl border border-blue-500/30 backdrop-blur-sm">
              <label className="block w-full p-8 border-2 border-dashed border-blue-400/50 rounded-lg cursor-pointer hover:border-blue-300 bg-blue-500/10 transition-all duration-300 group">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="p-3 bg-blue-500/20 rounded-full group-hover:bg-blue-500/30 transition-all">
                    <Upload size={32} className="text-blue-300" />
                  </div>
                  <div className="text-center">
                    <div className="text-slate-100 text-sm font-bold">📸 Upload Market Screenshots</div>
                    <div className="text-xs text-slate-400 mt-1">Drag Mac screenshots here or click to browse</div>
                  </div>
                </div>
                <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4 space-y-2">
                  <div className="text-sm text-blue-300 font-bold flex justify-between">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            {/* Pending Images Preview */}
            {pendingImages.length > 0 && (
              <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 p-6 rounded-xl border border-amber-500/30">
                <div className="text-sm font-bold text-amber-300 mb-4 flex items-center gap-2">
                  <Sparkles size={18} />
                  Screenshots Uploaded - Drag to Assign
                </div>
                <div className="flex gap-3 flex-wrap">
                  {pendingImages.map(img => (
                    <div
                      key={img.name}
                      draggable
                      onDragStart={() => setDraggedImage(img)}
                      className="relative group h-20 w-20 rounded-lg border-2 border-amber-500 bg-amber-900/20 cursor-move overflow-hidden hover:border-amber-300 transition-all hover:scale-105"
                      title={img.name}
                    >
                      <img src={img.data} alt={img.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removePendingImage(img.name)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart Assignment Grid */}
            <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700/50">
              <div className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                🎯 Assign Screenshots to Analysis Zones
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                {zones.map(zone => (
                  <div
                    key={zone.id}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.add('ring-2', 'ring-emerald-400');
                    }}
                    onDragLeave={(e) => {
                      e.currentTarget.classList.remove('ring-2', 'ring-emerald-400');
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.currentTarget.classList.remove('ring-2', 'ring-emerald-400');
                      if (draggedImage) {
                        assignImageToZone(draggedImage.name, draggedImage.data, zone.id);
                        setDraggedImage(null);
                      }
                    }}
                    className={`relative h-32 rounded-lg border-2 overflow-hidden cursor-pointer transition-all duration-300 group ${
                      uploadedImages[zone.id]
                        ? `border-emerald-500 bg-gradient-to-br from-emerald-500/20 to-green-500/20`
                        : 'border-dashed border-slate-600 bg-slate-900/50 hover:border-blue-400 hover:bg-slate-900'
                    }`}
                    onClick={() => uploadedImages[zone.id] && setPreviewImage(uploadedImages[zone.id])}
                  >
                    {uploadedImages[zone.id] ? (
                      <>
                        <img
                          src={uploadedImages[zone.id]!}
                          alt={zone.label}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                        />
                        <div className={`absolute inset-0 bg-gradient-to-t ${zone.color} opacity-0 group-hover:opacity-30 transition-opacity`} />
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                          <div className="text-xs font-bold text-emerald-300">{zone.label}</div>
                        </div>
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye size={14} />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center px-3 py-2">
                        <div className="text-lg mb-1">{zone.label.split(' ')[0]}</div>
                        <div className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Drag here</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {preMarketAnalysis && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700/50 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp size={20} className="text-blue-400" />
                  <h2 className="text-lg font-bold text-slate-100">Pre-Market Analysis</h2>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {preMarketAnalysis}
                </div>
              </div>
            )}

            <button
              onClick={analyzeTab}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Zap size={20} />}
              {isAnalyzing ? 'Analyzing Charts...' : 'Analyze Pre-Market Setup'}
            </button>

            {(preMarketAnalysis || Object.values(uploadedImages).some(img => img)) && (
              <button
                onClick={resetTab}
                className="w-full bg-slate-700/50 hover:bg-slate-600 text-slate-300 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw size={16} />
                Reset All Charts
              </button>
            )}
          </div>
        )}

        {/* Live Checks Tab */}
        {activeTab === 'live' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-gradient-to-br from-emerald-900/30 to-green-900/30 p-6 rounded-xl border border-emerald-500/30">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold text-emerald-300 flex items-center gap-2">
                    <Activity size={20} />
                    Live Market Checkpoints
                  </h2>
                  <p className="text-sm text-slate-400 mt-1">Real-time validation & monitoring</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-emerald-400">{liveChecks.length}</div>
                  <div className="text-xs text-slate-400">Checks</div>
                </div>
              </div>
            </div>

            {liveChecks.length > 0 && (
              <div className="space-y-3">
                {liveChecks.map((check, idx) => (
                  <div key={idx} className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden hover:border-emerald-500/50 transition-all">
                    <button
                      onClick={() => setExpandedLive(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      className="w-full p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 text-left flex-1">
                        <div className="p-2 bg-emerald-500/20 rounded">
                          {check.status === 'pass' ? (
                            <CheckCircle2 size={18} className="text-emerald-400" />
                          ) : (
                            <AlertCircle size={18} className="text-orange-400" />
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-slate-200">{check.time}</div>
                          <div className="text-xs text-slate-400">Market checkpoint</div>
                        </div>
                      </div>
                      {expandedLive[idx] ? <ChevronUp size={18} className="text-slate-400" /> : <ChevronDown size={18} className="text-slate-400" />}
                    </button>
                    {expandedLive[idx] && (
                      <div className="border-t border-slate-700/50 p-4 bg-slate-900/50">
                        <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {check.text}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={analyzeTab}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Activity size={20} />}
              {isAnalyzing ? 'Generating Checkpoint...' : 'Add Live Checkpoint'}
            </button>

            {liveChecks.length > 0 && (
              <button
                onClick={resetTab}
                className="w-full bg-slate-700/50 hover:bg-slate-600 text-slate-300 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw size={16} />
                Clear All Checks
              </button>
            )}
          </div>
        )}

        {/* Post Session Tab */}
        {activeTab === 'post' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 p-4 rounded-lg border border-emerald-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={20} className="text-emerald-400" />
                  <span className="text-emerald-300 font-bold">Winners</span>
                </div>
                <p className="text-sm text-slate-300">Profitable trades & setups</p>
              </div>
              <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 p-4 rounded-lg border border-red-500/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={20} className="text-red-400" />
                  <span className="text-red-300 font-bold">Losers</span>
                </div>
                <p className="text-sm text-slate-300">Losses & learning points</p>
              </div>
            </div>

            {postAnalysis && (
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700/50 shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <Clock size={20} className="text-purple-400" />
                  <h2 className="text-lg font-bold text-slate-100">Post-Session Review</h2>
                </div>
                <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-900/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {postAnalysis}
                </div>
              </div>
            )}

            <button
              onClick={analyzeTab}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Clock size={20} />}
              {isAnalyzing ? 'Generating Review...' : 'Generate Session Review'}
            </button>

            {postAnalysis && (
              <button
                onClick={resetTab}
                className="w-full bg-slate-700/50 hover:bg-slate-600 text-slate-300 font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw size={16} />
                Reset Review
              </button>
            )}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPreviewImage(null)}>
          <div className="bg-slate-900 rounded-xl overflow-hidden max-w-4xl w-full max-h-96 flex flex-col">
            <div className="flex-1 overflow-auto">
              <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
            </div>
            <div className="bg-slate-800 px-4 py-3 flex justify-between items-center border-t border-slate-700">
              <span className="text-sm text-slate-400">Click anywhere to close</span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-2 hover:bg-slate-700 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add CSS for animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};
