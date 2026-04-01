// Auto-generated PayTM Money security mappings
// Generated on: 2026-04-01T05:43:10.094Z
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
export const PAYTM_NIFTY50_MAP: Record<string, SecurityMapping> = {
  "SUNPHARMA": {
    "security_id": "3351",
    "name": "Sun Pharmaceutical",
    "symbol": "SUNPHARMA"
  },
  "TCS": {
    "security_id": "11536",
    "name": "Tata Consultancy Services",
    "symbol": "TCS"
  },
  "DIVISLAB": {
    "security_id": "10940",
    "name": "Divis Laboratories",
    "symbol": "DIVISLAB"
  },
  "WIPRO": {
    "security_id": "3787",
    "name": "Wipro",
    "symbol": "WIPRO"
  },
  "TECHM": {
    "security_id": "13538",
    "name": "Tech Mahindra",
    "symbol": "TECHM"
  },
  "KOTAKBANK": {
    "security_id": "1922",
    "name": "Kotak Bank",
    "symbol": "KOTAKBANK"
  },
  "AXISBANK": {
    "security_id": "5900",
    "name": "Axis Bank",
    "symbol": "AXISBANK"
  },
  "ADANIENT": {
    "security_id": "25",
    "name": "Adani Enterprises",
    "symbol": "ADANIENT"
  },
  "CIPLA": {
    "security_id": "694",
    "name": "Cipla",
    "symbol": "CIPLA"
  },
  "BHARTIARTL": {
    "security_id": "10604",
    "name": "Bharti Airtel",
    "symbol": "BHARTIARTL"
  },
  "BPCL": {
    "security_id": "526",
    "name": "Bharat Petroleum",
    "symbol": "BPCL"
  },
  "ULTRACEMCO": {
    "security_id": "11532",
    "name": "Ultratech Cement",
    "symbol": "ULTRACEMCO"
  },
  "BRITANNIA": {
    "security_id": "547",
    "name": "Britannia Industries",
    "symbol": "BRITANNIA"
  },
  "ONGC": {
    "security_id": "2475",
    "name": "ONGC",
    "symbol": "ONGC"
  },
  "HEROMOTOCO": {
    "security_id": "1348",
    "name": "Hero Motocorp",
    "symbol": "HEROMOTOCO"
  },
  "POWERGRID": {
    "security_id": "14977",
    "name": "Power Grid",
    "symbol": "POWERGRID"
  },
  "INFY": {
    "security_id": "1594",
    "name": "Infosys",
    "symbol": "INFY"
  },
  "HCLTECH": {
    "security_id": "7229",
    "name": "HCL Technologies",
    "symbol": "HCLTECH"
  },
  "SBIN": {
    "security_id": "3045",
    "name": "State Bank Of India",
    "symbol": "SBIN"
  },
  "RELIANCE": {
    "security_id": "2885",
    "name": "Reliance Industries",
    "symbol": "RELIANCE"
  },
  "MARUTI": {
    "security_id": "10999",
    "name": "Maruti Suzuki India",
    "symbol": "MARUTI"
  },
  "M&M": {
    "security_id": "2031",
    "name": "Mahindra & Mahindra",
    "symbol": "M&M"
  },
  "SBILIFE": {
    "security_id": "21808",
    "name": "SBI Life Insurance",
    "symbol": "SBILIFE"
  },
  "GRASIM": {
    "security_id": "1232",
    "name": "Grasim Industries",
    "symbol": "GRASIM"
  },
  "JSWSTEEL": {
    "security_id": "11723",
    "name": "JSW Steel",
    "symbol": "JSWSTEEL"
  },
  "HDFCLIFE": {
    "security_id": "467",
    "name": "HDFC Life",
    "symbol": "HDFCLIFE"
  },
  "LT": {
    "security_id": "11483",
    "name": "LT - Larsen & Toubro",
    "symbol": "LT"
  },
  "ADANIPORTS": {
    "security_id": "15083",
    "name": "Adani Ports",
    "symbol": "ADANIPORTS"
  },
  "HINDALCO": {
    "security_id": "1363",
    "name": "Hindalco Industries",
    "symbol": "HINDALCO"
  },
  "INDUSINDBK": {
    "security_id": "5258",
    "name": "Indusind Bank",
    "symbol": "INDUSINDBK"
  },
  "APOLLOHOSP": {
    "security_id": "157",
    "name": "Apollo Hospitals",
    "symbol": "APOLLOHOSP"
  },
  "TITAN": {
    "security_id": "3506",
    "name": "Titan",
    "symbol": "TITAN"
  },
  "ITC": {
    "security_id": "1660",
    "name": "ITC",
    "symbol": "ITC"
  },
  "BAJAJ-AUTO": {
    "security_id": "16669",
    "name": "Bajaj Auto",
    "symbol": "BAJAJ-AUTO"
  },
  "COALINDIA": {
    "security_id": "20374",
    "name": "Coal India",
    "symbol": "COALINDIA"
  },
  "EICHERMOT": {
    "security_id": "910",
    "name": "Eicher Motors",
    "symbol": "EICHERMOT"
  },
  "TATACONSUM": {
    "security_id": "3432",
    "name": "Tata Consumer Products",
    "symbol": "TATACONSUM"
  },
  "ASIANPAINT": {
    "security_id": "236",
    "name": "Asian Paints",
    "symbol": "ASIANPAINT"
  },
  "ICICIBANK": {
    "security_id": "4963",
    "name": "ICICI Bank",
    "symbol": "ICICIBANK"
  },
  "HINDUNILVR": {
    "security_id": "1394",
    "name": "Hindustan Unilever",
    "symbol": "HINDUNILVR"
  },
  "NTPC": {
    "security_id": "11630",
    "name": "NTPC",
    "symbol": "NTPC"
  },
  "HDFCBANK": {
    "security_id": "1333",
    "name": "HDFC Bank",
    "symbol": "HDFCBANK"
  },
  "TATASTEEL": {
    "security_id": "3499",
    "name": "Tata Steel",
    "symbol": "TATASTEEL"
  },
  "BAJAJFINSV": {
    "security_id": "16675",
    "name": "Bajaj Finserv",
    "symbol": "BAJAJFINSV"
  },
  "NESTLEIND": {
    "security_id": "17963",
    "name": "Nestle India",
    "symbol": "NESTLEIND"
  },
  "DRREDDY": {
    "security_id": "881",
    "name": "Dr. Reddys Laboratories",
    "symbol": "DRREDDY"
  },
  "SHRIRAMFIN": {
    "security_id": "4306",
    "name": "Shriram Finance Limited",
    "symbol": "SHRIRAMFIN"
  },
  "BAJFINANCE": {
    "security_id": "317",
    "name": "Bajaj Finance",
    "symbol": "BAJFINANCE"
  }
};

// Nifty Options by Expiry Date
export const PAYTM_NIFTY_OPTIONS: Record<string, OptionMapping[]> = {
  "2030-06-25": [
    {
      "security_id": "60872",
      "symbol": "NIFTY-Jun2030-12000-CE",
      "strike": 12000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60877",
      "symbol": "NIFTY-Jun2030-12000-PE",
      "strike": 12000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60886",
      "symbol": "NIFTY-Jun2030-15000-CE",
      "strike": 15000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60887",
      "symbol": "NIFTY-Jun2030-15000-PE",
      "strike": 15000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60892",
      "symbol": "NIFTY-Jun2030-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60893",
      "symbol": "NIFTY-Jun2030-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60898",
      "symbol": "NIFTY-Jun2030-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60899",
      "symbol": "NIFTY-Jun2030-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60904",
      "symbol": "NIFTY-Jun2030-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60905",
      "symbol": "NIFTY-Jun2030-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60910",
      "symbol": "NIFTY-Jun2030-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60911",
      "symbol": "NIFTY-Jun2030-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60936",
      "symbol": "NIFTY-Jun2030-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60939",
      "symbol": "NIFTY-Jun2030-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60944",
      "symbol": "NIFTY-Jun2030-33000-CE",
      "strike": 33000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60945",
      "symbol": "NIFTY-Jun2030-33000-PE",
      "strike": 33000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60950",
      "symbol": "NIFTY-Jun2030-36000-CE",
      "strike": 36000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60951",
      "symbol": "NIFTY-Jun2030-36000-PE",
      "strike": 36000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60958",
      "symbol": "NIFTY-Jun2030-39000-CE",
      "strike": 39000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "60959",
      "symbol": "NIFTY-Jun2030-39000-PE",
      "strike": 39000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "39651",
      "symbol": "NIFTY-Jun2030-9000-CE",
      "strike": 9000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "39652",
      "symbol": "NIFTY-Jun2030-9000-PE",
      "strike": 9000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55628",
      "symbol": "NIFTY-Jun2030-3000-CE",
      "strike": 3000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55629",
      "symbol": "NIFTY-Jun2030-3000-PE",
      "strike": 3000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55630",
      "symbol": "NIFTY-Jun2030-4500-CE",
      "strike": 4500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55631",
      "symbol": "NIFTY-Jun2030-4500-PE",
      "strike": 4500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55632",
      "symbol": "NIFTY-Jun2030-6000-CE",
      "strike": 6000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55633",
      "symbol": "NIFTY-Jun2030-6000-PE",
      "strike": 6000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55634",
      "symbol": "NIFTY-Jun2030-7500-CE",
      "strike": 7500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55635",
      "symbol": "NIFTY-Jun2030-7500-PE",
      "strike": 7500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55636",
      "symbol": "NIFTY-Jun2030-10500-CE",
      "strike": 10500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55637",
      "symbol": "NIFTY-Jun2030-10500-PE",
      "strike": 10500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55638",
      "symbol": "NIFTY-Jun2030-13500-CE",
      "strike": 13500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55639",
      "symbol": "NIFTY-Jun2030-13500-PE",
      "strike": 13500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55640",
      "symbol": "NIFTY-Jun2030-16500-CE",
      "strike": 16500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55641",
      "symbol": "NIFTY-Jun2030-16500-PE",
      "strike": 16500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55642",
      "symbol": "NIFTY-Jun2030-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55643",
      "symbol": "NIFTY-Jun2030-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55644",
      "symbol": "NIFTY-Jun2030-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55645",
      "symbol": "NIFTY-Jun2030-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55646",
      "symbol": "NIFTY-Jun2030-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55647",
      "symbol": "NIFTY-Jun2030-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55648",
      "symbol": "NIFTY-Jun2030-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55649",
      "symbol": "NIFTY-Jun2030-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55650",
      "symbol": "NIFTY-Jun2030-31500-CE",
      "strike": 31500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55651",
      "symbol": "NIFTY-Jun2030-31500-PE",
      "strike": 31500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55652",
      "symbol": "NIFTY-Jun2030-34500-CE",
      "strike": 34500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55653",
      "symbol": "NIFTY-Jun2030-34500-PE",
      "strike": 34500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55654",
      "symbol": "NIFTY-Jun2030-37500-CE",
      "strike": 37500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55655",
      "symbol": "NIFTY-Jun2030-37500-PE",
      "strike": 37500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55656",
      "symbol": "NIFTY-Jun2030-40500-CE",
      "strike": 40500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55657",
      "symbol": "NIFTY-Jun2030-40500-PE",
      "strike": 40500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55658",
      "symbol": "NIFTY-Jun2030-42000-CE",
      "strike": 42000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55659",
      "symbol": "NIFTY-Jun2030-42000-PE",
      "strike": 42000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55660",
      "symbol": "NIFTY-Jun2030-43500-CE",
      "strike": 43500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55661",
      "symbol": "NIFTY-Jun2030-43500-PE",
      "strike": 43500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55662",
      "symbol": "NIFTY-Jun2030-45000-CE",
      "strike": 45000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55663",
      "symbol": "NIFTY-Jun2030-45000-PE",
      "strike": 45000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55667",
      "symbol": "NIFTY-Jun2030-46500-CE",
      "strike": 46500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55669",
      "symbol": "NIFTY-Jun2030-46500-PE",
      "strike": 46500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55670",
      "symbol": "NIFTY-Jun2030-48000-CE",
      "strike": 48000,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "55671",
      "symbol": "NIFTY-Jun2030-48000-PE",
      "strike": 48000,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "38737",
      "symbol": "NIFTY-Jun2030-49500-CE",
      "strike": 49500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "38738",
      "symbol": "NIFTY-Jun2030-49500-PE",
      "strike": 49500,
      "type": "PE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "43891",
      "symbol": "NIFTY-Jun2030-1500-CE",
      "strike": 1500,
      "type": "CE",
      "expiry": "2030-06-25"
    },
    {
      "security_id": "43893",
      "symbol": "NIFTY-Jun2030-1500-PE",
      "strike": 1500,
      "type": "PE",
      "expiry": "2030-06-25"
    }
  ],
  "2026-06-30": [
    {
      "security_id": "35229",
      "symbol": "NIFTY-Jun2026-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "35231",
      "symbol": "NIFTY-Jun2026-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "39989",
      "symbol": "NIFTY-Jun2026-19000-CE",
      "strike": 19000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "39990",
      "symbol": "NIFTY-Jun2026-19000-PE",
      "strike": 19000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "50556",
      "symbol": "NIFTY-Jun2026-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "50557",
      "symbol": "NIFTY-Jun2026-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "37799",
      "symbol": "NIFTY-Jun2026-23000-CE",
      "strike": 23000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "37802",
      "symbol": "NIFTY-Jun2026-13000-PE",
      "strike": 13000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "37805",
      "symbol": "NIFTY-Jun2026-23000-PE",
      "strike": 23000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "50973",
      "symbol": "NIFTY-Jun2026-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "50976",
      "symbol": "NIFTY-Jun2026-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "51453",
      "symbol": "NIFTY-Jun2026-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "51455",
      "symbol": "NIFTY-Jun2026-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "38154",
      "symbol": "NIFTY-Jun2026-29000-CE",
      "strike": 29000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "38157",
      "symbol": "NIFTY-Jun2026-29000-PE",
      "strike": 29000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "38380",
      "symbol": "NIFTY-Jun2026-20000-PE",
      "strike": 20000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "47188",
      "symbol": "NIFTY-Jun2026-33000-CE",
      "strike": 33000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "47189",
      "symbol": "NIFTY-Jun2026-33000-PE",
      "strike": 33000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "42133",
      "symbol": "NIFTY-Jun2026-31000-CE",
      "strike": 31000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "45890",
      "symbol": "NIFTY-Jun2026-36000-CE",
      "strike": 36000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "45891",
      "symbol": "NIFTY-Jun2026-36000-PE",
      "strike": 36000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "59062",
      "symbol": "NIFTY-Jun2026-39000-CE",
      "strike": 39000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "59063",
      "symbol": "NIFTY-Jun2026-39000-PE",
      "strike": 39000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "50444",
      "symbol": "NIFTY-Jun2026-14000-PE",
      "strike": 14000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "50447",
      "symbol": "NIFTY-Jun2026-15000-CE",
      "strike": 15000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "50448",
      "symbol": "NIFTY-Jun2026-15000-PE",
      "strike": 15000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "50462",
      "symbol": "NIFTY-Jun2026-16000-PE",
      "strike": 16000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "50545",
      "symbol": "NIFTY-Jun2026-28000-CE",
      "strike": 28000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "50546",
      "symbol": "NIFTY-Jun2026-28000-PE",
      "strike": 28000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "58624",
      "symbol": "NIFTY-Jun2026-12000-CE",
      "strike": 12000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "58625",
      "symbol": "NIFTY-Jun2026-12000-PE",
      "strike": 12000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "58627",
      "symbol": "NIFTY-Jun2026-22000-PE",
      "strike": 22000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "71472",
      "symbol": "NIFTY-Jun2026-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "71473",
      "symbol": "NIFTY-Jun2026-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "71474",
      "symbol": "NIFTY-Jun2026-25000-CE",
      "strike": 25000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "71475",
      "symbol": "NIFTY-Jun2026-25000-PE",
      "strike": 25000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "71476",
      "symbol": "NIFTY-Jun2026-26000-CE",
      "strike": 26000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "71477",
      "symbol": "NIFTY-Jun2026-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "39624",
      "symbol": "NIFTY-Jun2026-9000-CE",
      "strike": 9000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "39627",
      "symbol": "NIFTY-Jun2026-9000-PE",
      "strike": 9000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55166",
      "symbol": "NIFTY-Jun2026-3000-CE",
      "strike": 3000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55167",
      "symbol": "NIFTY-Jun2026-3000-PE",
      "strike": 3000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55169",
      "symbol": "NIFTY-Jun2026-4500-CE",
      "strike": 4500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55170",
      "symbol": "NIFTY-Jun2026-4500-PE",
      "strike": 4500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55171",
      "symbol": "NIFTY-Jun2026-6000-CE",
      "strike": 6000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55172",
      "symbol": "NIFTY-Jun2026-6000-PE",
      "strike": 6000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55175",
      "symbol": "NIFTY-Jun2026-7500-CE",
      "strike": 7500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55176",
      "symbol": "NIFTY-Jun2026-7500-PE",
      "strike": 7500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55177",
      "symbol": "NIFTY-Jun2026-10500-CE",
      "strike": 10500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55178",
      "symbol": "NIFTY-Jun2026-10500-PE",
      "strike": 10500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55179",
      "symbol": "NIFTY-Jun2026-13500-CE",
      "strike": 13500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55180",
      "symbol": "NIFTY-Jun2026-13500-PE",
      "strike": 13500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55181",
      "symbol": "NIFTY-Jun2026-16500-CE",
      "strike": 16500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55182",
      "symbol": "NIFTY-Jun2026-16500-PE",
      "strike": 16500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55183",
      "symbol": "NIFTY-Jun2026-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55184",
      "symbol": "NIFTY-Jun2026-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55185",
      "symbol": "NIFTY-Jun2026-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55186",
      "symbol": "NIFTY-Jun2026-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55188",
      "symbol": "NIFTY-Jun2026-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55189",
      "symbol": "NIFTY-Jun2026-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55190",
      "symbol": "NIFTY-Jun2026-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55191",
      "symbol": "NIFTY-Jun2026-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55220",
      "symbol": "NIFTY-Jun2026-31500-CE",
      "strike": 31500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55221",
      "symbol": "NIFTY-Jun2026-31500-PE",
      "strike": 31500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55224",
      "symbol": "NIFTY-Jun2026-34500-CE",
      "strike": 34500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55225",
      "symbol": "NIFTY-Jun2026-34500-PE",
      "strike": 34500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55226",
      "symbol": "NIFTY-Jun2026-37500-CE",
      "strike": 37500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55227",
      "symbol": "NIFTY-Jun2026-37500-PE",
      "strike": 37500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55234",
      "symbol": "NIFTY-Jun2026-40500-CE",
      "strike": 40500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55235",
      "symbol": "NIFTY-Jun2026-40500-PE",
      "strike": 40500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55236",
      "symbol": "NIFTY-Jun2026-42000-CE",
      "strike": 42000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55237",
      "symbol": "NIFTY-Jun2026-42000-PE",
      "strike": 42000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55238",
      "symbol": "NIFTY-Jun2026-43500-CE",
      "strike": 43500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55239",
      "symbol": "NIFTY-Jun2026-43500-PE",
      "strike": 43500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55240",
      "symbol": "NIFTY-Jun2026-45000-CE",
      "strike": 45000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55241",
      "symbol": "NIFTY-Jun2026-45000-PE",
      "strike": 45000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55244",
      "symbol": "NIFTY-Jun2026-46500-CE",
      "strike": 46500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55245",
      "symbol": "NIFTY-Jun2026-46500-PE",
      "strike": 46500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55246",
      "symbol": "NIFTY-Jun2026-48000-CE",
      "strike": 48000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "55247",
      "symbol": "NIFTY-Jun2026-48000-PE",
      "strike": 48000,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "38707",
      "symbol": "NIFTY-Jun2026-49500-CE",
      "strike": 49500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "38708",
      "symbol": "NIFTY-Jun2026-49500-PE",
      "strike": 49500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "43868",
      "symbol": "NIFTY-Jun2026-1500-CE",
      "strike": 1500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "43869",
      "symbol": "NIFTY-Jun2026-1500-PE",
      "strike": 1500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79480",
      "symbol": "NIFTY-Jun2026-21700-CE",
      "strike": 21700,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79481",
      "symbol": "NIFTY-Jun2026-21700-PE",
      "strike": 21700,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79482",
      "symbol": "NIFTY-Jun2026-21750-CE",
      "strike": 21750,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79483",
      "symbol": "NIFTY-Jun2026-21750-PE",
      "strike": 21750,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79484",
      "symbol": "NIFTY-Jun2026-21800-CE",
      "strike": 21800,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79485",
      "symbol": "NIFTY-Jun2026-21800-PE",
      "strike": 21800,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79486",
      "symbol": "NIFTY-Jun2026-21850-CE",
      "strike": 21850,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79504",
      "symbol": "NIFTY-Jun2026-21850-PE",
      "strike": 21850,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79505",
      "symbol": "NIFTY-Jun2026-21900-CE",
      "strike": 21900,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79506",
      "symbol": "NIFTY-Jun2026-21900-PE",
      "strike": 21900,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79507",
      "symbol": "NIFTY-Jun2026-21950-CE",
      "strike": 21950,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79508",
      "symbol": "NIFTY-Jun2026-21950-PE",
      "strike": 21950,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79509",
      "symbol": "NIFTY-Jun2026-22000-CE",
      "strike": 22000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79510",
      "symbol": "NIFTY-Jun2026-22050-CE",
      "strike": 22050,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79511",
      "symbol": "NIFTY-Jun2026-22050-PE",
      "strike": 22050,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79512",
      "symbol": "NIFTY-Jun2026-22100-CE",
      "strike": 22100,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79513",
      "symbol": "NIFTY-Jun2026-22100-PE",
      "strike": 22100,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79514",
      "symbol": "NIFTY-Jun2026-22150-CE",
      "strike": 22150,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79515",
      "symbol": "NIFTY-Jun2026-22150-PE",
      "strike": 22150,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79516",
      "symbol": "NIFTY-Jun2026-22200-CE",
      "strike": 22200,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79517",
      "symbol": "NIFTY-Jun2026-22200-PE",
      "strike": 22200,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79518",
      "symbol": "NIFTY-Jun2026-22250-CE",
      "strike": 22250,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79519",
      "symbol": "NIFTY-Jun2026-22250-PE",
      "strike": 22250,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79520",
      "symbol": "NIFTY-Jun2026-22300-CE",
      "strike": 22300,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79521",
      "symbol": "NIFTY-Jun2026-22300-PE",
      "strike": 22300,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79522",
      "symbol": "NIFTY-Jun2026-22350-CE",
      "strike": 22350,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79523",
      "symbol": "NIFTY-Jun2026-22350-PE",
      "strike": 22350,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79524",
      "symbol": "NIFTY-Jun2026-22400-CE",
      "strike": 22400,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79525",
      "symbol": "NIFTY-Jun2026-22400-PE",
      "strike": 22400,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79526",
      "symbol": "NIFTY-Jun2026-22450-CE",
      "strike": 22450,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79527",
      "symbol": "NIFTY-Jun2026-22450-PE",
      "strike": 22450,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79528",
      "symbol": "NIFTY-Jun2026-22550-CE",
      "strike": 22550,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79529",
      "symbol": "NIFTY-Jun2026-22550-PE",
      "strike": 22550,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79530",
      "symbol": "NIFTY-Jun2026-22600-CE",
      "strike": 22600,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79531",
      "symbol": "NIFTY-Jun2026-22600-PE",
      "strike": 22600,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79532",
      "symbol": "NIFTY-Jun2026-22650-CE",
      "strike": 22650,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79533",
      "symbol": "NIFTY-Jun2026-22650-PE",
      "strike": 22650,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79534",
      "symbol": "NIFTY-Jun2026-22700-CE",
      "strike": 22700,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79535",
      "symbol": "NIFTY-Jun2026-22700-PE",
      "strike": 22700,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79536",
      "symbol": "NIFTY-Jun2026-22750-CE",
      "strike": 22750,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79537",
      "symbol": "NIFTY-Jun2026-22750-PE",
      "strike": 22750,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79538",
      "symbol": "NIFTY-Jun2026-22800-CE",
      "strike": 22800,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79539",
      "symbol": "NIFTY-Jun2026-22800-PE",
      "strike": 22800,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79540",
      "symbol": "NIFTY-Jun2026-22850-CE",
      "strike": 22850,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79541",
      "symbol": "NIFTY-Jun2026-22850-PE",
      "strike": 22850,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79542",
      "symbol": "NIFTY-Jun2026-22900-CE",
      "strike": 22900,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79543",
      "symbol": "NIFTY-Jun2026-22900-PE",
      "strike": 22900,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79544",
      "symbol": "NIFTY-Jun2026-22950-CE",
      "strike": 22950,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79545",
      "symbol": "NIFTY-Jun2026-22950-PE",
      "strike": 22950,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79546",
      "symbol": "NIFTY-Jun2026-23050-CE",
      "strike": 23050,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79547",
      "symbol": "NIFTY-Jun2026-23050-PE",
      "strike": 23050,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79548",
      "symbol": "NIFTY-Jun2026-23100-CE",
      "strike": 23100,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79549",
      "symbol": "NIFTY-Jun2026-23100-PE",
      "strike": 23100,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79552",
      "symbol": "NIFTY-Jun2026-23150-CE",
      "strike": 23150,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79564",
      "symbol": "NIFTY-Jun2026-23150-PE",
      "strike": 23150,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79565",
      "symbol": "NIFTY-Jun2026-23200-CE",
      "strike": 23200,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79566",
      "symbol": "NIFTY-Jun2026-23200-PE",
      "strike": 23200,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79567",
      "symbol": "NIFTY-Jun2026-23250-CE",
      "strike": 23250,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79634",
      "symbol": "NIFTY-Jun2026-23250-PE",
      "strike": 23250,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79652",
      "symbol": "NIFTY-Jun2026-23300-CE",
      "strike": 23300,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79653",
      "symbol": "NIFTY-Jun2026-23300-PE",
      "strike": 23300,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79693",
      "symbol": "NIFTY-Jun2026-23350-CE",
      "strike": 23350,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79694",
      "symbol": "NIFTY-Jun2026-23350-PE",
      "strike": 23350,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79695",
      "symbol": "NIFTY-Jun2026-23400-CE",
      "strike": 23400,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79696",
      "symbol": "NIFTY-Jun2026-23400-PE",
      "strike": 23400,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79697",
      "symbol": "NIFTY-Jun2026-23450-CE",
      "strike": 23450,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79698",
      "symbol": "NIFTY-Jun2026-23450-PE",
      "strike": 23450,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79699",
      "symbol": "NIFTY-Jun2026-23500-CE",
      "strike": 23500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79700",
      "symbol": "NIFTY-Jun2026-23500-PE",
      "strike": 23500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79701",
      "symbol": "NIFTY-Jun2026-23550-CE",
      "strike": 23550,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79702",
      "symbol": "NIFTY-Jun2026-23550-PE",
      "strike": 23550,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79703",
      "symbol": "NIFTY-Jun2026-23600-CE",
      "strike": 23600,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79704",
      "symbol": "NIFTY-Jun2026-23600-PE",
      "strike": 23600,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79705",
      "symbol": "NIFTY-Jun2026-23650-CE",
      "strike": 23650,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79706",
      "symbol": "NIFTY-Jun2026-23650-PE",
      "strike": 23650,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79707",
      "symbol": "NIFTY-Jun2026-23700-CE",
      "strike": 23700,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79708",
      "symbol": "NIFTY-Jun2026-23700-PE",
      "strike": 23700,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79709",
      "symbol": "NIFTY-Jun2026-23750-CE",
      "strike": 23750,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79710",
      "symbol": "NIFTY-Jun2026-23750-PE",
      "strike": 23750,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79711",
      "symbol": "NIFTY-Jun2026-23800-CE",
      "strike": 23800,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79712",
      "symbol": "NIFTY-Jun2026-23800-PE",
      "strike": 23800,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79713",
      "symbol": "NIFTY-Jun2026-23850-CE",
      "strike": 23850,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79714",
      "symbol": "NIFTY-Jun2026-23850-PE",
      "strike": 23850,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79722",
      "symbol": "NIFTY-Jun2026-23900-CE",
      "strike": 23900,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79723",
      "symbol": "NIFTY-Jun2026-23900-PE",
      "strike": 23900,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79728",
      "symbol": "NIFTY-Jun2026-23950-CE",
      "strike": 23950,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79729",
      "symbol": "NIFTY-Jun2026-23950-PE",
      "strike": 23950,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79730",
      "symbol": "NIFTY-Jun2026-24050-CE",
      "strike": 24050,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79731",
      "symbol": "NIFTY-Jun2026-24050-PE",
      "strike": 24050,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79732",
      "symbol": "NIFTY-Jun2026-24100-CE",
      "strike": 24100,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79733",
      "symbol": "NIFTY-Jun2026-24100-PE",
      "strike": 24100,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79734",
      "symbol": "NIFTY-Jun2026-24150-CE",
      "strike": 24150,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79735",
      "symbol": "NIFTY-Jun2026-24150-PE",
      "strike": 24150,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79736",
      "symbol": "NIFTY-Jun2026-24200-CE",
      "strike": 24200,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79737",
      "symbol": "NIFTY-Jun2026-24200-PE",
      "strike": 24200,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79738",
      "symbol": "NIFTY-Jun2026-24250-CE",
      "strike": 24250,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79739",
      "symbol": "NIFTY-Jun2026-24250-PE",
      "strike": 24250,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79740",
      "symbol": "NIFTY-Jun2026-24300-CE",
      "strike": 24300,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79741",
      "symbol": "NIFTY-Jun2026-24300-PE",
      "strike": 24300,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79742",
      "symbol": "NIFTY-Jun2026-24350-CE",
      "strike": 24350,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79743",
      "symbol": "NIFTY-Jun2026-24350-PE",
      "strike": 24350,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79746",
      "symbol": "NIFTY-Jun2026-24400-CE",
      "strike": 24400,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79747",
      "symbol": "NIFTY-Jun2026-24400-PE",
      "strike": 24400,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79748",
      "symbol": "NIFTY-Jun2026-24450-CE",
      "strike": 24450,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79749",
      "symbol": "NIFTY-Jun2026-24450-PE",
      "strike": 24450,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79750",
      "symbol": "NIFTY-Jun2026-24500-CE",
      "strike": 24500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79751",
      "symbol": "NIFTY-Jun2026-24500-PE",
      "strike": 24500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79754",
      "symbol": "NIFTY-Jun2026-24550-CE",
      "strike": 24550,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79755",
      "symbol": "NIFTY-Jun2026-24550-PE",
      "strike": 24550,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79756",
      "symbol": "NIFTY-Jun2026-24600-CE",
      "strike": 24600,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79757",
      "symbol": "NIFTY-Jun2026-24600-PE",
      "strike": 24600,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79758",
      "symbol": "NIFTY-Jun2026-24650-CE",
      "strike": 24650,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79759",
      "symbol": "NIFTY-Jun2026-24650-PE",
      "strike": 24650,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79760",
      "symbol": "NIFTY-Jun2026-24700-CE",
      "strike": 24700,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79761",
      "symbol": "NIFTY-Jun2026-24700-PE",
      "strike": 24700,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79762",
      "symbol": "NIFTY-Jun2026-24750-CE",
      "strike": 24750,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79763",
      "symbol": "NIFTY-Jun2026-24750-PE",
      "strike": 24750,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79766",
      "symbol": "NIFTY-Jun2026-24800-CE",
      "strike": 24800,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79767",
      "symbol": "NIFTY-Jun2026-24800-PE",
      "strike": 24800,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79768",
      "symbol": "NIFTY-Jun2026-24850-CE",
      "strike": 24850,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79769",
      "symbol": "NIFTY-Jun2026-24850-PE",
      "strike": 24850,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79770",
      "symbol": "NIFTY-Jun2026-24900-CE",
      "strike": 24900,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79773",
      "symbol": "NIFTY-Jun2026-24900-PE",
      "strike": 24900,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79774",
      "symbol": "NIFTY-Jun2026-24950-CE",
      "strike": 24950,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79802",
      "symbol": "NIFTY-Jun2026-24950-PE",
      "strike": 24950,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79803",
      "symbol": "NIFTY-Jun2026-25050-CE",
      "strike": 25050,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79804",
      "symbol": "NIFTY-Jun2026-25050-PE",
      "strike": 25050,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79805",
      "symbol": "NIFTY-Jun2026-25100-CE",
      "strike": 25100,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79806",
      "symbol": "NIFTY-Jun2026-25100-PE",
      "strike": 25100,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79807",
      "symbol": "NIFTY-Jun2026-25150-CE",
      "strike": 25150,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79808",
      "symbol": "NIFTY-Jun2026-25150-PE",
      "strike": 25150,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79809",
      "symbol": "NIFTY-Jun2026-25200-CE",
      "strike": 25200,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79810",
      "symbol": "NIFTY-Jun2026-25200-PE",
      "strike": 25200,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79811",
      "symbol": "NIFTY-Jun2026-25250-CE",
      "strike": 25250,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79812",
      "symbol": "NIFTY-Jun2026-25250-PE",
      "strike": 25250,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79813",
      "symbol": "NIFTY-Jun2026-25300-CE",
      "strike": 25300,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79814",
      "symbol": "NIFTY-Jun2026-25300-PE",
      "strike": 25300,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79817",
      "symbol": "NIFTY-Jun2026-25350-CE",
      "strike": 25350,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79825",
      "symbol": "NIFTY-Jun2026-25350-PE",
      "strike": 25350,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79827",
      "symbol": "NIFTY-Jun2026-25400-CE",
      "strike": 25400,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79828",
      "symbol": "NIFTY-Jun2026-25400-PE",
      "strike": 25400,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79829",
      "symbol": "NIFTY-Jun2026-25450-CE",
      "strike": 25450,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79830",
      "symbol": "NIFTY-Jun2026-25450-PE",
      "strike": 25450,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79831",
      "symbol": "NIFTY-Jun2026-25550-CE",
      "strike": 25550,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79832",
      "symbol": "NIFTY-Jun2026-25550-PE",
      "strike": 25550,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79838",
      "symbol": "NIFTY-Jun2026-25600-CE",
      "strike": 25600,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79839",
      "symbol": "NIFTY-Jun2026-25600-PE",
      "strike": 25600,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79840",
      "symbol": "NIFTY-Jun2026-25650-CE",
      "strike": 25650,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79841",
      "symbol": "NIFTY-Jun2026-25650-PE",
      "strike": 25650,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79842",
      "symbol": "NIFTY-Jun2026-25700-CE",
      "strike": 25700,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79843",
      "symbol": "NIFTY-Jun2026-25700-PE",
      "strike": 25700,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79844",
      "symbol": "NIFTY-Jun2026-25750-CE",
      "strike": 25750,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79845",
      "symbol": "NIFTY-Jun2026-25750-PE",
      "strike": 25750,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79846",
      "symbol": "NIFTY-Jun2026-25800-CE",
      "strike": 25800,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79847",
      "symbol": "NIFTY-Jun2026-25800-PE",
      "strike": 25800,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79848",
      "symbol": "NIFTY-Jun2026-25850-CE",
      "strike": 25850,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79849",
      "symbol": "NIFTY-Jun2026-25850-PE",
      "strike": 25850,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79850",
      "symbol": "NIFTY-Jun2026-25900-CE",
      "strike": 25900,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79851",
      "symbol": "NIFTY-Jun2026-25900-PE",
      "strike": 25900,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79852",
      "symbol": "NIFTY-Jun2026-25950-CE",
      "strike": 25950,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79853",
      "symbol": "NIFTY-Jun2026-25950-PE",
      "strike": 25950,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79854",
      "symbol": "NIFTY-Jun2026-26050-CE",
      "strike": 26050,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79855",
      "symbol": "NIFTY-Jun2026-26050-PE",
      "strike": 26050,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79856",
      "symbol": "NIFTY-Jun2026-26100-CE",
      "strike": 26100,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79857",
      "symbol": "NIFTY-Jun2026-26100-PE",
      "strike": 26100,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79858",
      "symbol": "NIFTY-Jun2026-26150-CE",
      "strike": 26150,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79859",
      "symbol": "NIFTY-Jun2026-26150-PE",
      "strike": 26150,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79860",
      "symbol": "NIFTY-Jun2026-26200-CE",
      "strike": 26200,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79861",
      "symbol": "NIFTY-Jun2026-26200-PE",
      "strike": 26200,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79862",
      "symbol": "NIFTY-Jun2026-26250-CE",
      "strike": 26250,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79865",
      "symbol": "NIFTY-Jun2026-26250-PE",
      "strike": 26250,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79866",
      "symbol": "NIFTY-Jun2026-26300-CE",
      "strike": 26300,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79867",
      "symbol": "NIFTY-Jun2026-26300-PE",
      "strike": 26300,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79868",
      "symbol": "NIFTY-Jun2026-26350-CE",
      "strike": 26350,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79936",
      "symbol": "NIFTY-Jun2026-26350-PE",
      "strike": 26350,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79937",
      "symbol": "NIFTY-Jun2026-26400-CE",
      "strike": 26400,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79957",
      "symbol": "NIFTY-Jun2026-26400-PE",
      "strike": 26400,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79958",
      "symbol": "NIFTY-Jun2026-26450-CE",
      "strike": 26450,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80009",
      "symbol": "NIFTY-Jun2026-26450-PE",
      "strike": 26450,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80010",
      "symbol": "NIFTY-Jun2026-26500-CE",
      "strike": 26500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80011",
      "symbol": "NIFTY-Jun2026-26500-PE",
      "strike": 26500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80012",
      "symbol": "NIFTY-Jun2026-26550-CE",
      "strike": 26550,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80013",
      "symbol": "NIFTY-Jun2026-26550-PE",
      "strike": 26550,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80016",
      "symbol": "NIFTY-Jun2026-26600-CE",
      "strike": 26600,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80084",
      "symbol": "NIFTY-Jun2026-26600-PE",
      "strike": 26600,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80085",
      "symbol": "NIFTY-Jun2026-26650-CE",
      "strike": 26650,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80093",
      "symbol": "NIFTY-Jun2026-26650-PE",
      "strike": 26650,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80094",
      "symbol": "NIFTY-Jun2026-26700-CE",
      "strike": 26700,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80095",
      "symbol": "NIFTY-Jun2026-26700-PE",
      "strike": 26700,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80096",
      "symbol": "NIFTY-Jun2026-26750-CE",
      "strike": 26750,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80099",
      "symbol": "NIFTY-Jun2026-26750-PE",
      "strike": 26750,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80100",
      "symbol": "NIFTY-Jun2026-26800-CE",
      "strike": 26800,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80102",
      "symbol": "NIFTY-Jun2026-26800-PE",
      "strike": 26800,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80103",
      "symbol": "NIFTY-Jun2026-26850-CE",
      "strike": 26850,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80108",
      "symbol": "NIFTY-Jun2026-26850-PE",
      "strike": 26850,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80109",
      "symbol": "NIFTY-Jun2026-26900-CE",
      "strike": 26900,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80110",
      "symbol": "NIFTY-Jun2026-26900-PE",
      "strike": 26900,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80111",
      "symbol": "NIFTY-Jun2026-26950-CE",
      "strike": 26950,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80112",
      "symbol": "NIFTY-Jun2026-26950-PE",
      "strike": 26950,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80113",
      "symbol": "NIFTY-Jun2026-27050-CE",
      "strike": 27050,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80114",
      "symbol": "NIFTY-Jun2026-27050-PE",
      "strike": 27050,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80115",
      "symbol": "NIFTY-Jun2026-27100-CE",
      "strike": 27100,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80116",
      "symbol": "NIFTY-Jun2026-27100-PE",
      "strike": 27100,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80118",
      "symbol": "NIFTY-Jun2026-27150-CE",
      "strike": 27150,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80119",
      "symbol": "NIFTY-Jun2026-27150-PE",
      "strike": 27150,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80120",
      "symbol": "NIFTY-Jun2026-27200-CE",
      "strike": 27200,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80121",
      "symbol": "NIFTY-Jun2026-27200-PE",
      "strike": 27200,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80122",
      "symbol": "NIFTY-Jun2026-27250-CE",
      "strike": 27250,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80123",
      "symbol": "NIFTY-Jun2026-27250-PE",
      "strike": 27250,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80124",
      "symbol": "NIFTY-Jun2026-27300-CE",
      "strike": 27300,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80125",
      "symbol": "NIFTY-Jun2026-27300-PE",
      "strike": 27300,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80126",
      "symbol": "NIFTY-Jun2026-27350-CE",
      "strike": 27350,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80127",
      "symbol": "NIFTY-Jun2026-27350-PE",
      "strike": 27350,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80130",
      "symbol": "NIFTY-Jun2026-27400-CE",
      "strike": 27400,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80131",
      "symbol": "NIFTY-Jun2026-27400-PE",
      "strike": 27400,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80134",
      "symbol": "NIFTY-Jun2026-27450-CE",
      "strike": 27450,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80135",
      "symbol": "NIFTY-Jun2026-27450-PE",
      "strike": 27450,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80138",
      "symbol": "NIFTY-Jun2026-27500-CE",
      "strike": 27500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80139",
      "symbol": "NIFTY-Jun2026-27500-PE",
      "strike": 27500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80140",
      "symbol": "NIFTY-Jun2026-27550-CE",
      "strike": 27550,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80141",
      "symbol": "NIFTY-Jun2026-27550-PE",
      "strike": 27550,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80165",
      "symbol": "NIFTY-Jun2026-27600-CE",
      "strike": 27600,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "80166",
      "symbol": "NIFTY-Jun2026-27600-PE",
      "strike": 27600,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "78992",
      "symbol": "NIFTY-Jun2026-17100-CE",
      "strike": 17100,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "78993",
      "symbol": "NIFTY-Jun2026-17100-PE",
      "strike": 17100,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "78996",
      "symbol": "NIFTY-Jun2026-17150-CE",
      "strike": 17150,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79035",
      "symbol": "NIFTY-Jun2026-17150-PE",
      "strike": 17150,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79036",
      "symbol": "NIFTY-Jun2026-17200-CE",
      "strike": 17200,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79039",
      "symbol": "NIFTY-Jun2026-17200-PE",
      "strike": 17200,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79126",
      "symbol": "NIFTY-Jun2026-17250-CE",
      "strike": 17250,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79136",
      "symbol": "NIFTY-Jun2026-17250-PE",
      "strike": 17250,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79137",
      "symbol": "NIFTY-Jun2026-17300-CE",
      "strike": 17300,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79138",
      "symbol": "NIFTY-Jun2026-17300-PE",
      "strike": 17300,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79139",
      "symbol": "NIFTY-Jun2026-17350-CE",
      "strike": 17350,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79140",
      "symbol": "NIFTY-Jun2026-17350-PE",
      "strike": 17350,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79141",
      "symbol": "NIFTY-Jun2026-17400-CE",
      "strike": 17400,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79142",
      "symbol": "NIFTY-Jun2026-17400-PE",
      "strike": 17400,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79143",
      "symbol": "NIFTY-Jun2026-17450-CE",
      "strike": 17450,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79144",
      "symbol": "NIFTY-Jun2026-17450-PE",
      "strike": 17450,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79145",
      "symbol": "NIFTY-Jun2026-17500-CE",
      "strike": 17500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79146",
      "symbol": "NIFTY-Jun2026-17500-PE",
      "strike": 17500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79147",
      "symbol": "NIFTY-Jun2026-17550-CE",
      "strike": 17550,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79148",
      "symbol": "NIFTY-Jun2026-17550-PE",
      "strike": 17550,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79149",
      "symbol": "NIFTY-Jun2026-17600-CE",
      "strike": 17600,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79150",
      "symbol": "NIFTY-Jun2026-17600-PE",
      "strike": 17600,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79151",
      "symbol": "NIFTY-Jun2026-17650-CE",
      "strike": 17650,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79152",
      "symbol": "NIFTY-Jun2026-17650-PE",
      "strike": 17650,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79153",
      "symbol": "NIFTY-Jun2026-17700-CE",
      "strike": 17700,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79154",
      "symbol": "NIFTY-Jun2026-17700-PE",
      "strike": 17700,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79157",
      "symbol": "NIFTY-Jun2026-17750-CE",
      "strike": 17750,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79158",
      "symbol": "NIFTY-Jun2026-17750-PE",
      "strike": 17750,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79159",
      "symbol": "NIFTY-Jun2026-17800-CE",
      "strike": 17800,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79160",
      "symbol": "NIFTY-Jun2026-17800-PE",
      "strike": 17800,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79161",
      "symbol": "NIFTY-Jun2026-17850-CE",
      "strike": 17850,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79162",
      "symbol": "NIFTY-Jun2026-17850-PE",
      "strike": 17850,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79163",
      "symbol": "NIFTY-Jun2026-17900-CE",
      "strike": 17900,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79164",
      "symbol": "NIFTY-Jun2026-17900-PE",
      "strike": 17900,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79165",
      "symbol": "NIFTY-Jun2026-17950-CE",
      "strike": 17950,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79166",
      "symbol": "NIFTY-Jun2026-17950-PE",
      "strike": 17950,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79168",
      "symbol": "NIFTY-Jun2026-18050-CE",
      "strike": 18050,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79169",
      "symbol": "NIFTY-Jun2026-18050-PE",
      "strike": 18050,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79172",
      "symbol": "NIFTY-Jun2026-18100-CE",
      "strike": 18100,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79173",
      "symbol": "NIFTY-Jun2026-18100-PE",
      "strike": 18100,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79174",
      "symbol": "NIFTY-Jun2026-18150-CE",
      "strike": 18150,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79175",
      "symbol": "NIFTY-Jun2026-18150-PE",
      "strike": 18150,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79176",
      "symbol": "NIFTY-Jun2026-18200-CE",
      "strike": 18200,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79177",
      "symbol": "NIFTY-Jun2026-18200-PE",
      "strike": 18200,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79178",
      "symbol": "NIFTY-Jun2026-18250-CE",
      "strike": 18250,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79179",
      "symbol": "NIFTY-Jun2026-18250-PE",
      "strike": 18250,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79180",
      "symbol": "NIFTY-Jun2026-18300-CE",
      "strike": 18300,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79187",
      "symbol": "NIFTY-Jun2026-18300-PE",
      "strike": 18300,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79188",
      "symbol": "NIFTY-Jun2026-18350-CE",
      "strike": 18350,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79189",
      "symbol": "NIFTY-Jun2026-18350-PE",
      "strike": 18350,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79190",
      "symbol": "NIFTY-Jun2026-18400-CE",
      "strike": 18400,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79191",
      "symbol": "NIFTY-Jun2026-18400-PE",
      "strike": 18400,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79192",
      "symbol": "NIFTY-Jun2026-18450-CE",
      "strike": 18450,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79193",
      "symbol": "NIFTY-Jun2026-18450-PE",
      "strike": 18450,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79194",
      "symbol": "NIFTY-Jun2026-18500-CE",
      "strike": 18500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79195",
      "symbol": "NIFTY-Jun2026-18500-PE",
      "strike": 18500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79196",
      "symbol": "NIFTY-Jun2026-18550-CE",
      "strike": 18550,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79197",
      "symbol": "NIFTY-Jun2026-18550-PE",
      "strike": 18550,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79198",
      "symbol": "NIFTY-Jun2026-18600-CE",
      "strike": 18600,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79199",
      "symbol": "NIFTY-Jun2026-18600-PE",
      "strike": 18600,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79200",
      "symbol": "NIFTY-Jun2026-18650-CE",
      "strike": 18650,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79201",
      "symbol": "NIFTY-Jun2026-18650-PE",
      "strike": 18650,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79202",
      "symbol": "NIFTY-Jun2026-18700-CE",
      "strike": 18700,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79203",
      "symbol": "NIFTY-Jun2026-18700-PE",
      "strike": 18700,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79204",
      "symbol": "NIFTY-Jun2026-18750-CE",
      "strike": 18750,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79205",
      "symbol": "NIFTY-Jun2026-18750-PE",
      "strike": 18750,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79206",
      "symbol": "NIFTY-Jun2026-18800-CE",
      "strike": 18800,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79207",
      "symbol": "NIFTY-Jun2026-18800-PE",
      "strike": 18800,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79208",
      "symbol": "NIFTY-Jun2026-18850-CE",
      "strike": 18850,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79209",
      "symbol": "NIFTY-Jun2026-18850-PE",
      "strike": 18850,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79210",
      "symbol": "NIFTY-Jun2026-18900-CE",
      "strike": 18900,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79211",
      "symbol": "NIFTY-Jun2026-18900-PE",
      "strike": 18900,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79212",
      "symbol": "NIFTY-Jun2026-18950-CE",
      "strike": 18950,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79213",
      "symbol": "NIFTY-Jun2026-18950-PE",
      "strike": 18950,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79214",
      "symbol": "NIFTY-Jun2026-19050-CE",
      "strike": 19050,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79217",
      "symbol": "NIFTY-Jun2026-19050-PE",
      "strike": 19050,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79218",
      "symbol": "NIFTY-Jun2026-19100-CE",
      "strike": 19100,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79219",
      "symbol": "NIFTY-Jun2026-19100-PE",
      "strike": 19100,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79220",
      "symbol": "NIFTY-Jun2026-19150-CE",
      "strike": 19150,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79221",
      "symbol": "NIFTY-Jun2026-19150-PE",
      "strike": 19150,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79222",
      "symbol": "NIFTY-Jun2026-19200-CE",
      "strike": 19200,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79223",
      "symbol": "NIFTY-Jun2026-19200-PE",
      "strike": 19200,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79224",
      "symbol": "NIFTY-Jun2026-19250-CE",
      "strike": 19250,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79225",
      "symbol": "NIFTY-Jun2026-19250-PE",
      "strike": 19250,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79226",
      "symbol": "NIFTY-Jun2026-19300-CE",
      "strike": 19300,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79227",
      "symbol": "NIFTY-Jun2026-19300-PE",
      "strike": 19300,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79228",
      "symbol": "NIFTY-Jun2026-19350-CE",
      "strike": 19350,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79229",
      "symbol": "NIFTY-Jun2026-19350-PE",
      "strike": 19350,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79230",
      "symbol": "NIFTY-Jun2026-19400-CE",
      "strike": 19400,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79231",
      "symbol": "NIFTY-Jun2026-19400-PE",
      "strike": 19400,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79232",
      "symbol": "NIFTY-Jun2026-19450-CE",
      "strike": 19450,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79233",
      "symbol": "NIFTY-Jun2026-19450-PE",
      "strike": 19450,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79234",
      "symbol": "NIFTY-Jun2026-19550-CE",
      "strike": 19550,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79235",
      "symbol": "NIFTY-Jun2026-19550-PE",
      "strike": 19550,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79236",
      "symbol": "NIFTY-Jun2026-19600-CE",
      "strike": 19600,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79237",
      "symbol": "NIFTY-Jun2026-19600-PE",
      "strike": 19600,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79238",
      "symbol": "NIFTY-Jun2026-19650-CE",
      "strike": 19650,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79243",
      "symbol": "NIFTY-Jun2026-19650-PE",
      "strike": 19650,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79244",
      "symbol": "NIFTY-Jun2026-19700-CE",
      "strike": 19700,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79245",
      "symbol": "NIFTY-Jun2026-19700-PE",
      "strike": 19700,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79246",
      "symbol": "NIFTY-Jun2026-19750-CE",
      "strike": 19750,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79247",
      "symbol": "NIFTY-Jun2026-19750-PE",
      "strike": 19750,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79248",
      "symbol": "NIFTY-Jun2026-19800-CE",
      "strike": 19800,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79249",
      "symbol": "NIFTY-Jun2026-19800-PE",
      "strike": 19800,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79250",
      "symbol": "NIFTY-Jun2026-19850-CE",
      "strike": 19850,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79251",
      "symbol": "NIFTY-Jun2026-19850-PE",
      "strike": 19850,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79252",
      "symbol": "NIFTY-Jun2026-19900-CE",
      "strike": 19900,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79253",
      "symbol": "NIFTY-Jun2026-19900-PE",
      "strike": 19900,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79254",
      "symbol": "NIFTY-Jun2026-19950-CE",
      "strike": 19950,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79256",
      "symbol": "NIFTY-Jun2026-19950-PE",
      "strike": 19950,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79257",
      "symbol": "NIFTY-Jun2026-20000-CE",
      "strike": 20000,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79258",
      "symbol": "NIFTY-Jun2026-20050-CE",
      "strike": 20050,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79259",
      "symbol": "NIFTY-Jun2026-20050-PE",
      "strike": 20050,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79264",
      "symbol": "NIFTY-Jun2026-20100-CE",
      "strike": 20100,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79265",
      "symbol": "NIFTY-Jun2026-20100-PE",
      "strike": 20100,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79373",
      "symbol": "NIFTY-Jun2026-20150-CE",
      "strike": 20150,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79374",
      "symbol": "NIFTY-Jun2026-20150-PE",
      "strike": 20150,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79375",
      "symbol": "NIFTY-Jun2026-20200-CE",
      "strike": 20200,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79376",
      "symbol": "NIFTY-Jun2026-20200-PE",
      "strike": 20200,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79377",
      "symbol": "NIFTY-Jun2026-20250-CE",
      "strike": 20250,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79378",
      "symbol": "NIFTY-Jun2026-20250-PE",
      "strike": 20250,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79379",
      "symbol": "NIFTY-Jun2026-20300-CE",
      "strike": 20300,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79380",
      "symbol": "NIFTY-Jun2026-20300-PE",
      "strike": 20300,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79381",
      "symbol": "NIFTY-Jun2026-20350-CE",
      "strike": 20350,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79382",
      "symbol": "NIFTY-Jun2026-20350-PE",
      "strike": 20350,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79383",
      "symbol": "NIFTY-Jun2026-20400-CE",
      "strike": 20400,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79384",
      "symbol": "NIFTY-Jun2026-20400-PE",
      "strike": 20400,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79385",
      "symbol": "NIFTY-Jun2026-20450-CE",
      "strike": 20450,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79386",
      "symbol": "NIFTY-Jun2026-20450-PE",
      "strike": 20450,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79387",
      "symbol": "NIFTY-Jun2026-20500-CE",
      "strike": 20500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79388",
      "symbol": "NIFTY-Jun2026-20500-PE",
      "strike": 20500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79397",
      "symbol": "NIFTY-Jun2026-20550-CE",
      "strike": 20550,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79398",
      "symbol": "NIFTY-Jun2026-20550-PE",
      "strike": 20550,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79404",
      "symbol": "NIFTY-Jun2026-20600-CE",
      "strike": 20600,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79405",
      "symbol": "NIFTY-Jun2026-20600-PE",
      "strike": 20600,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79406",
      "symbol": "NIFTY-Jun2026-20650-CE",
      "strike": 20650,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79407",
      "symbol": "NIFTY-Jun2026-20650-PE",
      "strike": 20650,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79413",
      "symbol": "NIFTY-Jun2026-20700-CE",
      "strike": 20700,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79414",
      "symbol": "NIFTY-Jun2026-20700-PE",
      "strike": 20700,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79417",
      "symbol": "NIFTY-Jun2026-20750-CE",
      "strike": 20750,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79424",
      "symbol": "NIFTY-Jun2026-20750-PE",
      "strike": 20750,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79425",
      "symbol": "NIFTY-Jun2026-20800-CE",
      "strike": 20800,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79442",
      "symbol": "NIFTY-Jun2026-20800-PE",
      "strike": 20800,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79444",
      "symbol": "NIFTY-Jun2026-20850-CE",
      "strike": 20850,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79445",
      "symbol": "NIFTY-Jun2026-20850-PE",
      "strike": 20850,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79446",
      "symbol": "NIFTY-Jun2026-20900-CE",
      "strike": 20900,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79449",
      "symbol": "NIFTY-Jun2026-20900-PE",
      "strike": 20900,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79450",
      "symbol": "NIFTY-Jun2026-20950-CE",
      "strike": 20950,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79451",
      "symbol": "NIFTY-Jun2026-20950-PE",
      "strike": 20950,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79452",
      "symbol": "NIFTY-Jun2026-21050-CE",
      "strike": 21050,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79453",
      "symbol": "NIFTY-Jun2026-21050-PE",
      "strike": 21050,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79454",
      "symbol": "NIFTY-Jun2026-21100-CE",
      "strike": 21100,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79455",
      "symbol": "NIFTY-Jun2026-21100-PE",
      "strike": 21100,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79456",
      "symbol": "NIFTY-Jun2026-21150-CE",
      "strike": 21150,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79459",
      "symbol": "NIFTY-Jun2026-21150-PE",
      "strike": 21150,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79460",
      "symbol": "NIFTY-Jun2026-21200-CE",
      "strike": 21200,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79461",
      "symbol": "NIFTY-Jun2026-21200-PE",
      "strike": 21200,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79462",
      "symbol": "NIFTY-Jun2026-21250-CE",
      "strike": 21250,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79463",
      "symbol": "NIFTY-Jun2026-21250-PE",
      "strike": 21250,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79464",
      "symbol": "NIFTY-Jun2026-21300-CE",
      "strike": 21300,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79465",
      "symbol": "NIFTY-Jun2026-21300-PE",
      "strike": 21300,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79466",
      "symbol": "NIFTY-Jun2026-21350-CE",
      "strike": 21350,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79467",
      "symbol": "NIFTY-Jun2026-21350-PE",
      "strike": 21350,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79468",
      "symbol": "NIFTY-Jun2026-21400-CE",
      "strike": 21400,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79469",
      "symbol": "NIFTY-Jun2026-21400-PE",
      "strike": 21400,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79470",
      "symbol": "NIFTY-Jun2026-21450-CE",
      "strike": 21450,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79471",
      "symbol": "NIFTY-Jun2026-21450-PE",
      "strike": 21450,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79472",
      "symbol": "NIFTY-Jun2026-21500-CE",
      "strike": 21500,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79473",
      "symbol": "NIFTY-Jun2026-21500-PE",
      "strike": 21500,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79474",
      "symbol": "NIFTY-Jun2026-21550-CE",
      "strike": 21550,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79475",
      "symbol": "NIFTY-Jun2026-21550-PE",
      "strike": 21550,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79476",
      "symbol": "NIFTY-Jun2026-21600-CE",
      "strike": 21600,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79477",
      "symbol": "NIFTY-Jun2026-21600-PE",
      "strike": 21600,
      "type": "PE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79478",
      "symbol": "NIFTY-Jun2026-21650-CE",
      "strike": 21650,
      "type": "CE",
      "expiry": "2026-06-30"
    },
    {
      "security_id": "79479",
      "symbol": "NIFTY-Jun2026-21650-PE",
      "strike": 21650,
      "type": "PE",
      "expiry": "2026-06-30"
    }
  ],
  "2026-12-29": [
    {
      "security_id": "35235",
      "symbol": "NIFTY-Dec2026-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "35237",
      "symbol": "NIFTY-Dec2026-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "50547",
      "symbol": "NIFTY-Dec2026-28000-CE",
      "strike": 28000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "50548",
      "symbol": "NIFTY-Dec2026-28000-PE",
      "strike": 28000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "37806",
      "symbol": "NIFTY-Dec2026-23000-CE",
      "strike": 23000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "37810",
      "symbol": "NIFTY-Dec2026-23000-PE",
      "strike": 23000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "50978",
      "symbol": "NIFTY-Dec2026-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "50979",
      "symbol": "NIFTY-Dec2026-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "38158",
      "symbol": "NIFTY-Dec2026-29000-CE",
      "strike": 29000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "38159",
      "symbol": "NIFTY-Dec2026-29000-PE",
      "strike": 29000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "47190",
      "symbol": "NIFTY-Dec2026-33000-CE",
      "strike": 33000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "47191",
      "symbol": "NIFTY-Dec2026-33000-PE",
      "strike": 33000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "42136",
      "symbol": "NIFTY-Dec2026-31000-CE",
      "strike": 31000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "45924",
      "symbol": "NIFTY-Dec2026-36000-CE",
      "strike": 36000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "45925",
      "symbol": "NIFTY-Dec2026-36000-PE",
      "strike": 36000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "59064",
      "symbol": "NIFTY-Dec2026-39000-CE",
      "strike": 39000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "59065",
      "symbol": "NIFTY-Dec2026-39000-PE",
      "strike": 39000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58628",
      "symbol": "NIFTY-Dec2026-12000-CE",
      "strike": 12000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58629",
      "symbol": "NIFTY-Dec2026-12000-PE",
      "strike": 12000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58631",
      "symbol": "NIFTY-Dec2026-13000-PE",
      "strike": 13000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58633",
      "symbol": "NIFTY-Dec2026-14000-PE",
      "strike": 14000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58634",
      "symbol": "NIFTY-Dec2026-15000-CE",
      "strike": 15000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58635",
      "symbol": "NIFTY-Dec2026-15000-PE",
      "strike": 15000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58636",
      "symbol": "NIFTY-Dec2026-16000-CE",
      "strike": 16000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58637",
      "symbol": "NIFTY-Dec2026-16000-PE",
      "strike": 16000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58639",
      "symbol": "NIFTY-Dec2026-17000-PE",
      "strike": 17000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58640",
      "symbol": "NIFTY-Dec2026-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58641",
      "symbol": "NIFTY-Dec2026-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58642",
      "symbol": "NIFTY-Dec2026-19000-CE",
      "strike": 19000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58643",
      "symbol": "NIFTY-Dec2026-19000-PE",
      "strike": 19000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58644",
      "symbol": "NIFTY-Dec2026-20000-CE",
      "strike": 20000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58645",
      "symbol": "NIFTY-Dec2026-20000-PE",
      "strike": 20000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58646",
      "symbol": "NIFTY-Dec2026-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58647",
      "symbol": "NIFTY-Dec2026-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58648",
      "symbol": "NIFTY-Dec2026-22000-CE",
      "strike": 22000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "58649",
      "symbol": "NIFTY-Dec2026-22000-PE",
      "strike": 22000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "71501",
      "symbol": "NIFTY-Dec2026-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "71502",
      "symbol": "NIFTY-Dec2026-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "71503",
      "symbol": "NIFTY-Dec2026-25000-CE",
      "strike": 25000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "71504",
      "symbol": "NIFTY-Dec2026-25000-PE",
      "strike": 25000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "71505",
      "symbol": "NIFTY-Dec2026-26000-CE",
      "strike": 26000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "71506",
      "symbol": "NIFTY-Dec2026-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "39630",
      "symbol": "NIFTY-Dec2026-9000-CE",
      "strike": 9000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "39631",
      "symbol": "NIFTY-Dec2026-9000-PE",
      "strike": 9000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55308",
      "symbol": "NIFTY-Dec2026-3000-CE",
      "strike": 3000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55309",
      "symbol": "NIFTY-Dec2026-3000-PE",
      "strike": 3000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55312",
      "symbol": "NIFTY-Dec2026-4500-CE",
      "strike": 4500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55313",
      "symbol": "NIFTY-Dec2026-4500-PE",
      "strike": 4500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55314",
      "symbol": "NIFTY-Dec2026-6000-CE",
      "strike": 6000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55315",
      "symbol": "NIFTY-Dec2026-6000-PE",
      "strike": 6000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55316",
      "symbol": "NIFTY-Dec2026-7500-CE",
      "strike": 7500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55317",
      "symbol": "NIFTY-Dec2026-7500-PE",
      "strike": 7500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55318",
      "symbol": "NIFTY-Dec2026-10500-CE",
      "strike": 10500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55319",
      "symbol": "NIFTY-Dec2026-10500-PE",
      "strike": 10500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55320",
      "symbol": "NIFTY-Dec2026-13500-CE",
      "strike": 13500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55321",
      "symbol": "NIFTY-Dec2026-13500-PE",
      "strike": 13500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55322",
      "symbol": "NIFTY-Dec2026-16500-CE",
      "strike": 16500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55323",
      "symbol": "NIFTY-Dec2026-16500-PE",
      "strike": 16500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55324",
      "symbol": "NIFTY-Dec2026-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55325",
      "symbol": "NIFTY-Dec2026-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55326",
      "symbol": "NIFTY-Dec2026-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55327",
      "symbol": "NIFTY-Dec2026-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55328",
      "symbol": "NIFTY-Dec2026-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55329",
      "symbol": "NIFTY-Dec2026-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55330",
      "symbol": "NIFTY-Dec2026-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55331",
      "symbol": "NIFTY-Dec2026-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55332",
      "symbol": "NIFTY-Dec2026-31500-CE",
      "strike": 31500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55333",
      "symbol": "NIFTY-Dec2026-31500-PE",
      "strike": 31500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55336",
      "symbol": "NIFTY-Dec2026-34500-CE",
      "strike": 34500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55337",
      "symbol": "NIFTY-Dec2026-34500-PE",
      "strike": 34500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55338",
      "symbol": "NIFTY-Dec2026-37500-CE",
      "strike": 37500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55339",
      "symbol": "NIFTY-Dec2026-37500-PE",
      "strike": 37500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55340",
      "symbol": "NIFTY-Dec2026-40500-CE",
      "strike": 40500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55341",
      "symbol": "NIFTY-Dec2026-40500-PE",
      "strike": 40500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55342",
      "symbol": "NIFTY-Dec2026-42000-CE",
      "strike": 42000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55343",
      "symbol": "NIFTY-Dec2026-42000-PE",
      "strike": 42000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55344",
      "symbol": "NIFTY-Dec2026-43500-CE",
      "strike": 43500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55345",
      "symbol": "NIFTY-Dec2026-43500-PE",
      "strike": 43500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55346",
      "symbol": "NIFTY-Dec2026-45000-CE",
      "strike": 45000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55349",
      "symbol": "NIFTY-Dec2026-45000-PE",
      "strike": 45000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55350",
      "symbol": "NIFTY-Dec2026-46500-CE",
      "strike": 46500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55351",
      "symbol": "NIFTY-Dec2026-46500-PE",
      "strike": 46500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55352",
      "symbol": "NIFTY-Dec2026-48000-CE",
      "strike": 48000,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "55353",
      "symbol": "NIFTY-Dec2026-48000-PE",
      "strike": 48000,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "38711",
      "symbol": "NIFTY-Dec2026-49500-CE",
      "strike": 49500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "38712",
      "symbol": "NIFTY-Dec2026-49500-PE",
      "strike": 49500,
      "type": "PE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "43872",
      "symbol": "NIFTY-Dec2026-1500-CE",
      "strike": 1500,
      "type": "CE",
      "expiry": "2026-12-29"
    },
    {
      "security_id": "43873",
      "symbol": "NIFTY-Dec2026-1500-PE",
      "strike": 1500,
      "type": "PE",
      "expiry": "2026-12-29"
    }
  ],
  "2027-06-29": [
    {
      "security_id": "35262",
      "symbol": "NIFTY-Jun2027-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "35263",
      "symbol": "NIFTY-Jun2027-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "50981",
      "symbol": "NIFTY-Jun2027-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "50984",
      "symbol": "NIFTY-Jun2027-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "47192",
      "symbol": "NIFTY-Jun2027-33000-CE",
      "strike": 33000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "47193",
      "symbol": "NIFTY-Jun2027-33000-PE",
      "strike": 33000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "45948",
      "symbol": "NIFTY-Jun2027-36000-CE",
      "strike": 36000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "45949",
      "symbol": "NIFTY-Jun2027-36000-PE",
      "strike": 36000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "59066",
      "symbol": "NIFTY-Jun2027-39000-CE",
      "strike": 39000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "59067",
      "symbol": "NIFTY-Jun2027-39000-PE",
      "strike": 39000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "71519",
      "symbol": "NIFTY-Jun2027-12000-CE",
      "strike": 12000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "71520",
      "symbol": "NIFTY-Jun2027-12000-PE",
      "strike": 12000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "71540",
      "symbol": "NIFTY-Jun2027-15000-CE",
      "strike": 15000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "71541",
      "symbol": "NIFTY-Jun2027-15000-PE",
      "strike": 15000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "71547",
      "symbol": "NIFTY-Jun2027-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "71548",
      "symbol": "NIFTY-Jun2027-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "71549",
      "symbol": "NIFTY-Jun2027-19000-CE",
      "strike": 19000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "71550",
      "symbol": "NIFTY-Jun2027-19000-PE",
      "strike": 19000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "71553",
      "symbol": "NIFTY-Jun2027-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "71554",
      "symbol": "NIFTY-Jun2027-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "71560",
      "symbol": "NIFTY-Jun2027-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "71561",
      "symbol": "NIFTY-Jun2027-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "39632",
      "symbol": "NIFTY-Jun2027-9000-CE",
      "strike": 9000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "39633",
      "symbol": "NIFTY-Jun2027-9000-PE",
      "strike": 9000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55354",
      "symbol": "NIFTY-Jun2027-3000-CE",
      "strike": 3000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55355",
      "symbol": "NIFTY-Jun2027-3000-PE",
      "strike": 3000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55356",
      "symbol": "NIFTY-Jun2027-4500-CE",
      "strike": 4500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55357",
      "symbol": "NIFTY-Jun2027-4500-PE",
      "strike": 4500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55360",
      "symbol": "NIFTY-Jun2027-6000-CE",
      "strike": 6000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55361",
      "symbol": "NIFTY-Jun2027-6000-PE",
      "strike": 6000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55362",
      "symbol": "NIFTY-Jun2027-7500-CE",
      "strike": 7500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55363",
      "symbol": "NIFTY-Jun2027-7500-PE",
      "strike": 7500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55364",
      "symbol": "NIFTY-Jun2027-10500-CE",
      "strike": 10500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55365",
      "symbol": "NIFTY-Jun2027-10500-PE",
      "strike": 10500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55366",
      "symbol": "NIFTY-Jun2027-13500-CE",
      "strike": 13500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55367",
      "symbol": "NIFTY-Jun2027-13500-PE",
      "strike": 13500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55368",
      "symbol": "NIFTY-Jun2027-16500-CE",
      "strike": 16500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55371",
      "symbol": "NIFTY-Jun2027-16500-PE",
      "strike": 16500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55372",
      "symbol": "NIFTY-Jun2027-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55373",
      "symbol": "NIFTY-Jun2027-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55374",
      "symbol": "NIFTY-Jun2027-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55375",
      "symbol": "NIFTY-Jun2027-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55376",
      "symbol": "NIFTY-Jun2027-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55377",
      "symbol": "NIFTY-Jun2027-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55378",
      "symbol": "NIFTY-Jun2027-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55379",
      "symbol": "NIFTY-Jun2027-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55380",
      "symbol": "NIFTY-Jun2027-31500-CE",
      "strike": 31500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55381",
      "symbol": "NIFTY-Jun2027-31500-PE",
      "strike": 31500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55384",
      "symbol": "NIFTY-Jun2027-34500-CE",
      "strike": 34500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55385",
      "symbol": "NIFTY-Jun2027-34500-PE",
      "strike": 34500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55392",
      "symbol": "NIFTY-Jun2027-37500-CE",
      "strike": 37500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55393",
      "symbol": "NIFTY-Jun2027-37500-PE",
      "strike": 37500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55394",
      "symbol": "NIFTY-Jun2027-40500-CE",
      "strike": 40500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55395",
      "symbol": "NIFTY-Jun2027-40500-PE",
      "strike": 40500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55396",
      "symbol": "NIFTY-Jun2027-42000-CE",
      "strike": 42000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55397",
      "symbol": "NIFTY-Jun2027-42000-PE",
      "strike": 42000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55398",
      "symbol": "NIFTY-Jun2027-43500-CE",
      "strike": 43500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55399",
      "symbol": "NIFTY-Jun2027-43500-PE",
      "strike": 43500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55400",
      "symbol": "NIFTY-Jun2027-45000-CE",
      "strike": 45000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55401",
      "symbol": "NIFTY-Jun2027-45000-PE",
      "strike": 45000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55402",
      "symbol": "NIFTY-Jun2027-46500-CE",
      "strike": 46500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55403",
      "symbol": "NIFTY-Jun2027-46500-PE",
      "strike": 46500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55404",
      "symbol": "NIFTY-Jun2027-48000-CE",
      "strike": 48000,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "55405",
      "symbol": "NIFTY-Jun2027-48000-PE",
      "strike": 48000,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "38713",
      "symbol": "NIFTY-Jun2027-49500-CE",
      "strike": 49500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "38714",
      "symbol": "NIFTY-Jun2027-49500-PE",
      "strike": 49500,
      "type": "PE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "43874",
      "symbol": "NIFTY-Jun2027-1500-CE",
      "strike": 1500,
      "type": "CE",
      "expiry": "2027-06-29"
    },
    {
      "security_id": "43875",
      "symbol": "NIFTY-Jun2027-1500-PE",
      "strike": 1500,
      "type": "PE",
      "expiry": "2027-06-29"
    }
  ],
  "2027-12-28": [
    {
      "security_id": "35346",
      "symbol": "NIFTY-Dec2027-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "35347",
      "symbol": "NIFTY-Dec2027-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "47194",
      "symbol": "NIFTY-Dec2027-33000-CE",
      "strike": 33000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "47195",
      "symbol": "NIFTY-Dec2027-33000-PE",
      "strike": 33000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "45972",
      "symbol": "NIFTY-Dec2027-36000-CE",
      "strike": 36000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "45973",
      "symbol": "NIFTY-Dec2027-36000-PE",
      "strike": 36000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53583",
      "symbol": "NIFTY-Dec2027-12000-CE",
      "strike": 12000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53585",
      "symbol": "NIFTY-Dec2027-12000-PE",
      "strike": 12000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53591",
      "symbol": "NIFTY-Dec2027-15000-CE",
      "strike": 15000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53595",
      "symbol": "NIFTY-Dec2027-15000-PE",
      "strike": 15000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53602",
      "symbol": "NIFTY-Dec2027-17000-PE",
      "strike": 17000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53603",
      "symbol": "NIFTY-Dec2027-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53604",
      "symbol": "NIFTY-Dec2027-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53606",
      "symbol": "NIFTY-Dec2027-19000-PE",
      "strike": 19000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53611",
      "symbol": "NIFTY-Dec2027-20000-PE",
      "strike": 20000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53613",
      "symbol": "NIFTY-Dec2027-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53615",
      "symbol": "NIFTY-Dec2027-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53617",
      "symbol": "NIFTY-Dec2027-22000-PE",
      "strike": 22000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53619",
      "symbol": "NIFTY-Dec2027-23000-PE",
      "strike": 23000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53624",
      "symbol": "NIFTY-Dec2027-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53625",
      "symbol": "NIFTY-Dec2027-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53626",
      "symbol": "NIFTY-Dec2027-25000-CE",
      "strike": 25000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53627",
      "symbol": "NIFTY-Dec2027-25000-PE",
      "strike": 25000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53628",
      "symbol": "NIFTY-Dec2027-26000-CE",
      "strike": 26000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53630",
      "symbol": "NIFTY-Dec2027-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53631",
      "symbol": "NIFTY-Dec2027-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "53632",
      "symbol": "NIFTY-Dec2027-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "59068",
      "symbol": "NIFTY-Dec2027-39000-CE",
      "strike": 39000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "59069",
      "symbol": "NIFTY-Dec2027-39000-PE",
      "strike": 39000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "39634",
      "symbol": "NIFTY-Dec2027-9000-CE",
      "strike": 9000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "39635",
      "symbol": "NIFTY-Dec2027-9000-PE",
      "strike": 9000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55406",
      "symbol": "NIFTY-Dec2027-3000-CE",
      "strike": 3000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55407",
      "symbol": "NIFTY-Dec2027-3000-PE",
      "strike": 3000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55408",
      "symbol": "NIFTY-Dec2027-4500-CE",
      "strike": 4500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55409",
      "symbol": "NIFTY-Dec2027-4500-PE",
      "strike": 4500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55410",
      "symbol": "NIFTY-Dec2027-6000-CE",
      "strike": 6000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55411",
      "symbol": "NIFTY-Dec2027-6000-PE",
      "strike": 6000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55412",
      "symbol": "NIFTY-Dec2027-7500-CE",
      "strike": 7500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55413",
      "symbol": "NIFTY-Dec2027-7500-PE",
      "strike": 7500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55414",
      "symbol": "NIFTY-Dec2027-10500-CE",
      "strike": 10500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55415",
      "symbol": "NIFTY-Dec2027-10500-PE",
      "strike": 10500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55416",
      "symbol": "NIFTY-Dec2027-13500-CE",
      "strike": 13500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55417",
      "symbol": "NIFTY-Dec2027-13500-PE",
      "strike": 13500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55418",
      "symbol": "NIFTY-Dec2027-16500-CE",
      "strike": 16500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55421",
      "symbol": "NIFTY-Dec2027-16500-PE",
      "strike": 16500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55422",
      "symbol": "NIFTY-Dec2027-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55423",
      "symbol": "NIFTY-Dec2027-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55424",
      "symbol": "NIFTY-Dec2027-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55425",
      "symbol": "NIFTY-Dec2027-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55426",
      "symbol": "NIFTY-Dec2027-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55427",
      "symbol": "NIFTY-Dec2027-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55428",
      "symbol": "NIFTY-Dec2027-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55429",
      "symbol": "NIFTY-Dec2027-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55430",
      "symbol": "NIFTY-Dec2027-31500-CE",
      "strike": 31500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55431",
      "symbol": "NIFTY-Dec2027-31500-PE",
      "strike": 31500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55438",
      "symbol": "NIFTY-Dec2027-34500-CE",
      "strike": 34500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55439",
      "symbol": "NIFTY-Dec2027-34500-PE",
      "strike": 34500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55440",
      "symbol": "NIFTY-Dec2027-37500-CE",
      "strike": 37500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55441",
      "symbol": "NIFTY-Dec2027-37500-PE",
      "strike": 37500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55442",
      "symbol": "NIFTY-Dec2027-40500-CE",
      "strike": 40500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55443",
      "symbol": "NIFTY-Dec2027-40500-PE",
      "strike": 40500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55444",
      "symbol": "NIFTY-Dec2027-42000-CE",
      "strike": 42000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55445",
      "symbol": "NIFTY-Dec2027-42000-PE",
      "strike": 42000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55446",
      "symbol": "NIFTY-Dec2027-43500-CE",
      "strike": 43500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55447",
      "symbol": "NIFTY-Dec2027-43500-PE",
      "strike": 43500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55448",
      "symbol": "NIFTY-Dec2027-45000-CE",
      "strike": 45000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55449",
      "symbol": "NIFTY-Dec2027-45000-PE",
      "strike": 45000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55450",
      "symbol": "NIFTY-Dec2027-46500-CE",
      "strike": 46500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55451",
      "symbol": "NIFTY-Dec2027-46500-PE",
      "strike": 46500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55452",
      "symbol": "NIFTY-Dec2027-48000-CE",
      "strike": 48000,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "55453",
      "symbol": "NIFTY-Dec2027-48000-PE",
      "strike": 48000,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "38723",
      "symbol": "NIFTY-Dec2027-49500-CE",
      "strike": 49500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "38724",
      "symbol": "NIFTY-Dec2027-49500-PE",
      "strike": 49500,
      "type": "PE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "43876",
      "symbol": "NIFTY-Dec2027-1500-CE",
      "strike": 1500,
      "type": "CE",
      "expiry": "2027-12-28"
    },
    {
      "security_id": "43877",
      "symbol": "NIFTY-Dec2027-1500-PE",
      "strike": 1500,
      "type": "PE",
      "expiry": "2027-12-28"
    }
  ],
  "2028-06-27": [
    {
      "security_id": "35352",
      "symbol": "NIFTY-Jun2028-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "35353",
      "symbol": "NIFTY-Jun2028-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86127",
      "symbol": "NIFTY-Jun2028-12000-CE",
      "strike": 12000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86128",
      "symbol": "NIFTY-Jun2028-12000-PE",
      "strike": 12000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86133",
      "symbol": "NIFTY-Jun2028-15000-CE",
      "strike": 15000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86134",
      "symbol": "NIFTY-Jun2028-15000-PE",
      "strike": 15000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86139",
      "symbol": "NIFTY-Jun2028-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86140",
      "symbol": "NIFTY-Jun2028-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86145",
      "symbol": "NIFTY-Jun2028-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86146",
      "symbol": "NIFTY-Jun2028-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86148",
      "symbol": "NIFTY-Jun2028-22000-PE",
      "strike": 22000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86151",
      "symbol": "NIFTY-Jun2028-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86152",
      "symbol": "NIFTY-Jun2028-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86163",
      "symbol": "NIFTY-Jun2028-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "86164",
      "symbol": "NIFTY-Jun2028-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "47196",
      "symbol": "NIFTY-Jun2028-33000-CE",
      "strike": 33000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "47197",
      "symbol": "NIFTY-Jun2028-33000-PE",
      "strike": 33000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "45992",
      "symbol": "NIFTY-Jun2028-36000-CE",
      "strike": 36000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "45993",
      "symbol": "NIFTY-Jun2028-36000-PE",
      "strike": 36000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "59070",
      "symbol": "NIFTY-Jun2028-39000-CE",
      "strike": 39000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "59071",
      "symbol": "NIFTY-Jun2028-39000-PE",
      "strike": 39000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "39636",
      "symbol": "NIFTY-Jun2028-9000-CE",
      "strike": 9000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "39637",
      "symbol": "NIFTY-Jun2028-9000-PE",
      "strike": 9000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55454",
      "symbol": "NIFTY-Jun2028-3000-CE",
      "strike": 3000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55456",
      "symbol": "NIFTY-Jun2028-3000-PE",
      "strike": 3000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55457",
      "symbol": "NIFTY-Jun2028-4500-CE",
      "strike": 4500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55458",
      "symbol": "NIFTY-Jun2028-4500-PE",
      "strike": 4500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55459",
      "symbol": "NIFTY-Jun2028-6000-CE",
      "strike": 6000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55460",
      "symbol": "NIFTY-Jun2028-6000-PE",
      "strike": 6000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55462",
      "symbol": "NIFTY-Jun2028-7500-CE",
      "strike": 7500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55463",
      "symbol": "NIFTY-Jun2028-7500-PE",
      "strike": 7500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55464",
      "symbol": "NIFTY-Jun2028-10500-CE",
      "strike": 10500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55465",
      "symbol": "NIFTY-Jun2028-10500-PE",
      "strike": 10500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55466",
      "symbol": "NIFTY-Jun2028-13500-CE",
      "strike": 13500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55467",
      "symbol": "NIFTY-Jun2028-13500-PE",
      "strike": 13500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55468",
      "symbol": "NIFTY-Jun2028-16500-CE",
      "strike": 16500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55469",
      "symbol": "NIFTY-Jun2028-16500-PE",
      "strike": 16500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55470",
      "symbol": "NIFTY-Jun2028-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55471",
      "symbol": "NIFTY-Jun2028-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55472",
      "symbol": "NIFTY-Jun2028-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55475",
      "symbol": "NIFTY-Jun2028-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55476",
      "symbol": "NIFTY-Jun2028-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55477",
      "symbol": "NIFTY-Jun2028-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55478",
      "symbol": "NIFTY-Jun2028-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55479",
      "symbol": "NIFTY-Jun2028-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55480",
      "symbol": "NIFTY-Jun2028-31500-CE",
      "strike": 31500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55481",
      "symbol": "NIFTY-Jun2028-31500-PE",
      "strike": 31500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55482",
      "symbol": "NIFTY-Jun2028-34500-CE",
      "strike": 34500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55483",
      "symbol": "NIFTY-Jun2028-34500-PE",
      "strike": 34500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55484",
      "symbol": "NIFTY-Jun2028-37500-CE",
      "strike": 37500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55485",
      "symbol": "NIFTY-Jun2028-37500-PE",
      "strike": 37500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55486",
      "symbol": "NIFTY-Jun2028-40500-CE",
      "strike": 40500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55487",
      "symbol": "NIFTY-Jun2028-40500-PE",
      "strike": 40500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55488",
      "symbol": "NIFTY-Jun2028-42000-CE",
      "strike": 42000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55489",
      "symbol": "NIFTY-Jun2028-42000-PE",
      "strike": 42000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55490",
      "symbol": "NIFTY-Jun2028-43500-CE",
      "strike": 43500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55491",
      "symbol": "NIFTY-Jun2028-43500-PE",
      "strike": 43500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55492",
      "symbol": "NIFTY-Jun2028-45000-CE",
      "strike": 45000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55493",
      "symbol": "NIFTY-Jun2028-45000-PE",
      "strike": 45000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55494",
      "symbol": "NIFTY-Jun2028-46500-CE",
      "strike": 46500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55497",
      "symbol": "NIFTY-Jun2028-46500-PE",
      "strike": 46500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55500",
      "symbol": "NIFTY-Jun2028-48000-CE",
      "strike": 48000,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "55501",
      "symbol": "NIFTY-Jun2028-48000-PE",
      "strike": 48000,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "38727",
      "symbol": "NIFTY-Jun2028-49500-CE",
      "strike": 49500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "38728",
      "symbol": "NIFTY-Jun2028-49500-PE",
      "strike": 49500,
      "type": "PE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "43880",
      "symbol": "NIFTY-Jun2028-1500-CE",
      "strike": 1500,
      "type": "CE",
      "expiry": "2028-06-27"
    },
    {
      "security_id": "43881",
      "symbol": "NIFTY-Jun2028-1500-PE",
      "strike": 1500,
      "type": "PE",
      "expiry": "2028-06-27"
    }
  ],
  "2029-06-26": [
    {
      "security_id": "89589",
      "symbol": "NIFTY-Jun2029-12000-CE",
      "strike": 12000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89601",
      "symbol": "NIFTY-Jun2029-12000-PE",
      "strike": 12000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89606",
      "symbol": "NIFTY-Jun2029-15000-CE",
      "strike": 15000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89607",
      "symbol": "NIFTY-Jun2029-15000-PE",
      "strike": 15000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89612",
      "symbol": "NIFTY-Jun2029-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89613",
      "symbol": "NIFTY-Jun2029-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89624",
      "symbol": "NIFTY-Jun2029-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89625",
      "symbol": "NIFTY-Jun2029-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89630",
      "symbol": "NIFTY-Jun2029-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89631",
      "symbol": "NIFTY-Jun2029-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89635",
      "symbol": "NIFTY-Jun2029-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89636",
      "symbol": "NIFTY-Jun2029-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89637",
      "symbol": "NIFTY-Jun2029-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89642",
      "symbol": "NIFTY-Jun2029-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89643",
      "symbol": "NIFTY-Jun2029-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89648",
      "symbol": "NIFTY-Jun2029-33000-CE",
      "strike": 33000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89649",
      "symbol": "NIFTY-Jun2029-33000-PE",
      "strike": 33000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89654",
      "symbol": "NIFTY-Jun2029-36000-CE",
      "strike": 36000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89655",
      "symbol": "NIFTY-Jun2029-36000-PE",
      "strike": 36000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89664",
      "symbol": "NIFTY-Jun2029-39000-CE",
      "strike": 39000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "89665",
      "symbol": "NIFTY-Jun2029-39000-PE",
      "strike": 39000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "39641",
      "symbol": "NIFTY-Jun2029-9000-CE",
      "strike": 9000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "39646",
      "symbol": "NIFTY-Jun2029-9000-PE",
      "strike": 9000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55544",
      "symbol": "NIFTY-Jun2029-3000-CE",
      "strike": 3000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55545",
      "symbol": "NIFTY-Jun2029-3000-PE",
      "strike": 3000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55546",
      "symbol": "NIFTY-Jun2029-4500-CE",
      "strike": 4500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55547",
      "symbol": "NIFTY-Jun2029-4500-PE",
      "strike": 4500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55548",
      "symbol": "NIFTY-Jun2029-6000-CE",
      "strike": 6000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55549",
      "symbol": "NIFTY-Jun2029-6000-PE",
      "strike": 6000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55550",
      "symbol": "NIFTY-Jun2029-7500-CE",
      "strike": 7500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55551",
      "symbol": "NIFTY-Jun2029-7500-PE",
      "strike": 7500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55552",
      "symbol": "NIFTY-Jun2029-10500-CE",
      "strike": 10500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55553",
      "symbol": "NIFTY-Jun2029-10500-PE",
      "strike": 10500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55554",
      "symbol": "NIFTY-Jun2029-13500-CE",
      "strike": 13500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55555",
      "symbol": "NIFTY-Jun2029-13500-PE",
      "strike": 13500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55556",
      "symbol": "NIFTY-Jun2029-16500-CE",
      "strike": 16500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55557",
      "symbol": "NIFTY-Jun2029-16500-PE",
      "strike": 16500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55558",
      "symbol": "NIFTY-Jun2029-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55559",
      "symbol": "NIFTY-Jun2029-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55560",
      "symbol": "NIFTY-Jun2029-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55561",
      "symbol": "NIFTY-Jun2029-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55562",
      "symbol": "NIFTY-Jun2029-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55563",
      "symbol": "NIFTY-Jun2029-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55564",
      "symbol": "NIFTY-Jun2029-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55565",
      "symbol": "NIFTY-Jun2029-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55566",
      "symbol": "NIFTY-Jun2029-31500-CE",
      "strike": 31500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55567",
      "symbol": "NIFTY-Jun2029-31500-PE",
      "strike": 31500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55568",
      "symbol": "NIFTY-Jun2029-34500-CE",
      "strike": 34500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55569",
      "symbol": "NIFTY-Jun2029-34500-PE",
      "strike": 34500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55570",
      "symbol": "NIFTY-Jun2029-37500-CE",
      "strike": 37500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55571",
      "symbol": "NIFTY-Jun2029-37500-PE",
      "strike": 37500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55572",
      "symbol": "NIFTY-Jun2029-40500-CE",
      "strike": 40500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55573",
      "symbol": "NIFTY-Jun2029-40500-PE",
      "strike": 40500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55574",
      "symbol": "NIFTY-Jun2029-42000-CE",
      "strike": 42000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55575",
      "symbol": "NIFTY-Jun2029-42000-PE",
      "strike": 42000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55576",
      "symbol": "NIFTY-Jun2029-43500-CE",
      "strike": 43500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55577",
      "symbol": "NIFTY-Jun2029-43500-PE",
      "strike": 43500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55578",
      "symbol": "NIFTY-Jun2029-45000-CE",
      "strike": 45000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55579",
      "symbol": "NIFTY-Jun2029-45000-PE",
      "strike": 45000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55580",
      "symbol": "NIFTY-Jun2029-46500-CE",
      "strike": 46500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55581",
      "symbol": "NIFTY-Jun2029-46500-PE",
      "strike": 46500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55582",
      "symbol": "NIFTY-Jun2029-48000-CE",
      "strike": 48000,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "55583",
      "symbol": "NIFTY-Jun2029-48000-PE",
      "strike": 48000,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "38733",
      "symbol": "NIFTY-Jun2029-49500-CE",
      "strike": 49500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "38734",
      "symbol": "NIFTY-Jun2029-49500-PE",
      "strike": 49500,
      "type": "PE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "43884",
      "symbol": "NIFTY-Jun2029-1500-CE",
      "strike": 1500,
      "type": "CE",
      "expiry": "2029-06-26"
    },
    {
      "security_id": "43885",
      "symbol": "NIFTY-Jun2029-1500-PE",
      "strike": 1500,
      "type": "PE",
      "expiry": "2029-06-26"
    }
  ],
  "2028-12-26": [
    {
      "security_id": "47198",
      "symbol": "NIFTY-Dec2028-33000-CE",
      "strike": 33000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "47199",
      "symbol": "NIFTY-Dec2028-33000-PE",
      "strike": 33000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "46020",
      "symbol": "NIFTY-Dec2028-36000-CE",
      "strike": 36000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "46021",
      "symbol": "NIFTY-Dec2028-36000-PE",
      "strike": 36000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "59072",
      "symbol": "NIFTY-Dec2028-39000-CE",
      "strike": 39000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "59073",
      "symbol": "NIFTY-Dec2028-39000-PE",
      "strike": 39000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67754",
      "symbol": "NIFTY-Dec2028-12000-CE",
      "strike": 12000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67755",
      "symbol": "NIFTY-Dec2028-12000-PE",
      "strike": 12000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67764",
      "symbol": "NIFTY-Dec2028-15000-CE",
      "strike": 15000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67765",
      "symbol": "NIFTY-Dec2028-15000-PE",
      "strike": 15000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67770",
      "symbol": "NIFTY-Dec2028-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67771",
      "symbol": "NIFTY-Dec2028-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67775",
      "symbol": "NIFTY-Dec2028-20000-PE",
      "strike": 20000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67776",
      "symbol": "NIFTY-Dec2028-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67777",
      "symbol": "NIFTY-Dec2028-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67779",
      "symbol": "NIFTY-Dec2028-22000-PE",
      "strike": 22000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67781",
      "symbol": "NIFTY-Dec2028-23000-PE",
      "strike": 23000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67782",
      "symbol": "NIFTY-Dec2028-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67783",
      "symbol": "NIFTY-Dec2028-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67785",
      "symbol": "NIFTY-Dec2028-25000-PE",
      "strike": 25000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67787",
      "symbol": "NIFTY-Dec2028-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67788",
      "symbol": "NIFTY-Dec2028-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67789",
      "symbol": "NIFTY-Dec2028-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67790",
      "symbol": "NIFTY-Dec2028-28000-CE",
      "strike": 28000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67794",
      "symbol": "NIFTY-Dec2028-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "67795",
      "symbol": "NIFTY-Dec2028-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "39639",
      "symbol": "NIFTY-Dec2028-9000-CE",
      "strike": 9000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "39640",
      "symbol": "NIFTY-Dec2028-9000-PE",
      "strike": 9000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55504",
      "symbol": "NIFTY-Dec2028-3000-CE",
      "strike": 3000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55505",
      "symbol": "NIFTY-Dec2028-3000-PE",
      "strike": 3000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55506",
      "symbol": "NIFTY-Dec2028-4500-CE",
      "strike": 4500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55507",
      "symbol": "NIFTY-Dec2028-4500-PE",
      "strike": 4500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55508",
      "symbol": "NIFTY-Dec2028-6000-CE",
      "strike": 6000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55509",
      "symbol": "NIFTY-Dec2028-6000-PE",
      "strike": 6000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55510",
      "symbol": "NIFTY-Dec2028-7500-CE",
      "strike": 7500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55511",
      "symbol": "NIFTY-Dec2028-7500-PE",
      "strike": 7500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55512",
      "symbol": "NIFTY-Dec2028-10500-CE",
      "strike": 10500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55513",
      "symbol": "NIFTY-Dec2028-10500-PE",
      "strike": 10500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55514",
      "symbol": "NIFTY-Dec2028-13500-CE",
      "strike": 13500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55515",
      "symbol": "NIFTY-Dec2028-13500-PE",
      "strike": 13500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55516",
      "symbol": "NIFTY-Dec2028-16500-CE",
      "strike": 16500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55517",
      "symbol": "NIFTY-Dec2028-16500-PE",
      "strike": 16500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55518",
      "symbol": "NIFTY-Dec2028-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55519",
      "symbol": "NIFTY-Dec2028-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55520",
      "symbol": "NIFTY-Dec2028-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55521",
      "symbol": "NIFTY-Dec2028-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55522",
      "symbol": "NIFTY-Dec2028-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55523",
      "symbol": "NIFTY-Dec2028-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55524",
      "symbol": "NIFTY-Dec2028-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55525",
      "symbol": "NIFTY-Dec2028-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55526",
      "symbol": "NIFTY-Dec2028-31500-CE",
      "strike": 31500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55527",
      "symbol": "NIFTY-Dec2028-31500-PE",
      "strike": 31500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55528",
      "symbol": "NIFTY-Dec2028-34500-CE",
      "strike": 34500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55529",
      "symbol": "NIFTY-Dec2028-34500-PE",
      "strike": 34500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55530",
      "symbol": "NIFTY-Dec2028-37500-CE",
      "strike": 37500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55531",
      "symbol": "NIFTY-Dec2028-37500-PE",
      "strike": 37500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55532",
      "symbol": "NIFTY-Dec2028-40500-CE",
      "strike": 40500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55533",
      "symbol": "NIFTY-Dec2028-40500-PE",
      "strike": 40500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55534",
      "symbol": "NIFTY-Dec2028-42000-CE",
      "strike": 42000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55535",
      "symbol": "NIFTY-Dec2028-42000-PE",
      "strike": 42000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55536",
      "symbol": "NIFTY-Dec2028-43500-CE",
      "strike": 43500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55537",
      "symbol": "NIFTY-Dec2028-43500-PE",
      "strike": 43500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55538",
      "symbol": "NIFTY-Dec2028-45000-CE",
      "strike": 45000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55539",
      "symbol": "NIFTY-Dec2028-45000-PE",
      "strike": 45000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55540",
      "symbol": "NIFTY-Dec2028-46500-CE",
      "strike": 46500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55541",
      "symbol": "NIFTY-Dec2028-46500-PE",
      "strike": 46500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55542",
      "symbol": "NIFTY-Dec2028-48000-CE",
      "strike": 48000,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "55543",
      "symbol": "NIFTY-Dec2028-48000-PE",
      "strike": 48000,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "38731",
      "symbol": "NIFTY-Dec2028-49500-CE",
      "strike": 49500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "38732",
      "symbol": "NIFTY-Dec2028-49500-PE",
      "strike": 49500,
      "type": "PE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "43882",
      "symbol": "NIFTY-Dec2028-1500-CE",
      "strike": 1500,
      "type": "CE",
      "expiry": "2028-12-26"
    },
    {
      "security_id": "43883",
      "symbol": "NIFTY-Dec2028-1500-PE",
      "strike": 1500,
      "type": "PE",
      "expiry": "2028-12-26"
    }
  ],
  "2029-12-24": [
    {
      "security_id": "61659",
      "symbol": "NIFTY-Dec2029-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61660",
      "symbol": "NIFTY-Dec2029-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61747",
      "symbol": "NIFTY-Dec2029-23000-PE",
      "strike": 23000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61748",
      "symbol": "NIFTY-Dec2029-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61749",
      "symbol": "NIFTY-Dec2029-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61773",
      "symbol": "NIFTY-Dec2029-25000-PE",
      "strike": 25000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61779",
      "symbol": "NIFTY-Dec2029-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61794",
      "symbol": "NIFTY-Dec2029-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61795",
      "symbol": "NIFTY-Dec2029-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61932",
      "symbol": "NIFTY-Dec2029-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61933",
      "symbol": "NIFTY-Dec2029-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "62006",
      "symbol": "NIFTY-Dec2029-33000-CE",
      "strike": 33000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "62007",
      "symbol": "NIFTY-Dec2029-33000-PE",
      "strike": 33000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "62026",
      "symbol": "NIFTY-Dec2029-36000-CE",
      "strike": 36000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "62027",
      "symbol": "NIFTY-Dec2029-36000-PE",
      "strike": 36000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "62046",
      "symbol": "NIFTY-Dec2029-39000-CE",
      "strike": 39000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "62047",
      "symbol": "NIFTY-Dec2029-39000-PE",
      "strike": 39000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61348",
      "symbol": "NIFTY-Dec2029-12000-CE",
      "strike": 12000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61349",
      "symbol": "NIFTY-Dec2029-12000-PE",
      "strike": 12000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61374",
      "symbol": "NIFTY-Dec2029-15000-CE",
      "strike": 15000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61375",
      "symbol": "NIFTY-Dec2029-15000-PE",
      "strike": 15000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61390",
      "symbol": "NIFTY-Dec2029-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "61391",
      "symbol": "NIFTY-Dec2029-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "39647",
      "symbol": "NIFTY-Dec2029-9000-CE",
      "strike": 9000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "39648",
      "symbol": "NIFTY-Dec2029-9000-PE",
      "strike": 9000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55584",
      "symbol": "NIFTY-Dec2029-3000-CE",
      "strike": 3000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55585",
      "symbol": "NIFTY-Dec2029-3000-PE",
      "strike": 3000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55586",
      "symbol": "NIFTY-Dec2029-4500-CE",
      "strike": 4500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55587",
      "symbol": "NIFTY-Dec2029-4500-PE",
      "strike": 4500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55588",
      "symbol": "NIFTY-Dec2029-6000-CE",
      "strike": 6000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55589",
      "symbol": "NIFTY-Dec2029-6000-PE",
      "strike": 6000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55590",
      "symbol": "NIFTY-Dec2029-7500-CE",
      "strike": 7500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55591",
      "symbol": "NIFTY-Dec2029-7500-PE",
      "strike": 7500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55592",
      "symbol": "NIFTY-Dec2029-10500-CE",
      "strike": 10500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55595",
      "symbol": "NIFTY-Dec2029-10500-PE",
      "strike": 10500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55596",
      "symbol": "NIFTY-Dec2029-13500-CE",
      "strike": 13500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55597",
      "symbol": "NIFTY-Dec2029-13500-PE",
      "strike": 13500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55598",
      "symbol": "NIFTY-Dec2029-16500-CE",
      "strike": 16500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55599",
      "symbol": "NIFTY-Dec2029-16500-PE",
      "strike": 16500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55600",
      "symbol": "NIFTY-Dec2029-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55601",
      "symbol": "NIFTY-Dec2029-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55602",
      "symbol": "NIFTY-Dec2029-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55603",
      "symbol": "NIFTY-Dec2029-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55604",
      "symbol": "NIFTY-Dec2029-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55605",
      "symbol": "NIFTY-Dec2029-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55606",
      "symbol": "NIFTY-Dec2029-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55607",
      "symbol": "NIFTY-Dec2029-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55608",
      "symbol": "NIFTY-Dec2029-31500-CE",
      "strike": 31500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55609",
      "symbol": "NIFTY-Dec2029-31500-PE",
      "strike": 31500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55610",
      "symbol": "NIFTY-Dec2029-34500-CE",
      "strike": 34500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55611",
      "symbol": "NIFTY-Dec2029-34500-PE",
      "strike": 34500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55612",
      "symbol": "NIFTY-Dec2029-37500-CE",
      "strike": 37500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55615",
      "symbol": "NIFTY-Dec2029-37500-PE",
      "strike": 37500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55616",
      "symbol": "NIFTY-Dec2029-40500-CE",
      "strike": 40500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55617",
      "symbol": "NIFTY-Dec2029-40500-PE",
      "strike": 40500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55618",
      "symbol": "NIFTY-Dec2029-42000-CE",
      "strike": 42000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55619",
      "symbol": "NIFTY-Dec2029-42000-PE",
      "strike": 42000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55620",
      "symbol": "NIFTY-Dec2029-43500-CE",
      "strike": 43500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55621",
      "symbol": "NIFTY-Dec2029-43500-PE",
      "strike": 43500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55622",
      "symbol": "NIFTY-Dec2029-45000-CE",
      "strike": 45000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55623",
      "symbol": "NIFTY-Dec2029-45000-PE",
      "strike": 45000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55624",
      "symbol": "NIFTY-Dec2029-46500-CE",
      "strike": 46500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55625",
      "symbol": "NIFTY-Dec2029-46500-PE",
      "strike": 46500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55626",
      "symbol": "NIFTY-Dec2029-48000-CE",
      "strike": 48000,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "55627",
      "symbol": "NIFTY-Dec2029-48000-PE",
      "strike": 48000,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "38735",
      "symbol": "NIFTY-Dec2029-49500-CE",
      "strike": 49500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "38736",
      "symbol": "NIFTY-Dec2029-49500-PE",
      "strike": 49500,
      "type": "PE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "43886",
      "symbol": "NIFTY-Dec2029-1500-CE",
      "strike": 1500,
      "type": "CE",
      "expiry": "2029-12-24"
    },
    {
      "security_id": "43889",
      "symbol": "NIFTY-Dec2029-1500-PE",
      "strike": 1500,
      "type": "PE",
      "expiry": "2029-12-24"
    }
  ],
  "2026-09-29": [
    {
      "security_id": "65875",
      "symbol": "NIFTY-Sep2026-12000-CE",
      "strike": 12000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65876",
      "symbol": "NIFTY-Sep2026-12000-PE",
      "strike": 12000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65881",
      "symbol": "NIFTY-Sep2026-15000-CE",
      "strike": 15000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65882",
      "symbol": "NIFTY-Sep2026-15000-PE",
      "strike": 15000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65887",
      "symbol": "NIFTY-Sep2026-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65888",
      "symbol": "NIFTY-Sep2026-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65893",
      "symbol": "NIFTY-Sep2026-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65894",
      "symbol": "NIFTY-Sep2026-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65899",
      "symbol": "NIFTY-Sep2026-23000-PE",
      "strike": 23000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65900",
      "symbol": "NIFTY-Sep2026-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65901",
      "symbol": "NIFTY-Sep2026-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65903",
      "symbol": "NIFTY-Sep2026-25000-PE",
      "strike": 25000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65904",
      "symbol": "NIFTY-Sep2026-26000-CE",
      "strike": 26000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65905",
      "symbol": "NIFTY-Sep2026-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65906",
      "symbol": "NIFTY-Sep2026-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65907",
      "symbol": "NIFTY-Sep2026-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65923",
      "symbol": "NIFTY-Sep2026-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65924",
      "symbol": "NIFTY-Sep2026-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65929",
      "symbol": "NIFTY-Sep2026-33000-CE",
      "strike": 33000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65930",
      "symbol": "NIFTY-Sep2026-33000-PE",
      "strike": 33000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65935",
      "symbol": "NIFTY-Sep2026-36000-CE",
      "strike": 36000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "65936",
      "symbol": "NIFTY-Sep2026-36000-PE",
      "strike": 36000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "66022",
      "symbol": "NIFTY-Sep2026-39000-CE",
      "strike": 39000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "66023",
      "symbol": "NIFTY-Sep2026-39000-PE",
      "strike": 39000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55292",
      "symbol": "NIFTY-Sep2026-34500-CE",
      "strike": 34500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55293",
      "symbol": "NIFTY-Sep2026-34500-PE",
      "strike": 34500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55294",
      "symbol": "NIFTY-Sep2026-37500-CE",
      "strike": 37500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55295",
      "symbol": "NIFTY-Sep2026-37500-PE",
      "strike": 37500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55296",
      "symbol": "NIFTY-Sep2026-40500-CE",
      "strike": 40500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55297",
      "symbol": "NIFTY-Sep2026-40500-PE",
      "strike": 40500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55298",
      "symbol": "NIFTY-Sep2026-42000-CE",
      "strike": 42000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55299",
      "symbol": "NIFTY-Sep2026-42000-PE",
      "strike": 42000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55300",
      "symbol": "NIFTY-Sep2026-43500-CE",
      "strike": 43500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55301",
      "symbol": "NIFTY-Sep2026-43500-PE",
      "strike": 43500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55302",
      "symbol": "NIFTY-Sep2026-45000-CE",
      "strike": 45000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55303",
      "symbol": "NIFTY-Sep2026-45000-PE",
      "strike": 45000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55304",
      "symbol": "NIFTY-Sep2026-46500-CE",
      "strike": 46500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55305",
      "symbol": "NIFTY-Sep2026-46500-PE",
      "strike": 46500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55306",
      "symbol": "NIFTY-Sep2026-48000-CE",
      "strike": 48000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55307",
      "symbol": "NIFTY-Sep2026-48000-PE",
      "strike": 48000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55254",
      "symbol": "NIFTY-Sep2026-3000-CE",
      "strike": 3000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55255",
      "symbol": "NIFTY-Sep2026-3000-PE",
      "strike": 3000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55258",
      "symbol": "NIFTY-Sep2026-4500-CE",
      "strike": 4500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55261",
      "symbol": "NIFTY-Sep2026-4500-PE",
      "strike": 4500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55262",
      "symbol": "NIFTY-Sep2026-6000-CE",
      "strike": 6000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55263",
      "symbol": "NIFTY-Sep2026-6000-PE",
      "strike": 6000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55268",
      "symbol": "NIFTY-Sep2026-7500-CE",
      "strike": 7500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55269",
      "symbol": "NIFTY-Sep2026-7500-PE",
      "strike": 7500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55272",
      "symbol": "NIFTY-Sep2026-9000-CE",
      "strike": 9000,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55273",
      "symbol": "NIFTY-Sep2026-9000-PE",
      "strike": 9000,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55276",
      "symbol": "NIFTY-Sep2026-10500-CE",
      "strike": 10500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55277",
      "symbol": "NIFTY-Sep2026-10500-PE",
      "strike": 10500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55278",
      "symbol": "NIFTY-Sep2026-13500-CE",
      "strike": 13500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55279",
      "symbol": "NIFTY-Sep2026-13500-PE",
      "strike": 13500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55280",
      "symbol": "NIFTY-Sep2026-16500-CE",
      "strike": 16500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55281",
      "symbol": "NIFTY-Sep2026-16500-PE",
      "strike": 16500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55282",
      "symbol": "NIFTY-Sep2026-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55283",
      "symbol": "NIFTY-Sep2026-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55284",
      "symbol": "NIFTY-Sep2026-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55285",
      "symbol": "NIFTY-Sep2026-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55286",
      "symbol": "NIFTY-Sep2026-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55287",
      "symbol": "NIFTY-Sep2026-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55288",
      "symbol": "NIFTY-Sep2026-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55289",
      "symbol": "NIFTY-Sep2026-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55290",
      "symbol": "NIFTY-Sep2026-31500-CE",
      "strike": 31500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "55291",
      "symbol": "NIFTY-Sep2026-31500-PE",
      "strike": 31500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "38709",
      "symbol": "NIFTY-Sep2026-49500-CE",
      "strike": 49500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "38710",
      "symbol": "NIFTY-Sep2026-49500-PE",
      "strike": 49500,
      "type": "PE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "43870",
      "symbol": "NIFTY-Sep2026-1500-CE",
      "strike": 1500,
      "type": "CE",
      "expiry": "2026-09-29"
    },
    {
      "security_id": "43871",
      "symbol": "NIFTY-Sep2026-1500-PE",
      "strike": 1500,
      "type": "PE",
      "expiry": "2026-09-29"
    }
  ],
  "2030-12-31": [
    {
      "security_id": "55672",
      "symbol": "NIFTY-Dec2030-3000-CE",
      "strike": 3000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55673",
      "symbol": "NIFTY-Dec2030-3000-PE",
      "strike": 3000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55674",
      "symbol": "NIFTY-Dec2030-4500-CE",
      "strike": 4500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55675",
      "symbol": "NIFTY-Dec2030-4500-PE",
      "strike": 4500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55676",
      "symbol": "NIFTY-Dec2030-6000-CE",
      "strike": 6000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55677",
      "symbol": "NIFTY-Dec2030-6000-PE",
      "strike": 6000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55678",
      "symbol": "NIFTY-Dec2030-7500-CE",
      "strike": 7500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55679",
      "symbol": "NIFTY-Dec2030-7500-PE",
      "strike": 7500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55680",
      "symbol": "NIFTY-Dec2030-9000-CE",
      "strike": 9000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55681",
      "symbol": "NIFTY-Dec2030-9000-PE",
      "strike": 9000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55682",
      "symbol": "NIFTY-Dec2030-10500-CE",
      "strike": 10500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55683",
      "symbol": "NIFTY-Dec2030-10500-PE",
      "strike": 10500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55684",
      "symbol": "NIFTY-Dec2030-12000-CE",
      "strike": 12000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55685",
      "symbol": "NIFTY-Dec2030-12000-PE",
      "strike": 12000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55690",
      "symbol": "NIFTY-Dec2030-13500-CE",
      "strike": 13500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55691",
      "symbol": "NIFTY-Dec2030-13500-PE",
      "strike": 13500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55694",
      "symbol": "NIFTY-Dec2030-15000-CE",
      "strike": 15000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55695",
      "symbol": "NIFTY-Dec2030-15000-PE",
      "strike": 15000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55696",
      "symbol": "NIFTY-Dec2030-16500-CE",
      "strike": 16500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55697",
      "symbol": "NIFTY-Dec2030-16500-PE",
      "strike": 16500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55698",
      "symbol": "NIFTY-Dec2030-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55699",
      "symbol": "NIFTY-Dec2030-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55700",
      "symbol": "NIFTY-Dec2030-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55701",
      "symbol": "NIFTY-Dec2030-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55702",
      "symbol": "NIFTY-Dec2030-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55703",
      "symbol": "NIFTY-Dec2030-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55704",
      "symbol": "NIFTY-Dec2030-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55705",
      "symbol": "NIFTY-Dec2030-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55754",
      "symbol": "NIFTY-Dec2030-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55755",
      "symbol": "NIFTY-Dec2030-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55756",
      "symbol": "NIFTY-Dec2030-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55757",
      "symbol": "NIFTY-Dec2030-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55758",
      "symbol": "NIFTY-Dec2030-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55759",
      "symbol": "NIFTY-Dec2030-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55760",
      "symbol": "NIFTY-Dec2030-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55761",
      "symbol": "NIFTY-Dec2030-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55762",
      "symbol": "NIFTY-Dec2030-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55763",
      "symbol": "NIFTY-Dec2030-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55764",
      "symbol": "NIFTY-Dec2030-31500-CE",
      "strike": 31500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55765",
      "symbol": "NIFTY-Dec2030-31500-PE",
      "strike": 31500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55766",
      "symbol": "NIFTY-Dec2030-33000-CE",
      "strike": 33000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55767",
      "symbol": "NIFTY-Dec2030-33000-PE",
      "strike": 33000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55770",
      "symbol": "NIFTY-Dec2030-34500-CE",
      "strike": 34500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55771",
      "symbol": "NIFTY-Dec2030-34500-PE",
      "strike": 34500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55772",
      "symbol": "NIFTY-Dec2030-36000-CE",
      "strike": 36000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55773",
      "symbol": "NIFTY-Dec2030-36000-PE",
      "strike": 36000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55774",
      "symbol": "NIFTY-Dec2030-37500-CE",
      "strike": 37500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55775",
      "symbol": "NIFTY-Dec2030-37500-PE",
      "strike": 37500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55776",
      "symbol": "NIFTY-Dec2030-39000-CE",
      "strike": 39000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55777",
      "symbol": "NIFTY-Dec2030-39000-PE",
      "strike": 39000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55778",
      "symbol": "NIFTY-Dec2030-40500-CE",
      "strike": 40500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55779",
      "symbol": "NIFTY-Dec2030-40500-PE",
      "strike": 40500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55780",
      "symbol": "NIFTY-Dec2030-42000-CE",
      "strike": 42000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55781",
      "symbol": "NIFTY-Dec2030-42000-PE",
      "strike": 42000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55782",
      "symbol": "NIFTY-Dec2030-43500-CE",
      "strike": 43500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55783",
      "symbol": "NIFTY-Dec2030-43500-PE",
      "strike": 43500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55784",
      "symbol": "NIFTY-Dec2030-45000-CE",
      "strike": 45000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55785",
      "symbol": "NIFTY-Dec2030-45000-PE",
      "strike": 45000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55786",
      "symbol": "NIFTY-Dec2030-46500-CE",
      "strike": 46500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55787",
      "symbol": "NIFTY-Dec2030-46500-PE",
      "strike": 46500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55882",
      "symbol": "NIFTY-Dec2030-48000-CE",
      "strike": 48000,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "55883",
      "symbol": "NIFTY-Dec2030-48000-PE",
      "strike": 48000,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "38739",
      "symbol": "NIFTY-Dec2030-49500-CE",
      "strike": 49500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "38740",
      "symbol": "NIFTY-Dec2030-49500-PE",
      "strike": 49500,
      "type": "PE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "43894",
      "symbol": "NIFTY-Dec2030-1500-CE",
      "strike": 1500,
      "type": "CE",
      "expiry": "2030-12-31"
    },
    {
      "security_id": "43895",
      "symbol": "NIFTY-Dec2030-1500-PE",
      "strike": 1500,
      "type": "PE",
      "expiry": "2030-12-31"
    }
  ],
  "2026-04-28": [
    {
      "security_id": "71949",
      "symbol": "NIFTY-Apr2026-22000-CE",
      "strike": 22000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71950",
      "symbol": "NIFTY-Apr2026-22000-PE",
      "strike": 22000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71951",
      "symbol": "NIFTY-Apr2026-22050-CE",
      "strike": 22050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71952",
      "symbol": "NIFTY-Apr2026-22050-PE",
      "strike": 22050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71953",
      "symbol": "NIFTY-Apr2026-22100-CE",
      "strike": 22100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71954",
      "symbol": "NIFTY-Apr2026-22100-PE",
      "strike": 22100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71955",
      "symbol": "NIFTY-Apr2026-22150-CE",
      "strike": 22150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71956",
      "symbol": "NIFTY-Apr2026-22150-PE",
      "strike": 22150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71957",
      "symbol": "NIFTY-Apr2026-22200-CE",
      "strike": 22200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71958",
      "symbol": "NIFTY-Apr2026-22200-PE",
      "strike": 22200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71959",
      "symbol": "NIFTY-Apr2026-22250-CE",
      "strike": 22250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71960",
      "symbol": "NIFTY-Apr2026-22250-PE",
      "strike": 22250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71961",
      "symbol": "NIFTY-Apr2026-22300-CE",
      "strike": 22300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71962",
      "symbol": "NIFTY-Apr2026-22300-PE",
      "strike": 22300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71963",
      "symbol": "NIFTY-Apr2026-22350-CE",
      "strike": 22350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71964",
      "symbol": "NIFTY-Apr2026-22350-PE",
      "strike": 22350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71965",
      "symbol": "NIFTY-Apr2026-22400-CE",
      "strike": 22400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71966",
      "symbol": "NIFTY-Apr2026-22400-PE",
      "strike": 22400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71967",
      "symbol": "NIFTY-Apr2026-22450-CE",
      "strike": 22450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71968",
      "symbol": "NIFTY-Apr2026-22450-PE",
      "strike": 22450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72065",
      "symbol": "NIFTY-Apr2026-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72066",
      "symbol": "NIFTY-Apr2026-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72158",
      "symbol": "NIFTY-Apr2026-22550-CE",
      "strike": 22550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72159",
      "symbol": "NIFTY-Apr2026-22550-PE",
      "strike": 22550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72160",
      "symbol": "NIFTY-Apr2026-22600-CE",
      "strike": 22600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72161",
      "symbol": "NIFTY-Apr2026-22600-PE",
      "strike": 22600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72162",
      "symbol": "NIFTY-Apr2026-22650-CE",
      "strike": 22650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72164",
      "symbol": "NIFTY-Apr2026-22650-PE",
      "strike": 22650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72195",
      "symbol": "NIFTY-Apr2026-22700-CE",
      "strike": 22700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72196",
      "symbol": "NIFTY-Apr2026-22700-PE",
      "strike": 22700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72197",
      "symbol": "NIFTY-Apr2026-22750-CE",
      "strike": 22750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72198",
      "symbol": "NIFTY-Apr2026-22750-PE",
      "strike": 22750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72199",
      "symbol": "NIFTY-Apr2026-22800-CE",
      "strike": 22800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72200",
      "symbol": "NIFTY-Apr2026-22800-PE",
      "strike": 22800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72201",
      "symbol": "NIFTY-Apr2026-22850-CE",
      "strike": 22850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72202",
      "symbol": "NIFTY-Apr2026-22850-PE",
      "strike": 22850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72203",
      "symbol": "NIFTY-Apr2026-22900-CE",
      "strike": 22900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72204",
      "symbol": "NIFTY-Apr2026-22900-PE",
      "strike": 22900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72205",
      "symbol": "NIFTY-Apr2026-22950-CE",
      "strike": 22950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72206",
      "symbol": "NIFTY-Apr2026-22950-PE",
      "strike": 22950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72207",
      "symbol": "NIFTY-Apr2026-23000-CE",
      "strike": 23000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72208",
      "symbol": "NIFTY-Apr2026-23000-PE",
      "strike": 23000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72210",
      "symbol": "NIFTY-Apr2026-23050-CE",
      "strike": 23050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72211",
      "symbol": "NIFTY-Apr2026-23050-PE",
      "strike": 23050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72212",
      "symbol": "NIFTY-Apr2026-23100-CE",
      "strike": 23100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72213",
      "symbol": "NIFTY-Apr2026-23100-PE",
      "strike": 23100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72214",
      "symbol": "NIFTY-Apr2026-23150-CE",
      "strike": 23150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72215",
      "symbol": "NIFTY-Apr2026-23150-PE",
      "strike": 23150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72216",
      "symbol": "NIFTY-Apr2026-23200-CE",
      "strike": 23200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72217",
      "symbol": "NIFTY-Apr2026-23200-PE",
      "strike": 23200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72218",
      "symbol": "NIFTY-Apr2026-23250-CE",
      "strike": 23250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72219",
      "symbol": "NIFTY-Apr2026-23250-PE",
      "strike": 23250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72220",
      "symbol": "NIFTY-Apr2026-23300-CE",
      "strike": 23300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72221",
      "symbol": "NIFTY-Apr2026-23300-PE",
      "strike": 23300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72222",
      "symbol": "NIFTY-Apr2026-23350-CE",
      "strike": 23350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72223",
      "symbol": "NIFTY-Apr2026-23350-PE",
      "strike": 23350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72224",
      "symbol": "NIFTY-Apr2026-23400-CE",
      "strike": 23400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72225",
      "symbol": "NIFTY-Apr2026-23400-PE",
      "strike": 23400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72226",
      "symbol": "NIFTY-Apr2026-23450-CE",
      "strike": 23450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72227",
      "symbol": "NIFTY-Apr2026-23450-PE",
      "strike": 23450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72228",
      "symbol": "NIFTY-Apr2026-23500-CE",
      "strike": 23500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72229",
      "symbol": "NIFTY-Apr2026-23500-PE",
      "strike": 23500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72244",
      "symbol": "NIFTY-Apr2026-23550-CE",
      "strike": 23550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72245",
      "symbol": "NIFTY-Apr2026-23550-PE",
      "strike": 23550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72246",
      "symbol": "NIFTY-Apr2026-23600-CE",
      "strike": 23600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72248",
      "symbol": "NIFTY-Apr2026-23600-PE",
      "strike": 23600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72249",
      "symbol": "NIFTY-Apr2026-23650-CE",
      "strike": 23650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72250",
      "symbol": "NIFTY-Apr2026-23650-PE",
      "strike": 23650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72251",
      "symbol": "NIFTY-Apr2026-23700-CE",
      "strike": 23700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72252",
      "symbol": "NIFTY-Apr2026-23700-PE",
      "strike": 23700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72253",
      "symbol": "NIFTY-Apr2026-23750-CE",
      "strike": 23750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72254",
      "symbol": "NIFTY-Apr2026-23750-PE",
      "strike": 23750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72255",
      "symbol": "NIFTY-Apr2026-23800-CE",
      "strike": 23800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72256",
      "symbol": "NIFTY-Apr2026-23800-PE",
      "strike": 23800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72257",
      "symbol": "NIFTY-Apr2026-23850-CE",
      "strike": 23850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72258",
      "symbol": "NIFTY-Apr2026-23850-PE",
      "strike": 23850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72259",
      "symbol": "NIFTY-Apr2026-23900-CE",
      "strike": 23900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72260",
      "symbol": "NIFTY-Apr2026-23900-PE",
      "strike": 23900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72261",
      "symbol": "NIFTY-Apr2026-23950-CE",
      "strike": 23950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72262",
      "symbol": "NIFTY-Apr2026-23950-PE",
      "strike": 23950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72263",
      "symbol": "NIFTY-Apr2026-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72264",
      "symbol": "NIFTY-Apr2026-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72265",
      "symbol": "NIFTY-Apr2026-24050-CE",
      "strike": 24050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72266",
      "symbol": "NIFTY-Apr2026-24050-PE",
      "strike": 24050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72267",
      "symbol": "NIFTY-Apr2026-24100-CE",
      "strike": 24100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72268",
      "symbol": "NIFTY-Apr2026-24100-PE",
      "strike": 24100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72269",
      "symbol": "NIFTY-Apr2026-24150-CE",
      "strike": 24150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72270",
      "symbol": "NIFTY-Apr2026-24150-PE",
      "strike": 24150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72271",
      "symbol": "NIFTY-Apr2026-24200-CE",
      "strike": 24200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72272",
      "symbol": "NIFTY-Apr2026-24200-PE",
      "strike": 24200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72277",
      "symbol": "NIFTY-Apr2026-24250-CE",
      "strike": 24250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72278",
      "symbol": "NIFTY-Apr2026-24250-PE",
      "strike": 24250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72279",
      "symbol": "NIFTY-Apr2026-24300-CE",
      "strike": 24300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72311",
      "symbol": "NIFTY-Apr2026-24300-PE",
      "strike": 24300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72312",
      "symbol": "NIFTY-Apr2026-24350-CE",
      "strike": 24350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72316",
      "symbol": "NIFTY-Apr2026-24350-PE",
      "strike": 24350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72317",
      "symbol": "NIFTY-Apr2026-24400-CE",
      "strike": 24400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72322",
      "symbol": "NIFTY-Apr2026-24400-PE",
      "strike": 24400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72323",
      "symbol": "NIFTY-Apr2026-24450-CE",
      "strike": 24450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72324",
      "symbol": "NIFTY-Apr2026-24450-PE",
      "strike": 24450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72325",
      "symbol": "NIFTY-Apr2026-24500-CE",
      "strike": 24500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72326",
      "symbol": "NIFTY-Apr2026-24500-PE",
      "strike": 24500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72327",
      "symbol": "NIFTY-Apr2026-24550-CE",
      "strike": 24550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72328",
      "symbol": "NIFTY-Apr2026-24550-PE",
      "strike": 24550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72329",
      "symbol": "NIFTY-Apr2026-24600-CE",
      "strike": 24600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72330",
      "symbol": "NIFTY-Apr2026-24600-PE",
      "strike": 24600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72331",
      "symbol": "NIFTY-Apr2026-24650-CE",
      "strike": 24650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72332",
      "symbol": "NIFTY-Apr2026-24650-PE",
      "strike": 24650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72333",
      "symbol": "NIFTY-Apr2026-24700-CE",
      "strike": 24700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72334",
      "symbol": "NIFTY-Apr2026-24700-PE",
      "strike": 24700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72335",
      "symbol": "NIFTY-Apr2026-24750-CE",
      "strike": 24750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72336",
      "symbol": "NIFTY-Apr2026-24750-PE",
      "strike": 24750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72337",
      "symbol": "NIFTY-Apr2026-24800-CE",
      "strike": 24800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72338",
      "symbol": "NIFTY-Apr2026-24800-PE",
      "strike": 24800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72339",
      "symbol": "NIFTY-Apr2026-24850-CE",
      "strike": 24850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72341",
      "symbol": "NIFTY-Apr2026-24850-PE",
      "strike": 24850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72342",
      "symbol": "NIFTY-Apr2026-24900-CE",
      "strike": 24900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72343",
      "symbol": "NIFTY-Apr2026-24900-PE",
      "strike": 24900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72346",
      "symbol": "NIFTY-Apr2026-24950-CE",
      "strike": 24950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72347",
      "symbol": "NIFTY-Apr2026-24950-PE",
      "strike": 24950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72348",
      "symbol": "NIFTY-Apr2026-25000-CE",
      "strike": 25000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72349",
      "symbol": "NIFTY-Apr2026-25000-PE",
      "strike": 25000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72350",
      "symbol": "NIFTY-Apr2026-25050-CE",
      "strike": 25050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72353",
      "symbol": "NIFTY-Apr2026-25050-PE",
      "strike": 25050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72354",
      "symbol": "NIFTY-Apr2026-25100-CE",
      "strike": 25100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72355",
      "symbol": "NIFTY-Apr2026-25100-PE",
      "strike": 25100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72357",
      "symbol": "NIFTY-Apr2026-25150-CE",
      "strike": 25150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72359",
      "symbol": "NIFTY-Apr2026-25150-PE",
      "strike": 25150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72361",
      "symbol": "NIFTY-Apr2026-25200-CE",
      "strike": 25200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72362",
      "symbol": "NIFTY-Apr2026-25200-PE",
      "strike": 25200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72365",
      "symbol": "NIFTY-Apr2026-25250-CE",
      "strike": 25250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72366",
      "symbol": "NIFTY-Apr2026-25250-PE",
      "strike": 25250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72367",
      "symbol": "NIFTY-Apr2026-25300-CE",
      "strike": 25300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72368",
      "symbol": "NIFTY-Apr2026-25300-PE",
      "strike": 25300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72369",
      "symbol": "NIFTY-Apr2026-25350-CE",
      "strike": 25350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72370",
      "symbol": "NIFTY-Apr2026-25350-PE",
      "strike": 25350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72383",
      "symbol": "NIFTY-Apr2026-25400-CE",
      "strike": 25400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72384",
      "symbol": "NIFTY-Apr2026-25400-PE",
      "strike": 25400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72385",
      "symbol": "NIFTY-Apr2026-25450-CE",
      "strike": 25450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72394",
      "symbol": "NIFTY-Apr2026-25450-PE",
      "strike": 25450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72395",
      "symbol": "NIFTY-Apr2026-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72408",
      "symbol": "NIFTY-Apr2026-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72419",
      "symbol": "NIFTY-Apr2026-25550-CE",
      "strike": 25550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72420",
      "symbol": "NIFTY-Apr2026-25550-PE",
      "strike": 25550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72422",
      "symbol": "NIFTY-Apr2026-25600-CE",
      "strike": 25600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72423",
      "symbol": "NIFTY-Apr2026-25600-PE",
      "strike": 25600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72424",
      "symbol": "NIFTY-Apr2026-25650-CE",
      "strike": 25650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72425",
      "symbol": "NIFTY-Apr2026-25650-PE",
      "strike": 25650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72427",
      "symbol": "NIFTY-Apr2026-25700-CE",
      "strike": 25700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72428",
      "symbol": "NIFTY-Apr2026-25700-PE",
      "strike": 25700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72429",
      "symbol": "NIFTY-Apr2026-25750-CE",
      "strike": 25750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72430",
      "symbol": "NIFTY-Apr2026-25750-PE",
      "strike": 25750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72431",
      "symbol": "NIFTY-Apr2026-25800-CE",
      "strike": 25800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72432",
      "symbol": "NIFTY-Apr2026-25800-PE",
      "strike": 25800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72434",
      "symbol": "NIFTY-Apr2026-25850-CE",
      "strike": 25850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72435",
      "symbol": "NIFTY-Apr2026-25850-PE",
      "strike": 25850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72437",
      "symbol": "NIFTY-Apr2026-25900-CE",
      "strike": 25900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72438",
      "symbol": "NIFTY-Apr2026-25900-PE",
      "strike": 25900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72439",
      "symbol": "NIFTY-Apr2026-25950-CE",
      "strike": 25950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72440",
      "symbol": "NIFTY-Apr2026-25950-PE",
      "strike": 25950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72441",
      "symbol": "NIFTY-Apr2026-26000-CE",
      "strike": 26000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72456",
      "symbol": "NIFTY-Apr2026-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72457",
      "symbol": "NIFTY-Apr2026-26050-CE",
      "strike": 26050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72458",
      "symbol": "NIFTY-Apr2026-26050-PE",
      "strike": 26050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72459",
      "symbol": "NIFTY-Apr2026-26100-CE",
      "strike": 26100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72466",
      "symbol": "NIFTY-Apr2026-26100-PE",
      "strike": 26100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72467",
      "symbol": "NIFTY-Apr2026-26150-CE",
      "strike": 26150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72482",
      "symbol": "NIFTY-Apr2026-26150-PE",
      "strike": 26150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72483",
      "symbol": "NIFTY-Apr2026-26200-CE",
      "strike": 26200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72484",
      "symbol": "NIFTY-Apr2026-26200-PE",
      "strike": 26200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72485",
      "symbol": "NIFTY-Apr2026-26250-CE",
      "strike": 26250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72486",
      "symbol": "NIFTY-Apr2026-26250-PE",
      "strike": 26250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72487",
      "symbol": "NIFTY-Apr2026-26300-CE",
      "strike": 26300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72488",
      "symbol": "NIFTY-Apr2026-26300-PE",
      "strike": 26300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72489",
      "symbol": "NIFTY-Apr2026-26350-CE",
      "strike": 26350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72490",
      "symbol": "NIFTY-Apr2026-26350-PE",
      "strike": 26350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72491",
      "symbol": "NIFTY-Apr2026-26400-CE",
      "strike": 26400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72492",
      "symbol": "NIFTY-Apr2026-26400-PE",
      "strike": 26400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72493",
      "symbol": "NIFTY-Apr2026-26450-CE",
      "strike": 26450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72494",
      "symbol": "NIFTY-Apr2026-26450-PE",
      "strike": 26450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72495",
      "symbol": "NIFTY-Apr2026-26500-CE",
      "strike": 26500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72496",
      "symbol": "NIFTY-Apr2026-26500-PE",
      "strike": 26500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72497",
      "symbol": "NIFTY-Apr2026-26550-CE",
      "strike": 26550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72502",
      "symbol": "NIFTY-Apr2026-26550-PE",
      "strike": 26550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72663",
      "symbol": "NIFTY-Apr2026-26600-CE",
      "strike": 26600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72664",
      "symbol": "NIFTY-Apr2026-26600-PE",
      "strike": 26600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72665",
      "symbol": "NIFTY-Apr2026-26650-CE",
      "strike": 26650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72666",
      "symbol": "NIFTY-Apr2026-26650-PE",
      "strike": 26650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72667",
      "symbol": "NIFTY-Apr2026-26700-CE",
      "strike": 26700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72668",
      "symbol": "NIFTY-Apr2026-26700-PE",
      "strike": 26700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72669",
      "symbol": "NIFTY-Apr2026-26750-CE",
      "strike": 26750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72670",
      "symbol": "NIFTY-Apr2026-26750-PE",
      "strike": 26750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72713",
      "symbol": "NIFTY-Apr2026-26800-CE",
      "strike": 26800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72718",
      "symbol": "NIFTY-Apr2026-26800-PE",
      "strike": 26800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72719",
      "symbol": "NIFTY-Apr2026-26850-CE",
      "strike": 26850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72720",
      "symbol": "NIFTY-Apr2026-26850-PE",
      "strike": 26850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72721",
      "symbol": "NIFTY-Apr2026-26900-CE",
      "strike": 26900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72722",
      "symbol": "NIFTY-Apr2026-26900-PE",
      "strike": 26900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72723",
      "symbol": "NIFTY-Apr2026-26950-CE",
      "strike": 26950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72724",
      "symbol": "NIFTY-Apr2026-26950-PE",
      "strike": 26950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72725",
      "symbol": "NIFTY-Apr2026-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72726",
      "symbol": "NIFTY-Apr2026-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72727",
      "symbol": "NIFTY-Apr2026-27050-CE",
      "strike": 27050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72728",
      "symbol": "NIFTY-Apr2026-27050-PE",
      "strike": 27050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72729",
      "symbol": "NIFTY-Apr2026-27100-CE",
      "strike": 27100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72730",
      "symbol": "NIFTY-Apr2026-27100-PE",
      "strike": 27100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72733",
      "symbol": "NIFTY-Apr2026-27150-CE",
      "strike": 27150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72734",
      "symbol": "NIFTY-Apr2026-27150-PE",
      "strike": 27150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72741",
      "symbol": "NIFTY-Apr2026-27200-CE",
      "strike": 27200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72742",
      "symbol": "NIFTY-Apr2026-27200-PE",
      "strike": 27200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72743",
      "symbol": "NIFTY-Apr2026-27250-CE",
      "strike": 27250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72744",
      "symbol": "NIFTY-Apr2026-27250-PE",
      "strike": 27250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72745",
      "symbol": "NIFTY-Apr2026-27300-CE",
      "strike": 27300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72746",
      "symbol": "NIFTY-Apr2026-27300-PE",
      "strike": 27300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72747",
      "symbol": "NIFTY-Apr2026-27350-CE",
      "strike": 27350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72748",
      "symbol": "NIFTY-Apr2026-27350-PE",
      "strike": 27350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72750",
      "symbol": "NIFTY-Apr2026-27400-CE",
      "strike": 27400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72751",
      "symbol": "NIFTY-Apr2026-27400-PE",
      "strike": 27400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72754",
      "symbol": "NIFTY-Apr2026-27450-CE",
      "strike": 27450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72755",
      "symbol": "NIFTY-Apr2026-27450-PE",
      "strike": 27450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72756",
      "symbol": "NIFTY-Apr2026-27500-CE",
      "strike": 27500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72759",
      "symbol": "NIFTY-Apr2026-27500-PE",
      "strike": 27500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72760",
      "symbol": "NIFTY-Apr2026-27550-CE",
      "strike": 27550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72761",
      "symbol": "NIFTY-Apr2026-27550-PE",
      "strike": 27550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72762",
      "symbol": "NIFTY-Apr2026-27600-CE",
      "strike": 27600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72763",
      "symbol": "NIFTY-Apr2026-27600-PE",
      "strike": 27600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72764",
      "symbol": "NIFTY-Apr2026-27650-CE",
      "strike": 27650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72770",
      "symbol": "NIFTY-Apr2026-27650-PE",
      "strike": 27650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72771",
      "symbol": "NIFTY-Apr2026-27700-CE",
      "strike": 27700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72772",
      "symbol": "NIFTY-Apr2026-27700-PE",
      "strike": 27700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72773",
      "symbol": "NIFTY-Apr2026-27750-CE",
      "strike": 27750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72775",
      "symbol": "NIFTY-Apr2026-27750-PE",
      "strike": 27750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72776",
      "symbol": "NIFTY-Apr2026-27800-CE",
      "strike": 27800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72777",
      "symbol": "NIFTY-Apr2026-27800-PE",
      "strike": 27800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72780",
      "symbol": "NIFTY-Apr2026-27850-CE",
      "strike": 27850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72781",
      "symbol": "NIFTY-Apr2026-27850-PE",
      "strike": 27850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72782",
      "symbol": "NIFTY-Apr2026-27900-CE",
      "strike": 27900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72783",
      "symbol": "NIFTY-Apr2026-27900-PE",
      "strike": 27900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72784",
      "symbol": "NIFTY-Apr2026-27950-CE",
      "strike": 27950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72785",
      "symbol": "NIFTY-Apr2026-27950-PE",
      "strike": 27950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72786",
      "symbol": "NIFTY-Apr2026-28000-CE",
      "strike": 28000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72788",
      "symbol": "NIFTY-Apr2026-28000-PE",
      "strike": 28000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72790",
      "symbol": "NIFTY-Apr2026-28050-CE",
      "strike": 28050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72808",
      "symbol": "NIFTY-Apr2026-28050-PE",
      "strike": 28050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72809",
      "symbol": "NIFTY-Apr2026-28100-CE",
      "strike": 28100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72810",
      "symbol": "NIFTY-Apr2026-28100-PE",
      "strike": 28100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72811",
      "symbol": "NIFTY-Apr2026-28150-CE",
      "strike": 28150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72812",
      "symbol": "NIFTY-Apr2026-28150-PE",
      "strike": 28150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72813",
      "symbol": "NIFTY-Apr2026-28200-CE",
      "strike": 28200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72818",
      "symbol": "NIFTY-Apr2026-28200-PE",
      "strike": 28200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72819",
      "symbol": "NIFTY-Apr2026-28250-CE",
      "strike": 28250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72821",
      "symbol": "NIFTY-Apr2026-28250-PE",
      "strike": 28250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72822",
      "symbol": "NIFTY-Apr2026-28300-CE",
      "strike": 28300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72829",
      "symbol": "NIFTY-Apr2026-28300-PE",
      "strike": 28300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72830",
      "symbol": "NIFTY-Apr2026-28350-CE",
      "strike": 28350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72831",
      "symbol": "NIFTY-Apr2026-28350-PE",
      "strike": 28350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72841",
      "symbol": "NIFTY-Apr2026-28400-CE",
      "strike": 28400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "72842",
      "symbol": "NIFTY-Apr2026-28400-PE",
      "strike": 28400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73030",
      "symbol": "NIFTY-Apr2026-28450-CE",
      "strike": 28450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73031",
      "symbol": "NIFTY-Apr2026-28450-PE",
      "strike": 28450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73032",
      "symbol": "NIFTY-Apr2026-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73033",
      "symbol": "NIFTY-Apr2026-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73034",
      "symbol": "NIFTY-Apr2026-28550-CE",
      "strike": 28550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73036",
      "symbol": "NIFTY-Apr2026-28550-PE",
      "strike": 28550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73037",
      "symbol": "NIFTY-Apr2026-28600-CE",
      "strike": 28600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73038",
      "symbol": "NIFTY-Apr2026-28600-PE",
      "strike": 28600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73039",
      "symbol": "NIFTY-Apr2026-28650-CE",
      "strike": 28650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73040",
      "symbol": "NIFTY-Apr2026-28650-PE",
      "strike": 28650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73041",
      "symbol": "NIFTY-Apr2026-28700-CE",
      "strike": 28700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73042",
      "symbol": "NIFTY-Apr2026-28700-PE",
      "strike": 28700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73043",
      "symbol": "NIFTY-Apr2026-28750-CE",
      "strike": 28750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73044",
      "symbol": "NIFTY-Apr2026-28750-PE",
      "strike": 28750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73045",
      "symbol": "NIFTY-Apr2026-28800-CE",
      "strike": 28800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73046",
      "symbol": "NIFTY-Apr2026-28800-PE",
      "strike": 28800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73047",
      "symbol": "NIFTY-Apr2026-28850-CE",
      "strike": 28850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73048",
      "symbol": "NIFTY-Apr2026-28850-PE",
      "strike": 28850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73049",
      "symbol": "NIFTY-Apr2026-28900-CE",
      "strike": 28900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73050",
      "symbol": "NIFTY-Apr2026-28900-PE",
      "strike": 28900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73051",
      "symbol": "NIFTY-Apr2026-28950-CE",
      "strike": 28950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73052",
      "symbol": "NIFTY-Apr2026-28950-PE",
      "strike": 28950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73053",
      "symbol": "NIFTY-Apr2026-29000-CE",
      "strike": 29000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73054",
      "symbol": "NIFTY-Apr2026-29000-PE",
      "strike": 29000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73055",
      "symbol": "NIFTY-Apr2026-29050-CE",
      "strike": 29050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73056",
      "symbol": "NIFTY-Apr2026-29050-PE",
      "strike": 29050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73057",
      "symbol": "NIFTY-Apr2026-29100-CE",
      "strike": 29100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73058",
      "symbol": "NIFTY-Apr2026-29100-PE",
      "strike": 29100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73059",
      "symbol": "NIFTY-Apr2026-29150-CE",
      "strike": 29150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73060",
      "symbol": "NIFTY-Apr2026-29150-PE",
      "strike": 29150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73061",
      "symbol": "NIFTY-Apr2026-29200-CE",
      "strike": 29200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73062",
      "symbol": "NIFTY-Apr2026-29200-PE",
      "strike": 29200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73076",
      "symbol": "NIFTY-Apr2026-29250-CE",
      "strike": 29250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73077",
      "symbol": "NIFTY-Apr2026-29250-PE",
      "strike": 29250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73260",
      "symbol": "NIFTY-Apr2026-29300-CE",
      "strike": 29300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73271",
      "symbol": "NIFTY-Apr2026-29300-PE",
      "strike": 29300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73272",
      "symbol": "NIFTY-Apr2026-29350-CE",
      "strike": 29350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73276",
      "symbol": "NIFTY-Apr2026-29350-PE",
      "strike": 29350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73277",
      "symbol": "NIFTY-Apr2026-29400-CE",
      "strike": 29400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73287",
      "symbol": "NIFTY-Apr2026-29400-PE",
      "strike": 29400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73288",
      "symbol": "NIFTY-Apr2026-29450-CE",
      "strike": 29450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73289",
      "symbol": "NIFTY-Apr2026-29450-PE",
      "strike": 29450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73290",
      "symbol": "NIFTY-Apr2026-29500-CE",
      "strike": 29500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73293",
      "symbol": "NIFTY-Apr2026-29500-PE",
      "strike": 29500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73296",
      "symbol": "NIFTY-Apr2026-29550-CE",
      "strike": 29550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73297",
      "symbol": "NIFTY-Apr2026-29550-PE",
      "strike": 29550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73298",
      "symbol": "NIFTY-Apr2026-29600-CE",
      "strike": 29600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73299",
      "symbol": "NIFTY-Apr2026-29600-PE",
      "strike": 29600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73300",
      "symbol": "NIFTY-Apr2026-29650-CE",
      "strike": 29650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73301",
      "symbol": "NIFTY-Apr2026-29650-PE",
      "strike": 29650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73305",
      "symbol": "NIFTY-Apr2026-29700-CE",
      "strike": 29700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73306",
      "symbol": "NIFTY-Apr2026-29700-PE",
      "strike": 29700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73307",
      "symbol": "NIFTY-Apr2026-29750-CE",
      "strike": 29750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73308",
      "symbol": "NIFTY-Apr2026-29750-PE",
      "strike": 29750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73309",
      "symbol": "NIFTY-Apr2026-29800-CE",
      "strike": 29800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73310",
      "symbol": "NIFTY-Apr2026-29800-PE",
      "strike": 29800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73311",
      "symbol": "NIFTY-Apr2026-29850-CE",
      "strike": 29850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73314",
      "symbol": "NIFTY-Apr2026-29850-PE",
      "strike": 29850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73315",
      "symbol": "NIFTY-Apr2026-29900-CE",
      "strike": 29900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73316",
      "symbol": "NIFTY-Apr2026-29900-PE",
      "strike": 29900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73317",
      "symbol": "NIFTY-Apr2026-29950-CE",
      "strike": 29950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73318",
      "symbol": "NIFTY-Apr2026-29950-PE",
      "strike": 29950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73319",
      "symbol": "NIFTY-Apr2026-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73320",
      "symbol": "NIFTY-Apr2026-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73323",
      "symbol": "NIFTY-Apr2026-30050-CE",
      "strike": 30050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73324",
      "symbol": "NIFTY-Apr2026-30050-PE",
      "strike": 30050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73325",
      "symbol": "NIFTY-Apr2026-30100-CE",
      "strike": 30100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73326",
      "symbol": "NIFTY-Apr2026-30100-PE",
      "strike": 30100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73329",
      "symbol": "NIFTY-Apr2026-30150-CE",
      "strike": 30150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73330",
      "symbol": "NIFTY-Apr2026-30150-PE",
      "strike": 30150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73331",
      "symbol": "NIFTY-Apr2026-30200-CE",
      "strike": 30200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73334",
      "symbol": "NIFTY-Apr2026-30200-PE",
      "strike": 30200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73335",
      "symbol": "NIFTY-Apr2026-30250-CE",
      "strike": 30250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73338",
      "symbol": "NIFTY-Apr2026-30250-PE",
      "strike": 30250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73339",
      "symbol": "NIFTY-Apr2026-30300-CE",
      "strike": 30300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73340",
      "symbol": "NIFTY-Apr2026-30300-PE",
      "strike": 30300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73341",
      "symbol": "NIFTY-Apr2026-30350-CE",
      "strike": 30350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73342",
      "symbol": "NIFTY-Apr2026-30350-PE",
      "strike": 30350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73343",
      "symbol": "NIFTY-Apr2026-30400-CE",
      "strike": 30400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73344",
      "symbol": "NIFTY-Apr2026-30400-PE",
      "strike": 30400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73345",
      "symbol": "NIFTY-Apr2026-30450-CE",
      "strike": 30450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "73348",
      "symbol": "NIFTY-Apr2026-30450-PE",
      "strike": 30450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71796",
      "symbol": "NIFTY-Apr2026-19950-CE",
      "strike": 19950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71797",
      "symbol": "NIFTY-Apr2026-19950-PE",
      "strike": 19950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71798",
      "symbol": "NIFTY-Apr2026-20000-CE",
      "strike": 20000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71800",
      "symbol": "NIFTY-Apr2026-20000-PE",
      "strike": 20000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71801",
      "symbol": "NIFTY-Apr2026-20050-CE",
      "strike": 20050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71802",
      "symbol": "NIFTY-Apr2026-20050-PE",
      "strike": 20050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71803",
      "symbol": "NIFTY-Apr2026-20100-CE",
      "strike": 20100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71804",
      "symbol": "NIFTY-Apr2026-20100-PE",
      "strike": 20100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71805",
      "symbol": "NIFTY-Apr2026-20150-CE",
      "strike": 20150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71806",
      "symbol": "NIFTY-Apr2026-20150-PE",
      "strike": 20150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71807",
      "symbol": "NIFTY-Apr2026-20200-CE",
      "strike": 20200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71808",
      "symbol": "NIFTY-Apr2026-20200-PE",
      "strike": 20200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71809",
      "symbol": "NIFTY-Apr2026-20250-CE",
      "strike": 20250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71810",
      "symbol": "NIFTY-Apr2026-20250-PE",
      "strike": 20250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71811",
      "symbol": "NIFTY-Apr2026-20300-CE",
      "strike": 20300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71812",
      "symbol": "NIFTY-Apr2026-20300-PE",
      "strike": 20300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71815",
      "symbol": "NIFTY-Apr2026-20350-CE",
      "strike": 20350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71822",
      "symbol": "NIFTY-Apr2026-20350-PE",
      "strike": 20350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71823",
      "symbol": "NIFTY-Apr2026-20400-CE",
      "strike": 20400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71824",
      "symbol": "NIFTY-Apr2026-20400-PE",
      "strike": 20400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71825",
      "symbol": "NIFTY-Apr2026-20450-CE",
      "strike": 20450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71826",
      "symbol": "NIFTY-Apr2026-20450-PE",
      "strike": 20450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71827",
      "symbol": "NIFTY-Apr2026-20500-CE",
      "strike": 20500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71828",
      "symbol": "NIFTY-Apr2026-20500-PE",
      "strike": 20500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71829",
      "symbol": "NIFTY-Apr2026-20550-CE",
      "strike": 20550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71830",
      "symbol": "NIFTY-Apr2026-20550-PE",
      "strike": 20550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71831",
      "symbol": "NIFTY-Apr2026-20600-CE",
      "strike": 20600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71834",
      "symbol": "NIFTY-Apr2026-20600-PE",
      "strike": 20600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71835",
      "symbol": "NIFTY-Apr2026-20650-CE",
      "strike": 20650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71846",
      "symbol": "NIFTY-Apr2026-20650-PE",
      "strike": 20650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71847",
      "symbol": "NIFTY-Apr2026-20700-CE",
      "strike": 20700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71850",
      "symbol": "NIFTY-Apr2026-20700-PE",
      "strike": 20700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71851",
      "symbol": "NIFTY-Apr2026-20750-CE",
      "strike": 20750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71852",
      "symbol": "NIFTY-Apr2026-20750-PE",
      "strike": 20750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71853",
      "symbol": "NIFTY-Apr2026-20800-CE",
      "strike": 20800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71854",
      "symbol": "NIFTY-Apr2026-20800-PE",
      "strike": 20800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71855",
      "symbol": "NIFTY-Apr2026-20850-CE",
      "strike": 20850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71856",
      "symbol": "NIFTY-Apr2026-20850-PE",
      "strike": 20850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71857",
      "symbol": "NIFTY-Apr2026-20900-CE",
      "strike": 20900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71858",
      "symbol": "NIFTY-Apr2026-20900-PE",
      "strike": 20900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71861",
      "symbol": "NIFTY-Apr2026-20950-CE",
      "strike": 20950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71862",
      "symbol": "NIFTY-Apr2026-20950-PE",
      "strike": 20950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71863",
      "symbol": "NIFTY-Apr2026-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71864",
      "symbol": "NIFTY-Apr2026-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71871",
      "symbol": "NIFTY-Apr2026-21050-CE",
      "strike": 21050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71872",
      "symbol": "NIFTY-Apr2026-21050-PE",
      "strike": 21050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71873",
      "symbol": "NIFTY-Apr2026-21100-CE",
      "strike": 21100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71874",
      "symbol": "NIFTY-Apr2026-21100-PE",
      "strike": 21100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71875",
      "symbol": "NIFTY-Apr2026-21150-CE",
      "strike": 21150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71876",
      "symbol": "NIFTY-Apr2026-21150-PE",
      "strike": 21150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71893",
      "symbol": "NIFTY-Apr2026-21200-CE",
      "strike": 21200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71894",
      "symbol": "NIFTY-Apr2026-21200-PE",
      "strike": 21200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71913",
      "symbol": "NIFTY-Apr2026-21250-CE",
      "strike": 21250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71914",
      "symbol": "NIFTY-Apr2026-21250-PE",
      "strike": 21250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71915",
      "symbol": "NIFTY-Apr2026-21300-CE",
      "strike": 21300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71916",
      "symbol": "NIFTY-Apr2026-21300-PE",
      "strike": 21300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71921",
      "symbol": "NIFTY-Apr2026-21350-CE",
      "strike": 21350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71922",
      "symbol": "NIFTY-Apr2026-21350-PE",
      "strike": 21350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71923",
      "symbol": "NIFTY-Apr2026-21400-CE",
      "strike": 21400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71924",
      "symbol": "NIFTY-Apr2026-21400-PE",
      "strike": 21400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71925",
      "symbol": "NIFTY-Apr2026-21450-CE",
      "strike": 21450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71926",
      "symbol": "NIFTY-Apr2026-21450-PE",
      "strike": 21450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71927",
      "symbol": "NIFTY-Apr2026-21500-CE",
      "strike": 21500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71928",
      "symbol": "NIFTY-Apr2026-21500-PE",
      "strike": 21500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71929",
      "symbol": "NIFTY-Apr2026-21550-CE",
      "strike": 21550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71930",
      "symbol": "NIFTY-Apr2026-21550-PE",
      "strike": 21550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71931",
      "symbol": "NIFTY-Apr2026-21600-CE",
      "strike": 21600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71932",
      "symbol": "NIFTY-Apr2026-21600-PE",
      "strike": 21600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71933",
      "symbol": "NIFTY-Apr2026-21650-CE",
      "strike": 21650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71934",
      "symbol": "NIFTY-Apr2026-21650-PE",
      "strike": 21650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71935",
      "symbol": "NIFTY-Apr2026-21700-CE",
      "strike": 21700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71936",
      "symbol": "NIFTY-Apr2026-21700-PE",
      "strike": 21700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71937",
      "symbol": "NIFTY-Apr2026-21750-CE",
      "strike": 21750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71938",
      "symbol": "NIFTY-Apr2026-21750-PE",
      "strike": 21750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71939",
      "symbol": "NIFTY-Apr2026-21800-CE",
      "strike": 21800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71940",
      "symbol": "NIFTY-Apr2026-21800-PE",
      "strike": 21800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71943",
      "symbol": "NIFTY-Apr2026-21850-CE",
      "strike": 21850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71944",
      "symbol": "NIFTY-Apr2026-21850-PE",
      "strike": 21850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71945",
      "symbol": "NIFTY-Apr2026-21900-CE",
      "strike": 21900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71946",
      "symbol": "NIFTY-Apr2026-21900-PE",
      "strike": 21900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71947",
      "symbol": "NIFTY-Apr2026-21950-CE",
      "strike": 21950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "71948",
      "symbol": "NIFTY-Apr2026-21950-PE",
      "strike": 21950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "35184",
      "symbol": "NIFTY-Apr2026-30500-CE",
      "strike": 30500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "35185",
      "symbol": "NIFTY-Apr2026-30500-PE",
      "strike": 30500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "35190",
      "symbol": "NIFTY-Apr2026-30550-CE",
      "strike": 30550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "35192",
      "symbol": "NIFTY-Apr2026-30550-PE",
      "strike": 30550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "35195",
      "symbol": "NIFTY-Apr2026-30600-CE",
      "strike": 30600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "35196",
      "symbol": "NIFTY-Apr2026-30600-PE",
      "strike": 30600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "35266",
      "symbol": "NIFTY-Apr2026-30650-CE",
      "strike": 30650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "35267",
      "symbol": "NIFTY-Apr2026-30650-PE",
      "strike": 30650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41211",
      "symbol": "NIFTY-Apr2026-19600-CE",
      "strike": 19600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41212",
      "symbol": "NIFTY-Apr2026-19600-PE",
      "strike": 19600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41215",
      "symbol": "NIFTY-Apr2026-19650-CE",
      "strike": 19650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41216",
      "symbol": "NIFTY-Apr2026-19650-PE",
      "strike": 19650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41217",
      "symbol": "NIFTY-Apr2026-19700-CE",
      "strike": 19700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41218",
      "symbol": "NIFTY-Apr2026-19700-PE",
      "strike": 19700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41219",
      "symbol": "NIFTY-Apr2026-19750-CE",
      "strike": 19750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41220",
      "symbol": "NIFTY-Apr2026-19750-PE",
      "strike": 19750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41221",
      "symbol": "NIFTY-Apr2026-19800-CE",
      "strike": 19800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41224",
      "symbol": "NIFTY-Apr2026-19800-PE",
      "strike": 19800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41225",
      "symbol": "NIFTY-Apr2026-19850-CE",
      "strike": 19850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41226",
      "symbol": "NIFTY-Apr2026-19850-PE",
      "strike": 19850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41227",
      "symbol": "NIFTY-Apr2026-19900-CE",
      "strike": 19900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "41228",
      "symbol": "NIFTY-Apr2026-19900-PE",
      "strike": 19900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46022",
      "symbol": "NIFTY-Apr2026-30700-CE",
      "strike": 30700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46024",
      "symbol": "NIFTY-Apr2026-30700-PE",
      "strike": 30700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46025",
      "symbol": "NIFTY-Apr2026-30750-CE",
      "strike": 30750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46026",
      "symbol": "NIFTY-Apr2026-30750-PE",
      "strike": 30750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46027",
      "symbol": "NIFTY-Apr2026-30800-CE",
      "strike": 30800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46028",
      "symbol": "NIFTY-Apr2026-30800-PE",
      "strike": 30800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46029",
      "symbol": "NIFTY-Apr2026-30850-CE",
      "strike": 30850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46030",
      "symbol": "NIFTY-Apr2026-30850-PE",
      "strike": 30850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46031",
      "symbol": "NIFTY-Apr2026-30900-CE",
      "strike": 30900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46032",
      "symbol": "NIFTY-Apr2026-30900-PE",
      "strike": 30900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46033",
      "symbol": "NIFTY-Apr2026-30950-CE",
      "strike": 30950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46034",
      "symbol": "NIFTY-Apr2026-30950-PE",
      "strike": 30950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46036",
      "symbol": "NIFTY-Apr2026-31000-CE",
      "strike": 31000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "46037",
      "symbol": "NIFTY-Apr2026-31000-PE",
      "strike": 31000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "45592",
      "symbol": "NIFTY-Apr2026-31050-CE",
      "strike": 31050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "45593",
      "symbol": "NIFTY-Apr2026-31050-PE",
      "strike": 31050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "55001",
      "symbol": "NIFTY-Apr2026-31100-CE",
      "strike": 31100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "55002",
      "symbol": "NIFTY-Apr2026-31100-PE",
      "strike": 31100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "58326",
      "symbol": "NIFTY-Apr2026-31150-CE",
      "strike": 31150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "58327",
      "symbol": "NIFTY-Apr2026-31150-PE",
      "strike": 31150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "58328",
      "symbol": "NIFTY-Apr2026-31200-CE",
      "strike": 31200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "58329",
      "symbol": "NIFTY-Apr2026-31200-PE",
      "strike": 31200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43792",
      "symbol": "NIFTY-Apr2026-19250-CE",
      "strike": 19250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43793",
      "symbol": "NIFTY-Apr2026-19250-PE",
      "strike": 19250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43794",
      "symbol": "NIFTY-Apr2026-19300-CE",
      "strike": 19300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43795",
      "symbol": "NIFTY-Apr2026-19300-PE",
      "strike": 19300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43818",
      "symbol": "NIFTY-Apr2026-19350-CE",
      "strike": 19350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43819",
      "symbol": "NIFTY-Apr2026-19350-PE",
      "strike": 19350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43828",
      "symbol": "NIFTY-Apr2026-19400-CE",
      "strike": 19400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43829",
      "symbol": "NIFTY-Apr2026-19400-PE",
      "strike": 19400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43830",
      "symbol": "NIFTY-Apr2026-19450-CE",
      "strike": 19450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43831",
      "symbol": "NIFTY-Apr2026-19450-PE",
      "strike": 19450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43832",
      "symbol": "NIFTY-Apr2026-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43833",
      "symbol": "NIFTY-Apr2026-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43834",
      "symbol": "NIFTY-Apr2026-19550-CE",
      "strike": 19550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "43835",
      "symbol": "NIFTY-Apr2026-19550-PE",
      "strike": 19550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "48534",
      "symbol": "NIFTY-Apr2026-19200-CE",
      "strike": 19200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "48535",
      "symbol": "NIFTY-Apr2026-19200-PE",
      "strike": 19200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49838",
      "symbol": "NIFTY-Apr2026-18800-CE",
      "strike": 18800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49839",
      "symbol": "NIFTY-Apr2026-18800-PE",
      "strike": 18800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49840",
      "symbol": "NIFTY-Apr2026-18850-CE",
      "strike": 18850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49841",
      "symbol": "NIFTY-Apr2026-18850-PE",
      "strike": 18850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49842",
      "symbol": "NIFTY-Apr2026-18900-CE",
      "strike": 18900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49843",
      "symbol": "NIFTY-Apr2026-18900-PE",
      "strike": 18900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49844",
      "symbol": "NIFTY-Apr2026-18950-CE",
      "strike": 18950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49845",
      "symbol": "NIFTY-Apr2026-18950-PE",
      "strike": 18950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49846",
      "symbol": "NIFTY-Apr2026-19000-CE",
      "strike": 19000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49847",
      "symbol": "NIFTY-Apr2026-19000-PE",
      "strike": 19000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49848",
      "symbol": "NIFTY-Apr2026-19050-CE",
      "strike": 19050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49849",
      "symbol": "NIFTY-Apr2026-19050-PE",
      "strike": 19050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49850",
      "symbol": "NIFTY-Apr2026-19100-CE",
      "strike": 19100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49851",
      "symbol": "NIFTY-Apr2026-19100-PE",
      "strike": 19100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49852",
      "symbol": "NIFTY-Apr2026-19150-CE",
      "strike": 19150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "49853",
      "symbol": "NIFTY-Apr2026-19150-PE",
      "strike": 19150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "45295",
      "symbol": "NIFTY-Apr2026-18600-CE",
      "strike": 18600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "45298",
      "symbol": "NIFTY-Apr2026-18600-PE",
      "strike": 18600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "45299",
      "symbol": "NIFTY-Apr2026-18650-CE",
      "strike": 18650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "45300",
      "symbol": "NIFTY-Apr2026-18650-PE",
      "strike": 18650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "45301",
      "symbol": "NIFTY-Apr2026-18700-CE",
      "strike": 18700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "45302",
      "symbol": "NIFTY-Apr2026-18700-PE",
      "strike": 18700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "45303",
      "symbol": "NIFTY-Apr2026-18750-CE",
      "strike": 18750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "45304",
      "symbol": "NIFTY-Apr2026-18750-PE",
      "strike": 18750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "56887",
      "symbol": "NIFTY-Apr2026-18400-CE",
      "strike": 18400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "56888",
      "symbol": "NIFTY-Apr2026-18400-PE",
      "strike": 18400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "56889",
      "symbol": "NIFTY-Apr2026-18450-CE",
      "strike": 18450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "56890",
      "symbol": "NIFTY-Apr2026-18450-PE",
      "strike": 18450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "56891",
      "symbol": "NIFTY-Apr2026-18500-CE",
      "strike": 18500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "56892",
      "symbol": "NIFTY-Apr2026-18500-PE",
      "strike": 18500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "56893",
      "symbol": "NIFTY-Apr2026-18550-CE",
      "strike": 18550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "56894",
      "symbol": "NIFTY-Apr2026-18550-PE",
      "strike": 18550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59493",
      "symbol": "NIFTY-Apr2026-17900-CE",
      "strike": 17900,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59494",
      "symbol": "NIFTY-Apr2026-17900-PE",
      "strike": 17900,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59495",
      "symbol": "NIFTY-Apr2026-17950-CE",
      "strike": 17950,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59496",
      "symbol": "NIFTY-Apr2026-17950-PE",
      "strike": 17950,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59497",
      "symbol": "NIFTY-Apr2026-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59498",
      "symbol": "NIFTY-Apr2026-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59499",
      "symbol": "NIFTY-Apr2026-18050-CE",
      "strike": 18050,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59500",
      "symbol": "NIFTY-Apr2026-18050-PE",
      "strike": 18050,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59501",
      "symbol": "NIFTY-Apr2026-18100-CE",
      "strike": 18100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59502",
      "symbol": "NIFTY-Apr2026-18100-PE",
      "strike": 18100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59503",
      "symbol": "NIFTY-Apr2026-18150-CE",
      "strike": 18150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59504",
      "symbol": "NIFTY-Apr2026-18150-PE",
      "strike": 18150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59505",
      "symbol": "NIFTY-Apr2026-18200-CE",
      "strike": 18200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59506",
      "symbol": "NIFTY-Apr2026-18200-PE",
      "strike": 18200,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59517",
      "symbol": "NIFTY-Apr2026-18250-CE",
      "strike": 18250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59518",
      "symbol": "NIFTY-Apr2026-18250-PE",
      "strike": 18250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59519",
      "symbol": "NIFTY-Apr2026-18300-CE",
      "strike": 18300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59520",
      "symbol": "NIFTY-Apr2026-18300-PE",
      "strike": 18300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59521",
      "symbol": "NIFTY-Apr2026-18350-CE",
      "strike": 18350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "59522",
      "symbol": "NIFTY-Apr2026-18350-PE",
      "strike": 18350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "57870",
      "symbol": "NIFTY-Apr2026-17750-CE",
      "strike": 17750,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "57871",
      "symbol": "NIFTY-Apr2026-17750-PE",
      "strike": 17750,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "57872",
      "symbol": "NIFTY-Apr2026-17800-CE",
      "strike": 17800,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "57873",
      "symbol": "NIFTY-Apr2026-17800-PE",
      "strike": 17800,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "57874",
      "symbol": "NIFTY-Apr2026-17850-CE",
      "strike": 17850,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "57875",
      "symbol": "NIFTY-Apr2026-17850-PE",
      "strike": 17850,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65856",
      "symbol": "NIFTY-Apr2026-17250-CE",
      "strike": 17250,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65857",
      "symbol": "NIFTY-Apr2026-17250-PE",
      "strike": 17250,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65862",
      "symbol": "NIFTY-Apr2026-17300-CE",
      "strike": 17300,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65863",
      "symbol": "NIFTY-Apr2026-17300-PE",
      "strike": 17300,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65864",
      "symbol": "NIFTY-Apr2026-17350-CE",
      "strike": 17350,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65865",
      "symbol": "NIFTY-Apr2026-17350-PE",
      "strike": 17350,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65866",
      "symbol": "NIFTY-Apr2026-17400-CE",
      "strike": 17400,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65869",
      "symbol": "NIFTY-Apr2026-17400-PE",
      "strike": 17400,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65870",
      "symbol": "NIFTY-Apr2026-17450-CE",
      "strike": 17450,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65877",
      "symbol": "NIFTY-Apr2026-17450-PE",
      "strike": 17450,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65878",
      "symbol": "NIFTY-Apr2026-17500-CE",
      "strike": 17500,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65885",
      "symbol": "NIFTY-Apr2026-17500-PE",
      "strike": 17500,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65886",
      "symbol": "NIFTY-Apr2026-17550-CE",
      "strike": 17550,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65889",
      "symbol": "NIFTY-Apr2026-17550-PE",
      "strike": 17550,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65890",
      "symbol": "NIFTY-Apr2026-17600-CE",
      "strike": 17600,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65895",
      "symbol": "NIFTY-Apr2026-17600-PE",
      "strike": 17600,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65898",
      "symbol": "NIFTY-Apr2026-17650-CE",
      "strike": 17650,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65902",
      "symbol": "NIFTY-Apr2026-17650-PE",
      "strike": 17650,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65908",
      "symbol": "NIFTY-Apr2026-17700-CE",
      "strike": 17700,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "65909",
      "symbol": "NIFTY-Apr2026-17700-PE",
      "strike": 17700,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "78885",
      "symbol": "NIFTY-Apr2026-17100-CE",
      "strike": 17100,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "78892",
      "symbol": "NIFTY-Apr2026-17100-PE",
      "strike": 17100,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "78895",
      "symbol": "NIFTY-Apr2026-17150-CE",
      "strike": 17150,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "78896",
      "symbol": "NIFTY-Apr2026-17150-PE",
      "strike": 17150,
      "type": "PE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "78899",
      "symbol": "NIFTY-Apr2026-17200-CE",
      "strike": 17200,
      "type": "CE",
      "expiry": "2026-04-28"
    },
    {
      "security_id": "78900",
      "symbol": "NIFTY-Apr2026-17200-PE",
      "strike": 17200,
      "type": "PE",
      "expiry": "2026-04-28"
    }
  ],
  "2026-05-26": [
    {
      "security_id": "71703",
      "symbol": "NIFTY-May2026-20350-CE",
      "strike": 20350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71704",
      "symbol": "NIFTY-May2026-20350-PE",
      "strike": 20350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71705",
      "symbol": "NIFTY-May2026-20400-CE",
      "strike": 20400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71710",
      "symbol": "NIFTY-May2026-20400-PE",
      "strike": 20400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71711",
      "symbol": "NIFTY-May2026-20450-CE",
      "strike": 20450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71714",
      "symbol": "NIFTY-May2026-20450-PE",
      "strike": 20450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71715",
      "symbol": "NIFTY-May2026-20500-CE",
      "strike": 20500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71716",
      "symbol": "NIFTY-May2026-20500-PE",
      "strike": 20500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71717",
      "symbol": "NIFTY-May2026-20550-CE",
      "strike": 20550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71718",
      "symbol": "NIFTY-May2026-20550-PE",
      "strike": 20550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71719",
      "symbol": "NIFTY-May2026-20600-CE",
      "strike": 20600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71720",
      "symbol": "NIFTY-May2026-20600-PE",
      "strike": 20600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71721",
      "symbol": "NIFTY-May2026-20650-CE",
      "strike": 20650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71722",
      "symbol": "NIFTY-May2026-20650-PE",
      "strike": 20650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71723",
      "symbol": "NIFTY-May2026-20700-CE",
      "strike": 20700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71724",
      "symbol": "NIFTY-May2026-20700-PE",
      "strike": 20700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71725",
      "symbol": "NIFTY-May2026-20750-CE",
      "strike": 20750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71726",
      "symbol": "NIFTY-May2026-20750-PE",
      "strike": 20750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71727",
      "symbol": "NIFTY-May2026-20800-CE",
      "strike": 20800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71728",
      "symbol": "NIFTY-May2026-20800-PE",
      "strike": 20800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71729",
      "symbol": "NIFTY-May2026-20850-CE",
      "strike": 20850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71730",
      "symbol": "NIFTY-May2026-20850-PE",
      "strike": 20850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71731",
      "symbol": "NIFTY-May2026-20900-CE",
      "strike": 20900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71732",
      "symbol": "NIFTY-May2026-20900-PE",
      "strike": 20900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71733",
      "symbol": "NIFTY-May2026-20950-CE",
      "strike": 20950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71734",
      "symbol": "NIFTY-May2026-20950-PE",
      "strike": 20950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71735",
      "symbol": "NIFTY-May2026-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71736",
      "symbol": "NIFTY-May2026-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71737",
      "symbol": "NIFTY-May2026-21050-CE",
      "strike": 21050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71738",
      "symbol": "NIFTY-May2026-21050-PE",
      "strike": 21050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71739",
      "symbol": "NIFTY-May2026-21100-CE",
      "strike": 21100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71740",
      "symbol": "NIFTY-May2026-21100-PE",
      "strike": 21100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71741",
      "symbol": "NIFTY-May2026-21150-CE",
      "strike": 21150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71742",
      "symbol": "NIFTY-May2026-21150-PE",
      "strike": 21150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71745",
      "symbol": "NIFTY-May2026-21200-CE",
      "strike": 21200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71746",
      "symbol": "NIFTY-May2026-21200-PE",
      "strike": 21200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71747",
      "symbol": "NIFTY-May2026-21250-CE",
      "strike": 21250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71748",
      "symbol": "NIFTY-May2026-21250-PE",
      "strike": 21250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71753",
      "symbol": "NIFTY-May2026-21300-CE",
      "strike": 21300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71754",
      "symbol": "NIFTY-May2026-21300-PE",
      "strike": 21300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72470",
      "symbol": "NIFTY-May2026-26400-CE",
      "strike": 26400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72471",
      "symbol": "NIFTY-May2026-26400-PE",
      "strike": 26400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71761",
      "symbol": "NIFTY-May2026-21350-CE",
      "strike": 21350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71762",
      "symbol": "NIFTY-May2026-21350-PE",
      "strike": 21350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71763",
      "symbol": "NIFTY-May2026-21400-CE",
      "strike": 21400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71764",
      "symbol": "NIFTY-May2026-21400-PE",
      "strike": 21400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71765",
      "symbol": "NIFTY-May2026-21450-CE",
      "strike": 21450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71766",
      "symbol": "NIFTY-May2026-21450-PE",
      "strike": 21450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71767",
      "symbol": "NIFTY-May2026-21500-CE",
      "strike": 21500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71768",
      "symbol": "NIFTY-May2026-21500-PE",
      "strike": 21500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71769",
      "symbol": "NIFTY-May2026-21550-CE",
      "strike": 21550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71770",
      "symbol": "NIFTY-May2026-21550-PE",
      "strike": 21550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71771",
      "symbol": "NIFTY-May2026-21600-CE",
      "strike": 21600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71772",
      "symbol": "NIFTY-May2026-21600-PE",
      "strike": 21600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71778",
      "symbol": "NIFTY-May2026-21650-CE",
      "strike": 21650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72577",
      "symbol": "NIFTY-May2026-26450-CE",
      "strike": 26450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71779",
      "symbol": "NIFTY-May2026-21650-PE",
      "strike": 21650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72578",
      "symbol": "NIFTY-May2026-26450-PE",
      "strike": 26450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71780",
      "symbol": "NIFTY-May2026-21700-CE",
      "strike": 21700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72579",
      "symbol": "NIFTY-May2026-26500-CE",
      "strike": 26500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71781",
      "symbol": "NIFTY-May2026-21700-PE",
      "strike": 21700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72592",
      "symbol": "NIFTY-May2026-26500-PE",
      "strike": 26500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71782",
      "symbol": "NIFTY-May2026-21750-CE",
      "strike": 21750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72593",
      "symbol": "NIFTY-May2026-26550-CE",
      "strike": 26550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71783",
      "symbol": "NIFTY-May2026-21750-PE",
      "strike": 21750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72596",
      "symbol": "NIFTY-May2026-26550-PE",
      "strike": 26550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71784",
      "symbol": "NIFTY-May2026-21800-CE",
      "strike": 21800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72597",
      "symbol": "NIFTY-May2026-26600-CE",
      "strike": 26600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71785",
      "symbol": "NIFTY-May2026-21800-PE",
      "strike": 21800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72598",
      "symbol": "NIFTY-May2026-26600-PE",
      "strike": 26600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71786",
      "symbol": "NIFTY-May2026-21850-CE",
      "strike": 21850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72599",
      "symbol": "NIFTY-May2026-26650-CE",
      "strike": 26650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71787",
      "symbol": "NIFTY-May2026-21850-PE",
      "strike": 21850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72600",
      "symbol": "NIFTY-May2026-26650-PE",
      "strike": 26650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71788",
      "symbol": "NIFTY-May2026-21900-CE",
      "strike": 21900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72601",
      "symbol": "NIFTY-May2026-26700-CE",
      "strike": 26700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71789",
      "symbol": "NIFTY-May2026-21900-PE",
      "strike": 21900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71790",
      "symbol": "NIFTY-May2026-21950-CE",
      "strike": 21950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72602",
      "symbol": "NIFTY-May2026-26700-PE",
      "strike": 26700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72603",
      "symbol": "NIFTY-May2026-26750-CE",
      "strike": 26750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71792",
      "symbol": "NIFTY-May2026-21950-PE",
      "strike": 21950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72604",
      "symbol": "NIFTY-May2026-26750-PE",
      "strike": 26750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71793",
      "symbol": "NIFTY-May2026-22000-CE",
      "strike": 22000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72605",
      "symbol": "NIFTY-May2026-26800-CE",
      "strike": 26800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72606",
      "symbol": "NIFTY-May2026-26800-PE",
      "strike": 26800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72607",
      "symbol": "NIFTY-May2026-26850-CE",
      "strike": 26850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72608",
      "symbol": "NIFTY-May2026-26850-PE",
      "strike": 26850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72615",
      "symbol": "NIFTY-May2026-26900-CE",
      "strike": 26900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72616",
      "symbol": "NIFTY-May2026-26900-PE",
      "strike": 26900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71799",
      "symbol": "NIFTY-May2026-22000-PE",
      "strike": 22000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72617",
      "symbol": "NIFTY-May2026-26950-CE",
      "strike": 26950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72618",
      "symbol": "NIFTY-May2026-26950-PE",
      "strike": 26950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72619",
      "symbol": "NIFTY-May2026-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72620",
      "symbol": "NIFTY-May2026-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72621",
      "symbol": "NIFTY-May2026-27050-CE",
      "strike": 27050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72622",
      "symbol": "NIFTY-May2026-27050-PE",
      "strike": 27050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72623",
      "symbol": "NIFTY-May2026-27100-CE",
      "strike": 27100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72624",
      "symbol": "NIFTY-May2026-27100-PE",
      "strike": 27100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72625",
      "symbol": "NIFTY-May2026-27150-CE",
      "strike": 27150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72626",
      "symbol": "NIFTY-May2026-27150-PE",
      "strike": 27150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72627",
      "symbol": "NIFTY-May2026-27200-CE",
      "strike": 27200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72628",
      "symbol": "NIFTY-May2026-27200-PE",
      "strike": 27200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72629",
      "symbol": "NIFTY-May2026-27250-CE",
      "strike": 27250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72630",
      "symbol": "NIFTY-May2026-27250-PE",
      "strike": 27250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72631",
      "symbol": "NIFTY-May2026-27300-CE",
      "strike": 27300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72632",
      "symbol": "NIFTY-May2026-27300-PE",
      "strike": 27300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72633",
      "symbol": "NIFTY-May2026-27350-CE",
      "strike": 27350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72634",
      "symbol": "NIFTY-May2026-27350-PE",
      "strike": 27350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72635",
      "symbol": "NIFTY-May2026-27400-CE",
      "strike": 27400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71813",
      "symbol": "NIFTY-May2026-22050-CE",
      "strike": 22050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72636",
      "symbol": "NIFTY-May2026-27400-PE",
      "strike": 27400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72637",
      "symbol": "NIFTY-May2026-27450-CE",
      "strike": 27450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71814",
      "symbol": "NIFTY-May2026-22050-PE",
      "strike": 22050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72638",
      "symbol": "NIFTY-May2026-27450-PE",
      "strike": 27450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72639",
      "symbol": "NIFTY-May2026-27500-CE",
      "strike": 27500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71816",
      "symbol": "NIFTY-May2026-22100-CE",
      "strike": 22100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72640",
      "symbol": "NIFTY-May2026-27500-PE",
      "strike": 27500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71817",
      "symbol": "NIFTY-May2026-22100-PE",
      "strike": 22100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72641",
      "symbol": "NIFTY-May2026-27550-CE",
      "strike": 27550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71818",
      "symbol": "NIFTY-May2026-22150-CE",
      "strike": 22150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72642",
      "symbol": "NIFTY-May2026-27550-PE",
      "strike": 27550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71819",
      "symbol": "NIFTY-May2026-22150-PE",
      "strike": 22150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72643",
      "symbol": "NIFTY-May2026-27600-CE",
      "strike": 27600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71820",
      "symbol": "NIFTY-May2026-22200-CE",
      "strike": 22200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72644",
      "symbol": "NIFTY-May2026-27600-PE",
      "strike": 27600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71821",
      "symbol": "NIFTY-May2026-22200-PE",
      "strike": 22200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72645",
      "symbol": "NIFTY-May2026-27650-CE",
      "strike": 27650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72646",
      "symbol": "NIFTY-May2026-27650-PE",
      "strike": 27650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72647",
      "symbol": "NIFTY-May2026-27700-CE",
      "strike": 27700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72648",
      "symbol": "NIFTY-May2026-27700-PE",
      "strike": 27700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72649",
      "symbol": "NIFTY-May2026-27750-CE",
      "strike": 27750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72650",
      "symbol": "NIFTY-May2026-27750-PE",
      "strike": 27750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72651",
      "symbol": "NIFTY-May2026-27800-CE",
      "strike": 27800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72652",
      "symbol": "NIFTY-May2026-27800-PE",
      "strike": 27800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72653",
      "symbol": "NIFTY-May2026-27850-CE",
      "strike": 27850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72654",
      "symbol": "NIFTY-May2026-27850-PE",
      "strike": 27850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72655",
      "symbol": "NIFTY-May2026-27900-CE",
      "strike": 27900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71832",
      "symbol": "NIFTY-May2026-22250-CE",
      "strike": 22250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72656",
      "symbol": "NIFTY-May2026-27900-PE",
      "strike": 27900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71833",
      "symbol": "NIFTY-May2026-22250-PE",
      "strike": 22250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72657",
      "symbol": "NIFTY-May2026-27950-CE",
      "strike": 27950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72658",
      "symbol": "NIFTY-May2026-27950-PE",
      "strike": 27950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72659",
      "symbol": "NIFTY-May2026-28000-CE",
      "strike": 28000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71836",
      "symbol": "NIFTY-May2026-22300-CE",
      "strike": 22300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72660",
      "symbol": "NIFTY-May2026-28000-PE",
      "strike": 28000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72661",
      "symbol": "NIFTY-May2026-28050-CE",
      "strike": 28050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71837",
      "symbol": "NIFTY-May2026-22300-PE",
      "strike": 22300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72662",
      "symbol": "NIFTY-May2026-28050-PE",
      "strike": 28050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71838",
      "symbol": "NIFTY-May2026-22350-CE",
      "strike": 22350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71839",
      "symbol": "NIFTY-May2026-22350-PE",
      "strike": 22350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71840",
      "symbol": "NIFTY-May2026-22400-CE",
      "strike": 22400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71841",
      "symbol": "NIFTY-May2026-22400-PE",
      "strike": 22400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71848",
      "symbol": "NIFTY-May2026-22450-CE",
      "strike": 22450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71849",
      "symbol": "NIFTY-May2026-22450-PE",
      "strike": 22450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72691",
      "symbol": "NIFTY-May2026-28100-CE",
      "strike": 28100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72692",
      "symbol": "NIFTY-May2026-28100-PE",
      "strike": 28100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72714",
      "symbol": "NIFTY-May2026-28150-CE",
      "strike": 28150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72715",
      "symbol": "NIFTY-May2026-28150-PE",
      "strike": 28150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72716",
      "symbol": "NIFTY-May2026-28200-CE",
      "strike": 28200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72717",
      "symbol": "NIFTY-May2026-28200-PE",
      "strike": 28200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71859",
      "symbol": "NIFTY-May2026-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71860",
      "symbol": "NIFTY-May2026-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71867",
      "symbol": "NIFTY-May2026-22550-CE",
      "strike": 22550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71868",
      "symbol": "NIFTY-May2026-22550-PE",
      "strike": 22550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71869",
      "symbol": "NIFTY-May2026-22600-CE",
      "strike": 22600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71870",
      "symbol": "NIFTY-May2026-22600-PE",
      "strike": 22600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72735",
      "symbol": "NIFTY-May2026-28250-CE",
      "strike": 28250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72736",
      "symbol": "NIFTY-May2026-28250-PE",
      "strike": 28250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72737",
      "symbol": "NIFTY-May2026-28300-CE",
      "strike": 28300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72738",
      "symbol": "NIFTY-May2026-28300-PE",
      "strike": 28300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71877",
      "symbol": "NIFTY-May2026-22650-CE",
      "strike": 22650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71878",
      "symbol": "NIFTY-May2026-22650-PE",
      "strike": 22650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71879",
      "symbol": "NIFTY-May2026-22700-CE",
      "strike": 22700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71880",
      "symbol": "NIFTY-May2026-22700-PE",
      "strike": 22700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71881",
      "symbol": "NIFTY-May2026-22750-CE",
      "strike": 22750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71882",
      "symbol": "NIFTY-May2026-22750-PE",
      "strike": 22750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71883",
      "symbol": "NIFTY-May2026-22800-CE",
      "strike": 22800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72749",
      "symbol": "NIFTY-May2026-28350-CE",
      "strike": 28350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71884",
      "symbol": "NIFTY-May2026-22800-PE",
      "strike": 22800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71885",
      "symbol": "NIFTY-May2026-22850-CE",
      "strike": 22850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71886",
      "symbol": "NIFTY-May2026-22850-PE",
      "strike": 22850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72752",
      "symbol": "NIFTY-May2026-28350-PE",
      "strike": 28350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71887",
      "symbol": "NIFTY-May2026-22900-CE",
      "strike": 22900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71888",
      "symbol": "NIFTY-May2026-22900-PE",
      "strike": 22900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71889",
      "symbol": "NIFTY-May2026-22950-CE",
      "strike": 22950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71890",
      "symbol": "NIFTY-May2026-22950-PE",
      "strike": 22950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71891",
      "symbol": "NIFTY-May2026-23000-CE",
      "strike": 23000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71892",
      "symbol": "NIFTY-May2026-23000-PE",
      "strike": 23000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71895",
      "symbol": "NIFTY-May2026-23050-CE",
      "strike": 23050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71896",
      "symbol": "NIFTY-May2026-23050-PE",
      "strike": 23050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71919",
      "symbol": "NIFTY-May2026-23100-CE",
      "strike": 23100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71920",
      "symbol": "NIFTY-May2026-23100-PE",
      "strike": 23100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72753",
      "symbol": "NIFTY-May2026-28400-CE",
      "strike": 28400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72757",
      "symbol": "NIFTY-May2026-28400-PE",
      "strike": 28400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72758",
      "symbol": "NIFTY-May2026-28450-CE",
      "strike": 28450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72765",
      "symbol": "NIFTY-May2026-28450-PE",
      "strike": 28450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72766",
      "symbol": "NIFTY-May2026-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72767",
      "symbol": "NIFTY-May2026-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72768",
      "symbol": "NIFTY-May2026-28550-CE",
      "strike": 28550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72769",
      "symbol": "NIFTY-May2026-28550-PE",
      "strike": 28550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71941",
      "symbol": "NIFTY-May2026-23150-CE",
      "strike": 23150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72774",
      "symbol": "NIFTY-May2026-28600-CE",
      "strike": 28600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71942",
      "symbol": "NIFTY-May2026-23150-PE",
      "strike": 23150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72778",
      "symbol": "NIFTY-May2026-28600-PE",
      "strike": 28600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72779",
      "symbol": "NIFTY-May2026-28650-CE",
      "strike": 28650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72787",
      "symbol": "NIFTY-May2026-28650-PE",
      "strike": 28650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72789",
      "symbol": "NIFTY-May2026-28700-CE",
      "strike": 28700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72791",
      "symbol": "NIFTY-May2026-28700-PE",
      "strike": 28700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72792",
      "symbol": "NIFTY-May2026-28750-CE",
      "strike": 28750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72793",
      "symbol": "NIFTY-May2026-28750-PE",
      "strike": 28750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72794",
      "symbol": "NIFTY-May2026-28800-CE",
      "strike": 28800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71977",
      "symbol": "NIFTY-May2026-23200-CE",
      "strike": 23200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72795",
      "symbol": "NIFTY-May2026-28800-PE",
      "strike": 28800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71978",
      "symbol": "NIFTY-May2026-23200-PE",
      "strike": 23200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72796",
      "symbol": "NIFTY-May2026-28850-CE",
      "strike": 28850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71979",
      "symbol": "NIFTY-May2026-23250-CE",
      "strike": 23250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72797",
      "symbol": "NIFTY-May2026-28850-PE",
      "strike": 28850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71980",
      "symbol": "NIFTY-May2026-23250-PE",
      "strike": 23250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72798",
      "symbol": "NIFTY-May2026-28900-CE",
      "strike": 28900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71981",
      "symbol": "NIFTY-May2026-23300-CE",
      "strike": 23300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72799",
      "symbol": "NIFTY-May2026-28900-PE",
      "strike": 28900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71982",
      "symbol": "NIFTY-May2026-23300-PE",
      "strike": 23300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72800",
      "symbol": "NIFTY-May2026-28950-CE",
      "strike": 28950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72013",
      "symbol": "NIFTY-May2026-23350-CE",
      "strike": 23350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72801",
      "symbol": "NIFTY-May2026-28950-PE",
      "strike": 28950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72014",
      "symbol": "NIFTY-May2026-23350-PE",
      "strike": 23350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72802",
      "symbol": "NIFTY-May2026-29000-CE",
      "strike": 29000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72015",
      "symbol": "NIFTY-May2026-23400-CE",
      "strike": 23400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72803",
      "symbol": "NIFTY-May2026-29000-PE",
      "strike": 29000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72016",
      "symbol": "NIFTY-May2026-23400-PE",
      "strike": 23400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72804",
      "symbol": "NIFTY-May2026-29050-CE",
      "strike": 29050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72019",
      "symbol": "NIFTY-May2026-23450-CE",
      "strike": 23450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72805",
      "symbol": "NIFTY-May2026-29050-PE",
      "strike": 29050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72020",
      "symbol": "NIFTY-May2026-23450-PE",
      "strike": 23450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72806",
      "symbol": "NIFTY-May2026-29100-CE",
      "strike": 29100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72807",
      "symbol": "NIFTY-May2026-29100-PE",
      "strike": 29100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72067",
      "symbol": "NIFTY-May2026-23500-CE",
      "strike": 23500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72068",
      "symbol": "NIFTY-May2026-23500-PE",
      "strike": 23500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72814",
      "symbol": "NIFTY-May2026-29150-CE",
      "strike": 29150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72141",
      "symbol": "NIFTY-May2026-23550-CE",
      "strike": 23550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72815",
      "symbol": "NIFTY-May2026-29150-PE",
      "strike": 29150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72816",
      "symbol": "NIFTY-May2026-29200-CE",
      "strike": 29200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72142",
      "symbol": "NIFTY-May2026-23550-PE",
      "strike": 23550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72817",
      "symbol": "NIFTY-May2026-29200-PE",
      "strike": 29200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72143",
      "symbol": "NIFTY-May2026-23600-CE",
      "strike": 23600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72147",
      "symbol": "NIFTY-May2026-23600-PE",
      "strike": 23600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72820",
      "symbol": "NIFTY-May2026-29250-CE",
      "strike": 29250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72823",
      "symbol": "NIFTY-May2026-29250-PE",
      "strike": 29250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72824",
      "symbol": "NIFTY-May2026-29300-CE",
      "strike": 29300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72825",
      "symbol": "NIFTY-May2026-29300-PE",
      "strike": 29300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72165",
      "symbol": "NIFTY-May2026-23650-CE",
      "strike": 23650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72826",
      "symbol": "NIFTY-May2026-29350-CE",
      "strike": 29350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72166",
      "symbol": "NIFTY-May2026-23650-PE",
      "strike": 23650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72827",
      "symbol": "NIFTY-May2026-29350-PE",
      "strike": 29350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72167",
      "symbol": "NIFTY-May2026-23700-CE",
      "strike": 23700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72828",
      "symbol": "NIFTY-May2026-29400-CE",
      "strike": 29400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72168",
      "symbol": "NIFTY-May2026-23700-PE",
      "strike": 23700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72169",
      "symbol": "NIFTY-May2026-23750-CE",
      "strike": 23750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72170",
      "symbol": "NIFTY-May2026-23750-PE",
      "strike": 23750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72171",
      "symbol": "NIFTY-May2026-23800-CE",
      "strike": 23800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72833",
      "symbol": "NIFTY-May2026-29400-PE",
      "strike": 29400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72172",
      "symbol": "NIFTY-May2026-23800-PE",
      "strike": 23800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72834",
      "symbol": "NIFTY-May2026-29450-CE",
      "strike": 29450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72173",
      "symbol": "NIFTY-May2026-23850-CE",
      "strike": 23850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72835",
      "symbol": "NIFTY-May2026-29450-PE",
      "strike": 29450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72174",
      "symbol": "NIFTY-May2026-23850-PE",
      "strike": 23850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72175",
      "symbol": "NIFTY-May2026-23900-CE",
      "strike": 23900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72176",
      "symbol": "NIFTY-May2026-23900-PE",
      "strike": 23900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72843",
      "symbol": "NIFTY-May2026-29500-CE",
      "strike": 29500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72177",
      "symbol": "NIFTY-May2026-23950-CE",
      "strike": 23950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72844",
      "symbol": "NIFTY-May2026-29500-PE",
      "strike": 29500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72178",
      "symbol": "NIFTY-May2026-23950-PE",
      "strike": 23950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72845",
      "symbol": "NIFTY-May2026-29550-CE",
      "strike": 29550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72179",
      "symbol": "NIFTY-May2026-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72846",
      "symbol": "NIFTY-May2026-29550-PE",
      "strike": 29550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72180",
      "symbol": "NIFTY-May2026-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72930",
      "symbol": "NIFTY-May2026-29600-CE",
      "strike": 29600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72181",
      "symbol": "NIFTY-May2026-24050-CE",
      "strike": 24050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72931",
      "symbol": "NIFTY-May2026-29600-PE",
      "strike": 29600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72182",
      "symbol": "NIFTY-May2026-24050-PE",
      "strike": 24050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72933",
      "symbol": "NIFTY-May2026-29650-CE",
      "strike": 29650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72183",
      "symbol": "NIFTY-May2026-24100-CE",
      "strike": 24100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72934",
      "symbol": "NIFTY-May2026-29650-PE",
      "strike": 29650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72184",
      "symbol": "NIFTY-May2026-24100-PE",
      "strike": 24100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72935",
      "symbol": "NIFTY-May2026-29700-CE",
      "strike": 29700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72185",
      "symbol": "NIFTY-May2026-24150-CE",
      "strike": 24150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72186",
      "symbol": "NIFTY-May2026-24150-PE",
      "strike": 24150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72936",
      "symbol": "NIFTY-May2026-29700-PE",
      "strike": 29700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72187",
      "symbol": "NIFTY-May2026-24200-CE",
      "strike": 24200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72937",
      "symbol": "NIFTY-May2026-29750-CE",
      "strike": 29750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72188",
      "symbol": "NIFTY-May2026-24200-PE",
      "strike": 24200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72938",
      "symbol": "NIFTY-May2026-29750-PE",
      "strike": 29750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72939",
      "symbol": "NIFTY-May2026-29800-CE",
      "strike": 29800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72940",
      "symbol": "NIFTY-May2026-29800-PE",
      "strike": 29800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72941",
      "symbol": "NIFTY-May2026-29850-CE",
      "strike": 29850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72942",
      "symbol": "NIFTY-May2026-29850-PE",
      "strike": 29850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72943",
      "symbol": "NIFTY-May2026-29900-CE",
      "strike": 29900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72944",
      "symbol": "NIFTY-May2026-29900-PE",
      "strike": 29900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72945",
      "symbol": "NIFTY-May2026-29950-CE",
      "strike": 29950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72946",
      "symbol": "NIFTY-May2026-29950-PE",
      "strike": 29950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72947",
      "symbol": "NIFTY-May2026-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72948",
      "symbol": "NIFTY-May2026-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72949",
      "symbol": "NIFTY-May2026-30050-CE",
      "strike": 30050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72950",
      "symbol": "NIFTY-May2026-30050-PE",
      "strike": 30050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72951",
      "symbol": "NIFTY-May2026-30100-CE",
      "strike": 30100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72952",
      "symbol": "NIFTY-May2026-30100-PE",
      "strike": 30100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72953",
      "symbol": "NIFTY-May2026-30150-CE",
      "strike": 30150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72954",
      "symbol": "NIFTY-May2026-30150-PE",
      "strike": 30150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72955",
      "symbol": "NIFTY-May2026-30200-CE",
      "strike": 30200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72956",
      "symbol": "NIFTY-May2026-30200-PE",
      "strike": 30200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72957",
      "symbol": "NIFTY-May2026-30250-CE",
      "strike": 30250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72958",
      "symbol": "NIFTY-May2026-30250-PE",
      "strike": 30250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72959",
      "symbol": "NIFTY-May2026-30300-CE",
      "strike": 30300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72960",
      "symbol": "NIFTY-May2026-30300-PE",
      "strike": 30300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72961",
      "symbol": "NIFTY-May2026-30350-CE",
      "strike": 30350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72962",
      "symbol": "NIFTY-May2026-30350-PE",
      "strike": 30350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72963",
      "symbol": "NIFTY-May2026-30400-CE",
      "strike": 30400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72964",
      "symbol": "NIFTY-May2026-30400-PE",
      "strike": 30400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72965",
      "symbol": "NIFTY-May2026-30450-CE",
      "strike": 30450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72966",
      "symbol": "NIFTY-May2026-30450-PE",
      "strike": 30450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72967",
      "symbol": "NIFTY-May2026-30500-CE",
      "strike": 30500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72968",
      "symbol": "NIFTY-May2026-30500-PE",
      "strike": 30500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72971",
      "symbol": "NIFTY-May2026-30550-CE",
      "strike": 30550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72972",
      "symbol": "NIFTY-May2026-30550-PE",
      "strike": 30550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72973",
      "symbol": "NIFTY-May2026-30600-CE",
      "strike": 30600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72974",
      "symbol": "NIFTY-May2026-30600-PE",
      "strike": 30600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72975",
      "symbol": "NIFTY-May2026-30650-CE",
      "strike": 30650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72976",
      "symbol": "NIFTY-May2026-30650-PE",
      "strike": 30650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72237",
      "symbol": "NIFTY-May2026-24250-CE",
      "strike": 24250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72238",
      "symbol": "NIFTY-May2026-24250-PE",
      "strike": 24250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72239",
      "symbol": "NIFTY-May2026-24300-CE",
      "strike": 24300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72240",
      "symbol": "NIFTY-May2026-24300-PE",
      "strike": 24300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72241",
      "symbol": "NIFTY-May2026-24350-CE",
      "strike": 24350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72242",
      "symbol": "NIFTY-May2026-24350-PE",
      "strike": 24350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72243",
      "symbol": "NIFTY-May2026-24400-CE",
      "strike": 24400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72247",
      "symbol": "NIFTY-May2026-24400-PE",
      "strike": 24400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72273",
      "symbol": "NIFTY-May2026-24450-CE",
      "strike": 24450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72274",
      "symbol": "NIFTY-May2026-24450-PE",
      "strike": 24450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72275",
      "symbol": "NIFTY-May2026-24500-CE",
      "strike": 24500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72276",
      "symbol": "NIFTY-May2026-24500-PE",
      "strike": 24500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72280",
      "symbol": "NIFTY-May2026-24550-CE",
      "strike": 24550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72281",
      "symbol": "NIFTY-May2026-24550-PE",
      "strike": 24550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72282",
      "symbol": "NIFTY-May2026-24600-CE",
      "strike": 24600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72283",
      "symbol": "NIFTY-May2026-24600-PE",
      "strike": 24600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72284",
      "symbol": "NIFTY-May2026-24650-CE",
      "strike": 24650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72285",
      "symbol": "NIFTY-May2026-24650-PE",
      "strike": 24650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72286",
      "symbol": "NIFTY-May2026-24700-CE",
      "strike": 24700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72287",
      "symbol": "NIFTY-May2026-24700-PE",
      "strike": 24700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72288",
      "symbol": "NIFTY-May2026-24750-CE",
      "strike": 24750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72289",
      "symbol": "NIFTY-May2026-24750-PE",
      "strike": 24750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72290",
      "symbol": "NIFTY-May2026-24800-CE",
      "strike": 24800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72291",
      "symbol": "NIFTY-May2026-24800-PE",
      "strike": 24800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72292",
      "symbol": "NIFTY-May2026-24850-CE",
      "strike": 24850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72293",
      "symbol": "NIFTY-May2026-24850-PE",
      "strike": 24850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72294",
      "symbol": "NIFTY-May2026-24900-CE",
      "strike": 24900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72295",
      "symbol": "NIFTY-May2026-24900-PE",
      "strike": 24900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72296",
      "symbol": "NIFTY-May2026-24950-CE",
      "strike": 24950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72297",
      "symbol": "NIFTY-May2026-24950-PE",
      "strike": 24950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72298",
      "symbol": "NIFTY-May2026-25000-CE",
      "strike": 25000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72299",
      "symbol": "NIFTY-May2026-25000-PE",
      "strike": 25000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72300",
      "symbol": "NIFTY-May2026-25050-CE",
      "strike": 25050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72301",
      "symbol": "NIFTY-May2026-25050-PE",
      "strike": 25050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72302",
      "symbol": "NIFTY-May2026-25100-CE",
      "strike": 25100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72303",
      "symbol": "NIFTY-May2026-25100-PE",
      "strike": 25100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72304",
      "symbol": "NIFTY-May2026-25150-CE",
      "strike": 25150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72305",
      "symbol": "NIFTY-May2026-25150-PE",
      "strike": 25150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72306",
      "symbol": "NIFTY-May2026-25200-CE",
      "strike": 25200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72307",
      "symbol": "NIFTY-May2026-25200-PE",
      "strike": 25200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72308",
      "symbol": "NIFTY-May2026-25250-CE",
      "strike": 25250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72309",
      "symbol": "NIFTY-May2026-25250-PE",
      "strike": 25250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72310",
      "symbol": "NIFTY-May2026-25300-CE",
      "strike": 25300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72313",
      "symbol": "NIFTY-May2026-25300-PE",
      "strike": 25300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72314",
      "symbol": "NIFTY-May2026-25350-CE",
      "strike": 25350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72315",
      "symbol": "NIFTY-May2026-25350-PE",
      "strike": 25350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72318",
      "symbol": "NIFTY-May2026-25400-CE",
      "strike": 25400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72319",
      "symbol": "NIFTY-May2026-25400-PE",
      "strike": 25400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72320",
      "symbol": "NIFTY-May2026-25450-CE",
      "strike": 25450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72321",
      "symbol": "NIFTY-May2026-25450-PE",
      "strike": 25450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72340",
      "symbol": "NIFTY-May2026-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72344",
      "symbol": "NIFTY-May2026-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72345",
      "symbol": "NIFTY-May2026-25550-CE",
      "strike": 25550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72351",
      "symbol": "NIFTY-May2026-25550-PE",
      "strike": 25550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72352",
      "symbol": "NIFTY-May2026-25600-CE",
      "strike": 25600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72356",
      "symbol": "NIFTY-May2026-25600-PE",
      "strike": 25600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72358",
      "symbol": "NIFTY-May2026-25650-CE",
      "strike": 25650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72360",
      "symbol": "NIFTY-May2026-25650-PE",
      "strike": 25650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72363",
      "symbol": "NIFTY-May2026-25700-CE",
      "strike": 25700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72364",
      "symbol": "NIFTY-May2026-25700-PE",
      "strike": 25700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72371",
      "symbol": "NIFTY-May2026-25750-CE",
      "strike": 25750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72372",
      "symbol": "NIFTY-May2026-25750-PE",
      "strike": 25750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72373",
      "symbol": "NIFTY-May2026-25800-CE",
      "strike": 25800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72374",
      "symbol": "NIFTY-May2026-25800-PE",
      "strike": 25800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72375",
      "symbol": "NIFTY-May2026-25850-CE",
      "strike": 25850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72376",
      "symbol": "NIFTY-May2026-25850-PE",
      "strike": 25850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72377",
      "symbol": "NIFTY-May2026-25900-CE",
      "strike": 25900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72378",
      "symbol": "NIFTY-May2026-25900-PE",
      "strike": 25900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72379",
      "symbol": "NIFTY-May2026-25950-CE",
      "strike": 25950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72380",
      "symbol": "NIFTY-May2026-25950-PE",
      "strike": 25950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72381",
      "symbol": "NIFTY-May2026-26000-CE",
      "strike": 26000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72382",
      "symbol": "NIFTY-May2026-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72386",
      "symbol": "NIFTY-May2026-26050-CE",
      "strike": 26050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72387",
      "symbol": "NIFTY-May2026-26050-PE",
      "strike": 26050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72388",
      "symbol": "NIFTY-May2026-26100-CE",
      "strike": 26100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72389",
      "symbol": "NIFTY-May2026-26100-PE",
      "strike": 26100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72390",
      "symbol": "NIFTY-May2026-26150-CE",
      "strike": 26150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72391",
      "symbol": "NIFTY-May2026-26150-PE",
      "strike": 26150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72392",
      "symbol": "NIFTY-May2026-26200-CE",
      "strike": 26200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72393",
      "symbol": "NIFTY-May2026-26200-PE",
      "strike": 26200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71663",
      "symbol": "NIFTY-May2026-20150-CE",
      "strike": 20150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71664",
      "symbol": "NIFTY-May2026-20150-PE",
      "strike": 20150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71665",
      "symbol": "NIFTY-May2026-20200-CE",
      "strike": 20200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71666",
      "symbol": "NIFTY-May2026-20200-PE",
      "strike": 20200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71667",
      "symbol": "NIFTY-May2026-20250-CE",
      "strike": 20250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71700",
      "symbol": "NIFTY-May2026-20250-PE",
      "strike": 20250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71701",
      "symbol": "NIFTY-May2026-20300-CE",
      "strike": 20300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "71702",
      "symbol": "NIFTY-May2026-20300-PE",
      "strike": 20300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72450",
      "symbol": "NIFTY-May2026-26250-CE",
      "strike": 26250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72451",
      "symbol": "NIFTY-May2026-26250-PE",
      "strike": 26250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72452",
      "symbol": "NIFTY-May2026-26300-CE",
      "strike": 26300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72453",
      "symbol": "NIFTY-May2026-26300-PE",
      "strike": 26300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72454",
      "symbol": "NIFTY-May2026-26350-CE",
      "strike": 26350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "72455",
      "symbol": "NIFTY-May2026-26350-PE",
      "strike": 26350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "35036",
      "symbol": "NIFTY-May2026-30700-CE",
      "strike": 30700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "35037",
      "symbol": "NIFTY-May2026-30700-PE",
      "strike": 30700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "35038",
      "symbol": "NIFTY-May2026-30750-CE",
      "strike": 30750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "35039",
      "symbol": "NIFTY-May2026-30750-PE",
      "strike": 30750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "38389",
      "symbol": "NIFTY-May2026-19950-CE",
      "strike": 19950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "38390",
      "symbol": "NIFTY-May2026-19950-PE",
      "strike": 19950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "38395",
      "symbol": "NIFTY-May2026-20000-CE",
      "strike": 20000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "38396",
      "symbol": "NIFTY-May2026-20000-PE",
      "strike": 20000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "38403",
      "symbol": "NIFTY-May2026-20050-CE",
      "strike": 20050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "38404",
      "symbol": "NIFTY-May2026-20050-PE",
      "strike": 20050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "38406",
      "symbol": "NIFTY-May2026-20100-CE",
      "strike": 20100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "38407",
      "symbol": "NIFTY-May2026-20100-PE",
      "strike": 20100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41275",
      "symbol": "NIFTY-May2026-19600-CE",
      "strike": 19600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41276",
      "symbol": "NIFTY-May2026-19600-PE",
      "strike": 19600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41277",
      "symbol": "NIFTY-May2026-19650-CE",
      "strike": 19650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41278",
      "symbol": "NIFTY-May2026-19650-PE",
      "strike": 19650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41279",
      "symbol": "NIFTY-May2026-19700-CE",
      "strike": 19700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41280",
      "symbol": "NIFTY-May2026-19700-PE",
      "strike": 19700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41281",
      "symbol": "NIFTY-May2026-19750-CE",
      "strike": 19750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41282",
      "symbol": "NIFTY-May2026-19750-PE",
      "strike": 19750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41283",
      "symbol": "NIFTY-May2026-19800-CE",
      "strike": 19800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41284",
      "symbol": "NIFTY-May2026-19800-PE",
      "strike": 19800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41285",
      "symbol": "NIFTY-May2026-19850-CE",
      "strike": 19850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41286",
      "symbol": "NIFTY-May2026-19850-PE",
      "strike": 19850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41287",
      "symbol": "NIFTY-May2026-19900-CE",
      "strike": 19900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "41288",
      "symbol": "NIFTY-May2026-19900-PE",
      "strike": 19900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43836",
      "symbol": "NIFTY-May2026-19250-CE",
      "strike": 19250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43837",
      "symbol": "NIFTY-May2026-19250-PE",
      "strike": 19250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43838",
      "symbol": "NIFTY-May2026-19300-CE",
      "strike": 19300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43839",
      "symbol": "NIFTY-May2026-19300-PE",
      "strike": 19300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43840",
      "symbol": "NIFTY-May2026-19350-CE",
      "strike": 19350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43841",
      "symbol": "NIFTY-May2026-19350-PE",
      "strike": 19350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43851",
      "symbol": "NIFTY-May2026-19400-CE",
      "strike": 19400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43852",
      "symbol": "NIFTY-May2026-19400-PE",
      "strike": 19400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43853",
      "symbol": "NIFTY-May2026-19450-CE",
      "strike": 19450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43854",
      "symbol": "NIFTY-May2026-19450-PE",
      "strike": 19450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43855",
      "symbol": "NIFTY-May2026-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43856",
      "symbol": "NIFTY-May2026-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43857",
      "symbol": "NIFTY-May2026-19550-CE",
      "strike": 19550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "43858",
      "symbol": "NIFTY-May2026-19550-PE",
      "strike": 19550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "48536",
      "symbol": "NIFTY-May2026-19200-CE",
      "strike": 19200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "48537",
      "symbol": "NIFTY-May2026-19200-PE",
      "strike": 19200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49854",
      "symbol": "NIFTY-May2026-18800-CE",
      "strike": 18800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49855",
      "symbol": "NIFTY-May2026-18800-PE",
      "strike": 18800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49856",
      "symbol": "NIFTY-May2026-18850-CE",
      "strike": 18850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49857",
      "symbol": "NIFTY-May2026-18850-PE",
      "strike": 18850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49862",
      "symbol": "NIFTY-May2026-18900-CE",
      "strike": 18900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49863",
      "symbol": "NIFTY-May2026-18900-PE",
      "strike": 18900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49864",
      "symbol": "NIFTY-May2026-18950-CE",
      "strike": 18950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49865",
      "symbol": "NIFTY-May2026-18950-PE",
      "strike": 18950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49866",
      "symbol": "NIFTY-May2026-19000-CE",
      "strike": 19000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49867",
      "symbol": "NIFTY-May2026-19000-PE",
      "strike": 19000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49868",
      "symbol": "NIFTY-May2026-19050-CE",
      "strike": 19050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49869",
      "symbol": "NIFTY-May2026-19050-PE",
      "strike": 19050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49870",
      "symbol": "NIFTY-May2026-19100-CE",
      "strike": 19100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49871",
      "symbol": "NIFTY-May2026-19100-PE",
      "strike": 19100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49872",
      "symbol": "NIFTY-May2026-19150-CE",
      "strike": 19150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "49873",
      "symbol": "NIFTY-May2026-19150-PE",
      "strike": 19150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "45305",
      "symbol": "NIFTY-May2026-18600-CE",
      "strike": 18600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "45306",
      "symbol": "NIFTY-May2026-18600-PE",
      "strike": 18600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "45307",
      "symbol": "NIFTY-May2026-18650-CE",
      "strike": 18650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "45308",
      "symbol": "NIFTY-May2026-18650-PE",
      "strike": 18650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "45309",
      "symbol": "NIFTY-May2026-18700-CE",
      "strike": 18700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "45310",
      "symbol": "NIFTY-May2026-18700-PE",
      "strike": 18700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "45311",
      "symbol": "NIFTY-May2026-18750-CE",
      "strike": 18750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "45312",
      "symbol": "NIFTY-May2026-18750-PE",
      "strike": 18750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "56895",
      "symbol": "NIFTY-May2026-18400-CE",
      "strike": 18400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "56896",
      "symbol": "NIFTY-May2026-18400-PE",
      "strike": 18400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "56897",
      "symbol": "NIFTY-May2026-18450-CE",
      "strike": 18450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "56898",
      "symbol": "NIFTY-May2026-18450-PE",
      "strike": 18450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "56899",
      "symbol": "NIFTY-May2026-18500-CE",
      "strike": 18500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "56900",
      "symbol": "NIFTY-May2026-18500-PE",
      "strike": 18500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "56961",
      "symbol": "NIFTY-May2026-18550-CE",
      "strike": 18550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "56965",
      "symbol": "NIFTY-May2026-18550-PE",
      "strike": 18550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59523",
      "symbol": "NIFTY-May2026-17900-CE",
      "strike": 17900,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59524",
      "symbol": "NIFTY-May2026-17900-PE",
      "strike": 17900,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59525",
      "symbol": "NIFTY-May2026-17950-CE",
      "strike": 17950,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59526",
      "symbol": "NIFTY-May2026-17950-PE",
      "strike": 17950,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59529",
      "symbol": "NIFTY-May2026-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59530",
      "symbol": "NIFTY-May2026-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59531",
      "symbol": "NIFTY-May2026-18050-CE",
      "strike": 18050,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59532",
      "symbol": "NIFTY-May2026-18050-PE",
      "strike": 18050,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59537",
      "symbol": "NIFTY-May2026-18100-CE",
      "strike": 18100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59538",
      "symbol": "NIFTY-May2026-18100-PE",
      "strike": 18100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59539",
      "symbol": "NIFTY-May2026-18150-CE",
      "strike": 18150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59540",
      "symbol": "NIFTY-May2026-18150-PE",
      "strike": 18150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59541",
      "symbol": "NIFTY-May2026-18200-CE",
      "strike": 18200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59542",
      "symbol": "NIFTY-May2026-18200-PE",
      "strike": 18200,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59543",
      "symbol": "NIFTY-May2026-18250-CE",
      "strike": 18250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59544",
      "symbol": "NIFTY-May2026-18250-PE",
      "strike": 18250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59545",
      "symbol": "NIFTY-May2026-18300-CE",
      "strike": 18300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59546",
      "symbol": "NIFTY-May2026-18300-PE",
      "strike": 18300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59547",
      "symbol": "NIFTY-May2026-18350-CE",
      "strike": 18350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "59548",
      "symbol": "NIFTY-May2026-18350-PE",
      "strike": 18350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "57876",
      "symbol": "NIFTY-May2026-17750-CE",
      "strike": 17750,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "57877",
      "symbol": "NIFTY-May2026-17750-PE",
      "strike": 17750,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "57878",
      "symbol": "NIFTY-May2026-17800-CE",
      "strike": 17800,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "57880",
      "symbol": "NIFTY-May2026-17800-PE",
      "strike": 17800,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "57881",
      "symbol": "NIFTY-May2026-17850-CE",
      "strike": 17850,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "57882",
      "symbol": "NIFTY-May2026-17850-PE",
      "strike": 17850,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65910",
      "symbol": "NIFTY-May2026-17250-CE",
      "strike": 17250,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65911",
      "symbol": "NIFTY-May2026-17250-PE",
      "strike": 17250,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65912",
      "symbol": "NIFTY-May2026-17300-CE",
      "strike": 17300,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65913",
      "symbol": "NIFTY-May2026-17300-PE",
      "strike": 17300,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65914",
      "symbol": "NIFTY-May2026-17350-CE",
      "strike": 17350,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65915",
      "symbol": "NIFTY-May2026-17350-PE",
      "strike": 17350,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65916",
      "symbol": "NIFTY-May2026-17400-CE",
      "strike": 17400,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65917",
      "symbol": "NIFTY-May2026-17400-PE",
      "strike": 17400,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65918",
      "symbol": "NIFTY-May2026-17450-CE",
      "strike": 17450,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65919",
      "symbol": "NIFTY-May2026-17450-PE",
      "strike": 17450,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65926",
      "symbol": "NIFTY-May2026-17500-CE",
      "strike": 17500,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65927",
      "symbol": "NIFTY-May2026-17500-PE",
      "strike": 17500,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65932",
      "symbol": "NIFTY-May2026-17550-CE",
      "strike": 17550,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65933",
      "symbol": "NIFTY-May2026-17550-PE",
      "strike": 17550,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65934",
      "symbol": "NIFTY-May2026-17600-CE",
      "strike": 17600,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65937",
      "symbol": "NIFTY-May2026-17600-PE",
      "strike": 17600,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65938",
      "symbol": "NIFTY-May2026-17650-CE",
      "strike": 17650,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65939",
      "symbol": "NIFTY-May2026-17650-PE",
      "strike": 17650,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65946",
      "symbol": "NIFTY-May2026-17700-CE",
      "strike": 17700,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "65947",
      "symbol": "NIFTY-May2026-17700-PE",
      "strike": 17700,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "78986",
      "symbol": "NIFTY-May2026-17100-CE",
      "strike": 17100,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "78987",
      "symbol": "NIFTY-May2026-17100-PE",
      "strike": 17100,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "78988",
      "symbol": "NIFTY-May2026-17150-CE",
      "strike": 17150,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "78989",
      "symbol": "NIFTY-May2026-17150-PE",
      "strike": 17150,
      "type": "PE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "78990",
      "symbol": "NIFTY-May2026-17200-CE",
      "strike": 17200,
      "type": "CE",
      "expiry": "2026-05-26"
    },
    {
      "security_id": "78991",
      "symbol": "NIFTY-May2026-17200-PE",
      "strike": 17200,
      "type": "PE",
      "expiry": "2026-05-26"
    }
  ],
  "2026-04-07": [
    {
      "security_id": "41043",
      "symbol": "NIFTY-Apr2026-27250-CE",
      "strike": 27250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41044",
      "symbol": "NIFTY-Apr2026-27250-PE",
      "strike": 27250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41045",
      "symbol": "NIFTY-Apr2026-27300-CE",
      "strike": 27300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41046",
      "symbol": "NIFTY-Apr2026-27300-PE",
      "strike": 27300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41047",
      "symbol": "NIFTY-Apr2026-27350-CE",
      "strike": 27350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41048",
      "symbol": "NIFTY-Apr2026-27350-PE",
      "strike": 27350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41049",
      "symbol": "NIFTY-Apr2026-27400-CE",
      "strike": 27400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41050",
      "symbol": "NIFTY-Apr2026-27400-PE",
      "strike": 27400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41051",
      "symbol": "NIFTY-Apr2026-27450-CE",
      "strike": 27450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41052",
      "symbol": "NIFTY-Apr2026-27450-PE",
      "strike": 27450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41053",
      "symbol": "NIFTY-Apr2026-27500-CE",
      "strike": 27500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41054",
      "symbol": "NIFTY-Apr2026-27500-PE",
      "strike": 27500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41057",
      "symbol": "NIFTY-Apr2026-27550-CE",
      "strike": 27550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41058",
      "symbol": "NIFTY-Apr2026-27550-PE",
      "strike": 27550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41059",
      "symbol": "NIFTY-Apr2026-27600-CE",
      "strike": 27600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41060",
      "symbol": "NIFTY-Apr2026-27600-PE",
      "strike": 27600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41063",
      "symbol": "NIFTY-Apr2026-27650-CE",
      "strike": 27650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41064",
      "symbol": "NIFTY-Apr2026-27650-PE",
      "strike": 27650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41069",
      "symbol": "NIFTY-Apr2026-27700-CE",
      "strike": 27700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41070",
      "symbol": "NIFTY-Apr2026-27700-PE",
      "strike": 27700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41074",
      "symbol": "NIFTY-Apr2026-27750-CE",
      "strike": 27750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41075",
      "symbol": "NIFTY-Apr2026-27750-PE",
      "strike": 27750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40530",
      "symbol": "NIFTY-Apr2026-19600-CE",
      "strike": 19600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40531",
      "symbol": "NIFTY-Apr2026-19600-PE",
      "strike": 19600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41082",
      "symbol": "NIFTY-Apr2026-27800-CE",
      "strike": 27800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41083",
      "symbol": "NIFTY-Apr2026-27800-PE",
      "strike": 27800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40532",
      "symbol": "NIFTY-Apr2026-19650-CE",
      "strike": 19650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41084",
      "symbol": "NIFTY-Apr2026-27850-CE",
      "strike": 27850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40533",
      "symbol": "NIFTY-Apr2026-19650-PE",
      "strike": 19650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40534",
      "symbol": "NIFTY-Apr2026-19700-CE",
      "strike": 19700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40535",
      "symbol": "NIFTY-Apr2026-19700-PE",
      "strike": 19700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40536",
      "symbol": "NIFTY-Apr2026-19750-CE",
      "strike": 19750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40539",
      "symbol": "NIFTY-Apr2026-19750-PE",
      "strike": 19750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40540",
      "symbol": "NIFTY-Apr2026-19800-CE",
      "strike": 19800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40541",
      "symbol": "NIFTY-Apr2026-19800-PE",
      "strike": 19800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40542",
      "symbol": "NIFTY-Apr2026-19850-CE",
      "strike": 19850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40543",
      "symbol": "NIFTY-Apr2026-19850-PE",
      "strike": 19850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40544",
      "symbol": "NIFTY-Apr2026-19900-CE",
      "strike": 19900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40545",
      "symbol": "NIFTY-Apr2026-19900-PE",
      "strike": 19900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40546",
      "symbol": "NIFTY-Apr2026-19950-CE",
      "strike": 19950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41090",
      "symbol": "NIFTY-Apr2026-27850-PE",
      "strike": 27850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40547",
      "symbol": "NIFTY-Apr2026-19950-PE",
      "strike": 19950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41091",
      "symbol": "NIFTY-Apr2026-27900-CE",
      "strike": 27900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41092",
      "symbol": "NIFTY-Apr2026-27900-PE",
      "strike": 27900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40548",
      "symbol": "NIFTY-Apr2026-20000-CE",
      "strike": 20000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40549",
      "symbol": "NIFTY-Apr2026-20000-PE",
      "strike": 20000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41093",
      "symbol": "NIFTY-Apr2026-27950-CE",
      "strike": 27950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40550",
      "symbol": "NIFTY-Apr2026-20050-CE",
      "strike": 20050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40561",
      "symbol": "NIFTY-Apr2026-20050-PE",
      "strike": 20050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40562",
      "symbol": "NIFTY-Apr2026-20100-CE",
      "strike": 20100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40563",
      "symbol": "NIFTY-Apr2026-20100-PE",
      "strike": 20100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40564",
      "symbol": "NIFTY-Apr2026-20150-CE",
      "strike": 20150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40565",
      "symbol": "NIFTY-Apr2026-20150-PE",
      "strike": 20150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40566",
      "symbol": "NIFTY-Apr2026-20200-CE",
      "strike": 20200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40567",
      "symbol": "NIFTY-Apr2026-20200-PE",
      "strike": 20200,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41096",
      "symbol": "NIFTY-Apr2026-27950-PE",
      "strike": 27950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40568",
      "symbol": "NIFTY-Apr2026-20250-CE",
      "strike": 20250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41097",
      "symbol": "NIFTY-Apr2026-28000-CE",
      "strike": 28000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40569",
      "symbol": "NIFTY-Apr2026-20250-PE",
      "strike": 20250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41098",
      "symbol": "NIFTY-Apr2026-28000-PE",
      "strike": 28000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40570",
      "symbol": "NIFTY-Apr2026-20300-CE",
      "strike": 20300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41099",
      "symbol": "NIFTY-Apr2026-28050-CE",
      "strike": 28050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40571",
      "symbol": "NIFTY-Apr2026-20300-PE",
      "strike": 20300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41100",
      "symbol": "NIFTY-Apr2026-28050-PE",
      "strike": 28050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40572",
      "symbol": "NIFTY-Apr2026-20350-CE",
      "strike": 20350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41101",
      "symbol": "NIFTY-Apr2026-28100-CE",
      "strike": 28100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40574",
      "symbol": "NIFTY-Apr2026-20350-PE",
      "strike": 20350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41102",
      "symbol": "NIFTY-Apr2026-28100-PE",
      "strike": 28100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40575",
      "symbol": "NIFTY-Apr2026-20400-CE",
      "strike": 20400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40587",
      "symbol": "NIFTY-Apr2026-20400-PE",
      "strike": 20400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41103",
      "symbol": "NIFTY-Apr2026-28150-CE",
      "strike": 28150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40588",
      "symbol": "NIFTY-Apr2026-20450-CE",
      "strike": 20450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41104",
      "symbol": "NIFTY-Apr2026-28150-PE",
      "strike": 28150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40589",
      "symbol": "NIFTY-Apr2026-20450-PE",
      "strike": 20450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41105",
      "symbol": "NIFTY-Apr2026-28200-CE",
      "strike": 28200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40590",
      "symbol": "NIFTY-Apr2026-20500-CE",
      "strike": 20500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41106",
      "symbol": "NIFTY-Apr2026-28200-PE",
      "strike": 28200,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40591",
      "symbol": "NIFTY-Apr2026-20500-PE",
      "strike": 20500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41107",
      "symbol": "NIFTY-Apr2026-28250-CE",
      "strike": 28250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40592",
      "symbol": "NIFTY-Apr2026-20550-CE",
      "strike": 20550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41108",
      "symbol": "NIFTY-Apr2026-28250-PE",
      "strike": 28250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40593",
      "symbol": "NIFTY-Apr2026-20550-PE",
      "strike": 20550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40594",
      "symbol": "NIFTY-Apr2026-20600-CE",
      "strike": 20600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40595",
      "symbol": "NIFTY-Apr2026-20600-PE",
      "strike": 20600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40596",
      "symbol": "NIFTY-Apr2026-20650-CE",
      "strike": 20650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40603",
      "symbol": "NIFTY-Apr2026-20650-PE",
      "strike": 20650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40604",
      "symbol": "NIFTY-Apr2026-20700-CE",
      "strike": 20700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40615",
      "symbol": "NIFTY-Apr2026-20700-PE",
      "strike": 20700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40616",
      "symbol": "NIFTY-Apr2026-20750-CE",
      "strike": 20750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40623",
      "symbol": "NIFTY-Apr2026-20750-PE",
      "strike": 20750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40624",
      "symbol": "NIFTY-Apr2026-20800-CE",
      "strike": 20800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40625",
      "symbol": "NIFTY-Apr2026-20800-PE",
      "strike": 20800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40626",
      "symbol": "NIFTY-Apr2026-20850-CE",
      "strike": 20850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41121",
      "symbol": "NIFTY-Apr2026-28300-CE",
      "strike": 28300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40631",
      "symbol": "NIFTY-Apr2026-20850-PE",
      "strike": 20850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41122",
      "symbol": "NIFTY-Apr2026-28300-PE",
      "strike": 28300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40632",
      "symbol": "NIFTY-Apr2026-20900-CE",
      "strike": 20900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41123",
      "symbol": "NIFTY-Apr2026-28350-CE",
      "strike": 28350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40637",
      "symbol": "NIFTY-Apr2026-20900-PE",
      "strike": 20900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41124",
      "symbol": "NIFTY-Apr2026-28350-PE",
      "strike": 28350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40638",
      "symbol": "NIFTY-Apr2026-20950-CE",
      "strike": 20950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40639",
      "symbol": "NIFTY-Apr2026-20950-PE",
      "strike": 20950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40640",
      "symbol": "NIFTY-Apr2026-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41127",
      "symbol": "NIFTY-Apr2026-28400-CE",
      "strike": 28400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40641",
      "symbol": "NIFTY-Apr2026-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41128",
      "symbol": "NIFTY-Apr2026-28400-PE",
      "strike": 28400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40642",
      "symbol": "NIFTY-Apr2026-21050-CE",
      "strike": 21050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40643",
      "symbol": "NIFTY-Apr2026-21050-PE",
      "strike": 21050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40644",
      "symbol": "NIFTY-Apr2026-21100-CE",
      "strike": 21100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41130",
      "symbol": "NIFTY-Apr2026-28450-CE",
      "strike": 28450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41131",
      "symbol": "NIFTY-Apr2026-28450-PE",
      "strike": 28450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40647",
      "symbol": "NIFTY-Apr2026-21100-PE",
      "strike": 21100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41132",
      "symbol": "NIFTY-Apr2026-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40648",
      "symbol": "NIFTY-Apr2026-21150-CE",
      "strike": 21150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41133",
      "symbol": "NIFTY-Apr2026-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40651",
      "symbol": "NIFTY-Apr2026-21150-PE",
      "strike": 21150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41134",
      "symbol": "NIFTY-Apr2026-28550-CE",
      "strike": 28550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40652",
      "symbol": "NIFTY-Apr2026-21200-CE",
      "strike": 21200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40655",
      "symbol": "NIFTY-Apr2026-21200-PE",
      "strike": 21200,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40656",
      "symbol": "NIFTY-Apr2026-21250-CE",
      "strike": 21250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41137",
      "symbol": "NIFTY-Apr2026-28550-PE",
      "strike": 28550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40659",
      "symbol": "NIFTY-Apr2026-21250-PE",
      "strike": 21250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40660",
      "symbol": "NIFTY-Apr2026-21300-CE",
      "strike": 21300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40661",
      "symbol": "NIFTY-Apr2026-21300-PE",
      "strike": 21300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40662",
      "symbol": "NIFTY-Apr2026-21350-CE",
      "strike": 21350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40663",
      "symbol": "NIFTY-Apr2026-21350-PE",
      "strike": 21350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40664",
      "symbol": "NIFTY-Apr2026-21400-CE",
      "strike": 21400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40667",
      "symbol": "NIFTY-Apr2026-21400-PE",
      "strike": 21400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40668",
      "symbol": "NIFTY-Apr2026-21450-CE",
      "strike": 21450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40677",
      "symbol": "NIFTY-Apr2026-21450-PE",
      "strike": 21450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40678",
      "symbol": "NIFTY-Apr2026-21500-CE",
      "strike": 21500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40679",
      "symbol": "NIFTY-Apr2026-21500-PE",
      "strike": 21500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40680",
      "symbol": "NIFTY-Apr2026-21550-CE",
      "strike": 21550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40681",
      "symbol": "NIFTY-Apr2026-21550-PE",
      "strike": 21550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40682",
      "symbol": "NIFTY-Apr2026-21600-CE",
      "strike": 21600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40683",
      "symbol": "NIFTY-Apr2026-21600-PE",
      "strike": 21600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40684",
      "symbol": "NIFTY-Apr2026-21650-CE",
      "strike": 21650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40687",
      "symbol": "NIFTY-Apr2026-21650-PE",
      "strike": 21650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40688",
      "symbol": "NIFTY-Apr2026-21700-CE",
      "strike": 21700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41165",
      "symbol": "NIFTY-Apr2026-28600-CE",
      "strike": 28600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40689",
      "symbol": "NIFTY-Apr2026-21700-PE",
      "strike": 21700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41166",
      "symbol": "NIFTY-Apr2026-28600-PE",
      "strike": 28600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40690",
      "symbol": "NIFTY-Apr2026-21750-CE",
      "strike": 21750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40691",
      "symbol": "NIFTY-Apr2026-21750-PE",
      "strike": 21750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40692",
      "symbol": "NIFTY-Apr2026-21800-CE",
      "strike": 21800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41169",
      "symbol": "NIFTY-Apr2026-28650-CE",
      "strike": 28650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40693",
      "symbol": "NIFTY-Apr2026-21800-PE",
      "strike": 21800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41170",
      "symbol": "NIFTY-Apr2026-28650-PE",
      "strike": 28650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40694",
      "symbol": "NIFTY-Apr2026-21850-CE",
      "strike": 21850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40695",
      "symbol": "NIFTY-Apr2026-21850-PE",
      "strike": 21850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40696",
      "symbol": "NIFTY-Apr2026-21900-CE",
      "strike": 21900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41173",
      "symbol": "NIFTY-Apr2026-28700-CE",
      "strike": 28700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40697",
      "symbol": "NIFTY-Apr2026-21900-PE",
      "strike": 21900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41174",
      "symbol": "NIFTY-Apr2026-28700-PE",
      "strike": 28700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40698",
      "symbol": "NIFTY-Apr2026-21950-CE",
      "strike": 21950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40699",
      "symbol": "NIFTY-Apr2026-21950-PE",
      "strike": 21950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40700",
      "symbol": "NIFTY-Apr2026-22000-CE",
      "strike": 22000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40701",
      "symbol": "NIFTY-Apr2026-22000-PE",
      "strike": 22000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40703",
      "symbol": "NIFTY-Apr2026-22050-CE",
      "strike": 22050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40704",
      "symbol": "NIFTY-Apr2026-22050-PE",
      "strike": 22050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40705",
      "symbol": "NIFTY-Apr2026-22100-CE",
      "strike": 22100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40706",
      "symbol": "NIFTY-Apr2026-22100-PE",
      "strike": 22100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41175",
      "symbol": "NIFTY-Apr2026-28750-CE",
      "strike": 28750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40707",
      "symbol": "NIFTY-Apr2026-22150-CE",
      "strike": 22150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41176",
      "symbol": "NIFTY-Apr2026-28750-PE",
      "strike": 28750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40708",
      "symbol": "NIFTY-Apr2026-22150-PE",
      "strike": 22150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41177",
      "symbol": "NIFTY-Apr2026-28800-CE",
      "strike": 28800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40714",
      "symbol": "NIFTY-Apr2026-22200-CE",
      "strike": 22200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41178",
      "symbol": "NIFTY-Apr2026-28800-PE",
      "strike": 28800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40717",
      "symbol": "NIFTY-Apr2026-22200-PE",
      "strike": 22200,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41179",
      "symbol": "NIFTY-Apr2026-28850-CE",
      "strike": 28850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40718",
      "symbol": "NIFTY-Apr2026-22250-CE",
      "strike": 22250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41180",
      "symbol": "NIFTY-Apr2026-28850-PE",
      "strike": 28850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40723",
      "symbol": "NIFTY-Apr2026-22250-PE",
      "strike": 22250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41181",
      "symbol": "NIFTY-Apr2026-28900-CE",
      "strike": 28900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40724",
      "symbol": "NIFTY-Apr2026-22300-CE",
      "strike": 22300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40725",
      "symbol": "NIFTY-Apr2026-22300-PE",
      "strike": 22300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40726",
      "symbol": "NIFTY-Apr2026-22350-CE",
      "strike": 22350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41182",
      "symbol": "NIFTY-Apr2026-28900-PE",
      "strike": 28900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40727",
      "symbol": "NIFTY-Apr2026-22350-PE",
      "strike": 22350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41183",
      "symbol": "NIFTY-Apr2026-28950-CE",
      "strike": 28950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40728",
      "symbol": "NIFTY-Apr2026-22400-CE",
      "strike": 22400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41186",
      "symbol": "NIFTY-Apr2026-28950-PE",
      "strike": 28950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40729",
      "symbol": "NIFTY-Apr2026-22400-PE",
      "strike": 22400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41187",
      "symbol": "NIFTY-Apr2026-29000-CE",
      "strike": 29000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40730",
      "symbol": "NIFTY-Apr2026-22450-CE",
      "strike": 22450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41188",
      "symbol": "NIFTY-Apr2026-29000-PE",
      "strike": 29000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40731",
      "symbol": "NIFTY-Apr2026-22450-PE",
      "strike": 22450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41189",
      "symbol": "NIFTY-Apr2026-29050-CE",
      "strike": 29050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40732",
      "symbol": "NIFTY-Apr2026-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41190",
      "symbol": "NIFTY-Apr2026-29050-PE",
      "strike": 29050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40735",
      "symbol": "NIFTY-Apr2026-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41191",
      "symbol": "NIFTY-Apr2026-29100-CE",
      "strike": 29100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40736",
      "symbol": "NIFTY-Apr2026-22550-CE",
      "strike": 22550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41192",
      "symbol": "NIFTY-Apr2026-29100-PE",
      "strike": 29100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40737",
      "symbol": "NIFTY-Apr2026-22550-PE",
      "strike": 22550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41193",
      "symbol": "NIFTY-Apr2026-29150-CE",
      "strike": 29150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40738",
      "symbol": "NIFTY-Apr2026-22600-CE",
      "strike": 22600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41194",
      "symbol": "NIFTY-Apr2026-29150-PE",
      "strike": 29150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40739",
      "symbol": "NIFTY-Apr2026-22600-PE",
      "strike": 22600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40740",
      "symbol": "NIFTY-Apr2026-22650-CE",
      "strike": 22650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40741",
      "symbol": "NIFTY-Apr2026-22650-PE",
      "strike": 22650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40742",
      "symbol": "NIFTY-Apr2026-22700-CE",
      "strike": 22700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40745",
      "symbol": "NIFTY-Apr2026-22700-PE",
      "strike": 22700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40747",
      "symbol": "NIFTY-Apr2026-22750-CE",
      "strike": 22750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40751",
      "symbol": "NIFTY-Apr2026-22750-PE",
      "strike": 22750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40752",
      "symbol": "NIFTY-Apr2026-22800-CE",
      "strike": 22800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40753",
      "symbol": "NIFTY-Apr2026-22800-PE",
      "strike": 22800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40754",
      "symbol": "NIFTY-Apr2026-22850-CE",
      "strike": 22850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41213",
      "symbol": "NIFTY-Apr2026-29200-CE",
      "strike": 29200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40760",
      "symbol": "NIFTY-Apr2026-22850-PE",
      "strike": 22850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41214",
      "symbol": "NIFTY-Apr2026-29200-PE",
      "strike": 29200,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40761",
      "symbol": "NIFTY-Apr2026-22900-CE",
      "strike": 22900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40769",
      "symbol": "NIFTY-Apr2026-22900-PE",
      "strike": 22900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40770",
      "symbol": "NIFTY-Apr2026-22950-CE",
      "strike": 22950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40771",
      "symbol": "NIFTY-Apr2026-22950-PE",
      "strike": 22950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40772",
      "symbol": "NIFTY-Apr2026-23000-CE",
      "strike": 23000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40773",
      "symbol": "NIFTY-Apr2026-23000-PE",
      "strike": 23000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40774",
      "symbol": "NIFTY-Apr2026-23050-CE",
      "strike": 23050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40775",
      "symbol": "NIFTY-Apr2026-23050-PE",
      "strike": 23050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40776",
      "symbol": "NIFTY-Apr2026-23100-CE",
      "strike": 23100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40777",
      "symbol": "NIFTY-Apr2026-23100-PE",
      "strike": 23100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40778",
      "symbol": "NIFTY-Apr2026-23150-CE",
      "strike": 23150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40779",
      "symbol": "NIFTY-Apr2026-23150-PE",
      "strike": 23150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40781",
      "symbol": "NIFTY-Apr2026-23200-CE",
      "strike": 23200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40782",
      "symbol": "NIFTY-Apr2026-23200-PE",
      "strike": 23200,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40783",
      "symbol": "NIFTY-Apr2026-23250-CE",
      "strike": 23250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40784",
      "symbol": "NIFTY-Apr2026-23250-PE",
      "strike": 23250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40785",
      "symbol": "NIFTY-Apr2026-23300-CE",
      "strike": 23300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40787",
      "symbol": "NIFTY-Apr2026-23300-PE",
      "strike": 23300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40788",
      "symbol": "NIFTY-Apr2026-23350-CE",
      "strike": 23350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40789",
      "symbol": "NIFTY-Apr2026-23350-PE",
      "strike": 23350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40790",
      "symbol": "NIFTY-Apr2026-23400-CE",
      "strike": 23400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40791",
      "symbol": "NIFTY-Apr2026-23400-PE",
      "strike": 23400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41233",
      "symbol": "NIFTY-Apr2026-29250-CE",
      "strike": 29250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40792",
      "symbol": "NIFTY-Apr2026-23450-CE",
      "strike": 23450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41234",
      "symbol": "NIFTY-Apr2026-29250-PE",
      "strike": 29250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40795",
      "symbol": "NIFTY-Apr2026-23450-PE",
      "strike": 23450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41235",
      "symbol": "NIFTY-Apr2026-29300-CE",
      "strike": 29300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40796",
      "symbol": "NIFTY-Apr2026-23500-CE",
      "strike": 23500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40797",
      "symbol": "NIFTY-Apr2026-23500-PE",
      "strike": 23500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40798",
      "symbol": "NIFTY-Apr2026-23550-CE",
      "strike": 23550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40799",
      "symbol": "NIFTY-Apr2026-23550-PE",
      "strike": 23550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40800",
      "symbol": "NIFTY-Apr2026-23600-CE",
      "strike": 23600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41236",
      "symbol": "NIFTY-Apr2026-29300-PE",
      "strike": 29300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40801",
      "symbol": "NIFTY-Apr2026-23600-PE",
      "strike": 23600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41237",
      "symbol": "NIFTY-Apr2026-29350-CE",
      "strike": 29350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40802",
      "symbol": "NIFTY-Apr2026-23650-CE",
      "strike": 23650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41238",
      "symbol": "NIFTY-Apr2026-29350-PE",
      "strike": 29350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40803",
      "symbol": "NIFTY-Apr2026-23650-PE",
      "strike": 23650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41239",
      "symbol": "NIFTY-Apr2026-29400-CE",
      "strike": 29400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40804",
      "symbol": "NIFTY-Apr2026-23700-CE",
      "strike": 23700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41240",
      "symbol": "NIFTY-Apr2026-29400-PE",
      "strike": 29400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40806",
      "symbol": "NIFTY-Apr2026-23700-PE",
      "strike": 23700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41241",
      "symbol": "NIFTY-Apr2026-29450-CE",
      "strike": 29450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40809",
      "symbol": "NIFTY-Apr2026-23750-CE",
      "strike": 23750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41242",
      "symbol": "NIFTY-Apr2026-29450-PE",
      "strike": 29450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40814",
      "symbol": "NIFTY-Apr2026-23750-PE",
      "strike": 23750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41243",
      "symbol": "NIFTY-Apr2026-29500-CE",
      "strike": 29500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40816",
      "symbol": "NIFTY-Apr2026-23800-CE",
      "strike": 23800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41244",
      "symbol": "NIFTY-Apr2026-29500-PE",
      "strike": 29500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40817",
      "symbol": "NIFTY-Apr2026-23800-PE",
      "strike": 23800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41245",
      "symbol": "NIFTY-Apr2026-29550-CE",
      "strike": 29550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40818",
      "symbol": "NIFTY-Apr2026-23850-CE",
      "strike": 23850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41246",
      "symbol": "NIFTY-Apr2026-29550-PE",
      "strike": 29550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40819",
      "symbol": "NIFTY-Apr2026-23850-PE",
      "strike": 23850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41249",
      "symbol": "NIFTY-Apr2026-29600-CE",
      "strike": 29600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40820",
      "symbol": "NIFTY-Apr2026-23900-CE",
      "strike": 23900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40821",
      "symbol": "NIFTY-Apr2026-23900-PE",
      "strike": 23900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41250",
      "symbol": "NIFTY-Apr2026-29600-PE",
      "strike": 29600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40822",
      "symbol": "NIFTY-Apr2026-23950-CE",
      "strike": 23950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41251",
      "symbol": "NIFTY-Apr2026-29650-CE",
      "strike": 29650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40823",
      "symbol": "NIFTY-Apr2026-23950-PE",
      "strike": 23950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41252",
      "symbol": "NIFTY-Apr2026-29650-PE",
      "strike": 29650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40824",
      "symbol": "NIFTY-Apr2026-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41253",
      "symbol": "NIFTY-Apr2026-29700-CE",
      "strike": 29700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40829",
      "symbol": "NIFTY-Apr2026-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41256",
      "symbol": "NIFTY-Apr2026-29700-PE",
      "strike": 29700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40830",
      "symbol": "NIFTY-Apr2026-24050-CE",
      "strike": 24050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41257",
      "symbol": "NIFTY-Apr2026-29750-CE",
      "strike": 29750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40832",
      "symbol": "NIFTY-Apr2026-24050-PE",
      "strike": 24050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41258",
      "symbol": "NIFTY-Apr2026-29750-PE",
      "strike": 29750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40833",
      "symbol": "NIFTY-Apr2026-24100-CE",
      "strike": 24100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41259",
      "symbol": "NIFTY-Apr2026-29800-CE",
      "strike": 29800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40837",
      "symbol": "NIFTY-Apr2026-24100-PE",
      "strike": 24100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40838",
      "symbol": "NIFTY-Apr2026-24150-CE",
      "strike": 24150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41260",
      "symbol": "NIFTY-Apr2026-29800-PE",
      "strike": 29800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40839",
      "symbol": "NIFTY-Apr2026-24150-PE",
      "strike": 24150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41261",
      "symbol": "NIFTY-Apr2026-29850-CE",
      "strike": 29850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41262",
      "symbol": "NIFTY-Apr2026-29850-PE",
      "strike": 29850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40840",
      "symbol": "NIFTY-Apr2026-24200-CE",
      "strike": 24200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40841",
      "symbol": "NIFTY-Apr2026-24200-PE",
      "strike": 24200,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41263",
      "symbol": "NIFTY-Apr2026-29900-CE",
      "strike": 29900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40842",
      "symbol": "NIFTY-Apr2026-24250-CE",
      "strike": 24250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41264",
      "symbol": "NIFTY-Apr2026-29900-PE",
      "strike": 29900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40847",
      "symbol": "NIFTY-Apr2026-24250-PE",
      "strike": 24250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40850",
      "symbol": "NIFTY-Apr2026-24300-CE",
      "strike": 24300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41265",
      "symbol": "NIFTY-Apr2026-29950-CE",
      "strike": 29950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40851",
      "symbol": "NIFTY-Apr2026-24300-PE",
      "strike": 24300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41266",
      "symbol": "NIFTY-Apr2026-29950-PE",
      "strike": 29950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40852",
      "symbol": "NIFTY-Apr2026-24350-CE",
      "strike": 24350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41267",
      "symbol": "NIFTY-Apr2026-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40857",
      "symbol": "NIFTY-Apr2026-24350-PE",
      "strike": 24350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41268",
      "symbol": "NIFTY-Apr2026-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40858",
      "symbol": "NIFTY-Apr2026-24400-CE",
      "strike": 24400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41271",
      "symbol": "NIFTY-Apr2026-30050-CE",
      "strike": 30050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40861",
      "symbol": "NIFTY-Apr2026-24400-PE",
      "strike": 24400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41272",
      "symbol": "NIFTY-Apr2026-30050-PE",
      "strike": 30050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40862",
      "symbol": "NIFTY-Apr2026-24450-CE",
      "strike": 24450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41273",
      "symbol": "NIFTY-Apr2026-30100-CE",
      "strike": 30100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40863",
      "symbol": "NIFTY-Apr2026-24450-PE",
      "strike": 24450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41274",
      "symbol": "NIFTY-Apr2026-30100-PE",
      "strike": 30100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40864",
      "symbol": "NIFTY-Apr2026-24500-CE",
      "strike": 24500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40865",
      "symbol": "NIFTY-Apr2026-24500-PE",
      "strike": 24500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40866",
      "symbol": "NIFTY-Apr2026-24550-CE",
      "strike": 24550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40867",
      "symbol": "NIFTY-Apr2026-24550-PE",
      "strike": 24550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40868",
      "symbol": "NIFTY-Apr2026-24600-CE",
      "strike": 24600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40869",
      "symbol": "NIFTY-Apr2026-24600-PE",
      "strike": 24600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40870",
      "symbol": "NIFTY-Apr2026-24650-CE",
      "strike": 24650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40875",
      "symbol": "NIFTY-Apr2026-24650-PE",
      "strike": 24650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40876",
      "symbol": "NIFTY-Apr2026-24700-CE",
      "strike": 24700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40877",
      "symbol": "NIFTY-Apr2026-24700-PE",
      "strike": 24700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40878",
      "symbol": "NIFTY-Apr2026-24750-CE",
      "strike": 24750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40879",
      "symbol": "NIFTY-Apr2026-24750-PE",
      "strike": 24750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40880",
      "symbol": "NIFTY-Apr2026-24800-CE",
      "strike": 24800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40881",
      "symbol": "NIFTY-Apr2026-24800-PE",
      "strike": 24800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40882",
      "symbol": "NIFTY-Apr2026-24850-CE",
      "strike": 24850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40883",
      "symbol": "NIFTY-Apr2026-24850-PE",
      "strike": 24850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40884",
      "symbol": "NIFTY-Apr2026-24900-CE",
      "strike": 24900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40887",
      "symbol": "NIFTY-Apr2026-24900-PE",
      "strike": 24900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40888",
      "symbol": "NIFTY-Apr2026-24950-CE",
      "strike": 24950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40889",
      "symbol": "NIFTY-Apr2026-24950-PE",
      "strike": 24950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40890",
      "symbol": "NIFTY-Apr2026-25000-CE",
      "strike": 25000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40893",
      "symbol": "NIFTY-Apr2026-25000-PE",
      "strike": 25000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40894",
      "symbol": "NIFTY-Apr2026-25050-CE",
      "strike": 25050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40895",
      "symbol": "NIFTY-Apr2026-25050-PE",
      "strike": 25050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40896",
      "symbol": "NIFTY-Apr2026-25100-CE",
      "strike": 25100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40901",
      "symbol": "NIFTY-Apr2026-25100-PE",
      "strike": 25100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40902",
      "symbol": "NIFTY-Apr2026-25150-CE",
      "strike": 25150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40907",
      "symbol": "NIFTY-Apr2026-25150-PE",
      "strike": 25150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40908",
      "symbol": "NIFTY-Apr2026-25200-CE",
      "strike": 25200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40909",
      "symbol": "NIFTY-Apr2026-25200-PE",
      "strike": 25200,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40910",
      "symbol": "NIFTY-Apr2026-25250-CE",
      "strike": 25250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40913",
      "symbol": "NIFTY-Apr2026-25250-PE",
      "strike": 25250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40914",
      "symbol": "NIFTY-Apr2026-25300-CE",
      "strike": 25300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40915",
      "symbol": "NIFTY-Apr2026-25300-PE",
      "strike": 25300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40916",
      "symbol": "NIFTY-Apr2026-25350-CE",
      "strike": 25350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40919",
      "symbol": "NIFTY-Apr2026-25350-PE",
      "strike": 25350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40920",
      "symbol": "NIFTY-Apr2026-25400-CE",
      "strike": 25400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40925",
      "symbol": "NIFTY-Apr2026-25400-PE",
      "strike": 25400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40926",
      "symbol": "NIFTY-Apr2026-25450-CE",
      "strike": 25450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40927",
      "symbol": "NIFTY-Apr2026-25450-PE",
      "strike": 25450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40931",
      "symbol": "NIFTY-Apr2026-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40941",
      "symbol": "NIFTY-Apr2026-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40942",
      "symbol": "NIFTY-Apr2026-25550-CE",
      "strike": 25550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40943",
      "symbol": "NIFTY-Apr2026-25550-PE",
      "strike": 25550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40946",
      "symbol": "NIFTY-Apr2026-25600-CE",
      "strike": 25600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40947",
      "symbol": "NIFTY-Apr2026-25600-PE",
      "strike": 25600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40948",
      "symbol": "NIFTY-Apr2026-25650-CE",
      "strike": 25650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40949",
      "symbol": "NIFTY-Apr2026-25650-PE",
      "strike": 25650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40950",
      "symbol": "NIFTY-Apr2026-25700-CE",
      "strike": 25700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40953",
      "symbol": "NIFTY-Apr2026-25700-PE",
      "strike": 25700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40954",
      "symbol": "NIFTY-Apr2026-25750-CE",
      "strike": 25750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40958",
      "symbol": "NIFTY-Apr2026-25750-PE",
      "strike": 25750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40959",
      "symbol": "NIFTY-Apr2026-25800-CE",
      "strike": 25800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40960",
      "symbol": "NIFTY-Apr2026-25800-PE",
      "strike": 25800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40961",
      "symbol": "NIFTY-Apr2026-25850-CE",
      "strike": 25850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40962",
      "symbol": "NIFTY-Apr2026-25850-PE",
      "strike": 25850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40963",
      "symbol": "NIFTY-Apr2026-25900-CE",
      "strike": 25900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40966",
      "symbol": "NIFTY-Apr2026-25900-PE",
      "strike": 25900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40967",
      "symbol": "NIFTY-Apr2026-25950-CE",
      "strike": 25950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40969",
      "symbol": "NIFTY-Apr2026-25950-PE",
      "strike": 25950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40970",
      "symbol": "NIFTY-Apr2026-26000-CE",
      "strike": 26000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40971",
      "symbol": "NIFTY-Apr2026-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40972",
      "symbol": "NIFTY-Apr2026-26050-CE",
      "strike": 26050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40973",
      "symbol": "NIFTY-Apr2026-26050-PE",
      "strike": 26050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40974",
      "symbol": "NIFTY-Apr2026-26100-CE",
      "strike": 26100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40975",
      "symbol": "NIFTY-Apr2026-26100-PE",
      "strike": 26100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40976",
      "symbol": "NIFTY-Apr2026-26150-CE",
      "strike": 26150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40977",
      "symbol": "NIFTY-Apr2026-26150-PE",
      "strike": 26150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40978",
      "symbol": "NIFTY-Apr2026-26200-CE",
      "strike": 26200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40979",
      "symbol": "NIFTY-Apr2026-26200-PE",
      "strike": 26200,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40980",
      "symbol": "NIFTY-Apr2026-26250-CE",
      "strike": 26250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40981",
      "symbol": "NIFTY-Apr2026-26250-PE",
      "strike": 26250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40982",
      "symbol": "NIFTY-Apr2026-26300-CE",
      "strike": 26300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40983",
      "symbol": "NIFTY-Apr2026-26300-PE",
      "strike": 26300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40984",
      "symbol": "NIFTY-Apr2026-26350-CE",
      "strike": 26350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40985",
      "symbol": "NIFTY-Apr2026-26350-PE",
      "strike": 26350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40990",
      "symbol": "NIFTY-Apr2026-26400-CE",
      "strike": 26400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40991",
      "symbol": "NIFTY-Apr2026-26400-PE",
      "strike": 26400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40992",
      "symbol": "NIFTY-Apr2026-26450-CE",
      "strike": 26450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40993",
      "symbol": "NIFTY-Apr2026-26450-PE",
      "strike": 26450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40994",
      "symbol": "NIFTY-Apr2026-26500-CE",
      "strike": 26500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40995",
      "symbol": "NIFTY-Apr2026-26500-PE",
      "strike": 26500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40996",
      "symbol": "NIFTY-Apr2026-26550-CE",
      "strike": 26550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40997",
      "symbol": "NIFTY-Apr2026-26550-PE",
      "strike": 26550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40998",
      "symbol": "NIFTY-Apr2026-26600-CE",
      "strike": 26600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "40999",
      "symbol": "NIFTY-Apr2026-26600-PE",
      "strike": 26600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41000",
      "symbol": "NIFTY-Apr2026-26650-CE",
      "strike": 26650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41001",
      "symbol": "NIFTY-Apr2026-26650-PE",
      "strike": 26650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41002",
      "symbol": "NIFTY-Apr2026-26700-CE",
      "strike": 26700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41003",
      "symbol": "NIFTY-Apr2026-26700-PE",
      "strike": 26700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41004",
      "symbol": "NIFTY-Apr2026-26750-CE",
      "strike": 26750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41005",
      "symbol": "NIFTY-Apr2026-26750-PE",
      "strike": 26750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41006",
      "symbol": "NIFTY-Apr2026-26800-CE",
      "strike": 26800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41007",
      "symbol": "NIFTY-Apr2026-26800-PE",
      "strike": 26800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41008",
      "symbol": "NIFTY-Apr2026-26850-CE",
      "strike": 26850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41011",
      "symbol": "NIFTY-Apr2026-26850-PE",
      "strike": 26850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41012",
      "symbol": "NIFTY-Apr2026-26900-CE",
      "strike": 26900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41013",
      "symbol": "NIFTY-Apr2026-26900-PE",
      "strike": 26900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41014",
      "symbol": "NIFTY-Apr2026-26950-CE",
      "strike": 26950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41016",
      "symbol": "NIFTY-Apr2026-26950-PE",
      "strike": 26950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41019",
      "symbol": "NIFTY-Apr2026-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41020",
      "symbol": "NIFTY-Apr2026-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41025",
      "symbol": "NIFTY-Apr2026-27050-CE",
      "strike": 27050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41026",
      "symbol": "NIFTY-Apr2026-27050-PE",
      "strike": 27050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41027",
      "symbol": "NIFTY-Apr2026-27100-CE",
      "strike": 27100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41028",
      "symbol": "NIFTY-Apr2026-27100-PE",
      "strike": 27100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41029",
      "symbol": "NIFTY-Apr2026-27150-CE",
      "strike": 27150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41031",
      "symbol": "NIFTY-Apr2026-27150-PE",
      "strike": 27150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41041",
      "symbol": "NIFTY-Apr2026-27200-CE",
      "strike": 27200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "41042",
      "symbol": "NIFTY-Apr2026-27200-PE",
      "strike": 27200,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43773",
      "symbol": "NIFTY-Apr2026-19250-CE",
      "strike": 19250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43776",
      "symbol": "NIFTY-Apr2026-19250-PE",
      "strike": 19250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43777",
      "symbol": "NIFTY-Apr2026-19300-CE",
      "strike": 19300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43778",
      "symbol": "NIFTY-Apr2026-19300-PE",
      "strike": 19300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43779",
      "symbol": "NIFTY-Apr2026-19350-CE",
      "strike": 19350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43780",
      "symbol": "NIFTY-Apr2026-19350-PE",
      "strike": 19350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43781",
      "symbol": "NIFTY-Apr2026-19400-CE",
      "strike": 19400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43782",
      "symbol": "NIFTY-Apr2026-19400-PE",
      "strike": 19400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43783",
      "symbol": "NIFTY-Apr2026-19450-CE",
      "strike": 19450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43784",
      "symbol": "NIFTY-Apr2026-19450-PE",
      "strike": 19450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43788",
      "symbol": "NIFTY-Apr2026-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43789",
      "symbol": "NIFTY-Apr2026-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43790",
      "symbol": "NIFTY-Apr2026-19550-CE",
      "strike": 19550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "43791",
      "symbol": "NIFTY-Apr2026-19550-PE",
      "strike": 19550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "48532",
      "symbol": "NIFTY-Apr2026-19200-CE",
      "strike": 19200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "48533",
      "symbol": "NIFTY-Apr2026-19200-PE",
      "strike": 19200,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49822",
      "symbol": "NIFTY-Apr2026-18800-CE",
      "strike": 18800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49823",
      "symbol": "NIFTY-Apr2026-18800-PE",
      "strike": 18800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49824",
      "symbol": "NIFTY-Apr2026-18850-CE",
      "strike": 18850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49825",
      "symbol": "NIFTY-Apr2026-18850-PE",
      "strike": 18850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49826",
      "symbol": "NIFTY-Apr2026-18900-CE",
      "strike": 18900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49827",
      "symbol": "NIFTY-Apr2026-18900-PE",
      "strike": 18900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49828",
      "symbol": "NIFTY-Apr2026-18950-CE",
      "strike": 18950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49829",
      "symbol": "NIFTY-Apr2026-18950-PE",
      "strike": 18950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49830",
      "symbol": "NIFTY-Apr2026-19000-CE",
      "strike": 19000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49831",
      "symbol": "NIFTY-Apr2026-19000-PE",
      "strike": 19000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49832",
      "symbol": "NIFTY-Apr2026-19050-CE",
      "strike": 19050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49833",
      "symbol": "NIFTY-Apr2026-19050-PE",
      "strike": 19050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49834",
      "symbol": "NIFTY-Apr2026-19100-CE",
      "strike": 19100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49835",
      "symbol": "NIFTY-Apr2026-19100-PE",
      "strike": 19100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49836",
      "symbol": "NIFTY-Apr2026-19150-CE",
      "strike": 19150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "49837",
      "symbol": "NIFTY-Apr2026-19150-PE",
      "strike": 19150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "45269",
      "symbol": "NIFTY-Apr2026-18600-CE",
      "strike": 18600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "45270",
      "symbol": "NIFTY-Apr2026-18600-PE",
      "strike": 18600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "45271",
      "symbol": "NIFTY-Apr2026-18650-CE",
      "strike": 18650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "45272",
      "symbol": "NIFTY-Apr2026-18650-PE",
      "strike": 18650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "45273",
      "symbol": "NIFTY-Apr2026-18700-CE",
      "strike": 18700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "45274",
      "symbol": "NIFTY-Apr2026-18700-PE",
      "strike": 18700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "45275",
      "symbol": "NIFTY-Apr2026-18750-CE",
      "strike": 18750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "45276",
      "symbol": "NIFTY-Apr2026-18750-PE",
      "strike": 18750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "56869",
      "symbol": "NIFTY-Apr2026-18400-CE",
      "strike": 18400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "56870",
      "symbol": "NIFTY-Apr2026-18400-PE",
      "strike": 18400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "56871",
      "symbol": "NIFTY-Apr2026-18450-CE",
      "strike": 18450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "56872",
      "symbol": "NIFTY-Apr2026-18450-PE",
      "strike": 18450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "56873",
      "symbol": "NIFTY-Apr2026-18500-CE",
      "strike": 18500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "56874",
      "symbol": "NIFTY-Apr2026-18500-PE",
      "strike": 18500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "56875",
      "symbol": "NIFTY-Apr2026-18550-CE",
      "strike": 18550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "56876",
      "symbol": "NIFTY-Apr2026-18550-PE",
      "strike": 18550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59449",
      "symbol": "NIFTY-Apr2026-17900-CE",
      "strike": 17900,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59450",
      "symbol": "NIFTY-Apr2026-17900-PE",
      "strike": 17900,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59451",
      "symbol": "NIFTY-Apr2026-17950-CE",
      "strike": 17950,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59452",
      "symbol": "NIFTY-Apr2026-17950-PE",
      "strike": 17950,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59453",
      "symbol": "NIFTY-Apr2026-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59454",
      "symbol": "NIFTY-Apr2026-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59455",
      "symbol": "NIFTY-Apr2026-18050-CE",
      "strike": 18050,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59456",
      "symbol": "NIFTY-Apr2026-18050-PE",
      "strike": 18050,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59457",
      "symbol": "NIFTY-Apr2026-18100-CE",
      "strike": 18100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59458",
      "symbol": "NIFTY-Apr2026-18100-PE",
      "strike": 18100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59459",
      "symbol": "NIFTY-Apr2026-18150-CE",
      "strike": 18150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59460",
      "symbol": "NIFTY-Apr2026-18150-PE",
      "strike": 18150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59461",
      "symbol": "NIFTY-Apr2026-18200-CE",
      "strike": 18200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59462",
      "symbol": "NIFTY-Apr2026-18200-PE",
      "strike": 18200,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59463",
      "symbol": "NIFTY-Apr2026-18250-CE",
      "strike": 18250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59464",
      "symbol": "NIFTY-Apr2026-18250-PE",
      "strike": 18250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59465",
      "symbol": "NIFTY-Apr2026-18300-CE",
      "strike": 18300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59466",
      "symbol": "NIFTY-Apr2026-18300-PE",
      "strike": 18300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59467",
      "symbol": "NIFTY-Apr2026-18350-CE",
      "strike": 18350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "59468",
      "symbol": "NIFTY-Apr2026-18350-PE",
      "strike": 18350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "57773",
      "symbol": "NIFTY-Apr2026-17750-CE",
      "strike": 17750,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "57774",
      "symbol": "NIFTY-Apr2026-17750-PE",
      "strike": 17750,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "57787",
      "symbol": "NIFTY-Apr2026-17800-CE",
      "strike": 17800,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "57789",
      "symbol": "NIFTY-Apr2026-17800-PE",
      "strike": 17800,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "57790",
      "symbol": "NIFTY-Apr2026-17850-CE",
      "strike": 17850,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "57791",
      "symbol": "NIFTY-Apr2026-17850-PE",
      "strike": 17850,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65780",
      "symbol": "NIFTY-Apr2026-17250-CE",
      "strike": 17250,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65781",
      "symbol": "NIFTY-Apr2026-17250-PE",
      "strike": 17250,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65782",
      "symbol": "NIFTY-Apr2026-17300-CE",
      "strike": 17300,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65784",
      "symbol": "NIFTY-Apr2026-17300-PE",
      "strike": 17300,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65786",
      "symbol": "NIFTY-Apr2026-17350-CE",
      "strike": 17350,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65789",
      "symbol": "NIFTY-Apr2026-17350-PE",
      "strike": 17350,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65790",
      "symbol": "NIFTY-Apr2026-17400-CE",
      "strike": 17400,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65791",
      "symbol": "NIFTY-Apr2026-17400-PE",
      "strike": 17400,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65792",
      "symbol": "NIFTY-Apr2026-17450-CE",
      "strike": 17450,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65794",
      "symbol": "NIFTY-Apr2026-17450-PE",
      "strike": 17450,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65795",
      "symbol": "NIFTY-Apr2026-17500-CE",
      "strike": 17500,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65796",
      "symbol": "NIFTY-Apr2026-17500-PE",
      "strike": 17500,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65797",
      "symbol": "NIFTY-Apr2026-17550-CE",
      "strike": 17550,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65798",
      "symbol": "NIFTY-Apr2026-17550-PE",
      "strike": 17550,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65799",
      "symbol": "NIFTY-Apr2026-17600-CE",
      "strike": 17600,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65800",
      "symbol": "NIFTY-Apr2026-17600-PE",
      "strike": 17600,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65801",
      "symbol": "NIFTY-Apr2026-17650-CE",
      "strike": 17650,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65802",
      "symbol": "NIFTY-Apr2026-17650-PE",
      "strike": 17650,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65803",
      "symbol": "NIFTY-Apr2026-17700-CE",
      "strike": 17700,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "65804",
      "symbol": "NIFTY-Apr2026-17700-PE",
      "strike": 17700,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "78846",
      "symbol": "NIFTY-Apr2026-17100-CE",
      "strike": 17100,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "78847",
      "symbol": "NIFTY-Apr2026-17100-PE",
      "strike": 17100,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "78848",
      "symbol": "NIFTY-Apr2026-17150-CE",
      "strike": 17150,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "78849",
      "symbol": "NIFTY-Apr2026-17150-PE",
      "strike": 17150,
      "type": "PE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "78850",
      "symbol": "NIFTY-Apr2026-17200-CE",
      "strike": 17200,
      "type": "CE",
      "expiry": "2026-04-07"
    },
    {
      "security_id": "78851",
      "symbol": "NIFTY-Apr2026-17200-PE",
      "strike": 17200,
      "type": "PE",
      "expiry": "2026-04-07"
    }
  ],
  "2026-04-13": [
    {
      "security_id": "54870",
      "symbol": "NIFTY-Apr2026-24450-CE",
      "strike": 24450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54871",
      "symbol": "NIFTY-Apr2026-24450-PE",
      "strike": 24450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53791",
      "symbol": "NIFTY-Apr2026-19650-PE",
      "strike": 19650,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54872",
      "symbol": "NIFTY-Apr2026-24500-CE",
      "strike": 24500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54873",
      "symbol": "NIFTY-Apr2026-24500-PE",
      "strike": 24500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54874",
      "symbol": "NIFTY-Apr2026-24550-CE",
      "strike": 24550,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54875",
      "symbol": "NIFTY-Apr2026-24550-PE",
      "strike": 24550,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53792",
      "symbol": "NIFTY-Apr2026-19700-CE",
      "strike": 19700,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54876",
      "symbol": "NIFTY-Apr2026-24600-CE",
      "strike": 24600,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54877",
      "symbol": "NIFTY-Apr2026-24600-PE",
      "strike": 24600,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53795",
      "symbol": "NIFTY-Apr2026-19700-PE",
      "strike": 19700,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54878",
      "symbol": "NIFTY-Apr2026-24650-CE",
      "strike": 24650,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54879",
      "symbol": "NIFTY-Apr2026-24650-PE",
      "strike": 24650,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54880",
      "symbol": "NIFTY-Apr2026-24700-CE",
      "strike": 24700,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53798",
      "symbol": "NIFTY-Apr2026-19750-CE",
      "strike": 19750,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54881",
      "symbol": "NIFTY-Apr2026-24700-PE",
      "strike": 24700,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54882",
      "symbol": "NIFTY-Apr2026-24750-CE",
      "strike": 24750,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54883",
      "symbol": "NIFTY-Apr2026-24750-PE",
      "strike": 24750,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54884",
      "symbol": "NIFTY-Apr2026-24800-CE",
      "strike": 24800,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53802",
      "symbol": "NIFTY-Apr2026-19750-PE",
      "strike": 19750,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54885",
      "symbol": "NIFTY-Apr2026-24800-PE",
      "strike": 24800,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54886",
      "symbol": "NIFTY-Apr2026-24850-CE",
      "strike": 24850,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54887",
      "symbol": "NIFTY-Apr2026-24850-PE",
      "strike": 24850,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54888",
      "symbol": "NIFTY-Apr2026-24900-CE",
      "strike": 24900,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54889",
      "symbol": "NIFTY-Apr2026-24900-PE",
      "strike": 24900,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54890",
      "symbol": "NIFTY-Apr2026-24950-CE",
      "strike": 24950,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54891",
      "symbol": "NIFTY-Apr2026-24950-PE",
      "strike": 24950,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54892",
      "symbol": "NIFTY-Apr2026-25000-CE",
      "strike": 25000,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54893",
      "symbol": "NIFTY-Apr2026-25000-PE",
      "strike": 25000,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54902",
      "symbol": "NIFTY-Apr2026-25050-CE",
      "strike": 25050,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54903",
      "symbol": "NIFTY-Apr2026-25050-PE",
      "strike": 25050,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54904",
      "symbol": "NIFTY-Apr2026-25100-CE",
      "strike": 25100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54905",
      "symbol": "NIFTY-Apr2026-25100-PE",
      "strike": 25100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54906",
      "symbol": "NIFTY-Apr2026-25150-CE",
      "strike": 25150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54361",
      "symbol": "NIFTY-Apr2026-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54907",
      "symbol": "NIFTY-Apr2026-25150-PE",
      "strike": 25150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54362",
      "symbol": "NIFTY-Apr2026-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54908",
      "symbol": "NIFTY-Apr2026-25200-CE",
      "strike": 25200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54363",
      "symbol": "NIFTY-Apr2026-21050-CE",
      "strike": 21050,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54909",
      "symbol": "NIFTY-Apr2026-25200-PE",
      "strike": 25200,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54910",
      "symbol": "NIFTY-Apr2026-25250-CE",
      "strike": 25250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54911",
      "symbol": "NIFTY-Apr2026-25250-PE",
      "strike": 25250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54912",
      "symbol": "NIFTY-Apr2026-25300-CE",
      "strike": 25300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54364",
      "symbol": "NIFTY-Apr2026-21050-PE",
      "strike": 21050,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54913",
      "symbol": "NIFTY-Apr2026-25300-PE",
      "strike": 25300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55420",
      "symbol": "NIFTY-Apr2026-29150-PE",
      "strike": 29150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55432",
      "symbol": "NIFTY-Apr2026-29200-CE",
      "strike": 29200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55433",
      "symbol": "NIFTY-Apr2026-29200-PE",
      "strike": 29200,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55434",
      "symbol": "NIFTY-Apr2026-29250-CE",
      "strike": 29250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55435",
      "symbol": "NIFTY-Apr2026-29250-PE",
      "strike": 29250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55436",
      "symbol": "NIFTY-Apr2026-29300-CE",
      "strike": 29300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55437",
      "symbol": "NIFTY-Apr2026-29300-PE",
      "strike": 29300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53900",
      "symbol": "NIFTY-Apr2026-19800-CE",
      "strike": 19800,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53901",
      "symbol": "NIFTY-Apr2026-19800-PE",
      "strike": 19800,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53902",
      "symbol": "NIFTY-Apr2026-19850-CE",
      "strike": 19850,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55455",
      "symbol": "NIFTY-Apr2026-29350-CE",
      "strike": 29350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54962",
      "symbol": "NIFTY-Apr2026-25350-CE",
      "strike": 25350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54963",
      "symbol": "NIFTY-Apr2026-25350-PE",
      "strike": 25350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53906",
      "symbol": "NIFTY-Apr2026-19850-PE",
      "strike": 19850,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54964",
      "symbol": "NIFTY-Apr2026-25400-CE",
      "strike": 25400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54965",
      "symbol": "NIFTY-Apr2026-25400-PE",
      "strike": 25400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55461",
      "symbol": "NIFTY-Apr2026-29350-PE",
      "strike": 29350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54966",
      "symbol": "NIFTY-Apr2026-25450-CE",
      "strike": 25450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53909",
      "symbol": "NIFTY-Apr2026-19900-CE",
      "strike": 19900,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54967",
      "symbol": "NIFTY-Apr2026-25450-PE",
      "strike": 25450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54968",
      "symbol": "NIFTY-Apr2026-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53911",
      "symbol": "NIFTY-Apr2026-19900-PE",
      "strike": 19900,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54969",
      "symbol": "NIFTY-Apr2026-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53912",
      "symbol": "NIFTY-Apr2026-19950-CE",
      "strike": 19950,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54970",
      "symbol": "NIFTY-Apr2026-25550-CE",
      "strike": 25550,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54971",
      "symbol": "NIFTY-Apr2026-25550-PE",
      "strike": 25550,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53913",
      "symbol": "NIFTY-Apr2026-19950-PE",
      "strike": 19950,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54972",
      "symbol": "NIFTY-Apr2026-25600-CE",
      "strike": 25600,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53914",
      "symbol": "NIFTY-Apr2026-20000-CE",
      "strike": 20000,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54973",
      "symbol": "NIFTY-Apr2026-25600-PE",
      "strike": 25600,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53915",
      "symbol": "NIFTY-Apr2026-20000-PE",
      "strike": 20000,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54974",
      "symbol": "NIFTY-Apr2026-25650-CE",
      "strike": 25650,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54975",
      "symbol": "NIFTY-Apr2026-25650-PE",
      "strike": 25650,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54976",
      "symbol": "NIFTY-Apr2026-25700-CE",
      "strike": 25700,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53918",
      "symbol": "NIFTY-Apr2026-20050-CE",
      "strike": 20050,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54977",
      "symbol": "NIFTY-Apr2026-25700-PE",
      "strike": 25700,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53919",
      "symbol": "NIFTY-Apr2026-20050-PE",
      "strike": 20050,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54978",
      "symbol": "NIFTY-Apr2026-25750-CE",
      "strike": 25750,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54979",
      "symbol": "NIFTY-Apr2026-25750-PE",
      "strike": 25750,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55473",
      "symbol": "NIFTY-Apr2026-29400-CE",
      "strike": 29400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55474",
      "symbol": "NIFTY-Apr2026-29400-PE",
      "strike": 29400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53926",
      "symbol": "NIFTY-Apr2026-20100-CE",
      "strike": 20100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54980",
      "symbol": "NIFTY-Apr2026-25800-CE",
      "strike": 25800,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54981",
      "symbol": "NIFTY-Apr2026-25800-PE",
      "strike": 25800,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54982",
      "symbol": "NIFTY-Apr2026-25850-CE",
      "strike": 25850,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54983",
      "symbol": "NIFTY-Apr2026-25850-PE",
      "strike": 25850,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54984",
      "symbol": "NIFTY-Apr2026-25900-CE",
      "strike": 25900,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54985",
      "symbol": "NIFTY-Apr2026-25900-PE",
      "strike": 25900,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54988",
      "symbol": "NIFTY-Apr2026-25950-CE",
      "strike": 25950,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54989",
      "symbol": "NIFTY-Apr2026-25950-PE",
      "strike": 25950,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54990",
      "symbol": "NIFTY-Apr2026-26000-CE",
      "strike": 26000,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54991",
      "symbol": "NIFTY-Apr2026-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54993",
      "symbol": "NIFTY-Apr2026-26050-CE",
      "strike": 26050,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54995",
      "symbol": "NIFTY-Apr2026-26050-PE",
      "strike": 26050,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53943",
      "symbol": "NIFTY-Apr2026-20100-PE",
      "strike": 20100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53944",
      "symbol": "NIFTY-Apr2026-20150-CE",
      "strike": 20150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53945",
      "symbol": "NIFTY-Apr2026-20150-PE",
      "strike": 20150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53946",
      "symbol": "NIFTY-Apr2026-20200-CE",
      "strike": 20200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53947",
      "symbol": "NIFTY-Apr2026-20200-PE",
      "strike": 20200,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53948",
      "symbol": "NIFTY-Apr2026-20250-CE",
      "strike": 20250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53949",
      "symbol": "NIFTY-Apr2026-20250-PE",
      "strike": 20250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53950",
      "symbol": "NIFTY-Apr2026-20300-CE",
      "strike": 20300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53951",
      "symbol": "NIFTY-Apr2026-20300-PE",
      "strike": 20300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54458",
      "symbol": "NIFTY-Apr2026-21100-CE",
      "strike": 21100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53958",
      "symbol": "NIFTY-Apr2026-20350-CE",
      "strike": 20350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53959",
      "symbol": "NIFTY-Apr2026-20350-PE",
      "strike": 20350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53962",
      "symbol": "NIFTY-Apr2026-20400-CE",
      "strike": 20400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53963",
      "symbol": "NIFTY-Apr2026-20400-PE",
      "strike": 20400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53964",
      "symbol": "NIFTY-Apr2026-20450-CE",
      "strike": 20450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53967",
      "symbol": "NIFTY-Apr2026-20450-PE",
      "strike": 20450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55040",
      "symbol": "NIFTY-Apr2026-26100-CE",
      "strike": 26100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55041",
      "symbol": "NIFTY-Apr2026-26100-PE",
      "strike": 26100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53998",
      "symbol": "NIFTY-Apr2026-20500-CE",
      "strike": 20500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55042",
      "symbol": "NIFTY-Apr2026-26150-CE",
      "strike": 26150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53999",
      "symbol": "NIFTY-Apr2026-20500-PE",
      "strike": 20500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55043",
      "symbol": "NIFTY-Apr2026-26150-PE",
      "strike": 26150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55044",
      "symbol": "NIFTY-Apr2026-26200-CE",
      "strike": 26200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55045",
      "symbol": "NIFTY-Apr2026-26200-PE",
      "strike": 26200,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55046",
      "symbol": "NIFTY-Apr2026-26250-CE",
      "strike": 26250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55047",
      "symbol": "NIFTY-Apr2026-26250-PE",
      "strike": 26250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54004",
      "symbol": "NIFTY-Apr2026-20550-CE",
      "strike": 20550,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55048",
      "symbol": "NIFTY-Apr2026-26300-CE",
      "strike": 26300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54005",
      "symbol": "NIFTY-Apr2026-20550-PE",
      "strike": 20550,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55049",
      "symbol": "NIFTY-Apr2026-26300-PE",
      "strike": 26300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54503",
      "symbol": "NIFTY-Apr2026-21100-PE",
      "strike": 21100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54006",
      "symbol": "NIFTY-Apr2026-20600-CE",
      "strike": 20600,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55052",
      "symbol": "NIFTY-Apr2026-26350-CE",
      "strike": 26350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54504",
      "symbol": "NIFTY-Apr2026-21150-CE",
      "strike": 21150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55053",
      "symbol": "NIFTY-Apr2026-26350-PE",
      "strike": 26350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55054",
      "symbol": "NIFTY-Apr2026-26400-CE",
      "strike": 26400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55055",
      "symbol": "NIFTY-Apr2026-26400-PE",
      "strike": 26400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55056",
      "symbol": "NIFTY-Apr2026-26450-CE",
      "strike": 26450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55057",
      "symbol": "NIFTY-Apr2026-26450-PE",
      "strike": 26450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55058",
      "symbol": "NIFTY-Apr2026-26500-CE",
      "strike": 26500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55059",
      "symbol": "NIFTY-Apr2026-26500-PE",
      "strike": 26500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55060",
      "symbol": "NIFTY-Apr2026-26550-CE",
      "strike": 26550,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55061",
      "symbol": "NIFTY-Apr2026-26550-PE",
      "strike": 26550,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55062",
      "symbol": "NIFTY-Apr2026-26600-CE",
      "strike": 26600,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54017",
      "symbol": "NIFTY-Apr2026-20600-PE",
      "strike": 20600,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55063",
      "symbol": "NIFTY-Apr2026-26600-PE",
      "strike": 26600,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55064",
      "symbol": "NIFTY-Apr2026-26650-CE",
      "strike": 26650,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55065",
      "symbol": "NIFTY-Apr2026-26650-PE",
      "strike": 26650,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54020",
      "symbol": "NIFTY-Apr2026-20650-CE",
      "strike": 20650,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55066",
      "symbol": "NIFTY-Apr2026-26700-CE",
      "strike": 26700,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54021",
      "symbol": "NIFTY-Apr2026-20650-PE",
      "strike": 20650,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55067",
      "symbol": "NIFTY-Apr2026-26700-PE",
      "strike": 26700,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55068",
      "symbol": "NIFTY-Apr2026-26750-CE",
      "strike": 26750,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55069",
      "symbol": "NIFTY-Apr2026-26750-PE",
      "strike": 26750,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55070",
      "symbol": "NIFTY-Apr2026-26800-CE",
      "strike": 26800,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55071",
      "symbol": "NIFTY-Apr2026-26800-PE",
      "strike": 26800,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55084",
      "symbol": "NIFTY-Apr2026-26850-CE",
      "strike": 26850,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55085",
      "symbol": "NIFTY-Apr2026-26850-PE",
      "strike": 26850,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55086",
      "symbol": "NIFTY-Apr2026-26900-CE",
      "strike": 26900,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55087",
      "symbol": "NIFTY-Apr2026-26900-PE",
      "strike": 26900,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55088",
      "symbol": "NIFTY-Apr2026-26950-CE",
      "strike": 26950,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55089",
      "symbol": "NIFTY-Apr2026-26950-PE",
      "strike": 26950,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55090",
      "symbol": "NIFTY-Apr2026-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55091",
      "symbol": "NIFTY-Apr2026-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55092",
      "symbol": "NIFTY-Apr2026-27050-CE",
      "strike": 27050,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55093",
      "symbol": "NIFTY-Apr2026-27050-PE",
      "strike": 27050,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55100",
      "symbol": "NIFTY-Apr2026-27100-CE",
      "strike": 27100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55101",
      "symbol": "NIFTY-Apr2026-27100-PE",
      "strike": 27100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55102",
      "symbol": "NIFTY-Apr2026-27150-CE",
      "strike": 27150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55103",
      "symbol": "NIFTY-Apr2026-27150-PE",
      "strike": 27150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55108",
      "symbol": "NIFTY-Apr2026-27200-CE",
      "strike": 27200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55109",
      "symbol": "NIFTY-Apr2026-27200-PE",
      "strike": 27200,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55110",
      "symbol": "NIFTY-Apr2026-27250-CE",
      "strike": 27250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55111",
      "symbol": "NIFTY-Apr2026-27250-PE",
      "strike": 27250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55112",
      "symbol": "NIFTY-Apr2026-27300-CE",
      "strike": 27300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55113",
      "symbol": "NIFTY-Apr2026-27300-PE",
      "strike": 27300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55114",
      "symbol": "NIFTY-Apr2026-27350-CE",
      "strike": 27350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55115",
      "symbol": "NIFTY-Apr2026-27350-PE",
      "strike": 27350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55121",
      "symbol": "NIFTY-Apr2026-27400-CE",
      "strike": 27400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55122",
      "symbol": "NIFTY-Apr2026-27400-PE",
      "strike": 27400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55128",
      "symbol": "NIFTY-Apr2026-27450-CE",
      "strike": 27450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55129",
      "symbol": "NIFTY-Apr2026-27450-PE",
      "strike": 27450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55138",
      "symbol": "NIFTY-Apr2026-27500-CE",
      "strike": 27500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55139",
      "symbol": "NIFTY-Apr2026-27500-PE",
      "strike": 27500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55144",
      "symbol": "NIFTY-Apr2026-27550-CE",
      "strike": 27550,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55145",
      "symbol": "NIFTY-Apr2026-27550-PE",
      "strike": 27550,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55146",
      "symbol": "NIFTY-Apr2026-27600-CE",
      "strike": 27600,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55149",
      "symbol": "NIFTY-Apr2026-27600-PE",
      "strike": 27600,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54111",
      "symbol": "NIFTY-Apr2026-20700-CE",
      "strike": 20700,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55174",
      "symbol": "NIFTY-Apr2026-27650-CE",
      "strike": 27650,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54601",
      "symbol": "NIFTY-Apr2026-21150-PE",
      "strike": 21150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54602",
      "symbol": "NIFTY-Apr2026-21200-CE",
      "strike": 21200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54603",
      "symbol": "NIFTY-Apr2026-21200-PE",
      "strike": 21200,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54604",
      "symbol": "NIFTY-Apr2026-21250-CE",
      "strike": 21250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54605",
      "symbol": "NIFTY-Apr2026-21250-PE",
      "strike": 21250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54606",
      "symbol": "NIFTY-Apr2026-21300-CE",
      "strike": 21300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54607",
      "symbol": "NIFTY-Apr2026-21300-PE",
      "strike": 21300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54125",
      "symbol": "NIFTY-Apr2026-20700-PE",
      "strike": 20700,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54608",
      "symbol": "NIFTY-Apr2026-21350-CE",
      "strike": 21350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54609",
      "symbol": "NIFTY-Apr2026-21350-PE",
      "strike": 21350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54610",
      "symbol": "NIFTY-Apr2026-21400-CE",
      "strike": 21400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55187",
      "symbol": "NIFTY-Apr2026-27650-PE",
      "strike": 27650,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54128",
      "symbol": "NIFTY-Apr2026-20750-CE",
      "strike": 20750,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54129",
      "symbol": "NIFTY-Apr2026-20750-PE",
      "strike": 20750,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54130",
      "symbol": "NIFTY-Apr2026-20800-CE",
      "strike": 20800,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55192",
      "symbol": "NIFTY-Apr2026-27700-CE",
      "strike": 27700,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54131",
      "symbol": "NIFTY-Apr2026-20800-PE",
      "strike": 20800,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55193",
      "symbol": "NIFTY-Apr2026-27700-PE",
      "strike": 27700,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55200",
      "symbol": "NIFTY-Apr2026-27750-CE",
      "strike": 27750,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55201",
      "symbol": "NIFTY-Apr2026-27750-PE",
      "strike": 27750,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55202",
      "symbol": "NIFTY-Apr2026-27800-CE",
      "strike": 27800,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55203",
      "symbol": "NIFTY-Apr2026-27800-PE",
      "strike": 27800,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55204",
      "symbol": "NIFTY-Apr2026-27850-CE",
      "strike": 27850,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55205",
      "symbol": "NIFTY-Apr2026-27850-PE",
      "strike": 27850,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55206",
      "symbol": "NIFTY-Apr2026-27900-CE",
      "strike": 27900,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55207",
      "symbol": "NIFTY-Apr2026-27900-PE",
      "strike": 27900,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54628",
      "symbol": "NIFTY-Apr2026-21400-PE",
      "strike": 21400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55210",
      "symbol": "NIFTY-Apr2026-27950-CE",
      "strike": 27950,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54629",
      "symbol": "NIFTY-Apr2026-21450-CE",
      "strike": 21450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55211",
      "symbol": "NIFTY-Apr2026-27950-PE",
      "strike": 27950,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54634",
      "symbol": "NIFTY-Apr2026-21450-PE",
      "strike": 21450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55212",
      "symbol": "NIFTY-Apr2026-28000-CE",
      "strike": 28000,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54635",
      "symbol": "NIFTY-Apr2026-21500-CE",
      "strike": 21500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55213",
      "symbol": "NIFTY-Apr2026-28000-PE",
      "strike": 28000,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54638",
      "symbol": "NIFTY-Apr2026-21500-PE",
      "strike": 21500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55214",
      "symbol": "NIFTY-Apr2026-28050-CE",
      "strike": 28050,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55215",
      "symbol": "NIFTY-Apr2026-28050-PE",
      "strike": 28050,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55216",
      "symbol": "NIFTY-Apr2026-28100-CE",
      "strike": 28100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55217",
      "symbol": "NIFTY-Apr2026-28100-PE",
      "strike": 28100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55218",
      "symbol": "NIFTY-Apr2026-28150-CE",
      "strike": 28150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55219",
      "symbol": "NIFTY-Apr2026-28150-PE",
      "strike": 28150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54647",
      "symbol": "NIFTY-Apr2026-21550-CE",
      "strike": 21550,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54648",
      "symbol": "NIFTY-Apr2026-21550-PE",
      "strike": 21550,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55222",
      "symbol": "NIFTY-Apr2026-28200-CE",
      "strike": 28200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54649",
      "symbol": "NIFTY-Apr2026-21600-CE",
      "strike": 21600,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55223",
      "symbol": "NIFTY-Apr2026-28200-PE",
      "strike": 28200,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54656",
      "symbol": "NIFTY-Apr2026-21600-PE",
      "strike": 21600,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54657",
      "symbol": "NIFTY-Apr2026-21650-CE",
      "strike": 21650,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54658",
      "symbol": "NIFTY-Apr2026-21650-PE",
      "strike": 21650,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54659",
      "symbol": "NIFTY-Apr2026-21700-CE",
      "strike": 21700,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54660",
      "symbol": "NIFTY-Apr2026-21700-PE",
      "strike": 21700,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55228",
      "symbol": "NIFTY-Apr2026-28250-CE",
      "strike": 28250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54661",
      "symbol": "NIFTY-Apr2026-21750-CE",
      "strike": 21750,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55229",
      "symbol": "NIFTY-Apr2026-28250-PE",
      "strike": 28250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54662",
      "symbol": "NIFTY-Apr2026-21750-PE",
      "strike": 21750,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55230",
      "symbol": "NIFTY-Apr2026-28300-CE",
      "strike": 28300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54663",
      "symbol": "NIFTY-Apr2026-21800-CE",
      "strike": 21800,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55231",
      "symbol": "NIFTY-Apr2026-28300-PE",
      "strike": 28300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55232",
      "symbol": "NIFTY-Apr2026-28350-CE",
      "strike": 28350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55233",
      "symbol": "NIFTY-Apr2026-28350-PE",
      "strike": 28350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55706",
      "symbol": "NIFTY-Apr2026-29450-CE",
      "strike": 29450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55707",
      "symbol": "NIFTY-Apr2026-29450-PE",
      "strike": 29450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55708",
      "symbol": "NIFTY-Apr2026-29500-CE",
      "strike": 29500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54170",
      "symbol": "NIFTY-Apr2026-20850-CE",
      "strike": 20850,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55709",
      "symbol": "NIFTY-Apr2026-29500-PE",
      "strike": 29500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54171",
      "symbol": "NIFTY-Apr2026-20850-PE",
      "strike": 20850,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54670",
      "symbol": "NIFTY-Apr2026-21800-PE",
      "strike": 21800,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54674",
      "symbol": "NIFTY-Apr2026-21850-CE",
      "strike": 21850,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54675",
      "symbol": "NIFTY-Apr2026-21850-PE",
      "strike": 21850,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54676",
      "symbol": "NIFTY-Apr2026-21900-CE",
      "strike": 21900,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54678",
      "symbol": "NIFTY-Apr2026-21900-PE",
      "strike": 21900,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54679",
      "symbol": "NIFTY-Apr2026-21950-CE",
      "strike": 21950,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54680",
      "symbol": "NIFTY-Apr2026-21950-PE",
      "strike": 21950,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55248",
      "symbol": "NIFTY-Apr2026-28400-CE",
      "strike": 28400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54681",
      "symbol": "NIFTY-Apr2026-22000-CE",
      "strike": 22000,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55249",
      "symbol": "NIFTY-Apr2026-28400-PE",
      "strike": 28400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54682",
      "symbol": "NIFTY-Apr2026-22000-PE",
      "strike": 22000,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55250",
      "symbol": "NIFTY-Apr2026-28450-CE",
      "strike": 28450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54683",
      "symbol": "NIFTY-Apr2026-22050-CE",
      "strike": 22050,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55251",
      "symbol": "NIFTY-Apr2026-28450-PE",
      "strike": 28450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54684",
      "symbol": "NIFTY-Apr2026-22050-PE",
      "strike": 22050,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55252",
      "symbol": "NIFTY-Apr2026-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54685",
      "symbol": "NIFTY-Apr2026-22100-CE",
      "strike": 22100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55253",
      "symbol": "NIFTY-Apr2026-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54686",
      "symbol": "NIFTY-Apr2026-22100-PE",
      "strike": 22100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54687",
      "symbol": "NIFTY-Apr2026-22150-CE",
      "strike": 22150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54189",
      "symbol": "NIFTY-Apr2026-20900-CE",
      "strike": 20900,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54688",
      "symbol": "NIFTY-Apr2026-22150-PE",
      "strike": 22150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54689",
      "symbol": "NIFTY-Apr2026-22200-CE",
      "strike": 22200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54690",
      "symbol": "NIFTY-Apr2026-22200-PE",
      "strike": 22200,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54691",
      "symbol": "NIFTY-Apr2026-22250-CE",
      "strike": 22250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55256",
      "symbol": "NIFTY-Apr2026-28550-CE",
      "strike": 28550,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54692",
      "symbol": "NIFTY-Apr2026-22250-PE",
      "strike": 22250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55257",
      "symbol": "NIFTY-Apr2026-28550-PE",
      "strike": 28550,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54693",
      "symbol": "NIFTY-Apr2026-22300-CE",
      "strike": 22300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53616",
      "symbol": "NIFTY-Apr2026-19000-CE",
      "strike": 19000,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54694",
      "symbol": "NIFTY-Apr2026-22300-PE",
      "strike": 22300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55259",
      "symbol": "NIFTY-Apr2026-28600-CE",
      "strike": 28600,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54695",
      "symbol": "NIFTY-Apr2026-22350-CE",
      "strike": 22350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53618",
      "symbol": "NIFTY-Apr2026-19000-PE",
      "strike": 19000,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54195",
      "symbol": "NIFTY-Apr2026-20900-PE",
      "strike": 20900,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55260",
      "symbol": "NIFTY-Apr2026-28600-PE",
      "strike": 28600,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54696",
      "symbol": "NIFTY-Apr2026-22350-PE",
      "strike": 22350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54697",
      "symbol": "NIFTY-Apr2026-22400-CE",
      "strike": 22400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54698",
      "symbol": "NIFTY-Apr2026-22400-PE",
      "strike": 22400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54699",
      "symbol": "NIFTY-Apr2026-22450-CE",
      "strike": 22450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55264",
      "symbol": "NIFTY-Apr2026-28650-CE",
      "strike": 28650,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54700",
      "symbol": "NIFTY-Apr2026-22450-PE",
      "strike": 22450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55265",
      "symbol": "NIFTY-Apr2026-28650-PE",
      "strike": 28650,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54701",
      "symbol": "NIFTY-Apr2026-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55266",
      "symbol": "NIFTY-Apr2026-28700-CE",
      "strike": 28700,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54702",
      "symbol": "NIFTY-Apr2026-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55267",
      "symbol": "NIFTY-Apr2026-28700-PE",
      "strike": 28700,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54703",
      "symbol": "NIFTY-Apr2026-22550-CE",
      "strike": 22550,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54704",
      "symbol": "NIFTY-Apr2026-22550-PE",
      "strike": 22550,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54705",
      "symbol": "NIFTY-Apr2026-22600-CE",
      "strike": 22600,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55270",
      "symbol": "NIFTY-Apr2026-28750-CE",
      "strike": 28750,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54706",
      "symbol": "NIFTY-Apr2026-22600-PE",
      "strike": 22600,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55271",
      "symbol": "NIFTY-Apr2026-28750-PE",
      "strike": 28750,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54707",
      "symbol": "NIFTY-Apr2026-22650-CE",
      "strike": 22650,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55274",
      "symbol": "NIFTY-Apr2026-28800-CE",
      "strike": 28800,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54710",
      "symbol": "NIFTY-Apr2026-22650-PE",
      "strike": 22650,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53633",
      "symbol": "NIFTY-Apr2026-19050-CE",
      "strike": 19050,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55275",
      "symbol": "NIFTY-Apr2026-28800-PE",
      "strike": 28800,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54711",
      "symbol": "NIFTY-Apr2026-22700-CE",
      "strike": 22700,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53635",
      "symbol": "NIFTY-Apr2026-19050-PE",
      "strike": 19050,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55310",
      "symbol": "NIFTY-Apr2026-28850-CE",
      "strike": 28850,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55311",
      "symbol": "NIFTY-Apr2026-28850-PE",
      "strike": 28850,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54754",
      "symbol": "NIFTY-Apr2026-22700-PE",
      "strike": 22700,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54755",
      "symbol": "NIFTY-Apr2026-22750-CE",
      "strike": 22750,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54756",
      "symbol": "NIFTY-Apr2026-22750-PE",
      "strike": 22750,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54757",
      "symbol": "NIFTY-Apr2026-22800-CE",
      "strike": 22800,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54269",
      "symbol": "NIFTY-Apr2026-20950-CE",
      "strike": 20950,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54758",
      "symbol": "NIFTY-Apr2026-22800-PE",
      "strike": 22800,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54759",
      "symbol": "NIFTY-Apr2026-22850-CE",
      "strike": 22850,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54760",
      "symbol": "NIFTY-Apr2026-22850-PE",
      "strike": 22850,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54761",
      "symbol": "NIFTY-Apr2026-22900-CE",
      "strike": 22900,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55334",
      "symbol": "NIFTY-Apr2026-28900-CE",
      "strike": 28900,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54762",
      "symbol": "NIFTY-Apr2026-22900-PE",
      "strike": 22900,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55335",
      "symbol": "NIFTY-Apr2026-28900-PE",
      "strike": 28900,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54763",
      "symbol": "NIFTY-Apr2026-22950-CE",
      "strike": 22950,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54764",
      "symbol": "NIFTY-Apr2026-22950-PE",
      "strike": 22950,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54765",
      "symbol": "NIFTY-Apr2026-23000-CE",
      "strike": 23000,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54766",
      "symbol": "NIFTY-Apr2026-23000-PE",
      "strike": 23000,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54767",
      "symbol": "NIFTY-Apr2026-23050-CE",
      "strike": 23050,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54768",
      "symbol": "NIFTY-Apr2026-23050-PE",
      "strike": 23050,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54769",
      "symbol": "NIFTY-Apr2026-23100-CE",
      "strike": 23100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54770",
      "symbol": "NIFTY-Apr2026-23100-PE",
      "strike": 23100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54771",
      "symbol": "NIFTY-Apr2026-23150-CE",
      "strike": 23150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54772",
      "symbol": "NIFTY-Apr2026-23150-PE",
      "strike": 23150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54773",
      "symbol": "NIFTY-Apr2026-23200-CE",
      "strike": 23200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54774",
      "symbol": "NIFTY-Apr2026-23200-PE",
      "strike": 23200,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54775",
      "symbol": "NIFTY-Apr2026-23250-CE",
      "strike": 23250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55347",
      "symbol": "NIFTY-Apr2026-28950-CE",
      "strike": 28950,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54776",
      "symbol": "NIFTY-Apr2026-23250-PE",
      "strike": 23250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55348",
      "symbol": "NIFTY-Apr2026-28950-PE",
      "strike": 28950,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54777",
      "symbol": "NIFTY-Apr2026-23300-CE",
      "strike": 23300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54778",
      "symbol": "NIFTY-Apr2026-23300-PE",
      "strike": 23300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54779",
      "symbol": "NIFTY-Apr2026-23350-CE",
      "strike": 23350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53703",
      "symbol": "NIFTY-Apr2026-19100-CE",
      "strike": 19100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53704",
      "symbol": "NIFTY-Apr2026-19100-PE",
      "strike": 19100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53705",
      "symbol": "NIFTY-Apr2026-19150-CE",
      "strike": 19150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53706",
      "symbol": "NIFTY-Apr2026-19150-PE",
      "strike": 19150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53711",
      "symbol": "NIFTY-Apr2026-19200-CE",
      "strike": 19200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53714",
      "symbol": "NIFTY-Apr2026-19200-PE",
      "strike": 19200,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54787",
      "symbol": "NIFTY-Apr2026-23350-PE",
      "strike": 23350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53715",
      "symbol": "NIFTY-Apr2026-19250-CE",
      "strike": 19250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54788",
      "symbol": "NIFTY-Apr2026-23400-CE",
      "strike": 23400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54789",
      "symbol": "NIFTY-Apr2026-23400-PE",
      "strike": 23400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54790",
      "symbol": "NIFTY-Apr2026-23450-CE",
      "strike": 23450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54302",
      "symbol": "NIFTY-Apr2026-20950-PE",
      "strike": 20950,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54791",
      "symbol": "NIFTY-Apr2026-23450-PE",
      "strike": 23450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54792",
      "symbol": "NIFTY-Apr2026-23500-CE",
      "strike": 23500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53720",
      "symbol": "NIFTY-Apr2026-19250-PE",
      "strike": 19250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54793",
      "symbol": "NIFTY-Apr2026-23500-PE",
      "strike": 23500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54794",
      "symbol": "NIFTY-Apr2026-23550-CE",
      "strike": 23550,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54795",
      "symbol": "NIFTY-Apr2026-23550-PE",
      "strike": 23550,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54796",
      "symbol": "NIFTY-Apr2026-23600-CE",
      "strike": 23600,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54797",
      "symbol": "NIFTY-Apr2026-23600-PE",
      "strike": 23600,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54798",
      "symbol": "NIFTY-Apr2026-23650-CE",
      "strike": 23650,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54799",
      "symbol": "NIFTY-Apr2026-23650-PE",
      "strike": 23650,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54800",
      "symbol": "NIFTY-Apr2026-23700-CE",
      "strike": 23700,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54801",
      "symbol": "NIFTY-Apr2026-23700-PE",
      "strike": 23700,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54802",
      "symbol": "NIFTY-Apr2026-23750-CE",
      "strike": 23750,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54803",
      "symbol": "NIFTY-Apr2026-23750-PE",
      "strike": 23750,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54804",
      "symbol": "NIFTY-Apr2026-23800-CE",
      "strike": 23800,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54805",
      "symbol": "NIFTY-Apr2026-23800-PE",
      "strike": 23800,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54806",
      "symbol": "NIFTY-Apr2026-23850-CE",
      "strike": 23850,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54807",
      "symbol": "NIFTY-Apr2026-23850-PE",
      "strike": 23850,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54808",
      "symbol": "NIFTY-Apr2026-23900-CE",
      "strike": 23900,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55382",
      "symbol": "NIFTY-Apr2026-29000-CE",
      "strike": 29000,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54809",
      "symbol": "NIFTY-Apr2026-23900-PE",
      "strike": 23900,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55383",
      "symbol": "NIFTY-Apr2026-29000-PE",
      "strike": 29000,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54810",
      "symbol": "NIFTY-Apr2026-23950-CE",
      "strike": 23950,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54811",
      "symbol": "NIFTY-Apr2026-23950-PE",
      "strike": 23950,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54812",
      "symbol": "NIFTY-Apr2026-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55388",
      "symbol": "NIFTY-Apr2026-29050-CE",
      "strike": 29050,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55389",
      "symbol": "NIFTY-Apr2026-29050-PE",
      "strike": 29050,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55390",
      "symbol": "NIFTY-Apr2026-29100-CE",
      "strike": 29100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54815",
      "symbol": "NIFTY-Apr2026-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55391",
      "symbol": "NIFTY-Apr2026-29100-PE",
      "strike": 29100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54816",
      "symbol": "NIFTY-Apr2026-24050-CE",
      "strike": 24050,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54817",
      "symbol": "NIFTY-Apr2026-24050-PE",
      "strike": 24050,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54818",
      "symbol": "NIFTY-Apr2026-24100-CE",
      "strike": 24100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53749",
      "symbol": "NIFTY-Apr2026-19300-CE",
      "strike": 19300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53750",
      "symbol": "NIFTY-Apr2026-19300-PE",
      "strike": 19300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54820",
      "symbol": "NIFTY-Apr2026-24100-PE",
      "strike": 24100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53753",
      "symbol": "NIFTY-Apr2026-19350-CE",
      "strike": 19350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54821",
      "symbol": "NIFTY-Apr2026-24150-CE",
      "strike": 24150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53754",
      "symbol": "NIFTY-Apr2026-19350-PE",
      "strike": 19350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53755",
      "symbol": "NIFTY-Apr2026-19400-CE",
      "strike": 19400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53757",
      "symbol": "NIFTY-Apr2026-19400-PE",
      "strike": 19400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53758",
      "symbol": "NIFTY-Apr2026-19450-CE",
      "strike": 19450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53759",
      "symbol": "NIFTY-Apr2026-19450-PE",
      "strike": 19450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54832",
      "symbol": "NIFTY-Apr2026-24150-PE",
      "strike": 24150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53765",
      "symbol": "NIFTY-Apr2026-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54833",
      "symbol": "NIFTY-Apr2026-24200-CE",
      "strike": 24200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53766",
      "symbol": "NIFTY-Apr2026-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54834",
      "symbol": "NIFTY-Apr2026-24200-PE",
      "strike": 24200,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53769",
      "symbol": "NIFTY-Apr2026-19550-CE",
      "strike": 19550,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54835",
      "symbol": "NIFTY-Apr2026-24250-CE",
      "strike": 24250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "55419",
      "symbol": "NIFTY-Apr2026-29150-CE",
      "strike": 29150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53777",
      "symbol": "NIFTY-Apr2026-19550-PE",
      "strike": 19550,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53778",
      "symbol": "NIFTY-Apr2026-19600-CE",
      "strike": 19600,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53779",
      "symbol": "NIFTY-Apr2026-19600-PE",
      "strike": 19600,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "53781",
      "symbol": "NIFTY-Apr2026-19650-CE",
      "strike": 19650,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54863",
      "symbol": "NIFTY-Apr2026-24250-PE",
      "strike": 24250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54864",
      "symbol": "NIFTY-Apr2026-24300-CE",
      "strike": 24300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54865",
      "symbol": "NIFTY-Apr2026-24300-PE",
      "strike": 24300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54866",
      "symbol": "NIFTY-Apr2026-24350-CE",
      "strike": 24350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54867",
      "symbol": "NIFTY-Apr2026-24350-PE",
      "strike": 24350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54868",
      "symbol": "NIFTY-Apr2026-24400-CE",
      "strike": 24400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "54869",
      "symbol": "NIFTY-Apr2026-24400-PE",
      "strike": 24400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45277",
      "symbol": "NIFTY-Apr2026-18600-CE",
      "strike": 18600,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45278",
      "symbol": "NIFTY-Apr2026-18600-PE",
      "strike": 18600,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45279",
      "symbol": "NIFTY-Apr2026-18650-CE",
      "strike": 18650,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45280",
      "symbol": "NIFTY-Apr2026-18650-PE",
      "strike": 18650,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45281",
      "symbol": "NIFTY-Apr2026-18700-CE",
      "strike": 18700,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45282",
      "symbol": "NIFTY-Apr2026-18700-PE",
      "strike": 18700,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45283",
      "symbol": "NIFTY-Apr2026-18750-CE",
      "strike": 18750,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45284",
      "symbol": "NIFTY-Apr2026-18750-PE",
      "strike": 18750,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45285",
      "symbol": "NIFTY-Apr2026-18800-CE",
      "strike": 18800,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45286",
      "symbol": "NIFTY-Apr2026-18800-PE",
      "strike": 18800,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45287",
      "symbol": "NIFTY-Apr2026-18850-CE",
      "strike": 18850,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45288",
      "symbol": "NIFTY-Apr2026-18850-PE",
      "strike": 18850,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45289",
      "symbol": "NIFTY-Apr2026-18900-CE",
      "strike": 18900,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45292",
      "symbol": "NIFTY-Apr2026-18900-PE",
      "strike": 18900,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45293",
      "symbol": "NIFTY-Apr2026-18950-CE",
      "strike": 18950,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "45294",
      "symbol": "NIFTY-Apr2026-18950-PE",
      "strike": 18950,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "56877",
      "symbol": "NIFTY-Apr2026-18400-CE",
      "strike": 18400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "56880",
      "symbol": "NIFTY-Apr2026-18400-PE",
      "strike": 18400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "56881",
      "symbol": "NIFTY-Apr2026-18450-CE",
      "strike": 18450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "56882",
      "symbol": "NIFTY-Apr2026-18450-PE",
      "strike": 18450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "56883",
      "symbol": "NIFTY-Apr2026-18500-CE",
      "strike": 18500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "56884",
      "symbol": "NIFTY-Apr2026-18500-PE",
      "strike": 18500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "56885",
      "symbol": "NIFTY-Apr2026-18550-CE",
      "strike": 18550,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "56886",
      "symbol": "NIFTY-Apr2026-18550-PE",
      "strike": 18550,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59469",
      "symbol": "NIFTY-Apr2026-17900-CE",
      "strike": 17900,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59470",
      "symbol": "NIFTY-Apr2026-17900-PE",
      "strike": 17900,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59471",
      "symbol": "NIFTY-Apr2026-17950-CE",
      "strike": 17950,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59472",
      "symbol": "NIFTY-Apr2026-17950-PE",
      "strike": 17950,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59473",
      "symbol": "NIFTY-Apr2026-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59474",
      "symbol": "NIFTY-Apr2026-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59475",
      "symbol": "NIFTY-Apr2026-18050-CE",
      "strike": 18050,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59476",
      "symbol": "NIFTY-Apr2026-18050-PE",
      "strike": 18050,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59481",
      "symbol": "NIFTY-Apr2026-18100-CE",
      "strike": 18100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59482",
      "symbol": "NIFTY-Apr2026-18100-PE",
      "strike": 18100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59483",
      "symbol": "NIFTY-Apr2026-18150-CE",
      "strike": 18150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59484",
      "symbol": "NIFTY-Apr2026-18150-PE",
      "strike": 18150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59485",
      "symbol": "NIFTY-Apr2026-18200-CE",
      "strike": 18200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59486",
      "symbol": "NIFTY-Apr2026-18200-PE",
      "strike": 18200,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59487",
      "symbol": "NIFTY-Apr2026-18250-CE",
      "strike": 18250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59488",
      "symbol": "NIFTY-Apr2026-18250-PE",
      "strike": 18250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59489",
      "symbol": "NIFTY-Apr2026-18300-CE",
      "strike": 18300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59490",
      "symbol": "NIFTY-Apr2026-18300-PE",
      "strike": 18300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59491",
      "symbol": "NIFTY-Apr2026-18350-CE",
      "strike": 18350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "59492",
      "symbol": "NIFTY-Apr2026-18350-PE",
      "strike": 18350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "57792",
      "symbol": "NIFTY-Apr2026-17750-CE",
      "strike": 17750,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "57793",
      "symbol": "NIFTY-Apr2026-17750-PE",
      "strike": 17750,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "57794",
      "symbol": "NIFTY-Apr2026-17800-CE",
      "strike": 17800,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "57795",
      "symbol": "NIFTY-Apr2026-17800-PE",
      "strike": 17800,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "57796",
      "symbol": "NIFTY-Apr2026-17850-CE",
      "strike": 17850,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "57797",
      "symbol": "NIFTY-Apr2026-17850-PE",
      "strike": 17850,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65823",
      "symbol": "NIFTY-Apr2026-17600-CE",
      "strike": 17600,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65824",
      "symbol": "NIFTY-Apr2026-17600-PE",
      "strike": 17600,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65826",
      "symbol": "NIFTY-Apr2026-17650-CE",
      "strike": 17650,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65827",
      "symbol": "NIFTY-Apr2026-17650-PE",
      "strike": 17650,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65828",
      "symbol": "NIFTY-Apr2026-17700-CE",
      "strike": 17700,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65829",
      "symbol": "NIFTY-Apr2026-17700-PE",
      "strike": 17700,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65805",
      "symbol": "NIFTY-Apr2026-17250-CE",
      "strike": 17250,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65807",
      "symbol": "NIFTY-Apr2026-17250-PE",
      "strike": 17250,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65808",
      "symbol": "NIFTY-Apr2026-17300-CE",
      "strike": 17300,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65809",
      "symbol": "NIFTY-Apr2026-17300-PE",
      "strike": 17300,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65811",
      "symbol": "NIFTY-Apr2026-17350-CE",
      "strike": 17350,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65812",
      "symbol": "NIFTY-Apr2026-17350-PE",
      "strike": 17350,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65814",
      "symbol": "NIFTY-Apr2026-17400-CE",
      "strike": 17400,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65815",
      "symbol": "NIFTY-Apr2026-17400-PE",
      "strike": 17400,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65816",
      "symbol": "NIFTY-Apr2026-17450-CE",
      "strike": 17450,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65817",
      "symbol": "NIFTY-Apr2026-17450-PE",
      "strike": 17450,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65818",
      "symbol": "NIFTY-Apr2026-17500-CE",
      "strike": 17500,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65819",
      "symbol": "NIFTY-Apr2026-17500-PE",
      "strike": 17500,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65820",
      "symbol": "NIFTY-Apr2026-17550-CE",
      "strike": 17550,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "65821",
      "symbol": "NIFTY-Apr2026-17550-PE",
      "strike": 17550,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "78852",
      "symbol": "NIFTY-Apr2026-17100-CE",
      "strike": 17100,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "78853",
      "symbol": "NIFTY-Apr2026-17100-PE",
      "strike": 17100,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "78854",
      "symbol": "NIFTY-Apr2026-17150-CE",
      "strike": 17150,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "78855",
      "symbol": "NIFTY-Apr2026-17150-PE",
      "strike": 17150,
      "type": "PE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "78856",
      "symbol": "NIFTY-Apr2026-17200-CE",
      "strike": 17200,
      "type": "CE",
      "expiry": "2026-04-13"
    },
    {
      "security_id": "78857",
      "symbol": "NIFTY-Apr2026-17200-PE",
      "strike": 17200,
      "type": "PE",
      "expiry": "2026-04-13"
    }
  ],
  "2026-04-21": [
    {
      "security_id": "62974",
      "symbol": "NIFTY-Apr2026-18350-CE",
      "strike": 18350,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62975",
      "symbol": "NIFTY-Apr2026-18350-PE",
      "strike": 18350,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62976",
      "symbol": "NIFTY-Apr2026-18400-CE",
      "strike": 18400,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62977",
      "symbol": "NIFTY-Apr2026-18400-PE",
      "strike": 18400,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62978",
      "symbol": "NIFTY-Apr2026-18450-CE",
      "strike": 18450,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62979",
      "symbol": "NIFTY-Apr2026-18450-PE",
      "strike": 18450,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62986",
      "symbol": "NIFTY-Apr2026-18500-CE",
      "strike": 18500,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62987",
      "symbol": "NIFTY-Apr2026-18500-PE",
      "strike": 18500,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62993",
      "symbol": "NIFTY-Apr2026-18550-CE",
      "strike": 18550,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62994",
      "symbol": "NIFTY-Apr2026-18550-PE",
      "strike": 18550,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62995",
      "symbol": "NIFTY-Apr2026-18600-CE",
      "strike": 18600,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62996",
      "symbol": "NIFTY-Apr2026-18600-PE",
      "strike": 18600,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62997",
      "symbol": "NIFTY-Apr2026-18650-CE",
      "strike": 18650,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62998",
      "symbol": "NIFTY-Apr2026-18650-PE",
      "strike": 18650,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "62999",
      "symbol": "NIFTY-Apr2026-18700-CE",
      "strike": 18700,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63000",
      "symbol": "NIFTY-Apr2026-18700-PE",
      "strike": 18700,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63001",
      "symbol": "NIFTY-Apr2026-18750-CE",
      "strike": 18750,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63002",
      "symbol": "NIFTY-Apr2026-18750-PE",
      "strike": 18750,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63003",
      "symbol": "NIFTY-Apr2026-18800-CE",
      "strike": 18800,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63004",
      "symbol": "NIFTY-Apr2026-18800-PE",
      "strike": 18800,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63005",
      "symbol": "NIFTY-Apr2026-18850-CE",
      "strike": 18850,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63006",
      "symbol": "NIFTY-Apr2026-18850-PE",
      "strike": 18850,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63032",
      "symbol": "NIFTY-Apr2026-18900-CE",
      "strike": 18900,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63033",
      "symbol": "NIFTY-Apr2026-18900-PE",
      "strike": 18900,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63034",
      "symbol": "NIFTY-Apr2026-18950-CE",
      "strike": 18950,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63035",
      "symbol": "NIFTY-Apr2026-18950-PE",
      "strike": 18950,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63036",
      "symbol": "NIFTY-Apr2026-19000-CE",
      "strike": 19000,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63037",
      "symbol": "NIFTY-Apr2026-19000-PE",
      "strike": 19000,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63038",
      "symbol": "NIFTY-Apr2026-19050-CE",
      "strike": 19050,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63039",
      "symbol": "NIFTY-Apr2026-19050-PE",
      "strike": 19050,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63040",
      "symbol": "NIFTY-Apr2026-19100-CE",
      "strike": 19100,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63041",
      "symbol": "NIFTY-Apr2026-19100-PE",
      "strike": 19100,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63042",
      "symbol": "NIFTY-Apr2026-19150-CE",
      "strike": 19150,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63043",
      "symbol": "NIFTY-Apr2026-19150-PE",
      "strike": 19150,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63044",
      "symbol": "NIFTY-Apr2026-19200-CE",
      "strike": 19200,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63045",
      "symbol": "NIFTY-Apr2026-19200-PE",
      "strike": 19200,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63046",
      "symbol": "NIFTY-Apr2026-19250-CE",
      "strike": 19250,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63047",
      "symbol": "NIFTY-Apr2026-19250-PE",
      "strike": 19250,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63048",
      "symbol": "NIFTY-Apr2026-19300-CE",
      "strike": 19300,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63049",
      "symbol": "NIFTY-Apr2026-19300-PE",
      "strike": 19300,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63050",
      "symbol": "NIFTY-Apr2026-19350-CE",
      "strike": 19350,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63051",
      "symbol": "NIFTY-Apr2026-19350-PE",
      "strike": 19350,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63053",
      "symbol": "NIFTY-Apr2026-19400-CE",
      "strike": 19400,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63054",
      "symbol": "NIFTY-Apr2026-19400-PE",
      "strike": 19400,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63055",
      "symbol": "NIFTY-Apr2026-19450-CE",
      "strike": 19450,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63056",
      "symbol": "NIFTY-Apr2026-19450-PE",
      "strike": 19450,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63063",
      "symbol": "NIFTY-Apr2026-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63064",
      "symbol": "NIFTY-Apr2026-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63065",
      "symbol": "NIFTY-Apr2026-19550-CE",
      "strike": 19550,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63066",
      "symbol": "NIFTY-Apr2026-19550-PE",
      "strike": 19550,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63076",
      "symbol": "NIFTY-Apr2026-19600-CE",
      "strike": 19600,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63077",
      "symbol": "NIFTY-Apr2026-19600-PE",
      "strike": 19600,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63078",
      "symbol": "NIFTY-Apr2026-19650-CE",
      "strike": 19650,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63082",
      "symbol": "NIFTY-Apr2026-19650-PE",
      "strike": 19650,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63083",
      "symbol": "NIFTY-Apr2026-19700-CE",
      "strike": 19700,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63084",
      "symbol": "NIFTY-Apr2026-19700-PE",
      "strike": 19700,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63085",
      "symbol": "NIFTY-Apr2026-19750-CE",
      "strike": 19750,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63086",
      "symbol": "NIFTY-Apr2026-19750-PE",
      "strike": 19750,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63087",
      "symbol": "NIFTY-Apr2026-19800-CE",
      "strike": 19800,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63088",
      "symbol": "NIFTY-Apr2026-19800-PE",
      "strike": 19800,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63089",
      "symbol": "NIFTY-Apr2026-19850-CE",
      "strike": 19850,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63090",
      "symbol": "NIFTY-Apr2026-19850-PE",
      "strike": 19850,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63091",
      "symbol": "NIFTY-Apr2026-19900-CE",
      "strike": 19900,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63096",
      "symbol": "NIFTY-Apr2026-19900-PE",
      "strike": 19900,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63097",
      "symbol": "NIFTY-Apr2026-19950-CE",
      "strike": 19950,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63100",
      "symbol": "NIFTY-Apr2026-19950-PE",
      "strike": 19950,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63107",
      "symbol": "NIFTY-Apr2026-20000-CE",
      "strike": 20000,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63108",
      "symbol": "NIFTY-Apr2026-20000-PE",
      "strike": 20000,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63109",
      "symbol": "NIFTY-Apr2026-20050-CE",
      "strike": 20050,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63110",
      "symbol": "NIFTY-Apr2026-20050-PE",
      "strike": 20050,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63113",
      "symbol": "NIFTY-Apr2026-20100-CE",
      "strike": 20100,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63119",
      "symbol": "NIFTY-Apr2026-20100-PE",
      "strike": 20100,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63120",
      "symbol": "NIFTY-Apr2026-20150-CE",
      "strike": 20150,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63127",
      "symbol": "NIFTY-Apr2026-20150-PE",
      "strike": 20150,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63128",
      "symbol": "NIFTY-Apr2026-20200-CE",
      "strike": 20200,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63129",
      "symbol": "NIFTY-Apr2026-20200-PE",
      "strike": 20200,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63130",
      "symbol": "NIFTY-Apr2026-20250-CE",
      "strike": 20250,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63131",
      "symbol": "NIFTY-Apr2026-20250-PE",
      "strike": 20250,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63132",
      "symbol": "NIFTY-Apr2026-20300-CE",
      "strike": 20300,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63133",
      "symbol": "NIFTY-Apr2026-20300-PE",
      "strike": 20300,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63134",
      "symbol": "NIFTY-Apr2026-20350-CE",
      "strike": 20350,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63135",
      "symbol": "NIFTY-Apr2026-20350-PE",
      "strike": 20350,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63136",
      "symbol": "NIFTY-Apr2026-20400-CE",
      "strike": 20400,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63137",
      "symbol": "NIFTY-Apr2026-20400-PE",
      "strike": 20400,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63138",
      "symbol": "NIFTY-Apr2026-20450-CE",
      "strike": 20450,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63150",
      "symbol": "NIFTY-Apr2026-20450-PE",
      "strike": 20450,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63151",
      "symbol": "NIFTY-Apr2026-20500-CE",
      "strike": 20500,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63152",
      "symbol": "NIFTY-Apr2026-20500-PE",
      "strike": 20500,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63153",
      "symbol": "NIFTY-Apr2026-20550-CE",
      "strike": 20550,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63160",
      "symbol": "NIFTY-Apr2026-20550-PE",
      "strike": 20550,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63161",
      "symbol": "NIFTY-Apr2026-20600-CE",
      "strike": 20600,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63162",
      "symbol": "NIFTY-Apr2026-20600-PE",
      "strike": 20600,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63163",
      "symbol": "NIFTY-Apr2026-20650-CE",
      "strike": 20650,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63164",
      "symbol": "NIFTY-Apr2026-20650-PE",
      "strike": 20650,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63165",
      "symbol": "NIFTY-Apr2026-20700-CE",
      "strike": 20700,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63166",
      "symbol": "NIFTY-Apr2026-20700-PE",
      "strike": 20700,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63167",
      "symbol": "NIFTY-Apr2026-20750-CE",
      "strike": 20750,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63168",
      "symbol": "NIFTY-Apr2026-20750-PE",
      "strike": 20750,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63169",
      "symbol": "NIFTY-Apr2026-20800-CE",
      "strike": 20800,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63170",
      "symbol": "NIFTY-Apr2026-20800-PE",
      "strike": 20800,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63172",
      "symbol": "NIFTY-Apr2026-20850-CE",
      "strike": 20850,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63179",
      "symbol": "NIFTY-Apr2026-20850-PE",
      "strike": 20850,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63180",
      "symbol": "NIFTY-Apr2026-20900-CE",
      "strike": 20900,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63181",
      "symbol": "NIFTY-Apr2026-20900-PE",
      "strike": 20900,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63182",
      "symbol": "NIFTY-Apr2026-20950-CE",
      "strike": 20950,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63187",
      "symbol": "NIFTY-Apr2026-20950-PE",
      "strike": 20950,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63188",
      "symbol": "NIFTY-Apr2026-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63189",
      "symbol": "NIFTY-Apr2026-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63195",
      "symbol": "NIFTY-Apr2026-21050-CE",
      "strike": 21050,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63196",
      "symbol": "NIFTY-Apr2026-21050-PE",
      "strike": 21050,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63201",
      "symbol": "NIFTY-Apr2026-21100-CE",
      "strike": 21100,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63202",
      "symbol": "NIFTY-Apr2026-21100-PE",
      "strike": 21100,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63254",
      "symbol": "NIFTY-Apr2026-21150-CE",
      "strike": 21150,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63255",
      "symbol": "NIFTY-Apr2026-21150-PE",
      "strike": 21150,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63256",
      "symbol": "NIFTY-Apr2026-21200-CE",
      "strike": 21200,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63257",
      "symbol": "NIFTY-Apr2026-21200-PE",
      "strike": 21200,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63269",
      "symbol": "NIFTY-Apr2026-21250-CE",
      "strike": 21250,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63272",
      "symbol": "NIFTY-Apr2026-21250-PE",
      "strike": 21250,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63275",
      "symbol": "NIFTY-Apr2026-21300-CE",
      "strike": 21300,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63276",
      "symbol": "NIFTY-Apr2026-21300-PE",
      "strike": 21300,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63277",
      "symbol": "NIFTY-Apr2026-21350-CE",
      "strike": 21350,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63278",
      "symbol": "NIFTY-Apr2026-21350-PE",
      "strike": 21350,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63280",
      "symbol": "NIFTY-Apr2026-21400-CE",
      "strike": 21400,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63281",
      "symbol": "NIFTY-Apr2026-21400-PE",
      "strike": 21400,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63284",
      "symbol": "NIFTY-Apr2026-21450-CE",
      "strike": 21450,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63285",
      "symbol": "NIFTY-Apr2026-21450-PE",
      "strike": 21450,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63288",
      "symbol": "NIFTY-Apr2026-21500-CE",
      "strike": 21500,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63289",
      "symbol": "NIFTY-Apr2026-21500-PE",
      "strike": 21500,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63292",
      "symbol": "NIFTY-Apr2026-21550-CE",
      "strike": 21550,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63293",
      "symbol": "NIFTY-Apr2026-21550-PE",
      "strike": 21550,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63294",
      "symbol": "NIFTY-Apr2026-21600-CE",
      "strike": 21600,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63298",
      "symbol": "NIFTY-Apr2026-21600-PE",
      "strike": 21600,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63299",
      "symbol": "NIFTY-Apr2026-21650-CE",
      "strike": 21650,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63302",
      "symbol": "NIFTY-Apr2026-21650-PE",
      "strike": 21650,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63303",
      "symbol": "NIFTY-Apr2026-21700-CE",
      "strike": 21700,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63306",
      "symbol": "NIFTY-Apr2026-21700-PE",
      "strike": 21700,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63307",
      "symbol": "NIFTY-Apr2026-21750-CE",
      "strike": 21750,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63308",
      "symbol": "NIFTY-Apr2026-21750-PE",
      "strike": 21750,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63309",
      "symbol": "NIFTY-Apr2026-21800-CE",
      "strike": 21800,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63310",
      "symbol": "NIFTY-Apr2026-21800-PE",
      "strike": 21800,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63311",
      "symbol": "NIFTY-Apr2026-21850-CE",
      "strike": 21850,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63315",
      "symbol": "NIFTY-Apr2026-21850-PE",
      "strike": 21850,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63316",
      "symbol": "NIFTY-Apr2026-21900-CE",
      "strike": 21900,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63317",
      "symbol": "NIFTY-Apr2026-21900-PE",
      "strike": 21900,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63318",
      "symbol": "NIFTY-Apr2026-21950-CE",
      "strike": 21950,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63319",
      "symbol": "NIFTY-Apr2026-21950-PE",
      "strike": 21950,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63320",
      "symbol": "NIFTY-Apr2026-22000-CE",
      "strike": 22000,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63321",
      "symbol": "NIFTY-Apr2026-22000-PE",
      "strike": 22000,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63322",
      "symbol": "NIFTY-Apr2026-22050-CE",
      "strike": 22050,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63323",
      "symbol": "NIFTY-Apr2026-22050-PE",
      "strike": 22050,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63324",
      "symbol": "NIFTY-Apr2026-22100-CE",
      "strike": 22100,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63327",
      "symbol": "NIFTY-Apr2026-22100-PE",
      "strike": 22100,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63328",
      "symbol": "NIFTY-Apr2026-22150-CE",
      "strike": 22150,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63329",
      "symbol": "NIFTY-Apr2026-22150-PE",
      "strike": 22150,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63330",
      "symbol": "NIFTY-Apr2026-22200-CE",
      "strike": 22200,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63331",
      "symbol": "NIFTY-Apr2026-22200-PE",
      "strike": 22200,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63332",
      "symbol": "NIFTY-Apr2026-22250-CE",
      "strike": 22250,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63333",
      "symbol": "NIFTY-Apr2026-22250-PE",
      "strike": 22250,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63334",
      "symbol": "NIFTY-Apr2026-22300-CE",
      "strike": 22300,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63335",
      "symbol": "NIFTY-Apr2026-22300-PE",
      "strike": 22300,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63336",
      "symbol": "NIFTY-Apr2026-22350-CE",
      "strike": 22350,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63338",
      "symbol": "NIFTY-Apr2026-22350-PE",
      "strike": 22350,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63339",
      "symbol": "NIFTY-Apr2026-22400-CE",
      "strike": 22400,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63341",
      "symbol": "NIFTY-Apr2026-22400-PE",
      "strike": 22400,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63698",
      "symbol": "NIFTY-Apr2026-28600-CE",
      "strike": 28600,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63342",
      "symbol": "NIFTY-Apr2026-22450-CE",
      "strike": 22450,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63343",
      "symbol": "NIFTY-Apr2026-22450-PE",
      "strike": 22450,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63699",
      "symbol": "NIFTY-Apr2026-28600-PE",
      "strike": 28600,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63700",
      "symbol": "NIFTY-Apr2026-28650-CE",
      "strike": 28650,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63702",
      "symbol": "NIFTY-Apr2026-28650-PE",
      "strike": 28650,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63344",
      "symbol": "NIFTY-Apr2026-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63703",
      "symbol": "NIFTY-Apr2026-28700-CE",
      "strike": 28700,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63345",
      "symbol": "NIFTY-Apr2026-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63705",
      "symbol": "NIFTY-Apr2026-28700-PE",
      "strike": 28700,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63346",
      "symbol": "NIFTY-Apr2026-22550-CE",
      "strike": 22550,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63706",
      "symbol": "NIFTY-Apr2026-28750-CE",
      "strike": 28750,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63352",
      "symbol": "NIFTY-Apr2026-22550-PE",
      "strike": 22550,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63707",
      "symbol": "NIFTY-Apr2026-28750-PE",
      "strike": 28750,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63353",
      "symbol": "NIFTY-Apr2026-22600-CE",
      "strike": 22600,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63708",
      "symbol": "NIFTY-Apr2026-28800-CE",
      "strike": 28800,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63354",
      "symbol": "NIFTY-Apr2026-22600-PE",
      "strike": 22600,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63710",
      "symbol": "NIFTY-Apr2026-28800-PE",
      "strike": 28800,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63355",
      "symbol": "NIFTY-Apr2026-22650-CE",
      "strike": 22650,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63711",
      "symbol": "NIFTY-Apr2026-28850-CE",
      "strike": 28850,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63356",
      "symbol": "NIFTY-Apr2026-22650-PE",
      "strike": 22650,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63712",
      "symbol": "NIFTY-Apr2026-28850-PE",
      "strike": 28850,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63357",
      "symbol": "NIFTY-Apr2026-22700-CE",
      "strike": 22700,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63360",
      "symbol": "NIFTY-Apr2026-22700-PE",
      "strike": 22700,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63361",
      "symbol": "NIFTY-Apr2026-22750-CE",
      "strike": 22750,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63363",
      "symbol": "NIFTY-Apr2026-22750-PE",
      "strike": 22750,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63364",
      "symbol": "NIFTY-Apr2026-22800-CE",
      "strike": 22800,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63365",
      "symbol": "NIFTY-Apr2026-22800-PE",
      "strike": 22800,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63366",
      "symbol": "NIFTY-Apr2026-22850-CE",
      "strike": 22850,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63369",
      "symbol": "NIFTY-Apr2026-22850-PE",
      "strike": 22850,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63370",
      "symbol": "NIFTY-Apr2026-22900-CE",
      "strike": 22900,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63373",
      "symbol": "NIFTY-Apr2026-22900-PE",
      "strike": 22900,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63374",
      "symbol": "NIFTY-Apr2026-22950-CE",
      "strike": 22950,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63375",
      "symbol": "NIFTY-Apr2026-22950-PE",
      "strike": 22950,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63376",
      "symbol": "NIFTY-Apr2026-23000-CE",
      "strike": 23000,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63377",
      "symbol": "NIFTY-Apr2026-23000-PE",
      "strike": 23000,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63378",
      "symbol": "NIFTY-Apr2026-23050-CE",
      "strike": 23050,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63379",
      "symbol": "NIFTY-Apr2026-23050-PE",
      "strike": 23050,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63380",
      "symbol": "NIFTY-Apr2026-23100-CE",
      "strike": 23100,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63381",
      "symbol": "NIFTY-Apr2026-23100-PE",
      "strike": 23100,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63382",
      "symbol": "NIFTY-Apr2026-23150-CE",
      "strike": 23150,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63383",
      "symbol": "NIFTY-Apr2026-23150-PE",
      "strike": 23150,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63384",
      "symbol": "NIFTY-Apr2026-23200-CE",
      "strike": 23200,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63385",
      "symbol": "NIFTY-Apr2026-23200-PE",
      "strike": 23200,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63386",
      "symbol": "NIFTY-Apr2026-23250-CE",
      "strike": 23250,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63387",
      "symbol": "NIFTY-Apr2026-23250-PE",
      "strike": 23250,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63388",
      "symbol": "NIFTY-Apr2026-23300-CE",
      "strike": 23300,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63389",
      "symbol": "NIFTY-Apr2026-23300-PE",
      "strike": 23300,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63390",
      "symbol": "NIFTY-Apr2026-23350-CE",
      "strike": 23350,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63391",
      "symbol": "NIFTY-Apr2026-23350-PE",
      "strike": 23350,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63392",
      "symbol": "NIFTY-Apr2026-23400-CE",
      "strike": 23400,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63393",
      "symbol": "NIFTY-Apr2026-23400-PE",
      "strike": 23400,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63394",
      "symbol": "NIFTY-Apr2026-23450-CE",
      "strike": 23450,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63395",
      "symbol": "NIFTY-Apr2026-23450-PE",
      "strike": 23450,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63396",
      "symbol": "NIFTY-Apr2026-23500-CE",
      "strike": 23500,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63397",
      "symbol": "NIFTY-Apr2026-23500-PE",
      "strike": 23500,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63398",
      "symbol": "NIFTY-Apr2026-23550-CE",
      "strike": 23550,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63399",
      "symbol": "NIFTY-Apr2026-23550-PE",
      "strike": 23550,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63400",
      "symbol": "NIFTY-Apr2026-23600-CE",
      "strike": 23600,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63401",
      "symbol": "NIFTY-Apr2026-23600-PE",
      "strike": 23600,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63402",
      "symbol": "NIFTY-Apr2026-23650-CE",
      "strike": 23650,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63403",
      "symbol": "NIFTY-Apr2026-23650-PE",
      "strike": 23650,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63404",
      "symbol": "NIFTY-Apr2026-23700-CE",
      "strike": 23700,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63405",
      "symbol": "NIFTY-Apr2026-23700-PE",
      "strike": 23700,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63406",
      "symbol": "NIFTY-Apr2026-23750-CE",
      "strike": 23750,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63407",
      "symbol": "NIFTY-Apr2026-23750-PE",
      "strike": 23750,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63408",
      "symbol": "NIFTY-Apr2026-23800-CE",
      "strike": 23800,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63409",
      "symbol": "NIFTY-Apr2026-23800-PE",
      "strike": 23800,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63410",
      "symbol": "NIFTY-Apr2026-23850-CE",
      "strike": 23850,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63411",
      "symbol": "NIFTY-Apr2026-23850-PE",
      "strike": 23850,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63412",
      "symbol": "NIFTY-Apr2026-23900-CE",
      "strike": 23900,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63413",
      "symbol": "NIFTY-Apr2026-23900-PE",
      "strike": 23900,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63414",
      "symbol": "NIFTY-Apr2026-23950-CE",
      "strike": 23950,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63415",
      "symbol": "NIFTY-Apr2026-23950-PE",
      "strike": 23950,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63416",
      "symbol": "NIFTY-Apr2026-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63417",
      "symbol": "NIFTY-Apr2026-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63420",
      "symbol": "NIFTY-Apr2026-24050-CE",
      "strike": 24050,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63421",
      "symbol": "NIFTY-Apr2026-24050-PE",
      "strike": 24050,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63422",
      "symbol": "NIFTY-Apr2026-24100-CE",
      "strike": 24100,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63423",
      "symbol": "NIFTY-Apr2026-24100-PE",
      "strike": 24100,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63424",
      "symbol": "NIFTY-Apr2026-24150-CE",
      "strike": 24150,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63425",
      "symbol": "NIFTY-Apr2026-24150-PE",
      "strike": 24150,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63426",
      "symbol": "NIFTY-Apr2026-24200-CE",
      "strike": 24200,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63427",
      "symbol": "NIFTY-Apr2026-24200-PE",
      "strike": 24200,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63428",
      "symbol": "NIFTY-Apr2026-24250-CE",
      "strike": 24250,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63429",
      "symbol": "NIFTY-Apr2026-24250-PE",
      "strike": 24250,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63430",
      "symbol": "NIFTY-Apr2026-24300-CE",
      "strike": 24300,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63431",
      "symbol": "NIFTY-Apr2026-24300-PE",
      "strike": 24300,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63434",
      "symbol": "NIFTY-Apr2026-24350-CE",
      "strike": 24350,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63435",
      "symbol": "NIFTY-Apr2026-24350-PE",
      "strike": 24350,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63436",
      "symbol": "NIFTY-Apr2026-24400-CE",
      "strike": 24400,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63437",
      "symbol": "NIFTY-Apr2026-24400-PE",
      "strike": 24400,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63444",
      "symbol": "NIFTY-Apr2026-24450-CE",
      "strike": 24450,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63445",
      "symbol": "NIFTY-Apr2026-24450-PE",
      "strike": 24450,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63447",
      "symbol": "NIFTY-Apr2026-24500-CE",
      "strike": 24500,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63457",
      "symbol": "NIFTY-Apr2026-24500-PE",
      "strike": 24500,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63458",
      "symbol": "NIFTY-Apr2026-24550-CE",
      "strike": 24550,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63463",
      "symbol": "NIFTY-Apr2026-24550-PE",
      "strike": 24550,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63464",
      "symbol": "NIFTY-Apr2026-24600-CE",
      "strike": 24600,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63465",
      "symbol": "NIFTY-Apr2026-24600-PE",
      "strike": 24600,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63466",
      "symbol": "NIFTY-Apr2026-24650-CE",
      "strike": 24650,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63467",
      "symbol": "NIFTY-Apr2026-24650-PE",
      "strike": 24650,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63468",
      "symbol": "NIFTY-Apr2026-24700-CE",
      "strike": 24700,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63469",
      "symbol": "NIFTY-Apr2026-24700-PE",
      "strike": 24700,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63470",
      "symbol": "NIFTY-Apr2026-24750-CE",
      "strike": 24750,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63471",
      "symbol": "NIFTY-Apr2026-24750-PE",
      "strike": 24750,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63472",
      "symbol": "NIFTY-Apr2026-24800-CE",
      "strike": 24800,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63473",
      "symbol": "NIFTY-Apr2026-24800-PE",
      "strike": 24800,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63474",
      "symbol": "NIFTY-Apr2026-24850-CE",
      "strike": 24850,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63475",
      "symbol": "NIFTY-Apr2026-24850-PE",
      "strike": 24850,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63476",
      "symbol": "NIFTY-Apr2026-24900-CE",
      "strike": 24900,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63477",
      "symbol": "NIFTY-Apr2026-24900-PE",
      "strike": 24900,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63478",
      "symbol": "NIFTY-Apr2026-24950-CE",
      "strike": 24950,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63479",
      "symbol": "NIFTY-Apr2026-24950-PE",
      "strike": 24950,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63480",
      "symbol": "NIFTY-Apr2026-25000-CE",
      "strike": 25000,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63481",
      "symbol": "NIFTY-Apr2026-25000-PE",
      "strike": 25000,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63482",
      "symbol": "NIFTY-Apr2026-25050-CE",
      "strike": 25050,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63483",
      "symbol": "NIFTY-Apr2026-25050-PE",
      "strike": 25050,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63484",
      "symbol": "NIFTY-Apr2026-25100-CE",
      "strike": 25100,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63485",
      "symbol": "NIFTY-Apr2026-25100-PE",
      "strike": 25100,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63486",
      "symbol": "NIFTY-Apr2026-25150-CE",
      "strike": 25150,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63489",
      "symbol": "NIFTY-Apr2026-25150-PE",
      "strike": 25150,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63490",
      "symbol": "NIFTY-Apr2026-25200-CE",
      "strike": 25200,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63491",
      "symbol": "NIFTY-Apr2026-25200-PE",
      "strike": 25200,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63492",
      "symbol": "NIFTY-Apr2026-25250-CE",
      "strike": 25250,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63493",
      "symbol": "NIFTY-Apr2026-25250-PE",
      "strike": 25250,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63494",
      "symbol": "NIFTY-Apr2026-25300-CE",
      "strike": 25300,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63495",
      "symbol": "NIFTY-Apr2026-25300-PE",
      "strike": 25300,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63496",
      "symbol": "NIFTY-Apr2026-25350-CE",
      "strike": 25350,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63497",
      "symbol": "NIFTY-Apr2026-25350-PE",
      "strike": 25350,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63498",
      "symbol": "NIFTY-Apr2026-25400-CE",
      "strike": 25400,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63503",
      "symbol": "NIFTY-Apr2026-25400-PE",
      "strike": 25400,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63504",
      "symbol": "NIFTY-Apr2026-25450-CE",
      "strike": 25450,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63505",
      "symbol": "NIFTY-Apr2026-25450-PE",
      "strike": 25450,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63506",
      "symbol": "NIFTY-Apr2026-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63511",
      "symbol": "NIFTY-Apr2026-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63512",
      "symbol": "NIFTY-Apr2026-25550-CE",
      "strike": 25550,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63513",
      "symbol": "NIFTY-Apr2026-25550-PE",
      "strike": 25550,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63514",
      "symbol": "NIFTY-Apr2026-25600-CE",
      "strike": 25600,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63519",
      "symbol": "NIFTY-Apr2026-25600-PE",
      "strike": 25600,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63520",
      "symbol": "NIFTY-Apr2026-25650-CE",
      "strike": 25650,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63521",
      "symbol": "NIFTY-Apr2026-25650-PE",
      "strike": 25650,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63522",
      "symbol": "NIFTY-Apr2026-25700-CE",
      "strike": 25700,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63529",
      "symbol": "NIFTY-Apr2026-25700-PE",
      "strike": 25700,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63530",
      "symbol": "NIFTY-Apr2026-25750-CE",
      "strike": 25750,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63531",
      "symbol": "NIFTY-Apr2026-25750-PE",
      "strike": 25750,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63532",
      "symbol": "NIFTY-Apr2026-25800-CE",
      "strike": 25800,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63535",
      "symbol": "NIFTY-Apr2026-25800-PE",
      "strike": 25800,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63536",
      "symbol": "NIFTY-Apr2026-25850-CE",
      "strike": 25850,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63537",
      "symbol": "NIFTY-Apr2026-25850-PE",
      "strike": 25850,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63538",
      "symbol": "NIFTY-Apr2026-25900-CE",
      "strike": 25900,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63539",
      "symbol": "NIFTY-Apr2026-25900-PE",
      "strike": 25900,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63540",
      "symbol": "NIFTY-Apr2026-25950-CE",
      "strike": 25950,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63541",
      "symbol": "NIFTY-Apr2026-25950-PE",
      "strike": 25950,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63542",
      "symbol": "NIFTY-Apr2026-26000-CE",
      "strike": 26000,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63543",
      "symbol": "NIFTY-Apr2026-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63544",
      "symbol": "NIFTY-Apr2026-26050-CE",
      "strike": 26050,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63545",
      "symbol": "NIFTY-Apr2026-26050-PE",
      "strike": 26050,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63546",
      "symbol": "NIFTY-Apr2026-26100-CE",
      "strike": 26100,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63547",
      "symbol": "NIFTY-Apr2026-26100-PE",
      "strike": 26100,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63548",
      "symbol": "NIFTY-Apr2026-26150-CE",
      "strike": 26150,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63549",
      "symbol": "NIFTY-Apr2026-26150-PE",
      "strike": 26150,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63550",
      "symbol": "NIFTY-Apr2026-26200-CE",
      "strike": 26200,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63551",
      "symbol": "NIFTY-Apr2026-26200-PE",
      "strike": 26200,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63552",
      "symbol": "NIFTY-Apr2026-26250-CE",
      "strike": 26250,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63553",
      "symbol": "NIFTY-Apr2026-26250-PE",
      "strike": 26250,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63554",
      "symbol": "NIFTY-Apr2026-26300-CE",
      "strike": 26300,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63555",
      "symbol": "NIFTY-Apr2026-26300-PE",
      "strike": 26300,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63556",
      "symbol": "NIFTY-Apr2026-26350-CE",
      "strike": 26350,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63557",
      "symbol": "NIFTY-Apr2026-26350-PE",
      "strike": 26350,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63558",
      "symbol": "NIFTY-Apr2026-26400-CE",
      "strike": 26400,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63559",
      "symbol": "NIFTY-Apr2026-26400-PE",
      "strike": 26400,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63560",
      "symbol": "NIFTY-Apr2026-26450-CE",
      "strike": 26450,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63561",
      "symbol": "NIFTY-Apr2026-26450-PE",
      "strike": 26450,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63562",
      "symbol": "NIFTY-Apr2026-26500-CE",
      "strike": 26500,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63563",
      "symbol": "NIFTY-Apr2026-26500-PE",
      "strike": 26500,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63564",
      "symbol": "NIFTY-Apr2026-26550-CE",
      "strike": 26550,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63565",
      "symbol": "NIFTY-Apr2026-26550-PE",
      "strike": 26550,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63566",
      "symbol": "NIFTY-Apr2026-26600-CE",
      "strike": 26600,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63567",
      "symbol": "NIFTY-Apr2026-26600-PE",
      "strike": 26600,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63568",
      "symbol": "NIFTY-Apr2026-26650-CE",
      "strike": 26650,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63569",
      "symbol": "NIFTY-Apr2026-26650-PE",
      "strike": 26650,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63570",
      "symbol": "NIFTY-Apr2026-26700-CE",
      "strike": 26700,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63571",
      "symbol": "NIFTY-Apr2026-26700-PE",
      "strike": 26700,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63572",
      "symbol": "NIFTY-Apr2026-26750-CE",
      "strike": 26750,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63573",
      "symbol": "NIFTY-Apr2026-26750-PE",
      "strike": 26750,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63574",
      "symbol": "NIFTY-Apr2026-26800-CE",
      "strike": 26800,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63575",
      "symbol": "NIFTY-Apr2026-26800-PE",
      "strike": 26800,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63576",
      "symbol": "NIFTY-Apr2026-26850-CE",
      "strike": 26850,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63577",
      "symbol": "NIFTY-Apr2026-26850-PE",
      "strike": 26850,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63578",
      "symbol": "NIFTY-Apr2026-26900-CE",
      "strike": 26900,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63579",
      "symbol": "NIFTY-Apr2026-26900-PE",
      "strike": 26900,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63580",
      "symbol": "NIFTY-Apr2026-26950-CE",
      "strike": 26950,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63581",
      "symbol": "NIFTY-Apr2026-26950-PE",
      "strike": 26950,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63582",
      "symbol": "NIFTY-Apr2026-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63583",
      "symbol": "NIFTY-Apr2026-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63584",
      "symbol": "NIFTY-Apr2026-27050-CE",
      "strike": 27050,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63587",
      "symbol": "NIFTY-Apr2026-27050-PE",
      "strike": 27050,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63588",
      "symbol": "NIFTY-Apr2026-27100-CE",
      "strike": 27100,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63589",
      "symbol": "NIFTY-Apr2026-27100-PE",
      "strike": 27100,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63590",
      "symbol": "NIFTY-Apr2026-27150-CE",
      "strike": 27150,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63591",
      "symbol": "NIFTY-Apr2026-27150-PE",
      "strike": 27150,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63592",
      "symbol": "NIFTY-Apr2026-27200-CE",
      "strike": 27200,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63600",
      "symbol": "NIFTY-Apr2026-27200-PE",
      "strike": 27200,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63601",
      "symbol": "NIFTY-Apr2026-27250-CE",
      "strike": 27250,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63602",
      "symbol": "NIFTY-Apr2026-27250-PE",
      "strike": 27250,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63603",
      "symbol": "NIFTY-Apr2026-27300-CE",
      "strike": 27300,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63604",
      "symbol": "NIFTY-Apr2026-27300-PE",
      "strike": 27300,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63605",
      "symbol": "NIFTY-Apr2026-27350-CE",
      "strike": 27350,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63606",
      "symbol": "NIFTY-Apr2026-27350-PE",
      "strike": 27350,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63607",
      "symbol": "NIFTY-Apr2026-27400-CE",
      "strike": 27400,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63608",
      "symbol": "NIFTY-Apr2026-27400-PE",
      "strike": 27400,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63609",
      "symbol": "NIFTY-Apr2026-27450-CE",
      "strike": 27450,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63612",
      "symbol": "NIFTY-Apr2026-27450-PE",
      "strike": 27450,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63613",
      "symbol": "NIFTY-Apr2026-27500-CE",
      "strike": 27500,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63616",
      "symbol": "NIFTY-Apr2026-27500-PE",
      "strike": 27500,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63617",
      "symbol": "NIFTY-Apr2026-27550-CE",
      "strike": 27550,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63618",
      "symbol": "NIFTY-Apr2026-27550-PE",
      "strike": 27550,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63619",
      "symbol": "NIFTY-Apr2026-27600-CE",
      "strike": 27600,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63630",
      "symbol": "NIFTY-Apr2026-27600-PE",
      "strike": 27600,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63631",
      "symbol": "NIFTY-Apr2026-27650-CE",
      "strike": 27650,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63632",
      "symbol": "NIFTY-Apr2026-27650-PE",
      "strike": 27650,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63633",
      "symbol": "NIFTY-Apr2026-27700-CE",
      "strike": 27700,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63634",
      "symbol": "NIFTY-Apr2026-27700-PE",
      "strike": 27700,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63635",
      "symbol": "NIFTY-Apr2026-27750-CE",
      "strike": 27750,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63636",
      "symbol": "NIFTY-Apr2026-27750-PE",
      "strike": 27750,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63637",
      "symbol": "NIFTY-Apr2026-27800-CE",
      "strike": 27800,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63638",
      "symbol": "NIFTY-Apr2026-27800-PE",
      "strike": 27800,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63640",
      "symbol": "NIFTY-Apr2026-27850-CE",
      "strike": 27850,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63641",
      "symbol": "NIFTY-Apr2026-27850-PE",
      "strike": 27850,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63642",
      "symbol": "NIFTY-Apr2026-27900-CE",
      "strike": 27900,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63647",
      "symbol": "NIFTY-Apr2026-27900-PE",
      "strike": 27900,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63650",
      "symbol": "NIFTY-Apr2026-27950-CE",
      "strike": 27950,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63657",
      "symbol": "NIFTY-Apr2026-27950-PE",
      "strike": 27950,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63658",
      "symbol": "NIFTY-Apr2026-28000-CE",
      "strike": 28000,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63659",
      "symbol": "NIFTY-Apr2026-28000-PE",
      "strike": 28000,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63660",
      "symbol": "NIFTY-Apr2026-28050-CE",
      "strike": 28050,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63661",
      "symbol": "NIFTY-Apr2026-28050-PE",
      "strike": 28050,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63662",
      "symbol": "NIFTY-Apr2026-28100-CE",
      "strike": 28100,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63663",
      "symbol": "NIFTY-Apr2026-28100-PE",
      "strike": 28100,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63664",
      "symbol": "NIFTY-Apr2026-28150-CE",
      "strike": 28150,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63665",
      "symbol": "NIFTY-Apr2026-28150-PE",
      "strike": 28150,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63666",
      "symbol": "NIFTY-Apr2026-28200-CE",
      "strike": 28200,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63677",
      "symbol": "NIFTY-Apr2026-28200-PE",
      "strike": 28200,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63678",
      "symbol": "NIFTY-Apr2026-28250-CE",
      "strike": 28250,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63681",
      "symbol": "NIFTY-Apr2026-28250-PE",
      "strike": 28250,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63682",
      "symbol": "NIFTY-Apr2026-28300-CE",
      "strike": 28300,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63683",
      "symbol": "NIFTY-Apr2026-28300-PE",
      "strike": 28300,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63684",
      "symbol": "NIFTY-Apr2026-28350-CE",
      "strike": 28350,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63685",
      "symbol": "NIFTY-Apr2026-28350-PE",
      "strike": 28350,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63686",
      "symbol": "NIFTY-Apr2026-28400-CE",
      "strike": 28400,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63687",
      "symbol": "NIFTY-Apr2026-28400-PE",
      "strike": 28400,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63688",
      "symbol": "NIFTY-Apr2026-28450-CE",
      "strike": 28450,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63692",
      "symbol": "NIFTY-Apr2026-28450-PE",
      "strike": 28450,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63693",
      "symbol": "NIFTY-Apr2026-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63695",
      "symbol": "NIFTY-Apr2026-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63696",
      "symbol": "NIFTY-Apr2026-28550-CE",
      "strike": 28550,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "63697",
      "symbol": "NIFTY-Apr2026-28550-PE",
      "strike": 28550,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "38368",
      "symbol": "NIFTY-Apr2026-28900-CE",
      "strike": 28900,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "38369",
      "symbol": "NIFTY-Apr2026-28900-PE",
      "strike": 28900,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "38371",
      "symbol": "NIFTY-Apr2026-28950-CE",
      "strike": 28950,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "38372",
      "symbol": "NIFTY-Apr2026-28950-PE",
      "strike": 28950,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "38375",
      "symbol": "NIFTY-Apr2026-29000-CE",
      "strike": 29000,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "38376",
      "symbol": "NIFTY-Apr2026-29000-PE",
      "strike": 29000,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "38377",
      "symbol": "NIFTY-Apr2026-29050-CE",
      "strike": 29050,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "38378",
      "symbol": "NIFTY-Apr2026-29050-PE",
      "strike": 29050,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57798",
      "symbol": "NIFTY-Apr2026-17750-CE",
      "strike": 17750,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57799",
      "symbol": "NIFTY-Apr2026-17750-PE",
      "strike": 17750,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57800",
      "symbol": "NIFTY-Apr2026-17800-CE",
      "strike": 17800,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57801",
      "symbol": "NIFTY-Apr2026-17800-PE",
      "strike": 17800,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57802",
      "symbol": "NIFTY-Apr2026-17850-CE",
      "strike": 17850,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57806",
      "symbol": "NIFTY-Apr2026-17850-PE",
      "strike": 17850,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57813",
      "symbol": "NIFTY-Apr2026-17900-CE",
      "strike": 17900,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57814",
      "symbol": "NIFTY-Apr2026-17900-PE",
      "strike": 17900,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57816",
      "symbol": "NIFTY-Apr2026-17950-CE",
      "strike": 17950,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57817",
      "symbol": "NIFTY-Apr2026-17950-PE",
      "strike": 17950,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57818",
      "symbol": "NIFTY-Apr2026-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57826",
      "symbol": "NIFTY-Apr2026-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57827",
      "symbol": "NIFTY-Apr2026-18050-CE",
      "strike": 18050,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57832",
      "symbol": "NIFTY-Apr2026-18050-PE",
      "strike": 18050,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57833",
      "symbol": "NIFTY-Apr2026-18100-CE",
      "strike": 18100,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57837",
      "symbol": "NIFTY-Apr2026-18100-PE",
      "strike": 18100,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57846",
      "symbol": "NIFTY-Apr2026-18150-CE",
      "strike": 18150,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57847",
      "symbol": "NIFTY-Apr2026-18150-PE",
      "strike": 18150,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57856",
      "symbol": "NIFTY-Apr2026-18200-CE",
      "strike": 18200,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57857",
      "symbol": "NIFTY-Apr2026-18200-PE",
      "strike": 18200,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57866",
      "symbol": "NIFTY-Apr2026-18250-CE",
      "strike": 18250,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57867",
      "symbol": "NIFTY-Apr2026-18250-PE",
      "strike": 18250,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57868",
      "symbol": "NIFTY-Apr2026-18300-CE",
      "strike": 18300,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "57869",
      "symbol": "NIFTY-Apr2026-18300-PE",
      "strike": 18300,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65830",
      "symbol": "NIFTY-Apr2026-17250-CE",
      "strike": 17250,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65831",
      "symbol": "NIFTY-Apr2026-17250-PE",
      "strike": 17250,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65832",
      "symbol": "NIFTY-Apr2026-17300-CE",
      "strike": 17300,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65833",
      "symbol": "NIFTY-Apr2026-17300-PE",
      "strike": 17300,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65834",
      "symbol": "NIFTY-Apr2026-17350-CE",
      "strike": 17350,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65835",
      "symbol": "NIFTY-Apr2026-17350-PE",
      "strike": 17350,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65836",
      "symbol": "NIFTY-Apr2026-17400-CE",
      "strike": 17400,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65837",
      "symbol": "NIFTY-Apr2026-17400-PE",
      "strike": 17400,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65838",
      "symbol": "NIFTY-Apr2026-17450-CE",
      "strike": 17450,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65839",
      "symbol": "NIFTY-Apr2026-17450-PE",
      "strike": 17450,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65840",
      "symbol": "NIFTY-Apr2026-17500-CE",
      "strike": 17500,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65841",
      "symbol": "NIFTY-Apr2026-17500-PE",
      "strike": 17500,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65844",
      "symbol": "NIFTY-Apr2026-17550-CE",
      "strike": 17550,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65845",
      "symbol": "NIFTY-Apr2026-17550-PE",
      "strike": 17550,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65846",
      "symbol": "NIFTY-Apr2026-17600-CE",
      "strike": 17600,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65847",
      "symbol": "NIFTY-Apr2026-17600-PE",
      "strike": 17600,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65850",
      "symbol": "NIFTY-Apr2026-17650-CE",
      "strike": 17650,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65851",
      "symbol": "NIFTY-Apr2026-17650-PE",
      "strike": 17650,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65854",
      "symbol": "NIFTY-Apr2026-17700-CE",
      "strike": 17700,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "65855",
      "symbol": "NIFTY-Apr2026-17700-PE",
      "strike": 17700,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "78858",
      "symbol": "NIFTY-Apr2026-17100-CE",
      "strike": 17100,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "78867",
      "symbol": "NIFTY-Apr2026-17100-PE",
      "strike": 17100,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "78868",
      "symbol": "NIFTY-Apr2026-17150-CE",
      "strike": 17150,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "78876",
      "symbol": "NIFTY-Apr2026-17150-PE",
      "strike": 17150,
      "type": "PE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "78880",
      "symbol": "NIFTY-Apr2026-17200-CE",
      "strike": 17200,
      "type": "CE",
      "expiry": "2026-04-21"
    },
    {
      "security_id": "78881",
      "symbol": "NIFTY-Apr2026-17200-PE",
      "strike": 17200,
      "type": "PE",
      "expiry": "2026-04-21"
    }
  ],
  "2026-05-05": [
    {
      "security_id": "74749",
      "symbol": "NIFTY-May2026-27100-PE",
      "strike": 27100,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74753",
      "symbol": "NIFTY-May2026-27150-CE",
      "strike": 27150,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74754",
      "symbol": "NIFTY-May2026-27150-PE",
      "strike": 27150,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74755",
      "symbol": "NIFTY-May2026-27200-CE",
      "strike": 27200,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74763",
      "symbol": "NIFTY-May2026-27200-PE",
      "strike": 27200,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74764",
      "symbol": "NIFTY-May2026-27250-CE",
      "strike": 27250,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74783",
      "symbol": "NIFTY-May2026-27250-PE",
      "strike": 27250,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74784",
      "symbol": "NIFTY-May2026-27300-CE",
      "strike": 27300,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74785",
      "symbol": "NIFTY-May2026-27300-PE",
      "strike": 27300,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74786",
      "symbol": "NIFTY-May2026-27350-CE",
      "strike": 27350,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74787",
      "symbol": "NIFTY-May2026-27350-PE",
      "strike": 27350,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74788",
      "symbol": "NIFTY-May2026-27400-CE",
      "strike": 27400,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74789",
      "symbol": "NIFTY-May2026-27400-PE",
      "strike": 27400,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74795",
      "symbol": "NIFTY-May2026-27450-CE",
      "strike": 27450,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74804",
      "symbol": "NIFTY-May2026-27450-PE",
      "strike": 27450,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74807",
      "symbol": "NIFTY-May2026-27500-CE",
      "strike": 27500,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74808",
      "symbol": "NIFTY-May2026-27500-PE",
      "strike": 27500,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74809",
      "symbol": "NIFTY-May2026-27550-CE",
      "strike": 27550,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74810",
      "symbol": "NIFTY-May2026-27550-PE",
      "strike": 27550,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74811",
      "symbol": "NIFTY-May2026-27600-CE",
      "strike": 27600,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74812",
      "symbol": "NIFTY-May2026-27600-PE",
      "strike": 27600,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74813",
      "symbol": "NIFTY-May2026-27650-CE",
      "strike": 27650,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74814",
      "symbol": "NIFTY-May2026-27650-PE",
      "strike": 27650,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74815",
      "symbol": "NIFTY-May2026-27700-CE",
      "strike": 27700,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74816",
      "symbol": "NIFTY-May2026-27700-PE",
      "strike": 27700,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74817",
      "symbol": "NIFTY-May2026-27750-CE",
      "strike": 27750,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74818",
      "symbol": "NIFTY-May2026-27750-PE",
      "strike": 27750,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74819",
      "symbol": "NIFTY-May2026-27800-CE",
      "strike": 27800,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74820",
      "symbol": "NIFTY-May2026-27800-PE",
      "strike": 27800,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74821",
      "symbol": "NIFTY-May2026-27850-CE",
      "strike": 27850,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74822",
      "symbol": "NIFTY-May2026-27850-PE",
      "strike": 27850,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74823",
      "symbol": "NIFTY-May2026-27900-CE",
      "strike": 27900,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74824",
      "symbol": "NIFTY-May2026-27900-PE",
      "strike": 27900,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74825",
      "symbol": "NIFTY-May2026-27950-CE",
      "strike": 27950,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74826",
      "symbol": "NIFTY-May2026-27950-PE",
      "strike": 27950,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74827",
      "symbol": "NIFTY-May2026-28000-CE",
      "strike": 28000,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74828",
      "symbol": "NIFTY-May2026-28000-PE",
      "strike": 28000,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74829",
      "symbol": "NIFTY-May2026-28050-CE",
      "strike": 28050,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74830",
      "symbol": "NIFTY-May2026-28050-PE",
      "strike": 28050,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74831",
      "symbol": "NIFTY-May2026-28100-CE",
      "strike": 28100,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74832",
      "symbol": "NIFTY-May2026-28100-PE",
      "strike": 28100,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74833",
      "symbol": "NIFTY-May2026-28150-CE",
      "strike": 28150,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74834",
      "symbol": "NIFTY-May2026-28150-PE",
      "strike": 28150,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73093",
      "symbol": "NIFTY-May2026-18350-PE",
      "strike": 18350,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73100",
      "symbol": "NIFTY-May2026-18400-CE",
      "strike": 18400,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73101",
      "symbol": "NIFTY-May2026-18400-PE",
      "strike": 18400,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73102",
      "symbol": "NIFTY-May2026-18450-CE",
      "strike": 18450,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73104",
      "symbol": "NIFTY-May2026-18450-PE",
      "strike": 18450,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73105",
      "symbol": "NIFTY-May2026-18500-CE",
      "strike": 18500,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73106",
      "symbol": "NIFTY-May2026-18500-PE",
      "strike": 18500,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73107",
      "symbol": "NIFTY-May2026-18550-CE",
      "strike": 18550,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73108",
      "symbol": "NIFTY-May2026-18550-PE",
      "strike": 18550,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73109",
      "symbol": "NIFTY-May2026-18600-CE",
      "strike": 18600,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73112",
      "symbol": "NIFTY-May2026-18600-PE",
      "strike": 18600,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73113",
      "symbol": "NIFTY-May2026-18650-CE",
      "strike": 18650,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73136",
      "symbol": "NIFTY-May2026-18650-PE",
      "strike": 18650,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73137",
      "symbol": "NIFTY-May2026-18700-CE",
      "strike": 18700,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73138",
      "symbol": "NIFTY-May2026-18700-PE",
      "strike": 18700,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73139",
      "symbol": "NIFTY-May2026-18750-CE",
      "strike": 18750,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72894",
      "symbol": "NIFTY-May2026-17650-CE",
      "strike": 17650,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73140",
      "symbol": "NIFTY-May2026-18750-PE",
      "strike": 18750,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72895",
      "symbol": "NIFTY-May2026-17650-PE",
      "strike": 17650,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73141",
      "symbol": "NIFTY-May2026-18800-CE",
      "strike": 18800,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72896",
      "symbol": "NIFTY-May2026-17700-CE",
      "strike": 17700,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73142",
      "symbol": "NIFTY-May2026-18800-PE",
      "strike": 18800,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73143",
      "symbol": "NIFTY-May2026-18850-CE",
      "strike": 18850,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73144",
      "symbol": "NIFTY-May2026-18850-PE",
      "strike": 18850,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73145",
      "symbol": "NIFTY-May2026-18900-CE",
      "strike": 18900,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73146",
      "symbol": "NIFTY-May2026-18900-PE",
      "strike": 18900,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72897",
      "symbol": "NIFTY-May2026-17700-PE",
      "strike": 17700,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73147",
      "symbol": "NIFTY-May2026-18950-CE",
      "strike": 18950,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72920",
      "symbol": "NIFTY-May2026-17750-CE",
      "strike": 17750,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73148",
      "symbol": "NIFTY-May2026-18950-PE",
      "strike": 18950,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72921",
      "symbol": "NIFTY-May2026-17750-PE",
      "strike": 17750,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73149",
      "symbol": "NIFTY-May2026-19000-CE",
      "strike": 19000,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72922",
      "symbol": "NIFTY-May2026-17800-CE",
      "strike": 17800,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73150",
      "symbol": "NIFTY-May2026-19000-PE",
      "strike": 19000,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72923",
      "symbol": "NIFTY-May2026-17800-PE",
      "strike": 17800,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73151",
      "symbol": "NIFTY-May2026-19050-CE",
      "strike": 19050,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73152",
      "symbol": "NIFTY-May2026-19050-PE",
      "strike": 19050,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73153",
      "symbol": "NIFTY-May2026-19100-CE",
      "strike": 19100,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72924",
      "symbol": "NIFTY-May2026-17850-CE",
      "strike": 17850,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73154",
      "symbol": "NIFTY-May2026-19100-PE",
      "strike": 19100,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72926",
      "symbol": "NIFTY-May2026-17850-PE",
      "strike": 17850,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73155",
      "symbol": "NIFTY-May2026-19150-CE",
      "strike": 19150,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72927",
      "symbol": "NIFTY-May2026-17900-CE",
      "strike": 17900,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73156",
      "symbol": "NIFTY-May2026-19150-PE",
      "strike": 19150,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72928",
      "symbol": "NIFTY-May2026-17900-PE",
      "strike": 17900,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73157",
      "symbol": "NIFTY-May2026-19200-CE",
      "strike": 19200,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "72929",
      "symbol": "NIFTY-May2026-17950-CE",
      "strike": 17950,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73158",
      "symbol": "NIFTY-May2026-19200-PE",
      "strike": 19200,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73159",
      "symbol": "NIFTY-May2026-19250-CE",
      "strike": 19250,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73160",
      "symbol": "NIFTY-May2026-19250-PE",
      "strike": 19250,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73161",
      "symbol": "NIFTY-May2026-19300-CE",
      "strike": 19300,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73162",
      "symbol": "NIFTY-May2026-19300-PE",
      "strike": 19300,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73163",
      "symbol": "NIFTY-May2026-19350-CE",
      "strike": 19350,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73164",
      "symbol": "NIFTY-May2026-19350-PE",
      "strike": 19350,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73165",
      "symbol": "NIFTY-May2026-19400-CE",
      "strike": 19400,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73166",
      "symbol": "NIFTY-May2026-19400-PE",
      "strike": 19400,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73167",
      "symbol": "NIFTY-May2026-19450-CE",
      "strike": 19450,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73168",
      "symbol": "NIFTY-May2026-19450-PE",
      "strike": 19450,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73169",
      "symbol": "NIFTY-May2026-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73170",
      "symbol": "NIFTY-May2026-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73171",
      "symbol": "NIFTY-May2026-19550-CE",
      "strike": 19550,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73172",
      "symbol": "NIFTY-May2026-19550-PE",
      "strike": 19550,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73173",
      "symbol": "NIFTY-May2026-19600-CE",
      "strike": 19600,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73174",
      "symbol": "NIFTY-May2026-19600-PE",
      "strike": 19600,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73175",
      "symbol": "NIFTY-May2026-19650-CE",
      "strike": 19650,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73180",
      "symbol": "NIFTY-May2026-19650-PE",
      "strike": 19650,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73181",
      "symbol": "NIFTY-May2026-19700-CE",
      "strike": 19700,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73182",
      "symbol": "NIFTY-May2026-19700-PE",
      "strike": 19700,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73183",
      "symbol": "NIFTY-May2026-19750-CE",
      "strike": 19750,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73184",
      "symbol": "NIFTY-May2026-19750-PE",
      "strike": 19750,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73185",
      "symbol": "NIFTY-May2026-19800-CE",
      "strike": 19800,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73188",
      "symbol": "NIFTY-May2026-19800-PE",
      "strike": 19800,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73189",
      "symbol": "NIFTY-May2026-19850-CE",
      "strike": 19850,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73063",
      "symbol": "NIFTY-May2026-17950-PE",
      "strike": 17950,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73064",
      "symbol": "NIFTY-May2026-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73065",
      "symbol": "NIFTY-May2026-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73066",
      "symbol": "NIFTY-May2026-18050-CE",
      "strike": 18050,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73067",
      "symbol": "NIFTY-May2026-18050-PE",
      "strike": 18050,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73068",
      "symbol": "NIFTY-May2026-18100-CE",
      "strike": 18100,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73069",
      "symbol": "NIFTY-May2026-18100-PE",
      "strike": 18100,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73665",
      "symbol": "NIFTY-May2026-21400-PE",
      "strike": 21400,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73070",
      "symbol": "NIFTY-May2026-18150-CE",
      "strike": 18150,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73666",
      "symbol": "NIFTY-May2026-21450-CE",
      "strike": 21450,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73071",
      "symbol": "NIFTY-May2026-18150-PE",
      "strike": 18150,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73667",
      "symbol": "NIFTY-May2026-21450-PE",
      "strike": 21450,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73072",
      "symbol": "NIFTY-May2026-18200-CE",
      "strike": 18200,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73668",
      "symbol": "NIFTY-May2026-21500-CE",
      "strike": 21500,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73073",
      "symbol": "NIFTY-May2026-18200-PE",
      "strike": 18200,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73074",
      "symbol": "NIFTY-May2026-18250-CE",
      "strike": 18250,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73673",
      "symbol": "NIFTY-May2026-21500-PE",
      "strike": 21500,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73078",
      "symbol": "NIFTY-May2026-18250-PE",
      "strike": 18250,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73079",
      "symbol": "NIFTY-May2026-18300-CE",
      "strike": 18300,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73080",
      "symbol": "NIFTY-May2026-18300-PE",
      "strike": 18300,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73081",
      "symbol": "NIFTY-May2026-18350-CE",
      "strike": 18350,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73680",
      "symbol": "NIFTY-May2026-21550-CE",
      "strike": 21550,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73681",
      "symbol": "NIFTY-May2026-21550-PE",
      "strike": 21550,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73682",
      "symbol": "NIFTY-May2026-21600-CE",
      "strike": 21600,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73683",
      "symbol": "NIFTY-May2026-21600-PE",
      "strike": 21600,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73684",
      "symbol": "NIFTY-May2026-21650-CE",
      "strike": 21650,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73685",
      "symbol": "NIFTY-May2026-21650-PE",
      "strike": 21650,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73688",
      "symbol": "NIFTY-May2026-21700-CE",
      "strike": 21700,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73689",
      "symbol": "NIFTY-May2026-21700-PE",
      "strike": 21700,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73690",
      "symbol": "NIFTY-May2026-21750-CE",
      "strike": 21750,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73691",
      "symbol": "NIFTY-May2026-21750-PE",
      "strike": 21750,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73694",
      "symbol": "NIFTY-May2026-21800-CE",
      "strike": 21800,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73718",
      "symbol": "NIFTY-May2026-21800-PE",
      "strike": 21800,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73720",
      "symbol": "NIFTY-May2026-21850-CE",
      "strike": 21850,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73721",
      "symbol": "NIFTY-May2026-21850-PE",
      "strike": 21850,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73722",
      "symbol": "NIFTY-May2026-21900-CE",
      "strike": 21900,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73726",
      "symbol": "NIFTY-May2026-21900-PE",
      "strike": 21900,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73729",
      "symbol": "NIFTY-May2026-21950-CE",
      "strike": 21950,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73730",
      "symbol": "NIFTY-May2026-21950-PE",
      "strike": 21950,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74165",
      "symbol": "NIFTY-May2026-24150-CE",
      "strike": 24150,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74166",
      "symbol": "NIFTY-May2026-24150-PE",
      "strike": 24150,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73732",
      "symbol": "NIFTY-May2026-22000-CE",
      "strike": 22000,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74167",
      "symbol": "NIFTY-May2026-24200-CE",
      "strike": 24200,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73733",
      "symbol": "NIFTY-May2026-22000-PE",
      "strike": 22000,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74168",
      "symbol": "NIFTY-May2026-24200-PE",
      "strike": 24200,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73734",
      "symbol": "NIFTY-May2026-22050-CE",
      "strike": 22050,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74169",
      "symbol": "NIFTY-May2026-24250-CE",
      "strike": 24250,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74170",
      "symbol": "NIFTY-May2026-24250-PE",
      "strike": 24250,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74171",
      "symbol": "NIFTY-May2026-24300-CE",
      "strike": 24300,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73735",
      "symbol": "NIFTY-May2026-22050-PE",
      "strike": 22050,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74172",
      "symbol": "NIFTY-May2026-24300-PE",
      "strike": 24300,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73736",
      "symbol": "NIFTY-May2026-22100-CE",
      "strike": 22100,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74173",
      "symbol": "NIFTY-May2026-24350-CE",
      "strike": 24350,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73737",
      "symbol": "NIFTY-May2026-22100-PE",
      "strike": 22100,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74174",
      "symbol": "NIFTY-May2026-24350-PE",
      "strike": 24350,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73738",
      "symbol": "NIFTY-May2026-22150-CE",
      "strike": 22150,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74175",
      "symbol": "NIFTY-May2026-24400-CE",
      "strike": 24400,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74178",
      "symbol": "NIFTY-May2026-24400-PE",
      "strike": 24400,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74179",
      "symbol": "NIFTY-May2026-24450-CE",
      "strike": 24450,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74180",
      "symbol": "NIFTY-May2026-24450-PE",
      "strike": 24450,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74181",
      "symbol": "NIFTY-May2026-24500-CE",
      "strike": 24500,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73745",
      "symbol": "NIFTY-May2026-22150-PE",
      "strike": 22150,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73746",
      "symbol": "NIFTY-May2026-22200-CE",
      "strike": 22200,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74184",
      "symbol": "NIFTY-May2026-24500-PE",
      "strike": 24500,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73747",
      "symbol": "NIFTY-May2026-22200-PE",
      "strike": 22200,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74185",
      "symbol": "NIFTY-May2026-24550-CE",
      "strike": 24550,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73748",
      "symbol": "NIFTY-May2026-22250-CE",
      "strike": 22250,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73749",
      "symbol": "NIFTY-May2026-22250-PE",
      "strike": 22250,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73750",
      "symbol": "NIFTY-May2026-22300-CE",
      "strike": 22300,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73751",
      "symbol": "NIFTY-May2026-22300-PE",
      "strike": 22300,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73752",
      "symbol": "NIFTY-May2026-22350-CE",
      "strike": 22350,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73753",
      "symbol": "NIFTY-May2026-22350-PE",
      "strike": 22350,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73754",
      "symbol": "NIFTY-May2026-22400-CE",
      "strike": 22400,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74198",
      "symbol": "NIFTY-May2026-24550-PE",
      "strike": 24550,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74199",
      "symbol": "NIFTY-May2026-24600-CE",
      "strike": 24600,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74200",
      "symbol": "NIFTY-May2026-24600-PE",
      "strike": 24600,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74209",
      "symbol": "NIFTY-May2026-24650-CE",
      "strike": 24650,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74212",
      "symbol": "NIFTY-May2026-24650-PE",
      "strike": 24650,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74216",
      "symbol": "NIFTY-May2026-24700-CE",
      "strike": 24700,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74217",
      "symbol": "NIFTY-May2026-24700-PE",
      "strike": 24700,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74218",
      "symbol": "NIFTY-May2026-24750-CE",
      "strike": 24750,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74219",
      "symbol": "NIFTY-May2026-24750-PE",
      "strike": 24750,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74220",
      "symbol": "NIFTY-May2026-24800-CE",
      "strike": 24800,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74221",
      "symbol": "NIFTY-May2026-24800-PE",
      "strike": 24800,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74225",
      "symbol": "NIFTY-May2026-24850-CE",
      "strike": 24850,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74226",
      "symbol": "NIFTY-May2026-24850-PE",
      "strike": 24850,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74228",
      "symbol": "NIFTY-May2026-24900-CE",
      "strike": 24900,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74229",
      "symbol": "NIFTY-May2026-24900-PE",
      "strike": 24900,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74230",
      "symbol": "NIFTY-May2026-24950-CE",
      "strike": 24950,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74231",
      "symbol": "NIFTY-May2026-24950-PE",
      "strike": 24950,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74232",
      "symbol": "NIFTY-May2026-25000-CE",
      "strike": 25000,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74233",
      "symbol": "NIFTY-May2026-25000-PE",
      "strike": 25000,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74235",
      "symbol": "NIFTY-May2026-25050-CE",
      "strike": 25050,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74236",
      "symbol": "NIFTY-May2026-25050-PE",
      "strike": 25050,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74237",
      "symbol": "NIFTY-May2026-25100-CE",
      "strike": 25100,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74238",
      "symbol": "NIFTY-May2026-25100-PE",
      "strike": 25100,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74239",
      "symbol": "NIFTY-May2026-25150-CE",
      "strike": 25150,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74240",
      "symbol": "NIFTY-May2026-25150-PE",
      "strike": 25150,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74241",
      "symbol": "NIFTY-May2026-25200-CE",
      "strike": 25200,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74243",
      "symbol": "NIFTY-May2026-25200-PE",
      "strike": 25200,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74244",
      "symbol": "NIFTY-May2026-25250-CE",
      "strike": 25250,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74245",
      "symbol": "NIFTY-May2026-25250-PE",
      "strike": 25250,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73517",
      "symbol": "NIFTY-May2026-19850-PE",
      "strike": 19850,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74247",
      "symbol": "NIFTY-May2026-25300-CE",
      "strike": 25300,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73518",
      "symbol": "NIFTY-May2026-19900-CE",
      "strike": 19900,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74249",
      "symbol": "NIFTY-May2026-25300-PE",
      "strike": 25300,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73519",
      "symbol": "NIFTY-May2026-19900-PE",
      "strike": 19900,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74250",
      "symbol": "NIFTY-May2026-25350-CE",
      "strike": 25350,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73520",
      "symbol": "NIFTY-May2026-19950-CE",
      "strike": 19950,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74251",
      "symbol": "NIFTY-May2026-25350-PE",
      "strike": 25350,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73521",
      "symbol": "NIFTY-May2026-19950-PE",
      "strike": 19950,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74252",
      "symbol": "NIFTY-May2026-25400-CE",
      "strike": 25400,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73522",
      "symbol": "NIFTY-May2026-20000-CE",
      "strike": 20000,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73523",
      "symbol": "NIFTY-May2026-20000-PE",
      "strike": 20000,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74253",
      "symbol": "NIFTY-May2026-25400-PE",
      "strike": 25400,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73524",
      "symbol": "NIFTY-May2026-20050-CE",
      "strike": 20050,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74254",
      "symbol": "NIFTY-May2026-25450-CE",
      "strike": 25450,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74255",
      "symbol": "NIFTY-May2026-25450-PE",
      "strike": 25450,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74256",
      "symbol": "NIFTY-May2026-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74257",
      "symbol": "NIFTY-May2026-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74258",
      "symbol": "NIFTY-May2026-25550-CE",
      "strike": 25550,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73529",
      "symbol": "NIFTY-May2026-20050-PE",
      "strike": 20050,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74259",
      "symbol": "NIFTY-May2026-25550-PE",
      "strike": 25550,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73530",
      "symbol": "NIFTY-May2026-20100-CE",
      "strike": 20100,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74260",
      "symbol": "NIFTY-May2026-25600-CE",
      "strike": 25600,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73531",
      "symbol": "NIFTY-May2026-20100-PE",
      "strike": 20100,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74261",
      "symbol": "NIFTY-May2026-25600-PE",
      "strike": 25600,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73532",
      "symbol": "NIFTY-May2026-20150-CE",
      "strike": 20150,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74262",
      "symbol": "NIFTY-May2026-25650-CE",
      "strike": 25650,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73533",
      "symbol": "NIFTY-May2026-20150-PE",
      "strike": 20150,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73534",
      "symbol": "NIFTY-May2026-20200-CE",
      "strike": 20200,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73535",
      "symbol": "NIFTY-May2026-20200-PE",
      "strike": 20200,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74265",
      "symbol": "NIFTY-May2026-25650-PE",
      "strike": 25650,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73536",
      "symbol": "NIFTY-May2026-20250-CE",
      "strike": 20250,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73537",
      "symbol": "NIFTY-May2026-20250-PE",
      "strike": 20250,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73538",
      "symbol": "NIFTY-May2026-20300-CE",
      "strike": 20300,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74269",
      "symbol": "NIFTY-May2026-25700-CE",
      "strike": 25700,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74270",
      "symbol": "NIFTY-May2026-25700-PE",
      "strike": 25700,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73541",
      "symbol": "NIFTY-May2026-20300-PE",
      "strike": 20300,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74272",
      "symbol": "NIFTY-May2026-25750-CE",
      "strike": 25750,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73542",
      "symbol": "NIFTY-May2026-20350-CE",
      "strike": 20350,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74279",
      "symbol": "NIFTY-May2026-25750-PE",
      "strike": 25750,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74280",
      "symbol": "NIFTY-May2026-25800-CE",
      "strike": 25800,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74288",
      "symbol": "NIFTY-May2026-25800-PE",
      "strike": 25800,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74289",
      "symbol": "NIFTY-May2026-25850-CE",
      "strike": 25850,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73569",
      "symbol": "NIFTY-May2026-20350-PE",
      "strike": 20350,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73570",
      "symbol": "NIFTY-May2026-20400-CE",
      "strike": 20400,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73582",
      "symbol": "NIFTY-May2026-20400-PE",
      "strike": 20400,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73583",
      "symbol": "NIFTY-May2026-20450-CE",
      "strike": 20450,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73584",
      "symbol": "NIFTY-May2026-20450-PE",
      "strike": 20450,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73591",
      "symbol": "NIFTY-May2026-20500-CE",
      "strike": 20500,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73592",
      "symbol": "NIFTY-May2026-20500-PE",
      "strike": 20500,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73593",
      "symbol": "NIFTY-May2026-20550-CE",
      "strike": 20550,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73594",
      "symbol": "NIFTY-May2026-20550-PE",
      "strike": 20550,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73595",
      "symbol": "NIFTY-May2026-20600-CE",
      "strike": 20600,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73596",
      "symbol": "NIFTY-May2026-20600-PE",
      "strike": 20600,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73597",
      "symbol": "NIFTY-May2026-20650-CE",
      "strike": 20650,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73598",
      "symbol": "NIFTY-May2026-20650-PE",
      "strike": 20650,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73599",
      "symbol": "NIFTY-May2026-20700-CE",
      "strike": 20700,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73600",
      "symbol": "NIFTY-May2026-20700-PE",
      "strike": 20700,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73601",
      "symbol": "NIFTY-May2026-20750-CE",
      "strike": 20750,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73602",
      "symbol": "NIFTY-May2026-20750-PE",
      "strike": 20750,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73603",
      "symbol": "NIFTY-May2026-20800-CE",
      "strike": 20800,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73604",
      "symbol": "NIFTY-May2026-20800-PE",
      "strike": 20800,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73605",
      "symbol": "NIFTY-May2026-20850-CE",
      "strike": 20850,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73606",
      "symbol": "NIFTY-May2026-20850-PE",
      "strike": 20850,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73607",
      "symbol": "NIFTY-May2026-20900-CE",
      "strike": 20900,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73614",
      "symbol": "NIFTY-May2026-20900-PE",
      "strike": 20900,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73916",
      "symbol": "NIFTY-May2026-22400-PE",
      "strike": 22400,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73615",
      "symbol": "NIFTY-May2026-20950-CE",
      "strike": 20950,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73917",
      "symbol": "NIFTY-May2026-22450-CE",
      "strike": 22450,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73616",
      "symbol": "NIFTY-May2026-20950-PE",
      "strike": 20950,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73617",
      "symbol": "NIFTY-May2026-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73618",
      "symbol": "NIFTY-May2026-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73619",
      "symbol": "NIFTY-May2026-21050-CE",
      "strike": 21050,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73918",
      "symbol": "NIFTY-May2026-22450-PE",
      "strike": 22450,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73919",
      "symbol": "NIFTY-May2026-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73639",
      "symbol": "NIFTY-May2026-21050-PE",
      "strike": 21050,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73640",
      "symbol": "NIFTY-May2026-21100-CE",
      "strike": 21100,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73641",
      "symbol": "NIFTY-May2026-21100-PE",
      "strike": 21100,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74369",
      "symbol": "NIFTY-May2026-25850-PE",
      "strike": 25850,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73642",
      "symbol": "NIFTY-May2026-21150-CE",
      "strike": 21150,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74370",
      "symbol": "NIFTY-May2026-25900-CE",
      "strike": 25900,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73643",
      "symbol": "NIFTY-May2026-21150-PE",
      "strike": 21150,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73644",
      "symbol": "NIFTY-May2026-21200-CE",
      "strike": 21200,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73645",
      "symbol": "NIFTY-May2026-21200-PE",
      "strike": 21200,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73646",
      "symbol": "NIFTY-May2026-21250-CE",
      "strike": 21250,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74375",
      "symbol": "NIFTY-May2026-25900-PE",
      "strike": 25900,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74376",
      "symbol": "NIFTY-May2026-25950-CE",
      "strike": 25950,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73648",
      "symbol": "NIFTY-May2026-21250-PE",
      "strike": 21250,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74377",
      "symbol": "NIFTY-May2026-25950-PE",
      "strike": 25950,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73649",
      "symbol": "NIFTY-May2026-21300-CE",
      "strike": 21300,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74378",
      "symbol": "NIFTY-May2026-26000-CE",
      "strike": 26000,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74379",
      "symbol": "NIFTY-May2026-26000-PE",
      "strike": 26000,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74380",
      "symbol": "NIFTY-May2026-26050-CE",
      "strike": 26050,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73656",
      "symbol": "NIFTY-May2026-21300-PE",
      "strike": 21300,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73960",
      "symbol": "NIFTY-May2026-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73961",
      "symbol": "NIFTY-May2026-22550-CE",
      "strike": 22550,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74389",
      "symbol": "NIFTY-May2026-26050-PE",
      "strike": 26050,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73662",
      "symbol": "NIFTY-May2026-21350-CE",
      "strike": 21350,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73663",
      "symbol": "NIFTY-May2026-21350-PE",
      "strike": 21350,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73664",
      "symbol": "NIFTY-May2026-21400-CE",
      "strike": 21400,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73965",
      "symbol": "NIFTY-May2026-22550-PE",
      "strike": 22550,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74392",
      "symbol": "NIFTY-May2026-26100-CE",
      "strike": 26100,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73970",
      "symbol": "NIFTY-May2026-22600-CE",
      "strike": 22600,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74393",
      "symbol": "NIFTY-May2026-26100-PE",
      "strike": 26100,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73971",
      "symbol": "NIFTY-May2026-22600-PE",
      "strike": 22600,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74398",
      "symbol": "NIFTY-May2026-26150-CE",
      "strike": 26150,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74399",
      "symbol": "NIFTY-May2026-26150-PE",
      "strike": 26150,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74400",
      "symbol": "NIFTY-May2026-26200-CE",
      "strike": 26200,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74401",
      "symbol": "NIFTY-May2026-26200-PE",
      "strike": 26200,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74402",
      "symbol": "NIFTY-May2026-26250-CE",
      "strike": 26250,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74403",
      "symbol": "NIFTY-May2026-26250-PE",
      "strike": 26250,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74404",
      "symbol": "NIFTY-May2026-26300-CE",
      "strike": 26300,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73983",
      "symbol": "NIFTY-May2026-22650-CE",
      "strike": 22650,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74405",
      "symbol": "NIFTY-May2026-26300-PE",
      "strike": 26300,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74408",
      "symbol": "NIFTY-May2026-26350-CE",
      "strike": 26350,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74409",
      "symbol": "NIFTY-May2026-26350-PE",
      "strike": 26350,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73988",
      "symbol": "NIFTY-May2026-22650-PE",
      "strike": 22650,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74410",
      "symbol": "NIFTY-May2026-26400-CE",
      "strike": 26400,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73989",
      "symbol": "NIFTY-May2026-22700-CE",
      "strike": 22700,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74411",
      "symbol": "NIFTY-May2026-26400-PE",
      "strike": 26400,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74412",
      "symbol": "NIFTY-May2026-26450-CE",
      "strike": 26450,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74413",
      "symbol": "NIFTY-May2026-26450-PE",
      "strike": 26450,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73992",
      "symbol": "NIFTY-May2026-22700-PE",
      "strike": 22700,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "73993",
      "symbol": "NIFTY-May2026-22750-CE",
      "strike": 22750,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74000",
      "symbol": "NIFTY-May2026-22750-PE",
      "strike": 22750,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74001",
      "symbol": "NIFTY-May2026-22800-CE",
      "strike": 22800,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74466",
      "symbol": "NIFTY-May2026-26500-CE",
      "strike": 26500,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74467",
      "symbol": "NIFTY-May2026-26500-PE",
      "strike": 26500,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74020",
      "symbol": "NIFTY-May2026-22800-PE",
      "strike": 22800,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74021",
      "symbol": "NIFTY-May2026-22850-CE",
      "strike": 22850,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74071",
      "symbol": "NIFTY-May2026-22850-PE",
      "strike": 22850,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74072",
      "symbol": "NIFTY-May2026-22900-CE",
      "strike": 22900,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74073",
      "symbol": "NIFTY-May2026-22900-PE",
      "strike": 22900,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74074",
      "symbol": "NIFTY-May2026-22950-CE",
      "strike": 22950,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74076",
      "symbol": "NIFTY-May2026-22950-PE",
      "strike": 22950,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74077",
      "symbol": "NIFTY-May2026-23000-CE",
      "strike": 23000,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74079",
      "symbol": "NIFTY-May2026-23000-PE",
      "strike": 23000,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74080",
      "symbol": "NIFTY-May2026-23050-CE",
      "strike": 23050,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74082",
      "symbol": "NIFTY-May2026-23050-PE",
      "strike": 23050,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74087",
      "symbol": "NIFTY-May2026-23100-CE",
      "strike": 23100,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74088",
      "symbol": "NIFTY-May2026-23100-PE",
      "strike": 23100,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74089",
      "symbol": "NIFTY-May2026-23150-CE",
      "strike": 23150,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74090",
      "symbol": "NIFTY-May2026-23150-PE",
      "strike": 23150,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74091",
      "symbol": "NIFTY-May2026-23200-CE",
      "strike": 23200,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74092",
      "symbol": "NIFTY-May2026-23200-PE",
      "strike": 23200,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74093",
      "symbol": "NIFTY-May2026-23250-CE",
      "strike": 23250,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74094",
      "symbol": "NIFTY-May2026-23250-PE",
      "strike": 23250,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74095",
      "symbol": "NIFTY-May2026-23300-CE",
      "strike": 23300,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74096",
      "symbol": "NIFTY-May2026-23300-PE",
      "strike": 23300,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74097",
      "symbol": "NIFTY-May2026-23350-CE",
      "strike": 23350,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74098",
      "symbol": "NIFTY-May2026-23350-PE",
      "strike": 23350,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74099",
      "symbol": "NIFTY-May2026-23400-CE",
      "strike": 23400,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74100",
      "symbol": "NIFTY-May2026-23400-PE",
      "strike": 23400,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74101",
      "symbol": "NIFTY-May2026-23450-CE",
      "strike": 23450,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74102",
      "symbol": "NIFTY-May2026-23450-PE",
      "strike": 23450,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74103",
      "symbol": "NIFTY-May2026-23500-CE",
      "strike": 23500,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74104",
      "symbol": "NIFTY-May2026-23500-PE",
      "strike": 23500,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74105",
      "symbol": "NIFTY-May2026-23550-CE",
      "strike": 23550,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74106",
      "symbol": "NIFTY-May2026-23550-PE",
      "strike": 23550,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74107",
      "symbol": "NIFTY-May2026-23600-CE",
      "strike": 23600,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74108",
      "symbol": "NIFTY-May2026-23600-PE",
      "strike": 23600,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74109",
      "symbol": "NIFTY-May2026-23650-CE",
      "strike": 23650,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74110",
      "symbol": "NIFTY-May2026-23650-PE",
      "strike": 23650,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74111",
      "symbol": "NIFTY-May2026-23700-CE",
      "strike": 23700,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74122",
      "symbol": "NIFTY-May2026-23700-PE",
      "strike": 23700,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74123",
      "symbol": "NIFTY-May2026-23750-CE",
      "strike": 23750,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74128",
      "symbol": "NIFTY-May2026-23750-PE",
      "strike": 23750,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74129",
      "symbol": "NIFTY-May2026-23800-CE",
      "strike": 23800,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74130",
      "symbol": "NIFTY-May2026-23800-PE",
      "strike": 23800,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74131",
      "symbol": "NIFTY-May2026-23850-CE",
      "strike": 23850,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74132",
      "symbol": "NIFTY-May2026-23850-PE",
      "strike": 23850,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74586",
      "symbol": "NIFTY-May2026-26550-CE",
      "strike": 26550,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74133",
      "symbol": "NIFTY-May2026-23900-CE",
      "strike": 23900,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74587",
      "symbol": "NIFTY-May2026-26550-PE",
      "strike": 26550,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74134",
      "symbol": "NIFTY-May2026-23900-PE",
      "strike": 23900,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74588",
      "symbol": "NIFTY-May2026-26600-CE",
      "strike": 26600,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74135",
      "symbol": "NIFTY-May2026-23950-CE",
      "strike": 23950,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74591",
      "symbol": "NIFTY-May2026-26600-PE",
      "strike": 26600,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74594",
      "symbol": "NIFTY-May2026-26650-CE",
      "strike": 26650,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74598",
      "symbol": "NIFTY-May2026-26650-PE",
      "strike": 26650,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74602",
      "symbol": "NIFTY-May2026-26700-CE",
      "strike": 26700,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74146",
      "symbol": "NIFTY-May2026-23950-PE",
      "strike": 23950,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74147",
      "symbol": "NIFTY-May2026-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74604",
      "symbol": "NIFTY-May2026-26700-PE",
      "strike": 26700,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74605",
      "symbol": "NIFTY-May2026-26750-CE",
      "strike": 26750,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74608",
      "symbol": "NIFTY-May2026-26750-PE",
      "strike": 26750,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74154",
      "symbol": "NIFTY-May2026-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74155",
      "symbol": "NIFTY-May2026-24050-CE",
      "strike": 24050,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74156",
      "symbol": "NIFTY-May2026-24050-PE",
      "strike": 24050,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74157",
      "symbol": "NIFTY-May2026-24100-CE",
      "strike": 24100,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74610",
      "symbol": "NIFTY-May2026-26800-CE",
      "strike": 26800,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74612",
      "symbol": "NIFTY-May2026-26800-PE",
      "strike": 26800,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74614",
      "symbol": "NIFTY-May2026-26850-CE",
      "strike": 26850,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74164",
      "symbol": "NIFTY-May2026-24100-PE",
      "strike": 24100,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74616",
      "symbol": "NIFTY-May2026-26850-PE",
      "strike": 26850,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74617",
      "symbol": "NIFTY-May2026-26900-CE",
      "strike": 26900,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74741",
      "symbol": "NIFTY-May2026-26900-PE",
      "strike": 26900,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74742",
      "symbol": "NIFTY-May2026-26950-CE",
      "strike": 26950,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74743",
      "symbol": "NIFTY-May2026-26950-PE",
      "strike": 26950,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74744",
      "symbol": "NIFTY-May2026-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74745",
      "symbol": "NIFTY-May2026-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74746",
      "symbol": "NIFTY-May2026-27050-CE",
      "strike": 27050,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74747",
      "symbol": "NIFTY-May2026-27050-PE",
      "strike": 27050,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "74748",
      "symbol": "NIFTY-May2026-27100-CE",
      "strike": 27100,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "38379",
      "symbol": "NIFTY-May2026-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "38381",
      "symbol": "NIFTY-May2026-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "38382",
      "symbol": "NIFTY-May2026-28550-CE",
      "strike": 28550,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "38383",
      "symbol": "NIFTY-May2026-28550-PE",
      "strike": 28550,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "36248",
      "symbol": "NIFTY-May2026-28200-CE",
      "strike": 28200,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "36249",
      "symbol": "NIFTY-May2026-28200-PE",
      "strike": 28200,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "36260",
      "symbol": "NIFTY-May2026-28250-CE",
      "strike": 28250,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "36263",
      "symbol": "NIFTY-May2026-28250-PE",
      "strike": 28250,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "37185",
      "symbol": "NIFTY-May2026-28300-CE",
      "strike": 28300,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "37186",
      "symbol": "NIFTY-May2026-28300-PE",
      "strike": 28300,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "37187",
      "symbol": "NIFTY-May2026-28350-CE",
      "strike": 28350,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "37192",
      "symbol": "NIFTY-May2026-28350-PE",
      "strike": 28350,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "37193",
      "symbol": "NIFTY-May2026-28400-CE",
      "strike": 28400,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "37194",
      "symbol": "NIFTY-May2026-28400-PE",
      "strike": 28400,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "37195",
      "symbol": "NIFTY-May2026-28450-CE",
      "strike": 28450,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "37196",
      "symbol": "NIFTY-May2026-28450-PE",
      "strike": 28450,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "43747",
      "symbol": "NIFTY-May2026-17550-CE",
      "strike": 17550,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "43748",
      "symbol": "NIFTY-May2026-17550-PE",
      "strike": 17550,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "43749",
      "symbol": "NIFTY-May2026-17600-CE",
      "strike": 17600,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "43750",
      "symbol": "NIFTY-May2026-17600-PE",
      "strike": 17600,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78905",
      "symbol": "NIFTY-May2026-17100-CE",
      "strike": 17100,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78910",
      "symbol": "NIFTY-May2026-17100-PE",
      "strike": 17100,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78911",
      "symbol": "NIFTY-May2026-17150-CE",
      "strike": 17150,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78912",
      "symbol": "NIFTY-May2026-17150-PE",
      "strike": 17150,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78913",
      "symbol": "NIFTY-May2026-17200-CE",
      "strike": 17200,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78914",
      "symbol": "NIFTY-May2026-17200-PE",
      "strike": 17200,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78922",
      "symbol": "NIFTY-May2026-17250-CE",
      "strike": 17250,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78923",
      "symbol": "NIFTY-May2026-17250-PE",
      "strike": 17250,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78924",
      "symbol": "NIFTY-May2026-17300-CE",
      "strike": 17300,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78925",
      "symbol": "NIFTY-May2026-17300-PE",
      "strike": 17300,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78937",
      "symbol": "NIFTY-May2026-17350-CE",
      "strike": 17350,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78938",
      "symbol": "NIFTY-May2026-17350-PE",
      "strike": 17350,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78980",
      "symbol": "NIFTY-May2026-17400-CE",
      "strike": 17400,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78981",
      "symbol": "NIFTY-May2026-17400-PE",
      "strike": 17400,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78982",
      "symbol": "NIFTY-May2026-17450-CE",
      "strike": 17450,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78983",
      "symbol": "NIFTY-May2026-17450-PE",
      "strike": 17450,
      "type": "PE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78984",
      "symbol": "NIFTY-May2026-17500-CE",
      "strike": 17500,
      "type": "CE",
      "expiry": "2026-05-05"
    },
    {
      "security_id": "78985",
      "symbol": "NIFTY-May2026-17500-PE",
      "strike": 17500,
      "type": "PE",
      "expiry": "2026-05-05"
    }
  ],
  "2027-03-30": [
    {
      "security_id": "80167",
      "symbol": "NIFTY-Mar2027-1500-CE",
      "strike": 1500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80171",
      "symbol": "NIFTY-Mar2027-1500-PE",
      "strike": 1500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80172",
      "symbol": "NIFTY-Mar2027-3000-CE",
      "strike": 3000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80173",
      "symbol": "NIFTY-Mar2027-3000-PE",
      "strike": 3000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80174",
      "symbol": "NIFTY-Mar2027-4500-CE",
      "strike": 4500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80175",
      "symbol": "NIFTY-Mar2027-4500-PE",
      "strike": 4500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80176",
      "symbol": "NIFTY-Mar2027-6000-CE",
      "strike": 6000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80177",
      "symbol": "NIFTY-Mar2027-6000-PE",
      "strike": 6000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80178",
      "symbol": "NIFTY-Mar2027-7500-CE",
      "strike": 7500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80179",
      "symbol": "NIFTY-Mar2027-7500-PE",
      "strike": 7500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80180",
      "symbol": "NIFTY-Mar2027-9000-CE",
      "strike": 9000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80181",
      "symbol": "NIFTY-Mar2027-9000-PE",
      "strike": 9000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80182",
      "symbol": "NIFTY-Mar2027-10500-CE",
      "strike": 10500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80183",
      "symbol": "NIFTY-Mar2027-10500-PE",
      "strike": 10500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80184",
      "symbol": "NIFTY-Mar2027-12000-CE",
      "strike": 12000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80185",
      "symbol": "NIFTY-Mar2027-12000-PE",
      "strike": 12000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80186",
      "symbol": "NIFTY-Mar2027-13500-CE",
      "strike": 13500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80187",
      "symbol": "NIFTY-Mar2027-13500-PE",
      "strike": 13500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80188",
      "symbol": "NIFTY-Mar2027-15000-CE",
      "strike": 15000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80189",
      "symbol": "NIFTY-Mar2027-15000-PE",
      "strike": 15000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80190",
      "symbol": "NIFTY-Mar2027-16500-CE",
      "strike": 16500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80191",
      "symbol": "NIFTY-Mar2027-16500-PE",
      "strike": 16500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80192",
      "symbol": "NIFTY-Mar2027-18000-CE",
      "strike": 18000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80248",
      "symbol": "NIFTY-Mar2027-18000-PE",
      "strike": 18000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80249",
      "symbol": "NIFTY-Mar2027-19500-CE",
      "strike": 19500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80267",
      "symbol": "NIFTY-Mar2027-19500-PE",
      "strike": 19500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80268",
      "symbol": "NIFTY-Mar2027-21000-CE",
      "strike": 21000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80269",
      "symbol": "NIFTY-Mar2027-21000-PE",
      "strike": 21000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80270",
      "symbol": "NIFTY-Mar2027-22500-CE",
      "strike": 22500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80271",
      "symbol": "NIFTY-Mar2027-22500-PE",
      "strike": 22500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80272",
      "symbol": "NIFTY-Mar2027-24000-CE",
      "strike": 24000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80273",
      "symbol": "NIFTY-Mar2027-24000-PE",
      "strike": 24000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80274",
      "symbol": "NIFTY-Mar2027-25500-CE",
      "strike": 25500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80275",
      "symbol": "NIFTY-Mar2027-25500-PE",
      "strike": 25500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80276",
      "symbol": "NIFTY-Mar2027-27000-CE",
      "strike": 27000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80277",
      "symbol": "NIFTY-Mar2027-27000-PE",
      "strike": 27000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80278",
      "symbol": "NIFTY-Mar2027-28500-CE",
      "strike": 28500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80306",
      "symbol": "NIFTY-Mar2027-28500-PE",
      "strike": 28500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80307",
      "symbol": "NIFTY-Mar2027-30000-CE",
      "strike": 30000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80310",
      "symbol": "NIFTY-Mar2027-30000-PE",
      "strike": 30000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80311",
      "symbol": "NIFTY-Mar2027-31500-CE",
      "strike": 31500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80312",
      "symbol": "NIFTY-Mar2027-31500-PE",
      "strike": 31500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80313",
      "symbol": "NIFTY-Mar2027-33000-CE",
      "strike": 33000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80314",
      "symbol": "NIFTY-Mar2027-33000-PE",
      "strike": 33000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80315",
      "symbol": "NIFTY-Mar2027-34500-CE",
      "strike": 34500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80316",
      "symbol": "NIFTY-Mar2027-34500-PE",
      "strike": 34500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80317",
      "symbol": "NIFTY-Mar2027-36000-CE",
      "strike": 36000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80318",
      "symbol": "NIFTY-Mar2027-36000-PE",
      "strike": 36000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80319",
      "symbol": "NIFTY-Mar2027-37500-CE",
      "strike": 37500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80322",
      "symbol": "NIFTY-Mar2027-37500-PE",
      "strike": 37500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80323",
      "symbol": "NIFTY-Mar2027-39000-CE",
      "strike": 39000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80324",
      "symbol": "NIFTY-Mar2027-39000-PE",
      "strike": 39000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80325",
      "symbol": "NIFTY-Mar2027-40500-CE",
      "strike": 40500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80326",
      "symbol": "NIFTY-Mar2027-40500-PE",
      "strike": 40500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80327",
      "symbol": "NIFTY-Mar2027-42000-CE",
      "strike": 42000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80328",
      "symbol": "NIFTY-Mar2027-42000-PE",
      "strike": 42000,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80329",
      "symbol": "NIFTY-Mar2027-43500-CE",
      "strike": 43500,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80330",
      "symbol": "NIFTY-Mar2027-43500-PE",
      "strike": 43500,
      "type": "PE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80331",
      "symbol": "NIFTY-Mar2027-45000-CE",
      "strike": 45000,
      "type": "CE",
      "expiry": "2027-03-30"
    },
    {
      "security_id": "80332",
      "symbol": "NIFTY-Mar2027-45000-PE",
      "strike": 45000,
      "type": "PE",
      "expiry": "2027-03-30"
    }
  ]
};

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
