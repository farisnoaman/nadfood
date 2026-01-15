import { useEffect } from 'react';
import * as IndexedDB from '../../../utils/indexedDB';

interface SettingSetters {
    setAccountantPrintAccess: (value: boolean) => void;
    setIsPrintHeaderEnabled: (value: boolean) => void;
    setAppName: (value: string) => void;
    setCompanyName: (value: string) => void;
    setCompanyAddress: (value: string) => void;
    setCompanyPhone: (value: string) => void;
    setCompanyLogo: (value: string) => void;
    setIsTimeWidgetVisible: (value: boolean) => void;
}

interface UseInitializationProps {
    settingSetters: SettingSetters;
}

/**
 * Hook to initialize the application on mount
 * - Migrates data from localStorage to IndexedDB
 * - Loads cached settings from IndexedDB
 */
export const useInitialization = ({ settingSetters }: UseInitializationProps) => {
    useEffect(() => {
        const initializeData = async () => {
            // Migrate from localStorage to IndexedDB if needed
            await IndexedDB.migrateFromLocalStorage();

            // Load cached settings from IndexedDB
            const [
                cachedAccountantPrintAccess,
                cachedIsPrintHeaderEnabled,
                cachedAppName,
                cachedCompanyName,
                cachedCompanyAddress,
                cachedCompanyPhone,
                cachedCompanyLogo,
                cachedIsTimeWidgetVisible
            ] = await Promise.all([
                IndexedDB.getSetting('accountantPrintAccess', false),
                IndexedDB.getSetting('isPrintHeaderEnabled', true),
                IndexedDB.getSetting('appName', ''),
                IndexedDB.getSetting('companyName', ''),
                IndexedDB.getSetting('companyAddress', 'عنوان الشركة'),
                IndexedDB.getSetting('companyPhone', 'رقم الهاتف'),
                IndexedDB.getSetting('companyLogo', ''),
                IndexedDB.getSetting('isTimeWidgetVisible', true)
            ]);

            // Apply cached settings to state
            settingSetters.setAccountantPrintAccess(cachedAccountantPrintAccess);
            settingSetters.setIsPrintHeaderEnabled(cachedIsPrintHeaderEnabled);
            settingSetters.setAppName(cachedAppName);
            settingSetters.setCompanyName(cachedCompanyName);
            settingSetters.setCompanyAddress(cachedCompanyAddress);
            settingSetters.setCompanyPhone(cachedCompanyPhone);
            settingSetters.setCompanyLogo(cachedCompanyLogo);
            settingSetters.setIsTimeWidgetVisible(cachedIsTimeWidgetVisible);
        };

        initializeData();
    }, [
        settingSetters.setAccountantPrintAccess,
        settingSetters.setIsPrintHeaderEnabled,
        settingSetters.setAppName,
        settingSetters.setCompanyName,
        settingSetters.setCompanyAddress,
        settingSetters.setCompanyPhone,
        settingSetters.setCompanyLogo,
        settingSetters.setIsTimeWidgetVisible
    ]);
};
