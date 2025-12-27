// Sale types matching database schema
import { UUID, ISODateString, Decimal, BaseEntity, BaseEntityNoUpdate, SyncStatus } from './common';
import { CustomerPOS } from './customer';
import { ProductPOS } from './product';

// Sale status
export type SaleStatus = 'PENDING' | 'COMPLETED' | 'VOIDED' | 'RETURNED';

// Sale entity matching sales table
export interface Sale extends BaseEntity {
  // Identifiers
  sale_number: string;                   // max 30 chars, unique
  ticket_number: string | null;          // max 20 chars

  // Location
  branch_id: UUID;
  register_id: UUID;
  session_id: UUID;

  // Customer (optional for quick sales)
  customer_id: UUID | null;

  // Seller (for wholesale commission)
  seller_id: UUID | null;

  // Amounts
  subtotal: Decimal;
  discount_amount: Decimal;              // default: 0
  discount_percent: Decimal;             // default: 0
  tax_amount: Decimal;                   // default: 0
  total_amount: Decimal;

  // Loyalty
  points_earned: number;                 // default: 0
  points_redeemed: number;               // default: 0
  points_redemption_value: Decimal;      // default: 0

  // Customer credit
  credit_used: Decimal;                  // default: 0
  change_as_credit: Decimal;             // default: 0

  // Status
  status: SaleStatus;                    // default: 'COMPLETED'

  // Voiding
  voided_at: ISODateString | null;
  voided_by: UUID | null;
  void_reason: string | null;            // max 255 chars
  void_approved_by: UUID | null;

  // Created by
  created_by: UUID;

  // Sync tracking (for offline POS)
  local_id: string | null;               // max 50 chars
  local_created_at: ISODateString | null;
  synced_at: ISODateString | null;
  sync_status: SyncStatus;               // default: 'SYNCED'
}

// Sale with full details
export interface SaleWithDetails extends Sale {
  branch_name: string;
  register_name: string;
  customer_name: string | null;
  seller_name: string | null;
  created_by_name: string;
  items: SaleItemWithProduct[];
  payments: SalePaymentWithMethod[];
  invoice: SaleInvoiceSummary | null;
}

// Sale for list view
export interface SaleSummary {
  id: UUID;
  sale_number: string;
  created_at: ISODateString;
  total_amount: Decimal;
  status: SaleStatus;
  customer_name: string | null;
  payment_methods: string[];             // List of payment method names used
  items_count: number;
}

// Sale item entity matching sale_items table
export interface SaleItem extends BaseEntityNoUpdate {
  sale_id: UUID;
  product_id: UUID;
  quantity: Decimal;
  unit_price: Decimal;
  cost_price: Decimal | null;
  discount_percent: Decimal;             // default: 0
  discount_amount: Decimal;              // default: 0
  tax_rate: Decimal;                     // default: 21.00
  tax_amount: Decimal;                   // default: 0
  line_total: Decimal;
  notes: string | null;                  // max 255 chars
}

// Sale item with product details
export interface SaleItemWithProduct extends SaleItem {
  product_name: string;
  product_sku: string;
  unit_code: string;
}

// Sale invoice summary
export interface SaleInvoiceSummary {
  id: UUID;
  invoice_type: string;
  invoice_number: string;
  cae: string | null;
  pdf_url: string | null;
  status: string;
}

// Cart item for POS (before completing sale)
export interface CartItem {
  product: ProductPOS;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  discount_amount: number;
  line_total: number;
  notes?: string;
}

// Cart state for POS
export interface Cart {
  items: CartItem[];
  customer: CustomerPOS | null;
  subtotal: number;
  discount_percent: number;
  discount_amount: number;
  tax_amount: number;
  total_amount: number;
  points_to_redeem: number;
  points_redemption_value: number;
  credit_to_use: number;
}

// Create sale DTO
export interface CreateSaleRequest {
  branch_id: UUID;
  register_id: UUID;
  session_id: UUID;
  customer_id?: UUID;
  seller_id?: UUID;
  discount_percent?: number;
  discount_amount?: number;
  points_redeemed?: number;
  credit_used?: number;
  change_as_credit?: number;
  items: CreateSaleItemRequest[];
  payments: CreateSalePaymentRequest[];

  // For offline sync
  local_id?: string;
  local_created_at?: ISODateString;
}

// Create sale item DTO
export interface CreateSaleItemRequest {
  product_id: UUID;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  notes?: string;
}

// Create sale payment DTO
export interface CreateSalePaymentRequest {
  payment_method_id: UUID;
  amount: number;
  reference_number?: string;
  card_last_four?: string;
  card_brand?: string;
  authorization_code?: string;
  qr_provider?: string;
  qr_transaction_id?: string;
}

// Void sale DTO
export interface VoidSaleRequest {
  reason: string;
  approved_by_pin?: string;              // Manager PIN for authorization
}

// Sale filter params
export interface SaleFilterParams {
  branch_id?: UUID;
  session_id?: UUID;
  customer_id?: UUID;
  seller_id?: UUID;
  status?: SaleStatus;
  from_date?: string;
  to_date?: string;
  min_amount?: number;
  max_amount?: number;
  search?: string;                       // Search by sale_number
}

// Sale report summary
export interface SaleReportSummary {
  total_sales: number;
  total_amount: Decimal;
  total_discount: Decimal;
  total_tax: Decimal;
  voided_count: number;
  voided_amount: Decimal;
  average_sale: Decimal;
  items_sold: number;
  by_payment_method: {
    method_name: string;
    total: Decimal;
    count: number;
  }[];
  by_hour: {
    hour: number;
    total: Decimal;
    count: number;
  }[];
}
