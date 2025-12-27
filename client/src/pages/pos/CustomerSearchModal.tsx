import React from 'react';
import { Modal, Input, Button } from '../../components/ui';
import type { QuickSearchCustomer } from '../../types';

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  customers: QuickSearchCustomer[];
  loading: boolean;
  onSelectCustomer: (customer: QuickSearchCustomer) => void;
  debouncedSearch: string;
}

const CustomerSearchModal: React.FC<CustomerSearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  customers,
  loading,
  onSelectCustomer,
  debouncedSearch,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Buscar Cliente"
      size="md"
    >
      <div className="space-y-4">
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          autoFocus
        />

        <div className="max-h-80 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
          ) : customers.length > 0 ? (
            <div className="space-y-2">
              {customers.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectCustomer(c)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-left"
                >
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                      {c.first_name?.[0]}{c.last_name?.[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {c.first_name} {c.last_name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {c.email || c.phone}
                    </p>
                  </div>
                  {c.loyalty_points !== undefined && (
                    <span className="text-sm text-primary-500">
                      {c.loyalty_points} pts
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : debouncedSearch ? (
            <p className="text-center text-gray-500 py-8">
              No se encontraron clientes
            </p>
          ) : (
            <p className="text-center text-gray-500 py-8">
              Escribe para buscar clientes
            </p>
          )}
        </div>

        <Button
          variant="secondary"
          fullWidth
          onClick={onClose}
        >
          Continuar sin cliente
        </Button>
      </div>
    </Modal>
  );
};

export default CustomerSearchModal;
