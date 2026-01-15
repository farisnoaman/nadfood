import { useCallback, useRef } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import SupabaseService from '../../../utils/supabaseService';
import * as IndexedDB from '../../../utils/indexedDB';
import { STORES } from '../../../utils/constants';
import logger from '../../../utils/logger';
import {
    User, Product, Region, Driver, Shipment, ProductPrice,
    Notification, Installment, InstallmentPayment, RegionConfig, DeductionPrice
} from '../../../types';
import { shipmentFromRow, shipmentProductFromRow } from '../mappers';
import {
    userService, productService, driverService,
    regionService, notificationService, priceService, installmentService
} from '../services';

interface DataSetters {
    setUsers: (users: User[]) => void;
    setProducts: (products: Product[]) => void;
    setDrivers: (drivers: Driver[]) => void;
    setRegions: (regions: Region[]) => void;
    setRegionConfigs: (configs: RegionConfig[]) => void;
    setShipments: (shipments: Shipment[]) => void;
    setProductPrices: (prices: ProductPrice[]) => void;
    setDeductionPrices: (prices: DeductionPrice[]) => void;
    setNotifications: (notifications: Notification[]) => void;
    setInstallments: (installments: Installment[]) => void;
    setInstallmentPayments: (payments: InstallmentPayment[]) => void;
}

interface SettingSetters {
    setAccountantPrintAccess: (value: boolean) => void;
    setIsPrintHeaderEnabled: (value: boolean) => void;
    setAppName: (value: string) => void;
    setCompanyName: (value: string) => void;
    setCompanyAddress: (value: string) => void;
    setCompanyPhone: (value: string) => void;
    setCompanyLogo: (value: string) => void;
    setIsTimeWidgetVisible: (value: boolean) => void;
    setAccountantDeductionsAccess: (value: boolean) => void;
    setAccountantAdditionsAccess: (value: boolean) => void;
    setAccountantTransferAccess: (value: boolean) => void;
}

interface UseDataLoaderProps {
    isOnline: boolean;
    currentUser: User | null;
    dataSetters: DataSetters;
    settingSetters: SettingSetters;
    setAuthError: (error: string | null) => void;
}

export const useDataLoader = ({
    isOnline,
    currentUser,
    dataSetters,
    settingSetters,
    setAuthError
}: UseDataLoaderProps) => {
    const currentUserRef = useRef<User | null>(null);
    currentUserRef.current = currentUser;

    const fetchAllData = useCallback(async () => {
        const hasCachedData = await IndexedDB.hasData(STORES.USERS);

        // OFFLINE MODE: Load from cache
        if (!isOnline && hasCachedData) {
            logger.info("Offline mode: Loading from cache only");
            try {
                const [
                    cachedUsers, cachedProducts, cachedDrivers, cachedRegions,
                    cachedShipments, cachedPrices, cachedNotifications,
                    cachedInstallments, cachedInstallmentPayments, cachedRegionConfigs
                ] = await Promise.all([
                    IndexedDB.getAllFromStore<User>(STORES.USERS),
                    IndexedDB.getAllFromStore<Product>(STORES.PRODUCTS),
                    IndexedDB.getAllFromStore<Driver>(STORES.DRIVERS),
                    IndexedDB.getAllFromStore<Region>(STORES.REGIONS),
                    IndexedDB.getAllFromStore<Shipment>(STORES.SHIPMENTS),
                    IndexedDB.getAllFromStore<ProductPrice>(STORES.PRODUCT_PRICES),
                    IndexedDB.getAllFromStore<Notification>(STORES.NOTIFICATIONS),
                    IndexedDB.getAllFromStore<Installment>(STORES.INSTALLMENTS),
                    IndexedDB.getAllFromStore<InstallmentPayment>(STORES.INSTALLMENT_PAYMENTS),
                    IndexedDB.getAllFromStore<RegionConfig>(STORES.REGION_CONFIGS)
                ]);

                if (cachedUsers.length > 0) dataSetters.setUsers(cachedUsers);
                if (cachedProducts.length > 0) dataSetters.setProducts(cachedProducts);
                if (cachedDrivers.length > 0) dataSetters.setDrivers(cachedDrivers);
                if (cachedRegions.length > 0) dataSetters.setRegions(cachedRegions);
                if (cachedShipments.length > 0) dataSetters.setShipments(cachedShipments);
                if (cachedPrices.length > 0) dataSetters.setProductPrices(cachedPrices);
                if (cachedNotifications.length > 0) dataSetters.setNotifications(cachedNotifications);
                if (cachedInstallments.length > 0) dataSetters.setInstallments(cachedInstallments);
                if (cachedInstallmentPayments.length > 0) dataSetters.setInstallmentPayments(cachedInstallmentPayments);
                if (cachedRegionConfigs.length > 0) dataSetters.setRegionConfigs(cachedRegionConfigs);

                logger.info('Offline data loaded from cache');
                return;
            } catch (cacheErr) {
                logger.error('Error loading cached data:', cacheErr);
                throw new Error('OFFLINE_CACHE_ERROR');
            }
        }

        // ONLINE MODE
        setAuthError(null);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        const companyId = currentUserRef.current?.companyId;

        try {
            // Prepare queries
            // Prepare queries
            // Shipments logic moved to SupabaseService.fetchAll invocation inside Promise.all

            const [
                newUsers, newProducts, newDrivers, newRegions, newNotifications,
                shipmentsRes, shipmentProductsRes,
                newPrices,
                settingsRes,
                newInstallments, newInstallmentPayments,
                newRegionConfigs
            ] = await Promise.all([
                userService.fetchAll(controller.signal, companyId),
                productService.fetchAll(controller.signal, companyId),
                driverService.fetchAll(controller.signal, companyId),
                regionService.fetchAll(controller.signal, companyId),
                notificationService.fetchAll(controller.signal, companyId),

                SupabaseService.fetchAll('shipments', (q) => {
                    let query = q;
                    if (companyId) {
                        query = query.eq('company_id', companyId);
                    }
                    return query.abortSignal(controller.signal);
                }),
                SupabaseService.fetchAll('shipment_products', (q) => q.abortSignal(controller.signal)),
                priceService.fetchAllProductPrices(controller.signal, companyId),
                (supabase as any).from('company_settings').select('*').maybeSingle().abortSignal(controller.signal),
                installmentService.fetchAllInstallments(controller.signal),
                installmentService.fetchAllPayments(controller.signal),
                regionService.fetchAllConfigs(controller.signal, companyId)
            ]);

            const newDeductionPrices = await priceService.fetchAllDeductionPrices(controller.signal, companyId);

            clearTimeout(timeoutId);

            // Handle Shipments & Products
            if (shipmentsRes.error) throw shipmentsRes.error;
            if (shipmentProductsRes.error) throw shipmentProductsRes.error;

            const shipmentProductsByShipmentId = (shipmentProductsRes.data || []).reduce((acc: any, sp: any) => {
                if (!acc[sp.shipment_id]) { acc[sp.shipment_id] = []; }
                acc[sp.shipment_id].push(shipmentProductFromRow(sp));
                return acc;
            }, {} as Record<string, any>);
            const newShipments = (shipmentsRes.data || []).map((s: any) => shipmentFromRow(s, shipmentProductsByShipmentId[s.id] || []));

            // State Updates & IDB Save
            dataSetters.setUsers(newUsers as User[]); await IndexedDB.saveAllToStore(STORES.USERS, newUsers as User[]);
            dataSetters.setProducts(newProducts as Product[]); await IndexedDB.saveAllToStore(STORES.PRODUCTS, newProducts as Product[]);
            dataSetters.setDrivers(newDrivers as Driver[]); await IndexedDB.saveAllToStore(STORES.DRIVERS, newDrivers as Driver[]);
            dataSetters.setRegions(newRegions as Region[]); await IndexedDB.saveAllToStore(STORES.REGIONS, newRegions as Region[]);
            dataSetters.setRegionConfigs(newRegionConfigs as RegionConfig[]); await IndexedDB.saveAllToStore(STORES.REGION_CONFIGS, newRegionConfigs as RegionConfig[]);

            dataSetters.setProductPrices(newPrices); await IndexedDB.saveAllToStore(STORES.PRODUCT_PRICES, newPrices);
            dataSetters.setDeductionPrices(newDeductionPrices);

            dataSetters.setNotifications(newNotifications as Notification[]); await IndexedDB.saveAllToStore(STORES.NOTIFICATIONS, newNotifications as Notification[]);

            dataSetters.setInstallments(newInstallments); await IndexedDB.saveAllToStore(STORES.INSTALLMENTS, newInstallments);
            dataSetters.setInstallmentPayments(newInstallmentPayments); await IndexedDB.saveAllToStore(STORES.INSTALLMENT_PAYMENTS, newInstallmentPayments);

            // Settings
            const companySettings = (settingsRes as any).data;
            if (companySettings) {
                settingSetters.setAccountantPrintAccess(companySettings.accountant_print_access ?? false);
                settingSetters.setIsPrintHeaderEnabled(companySettings.is_print_header_enabled ?? true);
                settingSetters.setAppName(companySettings.app_name || '');
                settingSetters.setCompanyName(companySettings.company_name || '');
                settingSetters.setCompanyAddress(companySettings.company_address || 'عنوان الشركة');
                settingSetters.setCompanyPhone(companySettings.company_phone || 'رقم الهاتف');
                settingSetters.setCompanyLogo(companySettings.company_logo || '');
                settingSetters.setIsTimeWidgetVisible(companySettings.is_time_widget_visible ?? true);
                settingSetters.setAccountantDeductionsAccess(companySettings.accountant_deductions_access ?? false);
                settingSetters.setAccountantAdditionsAccess(companySettings.accountant_additions_access ?? false);
                settingSetters.setAccountantTransferAccess(companySettings.accountant_transfer_access ?? false);
            }

            // Save Settings to IDB
            await Promise.all([
                IndexedDB.setSetting('accountantPrintAccess', companySettings?.accountant_print_access ?? false),
                IndexedDB.setSetting('isPrintHeaderEnabled', companySettings?.is_print_header_enabled ?? true),
                IndexedDB.setSetting('appName', companySettings?.app_name || ''),
                IndexedDB.setSetting('companyName', companySettings?.company_name || ''),
                IndexedDB.setSetting('companyAddress', companySettings?.company_address || 'عنوان الشركة'),
                IndexedDB.setSetting('companyPhone', companySettings?.company_phone || 'رقم الهاتف'),
                IndexedDB.setSetting('companyLogo', companySettings?.company_logo || ''),
                IndexedDB.setSetting('isTimeWidgetVisible', companySettings?.is_time_widget_visible ?? true)
            ]);

            // Merge pending shipments
            const mutationQueue = await IndexedDB.getMutationQueue();
            const pendingShipments = mutationQueue
                .filter((m: any) => m.type === 'addShipment')
                .map((m: any) => m.payload as Shipment);

            const finalShipments = [...pendingShipments, ...newShipments];
            dataSetters.setShipments(finalShipments);
            await IndexedDB.saveAllToStore(STORES.SHIPMENTS, finalShipments);

        } catch (err: any) {
            clearTimeout(timeoutId);
            logger.error("Error fetching data:", err);

            if (err.name === 'AbortError' || err.message === 'TIMEOUT') {
                // Could add fallback cache loading here
            }
        }
    }, [isOnline, currentUser, dataSetters, settingSetters, setAuthError]);

    return { fetchAllData };
};
