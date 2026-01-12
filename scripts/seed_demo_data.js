import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://thenalkjfbmjyhvmhbki.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoZW5hbGtqZmJtanlodm1oYmtpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzU3NDM3NSwiZXhwIjoyMDc5MTUwMzc1fQ.bKMtf3l1fkAVIxkL3y5wBsz42IzgzwvG0xsPAX8PYCk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const COMPANY_ID = '00000000-0000-0000-0000-000000000001';

const users = [
    { email: 'fleet@balgaith.com', password: 'password123', role: 'مسؤول الحركة', username: 'مسؤول الحركة' },
    { email: 'accountant@balgaith.com', password: 'password123', role: 'محاسب', username: 'المحاسب' },
    { email: 'manager@balgaith.com', password: 'password123', role: 'ادمن', username: 'المدير' }
];

const settings = [
    { key: 'appName', value: 'تتبع الشحنات' },
    { key: 'companyName', value: 'اسم الشركة' },
    { key: 'companyAddress', 'value': 'عنوان الشركة' },
    { key: 'companyPhone', value: 'رقم الهاتف' },
    { key: 'companyLogo', value: '' },
    { key: 'isPrintHeaderEnabled', value: 'false' },
    { key: 'accountantPrintAccess', value: 'false' },
    { key: 'isTimeWidgetVisible', value: 'true' }
];

async function seed() {
    console.log('🌱 Starting seed...');

    // 1. Create Users
    for (const user of users) {
        console.log(`Creating user: ${user.email}`);

        // Check if user exists in Auth
        // Note: listUsers isn't always reliable for checking existence by email efficiently without iterating, 
        // but try/catch block around createUser works too.

        // Try to create user
        const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: { username: user.username }
        });

        let userId;

        if (createError) {
            console.log(`User ${user.email} might already exist or error:`, createError.message);
            // Try to fetch user ID if they exist
            if (createError.message.includes('already registered')) {
                // This is tricky without listing all users, but we can try to update metadata or just skip
                // Ideally we want to ensure the public.users record exists
                // Let's list users and find ID
                const { data: listData } = await supabase.auth.admin.listUsers();
                const existing = listData.users.find(u => u.email === user.email);
                if (existing) userId = existing.id;
            }
        } else {
            userId = authUser.user.id;
            console.log(`Created Auth user: ${userId}`);
        }

        if (userId) {
            // Upsert into public.users
            const { error: upsertError } = await supabase.from('users').upsert({
                id: userId,
                username: user.username,
                email: user.email,
                role: user.role,
                company_id: COMPANY_ID,
                is_active: true
            });

            if (upsertError) {
                console.error(`Error upserting public user for ${user.email}:`, upsertError);
            } else {
                console.log(`✅ Synced public user: ${user.email}`);
            }
        }
    }

    // 2. Insert App Settings
    console.log('⚙️ Insert App Settings...');
    for (const setting of settings) {
        const { error } = await supabase.from('app_settings').upsert({
            setting_key: setting.key,
            setting_value: setting.value,
            company_id: COMPANY_ID
        }, { onConflict: 'setting_key,company_id' });

        if (error) {
            console.error(`Error putting setting ${setting.key}:`, error);
        } else {
            console.log(`✅ Setting set: ${setting.key}`);
        }
    }

    console.log('🏁 Seed complete!');
}

seed().catch(console.error);
