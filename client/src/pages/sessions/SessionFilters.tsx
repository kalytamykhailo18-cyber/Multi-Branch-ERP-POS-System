import React from 'react';

interface Filters {
  branch_id: string;
  status: string;
  start_date: string;
  end_date: string;
}

interface SessionFiltersProps {
  filters: Filters;
  onFilterChange: (filters: Partial<Filters>) => void;
}

const SessionFilters: React.FC<SessionFiltersProps> = ({ filters, onFilterChange }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Estado:
          </label>
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">Todos</option>
            <option value="OPEN">Abierto</option>
            <option value="CLOSED">Cerrado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Desde:
          </label>
          <input
            type="date"
            value={filters.start_date}
            onChange={(e) => onFilterChange({ start_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Hasta:
          </label>
          <input
            type="date"
            value={filters.end_date}
            onChange={(e) => onFilterChange({ end_date: e.target.value })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );
};

export default SessionFilters;
