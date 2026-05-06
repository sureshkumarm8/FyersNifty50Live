/**
 * Auto-Update Weekly Options Utility
 * 
 * Automatically checks and updates Nifty weekly options when expiry passes
 */

import { CURRENT_EXPIRY_DATE } from '../constants/niftyWeeklyOptions';

interface UpdateCheckResult {
  needsUpdate: boolean;
  currentExpiry: string;
  daysUntilExpiry: number;
  message: string;
}

/**
 * Check if current week's options have expired
 */
export function checkOptionsExpiry(): UpdateCheckResult {
  const expiryDate = new Date(CURRENT_EXPIRY_DATE);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);
  
  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const needsUpdate = expiryDate < today;
  
  let message = '';
  if (needsUpdate) {
    message = `⚠️ Options expired on ${CURRENT_EXPIRY_DATE}. Please update!`;
  } else if (daysUntilExpiry <= 1) {
    message = `🔔 Options expire ${daysUntilExpiry === 0 ? 'today' : 'tomorrow'}`;
  } else if (daysUntilExpiry <= 3) {
    message = `ℹ️ Options expire in ${daysUntilExpiry} days`;
  } else {
    message = `✅ Options valid until ${CURRENT_EXPIRY_DATE}`;
  }
  
  return {
    needsUpdate,
    currentExpiry: CURRENT_EXPIRY_DATE,
    daysUntilExpiry,
    message
  };
}

/**
 * Trigger automatic update via API
 */
export async function triggerOptionsUpdate(): Promise<{success: boolean; message: string; newExpiry?: string}> {
  try {
    console.log('[Options Update] Triggering automatic update...');
    
    const response = await fetch('/api/auto-update-options', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Update API returned ${response.status}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.updated) {
      console.log(`[Options Update] ✅ Updated to expiry: ${result.newExpiry}`);
      return {
        success: true,
        message: `Updated to ${result.newExpiry} (${result.optionsCount} contracts)`,
        newExpiry: result.newExpiry
      };
    } else if (result.success && !result.needsUpdate) {
      return {
        success: true,
        message: 'Options are already up-to-date'
      };
    } else {
      throw new Error(result.error || 'Update failed');
    }
    
  } catch (error: any) {
    console.error('[Options Update] ❌ Failed:', error);
    return {
      success: false,
      message: `Failed to update: ${error.message}`
    };
  }
}

/**
 * Check and auto-update if needed (call on app startup)
 */
export async function autoCheckAndUpdate(): Promise<void> {
  const check = checkOptionsExpiry();
  
  console.log('[Options Update]', check.message);
  
  if (check.needsUpdate) {
    console.log('[Options Update] 🔄 Attempting automatic update...');
    
    // Show notification to user
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Options Update Required', {
        body: check.message,
        icon: '/favicon.ico'
      });
    }
    
    // Note: Automatic update requires rebuild and redeploy
    // For now, we just notify the user
    console.warn('[Options Update] ⚠️ Manual rebuild required after update');
    console.warn('[Options Update] Run: node scripts/generateWeeklyOptions.cjs && npm run build');
  } else if (check.daysUntilExpiry <= 2) {
    console.warn('[Options Update]', check.message);
  }
}

/**
 * Get formatted expiry info for display
 */
export function getExpiryInfo() {
  const check = checkOptionsExpiry();
  
  return {
    date: CURRENT_EXPIRY_DATE,
    formatted: new Date(CURRENT_EXPIRY_DATE).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }),
    daysRemaining: check.daysUntilExpiry,
    status: check.needsUpdate ? 'expired' : check.daysUntilExpiry <= 1 ? 'expiring-soon' : 'active',
    message: check.message
  };
}
