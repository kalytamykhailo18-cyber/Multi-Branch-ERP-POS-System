import React from 'react';
import { Button } from '../../components/ui';
import type { CartItem, Customer } from '../../types';

interface Totals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
}

interface CartSectionProps {
  customer: Customer | null;
  cart: CartItem[];
  totals: Totals;
  onAddCustomer: () => void;
  onRemoveCustomer: () => void;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
  onProceedToPayment: () => void;
  formatCurrency: (amount: number) => string;
}

const CartSection: React.FC<CartSectionProps> = ({
  customer,
  cart,
  totals,
  onAddCustomer,
  onRemoveCustomer,
  onQuantityChange,
  onRemoveItem,
  onClearCart,
  onProceedToPayment,
  formatCurrency,
}) => {
  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Customer Section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        {customer ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                <span className="text-primary-600 dark:text-primary-400 font-semibold text-sm">
                  {customer.first_name?.[0]}{customer.last_name?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {customer.first_name} {customer.last_name}
                </p>
                {customer.loyalty_points !== undefined && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {customer.loyalty_points} puntos
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onRemoveCustomer}
              className="p-2 text-gray-400 hover:text-danger-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <button
            onClick={onAddCustomer}
            className="w-full flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-gray-500 dark:text-gray-400">Agregar cliente</span>
          </button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto p-4">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p>Carrito vacío</p>
            <p className="text-sm">Agrega productos para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {cart.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {item.product.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatCurrency(Number(item.unit_price))} c/u
                  </p>
                </div>

                {/* Quantity controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>

                <div className="text-right w-24">
                  <p className="font-bold text-gray-900 dark:text-white">
                    {formatCurrency(Number(item.total))}
                  </p>
                </div>

                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2 text-gray-400 hover:text-danger-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Totals and Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
        {/* Totals */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>Subtotal</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-green-500">
              <span>Descuento</span>
              <span>-{formatCurrency(totals.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>IVA</span>
            <span>{formatCurrency(totals.tax)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
            <span>Total</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            onClick={onClearCart}
            disabled={cart.length === 0}
          >
            Limpiar
          </Button>
          <Button
            variant="primary"
            onClick={onProceedToPayment}
            disabled={cart.length === 0}
          >
            Cobrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartSection;
