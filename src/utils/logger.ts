/**
 * Secure Logger Utility
 * Only logs in development environment, never in production
 * Automatically sanitizes sensitive data
 */



// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /key/i,
  /secret/i,
  /auth/i,
  /session/i,
  /userId/i,
  /email/i,
  /phone/i,
  /credit/i,
  /card/i,
];

// Check if we're in development
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Sanitize object by removing or redacting sensitive data
 */
function sanitizeData(data: any): any {
  if (typeof data === 'string') {
    // Redact sensitive string patterns
    let sanitized = data;
    SENSITIVE_PATTERNS.forEach(pattern => {
      if (pattern.test(sanitized)) {
        sanitized = sanitized.replace(/./g, '*');
      }
    });
    return sanitized;
  }

  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }

  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      // Skip sensitive keys entirely
      if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
        sanitized[key] = '[REDACTED]';
      } else {
        sanitized[key] = sanitizeData(value);
      }
    }
    return sanitized;
  }

  return data;
}

/**
 * Secure logger that only outputs in development
 */
const logger = {
  info: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.info(`[INFO] ${message}`, ...args.map(sanitizeData));
    }
  },

  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(`[WARN] ${message}`, ...args.map(sanitizeData));
    }
  },

  error: (message: string, ...args: any[]) => {
    // Errors are always logged (but sanitized) for debugging
    console.error(`[ERROR] ${message}`, ...args.map(sanitizeData));
  },

  debug: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${message}`, ...args.map(sanitizeData));
    }
  }
};

export default logger;
export { logger };