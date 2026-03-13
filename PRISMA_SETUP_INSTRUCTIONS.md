# Prisma Setup Completion Instructions

## Overview
The Prisma schema has been created with all required models, enums, and relationships. Follow these steps to complete the setup.

## Files Created/Modified

### Created:
- `prisma/schema.prisma` - Complete database schema with 4 models and 5 enums
- `src/test-prisma.ts` - Type verification test file
- `.env.example` - Updated with database configuration template

### Modified:
- `package.json` - Added Prisma dependencies and scripts
- `../../.env` - Added Aiven PostgreSQL credentials

## Installation Steps

### 1. Install Dependencies
```powershell
# Navigate to the backend package directory
cd packages\backend

# Install Prisma dependencies
npm install
```

### 2. Validate Prisma Schema
```powershell
# Format the schema
npm run prisma:format

# Validate the schema
npm run prisma:validate
```

Expected output: `The schema is valid ✔`

### 3. Generate Prisma Client
```powershell
# Generate Prisma Client with TypeScript types
npm run prisma:generate
```

This will create the Prisma Client in `node_modules/.prisma/client`

### 4. Verify Prisma Client Types
```powershell
# Run the type verification test
npx ts-node src/test-prisma.ts
```

Expected output:
```
✓ All Prisma Client types available
✓ All enums accessible
✓ Prisma Client generated successfully
```

### 5. Create Initial Migration
```powershell
# Create the first migration to set up the database
npm run prisma:migrate:dev --name init
```

This will:
- Create the migration files
- Apply the migration to your Aiven PostgreSQL database
- Generate Prisma Client

### 6. (Optional) Open Prisma Studio
```powershell
# Launch Prisma Studio to view/edit database
npm run prisma:studio
```
Prisma Studio will open at `http://localhost:5555`

## Schema Summary

### Enums (5 total)
1. **Role**: ADMIN, FACULTY
2. **ScheduleStatus**: ACTIVE, CANCELLED, COMPLETED
3. **AllocationStatus**: PENDING, ACCEPTED, CANCELLED
4. **ActionType**: LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, CREATE, UPDATE, DELETE, ACCEPT, CANCEL
5. **EntityType**: USER, SCHEDULE, ALLOCATION

### Models (4 total)

#### 1. User (14 fields)
- Primary Key: `user_id` (UUID)
- Unique: `email`
- Relationships: created_schedules, allocations_made, allocations_received, audit_logs
- Security: password_hash, failed_login_attempts, account_locked_until

#### 2. Schedule (16 fields)
- Primary Key: `schedule_id` (UUID)
- Unique: `batch_id`
- Features: Optimistic locking (version), Soft delete (is_active)
- Relationships: creator, trainer_allocations

#### 3. TrainerAllocation (10 fields)
- Primary Key: `allocation_id` (UUID)
- Unique Constraint: [schedule_id, faculty_id]
- Relationships: schedule, faculty, allocator

#### 4. AuditLog (12 fields)
- Primary Key: `log_id` (UUID)
- Features: Immutable audit trail, JSONB storage
- Relationships: user

### Foreign Key Relationships (7 total)
1. Schedule.created_by → User.user_id (onDelete: Restrict)
2. TrainerAllocation.schedule_id → Schedule.schedule_id (onDelete: Cascade)
3. TrainerAllocation.faculty_id → User.user_id (onDelete: Restrict)
4. TrainerAllocation.allocated_by → User.user_id (onDelete: Restrict)
5. AuditLog.user_id → User.user_id (onDelete: Restrict)

### Indexes (15 total)
- User: email
- Schedule: technology, start_date, end_date, status, month, batch_id
- TrainerAllocation: schedule_id, faculty_id, allocation_status
- AuditLog: timestamp, user_id, action_type, entity_type, correlation_id

## Database Connection

The database is configured to use Aiven PostgreSQL:
- **Host**: pg-30058a3d-codearena001.e.aivencloud.com
- **Port**: 18347
- **Database**: defaultdb
- **SSL Mode**: require

Connection string is stored in `.env` file (not committed to git).

## Troubleshooting

### Issue: PowerShell execution policy error
**Solution**: Run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Issue: Cannot connect to database
**Solution**: 
- Verify `.env` file exists with correct DATABASE_URL
- Check network connectivity to Aiven cloud
- Verify SSL mode is set to `require`

### Issue: Prisma Client not found
**Solution**: Run `npm run prisma:generate` to generate the client

## Next Steps

After completing the setup:
1. Delete `src/test-prisma.ts` (optional - used only for validation)
2. Create database migrations with `npm run prisma:migrate:dev`
3. Implement Prisma Client integration in your application
4. Set up connection pooling and error handling

## Available Prisma Scripts

```json
"prisma:validate": "prisma validate"        // Validate schema
"prisma:format": "prisma format"            // Format schema
"prisma:generate": "prisma generate"        // Generate client
"prisma:studio": "prisma studio"            // Open GUI
"prisma:migrate:dev": "prisma migrate dev"  // Create/apply migrations
"prisma:migrate:deploy": "prisma migrate deploy"  // Deploy migrations
"prisma:migrate:reset": "prisma migrate reset"    // Reset database
```
