/**
 * Centralized Supabase Service
 * Provides a singleton pattern for Supabase client to avoid dynamic/static import conflicts
 */

import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import type { Database } from '../supabase/database.types';
import logger from './logger';

class SupabaseService {
  private static instance: SupabaseClientType<Database> | null = null;

  private constructor() { }

  static getClient(): SupabaseClientType<Database> {
    if (!this.instance) {
      const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
      const supabaseKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase environment variables');
      }

      this.instance = createClient<Database>(supabaseUrl, supabaseKey);
    }

    return this.instance;
  }

  // Test database connection
  static async testConnection() {
    try {
      const client = this.getClient();
      const { error } = await client
        .from('users')
        .select('count')
        .limit(1);

      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Database connection test failed:', error);
      return false;
    }
  }

  // Company Settings interface (column-based)
  static CompanySettingsDefaults = {
    app_name: 'تتبع الشحنات',
    company_name: 'اسم الشركة',
    company_address: 'عنوان الشركة',
    company_phone: '',
    company_logo: '',
    is_print_header_enabled: true,
    accountant_print_access: false,
    is_time_widget_visible: true,
  };

  // Get company settings (single row per company)
  static async getCompanySettings(companyId: string | null): Promise<Record<string, any>> {
    const client = this.getClient();

    logger.debug('SupabaseService: Fetching company settings for:', companyId);

    if (!companyId) {
      logger.warn('SupabaseService: No companyId provided, returning defaults');
      return this.CompanySettingsDefaults;
    }

    const { data, error } = await client
      .from('company_settings' as any)
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error) {
      // If no settings found, return defaults (don't throw)
      if (error.code === 'PGRST116') {
        logger.warn('SupabaseService: No settings found for company, returning defaults');
        return this.CompanySettingsDefaults;
      }
      logger.error('SupabaseService: Error fetching company settings:', error);
      throw error;
    }

    logger.debug('SupabaseService: Company settings fetched successfully');
    return data || this.CompanySettingsDefaults;
  }

  // Save company settings (upsert single row)
  static async saveCompanySettings(companyId: string, settings: Record<string, any>) {
    const client = this.getClient();

    logger.debug('SupabaseService: Saving company settings for:', companyId);

    const { error } = await client
      .from('company_settings' as any)
      .upsert({
        company_id: companyId,
        ...settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'company_id' });

    if (error) {
      logger.error('SupabaseService: Error saving company settings:', error);
      throw error;
    }

    logger.debug('SupabaseService: Company settings saved successfully');
  }

  // Legacy methods (deprecated - kept for backward compatibility during migration)
  static async getSettings() {
    logger.warn('SupabaseService: getSettings() is deprecated, use getCompanySettings(companyId)');
    const client = this.getClient();
    const { data } = await client.from('app_settings' as any).select('*');
    return data || [];
  }

  static async saveSetting(settingKey: string, settingValue: string, companyId?: string) {
    if (companyId) {
      // Use new column-based approach
      const columnMap: Record<string, string> = {
        appName: 'app_name',
        companyName: 'company_name',
        companyAddress: 'company_address',
        companyPhone: 'company_phone',
        companyLogo: 'company_logo',
        isPrintHeaderEnabled: 'is_print_header_enabled',
        accountantPrintAccess: 'accountant_print_access',
        isTimeWidgetVisible: 'is_time_widget_visible',
      };
      const columnName = columnMap[settingKey] || settingKey;
      await this.saveCompanySettings(companyId, { [columnName]: settingValue });
    } else {
      // Fallback to old key-value approach
      const client = this.getClient();
      await client.from('app_settings' as any).upsert({ setting_key: settingKey, setting_value: settingValue });
    }
  }

  // Generic database operations
  static async select(table: string, options?: any) {
    const client = this.getClient();
    return await client.from(table as any).select(options);
  }

  static async insert(table: string, data: any) {
    const client = this.getClient();
    return await client.from(table as any).insert(data);
  }

  static async update(table: string, data: any, matchConditions: any) {
    const client = this.getClient();
    return await client.from(table as any).update(data).match(matchConditions);
  }

  static async delete(table: string, matchConditions: any) {
    const client = this.getClient();
    return await client.from(table as any).delete().match(matchConditions);
  }

  /**
   * Fetch all rows from a table, handling pagination automatically to bypass the 1000 row limit.
   * @param table The table name
   * @param queryModifier Optional callback to modify the query (e.g. add filters, sorts)
   * @param batchSize Number of rows to fetch per request (default 1000)
   */
  static async fetchAll<T = any>(
    table: string,
    queryModifier?: (query: any) => any,
    batchSize: number = 1000
  ): Promise<{ data: T[] | null; error: any }> {
    const client = this.getClient();
    let allData: T[] = [];
    let from = 0;
    let hasMore = true;
    let error: any = null;

    try {
      while (hasMore) {
        let query = client.from(table as any).select('*');

        if (queryModifier) {
          query = queryModifier(query);
        }

        // Apply range for pagination
        const output = await query.range(from, from + batchSize - 1);

        if (output.error) {
          throw output.error;
        }

        const data = output.data as T[];

        if (data && data.length > 0) {
          allData = [...allData, ...data];

          if (data.length < batchSize) {
            hasMore = false;
          } else {
            from += batchSize;
          }
        } else {
          hasMore = false;
        }
      }
    } catch (err) {
      logger.error(`SupabaseService: Error in fetchAll for ${table}:`, err);
      error = err;
      return { data: null, error };
    }

    return { data: allData, error: null };
  }
}

export default SupabaseService;