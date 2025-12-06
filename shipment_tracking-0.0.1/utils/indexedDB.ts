/**
 * IndexedDB Service for Offline Data Storage
 * Provides a robust, high-capacity storage solution for PWA offline functionality
 */

import { encryptData, decryptData } from './encryption';

const DB_NAME = 'ShipmentTrackerDB';
const DB_VERSION = 2;

import { STORES } from './constants';

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

      if (!db.objectStoreNames.contains(STORES.INSTALLMENTS)) {
        db.createObjectStore(STORES.INSTALLMENTS, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORES.INSTALLMENT_PAYMENTS)) {
        db.createObjectStore(STORES.INSTALLMENT_PAYMENTS, { keyPath: 'id' });
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
export const getAllFromStore = async <T>(storeName: string, timeoutMs: number = 5000): Promise<T[]> => {
  // Use longer timeout for mutation queue operations
  if (storeName === STORES.MUTATION_QUEUE) {
    timeoutMs = 10000;
  }
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      // Set up timeout
      const timeoutId = setTimeout(() => {
        transaction.abort();
        reject(new Error(`getAllFromStore timeout after ${timeoutMs}ms for ${storeName}`));
      }, timeoutMs);

      request.onsuccess = () => {
        clearTimeout(timeoutId);
        resolve(request.result);
      };

      request.onerror = () => {
        clearTimeout(timeoutId);
        reject(request.error);
      };

      // Handle transaction abort
      transaction.onabort = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Transaction aborted for ${storeName}`));
      };
    });
  } catch (error) {
    console.error(`Error getting all from ${storeName}:`, error);
    throw error;
  }
};

/**
 * Get a single record from a store by key
 */
export const getFromStore = async <T>(storeName: string, key: string | number, timeoutMs: number = 5000): Promise<T | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      // Set up timeout
      const timeoutId = setTimeout(() => {
        transaction.abort();
        reject(new Error(`getFromStore timeout after ${timeoutMs}ms for ${storeName}:${key}`));
      }, timeoutMs);

      request.onsuccess = () => {
        clearTimeout(timeoutId);
        resolve(request.result || null);
      };

      request.onerror = () => {
        clearTimeout(timeoutId);
        reject(request.error);
      };

      // Handle transaction abort
      transaction.onabort = () => {
        clearTimeout(timeoutId);
        reject(new Error(`Transaction aborted for ${storeName}:${key}`));
      };
    });
  } catch (error) {
    console.error(`Error getting from ${storeName}:`, error);
    throw error;
  }
};

/**
 * Save a record to a store
 */
export const saveToStore = async (storeName: string, data: any): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error saving to ${storeName}:`, error);
    throw error;
  }
};

/**
 * Delete a record from a store by key
 */
export const deleteFromStore = async (storeName: string, key: string | number): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error deleting from ${storeName}:`, error);
    throw error;
  }
};

/**
 * Clear all records from a store
 */
export const clearStore = async (storeName: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Error clearing ${storeName}:`, error);
    throw error;
  }
};

/**
 * Save all records to a store (replaces existing data)
 */
export const saveAllToStore = async (storeName: string, data: any[]): Promise<void> => {
  try {
    await clearStore(storeName);
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);

      let completed = 0;
      const total = data.length;

      if (total === 0) {
        resolve();
        return;
      }

      data.forEach((item) => {
        const request = store.put(item);
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        request.onerror = () => {
          console.error('Error saving item to store:', request.error);
          reject(request.error);
        };
      });
    });
  } catch (error) {
    console.error(`Error saving all to ${storeName}:`, error);
    throw error;
  }
};

/**
 * Mutation queue operations
 */
export const getMutationQueue = async (): Promise<any[]> => {
  try {
    const encryptedMutations = await getAllFromStore(STORES.MUTATION_QUEUE);

    // Decrypt all mutations with error handling
    const decryptedMutations = await Promise.all(
      encryptedMutations.map(async (encryptedMutation: any) => {
        try {
          // Handle different storage formats
          if (typeof encryptedMutation === 'string') {
            // Check if this is unencrypted data (fallback format)
            if (encryptedMutation.startsWith('{"unencrypted":true')) {
              const parsed = JSON.parse(encryptedMutation);
              if (parsed.unencrypted && parsed.data) {
                return parsed.data;
              }
            }
            // Try to decrypt encrypted data
            return await decryptData(encryptedMutation);
          } else if (typeof encryptedMutation === 'object' && encryptedMutation !== null) {
            // Handle case where mutation is stored as object
            console.warn('Found mutation stored as object instead of string, using as-is');
            return encryptedMutation;
          }
          // Invalid type - skip
          return null;
        } catch (error) {
          console.error('Error decrypting mutation, skipping:', error);
          return null; // Skip corrupted data
        }
      })
    );

    // Filter out null values (corrupted data)
    return decryptedMutations.filter(mutation => mutation !== null);
  } catch (error) {
    console.error('Error getting mutation queue:', error);
    return []; // Return empty array on failure
  }
};

export const addToMutationQueue = async (mutation: any): Promise<void> => {
  try {
    // Encrypt the mutation data before storing (with fallback)
    let encryptedMutation: any;
    try {
      encryptedMutation = await encryptData(mutation);
    } catch (encryptError) {
      console.warn('Encryption failed for mutation, storing unencrypted:', encryptError);
      encryptedMutation = JSON.stringify({ unencrypted: true, data: mutation });
    }

    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORES.MUTATION_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORES.MUTATION_QUEUE);
      const request = store.add(encryptedMutation);

      request.onsuccess = () => {
        // Trigger sync status update when mutation is added
        try {
          // Import syncQueue to update status (avoid circular import)
          import('./syncQueue').then(({ updateSyncStatus }) => {
            if (updateSyncStatus) updateSyncStatus();
          }).catch(err => console.warn('Could not update sync status:', err));
        } catch (statusError) {
          console.warn('Could not update sync status after adding mutation:', statusError);
        }
        resolve();
      };
      request.onerror = () => {
        console.error('Error adding to mutation queue:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Error in addToMutationQueue:', error);
    // Don't throw - allow app to continue
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
    return new Promise((resolve) => {
      const transaction = db.transaction(STORES.MUTATION_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORES.MUTATION_QUEUE);

      let completed = 0;
      const total = queue.length;

      const triggerStatusUpdate = () => {
        // Trigger sync status update
        try {
          import('./syncQueue').then(({ updateSyncStatus }) => {
            if (updateSyncStatus) updateSyncStatus();
          }).catch(err => console.warn('Could not update sync status:', err));
        } catch (statusError) {
          console.warn('Could not update sync status after setting queue:', statusError);
        }
      };

      if (total === 0) {
        // Trigger sync status update even for empty queue
        triggerStatusUpdate();
        resolve();
        return;
      }

      queue.forEach((item) => {
        const request = store.add(item);

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            // Trigger sync status update when all items are added
            triggerStatusUpdate();
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
 * Settings operations
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
    console.error(`Error setting setting ${key}:`, error);
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

/**
 * Clean up orphaned mutations that reference non-existent shipments
 * This prevents sync failures on mutations that can never succeed
 */
export const cleanupOrphanedMutations = async (supabase: any): Promise<number> => {
  try {
    const mutations = await getMutationQueue();
    const validMutations: any[] = [];
    let orphanedCount = 0;

    for (const mutation of mutations) {
      try {
        if (mutation.type === 'updateShipment' || mutation.type === 'deleteShipment') {
          const shipmentId = mutation.type === 'updateShipment' ? mutation.payload.shipmentId : mutation.payload.id;

          // Check if shipment exists
          const { error } = await supabase
            .from('shipments')
            .select('id')
            .eq('id', shipmentId)
            .single();

          if (error && error.code === 'PGRST116') { // Not found
            console.warn(`Removing orphaned mutation for non-existent shipment ${shipmentId}`);
            orphanedCount++;
            continue; // Skip this mutation
          }
        }

        // Keep valid mutations
        validMutations.push(mutation);
      } catch (error) {
        console.error('Error checking mutation validity:', error);
        // Keep mutations we can't validate
        validMutations.push(mutation);
      }
    }

    if (orphanedCount > 0) {
      await setMutationQueue(validMutations);
      console.log(`Cleaned up ${orphanedCount} orphaned mutations`);
    }

    return orphanedCount;
  } catch (error) {
    console.error('Error cleaning up orphaned mutations:', error);
    return 0;
  }
};

/**
 * Clean up old mutations that are older than a specified age
 * This helps prevent accumulation of stale mutations
 */
export const cleanupOldMutations = async (maxAgeHours: number = 168): Promise<number> => {
  try {
    const mutations = await getMutationQueue();
    const cutoffTime = new Date();
    cutoffTime.setHours(cutoffTime.getHours() - maxAgeHours);

    const validMutations = mutations.filter(mutation => {
      if (!mutation.timestamp) return true; // Keep mutations without timestamp
      const mutationTime = new Date(mutation.timestamp);
      return mutationTime > cutoffTime;
    });

    const removedCount = mutations.length - validMutations.length;

    if (removedCount > 0) {
      await setMutationQueue(validMutations);
      console.log(`Cleaned up ${removedCount} old mutations older than ${maxAgeHours} hours`);
    }

    return removedCount;
  } catch (error) {
    console.error('Error cleaning up old mutations:', error);
    return 0;
  }
};

// Initialize DB on module load
initDB().catch(console.error);
