import React from 'react';

interface ShrinkageData {
  total_records: number;
  total_cost_loss: number;
}

interface ShrinkageSummaryProps {
  shrinkage: ShrinkageData;
}

const ShrinkageSummary: React.FC<ShrinkageSummaryProps> = ({ shrinkage }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Resumen de Mermas</h2>
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Registros de Merma:</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{shrinkage?.total_records || 0}</span>
        </div>
        <div className="flex justify-between items-center p-4 bg-danger-50 dark:bg-danger-900/10 rounded-lg">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Pérdida Total:</span>
          <span className="text-2xl font-bold text-danger-600 dark:text-danger-400">
            {formatCurrency(shrinkage?.total_cost_loss || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ShrinkageSummary;
