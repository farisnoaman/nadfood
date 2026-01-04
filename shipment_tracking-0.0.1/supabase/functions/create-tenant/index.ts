import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4"

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

        const { companyName, slug, adminEmail, adminPassword, planId } = await req.json()

        console.log(`🚀 Creating tenant: ${companyName} (${slug})`)

        // 1. Check if slug exists
        const { data: existingCompany } = await supabaseClient
            .from('companies')
            .select('id')
            .eq('slug', slug)
            .single()

        if (existingCompany) {
            throw new Error('Company slug already exists')
        }

        // 2. Create Auth User
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: { role: 'company_admin' }
        })

        if (authError) throw authError
        const userId = authUser.user.id
        console.log(`✅ Auth User Created: ${userId}`)

        // 3. Create Company
        const { data: company, error: companyError } = await supabaseClient
            .from('companies')
            .insert({
                name: companyName,
                slug: slug,
                plan_id: planId,
                is_active: true
            })
            .select()
            .single()

        if (companyError) {
            // Rollback Auth User? (Optional but good practice)
            await supabaseClient.auth.admin.deleteUser(userId)
            throw companyError
        }
        console.log(`✅ Company Created: ${company.id}`)

        // 4. Update User with Company ID and Role
        // (This triggers check_subscription_quota)
        const { error: updateError } = await supabaseClient
            .from('users')
            .upsert({
                id: userId,
                company_id: company.id,
                role: 'company_admin',
                username: `Admin ${companyName}`,
                is_active: true
            })

        if (updateError) {
            console.error('Failed to link user, rolling back...', updateError)
            await supabaseClient.from('companies').delete().eq('id', company.id)
            await supabaseClient.auth.admin.deleteUser(userId)
            throw updateError
        }

        console.log(`✅ Tenant Setup Complete`)

        return new Response(
            JSON.stringify({
                success: true,
                companyId: company.id,
                userId: userId,
                message: 'Tenant created successfully'
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error) {
        console.error('Error creating tenant:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
