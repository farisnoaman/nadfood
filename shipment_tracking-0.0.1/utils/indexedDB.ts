/**
 * IndexedDB Service for Offline Data Storage
 * Provides a robust, high-capacity storage solution for PWA offline functionality
 */

const DB_NAME = 'ShipmentTrackerDB';
const DB_VERSION = 1;

// Object store names
export const STORES = {
  USERS: 'users',
  PRODUCTS: 'products',
  DRIVERS: 'drivers',
  REGIONS: 'regions',
  SHIPMENTS: 'shipments',
  PRODUCT_PRICES: 'productPrices',
  NOTIFICATIONS: 'notifications',
  MUTATION_QUEUE: 'mutationQueue',
  SETTINGS: 'settings',
  METADATA: 'metadata'
} as const;

let dbInstance: IDBDatabase | null = null;

/**
 * Initialize IndexedDB with all required object stores
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('IndexedDB initialization failed:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      console.log('IndexedDB initialized successfully');
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(STORES.USERS)) {
        db.createObjectStore(STORES.USERS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.PRODUCTS)) {
        db.createObjectStore(STORES.PRODUCTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.DRIVERS)) {
        db.createObjectStore(STORES.DRIVERS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.REGIONS)) {
        db.createObjectStore(STORES.REGIONS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.SHIPMENTS)) {
        db.createObjectStore(STORES.SHIPMENTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.PRODUCT_PRICES)) {
        db.createObjectStore(STORES.PRODUCT_PRICES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
        const notificationsStore = db.createObjectStore(STORES.NOTIFICATIONS, { keyPath: 'id' });
        notificationsStore.createIndex('timestamp', 'timestamp', { unique: false });
        notificationsStore.createIndex('read', 'read', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MUTATION_QUEUE)) {
        db.createObjectStore(STORES.MUTATION_QUEUE, { autoIncrement: true });
      }

      if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
        db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains(STORES.METADATA)) {
        db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
      }

      console.log('IndexedDB object stores created');
    };
  });
};

/**
 * Get all records from a store
 */
export const getAllFromStore = async <T>(storeName: string): Promise<T[]> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => {
        console.error(`Error getting all from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error in getAllFromStore for ${storeName}:`, error);
    return [];
  }
};

/**
 * Save multiple records to a store (bulk operation)
 */
export const saveAllToStore = async <T>(storeName: string, data: T[]): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      // Clear existing data first
      const clearRequest = store.clear();

      clearRequest.onsuccess = () => {
        // Add all new records
        let completed = 0;
        const total = data.length;

        if (total === 0) {
          resolve();
          return;
        }

        data.forEach((item) => {
          const addRequest = store.add(item);

          addRequest.onsuccess = () => {
            completed++;
            if (completed === total) {
              resolve();
            }
          };

          addRequest.onerror = () => {
            console.error(`Error adding item to ${storeName}:`, addRequest.error);
            // Continue even if one item fails
            completed++;
            if (completed === total) {
              resolve();
            }
          };
        });
      };

      clearRequest.onerror = () => {
        console.error(`Error clearing ${storeName}:`, clearRequest.error);
        reject(clearRequest.error);
      };
    });
  } catch (error) {
    console.error(`Error in saveAllToStore for ${storeName}:`, error);
    throw error;
  }
};

/**
 * Get a single record by key
 */
export const getFromStore = async <T>(storeName: string, key: string | number): Promise<T | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as T || null);
      request.onerror = () => {
        console.error(`Error getting from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error in getFromStore for ${storeName}:`, error);
    return null;
  }
};

/**
 * Save a single record to a store
 */
export const saveToStore = async <T>(storeName: string, data: T): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`Error saving to ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error in saveToStore for ${storeName}:`, error);
    throw error;
  }
};

/**
 * Delete a single record from a store
 */
export const deleteFromStore = async (storeName: string, key: string | number): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`Error deleting from ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error in deleteFromStore for ${storeName}:`, error);
    throw error;
  }
};

/**
 * Clear all data from a store
 */
export const clearStore = async (storeName: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error(`Error clearing ${storeName}:`, request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error(`Error in clearStore for ${storeName}:`, error);
    throw error;
  }
};

/**
 * Get/Set settings (key-value pairs)
 */
export const getSetting = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const result = await getFromStore<{ key: string; value: T }>(STORES.SETTINGS, key);
    return result ? result.value : defaultValue;
  } catch (error) {
    console.error(`Error getting setting ${key}:`, error);
    return defaultValue;
  }
};

export const setSetting = async <T>(key: string, value: T): Promise<void> => {
  try {
    await saveToStore(STORES.SETTINGS, { key, value });
  } catch (error) {
    console.error(`Error setting ${key}:`, error);
  }
};

/**
 * Mutation queue operations
 */
export const getMutationQueue = async (): Promise<any[]> => {
  try {
    return await getAllFromStore(STORES.MUTATION_QUEUE);
  } catch (error) {
    console.error('Error getting mutation queue:', error);
    return [];
  }
};

export const addToMutationQueue = async (mutation: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.MUTATION_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORES.MUTATION_QUEUE);
      const request = store.add(mutation);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Error adding to mutation queue:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error in addToMutationQueue:', error);
    throw error;
  }
};

export const clearMutationQueue = async (): Promise<void> => {
  try {
    await clearStore(STORES.MUTATION_QUEUE);
  } catch (error) {
    console.error('Error clearing mutation queue:', error);
  }
};

export const setMutationQueue = async (queue: any[]): Promise<void> => {
  try {
    await clearMutationQueue();
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.MUTATION_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORES.MUTATION_QUEUE);

      let completed = 0;
      const total = queue.length;

      if (total === 0) {
        resolve();
        return;
      }

      queue.forEach((item) => {
        const request = store.add(item);

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };

        request.onerror = () => {
          console.error('Error adding mutation to queue:', request.error);
          completed++;
          if (completed === total) {
            resolve();
          }
        };
      });
    });
  } catch (error) {
    console.error('Error in setMutationQueue:', error);
    throw error;
  }
};

/**
 * Metadata operations (for timestamps, sync status, etc.)
 */
export const getMetadata = async <T>(key: string, defaultValue: T): Promise<T> => {
  try {
    const result = await getFromStore<{ key: string; value: T }>(STORES.METADATA, key);
    return result ? result.value : defaultValue;
  } catch (error) {
    console.error(`Error getting metadata ${key}:`, error);
    return defaultValue;
  }
};

export const setMetadata = async <T>(key: string, value: T): Promise<void> => {
  try {
    await saveToStore(STORES.METADATA, { key, value });
  } catch (error) {
    console.error(`Error setting metadata ${key}:`, error);
  }
};

/**
 * Clear all app data (useful for logout or reset)
 */
export const clearAllData = async (): Promise<void> => {
  try {
    const db = await initDB();
    const storeNames = Array.from(db.objectStoreNames);

    await Promise.all(
      storeNames.map(storeName => clearStore(storeName))
    );

    console.log('All IndexedDB data cleared');
  } catch (error) {
    console.error('Error clearing all data:', error);
  }
};

/**
 * Migrate data from localStorage to IndexedDB (one-time migration)
 */
export const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    console.log('Starting migration from localStorage to IndexedDB...');

    // Check if migration has already been done
    const migrated = await getMetadata<boolean>('migrated_from_localstorage', false);
    if (migrated) {
      console.log('Migration already completed');
      return;
    }

    // Migrate data stores
    const storesToMigrate = [
      'users',
      'products',
      'drivers',
      'regions',
      'shipments',
      'productPrices',
      'notifications',
      'mutationQueue'
    ];

    for (const storeName of storesToMigrate) {
      try {
        const lsKey = `shipmentTracker_${storeName}`;
        const data = localStorage.getItem(lsKey);
        if (data) {
          const parsed = JSON.parse(data);
          if (storeName === 'mutationQueue') {
            await setMutationQueue(parsed);
          } else {
            await saveAllToStore(storeName, parsed);
          }
          console.log(`Migrated ${storeName} from localStorage`);
        }
      } catch (error) {
        console.error(`Error migrating ${storeName}:`, error);
      }
    }

    // Migrate settings
    const settingsToMigrate = [
      'accountantPrintAccess',
      'isPrintHeaderEnabled',
      'appName',
      'companyName',
      'companyAddress',
      'companyPhone',
      'companyLogo',
      'isTimeWidgetVisible'
    ];

    for (const setting of settingsToMigrate) {
      try {
        const value = localStorage.getItem(setting);
        if (value !== null) {
          await setSetting(setting, setting.includes('Print') || setting.includes('Widget') ? JSON.parse(value) : value);
          console.log(`Migrated setting ${setting}`);
        }
      } catch (error) {
        console.error(`Error migrating setting ${setting}:`, error);
      }
    }

    // Mark migration as complete
    await setMetadata('migrated_from_localstorage', true);
    await setMetadata('migration_timestamp', new Date().toISOString());

    console.log('Migration from localStorage to IndexedDB completed successfully');
  } catch (error) {
    console.error('Error during migration:', error);
  }
};

// Initialize DB on module load
initDB().catch(console.error);
