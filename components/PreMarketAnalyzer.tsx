import React, { useState, useEffect } from 'react';
import { FyersCredentials, MarketSnapshot, EnrichedFyersQuote } from '../types';
import { imageStorageService } from '../services/imageStorage';
import {
  Brain, Zap, Clock, Lightbulb, X, Copy, Upload, Trash2, Loader2, 
  TrendingUp, TrendingDown, AlertCircle, CheckCircle2, BarChart2, Shield, Activity, RefreshCw
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
    <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white p-6 rounded-xl space-y-4 h-full overflow-y-auto">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-amber-900 via-orange-900 to-yellow-900 rounded-lg p-4 border border-amber-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Lightbulb className="w-6 h-6 text-yellow-400 animate-pulse" />
            <div>
              <h1 className="text-2xl font-black text-yellow-400">Pre-Market Decision</h1>
              <p className="text-xs text-gray-300">AI Chart Analysis + Live Data</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Generated:</p>
            <p className="text-sm font-mono text-yellow-300">
              {preMarketDecision?.generatedAtStr || 'No data'}
            </p>
          </div>
        </div>
      </div>

      {/* UPLOAD SECTION */}
      <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 space-y-3">
        <h3 className="font-bold text-cyan-400">📸 Chart Upload & Classification</h3>
        
        <label className="relative">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <div className="cursor-pointer bg-slate-700/50 hover:bg-slate-700 rounded-lg p-6 border-2 border-dashed border-slate-600 hover:border-cyan-400 transition-all text-center">
            <Upload className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
            <p className="text-sm font-bold text-gray-200">Click or drag to upload charts</p>
            <p className="text-xs text-gray-400">Multiple files supported</p>
          </div>
        </label>

        {/* Pending Images - For Classification */}
        {pendingImages.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-yellow-400">Pending Classification ({pendingImages.length})</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {pendingImages.map((imgData, idx) => (
                <div key={idx} className="bg-slate-700/30 rounded-lg border border-slate-600 overflow-hidden space-y-2">
                  <img src={imgData} alt="pending" className="w-full h-24 object-cover" />
                  <div className="px-2 pb-2 space-y-2">
                    <p className="text-xs text-gray-400">Select type:</p>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { type: '1H_CHART' as const, label: '1H', emoji: '📊' },
                        { type: 'OI_CHART' as const, label: 'OI', emoji: '📞' },
                        { type: '5DAY_CHART' as const, label: '5D', emoji: '📈' }
                      ].map(opt => (
                        <button
                          key={opt.type}
                          onClick={() => classifyImage(opt.type, idx)}
                          disabled={analyzingImage}
                          className={`text-xs font-bold py-1 rounded transition-all ${
                            analyzingImage
                              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                              : 'bg-cyan-600 hover:bg-cyan-700 text-white'
                          }`}
                        >
                          {analyzingImage ? '⏳' : `${opt.emoji} ${opt.label}`}
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

      {/* UPLOADED & CLASSIFIED IMAGES */}
      {uploadedImages.length > 0 && (
        <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 space-y-3">
          <h3 className="font-bold text-cyan-400">✅ Classified Charts ({uploadedImages.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {uploadedImages.map((img) => (
              <div key={img.filename} className="bg-slate-700/30 rounded-lg border border-slate-600 group hover:border-cyan-500/50 transition-all overflow-hidden">
                {/* Image Preview */}
                <button
                  onClick={() => setPreviewImage(img.data)}
                  className="w-full h-28 bg-slate-600 hover:bg-slate-500 transition-all flex items-center justify-center overflow-hidden cursor-pointer"
                >
                  <img src={img.data} alt={img.type || 'chart'} className="w-full h-full object-cover" />
                </button>

                {/* Info Section */}
                <div className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <p className="text-xs font-bold text-cyan-400">
                      {img.type === '1H_CHART' ? '📊 1H Chart' : img.type === 'OI_CHART' ? '📞 OI Flow' : '📈 5-Day'}
                    </p>
                    <button
                      onClick={() => removeImage(img.filename)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3 text-red-400 hover:text-red-300" />
                    </button>
                  </div>
                  
                  {/* AI Insights */}
                  <p className="text-xs text-gray-300 line-clamp-3 leading-tight">{img.aiInsights}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={generatePreMarketDecision}
          disabled={isGenerating || historyLog.length < 30}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm ${
            isGenerating ? 'bg-gray-600 text-gray-400' : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate Decision
            </>
          )}
        </button>

        {preMarketDecision && (
          <>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-blue-600 hover:bg-blue-700"
            >
              <Copy className="w-4 h-4" />
              Copy Data
            </button>
            <button
              onClick={clearDecision}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm bg-red-600 hover:bg-red-700 ml-auto"
            >
              <X className="w-4 h-4" />
              Reset
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* MAIN DECISION */}
        {preMarketDecision ? (
          <div className="lg:col-span-2 space-y-4">
            {/* AI Summary */}
            <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/30">
              <p className="text-xs text-gray-400 mb-2">AI SUMMARY</p>
              <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-line">{preMarketDecision.aiSummary}</p>
            </div>

            {/* Core Metrics */}
            <div className={`rounded-lg p-5 border-2 ${
              preMarketDecision.openSentiment === 'BULLISH' ? 'bg-green-900/40 border-green-400/60' :
              preMarketDecision.openSentiment === 'BEARISH' ? 'bg-red-900/40 border-red-400/60' :
              'bg-slate-800/40 border-slate-600/60'
            }`}>
              <div className="mb-4">
                <p className="text-sm text-gray-400">Current LTP</p>
                <p className="text-3xl font-black text-cyan-400">{preMarketDecision.niftyLtp.toFixed(0)}</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-gray-400">Yesterday</p>
                  <p className="text-lg font-bold">{preMarketDecision.yesterdayClose.toFixed(0)}</p>
                </div>
                <div className="bg-slate-700/50 rounded p-3">
                  <p className="text-xs text-gray-400">24h Range</p>
                  <p className="text-lg font-bold text-yellow-400">±{preMarketDecision.range24h.toFixed(0)}</p>
                </div>
                <div className={`rounded p-3 ${preMarketDecision.openSentiment === 'BULLISH' ? 'bg-green-900/50' : preMarketDecision.openSentiment === 'BEARISH' ? 'bg-red-900/50' : 'bg-slate-700/50'}`}>
                  <p className="text-xs text-gray-400">Sentiment</p>
                  <p className={`text-lg font-bold ${preMarketDecision.openSentiment === 'BULLISH' ? 'text-green-400' : preMarketDecision.openSentiment === 'BEARISH' ? 'text-red-400' : 'text-gray-400'}`}>
                    {preMarketDecision.openSentiment}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Strength</p>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full ${preMarketDecision.sentimentStrength > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.min(Math.abs(preMarketDecision.sentimentStrength), 100)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Scenarios */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'flat', emoji: '➡️', label: 'Flat' },
                { key: 'gapUp', emoji: '📈', label: 'Gap Up' },
                { key: 'gapDown', emoji: '📉', label: 'Gap Down' }
              ].map(scenario => {
                const data = preMarketDecision.scenarios[scenario.key as keyof typeof preMarketDecision.scenarios];
                return (
                  <div key={scenario.key} className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold">{scenario.emoji} {scenario.label}</p>
                      <p className="text-lg font-black text-cyan-400">{data.probability}%</p>
                    </div>
                    <p className="text-xs text-gray-400">{data.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Expected Levels */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-red-900/30 rounded-lg p-4 border border-red-500/30">
                <p className="text-xs text-gray-400 mb-1">Resistance</p>
                <p className="text-2xl font-black text-red-400">{preMarketDecision.expectedResistance}</p>
              </div>
              <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30">
                <p className="text-xs text-gray-400 mb-1">Support</p>
                <p className="text-2xl font-black text-green-400">{preMarketDecision.expectedSupport}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 bg-slate-800/40 rounded-lg p-8 border-2 border-dashed border-slate-600 flex items-center justify-center min-h-80">
            <div className="text-center">
              <Brain className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Upload charts & click Generate Decision</p>
            </div>
          </div>
        )}

        {/* RIGHT PANEL */}
        <div className="space-y-3">
          {preMarketDecision ? (
            <>
              <div className="bg-gradient-to-br from-cyan-900/50 to-blue-900/50 rounded-lg p-4 border border-cyan-500/30">
                <p className="text-xs text-gray-400 mb-2">CONFIDENCE</p>
                <p className="text-4xl font-black text-cyan-400 mb-3">{preMarketDecision.confidence}%</p>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-cyan-500"
                    style={{ width: `${preMarketDecision.confidence}%` }}
                  />
                </div>
              </div>

              <div className={`rounded-lg p-4 border ${
                preMarketDecision.primaryBias === 'LONG' ? 'bg-green-900/40 border-green-500/40' :
                preMarketDecision.primaryBias === 'SHORT' ? 'bg-red-900/40 border-red-500/40' :
                'bg-slate-800/40 border-slate-600/40'
              }`}>
                <p className="text-xs text-gray-400 mb-2">PRIMARY BIAS</p>
                <p className={`text-2xl font-black ${
                  preMarketDecision.primaryBias === 'LONG' ? 'text-green-400' :
                  preMarketDecision.primaryBias === 'SHORT' ? 'text-red-400' :
                  'text-gray-400'
                }`}>
                  {preMarketDecision.primaryBias}
                </p>
              </div>

              <div className={`rounded-lg p-4 border ${
                preMarketDecision.riskLevel === 'LOW' ? 'bg-green-900/40 border-green-500/40' :
                preMarketDecision.riskLevel === 'HIGH' ? 'bg-red-900/40 border-red-500/40' :
                'bg-yellow-900/40 border-yellow-500/40'
              }`}>
                <p className="text-xs text-gray-400 mb-2">RISK</p>
                <p className={`text-lg font-black ${
                  preMarketDecision.riskLevel === 'LOW' ? 'text-green-400' :
                  preMarketDecision.riskLevel === 'HIGH' ? 'text-red-400' :
                  'text-yellow-400'
                }`}>
                  {preMarketDecision.riskLevel}
                </p>
                <p className="text-xs text-gray-300 mt-2">{preMarketDecision.riskReason}</p>
              </div>
            </>
          ) : (
            <div className="bg-slate-800/40 rounded-lg p-6 text-center text-gray-500 text-sm min-h-80 flex items-center justify-center">
              <Activity className="w-10 h-10 text-slate-600" />
            </div>
          )}
        </div>
      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-lg max-w-2xl max-h-96 overflow-hidden border border-cyan-500/50">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-red-600 hover:bg-red-700 p-2 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
            <img src={previewImage} alt="preview" className="w-full h-full object-contain" />
          </div>
        </div>
      )}

      {/* ANALYSIS LOG */}
      <div className="bg-slate-800/40 rounded-lg p-4 border border-slate-700/50 max-h-32 overflow-y-auto">
        <h3 className="font-bold text-yellow-400 mb-2 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Timeline
        </h3>
        <div className="space-y-1 text-xs">
          {logs.map((log, i) => (
            <p key={i} className="text-gray-300 font-mono">{log}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PreMarketAnalyzer;
