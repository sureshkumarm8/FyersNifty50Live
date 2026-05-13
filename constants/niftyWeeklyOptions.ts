// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-05-19 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-05-19';
export const CURRENT_EXPIRY_FORMATTED = '19-MAY-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "51187",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "51186",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "51189",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "51188",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "51191",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "51190",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "51196",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "51193",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "51200",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "51197",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "51207",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "51206",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "51209",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "51208",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "51211",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "51210",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "51217",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "51216",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "51219",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "51218",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "51221",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "51220",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "51223",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "51222",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "51237",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "51236",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "51239",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "51238",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "51241",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "51240",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "51243",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "51242",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "51245",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "51244",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "51248",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "51246",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "51251",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "51249",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "51253",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "51252",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "51255",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "51254",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "51257",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "51256",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "51259",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "51258",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "51261",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "51260",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "51265",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "51263",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "51267",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "51266",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "51269",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "51268",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "51271",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "51270",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "51273",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "51272",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "51275",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "51274",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "51277",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "51276",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "51279",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "51278",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "51283",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "51282",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "51286",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "51285",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "51297",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "51296",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "51301",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "51300",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "51303",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "51302",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "51305",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "51304",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "51307",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "51306",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "51309",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "51308",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "51311",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "51310",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "51313",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "51312",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "51315",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "51314",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "51317",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "51316",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "51321",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "51320",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "51323",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "51322",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "51325",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "51324",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "51347",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "51346",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "51349",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "51348",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "51353",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "51352",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "51355",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "51354",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "51357",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "51356",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "51359",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "51358",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "51365",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "51364",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "51367",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "51366",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "51371",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "51370",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "51375",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "51374",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "51377",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "51376",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "51379",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "51378",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "51381",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "51380",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "51383",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "51382",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "51385",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "51384",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "51387",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "51386",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "51389",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "51388",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "51391",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "51390",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "51395",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "51394",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "51397",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "51396",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "51405",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "51404",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "51407",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "51406",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "51409",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "51408",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "51411",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "51410",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "51419",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "51418",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "51421",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "51420",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "51423",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "51422",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "51425",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "51424",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "51427",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "51426",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "51429",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "51428",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "51449",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "51448",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "51451",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "51450",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "51454",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "51452",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "51457",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "51456",
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
