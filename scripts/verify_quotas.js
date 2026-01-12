import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://thenalkjfbmjyhvmhbki.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoZW5hbGtqZmJtanlodm1oYmtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU3NDM3NSwiZXhwIjoyMDc5MTUwMzc1fQ.bKMtf3l1fkAVIxkL3y5wBsz42IzgzwvG0xsPAX8PYCk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function verify() {
    console.log('🧪 Starting Quota Verification...');

    // 1. Get 'Bronze' Plan ID
    const { data: plans, error: planError } = await supabase
        .from('subscription_plans')
        .select('id')
        .eq('name', 'Bronze')
        .single();

    if (planError || !plans) {
        console.error('❌ Failed to fetch Bronze plan:', planError);
        return;
    }
    const bronzeId = plans.id;
    console.log(`✅ Found Bronze Plan: ${bronzeId}`);

    // 2. Create Test Company
    const TEST_SLUG = 'quota-test-' + Date.now();
    const { data: company, error: companyError } = await supabase
        .from('companies')
        .insert({
            name: 'Quota Test Co',
            slug: TEST_SLUG,
            plan_id: bronzeId
        })
        .select()
        .single();

    if (companyError) {
        console.error('❌ Failed to create test company:', companyError);
        return;
    }
    const companyId = company.id;
    console.log(`✅ Created Test Company (${TEST_SLUG}): ${companyId}`);

    // 3. Insert 50 Products (Bronze limit) - Wait, limit is 50.
    // Bronze Limit in migration: ('Bronze', ..., 5, 50, 10, ...) -- Wait.
    // VALUES ('Bronze', '...', 5, 50, 10, 200) -> max_users=5, max_products=50.
    // Insert 50 is too many for a quick test. 
    // Let's check max_drivers = 10. 
    // Or max_users = 5. User creation is slower (auth).
    // I should have made a smaller limit for test plan, but standard is Bronze.

    // Let's try inserting 51 products? No 50 is too many requests.
    // Let's update the limit for this company specifically? No, it uses plan.

    // Alternative: Test with Drivers. Limit is 10.
    // 10 is manageable.

    console.log('🚗 Testing Driver Quota (Limit: 10)...');

    const driversToInsert = [];
    for (let i = 0; i < 10; i++) {
        driversToInsert.push({
            name: `Driver ${i}`,
            plate_number: `ABC-${i}`,
            company_id: companyId
        });
    }

    // Bulk insert 10 (Should success)
    const { error: bulkError } = await supabase.from('drivers').insert(driversToInsert);
    if (bulkError) {
        console.error('❌ Failed to insert allowed drivers:', bulkError);
        return;
    }
    console.log('✅ Inserted 10 Drivers (Hit Limit)');

    // 4. Try insert 11th (Should Fail)
    console.log('🚫 Attempting to exceed quota...');
    const { error: exceedError } = await supabase.from('drivers').insert({
        name: 'Driver Overflow',
        plate_number: 'OVER-9000',
        company_id: companyId
    });

    if (exceedError && exceedError.message.includes('Plan quota exceeded')) {
        console.log('✅ Quota Enforcement Working! Error:', exceedError.message);
    } else {
        console.error('❌ Quota FAILED to enforce. Result:', exceedError || 'Success (Unexpected)');
    }

    // 5. Cleanup
    console.log('🧹 Cleaning up...');
    await supabase.from('companies').delete().eq('id', companyId);
    console.log('✨ Cleanup complete.');
}

verify().catch(console.error);
