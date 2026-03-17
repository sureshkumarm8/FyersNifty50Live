/**
 * Paytm Symbol Mapping Service
 * 
 * Maps Fyers symbol format to Paytm security_id format
 * Example: NSE:RELIANCE-EQ → NSE:2885:EQUITY
 */

export interface PaytmSymbolMap {
  [fyersSymbol: string]: string; // Paytm format
}

// Default mapping (will be updated from user's import)
let symbolMapping: PaytmSymbolMap = {};

// Load mapping from localStorage if available
if (typeof window !== 'undefined') {
  try {
    const saved = localStorage.getItem('paytm_symbol_mapping');
    if (saved) {
      symbolMapping = JSON.parse(saved);
      console.log('[PaytmMapping] Auto-loaded from localStorage:', Object.keys(symbolMapping).length, 'symbols');
    }
  } catch (e) {
    console.warn('[PaytmMapping] Failed to load from localStorage');
  }
}

/**
 * Load symbol mapping from imported data
 */
export const loadPaytmMapping = (mappingData: string): { success: boolean; count: number; error?: string } => {
  try {
    // Parse the mapping file
    // Format 1: JSON object { "security_id": "symbol_suffix" }
    // Format 2: CSV "security_id,symbol"
    // Format 3: Text "security_id: symbol"
    
    const lines = mappingData.trim().split('\n');
    let parsed = 0;
    
    symbolMapping = {}; // Reset
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      // Try JSON format: "57548": "PE21000"
      const jsonMatch = trimmed.match(/"(\d+)":\s*"([^"]+)"/);
      if (jsonMatch) {
        const securityId = jsonMatch[1];
        const suffix = jsonMatch[2];
        
        // Convert to Paytm format
        if (suffix.startsWith('CE') || suffix.startsWith('PE')) {
          // Options: NSE:NIFTY-CE23000 → NSE:57695:INDEX_OPT
          symbolMapping[`NSE:NIFTY-${suffix}`] = `NSE:${securityId}:INDEX_OPT`;
        } else if (suffix.includes('INDEX')) {
          // Indices: NSE:NIFTY50-INDEX → NSE:13:INDEX
          symbolMapping[`NSE:${suffix}`] = `NSE:${securityId}:INDEX`;
        } else {
          // Stocks: NSE:RELIANCE-EQ → NSE:2885:EQUITY
          symbolMapping[`NSE:${suffix}-EQ`] = `NSE:${securityId}:EQUITY`;
        }
        
        parsed++;
        continue;
      }
      
      // Try CSV format: security_id,symbol
      const csvMatch = trimmed.match(/^(\d+),(.+)$/);
      if (csvMatch) {
        const securityId = csvMatch[1];
        const symbol = csvMatch[2].trim();
        symbolMapping[symbol] = `NSE:${securityId}:EQUITY`;
        parsed++;
        continue;
      }
    }
    
    console.log(`[PaytmMapping] Loaded ${parsed} symbol mappings`);
    
    // Save to localStorage for persistence
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('paytm_symbol_mapping', JSON.stringify(symbolMapping));
        console.log('[PaytmMapping] Saved to localStorage');
      } catch (e) {
        console.warn('[PaytmMapping] Failed to save to localStorage');
      }
    }
    
    return { success: true, count: parsed };
    
  } catch (error: any) {
    console.error('[PaytmMapping] Parse error:', error);
    return { success: false, count: 0, error: error.message };
  }
};

/**
 * Convert Fyers symbol to Paytm format
 */
export const fyersToPaytm = (fyersSymbol: string): string | null => {
  return symbolMapping[fyersSymbol] || null;
};

/**
 * Convert Paytm format back to Fyers
 */
export const paytmToFyers = (paytmSymbol: string): string | null => {
  const entry = Object.entries(symbolMapping).find(([_, paytm]) => paytm === paytmSymbol);
  return entry ? entry[0] : null;
};

/**
 * Get all mapped symbols
 */
export const getAllMappedSymbols = (): PaytmSymbolMap => {
  return { ...symbolMapping };
};

/**
 * Check if symbol has mapping
 */
export const hasMapping = (fyersSymbol: string): boolean => {
  return fyersSymbol in symbolMapping;
};

/**
 * Get mapping stats
 */
export const getMappingStats = () => {
  const total = Object.keys(symbolMapping).length;
  const stocks = Object.values(symbolMapping).filter(v => v.includes(':EQUITY')).length;
  const options = Object.values(symbolMapping).filter(v => v.includes(':INDEX_OPT')).length;
  
  return { total, stocks, options };
};
