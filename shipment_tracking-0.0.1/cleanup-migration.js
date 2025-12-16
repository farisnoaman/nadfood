/**
 * Migration Script to Remove Debug Functions
 * Run this once to clean up debug/test functions from the database
 */

import pkg from 'pg';
const { Client } = pkg;

// Database connection details
const dbConfig = {
  host: 'db.kjvzhzbxspgvvmktjwdi.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdnpoemJ4c3BndnZta3Rqd2RpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MjYyNjIxNCwiZXhwIjoyMDc4MjAyMjE0fQ.7f3k6YK-RnhL15_jhc-SODN_UFsPLnG3JQdjpgAOKGk',
  ssl: { rejectUnauthorized: false }
};

async function cleanupDebugFunctions() {
  const client = new Client(dbConfig);

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected successfully!');

    console.log('Starting cleanup of debug/test functions...');

    // Drop debug functions
    const functionsToDrop = [
      'debug_current_user()',
      'debug_user_info()',
      'test_shipment_update()',
      'get_test_data()'
    ];

    for (const func of functionsToDrop) {
      try {
        await client.query(`DROP FUNCTION IF EXISTS ${func}`);
        console.log(`✓ Dropped function: ${func}`);
      } catch (err) {
        console.log(`Note: Could not drop ${func} (may not exist):`, err.message);
      }
    }

    console.log('Cleanup completed successfully!');
    console.log('Debug and test functions have been removed from the database.');

  } catch (error) {
    console.error('Error during cleanup:', error);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

// Run the cleanup
cleanupDebugFunctions();