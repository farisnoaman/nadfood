import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateInitialShipmentValues,
  calculateAccountantValues,
  calculateAdminValues,
} from '../utils/calculations'
import type { Region, ProductPrice, Shipment, ShipmentProduct } from '../types'

describe('calculations', () => {
  let mockRegions: Region[]
  let mockProductPrices: ProductPrice[]

  beforeEach(() => {
    mockRegions = [
      {
        id: 'region-1',
        name: 'Region 1',
        dieselLiterPrice: 1.5,
        dieselLiters: 50,
        zaitriFee: 10,
        roadExpenses: 5,
      },
      {
        id: 'region-2',
        name: 'Region 2',
        dieselLiterPrice: 1.6,
        dieselLiters: 55,
        zaitriFee: 12,
        roadExpenses: 6,
      },
    ]

    mockProductPrices = [
      {
        id: '1',
        regionId: 'region-1',
        productId: 'product-1',
        price: 100,
        effectiveFrom: '2024-01-01',
      },
      {
        id: '2',
        regionId: 'region-1',
        productId: 'product-2',
        price: 80,
        effectiveFrom: '2024-01-01',
      },
    ]
  })

  describe('calculateInitialShipmentValues', () => {
    it('should calculate initial values correctly', () => {
      const shipment = {
        salesOrder: 'SO001',
        orderDate: '2024-03-01',
        regionId: 'region-1',
        driverId: 1,
        products: [
          {
            productId: 'product-1',
            productName: 'Product 1',
            cartonCount: 10,
          },
          {
            productId: 'product-2',
            productName: 'Product 2',
            cartonCount: 5,
          },
        ],
      }

      const result = calculateInitialShipmentValues(
        shipment as any,
        mockRegions,
        mockProductPrices
      )

      expect(result?.totalWage).toBe(1400) // (10 * 100) + (5 * 80) = 1000 + 400 = 1400
      expect(result?.totalDiesel).toBe(75) // 50 * 1.5
      expect(result?.zaitriFee).toBe(10)
      expect(result?.adminExpenses).toBe(10) // zaitriFee
      expect(result?.dueAmount).toBe(1400 - 75 - 10 - 10 - 5) // 1300
      expect(result?.hasMissingPrices).toBe(false)
    })

    it('should return empty object when region not found', () => {
      const shipment = {
        salesOrder: 'SO001',
        orderDate: '2024-03-01',
        regionId: 'non-existent',
        driverId: 1,
        products: [],
      }

      const result = calculateInitialShipmentValues(
        shipment as any,
        mockRegions,
        mockProductPrices
      )

      expect(result).toEqual({})
    })

    it('should set hasMissingPrices when product price is missing', () => {
      const shipment = {
        salesOrder: 'SO001',
        orderDate: '2024-03-01',
        regionId: 'region-1',
        driverId: 1,
        products: [
          {
            productId: 'non-existent-product',
            productName: 'Missing Product',
            cartonCount: 1,
          },
        ],
      }

      const result = calculateInitialShipmentValues(
        shipment as any,
        mockRegions,
        mockProductPrices
      )

      expect(result?.hasMissingPrices).toBe(true)
      expect(result?.products?.[0].productWagePrice).toBe(0)
    })
  })

  describe('calculateAccountantValues', () => {
    it('should calculate accountant values correctly', () => {
      const shipment: Partial<Shipment> = {
        dueAmount: 1000,
        damagedValue: 100,
        shortageValue: 50,
        roadExpenses: 25,
      }

      const result = calculateAccountantValues(shipment as Shipment)

      expect(result.dueAmountAfterDiscount).toBe(825) // 1000 - 100 - 50 - 25
    })

    it('should handle null/undefined road expenses', () => {
      const shipment: Partial<Shipment> = {
        dueAmount: 1000,
        damagedValue: 100,
        shortageValue: 50,
        roadExpenses: undefined,
      }

      const result = calculateAccountantValues(shipment as Shipment)

      expect(result.dueAmountAfterDiscount).toBe(850) // 1000 - 100 - 50 - 0
    })
  })

  describe('calculateAdminValues', () => {
    it('should calculate admin values correctly', () => {
      const shipment: Partial<Shipment> = {
        dueAmount: 1000,
        otherAmounts: 50,
        improvementBonds: 200,
        eveningAllowance: 100,
        transferFee: 25,
        products: [
          {
            productId: 'product-1',
            productName: 'Product 1',
            cartonCount: 10,
            shortageValue: 75,
            damagedValue: 125,
          },
        ],
      }

      const result = calculateAdminValues(shipment as Shipment)

      // Formula: dueAmount + improvementBonds + eveningAllowance + transferFee - totalDamagedValue - totalShortageValue - otherAmounts
      // 1000 + 200 + 100 + 25 - 125 - 75 - 50 = 1075
      expect(result.totalDueAmount).toBe(1075)
    })

    it('should handle products without deduction values', () => {
      const shipment: Partial<Shipment> = {
        dueAmount: 1000,
        otherAmounts: 0,
        improvementBonds: 0,
        eveningAllowance: 0,
        transferFee: 0,
        products: [
          {
            productId: 'product-1',
            productName: 'Product 1',
            cartonCount: 10,
          },
        ],
      }

      const result = calculateAdminValues(shipment as Shipment)

      expect(result.totalDueAmount).toBe(1000)
    })
  })
})