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
      <div className="bg-white dark:bg-gray-800 rounded-sm shadow-md p-6 animate-fade-down duration-fast">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white animate-zoom-in duration-normal">Cierres de Caja</h1>
      </div>

      <div className="animate-fade-right duration-normal">
        <SessionFilters filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 animate-fade-up duration-fast">
          <div className="text-lg text-gray-600 dark:text-gray-400 animate-zoom-in duration-normal">Cargando cierres...</div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 animate-fade-up duration-fast">
          <div className="text-lg text-red-600 dark:text-red-400 animate-zoom-out duration-normal">Error: {error}</div>
        </div>
      ) : (
        <div className="animate-fade-up duration-light-slow">
          <SessionsList
            sessions={sessions}
            // onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default SessionsPage;
