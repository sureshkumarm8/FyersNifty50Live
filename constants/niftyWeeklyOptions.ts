// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-04-07 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-04-07';
export const CURRENT_EXPIRY_FORMATTED = '07-APR-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "40641",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "40640",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "40643",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "40642",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "40647",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "40644",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "40651",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "40648",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "40655",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "40652",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "40659",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "40656",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "40661",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "40660",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "40663",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "40662",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "40667",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "40664",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "40677",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "40668",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "40679",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "40678",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "40681",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "40680",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "40683",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "40682",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "40687",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "40684",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "40689",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "40688",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "40691",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "40690",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "40693",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "40692",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "40695",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "40694",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "40697",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "40696",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "40699",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "40698",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "40701",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "40700",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "40704",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "40703",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "40706",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "40705",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "40708",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "40707",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "40717",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "40714",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "40723",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "40718",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "40725",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "40724",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "40727",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "40726",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "40729",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "40728",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "40731",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "40730",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "40735",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "40732",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "40737",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "40736",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "40739",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "40738",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "40741",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "40740",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "40745",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "40742",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "40751",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "40747",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "40753",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "40752",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "40760",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "40754",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "40769",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "40761",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "40771",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "40770",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "40773",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "40772",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "40775",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "40774",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "40777",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "40776",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "40779",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "40778",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "40782",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "40781",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "40784",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "40783",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "40787",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "40785",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "40789",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "40788",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "40791",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "40790",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "40795",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "40792",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "40797",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "40796",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "40799",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "40798",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "40801",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "40800",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "40803",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "40802",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "40806",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "40804",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "40814",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "40809",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "40817",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "40816",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "40819",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "40818",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "40821",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "40820",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "40823",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "40822",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "40829",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "40824",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "40832",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "40830",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "40837",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "40833",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "40839",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "40838",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "40841",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "40840",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "40847",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "40842",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "40851",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "40850",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "40857",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "40852",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "40861",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "40858",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "40863",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "40862",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "40865",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "40864",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "40867",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "40866",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "40869",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "40868",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "40875",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "40870",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "40877",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "40876",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "40879",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "40878",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "40881",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "40880",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "40883",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "40882",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "40887",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "40884",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "40889",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "40888",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "40893",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "40890",
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
