import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import slices
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import posReducer from './slices/posSlice';
import productsReducer from './slices/productsSlice';
import customersReducer from './slices/customersSlice';
import registersReducer from './slices/registersSlice';
import alertsReducer from './slices/alertsSlice';
import reportsReducer from './slices/reportsSlice';
import stockReducer from './slices/stockSlice';
import priceReducer from './slices/priceSlice';
import loyaltyReducer from './slices/loyaltySlice';
import dashboardReducer from './slices/dashboardSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    pos: posReducer,
    products: productsReducer,
    customers: customersReducer,
    registers: registersReducer,
    alerts: alertsReducer,
    reports: reportsReducer,
    stock: stockReducer,
    price: priceReducer,
    loyalty: loyaltyReducer,
    dashboard: dashboardReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: import.meta.env.DEV,
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Use throughout your app instead of plain `useDispatch` and `useSelector`
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
