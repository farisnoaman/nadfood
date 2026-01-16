import { describe, it, expect } from 'vitest'
import {
  companyFromRow,
  userFromRow,
  productFromRow,
  driverFromRow,
  regionFromRow,
  productPriceFromRow,
  shipmentProductFromRow,
  shipmentFromRow,
  notificationFromRow,
  companySettingFromRow,
  mapCompanies,
  mapUsers,
  mapProducts,
  mapDrivers,
  mapRegions,
  mapProductPrices,
  mapNotifications,
  mapCompanySettings,
} from './dataMappers'

describe('Data Mappers', () => {
  describe('companyFromRow', () => {
    it('should map company row to company object', () => {
      const row = {
        id: 'company-1',
        name: 'Test Company',
        slug: 'test-company',
        logo_url: 'https://example.com/logo.png',
        brand_color: '#FF0000',
        settings: { theme: 'dark' },
        is_active: true,
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      }

      const result = companyFromRow(row as any)

      expect(result.id).toBe('company-1')
      expect(result.name).toBe('Test Company')
      expect(result.slug).toBe('test-company')
      expect(result.logoUrl).toBe('https://example.com/logo.png')
      expect(result.brandColor).toBe('#FF0000')
      expect(result.settings).toEqual({ theme: 'dark' })
      expect(result.isActive).toBe(true)
      expect(result.createdAt).toBe('2024-01-01')
      expect(result.updatedAt).toBe('2024-01-02')
    })

    it('should handle null values with defaults', () => {
      const row = {
        id: 'company-1',
        name: 'Test Company',
        slug: 'test-company',
        logo_url: null,
        brand_color: null,
        settings: null,
        is_active: null,
        created_at: null,
        updated_at: null,
      }

      const result = companyFromRow(row as any)

      expect(result.logoUrl).toBeUndefined()
      expect(result.brandColor).toBe('#3B82F6')
      expect(result.settings).toEqual({})
      expect(result.isActive).toBe(true)
      expect(result.createdAt).toBeUndefined()
      expect(result.updatedAt).toBeUndefined()
    })
  })

  describe('userFromRow', () => {
    it('should map user row to user object', () => {
      const row = {
        id: 'user-1',
        username: 'testuser',
        role: 'ADMIN',
        is_active: true,
        created_at: '2024-01-01',
      }

      const result = userFromRow(row as any)

      expect(result.id).toBe('user-1')
      expect(result.username).toBe('testuser')
      expect(result.role).toBe('ADMIN' as const)
      expect(result.isActive).toBe(true)
      expect(result.createdAt).toBe('2024-01-01')
    })

    it('should handle null values with defaults', () => {
      const row = {
        id: 'user-1',
        username: 'testuser',
        role: 'SALES',
        is_active: null,
        created_at: null,
      }

      const result = userFromRow(row as any)

      expect(result.isActive).toBe(true)
      expect(result.createdAt).toBeUndefined()
    })
  })

  describe('productFromRow', () => {
    it('should map product row to product object', () => {
      const row = {
        id: 'product-1',
        name: 'Test Product',
        is_active: true,
      }

      const result = productFromRow(row as any)

      expect(result.id).toBe('product-1')
      expect(result.name).toBe('Test Product')
      expect(result.isActive).toBe(true)
    })

    it('should handle null values with defaults', () => {
      const row = {
        id: 'product-1',
        name: 'Test Product',
        is_active: null,
      }

      const result = productFromRow(row as any)

      expect(result.isActive).toBe(true)
    })
  })

  describe('driverFromRow', () => {
    it('should map driver row to driver object', () => {
      const row = {
        id: 1,
        name: 'Test Driver',
        plate_number: 'ABC-123',
        is_active: true,
      }

      const result = driverFromRow(row as any)

      expect(result.id).toBe(1)
      expect(result.name).toBe('Test Driver')
      expect(result.plateNumber).toBe('ABC-123')
      expect(result.isActive).toBe(true)
    })

    it('should handle null values with defaults', () => {
      const row = {
        id: 2,
        name: 'Driver 2',
        plate_number: 'DEF-456',
        is_active: null,
      }

      const result = driverFromRow(row as any)

      expect(result.isActive).toBe(true)
    })
  })

  describe('regionFromRow', () => {
    it('should map region row to region object', () => {
      const row = {
        id: 'region-1',
        name: 'Region 1',
        diesel_liter_price: '1.5',
        diesel_liters: '50',
        zaitri_fee: '10',
        road_expenses: '5',
      }

      const result = regionFromRow(row as any)

      expect(result.id).toBe('region-1')
      expect(result.name).toBe('Region 1')
      expect(result.dieselLiterPrice).toBe(1.5)
      expect(result.dieselLiters).toBe(50)
      expect(result.zaitriFee).toBe(10)
      expect(result.roadExpenses).toBe(5)
    })

    it('should handle null values with defaults', () => {
      const row = {
        id: 'region-2',
        name: 'Region 2',
        diesel_liter_price: null,
        diesel_liters: null,
        zaitri_fee: null,
        road_expenses: null,
      }

      const result = regionFromRow(row as any)

      expect(result.dieselLiterPrice).toBe(0)
      expect(result.dieselLiters).toBe(0)
      expect(result.zaitriFee).toBe(0)
      expect(result.roadExpenses).toBe(0)
    })
  })

  describe('productPriceFromRow', () => {
    it('should map product price row to product price object', () => {
      const row = {
        id: 'price-1',
        region_id: 'region-1',
        product_id: 'product-1',
        price: '100.50',
      }

      const result = productPriceFromRow(row as any)

      expect(result.id).toBe('price-1')
      expect(result.regionId).toBe('region-1')
      expect(result.productId).toBe('product-1')
      expect(result.price).toBe(100.50)
    })
  })

  describe('shipmentProductFromRow', () => {
    it('should map shipment product row to shipment product object', () => {
      const row = {
        product_id: 'product-1',
        product_name: 'Product 1',
        carton_count: 10,
        product_wage_price: '100',
      }

      const result = shipmentProductFromRow(row as any)

      expect(result.productId).toBe('product-1')
      expect(result.productName).toBe('Product 1')
      expect(result.cartonCount).toBe(10)
      expect(result.productWagePrice).toBe(100)
    })

    it('should handle null values', () => {
      const row = {
        product_id: 'product-1',
        product_name: 'Product 1',
        carton_count: 10,
        product_wage_price: null,
      }

      const result = shipmentProductFromRow(row as any)

      expect(result.productWagePrice).toBeUndefined()
    })
  })

  describe('shipmentFromRow', () => {
    it('should map shipment row to shipment object', () => {
      const row = {
        id: 'shipment-1',
        sales_order: 'SO-001',
        order_date: '2024-01-01',
        entry_timestamp: '2024-01-01T10:00:00Z',
        region_id: 'region-1',
        driver_id: 1,
        status: 'pending',
        total_diesel: '100',
        total_wage: '1000',
        zaitri_fee: '10',
        admin_expenses: '20',
        due_amount: '870',
        damaged_value: '50',
        shortage_value: '30',
        road_expenses: '25',
        due_amount_after_discount: '820',
        other_amounts: '15',
        improvement_bonds: '10',
        evening_allowance: '5',
        transfer_fee: '3',
        total_due_amount: '850',
        tax_rate: '5',
        total_tax: '42.5',
        transfer_number: 'TR-001',
        transfer_date: '2024-01-02',
        modified_by: 'admin',
        modified_at: '2024-01-03',
        deductions_edited_by: 'accountant',
        deductions_edited_at: '2024-01-02',
        has_missing_prices: false,
        created_by: 'user-1',
        created_at: '2024-01-01',
      }

      const mockProducts = [
        {
          product_id: 'product-1',
          product_name: 'Product 1',
          carton_count: 10,
        },
      ]

      const result = shipmentFromRow(row as any, mockProducts)

      expect(result.id).toBe('shipment-1')
      expect(result.salesOrder).toBe('SO-001')
      expect(result.orderDate).toBe('2024-01-01')
      expect(result.entryTimestamp).toBe('2024-01-01T10:00:00Z')
      expect(result.regionId).toBe('region-1')
      expect(result.driverId).toBe(1)
      expect(result.status).toBe('pending' as const)
      expect(result.totalDiesel).toBe('100')
      expect(result.totalWage).toBe('1000')
      expect(result.zaitriFee).toBe('10')
      expect(result.adminExpenses).toBe('20')
      expect(result.dueAmount).toBe('870')
      expect(result.damagedValue).toBe('50')
      expect(result.shortageValue).toBe('30')
      expect(result.roadExpenses).toBe('25')
      expect(result.dueAmountAfterDiscount).toBe('820')
      expect(result.products).toEqual(mockProducts)
    })

    it('should handle all null values', () => {
      const row = {
        id: 'shipment-2',
        sales_order: 'SO-002',
        order_date: '2024-01-01',
        entry_timestamp: '2024-01-01T10:00:00Z',
        region_id: 'region-1',
        driver_id: 1,
        status: 'pending',
        total_diesel: null,
        total_wage: null,
        zaitri_fee: null,
        admin_expenses: null,
        due_amount: null,
        damaged_value: null,
        shortage_value: null,
        road_expenses: null,
        due_amount_after_discount: null,
        other_amounts: null,
        improvement_bonds: null,
        evening_allowance: null,
        transfer_fee: null,
        total_due_amount: null,
        tax_rate: null,
        total_tax: null,
        transfer_number: null,
        transfer_date: null,
        modified_by: null,
        modified_at: null,
        deductions_edited_by: null,
        deductions_edited_at: null,
        has_missing_prices: true,
        created_by: null,
        created_at: null,
      }

      const result = shipmentFromRow(row as any, [])

      expect(result.totalDiesel).toBeUndefined()
      expect(result.totalWage).toBeUndefined()
      expect(result.zaitriFee).toBeUndefined()
      expect(result.adminExpenses).toBeUndefined()
      expect(result.dueAmount).toBeUndefined()
      expect(result.damagedValue).toBeUndefined()
      expect(result.shortageValue).toBeUndefined()
      expect(result.roadExpenses).toBeUndefined()
      expect(result.dueAmountAfterDiscount).toBeUndefined()
      expect(result.otherAmounts).toBeUndefined()
      expect(result.improvementBonds).toBeUndefined()
      expect(result.eveningAllowance).toBeUndefined()
      expect(result.transferFee).toBeUndefined()
      expect(result.totalDueAmount).toBeUndefined()
      expect(result.taxRate).toBeUndefined()
      expect(result.totalTax).toBeUndefined()
      expect(result.transferNumber).toBeUndefined()
      expect(result.transferDate).toBeUndefined()
      expect(result.modifiedBy).toBeUndefined()
      expect(result.modifiedAt).toBeUndefined()
      expect(result.deductionsEditedBy).toBeUndefined()
      expect(result.deductionsEditedAt).toBeUndefined()
      expect(result.createdBy).toBeUndefined()
      expect(result.createdAt).toBeUndefined()
      expect(result.hasMissingPrices).toBe(true)
    })
  })

  describe('notificationFromRow', () => {
    it('should map notification row to notification object', () => {
      const row = {
        id: 'notif-1',
        message: 'Test notification',
        timestamp: '2024-01-01T10:00:00Z',
        read: false,
        category: 'INFO',
        target_roles: ['ADMIN'],
        target_user_ids: ['user-1'],
      }

      const result = notificationFromRow(row as any)

      expect(result.id).toBe('notif-1')
      expect(result.message).toBe('Test notification')
      expect(result.timestamp).toBe('2024-01-01T10:00:00Z')
      expect(result.read).toBe(false)
      expect(result.category).toBe('INFO' as const)
      expect(result.targetRoles).toEqual(['ADMIN' as const])
      expect(result.targetUserIds).toEqual(['user-1'])
    })

    it('should handle null values with defaults', () => {
      const row = {
        id: 'notif-2',
        message: 'Test 2',
        timestamp: '2024-01-02T10:00:00Z',
        read: null,
        category: 'WARNING',
        target_roles: null,
        target_user_ids: null,
      }

      const result = notificationFromRow(row as any)

      expect(result.read).toBe(false)
      expect(result.targetRoles).toBeUndefined()
      expect(result.targetUserIds).toBeUndefined()
    })
  })

  describe('companySettingFromRow', () => {
    it('should map company setting row to company setting object', () => {
      const row = {
        id: 'setting-1',
        setting_key: 'theme',
        setting_value: 'dark',
        created_at: '2024-01-01',
        updated_at: '2024-01-02',
      }

      const result = companySettingFromRow(row as any)

      expect(result.id).toBe('setting-1')
      expect(result.settingKey).toBe('theme')
      expect(result.settingValue).toBe('dark')
      expect(result.createdAt).toBe('2024-01-01')
      expect(result.updatedAt).toBe('2024-01-02')
    })
  })

  describe('mapCompanies', () => {
    it('should map array of company rows', () => {
      const rows = [
        {
          id: 'company-1',
          name: 'Company 1',
          slug: 'slug-1',
          logo_url: null,
          brand_color: null,
          settings: null,
          is_active: true,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
        {
          id: 'company-2',
          name: 'Company 2',
          slug: 'slug-2',
          logo_url: 'logo.png',
          brand_color: '#FF0000',
          settings: { test: true },
          is_active: false,
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ]

      const result = mapCompanies(rows as any)

      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('Company 1')
      expect(result[0].brandColor).toBe('#3B82F6')
      expect(result[1].brandColor).toBe('#FF0000')
      expect(result[1].isActive).toBe(false)
    })

    it('should handle empty array', () => {
      const result = mapCompanies([])

      expect(result).toHaveLength(0)
      expect(result).toEqual([])
    })
  })

  describe('mapUsers', () => {
    it('should map array of user rows', () => {
      const rows = [
        {
          id: 'user-1',
          username: 'user1',
          role: 'ADMIN',
          is_active: true,
          created_at: '2024-01-01',
        },
        {
          id: 'user-2',
          username: 'user2',
          role: 'SALES',
          is_active: false,
          created_at: '2024-01-01',
        },
      ]

      const result = mapUsers(rows as any)

      expect(result).toHaveLength(2)
      expect(result[0].username).toBe('user1')
      expect(result[1].username).toBe('user2')
      expect(result[0].isActive).toBe(true)
      expect(result[1].isActive).toBe(true)
    })

    it('should handle empty array', () => {
      const result = mapUsers([])

      expect(result).toHaveLength(0)
      expect(result).toEqual([])
    })
  })

  describe('mapProducts', () => {
    it('should map array of product rows', () => {
      const rows = [
        {
          id: 'product-1',
          name: 'Product 1',
          is_active: true,
        },
        {
          id: 'product-2',
          name: 'Product 2',
          is_active: false,
        },
      ]

      const result = mapProducts(rows as any)

      expect(result).toHaveLength(2)
      expect(result[0].isActive).toBe(true)
      expect(result[1].isActive).toBe(true)
    })
  })

  describe('mapDrivers', () => {
    it('should map array of driver rows', () => {
      const rows = [
        {
          id: 1,
          name: 'Driver 1',
          plate_number: 'ABC-123',
          is_active: true,
        },
        {
          id: 2,
          name: 'Driver 2',
          plate_number: 'DEF-456',
          is_active: false,
        },
      ]

      const result = mapDrivers(rows as any)

      expect(result).toHaveLength(2)
      expect(result[0].isActive).toBe(true)
      expect(result[1].isActive).toBe(false)
    })
  })

  describe('mapRegions', () => {
    it('should map array of region rows', () => {
      const rows = [
        {
          id: 'region-1',
          name: 'Region 1',
          diesel_liter_price: '1.5',
          diesel_liters: '50',
          zaitri_fee: '10',
          road_expenses: '5',
        },
        {
          id: 'region-2',
          name: 'Region 2',
          diesel_liter_price: null,
          diesel_liters: null,
          zaitri_fee: null,
          road_expenses: null,
        }

      ]

      const result = mapRegions(rows as any)

      expect(result).toHaveLength(2)
      expect(result[0].dieselLiterPrice).toBe(1.5)
      expect(result[1].dieselLiterPrice).toBe(0)
      expect(result[1].roadExpenses).toBe(0)
    })
  })

  describe('mapProductPrices', () => {
    it('should map array of product price rows', () => {
      const rows = [
        {
          id: 'price-1',
          region_id: 'region-1',
          product_id: 'product-1',
          price: '100.50',
        },
        {
          id: 'price-2',
          region_id: 'region-2',
          product_id: 'product-2',
          price: '200.00',
        },

      ]

      const result = mapProductPrices(rows as any)

      expect(result).toHaveLength(2)
      expect(result[0].price).toBe(100.50)
      expect(result[1].price).toBe(200.00)
    })
  })

  describe('mapNotifications', () => {
    it('should map array of notification rows', () => {
      const rows = [
        {
          id: 'notif-1',
          message: 'Notification 1',
          timestamp: '2024-01-01T10:00:00Z',
          read: false,
          category: 'INFO',
          target_roles: ['ADMIN'],
          target_user_ids: ['user-1'],
        },
        {
          id: 'notif-2',
          message: 'Notification 2',
          timestamp: '2024-01-02T10:00:00Z',
          read: null,
          category: 'WARNING',
          target_roles: null,
          target_user_ids: null,
        },
      ]

      const result = mapNotifications(rows as any)

      expect(result).toHaveLength(2)
      expect(result[0].read).toBe(false)
      expect(result[1].read).toBe(false)
      expect(result[1].targetRoles).toBeUndefined()
      expect(result[1].targetUserIds).toBeUndefined()
    })
  })

  describe('mapCompanySettings', () => {
    it('should map array of company setting rows', () => {
      const rows = [
        {
          id: 'setting-1',
          setting_key: 'theme',
          setting_value: 'dark',
          created_at: '2024-01-01',
          updated_at: '2024-01-02',
        },
        {
          id: 'setting-2',
          setting_key: 'language',
          setting_value: 'ar',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },

      ]

      const result = mapCompanySettings(rows as any)

      expect(result).toHaveLength(2)
      expect(result[0].settingKey).toBe('theme')
      expect(result[1].settingKey).toBe('language')
      expect(result[1].updatedAt).toBe('2024-01-01')
    })
  })
})
