import { get, post, del } from './client';
import type { ApiResponse, PaginatedResponse, Alert, UUID } from '../../types';

export const alertService = {
  /**
   * Get all alerts with filters
   */
  getAll: (params?: {
    branch_id?: UUID;
    alert_type?: string;
    severity?: string;
    is_read?: boolean;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Alert>> => {
    // Backend expects from_date/to_date, filter empty strings
    const { start_date, end_date, ...rest } = params || {};
    const cleanParams = Object.fromEntries(
      Object.entries({ ...rest, from_date: start_date, to_date: end_date })
        .filter(([_, v]) => v !== '' && v !== undefined)
    );
    return get<Alert[]>('/alerts', cleanParams) as Promise<PaginatedResponse<Alert>>;
  },

  /**
   * Get alert by ID
   */
  getById: (id: UUID): Promise<ApiResponse<Alert>> => {
    return get<Alert>(`/alerts/${id}`);
  },

  /**
   * Get unread count
   */
  getUnreadCount: (branchId?: UUID): Promise<ApiResponse<{
    total: number;
    by_severity: Array<{ severity: string; count: number }>;
    by_type: Array<{ alert_type: string; count: number }>;
  }>> => {
    // Backend uses /alerts/unread endpoint
    return get('/alerts/unread', branchId ? { branch_id: branchId } : undefined);
  },

  /**
   * Mark alert as read
   */
  markAsRead: (id: UUID): Promise<ApiResponse<Alert>> => {
    // Backend expects alert_ids array at /alerts/mark-read
    return post<Alert>('/alerts/mark-read', { alert_ids: [id] });
  },

  /**
   * Mark all alerts as read
   */
  markAllAsRead: (params?: {
    branch_id?: UUID;
    alert_type?: string;
  }): Promise<ApiResponse<null>> => {
    return post<null>('/alerts/mark-all-read', params);
  },

  /**
   * Delete alert
   */
  delete: (id: UUID): Promise<ApiResponse<null>> => {
    return del<null>(`/alerts/${id}`);
  },

  /**
   * Delete old read alerts
   */
  deleteOld: (days?: number): Promise<ApiResponse<{ deleted_count: number }>> => {
    return del<{ deleted_count: number }>(`/alerts/old?days=${days || 30}`);
  },
};

export default alertService;
