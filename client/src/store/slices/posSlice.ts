import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';
import type {
  Cart,
  CartItem,
  POSProduct,
  Customer,
  PaymentMethod,
  Sale,
  SalePayment,
  UUID,
} from '../../types';
import { saleService, paymentService } from '../../services/api';
import { startLoading, stopLoading, showToast } from './uiSlice';

interface POSState {
  // Cart state
  cart: Cart;

  // Payment state
  paymentMethods: PaymentMethod[];
  payments: SalePayment[];
  isPaymentMode: boolean;

  // Quick search results
  searchResults: POSProduct[];
  searchQuery: string;

  // Current sale being processed
  currentSale: Sale | null;

  // Last completed sale (for receipt)
  lastSale: Sale | null;

  // POS mode
  mode: 'sale' | 'return' | 'exchange';

  // Error state
  error: string | null;

  // Loyalty points being redeemed
  loyaltyPointsToRedeem: number;

  // Credit being used
  creditToUse: number;
}

const emptyCart: Cart = {
  items: [],
  subtotal: 0,
  discount_type: undefined,
  discount_value: 0,
  discount_amount: 0,
  tax_amount: 0,
  total: 0,
};

const initialState: POSState = {
  cart: { ...emptyCart },
  paymentMethods: [],
  payments: [],
  isPaymentMode: false,
  searchResults: [],
  searchQuery: '',
  currentSale: null,
  lastSale: null,
  mode: 'sale',
  error: null,
  loyaltyPointsToRedeem: 0,
  creditToUse: 0,
};

// Helper to calculate cart totals
const calculateCartTotals = (cart: Cart): Cart => {
  let subtotal = 0;
  let taxAmount = 0;

  cart.items.forEach((item) => {
    subtotal += Number(item.subtotal);
    taxAmount += Number(item.tax_amount);
  });

  let discountAmount = 0;
  if (cart.discount_type === 'PERCENT' && cart.discount_value) {
    discountAmount = subtotal * (cart.discount_value / 100);
  } else if (cart.discount_type === 'FIXED' && cart.discount_value) {
    discountAmount = cart.discount_value;
  }

  // Apply wholesale discount if customer is wholesale
  if (cart.customer?.is_wholesale && cart.customer.wholesale_discount_percent) {
    const wholesaleDiscount = subtotal * (Number(cart.customer.wholesale_discount_percent) / 100);
    discountAmount += wholesaleDiscount;
  }

  const total = subtotal - discountAmount + taxAmount;

  return {
    ...cart,
    subtotal,
    discount_amount: discountAmount,
    tax_amount: taxAmount,
    total: Math.max(0, total),
  };
};

// Calculate item totals
const calculateItemTotals = (
  product: POSProduct,
  quantity: number,
  discountPercent: number = 0
): Omit<CartItem, 'id' | 'product_id' | 'product'> => {
  const unitPrice = Number(product.selling_price);
  const subtotal = unitPrice * quantity;
  const discountAmount = subtotal * (discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;

  let taxAmount = 0;
  if (product.tax_rate && !product.is_tax_included) {
    taxAmount = afterDiscount * (Number(product.tax_rate) / 100);
  }

  return {
    quantity,
    unit_price: unitPrice,
    discount_percent: discountPercent,
    discount_amount: discountAmount,
    tax_rate: Number(product.tax_rate) || 0,
    tax_amount: taxAmount,
    subtotal,
    total: afterDiscount + taxAmount,
  };
};

// Async Thunks
export const loadPaymentMethods = createAsyncThunk<PaymentMethod[], void, { rejectValue: string }>(
  'pos/loadPaymentMethods',
  async (_, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading());
      const response = await paymentService.getMethods();

      if (!response.success) {
        throw new Error('Failed to load payment methods');
      }

      return response.data;
    } catch (error) {
      return rejectWithValue('Error loading payment methods');
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const completeSale = createAsyncThunk<
  Sale,
  {
    branch_id: UUID;
    register_id: UUID;
    session_id: UUID;
  },
  { rejectValue: string }
>(
  'pos/completeSale',
  async (saleData, { getState, dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Procesando venta...'));

      const state = getState() as { pos: POSState };
      const { cart, payments } = state.pos;

      if (cart.items.length === 0) {
        throw new Error('Cart is empty');
      }

      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      if (totalPaid < Number(cart.total)) {
        throw new Error('Insufficient payment');
      }

      const salePayload = {
        ...saleData,
        customer_id: cart.customer?.id,
        items: cart.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: Number(item.unit_price),
          discount_percent: item.discount_percent,
        })),
        payments: payments.map((p) => ({
          payment_method_id: p.payment_method_id,
          amount: Number(p.amount),
          reference_number: p.reference_number,
        })),
        discount_type: cart.discount_type,
        discount_value: cart.discount_value,
      };

      const response = await saleService.create(salePayload);

      if (!response.success) {
        throw new Error(response.error || 'Failed to complete sale');
      }

      dispatch(showToast({
        type: 'success',
        message: `Venta ${response.data.sale_number} completada!`,
      }));

      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al procesar venta';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

export const voidSale = createAsyncThunk<
  Sale,
  { sale_id: UUID; reason: string },
  { rejectValue: string }
>(
  'pos/voidSale',
  async ({ sale_id, reason }, { dispatch, rejectWithValue }) => {
    try {
      dispatch(startLoading('Anulando venta...'));

      const response = await saleService.void(sale_id, reason);

      if (!response.success) {
        throw new Error(response.error || 'Failed to void sale');
      }

      dispatch(showToast({ type: 'success', message: 'Venta anulada' }));
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error al anular venta';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    } finally {
      dispatch(stopLoading());
    }
  }
);

const posSlice = createSlice({
  name: 'pos',
  initialState,
  reducers: {
    // Add item to cart
    addToCart: (state, action: PayloadAction<{ product: POSProduct; quantity?: number }>) => {
      const { product, quantity = 1 } = action.payload;

      // Check if product already in cart
      const existingIndex = state.cart.items.findIndex(
        (item) => item.product_id === product.id
      );

      if (existingIndex >= 0) {
        // Update quantity
        const existingItem = state.cart.items[existingIndex];
        const newQuantity = existingItem.quantity + quantity;
        const totals = calculateItemTotals(product, newQuantity, existingItem.discount_percent);

        state.cart.items[existingIndex] = {
          ...existingItem,
          ...totals,
        };
      } else {
        // Add new item
        const totals = calculateItemTotals(product, quantity);
        const newItem: CartItem = {
          id: uuidv4(),
          product_id: product.id,
          product,
          ...totals,
        };
        state.cart.items.push(newItem);
      }

      state.cart = calculateCartTotals(state.cart);
    },

    // Update item quantity
    updateCartItemQuantity: (
      state,
      action: PayloadAction<{ itemId: string; quantity: number }>
    ) => {
      const { itemId, quantity } = action.payload;
      const itemIndex = state.cart.items.findIndex((item) => item.id === itemId);

      if (itemIndex >= 0) {
        if (quantity <= 0) {
          // Remove item
          state.cart.items.splice(itemIndex, 1);
        } else {
          // Update quantity
          const item = state.cart.items[itemIndex];
          const totals = calculateItemTotals(item.product, quantity, item.discount_percent);
          state.cart.items[itemIndex] = { ...item, ...totals };
        }
        state.cart = calculateCartTotals(state.cart);
      }
    },

    // Apply item discount
    applyItemDiscount: (
      state,
      action: PayloadAction<{ itemId: string; discountPercent: number }>
    ) => {
      const { itemId, discountPercent } = action.payload;
      const itemIndex = state.cart.items.findIndex((item) => item.id === itemId);

      if (itemIndex >= 0) {
        const item = state.cart.items[itemIndex];
        const totals = calculateItemTotals(item.product, item.quantity, discountPercent);
        state.cart.items[itemIndex] = { ...item, ...totals };
        state.cart = calculateCartTotals(state.cart);
      }
    },

    // Remove item from cart
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.cart.items = state.cart.items.filter((item) => item.id !== action.payload);
      state.cart = calculateCartTotals(state.cart);
    },

    // Clear cart
    clearCart: (state) => {
      state.cart = { ...emptyCart };
      state.payments = [];
      state.isPaymentMode = false;
      state.loyaltyPointsToRedeem = 0;
      state.creditToUse = 0;
    },

    // Set customer
    setCustomer: (state, action: PayloadAction<Customer | undefined>) => {
      state.cart.customer = action.payload;
      state.cart = calculateCartTotals(state.cart);
    },

    // Apply cart discount
    applyCartDiscount: (
      state,
      action: PayloadAction<{ type: 'PERCENT' | 'FIXED'; value: number }>
    ) => {
      state.cart.discount_type = action.payload.type;
      state.cart.discount_value = action.payload.value;
      state.cart = calculateCartTotals(state.cart);
    },

    // Clear cart discount
    clearCartDiscount: (state) => {
      state.cart.discount_type = undefined;
      state.cart.discount_value = 0;
      state.cart = calculateCartTotals(state.cart);
    },

    // Enter payment mode
    enterPaymentMode: (state) => {
      if (state.cart.items.length > 0) {
        state.isPaymentMode = true;
      }
    },

    // Exit payment mode
    exitPaymentMode: (state) => {
      state.isPaymentMode = false;
      state.payments = [];
    },

    // Add payment
    addPayment: (state, action: PayloadAction<SalePayment>) => {
      state.payments.push(action.payload);
    },

    // Remove payment
    removePayment: (state, action: PayloadAction<number>) => {
      state.payments.splice(action.payload, 1);
    },

    // Update payment amount
    updatePaymentAmount: (
      state,
      action: PayloadAction<{ index: number; amount: number }>
    ) => {
      if (state.payments[action.payload.index]) {
        state.payments[action.payload.index].amount = action.payload.amount;
      }
    },

    // Clear payments
    clearPayments: (state) => {
      state.payments = [];
    },

    // Set search results
    setSearchResults: (state, action: PayloadAction<POSProduct[]>) => {
      state.searchResults = action.payload;
    },

    // Set search query
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },

    // Set POS mode
    setMode: (state, action: PayloadAction<'sale' | 'return' | 'exchange'>) => {
      state.mode = action.payload;
    },

    // Set loyalty points to redeem
    setLoyaltyPointsToRedeem: (state, action: PayloadAction<number>) => {
      state.loyaltyPointsToRedeem = action.payload;
    },

    // Set credit to use
    setCreditToUse: (state, action: PayloadAction<number>) => {
      state.creditToUse = action.payload;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset POS state (for new sale)
    resetPOS: (state) => {
      state.cart = { ...emptyCart };
      state.payments = [];
      state.isPaymentMode = false;
      state.currentSale = null;
      state.error = null;
      state.loyaltyPointsToRedeem = 0;
      state.creditToUse = 0;
      state.mode = 'sale';
    },
  },

  extraReducers: (builder) => {
    // Load Payment Methods
    builder.addCase(loadPaymentMethods.fulfilled, (state, action) => {
      state.paymentMethods = action.payload;
    });

    // Complete Sale
    builder
      .addCase(completeSale.pending, (state) => {
        state.error = null;
      })
      .addCase(completeSale.fulfilled, (state, action) => {
        state.lastSale = action.payload;
        state.currentSale = null;
        // Reset for next sale
        state.cart = { ...emptyCart };
        state.payments = [];
        state.isPaymentMode = false;
        state.loyaltyPointsToRedeem = 0;
        state.creditToUse = 0;
      })
      .addCase(completeSale.rejected, (state, action) => {
        state.error = action.payload || 'Error processing sale';
      });

    // Void Sale
    builder
      .addCase(voidSale.fulfilled, (state, action) => {
        if (state.lastSale?.id === action.payload.id) {
          state.lastSale = action.payload;
        }
      });
  },
});

export const {
  addToCart,
  updateCartItemQuantity,
  applyItemDiscount,
  removeFromCart,
  clearCart,
  setCustomer,
  applyCartDiscount,
  clearCartDiscount,
  enterPaymentMode,
  exitPaymentMode,
  addPayment,
  removePayment,
  updatePaymentAmount,
  clearPayments,
  setSearchResults,
  setSearchQuery,
  setMode,
  setLoyaltyPointsToRedeem,
  setCreditToUse,
  clearError,
  resetPOS,
} = posSlice.actions;

export default posSlice.reducer;
