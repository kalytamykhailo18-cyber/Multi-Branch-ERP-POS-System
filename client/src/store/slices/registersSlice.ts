import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  Register,
  RegisterSession,
  OpenSessionData,
  CloseSessionData,
  UUID,
} from '../../types';
import { registerService } from '../../services/api';
import { startLoading, stopLoading, showToast } from './uiSlice';
import { setCurrentSession } from './authSlice';

interface SessionSummary {
  session: RegisterSession;
  sales: {
    count: number;
    total: number;
    average: number;
  };
  voided: {
    count: number;
    total: number;
  };
  payments: Array<{
    method: string;
    code: string;
    total: number;
  }>;
}

interface RegistersState {
  registers: Register[];
  selectedRegister: Register | null;
  currentSession: RegisterSession | null;
  sessionSummary: SessionSummary | null;
  sessions: RegisterSession[];
  loading: boolean;
  error: string | null;
}

const initialState: RegistersState = {
  registers: [],
  selectedRegister: null,
  currentSession: null,
  sessionSummary: null,
  sessions: [],
  loading: false,
  error: null,
};

// Async Thunks
export const loadRegisters = createAsyncThunk<
  Register[],
  UUID, // branch_id
  { rejectValue: string }
>(
  'registers/loadRegisters',
  async (branchId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await registerService.getByBranch(branchId);

      if (!response.success) {
        throw new Error('Failed to load registers');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading registers');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const openSession = createAsyncThunk<
  RegisterSession,
  OpenSessionData,
  { rejectValue: string }
>(
  'registers/openSession',
  async (sessionData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Abriendo caja...'));
      const response = await registerService.openSession(sessionData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to open session');
      }

      dispatch(setCurrentSession(response.data));
      dispatch(showToast({ type: 'success', message: 'Caja abierta' }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al abrir caja';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

// BLIND CLOSING - Cashier declares amounts without seeing expected
export const closeSession = createAsyncThunk<
  RegisterSession,
  { session_id: UUID; data: CloseSessionData },
  { rejectValue: string }
>(
  'registers/closeSession',
  async ({ session_id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Cerrando caja...'));
      const response = await registerService.closeSession(session_id, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to close session');
      }

      dispatch(setCurrentSession(null));

      // Show discrepancy if any
      const session = response.data;
      const totalDiscrepancy =
        Number(session.discrepancy_cash || 0) +
        Number(session.discrepancy_card || 0) +
        Number(session.discrepancy_qr || 0) +
        Number(session.discrepancy_transfer || 0);

      if (totalDiscrepancy !== 0) {
        dispatch(showToast({
          type: totalDiscrepancy < 0 ? 'warning' : 'info',
          message: `Caja cerrada. Diferencia: $${totalDiscrepancy.toFixed(2)}`,
        }));
      } else {
        dispatch(showToast({ type: 'success', message: 'Caja cerrada correctamente' }));
      }

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al cerrar caja';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const getSessionSummary = createAsyncThunk<
  SessionSummary,
  UUID,
  { rejectValue: string }
>(
  'registers/getSessionSummary',
  async (sessionId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await registerService.getSessionSummary(sessionId);

      if (!response.success) {
        throw new Error('Failed to get session summary');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error getting session summary');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const getActiveSession = createAsyncThunk<
  RegisterSession | null,
  UUID, // register_id
  { rejectValue: string }
>(
  'registers/getActiveSession',
  async (registerId, { dispatch, rejectWithValue }) => {
    try {
      const response = await registerService.getActiveSession(registerId);

      if (!response.success) {
        return null;
      }

      if (response.data) {
        dispatch(setCurrentSession(response.data));
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error getting active session');
    }
  }
);

export const getCashierSession = createAsyncThunk<
  RegisterSession | null,
  void,
  { rejectValue: string }
>(
  'registers/getCashierSession',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await registerService.getCashierSession();

      if (!response.success || !response.data) {
        return null;
      }

      dispatch(setCurrentSession(response.data));
      return response.data;
    } catch (error) {
      return rejectWithValue('Error getting cashier session');
    }
  }
);

export const loadSessionHistory = createAsyncThunk<
  { sessions: RegisterSession[]; total: number },
  { branch_id?: UUID; register_id?: UUID; page?: number; limit?: number },
  { rejectValue: string }
>(
  'registers/loadSessionHistory',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await registerService.getSessions(params);

      if (!response.success) {
        throw new Error('Failed to load sessions');
      }

      return {
        sessions: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error loading sessions');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const forceCloseSession = createAsyncThunk<
  RegisterSession,
  { session_id: UUID; reason: string },
  { rejectValue: string }
>(
  'registers/forceCloseSession',
  async ({ session_id, reason }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Forzando cierre...'));
      const response = await registerService.forceClose(session_id, reason);

      if (!response.success) {
        throw new Error(response.error || 'Failed to force close');
      }

      dispatch(showToast({ type: 'warning', message: 'Sesión cerrada forzosamente' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al forzar cierre';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const registersSlice = createSlice({
  name: 'registers',
  initialState,
  reducers: {
    setSelectedRegister: (state, action: PayloadAction<Register | null>) => {
      state.selectedRegister = action.payload;
    },

    clearSessionSummary: (state) => {
      state.sessionSummary = null;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Load Registers
    builder
      .addCase(loadRegisters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRegisters.fulfilled, (state, action) => {
        state.registers = action.payload;
        state.loading = false;
      })
      .addCase(loadRegisters.rejected, (state, action) => {
        state.error = action.payload || 'Error loading registers';
        state.loading = false;
      });

    // Open Session
    builder
      .addCase(openSession.fulfilled, (state, action) => {
        state.currentSession = action.payload;
        // Update register to show it has active session
        const registerIndex = state.registers.findIndex(
          (r) => r.id === action.payload.register_id
        );
        if (registerIndex >= 0) {
          state.registers[registerIndex].current_session_id = action.payload.id;
        }
      });

    // Close Session
    builder.addCase(closeSession.fulfilled, (state, action) => {
      state.currentSession = null;
      state.sessionSummary = null;
      // Update register
      const registerIndex = state.registers.findIndex(
        (r) => r.id === action.payload.register_id
      );
      if (registerIndex >= 0) {
        state.registers[registerIndex].current_session_id = undefined;
      }
    });

    // Get Session Summary
    builder.addCase(getSessionSummary.fulfilled, (state, action) => {
      state.sessionSummary = action.payload;
    });

    // Get Active Session
    builder.addCase(getActiveSession.fulfilled, (state, action) => {
      state.currentSession = action.payload;
    });

    // Get Cashier Session
    builder.addCase(getCashierSession.fulfilled, (state, action) => {
      state.currentSession = action.payload;
    });

    // Load Session History
    builder.addCase(loadSessionHistory.fulfilled, (state, action) => {
      state.sessions = action.payload.sessions;
    });

    // Force Close Session
    builder.addCase(forceCloseSession.fulfilled, (state, action) => {
      if (state.currentSession?.id === action.payload.id) {
        state.currentSession = null;
      }
      // Update register
      const registerIndex = state.registers.findIndex(
        (r) => r.id === action.payload.register_id
      );
      if (registerIndex >= 0) {
        state.registers[registerIndex].current_session_id = undefined;
      }
    });
  },
});

export const fetchSessions = loadSessionHistory;
export const loadSessions = loadSessionHistory;

export const {
  setSelectedRegister,
  clearSessionSummary,
  clearError,
} = registersSlice.actions;

export default registersSlice.reducer;
