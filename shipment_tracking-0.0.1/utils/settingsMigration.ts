/**
 * Migration script to move settings from IndexedDB to Supabase database
 * Run this once after deploying the app_settings table
 */

import { supabase } from '../utils/supabaseClient';
import * as IndexedDB from '../utils/indexedDB';
import logger from './logger';

export const migrateSettingsToDatabase = async () => {
  try {
    logger.info('Starting settings migration from IndexedDB to database...');

    // Get current settings from IndexedDB
    const [
      accountantPrintAccess,
      isPrintHeaderEnabled,
      appName,
      companyName,
      companyAddress,
      companyPhone,
      companyLogo,
      isTimeWidgetVisible
    ] = await Promise.all([
      IndexedDB.getSetting('accountantPrintAccess', false),
      IndexedDB.getSetting('isPrintHeaderEnabled', true),
      IndexedDB.getSetting('appName', 'تتبع الشحنات'),
      IndexedDB.getSetting('companyName', 'اسم الشركة'),
      IndexedDB.getSetting('companyAddress', 'عنوان الشركة'),
      IndexedDB.getSetting('companyPhone', 'رقم الهاتف'),
      IndexedDB.getSetting('companyLogo', ''),
      IndexedDB.getSetting('isTimeWidgetVisible', true)
    ]);

    // Prepare settings for database
    const settingsToMigrate = [
      { setting_key: 'accountantPrintAccess', setting_value: accountantPrintAccess.toString() },
      { setting_key: 'isPrintHeaderEnabled', setting_value: isPrintHeaderEnabled.toString() },
      { setting_key: 'appName', setting_value: appName },
      { setting_key: 'companyName', setting_value: companyName },
      { setting_key: 'companyAddress', setting_value: companyAddress },
      { setting_key: 'companyPhone', setting_value: companyPhone },
      { setting_key: 'companyLogo', setting_value: companyLogo },
      { setting_key: 'isTimeWidgetVisible', setting_value: isTimeWidgetVisible.toString() }
    ];

    // Insert/update settings in database
    for (const setting of settingsToMigrate) {
      const { error } = await supabase
        .from('app_settings')
        .upsert(setting, { onConflict: 'setting_key' });

      if (error) {
        console.error('Error migrating setting:', setting.setting_key, error);
        throw error;
      }
    }

    logger.info('Settings migration completed successfully!');
    return true;

  } catch (error) {
    console.error('Settings migration failed:', error);
    return false;
  }
};

// Auto-run migration on first admin login (can be called from AdminSettings component)
export const runSettingsMigrationIfNeeded = async () => {
  try {
    // Check if migration has already been run
    const migrationRun = await IndexedDB.getSetting('settingsMigrationCompleted', false);

    if (!migrationRun) {
      const success = await migrateSettingsToDatabase();
      if (success) {
        // Mark migration as completed
        await IndexedDB.setSetting('settingsMigrationCompleted', true);
        logger.info('Settings migration marked as completed');
      }
    } else {
      logger.info('Settings migration already completed');
    }
  } catch (error) {
    console.error('Error checking/running settings migration:', error);
  }
};