/**
 * Driver service - CRUD operations for drivers
 */

import { supabase } from '../../../utils/supabaseClient';
import SupabaseService from '../../../utils/supabaseService';
import { Driver } from '../../../types';
import { driverFromRow } from '../mappers';
import logger from '../../../utils/logger';
import * as IndexedDB from '../../../utils/indexedDB';
import { STORES } from '../../../utils/constants';

export const driverService = {
    async fetchAll(signal?: AbortSignal, companyId?: string): Promise<Driver[]> {
        const { data, error } = await SupabaseService.fetchAll('drivers', (query) => {
            let q = query.order('name');
            if (companyId) {
                q = q.eq('company_id', companyId);
            }
            if (signal) {
                q = q.abortSignal(signal);
            }
            return q;
        });

        if (error) {
            logger.error('Error fetching drivers:', error);
            throw error;
        }

        return (data || []).map(driverFromRow);
    },

    async create(driver: Omit<Driver, 'id'>, isOnline: boolean, currentUser: any): Promise<void> {
        const driverData = {
            name: driver.name,
            plate_number: driver.plateNumber,
            is_active: driver.isActive,
            company_id: currentUser?.companyId,
        };

        if (isOnline) {
            const { error } = await supabase
                .from('drivers')
                .insert([driverData]);

            if (error) {
                logger.error('Error adding driver:', error);
                throw error;
            }
        } else {
            const tempId = Date.now();
            const tempDriver: Driver = {
                ...driver,
                id: tempId,
            };
            await IndexedDB.saveToStore(STORES.DRIVERS, tempDriver);
            await IndexedDB.addToMutationQueue({
                type: 'INSERT',
                table: 'drivers',
                data: driverData,
                tempId: tempId.toString(),
            });
        }
    },

    async update(driverId: number, updates: Partial<Driver>, isOnline: boolean): Promise<void> {
        const updateData: any = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.plateNumber !== undefined) updateData.plate_number = updates.plateNumber;
        if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

        if (isOnline) {
            const { error } = await supabase
                .from('drivers')
                .update(updateData)
                .eq('id', driverId);

            if (error) {
                logger.error('Error updating driver:', error);
                throw error;
            }
        } else {
            await IndexedDB.addToMutationQueue({
                type: 'UPDATE',
                table: 'drivers',
                id: driverId.toString(),
                data: updateData,
            });
        }
    },

    async delete(driverId: number, isOnline: boolean): Promise<void> {
        if (isOnline) {
            const { error } = await supabase
                .from('drivers')
                .delete()
                .eq('id', driverId);

            if (error) {
                logger.error('Error deleting driver:', error);
                throw error;
            }
        }
    },

    async batchUpsertDrivers(drivers: (Omit<Driver, 'id'> & { id?: number })[], currentUser: any): Promise<void> {
        if (!drivers.length) return;

        const driversData = drivers.map(d => ({
            ...(d.id ? { id: d.id } : {}),
            name: d.name,
            plate_number: d.plateNumber,
            is_active: d.isActive,
            company_id: currentUser?.companyId,
        }));

        const { error } = await supabase
            .from('drivers')
            .upsert(driversData, { onConflict: 'id' });

        if (error) {
            logger.error('Error batch upserting drivers:', error);
            throw error;
        }
    },
};
