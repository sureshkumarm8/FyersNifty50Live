import React from 'react';
import { MarketSnapshot } from '../types';
import { Clock, Activity } from 'lucide-react';

interface SentimentHistoryProps {
  history: MarketSnapshot[];
}

const formatNumber = (num: number, decimals = 2) => num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const formatPercent = (num: number) => {
    const isPos = num > 0;
    const isNeg = num < 0;
    const colorClass = isPos ? 'text-bull text-glow-green' : isNeg ? 'text-bear text-glow-red' : 'text-slate-400';
    return <span className={`font-mono font-bold ${colorClass}`}>{isPos ? '+' : ''}{num.toFixed(2)}%</span>;
};
const formatMillions = (num: number) => {
    const val = num / 1000000;
    return `${val.toFixed(2)}M`;
};

export const SentimentHistory: React.FC<SentimentHistoryProps> = ({ history }) => {
  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-5 border-b border-white/10 glass-header flex items-center justify-between">
          <h2 className="text-lg font-bold text-blue-400 flex items-center gap-3 uppercase tracking-wider">
             <Clock size={20} className="text-blue-500" />
             Day Sentiment & Momentum History
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
             <Activity size={14} className="animate-pulse text-green-500" />
             Live Feed (1 min)
          </div>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
         <table className="w-full text-sm text-center border-collapse">
            <thead className="sticky top-0 glass-header text-slate-500 uppercase text-[10px] font-bold tracking-widest z-10">
               <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-2 py-3">Nifty LTP</th>
                  <th className="px-2 py-3">Pts Chg</th>
                  <th className="px-2 py-3 border-l border-white/5">Overall Sent.</th>
                  <th className="px-2 py-3">Adv/Dec</th>
                  <th className="px-2 py-3">Stock Sent.</th>
                  
                  <th className="px-2 py-3 border-l border-white/5">Call Sent</th>
                  <th className="px-2 py-3">Puts Sent</th>
                  <th className="px-2 py-3">PCR</th>
                  <th className="px-2 py-3 bg-white/5">Options Sent.</th>
                  
                  <th className="px-2 py-3 border-l border-white/5">Calls Buy/Sell (M)</th>
                  <th className="px-2 py-3">Puts Buy/Sell (M)</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5 bg-slate-900/20">
               {history.slice().reverse().map((snap, idx) => (
                 <tr key={idx} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-3 text-left font-bold text-slate-300 font-mono border-r border-white/5 bg-slate-900/30 group-hover:text-blue-400">{snap.time}</td>
                    <td className="px-2 py-3 font-mono text-slate-400 group-hover:text-white">{formatNumber(snap.niftyLtp)}</td>
                    <td className={`px-2 py-3 font-mono font-bold ${snap.ptsChg >= 0 ? 'text-bull' : 'text-bear'}`}>
                       {snap.ptsChg > 0 ? '+' : ''}{snap.ptsChg}
                    </td>
                    
                    <td className="px-2 py-3 border-l border-white/5 font-bold bg-white/5">{formatPercent(snap.overallSent)}</td>
                    <td className="px-2 py-3 font-mono">
                       <span className="text-bull font-bold">{snap.adv}</span> / <span className="text-bear font-bold">{snap.dec}</span>
                    </td>
                    <td className="px-2 py-3">{formatPercent(snap.stockSent)}</td>
                    
                    <td className="px-2 py-3 border-l border-white/5">{formatPercent(snap.callSent)}</td>
                    <td className="px-2 py-3">{formatPercent(snap.putSent)}</td>
                    <td className={`px-2 py-3 font-mono font-bold ${snap.pcr > 1 ? 'text-bull' : snap.pcr < 0.7 ? 'text-bear' : 'text-blue-200'}`}>{snap.pcr.toFixed(2)}</td>
                    <td className="px-2 py-3 font-bold bg-white/5 border-l border-white/5">{formatPercent(snap.optionsSent)}</td>
                    
                    <td className="px-2 py-3 border-l border-white/5 font-mono text-xs opacity-80">
                       <span className="text-bull">{formatMillions(snap.callsBuyQty)}</span> <span className="text-slate-600">/</span> <span className="text-bear">{formatMillions(snap.callsSellQty)}</span>
                    </td>
                    <td className="px-2 py-3 font-mono text-xs opacity-80">
                       <span className="text-bull">{formatMillions(snap.putsBuyQty)}</span> <span className="text-slate-600">/</span> <span className="text-bear">{formatMillions(snap.putsSellQty)}</span>
                    </td>
                 </tr>
               ))}
               {history.length === 0 && (
                  <tr>
                     <td colSpan={12} className="py-24 text-slate-600 font-mono uppercase tracking-widest text-xs">Waiting for Market Snapshot...</td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};