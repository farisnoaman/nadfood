/**
 * CSRF Protection Utilities
 * Implements double-submit cookie pattern for CSRF protection
 */

import logger from './logger';

// CSRF token storage key
const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

interface CSRFToken {
  token: string;
  expiresAt: number;
}

/**
 * Generate a cryptographically secure random token
 */
function generateCSRFToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Get or create CSRF token
 */
export function getCSRFToken(): string {
  try {
    const stored = localStorage.getItem(CSRF_TOKEN_KEY);
    if (stored) {
      const parsed: CSRFToken = JSON.parse(stored);
      if (parsed.expiresAt > Date.now()) {
        return parsed.token;
      }
    }

    // Generate new token
    const token = generateCSRFToken();
    const tokenData: CSRFToken = {
      token,
      expiresAt: Date.now() + CSRF_TOKEN_EXPIRY
    };

    localStorage.setItem(CSRF_TOKEN_KEY, JSON.stringify(tokenData));
    return token;
  } catch (error) {
    logger.error('Error managing CSRF token:', error);
    // Fallback: generate token without storage
    return generateCSRFToken();
  }
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  try {
    const stored = localStorage.getItem(CSRF_TOKEN_KEY);
    if (!stored) return false;

    const parsed: CSRFToken = JSON.parse(stored);
    return parsed.token === token && parsed.expiresAt > Date.now();
  } catch (error) {
    logger.error('Error validating CSRF token:', error);
    return false;
  }
}

/**
 * Clear CSRF token (on logout)
 */
export function clearCSRFToken(): void {
  try {
    localStorage.removeItem(CSRF_TOKEN_KEY);
  } catch (error) {
    logger.error('Error clearing CSRF token:', error);
  }
}

/**
 * Get CSRF token for form submission
 */
export function getCSRFTokenForForm(): string {
  return getCSRFToken();
}