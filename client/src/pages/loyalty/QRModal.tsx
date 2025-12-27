import React from 'react';
import { Modal, Button } from '../../components/ui';
import type { LoyaltyAccount } from '../../services/api/loyalty.service';

interface QRModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: LoyaltyAccount | null;
}

const QRModal: React.FC<QRModalProps> = ({ isOpen, onClose, customer }) => {
  if (!customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Código QR del Cliente"
      size="sm"
    >
      <div className="text-center space-y-4">
        <div className="w-48 h-48 bg-gray-100 dark:bg-gray-800 rounded-sm mx-auto flex items-center justify-center">
          <div className="text-6xl">📱</div>
        </div>
        <p className="font-medium text-gray-900 dark:text-white">
          {`${customer.first_name || ''} ${customer.last_name || ''}`.trim()}
        </p>
        <p className="text-sm text-gray-500">
          Escanea este código en el POS para identificar al cliente
        </p>
        <Button variant="secondary" fullWidth>
          Imprimir QR
        </Button>
      </div>
    </Modal>
  );
};

export default QRModal;
