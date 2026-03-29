/**
 * PATTERN DASHBOARD
 * 
 * Visual display of learned patterns and historical comparisons
 * - Live pattern matches
 * - Pattern library
 * - Similar day finder
 * - Historical comparison view
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Clock, Target, BarChart3, Calendar,
  CheckCircle, AlertCircle, Search, Filter, ChevronRight, Zap,
  Brain, Activity, ArrowRight, Eye, Sparkles
} from 'lucide-react';
import { MarketSnapshot, Pattern, DailyArchive } from '../types';
import { patternMiner } from '../services/patternMiner';
import { lifecycleManager } from '../services/lifecycleManager';
import { dbService } from '../services/db';

interface PatternDashboardProps {
  currentSnapshot: MarketSnapshot | null;
  niftyLtp: number | null;
}

const PatternDashboard: React.FC<PatternDashboardProps> = ({ currentSnapshot, niftyLtp }) => {
  const [liveMatches, setLiveMatches] = useState<Pattern[]>([]);
  const [allPatterns, setAllPatterns] = useState<Pattern[]>([]);
  const [similarDays, setSimilarDays] = useState<DailyArchive[]>([]);
  const [archiveStats, setArchiveStats] = useState<any>(null);
  const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
  const [selectedDay, setSelectedDay] = useState<DailyArchive | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [filterConfidence, setFilterConfidence] = useState(0);

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
        const patterns = await patternMiner.analyzeDay(archive.date);
        newPatternsCount += patterns.length;
      }
      
      await loadPatterns();
      alert(`✅ Scan complete! Found ${newPatternsCount} pattern occurrences`);
    } catch (error) {
      console.error('Pattern scan failed:', error);
      alert('❌ Pattern scan failed');
    } finally {
      setIsScanning(false);
    }
  };

  const filteredPatterns = allPatterns.filter(p => p.confidence >= filterConfidence);

  return (
    <div className="h-full bg-slate-950 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex-none glass-header border-b border-white/10 p-4">
        <div className="flex items-center justify-between">
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
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-900 text-white font-bold text-sm rounded-lg flex items-center gap-2 transition-all"
            >
              {isScanning ? (
                <>
                  <Activity className="animate-spin" size={14} />
                  Scanning...
                </>
              ) : (
                <>
                  <Zap size={14} />
                  Scan Archives
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
        
        {/* Left Column: Live Matches & Similar Days */}
        <div className="lg:col-span-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
          
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
    </div>
  );
};

export default PatternDashboard;
