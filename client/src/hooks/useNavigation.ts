import { useNavigate as useRouterNavigate, useLocation } from 'react-router-dom';
import { useCallback } from 'react';

/**
 * Custom navigation hook as per rule.txt requirements.
 * All routing must be handled via useNavigation - no <a> or <Link> tags allowed.
 * State is preserved in Redux across different routes.
 */
export const useNavigation = () => {
  const navigate = useRouterNavigate();
  const location = useLocation();

  /**
   * Navigate to a new route
   * @param path - The path to navigate to
   * @param options - Optional navigation options
   */
  const goTo = useCallback(
    (path: string, options?: { replace?: boolean; state?: unknown }) => {
      navigate(path, options);
    },
    [navigate]
  );

  /**
   * Go back in history
   */
  const goBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  /**
   * Go forward in history
   */
  const goForward = useCallback(() => {
    navigate(1);
  }, [navigate]);

  /**
   * Navigate to login page
   */
  const goToLogin = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  /**
   * Navigate to POS page
   */
  const goToPOS = useCallback(() => {
    navigate('/pos');
  }, [navigate]);

  /**
   * Navigate to dashboard
   */
  const goToDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  /**
   * Navigate to reports
   */
  const goToReports = useCallback(
    (reportType?: string) => {
      navigate(reportType ? `/reports/${reportType}` : '/reports');
    },
    [navigate]
  );

  /**
   * Navigate to products
   */
  const goToProducts = useCallback(
    (productId?: string) => {
      navigate(productId ? `/products/${productId}` : '/products');
    },
    [navigate]
  );

  /**
   * Navigate to customers
   */
  const goToCustomers = useCallback(
    (customerId?: string) => {
      navigate(customerId ? `/customers/${customerId}` : '/customers');
    },
    [navigate]
  );

  /**
   * Navigate to inventory
   */
  const goToInventory = useCallback(() => {
    navigate('/inventory');
  }, [navigate]);

  /**
   * Navigate to settings
   */
  const goToSettings = useCallback(
    (section?: string) => {
      navigate(section ? `/settings/${section}` : '/settings');
    },
    [navigate]
  );

  /**
   * Navigate to register sessions
   */
  const goToSessions = useCallback(
    (sessionId?: string) => {
      navigate(sessionId ? `/sessions/${sessionId}` : '/sessions');
    },
    [navigate]
  );

  /**
   * Navigate to alerts
   */
  const goToAlerts = useCallback(() => {
    navigate('/alerts');
  }, [navigate]);

  /**
   * Check if current route matches
   */
  const isCurrentRoute = useCallback(
    (path: string) => {
      return location.pathname === path || location.pathname.startsWith(`${path}/`);
    },
    [location.pathname]
  );

  /**
   * Get current path
   */
  const currentPath = location.pathname;

  /**
   * Get state from navigation
   */
  const getState = <T = unknown>(): T | null => {
    return (location.state as T) || null;
  };

  return {
    goTo,
    goBack,
    goForward,
    goToLogin,
    goToPOS,
    goToDashboard,
    goToReports,
    goToProducts,
    goToCustomers,
    goToInventory,
    goToSettings,
    goToSessions,
    goToAlerts,
    isCurrentRoute,
    currentPath,
    getState,
  };
};

export default useNavigation;
