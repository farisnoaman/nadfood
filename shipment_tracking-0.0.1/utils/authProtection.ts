/**
 * Authentication Protection Utilities
 * Implements brute force protection and rate limiting for login attempts
 */

import logger from './logger';

// Rate limiting configuration
const RATE_LIMIT_CONFIG = {
  MAX_ATTEMPTS: 5,
  WINDOW_MINUTES: 15,
  PROGRESSIVE_DELAYS: [1000, 5000, 30000, 300000], // 1s, 5s, 30s, 5min
};

// Storage keys
const LOGIN_ATTEMPTS_KEY = 'login_attempts';
const LOGIN_BLOCK_KEY = 'login_blocked_until';

interface LoginAttempt {
  email: string;
  timestamp: number;
  success: boolean;
}

interface RateLimitStatus {
  allowed: boolean;
  remainingAttempts: number;
  blockedUntil?: number;
  delayMs?: number;
}

/**
 * Get stored login attempts
 */
function getLoginAttempts(): LoginAttempt[] {
  try {
    const stored = localStorage.getItem(LOGIN_ATTEMPTS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('Error reading login attempts:', error);
    return [];
  }
}

/**
 * Store login attempt
 */
function storeLoginAttempt(email: string, success: boolean): void {
  try {
    const attempts = getLoginAttempts();
    const newAttempt: LoginAttempt = {
      email: email.toLowerCase(),
      timestamp: Date.now(),
      success,
    };

    attempts.push(newAttempt);

    // Keep only recent attempts (last 24 hours)
    const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const recentAttempts = attempts.filter(attempt => attempt.timestamp > oneDayAgo);

    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(recentAttempts));
  } catch (error) {
    logger.error('Error storing login attempt:', error);
  }
}

/**
 * Check if user is currently blocked
 */
function getBlockStatus(): { blocked: boolean; blockedUntil?: number } {
  try {
    const blockedUntil = localStorage.getItem(LOGIN_BLOCK_KEY);
    if (!blockedUntil) return { blocked: false };

    const blockTime = parseInt(blockedUntil);
    if (Date.now() < blockTime) {
      return { blocked: true, blockedUntil: blockTime };
    }

    // Block expired, remove it
    localStorage.removeItem(LOGIN_BLOCK_KEY);
    return { blocked: false };
  } catch (error) {
    logger.error('Error checking block status:', error);
    return { blocked: false };
  }
}

/**
 * Set login block
 */
function setLoginBlock(durationMs: number): void {
  try {
    const blockedUntil = Date.now() + durationMs;
    localStorage.setItem(LOGIN_BLOCK_KEY, blockedUntil.toString());
  } catch (error) {
    logger.error('Error setting login block:', error);
  }
}

/**
 * Clean up old login attempts
 */
function cleanupOldAttempts(): void {
  try {
    const attempts = getLoginAttempts();
    const windowStart = Date.now() - (RATE_LIMIT_CONFIG.WINDOW_MINUTES * 60 * 1000);
    const recentAttempts = attempts.filter(attempt => attempt.timestamp > windowStart);
    localStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(recentAttempts));
  } catch (error) {
    logger.error('Error cleaning up old attempts:', error);
  }
}

/**
 * Check rate limit for login attempts
 */
export function checkLoginRateLimit(email: string): RateLimitStatus {
  // Check if currently blocked
  const blockStatus = getBlockStatus();
  if (blockStatus.blocked) {
    return {
      allowed: false,
      remainingAttempts: 0,
      blockedUntil: blockStatus.blockedUntil,
    };
  }

  // Clean up old attempts
  cleanupOldAttempts();

  // Get recent attempts for this email
  const attempts = getLoginAttempts();
  const windowStart = Date.now() - (RATE_LIMIT_CONFIG.WINDOW_MINUTES * 60 * 1000);
  const recentAttempts = attempts.filter(
    attempt => attempt.email === email.toLowerCase() && attempt.timestamp > windowStart
  );

  const failedAttempts = recentAttempts.filter(attempt => !attempt.success);
  const remainingAttempts = Math.max(0, RATE_LIMIT_CONFIG.MAX_ATTEMPTS - failedAttempts.length);

  // Check if limit exceeded
  if (failedAttempts.length >= RATE_LIMIT_CONFIG.MAX_ATTEMPTS) {
    // Calculate progressive delay based on attempt count
    const delayIndex = Math.min(failedAttempts.length - RATE_LIMIT_CONFIG.MAX_ATTEMPTS,
                               RATE_LIMIT_CONFIG.PROGRESSIVE_DELAYS.length - 1);
    const delayMs = RATE_LIMIT_CONFIG.PROGRESSIVE_DELAYS[delayIndex] || 300000;

    // Set block
    setLoginBlock(delayMs);

    return {
      allowed: false,
      remainingAttempts: 0,
      delayMs,
    };
  }

  return {
    allowed: true,
    remainingAttempts,
  };
}

/**
 * Record login attempt
 */
export function recordLoginAttempt(email: string, success: boolean): void {
  storeLoginAttempt(email, success);

  if (!success) {
    // Clear any existing block on successful login
    localStorage.removeItem(LOGIN_BLOCK_KEY);
  }
}

/**
 * Get user-friendly block message
 */
export function getBlockMessage(blockedUntil?: number, delayMs?: number): string {
  if (blockedUntil) {
    const remainingMs = blockedUntil - Date.now();
    const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
    return `تم حظر تسجيل الدخول مؤقتاً. يرجى المحاولة مرة أخرى خلال ${remainingMinutes} دقيقة.`;
  }

  if (delayMs) {
    const delaySeconds = Math.ceil(delayMs / 1000);
    if (delaySeconds < 60) {
      return `يرجى الانتظار ${delaySeconds} ثانية قبل المحاولة مرة أخرى.`;
    }
    const delayMinutes = Math.ceil(delaySeconds / 60);
    return `يرجى الانتظار ${delayMinutes} دقيقة قبل المحاولة مرة أخرى.`;
  }

  return 'تم تجاوز عدد المحاولات المسموح بها. يرجى المحاولة لاحقاً.';
}

/**
 * Clear all login protection data (for testing/admin purposes)
 */
export function clearLoginProtection(): void {
  try {
    localStorage.removeItem(LOGIN_ATTEMPTS_KEY);
    localStorage.removeItem(LOGIN_BLOCK_KEY);
    logger.info('Login protection data cleared');
  } catch (error) {
    logger.error('Error clearing login protection:', error);
  }
}