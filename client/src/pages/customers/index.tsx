import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  loadCustomers,
  createCustomer,
  updateCustomer,
} from '../../store/slices/customersSlice';
import { Card, Button, Input } from '../../components/ui';
import { CustomersTable } from './CustomersTable';
import { CustomerFormModal } from './CustomerFormModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import type { Customer } from '../../types';
import type { CustomerFormData } from './CustomerFormModal';

const initialFormData: CustomerFormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  document_type: 'DNI',
  document_number: '',
  tax_condition: 'CONSUMIDOR_FINAL',
  company_name: '',
  address: '',
  city: '',
  postal_code: '',
  notes: '',
};

const CustomersPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { customers, loading, totalCustomers, limit } = useAppSelector((state) => state.customers);

  // Local state
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load customers
  useEffect(() => {
    dispatch(loadCustomers({
      page: currentPage,
      limit: 20,
      search: search || undefined,
    }));
  }, [dispatch, currentPage, search]);

  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Open create modal
  const handleCreate = () => {
    setEditingCustomer(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || '',
      document_type: customer.document_type || 'DNI',
      document_number: customer.document_number || '',
      tax_condition: customer.tax_condition || 'CONSUMIDOR_FINAL',
      company_name: customer.company_name || '',
      address: customer.address || '',
      city: customer.city || '',
      postal_code: customer.postal_code || '',
      notes: customer.notes || '',
    });
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const customerData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email || undefined,
      phone: formData.phone || undefined,
      document_type: formData.document_type,
      document_number: formData.document_number || undefined,
      tax_condition: formData.tax_condition,
      company_name: formData.company_name || undefined,
      address: formData.address || undefined,
      city: formData.city || undefined,
      postal_code: formData.postal_code || undefined,
      notes: formData.notes || undefined,
    };

    if (editingCustomer) {
      const result = await dispatch(updateCustomer({
        id: editingCustomer.id,
        data: customerData,
      }));
      if (updateCustomer.fulfilled.match(result)) {
        setShowModal(false);
      }
    } else {
      const result = await dispatch(createCustomer(customerData));
      if (createCustomer.fulfilled.match(result)) {
        setShowModal(false);
      }
    }
  }, [dispatch, editingCustomer, formData]);

  // Delete customer
  const handleDelete = useCallback(async (_id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este cliente?')) {
      // TODO: Implement deleteCustomer in customersSlice
      console.error('Delete customer not implemented yet');
    }
  }, [dispatch]);

  // View customer details
  const handleViewDetails = (customer: Customer) => {
    setSelectedCustomer(customer);
    setShowDetailModal(true);
  };

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-down duration-fast">
          <div className="animate-fade-right duration-normal">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Clientes
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Gestiona los clientes y su información
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleCreate}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
            iconPosition="left"
          >
            Nuevo Cliente
          </Button>
        </div>

        {/* Search */}
        <Card className="p-4 animate-fade-up duration-normal">
          <Input
            placeholder="Buscar por nombre, email, teléfono o documento..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            leftIcon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </Card>

        {/* Customers Table */}
        <Card className="overflow-hidden animate-fade-up duration-light-slow">
          <CustomersTable
            customers={customers}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
            onCreate={handleCreate}
          />

          {/* Pagination */}
          {!loading && customers.length > 0 && totalCustomers > limit && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mostrando {((currentPage - 1) * limit) + 1} a {Math.min(currentPage * limit, totalCustomers)} de {totalCustomers}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalCustomers / limit), p + 1))}
                  disabled={currentPage === Math.ceil(totalCustomers / limit)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        editingCustomer={editingCustomer}
        loading={loading}
      />

      {/* Customer Detail Modal */}
      <CustomerDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        customer={selectedCustomer}
        onEdit={handleEdit}
      />
    </>
  );
};

export default CustomersPage;
