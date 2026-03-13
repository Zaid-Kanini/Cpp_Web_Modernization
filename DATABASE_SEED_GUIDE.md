# Database Seeding Guide

## Overview
This guide explains how to populate your Training Schedule Management database with sample data.

## Sample Data Included

### Users (7 total)
**Administrators (2):**
- John Administrator (admin@trainingcenter.com)
- Sarah Manager (sarah.manager@trainingcenter.com)

**Faculty (5):**
- Robert Smith - Specializes in React, JavaScript, TypeScript, Node.js
- Emily Johnson - Specializes in Python, Django, FastAPI, Machine Learning
- Michael Chen - Specializes in Java, Spring Boot, Microservices, Kubernetes
- Lisa Williams - Specializes in React, Vue.js, Angular, CSS, UI/UX
- David Brown - Specializes in AWS, Azure, DevOps, Docker, CI/CD

### Training Schedules (5 total)
1. **Batch 1001** - React Advanced (March 15-26, 2026) - 25 participants
2. **Batch 1002** - Python & Django (March 20 - April 2, 2026) - 30 participants
3. **Batch 1003** - Java Spring Boot (April 5-18, 2026) - 20 participants
4. **Batch 1004** - AWS Cloud Fundamentals (April 10-21, 2026) - 40 participants (Online)
5. **Batch 1005** - Node.js Backend Development (Feb 15-28, 2026) - 22 participants (COMPLETED)

### Trainer Allocations (6 total)
- React Advanced: Robert Smith (ACCEPTED), Lisa Williams (ACCEPTED)
- Python & Django: Emily Johnson (ACCEPTED)
- Java Spring Boot: Michael Chen (PENDING)
- AWS Cloud: David Brown (ACCEPTED)
- Node.js: Robert Smith (ACCEPTED)

### Audit Logs (5 sample entries)
- Login events
- Schedule creation
- Allocation creation and acceptance

## How to Seed the Database

### Prerequisites
Ensure you have completed the Prisma setup:
```powershell
cd packages\backend
npm install
npm run prisma:generate
npm run prisma:migrate:dev --name init
```

### Method 1: Run Seed Script Directly
```powershell
npm run prisma:seed
```

### Method 2: Seed During Migration
The seed script will automatically run when you create a new migration:
```powershell
npm run prisma:migrate:dev
```

### Method 3: Reset Database and Seed
To completely reset the database and reseed:
```powershell
npm run prisma:migrate:reset
```
⚠️ **Warning**: This will delete ALL existing data!

## Expected Output

When seeding completes successfully, you should see:
```
🌱 Starting database seed...
🧹 Cleaning existing data...
👤 Creating admin users...
👨‍🏫 Creating faculty users...
📅 Creating training schedules...
🎯 Creating trainer allocations...
📝 Creating audit logs...
✅ Database seeded successfully!

📊 Summary:
   - Users: 7 (2 Admins, 5 Faculty)
   - Schedules: 5
   - Trainer Allocations: 6
   - Audit Logs: 5
```

## Verify Data with Prisma Studio

After seeding, you can view the data visually:
```powershell
npm run prisma:studio
```

This will open Prisma Studio at `http://localhost:5555` where you can:
- Browse all tables
- View relationships
- Edit data manually
- Run queries

## Important Notes

### Password Hashes
The seed script uses placeholder password hashes. In production:
1. Use proper password hashing (bcrypt, argon2)
2. Never commit real passwords
3. Update the seed script with properly hashed passwords

Example with bcrypt:
```typescript
import bcrypt from 'bcrypt';
const hashedPassword = await bcrypt.hash('YourPassword123!', 10);
```

### Data Cleanup
The seed script automatically cleans existing data before seeding. This ensures:
- No duplicate key violations
- Fresh, consistent data
- Proper relationship integrity

### Customizing Seed Data

To modify the seed data:
1. Edit `prisma/seed.ts`
2. Add/remove/modify users, schedules, or allocations
3. Run `npm run prisma:seed` to apply changes

### Troubleshooting

**Error: Cannot find module '@prisma/client'**
```powershell
npm run prisma:generate
```

**Error: Database connection failed**
- Verify `.env` file has correct DATABASE_URL
- Check network connectivity to Aiven PostgreSQL
- Ensure SSL mode is set to `require`

**Error: Foreign key constraint violation**
- The seed script handles dependencies automatically
- If you modify the script, ensure proper order:
  1. Users (no dependencies)
  2. Schedules (depends on Users)
  3. TrainerAllocations (depends on Schedules and Users)
  4. AuditLogs (depends on Users)

**Error: Unique constraint violation**
- Run `npm run prisma:migrate:reset` to clear existing data
- Or modify the seed script to use different email addresses/batch IDs

## Testing the Seeded Data

### Query Examples

After seeding, you can test queries in your application:

```typescript
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Get all active schedules
const schedules = await prisma.schedule.findMany({
  where: { is_active: true, status: 'ACTIVE' },
  include: { creator: true, trainer_allocations: true }
});

// Get faculty with their allocations
const faculty = await prisma.user.findMany({
  where: { role: 'FACULTY' },
  include: { allocations_received: true }
});

// Get audit trail for a specific user
const auditLogs = await prisma.auditLog.findMany({
  where: { user_id: 'some-user-id' },
  orderBy: { timestamp: 'desc' }
});
```

## Next Steps

After seeding:
1. Test API endpoints with seeded data
2. Verify authentication with seeded user credentials
3. Test schedule and allocation workflows
4. Review audit logs functionality
5. Build frontend components using real data

## Production Considerations

For production environments:
- **Do not use seed script** - it deletes all data
- Use migrations only: `npm run prisma:migrate:deploy`
- Create separate data import scripts for initial setup
- Use environment-specific seed data
- Implement proper backup before any data operations
