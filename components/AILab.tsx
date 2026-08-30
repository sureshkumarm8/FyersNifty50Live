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
  Minus, Info, RefreshCw, Play, Pause, Bot, Upload, Sparkles, X, Download,
  History, Radar, Award, ClipboardList
} from 'lucide-react';
import { EnrichedFyersQuote, MarketSnapshot } from '../types';
import { dbService } from '../services/db';
import { importCSVFile } from '../services/csv';
import PredictionsPanel from './PredictionsPanel';
import MarketMemoryPanel from './ailab/MarketMemoryPanel';
import RegimeRadarPanel from './ailab/RegimeRadarPanel';
import ScorecardPanel from './ailab/ScorecardPanel';
import DebriefPanel from './ailab/DebriefPanel';
import { useArchiveSeries } from './ailab/useArchiveSeries';
import { agentScorecard } from '../services/agentScorecard';

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

// Predicted snapshot type and the forecaster itself now live in PredictionsPanel.

type AILabTab = 'agents' | 'scorecard' | 'predictions' | 'memory' | 'regime' | 'debrief' | 'research';

const TABS: Array<{ id: AILabTab; label: string; icon: React.ReactNode }> = [
  { id: 'agents', label: 'AI Agents', icon: <Bot size={14} /> },
  { id: 'scorecard', label: 'Scorecard', icon: <Award size={14} /> },
  { id: 'predictions', label: 'Predictions', icon: <Sparkles size={14} /> },
  { id: 'memory', label: 'Market Memory', icon: <History size={14} /> },
  { id: 'regime', label: 'Regime & Risk', icon: <Radar size={14} /> },
  { id: 'debrief', label: 'Debrief', icon: <ClipboardList size={14} /> },
  { id: 'research', label: 'Research', icon: <Brain size={14} /> }
];

const AILab: React.FC<AILabProps> = ({ currentSnapshot, niftyLtp, stocks, historyLog }) => {
  const [isActive, setIsActive] = useState(true);
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [archivedSnapshots, setArchivedSnapshots] = useState<MarketSnapshot[]>([]);
  const [activeTab, setActiveTab] = useState<AILabTab>('agents');
  const [scorecardKey, setScorecardKey] = useState(0);
  const [researchQuery, setResearchQuery] = useState('');
  const [researchResults, setResearchResults] = useState<any>(null);
  const [isResearching, setIsResearching] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shared across Market Memory, Regime Radar and Debrief so the archive is
  // converted into the model's feature space once rather than three times.
  const archiveSeries = useArchiveSeries(historyLog);

  // Load archived data on mount for predictions
  useEffect(() => {
    loadArchivedData();
  }, []);

  /**
   * Grade outstanding agent calls against what the market actually did.
   *
   * Runs on an interval rather than after each analysis because a call made now
   * cannot be graded until its horizon has elapsed. Without this loop the
   * scorecard would fill with calls that are never scored, and the agents would
   * go on claiming confidence that nothing ever checked.
   */
  useEffect(() => {
    if (historyLog.length < 5) return;
    let cancelled = false;
    const run = async () => {
      try {
        const n = await agentScorecard.grade(historyLog as any);
        if (n > 0 && !cancelled) setScorecardKey(k => k + 1);
      } catch (e) {
        console.error('Agent grading failed:', e);
      }
    };
    run();
    const id = setInterval(run, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [historyLog]);

  const loadArchivedData = async () => {
    try {
      console.log('🔄 AI Lab: Loading archived data...');
      await dbService.init(); // Ensure DB is initialized
      const archives = await dbService.getAllArchives(); // Get ALL archives, not just last 3
      console.log(`📦 Fetched ${archives.length} daily archives`);
      
      const allSnapshots: MarketSnapshot[] = [];
      archives.forEach(archive => {
        console.log(`  - ${archive.date}: ${archive.snapshots.length} snapshots`);
        allSnapshots.push(...archive.snapshots);
      });
      
      // Sort by timestamp descending (newest first)
      allSnapshots.sort((a, b) => b.timestamp - a.timestamp);
      setArchivedSnapshots(allSnapshots);
      console.log(`✅ AI Lab loaded ${allSnapshots.length} archived snapshots for predictions`);
    } catch (error) {
      console.error('❌ Failed to load archived data:', error);
    }
  };

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
      confidence = 70;
      reasoning.push(`Low volatility: ${volatilityPercent.toFixed(2)}%`);
      reasoning.push('Favourable conditions — normal position size is appropriate');
    } else if (volatilityPercent > 1.5) {
      confidence = 75;
      reasoning.push(`High volatility: ${volatilityPercent.toFixed(2)}%`);
      reasoning.push('Reduce size — ordinary stops are hit by noise alone here');
    } else {
      confidence = 60;
      reasoning.push(`Moderate volatility: ${volatilityPercent.toFixed(2)}%`);
      reasoning.push('Acceptable risk level');
    }

    // This agent measures how much the market can move, not which way. It used
    // to answer BUY whenever volatility was anything but high, which meant a
    // "risk" agent cast a permanent bullish vote into the ensemble on evidence
    // that says nothing about direction — walk-forward testing found no
    // directional information in volatility at these horizons. It now abstains
    // from the direction vote (score 0) and contributes only its read on size.
    return {
      action,
      confidence,
      reasoning,
      score: 0
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

    // Record what each agent claimed, so it can be graded against the outcome
    // later. This is what turns a displayed confidence number into a testable
    // one — duplicate suppression inside the scorecard keeps the refresh loop
    // from manufacturing thousands of correlated "calls".
    if (currentSnapshot && niftyLtp) {
      const named: Array<[string, AgentDecision | null]> = [
        ['Pattern Agent', patternAgent],
        ['Sentiment Agent', sentimentAgent],
        ['Momentum Agent', momentumAgent],
        ['Levels Agent', levelsAgent],
        ['Risk Agent', riskAgent],
        ['Ensemble', ensembleDecision]
      ];
      try {
        await agentScorecard.log(
          named
            .filter(([, d]) => d !== null)
            .map(([name, d]) => ({
              agent: name,
              action: d!.action,
              claimedConfidence: d!.confidence,
              reasoning: d!.reasoning
            })),
          {
            ltp: niftyLtp,
            sent: (currentSnapshot as any).overallSent ?? 0,
            pcr: (currentSnapshot as any).pcr ?? 0
          }
        );
        setScorecardKey(k => k + 1);
      } catch (e) {
        console.error('Failed to record agent calls:', e);
      }
    }
    
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

  // Research function
  const runResearch = async (type: string) => {
    if (archivedSnapshots.length < 10) {
      alert('Need at least 10 snapshots for research');
      return;
    }

    setIsResearching(true);
    setResearchResults(null);

    try {
      let results: any = {};

      switch (type) {
        case 'patterns':
          results = analyzePatterns();
          break;
        case 'correlations':
          results = analyzeCorrelations();
          break;
        case 'time':
          results = analyzeTimePatterns();
          break;
        case 'volatility':
          results = analyzeVolatility();
          break;
        case 'reversals':
          results = findReversals();
          break;
        case 'setups':
          results = findWinningSetups();
          break;
        case 'custom':
          results = await customResearch(researchQuery);
          break;
      }

      setResearchResults(results);
    } catch (error) {
      console.error('Research error:', error);
      setResearchResults({ error: 'Research failed', details: error });
    } finally {
      setIsResearching(false);
    }
  };

  // Pattern Discovery
  const analyzePatterns = () => {
    const data = archivedSnapshots.slice(0, 500);
    
    // Find bullish patterns (sentiment turning positive with price follow-through)
    const bullishSetups = data.filter((snap, idx) => {
      if (idx < 5) return false;
      const prevSent = data[idx - 5].overallSent;
      const currentSent = snap.overallSent;
      const priceMove = snap.niftyLtp - data[idx - 5].niftyLtp;
      return prevSent < 0 && currentSent > 10 && priceMove > 20;
    });

    // Find bearish patterns
    const bearishSetups = data.filter((snap, idx) => {
      if (idx < 5) return false;
      const prevSent = data[idx - 5].overallSent;
      const currentSent = snap.overallSent;
      const priceMove = snap.niftyLtp - data[idx - 5].niftyLtp;
      return prevSent > 0 && currentSent < -10 && priceMove < -20;
    });

    // PCR extremes
    const highPCR = data.filter(s => s.pcr > 1.3);
    const lowPCR = data.filter(s => s.pcr < 0.7);

    return {
      totalSnapshots: data.length,
      bullishPatterns: {
        count: bullishSetups.length,
        avgMove: bullishSetups.reduce((sum, s, idx) => {
          if (idx < 3) return sum;
          return sum + (s.niftyLtp - bullishSetups[idx - 3].niftyLtp);
        }, 0) / Math.max(1, bullishSetups.length - 3),
        successRate: bullishSetups.filter((s, idx) => {
          if (idx >= bullishSetups.length - 3) return false;
          return bullishSetups[idx + 3].niftyLtp > s.niftyLtp;
        }).length / Math.max(1, bullishSetups.length - 3) * 100
      },
      bearishPatterns: {
        count: bearishSetups.length,
        avgMove: bearishSetups.reduce((sum, s, idx) => {
          if (idx < 3) return sum;
          return sum + (s.niftyLtp - bearishSetups[idx - 3].niftyLtp);
        }, 0) / Math.max(1, bearishSetups.length - 3),
        successRate: bearishSetups.filter((s, idx) => {
          if (idx >= bearishSetups.length - 3) return false;
          return bearishSetups[idx + 3].niftyLtp < s.niftyLtp;
        }).length / Math.max(1, bearishSetups.length - 3) * 100
      },
      pcrExtremes: {
        highPCR: { count: highPCR.length, avgPrice: highPCR.reduce((sum, s) => sum + s.niftyLtp, 0) / highPCR.length },
        lowPCR: { count: lowPCR.length, avgPrice: lowPCR.reduce((sum, s) => sum + s.niftyLtp, 0) / lowPCR.length }
      }
    };
  };

  // Correlation Analysis
  const analyzeCorrelations = () => {
    const data = archivedSnapshots.slice(0, 500);
    
    // Calculate correlation between sentiment and next-hour price move
    const sentimentPriceCorr = calculateCorrelation(
      data.slice(0, -12).map(s => s.overallSent),
      data.slice(12).map((s, idx) => s.niftyLtp - data[idx].niftyLtp)
    );

    // PCR vs Price correlation
    const pcrPriceCorr = calculateCorrelation(
      data.slice(0, -12).map(s => s.pcr),
      data.slice(12).map((s, idx) => s.niftyLtp - data[idx].niftyLtp)
    );

    // Volatility vs Sentiment
    const volatility = data.slice(0, -12).map((s, idx) => {
      const window = data.slice(idx, idx + 12);
      const prices = window.map(w => w.niftyLtp);
      return Math.max(...prices) - Math.min(...prices);
    });
    const volSentCorr = calculateCorrelation(volatility, data.slice(0, volatility.length).map(s => Math.abs(s.overallSent)));

    return {
      sentimentVsPrice: {
        correlation: sentimentPriceCorr.toFixed(3),
        interpretation: sentimentPriceCorr > 0.3 ? 'Strong positive' : sentimentPriceCorr < -0.3 ? 'Strong negative' : 'Weak'
      },
      pcrVsPrice: {
        correlation: pcrPriceCorr.toFixed(3),
        interpretation: pcrPriceCorr > 0.3 ? 'Strong positive' : pcrPriceCorr < -0.3 ? 'Strong negative' : 'Weak'
      },
      volatilityVsSentiment: {
        correlation: volSentCorr.toFixed(3),
        interpretation: 'Higher volatility with extreme sentiment'
      }
    };
  };

  // Helper function for correlation
  const calculateCorrelation = (x: number[], y: number[]): number => {
    const n = Math.min(x.length, y.length);
    const meanX = x.slice(0, n).reduce((a, b) => a + b, 0) / n;
    const meanY = y.slice(0, n).reduce((a, b) => a + b, 0) / n;
    
    let num = 0, denX = 0, denY = 0;
    for (let i = 0; i < n; i++) {
      const dx = x[i] - meanX;
      const dy = y[i] - meanY;
      num += dx * dy;
      denX += dx * dx;
      denY += dy * dy;
    }
    
    return num / Math.sqrt(denX * denY) || 0;
  };

  // Time-based Analysis
  const analyzeTimePatterns = () => {
    const data = archivedSnapshots.slice(0, 1000);
    
    const hourlyPerformance: any = {};
    data.forEach(snap => {
      const hour = new Date(snap.timestamp).getHours();
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { moves: [], count: 0 };
      }
      hourlyPerformance[hour].count++;
      if (snap.ptsChg) hourlyPerformance[hour].moves.push(snap.ptsChg);
    });

    const hourlyStats = Object.keys(hourlyPerformance).map(hour => ({
      hour: `${hour}:00`,
      count: hourlyPerformance[hour].count,
      avgMove: hourlyPerformance[hour].moves.reduce((a: number, b: number) => a + b, 0) / hourlyPerformance[hour].moves.length,
      volatility: Math.max(...hourlyPerformance[hour].moves) - Math.min(...hourlyPerformance[hour].moves)
    })).sort((a, b) => Math.abs(b.avgMove) - Math.abs(a.avgMove));

    return {
      bestHours: hourlyStats.slice(0, 3),
      worstHours: hourlyStats.slice(-3).reverse(),
      totalHoursAnalyzed: hourlyStats.length
    };
  };

  // Volatility Analysis
  const analyzeVolatility = () => {
    const data = archivedSnapshots.slice(0, 500);
    
    const volatilityPeriods = data.map((snap, idx) => {
      if (idx < 12) return { time: snap.timestamp, vol: 0 };
      const window = data.slice(idx - 12, idx);
      const prices = window.map(s => s.niftyLtp);
      const vol = Math.max(...prices) - Math.min(...prices);
      return { time: snap.timestamp, vol, price: snap.niftyLtp };
    });

    const sorted = [...volatilityPeriods].sort((a, b) => b.vol - a.vol);
    const highVol = sorted.slice(0, 20);
    const lowVol = sorted.slice(-20);

    return {
      averageVolatility: volatilityPeriods.reduce((sum, p) => sum + p.vol, 0) / volatilityPeriods.length,
      highVolatilityPeriods: {
        count: highVol.length,
        avgRange: highVol.reduce((sum, p) => sum + p.vol, 0) / highVol.length,
        times: highVol.map(p => new Date(p.time).toLocaleTimeString())
      },
      lowVolatilityPeriods: {
        count: lowVol.length,
        avgRange: lowVol.reduce((sum, p) => sum + p.vol, 0) / lowVol.length
      }
    };
  };

  // Find Reversals
  const findReversals = () => {
    const data = archivedSnapshots.slice(0, 500);
    
    const reversals = data.filter((snap, idx) => {
      if (idx < 10 || idx >= data.length - 10) return false;
      
      const before = data.slice(idx - 10, idx);
      const after = data.slice(idx, idx + 10);
      
      const beforeTrend = before[9].niftyLtp - before[0].niftyLtp;
      const afterTrend = after[9].niftyLtp - after[0].niftyLtp;
      
      // Strong reversal: trend changes by more than 50 points
      return Math.abs(beforeTrend + afterTrend) < 10 && Math.abs(beforeTrend) > 50 && Math.abs(afterTrend) > 50;
    });

    return {
      totalReversals: reversals.length,
      reversalRate: (reversals.length / data.length * 100).toFixed(2) + '%',
      avgSentimentAtReversal: reversals.reduce((sum, s) => sum + Math.abs(s.overallSent), 0) / reversals.length,
      avgPCRAtReversal: reversals.reduce((sum, s) => sum + s.pcr, 0) / reversals.length
    };
  };

  // Find Winning Setups
  const findWinningSetups = () => {
    const data = archivedSnapshots.slice(0, 500);
    
    const setups = data.map((snap, idx) => {
      if (idx >= data.length - 6) return null;
      
      const futureMove = data[idx + 6].niftyLtp - snap.niftyLtp;
      const isWinner = Math.abs(futureMove) > 20;
      
      return {
        sentiment: snap.overallSent,
        pcr: snap.pcr,
        move: futureMove,
        isWinner,
        direction: futureMove > 0 ? 'UP' : 'DOWN'
      };
    }).filter(s => s && s.isWinner);

    const bullishSetups = setups.filter(s => s!.direction === 'UP');
    const bearishSetups = setups.filter(s => s!.direction === 'DOWN');

    return {
      totalWinningSetups: setups.length,
      bullish: {
        count: bullishSetups.length,
        avgSentiment: bullishSetups.reduce((sum, s) => sum + s!.sentiment, 0) / bullishSetups.length,
        avgPCR: bullishSetups.reduce((sum, s) => sum + s!.pcr, 0) / bullishSetups.length,
        avgMove: bullishSetups.reduce((sum, s) => sum + s!.move, 0) / bullishSetups.length
      },
      bearish: {
        count: bearishSetups.length,
        avgSentiment: bearishSetups.reduce((sum, s) => sum + s!.sentiment, 0) / bearishSetups.length,
        avgPCR: bearishSetups.reduce((sum, s) => sum + s!.pcr, 0) / bearishSetups.length,
        avgMove: bearishSetups.reduce((sum, s) => sum + s!.move, 0) / bearishSetups.length
      }
    };
  };

  // Custom Research
  const customResearch = async (query: string) => {
    // Simple keyword-based analysis
    const data = archivedSnapshots.slice(0, 500);
    
    const keywords = query.toLowerCase();
    let results: any = { query, dataPoints: data.length };

    // Extract numbers from query
    const numbers = query.match(/\d+\.?\d*/g);
    
    if (keywords.includes('pcr') && numbers) {
      const threshold = parseFloat(numbers[0]);
      const filtered = data.filter(s => keywords.includes('>') ? s.pcr > threshold : s.pcr < threshold);
      results.filtered = filtered.length;
      results.avgPriceMove = filtered.slice(0, -6).reduce((sum, s, idx) => 
        sum + (filtered[idx + 6].niftyLtp - s.niftyLtp), 0) / Math.max(1, filtered.length - 6);
    }

    if (keywords.includes('sentiment') && numbers) {
      const threshold = parseFloat(numbers[0]);
      const filtered = data.filter(s => keywords.includes('>') || keywords.includes('positive') ? 
        s.overallSent > threshold : s.overallSent < -threshold);
      results.filtered = filtered.length;
      results.avgPriceMove = filtered.slice(0, -6).reduce((sum, s, idx) => 
        sum + (filtered[idx + 6].niftyLtp - s.niftyLtp), 0) / Math.max(1, filtered.length - 6);
    }

    return results;
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
              title="Refresh Analysis"
            >
              <RefreshCw size={16} className={isAnalyzing ? 'animate-spin' : ''} />
            </button>
            
            <button
              onClick={loadArchivedData}
              className="p-2 bg-slate-800 border border-white/10 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-all"
              title="Reload Archived Data"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
        
        {/* Data Status */}
        <div className="mt-2 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Activity size={12} />
            <span>Live: {historyLog.length} snapshots</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Download size={12} />
            <span>Archived: {archivedSnapshots.length} snapshots</span>
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
        
        {/* Debug: No archived data warning */}
        {archivedSnapshots.length === 0 && historyLog.length === 0 && (
          <div className="mt-3 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-sm text-red-400 font-bold mb-2">⚠️ No Data Available for AI Analysis</p>
            <p className="text-xs text-slate-400 mb-3">
              AI Lab needs historical data to work. Current status:
            </p>
            <ul className="text-xs text-slate-400 space-y-1 mb-3">
              <li>• Live snapshots: {historyLog.length}</li>
              <li>• Archived snapshots: {archivedSnapshots.length}</li>
              <li>• Required: At least 10 snapshots</li>
            </ul>
            <div className="flex gap-2">
              <button
                onClick={loadArchivedData}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-all flex items-center gap-2"
              >
                <Download size={12} />
                Reload Archives
              </button>
              <button
                onClick={() => {
                  // Switch to Pattern Dashboard Archives tab
                  alert('Please go to Pattern Dashboard → Archives tab to import CSV files');
                }}
                className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg transition-all flex items-center gap-2"
              >
                <Upload size={12} />
                Import Data
              </button>
            </div>
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
        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-white/10 pb-4 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {tab.icon}
                {tab.label}
              </div>
            </button>
          ))}
        </div>

        {activeTab === 'scorecard' && <ScorecardPanel refreshKey={scorecardKey} />}
        {activeTab === 'memory' && <MarketMemoryPanel series={archiveSeries} />}
        {activeTab === 'regime' && <RegimeRadarPanel series={archiveSeries} liveLog={historyLog} />}
        {activeTab === 'debrief' && <DebriefPanel series={archiveSeries} />}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
        <>
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
        </>
        )}

        {/* Predictions Tab — the forecaster now lives in PredictionsPanel so
            Pattern Recognition can render the very same thing. */}
        {activeTab === 'predictions' && (
          <PredictionsPanel
            historyLog={historyLog}
            currentSnapshot={currentSnapshot}
            archivedSnapshots={archivedSnapshots}
          />
        )}

        {/* Research Tab */}
        {activeTab === 'research' && (
        <>
        <div className="glass-panel rounded-xl p-6 border border-indigo-500/30 bg-indigo-500/5">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
              <Brain size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">AI Research Lab</h2>
              <p className="text-sm text-slate-400">Advanced data analysis with {archivedSnapshots.length} snapshots</p>
            </div>
          </div>

          {/* Research Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {/* Pattern Discovery */}
            <div className="glass-panel rounded-xl p-4 border border-white/10 hover:border-purple-500/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-500/20 rounded-lg group-hover:bg-purple-500/30 transition-all">
                  <Sparkles size={20} className="text-purple-400" />
                </div>
                <h3 className="font-bold text-white">Pattern Discovery</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">Find recurring patterns in price movements, sentiment shifts, and market cycles</p>
              <button 
                onClick={() => runResearch('patterns')}
                disabled={isResearching || archivedSnapshots.length < 50}
                className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900 text-white text-xs rounded-lg transition-all"
              >
                Discover Patterns
              </button>
            </div>

            {/* Correlation Analysis */}
            <div className="glass-panel rounded-xl p-4 border border-white/10 hover:border-blue-500/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-500/20 rounded-lg group-hover:bg-blue-500/30 transition-all">
                  <BarChart3 size={20} className="text-blue-400" />
                </div>
                <h3 className="font-bold text-white">Correlation Analysis</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">Discover relationships between sentiment, PCR, volatility, and price movements</p>
              <button 
                onClick={() => runResearch('correlations')}
                disabled={isResearching || archivedSnapshots.length < 50}
                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 text-white text-xs rounded-lg transition-all"
              >
                Analyze Correlations
              </button>
            </div>

            {/* Time-based Analysis */}
            <div className="glass-panel rounded-xl p-4 border border-white/10 hover:border-green-500/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-500/20 rounded-lg group-hover:bg-green-500/30 transition-all">
                  <Clock size={20} className="text-green-400" />
                </div>
                <h3 className="font-bold text-white">Time Analysis</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">Best trading hours, session-wise performance, and time-based patterns</p>
              <button 
                onClick={() => runResearch('time')}
                disabled={isResearching || archivedSnapshots.length < 50}
                className="w-full px-3 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-900 text-white text-xs rounded-lg transition-all"
              >
                Analyze Time Patterns
              </button>
            </div>

            {/* Volatility Study */}
            <div className="glass-panel rounded-xl p-4 border border-white/10 hover:border-orange-500/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-all">
                  <Activity size={20} className="text-orange-400" />
                </div>
                <h3 className="font-bold text-white">Volatility Patterns</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">High/low volatility periods, volatility clustering, and regime changes</p>
              <button 
                onClick={() => runResearch('volatility')}
                disabled={isResearching || archivedSnapshots.length < 50}
                className="w-full px-3 py-2 bg-orange-600 hover:bg-orange-500 disabled:bg-orange-900 text-white text-xs rounded-lg transition-all"
              >
                Study Volatility
              </button>
            </div>

            {/* Sentiment Reversal */}
            <div className="glass-panel rounded-xl p-4 border border-white/10 hover:border-red-500/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-500/20 rounded-lg group-hover:bg-red-500/30 transition-all">
                  <TrendingDown size={20} className="text-red-400" />
                </div>
                <h3 className="font-bold text-white">Reversal Signals</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">Identify sentiment extremes that preceded major reversals</p>
              <button 
                onClick={() => runResearch('reversals')}
                disabled={isResearching || archivedSnapshots.length < 50}
                className="w-full px-3 py-2 bg-red-600 hover:bg-red-500 disabled:bg-red-900 text-white text-xs rounded-lg transition-all"
              >
                Find Reversals
              </button>
            </div>

            {/* Winning Setups */}
            <div className="glass-panel rounded-xl p-4 border border-white/10 hover:border-emerald-500/50 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-500/20 rounded-lg group-hover:bg-emerald-500/30 transition-all">
                  <Target size={20} className="text-emerald-400" />
                </div>
                <h3 className="font-bold text-white">Winning Setups</h3>
              </div>
              <p className="text-xs text-slate-400 mb-3">Find high-probability setups with best risk-reward ratios</p>
              <button 
                onClick={() => runResearch('setups')}
                disabled={isResearching || archivedSnapshots.length < 50}
                className="w-full px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white text-xs rounded-lg transition-all"
              >
                Find Setups
              </button>
            </div>
          </div>

          {/* Custom Research Query */}
          <div className="glass-panel rounded-xl p-4 border border-white/10 mb-6">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-400" />
              Custom Research Query
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                placeholder="e.g., 'What happens when PCR > 1.2 and sentiment is negative?'"
                className="flex-1 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-indigo-500"
                onKeyDown={(e) => e.key === 'Enter' && runResearch('custom')}
              />
              <button
                onClick={() => runResearch('custom')}
                disabled={isResearching || !researchQuery.trim() || archivedSnapshots.length < 10}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-bold rounded-lg transition-all"
              >
                {isResearching ? <Activity className="animate-spin" size={16} /> : 'Research'}
              </button>
            </div>
          </div>

          {/* Research Results */}
          {isResearching && (
            <div className="glass-panel rounded-xl p-8 text-center">
              <Activity className="animate-spin mx-auto mb-4 text-indigo-400" size={48} />
              <p className="text-white font-bold mb-2">Analyzing Data...</p>
              <p className="text-sm text-slate-400">Processing {archivedSnapshots.length} snapshots</p>
            </div>
          )}

          {researchResults && !isResearching && (
            <div className="glass-panel rounded-xl p-6 border border-indigo-500/30">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl">
                    <CheckCircle size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Research Results</h3>
                    <p className="text-xs text-slate-400">AI-powered market analysis</p>
                  </div>
                </div>
                <button
                  onClick={() => setResearchResults(null)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Pattern Discovery Results */}
              {researchResults.bullishPatterns && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-panel rounded-xl p-4 border border-blue-500/30 bg-blue-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity size={16} className="text-blue-400" />
                        <span className="text-xs text-slate-400 font-bold">Total Snapshots</span>
                      </div>
                      <div className="text-2xl font-bold text-white">{researchResults.totalSnapshots}</div>
                    </div>
                    <div className="glass-panel rounded-xl p-4 border border-green-500/30 bg-green-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp size={16} className="text-green-400" />
                        <span className="text-xs text-slate-400 font-bold">Bullish Patterns</span>
                      </div>
                      <div className="text-2xl font-bold text-green-400">{researchResults.bullishPatterns.count}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {researchResults.bullishPatterns.successRate.toFixed(1)}% success rate
                      </div>
                    </div>
                    <div className="glass-panel rounded-xl p-4 border border-red-500/30 bg-red-500/5">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingDown size={16} className="text-red-400" />
                        <span className="text-xs text-slate-400 font-bold">Bearish Patterns</span>
                      </div>
                      <div className="text-2xl font-bold text-red-400">{researchResults.bearishPatterns.count}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {researchResults.bearishPatterns.successRate.toFixed(1)}% success rate
                      </div>
                    </div>
                  </div>

                  {/* Decision Making Block */}
                  <div className="glass-panel rounded-xl p-6 border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-indigo-500/10">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Brain size={20} className="text-purple-400" />
                      Trading Decision Insights
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-green-500/30">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowUpCircle size={18} className="text-green-400" />
                          <h5 className="font-bold text-green-400">When to GO LONG</h5>
                        </div>
                        <div className="space-y-2 text-sm text-slate-300">
                          <div className="flex items-start gap-2">
                            <CheckCircle size={14} className="text-green-400 mt-1 flex-shrink-0" />
                            <span>Sentiment turning positive (+10% threshold)</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={14} className="text-green-400 mt-1 flex-shrink-0" />
                            <span>Price follow-through with +20pts movement</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={14} className="text-green-400 mt-1 flex-shrink-0" />
                            <span>Average expected move: <span className="text-green-400 font-bold">+{researchResults.bullishPatterns.avgMove.toFixed(1)} pts</span></span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={14} className="text-green-400 mt-1 flex-shrink-0" />
                            <span>Historical accuracy: <span className="text-green-400 font-bold">{researchResults.bullishPatterns.successRate.toFixed(0)}%</span></span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-red-500/30">
                        <div className="flex items-center gap-2 mb-3">
                          <ArrowDownCircle size={18} className="text-red-400" />
                          <h5 className="font-bold text-red-400">When to GO SHORT</h5>
                        </div>
                        <div className="space-y-2 text-sm text-slate-300">
                          <div className="flex items-start gap-2">
                            <CheckCircle size={14} className="text-red-400 mt-1 flex-shrink-0" />
                            <span>Sentiment deteriorating (-10% threshold)</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={14} className="text-red-400 mt-1 flex-shrink-0" />
                            <span>Price breakdown with -20pts movement</span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={14} className="text-red-400 mt-1 flex-shrink-0" />
                            <span>Average expected move: <span className="text-red-400 font-bold">{researchResults.bearishPatterns.avgMove.toFixed(1)} pts</span></span>
                          </div>
                          <div className="flex items-start gap-2">
                            <CheckCircle size={14} className="text-red-400 mt-1 flex-shrink-0" />
                            <span>Historical accuracy: <span className="text-red-400 font-bold">{researchResults.bearishPatterns.successRate.toFixed(0)}%</span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* PCR Extremes Analysis */}
                  <div className="glass-panel rounded-xl p-5 border border-blue-500/30 bg-blue-500/5">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Scale size={20} className="text-blue-400" />
                      PCR Extreme Levels
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">High PCR (&gt;1.3)</div>
                        <div className="text-2xl font-bold text-bull mb-2">{researchResults.pcrExtremes.highPCR.count} occurrences</div>
                        <div className="text-xs text-slate-400">
                          Avg Price: <span className="text-white font-bold">{researchResults.pcrExtremes.highPCR.avgPrice.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 text-xs text-green-400">💡 Typically bullish signal (puts hedging)</div>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <div className="text-sm text-slate-400 mb-1">Low PCR (&lt;0.7)</div>
                        <div className="text-2xl font-bold text-bear mb-2">{researchResults.pcrExtremes.lowPCR.count} occurrences</div>
                        <div className="text-xs text-slate-400">
                          Avg Price: <span className="text-white font-bold">{researchResults.pcrExtremes.lowPCR.avgPrice.toFixed(2)}</span>
                        </div>
                        <div className="mt-2 text-xs text-red-400">💡 Typically bearish signal (calls hedging)</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Correlation Results */}
              {researchResults.sentimentVsPrice && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-panel rounded-xl p-5 border border-purple-500/30 bg-purple-500/5">
                      <div className="flex items-center gap-2 mb-3">
                        <BarChart3 size={18} className="text-purple-400" />
                        <span className="text-sm font-bold text-white">Sentiment ↔ Price</span>
                      </div>
                      <div className="text-3xl font-bold text-purple-400 mb-2">{researchResults.sentimentVsPrice.correlation}</div>
                      <div className="text-xs text-slate-400">{researchResults.sentimentVsPrice.interpretation}</div>
                      <div className="mt-3 p-2 bg-slate-900/50 rounded text-xs text-slate-300">
                        {Number(researchResults.sentimentVsPrice.correlation) > 0.3 
                          ? '✅ Sentiment is a reliable predictor' 
                          : Number(researchResults.sentimentVsPrice.correlation) < -0.3
                          ? '⚠️ Contrarian indicator - fade the sentiment'
                          : '⚠️ Weak correlation - use other signals'}
                      </div>
                    </div>
                    <div className="glass-panel rounded-xl p-5 border border-blue-500/30 bg-blue-500/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Scale size={18} className="text-blue-400" />
                        <span className="text-sm font-bold text-white">PCR ↔ Price</span>
                      </div>
                      <div className="text-3xl font-bold text-blue-400 mb-2">{researchResults.pcrVsPrice.correlation}</div>
                      <div className="text-xs text-slate-400">{researchResults.pcrVsPrice.interpretation}</div>
                      <div className="mt-3 p-2 bg-slate-900/50 rounded text-xs text-slate-300">
                        {Number(researchResults.pcrVsPrice.correlation) > 0.3 
                          ? '✅ High PCR → Bullish moves' 
                          : Number(researchResults.pcrVsPrice.correlation) < -0.3
                          ? '✅ Low PCR → Bearish moves'
                          : '⚠️ PCR has weak predictive power'}
                      </div>
                    </div>
                    <div className="glass-panel rounded-xl p-5 border border-orange-500/30 bg-orange-500/5">
                      <div className="flex items-center gap-2 mb-3">
                        <Activity size={18} className="text-orange-400" />
                        <span className="text-sm font-bold text-white">Volatility ↔ Sentiment</span>
                      </div>
                      <div className="text-3xl font-bold text-orange-400 mb-2">{researchResults.volatilityVsSentiment.correlation}</div>
                      <div className="text-xs text-slate-400">{researchResults.volatilityVsSentiment.interpretation}</div>
                      <div className="mt-3 p-2 bg-slate-900/50 rounded text-xs text-slate-300">
                        💡 Extreme sentiment = Higher volatility expected
                      </div>
                    </div>
                  </div>

                  {/* Trading Strategy Based on Correlations */}
                  <div className="glass-panel rounded-xl p-6 border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Target size={20} className="text-indigo-400" />
                      Data-Driven Trading Strategy
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <h5 className="font-bold text-green-400 mb-3 flex items-center gap-2">
                          <Zap size={16} />
                          High Probability Bullish Setup
                        </h5>
                        <div className="space-y-2 text-sm text-slate-300">
                          <div>✓ Sentiment: <span className="text-green-400 font-bold">&gt;65%</span></div>
                          <div>✓ PCR: <span className="text-green-400 font-bold">&gt;1.2</span> (if positive correlation)</div>
                          <div>✓ Price: Near support / PDL</div>
                          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-green-400">
                            📈 Expected outcome: <span className="font-bold">+30-50 pts move in 1-2 hours</span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <h5 className="font-bold text-red-400 mb-3 flex items-center gap-2">
                          <Zap size={16} />
                          High Probability Bearish Setup
                        </h5>
                        <div className="space-y-2 text-sm text-slate-300">
                          <div>✓ Sentiment: <span className="text-red-400 font-bold">&lt;35%</span></div>
                          <div>✓ PCR: <span className="text-red-400 font-bold">&lt;0.8</span> (if negative correlation)</div>
                          <div>✓ Price: Near resistance / PDH</div>
                          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-red-400">
                            📉 Expected outcome: <span className="font-bold">-30-50 pts move in 1-2 hours</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Time Analysis Results */}
              {researchResults.bestHours && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel rounded-xl p-5 border border-green-500/30 bg-green-500/5">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <Clock size={20} className="text-green-400" />
                        Best Trading Hours
                      </h4>
                      <div className="space-y-3">
                        {researchResults.bestHours.map((hour: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-white">{hour.hour}</span>
                              <span className="text-xs text-green-400 font-bold">#{idx + 1}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className="text-slate-400">Avg Move</div>
                                <div className={`font-bold ${hour.avgMove > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {hour.avgMove > 0 ? '+' : ''}{hour.avgMove.toFixed(1)} pts
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-400">Volatility</div>
                                <div className="font-bold text-orange-400">{hour.volatility.toFixed(1)} pts</div>
                              </div>
                              <div>
                                <div className="text-slate-400">Samples</div>
                                <div className="font-bold text-blue-400">{hour.count}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-xs text-green-400">
                        💡 Focus your trading during these high-movement hours
                      </div>
                    </div>

                    <div className="glass-panel rounded-xl p-5 border border-red-500/30 bg-red-500/5">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <AlertTriangle size={20} className="text-red-400" />
                        Avoid These Hours
                      </h4>
                      <div className="space-y-3">
                        {researchResults.worstHours.map((hour: any, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-900/50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-bold text-white">{hour.hour}</span>
                              <span className="text-xs text-red-400 font-bold">Low Activity</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <div className="text-slate-400">Avg Move</div>
                                <div className={`font-bold ${hour.avgMove > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {hour.avgMove > 0 ? '+' : ''}{hour.avgMove.toFixed(1)} pts
                                </div>
                              </div>
                              <div>
                                <div className="text-slate-400">Volatility</div>
                                <div className="font-bold text-orange-400">{hour.volatility.toFixed(1)} pts</div>
                              </div>
                              <div>
                                <div className="text-slate-400">Samples</div>
                                <div className="font-bold text-blue-400">{hour.count}</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-400">
                        ⚠️ Low movement hours - consider staying flat
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-xl p-5 border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <Sparkles size={20} className="text-yellow-400" />
                      Time-Based Trading Rules
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div className="p-3 bg-slate-900/50 rounded-lg">
                        <div className="font-bold text-blue-400 mb-1">📍 Market Open (9:15-10:00)</div>
                        <div className="text-xs text-slate-300">High volatility, wait for direction</div>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded-lg">
                        <div className="font-bold text-green-400 mb-1">🎯 Best Hours (10:00-14:00)</div>
                        <div className="text-xs text-slate-300">Prime trading window, follow trends</div>
                      </div>
                      <div className="p-3 bg-slate-900/50 rounded-lg">
                        <div className="font-bold text-orange-400 mb-1">⏰ Market Close (15:00-15:30)</div>
                        <div className="text-xs text-slate-300">Profit booking time, reduce exposure</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Volatility Results */}
              {researchResults.averageVolatility !== undefined && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-panel rounded-xl p-5 border border-blue-500/30 bg-blue-500/5 text-center">
                      <div className="text-sm text-slate-400 mb-2">Average Volatility</div>
                      <div className="text-3xl font-bold text-blue-400">{researchResults.averageVolatility.toFixed(1)} pts</div>
                      <div className="text-xs text-slate-400 mt-2">12-interval rolling window</div>
                    </div>
                    <div className="glass-panel rounded-xl p-5 border border-orange-500/30 bg-orange-500/5 text-center">
                      <div className="text-sm text-slate-400 mb-2">High Volatility Events</div>
                      <div className="text-3xl font-bold text-orange-400">{researchResults.highVolatilityPeriods.count}</div>
                      <div className="text-xs text-slate-400 mt-2">Avg Range: {researchResults.highVolatilityPeriods.avgRange.toFixed(1)} pts</div>
                    </div>
                    <div className="glass-panel rounded-xl p-5 border border-green-500/30 bg-green-500/5 text-center">
                      <div className="text-sm text-slate-400 mb-2">Low Volatility Events</div>
                      <div className="text-3xl font-bold text-green-400">{researchResults.lowVolatilityPeriods.count}</div>
                      <div className="text-xs text-slate-400 mt-2">Avg Range: {researchResults.lowVolatilityPeriods.avgRange.toFixed(1)} pts</div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-xl p-6 border-2 border-purple-500/50 bg-gradient-to-br from-purple-500/10 to-pink-500/10">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Zap size={20} className="text-purple-400" />
                      Volatility Trading Strategy
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-orange-500/30">
                        <h5 className="font-bold text-orange-400 mb-3">High Volatility Regime</h5>
                        <div className="space-y-2 text-sm text-slate-300">
                          <div>• Use wider stops (+50 pts)</div>
                          <div>• Reduce position size by 50%</div>
                          <div>• Target larger moves (1:3 R:R)</div>
                          <div>• Avoid counter-trend trades</div>
                          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-orange-400">
                            ⚡ Big moves expected - trade with caution
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg border border-green-500/30">
                        <h5 className="font-bold text-green-400 mb-3">Low Volatility Regime</h5>
                        <div className="space-y-2 text-sm text-slate-300">
                          <div>• Use tighter stops (+20 pts)</div>
                          <div>• Can increase position size</div>
                          <div>• Target smaller moves (1:1.5 R:R)</div>
                          <div>• Mean reversion works best</div>
                          <div className="mt-3 pt-3 border-t border-white/10 text-xs text-green-400">
                            📊 Range-bound market - scalp and book
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Reversal Results */}
              {researchResults.totalReversals !== undefined && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="glass-panel rounded-xl p-4 border border-purple-500/30 bg-purple-500/5 text-center">
                      <div className="text-xs text-slate-400 mb-2">Total Reversals</div>
                      <div className="text-2xl font-bold text-purple-400">{researchResults.totalReversals}</div>
                    </div>
                    <div className="glass-panel rounded-xl p-4 border border-blue-500/30 bg-blue-500/5 text-center">
                      <div className="text-xs text-slate-400 mb-2">Reversal Rate</div>
                      <div className="text-2xl font-bold text-blue-400">{researchResults.reversalRate}</div>
                    </div>
                    <div className="glass-panel rounded-xl p-4 border border-green-500/30 bg-green-500/5 text-center">
                      <div className="text-xs text-slate-400 mb-2">Avg Sentiment</div>
                      <div className="text-2xl font-bold text-green-400">{researchResults.avgSentimentAtReversal.toFixed(0)}%</div>
                    </div>
                    <div className="glass-panel rounded-xl p-4 border border-orange-500/30 bg-orange-500/5 text-center">
                      <div className="text-xs text-slate-400 mb-2">Avg PCR</div>
                      <div className="text-2xl font-bold text-orange-400">{researchResults.avgPCRAtReversal.toFixed(2)}</div>
                    </div>
                  </div>

                  <div className="glass-panel rounded-xl p-6 border-2 border-red-500/50 bg-gradient-to-br from-red-500/10 to-pink-500/10">
                    <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <AlertTriangle size={20} className="text-red-400" />
                      Reversal Warning Signals
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <h5 className="font-bold text-yellow-400 mb-3">Extreme Sentiment Warning</h5>
                        <div className="space-y-2 text-sm text-slate-300">
                          <div>📊 Typical reversal sentiment: <span className="font-bold text-yellow-400">{researchResults.avgSentimentAtReversal.toFixed(0)}%</span></div>
                          <div className="mt-3 space-y-1 text-xs">
                            <div>• Sentiment &gt;80% → Watch for top</div>
                            <div>• Sentiment &lt;20% → Watch for bottom</div>
                            <div>• Divergence with price → High risk</div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 bg-slate-900/50 rounded-lg">
                        <h5 className="font-bold text-blue-400 mb-3">PCR Reversal Zones</h5>
                        <div className="space-y-2 text-sm text-slate-300">
                          <div>📊 Typical reversal PCR: <span className="font-bold text-blue-400">{researchResults.avgPCRAtReversal.toFixed(2)}</span></div>
                          <div className="mt-3 space-y-1 text-xs">
                            <div>• PCR &gt;1.5 → Extreme bullish, reversal risk</div>
                            <div>• PCR &lt;0.6 → Extreme bearish, reversal risk</div>
                            <div>• Sudden PCR spike → Panic, fade it</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                      <p className="text-sm text-yellow-400 font-bold mb-2">⚠️ Reversal Trading Rules</p>
                      <div className="text-xs text-slate-300 space-y-1">
                        <div>1. Don't chase when sentiment is extreme (&gt;80% or &lt;20%)</div>
                        <div>2. Wait for confirmation - let reversal prove itself</div>
                        <div>3. Use tight stops - reversals can fail quickly</div>
                        <div>4. Take partial profits early - reversals are tricky</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Winning Setups Results */}
              {researchResults.totalWinningSetups !== undefined && (
                <div className="space-y-6">
                  <div className="glass-panel rounded-xl p-5 border border-emerald-500/30 bg-emerald-500/5 text-center">
                    <div className="text-sm text-slate-400 mb-2">High Probability Setups Found</div>
                    <div className="text-4xl font-bold text-emerald-400 mb-2">{researchResults.totalWinningSetups}</div>
                    <div className="text-xs text-slate-400">Moves &gt;20 pts in next 30 minutes</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="glass-panel rounded-xl p-6 border-2 border-green-500/50 bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-green-400" />
                        Perfect Bullish Setup
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">Count</div>
                          <div className="text-2xl font-bold text-green-400">{researchResults.bullish.count} setups</div>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">Optimal Sentiment</div>
                          <div className="text-2xl font-bold text-white">{researchResults.bullish.avgSentiment.toFixed(1)}%</div>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">Optimal PCR</div>
                          <div className="text-2xl font-bold text-white">{researchResults.bullish.avgPCR.toFixed(2)}</div>
                        </div>
                        <div className="p-4 bg-green-500/20 border border-green-500/40 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">Average Move</div>
                          <div className="text-3xl font-bold text-green-400">+{researchResults.bullish.avgMove.toFixed(1)} pts</div>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-sm text-green-400 font-bold mb-2">✅ Entry Checklist</p>
                        <div className="text-xs text-slate-300 space-y-1">
                          <div>□ Sentiment: {(researchResults.bullish.avgSentiment - 10).toFixed(0)}% - {(researchResults.bullish.avgSentiment + 10).toFixed(0)}%</div>
                          <div>□ PCR: {(researchResults.bullish.avgPCR - 0.2).toFixed(2)} - {(researchResults.bullish.avgPCR + 0.2).toFixed(2)}</div>
                          <div>□ Price near support level</div>
                          <div>□ Momentum turning positive</div>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel rounded-xl p-6 border-2 border-red-500/50 bg-gradient-to-br from-red-500/10 to-pink-500/10">
                      <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                        <TrendingDown size={20} className="text-red-400" />
                        Perfect Bearish Setup
                      </h4>
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">Count</div>
                          <div className="text-2xl font-bold text-red-400">{researchResults.bearish.count} setups</div>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">Optimal Sentiment</div>
                          <div className="text-2xl font-bold text-white">{researchResults.bearish.avgSentiment.toFixed(1)}%</div>
                        </div>
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">Optimal PCR</div>
                          <div className="text-2xl font-bold text-white">{researchResults.bearish.avgPCR.toFixed(2)}</div>
                        </div>
                        <div className="p-4 bg-red-500/20 border border-red-500/40 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">Average Move</div>
                          <div className="text-3xl font-bold text-red-400">{researchResults.bearish.avgMove.toFixed(1)} pts</div>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-sm text-red-400 font-bold mb-2">✅ Entry Checklist</p>
                        <div className="text-xs text-slate-300 space-y-1">
                          <div>□ Sentiment: {(researchResults.bearish.avgSentiment - 10).toFixed(0)}% - {(researchResults.bearish.avgSentiment + 10).toFixed(0)}%</div>
                          <div>□ PCR: {(researchResults.bearish.avgPCR - 0.2).toFixed(2)} - {(researchResults.bearish.avgPCR + 0.2).toFixed(2)}</div>
                          <div>□ Price near resistance level</div>
                          <div>□ Momentum turning negative</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Custom Query Results */}
              {researchResults.query && (
                <div className="space-y-4">
                  <div className="glass-panel rounded-xl p-5 border border-indigo-500/30 bg-indigo-500/5">
                    <h4 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <Sparkles size={20} className="text-indigo-400" />
                      Custom Query Results
                    </h4>
                    <div className="p-4 bg-slate-900/50 rounded-lg mb-4">
                      <div className="text-xs text-slate-400 mb-1">Query</div>
                      <div className="text-sm text-white font-mono">{researchResults.query}</div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-3 bg-slate-900/50 rounded-lg">
                        <div className="text-xs text-slate-400 mb-1">Data Points</div>
                        <div className="text-xl font-bold text-white">{researchResults.dataPoints}</div>
                      </div>
                      {researchResults.filtered !== undefined && (
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">Matching</div>
                          <div className="text-xl font-bold text-blue-400">{researchResults.filtered}</div>
                        </div>
                      )}
                      {researchResults.avgPriceMove !== undefined && (
                        <div className="p-3 bg-slate-900/50 rounded-lg">
                          <div className="text-xs text-slate-400 mb-1">Avg Move</div>
                          <div className={`text-xl font-bold ${researchResults.avgPriceMove > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {researchResults.avgPriceMove > 0 ? '+' : ''}{researchResults.avgPriceMove.toFixed(1)} pts
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Export/Save Section */}
              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="text-xs text-slate-400">
                  💡 Tip: Use these insights to refine your trading strategy
                </div>
                <button
                  onClick={() => {
                    const dataStr = JSON.stringify(researchResults, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `research-results-${Date.now()}.json`;
                    link.click();
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-lg transition-all flex items-center gap-2"
                >
                  <Download size={14} />
                  Export JSON
                </button>
              </div>
            </div>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default AILab;
