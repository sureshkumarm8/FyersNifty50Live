import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { FyersCredentials } from '../types';
import { fetchStockHistory } from '../services/fyersService';

interface StockDetailProps {
  symbol: string;
  credentials: FyersCredentials;
  onBack: () => void;
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const StockDetail: React.FC<StockDetailProps> = ({ symbol, credentials, onBack }) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parse Symbol for Display
  // NSE:SBIN-EQ -> SBIN
  // NSE:NIFTY24OCT25000CE -> NIFTY 24OCT 25000 CE
  const isOption = symbol.includes('CE') || symbol.includes('PE');
  let displayName = symbol.replace('NSE:', '').replace('-EQ', '');
  let optionDetails = { expiry: '', strike: '', type: '' };

  if (isOption) {
      // Regex to extract Nifty Option parts: NIFTY + Year(2) + Month/Date(3/1) + Strike + Type(2)
      // Standard format: NSE:NIFTY24OCT25000CE
      // Enhanced Regex: Handles Strikes 3-6 digits
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
        const rawCandles = await fetchStockHistory(symbol, credentials);
        
        // Fyers format: [epoch, open, high, low, close, volume]
        const formatted = rawCandles.map(c => ({
          time: new Date(c[0] * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          open: c[1],
          high: c[2],
          low: c[3],
          close: c[4],
          volume: c[5],
          epoch: c[0]
        }))
        // Ensure strictly sorted by time descending
        .sort((a, b) => b.epoch - a.epoch);

        setCandles(formatted);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadHistory();
  }, [symbol, credentials]);

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
               1-Min Intraday
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
                <Clock size={32} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-300">No Data Available</h3>
            <p className="text-sm max-w-xs text-center mt-2">No trading activity recorded for this symbol in the current session.</p>
        </div>
      )}

      {!loading && !error && candles.length > 0 && (
        <div className="flex-1 overflow-auto bg-slate-900/40 border border-white/5 rounded-2xl custom-scrollbar shadow-2xl backdrop-blur-sm">
           <table className="w-full text-sm text-right whitespace-nowrap">
              <thead className="bg-slate-900/90 text-slate-400 sticky top-0 z-10 uppercase text-[10px] font-bold tracking-widest backdrop-blur-md">
                 <tr>
                    <th className="px-6 py-4 text-left">Time</th>
                    <th className="px-6 py-4">Open</th>
                    <th className="px-6 py-4">High</th>
                    <th className="px-6 py-4">Low</th>
                    <th className="px-6 py-4">Close</th>
                    <th className="px-6 py-4">Volume</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                 {candles.map((c, idx) => {
                    const isGreen = c.close >= c.open;
                    return (
                        <tr key={idx} className="hover:bg-white/5 transition-colors group">
                           <td className="px-6 py-3 text-left font-mono text-slate-500 group-hover:text-slate-300">{c.time}</td>
                           <td className="px-6 py-3 font-mono text-slate-400">{c.open}</td>
                           <td className="px-6 py-3 font-mono text-green-400/80">{c.high}</td>
                           <td className="px-6 py-3 font-mono text-red-400/80">{c.low}</td>
                           <td className={`px-6 py-3 font-mono font-bold ${isGreen ? 'text-bull' : 'text-bear'}`}>{c.close}</td>
                           <td className="px-6 py-3 font-mono text-slate-300 opacity-80">{c.volume.toLocaleString()}</td>
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