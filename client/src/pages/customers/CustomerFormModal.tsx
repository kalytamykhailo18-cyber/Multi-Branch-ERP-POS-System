import React from 'react';
import { Modal, Button, Input } from '../../components/ui';
import type { Customer } from '../../types';

export interface CustomerFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  document_type: string;
  document_number: string;
  tax_condition: string;
  company_name: string;
  address: string;
  city: string;
  postal_code: string;
  notes: string;
}

interface CustomerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: CustomerFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  editingCustomer: Customer | null;
  loading: boolean;
}

export const CustomerFormModal: React.FC<CustomerFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  editingCustomer,
  loading,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            name="first_name"
            value={formData.first_name}
            onChange={onChange}
            required
          />
          <Input
            label="Apellido *"
            name="last_name"
            value={formData.last_name}
            onChange={onChange}
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={onChange}
          />
          <Input
            label="Teléfono"
            name="phone"
            value={formData.phone}
            onChange={onChange}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Documento
            </label>
            <select
              name="document_type"
              value={formData.document_type}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="DNI">DNI</option>
              <option value="CUIT">CUIT</option>
              <option value="CUIL">CUIL</option>
              <option value="PASSPORT">Pasaporte</option>
              <option value="OTHER">Otro</option>
            </select>
          </div>
          <Input
            label="Número de Documento"
            name="document_number"
            value={formData.document_number}
            onChange={onChange}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Condición Fiscal
            </label>
            <select
              name="tax_condition"
              value={formData.tax_condition}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="CONSUMIDOR_FINAL">Consumidor Final</option>
              <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
              <option value="MONOTRIBUTO">Monotributo</option>
              <option value="EXENTO">Exento</option>
            </select>
          </div>
          <Input
            label="Razón Social"
            name="company_name"
            value={formData.company_name}
            onChange={onChange}
          />
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
          <h3 className="font-medium text-gray-900 dark:text-white mb-4">Dirección</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Input
                label="Dirección"
                name="address"
                value={formData.address}
                onChange={onChange}
              />
            </div>
            <Input
              label="Ciudad"
              name="city"
              value={formData.city}
              onChange={onChange}
            />
            <Input
              label="Código Postal"
              name="postal_code"
              value={formData.postal_code}
              onChange={onChange}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notas
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={onChange}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            fullWidth
            loading={loading}
          >
            {editingCustomer ? 'Guardar Cambios' : 'Crear Cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
