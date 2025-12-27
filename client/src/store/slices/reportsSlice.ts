import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { DailyReportData, OwnerDashboardData, UUID } from '../../types';
import { reportService } from '../../services/api';
import { startLoading, stopLoading } from './uiSlice';

interface ReportsState {
  // Daily Report
  dailyReport: DailyReportData | null;
  dailyReportDate: string | null;

  // Owner Dashboard
  ownerDashboard: OwnerDashboardData | null;

  // Reports
  salesReport: any | null;
  productReport: any | null;
  cashierReport: any | null;
  inventoryReport: any | null;

  // Report filters
  filters: {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
  };

  loading: boolean;
  error: string | null;
}

const initialState: ReportsState = {
  dailyReport: null,
  dailyReportDate: null,
  ownerDashboard: null,
  salesReport: null,
  productReport: null,
  cashierReport: null,
  inventoryReport: null,
  filters: {},
  loading: false,
  error: null,
};

// Async Thunks
export const loadDailyReport = createAsyncThunk<
  DailyReportData,
  { branch_id: UUID; date?: string },
  { rejectValue: string }
>(
  'reports/loadDailyReport',
  async ({ branch_id, date }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Cargando reporte...'));
      const response = await reportService.getDailyReport(branch_id, date);

      if (!response.success) {
        throw new Error('Failed to load daily report');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading daily report');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadOwnerDashboard = createAsyncThunk<
  OwnerDashboardData,
  { start_date?: string; end_date?: string } | void,
  { rejectValue: string }
>(
  'reports/loadOwnerDashboard',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Cargando dashboard...'));
      const response = await reportService.getOwnerDashboard(params || {});

      if (!response.success) {
        throw new Error('Failed to load owner dashboard');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading dashboard');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadSalesReport = createAsyncThunk<
  {
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
  },
  {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
    group_by?: 'hour' | 'day' | 'week' | 'month';
  },
  { rejectValue: string }
>(
  'reports/loadSalesReport',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await reportService.getSalesReport(params);

      if (!response.success) {
        throw new Error('Failed to load sales report');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading sales report');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadProductReport = createAsyncThunk<
  {
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
  },
  {
    branch_id?: UUID;
    category_id?: UUID;
    start_date?: string;
    end_date?: string;
    limit?: number;
  },
  { rejectValue: string }
>(
  'reports/loadProductReport',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await reportService.getProductReport(params);

      if (!response.success) {
        throw new Error('Failed to load product report');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading product report');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadCashierReport = createAsyncThunk<
  {
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
  },
  {
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
  },
  { rejectValue: string }
>(
  'reports/loadCashierReport',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await reportService.getCashierReport(params);

      if (!response.success) {
        throw new Error('Failed to load cashier report');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading cashier report');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadInventoryReport = createAsyncThunk<
  {
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
  },
  {
    branch_id?: UUID;
    category_id?: UUID;
    low_stock_only?: boolean;
  },
  { rejectValue: string }
>(
  'reports/loadInventoryReport',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await reportService.getInventoryReport(params);

      if (!response.success) {
        throw new Error('Failed to load inventory report');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading inventory report');
    } finally {
      dispatch(stopLoading());
    }
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<ReportsState['filters']>) => {
      state.filters = action.payload;
    },

    clearFilters: (state) => {
      state.filters = {};
    },

    setDailyReportDate: (state, action: PayloadAction<string>) => {
      state.dailyReportDate = action.payload;
    },

    clearReports: (state) => {
      state.dailyReport = null;
      state.ownerDashboard = null;
      state.salesReport = null;
      state.productReport = null;
      state.cashierReport = null;
      state.inventoryReport = null;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Load Daily Report
    builder
      .addCase(loadDailyReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDailyReport.fulfilled, (state, action) => {
        state.dailyReport = action.payload;
        state.dailyReportDate = action.payload.report_date;
        state.loading = false;
      })
      .addCase(loadDailyReport.rejected, (state, action) => {
        state.error = action.payload || 'Error loading report';
        state.loading = false;
      });

    // Load Owner Dashboard
    builder
      .addCase(loadOwnerDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadOwnerDashboard.fulfilled, (state, action) => {
        state.ownerDashboard = action.payload;
        state.loading = false;
      })
      .addCase(loadOwnerDashboard.rejected, (state, action) => {
        state.error = action.payload || 'Error loading dashboard';
        state.loading = false;
      });

    // Sales Report
    builder.addCase(loadSalesReport.fulfilled, (state, action) => {
      state.salesReport = action.payload;
      state.loading = false;
    });

    // Product Report
    builder.addCase(loadProductReport.fulfilled, (state, action) => {
      state.productReport = action.payload;
      state.loading = false;
    });

    // Cashier Report
    builder.addCase(loadCashierReport.fulfilled, (state, action) => {
      state.cashierReport = action.payload;
      state.loading = false;
    });

    // Inventory Report
    builder.addCase(loadInventoryReport.fulfilled, (state, action) => {
      state.inventoryReport = action.payload;
      state.loading = false;
    });
  },
});

export const fetchSalesReport = loadSalesReport;
export const fetchProductReport = loadProductReport;
export const fetchCashierReport = loadCashierReport;
export const fetchInventoryReport = loadInventoryReport;

export const {
  setFilters,
  clearFilters,
  setDailyReportDate,
  clearReports,
  clearError,
} = reportsSlice.actions;

export default reportsSlice.reducer;
