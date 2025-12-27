import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiResponse>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // Try to refresh token
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });

          const { token } = response.data.data;
          localStorage.setItem('token', token);

          // Retry original request
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }

    // Format error response
    const errorResponse: ApiResponse = {
      success: false,
      data: null,
      error: error.response?.data?.error || error.message || 'An error occurred',
    };

    return Promise.reject(errorResponse);
  }
);

// Generic request methods
export const get = async <T>(url: string, params?: Record<string, unknown>): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.get<ApiResponse<T>>(url, { params });
    return response.data;
  } catch (error) {
    if ((error as ApiResponse).success === false) {
      return error as ApiResponse<T>;
    }
    throw error;
  }
};

export const post = async <T>(url: string, data?: unknown, config?: Record<string, unknown>): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.post<ApiResponse<T>>(url, data, config);
    return response.data;
  } catch (error) {
    if ((error as ApiResponse).success === false) {
      return error as ApiResponse<T>;
    }
    throw error;
  }
};

export const put = async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.put<ApiResponse<T>>(url, data);
    return response.data;
  } catch (error) {
    if ((error as ApiResponse).success === false) {
      return error as ApiResponse<T>;
    }
    throw error;
  }
};

export const patch = async <T>(url: string, data?: unknown): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.patch<ApiResponse<T>>(url, data);
    return response.data;
  } catch (error) {
    if ((error as ApiResponse).success === false) {
      return error as ApiResponse<T>;
    }
    throw error;
  }
};

export const del = async <T>(url: string): Promise<ApiResponse<T>> => {
  try {
    const response = await apiClient.delete<ApiResponse<T>>(url);
    return response.data;
  } catch (error) {
    if ((error as ApiResponse).success === false) {
      return error as ApiResponse<T>;
    }
    throw error;
  }
};

export default apiClient;
