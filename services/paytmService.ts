
import { FyersQuote, FyersCredentials } from '../types';
import { NIFTY_WEIGHTAGE } from '../constants';
import { 
  PAYTM_NIFTY50_MAP, 
  getNifty50SecurityIds as getStaticNifty50Ids
} from '../constants/paytmMappings';
import { 
  NIFTY_WEEKLY_OPTIONS, 
  getWeeklyOptionIds,
  CURRENT_EXPIRY_FORMATTED
} from '../constants/niftyWeeklyOptions';

const PROXY_PAYTM_QUOTES_URL = '/api/paytm/quotes';

interface PayTMQuoteResponse {
  security_id: number;
  mode: string;
  tradable: boolean;
  found: boolean;
  last_price: number;
  last_traded_quantity?: number;
  last_trade_time?: number;
  last_update_time?: number;
  change_percent: number;
  change_absolute: number;
  volume_traded?: number;
  average_traded_price?: number;
  total_buy_quantity?: number;
  total_sell_quantity?: number;
  ohlc?: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  depth?: {
    buy: Array<{ price: number; quantity: number; orders: number }>;
    sell: Array<{ price: number; quantity: number; orders: number }>;
  };
  oi?: number;
  change_oi?: number;
}

export const getNifty50SecurityIds = (): string[] => {
  return getStaticNifty50Ids();
};

// Nifty 50 Index security ID (from index_security_master.csv)
// Security ID 13 = NIFTY, 25 = BANKNIFTY, 27 = FINNIFTY
const NIFTY_INDEX_SECURITY_ID = '13';

export const getNiftyIndexSecurityId = (): string => {
  return NIFTY_INDEX_SECURITY_ID;
};

export const getNiftyOptionSecurityIds = (niftyLtp: number): string[] => {
  // Round to nearest 50 to get ATM strike
  const atmStrike = Math.round(niftyLtp / 50) * 50;
  
  // Calculate range: Current Price ± 1000 points (20 strikes of 50 each)
  // Example: If Nifty at 23000, show strikes from 22000 to 24000
  const strikeRange = 20; // ±20 strikes = ±1000 points
  const minStrike = atmStrike - (strikeRange * 50); // 22000
  const maxStrike = atmStrike + (strikeRange * 50); // 24000
  
  // Filter options within the strike range (both CE and PE)
  const filteredOptions = NIFTY_WEEKLY_OPTIONS.filter(opt => 
    opt.strike >= minStrike && opt.strike <= maxStrike
  );
  
  const allIds = filteredOptions.map(opt => opt.security_id);
  
  console.log(`[PayTM] Options Filter: Nifty LTP=${niftyLtp}, ATM=${atmStrike}, Range=${minStrike}-${maxStrike}, Contracts=${allIds.length}`);
  
  return allIds;
};

const convertPayTMToFyersQuote = (
  paytmQuote: PayTMQuoteResponse
): FyersQuote => {
  // Find security info from static mappings
  const securityIdStr = paytmQuote.security_id.toString();
  const stockInfo = Object.values(PAYTM_NIFTY50_MAP).find(s => s.security_id === securityIdStr);
  
  let symbol = 'UNKNOWN';
  let shortName = 'UNKNOWN';
  let description = 'Unknown Security';
  let expiryDate: string | undefined = undefined;
  
  if (stockInfo) {
    symbol = `NSE:${stockInfo.symbol}`;
    shortName = stockInfo.symbol;
    description = stockInfo.name;
  } else {
    // Check in weekly options
    const optInfo = NIFTY_WEEKLY_OPTIONS.find(o => o.security_id === securityIdStr);
    if (optInfo) {
      symbol = `NSE:NIFTY-${optInfo.strike}-${optInfo.type}`;
      // Format: "NIFTY 22750 CE" for short_name (main display)
      shortName = `NIFTY ${optInfo.strike} ${optInfo.type}`;
      // Use description for full info including expiry
      description = `NIFTY ${optInfo.strike} ${optInfo.type} ${CURRENT_EXPIRY_FORMATTED}`;
      expiryDate = CURRENT_EXPIRY_FORMATTED;
    }
  }
  
  // Handle both numeric timestamps (seconds) and milliseconds
  let timestamp = paytmQuote.last_trade_time || paytmQuote.last_update_time || Date.now();
  if (timestamp > 10000000000) {
    timestamp = timestamp / 1000; // Convert ms to seconds
  }
  
  // Debug: Log raw PayTM data for first few items
  if (Math.random() < 0.05) { // 5% sampling to avoid spam
    console.log(`[PayTM Convert] Security ${securityIdStr}:`, {
      last_price: paytmQuote.last_price,
      volume_traded: paytmQuote.volume_traded,
      total_buy_quantity: paytmQuote.total_buy_quantity,
      total_sell_quantity: paytmQuote.total_sell_quantity,
      oi: paytmQuote.oi,
      has_ohlc: !!paytmQuote.ohlc,
      has_depth: !!paytmQuote.depth
    });
  }
  
  return {
    symbol,
    short_name: shortName,
    exchange: 'NSE',
    expiry_date: expiryDate,
    description,
    original_name: shortName,
    fyToken: securityIdStr,
    tt: timestamp,
    
    lp: paytmQuote.last_price || 0,
    open_price: paytmQuote.ohlc?.open || 0,
    high_price: paytmQuote.ohlc?.high || 0,
    low_price: paytmQuote.ohlc?.low || 0,
    prev_close_price: paytmQuote.ohlc?.close || 0,
    volume: paytmQuote.volume_traded || 0,
    
    ch: paytmQuote.change_absolute || 0,
    chp: paytmQuote.change_percent || 0,
    
    total_buy_qty: paytmQuote.total_buy_quantity || 0,
    total_sell_qty: paytmQuote.total_sell_quantity || 0,
    bid: paytmQuote.depth?.buy?.[0]?.price || 0,
    ask: paytmQuote.depth?.sell?.[0]?.price || 0,
    spread: (paytmQuote.depth?.sell?.[0]?.price || 0) - (paytmQuote.depth?.buy?.[0]?.price || 0),
    
    oi: paytmQuote.oi || 0
  };
};

export const fetchPayTMQuotes = async (
  securityIds: string[],
  credentials: FyersCredentials,
  scripType: 'EQUITY' | 'OPTION' | 'INDEX' = 'EQUITY'
): Promise<FyersQuote[]> => {
  if (!credentials.paytmAccessToken) {
    throw new Error('PayTM Access Token is missing');
  }
  
  // PayTM supports batch requests - send all IDs at once
  const response = await fetch(PROXY_PAYTM_QUOTES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${credentials.paytmAccessToken}`
    },
    body: JSON.stringify({ 
      security_ids: securityIds,
      scrip_type: scripType
    })
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`PayTM API Error (${response.status}): ${errorText}`);
  }
  
  const data = await response.json();
  
  console.log('[PayTM] Response received:', data ? `${JSON.stringify(data).substring(0, 200)}...` : 'empty');
  
  // PayTM wraps the array in a "data" property
  const quotesArray = data.data || data;
  console.log('[PayTM] Is array?', Array.isArray(quotesArray), 'Length:', Array.isArray(quotesArray) ? quotesArray.length : 'N/A');
  
  // Convert to FyersQuote format
  const quotes: FyersQuote[] = [];
  
  if (quotesArray && Array.isArray(quotesArray)) {
    console.log('[PayTM] Processing array response...');
    quotesArray.forEach((paytmQuote: any, index: number) => {
      try {
        if (paytmQuote.found !== false) {
          const quote = convertPayTMToFyersQuote(paytmQuote);
          quotes.push(quote);
          if (index === 0) {
            console.log('[PayTM] First quote sample:', JSON.stringify(quote).substring(0, 150));
            console.log('[PayTM] First quote full data:', {
              symbol: quote.symbol,
              lp: quote.lp,
              chp: quote.chp,
              volume: quote.volume,
              total_buy_qty: quote.total_buy_qty,
              total_sell_qty: quote.total_sell_qty,
              oi: quote.oi
            });
          }
          // Log options specifically
          if (scripType === 'OPTION' && index < 3) {
            console.log(`[PayTM] Option ${index + 1}:`, {
              symbol: quote.symbol,
              lp: quote.lp,
              volume: quote.volume,
              oi: quote.oi,
              total_buy_qty: quote.total_buy_qty,
              total_sell_qty: quote.total_sell_qty
            });
          }
        } else {
          console.warn(`[PayTM] Quote not found for security_id: ${paytmQuote.security_id}`);
        }
      } catch (err) {
        console.error(`[PayTM] Error converting quote at index ${index}:`, err);
      }
    });
  } else {
    console.error('[PayTM] Unexpected response structure:', typeof quotesArray);
  }
  
  console.log('[PayTM] Converted quotes:', quotes.length);
  
  if (quotes.length === 0) {
    console.warn('[PayTM] Warning: No quotes returned from API');
  }
  
  return quotes;
};

export const fetchPayTMStocks = async (credentials: FyersCredentials): Promise<FyersQuote[]> => {
  const securityIds = getNifty50SecurityIds();
  return fetchPayTMQuotes(securityIds, credentials, 'EQUITY');
};

export const fetchPayTMOptions = async (
  niftyLtp: number,
  credentials: FyersCredentials
): Promise<FyersQuote[]> => {
  const securityIds = getNiftyOptionSecurityIds(niftyLtp);
  return fetchPayTMQuotes(securityIds, credentials, 'OPTION');
};

export const fetchNiftyIndexLTP = async (credentials: FyersCredentials): Promise<number> => {
  try {
    const indexId = getNiftyIndexSecurityId();
    const quotes = await fetchPayTMQuotes([indexId], credentials, 'INDEX');
    
    if (quotes.length > 0 && quotes[0].lp > 0) {
      console.log(`[PayTM] Nifty Index LTP: ${quotes[0].lp}`);
      return quotes[0].lp;
    }
    
    console.warn('[PayTM] Nifty Index not found or invalid');
    return 0;
  } catch (e) {
    console.error('[PayTM] Failed to fetch Nifty index:', e);
    return 0;
  }
};
