import { hashPassword, verifyPassword } from '../../utils/password.utils';
import {
  passwordComplexitySchema,
  validatePasswordComplexity,
} from '../../validators/password.validators';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password successfully', async () => {
      const plainPassword = 'MyP@ssw0rd!';
      const hash = await hashPassword(plainPassword);

      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should produce different hashes for the same password (salt randomness)', async () => {
      const plainPassword = 'MyP@ssw0rd!';
      const hash1 = await hashPassword(plainPassword);
      const hash2 = await hashPassword(plainPassword);

      expect(hash1).not.toBe(hash2);
    });

    it('should produce hash matching Argon2id pattern', async () => {
      const plainPassword = 'MyP@ssw0rd!';
      const hash = await hashPassword(plainPassword);

      const argon2idPattern = /^\$argon2id\$v=19\$m=65536,t=3,p=1\$/;
      expect(hash).toMatch(argon2idPattern);
    });

    it('should throw error for null password', async () => {
      await expect(hashPassword(null as any)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should throw error for undefined password', async () => {
      await expect(hashPassword(undefined as any)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should throw error for empty string password', async () => {
      await expect(hashPassword('')).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should throw error for non-string password', async () => {
      await expect(hashPassword(12345 as any)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should complete hashing within 500ms', async () => {
      const plainPassword = 'MyP@ssw0rd!';
      const startTime = Date.now();
      await hashPassword(plainPassword);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(500);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'MyP@ssw0rd!';
      const hash = await hashPassword(plainPassword);
      const isValid = await verifyPassword(plainPassword, hash);

      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const plainPassword = 'MyP@ssw0rd!';
      const wrongPassword = 'WrongP@ssw0rd!';
      const hash = await hashPassword(plainPassword);
      const isValid = await verifyPassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });

    it('should throw error for null password', async () => {
      const hash = await hashPassword('MyP@ssw0rd!');
      await expect(verifyPassword(null as any, hash)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should throw error for undefined password', async () => {
      const hash = await hashPassword('MyP@ssw0rd!');
      await expect(verifyPassword(undefined as any, hash)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should throw error for empty string password', async () => {
      const hash = await hashPassword('MyP@ssw0rd!');
      await expect(verifyPassword('', hash)).rejects.toThrow(
        'Password must be a non-empty string'
      );
    });

    it('should throw error for null hash', async () => {
      await expect(verifyPassword('MyP@ssw0rd!', null as any)).rejects.toThrow(
        'Hash must be a non-empty string'
      );
    });

    it('should throw error for undefined hash', async () => {
      await expect(
        verifyPassword('MyP@ssw0rd!', undefined as any)
      ).rejects.toThrow('Hash must be a non-empty string');
    });

    it('should throw error for empty string hash', async () => {
      await expect(verifyPassword('MyP@ssw0rd!', '')).rejects.toThrow(
        'Hash must be a non-empty string'
      );
    });
  });

  describe('Password Complexity Validation', () => {
    describe('passwordComplexitySchema', () => {
      it('should accept strong password with all requirements', () => {
        const result = passwordComplexitySchema.safeParse('MyP@ssw0rd!');
        expect(result.success).toBe(true);
      });

      it('should accept password with minimum 8 characters', () => {
        const result = passwordComplexitySchema.safeParse('Test@123');
        expect(result.success).toBe(true);
      });

      it('should reject password shorter than 8 characters', () => {
        const result = passwordComplexitySchema.safeParse('Test@1');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('at least 8 characters');
        }
      });

      it('should reject password without uppercase letter', () => {
        const result = passwordComplexitySchema.safeParse('myp@ssw0rd!');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('uppercase letter');
        }
      });

      it('should reject password without lowercase letter', () => {
        const result = passwordComplexitySchema.safeParse('MYP@SSW0RD!');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('lowercase letter');
        }
      });

      it('should reject password without digit', () => {
        const result = passwordComplexitySchema.safeParse('MyP@ssword!');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('digit');
        }
      });

      it('should reject password without special character', () => {
        const result = passwordComplexitySchema.safeParse('MyPassw0rd');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('special character');
        }
      });

      it('should reject weak password "password"', () => {
        const result = passwordComplexitySchema.safeParse('password');
        expect(result.success).toBe(false);
      });

      it('should accept various special characters', () => {
        const passwords = [
          'Test@123',
          'Test$123',
          'Test!123',
          'Test%123',
          'Test*123',
          'Test?123',
          'Test&123',
          'Test#123',
        ];

        passwords.forEach((password) => {
          const result = passwordComplexitySchema.safeParse(password);
          expect(result.success).toBe(true);
        });
      });
    });

    describe('validatePasswordComplexity', () => {
      it('should return success for valid password', () => {
        const result = validatePasswordComplexity('MyP@ssw0rd!');
        expect(result.success).toBe(true);
      });

      it('should return error for invalid password', () => {
        const result = validatePasswordComplexity('weak');
        expect(result.success).toBe(false);
      });

      it('should provide detailed error messages', () => {
        const result = validatePasswordComplexity('weak');
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Integration Tests', () => {
    it('should validate, hash, and verify a strong password', async () => {
      const plainPassword = 'MyP@ssw0rd!';

      const validationResult = validatePasswordComplexity(plainPassword);
      expect(validationResult.success).toBe(true);

      const hash = await hashPassword(plainPassword);
      expect(hash).toBeDefined();

      const isValid = await verifyPassword(plainPassword, hash);
      expect(isValid).toBe(true);
    });

    it('should reject weak password before hashing', () => {
      const weakPassword = 'password';

      const validationResult = validatePasswordComplexity(weakPassword);
      expect(validationResult.success).toBe(false);
    });
  });
});
