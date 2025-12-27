import React from 'react';
import { Modal, Input, Button } from '../../components/ui';
import type { LoyaltyAccount } from '../../services/api/loyalty.service';

interface AdjustmentData {
  type: 'add' | 'subtract';
  points: string;
  reason: string;
}

interface AdjustPointsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: LoyaltyAccount | null;
  adjustmentData: AdjustmentData;
  onDataChange: (data: AdjustmentData) => void;
  onSubmit: () => void;
  loading: boolean;
}

const AdjustPointsModal: React.FC<AdjustPointsModalProps> = ({
  isOpen,
  onClose,
  customer,
  adjustmentData,
  onDataChange,
  onSubmit,
  loading,
}) => {
  if (!customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustar Puntos"
      size="sm"
    >
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
          <p className="font-medium text-gray-900 dark:text-white">
            {`${customer.first_name || ''} ${customer.last_name || ''}`.trim()}
          </p>
          <p className="text-2xl font-bold text-primary-500 mt-2">
            {customer.loyalty_points.toLocaleString()} puntos
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de ajuste
          </label>
          <select
            value={adjustmentData.type}
            onChange={(e) => onDataChange({ ...adjustmentData, type: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700"
          >
            <option value="add">Agregar puntos</option>
            <option value="subtract">Quitar puntos</option>
          </select>
        </div>

        <Input
          label="Cantidad de puntos"
          type="number"
          value={adjustmentData.points}
          onChange={(e) => onDataChange({ ...adjustmentData, points: e.target.value })}
          min="1"
        />

        <Input
          label="Razón"
          value={adjustmentData.reason}
          onChange={(e) => onDataChange({ ...adjustmentData, reason: e.target.value })}
          placeholder="Motivo del ajuste..."
        />

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

export default AdjustPointsModal;
