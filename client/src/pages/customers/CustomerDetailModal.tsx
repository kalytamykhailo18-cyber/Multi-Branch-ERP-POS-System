import React from 'react';
import { Modal, Button } from '../../components/ui';
import type { Customer } from '../../types';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onEdit: (customer: Customer) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onEdit,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  if (!customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detalle del Cliente"
      size="md"
    >
      <div className="space-y-6 animate-fade-up duration-normal">
        {/* Customer info */}
        <div className="flex items-center gap-4 animate-zoom-in duration-fast">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
            <span className="text-primary-600 dark:text-primary-400 font-bold text-xl">
              {customer.first_name?.[0]}{customer.last_name?.[0]}
            </span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {customer.first_name} {customer.last_name}
            </h3>
            {customer.company_name && (
              <p className="text-gray-500 dark:text-gray-400">
                {customer.company_name}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-sm text-center animate-fade-right duration-normal">
            <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
              {customer.loyalty_points || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Puntos</p>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-sm text-center animate-fade-left duration-normal">
            <p className={`text-2xl font-bold ${
              Number(customer.credit_balance || 0) < 0 ? 'text-danger-500' : 'text-gray-900 dark:text-white'
            }`}>
              {formatCurrency(Number(customer.credit_balance || 0))}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Saldo</p>
          </div>
        </div>

        {/* Contact info */}
        <div className="space-y-3">
          {customer.email && (
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span className="text-gray-600 dark:text-gray-300">{customer.email}</span>
            </div>
          )}
          {customer.phone && (
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="text-gray-600 dark:text-gray-300">{customer.phone}</span>
            </div>
          )}
          {customer.document_number && (
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
              <span className="text-gray-600 dark:text-gray-300">
                {customer.document_type}: {customer.document_number}
              </span>
            </div>
          )}
          {customer.address && (
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-600 dark:text-gray-300">
                {customer.address}
                {customer.city && `, ${customer.city}`}
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => {
              onClose();
              onEdit(customer);
            }}
          >
            Editar
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
