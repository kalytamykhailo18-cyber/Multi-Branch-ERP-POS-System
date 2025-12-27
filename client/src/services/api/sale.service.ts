import { get, post } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Sale,
  SaleItem,
  UUID,
} from '../../types';

interface CreateSalePayload {
  branch_id: UUID;
  register_id: UUID;
  session_id: UUID;
  customer_id?: UUID;
  items: Array<{
    product_id: UUID;
    quantity: number;
    unit_price?: number;
    discount_percent?: number;
  }>;
  payments: Array<{
    payment_method_id: UUID;
    amount: number;
    reference_number?: string;
  }>;
  discount_type?: 'PERCENT' | 'FIXED';
  discount_value?: number;
  notes?: string;
  local_id?: string; // For offline sync
}

interface SaleReceipt {
  sale_number: string;
  date: string;
  branch: {
    name: string;
    address?: string;
    phone?: string;
  };
  cashier: string;
  customer: {
    name: string;
    document?: string;
  } | null;
  items: Array<{
    name: string;
    sku: string;
    quantity: number;
    unit_price: number;
    discount: number;
    total: number;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payments: Array<{
    method: string;
    amount: number;
  }>;
  paid: number;
  change: number;
  status: string;
}

export const saleService = {
  /**
   * Get all sales with pagination and filters
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    branch_id?: UUID;
    session_id?: UUID;
    customer_id?: UUID;
    status?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<PaginatedResponse<Sale>> => {
    return get<Sale[]>('/sales', params) as Promise<PaginatedResponse<Sale>>;
  },

  /**
   * Get sale by ID
   */
  getById: (id: UUID): Promise<ApiResponse<Sale>> => {
    return get<Sale>(`/sales/${id}`);
  },

  /**
   * Get sale by sale number
   */
  getBySaleNumber: (saleNumber: string): Promise<ApiResponse<Sale>> => {
    return get<Sale>(`/sales/number/${saleNumber}`);
  },

  /**
   * Create new sale
   */
  create: (data: CreateSalePayload): Promise<ApiResponse<Sale>> => {
    return post<Sale>('/sales', data);
  },

  /**
   * Void sale
   */
  void: (id: UUID, reason: string): Promise<ApiResponse<Sale>> => {
    return post<Sale>(`/sales/${id}/void`, { reason });
  },

  /**
   * Get sale receipt data (for printing)
   */
  getReceipt: (id: UUID): Promise<ApiResponse<SaleReceipt>> => {
    return get<SaleReceipt>(`/sales/${id}/receipt`);
  },

  /**
   * Get sale items
   */
  getItems: (saleId: UUID): Promise<ApiResponse<SaleItem[]>> => {
    return get<SaleItem[]>(`/sales/${saleId}/items`);
  },

  /**
   * Redeem loyalty points on sale
   */
  redeemLoyaltyPoints: (saleId: UUID, points: number): Promise<ApiResponse<{
    points_redeemed: number;
    new_balance: number;
  }>> => {
    return post<{ points_redeemed: number; new_balance: number }>(
      `/sales/${saleId}/redeem-points`,
      { points }
    );
  },

  /**
   * Use customer credit on sale
   */
  useCredit: (saleId: UUID, amount: number): Promise<ApiResponse<{
    credit_used: number;
    new_balance: number;
  }>> => {
    return post<{ credit_used: number; new_balance: number }>(
      `/sales/${saleId}/use-credit`,
      { amount }
    );
  },
};

export default saleService;
