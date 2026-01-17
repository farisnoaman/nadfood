import React, { createContext, useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { User, Notification } from '../types';
import logger from '../utils/logger';
import { AppContextType } from './app/types';
import { userService } from './app/services';
import { useAuth } from './app/hooks/useAuth';
import { useProducts } from './app/hooks/useProducts';
import { useDrivers } from './app/hooks/useDrivers';
import { useRegions } from './app/hooks/useRegions';
import { useShipments } from './app/hooks/useShipments';
import { useNotifications } from './app/hooks/useNotifications';
import { usePrices } from './app/hooks/usePrices';
import { useInstallments } from './app/hooks/useInstallments';
import { useSettings } from './app/hooks/useSettings';
import { useSync } from './app/hooks/useSync';
import { useSubscription } from './app/hooks/useSubscription';
import { useDataLoader } from './app/hooks/useDataLoader';
import { useInitialization } from './app/hooks/useInitialization';

const AppContext = createContext<AppContextType | undefined>(undefined);
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // 1. Refs for breaking circular dependencies
    const fetchAllDataRef = useRef<() => Promise<void>>(async () => { });
    const refreshWrapper = useCallback(async () => {
        if (fetchAllDataRef.current) await fetchAllDataRef.current();
    }, []);

    const addNotificationRef = useRef<(n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => Promise<void>>(async () => { });
    const addNotificationWrapper = useCallback(async (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        if (addNotificationRef.current) await addNotificationRef.current(n);
    }, []);

    const clearDataRef = useRef<() => void>(() => { });
    const clearDataWrapper = useCallback(() => clearDataRef.current(), []);

    // Ref to hold the current user, updated synchronously when currentUser changes
    const currentUserRef = useRef<User | null>(null);

    // 2. Settings Hook (Independent)
    const {
        accountantPrintAccess, setAccountantPrintAccess, isPrintHeaderEnabled, setIsPrintHeaderEnabled,
        appName, setAppName, companyName, setCompanyName, companyAddress, setCompanyAddress,
        companyPhone, setCompanyPhone, companyLogo, setCompanyLogo, isTimeWidgetVisible, setIsTimeWidgetVisible,
        accountantDeductionsAccess, setAccountantDeductionsAccess,
        accountantAdditionsAccess, setAccountantAdditionsAccess,
        accountantTransferAccess, setAccountantTransferAccess
    } = useSettings();

    // 3. Auth Hook (Depends on wrappers)
    const {
        currentUser, loading, error: authError, setError: setAuthError,
        isProfileLoaded, handleLogout, loadOfflineUser
    } = useAuth({
        clearData: clearDataWrapper,
        loadData: useCallback(async (
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _hasCachedData: boolean,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _isOnline: boolean,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _offlineSession: any,
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            _userProfile: User | null
        ) => {
            // This is a minimal implementation of loadData expected by useAuth
            // Ideally useAuth should just call refreshWrapper if it needs full data load
            await refreshWrapper();
        }, [refreshWrapper]),
        addNotification: addNotificationWrapper
    });

    // 4. Sync Hook (Provides isOnline)
    const { isOnline, isSyncing, syncOfflineMutations, error: syncError } = useSync(currentUser, refreshWrapper, addNotificationWrapper);

    // 5. Subscription Hook (New)
    const {
        company, fetchCompany, isSubscriptionActive, checkLimit, hasFeature
    } = useSubscription(currentUser);

    // 6. Notification Hook (Provides addNotification implementation)
    const { notifications, setNotifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead } = useNotifications(isOnline, currentUser);

    // Update notification ref
    useEffect(() => {
        addNotificationRef.current = addNotification;
    }, [addNotification]);

    // Sync currentUserRef when currentUser changes
    useEffect(() => {
        currentUserRef.current = currentUser;
    }, [currentUser]);

    // 6. Data Hooks
    const { products, setProducts, addProduct, updateProduct, deleteProduct, batchUpsertProducts } = useProducts(isOnline, currentUser, refreshWrapper);
    const { drivers, setDrivers, addDriver, updateDriver, deleteDriver, batchUpsertDrivers } = useDrivers(isOnline, currentUser, refreshWrapper);
    const { regions, setRegions, regionConfigs, setRegionConfigs, addRegion, updateRegion, deleteRegion, addRegionConfig, updateRegionConfig, deleteRegionConfig, batchUpsertRegionConfigs, batchUpsertRegions } = useRegions(isOnline, currentUser, refreshWrapper);
    const { shipments, setShipments, addShipment, updateShipment } = useShipments(isOnline, currentUser, refreshWrapper);


    // 7. New Hooks
    const {
        productPrices, setProductPrices, deductionPrices, setDeductionPrices,
        addProductPrice, updateProductPrice, deleteProductPrice, batchUpsertProductPrices,
        addDeductionPrice, updateDeductionPrice, deleteDeductionPrice
    } = usePrices(isOnline, currentUser, refreshWrapper);

    const {
        installments, setInstallments, installmentPayments, setInstallmentPayments,
        createInstallment, updateInstallment, addInstallmentPayment, updateInstallmentPayment
    } = useInstallments(isOnline, currentUser, refreshWrapper, shipments, updateShipment);


    // 8. Users State (Not hooked yet)
    const [users, setUsers] = useState<User[]>([]);

    const addUser = useCallback(async (userData: Omit<User, 'id'>, password: string): Promise<User | null> => {
        try {
            const newUser = await userService.create(userData, password, currentUser);
            await refreshWrapper();
            return newUser;
        } catch (err) {
            logger.error('addUser failed:', err);
            return null;
        }
    }, [refreshWrapper, currentUser]);

    const updateUser = useCallback(async (userId: string, updates: Partial<User>) => {
        await userService.update(userId, updates);
        await refreshWrapper();
    }, [refreshWrapper]);


    // 9. Clear Data Implementation
    const clearData = useCallback(() => {
        setUsers([]);
        setProducts([]);
        setDrivers([]);
        setRegions([]);
        setShipments([]);
        setProductPrices([]);
        setDeductionPrices([]);
        setNotifications([]);
        setInstallments([]);
        setInstallmentPayments([]);
        setRegionConfigs([]);
        // Settings are not necessarily cleared on logout? 
    }, [setProducts, setDrivers, setRegions, setShipments, setProductPrices, setDeductionPrices, setNotifications, setInstallments, setInstallmentPayments]);

    useEffect(() => { clearDataRef.current = clearData; }, [clearData]);

    // 10. Data Loader Hook
    const { fetchAllData } = useDataLoader({
        isOnline,
        currentUser,
        dataSetters: {
            setUsers,
            setProducts,
            setDrivers,
            setRegions,
            setRegionConfigs,
            setShipments,
            setProductPrices,
            setDeductionPrices,
            setNotifications,
            setInstallments,
            setInstallmentPayments
        },
        settingSetters: {
            setAccountantPrintAccess,
            setIsPrintHeaderEnabled,
            setAppName,
            setCompanyName,
            setCompanyAddress,
            setCompanyPhone,
            setCompanyLogo,
            setIsTimeWidgetVisible,
            setAccountantDeductionsAccess,
            setAccountantAdditionsAccess,
            setAccountantTransferAccess
        },
        setAuthError
    });

    useEffect(() => { fetchAllDataRef.current = fetchAllData; }, [fetchAllData]);

    // 11. Initialization Hook
    useInitialization({
        settingSetters: {
            setAccountantPrintAccess,
            setIsPrintHeaderEnabled,
            setAppName,
            setCompanyName,
            setCompanyAddress,
            setCompanyPhone,
            setCompanyLogo,
            setIsTimeWidgetVisible
        }
    });

    // Old logic removed, now using useSubscription hook

    const value = useMemo(() => ({
        currentUser, company, handleLogout, loadOfflineUser, users, addUser, updateUser,
        products, addProduct, updateProduct, deleteProduct, batchUpsertProducts,
        drivers, addDriver, updateDriver, deleteDriver, batchUpsertDrivers,
        regions, regionConfigs, addRegion, updateRegion, deleteRegion, addRegionConfig, updateRegionConfig, deleteRegionConfig, batchUpsertRegionConfigs, batchUpsertRegions,
        shipments, addShipment, updateShipment,
        productPrices, addProductPrice, updateProductPrice, deleteProductPrice, batchUpsertProductPrices,
        deductionPrices, addDeductionPrice, updateDeductionPrice, deleteDeductionPrice,
        notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead,
        installments, createInstallment, updateInstallment, installmentPayments, addInstallmentPayment, updateInstallmentPayment,
        accountantPrintAccess, setAccountantPrintAccess, isPrintHeaderEnabled, setIsPrintHeaderEnabled,
        appName, setAppName, companyName, setCompanyName, companyAddress, setCompanyAddress, companyPhone, setCompanyPhone,
        companyLogo, setCompanyLogo, isTimeWidgetVisible, setIsTimeWidgetVisible,
        accountantDeductionsAccess, setAccountantDeductionsAccess,
        accountantAdditionsAccess, setAccountantAdditionsAccess,
        accountantTransferAccess, setAccountantTransferAccess,
        loading, error: authError || syncError, isOnline, isSyncing, isProfileLoaded,
        refreshAllData: refreshWrapper,
        syncOfflineMutations,
        isSubscriptionActive, paymentStatus: company?.payment_status || null, checkLimit, hasFeature, fetchCompany
    }), [
        currentUser, company, handleLogout, loadOfflineUser, users, addUser, updateUser,
        products, addProduct, updateProduct, deleteProduct, batchUpsertProducts,
        drivers, addDriver, updateDriver, deleteDriver, batchUpsertDrivers,
        regions, regionConfigs, addRegion, updateRegion, deleteRegion, addRegionConfig, updateRegionConfig, deleteRegionConfig, batchUpsertRegionConfigs, batchUpsertRegions,
        shipments, addShipment, updateShipment,
        productPrices, addProductPrice, updateProductPrice, deleteProductPrice, batchUpsertProductPrices,
        deductionPrices, addDeductionPrice, updateDeductionPrice, deleteDeductionPrice,
        notifications, addNotification, markNotificationAsRead, markAllNotificationsAsRead,
        installments, createInstallment, updateInstallment, installmentPayments, addInstallmentPayment, updateInstallmentPayment,
        accountantPrintAccess, isPrintHeaderEnabled, appName, companyName, companyAddress, companyPhone, companyLogo, isTimeWidgetVisible,
        accountantDeductionsAccess, accountantAdditionsAccess, accountantTransferAccess,
        loading, authError, syncError, isOnline, isSyncing, isProfileLoaded, setAccountantPrintAccess, setIsPrintHeaderEnabled, setAppName, setCompanyName, setCompanyAddress, setCompanyPhone, setCompanyLogo, setIsTimeWidgetVisible,
        setAccountantDeductionsAccess, setAccountantAdditionsAccess, setAccountantTransferAccess,
        refreshWrapper, syncOfflineMutations, isSubscriptionActive, checkLimit, hasFeature, fetchCompany
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
