import React from 'react';
import { Card } from '../../components/ui';
import type { StockMovement } from '../../services/api/stock.service';

interface StockMovementsListProps {
  movements: StockMovement[];
  loading: boolean;
}

const StockMovementsList: React.FC<StockMovementsListProps> = ({ movements, loading }) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-AR').format(num);
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMovementStyle = (type: string) => {
    const styles: Record<string, { label: string; color: string }> = {
      SALE: { label: 'Venta', color: 'text-danger-500' },
      PURCHASE: { label: 'Compra', color: 'text-green-500' },
      ADJUSTMENT: { label: 'Ajuste', color: 'text-blue-500' },
      TRANSFER_IN: { label: 'Transferencia (entrada)', color: 'text-green-500' },
      TRANSFER_OUT: { label: 'Transferencia (salida)', color: 'text-warning-500' },
      SHRINKAGE: { label: 'Merma', color: 'text-warning-500' },
      COUNT: { label: 'Conteo', color: 'text-purple-500' },
      RETURN: { label: 'Devolución', color: 'text-green-500' },
    };
    return styles[type] || { label: type, color: 'text-gray-500' };
  };

  return (
    <Card className="overflow-hidden">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
        </div>
      ) : movements.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No hay movimientos registrados</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Antes</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Stock Después</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {movements.map((mov, index) => {
                const style = getMovementStyle(mov.movement_type);
                return (
                  <tr
                    key={mov.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 animate-slide-up"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDateTime(mov.created_at)}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {mov.product_name}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-medium ${style.color}`}>
                        {style.label}
                      </span>
                      {(mov as any).notes || (mov as any).adjustment_reason && (
                        <p className="text-xs text-gray-400">{(mov as any).notes || (mov as any).adjustment_reason || (mov as any).reason}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-medium ${
                        mov.quantity > 0 ? 'text-green-500' : 'text-danger-500'
                      }`}>
                        {mov.quantity > 0 ? '+' : ''}{formatNumber(mov.quantity)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-500">
                      {formatNumber(mov.quantity_before)}
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                      {formatNumber(mov.quantity_after)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {(mov as any).performed_by_name || (mov as any).created_by_name || '-'}
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

export default StockMovementsList;
