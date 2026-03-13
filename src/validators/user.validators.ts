import { z } from 'zod';
import { UserRole } from '../types/auth.types';

export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: z.string().min(1, 'First name is required').max(100).optional(),
  first_name: z.string().min(1, 'First name is required').max(100).optional(),
  lastName: z.string().min(1, 'Last name is required').max(100).optional(),
  last_name: z.string().min(1, 'Last name is required').max(100).optional(),
  role: z.nativeEnum(UserRole, { errorMap: () => ({ message: 'Role must be ADMIN or FACULTY' }) }),
  technologySpecializations: z.array(z.string()).min(0).default([]).optional(),
  technology_specializations: z.array(z.string()).min(0).default([]).optional(),
}).transform((data) => ({
  email: data.email,
  first_name: data.first_name || data.firstName,
  last_name: data.last_name || data.lastName,
  role: data.role,
  technology_specializations: data.technology_specializations || data.technologySpecializations || [],
})).refine(
  (data) => data.first_name !== undefined,
  { message: 'First name is required', path: ['firstName'] }
).refine(
  (data) => data.last_name !== undefined,
  { message: 'Last name is required', path: ['lastName'] }
);

export const updateUserSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    first_name: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    last_name: z.string().min(1).max(100).optional(),
    technologySpecializations: z.array(z.string()).optional(),
    technology_specializations: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    is_active: z.boolean().optional(),
    email: z.any().optional(),
    role: z.any().optional(),
    password_hash: z.any().optional(),
    passwordHash: z.any().optional(),
  })
  .transform((data) => ({
    first_name: data.first_name || data.firstName,
    last_name: data.last_name || data.lastName,
    technology_specializations: data.technology_specializations || data.technologySpecializations,
    is_active: data.is_active !== undefined ? data.is_active : data.isActive,
    email: data.email,
    role: data.role,
    password_hash: data.password_hash || data.passwordHash,
  }))
  .refine(
    (data) => {
      if (data.email || data.role || data.password_hash) {
        return false;
      }
      return true;
    },
    {
      message: 'Cannot update immutable fields: email, role, password_hash',
    }
  );
