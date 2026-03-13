import { z } from 'zod';
import { isValidISODate, isDateInAllowedRange, isStartDateBeforeOrEqualEndDate } from '../utils/date.utils';

const alphabeticOnlyRegex = /^[A-Za-z\s]+$/;

const alphabeticStringSchema = z
  .string()
  .min(1, 'Field cannot be empty')
  .max(100, 'Field cannot exceed 100 characters')
  .regex(alphabeticOnlyRegex, 'Must contain only alphabetic characters and spaces');

const dateStringSchema = z
  .string()
  .refine(isValidISODate, 'Must be a valid ISO 8601 date format');

export const createScheduleSchema = z
  .object({
    technology: alphabeticStringSchema,
    start_date: dateStringSchema,
    end_date: dateStringSchema,
    venue: alphabeticStringSchema,
    number_of_participants: z.number().int().positive('Must be a positive integer'),
    month: alphabeticStringSchema.optional(),
    batch_id: z.number().int().positive('Must be a positive integer').optional(),
  })
  .refine(
    (data) => isStartDateBeforeOrEqualEndDate(data.start_date, data.end_date),
    {
      message: 'Start date must be before or equal to end date',
      path: ['start_date'],
    }
  )
  .refine(
    (data) => isDateInAllowedRange(data.start_date),
    {
      message: 'Start date must be within current year to +5 years',
      path: ['start_date'],
    }
  )
  .refine(
    (data) => isDateInAllowedRange(data.end_date),
    {
      message: 'End date must be within current year to +5 years',
      path: ['end_date'],
    }
  );

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

const versionSchema = z.number().int().positive({ message: 'Version must be a positive integer' });

export const updateScheduleSchema = z
  .object({
    version: versionSchema,
    technology: alphabeticStringSchema.optional(),
    start_date: dateStringSchema.optional(),
    end_date: dateStringSchema.optional(),
    venue: alphabeticStringSchema.optional(),
    number_of_participants: z.number().int().positive('Must be a positive integer').optional(),
    month: alphabeticStringSchema.optional(),
    status: z.enum(['ACTIVE', 'CANCELLED', 'COMPLETED']).optional(),
    batch_id: z.number().int().positive('Must be a positive integer').optional(),
  })
  .refine(
    (data) => {
      if (data.start_date && data.end_date) {
        return isStartDateBeforeOrEqualEndDate(data.start_date, data.end_date);
      }
      return true;
    },
    {
      message: 'Start date must be before or equal to end date',
      path: ['start_date'],
    }
  )
  .refine(
    (data) => {
      if (data.start_date) {
        return isDateInAllowedRange(data.start_date);
      }
      return true;
    },
    {
      message: 'Start date must be within current year to +5 years',
      path: ['start_date'],
    }
  )
  .refine(
    (data) => {
      if (data.end_date) {
        return isDateInAllowedRange(data.end_date);
      }
      return true;
    },
    {
      message: 'End date must be within current year to +5 years',
      path: ['end_date'],
    }
  );

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;
