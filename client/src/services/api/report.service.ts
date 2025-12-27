import { get } from './client';
import type { ApiResponse, DailyReportData, OwnerDashboardData, UUID } from '../../types';

export const reportService = {
  /**
   * Get daily report for a branch
   */
  getDailyReport: (branchId: UUID, date?: string): Promise<ApiResponse<DailyReportData>> => {
    return get<DailyReportData>('/reports/daily', { branch_id: branchId, date });
  },

  /**
   * Get owner dashboard (multi-branch overview)
   */
  getOwnerDashboard: (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<OwnerDashboardData>> => {
    return get<OwnerDashboardData>('/reports/owner-dashboard', params);
  },

  /**
   * Get sales report
   */
  getSalesReport: (params?: {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
    group_by?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<ApiResponse<{
    period: { start_date: string; end_date: string };
    group_by: string;
    data: Array<{
      period: string;
      sales_count: number;
      revenue: number;
      tax: number;
      discounts: number;
      avg_ticket: number;
    }>;
    totals: {
      total_sales: number;
      total_revenue: number;
      total_tax: number;
      total_discounts: number;
      average_ticket: number;
    };
  }>> => {
    return get('/reports/sales', params);
  },

  /**
   * Get product performance report
   */
  getProductReport: (params?: {
    branch_id?: UUID;
    category_id?: UUID;
    start_date?: string;
    end_date?: string;
    limit?: number;
  }): Promise<ApiResponse<{
    period: { start_date: string; end_date: string };
    products: Array<{
      product_id: UUID;
      name: string;
      sku: string;
      category: string;
      total_quantity: number;
      total_revenue: number;
      transaction_count: number;
      avg_price: number;
      margin_percent: string;
    }>;
  }>> => {
    return get('/reports/products', params);
  },

  /**
   * Get cashier performance report
   */
  getCashierReport: (params?: {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<{
    period: { start_date: string; end_date: string };
    cashiers: Array<{
      cashier_id: UUID;
      name: string;
      total_sales: number;
      total_revenue: number;
      average_ticket: number;
      total_sessions: number;
      total_discrepancy: number;
      avg_session_hours: number;
    }>;
  }>> => {
    return get('/reports/cashiers', params);
  },

  /**
   * Get inventory report
   */
  getInventoryReport: (params?: {
    branch_id?: UUID;
    category_id?: UUID;
    low_stock_only?: boolean;
  }): Promise<ApiResponse<{
    inventory: Array<{
      branch: string;
      branch_code: string;
      product: string;
      sku: string;
      category: string;
      quantity: number;
      min_stock: number;
      max_stock: number;
      cost_value: number;
      retail_value: number;
      is_low: boolean;
    }>;
    summary: {
      total_items: number;
      total_cost_value: number;
      total_retail_value: number;
      low_stock_count: number;
    };
  }>> => {
    return get('/reports/inventory', params);
  },
};

export default reportService;
