


export type ViewMode = 'summary' | 'stocks' | 'options' | 'history' | 'settings' | 'ai' | 'premarket' | 'autotrade' | 'patterns';

export interface FyersCredentials {
  appId: string;
  accessToken: string;
  bypassMarketHours?: boolean; 
  refreshInterval?: number;
  googleApiKey?: string;
  groqApiKey?: string;
  claudeApiKey?: string;
  cerebrasApiKey?: string;
  aiEnabled?: boolean;
  aiProvider?: 'gemini' | 'groq' | 'claude' | 'cerebras' | 'ollama';
  groqModel?: string;
  geminiModel?: string;
  claudeModel?: string;
  cerebrasModel?: string;

  // Local Llama (Ollama) - runs on the user's own machine, no API key required
  ollamaBaseUrl?: string;
  ollamaModel?: string;
  
  // AI Feature Switches by Screen/Component
  aiAutoTradeEnabled?: boolean;     // SniperScope in AutoTrade
  aiLabEnabled?: boolean;           // AI Lab (Chat + Voice)
  aiHistoryEnabled?: boolean;       // Sentiment Analysis in History
  
  // PayTM Money Integration
  dataProvider?: 'fyers' | 'paytm';
  paytmAccessToken?: string;
  
  // Live Trading Control
  liveOrdersEnabled?: boolean;
}

// All available Groq models (Updated as of March 2026)
// IMPORTANT: These are the latest active models. Decommissioned models:
// - mixtral-8x7b-32768 (deprecated)
// - llama-3.1-70b-versatile (deprecated)
export const GROQ_MODELS = [
  // Recommended models (with highest daily token limits - 500K tokens/day)
  { id: 'llama-3.1-8b-instant', name: '🦙 Llama 3.1 8B Instant (500K/day)', tokenLimit: 500000, dailyLimit: 500000 },
  { id: 'qwen/qwen3-32b', name: '🔷 Qwen 3 32B (500K/day)', tokenLimit: 500000, dailyLimit: 500000 },
  { id: 'meta-llama/llama-4-scout-17b-16e-instruct', name: '🦙 Llama 4 Scout 17B (500K/day)', tokenLimit: 500000, dailyLimit: 500000 },
  { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', name: '🦙 Llama 4 Maverick 17B (500K/day)', tokenLimit: 500000, dailyLimit: 500000 },
  
  // High token limit models (300K tokens/day)
  { id: 'moonshotai/kimi-k2-instruct', name: '🌙 Kimi K2 (300K/day)', tokenLimit: 300000, dailyLimit: 300000 },
  { id: 'moonshotai/kimi-k2-instruct-0905', name: '🌙 Kimi K2 0905 (300K/day)', tokenLimit: 300000, dailyLimit: 300000 },
  
  // GPT OSS models (200K tokens/day)
  { id: 'openai/gpt-oss-120b', name: '🤖 GPT OSS 120B (200K/day)', tokenLimit: 200000, dailyLimit: 200000 },
  { id: 'openai/gpt-oss-20b', name: '🤖 GPT OSS 20B (200K/day)', tokenLimit: 200000, dailyLimit: 200000 },
  
  // Guard and Safeguard models (500K tokens/day)
  { id: 'meta-llama/llama-guard-4-12b', name: '🛡️ Llama Guard 4 12B (500K/day)', tokenLimit: 500000, dailyLimit: 500000 },
  { id: 'meta-llama/llama-prompt-guard-2-22m', name: '🛡️ Prompt Guard 2-22M (500K/day)', tokenLimit: 500000, dailyLimit: 500000 },
  { id: 'meta-llama/llama-prompt-guard-2-86m', name: '🛡️ Prompt Guard 2-86M (500K/day)', tokenLimit: 500000, dailyLimit: 500000 },
  
  // Compound models (70K tokens/day)
  { id: 'groq/compound', name: '🚀 Compound (70K/day)', tokenLimit: 70000, dailyLimit: 70000 },
  { id: 'groq/compound-mini', name: '⚡ Compound Mini (70K/day)', tokenLimit: 70000, dailyLimit: 70000 },
  
  // Legacy/Other models
  { id: 'allam-2-7b', name: '🦙 Allam 2 7B (500K/day)', tokenLimit: 500000, dailyLimit: 500000 },
  { id: 'llama-3.3-70b-versatile', name: '🦙 Llama 3.3 70B Versatile (100K/day)', tokenLimit: 100000, dailyLimit: 100000 },
];

// Gemini Models (Updated as of April 2026)
export const GEMINI_MODELS = [
  // Frontier Models (Text & Multimodal)
  { id: 'gemini-3.1-pro-preview', name: '💎 Gemini 3.1 Pro Preview - Peak reasoning, complex coding', category: 'frontier' },
  { id: 'gemini-3-flash-preview', name: '⚡ Gemini 3 Flash Preview - High-speed production', category: 'frontier' },
  { id: 'gemini-3.1-flash-lite-preview', name: '🚀 Gemini 3.1 Flash-Lite Preview - Low latency', category: 'frontier' },
  { id: 'gemini-2.5-pro', name: '🎯 Gemini 2.5 Pro - Stable multimodal (Audio/Video/PDF)', category: 'frontier' },
  { id: 'gemini-2.5-flash', name: '⚡ Gemini 2.5 Flash - Current default', category: 'frontier' },
  
  // Latest Aliases (Auto-upgrade to newest stable version)
  { id: 'gemini-3-flash-latest', name: '🔄 Gemini 3 Flash Latest - Auto-upgrade', category: 'latest' },
  { id: 'gemini-3.1-pro-latest', name: '🔄 Gemini 3.1 Pro Latest - Auto-upgrade', category: 'latest' },
  
  // Gemma 4 Open Models (Released April 2, 2026)
  { id: 'gemma-4-31b-it', name: '🦾 Gemma 4 31B Dense - Workstation-class', category: 'gemma' },
  { id: 'gemma-4-26b-moe-it', name: '⚙️ Gemma 4 26B MoE - Fast inference (3.8B active)', category: 'gemma' },
  { id: 'gemma-4-4b-it', name: '📱 Gemma 4 E4B - Edge-optimized (Audio/Image)', category: 'gemma' },
  { id: 'gemma-4-2b-it', name: '🔋 Gemma 4 E2B - Ultra-lightweight (Mobile/IoT)', category: 'gemma' },
  
  // Specialized Endpoints
  { id: 'gemini-3.1-flash-image-preview', name: '🎨 Image Generation (Nano Banana 2)', category: 'specialized' },
  { id: 'veo-3.1-lite-generate-preview', name: '🎬 Video Generation (Veo 3.1)', category: 'specialized' },
  { id: 'lyria-3-generate-preview', name: '🎵 Music Generation (Lyria 3)', category: 'specialized' },
  
  // Embedding Model
  { id: 'text-embedding-004', name: '🔢 Text Embedding 004', category: 'embedding' },
];

// Claude Models (Updated as of July 2026)
export const CLAUDE_MODELS = [
  { id: 'claude-3-5-sonnet-20241022', name: '⚡ Claude 3.5 Sonnet - Best balance (200K tokens)', contextWindow: '200K', pricing: '$3/$15' },
  { id: 'claude-3-7-opus', name: '🧠 Claude 3.7 Opus - Most intelligent (200K tokens)', contextWindow: '200K', pricing: '$15/$75' },
  { id: 'claude-3-5-haiku-20241022', name: '🚀 Claude 3.5 Haiku - Fastest & affordable (200K tokens)', contextWindow: '200K', pricing: '$0.80/$4' },
];

// Cerebras Models (Updated as of July 2026)
export const CEREBRAS_MODELS = [
  { id: 'cerebras/llama-3.1-70b', name: '⚡ Llama 3.1 70B - Ultra-fast (11ms latency)', contextWindow: '8K', speed: 'FASTEST', pricing: '$0.30/$0.60' },
  { id: 'cerebras/llama-3.1-8b', name: '🚀 Llama 3.1 8B - Lightest & fastest', contextWindow: '8K', speed: 'FASTEST', pricing: '$0.30/$0.60' },
  { id: 'cerebras/llama-2-70b-chat', name: '💬 Llama 2 70B Chat - Conversational', contextWindow: '4K', speed: 'VERY FAST', pricing: '$0.30/$0.60' },
];

// Local Llama models served by Ollama (http://localhost:11434)
// These are only suggestions - any model pulled via `ollama pull <name>` works.
export const OLLAMA_MODELS = [
  { id: 'llama3.2:3b', name: '🦙 Llama 3.2 3B - Fastest, low RAM (~2GB)', size: '2GB', speed: 'FASTEST' },
  { id: 'llama3.1:8b', name: '🦙 Llama 3.1 8B - RECOMMENDED balance (~4.7GB)', size: '4.7GB', speed: 'FAST' },
  { id: 'llama3.3:70b', name: '🦙 Llama 3.3 70B - Highest quality (~40GB)', size: '40GB', speed: 'SLOW' },
  { id: 'qwen2.5:7b', name: '🔷 Qwen 2.5 7B - Strong JSON/reasoning (~4.7GB)', size: '4.7GB', speed: 'FAST' },
  { id: 'mistral:7b', name: '🌬️ Mistral 7B - Lightweight generalist (~4.1GB)', size: '4.1GB', speed: 'FAST' },
  { id: 'gemma2:9b', name: '💎 Gemma 2 9B - Google open model (~5.4GB)', size: '5.4GB', speed: 'MEDIUM' },
];

export const DEFAULT_OLLAMA_BASE_URL = 'http://localhost:11434';
export const DEFAULT_OLLAMA_MODEL = 'llama3.1:8b';

// Fyers V3 Quote Response Interface (Internal UI Model)
export interface FyersQuote {
  symbol: string;
  ask: number; // Best Ask Price
  bid: number; // Best Bid Price
  ch: number; // Change
  chp: number; // Change percentage
  description: string;
  exchange: string;
  expiry_date?: string; // For options: formatted expiry date (e.g., "07-APR-26")
  fyToken: string;
  high_price: number;
  low_price: number;
  lp: number; // Last Traded Price
  open_price: number;
  original_name: string;
  prev_close_price: number;
  short_name: string;
  spread: number;
  tt: number | string; // Time
  volume: number;
  total_buy_qty?: number; // Total Bid Quantity
  total_sell_qty?: number; // Total Ask Quantity
  oi?: number; // Open Interest
}

// Depth API Specific Types
export interface FyersDepthLevel {
  price: number;
  volume: number;
  ord: number;
}

export interface FyersDepthInfo {
  totalbuyqty: number;
  totalsellqty: number;
  ask: FyersDepthLevel[];
  bids: FyersDepthLevel[];
  o: number; // Open
  h: number; // High
  l: number; // Low
  c: number; // Previous Close
  chp: number; // Change Percent
  ch: number; // Change
  ltq: number; // Last Traded Qty
  ltt: number; // Last Traded Time
  ltp: number; // Last Traded Price
  v: number; // Volume
  atp: number; // Avg Traded Price
  lower_ckt: number;
  upper_ckt: number;
  oi: number;
  oiflag: boolean;
  pdoi: number;
  oipercent: number;
}

// Response from Data/Depth is a dictionary: { "NSE:SBIN-EQ": { ...data } }
export interface FyersDepthResponse {
  s: string; // Status "ok"
  code?: number;
  message: string;
  d: Record<string, FyersDepthInfo>; 
}

// Legacy Quote Response Types (kept for reference or fallback if needed)
export interface FyersV3QuoteItem {
  n: string;
  s: string;
  v: FyersQuote;
}

export interface FyersQuoteResponse {
  s: string; 
  code: number;
  message: string;
  d: FyersV3QuoteItem[] | Record<string, FyersDepthInfo>; // Union to support both if needed
}

export interface FyersHistoryCandle {
  0: number; // Timestamp (epoch)
  1: number; // Open
  2: number; // High
  3: number; // Low
  4: number; // Close
  5: number; // Volume
}

export interface FyersHistoryResponse {
  s: string;
  candles: number[][]; // Array of [time, open, high, low, close, volume]
  message?: string;
}

export type SortField = 
  | 'symbol' 
  | 'lp' 
  | 'chp' 
  | 'volume' 
  | 'total_buy_qty'
  | 'total_sell_qty'
  | 'tt'
  | 'oi'
  | 'bid_qty_chg_1m'
  | 'bid_qty_chg_p'
  | 'ask_qty_chg_p'
  | 'net_strength_1m'
  | 'bid_chg_day_p'
  | 'ask_chg_day_p'
  | 'day_net_strength'
  | 'lp_chg_1m_p'   
  | 'lp_chg_day_p'; 

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// Extended Quote for UI with calculated fields
export interface EnrichedFyersQuote extends FyersQuote {
  bid_qty_chg_1m?: number;    // Absolute change
  bid_qty_chg_p?: number;     // Percent change (1 min)
  
  ask_qty_chg_1m?: number;    // Absolute change
  ask_qty_chg_p?: number;     // Percent change (1 min)
  
  net_strength_1m?: number;   // (Bid% - Ask%) 1 min

  // Session / Day Metrics (vs First Entry)
  initial_total_buy_qty?: number;
  initial_total_sell_qty?: number;
  initial_lp?: number; // Initial LTP

  bid_chg_day_p?: number;     // % Change vs First Entry
  ask_chg_day_p?: number;     // % Change vs First Entry
  day_net_strength?: number;  // (Bid Day % - Ask Day %)
  
  lp_chg_1m_p?: number;       // LTP % Change 1 min
  lp_chg_day_p?: number;      // LTP % Change vs First Entry

  // Market Impact Logic
  weight?: number;            // Nifty 50 Weightage (%)
  index_contribution?: number; // (Change% * Weight) - Rough impact score
  sector?: string;
}

export interface MarketSnapshot {
  time: string;
  timestamp?: number; // Epoch for accurate diffs
  niftyLtp: number;
  ptsChg: number;
  
  // Sentiments
  overallSent: number; // Weighted Breadth Net %
  adv: number;
  dec: number;
  stockSent: number; // Aggregate Demand % (Buy-Sell)/Sell
  
  // Options
  callSent: number;
  putSent: number;
  pcr: number;
  optionsSent: number; // (Call Sent - Put Sent)
  
  // Flows (in Millions)
  callsBuyQty: number;
  callsSellQty: number;
  putsBuyQty: number;
  putsSellQty: number;
  callsOI: number;
  putsOI: number;
}

// Local Session History for individual stocks
export interface SessionCandle {
  time: string;
  timestamp: number;
  lp: number;
  volume: number;
  
  // Price Changes
  lp_chg_1m_p: number;
  lp_chg_day_p: number;
  chp: number; // Daily %
  
  // Quantities
  total_buy_qty: number;
  total_sell_qty: number;
  
  // Metrics
  bid_qty_chg_p: number;
  bid_chg_day_p: number;
  ask_qty_chg_p: number;
  ask_chg_day_p: number;
  
  net_strength_1m: number;
  day_net_strength: number;
}

// Daily Archive Types (for multi-day pattern recognition)
export interface DailyArchive {
  date: string; // "2026-03-29"
  snapshots: MarketSnapshot[];
  sessionData: SessionHistoryMap;
  summary: DailySummary;
  metadata: DailyMetadata;
}

export interface DailySummary {
  open: number;
  high: number;
  low: number;
  close: number;
  totalVolume: number;
  dominantSentiment: number;
  avgPCR: number;
  topPerformer: string;
  worstPerformer: string;
  range: number;
  volatility: number;
}

export interface DailyMetadata {
  totalTrades: number;
  pnl: number;
  winRate: number;
  patterns: string[]; // Pattern IDs that occurred
  notes?: string;
}

// Pattern Recognition Types
export interface Pattern {
  id: string;
  name: string;
  description: string;
  timestamps: number[]; // When it occurred historically
  conditions: PatternConditions;
  outcome: PatternOutcome;
  confidence: number; // 0-100
  lastSeen: string; // Date string
  occurrences: number;
}

export interface PatternConditions {
  timeWindow?: string; // e.g., "09:30-10:30"
  niftyMoveRange?: { min: number; max: number };
  sentimentShift?: number;
  pcrRange?: [number, number];
  sectorLeader?: string;
  volumeProfile?: 'HIGH' | 'LOW' | 'NORMAL';
}

export interface PatternOutcome {
  nextHourMove: number; // Average points
  reliability: number; // 0-100%
  sampleSize: number;
  avgDuration: number; // Minutes
  bestTime?: string;
}

export interface SessionHistoryMap {
  [symbol: string]: SessionCandle[];
}

// AI Quant Types
export interface StrategySignal {
  market_condition: "TRENDING_UP" | "TRENDING_DOWN" | "SIDEWAYS" | "VOLATILE";
  signal: "LONG" | "SHORT" | "NO_TRADE";
  confidence_score: number; // 0 to 100
  primary_reason: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  suggested_trade: {
    instrument: "NIFTY OPTIONS";
    strategy_type: string;
    ideal_strike: string;
    stop_loss_ref: number;
    target_ref: number;
  };
  hidden_anomaly: {
    detected: boolean;
    stock_symbol: string;
    description: string;
  };
}

export interface AnalysisRecord {
    id: string;
    timestamp: number;
    timeStr: string;
    signal: StrategySignal;
    entryLtp?: number;
    result?: 'WIN' | 'LOSS' | 'NEUTRAL' | 'PENDING';
    exitLtp?: number; 
}

// Protocol Types
export interface ProtocolStep { 
  title: string; 
  items: string[]; 
}

export interface TradingSystemProtocol {
  name: string;
  description?: string;
  tags?: string[];
  steps?: ProtocolStep[];
  links?: string[];
  rules?: string[];
}

export interface SniperAnalysis {
    decision: "EXECUTE" | "WAIT" | "ABORT";
    rationale: string;
    matched_step: string;
    trade_setup?: {
        direction: "CALL" | "PUT";
        entry_zone: string;
        stop_loss: number;
        target_1: number;
        target_2: number;
        rr_ratio: number;
    };
    compliance_check: {
        rule: string;
        status: "PASS" | "FAIL";
    }[];
}

// New Structural Context Types
export interface SectorMetric {
  name: string;
  weight: number;
  change_p: number; // Weighted Change
  contribution: number;
  bullish_stocks: number;
  bearish_stocks: number;
}

export interface PivotPoints {
  pivot: number;
  r1: number;
  s1: number;
  r2: number;
  s2: number;
  cpr_bc: number;
  cpr_tc: number;
  dayHigh?: number;
  dayLow?: number;
}
