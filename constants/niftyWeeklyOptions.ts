// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-05-26 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-05-26';
export const CURRENT_EXPIRY_FORMATTED = '26-MAY-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "71736",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "71735",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "71738",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "71737",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "71740",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "71739",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "71742",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "71741",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "71746",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "71745",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "71748",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "71747",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "71754",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "71753",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "71762",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "71761",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "71764",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "71763",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "71766",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "71765",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "71768",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "71767",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "71770",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "71769",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "71772",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "71771",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "71779",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "71778",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "71781",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "71780",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "71783",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "71782",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "71785",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "71784",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "71787",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "71786",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "71789",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "71788",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "71792",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "71790",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "71799",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "71793",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "71814",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "71813",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "71817",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "71816",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "71819",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "71818",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "71821",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "71820",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "71833",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "71832",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "71837",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "71836",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "71839",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "71838",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "71841",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "71840",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "71849",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "71848",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "71860",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "71859",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "71868",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "71867",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "71870",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "71869",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "71878",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "71877",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "71880",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "71879",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "71882",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "71881",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "71884",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "71883",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "71886",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "71885",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "71888",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "71887",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "71890",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "71889",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "71892",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "71891",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "71896",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "71895",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "71920",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "71919",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "71942",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "71941",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "71978",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "71977",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "71980",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "71979",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "71982",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "71981",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "72014",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "72013",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "72016",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "72015",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "72020",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "72019",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "72068",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "72067",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "72142",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "72141",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "72147",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "72143",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "72166",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "72165",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "72168",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "72167",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "72170",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "72169",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "72172",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "72171",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "72174",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "72173",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "72176",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "72175",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "72178",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "72177",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "72180",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "72179",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "72182",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "72181",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "72184",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "72183",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "72186",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "72185",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "72188",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "72187",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "72238",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "72237",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "72240",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "72239",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "72242",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "72241",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "72247",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "72243",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "72274",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "72273",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "72276",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "72275",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "72281",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "72280",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "72283",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "72282",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "72285",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "72284",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "72287",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "72286",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "72289",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "72288",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "72291",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "72290",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "72293",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "72292",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "72295",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "72294",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "72297",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "72296",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "72299",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "72298",
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
