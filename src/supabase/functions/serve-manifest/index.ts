import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const url = new URL(req.url);
        const slug = url.searchParams.get('slug') || 'balgaith';

        // Create Supabase client with service role for unrestricted access
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Fetch company details
        const { data: company, error } = await supabase
            .from('companies')
            .select('name, logo_url, brand_color')
            .eq('slug', slug)
            .eq('is_active', true)
            .single();

        if (error) {
            logger.error('Error fetching company:', error);
        }

        // Build manifest with company branding or defaults
        const manifest = {
            name: company?.name || 'إدارة الشحنات',
            short_name: company?.name ?
                (company.name.length > 12 ? company.name.substring(0, 10) + '..' : company.name) :
                'إدارة الشحنات',
            description: 'نظام إدارة وتتبع الشحنات',
            start_url: '/',
            display: 'standalone',
            background_color: company?.brand_color || '#3b82f6',
            theme_color: company?.brand_color || '#3b82f6',
            orientation: 'portrait',
            lang: 'ar',
            dir: 'rtl',
            icons: [
                {
                    src: company?.logo_url || '/icon-192.png',
                    sizes: '192x192',
                    type: 'image/png',
                    purpose: 'any maskable',
                },
                {
                    src: company?.logo_url || '/icon-512.png',
                    sizes: '512x512',
                    type: 'image/png',
                    purpose: 'any maskable',
                },
            ],
        };

        return new Response(JSON.stringify(manifest, null, 2), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/manifest+json',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
        });
    } catch (error) {
        logger.error('Edge function error:', error);

        // Return default manifest on error
        const defaultManifest = {
            name: 'نظام تتبع الشحنات',
            short_name: 'الشحنات',
            start_url: '/',
            display: 'standalone',
            background_color: '#3b82f6',
            theme_color: '#3b82f6',
            icons: [
                { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
                { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
            ],
        };

        return new Response(JSON.stringify(defaultManifest), {
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/manifest+json',
            },
        });
    }
});
