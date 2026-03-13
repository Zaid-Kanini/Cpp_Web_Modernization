import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

interface Config {
  port: number;
  nodeEnv: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isTest: boolean;
  corsOrigin: string;
  logLevel: string;
  logFilePath: string;
}

interface Env {
  PORT: number;
  NODE_ENV: string;
  CORS_ORIGIN: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  SMTP_FROM: string;
  FRONTEND_URL: string;
}

const getEnvVarOptional = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

export const config: Config = {
  port: parseInt(getEnvVarOptional('PORT', '3000'), 10),
  nodeEnv: getEnvVarOptional('NODE_ENV', 'development'),
  isDevelopment: getEnvVarOptional('NODE_ENV', 'development') === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  corsOrigin: getEnvVarOptional('CORS_ORIGIN', 'http://localhost:5173'),
  logLevel: getEnvVarOptional('LOG_LEVEL', 'debug'),
  logFilePath: getEnvVarOptional('LOG_FILE_PATH', 'logs/'),
};

export const env: Env = {
  PORT: parseInt(getEnvVarOptional('PORT', '3000'), 10),
  NODE_ENV: getEnvVarOptional('NODE_ENV', 'development'),
  CORS_ORIGIN: getEnvVarOptional('CORS_ORIGIN', 'http://localhost:5173'),
  SMTP_HOST: getEnvVarOptional('SMTP_HOST', 'smtp.gmail.com'),
  SMTP_PORT: parseInt(getEnvVarOptional('SMTP_PORT', '587'), 10),
  SMTP_USER: getEnvVarOptional('SMTP_USER', ''),
  SMTP_PASS: getEnvVarOptional('SMTP_PASS', ''),
  SMTP_FROM: getEnvVarOptional('SMTP_FROM', 'noreply@tsm.com'),
  FRONTEND_URL: getEnvVarOptional('FRONTEND_URL', 'http://localhost:5173'),
};

export const validateConfig = (): void => {
  const requiredVars = ['PORT', 'NODE_ENV', 'CORS_ORIGIN'];

  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missingVars.join(', ')}\n` +
        'Please copy .env.example to .env and configure the required variables.'
    );
  }

  if (config.isProduction && config.corsOrigin.includes('*')) {
    throw new Error(
      'CORS_ORIGIN cannot contain wildcard (*) in production environment'
    );
  }

  console.log('✓ Environment configuration validated successfully');
};
