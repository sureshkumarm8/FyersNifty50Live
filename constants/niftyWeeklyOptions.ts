// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-11-03 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-11-03';
export const CURRENT_EXPIRY_FORMATTED = '03-NOV-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "53376",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "53373",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "53378",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "53377",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "53380",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "53379",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "53390",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "53381",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "53396",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "53391",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "53408",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "53397",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "53439",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "53409",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "53451",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "53440",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "53456",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "53452",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "53470",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "53458",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "53472",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "53471",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "53487",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "53473",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "53496",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "53488",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "53498",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "53497",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "53500",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "53499",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "53504",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "53503",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "53510",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "53505",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "53516",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "53515",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "53518",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "53517",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "53524",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "53519",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "53542",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "53525",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "53558",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "53543",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "53576",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "53571",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "53635",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "53577",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "53655",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "53636",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "53661",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "53656",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "53663",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "53662",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "53667",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "53664",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "53679",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "53668",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "53681",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "53680",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "53701",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "53682",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "53719",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "53702",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "53749",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "53720",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "53781",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "53750",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "53791",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "53782",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "53793",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "53792",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "53795",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "53794",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "53835",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "53796",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "53859",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "53836",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "53871",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "53860",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "53923",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "53872",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "53925",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "53924",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "53927",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "53926",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "53929",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "53928",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "53931",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "53930",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "53939",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "53932",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "53941",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "53940",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "54045",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "53942",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "54049",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "54046",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "54051",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "54050",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "54055",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "54052",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "54061",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "54056",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "54065",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "54062",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "54097",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "54066",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "54099",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "54098",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "54101",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "54100",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "54103",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "54102",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "54105",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "54104",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "54107",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "54106",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "54109",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "54108",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "54111",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "54110",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "54115",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "54114",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "54117",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "54116",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "54119",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "54118",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "54121",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "54120",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "54123",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "54122",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "54125",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "54124",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "54127",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "54126",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "54129",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "54128",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "54135",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "54134",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "54177",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "54136",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "54193",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "54182",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "54239",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "54194",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "54253",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "54240",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "54261",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "54254",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "54267",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "54262",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "54273",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "54268",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "54275",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "54274",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "54277",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "54276",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "54331",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "54284",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "54333",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "54332",
    "strike": 25000,
    "type": "CE"
  }
];

// Get security IDs for current week (all 162 contracts)
export function getWeeklyOptionIds(): string[] {
  return NIFTY_WEEKLY_OPTIONS.map(opt => opt.security_id);
}

// Get security IDs filtered by strike range
export function getWeeklyOptionIdsByStrike(atmStrike: number, range: number = 20): string[] {
  const minStrike = atmStrike - (range * 50);
  const maxStrike = atmStrike + (range * 50);
  
  return NIFTY_WEEKLY_OPTIONS
    .filter(opt => opt.strike >= minStrike && opt.strike <= maxStrike)
    .map(opt => opt.security_id);
}
