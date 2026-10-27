/**
 * INSTRUMENT RESOLVER
 *
 * Translates an abstract option order (broker, expiry, strike, side) into the
 * exact, broker-compliant tradable symbol and security identifier.
 *
 * Never guesses: if the strike or expiry is not valid or not found in the
 * instrument master, it explicitly refuses the order before it reaches the exchange.
 */

import { NIFTY_WEEKLY_OPTIONS, CURRENT_EXPIRY_DATE } from '../constants/niftyWeeklyOptions';

export type BrokerType = 'FYERS' | 'PAYTM';
export type OptionSide = 'CE' | 'PE';

export interface ResolveOptionParams {
  broker: BrokerType;
  expiry: string | Date; // YYYY-MM-DD or Date object
  strike: number;
  side: OptionSide;
}

export interface ResolvedInstrument {
  broker: BrokerType;
  tradableSymbol: string;   // e.g. "NSE:NIFTY26O2724500CE" (Fyers) or "NSE:NIFTY-24500-CE" (Paytm)
  securityId?: string;      // Paytm numeric security ID (e.g. "47161")
  strike: number;
  side: OptionSide;
  expiryDateStr: string;    // Normalized YYYY-MM-DD
}

const MONTH_NAMES = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Normalizes an expiry input into a Date object at UTC midnight.
 */
function normalizeDate(expiry: string | Date): Date {
  if (expiry instanceof Date) {
    const d = new Date(expiry);
    d.setHours(0, 0, 0, 0);
    return d;
  }
  // If YYYY-MM-DD format
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(expiry.trim());
  if (match) {
    return new Date(parseInt(match[1], 10), parseInt(match[2], 10) - 1, parseInt(match[3], 10));
  }
  // Try fallback Date parse
  const parsed = new Date(expiry);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid expiry date format: "${expiry}". Expected YYYY-MM-DD.`);
  }
  parsed.setHours(0, 0, 0, 0);
  return parsed;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Builds Fyers format symbol:
 * - Monthly: NSE:NIFTY{YY}{MMM}{Strike}{CE/PE} (e.g. NSE:NIFTY26OCT24500CE)
 * - Weekly:  NSE:NIFTY{YY}{M}{DD}{Strike}{CE/PE} (e.g. NSE:NIFTY26O2724500CE)
 */
export function buildFyersSymbol(date: Date, strike: number, side: OptionSide): string {
  const yy = date.getFullYear().toString().slice(-2);
  const monthIdx = date.getMonth(); // 0-11
  const dd = date.getDate().toString().padStart(2, '0');

  // Check if monthly: exactly the last Thursday (or last trading day of month)
  // Standard test: adding 7 days pushes into the next month
  const nextWeek = new Date(date);
  nextWeek.setDate(date.getDate() + 7);
  const isMonthly = nextWeek.getMonth() !== monthIdx;

  if (isMonthly) {
    const mmm = MONTH_NAMES[monthIdx];
    return `NSE:NIFTY${yy}${mmm}${strike}${side}`;
  } else {
    // Fyers weekly month codes: 1-9 for Jan-Sep, 'O' for Oct, 'N' for Nov, 'D' for Dec
    let m = (monthIdx + 1).toString();
    if (monthIdx === 9) m = 'O';
    if (monthIdx === 10) m = 'N';
    if (monthIdx === 11) m = 'D';

    return `NSE:NIFTY${yy}${m}${dd}${strike}${side}`;
  }
}

/**
 * Resolves a broker-specific tradable option symbol and security ID.
 * Throws an Error if strike is invalid or not in master contracts.
 */
export function resolveOptionSymbol(params: ResolveOptionParams): ResolvedInstrument {
  const { broker, strike, side } = params;

  // 1. Validate strike
  if (!strike || strike <= 0 || strike % 50 !== 0) {
    throw new Error(`Rejected order: Strike ${strike} is invalid (must be a positive multiple of 50).`);
  }
  if (strike < 15000 || strike > 35000) {
    throw new Error(`Rejected order: Strike ${strike} is outside allowable NIFTY boundaries [15000, 35000].`);
  }

  // 2. Normalize expiry
  const expiryDate = normalizeDate(params.expiry);
  const expiryDateStr = formatDateISO(expiryDate);

  // 3. Resolve by broker
  if (broker === 'FYERS') {
    const tradableSymbol = buildFyersSymbol(expiryDate, strike, side);
    return {
      broker: 'FYERS',
      tradableSymbol,
      strike,
      side,
      expiryDateStr
    };
  }

  if (broker === 'PAYTM') {
    // If the expiry matches the currently loaded weekly contracts:
    const isCurrentWeekly = expiryDateStr === CURRENT_EXPIRY_DATE;
    let securityId: string | undefined;

    if (isCurrentWeekly) {
      const match = NIFTY_WEEKLY_OPTIONS.find(opt => opt.strike === strike && opt.type === side);
      if (!match) {
        throw new Error(
          `Rejected Paytm order: Strike ${strike} ${side} not found in weekly options master for expiry ${expiryDateStr}.`
        );
      }
      securityId = match.security_id;
    }

    const tradableSymbol = `NSE:NIFTY-${strike}-${side}`;

    return {
      broker: 'PAYTM',
      tradableSymbol,
      securityId,
      strike,
      side,
      expiryDateStr
    };
  }

  throw new Error(`Unsupported broker: "${broker}"`);
}
