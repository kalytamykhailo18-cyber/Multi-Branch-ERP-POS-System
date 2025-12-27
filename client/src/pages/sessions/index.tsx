import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchSessions } from '../../store/slices/registersSlice';
import SessionsList from './SessionsList';
import SessionFilters from './SessionFilters';

const SessionsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { sessions, loading, error } = useSelector((state: RootState) => state.registers);

  const [filters, setFilters] = useState({
    branch_id: '',
    status: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 20
  });

  useEffect(() => {
    dispatch(fetchSessions(filters));
  }, [dispatch, filters]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters({ ...filters, ...newFilters, page: 1 });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cierres de Caja</h1>
      </div>

      <SessionFilters filters={filters} onFilterChange={handleFilterChange} />

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-gray-600 dark:text-gray-400">Cargando cierres...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-lg text-red-600 dark:text-red-400">Error: {error}</div>
        </div>
      ) : (
        <SessionsList
          sessions={sessions}
          // onPageChange={handlePageChange}
        />
      )}
    </div>
  );
};

export default SessionsPage;
