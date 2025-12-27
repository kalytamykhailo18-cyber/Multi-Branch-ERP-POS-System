import React from 'react';
import { Modal, Button } from '../../components/ui';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedCount: number;
  marginPercent: string;
  roundingRule: string;
  loading: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedCount,
  marginPercent,
  roundingRule,
  loading,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar Actualización de Precios"
      size="md"
    >
      <div className="space-y-4">
        <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg">
          <p className="text-sm text-warning-800 dark:text-warning-300">
            Vas a actualizar los precios de <strong>{selectedCount} productos</strong>.
            Esta acción quedará registrada en el historial.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Margen aplicado</span>
            <span className="font-medium">{marginPercent}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Redondeo</span>
            <span className="font-medium">{roundingRule.replace('_', ' ')}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" fullWidth onClick={onConfirm} loading={loading}>
            Confirmar y Aplicar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
