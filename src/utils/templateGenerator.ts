/**
 * Template Generator for batch import CSV downloads
 * Generates CSV templates with existing data for user reference
 */

import { ProductPrice, RegionConfig, Region, Product, Driver } from '../types';
import { generateCSV } from './csvUtils';

interface PricesTemplateData {
    productPrices: ProductPrice[];
    regions: Region[];
    products: Product[];
}

interface RegionConfigsTemplateData {
    regionConfigs: RegionConfig[];
    regions: Region[];
}

/**
 * Generate a CSV template for product prices with existing data
 */
export function generatePricesCSV(data: PricesTemplateData): string {
    const headers = ['المنطقة', 'المنتج', 'السعر', 'تاريخ السريان'];

    const rows: string[][] = data.productPrices.map(price => {
        const region = data.regions.find(r => r.id === price.regionId);
        const product = data.products.find(p => p.id === price.productId);

        return [
            region?.name || '',
            product?.name || '',
            price.price.toString(),
            price.effectiveFrom
        ];
    });

    // If no data, add a sample row
    if (rows.length === 0 && data.regions.length > 0 && data.products.length > 0) {
        rows.push([
            data.regions[0]?.name || 'اسم المنطقة',
            data.products[0]?.name || 'اسم المنتج',
            '0',
            new Date().toISOString().split('T')[0]
        ]);
    }

    return generateCSV(headers, rows);
}

/**
 * Generate a CSV template for region configs (fees) with existing data
 */
export function generateRegionConfigsCSV(data: RegionConfigsTemplateData): string {
    const headers = ['المنطقة', 'سعر الديزل', 'كمية الديزل', 'رسوم زعيتري', 'خرج الطريق', 'تاريخ السريان'];

    const rows: string[][] = data.regionConfigs.map(config => {
        const region = data.regions.find(r => r.id === config.regionId);

        return [
            region?.name || '',
            config.dieselLiterPrice.toString(),
            config.dieselLiters.toString(),
            config.zaitriFee.toString(),
            config.roadExpenses.toString(),
            config.effectiveFrom
        ];
    });

    // If no data, add a sample row for each region
    if (rows.length === 0) {
        data.regions.forEach(region => {
            rows.push([
                region.name,
                '0',
                '0',
                '0',
                '0',
                new Date().toISOString().split('T')[0]
            ]);
        });
    }

    return generateCSV(headers, rows);
}

/**
 * Generate a CSV template for regions
 */
export function generateRegionsCSV(regions: Region[]): string {
    const headers = ['اسم المنطقة'];
    const rows = regions.map(r => [r.name]);

    if (rows.length === 0) {
        rows.push(['مثال: المنطقة الشرقية']);
    }

    return generateCSV(headers, rows);
}

/**
 * Generate a CSV template for products
 */
export function generateProductsCSV(products: Product[]): string {
    const headers = ['اسم المنتج', 'فعال', 'الوزن (كجم)'];
    const rows = products.map(p => [
        p.name,
        p.isActive ? 'نعم' : 'لا',
        p.weightKg.toString()
    ]);

    if (rows.length === 0) {
        rows.push(['مثال: أرز بسمتي', 'نعم', '50']);
    }

    return generateCSV(headers, rows);
}

/**
 * Generate a CSV template for drivers
 */
export function generateDriversCSV(drivers: Driver[]): string {
    const headers = ['اسم السائق', 'رقم اللوحة', 'فعال'];
    const rows = drivers.map(d => [
        d.name,
        d.plateNumber,
        d.isActive ? 'نعم' : 'لا'
    ]);

    if (rows.length === 0) {
        rows.push(['مثال: أحمد محمد', 'أ ب ت 1234', 'نعم']);
    }

    return generateCSV(headers, rows);
}
