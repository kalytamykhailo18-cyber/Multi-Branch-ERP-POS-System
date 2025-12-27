import { get, post, put, del } from './client';
import type { ApiResponse, PaginatedResponse, PaymentMethod, SalePayment, UUID } from '../../types';

export const paymentService = {
  /**
   * Get all payment methods
   */
  getMethods: (params?: {
    is_active?: boolean;
  }): Promise<ApiResponse<PaymentMethod[]>> => {
    return get<PaymentMethod[]>('/payments/methods', params);
  },

  /**
   * Get payment method by ID
   */
  getMethodById: (id: UUID): Promise<ApiResponse<PaymentMethod>> => {
    return get<PaymentMethod>(`/payments/methods/${id}`);
  },

  /**
   * Create payment method
   */
  createMethod: (data: Partial<PaymentMethod>): Promise<ApiResponse<PaymentMethod>> => {
    return post<PaymentMethod>('/payments/methods', data);
  },

  /**
   * Update payment method
   */
  updateMethod: (id: UUID, data: Partial<PaymentMethod>): Promise<ApiResponse<PaymentMethod>> => {
    return put<PaymentMethod>(`/payments/methods/${id}`, data);
  },

  /**
   * Deactivate payment method
   */
  deactivateMethod: (id: UUID): Promise<ApiResponse<null>> => {
    return del<null>(`/payments/methods/${id}`);
  },

  /**
   * Reorder payment methods
   */
  reorderMethods: (order: Array<{ id: UUID; sort_order: number }>): Promise<ApiResponse<PaymentMethod[]>> => {
    return post<PaymentMethod[]>('/payments/methods/reorder', { order });
  },

  /**
   * Get payments with filters
   */
  getPayments: (params?: {
    branch_id?: UUID;
    payment_method_id?: UUID;
    start_date?: string;
    end_date?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<SalePayment>> => {
    return get<SalePayment[]>('/payments', params) as Promise<PaginatedResponse<SalePayment>>;
  },

  /**
   * Get payment by ID
   */
  getPaymentById: (id: UUID): Promise<ApiResponse<SalePayment>> => {
    return get<SalePayment>(`/payments/${id}`);
  },

  /**
   * Get payment summary
   */
  getPaymentSummary: (params?: {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    by_method: Array<{
      payment_method_id: UUID;
      payment_method: PaymentMethod;
      transaction_count: number;
      total_amount: number;
    }>;
    totals: {
      total_transactions: number;
      total_amount: number;
    };
  }>> => {
    return get('/payments/summary', params);
  },

  /**
   * Get daily cash flow
   */
  getDailyCashFlow: (params?: {
    branch_id?: UUID;
    date?: string;
  }): Promise<ApiResponse<{
    date: string;
    cash_in: number;
    cash_out: number;
    net_cash: number;
  }>> => {
    return get('/payments/cash-flow', params);
  },
};

export default paymentService;
