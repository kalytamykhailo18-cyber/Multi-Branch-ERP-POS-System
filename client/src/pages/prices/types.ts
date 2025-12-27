export interface ExtractedPrice {
  row_number?: number;
  supplier_code: string;
  description: string;
  unit_price: number;
  matched_product_id: string | null | undefined;
  matched_product_name?: string | null;
  matched_sku?: string | null;
  confidence?: number;
  price_change_percent?: number | null;
  current_price?: number | null;
  product_name?: string;
  suggested_price?: number;
  status: 'matched' | 'unmatched' | 'suggested' | 'error' | 'large_change';
}

export interface ImportPreview {
  file_name?: string;
  supplier_id?: string | null;
  supplier_name?: string | null;
  total_rows?: number;
  total_items?: number;
  matched_count?: number;
  unmatched_count?: number;
  error_count?: number;
  large_change_count?: number;
  items: ExtractedPrice[];
}
