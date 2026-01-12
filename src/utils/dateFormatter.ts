/**
 * Date Formatting Utilities
 * Fix for M-09: Implement consistent date formatting
 */

/**
 * Format date to YYYY-MM-DD (for input fields and database)
 */
export const formatDateForInput = (date: Date | string | null | undefined): string => {
  if (!date) return '';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  } catch {
    return '';
  }
};

/**
 * Format date to DD/MM/YYYY (for display in Arabic context)
 */
export const formatDateForDisplay = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch {
    return '-';
  }
};

/**
 * Format date and time to DD/MM/YYYY HH:MM (for timestamps)
 */
export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  } catch {
    return '-';
  }
};

/**
 * Format date to relative time (e.g., "منذ 5 دقائق")
 */
export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'الآن';
    if (diffMinutes < 60) return `منذ ${diffMinutes} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    
    return formatDateForDisplay(d);
  } catch {
    return '-';
  }
};

/**
 * Get current date in YYYY-MM-DD format
 */
export const getCurrentDate = (): string => {
  return formatDateForInput(new Date());
};

/**
 * Get current timestamp
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * Parse date string safely
 */
export const parseDate = (dateString: string | null | undefined): Date | null => {
  if (!dateString) return null;
  
  try {
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
};

/**
 * Check if date is valid
 */
export const isValidDate = (date: Date | string | null | undefined): boolean => {
  if (!date) return false;
  
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return !isNaN(d.getTime());
  } catch {
    return false;
  }
};

/**
 * Compare two dates (ignoring time)
 */
export const compareDates = (date1: Date | string, date2: Date | string): number => {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  
  return d1.getTime() - d2.getTime();
};

/**
 * Check if date is between two dates (inclusive)
 */
export const isDateBetween = (
  date: Date | string,
  startDate: Date | string | null,
  endDate: Date | string | null
): boolean => {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (!isValidDate(d)) return false;
    
    if (startDate) {
      const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
      start.setHours(0, 0, 0, 0);
      if (d < start) return false;
    }
    
    if (endDate) {
      const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
      end.setHours(23, 59, 59, 999);
      if (d > end) return false;
    }
    
    return true;
  } catch {
    return false;
  }
};
