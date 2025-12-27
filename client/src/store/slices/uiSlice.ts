import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Global UI State - includes the global loading system
interface UIState {
  // Global loading state for all API requests
  loading: boolean;
  loadingMessage: string | null;
  loadingCount: number; // Track multiple concurrent requests

  // Toast/notification state
  toast: {
    show: boolean;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
  } | null;

  // Modal state
  modal: {
    isOpen: boolean;
    type: string | null;
    data: unknown;
  };

  // Sidebar state
  sidebarOpen: boolean;

  // Theme
  theme: 'light' | 'dark';

  // POS specific UI
  posLayout: 'grid' | 'list';
  posGridSize: 'small' | 'medium' | 'large';

  // Keyboard state for POS
  numpadActive: boolean;

  // Connection status
  isOnline: boolean;
  lastSync: string | null;
}

const initialState: UIState = {
  loading: false,
  loadingMessage: null,
  loadingCount: 0,
  toast: null,
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },
  sidebarOpen: true,
  theme: 'dark',
  posLayout: 'grid',
  posGridSize: 'medium',
  numpadActive: false,
  isOnline: true,
  lastSync: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Global Loading System - Start Loading
    startLoading: (state, action: PayloadAction<string | undefined>) => {
      state.loadingCount += 1;
      state.loading = true;
      if (action.payload) {
        state.loadingMessage = action.payload;
      }
    },

    // Global Loading System - Stop Loading
    stopLoading: (state) => {
      state.loadingCount = Math.max(0, state.loadingCount - 1);
      if (state.loadingCount === 0) {
        state.loading = false;
        state.loadingMessage = null;
      }
    },

    // Force stop all loading (for error recovery)
    forceStopLoading: (state) => {
      state.loadingCount = 0;
      state.loading = false;
      state.loadingMessage = null;
    },

    // Toast notifications
    showToast: (state, action: PayloadAction<{
      type: 'success' | 'error' | 'warning' | 'info';
      message: string;
      duration?: number;
    }>) => {
      state.toast = {
        show: true,
        ...action.payload,
      };
    },

    hideToast: (state) => {
      state.toast = null;
    },

    // Modal management
    openModal: (state, action: PayloadAction<{ type: string; data?: unknown }>) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },

    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        type: null,
        data: null,
      };
    },

    // Sidebar toggle
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    // Theme toggle
    setTheme: (state, action: PayloadAction<'light' | 'dark'>) => {
      state.theme = action.payload;
    },

    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
    },

    // POS Layout
    setPosLayout: (state, action: PayloadAction<'grid' | 'list'>) => {
      state.posLayout = action.payload;
    },

    setPosGridSize: (state, action: PayloadAction<'small' | 'medium' | 'large'>) => {
      state.posGridSize = action.payload;
    },

    // Numpad
    setNumpadActive: (state, action: PayloadAction<boolean>) => {
      state.numpadActive = action.payload;
    },

    // Connection status
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },

    setLastSync: (state, action: PayloadAction<string>) => {
      state.lastSync = action.payload;
    },
  },
});

export const {
  startLoading,
  stopLoading,
  forceStopLoading,
  showToast,
  hideToast,
  openModal,
  closeModal,
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  toggleTheme,
  setPosLayout,
  setPosGridSize,
  setNumpadActive,
  setOnlineStatus,
  setLastSync,
} = uiSlice.actions;

export default uiSlice.reducer;
