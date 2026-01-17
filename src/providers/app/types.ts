/**
 * Type definitions for AppContext
 * Row types from Supabase and context interface
 */

import { Database } from '../../supabase/database.types';
import {
    User, Role, Product, Region, Driver, Shipment, ProductPrice,
    DeductionPrice, Notification, NotificationCategory, ShipmentProduct,
    ShipmentStatus, Installment, InstallmentPayment, RegionConfig
} from '../../types';

// Type alias for Supabase row types
export type UserRow = Database['public']['Tables']['users']['Row'];
export type ProductRow = Database['public']['Tables']['products']['Row'];
export type DriverRow = Database['public']['Tables']['drivers']['Row'];
export type RegionRow = Database['public']['Tables']['regions']['Row'];
export type ShipmentRow = Database['public']['Tables']['shipments']['Row'];
export type ShipmentProductRow = Database['public']['Tables']['shipment_products']['Row'];
export type ProductPriceRow = Database['public']['Tables']['product_prices']['Row'];
export type NotificationRow = Database['public']['Tables']['notifications']['Row'];

// Manual type definitions for tables not in generated types
export type InstallmentRow = {
    id: string;
    shipment_id: string;
    payable_amount: number;
    remaining_amount: number;
    status: string;
    installment_type?: string;
    original_amount?: number;
    notes?: string;
    created_at: string;
    updated_at: string;
    created_by?: string;
    updated_by?: string;
};

export type InstallmentPaymentRow = {
    id: string;
    installment_id: string;
    amount: number;
    received_date: string;
    payment_method?: string;
    reference_number?: string;
    notes?: string;
    created_at?: string;
    created_by?: string;
};

export type DeductionPriceRow = {
    id: string;
    product_id: string;
    shortage_price: number;
    damaged_price: number;
    effective_from: string;
    created_at: string;
};

// Context interface
export interface AppContextType {
    // Auth
    currentUser: User | null;
    company: import('../../types').Company | null;
    handleLogout: () => Promise<void>;
    loadOfflineUser: () => Promise<void>;

    // Users
    users: User[];
    addUser: (userData: Omit<User, 'id'>, password: string) => Promise<User | null>;
    updateUser: (userId: string, updates: Partial<User>) => Promise<void>;

    // Products
    products: Product[];
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
    deleteProduct: (productId: string) => Promise<void>;

    // Drivers
    drivers: Driver[];
    addDriver: (driver: Omit<Driver, 'id'>) => Promise<void>;
    updateDriver: (driverId: number, updates: Partial<Driver>) => Promise<void>;
    deleteDriver: (driverId: number) => Promise<void>;

    // Regions
    regions: Region[];
    regionConfigs: RegionConfig[];
    addRegion: (region: Omit<Region, 'id'>) => Promise<void>;
    updateRegion: (regionId: string, updates: Partial<Region>) => Promise<void>;
    deleteRegion: (regionId: string) => Promise<void>;
    addRegionConfig: (config: Omit<RegionConfig, 'id'>) => Promise<void>;
    updateRegionConfig: (configId: string, updates: Partial<RegionConfig>) => Promise<void>;
    deleteRegionConfig: (configId: string) => Promise<void>;

    // Shipments
    shipments: Shipment[];
    addShipment: (shipment: Omit<Shipment, 'id'>) => Promise<void>;
    updateShipment: (shipmentId: string, updates: Partial<Shipment>) => Promise<void>;

    // Prices
    productPrices: ProductPrice[];
    addProductPrice: (price: Omit<ProductPrice, 'id'>) => Promise<void>;
    updateProductPrice: (priceId: string, updates: Partial<ProductPrice>) => Promise<void>;
    deleteProductPrice: (priceId: string) => Promise<void>;
    deductionPrices: DeductionPrice[];
    addDeductionPrice: (price: Omit<DeductionPrice, 'id'>) => Promise<void>;
    updateDeductionPrice: (priceId: string, updates: Partial<DeductionPrice>) => Promise<void>;
    deleteDeductionPrice: (priceId: string) => Promise<void>;

    // Batch Operations (for CSV import)
    batchUpsertProductPrices: (prices: (Omit<ProductPrice, 'id'> & { id?: string })[]) => Promise<void>;
    batchUpsertRegionConfigs: (configs: (Omit<RegionConfig, 'id'> & { id?: string })[]) => Promise<void>;
    batchUpsertRegions: (regions: (Omit<Region, 'id'> & { id?: string })[]) => Promise<void>;
    batchUpsertProducts: (products: (Omit<Product, 'id'> & { id?: string })[]) => Promise<void>;
    batchUpsertDrivers: (drivers: (Omit<Driver, 'id'> & { id?: number })[]) => Promise<void>;

    // Notifications
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
    markNotificationAsRead: (notificationId: string) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;

    // Installments
    installments: Installment[];
    createInstallment: (installment: Omit<Installment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateInstallment: (installmentId: string, updates: Partial<Installment>) => Promise<void>;
    installmentPayments: InstallmentPayment[];
    addInstallmentPayment: (payment: Omit<InstallmentPayment, 'id' | 'createdAt'>) => Promise<void>;
    updateInstallmentPayment: (paymentId: string, updates: Partial<InstallmentPayment>) => Promise<void>;

    // Settings
    accountantPrintAccess: boolean;
    setAccountantPrintAccess: React.Dispatch<React.SetStateAction<boolean>>;
    isPrintHeaderEnabled: boolean;
    setIsPrintHeaderEnabled: React.Dispatch<React.SetStateAction<boolean>>;
    appName: string;
    setAppName: React.Dispatch<React.SetStateAction<string>>;
    companyName: string;
    setCompanyName: React.Dispatch<React.SetStateAction<string>>;
    companyAddress: string;
    setCompanyAddress: React.Dispatch<React.SetStateAction<string>>;
    companyPhone: string;
    setCompanyPhone: React.Dispatch<React.SetStateAction<string>>;
    companyLogo: string;
    setCompanyLogo: React.Dispatch<React.SetStateAction<string>>;
    isTimeWidgetVisible: boolean;
    setIsTimeWidgetVisible: React.Dispatch<React.SetStateAction<boolean>>;
    // Accountant Workflow Settings
    accountantDeductionsAccess: boolean;
    setAccountantDeductionsAccess: React.Dispatch<React.SetStateAction<boolean>>;
    accountantAdditionsAccess: boolean;
    setAccountantAdditionsAccess: React.Dispatch<React.SetStateAction<boolean>>;
    accountantTransferAccess: boolean;
    setAccountantTransferAccess: React.Dispatch<React.SetStateAction<boolean>>;

    // App State
    loading: boolean;
    error: string | null;
    isOnline: boolean;
    isSyncing: boolean;
    isProfileLoaded: boolean;

    // Sync
    refreshAllData: () => Promise<void>;
    syncOfflineMutations: () => Promise<void>;

    // Subscription & Access Control
    isSubscriptionActive: boolean;
    paymentStatus: string | null;
    checkLimit: (entity: keyof import('../../types').UsageLimits, countToAdd?: number) => boolean;
    hasFeature: (feature: keyof import('../../types').CompanyFeatures) => boolean;
    fetchCompany: (companyId: string) => Promise<void>;
}

// Re-export types from types module for convenience
export type {
    User, Role, Product, Region, Driver, Shipment, ProductPrice,
    DeductionPrice, Notification, NotificationCategory, ShipmentProduct,
    ShipmentStatus, Installment, InstallmentPayment, RegionConfig
};
