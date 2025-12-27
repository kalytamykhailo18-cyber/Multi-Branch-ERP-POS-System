import React from 'react';
import { Input } from '../../components/ui';
import type { Product, POSProduct } from '../../types';

interface ProductsGridProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  products: Product[] | POSProduct[];
  loading: boolean;
  onProductClick: (product: Product) => void;
  formatCurrency: (amount: number) => string;
}

const ProductsGrid: React.FC<ProductsGridProps> = ({
  searchQuery,
  onSearchChange,
  products,
  loading,
  onProductClick,
  formatCurrency,
}) => {
  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden animate-fade-right duration-normal">
      {/* Search Bar */}
      <div className="mb-4 animate-fade-down duration-fast">
        <Input
          placeholder="Buscar productos por nombre, SKU o código de barras..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          leftIcon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          }
          rightIcon={
            searchQuery ? (
              <button onClick={() => onSearchChange('')}>
                <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : undefined
          }
        />
      </div>

      {/* Products Grid */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full animate-zoom-in duration-fast">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-fade-up duration-normal">
            <svg className="w-16 h-16 mb-4 opacity-50 animate-zoom-in duration-light-slow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <p>{searchQuery ? 'No se encontraron productos' : 'No hay productos disponibles'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 animate-fade-up duration-normal">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => onProductClick(product as Product)}
                disabled={product.stock_quantity !== undefined && product.stock_quantity <= 0}
                className={`
                  p-4 bg-white dark:bg-gray-800 rounded-sm border border-gray-200 dark:border-gray-700
                  text-left transition-all duration-150 hover:shadow-lg hover:scale-105
                  animate-zoom-in duration-fast disabled:opacity-50 disabled:cursor-not-allowed
                  ${product.stock_quantity !== undefined && product.stock_quantity <= 0 ? 'bg-gray-100 dark:bg-gray-900' : ''}
                `}
              >
                <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-sm mb-3 flex items-center justify-center animate-fade-up duration-normal">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover rounded-sm"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  )}
                </div>
                <h3 className="font-medium text-gray-900 dark:text-white text-sm line-clamp-2 mb-1 animate-fade-up duration-light-slow">
                  {product.name}
                </h3>
                <p className="text-primary-600 dark:text-primary-400 font-bold animate-fade-up duration-slow">
                  {formatCurrency(Number(product.selling_price))}
                </p>
                {product.stock_quantity !== undefined && (
                  <p className={`text-xs mt-1 ${
                    product.stock_quantity <= 0 ? 'text-danger-500' :
                    product.stock_quantity <= 5 ? 'text-warning-500' : 'text-gray-400'
                  }`}>
                    {product.stock_quantity <= 0 ? 'Sin stock' : `Stock: ${product.stock_quantity}`}
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsGrid;
