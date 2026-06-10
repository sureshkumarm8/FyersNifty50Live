// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-06-16 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-06-16';
export const CURRENT_EXPIRY_FORMATTED = '16-JUN-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "50421",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "50418",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "50424",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "50423",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "50426",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "50425",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "50434",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "50433",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "50436",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "50435",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "50438",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "50437",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "50440",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "50439",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "50442",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "50441",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "50451",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "50450",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "50453",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "50452",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "50455",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "50454",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "50457",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "50456",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "50459",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "50458",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "50461",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "50460",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "50464",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "50463",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "50466",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "50465",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "50468",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "50467",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "50470",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "50469",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "50472",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "50471",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "50474",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "50473",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "50476",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "50475",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "50478",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "50477",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "50480",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "50479",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "50484",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "50483",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "50486",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "50485",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "50494",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "50493",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "50496",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "50495",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "50498",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "50497",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "50504",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "50503",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "50510",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "50509",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "50512",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "50511",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "50518",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "50517",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "50520",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "50519",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "50522",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "50521",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "50527",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "50523",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "50531",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "50530",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "50533",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "50532",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "50535",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "50534",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "50539",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "50538",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "50543",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "50542",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "50550",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "50549",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "50553",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "50552",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "50562",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "50561",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "50564",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "50563",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "50566",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "50565",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "50569",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "50568",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "50571",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "50570",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "50573",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "50572",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "50575",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "50574",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "50577",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "50576",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "50586",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "50585",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "50592",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "50591",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "50594",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "50593",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "50602",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "50601",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "50604",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "50603",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "50606",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "50605",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "50608",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "50607",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "50610",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "50609",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "50612",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "50611",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "50614",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "50613",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "50616",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "50615",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "50618",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "50617",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "50620",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "50619",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "50624",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "50621",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "50638",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "50637",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "50640",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "50639",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "50642",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "50641",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "50644",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "50643",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "50646",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "50645",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "50648",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "50647",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "50650",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "50649",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "50652",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "50651",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "50656",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "50655",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "50658",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "50657",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "50662",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "50659",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "50668",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "50667",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "50670",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "50669",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "50675",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "50674",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "50680",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "50679",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "50682",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "50681",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "50685",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "50684",
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
