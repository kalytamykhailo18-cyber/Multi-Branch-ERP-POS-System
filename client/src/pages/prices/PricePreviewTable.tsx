import React from 'react';
import { Button } from '../../components/ui';
import type { ImportPreview } from './types';

interface PricePreviewTableProps {
  preview: ImportPreview;
  selectedItems: Set<number>;
  marginPercent: string;
  roundingRule: string;
  onToggleItem: (index: number) => void;
  onToggleAllMatched: () => void;
  onApply: () => void;
}

export const PricePreviewTable: React.FC<PricePreviewTableProps> = ({
  preview,
  selectedItems,
  marginPercent,
  roundingRule,
  onToggleItem,
  onToggleAllMatched,
  onApply,
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  const calculateSellPrice = (costPrice: number) => {
    const margin = parseFloat(marginPercent) / 100;
    let sellPrice = costPrice * (1 + margin);

    // Apply rounding
    switch (roundingRule) {
      case 'nearest_10':
        sellPrice = Math.round(sellPrice / 10) * 10;
        break;
      case 'nearest_50':
        sellPrice = Math.round(sellPrice / 50) * 50;
        break;
      case 'nearest_100':
        sellPrice = Math.round(sellPrice / 100) * 100;
        break;
      case 'up_10':
        sellPrice = Math.ceil(sellPrice / 10) * 10;
        break;
      case 'down_10':
        sellPrice = Math.floor(sellPrice / 10) * 10;
        break;
    }

    return sellPrice;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'matched':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
            Coincide
          </span>
        );
      case 'unmatched':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
            Sin coincidencia
          </span>
        );
      case 'large_change':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/20 dark:text-warning-400">
            Cambio grande
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-danger-100 text-danger-800 dark:bg-danger-900/20 dark:text-danger-400">
            Error
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 animate-fade-down duration-fast">
        <div className="flex items-center justify-between">
          <div className="animate-fade-right duration-normal">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              2. Vista Previa
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {preview.file_name} • {preview.total_rows} productos encontrados
            </p>
          </div>
          <div className="flex items-center gap-4 animate-fade-left duration-normal">
            <div className="flex items-center gap-2 text-sm animate-zoom-in duration-fast">
              <span className="w-3 h-3 bg-green-500 rounded-full" />
              <span>{preview.matched_count} coincidencias</span>
            </div>
            <div className="flex items-center gap-2 text-sm animate-zoom-in duration-normal">
              <span className="w-3 h-3 bg-gray-400 rounded-full" />
              <span>{preview.unmatched_count} sin coincidencia</span>
            </div>
            {preview.large_change_count || 0 > 0 && (
              <div className="flex items-center gap-2 text-sm animate-zoom-in duration-light-slow">
                <span className="w-3 h-3 bg-warning-500 rounded-full" />
                <span>{preview.large_change_count || 0} cambios grandes</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between animate-fade-up duration-normal">
        <div className="flex items-center gap-4 animate-fade-right duration-fast">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={preview.items.filter((i) => i.status === 'matched').every((_, idx) =>
                selectedItems.has(preview.items.findIndex((item, i) => i === idx && item.status === 'matched'))
              )}
              onChange={(_e: React.ChangeEvent<HTMLInputElement>) => onToggleAllMatched()}
              className="w-4 h-4 text-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Seleccionar todos los coincidentes
            </span>
          </label>
          <span className="text-sm text-gray-500 animate-flip-down duration-normal">
            {selectedItems.size} seleccionados
          </span>
        </div>
        <Button
          variant="primary"
          onClick={onApply}
          disabled={selectedItems.size === 0}
          className="animate-zoom-in duration-light-slow"
        >
          Aplicar Precios Seleccionados
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto animate-fade-up duration-light-slow">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-800 animate-fade-down duration-fast">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10"></th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase animate-fade-left duration-very-fast">Código</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase animate-fade-left duration-fast">Descripción</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase animate-fade-left duration-normal">Producto Coincidente</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase animate-fade-left duration-light-slow">Precio Actual</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase animate-fade-left duration-slow">Nuevo Costo</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase animate-fade-left duration-slow">Nuevo Precio</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase animate-fade-left duration-very-slow">Cambio</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase animate-fade-left duration-very-slow">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {preview.items.map((item, index) => {
              const newSellPrice = calculateSellPrice(item.unit_price);
              const priceChange = item.current_price
                ? ((newSellPrice - item.current_price) / item.current_price) * 100
                : null;

              return (
                <tr
                  key={index}
                  className={`
                    hover:bg-gray-50 dark:hover:bg-gray-800/50
                    ${selectedItems.has(index) ? 'bg-primary-50 dark:bg-primary-900/10' : ''}
                    animate-fade-up duration-normal
                  `}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(index)}
                      onChange={() => onToggleItem(index)}
                      disabled={!item.matched_product_id}
                      className="w-4 h-4 text-primary-500 border-gray-300 rounded disabled:opacity-50"
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {item.supplier_code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white max-w-xs truncate">
                    {item.description}
                  </td>
                  <td className="px-4 py-3">
                    {item.matched_product_name ? (
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.matched_product_name}
                        </p>
                        <p className="text-xs text-gray-500">SKU: {item.matched_sku}</p>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-500">
                    {item.current_price ? formatCurrency(item.current_price) : '-'}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-gray-900 dark:text-white">
                    {formatCurrency(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-primary-600">
                    {formatCurrency(newSellPrice)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {priceChange !== null && (
                      <span className={`text-sm font-medium ${
                        priceChange > 0 ? 'text-danger-500' :
                        priceChange < 0 ? 'text-green-500' : 'text-gray-500'
                      }`}>
                        {priceChange > 0 ? '+' : ''}{priceChange.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusBadge(item.status)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
};
