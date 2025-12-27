import React from 'react';
import { Modal, Input, Button } from '../../components/ui';
import type { Product } from '../../types';

interface QuantityModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  quantity: string;
  onQuantityChange: (value: string) => void;
  onSubmit: () => void;
  formatCurrency: (amount: number) => string;
}

const QuantityModal: React.FC<QuantityModalProps> = ({
  isOpen,
  onClose,
  product,
  quantity,
  onQuantityChange,
  onSubmit,
  formatCurrency,
}) => {
  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Agregar al carrito"
      size="sm"
    >
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {product.name}
          </h3>
          <p className="text-2xl font-bold text-primary-600 dark:text-primary-400 mt-2">
            {formatCurrency(Number(product.selling_price))}
          </p>
        </div>

        <Input
          label="Cantidad"
          type="number"
          min="0.01"
          step="0.01"
          value={quantity}
          onChange={(e) => onQuantityChange(e.target.value)}
          autoFocus
        />

        <div className="flex gap-3">
          <Button
            variant="secondary"
            fullWidth
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            variant="primary"
            fullWidth
            onClick={onSubmit}
          >
            Agregar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QuantityModal;
