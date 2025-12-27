import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import {
  loadAccounts,
  loadPointsTransactions,
  loadCreditTransactions,
  adjustPoints,
  adjustCredit,
  loadConfig,
  updateConfig,
} from '../../store/slices/loyaltySlice';
import type { LoyaltyAccount } from '../../services/api/loyalty.service';
import CustomersGrid from './CustomersGrid';
import TransactionsTable from './TransactionsTable';
import SettingsForm from './SettingsForm';
import AdjustPointsModal from './AdjustPointsModal';
import AdjustCreditModal from './AdjustCreditModal';
import QRModal from './QRModal';

type LoyaltyTab = 'customers' | 'transactions' | 'settings';

const LoyaltyPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { accounts, pointsTransactions, creditTransactions, config: loyaltyConfig, loading } = useAppSelector((state) => state.loyalty);

  const isOwner = user?.role?.permissions?.canAccessAllBranches;

  // State
  const [activeTab, setActiveTab] = useState<LoyaltyTab>('customers');
  const [search, setSearch] = useState('');

  // Modals
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<LoyaltyAccount | null>(null);

  // Form state
  const [adjustmentData, setAdjustmentData] = useState({
    type: 'add' as 'add' | 'subtract',
    points: '',
    reason: '',
  });
  const [creditData, setCreditData] = useState({
    type: 'add' as 'add' | 'use',
    amount: '',
    reason: '',
  });

  // Load data
  useEffect(() => {
    if (activeTab === 'customers') {
      dispatch(loadAccounts());
    } else if (activeTab === 'transactions') {
      dispatch(loadPointsTransactions());
      dispatch(loadCreditTransactions());
    } else if (activeTab === 'settings') {
      dispatch(loadConfig());
    }
  }, [activeTab, dispatch]);

  // Handle points adjustment
  const handleAdjustPoints = async () => {
    if (!selectedCustomer || !adjustmentData.points) return;

    try {
      const points = parseInt(adjustmentData.points);
      await dispatch(adjustPoints({
        loyalty_account_id: selectedCustomer.id,
        points: adjustmentData.type === 'add' ? points : -points,
        reason: adjustmentData.reason,
      })).unwrap();

      setShowAdjustModal(false);
      setAdjustmentData({ type: 'add', points: '', reason: '' });
      dispatch(loadAccounts());
    } catch (error) {
      // Error handled in slice
    }
  };

  // Handle credit adjustment
  const handleAdjustCredit = async () => {
    if (!selectedCustomer || !creditData.amount) return;

    try {
      const amount = parseFloat(creditData.amount);
      await dispatch(adjustCredit({
        loyalty_account_id: selectedCustomer.id,
        amount: creditData.type === 'add' ? amount : -amount,
        reason: creditData.reason,
      })).unwrap();

      setShowCreditModal(false);
      setCreditData({ type: 'add', amount: '', reason: '' });
      dispatch(loadAccounts());
    } catch (error) {
      // Error handled in slice
    }
  };

  // Save config
  const handleSaveConfig = async () => {
    if (!loyaltyConfig) return;

    try {
      await dispatch(updateConfig(loyaltyConfig)).unwrap();
    } catch (error) {
      // Error handled in slice
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  // Format date
  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const tabs = [
    { id: 'customers' as LoyaltyTab, name: 'Clientes' },
    { id: 'transactions' as LoyaltyTab, name: 'Transacciones' },
    { id: 'settings' as LoyaltyTab, name: 'Configuración', ownerOnly: true },
  ].filter((tab) => !tab.ownerOnly || isOwner);

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="animate-fade-down duration-fast">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Programa de Fidelidad
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 animate-fade-up duration-normal">
            Puntos de lealtad y sistema de crédito para clientes
          </p>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700 animate-fade-right duration-normal">
          <nav className="flex space-x-8">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm transition-colors animate-fade-up ${index === 0 ? 'duration-fast' : index === 1 ? 'duration-normal' : 'duration-light-slow'}
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

        {/* Customers Tab */}
        {activeTab === 'customers' && (
          <CustomersGrid
            customers={accounts}
            search={search}
            onSearchChange={setSearch}
            loading={loading}
            onAdjustPoints={(customer) => {
              setSelectedCustomer(customer);
              setShowAdjustModal(true);
            }}
            onAdjustCredit={(customer) => {
              setSelectedCustomer(customer);
              setShowCreditModal(true);
            }}
            onShowQR={(customer) => {
              setSelectedCustomer(customer);
              setShowQRModal(true);
            }}
            formatCurrency={formatCurrency}
            formatDateTime={formatDateTime}
          />
        )}

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <TransactionsTable
            transactions={[...pointsTransactions, ...creditTransactions]}
            loading={loading}
            formatCurrency={formatCurrency}
            formatDateTime={formatDateTime}
          />
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && isOwner && loyaltyConfig && (
          <SettingsForm
            config={loyaltyConfig}
            onConfigChange={(newConfig) => dispatch(updateConfig(newConfig))}
            onSave={handleSaveConfig}
            loading={loading}
          />
        )}
      </div>

      {/* Modals */}
      <AdjustPointsModal
        isOpen={showAdjustModal}
        onClose={() => setShowAdjustModal(false)}
        customer={selectedCustomer}
        adjustmentData={adjustmentData}
        onDataChange={setAdjustmentData}
        onSubmit={handleAdjustPoints}
        loading={loading}
      />

      <AdjustCreditModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        customer={selectedCustomer}
        creditData={creditData}
        onDataChange={setCreditData}
        onSubmit={handleAdjustCredit}
        loading={loading}
        formatCurrency={formatCurrency}
      />

      <QRModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        customer={selectedCustomer}
      />
    </>
  );
};

export default LoyaltyPage;
