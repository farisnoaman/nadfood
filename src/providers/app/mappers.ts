/**
 * Data mapping functions
 * Convert between Supabase row types and application types
 */

import { Database } from '../../supabase/database.types';
import {
    User, Role, Product, Region, Driver, Shipment, ProductPrice,
    DeductionPrice, Notification, NotificationCategory, ShipmentProduct,
    ShipmentStatus, Installment, InstallmentPayment
} from '../../types';
import {
    UserRow, ProductRow, DriverRow, RegionRow, ShipmentRow,
    ShipmentProductRow, ProductPriceRow, NotificationRow,
    InstallmentRow, InstallmentPaymentRow, DeductionPriceRow
} from './types';
import { Company } from '../../types';

export interface CompanyRow {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    brand_color: string | null;
    settings: any;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    // Subscription fields
    subscription_plan: string;
    subscription_status: string;
    subscription_start_date: string | null;
    subscription_end_date: string | null;
    billing_cycle: string;
    usage_limits: any;
    current_usage: any;
    features: any;
    // Payment activation field
    payment_status?: string | null;
    // Communication channels
    admin_phone?: string | null;
    preferred_contact_method?: string | null;
}

// --- Row to Model Mapping ---

export const companyFromRow = (row: CompanyRow): Company => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    brandColor: row.brand_color || '#000000',
    settings: row.settings,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    subscriptionPlan: row.subscription_plan,
    planId: (row as any).plan_id ?? undefined,
    subscriptionStatus: row.subscription_status as any,
    subscriptionStartDate: row.subscription_start_date ?? undefined,
    subscriptionEndDate: row.subscription_end_date ?? undefined,
    billingCycle: row.billing_cycle as any,
    usageLimits: row.usage_limits,
    currentUsage: row.current_usage,
    features: {
        canImportData: row.features?.canImportData ?? false,
        canExportData: row.features?.canExportData ?? false,
        import_export: row.features?.import_export ?? false,
        canManageDrivers: row.features?.canManageDrivers ?? true,
        canManageRegions: row.features?.canManageRegions ?? true,
        canManageProducts: row.features?.canManageProducts ?? true,
        canManagePrices: row.features?.canManagePrices ?? true,
        canManageRegionFees: row.features?.canManageRegionFees ?? true,
    },
    // Payment activation
    payment_status: row.payment_status as Company['payment_status'] ?? undefined,
    // Communication channels
    adminPhone: row.admin_phone ?? undefined,
    preferredContactMethod: row.preferred_contact_method as Company['preferredContactMethod'] ?? undefined,
});

export const userFromRow = (row: UserRow): User => ({
    id: row.id,
    username: row.username,
    email: (row as any).email || '',
    role: row.role as Role,
    companyId: (row as any).company_id ?? undefined,
    isActive: row.is_active ?? true,
    createdAt: row.created_at ?? undefined,
    assignedFactory: (row as any).assigned_factory ?? undefined,
});

export const productFromRow = (row: ProductRow): Product => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active ?? true,
    weightKg: row.weight_kg ?? 0,
    masterProductId: row.master_product_id ?? null,
    isCustom: row.is_custom ?? true,
    factoryName: (row as any).factory_name ?? undefined,
});

export const driverFromRow = (row: DriverRow): Driver => ({
    id: row.id,
    name: row.name,
    plateNumber: row.plate_number,
    isActive: row.is_active ?? true,
});

export const regionFromRow = (row: RegionRow): Region => ({
    id: row.id,
    name: row.name,
    dieselLiterPrice: row.diesel_liter_price,
    dieselLiters: row.diesel_liters,
    zaitriFee: row.zaitri_fee,
    roadExpenses: row.road_expenses || 0,
    adminExpenses: (row as any).admin_expenses || 0,
    masterRegionId: row.master_region_id ?? null,
    isCustom: row.is_custom ?? true,
});

export const shipmentFromRow = (row: ShipmentRow, products: ShipmentProduct[]): Shipment => ({
    id: row.id,
    salesOrder: row.sales_order,
    orderDate: row.order_date,
    entryTimestamp: row.entry_timestamp,
    regionId: row.region_id,
    driverId: row.driver_id,
    status: row.status as ShipmentStatus,
    products,
    totalDiesel: row.total_diesel ?? undefined,
    totalWage: row.total_wage ?? undefined,
    zaitriFee: row.zaitri_fee ?? undefined,
    adminExpenses: row.admin_expenses ?? undefined,
    dueAmount: row.due_amount ?? undefined,
    damagedValue: row.damaged_value ?? undefined,
    shortageValue: row.shortage_value ?? undefined,
    roadExpenses: row.road_expenses ?? undefined,
    dueAmountAfterDiscount: row.due_amount_after_discount ?? undefined,
    otherAmounts: row.other_amounts ?? undefined,
    improvementBonds: row.improvement_bonds ?? undefined,
    eveningAllowance: row.evening_allowance ?? undefined,
    transferFee: (row as any).transfer_fee ?? undefined,
    totalDueAmount: (row as any).total_due_amount ?? undefined,
    taxRate: (row as any).tax_rate ?? undefined,
    totalTax: (row as any).total_tax ?? undefined,
    transferNumber: (row as any).transfer_number ?? undefined,
    transferDate: (row as any).transfer_date ?? undefined,
    modifiedBy: row.modified_by ?? undefined,
    modifiedAt: row.modified_at ?? undefined,
    deductionsEditedBy: row.deductions_edited_by ?? undefined,
    deductionsEditedAt: row.deductions_edited_at ?? undefined,
    hasMissingPrices: row.has_missing_prices,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
    isPendingSync: false,
    notes: (row as any).notes,
    attachmentUrl: (row as any).attachment_url ?? undefined,
    lastUpdatedRole: (row as any).last_updated_role ?? undefined,
});

export const shipmentProductFromRow = (row: ShipmentProductRow): ShipmentProduct => ({
    productId: row.product_id,
    productName: row.product_name,
    cartonCount: row.carton_count,
    productWagePrice: row.product_wage_price ?? undefined,
    shortageCartons: row.shortage_cartons ?? undefined,
    shortageExemptionRate: row.shortage_exemption_rate ?? undefined,
    shortageValue: row.shortage_value ?? undefined,
    damagedCartons: row.damaged_cartons ?? undefined,
    damagedExemptionRate: row.damaged_exemption_rate ?? undefined,
    damagedValue: row.damaged_value ?? undefined,
});

export const priceFromRow = (row: ProductPriceRow): ProductPrice => ({
    id: row.id,
    regionId: row.region_id,
    productId: row.product_id,
    price: row.price,
    effectiveFrom: (row as any).effective_from,
});

export const deductionPriceFromRow = (row: DeductionPriceRow): DeductionPrice => ({
    id: row.id,
    productId: row.product_id,
    shortagePrice: row.shortage_price,
    damagedPrice: row.damaged_price,
    effectiveFrom: row.effective_from,
});

export const notificationFromRow = (row: NotificationRow): Notification => ({
    id: row.id,
    companyId: row.company_id ?? undefined,
    message: row.message,
    timestamp: row.timestamp,
    read: row.read ?? false,
    category: row.category as NotificationCategory,
    targetRoles: (row.target_roles as Role[]) ?? undefined,
    targetUserIds: row.target_user_ids ?? undefined,
});

export const installmentFromRow = (row: InstallmentRow): Installment => ({
    id: row.id,
    shipmentId: row.shipment_id,
    payableAmount: row.payable_amount,
    remainingAmount: row.remaining_amount,
    status: row.status as 'active' | 'completed' | 'cancelled',
    installmentType: (row as any).installment_type as 'regular' | 'debt_collection' || 'regular',
    originalAmount: (row as any).original_amount ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by ?? undefined,
    updatedBy: row.updated_by ?? undefined,
});

export const installmentPaymentFromRow = (row: InstallmentPaymentRow): InstallmentPayment => ({
    id: row.id,
    installmentId: row.installment_id,
    amount: row.amount,
    receivedDate: row.received_date,
    paymentMethod: row.payment_method ?? undefined,
    referenceNumber: row.reference_number ?? undefined,
    notes: row.notes ?? undefined,
    createdAt: row.created_at ?? new Date().toISOString(),
    createdBy: row.created_by ?? undefined,
});

// --- Model to Row Mapping ---

export const shipmentToRow = (shipment: Partial<Shipment>): Partial<Database['public']['Tables']['shipments']['Update']> => {
    const keyMap: Record<string, string> = {
        salesOrder: 'sales_order',
        orderDate: 'order_date',
        entryTimestamp: 'entry_timestamp',
        regionId: 'region_id',
        driverId: 'driver_id',
        status: 'status',
        totalDiesel: 'total_diesel',
        totalWage: 'total_wage',
        zaitriFee: 'zaitri_fee',
        adminExpenses: 'admin_expenses',
        dueAmount: 'due_amount',
        damagedValue: 'damaged_value',
        shortageValue: 'shortage_value',
        roadExpenses: 'road_expenses',
        dueAmountAfterDiscount: 'due_amount_after_discount',
        otherAmounts: 'other_amounts',
        improvementBonds: 'improvement_bonds',
        eveningAllowance: 'evening_allowance',
        transferFee: 'transfer_fee',
        totalDueAmount: 'total_due_amount',
        taxRate: 'tax_rate',
        totalTax: 'total_tax',
        transferNumber: 'transfer_number',
        transferDate: 'transfer_date',
        modifiedBy: 'modified_by',
        modifiedAt: 'modified_at',
        deductionsEditedBy: 'deductions_edited_by',
        deductionsEditedAt: 'deductions_edited_at',
        hasMissingPrices: 'has_missing_prices',
        notes: 'notes',
        attachmentUrl: 'attachment_url',
        lastUpdatedRole: 'last_updated_role',
    };

    const rowData: Partial<Database['public']['Tables']['shipments']['Update']> = {};
    for (const key in shipment) {
        if (Object.prototype.hasOwnProperty.call(shipment, key) && keyMap[key as keyof Shipment]) {
            const dbKey = keyMap[key as keyof Shipment]!;
            const value = shipment[key as keyof Shipment];
            if (value !== undefined) {
                (rowData as any)[dbKey] = value;
            }
        }
    }
    return rowData;
};

export const shipmentProductToRow = (product: ShipmentProduct, shipmentId: string): any => ({
    shipment_id: shipmentId,
    product_id: product.productId,
    product_name: product.productName,
    carton_count: product.cartonCount,
    product_wage_price: product.productWagePrice,
    shortage_cartons: product.shortageCartons || 0,
    shortage_exemption_rate: product.shortageExemptionRate || 0,
    shortage_value: product.shortageValue || 0,
    damaged_cartons: product.damagedCartons || 0,
    damaged_exemption_rate: product.damagedExemptionRate || 0,
    damaged_value: product.damagedValue || 0,
});
