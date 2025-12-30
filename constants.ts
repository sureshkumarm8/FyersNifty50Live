
export const APP_TITLE = "Nifty50 Live";
export const NIFTY_INDEX_SYMBOL = "NSE:NIFTY50-INDEX";

export const REFRESH_OPTIONS = [
  { label: '10 Seconds', value: 10000 },
  { label: '20 Seconds', value: 20000 },
  { label: '30 Seconds', value: 30000 },
  { label: '1 Minute', value: 60000 },
  { label: '2 Minutes', value: 120000 },
  { label: '5 Minutes', value: 300000 },
];

// Top Nifty 50 Symbols mapped to Fyers Symbol Format
export const NIFTY50_SYMBOLS = [
  "NSE:RELIANCE-EQ", "NSE:HDFCBANK-EQ", "NSE:ICICIBANK-EQ", "NSE:INFY-EQ", "NSE:ITC-EQ",
  "NSE:TCS-EQ", "NSE:LTIM-EQ", "NSE:KOTAKBANK-EQ", "NSE:LT-EQ", "NSE:AXISBANK-EQ",
  "NSE:SBIN-EQ", "NSE:BHARTIARTL-EQ", "NSE:BAJFINANCE-EQ", "NSE:ASIANPAINT-EQ", "NSE:MARUTI-EQ",
  "NSE:HCLTECH-EQ", "NSE:SUNPHARMA-EQ", "NSE:TITAN-EQ", "NSE:ULTRACEMCO-EQ", "NSE:TATASTEEL-EQ",
  "NSE:NTPC-EQ", "NSE:POWERGRID-EQ", "NSE:TATAMOTORS-EQ", "NSE:INDUSINDBK-EQ", "NSE:HINDUNILVR-EQ",
  "NSE:NESTLEIND-EQ", "NSE:GRASIM-EQ", "NSE:JSWSTEEL-EQ", "NSE:ADANIENT-EQ", "NSE:ADANIPORTS-EQ",
  "NSE:CIPLA-EQ", "NSE:WIPRO-EQ", "NSE:TECHM-EQ", "NSE:ONGC-EQ", "NSE:SBILIFE-EQ",
  "NSE:DRREDDY-EQ", "NSE:BRITANNIA-EQ", "NSE:COALINDIA-EQ", "NSE:TATACONSUM-EQ", "NSE:EICHERMOT-EQ",
  "NSE:BAJAJ-AUTO-EQ", "NSE:DIVISLAB-EQ", "NSE:APOLLOHOSP-EQ", "NSE:HDFCLIFE-EQ", "NSE:BAJAJFINSV-EQ",
  "NSE:BPCL-EQ", "NSE:HEROMOTOCO-EQ", "NSE:UPL-EQ", "NSE:M&M-EQ"
];

// Approximate Weightage in Nifty 50 (As of recent data, normalized to 100 for calculation)
// Key: Symbol Suffix (e.g. RELIANCE)
export const NIFTY_WEIGHTAGE: Record<string, number> = {
  "HDFCBANK": 13.52,
  "RELIANCE": 9.81,
  "ICICIBANK": 7.85,
  "INFY": 5.86,
  "LTIM": 0.53, // Adjusted
  "ITC": 4.45,
  "TCS": 3.96,
  "LT": 3.65,
  "AXISBANK": 3.25,
  "SBIN": 3.05,
  "BHARTIARTL": 2.95,
  "BAJFINANCE": 2.35,
  "KOTAKBANK": 2.85,
  "HINDUNILVR": 2.30,
  "M&M": 1.95,
  "TATAMOTORS": 1.75,
  "MARUTI": 1.65,
  "SUNPHARMA": 1.55,
  "TITAN": 1.45,
  "NTPC": 1.35,
  "TATASTEEL": 1.30,
  "ULTRACEMCO": 1.15,
  "POWERGRID": 1.10,
  "ADANIENT": 1.05,
  "INDUSINDBK": 0.95,
  "HCLTECH": 0.90,
  "NESTLEIND": 0.90,
  "ONGC": 0.85,
  "JSWSTEEL": 0.80,
  "ADANIPORTS": 0.80,
  "GRASIM": 0.75,
  "COALINDIA": 0.70,
  "SBILIFE": 0.70,
  "BAJAJ-AUTO": 0.65,
  "DRREDDY": 0.65,
  "CIPLA": 0.65,
  "WIPRO": 0.60,
  "HDFCLIFE": 0.60,
  "BRITANNIA": 0.55,
  "TECHM": 0.55,
  "TATACONSUM": 0.55,
  "EICHERMOT": 0.50,
  "BAJAJFINSV": 0.50,
  "DIVISLAB": 0.45,
  "APOLLOHOSP": 0.45,
  "BPCL": 0.45,
  "HEROMOTOCO": 0.40,
  "ASIANPAINT": 1.45, // Correction
  "UPL": 0.35,
  // Add fallback/others to ensure non-zero
};

export const SECTOR_MAPPING: Record<string, string> = {
  "HDFCBANK": "BANK", "ICICIBANK": "BANK", "KOTAKBANK": "BANK", "AXISBANK": "BANK", "SBIN": "BANK", "INDUSINDBK": "BANK",
  "INFY": "IT", "TCS": "IT", "HCLTECH": "IT", "TECHM": "IT", "WIPRO": "IT", "LTIM": "IT",
  "RELIANCE": "OIL_GAS", "ONGC": "OIL_GAS", "BPCL": "OIL_GAS",
  "ITC": "FMCG", "HINDUNILVR": "FMCG", "NESTLEIND": "FMCG", "BRITANNIA": "FMCG", "TATACONSUM": "FMCG",
  "LT": "INFRA", "ULTRACEMCO": "INFRA", "GRASIM": "INFRA",
  "TATAMOTORS": "AUTO", "M&M": "AUTO", "MARUTI": "AUTO", "BAJAJ-AUTO": "AUTO", "HEROMOTOCO": "AUTO", "EICHERMOT": "AUTO",
  "SUNPHARMA": "PHARMA", "DRREDDY": "PHARMA", "CIPLA": "PHARMA", "DIVISLAB": "PHARMA", "APOLLOHOSP": "PHARMA",
  "TATASTEEL": "METAL", "JSWSTEEL": "METAL", "HINDALCO": "METAL", "COALINDIA": "METAL",
  "ADANIENT": "ADANI", "ADANIPORTS": "ADANI",
  "BAJFINANCE": "FINANCE", "BAJAJFINSV": "FINANCE", "HDFCLIFE": "FINANCE", "SBILIFE": "FINANCE",
  "TITAN": "CONSUMER", "ASIANPAINT": "CONSUMER",
  "NTPC": "POWER", "POWERGRID": "POWER",
  "BHARTIARTL": "TELECOM"
};

export const COLUMN_GLOSSARY = [
    {
        term: 'LTP',
        def: 'Last Traded Price. The most recent price at which the stock or option was traded.'
    },
    {
        term: '1m %',
        def: '1-Minute Change %. The percentage change in LTP over the last minute. Formula: ((Current LTP - Previous LTP) / Previous LTP) * 100.'
    },
    {
        term: 'Sess %',
        def: 'Session Change %. The percentage change in LTP since the app was opened (this session). Formula: ((Current LTP - Initial LTP) / Initial LTP) * 100.'
    },
    {
        term: 'Day %',
        def: 'Daily Change %. The percentage change in LTP since yesterday\'s closing price. This data comes directly from the API.'
    },
    {
        term: 'Vol',
        def: 'Volume. The total number of shares/contracts traded during the day.'
    },
    {
        term: 'Total Bid/Ask',
        def: 'Total Bid/Ask Quantity. The total number of buy (Bid) or sell (Ask) orders pending in the market depth.'
    },
    {
        term: 'Bid/Ask 1m %',
        def: '1-Minute Bid/Ask Change %. The percentage change in total Bid or Ask quantity over the last minute. Indicates immediate demand shifts.'
    },
    {
        term: 'Bid/Ask Day %',
        def: 'Session Bid/Ask Change %. The percentage change in total Bid or Ask quantity since the app was opened. Indicates session-long demand trends.'
    },
    {
        term: '1m Net %',
        def: '1-Minute Net Strength %. A momentum indicator. Formula: (Bid 1m %) - (Ask 1m %). A positive value means buying pressure is increasing faster than selling pressure in the last minute.'
    },
    {
        term: 'Day Net %',
        def: 'Session Net Strength %. A trend indicator. Formula: (Bid Day %) - (Ask Day %). A positive value means buying pressure has been stronger than selling pressure throughout this session.'
    },
    {
        term: 'Overall Sent.',
        def: 'Overall Sentiment. A weighted market breadth indicator based on Session Change %. Formula: (Sum of Bullish Weights - Sum of Bearish Weights) / Total Weight. Shows the impact-adjusted market direction.'
    },
    {
        term: 'Stock Sent.',
        def: 'Stock Sentiment. A demand indicator based on session volume delta. Formula: (Session Buy Delta - Session Sell Delta) / Session Sell Delta. Positive means more buying volume has entered than selling volume since the session started.'
    },
    {
        term: 'Call/Put Sent.',
        def: 'Call/Put Sentiment. The net demand for Call or Put options during the session. Formula: (Session Buy Delta - Session Sell Delta) / Session Sell Delta for all Calls or Puts.'
    },
    {
        term: 'PCR',
        def: 'Put-Call Ratio. A contrarian sentiment indicator. Formula: (Total Open Interest of Puts) / (Total Open Interest of Calls). A high PCR (>1) is often considered bullish, while a low PCR (<0.7) is bearish.'
    },
    {
        term: 'Options Sent.',
        def: 'Options Sentiment. The net sentiment from the options market. Formula: (Call Sentiment %) - (Put Sentiment %). Positive means call buying pressure is stronger than put buying pressure.'
    }
];
