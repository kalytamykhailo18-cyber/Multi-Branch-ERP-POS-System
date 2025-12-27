import React, { useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../store';
import { hideToast } from '../../store/slices/uiSlice';
import { FiCheck, FiX, FiAlertTriangle, FiInfo } from 'react-icons/fi';

const Toast: React.FC = () => {
  const dispatch = useAppDispatch();
  const toast = useAppSelector((state) => state.ui.toast);

  useEffect(() => {
    if (toast?.show) {
      const duration = toast.duration || 4000;
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [toast, dispatch]);

  if (!toast?.show) return null;

  const icons = {
    success: <FiCheck className="w-5 h-5" />,
    error: <FiX className="w-5 h-5" />,
    warning: <FiAlertTriangle className="w-5 h-5" />,
    info: <FiInfo className="w-5 h-5" />,
  };

  const colors = {
    success: 'bg-success-500 text-white',
    error: 'bg-danger-500 text-white',
    warning: 'bg-warning-500 text-white',
    info: 'bg-primary-500 text-white',
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] animate-fade-up">
      <div
        className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${colors[toast.type]}`}
      >
        <span className="flex-shrink-0">{icons[toast.type]}</span>
        <p className="font-medium">{toast.message}</p>
        <button
          onClick={() => dispatch(hideToast())}
          className="flex-shrink-0 ml-2 hover:opacity-80"
        >
          <FiX className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;
