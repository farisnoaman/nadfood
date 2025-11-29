/**
 * Centralized Supabase Service
 * Provides a singleton pattern for Supabase client to avoid dynamic/static import conflicts
 */

import { createClient, SupabaseClient as SupabaseClientType } from '@supabase/supabase-js';
import type { Database } from '../../supabase/database.types';

class SupabaseService {
  private static instance: SupabaseClientType<Database> | null = null;

  private constructor() {}

  static getClient(): SupabaseClientType<Database> {
    if (!this.instance) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
      const { data, error } = await client
        .from('users')
        .select('count')
        .limit(1);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  // Settings operations
  static async getSettings() {
    const client = this.getClient();

    console.log('SupabaseService: Attempting to fetch settings');

    // First test basic database connection
    const isConnected = await this.testConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Check if app_settings table exists
    try {
      console.log('SupabaseService: Checking if app_settings table exists');
      const { error: tableError } = await client
        .from('app_settings')
        .select('setting_key')
        .limit(1);

      if (tableError) {
        console.error('SupabaseService: app_settings table does not exist or access denied:', tableError);
        throw new Error(`Settings table not accessible: ${tableError.message}`);
      }
      console.log('SupabaseService: app_settings table is accessible');
    } catch (tableCheckError) {
      console.error('SupabaseService: Table check failed:', tableCheckError);
      throw tableCheckError;
    }

    console.log('SupabaseService: Fetching all settings');
    const { data, error } = await client
      .from('app_settings')
      .select('*')
      .order('setting_key');

    if (error) {
      console.error('SupabaseService: Settings query failed:', error);
      throw error;
    }

    console.log('SupabaseService: Settings fetched successfully:', data?.length || 0, 'records');
    return data || [];
  }

  static async saveSetting(settingKey: string, settingValue: string) {
    const client = this.getClient();
    const { error } = await client
      .from('app_settings')
      .upsert({ setting_key: settingKey, setting_value: settingValue }, { onConflict: 'setting_key' });

    if (error) throw error;
  }

  static async saveSettings(settings: Array<{ setting_key: string; setting_value: string }>) {
    const client = this.getClient();
    const { error } = await client
      .from('app_settings')
      .upsert(settings, { onConflict: 'setting_key' });

    if (error) throw error;
  }

  // Generic database operations
  static async select(table: string, options?: any) {
    const client = this.getClient();
    return await client.from(table).select(options);
  }

  static async insert(table: string, data: any) {
    const client = this.getClient();
    return await client.from(table).insert(data);
  }

  static async update(table: string, data: any, matchConditions: any) {
    const client = this.getClient();
    return await client.from(table).update(data).match(matchConditions);
  }

  static async delete(table: string, matchConditions: any) {
    const client = this.getClient();
    return await client.from(table).delete().match(matchConditions);
  }
}

export default SupabaseService;