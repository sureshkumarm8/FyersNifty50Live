// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-12-01 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-12-01';
export const CURRENT_EXPIRY_FORMATTED = '01-DEC-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "47369",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "47368",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "47376",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "47370",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "47379",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "47377",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "47385",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "47380",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "47389",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "47386",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "47395",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "47392",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "47397",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "47396",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "47403",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "47402",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "47415",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "47404",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "47421",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "47420",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "47423",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "47422",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "47430",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "47424",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "47435",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "47431",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "47437",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "47436",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "47441",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "47438",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "47443",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "47442",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "47445",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "47444",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "47449",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "47446",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "47451",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "47450",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "47453",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "47452",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "47457",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "47454",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "47463",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "47458",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "47465",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "47464",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "47472",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "47467",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "47474",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "47473",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "47478",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "47475",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "47480",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "47479",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "47484",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "47481",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "47486",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "47485",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "47490",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "47487",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "47494",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "47491",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "47496",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "47495",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "47500",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "47497",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "47502",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "47501",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "47504",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "47503",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "47510",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "47505",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "47512",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "47511",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "47514",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "47513",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "47516",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "47515",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "47518",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "47517",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "47524",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "47519",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "47528",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "47526",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "47535",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "47529",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "47538",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "47536",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "47540",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "47539",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "47542",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "47541",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "47544",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "47543",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "47546",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "47545",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "47548",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "47547",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "47564",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "47549",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "47566",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "47565",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "47568",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "47567",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "47574",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "47569",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "47576",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "47575",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "47582",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "47577",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "47584",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "47583",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "47588",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "47587",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "47594",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "47589",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "47598",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "47595",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "47600",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "47599",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "47602",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "47601",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "47610",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "47603",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "47614",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "47611",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "47616",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "47615",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "47624",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "47621",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "47630",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "47625",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "47632",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "47631",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "47634",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "47633",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "47636",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "47635",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "47640",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "47637",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "47664",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "47641",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "47668",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "47665",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "47672",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "47669",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "47674",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "47673",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "47696",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "47675",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "47712",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "47697",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "47720",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "47713",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "47726",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "47721",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "47744",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "47727",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "47766",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "47745",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "47768",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "47767",
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
