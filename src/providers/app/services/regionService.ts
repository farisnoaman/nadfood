/**
 * Region service - CRUD operations for regions
 */

import { supabase } from '../../../utils/supabaseClient';
import { Region } from '../../../types';
import { regionFromRow } from '../mappers';
import logger from '../../../utils/logger';
import * as IndexedDB from '../../../utils/indexedDB';
import { STORES } from '../../../utils/constants';

export const regionService = {
    async fetchAll(signal?: AbortSignal, companyId?: string): Promise<Region[]> {
        let query: any = supabase
            .from('regions')
            .select('*')
            .order('name');

        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        if (signal) {
            query = query.abortSignal(signal);
        }

        const { data, error } = await query;

        if (error) {
            logger.error('Error fetching regions:', error);
            throw error;
        }

        return (data || []).map(regionFromRow);
    },

    async create(region: Omit<Region, 'id'>, isOnline: boolean, currentUser: any): Promise<void> {
        const regionData = {
            id: window.crypto.randomUUID(),
            name: region.name,
            diesel_liter_price: region.dieselLiterPrice,
            diesel_liters: region.dieselLiters,
            zaitri_fee: region.zaitriFee,
            road_expenses: region.roadExpenses,
            company_id: currentUser?.companyId,
        };

        if (isOnline) {
            const { error } = await supabase
                .from('regions')
                .insert([regionData]);

            if (error) {
                logger.error('Error adding region:', error);
                throw error;
            }
        } else {
            const tempId = regionData.id;
            const tempRegion: Region = {
                ...region,
                id: tempId,
            };
            await IndexedDB.saveToStore(STORES.REGIONS, tempRegion);
            await IndexedDB.addToMutationQueue({
                type: 'INSERT',
                table: 'regions',
                data: regionData,
                tempId,
            });
        }
    },

    async update(regionId: string, updates: Partial<Region>, isOnline: boolean): Promise<void> {
        const updateData: any = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.dieselLiterPrice !== undefined) updateData.diesel_liter_price = updates.dieselLiterPrice;
        if (updates.dieselLiters !== undefined) updateData.diesel_liters = updates.dieselLiters;
        if (updates.zaitriFee !== undefined) updateData.zaitri_fee = updates.zaitriFee;
        if (updates.roadExpenses !== undefined) updateData.road_expenses = updates.roadExpenses;

        if (isOnline) {
            const { error } = await supabase
                .from('regions')
                .update(updateData)
                .eq('id', regionId);

            if (error) {
                logger.error('Error updating region:', error);
                throw error;
            }
        } else {
            await IndexedDB.addToMutationQueue({
                type: 'UPDATE',
                table: 'regions',
                id: regionId,
                data: updateData,
            });
        }
    },

    async delete(regionId: string, isOnline: boolean): Promise<void> {
        if (isOnline) {
            const { error } = await supabase
                .from('regions')
                .delete()
                .eq('id', regionId);

            if (error) {
                logger.error('Error deleting region:', error);
                throw error;
            }
        } else {
            await IndexedDB.addToMutationQueue({
                type: 'DELETE',
                table: 'regions',
                id: regionId,
            });
        }
    },
};
