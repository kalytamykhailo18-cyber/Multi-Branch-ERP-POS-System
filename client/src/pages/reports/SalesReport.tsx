import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchSalesReport } from '../../store/slices/reportsSlice';

const SalesReport: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { salesReport, loading, error } = useSelector((state: RootState) => state.reports);

  const [filters, setFilters] = useState<{
    branch_id?: string;
    start_date?: string;
    end_date?: string;
    group_by?: 'hour' | 'day' | 'week' | 'month';
  }>({
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
    group_by: 'day'
  });

  useEffect(() => {
    dispatch(fetchSalesReport(filters));
  }, [dispatch, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col flex-1 animate-fade-right duration-fast">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Desde:
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({ ...filters, start_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col flex-1 animate-fade-up duration-normal">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hasta:
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({ ...filters, end_date: e.target.value })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col flex-1 animate-fade-left duration-light-slow">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Agrupar por:
            </label>
            <select
              value={filters.group_by}
              onChange={(e) => setFilters({ ...filters, group_by: e.target.value as 'hour' | 'day' | 'week' | 'month' })}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="hour">Hora</option>
              <option value="day">Día</option>
              <option value="week">Semana</option>
              <option value="month">Mes</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-8 text-center animate-fade-up duration-normal">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm p-4 animate-fade-up duration-fast">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      ) : salesReport ? (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-up duration-normal">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 animate-fade-right duration-fast">Totales</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="animate-zoom-in duration-fast">
                <p className="text-sm text-gray-600 dark:text-gray-400">Ventas</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{salesReport.totals?.total_sales || 0}</p>
              </div>
              <div className="animate-zoom-in duration-normal">
                <p className="text-sm text-gray-600 dark:text-gray-400">Ingresos</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(salesReport.totals?.total_revenue || 0)}</p>
              </div>
              <div className="animate-zoom-in duration-light-slow">
                <p className="text-sm text-gray-600 dark:text-gray-400">Ticket Promedio</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(salesReport.totals?.average_ticket || 0)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md overflow-hidden animate-fade-up duration-light-slow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700 animate-fade-down duration-fast">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Período</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ventas</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ingresos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ticket Promedio</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {salesReport.data?.map((row: any, idx: number) => (
                    <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-700 animate-fade-right ${idx % 3 === 0 ? 'duration-fast' : idx % 3 === 1 ? 'duration-normal' : 'duration-light-slow'}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{new Date(row.period).toLocaleDateString('es-AR')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{row.sales_count}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(row.revenue)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(row.avg_ticket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default SalesReport;
