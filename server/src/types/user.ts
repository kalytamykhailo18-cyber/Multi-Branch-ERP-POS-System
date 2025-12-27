// User types matching database schema
import { UUID, ISODateString, BaseEntity } from './common';
import { Role, RolePermissions } from './role';
import { Branch } from './branch';

// User entity matching users table
export interface User extends BaseEntity {
  employee_code: string | null;          // max 20 chars, unique
  email: string;                         // max 100 chars, unique
  password_hash: string;                 // max 255 chars (never exposed)
  first_name: string;                    // max 50 chars
  last_name: string;                     // max 50 chars
  phone: string | null;                  // max 50 chars
  role_id: UUID;
  primary_branch_id: UUID | null;

  // Authentication
  is_active: boolean;                    // default: true
  pin_code: string | null;               // max 6 chars (never exposed)
  last_login_at: ISODateString | null;
  failed_login_attempts: number;         // default: 0
  locked_until: ISODateString | null;

  // Preferences
  language: string;                      // default: 'es', max 10 chars
}

// User without sensitive data (for API responses)
export interface UserSafe extends Omit<User, 'password_hash' | 'pin_code'> {
  role?: Role;
  primary_branch?: Branch;
}

// User with full details including role and branches
export interface UserWithDetails extends UserSafe {
  role: Role;
  primary_branch: Branch | null;
  branches: Branch[];                    // All branches user can access
  permissions: RolePermissions;
}

// Create user DTO
export interface CreateUserRequest {
  employee_code?: string;
  email: string;
  password: string;                      // Plain password, will be hashed
  first_name: string;
  last_name: string;
  phone?: string;
  role_id: UUID;
  primary_branch_id?: UUID;
  pin_code?: string;
  language?: string;
  branch_ids?: UUID[];                   // Branches to assign
}

// Update user DTO
export interface UpdateUserRequest {
  employee_code?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  role_id?: UUID;
  primary_branch_id?: UUID | null;
  is_active?: boolean;
  language?: string;
  branch_ids?: UUID[];
}

// Change password DTO
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

// Set PIN DTO
export interface SetPinRequest {
  pin_code: string;                      // 4-6 digits
}

// User session entity matching user_sessions table
export interface UserSession {
  id: UUID;
  user_id: UUID;
  token_hash: string;                    // max 255 chars
  device_info: string | null;            // max 255 chars
  ip_address: string | null;             // INET type
  branch_id: UUID | null;
  expires_at: ISODateString;
  revoked_at: ISODateString | null;
  created_at: ISODateString;
}

// Login request DTO
export interface LoginRequest {
  email: string;
  password: string;
  branch_id?: UUID;
  device_info?: string;
}

// PIN login request (quick login at POS)
export interface PinLoginRequest {
  user_id: UUID;
  pin_code: string;
  branch_id: UUID;
}

// Login response
export interface LoginResponse {
  user: UserWithDetails;
  token: string;
  expires_at: ISODateString;
}

// Token payload for JWT
export interface TokenPayload {
  user_id: UUID;
  session_id: UUID;
  branch_id: UUID | null;
  role_name: string;
  iat: number;
  exp: number;
}
