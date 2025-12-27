// Stock types matching database schema
import { UUID, ISODateString, Decimal, BaseEntity, BaseEntityNoUpdate } from './common';

// Branch stock entity matching branch_stock table
export interface BranchStock {
  id: UUID;
  branch_id: UUID;
  product_id: UUID;
  quantity: Decimal;                     // default: 0
  reserved_quantity: Decimal;            // default: 0 (for pending orders)

  // Shrinkage tracking
  expected_shrinkage: Decimal;           // default: 0
  actual_shrinkage: Decimal;             // default: 0
  last_counted_at: ISODateString | null;
  last_counted_quantity: Decimal | null;

  updated_at: ISODateString;
}

// Branch stock with product details
export interface BranchStockWithProduct extends BranchStock {
  product_name: string;
  product_sku: string;
  unit_code: string;
  minimum_stock: Decimal;
  is_below_minimum: boolean;
  available_quantity: Decimal;           // quantity - reserved_quantity
}

// Stock movement types
export type StockMovementType =
  | 'SALE'
  | 'RETURN'
  | 'PURCHASE'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT_PLUS'
  | 'ADJUSTMENT_MINUS'
  | 'SHRINKAGE'
  | 'INITIAL'
  | 'INVENTORY_COUNT';

// Stock movement entity matching stock_movements table
export interface StockMovement extends BaseEntityNoUpdate {
  branch_id: UUID;
  product_id: UUID;
  movement_type: StockMovementType;
  quantity: Decimal;
  quantity_before: Decimal;
  quantity_after: Decimal;

  // Reference to source document
  reference_type: string | null;         // max 50 chars (e.g., 'SALE', 'TRANSFER')
  reference_id: UUID | null;

  // For adjustments
  adjustment_reason: string | null;      // max 255 chars

  // For transfers
  related_branch_id: UUID | null;

  performed_by: UUID | null;
  notes: string | null;                  // TEXT

  // Sync tracking
  local_id: string | null;               // max 50 chars
  synced_at: ISODateString | null;
}

// Stock movement with details
export interface StockMovementWithDetails extends StockMovement {
  product_name: string;
  product_sku: string;
  branch_name: string;
  related_branch_name: string | null;
  performed_by_name: string | null;
}

// Stock transfer status
export type TransferStatus = 'PENDING' | 'IN_TRANSIT' | 'COMPLETED' | 'CANCELLED';

// Stock transfer entity matching stock_transfers table
export interface StockTransfer extends BaseEntity {
  transfer_number: string;               // max 20 chars, unique
  from_branch_id: UUID;
  to_branch_id: UUID;
  status: TransferStatus;                // default: 'PENDING'
  notes: string | null;                  // TEXT
  created_by: UUID;
  approved_by: UUID | null;
  approved_at: ISODateString | null;
  received_by: UUID | null;
  received_at: ISODateString | null;
}

// Stock transfer with details
export interface StockTransferWithDetails extends StockTransfer {
  from_branch_name: string;
  to_branch_name: string;
  created_by_name: string;
  items: StockTransferItem[];
  total_items: number;
}

// Stock transfer item entity matching stock_transfer_items table
export interface StockTransferItem {
  id: UUID;
  transfer_id: UUID;
  product_id: UUID;
  quantity_sent: Decimal;
  quantity_received: Decimal | null;
  created_at: ISODateString;
}

// Stock transfer item with product details
export interface StockTransferItemWithProduct extends StockTransferItem {
  product_name: string;
  product_sku: string;
  unit_code: string;
}

// Create stock adjustment DTO
export interface CreateStockAdjustmentRequest {
  branch_id: UUID;
  product_id: UUID;
  adjustment_type: 'PLUS' | 'MINUS';
  quantity: number;
  reason: string;
  notes?: string;
}

// Create stock transfer DTO
export interface CreateStockTransferRequest {
  from_branch_id: UUID;
  to_branch_id: UUID;
  notes?: string;
  items: {
    product_id: UUID;
    quantity: number;
  }[];
}

// Receive stock transfer DTO
export interface ReceiveStockTransferRequest {
  items: {
    item_id: UUID;
    quantity_received: number;
  }[];
  notes?: string;
}

// Inventory count entry
export interface InventoryCountEntry {
  product_id: UUID;
  counted_quantity: number;
}

// Submit inventory count DTO
export interface SubmitInventoryCountRequest {
  branch_id: UUID;
  entries: InventoryCountEntry[];
  notes?: string;
}

// Stock filter params
export interface StockFilterParams {
  branch_id?: UUID;
  product_id?: UUID;
  below_minimum?: boolean;
  has_stock?: boolean;
  search?: string;
}

// Stock movement filter params
export interface StockMovementFilterParams {
  branch_id?: UUID;
  product_id?: UUID;
  movement_type?: StockMovementType;
  from_date?: string;
  to_date?: string;
  performed_by?: UUID;
}
