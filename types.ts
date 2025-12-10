export interface FyersCredentials {
  appId: string;
  accessToken: string;
  isDemoMode: boolean;
}

// Fyers V3 Quote Response Interface
// Based on: https://myapi.fyers.in/docsv3#tag/Market-Data/paths/~1DataApi~1quotes/get
export interface FyersQuote {
  symbol: string;
  ask: number;
  bid: number;
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
  tt: number; // Time
  volume: number;
}

export interface FyersQuoteResponse {
  s: string; // Status "ok" or "error"
  code: number;
  message: string;
  d: FyersQuote[];
}

export type SortField = 'symbol' | 'lp' | 'chp' | 'volume' | 'high_price' | 'low_price';
export type SortDirection = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  direction: SortDirection;
}