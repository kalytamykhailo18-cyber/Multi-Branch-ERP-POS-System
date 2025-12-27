import React from 'react';
import type { RegisterSession } from '../../types';

interface SessionsListProps {
  sessions: RegisterSession[];
  // onPageChange: (page: number) => void;
}

const SessionsList: React.FC<SessionsListProps> = ({ sessions }) => {
  const formatCurrency = (amount: number | null) => {
    if (amount === null) return '-';
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(amount);
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColors = (status: string) => {
    const colors: { [key: string]: { bg: string; text: string } } = {
      OPEN: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300' },
      CLOSED: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300' },
      CANCELLED: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300' }
    };
    return colors[status] || colors.CLOSED;
  };

  return (
    <div className="animate-fade-up duration-normal">
      {sessions && sessions.length > 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md overflow-hidden animate-zoom-in duration-light-slow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 animate-fade-down duration-fast">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider animate-fade-right duration-very-fast">#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider animate-fade-right duration-fast">Sucursal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider animate-fade-right duration-normal">Cajero Apertura</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider animate-fade-right duration-light-slow">Abierto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider animate-fade-right duration-slow">Cerrado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider animate-fade-right duration-very-slow">Estado</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider animate-fade-left duration-normal">Discrepancia</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {sessions.map((session) => {
                  const statusColors = getStatusColors(session.status);
                  const hasDiscrepancy = session.discrepancy_cash && Number(session.discrepancy_cash) !== 0;
                  return (
                    <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 animate-fade-up duration-normal">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white animate-flip-up duration-fast">{session.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white animate-fade-left duration-fast">{session.branch?.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white animate-fade-left duration-normal">
                        {session.cashier ? `${session.cashier.first_name} ${session.cashier.last_name}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white animate-fade-left duration-light-slow">{formatDateTime(session.opened_at)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white animate-fade-left duration-slow">
                        {session.closed_at ? formatDateTime(session.closed_at) : 'Abierto'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap animate-zoom-in duration-normal">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors.bg} ${statusColors.text} animate-flip-down duration-fast`}>
                          {session.status === 'OPEN' ? 'Abierto' : session.status === 'CLOSED' ? 'Cerrado' : 'Cancelado'}
                        </span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${hasDiscrepancy ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'} animate-fade-right duration-light-slow`}>
                        {formatCurrency(session.discrepancy_cash ? Number(session.discrepancy_cash) : 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-8 text-center animate-zoom-out duration-normal">
          <p className="text-gray-600 dark:text-gray-400 animate-fade-up duration-light-slow">No hay cierres de caja</p>
        </div>
      )}
    </div>
  );
};

export default SessionsList;
