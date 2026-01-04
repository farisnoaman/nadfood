import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';

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
 * In development: uses ?tenant= query param or defaults to 'balgaith'
 * In production: extracts first part of hostname (company.domain.com)
 */
const getSubdomain = (): string | null => {
    const hostname = window.location.hostname;

    // Handle localhost development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        const params = new URLSearchParams(window.location.search);
        return params.get('tenant') || 'balgaith';
    }

    // Handle production: extract subdomain
    const parts = hostname.split('.');
    if (parts.length >= 3) {
        // company.platform.com -> company
        return parts[0];
    }

    // Fallback for single-level domains (e.g., platform.com)
    return 'balgaith';
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
        if (!subdomain) {
            setError('لم يتم العثور على رابط الشركة');
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const { data, error: fetchError } = await supabase
                .from('companies')
                .select('*')
                .eq('slug', subdomain)
                .eq('is_active', true)
                .single();

            if (fetchError) {
                console.error('Error fetching company:', fetchError);
                throw new Error('فشل في تحميل بيانات الشركة');
            }

            if (!data) {
                throw new Error('الشركة غير موجودة');
            }

            setCompany(data);

            // Apply brand color to CSS custom property
            if (data.brand_color) {
                document.documentElement.style.setProperty('--brand-color', data.brand_color);
                // Also set variations for hover states etc
                document.documentElement.style.setProperty('--brand-color-dark', adjustBrightness(data.brand_color, -20));
                document.documentElement.style.setProperty('--brand-color-light', adjustBrightness(data.brand_color, 20));
            }

            // Update document title with company name
            document.title = data.name;

        } catch (err) {
            const message = err instanceof Error ? err.message : 'فشل في تحميل الشركة';
            setError(message);
            console.error('TenantProvider error:', err);
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
