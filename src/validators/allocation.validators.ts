import { z } from 'zod';

export const createAllocationSchema = z.object({
  faculty_id: z.string().uuid('Faculty ID must be a valid UUID'),
  schedule_ids: z
    .array(z.string().uuid('Each schedule ID must be a valid UUID'))
    .min(1, 'At least one schedule ID is required')
    .max(50, 'Cannot allocate more than 50 schedules at once'),
});

export type CreateAllocationInput = z.infer<typeof createAllocationSchema>;
