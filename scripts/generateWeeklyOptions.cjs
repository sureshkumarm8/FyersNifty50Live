#!/usr/bin/env node

/**
 * Generate NIFTY Weekly Options from PayTM Security Master CSV
 * 
 * Usage:
 *   node scripts/generateWeeklyOptions.cjs
 * 
 * This script:
 * 1. Reads option_security_master.csv
 * 2. Filters for next Tuesday's NIFTY weekly options
 * 3. Generates TypeScript file with security IDs
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CSV_PATH = path.join(__dirname, '../api/paytm/option_security_master.csv');
const OUTPUT_PATH = path.join(__dirname, '../constants/niftyWeeklyOptions.ts');
const STRIKE_MIN = 21000;
const STRIKE_MAX = 25000;

/**
 * Get next Tuesday date (weekly expiry)
 */
function getNextTuesday() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  
  // Calculate days until next Tuesday (2)
  let daysUntilTuesday;
  if (dayOfWeek === 2) {
    // Today is Tuesday - check if market has closed (3:30 PM = 15:30)
    const hours = today.getHours();
    const minutes = today.getMinutes();
    const timeValue = hours * 100 + minutes;
    
    if (timeValue < 1530) {
      // Before 3:30 PM - use today
      daysUntilTuesday = 0;
    } else {
      // After 3:30 PM - use next Tuesday
      daysUntilTuesday = 7;
    }
  } else if (dayOfWeek < 2) {
    // Sunday (0) or Monday (1)
    daysUntilTuesday = 2 - dayOfWeek;
  } else {
    // Wednesday (3) to Saturday (6)
    daysUntilTuesday = (9 - dayOfWeek) % 7;
  }
  
  const nextTuesday = new Date(today);
  nextTuesday.setDate(today.getDate() + daysUntilTuesday);
  
  return nextTuesday;
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse CSV and extract NIFTY weekly options
 */
function parseOptions(csvData, expiryDate) {
  const lines = csvData.split('\n');
  const options = [];
  
  console.log(`📊 Total CSV rows: ${lines.length}`);
  console.log(`🎯 Target expiry: ${expiryDate}`);
  console.log(`📏 Strike range: ${STRIKE_MIN} - ${STRIKE_MAX}`);
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cols = line.split(',');
    if (cols.length < 13) continue;
    
    const securityId = cols[0].replace(/"/g, '');
    const symbol = cols[1].replace(/"/g, '');
    const expiry = cols[11].replace(/"/g, '').split(' ')[0]; // Extract date part
    const exchange = cols[8].replace(/"/g, '');
    const strikeStr = cols[12].replace(/"/g, '');
    const strike = parseFloat(strikeStr);
    
    // Filter criteria
    const isNifty = symbol.includes('NIFTY') && !symbol.includes('BANKNIFTY') && !symbol.includes('FINNIFTY');
    const isNSE = exchange === 'NSE';
    const isTargetExpiry = expiry === expiryDate;
    const isInRange = strike >= STRIKE_MIN && strike <= STRIKE_MAX;
    
    if (isNifty && isNSE && isTargetExpiry && isInRange) {
      const type = symbol.endsWith('-CE') ? 'CE' : 'PE';
      options.push({ 
        security_id: securityId, 
        strike: strike,
        type: type 
      });
    }
  }
  
  // Sort by strike, then PE before CE
  options.sort((a, b) => {
    if (a.strike !== b.strike) return a.strike - b.strike;
    return a.type === 'PE' ? -1 : 1;
  });
  
  return options;
}

/**
 * Generate TypeScript file content
 */
function generateTypeScriptFile(options, expiryDate) {
  const now = new Date();
  const content = `
// Nifty Weekly Options - Manually curated for current week
// Expiry: ${expiryDate} (Next Tuesday)
// Range: ${STRIKE_MIN} to ${STRIKE_MAX} (ATM ± 20 strikes)

export interface NiftyOption {
  security_id: string;
  strike: number;
  type: 'CE' | 'PE';
}

export const NIFTY_WEEKLY_OPTIONS: NiftyOption[] = ${JSON.stringify(options, null, 2)};

// Get security IDs for current week (all ${options.length} contracts)
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
`;
  
  return content.trim() + '\n';
}

/**
 * Main execution
 */
function main() {
  console.log('\n🚀 NIFTY Weekly Options Generator\n');
  
  // Check if CSV exists
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_PATH}`);
    console.log('\n💡 Download it from:');
    console.log('   https://developer.paytmmoney.com/data/v1/scrips/option_security_master.csv');
    process.exit(1);
  }
  
  // Read CSV
  console.log('📂 Reading CSV file...');
  const csvData = fs.readFileSync(CSV_PATH, 'utf-8');
  
  // Calculate expiry date
  const nextTuesday = getNextTuesday();
  const expiryDate = formatDate(nextTuesday);
  
  // Parse options
  console.log('\n⚙️  Parsing options...');
  const options = parseOptions(csvData, expiryDate);
  
  if (options.length === 0) {
    console.error(`\n❌ No options found for expiry: ${expiryDate}`);
    console.log('\n💡 Possible reasons:');
    console.log('   - CSV file is outdated');
    console.log('   - Expiry date calculation is wrong');
    console.log('   - PayTM hasn\'t released new contracts yet');
    process.exit(1);
  }
  
  console.log(`\n✅ Found ${options.length} contracts`);
  console.log(`   - CE options: ${options.filter(o => o.type === 'CE').length}`);
  console.log(`   - PE options: ${options.filter(o => o.type === 'PE').length}`);
  console.log(`   - Strike range: ${options[0].strike} to ${options[options.length - 1].strike}`);
  
  // Generate TypeScript file
  console.log('\n📝 Generating TypeScript file...');
  const tsContent = generateTypeScriptFile(options, expiryDate);
  fs.writeFileSync(OUTPUT_PATH, tsContent);
  
  console.log(`✅ Generated: ${OUTPUT_PATH}`);
  console.log('\n🎉 Done!\n');
}

// Run
main();
