/**
 * Defines the roles available for users in the system.
 * These values match the database schema.
 */
export enum Role {
  SALES = 'مسؤول الحركة',
  ACCOUNTANT = 'محاسب',
  ADMIN = 'ادمن',
}

/**
 * Represents the various statuses a shipment can have as it moves through the workflow.
 */
export enum ShipmentStatus {
  FROM_SALES = 'من مسؤول الحركة', // Newly created by Sales, ready for Accountant
  DRAFT = 'مسودة', // Saved by Accountant, not yet sent to Admin
  SENT_TO_ADMIN = 'مرسلة للادمن', // Sent by Accountant, awaiting Admin review
  RETURNED_FOR_EDIT = 'طلب تعديل', // Returned by Admin to Accountant for changes
  RETURNED_TO_FLEET = 'مرتجعة لمسؤول الحركة', // Returned by Accountant to Fleet for corrections
  FINAL = 'نهائي', // Approved by Admin
  FINAL_MODIFIED = 'نهائي معدل', // A final shipment that was later modified by Admin
  INSTALLMENTS = 'تسديد دين', // Transferred to installments for debt collection
}

/**
 * Represents a user profile in the system. Links to Supabase Auth user.
 */
export interface User {
  id: string; // Corresponds to Supabase Auth user UUID
  username: string;
  email: string;
  role: Role;
  isActive?: boolean;
  createdAt?: string;
}

/**
 * Represents a product that can be included in a shipment.
 */
export interface Product {
  id: string; // UUID from Supabase
  name: string;
  isActive?: boolean;
  weightKg?: number;
}

/**
 * Represents a driver who can be assigned to a shipment.
 */
export interface Driver {
  id: number; // Serial ID from Supabase
  name: string;
  plateNumber: string;
  isActive?: boolean;
}

/**
 * Represents a geographical region, containing pricing factors.
 */
export interface Region {
  id: string; // UUID from Supabase
  name: string;
  dieselLiterPrice: number;
  dieselLiters: number;
  zaitriFee: number;
  roadExpenses: number; // Fixed road expenses for this region
}

/**
 * Defines the price of a specific product in a specific region.
 */
export interface ProductPrice {
  id: string; // UUID from Supabase
  regionId: string;
  productId: string;
  price: number; // Price per carton
}

/**
 * Represents a product included within a shipment, with its quantity.
 */
export interface ShipmentProduct {
  productId: string;
  productName: string;
  cartonCount: number;
  /** The total calculated wage for this product line (price * cartonCount). */
  productWagePrice?: number;
}

/**
 * The main data structure representing a single shipment.
 */
export interface Shipment {
  id: string; // UUID from Supabase
  salesOrder: string;
  orderDate: string;
  entryTimestamp: string;
  regionId: string;
  driverId: number; // Now a number (integer)
  products: ShipmentProduct[];

  // Calculated values
  totalDiesel?: number;
  totalWage?: number;
  zaitriFee?: number;
  adminExpenses?: number;
  dueAmount?: number;

  // Fields managed by the Accountant
  status: ShipmentStatus;
  damagedValue?: number;
  shortageValue?: number;
  roadExpenses?: number;
  dueAmountAfterDiscount?: number;

  // Fields managed by the Admin
  otherAmounts?: number; // Additional deductions
  improvementBonds?: number; // Addition
  eveningAllowance?: number; // Addition
  transferFee?: number; // Addition - Transfer fees
  totalDueAmount?: number; // The final calculated amount
  taxRate?: number; // Tax percentage
  totalTax?: number; // Calculated tax amount
  transferNumber?: string;
  transferDate?: string;
  modifiedBy?: string; // Admin who modified a final shipment
  modifiedAt?: string; // Timestamp of modification
  deductionsEditedBy?: string; // Admin who edited accountant's deductions
  deductionsEditedAt?: string; // Timestamp of deductions edit
  hasMissingPrices: boolean;
  createdBy?: string; // User ID who created it
  createdAt?: string; // Timestamp from the DB
  updated_at?: string; // Timestamp of last update
  isPendingSync?: boolean; // True if created offline and waiting to be sent to the server.
  notes?: string; // Admin notes
  attachmentUrl?: string; // URL to attachment (PDF or image)
}

/**
 * Defines categories for notifications to allow for filtering.
 */
export enum NotificationCategory {
  USER_ACTION = 'إجراءات المستخدم',
  PRICE_ALERT = 'تنبيهات الأسعار',
  SYSTEM = 'النظام',
}

/**
 * Represents a notification sent to users or roles.
 */
export interface Notification {
  id: string; // UUID from Supabase
  message: string;
  timestamp: string;
  read: boolean;
  category: NotificationCategory;
  targetRoles?: Role[]; // Send to all users with these roles
  targetUserIds?: string[]; // Send to specific users (UUIDs)
}

/**
 * Represents an installment plan for debt collection or regular payments.
 */
export interface Installment {
  id: string; // UUID from Supabase
  shipmentId: string; // Reference to the shipment
  payableAmount: number; // Total amount to be paid (always positive)
  remainingAmount: number; // Amount still owed
  status: 'active' | 'completed' | 'cancelled';
  installmentType?: 'regular' | 'debt_collection'; // Type of installment
  originalAmount?: number; // Original amount (negative for debt collection)
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Represents a payment made towards an installment.
 */
export interface InstallmentPayment {
  id: string; // UUID from Supabase
  installmentId: string; // Reference to the installment
  amount: number; // Payment amount
  receivedDate: string; // Date payment was received
  paymentMethod?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
  createdBy?: string;
}