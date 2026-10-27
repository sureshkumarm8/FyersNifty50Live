/**
 * EXPIRY VALIDATOR
 *
 * Ensures that the system's compiled weekly option contracts (CURRENT_EXPIRY_DATE)
 * strictly match the actual next upcoming NSE expiry calendar.
 *
 * Prevents silent drift where the system continues polling or trading expired strikes.
 */

import { CURRENT_EXPIRY_DATE } from '../constants/niftyWeeklyOptions';
import { getNextExpiryDate } from '../constants/niftyExpiryDates';

export interface ExpiryValidationResult {
  valid: boolean;
  currentExpiry: string;
  expectedExpiry: string | null;
  isPast: boolean;
  mismatch: boolean;
  error?: string;
  fixCommand: string;
}

export function validateExpiryDate(): ExpiryValidationResult {
  const next = getNextExpiryDate();
  const expectedExpiry = next ? next.date : null;
  const currentExpiry = CURRENT_EXPIRY_DATE;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentExpDate = new Date(currentExpiry);
  currentExpDate.setHours(0, 0, 0, 0);

  const isPast = currentExpDate < today;
  const mismatch = expectedExpiry !== null && currentExpiry !== expectedExpiry;
  const valid = !isPast && !mismatch;

  let error: string | undefined;
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
    fixCommand: 'npm run generate:options'
  };
}

export function assertExpiryValidOrThrow(): void {
  const check = validateExpiryDate();
  if (!check.valid) {
    throw new Error(`[EXPIRY_VALIDATION_ERROR] ${check.error} Run '${check.fixCommand}' to refresh.`);
  }
}
