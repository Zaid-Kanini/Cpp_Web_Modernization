import { UserRole } from './auth.types';

export interface CreateUserRequest {
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  technology_specializations: string[];
}

export interface CreateUserResponse {
  user_id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  message: string;
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  technology_specializations?: string[];
  is_active?: boolean;
}

export interface UpdateUserResponse {
  user_id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  is_active: boolean;
  technology_specializations: string[];
  message: string;
}

export interface DeleteUserResponse {
  user_id: string;
  message: string;
  is_active: false;
}

export interface UserListItem {
  user_id: string;
  email: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface ListUsersResponse {
  users: UserListItem[];
  total: number;
}
