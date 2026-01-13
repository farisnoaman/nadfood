/**
 * Centralized Constants and Configuration
 * Fix for M-08: Centralize hardcoded text strings
 */

// === TIMEOUTS AND DELAYS ===
export const TIMEOUTS = {
  PDF_RENDER: 500, // ms - time to wait for DOM rendering before PDF generation
  PDF_GENERATION_TIMEOUT: 5000, // ms - max time for PDF generation
  CONNECTION_TIMEOUT: 30000, // ms - API request timeout
  NOTIFICATION_AUTO_HIDE: 4000, // ms - auto hide notification messages
  RECALCULATE_DELAY: 100, // ms - delay for price recalculation
} as const;

// === PDF CONSTANTS ===
export const PDF = {
  A4_WIDTH_MM: 210,
  A4_HEIGHT_MM: 297,
  MARGIN_MM: 10,
} as const;

// === UI CONSTANTS ===
export const UI = {
  NOTIFICATION_MAX_HEIGHT_VH: 80, // vh units - max height for notification panel
  SIDEBAR_WIDTH_PX: 256, // px - sidebar width
  MIN_PASSWORD_LENGTH: 6, // characters - minimum password length
  MIN_TRANSFER_NUMBER_LENGTH: 8, // digits - minimum transfer number length
} as const;

// === STORAGE CONSTANTS ===
export const STORAGE = {
  MAX_CACHE_SIZE_MB: 5, // MB - maximum localStorage cache size before warning
  SYNC_LOCK_TIMEOUT_MS: 30000, // ms - cross-tab sync lock timeout
} as const;

// === INPUT VALIDATION ===
export const VALIDATION = {
  MIN_SALES_ORDER_LENGTH: 1,
  MAX_SALES_ORDER_LENGTH: 50,
  MAX_USERNAME_LENGTH: 50,
  MAX_EMAIL_LENGTH: 100,
  MAX_PRODUCT_NAME_LENGTH: 100,
  MAX_DRIVER_NAME_LENGTH: 100,
  MAX_REGION_NAME_LENGTH: 100,
  MAX_PLATE_NUMBER_LENGTH: 20,
} as const;

// === ARABIC TEXT STRINGS ===
export const MESSAGES = {
  // Success Messages
  SUCCESS: {
    PASSWORD_CHANGED: 'تم تغيير كلمة المرور بنجاح',
    USER_ADDED: 'تم إضافة المستخدم بنجاح',
    USER_UPDATED: 'تم تحديث المستخدم بنجاح',
    PRODUCT_ADDED: 'تم إضافة المنتج بنجاح',
    PRODUCT_UPDATED: 'تم تحديث المنتج بنجاح',
    DRIVER_ADDED: 'تم إضافة السائق بنجاح',
    DRIVER_UPDATED: 'تم تحديث السائق بنجاح',
    DRIVER_DELETED: 'تم حذف السائق بنجاح',
    REGION_ADDED: 'تم إضافة المنطقة بنجاح',
    REGION_UPDATED: 'تم تحديث المنطقة بنجاح',
    REGION_DELETED: 'تم حذف المنطقة بنجاح',
    SHIPMENT_CREATED: 'تم إنشاء الشحنة بنجاح',
    SHIPMENT_UPDATED: 'تم تحديث الشحنة بنجاح',
    PRICES_RECALCULATED: 'تم تحديث الأسعار والحسابات بنجاح!',
    NOTIFICATIONS_MARKED_READ: 'تم تحديد جميع الإشعارات كمقروءة',
    DATA_EXPORTED: 'تم تصدير البيانات بنجاح',
  },

  // Error Messages
  ERROR: {
    GENERIC: 'حدث خطأ غير متوقع',
    NETWORK: 'خطأ في الاتصال بالشبكة',
    TIMEOUT: 'انتهت مهلة الاتصال. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.',
    PDF_GENERATION: 'فشل إنشاء PDF',
    PDF_TIMEOUT: 'انتهت مهلة إنشاء PDF. يرجى المحاولة مرة أخرى.',
    MISSING_PRICES: 'فشل التحديث. ما زالت هناك أسعار مفقودة.',
    INVALID_CREDENTIALS: 'بيانات الدخول غير صحيحة',
    UNAUTHORIZED: 'غير مصرح بهذا الإجراء',
    DUPLICATE_SALES_ORDER: 'رقم أمر المبيعات موجود بالفعل!',
    INVALID_TRANSFER_NUMBER: 'رقم الحوالة يجب أن يكون 8 أرقام على الأقل',
    REQUIRED_FIELD: 'هذا الحقل مطلوب',
    INVALID_EMAIL: 'البريد الإلكتروني غير صالح',
    PASSWORD_TOO_SHORT: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل',
    INPUT_TOO_LONG: 'القيمة المدخلة طويلة جداً',
    MINIMUM_ONE_PRODUCT: 'يجب أن يحتوي الطلب على منتج واحد على الأقل',
    STORAGE_QUOTA_EXCEEDED: 'تم تجاوز حد التخزين المحلي',
  },

  // Confirmation Messages
  CONFIRM: {
    DELETE_DRIVER: 'هل أنت متأكد من حذف هذا السائق؟ لا يمكن التراجع عن هذا الإجراء.',
    DELETE_REGION: 'هل أنت متأكد من حذف هذه المنطقة؟ لا يمكن التراجع عن هذا الإجراء.',
    DELETE_PRODUCT_PRICE: 'هل أنت متأكد من حذف هذا السعر؟ لا يمكن التراجع عن هذا الإجراء.',
    FINALIZE_SHIPMENT: 'هل أنت متأكد من إنهاء هذه الشحنة؟ لا يمكن التراجع عن هذا الإجراء.',
    LOGOUT: 'هل أنت متأكد من تسجيل الخروج؟',
    RELOAD_FOR_UPDATE: 'تحديث جديد متاح. هل تريد إعادة التحميل؟',
  },

  // Loading Messages
  LOADING: {
    PLEASE_WAIT: 'جاري التحميل...',
    FETCHING_DATA: 'جاري جلب البيانات...',
    SAVING: 'جاري الحفظ...',
    DELETING: 'جاري الحذف...',
    UPDATING: 'جاري التحديث...',
    GENERATING_PDF: 'جاري إنشاء PDF...',
    RECALCULATING: 'جاري إعادة الحساب...',
    EXPORTING: 'جاري التصدير...',
  },

  // Validation Messages
  VALIDATION: {
    MIN_LENGTH: (field: string, min: number) => `${field} يجب أن يكون ${min} أحرف على الأقل`,
    MAX_LENGTH: (field: string, max: number) => `${field} يجب ألا يتجاوز ${max} حرف`,
    REQUIRED: (field: string) => `${field} مطلوب`,
    INVALID_FORMAT: (field: string) => `صيغة ${field} غير صحيحة`,
  },
} as const;

// === ROLES ===
export const ROLES = {
  SALES: 'مسؤول الحركة' as const,
  ACCOUNTANT: 'محاسب' as const,
  ADMIN: 'ادمن' as const,
} as const;

// === SHIPMENT STATUSES ===
export const SHIPMENT_STATUS = {
  FROM_SALES: 'من مسؤول الحركة' as const,
  DRAFT: 'مسودة' as const,
  FROM_ACCOUNTANT: 'من المحاسب' as const,
  FINALIZED: 'منتهي' as const,
} as const;

// === NOTIFICATION CATEGORIES ===
export const NOTIFICATION_CATEGORIES = {
  SHIPMENT_UPDATE: 'shipment_update' as const,
  PRICE_CHANGE: 'price_change' as const,
  USER_ACTION: 'user_action' as const,
  SYSTEM: 'system' as const,
} as const;

// === CACHE KEYS ===
export const CACHE_KEYS = {
  USERS: 'users',
  PRODUCTS: 'products',
  DRIVERS: 'drivers',
  REGIONS: 'regions',
  SHIPMENTS: 'shipments',
  PRODUCT_PRICES: 'productPrices',
  NOTIFICATIONS: 'notifications',
  SYNC_LOCK: 'sync_lock',
} as const;

// === EXPORT FORMATS ===
export const EXPORT_FORMATS = {
  CSV: 'csv',
  EXCEL: 'xlsx',
  PDF: 'pdf',
} as const;

// === INDEXEDDB STORES ===
export const STORES = {
  USERS: 'users',
  PRODUCTS: 'products',
  DRIVERS: 'drivers',
  REGIONS: 'regions',
  SHIPMENTS: 'shipments',
  PRODUCT_PRICES: 'productPrices',
  NOTIFICATIONS: 'notifications',
  INSTALLMENTS: 'installments',
  INSTALLMENT_PAYMENTS: 'installmentPayments',
  MUTATION_QUEUE: 'mutationQueue',
  SETTINGS: 'settings',
  METADATA: 'metadata',
  REGION_CONFIGS: 'regionConfigs'
} as const;
