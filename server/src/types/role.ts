// Role types matching database schema
import { UUID, ISODateString, Decimal, BaseEntity } from './common';

// Role entity matching roles table
export interface Role extends BaseEntity {
  name: string;                          // max 50 chars, unique
  description: string | null;            // max 255 chars

  // Permissions
  can_void_sale: boolean;                // default: false
  can_give_discount: boolean;            // default: false
  can_view_all_branches: boolean;        // default: false
  can_close_register: boolean;           // default: true
  can_reopen_closing: boolean;           // default: false
  can_adjust_stock: boolean;             // default: false
  can_import_prices: boolean;            // default: false
  can_manage_users: boolean;             // default: false
  can_view_reports: boolean;             // default: false
  can_view_financials: boolean;          // default: false
  can_manage_suppliers: boolean;         // default: false
  can_manage_products: boolean;          // default: false
  can_issue_invoice_a: boolean;          // default: false
  max_discount_percent: Decimal;         // default: 0
}

// Create role DTO
export interface CreateRoleRequest {
  name: string;
  description?: string;
  can_void_sale?: boolean;
  can_give_discount?: boolean;
  can_view_all_branches?: boolean;
  can_close_register?: boolean;
  can_reopen_closing?: boolean;
  can_adjust_stock?: boolean;
  can_import_prices?: boolean;
  can_manage_users?: boolean;
  can_view_reports?: boolean;
  can_view_financials?: boolean;
  can_manage_suppliers?: boolean;
  can_manage_products?: boolean;
  can_issue_invoice_a?: boolean;
  max_discount_percent?: number;
}

// Update role DTO
export type UpdateRoleRequest = Partial<CreateRoleRequest>;

// Permissions object for frontend authorization
export interface RolePermissions {
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
}

// Predefined role names
export type PredefinedRoleName = 'OWNER' | 'MANAGER' | 'CASHIER' | 'SELLER';
