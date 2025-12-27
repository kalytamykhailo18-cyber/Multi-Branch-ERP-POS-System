import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { UUID } from '../../types';
import {
  loyaltyService,
  LoyaltyAccount,
  PointsTransaction,
  CreditTransaction,
  LoyaltyConfig,
} from '../../services/api/loyalty.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface LoyaltyState {
  accounts: LoyaltyAccount[];
  currentAccount: LoyaltyAccount | null;
  pointsTransactions: PointsTransaction[];
  creditTransactions: CreditTransaction[];
  config: LoyaltyConfig | null;
  summary: {
    total_accounts: number;
    active_accounts: number;
    total_points_issued: number;
    total_points_redeemed: number;
    total_credit_given: number;
    total_credit_used: number;
    by_tier: Array<{ tier: string; count: number }>;
  } | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: LoyaltyState = {
  accounts: [],
  currentAccount: null,
  pointsTransactions: [],
  creditTransactions: [],
  config: null,
  summary: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
  },
};

// Async Thunks
export const loadAccounts = createAsyncThunk<
  { accounts: LoyaltyAccount[]; total: number },
  {
    search?: string;
    tier?: string;
    is_active?: boolean;
    page?: number;
    limit?: number;
  } | void,
  { rejectValue: string }
>(
  'loyalty/loadAccounts',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await loyaltyService.getAccounts(params || {});

      if (!response.success) {
        throw new Error('Failed to load accounts');
      }

      return {
        accounts: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error al cargar cuentas de fidelidad');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadAccountByQR = createAsyncThunk<
  LoyaltyAccount,
  string,
  { rejectValue: string }
>(
  'loyalty/loadAccountByQR',
  async (qrCode, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await loyaltyService.getAccountByQR(qrCode);

      if (!response.success) {
        throw new Error('Failed to load account');
      }

      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Código QR no encontrado', type: 'error' }));
      return rejectWithValue('Código QR no encontrado');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadAccountByCustomer = createAsyncThunk<
  LoyaltyAccount,
  UUID,
  { rejectValue: string }
>(
  'loyalty/loadAccountByCustomer',
  async (customerId, { rejectWithValue }) => {
    try {
      const response = await loyaltyService.getAccountByCustomer(customerId);

      if (!response.success) {
        throw new Error('Failed to load account');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Cliente no tiene cuenta de fidelidad');
    }
  }
);

export const createAccount = createAsyncThunk<
  LoyaltyAccount,
  UUID,
  { rejectValue: string }
>(
  'loyalty/createAccount',
  async (customerId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await loyaltyService.createAccount(customerId);

      if (!response.success) {
        throw new Error('Failed to create account');
      }

      dispatch(showToast({ message: 'Cuenta de fidelidad creada', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al crear cuenta de fidelidad', type: 'error' }));
      return rejectWithValue('Error al crear cuenta');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const earnPoints = createAsyncThunk<
  PointsTransaction,
  {
    loyalty_account_id: UUID;
    sale_id: UUID;
    sale_total: number;
    branch_id: UUID;
  },
  { rejectValue: string }
>(
  'loyalty/earnPoints',
  async (data, { rejectWithValue }) => {
    try {
      const response = await loyaltyService.earnPoints(data);

      if (!response.success) {
        throw new Error('Failed to earn points');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error al acumular puntos');
    }
  }
);

export const redeemPoints = createAsyncThunk<
  { transaction: PointsTransaction; discount_amount: number },
  {
    loyalty_account_id: UUID;
    points: number;
    sale_id?: UUID;
    branch_id: UUID;
  },
  { rejectValue: string }
>(
  'loyalty/redeemPoints',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await loyaltyService.redeemPoints(data);

      if (!response.success) {
        throw new Error('Failed to redeem points');
      }

      dispatch(showToast({
        message: `Puntos canjeados: $${response.data.discount_amount.toFixed(2)} de descuento`,
        type: 'success',
      }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al canjear puntos', type: 'error' }));
      return rejectWithValue('Error al canjear puntos');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const adjustPoints = createAsyncThunk<
  PointsTransaction,
  {
    loyalty_account_id: UUID;
    points: number;
    reason: string;
  },
  { rejectValue: string }
>(
  'loyalty/adjustPoints',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await loyaltyService.adjustPoints(data);

      if (!response.success) {
        throw new Error('Failed to adjust points');
      }

      dispatch(showToast({ message: 'Puntos ajustados correctamente', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al ajustar puntos', type: 'error' }));
      return rejectWithValue('Error al ajustar puntos');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const giveCredit = createAsyncThunk<
  CreditTransaction,
  {
    loyalty_account_id: UUID;
    amount: number;
    sale_id?: UUID;
    branch_id: UUID;
    reason?: string;
  },
  { rejectValue: string }
>(
  'loyalty/giveCredit',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      const response = await loyaltyService.giveCredit(data);

      if (!response.success) {
        throw new Error('Failed to give credit');
      }

      dispatch(showToast({
        message: `Crédito de $${data.amount.toFixed(2)} otorgado`,
        type: 'success',
      }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al otorgar crédito', type: 'error' }));
      return rejectWithValue('Error al otorgar crédito');
    }
  }
);

export const useCredit = createAsyncThunk<
  CreditTransaction,
  {
    loyalty_account_id: UUID;
    amount: number;
    sale_id?: UUID;
    branch_id: UUID;
  },
  { rejectValue: string }
>(
  'loyalty/useCredit',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await loyaltyService.useCredit(data);

      if (!response.success) {
        throw new Error('Failed to use credit');
      }

      dispatch(showToast({
        message: `Crédito de $${data.amount.toFixed(2)} aplicado`,
        type: 'success',
      }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al aplicar crédito', type: 'error' }));
      return rejectWithValue('Error al aplicar crédito');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const adjustCredit = createAsyncThunk<
  CreditTransaction,
  {
    loyalty_account_id: UUID;
    amount: number;
    reason: string;
  },
  { rejectValue: string }
>(
  'loyalty/adjustCredit',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await loyaltyService.adjustCredit(data);

      if (!response.success) {
        throw new Error('Failed to adjust credit');
      }

      dispatch(showToast({ message: 'Crédito ajustado correctamente', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al ajustar crédito', type: 'error' }));
      return rejectWithValue('Error al ajustar crédito');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadPointsTransactions = createAsyncThunk<
  { transactions: PointsTransaction[]; total: number },
  {
    loyalty_account_id?: UUID;
    transaction_type?: string;
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  } | void,
  { rejectValue: string }
>(
  'loyalty/loadPointsTransactions',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await loyaltyService.getPointsTransactions(params || {});

      if (!response.success) {
        throw new Error('Failed to load transactions');
      }

      return {
        transactions: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error al cargar transacciones de puntos');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadCreditTransactions = createAsyncThunk<
  { transactions: CreditTransaction[]; total: number },
  {
    loyalty_account_id?: UUID;
    transaction_type?: string;
    branch_id?: UUID;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  } | void,
  { rejectValue: string }
>(
  'loyalty/loadCreditTransactions',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await loyaltyService.getCreditTransactions(params || {});

      if (!response.success) {
        throw new Error('Failed to load transactions');
      }

      return {
        transactions: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error al cargar transacciones de crédito');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadConfig = createAsyncThunk<
  LoyaltyConfig,
  void,
  { rejectValue: string }
>(
  'loyalty/loadConfig',
  async (_, { rejectWithValue }) => {
    try {
      const response = await loyaltyService.getConfig();

      if (!response.success) {
        throw new Error('Failed to load config');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error al cargar configuración');
    }
  }
);

export const updateConfig = createAsyncThunk<
  LoyaltyConfig,
  Partial<LoyaltyConfig>,
  { rejectValue: string }
>(
  'loyalty/updateConfig',
  async (data, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await loyaltyService.updateConfig(data);

      if (!response.success) {
        throw new Error('Failed to update config');
      }

      dispatch(showToast({ message: 'Configuración actualizada', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al actualizar configuración', type: 'error' }));
      return rejectWithValue('Error al actualizar configuración');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadSummary = createAsyncThunk<
  LoyaltyState['summary'],
  { branch_id?: UUID; start_date?: string; end_date?: string } | void,
  { rejectValue: string }
>(
  'loyalty/loadSummary',
  async (params, { rejectWithValue }) => {
    try {
      const response = await loyaltyService.getSummary(params || {});

      if (!response.success) {
        throw new Error('Failed to load summary');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error al cargar resumen');
    }
  }
);

const loyaltySlice = createSlice({
  name: 'loyalty',
  initialState,
  reducers: {
    setCurrentAccount: (state, action: PayloadAction<LoyaltyAccount | null>) => {
      state.currentAccount = action.payload;
    },

    updateAccountBalance: (state, action: PayloadAction<{
      account_id: UUID;
      loyalty_points?: number;
      credit_balance?: number;
    }>) => {
      const account = state.accounts.find((a) => a.id === action.payload.account_id);
      if (account) {
        if (action.payload.loyalty_points !== undefined) {
          account.loyalty_points = action.payload.loyalty_points;
        }
        if (action.payload.credit_balance !== undefined) {
          account.credit_balance = action.payload.credit_balance;
        }
      }

      if (state.currentAccount?.id === action.payload.account_id) {
        if (action.payload.loyalty_points !== undefined) {
          state.currentAccount.loyalty_points = action.payload.loyalty_points;
        }
        if (action.payload.credit_balance !== undefined) {
          state.currentAccount.credit_balance = action.payload.credit_balance;
        }
      }
    },

    clearLoyaltyState: (state) => {
      state.accounts = [];
      state.currentAccount = null;
      state.pointsTransactions = [];
      state.creditTransactions = [];
      state.summary = null;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Load Accounts
    builder
      .addCase(loadAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadAccounts.fulfilled, (state, action) => {
        state.accounts = action.payload.accounts;
        state.pagination.total = action.payload.total;
        state.loading = false;
      })
      .addCase(loadAccounts.rejected, (state, action) => {
        state.error = action.payload || 'Error loading accounts';
        state.loading = false;
      });

    // Load Account by QR
    builder.addCase(loadAccountByQR.fulfilled, (state, action) => {
      state.currentAccount = action.payload;
    });

    // Load Account by Customer
    builder.addCase(loadAccountByCustomer.fulfilled, (state, action) => {
      state.currentAccount = action.payload;
    });

    // Create Account
    builder.addCase(createAccount.fulfilled, (state, action) => {
      state.accounts.unshift(action.payload);
      state.currentAccount = action.payload;
    });

    // Earn Points
    builder.addCase(earnPoints.fulfilled, (state, action) => {
      state.pointsTransactions.unshift(action.payload);

      // Update account balance
      if (state.currentAccount?.id === action.payload.loyalty_account_id) {
        state.currentAccount.loyalty_points = action.payload.balance_after;
      }
    });

    // Redeem Points
    builder.addCase(redeemPoints.fulfilled, (state, action) => {
      state.pointsTransactions.unshift(action.payload.transaction);

      // Update account balance
      if (state.currentAccount?.id === action.payload.transaction.loyalty_account_id) {
        state.currentAccount.loyalty_points = action.payload.transaction.balance_after;
      }
    });

    // Adjust Points
    builder.addCase(adjustPoints.fulfilled, (state, action) => {
      state.pointsTransactions.unshift(action.payload);

      // Update account balance
      if (state.currentAccount?.id === action.payload.loyalty_account_id) {
        state.currentAccount.loyalty_points = action.payload.balance_after;
      }
    });

    // Give Credit
    builder.addCase(giveCredit.fulfilled, (state, action) => {
      state.creditTransactions.unshift(action.payload);

      // Update account balance
      if (state.currentAccount?.id === action.payload.loyalty_account_id) {
        state.currentAccount.credit_balance = action.payload.balance_after;
      }
    });

    // Use Credit
    builder.addCase(useCredit.fulfilled, (state, action) => {
      state.creditTransactions.unshift(action.payload);

      // Update account balance
      if (state.currentAccount?.id === action.payload.loyalty_account_id) {
        state.currentAccount.credit_balance = action.payload.balance_after;
      }
    });

    // Adjust Credit
    builder.addCase(adjustCredit.fulfilled, (state, action) => {
      state.creditTransactions.unshift(action.payload);

      // Update account balance
      if (state.currentAccount?.id === action.payload.loyalty_account_id) {
        state.currentAccount.credit_balance = action.payload.balance_after;
      }
    });

    // Load Points Transactions
    builder.addCase(loadPointsTransactions.fulfilled, (state, action) => {
      state.pointsTransactions = action.payload.transactions;
    });

    // Load Credit Transactions
    builder.addCase(loadCreditTransactions.fulfilled, (state, action) => {
      state.creditTransactions = action.payload.transactions;
    });

    // Load Config
    builder.addCase(loadConfig.fulfilled, (state, action) => {
      state.config = action.payload;
    });

    // Update Config
    builder.addCase(updateConfig.fulfilled, (state, action) => {
      state.config = action.payload;
    });

    // Load Summary
    builder.addCase(loadSummary.fulfilled, (state, action) => {
      state.summary = action.payload;
    });
  },
});

export const {
  setCurrentAccount,
  updateAccountBalance,
  clearLoyaltyState,
  clearError,
} = loyaltySlice.actions;

export default loyaltySlice.reducer;
