/**
 * Input sanitization utilities to prevent XSS and injection attacks
 */

/**
 * Sanitize general text input
 * - Trims whitespace
 * - Removes HTML tags
 * - Allows alphanumeric, spaces, Arabic characters, and common punctuation
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[^\w\s\u0600-\u06FF\-_.@،؛؟]/g, ''); // Allow only safe characters including Arabic
};

/**
 * Sanitize numeric input
 * - Removes all non-numeric characters except decimal point
 */
export const sanitizeNumericInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/[^\d.]/g, '') // Keep only digits and decimal point
    .replace(/(\..*)\./g, '$1'); // Prevent multiple decimal points
};

/**
 * Sanitize username (more restrictive)
 * - Allows only alphanumeric, Arabic characters, underscores, and hyphens
 */
export const sanitizeUsername = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[^\w\u0600-\u06FF\-]/g, ''); // Only word characters, Arabic, and hyphens
};

/**
 * Sanitize email
 * - Validates basic email format
 */
export const sanitizeEmail = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@._\-]/g, ''); // Only valid email characters
};

/**
 * Sanitize filename for PDF generation
 * - Prevents directory traversal and invalid filename characters
 */
export const sanitizeFilename = (input: string): string => {
  if (!input) return '';
  
  return input
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '') // Remove invalid filename characters
    .replace(/\.\./g, '') // Prevent directory traversal
    .substring(0, 200); // Limit length
};
