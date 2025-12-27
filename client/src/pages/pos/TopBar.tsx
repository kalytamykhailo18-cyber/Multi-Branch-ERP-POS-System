import React from 'react';

interface TopBarProps {
  branchName?: string;
  registerName?: string;
  onBack: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ branchName, registerName, onBack }) => {
  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">
          Punto de Venta
        </h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {branchName}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Caja: {registerName || 'Principal'}
        </span>
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      </div>
    </header>
  );
};

export default TopBar;
