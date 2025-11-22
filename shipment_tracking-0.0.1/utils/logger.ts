/**
 * Development Logger Utility
 * Fix for L-05: Remove console.log statements from production
 * 
 * Use devLog instead of console.log throughout the application
 * to ensure logs only appear in development mode
 */

/**
 * Log to console only in development mode
 */
export const devLog = (...args: any[]): void => {
  if ((import.meta as any).env.DEV) {
    console.log(...args);
  }
};

/**
 * Log warnings only in development mode
 */
export const devWarn = (...args: any[]): void => {
  if ((import.meta as any).env.DEV) {
    console.warn(...args);
  }
};

/**
 * Log errors (always logs in production for debugging)
 */
export const devError = (...args: any[]): void => {
  console.error(...args);
};

/**
 * Log debug information with timestamp
 */
export const devDebug = (context: string, ...args: any[]): void => {
  if ((import.meta as any).env.DEV) {
    const timestamp = new Date().toISOString();
    console.log(`[DEBUG ${timestamp}] [${context}]`, ...args);
  }
};

/**
 * Log performance metrics
 */
export const devPerf = (label: string, callback: () => void): void => {
  if ((import.meta as any).env.DEV) {
    console.time(label);
    callback();
    console.timeEnd(label);
  } else {
    callback();
  }
};

/**
 * Create a logger for a specific module
 */
export const createLogger = (moduleName: string) => {
  return {
    log: (...args: any[]) => devLog(`[${moduleName}]`, ...args),
    warn: (...args: any[]) => devWarn(`[${moduleName}]`, ...args),
    error: (...args: any[]) => devError(`[${moduleName}]`, ...args),
    debug: (...args: any[]) => devDebug(moduleName, ...args),
  };
};

/**
 * Log API requests/responses in development
 */
export const logAPICall = (method: string, endpoint: string, data?: any, response?: any): void => {
  if ((import.meta as any).env.DEV) {
    console.group(`🌐 API ${method} ${endpoint}`);
    if (data) console.log('Request:', data);
    if (response) console.log('Response:', response);
    console.groupEnd();
  }
};

/**
 * Log state changes in development
 */
export const logStateChange = (stateName: string, oldValue: any, newValue: any): void => {
  if ((import.meta as any).env.DEV) {
    console.group(`📊 State Change: ${stateName}`);
    console.log('Old:', oldValue);
    console.log('New:', newValue);
    console.groupEnd();
  }
};
