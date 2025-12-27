import React from 'react';
import { Modal, Input, Button } from '../../components/ui';
import type { SalePayment } from '../../types';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  cashReceived: string;
  onCashReceivedChange: (value: string) => void;
  payments: SalePayment[];
  onRemovePayment: (index: number) => void;
  onAddPayment: () => void;
  onCompleteSale: () => void;
  total: number;
  totalPaid: number;
  remainingAmount: number;
  change: number;
  processing: boolean;
  formatCurrency: (amount: number) => string;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  selectedMethod,
  onMethodChange,
  cashReceived,
  onCashReceivedChange,
  payments,
  onRemovePayment,
  onAddPayment,
  onCompleteSale,
  total,
  totalPaid,
  remainingAmount,
  change,
  processing,
  formatCurrency,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Cobrar Venta"
      size="lg"
    >
      <div className="grid grid-cols-2 gap-6">
        {/* Left - Payment Methods */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Método de Pago
          </h3>

          <div className="grid grid-cols-2 gap-3">
            {['CASH', 'DEBIT', 'CREDIT', 'TRANSFER', 'QR'].map((method) => (
              <button
                key={method}
                onClick={() => onMethodChange(method)}
                className={`
                  p-4 rounded-sm border-2 text-center transition-all
                  ${selectedMethod === method
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'}
                `}
              >
                <span className={`font-medium ${
                  selectedMethod === method
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300'
                }`}>
                  {method === 'CASH' && 'Efectivo'}
                  {method === 'DEBIT' && 'Débito'}
                  {method === 'CREDIT' && 'Crédito'}
                  {method === 'TRANSFER' && 'Transfer.'}
                  {method === 'QR' && 'QR'}
                </span>
              </button>
            ))}
          </div>

          {selectedMethod === 'CASH' && (
            <div className="space-y-3">
              <Input
                label="Efectivo recibido"
                type="number"
                min="0"
                step="0.01"
                value={cashReceived}
                onChange={(e) => onCashReceivedChange(e.target.value)}
                placeholder={formatCurrency(remainingAmount)}
              />
              <div className="grid grid-cols-3 gap-2">
                {[100, 200, 500, 1000, 2000, 3000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => onCashReceivedChange(String(amount))}
                    className="py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-sm hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="primary"
            fullWidth
            onClick={onAddPayment}
            disabled={remainingAmount <= 0}
          >
            Agregar Pago
          </Button>
        </div>

        {/* Right - Summary */}
        <div className="space-y-4">
          <h3 className="font-medium text-gray-900 dark:text-white">
            Resumen
          </h3>

          {/* Payments list */}
          {payments.length > 0 && (
            <div className="space-y-2">
              {payments.map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-sm"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {payment.payment_method?.name || 'Pago'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {formatCurrency(Number(payment.amount))}
                    </span>
                    <button
                      onClick={() => onRemovePayment(index)}
                      className="p-1 text-gray-400 hover:text-danger-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Totals */}
          <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-lg">
              <span className="text-gray-500 dark:text-gray-400">Total a cobrar</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {formatCurrency(total)}
              </span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-gray-500 dark:text-gray-400">Pagado</span>
              <span className="font-bold text-green-500">
                {formatCurrency(totalPaid)}
              </span>
            </div>
            {remainingAmount > 0 && (
              <div className="flex justify-between text-lg">
                <span className="text-gray-500 dark:text-gray-400">Restante</span>
                <span className="font-bold text-danger-500">
                  {formatCurrency(remainingAmount)}
                </span>
              </div>
            )}
            {change > 0 && (
              <div className="flex justify-between text-2xl pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-gray-900 dark:text-white">Cambio</span>
                <span className="font-bold text-primary-500">
                  {formatCurrency(change)}
                </span>
              </div>
            )}
          </div>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={onCompleteSale}
            disabled={remainingAmount > 0 || processing}
            loading={processing}
          >
            Completar Venta
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal;
