# Training Schedule Management - Backend API

Express.js REST API with TypeScript for training schedule management system.

## Features

- ✅ Express.js 4.19+ with TypeScript
- ✅ OWASP security compliance (Helmet.js, CORS)
- ✅ Structured logging with correlation IDs
- ✅ Health check endpoints for orchestration
- ✅ API versioning (/api/v1/)
- ✅ Standardized error handling
- ✅ Environment-based configuration
- ✅ Graceful shutdown handling

## Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.19+
- **Language**: TypeScript 5.3+
- **Logging**: Winston
- **Security**: Helmet.js, CORS
- **Validation**: Zod (via @tsm/shared)

## Project Structure

```
packages/backend/
├── src/
│   ├── routes/          # API route definitions
│   │   ├── v1/          # API version 1 routes
│   │   ├── health.routes.ts
│   │   └── index.ts
│   ├── controllers/     # Request handlers
│   │   └── health.controller.ts
│   ├── services/        # Business logic
│   ├── middleware/      # Custom middleware
│   │   ├── cors.middleware.ts
│   │   ├── helmet.middleware.ts
│   │   ├── logger.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── version.middleware.ts
│   ├── utils/           # Utility functions
│   │   └── logger.ts
│   ├── config/          # Configuration
│   │   └── env.config.ts
│   ├── types/           # TypeScript types
│   │   └── express.d.ts
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server startup
├── logs/                # Log files (gitignored)
├── .env                 # Environment variables (gitignored)
├── .env.example         # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20 LTS or higher
- npm 7+ (for workspace support)

### Installation

```bash
# From repository root
npm install

# Or install backend only
npm install --workspace=@tsm/backend
```

### Configuration

1. Copy environment template:
   ```bash
   cd packages/backend
   cp .env.example .env
   ```

2. Update `.env` with your configuration

### Development

```bash
# Start development server with hot reload
npm run dev --workspace=@tsm/backend

# Build TypeScript to JavaScript
npm run build --workspace=@tsm/backend

# Start production server
npm run start --workspace=@tsm/backend

# Run tests
npm run test --workspace=@tsm/backend
```

## API Endpoints

### Health Checks (Unversioned)

- `GET /health` - Liveness probe
- `GET /ready` - Readiness probe

### API v1 (Versioned)

- `GET /api/v1/` - API information

Future endpoints (to be implemented):
- `/api/v1/auth` - Authentication
- `/api/v1/schedules` - Schedule management
- `/api/v1/allocations` - Trainer allocation
- `/api/v1/users` - User management
- `/api/v1/reports` - Reporting
- `/api/v1/audit-logs` - Audit logs

## Middleware Chain

1. **Helmet** - Security headers
2. **CORS** - Cross-origin resource sharing
3. **Body Parser** - JSON and URL-encoded parsing
4. **Logger** - Request logging with correlation IDs
5. **API Version** - Version header injection
6. **Routes** - Application routes
7. **404 Handler** - Not found handler
8. **Error Handler** - Centralized error handling

## Environment Variables

See `.env.example` for complete list. Required variables:

- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development, production, test)
- `CORS_ORIGIN` - Allowed CORS origins

## Security

- OWASP Top 10 compliance
- Helmet.js security headers
- CORS whitelisting
- Input validation (Zod)
- Correlation ID tracking
- Structured logging
- No sensitive data in error responses

## Testing

```bash
# Run all tests
npm run test --workspace=@tsm/backend

# Run tests in watch mode
npm run test:watch --workspace=@tsm/backend

# Run tests with coverage
npm run test:coverage --workspace=@tsm/backend
```

## Deployment

See deployment documentation in `.propel/context/docs/` for cloud deployment instructions.

## Contributing

1. Follow TypeScript strict mode
2. Maintain 80%+ test coverage
3. Use conventional commit messages
4. Ensure linting passes
5. Update documentation

## License

Proprietary - ABC Software Systems
