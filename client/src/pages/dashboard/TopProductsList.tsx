import React from 'react';

interface TopProduct {
  product_id: string;
  total_quantity: string;
  total_revenue: string;
  product: {
    name: string;
    sku: string;
  };
}

interface TopProductsListProps {
  products: TopProduct[];
}

const TopProductsList: React.FC<TopProductsListProps> = ({ products }) => {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Top 10 Productos Más Vendidos</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">#</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Producto</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">SKU</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cantidad</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ingresos</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {products && products.length > 0 ? (
              products.map((product, index) => (
                <tr key={product.product_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{index + 1}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{product.product?.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{product.product?.sku}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{parseFloat(product.total_quantity).toFixed(2)}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-success-600 dark:text-success-400">{formatCurrency(product.total_revenue)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No hay datos disponibles</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TopProductsList;
