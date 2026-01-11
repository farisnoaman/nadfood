/**
 * Legacy migration script - deprecated and disabled.
 * Settings are now handled by company_settings table.
 */

import logger from './logger';

export const migrateSettingsToDatabase = async () => {
  logger.info('Legacy settings migration skipped (deprecated).');
  return true;
};

export const runSettingsMigrationIfNeeded = async () => {
  logger.info('Legacy settings migration check skipped (deprecated).');
};