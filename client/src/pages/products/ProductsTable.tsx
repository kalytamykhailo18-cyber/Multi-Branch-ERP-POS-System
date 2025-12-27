import React from 'react';
import { Button } from '../../components/ui';
import type { Product } from '../../types';

interface ProductsTableProps {
  products: Product[];
  loading: boolean;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

export const ProductsTable: React.FC<ProductsTableProps> = ({
  products,
  loading,
  onEdit,
  onDelete,
  onCreate,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const getStockStatus = (product: Product) => {
    if (product.stock_quantity === undefined || product.stock_quantity === null) {
      return null;
    }
    if (product.stock_quantity <= 0) {
      return <span className="text-xs text-danger-500">Sin stock</span>;
    }
    if (product.stock_quantity <= 5) {
      return <span className="text-xs text-warning-500">Stock bajo</span>;
    }
    return <span className="text-xs text-green-500">{product.stock_quantity} en stock</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p>No hay productos</p>
        <Button variant="primary" className="mt-4" onClick={onCreate}>
          Crear primer producto
        </Button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Producto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Categoría
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Costo
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Precio
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Stock
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {products.map((product) => (
            <tr
              key={product.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-sm flex items-center justify-center">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-sm"
                      />
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      SKU: {product.sku || 'N/A'}
                    </p>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {product.category?.name || '-'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {formatCurrency(Number(product.cost_price || 0))}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(Number(product.selling_price || 0))}
                </span>
              </td>
              <td className="px-6 py-4 text-center">
                {getStockStatus(product)}
              </td>
              <td className="px-6 py-4 text-center">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.is_active
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {product.is_active ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(product)}
                    className="p-2 text-gray-400 hover:text-primary-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(product.id)}
                    className="p-2 text-gray-400 hover:text-danger-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
