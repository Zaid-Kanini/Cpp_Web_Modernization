# API Versioning Strategy

## Overview

This API uses URL-based versioning with the format `/api/v{version}/`.

## Current Version

- **v1**: Current stable version

## Versioning Approach

### URL-Based Versioning
All business endpoints are prefixed with `/api/v1/`:
- `/api/v1/auth/login`
- `/api/v1/schedules`
- `/api/v1/allocations`

### Unversioned Endpoints
Health check endpoints remain unversioned for monitoring:
- `/health`
- `/ready`

## Version Header

All API responses include an `API-Version` header indicating the version:
```
API-Version: 1.0.0
```

## Breaking Changes

When introducing breaking changes:
1. Create new version directory: `src/routes/v2/`
2. Register new router: `app.use('/api/v2', v2Routes)`
3. Maintain v1 for backward compatibility
4. Deprecate v1 with sunset date
5. Document migration guide

## Non-Breaking Changes

Non-breaking changes can be added to existing version:
- New optional fields
- New endpoints
- Additional query parameters (optional)

## Deprecation Policy

1. Announce deprecation 6 months before sunset
2. Add `Deprecation` header to responses
3. Provide migration documentation
4. Maintain deprecated version for minimum 6 months
5. Remove deprecated version after sunset date

## Version Lifecycle

- **Active**: Current production version (v1)
- **Deprecated**: Announced for removal (none currently)
- **Sunset**: No longer supported (none currently)
