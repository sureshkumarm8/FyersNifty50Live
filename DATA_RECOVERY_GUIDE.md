# 🔧 Data Recovery Guide

## Issue
Your 15+ days of archived data was lost after recent database structure changes. The data may still exist in:
1. Old IndexedDB stores
2. Browser backup/cache
3. Redis/Upstash (if cron was running)

## Recovery Methods

### Method 1: Check Browser DevTools (Quickest)

1. **Open your app** in the browser
2. **Press F12** to open DevTools
3. **Go to Application tab** → Storage → IndexedDB → NiftyLiveDB
4. **Check these stores:**
   - `daily_archives` - Should have your data
   - `today_snapshots` - May have unmigrated data
   - `snapshots` (old) - May still exist from V1

5. **If you see data in `today_snapshots`:**
   - Click the "Migrate Historical Data" button in Pattern Dashboard → Archives tab
   - This will convert all snapshots to daily archives

### Method 2: Browser Console Recovery Script

**If Method 1 shows old data, run this script:**

```javascript
// Paste this in browser console (F12 → Console tab)
(async function recoverData() {
  console.log('🔄 Starting data recovery...');
  
  const request = indexedDB.open('NiftyLiveDB', 2);
  
  request.onsuccess = async (event) => {
    const db = event.target.result;
    console.log('Available stores:', Array.from(db.objectStoreNames));
    
    // Check today_snapshots
    const tx = db.transaction(['today_snapshots'], 'readonly');
    const store = tx.objectStore('today_snapshots');
    const getAllReq = store.getAll();
    
    getAllReq.onsuccess = async () => {
      const snapshots = getAllReq.result;
      console.log(`Found ${snapshots.length} snapshots`);
      
      if (snapshots.length === 0) {
        console.log('❌ No snapshots found to recover');
        return;
      }
      
      // Group by date
      const byDate = {};
      snapshots.forEach(s => {
        const date = new Date(s.timestamp).toDateString();
        if (!byDate[date]) byDate[date] = [];
        byDate[date].push(s);
      });
      
      console.log(`📅 Found ${Object.keys(byDate).length} days of data`);
      Object.keys(byDate).sort().forEach(date => {
        console.log(`  ${date}: ${byDate[date].length} snapshots`);
      });
      
      // Now trigger migration
      console.log('\n💡 To migrate this data, go to:');
      console.log('   Pattern Dashboard → Archives tab → Click "Migrate Historical Data"');
    };
  };
})();
```

### Method 3: Recover from Redis

**If data was synced to Redis:**

```javascript
// Run in browser console
(async function restoreFromRedis() {
  console.log('🔄 Fetching from Redis...');
  
  const response = await fetch('/api/get-history?limit=10000');
  const result = await response.json();
  
  if (!result.success || !result.data) {
    console.error('❌ No data in Redis');
    return;
  }
  
  console.log(`📊 Found ${result.data.length} snapshots in Redis`);
  
  // Group by date
  const byDate = {};
  result.data.forEach(s => {
    const date = new Date(s.timestamp).toDateString();
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(s);
  });
  
  console.log(`📅 ${Object.keys(byDate).length} days available`);
  
  // Restore to IndexedDB
  const dbRequest = indexedDB.open('NiftyLiveDB', 2);
  dbRequest.onsuccess = async (event) => {
    const db = event.target.result;
    let restored = 0;
    
    for (const [date, snapshots] of Object.entries(byDate)) {
      snapshots.sort((a, b) => a.timestamp - b.timestamp);
      
      const archive = {
        date: date,
        snapshots: snapshots,
        summary: {
          open: snapshots[0].niftyLtp,
          close: snapshots[snapshots.length - 1].niftyLtp,
          high: Math.max(...snapshots.map(s => s.niftyLtp)),
          low: Math.min(...snapshots.map(s => s.niftyLtp)),
          dominantSentiment: snapshots.reduce((sum, s) => sum + s.overallSent, 0) / snapshots.length,
          avgPCR: 0,
          topPerformer: '',
          worstPerformer: '',
          range: Math.max(...snapshots.map(s => s.niftyLtp)) - Math.min(...snapshots.map(s => s.niftyLtp)),
          volatility: ((Math.max(...snapshots.map(s => s.niftyLtp)) - Math.min(...snapshots.map(s => s.niftyLtp))) / snapshots[0].niftyLtp) * 100
        },
        metadata: {
          totalTrades: 0,
          pnl: 0,
          winRate: 0,
          patterns: []
        }
      };
      
      const tx = db.transaction(['daily_archives'], 'readwrite');
      tx.objectStore('daily_archives').put(archive);
      await new Promise(resolve => { tx.oncomplete = resolve; });
      
      restored++;
      console.log(`✅ Restored ${date}`);
    }
    
    console.log(`\n✅ Restored ${restored} days! Reload the app.`);
    alert(`Success! Restored ${restored} days. Reload now.`);
  };
})();
```

### Method 4: Browser Backup (Chrome)

**If Chrome has a backup:**

1. Close Chrome completely
2. Navigate to Chrome profile folder:
   - **Mac**: `~/Library/Application Support/Google/Chrome/Default`
   - **Windows**: `%LOCALAPPDATA%\Google\Chrome\User Data\Default`
   - **Linux**: `~/.config/google-chrome/Default`

3. Look for IndexedDB folders:
   - Find `IndexedDB` folder
   - Look for `http_localhost_5173.indexeddb.leveldb` or similar

4. **If you have a Time Machine/backup:**
   - Restore the IndexedDB folder from before the data loss
   - Restart Chrome

## Prevention

To avoid future data loss:

### 1. Enable Daily CSV Exports
The app automatically saves CSVs at market close. Check your Downloads folder for:
- `nifty50_sentiment_YYYY-MM-DD.csv`

### 2. Enable Redis Sync
If using Vercel deployment, data is also backed up to Redis/Upstash.

### 3. Manual Export
In Pattern Dashboard → Archives tab:
- Click any day → Click "Export CSV"
- Save important days manually

## Next Steps

1. **Try Method 1** first (check DevTools)
2. **If data exists**, click "Migrate Historical Data" button
3. **If no data**, try Method 3 (Redis recovery)
4. **If all fails**, data is permanently lost

## Need Help?

Run this diagnostic in console:

```javascript
// Quick diagnostic
(function() {
  const req = indexedDB.open('NiftyLiveDB', 2);
  req.onsuccess = (e) => {
    const db = e.target.result;
    console.log('=== DATABASE STATUS ===');
    console.log('Stores:', Array.from(db.objectStoreNames));
    
    ['daily_archives', 'today_snapshots', 'today_session'].forEach(storeName => {
      if (db.objectStoreNames.contains(storeName)) {
        const tx = db.transaction([storeName], 'readonly');
        const req = tx.objectStore(storeName).count();
        req.onsuccess = () => console.log(`${storeName}: ${req.result} records`);
      }
    });
  };
})();
```

---

**🔥 Most likely solution:** Your data is in `today_snapshots` store and just needs to be migrated to `daily_archives`. Use the migration button in the app!
