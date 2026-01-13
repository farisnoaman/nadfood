/**
 * Master Catalog Service - Operations for platform-managed master products and regions
 */

import { supabase } from '../../../utils/supabaseClient';
import { MasterProduct, MasterRegion } from '../../../types';
import logger from '../../../utils/logger';

export const masterCatalogService = {
    /**
     * Fetch all active master products from platform catalog
     */
    async fetchMasterProducts(signal?: AbortSignal): Promise<MasterProduct[]> {
        let query = supabase
            .from('master_products')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (signal) {
            query = query.abortSignal(signal);
        }

        const { data, error } = await query;

        if (error) {
            logger.error('Error fetching master products:', error);
            throw error;
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            unitType: row.unit_type,
            defaultPrice: row.default_price,
            weightKg: row.weight_kg,
            isActive: row.is_active,
            category: row.category,
            description: row.description,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    },

    /**
     * Fetch all active master regions from platform catalog
     */
    async fetchMasterRegions(signal?: AbortSignal): Promise<MasterRegion[]> {
        let query = supabase
            .from('master_regions')
            .select('*')
            .eq('is_active', true)
            .order('name');

        if (signal) {
            query = query.abortSignal(signal);
        }

        const { data, error } = await query;

        if (error) {
            logger.error('Error fetching master regions:', error);
            throw error;
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            name: row.name,
            regionCode: row.region_code,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        }));
    },

    /**
     * Fetch a single master product by ID
     */
    async fetchMasterProductById(id: string): Promise<MasterProduct> {
        const { data, error } = await supabase
            .from('master_products')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            logger.error('Error fetching master product:', error);
            throw error;
        }

        return {
            id: data.id,
            name: data.name,
            unitType: data.unit_type,
            defaultPrice: data.default_price,
            weightKg: data.weight_kg,
            isActive: data.is_active,
            category: data.category,
            description: data.description,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    /**
     * Fetch a single master region by ID
     */
    async fetchMasterRegionById(id: string): Promise<MasterRegion> {
        const { data, error } = await supabase
            .from('master_regions')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            logger.error('Error fetching master region:', error);
            throw error;
        }

        return {
            id: data.id,
            name: data.name,
            regionCode: data.region_code,
            isActive: data.is_active,
            createdAt: data.created_at,
            updatedAt: data.updated_at
        };
    },

    /**
     * Link a master product to a company's catalog
     * Creates a new product record linked to the master
     */
    async linkMasterProduct(
        masterProductId: string,
        companyId: string
    ): Promise<string> {
        const masterProduct = await this.fetchMasterProductById(masterProductId);

        const productData = {
            id: window.crypto.randomUUID(),
            name: masterProduct.name,
            weight_kg: masterProduct.weightKg,
            is_active: true,
            company_id: companyId,
            master_product_id: masterProductId,
            is_custom: false
        };

        const { error } = await supabase.from('products').insert(productData);

        if (error) {
            logger.error('Error linking master product:', error);
            throw error;
        }

        return productData.id;
    },

    /**
     * Link a master region to a company's catalog
     * Creates a new region record linked to the master
     */
    async linkMasterRegion(
        masterRegionId: string,
        companyId: string
    ): Promise<string> {
        const masterRegion = await this.fetchMasterRegionById(masterRegionId);

        const regionData = {
            id: window.crypto.randomUUID(),
            name: masterRegion.name,
            diesel_liter_price: 0, // Company will set their own pricing
            diesel_liters: 0,
            zaitri_fee: 0,
            road_expenses: 0,
            company_id: companyId,
            master_region_id: masterRegionId,
            is_custom: false
        };

        const { error } = await supabase.from('regions').insert(regionData);

        if (error) {
            logger.error('Error linking master region:', error);
            throw error;
        }

        return regionData.id;
    },

    /**
     * Bulk link multiple master products to a company
     */
    async bulkLinkMasterProducts(
        masterProductIds: string[],
        companyId: string
    ): Promise<number> {
        let successCount = 0;

        for (const masterProductId of masterProductIds) {
            try {
                await this.linkMasterProduct(masterProductId, companyId);
                successCount++;
            } catch (error) {
                logger.error(`Failed to link master product ${masterProductId}:`, error);
                // Continue with other products even if one fails
            }
        }

        return successCount;
    },

    /**
     * Bulk link multiple master regions to a company
     */
    async bulkLinkMasterRegions(
        masterRegionIds: string[],
        companyId: string
    ): Promise<number> {
        let successCount = 0;

        for (const masterRegionId of masterRegionIds) {
            try {
                await this.linkMasterRegion(masterRegionId, companyId);
                successCount++;
            } catch (error) {
                logger.error(`Failed to link master region ${masterRegionId}:`, error);
                // Continue with other regions even if one fails
            }
        }

        return successCount;
    },

    /**
     * Check if a master product is already linked to a company
     */
    async isMasterProductLinked(
        masterProductId: string,
        companyId: string
    ): Promise<boolean> {
        const { data, error } = await supabase
            .from('products')
            .select('id')
            .eq('master_product_id', masterProductId)
            .eq('company_id', companyId)
            .maybeSingle();

        if (error) {
            logger.error('Error checking master product link:', error);
            return false;
        }

        return !!data;
    },

    /**
     * Check if a master region is already linked to a company
     */
    async isMasterRegionLinked(
        masterRegionId: string,
        companyId: string
    ): Promise<boolean> {
        const { data, error } = await supabase
            .from('regions')
            .select('id')
            .eq('master_region_id', masterRegionId)
            .eq('company_id', companyId)
            .maybeSingle();

        if (error) {
            logger.error('Error checking master region link:', error);
            return false;
        }

        return !!data;
    }
};
