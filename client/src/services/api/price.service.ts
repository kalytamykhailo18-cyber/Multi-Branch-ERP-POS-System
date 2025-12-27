import { get, post, put, del } from './client';
import type { ApiResponse, PaginatedResponse, UUID } from '../../types';

// Price import related types
export interface PriceImportItem {
  id: UUID;
  supplier_code: string;
  description: string;
  cost_price: number;
  matched_product_id?: UUID;
  matched_product_name?: string;
  matched_product_sku?: string;
  current_cost_price?: number;
  current_sell_price?: number;
  suggested_sell_price: number;
  price_change_percentage: number;
  confidence_score: number;
  match_status: 'MATCHED' | 'SUGGESTED' | 'NOT_FOUND' | 'MANUAL';
  validation_errors: string[];
  is_selected: boolean;
}

export interface PriceImportBatch {
  id: UUID;
  supplier_id?: UUID;
  supplier_name?: string;
  file_name: string;
  file_type: 'PDF' | 'EXCEL' | 'CSV';
  status: 'PENDING' | 'PROCESSING' | 'READY' | 'APPLIED' | 'CANCELLED';
  total_items: number;
  matched_items: number;
  unmatched_items: number;
  applied_items?: number;
  margin_percentage: number;
  rounding_rule: 'NONE' | 'UP' | 'DOWN' | 'NEAREST';
  rounding_value: number;
  uploaded_by: UUID;
  uploaded_by_name: string;
  applied_by?: UUID;
  applied_by_name?: string;
  created_at: string;
  applied_at?: string;
}

export interface PriceHistory {
  id: UUID;
  product_id: UUID;
  product_name: string;
  product_sku: string;
  old_cost_price: number;
  new_cost_price: number;
  old_sell_price: number;
  new_sell_price: number;
  change_type: 'IMPORT' | 'MANUAL' | 'BULK';
  import_batch_id?: UUID;
  user_id: UUID;
  user_name: string;
  reason?: string;
  created_at: string;
}

export interface Supplier {
  id: UUID;
  name: string;
  code: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  default_margin: number;
  price_list_format?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const priceService = {
  /**
   * Upload file for OCR processing
   */
  uploadFile: (formData: FormData, onProgress?: (progress: number) => void): Promise<ApiResponse<PriceImportBatch>> => {
    return post<PriceImportBatch>('/prices/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress ? (event: any) => {
        if (event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      } : undefined,
    });
  },

  /**
   * Get import batch details
   */
  getBatch: (batchId: UUID): Promise<ApiResponse<PriceImportBatch>> => {
    return get<PriceImportBatch>(`/prices/batch/${batchId}`);
  },

  /**
   * Get import batch items
   */
  getBatchItems: (batchId: UUID, params?: {
    match_status?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<PriceImportItem>> => {
    return get<PriceImportItem[]>(`/prices/batch/${batchId}/items`, params) as Promise<PaginatedResponse<PriceImportItem>>;
  },

  /**
   * Get all import batches
   */
  getBatches: (params?: {
    status?: string;
    supplier_id?: UUID;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<PriceImportBatch>> => {
    return get<PriceImportBatch[]>('/prices/batches', params) as Promise<PaginatedResponse<PriceImportBatch>>;
  },

  /**
   * Update batch configuration (margin, rounding)
   */
  updateBatchConfig: (batchId: UUID, data: {
    margin_percentage?: number;
    rounding_rule?: 'NONE' | 'UP' | 'DOWN' | 'NEAREST';
    rounding_value?: number;
  }): Promise<ApiResponse<PriceImportBatch>> => {
    return put<PriceImportBatch>(`/prices/batch/${batchId}/config`, data);
  },

  /**
   * Match import item to a product
   */
  matchItem: (itemId: UUID, productId: UUID): Promise<ApiResponse<PriceImportItem>> => {
    return put<PriceImportItem>(`/prices/item/${itemId}/match`, { product_id: productId });
  },

  /**
   * Toggle item selection
   */
  toggleItemSelection: (itemId: UUID, selected: boolean): Promise<ApiResponse<PriceImportItem>> => {
    return put<PriceImportItem>(`/prices/item/${itemId}/select`, { is_selected: selected });
  },

  /**
   * Select/deselect all items in batch
   */
  selectAllItems: (batchId: UUID, selected: boolean, filters?: {
    match_status?: string;
  }): Promise<ApiResponse<{ updated_count: number }>> => {
    return put(`/prices/batch/${batchId}/select-all`, {
      is_selected: selected,
      ...filters,
    });
  },

  /**
   * Recalculate prices with new margin/rounding
   */
  recalculate: (batchId: UUID): Promise<ApiResponse<PriceImportBatch>> => {
    return post<PriceImportBatch>(`/prices/batch/${batchId}/recalculate`);
  },

  /**
   * Apply selected price changes
   */
  apply: (batchId: UUID): Promise<ApiResponse<{
    batch: PriceImportBatch;
    applied_count: number;
    skipped_count: number;
  }>> => {
    return post(`/prices/batch/${batchId}/apply`);
  },

  /**
   * Cancel/discard import batch
   */
  cancel: (batchId: UUID): Promise<ApiResponse<null>> => {
    return del<null>(`/prices/batch/${batchId}`);
  },

  /**
   * Revert applied prices
   */
  revert: (batchId: UUID): Promise<ApiResponse<{
    reverted_count: number;
  }>> => {
    return post(`/prices/batch/${batchId}/revert`);
  },

  /**
   * Get price history
   */
  getHistory: (params?: {
    product_id?: UUID;
    import_batch_id?: UUID;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<PriceHistory>> => {
    return get<PriceHistory[]>('/prices/history', params) as Promise<PaginatedResponse<PriceHistory>>;
  },

  /**
   * Get suppliers
   */
  getSuppliers: (params?: {
    search?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Supplier>> => {
    return get<Supplier[]>('/suppliers', params) as Promise<PaginatedResponse<Supplier>>;
  },

  /**
   * Create supplier
   */
  createSupplier: (data: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<Supplier>> => {
    return post<Supplier>('/suppliers', data);
  },

  /**
   * Update supplier
   */
  updateSupplier: (supplierId: UUID, data: Partial<Supplier>): Promise<ApiResponse<Supplier>> => {
    return put<Supplier>(`/suppliers/${supplierId}`, data);
  },

  /**
   * Delete supplier
   */
  deleteSupplier: (supplierId: UUID): Promise<ApiResponse<null>> => {
    return del<null>(`/suppliers/${supplierId}`);
  },

  /**
   * Get OCR extraction preview
   */
  previewOCR: (formData: FormData): Promise<ApiResponse<{
    extracted_text: string;
    detected_items: Array<{
      line: number;
      raw_text: string;
      supplier_code?: string;
      description?: string;
      price?: number;
    }>;
  }>> => {
    return post('/prices/preview-ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default priceService;
