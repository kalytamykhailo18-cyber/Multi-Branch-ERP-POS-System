import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Customer, QuickSearchCustomer, UUID } from '../../types';
import { customerService } from '../../services/api';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface CustomersState {
  customers: Customer[];
  totalCustomers: number;
  quickSearchResults: QuickSearchCustomer[];
  selectedCustomer: Customer | null;
  searchQuery: string;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
}

const initialState: CustomersState = {
  customers: [],
  totalCustomers: 0,
  quickSearchResults: [],
  selectedCustomer: null,
  searchQuery: '',
  page: 1,
  limit: 20,
  loading: false,
  error: null,
};

// Async Thunks
export const loadCustomers = createAsyncThunk<
  { customers: Customer[]; total: number },
  { page?: number; limit?: number; search?: string } | void,
  { rejectValue: string }
>(
  'customers/loadCustomers',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await customerService.getAll(params || {});

      if (!response.success) {
        throw new Error('Failed to load customers');
      }

      return {
        customers: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error loading customers');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const quickSearchCustomers = createAsyncThunk<
  QuickSearchCustomer[],
  string,
  { rejectValue: string }
>(
  'customers/quickSearch',
  async (query, { rejectWithValue }) => {
    try {
      if (query.length < 2) {
        return [];
      }

      const response = await customerService.quickSearch(query);

      if (!response.success) {
        throw new Error('Failed to search customers');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error searching customers');
    }
  }
);

export const getCustomerByQRCode = createAsyncThunk<
  Customer,
  string,
  { rejectValue: string }
>(
  'customers/getByQRCode',
  async (qrCode, { dispatch, rejectWithValue }) => {
    try {
      const response = await customerService.getByQRCode(qrCode);

      if (!response.success) {
        throw new Error('Customer not found');
      }

      dispatch(showToast({
        type: 'success',
        message: `Cliente: ${response.data.company_name || response.data.first_name}`,
      }));

      return response.data;
    } catch (error) {
      dispatch(showToast({ type: 'error', message: 'Cliente no encontrado' }));
      return rejectWithValue('Customer not found');
    }
  }
);

export const getCustomerById = createAsyncThunk<
  Customer,
  UUID,
  { rejectValue: string }
>(
  'customers/getById',
  async (id, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await customerService.getById(id);

      if (!response.success) {
        throw new Error('Customer not found');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Customer not found');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const createCustomer = createAsyncThunk<
  Customer,
  Partial<Customer>,
  { rejectValue: string }
>(
  'customers/create',
  async (customerData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando cliente...'));
      const response = await customerService.create(customerData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create customer');
      }

      dispatch(showToast({ type: 'success', message: 'Cliente creado' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating customer';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateCustomer = createAsyncThunk<
  Customer,
  { id: UUID; data: Partial<Customer> },
  { rejectValue: string }
>(
  'customers/update',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando cliente...'));
      const response = await customerService.update(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update customer');
      }

      dispatch(showToast({ type: 'success', message: 'Cliente actualizado' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating customer';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const addLoyaltyPoints = createAsyncThunk<
  { new_balance: number },
  { customer_id: UUID; points: number; description?: string },
  { rejectValue: string }
>(
  'customers/addLoyaltyPoints',
  async ({ customer_id, points, description }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await customerService.addLoyaltyPoints(customer_id, points, description);

      if (!response.success) {
        throw new Error('Failed to add points');
      }

      dispatch(showToast({
        type: 'success',
        message: `${points > 0 ? '+' : ''}${points} puntos`,
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error adding points';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const addCredit = createAsyncThunk<
  { new_balance: number },
  { customer_id: UUID; amount: number; description?: string },
  { rejectValue: string }
>(
  'customers/addCredit',
  async ({ customer_id, amount, description }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await customerService.addCredit(customer_id, amount, description);

      if (!response.success) {
        throw new Error('Failed to add credit');
      }

      dispatch(showToast({
        type: 'success',
        message: `${amount > 0 ? '+' : ''}$${amount} crédito`,
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error adding credit';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const customersSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setSelectedCustomer: (state, action: PayloadAction<Customer | null>) => {
      state.selectedCustomer = action.payload;
    },

    clearQuickSearchResults: (state) => {
      state.quickSearchResults = [];
    },

    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Load Customers
    builder
      .addCase(loadCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCustomers.fulfilled, (state, action) => {
        state.customers = action.payload.customers;
        state.totalCustomers = action.payload.total;
        state.loading = false;
      })
      .addCase(loadCustomers.rejected, (state, action) => {
        state.error = action.payload || 'Error loading customers';
        state.loading = false;
      });

    // Quick Search
    builder.addCase(quickSearchCustomers.fulfilled, (state, action) => {
      state.quickSearchResults = action.payload;
    });

    // Get by QR Code
    builder.addCase(getCustomerByQRCode.fulfilled, (state, action) => {
      state.selectedCustomer = action.payload;
    });

    // Get by ID
    builder.addCase(getCustomerById.fulfilled, (state, action) => {
      state.selectedCustomer = action.payload;
    });

    // Create Customer
    builder.addCase(createCustomer.fulfilled, (state, action) => {
      state.customers.unshift(action.payload);
      state.totalCustomers += 1;
      state.selectedCustomer = action.payload;
    });

    // Update Customer
    builder.addCase(updateCustomer.fulfilled, (state, action) => {
      const index = state.customers.findIndex((c) => c.id === action.payload.id);
      if (index >= 0) {
        state.customers[index] = action.payload;
      }
      if (state.selectedCustomer?.id === action.payload.id) {
        state.selectedCustomer = action.payload;
      }
    });

    // Add Loyalty Points
    builder.addCase(addLoyaltyPoints.fulfilled, (state, action) => {
      if (state.selectedCustomer) {
        state.selectedCustomer.loyalty_points = action.payload.new_balance;
      }
    });

    // Add Credit
    builder.addCase(addCredit.fulfilled, (state, action) => {
      if (state.selectedCustomer) {
        state.selectedCustomer.credit_balance = action.payload.new_balance;
      }
    });
  },
});

export const {
  setSearchQuery,
  setSelectedCustomer,
  clearQuickSearchResults,
  setPage,
  clearError,
} = customersSlice.actions;

export default customersSlice.reducer;
