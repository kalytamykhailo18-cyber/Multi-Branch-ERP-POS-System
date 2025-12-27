import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchCashierReport } from '../../store/slices/reportsSlice';

const CashierReport: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { cashierReport, loading, error } = useSelector((state: RootState) => state.reports);

  const [filters, setFilters] = useState({
    branch_id: '',
    start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    dispatch(fetchCashierReport(filters));
  }, [dispatch, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col flex-1">
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
          <div className="flex flex-col flex-1">
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
        </div>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-sm p-4">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      ) : cashierReport ? (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cajero</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ventas</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ingresos</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ticket Promedio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Discrepancia</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {cashierReport.cashiers?.map((cashier: any) => (
                  <tr key={cashier.cashier_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{cashier.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{cashier.total_sales}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(cashier.total_revenue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(cashier.average_ticket)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(cashier.total_discrepancy)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default CashierReport;
