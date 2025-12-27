import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  addToCart,
  updateCartItemQuantity,
  removeFromCart,
  clearCart,
  setCustomer,
  completeSale,
  addPayment,
  removePayment,
  clearPayments,
} from '../../store/slices/posSlice';
import { searchProducts } from '../../store/slices/productsSlice';
import { quickSearchCustomers } from '../../store/slices/customersSlice';
import { useNavigation } from '../../hooks';
import type { Product, Customer, QuickSearchCustomer } from '../../types';
import NoActiveSessionCard from './NoActiveSessionCard';
import TopBar from './TopBar';
import ProductsGrid from './ProductsGrid';
import CartSection from './CartSection';
import QuantityModal from './QuantityModal';
import CustomerSearchModal from './CustomerSearchModal';
import PaymentModal from './PaymentModal';

// Debounce hook
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const POSPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { goTo } = useNavigation();

  // Redux state
  const { cart, payments, searchResults } = useAppSelector((state) => state.pos);
  const { products, loading: productsLoading } = useAppSelector((state) => state.products);
  const { quickSearchResults: customerSearchResults, loading: customersLoading } = useAppSelector((state) => state.customers);
  const { currentBranch, currentSession: activeSession } = useAppSelector((state) => state.auth);

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState('1');
  const [cashReceived, setCashReceived] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('CASH');

  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);

  // Load products on mount
  useEffect(() => {
    if (currentBranch?.id) {
      dispatch(searchProducts({ query: '', branch_id: currentBranch.id }));
    }
  }, [dispatch, currentBranch?.id]);

  // Search products
  useEffect(() => {
    if (debouncedSearch && currentBranch?.id) {
      dispatch(searchProducts({ query: debouncedSearch, branch_id: currentBranch.id }));
    }
  }, [dispatch, debouncedSearch, currentBranch?.id]);

  // Search customers
  useEffect(() => {
    if (debouncedCustomerSearch) {
      dispatch(quickSearchCustomers(debouncedCustomerSearch));
    }
  }, [dispatch, debouncedCustomerSearch]);

  // Display products - use search results if searching
  const displayProducts = useMemo(() => {
    if (searchQuery && searchResults.length > 0) {
      return searchResults;
    }
    return products;
  }, [searchQuery, searchResults, products]);

  // Calculate remaining amount
  const totalPaid = useMemo(() => {
    return payments.reduce((sum, p) => sum + Number(p.amount), 0);
  }, [payments]);

  const remainingAmount = useMemo(() => {
    return Math.max(0, Number(cart.total) - totalPaid);
  }, [cart.total, totalPaid]);

  const change = useMemo(() => {
    return Math.max(0, totalPaid - Number(cart.total));
  }, [totalPaid, cart.total]);

  // Handle product click - add to cart or show quantity modal
  const handleProductClick = useCallback((product: Product) => {
    if (product.stock_quantity && product.stock_quantity <= 0) {
      return; // Out of stock
    }
    setSelectedProduct(product);
    setQuantity('1');
    setShowQuantityModal(true);
  }, []);

  const handleAddToCart = useCallback(() => {
    if (!selectedProduct) return;

    const qty = parseFloat(quantity) || 1;
    if (qty <= 0) return;

    dispatch(addToCart({
      product: {
        ...selectedProduct,
        stock_quantity: selectedProduct.stock_quantity || 0,
      },
      quantity: qty,
    }));

    setShowQuantityModal(false);
    setSelectedProduct(null);
    setQuantity('1');
  }, [dispatch, selectedProduct, quantity]);

  // Handle cart item quantity change
  const handleQuantityChange = useCallback((itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch(removeFromCart(itemId));
    } else {
      dispatch(updateCartItemQuantity({ itemId, quantity: newQuantity }));
    }
  }, [dispatch]);

  // Handle customer selection
  const handleSelectCustomer = useCallback((selectedCustomer: QuickSearchCustomer) => {
    dispatch(setCustomer(selectedCustomer as unknown as Customer));
    setShowCustomerModal(false);
    setCustomerSearch('');
  }, [dispatch]);

  const handleRemoveCustomer = useCallback(() => {
    dispatch(setCustomer(undefined));
  }, [dispatch]);

  // Handle payment
  const handleAddPayment = useCallback(() => {
    const amount = selectedPaymentMethod === 'CASH' && cashReceived
      ? parseFloat(cashReceived)
      : remainingAmount;

    if (amount <= 0) return;

    dispatch(addPayment({
      payment_method_id: selectedPaymentMethod,
      amount: Math.min(amount, remainingAmount + change),
      reference_number: selectedPaymentMethod !== 'CASH' ? `REF-${Date.now()}` : undefined,
    }));

    setCashReceived('');
  }, [dispatch, selectedPaymentMethod, cashReceived, remainingAmount, change]);

  // Complete sale
  const handleCompleteSale = useCallback(async () => {
    if (!currentBranch?.id || !activeSession?.id || !activeSession?.register_id) return;
    if (remainingAmount > 0) return;

    const result = await dispatch(completeSale({
      branch_id: currentBranch.id,
      register_id: activeSession.register_id,
      session_id: activeSession.id,
    }));

    if (completeSale.fulfilled.match(result)) {
      setShowPaymentModal(false);
      // Sale completed successfully - cart cleared by reducer
    }
  }, [dispatch, currentBranch?.id, activeSession?.id, activeSession?.register_id, remainingAmount]);

  // Clear all
  const handleClearCart = useCallback(() => {
    dispatch(clearCart());
    dispatch(clearPayments());
  }, [dispatch]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  // Check if session is active
  if (!activeSession) {
    return <NoActiveSessionCard onNavigateToSessions={() => goTo('/sessions')} />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 dark:bg-gray-900 overflow-hidden animate-fade-up duration-fast">
      <TopBar
        branchName={currentBranch?.name}
        registerName={activeSession?.register?.name}
        onBack={() => goTo('/dashboard')}
      />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        <ProductsGrid
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          products={displayProducts}
          loading={productsLoading}
          onProductClick={handleProductClick}
          formatCurrency={formatCurrency}
        />

        <CartSection
          customer={cart.customer || null}
          cart={cart.items}
          totals={{
            subtotal: Number(cart.subtotal),
            discount: Number(cart.discount_amount),
            tax: Number(cart.tax_amount),
            total: Number(cart.total)
          }}
          onAddCustomer={() => setShowCustomerModal(true)}
          onRemoveCustomer={handleRemoveCustomer}
          onQuantityChange={handleQuantityChange}
          onRemoveItem={(itemId) => dispatch(removeFromCart(itemId))}
          onClearCart={handleClearCart}
          onProceedToPayment={() => setShowPaymentModal(true)}
          formatCurrency={formatCurrency}
        />
      </div>

      {/* Modals */}
      <QuantityModal
        isOpen={showQuantityModal}
        onClose={() => {
          setShowQuantityModal(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        quantity={quantity}
        onQuantityChange={setQuantity}
        onSubmit={handleAddToCart}
        formatCurrency={formatCurrency}
      />

      <CustomerSearchModal
        isOpen={showCustomerModal}
        onClose={() => {
          setShowCustomerModal(false);
          setCustomerSearch('');
        }}
        searchQuery={customerSearch}
        onSearchChange={setCustomerSearch}
        customers={customerSearchResults}
        loading={customersLoading}
        onSelectCustomer={handleSelectCustomer}
        debouncedSearch={debouncedCustomerSearch}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        selectedMethod={selectedPaymentMethod}
        onMethodChange={setSelectedPaymentMethod}
        cashReceived={cashReceived}
        onCashReceivedChange={setCashReceived}
        payments={payments}
        onRemovePayment={(index) => dispatch(removePayment(index))}
        onAddPayment={handleAddPayment}
        onCompleteSale={handleCompleteSale}
        total={Number(cart.total)}
        totalPaid={totalPaid}
        remainingAmount={remainingAmount}
        change={change}
        processing={false}
        formatCurrency={formatCurrency}
      />
    </div>
  );
};

export default POSPage;
