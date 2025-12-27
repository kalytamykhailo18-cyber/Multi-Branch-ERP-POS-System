import { get, post } from './client';
import type {
  ApiResponse,
  User,
  Branch,
  RegisterSession,
  LoginCredentials,
  PINLoginCredentials,
} from '../../types';

interface LoginResponse {
  user: User;
  token: string;
  branches: Branch[];
}

interface PINLoginResponse {
  user: User;
  token: string;
  session: RegisterSession;
}

interface MeResponse {
  user: User;
  branches: Branch[];
}

export const authService = {
  /**
   * Login with email and password
   */
  login: (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    return post<LoginResponse>('/auth/login', credentials);
  },

  /**
   * Login with PIN (for POS cashiers)
   */
  loginWithPIN: (credentials: PINLoginCredentials): Promise<ApiResponse<PINLoginResponse>> => {
    return post<PINLoginResponse>('/auth/pin-login', credentials);
  },

  /**
   * Logout current session
   */
  logout: (): Promise<ApiResponse<null>> => {
    return post<null>('/auth/logout');
  },

  /**
   * Get current user info
   */
  me: (): Promise<ApiResponse<MeResponse>> => {
    return get<MeResponse>('/auth/me');
  },

  /**
   * Refresh access token
   */
  refreshToken: (): Promise<ApiResponse<{ token: string }>> => {
    return post<{ token: string }>('/auth/refresh');
  },

  /**
   * Change password
   */
  changePassword: (currentPassword: string, newPassword: string): Promise<ApiResponse<null>> => {
    return post<null>('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /**
   * Set user PIN
   */
  setPin: (pin: string): Promise<ApiResponse<null>> => {
    return post<null>('/auth/set-pin', { pin });
  },

  /**
   * Verify manager PIN for sensitive operations
   */
  verifyManagerPIN: (pin: string): Promise<ApiResponse<{ valid: boolean }>> => {
    return post<{ valid: boolean }>('/auth/verify-manager-pin', { pin });
  },
};

export default authService;
