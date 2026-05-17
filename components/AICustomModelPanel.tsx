/**
 * AI CUSTOM MODEL PANEL
 * 
 * UI component for AI-powered predictions
 * Shows AI reasoning, confidence, and learning stats
 */

import React, { useState, useEffect } from 'react';
import { Brain, Activity, TrendingUp, TrendingDown, AlertCircle, Target, Zap, BarChart3, RefreshCw } from 'lucide-react';
import { aiDecisionEngine } from '../services/aiDecisionEngine';
import { tradingMemory } from '../services/tradingMemory';
import { FyersCredentials, MarketSnapshot } from '../types';

interface Props {
  credentials: FyersCredentials;
  currentSnapshot: MarketSnapshot | null;
  historyLog: MarketSnapshot[];
}

export const AICustomModelPanel: React.FC<Props> = ({ 
  credentials, 
  currentSnapshot, 
  historyLog 
}) => {
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Load stats on mount
  useEffect(() => {
    loadStats();
  }, []);
  
  // Auto-refresh prediction
  useEffect(() => {
    if (!currentSnapshot || !credentials.aiEnabled) return;
    
    makePrediction();
    
    // Refresh every 2 minutes
    const interval = setInterval(makePrediction, 120000);
    return () => clearInterval(interval);
  }, [currentSnapshot, credentials.aiEnabled]);
  
  const loadStats = async () => {
    try {
      const memoryStats = await tradingMemory.getStats();
      setStats(memoryStats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };
  
  const makePrediction = async () => {
    if (!currentSnapshot || !credentials.aiEnabled) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const pred = await aiDecisionEngine.makePrediction(
        credentials,
        currentSnapshot,
        historyLog
      );
      setPrediction(pred);
      await loadStats(); // Refresh stats after new prediction
    } catch (err: any) {
      console.error('Prediction error:', err);
      setError(err.message || 'Failed to get prediction');
    } finally {
      setLoading(false);
    }
  };
  
  if (!credentials.aiEnabled) {
    return (
      <div className="bg-gray-800 p-4 rounded-lg border border-yellow-500/30">
        <div className="flex items-center gap-2 text-yellow-400 mb-2">
          <AlertCircle size={20} />
          <span className="font-bold">AI Disabled</span>
        </div>
        <p className="text-sm text-gray-400">
          Enable AI in settings to use Custom Model predictions
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {/* Model Stats */}
      {stats && stats.totalPatterns > 0 && (
        <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3">
          <h4 className="text-sm font-bold mb-2 text-blue-300 flex items-center gap-2">
            <BarChart3 size={14} />
            Custom Model Stats
          </h4>
          <div className="grid grid-cols-4 gap-2 text-xs">
            <div>
              <div className="text-gray-400">Patterns</div>
              <div className="font-bold text-white">{stats.totalPatterns}</div>
            </div>
            <div>
              <div className="text-gray-400">Accuracy</div>
              <div className="font-bold text-green-400">{stats.accuracy}%</div>
            </div>
            <div>
              <div className="text-gray-400">Recent</div>
              <div className="font-bold text-blue-400">{stats.recentAccuracy}%</div>
            </div>
            <div>
              <div className="text-gray-400">Confidence</div>
              <div className="font-bold text-yellow-400">{stats.avgConfidence}%</div>
            </div>
          </div>
        </div>
      )}
      
      {/* Prediction Panel */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Brain size={20} className="text-purple-400" />
              AI Custom Model
            </h3>
            {loading && (
              <Activity className="animate-spin text-purple-400" size={16} />
            )}
          </div>
          
          {error && (
            <div className="mb-3 p-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400">
              {error}
            </div>
          )}
          
          {prediction ? (
            <div>
              {/* Direction */}
              <div className={`text-3xl font-bold mb-3 flex items-center gap-2 ${
                prediction.direction === 'UP' ? 'text-green-400' :
                prediction.direction === 'DOWN' ? 'text-red-400' :
                'text-yellow-400'
              }`}>
                {prediction.direction === 'UP' ? (
                  <>
                    <TrendingUp size={32} />
                    BULLISH
                  </>
                ) : prediction.direction === 'DOWN' ? (
                  <>
                    <TrendingDown size={32} />
                    BEARISH
                  </>
                ) : (
                  <>
                    <Activity size={32} />
                    NEUTRAL
                  </>
                )}
              </div>
              
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="text-xs text-gray-400 mb-1">Confidence</div>
                  <div className="text-2xl font-bold text-white">
                    {prediction.confidence}%
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        prediction.confidence >= 80 ? 'bg-green-500' :
                        prediction.confidence >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${prediction.confidence}%` }}
                    />
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="text-xs text-gray-400 mb-1">Expected Move</div>
                  <div className={`text-2xl font-bold ${
                    prediction.expectedMove > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {prediction.expectedMove > 0 ? '+' : ''}{prediction.expectedMove.toFixed(0)} pts
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="text-xs text-gray-400 mb-1">Risk Level</div>
                  <div className={`text-lg font-bold flex items-center gap-1 ${
                    prediction.riskLevel === 'LOW' ? 'text-green-400' :
                    prediction.riskLevel === 'MEDIUM' ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {prediction.riskLevel === 'LOW' ? '🟢' : 
                     prediction.riskLevel === 'MEDIUM' ? '🟡' : '🔴'}
                    {prediction.riskLevel}
                  </div>
                </div>
                
                <div className="bg-gray-900/50 p-3 rounded">
                  <div className="text-xs text-gray-400 mb-1">Momentum</div>
                  <div className={`text-lg font-bold ${
                    prediction.supportingData.momentum > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {prediction.supportingData.momentum > 0 ? '+' : ''}
                    {prediction.supportingData.momentum.toFixed(0)} pts
                  </div>
                </div>
              </div>
              
              {/* AI Reasoning */}
              <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mb-3">
                <div className="text-xs text-purple-300 mb-1 flex items-center gap-2">
                  <Zap size={12} />
                  AI Reasoning:
                </div>
                <div className="text-sm text-white leading-relaxed">
                  {prediction.reasoning}
                </div>
              </div>
              
              {/* Supporting Data */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="bg-gray-900/50 p-2 rounded">
                  <div className="text-gray-400">Similar Patterns</div>
                  <div className="font-bold text-white">
                    {prediction.supportingData.similarPatterns}
                  </div>
                </div>
                <div className="bg-gray-900/50 p-2 rounded">
                  <div className="text-gray-400">Sentiment Trend</div>
                  <div className="font-bold text-white truncate">
                    {prediction.supportingData.sentimentTrend}
                  </div>
                </div>
              </div>
              
              {/* Refresh Button */}
              <button
                onClick={makePrediction}
                disabled={loading}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold rounded transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                {loading ? 'Analyzing...' : 'Refresh Prediction'}
              </button>
            </div>
          ) : !currentSnapshot ? (
            <div className="text-center py-8 text-gray-500">
              <Brain size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-sm">Waiting for live market data...</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <button
                onClick={makePrediction}
                disabled={loading}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white font-bold rounded-lg transition-all flex items-center gap-2 mx-auto"
              >
                {loading ? (
                  <>
                    <Activity className="animate-spin" size={20} />
                    Getting Prediction...
                  </>
                ) : (
                  <>
                    <Target size={20} />
                    Get AI Prediction
                  </>
                )}
              </button>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-4 py-2 bg-gray-900/50 border-t border-gray-700 text-xs text-gray-500 flex items-center justify-between">
          <span>
            Powered by {credentials.aiProvider || 'Gemini'}
          </span>
          <span>
            Using {credentials.geminiModel || credentials.groqModel || credentials.claudeModel || 'default model'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AICustomModelPanel;
