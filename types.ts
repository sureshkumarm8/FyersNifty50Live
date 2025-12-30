

export type ViewMode = 'summary' | 'stocks' | 'options' | 'history' | 'settings' | 'ai' | 'quant' | 'sniper';

export interface FyersCredentials {
  appId: string;
  accessToken: string;
  bypassMarketHours?: boolean; 
  refreshInterval?: number;
  googleApiKey?: string;
}

// Fyers V3 Quote Response Interface (Internal UI Model)
export interface FyersQuote {
  symbol: string;
  ask: number; // Best Ask Price
  bid: number; // Best Bid Price
  ch: number; // Change
  chp: number; // Change percentage
  description: string;
  exchange: string;
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
