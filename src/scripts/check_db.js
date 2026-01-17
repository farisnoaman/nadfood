
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple env parser
function loadEnv() {
    try {
        const envPath = path.resolve(__dirname, '../../.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const env = {};
        envFile.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                let value = match[2].trim();
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.slice(1, -1);
                }
                env[match[1].trim()] = value;
            }
        });
        return env;
    } catch (e) {
        console.error('Could not load .env file', e);
        return {};
    }
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL;
// Use Anon Key since Service Role Key is missing locally
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Anon Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Checking database schema with Anon Key...');
    console.log('URL:', supabaseUrl);

    // Try to select the new column
    const { data, error } = await supabase
        .from('companies')
        .select('id, payment_status')
        .limit(1);

    if (error) {
        console.error('Error selecting payment_status:', error.message);
        if (error.message.includes('column "payment_status" does not exist')) {
            console.error('❌ FAILURE: Column payment_status does not exist. Migration was not applied.');
        } else {
            console.error('⚠️ Warning: Other error accessing database (likely RLS).');
            console.error('If the error is "permission denied", it means RLS is working but we cant confirm column existence.');
            // However, if the column didn't exist, Postgres typically throws "column does not exist" BEFORE checking RLS if we select it specifically.
            // Actually, if RLS blocks SELECT on table, it returns empty or error.
        }
    } else {
        console.log('✅ SUCCESS: Column payment_status exists and is readable.');
    }
}

checkSchema();
