import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  padding = 'md',
  shadow = 'md',
  hover = false,
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

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-xl ${paddings[padding]} ${shadows[shadow]} ${hoverStyles} ${className}`}
      onClick={onClick}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
