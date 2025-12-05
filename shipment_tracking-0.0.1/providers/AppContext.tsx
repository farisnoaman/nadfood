
import React, { createContext, useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { User, Role, Product, Region, Driver, Shipment, ProductPrice, Notification, NotificationCategory, ShipmentProduct, ShipmentStatus, Installment, InstallmentPayment } from '../types';
import { supabase } from '../utils/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { Database } from '../supabase/database.types';
import * as IndexedDB from '../utils/indexedDB';
import { STORES } from '../utils/constants';
import { clearOfflineSession, getOfflineSession, shouldClearOfflineSessionOnLaunch } from '../utils/offlineAuth';
import { updateSyncStatus } from '../utils/syncQueue';
import logger from '../utils/logger';

// Type alias for Supabase row types
type UserRow = Database['public']['Tables']['users']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];
type DriverRow = Database['public']['Tables']['drivers']['Row'];
type RegionRow = Database['public']['Tables']['regions']['Row'];
type ShipmentRow = Database['public']['Tables']['shipments']['Row'];
type ShipmentProductRow = Database['public']['Tables']['shipment_products']['Row'];
type ProductPriceRow = Database['public']['Tables']['product_prices']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];


// --- Data Mapping Functions ---
const userFromRow = (row: UserRow): User => ({
    id: row.id,
    username: row.username,
    role: row.role as Role,
    isActive: row.is_active ?? true,
    createdAt: row.created_at ?? undefined,
});

const productFromRow = (row: ProductRow): Product => ({
    id: row.id,
    name: row.name,
    isActive: row.is_active ?? true,
});

const driverFromRow = (row: DriverRow): Driver => ({
    id: row.id,
    name: row.name,
    plateNumber: row.plate_number,
    isActive: row.is_active ?? true,
});

const regionFromRow = (row: RegionRow): Region => ({
    id: row.id,
    name: row.name,
    dieselLiterPrice: row.diesel_liter_price,
    dieselLiters: row.diesel_liters,
    zaitriFee: row.zaitri_fee,
    roadExpenses: (row as any).road_expenses || 0,
});

const shipmentFromRow = (row: ShipmentRow, products: ShipmentProduct[]): Shipment => ({
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
    totalDueAmount: row.total_due_amount ?? undefined,
    taxRate: row.tax_rate ?? undefined,
    totalTax: row.total_tax ?? undefined,
    transferNumber: row.transfer_number ?? undefined,
    transferDate: row.transfer_date ?? undefined,
    modifiedBy: row.modified_by ?? undefined,
    modifiedAt: row.modified_at ?? undefined,
    deductionsEditedBy: row.deductions_edited_by ?? undefined,
    deductionsEditedAt: row.deductions_edited_at ?? undefined,
    hasMissingPrices: row.has_missing_prices,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
});

const shipmentProductFromRow = (row: ShipmentProductRow): ShipmentProduct => ({
    productId: row.product_id,
    productName: row.product_name,
    cartonCount: row.carton_count,
    productWagePrice: row.product_wage_price ?? undefined,
});

const priceFromRow = (row: ProductPriceRow): ProductPrice => ({
    id: row.id,
    regionId: row.region_id,
    productId: row.product_id,
    price: row.price,
});

const notificationFromRow = (row: NotificationRow): Notification => ({
    id: row.id,
    message: row.message,
    timestamp: row.timestamp,
    read: row.read ?? false,
    category: row.category as NotificationCategory,
    targetRoles: (row.target_roles as Role[]) ?? undefined,
    targetUserIds: row.target_user_ids ?? undefined,
});

const installmentFromRow = (row: InstallmentRow): Installment => ({
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

const installmentPaymentFromRow = (row: InstallmentPaymentRow): InstallmentPayment => ({
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

const shipmentToRow = (shipment: Partial<Shipment>): Partial<Database['public']['Tables']['shipments']['Update']> => {
    const keyMap: { [K in keyof Shipment]?: keyof Database['public']['Tables']['shipments']['Update'] } = {
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


interface AppContextType {
    currentUser: User | null;
    handleLogout: () => Promise<void>;
    loadOfflineUser: () => Promise<void>;
    users: User[];
    addUser: (userData: Omit<User, 'id'>, password: string) => Promise<User | null>;
    updateUser: (userId: string, updates: Partial<User>) => Promise<void>;
    products: Product[];
    addProduct: (product: Omit<Product, 'id'>) => Promise<void>;
    updateProduct: (productId: string, updates: Partial<Product>) => Promise<void>;
    drivers: Driver[];
    addDriver: (driver: Omit<Driver, 'id'>) => Promise<void>;
    updateDriver: (driverId: number, updates: Partial<Driver>) => Promise<void>;
    deleteDriver: (driverId: number) => Promise<void>;
    regions: Region[];
    addRegion: (region: Omit<Region, 'id'>) => Promise<void>;
    updateRegion: (regionId: string, updates: Partial<Region>) => Promise<void>;
    deleteRegion: (regionId: string) => Promise<void>;
    shipments: Shipment[];
    addShipment: (shipment: Omit<Shipment, 'id'>) => Promise<void>;
    updateShipment: (shipmentId: string, updates: Partial<Shipment>) => Promise<void>;
    productPrices: ProductPrice[];
    addProductPrice: (price: Omit<ProductPrice, 'id'>) => Promise<void>;
    updateProductPrice: (priceId: string, updates: Partial<ProductPrice>) => Promise<void>;
    deleteProductPrice: (priceId: string) => Promise<void>;
    notifications: Notification[];
    addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>;
    markNotificationAsRead: (notificationId: string) => Promise<void>;
    markAllNotificationsAsRead: () => Promise<void>;
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
    loading: boolean;
    error: string | null;
    isOnline: boolean;
    isSyncing: boolean;
    isProfileLoaded: boolean;
    refreshAllData: () => Promise<void>;
    syncOfflineMutations: () => Promise<void>;
    installments: Installment[];
    createInstallment: (installment: Omit<Installment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    updateInstallment: (installmentId: string, updates: Partial<Installment>) => Promise<void>;
    installmentPayments: InstallmentPayment[];
    addInstallmentPayment: (payment: Omit<InstallmentPayment, 'id' | 'createdAt'>) => Promise<void>;
    updateInstallmentPayment: (paymentId: string, updates: Partial<InstallmentPayment>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [needsSync, setNeedsSync] = useState(false);
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isInitialLoad, setIsInitialLoad] = useState(true); // Track if this is the first load
    const [isProfileLoaded, setIsProfileLoaded] = useState(false); // Track if user profile has been loaded
    const isInitializing = useRef(true); // Track IndexedDB initialization
    
    // Data states - will be hydrated from IndexedDB after mount
    const [users, setUsers] = useState<User[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [regions, setRegions] = useState<Region[]>([]);
    const [shipments, setShipments] = useState<Shipment[]>([]);
    const [productPrices, setProductPrices] = useState<ProductPrice[]>([]);
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [installmentPayments, setInstallmentPayments] = useState<InstallmentPayment[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // Settings states - will be hydrated from IndexedDB after mount
    const [accountantPrintAccess, setAccountantPrintAccess] = useState<boolean>(false);
    const [isPrintHeaderEnabled, setIsPrintHeaderEnabled] = useState<boolean>(true);
    const [appName, setAppName] = useState<string>('بلغيث للنقل');
    const [companyName, setCompanyName] = useState<string>('بلغيث للنقل');
    const [companyAddress, setCompanyAddress] = useState<string>('عنوان الشركة');
    const [companyPhone, setCompanyPhone] = useState<string>('رقم الهاتف');
    const [companyLogo, setCompanyLogo] = useState<string>('');
    const [isTimeWidgetVisible, setIsTimeWidgetVisible] = useState<boolean>(true);

    // Initialize IndexedDB and load cached data on mount
    useEffect(() => {
        const initializeData = async () => {
            try {
                logger.info('Initializing IndexedDB and loading cached data...');

                // Clear any existing Supabase session to require fresh login
                await supabase.auth.signOut();

                // Run migration from localStorage to IndexedDB
                await IndexedDB.migrateFromLocalStorage();
                
                // Load all data from IndexedDB
                const [
                    cachedUsers,
                    cachedProducts,
                    cachedDrivers,
                    cachedRegions,
                    cachedShipments,
                    cachedPrices,
                    cachedNotifications,
                    // Settings
                    cachedAccountantPrintAccess,
                    cachedIsPrintHeaderEnabled,
                    cachedAppName,
                    cachedCompanyName,
                    cachedCompanyAddress,
                    cachedCompanyPhone,
                    cachedCompanyLogo,
                    cachedIsTimeWidgetVisible
                ] = await Promise.all([
                    IndexedDB.getAllFromStore<User>(STORES.USERS),
                    IndexedDB.getAllFromStore<Product>(STORES.PRODUCTS),
                    IndexedDB.getAllFromStore<Driver>(STORES.DRIVERS),
                    IndexedDB.getAllFromStore<Region>(STORES.REGIONS),
                    IndexedDB.getAllFromStore<Shipment>(STORES.SHIPMENTS),
                    IndexedDB.getAllFromStore<ProductPrice>(STORES.PRODUCT_PRICES),
                    IndexedDB.getAllFromStore<Notification>(STORES.NOTIFICATIONS),
                    // Settings
                    IndexedDB.getSetting('accountantPrintAccess', false),
                    IndexedDB.getSetting('isPrintHeaderEnabled', true),
                    IndexedDB.getSetting('appName', 'بلغيث للنقل'),
                    IndexedDB.getSetting('companyName', 'بلغيث للنقل'),
                    IndexedDB.getSetting('companyAddress', 'عنوان الشركة'),
                    IndexedDB.getSetting('companyPhone', 'رقم الهاتف'),
                    IndexedDB.getSetting('companyLogo', ''),
                    IndexedDB.getSetting('isTimeWidgetVisible', true)
                ]);

                // Update state with cached data
                if (cachedUsers.length > 0) setUsers(cachedUsers);
                if (cachedProducts.length > 0) setProducts(cachedProducts);
                if (cachedDrivers.length > 0) setDrivers(cachedDrivers);
                if (cachedRegions.length > 0) setRegions(cachedRegions);
                if (cachedShipments.length > 0) setShipments(cachedShipments);
                if (cachedPrices.length > 0) setProductPrices(cachedPrices);
                if (cachedNotifications.length > 0) setNotifications(cachedNotifications);

                // Update settings
                setAccountantPrintAccess(cachedAccountantPrintAccess);
                setIsPrintHeaderEnabled(cachedIsPrintHeaderEnabled);
                setAppName(cachedAppName);
                setCompanyName(cachedCompanyName);
                setCompanyAddress(cachedCompanyAddress);
                setCompanyPhone(cachedCompanyPhone);
                setCompanyLogo(cachedCompanyLogo);
                setIsTimeWidgetVisible(cachedIsTimeWidgetVisible);

                logger.info('IndexedDB data loaded successfully');

                // Check for pending mutations that need sync
                const mutationQueue = await IndexedDB.getMutationQueue();
                const isOnline = navigator.onLine;
                if (isOnline && mutationQueue.length > 0) {
                    logger.info(`Found ${mutationQueue.length} pending mutations, will sync after login`);
                    setNeedsSync(true);
                }
                isInitializing.current = false;
            } catch (error) {
                console.error('Error initializing IndexedDB:', error);
                isInitializing.current = false;
            }
        };

        initializeData();
    }, []);

    const fetchAllData = useCallback(async () => {
        const isOnline = navigator.onLine;

        if (!isOnline) {
            logger.info("Offline mode: Loading from cache only");
            // Load from IndexedDB cache
            try {
                const [
                    cachedUsers,
                    cachedProducts,
                    cachedDrivers,
                    cachedRegions,
                    cachedShipments,
                    cachedPrices,
                    cachedNotifications
                ] = await Promise.all([
                    IndexedDB.getAllFromStore<User>(STORES.USERS),
                    IndexedDB.getAllFromStore<Product>(STORES.PRODUCTS),
                    IndexedDB.getAllFromStore<Driver>(STORES.DRIVERS),
                    IndexedDB.getAllFromStore<Region>(STORES.REGIONS),
                    IndexedDB.getAllFromStore<Shipment>(STORES.SHIPMENTS),
                    IndexedDB.getAllFromStore<ProductPrice>(STORES.PRODUCT_PRICES),
                    IndexedDB.getAllFromStore<Notification>(STORES.NOTIFICATIONS)
                ]);

                if (cachedUsers.length > 0) setUsers(cachedUsers);
                if (cachedProducts.length > 0) setProducts(cachedProducts);
                if (cachedDrivers.length > 0) setDrivers(cachedDrivers);
                if (cachedRegions.length > 0) setRegions(cachedRegions);
                if (cachedShipments.length > 0) setShipments(cachedShipments);
                if (cachedPrices.length > 0) setProductPrices(cachedPrices);
                if (cachedNotifications.length > 0) setNotifications(cachedNotifications);

                logger.info('Offline data loaded from cache');
                return;
            } catch (cacheErr) {
                console.error('Error loading cached data:', cacheErr);
                throw new Error('OFFLINE_CACHE_ERROR');
            }
        }

        // ONLINE MODE: Fetch from server
        setError(null);

        // Create abort controller for timeout (reduced to 20 seconds for better UX)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout

        try {
            const [usersRes, productsRes, driversRes, regionsRes, shipmentsRes, shipmentProductsRes, pricesRes, notificationsRes, settingsRes, installmentsRes, installmentPaymentsRes] = await Promise.all([
                supabase.from('users').select('*').abortSignal(controller.signal),
                supabase.from('products').select('*').abortSignal(controller.signal),
                supabase.from('drivers').select('*').abortSignal(controller.signal),
                supabase.from('regions').select('*').abortSignal(controller.signal),
                supabase.from('shipments').select('*').abortSignal(controller.signal),
                supabase.from('shipment_products').select('*').abortSignal(controller.signal),
                supabase.from('product_prices').select('*').abortSignal(controller.signal),
                supabase.from('notifications').select('*').order('timestamp', { ascending: false }).abortSignal(controller.signal),
                supabase.from('app_settings').select('*').abortSignal(controller.signal),
                (supabase as any).from('installments').select('*').abortSignal(controller.signal),
                (supabase as any).from('installment_payments').select('*').order('received_date', { ascending: false }).abortSignal(controller.signal),
            ]);

            clearTimeout(timeoutId);

            const responses = [usersRes, productsRes, driversRes, regionsRes, shipmentsRes, shipmentProductsRes, pricesRes, notificationsRes, settingsRes, installmentsRes, installmentPaymentsRes];
            for (const res of responses) { if (res.error) throw res.error; }

            const newUsers = usersRes.data!.map(userFromRow);
            const newProducts = productsRes.data!.map(productFromRow);
            const newDrivers = driversRes.data!.map(driverFromRow);
            const newRegions = regionsRes.data!.map(regionFromRow);
            const newPrices = pricesRes.data!.map(priceFromRow);
            const newNotifications = notificationsRes.data!.map(notificationFromRow);
            const newInstallments = installmentsRes.data!.map(installmentFromRow);
            const newInstallmentPayments = installmentPaymentsRes.data!.map(installmentPaymentFromRow);
            const shipmentProductsByShipmentId = shipmentProductsRes.data!.reduce((acc, sp) => {
                if (!acc[sp.shipment_id]) { acc[sp.shipment_id] = []; }
                acc[sp.shipment_id].push(shipmentProductFromRow(sp));
                return acc;
            }, {} as Record<string, ShipmentProduct[]>);
            const newShipments = shipmentsRes.data!.map(s => shipmentFromRow(s, shipmentProductsByShipmentId[s.id] || []));

            setUsers(newUsers); await IndexedDB.saveAllToStore(STORES.USERS, newUsers);
            setProducts(newProducts); await IndexedDB.saveAllToStore(STORES.PRODUCTS, newProducts);
            setDrivers(newDrivers); await IndexedDB.saveAllToStore(STORES.DRIVERS, newDrivers);
            setRegions(newRegions); await IndexedDB.saveAllToStore(STORES.REGIONS, newRegions);
            setProductPrices(newPrices); await IndexedDB.saveAllToStore(STORES.PRODUCT_PRICES, newPrices);
            setNotifications(newNotifications); await IndexedDB.saveAllToStore(STORES.NOTIFICATIONS, newNotifications);
            setInstallments(newInstallments); await IndexedDB.saveAllToStore(STORES.INSTALLMENTS, newInstallments);
            setInstallmentPayments(newInstallmentPayments); await IndexedDB.saveAllToStore(STORES.INSTALLMENT_PAYMENTS, newInstallmentPayments);

            // Process and update settings
            const settingsData = settingsRes.data!;
            const settingsMap = settingsData.reduce((acc, setting) => {
                acc[setting.setting_key] = setting.setting_value;
                return acc;
            }, {} as Record<string, string>);

            setAccountantPrintAccess(settingsMap['accountantPrintAccess'] === 'true');
            setIsPrintHeaderEnabled(settingsMap['isPrintHeaderEnabled'] === 'true');
            setAppName(settingsMap['appName'] || 'بلغيث للنقل');
            setCompanyName(settingsMap['companyName'] || 'بلغيث للنقل');
            setCompanyAddress(settingsMap['companyAddress'] || 'عنوان الشركة');
            setCompanyPhone(settingsMap['companyPhone'] || 'رقم الهاتف');
            setCompanyLogo(settingsMap['companyLogo'] || '');
            setIsTimeWidgetVisible(settingsMap['isTimeWidgetVisible'] !== 'false'); // Default to true

            // Also save settings to IndexedDB for offline access
            await Promise.all([
                IndexedDB.setSetting('accountantPrintAccess', settingsMap['accountantPrintAccess'] === 'true'),
                IndexedDB.setSetting('isPrintHeaderEnabled', settingsMap['isPrintHeaderEnabled'] === 'true'),
                IndexedDB.setSetting('appName', settingsMap['appName'] || 'بلغيث للنقل'),
                IndexedDB.setSetting('companyName', settingsMap['companyName'] || 'بلغيث للنقل'),
                IndexedDB.setSetting('companyAddress', settingsMap['companyAddress'] || 'عنوان الشركة'),
                IndexedDB.setSetting('companyPhone', settingsMap['companyPhone'] || 'رقم الهاتف'),
                IndexedDB.setSetting('companyLogo', settingsMap['companyLogo'] || ''),
                IndexedDB.setSetting('isTimeWidgetVisible', settingsMap['isTimeWidgetVisible'] !== 'false')
            ]);

            // Retrieve true pending shipments from the mutation queue, not the general shipments cache
            // This ensures that once a shipment is synced and removed from the queue, it's replaced by the server version.
            const mutationQueue = await IndexedDB.getMutationQueue();
            const pendingShipments = mutationQueue
                .filter((m: any) => m.type === 'addShipment')
                .map((m: any) => m.payload as Shipment);

            // De-duplicate: although pending shipments have "offline-" IDs, we check just in case
            // But mostly we just want to layer pending on top of server data.
            const finalShipments = [...pendingShipments, ...newShipments];

            setShipments(finalShipments);
            await IndexedDB.saveAllToStore(STORES.SHIPMENTS, finalShipments);

        } catch (err: any) {
            clearTimeout(timeoutId);
            console.error("Error fetching data:", err);

            // Check if error is due to timeout/network issues
            if (err.name === 'AbortError') {
                console.warn('Data fetch timeout - falling back to cache');
                // Try to load from cache as fallback
                try {
                    const [
                        cachedUsers,
                        cachedProducts,
                        cachedDrivers,
                        cachedRegions,
                        cachedShipments,
                        cachedPrices,
                        cachedNotifications
                    ] = await Promise.all([
                        IndexedDB.getAllFromStore<User>(STORES.USERS),
                        IndexedDB.getAllFromStore<Product>(STORES.PRODUCTS),
                        IndexedDB.getAllFromStore<Driver>(STORES.DRIVERS),
                        IndexedDB.getAllFromStore<Region>(STORES.REGIONS),
                        IndexedDB.getAllFromStore<Shipment>(STORES.SHIPMENTS),
                        IndexedDB.getAllFromStore<ProductPrice>(STORES.PRODUCT_PRICES),
                        IndexedDB.getAllFromStore<Notification>(STORES.NOTIFICATIONS)
                    ]);

                    if (cachedUsers.length > 0) setUsers(cachedUsers);
                    if (cachedProducts.length > 0) setProducts(cachedProducts);
                    if (cachedDrivers.length > 0) setDrivers(cachedDrivers);
                    if (cachedRegions.length > 0) setRegions(cachedRegions);
                    if (cachedShipments.length > 0) setShipments(cachedShipments);
                    if (cachedPrices.length > 0) setProductPrices(cachedPrices);
                    if (cachedNotifications.length > 0) setNotifications(cachedNotifications);

                    logger.info('Fallback: Loaded data from cache after timeout');
                    return; // Don't throw error, we have fallback data
                } catch (cacheErr) {
                    console.error('Fallback cache also failed:', cacheErr);
                }
                throw new Error('TIMEOUT');
            } else {
                console.warn('Data fetch failed:', err.message);
                // Try cache fallback for network errors too
                try {
                    const [
                        cachedUsers,
                        cachedProducts,
                        cachedDrivers,
                        cachedRegions,
                        cachedShipments,
                        cachedPrices,
                        cachedNotifications
                    ] = await Promise.all([
                        IndexedDB.getAllFromStore<User>(STORES.USERS),
                        IndexedDB.getAllFromStore<Product>(STORES.PRODUCTS),
                        IndexedDB.getAllFromStore<Driver>(STORES.DRIVERS),
                        IndexedDB.getAllFromStore<Region>(STORES.REGIONS),
                        IndexedDB.getAllFromStore<Shipment>(STORES.SHIPMENTS),
                        IndexedDB.getAllFromStore<ProductPrice>(STORES.PRODUCT_PRICES),
                        IndexedDB.getAllFromStore<Notification>(STORES.NOTIFICATIONS)
                    ]);

                    if (cachedUsers.length > 0) setUsers(cachedUsers);
                    if (cachedProducts.length > 0) setProducts(cachedProducts);
                    if (cachedDrivers.length > 0) setDrivers(cachedDrivers);
                    if (cachedRegions.length > 0) setRegions(cachedRegions);
                    if (cachedShipments.length > 0) setShipments(cachedShipments);
                    if (cachedPrices.length > 0) setProductPrices(cachedPrices);
                    if (cachedNotifications.length > 0) setNotifications(cachedNotifications);

                    logger.info('Fallback: Loaded data from cache after network error');
                    return; // Don't throw error, we have fallback data
                } catch (cacheErr) {
                    console.error('Fallback cache also failed:', cacheErr);
                }
                throw err;
            }
        }
    }, []);

    // Data loading function
    const loadData = useCallback(async (hasCachedData: boolean, isOnline: boolean, offlineSession: any) => {
        if (hasCachedData) {
            try {
                // Increase timeout for cache loading to prevent premature failures
                const cacheTimeout = 10000; // 10 seconds instead of default 3000

                const [
                    cachedUsers,
                    cachedProducts,
                    cachedDrivers,
                    cachedRegions,
                    cachedShipments,
                    cachedPrices,
                    cachedNotifications
                ] = await Promise.all([
                    IndexedDB.getAllFromStore<User>(STORES.USERS, cacheTimeout),
                    IndexedDB.getAllFromStore<Product>(STORES.PRODUCTS, cacheTimeout),
                    IndexedDB.getAllFromStore<Driver>(STORES.DRIVERS, cacheTimeout),
                    IndexedDB.getAllFromStore<Region>(STORES.REGIONS, cacheTimeout),
                    IndexedDB.getAllFromStore<Shipment>(STORES.SHIPMENTS, cacheTimeout),
                    IndexedDB.getAllFromStore<ProductPrice>(STORES.PRODUCT_PRICES, cacheTimeout),
                    IndexedDB.getAllFromStore<Notification>(STORES.NOTIFICATIONS, cacheTimeout)
                ]);

                // Update state with cached data
                if (cachedUsers.length > 0) setUsers(cachedUsers);
                if (cachedProducts.length > 0) setProducts(cachedProducts);
                if (cachedDrivers.length > 0) setDrivers(cachedDrivers);
                if (cachedRegions.length > 0) setRegions(cachedRegions);
                if (cachedShipments.length > 0) setShipments(cachedShipments);
                if (cachedPrices.length > 0) setProductPrices(cachedPrices);
                if (cachedNotifications.length > 0) setNotifications(cachedNotifications);

                logger.info('Cached data loaded successfully');

                // Try background sync and refresh if online and no offline session
                if (isOnline && !offlineSession) {
                    try {
                        // First sync any pending operations if needed
                        if (needsSync) {
                            logger.info('Syncing pending operations from app initialization');
                            await syncOfflineMutations();
                            setNeedsSync(false);
                        }
                        // Then refresh data from server
                        await fetchAllData();
                    } catch (err) {
                        console.warn('Sync or refresh failed:', err);
                        // Try refresh anyway
                        try {
                            await fetchAllData();
                        } catch (refreshErr) {
                            console.warn('Background refresh failed:', refreshErr);
                        }
                    }
                }
            } catch (cacheErr) {
                console.error('Cache loading failed:', cacheErr);
                // CRITICAL FIX: If cache fails and we have offline session, don't try server fetch
                if (!isOnline || offlineSession) {
                    setError('فشل تحميل البيانات المحفوظة. يرجى تسجيل الدخول مرة أخرى.');
                    return;
                }
                // Only try server fetch if online and no offline session
                await fetchAllData();
            }
        } else if (isOnline && !offlineSession) {
            // Online and no cached data - fetch from server
            logger.info('No cached data, fetching from server');
            await fetchAllData();
        } else {
            // Offline with no cached data
            logger.info('Offline mode with no cached data');
            setError('لا توجد بيانات محفوظة. يرجى الاتصال بالإنترنت لأول مرة.');
        }
    }, [fetchAllData]);

    // Helper function for background user profile and data loading
    const loadUserProfileAndData = useCallback(async (user: any, isOnline: boolean, hasCachedData: boolean) => {
        try {
            let userProfile = null;

            // Try to get user profile from server first (online) or cache (offline)
            if (isOnline) {
                try {
                    const { data, error } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', user.id)
                        .single();

                    if (!error && data) {
                        userProfile = userFromRow(data);
                        logger.info('Loaded user profile from server');
                    }
                } catch (err) {
                    console.warn('Server profile fetch failed, trying cache:', err);
                }
            }

            // Fallback to cached profile if needed
            if (!userProfile) {
                try {
                    const cachedUsers = await IndexedDB.getAllFromStore<User>(STORES.USERS, 2000);
                    userProfile = cachedUsers.find(u => u.id === user.id) || null;
                    if (userProfile) {
                        logger.info('Loaded user profile from cache');
                    }
                } catch (err) {
                    console.warn('Cache profile fetch failed:', err);
                }
            }

            // Update user profile if found
            if (userProfile) {
                setCurrentUser(userProfile);
                setIsProfileLoaded(true); // Profile loaded successfully
            }

            // Load application data
            loadData(hasCachedData, isOnline, null).catch(err => {
                console.error('Data loading failed:', err);
            });

        } catch (err) {
            console.error('Error in loadUserProfileAndData:', err);
        }
    }, [loadData]);

    // Minimal data loading fallback
    const loadMinimalData = useCallback(async (user: any) => {
        try {
            logger.info('Loading minimal data as fallback...');
            // Just try to load basic user data from cache
            const cachedUsers = await IndexedDB.getAllFromStore<User>(STORES.USERS, 2000);
            const userProfile = cachedUsers.find(u => u.id === user.id) || null;
            if (userProfile) {
                setCurrentUser(userProfile);
                logger.info('Minimal user data loaded');
            }
        } catch (err) {
            console.warn('Minimal data loading failed:', err);
        }
    }, []);

    // Persist settings to IndexedDB whenever they change
    useEffect(() => { if (!isInitializing.current) IndexedDB.setSetting('accountantPrintAccess', accountantPrintAccess); }, [accountantPrintAccess]);
    useEffect(() => { if (!isInitializing.current) IndexedDB.setSetting('isPrintHeaderEnabled', isPrintHeaderEnabled); }, [isPrintHeaderEnabled]);
    useEffect(() => { if (!isInitializing.current) IndexedDB.setSetting('appName', appName); }, [appName]);
    useEffect(() => { if (!isInitializing.current) IndexedDB.setSetting('companyName', companyName); }, [companyName]);
    useEffect(() => { if (!isInitializing.current) IndexedDB.setSetting('companyAddress', companyAddress); }, [companyAddress]);
    useEffect(() => { if (!isInitializing.current) IndexedDB.setSetting('companyPhone', companyPhone); }, [companyPhone]);
    useEffect(() => { if (!isInitializing.current) IndexedDB.setSetting('companyLogo', companyLogo); }, [companyLogo]);
    useEffect(() => { if (!isInitializing.current) IndexedDB.setSetting('isTimeWidgetVisible', isTimeWidgetVisible); }, [isTimeWidgetVisible]);




    const syncOfflineMutations = useCallback(async () => {
        logger.info('Starting offline mutations sync');

        // Refresh auth session before syncing
        try {
            await supabase.auth.refreshSession();
            logger.info('Auth session refreshed for sync');
        } catch (authError) {
            logger.warn('Failed to refresh auth session:', authError);
        }

        const mutationQueue = await IndexedDB.getMutationQueue();
        if (mutationQueue.length === 0) {
            logger.info('No pending mutations to sync');
            return;
        }
        logger.info(`Found ${mutationQueue.length} pending mutations to sync`);

        // Cross-tab synchronization: Prevent multiple tabs from syncing simultaneously
        const lockKey = 'sync_lock';
        const lockValue = `${Date.now()}_${Math.random()}`;
        const existingLock = localStorage.getItem(lockKey);
        
        // Check if another tab is currently syncing (lock exists and is less than 30 seconds old)
        if (existingLock) {
            const lockTimestamp = parseInt(existingLock.split('_')[0]);
            if (Date.now() - lockTimestamp < 30000) {
                logger.info('Another tab is syncing. Skipping this sync attempt.');
                return;
            }
        }

        // Acquire lock
        localStorage.setItem(lockKey, lockValue);

        // Broadcast sync start event to other tabs
        const syncChannel = new BroadcastChannel('sync_channel');
        syncChannel.postMessage({ type: 'sync_start', lockValue });

        try {
            setIsSyncing(true);
            logger.info(`Starting sync of ${mutationQueue.length} offline actions.`);

            const offlineToRealIdMap: Record<string, string> = {};
            const successfullySyncedIndices: number[] = [];

            for (const [index, mutation] of mutationQueue.entries()) {
        try {
            if (mutation.type === 'addShipment') {
                // Strip the offline ID and pending flag. DB will generate a new UUID.
                const { products, id: offlineId, isPendingSync, ...shipmentData } = mutation.payload;

                const shipmentRow = shipmentToRow(shipmentData);
                if (!shipmentRow.created_by && currentUser?.id) {
                    shipmentRow.created_by = currentUser.id;
                }

                // Insert shipment and get new ID
                const { data: newShipmentData, error: shipmentError } = await supabase
                    .from('shipments')
                    .insert(shipmentRow as any)
                    .select()
                    .single();

                if (shipmentError) throw shipmentError;

                logger.info('Mutation sync result:', { type: mutation.type, data: newShipmentData, error: shipmentError });

                // Store mapping: offlineId -> real UUID
                if (offlineId && String(offlineId).startsWith('offline-')) {
                    offlineToRealIdMap[offlineId] = newShipmentData.id;
                }

                // Insert products with NEW shipment ID
                const shipmentProductsToInsert = products.map((p: ShipmentProduct) => ({
                     shipment_id: newShipmentData.id,
                     product_id: p.productId,
                     product_name: p.productName,
                     carton_count: p.cartonCount,
                     product_wage_price: p.productWagePrice
                }));

                const { error: productsError } = await supabase.from('shipment_products').insert(shipmentProductsToInsert);
                if (productsError) throw productsError;

                logger.info(`Successfully synced addShipment: ${newShipmentData.id}`);

            } else if (mutation.type === 'updateShipment') {
                        let { shipmentId, updates } = mutation.payload;

                        // If this update is for an offline shipment we just synced, map the ID
                        if (offlineToRealIdMap[shipmentId]) {
                            shipmentId = offlineToRealIdMap[shipmentId];
                        }

                        const { products, ...shipmentUpdates } = updates;

                        // Update the main shipment record
                        if (Object.keys(shipmentUpdates).length > 0) {
                            const updateRow = shipmentToRow(shipmentUpdates);
                            logger.info(`Updating shipment ${shipmentId} with status:`, updateRow.status);
                            const { data, error } = await supabase.from('shipments').update(updateRow).eq('id', shipmentId).select();
                            if (error) throw error;
                            if (!data || data.length === 0) throw new Error('Update failed: no rows affected');
                            logger.info(`Successfully updated shipment ${shipmentId} status to: ${updateRow.status}`, { data });
                        }

                        // Update products if provided
                        if (products !== undefined) {
                            // Delete existing products for this shipment
                            const { data: deleteData, error: deleteError } = await supabase
                                .from('shipment_products')
                                .delete()
                                .eq('shipment_id', shipmentId)
                                .select();
                            if (deleteError) throw deleteError;
                            logger.info(`Deleted ${deleteData?.length || 0} products for shipment ${shipmentId}`);

                            // Insert new products if any
                            if (products.length > 0) {
                                const shipmentProductsToInsert = products.map((p: ShipmentProduct) => ({
                                    shipment_id: shipmentId,
                                    product_id: p.productId,
                                    product_name: p.productName,
                                    carton_count: p.cartonCount,
                                    product_wage_price: p.productWagePrice
                                }));

                                const { data: productsData, error: productsError } = await supabase
                                    .from('shipment_products')
                                    .insert(shipmentProductsToInsert)
                                    .select();
                                if (productsError) throw productsError;
                                logger.info(`Inserted ${productsData?.length || 0} products for shipment ${shipmentId}`);
                                if (productsError) throw productsError;
                            }
                        }
                    }

                    successfullySyncedIndices.push(index);
                } catch (err) {
                    console.error('Failed to sync mutation:', mutation, err);
                    // Keep failed mutation in queue for retry
                    logger.error(`Sync failed for ${mutation.type}:`, err);
                }
        }
        
        // Remove successfully synced items
        const newQueue = mutationQueue.filter((_: any, index: number) => !successfullySyncedIndices.includes(index));
        await IndexedDB.setMutationQueue(newQueue);

        // Update sync status
        await updateSyncStatus();

        logger.info(`Sync completed: ${successfullySyncedIndices.length} mutations synced successfully`);

        // Refresh data from server to get the new IDs and clean states
        await fetchAllData();
        setIsSyncing(false);
        logger.info('Sync finished and data refreshed.');

        } finally {
            // Release lock only if we still own it
            const currentLock = localStorage.getItem(lockKey);
            if (currentLock === lockValue) {
                localStorage.removeItem(lockKey);
            }
            
            // Broadcast sync completion
            syncChannel.postMessage({ type: 'sync_end', lockValue });
            syncChannel.close();
        }
    }, [currentUser, fetchAllData]);

    // Online/Offline listener
    useEffect(() => {
        const handleOnline = async () => {
            logger.info('Connection restored - going online');
            setIsOnline(true);
            
            // Clear any existing errors since we're back online
            setError(null);
            
            // Try to sync data and mutations
            try {
                // First, refresh all data from server
                await fetchAllData();
                
                // Then sync any pending mutations
                await syncOfflineMutations();
                
                logger.info('Online sync completed successfully');
            } catch (err) {
                console.error('Error during online sync:', err);
                // Don't show error to user, just log it
                // Data will sync in background eventually
            }
        };
        
        const handleOffline = () => {
            logger.info('Connection lost - going offline');
            setIsOnline(false);
            // Don't clear error when going offline - user should see what happened
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncOfflineMutations, fetchAllData]);

    // Real-time subscription for shipments data
    // Only establish connection when user is authenticated and online to prevent API key exposure
    useEffect(() => {
        // Check if realtime is enabled via environment variable
        const enableRealtime = import.meta.env.VITE_ENABLE_REALTIME !== 'false';

        // Prevent realtime connections during login attempts, when offline, or when disabled
        if (!enableRealtime || !currentUser || !isOnline) {
            return;
        }

        logger.debug('Establishing realtime subscription for authenticated user');
        const shipmentsChannel = supabase
            .channel('shipments-changes')
            .on(
                'postgres_changes',
                {
                    event: '*', // Listen for all changes (INSERT, UPDATE, DELETE)
                    schema: 'public',
                    table: 'shipments'
                },
                async (payload) => {
                    logger.debug('Shipments change detected:', payload);
                    logger.debug('Current user role:', currentUser?.role);

                    // When shipments data changes, refetch all data to ensure consistency
                    if (isOnline) {
                        await fetchAllData();
                    }
                }
            )
            .subscribe((status) => {
                logger.debug('Shipments subscription status:', status);
                logger.debug('Current user role:', currentUser?.role);
                logger.debug('Current shipments count:', shipments.length);
            });

        // Cleanup subscription on component unmount or when conditions change
        return () => {
            logger.info('Cleaning up shipments subscription');
            shipmentsChannel.unsubscribe();
        };
    }, [fetchAllData, isOnline, currentUser]);

    const clearData = useCallback(() => {
        setUsers([]);
        setProducts([]);
        setDrivers([]);
        setRegions([]);
        setShipments([]);
        setProductPrices([]);
        setNotifications([]);
    }, []);

    // Enhanced offline-first initialization
    useEffect(() => {
        const initializeApp = async () => {
            const isOnline = navigator.onLine;
            const isPWA = 'serviceWorker' in navigator && window.matchMedia('(display-mode: standalone)').matches;

            logger.info(`App initializing - Online: ${isOnline}, PWA: ${isPWA}`);

            // Handle offline session clearing for security
            const shouldClear = await shouldClearOfflineSessionOnLaunch();
            if (shouldClear) {
                logger.info('App launched online - clearing any offline session for security');
                await clearOfflineSession();
            }

            // PWA-specific offline handling
            if (isPWA) {
                logger.info('Running in PWA mode - enabling offline-first features');

                // Check if we have cached data for offline use
                try {
                    const [cachedUsers, cachedProducts] = await Promise.all([
                        IndexedDB.getAllFromStore<User>(STORES.USERS, 2000),
                        IndexedDB.getAllFromStore<Product>(STORES.PRODUCTS, 2000)
                    ]);

                    const hasCachedData = cachedUsers.length > 0 && cachedProducts.length > 0;

                    if (!isOnline && !hasCachedData) {
                        logger.warn('PWA offline but no cached data available');
                        setError('التطبيق في وضع عدم الاتصال ولكن لا توجد بيانات محفوظة. يرجى الاتصال بالإنترنت لتحميل البيانات أولاً.');
                    } else if (!isOnline && hasCachedData) {
                        logger.info('PWA offline with cached data - loading from cache');
                        // Load cached data immediately for offline use
                        await loadData(true, false, null);
                    } else if (isOnline) {
                        logger.info('PWA online - will sync data in background');
                        // Online - data will be loaded by auth state change
                    }
                } catch (cacheError) {
                    logger.error('Error checking cached data:', cacheError);
                    if (!isOnline) {
                        setError('فشل في تحميل البيانات المحفوظة. يرجى الاتصال بالإنترنت.');
                    }
                }
            }
        };

        initializeApp();
    }, []);

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session: Session | null) => {
            logger.info('Auth state change:', event, 'Initial load:', isInitialLoad);

            // Handle sign out event explicitly
            if (event === 'SIGNED_OUT') {
                logger.info('User signed out, clearing data');
                clearData();
                setCurrentUser(null);
                setLoading(false);
                return;
            }

            if (session?.user) {
                const isOnline = navigator.onLine;

                // PHASE 1: Quick session validation (non-blocking)
                logger.info('Phase 1: Validating session...');

                // Set basic user info immediately to prevent UI blocking
                // We'll load the full profile in background
                setCurrentUser({
                    id: session.user.id,
                    username: session.user.email || 'unknown',
                    role: Role.SALES, // Default role, will be updated when profile loads
                    isActive: true
                });
                setIsProfileLoaded(false); // Profile not loaded yet
                setLoading(false); // Clear loading immediately after session validation

                // PHASE 2: Background data loading (progressive)
                logger.info('Phase 2: Starting background data loading...');

                // Check for offline session in background
                getOfflineSession().then(() => {
                    // Check cached data availability in background
                    const cacheCheckPromise = Promise.all([
                        IndexedDB.getAllFromStore<User>(STORES.USERS, 3000),
                        IndexedDB.getAllFromStore<Product>(STORES.PRODUCTS, 3000)
                    ]);

                    return Promise.race([
                        cacheCheckPromise,
                        new Promise<never>((_, reject) =>
                            setTimeout(() => reject(new Error('Cache check timeout')), 3000)
                        )
                    ]);
                }).then(([cachedUsers, cachedProducts]) => {
                    const hasCachedData = cachedUsers.length > 0 && cachedProducts.length > 0;
                    logger.debug('Background cache check:', { users: cachedUsers.length, products: cachedProducts.length, hasData: hasCachedData });

                    // Load user profile and data in background
                    return loadUserProfileAndData(session.user, isOnline, hasCachedData);
                }).catch(err => {
                    console.warn('Background session/data loading failed:', err);
                    // Try minimal data loading as fallback
                    return loadMinimalData(session.user);
                }).catch(err => {
                    console.error('All data loading attempts failed:', err);
                    // At minimum, we have the user session
                });

                // Mark initial load as complete
                if (isInitialLoad) {
                    setIsInitialLoad(false);
                }
            } else {
                // Check for offline session when no Supabase session
                const offlineSession = await getOfflineSession();
                
                if (offlineSession) {
                    logger.info('No Supabase session but offline session exists');
                    // Try to restore user from cached data
                    try {
                        const offlineUserPromise = IndexedDB.getAllFromStore<User>(STORES.USERS);
                        const offlineUserTimeout = new Promise<User[]>((_, reject) =>
                            setTimeout(() => reject(new Error('Offline user fetch timeout')), 2000)
                        );
                        const cachedUsers = await Promise.race([offlineUserPromise, offlineUserTimeout]);
                        const userProfile = cachedUsers.find(u => u.id === offlineSession.userId) || null;
                        
                        if (userProfile) {
                            logger.info('Restored user from offline session');
                            setCurrentUser(userProfile);
                            
                            // Load cached data with timeout protection
                            const offlineDataPromise = Promise.all([
                                IndexedDB.getAllFromStore<Product>(STORES.PRODUCTS),
                                IndexedDB.getAllFromStore<Driver>(STORES.DRIVERS),
                                IndexedDB.getAllFromStore<Region>(STORES.REGIONS),
                                IndexedDB.getAllFromStore<Shipment>(STORES.SHIPMENTS),
                                IndexedDB.getAllFromStore<ProductPrice>(STORES.PRODUCT_PRICES),
                                IndexedDB.getAllFromStore<Notification>(STORES.NOTIFICATIONS)
                            ]);

                            const offlineDataTimeout = new Promise<never>((_, reject) =>
                                setTimeout(() => reject(new Error('Offline data load timeout')), 5000)
                            );

                            const [
                                cachedProducts,
                                cachedDrivers,
                                cachedRegions,
                                cachedShipments,
                                cachedPrices,
                                cachedNotifications
                            ] = await Promise.race([offlineDataPromise, offlineDataTimeout]);

                            if (cachedUsers.length > 0) setUsers(cachedUsers);
                            if (cachedProducts.length > 0) setProducts(cachedProducts);
                            if (cachedDrivers.length > 0) setDrivers(cachedDrivers);
                            if (cachedRegions.length > 0) setRegions(cachedRegions);
                if (cachedShipments.length > 0) setShipments(cachedShipments);
                            if (cachedPrices.length > 0) setProductPrices(cachedPrices);
                            if (cachedNotifications.length > 0) setNotifications(cachedNotifications);
                            
                            logger.info('Offline session restored with cached data');
                        } else {
                            console.error('Offline session exists but no cached user profile');
                            await clearOfflineSession();
                        }
                    } catch (err) {
                        console.error('Error restoring offline session:', err);
                        await clearOfflineSession();
                    }
                } else {
                    // SECURITY FIX: Always require explicit login
                    // No automatic session restoration for security
                    logger.info('No active session - user must login');
                    
                    // Clear all data and user state
                    clearData();
                    setCurrentUser(null);
                }
                
                setLoading(false);
                setIsInitialLoad(false);
            }
        });

        return () => subscription.unsubscribe();
    }, [fetchAllData, clearData, isInitialLoad, users.length, products.length, loadData]);

    const loadOfflineUser = useCallback(async () => {
        try {
            const offlineSession = await getOfflineSession();
            if (offlineSession) {
                const cachedUsers = await IndexedDB.getAllFromStore<User>(STORES.USERS);
                const userProfile = cachedUsers.find(u => u.id === offlineSession.userId);
                if (userProfile) {
                    setCurrentUser(userProfile);
                    setIsProfileLoaded(true); // Profile loaded for offline user
                    // Load data for offline user
                    await loadData(true, navigator.onLine, userProfile);
                }
            }
        } catch (error) {
            console.error('Error loading offline user:', error);
        }
    }, [loadData]);

    const handleLogout = useCallback(async () => {
        try {
            // Clear offline session first to prevent restoration
            await clearOfflineSession();

            // Clear app data from state
            clearData();
            setCurrentUser(null);

            // Manually clear Supabase localStorage for offline logout
            if (!navigator.onLine) {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.includes('supabase') || key.includes('auth') || key.startsWith('sb-')) {
                        localStorage.removeItem(key);
                    }
                });
            }

            // Always attempt signOut (works online, harmless offline after manual clear)
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error("Error signing out from Supabase:", error);
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    }, [clearData]);

    const addProduct = useCallback(async (product: Omit<Product, 'id'>) => {
        const { error } = await supabase.from('products').insert({ id: window.crypto.randomUUID(), name: product.name, is_active: product.isActive });
        if (error) throw error;
        await fetchAllData();
    }, [fetchAllData]);

    const updateProduct = useCallback(async (productId: string, updates: Partial<Product>) => {
        const { error } = await supabase.from('products').update({ name: updates.name, is_active: updates.isActive }).eq('id', productId);
        if (error) throw error;
        await fetchAllData();
    }, [fetchAllData]);

    const addDriver = useCallback(async (driver: Omit<Driver, 'id'>) => {
        const { error } = await supabase.from('drivers').insert({ name: driver.name, plate_number: driver.plateNumber, is_active: driver.isActive });
        if(error) throw error;
        await fetchAllData();
    }, [fetchAllData]);

    const updateDriver = useCallback(async (driverId: number, updates: Partial<Driver>) => {
        const { error } = await supabase.from('drivers').update({ name: updates.name, plate_number: updates.plateNumber, is_active: updates.isActive }).eq('id', driverId);
        if(error) throw error;
        await fetchAllData();
    }, [fetchAllData]);

    const deleteDriver = useCallback(async (driverId: number) => {
        const { error } = await supabase.from('drivers').delete().eq('id', driverId);
        if(error) throw error;
        await fetchAllData();
    }, [fetchAllData]);

    const addRegion = useCallback(async (region: Omit<Region, 'id'>) => {
        const { error } = await supabase.from('regions').insert({ id: window.crypto.randomUUID(), name: region.name, diesel_liter_price: region.dieselLiterPrice, diesel_liters: region.dieselLiters, zaitri_fee: region.zaitriFee });
        if(error) throw error;
        await fetchAllData();
    }, [fetchAllData]);

    const updateRegion = useCallback(async (regionId: string, updates: Partial<Region>) => {
        const { error } = await supabase.from('regions').update({ name: updates.name, diesel_liter_price: updates.dieselLiterPrice, diesel_liters: updates.dieselLiters, zaitri_fee: updates.zaitriFee }).eq('id', regionId);
        if(error) throw error;
        await fetchAllData();
    }, [fetchAllData]);

    const deleteRegion = useCallback(async (regionId: string) => {
        const { error } = await supabase.from('regions').delete().eq('id', regionId);
        if(error) throw error;
        await fetchAllData();
    }, [fetchAllData]);

    const addProductPrice = useCallback(async (price: Omit<ProductPrice, 'id'>) => {
        const { error } = await supabase.from('product_prices').insert({ id: window.crypto.randomUUID(), region_id: price.regionId, product_id: price.productId, price: price.price });
        if(error) throw error;
        await fetchAllData();
    }, [fetchAllData]);

    const updateProductPrice = useCallback(async (priceId: string, updates: Partial<ProductPrice>) => {
        const { error } = await supabase.from('product_prices').update({ price: updates.price }).eq('id', priceId);
        if(error) throw error;
        await fetchAllData();
    }, [fetchAllData]);

    const deleteProductPrice = useCallback(async (priceId: string) => {
        const { error } = await supabase.from('product_prices').delete().eq('id', priceId);
        if(error) throw error;
        await fetchAllData();
    }, [fetchAllData]);

    const addShipment = useCallback(async (shipment: Omit<Shipment, 'id'>) => {
        if (!isOnline) {
            logger.info('Offline: Queuing shipment creation.');
            // Create a temporary ID for local display
            const offlineShipment: Shipment = { ...shipment, id: `offline-${crypto.randomUUID()}`, isPendingSync: true };
            
            const currentShipments = await IndexedDB.getAllFromStore<Shipment>(STORES.SHIPMENTS);
            const updatedShipments = [offlineShipment, ...currentShipments]; // Add to top
            setShipments(updatedShipments);
            await IndexedDB.saveAllToStore(STORES.SHIPMENTS, updatedShipments);

            await IndexedDB.addToMutationQueue({ type: 'addShipment', payload: offlineShipment });
            return;
        }

        const { products, ...shipmentData } = shipment;
        // Cast to any to avoid TS error about Partial<Update> not matching Insert required fields
        const shipmentToInsert = { ...shipmentToRow(shipmentData), id: crypto.randomUUID(), created_by: currentUser?.id } as any;
        
        const { data: newShipmentData, error: shipmentError } = await supabase.from('shipments').insert(shipmentToInsert).select().single();
        if (shipmentError) throw shipmentError;
        
        const shipmentProductsToInsert = products.map(p => ({ 
            shipment_id: newShipmentData.id, 
            product_id: p.productId, 
            product_name: p.productName, 
            carton_count: p.cartonCount, 
            product_wage_price: p.productWagePrice 
        }));
        
        const { error: productsError } = await supabase.from('shipment_products').insert(shipmentProductsToInsert);
        if (productsError) { 
            console.error("Failed to insert products for shipment:", newShipmentData.id, productsError); 
            // Ideally delete the shipment if product insertion fails to maintain integrity, but for now throwing error.
            throw productsError; 
        }
        
        await fetchAllData();
    }, [currentUser, fetchAllData, isOnline]);

    const updateShipment = useCallback(async (shipmentId: string, updates: Partial<Shipment>) => {
        if (!isOnline) {
            logger.info('Offline: Queuing shipment update.');

            // Set updated_at for local state consistency
            updates.updated_at = new Date().toISOString();

            // Optimistically update local state
            const updatedShipments = shipments.map(s =>
                s.id === shipmentId ? { ...s, ...updates } : s
            );
            setShipments(updatedShipments);
            await IndexedDB.saveAllToStore(STORES.SHIPMENTS, updatedShipments);

            // Queue the mutation
            await IndexedDB.addToMutationQueue({ type: 'updateShipment', payload: { shipmentId, updates } });
            return;
        }

        const { products, ...shipmentUpdates } = updates;

        // Update the main shipment record
        if (Object.keys(shipmentUpdates).length > 0) {
            const updateRow = shipmentToRow(shipmentUpdates);
            const { error } = await supabase.from('shipments').update(updateRow).eq('id', shipmentId);
            if(error) throw error;
        }

        // Update products if provided
        if (products !== undefined) {
            // Delete existing products for this shipment
            const { error: deleteError } = await supabase
                .from('shipment_products')
                .delete()
                .eq('shipment_id', shipmentId);
            if (deleteError) throw deleteError;

            // Insert new products if any
            if (products.length > 0) {
                const shipmentProductsToInsert = products.map(p => ({
                    shipment_id: shipmentId,
                    product_id: p.productId,
                    product_name: p.productName,
                    carton_count: p.cartonCount,
                    product_wage_price: p.productWagePrice
                }));

                const { error: productsError } = await supabase
                    .from('shipment_products')
                    .insert(shipmentProductsToInsert);
                if (productsError) throw productsError;
            }
        }

        // Update local state with updated_at for immediate UI update
        updates.updated_at = new Date().toISOString();
        const updatedShipments = shipments.map(s =>
            s.id === shipmentId ? { ...s, ...updates } : s
        );
        setShipments(updatedShipments);

        await fetchAllData();
    }, [fetchAllData, isOnline, shipments]);
    
    const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
        const { error } = await supabase.from('users').update({ is_active: updates.isActive }).eq('id', userId);
        if (error) throw error;
        await fetchAllData();
    }, [fetchAllData]);

    const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
         // Notifications are fire-and-forget, mostly relevant for online users.
         // If offline, we could queue them, but for simplicity we'll skip or only try if online.
         if (!isOnline) return; 
        const { error } = await supabase.from('notifications').insert({ id: window.crypto.randomUUID(), timestamp: new Date().toISOString(), message: notification.message, category: notification.category, target_roles: notification.targetRoles, target_user_ids: notification.targetUserIds });
        if (error) throw error;
        // Don't refetch all data just for a notification sent
    }, [isOnline]);

    const markNotificationAsRead = useCallback(async (notificationId: string) => {
        const originalNotifications = [...notifications];
        setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, read: true } : n));
        if (!isOnline) return; // Optimistic update offline
        
        const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
        if (error) {
            console.error("Failed to mark notification as read:", error);
            setNotifications(originalNotifications);
        }
    }, [notifications, isOnline]);

    const markAllNotificationsAsRead = useCallback(async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id);
        if (unreadIds.length === 0) return;
        const originalNotifications = [...notifications];
        setNotifications(prev => prev.map(n => unreadIds.includes(n.id) ? { ...n, read: true } : n));
        
        if (!isOnline) return; // Optimistic update offline

        const { error } = await supabase.from('notifications').update({ read: true }).in('id', unreadIds);
        if (error) {
            console.error("Failed to mark all notifications as read:", error);
            setNotifications(originalNotifications);
        }
    }, [notifications, isOnline]);

    const addUser = useCallback(async (userData: Omit<User, 'id'>, password: string): Promise<User | null> => {
        try {
            // Create authentication account
            const { data, error } = await supabase.auth.signUp({
                email: `${userData.username}@temp.placeholder`, // Placeholder email format
                password: password,
            });

            if (error) {
                console.error('Error creating auth user:', error);
                throw error;
            }

            if (!data.user) {
                throw new Error('User creation failed: No user returned');
            }

            // Create user profile in users table
            const { error: profileError } = await supabase.from('users').insert({
                id: data.user.id,
                username: userData.username,
                role: userData.role,
                is_active: userData.isActive ?? true,
            });

            if (profileError) {
                console.error('Error creating user profile:', profileError);
                throw profileError;
            }

            // Refresh data to include new user
            await fetchAllData();

            const newUser: User = {
                ...userData,
                id: data.user.id,
            };

            return newUser;
        } catch (err) {
            console.error('addUser failed:', err);
            return null;
        }
    }, [fetchAllData]);

    const createInstallment = useCallback(async (installment: Omit<Installment, 'id' | 'createdAt' | 'updatedAt'>) => {
        if (!isOnline) {
            logger.info('Offline: Queuing installment creation.');
            await IndexedDB.addToMutationQueue({ type: 'createInstallment', payload: installment });
            return;
        }

        // Check if installment already exists for this shipment
        const { data: existingInstallment, error: checkError } = await supabase
            .from('installments')
            .select('id')
            .eq('shipment_id', installment.shipmentId)
            .maybeSingle();

        if (checkError) {
            throw checkError;
        }

        if (existingInstallment) {
            // Check if the shipment status is already INSTALLMENTS
            const shipment = shipments.find(s => s.id === installment.shipmentId);
            if (shipment && shipment.status === ShipmentStatus.INSTALLMENTS) {
                throw new Error('Installment already exists for this shipment');
            } else {
                // Installment exists but shipment status is not updated - this means previous transfer failed
                // Don't create duplicate, just update the shipment status
                await updateShipment(installment.shipmentId, { status: ShipmentStatus.INSTALLMENTS });
                await fetchAllData();
                return;
            }
        }

        const { error } = await (supabase as any).from('installments').insert({
            shipment_id: installment.shipmentId,
            payable_amount: installment.payableAmount,
            remaining_amount: installment.payableAmount, // Initially same as payable
            status: installment.status,
            installment_type: installment.installmentType || 'regular',
            original_amount: installment.originalAmount,
            notes: installment.notes,
            created_by: currentUser?.id,
            updated_by: currentUser?.id,
        });

        if (error) throw error;
        await fetchAllData();
    }, [isOnline, currentUser?.id, fetchAllData, shipments]);

    const updateInstallment = useCallback(async (installmentId: string, updates: Partial<Installment>) => {
        if (!isOnline) {
            logger.info('Offline: Queuing installment update.');
            await IndexedDB.addToMutationQueue({ type: 'updateInstallment', payload: { installmentId, updates } });
            return;
        }

        const updateData: Partial<Database['public']['Tables']['installments']['Update']> = {};
        if (updates.payableAmount !== undefined) updateData.payable_amount = updates.payableAmount;
        if (updates.remainingAmount !== undefined) updateData.remaining_amount = updates.remainingAmount;
        if (updates.status !== undefined) updateData.status = updates.status;
        if (updates.installmentType !== undefined) updateData.installment_type = updates.installmentType;
        if (updates.originalAmount !== undefined) updateData.original_amount = updates.originalAmount;
        if (updates.notes !== undefined) updateData.notes = updates.notes;
        if (updates.updatedBy !== undefined) updateData.updated_by = updates.updatedBy;

        const { error } = await (supabase as any).from('installments').update(updateData).eq('id', installmentId);

        if (error) throw error;
        await fetchAllData();
    }, [isOnline, fetchAllData]);

    const addInstallmentPayment = useCallback(async (payment: Omit<InstallmentPayment, 'id' | 'createdAt'>) => {
        if (!isOnline) {
            logger.info('Offline: Queuing installment payment.');
            await IndexedDB.addToMutationQueue({ type: 'addInstallmentPayment', payload: payment });
            return;
        }

        const { error } = await (supabase as any).from('installment_payments').insert({
            installment_id: payment.installmentId,
            amount: payment.amount,
            received_date: payment.receivedDate,
            notes: payment.notes,
            created_by: currentUser?.id,
        });

        if (error) throw error;
        await fetchAllData();
    }, [isOnline, currentUser?.id, fetchAllData]);

    const updateInstallmentPayment = useCallback(async (paymentId: string, updates: Partial<InstallmentPayment>) => {
        if (!isOnline) {
            logger.info('Offline: Queuing installment payment update.');
            await IndexedDB.addToMutationQueue({ type: 'updateInstallmentPayment', payload: { paymentId, updates } });
            return;
        }

        const updateData: Partial<Database['public']['Tables']['installment_payments']['Update']> = {};
        if (updates.amount !== undefined) updateData.amount = updates.amount;
        if (updates.receivedDate !== undefined) updateData.received_date = updates.receivedDate;
        if (updates.paymentMethod !== undefined) updateData.payment_method = updates.paymentMethod;
        if (updates.referenceNumber !== undefined) updateData.reference_number = updates.referenceNumber;
        if (updates.notes !== undefined) updateData.notes = updates.notes;

        const { error } = await (supabase as any).from('installment_payments').update(updateData).eq('id', paymentId);

        if (error) throw error;
        await fetchAllData();
    }, [isOnline, fetchAllData]);

    const value = useMemo(() => ({
        currentUser, handleLogout, loadOfflineUser, users, addUser, updateUser,
        products, addProduct, updateProduct,
        drivers, addDriver, updateDriver, deleteDriver,
        regions, addRegion, updateRegion, deleteRegion,
        shipments, addShipment, updateShipment,
        productPrices, addProductPrice, updateProductPrice, deleteProductPrice,
        notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead,
        installments, createInstallment, updateInstallment, installmentPayments, addInstallmentPayment, updateInstallmentPayment,
        accountantPrintAccess, setAccountantPrintAccess, isPrintHeaderEnabled, setIsPrintHeaderEnabled,
        appName, setAppName, companyName, setCompanyName, companyAddress, setCompanyAddress, companyPhone, setCompanyPhone,
        companyLogo, setCompanyLogo, isTimeWidgetVisible, setIsTimeWidgetVisible,
        loading, error, isOnline, isSyncing, isProfileLoaded,
        refreshAllData: fetchAllData,
        syncOfflineMutations,
    }), [
        currentUser, handleLogout, loadOfflineUser, users, addUser, updateUser,
        products, addProduct, updateProduct,
        drivers, addDriver, updateDriver, deleteDriver,
        regions, addRegion, updateRegion, deleteRegion,
        shipments, addShipment, updateShipment,
        productPrices, addProductPrice, updateProductPrice, deleteProductPrice,
        notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead,
        installments, createInstallment, updateInstallment, installmentPayments, addInstallmentPayment, updateInstallmentPayment,
        accountantPrintAccess, isPrintHeaderEnabled, appName, companyName, companyAddress, companyPhone, companyLogo, isTimeWidgetVisible,
        loading, error, isOnline, isSyncing, isProfileLoaded, setAccountantPrintAccess, setIsPrintHeaderEnabled, setAppName, setCompanyName, setCompanyAddress, setCompanyPhone, setCompanyLogo, setIsTimeWidgetVisible,
        fetchAllData, syncOfflineMutations
    ]);

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};
