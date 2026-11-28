/**
 * Market Time Utilities
 * Helper functions for IST market hours and scheduling
 */

export interface MarketTimeInfo {
  istDate: Date;
  hour: number;
  min: number;
  timeVal: number;
  isBeforeMarketStart: boolean;
  delayUntil917: number;
  /**
   * Before 09:00 IST, when the live feed starts (pre-open). refreshData() accepts
   * data from 09:00, so the refresh heartbeat must start then too; starting it at
   * 09:17 left only the 60s watchdog fetching from 09:00 to 09:17 (2026-11-27).
   */
  isBeforeDataStart: boolean;
  delayUntilDataStart: number;
  isWeekday: boolean;
  isMarketHours: boolean;
}

/**
 * Get current IST time and market status
 */
export function getMarketTimeInfo(now: Date = new Date()): MarketTimeInfo {
  const istString = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  
  const day = istDate.getDay();
  const hour = istDate.getHours();
  const min = istDate.getMinutes();
  const timeVal = hour * 100 + min;
  
  const isWeekday = day >= 1 && day <= 5;
  const isMarketHours = timeVal >= 915 && timeVal <= 1530;
  const isBeforeMarketStart = timeVal < 917;
  
  // Calculate delay until 9:17 AM IST
  let delayUntil917 = 0;
  if (isBeforeMarketStart) {
    const targetTime = new Date(istDate);
    targetTime.setHours(9, 17, 0, 0);
    delayUntil917 = targetTime.getTime() - istDate.getTime();
  }
  
  const isBeforeDataStart = timeVal < 900;
  let delayUntilDataStart = 0;
  if (isBeforeDataStart) {
    const targetTime = new Date(istDate);
    targetTime.setHours(9, 0, 0, 0);
    delayUntilDataStart = targetTime.getTime() - istDate.getTime();
  }

  return {
    istDate,
    hour,
    min,
    timeVal,
    isBeforeMarketStart,
    delayUntil917,
    isBeforeDataStart,
    delayUntilDataStart,
    isWeekday,
    isMarketHours
  };
}

/**
 * Format delay in minutes and seconds
 */
export function formatDelay(delayMs: number): string {
  const totalSeconds = Math.floor(delayMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

/**
 * Get human-readable market status message
 */
export function getMarketStatusMessage(info: MarketTimeInfo): string {
  if (!info.isWeekday) {
    return "Market Closed (Weekend)";
  }
  
  if (info.isBeforeMarketStart) {
    return `Market opens at 9:15 AM IST`;
  }
  
  if (!info.isMarketHours) {
    return "Market Closed (9:15 AM - 3:30 PM IST)";
  }
  
  return "Market Open";
}
