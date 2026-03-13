import nodemailer from 'nodemailer';
import { env } from './env.config';
import { logger } from '../utils/logger';

// Email configuration for nodemailer
export const emailTransporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2',
  },
  requireTLS: true,
});

emailTransporter.verify((error: Error | null) => {
  if (error) {
    logger.warn('Email transporter verification failed', { error: error.message });
  } else {
    logger.info('Email transporter is ready');
  }
});

export const emailConfig = {
  from: env.SMTP_FROM,
  loginUrl: env.FRONTEND_URL || 'http://localhost:3000/login',
};
