
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from "@google/genai";
import { EnrichedFyersQuote, MarketSnapshot } from '../types';
import { Send, Mic, StopCircle, Bot, Sparkles, Loader2, Info, Search, Volume2, Globe } from 'lucide-react';

interface AIViewProps {
  stocks: EnrichedFyersQuote[];
  niftyLtp: number | null;
  historyLog: MarketSnapshot[];
  optionQuotes: EnrichedFyersQuote[];
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  isError?: boolean;
}

// Audio Utils
function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  // Custom simple implementation to avoid external deps for base64
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);

  return {
    data: base64,
    mimeType: 'audio/pcm;rate=16000',
  };
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const AIView: React.FC<AIViewProps> = ({ stocks, niftyLtp, historyLog, optionQuotes }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'live'>('chat');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
      { role: 'model', text: "Hello! I am your Market Analyst. I have access to real-time Nifty 50 data. Ask me about trends, option flow, or specific stocks." }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [useSearch, setUseSearch] = useState(false);

  // Live State
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLiveConnecting, setIsLiveConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Cleanup Live Session on Unmount
  useEffect(() => {
      return () => {
          disconnectLive();
      };
  }, []);

  // --- Context Generator ---
  const getMarketContext = () => {
      if (stocks.length === 0) return "Market data is currently loading.";

      const snapshot = historyLog[historyLog.length - 1];
      const gainers = [...stocks].sort((a,b) => (b.chp || 0) - (a.chp || 0)).slice(0, 3).map(s => `${s.short_name} (+${s.chp.toFixed(1)}%)`);
      const losers = [...stocks].sort((a,b) => (a.chp || 0) - (b.chp || 0)).slice(0, 3).map(s => `${s.short_name} (${s.chp.toFixed(1)}%)`);
      
      return JSON.stringify({
          nifty_ltp: niftyLtp,
          change: snapshot?.ptsChg.toFixed(1),
          sentiment: snapshot?.overallSent > 0 ? "Bullish" : "Bearish",
          pcr: snapshot?.pcr.toFixed(2),
          option_flow: snapshot?.optionsSent > 0 ? "Bullish (Calls)" : "Bearish (Puts)",
          top_gainers: gainers,
          top_losers: losers,
          timestamp: new Date().toLocaleTimeString()
      });
  };

  // --- Chat Handler ---
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsProcessing(true);

    try {
        const apiKey = process.env.API_KEY;
        if (!apiKey) throw new Error("API Key not configured");

        const ai = new GoogleGenAI({ apiKey });
        const context = getMarketContext();
        
        const systemInstruction = `You are a Nifty 50 Market Analyst. 
        Current Market Data: ${context}
        Answer concisely. If the user asks about something outside this data (like news), use Google Search if enabled.`;

        const config: any = { systemInstruction };
        if (useSearch) {
            config.tools = [{ googleSearch: {} }];
        }

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userMsg,
            config
        });

        const text = response.text || "I couldn't generate a response.";
        
        // Append Search Sources if any
        let finalText = text;
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
        if (chunks) {
            const links = chunks
                .map((c: any) => c.web?.uri ? `[${c.web.title}](${c.web.uri})` : null)
                .filter(Boolean)
                .join(', ');
            if (links) finalText += `\n\nSources: ${links}`;
        }

        setMessages(prev => [...prev, { role: 'model', text: finalText }]);

    } catch (e: any) {
        setMessages(prev => [...prev, { role: 'model', text: `Error: ${e.message}`, isError: true }]);
    } finally {
        setIsProcessing(false);
    }
  };

  // --- Live API Handler ---
  const connectLive = async () => {
      if (isLiveConnected || isLiveConnecting) return;
      setIsLiveConnecting(true);

      try {
          const apiKey = process.env.API_KEY;
          if (!apiKey) throw new Error("API Key missing");

          const ai = new GoogleGenAI({ apiKey });
          
          // Audio Setup
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = stream;
          
          inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          
          const source = inputAudioContextRef.current.createMediaStreamSource(stream);
          const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
          
          sourceRef.current = source;
          processorRef.current = processor;

          const context = getMarketContext();
          const sysInstruction = `You are a voice assistant for a stock trader.
          Current Nifty 50 Data: ${context}.
          Keep responses short, professional, and data-driven. Spoken audio only.`;

          const sessionPromise = ai.live.connect({
              model: 'gemini-2.5-flash-native-audio-preview-09-2025',
              callbacks: {
                  onopen: () => {
                      console.log("Live Session Connected");
                      setIsLiveConnected(true);
                      setIsLiveConnecting(false);
                      
                      // Start Audio Stream
                      source.connect(processor);
                      processor.connect(inputAudioContextRef.current!.destination);
                  },
                  onmessage: async (msg: LiveServerMessage) => {
                      const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                      if (audioData && audioContextRef.current) {
                          setIsSpeaking(true);
                          const time = audioContextRef.current.currentTime;
                          nextStartTimeRef.current = Math.max(nextStartTimeRef.current, time);
                          
                          const buffer = await decodeAudioData(
                              decode(audioData), 
                              audioContextRef.current, 
                              24000, 
                              1
                          );
                          
                          const bufferSource = audioContextRef.current.createBufferSource();
                          bufferSource.buffer = buffer;
                          bufferSource.connect(audioContextRef.current.destination);
                          bufferSource.onended = () => setIsSpeaking(false);
                          bufferSource.start(nextStartTimeRef.current);
                          
                          nextStartTimeRef.current += buffer.duration;
                      }
                  },
                  onclose: () => disconnectLive(),
                  onerror: (err) => {
                      console.error("Live Error", err);
                      disconnectLive();
                  }
              },
              config: {
                  responseModalities: [Modality.AUDIO],
                  systemInstruction: sysInstruction,
              }
          });

          liveSessionRef.current = sessionPromise;

          // Process Input Audio
          processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const blob = createBlob(inputData);
              sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: blob });
              });
          };

      } catch (e) {
          console.error(e);
          setIsLiveConnecting(false);
          alert("Failed to connect to Gemini Live. Check console/permissions.");
      }
  };

  const disconnectLive = () => {
      setIsLiveConnected(false);
      setIsLiveConnecting(false);
      setIsSpeaking(false);
      
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(t => t.stop());
          streamRef.current = null;
      }
      if (processorRef.current) {
          processorRef.current.disconnect();
          processorRef.current = null;
      }
      if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
      }
      if (inputAudioContextRef.current) {
          inputAudioContextRef.current.close();
          inputAudioContextRef.current = null;
      }
      if (audioContextRef.current) {
          audioContextRef.current.close();
          audioContextRef.current = null;
      }
      // Note: session.close() is not available on the promise wrapper directly in some versions,
      // usually we just stop sending data and close contexts. The server will timeout.
  };

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Tab Switcher */}
      <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl w-fit self-center border border-white/10">
          <button 
             onClick={() => { disconnectLive(); setActiveTab('chat'); }}
             className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
              <Bot size={16} /> Analyst Chat
          </button>
          <button 
             onClick={() => setActiveTab('live')}
             className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'live' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
              <Mic size={16} /> Live Voice
          </button>
      </div>

      {/* CHAT MODE */}
      {activeTab === 'chat' && (
          <div className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden relative">
              <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                  {messages.map((m, idx) => (
                      <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/5'} ${m.isError ? 'bg-red-900/50 border-red-500' : ''}`}>
                              <div className="mb-1 flex items-center gap-2 opacity-70 text-xs font-bold uppercase">
                                  {m.role === 'user' ? 'You' : <><Bot size={12}/> Gemini Analyst</>}
                              </div>
                              <div className="whitespace-pre-wrap">{m.text}</div>
                          </div>
                      </div>
                  ))}
                  {isProcessing && (
                      <div className="flex justify-start">
                          <div className="bg-slate-800 rounded-2xl p-4 rounded-bl-none border border-white/5 flex items-center gap-2">
                              <Loader2 size={16} className="animate-spin text-indigo-400" />
                              <span className="text-xs text-slate-400">Analyzing market data...</span>
                          </div>
                      </div>
                  )}
                  <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-4 bg-slate-900/80 backdrop-blur border-t border-white/5">
                   <div className="flex items-center gap-2 mb-2">
                       <button 
                         onClick={() => setUseSearch(!useSearch)}
                         className={`text-xs flex items-center gap-1 px-2 py-1 rounded border transition-colors ${useSearch ? 'bg-blue-600/20 text-blue-300 border-blue-500/50' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                       >
                           {useSearch ? <Globe size={10} /> : <Search size={10} />}
                           {useSearch ? 'Search Enabled' : 'Enable Web Search'}
                       </button>
                       <span className="text-[10px] text-slate-600 ml-auto flex items-center gap-1">
                           <Info size={10} /> Shift+Enter for new line
                       </span>
                   </div>
                   <div className="flex gap-2">
                       <textarea 
                           value={input}
                           onChange={(e) => setInput(e.target.value)}
                           onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                           placeholder="Ask about Nifty trends, specific stocks, or option data..."
                           className="flex-1 bg-slate-950/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none h-12 custom-scrollbar"
                       />
                       <button 
                           onClick={handleSend}
                           disabled={isProcessing || !input.trim()}
                           className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white p-3 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                       >
                           <Send size={20} />
                       </button>
                   </div>
              </div>
          </div>
      )}

      {/* LIVE MODE */}
      {activeTab === 'live' && (
          <div className="flex-1 glass-panel rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
              {/* Background Ambient Effect */}
              <div className={`absolute inset-0 bg-gradient-to-b from-rose-900/10 to-indigo-900/10 transition-opacity duration-1000 ${isLiveConnected ? 'opacity-100' : 'opacity-0'}`}></div>
              
              <div className="z-10 text-center space-y-8">
                  <div className="relative">
                      {/* Visualizer Ring */}
                      <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${isLiveConnected ? 'border-rose-500 shadow-[0_0_50px_rgba(225,29,72,0.4)]' : 'border-slate-700'}`}>
                          {isLiveConnecting ? (
                              <Loader2 size={48} className="text-rose-400 animate-spin" />
                          ) : isLiveConnected ? (
                              <div className={`transition-transform duration-100 ${isSpeaking ? 'scale-110' : 'scale-100'}`}>
                                  <Sparkles size={48} className="text-white animate-pulse" />
                              </div>
                          ) : (
                              <Mic size={48} className="text-slate-600" />
                          )}
                      </div>
                      
                      {/* Ripple Effects when Speaking */}
                      {isSpeaking && (
                          <>
                             <div className="absolute inset-0 rounded-full border border-rose-500/50 animate-ping opacity-20"></div>
                             <div className="absolute inset-[-20px] rounded-full border border-rose-500/30 animate-pulse opacity-20"></div>
                          </>
                      )}
                  </div>

                  <div>
                      <h2 className="text-2xl font-bold text-white mb-2">Gemini Live Assistant</h2>
                      <p className="text-slate-400 text-sm max-w-md mx-auto">
                          {isLiveConnected 
                             ? isSpeaking ? "Gemini is speaking..." : "Listening..."
                             : "Connect to start a real-time voice conversation with your market data."}
                      </p>
                  </div>

                  <button
                      onClick={isLiveConnected ? disconnectLive : connectLive}
                      className={`px-8 py-4 rounded-full font-bold text-lg flex items-center gap-3 transition-all transform hover:scale-105 shadow-2xl ${isLiveConnected ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-white text-slate-900 hover:bg-slate-200'}`}
                  >
                      {isLiveConnected ? (
                          <> <StopCircle size={24} /> End Session </>
                      ) : (
                          <> <Volume2 size={24} /> Start Conversation </>
                      )}
                  </button>
                  
                  {isLiveConnected && (
                     <div className="text-xs text-rose-300 bg-rose-900/20 px-4 py-2 rounded-full inline-block border border-rose-500/20">
                         Live Feed Active • Latency: Low
                     </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};
