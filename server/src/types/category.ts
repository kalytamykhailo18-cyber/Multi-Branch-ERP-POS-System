// Category types matching database schema
import { UUID, ISODateString, BaseEntity } from './common';

// Category entity matching categories table
export interface Category extends BaseEntity {
  parent_id: UUID | null;                // Self-reference for subcategories
  name: string;                          // max 100 chars
  description: string | null;            // TEXT
  sort_order: number;                    // default: 0
  is_active: boolean;                    // default: true
}

// Category with subcategories (tree structure)
export interface CategoryTree extends Category {
  subcategories: CategoryTree[];
  parent?: Category;
  products_count?: number;
}

// Flat category with path for display
export interface CategoryFlat extends Category {
  full_path: string;                     // e.g., "Alimento > Perros > Balanceado"
  depth: number;                         // 0 for root, 1 for first level, etc.
}

// Create category DTO
export interface CreateCategoryRequest {
  parent_id?: UUID | null;
  name: string;
  description?: string;
  sort_order?: number;
}

// Update category DTO
export interface UpdateCategoryRequest {
  parent_id?: UUID | null;
  name?: string;
  description?: string;
  sort_order?: number;
  is_active?: boolean;
}

// Category filter params
export interface CategoryFilterParams {
  parent_id?: UUID | null;
  is_active?: boolean;
  search?: string;
  include_products_count?: boolean;
}
