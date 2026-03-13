# Environment Variables Setup Guide

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Update the variables in `.env` with your values

3. Never commit `.env` to version control (already in .gitignore)

## Required Variables

### Server Configuration
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development, production, test)

### CORS Configuration
- `CORS_ORIGIN`: Comma-separated allowed origins
  - Development: `http://localhost:5173,http://localhost:3000`
  - Production: Specific domain(s), never use `*`

## Optional Variables

### Logging
- `LOG_LEVEL`: Logging level (debug, info, warn, error)
- `LOG_FILE_PATH`: Path for log files

## Future Variables

The following will be configured in later epics:
- Database configuration (EP-DATA)
- JWT secrets (EP-AUTH)
- Email service (EP-NOTIF)

## Security Best Practices

1. Never commit `.env` files to version control
2. Use strong, random secrets for JWT tokens (min 32 characters)
3. Never use wildcard (*) for CORS_ORIGIN in production
4. Rotate secrets regularly
5. Use different secrets for each environment
6. Store production secrets in secure vault (AWS Secrets Manager, Azure Key Vault)

## Validation

The application validates environment variables on startup and will fail fast if required variables are missing or invalid.
