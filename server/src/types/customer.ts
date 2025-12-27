// Customer types matching database schema
import { UUID, ISODateString, Decimal, BaseEntity } from './common';

// Document types (Argentina)
export type DocumentType = 'DNI' | 'CUIT' | 'CUIL' | 'PASSPORT' | 'OTHER';

// Tax condition types (Argentina AFIP)
export type TaxCondition = 'CONSUMIDOR_FINAL' | 'MONOTRIBUTO' | 'RESP_INSCRIPTO' | 'EXENTO';

// Loyalty tier levels
export type LoyaltyTier = 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';

// Customer entity matching customers table
export interface Customer extends BaseEntity {
  customer_code: string | null;          // max 20 chars, unique

  // Personal info
  first_name: string | null;             // max 100 chars
  last_name: string | null;              // max 100 chars
  company_name: string | null;           // max 200 chars

  // Tax info (for invoicing)
  document_type: DocumentType;           // default: 'DNI'
  document_number: string | null;        // max 20 chars
  tax_condition: TaxCondition | null;

  // Contact
  email: string | null;                  // max 100 chars
  phone: string | null;                  // max 50 chars

  // Address (for delivery/shipping)
  address: string | null;                // max 255 chars
  neighborhood: string | null;           // max 100 chars
  city: string | null;                   // max 100 chars
  postal_code: string | null;            // max 20 chars

  // Loyalty
  loyalty_points: number;                // default: 0
  loyalty_tier: LoyaltyTier;             // default: 'STANDARD'
  qr_code: string | null;                // max 100 chars, unique (for quick scan)

  // Credit (change as credit)
  credit_balance: Decimal;               // default: 0

  // Wholesale
  is_wholesale: boolean;                 // default: false
  wholesale_discount_percent: Decimal;   // default: 0
  assigned_vendor_id: UUID | null;

  // Status
  is_active: boolean;                    // default: true
  notes: string | null;                  // TEXT
}

// Customer with summary data
export interface CustomerWithSummary extends Customer {
  total_purchases: Decimal;
  total_transactions: number;
  last_purchase_at: ISODateString | null;
  assigned_vendor_name: string | null;
}

// Customer for POS display (quick lookup)
export interface CustomerPOS {
  id: UUID;
  customer_code: string | null;
  display_name: string;                  // Computed: company or first+last name
  phone: string | null;
  loyalty_points: number;
  credit_balance: Decimal;
  is_wholesale: boolean;
  wholesale_discount_percent: Decimal;
  qr_code: string | null;
}

// Create customer DTO
export interface CreateCustomerRequest {
  customer_code?: string;
  first_name?: string;
  last_name?: string;
  company_name?: string;
  document_type?: DocumentType;
  document_number?: string;
  tax_condition?: TaxCondition;
  email?: string;
  phone?: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  postal_code?: string;
  is_wholesale?: boolean;
  wholesale_discount_percent?: number;
  assigned_vendor_id?: UUID;
  notes?: string;
}

// Update customer DTO
export interface UpdateCustomerRequest extends Partial<CreateCustomerRequest> {
  is_active?: boolean;
}

// Customer filter params
export interface CustomerFilterParams {
  is_wholesale?: boolean;
  is_active?: boolean;
  loyalty_tier?: LoyaltyTier;
  search?: string;                       // Search by name, code, phone, document
  assigned_vendor_id?: UUID;
  has_credit?: boolean;                  // Customers with credit balance > 0
}

// Loyalty transaction types
export type LoyaltyTransactionType = 'EARN' | 'REDEEM' | 'EXPIRE' | 'ADJUST';

// Loyalty transaction entity matching loyalty_transactions table
export interface LoyaltyTransaction extends BaseEntityNoUpdate {
  customer_id: UUID;
  transaction_type: LoyaltyTransactionType;
  points: number;                        // Positive for earn, negative for redeem
  points_balance_after: number;
  sale_id: UUID | null;
  description: string | null;            // max 255 chars
  expires_at: ISODateString | null;
  expired: boolean;                      // default: false
  created_by: UUID | null;
}

// Credit transaction types
export type CreditTransactionType = 'CREDIT' | 'DEBIT' | 'ADJUST';

// Credit transaction entity matching credit_transactions table
export interface CreditTransaction extends BaseEntityNoUpdate {
  customer_id: UUID;
  transaction_type: CreditTransactionType;
  amount: Decimal;                       // Positive for credit, negative for debit
  balance_after: Decimal;
  sale_id: UUID | null;
  description: string | null;            // max 255 chars
  created_by: UUID | null;
}

// Add/redeem points DTO
export interface PointsTransactionRequest {
  customer_id: UUID;
  points: number;
  description?: string;
  sale_id?: UUID;
}

// Add/use credit DTO
export interface CreditTransactionRequest {
  customer_id: UUID;
  amount: number;
  description?: string;
  sale_id?: UUID;
}
