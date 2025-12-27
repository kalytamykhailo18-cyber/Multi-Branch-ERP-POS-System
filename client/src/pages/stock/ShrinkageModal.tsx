import React from 'react';
import { Modal, Button, Input } from '../../components/ui';
import type { StockItem } from '../../services/api/stock.service';

interface AdjustmentData {
  quantity: string;
  reason: string;
  type: 'adjustment' | 'shrinkage' | 'count';
}

interface ShrinkageModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: StockItem | null;
  adjustmentData: AdjustmentData;
  onDataChange: (data: AdjustmentData) => void;
  onSubmit: () => void;
  loading: boolean;
}

const ShrinkageModal: React.FC<ShrinkageModalProps> = ({
  isOpen,
  onClose,
  selectedItem,
  adjustmentData,
  onDataChange,
  onSubmit,
  loading
}) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Merma"
      size="sm"
    >
      <div className="space-y-4">
        <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-sm">
          <p className="text-sm text-warning-800 dark:text-warning-300">
            Registra la merma de productos por pérdida de peso, polvo o porcionado.
            Este ajuste es rápido y no requiere aprobación.
          </p>
        </div>

        {selectedItem ? (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-sm">
            <p className="font-medium text-gray-900 dark:text-white">
              {selectedItem.product_name}
            </p>
            <p className="text-sm text-gray-500">
              Stock actual: {formatNumber(selectedItem.quantity)}
              {selectedItem.expected_shrinkage && ` • Merma esperada: ${selectedItem.expected_shrinkage}%`}
            </p>
          </div>
        ) : (
          <Input
            label="Buscar producto"
            placeholder="Nombre o SKU..."
          />
        )}

        <Input
          label="Cantidad perdida"
          type="number"
          value={adjustmentData.quantity}
          onChange={(e) => onDataChange({ ...adjustmentData, quantity: e.target.value })}
          placeholder="Ej: 0.5"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Razón (opcional)
          </label>
          <select
            value={adjustmentData.reason}
            onChange={(e) => onDataChange({ ...adjustmentData, reason: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
          >
            <option value="">Seleccionar razón</option>
            <option value="Merma por polvo">Merma por polvo</option>
            <option value="Merma por porcionado">Merma por porcionado</option>
            <option value="Diferencia de peso">Diferencia de peso</option>
            <option value="Producto dañado">Producto dañado</option>
            <option value="Otro">Otro</option>
          </select>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="warning" fullWidth onClick={onSubmit} loading={loading}>
            Registrar Merma
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ShrinkageModal;
