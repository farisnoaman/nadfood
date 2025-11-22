/**
 * Input Validation Utilities
 * Fix for M-03: Add input length validation
 */

import { VALIDATION, MESSAGES } from './constants';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate sales order input
 */
export const validateSalesOrder = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: MESSAGES.ERROR.REQUIRED_FIELD,
    };
  }
  
  if (trimmed.length < VALIDATION.MIN_SALES_ORDER_LENGTH) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.MIN_LENGTH('رقم أمر المبيعات', VALIDATION.MIN_SALES_ORDER_LENGTH),
    };
  }
  
  if (trimmed.length > VALIDATION.MAX_SALES_ORDER_LENGTH) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.MAX_LENGTH('رقم أمر المبيعات', VALIDATION.MAX_SALES_ORDER_LENGTH),
    };
  }
  
  return { isValid: true };
};

/**
 * Validate username input
 */
export const validateUsername = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: MESSAGES.ERROR.REQUIRED_FIELD,
    };
  }
  
  if (trimmed.length > VALIDATION.MAX_USERNAME_LENGTH) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.MAX_LENGTH('اسم المستخدم', VALIDATION.MAX_USERNAME_LENGTH),
    };
  }
  
  // Check for invalid characters
  if (!/^[\w\u0600-\u06FF\s\-_.]+$/.test(trimmed)) {
    return {
      isValid: false,
      error: 'اسم المستخدم يحتوي على أحرف غير صالحة',
    };
  }
  
  return { isValid: true };
};

/**
 * Validate email input
 */
export const validateEmail = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: MESSAGES.ERROR.REQUIRED_FIELD,
    };
  }
  
  if (trimmed.length > VALIDATION.MAX_EMAIL_LENGTH) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.MAX_LENGTH('البريد الإلكتروني', VALIDATION.MAX_EMAIL_LENGTH),
    };
  }
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return {
      isValid: false,
      error: MESSAGES.ERROR.INVALID_EMAIL,
    };
  }
  
  return { isValid: true };
};

/**
 * Validate password input
 */
export const validatePassword = (value: string): ValidationResult => {
  if (!value) {
    return {
      isValid: false,
      error: MESSAGES.ERROR.REQUIRED_FIELD,
    };
  }
  
  if (value.length < 6) {
    return {
      isValid: false,
      error: MESSAGES.ERROR.PASSWORD_TOO_SHORT,
    };
  }
  
  return { isValid: true };
};

/**
 * Validate product name input
 */
export const validateProductName = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: MESSAGES.ERROR.REQUIRED_FIELD,
    };
  }
  
  if (trimmed.length > VALIDATION.MAX_PRODUCT_NAME_LENGTH) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.MAX_LENGTH('اسم المنتج', VALIDATION.MAX_PRODUCT_NAME_LENGTH),
    };
  }
  
  return { isValid: true };
};

/**
 * Validate driver name input
 */
export const validateDriverName = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: MESSAGES.ERROR.REQUIRED_FIELD,
    };
  }
  
  if (trimmed.length > VALIDATION.MAX_DRIVER_NAME_LENGTH) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.MAX_LENGTH('اسم السائق', VALIDATION.MAX_DRIVER_NAME_LENGTH),
    };
  }
  
  return { isValid: true };
};

/**
 * Validate plate number input
 */
export const validatePlateNumber = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: MESSAGES.ERROR.REQUIRED_FIELD,
    };
  }
  
  if (trimmed.length > VALIDATION.MAX_PLATE_NUMBER_LENGTH) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.MAX_LENGTH('رقم اللوحة', VALIDATION.MAX_PLATE_NUMBER_LENGTH),
    };
  }
  
  return { isValid: true };
};

/**
 * Validate region name input
 */
export const validateRegionName = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return {
      isValid: false,
      error: MESSAGES.ERROR.REQUIRED_FIELD,
    };
  }
  
  if (trimmed.length > VALIDATION.MAX_REGION_NAME_LENGTH) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.MAX_LENGTH('اسم المنطقة', VALIDATION.MAX_REGION_NAME_LENGTH),
    };
  }
  
  return { isValid: true };
};

/**
 * Validate transfer number
 */
export const validateTransferNumber = (value: string): ValidationResult => {
  const trimmed = value.trim();
  
  if (!trimmed) {
    return { isValid: true }; // Transfer number is optional
  }
  
  if (trimmed.length < 8) {
    return {
      isValid: false,
      error: MESSAGES.ERROR.INVALID_TRANSFER_NUMBER,
    };
  }
  
  return { isValid: true };
};

/**
 * Validate numeric input
 */
export const validateNumericInput = (value: string | number, min?: number, max?: number): ValidationResult => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return {
      isValid: false,
      error: 'يجب إدخال رقم صحيح',
    };
  }
  
  if (min !== undefined && num < min) {
    return {
      isValid: false,
      error: `القيمة يجب أن تكون ${min} أو أكثر`,
    };
  }
  
  if (max !== undefined && num > max) {
    return {
      isValid: false,
      error: `القيمة يجب أن تكون ${max} أو أقل`,
    };
  }
  
  return { isValid: true };
};

/**
 * Validate required field
 */
export const validateRequired = (value: any, fieldName: string): ValidationResult => {
  if (value === null || value === undefined || value === '' || (typeof value === 'string' && !value.trim())) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.REQUIRED(fieldName),
    };
  }
  
  return { isValid: true };
};

/**
 * Validate max length
 */
export const validateMaxLength = (value: string, maxLength: number, fieldName: string): ValidationResult => {
  if (value && value.length > maxLength) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.MAX_LENGTH(fieldName, maxLength),
    };
  }
  
  return { isValid: true };
};

/**
 * Validate min length
 */
export const validateMinLength = (value: string, minLength: number, fieldName: string): ValidationResult => {
  if (value && value.length < minLength) {
    return {
      isValid: false,
      error: MESSAGES.VALIDATION.MIN_LENGTH(fieldName, minLength),
    };
  }
  
  return { isValid: true };
};
