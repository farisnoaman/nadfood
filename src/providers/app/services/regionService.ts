/**
 * Region service - CRUD operations for regions
 */

import { supabase } from '../../../utils/supabaseClient';
import SupabaseService from '../../../utils/supabaseService';
import { Region } from '../../../types';
import { regionFromRow } from '../mappers';
import logger from '../../../utils/logger';
import * as IndexedDB from '../../../utils/indexedDB';
import { STORES } from '../../../utils/constants';

export const regionService = {
    async fetchAll(signal?: AbortSignal, companyId?: string): Promise<Region[]> {
        const { data, error } = await SupabaseService.fetchAll('regions', (query) => {
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
            admin_expenses: region.adminExpenses,
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
        if (updates.adminExpenses !== undefined) updateData.admin_expenses = updates.adminExpenses;

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
        }
    },

    async batchUpsertRegions(regions: (Omit<Region, 'id'> & { id?: string })[], currentUser: any): Promise<void> {
        if (!regions.length) return;

        const regionsData = regions.map(r => ({
            id: r.id || window.crypto.randomUUID(),
            name: r.name,
            company_id: currentUser?.companyId,
        }));

        const { error } = await supabase
            .from('regions')
            .upsert(regionsData, { onConflict: 'id' });

        if (error) {
            logger.error('Error batch upserting regions:', error);
            throw error;
        }
    },

    // --- Region Configs ---

    async fetchAllConfigs(signal?: AbortSignal, companyId?: string): Promise<any[]> {
        const { data, error } = await SupabaseService.fetchAll('region_configs', (query) => {
            let q = query.order('effective_from', { ascending: false });
            if (companyId) {
                q = q.eq('company_id', companyId);
            }
            if (signal) {
                q = q.abortSignal(signal);
            }
            return q;
        });

        if (error) {
            logger.warn('Error fetching region configs:', error);
            return [];
        }

        if (error) {
            logger.warn('Error fetching region configs:', error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            regionId: row.region_id,
            dieselLiterPrice: row.diesel_liter_price,
            dieselLiters: row.diesel_liters,
            zaitriFee: row.zaitri_fee,
            roadExpenses: row.road_expenses,
            adminExpenses: row.admin_expenses || 0,
            effectiveFrom: row.effective_from,
        }));
    },

    async createConfig(config: any, isOnline: boolean, currentUser: any): Promise<void> {
        const configData = {
            id: window.crypto.randomUUID(),
            region_id: config.regionId,
            diesel_liter_price: config.dieselLiterPrice,
            diesel_liters: config.dieselLiters,
            zaitri_fee: config.zaitriFee,
            road_expenses: config.roadExpenses,
            admin_expenses: config.adminExpenses,
            effective_from: config.effectiveFrom,
            company_id: currentUser?.companyId,
        };

        if (isOnline) {
            const { error } = await (supabase as any)
                .from('region_configs')
                .insert([configData]);

            if (error) {
                logger.error('Error adding region config:', error);
                throw error;
            }
        } else {
            logger.warn('Offline creation of region configs not supported yet');
        }
    },

    async updateConfig(configId: string, updates: any, isOnline: boolean): Promise<void> {
        const updateData: any = {};
        if (updates.dieselLiterPrice !== undefined) updateData.diesel_liter_price = updates.dieselLiterPrice;
        if (updates.dieselLiters !== undefined) updateData.diesel_liters = updates.dieselLiters;
        if (updates.zaitriFee !== undefined) updateData.zaitri_fee = updates.zaitriFee;
        if (updates.roadExpenses !== undefined) updateData.road_expenses = updates.roadExpenses;
        if (updates.adminExpenses !== undefined) updateData.admin_expenses = updates.adminExpenses;
        if (updates.effectiveFrom !== undefined) updateData.effective_from = updates.effectiveFrom;

        if (isOnline) {
            const { error } = await (supabase as any)
                .from('region_configs')
                .update(updateData)
                .eq('id', configId);

            if (error) {
                logger.error('Error updating region config:', error);
                throw error;
            }
        }
    },

    async deleteConfig(configId: string, isOnline: boolean): Promise<void> {
        if (isOnline) {
            const { error } = await (supabase as any)
                .from('region_configs')
                .delete()
                .eq('id', configId);

            if (error) {
                logger.error('Error deleting region config:', error);
                throw error;
            }
        }
    },

    async batchUpsertConfigs(configs: any[], currentUser: any): Promise<void> {
        const toInsert = configs.filter(c => !c.id);
        const toUpdate = configs.filter(c => c.id);

        // Insert new records
        if (toInsert.length > 0) {
            const insertData = toInsert.map(config => ({
                id: window.crypto.randomUUID(),
                region_id: config.regionId,
                diesel_liter_price: config.dieselLiterPrice,
                diesel_liters: config.dieselLiters,
                zaitri_fee: config.zaitriFee,
                road_expenses: config.roadExpenses,
                admin_expenses: config.adminExpenses,
                effective_from: config.effectiveFrom,
                company_id: currentUser?.companyId
            }));

            const { error } = await (supabase as any)
                .from('region_configs')
                .insert(insertData);

            if (error) {
                logger.error('Error batch inserting region configs:', error);
                throw error;
            }
        }

        // Update existing records
        for (const config of toUpdate) {
            const { error } = await (supabase as any)
                .from('region_configs')
                .update({
                    diesel_liter_price: config.dieselLiterPrice,
                    diesel_liters: config.dieselLiters,
                    zaitri_fee: config.zaitriFee,
                    road_expenses: config.roadExpenses,
                    admin_expenses: config.adminExpenses,
                    effective_from: config.effectiveFrom
                })
                .eq('id', config.id);

            if (error) {
                logger.error('Error batch updating region config:', error);
                throw error;
            }
        }
    },
};
