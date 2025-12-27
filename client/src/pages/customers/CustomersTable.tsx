import React from 'react';
import type { Customer } from '../../types';

interface CustomersTableProps {
  customers: Customer[];
  loading: boolean;
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onViewDetails: (customer: Customer) => void;
  onCreate: () => void;
}

export const CustomersTable: React.FC<CustomersTableProps> = ({
  customers,
  loading,
  onEdit,
  onDelete,
  onViewDetails,
  onCreate,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p>No hay clientes registrados</p>
        <button
          onClick={onCreate}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-sm hover:bg-primary-600"
        >
          Crear primer cliente
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Contacto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Documento
            </th>
            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Puntos
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Saldo
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
              onClick={() => onViewDetails(customer)}
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                      {customer.first_name?.[0]}{customer.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {customer.first_name} {customer.last_name}
                    </p>
                    {customer.company_name && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.company_name}
                      </p>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div>
                  {customer.email && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {customer.email}
                    </p>
                  )}
                  {customer.phone && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {customer.phone}
                    </p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                {customer.document_number ? (
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {customer.document_type}: {customer.document_number}
                  </p>
                ) : (
                  <span className="text-sm text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-center">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400">
                  {customer.loyalty_points || 0} pts
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <span className={`text-sm font-medium ${
                  Number(customer.credit_balance || 0) < 0
                    ? 'text-danger-500'
                    : Number(customer.credit_balance || 0) > 0
                    ? 'text-green-500'
                    : 'text-gray-500'
                }`}>
                  {formatCurrency(Number(customer.credit_balance || 0))}
                </span>
              </td>
              <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => onEdit(customer)}
                    className="p-2 text-gray-400 hover:text-primary-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDelete(customer.id)}
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
