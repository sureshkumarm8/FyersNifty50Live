

import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, AlertCircle, TrendingUp, TrendingDown, Database } from 'lucide-react';
import { FyersCredentials, SessionCandle } from '../types';
import { fetchStockHistory } from '../services/fyersService';

interface StockDetailProps {
  symbol: string;
  credentials: FyersCredentials;
  onBack: () => void;
  sessionData?: SessionCandle[]; // Data collected locally during the session
}

interface DetailedCandle {
  time: string;
  lp: number;
  lp_chg_1m_p?: number;
  lp_chg_day_p?: number;
  chp?: number; // Daily %
  total_buy_qty?: number;
  bid_qty_chg_p?: number;
  bid_chg_day_p?: number;
  total_sell_qty?: number;
  ask_qty_chg_p?: number;
  ask_chg_day_p?: number;
  net_strength_1m?: number;
  day_net_strength?: number;
  volume?: number;
  
  // API Fallback Fields
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  
  epoch: number;
  source: 'LIVE' | 'API';
}

const formatNumber = (num: number | undefined) => num?.toLocaleString('en-IN') || '--';
const formatPercent = (num: number | undefined) => {
    if (num === undefined) return '--';
    const color = num > 0 ? 'text-bull' : num < 0 ? 'text-bear' : 'text-slate-400';
    // Fix: Using 1 decimal point for consistency
    return <span className={color}>{num > 0 ? '+' : ''}{num.toFixed(1)}%</span>;
};
const formatQty = (num: number | undefined) => num ? (num > 1000000 ? `${(num/1000000).toFixed(2)}M` : num > 1000 ? `${(num/1000).toFixed(1)}k` : num.toString()) : '--';

export const StockDetail: React.FC<StockDetailProps> = ({ symbol, credentials, onBack, sessionData }) => {
  const [candles, setCandles] = useState<DetailedCandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse Symbol for Display
  const isOption = symbol.includes('CE') || symbol.includes('PE');
  let displayName = symbol.replace('NSE:', '').replace('-EQ', '');
  let optionDetails = { expiry: '', strike: '', type: '' };

  if (isOption) {
      const match = displayName.match(/([A-Z]+)(\d{2})([A-Z0-9]{1,3})(\d{3,6})(CE|PE)/);
      if (match) {
          const [_, underlying, yy, mmm, strike, type] = match;
          displayName = underlying;
          optionDetails = { expiry: `${mmm} '${yy}`, strike, type };
      }
  }

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        let allCandles: DetailedCandle[] = [];

        // 1. Prefer Local Session Data (Rich Data)
        if (sessionData && sessionData.length > 0) {
            const localCandles: DetailedCandle[] = sessionData.map(s => ({
                time: s.time,
                lp: s.lp,
                lp_chg_1m_p: s.lp_chg_1m_p,
                lp_chg_day_p: s.lp_chg_day_p,
                chp: s.chp,
                total_buy_qty: s.total_buy_qty,
                bid_qty_chg_p: s.bid_qty_chg_p,
                bid_chg_day_p: s.bid_chg_day_p,
                total_sell_qty: s.total_sell_qty,
                ask_qty_chg_p: s.ask_qty_chg_p,
                ask_chg_day_p: s.ask_chg_day_p,
                net_strength_1m: s.net_strength_1m,
                day_net_strength: s.day_net_strength,
                volume: s.volume,
                epoch: Math.floor(s.timestamp / 1000),
                source: 'LIVE'
            }));
            allCandles = [...localCandles];
        }

        // 2. Fetch API History if local data is sparse (< 5 mins)
        if (allCandles.length < 5) {
             try {
                const rawCandles = await fetchStockHistory(symbol, credentials);
                const apiCandles: DetailedCandle[] = rawCandles.map(c => ({
                  time: new Date(c[0] * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                  lp: c[4], // Close price as LTP
                  open: c[1],
                  high: c[2],
                  low: c[3],
                  close: c[4],
                  volume: c[5],
                  epoch: c[0],
                  source: 'API'
                }));
                
                if (apiCandles.length > 0) {
                    const oldestLocal = allCandles.length > 0 ? allCandles[0].epoch : Infinity;
                    const usefulApiCandles = apiCandles.filter(ac => ac.epoch < oldestLocal);
                    allCandles = [...usefulApiCandles, ...allCandles];
                }
             } catch(e) {
                 console.warn("API History fetch failed or skipped", e);
             }
        }

        // Sort descending by time
        allCandles.sort((a, b) => b.epoch - a.epoch);
        setCandles(allCandles);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, [symbol, credentials, sessionData]);

  return (
    <div className="flex flex-col h-full animate-in fade-in zoom-in duration-200">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 bg-slate-800/50 border border-white/10 rounded-xl text-gray-300 hover:text-white hover:bg-slate-700 transition-colors shadow-lg"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
           <div className="flex items-baseline gap-2">
               <h2 className="text-2xl font-black text-white tracking-tight">{displayName}</h2>
               {isOption && (
                   <span className={`px-2 py-0.5 rounded text-xs font-bold ${optionDetails.type === 'CE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                       {optionDetails.strike} {optionDetails.type}
                   </span>
               )}
           </div>
           <p className="text-xs text-gray-400 font-mono flex items-center gap-2">
               {isOption ? `EXP: ${optionDetails.expiry}` : 'EQUITY'} 
               <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
               {candles.length > 0 && candles[0].source === 'LIVE' ? 'Live Session Feed' : '1-Min Intraday'}
           </p>
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
           <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-slate-800 border-t-blue-500 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6]"></div>
                </div>
           </div>
           <p className="text-slate-500 text-xs uppercase tracking-widest animate-pulse">Loading History...</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/10 text-red-300 rounded-xl border border-red-500/20 flex items-center gap-3">
          <AlertCircle size={20} className="shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {!loading && !error && candles.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <div className="p-4 bg-slate-900 rounded-full mb-4">
                <Database size={32} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-300">No Data Available</h3>
            <p className="text-sm max-w-xs text-center mt-2">No trading activity recorded locally or via API.</p>
        </div>
      )}

      {!loading && !error && candles.length > 0 && (
        <div className="flex-1 overflow-auto bg-slate-900/40 border border-white/5 rounded-2xl custom-scrollbar shadow-2xl backdrop-blur-sm">
           <table className="w-full text-xs sm:text-sm text-right whitespace-nowrap">
              <thead className="bg-slate-900/90 text-slate-400 sticky top-0 z-10 uppercase text-[10px] font-bold tracking-widest backdrop-blur-md">
                 <tr>
                    <th className="px-4 py-4 text-left">Time</th>
                    <th className="px-4 py-4 text-white">LTP</th>
                    <th className="px-4 py-4">1m %</th>
                    <th className="px-4 py-4">Sess %</th>
                    <th className="px-4 py-4">Day %</th>
                    <th className="px-4 py-4">Volume</th>
                    <th className="px-4 py-4 text-bull-light">T.Bid</th>
                    <th className="px-4 py-4 text-bull-light">B.1m%</th>
                    <th className="px-4 py-4 text-bull-light">B.Day%</th>
                    <th className="px-4 py-4 text-bear-light">T.Ask</th>
                    <th className="px-4 py-4 text-bear-light">A.1m%</th>
                    <th className="px-4 py-4 text-bear-light">A.Day%</th>
                    <th className="px-4 py-4 text-blue-300">1m Net%</th>
                    <th className="px-4 py-4 text-blue-300">Day Net%</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {candles.map((c, idx) => {
                    const isApi = c.source === 'API';
                    return (
                        <tr key={idx} className={`hover:bg-white/5 transition-colors group ${isApi ? 'opacity-70' : ''}`}>
                           <td className="px-4 py-3 text-left font-mono text-slate-500 group-hover:text-slate-300 border-r border-white/5">{c.time}</td>
                           <td className="px-4 py-3 font-mono font-bold text-white border-r border-white/5">{formatNumber(c.lp)}</td>
                           
                           {isApi ? (
                               <>
                                 <td colSpan={12} className="px-4 py-3 text-center text-slate-600 text-[10px] italic">
                                    Volume: {formatQty(c.volume)} (Basic OHLCV API Data)
                                 </td>
                               </>
                           ) : (
                               <>
                                 <td className="px-4 py-3 font-mono">{formatPercent(c.lp_chg_1m_p)}</td>
                                 <td className="px-4 py-3 font-mono">{formatPercent(c.lp_chg_day_p)}</td>
                                 <td className="px-4 py-3 font-mono border-r border-white/5">{formatPercent(c.chp)}</td>
                                 <td className="px-4 py-3 font-mono text-slate-300 border-r border-white/5">{formatQty(c.volume)}</td>
                                 
                                 <td className="px-4 py-3 font-mono text-bull-light opacity-80">{formatQty(c.total_buy_qty)}</td>
                                 <td className="px-4 py-3 font-mono text-bull-light">{formatPercent(c.bid_qty_chg_p)}</td>
                                 <td className="px-4 py-3 font-mono text-bull-light border-r border-white/5">{formatPercent(c.bid_chg_day_p)}</td>
                                 
                                 <td className="px-4 py-3 font-mono text-bear-light opacity-80">{formatQty(c.total_sell_qty)}</td>
                                 <td className="px-4 py-3 font-mono text-bear-light">{formatPercent(c.ask_qty_chg_p)}</td>
                                 <td className="px-4 py-3 font-mono text-bear-light border-r border-white/5">{formatPercent(c.ask_chg_day_p)}</td>
                                 
                                 <td className="px-4 py-3 font-mono font-bold bg-slate-800/30">{formatPercent(c.net_strength_1m)}</td>
                                 <td className="px-4 py-3 font-mono font-bold bg-slate-800/30">{formatPercent(c.day_net_strength)}</td>
                               </>
                           )}
                        </tr>
                    );
                 })}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
};