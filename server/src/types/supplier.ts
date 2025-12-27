// Supplier types matching database schema
import { UUID, ISODateString, Decimal, BaseEntity, BaseEntityNoUpdate } from './common';

// Price list format types
export type PriceListFormat = 'PDF' | 'EXCEL' | 'CSV';

// Supplier entity matching suppliers table
export interface Supplier extends BaseEntity {
  code: string;                          // max 20 chars, unique
  name: string;                          // max 200 chars
  legal_name: string | null;             // max 200 chars
  cuit: string | null;                   // max 20 chars (Argentina tax ID)
  address: string | null;                // max 255 chars
  city: string | null;                   // max 100 chars
  phone: string | null;                  // max 50 chars
  email: string | null;                  // max 100 chars
  website: string | null;                // max 200 chars

  // Contact person
  contact_name: string | null;           // max 100 chars
  contact_phone: string | null;          // max 50 chars
  contact_email: string | null;          // max 100 chars

  // Payment terms
  payment_terms_days: number;            // default: 0
  credit_limit: Decimal;                 // default: 0

  // For OCR import
  price_list_format: PriceListFormat | null;
  default_margin_percent: Decimal;       // default: 30

  is_active: boolean;                    // default: true
  notes: string | null;                  // TEXT
}

// Supplier with product count
export interface SupplierWithProducts extends Supplier {
  products_count: number;
  last_import_at: ISODateString | null;
}

// Create supplier DTO
export interface CreateSupplierRequest {
  code: string;
  name: string;
  legal_name?: string;
  cuit?: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  website?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  payment_terms_days?: number;
  credit_limit?: number;
  price_list_format?: PriceListFormat;
  default_margin_percent?: number;
  notes?: string;
}

// Update supplier DTO
export interface UpdateSupplierRequest extends Partial<CreateSupplierRequest> {
  is_active?: boolean;
}

// Supplier product entity matching supplier_products table
export interface SupplierProduct extends BaseEntity {
  supplier_id: UUID;
  product_id: UUID;
  supplier_sku: string | null;           // max 50 chars
  supplier_product_name: string | null;  // max 200 chars
  supplier_price: Decimal;               // Supplier's cost price
  last_price_update: ISODateString | null;
  is_preferred: boolean;                 // default: false
}

// Create supplier product DTO
export interface CreateSupplierProductRequest {
  supplier_id: UUID;
  product_id: UUID;
  supplier_sku?: string;
  supplier_product_name?: string;
  supplier_price: number;
  is_preferred?: boolean;
}

// Price import batch status
export type ImportBatchStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

// Price import batch entity matching price_import_batches table
export interface PriceImportBatch extends BaseEntityNoUpdate {
  supplier_id: UUID;
  original_filename: string;             // max 255 chars
  file_path: string;                     // max 500 chars
  file_type: PriceListFormat;
  status: ImportBatchStatus;             // default: 'PENDING'
  total_items: number;                   // default: 0
  processed_items: number;               // default: 0
  new_products: number;                  // default: 0
  updated_products: number;              // default: 0
  error_items: number;                   // default: 0
  error_log: string | null;              // TEXT
  processed_at: ISODateString | null;
  processed_by: UUID | null;
}

// Price import item status
export type ImportItemStatus = 'PENDING' | 'MATCHED' | 'NEW' | 'SKIPPED' | 'ERROR';

// Price import item entity matching price_import_items table
export interface PriceImportItem {
  id: UUID;
  batch_id: UUID;
  row_number: number;

  // Extracted data
  supplier_sku: string | null;           // max 50 chars
  product_name: string | null;           // max 200 chars
  extracted_price: Decimal | null;
  raw_line: string | null;               // TEXT

  // Matching
  matched_product_id: UUID | null;
  status: ImportItemStatus;              // default: 'PENDING'
  confidence_score: Decimal | null;

  // Pricing
  old_cost_price: Decimal | null;
  new_cost_price: Decimal | null;
  old_selling_price: Decimal | null;
  new_selling_price: Decimal | null;

  error_message: string | null;          // max 255 chars
  applied_at: ISODateString | null;
  applied_by: UUID | null;
  created_at: ISODateString;
}

// Price import upload request
export interface PriceImportUploadRequest {
  supplier_id: UUID;
  file: File;                            // Multipart file
}

// Price import item update (apply changes)
export interface PriceImportItemApplyRequest {
  item_id: UUID;
  matched_product_id?: UUID;
  new_cost_price?: number;
  new_selling_price?: number;
  skip?: boolean;
}
