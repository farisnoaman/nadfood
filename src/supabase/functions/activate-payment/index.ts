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
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { autoRefreshToken: false, persistSession: false } }
        )

        // Get authorization header to identify the user
        const authHeader = req.headers.get('authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        const { code } = await req.json()

        if (!code) {
            return new Response(
                JSON.stringify({ error: 'Payment code is required' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Get the current user
        const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
            authHeader.replace('Bearer ', '')
        )

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'User not found' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        // Get user's company
        const { data: userData, error: userError } = await supabaseClient
            .from('users')
            .select('company_id')
            .eq('id', user.id)
            .single()

        console.log(`📋 User ID: ${user.id}, Company ID from users table: ${userData?.company_id || 'NOT FOUND'}`)

        if (userError || !userData?.company_id) {
            console.error('User company lookup error:', userError)
            return new Response(
                JSON.stringify({ error: `Company not found for user ${user.id}` }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
            )
        }

        console.log(`🔍 Looking for code: "${code}" for company: ${userData.company_id}`)

        // Check if payment code exists and belongs to this company
        const { data: paymentCode, error: codeError } = await supabaseClient
            .from('payment_codes')
            .select('*')
            .eq('code', code)
            .eq('company_id', userData.company_id)
            .maybeSingle()

        console.log(`📝 Payment code result:`, paymentCode ? 'FOUND' : 'NOT FOUND', codeError ? `Error: ${codeError.message}` : '')

        if (codeError) {
            console.error('Error fetching payment code:', codeError)
            return new Response(
                JSON.stringify({ error: 'Error validating payment code' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        if (!paymentCode) {
            // Try to find the code without company filter to see if it exists for another company
            const { data: anyCode } = await supabaseClient
                .from('payment_codes')
                .select('company_id')
                .eq('code', code)
                .maybeSingle()

            if (anyCode) {
                console.log(`⚠️ Code exists but for different company: ${anyCode.company_id} (user's company: ${userData.company_id})`)
                return new Response(
                    JSON.stringify({
                        success: false,
                        error: `كود الدفع غير صالح لهذا الحساب. الكود مخصص لشركة مختلفة.`
                    }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
                )
            }

            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'كود الدفع غير صالح. يرجى التأكد من إدخال نفس الكود الذي شاركته مع الإدارة.'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Check if code is already activated
        if (paymentCode.is_activated) {
            // If already activated, just return success
            return new Response(
                JSON.stringify({ success: true, message: 'تم تفعيل الحساب مسبقاً' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            )
        }

        // Check if code is expired
        if (paymentCode.expires_at && new Date(paymentCode.expires_at) < new Date()) {
            return new Response(
                JSON.stringify({
                    success: false,
                    error: 'انتهت صلاحية كود الدفع. يرجى التواصل مع الإدارة.'
                }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
            )
        }

        // Activate the payment code
        const { error: updateCodeError } = await supabaseClient
            .from('payment_codes')
            .update({
                is_activated: true,
                activated_at: new Date().toISOString()
            })
            .eq('id', paymentCode.id)

        if (updateCodeError) {
            console.error('Error activating payment code:', updateCodeError)
            return new Response(
                JSON.stringify({ error: 'Error activating payment code' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        // Update company payment status to active
        const { error: updateCompanyError } = await supabaseClient
            .from('companies')
            .update({ payment_status: 'active' })
            .eq('id', userData.company_id)

        if (updateCompanyError) {
            console.error('Error updating company status:', updateCompanyError)
            return new Response(
                JSON.stringify({ error: 'Error updating company status' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                message: 'تم تفعيل حسابك بنجاح!'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error: any) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
