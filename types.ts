
export interface FyersCredentials {
  appId: string;
  accessToken: string;
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
  | 'day_net_strength';

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

  bid_chg_day_p?: number;     // % Change vs First Entry
  ask_chg_day_p?: number;     // % Change vs First Entry
  day_net_strength?: number;  // (Bid Day % - Ask Day %)
  
  // Market Impact Logic
  weight?: number;            // Nifty 50 Weightage (%)
  index_contribution?: number; // (Change% * Weight) - Rough impact score
}

export interface MarketSnapshot {
  time: string;
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

export type ViewMode = 'summary' | 'stocks' | 'options' | 'history';
