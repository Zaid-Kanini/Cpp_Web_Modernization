import nodemailer from 'nodemailer';
import SMTPTransport from 'nodemailer/lib/smtp-transport';
import { env } from './env.config';
import { logger } from '../utils/logger';

// Email configuration for nodemailer
const transportOptions: SMTPTransport.Options = {
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
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 30000,
};

export const emailTransporter = nodemailer.createTransport(transportOptions);

// Verify email transporter asynchronously (non-blocking)
// This prevents app startup failure if SMTP server is temporarily unreachable
emailTransporter.verify((error: Error | null) => {
  if (error) {
    logger.warn('Email transporter verification failed - emails may not be sent', { error: error.message });
  } else {
    logger.info('Email transporter is ready');
  }
});

export const emailConfig = {
  from: env.SMTP_FROM,
  loginUrl: env.FRONTEND_URL || 'http://localhost:3000/login',
};
