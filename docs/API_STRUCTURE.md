# API Structure Documentation

## Middleware Chain Order

The middleware chain executes in the following order:

1. **Helmet** (`helmetMiddleware`)
   - Sets security headers
   - Prevents common attacks (XSS, clickjacking, etc.)

2. **CORS** (`corsMiddleware`)
   - Validates origin against whitelist
   - Sets CORS headers

3. **Body Parsers**
   - `express.json()` - Parses JSON payloads
   - `express.urlencoded()` - Parses URL-encoded payloads

4. **Logger** (`loggerMiddleware`)
   - Generates/extracts correlation ID
   - Logs request details
   - Adds correlation ID to response header

5. **API Version** (`apiVersionMiddleware`)
   - Adds API-Version header to responses

6. **Routes**
   - Health routes (unversioned)
   - API v1 routes (versioned)

7. **404 Handler** (`notFoundHandler`)
   - Catches undefined routes
   - Returns standardized 404 response

8. **Error Handler** (`errorHandler`)
   - Catches all errors
   - Returns standardized error response
   - Logs errors with correlation ID

## Route Organization

### Unversioned Routes
- `/health` - Liveness probe
- `/ready` - Readiness probe

### Versioned Routes (v1)
- `/api/v1/auth` - Authentication endpoints
- `/api/v1/schedules` - Schedule CRUD operations
- `/api/v1/allocations` - Trainer allocation
- `/api/v1/users` - User management
- `/api/v1/reports` - Reporting and analytics
- `/api/v1/audit-logs` - Audit log viewing

## Error Response Format

All errors return standardized JSON:

```json
{
  "status": "error",
  "statusCode": 404,
  "message": "Resource not found",
  "correlationId": "uuid-v4",
  "stack": "..." // Only in development
}
```

## Logging Format

All logs include:
- `timestamp` - ISO 8601 timestamp
- `level` - Log level (debug, info, warn, error)
- `message` - Log message
- `correlationId` - Request correlation ID
- `method` - HTTP method
- `url` - Request URL
- `statusCode` - Response status code
- `duration` - Request duration in ms

## Security Headers

All responses include:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
- `Content-Security-Policy: ...`
- `X-Correlation-ID: uuid-v4`
- `API-Version: 1.0.0` (for /api/v1/* routes)
