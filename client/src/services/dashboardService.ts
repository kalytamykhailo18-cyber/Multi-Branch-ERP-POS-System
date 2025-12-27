import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

export const getDashboardData = async (params: { start_date: string; end_date: string }) => {
  const response = await axios.get(`${API_URL}/reports/owner-dashboard`, {
    params,
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  });
  return response.data.data;
};
