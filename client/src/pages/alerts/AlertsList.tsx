import React from 'react';

interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  branch?: {
    name: string;
    code: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

interface AlertsListProps {
  alerts: Alert[];
  onMarkAsRead: (alertId: string) => void;
  pagination: Pagination | null;
  onPageChange: (page: number) => void;
}

const AlertsList: React.FC<AlertsListProps> = ({ alerts, onMarkAsRead, pagination, onPageChange }) => {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityColors = (severity: string) => {
    const colors: { [key: string]: { bg: string; text: string; border: string } } = {
      INFO: { bg: 'bg-blue-50 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' },
      LOW: { bg: 'bg-green-50 dark:bg-green-900/20', text: 'text-green-700 dark:text-green-300', border: 'border-green-200 dark:border-green-800' },
      MEDIUM: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-200 dark:border-yellow-800' },
      WARNING: { bg: 'bg-orange-50 dark:bg-orange-900/20', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
      HIGH: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
      ERROR: { bg: 'bg-red-50 dark:bg-red-900/20', text: 'text-red-700 dark:text-red-300', border: 'border-red-200 dark:border-red-800' },
      CRITICAL: { bg: 'bg-red-100 dark:bg-red-900/40', text: 'text-red-800 dark:text-red-200', border: 'border-red-300 dark:border-red-700' }
    };
    return colors[severity] || colors.MEDIUM;
  };

  return (
    <div className="space-y-4">
      {alerts && alerts.length > 0 ? (
        <>
          {alerts.map((alert, index) => {
            const colors = getSeverityColors(alert.severity);
            const animationClass = index % 4 === 0 ? 'animate-fade-right' : index % 4 === 1 ? 'animate-fade-left' : index % 4 === 2 ? 'animate-fade-up' : 'animate-zoom-in';
            const durationClass = index % 3 === 0 ? 'duration-fast' : index % 3 === 1 ? 'duration-normal' : 'duration-light-slow';
            return (
              <div
                key={alert.id}
                className={`bg-white dark:bg-gray-800 rounded-sm shadow-md border-l-4 ${colors.border} ${alert.is_read ? 'opacity-75' : ''} ${animationClass} ${durationClass}`}
              >
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                      {alert.severity}
                    </span>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {alert.alert_type.replace(/_/g, ' ')}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                      {formatDate(alert.created_at)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{alert.title}</h3>
                    <p className="text-gray-700 dark:text-gray-300">{alert.message}</p>
                    {alert.branch && (
                      <span className="inline-block text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded">
                        Sucursal: {alert.branch.name}
                      </span>
                    )}
                  </div>
                  {!alert.is_read && (
                    <button
                      onClick={() => onMarkAsRead(alert.id)}
                      className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-sm hover:bg-primary-600 transition-colors text-sm font-medium"
                    >
                      Marcar como Leída
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {pagination && pagination.total_pages > 1 && (
            <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-4">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => onPageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Página {pagination.page} de {pagination.total_pages}
                </span>
                <button
                  onClick={() => onPageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.total_pages}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-sm hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-8 text-center">
          <p className="text-gray-600 dark:text-gray-400">No hay alertas</p>
        </div>
      )}
    </div>
  );
};

export default AlertsList;
