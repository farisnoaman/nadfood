import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';
import logger from '../utils/logger';

/**
 * Company/Tenant data structure
 */
interface Company {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    brand_color: string;
    settings: Record<string, unknown>;
    is_active: boolean;
}

interface TenantContextType {
    company: Company | null;
    loading: boolean;
    error: string | null;
    subdomain: string | null;
    refetch: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

/**
 * Hook to access tenant context
 */
export const useTenant = (): TenantContextType => {
    const context = useContext(TenantContext);
    if (!context) {
        throw new Error('useTenant must be used within TenantProvider');
    }
    return context;
};

/**
 * Extract subdomain from current hostname
 * Returns null for root domain (Platform/Super Admin)
 * Returns string for specific tenant subdomain
 */
const getSubdomain = (): string | null => {
    const hostname = window.location.hostname;

    // Handle localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const params = new URLSearchParams(window.location.search);
        // If no tenant param, treat as Platform (Root)
        return params.get('tenant');
    }

    // Handle production: extract subdomain
    const parts = hostname.split('.');

    // Check for root domain (e.g., nadfood.click or www.nadfood.click)
    // Adjust based on your actual domain structure
    const ROOT_DOMAIN = 'nadfood.click'; // Update this to match your production domain

    if (hostname === ROOT_DOMAIN || hostname === `www.${ROOT_DOMAIN}`) {
        return null; // Platform/Root
    }

    if (parts.length >= 3) {
        // company.platform.com -> company
        // Exclude 'www' from being treated as a tenant
        if (parts[0] === 'www') return null;
        return parts[0];
    }

    return null; // Fallback to Platform
};

interface TenantProviderProps {
    children: ReactNode;
}

/**
 * Provider component that fetches and provides tenant/company data
 * based on the current subdomain
 */
export const TenantProvider: React.FC<TenantProviderProps> = ({ children }) => {
    const [company, setCompany] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const subdomain = getSubdomain();

    const fetchCompany = async () => {
        // If no subdomain (Root/Platform), we are in Platform mode
        // No need to fetch company data
        if (!subdomain) {
            setLoading(false);
            setCompany(null);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            // Try to fetch company data, but don't fail if it doesn't work
            // Use a timeout to prevent hanging on network issues
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

            const { data, error: fetchError } = await supabase
                .from('companies')
                .select('*')
                .eq('slug', subdomain)
                .eq('is_active', true)
                .single();

            clearTimeout(timeoutId);

            if (fetchError) {
                // Don't throw error for auth issues - use fallback company data
                if (fetchError.code === 'PGRST116' || fetchError.message?.includes('JWT') || fetchError.message?.includes('permission')) {
                    logger.warn('Company data not accessible (auth required), using fallback');
                    // Use fallback company data for demo/development
                    const fallbackCompany = {
                        id: 'fallback',
                        name: 'بلغيث للنقل',
                        slug: subdomain,
                        logo_url: null,
                        brand_color: '#3b82f6',
                        settings: {},
                        is_active: true
                    };
                    setCompany(fallbackCompany);
                    setLoading(false);
                    return;
                }
                logger.error('Error fetching company:', fetchError);
                throw new Error('فشل في تحميل بيانات الشركة');
            }

            if (!data) {
                throw new Error('الشركة غير موجودة');
            }

            const companyData: Company = {
                id: data.id,
                name: data.name,
                slug: data.slug,
                logo_url: data.logo_url,
                brand_color: data.brand_color || '#3b82f6',
                settings: (data.settings as Record<string, unknown>) || {},
                is_active: data.is_active ?? true
            };

            setCompany(companyData);

            // Apply brand color to CSS custom property
            if (companyData.brand_color) {
                document.documentElement.style.setProperty('--brand-color', companyData.brand_color);
                // Also set variations for hover states etc
                document.documentElement.style.setProperty('--brand-color-dark', adjustBrightness(companyData.brand_color, -20));
                document.documentElement.style.setProperty('--brand-color-light', adjustBrightness(companyData.brand_color, 20));
            }

            // Update document title with company name
            document.title = companyData.name;

        } catch (err) {
            // For network errors or other failures, use fallback company data
            // This prevents the app from being unusable due to backend issues
            logger.warn('Failed to fetch company data, using fallback:', err);
            const fallbackCompany = {
                id: 'fallback',
                name: 'بلغيث للنقل',
                slug: subdomain || 'default',
                logo_url: null,
                brand_color: '#3b82f6',
                settings: {},
                is_active: true
            };
            setCompany(fallbackCompany);
            setError(null); // Clear error since we're providing fallback
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompany();
    }, [subdomain]);

    return (
        <TenantContext.Provider value={{ company, loading, error, subdomain, refetch: fetchCompany }}>
            {children}
        </TenantContext.Provider>
    );
};

/**
 * Utility to adjust color brightness
 */
function adjustBrightness(hex: string, percent: number): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Adjust brightness
    const adjust = (value: number) => {
        const adjusted = value + (percent * 255 / 100);
        return Math.max(0, Math.min(255, Math.round(adjusted)));
    };

    // Convert back to hex
    const toHex = (value: number) => value.toString(16).padStart(2, '0');

    return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

export default TenantProvider;
