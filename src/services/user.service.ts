import { hashPassword } from '../utils/password.utils';
import { generateTemporaryPassword } from '../utils/temp-password.utils';
import { logger } from '../utils/logger';
import { sendWelcomeEmail } from './email.service';
import {
  CreateUserRequest,
  CreateUserResponse,
  UpdateUserRequest,
  UpdateUserResponse,
  DeleteUserResponse,
  UserListItem,
  ListUsersResponse,
} from '../types/user.types';
import { prisma } from '../lib/prisma';

export async function createUser(
  data: CreateUserRequest,
  createdBy: string,
  correlationId: string
): Promise<{ user: CreateUserResponse; temporaryPassword: string }> {
  logger.info('createUser service called', { 
    data,
    technology_specializations: data.technology_specializations,
    tech_spec_length: data.technology_specializations?.length 
  });

  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  const temporaryPassword = generateTemporaryPassword();
  const passwordHash = await hashPassword(temporaryPassword);

  logger.info('About to create user in database', {
    email: data.email,
    technology_specializations: data.technology_specializations,
  });

  const user = await prisma.user.create({
    data: {
      email: data.email,
      password_hash: passwordHash,
      role: data.role,
      first_name: data.first_name,
      last_name: data.last_name,
      technology_specializations: data.technology_specializations,
      force_password_change: true,
      is_active: true,
    },
  });

  logger.info('User created in database', {
    user_id: user.user_id,
    technology_specializations: user.technology_specializations,
  });

  await prisma.auditLog.create({
    data: {
      user_id: createdBy,
      action_type: 'CREATE',
      entity_type: 'USER',
      entity_id: user.user_id,
      after_value: {
        email: user.email,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        technology_specializations: user.technology_specializations,
        is_active: user.is_active,
      },
      correlation_id: correlationId,
    },
  });

  logger.info('User created successfully', {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    correlation_id: correlationId,
  });

  sendWelcomeEmail({
    email: user.email,
    firstName: user.first_name,
    temporaryPassword,
  }).catch((error) => {
    logger.error('Email sending failed but user was created', {
      user_id: user.user_id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  });

  return {
    user: {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      message: 'User created successfully. Temporary password sent via email.',
    },
    temporaryPassword,
  };
}

export async function updateUser(
  userId: string,
  data: UpdateUserRequest,
  updatedBy: string,
  correlationId: string
): Promise<UpdateUserResponse> {
  const existingUser = await prisma.user.findUnique({
    where: { user_id: userId },
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  const beforeValue = {
    first_name: existingUser.first_name,
    last_name: existingUser.last_name,
    technology_specializations: existingUser.technology_specializations,
    is_active: existingUser.is_active,
  };

  const updatedUser = await prisma.user.update({
    where: { user_id: userId },
    data: {
      ...(data.first_name !== undefined && { first_name: data.first_name }),
      ...(data.last_name !== undefined && { last_name: data.last_name }),
      ...(data.technology_specializations !== undefined && {
        technology_specializations: data.technology_specializations,
      }),
      ...(data.is_active !== undefined && { is_active: data.is_active }),
    },
  });

  const afterValue = {
    first_name: updatedUser.first_name,
    last_name: updatedUser.last_name,
    technology_specializations: updatedUser.technology_specializations,
    is_active: updatedUser.is_active,
  };

  await prisma.auditLog.create({
    data: {
      user_id: updatedBy,
      action_type: 'UPDATE',
      entity_type: 'USER',
      entity_id: userId,
      before_value: beforeValue,
      after_value: afterValue,
      correlation_id: correlationId,
    },
  });

  logger.info('User updated successfully', {
    user_id: userId,
    correlation_id: correlationId,
  });

  return {
    user_id: updatedUser.user_id,
    email: updatedUser.email,
    role: updatedUser.role,
    first_name: updatedUser.first_name,
    last_name: updatedUser.last_name,
    is_active: updatedUser.is_active,
    technology_specializations: updatedUser.technology_specializations,
    message: 'User updated successfully',
  };
}

export async function deleteUser(
  userId: string,
  requestingUserId: string,
  correlationId: string
): Promise<DeleteUserResponse> {
  if (userId === requestingUserId) {
    throw new Error('Cannot delete your own account');
  }

  const existingUser = await prisma.user.findUnique({
    where: { user_id: userId },
  });

  if (!existingUser) {
    throw new Error('User not found');
  }

  const beforeValue = {
    is_active: existingUser.is_active,
  };

  const updatedUser = await prisma.user.update({
    where: { user_id: userId },
    data: { is_active: false },
  });

  const afterValue = {
    is_active: updatedUser.is_active,
  };

  await prisma.auditLog.create({
    data: {
      user_id: requestingUserId,
      action_type: 'DELETE',
      entity_type: 'USER',
      entity_id: userId,
      before_value: beforeValue,
      after_value: afterValue,
      correlation_id: correlationId,
    },
  });

  logger.info('User soft deleted successfully', {
    user_id: userId,
    correlation_id: correlationId,
  });

  return {
    user_id: updatedUser.user_id,
    message: 'User deactivated successfully',
    is_active: false,
  };
}

export async function listUsers(): Promise<ListUsersResponse> {
  const users = await prisma.user.findMany({
    select: {
      user_id: true,
      email: true,
      role: true,
      first_name: true,
      last_name: true,
      technology_specializations:true,
      is_active: true,
      created_at: true,
      updated_at: true,
    },
    orderBy: {
      created_at: 'desc',
    },
  });

  return {
    users: users as UserListItem[],
    total: users.length,
  };
}
