import React, { useState, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../store';
import { clearError } from '../../store/slices/authSlice';
import { useNavigation } from '../../hooks';
import { Button, Card } from '../../components/ui';

const PIN_LENGTH = 4;

const PINLoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { goTo } = useNavigation();
  const { isAuthenticated, error } = useAppSelector((state) => state.auth);
  const { loading } = useAppSelector((state) => state.ui);

  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [shake, setShake] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      goTo('/pos');
    }
  }, [isAuthenticated, goTo]);

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      setShake(true);
      setPin(Array(PIN_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setTimeout(() => setShake(false), 500);
    }
  }, [error]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (error) {
      dispatch(clearError());
    }

    // Move to next input
    if (value && index < PIN_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit when complete
    if (index === PIN_LENGTH - 1 && value) {
      const completePin = newPin.join('');
      if (completePin.length === PIN_LENGTH) {
        // TODO: PINLoginPage needs redesign - must select user/branch before PIN
        // loginWithPIN expects { user_id, pin, branch_id }, not just a string
        // dispatch(loginWithPIN(completePin));
        console.error('PIN login not implemented - page needs redesign to include user/branch selection');
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, PIN_LENGTH);
    if (!/^\d+$/.test(pastedData)) return;

    const newPin = [...pin];
    for (let i = 0; i < pastedData.length; i++) {
      newPin[i] = pastedData[i];
    }
    setPin(newPin);

    if (pastedData.length === PIN_LENGTH) {
      // TODO: PINLoginPage needs redesign - must select user/branch before PIN
      // dispatch(loginWithPIN(pastedData));
      console.error('PIN login not implemented - page needs redesign to include user/branch selection');
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const handleNumpadClick = (num: string) => {
    const emptyIndex = pin.findIndex((p) => !p);
    if (emptyIndex !== -1) {
      handlePinChange(emptyIndex, num);
    }
  };

  const handleBackspace = () => {
    const lastFilledIndex = pin.map((p, i) => (p ? i : -1)).filter((i) => i !== -1).pop();
    if (lastFilledIndex !== undefined) {
      const newPin = [...pin];
      newPin[lastFilledIndex] = '';
      setPin(newPin);
      inputRefs.current[lastFilledIndex]?.focus();
    }
  };

  const handleClear = () => {
    setPin(Array(PIN_LENGTH).fill(''));
    inputRefs.current[0]?.focus();
    dispatch(clearError());
  };

  const handleEmailLogin = () => {
    goTo('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700 p-4">
      <div className="w-full max-w-sm animate-slide-up">
        <Card className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-500 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Ingreso Rápido
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Ingresa tu PIN de 4 dígitos
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
              <p className="text-sm text-danger-600 dark:text-danger-400 text-center">{error}</p>
            </div>
          )}

          {/* PIN Inputs */}
          <div
            className={`flex justify-center gap-3 mb-8 ${shake ? 'animate-shake' : ''}`}
            onPaste={handlePaste}
          >
            {pin.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="password"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handlePinChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`
                  w-14 h-16 text-center text-2xl font-bold
                  bg-gray-50 dark:bg-gray-700
                  border-2 rounded-xl
                  focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500
                  transition-all duration-200
                  ${digit ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-600'}
                  ${error ? 'border-danger-500' : ''}
                `}
                disabled={loading}
              />
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleNumpadClick(num)}
                disabled={loading}
                className="
                  h-14 text-xl font-semibold
                  bg-gray-100 dark:bg-gray-700
                  text-gray-900 dark:text-white
                  rounded-xl
                  hover:bg-gray-200 dark:hover:bg-gray-600
                  active:scale-95
                  transition-all duration-150
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={handleClear}
              disabled={loading}
              className="
                h-14 text-sm font-medium
                bg-gray-100 dark:bg-gray-700
                text-gray-600 dark:text-gray-300
                rounded-xl
                hover:bg-gray-200 dark:hover:bg-gray-600
                active:scale-95
                transition-all duration-150
              "
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={() => handleNumpadClick('0')}
              disabled={loading}
              className="
                h-14 text-xl font-semibold
                bg-gray-100 dark:bg-gray-700
                text-gray-900 dark:text-white
                rounded-xl
                hover:bg-gray-200 dark:hover:bg-gray-600
                active:scale-95
                transition-all duration-150
              "
            >
              0
            </button>
            <button
              type="button"
              onClick={handleBackspace}
              disabled={loading}
              className="
                h-14 flex items-center justify-center
                bg-gray-100 dark:bg-gray-700
                text-gray-600 dark:text-gray-300
                rounded-xl
                hover:bg-gray-200 dark:hover:bg-gray-600
                active:scale-95
                transition-all duration-150
              "
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z"
                />
              </svg>
            </button>
          </div>

          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center mb-6">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            </div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                o
              </span>
            </div>
          </div>

          {/* Email Login Button */}
          <Button
            type="button"
            variant="secondary"
            size="lg"
            fullWidth
            onClick={handleEmailLogin}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                />
              </svg>
            }
            iconPosition="left"
          >
            Ingresar con Email
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PINLoginPage;
