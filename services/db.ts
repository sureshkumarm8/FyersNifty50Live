
import { MarketSnapshot, SessionCandle, SessionHistoryMap } from '../types';

const DB_NAME = 'NiftyLiveDB';
const DB_VERSION = 1;

export const STORES = {
  META: 'meta', // For simple key-values like dates
  SNAPSHOTS: 'snapshots', // For market aggregate history
  SESSION: 'session_data' // For per-stock history
};

let dbInstance: IDBDatabase | null = null;

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) return resolve(dbInstance);

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Store for metadata (e.g. last date)
      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META);
      }
      
      // Store for Market Snapshots (History Log)
      if (!db.objectStoreNames.contains(STORES.SNAPSHOTS)) {
        db.createObjectStore(STORES.SNAPSHOTS, { keyPath: 'timestamp' });
      }

      // Store for Stock Session Data (Key = Symbol)
      if (!db.objectStoreNames.contains(STORES.SESSION)) {
        db.createObjectStore(STORES.SESSION);
      }
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
  // --- Initialization ---
  init: async () => {
    await openDB();
  },

  // --- Meta Operations ---
  setLastDate: async (date: string) => {
    const db = await openDB();
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORES.META, 'readwrite');
      tx.objectStore(STORES.META).put(date, 'last_date');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  },

  getLastDate: async (): Promise<string | null> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.META, 'readonly');
      const req = tx.objectStore(STORES.META).get('last_date');
      req.onsuccess = () => resolve(req.result as string || null);
      req.onerror = () => reject(req.error);
    });
  },

  // --- Market Snapshots (Log) ---
  saveSnapshot: async (snapshot: MarketSnapshot) => {
    const db = await openDB();
    const tx = db.transaction(STORES.SNAPSHOTS, 'readwrite');
    // Ensure timestamp exists
    if (!snapshot.timestamp) snapshot.timestamp = Date.now();
    tx.objectStore(STORES.SNAPSHOTS).put(snapshot);
  },

  getSnapshots: async (): Promise<MarketSnapshot[]> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SNAPSHOTS, 'readonly');
      const req = tx.objectStore(STORES.SNAPSHOTS).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  // --- Session Data (Stock History) ---
  // We save the entire array of candles for a symbol
  saveStockSession: async (symbol: string, candles: SessionCandle[]) => {
    const db = await openDB();
    const tx = db.transaction(STORES.SESSION, 'readwrite');
    tx.objectStore(STORES.SESSION).put(candles, symbol);
  },

  getAllSessionData: async (): Promise<SessionHistoryMap> => {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORES.SESSION, 'readonly');
      const store = tx.objectStore(STORES.SESSION);
      const req = store.getAllKeys();
      
      const result: SessionHistoryMap = {};

      req.onsuccess = async () => {
        const keys = req.result as string[];
        // Fetch values for all keys. 
        // Note: For extreme performance with 50+ keys, a cursor is better, 
        // but Promise.all is fine for Nifty 50 size.
        try {
             const promises = keys.map(key => {
                 return new Promise<void>((resVal) => {
                     const valReq = store.get(key);
                     valReq.onsuccess = () => {
                         result[key] = valReq.result;
                         resVal();
                     }
                 })
             });
             await Promise.all(promises);
             resolve(result);
        } catch(e) {
            reject(e);
        }
      };
      req.onerror = () => reject(req.error);
    });
  },

  // --- Reset ---
  clearAll: async () => {
    const db = await openDB();
    const tx = db.transaction([STORES.META, STORES.SNAPSHOTS, STORES.SESSION], 'readwrite');
    tx.objectStore(STORES.META).clear();
    tx.objectStore(STORES.SNAPSHOTS).clear();
    tx.objectStore(STORES.SESSION).clear();
    return new Promise<void>((resolve) => {
        tx.oncomplete = () => resolve();
    });
  }
};
