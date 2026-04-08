/**
 * NIFTY 50 Weekly Expiry Calendar (2026-2027)
 * 
 * Rules:
 * - Weekly expiries are every Tuesday (changed from Thursday in Sep 2025)
 * - Monthly expiry is the LAST Tuesday of the month
 * - If Tuesday is a holiday, expiry moves to the PREVIOUS trading day (Monday)
 * 
 * Holiday Adjustments Applied for 2026:
 * - Mar 02 (Mon) - Moved from Mar 03 (Holi)
 * - Mar 30 (Mon) - Moved from Mar 31 (Mahavir Jayanti)
 * - Apr 13 (Mon) - Moved from Apr 14 (Ambedkar Jayanti)
 * - Oct 19 (Mon) - Moved from Oct 20 (Dussehra)
 * - Nov 09 (Mon) - Moved from Nov 10 (Diwali-Balipratipada)
 * - Nov 23 (Mon) - Moved from Nov 24 (Guru Nanak Jayanti)
 * 
 * 2027 Adjustments:
 * - Jan 25 (Mon) - Moved from Jan 26 (Republic Day)
 * 
 * Source: NSE Official Calendar + Market Holidays 2026
 * Last Updated: April 2026
 */

export interface NiftyExpiry {
  date: string;        // YYYY-MM-DD format
  type: 'WEEKLY' | 'MONTHLY';
  dayOfWeek: string;   // Usually "Tuesday", but can be "Monday" if Tuesday is holiday
  month: string;       // Full month name
  year: number;
}

export const NIFTY_EXPIRY_DATES: NiftyExpiry[] = [
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
  { date: "2027-12-28", type: "MONTHLY", dayOfWeek: "Tuesday", month: "December", year: 2027 },
];

/**
 * Get the next valid expiry date from today
 */
export function getNextExpiryDate(): NiftyExpiry | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const nextExpiry = NIFTY_EXPIRY_DATES.find(expiry => {
    const expiryDate = new Date(expiry.date);
    return expiryDate >= today;
  });
  
  return nextExpiry || null;
}

/**
 * Get all expiry dates for a specific month/year
 */
export function getExpiryDatesForMonth(month: string, year: number): NiftyExpiry[] {
  return NIFTY_EXPIRY_DATES.filter(
    expiry => expiry.month === month && expiry.year === year
  );
}

/**
 * Get the next N expiry dates from today
 */
export function getNextNExpiries(count: number = 4): NiftyExpiry[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return NIFTY_EXPIRY_DATES
    .filter(expiry => new Date(expiry.date) >= today)
    .slice(0, count);
}

/**
 * Check if a given date is an expiry date
 */
export function isExpiryDate(dateStr: string): boolean {
  return NIFTY_EXPIRY_DATES.some(expiry => expiry.date === dateStr);
}

/**
 * Get formatted expiry date string (e.g., "31-MAR-2026")
 */
export function getFormattedExpiryDate(expiry: NiftyExpiry): string {
  const date = new Date(expiry.date);
  const day = date.getDate().toString().padStart(2, '0');
  const monthShort = expiry.month.substring(0, 3).toUpperCase();
  return `${day}-${monthShort}-${expiry.year}`;
}
