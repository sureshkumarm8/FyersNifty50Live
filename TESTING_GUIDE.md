# 🧪 Testing Guide - Data Management & Pattern System

## 📋 Pre-Testing Checklist

### ✅ What's Ready to Test
1. **Enhanced Database V2**
   - 3-layer architecture (TODAY/ARCHIVES/PATTERNS)
   - Auto-migration from V1
   - All services functional

2. **Lifecycle Management**
   - Morning auto-archive
   - New day detection
   - Page refresh restoration
   - EOD auto-archive (3:45 PM)

3. **Pattern Recognition**
   - Pattern mining engine
   - Similar day finder
   - Confidence scoring

### ⏳ What's NOT Yet Integrated
- Pattern Dashboard (UI built, not wired to menu)
- AI Predictions (not built yet)

---

## 🚀 Testing Scenarios

### **TEST 1: First Launch (New Day Detection)**

**Steps:**
1. Open app at 09:00 AM
2. Open browser console (F12)
3. Look for these logs:

**Expected Console Output:**
```
🌅 New trading day detected
📦 Archiving Fri Mar 28 2026: XXX snapshots
✅ Archived Fri Mar 28 2026
✅ Today's session reset - Clean slate
✅ Morning setup complete
⏰ Auto-archive scheduled for 3:45 PM IST
```

**Expected UI:**
- Yellow notification: "🌅 Good Morning! Archived 2026-03-28 (XXX snapshots)"
- Clean historyLog (starts empty)
- Market starts monitoring

**✅ Pass Criteria:**
- Console shows morning setup
- UI shows archive notification
- No errors in console
- Fresh data starts populating

---

### **TEST 2: Same Day (Page Refresh)**

**Steps:**
1. After app has been running for 30+ minutes
2. Refresh browser (Cmd+R / F5)
3. Check console

**Expected Console Output:**
```
📂 Same trading day - Restoring session
Restored XXX snapshots
```

**Expected UI:**
- historyLog restored with all previous data
- Charts show historical data
- No "Good Morning" message
- Continues where you left off

**✅ Pass Criteria:**
- Data restored completely
- No data loss
- Charts render correctly
- Real-time updates continue

---

### **TEST 3: Data Isolation (Clean Calculations)**

**Steps:**
1. Monitor app during market hours
2. Open console and run:
```javascript
// In console
console.log('Today snapshots:', historyLog.length);

// Check if calculations use only today's data
const avgSentiment = historyLog.reduce((sum, s) => sum + s.overallSent, 0) / historyLog.length;
console.log('Avg sentiment today:', avgSentiment);
```

**✅ Pass Criteria:**
- historyLog contains only today's snapshots
- Calculations reflect today only
- No old data mixing in

---

### **TEST 4: Archive Storage**

**Steps:**
1. After 1 hour of trading, open console
2. Run manual archive test:
```javascript
// In console
import { lifecycleManager } from './services/lifecycleManager.ts';

// Check stats
lifecycleManager.getArchiveStats().then(stats => {
  console.log('Archive Stats:', stats);
});
```

**Or simpler - check IndexedDB:**
1. Open DevTools → Application → IndexedDB
2. Expand "NiftyLiveDB"
3. Check stores:
   - `today_snapshots` → Should have today's data
   - `daily_archives` → Should have past days
   - `patterns` → May be empty (patterns discovered over time)

**✅ Pass Criteria:**
- IndexedDB shows correct stores
- Data organized by date
- No duplicate entries

---

### **TEST 5: Auto-Archive (EOD)**

**Steps:**
1. Keep app open until 3:45 PM IST
2. Watch console at exactly 3:45 PM

**Expected Console Output:**
```
🕐 Auto-archive triggered at 3:45 PM
🌙 Running EOD cleanup...
✅ Archived Fri Mar 29 2026: XXX snapshots
✅ EOD cleanup complete
```

**Or Manual Test (Before 3:45 PM):**
```javascript
// In console - manually trigger
lifecycleManager.endOfDayCleanup();
```

**✅ Pass Criteria:**
- Auto-triggers at 3:45 PM
- Today's data archived
- No errors

---

### **TEST 6: Pattern Discovery**

**After 2-3 Days of Trading:**

**Steps:**
1. Open console
2. Run manual pattern scan:
```javascript
// In console
import { patternMiner } from './services/patternMiner.ts';
import { dbService } from './services/db.ts';

// Get all archives
const archives = await dbService.getAllArchives();
console.log('Total archived days:', archives.length);

// Analyze each day
for (const archive of archives) {
  const patterns = await patternMiner.analyzeDay(archive.date);
  console.log(`${archive.date}: ${patterns.length} patterns found`);
}

// Get all patterns
const allPatterns = await patternMiner.getAllPatterns();
console.log('Total patterns in library:', allPatterns.length);
console.log('Patterns:', allPatterns);
```

**✅ Pass Criteria:**
- At least 1-2 patterns discovered per day
- Patterns have reasonable confidence scores
- Pattern details look correct

---

### **TEST 7: Similar Day Finder**

**Steps:**
1. After market opens, get current snapshot
2. Run similarity check:
```javascript
// In console
const currentSnapshot = historyLog[historyLog.length - 1];
const similar = await patternMiner.findSimilarSetups(currentSnapshot, 30);

console.log('Similar days found:', similar.length);
similar.forEach(day => {
  console.log(`${day.date}: ${day.summary.close - day.summary.open} pts move`);
});
```

**✅ Pass Criteria:**
- Finds at least 1-2 similar days
- Similarity makes sense (similar opening, sentiment, PCR)
- Results ordered by similarity

---

### **TEST 8: Multi-Day Journey**

**Day 1 (Today):**
- Open app at 09:15 AM
- Let it run until 3:45 PM
- Verify auto-archive

**Day 2 (Tomorrow):**
- Open app at 09:15 AM
- Check: "Archived Day 1" message
- Verify fresh data
- Check archives: Should have Day 1 stored

**Day 3-5:**
- Repeat daily
- Pattern library should grow
- Archives should accumulate
- Similar day finder gets better

**✅ Pass Criteria:**
- Each day archives properly
- Pattern library grows
- No data loss
- System runs smoothly

---

## 🐛 Common Issues & Fixes

### Issue 1: "Database initialization failed"
**Fix:**
```javascript
// Clear IndexedDB and start fresh
indexedDB.deleteDatabase('NiftyLiveDB');
// Refresh page
```

### Issue 2: Morning setup doesn't trigger
**Fix:**
```javascript
// Manually set to yesterday's date to force new day
await dbService.setMeta('current_session_date', 'Thu Mar 28 2026');
// Refresh page
```

### Issue 3: Data not restoring on refresh
**Check:**
- Console for errors
- IndexedDB has data in `today_snapshots`
- Network tab - data fetching working

### Issue 4: Auto-archive not triggering at 3:45 PM
**Check:**
- System time is correct
- IST timezone conversion working
- Console for error messages

---

## 📊 Success Metrics to Track

### Daily Metrics
- Morning setup time: Should be <500ms
- Archive count: Should increase daily
- Pattern count: Should grow over time
- Data size: ~2MB per day

### Weekly Metrics
- Total archives: 5-7 days
- Patterns discovered: 10-20
- Similar day accuracy: Qualitative (does it make sense?)
- System stability: Zero crashes

---

## 🔍 Debug Commands

### Check Database Status
```javascript
// List all stores
const db = await indexedDB.databases();
console.log(db);

// Check specific store
const snaps = await dbService.getTodaySnapshots();
console.log('Today snapshots:', snaps.length);

const archives = await dbService.getAllArchives();
console.log('Archives:', archives.length);
```

### Force Morning Setup
```javascript
await lifecycleManager.morningSetup();
```

### Force EOD Archive
```javascript
await lifecycleManager.endOfDayCleanup();
```

### Get Archive Stats
```javascript
const stats = await lifecycleManager.getArchiveStats();
console.table(stats);
```

---

## 📝 Testing Log Template

Keep a daily log:

```markdown
## Day 1 - Mar 29, 2026
- ✅ Morning setup: 350ms, archived Mar 28 (385 snapshots)
- ✅ Monitoring: 09:15-15:30, no issues
- ✅ Page refresh at 11:30: Data restored correctly
- ✅ EOD archive: Triggered at 15:45, 387 snapshots saved
- 📊 Patterns: 2 new patterns discovered
- 🐛 Issues: None

## Day 2 - Mar 30, 2026
- ✅ Morning setup: 420ms, archived Mar 29 (387 snapshots)
- ✅ Archive count: 2 days
- ✅ Pattern library: 4 patterns total
- ✅ Similar days: Found 1 similar to today
- 🐛 Issues: None
```

---

## 🎯 When to Proceed to Next Phase

**Green Light Criteria:**
✅ System runs 3+ days without errors  
✅ Archives accumulating correctly  
✅ Pattern library has 5+ patterns  
✅ Morning setup works every day  
✅ Page refresh restores state  
✅ No performance issues  

**Once you see these ✅, we'll proceed with:**
1. Pattern Dashboard integration (15 mins)
2. AI Predictions engine (2-3 hours)
3. Full system testing (1 week)

---

## 💬 Feedback Questions

After 3 days of testing, answer these:

1. **Morning Setup:**
   - Does it detect new day correctly? Y/N
   - Archive message appears? Y/N
   - Data is fresh (no old mixing)? Y/N

2. **Pattern Discovery:**
   - How many patterns discovered? ___
   - Do they make sense? Y/N
   - Confidence scores reasonable? Y/N

3. **Similar Days:**
   - Are similar days actually similar? Y/N
   - Useful for decision making? Y/N

4. **Performance:**
   - Any slowdowns? Y/N
   - Memory issues? Y/N
   - Crashes? Y/N

5. **User Experience:**
   - Easier than manual reset? Y/N
   - Ready for AI predictions? Y/N

---

## 🏁 Next Actions

**RIGHT NOW:**
1. **Test TODAY** - Run the app during market hours
2. **Monitor console** - Watch for logs
3. **Check IndexedDB** - Verify data storage
4. **Note any issues** - Report back

**END OF DAY (3:45 PM):**
- Watch for auto-archive trigger
- Verify data saved

**TOMORROW MORNING:**
- Open app and check morning setup
- Report results

**Once testing looks good (2-3 days), we'll:**
- Integrate Pattern Dashboard into menu
- Build AI Predictions engine
- Complete Option D! 🚀

---

**Status:** Ready for testing ✅  
**Build:** Successful ✅  
**Commit:** fb241ea ✅  

Start testing and let me know how it goes! 🎯
