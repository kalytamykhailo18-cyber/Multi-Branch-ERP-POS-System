import React from 'react';
import { Modal, Button, Input } from '../../components/ui';
import type { StockItem } from '../../services/api/stock.service';

interface AdjustmentData {
  quantity: string;
  reason: string;
  type: 'adjustment' | 'shrinkage' | 'count';
}

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: StockItem | null;
  adjustmentData: AdjustmentData;
  onDataChange: (data: AdjustmentData) => void;
  onSubmit: () => void;
  loading: boolean;
}

const AdjustStockModal: React.FC<AdjustStockModalProps> = ({
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
      title="Ajustar Stock"
      size="sm"
    >
      <div className="space-y-4">
        {selectedItem && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="font-medium text-gray-900 dark:text-white">
              {selectedItem.product_name}
            </p>
            <p className="text-sm text-gray-500">
              Stock actual: {formatNumber(selectedItem.quantity)}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de Ajuste
          </label>
          <select
            value={adjustmentData.type}
            onChange={(e) => onDataChange({ ...adjustmentData, type: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="adjustment">Ajuste manual</option>
            <option value="count">Conteo físico</option>
            <option value="shrinkage">Merma</option>
          </select>
        </div>

        <Input
          label={adjustmentData.type === 'count' ? 'Cantidad contada' : 'Cantidad a ajustar'}
          type="number"
          value={adjustmentData.quantity}
          onChange={(e) => onDataChange({ ...adjustmentData, quantity: e.target.value })}
          placeholder={adjustmentData.type === 'count' ? 'Stock real' : '+10 o -5'}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Razón
          </label>
          <textarea
            value={adjustmentData.reason}
            onChange={(e) => onDataChange({ ...adjustmentData, reason: e.target.value })}
            rows={2}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
            placeholder="Motivo del ajuste..."
          />
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" fullWidth onClick={onSubmit} loading={loading}>
            Ajustar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdjustStockModal;
