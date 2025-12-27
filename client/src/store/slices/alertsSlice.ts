import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Alert, UUID } from '../../types';
import { alertService } from '../../services/api';
import { startLoading, stopLoading } from './uiSlice';

interface UnreadCount {
  total: number;
  by_severity: Array<{ severity: string; count: number }>;
  by_type: Array<{ alert_type: string; count: number }>;
}

interface AlertsState {
  alerts: Alert[];
  unreadCount: UnreadCount | null;
  unreadBySeverity: {
    INFO: number;
    WARNING: number;
    ERROR: number;
    CRITICAL: number;
  };
  selectedAlert: Alert | null;
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  } | null;
  loading: boolean;
  error: string | null;
}

const initialState: AlertsState = {
  alerts: [],
  unreadCount: null,
  unreadBySeverity: {
    INFO: 0,
    WARNING: 0,
    ERROR: 0,
    CRITICAL: 0,
  },
  selectedAlert: null,
  pagination: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchAlerts = createAsyncThunk<
  { alerts: Alert[]; pagination: any },
  any,
  { rejectValue: string }
>(
  'alerts/fetchAlerts',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await alertService.getAll(params || {});

      if (!response.success) {
        throw new Error('Failed to load alerts');
      }

      return {
        alerts: response.data,
        pagination: response.pagination,
      };
    } catch (error) {
      return rejectWithValue('Error loading alerts');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadAlerts = fetchAlerts;

export const fetchUnreadCount = createAsyncThunk<
  UnreadCount,
  any,
  { rejectValue: string }
>(
  'alerts/fetchUnreadCount',
  async (params, { rejectWithValue }) => {
    try {
      const response = await alertService.getUnreadCount(params?.branch_id);

      if (!response.success) {
        throw new Error('Failed to get unread count');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error getting unread count');
    }
  }
);

export const getUnreadCount = fetchUnreadCount;

export const markAlertAsRead = createAsyncThunk<
  Alert,
  UUID,
  { rejectValue: string }
>(
  'alerts/markAlertAsRead',
  async (alertId, { rejectWithValue }) => {
    try {
      const response = await alertService.markAsRead(alertId);

      if (!response.success) {
        throw new Error('Failed to mark alert as read');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error marking alert as read');
    }
  }
);

export const markAsRead = markAlertAsRead;

export const markAllAlertsAsRead = createAsyncThunk<
  void,
  any,
  { rejectValue: string }
>(
  'alerts/markAllAlertsAsRead',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await alertService.markAllAsRead(params || {});

      if (!response.success) {
        throw new Error('Failed to mark all as read');
      }
    } catch (error) {
      return rejectWithValue('Error marking alerts as read');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const markAllAsRead = markAllAlertsAsRead;

export const deleteAlert = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'alerts/deleteAlert',
  async (alertId, { rejectWithValue }) => {
    try {
      const response = await alertService.delete(alertId);

      if (!response.success) {
        throw new Error('Failed to delete alert');
      }

      return alertId;
    } catch (error) {
      return rejectWithValue('Error deleting alert');
    }
  }
);

const alertsSlice = createSlice({
  name: 'alerts',
  initialState,
  reducers: {
    // Add new alert from WebSocket
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.alerts.unshift(action.payload);
      if (state.unreadCount) {
        state.unreadCount.total += 1;
      }

      const severity = action.payload.severity;
      if (severity in state.unreadBySeverity) {
        state.unreadBySeverity[severity as keyof typeof state.unreadBySeverity] += 1;
      }
    },

    setSelectedAlert: (state, action: PayloadAction<Alert | null>) => {
      state.selectedAlert = action.payload;
    },

    clearAlerts: (state) => {
      state.alerts = [];
      state.unreadCount = null;
      state.unreadBySeverity = {
        INFO: 0,
        WARNING: 0,
        ERROR: 0,
        CRITICAL: 0,
      };
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Load Alerts
    builder
      .addCase(fetchAlerts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAlerts.fulfilled, (state, action) => {
        state.alerts = action.payload.alerts;
        state.pagination = action.payload.pagination;
        state.loading = false;
      })
      .addCase(fetchAlerts.rejected, (state, action) => {
        state.error = action.payload || 'Error loading alerts';
        state.loading = false;
      });

    // Get Unread Count
    builder.addCase(fetchUnreadCount.fulfilled, (state, action) => {
      state.unreadCount = action.payload;

      // Reset and update by severity
      state.unreadBySeverity = {
        INFO: 0,
        WARNING: 0,
        ERROR: 0,
        CRITICAL: 0,
      };

      action.payload.by_severity.forEach((item) => {
        const severity = item.severity as keyof typeof state.unreadBySeverity;
        if (severity in state.unreadBySeverity) {
          state.unreadBySeverity[severity] = item.count;
        }
      });
    });

    // Mark as Read
    builder.addCase(markAlertAsRead.fulfilled, (state, action) => {
      const alertIndex = state.alerts.findIndex((a) => a.id === action.payload.id);
      if (alertIndex >= 0) {
        const oldAlert = state.alerts[alertIndex];

        // Update unread counts
        if (!oldAlert.is_read && state.unreadCount) {
          state.unreadCount.total = Math.max(0, state.unreadCount.total - 1);
          const severity = oldAlert.severity as keyof typeof state.unreadBySeverity;
          if (severity in state.unreadBySeverity) {
            state.unreadBySeverity[severity] = Math.max(0, state.unreadBySeverity[severity] - 1);
          }
        }

        state.alerts[alertIndex] = action.payload;
      }
    });

    // Mark All as Read
    builder.addCase(markAllAlertsAsRead.fulfilled, (state) => {
      state.alerts = state.alerts.map((alert) => ({
        ...alert,
        is_read: true,
      }));
      if (state.unreadCount) {
        state.unreadCount.total = 0;
      }
      state.unreadBySeverity = {
        INFO: 0,
        WARNING: 0,
        ERROR: 0,
        CRITICAL: 0,
      };
    });

    // Delete Alert
    builder.addCase(deleteAlert.fulfilled, (state, action) => {
      const alertIndex = state.alerts.findIndex((a) => a.id === action.payload);
      if (alertIndex >= 0) {
        const alert = state.alerts[alertIndex];

        // Update unread counts if it was unread
        if (!alert.is_read && state.unreadCount) {
          state.unreadCount.total = Math.max(0, state.unreadCount.total - 1);
          const severity = alert.severity as keyof typeof state.unreadBySeverity;
          if (severity in state.unreadBySeverity) {
            state.unreadBySeverity[severity] = Math.max(0, state.unreadBySeverity[severity] - 1);
          }
        }

        state.alerts.splice(alertIndex, 1);
      }
    });
  },
});

export const {
  addAlert,
  setSelectedAlert,
  clearAlerts,
  clearError,
} = alertsSlice.actions;

export default alertsSlice.reducer;
