import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Product, Category, POSProduct, UUID } from '../../types';
import { productService, categoryService } from '../../services/api';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface ProductsState {
  // Products list
  products: Product[];
  posProducts: POSProduct[];
  totalProducts: number;

  // Categories
  categories: Category[];
  categoryTree: Category[];
  selectedCategory: UUID | null;

  // Search and filter
  searchQuery: string;
  filters: {
    category_id?: UUID;
    is_active?: boolean;
    is_weighable?: boolean;
  };

  // Pagination
  page: number;
  limit: number;

  // Loading states
  loading: boolean;
  error: string | null;
}

const initialState: ProductsState = {
  products: [],
  posProducts: [],
  totalProducts: 0,
  categories: [],
  categoryTree: [],
  selectedCategory: null,
  searchQuery: '',
  filters: {},
  page: 1,
  limit: 50,
  loading: false,
  error: null,
};

// Async Thunks
export const loadProducts = createAsyncThunk<
  { products: Product[]; total: number },
  { page?: number; limit?: number; search?: string; category_id?: UUID } | void,
  { rejectValue: string }
>(
  'products/loadProducts',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await productService.getAll(params || {});

      if (!response.success) {
        throw new Error('Failed to load products');
      }

      return {
        products: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error loading products');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadPOSProducts = createAsyncThunk<
  POSProduct[],
  { branch_id: UUID; category_id?: UUID; search?: string },
  { rejectValue: string }
>(
  'products/loadPOSProducts',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await productService.getForPOS(params);

      if (!response.success) {
        throw new Error('Failed to load POS products');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading products');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const searchProducts = createAsyncThunk<
  POSProduct[],
  { branch_id: UUID; query: string },
  { rejectValue: string }
>(
  'products/searchProducts',
  async ({ branch_id, query }, { rejectWithValue }) => {
    try {
      const response = await productService.getForPOS({
        branch_id,
        search: query,
      });

      if (!response.success) {
        throw new Error('Failed to search products');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error searching products');
    }
  }
);

export const getProductByBarcode = createAsyncThunk<
  Product,
  string,
  { rejectValue: string }
>(
  'products/getByBarcode',
  async (barcode, { dispatch, rejectWithValue }) => {
    try {
      const response = await productService.getByBarcode(barcode);

      if (!response.success) {
        throw new Error('Product not found');
      }

      return response.data;
    } catch (error) {
      dispatch(showToast({ type: 'error', message: 'Producto no encontrado' }));
      return rejectWithValue('Product not found');
    }
  }
);

export const loadCategories = createAsyncThunk<Category[], void, { rejectValue: string }>(
  'products/loadCategories',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await categoryService.getAll();

      if (!response.success) {
        throw new Error('Failed to load categories');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading categories');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadCategoryTree = createAsyncThunk<Category[], void, { rejectValue: string }>(
  'products/loadCategoryTree',
  async (_, { rejectWithValue }) => {
    try {
      const response = await categoryService.getTree();

      if (!response.success) {
        throw new Error('Failed to load category tree');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading categories');
    }
  }
);

export const createProduct = createAsyncThunk<
  Product,
  Partial<Product>,
  { rejectValue: string }
>(
  'products/create',
  async (productData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Creando producto...'));
      const response = await productService.create(productData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to create product');
      }

      dispatch(showToast({ type: 'success', message: 'Producto creado' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error creating product';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateProduct = createAsyncThunk<
  Product,
  { id: UUID; data: Partial<Product> },
  { rejectValue: string }
>(
  'products/update',
  async ({ id, data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Actualizando producto...'));
      const response = await productService.update(id, data);

      if (!response.success) {
        throw new Error(response.error || 'Failed to update product');
      }

      dispatch(showToast({ type: 'success', message: 'Producto actualizado' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error updating product';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    setSelectedCategory: (state, action: PayloadAction<UUID | null>) => {
      state.selectedCategory = action.payload;
    },

    setFilters: (state, action: PayloadAction<ProductsState['filters']>) => {
      state.filters = action.payload;
    },

    setPage: (state, action: PayloadAction<number>) => {
      state.page = action.payload;
    },

    clearProducts: (state) => {
      state.products = [];
      state.posProducts = [];
      state.totalProducts = 0;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Load Products
    builder
      .addCase(loadProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadProducts.fulfilled, (state, action) => {
        state.products = action.payload.products;
        state.totalProducts = action.payload.total;
        state.loading = false;
      })
      .addCase(loadProducts.rejected, (state, action) => {
        state.error = action.payload || 'Error loading products';
        state.loading = false;
      });

    // Load POS Products
    builder
      .addCase(loadPOSProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPOSProducts.fulfilled, (state, action) => {
        state.posProducts = action.payload;
        state.loading = false;
      })
      .addCase(loadPOSProducts.rejected, (state, action) => {
        state.error = action.payload || 'Error loading products';
        state.loading = false;
      });

    // Search Products
    builder.addCase(searchProducts.fulfilled, (state, action) => {
      state.posProducts = action.payload;
    });

    // Load Categories
    builder.addCase(loadCategories.fulfilled, (state, action) => {
      state.categories = action.payload;
    });

    // Load Category Tree
    builder.addCase(loadCategoryTree.fulfilled, (state, action) => {
      state.categoryTree = action.payload;
    });

    // Create Product
    builder.addCase(createProduct.fulfilled, (state, action) => {
      state.products.unshift(action.payload);
      state.totalProducts += 1;
    });

    // Update Product
    builder.addCase(updateProduct.fulfilled, (state, action) => {
      const index = state.products.findIndex((p) => p.id === action.payload.id);
      if (index >= 0) {
        state.products[index] = action.payload;
      }
    });
  },
});

export const {
  setSearchQuery,
  setSelectedCategory,
  setFilters,
  setPage,
  clearProducts,
  clearError,
} = productsSlice.actions;

export default productsSlice.reducer;
