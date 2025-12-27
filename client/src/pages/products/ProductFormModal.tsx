import React from 'react';
import { Modal, Button, Input } from '../../components/ui';
import type { Product, Category } from '../../types';

export interface ProductFormData {
  name: string;
  sku: string;
  barcode: string;
  description: string;
  category_id: string;
  cost_price: string;
  sell_price: string;
  tax_rate: string;
  unit_type: string;
  is_active: boolean;
  track_stock: boolean;
  min_stock: string;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  formData: ProductFormData;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  editingProduct: Product | null;
  categories: Category[];
  loading: boolean;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onChange,
  editingProduct,
  categories,
  loading,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
      size="lg"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nombre *"
            name="name"
            value={formData.name}
            onChange={onChange}
            required
          />
          <Input
            label="SKU"
            name="sku"
            value={formData.sku}
            onChange={onChange}
            placeholder="Código interno"
          />
          <Input
            label="Código de Barras"
            name="barcode"
            value={formData.barcode}
            onChange={onChange}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoría
            </label>
            <select
              name="category_id"
              value={formData.category_id}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Sin categoría</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
          <Input
            label="Precio de Costo"
            name="cost_price"
            type="number"
            min="0"
            step="0.01"
            value={formData.cost_price}
            onChange={onChange}
          />
          <Input
            label="Precio de Venta *"
            name="sell_price"
            type="number"
            min="0"
            step="0.01"
            value={formData.sell_price}
            onChange={onChange}
            required
          />
          <Input
            label="IVA %"
            name="tax_rate"
            type="number"
            min="0"
            max="100"
            value={formData.tax_rate}
            onChange={onChange}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipo de Unidad
            </label>
            <select
              name="unit_type"
              value={formData.unit_type}
              onChange={onChange}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="unit">Unidad</option>
              <option value="kg">Kilogramo</option>
              <option value="g">Gramo</option>
              <option value="l">Litro</option>
              <option value="ml">Mililitro</option>
            </select>
          </div>
          <Input
            label="Stock Mínimo"
            name="min_stock"
            type="number"
            min="0"
            value={formData.min_stock}
            onChange={onChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Descripción
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div className="flex gap-6">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={onChange}
              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Activo</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="track_stock"
              checked={formData.track_stock}
              onChange={onChange}
              className="w-4 h-4 text-primary-500 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Controlar Stock</span>
          </label>
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
            {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
