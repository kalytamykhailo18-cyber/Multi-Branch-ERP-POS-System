// Invoice types matching database schema
import { UUID, ISODateString, Decimal, BaseEntity, BaseEntityNoUpdate, DateOnlyString } from './common';
import { DocumentType, TaxCondition } from './customer';

// Invoice type entity matching invoice_types table
export interface InvoiceType extends BaseEntityNoUpdate {
  code: string;                          // char(1), unique (A, B, C)
  name: string;                          // max 50 chars
  description: string | null;            // max 255 chars
  requires_customer_cuit: boolean;       // default: false
}

// Invoice status
export type InvoiceStatus = 'PENDING' | 'ISSUED' | 'FAILED' | 'CANCELLED';

// Invoice entity matching invoices table
export interface Invoice extends BaseEntity {
  sale_id: UUID;

  // AFIP/FactuHoy data
  invoice_type_id: UUID;
  point_of_sale: number;
  invoice_number: number;

  // CAE (Codigo de Autorizacion Electronico)
  cae: string | null;                    // max 20 chars
  cae_expiration_date: DateOnlyString | null;

  // Customer data (snapshot at time of invoice)
  customer_name: string | null;          // max 200 chars
  customer_document_type: DocumentType | null;
  customer_document_number: string | null; // max 20 chars
  customer_tax_condition: TaxCondition | null;
  customer_address: string | null;       // max 255 chars

  // Amounts
  net_amount: Decimal;
  tax_amount: Decimal;
  total_amount: Decimal;

  // FactuHoy response
  factuhoy_id: string | null;            // max 100 chars
  factuhoy_response: object | null;      // JSONB
  pdf_url: string | null;                // max 500 chars

  // Status
  status: InvoiceStatus;                 // default: 'PENDING'
  error_message: string | null;          // TEXT
  retry_count: number;                   // default: 0
  last_retry_at: ISODateString | null;
  issued_at: ISODateString | null;
}

// Invoice with details
export interface InvoiceWithDetails extends Invoice {
  invoice_type: InvoiceType;
  sale_number: string;
  branch_name: string;
}

// Credit note status
export type CreditNoteStatus = 'PENDING' | 'ISSUED' | 'FAILED';

// Credit note entity matching credit_notes table
export interface CreditNote extends BaseEntity {
  original_invoice_id: UUID;

  // AFIP/FactuHoy data
  invoice_type_id: UUID;
  point_of_sale: number;
  credit_note_number: number;

  // CAE
  cae: string | null;                    // max 20 chars
  cae_expiration_date: DateOnlyString | null;

  // Amounts
  net_amount: Decimal;
  tax_amount: Decimal;
  total_amount: Decimal;

  reason: string;                        // max 255 chars

  // FactuHoy response
  factuhoy_id: string | null;            // max 100 chars
  factuhoy_response: object | null;      // JSONB
  pdf_url: string | null;                // max 500 chars

  // Status
  status: CreditNoteStatus;              // default: 'PENDING'
  error_message: string | null;          // TEXT
  issued_at: ISODateString | null;
}

// Create invoice DTO
export interface CreateInvoiceRequest {
  sale_id: UUID;
  invoice_type_code: string;             // 'A', 'B', or 'C'
  customer_name?: string;
  customer_document_type?: DocumentType;
  customer_document_number?: string;
  customer_tax_condition?: TaxCondition;
  customer_address?: string;
}

// Create credit note DTO
export interface CreateCreditNoteRequest {
  original_invoice_id: UUID;
  reason: string;
  amount?: number;                       // Partial credit note, defaults to full amount
}

// FactuHoy API request structure
export interface FactuHoyInvoiceRequest {
  punto_venta: number;
  tipo_comprobante: number;              // AFIP code (1=Factura A, 6=Factura B, etc.)
  concepto: number;                      // 1=Products, 2=Services, 3=Mixed
  documento_tipo: number;                // 80=CUIT, 86=CUIL, 96=DNI, 99=CF
  documento_numero: string;
  importe_neto: number;
  importe_iva: number;
  importe_total: number;
  items: FactuHoyItem[];
}

// FactuHoy item structure
export interface FactuHoyItem {
  descripcion: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  iva_alicuota: number;                  // IVA rate code (5=21%, 4=10.5%, etc.)
  importe: number;
}

// FactuHoy API response structure
export interface FactuHoyInvoiceResponse {
  success: boolean;
  cae?: string;
  cae_vencimiento?: string;
  comprobante_numero?: number;
  pdf_url?: string;
  error?: string;
  error_codigo?: string;
}

// Invoice filter params
export interface InvoiceFilterParams {
  branch_id?: UUID;
  invoice_type_id?: UUID;
  status?: InvoiceStatus;
  from_date?: string;
  to_date?: string;
  customer_document_number?: string;
}
