import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getDashboardData } from '../../services/dashboardService';

interface BranchSale {
  branch_id: string;
  total_sales: string;
  total_revenue: string;
  branch: {
    name: string;
    code: string;
  };
}

interface DailyTrend {
  date: string;
  sales_count: number;
  revenue: number;
}

interface Discrepancy {
  branch_id: string;
  count: string;
  total_discrepancy: string;
  branch: {
    name: string;
    code: string;
  };
}

interface TopProduct {
  product_id: string;
  total_quantity: string;
  total_revenue: string;
  product: {
    name: string;
    sku: string;
  };
}

interface DashboardData {
  period: {
    start_date: Date;
    end_date: Date;
  };
  branches: number;
  overall: {
    total_sales: number;
    total_revenue: number;
    average_ticket: number;
  };
  by_branch: BranchSale[];
  daily_trend: DailyTrend[];
  discrepancies: Discrepancy[];
  shrinkage: {
    total_records: number;
    total_cost_loss: number;
  };
  top_products: TopProduct[];
}

interface DashboardState {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null
};

export const fetchOwnerDashboard = createAsyncThunk(
  'dashboard/fetchOwnerDashboard',
  async (params: { start_date: string; end_date: string }) => {
    const response = await getDashboardData(params);
    return response;
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearDashboard: (state) => {
      state.data = null;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOwnerDashboard.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOwnerDashboard.fulfilled, (state, action: PayloadAction<DashboardData>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchOwnerDashboard.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Error al cargar el dashboard';
      });
  }
});

export const { clearDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;
