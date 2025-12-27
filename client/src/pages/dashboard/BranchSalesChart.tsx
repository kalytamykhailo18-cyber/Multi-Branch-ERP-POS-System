import React from 'react';

interface BranchSale {
  branch_id: string;
  total_sales: string;
  total_revenue: string;
  branch: {
    name: string;
    code: string;
  };
}

interface BranchSalesChartProps {
  salesByBranch: BranchSale[];
}

const BranchSalesChart: React.FC<BranchSalesChartProps> = ({ salesByBranch }) => {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Ventas por Sucursal</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sucursal</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ventas</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Ingresos</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {salesByBranch && salesByBranch.length > 0 ? (
              salesByBranch.map((branch) => (
                <tr key={branch.branch_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{branch.branch?.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{branch.branch?.code}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{branch.total_sales}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-success-600 dark:text-success-400">{formatCurrency(branch.total_revenue)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">No hay datos disponibles</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BranchSalesChart;
