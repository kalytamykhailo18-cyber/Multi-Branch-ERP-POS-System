import React from 'react';
import { Card, Input } from '../../components/ui';
import type { StockItem } from '../../services/api/stock.service';

interface StockInventoryListProps {
  stock: StockItem[];
  search: string;
  onSearchChange: (value: string) => void;
  showLowStock: boolean;
  onShowLowStockChange: (checked: boolean) => void;
  onAdjust: (item: StockItem) => void;
  onShrinkage: (item: StockItem) => void;
  loading: boolean;
}

const StockInventoryList: React.FC<StockInventoryListProps> = ({
  stock,
  search,
  onSearchChange,
  showLowStock,
  onShowLowStockChange,
  onAdjust,
  onShrinkage,
  loading
}) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  const filteredStock = stock.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.product_name.toLowerCase().includes(searchLower) ||
      item.product_sku?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Buscar producto..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={showLowStock}
              onChange={(e) => onShowLowStockChange(e.target.checked)}
              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Solo stock bajo
            </span>
          </label>
        </div>
      </Card>

      {/* Stock Table */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : filteredStock.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No hay productos en el inventario</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Actual</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Mín / Máx</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Merma %</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStock.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {item.product_name}
                        </p>
                        <p className="text-sm text-gray-500">SKU: {item.product_sku}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`text-lg font-bold ${
                        item.quantity <= 0 ? 'text-danger-500' :
                        item.quantity <= 0 ? 'text-warning-500' : 'text-gray-900 dark:text-white'
                      }`}>
                        {formatNumber(item.quantity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {0} / {999}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {item.expected_shrinkage ? `${item.expected_shrinkage}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {item.quantity <= 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400">
                          Sin stock
                        </span>
                      ) : item.quantity <= 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400">
                          Stock bajo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                          OK
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => onAdjust(item)}
                          className="p-2 text-gray-400 hover:text-primary-500"
                          title="Ajustar stock"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onShrinkage(item)}
                          className="p-2 text-gray-400 hover:text-warning-500"
                          title="Registrar merma"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
};

export default StockInventoryList;
