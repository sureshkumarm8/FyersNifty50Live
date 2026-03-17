// IndexedDB service for storing images, analysis, and live checks
const DB_NAME = 'FyersNifty50';
const DB_VERSION = 2;
const IMAGES_STORE = 'preMarketImages';
const ANALYSIS_STORE = 'preMarketAnalysis';

let db: IDBDatabase | null = null;

export const imageStorageService = {
  // Initialize IndexedDB
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        if (!database.objectStoreNames.contains(IMAGES_STORE)) {
          database.createObjectStore(IMAGES_STORE);
        }
        if (!database.objectStoreNames.contains(ANALYSIS_STORE)) {
          database.createObjectStore(ANALYSIS_STORE);
        }
      };
    });
  },

  // Save all images
  async saveImages(images: Record<string, string | null>): Promise<void> {
    if (!db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(IMAGES_STORE, 'readwrite');
      const store = transaction.objectStore(IMAGES_STORE);

      // Clear existing data
      store.clear();

      // Save only non-null images
      Object.entries(images).forEach(([key, value]) => {
        if (value) {
          store.put(value, key);
        }
      });

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  },

  // Load all images
  async loadImages(): Promise<Record<string, string | null>> {
    if (!db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(IMAGES_STORE, 'readonly');
      const store = transaction.objectStore(IMAGES_STORE);
      
      const result: Record<string, string | null> = {
        intraday1h: null,
        oiChart: null,
        fiveDay: null,
      };

      const keysRequest = store.getAllKeys();
      keysRequest.onerror = () => reject(keysRequest.error);
      keysRequest.onsuccess = () => {
        const keys = keysRequest.result as string[];
        let completed = 0;

        keys.forEach(key => {
          const getRequest = store.get(key);
          getRequest.onsuccess = () => {
            result[key as keyof typeof result] = getRequest.result as string | null;
            completed++;
            if (completed === keys.length) {
              resolve(result);
            }
          };
          getRequest.onerror = () => reject(getRequest.error);
        });

        if (keys.length === 0) {
          resolve(result);
        }
      };
    });
  },

  // Save analysis data (text only - newsAnalysis, preMarketAnalysis, postAnalysis, liveChecks)
  async saveAnalysis(data: any): Promise<void> {
    if (!db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(ANALYSIS_STORE, 'readwrite');
      const store = transaction.objectStore(ANALYSIS_STORE);
      store.put(data, 'analysisData');

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  },

  // Load analysis data
  async loadAnalysis(): Promise<any> {
    if (!db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(ANALYSIS_STORE, 'readonly');
      const store = transaction.objectStore(ANALYSIS_STORE);
      const request = store.get('analysisData');

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  },

  // Clear all images
  async clearImages(): Promise<void> {
    if (!db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(IMAGES_STORE, 'readwrite');
      const store = transaction.objectStore(IMAGES_STORE);
      store.clear();

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  },

  // Delete specific image
  async deleteImage(key: string): Promise<void> {
    if (!db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction(IMAGES_STORE, 'readwrite');
      const store = transaction.objectStore(IMAGES_STORE);
      store.delete(key);

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  },
};
