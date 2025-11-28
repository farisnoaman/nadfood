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
      regions: {
        Row: {
          id: string
          name: string
          diesel_liter_price: number
          diesel_liters: number
          zaitri_fee: number
          road_expenses: number
        }
        Insert: {
          id: string
          name: string
          diesel_liter_price: number
          diesel_liters: number
          zaitri_fee: number
          road_expenses?: number
        }
        Update: {
          id?: string
          name?: string
          diesel_liter_price?: number
          diesel_liters?: number
          zaitri_fee?: number
          road_expenses?: number
        }
        Relationships: []
      }
      shipment_products: {
        Row: {
          id: string
          shipment_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
        }
        Insert: {
          id: string
          shipment_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
        }
        Update: {
          id?: string
          shipment_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
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
          total_diesel: number
          total_wage: number
          zaitri_fee: number
          admin_expenses: number
          due_amount: number
          damaged_value: number
          shortage_value: number
          road_expenses: number
          due_amount_after_discount: number
          other_amounts: number
          improvement_bonds: number
          evening_allowance: number
          total_due_amount: number
          tax_rate: number
          total_tax: number
          transfer_number: string | null
          transfer_date: string | null
          modified_by: string | null
          modified_at: string | null
          deductions_edited_by: string | null
          deductions_edited_at: string | null
          has_missing_prices: boolean | null
        }
        Insert: {
          id: string
          sales_order: string
          order_date: string
          entry_timestamp: string
          region_id: string
          driver_id: number
          status: string
          total_diesel: number
          total_wage: number
          zaitri_fee: number
          admin_expenses: number
          due_amount: number
          damaged_value: number
          shortage_value: number
          road_expenses: number
          due_amount_after_discount: number
          other_amounts: number
          improvement_bonds: number
          evening_allowance: number
          total_due_amount: number
          tax_rate: number
          total_tax: number
          transfer_number?: string | null
          transfer_date?: string | null
          modified_by?: string | null
          modified_at?: string | null
          deductions_edited_by?: string | null
          deductions_edited_at?: string | null
          has_missing_prices?: boolean | null
        }
        Update: {
          id?: string
          sales_order?: string
          order_date?: string
          entry_timestamp?: string
          region_id?: string
          driver_id?: number
          status?: string
          total_diesel?: number
          total_wage?: number
          zaitri_fee?: number
          admin_expenses?: number
          due_amount?: number
          damaged_value?: number
          shortage_value?: number
          road_expenses?: number
          due_amount_after_discount?: number
          other_amounts?: number
          improvement_bonds?: number
          evening_allowance?: number
          total_due_amount?: number
          tax_rate?: number
          total_tax?: number
          transfer_number?: string | null
          transfer_date?: string | null
          modified_by?: string | null
          modified_at?: string | null
          deductions_edited_by?: string | null
          deductions_edited_at?: string | null
          has_missing_prices?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_driver_id_fkey"
            columns: ["driver_id"]
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_region_id_fkey"
            columns: ["region_id"]
            referencedRelation: "regions"
            referencedColumns: ["id"]
          }
        ]
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