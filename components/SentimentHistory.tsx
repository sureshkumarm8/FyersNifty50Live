
import React from 'react';
import { MarketSnapshot } from '../types';
import { Clock } from 'lucide-react';

interface SentimentHistoryProps {
  history: MarketSnapshot[];
}

const formatNumber = (num: number, decimals = 2) => num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const formatPercent = (num: number) => {
    const color = num > 0 ? 'text-green-400' : num < 0 ? 'text-red-400' : 'text-gray-400';
    return <span className={`font-mono ${color}`}>{num > 0 ? '+' : ''}{num.toFixed(2)}%</span>;
};
const formatMillions = (num: number) => {
    const val = num / 1000000;
    return `${val.toFixed(2)}M`;
};

export const SentimentHistory: React.FC<SentimentHistoryProps> = ({ history }) => {
  return (
    <div className="flex flex-col h-full bg-gray-900 overflow-hidden">
      <div className="p-4 border-b border-gray-800 bg-gray-900/90 backdrop-blur">
          <h2 className="text-xl font-bold text-blue-400 flex items-center gap-2">
             <Clock size={24} />
             Day Sentiment & Momentum History
          </h2>
      </div>
      
      <div className="flex-1 overflow-auto custom-scrollbar">
         <table className="w-full text-sm text-center border-collapse">
            <thead className="sticky top-0 bg-gray-950 text-gray-500 uppercase text-xs font-semibold z-10">
               <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-2 py-3">Nifty LTP</th>
                  <th className="px-2 py-3">Pts Chg</th>
                  <th className="px-2 py-3 border-l border-gray-800">Overall Sent.</th>
                  <th className="px-2 py-3">Adv/Dec</th>
                  <th className="px-2 py-3">Stock Sent.</th>
                  
                  <th className="px-2 py-3 border-l border-gray-800">Call Sent</th>
                  <th className="px-2 py-3">Puts Sent</th>
                  <th className="px-2 py-3">PCR</th>
                  <th className="px-2 py-3 bg-gray-800/50">Options Sent.</th>
                  
                  <th className="px-2 py-3 border-l border-gray-800">Calls Buy/Sell (M)</th>
                  <th className="px-2 py-3">Puts Buy/Sell (M)</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
               {history.slice().reverse().map((snap, idx) => (
                 <tr key={idx} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 text-left font-bold text-gray-300 font-mono">{snap.time}</td>
                    <td className="px-2 py-3 font-mono text-gray-400">{formatNumber(snap.niftyLtp)}</td>
                    <td className={`px-2 py-3 font-mono font-bold ${snap.ptsChg >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                       {snap.ptsChg > 0 ? '+' : ''}{snap.ptsChg}
                    </td>
                    
                    <td className="px-2 py-3 border-l border-gray-800 font-bold">{formatPercent(snap.overallSent)}</td>
                    <td className="px-2 py-3 font-mono">
                       <span className="text-green-500">{snap.adv}</span> / <span className="text-red-500">{snap.dec}</span>
                    </td>
                    <td className="px-2 py-3">{formatPercent(snap.stockSent)}</td>
                    
                    <td className="px-2 py-3 border-l border-gray-800">{formatPercent(snap.callSent)}</td>
                    <td className="px-2 py-3">{formatPercent(snap.putSent)}</td>
                    <td className="px-2 py-3 font-mono text-blue-200">{snap.pcr.toFixed(2)}</td>
                    <td className="px-2 py-3 font-bold bg-gray-800/30">{formatPercent(snap.optionsSent)}</td>
                    
                    <td className="px-2 py-3 border-l border-gray-800 font-mono text-xs">
                       <span className="text-green-400">{formatMillions(snap.callsBuyQty)}</span> / <span className="text-red-400">{formatMillions(snap.callsSellQty)}</span>
                    </td>
                    <td className="px-2 py-3 font-mono text-xs">
                       <span className="text-green-400">{formatMillions(snap.putsBuyQty)}</span> / <span className="text-red-400">{formatMillions(snap.putsSellQty)}</span>
                    </td>
                 </tr>
               ))}
               {history.length === 0 && (
                  <tr>
                     <td colSpan={12} className="py-12 text-gray-600">Waiting for next snapshot (Updates every minute)...</td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );
};
