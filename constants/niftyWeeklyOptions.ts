// Nifty Weekly Options - Manually curated for current week
// Expiry: 2026-09-22 (Next Tuesday)
// Range: 21000 to 25000 (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

// Current week expiry date (auto-updated by generateWeeklyOptions.cjs)
export const CURRENT_EXPIRY_DATE = '2026-09-22';
export const CURRENT_EXPIRY_FORMATTED = '22-SEP-26';

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = [
  {
    "security_id": "56526",
    "strike": 21000,
    "type": "PE"
  },
  {
    "security_id": "56515",
    "strike": 21000,
    "type": "CE"
  },
  {
    "security_id": "56556",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "56527",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "56562",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "56557",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "56564",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "56563",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "56606",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "56565",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "56618",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "56607",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "56626",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "56619",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "56630",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "56627",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "56642",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "56631",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "56644",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "56643",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "56654",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "56645",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "56666",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "56655",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "56674",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "56667",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "56684",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "56675",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "56696",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "56685",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "56700",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "56697",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "56702",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "56701",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "56706",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "56703",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "56720",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "56707",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "56722",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "56721",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "56728",
    "strike": 22000,
    "type": "PE"
  },
  {
    "security_id": "56723",
    "strike": 22000,
    "type": "CE"
  },
  {
    "security_id": "56778",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "56729",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "56796",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "56779",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "56820",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "56803",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "56822",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "56821",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "56824",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "56823",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "56826",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "56825",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "56836",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "56827",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "56862",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "56837",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "56864",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "56863",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "56874",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "56865",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "56876",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "56875",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "56902",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "56877",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "56904",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "56903",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "56906",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "56905",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "56908",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "56907",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "56934",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "56909",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "56936",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "56935",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "56938",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "56937",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "56948",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "56939",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "56956",
    "strike": 23000,
    "type": "PE"
  },
  {
    "security_id": "56949",
    "strike": 23000,
    "type": "CE"
  },
  {
    "security_id": "56966",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "56957",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "56977",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "56967",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "56979",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "56978",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "56981",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "56980",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "56984",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "56983",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "56994",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "56985",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "56996",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "56995",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "57002",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "56999",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "57006",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "57003",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "57022",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "57007",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "57030",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "57023",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "57049",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "57031",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "57053",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "57052",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "57064",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "57063",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "57083",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "57082",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "57085",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "57084",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "57087",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "57086",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "57126",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "57125",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "57147",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "57142",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "57154",
    "strike": 24000,
    "type": "PE"
  },
  {
    "security_id": "57153",
    "strike": 24000,
    "type": "CE"
  },
  {
    "security_id": "57229",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "57228",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "57252",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "57251",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "57380",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "57379",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "57388",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "57387",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "57428",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "57427",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "57446",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "57441",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "57502",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "57501",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "57520",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "57519",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "57587",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "57584",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "57618",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "57617",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "57639",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "57638",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "57680",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "57679",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "57702",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "57701",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "57715",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "57712",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "57723",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "57716",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "57735",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "57734",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "57757",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "57756",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "57784",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "57783",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "57795",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "57794",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "57797",
    "strike": 25000,
    "type": "PE"
  },
  {
    "security_id": "57796",
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
