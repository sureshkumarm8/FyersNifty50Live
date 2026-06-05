// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-06-09 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-06-09';
export const CURRENT_EXPIRY_FORMATTED = '09-JUN-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "42145",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "42144",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "42153",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "42152",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "42155",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "42154",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "42159",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "42158",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "42161",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "42160",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "42164",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "42163",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "42166",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "42165",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "42175",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "42174",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "42181",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "42180",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "42185",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "42184",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "42187",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "42186",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "42189",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "42188",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "42191",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "42190",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "42193",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "42192",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "42195",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "42194",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "42197",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "42196",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "42199",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "42198",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "42201",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "42200",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "42209",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "42208",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "42213",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "42212",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "42215",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "42214",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "42220",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "42219",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "42223",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "42222",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "42225",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "42224",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "42227",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "42226",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "42229",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "42228",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "42239",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "42238",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "42241",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "42240",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "42245",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "42244",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "42247",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "42246",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "42249",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "42248",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "42251",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "42250",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "42253",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "42252",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "42255",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "42254",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "42257",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "42256",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "42259",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "42258",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "42261",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "42260",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "42263",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "42262",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "42265",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "42264",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "42267",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "42266",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "42269",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "42268",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "42271",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "42270",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "42273",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "42272",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "42279",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "42278",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "42285",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "42284",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "42287",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "42286",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "42289",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "42288",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "42293",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "42290",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "42296",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "42295",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "42299",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "42297",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "42301",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "42300",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "42303",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "42302",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "42305",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "42304",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "42307",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "42306",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "42315",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "42308",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "42317",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "42316",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "42319",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "42318",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "42325",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "42324",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "42327",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "42326",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "42329",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "42328",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "42331",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "42330",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "42333",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "42332",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "42335",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "42334",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "42337",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "42336",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "42341",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "42338",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "42343",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "42342",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "42345",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "42344",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "42347",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "42346",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "42355",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "42348",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "42357",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "42356",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "42359",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "42358",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "42361",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "42360",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "42363",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "42362",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "42365",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "42364",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "42367",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "42366",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "42369",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "42368",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "42371",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "42370",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "42375",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "42372",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "42377",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "42376",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "42380",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "42378",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "42382",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "42381",
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
