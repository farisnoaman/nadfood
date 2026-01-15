/**
 * Product service - CRUD operations for products
 */

import { supabase } from '../../../utils/supabaseClient';
import SupabaseService from '../../../utils/supabaseService';
import { Product } from '../../../types';
import { productFromRow } from '../mappers';
import logger from '../../../utils/logger';
import * as IndexedDB from '../../../utils/indexedDB';
import { STORES } from '../../../utils/constants';

export const productService = {
    async fetchAll(signal?: AbortSignal, companyId?: string): Promise<Product[]> {
        const { data, error } = await SupabaseService.fetchAll('products', (query) => {
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
            logger.error('Error fetching products:', error);
            throw error;
        }

        return (data || []).map(productFromRow);
    },

    async create(product: Omit<Product, 'id'>, isOnline: boolean, currentUser: any): Promise<void> {
        const productData = {
            id: window.crypto.randomUUID(),
            name: product.name,
            is_active: product.isActive,
            weight_kg: product.weightKg,
            company_id: currentUser?.companyId,
        };

        if (isOnline) {
            const { error } = await supabase
                .from('products')
                .insert([productData]);

            if (error) {
                logger.error('Error adding product:', error);
                throw error;
            }
        } else {
            // Offline: queue mutation
            const tempId = productData.id;
            const tempProduct: Product = {
                ...product,
                id: tempId,
            };
            await IndexedDB.saveToStore(STORES.PRODUCTS, tempProduct);
            await IndexedDB.addToMutationQueue({
                type: 'INSERT',
                table: 'products',
                data: productData,
                tempId,
            });
        }
    },

    async update(productId: string, updates: Partial<Product>, isOnline: boolean): Promise<void> {
        const updateData: any = {};
        if (updates.name !== undefined) updateData.name = updates.name;
        if (updates.isActive !== undefined) updateData.is_active = updates.isActive;
        if (updates.weightKg !== undefined) updateData.weight_kg = updates.weightKg;

        if (isOnline) {
            const { error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', productId);

            if (error) {
                logger.error('Error updating product:', error);
                throw error;
            }
        } else {
            await IndexedDB.addToMutationQueue({
                type: 'UPDATE',
                table: 'products',
                id: productId,
                data: updateData,
            });
        }
    },

    async delete(productId: string, isOnline: boolean): Promise<void> {
        if (isOnline) {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) {
                logger.error('Error deleting product:', error);
                throw error;
            }
        } else {
            await IndexedDB.addToMutationQueue({
                type: 'DELETE',
                table: 'products',
                id: productId,
            });
        }
    },
    async batchUpsertProducts(products: (Omit<Product, 'id'> & { id?: string })[], currentUser: any): Promise<void> {
        if (!products.length) return;

        const toInsert = products.filter(p => !p.id);
        const toUpdate = products.filter(p => p.id);

        // Insert new records
        if (toInsert.length > 0) {
            const insertData = toInsert.map(p => ({
                id: window.crypto.randomUUID(),
                name: p.name,
                is_active: p.isActive,
                weight_kg: p.weightKg,
                company_id: currentUser?.companyId,
            }));

            const { error } = await supabase
                .from('products')
                .insert(insertData);

            if (error) {
                logger.error('Error batch inserting products:', error);
                throw error;
            }
        }

        // Update existing records
        for (const product of toUpdate) {
            const { error } = await supabase
                .from('products')
                .update({
                    name: product.name,
                    is_active: product.isActive,
                    weight_kg: product.weightKg,
                })
                .eq('id', product.id);

            if (error) {
                logger.error('Error batch updating product:', error);
                throw error;
            }
        }
    },
};
