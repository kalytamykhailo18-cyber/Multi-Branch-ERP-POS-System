// Sync types matching database schema
import { UUID, ISODateString, BaseEntity } from './common';

// Sync operation types
export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

// Sync queue status
export type SyncQueueStatus = 'PENDING' | 'PROCESSING' | 'SYNCED' | 'FAILED' | 'CONFLICT';

// Conflict resolution strategies
export type ConflictResolution = 'LOCAL_WINS' | 'SERVER_WINS' | 'MERGED';

// Sync queue entity matching sync_queue table
export interface SyncQueue extends BaseEntity {
  branch_id: UUID;
  register_id: UUID | null;

  // Operation details
  entity_type: string;                   // max 50 chars (e.g., 'SALE', 'STOCK_MOVEMENT')
  entity_local_id: string;               // max 50 chars
  operation: SyncOperation;
  payload: object;                       // JSONB

  // Status
  status: SyncQueueStatus;               // default: 'PENDING'
  error_message: string | null;          // TEXT
  retry_count: number;                   // default: 0

  // Conflict resolution
  conflict_type: string | null;          // max 50 chars
  conflict_resolution: ConflictResolution | null;
  conflict_resolved_by: UUID | null;

  // Timestamps
  local_created_at: ISODateString;
  synced_at: ISODateString | null;
}

// Sync queue with details
export interface SyncQueueWithDetails extends SyncQueue {
  branch_name: string;
  register_name: string | null;
  conflict_resolved_by_name: string | null;
}

// Audit log entity matching audit_logs table
export interface AuditLog {
  id: UUID;
  table_name: string;                    // max 50 chars
  record_id: UUID;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values: object | null;             // JSONB
  new_values: object | null;             // JSONB
  changed_by: UUID | null;
  changed_at: ISODateString;
  ip_address: string | null;             // INET
  user_agent: string | null;             // max 500 chars
}

// Sync request from POS client
export interface SyncPushRequest {
  branch_id: UUID;
  register_id: UUID;
  items: SyncPushItem[];
  last_sync_at: ISODateString | null;
}

// Sync push item
export interface SyncPushItem {
  entity_type: string;
  local_id: string;
  operation: SyncOperation;
  data: object;
  local_created_at: ISODateString;
}

// Sync response to POS client
export interface SyncPushResponse {
  success: boolean;
  processed: number;
  failed: number;
  conflicts: SyncConflict[];
  server_time: ISODateString;
}

// Sync conflict details
export interface SyncConflict {
  local_id: string;
  entity_type: string;
  conflict_type: string;
  local_data: object;
  server_data: object;
  suggested_resolution: ConflictResolution;
}

// Sync pull request from POS client
export interface SyncPullRequest {
  branch_id: UUID;
  last_sync_at: ISODateString | null;
  entity_types?: string[];               // Specific entities to pull, null = all
}

// Sync pull response
export interface SyncPullResponse {
  success: boolean;
  data: SyncPullData;
  server_time: ISODateString;
}

// Data for sync pull
export interface SyncPullData {
  products?: object[];
  categories?: object[];
  customers?: object[];
  payment_methods?: object[];
  users?: object[];
  branch_stock?: object[];
}

// Resolve conflict request
export interface ResolveConflictRequest {
  queue_id: UUID;
  resolution: ConflictResolution;
  merged_data?: object;                  // If resolution is MERGED
}

// Sync status overview
export interface SyncStatusOverview {
  pending_count: number;
  processing_count: number;
  failed_count: number;
  conflict_count: number;
  last_successful_sync: ISODateString | null;
  by_entity_type: {
    entity_type: string;
    pending: number;
    failed: number;
    conflicts: number;
  }[];
}

// Sync filter params
export interface SyncQueueFilterParams {
  branch_id?: UUID;
  register_id?: UUID;
  entity_type?: string;
  status?: SyncQueueStatus;
  from_date?: string;
  to_date?: string;
}
