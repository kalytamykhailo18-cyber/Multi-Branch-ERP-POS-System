// Register session types matching database schema
import { UUID, ISODateString, Decimal, BaseEntity, DateOnlyString } from './common';

// Cash register entity matching cash_registers table
export interface CashRegister extends BaseEntity {
  branch_id: UUID;
  register_number: number;
  name: string | null;                   // max 50 chars
  is_active: boolean;                    // default: true
}

// Cash register with branch details
export interface CashRegisterWithBranch extends CashRegister {
  branch_name: string;
  branch_code: string;
  current_session: RegisterSessionSummary | null;
}

// Shift type
export type ShiftType = 'MORNING' | 'AFTERNOON' | 'FULL_DAY';

// Register session status
export type RegisterSessionStatus = 'OPEN' | 'CLOSED' | 'REOPENED';

// Register session entity matching register_sessions table
export interface RegisterSession extends BaseEntity {
  register_id: UUID;
  branch_id: UUID;
  session_number: string;                // max 20 chars
  shift_type: ShiftType;
  business_date: DateOnlyString;

  // Opening
  opened_by: UUID;
  opened_at: ISODateString;
  opening_cash: Decimal;                 // default: 0
  opening_notes: string | null;          // TEXT

  // Closing (Blind Closing)
  closed_by: UUID | null;
  closed_at: ISODateString | null;

  // Cashier's declared amounts (blind - they don't see expected)
  declared_cash: Decimal | null;
  declared_card: Decimal | null;
  declared_qr: Decimal | null;
  declared_transfer: Decimal | null;

  // System calculated amounts (revealed after closing)
  expected_cash: Decimal | null;
  expected_card: Decimal | null;
  expected_qr: Decimal | null;
  expected_transfer: Decimal | null;

  // Discrepancies (calculated after closing)
  discrepancy_cash: Decimal | null;
  discrepancy_card: Decimal | null;
  discrepancy_qr: Decimal | null;
  discrepancy_transfer: Decimal | null;
  total_discrepancy: Decimal | null;

  // Status
  status: RegisterSessionStatus;         // default: 'OPEN'
  closing_notes: string | null;          // TEXT

  // Reopen tracking
  reopened_by: UUID | null;
  reopened_at: ISODateString | null;
  reopen_reason: string | null;          // TEXT

  // Sync tracking
  local_id: string | null;               // max 50 chars
  synced_at: ISODateString | null;
}

// Register session summary for lists
export interface RegisterSessionSummary {
  id: UUID;
  session_number: string;
  shift_type: ShiftType;
  business_date: DateOnlyString;
  opened_at: ISODateString;
  opened_by_name: string;
  closed_at: ISODateString | null;
  closed_by_name: string | null;
  status: RegisterSessionStatus;
  total_sales: Decimal;
  transactions_count: number;
  total_discrepancy: Decimal | null;
}

// Register session with full details
export interface RegisterSessionWithDetails extends RegisterSession {
  register_name: string;
  branch_name: string;
  opened_by_name: string;
  closed_by_name: string | null;
  reopened_by_name: string | null;
  sales_count: number;
  sales_total: Decimal;
  voided_count: number;
  voided_total: Decimal;
  payment_summary: RegisterPaymentSummary[];
}

// Payment summary for register session
export interface RegisterPaymentSummary {
  payment_method: string;
  expected: Decimal;
  declared: Decimal | null;
  discrepancy: Decimal | null;
}

// Open register session DTO
export interface OpenRegisterSessionRequest {
  register_id: UUID;
  shift_type: ShiftType;
  opening_cash: number;
  opening_notes?: string;

  // For offline
  local_id?: string;
}

// Close register session DTO (Blind Closing)
export interface CloseRegisterSessionRequest {
  declared_cash: number;
  declared_card: number;
  declared_qr: number;
  declared_transfer: number;
  closing_notes?: string;
}

// Reopen register session DTO
export interface ReopenRegisterSessionRequest {
  reason: string;
  manager_pin: string;                   // Manager authorization
}

// Create cash register DTO
export interface CreateCashRegisterRequest {
  branch_id: UUID;
  register_number: number;
  name?: string;
}

// Update cash register DTO
export interface UpdateCashRegisterRequest {
  name?: string;
  is_active?: boolean;
}

// Daily report entity matching daily_reports table
export interface DailyReport extends BaseEntity {
  branch_id: UUID;
  business_date: DateOnlyString;

  // Totals by payment method
  total_cash: Decimal;                   // default: 0
  total_card: Decimal;                   // default: 0
  total_qr: Decimal;                     // default: 0
  total_transfer: Decimal;               // default: 0
  total_credit_used: Decimal;            // default: 0
  total_points_redeemed: number;         // default: 0

  // Sales summary
  total_gross_sales: Decimal;            // default: 0
  total_discounts: Decimal;              // default: 0
  total_net_sales: Decimal;              // default: 0
  total_tax: Decimal;                    // default: 0

  // Transaction counts
  transaction_count: number;             // default: 0
  voided_count: number;                  // default: 0
  voided_amount: Decimal;                // default: 0
  return_count: number;                  // default: 0
  return_amount: Decimal;                // default: 0

  // Discrepancies
  total_discrepancy: Decimal;            // default: 0

  // Status
  is_finalized: boolean;                 // default: false
  finalized_at: ISODateString | null;
  finalized_by: UUID | null;
}

// Daily report with session details
export interface DailyReportWithDetails extends DailyReport {
  branch_name: string;
  sessions: RegisterSessionSummary[];
  top_products: {
    product_name: string;
    quantity_sold: Decimal;
    total_revenue: Decimal;
  }[];
  hourly_breakdown: {
    hour: number;
    sales_count: number;
    total_amount: Decimal;
  }[];
}

// Daily report filter params
export interface DailyReportFilterParams {
  branch_id?: UUID;
  from_date?: DateOnlyString;
  to_date?: DateOnlyString;
  is_finalized?: boolean;
}

// Owner dashboard summary
export interface OwnerDashboardData {
  today: {
    total_sales: Decimal;
    transaction_count: number;
    average_ticket: Decimal;
    comparison_yesterday: {
      sales_diff_percent: number;
      count_diff_percent: number;
    };
  };
  by_branch: {
    branch_id: UUID;
    branch_name: string;
    total_sales: Decimal;
    transaction_count: number;
    discrepancy: Decimal;
    sessions_status: 'all_closed' | 'some_open' | 'all_open';
  }[];
  alerts_count: {
    high: number;
    medium: number;
    low: number;
  };
  pending_invoices: number;
  low_stock_products: number;
}
