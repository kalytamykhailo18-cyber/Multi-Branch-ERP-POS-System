// API-specific types for requests and responses
import { UUID, ISODateString, PaginatedResponse, ApiResponse, ValidationError } from './common';

// HTTP Methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// Standard API error response
export interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: ValidationError[];
  stack?: string;                        // Only in development
}

// Success response with data
export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

// List response with pagination
export interface ApiListResponse<T> extends PaginatedResponse<T> {
  success: true;
}

// Auth token refresh request
export interface RefreshTokenRequest {
  refresh_token: string;
}

// Auth token refresh response
export interface RefreshTokenResponse {
  token: string;
  expires_at: ISODateString;
}

// Batch operation request
export interface BatchOperationRequest<T> {
  items: T[];
}

// Batch operation response
export interface BatchOperationResponse {
  success: boolean;
  processed: number;
  failed: number;
  errors: {
    index: number;
    error: string;
  }[];
}

// File upload response
export interface FileUploadResponse {
  success: true;
  file_path: string;
  file_url: string;
  file_name: string;
  file_size: number;
  mime_type: string;
}

// Search request (for global search)
export interface GlobalSearchRequest {
  query: string;
  types?: ('products' | 'customers' | 'sales' | 'invoices')[];
  limit?: number;
}

// Search result item
export interface SearchResultItem {
  type: 'product' | 'customer' | 'sale' | 'invoice';
  id: UUID;
  title: string;
  subtitle?: string;
  url: string;
}

// Search response
export interface GlobalSearchResponse {
  success: true;
  results: SearchResultItem[];
  total: number;
}

// Dashboard data request
export interface DashboardDataRequest {
  branch_id?: UUID;
  date_from?: string;
  date_to?: string;
}

// Health check response
export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  environment: string;
  database: 'connected' | 'disconnected';
  redis?: 'connected' | 'disconnected';
  uptime: number;
  timestamp: ISODateString;
}

// WebSocket event types
export type WebSocketEventType =
  | 'SALE_CREATED'
  | 'SALE_VOIDED'
  | 'SESSION_OPENED'
  | 'SESSION_CLOSED'
  | 'ALERT_CREATED'
  | 'STOCK_LOW'
  | 'SYNC_COMPLETED'
  | 'PRICE_UPDATED';

// WebSocket message structure
export interface WebSocketMessage<T = unknown> {
  event: WebSocketEventType;
  data: T;
  branch_id?: UUID;
  timestamp: ISODateString;
}

// Error codes
export enum ErrorCode {
  // Authentication errors (1xx)
  INVALID_CREDENTIALS = 'E101',
  TOKEN_EXPIRED = 'E102',
  TOKEN_INVALID = 'E103',
  ACCOUNT_LOCKED = 'E104',
  INSUFFICIENT_PERMISSIONS = 'E105',
  PIN_REQUIRED = 'E106',
  INVALID_PIN = 'E107',

  // Validation errors (2xx)
  VALIDATION_FAILED = 'E201',
  REQUIRED_FIELD_MISSING = 'E202',
  INVALID_FORMAT = 'E203',
  DUPLICATE_ENTRY = 'E204',

  // Resource errors (3xx)
  RESOURCE_NOT_FOUND = 'E301',
  RESOURCE_CONFLICT = 'E302',
  RESOURCE_DELETED = 'E303',

  // Business logic errors (4xx)
  SESSION_NOT_OPEN = 'E401',
  SESSION_ALREADY_CLOSED = 'E402',
  INSUFFICIENT_STOCK = 'E403',
  SALE_ALREADY_VOIDED = 'E404',
  INVOICE_ALREADY_ISSUED = 'E405',
  TRANSFER_PENDING = 'E406',
  CREDIT_LIMIT_EXCEEDED = 'E407',

  // External service errors (5xx)
  FACTUHOY_ERROR = 'E501',
  SYNC_ERROR = 'E502',
  FILE_UPLOAD_ERROR = 'E503',

  // Server errors (9xx)
  INTERNAL_ERROR = 'E901',
  DATABASE_ERROR = 'E902',
  SERVICE_UNAVAILABLE = 'E903',
}

// Express request with user
export interface AuthenticatedRequest {
  user: {
    id: UUID;
    email: string;
    role_id: UUID;
    role_name: string;
    branch_id: UUID | null;
    permissions: {
      canVoidSale: boolean;
      canGiveDiscount: boolean;
      canViewAllBranches: boolean;
      canCloseRegister: boolean;
      canReopenClosing: boolean;
      canAdjustStock: boolean;
      canImportPrices: boolean;
      canManageUsers: boolean;
      canViewReports: boolean;
      canViewFinancials: boolean;
      canManageSuppliers: boolean;
      canManageProducts: boolean;
      canIssueInvoiceA: boolean;
      maxDiscountPercent: number;
    };
  };
  session_id: UUID;
}
