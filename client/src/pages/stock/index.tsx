import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  fetchBranchStock,
  fetchStockMovements,
  adjustStock,
  recordShrinkage
} from '../../store/slices/stockSlice';
import { Card, Button } from '../../components/ui';
import StockInventoryList from './StockInventoryList';
import StockMovementsList from './StockMovementsList';
import AdjustStockModal from './AdjustStockModal';
import ShrinkageModal from './ShrinkageModal';
import type { StockItem } from '../../services/api/stock.service';

type StockTab = 'inventory' | 'movements' | 'shrinkage' | 'transfers';

const StockPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { currentBranch, user } = useAppSelector((state) => state.auth);
  const { items: stock, movements, loading } = useAppSelector((state) => state.stock);

  const isOwner = user?.role?.permissions?.canAccessAllBranches;

  // Local state
  const [activeTab, setActiveTab] = useState<StockTab>('inventory');
  const [search, setSearch] = useState('');
  const [showLowStock, setShowLowStock] = useState(false);

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showShrinkageModal, setShowShrinkageModal] = useState(false);
  // const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);

  // Form state
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: '',
    reason: '',
    type: 'adjustment' as 'adjustment' | 'shrinkage' | 'count',
  });

  // Load stock
  useEffect(() => {
    if (currentBranch?.id) {
      loadStock();
    }
  }, [currentBranch?.id, showLowStock]);

  // Load movements when tab changes
  useEffect(() => {
    if (activeTab === 'movements' && currentBranch?.id) {
      loadMovements();
    }
  }, [activeTab, currentBranch?.id]);

  const loadStock = () => {
    if (!currentBranch?.id) return;
    dispatch(fetchBranchStock({
      branchId: currentBranch.id,
      low_stock: showLowStock,
    }));
  };

  const loadMovements = () => {
    if (!currentBranch?.id) return;
    dispatch(fetchStockMovements({
      branch_id: currentBranch.id,
    }));
  };

  // Handle stock adjustment
  const handleAdjustment = async () => {
    if (!selectedItem || !adjustmentData.quantity || !currentBranch?.id) return;

    try {
      await dispatch(adjustStock({
        branch_id: currentBranch.id,
        product_id: selectedItem.product_id,
        quantity: parseFloat(adjustmentData.quantity),
        reason: adjustmentData.reason,
      })).unwrap();

      setShowAdjustModal(false);
      setAdjustmentData({ quantity: '', reason: '', type: 'adjustment' });
      loadStock();
    } catch (error) {
      // Error handled in slice
    }
  };

  // Handle shrinkage adjustment (quick adjustment for pet food)
  const handleShrinkageAdjustment = async () => {
    if (!selectedItem || !adjustmentData.quantity || !currentBranch?.id) return;

    try {
      await dispatch(recordShrinkage({
        branch_id: currentBranch.id,
        product_id: selectedItem.product_id,
        quantity: parseFloat(adjustmentData.quantity),
        reason: adjustmentData.reason || 'Merma por peso/polvo',
      })).unwrap();

      setShowShrinkageModal(false);
      setAdjustmentData({ quantity: '', reason: '', type: 'adjustment' });
      loadStock();
    } catch (error) {
      // Error handled in slice
    }
  };

  const tabs = [
    { id: 'inventory' as StockTab, name: 'Inventario' },
    { id: 'movements' as StockTab, name: 'Movimientos' },
    { id: 'shrinkage' as StockTab, name: 'Mermas' },
    { id: 'transfers' as StockTab, name: 'Transferencias' },
  ];

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-down duration-fast">
          <div className="animate-fade-right duration-normal">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Gestión de Stock
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Control de inventario con soporte para mermas
            </p>
          </div>

          <div className="flex gap-3 animate-fade-left duration-normal">
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedItem(null);
                setShowShrinkageModal(true);
              }}
            >
              Registrar Merma
            </Button>
            <Button
              variant="primary"
              onClick={loadStock}
            >
              Actualizar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 animate-fade-up duration-fast">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors animate-fade-up duration-normal
                  ${activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Inventory Tab */}
        {activeTab === 'inventory' && (
          <StockInventoryList
            stock={stock}
            search={search}
            onSearchChange={setSearch}
            showLowStock={showLowStock}
            onShowLowStockChange={setShowLowStock}
            onAdjust={(item) => {
              setSelectedItem(item);
              setShowAdjustModal(true);
            }}
            onShrinkage={(item) => {
              setSelectedItem(item);
              setShowShrinkageModal(true);
            }}
            loading={loading}
          />
        )}

        {/* Movements Tab */}
        {activeTab === 'movements' && (
          <StockMovementsList movements={movements} loading={loading} />
        )}

        {/* Shrinkage Tab */}
        {activeTab === 'shrinkage' && (
          <Card className="p-6 animate-zoom-in duration-normal">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/20 rounded-full mx-auto mb-4 flex items-center justify-center animate-flip-down duration-light-slow">
                <svg className="w-8 h-8 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 animate-fade-up duration-normal">
                Control de Mermas
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto animate-fade-up duration-light-slow">
                Registra las mermas de productos (especialmente alimentos para mascotas) causadas por polvo, porcionado o pérdidas de peso.
              </p>
              <Button
                variant="primary"
                onClick={() => setShowShrinkageModal(true)}
                className="animate-fade-up duration-slow"
              >
                Registrar Merma Rápida
              </Button>
            </div>
          </Card>
        )}

        {/* Transfers Tab */}
        {activeTab === 'transfers' && (
          <Card className="p-6 animate-zoom-in duration-normal">
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full mx-auto mb-4 flex items-center justify-center animate-flip-up duration-light-slow">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2 animate-fade-up duration-normal">
                Transferencias entre Sucursales
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto animate-fade-up duration-light-slow">
                Transfiere productos entre las diferentes sucursales de la cadena.
              </p>
              {isOwner && (
                <Button
                  variant="primary"
                  onClick={() => {}}
                  className="animate-fade-up duration-slow"
                >
                  Nueva Transferencia
                </Button>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      <AdjustStockModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        selectedItem={selectedItem}
        adjustmentData={adjustmentData}
        onDataChange={setAdjustmentData}
        onSubmit={handleAdjustment}
        loading={loading}
      />

      <ShrinkageModal
        isOpen={showShrinkageModal}
        onClose={() => setShowShrinkageModal(false)}
        selectedItem={selectedItem}
        adjustmentData={adjustmentData}
        onDataChange={setAdjustmentData}
        onSubmit={handleShrinkageAdjustment}
        loading={loading}
      />
    </>
  );
};

export default StockPage;
