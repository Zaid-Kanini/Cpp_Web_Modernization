import { Role } from '@prisma/client';

export { Role as UserRole };

export interface JwtPayload {
  user_id: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: {
    user_id: string;
    email: string;
    role: Role;
    first_name: string;
    last_name: string;
  };
  message: string;
}
