// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-10-06 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-10-06';
export const CURRENT_EXPIRY_FORMATTED = '06-OCT-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "40616",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "40615",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "40618",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "40617",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "40620",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "40619",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "40622",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "40621",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "40624",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "40623",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "40630",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "40627",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "40632",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "40631",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "40634",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "40633",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "40637",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "40635",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "40644",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "40638",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "40646",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "40645",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "40648",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "40647",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "40651",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "40649",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "40653",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "40652",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "40656",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "40654",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "40658",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "40657",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "40660",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "40659",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "40662",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "40661",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "40664",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "40663",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "40666",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "40665",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "40668",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "40667",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "40670",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "40669",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "40672",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "40671",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "40674",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "40673",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "40676",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "40675",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "40678",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "40677",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "40681",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "40679",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "40686",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "40682",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "40688",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "40687",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "40696",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "40689",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "40698",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "40697",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "40700",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "40699",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "40703",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "40701",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "40709",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "40704",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "40711",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "40710",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "40714",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "40712",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "40716",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "40715",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "40720",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "40717",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "40722",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "40721",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "40724",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "40723",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "40732",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "40731",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "40736",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "40735",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "40742",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "40741",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "40744",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "40743",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "40746",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "40745",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "40750",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "40749",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "40752",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "40751",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "40754",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "40753",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "40756",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "40755",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "40758",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "40757",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "40760",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "40759",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "40764",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "40763",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "40766",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "40765",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "40768",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "40767",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "40770",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "40769",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "40780",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "40779",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "40782",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "40781",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "40788",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "40786",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "40790",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "40789",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "40792",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "40791",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "40794",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "40793",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "40802",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "40801",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "40804",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "40803",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "40810",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "40809",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "40812",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "40811",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "40814",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "40813",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "40818",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "40817",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "40820",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "40819",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "40822",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "40821",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "40824",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "40823",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "40826",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "40825",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "40828",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "40827",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "40834",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "40831",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "40836",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "40835",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "40845",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "40844",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "40851",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "40846",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "40857",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "40852",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "40860",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "40858",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "40862",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "40861",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "40864",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "40863",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "40866",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "40865",
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
