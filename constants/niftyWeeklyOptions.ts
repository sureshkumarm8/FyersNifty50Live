// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-09-01 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-09-01';
export const CURRENT_EXPIRY_FORMATTED = '01-SEP-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "46864",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "46863",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "46866",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "46865",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "46868",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "46867",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "46870",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "46869",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "46872",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "46871",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "46874",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "46873",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "46876",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "46875",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "46878",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "46877",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "46880",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "46879",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "46882",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "46881",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "46886",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "46883",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "46888",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "46887",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "46890",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "46889",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "46892",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "46891",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "46894",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "46893",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "46896",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "46895",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "46898",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "46897",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "46900",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "46899",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "46902",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "46901",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "46904",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "46903",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "46906",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "46905",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "46908",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "46907",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "46910",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "46909",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "46912",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "46911",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "46914",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "46913",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "46916",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "46915",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "46918",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "46917",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "46920",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "46919",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "46922",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "46921",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "46924",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "46923",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "46926",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "46925",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "46928",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "46927",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "46930",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "46929",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "46932",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "46931",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "46934",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "46933",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "46936",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "46935",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "46938",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "46937",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "46940",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "46939",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "46942",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "46941",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "46944",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "46943",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "46946",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "46945",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "46948",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "46947",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "46950",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "46949",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "46952",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "46951",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "46954",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "46953",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "46956",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "46955",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "46958",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "46957",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "46960",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "46959",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "46962",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "46961",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "46964",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "46963",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "46966",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "46965",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "46968",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "46967",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "46970",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "46969",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "46972",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "46971",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "46974",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "46973",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "46976",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "46975",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "46978",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "46977",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "46980",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "46979",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "46982",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "46981",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "46984",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "46983",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "46986",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "46985",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "46988",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "46987",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "46990",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "46989",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "46992",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "46991",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "46994",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "46993",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "46996",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "46995",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "46998",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "46997",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "47000",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "46999",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "47002",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "47001",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "47004",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "47003",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "47006",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "47005",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "47008",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "47007",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "47010",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "47009",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "47012",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "47011",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "47014",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "47013",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "47016",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "47015",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "47018",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "47017",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "47020",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "47019",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "47022",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "47021",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "47024",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "47023",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "47026",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "47025",
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
