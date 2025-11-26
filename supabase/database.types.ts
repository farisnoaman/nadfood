export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      drivers: {
        Row: {
          id: number
          name: string
          plate_number: string
          is_active: boolean | null
        }
        Insert: {
          id?: number
          name: string
          plate_number: string
          is_active?: boolean | null
        }
        Update: {
          id?: number
          name?: string
          plate_number?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          message: string
          timestamp: string
          read: boolean | null
          category: string
          target_roles: string[] | null
          target_user_ids: string[] | null
        }
        Insert: {
          id?: string
          message: string
          timestamp: string
          read?: boolean | null
          category: string
          target_roles?: string[] | null
          target_user_ids?: string[] | null
        }
        Update: {
          id?: string
          message?: string
          timestamp?: string
          read?: boolean | null
          category?: string
          target_roles?: string[] | null
          target_user_ids?: string[] | null
        }
        Relationships: []
      }
      products: {
        Row: {
          id: string
          name: string
          is_active: boolean | null
        }
        Insert: {
          id: string
          name: string
          is_active?: boolean | null
        }
        Update: {
          id?: string
          name?: string
          is_active?: boolean | null
        }
        Relationships: []
      }
      product_prices: {
        Row: {
          id: string
          region_id: string
          product_id: string
          price: number
        }
        Insert: {
          id: string
          region_id: string
          product_id: string
          price: number
        }
        Update: {
          id?: string
          region_id?: string
          product_id?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_prices_region_id_fkey"
            columns: ["region_id"]
            referencedRelation: "regions"
            referencedColumns: ["id"]
          }
        ]
      }
      regions: {
        Row: {
          id: string
          name: string
          diesel_liter_price: number
          diesel_liters: number
          zaitri_fee: number
        }
        Insert: {
          id: string
          name: string
          diesel_liter_price: number
          diesel_liters: number
          zaitri_fee: number
        }
        Update: {
          id?: string
          name?: string
          diesel_liter_price?: number
          diesel_liters?: number
          zaitri_fee?: number
        }
        Relationships: []
      }
      shipment_products: {
        Row: {
          id: number
          shipment_id: string
          product_id: string
          product_name: string
          carton_count: number
          product_wage_price: number | null
        }
        Insert: {
          id?: number
          shipment_id: string
          product_id: string
          product_name: string
          carton_count: number
          product_wage_price?: number | null
        }
        Update: {
          id?: number
          shipment_id?: string
          product_id?: string
          product_name?: string
          carton_count?: number
          product_wage_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shipment_products_product_id_fkey"
            columns: ["product_id"]
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipment_products_shipment_id_fkey"
            columns: ["shipment_id"]
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          }
        ]
      }
      shipments: {
        Row: {
          id: string
          sales_order: string
          order_date: string
          entry_timestamp: string
          region_id: string
          driver_id: number
          status: string
          total_diesel: number | null
          total_wage: number | null
          zaitri_fee: number | null
          admin_expenses: number | null
          due_amount: number | null
          damaged_value: number | null
          shortage_value: number | null
          road_expenses: number | null
          due_amount_after_discount: number | null
          other_amounts: number | null
          improvement_bonds: number | null
          evening_allowance: number | null
          total_due_amount: number | null
          tax_rate: number | null
          total_tax: number | null
          transfer_number: string | null
          transfer_date: string | null
          modified_by: string | null
          modified_at: string | null
          deductions_edited_by: string | null
          deductions_edited_at: string | null
          created_by: string | null
          created_at: string | null
          has_missing_prices: boolean
        }
        Insert: {
          id?: string
          sales_order: string
          order_date: string
          entry_timestamp: string
          region_id: string
          driver_id: number
          status: string
          total_diesel?: number | null
          total_wage?: number | null
          zaitri_fee?: number | null
          admin_expenses?: number | null
          due_amount?: number | null
          damaged_value?: number | null
          shortage_value?: number | null
          road_expenses?: number | null
          due_amount_after_discount?: number | null
          other_amounts?: number | null
          improvement_bonds?: number | null
          evening_allowance?: number | null
          total_due_amount?: number | null
          tax_rate?: number | null
          total_tax?: number | null
          transfer_number?: string | null
          transfer_date?: string | null
          modified_by?: string | null
          modified_at?: string | null
          deductions_edited_by?: string | null
          deductions_edited_at?: string | null
          created_by?: string | null
          created_at?: string | null
          has_missing_prices?: boolean
        }
        Update: {
          id?: string
          sales_order?: string
          order_date?: string
          entry_timestamp?: string
          region_id?: string
          driver_id?: number
          status?: string
          total_diesel?: number | null
          total_wage?: number | null
          zaitri_fee?: number | null
          admin_expenses?: number | null
          due_amount?: number | null
          damaged_value?: number | null
          shortage_value?: number | null
          road_expenses?: number | null
          due_amount_after_discount?: number | null
          other_amounts?: number | null
          improvement_bonds?: number | null
          evening_allowance?: number | null
          total_due_amount?: number | null
          tax_rate?: number | null
          total_tax?: number | null
          transfer_number?: string | null
          transfer_date?: string | null
          modified_by?: string | null
          modified_at?: string | null
          deductions_edited_by?: string | null
          deductions_edited_at?: string | null
          created_by?: string | null
          created_at?: string | null
          has_missing_prices?: boolean
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          username: string
          role: string
          is_active: boolean | null
          created_at: string | null
        }
        Insert: {
          id: string
          username: string
          role: string
          is_active?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          username?: string
          role?: string
          is_active?: boolean | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
