import { get, post } from './client';
import type { ApiResponse, PaginatedResponse, UUID } from '../../types';

// Stock-related types matching database schema
export interface StockItem {
  id: UUID;
  product_id: UUID;
  product_name: string;
  product_sku: string;
  branch_id: UUID;
  branch_name: string;
  quantity: number;
  reserved_quantity: number;
  expected_shrinkage: number;
  actual_shrinkage: number;
  last_counted_at: string | null;
  last_counted_quantity: number | null;
  updated_at: string;
}

export interface StockMovement {
  id: UUID;
  product_id: UUID;
  product_name: string;
  product_sku: string;
  branch_id: UUID;
  branch_name: string;
  movement_type: 'SALE' | 'RETURN' | 'PURCHASE' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'ADJUSTMENT_PLUS' | 'ADJUSTMENT_MINUS' | 'SHRINKAGE' | 'INITIAL' | 'INVENTORY_COUNT';
  quantity: number;
  quantity_before: number;
  quantity_after: number;
  reference_type?: string;
  reference_id?: UUID;
  adjustment_reason?: string;
  related_branch_id?: UUID;
  performed_by?: UUID;
  performed_by_name?: string;
  notes?: string;
  created_at: string;
}

export interface StockAdjustment {
  product_id: UUID;
  branch_id: UUID;
  quantity: number;
  reason: string;
  notes?: string;
}

export const stockService = {
  /**
   * Get stock for a branch with filters
   */
  getByBranch: (branchId: UUID, params?: {
    search?: string;
    low_stock?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StockItem>> => {
    return get<StockItem[]>(`/stock/branch/${branchId}`, params) as Promise<PaginatedResponse<StockItem>>;
  },

  /**
   * Get stock for a specific product across all branches
   */
  getByProduct: (productId: UUID): Promise<ApiResponse<StockItem[]>> => {
    return get<StockItem[]>(`/stock/product/${productId}`);
  },

  /**
   * Get low stock items
   */
  getLowStock: (branchId?: UUID): Promise<ApiResponse<StockItem[]>> => {
    return get<StockItem[]>('/stock/low-stock', branchId ? { branch_id: branchId } : undefined);
  },

  /**
   * Get stock movements
   */
  getMovements: (params: {
    branch_id?: UUID;
    product_id?: UUID;
    movement_type?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<StockMovement>> => {
    return get<StockMovement[]>('/stock/movements', params) as Promise<PaginatedResponse<StockMovement>>;
  },

  /**
   * Adjust stock
   */
  adjust: (data: StockAdjustment): Promise<ApiResponse<{ stock: any; movement: StockMovement }>> => {
    return post('/stock/adjust', data);
  },

  /**
   * Record shrinkage
   */
  recordShrinkage: (data: {
    product_id: UUID;
    branch_id: UUID;
    quantity: number;
    reason?: string;
    notes?: string;
  }): Promise<ApiResponse<StockMovement>> => {
    return post<StockMovement>('/stock/shrinkage', data);
  },

};

export default stockService;
