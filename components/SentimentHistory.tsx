
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { MarketSnapshot } from '../types';
import { Clock, Activity, Bot, Send, X, MessageSquare, Loader2, Sparkles, ChevronRight, ChevronLeft, Download, Trash2 } from 'lucide-react';
import { downloadCSV } from '../services/csv';

interface SentimentHistoryProps {
  history: MarketSnapshot[];
  apiKey?: string;
}

const formatNumber = (num: number, decimals = 2) => num.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
const formatPercent = (num: number) => {
    const isPos = num > 0;
    const isNeg = num < 0;
    const colorClass = isPos ? 'text-bull text-glow-green' : isNeg ? 'text-bear text-glow-red' : 'text-slate-400';
    return <span className={`font-mono font-bold ${colorClass}`}>{isPos ? '+' : ''}{num.toFixed(1)}%</span>;
};
const formatMillions = (num: number) => {
    const val = num / 1000000;
    return `${val.toFixed(2)}M`;
};

// --- Definitions for AI Context ---
const MATH_CONTEXT = `
FORMULA DEFINITIONS FOR THIS SCREEN:
1. Overall Sentiment: (Sum of Bullish Weights - Sum of Bearish Weights) / Total Weight of Nifty 50. (Weight is market cap weight).
   - Interpretation: High +ve means heavyweights (HDFC, Reliance) are moving up.
2. Stock Sentiment: (Session Buy Volume Delta - Session Sell Volume Delta) / Session Sell Volume Delta.
   - Interpretation: Pure demand/supply ratio in equity segment.
3. Options Sentiment: Call Sentiment - Put Sentiment.
   - Interpretation: Net option pressure. Positive means Call Buying > Put Buying.
4. Call/Put Sentiment: (Buy Qty Delta - Sell Qty Delta) / Sell Qty Delta for that option type.
5. PCR (Put-Call Ratio): Total Put OI / Total Call OI.
   - Interpretation: >1 is usually bullish (Put writers active), <0.7 bearish.
`;

// --- Markdown Renderer ---
const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const parseMarkdown = (text: string) => {
        let html = text
            // Escape HTML
            .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            
            // Code Blocks
            .replace(/```([\s\S]*?)```/g, '<pre class="bg-slate-950 p-3 rounded-lg border border-white/10 my-2 overflow-x-auto text-xs font-mono text-emerald-400">$1</pre>')
            .replace(/`([^`]+)`/g, '<code class="bg-slate-800 px-1.5 py-0.5 rounded font-mono text-xs text-yellow-300">$1</code>')

            // Headers
            .replace(/^### (.*$)/gim, '<h3 class="font-bold text-sm text-indigo-300 mt-3 mb-1">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="font-bold text-base text-white mt-4 mb-2">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="font-black text-lg text-white mt-4 mb-2">$1</h1>')
            
            // Bold & Italic
            .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
            .replace(/\*(.*?)\*/g, '<em class="text-slate-300">$1</em>')
            
            // Lists (Unordered)
            .replace(/^\s*-\s+(.*)$/gm, '<li class="flex items-start gap-2 mb-1 pl-1"><span class="mt-1.5 w-1 h-1 bg-slate-400 rounded-full shrink-0"></span><span>$1</span></li>');

        // Paragraphs & Newline Handling
        html = html.split('\n\n').map(segment => {
            const trimmed = segment.trim();
            if (trimmed.startsWith('<h') || trimmed.startsWith('<pre') || trimmed.startsWith('<li')) {
                return segment;
            }
            return `<p class="mb-2 last:mb-0">${segment.replace(/\n/g, '<br/>')}</p>`;
        }).join('');

        return html;
    };

    return <div className="markdown-content text-sm leading-relaxed text-slate-300" dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }} />;
};

export const SentimentHistory: React.FC<SentimentHistoryProps> = ({ history, apiKey }) => {
  const [isAiOpen, setIsAiOpen] = useState(false);
  
  // Persistence for History Chat
  const todayKey = `history_chat_${new Date().toDateString()}`;
  
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>(() => {
      try {
          const saved = localStorage.getItem(todayKey);
          return saved ? JSON.parse(saved) : [{ role: 'model', text: 'I am ready to analyze this history log. I know exactly how these metrics are calculated. What would you like to know?' }];
      } catch {
          return [{ role: 'model', text: 'I am ready to analyze this history log. I know exactly how these metrics are calculated. What would you like to know?' }];
      }
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-save chat
  useEffect(() => {
      localStorage.setItem(todayKey, JSON.stringify(messages));
  }, [messages, todayKey]);

  useEffect(() => {
    if (isAiOpen) {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAiOpen]);

  const clearChat = () => {
      if(confirm("Clear this conversation?")) {
          setMessages([{ role: 'model', text: 'History cleared. Ready for new analysis.' }]);
      }
  };

  const generateContext = () => {
      // Full history is vital for analyzing morning trends vs current.
      // Gemini 2.5 Flash has a large context window, so we pass the full session log.
      const fullHistory = history.map(s => 
          `T:${s.time}|N:${s.niftyLtp}|Sent:${s.overallSent.toFixed(1)}|Opt:${s.optionsSent.toFixed(1)}|PCR:${s.pcr.toFixed(2)}|CallM:${(s.callsBuyQty/1000000).toFixed(2)}|PutM:${(s.putsBuyQty/1000000).toFixed(2)}`
      ).join('\n');
      return `FULL SESSION HISTORY LOG:\n${fullHistory}`;
  };

  const handleSend = async (overrideInput?: string) => {
      const userMsg = overrideInput || input;
      if (!userMsg.trim() || isLoading) return;
      
      if (!overrideInput) setInput('');
      setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
      setIsLoading(true);

      try {
          const effectiveKey = apiKey || process.env.API_KEY;
          if (!effectiveKey) throw new Error("API Key missing. Please configure in Settings.");

          const ai = new GoogleGenAI({ apiKey: effectiveKey });
          const context = generateContext();
          
          const systemInstruction = `You are a Quantitative Analyst for Nifty 50.
          ${MATH_CONTEXT}
          
          ${context}
          
          Task: Analyze the provided history log based on the user's question. 
          Use the formulas to explain *why* sentiment is shifting. 
          Keep answers short, technical, and trading-focused.
          Use Markdown for formatting (bold numbers, lists for steps).`;

          const response = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: userMsg,
              config: { systemInstruction }
          });
          
          const text = response.text || "No analysis generated.";
          setMessages(prev => [...prev, { role: 'model', text }]);

      } catch (e: any) {
          setMessages(prev => [...prev, { role: 'model', text: `Error: ${e.message}` }]);
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="flex h-full gap-4 overflow-hidden relative">
      
      {/* --- Main Table Panel --- */}
      <div className={`flex flex-col h-full glass-panel rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 ${isAiOpen ? 'w-[55%] hidden sm:flex' : 'w-full'}`}>
          <div className="p-5 border-b border-white/10 glass-header flex items-center justify-between">
              <h2 className="text-lg font-bold text-blue-400 flex items-center gap-3 uppercase tracking-wider">
                 <Clock size={20} className="text-blue-500" />
                 Day Sentiment & Momentum History
              </h2>
              <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
                     <Activity size={14} className="animate-pulse text-green-500" />
                     Live Feed (1 min)
                  </div>
                  <button 
                      onClick={() => downloadCSV(history, 'market_history_log')}
                      className="p-2 rounded-lg bg-slate-800 border border-white/10 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      title="Export CSV"
                  >
                      <Download size={16} />
                  </button>
                  <button 
                    onClick={() => setIsAiOpen(!isAiOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all text-xs font-bold ${isAiOpen ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-800 text-slate-400 border-white/10 hover:bg-slate-700 hover:text-white'}`}
                  >
                      {isAiOpen ? <ChevronRight size={14}/> : <Bot size={14} />}
                      {isAiOpen ? 'Close AI' : 'Analyze with AI'}
                  </button>
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
                      <th className="px-2 py-3">Stk Str</th>
                      
                      <th className="px-2 py-3 border-l border-white/5">Call Str</th>
                      <th className="px-2 py-3">Put Str</th>
                      <th className="px-2 py-3">PCR</th>
                      <th className="px-2 py-3 bg-white/5">Opt Str</th>
                      
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
                           {snap.ptsChg > 0 ? '+' : ''}{snap.ptsChg.toFixed(1)}
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

      {/* --- AI Chat Panel (Collapsible) --- */}
      {isAiOpen && (
          <div className="flex-1 w-full sm:w-[45%] glass-panel rounded-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-white/10">
               <div className="p-4 bg-indigo-900/20 border-b border-indigo-500/20 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-indigo-300">
                       <Bot size={18} />
                       <span className="font-bold text-sm">History Analyst</span>
                   </div>
                   <div className="flex items-center gap-2">
                       <button onClick={clearChat} className="text-slate-500 hover:text-red-400 p-1" title="Clear History">
                           <Trash2 size={16} />
                       </button>
                       <button onClick={() => setIsAiOpen(false)} className="text-slate-500 hover:text-white p-1">
                           <X size={16}/>
                       </button>
                   </div>
               </div>
               
               <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-950/50">
                   {messages.map((m, idx) => (
                       <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`max-w-[85%] rounded-2xl p-4 ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-300 rounded-bl-none border border-white/5'}`}>
                               <div className="mb-1 flex items-center gap-2 opacity-60 text-[10px] font-bold uppercase tracking-wider">
                                  {m.role === 'user' ? 'You' : <><Bot size={12}/> Analyst</>}
                               </div>
                               {m.role === 'user' ? (
                                   <div className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</div>
                               ) : (
                                   <MarkdownRenderer content={m.text} />
                               )}
                           </div>
                       </div>
                   ))}
                   {isLoading && (
                      <div className="flex justify-start">
                          <div className="bg-slate-800 p-3 rounded-xl rounded-bl-none border border-white/5">
                              <Loader2 size={16} className="animate-spin text-indigo-400" />
                          </div>
                      </div>
                   )}
                   <div ref={chatEndRef} />
               </div>

               <div className="p-3 bg-slate-900/80 border-t border-white/5 space-y-2">
                   {/* Quick Actions */}
                   <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                       <button onClick={() => handleSend("Summarize the trend in the last 15 minutes")} className="whitespace-nowrap px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded-full border border-white/5 flex items-center gap-1">
                           <Sparkles size={10} /> Summarize Trend
                       </button>
                       <button onClick={() => handleSend("Is there any divergence between Price and Options Sentiment?")} className="whitespace-nowrap px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded-full border border-white/5">
                           Find Divergence
                       </button>
                       <button onClick={() => handleSend("Explain the PCR trend")} className="whitespace-nowrap px-3 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 rounded-full border border-white/5">
                           Explain PCR
                       </button>
                   </div>
                   
                   <div className="flex gap-2">
                       <input 
                           value={input}
                           onChange={(e) => setInput(e.target.value)}
                           onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                           placeholder="Ask about specific metrics..."
                           className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                       />
                       <button onClick={() => handleSend()} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-500 text-white p-2 rounded-lg disabled:opacity-50">
                           <Send size={16} />
                       </button>
                   </div>
               </div>
          </div>
      )}
    </div>
  );
};
