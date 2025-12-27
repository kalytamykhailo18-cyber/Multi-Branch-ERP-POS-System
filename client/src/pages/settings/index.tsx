import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import UserSettings from './UserSettings';
import BranchSettings from './BranchSettings';
import SystemSettings from './SystemSettings';

const SettingsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState<'user' | 'branch' | 'system'>('user');

  const isOwner = user?.role?.name === 'OWNER';
  const isManager = user?.role?.name === 'MANAGER';

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-fade-right duration-normal">Configuración</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md animate-fade-up duration-normal">
        <div className="flex flex-col sm:flex-row border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-right duration-fast ${
              activeTab === 'user'
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('user')}
          >
            Usuario
          </button>

          {(isOwner || isManager) && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-up duration-normal ${
                activeTab === 'branch'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('branch')}
            >
              Sucursal
            </button>
          )}

          {isOwner && (
            <button
              className={`px-6 py-3 text-sm font-medium transition-colors animate-fade-left duration-light-slow ${
                activeTab === 'system'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('system')}
            >
              Sistema
            </button>
          )}
        </div>
      </div>

      <div className="animate-zoom-in duration-normal">
        {activeTab === 'user' && <UserSettings />}
        {activeTab === 'branch' && (isOwner || isManager) && <BranchSettings />}
        {activeTab === 'system' && isOwner && <SystemSettings />}
      </div>
    </div>
  );
};

export default SettingsPage;
