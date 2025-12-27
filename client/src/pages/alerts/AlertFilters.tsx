import React from 'react';

interface Filters {
  alert_type: string;
  severity: string;
  is_read: string;
  start_date: string;
  end_date: string;
}

interface AlertFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
}

const AlertFilters: React.FC<AlertFiltersProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="flex flex-col animate-fade-up duration-fast">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo:
          </label>
          <select
            value={filters.alert_type}
            onChange={(e) => onFilterChange({ alert_type: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="VOIDED_SALE">Venta Anulada</option>
            <option value="CASH_DISCREPANCY">Discrepancia de Efectivo</option>
            <option value="LOW_STOCK">Stock Bajo</option>
            <option value="LATE_CLOSING">Cierre Tardío</option>
            <option value="REOPEN_REGISTER">Caja Reabierta</option>
            <option value="FAILED_INVOICE">Error de Factura</option>
            <option value="LARGE_DISCOUNT">Descuento Grande</option>
            <option value="HIGH_VALUE_SALE">Venta de Alto Valor</option>
            <option value="SYNC_ERROR">Error de Sincronización</option>
            <option value="LOGIN_FAILED">Error de Login</option>
            <option value="PRICE_CHANGE">Cambio de Precio</option>
          </select>
        </div>

        <div className="flex flex-col animate-fade-down duration-fast">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Severidad:
          </label>
          <select
            value={filters.severity}
            onChange={(e) => onFilterChange({ severity: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todas</option>
            <option value="INFO">Info</option>
            <option value="LOW">Baja</option>
            <option value="MEDIUM">Media</option>
            <option value="WARNING">Advertencia</option>
            <option value="HIGH">Alta</option>
            <option value="ERROR">Error</option>
            <option value="CRITICAL">Crítica</option>
          </select>
        </div>

        <div className="flex flex-col animate-zoom-in duration-normal">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estado:
          </label>
          <select
            value={filters.is_read}
            onChange={(e) => onFilterChange({ is_read: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todas</option>
            <option value="false">No Leídas</option>
            <option value="true">Leídas</option>
          </select>
        </div>

        <div className="flex flex-col animate-fade-right duration-normal">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Desde:
          </label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => onFilterChange({ start_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-col animate-fade-left duration-normal">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hasta:
          </label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => onFilterChange({ end_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default AlertFilters;
