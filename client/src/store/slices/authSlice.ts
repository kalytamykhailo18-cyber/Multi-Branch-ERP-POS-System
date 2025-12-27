import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  User,
  Branch,
  RegisterSession,
  LoginCredentials,
  PINLoginCredentials,
  
} from '../../types';
import { authService } from '../../services/api';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  currentBranch: Branch | null;
  currentSession: RegisterSession | null;
  availableBranches: Branch[];
  loginType: 'full' | 'pin' | null;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  currentBranch: null,
  currentSession: null,
  availableBranches: [],
  loginType: null,
  error: null,
};

// Async Thunks
export const login = createAsyncThunk<
  { user: User; token: string; branches: Branch[] },
  LoginCredentials,
  { rejectValue: string }
>(
  'auth/login',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Iniciando sesión...'));
      const response = await authService.login(credentials);

      if (!response.success) {
        throw new Error(response.error || 'Login failed');
      }

      localStorage.setItem('token', response.data.token);

      dispatch(showToast({
        type: 'success',
        message: `Bienvenido, ${response.data.user.first_name}!`,
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error de autenticación';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loginWithPIN = createAsyncThunk<
  { user: User; token: string; session: RegisterSession },
  PINLoginCredentials,
  { rejectValue: string }
>(
  'auth/loginWithPIN',
  async (credentials, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Verificando PIN...'));
      const response = await authService.loginWithPIN(credentials);

      if (!response.success) {
        throw new Error(response.error || 'PIN login failed');
      }

      localStorage.setItem('token', response.data.token);

      dispatch(showToast({
        type: 'success',
        message: `Sesión iniciada`,
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PIN incorrecto';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const logout = createAsyncThunk<void, void, { rejectValue: string }>(
  'auth/logout',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Cerrando sesión...'));
      await authService.logout();
      localStorage.removeItem('token');
      dispatch(showToast({ type: 'info', message: 'Sesión cerrada' }));
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue('Error al cerrar sesión');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const getCurrentUser = createAsyncThunk<
  { user: User; branches: Branch[] },
  void,
  { rejectValue: string }
>(
  'auth/getCurrentUser',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await authService.me();

      if (!response.success) {
        throw new Error('Failed to get user');
      }

      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue('Sesión expirada');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const refreshToken = createAsyncThunk<
  { token: string },
  void,
  { rejectValue: string }
>(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.refreshToken();

      if (!response.success) {
        throw new Error('Failed to refresh token');
      }

      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      localStorage.removeItem('token');
      return rejectWithValue('Sesión expirada');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },

    setCurrentBranch: (state, action: PayloadAction<Branch>) => {
      state.currentBranch = action.payload;
    },

    setCurrentSession: (state, action: PayloadAction<RegisterSession | null>) => {
      state.currentSession = action.payload;
    },

    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },

    // For handling token from storage on app init
    initializeAuth: (state) => {
      const token = localStorage.getItem('token');
      if (token) {
        state.token = token;
      }
    },
  },

  extraReducers: (builder) => {
    // Login
    builder
      .addCase(login.pending, (state) => {
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.availableBranches = action.payload.branches;
        state.loginType = 'full';
        state.error = null;

        // Set default branch
        if (action.payload.branches && action.payload.branches.length > 0) {
          const primaryBranch = action.payload.branches.find(
            (b: any) => b.user_branches?.is_primary === true
          );
          state.currentBranch = primaryBranch || action.payload.branches[0];
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.error = action.payload || 'Error de autenticación';
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      });

    // PIN Login
    builder
      .addCase(loginWithPIN.pending, (state) => {
        state.error = null;
      })
      .addCase(loginWithPIN.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.currentSession = action.payload.session;
        state.loginType = 'pin';
        state.error = null;
      })
      .addCase(loginWithPIN.rejected, (state, action) => {
        state.error = action.payload || 'PIN incorrecto';
      });

    // Logout
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.currentBranch = null;
        state.currentSession = null;
        state.availableBranches = [];
        state.loginType = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        // Still clear state even if logout API fails
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.currentBranch = null;
        state.currentSession = null;
        state.availableBranches = [];
        state.loginType = null;
      });

    // Get Current User
    builder
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.availableBranches = action.payload.branches;

        if (action.payload.branches && action.payload.branches.length > 0 && !state.currentBranch) {
          const primaryBranch = action.payload.branches.find(
            (b: any) => b.user_branches?.is_primary === true
          );
          state.currentBranch = primaryBranch || action.payload.branches[0];
        }
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });

    // Refresh Token
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const {
  clearError,
  setCurrentBranch,
  setCurrentSession,
  updateUser,
  initializeAuth,
} = authSlice.actions;

export default authSlice.reducer;
