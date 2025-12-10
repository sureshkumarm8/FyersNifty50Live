export interface FyersCredentials {
  appId: string;
  accessToken: string;
}

// Fyers V3 Quote Response Interface
export interface FyersQuote {
  symbol: string;
  ask: number; // Ask Price
  bid: number; // Bid Price
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
}

// Internal interface for the raw API response structure which nests data in 'v'
export interface FyersV3QuoteItem {
  n: string;
  s: string;
  v: FyersQuote;
}

export interface FyersQuoteResponse {
  s: string; // Status "ok" or "error"
  code: number;
  message: string;
  d: FyersV3QuoteItem[];
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
  | 'tt';

export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}

// Extended Quote for UI with calculated fields
export interface EnrichedFyersQuote extends FyersQuote {
  bid_qty_chg_1m?: number;
  ask_qty_chg_p?: number;
}
