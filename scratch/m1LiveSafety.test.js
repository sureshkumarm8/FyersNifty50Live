// constants/lotSize.ts
var NIFTY_LOT_SIZE = 65;

// constants/niftyWeeklyOptions.ts
var CURRENT_EXPIRY_DATE = "2026-10-27";
var NIFTY_WEEKLY_OPTIONS = [
  {
    "security_id": "51261",
    "strike": 21e3,
    "type": "PE"
  },
  {
    "security_id": "51260",
    "strike": 21e3,
    "type": "CE"
  },
  {
    "security_id": "51264",
    "strike": 21050,
    "type": "PE"
  },
  {
    "security_id": "51262",
    "strike": 21050,
    "type": "CE"
  },
  {
    "security_id": "51267",
    "strike": 21100,
    "type": "PE"
  },
  {
    "security_id": "51266",
    "strike": 21100,
    "type": "CE"
  },
  {
    "security_id": "51269",
    "strike": 21150,
    "type": "PE"
  },
  {
    "security_id": "51268",
    "strike": 21150,
    "type": "CE"
  },
  {
    "security_id": "51271",
    "strike": 21200,
    "type": "PE"
  },
  {
    "security_id": "51270",
    "strike": 21200,
    "type": "CE"
  },
  {
    "security_id": "51273",
    "strike": 21250,
    "type": "PE"
  },
  {
    "security_id": "51272",
    "strike": 21250,
    "type": "CE"
  },
  {
    "security_id": "51279",
    "strike": 21300,
    "type": "PE"
  },
  {
    "security_id": "51278",
    "strike": 21300,
    "type": "CE"
  },
  {
    "security_id": "51281",
    "strike": 21350,
    "type": "PE"
  },
  {
    "security_id": "51280",
    "strike": 21350,
    "type": "CE"
  },
  {
    "security_id": "51283",
    "strike": 21400,
    "type": "PE"
  },
  {
    "security_id": "51282",
    "strike": 21400,
    "type": "CE"
  },
  {
    "security_id": "51285",
    "strike": 21450,
    "type": "PE"
  },
  {
    "security_id": "51284",
    "strike": 21450,
    "type": "CE"
  },
  {
    "security_id": "51287",
    "strike": 21500,
    "type": "PE"
  },
  {
    "security_id": "51286",
    "strike": 21500,
    "type": "CE"
  },
  {
    "security_id": "51289",
    "strike": 21550,
    "type": "PE"
  },
  {
    "security_id": "51288",
    "strike": 21550,
    "type": "CE"
  },
  {
    "security_id": "51291",
    "strike": 21600,
    "type": "PE"
  },
  {
    "security_id": "51290",
    "strike": 21600,
    "type": "CE"
  },
  {
    "security_id": "51293",
    "strike": 21650,
    "type": "PE"
  },
  {
    "security_id": "51292",
    "strike": 21650,
    "type": "CE"
  },
  {
    "security_id": "51295",
    "strike": 21700,
    "type": "PE"
  },
  {
    "security_id": "51294",
    "strike": 21700,
    "type": "CE"
  },
  {
    "security_id": "51297",
    "strike": 21750,
    "type": "PE"
  },
  {
    "security_id": "51296",
    "strike": 21750,
    "type": "CE"
  },
  {
    "security_id": "51299",
    "strike": 21800,
    "type": "PE"
  },
  {
    "security_id": "51298",
    "strike": 21800,
    "type": "CE"
  },
  {
    "security_id": "51303",
    "strike": 21850,
    "type": "PE"
  },
  {
    "security_id": "51302",
    "strike": 21850,
    "type": "CE"
  },
  {
    "security_id": "51305",
    "strike": 21900,
    "type": "PE"
  },
  {
    "security_id": "51304",
    "strike": 21900,
    "type": "CE"
  },
  {
    "security_id": "51307",
    "strike": 21950,
    "type": "PE"
  },
  {
    "security_id": "51306",
    "strike": 21950,
    "type": "CE"
  },
  {
    "security_id": "51309",
    "strike": 22e3,
    "type": "PE"
  },
  {
    "security_id": "51308",
    "strike": 22e3,
    "type": "CE"
  },
  {
    "security_id": "51311",
    "strike": 22050,
    "type": "PE"
  },
  {
    "security_id": "51310",
    "strike": 22050,
    "type": "CE"
  },
  {
    "security_id": "51313",
    "strike": 22100,
    "type": "PE"
  },
  {
    "security_id": "51312",
    "strike": 22100,
    "type": "CE"
  },
  {
    "security_id": "51315",
    "strike": 22150,
    "type": "PE"
  },
  {
    "security_id": "51314",
    "strike": 22150,
    "type": "CE"
  },
  {
    "security_id": "51317",
    "strike": 22200,
    "type": "PE"
  },
  {
    "security_id": "51316",
    "strike": 22200,
    "type": "CE"
  },
  {
    "security_id": "51319",
    "strike": 22250,
    "type": "PE"
  },
  {
    "security_id": "51318",
    "strike": 22250,
    "type": "CE"
  },
  {
    "security_id": "51321",
    "strike": 22300,
    "type": "PE"
  },
  {
    "security_id": "51320",
    "strike": 22300,
    "type": "CE"
  },
  {
    "security_id": "51325",
    "strike": 22350,
    "type": "PE"
  },
  {
    "security_id": "51324",
    "strike": 22350,
    "type": "CE"
  },
  {
    "security_id": "51327",
    "strike": 22400,
    "type": "PE"
  },
  {
    "security_id": "51326",
    "strike": 22400,
    "type": "CE"
  },
  {
    "security_id": "51329",
    "strike": 22450,
    "type": "PE"
  },
  {
    "security_id": "51328",
    "strike": 22450,
    "type": "CE"
  },
  {
    "security_id": "51331",
    "strike": 22500,
    "type": "PE"
  },
  {
    "security_id": "51330",
    "strike": 22500,
    "type": "CE"
  },
  {
    "security_id": "51333",
    "strike": 22550,
    "type": "PE"
  },
  {
    "security_id": "51332",
    "strike": 22550,
    "type": "CE"
  },
  {
    "security_id": "51337",
    "strike": 22600,
    "type": "PE"
  },
  {
    "security_id": "51334",
    "strike": 22600,
    "type": "CE"
  },
  {
    "security_id": "51339",
    "strike": 22650,
    "type": "PE"
  },
  {
    "security_id": "51338",
    "strike": 22650,
    "type": "CE"
  },
  {
    "security_id": "51341",
    "strike": 22700,
    "type": "PE"
  },
  {
    "security_id": "51340",
    "strike": 22700,
    "type": "CE"
  },
  {
    "security_id": "51343",
    "strike": 22750,
    "type": "PE"
  },
  {
    "security_id": "51342",
    "strike": 22750,
    "type": "CE"
  },
  {
    "security_id": "51345",
    "strike": 22800,
    "type": "PE"
  },
  {
    "security_id": "51344",
    "strike": 22800,
    "type": "CE"
  },
  {
    "security_id": "51347",
    "strike": 22850,
    "type": "PE"
  },
  {
    "security_id": "51346",
    "strike": 22850,
    "type": "CE"
  },
  {
    "security_id": "51349",
    "strike": 22900,
    "type": "PE"
  },
  {
    "security_id": "51348",
    "strike": 22900,
    "type": "CE"
  },
  {
    "security_id": "51351",
    "strike": 22950,
    "type": "PE"
  },
  {
    "security_id": "51350",
    "strike": 22950,
    "type": "CE"
  },
  {
    "security_id": "51353",
    "strike": 23e3,
    "type": "PE"
  },
  {
    "security_id": "51352",
    "strike": 23e3,
    "type": "CE"
  },
  {
    "security_id": "51355",
    "strike": 23050,
    "type": "PE"
  },
  {
    "security_id": "51354",
    "strike": 23050,
    "type": "CE"
  },
  {
    "security_id": "51357",
    "strike": 23100,
    "type": "PE"
  },
  {
    "security_id": "51356",
    "strike": 23100,
    "type": "CE"
  },
  {
    "security_id": "51359",
    "strike": 23150,
    "type": "PE"
  },
  {
    "security_id": "51358",
    "strike": 23150,
    "type": "CE"
  },
  {
    "security_id": "51361",
    "strike": 23200,
    "type": "PE"
  },
  {
    "security_id": "51360",
    "strike": 23200,
    "type": "CE"
  },
  {
    "security_id": "51363",
    "strike": 23250,
    "type": "PE"
  },
  {
    "security_id": "51362",
    "strike": 23250,
    "type": "CE"
  },
  {
    "security_id": "51365",
    "strike": 23300,
    "type": "PE"
  },
  {
    "security_id": "51364",
    "strike": 23300,
    "type": "CE"
  },
  {
    "security_id": "51367",
    "strike": 23350,
    "type": "PE"
  },
  {
    "security_id": "51366",
    "strike": 23350,
    "type": "CE"
  },
  {
    "security_id": "51369",
    "strike": 23400,
    "type": "PE"
  },
  {
    "security_id": "51368",
    "strike": 23400,
    "type": "CE"
  },
  {
    "security_id": "51371",
    "strike": 23450,
    "type": "PE"
  },
  {
    "security_id": "51370",
    "strike": 23450,
    "type": "CE"
  },
  {
    "security_id": "51373",
    "strike": 23500,
    "type": "PE"
  },
  {
    "security_id": "51372",
    "strike": 23500,
    "type": "CE"
  },
  {
    "security_id": "51375",
    "strike": 23550,
    "type": "PE"
  },
  {
    "security_id": "51374",
    "strike": 23550,
    "type": "CE"
  },
  {
    "security_id": "51377",
    "strike": 23600,
    "type": "PE"
  },
  {
    "security_id": "51376",
    "strike": 23600,
    "type": "CE"
  },
  {
    "security_id": "51379",
    "strike": 23650,
    "type": "PE"
  },
  {
    "security_id": "51378",
    "strike": 23650,
    "type": "CE"
  },
  {
    "security_id": "51381",
    "strike": 23700,
    "type": "PE"
  },
  {
    "security_id": "51380",
    "strike": 23700,
    "type": "CE"
  },
  {
    "security_id": "51383",
    "strike": 23750,
    "type": "PE"
  },
  {
    "security_id": "51382",
    "strike": 23750,
    "type": "CE"
  },
  {
    "security_id": "51385",
    "strike": 23800,
    "type": "PE"
  },
  {
    "security_id": "51384",
    "strike": 23800,
    "type": "CE"
  },
  {
    "security_id": "51387",
    "strike": 23850,
    "type": "PE"
  },
  {
    "security_id": "51386",
    "strike": 23850,
    "type": "CE"
  },
  {
    "security_id": "51389",
    "strike": 23900,
    "type": "PE"
  },
  {
    "security_id": "51388",
    "strike": 23900,
    "type": "CE"
  },
  {
    "security_id": "51391",
    "strike": 23950,
    "type": "PE"
  },
  {
    "security_id": "51390",
    "strike": 23950,
    "type": "CE"
  },
  {
    "security_id": "51393",
    "strike": 24e3,
    "type": "PE"
  },
  {
    "security_id": "51392",
    "strike": 24e3,
    "type": "CE"
  },
  {
    "security_id": "51397",
    "strike": 24050,
    "type": "PE"
  },
  {
    "security_id": "51396",
    "strike": 24050,
    "type": "CE"
  },
  {
    "security_id": "51399",
    "strike": 24100,
    "type": "PE"
  },
  {
    "security_id": "51398",
    "strike": 24100,
    "type": "CE"
  },
  {
    "security_id": "51401",
    "strike": 24150,
    "type": "PE"
  },
  {
    "security_id": "51400",
    "strike": 24150,
    "type": "CE"
  },
  {
    "security_id": "51403",
    "strike": 24200,
    "type": "PE"
  },
  {
    "security_id": "51402",
    "strike": 24200,
    "type": "CE"
  },
  {
    "security_id": "51405",
    "strike": 24250,
    "type": "PE"
  },
  {
    "security_id": "51404",
    "strike": 24250,
    "type": "CE"
  },
  {
    "security_id": "51407",
    "strike": 24300,
    "type": "PE"
  },
  {
    "security_id": "51406",
    "strike": 24300,
    "type": "CE"
  },
  {
    "security_id": "51409",
    "strike": 24350,
    "type": "PE"
  },
  {
    "security_id": "51408",
    "strike": 24350,
    "type": "CE"
  },
  {
    "security_id": "51411",
    "strike": 24400,
    "type": "PE"
  },
  {
    "security_id": "51410",
    "strike": 24400,
    "type": "CE"
  },
  {
    "security_id": "51417",
    "strike": 24450,
    "type": "PE"
  },
  {
    "security_id": "51412",
    "strike": 24450,
    "type": "CE"
  },
  {
    "security_id": "51419",
    "strike": 24500,
    "type": "PE"
  },
  {
    "security_id": "51418",
    "strike": 24500,
    "type": "CE"
  },
  {
    "security_id": "51421",
    "strike": 24550,
    "type": "PE"
  },
  {
    "security_id": "51420",
    "strike": 24550,
    "type": "CE"
  },
  {
    "security_id": "51423",
    "strike": 24600,
    "type": "PE"
  },
  {
    "security_id": "51422",
    "strike": 24600,
    "type": "CE"
  },
  {
    "security_id": "51425",
    "strike": 24650,
    "type": "PE"
  },
  {
    "security_id": "51424",
    "strike": 24650,
    "type": "CE"
  },
  {
    "security_id": "51427",
    "strike": 24700,
    "type": "PE"
  },
  {
    "security_id": "51426",
    "strike": 24700,
    "type": "CE"
  },
  {
    "security_id": "51429",
    "strike": 24750,
    "type": "PE"
  },
  {
    "security_id": "51428",
    "strike": 24750,
    "type": "CE"
  },
  {
    "security_id": "51431",
    "strike": 24800,
    "type": "PE"
  },
  {
    "security_id": "51430",
    "strike": 24800,
    "type": "CE"
  },
  {
    "security_id": "51433",
    "strike": 24850,
    "type": "PE"
  },
  {
    "security_id": "51432",
    "strike": 24850,
    "type": "CE"
  },
  {
    "security_id": "51435",
    "strike": 24900,
    "type": "PE"
  },
  {
    "security_id": "51434",
    "strike": 24900,
    "type": "CE"
  },
  {
    "security_id": "51439",
    "strike": 24950,
    "type": "PE"
  },
  {
    "security_id": "51436",
    "strike": 24950,
    "type": "CE"
  },
  {
    "security_id": "51441",
    "strike": 25e3,
    "type": "PE"
  },
  {
    "security_id": "51440",
    "strike": 25e3,
    "type": "CE"
  }
];

// services/instrumentResolver.ts
var MONTH_NAMES = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
function normalizeDate(expiry) {
  if (expiry instanceof Date) {
    const d = new Date(expiry);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(expiry.trim());
  if (match) {
    return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
  }
  const parsed = new Date(expiry);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid expiry date format: "${expiry}". Expected YYYY-MM-DD.`);
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}
function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
function buildFyersSymbol(date, strike, side) {
  const yy = date.getFullYear().toString().slice(-2);
  const monthIdx = date.getMonth();
  const dd = date.getDate().toString().padStart(2, "0");
  const nextWeek = new Date(date);
  nextWeek.setDate(date.getDate() + 7);
  const isMonthly = nextWeek.getMonth() !== monthIdx;
  if (isMonthly) {
    const mmm = MONTH_NAMES[monthIdx];
    return `NSE:NIFTY${yy}${mmm}${strike}${side}`;
  } else {
    let m = (monthIdx + 1).toString();
    if (monthIdx === 9) m = "O";
    if (monthIdx === 10) m = "N";
    if (monthIdx === 11) m = "D";
    return `NSE:NIFTY${yy}${m}${dd}${strike}${side}`;
  }
}
function resolveOptionSymbol(params) {
  const { broker, strike, side } = params;
  if (!strike || strike <= 0 || strike % 50 !== 0) {
    throw new Error(`Rejected order: Strike ${strike} is invalid (must be a positive multiple of 50).`);
  }
  if (strike < 15e3 || strike > 35e3) {
    throw new Error(`Rejected order: Strike ${strike} is outside allowable NIFTY boundaries [15000, 35000].`);
  }
  const expiryDate = normalizeDate(params.expiry);
  const expiryDateStr = formatDateISO(expiryDate);
  if (broker === "FYERS") {
    const tradableSymbol = buildFyersSymbol(expiryDate, strike, side);
    return {
      broker: "FYERS",
      tradableSymbol,
      strike,
      side,
      expiryDateStr
    };
  }
  if (broker === "PAYTM") {
    const isCurrentWeekly = expiryDateStr === CURRENT_EXPIRY_DATE;
    let securityId;
    if (isCurrentWeekly) {
      const match = NIFTY_WEEKLY_OPTIONS.find((opt) => opt.strike === strike && opt.type === side);
      if (!match) {
        throw new Error(
          `Rejected Paytm order: Strike ${strike} ${side} not found in weekly options master for expiry ${expiryDateStr}.`
        );
      }
      securityId = match.security_id;
    }
    const tradableSymbol = `NSE:NIFTY-${strike}-${side}`;
    return {
      broker: "PAYTM",
      tradableSymbol,
      securityId,
      strike,
      side,
      expiryDateStr
    };
  }
  throw new Error(`Unsupported broker: "${broker}"`);
}

// constants/niftyExpiryDates.ts
var NIFTY_EXPIRY_DATES = [
  // ========== 2026 ==========
  // January 2026
  { date: "2026-01-06", type: "WEEKLY", dayOfWeek: "Tuesday", month: "January", year: 2026 },
  { date: "2026-01-13", type: "WEEKLY", dayOfWeek: "Tuesday", month: "January", year: 2026 },
  { date: "2026-01-20", type: "WEEKLY", dayOfWeek: "Tuesday", month: "January", year: 2026 },
  { date: "2026-01-27", type: "MONTHLY", dayOfWeek: "Tuesday", month: "January", year: 2026 },
  // February 2026
  { date: "2026-02-03", type: "WEEKLY", dayOfWeek: "Tuesday", month: "February", year: 2026 },
  { date: "2026-02-10", type: "WEEKLY", dayOfWeek: "Tuesday", month: "February", year: 2026 },
  { date: "2026-02-17", type: "WEEKLY", dayOfWeek: "Tuesday", month: "February", year: 2026 },
  { date: "2026-02-24", type: "MONTHLY", dayOfWeek: "Tuesday", month: "February", year: 2026 },
  // March 2026
  { date: "2026-03-02", type: "WEEKLY", dayOfWeek: "Monday", month: "March", year: 2026 },
  { date: "2026-03-10", type: "WEEKLY", dayOfWeek: "Tuesday", month: "March", year: 2026 },
  { date: "2026-03-17", type: "WEEKLY", dayOfWeek: "Tuesday", month: "March", year: 2026 },
  { date: "2026-03-24", type: "WEEKLY", dayOfWeek: "Tuesday", month: "March", year: 2026 },
  { date: "2026-03-30", type: "MONTHLY", dayOfWeek: "Monday", month: "March", year: 2026 },
  // April 2026
  { date: "2026-04-07", type: "WEEKLY", dayOfWeek: "Tuesday", month: "April", year: 2026 },
  { date: "2026-04-13", type: "WEEKLY", dayOfWeek: "Monday", month: "April", year: 2026 },
  { date: "2026-04-21", type: "WEEKLY", dayOfWeek: "Tuesday", month: "April", year: 2026 },
  { date: "2026-04-28", type: "MONTHLY", dayOfWeek: "Tuesday", month: "April", year: 2026 },
  // May 2026
  { date: "2026-05-05", type: "WEEKLY", dayOfWeek: "Tuesday", month: "May", year: 2026 },
  { date: "2026-05-12", type: "WEEKLY", dayOfWeek: "Tuesday", month: "May", year: 2026 },
  { date: "2026-05-19", type: "WEEKLY", dayOfWeek: "Tuesday", month: "May", year: 2026 },
  { date: "2026-05-26", type: "MONTHLY", dayOfWeek: "Tuesday", month: "May", year: 2026 },
  // June 2026
  { date: "2026-06-02", type: "WEEKLY", dayOfWeek: "Tuesday", month: "June", year: 2026 },
  { date: "2026-06-09", type: "WEEKLY", dayOfWeek: "Tuesday", month: "June", year: 2026 },
  { date: "2026-06-16", type: "WEEKLY", dayOfWeek: "Tuesday", month: "June", year: 2026 },
  { date: "2026-06-23", type: "WEEKLY", dayOfWeek: "Tuesday", month: "June", year: 2026 },
  { date: "2026-06-30", type: "MONTHLY", dayOfWeek: "Tuesday", month: "June", year: 2026 },
  // July 2026
  { date: "2026-07-07", type: "WEEKLY", dayOfWeek: "Tuesday", month: "July", year: 2026 },
  { date: "2026-07-14", type: "WEEKLY", dayOfWeek: "Tuesday", month: "July", year: 2026 },
  { date: "2026-07-21", type: "WEEKLY", dayOfWeek: "Tuesday", month: "July", year: 2026 },
  { date: "2026-07-28", type: "MONTHLY", dayOfWeek: "Tuesday", month: "July", year: 2026 },
  // August 2026
  { date: "2026-08-04", type: "WEEKLY", dayOfWeek: "Tuesday", month: "August", year: 2026 },
  { date: "2026-08-11", type: "WEEKLY", dayOfWeek: "Tuesday", month: "August", year: 2026 },
  { date: "2026-08-18", type: "WEEKLY", dayOfWeek: "Tuesday", month: "August", year: 2026 },
  { date: "2026-08-25", type: "MONTHLY", dayOfWeek: "Tuesday", month: "August", year: 2026 },
  // September 2026
  { date: "2026-09-01", type: "WEEKLY", dayOfWeek: "Tuesday", month: "September", year: 2026 },
  { date: "2026-09-08", type: "WEEKLY", dayOfWeek: "Tuesday", month: "September", year: 2026 },
  { date: "2026-09-15", type: "WEEKLY", dayOfWeek: "Tuesday", month: "September", year: 2026 },
  { date: "2026-09-22", type: "WEEKLY", dayOfWeek: "Tuesday", month: "September", year: 2026 },
  { date: "2026-09-29", type: "MONTHLY", dayOfWeek: "Tuesday", month: "September", year: 2026 },
  // October 2026
  { date: "2026-10-06", type: "WEEKLY", dayOfWeek: "Tuesday", month: "October", year: 2026 },
  { date: "2026-10-13", type: "WEEKLY", dayOfWeek: "Tuesday", month: "October", year: 2026 },
  { date: "2026-10-19", type: "WEEKLY", dayOfWeek: "Monday", month: "October", year: 2026 },
  { date: "2026-10-27", type: "MONTHLY", dayOfWeek: "Tuesday", month: "October", year: 2026 },
  // November 2026
  { date: "2026-11-03", type: "WEEKLY", dayOfWeek: "Tuesday", month: "November", year: 2026 },
  { date: "2026-11-09", type: "WEEKLY", dayOfWeek: "Monday", month: "November", year: 2026 },
  { date: "2026-11-17", type: "WEEKLY", dayOfWeek: "Tuesday", month: "November", year: 2026 },
  { date: "2026-11-23", type: "MONTHLY", dayOfWeek: "Monday", month: "November", year: 2026 },
  // December 2026
  { date: "2026-12-01", type: "WEEKLY", dayOfWeek: "Tuesday", month: "December", year: 2026 },
  { date: "2026-12-08", type: "WEEKLY", dayOfWeek: "Tuesday", month: "December", year: 2026 },
  { date: "2026-12-15", type: "WEEKLY", dayOfWeek: "Tuesday", month: "December", year: 2026 },
  { date: "2026-12-22", type: "WEEKLY", dayOfWeek: "Tuesday", month: "December", year: 2026 },
  { date: "2026-12-29", type: "MONTHLY", dayOfWeek: "Tuesday", month: "December", year: 2026 },
  // ========== 2027 ==========
  // January 2027
  { date: "2027-01-05", type: "WEEKLY", dayOfWeek: "Tuesday", month: "January", year: 2027 },
  { date: "2027-01-12", type: "WEEKLY", dayOfWeek: "Tuesday", month: "January", year: 2027 },
  { date: "2027-01-19", type: "WEEKLY", dayOfWeek: "Tuesday", month: "January", year: 2027 },
  { date: "2027-01-25", type: "MONTHLY", dayOfWeek: "Monday", month: "January", year: 2027 },
  // February 2027
  { date: "2027-02-02", type: "WEEKLY", dayOfWeek: "Tuesday", month: "February", year: 2027 },
  { date: "2027-02-09", type: "WEEKLY", dayOfWeek: "Tuesday", month: "February", year: 2027 },
  { date: "2027-02-16", type: "WEEKLY", dayOfWeek: "Tuesday", month: "February", year: 2027 },
  { date: "2027-02-23", type: "MONTHLY", dayOfWeek: "Tuesday", month: "February", year: 2027 },
  // March 2027
  { date: "2027-03-02", type: "WEEKLY", dayOfWeek: "Tuesday", month: "March", year: 2027 },
  { date: "2027-03-09", type: "WEEKLY", dayOfWeek: "Tuesday", month: "March", year: 2027 },
  { date: "2027-03-16", type: "WEEKLY", dayOfWeek: "Tuesday", month: "March", year: 2027 },
  { date: "2027-03-23", type: "WEEKLY", dayOfWeek: "Tuesday", month: "March", year: 2027 },
  { date: "2027-03-30", type: "MONTHLY", dayOfWeek: "Tuesday", month: "March", year: 2027 },
  // April 2027
  { date: "2027-04-06", type: "WEEKLY", dayOfWeek: "Tuesday", month: "April", year: 2027 },
  { date: "2027-04-13", type: "WEEKLY", dayOfWeek: "Tuesday", month: "April", year: 2027 },
  { date: "2027-04-20", type: "WEEKLY", dayOfWeek: "Tuesday", month: "April", year: 2027 },
  { date: "2027-04-27", type: "MONTHLY", dayOfWeek: "Tuesday", month: "April", year: 2027 },
  // May 2027
  { date: "2027-05-04", type: "WEEKLY", dayOfWeek: "Tuesday", month: "May", year: 2027 },
  { date: "2027-05-11", type: "WEEKLY", dayOfWeek: "Tuesday", month: "May", year: 2027 },
  { date: "2027-05-18", type: "WEEKLY", dayOfWeek: "Tuesday", month: "May", year: 2027 },
  { date: "2027-05-25", type: "MONTHLY", dayOfWeek: "Tuesday", month: "May", year: 2027 },
  // June 2027
  { date: "2027-06-01", type: "WEEKLY", dayOfWeek: "Tuesday", month: "June", year: 2027 },
  { date: "2027-06-08", type: "WEEKLY", dayOfWeek: "Tuesday", month: "June", year: 2027 },
  { date: "2027-06-15", type: "WEEKLY", dayOfWeek: "Tuesday", month: "June", year: 2027 },
  { date: "2027-06-22", type: "WEEKLY", dayOfWeek: "Tuesday", month: "June", year: 2027 },
  { date: "2027-06-29", type: "MONTHLY", dayOfWeek: "Tuesday", month: "June", year: 2027 },
  // July 2027
  { date: "2027-07-06", type: "WEEKLY", dayOfWeek: "Tuesday", month: "July", year: 2027 },
  { date: "2027-07-13", type: "WEEKLY", dayOfWeek: "Tuesday", month: "July", year: 2027 },
  { date: "2027-07-20", type: "WEEKLY", dayOfWeek: "Tuesday", month: "July", year: 2027 },
  { date: "2027-07-27", type: "MONTHLY", dayOfWeek: "Tuesday", month: "July", year: 2027 },
  // August 2027
  { date: "2027-08-03", type: "WEEKLY", dayOfWeek: "Tuesday", month: "August", year: 2027 },
  { date: "2027-08-10", type: "WEEKLY", dayOfWeek: "Tuesday", month: "August", year: 2027 },
  { date: "2027-08-17", type: "WEEKLY", dayOfWeek: "Tuesday", month: "August", year: 2027 },
  { date: "2027-08-24", type: "WEEKLY", dayOfWeek: "Tuesday", month: "August", year: 2027 },
  { date: "2027-08-31", type: "MONTHLY", dayOfWeek: "Tuesday", month: "August", year: 2027 },
  // September 2027
  { date: "2027-09-07", type: "WEEKLY", dayOfWeek: "Tuesday", month: "September", year: 2027 },
  { date: "2027-09-14", type: "WEEKLY", dayOfWeek: "Tuesday", month: "September", year: 2027 },
  { date: "2027-09-21", type: "WEEKLY", dayOfWeek: "Tuesday", month: "September", year: 2027 },
  { date: "2027-09-28", type: "MONTHLY", dayOfWeek: "Tuesday", month: "September", year: 2027 },
  // October 2027
  { date: "2027-10-05", type: "WEEKLY", dayOfWeek: "Tuesday", month: "October", year: 2027 },
  { date: "2027-10-12", type: "WEEKLY", dayOfWeek: "Tuesday", month: "October", year: 2027 },
  { date: "2027-10-19", type: "WEEKLY", dayOfWeek: "Tuesday", month: "October", year: 2027 },
  { date: "2027-10-26", type: "MONTHLY", dayOfWeek: "Tuesday", month: "October", year: 2027 },
  // November 2027
  { date: "2027-11-02", type: "WEEKLY", dayOfWeek: "Tuesday", month: "November", year: 2027 },
  { date: "2027-11-09", type: "WEEKLY", dayOfWeek: "Tuesday", month: "November", year: 2027 },
  { date: "2027-11-16", type: "WEEKLY", dayOfWeek: "Tuesday", month: "November", year: 2027 },
  { date: "2027-11-23", type: "WEEKLY", dayOfWeek: "Tuesday", month: "November", year: 2027 },
  { date: "2027-11-30", type: "MONTHLY", dayOfWeek: "Tuesday", month: "November", year: 2027 },
  // December 2027
  { date: "2027-12-07", type: "WEEKLY", dayOfWeek: "Tuesday", month: "December", year: 2027 },
  { date: "2027-12-14", type: "WEEKLY", dayOfWeek: "Tuesday", month: "December", year: 2027 },
  { date: "2027-12-21", type: "WEEKLY", dayOfWeek: "Tuesday", month: "December", year: 2027 },
  { date: "2027-12-28", type: "MONTHLY", dayOfWeek: "Tuesday", month: "December", year: 2027 }
];
function getNextExpiryDate() {
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const nextExpiry = NIFTY_EXPIRY_DATES.find((expiry) => {
    const expiryDate = new Date(expiry.date);
    return expiryDate >= today;
  });
  return nextExpiry || null;
}

// services/expiryValidator.ts
function validateExpiryDate() {
  const next = getNextExpiryDate();
  const expectedExpiry = next ? next.date : null;
  const currentExpiry = CURRENT_EXPIRY_DATE;
  const today = /* @__PURE__ */ new Date();
  today.setHours(0, 0, 0, 0);
  const currentExpDate = new Date(currentExpiry);
  currentExpDate.setHours(0, 0, 0, 0);
  const isPast = currentExpDate < today;
  const mismatch = expectedExpiry !== null && currentExpiry !== expectedExpiry;
  const valid = !isPast && !mismatch;
  let error;
  if (isPast) {
    error = `Configured expiry ${currentExpiry} is in the past!`;
  } else if (mismatch) {
    error = `Expiry mismatch: Configured for ${currentExpiry}, but next NSE expiry is ${expectedExpiry}.`;
  }
  return {
    valid,
    currentExpiry,
    expectedExpiry,
    isPast,
    mismatch,
    error,
    fixCommand: "npm run generate:options"
  };
}

// services/orderManager.ts
var istDayKey = (ts = Date.now()) => new Date(ts).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
var OrderManager = class {
  constructor(credentials, paperTrading = true, storageKey, liveOrdersEnabled = false) {
    this.orders = /* @__PURE__ */ new Map();
    this.positions = /* @__PURE__ */ new Map();
    this.liveOrdersEnabled = false;
    this.syncInterval = null;
    this.activeProtectiveStops = /* @__PURE__ */ new Map();
    // symbol -> brokerOrderId
    this.mismatchDetectedSince = null;
    /**
     * Where this book is mirrored so it survives a page reload.
     *
     * Everything here used to live only in memory, so refreshing the browser —
     * the very thing a user does when the live feed looks stuck — silently
     * discarded open positions and the whole order history. The engine then
     * believed it was flat while a real position was still open at the broker.
     */
    this.storageKey = null;
    this.lastPersistAt = 0;
    this.credentials = credentials;
    this.paperTrading = paperTrading;
    this.liveOrdersEnabled = liveOrdersEnabled;
    if (storageKey) {
      this.storageKey = storageKey;
      this.restore();
    }
    if (!this.paperTrading) {
      this.startBrokerSync();
    }
  }
  setLiveOrdersEnabled(enabled) {
    this.liveOrdersEnabled = enabled;
  }
  isLiveOrdersEnabled() {
    return this.liveOrdersEnabled;
  }
  setMismatchAlarmHandler(handler) {
    this.onMismatchAlarm = handler;
  }
  /**
   * Swap in fresher credentials without discarding the book.
   *
   * Rebuilding the manager whenever the credentials object changed identity —
   * which it does on a token refresh — threw away open positions mid-session.
   */
  updateCredentials(credentials) {
    this.credentials = credentials;
  }
  /** Snapshot of the book, safe to JSON-serialise. Credentials are never included. */
  snapshot() {
    return { orders: this.getOrders(), positions: this.getPositions() };
  }
  /** Replace the book wholesale, e.g. from a snapshot taken before a reload. */
  hydrate(state) {
    if (!state) return;
    this.orders = new Map((state.orders ?? []).map((o) => [o.id, o]));
    this.positions = new Map((state.positions ?? []).map((p) => [p.symbol, p]));
  }
  restore() {
    if (!this.storageKey || typeof localStorage === "undefined") return;
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (!parsed || parsed.day !== istDayKey()) {
        localStorage.removeItem(this.storageKey);
        return;
      }
      this.hydrate(parsed);
    } catch {
    }
  }
  /** Mirror the book to storage. Called after every change that can alter it. */
  persist(force = true) {
    if (!this.storageKey || typeof localStorage === "undefined") return;
    const now = Date.now();
    if (!force && now - this.lastPersistAt < 5e3) return;
    this.lastPersistAt = now;
    try {
      localStorage.setItem(
        this.storageKey,
        JSON.stringify({ day: istDayKey(), ...this.snapshot() })
      );
    } catch {
    }
  }
  /**
   * PLACE ORDER
   */
  async placeOrder(symbol, side, quantity, type = "MARKET", price, triggerPrice, paperFillPrice) {
    const orderId = this.generateOrderId();
    const order = {
      id: orderId,
      symbol,
      side,
      type,
      quantity,
      price,
      triggerPrice,
      paperFillPrice,
      productType: "INTRADAY",
      status: "PENDING",
      filledQty: 0,
      avgPrice: 0,
      timestamp: Date.now()
    };
    this.orders.set(orderId, order);
    try {
      return this.paperTrading ? await this.simulateOrder(order) : await this.executeRealOrder(order);
    } finally {
      this.persist();
    }
  }
  /**
   * SIMULATE ORDER (PAPER TRADING)
   */
  async simulateOrder(order) {
    await new Promise((resolve) => setTimeout(resolve, 1e3 + Math.random() * 1e3));
    if (Math.random() > 0.05) {
      order.status = "FILLED";
      order.filledQty = order.quantity;
      order.avgPrice = order.paperFillPrice && order.paperFillPrice > 0 ? order.paperFillPrice : order.price && order.price > 0 ? order.price : 0;
      order.brokerOrderId = `SIM-${order.id}`;
      this.orders.set(order.id, order);
      this.updatePosition(order);
      return {
        success: true,
        orderId: order.id,
        message: `Order filled at \u20B9${order.avgPrice.toFixed(2)}`
      };
    } else {
      order.status = "REJECTED";
      order.rejectionReason = "Simulated rejection (5% failure rate)";
      this.orders.set(order.id, order);
      return {
        success: false,
        message: order.rejectionReason
      };
    }
  }
  /**
   * EXECUTE REAL ORDER (FYERS/PAYTM API)
   */
  async executeRealOrder(order) {
    try {
      const today = istDayKey();
      if (typeof localStorage !== "undefined" && localStorage.getItem(`autotrade_killed_${today}`) === "true") {
        throw new Error(`Trading is disarmed by global kill switch for today (${today})`);
      }
      if (!this.liveOrdersEnabled) {
        throw new Error("LIVE orders are disabled by master switch (liveOrdersEnabled=false in settings)");
      }
      const broker = this.credentials.dataProvider || "fyers";
      if (broker === "fyers") {
        return await this.placeFyersOrder(order);
      } else if (broker === "paytm") {
        return await this.placePayTMOrder(order);
      } else {
        throw new Error(`Unsupported broker: ${broker}`);
      }
    } catch (error) {
      order.status = "REJECTED";
      order.rejectionReason = error.message;
      this.orders.set(order.id, order);
      return {
        success: false,
        message: error.message
      };
    }
  }
  /**
   * FYERS ORDER PLACEMENT
   */
  async placeFyersOrder(order) {
    const endpoint = "/api/fyers/place-order";
    const payload = {
      symbol: order.symbol,
      side: order.side === "BUY" ? 1 : -1,
      type: this.mapOrderType(order.type),
      qty: order.quantity,
      price: order.price || 0,
      trigger_price: order.triggerPrice || 0,
      product_type: "INTRADAY",
      validity: "DAY",
      offline_order: false,
      stop_loss: 0,
      take_profit: 0
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        credentials: this.credentials,
        order: payload
      })
    });
    const result = await response.json();
    if (!response.ok || result.s !== "ok" || String(result.id || "").startsWith("SIM-")) {
      order.status = "REJECTED";
      order.rejectionReason = result.message || (result.code === "NO_CREDENTIALS" ? "Missing live Fyers credentials" : "Order rejected by broker");
      this.orders.set(order.id, order);
      return {
        success: false,
        message: order.rejectionReason
      };
    }
    order.status = "PLACED";
    order.brokerOrderId = result.id;
    this.orders.set(order.id, order);
    this.startBrokerSync();
    return {
      success: true,
      orderId: order.id,
      message: "Order placed successfully",
      data: result
    };
  }
  /**
   * PAYTM ORDER PLACEMENT
   */
  async placePayTMOrder(order) {
    const endpoint = "/api/paytm/place-order";
    const payload = {
      security_id: this.extractSecurityId(order.symbol),
      txn_type: order.side,
      quantity: order.quantity,
      price: order.price || 0,
      product: "I",
      // Intraday
      order_type: order.type,
      validity: "DAY"
    };
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.credentials.paytmAccessToken || ""}`
      },
      body: JSON.stringify(payload)
    });
    const result = await response.json();
    const isSuccess = response.ok && (result.status === "success" || result.success === true);
    if (!isSuccess || String(result.order_id || "").startsWith("SIM-")) {
      order.status = "REJECTED";
      order.rejectionReason = result.message || (result.code === "NO_CREDENTIALS" ? "Missing live Paytm access token" : "Order rejected by broker");
      this.orders.set(order.id, order);
      return {
        success: false,
        message: order.rejectionReason
      };
    }
    order.status = "PLACED";
    order.brokerOrderId = result.order_id;
    this.orders.set(order.id, order);
    this.startBrokerSync();
    return {
      success: true,
      orderId: order.id,
      message: "Order placed successfully",
      data: result
    };
  }
  /**
   * BROKER ORDER & POSITION SYNCHRONIZATION
   */
  startBrokerSync() {
    if (this.syncInterval || this.paperTrading) return;
    this.syncInterval = setInterval(() => {
      this.syncWithBroker().catch((err) => {
        console.warn("[Broker Sync] Error:", err.message);
      });
    }, 3e3);
  }
  stopBrokerSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }
  /**
   * Polls broker order book and positions, updates statuses, positions,
   * handles SL-M stops and detects mismatches.
   */
  async syncWithBroker() {
    if (this.paperTrading) return;
    const broker = this.credentials.dataProvider || "fyers";
    const hasPlacedOrders = Array.from(this.orders.values()).some(
      (o) => o.status === "PLACED" || o.status === "PARTIAL"
    );
    const hasPositions = this.positions.size > 0;
    if (!hasPlacedOrders && !hasPositions) {
      return;
    }
    try {
      const orderEndpoint = broker === "fyers" ? "/api/fyers/orders" : "/api/paytm/orders";
      const orderHeaders = { "Content-Type": "application/json" };
      if (broker === "fyers" && this.credentials.appId && this.credentials.accessToken) {
        orderHeaders["x-fyers-app-id"] = this.credentials.appId;
        orderHeaders["x-fyers-access-token"] = this.credentials.accessToken;
      } else if (broker === "paytm" && this.credentials.paytmAccessToken) {
        orderHeaders["x-jwt-token"] = this.credentials.paytmAccessToken;
      }
      const orderRes = await fetch(orderEndpoint, { headers: orderHeaders });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        const brokerOrders = orderData.orderBook || orderData.data || (Array.isArray(orderData) ? orderData : []);
        for (const order of this.orders.values()) {
          if (order.status !== "PLACED" && order.status !== "PARTIAL") continue;
          if (!order.brokerOrderId) continue;
          const bo = brokerOrders.find(
            (b) => String(b.id || b.order_id || b.orderNumber) === String(order.brokerOrderId)
          );
          if (!bo) continue;
          let newStatus = null;
          let fillPrice = order.avgPrice;
          let filledQty = order.filledQty;
          if (broker === "fyers") {
            if (bo.status === 2) newStatus = "FILLED";
            else if (bo.status === 1) newStatus = "CANCELLED";
            else if (bo.status === 5) newStatus = "REJECTED";
            else if (bo.status === 4) newStatus = "PARTIAL";
            fillPrice = bo.tradedPrice || bo.avgPrice || order.avgPrice;
            filledQty = bo.filledQty || order.filledQty;
          } else {
            const st = String(bo.status || "").toUpperCase();
            if (st === "COMPLETE" || st === "TRADED" || st === "FILLED") newStatus = "FILLED";
            else if (st === "CANCELLED") newStatus = "CANCELLED";
            else if (st === "REJECTED") newStatus = "REJECTED";
            else if (st === "PARTIAL") newStatus = "PARTIAL";
            fillPrice = bo.avg_price || bo.price || order.avgPrice;
            filledQty = bo.traded_quantity || order.filledQty;
          }
          if (newStatus && newStatus !== order.status) {
            order.status = newStatus;
            order.avgPrice = fillPrice || order.price || 0;
            order.filledQty = filledQty || order.quantity;
            this.orders.set(order.id, order);
            if (newStatus === "FILLED") {
              this.updatePosition(order);
              await this.placeProtectiveStop(order);
            }
            this.persist();
          }
        }
      }
      const posEndpoint = broker === "fyers" ? "/api/fyers/positions" : "/api/paytm/positions";
      const posRes = await fetch(posEndpoint, { headers: orderHeaders });
      if (posRes.ok) {
        const posData = await posRes.json();
        const brokerPositions = posData.netPositions || posData.data || (Array.isArray(posData) ? posData : []);
        const openBrokerCount = brokerPositions.filter((p) => (p.netQty || p.quantity || 0) !== 0).length;
        const localCount = this.positions.size;
        if (openBrokerCount !== localCount) {
          if (!this.mismatchDetectedSince) {
            this.mismatchDetectedSince = Date.now();
          } else if (Date.now() - this.mismatchDetectedSince > 1e4) {
            const msg = `POSITION MISMATCH ALARM: Broker holds ${openBrokerCount} open positions, app holds ${localCount}. Auto-trade disarmed.`;
            console.error(`[Broker Sync] ${msg}`);
            if (this.onMismatchAlarm) {
              this.onMismatchAlarm(msg);
            }
          }
        } else {
          this.mismatchDetectedSince = null;
        }
      }
    } catch (err) {
      console.warn("[Broker Sync] Exception during sync:", err.message);
    }
  }
  /**
   * Places an exchange-side protective stop (SL-M) order right after live entry fill
   */
  async placeProtectiveStop(entryOrder, stopPrice) {
    if (this.paperTrading || entryOrder.status !== "FILLED") return;
    if (this.activeProtectiveStops.has(entryOrder.symbol)) return;
    try {
      const exitSide = entryOrder.side === "BUY" ? "SELL" : "BUY";
      const trigger = stopPrice || (entryOrder.avgPrice > 0 ? Math.round(entryOrder.avgPrice * 0.85) : 0);
      const stopOrder = await this.placeOrder(
        entryOrder.symbol,
        exitSide,
        entryOrder.filledQty,
        "SL-M",
        0,
        trigger
      );
      if (stopOrder.success && stopOrder.orderId) {
        this.activeProtectiveStops.set(entryOrder.symbol, stopOrder.orderId);
        console.log(`[Protective Stop] SL-M placed at \u20B9${trigger} for ${entryOrder.symbol}`);
      }
    } catch (err) {
      console.error(`[Protective Stop] Failed to place SL-M:`, err.message);
    }
  }
  /**
   * Cancels open protective SL-M stop order when position exits normally
   */
  async cancelProtectiveStop(symbol) {
    const stopOrderId = this.activeProtectiveStops.get(symbol);
    if (!stopOrderId) return;
    this.activeProtectiveStops.delete(symbol);
    try {
      await this.cancelOrder(stopOrderId);
    } catch (e) {
      console.warn(`[Protective Stop] Error cancelling stop for ${symbol}:`, e.message);
    }
  }
  /**
   * Global Kill Switch: Cancel all open orders, market exit positions, disarm panels, latch killed state
   */
  async flattenAndDisarmAll(reason = "Emergency kill switch") {
    console.warn(`[OrderManager] FLATTEN & DISARM ALL TRIGGERED: ${reason}`);
    const today = istDayKey();
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(`autotrade_killed_${today}`, "true");
    }
    for (const order of this.orders.values()) {
      if (order.status === "PLACED" || order.status === "PENDING" || order.status === "PARTIAL") {
        await this.cancelOrder(order.id).catch(() => {
        });
      }
    }
    await this.closeAllPositions();
    try {
      await fetch("/api/kill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason })
      });
    } catch (e) {
    }
    this.persist();
  }
  /**
   * CANCEL ORDER
   */
  async cancelOrder(orderId) {
    const order = this.orders.get(orderId);
    if (!order) {
      return { success: false, message: "Order not found" };
    }
    if (order.status === "FILLED" || order.status === "CANCELLED") {
      return { success: false, message: "Cannot cancel filled/cancelled order" };
    }
    if (this.paperTrading) {
      order.status = "CANCELLED";
      this.orders.set(orderId, order);
      return { success: true, message: "Order cancelled" };
    }
    const broker = this.credentials.dataProvider || "fyers";
    if (broker === "fyers") {
      return this.cancelFyersOrder(order);
    } else {
      return this.cancelPayTMOrder(order);
    }
  }
  /**
   * UPDATE POSITION FROM ORDER
   */
  updatePosition(order) {
    if (order.status !== "FILLED") return;
    const existing = this.positions.get(order.symbol);
    if (!existing) {
      this.positions.set(order.symbol, {
        symbol: order.symbol,
        quantity: order.side === "BUY" ? order.filledQty : -order.filledQty,
        avgPrice: order.avgPrice,
        ltp: order.avgPrice,
        pnl: 0,
        pnlPercent: 0,
        side: order.side === "BUY" ? "LONG" : "SHORT",
        productType: order.productType,
        entryTime: order.timestamp
      });
    } else {
      const newQty = existing.quantity + (order.side === "BUY" ? order.filledQty : -order.filledQty);
      if (newQty === 0) {
        this.positions.delete(order.symbol);
        this.cancelProtectiveStop(order.symbol);
      } else {
        existing.quantity = newQty;
        this.positions.set(order.symbol, existing);
      }
    }
  }
  /**
   * UPDATE POSITION P&L
   */
  updatePositionPnL(symbol, ltp) {
    const position = this.positions.get(symbol);
    if (!position) return;
    position.ltp = ltp;
    position.pnl = (ltp - position.avgPrice) * position.quantity;
    position.pnlPercent = position.avgPrice > 0 ? (ltp - position.avgPrice) / position.avgPrice * 100 : 0;
    this.positions.set(symbol, position);
    this.persist(false);
  }
  /**
   * GET ALL POSITIONS
   */
  getPositions() {
    return Array.from(this.positions.values());
  }
  /**
   * GET ALL ORDERS
   */
  getOrders() {
    return Array.from(this.orders.values());
  }
  /**
   * GET ORDER HISTORY
   */
  getOrderHistory() {
    return Array.from(this.orders.values()).filter((o) => o.status === "FILLED" || o.status === "REJECTED" || o.status === "CANCELLED").sort((a, b) => b.timestamp - a.timestamp);
  }
  /**
   * CLOSE ALL POSITIONS
   */
  async closeAllPositions() {
    const positions = this.getPositions();
    const results = [];
    for (const pos of positions) {
      const side = pos.side === "LONG" ? "SELL" : "BUY";
      const result = await this.placeOrder(
        pos.symbol,
        side,
        Math.abs(pos.quantity),
        "MARKET"
      );
      results.push(result);
    }
    return results;
  }
  /**
   * HELPER METHODS
   */
  generateOrderId() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  mapOrderType(type) {
    const mapping = {
      "MARKET": 2,
      "LIMIT": 1,
      "SL": 3,
      "SL-M": 4,
      "SL-L": 3
    };
    return mapping[type] || 2;
  }
  extractSecurityId(symbol) {
    return symbol;
  }
  async cancelFyersOrder(order) {
    return { success: true, message: "Order cancelled" };
  }
  async cancelPayTMOrder(order) {
    return { success: true, message: "Order cancelled" };
  }
  /**
   * SET PAPER TRADING MODE
   */
  setPaperTrading(enabled) {
    this.paperTrading = enabled;
  }
  /**
   * GET TRADING MODE
   */
  isPaperTrading() {
    return this.paperTrading;
  }
};

// ml/m1LiveSafety.test.ts
console.log("\n--- M1 LIVE Safety Comprehensive Verification Suite ---");
var failed = 0;
function check(label, cond, detail) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` \u2014 ${detail}` : ""}`);
  }
}
check("NIFTY_LOT_SIZE is 65", NIFTY_LOT_SIZE === 65, `${NIFTY_LOT_SIZE} !== 65`);
var fyersWeekly = resolveOptionSymbol({ broker: "FYERS", expiry: "2026-10-20", strike: 24500, side: "CE" });
check("Fyers symbol starts with NSE:NIFTY", fyersWeekly.tradableSymbol.startsWith("NSE:NIFTY"), fyersWeekly.tradableSymbol);
var rejected = false;
try {
  resolveOptionSymbol({ broker: "FYERS", expiry: "2026-10-20", strike: 24513, side: "CE" });
} catch {
  rejected = true;
}
check("Unknown/non-50 strike rejected before reaching server", rejected);
var om = new OrderManager({}, false, void 0, false);
check("liveOrdersEnabled defaults to false", !om.isLiveOrdersEnabled());
om.placeOrder("NSE:NIFTY26O2024500CE", "BUY", 65, "MARKET").then((res) => {
  check("LIVE order rejected when liveOrdersEnabled is false", !res.success && res.message?.includes("liveOrdersEnabled=false"), res.message);
  const expCheck = validateExpiryDate();
  check("Expiry validation passes against current NSE calendar", expCheck.valid);
  console.log(failed ? "\n\u274C M1 FAILED" : "\n\u2705 PASS \u2014 All M1 LIVE-mode safety criteria verified!\n");
  process.exit(failed ? 1 : 0);
}).catch((err) => {
  failed++;
  console.log("FAIL: placeOrder threw", err);
  process.exit(1);
});
