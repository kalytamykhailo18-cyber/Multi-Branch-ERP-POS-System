import React from 'react';

interface Discrepancy {
  branch_id: string;
  count: string;
  total_discrepancy: string;
  branch: {
    name: string;
    code: string;
  };
}

interface CashDiscrepanciesProps {
  discrepancies: Discrepancy[];
}

const CashDiscrepancies: React.FC<CashDiscrepanciesProps> = ({ discrepancies }) => {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(typeof amount === 'string' ? parseFloat(amount) : amount);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Discrepancias de Efectivo</h2>
      {discrepancies && discrepancies.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sucursal</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Cierres con Discrepancia</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total Discrepancia</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {discrepancies.map((disc) => (
                <tr
                  key={disc.branch_id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${parseFloat(disc.total_discrepancy) !== 0 ? 'bg-warning-50 dark:bg-warning-900/10' : ''}`}
                >
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{disc.branch?.name}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{disc.count}</td>
                  <td className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${parseFloat(disc.total_discrepancy) < 0 ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'}`}>
                    {formatCurrency(disc.total_discrepancy)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-8">No hay discrepancias registradas</p>
      )}
    </div>
  );
};

export default CashDiscrepancies;
