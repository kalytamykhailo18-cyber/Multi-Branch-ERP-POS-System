// Alert types matching database schema
import { UUID, ISODateString, BaseEntityNoUpdate } from './common';

// Alert types
export type AlertType =
  | 'VOIDED_SALE'
  | 'CASH_DISCREPANCY'
  | 'LOW_STOCK'
  | 'LATE_CLOSING'
  | 'REOPEN_REGISTER'
  | 'FAILED_INVOICE'
  | 'LARGE_DISCOUNT'
  | 'HIGH_VALUE_SALE'
  | 'SYNC_ERROR'
  | 'LOGIN_FAILED'
  | 'PRICE_CHANGE';

// Alert severity levels
export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Alert entity matching alerts table
export interface Alert extends BaseEntityNoUpdate {
  alert_type: AlertType;
  severity: AlertSeverity;               // default: 'MEDIUM'
  branch_id: UUID | null;
  user_id: UUID | null;                  // User who triggered the alert
  title: string;                         // max 200 chars
  message: string;                       // TEXT

  // Reference to related entity
  reference_type: string | null;         // max 50 chars (e.g., 'SALE', 'SESSION')
  reference_id: UUID | null;

  // Read status
  is_read: boolean;                      // default: false
  read_by: UUID | null;
  read_at: ISODateString | null;

  // Resolution status
  is_resolved: boolean;                  // default: false
  resolved_by: UUID | null;
  resolved_at: ISODateString | null;
  resolution_notes: string | null;       // TEXT
}

// Alert with details for display
export interface AlertWithDetails extends Alert {
  branch_name: string | null;
  triggered_by_name: string | null;
  read_by_name: string | null;
  resolved_by_name: string | null;
}

// Alert for notification
export interface AlertNotification {
  id: UUID;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  branch_name: string | null;
  created_at: ISODateString;
}

// Create alert DTO
export interface CreateAlertRequest {
  alert_type: AlertType;
  severity?: AlertSeverity;
  branch_id?: UUID;
  user_id?: UUID;
  title: string;
  message: string;
  reference_type?: string;
  reference_id?: UUID;
}

// Mark alert as read DTO
export interface MarkAlertReadRequest {
  alert_ids: UUID[];
}

// Resolve alert DTO
export interface ResolveAlertRequest {
  resolution_notes?: string;
}

// Alert filter params
export interface AlertFilterParams {
  alert_type?: AlertType;
  severity?: AlertSeverity;
  branch_id?: UUID;
  is_read?: boolean;
  is_resolved?: boolean;
  from_date?: string;
  to_date?: string;
}

// Alert counts by severity
export interface AlertCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
  unread: number;
}

// Alert configuration for automatic alerts
export interface AlertConfiguration {
  // Cash discrepancy thresholds
  cash_discrepancy_warning: number;      // Amount that triggers warning
  cash_discrepancy_critical: number;     // Amount that triggers critical

  // Late closing
  late_closing_minutes: number;          // Minutes after expected close time

  // Large discount
  large_discount_percent: number;        // Discount % that triggers alert

  // High value sale
  high_value_sale_amount: number;        // Sale amount that triggers alert

  // Low stock
  low_stock_enabled: boolean;
  low_stock_days_supply: number;         // Days of supply threshold
}

// Real-time alert event (for WebSocket)
export interface AlertEvent {
  type: 'NEW_ALERT' | 'ALERT_READ' | 'ALERT_RESOLVED';
  alert: AlertNotification;
  target_user_ids?: UUID[];              // Specific users to notify, null = all with permission
  target_branch_ids?: UUID[];            // Specific branches, null = all
}
