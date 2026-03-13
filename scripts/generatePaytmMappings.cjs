const fs = require('fs');
const path = require('path');

const NIFTY50_SYMBOLS = [
  'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK', 'HINDUNILVR', 'ITC', 'SBIN',
  'BHARTIARTL', 'KOTAKBANK', 'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'HCLTECH',
  'BAJFINANCE', 'SUNPHARMA', 'TITAN', 'ULTRACEMCO', 'WIPRO', 'NESTLEIND', 'ONGC',
  'NTPC', 'TATAMOTORS', 'BAJAJFINSV', 'M&M', 'POWERGRID', 'TECHM', 'ADANIENT',
  'TATASTEEL', 'COALINDIA', 'INDUSINDBK', 'HINDALCO', 'GRASIM', 'JSWSTEEL',
  'DRREDDY', 'EICHERMOT', 'CIPLA', 'DIVISLAB', 'BRITANNIA', 'APOLLOHOSP',
  'TATACONSUM', 'BPCL', 'ADANIPORTS', 'SBILIFE', 'HDFCLIFE', 'BAJAJ-AUTO',
  'HEROMOTOCO', 'SHRIRAMFIN', 'LTIM'
];

function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].replace(/"/g, '').split(',');
  
  return lines.slice(1).map(line => {
    const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g)?.map(v => v.replace(/^"|"$/g, '')) || [];
    const entry = {};
    headers.forEach((header, i) => {
      entry[header] = values[i] || '';
    });
    return entry;
  });
}

function generateNifty50Mapping() {
  const equityFile = path.join(__dirname, '../api/paytm/equity_security_master.csv');
  const entries = parseCSV(equityFile);
  
  const mapping = {};
  
  entries.forEach(entry => {
    if (entry.exchange === 'NSE' && 
        entry.instrument_type === 'ES' && 
        NIFTY50_SYMBOLS.includes(entry.symbol)) {
      mapping[entry.symbol] = {
        security_id: entry.security_id,
        name: entry.name,
        symbol: entry.symbol
      };
    }
  });
  
  return mapping;
}

function generateOptionMapping() {
  const optionFile = path.join(__dirname, '../api/paytm/option_security_master.csv');
  const entries = parseCSV(optionFile);
  
  // Group options by expiry date
  const optionsByExpiry = {};
  
  entries.forEach(entry => {
    if (entry.symbol.startsWith('NIFTY-') && 
        entry.exchange === 'NSE' && 
        entry.expiry_date) {
      
      const expiryDate = entry.expiry_date.split(' ')[0]; // Get YYYY-MM-DD
      if (!optionsByExpiry[expiryDate]) {
        optionsByExpiry[expiryDate] = [];
      }
      
      const strike = parseFloat(entry.strike_price || '0');
      const optType = entry.symbol.includes('-CE') ? 'CE' : 'PE';
      
      optionsByExpiry[expiryDate].push({
        security_id: entry.security_id,
        symbol: entry.symbol,
        strike: strike,
        type: optType,
        expiry: expiryDate
      });
    }
  });
  
  return optionsByExpiry;
}

// Generate and save mappings
console.log('Generating Nifty50 equity mappings...');
const nifty50Map = generateNifty50Mapping();
console.log(`Found ${Object.keys(nifty50Map).length} Nifty50 stocks`);

console.log('\nGenerating option mappings...');
const optionsMap = generateOptionMapping();
const expiryDates = Object.keys(optionsMap).sort();
console.log(`Found ${expiryDates.length} expiry dates`);
console.log(`Expiry range: ${expiryDates[0]} to ${expiryDates[expiryDates.length - 1]}`);

// Generate TypeScript constant file
const tsContent = `// Auto-generated PayTM Money security mappings
// Generated on: ${new Date().toISOString()}
// Source: api/paytm/equity_security_master.csv & option_security_master.csv

export interface SecurityMapping {
  security_id: string;
  name: string;
  symbol: string;
}

export interface OptionMapping {
  security_id: string;
  symbol: string;
  strike: number;
  type: 'CE' | 'PE';
  expiry: string;
}

// Nifty50 Stock Security IDs
export const PAYTM_NIFTY50_MAP: Record<string, SecurityMapping> = ${JSON.stringify(nifty50Map, null, 2)};

// Nifty Options by Expiry Date
export const PAYTM_NIFTY_OPTIONS: Record<string, OptionMapping[]> = ${JSON.stringify(optionsMap, null, 2)};

// Helper function to get Nifty50 security IDs
export function getNifty50SecurityIds(): string[] {
  return Object.values(PAYTM_NIFTY50_MAP).map(s => s.security_id);
}

// Helper function to get option IDs for a specific expiry and strike range
export function getOptionSecurityIds(
  expiryDate: string,
  atmStrike: number,
  strikeRange: number = 20
): string[] {
  const options = PAYTM_NIFTY_OPTIONS[expiryDate] || [];
  const minStrike = atmStrike - (strikeRange * 50);
  const maxStrike = atmStrike + (strikeRange * 50);
  
  return options
    .filter(opt => opt.strike >= minStrike && opt.strike <= maxStrike)
    .map(opt => opt.security_id);
}

// Get all available expiry dates (sorted)
export function getAvailableExpiries(): string[] {
  return Object.keys(PAYTM_NIFTY_OPTIONS).sort();
}

// Get next upcoming expiry (Thursday)
export function getUpcomingExpiry(): string | null {
  const today = new Date();
  const availableExpiries = getAvailableExpiries();
  
  for (const expiry of availableExpiries) {
    const expiryDate = new Date(expiry);
    if (expiryDate >= today) {
      return expiry;
    }
  }
  
  return null;
}
`;

const outputPath = path.join(__dirname, '../constants/paytmMappings.ts');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, tsContent);

console.log(`\n✅ Generated: ${outputPath}`);
console.log('\nSummary:');
console.log(`- Nifty50 stocks: ${Object.keys(nifty50Map).length}`);
console.log(`- Expiry dates: ${expiryDates.length}`);
console.log(`- Total option contracts: ${Object.values(optionsMap).reduce((sum, opts) => sum + opts.length, 0)}`);
