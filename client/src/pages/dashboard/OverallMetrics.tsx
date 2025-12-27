import React from 'react';

interface OverallMetricsProps {
  totalSales: number;
  totalRevenue: number;
  averageTicket: number;
  branches: number;
}

const OverallMetrics: React.FC<OverallMetricsProps> = ({
  totalSales,
  totalRevenue,
  averageTicket,
  branches
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Sucursales Activas</h3>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-600 dark:text-primary-400 break-words">{branches}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Total Ventas</h3>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-success-600 dark:text-success-400 break-words">{totalSales}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Ingresos Totales</h3>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-success-600 dark:text-success-400 break-words">{formatCurrency(totalRevenue)}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 hover:shadow-lg transition-shadow">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Ticket Promedio</h3>
        <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-600 dark:text-primary-400 break-words">{formatCurrency(averageTicket)}</p>
      </div>
    </div>
  );
};

export default OverallMetrics;
