// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-07-28 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-07-28';
export const CURRENT_EXPIRY_FORMATTED = '28-JUL-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "63808",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "63807",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "63810",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "63809",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "63812",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "63811",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "63814",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "63813",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "63816",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "63815",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "63818",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "63817",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "63820",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "63819",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "63824",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "63823",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "63826",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "63825",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "63830",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "63829",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "63832",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "63831",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "63837",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "63835",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "63839",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "63838",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "63841",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "63840",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "63843",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "63842",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "63846",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "63844",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "63848",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "63847",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "63850",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "63849",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "63852",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "63851",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "63854",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "63853",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "63856",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "63855",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "63858",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "63857",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "63860",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "63859",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "63862",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "63861",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "63864",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "63863",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "63866",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "63865",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "63868",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "63867",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "63870",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "63869",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "63872",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "63871",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "63874",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "63873",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "63876",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "63875",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "63878",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "63877",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "63880",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "63879",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "63882",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "63881",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "63884",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "63883",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "63886",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "63885",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "63888",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "63887",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "63890",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "63889",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "63892",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "63891",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "63894",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "63893",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "63896",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "63895",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "63898",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "63897",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "63900",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "63899",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "63902",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "63901",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "63904",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "63903",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "63906",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "63905",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "63908",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "63907",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "63910",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "63909",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "63912",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "63911",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "63914",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "63913",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "63916",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "63915",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "63918",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "63917",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "63921",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "63919",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "63924",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "63923",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "63926",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "63925",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "63928",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "63927",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "63930",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "63929",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "63934",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "63933",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "63936",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "63935",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "63938",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "63937",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "63940",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "63939",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "63942",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "63941",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "63944",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "63943",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "63946",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "63945",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "63948",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "63947",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "63950",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "63949",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "63952",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "63951",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "63954",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "63953",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "63956",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "63955",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "63958",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "63957",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "63960",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "63959",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "63962",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "63961",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "63964",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "63963",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "63966",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "63965",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "63968",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "63967",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "63970",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "63969",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "63972",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "63971",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "63974",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "63973",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "63976",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "63975",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "63978",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "63977",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "63980",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "63979",
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
