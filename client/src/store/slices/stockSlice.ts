import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { UUID } from '../../types';
import { stockService, StockItem, StockMovement, StockAdjustment } from '../../services/api/stock.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface StockState {
  items: StockItem[];
  movements: StockMovement[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: StockState = {
  items: [],
  movements: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

// Async Thunks
export const fetchBranchStock = createAsyncThunk<
  { items: StockItem[]; total: number },
  {
    branchId: UUID;
    search?: string;
    low_stock?: boolean;
    page?: number;
    limit?: number;
  },
  { rejectValue: string }
>(
  'stock/fetchBranchStock',
  async ({ branchId, ...params }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('stock'));
      const response = await stockService.getByBranch(branchId, params);

      if (!response.success) {
        throw new Error('Failed to load stock');
      }

      return {
        items: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error al cargar inventario');
    } finally {
      dispatch(stopLoading());
    }
  }
);


export const fetchStockMovements = createAsyncThunk<
  { movements: StockMovement[]; total: number },
  {
    branch_id?: UUID;
    product_id?: UUID;
    movement_type?: string;
    from_date?: string;
    to_date?: string;
    page?: number;
    limit?: number;
  },
  { rejectValue: string }
>(
  'stock/fetchStockMovements',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('movements'));
      const response = await stockService.getMovements(params);

      if (!response.success) {
        throw new Error('Failed to load movements');
      }

      return {
        movements: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error al cargar movimientos de stock');
    } finally {
      dispatch(stopLoading());
    }
  }
);


export const adjustStock = createAsyncThunk<
  { stock: any; movement: StockMovement },
  StockAdjustment,
  { rejectValue: string }
>(
  'stock/adjustStock',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('adjust'));
      const response = await stockService.adjust(data);

      if (!response.success) {
        throw new Error('Failed to adjust stock');
      }

      dispatch(showToast({ message: 'Stock ajustado correctamente', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al ajustar stock', type: 'error' }));
      return rejectWithValue('Error al ajustar stock');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const recordShrinkage = createAsyncThunk<
  StockMovement,
  {
    product_id: UUID;
    branch_id: UUID;
    quantity: number;
    reason?: string;
    notes?: string;
  },
  { rejectValue: string }
>(
  'stock/recordShrinkage',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('shrinkage'));
      const response = await stockService.recordShrinkage(data);

      if (!response.success) {
        throw new Error('Failed to register shrinkage');
      }

      dispatch(showToast({ message: 'Merma registrada correctamente', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al registrar merma', type: 'error' }));
      return rejectWithValue('Error al registrar merma');
    } finally {
      dispatch(stopLoading());
    }
  }
);


const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    updateStockFromWebSocket: (state, action: PayloadAction<{
      product_id: UUID;
      branch_id: UUID;
      new_quantity: number;
    }>) => {
      const itemIndex = state.items.findIndex(
        (item) =>
          item.product_id === action.payload.product_id &&
          item.branch_id === action.payload.branch_id
      );

      if (itemIndex >= 0) {
        state.items[itemIndex].quantity = action.payload.new_quantity;
      }
    },

    addMovement: (state, action: PayloadAction<StockMovement>) => {
      state.movements.unshift(action.payload);
    },

    clearStock: (state) => {
      state.items = [];
      state.movements = [];
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Fetch Branch Stock
    builder
      .addCase(fetchBranchStock.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranchStock.fulfilled, (state, action) => {
        state.items = action.payload.items;
        state.pagination.total = action.payload.total;
        state.loading = false;
      })
      .addCase(fetchBranchStock.rejected, (state, action) => {
        state.error = action.payload || 'Error loading stock';
        state.loading = false;
      });

    // Fetch Stock Movements
    builder
      .addCase(fetchStockMovements.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStockMovements.fulfilled, (state, action) => {
        state.movements = action.payload.movements;
        state.loading = false;
      })
      .addCase(fetchStockMovements.rejected, (state, action) => {
        state.error = action.payload || 'Error loading movements';
        state.loading = false;
      });

    // Adjust Stock
    builder.addCase(adjustStock.fulfilled, (state, action) => {
      // Update item quantity
      const itemIndex = state.items.findIndex(
        (item) =>
          item.product_id === action.payload.movement.product_id &&
          item.branch_id === action.payload.movement.branch_id
      );

      if (itemIndex >= 0) {
        state.items[itemIndex].quantity = action.payload.movement.quantity_after;
      }

      // Add movement
      state.movements.unshift(action.payload.movement);
    });

    // Record Shrinkage
    builder.addCase(recordShrinkage.fulfilled, (state, action) => {
      // Update item quantity
      const itemIndex = state.items.findIndex(
        (item) =>
          item.product_id === action.payload.product_id &&
          item.branch_id === action.payload.branch_id
      );

      if (itemIndex >= 0) {
        state.items[itemIndex].quantity = action.payload.quantity_after;
      }

      // Add movement
      state.movements.unshift(action.payload);
    });
  },
});

export const {
  updateStockFromWebSocket,
  addMovement,
  clearStock,
  clearError,
} = stockSlice.actions;

export default stockSlice.reducer;
