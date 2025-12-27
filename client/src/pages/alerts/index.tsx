import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchAlerts, fetchUnreadCount, markAlertAsRead, markAllAlertsAsRead } from '../../store/slices/alertsSlice';
import AlertsList from './AlertsList';
import AlertFilters from './AlertFilters';
import UnreadBadge from './UnreadBadge';

const AlertsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { alerts, unreadCount, loading, error, pagination } = useSelector((state: RootState) => state.alerts);

  const [filters, setFilters] = useState({
    alert_type: '',
    severity: '',
    is_read: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    dispatch(fetchAlerts(filters));
    dispatch(fetchUnreadCount({}));
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  const handleMarkAsRead = (alertId: string) => {
    dispatch(markAlertAsRead(alertId));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAlertsAsRead({}));
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alertas</h1>
            <UnreadBadge count={unreadCount?.total || 0} />
          </div>
          <button
            onClick={handleMarkAllAsRead}
            className="px-4 py-2 bg-primary-500 text-white rounded-sm hover:bg-primary-600 transition-colors font-medium"
          >
            Marcar Todas como Leídas
          </button>
        </div>
      </div>

      <AlertFilters filters={filters} onFilterChange={handleFilterChange} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-gray-600 dark:text-gray-400">Cargando alertas...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-red-600 dark:text-red-400">Error: {error}</div>
        </div>
      ) : (
        <AlertsList
          alerts={alerts}
          onMarkAsRead={handleMarkAsRead}
          pagination={pagination}
          onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default AlertsPage;
