// services/storageScopes.ts
var DURABLE_STORAGE_KEYS = /* @__PURE__ */ new Set([
  "fyers_creds",
  "momentum_settings",
  "sniper_lots",
  "sniper_sound",
  "sniper_autostart",
  "sniper_auto_paper",
  "sniper_auto_live",
  "sniper_interval",
  "autotrade_mode",
  "autotrade_tab",
  "paytm_symbol_mapping",
  "admin_secret",
  "user_trading_protocol",
  "terminal_sound_enabled",
  "vision.archive.autoSync",
  "vision.archive.syncMinutes",
  "trading_day"
]);
var DAY_SCOPED_KEY_PREFIXES = [
  "sniper_range_",
  "autotrade_killed_",
  "sentiment_history_",
  "ai_view_"
];
var DAY_SCOPED_STORAGE_KEYS = /* @__PURE__ */ new Set([
  "sniper_day_state",
  "sniper_armed",
  "sniper_log",
  "sniper_history",
  "sniper_analysis",
  "sniper_is_looping",
  "sniper_orderbook",
  "momentum_session",
  "momentum_orderbook",
  "paper_trading_book_v1",
  "opening_pilot_book_v1",
  "session_baseline",
  "session_data",
  "session_start",
  "preMarketData"
]);
function isDurableKey(key) {
  return DURABLE_STORAGE_KEYS.has(key);
}
function isDayScopedKey(key) {
  if (DAY_SCOPED_STORAGE_KEYS.has(key)) return true;
  return DAY_SCOPED_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

// services/db.ts
var DB_NAME = "NiftyLiveDB";
var DB_VERSION = 3;
var STORES = {
  // Layer 1: TODAY (Temporary, cleared daily)
  TODAY_SNAPSHOTS: "today_snapshots",
  TODAY_SESSION: "today_session",
  // Layer 2: ARCHIVES (Permanent, multi-day)
  DAILY_ARCHIVES: "daily_archives",
  // Layer 3: PATTERNS (Learned knowledge)
  PATTERNS: "patterns",
  // Layer 4: every agent call ever made, with its graded outcome
  AGENT_CALLS: "agent_calls",
  // Metadata
  META: "meta"
};
var dbInstance = null;
var openDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      const oldVersion = event.oldVersion;
      console.log(`\u{1F504} Upgrading DB from v${oldVersion} to v${DB_VERSION}`);
      if (oldVersion < 2) {
        if (db.objectStoreNames.contains("snapshots")) {
          db.deleteObjectStore("snapshots");
        }
        if (db.objectStoreNames.contains("session_data")) {
          db.deleteObjectStore("session_data");
        }
        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META);
        }
      }
      if (!db.objectStoreNames.contains(STORES.TODAY_SNAPSHOTS)) {
        db.createObjectStore(STORES.TODAY_SNAPSHOTS, { keyPath: "timestamp" });
      }
      if (!db.objectStoreNames.contains(STORES.TODAY_SESSION)) {
        db.createObjectStore(STORES.TODAY_SESSION);
      }
      if (!db.objectStoreNames.contains(STORES.DAILY_ARCHIVES)) {
        const archiveStore = db.createObjectStore(STORES.DAILY_ARCHIVES, { keyPath: "date" });
        archiveStore.createIndex("dateIndex", "date", { unique: true });
      }
      if (!db.objectStoreNames.contains(STORES.PATTERNS)) {
        const patternStore = db.createObjectStore(STORES.PATTERNS, { keyPath: "id" });
        patternStore.createIndex("confidence", "confidence");
        patternStore.createIndex("name", "name");
      }
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META);
      }
      if (!db.objectStoreNames.contains(STORES.AGENT_CALLS)) {
        const callStore = db.createObjectStore(STORES.AGENT_CALLS, { keyPath: "id" });
        callStore.createIndex("agent", "agent");
        callStore.createIndex("timestamp", "timestamp");
        callStore.createIndex("graded", "graded");
      }
      console.log("\u2705 DB Upgrade Complete");
    };
    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
};
var dbService = {
  // === Initialization ===
  init: async () => {
    await openDB();
  },
  // === TODAY Operations (Layer 1: Live Session) ===
  saveTodaySnapshot: async (snapshot) => {
    const db = await openDB();
    const tx = db.transaction(STORES.TODAY_SNAPSHOTS, "readwrite");
    if (!snapshot.timestamp) snapshot.timestamp = Date.now();
    tx.objectStore(STORES.TODAY_SNAPSHOTS).put(snapshot);
  },
  getTodaySnapshots: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TODAY_SNAPSHOTS, "readonly");
      const req = tx.objectStore(STORES.TODAY_SNAPSHOTS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
  saveTodaySession: async (symbol, candles) => {
    const db = await openDB();
    const tx = db.transaction(STORES.TODAY_SESSION, "readwrite");
    tx.objectStore(STORES.TODAY_SESSION).put(candles, symbol);
  },
  getTodaySession: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TODAY_SESSION, "readonly");
      const store2 = tx.objectStore(STORES.TODAY_SESSION);
      const result = {};
      const cursorReq = store2.openCursor();
      cursorReq.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          result[cursor.key] = cursor.value;
          cursor.continue();
        } else {
          resolve(result);
        }
      };
      cursorReq.onerror = () => reject(cursorReq.error);
    });
  },
  clearTodayStores: async () => {
    const db = await openDB();
    const tx = db.transaction([STORES.TODAY_SNAPSHOTS, STORES.TODAY_SESSION], "readwrite");
    tx.objectStore(STORES.TODAY_SNAPSHOTS).clear();
    tx.objectStore(STORES.TODAY_SESSION).clear();
    return new Promise((resolve) => {
      tx.oncomplete = () => resolve();
    });
  },
  // === ARCHIVE Operations (Layer 2: Historical Data) ===
  archiveDailyData: async (date, archive) => {
    const db = await openDB();
    const tx = db.transaction(STORES.DAILY_ARCHIVES, "readwrite");
    tx.objectStore(STORES.DAILY_ARCHIVES).put(archive);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  getArchive: async (date) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_ARCHIVES, "readonly");
      const req = tx.objectStore(STORES.DAILY_ARCHIVES).get(date);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },
  getArchives: async (lastNDays) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_ARCHIVES, "readonly");
      const store2 = tx.objectStore(STORES.DAILY_ARCHIVES);
      const req = store2.getAll();
      req.onsuccess = () => {
        const all = req.result || [];
        const sorted = all.sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        resolve(sorted.slice(0, lastNDays));
      };
      req.onerror = () => reject(req.error);
    });
  },
  getAllArchives: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_ARCHIVES, "readonly");
      const req = tx.objectStore(STORES.DAILY_ARCHIVES).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
  deleteArchive: async (date) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_ARCHIVES, "readwrite");
      const req = tx.objectStore(STORES.DAILY_ARCHIVES).delete(date);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },
  pruneOldArchives: async (keepDays) => {
    const db = await openDB();
    const cutoffDate = /* @__PURE__ */ new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    const tx = db.transaction(STORES.DAILY_ARCHIVES, "readwrite");
    const store2 = tx.objectStore(STORES.DAILY_ARCHIVES);
    const req = store2.openCursor();
    let deletedCount = 0;
    return new Promise((resolve) => {
      req.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          const archive = cursor.value;
          if (new Date(archive.date) < cutoffDate) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };
    });
  },
  // === PATTERN Operations (Layer 3: Learned Knowledge) ===
  savePattern: async (pattern) => {
    const db = await openDB();
    const tx = db.transaction(STORES.PATTERNS, "readwrite");
    tx.objectStore(STORES.PATTERNS).put(pattern);
  },
  getPattern: async (id) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PATTERNS, "readonly");
      const req = tx.objectStore(STORES.PATTERNS).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },
  getPatterns: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PATTERNS, "readonly");
      const req = tx.objectStore(STORES.PATTERNS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
  deletePattern: async (id) => {
    const db = await openDB();
    const tx = db.transaction(STORES.PATTERNS, "readwrite");
    tx.objectStore(STORES.PATTERNS).delete(id);
  },
  // === AGENT CALL Operations (Layer 4: Track Record) ===
  /** Insert or update a graded agent call. */
  putAgentCall: async (call) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AGENT_CALLS, "readwrite");
      tx.objectStore(STORES.AGENT_CALLS).put(call);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  putAgentCalls: async (calls) => {
    if (calls.length === 0) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AGENT_CALLS, "readwrite");
      const store2 = tx.objectStore(STORES.AGENT_CALLS);
      calls.forEach((c) => store2.put(c));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  getAllAgentCalls: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AGENT_CALLS, "readonly");
      const req = tx.objectStore(STORES.AGENT_CALLS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
  clearAgentCalls: async () => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AGENT_CALLS, "readwrite");
      tx.objectStore(STORES.AGENT_CALLS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  // === META Operations ===
  setMeta: async (key, value) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.META, "readwrite");
      tx.objectStore(STORES.META).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  getMeta: async (key) => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.META, "readonly");
      const req = tx.objectStore(STORES.META).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },
  // === Legacy Compatibility (for migration) ===
  getSnapshots: async () => {
    return dbService.getTodaySnapshots();
  },
  saveSnapshot: async (snapshot) => {
    return dbService.saveTodaySnapshot(snapshot);
  },
  saveStockSession: async (symbol, candles) => {
    return dbService.saveTodaySession(symbol, candles);
  },
  getAllSessionData: async () => {
    return dbService.getTodaySession();
  },
  getLastDate: async () => {
    return dbService.getMeta("current_session_date");
  },
  setLastDate: async (date) => {
    return dbService.setMeta("current_session_date", date);
  },
  clearAll: async () => {
    return dbService.clearTodayStores();
  }
};

// services/tradingDayManager.ts
function getTodayIST() {
  return (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
}
function getISTHour() {
  return parseInt(
    new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", hour: "numeric", hour12: false }).format(/* @__PURE__ */ new Date()),
    10
  );
}
async function startNewTradingDay(options = {}) {
  if (typeof localStorage === "undefined") {
    return { transitioned: false, tradingDay: getTodayIST(), clearedKeys: [] };
  }
  const today = getTodayIST();
  const storedDay = localStorage.getItem("trading_day");
  const hour = getISTHour();
  const shouldTransition = options.force || storedDay !== today && hour >= 7;
  if (!shouldTransition) {
    return { transitioned: false, tradingDay: storedDay || today, clearedKeys: [] };
  }
  console.log(`[TradingDay] Starting new trading day for ${today} (previous: ${storedDay || "NONE"}, force=${Boolean(options.force)})`);
  const clearedKeys = [];
  const allKeys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) allKeys.push(key);
  }
  for (const key of allKeys) {
    if (isDayScopedKey(key)) {
      localStorage.removeItem(key);
      clearedKeys.push(key);
    }
  }
  try {
    await dbService.clearAll();
  } catch (err) {
    console.warn("[TradingDay] IndexedDB clear warning:", err.message);
  }
  localStorage.setItem("trading_day", today);
  console.log(`[TradingDay] \u2705 New trading day initialized for ${today}. Cleared ${clearedKeys.length} day-scoped keys.`);
  return {
    transitioned: true,
    tradingDay: today,
    clearedKeys
  };
}

// ml/storageScopes.test.ts
console.log("\n--- Storage Scopes & New Trading Day Verification Suite ---");
var failed = 0;
function check(label, cond, detail) {
  if (cond) {
    console.log(`  ok   ${label}`);
  } else {
    failed++;
    console.log(`  FAIL ${label}${detail ? ` \u2014 ${detail}` : ""}`);
  }
}
check("fyers_creds is durable", isDurableKey("fyers_creds"));
check("momentum_settings is durable", isDurableKey("momentum_settings"));
check("sniper_lots is durable", isDurableKey("sniper_lots"));
check("trading_day is durable", isDurableKey("trading_day"));
check("sniper_log is day-scoped", isDayScopedKey("sniper_log"));
check("sniper_day_state is day-scoped", isDayScopedKey("sniper_day_state"));
check("sniper_range_2026-10-23 is day-scoped", isDayScopedKey("sniper_range_2026-10-23"));
check("autotrade_killed_2026-10-23 is day-scoped", isDayScopedKey("autotrade_killed_2026-10-23"));
var store = /* @__PURE__ */ new Map();
global.localStorage = {
  getItem: (k) => store.get(k) || null,
  setItem: (k, v) => store.set(k, v),
  removeItem: (k) => store.delete(k),
  clear: () => store.clear(),
  key: (i) => Array.from(store.keys())[i] || null,
  get length() {
    return store.size;
  }
};
localStorage.setItem("fyers_creds", JSON.stringify({ appId: "test", accessToken: "xyz" }));
localStorage.setItem("momentum_settings", JSON.stringify({ lots: 2 }));
localStorage.setItem("sniper_lots", "2");
localStorage.setItem("sniper_log", "yesterday logs");
localStorage.setItem("sniper_range_yesterday", "yesterday range");
localStorage.setItem("trading_day", "2026-10-22");
startNewTradingDay({ force: true }).then((res) => {
  check("startNewTradingDay transitioned successfully", res.transitioned);
  check("fyers_creds preserved", localStorage.getItem("fyers_creds") !== null);
  check("momentum_settings preserved", localStorage.getItem("momentum_settings") !== null);
  check("sniper_lots preserved", localStorage.getItem("sniper_lots") === "2");
  check("sniper_log cleared", localStorage.getItem("sniper_log") === null);
  check("sniper_range cleared", localStorage.getItem("sniper_range_yesterday") === null);
  check("trading_day updated to today", localStorage.getItem("trading_day") === getTodayIST());
  return startNewTradingDay();
}).then((res2) => {
  check("Idempotent on second call (no transition)", !res2.transitioned);
  console.log(failed ? "\n\u274C FAILED" : "\n\u2705 PASS \u2014 Storage scopes & New Trading Day verified!\n");
  process.exit(failed ? 1 : 0);
}).catch((err) => {
  failed++;
  console.log("FAIL: Exception in test:", err);
  process.exit(1);
});
