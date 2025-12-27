import { get, post, put, del } from './client';
import type { ApiResponse, PaginatedResponse, Category, Product, UUID } from '../../types';

export const categoryService = {
  /**
   * Get all categories with pagination
   */
  getAll: (params?: {
    page?: number;
    limit?: number;
    parent_id?: UUID | 'null';
    is_active?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<Category>> => {
    return get<Category[]>('/categories', params) as Promise<PaginatedResponse<Category>>;
  },

  /**
   * Get category tree (hierarchical structure)
   */
  getTree: (): Promise<ApiResponse<Category[]>> => {
    return get<Category[]>('/categories/tree');
  },

  /**
   * Get category by ID
   */
  getById: (id: UUID): Promise<ApiResponse<Category>> => {
    return get<Category>(`/categories/${id}`);
  },

  /**
   * Create new category
   */
  create: (data: Partial<Category>): Promise<ApiResponse<Category>> => {
    return post<Category>('/categories', data);
  },

  /**
   * Update category
   */
  update: (id: UUID, data: Partial<Category>): Promise<ApiResponse<Category>> => {
    return put<Category>(`/categories/${id}`, data);
  },

  /**
   * Deactivate category
   */
  deactivate: (id: UUID): Promise<ApiResponse<null>> => {
    return del<null>(`/categories/${id}`);
  },

  /**
   * Get products in category
   */
  getProducts: (categoryId: UUID, params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Product>> => {
    return get<Product[]>(`/categories/${categoryId}/products`, params) as Promise<PaginatedResponse<Product>>;
  },
};

export default categoryService;
