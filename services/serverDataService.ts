// Server-side data fetcher (no credentials needed on client)
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
  };
  error?: string;
  message?: string;
}

/**
 * Fetch live market data from server (no client-side credentials needed)
 */
export async function fetchServerMarketData(): Promise<ServerDataResponse> {
  try {
    const response = await fetch(SERVER_API_URL, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
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
 * Check if server data is available and fresh
 */
export async function isServerDataAvailable(): Promise<boolean> {
  try {
    const response = await fetch(SERVER_API_URL, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Convert server data to FyersQuote format
 */
export function convertServerDataToQuotes(serverData: any): FyersQuote[] {
  if (!serverData?.stocks?.data) {
    return [];
  }

  // Transform PayTM format to Fyers format
  return serverData.stocks.data.map((item: any) => ({
    symbol: item.symbol || '',
    ltp: item.last_price || 0,
    ch: item.change_absolute || 0,
    chp: item.change_percent || 0,
    high: item.ohlc?.high || 0,
    low: item.ohlc?.low || 0,
    open: item.ohlc?.open || 0,
    prev_close: item.ohlc?.close || 0,
    volume: item.volume_traded || 0,
    bid_ask_spread: 0,
    cmd: {
      s: item.symbol,
      v: {
        short_name: item.symbol,
        original_name: item.symbol,
        ch: item.change_absolute || 0,
        chp: item.change_percent || 0,
        lp: item.last_price || 0,
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
  }));
}
