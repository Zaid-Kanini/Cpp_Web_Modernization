import express, { Application } from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { corsMiddleware } from './middleware/cors.middleware';
import { helmetMiddleware } from './middleware/helmet.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import { apiVersionMiddleware } from './middleware/version.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { swaggerUiServe, swaggerUiSetup } from './middleware/swagger.middleware';
import passport from './config/passport';
import routes from './routes';

dotenv.config();

const app: Application = express();

// Security middleware
app.use(helmetMiddleware);
app.use(corsMiddleware);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging middleware
app.use(loggerMiddleware as any);

// Initialize Passport.js
app.use(passport.initialize());

// Swagger UI documentation (only in development and staging)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUiServe, swaggerUiSetup);
  console.log('📚 Swagger UI available at /api-docs');
}

// API version header
app.use('/api/v1', apiVersionMiddleware('1.0.0') as any);

// Routes
app.use(routes);

// Error handling (must be last)
app.use(notFoundHandler as any);
app.use(errorHandler as any);

export default app;
