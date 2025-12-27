import React from 'react';
import { Card } from '../../components/ui';
import type { PointsTransaction, CreditTransaction } from '../../services/api/loyalty.service';

type LoyaltyTransaction = PointsTransaction | CreditTransaction;

interface TransactionsTableProps {
  transactions: LoyaltyTransaction[];
  loading: boolean;
  formatCurrency: (amount: number) => string;
  formatDateTime: (date: string) => string;
}

const TransactionsTable: React.FC<TransactionsTableProps> = ({
  transactions,
  loading,
  formatCurrency,
  formatDateTime,
}) => {
  const isPointsTransaction = (tx: LoyaltyTransaction): tx is PointsTransaction => {
    return 'points' in tx;
  };

  const isCreditTransaction = (tx: LoyaltyTransaction): tx is CreditTransaction => {
    return 'amount' in tx;
  };

  const getTransactionStyle = (type: string) => {
    const styles: Record<string, { label: string; color: string }> = {
      EARN: { label: 'Ganados', color: 'text-green-500' },
      REDEEM: { label: 'Canjeados', color: 'text-primary-500' },
      EXPIRY: { label: 'Expirados', color: 'text-gray-500' },
      ADJUSTMENT: { label: 'Ajuste', color: 'text-blue-500' },
      CREDIT_GIVEN: { label: 'Crédito agregado', color: 'text-green-500' },
      CREDIT_USED: { label: 'Crédito usado', color: 'text-warning-500' },
    };
    return styles[type] || { label: type, color: 'text-gray-500' };
  };

  return (
    <Card className="overflow-hidden animate-fade-up duration-normal">
      {loading ? (
        <div className="flex justify-center py-12 animate-zoom-in duration-fast">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-12 text-gray-500 animate-fade-down duration-normal">
          <p>No hay transacciones registradas</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 animate-fade-down duration-fast">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase animate-fade-right duration-very-fast">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase animate-fade-right duration-fast">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase animate-fade-right duration-normal">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase animate-fade-right duration-light-slow">Puntos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase animate-fade-right duration-slow">Crédito</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase animate-fade-right duration-very-slow">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((tx, index) => {
                const style = getTransactionStyle(tx.transaction_type);
                return (
                  <tr
                    key={tx.id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${index % 2 === 0 ? 'animate-fade-left' : 'animate-fade-right'} ${index < 3 ? 'duration-fast' : index < 6 ? 'duration-normal' : 'duration-light-slow'}`}
                  >
                    <td className="px-6 py-4 text-sm text-gray-500 animate-fade-up duration-very-fast">
                      {formatDateTime(tx.created_at)}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white animate-fade-up duration-fast">
                      {tx.customer_name}
                    </td>
                    <td className="px-6 py-4 animate-zoom-in duration-normal">
                      <span className={`text-sm font-medium ${style.color}`}>
                        {style.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right animate-flip-up duration-normal">
                      {isPointsTransaction(tx) && tx.points !== 0 && (
                        <span className={`font-medium ${
                          tx.points > 0 ? 'text-green-500' : 'text-danger-500'
                        }`}>
                          {tx.points > 0 ? '+' : ''}{tx.points}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right animate-flip-up duration-light-slow">
                      {isCreditTransaction(tx) && tx.amount !== 0 && (
                        <span className={`font-medium ${
                          tx.amount > 0 ? 'text-green-500' : 'text-danger-500'
                        }`}>
                          {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount)}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 animate-fade-left duration-slow">
                      {tx.reason || '-'}
                      {tx.sale_id && (
                        <span className="text-xs text-gray-400 ml-2">
                          (Venta: {tx.sale_id})
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};

export default TransactionsTable;
