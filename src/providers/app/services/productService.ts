/**
 * Product service - CRUD operations for products
 */

import { supabase } from '../../../utils/supabaseClient';
import { Product } from '../../../types';
import { productFromRow } from '../mappers';
import logger from '../../../utils/logger';
import * as IndexedDB from '../../../utils/indexedDB';
import { STORES } from '../../../utils/constants';

export const productService = {
    async fetchAll(signal?: AbortSignal): Promise<Product[]> {
        let query = supabase
            .from('products')
            .select('*')
            .order('name');

        if (signal) {
            query = query.abortSignal(signal);
        }

        const { data, error } = await query;

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
};
