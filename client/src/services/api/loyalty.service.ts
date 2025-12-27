import { get, post, put } from './client';
import type { ApiResponse, PaginatedResponse, UUID } from '../../types';

// Loyalty-related types (matches Customer model with loyalty fields from database schema)
export interface LoyaltyAccount {
  id: UUID;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  loyalty_points: number;
  loyalty_tier: 'STANDARD' | 'SILVER' | 'GOLD' | 'PLATINUM';
  qr_code: string;
  credit_balance: number;
  is_active: boolean;
  created_at: string;
}

export interface PointsTransaction {
  id: UUID;
  loyalty_account_id: UUID;
  customer_name: string;
  transaction_type: 'EARN' | 'REDEEM' | 'ADJUSTMENT' | 'EXPIRY';
  points: number;
  balance_after: number;
  sale_id?: UUID;
  sale_total?: number;
  branch_id?: UUID;
  branch_name?: string;
  user_id?: UUID;
  user_name?: string;
  reason?: string;
  created_at: string;
}

export interface CreditTransaction {
  id: UUID;
  loyalty_account_id: UUID;
  customer_name: string;
  transaction_type: 'CREDIT_GIVEN' | 'CREDIT_USED' | 'ADJUSTMENT' | 'EXPIRY';
  amount: number;
  balance_after: number;
  sale_id?: UUID;
  branch_id?: UUID;
  branch_name?: string;
  user_id?: UUID;
  user_name?: string;
  reason?: string;
  created_at: string;
}

export interface LoyaltyConfig {
  id: UUID;
  points_per_peso: number;
  peso_per_point_redemption: number;
  minimum_points_to_redeem: number;
  points_expiry_days: number;
  credit_expiry_days: number;
  min_change_for_credit: number;
  tier_thresholds: {
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
  };
  tier_multipliers: {
    BRONZE: number;
    SILVER: number;
    GOLD: number;
    PLATINUM: number;
  };
  is_active: boolean;
  updated_at: string;
}

export const loyaltyService = {
  /**
   * Get all loyalty accounts
   */
  getAccounts: (params?: {
    search?: string;
    tier?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<LoyaltyAccount>> => {
    return get<LoyaltyAccount[]>('/loyalty/accounts', params) as Promise<PaginatedResponse<LoyaltyAccount>>;
  },

  /**
   * Get loyalty account by ID
   */
  getAccount: (accountId: UUID): Promise<ApiResponse<LoyaltyAccount>> => {
    return get<LoyaltyAccount>(`/loyalty/accounts/${accountId}`);
  },

  /**
   * Get loyalty account by customer ID
   */
  getAccountByCustomer: (customerId: UUID): Promise<ApiResponse<LoyaltyAccount>> => {
    return get<LoyaltyAccount>(`/loyalty/customer/${customerId}`);
  },

  /**
   * Get loyalty account by QR code
   */
  getAccountByQR: (qrCode: string): Promise<ApiResponse<LoyaltyAccount>> => {
    return get<LoyaltyAccount>(`/loyalty/qr/${qrCode}`);
  },

  /**
   * Create loyalty account for customer
   */
  createAccount: (customerId: UUID): Promise<ApiResponse<LoyaltyAccount>> => {
    return post<LoyaltyAccount>('/loyalty/accounts', { customer_id: customerId });
  },

  /**
   * Earn points from sale
   */
  earnPoints: (data: {
    loyalty_account_id: UUID;
    sale_id: UUID;
    sale_total: number;
    branch_id: UUID;
  }): Promise<ApiResponse<PointsTransaction>> => {
    return post<PointsTransaction>('/loyalty/points/earn', data);
  },

  /**
   * Redeem points
   */
  redeemPoints: (data: {
    loyalty_account_id: UUID;
    points: number;
    sale_id?: UUID;
    branch_id: UUID;
  }): Promise<ApiResponse<{
    transaction: PointsTransaction;
    discount_amount: number;
  }>> => {
    return post('/loyalty/points/redeem', data);
  },

  /**
   * Adjust points (manual adjustment)
   */
  adjustPoints: (data: {
    loyalty_account_id: UUID;
    points: number;
    reason: string;
  }): Promise<ApiResponse<PointsTransaction>> => {
    return post<PointsTransaction>('/loyalty/points/adjust', data);
  },

  /**
   * Get points transactions
   */
  getPointsTransactions: (params?: {
    loyalty_account_id?: UUID;
    transaction_type?: string;
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<PointsTransaction>> => {
    return get<PointsTransaction[]>('/loyalty/points/transactions', params) as Promise<PaginatedResponse<PointsTransaction>>;
  },

  /**
   * Give credit (change as credit)
   */
  giveCredit: (data: {
    loyalty_account_id: UUID;
    amount: number;
    sale_id?: UUID;
    branch_id: UUID;
    reason?: string;
  }): Promise<ApiResponse<CreditTransaction>> => {
    return post<CreditTransaction>('/loyalty/credit/give', data);
  },

  /**
   * Use credit
   */
  useCredit: (data: {
    loyalty_account_id: UUID;
    amount: number;
    sale_id?: UUID;
    branch_id: UUID;
  }): Promise<ApiResponse<CreditTransaction>> => {
    return post<CreditTransaction>('/loyalty/credit/use', data);
  },

  /**
   * Adjust credit (manual adjustment)
   */
  adjustCredit: (data: {
    loyalty_account_id: UUID;
    amount: number;
    reason: string;
  }): Promise<ApiResponse<CreditTransaction>> => {
    return post<CreditTransaction>('/loyalty/credit/adjust', data);
  },

  /**
   * Get credit transactions
   */
  getCreditTransactions: (params?: {
    loyalty_account_id?: UUID;
    transaction_type?: string;
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<CreditTransaction>> => {
    return get<CreditTransaction[]>('/loyalty/credit/transactions', params) as Promise<PaginatedResponse<CreditTransaction>>;
  },

  /**
   * Get loyalty configuration
   */
  getConfig: (): Promise<ApiResponse<LoyaltyConfig>> => {
    return get<LoyaltyConfig>('/loyalty/config');
  },

  /**
   * Update loyalty configuration
   */
  updateConfig: (data: Partial<LoyaltyConfig>): Promise<ApiResponse<LoyaltyConfig>> => {
    return put<LoyaltyConfig>('/loyalty/config', data);
  },

  /**
   * Generate new QR code for account
   */
  regenerateQR: (accountId: UUID): Promise<ApiResponse<{ qr_code: string }>> => {
    return post(`/loyalty/accounts/${accountId}/regenerate-qr`);
  },

  /**
   * Get loyalty summary/stats
   */
  getSummary: (params?: {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    total_accounts: number;
    active_accounts: number;
    total_points_issued: number;
    total_points_redeemed: number;
    total_credit_given: number;
    total_credit_used: number;
    by_tier: Array<{ tier: string; count: number }>;
    recent_transactions: Array<PointsTransaction | CreditTransaction>;
  }>> => {
    return get('/loyalty/summary', params);
  },

  /**
   * Calculate points for a purchase amount
   */
  calculatePoints: (amount: number, tier?: string): Promise<ApiResponse<{
    points_to_earn: number;
    multiplier: number;
  }>> => {
    return get('/loyalty/calculate-points', { amount, tier });
  },

  /**
   * Calculate redemption value
   */
  calculateRedemptionValue: (points: number): Promise<ApiResponse<{
    discount_amount: number;
    peso_per_point: number;
  }>> => {
    return get('/loyalty/calculate-redemption', { points });
  },

  /**
   * Deactivate loyalty account
   */
  deactivateAccount: (accountId: UUID): Promise<ApiResponse<LoyaltyAccount>> => {
    return put<LoyaltyAccount>(`/loyalty/accounts/${accountId}/deactivate`);
  },

  /**
   * Reactivate loyalty account
   */
  reactivateAccount: (accountId: UUID): Promise<ApiResponse<LoyaltyAccount>> => {
    return put<LoyaltyAccount>(`/loyalty/accounts/${accountId}/reactivate`);
  },
};

export default loyaltyService;
