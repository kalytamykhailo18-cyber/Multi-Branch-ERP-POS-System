import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { UUID } from '../../types';
import {
  priceService,
  PriceImportBatch,
  PriceImportItem,
  PriceHistory,
  Supplier,
} from '../../services/api/price.service';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface PriceState {
  currentBatch: PriceImportBatch | null;
  batchItems: PriceImportItem[];
  batches: PriceImportBatch[];
  history: PriceHistory[];
  suppliers: Supplier[];
  uploadProgress: number;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const initialState: PriceState = {
  currentBatch: null,
  batchItems: [],
  batches: [],
  history: [],
  suppliers: [],
  uploadProgress: 0,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
  },
};

// Async Thunks
export const uploadPriceFile = createAsyncThunk<
  PriceImportBatch,
  FormData,
  { rejectValue: string }
>(
  'price/uploadFile',
  async (formData, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      dispatch(setUploadProgress(0));

      const response = await priceService.uploadFile(formData, (progress) => {
        dispatch(setUploadProgress(progress));
      });

      if (!response.success) {
        throw new Error('Failed to upload file');
      }

      dispatch(showToast({ message: 'Archivo procesado correctamente', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al procesar archivo', type: 'error' }));
      return rejectWithValue('Error al procesar archivo');
    } finally {
      dispatch(stopLoading());
      dispatch(setUploadProgress(0));
    }
  }
);

export const loadBatch = createAsyncThunk<
  PriceImportBatch,
  UUID,
  { rejectValue: string }
>(
  'price/loadBatch',
  async (batchId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await priceService.getBatch(batchId);

      if (!response.success) {
        throw new Error('Failed to load batch');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error al cargar lote');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadBatchItems = createAsyncThunk<
  { items: PriceImportItem[]; total: number },
  {
    batchId: UUID;
    match_status?: string;
    search?: string;
    page?: number;
    limit?: number;
  },
  { rejectValue: string }
>(
  'price/loadBatchItems',
  async ({ batchId, ...params }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await priceService.getBatchItems(batchId, params);

      if (!response.success) {
        throw new Error('Failed to load batch items');
      }

      return {
        items: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error al cargar items del lote');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadBatches = createAsyncThunk<
  { batches: PriceImportBatch[]; total: number },
  {
    status?: string;
    supplier_id?: UUID;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  } | void,
  { rejectValue: string }
>(
  'price/loadBatches',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await priceService.getBatches(params || {});

      if (!response.success) {
        throw new Error('Failed to load batches');
      }

      return {
        batches: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error al cargar lotes');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const updateBatchConfig = createAsyncThunk<
  PriceImportBatch,
  {
    batchId: UUID;
    margin_percentage?: number;
    rounding_rule?: 'NONE' | 'UP' | 'DOWN' | 'NEAREST';
    rounding_value?: number;
  },
  { rejectValue: string }
>(
  'price/updateBatchConfig',
  async ({ batchId, ...data }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await priceService.updateBatchConfig(batchId, data);

      if (!response.success) {
        throw new Error('Failed to update config');
      }

      // Recalculate prices
      await priceService.recalculate(batchId);

      dispatch(showToast({ message: 'Configuración actualizada', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al actualizar configuración', type: 'error' }));
      return rejectWithValue('Error al actualizar configuración');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const matchItem = createAsyncThunk<
  PriceImportItem,
  { itemId: UUID; productId: UUID },
  { rejectValue: string }
>(
  'price/matchItem',
  async ({ itemId, productId }, { dispatch, rejectWithValue }) => {
    try {
      const response = await priceService.matchItem(itemId, productId);

      if (!response.success) {
        throw new Error('Failed to match item');
      }

      dispatch(showToast({ message: 'Producto asociado', type: 'success' }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al asociar producto', type: 'error' }));
      return rejectWithValue('Error al asociar producto');
    }
  }
);

export const toggleItemSelection = createAsyncThunk<
  PriceImportItem,
  { itemId: UUID; selected: boolean },
  { rejectValue: string }
>(
  'price/toggleItemSelection',
  async ({ itemId, selected }, { rejectWithValue }) => {
    try {
      const response = await priceService.toggleItemSelection(itemId, selected);

      if (!response.success) {
        throw new Error('Failed to toggle selection');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error al cambiar selección');
    }
  }
);

export const selectAllItems = createAsyncThunk<
  number,
  { batchId: UUID; selected: boolean; match_status?: string },
  { rejectValue: string }
>(
  'price/selectAllItems',
  async ({ batchId, selected, match_status }, { rejectWithValue }) => {
    try {
      const response = await priceService.selectAllItems(batchId, selected, { match_status });

      if (!response.success) {
        throw new Error('Failed to select all');
      }

      return response.data.updated_count;
    } catch (error) {
      return rejectWithValue('Error al seleccionar items');
    }
  }
);

export const applyPrices = createAsyncThunk<
  { batch: PriceImportBatch; applied_count: number; skipped_count: number },
  UUID,
  { rejectValue: string }
>(
  'price/applyPrices',
  async (batchId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await priceService.apply(batchId);

      if (!response.success) {
        throw new Error('Failed to apply prices');
      }

      dispatch(showToast({
        message: `Precios aplicados: ${response.data.applied_count} productos actualizados`,
        type: 'success',
      }));
      return response.data;
    } catch (error) {
      dispatch(showToast({ message: 'Error al aplicar precios', type: 'error' }));
      return rejectWithValue('Error al aplicar precios');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const cancelBatch = createAsyncThunk<
  UUID,
  UUID,
  { rejectValue: string }
>(
  'price/cancelBatch',
  async (batchId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await priceService.cancel(batchId);

      if (!response.success) {
        throw new Error('Failed to cancel batch');
      }

      dispatch(showToast({ message: 'Importación cancelada', type: 'success' }));
      return batchId;
    } catch (error) {
      dispatch(showToast({ message: 'Error al cancelar importación', type: 'error' }));
      return rejectWithValue('Error al cancelar importación');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const revertPrices = createAsyncThunk<
  { batchId: UUID; reverted_count: number },
  UUID,
  { rejectValue: string }
>(
  'price/revertPrices',
  async (batchId, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await priceService.revert(batchId);

      if (!response.success) {
        throw new Error('Failed to revert prices');
      }

      dispatch(showToast({
        message: `Precios revertidos: ${response.data.reverted_count} productos`,
        type: 'success',
      }));
      return { batchId, reverted_count: response.data.reverted_count };
    } catch (error) {
      dispatch(showToast({ message: 'Error al revertir precios', type: 'error' }));
      return rejectWithValue('Error al revertir precios');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadPriceHistory = createAsyncThunk<
  { history: PriceHistory[]; total: number },
  {
    product_id?: UUID;
    import_batch_id?: UUID;
    start_date?: string;
    end_date?: string;
    page?: number;
    limit?: number;
  } | void,
  { rejectValue: string }
>(
  'price/loadHistory',
  async (params, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await priceService.getHistory(params || {});

      if (!response.success) {
        throw new Error('Failed to load history');
      }

      return {
        history: response.data,
        total: response.pagination?.total_items || response.data.length,
      };
    } catch (error) {
      return rejectWithValue('Error al cargar historial');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const loadSuppliers = createAsyncThunk<
  Supplier[],
  { search?: string; is_active?: boolean } | void,
  { rejectValue: string }
>(
  'price/loadSuppliers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await priceService.getSuppliers(params || {});

      if (!response.success) {
        throw new Error('Failed to load suppliers');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error al cargar proveedores');
    }
  }
);

const priceSlice = createSlice({
  name: 'price',
  initialState,
  reducers: {
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },

    setCurrentBatch: (state, action: PayloadAction<PriceImportBatch | null>) => {
      state.currentBatch = action.payload;
      if (!action.payload) {
        state.batchItems = [];
      }
    },

    updateItemInList: (state, action: PayloadAction<PriceImportItem>) => {
      const index = state.batchItems.findIndex((item) => item.id === action.payload.id);
      if (index >= 0) {
        state.batchItems[index] = action.payload;
      }
    },

    clearPriceState: (state) => {
      state.currentBatch = null;
      state.batchItems = [];
      state.batches = [];
      state.history = [];
      state.uploadProgress = 0;
    },

    clearError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    // Upload File
    builder
      .addCase(uploadPriceFile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadPriceFile.fulfilled, (state, action) => {
        state.currentBatch = action.payload;
        state.loading = false;
      })
      .addCase(uploadPriceFile.rejected, (state, action) => {
        state.error = action.payload || 'Error uploading file';
        state.loading = false;
      });

    // Load Batch
    builder.addCase(loadBatch.fulfilled, (state, action) => {
      state.currentBatch = action.payload;
    });

    // Load Batch Items
    builder
      .addCase(loadBatchItems.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadBatchItems.fulfilled, (state, action) => {
        state.batchItems = action.payload.items;
        state.pagination.total = action.payload.total;
        state.loading = false;
      })
      .addCase(loadBatchItems.rejected, (state, action) => {
        state.error = action.payload || 'Error loading items';
        state.loading = false;
      });

    // Load Batches
    builder.addCase(loadBatches.fulfilled, (state, action) => {
      state.batches = action.payload.batches;
    });

    // Update Batch Config
    builder.addCase(updateBatchConfig.fulfilled, (state, action) => {
      state.currentBatch = action.payload;
    });

    // Match Item
    builder.addCase(matchItem.fulfilled, (state, action) => {
      const index = state.batchItems.findIndex((item) => item.id === action.payload.id);
      if (index >= 0) {
        state.batchItems[index] = action.payload;
      }
    });

    // Toggle Selection
    builder.addCase(toggleItemSelection.fulfilled, (state, action) => {
      const index = state.batchItems.findIndex((item) => item.id === action.payload.id);
      if (index >= 0) {
        state.batchItems[index] = action.payload;
      }
    });

    // Select All
    builder.addCase(selectAllItems.fulfilled, () => {
      // Items will be reloaded after this action
    });

    // Apply Prices
    builder.addCase(applyPrices.fulfilled, (state, action) => {
      state.currentBatch = action.payload.batch;
    });

    // Cancel Batch
    builder.addCase(cancelBatch.fulfilled, (state, action) => {
      state.batches = state.batches.filter((b) => b.id !== action.payload);
      if (state.currentBatch?.id === action.payload) {
        state.currentBatch = null;
        state.batchItems = [];
      }
    });

    // Revert Prices
    builder.addCase(revertPrices.fulfilled, (state, action) => {
      const batchIndex = state.batches.findIndex((b) => b.id === action.payload.batchId);
      if (batchIndex >= 0) {
        state.batches[batchIndex].status = 'CANCELLED';
      }
      if (state.currentBatch?.id === action.payload.batchId) {
        state.currentBatch.status = 'CANCELLED';
      }
    });

    // Load History
    builder.addCase(loadPriceHistory.fulfilled, (state, action) => {
      state.history = action.payload.history;
    });

    // Load Suppliers
    builder.addCase(loadSuppliers.fulfilled, (state, action) => {
      state.suppliers = action.payload;
    });
  },
});

export const {
  setUploadProgress,
  setCurrentBatch,
  updateItemInList,
  clearPriceState,
  clearError,
} = priceSlice.actions;

export default priceSlice.reducer;
