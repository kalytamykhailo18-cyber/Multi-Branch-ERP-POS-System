import React from 'react';
import { useNavigation } from '../../hooks';
import { useAppSelector } from '../../store';

const Header: React.FC<{ onMenuClick: () => void }> = ({ onMenuClick }) => {
  const { goTo } = useNavigation();
  const { currentBranch, user } = useAppSelector((state) => state.auth);
  const canAccessAllBranches = user?.role?.permissions?.canAccessAllBranches;

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1 lg:flex-none">
        {!canAccessAllBranches && currentBranch && (
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {currentBranch.name}
          </span>
        )}
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-4">
        {/* Quick POS Access */}
        <button
          onClick={() => goTo('/pos')}
          className="hidden sm:flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-sm hover:bg-primary-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <span className="font-medium">POS</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
