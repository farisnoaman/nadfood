export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          brand_color: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          brand_color?: string | null
          created_at?: string | null
          id: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          brand_color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      drivers: {
        Row: {
          id: number
          is_active: boolean | null
          name: string
          plate_number: string
        }
        Insert: {
          id?: number
          is_active?: boolean | null
          name: string
          plate_number: string
        }
        Update: {
          id?: number
          is_active?: boolean | null
          name?: string
          plate_number?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          category: string
          company_id: string | null
          id: string
          message: string
          read: boolean | null
          target_roles: string[] | null
          target_user_ids: string[] | null
          timestamp: string
        }
        Insert: {
          category: string
          company_id?: string | null
          id: string
          message: string
          read?: boolean | null
          target_roles?: string[] | null
          target_user_ids?: string[] | null
          timestamp: string
        }
        Update: {
          category?: string
          company_id?: string | null
          id?: string
          message?: string
          read?: boolean | null
          target_roles?: string[] | null
          target_user_ids?: string[] | null
          timestamp?: string
        }
        Relationships: []
      }
      product_prices: {
        Row: {
          id: string
          price: number
          product_id: string
          region_id: string
        }
        Insert: {
          id: string
          price: number
          product_id: string
          region_id: string
        }
        Update: {
          id?: string
          price?: number
          product_id?: string
          region_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          id: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          diesel_liter_price: number | null
          diesel_liters: number | null
          id: string
          name: string
          road_expenses: number
          zaitri_fee: number | null
        }
        Insert: {
          diesel_liter_price?: number | null
          diesel_liters?: number | null
          id: string
          name: string
          road_expenses?: number
          zaitri_fee?: number | null
        }
        Update: {
          diesel_liter_price?: number | null
          diesel_liters?: number | null
          id?: string
          name?: string
          road_expenses?: number
          zaitri_fee?: number | null
        }
        Relationships: []
      }
      shipment_products: {
        Row: {
          carton_count: number
          id: number
          product_id: string
          product_name: string
          product_wage_price: number | null
          shipment_id: string
        }
        Insert: {
          carton_count: number
          id?: number
          product_id: string
          product_name: string
          product_wage_price?: number | null
          shipment_id: string
        }
        Update: {
          carton_count?: number
          id?: number
          product_id?: string
          product_name?: string
          product_wage_price?: number | null
          shipment_id?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          admin_expenses: number | null
          created_at: string | null
          created_by: string | null
          damaged_value: number | null
          deductions_edited_at: string | null
          deductions_edited_by: string | null
          driver_id: number
          due_amount: number | null
          due_amount_after_discount: number | null
          entry_timestamp: string
          evening_allowance: number | null
          has_missing_prices: boolean
          id: string
          improvement_bonds: number | null
          modified_at: string | null
          modified_by: string | null
          order_date: string
          other_amounts: number | null
          region_id: string
          road_expenses: number | null
          sales_order: string
          shortage_value: number | null
          status: string
          tax_rate: number | null
          total_diesel: number | null
          total_due_amount: number | null
          total_tax: number | null
          total_wage: number | null
          transfer_date: string | null
          transfer_number: string | null
          updated_at: string | null
          zaitri_fee: number | null
        }
        Insert: {
          admin_expenses?: number | null
          created_at?: string | null
          created_by?: string | null
          damaged_value?: number | null
          deductions_edited_at?: string | null
          deductions_edited_by?: string | null
          driver_id: number
          due_amount?: number | null
          due_amount_after_discount?: number | null
          entry_timestamp: string
          evening_allowance?: number | null
          has_missing_prices?: boolean
          id: string
          improvement_bonds?: number | null
          modified_at?: string | null
          modified_by?: string | null
          order_date: string
          other_amounts?: number | null
          region_id: string
          road_expenses?: number | null
          sales_order: string
          shortage_value?: number | null
          status: string
          tax_rate?: number | null
          total_diesel?: number | null
          total_due_amount?: number | null
          total_tax?: number | null
          total_wage?: number | null
          transfer_date?: string | null
          transfer_number?: string | null
          updated_at?: string | null
          zaitri_fee?: number | null
        }
        Update: {
          admin_expenses?: number | null
          created_at?: string | null
          created_by?: string | null
          damaged_value?: number | null
          deductions_edited_at?: string | null
          deductions_edited_by?: string | null
          driver_id?: number
          due_amount?: number | null
          due_amount_after_discount?: number | null
          entry_timestamp?: string
          evening_allowance?: number | null
          has_missing_prices?: boolean
          id?: string
          improvement_bonds?: number | null
          modified_at?: string | null
          modified_by?: string | null
          order_date?: string
          other_amounts?: number | null
          region_id?: string
          road_expenses?: number | null
          sales_order?: string
          shortage_value?: number | null
          status?: string
          tax_rate?: number | null
          total_diesel?: number | null
          total_due_amount?: number | null
          total_tax?: number | null
          total_wage?: number | null
          transfer_date?: string | null
          transfer_number?: string | null
          updated_at?: string | null
          zaitri_fee?: number | null
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          conflict_resolved: boolean | null
          created_at: string | null
          data: Json | null
          device_id: string | null
          id: string
          operation: string
          record_id: string
          sync_timestamp: string | null
          synced: boolean | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          conflict_resolved?: boolean | null
          created_at?: string | null
          data?: Json | null
          device_id?: string | null
          id?: string
          operation: string
          record_id: string
          sync_timestamp?: string | null
          synced?: boolean | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          conflict_resolved?: boolean | null
          created_at?: string | null
          data?: Json | null
          device_id?: string | null
          id?: string
          operation?: string
          record_id?: string
          sync_timestamp?: string | null
          synced?: boolean | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          role: string
          username: string
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          role: string
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          role?: string
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_authenticated_user_id: { Args: never; Returns: string }
      get_my_role: { Args: never; Returns: string }
      get_user_role: { Args: never; Returns: string }
      get_user_role_safe: { Args: { user_id_param?: string }; Returns: string }
      user_exists_safe: { Args: { user_id_param: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
