/**
 * PATTERN DASHBOARD
 * 
 * Visual display of learned patterns and historical comparisons
 * - Live pattern matches
 * - Pattern library
 * - Similar day finder
 * - Historical comparison view
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Clock, Target, BarChart3, Calendar,
  CheckCircle, AlertCircle, Search, Filter, ChevronRight, Zap,
  Brain, Activity, ArrowRight, Eye, Sparkles, Download, History, X, Trash2, Upload
} from 'lucide-react';
import { MarketSnapshot, Pattern, DailyArchive } from '../types';
import { patternMiner } from '../services/patternMiner';
import { lifecycleManager } from '../services/lifecycleManager';
import { dbService } from '../services/db';
import { downloadCSV, importCSVFile } from '../services/csv';
import { SentimentHistory } from './SentimentHistory';
import { aiPatternAnalyzer } from '../services/aiPatternAnalyzer';

interface PatternDashboardProps {
  currentSnapshot: MarketSnapshot | null;
  niftyLtp: number | null;
  credentials: any; // For SentimentHistory
}

const PatternDashboard: React.FC<PatternDashboardProps> = ({ currentSnapshot, niftyLtp, credentials }) => {
  const [activeTab, setActiveTab] = useState<'patterns' | 'archives'>('patterns');
  const [liveMatches, setLiveMatches] = useState<Pattern[]>([]);
  const [allPatterns, setAllPatterns] = useState<Pattern[]>([]);
  const [similarDays, setSimilarDays] = useState<DailyArchive[]>([]);
  const [allArchives, setAllArchives] = useState<DailyArchive[]>([]);
  const [archiveStats, setArchiveStats] = useState<any>(null);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [selectedDay, setSelectedDay] = useState<DailyArchive | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [filterConfidence, setFilterConfidence] = useState(0);
  const [isLoadingArchives, setIsLoadingArchives] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationMessage, setMigrationMessage] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Enhancement states
  const [aiPrediction, setAIPrediction] = useState<any>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [patternExplanation, setPatternExplanation] = useState<string>('');

  // Load initial data
  useEffect(() => {
    loadPatterns();
    loadArchiveStats();
  }, []);

  // Check for pattern matches
  useEffect(() => {
    if (currentSnapshot) {
      checkPatternMatches();
      findSimilarDays();
    }
  }, [currentSnapshot]);
  
  // AI Enhancement: Get AI prediction using patterns
  const getAIPrediction = async () => {
    if (!currentSnapshot || !credentials?.aiEnabled) return;
    
    setLoadingAI(true);
    try {
      const prediction = await aiPatternAnalyzer.getAIPrediction(
        credentials,
        currentSnapshot
      );
      setAIPrediction(prediction);
    } catch (error) {
      console.error('AI prediction failed:', error);
    } finally {
      setLoadingAI(false);
    }
  };
  
  // AI Enhancement: Auto-refresh AI prediction
  useEffect(() => {
    if (currentSnapshot && credentials?.aiEnabled) {
      getAIPrediction();
      
      // Refresh every 2 minutes
      const interval = setInterval(getAIPrediction, 120000);
      return () => clearInterval(interval);
    }
  }, [currentSnapshot, credentials?.aiEnabled]);
  
  // AI Enhancement: Explain pattern with AI
  const explainPatternWithAI = async (pattern: Pattern) => {
    if (!credentials?.aiEnabled) return;
    
    try {
      const explanation = await aiPatternAnalyzer.explainPattern(credentials, pattern);
      setPatternExplanation(explanation);
    } catch (error) {
      console.error('Pattern explanation failed:', error);
    }
  };

  const loadPatterns = async () => {
    try {
      const patterns = await patternMiner.getAllPatterns();
      setAllPatterns(patterns);
    } catch (error) {
      console.error('Failed to load patterns:', error);
    }
  };

  const loadArchiveStats = async () => {
    try {
      const stats = await lifecycleManager.getArchiveStats();
      setArchiveStats(stats);
    } catch (error) {
      console.error('Failed to load archive stats:', error);
    }
  };

  const loadAllArchives = async () => {
    setIsLoadingArchives(true);
    try {
      const archives = await dbService.getAllArchives();
      setAllArchives(archives.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Failed to load archives:', error);
    } finally {
      setIsLoadingArchives(false);
    }
  };

  // Load archives when switching to archives tab
  useEffect(() => {
    if (activeTab === 'archives' && allArchives.length === 0) {
      loadAllArchives();
    }
  }, [activeTab]);

  const exportDayCSV = (archive: DailyArchive) => {
    const csvData = archive.snapshots.map((snapshot, index) => ({
      timestamp: new Date(snapshot.timestamp).toISOString(),
      time: new Date(snapshot.timestamp).toLocaleTimeString('en-IN', { hour12: false }),
      niftyLTP: snapshot.niftyLtp,
      change: snapshot.niftyChange || 0,
      changePercent: snapshot.niftyChangePercent || 0,
      sentiment: snapshot.overallSent || 0,
      pcr: snapshot.pcr || 0,
      callOI: snapshot.callOI || 0,
      putOI: snapshot.putOI || 0,
      vix: snapshot.vix || 0,
      bullishStocks: snapshot.bullishCount || 0,
      bearishStocks: snapshot.bearishCount || 0,
      advanceDecline: (snapshot.bullishCount || 0) - (snapshot.bearishCount || 0),
      momentum: index > 0 ? snapshot.niftyLtp - archive.snapshots[index - 1].niftyLtp : 0,
      cumulativeMomentum: archive.snapshots.slice(0, index + 1).reduce((sum, s, i) => {
        if (i === 0) return 0;
        return sum + (s.niftyLtp - archive.snapshots[i - 1].niftyLtp);
      }, 0)
    }));

    const dateStr = new Date(archive.date).toISOString().slice(0, 10);
    downloadCSV(csvData, `nifty_sentiment_momentum_${dateStr}`);
  };

  const handleDeleteArchive = async (archive: DailyArchive, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    
    if (!confirm(`⚠️ Delete archive for ${archive.date}?\n\nThis will permanently delete:\n• ${archive.snapshots.length} snapshots\n• All session data\n• Summary & metadata\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await dbService.deleteArchive(archive.date);
      setAllArchives(prev => prev.filter(a => a.date !== archive.date));
      
      // Update stats
      const stats = await lifecycleManager.getArchiveStats();
      setArchiveStats(stats);
      
      // Clear selected day if it was deleted
      if (selectedDay?.date === archive.date) {
        setSelectedDay(null);
      }
    } catch (error) {
      console.error('Failed to delete archive:', error);
      alert('❌ Failed to delete archive');
    }
  };

  const checkPatternMatches = async () => {
    if (!currentSnapshot) return;
    
    try {
      const matches = await patternMiner.matchPatterns(currentSnapshot);
      setLiveMatches(matches);
    } catch (error) {
      console.error('Failed to check pattern matches:', error);
    }
  };

  const findSimilarDays = async () => {
    if (!currentSnapshot) return;
    
    try {
      const similar = await patternMiner.findSimilarSetups(currentSnapshot, 30);
      setSimilarDays(similar.slice(0, 5)); // Top 5
    } catch (error) {
      console.error('Failed to find similar days:', error);
    }
  };

  const scanForNewPatterns = async () => {
    setIsScanning(true);
    try {
      const archives = await dbService.getAllArchives();
      let newPatternsCount = 0;
      
      for (const archive of archives.slice(0, 10)) { // Last 10 days
        const patterns = await patternMiner.analyzeDay(archive.date, credentials);
        newPatternsCount += patterns.length;
      }
      
      await loadPatterns();
      const method = credentials?.aiEnabled ? 'AI-powered' : 'traditional';
      alert(`✅ Scan complete! Found ${newPatternsCount} pattern occurrences using ${method} detection`);
    } catch (error) {
      console.error('Pattern scan failed:', error);
      alert('❌ Pattern scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleMigrateData = async () => {
    if (!confirm('🔄 This will migrate all historical snapshots to daily archives. Continue?')) {
      return;
    }

    setIsMigrating(true);
    setMigrationMessage('Starting migration...');

    try {
      const result = await lifecycleManager.migrateHistoricalData();
      
      if (result.success) {
        setMigrationMessage(`✅ ${result.message}`);
        // Reload archives
        await loadAllArchives();
        await loadArchiveStats();
      } else {
        setMigrationMessage(`❌ ${result.message}`);
      }
    } catch (error) {
      setMigrationMessage(`❌ Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsMigrating(false);
      setTimeout(() => setMigrationMessage(null), 5000);
    }
  };

  const handleImportCSV = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsImporting(true);
    setImportMessage(`Importing ${files.length} file(s)...`);

    try {
      let importedCount = 0;
      
      console.log(`🔄 Importing ${files.length} file(s)`);
      
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

        // Try to extract date from filename (e.g., "nifty_2024-01-15.csv" or "data_15-01-2024.csv")
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
              // YYYY-MM-DD format
              extractedDate = new Date(`${match[1]}-${match[2]}-${match[3]}`);
            } else {
              // DD-MM-YYYY format
              extractedDate = new Date(`${match[3]}-${match[2]}-${match[1]}`);
            }
            if (!isNaN(extractedDate.getTime())) {
              console.log(`  📅 Extracted date from filename: ${extractedDate.toDateString()}`);
              break;
            }
          }
        }

        // Convert CSV rows to MarketSnapshot format
        const snapshots: MarketSnapshot[] = data.map((row: any, idx: number) => {
          // Parse timestamp - handle various formats
          let timestamp: number;
          const timeStr = row.timestamp || row.time;
          
          if (timeStr) {
            const parsed = new Date(timeStr);
            if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
              timestamp = parsed.getTime();
            } else if (extractedDate) {
              // Use extracted date + time from string
              const timeMatch = String(timeStr).match(/(\d{2}):(\d{2}):(\d{2})/);
              if (timeMatch) {
                const dateWithTime = new Date(extractedDate);
                dateWithTime.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), parseInt(timeMatch[3]));
                timestamp = dateWithTime.getTime();
              } else {
                timestamp = extractedDate.getTime() + (idx * 60000); // Add minutes offset
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
            pcr: Number(row.pcr || 0),
            callOI: Number(row.callOI || 0),
            putOI: Number(row.putOI || 0),
            vix: Number(row.vix || 0),
            bullishCount: Number(row.bullishStocks || row.bullishCount || 0),
            bearishCount: Number(row.bearishStocks || row.bearishCount || 0),
            stockSent: Number(row.momentum || row.stockSent || 0),
            ptsChg: Number(row.change || row.ptsChg || 0)
          };
        });

        // Sort by timestamp
        snapshots.sort((a, b) => a.timestamp - b.timestamp);
        
        // Get date from first snapshot or extracted date
        const date = extractedDate 
          ? extractedDate.toDateString() 
          : new Date(snapshots[0].timestamp).toDateString();
        console.log(`  📅 Final date: ${date} (${snapshots.length} snapshots)`);
        
        // Check if already exists
        const existingArchive = await dbService.getArchive(date);
        if (existingArchive) {
          console.log(`  ⏭️ Skipping - already exists`);
          continue;
        }
        
        // Create archive for this file/date
        const prices = snapshots.map(s => s.niftyLtp);
        const archive: DailyArchive = {
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
          metadata: {
            totalTrades: 0,
            pnl: 0,
            winRate: 0,
            patterns: []
          }
        };
        
        await dbService.archiveDailyData(date, archive);
        console.log(`  ✅ Archived ${date}`);
        importedCount++;
      }

      if (importedCount > 0) {
        setImportMessage(`✅ Imported ${importedCount} day(s) of data!`);
        // Reload archives to show new data
        await loadAllArchives();
        await loadArchiveStats();
      } else {
        setImportMessage('⚠️ No new data imported (may already exist)');
      }
      
    } catch (error) {
      console.error('❌ Import error:', error);
      setImportMessage(`❌ Failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsImporting(false);
      setTimeout(() => {
        setImportMessage(null);
        // Reset file input to allow re-import
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 5000);
    }
  };

  const filteredPatterns = allPatterns.filter(p => p.confidence >= filterConfidence);

  return (
    <div className="h-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-none glass-header border-b border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Brain className="text-purple-400" size={24} />
              Pattern Recognition
            </h1>
            
            {archiveStats && (
              <div className="text-xs text-slate-400 font-mono">
                {archiveStats.totalDays} days • {archiveStats.totalSnapshots.toLocaleString()} snapshots
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'patterns' && (
              <>
                {/* Confidence Filter */}
                <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-lg border border-white/10">
                  <Filter size={14} className="text-slate-400" />
                  <span className="text-xs text-slate-400">Min Confidence:</span>
                  <select
                    value={filterConfidence}
                    onChange={(e) => setFilterConfidence(Number(e.target.value))}
                    className="bg-transparent text-white text-xs font-bold outline-none cursor-pointer"
                  >
                    <option value={0}>All</option>
                    <option value={50}>50%+</option>
                    <option value={70}>70%+</option>
                    <option value={80}>80%+</option>
                  </select>
                </div>

                {/* Scan Button */}
                <button
                  onClick={scanForNewPatterns}
                  disabled={isScanning}
                  className={`px-4 py-2 ${credentials?.aiEnabled ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700' : 'bg-purple-600 hover:bg-purple-700'} disabled:bg-purple-900 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-all`}
                >
                  {isScanning ? (
                    <>
                      <Activity className="animate-spin" size={14} />
                      {credentials?.aiEnabled ? 'AI Analyzing...' : 'Scanning...'}
                    </>
                  ) : (
                    <>
                      {credentials?.aiEnabled ? <Brain size={14} /> : <Zap size={14} />}
                      {credentials?.aiEnabled ? 'AI Pattern Discovery' : 'Scan Archives'}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-t border-white/5 pt-3">
          <button
            onClick={() => setActiveTab('patterns')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'patterns'
                ? 'bg-purple-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles size={14} />
              Patterns
            </div>
          </button>
          <button
            onClick={() => setActiveTab('archives')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              activeTab === 'archives'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Calendar size={14} />
              Archives ({allArchives.length || archiveStats?.totalDays || 0})
            </div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'patterns' ? (
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        
        {/* Left Column: Live Matches & Similar Days */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          
          {/* AI Prediction Panel - NEW */}
          {credentials?.aiEnabled && (
            <div className="glass-panel rounded-xl p-4 border-2 border-purple-500/30">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                  <Brain size={16} className="animate-pulse" />
                  AI-Powered Prediction
                </h2>
                {loadingAI && (
                  <Activity className="animate-spin text-purple-400" size={14} />
                )}
              </div>
              
              {aiPrediction ? (
                <div>
                  {/* Direction */}
                  <div className={`text-2xl font-bold mb-2 ${
                    aiPrediction.direction === 'UP' ? 'text-green-400' :
                    aiPrediction.direction === 'DOWN' ? 'text-red-400' :
                    'text-yellow-400'
                  }`}>
                    {aiPrediction.direction === 'UP' ? '📈 BULLISH' :
                     aiPrediction.direction === 'DOWN' ? '📉 BEARISH' :
                     '➡️ NEUTRAL'}
                  </div>
                  
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="bg-slate-900/50 p-2 rounded">
                      <div className="text-xs text-slate-400">Confidence</div>
                      <div className="text-lg font-bold text-white">
                        {aiPrediction.confidence}%
                      </div>
                    </div>
                    <div className="bg-slate-900/50 p-2 rounded">
                      <div className="text-xs text-slate-400">Expected</div>
                      <div className={`text-lg font-bold ${
                        aiPrediction.expectedMove > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {aiPrediction.expectedMove > 0 ? '+' : ''}{aiPrediction.expectedMove} pts
                      </div>
                    </div>
                  </div>
                  
                  {/* AI Reasoning */}
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3 mb-3">
                    <div className="text-xs text-purple-300 mb-1">AI Reasoning:</div>
                    <div className="text-sm text-white">{aiPrediction.reasoning}</div>
                  </div>
                  
                  {/* Supporting Patterns */}
                  {aiPrediction.supportingPatterns && aiPrediction.supportingPatterns.length > 0 && (
                    <div className="text-xs text-slate-400 mb-2">
                      Based on {aiPrediction.supportingPatterns.length} pattern match(es):
                      <div className="mt-1 space-y-1">
                        {aiPrediction.supportingPatterns.slice(0, 3).map((p: any) => (
                          <div key={p.id} className="text-purple-400">
                            • {p.name} ({p.confidence}%)
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <button
                    onClick={getAIPrediction}
                    className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded transition-all"
                  >
                    🔄 Refresh Prediction
                  </button>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500 text-sm">
                  <Brain size={24} className="mx-auto mb-2 opacity-50" />
                  <p>Waiting for live data...</p>
                  <button
                    onClick={getAIPrediction}
                    disabled={!currentSnapshot}
                    className="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-800 disabled:text-slate-600 text-white text-xs font-bold rounded transition-all"
                  >
                    Get AI Prediction
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Live Pattern Matches */}
          <div className="glass-panel rounded-xl p-4">
            <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-yellow-400" />
              Live Pattern Matches ({liveMatches.length})
            </h2>
            
            {liveMatches.length > 0 ? (
              <div className="space-y-2">
                {liveMatches.map(pattern => (
                  <div
                    key={pattern.id}
                    onClick={() => setSelectedPattern(pattern)}
                    className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-3 cursor-pointer hover:from-purple-500/20 hover:to-blue-500/20 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-white">{pattern.name}</div>
                      <div className="text-xs font-bold text-purple-400">
                        {pattern.confidence}% confidence
                      </div>
                    </div>
                    <div className="text-xs text-slate-400">{pattern.description}</div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      <Target size={12} className="text-green-400" />
                      <span className="text-green-400">
                        Exp: {pattern.outcome.nextHourMove > 0 ? '+' : ''}{pattern.outcome.nextHourMove.toFixed(0)} pts
                      </span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-400">{pattern.outcome.sampleSize} occurrences</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">
                <Eye size={24} className="mx-auto mb-2 opacity-50" />
                <p>No pattern matches at this time</p>
                {!currentSnapshot && <p className="text-xs mt-1">Waiting for live data...</p>}
              </div>
            )}
          </div>

          {/* Similar Historical Days */}
          <div className="glass-panel rounded-xl p-4">
            <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-blue-400" />
              Similar Past Days ({similarDays.length})
            </h2>
            
            {similarDays.length > 0 ? (
              <div className="space-y-2">
                {similarDays.map(day => (
                  <div
                    key={day.date}
                    onClick={() => setSelectedDay(day)}
                    className="bg-slate-900/50 border border-white/5 rounded-lg p-3 cursor-pointer hover:border-blue-500/30 hover:bg-slate-900/80 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-white">{day.date}</div>
                      <div className={`text-xs font-bold ${
                        day.summary.close - day.summary.open > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {day.summary.close - day.summary.open > 0 ? '+' : ''}{(day.summary.close - day.summary.open).toFixed(0)} pts
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-slate-500">Range</div>
                        <div className="text-white">{day.summary.range.toFixed(0)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">PCR</div>
                        <div className="text-white">{day.summary.avgPCR.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-slate-500">Sent</div>
                        <div className={day.summary.dominantSentiment > 0 ? 'text-green-400' : 'text-red-400'}>
                          {day.summary.dominantSentiment.toFixed(0)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-sm">
                <Calendar size={24} className="mx-auto mb-2 opacity-50" />
                <p>No similar days found</p>
                {!currentSnapshot && <p className="text-xs mt-1">Waiting for live data...</p>}
              </div>
            )}
          </div>
        </div>

        {/* Middle Column: Pattern Library */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          <div className="glass-panel rounded-xl p-4">
            <h2 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-2">
              <BarChart3 size={16} />
              Pattern Library ({filteredPatterns.length})
            </h2>
            
            {filteredPatterns.length > 0 ? (
              <div className="space-y-2">
                {filteredPatterns.map(pattern => (
                  <div
                    key={pattern.id}
                    onClick={() => setSelectedPattern(pattern)}
                    className={`border rounded-lg p-3 cursor-pointer transition-all ${
                      selectedPattern?.id === pattern.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/5 bg-slate-900/50 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-white text-sm">{pattern.name}</div>
                      <div className={`text-xs px-2 py-0.5 rounded font-bold ${
                        pattern.confidence >= 80 ? 'bg-green-500/20 text-green-400' :
                        pattern.confidence >= 60 ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {pattern.confidence}%
                      </div>
                    </div>
                    <div className="text-xs text-slate-400 mb-2">{pattern.description}</div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock size={10} className="text-slate-500" />
                        <span className="text-slate-400">{pattern.conditions.timeWindow || 'Any'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle size={10} className="text-slate-500" />
                        <span className="text-slate-400">{pattern.occurrences}×</span>
                      </div>
                      <div className={`flex items-center gap-1 ${
                        pattern.outcome.nextHourMove > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {pattern.outcome.nextHourMove > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        <span>{pattern.outcome.nextHourMove > 0 ? '+' : ''}{pattern.outcome.nextHourMove.toFixed(0)} pts</span>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Last seen: {pattern.lastSeen}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm">
                <BarChart3 size={32} className="mx-auto mb-2 opacity-50" />
                <p>No patterns match current filter</p>
                <p className="text-xs mt-1">Try lowering the confidence threshold</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Pattern Details / Day Comparison */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          {selectedPattern ? (
            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white">{selectedPattern.name}</h2>
                <button
                  onClick={() => setSelectedPattern(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Confidence Score */}
                <div>
                  <div className="text-xs text-slate-400 mb-2">Confidence Score</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-900 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          selectedPattern.confidence >= 80 ? 'bg-green-500' :
                          selectedPattern.confidence >= 60 ? 'bg-yellow-500' :
                          'bg-slate-500'
                        }`}
                        style={{ width: `${selectedPattern.confidence}%` }}
                      />
                    </div>
                    <div className="text-xl font-bold text-white">
                      {selectedPattern.confidence}%
                    </div>
                  </div>
                </div>

                {/* Conditions */}
                <div>
                  <div className="text-xs text-slate-400 mb-2">Conditions</div>
                  <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 text-sm">
                    {selectedPattern.conditions.timeWindow && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Time Window</span>
                        <span className="text-white font-bold">{selectedPattern.conditions.timeWindow}</span>
                      </div>
                    )}
                    {selectedPattern.conditions.sentimentShift && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Sentiment Shift</span>
                        <span className="text-white font-bold">
                          {selectedPattern.conditions.sentimentShift > 0 ? '+' : ''}
                          {selectedPattern.conditions.sentimentShift.toFixed(0)}
                        </span>
                      </div>
                    )}
                    {selectedPattern.conditions.niftyMoveRange && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Nifty Range</span>
                        <span className="text-white font-bold">
                          {selectedPattern.conditions.niftyMoveRange.min.toFixed(0)} to {selectedPattern.conditions.niftyMoveRange.max.toFixed(0)} pts
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expected Outcome */}
                <div>
                  <div className="text-xs text-slate-400 mb-2">Expected Outcome</div>
                  <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-slate-400 text-sm">Next Hour Move</span>
                      <span className={`text-xl font-bold ${
                        selectedPattern.outcome.nextHourMove > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedPattern.outcome.nextHourMove > 0 ? '+' : ''}
                        {selectedPattern.outcome.nextHourMove.toFixed(0)} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Reliability</span>
                      <span className="text-white font-bold">{selectedPattern.outcome.reliability.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Sample Size</span>
                      <span className="text-white font-bold">{selectedPattern.outcome.sampleSize} days</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Avg Duration</span>
                      <span className="text-white font-bold">{selectedPattern.outcome.avgDuration} mins</span>
                    </div>
                  </div>
                </div>

                {/* Historical Occurrences */}
                <div>
                  <div className="text-xs text-slate-400 mb-2">Historical Occurrences</div>
                  <div className="text-sm text-slate-300">
                    Detected {selectedPattern.occurrences} times
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Last seen: {selectedPattern.lastSeen}
                  </div>
                </div>
              </div>
            </div>
          ) : selectedDay ? (
            <div className="glass-panel rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white">{selectedDay.date}</h2>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                {/* Day Summary */}
                <div>
                  <div className="text-xs text-slate-400 mb-2">Day Summary</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-slate-900/50 rounded-lg p-2">
                      <div className="text-slate-400 text-xs">Open</div>
                      <div className="text-white font-bold">{selectedDay.summary.open.toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-2">
                      <div className="text-slate-400 text-xs">Close</div>
                      <div className={`font-bold ${
                        selectedDay.summary.close > selectedDay.summary.open ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedDay.summary.close.toFixed(0)}
                      </div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-2">
                      <div className="text-slate-400 text-xs">High</div>
                      <div className="text-white font-bold">{selectedDay.summary.high.toFixed(0)}</div>
                    </div>
                    <div className="bg-slate-900/50 rounded-lg p-2">
                      <div className="text-slate-400 text-xs">Low</div>
                      <div className="text-white font-bold">{selectedDay.summary.low.toFixed(0)}</div>
                    </div>
                  </div>
                </div>

                {/* Day Move */}
                <div>
                  <div className="text-xs text-slate-400 mb-2">Day Performance</div>
                  <div className={`bg-gradient-to-r rounded-lg p-3 ${
                    selectedDay.summary.close > selectedDay.summary.open
                      ? 'from-green-500/10 to-emerald-500/10 border border-green-500/30'
                      : 'from-red-500/10 to-rose-500/10 border border-red-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-300">Total Move</span>
                      <span className={`text-2xl font-bold ${
                        selectedDay.summary.close > selectedDay.summary.open ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedDay.summary.close > selectedDay.summary.open ? '+' : ''}
                        {(selectedDay.summary.close - selectedDay.summary.open).toFixed(0)} pts
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-sm">
                      <span className="text-slate-400">Range</span>
                      <span className="text-white font-bold">{selectedDay.summary.range.toFixed(0)} pts</span>
                    </div>
                  </div>
                </div>

                {/* Market Metrics */}
                <div>
                  <div className="text-xs text-slate-400 mb-2">Market Metrics</div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Dominant Sentiment</span>
                      <span className={`font-bold ${
                        selectedDay.summary.dominantSentiment > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedDay.summary.dominantSentiment.toFixed(1)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Avg PCR</span>
                      <span className="text-white font-bold">{selectedDay.summary.avgPCR.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Volatility</span>
                      <span className="text-white font-bold">{selectedDay.summary.volatility.toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                {/* Top/Worst Performers */}
                {(selectedDay.summary.topPerformer || selectedDay.summary.worstPerformer) && (
                  <div>
                    <div className="text-xs text-slate-400 mb-2">Stock Performance</div>
                    <div className="space-y-2 text-sm">
                      {selectedDay.summary.topPerformer && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Top Performer</span>
                          <span className="text-green-400 font-bold">{selectedDay.summary.topPerformer}</span>
                        </div>
                      )}
                      {selectedDay.summary.worstPerformer && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Worst Performer</span>
                          <span className="text-red-400 font-bold">{selectedDay.summary.worstPerformer}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Trade Stats */}
                {selectedDay.metadata.totalTrades > 0 && (
                  <div>
                    <div className="text-xs text-slate-400 mb-2">Trading Activity</div>
                    <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Total Trades</span>
                        <span className="text-white font-bold">{selectedDay.metadata.totalTrades}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">P&L</span>
                        <span className={`font-bold ${
                          selectedDay.metadata.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {selectedDay.metadata.pnl >= 0 ? '+' : ''}₹{selectedDay.metadata.pnl.toFixed(0)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Win Rate</span>
                        <span className="text-white font-bold">
                          {(selectedDay.metadata.winRate * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="glass-panel rounded-xl p-4 flex items-center justify-center h-full">
              <div className="text-center text-slate-500">
                <Brain size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-sm">Select a pattern or day to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
        /* ARCHIVES VIEW */
        <div className="flex-1 overflow-hidden p-4">
          {selectedDay ? (
            /* Archive Detail View */
            <div className="h-full glass-panel rounded-xl p-6 overflow-y-auto custom-scrollbar">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">{selectedDay.date}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowHistoryModal(true)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded-lg transition-all flex items-center gap-2"
                  >
                    <History size={14} />
                    View History ({selectedDay.snapshots.length})
                  </button>
                  <button
                    onClick={() => exportDayCSV(selectedDay)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-all flex items-center gap-2"
                  >
                    <Download size={14} />
                    Export CSV
                  </button>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-sm rounded-lg transition-all"
                  >
                    ← Back to Archives
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* OHLC Summary */}
                <div className="glass-panel rounded-xl p-4">
                  <h3 className="text-sm font-bold text-slate-400 mb-3">Price Summary</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Open</span>
                      <span className="text-white font-bold text-lg">{selectedDay.summary.open.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">High</span>
                      <span className="text-green-400 font-bold text-lg">{selectedDay.summary.high.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Low</span>
                      <span className="text-red-400 font-bold text-lg">{selectedDay.summary.low.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Close</span>
                      <span className="text-white font-bold text-lg">{selectedDay.summary.close.toFixed(2)}</span>
                    </div>
                    <div className={`p-3 rounded-lg ${
                      selectedDay.summary.close > selectedDay.summary.open
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                    }`}>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Change</span>
                        <span className={`font-bold text-lg ${
                          selectedDay.summary.close > selectedDay.summary.open ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {selectedDay.summary.close > selectedDay.summary.open ? '+' : ''}
                          {(selectedDay.summary.close - selectedDay.summary.open).toFixed(2)} 
                          ({((selectedDay.summary.close - selectedDay.summary.open) / selectedDay.summary.open * 100).toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Market Stats */}
                <div className="glass-panel rounded-xl p-4">
                  <h3 className="text-sm font-bold text-slate-400 mb-3">Market Metrics</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Range</span>
                      <span className="text-white font-bold">{selectedDay.summary.range.toFixed(2)} pts</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Volatility</span>
                      <span className="text-white font-bold">{selectedDay.summary.volatility.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Total Volume</span>
                      <span className="text-white font-bold">{(selectedDay.summary.totalVolume / 1000000).toFixed(2)}M</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Avg Sentiment</span>
                      <span className={`font-bold ${
                        selectedDay.summary.dominantSentiment > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {selectedDay.summary.dominantSentiment.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Avg PCR</span>
                      <span className="text-white font-bold">{selectedDay.summary.avgPCR.toFixed(3)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Snapshots</span>
                      <span className="text-blue-400 font-bold">{selectedDay.snapshots.length}</span>
                    </div>
                  </div>
                </div>

                {/* Top/Worst Performers */}
                {(selectedDay.summary.topPerformer || selectedDay.summary.worstPerformer) && (
                  <div className="glass-panel rounded-xl p-4 lg:col-span-2">
                    <h3 className="text-sm font-bold text-slate-400 mb-3">Stock Performance</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedDay.summary.topPerformer && (
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <div className="text-xs text-slate-400 mb-1">Top Performer</div>
                          <div className="text-green-400 font-bold">{selectedDay.summary.topPerformer}</div>
                        </div>
                      )}
                      {selectedDay.summary.worstPerformer && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          <div className="text-xs text-slate-400 mb-1">Worst Performer</div>
                          <div className="text-red-400 font-bold">{selectedDay.summary.worstPerformer}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Archive List View */
            <div className="h-full glass-panel rounded-xl p-6 overflow-y-auto custom-scrollbar">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Daily Archives</h2>
              {isLoadingArchives && (
                <div className="text-sm text-slate-400 flex items-center gap-2">
                  <Activity className="animate-spin" size={14} />
                  Loading...
                </div>
              )}
            </div>

            {/* Show import button even when archives exist */}
            <div className="mb-4 flex items-center justify-end gap-2">
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
                className="px-4 py-2 bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:cursor-not-allowed text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-all"
                type="button"
              >
                {isImporting ? (
                  <>
                    <Activity className="animate-spin" size={14} />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload size={14} />
                    Import More
                  </>
                )}
              </button>
            </div>
            
            {importMessage && (
              <div className={`mb-4 text-sm px-3 py-2 rounded-lg border ${
                importMessage.startsWith('✅') 
                  ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                  : importMessage.startsWith('⚠️')
                  ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                  : 'bg-red-500/10 border-red-500/30 text-red-400'
              }`}>
                {importMessage}
              </div>
            )}
            
            {allArchives.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {allArchives.map((archive) => {
                  const dateObj = new Date(archive.date);
                  const dayChange = archive.summary.close - archive.summary.open;
                  const dayChangePercent = (dayChange / archive.summary.open) * 100;
                  const isPositive = dayChange >= 0;

                  return (
                    <div
                      key={archive.date}
                      className="bg-slate-900/50 border border-white/10 rounded-lg p-4 cursor-pointer hover:border-blue-500/50 hover:bg-slate-900/70 transition-all relative group"
                    >
                      {/* Delete Button */}
                      <button
                        onClick={(e) => handleDeleteArchive(archive, e)}
                        className="absolute top-2 right-2 p-1.5 bg-red-600/80 hover:bg-red-600 text-white rounded opacity-0 group-hover:opacity-100 transition-all z-10"
                        title="Delete Archive"
                      >
                        <Trash2 size={14} />
                      </button>

                      {/* Card Content - Make clickable */}
                      <div onClick={() => setSelectedDay(archive)}>
                      {/* Date Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="text-sm font-bold text-white">
                          {dateObj.toLocaleDateString('en-IN', { 
                            day: '2-digit', 
                            month: 'short', 
                            year: 'numeric' 
                          })}
                        </div>
                        <div className="text-xs text-slate-500">
                          {dateObj.toLocaleDateString('en-IN', { weekday: 'short' })}
                        </div>
                      </div>

                      {/* OHLC */}
                      <div className="space-y-1 mb-3 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">Open</span>
                          <span className="text-white font-mono">{archive.summary.open.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">High</span>
                          <span className="text-green-400 font-mono">{archive.summary.high.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Low</span>
                          <span className="text-red-400 font-mono">{archive.summary.low.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Close</span>
                          <span className="text-white font-mono font-bold">{archive.summary.close.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Change */}
                      <div className={`flex items-center justify-between p-2 rounded ${
                        isPositive ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'
                      }`}>
                        <div className="flex items-center gap-1">
                          {isPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                          <span className={`text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? '+' : ''}{dayChange.toFixed(2)}
                          </span>
                        </div>
                        <span className={`text-xs font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {isPositive ? '+' : ''}{dayChangePercent.toFixed(2)}%
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-slate-500">Snapshots</div>
                          <div className="text-white font-bold">{archive.snapshots.length}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Range</div>
                          <div className="text-white font-bold">{archive.summary.range.toFixed(1)}</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Volume</div>
                          <div className="text-white font-bold">{(archive.summary.totalVolume / 1000000).toFixed(1)}M</div>
                        </div>
                        <div>
                          <div className="text-slate-500">Volatility</div>
                          <div className="text-white font-bold">{archive.summary.volatility.toFixed(1)}</div>
                        </div>
                      </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : isLoadingArchives ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-slate-500">
                  <Activity className="animate-spin mx-auto mb-4" size={48} />
                  <p>Loading archives...</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center max-w-md">
                  <Calendar size={48} className="mx-auto mb-4 opacity-50 text-slate-500" />
                  <p className="text-sm text-slate-400 mb-2">No archives found</p>
                  <p className="text-xs text-slate-500 mb-6">
                    {migrationMessage || importMessage ? (
                      <span className={(migrationMessage || importMessage)?.startsWith('✅') ? 'text-green-400' : 'text-red-400'}>
                        {migrationMessage || importMessage}
                      </span>
                    ) : (
                      'Data will be archived daily at 3:45 PM IST'
                    )}
                  </p>
                  
                  {/* Import & Migration Buttons */}
                  <div className="space-y-3">
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
                    
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        className="px-6 py-3 bg-green-600 hover:bg-green-500 disabled:bg-green-900 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg"
                        type="button"
                      >
                        {isImporting ? (
                          <>
                            <Activity className="animate-spin" size={16} />
                            Importing...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            Import CSV Data
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={handleMigrateData}
                        disabled={isMigrating}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:cursor-not-allowed text-white font-bold rounded-lg flex items-center gap-2 transition-all shadow-lg"
                      >
                        {isMigrating ? (
                          <>
                            <Activity className="animate-spin" size={16} />
                            Migrating...
                          </>
                        ) : (
                          <>
                            <Download size={16} />
                            Migrate Data
                          </>
                        )}
                      </button>
                    </div>
                    
                    <p className="text-xs text-slate-500 max-w-sm mx-auto">
                      Import CSV files with market data or migrate existing snapshots to archives
                    </p>
                  </div>
                </div>
              </div>
            )}
            </div>
          )}
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-7xl h-[90vh] bg-slate-950 rounded-xl border border-white/20 shadow-2xl flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex-none flex items-center justify-between p-4 border-b border-white/10 bg-slate-900/50">
              <h2 className="text-xl font-bold text-white">Market History - {selectedDay.date}</h2>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-all"
              >
                <X size={20} className="text-slate-400 hover:text-white" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-hidden">
              <SentimentHistory 
                history={selectedDay.snapshots} 
                credentials={credentials}
                aiEnabled={credentials?.aiEnabled}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatternDashboard;
