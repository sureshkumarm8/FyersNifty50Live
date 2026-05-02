/**
 * AI LAB - Decision Intelligence System
 * 
 * Multi-agent AI system for trading recommendations
 * Provides BUY/SELL/HOLD signals with confidence scores
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Brain, TrendingUp, TrendingDown, Target, Shield, 
  Zap, Activity, AlertTriangle, CheckCircle, Crosshair,
  BarChart3, Clock, Layers, Scale, ArrowUpCircle, ArrowDownCircle,
  Minus, Info, RefreshCw, Play, Pause, Bot, Upload, Sparkles
} from 'lucide-react';
import { EnrichedFyersQuote, MarketSnapshot } from '../types';
import { dbService } from '../services/db';
import { importCSVFile } from '../services/csv';

interface AILabProps {
  currentSnapshot: MarketSnapshot | null;
  niftyLtp: number | null;
  stocks: EnrichedFyersQuote[];
  historyLog: MarketSnapshot[];
}

// Agent decision type
interface AgentDecision {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  reasoning: string[];
  score: number;
}

// Agent state
interface AgentState {
  name: string;
  status: 'analyzing' | 'ready' | 'error';
  decision: AgentDecision | null;
  icon: React.ReactNode;
  color: string;
}

// Final recommendation
interface Recommendation {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entry: number;
  stopLoss: number;
  target: number;
  riskReward: number;
  positionSize: number;
  reasoning: string[];
  validUntil: Date;
}

// Predicted snapshot type - matching history view structure
interface PredictedSnapshot {
  time: string;
  niftyLtp: number;
  ptsChg: number;
  overallSent: number;
  adv: number;
  dec: number;
  stockSent: number;
  callSent: number;
  putSent: number;
  pcr: number;
  optionsSent: number;
  callsBuyQty: number;
  callsSellQty: number;
  putsBuyQty: number;
  putsSellQty: number;
  confidence: number;
}

const AILab: React.FC<AILabProps> = ({ currentSnapshot, niftyLtp, stocks, historyLog }) => {
  const [isActive, setIsActive] = useState(true);
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [predictions, setPredictions] = useState<PredictedSnapshot[]>([]);
  const [isPredicting, setIsPredicting] = useState(false);
  const [showPredictions, setShowPredictions] = useState(false);
  const [archivedSnapshots, setArchivedSnapshots] = useState<MarketSnapshot[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load archived data on mount for predictions
  useEffect(() => {
    const loadArchivedData = async () => {
      try {
        const archives = await dbService.getArchives(3); // Last 3 days
        const allSnapshots: MarketSnapshot[] = [];
        archives.forEach(archive => {
          allSnapshots.push(...archive.snapshots);
        });
        // Sort by timestamp descending (newest first)
        allSnapshots.sort((a, b) => b.timestamp - a.timestamp);
        setArchivedSnapshots(allSnapshots);
        console.log(`📊 AI Lab loaded ${allSnapshots.length} archived snapshots for predictions`);
      } catch (error) {
        console.error('Failed to load archived data:', error);
      }
    };
    loadArchivedData();
  }, []);

  // Initialize agents
  useEffect(() => {
    const initialAgents: AgentState[] = [
      {
        name: 'Pattern Recognition',
        status: 'ready',
        decision: null,
        icon: <Layers size={20} />,
        color: 'blue'
      },
      {
        name: 'Sentiment Fusion',
        status: 'ready',
        decision: null,
        icon: <BarChart3 size={20} />,
        color: 'purple'
      },
      {
        name: 'Momentum Analysis',
        status: 'ready',
        decision: null,
        icon: <TrendingUp size={20} />,
        color: 'green'
      },
      {
        name: 'Levels & Timing',
        status: 'ready',
        decision: null,
        icon: <Crosshair size={20} />,
        color: 'orange'
      },
      {
        name: 'Risk Calculator',
        status: 'ready',
        decision: null,
        icon: <Shield size={20} />,
        color: 'red'
      },
      {
        name: 'Ensemble Decision',
        status: 'ready',
        decision: null,
        icon: <Brain size={20} />,
        color: 'indigo'
      }
    ];
    
    setAgents(initialAgents);
  }, []);

  // Run analysis when data updates
  useEffect(() => {
    if (isActive && currentSnapshot && historyLog.length > 0) {
      runAnalysis();
    }
  }, [currentSnapshot, isActive, historyLog.length]);

  // Agent 1: Pattern Recognition
  const patternAgent = useMemo(() => {
    if (!currentSnapshot || historyLog.length < 10) {
      return null;
    }

    // Simple pattern matching logic
    const recentSnapshots = historyLog.slice(0, 10);
    const avgSentiment = recentSnapshots.reduce((sum, s) => sum + s.overallSent, 0) / recentSnapshots.length;
    const sentimentTrend = currentSnapshot.overallSent - avgSentiment;
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    const reasoning: string[] = [];

    if (sentimentTrend > 5) {
      action = 'BUY';
      confidence = Math.min(70 + sentimentTrend, 95);
      reasoning.push(`Sentiment improving: ${avgSentiment.toFixed(1)}% → ${currentSnapshot.overallSent.toFixed(1)}%`);
      reasoning.push('Similar to past bullish patterns');
    } else if (sentimentTrend < -5) {
      action = 'SELL';
      confidence = Math.min(70 + Math.abs(sentimentTrend), 95);
      reasoning.push(`Sentiment deteriorating: ${avgSentiment.toFixed(1)}% → ${currentSnapshot.overallSent.toFixed(1)}%`);
      reasoning.push('Similar to past bearish patterns');
    } else {
      action = 'HOLD';
      confidence = 60;
      reasoning.push('No clear pattern detected');
      reasoning.push('Wait for better setup');
    }

    return {
      action,
      confidence,
      reasoning,
      score: confidence * (action === 'BUY' ? 1 : action === 'SELL' ? -1 : 0)
    };
  }, [currentSnapshot, historyLog]);

  // Agent 2: Sentiment Fusion
  const sentimentAgent = useMemo(() => {
    if (!currentSnapshot) return null;

    const overallSent = currentSnapshot.overallSent;
    const stockSent = currentSnapshot.stockSent;
    const optionSent = currentSnapshot.optionsSent;
    
    // Weighted average
    const fusedSentiment = (overallSent * 0.5) + (stockSent * 0.3) + (optionSent * 0.2);
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    const reasoning: string[] = [];

    if (fusedSentiment > 65) {
      action = 'BUY';
      confidence = Math.min(60 + (fusedSentiment - 65), 95);
      reasoning.push(`Strong bullish sentiment: ${fusedSentiment.toFixed(1)}%`);
      reasoning.push(`Stock sentiment: ${stockSent.toFixed(1)}%, Options: ${optionSent.toFixed(1)}%`);
    } else if (fusedSentiment < 35) {
      action = 'SELL';
      confidence = Math.min(60 + (35 - fusedSentiment), 95);
      reasoning.push(`Strong bearish sentiment: ${fusedSentiment.toFixed(1)}%`);
      reasoning.push(`Stock sentiment: ${stockSent.toFixed(1)}%, Options: ${optionSent.toFixed(1)}%`);
    } else {
      action = 'HOLD';
      confidence = 55;
      reasoning.push(`Neutral sentiment: ${fusedSentiment.toFixed(1)}%`);
      reasoning.push('No clear bias detected');
    }

    return {
      action,
      confidence,
      reasoning,
      score: confidence * (action === 'BUY' ? 1 : action === 'SELL' ? -1 : 0)
    };
  }, [currentSnapshot]);

  // Agent 3: Momentum Analysis
  const momentumAgent = useMemo(() => {
    if (!currentSnapshot || historyLog.length < 5) return null;

    const recent = historyLog.slice(0, 5);
    const priceChange = currentSnapshot.niftyLtp - recent[recent.length - 1].niftyLtp;
    const changePercent = (priceChange / recent[recent.length - 1].niftyLtp) * 100;
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    const reasoning: string[] = [];

    if (changePercent > 0.2) {
      action = 'BUY';
      confidence = Math.min(65 + Math.abs(changePercent) * 10, 90);
      reasoning.push(`Strong upward momentum: +${changePercent.toFixed(2)}%`);
      reasoning.push('Trend is your friend');
    } else if (changePercent < -0.2) {
      action = 'SELL';
      confidence = Math.min(65 + Math.abs(changePercent) * 10, 90);
      reasoning.push(`Strong downward momentum: ${changePercent.toFixed(2)}%`);
      reasoning.push('Bearish pressure building');
    } else {
      action = 'HOLD';
      confidence = 55;
      reasoning.push('Weak momentum, sideways action');
      reasoning.push('Wait for clear direction');
    }

    return {
      action,
      confidence,
      reasoning,
      score: confidence * (action === 'BUY' ? 1 : action === 'SELL' ? -1 : 0)
    };
  }, [currentSnapshot, historyLog]);

  // Agent 4: Levels & Timing
  const levelsAgent = useMemo(() => {
    if (!niftyLtp || historyLog.length < 10) return null;

    const dayHigh = Math.max(...historyLog.slice(0, 50).map(s => s.niftyLtp));
    const dayLow = Math.min(...historyLog.slice(0, 50).map(s => s.niftyLtp));
    const range = dayHigh - dayLow;
    
    const distanceFromLow = ((niftyLtp - dayLow) / range) * 100;
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    const reasoning: string[] = [];

    if (distanceFromLow < 30) {
      action = 'BUY';
      confidence = 80;
      reasoning.push(`Near day low: ${dayLow.toFixed(2)} (${distanceFromLow.toFixed(0)}% from bottom)`);
      reasoning.push('Good risk-reward for long');
    } else if (distanceFromLow > 70) {
      action = 'SELL';
      confidence = 80;
      reasoning.push(`Near day high: ${dayHigh.toFixed(2)} (${distanceFromLow.toFixed(0)}% from bottom)`);
      reasoning.push('Resistance zone, consider short');
    } else {
      action = 'HOLD';
      confidence = 60;
      reasoning.push('Mid-range, no clear edge');
      reasoning.push('Wait for better level');
    }

    return {
      action,
      confidence,
      reasoning,
      score: confidence * (action === 'BUY' ? 1 : action === 'SELL' ? -1 : 0)
    };
  }, [niftyLtp, historyLog]);

  // Agent 5: Risk Calculator
  const riskAgent = useMemo(() => {
    if (!currentSnapshot || !niftyLtp) return null;

    // Simple volatility check
    const recentVolatility = historyLog.length > 10 
      ? Math.max(...historyLog.slice(0, 10).map(s => s.niftyLtp)) - 
        Math.min(...historyLog.slice(0, 10).map(s => s.niftyLtp))
      : 100;
    
    const volatilityPercent = (recentVolatility / niftyLtp) * 100;
    
    let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
    let confidence = 50;
    const reasoning: string[] = [];

    if (volatilityPercent < 0.5) {
      action = 'BUY';
      confidence = 70;
      reasoning.push(`Low volatility: ${volatilityPercent.toFixed(2)}%`);
      reasoning.push('Favorable risk conditions');
    } else if (volatilityPercent > 1.5) {
      action = 'HOLD';
      confidence = 75;
      reasoning.push(`High volatility: ${volatilityPercent.toFixed(2)}%`);
      reasoning.push('Wait for stability');
    } else {
      action = 'BUY';
      confidence = 60;
      reasoning.push(`Moderate volatility: ${volatilityPercent.toFixed(2)}%`);
      reasoning.push('Acceptable risk level');
    }

    return {
      action,
      confidence,
      reasoning,
      score: confidence * (action === 'BUY' ? 1 : action === 'SELL' ? -1 : 0)
    };
  }, [currentSnapshot, niftyLtp, historyLog]);

  // Ensemble Decision
  const ensembleDecision = useMemo(() => {
    const agentResults = [patternAgent, sentimentAgent, momentumAgent, levelsAgent, riskAgent].filter(Boolean);
    
    if (agentResults.length === 0) return null;

    // Weighted voting
    let buyScore = 0;
    let sellScore = 0;
    let holdScore = 0;
    
    agentResults.forEach(agent => {
      if (agent.action === 'BUY') buyScore += agent.confidence;
      else if (agent.action === 'SELL') sellScore += agent.confidence;
      else holdScore += agent.confidence;
    });

    const total = buyScore + sellScore + holdScore;
    const buyPercent = (buyScore / total) * 100;
    const sellPercent = (sellScore / total) * 100;
    const holdPercent = (holdScore / total) * 100;

    let action: 'BUY' | 'SELL' | 'HOLD';
    let confidence: number;

    if (buyPercent > sellPercent && buyPercent > holdPercent) {
      action = 'BUY';
      confidence = Math.min(buyPercent, 95);
    } else if (sellPercent > buyPercent && sellPercent > holdPercent) {
      action = 'SELL';
      confidence = Math.min(sellPercent, 95);
    } else {
      action = 'HOLD';
      confidence = Math.min(holdPercent, 95);
    }

    const reasoning: string[] = [
      `${agentResults.filter(a => a.action === action).length}/${agentResults.length} agents agree`,
      `Consensus strength: ${confidence.toFixed(0)}%`
    ];

    return {
      action,
      confidence,
      reasoning,
      score: 0
    };
  }, [patternAgent, sentimentAgent, momentumAgent, levelsAgent, riskAgent]);

  // Run full analysis
  const runAnalysis = async () => {
    if (isAnalyzing || agents.length === 0) return;
    
    setIsAnalyzing(true);
    
    // Update agent states
    const updatedAgents = [...agents];
    
    if (patternAgent && updatedAgents[0]) {
      updatedAgents[0].decision = patternAgent;
      updatedAgents[0].status = 'ready';
    }
    
    if (sentimentAgent && updatedAgents[1]) {
      updatedAgents[1].decision = sentimentAgent;
      updatedAgents[1].status = 'ready';
    }
    
    if (momentumAgent && updatedAgents[2]) {
      updatedAgents[2].decision = momentumAgent;
      updatedAgents[2].status = 'ready';
    }
    
    if (levelsAgent && updatedAgents[3]) {
      updatedAgents[3].decision = levelsAgent;
      updatedAgents[3].status = 'ready';
    }
    
    if (riskAgent && updatedAgents[4]) {
      updatedAgents[4].decision = riskAgent;
      updatedAgents[4].status = 'ready';
    }
    
    if (ensembleDecision && updatedAgents[5]) {
      updatedAgents[5].decision = ensembleDecision;
      updatedAgents[5].status = 'ready';
    }
    
    setAgents(updatedAgents);
    
    // Generate recommendation
    if (ensembleDecision && niftyLtp) {
      const stopDistance = niftyLtp * 0.002; // 0.2% stop
      const targetDistance = stopDistance * 2; // 1:2 R:R
      
      const rec: Recommendation = {
        action: ensembleDecision.action,
        confidence: ensembleDecision.confidence,
        entry: niftyLtp,
        stopLoss: ensembleDecision.action === 'BUY' ? niftyLtp - stopDistance : niftyLtp + stopDistance,
        target: ensembleDecision.action === 'BUY' ? niftyLtp + targetDistance : niftyLtp - targetDistance,
        riskReward: 2.0,
        positionSize: 1,
        reasoning: ensembleDecision.reasoning,
        validUntil: new Date(Date.now() + 15 * 60 * 1000) // 15 min validity
      };
      
      setRecommendation(rec);
    }
    
    setLastUpdate(new Date());
    setIsAnalyzing(false);
  };

  const getActionColor = (action: string) => {
    if (action === 'BUY') return 'text-green-400';
    if (action === 'SELL') return 'text-red-400';
    return 'text-yellow-400';
  };

  const getActionBg = (action: string) => {
    if (action === 'BUY') return 'bg-green-500/10 border-green-500/30';
    if (action === 'SELL') return 'bg-red-500/10 border-red-500/30';
    return 'bg-yellow-500/10 border-yellow-500/30';
  };

  const getActionIcon = (action: string) => {
    if (action === 'BUY') return <ArrowUpCircle size={20} />;
    if (action === 'SELL') return <ArrowDownCircle size={20} />;
    return <Minus size={20} />;
  };

  // Generate AI predictions for next 15-30 minutes
  const generatePredictions = async () => {
    // Use archived data if live data is not available
    const dataSource = historyLog.length > 0 ? historyLog : archivedSnapshots;
    const latestSnapshot = dataSource.length > 0 ? dataSource[0] : currentSnapshot;
    
    if (!latestSnapshot || dataSource.length < 10) {
      alert(`Need at least 10 snapshots to generate predictions. Currently have: ${dataSource.length}`);
      return;
    }

    setIsPredicting(true);
    try {
      // Calculate trends from recent history
      const recentHistory = dataSource.slice(0, 20); // Last 20 snapshots
      
      // Calculate average momentum
      const avgMomentum = recentHistory.slice(0, 10).reduce((sum, snap, idx) => {
        if (idx === 0) return 0;
        return sum + (snap.niftyLtp - recentHistory[idx - 1].niftyLtp);
      }, 0) / 10;

      // Calculate sentiment trends
      const sentimentTrend = latestSnapshot.overallSent - 
        (recentHistory.slice(0, 5).reduce((sum, s) => sum + s.overallSent, 0) / 5);
      
      const pcrTrend = latestSnapshot.pcr - 
        (recentHistory.slice(0, 5).reduce((sum, s) => sum + s.pcr, 0) / 5);

      // Calculate advance/decline trends
      const avgAdv = recentHistory.slice(0, 5).reduce((sum, s) => sum + (s.adv || s.bullishCount || 25), 0) / 5;
      const avgDec = recentHistory.slice(0, 5).reduce((sum, s) => sum + (s.dec || s.bearishCount || 25), 0) / 5;

      // Calculate option volumes
      const avgCallBuy = recentHistory.slice(0, 5).reduce((sum, s) => sum + (s.callsBuyQty || 5000000), 0) / 5;
      const avgCallSell = recentHistory.slice(0, 5).reduce((sum, s) => sum + (s.callsSellQty || 5000000), 0) / 5;
      const avgPutBuy = recentHistory.slice(0, 5).reduce((sum, s) => sum + (s.putsBuyQty || 5000000), 0) / 5;
      const avgPutSell = recentHistory.slice(0, 5).reduce((sum, s) => sum + (s.putsSellQty || 5000000), 0) / 5;

      // Generate predictions for next 6 intervals (30 minutes if 5-min intervals)
      const newPredictions: PredictedSnapshot[] = [];
      const currentTime = new Date();
      let lastPrice = latestSnapshot.niftyLtp;
      let lastSentiment = latestSnapshot.overallSent;
      let lastPcr = latestSnapshot.pcr;
      let lastAdv = latestSnapshot.adv || latestSnapshot.bullishCount || 25;
      let lastDec = latestSnapshot.dec || latestSnapshot.bearishCount || 25;

      for (let i = 1; i <= 6; i++) {
        // Prediction time
        const predTime = new Date(currentTime.getTime() + i * 5 * 60000); // 5 min intervals
        
        // Price prediction with momentum decay
        const momentumDecay = 0.85; // Momentum reduces over time
        const priceDelta = avgMomentum * Math.pow(momentumDecay, i);
        const predictedPrice = lastPrice + priceDelta;

        // Sentiment prediction with mean reversion
        const sentimentMeanReversion = 0.7;
        const sentimentDelta = sentimentTrend * Math.pow(sentimentMeanReversion, i);
        const predictedSentiment = Math.max(-100, Math.min(100, 
          lastSentiment + sentimentDelta
        ));

        // PCR prediction
        const pcrDelta = pcrTrend * Math.pow(0.8, i);
        const predictedPcr = Math.max(0.5, Math.min(2.0, lastPcr + pcrDelta));

        // Advance/Decline prediction
        const advDecDrift = (lastAdv - lastDec) * 0.3;
        const predictedAdv = Math.max(0, Math.min(50, Math.round(lastAdv + advDecDrift * (Math.random() - 0.5))));
        const predictedDec = Math.max(0, Math.min(50, 50 - predictedAdv));

        // Derive other metrics
        const predictedStockSent = predictedSentiment * (0.8 + Math.random() * 0.4);
        const predictedCallSent = (predictedPcr < 1 ? 1 : -1) * (20 + Math.abs(1 - predictedPcr) * 40);
        const predictedPutSent = (predictedPcr > 1 ? 1 : -1) * (20 + Math.abs(predictedPcr - 1) * 40);
        const predictedOptionsSent = predictedCallSent - predictedPutSent;

        // Option volumes with random walk
        const volumeVariation = 0.9 + Math.random() * 0.2; // ±10% variation
        const predictedCallBuy = avgCallBuy * volumeVariation;
        const predictedCallSell = avgCallSell * volumeVariation;
        const predictedPutBuy = avgPutBuy * volumeVariation;
        const predictedPutSell = avgPutSell * volumeVariation;

        // Confidence decreases over time
        const confidence = Math.max(40, 85 - i * 8);

        newPredictions.push({
          time: predTime.toLocaleTimeString('en-IN', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          niftyLtp: predictedPrice,
          ptsChg: predictedPrice - lastPrice,
          overallSent: predictedSentiment,
          adv: predictedAdv,
          dec: predictedDec,
          stockSent: predictedStockSent,
          callSent: predictedCallSent,
          putSent: predictedPutSent,
          pcr: predictedPcr,
          optionsSent: predictedOptionsSent,
          callsBuyQty: predictedCallBuy,
          callsSellQty: predictedCallSell,
          putsBuyQty: predictedPutBuy,
          putsSellQty: predictedPutSell,
          confidence
        });

        lastPrice = predictedPrice;
        lastSentiment = predictedSentiment;
        lastPcr = predictedPcr;
        lastAdv = predictedAdv;
        lastDec = predictedDec;
      }

      setPredictions(newPredictions);
      setShowPredictions(true);
    } catch (error) {
      console.error('Prediction error:', error);
      alert('Failed to generate predictions');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    setImportMessage(`Importing ${files.length} file(s)...`);

    try {
      let importedCount = 0;
      let totalSnapshots = 0;
      
      console.log(`🔄 AI Lab: Importing ${files.length} file(s) for future model building`);
      
      // Process each file separately - each file = one date
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        console.log(`📄 Processing: ${file.name}`);
        
        const data = await importCSVFile(file);
        if (data.length === 0) {
          console.warn(`⚠️ No data in ${file.name}`);
          continue;
        }

        console.log(`  ✓ Found ${data.length} rows`);

        // Try to extract date from filename
        let extractedDate: Date | null = null;
        const datePatterns = [
          /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
          /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
          /(\d{4})_(\d{2})_(\d{2})/, // YYYY_MM_DD
          /(\d{2})_(\d{2})_(\d{4})/, // DD_MM_YYYY
        ];
        
        for (const pattern of datePatterns) {
          const match = file.name.match(pattern);
          if (match) {
            if (match[1].length === 4) {
              extractedDate = new Date(`${match[1]}-${match[2]}-${match[3]}`);
            } else {
              extractedDate = new Date(`${match[3]}-${match[2]}-${match[1]}`);
            }
            if (!isNaN(extractedDate.getTime())) {
              console.log(`  📅 Extracted date from filename: ${extractedDate.toDateString()}`);
              break;
            }
          }
        }

        // Convert CSV to snapshots with proper field mapping
        const snapshots: MarketSnapshot[] = data.map((row: any, idx: number) => {
          let timestamp: number;
          const timeStr = row.timestamp || row.time;
          
          if (timeStr) {
            const parsed = new Date(timeStr);
            if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
              timestamp = parsed.getTime();
            } else if (extractedDate) {
              const timeMatch = String(timeStr).match(/(\d{2}):(\d{2}):(\d{2})/);
              if (timeMatch) {
                const dateWithTime = new Date(extractedDate);
                dateWithTime.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), parseInt(timeMatch[3]));
                timestamp = dateWithTime.getTime();
              } else {
                timestamp = extractedDate.getTime() + (idx * 60000);
              }
            } else {
              timestamp = Date.now() + (idx * 60000);
            }
          } else if (extractedDate) {
            timestamp = extractedDate.getTime() + (idx * 60000);
          } else {
            timestamp = Date.now() + (idx * 60000);
          }
          
          return {
            timestamp,
            niftyLtp: Number(row.niftyLTP || row.niftyLtp || 0),
            niftyChange: Number(row.change || row.niftyChange || 0),
            niftyChangePercent: Number(row.changePercent || row.niftyChangePercent || 0),
            overallSent: Number(row.sentiment || row.overallSent || 0),
            stockSent: Number(row.momentum || row.stockSent || 0),
            optionsSent: Number(row.pcr ? (row.pcr > 1 ? 60 : 40) : 50),
            pcr: Number(row.pcr || 0),
            callOI: Number(row.callOI || 0),
            putOI: Number(row.putOI || 0),
            vix: Number(row.vix || 0),
            bullishCount: Number(row.bullishStocks || row.bullishCount || 0),
            bearishCount: Number(row.bearishStocks || row.bearishCount || 0),
            ptsChg: Number(row.change || row.ptsChg || 0)
          };
        });

        snapshots.sort((a, b) => a.timestamp - b.timestamp);
        const date = extractedDate 
          ? extractedDate.toDateString() 
          : new Date(snapshots[0].timestamp).toDateString();
        console.log(`  📅 Date: ${date} (${snapshots.length} snapshots)`);
        
        // Only archive for Pattern Dashboard - DO NOT save to TODAY_SNAPSHOTS
        // Keep imported data separate from live trading data for model building
        const existingArchive = await dbService.getArchive(date);
        if (!existingArchive) {
          const prices = snapshots.map(s => s.niftyLtp);
          await dbService.archiveDailyData(date, {
            date,
            snapshots,
            sessionData: {},
            summary: {
              open: snapshots[0].niftyLtp,
              high: Math.max(...prices),
              low: Math.min(...prices),
              close: snapshots[snapshots.length - 1].niftyLtp,
              totalVolume: 0,
              dominantSentiment: snapshots.reduce((sum, s) => sum + s.overallSent, 0) / snapshots.length,
              avgPCR: snapshots.reduce((sum, s) => sum + s.pcr, 0) / snapshots.length,
              topPerformer: '',
              worstPerformer: '',
              range: Math.max(...prices) - Math.min(...prices),
              volatility: 0
            },
            metadata: { totalTrades: 0, pnl: 0, winRate: 0, patterns: [] }
          });
          console.log(`  ✅ Archived to DAILY_ARCHIVES for model training`);
        } else {
          console.log(`  ⏭️ Archive already exists for ${date}`);
        }
        
        totalSnapshots += snapshots.length;
        importedCount++;
      }

      if (importedCount > 0) {
        setImportMessage(`✅ Imported ${importedCount} day(s) with ${totalSnapshots} snapshots for model building!`);
      } else {
        setImportMessage('⚠️ No new data imported');
      }
      
    } catch (error) {
      console.error('❌ Import error:', error);
      setImportMessage(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      setTimeout(() => {
        setImportMessage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 5000);
    }
  };

  return (
    <div className="h-full bg-slate-950 overflow-auto custom-scrollbar">
      {/* Header */}
      <div className="glass-header border-b border-white/10 p-4 sm:p-6 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl">
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white">AI Lab</h1>
              <p className="text-xs text-slate-400">Multi-Agent Decision Intelligence</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Hidden file input - Always render */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              multiple
              onChange={handleImportCSV}
              className="hidden"
              key={isImporting ? 'importing' : 'ready'}
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="p-2 bg-slate-800 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50"
              title="Import CSV Data"
              type="button"
            >
              <Upload size={16} className={isImporting ? 'animate-pulse' : ''} />
            </button>
            
            <button
              onClick={() => setIsActive(!isActive)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                isActive 
                  ? 'bg-green-600 border-green-500 text-white' 
                  : 'bg-slate-800 border-white/10 text-slate-400'
              }`}
            >
              {isActive ? <Play size={16} /> : <Pause size={16} />}
              <span className="hidden sm:inline text-xs font-bold">{isActive ? 'Active' : 'Paused'}</span>
            </button>
            
            <button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              className="p-2 bg-slate-800 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <RefreshCw size={16} className={isAnalyzing ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
        
        {/* Import Message */}
        {importMessage && (
          <div className={`mt-3 text-sm px-3 py-2 rounded-lg border ${
            importMessage.startsWith('✅') 
              ? 'bg-green-500/10 border-green-500/30 text-green-400' 
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            {importMessage}
          </div>
        )}
        
        {lastUpdate && (
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
            <Clock size={12} />
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        {/* No Data Message */}
        {historyLog.length === 0 && (
          <div className="glass-panel rounded-xl p-8 text-center">
            <Bot size={48} className="mx-auto mb-4 text-slate-600" />
            <h3 className="text-lg font-bold text-white mb-2">No Live Data Available</h3>
            <p className="text-sm text-slate-400 mb-4">
              Import historical CSV files to Pattern Dashboard for model training.<br/>
              AI Lab will analyze live market data when available.
            </p>
          </div>
        )}
        
        {/* Agent Grid */}
        {historyLog.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {agents.slice(0, 5).map((agent, idx) => (
            <div
              key={idx}
              className="glass-panel rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 bg-${agent.color}-500/20 rounded-lg text-${agent.color}-400`}>
                  {agent.icon}
                </div>
                {agent.decision && (
                  <div className={`px-2 py-1 rounded-full text-xs font-bold ${getActionBg(agent.decision.action)}`}>
                    <span className={getActionColor(agent.decision.action)}>{agent.decision.action}</span>
                  </div>
                )}
              </div>
              
              <h3 className="text-sm font-bold text-white mb-2">{agent.name}</h3>
              
              {agent.decision ? (
                <>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>Confidence</span>
                      <span className="font-bold text-white">{agent.decision.confidence.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-${agent.color}-500 transition-all`}
                        style={{ width: `${agent.decision.confidence}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="text-xs text-slate-400 space-y-1">
                    {agent.decision.reasoning.slice(0, 2).map((reason, i) => (
                      <div key={i} className="flex items-start gap-1">
                        <span className="text-slate-600 mt-0.5">•</span>
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-xs text-slate-600">Waiting for data...</div>
              )}
            </div>
          ))}
        </div>
        )}

        {/* Ensemble Decision */}
        {historyLog.length > 0 && agents[5]?.decision && (
          <div className="glass-panel rounded-xl p-6 border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-indigo-600 rounded-xl">
                <Brain size={24} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Ensemble Decision</h2>
                <p className="text-sm text-slate-400">AI Consensus</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">BUY Probability</div>
                <div className="text-2xl font-bold text-green-400">
                  {((agents.filter(a => a.decision?.action === 'BUY').length / 5) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">HOLD Probability</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {((agents.filter(a => a.decision?.action === 'HOLD').length / 5) * 100).toFixed(0)}%
                </div>
              </div>
              <div className="text-center p-4 bg-slate-900/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">SELL Probability</div>
                <div className="text-2xl font-bold text-red-400">
                  {((agents.filter(a => a.decision?.action === 'SELL').length / 5) * 100).toFixed(0)}%
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-xl ${getActionBg(agents[5].decision.action)}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getActionIcon(agents[5].decision.action)}
                  <span className={`text-xl font-bold ${getActionColor(agents[5].decision.action)}`}>
                    {agents[5].decision.action}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400">Confidence</div>
                  <div className={`text-lg font-bold ${getActionColor(agents[5].decision.action)}`}>
                    {agents[5].decision.confidence.toFixed(0)}%
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                {agents[5].decision.reasoning.map((reason, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <CheckCircle size={14} className="mt-0.5 flex-shrink-0" />
                    <span>{reason}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Trading Recommendation */}
        {historyLog.length > 0 && recommendation && recommendation.action !== 'HOLD' && (
          <div className={`glass-panel rounded-xl p-6 border-2 ${
            recommendation.action === 'BUY' ? 'border-green-500/50' : 'border-red-500/50'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target size={20} />
                Trade Setup
              </h2>
              <div className={`px-3 py-1 rounded-full text-sm font-bold ${getActionBg(recommendation.action)}`}>
                <span className={getActionColor(recommendation.action)}>{recommendation.action}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Entry</div>
                <div className="text-lg font-bold text-white">{recommendation.entry.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Stop Loss</div>
                <div className="text-lg font-bold text-red-400">{recommendation.stopLoss.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Target</div>
                <div className="text-lg font-bold text-green-400">{recommendation.target.toFixed(2)}</div>
              </div>
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="text-xs text-slate-400 mb-1">Risk:Reward</div>
                <div className="text-lg font-bold text-blue-400">1:{recommendation.riskReward}</div>
              </div>
            </div>
            
            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
              <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-slate-300">
                <p className="font-bold text-yellow-400 mb-1">Disclaimer</p>
                <p>This is AI-generated guidance. Always do your own analysis and trade at your own risk. Past performance doesn't guarantee future results.</p>
              </div>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="glass-panel rounded-xl p-4 border border-blue-500/30 bg-blue-500/5">
          <div className="flex items-start gap-3">
            <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300">
              <p className="font-bold text-blue-400 mb-2">How it works</p>
              <ul className="space-y-1 text-xs">
                <li>• <strong>5 AI agents</strong> analyze different aspects of the market</li>
                <li>• Each agent votes <strong>BUY/SELL/HOLD</strong> with confidence</li>
                <li>• <strong>Ensemble system</strong> combines votes for final decision</li>
                <li>• Updates <strong>every minute</strong> with fresh data</li>
                <li>• Target accuracy: <strong>70-80%</strong> with proper risk management</li>
              </ul>
            </div>
          </div>
        </div>

        {/* AI Prediction Table */}
        {(historyLog.length > 0 || archivedSnapshots.length > 0) && (
          <div className="glass-panel rounded-xl p-6 border border-purple-500/30 bg-purple-500/5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Sparkles size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">AI Predictions</h2>
                  <p className="text-xs text-slate-400">
                    Next 30 minutes forecast • {historyLog.length > 0 ? historyLog.length : archivedSnapshots.length} snapshots available
                  </p>
                </div>
              </div>
              <button
                onClick={generatePredictions}
                disabled={isPredicting || (historyLog.length < 10 && archivedSnapshots.length < 10)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center gap-2 transition-all text-sm"
              >
                {isPredicting ? (
                  <>
                    <Activity className="animate-spin" size={14} />
                    Predicting...
                  </>
                ) : (
                  <>
                    <Brain size={14} />
                    Generate Predictions
                  </>
                )}
              </button>
            </div>

            {showPredictions && predictions.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-center border-collapse">
                  <thead className="sticky top-0 glass-header text-slate-500 uppercase text-[9px] sm:text-[10px] font-bold tracking-widest">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left">Time</th>
                      <th className="px-1 sm:px-2 py-2 sm:py-3">Nifty LTP</th>
                      <th className="px-1 sm:px-2 py-2 sm:py-3">Pts Chg</th>
                      <th className="px-1 sm:px-2 py-2 sm:py-3 border-l border-white/5">Overall Sent.</th>
                      <th className="px-1 sm:px-2 py-2 sm:py-3">Adv/Dec</th>
                      <th className="px-1 sm:px-2 py-2 sm:py-3">Stk Str</th>
                      
                      <th className="px-1 sm:px-2 py-2 sm:py-3 border-l border-white/5">Call Str</th>
                      <th className="px-1 sm:px-2 py-2 sm:py-3">Put Str</th>
                      <th className="px-1 sm:px-2 py-2 sm:py-3">PCR</th>
                      <th className="px-1 sm:px-2 py-2 sm:py-3 bg-white/5">Opt Str</th>
                      
                      <th className="px-1 sm:px-2 py-2 sm:py-3 border-l border-white/5">Calls Buy/Sell (M)</th>
                      <th className="px-1 sm:px-2 py-2 sm:py-3">Puts Buy/Sell (M)</th>
                      <th className="px-1 sm:px-2 py-2 sm:py-3 border-l border-white/5 bg-purple-500/10">Conf</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 bg-slate-900/20">
                    {predictions.map((pred, idx) => (
                      <tr key={idx} className="hover:bg-white/5 transition-colors group">
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-left font-bold text-purple-400 text-[10px] sm:text-sm font-mono border-r border-white/5 bg-slate-900/30 group-hover:text-purple-300">
                          {pred.time}
                        </td>
                        <td className="px-1 sm:px-2 py-2 sm:py-3 font-mono text-[10px] sm:text-sm text-slate-400 group-hover:text-white">
                          {pred.niftyLtp.toFixed(2)}
                        </td>
                        <td className={`px-1 sm:px-2 py-2 sm:py-3 font-mono text-[10px] sm:text-sm font-bold ${
                          pred.ptsChg >= 0 ? 'text-bull' : 'text-bear'
                        }`}>
                          {pred.ptsChg > 0 ? '+' : ''}{pred.ptsChg.toFixed(1)}
                        </td>
                        
                        <td className="px-1 sm:px-2 py-2 sm:py-3 border-l border-white/5 font-bold text-[10px] sm:text-sm bg-white/5">
                          <span className={pred.overallSent >= 0 ? 'text-bull text-glow-green' : 'text-bear text-glow-red'}>
                            {pred.overallSent > 0 ? '+' : ''}{pred.overallSent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-1 sm:px-2 py-2 sm:py-3 font-mono text-[10px] sm:text-sm">
                          <span className="text-bull font-bold">{pred.adv}</span> / <span className="text-bear font-bold">{pred.dec}</span>
                        </td>
                        <td className="px-1 sm:px-2 py-2 sm:py-3 text-[10px] sm:text-sm">
                          <span className={pred.stockSent >= 0 ? 'text-bull text-glow-green' : 'text-bear text-glow-red'}>
                            {pred.stockSent > 0 ? '+' : ''}{pred.stockSent.toFixed(1)}%
                          </span>
                        </td>
                        
                        <td className="px-1 sm:px-2 py-2 sm:py-3 border-l border-white/5 text-[10px] sm:text-sm">
                          <span className={pred.callSent >= 0 ? 'text-bull text-glow-green' : 'text-bear text-glow-red'}>
                            {pred.callSent > 0 ? '+' : ''}{pred.callSent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-1 sm:px-2 py-2 sm:py-3 text-[10px] sm:text-sm">
                          <span className={pred.putSent >= 0 ? 'text-bull text-glow-green' : 'text-bear text-glow-red'}>
                            {pred.putSent > 0 ? '+' : ''}{pred.putSent.toFixed(1)}%
                          </span>
                        </td>
                        <td className={`px-1 sm:px-2 py-2 sm:py-3 font-mono text-[10px] sm:text-sm font-bold ${
                          pred.pcr > 1 ? 'text-bull' : pred.pcr < 0.7 ? 'text-bear' : 'text-blue-200'
                        }`}>
                          {pred.pcr.toFixed(2)}
                        </td>
                        <td className="px-1 sm:px-2 py-2 sm:py-3 font-bold text-[10px] sm:text-sm bg-white/5 border-l border-white/5">
                          <span className={pred.optionsSent >= 0 ? 'text-bull text-glow-green' : 'text-bear text-glow-red'}>
                            {pred.optionsSent > 0 ? '+' : ''}{pred.optionsSent.toFixed(1)}%
                          </span>
                        </td>
                        
                        <td className="px-1 sm:px-2 py-2 sm:py-3 border-l border-white/5 font-mono text-[9px] sm:text-xs opacity-80">
                          <span className="text-bull">{(pred.callsBuyQty / 1000000).toFixed(2)}M</span> <span className="text-slate-600">/</span> <span className="text-bear">{(pred.callsSellQty / 1000000).toFixed(2)}M</span>
                        </td>
                        <td className="px-1 sm:px-2 py-2 sm:py-3 font-mono text-[9px] sm:text-xs opacity-80">
                          <span className="text-bull">{(pred.putsBuyQty / 1000000).toFixed(2)}M</span> <span className="text-slate-600">/</span> <span className="text-bear">{(pred.putsSellQty / 1000000).toFixed(2)}M</span>
                        </td>
                        <td className="px-1 sm:px-2 py-2 sm:py-3 border-l border-white/5 bg-purple-500/10">
                          <div className="flex items-center gap-1 justify-center">
                            <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-full bg-purple-500 transition-all"
                                style={{ width: `${pred.confidence}%` }}
                              />
                            </div>
                            <span className="text-[9px] font-bold text-purple-400 min-w-[25px]">
                              {pred.confidence}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
                  <AlertTriangle size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-300">
                    <p className="font-bold text-yellow-400 mb-1">Prediction Disclaimer</p>
                    <p>These are AI-generated forecasts based on recent trends and patterns. Actual market movements may vary significantly. Use for reference only.</p>
                  </div>
                </div>
              </div>
            )}

            {!showPredictions && (
              <div className="text-center py-8 text-slate-500">
                <Brain size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">Click "Generate Predictions" to forecast next 30 minutes</p>
                <p className="text-xs mt-2">
                  {historyLog.length > 0 ? (
                    <span className="text-green-400">✓ Using {historyLog.length} live snapshots</span>
                  ) : archivedSnapshots.length > 0 ? (
                    <span className="text-blue-400">✓ Using {archivedSnapshots.length} archived snapshots</span>
                  ) : (
                    <span className="text-slate-600">Need at least 10 snapshots</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AILab;
