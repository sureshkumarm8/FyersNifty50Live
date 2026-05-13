import React, { useState, useEffect } from 'react';
import { FyersCredentials, MarketSnapshot, EnrichedFyersQuote } from '../types';
import { imageStorageService } from '../services/imageStorage';
import {
  Brain, Zap, Clock, Lightbulb, X, Copy, Upload, Trash2, Loader2, 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, BarChart2, Shield, Activity, RefreshCw, Crosshair, Download
} from 'lucide-react';

interface ImageAnalysis {
  type: '1H_CHART' | 'OI_CHART' | '5DAY_CHART' | null;
  filename: string;
  data: string;
  aiInsights: string;
  uploadedAt: number;
}

interface PreMarketDecision {
  generatedAt: number;
  generatedAtStr: string;
  niftyLtp: number;
  yesterdayClose: number;
  range24h: number;
  imageAnalyses: ImageAnalysis[];
  openSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentStrength: number;
  scenarios: {
    flat: { probability: number; description: string };
    gapUp: { probability: number; description: string };
    gapDown: { probability: number; description: string };
  };
  confidence: number;
  expectedResistance: number;
  expectedSupport: number;
  primaryBias: 'LONG' | 'SHORT' | 'NEUTRAL';
  biasStrength: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  riskReason: string;
  aiSummary: string;
}

export const PreMarketAnalyzer: React.FC<{
  credentials: FyersCredentials;
  historyLog?: MarketSnapshot[];
  stocks?: EnrichedFyersQuote[];
  aiEnabled?: boolean;
}> = ({ credentials, historyLog = [], stocks = [], aiEnabled = true }) => {
  const [preMarketDecision, setPreMarketDecision] = useState<PreMarketDecision | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [pendingImage, setPendingImage] = useState<string | null>(null);
  const [pendingImages, setPendingImages] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<ImageAnalysis[]>([]);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('en-IN', { hour12: false });
    setLogs(p => [`[${time}] ${msg}`, ...p.slice(0, 49)]);
  };

  // Handle multi-image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPending: string[] = [];
    let processed = 0;

    for (const file of Array.from(files)) {
      addLog(`📸 Image selected: ${file.name}`);
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        newPending.push(base64);
        processed++;
        
        if (processed === files.length) {
          setPendingImages(prev => [...prev, ...newPending]);
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Classify image to a type
  const classifyImage = async (type: '1H_CHART' | 'OI_CHART' | '5DAY_CHART', index: number) => {
    if (index >= pendingImages.length) return;

    const imageData = pendingImages[index];
    setAnalyzingImage(true);
    addLog(`🧠 Analyzing ${type.replace(/_/g, ' ')} with Gemini AI...`);

    try {
      const filename = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get AI analysis from Gemini
      const aiInsights = await getSmartChartAnalysis(type, imageData);

      const newImage: ImageAnalysis = {
        type,
        filename,
        data: imageData,
        aiInsights,
        uploadedAt: Date.now()
      };

      setUploadedImages(prev => [...prev, newImage]);
      await imageStorageService.saveImages({
        [filename]: imageData
      });
      
      // Remove from pending
      setPendingImages(prev => prev.filter((_, i) => i !== index));
      addLog(`✅ ${type.replace(/_/g, ' ')} analyzed & classified`);
    } catch (err: any) {
      addLog(`❌ Error: ${err.message}`);
    } finally {
      setAnalyzingImage(false);
    }
  };

  // Smart chart analysis using Gemini API
  const getSmartChartAnalysis = async (type: '1H_CHART' | 'OI_CHART' | '5DAY_CHART', imageData: string): Promise<string> => {
    try {
      if (!credentials.googleApiKey) {
        addLog('⚠️ Gemini API key not configured');
        return getDefaultAnalysis(type);
      }

      // Extract base64 from data URL
      const base64 = imageData.includes(',') ? imageData.split(',')[1] : imageData;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${credentials.googleApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { 
                inlineData: { 
                  mimeType: 'image/jpeg', 
                  data: base64 
                } 
              },
              { 
                text: `Analyze this ${type.replace(/_/g, ' ').toLowerCase()} chart for Nifty 50 trading:
1. Key support/resistance levels
2. Current trend direction  
3. Chart patterns or signals
4. Momentum and volatility
5. Trading signal: BUY/SELL/NEUTRAL

Keep response to 2-3 lines max, focus on actionable insights.` 
              }
            ]
          }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 150
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Gemini API error:', error);
        return getDefaultAnalysis(type);
      }

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (text) {
        addLog(`✅ AI analyzed ${type.replace(/_/g, ' ')}`);
        return text.trim();
      }
      
      return getDefaultAnalysis(type);
    } catch (error) {
      console.error('Chart analysis error:', error);
      return getDefaultAnalysis(type);
    }
  };

  // Default analysis template
  const getDefaultAnalysis = (type: '1H_CHART' | 'OI_CHART' | '5DAY_CHART'): string => {
    const templates: Record<string, string> = {
      '1H_CHART': '📊 1H: Intraday momentum with support/resistance levels marked. Watch key price zones for entry confirmation signals.',
      'OI_CHART': '📞 OI: Call/Put sentiment indicators. High concentration at strikes shows strong resistance/support levels.',
      '5DAY_CHART': '📈 5D: Higher timeframe trend context. Provides direction bias for tactical entries and breakout confirmations.'
    };
    return templates[type] || 'Chart analysis ready. Monitor key confluence points.';
  };

  // Remove image
  const removeImage = async (filename: string) => {
    setUploadedImages(prev => prev.filter(img => img.filename !== filename));
    await imageStorageService.deleteImage(filename);
    addLog('🗑️ Image removed');
  };

  // Generate pre-market decision
  const generatePreMarketDecision = async () => {
    if (historyLog.length < 30) {
      addLog('❌ Need 30+ minutes of history');
      return;
    }

    setIsGenerating(true);
    addLog('🧠 Generating pre-market decision...');

    try {
      const now = Date.now();
      const latest = historyLog[0];
      const oneHourAgo = historyLog[Math.max(0, historyLog.length - 60)];
      const thirtyMinsAgo = historyLog[Math.max(0, historyLog.length - 30)];

      const niftyLtp = latest.niftyLtp;
      const yesterdayClose = oneHourAgo?.niftyLtp || niftyLtp;
      const currentClose = latest.niftyLtp;
      const range24h = Math.abs(currentClose - yesterdayClose);

      // Sentiment calculation
      const bullishStocks = stocks.filter(s => (s.lp_chg_day_p || 0) > 0).length;
      const stockSentiment = (bullishStocks / Math.max(stocks.length, 1)) * 100 - 50;
      const optionSentiment = latest.optionsSent || 0;
      const momentumChange = ((currentClose - thirtyMinsAgo?.niftyLtp) / (thirtyMinsAgo?.niftyLtp || currentClose)) * 100;

      let imageSentimentBoost = 0;
      for (const img of uploadedImages) {
        if (img.aiInsights.toLowerCase().includes('buy') || img.aiInsights.toLowerCase().includes('long')) {
          imageSentimentBoost += 15;
        } else if (img.aiInsights.toLowerCase().includes('sell') || img.aiInsights.toLowerCase().includes('short')) {
          imageSentimentBoost -= 15;
        }
      }

      const totalSentiment = (stockSentiment * 0.35) + (optionSentiment * 0.25) + (momentumChange * 2) + (imageSentimentBoost * 0.4);
      const clampedSentiment = Math.max(-100, Math.min(100, totalSentiment));

      let openSentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
      if (clampedSentiment > 20) openSentiment = 'BULLISH';
      else if (clampedSentiment < -20) openSentiment = 'BEARISH';
      else openSentiment = 'NEUTRAL';

      // Scenario probabilities
      let flatProb = 30, gapUpProb = 35, gapDownProb = 35;

      if (openSentiment === 'BULLISH') {
        flatProb = 25; gapUpProb = 60; gapDownProb = 15;
      } else if (openSentiment === 'BEARISH') {
        flatProb = 25; gapUpProb = 15; gapDownProb = 60;
      }

      const pcr = latest.pcr || 1;
      if (pcr > 1.2) gapDownProb += 10;
      if (pcr < 0.9) gapUpProb += 10;
      
      const total = flatProb + gapUpProb + gapDownProb;
      flatProb = Math.round((flatProb / total) * 100);
      gapUpProb = Math.round((gapUpProb / total) * 100);
      gapDownProb = Math.round((gapDownProb / total) * 100);

      // Expected levels
      const atr = range24h * 0.7;
      const expectedR = niftyLtp + atr;
      const expectedS = niftyLtp - atr;

      // Confidence
      let confidence = 50;
      if (Math.abs(clampedSentiment) > 50) confidence += 20;
      if (Math.abs(clampedSentiment) > 70) confidence += 15;
      if (latest.pcr > 0.8 && latest.pcr < 1.3) confidence += 10;
      if (stocks.length > 40) confidence += 5;
      if (uploadedImages.length > 0) confidence += 10;
      confidence = Math.min(95, confidence);

      let primaryBias: 'LONG' | 'SHORT' | 'NEUTRAL';
      if (clampedSentiment > 30) primaryBias = 'LONG';
      else if (clampedSentiment < -30) primaryBias = 'SHORT';
      else primaryBias = 'NEUTRAL';

      let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
      let riskReason = '';
      if (Math.abs(clampedSentiment) < 20 && Math.abs(momentumChange) < 0.5) {
        riskLevel = 'LOW';
        riskReason = 'Balanced. Low volatility expected.';
      } else if (Math.abs(clampedSentiment) > 60 || Math.abs(momentumChange) > 2) {
        riskLevel = 'HIGH';
        riskReason = 'High divergence. Potential gap risk.';
      } else {
        riskLevel = 'MEDIUM';
        riskReason = 'Normal conditions. Moderate volatility.';
      }

      const imageInsightsText = uploadedImages.map(img => `${img.type}: ${img.aiInsights}`).join('\n');
      let aiSummary = `Technical Setup: ${openSentiment} | Risk: ${riskLevel}\nChart Analysis:\n${imageInsightsText || 'Upload charts for enhanced analysis'}`;

      const decision: PreMarketDecision = {
        generatedAt: now,
        generatedAtStr: new Date(now).toLocaleString('en-IN', { hour12: false }),
        niftyLtp, yesterdayClose, range24h,
        imageAnalyses: uploadedImages,
        openSentiment, sentimentStrength: Math.round(clampedSentiment),
        scenarios: {
          flat: { probability: flatProb, description: `~${Math.round(range24h / 2)}pts around ${niftyLtp.toFixed(0)}` },
          gapUp: { probability: gapUpProb, description: `Open 50-150pts above ${yesterdayClose.toFixed(0)}` },
          gapDown: { probability: gapDownProb, description: `Open 50-150pts below ${yesterdayClose.toFixed(0)}` }
        },
        confidence: Math.round(confidence),
        expectedResistance: Math.round(expectedR),
        expectedSupport: Math.round(expectedS),
        primaryBias, biasStrength: Math.round(Math.abs(clampedSentiment)),
        riskLevel, riskReason, aiSummary
      };

      setPreMarketDecision(decision);
      addLog(`✅ Decision generated | Confidence: ${confidence}%`);
    } catch (e: any) {
      addLog(`❌ Error: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearDecision = () => {
    setPreMarketDecision(null);
    setLogs([]);
    addLog('🔄 Data cleared');
  };

  const copyToClipboard = () => {
    if (preMarketDecision) {
      navigator.clipboard.writeText(JSON.stringify(preMarketDecision, null, 2));
      addLog('📋 Copied to clipboard');
    }
  };

  return (
    <div className="bg-gradient-to-br from-slate-950 via-indigo-950/20 to-slate-900 text-white p-4 sm:p-6 rounded-xl space-y-4 sm:space-y-6 h-full overflow-y-auto custom-scrollbar">
      {/* PREMIUM HEADER */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/30">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-600/20 via-orange-600/20 to-yellow-600/20" />
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/10 via-transparent to-cyan-900/10" />
        
        {/* Content */}
        <div className="relative glass-panel p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Left: Title Section */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-400/20 rounded-2xl blur-xl animate-pulse" />
                <div className="relative p-3 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-2xl shadow-2xl">
                  <Lightbulb className="w-7 h-7 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-yellow-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
                  Pre-Market Intelligence
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-2 mt-1">
                  <Brain size={14} className="text-purple-400" />
                  AI-Powered Chart Analysis + Live Market Data
                </p>
              </div>
            </div>

            {/* Right: Time & Status */}
            <div className="flex items-center gap-4">
              {preMarketDecision && (
                <div className="text-left sm:text-right">
                  <p className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock size={12} />
                    Last Generated
                  </p>
                  <p className="text-sm font-mono text-amber-300 font-bold">
                    {preMarketDecision.generatedAtStr}
                  </p>
                </div>
              )}
              
              {/* Status Indicator */}
              <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 ${
                preMarketDecision 
                  ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                  : 'bg-slate-500/20 border border-slate-500/50 text-slate-400'
              }`}>
                <div className={`w-2 h-2 rounded-full ${preMarketDecision ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
                {preMarketDecision ? 'ACTIVE' : 'READY'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* PREMIUM UPLOAD SECTION */}
      <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-blue-500/5">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Chart Upload & AI Classification</h3>
            <p className="text-xs text-slate-400">Upload multiple charts for instant AI analysis</p>
          </div>
        </div>
        
        <label className="relative block">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="cursor-pointer group relative overflow-hidden rounded-xl">
            {/* Animated Border */}
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 transition-opacity blur-xl" />
            
            {/* Upload Area */}
            <div className="relative bg-slate-800/50 hover:bg-slate-800/70 rounded-xl p-8 border-2 border-dashed border-slate-600 group-hover:border-cyan-400 transition-all">
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <div className="absolute inset-0 bg-cyan-400/20 rounded-full blur-2xl group-hover:blur-3xl transition-all" />
                  <div className="relative p-4 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full border border-cyan-500/30">
                    <Upload className="w-10 h-10 text-cyan-400" />
                  </div>
                </div>
                <p className="text-base font-bold text-slate-200 mb-1">Drop files here or click to upload</p>
                <p className="text-xs text-slate-400">Supports JPG, PNG • Multiple files supported</p>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-cyan-400">
                  <Zap size={12} />
                  <span>Powered by Gemini AI</span>
                </div>
              </div>
            </div>
          </div>
        </label>

        {/* Pending Images - For Classification */}
        {pendingImages.length > 0 && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
              <p className="text-xs font-bold text-yellow-400 flex items-center gap-2">
                <AlertCircle size={14} />
                Awaiting Classification ({pendingImages.length})
              </p>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-yellow-500/50 to-transparent" />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {pendingImages.map((imgData, idx) => (
                <div key={idx} className="group glass-panel rounded-xl border border-slate-600 hover:border-cyan-500/50 overflow-hidden transition-all">
                  {/* Image Preview */}
                  <div className="relative h-32 sm:h-40 bg-slate-800">
                    <img src={imgData} alt="pending" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                  </div>
                  
                  {/* Classification Buttons */}
                  <div className="p-4 space-y-3">
                    <p className="text-xs text-slate-400 font-bold">Select Chart Type:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { type: '1H_CHART' as const, label: '1 Hour', emoji: '📊', color: 'cyan' },
                        { type: 'OI_CHART' as const, label: 'OI Flow', emoji: '📞', color: 'purple' },
                        { type: '5DAY_CHART' as const, label: '5 Days', emoji: '📈', color: 'green' }
                      ].map(opt => (
                        <button
                          key={opt.type}
                          onClick={() => classifyImage(opt.type, idx)}
                          disabled={analyzingImage}
                          className={`group/btn relative overflow-hidden text-xs font-bold py-2.5 rounded-lg transition-all ${
                            analyzingImage
                              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                              : `bg-${opt.color}-600 hover:bg-${opt.color}-700 text-white shadow-lg hover:shadow-${opt.color}-500/50`
                          }`}
                        >
                          {analyzingImage ? (
                            <Loader2 className="w-4 h-4 mx-auto animate-spin" />
                          ) : (
                            <span className="flex flex-col items-center gap-0.5">
                              <span className="text-base">{opt.emoji}</span>
                              <span className="text-[10px]">{opt.label}</span>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CLASSIFIED CHARTS GALLERY */}
      {uploadedImages.length > 0 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-6 border border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">AI-Analyzed Charts</h3>
                <p className="text-xs text-slate-400">{uploadedImages.length} chart{uploadedImages.length > 1 ? 's' : ''} ready for analysis</p>
              </div>
            </div>
            <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/50 rounded-full">
              <span className="text-xs font-bold text-green-400">{uploadedImages.length} / 3</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploadedImages.map((img, idx) => (
              <div key={img.filename} className="group relative glass-panel rounded-xl border border-slate-600 hover:border-cyan-500/50 transition-all overflow-hidden">
                {/* Chart Type Badge */}
                <div className="absolute top-3 left-3 z-10">
                  <div className="px-3 py-1.5 bg-slate-900/90 backdrop-blur-sm rounded-lg border border-cyan-500/50">
                    <p className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                      {img.type === '1H_CHART' ? (
                        <><BarChart2 size={12} /> 1H Chart</>
                      ) : img.type === 'OI_CHART' ? (
                        <><Activity size={12} /> OI Flow</>
                      ) : (
                        <><TrendingUp size={12} /> 5-Day</>
                      )}
                    </p>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => removeImage(img.filename)}
                  className="absolute top-3 right-3 z-10 p-2 bg-red-500/90 hover:bg-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>

                {/* Image Preview */}
                <button
                  onClick={() => setPreviewImage(img.data)}
                  className="w-full h-48 bg-slate-800 relative overflow-hidden cursor-pointer group/img"
                >
                  <img 
                    src={img.data} 
                    alt={img.type || 'chart'} 
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-cyan-500/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="px-4 py-2 bg-slate-900/90 rounded-lg border border-cyan-500">
                      <p className="text-xs font-bold text-cyan-400">Click to view full size</p>
                    </div>
                  </div>
                </button>

                {/* AI Insights Section */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
                    <Brain size={14} className="text-purple-400" />
                    <p className="text-xs font-bold text-slate-300">AI Insights</p>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {img.aiInsights}
                  </p>
                  
                  {/* Timestamp */}
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-700/50">
                    <Clock size={10} className="text-slate-500" />
                    <p className="text-[10px] text-slate-500 font-mono">
                      {new Date(img.uploadedAt).toLocaleTimeString('en-IN', { hour12: false })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={generatePreMarketDecision}
          disabled={isGenerating || historyLog.length < 30}
          className={`group relative overflow-hidden flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all ${
            isGenerating || historyLog.length < 30
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg shadow-green-500/50 hover:shadow-green-500/70'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Analyzing Market...</span>
            </>
          ) : (
            <>
              <div className="relative">
                <Zap className="w-5 h-5" />
                <div className="absolute inset-0 bg-white/30 rounded-full blur-md group-hover:bg-white/50 transition-all" />
              </div>
              <span>Generate Pre-Market Decision</span>
            </>
          )}
        </button>

        {preMarketDecision && (
          <>
            <button
              onClick={copyToClipboard}
              className="group flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 transition-all"
            >
              <Copy className="w-4 h-4 group-hover:scale-110 transition-transform" />
              <span>Copy Data</span>
            </button>
            <button
              onClick={clearDecision}
              className="group flex items-center gap-2 px-5 py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white shadow-lg shadow-red-500/50 hover:shadow-red-500/70 transition-all ml-auto"
            >
              <X className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>Reset All</span>
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* MAIN DECISION PANEL */}
        {preMarketDecision ? (
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* AI Summary Card */}
            <div className="relative overflow-hidden rounded-2xl border border-purple-500/30">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-indigo-600/10" />
              <div className="relative glass-panel p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">AI Market Summary</p>
                    <p className="text-xs text-slate-400">Powered by Gemini AI</p>
                  </div>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{preMarketDecision.aiSummary}</p>
              </div>
            </div>

            {/* Core Metrics Dashboard */}
            <div className={`relative overflow-hidden rounded-2xl border-2 ${
              preMarketDecision.openSentiment === 'BULLISH' ? 'border-green-400/60' :
              preMarketDecision.openSentiment === 'BEARISH' ? 'border-red-400/60' :
              'border-slate-600/60'
            }`}>
              <div className={`absolute inset-0 ${
                preMarketDecision.openSentiment === 'BULLISH' ? 'bg-gradient-to-br from-green-600/20 to-emerald-600/10' :
                preMarketDecision.openSentiment === 'BEARISH' ? 'bg-gradient-to-br from-red-600/20 to-pink-600/10' :
                'bg-gradient-to-br from-slate-700/20 to-slate-600/10'
              }`} />
              
              <div className="relative glass-panel p-5 sm:p-6">
                {/* Current LTP */}
                <div className="mb-5">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-2">
                    <Activity size={12} />
                    Current Nifty LTP
                  </p>
                  <div className="flex items-baseline gap-3">
                    <p className="text-4xl sm:text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                      {preMarketDecision.niftyLtp.toFixed(0)}
                    </p>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      preMarketDecision.openSentiment === 'BULLISH' ? 'bg-green-500/20 text-green-400' :
                      preMarketDecision.openSentiment === 'BEARISH' ? 'bg-red-500/20 text-red-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {preMarketDecision.openSentiment}
                    </div>
                  </div>
                </div>

                {/* Quick Stats Grid */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className="glass-panel bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                    <p className="text-xs text-slate-400 mb-1">Yesterday Close</p>
                    <p className="text-lg sm:text-xl font-bold text-white">{preMarketDecision.yesterdayClose.toFixed(0)}</p>
                  </div>
                  <div className="glass-panel bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/30">
                    <p className="text-xs text-slate-400 mb-1">24h Range</p>
                    <p className="text-lg sm:text-xl font-bold text-yellow-400">±{preMarketDecision.range24h.toFixed(0)}</p>
                  </div>
                  <div className={`glass-panel rounded-xl p-4 border ${
                    preMarketDecision.openSentiment === 'BULLISH' ? 'bg-green-500/10 border-green-500/30' : 
                    preMarketDecision.openSentiment === 'BEARISH' ? 'bg-red-500/10 border-red-500/30' : 
                    'bg-slate-800/50 border-slate-700/50'
                  }`}>
                    <p className="text-xs text-slate-400 mb-1">Strength</p>
                    <p className={`text-lg sm:text-xl font-bold ${
                      preMarketDecision.openSentiment === 'BULLISH' ? 'text-green-400' : 
                      preMarketDecision.openSentiment === 'BEARISH' ? 'text-red-400' : 
                      'text-slate-400'
                    }`}>
                      {Math.abs(preMarketDecision.sentimentStrength)}%
                    </p>
                  </div>
                </div>

                {/* Sentiment Strength Bar */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-bold">Market Sentiment</span>
                    <span className={`font-bold ${
                      preMarketDecision.sentimentStrength > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {preMarketDecision.sentimentStrength > 0 ? '+' : ''}{preMarketDecision.sentimentStrength}%
                    </span>
                  </div>
                  <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`absolute h-full rounded-full transition-all ${
                        preMarketDecision.sentimentStrength > 0 
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                          : 'bg-gradient-to-r from-red-500 to-pink-500'
                      }`}
                      style={{ 
                        width: `${Math.min(Math.abs(preMarketDecision.sentimentStrength), 100)}%`,
                        left: preMarketDecision.sentimentStrength < 0 ? 'auto' : '0',
                        right: preMarketDecision.sentimentStrength < 0 ? '0' : 'auto'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Market Scenarios */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'flat', emoji: '➡️', label: 'Flat Open', gradient: 'from-slate-600 to-slate-700', border: 'slate-500' },
                { key: 'gapUp', emoji: '📈', label: 'Gap Up', gradient: 'from-green-600 to-emerald-600', border: 'green-500' },
                { key: 'gapDown', emoji: '📉', label: 'Gap Down', gradient: 'from-red-600 to-pink-600', border: 'red-500' }
              ].map(scenario => {
                const data = preMarketDecision.scenarios[scenario.key as keyof typeof preMarketDecision.scenarios];
                const isHighest = data.probability === Math.max(
                  preMarketDecision.scenarios.flat.probability,
                  preMarketDecision.scenarios.gapUp.probability,
                  preMarketDecision.scenarios.gapDown.probability
                );
                return (
                  <div 
                    key={scenario.key} 
                    className={`relative overflow-hidden rounded-xl border ${
                      isHighest ? `border-${scenario.border}/50` : 'border-slate-700/50'
                    } ${isHighest ? 'ring-2 ring-offset-2 ring-offset-slate-950 ring-cyan-500/50' : ''}`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${scenario.gradient} opacity-${isHighest ? '20' : '10'}`} />
                    <div className="relative glass-panel p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{scenario.emoji}</span>
                          <span className="text-xs font-bold text-white">{scenario.label}</span>
                        </div>
                        {isHighest && (
                          <Shield className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>
                      <div className="text-3xl font-black text-cyan-400 mb-2">{data.probability}%</div>
                      <p className="text-[10px] text-slate-400 leading-tight">{data.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Support & Resistance Levels */}
            <div className="grid grid-cols-2 gap-4">
              <div className="relative overflow-hidden rounded-xl border border-red-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-red-600/10 to-pink-600/10" />
                <div className="relative glass-panel p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-4 h-4 text-red-400" />
                    <p className="text-xs text-slate-400 font-bold">Expected Resistance</p>
                  </div>
                  <p className="text-3xl font-black text-red-400">{preMarketDecision.expectedResistance}</p>
                  <p className="text-xs text-slate-500 mt-2">Ceiling to watch</p>
                </div>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-green-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-green-600/10 to-emerald-600/10" />
                <div className="relative glass-panel p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-slate-400 font-bold">Expected Support</p>
                  </div>
                  <p className="text-3xl font-black text-green-400">{preMarketDecision.expectedSupport}</p>
                  <p className="text-xs text-slate-500 mt-2">Floor to watch</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 relative overflow-hidden rounded-2xl border-2 border-dashed border-slate-600 min-h-[500px]">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-slate-800/50" />
            <div className="relative h-full flex flex-col items-center justify-center p-8 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-slate-700/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative p-6 bg-slate-800/50 rounded-full border-2 border-slate-700">
                  <Brain className="w-16 h-16 text-slate-600" />
                </div>
              </div>
              <p className="text-lg font-bold text-slate-400 mb-2">No Analysis Generated Yet</p>
              <p className="text-sm text-slate-500 max-w-md">
                Upload chart screenshots and click "Generate Pre-Market Decision" to get AI-powered market insights
              </p>
            </div>
          </div>
        )}

        {/* RIGHT SIDEBAR - Confidence & Risk Metrics */}
        <div className="space-y-4">
          {preMarketDecision ? (
            <>
              {/* Confidence Score */}
              <div className="relative overflow-hidden rounded-xl border border-cyan-500/30">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/10 via-blue-600/10 to-indigo-600/10" />
                <div className="relative glass-panel p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-cyan-400" />
                    <p className="text-xs text-slate-400 font-bold">AI CONFIDENCE</p>
                  </div>
                  
                  <div className="mb-4">
                    <p className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                      {preMarketDecision.confidence}%
                    </p>
                    <p className="text-xs text-slate-500">
                      {preMarketDecision.confidence >= 80 ? 'Very High Confidence' :
                       preMarketDecision.confidence >= 60 ? 'High Confidence' :
                       preMarketDecision.confidence >= 40 ? 'Moderate Confidence' :
                       'Low Confidence'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 rounded-full transition-all"
                        style={{ width: `${preMarketDecision.confidence}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                      <span>0%</span>
                      <span>50%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Bias */}
              <div className={`relative overflow-hidden rounded-xl border ${
                preMarketDecision.primaryBias === 'LONG' ? 'border-green-500/40' :
                preMarketDecision.primaryBias === 'SHORT' ? 'border-red-500/40' :
                'border-slate-600/40'
              }`}>
                <div className={`absolute inset-0 ${
                  preMarketDecision.primaryBias === 'LONG' ? 'bg-gradient-to-br from-green-600/10 to-emerald-600/10' :
                  preMarketDecision.primaryBias === 'SHORT' ? 'bg-gradient-to-br from-red-600/10 to-pink-600/10' :
                  'bg-gradient-to-br from-slate-700/10 to-slate-600/10'
                }`} />
                <div className="relative glass-panel p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Crosshair size={16} className={
                      preMarketDecision.primaryBias === 'LONG' ? 'text-green-400' :
                      preMarketDecision.primaryBias === 'SHORT' ? 'text-red-400' :
                      'text-slate-400'
                    } />
                    <p className="text-xs text-slate-400 font-bold">PRIMARY BIAS</p>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    {preMarketDecision.primaryBias === 'LONG' ? (
                      <TrendingUp className="w-8 h-8 text-green-400" />
                    ) : preMarketDecision.primaryBias === 'SHORT' ? (
                      <TrendingDown className="w-8 h-8 text-red-400" />
                    ) : (
                      <Activity className="w-8 h-8 text-slate-400" />
                    )}
                    <p className={`text-3xl font-black ${
                      preMarketDecision.primaryBias === 'LONG' ? 'text-green-400' :
                      preMarketDecision.primaryBias === 'SHORT' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      {preMarketDecision.primaryBias}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">Bias Strength:</span>
                    <span className={`font-bold ${
                      preMarketDecision.primaryBias === 'LONG' ? 'text-green-400' :
                      preMarketDecision.primaryBias === 'SHORT' ? 'text-red-400' :
                      'text-slate-400'
                    }`}>
                      {preMarketDecision.biasStrength}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Risk Level */}
              <div className={`relative overflow-hidden rounded-xl border ${
                preMarketDecision.riskLevel === 'LOW' ? 'border-green-500/40' :
                preMarketDecision.riskLevel === 'HIGH' ? 'border-red-500/40' :
                'border-yellow-500/40'
              }`}>
                <div className={`absolute inset-0 ${
                  preMarketDecision.riskLevel === 'LOW' ? 'bg-gradient-to-br from-green-600/10 to-emerald-600/10' :
                  preMarketDecision.riskLevel === 'HIGH' ? 'bg-gradient-to-br from-red-600/10 to-pink-600/10' :
                  'bg-gradient-to-br from-yellow-600/10 to-orange-600/10'
                }`} />
                <div className="relative glass-panel p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertCircle className={`w-5 h-5 ${
                      preMarketDecision.riskLevel === 'LOW' ? 'text-green-400' :
                      preMarketDecision.riskLevel === 'HIGH' ? 'text-red-400' :
                      'text-yellow-400'
                    }`} />
                    <p className="text-xs text-slate-400 font-bold">RISK ASSESSMENT</p>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`px-3 py-1.5 rounded-lg ${
                      preMarketDecision.riskLevel === 'LOW' ? 'bg-green-500/20' :
                      preMarketDecision.riskLevel === 'HIGH' ? 'bg-red-500/20' :
                      'bg-yellow-500/20'
                    }`}>
                      <p className={`text-xl font-black ${
                        preMarketDecision.riskLevel === 'LOW' ? 'text-green-400' :
                        preMarketDecision.riskLevel === 'HIGH' ? 'text-red-400' :
                        'text-yellow-400'
                      }`}>
                        {preMarketDecision.riskLevel}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-300 leading-relaxed">{preMarketDecision.riskReason}</p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="relative overflow-hidden rounded-xl border border-slate-700/50">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-800/20 to-slate-700/20" />
                <div className="relative glass-panel p-4">
                  <p className="text-xs text-slate-400 font-bold mb-3">QUICK ACTIONS</p>
                  <div className="space-y-2">
                    <button
                      onClick={copyToClipboard}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold text-white transition-all"
                    >
                      <Copy size={14} />
                      Copy Analysis
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-bold text-white transition-all"
                    >
                      <Download size={14} />
                      Export Report
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="relative overflow-hidden rounded-xl border border-slate-700/50 min-h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 to-slate-800/50" />
              <div className="relative h-full flex flex-col items-center justify-center p-6 text-center">
                <Activity className="w-12 h-12 text-slate-600 mb-3" />
                <p className="text-sm text-slate-500">Metrics will appear here</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative max-w-4xl w-full">
            {/* Close Button */}
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-12 right-0 p-3 bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg hover:shadow-red-500/50 group"
            >
              <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
            </button>
            
            {/* Image Container */}
            <div className="glass-panel rounded-2xl overflow-hidden border-2 border-cyan-500/50 shadow-2xl">
              <img 
                src={previewImage} 
                alt="preview" 
                className="w-full h-auto max-h-[80vh] object-contain" 
              />
            </div>
          </div>
        </div>
      )}

      {/* ANALYSIS TIMELINE */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-700/50">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Activity Timeline</h3>
            <p className="text-xs text-slate-400">Last {logs.length} events</p>
          </div>
        </div>
        
        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
          {logs.length > 0 ? (
            logs.map((log, i) => (
              <div 
                key={i} 
                className="flex items-start gap-3 p-2.5 bg-slate-800/30 hover:bg-slate-800/50 rounded-lg transition-all group"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0 group-hover:scale-125 transition-transform" />
                <p className="text-xs text-slate-300 font-mono leading-relaxed flex-1">{log}</p>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">No activity yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PreMarketAnalyzer;
