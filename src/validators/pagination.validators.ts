import { z } from 'zod';

const sortFieldEnum = z.enum(['technology', 'start_date', 'end_date', 'batch_id']);

const sortOrderEnum = z.enum(['asc', 'desc']);

const statusEnum = z.enum(['ACTIVE', 'CANCELLED', 'COMPLETED']);

export const paginationQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(25),
    sort_by: sortFieldEnum.default('start_date'),
    order: sortOrderEnum.default('desc'),
    technology: z.string().optional(),
    month: z.string().optional(),
    date_from: z.string().optional(),
    date_to: z.string().optional(),
    status: statusEnum.optional(),
    include_inactive: z.coerce.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.date_from && data.date_to) {
        return new Date(data.date_from) <= new Date(data.date_to);
      }
      return true;
    },
    {
      message: 'date_from must be before or equal to date_to',
      path: ['date_from'],
    }
  );

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
