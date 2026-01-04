import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  animate?: boolean;
  animationType?: 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'zoom-out' | 'flip-up' | 'flip-down';
  animationDuration?: 'very-fast' | 'fast' | 'normal' | 'light-slow' | 'slow' | 'very-slow';
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  hover = false,
  animate = false,
  animationType = 'fade-up',
  animationDuration = 'normal',
  onClick,
  ...rest
}) => {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const shadows = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };

  const hoverStyles = hover
    ? 'cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200'
    : '';

  const animationClass = animate ? `animate-${animationType} duration-${animationDuration}` : '';

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-sm ${paddings[padding]} ${shadows[shadow]} ${hoverStyles} ${animationClass} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
