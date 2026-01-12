/**
 * Driver service - CRUD operations for drivers
 */

import { supabase } from '../../../utils/supabaseClient';
import { Driver } from '../../../types';
import { driverFromRow } from '../mappers';
import logger from '../../../utils/logger';
import * as IndexedDB from '../../../utils/indexedDB';
import { STORES } from '../../../utils/constants';

export const driverService = {
    async fetchAll(): Promise<Driver[]> {
        const { data, error } = await supabase
            .from('drivers')
            .select('*')
            .order('name');

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
            await IndexedDB.addToStore(STORES.DRIVERS, tempDriver);
            await IndexedDB.queueMutation({
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
            await IndexedDB.queueMutation({
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
        } else {
            await IndexedDB.queueMutation({
                type: 'DELETE',
                table: 'drivers',
                id: driverId.toString(),
            });
        }
    },
};
