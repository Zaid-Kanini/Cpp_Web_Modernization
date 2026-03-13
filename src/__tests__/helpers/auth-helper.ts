import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

export function generateAdminToken(userId: string, email: string): string {
  return jwt.sign(
    {
      user_id: userId,
      email,
      role: 'ADMIN',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

export function generateFacultyToken(userId: string, email: string): string {
  return jwt.sign(
    {
      user_id: userId,
      email,
      role: 'FACULTY',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}
