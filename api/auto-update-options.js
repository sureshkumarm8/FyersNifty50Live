// API endpoint to automatically update weekly options
// Can be called by cron-job.org every Monday morning

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  const startTime = Date.now();
  
  // Optional: Security check with secret
  const updateSecret = process.env.OPTIONS_UPDATE_SECRET;
  const authHeader = req.headers.authorization;
  
  if (updateSecret && authHeader !== `Bearer ${updateSecret}`) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized' 
    });
  }

  try {
    console.log('[Auto-Update] Checking if weekly options need update...');
    
    // Read current expiry from constants file
    const constantsPath = path.join(process.cwd(), 'constants/niftyWeeklyOptions.ts');
    const constantsContent = await fs.readFile(constantsPath, 'utf-8');
    const expiryMatch = constantsContent.match(/CURRENT_EXPIRY_DATE = '(\d{4}-\d{2}-\d{2})'/);
    
    if (!expiryMatch) {
      throw new Error('Could not parse current expiry date');
    }
    
    const currentExpiry = expiryMatch[1];
    const currentExpiryDate = new Date(currentExpiry);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    console.log(`[Auto-Update] Current expiry: ${currentExpiry}`);
    console.log(`[Auto-Update] Today: ${today.toISOString().split('T')[0]}`);
    
    // Check if current expiry has passed
    if (currentExpiryDate >= today) {
      return res.status(200).json({
        success: true,
        message: 'Options are up-to-date',
        currentExpiry,
        needsUpdate: false,
        duration: Date.now() - startTime
      });
    }
    
    console.log('[Auto-Update] ⚠️  Expiry has passed, updating options...');
    
    // Run the generation script
    const scriptPath = path.join(process.cwd(), 'scripts/generateWeeklyOptions.cjs');
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`);
    
    console.log('[Auto-Update] Script output:', stdout);
    if (stderr) {
      console.warn('[Auto-Update] Script warnings:', stderr);
    }
    
    // Read the updated expiry
    const updatedContent = await fs.readFile(constantsPath, 'utf-8');
    const updatedExpiryMatch = updatedContent.match(/CURRENT_EXPIRY_DATE = '(\d{4}-\d{2}-\d{2})'/);
    const newExpiry = updatedExpiryMatch ? updatedExpiryMatch[1] : null;
    
    // Count options
    const optionsMatch = updatedContent.match(/NIFTY_WEEKLY_OPTIONS: NiftyOption\[\] = \[([\s\S]*?)\];/);
    const optionsCount = optionsMatch ? (optionsMatch[1].match(/security_id/g) || []).length : 0;
    
    console.log('[Auto-Update] ✅ Options updated successfully');
    console.log(`[Auto-Update] New expiry: ${newExpiry}`);
    console.log(`[Auto-Update] Options count: ${optionsCount}`);
    
    return res.status(200).json({
      success: true,
      message: 'Options updated successfully',
      oldExpiry: currentExpiry,
      newExpiry,
      optionsCount,
      needsUpdate: true,
      updated: true,
      duration: Date.now() - startTime
    });
    
  } catch (error) {
    console.error('[Auto-Update] ❌ Error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message,
      duration: Date.now() - startTime
    });
  }
}
