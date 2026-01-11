import type { Database } from '../supabase/database.types';
import { 
  Company, User, Product, Driver, Region, RegionConfig, 
  ProductPrice, DeductionPrice, Shipment, ShipmentProduct,
  Notification, Installment, InstallmentPayment, CompanySetting,
  Role, ShipmentStatus, NotificationCategory
} from '../../types';

// Row type aliases
type CompanyRow = Database['public']['Tables']['companies']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];
type DriverRow = Database['public']['Tables']['drivers']['Row'];
type RegionRow = Database['public']['Tables']['regions']['Row'];
type RegionConfigRow = Database['public']['Tables']['region_configs']['Row'];
type ProductPriceRow = Database['public']['Tables']['product_prices']['Row'];
type ShipmentRow = Database['public']['Tables']['shipments']['Row'];
type ShipmentProductRow = Database['public']['Tables']['shipment_products']['Row'];
type NotificationRow = Database['public']['Tables']['notifications']['Row'];
type InstallmentRow = Database['public']['Tables']['installments']['Row'];
type InstallmentPaymentRow = Database['public']['Tables']['installment_payments']['Row'];
type CompanySettingRow = Database['public']['Tables']['app_settings']['Row'];

// Company mappings
export const companyFromRow = (row: CompanyRow): Company => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  logoUrl: row.logo_url ?? undefined,
  brandColor: row.brand_color ?? '#3B82F6',
  settings: (row.settings as Record<string, unknown>) ?? {},
  isActive: row.is_active ?? true,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// User mappings
export const userFromRow = (row: UserRow): User => ({
  id: row.id,
  username: row.username,
  email: row.email ?? '',
  role: row.role as Role,
  companyId: row.company_id ?? undefined,
  isActive: row.is_active ?? true,
  createdAt: row.created_at ?? undefined,
});

// Product mappings
export const productFromRow = (row: ProductRow): Product => ({
  id: row.id,
  name: row.name,
  isActive: row.is_active ?? true,
  weightKg: row.weight_kg ?? 0,
});

// Driver mappings
export const driverFromRow = (row: DriverRow): Driver => ({
  id: row.id,
  name: row.name,
  plateNumber: row.plate_number,
  isActive: row.is_active ?? true,
});

// Region mappings
export const regionFromRow = (row: RegionRow): Region => ({
  id: row.id,
  name: row.name,
  dieselLiterPrice: Number(row.diesel_liter_price ?? 0),
  dieselLiters: Number(row.diesel_liters ?? 0),
  zaitriFee: Number(row.zaitri_fee ?? 0),
  roadExpenses: Number(row.road_expenses ?? 0),
});

// Region Config mappings (if using versioned pricing)
export const regionConfigFromRow = (row: RegionConfigRow): RegionConfig => ({
  id: row.id,
  regionId: row.region_id,
  dieselLiterPrice: Number(row.diesel_liter_price),
  dieselLiters: Number(row.diesel_liters),
  zaitriFee: Number(row.zaitri_fee),
  roadExpenses: Number(row.road_expenses),
  effectiveFrom: row.effective_from,
});

// Product Price mappings
export const productPriceFromRow = (row: ProductPriceRow): ProductPrice => ({
  id: row.id,
  regionId: row.region_id,
  productId: row.product_id,
  price: Number(row.price),
  effectiveFrom: row.effective_from,
});

// Deduction Price mappings
export const deductionPriceFromRow = (row: DeductionPrice): DeductionPrice => ({
  id: row.id,
  productId: row.product_id,
  shortagePrice: Number(row.shortage_price),
  damagedPrice: Number(row.damaged_price),
  effectiveFrom: row.effective_from,
});

// Shipment Product mappings
export const shipmentProductFromRow = (row: ShipmentProductRow): ShipmentProduct => ({
  productId: row.product_id,
  productName: row.product_name,
  cartonCount: row.carton_count,
  productWagePrice: row.product_wage_price ?? undefined,
  shortageCartons: row.shortage_cartons ?? undefined,
  shortageExemptionRate: row.shortage_exemption_rate ?? undefined,
  shortageValue: row.shortage_value ?? undefined,
  damagedCartons: row.damaged_cartons ?? undefined,
  damagedExemptionRate: row.damaged_exemption_rate ?? undefined,
  damagedValue: row.damaged_value ?? undefined,
});

// Shipment mappings
export const shipmentFromRow = (row: ShipmentRow, products: ShipmentProduct[]): Shipment => ({
  id: row.id,
  salesOrder: row.sales_order,
  orderDate: row.order_date,
  entryTimestamp: row.entry_timestamp,
  regionId: row.region_id,
  driverId: row.driver_id,
  status: row.status as ShipmentStatus,
  products,
  totalDiesel: row.total_diesel ?? undefined,
  totalWage: row.total_wage ?? undefined,
  zaitriFee: row.zaitri_fee ?? undefined,
  adminExpenses: row.admin_expenses ?? undefined,
  dueAmount: row.due_amount ?? undefined,
  damagedValue: row.damaged_value ?? undefined,
  shortageValue: row.shortage_value ?? undefined,
  roadExpenses: row.road_expenses ?? undefined,
  dueAmountAfterDiscount: row.due_amount_after_discount ?? undefined,
  otherAmounts: row.other_amounts ?? undefined,
  improvementBonds: row.improvement_bonds ?? undefined,
  eveningAllowance: row.evening_allowance ?? undefined,
  transferFee: row.transfer_fee ?? undefined,
  totalDueAmount: row.total_due_amount ?? undefined,
  taxRate: row.tax_rate ?? undefined,
  totalTax: row.total_tax ?? undefined,
  transferNumber: row.transfer_number ?? undefined,
  transferDate: row.transfer_date ?? undefined,
  modifiedBy: row.modified_by ?? undefined,
  modifiedAt: row.modified_at ?? undefined,
  deductionsEditedBy: row.deductions_edited_by ?? undefined,
  deductionsEditedAt: row.deductions_edited_at ?? undefined,
  hasMissingPrices: row.has_missing_prices,
  createdBy: row.created_by ?? undefined,
  createdAt: row.created_at ?? undefined,
  updated_at: row.updated_at ?? undefined,
  notes: row.notes ?? undefined,
  attachmentUrl: row.attachment_url ?? undefined,
});

// Notification mappings
export const notificationFromRow = (row: NotificationRow): Notification => ({
  id: row.id,
  message: row.message,
  timestamp: row.timestamp,
  read: row.read ?? false,
  category: row.category as NotificationCategory,
  targetRoles: row.target_roles as Role[] ?? undefined,
  targetUserIds: row.target_user_ids ?? undefined,
});

// Installment mappings
export const installmentFromRow = (row: InstallmentRow): Installment => ({
  id: row.id,
  shipmentId: row.shipment_id,
  payableAmount: Number(row.payable_amount),
  remainingAmount: Number(row.remaining_amount),
  status: row.status as 'active' | 'completed' | 'cancelled',
  installmentType: row.installment_type as 'regular' | 'debt_collection' ?? undefined,
  originalAmount: row.original_amount ? Number(row.original_amount) : undefined,
  notes: row.notes ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by ?? undefined,
  updatedBy: row.updated_by ?? undefined,
});

// Installment Payment mappings
export const installmentPaymentFromRow = (row: InstallmentPaymentRow): InstallmentPayment => ({
  id: row.id,
  installmentId: row.installment_id,
  amount: Number(row.amount),
  receivedDate: row.received_date,
  paymentMethod: row.payment_method ?? undefined,
  referenceNumber: row.reference_number ?? undefined,
  notes: row.notes ?? undefined,
  createdAt: row.created_at,
  createdBy: row.created_by ?? undefined,
});

// Company Setting mappings
export const companySettingFromRow = (row: CompanySettingRow): CompanySetting => ({
  id: row.id,
  companyId: row.company_id,
  settingKey: row.setting_key,
  settingValue: row.setting_value,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

// Helper function to map arrays of rows
export const mapCompanies = (rows: CompanyRow[]): Company[] => rows.map(companyFromRow);
export const mapUsers = (rows: UserRow[]): User[] => rows.map(userFromRow);
export const mapProducts = (rows: ProductRow[]): Product[] => rows.map(productFromRow);
export const mapDrivers = (rows: DriverRow[]): Driver[] => rows.map(driverFromRow);
export const mapRegions = (rows: RegionRow[]): Region[] => rows.map(regionFromRow);
export const mapProductPrices = (rows: ProductPriceRow[]): ProductPrice[] => rows.map(productPriceFromRow);
export const mapNotifications = (rows: NotificationRow[]): Notification[] => rows.map(notificationFromRow);
export const mapInstallments = (rows: InstallmentRow[]): Installment[] => rows.map(installmentFromRow);
export const mapInstallmentPayments = (rows: InstallmentPaymentRow[]): InstallmentPayment[] => rows.map(installmentPaymentFromRow);
export const mapCompanySettings = (rows: CompanySettingRow[]): CompanySetting[] => rows.map(companySettingFromRow);