import React from 'react';
import { Card, Button } from '../../components/ui';

interface NoActiveSessionCardProps {
  onNavigateToSessions: () => void;
}

const NoActiveSessionCard: React.FC<NoActiveSessionCardProps> = ({ onNavigateToSessions }) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-warning-100 dark:bg-warning-900/20 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-warning-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          No hay sesión activa
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Debes abrir una sesión de caja antes de realizar ventas.
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={onNavigateToSessions}
        >
          Ir a Sesiones
        </Button>
      </Card>
    </div>
  );
};

export default NoActiveSessionCard;
