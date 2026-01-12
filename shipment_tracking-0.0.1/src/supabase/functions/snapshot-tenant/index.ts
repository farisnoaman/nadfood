import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // 1. Get Company ID from request
        const body = await req.json()
        const { companyId, userId } = body

        if (!companyId) {
            logger.error("Missing companyId in request body:", body);
            throw new Error('Company ID is required');
        }

        logger.info(`[Snapshot] Starting for company: ${companyId}`);

        // 2. Pre-flight Checks (Existence of table and bucket)

        // Check Bucket
        const { data: buckets, error: bucketErr } = await supabaseClient.storage.listBuckets();
        if (bucketErr) throw new Error(`Failed to list storage buckets (Service Role access?): ${bucketErr.message}`);
        if (!buckets.find(b => b.id === 'backups')) {
            throw new Error("Storage bucket 'backups' missing. Please apply migration 20260105002000_backups.sql");
        }

        // Check Table
        const { error: tableErr } = await supabaseClient.from('backups').select('count', { count: 'exact', head: true }).limit(1);
        if (tableErr) throw new Error(`Table 'backups' access failed: ${tableErr.message}. Ensure migration is applied.`);

        // 3. Fetch Data with careful error handling for each
        const fetchData = async (table: string, filter: object = { company_id: companyId }) => {
            const { data, error } = await supabaseClient.from(table).select('*').match(filter);
            if (error) {
                logger.warn(`[Snapshot] Table ${table} fetch warning: ${error.message}`);
                return []; // Return empty for optional/extended data
            }
            return data;
        }

        const [
            { data: company, error: companyErr },
            users,
            products,
            drivers,
            regions,
            shipments,
            prices,
            deductions,
            settings
        ] = await Promise.all([
            supabaseClient.from('companies').select('*').eq('id', companyId).single(),
            fetchData('users'),
            fetchData('products'),
            fetchData('drivers'),
            fetchData('regions'),
            fetchData('shipments'),
            fetchData('product_prices'),
            fetchData('deduction_prices'),
            fetchData('app_settings')
        ])

        if (companyErr) throw new Error(`Company ${companyId} not found: ${companyErr.message}`);

        const snapshot = {
            version: '1.1',
            timestamp: new Date().toISOString(),
            company,
            data: {
                users,
                products,
                drivers,
                regions,
                shipments,
                prices,
                deductions,
                settings
            },
            summary: {
                usersCount: users?.length || 0,
                shipmentsCount: shipments?.length || 0,
                productsCount: products?.length || 0
            }
        }

        // 4. Serialize and Upload
        const jsonString = JSON.stringify(snapshot, null, 2)
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
        const fileName = `${companyId}/snapshot-${timestamp}.json`
        const fileSize = new TextEncoder().encode(jsonString).length

        logger.info(`[Snapshot] Uploading ${fileName} (${fileSize} bytes)...`);

        const { error: uploadError } = await supabaseClient
            .storage
            .from('backups')
            .upload(fileName, jsonString, {
                contentType: 'application/json',
                upsert: false
            })

        if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

        // 5. Create Database Record
        const { data: backupRecord, error: dbError } = await supabaseClient
            .from('backups')
            .insert({
                company_id: companyId,
                name: `backup-${new Date().toISOString().split('T')[0]}-${timestamp.slice(-5)}`,
                storage_path: fileName,
                size_bytes: fileSize,
                status: 'completed',
                created_by: userId || null
            })
            .select()
            .single()

        if (dbError) {
            // Clean up storage if DB record fails? (Optional but good)
            await supabaseClient.storage.from('backups').remove([fileName]);
            throw new Error(`Database record failed: ${dbError.message}`);
        }

        logger.info(`[Snapshot] Success: ${backupRecord.id}`);

        return new Response(
            JSON.stringify(backupRecord),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        logger.error(`[Snapshot] CRITICAL ERROR:`, error.message)
        return new Response(
            JSON.stringify({
                error: error.message,
                hint: "Please ensure the backups migration has been applied to the database."
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
