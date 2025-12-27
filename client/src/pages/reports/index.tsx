import React, { useState } from 'react';
import SalesReport from './SalesReport';
import ProductReport from './ProductReport';
import CashierReport from './CashierReport';
import InventoryReport from './InventoryReport';

const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'cashiers' | 'inventory'>('sales');

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-right duration-normal">Reportes</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md animate-fade-up duration-normal">
        <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-down duration-fast ${
              activeTab === 'sales'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('sales')}
          >
            Ventas
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-down duration-normal ${
              activeTab === 'products'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('products')}
          >
            Productos
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-down duration-light-slow ${
              activeTab === 'cashiers'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('cashiers')}
          >
            Cajeros
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-down duration-slow ${
              activeTab === 'inventory'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('inventory')}
          >
            Inventario
          </button>
        </div>
      </div>

      <div className="animate-zoom-in duration-normal">
        {activeTab === 'sales' && <SalesReport />}
        {activeTab === 'products' && <ProductReport />}
        {activeTab === 'cashiers' && <CashierReport />}
        {activeTab === 'inventory' && <InventoryReport />}
      </div>
    </div>
  );
};

export default ReportsPage;
