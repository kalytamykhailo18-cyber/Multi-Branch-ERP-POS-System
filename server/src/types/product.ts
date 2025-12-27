// Product types matching database schema
import { UUID, ISODateString, Decimal, BaseEntity, BaseEntityNoUpdate } from './common';
import { Category } from './category';

// Unit of measure entity matching units_of_measure table
export interface UnitOfMeasure extends BaseEntityNoUpdate {
  code: string;                          // max 10 chars, unique
  name: string;                          // max 50 chars
  is_fractional: boolean;                // default: false
}

// Product entity matching products table
export interface Product extends BaseEntity {
  sku: string;                           // max 50 chars, unique
  barcode: string | null;                // max 50 chars
  name: string;                          // max 200 chars
  short_name: string | null;             // max 50 chars (for POS display)
  description: string | null;            // TEXT
  category_id: UUID | null;
  unit_id: UUID;

  // Pricing
  cost_price: Decimal;                   // default: 0
  selling_price: Decimal;
  margin_percent: Decimal | null;
  tax_rate: Decimal;                     // default: 21.00 (Argentina IVA)
  is_tax_included: boolean;              // default: true

  // Stock settings
  track_stock: boolean;                  // default: true
  minimum_stock: Decimal;                // default: 0
  is_weighable: boolean;                 // default: false (for bulk sales)
  shrinkage_percent: Decimal;            // default: 0 (for pet food evaporation)

  // Kretz Aura scale integration
  scale_plu: number | null;              // PLU number for scale
  export_to_scale: boolean;              // default: false

  // Status
  is_active: boolean;                    // default: true
  is_featured: boolean;                  // default: false

  // Images
  image_url: string | null;              // max 500 chars
  thumbnail_url: string | null;          // max 500 chars
}

// Product with related data
export interface ProductWithDetails extends Product {
  category?: Category;
  unit?: UnitOfMeasure;
  branch_stocks?: ProductBranchStock[];
}

// Simplified product for POS display
export interface ProductPOS {
  id: UUID;
  sku: string;
  barcode: string | null;
  name: string;
  short_name: string | null;
  selling_price: Decimal;
  tax_rate: Decimal;
  is_tax_included: boolean;
  is_weighable: boolean;
  unit_code: string;
  category_name: string | null;
  thumbnail_url: string | null;
  stock_quantity: Decimal;
}

// Product branch stock (simplified for product list)
export interface ProductBranchStock {
  branch_id: UUID;
  branch_name: string;
  quantity: Decimal;
  minimum_stock: Decimal;
  is_low: boolean;
}

// Create product DTO
export interface CreateProductRequest {
  sku: string;
  barcode?: string;
  name: string;
  short_name?: string;
  description?: string;
  category_id?: UUID;
  unit_id: UUID;
  cost_price?: number;
  selling_price: number;
  margin_percent?: number;
  tax_rate?: number;
  is_tax_included?: boolean;
  track_stock?: boolean;
  minimum_stock?: number;
  is_weighable?: boolean;
  shrinkage_percent?: number;
  scale_plu?: number;
  export_to_scale?: boolean;
  is_featured?: boolean;
  image_url?: string;
  thumbnail_url?: string;
}

// Update product DTO
export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  is_active?: boolean;
}

// Product filter params
export interface ProductFilterParams {
  category_id?: UUID;
  is_active?: boolean;
  is_weighable?: boolean;
  search?: string;                       // Search by SKU, barcode, or name
  low_stock?: boolean;                   // Products below minimum stock
  branch_id?: UUID;                      // Filter by branch stock
}

// Product price history entity matching product_price_history table
export interface ProductPriceHistory extends BaseEntityNoUpdate {
  product_id: UUID;
  cost_price: Decimal;
  selling_price: Decimal;
  margin_percent: Decimal | null;
  changed_by: UUID | null;
  change_reason: string | null;          // max 255 chars
  import_batch_id: UUID | null;
}

// Create unit of measure DTO
export interface CreateUnitRequest {
  code: string;
  name: string;
  is_fractional?: boolean;
}
