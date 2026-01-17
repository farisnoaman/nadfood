// @ts-nocheck - This is a Deno edge function, not TypeScript/Node.js
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
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SERVICE_ROLE_KEY') ?? '';

        console.log(`Debug Logs: URL exists? ${!!supabaseUrl}, Key exists? ${!!supabaseKey}`);

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing SUPABASE_URL or SERVICE_ROLE_KEY/SUPABASE_SERVICE_ROLE_KEY');
        }

        const supabaseClient = createClient(
            supabaseUrl,
            supabaseKey,
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        const { companyName, slug, adminEmail, adminPassword, planId, adminPhone, preferredContactMethod } = await req.json()

        if (!companyName || !slug || !adminEmail || !adminPassword || !planId) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: companyName, slug, adminEmail, adminPassword, planId' }),
                {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                    status: 400,
                },
            )
        }

        const logs: string[] = [];
        const log = (msg: string) => {
            console.log(msg);
            logs.push(msg);
        };

        log(`🚀 Creating tenant: ${companyName} (${slug})`);

        // 1. Check if slug exists
        const { data: existingCompany } = await supabaseClient
            .from('companies')
            .select('id')
            .eq('slug', slug)
            .single()

        if (existingCompany) {
            throw new Error('Company slug already exists')
        }
        log('✅ Slug check passed');

        // 2. Create Auth User
        const { data: authUser, error: authError } = await supabaseClient.auth.admin.createUser({
            email: adminEmail,
            password: adminPassword,
            email_confirm: true,
            user_metadata: {
                role: 'ادمن',
                username: `مدير ${companyName}`,
                is_active: true
            }
        })

        if (authError) throw authError
        const userId = authUser.user.id
        log(`✅ Auth User Created: ${userId}`);

        // 2.5 Get plan details to determine payment status
        const { data: planData, error: planError } = await supabaseClient
            .from('subscription_plans')
            .select('monthly_price')
            .eq('id', planId)
            .single()

        if (planError) {
            log(`⚠️ Could not fetch plan details: ${planError.message}`);
        } else {
            log(`✅ Plan details fetched: ${JSON.stringify(planData)}`);
        }

        // Determine payment status: active for free plans, pending_payment for paid
        const isPaidPlan = planData && planData.monthly_price > 0
        const paymentStatus = isPaidPlan ? 'pending_payment' : 'active'

        log(`📋 Plan is ${isPaidPlan ? 'PAID' : 'FREE'}, setting payment_status to: ${paymentStatus}`);

        // 3. Create Company with payment status and communication channels
        const { data: company, error: companyError } = await supabaseClient
            .from('companies')
            .insert({
                name: companyName,
                slug: slug,
                plan_id: planId,
                is_active: true,
                payment_status: paymentStatus,
                admin_phone: adminPhone || null,
                preferred_contact_method: preferredContactMethod || 'whatsapp'
            })
            .select()
            .single()

        if (companyError) {
            log(`❌ Company Creation Failed: ${companyError.message} - Details: ${companyError.details} - Hint: ${companyError.hint}`);
            // Rollback Auth User
            await supabaseClient.auth.admin.deleteUser(userId)
            throw new Error(`Company Create Failed: ${companyError.message} (${companyError.details})`);
        }
        log(`✅ Company Created: ${company.id} (payment_status: ${paymentStatus})`);

        // 4. Create default company settings
        const { error: settingsError } = await supabaseClient
            .from('company_settings')
            .insert({
                company_id: company.id,
                app_name: companyName,
                company_name: companyName
            })

        if (settingsError) {
            log(`⚠️ Settings creation warning: ${settingsError.message}`);
        } else {
            log(`✅ Company Settings Created`);
        }

        // 5. Update User with Company ID and Role
        const { error: updateError } = await supabaseClient
            .from('users')
            .upsert({
                id: userId,
                company_id: company.id,
                role: 'ادمن',
                username: `مدير ${companyName}`,
                is_active: true
            })

        if (updateError) {
            log(`❌ User Link Failed: ${updateError.message}`);
            // Rollback
            await supabaseClient.from('companies').delete().eq('id', company.id)
            await supabaseClient.auth.admin.deleteUser(userId)
            throw new Error(`User Link Failed: ${updateError.message}`);
        }

        log(`✅ Tenant Setup Complete`);

        return new Response(
            JSON.stringify({
                success: true,
                companyId: company.id,
                userId: userId,
                message: 'Tenant created successfully',
                logs // Send logs on success too for debugging
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            },
        )

    } catch (error: any) {
        console.error('Error creating tenant:', error)
        return new Response(
            JSON.stringify({
                error: error.message,
                logs: error.logs || ['Log access failed'] // Try to include logs if attached to error object, but simpler to just include what we captured? We can't easily pass logs local var here without restructuring.
                // Actually, due to closure scope, we can't easily access 'logs' if error happened early.
                // Let's rely on the thrown error message containing the juicy details we added.
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            },
        )
    }
})
