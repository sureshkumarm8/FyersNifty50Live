// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-11-23 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-11-23';
export const CURRENT_EXPIRY_FORMATTED = '23-NOV-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "64177",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "64170",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "64179",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "64178",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "64181",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "64180",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "64185",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "64182",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "64187",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "64186",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "64189",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "64188",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "64191",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "64190",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "64197",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "64192",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "64205",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "64201",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "64207",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "64206",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "64209",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "64208",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "64215",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "64210",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "64217",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "64216",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "64219",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "64218",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "64221",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "64220",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "64226",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "64222",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "64228",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "64227",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "64233",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "64232",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "64235",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "64234",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "64237",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "64236",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "64239",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "64238",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "64241",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "64240",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "64243",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "64242",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "64245",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "64244",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "64247",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "64246",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "64267",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "64266",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "64269",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "64268",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "64271",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "64270",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "64275",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "64274",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "64277",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "64276",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "64279",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "64278",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "64285",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "64284",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "64287",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "64286",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "64290",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "64288",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "64293",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "64291",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "64295",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "64294",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "64305",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "64304",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "64324",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "64306",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "64326",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "64325",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "64334",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "64327",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "64337",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "64335",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "64346",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "64342",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "64348",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "64347",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "64350",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "64349",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "64352",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "64351",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "64356",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "64353",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "64358",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "64357",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "64360",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "64359",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "64362",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "64361",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "64372",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "64363",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "64374",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "64373",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "64376",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "64375",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "64378",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "64377",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "64380",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "64379",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "64384",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "64381",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "64386",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "64385",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "64388",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "64387",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "64390",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "64389",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "64392",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "64391",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "64396",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "64393",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "64398",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "64397",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "64400",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "64399",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "64402",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "64401",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "64404",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "64403",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "64406",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "64405",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "64408",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "64407",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "64410",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "64409",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "64412",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "64411",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "64414",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "64413",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "64416",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "64415",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "64418",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "64417",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "64420",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "64419",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "64422",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "64421",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "64424",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "64423",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "64426",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "64425",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "64428",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "64427",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "64432",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "64429",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "64434",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "64433",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "64436",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "64435",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "64438",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "64437",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "64440",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "64439",
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
