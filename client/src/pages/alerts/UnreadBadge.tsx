import React from 'react';

interface UnreadBadgeProps {
  count: number;
}

const UnreadBadge: React.FC<UnreadBadgeProps> = ({ count }) => {
  if (count === 0) return null;

  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-full">
      <span className="text-2xl font-bold text-red-700 dark:text-red-300">{count}</span>
      <span className="text-sm font-medium text-red-700 dark:text-red-300">Alertas sin leer</span>
    </div>
  );
};

export default UnreadBadge;
