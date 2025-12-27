import React, { useEffect, useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  loadProducts,
  loadCategories,
  createProduct,
  updateProduct,
} from '../../store/slices/productsSlice';
import { Card, Button, Input } from '../../components/ui';
import { ProductsTable } from './ProductsTable';
import { ProductFormModal } from './ProductFormModal';
import type { Product } from '../../types';
import type { ProductFormData } from './ProductFormModal';

const initialFormData: ProductFormData = {
  name: '',
  sku: '',
  barcode: '',
  description: '',
  category_id: '',
  cost_price: '',
  sell_price: '',
  tax_rate: '21',
  unit_type: 'unit',
  is_active: true,
  track_stock: true,
  min_stock: '5',
};

const ProductsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { products, categories, loading, totalProducts, limit } = useAppSelector((state) => state.products);
  // const { currentBranch } = useAppSelector((state) => state.auth);

  // Local state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [currentPage, setCurrentPage] = useState(1);

  // Load products and categories
  useEffect(() => {
    dispatch(loadCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(loadProducts({
      page: currentPage,
      limit: 20,
      search: search || undefined,
      category_id: selectedCategory || undefined,
    }));
  }, [dispatch, currentPage, search, selectedCategory]);

  // Handle form changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  // Open create modal
  const handleCreate = () => {
    setEditingProduct(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  // Open edit modal
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku || '',
      barcode: product.barcode || '',
      description: product.description || '',
      category_id: product.category_id || '',
      cost_price: product.cost_price?.toString() || '',
      sell_price: product.selling_price?.toString() || '',
      tax_rate: product.tax_rate?.toString() || '21',
      unit_type: 'unit',
      is_active: product.is_active ?? true,
      track_stock: true,
      min_stock: '5',
    });
    setShowModal(true);
  };

  // Submit form
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    const productData = {
      name: formData.name,
      sku: formData.sku || undefined,
      barcode: formData.barcode || undefined,
      description: formData.description || undefined,
      category_id: formData.category_id || undefined,
      cost_price: parseFloat(formData.cost_price) || 0,
      sell_price: parseFloat(formData.sell_price) || 0,
      tax_rate: parseFloat(formData.tax_rate) || 21,
      unit_type: formData.unit_type,
      is_active: formData.is_active,
      track_stock: formData.track_stock,
      min_stock: parseInt(formData.min_stock) || 5,
    };

    if (editingProduct) {
      const result = await dispatch(updateProduct({
        id: editingProduct.id,
        data: productData,
      }));
      if (updateProduct.fulfilled.match(result)) {
        setShowModal(false);
      }
    } else {
      const result = await dispatch(createProduct(productData));
      if (createProduct.fulfilled.match(result)) {
        setShowModal(false);
      }
    }
  }, [dispatch, editingProduct, formData]);

  // Delete product
  const handleDelete = useCallback(async (_id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este producto?')) {
      // TODO: Implement deleteProduct in productsSlice
      console.error('Delete product not implemented yet');
    }
  }, [dispatch]);

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-down duration-fast">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-right duration-normal">
              Productos
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 animate-fade-right duration-light-slow">
              Gestiona el catálogo de productos
            </p>
          </div>

          <Button
            variant="primary"
            onClick={handleCreate}
            className="animate-zoom-in duration-normal"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            }
            iconPosition="left"
          >
            Nuevo Producto
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 animate-fade-up duration-normal">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 animate-fade-left duration-fast">
              <Input
                placeholder="Buscar por nombre, SKU o código..."
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
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent animate-fade-right duration-fast"
            >
              <option value="">Todas las categorías</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Products Table */}
        <Card className="overflow-hidden animate-fade-up duration-light-slow">
          <ProductsTable
            products={products}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCreate={handleCreate}
          />

          {/* Pagination */}
          {!loading && products.length > 0 && totalProducts > limit && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between animate-fade-up duration-normal">
              <p className="text-sm text-gray-500 dark:text-gray-400 animate-fade-right duration-fast">
                Mostrando {((currentPage - 1) * limit) + 1} a {Math.min(currentPage * limit, totalProducts)} de {totalProducts}
              </p>
              <div className="flex gap-2 animate-fade-left duration-fast">
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
                  onClick={() => setCurrentPage((p) => Math.min(Math.ceil(totalProducts / limit), p + 1))}
                  disabled={currentPage === Math.ceil(totalProducts / limit)}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSubmit={handleSubmit}
        formData={formData}
        onChange={handleFormChange}
        editingProduct={editingProduct}
        categories={categories}
        loading={loading}
      />
    </>
  );
};

export default ProductsPage;
