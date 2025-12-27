import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './store';
import { getCurrentUser, initializeAuth } from './store/slices/authSlice';
import { GlobalLoader, Toast } from './components/ui';
import { socketService } from './services/socket.service';
import MainLayout from './components/layout/MainLayout';

// Lazy load pages
const LoginPage = React.lazy(() => import('./pages/auth/LoginPage'));
const PINLoginPage = React.lazy(() => import('./pages/auth/PINLoginPage'));
const DashboardPage = React.lazy(() => import('./pages/dashboard'));
const POSPage = React.lazy(() => import('./pages/pos'));
const ProductsPage = React.lazy(() => import('./pages/products'));
const CustomersPage = React.lazy(() => import('./pages/customers'));
const ReportsPage = React.lazy(() => import('./pages/reports'));
const SessionsPage = React.lazy(() => import('./pages/sessions'));
const AlertsPage = React.lazy(() => import('./pages/alerts'));
const SettingsPage = React.lazy(() => import('./pages/settings'));
const StockPage = React.lazy(() => import('./pages/stock'));
const PriceImportPage = React.lazy(() => import('./pages/prices'));
const LoyaltyPage = React.lazy(() => import('./pages/loyalty'));

// Loading fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
  </div>
);

// Protected Route wrapper component using Outlet
const ProtectedRoute: React.FC = () => {
  const { isAuthenticated, token } = useAppSelector((state) => state.auth);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (!isAuthenticated) {
    // Token exists but user not loaded yet - show loader
    return <PageLoader />;
  }

  return <Outlet />;
};

// Layout wrapper component using Outlet
const LayoutWrapper: React.FC = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

// Auth check and socket connection
const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useAppDispatch();
  const { token, isAuthenticated } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  useEffect(() => {
    if (token && !isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [token, isAuthenticated, dispatch]);

  useEffect(() => {
    if (token && isAuthenticated) {
      socketService.connect(token);
    } else {
      socketService.disconnect();
    }

    return () => {
      socketService.disconnect();
    };
  }, [token, isAuthenticated]);

  return <>{children}</>;
};

// Main App Router
const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalLoader />
        <Toast />
        <React.Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pin-login" element={<PINLoginPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              {/* POS route - full screen without layout */}
              <Route path="/pos" element={<POSPage />} />

              {/* Routes with MainLayout */}
              <Route element={<LayoutWrapper />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/products/*" element={<ProductsPage />} />
                <Route path="/customers/*" element={<CustomersPage />} />
                <Route path="/reports/*" element={<ReportsPage />} />
                <Route path="/sessions/*" element={<SessionsPage />} />
                <Route path="/alerts" element={<AlertsPage />} />
                <Route path="/settings/*" element={<SettingsPage />} />
                <Route path="/stock/*" element={<StockPage />} />
                <Route path="/prices/*" element={<PriceImportPage />} />
                <Route path="/loyalty/*" element={<LoyaltyPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>
            </Route>
          </Routes>
        </React.Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

// Root App with Redux Provider
const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppRouter />
    </Provider>
  );
};

export default App;
