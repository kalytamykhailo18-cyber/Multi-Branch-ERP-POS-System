// Branch types matching database schema
import { UUID, ISODateString, TimeString, BaseEntity } from './common';

// Device types for branch
export type DeviceType = 'PC' | 'TABLET';

// Printer types
export type PrinterType = 'THERMAL' | 'LASER' | 'PDF';

// Invoice type codes (AFIP)
export type InvoiceTypeCode = 'A' | 'B' | 'C';

// Branch entity matching branches table
export interface Branch extends BaseEntity {
  code: string;                          // max 10 chars, unique
  name: string;                          // max 100 chars
  address: string | null;                // max 255 chars
  neighborhood: string | null;           // max 100 chars
  city: string;                          // default: 'Buenos Aires'
  postal_code: string | null;            // max 20 chars
  phone: string | null;                  // max 50 chars
  email: string | null;                  // max 100 chars

  // Operating hours
  midday_closing_time: TimeString;       // default: '14:00:00'
  evening_closing_time: TimeString;      // default: '20:00:00'
  has_shift_change: boolean;             // default: true

  // FactuHoy/AFIP configuration
  factuhoy_point_of_sale: number | null;
  default_invoice_type: InvoiceTypeCode; // default: 'B'

  // Hardware info
  device_type: DeviceType;               // default: 'PC'
  printer_model: string | null;          // max 100 chars
  printer_type: PrinterType;             // default: 'THERMAL'

  // Status
  is_active: boolean;                    // default: true
  timezone: string;                      // default: 'America/Argentina/Buenos_Aires'
}

// Create branch DTO
export interface CreateBranchRequest {
  code: string;
  name: string;
  address?: string;
  neighborhood?: string;
  city?: string;
  postal_code?: string;
  phone?: string;
  email?: string;
  midday_closing_time?: TimeString;
  evening_closing_time?: TimeString;
  has_shift_change?: boolean;
  factuhoy_point_of_sale?: number;
  default_invoice_type?: InvoiceTypeCode;
  device_type?: DeviceType;
  printer_model?: string;
  printer_type?: PrinterType;
  timezone?: string;
}

// Update branch DTO
export interface UpdateBranchRequest extends Partial<CreateBranchRequest> {
  is_active?: boolean;
}

// Branch with related data
export interface BranchWithDetails extends Branch {
  users_count?: number;
  registers_count?: number;
  today_sales_total?: string;
}
