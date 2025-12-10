import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock } from 'lucide-react';
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

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true);
        const rawCandles = await fetchStockHistory(symbol, credentials);
        
        // Fyers format: [epoch, open, high, low, close, volume]
        const formatted = rawCandles.map(c => ({
          time: new Date(c[0] * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          open: c[1],
          high: c[2],
          low: c[3],
          close: c[4],
          volume: c[5]
        })).reverse(); // Show newest first

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
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-800 rounded-lg text-gray-300 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
           <h2 className="text-2xl font-bold text-white">{symbol}</h2>
           <p className="text-sm text-gray-400">Intraday 1-Minute Data</p>
        </div>
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 text-red-300 rounded-lg border border-red-800">
          Error: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="flex-1 overflow-auto bg-gray-900 border border-gray-800 rounded-xl">
           <table className="w-full text-sm text-right">
              <thead className="bg-gray-950 text-gray-400 sticky top-0">
                 <tr>
                    <th className="px-4 py-3 text-left">Time</th>
                    <th className="px-4 py-3">Open</th>
                    <th className="px-4 py-3">High</th>
                    <th className="px-4 py-3">Low</th>
                    <th className="px-4 py-3">Close</th>
                    <th className="px-4 py-3">Volume</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                 {candles.map((c, idx) => (
                    <tr key={idx} className="hover:bg-gray-800/50">
                       <td className="px-4 py-3 text-left font-mono text-gray-500">{c.time}</td>
                       <td className="px-4 py-3 font-mono text-white">{c.open}</td>
                       <td className="px-4 py-3 font-mono text-green-400">{c.high}</td>
                       <td className="px-4 py-3 font-mono text-red-400">{c.low}</td>
                       <td className="px-4 py-3 font-mono text-white">{c.close}</td>
                       <td className="px-4 py-3 font-mono text-gray-300">{c.volume.toLocaleString()}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>
      )}
    </div>
  );
};
