// Common Types
export type UUID = string;
export type ISODateString = string;
export type Decimal = string | number;

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

// Auth Types
export interface User {
  id: UUID;
  email: string;
  first_name: string;
  last_name: string;
  role_id: UUID;
  role?: Role;
  primary_branch_id: UUID;
  primary_branch?: Branch;
  branches?: Branch[];
  is_active: boolean;
  created_at: ISODateString;
}

export interface Role {
  id: UUID;
  name: string;
  code: string;
  permissions: RolePermissions;
}

export interface RolePermissions {
  canManageUsers?: boolean;
  canManageProducts?: boolean;
  canManageInventory?: boolean;
  canViewReports?: boolean;
  canManageSettings?: boolean;
  canVoidSales?: boolean;
  canApplyDiscounts?: boolean;
  canOpenRegister?: boolean;
  canCloseRegister?: boolean;
  canAccessAllBranches?: boolean;
  [key: string]: boolean | undefined;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentBranch: Branch | null;
  currentSession: RegisterSession | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface PINLoginCredentials {
  user_id: UUID;
  pin: string;
  branch_id: UUID;
}

// Branch Types
export interface Branch {
  id: UUID;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  tax_id?: string;
  is_active: boolean;
  is_main: boolean;
}

// Category Types
export interface Category {
  id: UUID;
  name: string;
  description?: string;
  parent_id?: UUID;
  parent?: Category;
  subcategories?: Category[];
  icon?: string;
  color?: string;
  sort_order: number;
  is_active: boolean;
}

// Product Types
export interface Product {
  id: UUID;
  sku: string;
  barcode?: string;
  name: string;
  short_name?: string;
  description?: string;
  category_id?: UUID;
  category?: Category;
  unit_id?: UUID;
  unit?: UnitOfMeasure;
  cost_price: Decimal;
  selling_price: Decimal;
  wholesale_price?: Decimal;
  tax_rate: Decimal;
  is_tax_included: boolean;
  is_weighable: boolean;
  is_active: boolean;
  thumbnail_url?: string;
  image_url?: string;
  stock_quantity?: number;
  margin_percent?: Decimal;
}

export interface UnitOfMeasure {
  id: UUID;
  code: string;
  name: string;
  allow_decimals: boolean;
}

export interface BranchStock {
  id: UUID;
  branch_id: UUID;
  product_id: UUID;
  quantity: Decimal;
  min_stock: Decimal;
  max_stock: Decimal;
  product?: Product;
  branch?: Branch;
}

// POS Product (simplified for POS screen)
export interface POSProduct {
  id: UUID;
  sku: string;
  barcode?: string;
  name: string;
  short_name?: string;
  selling_price: Decimal;
  tax_rate: Decimal;
  is_tax_included: boolean;
  is_weighable: boolean;
  unit_code?: string;
  category_name?: string;
  thumbnail_url?: string;
  image_url?: string;
  stock_quantity: number;
}

// Customer Types
export interface Customer {
  id: UUID;
  customer_code: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  document_type?: string;
  document_number?: string;
  tax_condition?: string;
  phone?: string;
  email?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  postal_code?: string;
  qr_code: string;
  loyalty_points: number;
  loyalty_tier?: string;
  credit_balance: Decimal;
  assigned_vendor_id?: UUID;
  is_wholesale: boolean;
  wholesale_discount_percent: Decimal;
  is_active: boolean;
  notes?: string;
}

export interface QuickSearchCustomer {
  id: UUID;
  customer_code: string;
  first_name?: string;
  last_name?: string;
  display_name: string;
  email?: string;
  phone?: string;
  loyalty_points: number;
  credit_balance: Decimal;
  is_wholesale: boolean;
  wholesale_discount_percent: Decimal;
  qr_code: string;
}

// Cart Types
export interface CartItem {
  id: string; // Unique cart item ID
  product_id: UUID;
  product: POSProduct;
  quantity: number;
  unit_price: Decimal;
  discount_percent: number;
  discount_amount: Decimal;
  tax_rate: Decimal;
  tax_amount: Decimal;
  subtotal: Decimal;
  total: Decimal;
}

export interface Cart {
  items: CartItem[];
  customer?: Customer;
  subtotal: Decimal;
  discount_type?: 'PERCENT' | 'FIXED';
  discount_value: number;
  discount_amount: Decimal;
  tax_amount: Decimal;
  total: Decimal;
}

// Payment Types
export interface PaymentMethod {
  id: UUID;
  name: string;
  code: string;
  type: 'CASH' | 'CARD' | 'DIGITAL' | 'CREDIT' | 'OTHER';
  icon?: string;
  is_active: boolean;
  requires_reference: boolean;
  sort_order: number;
}

export interface SalePayment {
  id?: UUID;
  payment_method_id: UUID;
  payment_method?: PaymentMethod;
  amount: Decimal;
  reference_number?: string;
}

// Sale Types
export type SaleStatus = 'PENDING' | 'COMPLETED' | 'VOIDED' | 'RETURNED';

export interface Sale {
  id: UUID;
  sale_number: string;
  branch_id: UUID;
  branch?: Branch;
  register_id: UUID;
  session_id: UUID;
  customer_id?: UUID;
  customer?: Customer;
  cashier_id: UUID;
  cashier?: User;
  subtotal: Decimal;
  discount_type?: string;
  discount_value?: Decimal;
  discount_amount: Decimal;
  tax_amount: Decimal;
  total_amount: Decimal;
  paid_amount: Decimal;
  change_amount: Decimal;
  status: SaleStatus;
  void_reason?: string;
  voided_by?: UUID;
  voided_at?: ISODateString;
  notes?: string;
  created_at: ISODateString;
  items?: SaleItem[];
  payments?: SalePayment[];
}

export interface SaleItem {
  id: UUID;
  sale_id: UUID;
  product_id: UUID;
  product_name: string;
  product_sku: string;
  quantity: Decimal;
  unit_price: Decimal;
  discount_percent: Decimal;
  discount_amount: Decimal;
  tax_rate: Decimal;
  tax_amount: Decimal;
  subtotal: Decimal;
  total: Decimal;
}

// Register & Session Types
export type SessionStatus = 'OPEN' | 'CLOSED' | 'FORCE_CLOSED';
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'FULL_DAY';

export interface Register {
  id: UUID;
  branch_id: UUID;
  branch?: Branch;
  register_number: string;
  name: string;
  is_active: boolean;
  current_session_id?: UUID;
  current_session?: RegisterSession;
}

export interface RegisterSession {
  id: UUID;
  register_id: UUID;
  register?: Register;
  branch_id: UUID;
  branch?: Branch;
  cashier_id: UUID;
  cashier?: User;
  shift_type: ShiftType;
  opening_amount: Decimal;
  closing_amount?: Decimal;
  status: SessionStatus;
  opened_at: ISODateString;
  closed_at?: ISODateString;
  closed_by?: UUID;
  // Blind closing fields
  declared_cash?: Decimal;
  declared_card?: Decimal;
  declared_qr?: Decimal;
  declared_transfer?: Decimal;
  expected_cash?: Decimal;
  expected_card?: Decimal;
  expected_qr?: Decimal;
  expected_transfer?: Decimal;
  discrepancy_cash?: Decimal;
  discrepancy_card?: Decimal;
  discrepancy_qr?: Decimal;
  discrepancy_transfer?: Decimal;
  total_sales?: number;
  total_revenue?: Decimal;
  notes?: string;
}

export interface OpenSessionData {
  register_id: UUID;
  opening_amount: number;
  shift_type: ShiftType;
  notes?: string;
}

export interface CloseSessionData {
  declared_cash: number;
  declared_card: number;
  declared_qr: number;
  declared_transfer: number;
  notes?: string;
}

// Alert Types
export type AlertType = 'LOW_STOCK' | 'CASH_DISCREPANCY' | 'HIGH_VOID_RATE' | 'SHRINKAGE_HIGH' |
  'OFFLINE_BRANCH' | 'SESSION_OVERTIME' | 'LARGE_TRANSACTION' | 'SYSTEM_ERROR';
export type AlertSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface Alert {
  id: UUID;
  branch_id: UUID;
  branch?: Branch;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  data?: string;
  is_read: boolean;
  read_by?: UUID;
  read_at?: ISODateString;
  created_at: ISODateString;
}

// Report Types
export interface DailyReportData {
  report_date: string;
  branch_id: UUID;
  sales: {
    total_count: number;
    total_revenue: number;
    total_tax: number;
    total_discounts: number;
    average_ticket: number;
    voided_count: number;
    voided_amount: number;
  };
  payments: Array<{
    method: string;
    code: string;
    total: number;
  }>;
  sessions: {
    total_sessions: number;
    total_opening: number;
    total_closing: number;
    total_discrepancy: number;
  };
  top_products: Array<{
    product: string;
    sku: string;
    quantity: number;
    revenue: number;
  }>;
  hourly: Array<{
    hour: number;
    sales_count: number;
    revenue: number;
  }>;
}

export interface OwnerDashboardData {
  period: {
    start_date: ISODateString;
    end_date: ISODateString;
  };
  branches: number;
  overall: {
    total_sales: number;
    total_revenue: number;
    average_ticket: number;
  };
  by_branch: Array<{
    branch_id: UUID;
    branch: Branch;
    total_sales: number;
    total_revenue: number;
  }>;
  daily_trend: Array<{
    date: string;
    sales_count: number;
    revenue: number;
  }>;
  discrepancies: Array<{
    branch_id: UUID;
    branch: Branch;
    count: number;
    total_discrepancy: number;
  }>;
  shrinkage: {
    total_records: number;
    total_cost_loss: number;
  };
  top_products: Array<{
    product_id: UUID;
    product: Product;
    total_quantity: number;
    total_revenue: number;
  }>;
}

// Invoice Types
export type InvoiceType = 'A' | 'B' | 'C' | 'NC_A' | 'NC_B' | 'NC_C';
export type InvoiceStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'VOIDED';

export interface Invoice {
  id: UUID;
  sale_id: UUID;
  branch_id: UUID;
  customer_id?: UUID;
  invoice_type: InvoiceType;
  invoice_number: string;
  point_of_sale: string;
  invoice_date: ISODateString;
  subtotal: Decimal;
  tax_amount: Decimal;
  total_amount: Decimal;
  status: InvoiceStatus;
  cae?: string;
  cae_expiration?: ISODateString;
  customer_name: string;
  customer_document_type?: string;
  customer_document_number?: string;
  customer_tax_condition?: string;
}

// Supplier Types
export interface Supplier {
  id: UUID;
  name: string;
  tax_id?: string;
  contact_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_active: boolean;
}

// Stock Movement Types
export type MovementType = 'SALE' | 'PURCHASE' | 'TRANSFER_IN' | 'TRANSFER_OUT' |
  'ADJUSTMENT_IN' | 'ADJUSTMENT_OUT' | 'SHRINKAGE' | 'RETURN';

export interface StockMovement {
  id: UUID;
  branch_id: UUID;
  product_id: UUID;
  movement_type: MovementType;
  quantity: Decimal;
  quantity_before: Decimal;
  quantity_after: Decimal;
  reference_type?: string;
  reference_id?: UUID;
  reason?: string;
  notes?: string;
  created_by: UUID;
  created_at: ISODateString;
}

// Shrinkage Types
export type ShrinkageReason = 'DAMAGED' | 'EXPIRED' | 'LOST' | 'THEFT' | 'SPILLAGE' | 'PEST' | 'OTHER';

export interface Shrinkage {
  id: UUID;
  branch_id: UUID;
  product_id: UUID;
  product?: Product;
  quantity: Decimal;
  cost_loss: Decimal;
  reason: ShrinkageReason;
  notes?: string;
  reported_by: UUID;
  created_at: ISODateString;
}

// Loyalty Types
export type LoyaltyTransactionType = 'EARN' | 'REDEEM' | 'ADJUST' | 'EXPIRE' | 'VOID';

export interface LoyaltyTransaction {
  id: UUID;
  customer_id: UUID;
  sale_id?: UUID;
  transaction_type: LoyaltyTransactionType;
  points: number;
  points_balance_after: number;
  description?: string;
  created_at: ISODateString;
}

// Credit Types
export type CreditTransactionType = 'CREDIT' | 'DEBIT' | 'PAYMENT' | 'ADJUST';

export interface CreditTransaction {
  id: UUID;
  customer_id: UUID;
  sale_id?: UUID;
  transaction_type: CreditTransactionType;
  amount: Decimal;
  balance_after: Decimal;
  description?: string;
  created_at: ISODateString;
}
