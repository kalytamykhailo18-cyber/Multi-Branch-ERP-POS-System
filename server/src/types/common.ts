// Common types used across the application

// UUID type alias for clarity
export type UUID = string;

// Date string in ISO format
export type ISODateString = string;

// Time string (HH:mm:ss)
export type TimeString = string;

// Date only string (YYYY-MM-DD)
export type DateOnlyString = string;

// Decimal values are stored as strings to avoid floating-point precision issues
export type Decimal = string;

// Base entity interface with common fields
export interface BaseEntity {
  id: UUID;
  created_at: ISODateString;
  updated_at: ISODateString;
}

// Entity without updated_at (for tables that don't track updates)
export interface BaseEntityNoUpdate {
  id: UUID;
  created_at: ISODateString;
}

// Pagination request
export interface PaginationParams {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
}

// Pagination response
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

// Validation error structure
export interface ValidationError {
  field: string;
  message: string;
}

// Sync status enum
export type SyncStatus = 'PENDING' | 'SYNCED' | 'CONFLICT';

// Common status for entities
export type EntityStatus = 'ACTIVE' | 'INACTIVE';
