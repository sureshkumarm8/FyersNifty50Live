// constants/niftyWeeklyOptions.ts
var CURRENT_EXPIRY_DATE = "2026-10-27";

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
  const next2 = getNextExpiryDate();
  const expectedExpiry = next2 ? next2.date : null;
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

// ml/expiryValidator.test.ts
console.log("\n--- Expiry Validator Verification Suite ---");
var failed = 0;
function check(label, cond, detail) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` \u2014 ${detail}` : ""}`);
  }
}
var result = validateExpiryDate();
var next = getNextExpiryDate();
console.log(`Current compiled expiry: ${CURRENT_EXPIRY_DATE}`);
console.log(`Next calendar expiry:    ${next?.date}`);
console.log(`Validation result:`, result);
check("Next expiry date is found in calendar", next !== null);
check("Current expiry matches next expiry", result.currentExpiry === next?.date, `${result.currentExpiry} !== ${next?.date}`);
check("Current expiry is not in the past", !result.isPast);
check("Expiry is marked valid", result.valid);
check("Fix command is npm run generate:options", result.fixCommand === "npm run generate:options");
console.log(failed ? "\n\u274C FAILED" : "\n\u2705 PASS \u2014 Expiry Validator correctly tracks NSE calendar\n");
process.exit(failed ? 1 : 0);
