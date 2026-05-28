// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-06-02 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-06-02';
export const CURRENT_EXPIRY_FORMATTED = '02-JUN-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "56911",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "56910",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "56913",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "56912",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "56915",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "56914",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "56917",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "56916",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "56919",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "56918",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "56921",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "56920",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "56923",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "56922",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "56925",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "56924",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "56927",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "56926",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "56929",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "56928",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "56931",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "56930",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "56933",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "56932",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "56935",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "56934",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "56937",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "56936",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "56939",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "56938",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "56941",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "56940",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "56943",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "56942",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "56945",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "56944",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "56947",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "56946",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "56949",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "56948",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "56951",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "56950",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "56953",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "56952",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "56955",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "56954",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "56957",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "56956",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "56959",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "56958",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "56962",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "56960",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "56964",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "56963",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "56967",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "56966",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "56969",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "56968",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "56971",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "56970",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "56979",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "56978",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "56981",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "56980",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "56985",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "56984",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "56987",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "56986",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "56989",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "56988",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "56991",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "56990",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "57001",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "57000",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "57005",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "57004",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "57007",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "57006",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "57009",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "57008",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "57011",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "57010",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "57013",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "57012",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "57015",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "57014",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "57017",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "57016",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "57019",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "57018",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "57021",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "57020",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "57023",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "57022",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "57025",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "57024",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "57027",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "57026",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "57029",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "57028",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "57031",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "57030",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "57033",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "57032",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "57035",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "57034",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "57037",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "57036",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "57039",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "57038",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "57041",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "57040",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "57043",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "57042",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "57045",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "57044",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "57047",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "57046",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "57049",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "57048",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "57051",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "57050",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "57053",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "57052",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "57055",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "57054",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "57057",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "57056",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "57059",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "57058",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "57063",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "57060",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "57065",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "57064",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "57071",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "57066",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "57073",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "57072",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "57081",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "57074",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "57083",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "57082",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "57089",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "57084",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "57091",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "57090",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "57093",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "57092",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "57095",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "57094",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "57097",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "57096",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "57099",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "57098",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "57101",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "57100",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "57103",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "57102",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "57105",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "57104",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "57107",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "57106",
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
