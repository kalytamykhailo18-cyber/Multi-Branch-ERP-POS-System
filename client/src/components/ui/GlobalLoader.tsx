import React from 'react';
import { useAppSelector } from '../../store';

/**
 * Global Loading Indicator
 * Single loading indicator for all API requests as per rule.txt requirements.
 * Shows at the top of the page when any API request is in progress.
 */
const GlobalLoader: React.FC = () => {
  const { loading, loadingMessage } = useAppSelector((state) => state.ui);

  if (!loading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999]">
      {/* Progress bar */}
      <div className="h-1 bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full bg-gradient-to-r from-primary-500 via-primary-400 to-primary-500 animate-shimmer"
          style={{
            backgroundSize: '200% 100%',
            width: '100%',
          }}
        />
      </div>

      {/* Loading message overlay (optional) */}
      {loadingMessage && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-[9998]">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl px-8 py-6 flex flex-col items-center gap-4 animate-zoom-in">
            <div className="relative">
              {/* Spinner */}
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
            <p className="text-gray-700 dark:text-gray-200 font-medium">
              {loadingMessage}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalLoader;
