/**
 * Data Export Utilities
 * Fix for M-10: Add data export functionality
 */

import { Shipment, Product, Driver, Region, ProductPrice } from '../types';
import { formatDateForDisplay } from './dateFormatter';

/**
 * Convert array of objects to CSV format
 */
const arrayToCSV = (data: any[], headers: string[]): string => {
  const csvRows = [];
  
  // Add BOM for UTF-8 Excel compatibility
  csvRows.push('\uFEFF');
  
  // Add headers
  csvRows.push(headers.join(','));
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape commas and quotes
      const escaped = String(value || '').replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
};

/**
 * Download CSV file
 */
const downloadCSV = (csvContent: string, filename: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Export shipments to CSV
 */
export const exportShipmentsToCSV = (shipments: Shipment[], regions: Region[], drivers: Driver[]): void => {
  const data = shipments.map(s => {
    const region = regions.find(r => r.id === s.regionId);
    const driver = drivers.find(d => d.id === s.driverId);
    return {
      'رقم أمر المبيعات': s.salesOrder,
      'التاريخ': formatDateForDisplay(s.orderDate),
      'المنطقة': region?.name || 'غير معروف',
      'السائق': driver?.name || 'غير معروف',
      'الحالة': s.status,
      'إجمالي الديزل': s.totalDiesel,
      'إجمالي الأجرة': s.totalWage,
      'رسوم الزيتري': s.zaitriFee,
      'مصروفات الإدارة': s.adminExpenses,
      'المبلغ المستحق': s.dueAmount,
      'قيمة التالف': s.damagedValue,
      'قيمة العجز': s.shortageValue,
      'مصروفات الطريق': s.roadExpenses,
      'المبلغ المستحق بعد الخصم': s.dueAmountAfterDiscount,
      'مبالغ أخرى': s.otherAmounts,
      'سندات التحسين': s.improvementBonds,
      'بدل مسائي': s.eveningAllowance,
      'إجمالي المبلغ المستحق': s.totalDueAmount,
      'نسبة الضريبة': s.taxRate,
      'إجمالي الضريبة': s.totalTax,
      'رقم الحوالة': s.transferNumber || '',
      'تاريخ الحوالة': formatDateForDisplay(s.transferDate),
    };
  });
  
  const headers = Object.keys(data[0] || {});
  const csvContent = arrayToCSV(data, headers);
  const filename = `shipments_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csvContent, filename);
};

/**
 * Export products to CSV
 */
export const exportProductsToCSV = (products: Product[]): void => {
  const data = products.map(p => ({
    'الرقم': p.id,
    'اسم المنتج': p.name,
    'نشط': p.isActive ? 'نعم' : 'لا',
  }));
  
  const headers = Object.keys(data[0] || {});
  const csvContent = arrayToCSV(data, headers);
  const filename = `products_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csvContent, filename);
};

/**
 * Export drivers to CSV
 */
export const exportDriversToCSV = (drivers: Driver[]): void => {
  const data = drivers.map(d => ({
    'الرقم': d.id,
    'اسم السائق': d.name,
    'رقم اللوحة': d.plateNumber,
    'نشط': d.isActive ? 'نعم' : 'لا',
  }));
  
  const headers = Object.keys(data[0] || {});
  const csvContent = arrayToCSV(data, headers);
  const filename = `drivers_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csvContent, filename);
};

/**
 * Export regions to CSV
 */
export const exportRegionsToCSV = (regions: Region[]): void => {
  const data = regions.map(r => ({
    'الرقم': r.id,
    'اسم المنطقة': r.name,
    'سعر لتر الديزل': r.dieselLiterPrice,
    'عدد لترات الديزل': r.dieselLiters,
    'رسوم الزيتري': r.zaitriFee,
  }));
  
  const headers = Object.keys(data[0] || {});
  const csvContent = arrayToCSV(data, headers);
  const filename = `regions_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csvContent, filename);
};

/**
 * Export product prices to CSV
 */
export const exportProductPricesToCSV = (
  prices: ProductPrice[],
  products: Product[],
  regions: Region[]
): void => {
  const data = prices.map(p => {
    const product = products.find(pr => pr.id === p.productId);
    const region = regions.find(r => r.id === p.regionId);
    
    return {
      'المنتج': product?.name || 'غير معروف',
      'المنطقة': region?.name || 'غير معروف',
      'السعر': p.price,
    };
  });
  
  const headers = Object.keys(data[0] || {});
  const csvContent = arrayToCSV(data, headers);
  const filename = `product_prices_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csvContent, filename);
};

/**
 * Export filtered shipments (for current view)
 */
export const exportFilteredShipments = (
  shipments: Shipment[],
  filterName: string,
  regions: Region[],
  drivers: Driver[]
): void => {
  const data = shipments.map(s => {
    const region = regions.find(r => r.id === s.regionId);
    const driver = drivers.find(d => d.id === s.driverId);
    return {
      'رقم أمر المبيعات': s.salesOrder,
      'التاريخ': formatDateForDisplay(s.orderDate),
      'المنطقة': region?.name || 'غير معروف',
      'السائق': driver?.name || 'غير معروف',
      'الحالة': s.status,
      'إجمالي المبلغ المستحق': s.totalDueAmount,
      'رقم الحوالة': s.transferNumber || '',
    };
  });
  
  const headers = Object.keys(data[0] || {});
  const csvContent = arrayToCSV(data, headers);
  const filename = `${filterName}_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csvContent, filename);
};

/**
 * Export generic data to CSV
 */
export const exportToCSV = (
  data: any[],
  filename: string,
  columnMapping?: Record<string, string>
): void => {
  if (data.length === 0) {
    alert('لا توجد بيانات للتصدير');
    return;
  }
  
  let exportData = data;
  
  // Apply column mapping if provided
  if (columnMapping) {
    exportData = data.map(row => {
      const mappedRow: any = {};
      Object.keys(columnMapping).forEach(key => {
        mappedRow[columnMapping[key]] = row[key];
      });
      return mappedRow;
    });
  }
  
  const headers = Object.keys(exportData[0]);
  const csvContent = arrayToCSV(exportData, headers);
  const fullFilename = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  
  downloadCSV(csvContent, fullFilename);
};
