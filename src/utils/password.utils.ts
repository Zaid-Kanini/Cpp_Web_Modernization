import argon2 from 'argon2';
import { logger } from './logger';

const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  timeCost: 3,
  memoryCost: 65536,
  parallelism: 1,
};

export async function hashPassword(plainPassword: string): Promise<string> {
  try {
    if (!plainPassword || typeof plainPassword !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    const hash = await argon2.hash(plainPassword, ARGON2_OPTIONS);
    logger.debug('Password hashed successfully');
    return hash;
  } catch (error) {
    logger.error('Password hashing failed', { error });
    throw new Error(
      `Failed to hash password: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export async function verifyPassword(
  plainPassword: string,
  hash: string
): Promise<boolean> {
  try {
    if (!plainPassword || typeof plainPassword !== 'string') {
      throw new Error('Password must be a non-empty string');
    }

    if (!hash || typeof hash !== 'string') {
      throw new Error('Hash must be a non-empty string');
    }

    const isValid = await argon2.verify(hash, plainPassword);
    logger.debug('Password verification completed', { isValid });
    return isValid;
  } catch (error) {
    logger.error('Password verification failed', { error });
    throw new Error(
      `Failed to verify password: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
