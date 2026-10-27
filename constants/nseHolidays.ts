/**
 * NSE TRADING HOLIDAYS (2026 Calendar)
 * List of recognized trading holidays where cash & F&O markets are closed.
 */

export const NSE_HOLIDAYS_2026: string[] = [
  '2026-01-26', // Republic Day
  '2026-02-17', // Mahashivratri
  '2026-03-04', // Holi
  '2026-03-20', // Id-Ul-Fitr (Ramzan Id)
  '2026-04-03', // Good Friday
  '2026-04-14', // Dr. Baba Saheb Ambedkar Jayanti
  '2026-05-01', // Maharashtra Day
  '2026-05-27', // Bakri Id
  '2026-06-25', // Muharram
  '2026-08-15', // Independence Day
  '2026-10-02', // Mahatma Gandhi Jayanti
  '2026-10-20', // Dussehra
  '2026-11-08', // Diwali-Laxmi Pujan (Muhurat Trading only)
  '2026-11-10', // Diwali Balipratipada
  '2026-11-24', // Gurunanak Jayanti
  '2026-12-25'  // Christmas
];

export const NSE_HOLIDAYS_SET = new Set(NSE_HOLIDAYS_2026);

export function isNseHoliday(dateStr: string): boolean {
  return NSE_HOLIDAYS_SET.has(dateStr);
}

export function isTradingDay(date: Date = new Date()): boolean {
  // Convert to IST date string
  const istDateStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date);
  
  // Format day of week in IST
  const istDayOfWeek = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' }).format(date);
  
  // Weekend check
  if (istDayOfWeek === 'Sat' || istDayOfWeek === 'Sun') {
    return false;
  }
  
  // Holiday check
  return !isNseHoliday(istDateStr);
}
