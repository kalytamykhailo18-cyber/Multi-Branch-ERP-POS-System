import { get, post, put, del } from './client';
import type { ApiResponse, PaginatedResponse, Product, POSProduct, UUID, BranchStock } from '../../types';

export const productService = {
  /**
   * Get all products with pagination and filters
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category_id?: UUID;
    is_active?: boolean;
    is_weighable?: boolean;
  }): Promise<PaginatedResponse<Product>> => {
    return get<Product[]>('/products', params) as Promise<PaginatedResponse<Product>>;
  },

  /**
   * Get products optimized for POS (with stock info)
   */
  getForPOS: (params: {
    branch_id: UUID;
    category_id?: UUID;
    search?: string;
  }): Promise<ApiResponse<POSProduct[]>> => {
    return get<POSProduct[]>('/products/pos', params);
  },

  /**
   * Get product by barcode
   */
  getByBarcode: (barcode: string): Promise<ApiResponse<Product>> => {
    return get<Product>(`/products/barcode/${barcode}`);
  },

  /**
   * Get product by ID
   */
  getById: (id: UUID): Promise<ApiResponse<Product>> => {
    return get<Product>(`/products/${id}`);
  },

  /**
   * Create new product
   */
  create: (data: Partial<Product>): Promise<ApiResponse<Product>> => {
    return post<Product>('/products', data);
  },

  /**
   * Update product
   */
  update: (id: UUID, data: Partial<Product>): Promise<ApiResponse<Product>> => {
    return put<Product>(`/products/${id}`, data);
  },

  /**
   * Deactivate product
   */
  deactivate: (id: UUID): Promise<ApiResponse<null>> => {
    return del<null>(`/products/${id}`);
  },

  /**
   * Get product stock across branches
   */
  getStock: (productId: UUID): Promise<ApiResponse<BranchStock[]>> => {
    return get<BranchStock[]>(`/products/${productId}/stock`);
  },

  /**
   * Get product price history
   */
  getPriceHistory: (productId: UUID, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<{
    id: string;
    cost_price: number;
    selling_price: number;
    margin_percent: number;
    changed_by: string;
    change_reason: string;
    created_at: string;
  }>> => {
    return get(`/products/${productId}/price-history`, params) as Promise<PaginatedResponse<{
      id: string;
      cost_price: number;
      selling_price: number;
      margin_percent: number;
      changed_by: string;
      change_reason: string;
      created_at: string;
    }>>;
  },

  /**
   * Update product prices (with history tracking)
   */
  updatePrices: (productId: UUID, data: {
    cost_price?: number;
    selling_price?: number;
    reason?: string;
  }): Promise<ApiResponse<Product>> => {
    return put<Product>(`/products/${productId}/prices`, data);
  },
};

export default productService;
