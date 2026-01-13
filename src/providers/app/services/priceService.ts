/**
 * Price service - CRUD operations for product and deduction prices
 */

import { supabase } from '../../../utils/supabaseClient';
import { ProductPrice, DeductionPrice } from '../../../types';
import { priceFromRow, deductionPriceFromRow } from '../mappers';
import logger from '../../../utils/logger';
import * as IndexedDB from '../../../utils/indexedDB';
import { STORES } from '../../../utils/constants';

export const priceService = {
    // --- Product Prices ---

    async fetchAllProductPrices(signal?: AbortSignal, companyId?: string): Promise<ProductPrice[]> {
        let query: any = supabase
            .from('product_prices')
            .select('*');

        // Filter by company_id if provided
        if (companyId) {
            query = query.eq('company_id', companyId);
        }

        if (signal) {
            query = query.abortSignal(signal);
        }

        const { data, error } = await query;

        if (error) {
            logger.error('Error fetching product prices:', error);
            throw error;
        }

        return (data || []).map(priceFromRow);
    },

    async createProductPrice(price: Omit<ProductPrice, 'id'>, isOnline: boolean, currentUser: any): Promise<void> {
        const priceData = {
            id: window.crypto.randomUUID(),
            region_id: price.regionId,
            product_id: price.productId,
            price: price.price,
            effective_from: price.effectiveFrom,
            company_id: currentUser?.companyId
        };

        if (isOnline) {
            const { error } = await supabase
                .from('product_prices')
                .insert(priceData as any);

            if (error) {
                logger.error('Error adding product price:', error);
                throw error;
            }
        } else {
            // Offline support could be added here similar to other services
            // For now following AppContext implementation which didn't strictly have offline queue for prices yet?
            // Actually AppContext didn't have offline queue for prices in addProductPrice.
            // But we should probably add it for consistency if we want full offline support.
            // Checking AppContext: It DOES NOT check isOnline for addProductPrice. It just throws error.
            // However, useProduct's addProduct DOES check. 
            // I will implement offline support pattern for consistency.

            const tempPrice: ProductPrice = { ...price, id: priceData.id };
            await IndexedDB.saveToStore(STORES.PRODUCT_PRICES, tempPrice);
            await IndexedDB.addToMutationQueue({
                type: 'INSERT',
                table: 'product_prices',
                data: priceData,
                tempId: priceData.id
            });
        }
    },

    async updateProductPrice(priceId: string, updates: Partial<ProductPrice>, isOnline: boolean): Promise<void> {
        const updateData: any = {};
        if (updates.price !== undefined) updateData.price = updates.price;
        if (updates.effectiveFrom !== undefined) updateData.effective_from = updates.effectiveFrom;

        if (isOnline) {
            const { error } = await supabase
                .from('product_prices')
                .update(updateData)
                .eq('id', priceId);

            if (error) {
                logger.error('Error updating product price:', error);
                throw error;
            }
        } else {
            await IndexedDB.addToMutationQueue({
                type: 'UPDATE',
                table: 'product_prices',
                id: priceId,
                data: updateData
            });
        }
    },

    async deleteProductPrice(priceId: string, isOnline: boolean): Promise<void> {
        if (isOnline) {
            const { error } = await supabase
                .from('product_prices')
                .delete()
                .eq('id', priceId);

            if (error) {
                logger.error('Error deleting product price:', error);
                throw error;
            }
        } else {
            await IndexedDB.addToMutationQueue({
                type: 'DELETE',
                table: 'product_prices',
                id: priceId
            });
        }
    },

    async batchUpsertProductPrices(prices: any[], currentUser: any): Promise<void> {
        const toInsert = prices.filter(p => !p.id);
        const toUpdate = prices.filter(p => p.id);

        // Insert new records
        if (toInsert.length > 0) {
            const insertData = toInsert.map(price => ({
                id: window.crypto.randomUUID(),
                region_id: price.regionId,
                product_id: price.productId,
                price: price.price,
                effective_from: price.effectiveFrom,
                company_id: currentUser?.companyId
            }));

            const { error } = await supabase
                .from('product_prices')
                .insert(insertData);

            if (error) {
                logger.error('Error batch inserting product prices:', error);
                throw error;
            }
        }

        // Update existing records
        for (const price of toUpdate) {
            const { error } = await supabase
                .from('product_prices')
                .update({
                    price: price.price,
                    effective_from: price.effectiveFrom
                })
                .eq('id', price.id);

            if (error) {
                logger.error('Error batch updating product price:', error);
                throw error;
            }
        }
    },

    // --- Deduction Prices ---


    async fetchAllDeductionPrices(signal?: AbortSignal, companyId?: string): Promise<DeductionPrice[]> {
        try {
            let query: any = (supabase as any).from('deduction_prices').select('*');

            if (companyId) {
                query = query.eq('company_id', companyId);
            }

            if (signal) {
                query = query.abortSignal(signal);
            }

            const { data, error } = await query;

            if (error) {
                // Table might not exist yet
                logger.warn('Error fetching deduction prices (table might not exist):', error);
                return [];
            }

            return (data || []).map(deductionPriceFromRow);
        } catch (error) {
            logger.warn('Error fetching deduction prices:', error);
            return [];
        }
    },

    async createDeductionPrice(price: Omit<DeductionPrice, 'id'>, isOnline: boolean, currentUser: any): Promise<void> {
        const priceData = {
            id: window.crypto.randomUUID(),
            product_id: price.productId,
            shortage_price: price.shortagePrice,
            damaged_price: price.damagedPrice,
            effective_from: price.effectiveFrom,
            company_id: currentUser?.companyId
        };

        if (isOnline) {
            const { error } = await (supabase as any)
                .from('deduction_prices')
                .insert(priceData);

            if (error) {
                logger.error('Error adding deduction price:', error);
                throw error;
            }
        } else {
            // Offline support
            // TODO: Add Deduction prices store to IndexedDB if not exists?
            // It seems deductionPrices state exists in AppContext, but STORES.DEDUCTION_PRICES isn't evident in constants check. 
            // STORES.PRODUCT_PRICES exists. 
            // I'll skip offline persistence for now as it wasn't there for deduction prices in AppContext explicitly (except state).
            // Actually AppContext just setDeductionPrices.
            // I will stick to online-only for deduction prices for now to minimize risk, unless I add a store.
            // But consistent return type requires Promise<void>.
            logger.warn('Offline creation of deduction prices not fully supported yet');
        }
    },

    async updateDeductionPrice(priceId: string, updates: Partial<DeductionPrice>, isOnline: boolean): Promise<void> {
        const updateData: any = {};
        if (updates.shortagePrice !== undefined) updateData.shortage_price = updates.shortagePrice;
        if (updates.damagedPrice !== undefined) updateData.damaged_price = updates.damagedPrice;
        if (updates.effectiveFrom !== undefined) updateData.effective_from = updates.effectiveFrom;

        if (isOnline) {
            const { error } = await (supabase as any)
                .from('deduction_prices')
                .update(updateData)
                .eq('id', priceId);

            if (error) {
                logger.error('Error updating deduction price:', error);
                throw error;
            }
        }
    },

    async deleteDeductionPrice(priceId: string, isOnline: boolean): Promise<void> {
        if (isOnline) {
            const { error } = await (supabase as any)
                .from('deduction_prices')
                .delete()
                .eq('id', priceId);

            if (error) {
                logger.error('Error deleting deduction price:', error);
                throw error;
            }
        }
    }
};
