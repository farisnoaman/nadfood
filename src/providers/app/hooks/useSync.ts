import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { User, Notification, ShipmentProduct } from '../types';
import { Role, NotificationCategory } from '../../../types';
import logger from '../../../utils/logger';
import * as IndexedDB from '../../../utils/indexedDB';
import { updateSyncStatus, getSyncQueueCount } from '../../../utils/syncQueue';
import { shipmentToRow } from '../mappers';

export const useSync = (
    currentUser: User | null,
    onRefresh: () => Promise<void>,
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>
) => {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [needsSync, setNeedsSync] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const syncOfflineMutations = useCallback(async () => {
        logger.info('Starting offline mutations sync');

        let mutationQueue: any[] = [];

        try {
            // Check if we recently attempted sync to prevent rate limiting
            const lastSyncTime = localStorage.getItem('last_sync_attempt');
            const now = Date.now();
            if (lastSyncTime && (now - parseInt(lastSyncTime)) < 30000) { // 30 seconds cooldown
                logger.info('Sync attempt too recent, skipping to prevent rate limiting');
                return;
            }
            localStorage.setItem('last_sync_attempt', now.toString());

            // Refresh auth session before syncing
            try {
                await supabase.auth.refreshSession();
                logger.info('Auth session refreshed for sync');
            } catch (authError) {
                logger.warn('Failed to refresh auth session:', authError);
                // Continue without session refresh if it fails
            }

            mutationQueue = await IndexedDB.getMutationQueue();
            // Filter mutations by current user
            if (currentUser?.id) {
                mutationQueue = mutationQueue.filter(mutation => mutation.userId === currentUser.id);
            }
            if (mutationQueue.length === 0) {
                logger.info('No pending mutations to sync');
                return;
            }
            logger.info(`Found ${mutationQueue.length} pending mutations to sync`);

            // Clean up orphaned mutations and malformed data before syncing
            try {
                const orphanedCount = await IndexedDB.cleanupOrphanedMutations(supabase);
                if (orphanedCount > 0) {
                    logger.info(`Cleaned up ${orphanedCount} orphaned mutations`);
                }

                // Re-fetch the queue after cleanup to get the latest valid mutations
                let cleanedQueue = await IndexedDB.getMutationQueue();
                // Filter mutations by current user
                if (currentUser?.id) {
                    cleanedQueue = cleanedQueue.filter(mutation => mutation.userId === currentUser.id);
                }
                if (cleanedQueue.length === 0) {
                    logger.info('No mutations left after cleanup');
                    return;
                }
                // Use the cleaned queue
                mutationQueue.length = 0; // Clear the array
                mutationQueue.push(...cleanedQueue); // Add cleaned items
            } catch (cleanupError) {
                logger.warn('Failed to cleanup mutations:', cleanupError);
                // Continue with current queue if cleanup fails
            }

            mutationQueue = await IndexedDB.getMutationQueue();
            if (mutationQueue.length === 0) {
                logger.info('No pending mutations to sync');
                return;
            }
            logger.info(`Found ${mutationQueue.length} pending mutations to sync`);

            // Cross-tab synchronization: Prevent multiple tabs from syncing simultaneously
            const lockKey = 'sync_lock';
            const lockValue = `${Date.now()}_${Math.random()}`;
            const existingLock = localStorage.getItem(lockKey);

            // Check if another tab is currently syncing (lock exists and is less than 30 seconds old)
            if (existingLock) {
                const lockTimestamp = parseInt(existingLock.split('_')[0]);
                if (Date.now() - lockTimestamp < 30000) {
                    logger.info('Another tab is syncing. Skipping this sync attempt.');
                    return;
                }
            }

            // Acquire lock
            localStorage.setItem(lockKey, lockValue);

            // Broadcast sync start event to other tabs
            const syncChannel = new BroadcastChannel('sync_channel');
            syncChannel.postMessage({ type: 'sync_start', lockValue });

            try {
                setIsSyncing(true);
                logger.info(`Starting sync of ${mutationQueue.length} offline actions.`);

                const offlineToRealIdMap: Record<string, string> = {};
                const successfullySyncedIndices: number[] = [];

                for (const [index, mutation] of mutationQueue.entries()) {
                    try {
                        if (mutation.type === 'addShipment') {
                            // Strip the offline ID and pending flag. DB will generate a new UUID.
                            const { products, id: offlineId, isPendingSync, ...shipmentData } = mutation.payload;

                            const shipmentRow = shipmentToRow(shipmentData);
                            if (!shipmentRow.created_by && currentUser?.id) {
                                shipmentRow.created_by = currentUser.id;
                            }

                            // Insert shipment and get new ID
                            const { data: newShipmentData, error: shipmentError } = await supabase
                                .from('shipments')
                                .insert(shipmentRow as any)
                                .select()
                                .single();

                            if (shipmentError) throw shipmentError;

                            logger.info('Mutation sync result:', { type: mutation.type, data: newShipmentData, error: shipmentError });

                            // Store mapping: offlineId -> real UUID
                            if (offlineId && String(offlineId).startsWith('offline-')) {
                                offlineToRealIdMap[offlineId] = newShipmentData.id;
                            }

                            // Insert products with NEW shipment ID
                            const shipmentProductsToInsert = products.map((p: ShipmentProduct) => ({
                                shipment_id: newShipmentData.id,
                                product_id: p.productId,
                                product_name: p.productName,
                                carton_count: p.cartonCount,
                                product_wage_price: p.productWagePrice
                            }));

                            const { error: productsError } = await supabase.from('shipment_products').insert(shipmentProductsToInsert);
                            if (productsError) throw productsError;

                            logger.info(`Successfully synced addShipment: ${newShipmentData.id}`);

                        } else if (mutation.type === 'updateShipment') {
                            let { shipmentId, updates } = mutation.payload;

                            // If this update is for an offline shipment we just synced, map the ID
                            if (offlineToRealIdMap[shipmentId]) {
                                shipmentId = offlineToRealIdMap[shipmentId];
                            }

                            const { products, ...shipmentUpdates } = updates;

                            // Update the main shipment record
                            if (Object.keys(shipmentUpdates).length > 0) {
                                const updateRow = shipmentToRow(shipmentUpdates);
                                logger.info(`Updating shipment ${shipmentId} with status:`, updateRow.status);
                                const { data, error } = await supabase.from('shipments').update(updateRow).eq('id', shipmentId).select();
                                if (error) throw error;
                                if (!data || data.length === 0) throw new Error('Update failed: no rows affected');
                                logger.info(`Successfully updated shipment ${shipmentId} status to: ${updateRow.status}`, { data });
                            }

                            // Update products if provided
                            if (products !== undefined) {
                                // Delete existing products for this shipment
                                const { data: deleteData, error: deleteError } = await supabase
                                    .from('shipment_products')
                                    .delete()
                                    .eq('shipment_id', shipmentId)
                                    .select();
                                if (deleteError) throw deleteError;
                                logger.info(`Deleted ${deleteData?.length || 0} products for shipment ${shipmentId}`);

                                // Insert new products if any
                                if (products.length > 0) {
                                    const shipmentProductsToInsert = products.map((p: ShipmentProduct) => ({
                                        shipment_id: shipmentId,
                                        product_id: p.productId,
                                        product_name: p.productName,
                                        carton_count: p.cartonCount,
                                        product_wage_price: p.productWagePrice
                                    }));

                                    const { data: productsData, error: productsError } = await supabase
                                        .from('shipment_products')
                                        .insert(shipmentProductsToInsert)
                                        .select();
                                    if (productsError) throw productsError;
                                    logger.info(`Inserted ${productsData?.length || 0} products for shipment ${shipmentId}`);
                                }
                            }
                        } else if (mutation.type === 'createInstallment') {
                            const installment = mutation.payload;

                            // Create installment record
                            const installmentRow = {
                                shipment_id: installment.shipmentId,
                                payable_amount: installment.payableAmount,
                                remaining_amount: installment.remainingAmount,
                                status: installment.status,
                                installment_type: installment.installmentType,
                                original_amount: installment.originalAmount,
                                notes: installment.notes,
                                created_by: currentUser?.id,
                                created_at: new Date().toISOString(),
                                updated_at: new Date().toISOString()
                            };

                            const { data: newInstallmentData, error: installmentError } = await (supabase as any)
                                .from('installments')
                                .insert(installmentRow)
                                .select()
                                .single();

                            if (installmentError) throw installmentError;

                            logger.info(`Successfully synced createInstallment: ${newInstallmentData.id}`);

                        } else if (mutation.type === 'updateInstallment') {
                            const { installmentId, updates } = mutation.payload;

                            const updateRow: any = { updated_at: new Date().toISOString() };
                            if (updates.payableAmount !== undefined) updateRow.payable_amount = updates.payableAmount;
                            if (updates.remainingAmount !== undefined) updateRow.remaining_amount = updates.remainingAmount;
                            if (updates.status !== undefined) updateRow.status = updates.status;
                            if (updates.installmentType !== undefined) updateRow.installment_type = updates.installmentType;
                            if (updates.originalAmount !== undefined) updateRow.original_amount = updates.originalAmount;
                            if (updates.notes !== undefined) updateRow.notes = updates.notes;
                            if (updates.updatedBy !== undefined) updateRow.updated_by = updates.updatedBy;

                            const { data, error } = await (supabase as any)
                                .from('installments')
                                .update(updateRow)
                                .eq('id', installmentId)
                                .select();

                            if (error) throw error;
                            if (!data || data.length === 0) throw new Error('Update failed: no rows affected');

                        } else if (mutation.type === 'addInstallmentPayment') {
                            const payment = mutation.payload;
                            const paymentRow = {
                                installment_id: payment.installmentId,
                                amount: payment.amount,
                                payment_method: payment.paymentMethod,
                                notes: payment.notes,
                                received_date: payment.receivedDate,
                                created_by: currentUser?.id,
                                created_at: new Date().toISOString()
                            };

                            const { data: newPaymentData, error: paymentError } = await (supabase as any)
                                .from('installment_payments')
                                .insert(paymentRow)
                                .select()
                                .single();

                            if (paymentError) throw paymentError;

                        } else if (mutation.type === 'updateInstallmentPayment') {
                            const { paymentId, updates } = mutation.payload;
                            const updateRow = { ...updates };
                            if (updates.receivedDate !== undefined) (updateRow as any).received_date = updates.receivedDate;
                            if (updates.paymentMethod !== undefined) (updateRow as any).payment_method = updates.paymentMethod;
                            if (updates.referenceNumber !== undefined) (updateRow as any).reference_number = updates.referenceNumber;

                            const { data, error } = await (supabase as any)
                                .from('installment_payments')
                                .update(updateRow)
                                .eq('id', paymentId)
                                .select();

                            if (error) throw error;
                            if (!data || data.length === 0) throw new Error('Update failed: no rows affected');
                        }

                        successfullySyncedIndices.push(index);
                    } catch (err) {
                        logger.error('Failed to sync mutation:', mutation, err);
                        // Keep failed mutation in queue for retry
                        logger.error(`Sync failed for ${mutation.type}:`, err);
                    }
                }

                // Remove successfully synced items
                const newQueue = mutationQueue.filter((_: any, index: number) => !successfullySyncedIndices.includes(index));
                await IndexedDB.setMutationQueue(newQueue);

                // Update sync status
                await updateSyncStatus();

                logger.info(`Sync completed: ${successfullySyncedIndices.length} mutations synced successfully`);

                // Refresh data from server
                await onRefresh();
                setIsSyncing(false);
                logger.info('Sync finished and data refreshed.');

            } finally {
                // Release lock only if we still own it
                const currentLock = localStorage.getItem(lockKey);
                if (currentLock === lockValue) {
                    localStorage.removeItem(lockKey);
                }

                // Broadcast sync completion
                syncChannel.postMessage({ type: 'sync_end', lockValue });
                syncChannel.close();
            }
        } catch (criticalError) {
            logger.error('Critical error during sync process:', criticalError);
            // Ensure sync status is updated even on critical failure
            try {
                await updateSyncStatus();
            } catch (statusError) {
                logger.warn('Failed to update sync status after critical error:', statusError);
            }
            // Don't rethrow to avoid crashing the hook consumer loop, just log
        }
    }, [currentUser, onRefresh]);

    // Online/Offline listener
    useEffect(() => {
        const handleOnline = async () => {
            logger.info('Connection restored - going online');
            setIsOnline(true);
            setError(null);

            try {
                await onRefresh();
                logger.info('Data refreshed from server');

                const pendingCount = await getSyncQueueCount();
                if (pendingCount > 0) {
                    logger.info(`User came online with ${pendingCount} pending offline operations`);
                    await addNotification({
                        message: `يوجد ${pendingCount} عمليات غير مزامنة من الجلسات السابقة. يمكنك مزامنتها يدوياً من خلال أيقونة المزامنة`,
                        category: NotificationCategory.SYSTEM,
                        targetRoles: [currentUser?.role || Role.SALES]
                    });
                }
            } catch (err) {
                logger.error('Error refreshing data:', err);
            }
        };

        const handleOffline = () => {
            logger.info('Connection lost - going offline');
            setIsOnline(false);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncOfflineMutations, onRefresh, addNotification, currentUser?.role]);

    // Listen for background sync events
    useEffect(() => {
        const handleBackgroundSync = (_event: CustomEvent) => {
            logger.info('Background sync event received, triggering sync');
            syncOfflineMutations().catch(err => {
                logger.error('Background sync failed:', err);
            });
        };

        window.addEventListener('background-sync-triggered', handleBackgroundSync as EventListener);
        return () => {
            window.removeEventListener('background-sync-triggered', handleBackgroundSync as EventListener);
        };
    }, [syncOfflineMutations]);

    // Real-time subscription
    useEffect(() => {
        const enableRealtime = (import.meta as any).env?.VITE_ENABLE_REALTIME !== 'false';

        if (!enableRealtime || !currentUser || !isOnline) {
            return;
        }

        logger.debug('Establishing realtime subscription for authenticated user');
        const shipmentsChannel = supabase
            .channel('shipments-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'shipments'
                },
                async (payload) => {
                    logger.debug('Shipments change detected:', payload);
                    if (isOnline) {
                        await onRefresh();
                    }
                }
            )
            .subscribe((status) => {
                logger.debug('Shipments subscription status:', status);
            });

        return () => {
            logger.info('Cleaning up shipments subscription');
            shipmentsChannel.unsubscribe();
        };
    }, [onRefresh, isOnline, currentUser]);

    return {
        isOnline,
        isSyncing,
        needsSync,
        setNeedsSync,
        syncOfflineMutations,
        error
    };
};
