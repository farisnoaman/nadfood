import { describe, it, expect } from 'vitest'
import {
  validateSalesOrder,
  validateUsername,
  validateEmail,
  validatePassword,
  validateProductName,
  validateDriverName,
  validatePlateNumber,
  validateRegionName,
  validateTransferNumber,
  validateNumericInput,
  validateRequired,
  validateMaxLength,
  validateMinLength,
  checkDuplicateSalesOrder,
} from './validation'

describe('Validation Utilities', () => {
  describe('validateSalesOrder', () => {
    it('should validate correct sales order', () => {
      const result = validateSalesOrder('SO-001')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty sales order', () => {
      const result = validateSalesOrder('')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should reject sales order with only whitespace', () => {
      const result = validateSalesOrder('   ')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('validateUsername', () => {
    it('should validate correct username', () => {
      const result = validateUsername('testuser123')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty username', () => {
      const result = validateUsername('')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should reject username with only whitespace', () => {
      const result = validateUsername('   ')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('validateEmail', () => {
    it('should validate correct email', () => {
      const result = validateEmail('test@example.com')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject invalid email format', () => {
      const result = validateEmail('invalid-email')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should reject empty email', () => {
      const result = validateEmail('')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('validatePassword', () => {
    it('should validate correct password', () => {
      const result = validatePassword('SecureP@ss123')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject short password', () => {
      const result = validatePassword('short')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('validateProductName', () => {
    it('should validate correct product name', () => {
      const result = validateProductName('Product 1')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty product name', () => {
      const result = validateProductName('')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('validateDriverName', () => {
    it('should validate correct driver name', () => {
      const result = validateDriverName('John Doe')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty driver name', () => {
      const result = validateDriverName('')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('validatePlateNumber', () => {
    it('should validate correct plate number', () => {
      const result = validatePlateNumber('ABC-123')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty plate number', () => {
      const result = validatePlateNumber('')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('validateRegionName', () => {
    it('should validate correct region name', () => {
      const result = validateRegionName('Region 1')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject empty region name', () => {
      const result = validateRegionName('')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('validateTransferNumber', () => {
    it('should validate correct transfer number', () => {
      const result = validateTransferNumber('TR-00123')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept empty transfer number (optional field)', () => {
      const result = validateTransferNumber('')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject transfer number below minimum length', () => {
      const result = validateTransferNumber('TR')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('validateNumericInput', () => {
    it('should validate positive number', () => {
      const result = validateNumericInput(100)

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject negative number when min is 0', () => {
      const result = validateNumericInput(-5, 0)

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should enforce minimum value', () => {
      const result = validateNumericInput(5, 10, 100)

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should enforce maximum value', () => {
      const result = validateNumericInput(150, 10, 100)

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should accept number within range', () => {
      const result = validateNumericInput(50, 10, 100)

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })

  describe('validateRequired', () => {
    it('should accept required value', () => {
      const result = validateRequired('test value', 'اسم الحقل')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject null/undefined value', () => {
      const result = validateRequired(null, 'اسم الحقل')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should reject empty string', () => {
      const result = validateRequired('', 'اسم الحقل')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('validateMaxLength', () => {
    it('should accept string within max length', () => {
      const result = validateMaxLength('abc', 10, 'اسم الحقل')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject string exceeding max length', () => {
      const result = validateMaxLength('abcdefghijklmnop', 10, 'اسم الحقل')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('validateMinLength', () => {
    it('should accept string meeting min length', () => {
      const result = validateMinLength('abcdef', 5, 'اسم الحقل')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject string below min length', () => {
      const result = validateMinLength('abc', 5, 'اسم الحقل')

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })
  })

  describe('checkDuplicateSalesOrder', () => {
    const mockShipments = [
      { id: '1', salesOrder: 'SO-001' },
      { id: '2', salesOrder: 'SO-002' },
      { id: '3', salesOrder: 'SO-003' },
    ]

    it('should accept unique sales order', () => {
      const result = checkDuplicateSalesOrder('SO-004', mockShipments)

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should accept empty sales order (optional field)', () => {
      const result = checkDuplicateSalesOrder('', mockShipments)

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject duplicate sales order', () => {
      const result = checkDuplicateSalesOrder('SO-001', mockShipments)

      expect(result.isValid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('should allow same sales order for same shipment (edit mode)', () => {
      const result = checkDuplicateSalesOrder('SO-001', mockShipments, '1')

      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })
  })
})
