// Server-side data fetcher - fetches from /api/market-data (no client-side credentials needed)
import { FyersQuote } from '../types';

const SERVER_API_URL = '/api/market-data';

export interface ServerDataResponse {
  success: boolean;
  cached?: boolean;
  timestamp?: number;
  data?: {
    stocks: any;
    index: any;
    istTime: string;
    fetchedAt: string;
  };
  error?: string;
  message?: string;
}

/**
 * Fetch live market data from server (broadcasted to all users)
 */
export async function fetchServerMarketData(): Promise<ServerDataResponse> {
  try {
    const response = await fetch(SERVER_API_URL, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.error('[Server Data] Fetch error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch server data'
    };
  }
}

/**
 * Convert PayTM server data to FyersQuote format
 */
export function convertServerDataToQuotes(serverData: any): FyersQuote[] {
  if (!serverData?.data) {
    return [];
  }

  const paytmData = serverData.data;
  
  // Transform PayTM format to Fyers format
  return paytmData.map((item: any) => {
    const symbol = item.scrip || item.symbol || `NSE:${item.security_id}-EQ`;
    const ltp = item.last_price || item.lp || 0;
    
    return {
      symbol: symbol,
      ltp: ltp,
      ch: item.change_absolute || item.ch || 0,
      chp: item.change_percent || item.chp || 0,
      high: item.ohlc?.high || item.high_price || 0,
      low: item.ohlc?.low || item.low_price || 0,
      open: item.ohlc?.open || item.open_price || 0,
      prev_close: item.ohlc?.close || item.prev_close_price || 0,
      volume: item.volume_traded || item.volume || 0,
      total_buy_qty: item.total_buy_quantity || item.depth?.buy?.reduce((sum: number, b: any) => sum + b.quantity, 0) || 0,
      total_sell_qty: item.total_sell_quantity || item.depth?.sell?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0,
      bid_ask_spread: 0,
      tt: item.last_trade_time || item.last_update_time || Date.now(),
      short_name: symbol.replace('NSE:', '').replace('-EQ', ''),
      cmd: {
        s: symbol,
        v: {
          short_name: symbol.replace('NSE:', '').replace('-EQ', ''),
          original_name: symbol,
          ch: item.change_absolute || 0,
          chp: item.change_percent || 0,
          lp: ltp,
          spread: 0,
          ask: 0,
          bid: 0,
          open_price: item.ohlc?.open || 0,
          high_price: item.ohlc?.high || 0,
          low_price: item.ohlc?.low || 0,
          prev_close_price: item.ohlc?.close || 0,
          volume: item.volume_traded || 0,
          tt: item.last_trade_time || Date.now()
        }
      }
    };
  });
}
