import { get, post, put, del } from './client';
import type {
  ApiResponse,
  PaginatedResponse,
  Customer,
  QuickSearchCustomer,
  UUID,
  LoyaltyTransaction,
  CreditTransaction,
  Sale,
} from '../../types';

export const customerService = {
  /**
   * Get all customers with pagination and filters
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    is_wholesale?: boolean;
    is_active?: boolean;
    loyalty_tier?: string;
    has_credit?: boolean;
  }): Promise<PaginatedResponse<Customer>> => {
    return get<Customer[]>('/customers', params) as Promise<PaginatedResponse<Customer>>;
  },

  /**
   * Quick search customers for POS (by phone, QR code, document)
   */
  quickSearch: (query: string): Promise<ApiResponse<QuickSearchCustomer[]>> => {
    return get<QuickSearchCustomer[]>('/customers/quick-search', { q: query });
  },

  /**
   * Get customer by QR code
   */
  getByQRCode: (qrCode: string): Promise<ApiResponse<Customer>> => {
    return get<Customer>(`/customers/qr/${qrCode}`);
  },

  /**
   * Get customer by ID
   */
  getById: (id: UUID): Promise<ApiResponse<Customer>> => {
    return get<Customer>(`/customers/${id}`);
  },

  /**
   * Create new customer
   */
  create: (data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    return post<Customer>('/customers', data);
  },

  /**
   * Update customer
   */
  update: (id: UUID, data: Partial<Customer>): Promise<ApiResponse<Customer>> => {
    return put<Customer>(`/customers/${id}`, data);
  },

  /**
   * Deactivate customer
   */
  deactivate: (id: UUID): Promise<ApiResponse<null>> => {
    return del<null>(`/customers/${id}`);
  },

  /**
   * Get customer loyalty transactions
   */
  getLoyaltyTransactions: (customerId: UUID, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<LoyaltyTransaction>> => {
    return get<LoyaltyTransaction[]>(
      `/customers/${customerId}/loyalty`,
      params
    ) as Promise<PaginatedResponse<LoyaltyTransaction>>;
  },

  /**
   * Add loyalty points (manual adjustment)
   */
  addLoyaltyPoints: (
    customerId: UUID,
    points: number,
    description?: string
  ): Promise<ApiResponse<{ transaction: LoyaltyTransaction; new_balance: number }>> => {
    return post<{ transaction: LoyaltyTransaction; new_balance: number }>(
      `/customers/${customerId}/loyalty`,
      { points, description }
    );
  },

  /**
   * Get customer credit transactions
   */
  getCreditTransactions: (customerId: UUID, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<CreditTransaction>> => {
    return get<CreditTransaction[]>(
      `/customers/${customerId}/credit`,
      params
    ) as Promise<PaginatedResponse<CreditTransaction>>;
  },

  /**
   * Add credit (manual adjustment)
   */
  addCredit: (
    customerId: UUID,
    amount: number,
    description?: string
  ): Promise<ApiResponse<{ transaction: CreditTransaction; new_balance: number }>> => {
    return post<{ transaction: CreditTransaction; new_balance: number }>(
      `/customers/${customerId}/credit`,
      { amount, description }
    );
  },

  /**
   * Get customer sales history
   */
  getSalesHistory: (customerId: UUID, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Sale>> => {
    return get<Sale[]>(
      `/customers/${customerId}/sales`,
      params
    ) as Promise<PaginatedResponse<Sale>>;
  },
};

export default customerService;
