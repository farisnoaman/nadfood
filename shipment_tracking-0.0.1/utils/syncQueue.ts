/**
 * Sync Queue Service
 * Handles queuing offline operations and syncing with server when online
 */

import {
  initDB,
  getAllFromStore,
  saveToStore,
  deleteFromStore,
  clearStore,
  setMetadata,
  getMetadata,
  STORES
} from './indexedDB';
import { encryptData, decryptData, isEncrypted } from './encryption';

// Types for sync operations
export type SyncOperationType = 'create' | 'update' | 'delete';
export type SyncEntityType = 'shipment' | 'product' | 'driver' | 'region' | 'product_price' | 'notification';

export interface SyncQueueItem {
  id: string;
  entityType: SyncEntityType;
  operation: SyncOperationType;
  data: any;
  timestamp: string;
  retryCount: number;
  lastError?: string;
  status: 'pending' | 'syncing' | 'failed' | 'completed';
}

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: string | null;
  lastSyncError: string | null;
}

// Sync queue store
const SYNC_QUEUE_STORE = STORES.MUTATION_QUEUE;
const MAX_RETRIES = 3;

// Event listeners for sync status changes
type SyncStatusListener = (status: SyncStatus) => void;
const syncStatusListeners: SyncStatusListener[] = [];

let currentSyncStatus: SyncStatus = {
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingCount: 0,
  lastSyncTime: null,
  lastSyncError: null,
};

/**
 * Generate unique ID for sync queue items
 */
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Add operation to sync queue
 */
export const addToSyncQueue = async (
  entityType: SyncEntityType,
  operation: SyncOperationType,
  data: any
): Promise<void> => {
  try {
    await initDB();

    // Encrypt sensitive data (with fallback for failures)
    let encryptedData: string;
    try {
      encryptedData = await encryptData(data);
    } catch (encryptError) {
      logger.warn('Encryption failed, storing data unencrypted:', encryptError);
      // Fallback: store as unencrypted but marked
      encryptedData = JSON.stringify({ unencrypted: true, data });
    }

    const item: SyncQueueItem = {
      id: generateId(),
      entityType,
      operation,
      data: encryptedData,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      status: 'pending',
    };

    await saveToStore(SYNC_QUEUE_STORE, item);

    // Update pending count
    await updateSyncStatus();

    logger.debug(`Added to sync queue: ${operation} ${entityType}`);

    // If online, trigger sync
    if (navigator.onLine) {
      setTimeout(() => processSyncQueue(), 1000);
    }
  } catch (error) {
    logger.error('Error adding to sync queue:', error);
    // Don't throw - allow app to continue without sync
  }
};

/**
 * Get all pending sync items
 */
export const getPendingSyncItems = async (): Promise<SyncQueueItem[]> => {
  try {
    await initDB();
    const allItems = await getAllFromStore<SyncQueueItem>(SYNC_QUEUE_STORE);
    return allItems.filter(item => item.status === 'pending' || item.status === 'failed');
  } catch (error) {
    console.error('Error getting pending sync items:', error);
    return [];
  }
};

/**
 * Get sync queue count
 */
export const getSyncQueueCount = async (): Promise<number> => {
  try {
    const items = await getPendingSyncItems();
    return items.length;
  } catch (error) {
    console.error('Error getting sync queue count:', error);
    return 0;
  }
};

/**
 * Update item status in queue
 */
const updateQueueItemStatus = async (
  id: string,
  status: SyncQueueItem['status'],
  error?: string
): Promise<void> => {
  try {
    await initDB();
    const allItems = await getAllFromStore<SyncQueueItem>(SYNC_QUEUE_STORE);
    const item = allItems.find(i => i.id === id);
    
    if (item) {
      item.status = status;
      if (error) {
        item.lastError = error;
        item.retryCount++;
      }
      await saveToStore(SYNC_QUEUE_STORE, item);
    }
  } catch (error) {
    console.error('Error updating queue item status:', error);
  }
};

/**
 * Remove item from queue
 */
const removeFromQueue = async (id: string): Promise<void> => {
  try {
    await initDB();
    await deleteFromStore(SYNC_QUEUE_STORE, id);
  } catch (error) {
    console.error('Error removing from queue:', error);
  }
};

/**
 * Process single sync item
 */
const processSyncItem = async (
  item: SyncQueueItem,
  supabase: any
): Promise<boolean> => {
  try {
    await updateQueueItemStatus(item.id, 'syncing');

    // Decrypt the data before processing (with error handling)
    let decryptedData: any;
    try {
      decryptedData = await decryptData(item.data);
    } catch (decryptError) {
      logger.error('Failed to decrypt sync item data:', decryptError);
      // Mark as failed and skip
      await updateQueueItemStatus(item.id, 'failed');
      await updateQueueItemError(item.id, 'Decryption failed');
      return false;
    }

    let result;
    const tableName = getTableName(item.entityType);
    
    switch (item.operation) {
      case 'create':
        result = await supabase
          .from(tableName)
          .insert(decryptedData)
          .select();
        break;

      case 'update':
        result = await supabase
          .from(tableName)
          .update(decryptedData)
          .eq('id', decryptedData.id)
          .select();
        break;

      case 'delete':
        result = await supabase
          .from(tableName)
          .delete()
          .eq('id', decryptedData.id);
        break;

      default:
        throw new Error(`Unknown operation: ${item.operation}`);
    }
    
    if (result.error) {
      throw result.error;
    }
    
    // Success - remove from queue
    await removeFromQueue(item.id);
    logger.info(`Synced: ${item.operation} ${item.entityType} ${decryptedData.id || ''}`);
    return true;
    
  } catch (error: any) {
    console.error(`Sync failed for ${item.operation} ${item.entityType}:`, error);
    
    if (item.retryCount >= MAX_RETRIES) {
      // Mark as permanently failed
      await updateQueueItemStatus(item.id, 'failed', error.message);
    } else {
      // Mark for retry
      await updateQueueItemStatus(item.id, 'pending', error.message);
    }
    
    return false;
  }
};

/**
 * Get table name for entity type
 */
const getTableName = (entityType: SyncEntityType): string => {
  const tableMap: Record<SyncEntityType, string> = {
    shipment: 'shipments',
    product: 'products',
    driver: 'drivers',
    region: 'regions',
    product_price: 'product_prices',
    notification: 'notifications',
  };
  return tableMap[entityType];
};

/**
 * Process entire sync queue
 */
export const processSyncQueue = async (supabase?: any): Promise<{
  success: number;
  failed: number;
  remaining: number;
}> => {
  if (currentSyncStatus.isSyncing) {
    console.log('Sync already in progress');
    return { success: 0, failed: 0, remaining: await getSyncQueueCount() };
  }
  
  if (!navigator.onLine) {
    console.log('Cannot sync: offline');
    return { success: 0, failed: 0, remaining: await getSyncQueueCount() };
  }
  
  // If no supabase provided, try to import it
  if (!supabase) {
    try {
      const { supabase: sb } = await import('./supabaseClient');
      supabase = sb;
    } catch (error) {
      console.error('Cannot import supabase client:', error);
      return { success: 0, failed: 0, remaining: await getSyncQueueCount() };
    }
  }
  
  currentSyncStatus.isSyncing = true;
  notifySyncStatusChange();
  
  let success = 0;
  let failed = 0;
  
  try {
    const pendingItems = await getPendingSyncItems();
    
    // Sort by timestamp (oldest first)
    pendingItems.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    for (const item of pendingItems) {
      if (item.retryCount < MAX_RETRIES) {
        const result = await processSyncItem(item, supabase);
        if (result) {
          success++;
        } else {
          failed++;
        }
      }
    }
    
    // Update last sync time
    await setMetadata('lastSyncTime', new Date().toISOString());
    currentSyncStatus.lastSyncTime = new Date().toISOString();
    currentSyncStatus.lastSyncError = null;
    
  } catch (error: any) {
    console.error('Error processing sync queue:', error);
    currentSyncStatus.lastSyncError = error.message;
  } finally {
    currentSyncStatus.isSyncing = false;
    await updateSyncStatus();
  }
  
  const remaining = await getSyncQueueCount();
  console.log(`Sync complete: ${success} success, ${failed} failed, ${remaining} remaining`);
  
  return { success, failed, remaining };
};

/**
 * Clear completed items from queue
 */
export const clearCompletedItems = async (): Promise<void> => {
  try {
    await initDB();
    const allItems = await getAllFromStore<SyncQueueItem>(SYNC_QUEUE_STORE);
    const completedIds = allItems
      .filter(item => item.status === 'completed')
      .map(item => item.id);
    
    for (const id of completedIds) {
      await removeFromQueue(id);
    }
    
    await updateSyncStatus();
  } catch (error) {
    console.error('Error clearing completed items:', error);
  }
};

/**
 * Clear all sync queue
 */
export const clearSyncQueue = async (): Promise<void> => {
  try {
    await clearStore(SYNC_QUEUE_STORE);
    await updateSyncStatus();
    console.log('Sync queue cleared');
  } catch (error) {
    console.error('Error clearing sync queue:', error);
  }
};

/**
 * Update sync status
 */
const updateSyncStatus = async (): Promise<void> => {
  try {
    const pendingCount = await getSyncQueueCount();
    const lastSyncTime = await getMetadata<string | null>('lastSyncTime', null);
    
    currentSyncStatus = {
      ...currentSyncStatus,
      isOnline: navigator.onLine,
      pendingCount,
      lastSyncTime,
    };
    
    notifySyncStatusChange();
  } catch (error) {
    console.error('Error updating sync status:', error);
  }
};

/**
 * Get current sync status
 */
export const getSyncStatus = (): SyncStatus => {
  return { ...currentSyncStatus };
};

/**
 * Subscribe to sync status changes
 */
export const subscribeSyncStatus = (listener: SyncStatusListener): () => void => {
  syncStatusListeners.push(listener);
  // Immediately notify with current status
  listener(currentSyncStatus);
  
  // Return unsubscribe function
  return () => {
    const index = syncStatusListeners.indexOf(listener);
    if (index > -1) {
      syncStatusListeners.splice(index, 1);
    }
  };
};

/**
 * Notify all listeners of status change
 */
const notifySyncStatusChange = (): void => {
  syncStatusListeners.forEach(listener => {
    try {
      listener(currentSyncStatus);
    } catch (error) {
      console.error('Error notifying sync status listener:', error);
    }
  });
};

/**
 * Initialize sync service
 * Sets up online/offline event listeners
 */
export const initSyncService = (): void => {
  if (typeof window === 'undefined') return;
  
  // Listen for online/offline events
  window.addEventListener('online', async () => {
    console.log('Back online - triggering sync');
    currentSyncStatus.isOnline = true;
    notifySyncStatusChange();
    
    // Delay sync to ensure connection is stable
    setTimeout(() => processSyncQueue(), 2000);
  });
  
  window.addEventListener('offline', () => {
    console.log('Gone offline');
    currentSyncStatus.isOnline = false;
    notifySyncStatusChange();
  });
  
  // Initial status update
  updateSyncStatus();
  
  console.log('Sync service initialized');
};

// Auto-initialize on module load
if (typeof window !== 'undefined') {
  initSyncService();
}
