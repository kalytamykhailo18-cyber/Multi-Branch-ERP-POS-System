// Payment types matching database schema
import { UUID, ISODateString, Decimal, BaseEntityNoUpdate } from './common';

// Payment method entity matching payment_methods table
export interface PaymentMethod extends BaseEntityNoUpdate {
  code: string;                          // max 20 chars, unique (e.g., 'CASH', 'CARD')
  name: string;                          // max 50 chars
  requires_reference: boolean;           // default: false (for transfers)
  is_active: boolean;                    // default: true
  sort_order: number;                    // default: 0
}

// Payment method codes
export type PaymentMethodCode = 'CASH' | 'DEBIT' | 'CREDIT' | 'QR' | 'TRANSFER';

// Create payment method DTO
export interface CreatePaymentMethodRequest {
  code: string;
  name: string;
  requires_reference?: boolean;
  sort_order?: number;
}

// Update payment method DTO
export interface UpdatePaymentMethodRequest {
  name?: string;
  requires_reference?: boolean;
  is_active?: boolean;
  sort_order?: number;
}

// Sale payment entity matching sale_payments table
export interface SalePayment extends BaseEntityNoUpdate {
  sale_id: UUID;
  payment_method_id: UUID;
  amount: Decimal;

  // For transfers (receipt number required)
  reference_number: string | null;       // max 100 chars

  // For cards
  card_last_four: string | null;         // max 4 chars
  card_brand: string | null;             // max 20 chars
  authorization_code: string | null;     // max 50 chars

  // For QR payments
  qr_provider: string | null;            // max 50 chars (MercadoPago, etc.)
  qr_transaction_id: string | null;      // max 100 chars
}

// Sale payment with method details
export interface SalePaymentWithMethod extends SalePayment {
  payment_method_code: string;
  payment_method_name: string;
}

// Payment summary for register session
export interface PaymentSummary {
  payment_method_id: UUID;
  payment_method_code: string;
  payment_method_name: string;
  total_amount: Decimal;
  transaction_count: number;
}

// Payment for completing a sale
export interface PaymentInput {
  payment_method_code: PaymentMethodCode;
  amount: number;
  reference_number?: string;
  card_last_four?: string;
  card_brand?: string;
  authorization_code?: string;
  qr_provider?: string;
  qr_transaction_id?: string;
}
