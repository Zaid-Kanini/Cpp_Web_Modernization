import crypto from 'crypto';

const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SPECIAL_CHARS;

export function generateTemporaryPassword(): string {
  const length = 12;
  const password: string[] = [];

  password.push(UPPERCASE[crypto.randomInt(0, UPPERCASE.length)]);
  password.push(LOWERCASE[crypto.randomInt(0, LOWERCASE.length)]);
  password.push(DIGITS[crypto.randomInt(0, DIGITS.length)]);
  password.push(SPECIAL_CHARS[crypto.randomInt(0, SPECIAL_CHARS.length)]);

  for (let i = password.length; i < length; i++) {
    password.push(ALL_CHARS[crypto.randomInt(0, ALL_CHARS.length)]);
  }

  for (let i = password.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [password[i], password[j]] = [password[j], password[i]];
  }

  return password.join('');
}
