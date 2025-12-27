import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchInventoryReport } from '../../store/slices/reportsSlice';

const InventoryReport: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { inventoryReport, loading, error } = useSelector((state: RootState) => state.reports);

  const [filters, setFilters] = useState({
    branch_id: '',
    low_stock_only: false
  });

  useEffect(() => {
    dispatch(fetchInventoryReport(filters));
  }, [dispatch, filters]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.low_stock_only}
            onChange={(e) => setFilters({ ...filters, low_stock_only: e.target.checked })}
            className="w-4 h-4 text-primary-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary-500"
          />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Solo Stock Bajo</span>
        </label>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary-600"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">Error: {error}</p>
        </div>
      ) : inventoryReport ? (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resumen</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{inventoryReport.summary?.total_items}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor Costo</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatCurrency(inventoryReport.summary?.total_cost_value || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Valor Venta</p>
                <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{formatCurrency(inventoryReport.summary?.total_retail_value || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Stock Bajo</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{inventoryReport.summary?.low_stock_count}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sucursal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Stock Mínimo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Valor Costo</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {inventoryReport.inventory?.map((item: any, idx: number) => (
                    <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${item.is_low ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{item.product}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">{item.branch}</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${item.is_low ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{item.min_stock}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatCurrency(item.cost_value)}</td>
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

export default InventoryReport;
