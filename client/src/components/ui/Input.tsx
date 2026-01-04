import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  animate?: boolean;
  animationType?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in';
  animationDuration?: 'very-fast' | 'fast' | 'normal' | 'light-slow' | 'slow';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = false,
      animate = false,
      animationType = 'fade-up',
      animationDuration = 'fast',
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'block w-full rounded-sm border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0';

    const stateStyles = error
      ? 'border-danger-500 focus:border-danger-500 focus:ring-danger-500/30'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/30 dark:border-gray-600 dark:focus:border-primary-500';

    const inputStyles = `${baseStyles} ${stateStyles} bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500`;

    const paddingStyles = leftIcon
      ? 'pl-10 pr-4'
      : rightIcon
        ? 'pl-4 pr-10'
        : 'px-4';

    const widthClass = fullWidth ? 'w-full' : '';
    const animationClass = animate ? `animate-${animationType} duration-${animationDuration}` : '';

    return (
      <div className={`${widthClass} ${animationClass} ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={`${inputStyles} ${paddingStyles} py-2.5`}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-danger-500 animate-fade-down duration-very-fast">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
