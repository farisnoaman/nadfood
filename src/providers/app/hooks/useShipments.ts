import { useState, useCallback } from 'react';
import { Shipment, User } from '../types';
import { supabase } from '../../../utils/supabaseClient';
import * as IndexedDB from '../../../utils/indexedDB';
import { STORES } from '../../../utils/constants';
import { shipmentToRow } from '../mappers';
import logger from '../../../utils/logger';

export const useShipments = (
    isOnline: boolean,
    currentUser: User | null,
    onRefresh: () => Promise<void>
) => {
    const [shipments, setShipments] = useState<Shipment[]>([]);

    const checkShipmentExists = useCallback(async (orderNumber: string, companyId: string | undefined) => {
        if (!companyId) return false;

        const { data, error } = await supabase
            .from('shipments')
            .select('id')
            .eq('sales_order', orderNumber)
            .eq('company_id', companyId)
            .maybeSingle();

        if (error) {
            logger.error('Error checking for duplicate shipment:', error);
            return false; // Fail open to avoid blocking valid creations on network error
        }

        return !!data;
    }, []);

    const addShipment = useCallback(async (shipment: Omit<Shipment, 'id'>) => {
        if (!isOnline) {
            logger.info('Offline: Queuing shipment creation.');
            const offlineShipment: Shipment = {
                ...shipment,
                id: `offline-${crypto.randomUUID()}`,
                isPendingSync: true
            };

            const currentShipments = await IndexedDB.getAllFromStore<Shipment>(STORES.SHIPMENTS);
            const updatedShipments = [offlineShipment, ...currentShipments];
            setShipments(updatedShipments);
            await IndexedDB.saveAllToStore(STORES.SHIPMENTS, updatedShipments);
            await IndexedDB.addToMutationQueue({
                type: 'addShipment',
                payload: offlineShipment,
                userId: currentUser?.id
            });
            return;
        }

        const { products, ...shipmentData } = shipment;
        const shipmentToInsert = {
            ...shipmentToRow(shipmentData),
            id: crypto.randomUUID(),
            created_by: currentUser?.id,
            company_id: currentUser?.companyId
        } as any;

        // Pre-flight check for duplicates
        const exists = await checkShipmentExists(shipmentData.salesOrder, currentUser?.companyId);
        if (exists) {
            throw new Error('رقم الشحنة موجود بالفعل لهذه الشركة');
        }

        const { data: newShipmentData, error: shipmentError } = await supabase
            .from('shipments')
            .insert(shipmentToInsert)
            .select()
            .single();

        if (shipmentError) throw shipmentError;

        const shipmentProductsToInsert = products.map(p => ({
            shipment_id: newShipmentData.id,
            product_id: p.productId,
            product_name: p.productName,
            carton_count: p.cartonCount,
            product_wage_price: p.productWagePrice
        }));

        const { error: productsError } = await supabase
            .from('shipment_products')
            .insert(shipmentProductsToInsert);

        if (productsError) {
            logger.error("Failed to insert products for shipment:", newShipmentData.id, productsError);
            throw productsError;
        }

        await onRefresh();
    }, [currentUser, onRefresh, isOnline, checkShipmentExists]);

    const updateShipment = useCallback(async (shipmentId: string, updates: Partial<Shipment>) => {
        if (!isOnline) {
            logger.info('Offline: Queuing shipment update.');
            updates.updated_at = new Date().toISOString();

            const updatedShipments = shipments.map(s =>
                s.id === shipmentId ? { ...s, ...updates } : s
            );
            setShipments(updatedShipments);
            await IndexedDB.saveAllToStore(STORES.SHIPMENTS, updatedShipments);
            await IndexedDB.addToMutationQueue({
                type: 'updateShipment',
                payload: { shipmentId, updates },
                userId: currentUser?.id
            });
            return;
        }

        const { products, ...shipmentUpdates } = updates;

        if (Object.keys(shipmentUpdates).length > 0) {
            const updateRow = shipmentToRow(shipmentUpdates);

            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const { data, error } = await supabase
                        .from('shipments')
                        .update(updateRow)
                        .eq('id', shipmentId)
                        .select();

                    if (error) throw error;
                    if (!data || data.length === 0) throw new Error('Update failed: no rows affected');
                    break;
                } catch (err: any) {
                    if (attempt < 3 && err?.message?.includes('network')) {
                        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
                        continue;
                    }
                    throw err;
                }
            }
        }

        if (products && products.length > 0) {
            await supabase.from('shipment_products').delete().eq('shipment_id', shipmentId);
            const shipmentProductsToInsert = products.map(p => ({
                shipment_id: shipmentId,
                product_id: p.productId,
                product_name: p.productName,
                carton_count: p.cartonCount,
                product_wage_price: p.productWagePrice
            }));

            if (shipmentProductsToInsert.length > 0) {
                const { error: productsError } = await supabase
                    .from('shipment_products')
                    .insert(shipmentProductsToInsert);
                if (productsError) throw productsError;
            }
        }

        updates.updated_at = new Date().toISOString();
        const updatedShipments = shipments.map(s =>
            s.id === shipmentId ? { ...s, ...updates } : s
        );
        setShipments(updatedShipments);

        await onRefresh();
    }, [onRefresh, isOnline, shipments, currentUser]);

    return {
        shipments,
        setShipments,
        addShipment,
        updateShipment
    };
};
