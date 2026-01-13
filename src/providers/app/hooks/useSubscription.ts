import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '../../../utils/supabaseClient';
import { Company, User } from '../../../types';
import { CompanyRow, companyFromRow } from '../mappers';
import logger from '../../../utils/logger';

export const useSubscription = (currentUser: User | null) => {
    const [company, setCompany] = useState<Company | null>(null);

    const fetchCompanyCallback = useCallback(async (companyId: string) => {
        try {
            const { data, error } = await supabase
                .from('companies')
                .select('*')
                .eq('id', companyId)
                .single();

            if (error) throw error;
            if (data) {
                setCompany(companyFromRow(data as CompanyRow));
            }
        } catch (error) {
            logger.error('Error fetching company:', error);
        }
    }, []);
    // Auto-fetch company when user logs in
    useEffect(() => {
        if (currentUser?.companyId) {
            fetchCompanyCallback(currentUser.companyId);
        }
    }, [currentUser?.companyId, fetchCompanyCallback]);

    // Derived Logic
    const isSubscriptionActive = useMemo(() => {
        if (!company) return true; // Fallback during loading/migration

        const status = company.subscriptionStatus || 'active';
        const endDate = company.subscriptionEndDate ? new Date(company.subscriptionEndDate) : null;
        const now = new Date();

        // Critical: Check if company is manually deactivated
        if (company.isActive === false) return false;

        if (status === 'suspended' || status === 'cancelled' || status === 'expired') return false;
        if (endDate && now > endDate) return false;

        return true;
    }, [company]);

    const checkLimit = useCallback((entity: keyof import('../../../types').UsageLimits, countToAdd: number = 1): boolean => {
        if (!isSubscriptionActive) return false;
        if (!company?.usageLimits || !company?.currentUsage) return true; // Open limits if not defined

        const limit = company.usageLimits[entity] || 0;

        let currentCount = 0;
        // Map Application Entities to Usage Keys if needed, or assume 1:1 if keys match types
        // UsageLimits keys: maxUsers, maxDrivers, maxRegions, maxProducts, maxStorageMb
        // CurrentUsage keys: users, drivers, regions, products, storageMb

        if (entity === 'maxUsers') currentCount = company.currentUsage.users;
        else if (entity === 'maxDrivers') currentCount = company.currentUsage.drivers;
        else if (entity === 'maxRegions') currentCount = company.currentUsage.regions;
        else if (entity === 'maxProducts') currentCount = company.currentUsage.products;
        else if (entity === 'maxStorageMb') currentCount = company.currentUsage.storageMb;

        return (currentCount + countToAdd) <= limit;
    }, [isSubscriptionActive, company]);

    const hasFeature = useCallback((feature: keyof import('../../../types').CompanyFeatures): boolean => {
        if (!company?.features) return true;
        return company.features[feature] ?? false;
    }, [company]);

    return {
        company,
        setCompany,
        fetchCompany: fetchCompanyCallback,
        isSubscriptionActive,
        checkLimit,
        hasFeature
    };
};
