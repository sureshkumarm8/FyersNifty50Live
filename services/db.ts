
import { MarketSnapshot, SessionCandle, SessionHistoryMap, DailyArchive, Pattern } from '../types';

const DB_NAME = 'NiftyLiveDB';
const DB_VERSION = 3; // v3 adds the agent decision log used by the AI Lab scorecard

export const STORES = {
  // Layer 1: TODAY (Temporary, cleared daily)
  TODAY_SNAPSHOTS: 'today_snapshots',
  TODAY_SESSION: 'today_session',
  
  // Layer 2: ARCHIVES (Permanent, multi-day)
  DAILY_ARCHIVES: 'daily_archives',
  
  // Layer 3: PATTERNS (Learned knowledge)
  PATTERNS: 'patterns',

  // Layer 4: every agent call ever made, with its graded outcome
  AGENT_CALLS: 'agent_calls',
  
  // Metadata
  META: 'meta'
};

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      
      console.log(`🔄 Upgrading DB from v${oldVersion} to v${DB_VERSION}`);
      
      // Migrate from V1 to V2
      if (oldVersion < 2) {
        // Migrate old SNAPSHOTS → TODAY_SNAPSHOTS
        if (db.objectStoreNames.contains('snapshots')) {
          db.deleteObjectStore('snapshots');
        }
        if (db.objectStoreNames.contains('session_data')) {
          db.deleteObjectStore('session_data');
        }
        if (!db.objectStoreNames.contains(STORES.META)) {
          db.createObjectStore(STORES.META);
        }
      }
      
      // Layer 1: TODAY stores (temporary)
      if (!db.objectStoreNames.contains(STORES.TODAY_SNAPSHOTS)) {
        db.createObjectStore(STORES.TODAY_SNAPSHOTS, { keyPath: 'timestamp' });
      }
      if (!db.objectStoreNames.contains(STORES.TODAY_SESSION)) {
        db.createObjectStore(STORES.TODAY_SESSION);
      }
      
      // Layer 2: ARCHIVE store (keyed by date)
      if (!db.objectStoreNames.contains(STORES.DAILY_ARCHIVES)) {
        const archiveStore = db.createObjectStore(STORES.DAILY_ARCHIVES, { keyPath: 'date' });
        archiveStore.createIndex('dateIndex', 'date', { unique: true });
      }
      
      // Layer 3: PATTERNS store
      if (!db.objectStoreNames.contains(STORES.PATTERNS)) {
        const patternStore = db.createObjectStore(STORES.PATTERNS, { keyPath: 'id' });
        patternStore.createIndex('confidence', 'confidence');
        patternStore.createIndex('name', 'name');
      }
      
      // META store
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META);
      }

      // Layer 4: AGENT CALLS — one record per agent decision, graded later.
      if (!db.objectStoreNames.contains(STORES.AGENT_CALLS)) {
        const callStore = db.createObjectStore(STORES.AGENT_CALLS, { keyPath: 'id' });
        callStore.createIndex('agent', 'agent');
        callStore.createIndex('timestamp', 'timestamp');
        callStore.createIndex('graded', 'graded');
      }

      console.log('✅ DB Upgrade Complete');
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
};

export const dbService = {
  // === Initialization ===
  init: async () => {
    await openDB();
  },

  // === TODAY Operations (Layer 1: Live Session) ===
  
  saveTodaySnapshot: async (snapshot: MarketSnapshot) => {
    const db = await openDB();
    const tx = db.transaction(STORES.TODAY_SNAPSHOTS, 'readwrite');
    if (!snapshot.timestamp) snapshot.timestamp = Date.now();
    tx.objectStore(STORES.TODAY_SNAPSHOTS).put(snapshot);
  },
  
  getTodaySnapshots: async (): Promise<MarketSnapshot[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TODAY_SNAPSHOTS, 'readonly');
      const req = tx.objectStore(STORES.TODAY_SNAPSHOTS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
  
  saveTodaySession: async (symbol: string, candles: SessionCandle[]) => {
    const db = await openDB();
    const tx = db.transaction(STORES.TODAY_SESSION, 'readwrite');
    tx.objectStore(STORES.TODAY_SESSION).put(candles, symbol);
  },
  
  getTodaySession: async (): Promise<SessionHistoryMap> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.TODAY_SESSION, 'readonly');
      const store = tx.objectStore(STORES.TODAY_SESSION);
      const result: SessionHistoryMap = {};
      
      const cursorReq = store.openCursor();
      cursorReq.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          result[cursor.key as string] = cursor.value;
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
    const tx = db.transaction([STORES.TODAY_SNAPSHOTS, STORES.TODAY_SESSION], 'readwrite');
    tx.objectStore(STORES.TODAY_SNAPSHOTS).clear();
    tx.objectStore(STORES.TODAY_SESSION).clear();
    return new Promise<void>((resolve) => {
      tx.oncomplete = () => resolve();
    });
  },

  // === ARCHIVE Operations (Layer 2: Historical Data) ===
  
  archiveDailyData: async (date: string, archive: DailyArchive) => {
    const db = await openDB();
    const tx = db.transaction(STORES.DAILY_ARCHIVES, 'readwrite');
    tx.objectStore(STORES.DAILY_ARCHIVES).put(archive);
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  
  getArchive: async (date: string): Promise<DailyArchive | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_ARCHIVES, 'readonly');
      const req = tx.objectStore(STORES.DAILY_ARCHIVES).get(date);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },
  
  getArchives: async (lastNDays: number): Promise<DailyArchive[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_ARCHIVES, 'readonly');
      const store = tx.objectStore(STORES.DAILY_ARCHIVES);
      const req = store.getAll();
      
      req.onsuccess = () => {
        const all = req.result || [];
        const sorted = all.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        resolve(sorted.slice(0, lastNDays));
      };
      req.onerror = () => reject(req.error);
    });
  },
  
  getAllArchives: async (): Promise<DailyArchive[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_ARCHIVES, 'readonly');
      const req = tx.objectStore(STORES.DAILY_ARCHIVES).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  deleteArchive: async (date: string): Promise<void> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.DAILY_ARCHIVES, 'readwrite');
      const req = tx.objectStore(STORES.DAILY_ARCHIVES).delete(date);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  },
  
  pruneOldArchives: async (keepDays: number) => {
    const db = await openDB();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - keepDays);
    
    const tx = db.transaction(STORES.DAILY_ARCHIVES, 'readwrite');
    const store = tx.objectStore(STORES.DAILY_ARCHIVES);
    
    const req = store.openCursor();
    let deletedCount = 0;
    
    return new Promise<number>((resolve) => {
      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const archive = cursor.value as DailyArchive;
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
  
  savePattern: async (pattern: Pattern) => {
    const db = await openDB();
    const tx = db.transaction(STORES.PATTERNS, 'readwrite');
    tx.objectStore(STORES.PATTERNS).put(pattern);
  },
  
  getPattern: async (id: string): Promise<Pattern | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PATTERNS, 'readonly');
      const req = tx.objectStore(STORES.PATTERNS).get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },
  
  getPatterns: async (): Promise<Pattern[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.PATTERNS, 'readonly');
      const req = tx.objectStore(STORES.PATTERNS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },
  
  deletePattern: async (id: string) => {
    const db = await openDB();
    const tx = db.transaction(STORES.PATTERNS, 'readwrite');
    tx.objectStore(STORES.PATTERNS).delete(id);
  },

  // === AGENT CALL Operations (Layer 4: Track Record) ===

  /** Insert or update a graded agent call. */
  putAgentCall: async (call: any) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.AGENT_CALLS, 'readwrite');
      tx.objectStore(STORES.AGENT_CALLS).put(call);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  putAgentCalls: async (calls: any[]) => {
    if (calls.length === 0) return;
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.AGENT_CALLS, 'readwrite');
      const store = tx.objectStore(STORES.AGENT_CALLS);
      calls.forEach(c => store.put(c));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  getAllAgentCalls: async (): Promise<any[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.AGENT_CALLS, 'readonly');
      const req = tx.objectStore(STORES.AGENT_CALLS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  clearAgentCalls: async () => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.AGENT_CALLS, 'readwrite');
      tx.objectStore(STORES.AGENT_CALLS).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  // === META Operations ===
  
  setMeta: async (key: string, value: any) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.META, 'readwrite');
      tx.objectStore(STORES.META).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },
  
  getMeta: async (key: string): Promise<any> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.META, 'readonly');
      const req = tx.objectStore(STORES.META).get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  },

  // === Legacy Compatibility (for migration) ===
  
  getSnapshots: async (): Promise<MarketSnapshot[]> => {
    // Redirect to TODAY snapshots
    return dbService.getTodaySnapshots();
  },
  
  saveSnapshot: async (snapshot: MarketSnapshot) => {
    // Redirect to TODAY snapshots
    return dbService.saveTodaySnapshot(snapshot);
  },
  
  saveStockSession: async (symbol: string, candles: SessionCandle[]) => {
    // Redirect to TODAY session
    return dbService.saveTodaySession(symbol, candles);
  },
  
  getAllSessionData: async (): Promise<SessionHistoryMap> => {
    // Redirect to TODAY session
    return dbService.getTodaySession();
  },
  
  getLastDate: async (): Promise<string | null> => {
    return dbService.getMeta('current_session_date');
  },
  
  setLastDate: async (date: string) => {
    return dbService.setMeta('current_session_date', date);
  },
  
  clearAll: async () => {
    // Clear only TODAY stores (keep archives and patterns)
    return dbService.clearTodayStores();
  }
};
