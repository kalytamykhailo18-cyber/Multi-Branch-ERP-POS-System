import React from 'react';
import { Modal, Input, Button } from '../../components/ui';
import type { LoyaltyAccount } from '../../services/api/loyalty.service';

interface CreditData {
  type: 'add' | 'use';
  amount: string;
  reason: string;
}

interface AdjustCreditModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: LoyaltyAccount | null;
  creditData: CreditData;
  onDataChange: (data: CreditData) => void;
  onSubmit: () => void;
  loading: boolean;
  formatCurrency: (amount: number) => string;
}

const AdjustCreditModal: React.FC<AdjustCreditModalProps> = ({
  isOpen,
  onClose,
  customer,
  creditData,
  onDataChange,
  onSubmit,
  loading,
  formatCurrency,
}) => {
  if (!customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustar Crédito"
      size="sm"
    >
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-sm text-center animate-zoom-in duration-fast">
          <p className="font-medium text-gray-900 dark:text-white animate-fade-down duration-very-fast">
            {`${customer.first_name || ''} ${customer.last_name || ''}`.trim()}
          </p>
          <p className={`text-2xl font-bold mt-2 animate-flip-up duration-normal ${
            customer.credit_balance < 0 ? 'text-danger-500' : 'text-green-500'
          }`}>
            {formatCurrency(customer.credit_balance)}
          </p>
        </div>

        <div className="animate-fade-left duration-fast">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tipo de ajuste
          </label>
          <select
            value={creditData.type}
            onChange={(e) => onDataChange({ ...creditData, type: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-gray-700"
          >
            <option value="add">Agregar crédito (vuelto)</option>
            <option value="use">Usar crédito</option>
          </select>
        </div>

        <div className="animate-fade-right duration-normal">
          <Input
            label="Monto"
            type="number"
            value={creditData.amount}
            onChange={(e) => onDataChange({ ...creditData, amount: e.target.value })}
            min="0.01"
            step="0.01"
          />
        </div>

        <div className="animate-fade-left duration-light-slow">
          <Input
            label="Razón"
            value={creditData.reason}
            onChange={(e) => onDataChange({ ...creditData, reason: e.target.value })}
            placeholder="Motivo del ajuste..."
          />
        </div>

        <div className="flex gap-3 animate-fade-up duration-slow">
          <Button variant="secondary" fullWidth onClick={onClose} className="animate-fade-left duration-fast">
            Cancelar
          </Button>
          <Button variant="primary" fullWidth onClick={onSubmit} loading={loading} className="animate-fade-right duration-fast">
            Ajustar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default AdjustCreditModal;
