import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://thenalkjfbmjyhvmhbki.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoZW5hbGtqZmJtanlodm1oYmtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU3NDM3NSwiZXhwIjoyMDc5MTUwMzc1fQ.bKMtf3l1fkAVIxkL3y5wBsz42IzgzwvG0xsPAX8PYCk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
    console.log('🚀 Creating Platform Super Admin...');

    const email = 'admin@platform.com';
    const password = 'password123';

    let userId;

    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true
    });

    if (authError) {
        if (authError.message.includes('already been registered')) {
            console.log('⚠️ User already exists, fetching ID...');
            // Need to list users to find by email (admin api)
            const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
                console.error('❌ Failed to list users:', listError);
                return;
            }
            const existingUser = users.find(u => u.email === email);
            if (!existingUser) {
                console.error('❌ Could not find existing user by email');
                return;
            }
            userId = existingUser.id;
        } else {
            console.error('❌ Auth creation failed:', authError.message);
            return;
        }
    } else {
        userId = authUser.user.id;
    }

    console.log(`✅ Auth User ID: ${userId}`);

    // 2. Insert into public.users with SUPER_ADMIN role
    // Workaround: Assign to Default Company (Balgaith) to bypass Quota Trigger (which strictly requires a company)
    // until 20260105000500_fix_quota_trigger.sql is applied.
    const DEFAULT_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

    const { error: dbError } = await supabase.from('users').upsert({
        id: userId,
        username: 'Platform Admin',
        role: 'super_admin',
        company_id: DEFAULT_COMPANY_ID,
        is_active: true
    });

    if (dbError) {
        console.error('❌ DB User creation failed:', dbError.message);
    } else {
        console.log('✅ Super Admin successfully created in database!');
        console.log(`credentials: ${email} / ${password}`);
    }
}

createAdmin().catch(console.error);
